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
  /* ── C1 — FIXED 2026-10-08, at the PHP source of truth FIRST. ───────────────
     This used to read `target / monthlySave`, which divides the WHOLE target by
     the saving rate and so is mathematically independent of what the visitor has
     already put away — `gap` was computed eight lines below and then ignored.
     Proven live at 390px: at saved = 900,000 the receipt printed gap ₦0, a 100%
     bar, and still "11.3 months to reach". A fully-funded user was told they had
     11 more months to go.

     The blocker was never mathematical, it was procedural: this file is a port
     of inc/emergency-fund.php and scripts/vectors-check.mjs gates it against a
     frozen PHP oracle in scripts/php-harness/vectors.json that carried the same
     bug (emergency_seed pinned to 11.25). Regenerating that oracle was IMPOSSIBLE
     because scripts/php-harness/vectors.php hardcoded a theme path from another
     machine ('/home/ubuntu/gwill-finance-theme/inc/') that does not exist here,
     so the generator died on require_once.

     Order actually followed, so the port never diverged from PHP:
       1. fixed inc/emergency-fund.php (the source of truth),
       2. made the oracle generator's path overridable + auto-detecting,
       3. REGENERATED vectors.json by running PHP — never hand-edited,
       4. applied the same one-line fix here.

     The regenerated oracle moved exactly four fields, all in emergency_seed and
     all downstream of this line (months_to_reach 11.25 -> 5.625, plus
     years_to_reach, future_essentials and real_target). No other vector in the
     suite moved, which is the proof the regeneration was surgical.

     Both clamps matter and both are mirrored in PHP:
       · max(0, target - saved) — saving PAST the target means the goal is
         already met; months to reach it is 0, never negative.
       · monthlySave > 0         — no saving rate means "never", reported as 0,
         which is this engine's long-standing convention, unchanged. */
  const remaining = Math.max(0, target - saved);
  const monthsToReach = monthlySave > 0 ? remaining / monthlySave : 0;
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
