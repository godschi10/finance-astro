// Emergency-fund engine — TS port of inc/emergency-fund.php
// (runway, target, time-to-reach, inflation-adjusted target).
export interface EmergencyFund {
  essentials: number;
  saved: number;
  monthly_save: number;
  months_cover: number;
  inflation: number;
  runway_now: number;
  target: number;
  months_to_reach: number;
  years_to_reach: number;
  future_essentials: number;
  real_target: number;
  gap: number;
  progress_pct: number;
}

export function emergencyFund(
  essentials: number,
  saved: number,
  monthlySave: number,
  monthsCover = 6,
  inflation = 0.2,
): EmergencyFund {
  essentials = Math.max(0, essentials);
  saved = Math.max(0, saved);
  monthlySave = Math.max(0, monthlySave);
  monthsCover = Math.max(1, monthsCover);
  inflation = Math.max(0, inflation);

  const runwayNow = essentials > 0 ? saved / essentials : 0;
  const target = essentials * monthsCover;
  const monthsToReach = monthlySave > 0 ? target / monthlySave : 0;
  const yearsToReach = monthsToReach / 12;
  const futureEssentials = essentials * Math.pow(1 + inflation, yearsToReach);
  const realTarget = futureEssentials * monthsCover;

  return {
    essentials, saved, monthly_save: monthlySave,
    months_cover: monthsCover, inflation,
    runway_now: runwayNow, target,
    months_to_reach: monthsToReach, years_to_reach: yearsToReach,
    future_essentials: futureEssentials, real_target: realTarget,
    gap: Math.max(0, target - saved),
    progress_pct: target > 0 ? Math.min(100, (saved / target) * 100) : 0,
  };
}

/** Seeded worked example (mirrors gwill_emergency_fund_seed()). */
export const EMERGENCY_SEED = { essentials: 150000, saved: 450000, monthly: 80000, cover: 6, inflation: 0.2 };
