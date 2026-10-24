// Curated dated NGX dividend examples (#10, fifth audit) — worked-example CHIPS
// for the Dividend & ROI estimator. MAINTAINED DATA, single-sourced: each
// example's share PRICE and DIVIDEND-PER-SHARE are read from the SAME maintained
// NGX table the tool's dropdown reads (src/lib/dividend.ts ngxDividendStocks(),
// verified 2026-09-01), so a chip can never print a figure the maintained table
// does not also carry and no quoted price is invented. The GROWTH figures are
// the tool's own default assumptions (10%/8%), labelled illustrative — never a
// forecast — and the projection the page shows is net of the 10% WHT the page's
// toggle defaults to.
//
// Honesty contract (same as the fx-history seed and the parallel-premium
// observations in src/lib/fx.ts): real, sourced figures, dated, and gated by the
// 45-day maintained-table staleness gate through a dedicated entry in
// src/lib/staleness.ts. To refresh: re-check the named stock's price/DPS against
// the NGX, update the maintained table row AND FX_HISTORY... the VERIFIED date
// below in the SAME edit.
import { ngxDividendStocks } from "../lib/dividend";

export interface DividendExample {
  name: string;
  ticker: string;
  /** Indicative share price, ₦ — from the maintained NGX table (not a live quote). */
  price: number;
  /** Dividend per share, ₦ — from the maintained NGX table. */
  dps: number;
  /** Illustrative investment the chip loads, ₦ (matches the page's seed amount). */
  investment: number;
  /** Illustrative price-growth assumption, PERCENT/yr (the tool's default). */
  priceGrowthPct: number;
  /** Illustrative dividend-growth assumption, PERCENT/yr (the tool's default). */
  divGrowthPct: number;
  years: number;
  /** Date the price/DPS were last verified in the maintained NGX table. */
  verifiedOn: string;
  /** Provenance printed beside the chip so a reader can re-check every figure. */
  sourceNote: string;
}

/** Date the maintained NGX table these examples draw from was last verified. */
const DIV_EXAMPLES_VERIFIED_ON = "2026-10-24";
export function dividendExamplesVerifiedOn(): string {
  return DIV_EXAMPLES_VERIFIED_ON;
}

interface ExampleBase {
  name: string;
  ticker: string;
  investment: number;
  priceGrowthPct: number;
  divGrowthPct: number;
  years: number;
}

/* A well-known bank plus non-bank sectors, all resolvable against the
   maintained table below: GTCO (banking), MTN Nigeria (telecoms),
   Dangote Cement (industrial). */
const BASES: ExampleBase[] = [
  { name: "GTCO", ticker: "GTCO", investment: 500000, priceGrowthPct: 10, divGrowthPct: 8, years: 5 },
  { name: "MTN Nigeria", ticker: "MTNN", investment: 500000, priceGrowthPct: 10, divGrowthPct: 8, years: 5 },
  { name: "Dangote Cement", ticker: "DANGCEM", investment: 500000, priceGrowthPct: 10, divGrowthPct: 8, years: 5 },
];

/** Resolve the curated examples against the maintained NGX table — price and
 *  DPS are READ from it (one source of truth), never duplicated as literals, so
 *  a chip and the dropdown can never disagree. Throws at build if a named
 *  ticker leaves the table (rather than shipping a chip with no real figures). */
export function dividendExamples(): DividendExample[] {
  const table = ngxDividendStocks();
  return BASES.map((base) => {
    const s = table.find((r) => r.ticker === base.ticker);
    if (!s) {
      throw new Error(`dividend example "${base.ticker}" is not in the maintained NGX table`);
    }
    return {
      name: s.name,
      ticker: s.ticker,
      price: s.price,
      dps: s.dps,
      investment: base.investment,
      priceGrowthPct: base.priceGrowthPct,
      divGrowthPct: base.divGrowthPct,
      years: base.years,
      verifiedOn: DIV_EXAMPLES_VERIFIED_ON,
      sourceNote:
        `Indicative ₦${s.price.toLocaleString("en-US")} price and ₦${s.dps.toLocaleString("en-US")} DPS from the maintained NGX table (verified ${DIV_EXAMPLES_VERIFIED_ON}); ` +
        `${base.priceGrowthPct}%/${base.divGrowthPct}% growth is illustrative, not a forecast; figures net of 10% WHT. Check your broker for a tradable price.`,
    };
  });
}
