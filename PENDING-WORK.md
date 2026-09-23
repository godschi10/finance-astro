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
- [x] **Shipped:** `main` `fe08a64`; staging `pages-dist` `96245a0` (82 files, nojekyll).
- [x] **Served bytes verified:** Pages build `built` for `96245a0`; 200 OK, 110,271 B;
      footer markup + inlined `footer.css` (`.footer{…padding:48px var(--con-pad) 24px}`
      / `.mfooter{…padding:32px 20px 24px}`) present; 0 escaped SVGs; 8 socials.
- [x] **Verified live** on https://godschi10.github.io/finance-astro/ at 390/768/1280:
      `.ftop` grids `435.188px 217.609px 217.594px 217.609px` (1280) and `340px 340px`
      (768) — identical to WP; CTA 234×40; Google News 203×40; socials 34×34; bottom bar
      1184×37 / 712×65; `.mfgrid` 350×290 `165px 165px`; footer ≥768 desktop 461 @1280,
      667 @768, phone 770 @390; overflow 0; install CTA visible; no escaped icon text.
      Shots: `docs/evidence/footer-live-{390,768,1280}.png`.

## DONE — 2026-09-22 · Homepage port (v0.3.0)

- [x] Extraction from theme 1.13.39 (proven byte-identical to `/var/www/finance`):
      `home-port/01-home-markup.md`, `02-home-css.css` (240 rules in source order),
      `03-home-js.md`, `05-live-oracle.{md,json}` (measured 390/768/1280).
- [x] `src/styles/home.css` — 191 rules, the theme's media contexts intact
      (`print`, `@supports not (aspect-ratio)`, touch, reduced-motion, 767/1023/1024+).
- [x] `src/components/ArticleCard.astro` — WP card anatomy (`.ac`, `.ac-img`,
      `.ac-emoji` + art class, `.badge`, `h2.ac-t`, `.ac-ex`, `.ac-ft`, `.a-dt`, `.a-rd`).
- [x] `src/pages/index.astro` — sections 2–8 in WP's vocabulary and order, WP's real
      newsletter `.gwill-form` markup, an empty `.ad-bg`, no invented elements.
- [x] `scripts/check-homepage-fidelity.mjs` — **106 assertions**; `npm run check`
      → **4/4 green** (vectors 95/95); build 53 pages.
- [x] Five defects found by measuring and fixed — legacy-cascade win (50 rules
      removed after asserting each selector exists in `home.css`), missing
      `--con-pad` breakpoints (28/20), visible "Subscribing…" label, **visible
      honeypot** ("Leave this blank"), wrong badge values + missing chip tints.
- [x] Measured against the live WP homepage: 1280 `.g3` `324px 324px 324px` gap 16
      and `.feat` `501px 501px`; 768 CTAs `212×45`/`144×45`, `.g3` `348px 348px`;
      390 CTA `350×45`, submit `300×46`, strip `has-overflow can-next`; ad slots
      0×0 `display:none`; overflow 0 at all three.
- [x] Behaviours probed on the built page: filter (Investing → 1 card +
      `aria-pressed`, active pill no-op, All → 7), strip wrap + scroll buttons,
      honest newsletter submit (no navigation, nothing sent).
- [x] Record `docs/port/06-homepage-verification.md`; release docs v0.3.0
      (CHANGELOG / README / package.json).
- [x] **SHIPPED 2026-09-23** — `main` **`5cf10cb`**; served staging `pages-dist`
      **`e121b54`** (82 files, nojekyll present); GitHub Pages build `built` for
      `e121b54`; live URL `https://godschi10.github.io/finance-astro/` → 200 OK,
      **131,772 B**, origin locked, 7 `.ac` cards, `.bh`/`.bhg`, `.stat-strip`,
      `.feat`, `.g3`, `cp-strip-wrap`, empty `.ad-bg`, `.nl-s`, real
      `type="email"` field, both hide rules inlined in the served document,
      0 escaped `<svg`, 0 `{ICON`, 0 "No email field", 0 "fills when ads".
      Local preview re-probed: served bytes byte-identical to the build
      (`cmp` clean). Shot evidence `docs/evidence/home-port-{390,768,1280}.png`.
- [x] Dead-CSS sweep of the inherited global block (`scan-dead-css.py`):
      136 rules, 1 flagged — `.brd`, which is a live theme badge colour that
      simply none of our 7 articles uses. Kept. `.ledger` is **alive** (used by
      `/about/`, `/apps/`, `/contact/`).

## DONE — 2026-09-23 · Phone-review fixes (v0.3.1)

- [x] Three defects reported from a phone screenshot, all traced to stylesheet
      sections outside the earlier scoped extractions:
      (1) **79 of 109 links underlined** — the BASE anchor reset
      (`style.css:186`) was never ported. Now **2**, exactly WP's deliberate
      credit link (WP's third is the consent-policy link, which arrives with the
      consent banner).
      (2) **Newsletter field a browser-default box** — measured `175×19` radius
      0 pad 0 13.33px vs WP `261×46` radius 10 `12px 16px` 16px. Now
      `300×46` radius `10px` `12px 16px` 16px.
      (3) **Visible "EMAIL" label** — `.screen-reader-text` was undefined in the
      port. Now `1×1`, as WP.
- [x] New layers: `src/styles/base.css` (RESET/BASE, scoped to the rules that
      normalise text + controls) and `src/styles/forms.css` (FORMS section 46
      verbatim). Imported in `Layout.astro`: base first, forms last.
- [x] The three form rules that had been ad-hoc additions in `home.css` (hidden
      "Subscribing…", `[data-loading]` swap, honeypot) moved to `forms.css` —
      their old home is why the rest of that section went unnoticed.
- [x] 17 new gate assertions → **123 total**; `npm run check` **4/4 green**;
      build 53 pages. Geometry re-measured after the change: identical to WP at
      390/768/1280 (no regression from the new layers).
- [x] Evidence: `docs/evidence/home-newsletter-fixed-390.png`,
      `home-port-{390,768,1280}.png`; record `docs/port/07-base-and-forms.md`.
- [x] **Ship (v0.3.1 + v0.3.2) 2026-09-23** — `main` **`8e5fd3f`**; served staging
      `pages-dist` **`eea0ced`**; Pages build `built` for `eea0ced`.
      **Verified on the live URL with real taps at 390px:** scroll 3000 → **3000**
      on tapping the pill (was 3000 → 2981 before the fix), Dark applied with
      focus returned and no movement; served bytes carry `preventScroll: true`
      ×6, `a{text-decoration:none;color:inherit}`, `.gwill-honey{position:absolute;
      left:-9999px…}`, and the control-geometry block; **2 of 109 links
      underlined** (the deliberate credit link); newsletter input `300×46` radius
      `10px` padding `12px 16px` 16px; the "Email" label `1×1`. Evidence:
      `docs/evidence/home-newsletter-fixed-390.png`.

## DONE — 2026-09-23 · Theme pill no longer jerks the page (v0.3.2)

- [x] Reported from a phone: "clicking on any darkmode toggle option jerks the
      page up". Cause: the pill's JS returned focus with a plain `.focus()`
      while living in a **sticky** header under
      `scroll-padding-top: calc(--header-h + 20px)` = 76px, so the browser
      scrolled the focused segment clear of that padding — **measured 3000 →
      2981 (19px) on open, every tap**, plus the same on the option path.
- [x] Fixed the theme's way: `focus({ preventScroll: true })` on all three
      focus returns (open, option chosen, Escape). The theme documented this
      exact failure for its search trigger (v1.0.199, "browser-verified: 257px
      jump live", `assets/js/spotlight-search.js`).
- [x] Verified with **real taps** (not synthetic clicks — the code guards on
      `ev.isTrusted`, so a JS `.click()` never moves focus and would have hidden
      the bug): scroll 3000 → **3000** on open, Dark applied with focus returned,
      no movement; repeat at 4200 held at 4200. Focus return still works
      (WCAG 2.4.3).
- [x] +2 assertions in `scripts/check-header-fidelity.mjs`; `npm run check`
      4/4 green; build 53 pages.
- [x] **Ship (v0.3.1 + v0.3.2) 2026-09-23** — `main` **`8e5fd3f`**; served staging
      `pages-dist` **`eea0ced`**; Pages build `built` for `eea0ced`; live re-probe
      with real taps at 390px: scroll 3000 → **3000** on tapping the pill (was
      3000 → 2981), Dark applied, focus returned, no movement. Served bytes carry
      `preventScroll: true` ×6.

## DONE — 2026-09-23 · Article subtitles designed to match the theme (v0.3.3)

**Order (King):** *"Time for blogpost import but I want to add subtitles after
the title, if you can design it to match."*

- [x] Established first that this is **net-new, not a port**: WP `single.php`
      renders breadcrumb → badge → `h1.art-t` → `.art-meta`. The only subtitle
      fields in the truth theme are page heroes (`gwill_about_subtitle`,
      `gwill_apps_hero_sub`, `gwill_nl_hero_subtitle`) — different surfaces.
- [x] Derived the design from the theme's own vocabulary instead of inventing
      one: supporting copy is `font-weight: 300` in a dimmed colour
      (`.hero-sub` L727, `.feat-ex` L794, `.ac-ex` L769), and the accent idiom
      for a passage that stands apart is a **3px `--gold` left rule**
      (`.callout` L2168, `.art-body blockquote` L2070, `.wp-block-pullquote`
      L2072, `.tbl-best` L1475). Ship: 17px/300/`--text-mid`, line-height 1.6,
      62ch measure, 3px gold rule, 16px inset, 16px below the title.
- [x] Content model: optional `subtitle` field + `description` fallback, so a
      post without an authored subtitle still renders complete.
- [x] Authored a real subtitle on the dollar-corridor post — proves the field,
      not just the fallback.
- [x] New `scripts/check-article-fidelity.mjs` (22 assertions) wired into
      `check.mjs`: the article surface had **no gate at all**. `npm run check`
      now 5/5 green.
- [x] Measured at 390/768/1280 (light + dark) and captured
      `docs/evidence/art-sub-{390,768,1280}.png` +
      `art-sub-variants-390.png`; design record `docs/port/08-article-subtitle.md`.
- [x] **Ship (v0.3.3) 2026-09-23** — `main` **`b11217a`**; `pages-dist` **`cb8e08a`**;
      Pages `built cb8e08a`. **Verified live at 390px:** DOM order
      `art-h → art-sub → feat-meta`; authored subtitle served verbatim;
      17px · weight 300 · rule `3px rgb(180,83,9)` · inset 16px · 16px below the
      title; dark theme flips the rule to `rgb(245,158,11)` on
      `rgb(196,184,154)` text. Evidence `docs/evidence/art-sub-live-390.png`.
- [ ] **King's verdict on the treatment** (gold rule vs the plain and hairline
      variants in `art-sub-variants-390.png`); one-line switch if he prefers
      another.

## PENDING

### NEXT — Blog post import (King's stated next step)

**King's correction, verbatim:** *"Rubbish, you only focused on the subtitles,
why didn't you port the rest of the blogpost template."* He is right: v0.3.3
designed the subtitle but left the article page as the port's own invention.
The **whole single-post template** must be ported at footer-grade fidelity
first; the subtitle rides on top of it.

- [ ] **ARTICLE PAGE PORT (primary order).** The port's article page shares
      almost no class vocabulary with WP `single.php` (191 article selectors in
      `style.css`). Missing/divergent in full:
      - [ ] `.prog > .prog-f` reading-progress bar (port has `.progress`)
      - [ ] `.art-hd` wrapper (port has none)
      - [ ] `.bc` breadcrumb w/ full menu path — port has `.crumbs` comma-free
            but different markup and no sub-menu path
      - [ ] `h1.art-t` (port invents `.art-h`), `.art-hd` padding 20px 0 48px
      - [ ] `.art-meta` — avatar `.art-avatar` 20px, `.art-author-link`,
            `.art-dot` separators, `F Y` date, "N min read", conditional
            "Updated M Y" (port has `.feat-meta` with no avatar)
      - [ ] `.art-reading-surface` + `.art-surface-pad` + `.art-cover`
            (`gwill-hero`, eager, fetchpriority high)
      - [ ] mobile TOC dropdown `.toc-dropdown.toc-mobile` / `.toc-summary` /
            `.toc-caret` / `.toc-list` / `.toc-sub` — **entirely missing**
      - [ ] `.discl.mb24` disclosure (⚠ `.discl-i` + `.discl-t`, exact copy) —
            port invents `.disc-box`
      - [ ] `.share-row` / `.share-l` / `.share-b` — WP has **4** buttons
            (X, LinkedIn, WhatsApp, `data-copy` Copy Link); port has chips and
            no LinkedIn, different labels
      - [ ] `.abio.mt20` author box (`.aav` 48px avatar, `.an-name`, `.abio-t`
            with the exact fallback bio, `.abio-s` social icons) — port invents
            `.author-bio`/`.author-mark`
      - [ ] related block — WP `.mt40` + `.shd` + `h2.stitle` "Related
            Articles" + `.g2` **two** cards; port has "Keep reading" + `.g3` ×3
      - [ ] `.comments-area.mt48` + hidden `#gwill-comment-ads` rect slots
      - [ ] mobile `.m-nl-wrap` / `.m-nl` newsletter block — missing
      - [ ] sidebar: `.article-sidebar` sticky `top:72px` with `.sw` / `.sw-t`
            / `.toc-scroll` / `.toc-i` (`.cur`) / `.toc-bar` / `.toc-g`, the
            square ad slot, and the digest card — port invents `.art-side` +
            `.legal-toc`
      - [ ] the port's visible **"Comments — read-only in v1" placeholder**
            (`.comments-hold` + `.phase-tag`) — a staging notice King's law
            forbids; must go
      - [ ] article JS: progress, TOC `.cur` tracking, mobile dropdown, copy,
            comment-ad cloning
      - [ ] an article slice of `home.css`/new `article.css` with the 191
            selectors and their media queries
- [ ] Source of truth for the import: decide WP REST export vs the `.md`
      collection as authoring home (this decides where subtitles are AUTHORED).
- [ ] If WP must match the port, mirror the subtitle: ACF field on the theme's
      post field group + `single.php` render + the same rule set in `style.css`.
      The design is portable as-is; it is not yet in the theme.
- [ ] Import script: WP post → `src/content/articles/*.md` with `title`,
      `description`, `subtitle`, `category`, `author`, `authorSlug`, `pubDate`,
      `updated`, `readMins`.
- [ ] Category slug mapping WP → the six canonical brand slugs; unknown falls
      back to Finance at render time.
- [ ] Re-run `npm run check` (article gate must stay green) and verify a
      freshly imported post renders title → subtitle → meta at 390/768/1280.

- [ ] **M-BASE-LAYER** — `base.css` deliberately carries only the theme's base
      rules that normalise text rendering and control typography. Still not
      ported from the theme's RESET/BASE section, because each would re-flow
      pages already measured and reviewed: `*, *::before, *::after { box-sizing:
      border-box; margin: 0; padding: 0 }`, `img { height: auto; display: block }`,
      `img, picture, video, canvas, svg, iframe, input, textarea, select, table
      { max-width: 100% }`, `h1, h2, h3, h4 { letter-spacing: -0.02em }`,
      `html { scroll-behavior: smooth; scroll-padding-top: … }`. Port them
      page-by-page with measurement, not in one pass.

- [ ] **M-TABLET-PARITY (homepage subset now done — v0.3.0)** — the theme's
      `@media (max-width: 1023px)` homepage rules (`.nl-s` newsletter row,
      `.hero`/`.hero-h` 42px, `.feat` single column, `.stat-strip` 2-col, `.si`
      borders, `.g3` 2-up, `.footer` padding) are ported via `home.css` and the
      footer release. What remains of that block is non-homepage:
      **`.art-surface-pad`** and the article-page tablet rules.
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
