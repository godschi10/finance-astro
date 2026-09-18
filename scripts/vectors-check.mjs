// Vector check: runs every TS engine against scripts/php-harness/vectors.json
// (the PHP truth oracle). Usage: node scripts/vectors-check.mjs
// Exit 0 = all match, 1 = mismatches (printed with paths).
import { buildSync } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const out = join(here, ".vectors-bundle.cjs");
buildSync({
  entryPoints: [join(here, "vectors-entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  loader: { ".json": "json" },
  outfile: out,
  logLevel: "silent",
});
const E = createRequire(import.meta.url)(out);

const vectors = JSON.parse(readFileSync(join(root, "scripts/php-harness/vectors.json"), "utf8"));
const byName = Object.fromEntries(vectors.map((v) => [v.name, v.value]));

// Canned "live" rates — MUST mirror scripts/php-harness/vectors.php.
const LIVE = {
  USD: 1.0, NGN: 1482.0, GBP: 0.79, EUR: 0.92, CAD: 1.36,
  AED: 3.6725, SAR: 3.75, GHS: 16.2, XOF: 565.0, XAF: 565.0,
  CNY: 6.74, JPY: 159.9, INR: 95.5, KES: 129.5, EGP: 54.0, ZAR: 18.2,
};
const AS_OF = "Mon, 14 Sep 2026 00:00:01 GMT";
const liveFx = { rates: LIVE, as_of: AS_OF, ok: true };
const transferFx = { rates: LIVE, as_of: AS_OF, ok: true };

const T = E.transfer, F = E.fx, A = E.amount;

// Synthetic fx-history points — MUST mirror vectors.php.
const baseTs = Date.parse("2026-06-01T00:00:00Z");
const pts = [];
for (let i = 0; i < 100; i++) {
  pts.push({
    date: new Date(baseTs + i * 86400000).toISOString().slice(0, 10),
    ngn: 1400.0 + i * 1.5 + (i % 7) * 2.0,
  });
}

const S = E.salaryTax, G = E.grossToNet, SV = E.savings, NV = E.nairaValue,
  IN = E.inflation, B = E.budget, AL = E.allocator, L = E.loan, C = E.crypto,
  D = E.dividend, EM = E.emergency, FH = E.fxHistory, SR = E.savingsRate, M = E.maintained;

const cases = [
  ["paye_new_300k", S.payeCalculate(300000.0, 0.08, 0.0, 0.0, true)],
  ["paye_new_70k_exempt", S.payeCalculate(70000.0, 0.08, 0.0, 0.0, true)],
  ["paye_new_70k001", S.payeCalculate(70001.0, 0.08, 0.0, 0.0, true)],
  ["paye_new_500k_rent24", S.payeCalculate(500000.0, 0.08, 0.0, 2400000.0, true)],
  ["paye_new_500k_rent99_cap", S.payeCalculate(500000.0, 0.08, 0.0, 99000000.0, true)],
  ["paye_new_5m_exec", S.payeCalculate(5000000.0, 0.08, 5000.0, 6000000.0, true, 10000.0, 20000.0, 5000.0)],
  ["paye_old_300k", S.payeCalculate(300000.0, 0.08, 0.0, 0.0, false)],
  ["paye_compare_300k", S.payeCompare(300000.0, 0.08, 0.0, 0.0)],
  ["paye_bonus", S.payeBonusTax(300000.0, 500000.0, 0.08)],
  ["paye_bonus_zero", S.payeBonusTax(300000.0, 0.0, 0.08)],
  ["paye_bonus_exempt_base", S.payeBonusTax(60000.0, 200000.0, 0.08)],
  ["paye_band_breakdown_new", S.payeBandBreakdown(3312000.0, S.payeBands2026())],
  ["paye_band_compare", S.payeBandCompare(3312000.0)],
  ["paye_bands_old", S.payeBandsOld()],
  ["paye_bands_2026", S.payeBands2026()],
  ["gross_find_250k", G.reverseGrossFind(250000.0, 0.08)],
  ["gross_full_250k", G.reverseGross(250000.0, 0.08)],
  ["gross_full_60k_exemptzone", G.reverseGross(60000.0, 0.08)],
  ["periodic_monthly_15", SV.savingsPeriodicRate(0.15, "monthly")],
  ["periodic_quarterly_15", SV.savingsPeriodicRate(0.15, "quarterly")],
  ["periodic_daily_15", SV.savingsPeriodicRate(0.15, "daily")],
  ["periodic_annual_15", SV.savingsPeriodicRate(0.15, "annual")],
  ["periodic_zero", SV.savingsPeriodicRate(0.0, "monthly")],
  ["savings_5m", SV.savingsCalculate(5000000.0, 500000.0, 0.15, 24, "monthly")],
  ["savings_already", SV.savingsCalculate(100000.0, 500000.0, 0.15, 24, "monthly")],
  ["savings_norate", SV.savingsCalculate(1200000.0, 0.0, 0.0, 12, "monthly")],
  ["savings_schedule", SV.savingsSchedule(5000000.0, 500000.0, 0.15, 30, "monthly")],
  ["deposits_weekly", SV.depositsPerMonth("weekly")],
  ["deposits_biweekly", SV.depositsPerMonth("biweekly")],
  ["deposits_quarterly", SV.depositsPerMonth("quarterly")],
  ["deposits_annual", SV.depositsPerMonth("annual")],
  ["deposits_bogus", SV.depositsPerMonth("fortnightly")],
  ["compound_growth", SV.compoundGrowth(100000.0, 50000.0, 0.10, 60, "monthly", "monthly")],
  ["compound_growth_q", SV.compoundGrowth(100000.0, 50000.0, 0.10, 60, "quarterly", "weekly")],
  ["compound_growth_norate", SV.compoundGrowth(100000.0, 50000.0, 0.0, 60, "monthly", "monthly")],
  ["compound_schedule", SV.compoundSchedule(100000.0, 50000.0, 0.10, 30, "monthly", "monthly")],
  ["naira_value", NV.nairaValue(1000000.0, 0.20, 5)],
  ["naira_value_mo", NV.nairaValue(1000000.0, 0.20, 5, 6)],
  ["naira_history", NV.nairaValueHistory(1000000.0, 0.20, 3)],
  ["naira_pv", NV.nairaValuePv(2000000.0, 0.20, 5)],
  ["naira_save", NV.nairaValueSave(10000000.0, 1000000.0, 0.15, 0.20, 5, 0, "monthly")],
  ["inflation_goal", IN.inflationAdjustedGoal(10000000.0, 1000000.0, 0.15, 0.20, 5, 0, "monthly", "monthly")],
  ["inflation_goal_weekly", IN.inflationAdjustedGoal(10000000.0, 1000000.0, 0.15, 0.20, 5, 0, "monthly", "weekly")],
  ["budget503020", B.budget503020(250000.0)],
  ["budget503020_custom", B.budget503020(400000.0, 0.6, 0.25, 0.10)],
  ["budget503020_compare", B.budget503020Compare(250000.0, 0.5, 0.3, 0.2, 140000.0, 90000.0, 30000.0)],
  ["allocator", AL.budgetAllocator(250000.0)],
  ["allocator_override", AL.budgetAllocator(250000.0, 0.5, 0.3, 0.2, { rent: 0.5 })],
  ["loan_daily_seed", L.loanRepayment(100000.0, 30, "days", 1.0, "daily")],
  ["loan_flat", L.loanRepayment(500000.0, 12, "months", 3.0, "flat")],
  ["loan_reducing", L.loanRepayment(2000000.0, 24, "months", 18.0, "reducing")],
  ["loan_flat_days", L.loanRepayment(200000.0, 90, "days", 2.0, "flat")],
  ["loan_apr_direct", L.loanEffectiveApr(500000.0, 500000.0 / 12 + 500000.0 * 0.03, 12, 12)],
  ["crypto_seed", C.cryptoProfit(200000.0, 1500.0, 1800.0, 0.01, 0.01, 0.0)],
  ["crypto_loss", C.cryptoProfit(500000.0, 1700.0, 1500.0, 0.005, 0.005, 1000.0)],
  ["crypto_zero", C.cryptoProfit(0.0, 1500.0, 1800.0)],
  ["crypto_usdt", C.cryptoUsdt(100.0, LIVE.NGN, true)],
  ["dividend_seed", D.dividendProject(500000.0, 128.0, 11.76, 0.10, 0.08, 5, true)],
  ["dividend_cash", D.dividendProject(500000.0, 128.0, 11.76, 0.10, 0.08, 5, false)],
  ["dividend_stocks", D.ngxDividendStocks()],
  ["emergency_seed", EM.emergencyFund(150000.0, 450000.0, 80000.0, 6.0, 0.20)],
  ["emergency_nosave", EM.emergencyFund(200000.0, 100000.0, 0.0, 6.0, 0.20)],
  ["fx_convert_usd_ngn", F.fxConvert(100.0, "USD", "NGN", LIVE)],
  ["fx_convert_ngn_usd", F.fxConvert(100000.0, "NGN", "USD", LIVE)],
  ["fx_convert_same", F.fxConvert(123.45, "EUR", "EUR", LIVE)],
  ["fx_convert_unknown", F.fxConvert(100.0, "USD", "XXX", LIVE)],
  ["fx_convert_gbp_ngn", F.fxConvert(100.0, "GBP", "NGN", LIVE)],
  ["fx_parallel", F.fxParallelNgnUsd(1482.0)],
  ["fx_parallel_custom", F.fxParallelNgnUsd(1482.0, 1.10)],
  ["transfer_to_ng", T.transferQuote(500.0, "to-nigeria", "USD", "NGN", transferFx)],
  ["transfer_from_ng", T.transferQuote(100000.0, "from-nigeria", "NGN", "USD", transferFx)],
  ["transfer_gbp", T.transferQuote(200.0, "to-nigeria", "GBP", "NGN", transferFx)],
  ["transfer_zero", T.transferQuote(0.0, "to-nigeria", "USD", "NGN", transferFx)],
  ["transfer_providers_to", T.transferProviders("to-nigeria")],
  ["transfer_providers_from", T.transferProviders("from-nigeria")],
  ["fx_fallback_rates", F.fxFallbackRates()],
  ["fx_fallback_convert", F.fxConvert(100.0, "USD", "NGN", F.fxFallbackRates().rates)],
  ["fx_fallback_ngn_rate", F.fxFallbackRates().rates.NGN],
  ["fxhist_summary", FH.fxHistorySummary(pts, LIVE.NGN)],
  ["fxhist_range_count", FH.fxHistoryRange(pts, 30).length],
  ["fxhist_range90_count", FH.fxHistoryRange(pts, 90).length],
  ["fxhist_single", FH.fxHistorySummary([{ date: "2026-09-01", ngn: 1482.0 }], F.fxFallbackRates().rates.NGN)],
  ["savings_rate_data", SR.savingsRateData()],
  ["maintained_verified", M.maintainedVerified()],
  ["amount_100usd", A.amountPageData("100-dollars-to-naira", { ...liveFx, cached: true })],
  ["amount_1mngn", A.amountPageData("1-million-naira-to-dollars", { ...liveFx, cached: true })],
  ["amount_seo_50", A.amountSeo("50-dollars-to-naira", A.amountConfig("50-dollars-to-naira"))],
  ["amount_tokens_100", A.amountTokens("100-dollars-to-naira", A.amountPageData("100-dollars-to-naira", { ...liveFx, cached: true }))],
  ["amount_siblings_100", A.amountSiblings("100-dollars-to-naira")],
  ["amount_opposite_100", A.amountOpposite("100-dollars-to-naira")],
  ["amount_fmt_ngn", A.amountFmt(148200.0, "NGN")],
  ["amount_fmt_usd_small", A.amountFmt(67.47, "USD")],
  ["amount_fmt_usd_big", A.amountFmt(6747.47, "USD")],
  ["amount_fmt_gbp", A.amountFmt(52.3, "GBP")],
  ["seeds", {
    loan: L.LOAN_SEED,
    crypto: C.CRYPTO_SEED,
    dividend: D.DIVIDEND_SEED,
    emergency: EM.EMERGENCY_SEED,
    naira: NV.nairaValueSeed(),
    transfer: T.TRANSFER_SEED,
    budget503020: B.budget503020SeedIncome(),
    allocator: AL.budgetAllocatorSeedIncome(),
  }],
];

function cmp(a, b, path) {
  if (typeof a === "number" && typeof b === "number") {
    if (Object.is(a, b)) return null;
    if (Number.isNaN(a) && Number.isNaN(b)) return null;
    const tol = 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    if (Math.abs(a - b) <= tol) return null;
    return `${path}: number ${a} !== ${b}`;
  }
  if (typeof a !== typeof b) return `${path}: type ${typeof a} !== ${typeof b}`;
  if (a === null || b === null) return a === b ? null : `${path}: null mismatch`;
  if (typeof a !== "object") return Object.is(a, b) ? null : `${path}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`;
  if (Array.isArray(a) !== Array.isArray(b)) return `${path}: array/object mismatch`;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return `${path}: length ${a.length} !== ${b.length}`;
    for (let i = 0; i < a.length; i++) {
      const r = cmp(a[i], b[i], `${path}[${i}]`);
      if (r) return r;
    }
    return null;
  }
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  if (ka.join(",") !== kb.join(",")) return `${path}: keys {${ka}} !== {${kb}}`;
  for (const k of ka) {
    const r = cmp(a[k], b[k], `${path}.${k}`);
    if (r) return r;
  }
  return null;
}

let fail = 0, pass = 0;
const missing = [];
for (const [name, actual] of cases) {
  if (!(name in byName)) { missing.push(name); continue; }
  const r = cmp(actual, byName[name], name);
  if (r) { fail++; console.log(`FAIL ${r}`); }
  else pass++;
}
const extra = Object.keys(byName).filter((n) => !cases.some(([c]) => c === n));
console.log(`\npass=${pass} fail=${fail} cases=${cases.length} vectors=${vectors.length}`);
if (missing.length) console.log("MISSING (no oracle):", missing.join(", "));
if (extra.length) console.log("UNTESTED (no case):", extra.join(", "));
process.exit(fail || missing.length || extra.length ? 1 : 0);
