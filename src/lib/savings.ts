// Savings-goal + compound-interest engines — TS ports of inc/savings-goal.php
// and inc/compound-interest.php. The two share savingsPeriodicRate so the
// sibling tools stay consistent. Tested vs PHP vectors.

export type CompoundFreq = "monthly" | "quarterly" | "daily" | "annual";
export type DepositFreq = "monthly" | "biweekly" | "weekly" | "quarterly" | "annual" | string;

export function savingsPeriodicRate(annualRate: number, compound: CompoundFreq | string = "monthly"): number {
  let periods: number;
  switch (compound) {
    case "daily": periods = 365; break;
    case "quarterly": periods = 4; break;
    case "annual": periods = 1; break;
    case "monthly":
    default: periods = 12; break;
  }
  if (annualRate <= 0) return 0;
  const ear = Math.pow(1 + annualRate / periods, periods) - 1;
  return Math.pow(1 + ear, 1 / 12) - 1;
}

export interface SavingsPlan {
  monthly: number;
  total: number;
  interest: number;
  goal_reached: boolean;
}

export function savingsCalculate(
  target: number,
  current: number,
  annualRate: number,
  months: number,
  compound: CompoundFreq | string = "monthly",
): SavingsPlan {
  target = Math.max(0, target);
  current = Math.max(0, current);
  annualRate = Math.max(0, annualRate);
  months = Math.max(1, Math.floor(months));

  const i = savingsPeriodicRate(annualRate, compound);

  if (target <= current) {
    return { monthly: 0, total: current, interest: 0, goal_reached: true };
  }
  if (i <= 0) {
    const monthly = (target - current) / months;
    return { monthly, total: current + monthly * months, interest: 0, goal_reached: false };
  }
  const growth = Math.pow(1 + i, months);
  let monthly = ((target - current * growth) * i) / (growth - 1);
  monthly = Math.max(0, monthly);
  const total = current * growth + (monthly <= 0 ? 0 : (monthly * (growth - 1)) / i);
  const interest = Math.max(0, total - current - monthly * months);
  return { monthly, total, interest, goal_reached: false };
}

/* ── P2-2 (fifth audit) — step-up deposits, the A7-verified solver ──────────
 * The "deposit grows %/yr" feature on the Inflation Savings page: the visitor
 * promises to RAISE their deposit by a fixed percentage each year, and the
 * question becomes "what can I START at?" The deposit is level within each
 * year and steps up at each yearly anniversary — the same end-of-month
 * convention savingsCalculate prices (last deposit earns nothing).
 *
 * THE MATHS WAS DERIVED AND VERIFIED AGAINST THE A7 VECTOR ROWS BEFORE THIS
 * ENGINE CODE WAS WRITTEN (scripts/appendix-a-vectors.json stepUpDeposits —
 * the prior leg's dying wish, honoured):
 *   context: ₦10M goal, ₦1M saved, 15% return, 60 months, 24% inflation,
 *   so target' = 10,000,000 × 1.24^5 = ₦29,316,250.62
 *   with i = 0.15/12 = 0.0125 exactly (savingsPeriodicRate is exact for
 *   "monthly" — (1+EAR)^(1/12) with EAR=(1+r/12)^12 telescopes to r/12):
 *     start = (target' − current·(1+i)^n) / (s₁₂ · Σ_{y<Y} (1+g)^y·(1+i)^(n−12(y+1)))
 *   where s₁₂ = ((1+i)^12 − 1)/i, Y = ceil(n/12).
 *   Rows reproduced EXACTLY (all five, ±₦0): 0% → 307188 · 10% → 258803 ·
 *   15% → 237452 · 20% → 217855 · 24% → 203364 — and at g=0 the block sum
 *   telescopes to the level formula, agreeing with the gated engine to float
 *   path noise (Δ 5.8e-11 on the seed; both print ₦307,188 — the 0% row is
 *   v1's already-gated nairaValue[2].monthly 307188).
 *
 * UNITS follow the engine's own convention: rates and growth arrive as
 * DECIMALS (0.15 = 15%/yr, 0.10 = 10%/yr), exactly like annualRate in
 * savingsCalculate(). The caller inflates the target when it wants tomorrow's
 * money — this function is inflation-agnostic on purpose (the same solver
 * prices a nominal goal).
 *
 * Returns NaN when the deposit stream cannot price the goal (absurd growth ×
 * horizon overflowing the block sum) — the page voices "Out of range" on it,
 * never a confident number. 0 when the existing balance alone compounds past
 * the target. */
export function savingsStepUpStart(
  target: number,
  current: number,
  annualRate: number,
  months: number,
  growthPerYear = 0,
  compound: CompoundFreq | string = "monthly",
): number {
  target = Math.max(0, target);
  current = Math.max(0, current);
  annualRate = Math.max(0, annualRate);
  months = Math.max(1, Math.floor(months));
  growthPerYear = Math.max(0, growthPerYear);

  const i = savingsPeriodicRate(annualRate, compound);
  const growth = Math.pow(1 + i, months);
  const numerator = target - current * growth;
  if (!Number.isFinite(numerator)) return NaN;
  if (numerator <= 0) return 0;

  /* FV factor of the whole stepped stream, per ₦1 of STARTING monthly:
   * block y holds k deposits of (1+g)^y each (k = 12, but the final block
   * holds only the remainder when n is not a whole number of years), and
   * that block's value then compounds for the months after it. */
  const blocks = Math.ceil(months / 12);
  let den = 0;
  for (let y = 0; y < blocks; y++) {
    const k = Math.min(12, months - 12 * y);
    if (k <= 0) break;
    const after = months - 12 * y - k;
    const blockFv = i <= 0
      ? k
      : ((Math.pow(1 + i, k) - 1) / i) * Math.pow(1 + i, after);
    den += Math.pow(1 + growthPerYear, y) * blockFv;
  }
  if (!Number.isFinite(den) || den <= 0) return NaN;
  const monthly = numerator / den;
  return Number.isFinite(monthly) ? monthly : NaN;
}

/* ── P2-5 (fifth audit) — the reverse solver: months to a goal ─────────────
 * "How long if I save ₦X/month?" — the time-driven half of the Savings Goal
 * mode toggle. Same convention as savingsCalculate: end-of-month deposits,
 * monthly rate i = r/12 (exact for "monthly"), so the balance after n months
 * is C·(1+i)^n + X·((1+i)^n − 1)/i and the horizon is the exact real root of
 * balance(n) = target:
 *   i > 0, X > 0:  n = ln((T·i + X)/(C·i + X)) / ln(1+i)
 *   i > 0, X = 0:  n = ln(T/C) / ln(1+i)   (the balance alone)
 *   i = 0:         n = (T − C)/X           (or never, at X = 0)
 * Returned FRACTIONAL (the exact crossing, e.g. 46.2) — the ceil to whole
 * months is a DISPLAY decision the page owns (deposits land at month end, so
 * the first whole month that clears the goal is ceil(n)). Infinity means
 * "never": no deposits and nothing compounding toward the goal. 0 means the
 * goal is already met — nothing to save. */
export function savingsMonthsToGoal(
  target: number,
  current: number,
  annualRate: number,
  monthly: number,
  compound: CompoundFreq | string = "monthly",
): number {
  target = Math.max(0, target);
  current = Math.max(0, current);
  annualRate = Math.max(0, annualRate);
  monthly = Math.max(0, monthly);

  if (target <= current) return 0;

  const i = savingsPeriodicRate(annualRate, compound);
  if (i <= 0) {
    if (monthly <= 0) return Infinity;
    return (target - current) / monthly;
  }
  if (monthly <= 0) {
    if (current <= 0) return Infinity;
    const n = Math.log(target / current) / Math.log(1 + i);
    return Number.isFinite(n) ? n : Infinity;
  }
  const n = Math.log((target * i + monthly) / (current * i + monthly)) / Math.log(1 + i);
  return Number.isFinite(n) ? n : Infinity;
}

export interface ScheduleRow {
  year: number;
  balance: number;
  deposited: number;
  interest: number;
}

export function savingsSchedule(
  target: number,
  current: number,
  annualRate: number,
  months: number,
  compound: CompoundFreq | string = "monthly",
): ScheduleRow[] {
  const plan = savingsCalculate(target, current, annualRate, months, compound);
  const start = Math.max(0, current);
  return buildSchedule(start, plan.monthly, annualRate, months, compound, start);
}

export function depositsPerMonth(freq: DepositFreq): number {
  switch (freq) {
    case "weekly": return 52 / 12;
    case "biweekly": return 26 / 12;
    case "quarterly": return 1 / 3;
    case "annual": return 1 / 12;
    case "monthly":
    default: return 1;
  }
}

export interface CompoundGrowth {
  future: number;
  deposited: number;
  interest: number;
  principal: number;
}

export function compoundGrowth(
  principal: number,
  amount: number,
  annualRate: number,
  months: number,
  compound: CompoundFreq | string = "monthly",
  depositFreq: DepositFreq = "monthly",
): CompoundGrowth {
  principal = Math.max(0, principal);
  amount = Math.max(0, amount);
  annualRate = Math.max(0, annualRate);
  months = Math.max(1, Math.floor(months));

  const i = savingsPeriodicRate(annualRate, compound);
  const monthly = amount * depositsPerMonth(depositFreq);
  const n = months;
  const dep = principal + monthly * n;

  if (i <= 0) return { future: dep, deposited: dep, interest: 0, principal };

  const growth = Math.pow(1 + i, n);
  const future = principal * growth + (monthly * (growth - 1)) / i;
  return { future, deposited: dep, interest: Math.max(0, future - dep), principal };
}

export function compoundSchedule(
  principal: number,
  amount: number,
  annualRate: number,
  months: number,
  compound: CompoundFreq | string = "monthly",
  depositFreq: DepositFreq = "monthly",
): ScheduleRow[] {
  const monthly = Math.max(0, amount) * depositsPerMonth(depositFreq);
  return buildSchedule(Math.max(0, principal), monthly, annualRate, Math.max(1, Math.floor(months)), compound, Math.max(0, principal));
}

function buildSchedule(
  start: number,
  pmt: number,
  annualRate: number,
  months: number,
  compound: CompoundFreq | string,
  depositedStart: number,
): ScheduleRow[] {
  const i = savingsPeriodicRate(Math.max(0, annualRate), compound);
  let balance = start;
  let deposited = depositedStart;
  const rows: ScheduleRow[] = [];
  const years = Math.ceil(months / 12);
  for (let y = 1; y <= years; y++) {
    const monthsThisYear = y === years ? months - (years - 1) * 12 : 12;
    for (let m = 0; m < monthsThisYear; m++) {
      balance = balance * (1 + i) + pmt;
      deposited = deposited + pmt;
    }
    rows.push({ year: y, balance, deposited, interest: Math.max(0, balance - deposited) });
  }
  return rows;
}
