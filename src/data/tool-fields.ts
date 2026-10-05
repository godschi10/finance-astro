/* tool-fields.ts — the per-tool smart-fields table (v0.7.20 leg C).
 *
 * ONE table, sixteen tools plus the amount family. Every money page declares
 * what is OURS (seeds), what we can honestly DERIVE (offers), what is TRUE
 * ABOUT THE WORLD with a live citation (context), and what may be REMEMBERED.
 * The page itself keeps its own maths; this file only describes the fields.
 *
 * ── THE SEED RULE, made auditable ──────────────────────────────────────────
 * A field is a seed when, and only when, its rendered value is NON-ZERO and WE
 * chose it. A field that renders ₦0 is not a scenario we invented — it is an
 * honest blank that means "none of this applies to you" (rent, NHF, NHIS, life
 * assurance, flat charges), so it stays plain. Badging four ₦0s would bury the
 * one field the visitor came to change (spec §7.3, the per-field ✕ argument).
 * Consequence, and it is the point: EVERY non-zero number on every one of these
 * pages now wears SAMPLE, so no receipt figure can be mistaken for the user's.
 *
 * ── THE DIRECTION LAW (spec §2b) — why there is exactly ONE offer ──────────
 * Derive ₦ from %. Never % from ₦. Never auto-solve the 50/30/20 split. The
 * research refuses the split because the three % seeds sum to exactly 100, so a
 * derive-on-load fires before the user touches anything. Everywhere else on
 * these sixteen pages a % input does NOT yield an amount that belongs in a
 * field: the allocator's bucket amounts are already in its receipt, the
 * inflation tools' inflated goals are not the goal-in-today's-naira the field
 * holds, and the emergency target would claim the visitor has already saved the
 * finish line. Those are echoes or nothing — not offers. Shipping one offer per
 * screen that is real beats shipping four that invent.
 *
 * ── THE CONTEXT LAW (spec §2c) — NO URL, NO LINE ───────────────────────────
 * Every line below carries a real href and a visible stamp, and none of them
 * makes a claim about the USER: they are claims about the world, read-only, and
 * a .ctx is never tappable into a field. The research's median-salary CHIP is
 * refused here exactly as the designer refused it. Two candidate lines did NOT
 * ship and are recorded as refusals rather than quietly dropped: the 8%
 * statutory pension (no citable URL in repo or research — no URL, no line) and
 * "Lagos rent is 30–40% of take-home" (spec §2c: ships only if @builder can
 * cite it; I cannot, so it does not ship).
 *
 * ── REMEMBER — the wrong-number law (spec §2g) ─────────────────────────────
 * The spine hard-refuses st-rent, gn-rent and st-gross. This table goes one
 * step further and never lists them either. It also never lists the payroll
 * relief/deduction fields (st-nhf, st-nhis, st-life, gn-nhf, gn-nhis, gn-life,
 * gn-other): a stale remembered NHF silently moves a take-home claim, which is
 * the same wrong-number class as a remembered rent. Everything else remembers
 * freely — the spine dates it, expires it at 30 days and marks it LAST USED.
 */

import smartFields from "../scripts/smart-fields.js";
import { pm } from "../scripts/pm.js";
import { budget503020 } from "../lib/budget";
import { formatGrouped } from "../lib/format";

/* One small helper, used by the one offer and by nothing else. Browser-only
   module: it is imported exclusively by client scripts, so `document` is
   always present when these closures run. */
type Get = (id: string) => string;
export interface SfOffer { field: string; text: string | (() => string); use: number | (() => number); hideUntil?: string[]; }
export interface SfCtx { field: string; text: string; src: string; href: string; }
export interface SfTool {
  /** localStorage namespacing key. */
  tool: string;
  /** ids wearing SAMPLE: non-zero defaults WE chose. */
  seeds: string[];
  /** derived-value offers. See the direction law above. */
  derive: SfOffer[];
  /** sourced, read-only context lines. */
  context: SfCtx[];
  /** ids allowed to persist. Never rent, gross or payroll reliefs. */
  remember: string[];
  /** ids that must be non-empty for the receipt to show figures at all. */
  required: string[];
}

const gv: Get = (id) => {
  const el = document.getElementById(id) as HTMLInputElement | null;
  return el ? el.value : "";
};

const ngn = (v: number) => "₦" + formatGrouped(v, 0);

/* The card-level posture line, spec §4.1 — one line, above the grid, .echo-
   railed. Static markup in every page; only its `hidden` is toggled. */
export const SF_CARD_LINE = "Nothing here is filled in for you. Enter your numbers — the receipt waits.";
export const SF_FOOT_LINE = "Nothing entered · no figures invented";

/* §4 the empty state, in one call. PROSE-vs-STRUCTURE: the labels and the rows
   stay on screen so the receipt reads as WAITING; only the figures are withheld
   as a dimmed "—". No gold ₦0 anywhere. The page's own honest rails
   (.receipt-note / .bar-note) are untouched and keep saying their own words. */
/* §4 the empty state, in one call, page-agnostic. PROSE-vs-STRUCTURE: the
   labels and the rows stay on screen so the receipt reads as WAITING; only the
   figures are withheld as a dimmed "—". No gold ₦0 anywhere. Every receipt on
   the page is handled (naira-value has three), and savings-rate-comparator's
   receipt sits outside any .fx-card — so this is document-scoped by design,
   which is safe because exactly one tool page is ever loaded. The page's own
   honest rails (.receipt-note / .bar-note) are untouched and keep their words. */
export function sfEmpty(isEmpty: boolean): void {
  paintEmpty(isEmpty);
  if (isEmpty) holdOffer(true);
}

/* The offer is a derived FIGURE too: left alone it reads "Plan puts needs at
   ₦0" the moment everything is cleared, which is the exact gold-family ₦0 §4.5
   forbids. The spine re-paints offer text on every input, so the honest line
   has to be re-applied AFTER it — which is what the Clear-examples listener
   below does. Between those moments the pill is also made inert, so it cannot
   be pressed into writing 0 into a field. */
const OFFER_HELD = "Set an income and this figure appears here.";
function holdOffer(hold: boolean): void {
  document.querySelectorAll(".offer").forEach((p) => {
    const s = p.querySelector("span");
    const b = p.querySelector("b");
    if (hold) {
      if (s && !kept.has(s)) kept.set(s, s.textContent || "");
      if (s) s.textContent = OFFER_HELD;
      if (b) { b.setAttribute("aria-disabled", "true"); b.style.pointerEvents = "none"; b.style.opacity = ".45"; }
    } else {
      if (s && kept.has(s)) s.textContent = kept.get(s) || "";
      if (b) { b.removeAttribute("aria-disabled"); b.style.pointerEvents = ""; b.style.opacity = ""; }
    }
  });
}

/* The spine's clearExamples() empties the receipt AFTER it dispatches the
   per-field `input` events, so on the last field the page has already rendered
   with the badge still on screen — the card line would then lag the receipt by
   one keystroke. This one delegated listener re-syncs the two halves the
   instant Clear examples is pressed. It is registered once, lazily, by the
   first sfEmpty() call, so pages with no seeds never pay for it. */
let syncing = false;

/* The spine withholds .receipt-fig and .receipt-row b. §4's rule is stricter:
   "PROSE-vs-STRUCTURE — .receipt-fig and the row values are FIGURES → withhold."
   So .receipt-sub is handled too, but per §4.4 it does NOT become a bare dash:
   it carries the rail voice verbatim from the spec —
   "Enter your numbers above — empty counts as ₦0." — so the line under the
   hero keeps TALKING instead of leaving a confident gold-family ₦0 sitting
   under a dimmed dash. That is exactly the failure §4.5 forbids.
   PROSE is untouched by design: .receipt-note and .bar-note carry the pages'
   own honest rails (warnings, comparisons) and the brief requires those keep
   working unchanged. */
const FIGURES = ".receipt-fig, .receipt-row b, [data-sf-fig]";
const SUB_VOICE = "Enter your numbers above — empty counts as ₦0.";
const kept = new Map<Element, string>();

function paintEmpty(isEmpty: boolean): void {
  const line = document.querySelector("[data-sf-card]");
  if (line) line.hidden = !isEmpty;
  document.querySelectorAll(".receipt").forEach((r) => {
    const foot = r.querySelector("[data-sf-foot]");
    if (foot) foot.hidden = !isEmpty;
    let said = false; // one voice line per receipt
    if (isEmpty) {
      /* Capture BEFORE the spine blanks, or "—" would become the restore value. */
      r.querySelectorAll(FIGURES).forEach((n) => { if (!kept.has(n)) kept.set(n, n.textContent || ""); });
    }
    smartFields.markEmpty(r, isEmpty);
    r.querySelectorAll(".receipt-sub").forEach((n) => {
      if (isEmpty) {
        /* Capture BEFORE overwriting, so the live text comes back intact. */
        if (!kept.has(n)) kept.set(n, n.textContent || "");
        /* One voice line per RECEIPT, not per page: naira-value has three
           receipts and each needs its own, while 50/30/20's single receipt has
           two .receipt-sub lines and must speak once. */
        if (!said) { n.textContent = SUB_VOICE; said = true; }
        else if (/₦/.test(n.textContent || "")) n.textContent = "";
      } else if (kept.has(n)) n.textContent = kept.get(n) || "";
    });
    if (isEmpty) {
      r.querySelectorAll(FIGURES).forEach((n) => { n.textContent = "—"; });
    } else {
      /* Live text is authoritative again — the page's own render() rewrites
         these on every input, so restoring the captured text can never drift. */
      r.querySelectorAll(FIGURES).forEach((n) => { if (kept.has(n)) n.textContent = kept.get(n) || ""; });
    }
  });
}

export const TOOL_FIELDS: Record<string, SfTool> = {

  /* 1 — 50/30/20. The flagship: seven worked examples, all marked, all
     removable in one tap. bg-save is the user's own split and is NEVER offered
     a value (research §7.2). */
  "50-30-20-budget-calculator": {
    tool: "50-30-20",
    seeds: ["bg-inc", "bg-needs", "bg-wants", "bg-save", "bg-spn", "bg-spw", "bg-sps"],
    derive: [{
      /* The one blessed offer: ₦ from %. Value is budget503020(...).needs —
         already computed by the page's own render(), no new maths. Hidden
         until income or a split % is touched, so it never fires on load. */
      field: "bg-spn",
      hideUntil: ["bg-inc", "bg-needs", "bg-wants", "bg-save"],
      text: (): string => {
        const plan = budget503020(
          pm(gv("bg-inc")), pm(gv("bg-needs")) / 100, pm(gv("bg-wants")) / 100, pm(gv("bg-save")) / 100);
        return `Plan puts needs at ${ngn(plan.needs)} — that is the figure to compare against.`;
      },
      use: (): number => budget503020(
        pm(gv("bg-inc")), pm(gv("bg-needs")) / 100, pm(gv("bg-wants")) / 100, pm(gv("bg-save")) / 100).needs,
    }],
    context: [{
      field: "bg-inc",
      text: "Median Nigerian pay is roughly ₦120k–₦150k a month, so this ₦250,000 example sits above it — it is a scenario, not your salary.",
      src: "Guardian · May 2026",
      href: "https://guardian.ng/nigerian/what-is-the-average-salary-in-nigeria/",
    }],
    remember: ["bg-inc", "bg-needs", "bg-wants", "bg-save", "bg-spn", "bg-spw", "bg-sps"],
    required: ["bg-inc", "bg-needs", "bg-wants", "bg-save", "bg-spn", "bg-spw", "bg-sps"],
  },

  /* 2 — budget allocator. The five bucket shares are our indicative Nigerian
     starting points (the page's own copy says so), so all five are marked;
     deriving % from the ₦ they imply is exactly what the direction law
     forbids, so the receipt carries those naira and the fields carry nothing. */
  "budget-allocator": {
    tool: "budget-allocator",
    seeds: ["al-inc", "al-rent", "al-food", "al-transport", "al-data", "al-utilities"],
    derive: [],
    context: [{
      field: "al-inc",
      text: "Median Nigerian pay is roughly ₦120k–₦150k a month, so this ₦250,000 example sits above it — it is a scenario, not your salary.",
      src: "Guardian · May 2026",
      href: "https://guardian.ng/nigerian/what-is-the-average-salary-in-nigeria/",
    }],
    remember: ["al-inc", "al-rent", "al-food", "al-transport", "al-data", "al-utilities"],
    required: ["al-inc", "al-rent", "al-food", "al-transport", "al-data", "al-utilities"],
  },

  /* 3 — salary tax. Gross is a seed; the four reliefs are ₦0 blanks and stay
     plain. Gross NEVER restores (§2g) and neither do the reliefs. */
  "salary-tax-calculator": {
    tool: "salary-tax",
    seeds: ["st-gross", "st-pension"],
    /* Statutory, sourced on the same field below, and law rather than a claim
       about the visitor: the one legal figure that can honestly be offered. */
    derive: [{ field: "st-gross", use: 70000, text: "₦70,000 a month — the statutory minimum wage, where PAYE is nil." }],
    context: [{
      field: "st-gross",
      text: "The statutory minimum wage is ₦70,000 a month, signed into law in July 2024. At or below it there is no PAYE to pay — pension still applies.",
      src: "TradingEconomics · law of Jul 2024",
      href: "https://tradingeconomics.com/nigeria/minimum-wages",
    }],
    remember: ["st-pension"],
    required: ["st-gross", "st-pension"],
  },

  /* 4 — gross to net. Same shape as salary tax, and the same refusals: no
     offer (₦70,000 is a GROSS, this field is a take-home) and no pension line
     without a citation. */
  "gross-to-net-calculator": {
    tool: "gross-to-net",
    seeds: ["gn-net", "gn-pen"],
    derive: [],
    context: [],
    remember: ["gn-pen"],
    required: ["gn-net", "gn-pen"],
  },

  /* 5 — loan repayment. The design wanted the quoted rate left blank so the
     visitor pastes their own; emptying it would change the seed and therefore
     the receipt, which this leg is forbidden to do. So the rate is marked
     SAMPLE instead — strictly more honest than shipping it unmarked. */
  "loan-repayment-calculator": {
    tool: "loan-repayment",
    seeds: ["ln-amt", "ln-tenor", "ln-rate"],
    derive: [],
    context: [],
    remember: ["ln-amt", "ln-tenor", "ln-rate"],
    required: ["ln-amt", "ln-tenor", "ln-rate"],
  },

  /* 6 — emergency fund. All five fields carry our worked example, including
     the 6-month cover and the 20% inflation band, which is disclosed below
     rather than left as an unexplained constant. */
  "emergency-fund-calculator": {
    tool: "emergency-fund",
    seeds: ["em-ess", "em-saved", "em-mo", "em-cover", "em-infl"],
    derive: [],
    context: [{
      field: "em-infl",
      text: "NBS reported 15.39% headline inflation in Aug 2026. We start at 20% as a cautious band — raise it if your own costs run hotter.",
      src: "NBS · Aug 2026",
      href: "https://www.nigerianstat.gov.ng/",
    }],
    remember: ["em-ess", "em-saved", "em-mo", "em-cover", "em-infl"],
    required: ["em-ess", "em-saved", "em-mo", "em-cover", "em-infl"],
  },

  /* 7 — savings goal. */
  "savings-goal-calculator": {
    tool: "savings-goal",
    seeds: ["sg-target", "sg-cur", "sg-rate", "sg-mo"],
    derive: [],
    context: [],
    remember: ["sg-target", "sg-cur", "sg-rate", "sg-mo"],
    required: ["sg-target", "sg-cur", "sg-rate", "sg-mo"],
  },

  /* 8 — compound interest. Monthly is the default frequency; principal,
     deposit, rate and years are all our worked example. */
  "compound-interest-calculator": {
    tool: "compound-interest",
    seeds: ["ci-prin", "ci-dep", "ci-rate", "ci-yrs"],
    derive: [],
    context: [],
    remember: ["ci-prin", "ci-dep", "ci-rate", "ci-yrs"],
    required: ["ci-prin", "ci-dep", "ci-rate", "ci-yrs"],
  },

  /* 9 — inflation savings. Same disclosed 20% band as emergency fund. */
  "inflation-savings-calculator": {
    tool: "inflation-savings",
    seeds: ["is-target", "is-cur", "is-rate", "is-infl", "is-yrs"],
    derive: [],
    context: [{
      field: "is-infl",
      text: "NBS reported 15.39% headline inflation in Aug 2026. We start at 20% as a cautious band — the gap below is priced at whatever you set.",
      src: "NBS · Aug 2026",
      href: "https://www.nigerianstat.gov.ng/",
    }],
    remember: ["is-target", "is-cur", "is-rate", "is-infl", "is-yrs"],
    required: ["is-target", "is-cur", "is-rate", "is-infl", "is-yrs"],
  },

  /* 10 — naira value, three sub-tools sharing one inflation rate and horizon. */
  "naira-value-calculator": {
    tool: "naira-value",
    seeds: ["nv-val", "nv-infl", "nv-yrs", "nv-pv", "nv-tgt", "nv-cur", "nv-ret"],
    derive: [],
    context: [{
      field: "nv-infl",
      text: "NBS reported 15.39% headline inflation in Aug 2026. We start at 20% as a cautious band — test 25–30% if your spending is mostly food and transport.",
      src: "NBS · Aug 2026",
      href: "https://www.nigerianstat.gov.ng/",
    }],
    remember: ["nv-val", "nv-infl", "nv-yrs", "nv-pv", "nv-tgt", "nv-cur", "nv-ret"],
    required: ["nv-val", "nv-infl", "nv-yrs", "nv-pv", "nv-tgt", "nv-cur", "nv-ret"],
  },

  /* 11 — currency converter. The pair is remembered because the currency you
     last converted is yours, not ours; the seeded amount is our example. */
  "currency-converter": {
    tool: "currency-converter",
    seeds: ["cc-amt"],
    derive: [],
    context: [],
    remember: ["cc-amt", "cc-from", "cc-to"],
    required: ["cc-amt"],
  },

  /* 12 — transfer comparator. Same reasoning as the converter: direction and
     send currency are remembered, the seeded amount is marked as ours. */
  "money-transfer-comparator": {
    tool: "money-transfer-comparator",
    seeds: ["tc-amt"],
    derive: [],
    context: [],
    remember: ["tc-amt", "tc-dir", "tc-src"],
    required: ["tc-amt"],
  },

  /* 13 — crypto profit. Five seeds; cp-flat renders ₦0 so it stays plain. */
  "crypto-profit-calculator": {
    tool: "crypto-profit",
    seeds: ["cp-inv", "cp-buy", "cp-sell", "cp-bf", "cp-sf"],
    derive: [],
    context: [],
    remember: ["cp-inv", "cp-buy", "cp-sell", "cp-bf", "cp-sf", "cp-flat"],
    required: ["cp-inv", "cp-buy", "cp-sell", "cp-bf", "cp-sf"],
  },

  /* 14 — dividend estimator. The growth pair is an illustrative band, not a
     forecast — the page's own receipt foot already says so, so no sourced
     claim is made here. */
  "dividend-calculator": {
    tool: "dividend",
    seeds: ["dv-inv", "dv-pg", "dv-dg", "dv-yrs"],
    derive: [],
    context: [],
    remember: ["dv-inv", "dv-pg", "dv-dg", "dv-yrs"],
    required: ["dv-inv", "dv-pg", "dv-dg", "dv-yrs"],
  },

  /* 15 — savings rate comparator. One field, one worked example. */
  "savings-rate-comparator": {
    tool: "savings-rate",
    seeds: ["sr-amt"],
    derive: [],
    context: [],
    remember: ["sr-amt"],
    required: ["sr-amt"],
  },

  /* 16 — exchange rate history. NO CHANGE, deliberately (design spec §5, row
     15): it already carries the repo's only tool-scoped localStorage key and
     its only field is an integer day-window select, not a money input. The
     entry exists so the fleet contract stays uniform and auditable. */
  "exchange-rate-history": {
    tool: "exchange-rate-history",
    seeds: [], derive: [], context: [], remember: [], required: [],
  },

  /* The amount family — the 79-page [amount].astro route. It has no inputs at
     all (the figure lives in the URL), so there is nothing to seed, derive,
     contextualise or remember. Declared, empty and honest. */
  "amount": { tool: "amount", seeds: [], derive: [], context: [], remember: [], required: [] },
};

/* The emptiness test. The spine's clearExamples() force-marks every receipt
   empty, so this predicate must agree with it or the page would show a "—"
   figure with no card line. Two independent ways to be empty:
     - every REQUIRED figure is blank (nothing entered at all), or
     - every SEED is blank (the visitor asked for the honest blank version).
   The second case is the "I typed my own income, then cleared the examples"
   path: the spine blanks the receipt, so the line above the grid must appear
   too. Tools with no seeds (exchange-rate-history, amount) are never empty —
   they have no worked example to clear, and required is empty for both. */
export function sfIsEmpty(slug: string, get: Get): boolean {
  const t = TOOL_FIELDS[slug];
  if (!t || !t.required.length) return false;
  const blank = (id: string) => get(id).trim() === "";
  if (t.required.every(blank)) return true;
  /* The spine clears only the fields that still wear SAMPLE and then forces
     every receipt empty. When the visitor typed their own figure into one seed,
     that field no longer wears SAMPLE, so "no SAMPLE survives" is the honest
     test — and it is the SAME condition the spine's own Clear-examples button
     uses to hide itself.
     It must be read off VALUES, never off the DOM badge: render() runs before
     register() has marked the seeds on first paint, so a DOM read sees zero
     SAMPLE fields and wrongly declares every first visit empty. A seed that
     the visitor has typed into still holds a value, so "every seed blank" is
     the order-independent form of the same test. */
  return t.seeds.length > 0 && t.seeds.every(blank);
}

/* Bind this page's emptiness test once, then keep the card line in step with
   the spine's own Clear examples. Delegated, so it costs one listener. */
export function sfBind(slug: string, get: Get): void {
  if (syncing) return;
  syncing = true;
  /* The spine repaints offer text on EVERY input, so re-assert the honest line
     after each one too — otherwise the first keystroke after a clear brings the
     gold "₦0" offer straight back. Deferred by a tick so it runs after paint(). */
  document.addEventListener("input", () => {
    if (sfIsEmpty(slug, get)) setTimeout(() => holdOffer(true), 0);
  });
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t || !t.closest || !t.closest("[data-sf-clear]")) return;
    /* After the spine's own handler runs, every seed has been blanked and its
       SAMPLE removed, so sfIsEmpty now agrees with the receipt it just forced.
       The timeout also puts us after the spine's paint(), which rewrites the
       offer line — so the honest offer text lands last and stays. */
    setTimeout(() => {
      const empty = sfIsEmpty(slug, get);
      paintEmpty(empty);
      holdOffer(empty);
    }, 0);
  });
}

export default TOOL_FIELDS;