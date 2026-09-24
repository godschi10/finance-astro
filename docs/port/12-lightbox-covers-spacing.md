# 12 — Lightbox, covers, and the measured spacing pass (v0.4.2)

## The verdict

King reviewed v0.4.1 on his phone and returned: *"Still highly unfinished, so
many issues, lightbox doesn't even work. Some elements aren't spaced enough.
You failed me again."* — then *"And no featured images on posts."*

Four claims. All four measured against live WordPress before a line was
changed. All four were real defects; all four are fixed and proven below.

## 1. The lightbox — a script the port never shipped

`grep -n "is_singular" inc/enqueue.php` finds the second enqueue block in the
theme: on every singular page WordPress loads `assets/js/lightbox.js` (266
lines — click-to-zoom with keyboard trap, swipe, gallery grouping, counter,
caption, focus return) plus a `GwillLightbox` i18n object via
`wp_localize_script`. The port had **neither the JS nor the CSS it needs**:
the article.css extraction had carried only the `@media (max-width: 767px)`
lightbox overrides (style.css:2243-2248) — the base slice at style.css:2192-2237
(`.gl-overlay` through `.gl-counter` and the `.art-body .wp-block-image img {
cursor: zoom-in }` cue) was never extracted. So even a hypothetical ported
script would have opened an unstyled transparent overlay.

Ported now, verbatim: `src/scripts/lightbox.js` (byte-identical logic,
including the WCAG comments), the i18n object printed inline exactly as
wp_localize_script emits it, and the missing CSS slice installed with the
§51/56 dark hover rules. The rule-diff script confirms every `.gl-*` and
`.art-cover` selector now present with matching declarations.

### Proof with real input (390px, dark)

| Action | Observed |
|---|---|
| Click `.art-body img` (real CDP click) | overlay `gl-open`, opacity 1, bg rgba(0,0,0,.92), z-index 99999, blur(8px), image swaps to 768w source, counter "1 / 4", figure caption rendered, focus → .gl-close, `body.style.overflow=hidden` |
| Press Esc | overlay closes, focus returns to the triggering image (`wp-image-34`), scroll unlocked |
| Click → ArrowRight | counter 1/4 → 2/4, image swaps to the savings cover |
| Focus image → Enter | overlay opens, focus on .gl-close |

Vision analysis of the open-overlay screenshot confirms every lightbox UI
convention visible: counter pill, × close, ‹ › arrows, centered rounded image,
bottom caption.

## 2. Featured images — the port's articles carried no image data

`grep -c "^image:" src/content/articles/*.md` returned **0 for all 8**. The
template even carried an honest comment: "No port article has a featured image,
so it is omitted, exactly as WordPress omits it." WordPress omits nothing —
every live post has a thumbnail set. Probed live: `gutenberg-elements-showcase`
and four sibling articles all render `.art-cover` (count=1 each); earlier
zero-counts were 404s on the port's authored slugs, not absent covers.

The live covers are the theme's **category art** (banking/dollar/savings/
crypto/investing/remittance PNGs, 1200×675 + three responsive sizes). Ported:

- Schema: `image`, `imageAlt`, `imageSrcset` (optional, `has_post_thumbnail()`
  semantics).
- All 8 articles mapped to the same category art live WP serves their
  categories with; 12 new upload assets downloaded this batch (16 localised in
  total across the batch), served from `public/wp-content/uploads/…` — no
  hotlinking.
- `.art-cover` emits WP's exact `get_the_post_thumbnail(null, 'gwill-hero')`
  markup: `width="1200" height="675"`, `attachment-gwill-hero size-gwill-hero
  wp-post-image`, `loading="eager"`, `fetchpriority="high"`, full srcset, and
  the live alt texts captured from the served pages.
- `inc/card-media.php` ported with **both branches**. The homepage grid went
  from 8/8 emoji-fallback cards to **8/8 image cards, 0 emoji** — matching the
  live homepage's 9/9 image cards (0 emoji), captured in the finance-home
  truth file.

## 3. Spacing — measured, not felt

One browser, both sites, 390/768/1280, light + dark. The end-of-article stack
(cover → disclosure → TOC → share → author → related) and the title stack:

- **Heights identical at every width** for cover (220/300/380), disclosure
  (117/117/80), mobile TOC (299), share row (86/86/51).
- Every remaining `top` offset difference traces to **content**, not styling:
  live's article title is "Gutenberg Elements Showcase — Every Block Styled"
  and wraps to two lines at 390px; the port carries the short title plus the
  King-ordered subtitle field (recorded divergence, `docs/port/09`). Same
  21px font, same -0.035em tracking, same 350px container — canvas-measured
  605px of glyphs on live vs one line on the port.
- The related grid measures +18px at 768/1280 because the two sites list
  **different posts** (live's showcase related = the kuda-vs-moniepoint set;
  the port's = kuda-traditional-banks). Excerpt line counts, not CSS.

### One real spacing defect found and fixed

The author box measured **197px on the port vs 178px on live** at 390. Cause:
the port's authored bio was a different (longer) sentence than the live ACF
bio. Fixed by byte-matching the live text: *"Web developer and finance writer.
I build this site and write everything on it. I test every app before
recommending it. Based in Nigeria."* — the theme's FALLBACK_BIO, which is what
the live site actually prints. Re-measured: abio 197 → 178. ✓

## 4. The footer suspects from King's screenshots — cleared

- The "Designed & built by G-will Chijioke" credit links `gwillchijioke.com`
  on **both** sites (footer.php:95-96) — King's screenshot showed the © host
  (`https://godschi10.github.io`), which is `home_url()` on both sites
  (live prints its own origin; the port prints its Pages origin — the same WP
  pattern, faithful).
- The footer push bell and Google News CTAs are present in the port's footer
  in ported form (`data-push-bell`), with the theme's own CSS.
- The footer "Notify me of new posts" is an honest hold (no push backend on a
  static site) — styled with the theme's exact `.fpush` treatment, as recorded
  in `docs/port/02`.

## Verification record

- Gate: article gate **116/116** (10 new assertions: lightbox module + i18n +
  logic contract, CSS slice, cover markup + schema, card thumbnail branch,
  srcset pair, cover presence on all articles), all 5 gates green.
- Rule-diff: every `.gl-*`/`.art-cover` selector the surface owns is present
  with matching declarations (33 theme rules, 497 port rules).
- Lightbox: real-input proof table above.
- Spacing: 24-point matrix, heights identical; deltas all content-explained.
- Build: 54 pages clean.
