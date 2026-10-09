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
  never: boolean;
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
      HALF ONE (the divisor). This used to read `target / monthlySave`, which
      divides the WHOLE target by the saving rate and so is mathematically
      independent of what the visitor has already put away — `gap` was computed
      eight lines below and then ignored. Proven live at 390px: at saved =
      900,000 the receipt printed gap ₦0, a 100% bar, and still "11.3 months to
      reach". A fully-funded user was told they had 11 more months to go.

      The blocker was never mathematical, it was procedural: this file is a port
      of inc/emergency-fund.php and scripts/vectors-check.mjs gates it against a
      frozen PHP oracle in scripts/php-harness/vectors.json that carried the same
      bug (emergency_seed pinned to 11.25). Regenerating that oracle was IMPOSSIBLE
      because scripts/php-harness/vectors.php hardcoded a theme path from another
      machine ('/home/ubuntu/gwill-finance-theme/inc/') that does not exist here,
      so the generator died on require_once.

      HALF TWO (the finish line) — the same line, the other half, 2026-10-09.
      With the divisor fixed, `months_to_reach` still measured against the
      NOMINAL target: gap ÷ monthly saving. On the seed that is 450,000 ÷ 80,000
      = 5.625 months, while the page's own copy says the inflation-adjusted target
      "is the one to measure against" and that it "prices your essentials at the
      inflation you set, so the fund still covers six months when you finish it".
      The finish line MOVES while you save: at 24% the seed's real target at that
      horizon is ₦995,483, so planning on 5.6 months leaves the fund about 1.5
      months short of six months' cover. Solving
        saved + monthly × n = target × (1 + i)^(n/12)
      gives n ≈ 7.17 (the first whole month that clears it is month 8).

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
        · monthlySave > 0         — no saving rate means "never", which is
          carried by `never` below and reported as 0 months, which is this
          engine's long-standing convention for the derived horizon fields. */
  const remaining = Math.max(0, target - saved);
  /* The nominal figure — how long if prices stood still. It stays on the page
     beside the real answer (the visitor asked for it and it is informative), but
     it is no longer what `months_to_reach` means. */
  const monthsNominal = monthlySave > 0 ? remaining / monthlySave : 0;

  /* ── the moving-target answer ────────────────────────────────────────────
     Solve `saved + monthly·n = target·g^(n/12)` for the FIRST n, where
     g = 1 + inflation. Written as f(n) = saved + monthly·n − target·g^(n/12),
     f is CONCAVE (it rises, peaks, then falls to −∞), f(0) < 0 while the gap is
     open, and the answer is the first crossing. Three facts make it exact in
     constant time instead of a capped month walk:

       drag0 = target·ln(g)/12  the naira the finish line gains in month one.
              It grows without bound, so once `monthly <= drag0` the gap can only
              ever widen — the fund NEVER catches up.
       nPeak = 12·ln(monthly/drag0)/ln(g)  where f peaks. At that point
              target·g^(nPeak/12) = 12·monthly/ln(g), so f peaks at
              saved + monthly·nPeak − 12·monthly/ln(g).
       nHigh = 12/ln(g) − saved/monthly  an UPPER bound on any crossing: at a
              crossing, target·g^(n/12) ≤ target·g^(nPeak/12) = 12·monthly/ln(g),
              so saved + monthly·n ≤ 12·monthly/ln(g).
              (And a lower bound: nLow = (target−saved)/monthly, since
              g^(n/12) ≥ 1 at any crossing.)

     So a crossing exists iff nPeak ≥ nHigh, and it then lies in
     [nLow, nHigh] — a bracket on which f is increasing (both ends sit at or
     before the peak), found by bisection to full double precision.

     Why NOT the audit's `while (n < 1200 …) n += 1` loop: its cap cannot tell
     "never" from "slow". At zero inflation a plan that needs 1,401 months is
     entirely legitimate and would have been reported as Infinity, while the
     loop also walks 1,200 iterations to reach that wrong answer. The check
     above is exact for both, and returns the same 7.17 on the seed. */
  let monthsToReach = 0;
  let never = false;
  if (remaining > 0) {
    if (monthlySave <= 0) {
      never = true;
    } else {
      const g = 1 + inflation;
      if (g <= 1) {
        /* Prices standing still: the finish line does not move, so the two
           answers coincide exactly. */
        monthsToReach = monthsNominal;
      } else {
        const lg = Math.log(g);
        const drag0 = target * lg / 12;
        if (monthlySave <= drag0) {
          never = true; // the finish line gains more each month than you put in
        } else {
          const nHigh = 12 / lg - saved / monthlySave;
          const nPeak = 12 * Math.log(monthlySave / drag0) / lg;
          if (!(nPeak >= nHigh)) {
            never = true; // the gap closes for a while, then reopens for good
          } else {
            let lo = monthsNominal;
            let hi = nHigh;
            /* f(n) — must stay byte-identical to the PHP port:
               saved + monthly·n − target·g^(n/12). */
            const f = (n: number) => saved + monthlySave * n - target * Math.pow(g, n / 12);
            if (f(lo) >= 0) monthsToReach = lo;
            else if (f(hi) <= 0) monthsToReach = hi;
            else {
              for (let i = 0; i < 200; i++) {
                const mid = (lo + hi) / 2;
                if (f(mid) >= 0) hi = mid;
                else lo = mid;
              }
              monthsToReach = hi;
            }
            /* Absurd inputs (cover/inflation in the thousands of percent) can
               still overflow the exponentials. "Never" is the honest reading of
               a finish line no saving rate can reach, and 0 keeps every derived
               horizon field finite. */
            if (!Number.isFinite(monthsToReach) || monthsToReach < 0) {
              monthsToReach = 0;
              never = true;
            }
          }
        }
      }
    }
  }

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
    months_to_reach: monthsToReach, never,
    years_to_reach: yearsToReach,
    future_essentials: futureEssentials, real_target: realTarget,
    gap: Math.max(0, target - saved),
    progress_pct: target > 0 ? Math.min(100, (saved / target) * 100) : 0,
  };
}

/** Seeded worked example (mirrors gwill_emergency_fund_seed()). */
export const EMERGENCY_SEED = { essentials: 150000, saved: 450000, monthly: 80000, cover: 6, inflation: 0.2 };
