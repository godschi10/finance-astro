/* tool-manifest.ts — ONE list of the fifteen money tools (v0.7.21 leg D2; 16→15 on the 2026-10-07 merge below).
 *
 * WHY A SEPARATE FILE AND NOT tool-fields.ts: tool-fields.ts imports
 * ../scripts/smart-fields.js, which touches `document` at MODULE SCOPE and
 * therefore cannot be evaluated by Node or by Astro's server renderer:
 *
 *   smart-fields.js:209  if (document.readyState === "loading") document.addEventListener(...)
 *   smart-fields.js:210  else boot();
 *
 * All seventeen tool pages import tool-fields from their CLIENT <script>
 * block only, so that has never mattered. It matters here: the hub page reads
 * this manifest from its FRONTMATTER, which is server-rendered. Verified:
 * `node -e "import('./src/scripts/smart-fields.js')"` throws
 * ReferenceError: document is not defined. So this file imports NOTHING and
 * can be read by the server, by a page, and by a plain node script alike.
 *
 * ── SCOPE: identity + navigation + share-card. NOT the copy. ─────────────────
 * Measured across the sixteen <ToolShell> blocks: 250 lines total. Exactly two
 * of those props are pure IDENTITY — `slug` (== the page filename) and
 * `ogImage` (url `tool-${slug}.png`, 1200x630, alt == the hero `tool`, all 16
 * identical). The other 207 lines are page-level SEO copy ported from the live
 * WordPress template with its citations intact: title, description, lede,
 * verified, badge, faqs, copy, disclaimer, related, ctas. That copy STAYS IN
 * THE PAGE. Moving 400+ lines of ported editorial into a data file to win a
 * cosmetic DRY prize would trade one kind of truth for another and put a
 * finger on every citation in the port.
 *
 * What genuinely duplicated, and is fixed here:
 *   1. the hub's own 16-entry `tools[]` literal — a SECOND hand-maintained
 *      list of the same sixteen slugs (it even carried its own title/desc that
 *      disagreed with src/data/content.ts's TOOLS). It is now this list.
 *   2. the og card URL, repeated on all sixteen pages. Derived below.
 * Two names per tool, both real and both kept, because they are both shipped:
 *   - `tool` — the live hero H1 (ToolShell `tool` prop), verbatim per tool.
 *     The converter says "Dollar to Naira & Every Currency" where the hub card
 *     says "Currency Converter"; the tax page says "Nigeria Tax Calculator
 *     2026" where the hub card says "Nigeria Tax Calculator".
 *   - `title` — the hub card title, verbatim from page-tools.php.
 * There is deliberately NO chip/badge field: measured, `badge` is 16 DIFFERENT
 * strings (one even built from the FX snapshot at build time), so a shared
 * chip label would be an invention, not a de-duplication.
 *
 * THE ORDER BELOW IS THE HUB'S PRINT ORDER (page-tools.php template order) and
 * is part of the port contract — do not sort it.
 *
 * ── MERGE 2026-10-07 (King's order: "2" MERGE) ─────────────────────────
 * `50-30-20-budget-calculator` and `budget-allocator` used to ship on the hub
 * as a pair ("First: split…" / "Second: break the needs half…" — that wording
 * itself was the 2026-10-05 fix for the pair reading as one calculator printed
 * twice: 🧮 + yellow stayed with the rule, the allocator took 📋 + orange).
 * They are one tool now: the allocator's needs-half buckets (rent, food,
 * transport, data, bills) live as STEP 2 inside the 50/30/20 page, fed by the
 * plan's needs figure (income × needs%), and the old allocator URL is a
 * pointer (meta-refresh + canonical + noindex, no duplicate content). So the
 * allocator row below is GONE and the 50/30/20 row owns both steps — one
 * journey, not "First / Second" pages.
 *
 * NOT here, by design: `amount` and the 79 `[amount].astro` routes. That family
 * has ONE shared share card (tool-amount.png) for every slug and is registered
 * in lib/amount.ts; ogCardFor() returns null for anything not in this table,
 * so the amount family keeps passing its own ogImage explicitly.
 */

export interface ToolEntry {
  /** the route slug — the page filename, and the og card stem. */
  slug: string;
  /** the live hero H1, verbatim (ToolShell `tool`). Differs from `title`. */
  tool: string;
  /** the hub card title, verbatim from page-tools.php. */
  title: string;
  /** the hub card emoji tile glyph, verbatim. */
  emoji: string;
  /** the hub card tile gradient, "--tile,--tile-b" — verbatim. */
  grad: string;
  /** the hub card blurb, verbatim. */
  desc: string;
}

/** The one list, in hub print order. Every tool that has a page is here. */
export const TOOL_MANIFEST: ToolEntry[] = [
  { slug: "currency-converter", tool: "Dollar to Naira & Every Currency", title: "Currency Converter", emoji: "💱", grad: "#fef3c7,#fcd34d", desc: "Convert Naira to Dollar, Pound and Euro at today’s live rate, any amount, instantly." },
  { slug: "salary-tax-calculator", tool: "Nigeria Tax Calculator 2026", title: "Nigeria Tax Calculator", emoji: "🧾", grad: "#dcfce7,#86efac", desc: "Work out your take-home pay under the Nigeria Tax Act 2025, the new 0% band, rent relief and an old-vs-new comparison." },
  { slug: "savings-goal-calculator", tool: "Savings Goal Calculator", title: "Savings Goal Calculator", emoji: "🎯", grad: "#ede9fe,#c4b5fd", desc: "See exactly how much to save each month to hit your target, with compound interest built in." },
  { slug: "exchange-rate-history", tool: "$ USD to Naira Rate History", title: "Rate History Chart", emoji: "📈", grad: "#fce7f3,#fbcfe8", desc: "See the dollar to naira trend over 30 and 90 days, the real recorded rates, updated daily." },
  { slug: "compound-interest-calculator", tool: "Compound Interest Calculator", title: "Compound Interest Calculator", emoji: "📊", grad: "#e0f2fe,#bae6fd", desc: "See how your savings grow with compound interest, project your balance year by year." },
  { slug: "inflation-savings-calculator", tool: "Inflation-Adjusted Savings Calculator", title: "Inflation Savings Calculator", emoji: "🔥", grad: "#fee2e2,#fecaca", desc: "See what inflation really does to your savings goal, and how much more you must save each month." },
  { slug: "gross-to-net-calculator", tool: "Gross to Net Calculator", title: "Gross to Net Calculator", emoji: "💰", grad: "#ccfbf1,#99f6e4", desc: "Start from the take-home pay you want and find the gross salary you need, under NTA 2025." },
  { slug: "50-30-20-budget-calculator", tool: "50/30/20 Budget Calculator", title: "50/30/20 Budget Calculator", emoji: "🧮", grad: "#fef9c3,#fde047", desc: "Split your take-home pay into needs, wants and savings, check real spending against the plan — then break the needs half into rent, food, transport, data and bills. Two steps, one page." },
  { slug: "naira-value-calculator", tool: "Naira Value Calculator", title: "Naira Value Calculator (Inflation / Depreciation)", emoji: "💸", grad: "#fef9c3,#fde047", desc: "What is ₦1M today really worth in 5 years? See how inflation erodes the naira, and what future money is worth today." },
  { slug: "crypto-profit-calculator", tool: "Crypto Profit Calculator", title: "Crypto Profit Calculator (Naira, P2P-aware)", emoji: "🪙", grad: "#fef9c3,#fde047", desc: "Work out the real naira profit on a crypto trade, with the P2P buy/sell spread shown as its own cost." },
  { slug: "dividend-calculator", tool: "Dividend & ROI Estimator", title: "Dividend / ROI Estimator (Nigerian Stocks, NGX)", emoji: "📈", grad: "#fef9c3,#fde047", desc: "Project the total return of a Nigerian dividend stock, with the DRIP reinvestment effect shown year by year, in naira." },
  { slug: "emergency-fund-calculator", tool: "Emergency Fund Calculator", title: "Emergency Fund Calculator (Naira, Inflation-adjusted)", emoji: "🛟", grad: "#fef9c3,#fde047", desc: "How many months of runway does your savings cover? Get the naira target, time to reach it, and the inflation-adjusted amount." },
  { slug: "loan-repayment-calculator", tool: "Loan Repayment Calculator", title: "Loan Repayment Calculator", emoji: "💰", grad: "#fee2e2,#fca5a5", desc: "See the true cost of a Nigerian loan, enter the rate as the lender quotes it and get the real APR." },
  { slug: "money-transfer-comparator", tool: "Send Money to Nigeria, Best Rate", title: "Money-Transfer Comparator", emoji: "🔁", grad: "#cffafe,#67e8f9", desc: "Compare Wise, Remitly, Western Union, WorldRemit & LemFi on fee + real rate, who actually gets you the most." },
  { slug: "savings-rate-comparator", tool: "Best Savings Rate in Nigeria", title: "Savings Rate Comparator", emoji: "🏦", grad: "#ecfccb,#bef264", desc: "Who pays the most on your savings right now, PiggyVest, Cowrywise, Kuda, Renmoney, FairMoney + FD rates." },
];

/** slug -> entry. The join every consumer does. */
export const TOOL_BY_SLUG: Record<string, ToolEntry> = Object.fromEntries(
  TOOL_MANIFEST.map((t) => [t.slug, t])
);

/** The fifteen slugs, hub order. */
export const TOOL_SLUGS: string[] = TOOL_MANIFEST.map((t) => t.slug);

export interface OgCard {
  url: string;
  width: number;
  height: number;
  alt: string;
}

/* The share card, derived. scripts/gen-og.mjs emits one PNG per entry at
   `tool-<slug>.png`, 1200x630 (og-card.mjs), so the URL is a function of the
   slug and never needs to be written by hand again. The alt is the hero H1 —
   verified equal to the hand-written alt on every tool page, so dropping
   the prop changes no served byte.
   Returns null for a slug that is not one of the fifteen (the amount family),
   which is what keeps `[amount].astro` on its own shared card. */
export function ogCardFor(slug: string): OgCard | null {
  const t = TOOL_BY_SLUG[slug];
  if (!t) return null;
  return { url: `images/og/tool-${slug}.png`, width: 1200, height: 630, alt: t.tool };
}

export default TOOL_MANIFEST;
