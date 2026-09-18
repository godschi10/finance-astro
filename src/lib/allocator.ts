// Budget allocator engine — TS port of inc/budget-allocator.php.
// 50/30/20 split with the needs slice drilled into Nigerian naira buckets.

export interface NeedsBucket {
  id: string;
  label: string;
  of_needs: number;
}

export function budgetAllocatorBuckets(): NeedsBucket[] {
  return [
    { id: "rent", label: "Rent / housing", of_needs: 0.4 },
    { id: "food", label: "Food & groceries", of_needs: 0.25 },
    { id: "transport", label: "Transport & fuel", of_needs: 0.15 },
    { id: "data", label: "Data, airtime & internet", of_needs: 0.1 },
    { id: "utilities", label: "Power, water & bills", of_needs: 0.07 },
  ];
}

export interface AllocatedBucket {
  id: string;
  label: string;
  share: number;
  amount: number;
}

export interface BudgetAllocator {
  income: number;
  needs_pct: number;
  wants_pct: number;
  savings_pct: number;
  needs: number;
  wants: number;
  savings: number;
  else: number;
  buckets: AllocatedBucket[];
}

export function budgetAllocator(
  income: number,
  needsPct = 0.5,
  wantsPct = 0.3,
  savingsPct = 0.2,
  bucketOfNeeds: Record<string, number> = {},
): BudgetAllocator {
  income = Math.max(0, income);
  needsPct = Math.max(0, needsPct);
  wantsPct = Math.max(0, wantsPct);
  savingsPct = Math.max(0, savingsPct);
  const needs = income * needsPct;
  const wants = income * wantsPct;
  const savings = income * savingsPct;
  const buckets: AllocatedBucket[] = [];
  let allocated = 0;
  for (const b of budgetAllocatorBuckets()) {
    const share = Math.max(0, b.id in bucketOfNeeds ? bucketOfNeeds[b.id] : b.of_needs);
    const amt = needs * share;
    allocated += amt;
    buckets.push({ id: b.id, label: b.label, share, amount: amt });
  }
  const other = Math.max(0, needs - allocated);
  if (other > 0) {
    buckets.push({ id: "other", label: "Other needs", share: needs > 0 ? other / needs : 0, amount: other });
  }
  return {
    income,
    needs_pct: needsPct,
    wants_pct: wantsPct,
    savings_pct: savingsPct,
    needs,
    wants,
    savings,
    else: Math.max(0, income - needs - wants - savings),
    buckets,
  };
}

export function budgetAllocatorSeedIncome(): number {
  return 250000;
}
