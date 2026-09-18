// Naira-value (inflation/depreciation) engine — TS port of inc/naira-value.php.
// Value-first purchasing-power view. Tested vs PHP vectors.
import { savingsCalculate } from "./savings";

export interface NairaValue {
  value: number;
  future: number;
  lost_fraction: number;
  future_rate: number;
}

export function nairaValue(
  value: number,
  inflationRate: number,
  years: number,
  months = 0,
): NairaValue {
  value = Math.max(0, value);
  inflationRate = Math.max(0, inflationRate);
  years = Math.max(1, Math.trunc(years));
  months = Math.max(0, Math.min(11, Math.trunc(months)));
  const t = years + months / 12;
  const future = value * Math.pow(1 + inflationRate, t);
  const lost = value > 0 ? 1 - value / future : 0;
  return { value, future, lost_fraction: lost, future_rate: future / (value > 0 ? value : 1) };
}

export interface NairaHistoryRow {
  year: number;
  amount: number;
  multiplier: number;
  lost: number;
}

export function nairaValueHistory(
  value: number,
  inflationRate: number,
  years: number,
): NairaHistoryRow[] {
  value = Math.max(0, value);
  inflationRate = Math.max(0, inflationRate);
  years = Math.max(1, Math.trunc(years));
  const rows: NairaHistoryRow[] = [];
  for (let n = 1; n <= years; n++) {
    const mult = Math.pow(1 + inflationRate, n);
    rows.push({ year: n, amount: value * mult, multiplier: mult, lost: 1 - 1 / mult });
  }
  return rows;
}

export interface NairaPv {
  future: number;
  pv: number;
  discount_rate: number;
}

export function nairaValuePv(
  future: number,
  inflationRate: number,
  years: number,
  months = 0,
): NairaPv {
  future = Math.max(0, future);
  inflationRate = Math.max(0, inflationRate);
  years = Math.max(1, Math.trunc(years));
  months = Math.max(0, Math.min(11, Math.trunc(months)));
  const t = years + months / 12;
  const pv = future / Math.pow(1 + inflationRate, t);
  return { future, pv, discount_rate: pv / (future > 0 ? future : 1) };
}

export interface NairaSave {
  target: number;
  real_target: number;
  nominal_monthly: number;
  real_monthly: number;
  gap_monthly: number;
}

export function nairaValueSave(
  target: number,
  current: number,
  annualRate: number,
  inflationRate: number,
  years: number,
  months = 0,
  compound = "monthly",
): NairaSave {
  target = Math.max(0, target);
  current = Math.max(0, current);
  annualRate = Math.max(0, annualRate);
  inflationRate = Math.max(0, inflationRate);
  years = Math.max(1, Math.trunc(years));
  months = Math.max(0, Math.min(11, Math.trunc(months)));
  const totalMonths = years * 12 + months;
  const realTarget = target * Math.pow(1 + inflationRate, years + months / 12);
  const nominal = savingsCalculate(target, current, annualRate, totalMonths, compound);
  const real = savingsCalculate(realTarget, current, annualRate, totalMonths, compound);
  return {
    target,
    real_target: realTarget,
    nominal_monthly: nominal.monthly,
    real_monthly: real.monthly,
    gap_monthly: Math.max(0, real.monthly - nominal.monthly),
  };
}

export function nairaValueSeed(): { value: number; infl: number; years: number; months: number } {
  return { value: 1000000, infl: 0.2, years: 5, months: 0 };
}
