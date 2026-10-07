/* tool-fields.ts — the per-tool smart-fields table (v0.7.20 leg C).
 *
 * ONE table, fifteen tools plus the amount family. Every money page declares
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
 * these fifteen pages a % input does NOT yield an amount that belongs in a
 * field: the step-2 bucket amounts are already in the page's own receipt, the
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
import { pm, pmBlank } from "../scripts/pm.js";
import { budget503020 } from "../lib/budget";
import { formatGrouped } from "../lib/format";

/* One small helper, used by the one offer and by nothing else. Browser-only
   module: it is imported exclusively by client scripts, so `document` is
   always present when these closures run. */
type Get = (id: string) => string;
/* `needs` = the ids this offer's FIGURE is derived from. Optional, so every
   offer that does not read the visitor's inputs (salary tax's statutory ₦70,000)
   declares nothing and is left exactly as it was. */
export interface SfOffer { field: string; text: string | (() => string); use: number | (() => number); hideUntil?: string[]; needs?: string[]; }
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
      if (s) s.textContent = OFFER_HELD;
      if (b) { b.setAttribute("aria-disabled", "true"); b.style.pointerEvents = "none"; b.style.opacity = ".45"; }
    } else {
      /* Releasing restores the BUTTON only. The offer's words belong to the
         spine's own paint(), which recomputes them from the live fields on
         every input — a text captured while held is stale by definition, and
         putting it back would print a figure the visitor has already changed. */
      if (b) { b.removeAttribute("aria-disabled"); b.style.pointerEvents = ""; b.style.opacity = ""; }
    }
  });
}

/* ── THE ZERO LAW — an absent input is UNKNOWN, not zero ─────────────────────
   pm() is the repo's tolerant money reader, and pm("") is 0: Number("") is 0 and
   isFinite(0) is true (pm.js). So a BLANK field reached the 50/30/20 derivation
   as 0% and the offer published "Plan puts needs at ₦0" over a LIVE gold button
   that wrote 0 into a money field. A derived zero is the exact figure §4.5
   forbids — a number the visitor never entered, wearing the offer's own voice.
   An offer now DECLARES the ids its figure comes from, and while any of them is
   blank it WITHHOLDS: the words name what is missing, and the button goes inert
   on the spine's own vocabulary (the same aria-disabled/pointer-events/opacity
   triple OFFER_HELD uses), so a zero can neither be shown nor be filled in.
   A value with no digit at all counts as blank, because pm() reads "." and
   "abc" as 0 exactly as it reads "". A real 0 IS a real 0: "0" has a digit, so
   a visitor who genuinely enters zero still gets the honest zero.
   B4 (2026-10-06): digit-presence alone priced "abc123" as 123 gold. Blank
   now ALSO means dishonest — pmBlank() (pm.js) rejects anything outside the
   honest-money alphabet, so garbage reads exactly as a cleared field. */
const isBlank = (id: string): boolean => pmBlank(gv(id));

/* The label the visitor actually reads, so the waiting line names the missing
   input in the page's own words and never leaks a field id.

   TEXT NODES ONLY, never textContent. smart-fields appends its SAMPLE / LAST
   USED badge INSIDE the label (mark(), smart-fields.js), so textContent was
   "Needs %Last used" and the withheld sentence shipped garbled — the exact
   line BREAK-1 caught on the flagship tool. Reading only the label's own text
   children skips every injected element by construction, so no badge shape
   added later can contaminate a label-derived sentence again. */
const labelOf = (id: string): string => {
  const l = document.querySelector('label[for="' + id + '"]');
  if (!l) return id;
  let t = "";
  l.childNodes.forEach((n) => { if (n.nodeType === 3) t += n.textContent || ""; });
  t = t.trim();
  return t || id;
};

/* One offer, one pill, addressed by the data-use attribute the SPINE wrote when
   it built the button — so an offer rebuilt by Reset is guarded with no
   bookkeeping kept here. Nothing is created, moved, hidden or restyled: the
   pill the spine built is the pill whose words change. */
function guardOffer(o: SfOffer, pageEmpty: boolean): void {
  if (!o.needs || !o.needs.length) return; // a constant offer has nothing to wait for
  if (pageEmpty) return;                   // OFFER_HELD already owns the empty page
  const b = document.querySelector('.offer b[data-use="' + o.field + '"]') as HTMLElement | null;
  if (!b) return;
  const s = b.parentElement ? b.parentElement.querySelector("span") as HTMLElement | null : null;
  const missing = o.needs.filter(isBlank);
  if (missing.length) {
    if (s) s.textContent = "Nothing to compute yet — " + missing.map(labelOf).join(" and ") +
      (missing.length > 1 ? " are empty, not zero." : " is empty, not zero.");
    b.setAttribute("aria-disabled", "true"); b.style.pointerEvents = "none"; b.style.opacity = ".45";
  } else {
    /* Release restores the BUTTON only. The words belong to the spine's own
       paint(), which recomputes them from the live fields on every input and
       runs BEFORE this — so what is on screen is always the live figure, never
       a copy captured while held. */
    b.removeAttribute("aria-disabled"); b.style.pointerEvents = ""; b.style.opacity = "";
  }
}

/* ── THE ZERO LAW, FLEET-WIDE (v0.7.24) ─────────────────────────────────────
   THE LAW: a figure derived from an input the visitor never entered must never
   be printed as a gold naira amount. It reads as a dimmed "—", the vocabulary
   D-C already established for the empty state.

   WHY IT IS NOT sfIsEmpty: sfIsEmpty() answers "is the WHOLE PAGE empty", and
   it withholds only then. "Income typed, one dependent field cleared" is not an
   empty page, so every partial-empty state fell through to pm("") → 0 and the
   page printed its product in full gold. That is the same lie sixteen times,
   once per page, from sixteen render() functions — so it is fixed once here.

   THE TEST IS "DID THE VISITOR ENTER THIS", NEVER "IS THE RESULT ZERO". A
   visitor who genuinely types 0 gets an honest ₦0 (the "0% savings is a real
   plan" case is a real plan); a visitor who never touched the field gets a dash.
   isBlank() is the same predicate guardOffer() uses: no digit in the field, so
   "" and "." and "abc" are all un-entered while "0" is entered.

   THE CALL SITE, one pattern, every page:
     sfFig(t("xx-fig"), ["a", "b"], nn(plan.a * plan.b));
   `deps` are the ids the figure is DERIVED FROM and nothing else — a row that
   only echoes one input lists that one id. deps: [] means "this figure reads
   nothing the visitor can blank", and it always prints. Nothing is created,
   moved, hidden or restyled: the node the page's own render() already writes is
   the node whose text changes, and the withheld dash wears the SAME
   --text-dim token the shipped [data-sfe] empty state uses — inline, so no
   stylesheet, ToolShell or gate had to be touched to get the honest colour. */
export const SF_DASH = "—";
/* Marks a figure this render deliberately withheld. paintEmpty() restores a
   captured dash on its way out of the empty state; it must not mistake a
   deliberate dash for a stale one and put an old number back under it. */
const NO = "data-sf-no";

/* Trust badge vocabulary — mirrors ToolShell's .sd badge grammar.
   data-trust="example"   → gold pill "Example"       (cold, server seed)
   data-trust="computed"  → neutral pill "Computed"   (user-typed deps)
   data-trust="last-used" → neutral pill "Last used"  (restored from memory)
   data-trust="user"      → neutral pill "Yours"      (all deps user-typed) */
export type TrustKind = "example" | "computed" | "last-used" | "user";
const TRUST_LABEL: Record<TrustKind, string> = {
  example: "Example",
  computed: "Computed",
  "last-used": "Last used",
  user: "Yours",
};

/* Injects a trust pill next to the figure. The pill is a sibling span so it
   never interferes with the figure's own textContent (which render() rewrites
   on every input). The pill is removed/replaced on each call — no stale badges. */
function injectTrustBadge(el: HTMLElement, kind: TrustKind): void {
  if (!el) return;
  const existing = el.parentElement?.querySelector(".trust-badge[data-trust]");
  if (existing) existing.remove();
  if (kind === "example" || kind === "computed" || kind === "last-used" || kind === "user") {
    const pill = document.createElement("span");
    pill.className = "trust-badge";
    pill.setAttribute("data-trust", kind);
    pill.textContent = TRUST_LABEL[kind];
    el.parentElement?.appendChild(pill);
  }
}

/* Determines trust kind for a figure based on its dependency fields.
   - If page is empty (sfIsEmpty would be true) → "example"
   - Else if ANY dep has data-sd (SAMPLE) → "example"
   - Else if ANY dep has data-r (LAST USED) → "last-used"
   - Else if ALL deps have values (user-typed) → "user"
   - Else → "computed" (mixed: some user, some blank but not sample) */
function computeTrustKind(deps: readonly string[], empty: boolean): TrustKind {
  if (empty) return "example";
  let hasSample = false;
  let hasLastUsed = false;
  let allUser = true;
  for (const id of deps) {
    const field = document.getElementById(id);
    const wrap = field?.closest(".field");
    if (!wrap) continue;
    if (wrap.hasAttribute("data-sd")) { hasSample = true; allUser = false; }
    else if (wrap.hasAttribute("data-r")) { hasLastUsed = true; allUser = false; }
    else if (field && field.value.trim() === "") { allUser = false; }
  }
  if (hasSample) return "example";
  if (hasLastUsed) return "last-used";
  if (allUser && deps.length > 0) return "user";
  return "computed";
}

export function sfFig(el: HTMLElement | null, deps: readonly string[], real: string, trust?: TrustKind | false): void {
  if (!el) return;
  const empty = deps.length && deps.some(isBlank);
  if (empty) {
    el.textContent = SF_DASH;
    el.setAttribute(NO, "");
    el.style.color = "var(--text-dim)";
    /* Withheld figures get no trust badge — they show "—" not a value. */
    const existing = el.parentElement?.querySelector(".trust-badge[data-trust]");
    if (existing) existing.remove();
  } else {
    el.textContent = real;
    el.removeAttribute(NO);
    el.style.color = "";
    /* Trust badge injection — opt-in via fourth arg, or auto-compute when
       omitted (trust === undefined). Pass trust=false to suppress. */
    if (trust !== false) {
      const kind = trust ?? computeTrustKind(deps, empty);
      injectTrustBadge(el, kind);
    }
  }
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
   it carries a rail voice so the line under the hero keeps TALKING instead of
   leaving a confident gold-family ₦0 sitting under a dimmed dash. That is
   exactly the failure §4.5 forbids.
   PROSE is untouched by design: .receipt-note and .bar-note carry the pages'
   own honest rails (warnings, comparisons) and the brief requires those keep
   working unchanged. */
const FIGURES = ".receipt-fig, .receipt-row b, [data-sf-fig]";
/* HN-1. This line used to read "Enter your numbers above — empty counts as
   ₦0." That is the exact falsehood this whole feature exists to prevent: an
   empty field is NOTHING ENTERED, never a zero. The line sat inside the rail
   built to stop the visitor thinking it, and told them the opposite in the
   visitor's own voice. Same length, same rhythm, same slot in the sentence —
   only the claim is now true. */
const SUB_VOICE = "Enter your numbers above — an empty field is not ₦0.";
const kept = new Map<Element, string>();

/* ── D-B: the voice line may not DELETE the render's targets ────────────────
   A few .receipt-sub lines carry children the page's own render() writes into:
   50/30/20's #bg-else, the allocator's #al-wants / #al-sav. Writing
   `sub.textContent = SUB_VOICE` removed those nodes, and because every render
   addresses them by id, the receipt was dead from that keystroke on — nothing
   the visitor typed could ever bring it back. Those are the only subs at risk,
   and only they are held: their children move into a display:none holder, which
   keeps them in the document (getElementById still finds them, the render keeps
   writing into them, un-hiding shows the values it wrote) while the voice line
   goes in beside the holder as its own element.

   The rest are one line of prose the page owns wholesale and rewrites on every
   render — salary-tax's "Tax ₦…/mo", and the sibling lines under a receipt that
   already speaks. Overwriting those destroys nothing: the page puts its own
   words straight back on its next render, which is exactly what should happen
   when it leaves the empty state. Un-holding also tolerates a held sub being
   rewritten from under us (a wholesale textContent drops the holder): if the
   holder is no longer our child, its children went with it and the page's fresh
   words are authoritative, so we only forget it. */
const HELD = "data-sf-held";
const VOICE = "data-sf-voice";
const held = new Map<Element, Element>();

function speak(sub: Element, on: boolean): void {
  if (on) {
    if (held.has(sub)) return;
    if (!sub.querySelector("[id]")) { sub.textContent = SUB_VOICE; return; }
    const w = document.createElement("span");
    w.setAttribute(HELD, "");
    w.style.display = "none";
    while (sub.firstChild) w.appendChild(sub.firstChild);
    sub.appendChild(w);
    held.set(sub, w);
    const v = document.createElement("span");
    v.setAttribute(VOICE, "");
    v.textContent = SUB_VOICE;
    sub.appendChild(v);
  } else {
    const v = sub.querySelector("[" + VOICE + "]");
    const w = held.get(sub);
    if (v) v.remove();
    if (w) {
      if (w.parentNode === sub) { while (w.firstChild) sub.insertBefore(w.firstChild, w); w.remove(); }
      held.delete(sub);
    }
  }
}

function paintEmpty(isEmpty: boolean): void {
  const line = document.querySelector("[data-sf-card]");
  if (line) line.hidden = !isEmpty;
  document.querySelectorAll(".receipt").forEach((r) => {
    const foot = r.querySelector("[data-sf-foot]");
    if (foot) foot.hidden = !isEmpty;
    let said = false; // one voice line per receipt
    r.querySelectorAll(".receipt-sub").forEach((n) => {
      if (isEmpty) {
        /* One voice line per RECEIPT, not per page: naira-value has three
           receipts and each needs its own, while 50/30/20's single receipt has
           two .receipt-sub lines and must speak once. */
        if (!said) { speak(n, true); said = true; }
        else if (/₦/.test(n.textContent || "")) n.textContent = "";
      } else speak(n, false);
    });
    if (isEmpty) {
      /* Capture BEFORE the spine blanks, or "—" would become the restore value. */
      r.querySelectorAll(FIGURES).forEach((n) => { if (!kept.has(n)) kept.set(n, n.textContent || ""); n.textContent = "—"; });
    } else {
      /* ONLY a withheld dash is put back, and only from the capture taken
         before the spine blanked it. The page's own render() rewrites these
         nodes on every input, so any wider restore would overwrite live
         figures with whatever they said the last time the page was empty. */
      r.querySelectorAll(FIGURES).forEach((n) => {
        if (n.hasAttribute(NO)) return;
        if ((n.textContent || "").trim() === SF_DASH && kept.has(n)) n.textContent = kept.get(n) || "";
      });
    }
    smartFields.markEmpty(r, isEmpty);
  });
}

export const TOOL_FIELDS: Record<string, SfTool> = {

  /* 1 — 50/30/20. The flagship: two steps on one page. Seven step-1 worked
     examples plus the five step-2 needs-share seeds, all marked, all
     removable in one tap. bg-save is the user's own split and is NEVER offered
     a value (research §7.2). */
  "50-30-20-budget-calculator": {
    tool: "50-30-20",
    seeds: ["bg-inc", "bg-needs", "bg-wants", "bg-save", "bg-spn", "bg-spw", "bg-sps", "al-rent", "al-food", "al-transport", "al-data", "al-utilities"],
    derive: [{
      /* The one blessed offer: ₦ from %. Value is budget503020(...).needs —
         already computed by the page's own render(), no new maths. Hidden
         until income, a split % OR an actuals figure is touched, so it never
         fires on load — and so a visitor who types their needs budget into
         `Spent on needs` meets the teaching sentence instead of silence
         (A1-F1: the hideUntil gate used to exclude the actuals fields, which
         is exactly the path where R-history says users get lost).
         `needs` names every id the OFFERED PAGE STATE depends on — income plus
         all three splits (E4 F-P2). The offered NUMBER is still income ×
         needs% only, but the union withholding sentence ("Needs % and Wants %
         … are empty, not zero") must name every missing split in ONE clause
         at the offer position, replacing the old double rail (the page's own
         sumnote saying it ~40px above). So `needs` deliberately over-names:
         while ANY of the four is blank the offer withholds instead of showing
         beside a half-entered plan — the same all-four guard the page's own
         live line and mini already use. wants% and savings% still do not
         enter plan.needs, so no maths moves; only the waiting voice widens.
         While any is blank this offer withholds (guardOffer), which
         is what stops pm("") → 0% from publishing a ₦0 nobody entered. */
      field: "bg-spn",
      needs: ["bg-inc", "bg-needs", "bg-wants", "bg-save"],
      hideUntil: ["bg-inc", "bg-needs", "bg-wants", "bg-save", "bg-spn", "bg-spw", "bg-sps"],
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
      text: "Median Nigerian pay is roughly ₦120k–₦150k a month, and this site's worked example sits above it — a scenario, not your salary.",
      src: "Guardian · May 2026",
      href: "https://guardian.ng/nigerian/what-is-the-average-salary-in-nigeria/",
    }],
    remember: ["bg-inc", "bg-needs", "bg-wants", "bg-save", "bg-spn", "bg-spw", "bg-sps", "al-rent", "al-food", "al-transport", "al-data", "al-utilities"],
    required: ["bg-inc", "bg-needs", "bg-wants", "bg-save", "bg-spn", "bg-spw", "bg-sps", "al-rent", "al-food", "al-transport", "al-data", "al-utilities"],
  },

  /* 2 — salary tax. Gross is a seed; the four reliefs are ₦0 blanks and stay
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

  /* 3 — gross to net. Same shape as salary tax, and the same refusals: no
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

  /* 4 — loan repayment. The design wanted the quoted rate left blank so the
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

  /* 5 — emergency fund. All five fields carry our worked example, including
     the 6-month cover and the 20% inflation band, which is disclosed below
     rather than left as an unexplained constant. */
  "emergency-fund-calculator": {
    tool: "emergency-fund",
    seeds: ["em-ess", "em-saved", "em-mo", "em-cover", "em-infl"],
    derive: [],
    context: [{
      field: "em-infl",
      text: "NBS put national headline inflation at 15.39% in Aug 2026, but Lagos ran 23.68% — the highest of any state. We start at 24% so the default is not below what a Lagos household pays. Raise it if your own costs run hotter.",
      src: "Nigerian Observer · NBS Aug 2026",
      href: "https://nigerianobservernews.com/2026/09/nigerias-inflation-rate-drops-to-15-39-in-august-nbs/",
    }],
    remember: ["em-ess", "em-saved", "em-mo", "em-cover", "em-infl"],
    required: ["em-ess", "em-saved", "em-mo", "em-cover", "em-infl"],
  },

  /* 6 — savings goal. */
  "savings-goal-calculator": {
    tool: "savings-goal",
    seeds: ["sg-target", "sg-cur", "sg-rate", "sg-mo"],
    derive: [],
    context: [],
    remember: ["sg-target", "sg-cur", "sg-rate", "sg-mo"],
    required: ["sg-target", "sg-cur", "sg-rate", "sg-mo"],
  },

  /* 7 — compound interest. Monthly is the default frequency; principal,
     deposit, rate and years are all our worked example. */
  "compound-interest-calculator": {
    tool: "compound-interest",
    seeds: ["ci-prin", "ci-dep", "ci-rate", "ci-yrs"],
    derive: [],
    context: [],
    remember: ["ci-prin", "ci-dep", "ci-rate", "ci-yrs"],
    required: ["ci-prin", "ci-dep", "ci-rate", "ci-yrs"],
  },

  /* 8 — inflation savings. Same disclosed 20% band as emergency fund. */
  "inflation-savings-calculator": {
    tool: "inflation-savings",
    seeds: ["is-target", "is-cur", "is-rate", "is-infl", "is-yrs"],
    derive: [],
    context: [{
      field: "is-infl",
      text: "NBS put national headline inflation at 15.39% in Aug 2026, but Lagos ran 23.68% — the highest of any state. We start at 24% so the default is not below what a Lagos household pays — the gap below is priced at the rate in this field.",
      src: "Nigerian Observer · NBS Aug 2026",
      href: "https://nigerianobservernews.com/2026/09/nigerias-inflation-rate-drops-to-15-39-in-august-nbs/",
    }],
    remember: ["is-target", "is-cur", "is-rate", "is-infl", "is-yrs"],
    required: ["is-target", "is-cur", "is-rate", "is-infl", "is-yrs"],
  },

  /* 9 — naira value, three sub-tools sharing one inflation rate and horizon. */
  "naira-value-calculator": {
    tool: "naira-value",
    seeds: ["nv-val", "nv-infl", "nv-yrs", "nv-pv", "nv-tgt", "nv-cur", "nv-ret"],
    derive: [],
    context: [{
      field: "nv-infl",
      text: "NBS put national headline inflation at 15.39% in Aug 2026, but Lagos ran 23.68% — the highest of any state. We start at 24% so the default is not below what a Lagos household pays — test 25–30% if your spending is mostly food and transport.",
      src: "Nigerian Observer · NBS Aug 2026",
      href: "https://nigerianobservernews.com/2026/09/nigerias-inflation-rate-drops-to-15-39-in-august-nbs/",
    }],
    remember: ["nv-val", "nv-infl", "nv-yrs", "nv-pv", "nv-tgt", "nv-cur", "nv-ret"],
    required: ["nv-val", "nv-infl", "nv-yrs", "nv-pv", "nv-tgt", "nv-cur", "nv-ret"],
  },

  /* 10 — currency converter. The pair is remembered because the currency you
     last converted is yours, not ours; the seeded amount is our example. */
  "currency-converter": {
    tool: "currency-converter",
    seeds: ["cc-amt"],
    derive: [],
    context: [],
    remember: ["cc-amt", "cc-from", "cc-to"],
    required: ["cc-amt"],
  },

  /* 11 — transfer comparator. Same reasoning as the converter: direction and
     send currency are remembered, the seeded amount is marked as ours. */
  "money-transfer-comparator": {
    tool: "money-transfer-comparator",
    seeds: ["tc-amt"],
    derive: [],
    context: [],
    remember: ["tc-amt", "tc-dir", "tc-src"],
    required: ["tc-amt"],
  },

  /* 12 — crypto profit. Five seeds; cp-flat renders ₦0 so it stays plain. */
  "crypto-profit-calculator": {
    tool: "crypto-profit",
    seeds: ["cp-inv", "cp-buy", "cp-sell", "cp-bf", "cp-sf"],
    derive: [],
    context: [],
    remember: ["cp-inv", "cp-buy", "cp-sell", "cp-bf", "cp-sf", "cp-flat"],
    required: ["cp-inv", "cp-buy", "cp-sell", "cp-bf", "cp-sf"],
  },

  /* 13 — dividend estimator. The growth pair is an illustrative band, not a
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

  /* 14 — savings rate comparator. One field, one worked example. */
  "savings-rate-comparator": {
    tool: "savings-rate",
    seeds: ["sr-amt"],
    derive: [],
    context: [],
    remember: ["sr-amt"],
    required: ["sr-amt"],
  },

  /* 15 — exchange rate history. NO CHANGE, deliberately (design spec §5, row
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
  /* ── D-C: the empty state is a function of the CURRENT values ──────────────
     Fourteen of the fifteen money pages used to call sfEmpty() ONCE at load,
     outside render(), which decided the empty state before the visitor touched
     anything: type your own income and those pages stayed in whatever state
     load chose, and Clear examples withheld their figures for good. The state
     is now judged on every input the page already listens for. This listener is
     delegated on `document`, so it runs AFTER the page's own render() (target
     phase first, document bubble second) — the figures being judged are the
     ones the page has just written, which is exactly what 50/30/20 gets by
     calling sfEmpty() at the foot of its render(). `change` is included so the
     select-driven pages (converter, transfer comparator) agree with their own
     render too. The predicate reads VALUES, never badge state, so it is
     order-independent on first paint. */
  const judge = () => {
    const empty = sfIsEmpty(slug, get);
    paintEmpty(empty);
    holdOffer(empty);
    /* THE ZERO LAW. sfIsEmpty() answers "is the whole PAGE empty", and
       "income typed, percentages cleared" is not an empty page — which is
       exactly how the ₦0 offer got through. So each offer guards its OWN
       inputs, every time, after the spine has repainted the line. */
    (TOOL_FIELDS[slug] ? TOOL_FIELDS[slug].derive : []).forEach((o) => guardOffer(o, empty));
  };
  document.addEventListener("input", judge);
  document.addEventListener("change", judge);
  /* Bind this page's emptiness test to the spine's own Clear examples too: it
     blanks the fields and dispatches the input events above, and the timeout
     puts us after the spine's paint(), which rewrites the offer line — so the
     honest offer text lands last and stays. */
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t || !t.closest || !t.closest("[data-sf-clear]")) return;
    setTimeout(() => {
      if (sfIsEmpty(slug, get)) { judge(); return; }
      /* The spine force-blanks every receipt AFTER it dispatches the field
         events, so a visitor who still holds values of their own (Clear examples
         only removes what still wears SAMPLE) would be left with the spine's
         dashes and no render left to answer. Press the page's own button once,
         on a field that still holds a value, and its render repaints the real
         figures over them — the same hook Reset already uses. */
      const cfg = TOOL_FIELDS[slug];
      const ids = cfg.required.concat(cfg.seeds).filter((x, i, a) => a.indexOf(x) === i);
      const el = document.getElementById(ids.find((x) => get(x).trim() !== "") || "");
      if (el) el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
      judge();
    }, 0);
  });
}

export default TOOL_FIELDS;