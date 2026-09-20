// Header fidelity contract check — GWill Finance WordPress → Astro port.
// Asserts every MUST clause from the header port spec against the built
// layout source and the data module. Exit 0 + "header fidelity contract: PASS"
// on full success; prints each FAIL and exits 1 otherwise.
import { readFileSync } from "node:fs";
import assert from "node:assert";

const LAYOUT = "/home/opc/work/finance-astro/src/layouts/Layout.astro";
const SITES = "/home/opc/work/finance-astro/src/data/site.ts";
const HEADERCSS = "/home/opc/work/finance-astro/src/styles/header.css";
const layout = readFileSync(LAYOUT, "utf8");
const site = readFileSync(SITES, "utf8");
const css = readFileSync(HEADERCSS, "utf8");

const brand = '<span class="n">₦</span><span class="nm">gwillchijioke</span>';
const newsletterDesktop = '>Newsletter →<';
const newsletterMobile = 'Subscribe to Newsletter →';
const placeholder = "Search savings, investing, cards";
const tpSegs = ["dark", "system", "light"];
const tickerVals = ["USD/NGN", "GBP/NGN", "EUR/NGN", "BTC/USD", "ETH/USD", "XAU/USD"];
const tickerRates = ["₦1,336", "₦1,786", "₦1,533", "$80,469", "$2,583", "$4,379"];

const forbidden = [
  "gwillfinance",
  `id="theme-toggle"`,
  `id="nav-mobile"`,
  "class=\"site-header\"",
  "theme-toggle",
  "nav-mobile",
];

const checks = [
  ["<div id=\"top\"></div> present", layout.includes('<div id="top"></div>')],
  ["desktop header .sh", /class="sh"/.test(layout)],
  ["mobile header .mh", /class="mh"/.test(layout)],
  ["brand ₦gwillchijioke (desktop .logo)", layout.includes('<a class="logo"') && layout.includes(brand)],
  ["brand in drawer/logo present", layout.includes(brand)],
  ["NOT gwillfinance", !layout.includes("gwillfinance") && !site.includes("gwillfinance")],
  ["NOT id=\"theme-toggle\"", !layout.includes('id="theme-toggle"')],
  ["NOT id=\"nav-mobile\"", !layout.includes('id="nav-mobile"')],
  ["theme pill data-theme-group + data-current=system", layout.includes("data-theme-group") && layout.includes('data-current="system"')],
  ["data-theme-set dark/system/light", tpSegs.every((s) => layout.includes(`data-theme-set="${s}"`))],
  ["data-gwill-search-toggle", layout.includes("data-gwill-search-toggle")],
  ["spotlight panel id=gwill-search-panel", layout.includes('id="gwill-search-panel"')],
  [`placeholder ${placeholder}`, layout.includes(placeholder)],
  ["drawer id=mobile-nav", layout.includes('id="mobile-nav"')],
  ["aria-trigger: Subscribe to Newsletter →", layout.includes(newsletterMobile)],
  ["desktop CTA Newsletter →", layout.includes(newsletterDesktop)],
  ["search input combobox + listbox controls", layout.includes('role="combobox"') && layout.includes('id="gwill-search-results"') && layout.includes('role="listbox"')],
  ["gs-foot keyboard hints (↑↓/Enter/Esc)", /gs-foot/.test(layout) && layout.includes("<kbd>↑</kbd><kbd>↓</kbd>") && layout.includes("<kbd>Enter</kbd>") && layout.includes("<kbd>Esc</kbd>")],
  ["ticker .ticker-drag>.ticker-inner + .ti", /class="ticker-drag"/.test(layout) && /class="ticker-inner"/.test(layout) && /class="ti"/.test(layout)],
  ["ticker has .t-pair/.t-rate", layout.includes("class=\"t-pair\"") && layout.includes("class=\"t-rate\"")],
  ["ticker NAV nested children (site.ts)", site.includes("children:")],
  ["ticker all 6 pairs in TICKER_STATIC", tickerVals.every((p) => site.includes(p))],
  ["ticker all 6 rates in TICKER_STATIC", tickerRates.every((r) => site.includes(r))],
  ["newsletter CTA links to ${base}#newsletter", layout.includes("newsletterHref") && layout.includes("${base}#newsletter")],
  ["nested nav: All Articles > Investing > Fixed Income", site.includes("All Articles") && site.includes("Investing") && site.includes("Fixed Income") && site.includes("category/investing/fixed-income/")],
  ["mobile accordion sub-menu class", /\bsub-menu\b/.test(layout)],
  ["header.css ticker/theme/search rules present", css.includes(".ticker") && css.includes(".tp-seg") && css.includes(".gs-row") && css.includes(".snav-list")],
  ["header.css imported", layout.includes("header.css")],
  ["theme pill first-paint (v3 localStorage)", layout.includes("gwill-finance-theme-v3")],
  ["mobile-nav .open class + inert handling", layout.includes(".mno") && layout.includes("inert") && layout.includes(".open")],
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
  console.log(`\nheader fidelity contract: FAIL (${fail} check(s) failed)`);
  process.exit(1);
}
console.log("\nheader fidelity contract: PASS");