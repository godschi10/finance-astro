# Header fidelity — verification record (2026-09-22)

Scope: the WP→Astro header port on `finance-astro` (`main`), covering the
responsive defects closed in v0.1.1. Every claim below is tied to a command that
was actually run on this box, or is explicitly marked as *not* verified.

## Environment

- Host: Oracle Linux 9.8, aarch64, 5.6 GB RAM.
- Browser: **Google Chrome for Testing 153.0.8010.12** (arm64, the Playwright
  build shipped with the `agent-browser` CLI), driven headless over CDP on
  `127.0.0.1:9222` via `agent-browser`. Not a synthetic/static check — a real
  rendering engine with real layout.
- Local preview: `python3 -m http.server 8899` serving `dist/` at the site's real
  base path `/finance-astro/`.
- Parity target: the live WordPress site, https://finance.fitnesslova.qzz.io/.

## Commands and results

| Command | Result |
| --- | --- |
| `npm run check` | `check: PASS — 2/2 gates green` · header contract `PASS` (36 assertions) · vectors `pass=95 fail=0 cases=95 vectors=95` |
| `npm run build` | `[build] 53 page(s) built in 11.12s` · `[build] Complete!` · exit 0 |
| `node scripts/check-header-fidelity.mjs` | `header fidelity contract: PASS`, exit 0 |
| `node scripts/vectors-check.mjs` | `pass=95 fail=0`, exit 0 |
| `git diff --check` | clean (no whitespace errors) |

Rendered matrix (cache-busted navigation, `agent-browser set viewport`):

| viewport | `.sh` | `.mh` | `.mno` | ticker | `--con-pad`/`--header-h` | doc overflow |
| --- | --- | --- | --- | --- | --- | --- |
| 390×844 | hidden | flex | flex (off-canvas) | 28px | 28px / 56px | **0** |
| 768×1024 | flex | hidden | hidden | 30px | 28px / 56px | **0** |
| 1280×800 | flex | hidden | hidden | 36px | 48px / 64px | **0** |

`DUPLICATE_HEADERS: false` at all three widths.

Live-parity probe at 768px (`agent-browser eval` on both sites, same script):
`.sh` 768px wide and `.snav` **882px / left 174 / right 1056 in both**, with
identical child geometry (`.snav-list` 461px, `.tp` 223px at L654, `.nsearch` 34px
at L897, `.ncta` 106px at L951). The only difference was `documentElement.scrollWidth`:
production 768, port 1056 → traced to `body { overflow-x: clip }`, present in WP,
absent in the port.

Evidence files: `docs/evidence/header-{phone-390x844,tablet-768x1024,desktop-1280x800}.png`.

## Findings and dispositions

### F1 — Duplicate headers on mobile — **FIXED, VERIFIED**

`src/styles/header.css` carried no per-breakpoint visibility switch, so `.sh` and
`.mh` both rendered on phones. WP (sections 50/51) hides one per breakpoint.
Fixed by porting those sections. Verified at 390px: `.sh` hidden, `.mh` flex.

### F2 — 288px horizontal overflow at tablet — **FIXED, VERIFIED**

Root cause established by measuring *both* sites rather than guessing from the
port alone: header geometry is identical, but WP clips on `body` and the port
clipped only on `html`. Fixed in `src/layouts/Layout.astro`
(`overflow-x: hidden; overflow-x: clip; overflow-wrap: break-word` on `body`).
Verified: overflow 0 at 390/768/1280, matching production.

> Note for future passes: a naive "elements past the viewport" scan reports ~38
> false positives here — descendants of the ticker's `overflow: hidden`
> container. Filtering out elements with a clipping ancestor is required, and
> `overflow-x: clip` on `html` alone does *not* stop the document from
> advertising the overflow.

### F3 — Tablet ticker at desktop height — **FIXED, VERIFIED**

WP section 49 sets the ticker to 30px with 16px item padding on tablet; the port
left it at 36px. Ported into a `@media (max-width: 1023px)` block. Verified: 30px
at 768, 36px at 1280, 28px at 390.

### F4 — `npm run check` was a no-op — **FIXED, VERIFIED**

`package.json` declared `check: node scripts/check.mjs`; the file did not exist,
so the documented gate exited with `MODULE_NOT_FOUND` (masked in pipelines).
Added the umbrella runner. Verified: exit 0, and a failing gate now propagates
exit 1 (checked by running the gates directly, which return 1 on mismatch).

### F5 — Daily vector drift — **FIXED, VERIFIED**

`fxHistoryRange(points, days, nowMs = Date.now())` against a PHP oracle that
windows on `strtotime('-N days')` at generation time. The gate drifted with the
calendar (16/76 vs 20/80, 4 days). Pinned `HIST_ORACLE_MS = 2026-09-18T12:00:00Z`
and verified it reproduces exactly 20/80 (boundary band derived empirically:
2026-09-18T00:00Z → 21/81, 2026-09-18T12:00Z → 20/80, 2026-09-19T00:00Z → 20/80).

## Provenance of the review itself (honest record)

- One delegated read-only reviewer completed a pass and **reproduced the header
  contract check twice, `PASS` both times**, but its written report was never
  delivered to `docs/`. Two sibling review delegations **failed** on an
  infrastructure limitation (`Context compression is temporarily paused`), not on
  the code.
- Because no delegated artifact landed, **the parent re-verified everything
  independently** — the commands, matrix, and live-parity probe above were run
  directly on this box. Nothing here is inherited from an unverified claim.
- No browser proof was claimed for anything that was not rendered in Chrome 153.
  Where evidence is instrument-only (computed styles, geometry, overflow
  arithmetic) rather than visual, the screenshots stand alongside it for human
  confirmation.

## Not verified / out of scope

- **M-TABLET-PARITY**: WP's `@media (max-width: 1023px)` block also carries
  footer, newsletter-row, hero, feature-grid, stat-strip and article-surface
  tablet rules. Only header-related lines were ported; the rest is untouched and
  unverified in this release.
- **iOS/real-device rendering**: Chrome for Testing is a Chromium engine. No
  Safari/WebKit or physical iOS device pass was run.
- **Firefox**: authorized and viable on this box, but not installed, so no
  engine-diversity check was performed.
- **`vectors.php` regeneration**: the generator hardcodes the old box's theme
  path, so the oracle was not regenerated — the committed snapshot was used.
