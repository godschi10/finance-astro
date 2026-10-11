// Maintained-table staleness gate (P3-6, fifth audit, v0.7.58).
//
// The audit's finding, [Certain]: the hand-maintained tables — NGX prices,
// savings rates, transfer fees — carry a "verified <month>" stamp and NOTHING
// warns when it ages out. This gate is that warning, and it is deliberately a
// BUILD-BREAKING gate rather than a page banner: the tables are the inputs a
// YMYL reader makes a money decision on, so a table nobody has re-checked must
// stop the build rather than quietly publish a stale number with the same
// confidence as a fresh one. A banner is advisory; this is not.
//
// To fix a failure: re-check the named table against its source and update the
// date that module owns (the list below names the file). Do NOT edit the date
// here to silence this — this file owns no dates; it only reads theirs.
//
// Threshold: 45 days (src/lib/staleness.ts STALENESS_DAYS), the figure the
// audit names. A month-only stamp resolves to the last day of that month.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// The vectors gate bundles the same engine through esbuild; reuse the shape.
const tmp = mkdtempSync(join(tmpdir(), "staleness-"));
const entry = join(tmp, "entry.ts");
const out = join(tmp, "bundle.cjs");
writeFileSync(entry, `export * as staleness from ${JSON.stringify(join(root, "src/lib/staleness.ts"))};`);
await build({ entryPoints: [entry], bundle: true, format: "cjs", platform: "node", outfile: out, logLevel: "silent" });
const { staleness: S } = (await import(`file://${out}`)).default ?? {};
rmSync(tmp, { recursive: true, force: true });

const rows = S.stalenessReport();
let fail = 0, pass = 0;
const problems = [];

console.log(`maintained-table staleness — threshold ${S.STALENESS_DAYS} days\n`);
for (const r of rows) {
  const age = r.ageDays === null ? "UNKNOWN (stamp not parseable)" : `${r.ageDays}d`;
  const state = r.future ? "FUTURE" : r.stale ? "STALE" : "ok";
  console.log(`  ${state.padEnd(8)} ${String(age).padStart(10)}  ${r.verifiedOn.padEnd(10)}  ${r.label}`);
  if (r.future) problems.push(`${r.id}: verifiedOn "${r.verifiedOn}" is in the FUTURE — that is a typo, not freshness (fix ${r.source})`);
  else if (r.ageDays === null) problems.push(`${r.id}: verifiedOn "${r.verifiedOn}" could not be parsed as a date — fix the stamp in ${r.source}`);
  else if (r.stale) problems.push(`${r.id}: ${r.verifiedOn} is ${r.ageDays} days old (threshold ${S.STALENESS_DAYS}) — re-check and update the date in ${r.source}`);
}

// The date resolvers themselves are gated: a resolver that silently returned
// "today" would make every table look permanently fresh.
const unit = [
  ["ageInDays parses ISO day", S.ageInDays("2026-10-11", new Date("2026-10-20T00:00:00Z")) === 9],
  ["ageInDays resolves month-only to the LAST day", S.ageInDays("2026-09", new Date("2026-09-30T00:00:00Z")) === 0 && S.ageInDays("2026-09", new Date("2026-10-01T00:00:00Z")) === 1],
  ["ageInDays reads the house 'September 2026' stamp", S.ageInDays("September 2026", new Date("2026-10-01T00:00:00Z")) === 1],
  ["ageInDays returns null for an unreadable stamp", S.ageInDays("sometime last year", new Date()) === null],
  ["a future stamp is reported, not treated as fresh", S.ageInDays("2026-10-11", new Date("2026-10-01T00:00:00Z")) === -10],
  ["every maintained table carries a resolvable date", rows.every((r) => r.ageDays !== null)],
  ["the table list is not empty", rows.length >= 4],
];
console.log("");
for (const [name, ok] of unit) {
  if (ok) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}`); }
}

if (problems.length) {
  fail += problems.length;
  console.log("");
  for (const p of problems) console.log(`FAIL  ${p}`);
}

console.log(`\nmaintained-table staleness: ${fail ? "FAIL" : "PASS"} — ${pass} unit assertion(s), ${problems.length} table(s) needing a re-check`);
if (fail) {
  console.log("\nRe-check each table above against its source and update THAT module's date.");
  console.log("Do not edit a date to silence this gate: it owns no dates, it only reads theirs.");
}
process.exit(fail ? 1 : 0);