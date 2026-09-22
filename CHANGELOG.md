# Changelog

All notable changes to the finance-astro port. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); dates are UTC.

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
