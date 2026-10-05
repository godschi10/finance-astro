/* pm.js — the parse-tolerant money reader (v0.7.20 leg C).
 *
 * ONE function, ZERO dependencies, and the SAME expression the reverted R2
 * control-layer commit (9cea4d4, scripts/r2-pm-codemod.mjs) inlined into all 15
 * tool scripts. It is lifted here verbatim and nothing is "improved":
 *
 *   const pm = v => { const n = Number(String(v).replace(/[^\d.eE-]/g, ''));
 *                     return Number.isFinite(n) ? n : 0; };
 *
 * WHY it exists at all: money-controls.js groups the integer part on blur, so a
 * field the user has touched can legitimately hold "1,234.50" or "₦1,234.50".
 * Number() turns the first into NaN and the second into NaN — and `Number(x) || 0`
 * then silently reads that NaN as 0. Every calculator that read its inputs that
 * way went dead the moment a field was blurred. pm() is what keeps a grouped
 * value live-accurate, so all 63 converted reads MUST go through it.
 *
 * Verified by hand against the four shapes that matter:
 *   "1,234.5"  -> 1234.5      "₦1,234.50" -> 1234.5
 *   "1234.50"  -> 1234.5      ""          -> 0
 *   "abc"      -> 0            "1e5"       -> 100000
 *   "-40"      -> -40          "  7 "      -> 7
 *
 * CONTRACT (unchanged from the commit): it NEVER throws, NEVER returns NaN and
 * NEVER returns Infinity — callers keep their own Math.max(0, …) clamps, so no
 * calculator's maths changes. Only the READ is made tolerant, not the maths.
 */
export const pm = (v) => {
  const n = Number(String(v).replace(/[^\d.eE-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export default pm;