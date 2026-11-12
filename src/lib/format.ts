// Shared number formatting ;  mirrors gwill_paye_number() / gwill_fx_number().
export function formatGrouped(n: number, dec = 0): string {
  const r = roundHalfAway(n, dec);
  /* A30 (2026-11-12): toFixed decays to scientific notation from 1e21 up, and
     that e-string priced real receipts (savings rate 99999 printed
     "₦8.372389108024372e+51" four times; loan rate 9999 printed a 42-digit
     percent run). Beyond the break the value is expanded from its
     shortest-decimal form (toExponential) with zero padding: that is the very
     value JS itself prints, so no binary-expansion junk digits are invented
     (the float's exact integer carries ~35 digits of precision the number
     does not have), and the look matches what toFixed produced below the
     break. A non-finite result (finite inputs whose maths overflowed) reads
     as 0, the same nonsense-becomes-zero convention pm() already established.
     Every value below 1e21 keeps the byte-identical old path, so no SSR copy
     changes. */
  if (!Number.isFinite(r)) return "0";
  if (Math.abs(r) >= 1e21) {
    const s = r.toExponential();
    const neg = s.startsWith("-");
    const [mant, expS] = s.replace(/^[-+]/, "").split("e");
    const exp = parseInt(expS, 10);
    const intDigits = mant.split(".")[0].length;
    const digits = mant.replace(".", "") + "0".repeat(Math.max(0, exp - (intDigits - 1)));
    const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-" : "") + grouped + (dec > 0 ? "." + "0".repeat(dec) : "");
  }
  const fixed = r.toFixed(dec);
  const [int, frac] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac !== undefined ? `${grouped}.${frac}` : grouped;
}

/** PHP round(): halves away from zero (JS Math.round rounds halves up). */
export function roundHalfAway(n: number, dec = 0): number {
  const f = 10 ** dec;
  if (n >= 0) return Math.floor(n * f + 0.5 + 1e-9) / f;
  return -Math.floor(-n * f + 0.5 + 1e-9) / f;
}

export function naira(n: number, dec = 0): string {
  return "₦" + formatGrouped(n, dec);
}
