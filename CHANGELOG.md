# Changelog

All notable changes to the finance-astro port. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); dates are UTC.

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
