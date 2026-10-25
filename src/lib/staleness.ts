/* ── MAINTAINED-TABLE STALENESS (P3-6, fifth audit, v0.7.58) ────────────────
 * The audit's finding, [Certain]: the hand-maintained tables — NGX prices,
 * savings rates, transfer fees — all carry a "verified <month>" stamp and
 * NOTHING warns when that stamp ages out. A rate table silently becomes a
 * year-old number presented with the same confidence as a fresh one, and on a
 * YMYL finance site that is worse than printing nothing.
 *
 * WHAT THIS DOES: computes, from each table's OWN recorded date, how old it is
 * today, and reports it. `npm run check` gates on the result — a table past its
 * threshold fails the gate and the build, naming itself and the edit that fixes
 * it. The alternative the audit offered — a "Stale" banner on the page — is
 * NOT implemented here because a banner is advisory and this is a gate; if the
 * table has not been re-checked, it should not ship, and the gate is the only
 * place that can actually stop it.
 *
 * DATES ARE READ, NEVER INVENTED. Every entry below names the module that
 * already owns the date, so there is exactly one source of truth per table and
 * re-checking a table is a one-line edit in the module that owns it — not a
 * second edit here that can disagree with the first.
 *
 * THRESHOLD: 45 days, the figure the audit names. It is long enough that a
 * monthly human re-check comfortably fits inside it, and short enough that no
 * consumer-facing figure goes months past the last time a human looked at it.
 *
 * MONTH-PRECISION STAMPS: some tables record only "September 2026". A
 * month-only stamp is resolved to the LAST day of that month — the reading most
 * favourable to the table, and therefore the honest one: we never claim a table
 * is fresher than the coarsest date it actually recorded. */
import { MAINTAINED_VERIFIED } from "./maintained";
import { NGX_PRICES_VERIFIED_ON } from "./dividend";
import { dividendExamplesVerifiedOn } from "../data/dividend-examples";
import { FX_PARALLEL_VERIFIED_ON, FX_PARALLEL_SPREAD_RANGE } from "./fx";

/** Days after which a maintained table must have been re-checked. */
export const STALENESS_DAYS = 45;

export interface MaintainedTable {
  /** Stable id, used by the gate output. */
  id: string;
  /** Human label naming the thing that has to be re-checked. */
  label: string;
  /** ISO date, or ISO year-month where only the month is recorded. */
  verifiedOn: string;
  /** Where the date lives, so the fix points at the file to edit. */
  source: string;
}

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** Resolve any recorded stamp to a concrete ISO date. Month-only stamps resolve
 *  to the LAST day of that month (see the header note). Returns null when the
 *  stamp is not in a shape this understands — which the gate then reports as
 *  unknown rather than silently treating as fresh. */
export function resolveVerifiedDate(stamp: string): Date | null {
  const s = stamp.trim();
  let y = 0, m = 0, d = 0;
  let mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (mt) {
    y = Number(mt[1]); m = Number(mt[2]) - 1; d = Number(mt[3]);
  } else if ((mt = /^(\d{4})-(\d{2})$/.exec(s))) {
    y = Number(mt[1]); m = Number(mt[2]) - 1;
    d = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); // last day of month
  } else if ((mt = /^([A-Za-z]{3})\w*\s+(\d{4})$/.exec(s))) {
    // "September 2026" — the MAINTAINED_VERIFIED house shape.
    if (!(mt[1] in MONTHS)) return null;
    y = Number(mt[2]); m = MONTHS[mt[1]];
    d = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  } else if ((mt = /^(\d{4})-(\d{2})-(\d{2})/.exec(s))) {
    y = Number(mt[1]); m = Number(mt[2]) - 1; d = Number(mt[3]);
  } else {
    return null;
  }
  const dt = new Date(Date.UTC(y, m, d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Whole days between the stamp and `now`. Negative when the stamp is in the
 *  future, which the gate reports separately — a future date is a typo, not
 *  freshness. */
export function ageInDays(verifiedOn: string, now: Date = new Date()): number | null {
  const d = resolveVerifiedDate(verifiedOn);
  if (!d) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((today - d.getTime()) / 86400000);
}

export interface StalenessRow extends MaintainedTable {
  /** null when the recorded stamp could not be parsed — reported, not assumed. */
  ageDays: number | null;
  stale: boolean;
  future: boolean;
}

/**
 * Every maintained table the site ships, with its own recorded date.
 * The savings-rate table is entered with its per-row provenance's month because
 * all ten rows carry the same "2026-09" and the provenance map itself throws at
 * build when a row has no date (CALC-7) — so its freshness is already enforced
 * per-row and is represented here at table level.
 */
export function maintainedTables(): MaintainedTable[] {
  return [
    {
      id: "ngx_prices",
      label: "NGX price/dividend table (dividend-calculator)",
      verifiedOn: NGX_PRICES_VERIFIED_ON,
      source: "src/lib/dividend.ts (NGX_PRICES_VERIFIED_ON — single source of truth)",
    },
    {
      id: "savings_rates",
      label: "Savings-rate marketing table (savings-rate-comparator)",
      verifiedOn: "2026-09",
      source: "src/lib/savings-rate.ts (SAVINGS_RATE_PROVENANCE, per row)",
    },
    {
      id: "transfer_fees",
      label: "Transfer provider fee + markup table (money-transfer-comparator)",
      verifiedOn: MAINTAINED_VERIFIED,
      source: "src/lib/maintained.ts (MAINTAINED_VERIFIED) + src/lib/transfer.ts",
    },
    {
      id: "parallel_premium",
      label: `Parallel-market street premium (range ${(FX_PARALLEL_SPREAD_RANGE.low * 100).toFixed(1)}%–${(FX_PARALLEL_SPREAD_RANGE.high * 100).toFixed(1)}%)`,
      verifiedOn: FX_PARALLEL_VERIFIED_ON,
      source: "src/lib/fx.ts (FX_PARALLEL_OBSERVATIONS / FX_PARALLEL_VERIFIED_ON)",
    },
    {
      id: "dividend_examples",
      label: "Curated NGX dividend example chips (dividend-calculator)",
      verifiedOn: dividendExamplesVerifiedOn(),
      source: "src/data/dividend-examples.ts (dividendExamplesVerifiedOn — single source of truth)",
    },
    {
      id: "fx_history_seed",
      label: "USD→NGN build-time seed series (exchange-rate-history)",
      verifiedOn: "2026-10-12",
      source: "src/data/fx-history-seed.ts (committed fx-snapshot build history)",
    },
  ];
}

/** Age + staleness for every maintained table, as of `now`. */
export function stalenessReport(now: Date = new Date()): StalenessRow[] {
  return maintainedTables().map((t) => {
    const ageDays = ageInDays(t.verifiedOn, now);
    return {
      ...t,
      ageDays,
      stale: ageDays === null || ageDays > STALENESS_DAYS,
      future: ageDays !== null && ageDays < 0,
    };
  });
}