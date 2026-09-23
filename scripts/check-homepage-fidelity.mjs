// Homepage fidelity contract — GWill Finance WordPress → Astro port.
//
// Asserts the homepage port against the WP source of truth (gwill-finance-theme
// 1.13.39: front-page.php sections 2-8, template-parts/content.php,
// inc/card-media.php, and the stylesheet sections the homepage renders).
//
// CSS expectations are matched with ALL whitespace stripped on both sides, so
// the assertions stay exact about values, order and breakpoints without being
// hostage to how the extraction happens to be pretty-printed. Every value below
// is a verbatim WP value, and each was confirmed by measuring the built page
// against the live WordPress homepage (docs/port/06-homepage-verification.md).
import { readFileSync } from "node:fs";

const ROOT = "/home/opc/work/finance-astro";
const INDEX = `${ROOT}/src/pages/index.astro`;
const CARD = `${ROOT}/src/components/ArticleCard.astro`;
const SITE = `${ROOT}/src/data/site.ts`;
const HOME_CSS = `${ROOT}/src/styles/home.css`;
const FORMS_CSS = `${ROOT}/src/styles/forms.css`;
const BASE_CSS = `${ROOT}/src/styles/base.css`;
const LAYOUT = `${ROOT}/src/layouts/Layout.astro`;

const indexRaw = readFileSync(INDEX, "utf8");
const cardRaw = readFileSync(CARD, "utf8");
const site = readFileSync(SITE, "utf8");
const layout = readFileSync(LAYOUT, "utf8");

const strip = (s) => s.replace(/\s+/g, "").replace(/;}/g, "}");
const css = strip(readFileSync(HOME_CSS, "utf8"));
// The theme styles form controls in its FORMS section and resets anchors in its
// BASE section — neither is part of the homepage-scope extraction, so both live
// in their own stylesheets. Assert them there; a rule that moved must not
// silently vanish.
const formsCss = strip(readFileSync(FORMS_CSS, "utf8"));
const baseCss = strip(readFileSync(BASE_CSS, "utf8"));
// declarations only: comments in base.css discuss the whole point (the anchor
// reset) and would otherwise count as declarations in the checks below
const baseDecls = strip(readFileSync(BASE_CSS, "utf8").replace(/\/\*[\s\S]*?\*\//g, ""));
const layoutN = strip(layout);

// markup only: the frontmatter prose legitimately mentions some of the same words
const index = indexRaw.slice(indexRaw.indexOf("<Layout"), indexRaw.lastIndexOf("</Layout>"));
const indexTpl = index.slice(0, index.indexOf("<script"));
const indexJs = index.slice(index.indexOf("<script"));
const card = cardRaw.slice(cardRaw.indexOf("<article"), cardRaw.lastIndexOf("</article>"));

const count = (s, needle) => s.split(needle).length - 1;
const has = (s, needle) => s.includes(needle);

const orderIn = (hay, ...parts) => {
  let at = -1;
  for (const p of parts) {
    const i = hay.indexOf(p, at + 1);
    if (i === -1) return false;
    at = i;
  }
  return true;
};
const order = (...parts) => orderIn(indexTpl, ...parts);

const checks = [
  // ── wiring ────────────────────────────────────────────────────────────────
  ["Layout imports the homepage stylesheet", has(layout, 'import "../styles/home.css"')],
  ["homepage stylesheet exists and is the theme's", css.length > 40000 && has(css, ".hero{") && has(css, ".feat{")],

  // ── section order = front-page.php 2..8 ───────────────────────────────────
  ["sections render in WP order: hero → stats → featured → latest → newsletter",
    order('class="hero"', 'class="stat-strip"', 'class="con sg"', 'id="latest"', 'id="newsletter"')],
  ["main has exactly the 5 WP blocks (no stray wrapper, no invented section)",
    count(indexTpl, "<section") === 1 && count(indexTpl, '<div class="con sg"') === 3],
  ["the theme's stray unmatched </div> is NOT reproduced", count(indexTpl, "</div>") === count(indexTpl, "<div")],

  // ── 2. hero ───────────────────────────────────────────────────────────────
  ["hero is <section class=hero> with .hero-grain", has(indexTpl, '<section class="hero">') && has(indexTpl, 'class="hero-grain"')],
  ["hero .con carries WP's inline max-width/padding override",
    has(indexTpl, 'class="con" style="max-width:none;padding-top:0;padding-bottom:0"')],
  ["hero tag copy", has(indexTpl, '<div class="hero-tag">₦ Nigerian Finance · Honest Guides</div>')],
  ["hero H1 = .g + <br> + .w (WP's fallback branch)",
    has(indexTpl, '<h1 class="hero-h"><span class="g">Nigerian money.</span><br><span class="w">Explained.</span></h1>')],
  ["hero sub copy", has(indexTpl, "Savings, investing, dollar accounts, crypto, and every fintech app worth your attention. Tested by Gwill. No jargon. No AI slop.")],
  ["hero CTAs are .bh / .bhg (not .btn)", count(indexTpl, 'class="bh"') === 1 && count(indexTpl, 'class="bhg"') === 1],
  ["primary CTA copy + target", has(indexTpl, 'class="bh" href={`${base}articles/`}>Browse All Articles →</a>')],
  ["secondary CTA copy + target is /apps/ (WP says Finance Apps)", has(indexTpl, 'class="bhg" href={`${base}apps/`}>Finance Apps</a>')],
  ["hero topics label", has(indexTpl, '<span class="hero-cats-lbl">Topics:</span>')],
  ["chips use the theme's .db + per-slug chip class", has(indexTpl, 'class={`db ${c.chip}`}') && has(indexTpl, "CATEGORIES.map")],
  ["no .ledger element (does not exist in WP)", !has(indexTpl, "ledger")],
  ["no invented chip class", !has(indexTpl, 'class="chip"')],

  // ── 3. stats strip ────────────────────────────────────────────────────────
  ["stats strip is a sibling of .hero, not nested in it",
    indexTpl.indexOf('class="stat-strip"') > indexTpl.indexOf("</section>")],
  ["four stat cells", count(indexTpl, 'class="si"') === 4],
  ["stat numbers are WP's live values, static", has(indexTpl, '<div class="si-n">10+</div>') && has(indexTpl, '<div class="si-n">12+</div>') && has(indexTpl, '<div class="si-n">2+</div>') && has(indexTpl, '<div class="si-n">₦ 0</div>')],
  ["stat labels", has(indexTpl, "In-depth guides") && has(indexTpl, "Finance apps reviewed") && has(indexTpl, "All data current") && has(indexTpl, "Free to read")],
  ["no counter animation (WP has none)", !has(indexTpl, "data-count") && !has(indexJs, "requestAnimationFrame")],

  // ── 4. featured ───────────────────────────────────────────────────────────
  ["featured header is .shd > h2.stitle with no link (WP)", has(indexTpl, '<div class="shd"><h2 class="stitle">Featured Article</h2></div>')],
  ["featured art uses the category art class + .feat-emoji", has(indexTpl, 'class={`feat-img ${fcat.art}`}') && has(indexTpl, 'class="feat-emoji"')],
  ["featured badge links to the category", has(indexTpl, 'class={`badge ${fcat.badge}`} href={`${base}category/${featured.data.category}/`}')],
  ["featured title is a div.feat-t wrapping a link", has(indexTpl, '<div class="feat-t"><a href={furl}>')],
  ["featured excerpt is trimmed to 32 words like wp_trim_words", has(indexRaw, "w.slice(0, 32).join") && has(indexTpl, "{trim32(featured.data.description)}")],
  ["featured meta keeps the Read link INSIDE .feat-meta with margin-left:auto",
    has(indexTpl, '<a class="btn b-gold b-sm" style="margin-left:auto" href={furl}>Read →</a>') &&
    indexTpl.indexOf('class="feat-meta"') < indexTpl.indexOf("margin-left:auto")],
  ["featured meta = date · read · author with .feat-dot separators", count(indexTpl, 'class="feat-dot"') === 2 && has(indexTpl, "{featured.data.author}")],
  ["featured picks the theme-mod article, not simply the newest", has(site, 'export const FEATURED_SLUG = "grey-vs-geegpay-dollar-account"') && has(indexRaw, "FEATURED_SLUG")],

  // ── 5/6/7. grid + pills + ad ──────────────────────────────────────────────
  ["latest header keeps its View all link", has(indexTpl, '<a class="slink" href={`${base}articles/`}>View all →</a>')],
  ["pills strip carries WP's attributes verbatim",
    has(indexTpl, '<div class="cp-strip" data-gwill-filter style="margin-bottom:20px" role="group" aria-label="Filter articles by category">')],
  ["All pill is .cp.on with empty data-gwill-cat and aria-pressed=true",
    has(indexTpl, '<button type="button" class="cp on" data-gwill-cat="" aria-pressed="true">All</button>')],
  ["one pill per category, aria-pressed=false", has(indexTpl, 'class="cp" data-gwill-cat={c.slug} aria-pressed="false"')],
  ["grid is #gwill-posts-grid wrapping a .g3 (WP's structure)", has(indexTpl, '<div id="gwill-posts-grid">') && has(indexTpl, '<div class="g3">')],
  ["cards render newest-9-including-featured", has(indexRaw, "const grid = posts.slice(0, 9)")],
  ["ad slot is an EMPTY .ad-bg with WP's inline margin", has(indexTpl, '<div class="ad-bg" style="margin-top:28px"></div>')],
  ["no ad placeholder text", !has(indexTpl, "Ad slot — fills") && !has(indexTpl, "Advertisement")],
  ["no AJAX endpoint (static build: no fetch, no XHR)",
    !has(indexJs, "fetch(") && !has(indexJs, "XMLHttpRequest") && !has(indexJs, "admin-ajax.php")],

  // ── 8. newsletter ─────────────────────────────────────────────────────────
  ["newsletter band wrapper", has(indexTpl, '<div class="nl-s">') && has(indexTpl, '<div class="nl-copy">')],
  ["newsletter heading copy", has(indexTpl, '<h2 class="nl-h">Nigerian money news, weekly.</h2>')],
  ["newsletter blurb is the shipped copy incl. the ⚡ WP's default lacks",
    has(indexTpl, "Rate changes, app reviews, and the financial moves worth making. Free, no spam, unsubscribe anytime. ⚡")],
  ["newsletter meta = 3 ✓ items + 2 dots", count(indexTpl, "✓ ") === 3 && count(indexTpl, 'class="dot"') === 2],
  ["form prompt copy", has(indexTpl, "Get new posts in your inbox.")],
  ["form is .gwill-form.gwill-form--newsletter, method=post, novalidate",
    has(indexTpl, 'class="gwill-form gwill-form--newsletter" method="post" novalidate')],
  ["honeypot field exactly as WP ships it",
    has(indexTpl, '<label for="gwill_hp_gwill-newsletter-1">Leave this blank</label>') &&
    has(indexTpl, 'name="gwill_hp" id="gwill_hp_gwill-newsletter-1" tabindex="-1" autocomplete="off"')],
  ["hidden action inputs preserved",
    has(indexTpl, '<input type="hidden" name="action" value="gwill_contact_form">') &&
    has(indexTpl, '<input type="hidden" name="gwill_form_id" value="newsletter">')],
  ["email field: screen-reader label, placeholder, required, autocomplete",
    has(indexTpl, 'class="screen-reader-text"') && has(indexTpl, 'placeholder="Your email" required autocomplete="email"')],
  ["submit carries both WP labels", has(indexTpl, '<span class="gwill-form__submit-text">Subscribe</span>') && has(indexTpl, '<span class="gwill-form__submit-loading" aria-hidden="true">Subscribing…</span>')],
  ["status region is a live alert", has(indexTpl, '<div class="gwill-form__status" role="alert" aria-live="polite"></div>')],
  ["no 'no email field here yet' draft notice", !has(indexTpl, "No email field here yet") && !has(indexTpl, "fake control")],
  ["the form explains itself honestly instead of faking a subscription",
    has(indexJs, "the list opens at launch, so nothing was sent") && !has(indexJs, "location.href")],

  // ── behaviour (ported from main.js / category-filter.js) ──────────────────
  ["pill strip is wrapped with WP's chrome", has(indexJs, "cp-strip-wrap") && has(indexJs, "cp-scroll-btn cp-scroll-prev") && has(indexJs, "cp-scroll-btn cp-scroll-next")],
  ["scroll buttons carry WP's aria-labels", has(indexJs, "Scroll categories left") && has(indexJs, "Scroll categories right")],
  ["scroll step is 70% of the strip (main.js)", has(indexJs, "clientWidth*0.7") || has(indexJs, "clientWidth * 0.7")],
  ["strip state classes drive the CSS", has(indexJs, "has-overflow") && has(indexJs, "can-prev") && has(indexJs, "can-next")],
  ["arrow-key navigation between pills (main.js §15)", has(indexJs, 'e.key!=="ArrowLeft"&&e.key!=="ArrowRight"')],
  ["clicking the active pill does nothing (category-filter.js rule)", has(indexJs, 'if(b.classList.contains("on"))return;')],
  ["filter swaps the grid body like WP's AJAX path", has(indexJs, "fgrid.innerHTML=original") && has(indexJs, 'getAttribute("data-cat")')],
  ["empty state is WP's exact paragraph, without the .g3 wrapper",
    has(indexJs, "'<p class=\"gwill-filter-empty\">No articles here yet, check back soon.</p>'")],
  ["pills keep aria-pressed in sync", has(indexJs, 'setAttribute("aria-pressed"')],
  ["card image fade class matches the theme's", has(indexJs, "gwill-img-in")],

  // ── the card partial ──────────────────────────────────────────────────────
  ["card is article.ac with a category- class + data-cat",
    has(card, "class={`ac category-${category}`}") && has(card, "data-cat={category}")],
  ["card media is the no-thumbnail branch (art class + .ac-emoji)", has(card, "class={`ac-img ${c.art}`}") && has(card, '<span class="ac-emoji">')],
  ["card body: badge → h2.ac-t → .ac-ex > p → .ac-ft", orderIn(card, 'class="ac-body"', 'class={`badge ${c.badge}`}', 'class="ac-t"', 'class="ac-ex"', 'class="ac-ft"')],
  ["card title is an h2, not a p (WP a11y)", has(card, '<h2 class="ac-t"><a href={url}>') && !has(card, 'class="card-t"')],
  ["card meta .a-dt is '{M Y} · {n} min' and .a-rd is 'Read →'",
    has(card, '<span class="a-dt">{date} · {readMins} min</span>') && has(card, '<a class="a-rd" href={url}>Read →</a>')],
  ["no invented card classes left", !has(card, 'class="card"') && !has(card, "tile-wm") && !has(card, "card-art")],
  ["card does not render the author (WP cards don't)", !has(card, "{author}")],

  // ── data: the theme's exact maps ──────────────────────────────────────────
  ["Category carries the chip class field", has(site, "chip: string;")],
  ["savings = bgn / i-sav / db-g", has(site, 'slug: "savings"') && has(site, 'badge: "bgn", art: "i-sav", chip: "db-g"')],
  ["investing = bgn / i-inv / db-gr (port previously had bg)", has(site, 'badge: "bgn", art: "i-inv", chip: "db-gr"')],
  ["crypto = bpu / i-cry / db-p", has(site, 'badge: "bpu", art: "i-cry", chip: "db-p"')],
  ["banking = bsl / i-ban / db-s", has(site, 'badge: "bsl", art: "i-ban", chip: "db-s"')],
  ["remittance = bsl / i-rem / db-g (port previously had brd)", has(site, 'badge: "bsl", art: "i-rem", chip: "db-g"')],
  ["dollar-accounts = bg / i-dol / db-gr (port previously had bsl)", has(site, 'badge: "bg", art: "i-dol", chip: "db-gr"')],
  ["unknown slug falls back to the theme's bsl / i-dol / db-g", has(site, 'badge: "bsl",\n    art: "i-dol",\n    chip: "db-g",')],

  // ── stylesheet: the values measurement had to fight for ───────────────────
  [".con = theme's 1100px container with var(--con-pad) padding", has(css, ".con{max-width:1100px;margin:0auto;padding:0var(--con-pad)}")],
  [".g3 = theme's 3-up grid, gap 16px (legacy had 20/24px)", has(css, ".g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}")],
  ["media: .g3 2-up at ≤1023px, 1-up at ≤767px", has(css, ".g3{grid-template-columns:1fr1fr}") && has(css, ".g3{grid-template-columns:1fr}")],
  [".feat = theme's 1fr 1fr (legacy had 1fr 1.4fr)", has(css, ".feat{background:var(--surface);border:1pxsolidvar(--border);border-radius:var(--r-lg);overflow:hidden;display:grid;grid-template-columns:1fr1fr}")],
  [".feat collapse to one column at ≤1023px", has(css, ".feat{grid-template-columns:1fr}")],
  [".cp.on = theme's gold pill (legacy made it dark)", has(css, ".cp.on{background:var(--gold-btn);border-color:var(--gold-btn);color:#fff}")],
  ["chip tints are the theme's per-variant colours",
    has(css, ".db-g{background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.2);color:var(--gold-b)}") &&
    has(css, ".db-gr{background:rgba(34,197,94,0.08);border-color:rgba(34,197,94,0.18);color:#22c55e}") &&
    has(css, ".db-p{background:rgba(124,58,237,0.1);border-color:rgba(124,58,237,0.2);color:#a78bfa}") &&
    has(css, ".db-s{")],
  [".hero-acts is a flex row with gap 12px", has(css, ".hero-acts{display:flex;align-items:center;gap:12px;position:relative;z-index:1}")],
  [".hero-acts stacks on phones", has(css, ".hero-acts{flex-direction:column;align-items:stretch}")],
  [".stat-strip is the theme's gold-tinted band", has(css, ".stat-strip{background:var(--gold-muted);border-top:1pxsolidvar(--gold-border)")],
  [".stat-strip goes 2-up at ≤767px", has(css, ".stat-strip{display:grid;grid-template-columns:1fr1fr}")],
  [".si-l typography is the theme's", has(css, ".si-l{font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-mid);margin-top:3px}")],
  ["#gwill-posts-grid carries the loading contract the filter uses", has(css, "#gwill-posts-grid{position:relative;transition:min-height240msease}") && has(css, "#gwill-posts-grid.gwill-loading")],
  [".ad-bg reserves nothing when empty (WP measured 0x0 display:none)", has(css, ".ad-bg{")],
  ["newsletter input uses --gold-input-border (token added by the port)", has(css, "--gold-input-border:rgba(245,158,11,0.4)") && has(css, ".nl-s.gwill-forminput[type=\"email\"]{background:var(--dark-s);border:1pxsolidvar(--gold-input-border);color:#f0ede6}")],
  ["the hidden submit label is actually hidden (measured bug)", has(formsCss, ".gwill-form__submit-loading{display:none}")],
  ["the honeypot is off-screen, not visible (measured bug)", has(formsCss, ".gwill-honey{position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden}")],

  // ── the two layers the homepage-scope extraction could not see ────────────
  // Both defects here were reported from a phone: every link underlined, and
  // the newsletter field rendering as a browser-default box. Each assertion
  // below pins the rule that fixes it, in the file that owns it.
  ["Layout imports the base layer (anchor reset)", has(layout, 'import "../styles/base.css"')],
  ["Layout imports the forms layer", has(layout, 'import "../styles/forms.css"')],
  ["base layer imports BEFORE the component stylesheets (so components still win)",
    layout.indexOf('import "../styles/base.css"') < layout.indexOf('import "../styles/header.css"')],
  ["base anchor reset = WP style.css:186 verbatim", has(baseCss, "a{text-decoration:none;color:inherit}")],
  ["base layer does NOT reintroduce an underline declaration",
    !(/a\{[^}]*text-decoration:\s*underline/).test(baseDecls) && !has(baseDecls, "text-decoration:underline")],
  ["form controls inherit the brand font (WP style.css:189)",
    has(baseCss, "input,select,textarea{font-family:var(--font)}")],
  ["screen-reader-text / skip-link hiding rule installed (WP style.css:191-194)",
    has(baseDecls, ".skip-link,.screen-reader-text{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(1px,1px,1px,1px);clip-path:inset(50%)}")],
  ["skip-link focus reveal installed (WP style.css:195-198)",
    has(baseDecls, ".skip-link:focus{position:fixed;top:8px;left:8px;z-index:9999;width:auto;height:auto;clip:auto;clip-path:none;background:var(--gold);color:#fff;padding:8px16px;border-radius:var(--r-sm);font-size:12px;font-weight:700}")],
  ["the newsletter label carries the class that hides it, not a duplicate visible label",
    has(indexTpl, 'class="screen-reader-text"')],
  ["control geometry: WP style.css:2889-2894 verbatim (the browser-default box fix)",
    has(formsCss, '.gwill-forminput[type="text"],.gwill-forminput[type="email"],.gwill-forminput[type="tel"],.gwill-formtextarea,.gwill-formselect{width:100%;border:1pxsolidvar(--border);border-radius:var(--r-md);padding:12px16px;font-size:16px;background:var(--surface);color:var(--text);outline:none;')],
  ["control height 46px + textarea min-height 150px (WP style.css:2893-2895)",
    has(formsCss, "height:46px") && has(formsCss, ".gwill-formtextarea{height:auto;min-height:150px;resize:vertical;line-height:1.6}")],
  ["label styling: 11px/700/uppercase/--text-mid (WP style.css:2928)",
    has(formsCss, ".gwill-formlabel{display:block;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-mid);margin-bottom:8px}")],
  ["focus ring + autofill guards kept (WP style.css:2906-2927)",
    has(formsCss, ".gwill-forminput:focus,.gwill-formtextarea:focus,.gwill-formselect:focus{border-color:var(--gold);box-shadow:0003pxrgba(217,119,6,0.12)}") &&
    has(formsCss, "-webkit-box-shadow:0001000pxvar(--surface)inset!important")],
  ["select chevron + select:invalid kept (WP style.css:2897-2902)",
    has(formsCss, "appearance:none;-webkit-appearance:none;cursor:pointer;padding-right:40px") && has(formsCss, ".gwill-formselect:invalid{color:var(--text-dim)}")],
  ["submit base geometry (WP style.css:2931)",
    has(formsCss, ".gwill-form__submit{background:var(--gold-btn);color:#fff;border:none;font-size:14px;font-weight:700;padding:14px28px;border-radius:var(--r-md);")],
  ["field/status/error chrome present",
    has(formsCss, ".gwill-form.gwill-form__field{margin-bottom:18px}") &&
    has(formsCss, ".gwill-form__status{margin-top:12px;font-size:12px;font-weight:700;min-height:1.4em}") &&
    has(formsCss, ".gwill-form__field-error{display:block;margin-top:6px;font-size:12px;font-weight:700;line-height:1.4;color:var(--red)}")],
  ["form rules are NOT duplicated back into home.css (one home per rule)",
    !has(css, ".gwill-honey{") && !has(css, ".gwill-form__submit-loading{display:none}")],
  ["loading swap rules kept for a future endpoint", has(formsCss, ".gwill-form__submit[data-loading].gwill-form__submit-text{display:none}")],
  ["touch reset for the pills (WP section 54 discipline)", has(css, "@media(hover:none)")],
  ["reduced-motion honoured", has(css, "@media(prefers-reduced-motion:reduce)") && has(css, "animation-duration:2s")],
  ["print rules present", has(css, "@mediaprint")],
  ["aspect-ratio fallback kept", has(css, "@supportsnot(aspect-ratio:16/9)")],
  ["no duplicate dark TOKEN block (Layout already owns them; only element rules here)",
    !has(css, '[data-theme="dark"]{--')],

  // ── the legacy system must not fight the theme again ──────────────────────
  ["responsive container padding: tablet 28px + phone 20px",
    layoutN.includes("@media(max-width:1023px){:root{--con-pad:28px;--header-h:56px}}") &&
    layoutN.includes("@media(max-width:767px){:root{--con-pad:20px}}")],
  ["legacy .con width rule removed from Layout", !has(layoutN, ".con{width:calc(100%-32px)")],
  ["legacy .g3 gap overrides removed from Layout", !has(layoutN, "gap:24px}") || !has(layoutN, ".g3{grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}")],
  ["legacy .feat 1.4fr rule removed from Layout", !has(layoutN, "minmax(0,1.4fr)")],
  ["legacy dark .cp.on rule removed from Layout", !has(layoutN, '.cp.on,.cp[aria-pressed="true"]')],
  ["legacy hero button rules are inert (markup no longer uses them)", !has(indexTpl, 'class="btn b-gold" href={`${base}articles/`}')],
];

let pass = 0;
const fails = [];
for (const [label, ok] of checks) {
  if (ok) { pass++; console.log(`PASS  ${label}`); }
  else { fails.push(label); console.log(`FAIL  ${label}`); }
}

console.log(`\nhomepage fidelity contract: ${fails.length ? `FAIL (${fails.length} check(s) failed)` : `PASS (${checks.length} checks)`}`);
if (fails.length) process.exit(1);
