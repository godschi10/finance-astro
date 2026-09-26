// Footer fidelity contract — GWill Finance WordPress → Astro port.
//
// Asserts the footer port against the WP source of truth (gwill-finance-theme
// 1.13.39, footer.php sections 2–5 + section 19 of the stylesheet). Every CSS
// expectation below is a verbatim WP value: if a declaration is reordered or a
// number drifts, this gate fails. Whitespace is collapsed before matching so the
// assertions stay readable while remaining exact about values and order.
import { readFileSync } from "node:fs";
import assert from "node:assert";

const LAYOUT = "/home/opc/work/finance-astro/src/layouts/Layout.astro";
const FOOTER = "/home/opc/work/finance-astro/src/components/Footer.astro";
const SITE = "/home/opc/work/finance-astro/src/data/site.ts";
const CSSFILE = "/home/opc/work/finance-astro/src/styles/footer.css";

const layout = readFileSync(LAYOUT, "utf8");
const footerRaw = readFileSync(FOOTER, "utf8");
const site = readFileSync(SITE, "utf8");
const css = readFileSync(CSSFILE, "utf8").replace(/\s+/g, " ").trim();

// Markup only — the frontmatter comments and the inline <script> legitimately
// repeat some attribute names (e.g. the note explaining the dropped WP id).
const footer = footerRaw.slice(
  footerRaw.indexOf('<footer class="footer">'),
  footerRaw.lastIndexOf("</footer>") + "</footer>".length,
);
const count = (s, needle) => s.split(needle).length - 1;
const has = (s, needle) => s.includes(needle);

const checks = [
  // ── wiring ────────────────────────────────────────────────────────────────
  ["Layout imports the footer stylesheet", has(layout, 'import "../styles/footer.css"')],
  ["Layout renders <Footer />", has(layout, "<Footer />")],
  ["placeholder footer markup is gone", !has(layout, 'class="footer-grid"') && !has(layout, 'class="flink-list"')],
  ["no leftover placeholder CSS", !has(layout, ".footer-bottom{") && !has(layout, ".colophon{") && !has(layout, ".socials a{")],

  // ── two footers, WP-swapped ───────────────────────────────────────────────
  ["desktop footer <footer class=footer>", count(footer, '<footer class="footer">') === 1],
  ["mobile footer <footer class=mfooter>", count(footer, '<footer class="mfooter">') === 1],
  ["desktop grid .ftop + brand column", count(footer, 'class="ftop"') === 1 && count(footer, 'class="fcol fcol--brand"') === 1],
  ["brand lockup .flogo .n + .nm (both footers)", count(footer, 'class="flogo"') === 2 && count(footer, '<span class="n">₦</span><span class="nm">gwillchijioke</span>') === 2],
  ["blurb .ftag in both footers (mobile keeps WP inline size)", count(footer, 'class="ftag"') === 2 && has(footer, 'style="margin-top:4px;font-size:11px"')],
  ["network line .fnet", count(footer, 'class="fnet"') === 1 && has(footer, "Part of the gwillchijioke.com network")],
  ["social nav .fsoc x2 (desktop + mobile, mobile keeps WP inline margin)", count(footer, 'class="fsoc"') === 2 && has(footer, 'style="margin:16px 0"')],
  ["social icon links .soci (mapped, 4 per footer source)", count(footer, 'class="soci"') === 2],
  ["social set = x/instagram/linkedin/youtube (no github in WP footer)", ["x:", "instagram:", "linkedin:", "youtube:"].every((k) => has(footerRaw, k)) && !has(footerRaw, "github:")],

  // ── follow CTAs ───────────────────────────────────────────────────────────
  ["follow CTA row .ffollow x2", count(footer, 'class="ffollow"') === 2],
  ["push bell button x2", count(footer, "data-push-bell") === 2 && has(footer, "Notify me of new posts")],
  ["bell uses WP-faithful copy but NOT the duplicate WP id", !has(footer, 'id="gwill-bell"')],
  // King's order 2026-09-26: "Remove that add to Google widget, it's useless" —
  // the fgooglenews anchors and gnews icon are GONE from both footers.
  ["Google News widget REMOVED (King 2026-09-26)", !footer.includes("fgooglenews") && !footer.includes("Add to Google News") && !footer.includes("publishercenter.google.com")],
  ["install buttons x2 each (desktop+mobile)", count(footer, "data-install-app") === 2 && count(footer, "data-install-ios") === 2],
  ["install buttons start hidden (WP contract)", count(footer, "hidden") >= 4],
  ["install labels + states from WP", has(footer, 'data-label-alt="Install not available"') && has(footer, 'data-label-done="App installed"')],
  ["iOS button dashed variant + guide text", count(footer, 'class="finstall finstall--ios"') === 2 && has(footerRaw, "Tap Share (⌫) then “Add to Home Screen”")],

  // ── columns + bottom bar ──────────────────────────────────────────────────
  ["column titles: Articles / Finance Apps / Network (desktop)", ["Articles", "Finance Apps", "Network"].every((t) => has(footerRaw, t))],
  ["mobile grid .mfgrid adds the Site column", count(footer, 'class="mfgrid"') === 1 && has(footerRaw, "Site")],
  ["empty footer ad wrapper collapses (WP v1.12.10)", count(footer, 'class="ad-bg ad-bg--footer"') === 1 && css.includes(".ad-bg--footer:empty")],
  ["desktop bottom bar .fbot", count(footer, 'class="fbot"') === 1 && has(footer, "Gwill Chijioke")],
  ["credit: 'Designed & built by' + linked name in both footers", count(footer, "Designed &amp; built by") === 2 && count(footer, 'class="fcredit-link"') === 2 && has(footer, ">G-will Chijioke</a>")],
  ["legal row: Privacy · Disclaimer · Affiliates", ["Privacy", "Disclaimer", "Affiliates"].every((t) => has(footerRaw, t)) && has(footer, 'class="fdot"')],
  ["back-to-top link x2 (mobile keeps WP inline colour)", count(footer, "Back to top ↑") === 2 && has(footer, 'style="color:var(--dark-dim)"')],
  ["copyright line is the site host, like WP home_url()", has(footer, "&copy; {year} {copyrightHost}")],
  ["mobile bottom bar .mfbot + .mfcredit", count(footer, 'class="mfbot"') === 1 && count(footer, 'class="mfcredit"') === 1],

  // ── data module ───────────────────────────────────────────────────────────
  ["FOOTER_GROUPS articles/apps/site", has(site, "FOOTER_GROUPS") && ["articles:", "apps:", "site:"].every((k) => has(site, k))],
  ["articles group = WP set", ["All Articles", "Savings", "Investing", "Crypto"].every((t) => has(site, t))],
  ["apps group = WP set", ["Dollar Accounts", "Finance Apps", "Banking", "Remittance"].every((t) => has(site, t))],
  ["site group = WP set", ["Money Calculators", "About", "Contact"].every((t) => has(site, t))],
  ["network column differs per footer (WP footer.php 72-80 vs 137-143)", has(site, "FOOTER_NETWORK") && has(site, "desktop:") && has(site, "mobile:") && has(site, "tech.gwillchijioke.com")],
  ["no dead /all-articles/ link anywhere", !has(site, 'href: "/all-articles/"')],

  // ── CSS: verbatim WP values ───────────────────────────────────────────────
  ["desktop footer slab + 72px offset", css.includes(".footer { background: var(--dark); padding: 48px var(--con-pad) 24px; margin-top: 72px; }")],
  ["desktop grid 2fr 1fr 1fr 1fr, 32px gap, 40px base", css.includes(".ftop { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px; margin-bottom: 40px; }")],
  ["brand column capped at 320px", css.includes(".fcol--brand { max-width: 320px; }")],
  ["logo lockup: baseline, 800, -0.03em", css.includes(".flogo { display: inline-flex; align-items: baseline; font-weight: 800; font-size: 16px; letter-spacing: -0.03em; margin-bottom: 12px; }")],
  ["gold ₦ with its glow", css.includes(".flogo .n { color: var(--gold-b); text-shadow: 0 0 12px rgba(245,158,11,0.35); margin-right: 0.12em; }")],
  ["blurb + network typography", css.includes(".ftag { font-size: 12px; font-weight: 300; color: var(--dark-dim); line-height: 1.75; margin-bottom: 10px; }") && css.includes(".fnet { font-size: 10px; color: var(--dark-dim); font-weight: 300; margin-bottom: 14px; }")],
  ["social tiles 34px, 8px radius, dark tokens", css.includes(".fsoc .soci { width: 34px; height: 34px; border-radius: 8px; background: var(--dark-s); border: 1px solid var(--dark-b);")],
  ["social hover lifts + golds", css.includes(".fsoc .soci:hover { border-color: var(--gold-border); color: var(--gold-b); transform: translateY(-1px); }")],
  ["breathing space .ffollow + .fsoc (King, v1.9.3)", css.includes(".ffollow + .fsoc { margin-top: 18px; }")],
  ["CTA pill geometry (13px/700, 10px 16px, r10, gold border)", css.includes(".fpush, .fgooglenews { font: inherit; font-size: 13px; font-weight: 700; line-height: 1; letter-spacing: 0.01em; padding: 10px 16px; border-radius: 10px; cursor: pointer; border: 1px solid var(--gold-border); background: var(--dark-s); color: var(--gold-b);")],
  ["CTA hover = solid gold, dark ink", css.includes(".fpush:hover, .fgooglenews:hover { border-color: var(--gold-b); background: var(--gold-b); color: #0d0b08; transform: translateY(-1px); }")],
  ["install = outlined variant of the same pill", css.includes(".finstall { font: inherit; font-size: 13px; font-weight: 700; line-height: 1; letter-spacing: 0.01em; padding: 10px 16px; border-radius: 10px; cursor: pointer; border: 1px solid var(--gold-border); background: transparent;")],
  ["install hidden until installable", css.includes(".finstall[hidden] { display: none; }") && css.includes(".finstall--ios { border-style: dashed; }")],
  ["push states (on / unsupported)", css.includes('.fpush[data-push-state="on"] { background: var(--gold-b); color: #0d0b08; border-color: var(--gold-b); }') && css.includes('.fpush[disabled], .fpush[data-push-state="unsupported"] { opacity: 0.55; cursor: not-allowed; transform: none; }') && css.includes('.fpush[data-push-state="unsupported"] { text-decoration: line-through; }')],
  ["iOS guide note styling", css.includes(".finstall-note { display: block; width: 100%; margin-top: 8px; font-size: 11px;")],
  ["column title 9px / 0.2em uppercase", css.includes(".fct { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #f0ede6; margin-bottom: 12px; }")],
  ["link rows 12px/300 with the warm hover", css.includes(".fl { display: block; font-size: 12px; font-weight: 300; color: var(--dark-dim); margin-bottom: 8px; transition: color var(--t); }") && css.includes(".fl:hover { color: #c4b89a; }")],
  ["bottom bar rule + spacing", css.includes(".fbot { border-top: 1px solid var(--dark-b); padding-top: 20px;") && css.includes("justify-content: space-between;")],
  ["credit link readable on dark (gold underline)", css.includes(".fcredit-link { color: #f0ede6; font-weight: 700; text-decoration: underline; text-decoration-color: rgba(245, 158, 11, 0.45); text-underline-offset: 3px;")],
  ["legal separators + back-to-top", css.includes(".fdot { color: var(--dark-dim); margin: 0 6px; opacity: 0.6; }") && css.includes(".ftoplink { color: var(--dark-dim); font-weight: 700; transition: color var(--t); }")],
  ["mobile footer slab + 2-col grid + stacked bottom bar", css.includes(".mfooter { background: var(--dark); padding: 32px 20px 24px; margin-top: 40px; }") && css.includes(".mfgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }") && css.includes(".mfbot { padding-top: 14px; display: flex; flex-direction: column; gap: 6px; font-size: 10px; color: var(--dark-dim); font-weight: 300; }")],
  ["tablet: compact footer padding + 2-col grid at ≤1023px (WP section 49)", css.includes("@media (max-width: 1023px) { .footer { padding: 36px var(--con-pad) 20px; } .ftop { grid-template-columns: 1fr 1fr; } }")],
  ["phone: .footer hidden / .mfooter shown at ≤767px", /@media \(max-width: 767px\) \{ .*\.mfooter \{ display: block; \} \.footer \{ display: none; \} \}/.test(css)],
  ["desktop/tablet: .mfooter hidden at ≥768px", css.includes("@media (min-width: 768px) { .mfooter { display: none; } }")],
  ["touch: hover style must not stick after a tap (WP section 54)", css.includes("@media (hover: none) { .fsoc .soci:hover { border-color: var(--dark-b); color: var(--dark-dim); transform: none; } }")],
  ["bell explains itself when there is no push backend", has(footerRaw, "Push notifications need a push service")],
  ["every icon is rendered as markup, never escaped text", !/>\{ICON\./.test(footerRaw) && (footerRaw.match(/set:html=\{ICON/g) || []).length >= 8],
  ["print: drop the grid + CTA row", css.includes("@media print { .ftop, .fpush, .ad-bg--footer { display: none !important; } }")],
];

let fail = 0;
for (const [name, pass] of checks) {
  try {
    assert.ok(pass, name);
    console.log(`PASS  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${e.message}`);
  }
}

if (fail) {
  console.log(`\nfooter fidelity contract: FAIL (${fail} check(s) failed)`);
  process.exit(1);
}
console.log(`\nfooter fidelity contract: PASS (${checks.length} checks)`);
