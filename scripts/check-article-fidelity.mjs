// Article-surface gate — the ported single-post page.
//
// Why this gate exists: the header, footer and homepage each had a contract gate;
// the article page had none, so nothing stopped a template edit from silently
// dropping a required element. It was rewritten when the page became a real port
// of the theme's single.php — the assertions now describe WORDPRESS's contract
// (class vocabulary, element order, byte-exact copy, conditionals) rather than
// the invented stub that preceded it, plus the rules that keep the port honest:
// the theme's stylesheet is not reinterpreted, and forbidden staging artefacts
// stay out.
//
// Every assertion is source-level and deterministic: read the templates and
// stylesheets, assert the contract. No browser, no network.
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const exists = (p) => {
  try {
    read(p);
    return true;
  } catch {
    return false;
  }
};

const tpl = read("src/pages/articles/[slug].astro");
const layout = read("src/layouts/Layout.astro");
const schema = read("src/content.config.ts");
const css = read("src/styles/article.css");
const js = read("src/scripts/article.js");
const nl = read("src/components/NewsletterForm.astro");
const socials = read("src/components/AuthorSocials.astro");
const content = read("src/data/content.ts");
const cfg = read("astro.config.mjs");
const about = read("src/pages/about.astro");
const contact = read("src/pages/contact.astro");
const lb = read("src/scripts/lightbox.js");
const card = read("src/components/ArticleCard.astro");
// every article's full frontmatter, for the cover-presence contract
const files = (dir) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith(".md"))
    .map((f) => read(join(dir, f)));

// Collapse whitespace so assertions survive reformatting.
const flat = (s) => s.replace(/\s+/g, " ");
const t = flat(tpl);
const l = flat(layout);
const c = flat(css);

const idx = (needle) => t.indexOf(needle);

// ── v0.4.1 block-surface reads (Gutenberg showcase verdict) ──────────────
const wrapSrc = read("scripts/rehype-wp-table.mjs");
const embedCss = read("src/styles/embeds.css");
const showcase = flat(exists("src/content/articles/gutenberg-elements-showcase.md")
  ? read("src/content/articles/gutenberg-elements-showcase.md")
  : "");
// WP's cascade ships these four winners: the ≥1024 media block sits BEFORE the
// base ul/ol + blockquote rules, so on the live site the BASE margins win
// (measured at 1280: lists 0 0 16px 20px, blockquote 18px). Source order is
// therefore part of the contract, not an implementation detail.
const mediaOrder = (() => {
  const mediaAt = css.indexOf("@media (min-width: 1024px)");
  const mediaUl = css.indexOf(".art-body ul, .art-body ol { margin: 18px 0 22px; }");
  const baseUl = css.indexOf(".art-body ul, .art-body ol { margin: 0 0 16px 20px; }");
  const baseBq = css.indexOf(".art-body blockquote {");
  return mediaAt !== -1 && mediaAt < mediaUl && mediaUl < baseUl && baseUl < baseBq;
})();

const checks = [
  // ── the title stack, in WordPress's order ──────────────────────────────
  ["header wrapper is .art-hd (single.php:54)", /<div class="art-hd">/.test(tpl)],
  ["breadcrumb is .bc with .bc-s separators (single.php:57-81)", /<div class="bc">/.test(tpl) && (t.match(/class="bc-s"/g) || []).length === 2],
  ["breadcrumb is Home > category > title", /<div class="bc"> <a href=\{base\}>Home<\/a>/.test(t)],
  ["badge carries the theme's inline style (single.php:84)",
    /class=\{`badge \$\{cat\.badge\}`\} style="margin-bottom:14px;display:inline-flex"/.test(tpl)],
  ["title renders as an h1 .art-t with the post title (single.php:88)",
    /<h1 class="art-t">\{d\.title\}<\/h1>/.test(tpl)],
  ["order is breadcrumb -> badge -> title",
    idx('class="bc"') < idx("class={`badge") && idx("class={`badge") < idx('class="art-t"')],
  ["the old invented .art-h class is gone", !/class="art-h"/.test(t) && !/\.art-h\{/.test(l)],

  // ── the meta row (single.php:90-101) ───────────────────────────────────
  ["meta row is .art-meta", /<div class="art-meta">/.test(tpl)],
  ["author block is .art-author with .art-avatar + .art-author-link (single.php:91-93)",
    /class="art-author"/.test(tpl) && /avatar avatar-20 photo art-avatar/.test(tpl) && /class="art-author-link"/.test(tpl)],
  ["avatar is the 20px Gravatar with a 2x srcset, as get_avatar() emits it",
    /const GRAVATAR =\s*"https:\/\/secure\.gravatar\.com\/avatar\/[0-9a-f]{64}"/.test(tpl) &&
    /\$\{GRAVATAR\}\?s=20&d=wavatar&r=g/.test(tpl) && /\$\{GRAVATAR\}\?s=40&d=wavatar&r=g 2x/.test(tpl)],
  ["separators are empty .art-dot spans", /<span class="art-dot"><\/span>/.test(tpl)],
  ["reading time prints the theme's \"min read\" suffix (single.php:97)", /\{d\.readMins\} min read/.test(tpl)],
  ["date uses the theme's 'F Y' format, not the card's 'M Y'", /fmtLongMonthYear\(d\.pubDate\)/.test(tpl)],
  ["the Updated fragment uses 'M Y' and compares whole days (single.php:98)",
    /Updated \{fmtMonthYear\(d\.updated!\)\}/.test(tpl) && /isoDay\(d\.updated\) !== isoDay\(d\.pubDate\)/.test(tpl)],

  // ── the subtitle (net-new: WordPress has no post subtitle) ─────────────
  ["subtitle .art-sub renders between the title and the meta row",
    idx('class="art-t"') < idx('class="art-sub"') && idx('class="art-sub"') < idx('class="art-meta"')],
  ["subtitle uses the authored field with the excerpt as fallback",
    /\{d\.subtitle \?\? d\.description\}/.test(tpl)],
  ["content model accepts an optional subtitle", /subtitle: z\.string\(\)\.optional\(\)/.test(schema)],

  // ── page scaffolding ───────────────────────────────────────────────────
  ["reading progress is .prog > .prog-f (single.php:43)", /<div class="prog"><div class="prog-f"><\/div><\/div>/.test(tpl)],
  ["the old .progress > #read-progress stub is gone", !/read-progress/.test(t)],
  ["container is .con with the theme's inline padding (single.php:45)",
    /<div class="con" style="padding-bottom:48px">/.test(tpl)],
  ["two-column layout is .sb-layout (single.php:46)", /<div class="sb-layout">/.test(tpl)],
  ["reading surface is .art-reading-surface > .art-surface-pad (single.php:104,122)",
    /class="art-reading-surface"/.test(tpl) && /class="art-surface-pad"/.test(tpl)],
  ["the cover is .art-cover inside .art-reading-surface, before .art-surface-pad (single.php:104-122)",
    /class="art-reading-surface"/.test(tpl) && /class="art-surface-pad"/.test(tpl) &&
    idx("art-reading-surface") < idx('class="art-cover"') && idx('class="art-cover"') < idx("art-surface-pad")],

  // ── mobile TOC dropdown (single.php:125-136) ───────────────────────────
  ["mobile dropdown is .toc-dropdown.toc-mobile#gwill-toc-mobile",
    /class="toc-dropdown toc-mobile" id="gwill-toc-mobile"/.test(t)],
  ["summary button carries type, aria-expanded, aria-controls in source order (single.php:126)",
    /<button type="button" class="toc-summary" aria-expanded="true" aria-controls="gwill-toc-mobile-list">/.test(t)],
  ["summary label is \"In this article\" (lower-case t) and caret is U+25BE",
    /<span>In this article<\/span>/.test(tpl) && /class="toc-caret" aria-hidden="true">▾</.test(t)],
  ["level-3 rows carry .toc-sub (single.php:132)", /class=\{h\.depth === 3 \? "toc-sub" : undefined\}/.test(tpl)],

  // ── disclosure (single.php:139-142) ────────────────────────────────────
  ["disclosure is .discl.mb24 with the U+26A0 mark", /class="discl mb24"> <span class="discl-i">⚠<\/span>/.test(t)],
  ["disclosure copy is byte-exact, period inside <strong>",
    /<p class="discl-t"><strong>Affiliate disclosure\.<\/strong> Some links in this article earn me a commission if you sign up through them, at no extra cost to you\. I only recommend apps I have personally tested\. This never changes my ratings\.<\/p>/.test(flat(tpl))],
  ["the invented .disc-box stub is gone", !/disc-box/.test(t) && !/\.disc-box\{/.test(l)],

  // ── share row (single.php:149-155) ─────────────────────────────────────
  ["label is .share-l reading \"Share\"", /<span class="share-l">Share<\/span>/.test(tpl)],
  ["three share links carry target then rel then href, in that source order",
    (t.match(/<a class="share-b" target="_blank" rel="noopener noreferrer" href=\{/g) || []).length === 3],
  ["X link uses twitter.com/intent/tweet with text then url",
    /https:\/\/twitter\.com\/intent\/tweet\?text=\$\{raw\(d\.title\)\}&url=\$\{raw\(pageUrl\)\}/.test(t)],
  ["LinkedIn link uses share-offsite with just the url",
    /linkedin\.com\/sharing\/share-offsite\/\?url=\$\{raw\(pageUrl\)\}/.test(t)],
  ["WhatsApp link is title + one space + permalink, encoded once",
    /api\.whatsapp\.com\/send\?text=\$\{raw\(`\$\{d\.title\} \$\{pageUrl\}`\)\}/.test(t)],
  ["the copy control is a [data-copy] button labelled \"Copy Link\" (single.php:154)",
    /<button class="share-b" type="button" data-copy=\{pageUrl\}>Copy Link<\/button>/.test(t)],

  // ── author box (single.php:157-175) ────────────────────────────────────
  ["author box is .abio.mt20 with a .aav avatar", /class="abio mt20"/.test(t) && /<div class="aav">/.test(t)],
  ["author avatar is the 48px Gravatar, lazy, 2x srcset",
    /s=48&d=wavatar&r=g/.test(tpl) && /s=96&d=wavatar&r=g 2x/.test(tpl) && /loading="lazy"/.test(tpl)],
  ["name is .an-name and bio is .abio-t", /<div class="an-name">/.test(t) && /<div class="abio-t">/.test(t)],
  ["the theme's bio fallback sentence is preserved",
    /Web developer and finance writer\. I build this site and write everything on it\. I test every app before recommending it\. Based in Nigeria\./.test(flat(tpl))],
  ["socials render through the generated component", /<AuthorSocials socials=/.test(t)],
  ["the invented .author-bio block is gone from the article template", !/class="author-bio"/.test(t)],

  // ── related posts (single.php:183-204) ─────────────────────────────────
  ["related block is .mt40 > .shd > h2.stitle \"Related Articles\"",
    /class="mt40"> <div class="shd" style="margin-bottom:16px"><h2 class="stitle">Related Articles<\/h2><\/div>/.test(t)],
  ["related cards render in the theme's .g2 grid via the theme's card part",
    /<div class="g2"> \{related\.map\(\(p\) => \( <ArticleCard/.test(t)],
  ["related picks the primary category only, capped at 3, like gwill_get_related_posts()",
    /relatedTo\(all, entry, 3\)/.test(tpl) && /if \(sameCat\.length\) return sameCat\.slice\(0, n\)/.test(content)],
  ["and falls back to the 2 most recent when the category has no siblings (single.php)",
    /return others\.slice\(0, 2\)/.test(content)],
  ["the \"Keep reading\" stub heading is gone", !/Keep reading/.test(t)],

  // ── newsletter blocks (single.php:228-236, 279-284) ────────────────────
  ["mobile newsletter is .m-nl-wrap > .m-nl", /class="m-nl-wrap"> <div class="m-nl">/.test(t)],
  ["mobile digest heading is the lower-case \"Weekly digest.\" (single.php:232)",
    /<h3>Weekly digest\.<\/h3>/.test(t)],
  ["digest blurb is byte-exact", /<p>Rate changes, app reviews, money moves\. Free\.<\/p>/.test(t)],
  ["sidebar digest title is \"Weekly digest.\" with the theme's utility classes on the blurb",
    /<div class="sw-t">Weekly digest\.<\/div> <p class="fz11 fw3 cd lh mb12">Rate changes, app reviews, money moves\. Free\.<\/p>/.test(t)],
  ["the two newsletter instances get unique ids, like wp_unique_id()",
    /<NewsletterForm id="gwill-newsletter-1"/.test(t) && /<NewsletterForm id="gwill-newsletter-2"/.test(t)],
  ["newsletter partial keeps the theme's copy and id wiring",
    /Get new posts in your inbox\./.test(nl) && /Leave this blank/.test(nl) && /placeholder="Your email"/.test(nl) &&
    /<span class="gwill-form__submit-text">Subscribe<\/span>/.test(nl) && /Subscribing…/.test(nl) &&
    /for=\{`email_\$\{id\}`\}/.test(nl)],
  ["the visually-hidden Email label keeps the theme's class", /class="screen-reader-text">Email</.test(nl)],

  // ── sidebar (single.php:243-286) ───────────────────────────────────────
  ["sidebar is aside.article-sidebar with the theme's inline sticky style",
    /<aside class="article-sidebar" style="position:sticky;top:72px;align-self:start">/.test(t)],
  ["first widget is the TOC card: .sw > .sw-t \"In This Article\" > .toc-scroll",
    /<div class="sw"> <div class="sw-t">In This Article<\/div> <div class="toc-scroll">/.test(t)],
  ["first TOC row is marked current, as PHP emits for index 0 (single.php:256)",
    /class=\{`toc-i\$\{i === 0 \? " cur" : ""\}`\}/.test(tpl)],
  ["level-2 rows use .toc-bar, level-3 the invisible .toc-g spacer (single.php:261,265)",
    /<span class="toc-bar"><\/span>/.test(t) && /<span class="toc-g"><\/span>/.test(t)],
  ["square ad box is emitted empty with the theme's inline style, as the live article serves it (single.php:274)",
    /<div class="sw" style="padding:0;overflow:hidden;border:1px solid var\(--border\)"><\/div>/.test(t)],
  ["the invented .art-side / .legal-toc sidebar is gone from the article template",
    !/class="art-side"/.test(t) && !/class="legal-toc/.test(t)],

  // ── the theme's stylesheet is installed, not reinterpreted ─────────────
  ["the template imports the article stylesheet", /import "\.\.\/\.\.\/styles\/article\.css"/.test(tpl)],
  ["no port-authored .art-body prose is left in the layout",
    !/\.art-body\{margin-top:20px/.test(l) && !/\.art-body h2::before/.test(l)],
  ["that prose moved to prose.css, imported by the pages that need it",
    exists("src/styles/prose.css") && /styles\/prose\.css/.test(about) && /styles\/prose\.css/.test(contact)],
  ["the article stylesheet carries the theme's rules verbatim (spot checks)",
    /\.prog-f \{ height: 100%; width: 0;/.test(c) &&
    /\.share-row \{ display: flex; align-items: center; gap: 8px; margin-top: 28px; padding-top: 20px; border-top: 1px solid var\(--border-dim\); flex-wrap: wrap; \}/.test(c) &&
    /\.toc-bar \{ width: 2px; height: 12px; background: var\(--gold\); border-radius: 1px; flex-shrink: 0; \}/.test(c) && /\.discl-i/.test(c)],
  ["the two-column grid is the theme's 1fr + 300px (style.css:2969)",
    /\.sb-layout \{ display: grid; grid-template-columns: 1fr 300px; gap: 32px; \}/.test(c)],
  ["the mobile TOC visibility rules are the theme's (style.css:2415-2416)",
    /\.toc-dropdown\.toc-open \.toc-list \{ display: flex; \}/.test(c) && /\.toc-dropdown:not\(\.toc-open\) \.toc-list \{ display: none; \}/.test(c)],
  ["no uninstalled tokens are left for article.css to trip over (the .brd badge)",
    /--red-muted/.test(l) && /--red-border/.test(l)],
  ["the forbidden staging notice stays out of the article page",
    !/comments-hold/.test(t) && !/phase-tag/.test(t)],
  ["the author-social icons are generated from the theme, not hand-copied",
    /GENERATED FILE/.test(socials) && /aria-label=\{ICONS\[k\]\.aria\}/.test(socials) && /abio-si/.test(socials)],

  // ── heading anchors are server-rendered (WP: the_content priority 9) ───
  ["rehype-slug is wired so heading ids exist in the served HTML",
    /rehypeSlug/.test(cfg) && flat(cfg).includes("markdown: { rehypePlugins: [rehypeSlug, rehypeWpTable]")],
  ["the TOC is built from h2 + h3 in document order",
    /headings\.filter\(\(h\) => h\.depth === 2 \|\| h\.depth === 3\)/.test(tpl)],
  ["the old client-side id-patching script is gone",
    !/tocIds/.test(t) && !/h\.id=tocIds\[i\]/.test(t)],

  // ── behaviours ported from the theme's own main.js ─────────────────────
  ["the page loads the article behaviour module", /scripts\/article\.js/.test(tpl)],
  ["the reading-progress bar is driven from scroll", /prog-f/.test(js) && /scroll/.test(js)],
  ["the sidebar TOC marks the current row", /toc-i/.test(js) && /cur/.test(js)],
  ["the mobile dropdown toggles .toc-open and aria-expanded (main.js:262-263)",
    /toc-open/.test(js) && /setAttribute\('aria-expanded'/.test(js)],
  ["the copy control swaps in the theme's label strings (main.js:403)",
    /Copy Link/.test(js) && /Copied/.test(js)],
  ["both date formats have helpers", /export const fmtMonthYear/.test(content) && /export const fmtLongMonthYear/.test(content)],

  // ── structured data still ships ────────────────────────────────────────
  ["Article JSON-LD is emitted", /"@type": "Article"/.test(tpl)],
  ["JSON-LD escaping is applied", /replace\(\/<\/g, "\\\\u003c"\)/.test(tpl)],

  // ── the King's v0.4.1 verdict: lightbox, covers, cards (v0.4.2) ─────────
  // King: "lightbox doesn't even work." — the theme ships assets/js/lightbox.js
  // (266 lines, enqueued on every singular page, enqueue.php:170-192); the port
  // shipped neither the JS nor the .gl-* base CSS. Both branches now a contract:
  ["the lightbox module is ported and wired beside article.js",
    exists("src/scripts/lightbox.js") &&
    /import "\.\.\/\.\.\/scripts\/lightbox\.js";/.test(tpl) &&
    /import "\.\.\/\.\.\/scripts\/article\.js";/.test(tpl)],
  ["the GwillLightbox i18n object is printed before the module (wp_localize_script)",
    /var GwillLightbox = \{"i18n":\{"lightbox":"Image lightbox","enlarge":"Enlarge image","close":"Close","prev":"Previous image","next":"Next image"\}\};/.test(tpl)],
  ["the ported lightbox is the theme's own logic (init sets tabindex+role, keydown opens)",
    /setAttribute\('tabindex', '0'\)/.test(lb) && /setAttribute\('role', 'button'\)/.test(lb) &&
    /gl-open/.test(lb) && /closeBtn\.focus\(\)/.test(lb)],
  ["the lightbox CSS base slice is installed (style.css:2192-2237)",
    /\.gl-overlay \{/.test(c) && /z-index: 99999/.test(c) &&
    /\.gl-close \{/.test(c) && /\.gl-counter \{/.test(c) &&
    /\.art-body \.wp-block-image img \{ cursor: zoom-in; \}/.test(c)],
  ["the lightbox mobile overrides match the theme (style.css:2243-2248)",
    /@media \(max-width: 767px\) \{\s*\.gl-nav \{ width: 36px/.test(c)],
  // King: "no featured images on posts." — single.php:106 emits .art-cover when
  // has_post_thumbnail(); live posts ALL carry a cover (category art). The port
  // omitted the element wholesale.
  ["every article carries a featured image in frontmatter",
    files("src/content/articles").every((f) => /^image: /m.test(f))],
  ["the cover markup is WP's gwill-hero thumbnail (single.php:106-120)",
    /class="attachment-gwill-hero size-gwill-hero wp-post-image"/.test(tpl) &&
    /loading="eager"/.test(tpl) && /fetchpriority="high"/.test(tpl) &&
    /sizes="\(max-width: 1200px\) 100vw, 1200px"/.test(tpl)],
  ["the schema declares the cover fields",
    /image: z\.string\(\)\.optional\(\)/.test(schema) && /imageSrcset: z\.string\(\)\.optional\(\)/.test(schema)],
  ["the card thumbnail branch is ported (inc/card-media.php has_post_thumbnail)",
    /class="attachment-medium size-medium wp-post-image"/.test(card) &&
    /tabindex="-1" aria-hidden="true"/.test(card) &&
    /sizes="\(min-width: 768px\) 350px, 100vw"/.test(card)],
  ["the card srcset is WP's 300w + 768w pair (gwill_finance_card_img_srcset)",
    /\(300w\|768w\)\$/.test(card)],

  // ── the Gutenberg block surface (v0.4.1) ───────────────────────────────
  // King's verdict on v0.4.0: "Table is not styled properly, so many elements
  // were not ported and styled properly." Root causes, each now a contract:
  ["markdown tables get Gutenberg's figure wrapper (style.css:896 styles .wp-block-table)",
    /tagName: "figure"/.test(wrapSrc) && /wp-block-table/.test(wrapSrc) &&
    /rehypeWpTable/.test(cfg) && /\[rehypeSlug, rehypeWpTable\]/.test(flat(cfg))],
  ["the embed facade stylesheet ships with the article (enqueue.php:471, assets/css/embeds.css)",
    /import "..\/..\/styles\/embeds.css"/.test(tpl) &&
    /\.art-body .wp-block-embed__wrapper .gwill-embed {/.test(embedCss) &&
    /position: absolute/.test(embedCss) &&
    /\.gwill-embed--spotify/.test(embedCss) && /height: 152px/.test(embedCss)],
  ["the ≥1024 media block sits BEFORE the base ul/ol + blockquote rules (WP cascade: base wins)",
    mediaOrder],
  ["the Gutenberg showcase post is ported as content (40+ blocks, byte-captured)",
    showcase.includes("wp-block-verse") && showcase.includes("wp-block-table") &&
    showcase.includes("gwill-embed")],
  ["showcase content survived markdown (no escaped HTML)", !showcase.includes("&lt;figure")],
];

// every block class the theme styles must be present in the showcase content
for (const cls of ["wp-block-quote", "wp-block-pullquote", "wp-block-table",
  "wp-block-code", "wp-block-preformatted", "wp-block-image", "wp-block-gallery",
  "wp-block-embed", "gwill-embed", "wp-block-cover", "wp-block-columns",
  "wp-block-media-text", "wp-block-buttons", "wp-block-details", "wp-block-search",
  "wp-block-categories", "wp-block-archives", "wp-block-social-links",
  "wp-block-latest-comments", "wp-block-separator", "wp-block-verse"]) {
  checks.push([`showcase carries ${cls}`, showcase.includes(cls)]);
}

let pass = 0;
let fail = 0;
for (const [name, ok] of checks) {
  if (ok) {
    pass++;
    console.log(`  ok    ${flat(name)}`);
  } else {
    fail++;
    console.log(`  FAIL  ${flat(name)}`);
  }
}
console.log(`\narticle gate: ${fail === 0 ? "PASS" : "FAIL"} — ${pass}/${checks.length} assertions`);
process.exit(fail === 0 ? 0 : 1);
