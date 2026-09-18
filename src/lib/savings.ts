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
