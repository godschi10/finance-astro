// Shared number formatting — mirrors gwill_paye_number() / gwill_fx_number().
export function formatGrouped(n: number, dec = 0): string {
  const r = roundHalfAway(n, dec);
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

/** gwill_paye_number(): ₦-less grouped figure, callers add the symbol. */
export function payeNumber(n: number, dec = 0): string {
  return formatGrouped(n, dec);
}

export function naira(n: number, dec = 0): string {
  return "₦" + formatGrouped(n, dec);
}
