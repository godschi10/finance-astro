// Money-transfer comparator engine — TS port of inc/transfer-comparator.php.
// Nigeria-first "who actually gets you the most naira" tool: fee AND rate
// markup combined per provider, sorted best-first. The fee table is
// MAINTAINED (verified September 2026); the FX base is injected by the
// caller (live rates client-side, snapshot at build time). Tested vs PHP vectors.
import { fxCurrencies, FX_DEFAULT_NGN_USD } from "./fx";
import { maintainedVerified } from "./maintained";

export interface TransferProvider {
  id: string;
  name: string;
  flat: number;
  pct: number;
  markup: number;
  note: string;
}

/** Maintained provider fee + markup model, per direction. */
export function transferProviders(direction: string): TransferProvider[] {
  if ("to-nigeria" === direction) {
    return [
      { id: "wise", name: "Wise", flat: 1.99, pct: 0.0033, markup: 0.0, note: "Mid-market rate, fee shown upfront" },
      { id: "remitly", name: "Remitly", flat: 1.99, pct: 0.005, markup: 0.015, note: "Low fee but a rate markup" },
      { id: "western-union", name: "Western Union", flat: 1.99, pct: 0.005, markup: 0.02, note: "Cash pickup; rate margin is wider" },
      { id: "worldremit", name: "WorldRemit", flat: 1.99, pct: 0.005, markup: 0.018, note: "Mobile-wallet payout; rate markup" },
      { id: "lemfi", name: "LemFi", flat: 0.0, pct: 0.0, markup: 0.01, note: "Zero explicit fee; margin in the rate" },
    ];
  }
  return [
    { id: "wise", name: "Wise", flat: 0.0, pct: 0.006, markup: 0.0, note: "Mid-market rate on the dollar you receive" },
    { id: "bank", name: "Bank (domiciliary)", flat: 0.0, pct: 0.01, markup: 0.025, note: "Official channel; documentation needed" },
    { id: "p2p", name: "Peer-to-peer (parallel)", flat: 0.0, pct: 0.0, markup: -0.045, note: "Best naira value, but platform discipline required" },
  ];
}

export interface TransferRow {
  id: string;
  name: string;
  fee: number;
  applied: number;
  rate: number;
  markup: number;
  received: number;
  note: string;
}

export interface FxInput {
  rates: Record<string, number>;
  as_of: string;
  ok: boolean;
}

export interface TransferQuote {
  ok: boolean;
  as_of: string;
  direction: string;
  origin: string;
  dest: string;
  mid: number;
  usd_ngn: number;
  sources: Record<string, number>;
  dests: Record<string, number>;
  rows: TransferRow[];
}

/** Per-provider actual-received quote. Mirrors gwill_transfer_quote(). */
export function transferQuote(
  amount: number,
  direction: string,
  source = "USD",
  dest = "USD",
  fx: FxInput = { rates: {}, as_of: "", ok: false },
): TransferQuote {
  amount = Math.max(0, amount);
  direction = "from-nigeria" === direction ? "from-nigeria" : "to-nigeria";
  const currencies = fxCurrencies();
  source = String(source).toUpperCase().trim();
  if (!source || !(source in currencies)) source = "USD";
  dest = String(dest).toUpperCase().trim();
  if (!dest || !(dest in currencies)) dest = "USD";

  // Direction + NGN-face invariant: exactly one side must be NGN.
  if ("NGN" === source) {
    direction = "from-nigeria";
    if ("NGN" === dest) dest = "USD";
  } else {
    direction = "to-nigeria";
    if ("NGN" !== dest) dest = "NGN";
  }

  const rates = fx.rates && typeof fx.rates === "object" ? fx.rates : {};
  const asOf = fx.as_of ? String(fx.as_of) : "";
  const ok = !fx.ok ? false : true;
  const usdNgn = rates["NGN"] && rates["NGN"] > 0 ? Number(rates["NGN"]) : FX_DEFAULT_NGN_USD;

  let sourceUsd = 1.0;
  if ("USD" !== source && rates[source] && rates[source] > 0) {
    sourceUsd = 1.0 / Number(rates[source]);
  }

  let mid: number;
  let origin: string;
  if ("to-nigeria" === direction) {
    mid = sourceUsd * usdNgn;
    origin = source;
    dest = "NGN";
  } else {
    const destUsd = ("USD" === dest || !rates[dest] || rates[dest] <= 0) ? 1.0 : 1.0 / Number(rates[dest]);
    mid = (1.0 / usdNgn) * destUsd;
    origin = "NGN";
  }

  const rows: TransferRow[] = transferProviders(direction).map((p) => {
    const flat = ("to-nigeria" === direction && "USD" !== source) ? p.flat * sourceUsd : p.flat;
    const fee = flat + p.pct * amount;
    const applied = Math.max(0, amount - fee);
    const effRate = mid * (1 - p.markup);
    return {
      id: p.id, name: p.name, fee, applied,
      rate: effRate, markup: p.markup, received: applied * effRate, note: p.note,
    };
  });
  rows.sort((a, b) => b.received - a.received);

  const srcRate = (c: string): number =>
    rates[c] && rates[c] > 0 ? (1 / Number(rates[c])) * usdNgn : usdNgn;
  const dstRate = (c: string): number =>
    rates[c] && rates[c] > 0 ? (1 / Number(rates[c])) / usdNgn : 1.0 / usdNgn;

  return {
    ok, as_of: asOf, direction, origin, dest, mid, usd_ngn: usdNgn,
    sources: { USD: usdNgn, GBP: srcRate("GBP"), EUR: srcRate("EUR"), CAD: srcRate("CAD") },
    dests: { USD: 1.0 / usdNgn, GBP: dstRate("GBP"), EUR: dstRate("EUR"), CAD: dstRate("CAD") },
    rows,
  };
}

/** Seeded worked example (mirrors gwill_transfer_seed()). */
export const TRANSFER_SEED = { amount: 100000, source: "NGN", dest: "USD" };

/** Freshness stamp for the maintained fee model (never a live quote). */
export function transferVerified(): string {
  return maintainedVerified();
}
