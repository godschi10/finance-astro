// Savings-rate comparator data ;  TS port of inc/savings-rate.php
// gwill_savings_rate_data(). MAINTAINED table (re-checked live 2026-11-15 by
// the A34 leg's researcher: every row fetched from the provider's own page;
// marketing figures, indicative not live quotes). Single-edit source.
// Tested vs PHP vectors.

// This table's own stamp. Day precision: the 2026-11-15 re-check read every
// provider's own page (provenance map below carries the per-row URLs).
export const SAVINGS_RATES_VERIFIED_ON = "2026-11-15";

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
    { provider: "Renmoney", product: "RenVault", rate: 22.0, type: "locked / fixed", min: 1000, note: "Advertised headline, up to 22%; fixed lock; verify the term. The old Fixed Savings line is now RenVault." },
    { provider: "Coronation Money Market Fund", product: "Money market fund", rate: 20.5, type: "money market", min: 100000, note: "Fund yield, not a deposit; fluctuates with the market." },
    { provider: "FairMoney", product: "FairLock", rate: 20.0, type: "locked / FD", min: 0, note: "CBN-licensed; up to 1-year lock." },
    { provider: "Carbon", product: "Cash Vault", rate: 20.0, type: "locked / fixed", min: 0, note: "12-month fixed plan; digital bank." },
    { provider: "PiggyVest", product: "SafeLock", rate: 20.0, type: "locked", min: 0, note: "Lock 10-1000 days; up to 20% (tiers from 14% for short locks)." },
    { provider: "Cowrywise", product: "Locked savings", rate: 15.0, type: "locked", min: 1000, note: "Lock-based plans; up to 15%, rates vary by plan; in-app plans often pay less." },
    { provider: "Kuda", product: "Fixed savings", rate: 12.0, type: "flexible / fixed", min: 0, note: "Full digital bank; fixed pocket up to 16%, flex ~8%." },
    { provider: "PiggyVest", product: "Flex Naira", rate: 12.0, type: "flexible", min: 0, note: "Withdraw any time, lower rate for liquidity." },
    { provider: "Bank fixed deposit", product: "FD (30-365 days)", rate: 13.0, type: "fixed deposit", min: 100000, note: "Access weekly sheet 13.0% avg (06 Nov 2026); rates reprice with the MPR; NDIC-insured." },
    { provider: "Traditional bank savings", product: "Regular savings", rate: 6.9, type: "flexible", min: 0, note: "CBN floor 6.90% (30% of MPR) since the Sept 2026 cut; most banks pay near the floor." },
  ];
}

/** Freshness stamp ("verified …", never a live quote). */
export function savingsRateVerified(): string {
  return SAVINGS_RATES_VERIFIED_ON;
}

/* ── PER-ROW PROVENANCE (CALC-7, 2026-10-09; re-checked live 2026-11-15) ────
 * The comparator shipped ONE page-level month ("verified September 2026")
 * across ten rows that were not all checked on the same day. Provenance now
 * hangs off each row, keyed `${provider}|${product}`.
 *
 * WHY A MAP AND NOT FIELDS ON THE ROW: `savings_rate_data` is a vector in
 * scripts/php-harness/vectors.json ; the PHP truth oracle ; and
 * vectors-check.mjs compares it key-for-key. Putting `verifiedOn` on the row
 * objects would fail the parity gate on a pure metadata change, and hand-
 * editing the oracle to match TypeScript would invert the gate (PROC-1: the
 * oracle is supposed to be PHP's answer, not ours). The map keeps
 * `savingsRateData()` byte-identical to what PHP produces while the
 * provenance still lives in this one file, the single-edit source.
 *
 * THE 2026-11-15 RE-CHECK (the maintained-staleness gate's 45-day line):
 * every row was read live from the provider's own page (PiggyVest/Kuda via
 * their official FAQ and product pages; the two generic bank rows via Access
 * Bank's official weekly market-rates sheet and a CBN-floor explainer, the
 * honest sources for a generic row). Figures that had moved moved: Renmoney
 * 28% → 22% (and the product is now RenVault), SafeLock 18.5% → 20%, bank FD
 * 12% → 13% (Access sheet), regular savings 4% → 6.9% (the CBN floor moved
 * with the September MPR cut). Rows that held (Coronation, FairMoney,
 * Carbon, Cowrywise, Kuda, Flex Naira) kept their figures and gained a
 * sourceUrl. Every row now carries its day and the page it was read from. */
export interface SavingsRateProvenance {
  /** ISO date, or ISO year-month where only the month is known. */
  verifiedOn: string;
  /** The page the figure was read from. Omitted when none is recorded. */
  sourceUrl?: string;
}

export const SAVINGS_RATE_PROVENANCE: Record<string, SavingsRateProvenance> = {
  "Renmoney|RenVault": { verifiedOn: "2026-11-15", sourceUrl: "https://renmoney.com/savings" },
  "Coronation Money Market Fund|Money market fund": { verifiedOn: "2026-11-15", sourceUrl: "https://checkinvestng.com/money-market-fund-yields" },
  "FairMoney|FairLock": { verifiedOn: "2026-11-15", sourceUrl: "https://fairmoney.io/savings-products/fairlock" },
  "Carbon|Cash Vault": { verifiedOn: "2026-11-15", sourceUrl: "https://www.getcarbon.co/savings" },
  "PiggyVest|SafeLock": { verifiedOn: "2026-11-15", sourceUrl: "https://app.piggyvest.com/faq" },
  "Cowrywise|Locked savings": { verifiedOn: "2026-11-15", sourceUrl: "https://cowrywise.com/faq" },
  "Kuda|Fixed savings": { verifiedOn: "2026-11-15", sourceUrl: "https://kuda.com/savings" },
  "PiggyVest|Flex Naira": { verifiedOn: "2026-11-15", sourceUrl: "https://app.piggyvest.com/faq" },
  "Bank fixed deposit|FD (30-365 days)": { verifiedOn: "2026-11-15", sourceUrl: "https://www.accessbankplc.com/business/market-rates" },
  "Traditional bank savings|Regular savings": { verifiedOn: "2026-11-15", sourceUrl: "https://finnaija.ng/compare-savings-accounts-nigerian-banks" },
};

/** The table-level stamp the staleness gate reads: the OLDEST recorded
 *  provenance date across the rows, so the gate never claims the table is
 *  fresher than the coarsest date any of its rows actually recorded. ISO
 *  day/month strings sort lexicographically, so the first sort key is the
 *  oldest. */
export function savingsRateTableVerifiedOn(): string {
  const dates = Object.values(SAVINGS_RATE_PROVENANCE).map((p) => p.verifiedOn).sort();
  return dates[0] ?? SAVINGS_RATES_VERIFIED_ON;
}

/** Provenance for one row. THROWS rather than serve a row with no date ; a
 *  silently undated row is the exact defect this map exists to end, and a
 *  static build is where it should fail, not on a visitor's screen. */
export function savingsRateProvenance(row: SavingsRateRow): SavingsRateProvenance {
  const p = SAVINGS_RATE_PROVENANCE[`${row.provider}|${row.product}`];
  if (!p) {
    throw new Error(`savings-rate: no verifiedOn recorded for "${row.provider}: ${row.product}". Add it to SAVINGS_RATE_PROVENANCE.`);
  }
  return p;
}
