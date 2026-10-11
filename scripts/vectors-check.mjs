// Vector check: runs every TS engine against THREE oracles —
//   1. scripts/php-harness/vectors.json  (the PHP truth oracle — parity)
//   2. scripts/independent-vectors.json  (the independent oracle — PROC-1)
//   3. scripts/appendix-a-vectors.json   (the fifth audit's Appendix A — statute-derived)
// Usage: node scripts/vectors-check.mjs
// Exit 0 = all three oracles match, 1 = any mismatch (printed with paths).
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

// Frozen clock for the fx-history window contract.
//
// vectors.json is a PHP snapshot: gwill_fx_history_range() windows on
// strtotime('-N days'), i.e. the REAL clock at the moment the oracle was
// generated. Passing live Date.now() here makes the gate compare a moving
// window against a frozen count, so it fails a little more each day (found
// live: 16/76 vs the oracle's 20/80 — exactly 4 days of drift). The engine
// already takes a clock argument; pin it to the oracle's generation instant.
// Bump this in the SAME change whenever scripts/php-harness/vectors.json is
// regenerated, or the two clocks disagree again by design.
//
// 2026-10-08 — bumped to the C1 regeneration instant. C1 (emergency-fund
// months_to_reach ignoring `saved`) could not be fixed before this, because
// regenerating vectors.json required running PHP and the generator pointed at
// a theme path from another machine. Once the generator ran, it ran against
// the REAL clock, so the fx-history window counts came out at the new instant
// (0/60) while this gate still stood at 2026-09-18 (20/80). Bumping the pin
// to the generation instant is the documented remedy, and it is why the C1
// change touches this line as well as the oracle.
const HIST_ORACLE_MS = Date.parse("2026-10-08T08:58:31Z");

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
  // transfer_from_ng moved to the declared-divergence block below (P0-1, v0.7.57):
  // the PHP oracle snapshot pins the INVERTED street-rate direction.
  ["transfer_gbp", T.transferQuote(200.0, "to-nigeria", "GBP", "NGN", transferFx)],
  ["transfer_zero", T.transferQuote(0.0, "to-nigeria", "USD", "NGN", transferFx)],
  ["transfer_providers_to", T.transferProviders("to-nigeria")],
  ["transfer_providers_from", T.transferProviders("from-nigeria")],
  ["fx_fallback_rates", F.fxFallbackRates()],
  ["fx_fallback_convert", F.fxConvert(100.0, "USD", "NGN", F.fxFallbackRates().rates)],
  ["fx_fallback_ngn_rate", F.fxFallbackRates().rates.NGN],
  ["fxhist_summary", FH.fxHistorySummary(pts, LIVE.NGN)],
  ["fxhist_range_count", FH.fxHistoryRange(pts, 30, HIST_ORACLE_MS).length],
  ["fxhist_range90_count", FH.fxHistoryRange(pts, 90, HIST_ORACLE_MS).length],
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
    naira: NV.NAIRA_VALUE_SEED,
    transfer: T.TRANSFER_SEED,
    budget503020: B.BUDGET_SEED_INCOME,
    allocator: AL.BUDGET_SEED_INCOME,
  }],
];

// DECLARED COPY DIVERGENCES (fifth audit P0-4, King ruling) — oracle leaf
// paths the Astro port deliberately no longer mirrors, each loudly declared
// below. amount_1mngn.cfg.content.sections[3].body[1]: "splitting a large
// transfer into a few smaller ones over separate days" is threshold-dodging
// advice (fifth audit P0-4); the King ruled it replaced with the documentation
// sentence on the amount pages. The PHP truth theme still carries the old
// paragraph, so this ONE leaf is excluded from the deep comparison and the
// corrected TS copy is fail-guarded in the declared-divergence block below.
// See the next ship's CHANGELOG (companion leg rides the manager's fold).
const DECLARED_COPY_DIVERGENCES = new Set([
  "amount_1mngn.cfg.content.sections[3].body[1]",
]);

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
  if (typeof a !== "object") {
    if (Object.is(a, b) || DECLARED_COPY_DIVERGENCES.has(path)) return null;
    return `${path}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`;
  }
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
// DECLARED ADDITIVE FIELDS (v0.7.55, B3) — the TS ReverseGross now carries
// `unreachable` (the capped ₦100M/mo search must SAY when it cannot reach the
// target), a field the PHP oracle's snapshot predates. For these vectors the
// shared fields still compare against the oracle verbatim; the new field is
// asserted explicitly in the independent section below. This is comparison
// plumbing only — the engine object keeps the field.
const DECLARED_ADDITIVE = new Set(["gross_full_250k", "gross_full_60k_exemptzone"]);
for (const [name, actual] of cases) {
  if (!(name in byName)) { missing.push(name); continue; }
  const probe = DECLARED_ADDITIVE.has(name) && actual && typeof actual === "object"
    ? Object.fromEntries(Object.entries(actual).filter(([k]) => k !== "unreachable"))
    : actual;
  const r = cmp(probe, byName[name], name);
  if (r) { fail++; console.log(`FAIL ${r}`); }
  else pass++;
}
// DECLARED REMOVALS / RE-ANCHORS — oracle vectors that left the direct
// comparison above, each loudly, never silently:
//   · crypto_usdt (D2, v0.7.55): cryptoUsdt() deleted from src/lib/crypto.ts —
//     dead code in the Astro port, no page imported it; the P2P framing copy
//     covers the need. The vector has no TS counterpart to assert.
//   · paye_bonus_exempt_base (B2, v0.7.55): not compared against the STALE PHP
//     value (the PHP engine carries the same B2 defect); the corrected value
//     is asserted in the declared-divergence block below.
// See CHANGELOG 0.7.55 Divergences.
const DECLARED_REMOVALS = new Set(["crypto_usdt", "paye_bonus_exempt_base", "transfer_from_ng"]);
const extra = Object.keys(byName).filter((n) => !cases.some(([c]) => c === n) && !DECLARED_REMOVALS.has(n));
// ── DECLARED DIVERGENCE (v0.7.55, B2) ────────────────────────────────────────
// paye_bonus_exempt_base: the PHP oracle records tax 0 / net 200000 / rate 0
// for a bonus on an exempt base — the PHP engine carries the same B2 defect
// (unconditional zero) that the research deliverable confirmed wrong in law
// (NTA ss.4(2)(a)/26(2)/163(1)(t); verified 11 Oct 2026). The TS engine now
// applies the law, so the STALE PHP expectation is not asserted; the corrected
// behaviour is: taxable 662,400 + bonus 200,000 = 862,400 → first ₦800,000 at
// 0%, ₦62,400 at 15% = ₦9,360. The PHP engine in the retiring WP theme carries
// the same defect — flagged to the King, out of scope this mission. Documented
// in CHANGELOG 0.7.55 Divergences.
{
  const b = S.payeBonusTax(60000.0, 200000.0, 0.08);
  const r = cmp({ bonus: 200000.0, tax: 9360.0, net: 190640.0, rate: 0.0468 }, b, "paye_bonus_exempt_base[corrected]");
  if (r) { fail++; console.log(`FAIL ${r}`); }
  else pass++;
  console.log("DECLARED DIVERGENCE paye_bonus_exempt_base: PHP oracle tax=0 carries the B2 defect; TS applies NTA ss.4(2)(a)/26(2)/163(1)(t) (verified 11 Oct 2026), corrected value asserted. See CHANGELOG 0.7.55 Divergences.");
  console.log("DECLARED REMOVAL crypto_usdt: cryptoUsdt() deleted from src/lib/crypto.ts (D2, v0.7.55) — dead code; the P2P framing copy covers the need. See CHANGELOG 0.7.55 Divergences.");
}
// ── DECLARED COPY DIVERGENCE (fifth audit P0-4, King order) ──────────────────
// amount_1mngn.cfg.content.sections[3].body[1]: the parity oracle carries the
// PHP truth theme's transfer-splitting paragraph; the Astro port replaced it
// with the documentation sentence — declared divergence, the King's P0-4
// order (fifth audit, 2026-10-11): the threshold-dodging copy the PHP theme
// pinned is replaced by the documentation sentence. The leaf is excluded from
// the deep compare above; this guard fails loudly if the corrected copy ever
// regresses. Adds no pass row — the parity count stays 94/0.
// See the next ship's CHANGELOG.
{
  const d = A.amountPageData("1-million-naira-to-dollars", { ...liveFx, cached: true });
  const para = d && d.cfg.content.sections[3].body[1];
  if (!para || !para.includes("Larger transfers may need documentation — ask your bank what it requires.") || para.includes("splitting a large transfer")) {
    fail++;
    console.log("FAIL amount_1mngn[P0-4]: documentation sentence missing / splitting copy reverted (declared divergence guard)");
  }
  console.log("DECLARED DIVERGENCE amount_1mngn.cfg.content.sections[3].body[1]: declared divergence — the King's P0-4 order (fifth audit, 2026-10-11): the threshold-dodging copy the PHP theme pinned is replaced by the documentation sentence. See the next ship's CHANGELOG.");
}
// ── DECLARED DIVERGENCE (fifth audit P0-1, King order, v0.7.57) ──────────────
// transfer_from_ng: the PHP oracle snapshot records the P2P street premium
// MULTIPLIED into the payout (p2p rate = mid × 1.045, received 70.51 > Wise
// 67.07) — the exact $78.51-class defect the fifth audit's A5 marks [Certain]:
// selling naira on the street means the payout DIVIDES by the HIGHER ₦/$ street
// rate (₦100,000 ÷ (₦1,482 × 1.045) ≈ $64.57 at the oracle's own inputs), so
// P2P lands BELOW the official-rate payout, never above. The King's P0-1 order
// (fifth audit, 2026-10-11) overrules the stale PHP expectation; the TS engine
// applies the corrected direction and this guard fails loudly if the direction
// ever re-inverts. Adds one pass row in the B2 pattern — the parity count
// stays 94/0. See CHANGELOG 0.7.57 Divergences.
{
  const q = T.transferQuote(100000.0, "from-nigeria", "NGN", "USD", transferFx);
  const rowOf = (id) => q.rows.find((x) => x.id === id);
  const mid = 1.0 / 1482.0; // the oracle's own NGN/USD input, unchanged
  const p2p = rowOf("p2p"), wise = rowOf("wise"), bank = rowOf("bank");
  const problems = [];
  const r1 = cmp(p2p.rate, mid / 1.045, "transfer_from_ng[corrected].p2p.rate (street premium DIVIDES, never multiplies)");
  if (r1) problems.push(r1);
  const r2 = cmp(p2p.received, (100000.0 / 1482.0) / 1.045, "transfer_from_ng[corrected].p2p.received (₦100,000 ÷ (₦1,482 × 1.045))");
  if (r2) problems.push(r2);
  const r3 = cmp(wise.received, 67.0715249662618, "transfer_from_ng[corrected].wise.received (official-rate rows must not move)");
  if (r3) problems.push(r3);
  const r4 = cmp(bank.received, 65.13157894736842, "transfer_from_ng[corrected].bank.received (official-rate rows must not move)");
  if (r4) problems.push(r4);
  if (!(p2p.received < wise.received)) problems.push(`transfer_from_ng[corrected]: direction — P2P payout ${p2p.received} must sit BELOW the official-rate payout ${wise.received} (A5 acceptance)`);
  if (problems.length) { fail++; console.log(`FAIL ${problems.join("; ")}`); }
  else pass++;
  console.log("DECLARED DIVERGENCE transfer_from_ng: the PHP oracle snapshot multiplies the street premium INTO the P2P payout (the $78.51-class defect, fifth audit A5 [Certain]); the King's P0-1 order (2026-10-11) corrects the direction — the naira divides by the higher ₦/$ street rate, P2P below the official-rate payout. Stale PHP expectation not asserted; corrected values + direction fail-guarded. See CHANGELOG 0.7.57 Divergences.");
}
console.log(`\npass=${pass} fail=${fail} cases=${cases.length} vectors=${vectors.length}`);
if (missing.length) console.log("MISSING (no oracle):", missing.join(", "));
if (extra.length) console.log("UNTESTED (no case):", extra.join(", "));
const phpRed = Boolean(fail || missing.length || extra.length);

// ── Second oracle: scripts/independent-vectors.json (PROC-1, v0.7.54) ──────
//
// The PHP parity set above proves the TS engines are FAITHFUL to the ported
// PHP. It cannot prove them CORRECT: when the PHP carries a wrong assumption,
// the port reproduces it and this gate stays green. The independent oracle is
// a from-scratch vector set (audit 2026-10-08, Appendix B: NTA 2025 bands and
// rent relief; old PITA with CRA = max(₦200k, 1% of gross) + 20% of gross;
// standard annuity/IRR maths) computed WITHOUT the PHP sources, and it
// outranks parity: failure on EITHER oracle reddens the gate. The file is
// copied verbatim from the audit — never regenerate or hand-edit a value;
// divergences are findings, reported, not smoothed over.
const IV = JSON.parse(readFileSync(join(root, "scripts/independent-vectors.json"), "utf8"));

let indPass = 0;
const indFails = [];
const indInfo = [];
// Naira fields: the oracle's own tolerance (±₦1, its _meta).
function naira(actual, expected, label) {
  if (Math.abs(actual - expected) <= 1) { indPass++; return; }
  indFails.push(`${label}: engine ${actual} !== oracle ${expected} (Δ ${actual - expected})`);
}
// Percent / fractional fields: half of the oracle's last PRINTED digit, so a
// 2dp oracle value cannot hide a 1dp-sized drift (and 1dp cannot hide 0.1+).
function precise(actual, expected, label) {
  const s = String(expected), dot = s.indexOf(".");
  const tol = 0.5 * Math.pow(10, dot < 0 ? 0 : -(s.length - dot - 1));
  if (Math.abs(actual - expected) <= tol) { indPass++; return; }
  indFails.push(`${label}: engine ${actual} !== oracle ${expected} (Δ ${actual - expected})`);
}
function expect(actual, expected, label) {
  if (actual === expected) { indPass++; return; }
  indFails.push(`${label}: engine ${JSON.stringify(actual)} !== oracle ${JSON.stringify(expected)}`);
}

// tax — new/old annual tax + monthly take-home (+ rent relief where present).
IV.tax.forEach((r, i) => {
  const nw = S.payeCalculate(r.grossMonthly, 0.08, 0, r.rentAnnual, true);
  const ol = S.payeCalculate(r.grossMonthly, 0.08, 0, r.rentAnnual, false);
  const p = `tax[${i}] grossMonthly=${r.grossMonthly}`;
  naira(nw.tax_annual, r.newTaxYear, `${p}.newTaxYear`);
  naira(ol.tax_annual, r.oldTaxYear, `${p}.oldTaxYear`);
  naira(nw.net_monthly, r.takeHomeNewMonth, `${p}.takeHomeNewMonth`);
  naira(ol.net_monthly, r.takeHomeOldMonth, `${p}.takeHomeOldMonth`);
  if (r.rentRelief !== undefined) naira(nw.relief_annual, r.rentRelief, `${p}.rentRelief`);
});

// B2 bonus-on-exempt (v0.7.55) — a bonus lifting gross above the national
// minimum wage defeats the s.163(1)(t) exemption and the amount runs the band
// table (the first ₦800,000 of chargeable income is still 0%). NTA
// ss.4(2)(a)/26(2)/163(1)(t); verified 11 Oct 2026; the pre-fix engine
// returned 0. Hardcoded here — independent-vectors.json is the audit's
// verbatim set and is never hand-edited.
{
  const b = S.payeBonusTax(70000.0, 500000.0, 0.08);
  expect(b.tax > 0, true, "bonusOnExempt payeBonusTax(70000, 500000).tax (must be > 0; the pre-fix engine returned 0)");
}

// B3 unreachable (v0.7.55) — the reverse solver must SAY when the capped
// ₦100M/mo search cannot reach the target, never dress the ceiling up as an
// answer. The oracle's two rows sit inside the ceiling; a ₦200M/mo target
// cannot be reached and must flag.
IV.grossToNet.forEach((r, i) => {
  const g = G.reverseGross(r.targetNetMonth, 0.08);
  expect(g.unreachable, false, `grossToNet[${i}].unreachable (target inside the ceiling)`);
});
expect(G.reverseGross(200000000.0, 0.08).unreachable, true, "grossToNet beyondCeiling ₦200M/mo.unreachable (must flag)");

// taxWinnerNoRent8pct — the compare engine must name the right winner at each
// boundary (save_annual = new net − old net; a tie at gross 0, where both
// regimes levy zero, resolves to "new" exactly as the oracle lists it).
IV.taxWinnerNoRent8pct.forEach((r, i) => {
  const c = S.payeCompare(r.fromGrossMonthly, 0.08, 0, 0);
  expect(c.save_annual >= 0 ? "new" : "old", r.winner, `taxWinnerNoRent8pct[${i}] fromGrossMonthly=${r.fromGrossMonthly}.winner`);
});

// grossToNet — reverse solver gross/tax/pension per month.
IV.grossToNet.forEach((r, i) => {
  const g = G.reverseGross(r.targetNetMonth, 0.08);
  naira(g.gross_monthly, r.grossMonth, `grossToNet[${i}].grossMonth`);
  naira(g.tax_monthly, r.taxMonth, `grossToNet[${i}].taxMonth`);
  naira(g.pension_monthly, r.pensionMonth, `grossToNet[${i}].pensionMonth`);
});

// loanApr — the REAL effective APR behind the quoted rate.
IV.loanApr.forEach((r, i) => {
  const rep = r.type === "perDay"
    ? L.loanRepayment(r.principal, r.days, "days", r.ratePctPerDay, "daily")
    : r.type === "flatMonthly"
      ? L.loanRepayment(r.principal, r.months, "months", r.ratePctPerMonth, "flat")
      : L.loanRepayment(r.principal, r.months, "months", r.ratePctPerYear, "reducing");
  const p = `loanApr[${i}] ${r.type}`;
  if (r.installment !== undefined) naira(rep.installment, r.installment, `${p}.installment`);
  if (r.total !== undefined) naira(rep.total, r.total, `${p}.total`);
  precise(rep.apr * 100, r.effectiveAprPct, `${p}.effectiveAprPct`);
});

// compound — the year-end series under the engine's end-of-period convention.
IV.compound.forEach((r, i) => {
  if (r.depositTiming !== "end") {
    // Start-of-period deposits are an ALTERNATIVE convention this engine does
    // not implement (CALC-9, v0.7.47: "Deposits land at the end of each
    // period"; a start/end toggle is a separate leg). Informational.
    indInfo.push(`compound[${i}] depositTiming=${r.depositTiming}: fv ${r.fv} — start-of-period convention, engine is end-of-period (CALC-9); informational, not gated`);
    return;
  }
  const rows = SV.compoundSchedule(r.principal, r.deposit, r.ratePctPerYear / 100, r.years * 12, r.compounding, r.depositFreq);
  r.yearEnd.forEach((exp, y) => naira(rows[y].balance, exp, `compound[${i}].yearEnd[${y}]`));
});

// savingsGoal — required monthly deposit.
IV.savingsGoal.forEach((r, i) => {
  const plan = SV.savingsCalculate(r.target, r.haveNow, r.ratePctPerYear / 100, r.months, "monthly");
  naira(plan.monthly, r.monthly, `savingsGoal[${i}].monthly`);
});

// nairaValue — future price / worth-today / inflation-adjusted saving.
IV.nairaValue.forEach((r, i) => {
  if (r.amount !== undefined) {
    const nv = NV.nairaValue(r.amount, r.inflationPct / 100, r.years);
    naira(nv.future, r.futurePrice, `nairaValue[${i}].futurePrice`);
    precise(nv.lost_fraction * 100, r.lostPct, `nairaValue[${i}].lostPct`);
  } else if (r.futureAmount !== undefined) {
    const pv = NV.nairaValuePv(r.futureAmount, r.inflationPct / 100, r.years);
    naira(pv.pv, r.worthToday, `nairaValue[${i}].worthToday`);
    precise(pv.discount_rate * 100, r.retainedPct, `nairaValue[${i}].retainedPct`);
    precise(100 - pv.discount_rate * 100, r.discountPct, `nairaValue[${i}].discountPct`);
  } else {
    const save = NV.nairaValueSave(r.goalToday, r.saved, r.returnPct / 100, r.inflationPct / 100, r.months / 12);
    naira(save.real_monthly, r.monthly, `nairaValue[${i}].monthly`);
    naira(save.gap_monthly, r.extraVsNominal, `nairaValue[${i}].extraVsNominal`);
  }
});

// dividend — only the engine's CURRENT convention is gated ("growth before
// first payment"). The other two oracle rows (year 1 at today's dividend; 10%
// WHT — dividendProject has no WHT parameter) are ALTERNATIVE conventions,
// carried for the record; the CALC-4 fix may promote them later.
IV.dividend.forEach((r, i) => {
  if (r.convention !== "growth before first payment") {
    indInfo.push(`dividend[${i}] "${r.convention}": endValue ${r.endValue} — alternative convention, not implemented by dividendProject(); informational, not gated`);
    return;
  }
  const d = D.dividendProject(r.investment, r.price, r.dps, r.priceGrowthPct / 100, r.dividendGrowthPct / 100, r.years, r.mode === "drip");
  naira(d.end_value, r.endValue, `dividend[${i}].endValue`);
  naira(d.cash_total, r.totalDividends, `dividend[${i}].totalDividends`);
  precise(d.cagr * 100, r.cagrPct, `dividend[${i}].cagrPct`);
});

// emergencyFund — incl. the moving-target finish line (v0.7.44 bisection).
IV.emergencyFund.forEach((r, i) => {
  const em = EM.emergencyFund(r.essentials, r.saved, r.monthly, r.coverMonths, r.inflationPct / 100);
  const p = `emergencyFund[${i}]`;
  naira(em.target, r.target, `${p}.target`);
  naira(em.gap, r.gap, `${p}.gap`);
  precise(em.runway_now, r.runwayMonths, `${p}.runwayMonths`);
  // monthsNominal is what the page prints beside the real answer, derived from
  // engine outputs exactly as the page does (gap ÷ monthly saving).
  precise(em.gap / r.monthly, r.monthsNominal, `${p}.monthsNominal (page-derived gap/monthly)`);
  precise(em.months_to_reach, r.monthsToMovingTarget, `${p}.monthsToMovingTarget`);
  expect(Math.ceil(em.months_to_reach), r.wholeMonthsToMovingTarget, `${p}.wholeMonthsToMovingTarget`);
  // realTargetAtNominalHorizon is NOT an engine output (engine real_target sits
  // at the moving-target horizon), so there is nothing to gate it against.
  indInfo.push(`${p}.realTargetAtNominalHorizon ${r.realTargetAtNominalHorizon} — not an engine output (engine real_target is at the moving-target horizon); informational, not gated`);
});

// budget503020 — the split plus the needs slice in exact naira. The oracle
// names the allocator's "utilities" bucket "bills".
IV.budget503020.forEach((r, i) => {
  const b = B.budget503020(r.income);
  naira(b.needs, r.needs, `budget503020[${i}].needs`);
  naira(b.wants, r.wants, `budget503020[${i}].wants`);
  naira(b.savings, r.savings, `budget503020[${i}].savings`);
  const buckets = Object.fromEntries(AL.budgetAllocator(r.income).buckets.map((x) => [x.id, x.amount]));
  for (const [k, exp] of Object.entries(r.needsShares)) {
    naira(buckets[k === "bills" ? "utilities" : k] ?? NaN, exp, `budget503020[${i}].needsShares.${k}`);
  }
});

console.log(`\nindependent: pass=${indPass} fail=${indFails.length} informational=${indInfo.length} rows=${IV.tax.length + IV.taxWinnerNoRent8pct.length + IV.grossToNet.length + IV.loanApr.length + IV.compound.length + IV.savingsGoal.length + IV.nairaValue.length + IV.dividend.length + IV.emergencyFund.length + IV.budget503020.length} (scripts/independent-vectors.json, generated ${IV._meta.generated})`);
for (const line of indInfo) console.log(`INFO ${line}`);
for (const f of indFails) console.log(`FAIL ${f}`);
if (indFails.length) console.log("\nindependent oracle: DIVERGENCE — a finding, not a defect to smooth over. Do not edit the vector or the engine to clear it; report it.");
// ── Third oracle: scripts/appendix-a-vectors.json (fifth audit Appendix A, 2026-10-11) ──
//
// The independent oracle above is law-derived but was seeded from the same
// audit pass that found the CRA-floor bug. The fifth audit's Appendix A
// derives its vectors from the STATUTE and first principles — independently of
// both earlier oracles — and extends coverage where set #2 was thin (the NMW
// boundary at ₦72,464/mo, ₦600k/₦2M/₦10M gross rows, the ₦100k net→gross row,
// the rent variant of the reverse solver, and flat 5%/mo × 12 APR). Same
// tolerances as the independent oracle: naira ±₦1 (the audit's own), percent /
// fractional fields to half the printed digit. Gated vs informational EXACTLY
// as the file's _meta.gating map records; every informational row prints an
// INFO line naming its promote condition. Failure on ANY gated row reddens the
// gate — and is a FINDING, reported verbatim, never smoothed over.
const AV = JSON.parse(readFileSync(join(root, "scripts/appendix-a-vectors.json"), "utf8"));

let aPass = 0;
const aFails = [];
const aInfo = [];
function aNaira(actual, expected, label) {
  if (Math.abs(actual - expected) <= 1) { aPass++; return; }
  aFails.push(`${label}: engine ${actual} !== oracle ${expected} (Δ ${actual - expected})`);
}
function aPrecise(actual, expected, label) {
  const s = String(expected), dot = s.indexOf(".");
  const tol = 0.5 * Math.pow(10, dot < 0 ? 0 : -(s.length - dot - 1));
  if (Math.abs(actual - expected) <= tol) { aPass++; return; }
  aFails.push(`${label}: engine ${actual} !== oracle ${expected} (Δ ${actual - expected})`);
}

// A1 · tax — new regime, 8% pension on gross, no NHF/NHIS (rent rows separate),
// plus the old-regime row (the CRA floor is fixed as of v0.7.55, so it gates).
AV.tax.forEach((r, i) => {
  const nw = S.payeCalculate(r.grossMonthly, 0.08, 0, 0, true);
  const p = `tax[${i}] grossMonthly=${r.grossMonthly}`;
  aNaira(nw.tax_annual, r.newTaxYear, `${p}.newTaxYear`);
  aNaira(nw.net_monthly, r.takeHomeNewMonth, `${p}.takeHomeNewMonth`);
});
AV.taxRent.forEach((r, i) => {
  const nw = S.payeCalculate(r.grossMonthly, 0.08, 0, r.rentAnnual, true);
  const p = `taxRent[${i}] grossMonthly=${r.grossMonthly} rentAnnual=${r.rentAnnual}`;
  aNaira(nw.tax_annual, r.newTaxYear, `${p}.newTaxYear`);
  aNaira(nw.net_monthly, r.takeHomeNewMonth, `${p}.takeHomeNewMonth`);
});
AV.taxOldRegime.forEach((r, i) => {
  const ol = S.payeCalculate(r.grossMonthly, 0.08, 0, 0, false);
  const p = `taxOldRegime[${i}] grossMonthly=${r.grossMonthly}`;
  aNaira(ol.tax_annual, r.oldTaxYear, `${p}.oldTaxYear`);
  aNaira(ol.net_monthly, r.takeHomeOldMonth, `${p}.takeHomeOldMonth`);
});

// A2 · net→gross — reverseGross() accepts annualRent (4th param, verified in
// src/lib/gross-to-net.ts), so the rent variant gates with the rest.
AV.grossToNet.forEach((r, i) => {
  const g = G.reverseGross(r.targetNetMonth, 0.08, 0, r.rentAnnual ?? 0);
  aNaira(g.gross_monthly, r.grossMonth,
    `grossToNet[${i}] targetNetMonth=${r.targetNetMonth}${r.rentAnnual ? ` rentAnnual=${r.rentAnnual}` : ""}.grossMonth`);
});

// A3 · loan — effective APR under the engine's seed convention. The perDay row
// has no numeric installment in the audit ("one payment"), so total + APR gate.
AV.loanApr.forEach((r, i) => {
  const rep = r.type === "perDay"
    ? L.loanRepayment(r.principal, r.days, "days", r.ratePctPerDay, "daily")
    : r.type === "flatMonthly"
      ? L.loanRepayment(r.principal, r.months, "months", r.ratePctPerMonth, "flat")
      : L.loanRepayment(r.principal, r.months, "months", r.ratePctPerYear, "reducing");
  const p = `loanApr[${i}] ${r.type}${r.months ? ` ×${r.months}` : ` ${r.days}d`}`;
  if (r.installment !== undefined) aNaira(rep.installment, r.installment, `${p}.installment`);
  if (r.total !== undefined) aNaira(rep.total, r.total, `${p}.total`);
  aPrecise(rep.apr * 100, r.effectiveAprPct, `${p}.effectiveAprPct`);
});
AV.loanFeeApr.forEach((r, i) => {
  aInfo.push(`loanFeeApr[${i}] ${r.label}: APR ≈ ${r.effectiveAprPct}% — loanRepayment()/loanEffectiveApr() carry no fee parameter; informational, promotes when the S3 fee feature lands`);
});

// A4 · dividend — the gross DRIP row is already gated in v1 (cross-note, not
// re-gated); the 10% WHT row waits on a WHT parameter (the S3 feature).
aInfo.push(`dividendGross "${AV.dividendGross[0].label}": end ${AV.dividendGross[0].endValue} · dividends ${AV.dividendGross[0].totalDividends} · CAGR ${AV.dividendGross[0].cagrPct}% — already gated in v1 (independent-vectors.json dividend[0]); cross-note, not re-gated`);
aInfo.push(`dividendWht "${AV.dividendWht[0].label}": end ${AV.dividendWht[0].endValue} · net dividends ${AV.dividendWht[0].totalNetDividends} · CAGR ${AV.dividendWht[0].cagrPct}% — dividendProject() has no WHT parameter; informational, promotes when the S3 WHT feature lands`);

// A5 · transfer — would FAIL today BY DESIGN (P0-1: the page shows $78.51 for
// P2P); informational until the direction fix lands, then they promote.
AV.transfer.forEach((r, i) => {
  aInfo.push(`transfer[${i}] ₦${r.amountNgn} → $${r.usd} (${r.rate}) — P0-1 pending (page shows $78.51 for P2P); informational, promotes when the P0-1 direction fix lands`);
});

// A6 · savings effective-annual — the engine computes nominal-periodic only.
aInfo.push(`savingsEffective effectiveAnnualMonthly ₦${AV.savingsEffective.effectiveAnnualMonthly}/mo vs the seed's nominal ₦${AV.savingsEffective.nominalMonthly}/mo (already gated in v1 as savingsGoal monthly 155690) — engine computes nominal-periodic only; informational, promotes when the P2-1 disclosure fix lands`);
aInfo.push(`savingsEffective effectiveYieldPct ${AV.savingsEffective.effectiveYieldPct}% of 15% nominal monthly — P2-1 disclosure finding; informational, same promote condition`);

// A7 · step-up deposits — inflationAdjustedGoal() has no yearly deposit-growth
// parameter (the P2-2 feature); the 0% baseline is v1's gated nairaValue row.
AV.stepUpDeposits.rows.forEach((r, i) => {
  aInfo.push(`stepUpDeposits[${i}] yearly growth ${r.growthPct}%: starting deposit ₦${r.monthly}/mo${r.growthPct === 0 ? " (0% baseline already gated in v1 as nairaValue[2].monthly 307188)" : ""} — inflationAdjustedGoal() has no yearly deposit-growth parameter; informational, promotes when the P2-2 feature lands`);
});

// A8 · emergency — the moving-target finish line gates (it is an engine
// output, and v1 gates it too — cross-note); the inflated target and the
// progress-vs-inflated reading are page derivations, informational.
{
  const em = EM.emergencyFund(AV.emergency.essentials, AV.emergency.saved, AV.emergency.monthly,
    AV.emergency.coverMonths, AV.emergency.inflationPct / 100);
  aPrecise(em.months_to_reach, AV.emergency.monthsToMovingTarget,
    "emergency.monthsToMovingTarget (also gated in v1 — cross-note)");
  aInfo.push(`emergency.inflatedTarget ${AV.emergency.inflatedTarget} — page-derivation row per the wiring map (the engine's progress_pct measures the NOMINAL target: 50% on this seed, not the inflated 44.0%); informational, promotes when the emergency-page derivation contract is next gated`);
  aInfo.push(`emergency.progressVsInflatedPct ${AV.emergency.progressVsInflatedPct}% = saved ÷ inflated target — page derivation, not an engine output; informational, same promote condition`);
}

// A9 · inflation-default — P1-3/D1 default-change context rows.
AV.inflationDefault.forEach((r, i) => {
  aInfo.push(`inflationDefault[${i}] ₦1M after 5y at ${r.inflationPct}%: ₦${r.futurePrice}${r.inflationPct === 24 ? " (already gated in v1 as nairaValue[0])" : ""} — P1-3/D1 default-change context row; informational, promotes when the D1 default-change decision lands`);
});

const aGatedRows = AV.tax.length + AV.taxRent.length + AV.taxOldRegime.length
  + AV.grossToNet.length + AV.loanApr.length + 1; // + the emergency 7.17 gate
console.log(`\nappendix-a: pass=${aPass} fail=${aFails.length} informational=${aInfo.length} gated rows=${aGatedRows} (scripts/appendix-a-vectors.json, generated ${AV._meta.generated}, ${AV._meta.source})`);
for (const line of aInfo) console.log(`INFO ${line}`);
for (const f of aFails) console.log(`FAIL ${f}`);
if (aFails.length) console.log("\nappendix-a oracle: DIVERGENCE — a finding, not a defect to smooth over. Do not edit the vector or the engine to clear it; report it.");
process.exit(phpRed || indFails.length || aFails.length ? 1 : 0);
