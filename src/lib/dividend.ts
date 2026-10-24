// Dividend/ROI estimator — TS port of inc/dividend-estimator.php (NGX,
// forward DRIP/cash total-return projection). Tested vs PHP vectors.
import { MAINTAINED_VERIFIED } from "./maintained";

export interface NgxStock {
  name: string;
  ticker: string;
  price: number;
  dps: number;
  freq: number;
}

/** Maintained NGX table (verified 2026-10-01; indicative, not live quotes). */
export function ngxDividendStocks(): NgxStock[] {
  return [
    { name: "Dangote Cement", ticker: "DANGCEM", price: 1010.0, dps: 45.0, freq: 1 },
    { name: "BUA Cement", ticker: "BUACEMENT", price: 297.0, dps: 10.0, freq: 1 },
    { name: "MTN Nigeria", ticker: "MTNN", price: 825.0, dps: 41.0, freq: 2 },
    { name: "GTCO", ticker: "GTCO", price: 122.0, dps: 11.76, freq: 1 },
    { name: "Zenith Bank", ticker: "ZENITHBANK", price: 121.50, dps: 8.75, freq: 1 },
    { name: "Stanbic IBTC", ticker: "STANBIC", price: 160.0, dps: 6.0, freq: 1 },
    { name: "United Capital", ticker: "UCAP", price: 16.55, dps: 1.0, freq: 1 },
    { name: "Nigerian Breweries", ticker: "NB", price: 75.0, dps: 0.0, freq: 1 },
  ];
}

export function dividendVerified(): string {
  return MAINTAINED_VERIFIED;
}

export interface DividendYear {
  year: number;
  price: number;
  dps: number;
  shares: number;
  dividend: number;
  value: number;
  cash: number;
}

export interface DividendProjection {
  investment: number;
  price: number;
  dps: number;
  price_growth: number;
  div_growth: number;
  years: number;
  drip: boolean;
  shares: number;
  yield: number;
  end_price: number;
  end_value: number;
  divs: number;
  cash_total: number;
  gain: number;
  cagr: number;
  yearly: DividendYear[];
}

/* S3a (v0.7.60) — the WHT parameter (fifth audit P1-1 [Certain]): dividends on
   Nigerian shares carry 10% withholding tax, final for most resident
   individuals. `whtPct` is in PERCENT (10 = 10%), defaults to 0 at the
   function level — so every pre-S3a call site (the PHP parity vectors, the
   v1 independent oracle's gated gross row, the appendix-a cross-note) calls
   without the parameter and stays green byte-for-byte. With a WHT set, each
   year's dividend is taxed BEFORE it is received: the net is what the
   shareholder pockets in cash mode and what DRIP actually reinvests, so
   cash_total (and every downstream gain/CAGR) is NET of WHT. `yield` stays
   the GROSS starting yield on the entered dps — the page nets it for display
   when its WHT toggle is on. Acceptance (fifth audit Appendix A, A4
   dividendWht): GTCO seed, 10% WHT → end 1,173,810 · net dividends 310,727 ·
   CAGR 18.61% — now GATED in vectors-check.mjs (the checker calls with
   whtPct=10). */
export function dividendProject(
  investment: number,
  price: number,
  dps: number,
  priceGrowth = 0.1,
  divGrowth = 0.08,
  years = 5,
  drip = true,
  whtPct = 0,
): DividendProjection {
  investment = Math.max(0, investment);
  price = Math.max(0, price);
  dps = Math.max(0, dps);
  priceGrowth = Math.max(0, priceGrowth);
  divGrowth = Math.max(0, divGrowth);
  years = Math.max(1, Math.min(40, Math.trunc(years)));
  const wht = Math.min(Math.max(0, whtPct), 100) / 100;

  const shares = price > 0 ? investment / price : 0;
  const initialYield = price > 0 ? dps / price : 0;

  const yearly: DividendYear[] = [];
  let cashTotal = 0;
  let endPrice = price;
  let endShares = shares;
  let curDps = dps;
  let curPrice = price;

  for (let n = 1; n <= years; n++) {
    curPrice = curPrice * (1 + priceGrowth);
    curDps = curDps * (1 + divGrowth);
    const divGross = endShares * curDps;
    /* WHT comes off before the dividend lands: what reinvests (DRIP) and
       what accumulates as received cash is the NET figure. */
    const divNet = divGross * (1 - wht);
    cashTotal += divNet;
    if (drip && curPrice > 0) {
      endShares += divNet / curPrice;
    }
    yearly.push({
      year: n, price: curPrice, dps: curDps,
      shares: endShares, dividend: divNet,
      value: endShares * curPrice, cash: cashTotal,
    });
    endPrice = curPrice;
  }

  const endValue = endShares * endPrice;
  const totalEnd = endValue + (drip ? 0 : cashTotal);
  const gain = totalEnd - investment;
  const cagr = investment > 0 && totalEnd > 0 ? Math.pow(totalEnd / investment, 1 / years) - 1 : 0;

  return {
    investment, price, dps,
    price_growth: priceGrowth, div_growth: divGrowth,
    years, drip, shares, yield: initialYield,
    end_price: endPrice, end_value: endValue,
    divs: cashTotal,
    cash_total: cashTotal, gain, cagr, yearly,
  };
}

/** Seeded worked example (mirrors the PHP template seed). */
export const DIVIDEND_SEED = { investment: 500000, price: 128, dps: 11.76, price_growth: 0.1, div_growth: 0.08, years: 5, drip: true };
