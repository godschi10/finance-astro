// FX currency-converter engine — TS port of inc/currency.php.
// USD-anchored rates (units per 1 USD). Numerically tested vs PHP vectors.
import { formatGrouped } from "./format";

export interface FxCurrency {
  symbol: string;
  name: string;
}

export function fxCurrencies(): Record<string, FxCurrency> {
  return {
    USD: { symbol: "$", name: "US Dollar" },
    NGN: { symbol: "₦", name: "Nigerian Naira" },
    GBP: { symbol: "£", name: "British Pound" },
    EUR: { symbol: "€", name: "Euro" },
    CAD: { symbol: "CA$", name: "Canadian Dollar" },
    AED: { symbol: "د.إ", name: "UAE Dirham" },
    SAR: { symbol: "﷼", name: "Saudi Riyal" },
    GHS: { symbol: "GH₵", name: "Ghanaian Cedi" },
    XOF: { symbol: "CFA", name: "West African CFA Franc" },
    XAF: { symbol: "FCFA", name: "Central African CFA Franc" },
    CNY: { symbol: "¥", name: "Chinese Yuan" },
    JPY: { symbol: "¥", name: "Japanese Yen" },
    INR: { symbol: "₹", name: "Indian Rupee" },
    KES: { symbol: "KSh", name: "Kenyan Shilling" },
    EGP: { symbol: "E£", name: "Egyptian Pound" },
    ZAR: { symbol: "R", name: "South African Rand" },
  };
}

/** Acceptable safety fallback (NGN per 1 USD) when the feed is unreachable. */
export const FX_DEFAULT_NGN_USD = 1340.0;

/* ── PARALLEL-MARKET SPREAD (P1-7, fifth audit) ─────────────────────────────
 * Until v0.7.58 this was a bare `1.045` — an undated constant with no source,
 * sitting at/above the TOP of the observed range and described in page copy as
 * "roughly 4.5% above official". The audit's finding was that the figure is a
 * RANGE that moves, and a site that prints one undated number for it is
 * asserting a precision it does not have.
 *
 * WHAT IS RECORDED HERE, EXACTLY:
 *   · the OBSERVED RANGE — 2.2% to 4.4% — and the observations behind it, as
 *     dated points (see FX_PARALLEL_OBSERVATIONS). These are the figures the
 *     audit recorded from published street quotes, Jul–Oct 2026.
 *   · a POINT ESTIMATE used for arithmetic only — the midpoint of that range,
 *     3.3%. It is OUR estimate, not a quoted rate, and nothing on the site
 *     presents it as one: every surface that prints it also prints the range
 *     and the date.
 *
 * DATES AND SOURCES ARE NOT INVENTED. This follows the savings-rate
 * provenance precedent (src/lib/savings-rate.ts): the observations carry the
 * dates the audit recorded and NO deep-link `sourceUrl`, because a street-quote
 * page nobody opened is an invented citation. Re-check the range, update
 * FX_PARALLEL_OBSERVATIONS and FX_PARALLEL_SPREAD_RANGE in the same edit, and
 * the date printed on every page moves with it.
 *
 * The point estimate MOVED 4.5% → 3.3% because the old value sat above every
 * observation on record. Every page that consumes this constant was swept in
 * the same batch; see CHANGELOG 0.7.58. */
export interface FxParallelObservation {
  /** ISO date the premium was observed. */
  date: string;
  /** Observed premium over the official rate, as a fraction (0.023 = 2.3%). */
  premium: number;
}

/** Observed street premium over the official rate, as recorded Jul–Oct 2026. */
export const FX_PARALLEL_OBSERVATIONS: FxParallelObservation[] = [
  { date: "2026-10-07", premium: 0.023 },
  { date: "2026-10-08", premium: 0.044 },
  { date: "2026-10-11", premium: 0.029 },
];

/** The observed range the premium moved across, Jul–Oct 2026. */
export const FX_PARALLEL_SPREAD_RANGE = { low: 0.022, high: 0.044 };

/** Date the range above was last re-checked — printed on every consumer. */
export const FX_PARALLEL_VERIFIED_ON = "2026-10-11";

/** Point estimate for arithmetic ONLY: the midpoint of the observed range. */
export const FX_PARALLEL_SPREAD_POINT = 0.033;

/** Parallel-market spread multiplier (official × this). D4 (v0.7.55): the old
 * comment promised WP admin-tunability that does not exist in the Astro port —
 * this is a BUILD-TIME constant; changing it means editing this file and
 * rebuilding, nothing else reads it. */
export const FX_PARALLEL_SPREAD = 1 + FX_PARALLEL_SPREAD_POINT;

export function fxParallelSpread(): number {
  return FX_PARALLEL_SPREAD;
}

/** Human-readable range for copy: "2.2%–4.4%, observed Jul–Oct 2026 (checked
 *  11 Oct 2026)". Every surface that prints the point estimate calls this, so a
 *  bare undated premium can never be printed again. */
export function fxParallelRangeLabel(): string {
  const pct = (v: number) => (v * 100).toFixed(1);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [y, m, d] = FX_PARALLEL_VERIFIED_ON.split("-");
  const stamp = `${Number(d)} ${months[Number(m) - 1]} ${y}`;
  return `${pct(FX_PARALLEL_SPREAD_RANGE.low)}%–${pct(FX_PARALLEL_SPREAD_RANGE.high)}%, observed Jul–Oct 2026 (checked ${stamp})`;
}

/** Honest parallel-market estimate: official NGN/USD × spread. Always "estimated". */
export function fxParallelNgnUsd(ngnPerUsd: number, spread = 0): number {
  if (spread <= 0) spread = fxParallelSpread();
  return ngnPerUsd * spread;
}

export interface FxRates {
  ok: boolean;
  rates: Record<string, number>;
  as_of: string;
  cached: boolean;
}

/** Coherent all-currencies fallback table (matches the PHP fallback exactly). */
export function fxFallbackRates(): FxRates {
  const ngn = FX_DEFAULT_NGN_USD;
  return {
    ok: false,
    rates: {
      USD: 1.0,
      NGN: ngn,
      GBP: 0.736,
      EUR: 0.858,
      CAD: 1.36,
      AED: 3.6725,
      SAR: 3.75,
      GHS: 16.2,
      XOF: 565.0,
      XAF: 565.0,
      CNY: 6.74,
      JPY: 159.9,
      INR: 95.5,
      KES: 129.5,
      EGP: 54.0,
      ZAR: 18.2,
    },
    as_of: "",
    cached: false,
  };
}

/** Convert amount from base to quote using USD-anchored rates. */
export function fxConvert(
  amount: number,
  base: string,
  quote: string,
  rates: Record<string, number>,
): number {
  base = base.toUpperCase();
  quote = quote.toUpperCase();
  // Positivity (not <= 0): a corrupt/zero feed rate, or NaN which slips
  // past every <= comparison, degrades to 0 here — never NaN into the UI.
  if (!(base in rates) || !(quote in rates) || !(rates[base] > 0) || !(rates[quote] > 0)) return 0;
  if (base === quote) return amount;
  return amount * (rates[quote] / rates[base]);
}

/** Mirrors gwill_fx_number(): rounded + grouped. */
export function fxNumber(n: number, dec = 2): string {
  return formatGrouped(n, dec);
}

/** Live fetch for the client (open.er-api.com, 8s abort, throws on failure). */
export async function fxFetchLive(signal?: AbortSignal): Promise<FxRates> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal });
  if (!res.ok) throw new Error("fx feed " + res.status);
  const body = await res.json();
  if (!body || body.result !== "success" || !body.rates) throw new Error("fx feed bad body");
  const rates: Record<string, number> = {};
  for (const k of Object.keys(body.rates)) {
    // Bare Number() lets NaN/zero/negative feed values through; keep only
    // finite-positive rates so converts degrade to 0, never NaN/negative.
    const v = Number(body.rates[k]);
    if (Number.isFinite(v) && v > 0) rates[k] = v;
  }
  if (!(rates["NGN"] > 0)) throw new Error("fx feed bad NGN");
  return { ok: true, rates, as_of: String(body.time_last_update_utc ?? ""), cached: false };
}
