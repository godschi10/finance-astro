// Maintained-data freshness stamps.
//
// The WordPress port kept one shared "verified" string for three tables, but
// those tables have different verification histories. The NGX table was
// re-verified on 2026-10-24; the savings-rate and transfer-fee tables were not,
// so their honest stamps remain "September 2026".
//
// Each table owns its stamp in its own module (dividend.ts, savings-rate.ts,
// transfer.ts). These exports exist for the PHP parity oracle's historical
// `maintained_verified` vector, whose PHP theme still returns this shared
// September value. Do not use this shared value for a table whose own stamp is
// newer, and do not bump it unless the retiring PHP theme's shared stamp is
// genuinely re-verified too.
export const MAINTAINED_VERIFIED = "September 2026";

export function maintainedVerified(): string {
  return MAINTAINED_VERIFIED;
}
