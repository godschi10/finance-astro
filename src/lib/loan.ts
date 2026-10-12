// Loan-repayment engine — TS port of inc/loan-repayment.php.
// Rate AS QUOTED by the lender; reports the REAL effective APR.
// Numerically tested against the PHP original (vectors.json).
//
// S3a (v0.7.60) — TWO engine behaviours, both fifth-audit P1-2:
//
//   1. UPFRONT FEE (the optional 6th parameter, default 0). Lenders deduct a
//      fee before disbursing, so the honest APR solves on the amount actually
//      RECEIVED (net disbursement = amount × (1 − fee%)), while the repayment
//      stream stays contract-sized (installment/total/interest keep their
//      existing, fee-free meanings — the fee is a fee, not interest). A fee
//      that eats the whole loan (net ≤ 0) has no APR to solve, and the engine
//      says so with apr: NaN rather than a confident 0% — the page's existing
//      !Number.isFinite guard turns that into the honest "Out of range".
//      Acceptance (fifth audit Appendix A, A3 loanFeeApr): ₦100k/30d/1%-day +
//      5% fee → APR 4442.97% (receive ₦95,000) · flat 5%/mo ×3 + 5% fee →
//      220.65%. Both now GATED in vectors-check.mjs.
//
//   2. DAY→MONTH ROUNDING: days ÷ 30.4 rounded to the NEAREST month (minimum
//      1), replacing ceil(days/30). The old round-UP rule billed a 31-day
//      flat loan as TWO months — ₦10,000 interest where the calendar month is
//      ₦5,000 (the fifth audit's worked example; a cited checker case pins
//      the corrected ₦5,000 in vectors-check.mjs, verified 11 Oct 2026).
//      Oracle safety, enumerated before the change: every gated loanApr
//      vector is a 30-day or month tenor — 30/30.4 → 1, the PHP parity
//      loan_flat_days 90d → 3 either way, and month tenors never round. No
//      parity vector covers a 31-day flat loan, so no divergence entry.

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
  upfrontFeePct = 0,
): LoanRepayment {
  amount = Math.max(0, amount);
  tenor = Math.max(1, Math.trunc(tenor));
  const rate = Math.max(0, ratePct) / 100;
  const m: LoanMode = mode === "reducing" ? "reducing" : mode === "daily" ? "daily" : "flat";

  /* S3a item 2 (P1-2): days ÷ 30.4, nearest month, minimum 1. A calendar
     month is 30.4 days, and 31 days is ONE of them, not two. */
  const months = tenorUnit === "months" ? tenor : Math.max(1, Math.round(tenor / 30.4));
  const days = tenorUnit === "days" ? tenor : tenor * 30;

  /* S3a item 1 (P1-2): the fee is deducted before disbursement, so the APR
     solves on what the borrower actually receives. No fee entered (the
     default, and every pre-S3a call): the basis stays `amount` byte-for-byte,
     which keeps the PHP parity vectors and the no-fee zero-loan paths
     (amount 0 → apr 0) exactly as they were. */
  const feeFrac = Math.max(0, upfrontFeePct) / 100;
  const aprBase = feeFrac > 0 ? amount * (1 - feeFrac) : amount;
  /* A fee at or above the loan leaves nothing to solve against: no APR
     exists. NaN (not 0) so the page's finite-guard refuses the figure. */
  const aprUnsolvable = feeFrac > 0 && aprBase <= 0;

  if (m === "daily") {
    const interest = amount * rate * days;
    const repay = amount + interest;
    const dailyEff = aprBase > 0 && days > 0 ? Math.pow(repay / aprBase, 1 / days) - 1 : 0;
    const apr = aprUnsolvable ? NaN : Math.pow(1 + dailyEff, 365) - 1;
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
    const apr = aprUnsolvable ? NaN : loanEffectiveApr(aprBase, installment, months, 12);
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
  const apr = aprUnsolvable ? NaN : loanEffectiveApr(aprBase, installment, months, 12);
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
