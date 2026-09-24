# 11 — The Gutenberg showcase, and the four defects it exposed (v0.4.1)

## Why this page exists

After v0.4.0 shipped, King reviewed the live article pages on his phone and
returned a verdict: *"Terrible spacing in so many places. Table is not styled
properly, so many elements were not ported and styled properly. You failed me."*
His standing order, same message: **check the WordPress
`gutenberg-elements-showcase` post and port it over, so every element the theme
styles is actually on a page and every missing style becomes visible.**

That order was the right instrument. The showcase post exercises 40 top-level
content block types; porting it (byte-captured `.art-body` from the live page,
16 image assets downloaded to `public/wp-content/uploads/2026/`) and diffing it
block-for-block against the live post is what found the four defects below.

## The capture

`port-showcase.py` takes the live page's `document.querySelector('.art-body').innerHTML`
(captured over CDP, 19,450 bytes, 42 top-level blocks), strips leading
indentation (tabs would turn each block into a markdown code block), rewrites
WP origins to the port's base path + local assets, and writes
`src/content/articles/gutenberg-elements-showcase.md` behind normal article
frontmatter. An earlier capture through HTML markers truncated mid-block and
lost the verse block — innerHTML from the DOM is the reliable capture.

## Defect 1 — tables rendered unstyled

The theme styles tables only via `.wp-block-table` (style.css:896-924);
Gutenberg always wraps a table in `<figure class="wp-block-table">`. Markdown
pipe tables emit a bare `<table>`, so every article table shipped with
`thPad 0px, tdPad 0px, border-collapse: separate` — King's "table is not
styled properly".

Fix: `scripts/rehype-wp-table.mjs` inserts exactly the wrapper Gutenberg
emits, keeping the table a direct child of `.art-body` so the ≤767 full-bleed
rule (`margin-left/right: calc(-1 * var(--con-pad))`) still matches. Wired as
`rehypePlugins: [rehypeSlug, rehypeWpTable]`. Hand-authored
`<figure class="wp-block-table">` in markdown is detected and not double-wrapped.

## Defect 2 — embeds.css never left the theme

`inc/enqueue.php:471` loads `assets/css/embeds.css` on singular pages. The port
had ported `embeds.js` (the facade click-to-load logic) but not this
stylesheet, so the facade `<button>` sat in normal flow instead of filling the
aspect-ratio box absolutely: YouTube/Vimeo facades measured **+42px at every
width**, Spotify **42px instead of its own 152px box**. Fixed by importing
`src/styles/embeds.css` (verbatim, 99 lines) in `[slug].astro`. Lesson: audit
`enqueue.php` for EVERY `wp_enqueue_style` — a port scoped to `style.css`
structurally cannot see stylesheets that live beside it.

## Defect 3 — desktop cascade order at ≥1024px

The theme's `min-width: 1024px` block sits BEFORE the base `.art-body` rules
(style.css:2026 → 2040-2076), so on the live site the base shorthand wins for
lists and blockquotes. Measured at 1280: WP serves `ul/ol margin 0 0 16px 20px`
and `blockquote 18px`. The port's extraction placed the media block after the
bases, shipping `18px 0 22px` / `30px 0` instead — margins WordPress never
serves, though every other field matched. The block moved to the theme's source
position; the gate now asserts the ordering (`mediaUl < baseUl < baseBq`).

## Defect 4 — no TOC on raw-HTML posts

WordPress builds the TOC from the RENDERED content
(`inc/table-of-contents.php`, DOMXPath `//h2 | //h3`). Astro's `headings` comes
from the markdown AST, so a body authored as raw HTML blocks — the showcase —
produced an EMPTY TOC while WordPress rendered a full one. `[slug].astro` now
falls back to the theme's own pass (regex over `entry.body` for
`<h2/h3 id=…>`) when the markdown list is empty: 11 rows, heights identical to
WordPress.

## Also corrected

- **Byline display name.** `single.php` prints `get_the_author()` =
  `display_name`, measured on live: **"G-will Chijioke"**. The port rendered
  the site title's "Gwill Chijioke" in the meta pill and `.an-name`. All eight
  content files, `AUTHORS` and the seed posts now carry the display name.

## Verification evidence

- Block diff (`regression/showcase-diff.py`, port vs live, 390/768/1280):
  **42/42 blocks, zero differing fields** after the fixes (was 40/42 with 6
  diffs before).
- Deep probe (`regression/probe-deep.py`, light AND dark): table cells, facade
  internals (219/314/152px, 64px icon, label chip), disclosure, share row,
  author box — all equal; only document-flow `top` offsets differ, each
  explained by content (title length, the declared subtitle, the `Updated`
  fragment).
- Screenshots at 390 dark confirm the table chrome, facade posters and badges
  render; showcase assets serve 200 from the local base path.
- The meta-row wrap in King's screenshot was reproduced at 320px on BOTH
  sites: `h=64`, read-time wraps, a separator dot orphans at line end —
  the theme does this on WordPress too (kuda measured identically).

## Gate

`check-article-fidelity.mjs`: 79 → **106 assertions** — wrapper plugin + wiring,
embeds stylesheet contract, media source order, showcase inventory (one per
block class), no escaped HTML. All 5 gates green.
