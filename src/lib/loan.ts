// Loan-repayment engine — TS port of inc/loan-repayment.php.
// Rate AS QUOTED by the lender; reports the REAL effective APR.
// Numerically tested against the PHP original (vectors.json).

export type LoanMode = "flat" | "daily" | "reducing";
export type TenorUnit = "days" | "months";

/** Solve the effective per-period rate from an annuity, then annualize. */
export function loanEffectiveApr(
  principal: number,
  installment: number,
  n: number,
  periodsPerYear: number,
): number {
  if (installment <= 0 || n < 1 || principal <= 0) return 0;
  const f = (i: number): number =>
    (installment * (1 - Math.pow(1 + i, -n))) / i - principal;
  let lo = 0;
  let hi = 1.5;
  if (f(hi) < 0) hi = 10;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  const i = (lo + hi) / 2;
  return Math.pow(1 + i, periodsPerYear) - 1;
}

export interface LoanRepayment {
  amount: number;
  tenor: number;
  tenor_unit: "days" | "months";
  mode: LoanMode;
  rate: number;
  installment: number;
  period: string;
  total: number;
  interest: number;
  apr: number;
  monthly_equiv: number;
}

export function loanRepayment(
  amount: number,
  tenor: number,
  tenorUnit: TenorUnit | string,
  ratePct: number,
  mode: LoanMode | string,
): LoanRepayment {
  amount = Math.max(0, amount);
  tenor = Math.max(1, Math.trunc(tenor));
  const rate = Math.max(0, ratePct) / 100;
  const m: LoanMode = mode === "reducing" ? "reducing" : mode === "daily" ? "daily" : "flat";

  const months = tenorUnit === "months" ? tenor : Math.ceil(tenor / 30);
  const days = tenorUnit === "days" ? tenor : tenor * 30;

  if (m === "daily") {
    const interest = amount * rate * days;
    const repay = amount + interest;
    const dailyEff = amount > 0 && days > 0 ? Math.pow(repay / amount, 1 / days) - 1 : 0;
    const apr = Math.pow(1 + dailyEff, 365) - 1;
    return {
      amount, tenor, tenor_unit: "days", mode: "daily", rate,
      installment: repay,
      period: "one repayment after the term",
      total: repay, interest, apr,
      monthly_equiv: months > 0 ? repay / months : repay,
    };
  }

  if (m === "flat") {
    const installment = amount / months + amount * rate;
    const apr = loanEffectiveApr(amount, installment, months, 12);
    const total = installment * months;
    return {
      amount, tenor, tenor_unit: "months", mode: "flat", rate,
      installment,
      period: "per month",
      total, interest: total - amount, apr,
      monthly_equiv: installment,
    };
  }

  const monthlyRate = rate / 12;
  const installment =
    monthlyRate <= 0 ? amount / months : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const apr = loanEffectiveApr(amount, installment, months, 12);
  const total = installment * months;
  return {
    amount, tenor, tenor_unit: "months", mode: "reducing", rate,
    installment,
    period: "per month",
    total, interest: total - amount, apr,
    monthly_equiv: installment,
  };
}

/** Seeded worked example (mirrors the PHP template seed). */
export const LOAN_SEED = { amount: 100000, tenor: 30, tenor_unit: "days" as const, rate: 1.0, mode: "daily" as const };
