// Inflation-adjusted savings-goal engine — TS port of inc/inflation-savings.php.
// Inflates the target, solves monthly under both views; the gap is the insight.
import { savingsCalculate, depositsPerMonth } from "./savings";

export interface InflationGoal {
  target: number;
  real_target: number;
  nominal_monthly: number;
  real_monthly: number;
  gap_monthly: number;
  current: number;
  annual_rate: number;
  inflation_rate: number;
  years: number;
  months: number;
  compound: string;
  deposit_freq: string;
}

export function inflationAdjustedGoal(
  target: number,
  current: number,
  annualRate: number,
  inflationRate: number,
  years: number,
  months = 0,
  compound = "monthly",
  depositFreq = "monthly",
): InflationGoal {
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
  let nominalMonthly = nominal.monthly;
  let realMonthly = real.monthly;
  if (depositFreq && depositFreq !== "monthly") {
    const perMonth = depositsPerMonth(depositFreq);
    if (perMonth > 0) {
      nominalMonthly = nominal.monthly / perMonth;
      realMonthly = real.monthly / perMonth;
    }
  }
  return {
    target,
    real_target: realTarget,
    nominal_monthly: nominalMonthly,
    real_monthly: realMonthly,
    gap_monthly: Math.max(0, realMonthly - nominalMonthly),
    current,
    annual_rate: annualRate,
    inflation_rate: inflationRate,
    years,
    months,
    compound,
    deposit_freq: depositFreq,
  };
}
