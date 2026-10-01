// R2 one-shot codemod (spec step 2). Idempotent; prints a per-file report.
// 1) Insert the pm() parse-tolerant def as the first line of the page's
//    inline <script> (only in the 15 pages that had type=number inputs).
// 2) Replace every money-input read Number(g("id").value) / Number(x.value)
//    with pm(...). Selects (.value on selects, sel("id"), xh-days) untouched.
import fs from "node:fs";

const FILES = [
  "50-30-20-budget-calculator", "budget-allocator", "compound-interest-calculator",
  "crypto-profit-calculator", "currency-converter", "dividend-calculator",
  "emergency-fund-calculator", "gross-to-net-calculator", "inflation-savings-calculator",
  "loan-repayment-calculator", "money-transfer-comparator", "naira-value-calculator",
  "salary-tax-calculator", "savings-goal-calculator", "savings-rate-comparator",
].map((s) => `src/pages/money-tools/${s}.astro`);

const PM = `const pm = v => { const n = Number(String(v).replace(/[^\\d.eE-]/g, '')); return Number.isFinite(n) ? n : 0; };`;
let totalReplaced = 0;
for (const f of FILES) {
  let src = fs.readFileSync(f, "utf8");
  const before = src;
  if (!src.includes("const pm = v =>")) {
    const idx = src.indexOf("<script>\n");
    if (idx === -1) { console.log(`SKIP ${f}: no inline <script>`); continue; }
    const at = idx + "<script>\n".length;
    src = src.slice(0, at) + PM + "\n" + src.slice(at);
  }
  let n = 0;
  src = src.replace(/Number\((g\("[^"]+"\)\.value)\)/g, (_, inner) => { n++; return `pm(${inner})`; });
  src = src.replace(/Number\((amt|inc|inp)\.value\)/g, (_, v) => { n++; return `pm(${v}.value)`; });
  totalReplaced += n;
  if (src !== before) fs.writeFileSync(f, src);
  console.log(`${f}: pm-reads replaced=${n}`);
}
console.log(`TOTAL replaced: ${totalReplaced} (expected 54)`);
