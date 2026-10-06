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
 *
 * B4 HONESTY ADDENDUM (2026-10-06, F2 on 50-30-20 + F2 on salary-tax — same
 * root, one fix). The strip above is provenance-blind: "abc123" stripped to
 * 123 and priced confident gold figures, "<svg onload=alert(1)>" repriced a
 * pension in silence, "0x10" priced 10. The digit-presence test in
 * tool-fields.ts (isBlank) could not catch any of them either. So pm() now
 * reads as BLANK anything outside the honest-money alphabet — digits,
 * whitespace, `,.+-₦$%`, ignorable format marks (ZWSP/LRM/RLM/BOM), and e/E
 * ONLY in a valid exponent slot (`1e5`→100000 keeps working; `12e`, `e5`,
 * `0x10` do not). A dishonest read returns 0 — the same number a cleared
 * field already yields — so every computation lands exactly where the blank
 * state lands, and isBlank/pmBlank withholds the figures as "—".
 * Real-world pastes keep working and are pinned by the suite's adversarial
 * row plus the live proof table: `₦1,234.50`, `1,234.50`, `1 234 500`, NBSP,
 * `+500`, `-500`, `8.5%`, `007`, `1e5`, `12.5e-3`.
 */
export const pm = (v) => {
  if (!pmHonest(v)) return 0;
  const n = Number(String(v).replace(/[\u200B-\u200F\uFEFF]/g, "").replace(/[^\d.eE-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/* The honest-money alphabet, shared by pm() above and every entered-test in
 * the fleet (tool-fields.ts isBlank, the zero-horizon flags, cover default,
 * grossKnown, warn demand-lines). One predicate, one meaning of "entered". */
export const pmHonest = (v) => {
  const s = String(v).replace(/[\u200B-\u200F\uFEFF]/g, "").trim();
  if (/[^\d\s,.+\-₦$%eE]/.test(s)) return false;
  if (!/[eE]/.test(s)) return true;
  return /^[+-]?(\d[\d\s,.]*|\.\d[\d\s,.]*)[eE][+-]?\d+$/.test(s);
};

/* Un-entered for the ZERO LAW: no digit at all ("" / "." / "abc"), or digits
 * wrapped in dishonest characters ("abc123", "<svg…>", "0x10"). A real 0 IS
 * entered: "0" is all-alphabet with a digit. */
export const pmBlank = (v) => {
  const s = String(v).trim();
  return !/\d/.test(s) || !pmHonest(s);
};

export default pm;
