# 06 — Homepage port verification

Release **v0.3.0**. Source of truth: `gwill-finance-theme` **1.13.39**
(`front-page.php`, `template-parts/content.php`, `inc/card-media.php`,
`inc/finance-helpers.php`, `style.css`), proven byte-identical to the deployed
theme (`diff -rq` against `/var/www/finance/wp-content/themes/gwill-finance-theme`
→ no differences, both 1.13.39).

Live oracle: **https://finance.fitnesslova.qzz.io/** — read-only, cache-busted,
origin asserted on every load.

Port under test: local preview build of `main` (53 pages) at
`http://127.0.0.1:8899/finance-astro/`, measured with Chrome for Testing 153
(arm64) via `agent-browser`.

The local mirror is used for **iteration only**; every claim below is either a
measurement of the port against the WP oracle's numbers, or a source assertion in
`scripts/check-homepage-fidelity.mjs`.

## Measured parity

| element | 390 | 768 | 1280 | WP oracle |
| --- | --- | --- | --- | --- |
| `main` children | `section.hero`, `div.stat-strip`, `div.con`, `div.con#latest`, `div.con#newsletter` | same | same | same 5 blocks |
| hero CTAs `.bh` / `.bhg` | 350×45 / 350×45 | 212×45 / 144×45 | 212×45 / 144×45 | 350×45 · 212×45 / 144×45 |
| `.hero-acts` direction | `column` | `row` | `row` | column → row |
| `.con` inner / `.g3` | 350 | 712 → `348px 348px` | 1004 → `324px 324px 324px` | `348px 348px` · `324px 324px 324px` |
| `.g3` gap | 16px | 16px | 16px | 16px |
| `.feat` columns | `348px` (1 col) | `710px` (1 col) | **`501px 501px`** | 1 col · `501px 501px` |
| `.feat-img` | 348×170 (WP ≤767 rule) | 710×200 | 501×290 | 170 @≤767 · 200 @≤1023 |
| `.cp.on` | `rgb(180,83,9)` / white | same | same | `rgb(180,83,9)` / `#fff` |
| `.si-n` typography | 24px / 800 / `rgb(180,83,9)` | same | same | same |
| `.ad-bg` | 2 wrappers, 0×0, `display:none`, 0 `.ad-slot` | same | same | 2, 0×0, none, 0 slots |
| `.cp-strip-wrap` | `has-overflow can-next`, prev disabled, next enabled | no overflow (7 pills fit) | no overflow | overflow + can-next at 390 |
| newsletter submit | 300×46 | **105×48** | **105×48** | 300×46 @390 · 105×48 |
| submit text | `Subscribe` | `Subscribe` | `Subscribe` | `Subscribe` |
| honeypot | `left:-9999px, opacity:0, height:0`, x≈−9159 | same | same | x=−9322, `left:-9999px`, `opacity:0` |
| html overflow | 0 | 0 | 0 | 0 |

Content differences are **not** fidelity gaps: the port's grid shows its own 7
articles and 6 category chips, WP's shows 9 posts and 9 chips. Structure, class
vocabulary, copy of the WP-owned strings, CSS and behaviour are the contract.

## Behaviour, probed on the built page

- filter: click **Investing** → `on` count 1, `aria-pressed=true`, 1 of 7 cards
  visible, `gridHasP` true (the empty-state paragraph is not used when there are
  hits). Clicking the already-active pill changes nothing (1 visible, 1 `on`) —
  WP's `category-filter.js` rule. Clicking **All** restores 7 visible.
- newsletter: empty submit → `"Enter a valid email address."`; valid submit →
  `"This form isn't connected yet — the list opens at launch, so nothing was
  sent."`, and `location.pathname` unchanged (nothing navigates, nothing is sent).
- pill strip: `.cp-strip` is wrapped in `.cp-strip-wrap`, the two
  `.cp-scroll-btn` buttons carry WP's `aria-label`s, scroll step is 70% of the
  strip's client width, and arrow-key navigation is registered.

## Defects found by measuring (all fixed in this release)

1. **Legacy cascade win.** `Layout.astro`'s `<style is:global>` is emitted after
   the imported CSS, so the pre-port homepage rules beat the ported theme:
   `.con { width: calc(100% - 32px) }`, `.g3 { gap: 24px }`,
   `.feat { grid-template-columns: 1fr 1.4fr }`, `.cp.on` dark. 50 rules
   removed; every removed selector was asserted to exist in `home.css` first, so
   nothing the theme does not define was deleted.
2. **`--con-pad` had no breakpoint values.** WP: 48px base, 28px @≤1023px, 20px
   @≤767px. The port carried only 48px → containers 64px narrow at 768 and 16px
   narrow at 390.
3. **`Layout.astro` kept a selector-list rule** (`.cp.on,.cp[aria-pressed="true"]`)
   that the theme never had — it survived the first cleanup pass because only one
   selector in the list was on the allow-list. Removed after measurement showed
   the dark pill again.
4. **`--gold-input-border` was never declared**, so the newsletter input fell
   back to its initial `border-color`.
5. **The newsletter submit's loading label was visible** — "Subscribe
   Subscribing…" and a 198px button. Cause: `.gwill-form__submit-loading
   { display: none }` lives in the theme's FORMS section (style.css 2934–2937),
   outside the homepage scope the extraction was briefed on.
6. **The honeypot was visible** — `"Leave this blank"` printed in the form.
   Same cause, same block (style.css 2948).

Defect 5 and 6 are recorded in `home.css` as an explicit port addition naming the
theme lines they come from, and both are pinned by gate assertions so they cannot
regress silently.

## Not verified / still open

- **Configured-ad state.** Live ads are all disabled, so only the empty-slot
  state could be compared. Neither WP nor the port reserves height when a slot is
  filled.
- **Dark theme** on the homepage — measured light only (same gap as the footer
  pass). Homepage dark rules are present in `home.css`, and the token block lives
  in `Layout.astro`; the *combination* on this page has not been measured
  element-by-element.
- **WebKit / Firefox.** Chromium-only measurement on this box.
- **`.art-surface-pad`** and the rest of the non-homepage tablet rules remain
  unported (tracked in `PENDING-WORK.md`).
- WP's two filter bugs (`cache['']` refetch, `.g3` dropped in the empty state)
  are deliberately **not** reproduced, so the port's DOM differs from WP's in
  exactly those two states.
