// Savings-rate comparator data — TS port of inc/savings-rate.php
// gwill_savings_rate_data(). MAINTAINED table (verified September 2026;
// marketing figures, indicative not live quotes). Single-edit source.
// Tested vs PHP vectors.
import { maintainedVerified } from "./maintained";

export interface SavingsRateRow {
  provider: string;
  product: string;
  rate: number;
  type: string;
  min: number;
  note: string;
}

/** Maintained savings-rate table (headline %/yr). */
export function savingsRateData(): SavingsRateRow[] {
  return [
    { provider: "Renmoney", product: "Fixed Savings", rate: 28.0, type: "locked / fixed", min: 1000, note: "Highest advertised headline; fixed plans, verify term." },
    { provider: "Coronation Money Market Fund", product: "Money market fund", rate: 20.5, type: "money market", min: 100000, note: "Fund yield, not a deposit; fluctuates with the market." },
    { provider: "FairMoney", product: "FairLock", rate: 20.0, type: "locked / FD", min: 0, note: "CBN-licensed; up to 1-year lock." },
    { provider: "Carbon", product: "Cash Vault", rate: 20.0, type: "locked / fixed", min: 0, note: "12-month fixed plan; digital bank." },
    { provider: "PiggyVest", product: "SafeLock", rate: 18.5, type: "locked", min: 0, note: "Lock 10-1000 days; up to 18.5% (promos higher). Flex Naira pays ~12%." },
    { provider: "Cowrywise", product: "Locked savings", rate: 15.0, type: "locked", min: 1000, note: "Lock-based plans; up to 15%, rates vary by plan." },
    { provider: "Kuda", product: "Fixed savings", rate: 12.0, type: "flexible / fixed", min: 0, note: "Full digital bank; fixed pocket up to 16%, flex ~8%." },
    { provider: "PiggyVest", product: "Flex Naira", rate: 12.0, type: "flexible", min: 0, note: "Withdraw any time, lower rate for liquidity." },
    { provider: "Bank fixed deposit", product: "FD (30-365 days)", rate: 12.0, type: "fixed deposit", min: 100000, note: "Top-tier banks (Zenith 7-11%, Access 7-10%…), NDIC-insured." },
    { provider: "Traditional bank savings", product: "Regular savings", rate: 4.0, type: "flexible", min: 0, note: "The baseline most people get, and why fintech wins." },
  ];
}

/** Freshness stamp ("verified …", never a live quote). */
export function savingsRateVerified(): string {
  return maintainedVerified();
}

/* ── PER-ROW PROVENANCE (CALC-7, 2026-10-09) ────────────────────────────────
 * The comparator shipped ONE page-level month ("verified September 2026")
 * across ten rows that were not all checked on the same day. Provenance now
 * hangs off each row, keyed `${provider}|${product}`.
 *
 * WHY A MAP AND NOT FIELDS ON THE ROW: `savings_rate_data` is a vector in
 * scripts/php-harness/vectors.json — the PHP truth oracle — and
 * vectors-check.mjs compares it key-for-key. Putting `verifiedOn` on the row
 * objects would fail the parity gate on a pure metadata change, and hand-
 * editing the oracle to match TypeScript would invert the gate (PROC-1: the
 * oracle is supposed to be PHP's answer, not ours). The map keeps
 * `savingsRateData()` byte-identical to what PHP produces while the
 * provenance still lives in this one file, the single-edit source.
 *
 * DATES ARE NOT INVENTED. Every row carries "2026-09" — the month this table
 * already claimed (MAINTAINED_VERIFIED, "September 2026"; CHANGELOG 0.6.7
 * records the ruling: "Savings-rate 'verified September 2026' STAYS — it is a
 * human-maintained marketing table, the stamp is honest and not
 * build-fetchable"). The repo carries no finer date, so no finer date is
 * printed. When a row is genuinely re-checked, tighten THAT row's value to
 * "YYYY-MM-DD"; the page formatter already renders day precision.
 *
 * `sourceUrl` is deliberately EMPTY for every row. PENDING-WORK R19 records
 * these rates as UNVERIFIED (only SafeLock 18.5% and FairLock 20% were ever
 * checked exact), and a provider deep link nobody opened is an invented
 * citation. Add the URL in the same edit that re-checks the rate. */
export interface SavingsRateProvenance {
  /** ISO date, or ISO year-month where only the month is known. */
  verifiedOn: string;
  /** The page the figure was read from. Omitted when none is recorded. */
  sourceUrl?: string;
}

export const SAVINGS_RATE_PROVENANCE: Record<string, SavingsRateProvenance> = {
  "Renmoney|Fixed Savings": { verifiedOn: "2026-09" },
  "Coronation Money Market Fund|Money market fund": { verifiedOn: "2026-09" },
  "FairMoney|FairLock": { verifiedOn: "2026-09" },
  "Carbon|Cash Vault": { verifiedOn: "2026-09" },
  "PiggyVest|SafeLock": { verifiedOn: "2026-09" },
  "Cowrywise|Locked savings": { verifiedOn: "2026-09" },
  "Kuda|Fixed savings": { verifiedOn: "2026-09" },
  "PiggyVest|Flex Naira": { verifiedOn: "2026-09" },
  "Bank fixed deposit|FD (30-365 days)": { verifiedOn: "2026-09" },
  "Traditional bank savings|Regular savings": { verifiedOn: "2026-09" },
};

/** Provenance for one row. THROWS rather than serve a row with no date — a
 *  silently undated row is the exact defect this map exists to end, and a
 *  static build is where it should fail, not on a visitor's screen. */
export function savingsRateProvenance(row: SavingsRateRow): SavingsRateProvenance {
  const p = SAVINGS_RATE_PROVENANCE[`${row.provider}|${row.product}`];
  if (!p) {
    throw new Error(`savings-rate: no verifiedOn recorded for "${row.provider} — ${row.product}". Add it to SAVINGS_RATE_PROVENANCE.`);
  }
  return p;
}
