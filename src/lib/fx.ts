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

/** Parallel-market spread multiplier (official × this). Admin-tunable in WP. */
export const FX_PARALLEL_SPREAD = 1.045;

export function fxParallelSpread(): number {
  return FX_PARALLEL_SPREAD;
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
  if (!(base in rates) || !(quote in rates) || rates[base] <= 0) return 0;
  if (base === quote) return amount;
  return amount * (rates[quote] / rates[base]);
}

/** Mirrors gwill_fx_number(): rounded + grouped. */
export function fxNumber(n: number, dec = 2): string {
  return formatGrouped(n, dec);
}

/** Honest freshness label — fallback figures are never called "live". */
export function fxFreshnessLabel(fx: FxRates): string {
  if (!fx.ok) return "estimated, market feed unavailable";
  if (fx.as_of) return fx.as_of;
  return "live";
}

/** Live fetch for the client (open.er-api.com, 8s abort, throws on failure). */
export async function fxFetchLive(signal?: AbortSignal): Promise<FxRates> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal });
  if (!res.ok) throw new Error("fx feed " + res.status);
  const body = await res.json();
  if (!body || body.result !== "success" || !body.rates) throw new Error("fx feed bad body");
  const rates: Record<string, number> = {};
  for (const k of Object.keys(body.rates)) rates[k] = Number(body.rates[k]);
  return { ok: true, rates, as_of: String(body.time_last_update_utc ?? ""), cached: false };
}
