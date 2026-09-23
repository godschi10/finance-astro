// Article-surface gate — the port's single-post page.
//
// Why this gate exists: the header, footer and homepage each had a contract
// gate, but the article page (Phase 3, the surface the blog import is about to
// fill) had none, so nothing stopped a template edit from silently dropping a
// required element or a stylesheet from losing a rule the design depends on.
//
// Every assertion is source-level and deterministic: read the template and the
// layout stylesheet, assert the contract. No browser, no network.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const tpl = read("src/pages/articles/[slug].astro");
const layout = read("src/layouts/Layout.astro");
const schema = read("src/content.config.ts");

// Collapse whitespace so assertions survive reformatting.
const flat = (s) => s.replace(/\s+/g, " ");

const checks = [
  // ── the title stack ────────────────────────────────────────────────────
  ["title renders as an h1 with the art-h contract class", /<h1 class="art-h"[^>]*>\{d\.title\}<\/h1>/.test(tpl)],
  ["breadcrumb precedes the title", tpl.indexOf('class="crumbs"') < tpl.indexOf('class="art-h"')],
  ["category badge sits between breadcrumb and title",
    tpl.indexOf('class="crumbs"') < tpl.indexOf('class={`badge') &&
    tpl.indexOf('class={`badge') < tpl.indexOf('class="art-h"')],

  // ── the subtitle (net-new element: WordPress has no post subtitle) ─────
  ["subtitle element renders directly after the title",
    tpl.indexOf('class="art-h"') < tpl.indexOf('class="art-sub"')],
  ["subtitle precedes the meta row",
    tpl.indexOf('class="art-sub"') < tpl.indexOf('class="feat-meta"')],
  ["subtitle uses the authored field with the excerpt as fallback",
    /\{d\.subtitle \?\? d\.description\}/.test(tpl)],
  ["content model accepts an optional subtitle", /subtitle: z\.string\(\)\.optional\(\)/.test(schema)],
  ["no orphaned .art-lede left in the template or stylesheet",
    !/art-lede/.test(tpl) && !/art-lede/.test(layout)],

  // ── the subtitle's design contract (must match the theme's idiom) ──────
  [".art-sub styles the standfirst at --text-mid, weight 300",
    /\.art-sub\{[^}]*color:var\(--text-mid\)/.test(layout) && /\.art-sub\{[^}]*font-weight:300/.test(layout)],
  [".art-sub carries the theme's 3px --gold left rule",
    /\.art-sub\{[^}]*border-left:3px solid var\(--gold\)/.test(layout)],
  [".art-sub is inset to clear the rule", /\.art-sub\{[^}]*padding-left:16px/.test(layout)],
  [".art-sub holds a readable measure", /\.art-sub\{[^}]*max-width:62ch/.test(layout)],

  // ── the rest of the article page still holds ───────────────────────────
  ["reading progress bar present", /id="read-progress"/.test(tpl)],
  ["affiliate disclosure present", /class="disc-box"/.test(tpl)],
  ["article body container present", /class="art-body"/.test(tpl)],
  ["sidebar TOC renders from the extracted headings", /toc\.map\(\(t\) =>/.test(tpl)],
  ["share row present", /class="share-row"/.test(tpl)],
  ["author bio present", /class="author-bio"/.test(tpl)],
  ["related articles section present", /Keep reading/.test(tpl)],
  ["Article JSON-LD is emitted", /"@type": "Article"/.test(tpl)],
  ["JSON-LD escaping is applied", /replace\(\/<\/g, "\\\\u003c"\)/.test(tpl)],
  ["article stylesheet ships the title clamp", /\.art-h\{font-size:clamp\(1\.75rem,3\.8vw,2\.5rem\)/.test(layout)],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${flat(name)}`);
}

console.log(`\narticle gate: ${failed === 0 ? "PASS" : "FAIL"} — ${checks.length - failed}/${checks.length} assertions`);
if (failed) process.exit(1);
