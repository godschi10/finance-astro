// Crypto-profit engine — TS port of inc/crypto-profit.php (P2P-aware,
// naira-denominated). Tested against the PHP vectors.
export interface CryptoProfit {
  invest: number;
  buy_rate: number;
  sell_rate: number;
  coins: number;
  sell_gross: number;
  sell_net: number;
  profit: number;
  roi: number;
  buy_fee_ngn: number;
  sell_fee_ngn: number;
  flat_ngn: number;
  fees_ngn: number;
  price_gap: number;
  break_even_rate: number;
}

export function cryptoProfit(
  invest: number,
  buyRate: number,
  sellRate: number,
  buyFee = 0,
  sellFee = 0,
  flatNgn = 0,
): CryptoProfit {
  invest = Math.max(0, invest);
  buyRate = Math.max(0, buyRate);
  sellRate = Math.max(0, sellRate);
  buyFee = Math.max(0, buyFee);
  sellFee = Math.max(0, sellFee);
  flatNgn = Math.max(0, flatNgn);

  if (invest <= 0 || buyRate <= 0 || sellRate <= 0) {
    return {
      invest, buy_rate: buyRate, sell_rate: sellRate,
      coins: 0, sell_gross: 0, sell_net: 0,
      profit: 0, roi: 0, buy_fee_ngn: 0, sell_fee_ngn: 0,
      flat_ngn: flatNgn, fees_ngn: 0, price_gap: 0, break_even_rate: 0,
    };
  }

  const buyFeeNgn = invest * buyFee;
  const coins = Math.max(0, (invest - buyFeeNgn - flatNgn) / buyRate);
  const sellGross = coins * sellRate;
  const sellFeeNgn = sellGross * sellFee;
  const sellNet = sellGross - sellFeeNgn;
  const profit = sellNet - invest;
  const roi = invest > 0 ? profit / invest : 0;
  const feesNgn = buyFeeNgn + flatNgn + sellFeeNgn;
  const priceGap = coins * (sellRate - buyRate);
  const breakEven = coins > 0 && 1 - sellFee > 0 ? invest / (coins * (1 - sellFee)) : 0;

  return {
    invest, buy_rate: buyRate, sell_rate: sellRate,
    coins, sell_gross: sellGross, sell_net: sellNet,
    profit, roi, buy_fee_ngn: buyFeeNgn, sell_fee_ngn: sellFeeNgn,
    flat_ngn: flatNgn, fees_ngn: feesNgn, price_gap: priceGap, break_even_rate: breakEven,
  };
}

export interface CryptoUsdt {
  usdt: number;
  rate: number;
  ngn: number;
  ok: boolean;
}

/** USDT → naira helper (PHP reads the live FX engine; TS takes the rate). */
export function cryptoUsdt(usdtPrice: number, ngnPerUsd: number, ok = true): CryptoUsdt {
  usdtPrice = Math.max(0, usdtPrice);
  return { usdt: usdtPrice, rate: ngnPerUsd, ngn: usdtPrice * ngnPerUsd, ok };
}

/** Seeded worked example (mirrors gwill_crypto_profit_seed()). */
export const CRYPTO_SEED = { invest: 200000, buy_rate: 1500, sell_rate: 1800, buy_fee: 0.01, sell_fee: 0.01, flat_ngn: 0 };
