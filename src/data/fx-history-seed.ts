// FX-history build-time seed — MAINTAINED DATA (F3/F03/#7/F12, fifth audit).
//
// The exchange-rate-history chart cold-started at a single point until a device
// had visited repeatedly. The audit asked for build-time seeding so the trend
// paints on FIRST paint — UNDER THE ABSOLUTE HONESTY LAW: no invented history.
// Every point below is REAL, DATED and SOURCED. They are the site's OWN
// build-time USD/NGN snapshots, each recorded by scripts/fetch-snapshot.mjs from
// the same open.er-api.com feed the converter refreshes from, and committed in
// src/data/fx-snapshot.ts on the date shown (see that file's git history). A day
// with no committed snapshot is a real gap, not a hidden point (2026-10-09 has
// none).
//
// These seed the PAGE's initial points ONLY. src/lib/fx-history.ts's engine
// (fxHistoryRange / fxHistorySummary) is untouched, and the frozen-clock
// "fx_history_*" vectors in scripts/vectors-check.mjs still pin it against the
// PHP oracle. On each visit the browser layers this device's own live feed
// points on top of the seed and remembers them in storage, extending the trend
// forward — first paint shows this real history, later visits add today.
//
// Gated by the 45-day maintained-table staleness gate via a dedicated entry in
// src/lib/staleness.ts. To refresh: pull recent fx-snapshot values/dates from
// the feed, append the dated points, and move FX_HISTORY_SEED_VERIFIED_ON in the
// SAME edit.
import type { FxPoint } from "../lib/fx-history";

/** Date the seed was last refreshed from the feed (the newest dated point). */
export const FX_HISTORY_SEED_VERIFIED_ON = "2026-10-12";

/** Provenance of every point — printed so a reader knows where the seed is from. */
export const FX_HISTORY_SEED_SOURCE =
  "GWill build-time USD/NGN snapshots, recorded by scripts/fetch-snapshot.mjs from open.er-api.com (the converter's own feed) and committed daily in src/data/fx-snapshot.ts";

/** Ascending, dated, real reference points — the site's own recorded snapshots. */
export const FX_HISTORY_SEED: FxPoint[] = [
  { date: "2026-09-30", ngn: 1327.241555 },
  { date: "2026-10-01", ngn: 1328.645734 },
  { date: "2026-10-02", ngn: 1327.682521 },
  { date: "2026-10-03", ngn: 1330.635588 },
  { date: "2026-10-04", ngn: 1330.13992 },
  { date: "2026-10-05", ngn: 1331.279356 },
  { date: "2026-10-06", ngn: 1330.998026 },
  { date: "2026-10-07", ngn: 1328.1192 },
  { date: "2026-10-08", ngn: 1330.207024 },
  { date: "2026-10-10", ngn: 1331.267014 },
  { date: "2026-10-11", ngn: 1330.995081 },
  { date: "2026-10-12", ngn: 1330.171897 },
];
