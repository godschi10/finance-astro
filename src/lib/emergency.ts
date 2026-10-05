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
  /* ── C1 — A KNOWN, LIVE DEFECT. DO NOT "FIX" IT WITHOUT THE ORACLE. ──────────
     `monthsToReach` ignores `saved`, so it is mathematically INDEPENDENT of
     how much the visitor has already put away. Verified live at 390px: at
     saved = 900,000 the receipt prints gap ₦0, a 100% bar, and still "11.3
     months". `gap` is computed eight lines below and then ignored here.

     The one-line fix is `(target - saved) / monthlySave`, and it is CORRECT:
     proven on the live DOM, it moves 11.3 -> 5.6 -> 0.0 as saved goes
     0 -> 450,000 -> 900,000, and it correctly drops years_to_reach,
     future_essentials and real_target with it, so the "inflated finish line"
     stops being inflated by money already saved.

     IT IS NOT APPLIED because this file is a faithful port of the WordPress
     engine (inc/emergency-fund.php, byte-identical logic including the
     `max(1.0, $months_cover)` clamp) and scripts/vectors-check.mjs gates it
     against a FROZEN PHP oracle in scripts/php-harness/vectors.json. That
     oracle carries the same bug: emergency_seed pins months_to_reach to
     11.25. Applying the fix turns the vectors gate RED on four fields
     (months_to_reach, years_to_reach, future_essentials, real_target) —
     measured, not assumed. The PHP source of truth must be fixed FIRST and
     vectors.json regenerated, which is a gate/oracle change and therefore
     @manager's call, not a code-fix leg's. Do not silently diverge this port
     from PHP to make the numbers look better. */
  const monthsToReach = monthlySave > 0 ? target / monthlySave : 0;
  // Display-sanity cap: (1+inflation)^years overflows to Infinity for
  // dust-sized saving or absurd cover/inflation (receipt printed ₦Infinity).
  // 50y exceeds any emergency build; the pinned seed (0.94y) is untouched.
  const yearsToReach = Math.min(monthsToReach / 12, 50);
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
