/* smart-fields.js — v0.7.20 smart fields SPINE (design spec §1–§4).
 *
 * Vanilla ES module, ZERO dependencies. Loaded exactly once, from
 * ToolShell.astro, so it is route-scoped to /money-tools/* and inert on every
 * other page. It only ADDS labels, badges and controls: it never rewrites an
 * element ID, never calls a page's render(), and never invents a figure.
 *
 * THREE STATES — and the state is legible BEFORE you touch a field (§1):
 *   data-sd  SAMPLE     gold pill + dashed gold underline — a scenario WE invented
 *   data-r   LAST USED  neutral pill, no underline       — YOUR number, restored, dated
 *   (none)   plain                                          — YOUR number, this session
 * Gold means "ours" and NEVER means "yours": a restored value of your own must
 * not wear the sample gold, or the mark would lie in the other direction (§2g).
 * Tapping a SAMPLE field selects it; the first input event drops the badge, the
 * dashed rule and the hint in the SAME frame — no animation, no toast, no
 * confirm step (§3.3) — and a dismissed seed never returns this session (§3.4).
 *
 * API — a tool page declares metadata and nothing else:
 *   smartFields.register({
 *     tool:     "slug",                            // localStorage key namespacing
 *     seeds:    ["bg-inc", ...],                   // ids that wear the SAMPLE state
 *     derive:   [{ field, text, use, hideUntil }], // -> .offer pill, fills THAT field only
 *                                                                 (hideUntil = ids; the offer stays
 *                                                                  hidden until one of them is touched)
 *     context:  [{ field, text, src, href }],      // -> .ctx line + its sourced stamp
 *     remember: ["bg-inc", ...],                   // ids persisted per tool
 *   })
 *   smartFields.markEmpty(receipt, isEmpty)        // withhold figures as "—" (§4)
 *
 * RESET (v0.7.22) — the button owns no markup of its own; the module binds it.
 * Reset means "forget me, give me the worked example back" (§2a): it drops this
 * tool's key, puts every control in the calculator back to the value the SERVER
 * sent (snapshotted in register(), before restore() can touch anything), re-runs
 * the page's own render by dispatching the events that page already listens for,
 * and re-arms SAMPLE / LAST USED / the derive offer. No page reload, because a
 * reload is precisely what handed the visitor their remembered numbers back.
 *
 * Contracts honoured: call register() BEFORE your own first render() (memory is
 * restored first, so the receipt already shows it); call markEmpty() from
 * render(), AFTER you write the figures. Rent and gross never restore silently
 * (§2g exclusion list) and a value the user cleared is never persisted. Storage
 * is read AND written inside try/catch for private mode, copying the only
 * tool-scoped precedent in the repo (exchange-rate-history.astro:43-49).
 */

/* The §2g exclusion list is a LAW, not a preference: a remembered ₦90,000 annual
   rent silently inflating a rent-relief claim is a WRONG number, and this site's
   whole brand is "we don't fudge numbers". A wrong number is worse than none. */
const NEVER = ["st-rent", "gn-rent", "st-gross"];
const EXPIRES = 30 * 864e5; // §2g — past 30 days a LAST USED value is dropped, not offered
const KEY = (tool) => "gwill-sf-" + tool;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const el = (id) => document.getElementById(id);
const wrap = (id) => { const i = el(id); return i ? i.closest(".field") : null; };
const dead = new Set(); // §3.4 a dismissed seed never comes back in that session
let TOOL = "", MEM = {}, OFFERS = [];
/* ── RESET STATE (v0.7.22) ───────────────────────────────────────────────────
   SNAP is every control as the SERVER delivered it, taken in register() BEFORE
   restore() — so it is OUR worked example, never the visitor's remembered number.
   It is the whole calculator, not just the seeds: Reset must also hand back the
   ₦0 relief rows a visitor may have typed into (salary-tax's st-rent, gross-to-net's
   gn-nhf) and the direction selects a page remembers (cc-from, dv-stock). */
let CFG = {}, SNAP = [], resetting = false;

/* The calculator region. .con is the shell's own content wrapper and the button row
   lives inside it, so the nearest .con above Reset IS the calculator, and it
   excludes the header search and the footer forms. Falls back to the document so a
   button placed outside .con can never leave Reset with nothing to restore. */
function scope() {
  const b = $("[data-sf-reset]");
  return (b && b.closest(".con")) || document;
}

/* Snapshot the delivered state. `checked` for toggles, `value` for everything else;
   a control with no id is left alone — nothing could address it. */
function takeSnapshot() {
  SNAP = $$("input,select,textarea", scope())
    .filter((n) => n.id && !/^(hidden|submit|button|reset|image)$/.test(n.type))
    .map((n) => ({ el: n, checked: /^(checkbox|radio)$/.test(n.type), value: /^(checkbox|radio)$/.test(n.type) ? n.checked : n.value }));
}

/* ── RESET = "forget me, give me the worked example back" (§2a) ─────────────
   The button used to be `onclick="location.reload()"`, and that is why it read as
   dead: the reload handed the page straight back to restore(), which put the
   visitor's own last-used numbers into the very fields we had just emptied. A reset
   that goes through the memory layer cannot beat the memory layer — so it must not
   go through it. In order: drop this tool's key, put every control back to what the
   server sent, re-run the page's OWN render so the receipt repaints with the worked
   example, then re-arm the SAMPLE / LAST USED / offer state. */
function reset() {
  resetting = true; // save() stands down for this whole pass, so memory cannot
  try { localStorage.removeItem(KEY(TOOL)); } catch {} // re-persist the seeds we are writing now
  dead.clear(); // a dismissed seed is welcome again — Reset is the way back to it

  /* Nothing was ever registered here (no calculator called register()), so there is
     no delivered state to go back to. Forget the key and reload: the button still
     ends somewhere honest rather than nowhere. */
  if (!SNAP.length) { resetting = false; location.reload(); return; }

  /* (b) every control back to the delivered value, event-free: the repaint below
     then fires one coherent burst so each page renders from the restored values. */
  const restored = SNAP.filter((s) => {
    if (s.checked) { if (s.el.checked === s.value) return false; s.el.checked = s.value; return true; }
    if (String(s.el.value) === String(s.value)) return false;
    s.el.value = s.value;
    return true;
  });

  /* (d) state, not storage: SAMPLE comes back gold (it is ours again) and LAST USED
     goes away entirely — nothing here is the visitor's any more. */
  $$(".field[data-r]").forEach((f) => mark(f, "", "", ""));
  (CFG.seeds || []).forEach((id) => mark(wrap(id), "data-sd", "Sample", "Example — ours, not yours. Tap to replace it."));
  $$(".offer").forEach((o) => o.remove());
  OFFERS = [];
  (CFG.derive || []).forEach(offer); // rebuilt, so a previous Clear examples can never leave it held

  /* (c) THE RENDER HOOK — generic, zero page edits. Every one of these pages binds
     its own render() to `input` on its own fields and to `change` on its selects
     (verified in all 16), so dispatching the two events the page already listens
     for re-runs its own maths on the restored values. The page keeps every figure
     it owns; we only press its own buttons. */
  restored.forEach((s) => s.el.dispatchEvent(new Event(s.checked || s.el.tagName === "SELECT" ? "change" : "input", { bubbles: true })));
  if (!restored.length) { // Reset with nothing to put back must still repaint
    const f = SNAP.find((s) => !s.checked && s.el.tagName === "INPUT");
    if (f) f.el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  syncClear();
  paint();
  resetting = false;

  /* ── The receipt's own state ──────────────────────────────────────────────
     The withheld state is the SPINE's own vocabulary — markEmpty() sets
     data-sfe, and ToolShell styles it — and this page has just re-rendered
     real figures straight over the dashes, so the spine is the right place to
     unpick it. Same for the honest lines Clear examples raised: after Reset the
     page reads exactly as delivered. A figure still showing "—" afterwards means
     the page's render genuinely did not finish, which would be a real bug — the
     honest blank's voice line now HIDES the render's children instead of
     deleting them (tool-fields.ts, speak()), so nothing it writes into can be
     destroyed by the blank. The key is already gone, so the safety reload that
     guard still allows lands on the server's example, never the visitor's. */
  let unfinished = false;
  $$(".receipt[data-sfe]").forEach((r) => {
    markEmpty(r, false);
    if ($$(".receipt-fig,.receipt-row b,[data-sf-fig]", r).some((n) => n.textContent.trim() === "—")) unfinished = true;
  });
  const card = $("[data-sf-card]"), foot = $("[data-sf-foot]");
  if (card) card.hidden = true;
  if (foot) foot.hidden = true;
  if (unfinished) location.reload();
}

/* The badge. A falsy attr means plain state: both pills AND the dashed rule go. */
function mark(f, attr, text, title) {
  if (!f) return;
  const p = f.querySelector(".sd");
  if (p) p.remove();
  f.removeAttribute("data-sd");
  f.removeAttribute("data-r");
  const l = f.querySelector("label");
  if (!attr || !l) return;
  f.setAttribute(attr, "");
  const b = document.createElement("span");
  b.className = "sd";
  b.textContent = text;
  if (title) b.title = title;
  l.appendChild(b);
}

/* Storage. Both directions are wrapped for private mode; a value the user
   cleared is dropped from the record rather than written as "" — so a cleared
   seed can never come back wearing LAST USED. */
function save() {
  if (!TOOL || resetting) return; // during a reset, silence is the contract
  const v = {};
  Object.keys(MEM).forEach((id) => { const s = MEM[id].value; if (s !== "") v[id] = s; });
  try {
    if (Object.keys(v).length) localStorage.setItem(KEY(TOOL), JSON.stringify({ t: Date.now(), v }));
    else localStorage.removeItem(KEY(TOOL));
  } catch {}
}

/* Restore. The badge is MANDATORY on every restore — that is what keeps a
   remembered number from reading as data we invented. Expired past EXPIRES, so
   stale rent/gross cannot linger even where they are allowed at all. */
function restore() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY(TOOL)) || "null"); } catch {}
  if (!s || !s.t || Date.now() - s.t > EXPIRES) return;
  const d = Math.floor((Date.now() - s.t) / 864e5);
  const when = d <= 0 ? "today" : d === 1 ? "yesterday" : d + " days ago";
  Object.keys(MEM).forEach((id) => {
    if (!s.v[id]) return;
    MEM[id].value = s.v[id];
    mark(wrap(id), "data-r", "Last used", "Restored from your last visit · " + when);
  });
}

/* §2(b) the derived-value offer. One action per line, and it fills THE field it
   belongs to and nothing else — never on load, never another field. */
function offer(o) {
  const f = wrap(o.field);
  if (!f) return;
  const p = document.createElement("p"), s = document.createElement("span"), b = document.createElement("b");
  p.className = "offer";
  b.setAttribute("data-use", o.field);
  b.textContent = "Use this";
  b.addEventListener("click", () => {
    const i = el(o.field);
    if (!i) return;
    i.value = String(typeof o.use === "function" ? o.use() : o.use);
    i.dispatchEvent(new Event("input", { bubbles: true })); // the page's own rails recompute
  });
  p.appendChild(s); p.appendChild(b);
  f.insertAdjacentElement("afterend", p);
  OFFERS.push({ o: o, p: p, s: s });
}

function paint() {
  OFFERS.forEach((x) => {
    x.s.textContent = typeof x.o.text === "function" ? x.o.text() : x.o.text;
    /* An offer is visible by default; `hideUntil` is the OPT-IN gate for the
       fields the spec forbids offering before they are touched (50/30/20's
       bg-spn). Nothing is ever auto-filled, so showing one is safe. */
    x.p.hidden = !!x.o.hideUntil && !x.o.hideUntil.some((id) => dead.has(id));
  });
}

/* §2(c) the sourced context line. NO URL, NO LINE: a claim about the world
   ships only with its birth certificate, or it does not ship at all. */
function ctx(c) {
  const f = wrap(c.field);
  if (!f || !c.href || !c.src) return;
  const p = document.createElement("p"), st = document.createElement("span"), a = document.createElement("a");
  p.className = "ctx";
  p.appendChild(document.createTextNode(c.text + " "));
  st.className = "ctx-src";
  st.appendChild(document.createTextNode(c.src + " · "));
  a.href = c.href; a.rel = "noopener"; a.textContent = "read the source";
  st.appendChild(a); p.appendChild(st);
  f.insertAdjacentElement("afterend", p);
}

/* §4 the empty state. Withhold the FIGURES, keep the STRUCTURE: the labels and
   rows stay so the receipt reads as WAITING, not broken. The "—" is dimmed and
   never gold — a confident ₦0 is a number the user never entered, wearing the
   site's most persuasive typography. */
function markEmpty(box, isEmpty) {
  if (!box) return;
  if (!isEmpty) { box.removeAttribute("data-sfe"); return; }
  box.setAttribute("data-sfe", "");
  $$(".receipt-fig,.receipt-row b", box).forEach((n) => { n.textContent = "—"; });
}

/* The one NEW control in the spec: the bulk dismissal for the "I want the
   honest blank version" case. It appears only while at least one seed
   survives (§2a/§3.2). Reset is untouched — its meaning changes, not its code. */
function syncClear() {
  const b = $("[data-sf-clear]");
  if (b) b.hidden = !$(".field[data-sd]");
}

function clearExamples() {
  $$(".field[data-sd]").forEach((f) => {
    const i = f.querySelector("input");
    if (!i) return;
    if (i.value !== "") { i.value = ""; i.dispatchEvent(new Event("input", { bubbles: true })); }
    if (i.id) dead.add(i.id);
    mark(f, "", "", "");
  });
  save(); // a cleared value is never persisted, and the stored one is gone
  $$(".receipt").forEach((r) => markEmpty(r, true));
  syncClear();
  paint();
}

function register(cfg) {
  TOOL = cfg.tool || "";
  CFG = cfg;
  takeSnapshot(); // BEFORE restore(): this must capture the server's example
  MEM = {};
  (cfg.remember || []).forEach((id) => {
    if (NEVER.indexOf(id) < 0 && el(id)) MEM[id] = el(id);
  });
  (cfg.seeds || []).forEach((id) => {
    const f = wrap(id), i = el(id);
    if (!f || !i || dead.has(id)) return;
    mark(f, "data-sd", "Sample", "Example — ours, not yours. Tap to replace it.");
    i.addEventListener("focus", () => { if (f.hasAttribute("data-sd")) i.select(); });
  });
  (cfg.context || []).forEach(ctx);
  (cfg.derive || []).forEach(offer);
  restore(); // after the seeds: your own remembered number outranks our example
  paint();
  syncClear();
}

function boot() {
  document.addEventListener("input", (e) => {
    const i = e.target;
    if (!i || !i.closest) return;
    const f = i.closest(".field");
    /* During a reset these input events are OURS, not the visitor's: the badge
       stripping and the dead-seed marking below are for a human typing, and
       would otherwise undo the SAMPLE state reset() has just re-armed. */
    if (!resetting && f && f.hasAttribute("data-sd")) { mark(f, "", "", ""); if (i.id) dead.add(i.id); }
    save();
    paint();
  });
  const b = $("[data-sf-clear]");
  if (b) b.addEventListener("click", clearExamples);
  const r = $("[data-sf-reset]");
  if (r) r.addEventListener("click", reset);
}

const smartFields = { register: register, markEmpty: markEmpty };
if (typeof window !== "undefined") window.smartFields = smartFields;
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

export default smartFields;
export { register, markEmpty };