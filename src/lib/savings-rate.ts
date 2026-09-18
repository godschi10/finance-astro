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
