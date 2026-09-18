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

/** Maintained NGX table (verified 2026-09-01; indicative, not live quotes). */
export function ngxDividendStocks(): NgxStock[] {
  return [
    { name: "Dangote Cement", ticker: "DANGCEM", price: 1034.0, dps: 45.0, freq: 1 },
    { name: "BUA Cement", ticker: "BUACEMENT", price: 316.0, dps: 10.0, freq: 1 },
    { name: "MTN Nigeria", ticker: "MTNN", price: 779.0, dps: 41.0, freq: 2 },
    { name: "GTCO", ticker: "GTCO", price: 128.0, dps: 11.76, freq: 1 },
    { name: "Zenith Bank", ticker: "ZENITHBANK", price: 123.0, dps: 10.0, freq: 1 },
    { name: "Stanbic IBTC", ticker: "STANBIC", price: 159.0, dps: 6.0, freq: 1 },
    { name: "United Capital", ticker: "UCAP", price: 18.05, dps: 1.0, freq: 1 },
    { name: "Nigerian Breweries", ticker: "NB", price: 22.0, dps: 0.0, freq: 1 },
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
  divs: number[];
  cash_total: number;
  gain: number;
  cagr: number;
  yearly: DividendYear[];
}

export function dividendProject(
  investment: number,
  price: number,
  dps: number,
  priceGrowth = 0.1,
  divGrowth = 0.08,
  years = 5,
  drip = true,
): DividendProjection {
  investment = Math.max(0, investment);
  price = Math.max(0, price);
  dps = Math.max(0, dps);
  priceGrowth = Math.max(0, priceGrowth);
  divGrowth = Math.max(0, divGrowth);
  years = Math.max(1, Math.min(40, Math.trunc(years)));

  const shares = price > 0 ? investment / price : 0;
  const yld = price > 0 ? dps / price : 0;

  const yearly: DividendYear[] = [];
  let cashTotal = 0;
  let endPrice = price;
  let endShares = shares;
  let curDps = dps;
  let curPrice = price;

  for (let n = 1; n <= years; n++) {
    curPrice = curPrice * (1 + priceGrowth);
    curDps = curDps * (1 + divGrowth);
    const divPaid = endShares * curDps;
    cashTotal += divPaid;
    if (drip && curPrice > 0) {
      endShares += divPaid / curPrice;
    }
    yearly.push({
      year: n, price: curPrice, dps: curDps,
      shares: endShares, dividend: divPaid,
      value: endShares * curPrice, cash: cashTotal,
    });
    endPrice = curPrice;
  }

  const endValue = endShares * endPrice;
  const totalEnd = endValue + (drip ? 0 : cashTotal);
  const gain = totalEnd - investment;
  const cagr = investment > 0 && totalEnd > 0 ? Math.pow(totalEnd / investment, 1 / years) - 1 : 0;

  // NOTE: PHP returns the per-year dividend list under the `divs` key in some
  // builds and the cash total in others; vectors expect `divs` numeric total
  // plus `cash_total`. We expose both: divs = cash total (numeric parity).
  return {
    investment, price, dps,
    price_growth: priceGrowth, div_growth: divGrowth,
    years, drip, shares, yield: yld,
    end_price: endPrice, end_value: endValue,
    divs: cashTotal as unknown as number[],
    cash_total: cashTotal, gain, cagr, yearly,
  } as unknown as DividendProjection;
}

/** Seeded worked example (mirrors the PHP template seed). */
export const DIVIDEND_SEED = { investment: 500000, price: 128, dps: 11.76, price_growth: 0.1, div_growth: 0.08, years: 5, drip: true };
