#!/usr/bin/env node
/*
 * check-css-parse.mjs — v0.6.8 (King: "fix all space issues, then do it sitewide")
 *
 * The root cause of the site-wide cramp was a CORRUPTED CSS COMMENT:
 *   `@media (max-width: 767px) at style.css:2413-2417` lost its `/*` opener,
 * so Chrome parsed the following comment prose as an at-rule + selector and
 * SWALLOWED the real `.art-body { font-size: 16px; line-height: 1.8 }` rule
 * that followed it. Every source grep saw the bytes; only the PARSE lost the
 * rule. This gate runs the same parse the browser does.
 *
 * Checks:
 *  1. postcss parses every stylesheet with ZERO warnings (no stray text
 *     outside comments, no unterminated blocks, no malformed at-rule preludes).
 *  2. Anchor assertions on rules whose silent loss changes the whole site's
 *     typography: the .art-body base and its h2, the .fx-copy pair (cascade
 *     order contract — both must exist, article.css loaded AFTER tools.css).
 *  3. Layout import order: article.css must be imported AFTER tools.css
 *     (live WP serves art-body after fx-copy; the import order IS the winner).
 */
import postcss from "postcss";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "src/styles";
let fail = 0;
const err = (m) => { console.log(`FAIL  ${m}`); fail++; };
const ok  = (m) => console.log(`PASS  ${m}`);

for (const f of readdirSync(dir).filter((x) => x.endsWith(".css"))) {
  const css = readFileSync(join(dir, f), "utf8");
  const warnings = [];
  try {
    postcss.parse(css, { from: join(dir, f), warn: (w) => warnings.push(w.text) });
  } catch (e) {
    err(`${f}: postcss PARSE ERROR — ${String(e.message).slice(0, 120)}`);
    continue;
  }
  if (warnings.length) err(`${f}: ${warnings.length} parse warning(s): ${warnings[0].slice(0, 120)}`);
  else ok(`${f}: parses clean (${css.split(/\n/).length} lines)`);
  // no at-rule line may carry stray prose after the closing paren (the swallow signature)
  const stray = css.match(/^\s*@(media|supports|keyframes)[^{]*\bat style\.css/gm);
  if (stray) err(`${f}: at-rule lines with prose outside a comment: ${stray[0].slice(0, 80)}`);
}

// anchor rules + cascade order
const art = readFileSync(join(dir, "article.css"), "utf8");
const tools = readFileSync(join(dir, "tools.css"), "utf8");
const treeA = postcss.parse(art);
const treeT = postcss.parse(tools);
const find = (root, sel, decl) => {
  // ROOT-level rules only (depth 0): the @media (min-width:1024px) re-declaration
  // is desktop polish; the BASE value is the phone/tablet truth this gate pins.
  let hit = null;
  root.each((n) => {
    if (n.type === "rule" && n.selectors.includes(sel) && hit === null)
      n.walkDecls(decl, (d) => { if (hit === null) hit = d.value; });
  });
  return hit;
};
const body16 = find(treeA, ".art-body", "font-size");
if (body16 === "16px") ok(".art-body base font-size is 16px (live parity)"); else err(`.art-body base font-size = ${body16} (must be 16px — its loss/sink caused the site-wide cramp)`);
const bodyLH = find(treeA, ".art-body", "line-height");
if (bodyLH === "1.8") ok(".art-body line-height 1.8"); else err(`.art-body line-height = ${bodyLH}`);
const h2_20 = find(treeA, ".art-body h2", "font-size");
if (h2_20 === "20px") ok(".art-body h2 = 20px"); else err(`.art-body h2 = ${h2_20} (live: 20px)`);
const fx15 = find(treeT, ".fx-copy", "font-size");
if (fx15 === "15px") ok(".fx-copy base stays 15px verbatim (art-body must WIN it by order, not by editing it)"); else err(`.fx-copy base = ${fx15} (theme verbatim is 15px)`);

const layout = readFileSync("src/layouts/Layout.astro", "utf8");
const iT = layout.indexOf('import "../styles/tools.css"');
const iA = layout.indexOf('import "../styles/article.css"');
if (iT >= 0 && iA > iT) ok("Layout import order: tools.css BEFORE article.css (cascade contract)"); else err(`Layout import order broken (tools@${iT}, article@${iA}) — article MUST come after tools so .art-body wins .fx-copy on shared nodes`);

console.log(fail ? `\nCSS-parse contract: FAIL (${fail} check(s) failed)` : "\nCSS-parse contract: PASS");
process.exit(fail ? 1 : 0);
