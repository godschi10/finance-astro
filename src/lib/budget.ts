// 50/30/20 budget engine — TS port of inc/budget-503020.php.

export interface Budget503020 {
  income: number;
  needs: number;
  wants: number;
  savings: number;
  else: number;
  needs_pct: number;
  wants_pct: number;
  savings_pct: number;
}

export function budget503020(
  monthlyIncome: number,
  needsPct = 0.5,
  wantsPct = 0.3,
  savingsPct = 0.2,
): Budget503020 {
  const income = Math.max(0, monthlyIncome);
  needsPct = Math.max(0, needsPct);
  wantsPct = Math.max(0, wantsPct);
  savingsPct = Math.max(0, savingsPct);
  const needs = income * needsPct;
  const wants = income * wantsPct;
  const savings = income * savingsPct;
  return {
    income,
    needs,
    wants,
    savings,
    else: Math.max(0, income - needs - wants - savings),
    needs_pct: needsPct,
    wants_pct: wantsPct,
    savings_pct: savingsPct,
  };
}

export interface BudgetCompare extends Budget503020 {
  needs_spent: number;
  wants_spent: number;
  savings_put: number;
  needs_remaining: number;
  wants_remaining: number;
  savings_remaining: number;
  total_remaining: number;
}

/** Budget checker: plan vs actual spend per bucket. */
export function budget503020Compare(
  monthlyIncome: number,
  needsPct = 0.5,
  wantsPct = 0.3,
  savingsPct = 0.2,
  needsSpend = 0,
  wantsSpend = 0,
  savingsPut = 0,
): BudgetCompare {
  const plan = budget503020(monthlyIncome, needsPct, wantsPct, savingsPct);
  const needsSpent = Math.max(0, needsSpend);
  const wantsSpent = Math.max(0, wantsSpend);
  const savingsPutC = Math.max(0, savingsPut);
  const needsRemaining = plan.needs - needsSpent;
  const wantsRemaining = plan.wants - wantsSpent;
  const savingsRemaining = plan.savings - savingsPutC;
  return {
    ...plan,
    needs_spent: needsSpent,
    wants_spent: wantsSpent,
    savings_put: savingsPutC,
    needs_remaining: needsRemaining,
    wants_remaining: wantsRemaining,
    savings_remaining: savingsRemaining,
    total_remaining: needsRemaining + wantsRemaining + savingsRemaining,
  };
}

export function budget503020SeedIncome(): number {
  return 250000;
}
