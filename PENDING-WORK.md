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

## DONE — 2026-09-22 · Theme control: one button + popover (v0.1.2)

- [x] Replaced the always-visible Dark · System · Light pill with ONE button per
      header that opens a small popover. Default is still **System**.
- [x] Same engine, same `gwill-finance-theme-v3` key, same pre-paint restore (no
      flash); System still tracks the OS live, pinned Light/Dark still ignores it.
- [x] Keyboard extended (arrows cycle when closed, move focus when open; Escape /
      outside-click close); `aria-haspopup` + `aria-expanded` wired.
- [x] Review-pass polish: popover sized to its trigger so the edges are flush,
      brand amber (`--gold-b`) active row in both themes, 12px panel radius with
      6px nested rows, label hidden only below 480px.
- [x] Gate: +2 assertions. `npm run check` → 2/2 green (vectors 95/95).
- [x] Shipped: `main` `8223dc9`; staging `pages-dist` `934fe58`.
- [x] Verified live: Pages `built` for `934fe58`; served bytes carry the new
      markup + CSS; full behavioural pass against the live URL (first paint closed
      → open → pick Dark → reload persists → pick System removes key → Escape /
      outside-click close → 390px variant); no regression in the responsive header
      matrix (overflow 0 at 390/768/1280, ticker 28/30/36px).
- [x] Cost: no new request, no library, no build change (single HTML doc, 5
      resource requests).
- [x] **v0.1.3 fix (reported on a phone, 2026-09-22):** the ≤480px rule that hides
      the trigger's text (`.tp .tp-tx`) also matched the popover's option rows, so
      the dropdown came up icon-only on handsets. Scoped to `.tp-btn .tp-tx`; the
      option labels are readable again at 360/390/480px, and a gate assertion now
      pins the hide rule to the trigger.

## DONE — 2026-09-22 · Footer port (v0.2.0)

- [x] Ported `footer.php` sections 2–5 to `src/components/Footer.astro` (desktop
      `.footer` + phone `.mfooter`, same visibility switch as the header) and WP
      stylesheet section 19's footer slice to `src/styles/footer.css` (94 lines,
      65 rules, declarations and breakpoints intact).
- [x] Link columns, network column, copy and the four social SVGs taken from
      `inc/footer-links.php` + the theme's `social_svg()`; the theme's external
      "Visit Website" default is overridden with the King's real X / Instagram /
      LinkedIn / YouTube URLs.
- [x] `scripts/check-footer-fidelity.mjs` — **64 assertions** (markup, copy,
      class-by-class CSS, responsive contract, icon-escape guard, print rules).
      `npm run check` → 3/3 green, vectors 95/95.
- [x] **Escaped-icon bug, found by measuring:** four icons (`bell`, `install`,
      `ios`, `gnews`, in both footers) were interpolated without `set:html`, so
      Astro printed `&lt;svg …&gt;` as page text and the bell boxed 320×178
      instead of 234×40. All ten now use `<Fragment set:html={…} />` + assertion.
- [x] **Missing tablet rule, found by rule-diff:** WP §49
      `@media (max-width: 1023px) { .footer { padding: 36px var(--con-pad) 20px }
      }` — 12px of extra height at 768px. Ported.
- [x] Touch rule `@media (hover: none) { .fsoc .soci:hover … }` (WP §54) ported so
      a tap does not leave the hover style stuck on a phone.
- [x] Bell reworked for a static build: with no push backend, tapping it appends
      the theme's own inline-note style explaining that. `PUSH_ENDPOINT` is the
      single switch.
- [x] Verified by measurement against the **live WordPress footer** at
      390/768/1280: identical `.ftop` grid templates, identical CTA/social/bottom
      bar boxes, overflow 0. Footer height equals WP's own CSS arithmetic
      (461 @1280, 667 @768).
- [x] Evidence: `docs/evidence/footer-port-{390,768,1280}.png`; record in
      `docs/port/05-port-verification.md`; rule diff tool `docs/port/footer-css-diff.py`.
- [ ] **Shipped:** `main` `<sha>`; staging `pages-dist` `<sha>` — fill in after the
      push, then confirm the served bytes.

## PENDING

- [ ] **M-TABLET-PARITY** — WP's `@media (max-width: 1023px)` block also carries
      non-header/non-footer tablet rules: `.nl-s` newsletter row layout,
      `.hero` / `.hero-h` 42px, `.feat` single column, `.stat-strip` 2-col,
      `.si` borders, `.art-surface-pad`. (The `.footer` padding line is done — see
      the footer section above.) Port the rest, then extend the gate.
- [ ] **Footer part 2 — consent banner, sticky ad bar, push panel.** WP
      `footer.php` section 6 (`gconsent`: show/hide, storage key, accept/decline)
      and section 7 (scroll-revealed dismissible sticky ad bar) plus the bell's
      `gwill-bell-panel` UI (`.gbp-*`, `@keyframes gbp-*` / `ad-sticky-in`) are NOT
      ported: all three need a service (ads, push) that a static build does not
      have. Their CSS is deliberately excluded from `footer.css`.
- [ ] **`.fs-lg` font-scale footer rules** — `.fs-lg .fpush, .fs-lg .fgooglenews,
      .fs-lg .btn, .fs-lg .finstall { flex-wrap: wrap }`. Only meaningful once the
      port grows the `.fs-lg` accessibility system.
- [ ] **`no-flex-gap` Safari-14 fallbacks** — `.no-flex-gap .fsoc / .fbot /
      .fbot-right / .mfbot > * + * { margin-… }`. Inert without the JS class the WP
      theme adds for old Safari; modern engines support flex `gap`.
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
- If a CDP eval suddenly times out and `cdp=000` on 9222, the daemon's browser is
  wedged: a fresh `agent-browser --namespace <new>` auto-launches its own clean
  Chrome (no Chrome on 9222 needed) — quicker than restarting `chrome-serve.sh`,
  which needs a background-process approval.
- Measuring beats looking: the escaped-icon bug and the missing tablet padding
  were both invisible in the source and found only by comparing rendered numbers.
- The GitLab remote does not exist for this repo (verified: `git ls-remote
  git@gitlab.com:godschi10/finance-astro.git` → "Could not read from remote
  repository"). GitHub only, until one is created.
