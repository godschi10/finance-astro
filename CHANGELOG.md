# Changelog

All notable changes to the finance-astro port. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); dates are UTC.

## [0.4.6] — 2026-09-25

### Added
- **The comments surface — the King's own vibe-comments UI, live against a
  Cloudflare Worker** (plan `docs/port/15`, integration `docs/port/17`). The
  comment area now renders in WordPress's own position — inside
  `.comments-area.mt48`, after the related posts and before the mobile
  newsletter (`single.php:212-226`) — and talks to
  `https://comments-api.gwill.workers.dev` instead of WP admin-ajax.
  - `src/components/VibeComments.astro` — byte-faithful port of the plugin's
    `templates/comments.php` guest path: every id and class matches the source,
    and the click-to-load shell is preserved (zero requests until the reader
    asks for comments).
  - `src/scripts/vibe-comments.js` — the plugin's OWN 3,087-line client script
    with only its transport seam patched: **233 changed lines**. The render
    core, markdown-lite pipeline, i18n dict, draft autosave, char counter,
    relative-time sweep and guest-identity rail are verbatim. No admin-ajax,
    no nonce; the slug replaces the numeric post id; only the v1 inits boot.
  - `src/styles/vibe-comments.base.css` + `.gold.css` — the two shipped
    sheets, byte-identical (40,720 B / 24,412 B), in the theme's cascade order:
    plugin sheet first, our override second (`inc/enqueue.php:491-505`).
  - Build-time comment count (parity: WP bakes the stored count), non-fatal
    with a 0 fallback — the heading hides itself at zero through the plugin's
    own `:empty` rule.

### Held — absence, never a dead control
- The reply-push opt-in, the email opt-in and the `.vibe-or` separator are
  **removed**, not inert: the port has neither rail in v1 (plan §6).
- The sort toolbar stays **hidden**: WP ships that markup hidden and reveals it
  only from the P2 sort code, so v1 must not reveal it either (it would put an
  inert sort button on screen).
- No WP-login and no Google button — declared divergence, no WP auth behind a
  static site.

### Fixed (Worker side, found by comparing against live WP's own payload)
- **Gravatar URLs were MD5 with `s=64`.** Live WP runs WordPress 7.1, whose
  core hashes the address with `hash('sha256', strtolower(trim($email)))` and
  is called as `get_avatar_url($email, ['size' => 48])`. The Worker now stores
  and emits the SHA-256 digest with `?s=48&d=wavatar&r=g` — byte-identical to
  what the plugin emits. The hand-written MD5 helper is deleted (40 lines of
  dead crypto).
- **`date` was an ISO timestamp.** The plugin's payload carries WP's
  `human_time_diff()` string ("2 weeks ago"); the Worker now ports
  `human_time_diff()` and `gmdate('Y-m-d H:i:s')`, and the wire object carries
  the same 20 keys as live.

### Verified
- Article gate: **147/147** (was 124) — 24 new assertions for presence, WP's
  render position, cascade order, byte-faithful stylesheets, the live Worker
  base, the holds staying absent, single-bind, and the served bytes.
- Worker: **60/60 against the deployed URL**, now asserting the wire parity
  above alongside the existing approve-first, reactions, antispam, HMAC and
  CORS checks.
- Real Chrome at 390px: collapsed shell → Load Comments → live fetch → submit
  → "pending review" → approved → the card renders (author, gravatar, 7
  reaction controls, reply affordance, relative time) with **0 JS errors**.

## [0.4.5] — 2026-09-25

### Fixed
- **"Why is TOC showing &amp;"** (King, screenshot img_febf26ee0d1b) — the
  raw-HTML TOC extractor kept entity-encoded heading text, and Astro escaped
  it a second time, so the phone TOC printed `&amp;amp;` (visible as `&amp;`).
  Live WP's DOM textContent is entity-decoded and escaped once on output;
  the port now decodes (`< > " &#39; &#x27; &#x3D; &amp;`) before
  Astro escapes once. Dist bytes for all four ampersand headings now equal
  live WP byte-for-byte. Gate: 4 new assertions (decode helper present,
  ampersand unescape single-pass, no `&amp;amp;` in served dist, all four
  headings single-escaped) — 124/124.

## [0.4.4] — 2026-09-24

### Fixed
- **"Subtitles and posts meta are too close"** (King, screenshot
  img_30a2b4d4b69e) — the post deck (`.art-sub`, the net-new subtitle
  element from docs/port/08) had `margin-top: 16px` and **no
  `margin-bottom`**: its last line sat 0px on the author pill. Given the
  theme's own callout rhythm — the disclosure is `class="discl mb24"` —
  the deck now carries `margin-top: 24px; margin-bottom: 24px`, symmetric,
  matching `.mb24`/`.mt24` scale. Measured at 390 dark after the rebuild:
  title→deck **24px**, deck→meta **24px** (was 20 / 0).



**King's verdict on v0.4.2: "Why do I have to press the × twice to close?" +
"You still didn't fix the spacing issue, these elements are too close to each
other."** Both real; both root-caused with measurements; both fixed.

### Fixed
- **Double lightbox (× twice)** — the port bound the lightbox TWICE: the
  v0.4.2 verbatim `src/scripts/lightbox.js` import AND a full folded copy
  (§11, 211 lines) inside `article.js`. Two document-level click listeners →
  two stacked `.gl-overlay` per click → × closed only the top one. The folded
  copy is removed with a tombstone comment; the theme's architecture (lightbox
  as its own enqueue, `main.js` with no lightbox section) is now the port's.
  Proven: one click → `overlays: 1, open: 1`; one × press → `gl-open` gone,
  body scroll unlocked.
- **Spacing utilities were never extracted** — the theme's §48 LAYOUT
  UTILITIES (style.css:2966-2982) landed only partially (`.con/.g2/.g3/
  .sb-layout`); `.sg .mt20 .mt40 .mt48 .mb12 .mb20 .mb24 .flex .aic .jsb
  .g16 .fw3 .fz11/12/14 .cm-c .cd .lh .cl-layout` were missing from the
  served bundle on ALL 54 pages. Result: the disclosure sat flush on the
  body (0px vs live's 24px), the author box lost its 20px top gap, related
  lost its 40px. Installed GLOBALLY in base.css (the theme ships them in the
  one global stylesheet; 14 non-article page templates use them too).
  Measured after the fix, port vs live at 390 dark: toc→discl 20/20,
  discl→body 24/24, body→share 28/28, share→abio 20/20, abio→related 64/64 —
  **0 divergent pairs**.

### Note
- The v0.4.2 spacing matrix measured box HEIGHTS (all matched); margins
  between boxes were the untested dimension — the gap chain probe is the new
  acceptance instrument, and the gate now asserts the utilities' presence in
  the global sheet.



**King's verdict on v0.4.1: "Still highly unfinished, so many issues, lightbox
doesn't even work. Some elements aren't spaced enough." + "And no featured
images on posts."** All four measured against live WP; all real, all fixed.

### Fixed
- **Lightbox** — the theme's `assets/js/lightbox.js` (266 lines, enqueued on
  every singular page since enqueue.php:170) was never ported, and the `.gl-*`
  base CSS slice (style.css:2192-2237) was missing from the extracted
  article.css (only the 767px overrides had survived). Both ported verbatim;
  the `GwillLightbox` i18n object is printed exactly as `wp_localize_script`
  emits it. Proven with real input at 390 dark: click → overlay opens (opacity
  1, rgba(0,0,0,.92), z-index 99999, backdrop blur 8px, counter "1 / 4", the
  figure's caption, focus on .gl-close, body scroll locked); Esc → closes and
  returns focus to the triggering image; ArrowRight → 1/4→2/4 swapping to the
  next gallery image; Enter on the focused image opens it too. Rule-diff
  script: every `.gl-*`/`.art-cover` selector present, matching declarations.
- **Featured images** — the port's articles carried no image data at all. Live
  WP gives every post a category-art cover (verified: showcase and four probed
  live articles all render `.art-cover`). Schema gained
  `image`/`imageAlt`/`imageSrcset`; all 8 articles now map to the same category
  art WP serves; `.art-cover` renders WP's `get_the_post_thumbnail('gwill-hero')`
  markup (single.php:106-120); `inc/card-media.php` ported with BOTH branches —
  homepage grid 8/8 image cards, 0 emoji fallbacks (previously 8/8 emoji).
- **Author bio height (+19px)** — the port's authored bio was longer than the
  live ACF bio. Byte-matched to the live text ("Web developer and finance
  writer. I build this site and write everything on it. I test every app
  before recommending it. Based in Nigeria.") — abio 197→178px.
- **Spacing, measured** — port vs live at 390/768/1280, light+dark: cover,
  disclosure, TOC and share-row heights identical at every width; all
  remaining top-offsets trace to the declared subtitle divergence (live's
  title carries the "— Every Block Styled" suffix and wraps two lines; the
  port splits it into title + subtitle) and to different related-post sets —
  content flow, not styling.

### Added
- 12 new upload assets (banking/remittance/showcase ×4 sizes each) so every
  cover and card is served locally; no hotlinking.

**King's verdict on v0.4.0: *"Terrible spacing in so many places. Table is not
styled properly, so many elements were not ported and styled properly."* He was
right; measuring against his four screenshots found four real defects, and his
standing order — port the WordPress `gutenberg-elements-showcase` post so every
block style is exercised — is what exposed them.

1. **Tables rendered completely unstyled.** Markdown emits a bare `<table>`;
   Gutenberg (and this theme's `style.css:896-924`) always wraps tables in
   `<figure class="wp-block-table">`, which owns the border, radius, `thead`
   tint, cell padding and the thin gold scrollbar. Measured before the fix:
   `thPad 0px, tdPad 0px, border-collapse: separate`. New rehype plugin
   `scripts/rehype-wp-table.mjs` inserts exactly WordPress' wrapper
   (`[rehypeSlug, rehypeWpTable]`). After: table geometry identical to the
   live WordPress showcase at 390/768/1280, light *and* dark.
2. **`assets/css/embeds.css` was never ported** — a stylesheet outside
   `style.css` that `enqueue.php:471` loads on every singular page. Without it
   the click-to-play facade sat in normal flow: YouTube/Vimeo facades measured
   42px too tall at every width, Spotify collapsed to 42px instead of its
   152px box. The JS was already ported; only the CSS was missing. Now imported
   by `[slug].astro`; facades measure identical to WordPress.
3. **Desktop cascade order wrong at ≥1024px.** The theme places its
   `min-width: 1024px` block *before* the base `.art-body` rules, so on the
   live site the base shorthand WINS for lists and blockquotes
   (measured at 1280: `ul/ol margin 0 0 16px 20px`, `blockquote 18px`). The
   port had the media block after the bases, shipping `18px 0 22px` /
   `30px 0` — four margins WordPress never serves. The block now sits in the
   theme's source position, and source order itself is a gate assertion.
4. **The showcase page had no TOC on the port.** Astro's markdown `headings`
   cannot see headings inside raw HTML blocks; WordPress builds the TOC from
   the RENDERED content (`inc/table-of-contents.php` DOMXPath `//h2 | //h3`).
   `[slug].astro` now falls back to the theme's own pass over the raw body —
   11 rows render, matching WordPress' row heights.

Plus: the showcase post itself is ported as content — all 40 top-level blocks
byte-captured from the live page (headings, lists, quote, pullquote, table,
code, preformatted, verse, image, gallery, three embed facades, cover, columns,
media+text, buttons, details, search, categories, archives, social links,
latest comments), with its 16 image assets downloaded locally under
`wp-content/uploads/` so no page hotlinks the WordPress origin. Block-for-block
geometry diff vs the live post: **42/42 blocks, zero differing fields at
390/768/1280**. And the byline now mirrors `get_the_author()`'s display name —
**"G-will Chijioke"**, as the live site renders it, not the site title's
"Gwill Chijioke" (measured in both sites' meta pills and author boxes).

Gate: `check-article-fidelity.mjs` 79 → **106 assertions** (table wrapper,
embeds stylesheet, media source order, showcase block inventory). All 5 gates
green. King's meta-row screenshot (wrapped read-time + orphan separator dot at
a very narrow viewport) was measured on WordPress too: at 320px both sites wrap
h=64 with the dot orphaned — theme behaviour, faithfully ported; a joint
theme-level fix is offered separately rather than diverging the port alone.

## [0.4.0] — 2026-09-23

**The article page is now a port of `single.php`, not a page in the theme's
general idiom.** King's correction — *"you only focused on the subtitles, why
didn't you port the rest of the blogpost template"* — was right: the previous
article page shared almost no class vocabulary with WordPress, so nothing on it
could be checked against the original.

The class names are now WordPress's, which means the theme's own stylesheet
applies to the markup unchanged:

- **Markup** — `.art-hd` header (`.bc` breadcrumb → `.badge` → `h1.art-t` →
  subtitle → `.art-meta`), `.prog > .prog-f` progress, `.con` container,
  `.sb-layout` two-column grid, `.art-reading-surface` → `.art-surface-pad`,
  the mobile `.toc-dropdown.toc-mobile` with its `.toc-summary`/`.toc-caret`/
  `.toc-list`/`.toc-sub`, `.discl.mb24`, `.art-body`, `.share-row` with all four
  controls, `.abio.mt20`, the `.mt40`/`.shd`/`h2.stitle`/`.g2` related block,
  `.m-nl-wrap`, and `aside.article-sidebar[position:sticky;top:72px]` with its
  three `.sw` cards.
- **Copy** byte-exact, punctuation included: the affiliate sentence with its
  period inside `<strong>`, `In this article` (lower-case) in the mobile summary
  against `In This Article` in the sidebar, `Weekly digest.` in both newsletter
  blocks, the ⚠ at U+26A0, `Read →`, `{N} min read`.
- **Removed**: the invented `.art-h`, `.disc-box`, `.author-bio`, `.art-main`,
  `.art-side`, `.legal-toc` article sidebar, `.art-hero`, the `.progress`
  bar, and the *"Comments — read-only in v1"* staging notice — the kind of
  visible placeholder the porting rules forbid.
- **New components**: `NewsletterForm.astro` (the theme's partial, with the id
  passed in the way `wp_unique_id()` varies it) and `AuthorSocials.astro`, a
  **generated** file whose seven inline SVG icons are lifted verbatim from
  `inc/author.php` rather than hand-copied.
- **New files**: `src/styles/article.css` (the article slice of the theme's
  stylesheet, verbatim, with `style.css` line provenance) and
  `src/scripts/article.js` (progress, TOC scroll-spy, mobile dropdown, copy
  button, comment-ad cloning — ported from the theme's `main.js`).
- **Heading ids are server-rendered now.** WordPress injects them on
  `the_content` at priority 9; `rehype-slug` does the same at build time, so the
  TOC anchors exist in the served HTML and the old client-side id-patching hack
  is gone.
- **No `.art-cover`** — WordPress emits it only with a featured image, so with
  no featured image the correct behaviour is to omit it. **No ad slots** and
  **no `.comments-area`**: WordPress emits nothing for the former when no ad
  code is configured, and the latter needs a comment backend this build does not
  have (a posting form that cannot post would be a fake control).

**Three real divergences found by measuring against the live article, all
fixed:**

1. The copy button was 30px tall against WordPress's 27px, because an invented
   `button { font: inherit }` forced `line-height: 1.6` onto every button.
   WordPress leaves the browser default (`normal`) in place. Fixed globally and
   verified: every homepage button now matches WordPress exactly
   (`.btn b-gold b-sm` 32px/17.6, `.gwill-form__submit` 46→48, `.fpush` 40/13),
   at the cost of 3–4px of homepage document height — movement toward
   WordPress, which is why it stands.
2. The port's own `.art-body` prose (`max-width: 72ch`, `margin-top: 12px`, and
   a gold `h2::before` bar WordPress does not draw) leaked into the article page
   from `Layout.astro`. Moved verbatim to `src/styles/prose.css`, imported by
   about and contact only; both pages measure identical afterwards.
3. Two tokens the theme's `.brd` badge needs (`--red-muted`, `--red-border`)
   were never installed; the port had only `--red` and its own literal-rgba
   copy. The theme's values are installed and the duplicate rule removed.

**Evidence** — `docs/port/10-article-template.md`, specs in
`~/work/article-port/`, measurement runs in `~/work/regression/`. Behaviour and
geometry compared against the live WordPress article at 390/768/1280: identical
font sizes, line heights, letter spacing, colours, avatar sizes, disclosure
chrome, share-button chrome, sidebar padding/radius and grid columns. The
dropdown's default state, click state and stored value match. The only
differences are content-driven and listed in the doc (longer title, no
`Updated` fragment on this post, longer bio).

4. The related block showed **3 cards where WordPress showed 2**.
   `relatedTo()` appended other-category posts after the same-category matches,
   so every article always filled three slots. `gwill_get_related_posts()`
   queries the **primary category only**, capped at 3, and `single.php` falls
   back to the **2 most recent** posts only when that returns nothing. Fixed and
   verified across all seven articles: each now renders
   `min(same-category, 3)`, or 2 when its category has no siblings — which is
   why the live WordPress article shows 2.

Gate: `check-article-fidelity.mjs` grew from 22 assertions describing the stub
to **80 describing WordPress's contract**; all 5 gates green.

## [0.3.4] — 2026-09-23

**Base layer completed, and proven layout-neutral** — the last unported rules from
the theme's `RESET / BASE` section (`style.css:170-199`). The header, footer and
homepage ports each measured their own surface in isolation and deliberately left
this layer out; parity on the single-post page (in progress) requires the theme's
base underneath it, so it lands first.

Installed verbatim in `src/styles/base.css`, from `style.css:184, 185, 189`:

- `img, picture, video, canvas, svg, iframe, input, textarea, select, table { max-width: 100% }`
  — the port capped only `img`, so an oversized embed, video or data table could
  overflow a phone column. The theme never lets that happen.
- `img { height: auto; display: block }` — removes the inline baseline gap the
  theme does not have under figures and card images.
- `h1, h2, h3, h4 { letter-spacing: -0.02em }` — the theme's global heading
  tracking; any heading carrying its own tracking still wins on specificity.

Already installed by the v0.3.1 pass: `*, *::before, *::after { box-sizing:
border-box; margin: 0; padding: 0 }`, `a { text-decoration: none; color: inherit }`,
`button` / `input, select, textarea { font-family: var(--font) }`,
`.skip-link` / `.screen-reader-text`, and `html { scroll-behavior: smooth;
scroll-padding-top: … }`. **M-BASE-LAYER is closed.**

**Evidence that it moved nothing** — the same commit was built twice (CSS at `HEAD`,
then CSS with the three rules), the two trees served on separate local origins, and
measured over 15 page/width combinations (home, `/articles/`, a real article, about,
affiliate disclosure × 390/768/1280):

- the served byte diff is exactly **+143 bytes** — the three rules and nothing else
- the layout diff is **0 fields across all 15 combinations**: document height,
  horizontal overflow, section offsets, heading tracking and underlined-link count
  all identical
- `/ @768` reads 4209px on the new build, matching the live v0.3.3 baseline, which
  is what shows the agreement is real rather than a coincidence of two stale runs
- the port renders **no `<img>` elements** on those five pages today, so
  `display: block` is a no-op until the article port brings embedded media in

One outlier is recorded rather than smoothed over: the first old-build pass read
`/ @768` at 4159px against 4209px for the new build. Four repeat runs of that
combination on *both* builds read 4209 every time — a flaky render in the first
pass, not a layout shift.

Gates: 5/5 green (header 31, footer 18, homepage 123, article 22, vectors 95);
build 53 pages.

## [0.3.3] — 2026-09-23

**Article subtitles, designed into the theme's idiom** — King's order ahead of
the blog import: *"I want to add subtitles after the title, if you can design it
to match."*

WordPress has no post subtitle (`single.php` goes breadcrumb → badge → `h1.art-t`
→ `.art-meta`), so this is a net-new element rather than a port. It is built
**only from values the theme already uses**: supporting copy in the theme is
`font-weight: 300` in a dimmed colour, and its accent idiom for a passage that
stands apart is a **3px `--gold` left rule** — the treatment `.callout`,
`.art-body blockquote`, `.wp-block-pullquote` and `.tbl-best` all share.
The standfirst therefore takes 17px/300/`--text-mid`, line-height 1.6, a 62ch
measure, and that same gold rule with a 16px inset. No new tokens, no new
colours, no invented ornament.

- **Content model:** optional `subtitle` field in `src/content.config.ts`.
  The article page renders `subtitle` and falls back to `description`, so posts
  without an authored subtitle still show a complete header; `description` keeps
  its own jobs (card excerpt, search result, meta description, JSON-LD).
- **Placement:** `p.art-sub`, directly after `h1.art-h`, before `.feat-meta`.
- **Demonstrated:** the dollar-corridor article now carries an authored
  `subtitle` distinct from its excerpt, proving the field — not just the
  fallback.
- **Declared divergence:** the port now shows a line under titles that WordPress
  does not. Recorded in `docs/port/08-article-subtitle.md` so a later fidelity
  pass cannot "fix" it back out.
- **New gate:** `scripts/check-article-fidelity.mjs` — the article surface had
  **no contract gate at all** (header/footer/homepage did, article did not).
  22 assertions covering the title stack, the subtitle's placement, field and
  design contract, and the rest of the page. `npm run check` now reports
  **5/5 gates green**.
- Measured at 390/768/1280: 17px · weight 300 · line-height 27.2px · `--text-mid`
  · `border-left: 3px rgb(180,83,9)` · `padding-left: 16px` · `max-width: 632.4px`
  · 16px below the title · 5 lines at 390 → 3 at 768/1280.

## [0.3.2] — 2026-09-23

**The theme pill no longer jerks the page when tapped.** Reported from a phone:
"clicking on any darkmode toggle option jerks the page up."

The pill's JavaScript returned focus with a plain `.focus()`. The pill lives in
a sticky header, and the document carries `scroll-padding-top: calc(--header-h +
20px)` = 76px, so the browser scrolled the page to bring the focused segment
clear of that padding — **measured as a 19px upward jump on every tap** at
390px, and it happens on both paths: focusing the current segment when the menu
opens, and returning focus to the trigger after an option is chosen.

The theme already fought this exact bug and documented it in its own voice
(`assets/js/spotlight-search.js`, v1.0.199: *"plain .focus() scrolls the
sticky-header trigger into its DOCUMENT position, on Android Chrome this drags
the whole page up — browser-verified: 257px jump live"*). The fix is the theme's
fix: `focus({ preventScroll: true })` on all three focus returns in the pill
(open, option chosen, Escape). Arrow-key navigation keeps its plain `.focus()`,
matching the theme.

Verified with real taps against the rebuilt page at 390px: scroll 3000 → **3000**
on open (was 3000 → 2981), Dark applied with focus returned and no movement,
and a repeat at 4200 held at 4200. Focus return still works (WCAG 2.4.3) — it
just no longer moves the page.

### Added

- 2 assertions in `scripts/check-header-fidelity.mjs`: every focus return in the
  pill must use `preventScroll`, and no bare `sel.focus()` / `trigger.focus()`
  may reappear.

## [0.3.1] — 2026-09-23

**Phone-review fixes: the stray underlines are gone and the newsletter form is
styled.** Three defects reported from a phone screenshot, all three traced to
theme stylesheet sections the earlier scoped extractions could not see — the
homepage port was scoped to the sections the homepage renders, and the theme
styles anchors and form controls elsewhere.

### Fixed

- **Every link was underlined** — 79 of the homepage's 109 links. The theme
  resets anchors in its RESET/BASE section (`style.css:186`:
  `a { text-decoration: none; color: inherit; }`) and that layer had never been
  ported; without it, every link falls back to the browser default. The
  WordPress original measures 3 underlined links (the footer credit link and the
  cookie-consent policy link, both styled deliberately). The port now measures
  **2** — the credit link, twice, exactly as WP styles it. The banner's policy
  link is the third and arrives with the consent banner (footer part 2).
- **The newsletter email field was a browser-default box** — measured at 390px:
  `175×19`, radius 0, `2px` grey border, no padding, 13.33px text, against
  WordPress's `261×46`, radius `10px`, `1px` border, `12px 16px` padding, 16px
  text. The homepage rules only override that field's *colours*; its geometry
  lives in the theme's FORMS section. Now: `300×46`, radius `10px`,
  `1px rgba(245,158,11,0.4)`, `12px 16px`, 16px — WP's geometry, on our
  container width.
- **The newsletter's "Email" label was visible** — WordPress hides it with
  `.screen-reader-text` (base section, `style.css:191-198`); the placeholder
  already carries the meaning. Installed verbatim: the label measures `1×1`
  again.
- **The hidden "Subscribing…" label, the `[data-loading]` swap and the
  honeypot rule moved out of `home.css`** into `forms.css`, where the theme
  keeps them. Those three had been added to `home.css` as an ad-hoc patch — the
  reason they were ever missing is that they were the only part of that section
  anyone had noticed.

### Added

- `src/styles/base.css` — the theme's RESET/BASE rules the port was missing
  (`style.css:172-198`), scoped deliberately: antialiased text, the anchor
  reset, control font inheritance, and the visually-hidden utility. The theme's
  element resets that would re-flow pages already verified and reviewed
  (`* { margin: 0; padding: 0 }`, `img { display: block }`, `max-width: 100%` on
  img/iframe/table, heading letter-spacing) are **not** included; that debt is
  tracked as **M-BASE-LAYER** in `PENDING-WORK.md`.
- `src/styles/forms.css` — the theme's FORMS section verbatim (`style.css:2883-
  2948`): control geometry, label styling, focus ring, autofill guards, the
  brand select chevron, submit base + hover + loading states, status and
  field-error chrome.
- **17 new gate assertions** in `scripts/check-homepage-fidelity.mjs`
  (**123 total**), each pinning one of the moved or added rules in the file that
  now owns it — plus assertions that the anchor reset is present and that no
  underline declaration creeps back into the base layer.

## [0.3.0] — 2026-09-22

**The homepage is ported.** `front-page.php` sections 2–8 — the hero, the stats
strip, the featured article, the latest grid, the category pills (with their
filter), the ad slots and the newsletter band — now render from Astro with the
theme's own class vocabulary, copy and CSS. The old homepage's invented markup
(`.ledger`, `.card`, `.chip`, fake ad notices, a count-up animation and a
placeholder newsletter) is gone.

### Added

- `src/pages/index.astro` — the homepage in WP's vocabulary: `.hero` /
  `.hero-grain` / `.hero-tag` / `.hero-h .g`+`.w` / `.hero-acts` with the real
  `.bh` and `.bhg` CTAs, `.stat-strip` with four `.si`, `.feat` with
  `.feat-meta`, `.g3` of `.ac` cards, `.cp-strip` pills, an empty `.ad-bg`, and
  `.nl-s` with WP's actual `.gwill-form` newsletter markup.
- `src/components/ArticleCard.astro` — the card anatomy from
  `template-parts/content.php` + `inc/card-media.php`: `.ac`, `.ac-img`, the
  no-thumbnail branch (`.ac-emoji` + the category art class), `.badge` in the
  theme's per-category colour, `h2.ac-t`, `.ac-ex > p`, `.ac-ft` with `.a-dt`
  (`M Y · n min`) and `.a-rd`.
- `src/styles/home.css` — the homepage slice of the theme stylesheet in source
  order: 191 rules, every media context (`print`, `@supports not
  (aspect-ratio)`, touch, `prefers-reduced-motion`, 767/1023/1024+), and the
  custom properties they depend on.
- `scripts/check-homepage-fidelity.mjs` — **106 assertions** covering section
  order, class vocabulary, byte-exact copy, the pill/filter contract and the
  stylesheet values, wired into `npm run check` (now 4/4 green).

### Fixed — every one of these was found by measuring, not by reading

- **The legacy stylesheet out-voted the theme.** `Layout.astro`'s
  `<style is:global>` is emitted *after* the imported CSS, so the homepage's old
  rules beat the ported theme for the same selectors: `.con` was
  `calc(100% - 32px)`, `.g3` had `gap: 24px`, `.feat` was `1fr 1.4fr` and
  `.cp.on` was dark. 50 legacy rules removed; the theme's values now win —
  the 1280 grid measures `324px 324px 324px` gap 16px and the featured
  `501px 501px`, exactly WP's.
- **`--con-pad` had no responsive values.** WP shrinks it 48 → 28 → 20px;
  the port only carried 48, making every container 16–64px too narrow. Added.
- **Three category badge values were wrong in the port's own data.**
  `investing` → `bgn`, `remittance` → `bsl`, `dollar-accounts` → `bg`; the chip
  tints (`.db-g/.db-gr/.db-p/.db-s`) were missing entirely.
- **The newsletter button rendered both labels** — "Subscribe Subscribing…" in a
  198px button where WP measures 105px. The hide rule lives in the theme's FORMS
  section, outside the homepage scope the extraction covered.
- **The honeypot was visible.** `"Leave this blank"` printed in the form because
  `.gwill-honey`'s off-screen rule (`style.css:2948`) was in that same missed
  block. Now `left: -9999px`, `opacity: 0`, `height: 0`.
- Both missed rules were added to `home.css` as a documented port addition and
  are pinned by assertions.

### Divergences (deliberate, reasoned)

- **No AJAX.** WP swaps the grid through `admin-ajax.php`
  (`action=gwill_filter_posts`); a static build has no endpoint, so the filter
  produces the identical visible result locally — same active pill, same
  `aria-pressed`, same empty-state copy, no network call, no spinner. WP's own
  two bugs in that path (`cache['']` always refetching, and the empty category
  dropping the `.g3` wrapper) are not reproduced.
- **The newsletter form does not fake a subscription.** It stays pixel-identical
  to WP's, validates the address the same way, and on submit says the list is
  not open yet instead of redirecting to `/newsletter-thanks/`.
- **Ad slots render empty, as they do live.** `gwill_ads_enabled` is true but
  every ad code is empty, so WP emits wrappers and zero `.ad-slot` nodes and
  reserves 0px. The port matches that exactly, with no placeholder text.
- **Cards carry this repo's own articles** (7 with a category chip, vs WP's 9).
  The grid, the featured pick (`FEATURED_SLUG`, the theme-mod article) and every
  class come from WP; the content is the port's.

## [0.2.0] — 2026-09-22

**The footer is ported.** `footer.php` sections 2–5 — the desktop grid, the follow
CTAs, the social nav, the bottom bar, and the phone-only `.mfooter` — now render
from Astro, with the same visibility switch the header uses (`.footer` hidden at
≤767px, `.mfooter` hidden at ≥768px).

### Added

- `src/components/Footer.astro` — desktop and phone footers extracted against
  theme 1.13.39: the brand block and blurb, the four link columns of
  `inc/footer-links.php`, the network column, the four socials, the bell /
  Google News / install CTAs (including the iOS "Add to Home Screen" guide), the
  legal + credit bottom bar and the `#top` back-to-top link. Every icon is the
  theme's own SVG, copied verbatim.
- `src/styles/footer.css` — 94 lines, 65 rules: the footer's slice of stylesheet
  section 19 plus every media query and touch rule that touches those classes,
  declarations and breakpoints intact, and the custom properties it depends on.
- `scripts/check-footer-fidelity.mjs` — **64 assertions** against the WP source:
  markup structure and copy, class-by-class CSS values, the responsive contract,
  the icon-escape guard and the print rules. Wired into `npm run check`
  (now 3/3 green).

### Fixed — both found by measuring, not by looking

- **Four footer icons were rendered as literal text.** `{ICON.bell}` — and the
  install, iOS and Google News glyphs, in both footers — were interpolated
  without `set:html`, so Astro escaped them and the buttons printed
  `&lt;svg …&gt;` on the page. The bell measured 320×178 instead of 234×40. All
  ten icon interpolations now use `<Fragment set:html={…} />`, and the gate fails
  if a bare `>{ICON.x}` ever comes back.
- **A tablet rule was missing.** WP section 49's `@media (max-width: 1023px)
  { .footer { padding: 36px var(--con-pad) 20px } }` was not ported — 12px of
  extra height at 768px. A rule-by-rule diff of every footer selector against
  `style.css` is what caught it; it located nothing else in scope.
- **The bell no longer pretends to subscribe.** There is no push service behind a
  static build, so tapping it appends the theme's own inline-note style
  explaining that push needs a backend. `PUSH_ENDPOINT` is the single switch.
- Touch rule ported: `@media (hover: none) { .fsoc .soci:hover … }` (WP §54), so a
  tap on a social button no longer leaves the hover style stuck on a phone.

### Verified — measured against the live WordPress footer

| Viewport | `.ftop` grid template | `.fpush` | `.fgooglenews` | `.soci` | `.fbot` | overflow |
| --- | --- | --- | --- | --- | --- | --- |
| 1280px | `435.188px 217.609px 217.594px 217.609px` — identical | 234×40 | 203×40 | 34×34 | 1184×37 | 0 |
| 768px | `340px 340px` — identical | 234×40 | 203×40 | 34×34 | 712×65 | 0 |
| 390px | 2×2 `165px 165px`, `.mfgrid` 350×290 — identical | 234×40 | 203×40 | 34×34 | — | 0 |

Footer height: **461px at 1280** and **667px at 768** — exactly WP's own CSS
arithmetic (48 + 312 + 40 + 37 + 24, and 36 + 506 + 40 + 65 + 20). Two explained
deltas versus the live site:

- the live site's docked ad bar zeroes the footer's bottom padding
  (`body.ad-sticky-bottom`), so it measures 20–24px shorter; the port has no ad
  bar and keeps WP's designed padding;
- on a phone the port's install CTA is genuinely visible (Chrome fires
  `beforeinstallprompt` — the build is installable), which adds one 40px row plus
  the 10px gap. WP's headless render never qualified for it.

Screenshots: `docs/evidence/footer-port-{390,768,1280}.png`. Full record:
`docs/port/05-port-verification.md`.

### Not ported (deliberate)

Footer sections 6 (consent banner) and 7 (sticky ad bar), the bell's push panel,
the `.fs-lg` font-scale variants and the `no-flex-gap` Safari-14 fallbacks — all
need a service a static build lacks, or are inert without the JS class the WP
theme adds. Tracked in `PENDING-WORK.md`.

## [0.1.3] — 2026-09-22

### Fixed

- **On phones the popover came up icon-only — no words.** The
  `@media (max-width: 480px)` rule that hides the *trigger's* text was written as
  `.tp .tp-tx`, which also matched the three option rows inside the popover. On a
  handset the dropdown therefore showed three unlabelled icons. The rule is now
  scoped to `.tp-btn .tp-tx`: the trigger stays compact (icon + caret) while
  **System / Light / Dark stay readable inside the popover**. Reported after
  checking on a phone.
- Gate: new assertion pins the text-hide to the trigger, so `.tp .tp-tx` cannot
  come back.

### Verified

- 360 / 390 / 480px: all three option labels `SHOWN`; trigger label hidden as
  designed; popover 134px wide, fully inside the viewport; horizontal overflow 0.
- Screenshot: `docs/evidence/theme-menu-390-labels-fixed.png`.

## [0.1.2] — 2026-09-22

Theme control rebuilt as a single button. Requested change: one button, default
**System**, click to open — without losing any dark-mode feature or adding weight
to the page.

### Changed

- **One button instead of a three-segment pill.** The header used to render
  Dark · System · Light side by side in both headers. It is now a single compact
  pill showing the *current* choice (monitor / sun / moon icon + label) which
  opens a small popover containing the three options, System first.
- **Default is System**, unchanged: no stored key means "follow the device", and
  the trigger shows the monitor icon and the word *System* out of the box.
- **Same engine, same storage.** Still `gwill-finance-theme-v3`; still the inline
  pre-paint restore in `<head>` (so no flash of the wrong theme); System still
  tracks the OS live through the existing `prefers-color-scheme` listener, and a
  pinned Light/Dark still ignores the OS. No feature was dropped.
- **Keyboard support extended, not reduced.** With the menu closed the arrow keys
  still cycle the theme (legacy behaviour); with it open they move the focus ring
  and never change the theme. Escape and outside-click close it; the choice
  returns focus to the trigger.
- Active row now uses the brand amber (`--gold-b`, the accent used by the
  headline and stat numbers) in both themes, instead of the light-mode burnt
  orange, and the popover is sized to its trigger (`min-width: 100%`) so the two
  are flush; the panel radius is 12px so the 6px rows nest concentrically.

### Added

- Two gate assertions: exactly one theme trigger per header with the menu closed
  by default, and the popover styled + `hidden` until opened.
- `docs/evidence/theme-menu-{light-1280,dark-1280,dark-390}.png`.

### Verified (Chrome for Testing 153, CDP)

- One button per header; `aria-expanded="false"`, `aria-haspopup="true"`, menu
  `hidden` at first paint; label `System`; theme follows the OS (light here).
- Click → opens: `data-open="true"`, `display:flex`, `z-index:60`, focus lands on
  the current option, popover fully inside the viewport.
- Pick Dark → `data-theme="dark"`, storage `dark`, label/aria/label icon update,
  both headers' pressed state sync, menu closes, body background flips to ink.
- Reload → still dark, label `Dark`, menus closed (persistence intact).
- Pick System → storage key **removed**, theme matches the OS.
- **Forced-dark OS preference, no stored key** → page painted dark
  (`prefers-color-scheme: dark`, `data-theme="dark"`, no storage key): the System
  default genuinely follows the device.
- Escape closes; outside-click closes; 390px mobile variant opens 134px wide,
  fully inside the viewport, zero horizontal overflow, icon-only trigger with the
  label hidden as designed.
- Geometry: trigger and popover both 118px wide, identical left/right edges
  (922 → 1040) at 1280px.

### Cost

- Inline markup + CSS + ~45 lines of vanilla JS. **No new network request, no
  library, no build change** — the control is parsed with the document it already
  lived in.
- Measured transfer delta on the served page: 86,061 → 92,492 bytes raw and
  **19,288 → 20,413 bytes gzipped (+1.1 KB over the wire)**; resource requests
  unchanged at 5.

## [0.1.1] — 2026-09-22

Header-fidelity release. Closes the responsive header defects found once a real
browser was available on this box, and fixes two gates that were certifying
nothing.

### Fixed

- **Duplicate headers on mobile.** The WP theme shows the desktop header (`.sh`)
  *or* the mobile header (`.mh`) per breakpoint — never both. The first port pass
  carried no visibility switch, so both rendered stacked on phones. Ported WP
  sections 50/51 into `src/styles/header.css`: `≤767px` hides `.sh`, shows `.mh`;
  `≥768px` hides `.mh` and the drawer.
- **Phantom horizontal overflow on tablet (288px).** At 768–1023px the desktop
  header row (`.snav`, 882px of links + theme pill + search + newsletter CTA)
  overflows the viewport. WordPress clips this on `body`; the port clipped only
  `html`, so the document advertised 288px of overflow that production does not
  show. Added `overflow-x: hidden; overflow-x: clip; overflow-wrap: break-word`
  to the `body` rule in `src/layouts/Layout.astro`, matching WP line-for-line.
  Verified against the live WP site: identical header geometry, and overflow now
  reports 0 at 390 / 768 / 1280 — same as production.
- **Tablet ticker ran at desktop height.** WP section 49 sets the ticker to 30px
  (with 16px item padding) on tablet; the port left it at the 36px desktop value.
  Ported into a new `@media (max-width: 1023px)` block in `header.css`.
- **`npm run check` died with `MODULE_NOT_FOUND`.** `package.json` pointed at
  `scripts/check.mjs`, which did not exist in the tree — so the documented gate
  ran nothing, on every release. Added `scripts/check.mjs` as an umbrella that
  runs each gate and propagates failure.
- **fx-history vectors failed a little more each day.** The PHP oracle windows on
  `strtotime('-N days')` (a live clock at generation), while the TS gate called
  `fxHistoryRange()` with the default `Date.now()`. The gate therefore compared a
  moving window against a frozen count and drifted daily (observed 16/76 against
  the oracle's 20/80 — 4 days behind). The engine already accepts a clock
  argument; the gate now pins `HIST_ORACLE_MS` to the oracle's generation instant.

### Added

- Two header-fidelity assertions covering the fixes above (body-level clip; the
  tablet ticker rhythm), so the gate cannot regress silently.
- `README.md` and this changelog.
- `docs/HEADER-FIDELITY-INDEPENDENT-REVIEW.md` — verification record with exact
  commands and results.
- `docs/evidence/` — rendered screenshots at 390 / 768 / 1280.
- `scripts/.vectors-bundle.cjs` is now gitignored; it is a generated artifact of
  `vectors-check.mjs`, not source.

### Verified

- `npm run check` → `check: PASS — 2/2 gates green` (header contract PASS;
  vectors `pass=95 fail=0`).
- `npm run build` → 53 pages, exit 0.
- Rendered matrix in Chrome for Testing 153 via `agent-browser` (CDP), cache-busted:
  | viewport | `.sh` | `.mh` | ticker | `--con-pad` / `--header-h` | overflow |
  | --- | --- | --- | --- | --- | --- |
  | 390×844 | hidden | flex | 28px | 28px / 56px | 0 |
  | 768×1024 | flex | hidden | 30px | 28px / 56px | 0 |
  | 1280×800 | flex | hidden | 36px | 48px / 64px | 0 |

  No duplicate headers at any width.

- **Live staging** (`pages-dist` `88b28d6`, GitHub Pages reported `built` for that
  exact commit): served bytes carry all three CSS fixes, and the same matrix re-run
  against https://godschi10.github.io/finance-astro/ returned identical numbers —
  overflow 0 at 390/768/1280, ticker 28/30/36px, no duplicate headers. Evidence
  shots: `docs/evidence/live-header-*.png`.

### Known gaps (not in this release)

- WP's `@media (max-width: 1023px)` block also carries non-header tablet rules
  (`.footer` padding, `.nl-s` row layout, `.hero`, `.hero-h`, `.feat`,
  `.stat-strip`, `.si` borders, `.art-surface-pad`). Only the header-related lines
  were ported here; the rest is a separate tablet-parity workstream.
- On tablet the WP theme clips the desktop header's right side (search + theme
  pill edge + newsletter CTA) at 768px. The port now reproduces this exactly,
  because parity is the target — noted so it is not mistaken for a port bug.
- `scripts/php-harness/vectors.php` hardcodes the old box's theme path and so
  cannot regenerate the oracle here without editing `$INC`.

## [0.1.0] — 2026-09-21

Initial port: 53 pages green — chrome, homepage, legal, 17 calculators, articles,
search, about/apps/contact, WP-parity header (`sh`/`mh`/`mno`/`gs`/`tp`).
