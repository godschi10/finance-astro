# Changelog

All notable changes to the finance-astro port. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); dates are UTC.

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
