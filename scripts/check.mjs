// Umbrella gate for the finance-astro port — `npm run check`.
//
// package.json has always declared `check: node scripts/check.mjs`, but this
// file was missing from the tree, so the documented gate died with
// MODULE_NOT_FOUND and every release claimed "checks pass" against nothing.
// It now runs each repository gate in turn and fails if ANY of them fails.
//
// Adding a gate? Append its filename here; it must exit non-zero on failure.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const GATES = [
  "check-header-fidelity.mjs", // WP→Astro header port contract (source assertions)
  "check-footer-fidelity.mjs", // WP→Astro footer port contract (source assertions)
  "vectors-check.mjs", // every TS engine vs the PHP truth oracle
];

const failed = [];
for (const gate of GATES) {
  const rule = "─".repeat(Math.max(4, 58 - gate.length));
  console.log(`\n── ${gate} ${rule}`);
  const res = spawnSync(process.execPath, [join(here, gate)], { stdio: "inherit" });
  if (res.status !== 0) failed.push(`${gate} (exit ${res.status})`);
}

if (failed.length) {
  console.error(`\ncheck: FAIL — ${failed.length}/${GATES.length} gate(s) failed: ${failed.join(", ")}`);
  process.exit(1);
}
console.log(`\ncheck: PASS — ${GATES.length}/${GATES.length} gates green`);
