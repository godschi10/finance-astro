# PENDING-WORK — finance-astro

Ledger law: every order gets a line here immediately. `CODED-UNCOMMITTED ≠ DONE`;
a fix is done only when the served bytes and the rendered page prove it.
Read this at session start.

## DONE — 2026-09-22 · Header-fidelity release v0.1.1

- [x] Mobile duplicate headers — WP sections 50/51 visibility switch ported to
      `src/styles/header.css` (`≤767px` hides `.sh`, shows `.mh`).
- [x] Tablet 288px phantom overflow — `body { overflow-x: hidden; overflow-x: clip;
      overflow-wrap: break-word }` in `src/layouts/Layout.astro`, matching WP.
      Root cause established by measuring the live WP site, not by guessing.
- [x] Tablet ticker rhythm — WP section 49 (30px / 16px padding) ported into a
      `@media (max-width: 1023px)` block.
- [x] `npm run check` was dead (`scripts/check.mjs` missing) — umbrella gate added;
      runs every gate and propagates failure.
- [x] fx-history vector drift — `HIST_ORACLE_MS` pinned to the oracle's generation
      instant (was failing a little more each day: 16/76 vs 20/80).
- [x] Gate extended with 2 assertions covering the new contract lines.
- [x] README + CHANGELOG + `docs/HEADER-FIDELITY-INDEPENDENT-REVIEW.md` +
      `docs/evidence/` shots (local build and live staging).
- [x] Shipped: `main` `cb8cd35`; staging `pages-dist` `88b28d6`.
- [x] Verified live: GitHub Pages `built` for `88b28d6`; served bytes carry all
      three CSS fixes; Chrome 153 matrix against the live URL → overflow 0 at
      390/768/1280, ticker 28/30/36px, no duplicate headers.

## PENDING

- [ ] **M-TABLET-PARITY** — WP's `@media (max-width: 1023px)` block also carries
      non-header tablet rules: `.footer` padding, `.nl-s` newsletter row layout,
      `.hero` / `.hero-h` 42px, `.feat` single column, `.stat-strip` 2-col,
      `.si` borders, `.art-surface-pad`. Only the header lines were ported.
      Port the rest, then extend the gate.
- [ ] **Firefox engine pass** — Firefox is authorized and viable on this box
      (5.6 GB) but not installed. Install and run the header matrix in a
      non-Chromium engine for cross-engine confidence.
- [ ] **iOS / WebKit pass** — Chrome for Testing is Chromium only; `overflow-x:
      clip` on `body` is the WP-parity behaviour, but Safari has historically
      been the weak spot for `clip`. Untested on WebKit.
- [ ] **`vectors.php` portability** — the generator hardcodes the old box's theme
      path (`/home/ubuntu/gwill-finance-theme/inc/`); make `$INC` overridable and
      regenerate the oracle end-to-end on this box.
- [ ] **Observed, not a port bug** — on tablet the WP theme itself clips the
      desktop header's right side (search + theme-pill edge + newsletter CTA) at
      768px. The port now reproduces this exactly. If the King wants that
      changed, it is a WP-side design change to make first.

## Notes

- Browser stack on this box: Chrome for Testing 153 (arm64) via the
  `agent-browser` CLI; launch with `bash ~/.hermes/scripts/chrome-serve.sh`
  (CDP 9222). Do **not** use the `browser_exec` tool for local previews — it
  refuses private/loopback addresses.
- The GitLab remote does not exist for this repo (verified: `git ls-remote
  git@gitlab.com:godschi10/finance-astro.git` → "Could not read from remote
  repository"). GitHub only, until one is created.
