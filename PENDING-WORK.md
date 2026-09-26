# PENDING-WORK — finance-astro port

Ledger law: every order gets a line here immediately. `CODED-UNCOMMITTED ≠ DONE`;
a fix is done only when the served bytes and the rendered page prove it.
Read this at session start.

## INBOUND — the King's 7 orders, 2026-09-26 ("lots of issues… get to work") — ALL 7 SHIPPED as v0.4.8

- [x] **1. Share row** — centered (`justify-content:center`); phone wraps
      into centered lines with label out of flow; 4 inline SVG glyphs
      (X/LI = footer's brand paths, WhatsApp simple-icons, link chain);
      aria-labels. Gates pin the new markup. Served-proven: 3 share
      aria-labels + 4 `<svg>` in buttons.
- [x] **2. Footer Google widget REMOVED** — both anchors, gnews icon, 4
      dead CSS rules, home.css selector: ZERO occurrences in src/ AND
      served bytes. Gate asserts ABSENCE (footer 64/64).
- [x] **3. Author-reply auto-approve** — Worker `POST /api/moderation/reply`
      flips pending parent → approved; `parent_auto_approved` flag; desk
      note explains. E2E-proven on live D1 (seed→pending→reply→auto-approved
      →public, cleanup after). Worker `bf4498c4`, smoke 60/60.
- [x] **4. Updated meta** — showcase frontmatter `updated: 2026-08-19`
      (WP's real modified date) → renders "Updated Aug 2026". Other 7
      posts never edited post-publish → no chip, matching WP.
- [x] **5. Comments design** — hover-kill block transcribed VERBATIM
      (style.css:2497-2515, v1.0.151) into article.css: blue card-lift and
      all plugin hovers neutralized; focus/active kept. Nesting verified
      already-correct by probe (22px indent, thread line, transparent
      reply cards, 32px avatars — byte-identical to live WP override).
- [x] **6. Lightbox** — NO port bug: the only non-zooming images are the
      two `alt=""` decorative ones (cover bg + media+text), excluded by the
      theme's own a11y guard — identical on live WP.
- [x] **7. Header spacing** — desk `.mod-wrap` 28px→44px top padding;
      rendered gap 84px under sticky header (probe-proven).

      v0.4.8 shipped: main `12f88ba`, pages-dist `41b252e` (Pages built),
      Worker `bf4498c4`. Gates 5/5 (article 147/147, footer 64/64 — both
      EVOLVED to pin the new truth).

- [x] **comments-api Worker backend — BUILT + VERIFIED 54/54 GREEN** (2026-09-25).
      `/home/opc/work/comments-api/` — wrangler.toml, schema.sql, src/index.js
      (583 lines, zero deps), README.md, smoke.py. Delegation child died on
      output-token exhaustion with only 2 files; parent finished it directly.
      Evidence: local wrangler dev + real HTTP, exit 0 — submit→pending→approve
      →live, nesting, counts, reaction add/toggle/switch, plugin field names
      (post_id / reaction_type / vibe_guest_id), 429 rate limit, honeypot 400,
      HMAC tamper 403 / expiry 410, admin auth 401/200 + signed-link queue,
      CORS allow/reject, 404, 15-key wire shape, spam scorer 100/likely-spam,
      gravatar MD5 = 55502f40dc8b7c769880b10874abc9d0 (canonical test vector).
- [x] **comments P1 integration — DONE, shipping in v0.4.6** (2026-09-25).
      `src/components/VibeComments.astro` + `src/scripts/vibe-comments.js`
      (the plugin's own 3,087-line client, 233 changed lines = transport seam
      only) + both stylesheets byte-identical in WP's cascade order, wired into
      `[slug].astro` between the related posts and the mobile newsletter —
      WP's own position. Client module ported by a delegation child (30 calls);
      parent verified the bytes, then fixed the one dead-control risk it
      flagged (the inert sort button) and the two wire divergences against live
      WP (SHA-256 gravatar + `human_time_diff` dates). Gate 147/147; Worker
      60/60 live; browser probe green at 390px. Docs: `docs/port/17`.
      **SHIPPED v0.4.6**: main **`9a94857`**, served staging `pages-dist`
      **`a0acc83`** (Pages reported `built` for `a0acc83`). Served proof:
      article page byte-identical to dist (240,808 B), the comments surface on
      every article and absent on home/about (WP's singular-only enqueue), the
      CDN bundle 200 with the transport seam intact, 404 body byte-identical.
- [x] **comments-api DEPLOYED TO CLOUDFLARE — LIVE + VERIFIED 53/53 GREEN**
      (2026-09-25). **https://comments-api.gwill.workers.dev** — D1
      `f3f58a69…47fe` (region WEUR) + KV `9c03bd56…a414`, schema applied
      remotely, secrets ADMIN_TOKEN / SALT / EMAIL_HMAC_KEY set. Access came
      from the OAuth device grant the King approved; the env token's missing
      D1+KV permission groups were the real blocker — never the account.
      Evidence: the same battery run against the LIVE url, exit 0 — submit→
      pending→approve→live, nesting, counts, reactions, plugin field names,
      429, honeypot 400, 403/410, admin 401/200, CORS allow/reject, 404.
      Edge-only finding: Cloudflare answers a bare `Python-urllib` UA with 403
      BEFORE the Worker runs (invisible on local dev) — harness now sends a UA.
- [ ] **BLOCKED ON KING — Turnstile keys** (site key + secret, free, two
      clicks). Until they exist the Worker skips Turnstile exactly as WP does
      when unconfigured; honeypot + 1/min limiter + ported scorer still apply.
      Optional: Resend API key for moderation email (else /admin + ADMIN_TOKEN).

## IN FLIGHT — 2026-09-26 · King's four orders on the comments surface

- [x] **REAL COMMENTS VISIBLE** — SHIPPED 2026-09-26. 41 genuine reader
      comments + 127 reactions imported to production D1 (WP id + 1000; the
      King's own test/agent threads excluded; his live pending comment
      preserved as id 17). Verified live across all 8 articles.
- [x] **MODERATION DESK** — SHIPPED 2026-09-26. Worker `/api/moderation/*`
      (list/stats/action/reply, Bearer; status lifecycle; delete-forever only
      from trash; reply-as-author auto-approves) + `/mod/` page (unlock gate,
      Overview/Queue/All tabs, status-derived action matrix, post-name links,
      phone-restore law, version stamp).
- [x] **GUEST FORM EXPOSED BY DEFAULT** — SHIPPED 2026-09-26. Toggle ceremony
      removed; name/email render open; reply-move/cancel never collapse them.
- [x] **UX/UI AUDIT + BETTER + FASTER** — SHIPPED 2026-09-26. UX digest (5
      references) applied: count-bearing trigger, comment-shaped skeletons,
      email-why hint; 153KB module lazy-loads on click; count fetch gated on
      scroll proximity. Gates 5/5, 147/147.
- [x] **"New reactions look shrunken until refresh"** — FIXED 2026-09-26, live
      (main `fef8483`, pages-dist `9d0e133`, Worker `2d321ca5`). The ported
      finance gold skin carried `.vibe-rx-mine{background:none!important}`,
      which killed the reader's OWN disc background the instant they reacted
      (pixel-proven from the King's screenshot: 52px fragments vs siblings'
      102px). Rule deleted per the 9/8 King law (summary disc identical
      whether yours or not; picker = only highlight). Worker parity fix in the
      same ship: load/replies embed `user_reaction` via ONE batched mineKinds
      query, so the picker marks the reader's own reaction after refresh.
      End-to-end proof on the public URL: disc rgb(47,125,225) 22×22 right
      after react AND after reload; picker marks `like` after reload; probe
      toggled its reaction back off (production data untouched).
- [x] **"Dashboard doesn't have to look like shit"** — DESK v2 REBUILT + LIVE on
      staging 2026-09-26 (main `2a7384f`, pages-dist `8754721`, Worker `d3921a6d`).
      ROOT CAUSE was real, not taste: v1's Astro-SCOPED CSS could never reach
      runtime-built tiles/rows/cards (createElement can't carry the cid
      attribute) — the whole data half rendered with ZERO styling ("1PendingReview",
      mono wall, "Compared)6"). v2: ONE GLOBAL sheet (runtime rows always dress);
      number-over-label stat tiles (2-up phone, 4-up desktop, Reactions spans
      full phone row); pending>0 pulses gold; ranked Most Commented rows with
      count chips; avatar-led comment cards (gravatar + initials fallback);
      status chips; brand reaction glyphs + count (no word labels — no-double
      glyph law); 44px pill control family; dark mode first-class. Worker desk
      payload now carries `avatar`. E2E on public URL: unlock PASS, 5 tiles
      styled PASS, 8 ranked rows PASS, queue card (avatar+chip+6 actions) PASS,
      25 rows + 62 glyph rows PASS. Vision: 9.5/10 light AND dark, zero bugs.
      Design language: docs/port/18-desk-design-language.md.
      **STATUS: screenshots delivered to the King — AWAITING HIS VERDICT before
      the full batch (CHANGELOG/version/skill). Not yet version-bumped.**

## SHIPPED — 2026-09-25 · comments P1 BUILDING + v0.4.5 TOC fix SHIPPED

- [x] **"Why is TOC showing &?"** — SHIPPED v0.4.5 (main `0cb2e23`,
      pages-dist `9c71566`, Pages `built`, live bytes verified): raw-HTML TOC
      extractor double-escaped entities; now decodes before Astro escapes
      once. All four ampersand headings byte-identical to live WP. Gate
      124/124 (+4 assertions, runtime-built needles).

- [x] **COMMENTS PLAN APPROVED** — 2026-09-25 King: "Build with your
      recommendations" → workers.dev address, approve-first moderation,
      Turnstile ON, reactions in v1, P1 floor as cut.

- [x] **COMMENTS PLAN WRITTEN** — `docs/port/15-comments-plan.md` (12.4KB):
      evidence-cited (14 wp_ajax actions, wire shape, 40KB+24KB CSS, 151KB
      JS, template contracts, gold tokens), Worker+D1+KV+Turnstile backend,
      UI ported from HIS vibe-comments (gold skin verbatim), 3 phases,
      6 gates, 5 King decisions. **AWAITING APPROVAL — no code until then.**
- [x] **Subtitle ↔ post-meta spacing** — SHIPPED v0.4.4: `.art-sub` had
      `margin-top:16px` and NO `margin-bottom` (deck sat 0px on the author
      pill — exactly the King's screenshot). Now symmetric 24px/24px
      (theme's `.mb24` callout rhythm). Measured live: title→deck 24,
      deck→meta 24. main `86227ef`, pages-dist `adb3a4f` (built, verified).

## SHIPPED — 2026-09-24 · King's verdict on v0.4.2 (v0.4.3) — SHIPPED, LIVE-VERIFIED

King: "Why do I have to press the × twice to close" + "You still didn't fix
the spacing issue, these elements are too close to each other, look."

- [x] **× twice** — FIXED. The lightbox was DOUBLE-BOUND: v0.4.2's verbatim
      `src/scripts/lightbox.js` import AND a 211-line folded copy (§11) that
      had lived inside `article.js` since v0.3. Two document-level listeners
      → two stacked `.gl-overlay` per click → × closed only the top one.
      Folded copy removed with a tombstone comment; the theme's own
      architecture (lightbox = its own enqueue; main.js has NO lightbox
      section) is now the port's. Gate asserts single bind.
- [x] **Spacing** — FIXED. Theme §48 LAYOUT UTILITIES (style.css:2966-2982)
      extraction stopped after .con/.g2/.g3/.sb-layout; `.sg .mt20 .mt40
      .mt48 .mb12 .mb20 .mb24 .flex .aic .jsb .g16 .fw3 .fz11/12/14 .cm-c
      .cd .lh .cl-layout` were missing from the served CSS on ALL 54 pages —
      disclosure flush on the body (0px vs live 24px), author box −20px,
      related −40px. Installed GLOBALLY in base.css (14 non-article
      templates use them; the theme ships them in the one global sheet).
- [x] Gap chain re-measured port vs live (390 dark): toc→discl 20/20,
      discl→body 24/24, body→share 28/28, share→abio 20/20, abio→related
      64/64 — 0 divergent pairs. Gate 120/120, 5/5 green.
- [x] Shipped main `85bcf8f` + pages-dist `d7f9d48` (Pages: built).
- [x] SERVED-BYTES VERIFIED on the live URL: `.mb24{margin-bottom:24px}` in
      the inline CSS; served JS = ONE gl-overlay build site, zero
      lbInit/lbBuild; live click → 1 overlay; one × press → closed + scroll
      unlocked; live discl→body gap = 24px.
- [ ] King's phone review of v0.4.3 (awaiting verdict).

---

## SHIPPED — 2026-09-24 · King's verdict on v0.4.1 (v0.4.2)

King: "Still highly unfinished, so many issues, lightbox doesn't even work. Some
elements aren't spaced enough." + "And no featured images on posts."

- [x] **Lightbox does not work** — FIXED. Theme's `assets/js/lightbox.js` (266 ln)
      ported verbatim to `src/scripts/lightbox.js`, wired beside article.js with
      the `GwillLightbox` i18n object printed exactly as wp_localize_script
      does; the missing `.gl-*` base CSS slice (style.css:2192-2237) installed in
      article.css + the §51/56 dark hovers. PROVEN with REAL input at 390 dark:
      click opens overlay (opacity 1, rgba(0,0,0,.92), z 99999, blur 8px, counter
      "1 / 4", caption rendered, focus→.gl-close, body scroll locked); Esc closes
      (focus returned to the image); ArrowRight navigates 1/4→2/4; Enter opens
      from keyboard focus. Vision analysis of the open overlay confirms every
      lightbox UI convention present.
- [x] **No featured images on posts** — FIXED. Root cause: the port's articles had
      NO image data at all (0 `image:` fields). Every live WP post carries a
      category-art cover (verified live: showcase + 4 probed articles all
      art-cover=1). Ported: schema `image`/`imageAlt`/`imageSrcset` fields; all 8
      articles mapped to the same category art WP serves (banking/dollar/savings/
      crypto/investing/remittance/showcase, 16 new asset files downloaded: 12 new
      this batch). `.art-cover` markup = WP's `get_the_post_thumbnail('gwill-hero')`
      (single.php:106-120). Card thumbnails: `inc/card-media.php` BOTH branches
      ported — `<a class="ac-img" tabindex="-1">` with medium 300×169 lazy +
      300w/768w srcset; homepage grid now 8/8 withImg, 0 emoji (was 8/8 emoji).
- [x] **Spacing** — MEASURED port-vs-live at 390/768/1280 light+dark, 24 stack
      points: cover/discl/toc/share heights IDENTICAL at every width; every top
      delta traces to the declared subtitle divergence (live title = "…
      — Every Block Styled" wraps 2 lines, port splits title/subtitle) and
      content flow. One real defect found & fixed: port's author bio text was
      authored-shorter, abio box +19px; now byte-matched to the live ACF bio
      ("Web developer and finance writer. … Based in Nigeria.") → abio 197→178.
      +18px on related at 768/1280 = the related-card excerpt lines (live
      related for showcase = kuda-vs-moniepoint post set; port's = kuda
      traditional-banks) — content, not styling.
- [x] Footer suspects from King's screenshots — CLEARED: the "Designed & built"
      credit already links gwillchijioke.com on both sites; © host is
      `home_url()` on both (live prints its origin, port prints its Pages
      origin — same WP pattern); push bell + Google News present in ported form.
- [x] Gate 106 → 116 assertions, all 5 gates green.
- [x] Shipped: `main` f8c0504 → (this commit), `pages-dist` synced, Pages built
      and SERVED BYTES verified (below).


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

## DONE — 2026-09-23 · Base layer completed, proven layout-neutral (v0.3.4)

- [x] **M-BASE-LAYER closed** — the last unported rules of the theme's
      `RESET / BASE` section (`style.css:170-199`) installed verbatim in
      `src/styles/base.css`: the extended `max-width: 100%` selector set
      (`img, picture, video, canvas, svg, iframe, input, textarea, select,
      table` — the port capped only `img`), `img { height: auto; display: block }`,
      and `h1, h2, h3, h4 { letter-spacing: -0.02em }`. The rest of the section
      (`*` reset, `a` reset, control fonts, `.skip-link`/`.screen-reader-text`,
      `html { scroll-behavior; scroll-padding-top }`) was already installed by the
      v0.3.1 pass.
- [x] Why now, not later: parity on the single-post page (next) means the theme's
      base layer underneath it; the earlier decision to defer was taken when no
      page needed it.
- [x] **Layout-neutrality proven by A/B, not asserted** — same commit built twice
      (CSS at `HEAD` vs CSS with the rules), served on two local origins, measured
      over 15 page/width combos (home, `/articles/`, a real article, about,
      affiliate disclosure × 390/768/1280). Served diff = exactly **+143 bytes**,
      the three rules and nothing else; layout diff = **0 fields across all 15
      combos** (document height, horizontal overflow, section offsets, heading
      tracking, underlined-link count). `/ @768` also matches the live v0.3.3
      baseline at 4209px. Harness: `~/work/regression/measure.py`.
- [x] One outlier recorded honestly: the first old-build pass read `/ @768`
      4159px against the new build's 4209px. Four repeat runs of that combo on
      *both* builds read 4209 every time — a flaky render, not a layout shift.
- [x] Gates 5/5 green (header 31, footer 18, homepage 123, article 22,
      vectors 95); build 53 pages.
- [x] **Shipped (v0.3.4) 2026-09-23** — `main` **`eab9a55`**; `pages-dist`
      **`5ff4717`**; Pages `built 5ff4717`. **Verified against the live site:**
      served `index.html` went 136595 → 136738 bytes with all three rules present
      verbatim, and the live before/after measurement over the same 15
      page/width combinations shows **0 differing fields** — the change is
      layout-neutral on the real site, not only locally. Rationale and evidence:
      `docs/port/09-base-layer.md`; raw runs in `~/work/regression/`.

## PENDING

### NEXT — Blog post import (King's stated next step)

**King's correction, verbatim:** *"Rubbish, you only focused on the subtitles,
why didn't you port the rest of the blogpost template."* He is right: v0.3.3
designed the subtitle but left the article page as the port's own invention.
The **whole single-post template** must be ported at footer-grade fidelity
first; the subtitle rides on top of it.

## DONE — 2026-09-24 · Gutenberg showcase + King's v0.4.0 verdict (v0.4.1)

- [x] **King's verdict accepted: four real defects, all found and fixed.**
      (1) Tables unstyled — markdown emits bare `<table>`, the theme styles only
      `.wp-block-table`; new rehype plugin wraps tables in Gutenberg's
      `<figure class="wp-block-table">`. (2) `assets/css/embeds.css` was never
      ported (outside `style.css`; enqueue.php:471) — facades +42px,
      Spotify collapsed to 42/152px; imported verbatim. (3) ≥1024 media block
      sat after the base rules — four list/blockquote margins WordPress never
      serves (WP: base wins); block moved to the theme's source order, order is
      now a gate assertion. (4) Showcase TOC empty — Astro `headings` can't see
      raw-HTML headings; raw-body fallback mirroring the theme's DOMXPath pass.
- [x] **Showcase post ported as ordered:** byte-captured `.art-body` (42 blocks),
      16 image assets localised under `wp-content/uploads/`, rewritten to the
      base path. Block diff vs live: **42/42 blocks, 0 differing fields** at
      390/768/1280; deep probe equal in light AND dark.
- [x] **Byline = `get_the_author()` display name "G-will Chijioke"** (measured
      on live) across content files, AUTHORS, seed posts; verified in built
      bytes (meta pill + `.an-name`).
- [x] **Meta orphan-dot in King's screenshot reproduced at 320px on BOTH
      sites** (h=64, same wrap, dot orphans on WP's own kuda) — theme behaviour,
      kept as parity; joint theme-level fix offered separately.
- [x] Gate 79 → **106 assertions**; all 5 gates green; CHANGELOG `[0.4.1]`,
      `docs/port/11-gutenberg-showcase.md`, README gate row.
- [x] **Shipped (v0.4.1)** — `main`/`pages-dist`/Pages build + served-bytes
      verify: table wrapper, embeds rules, `G-will` byline, showcase page 200.

## DONE — 2026-09-23 · The article page, ported from `single.php` (v0.4.0)

- [x] **ARTICLE PAGE PORT — CLOSED.** King's correction was right and it is
      fixed: the article page now speaks WordPress's class vocabulary, so the
      theme's own stylesheet applies to it unchanged. Every item of the original
      gap inventory, in the order it was listed:
      - [x] `.prog > .prog-f` reading-progress bar (the invented `.progress` is gone)
      - [x] `.art-hd` wrapper (port had none)
      - [x] `.bc` breadcrumb with the full Home › category › title path and `.bc-s` separators
      - [x] `h1.art-t` (the invented `.art-h` is gone)
      - [x] `.art-meta` — 20px `.art-avatar` Gravatar with 2x srcset,
            `.art-author-link`, `.art-dot` separators, `F Y` date, `N min read`,
            conditional `Updated M Y` (the old `.feat-meta` is gone)
      - [x] `.art-reading-surface` + `.art-surface-pad`; `.art-cover` correctly
            absent (WP emits it only with `has_post_thumbnail()`)
      - [x] mobile TOC dropdown `.toc-dropdown.toc-mobile` / `.toc-summary` /
            `.toc-caret` / `.toc-list` / `.toc-sub` — verified at 390/768/1280,
            default open state matching WP
      - [x] `.discl.mb24` disclosure (⚠ `.discl-i` + `.discl-t`, byte-exact copy);
            the invented `.disc-box` is gone
      - [x] `.share-row` / `.share-l` / `.share-b` — all 4 controls (X, LinkedIn,
            WhatsApp, `data-copy` Copy Link) with WP's URL construction
      - [x] `.abio.mt20` author box (`.aav` 48px, `.an-name`, `.abio-t`,
            `.abio-s` socials generated verbatim from `inc/author.php`);
            the invented `.author-bio` is gone
      - [x] related block `.mt40` + `.shd` + `h2.stitle` "Related Articles" + `.g2`
            (the "Keep reading" `.g3` stub is gone)
      - [x] `.comments-area.mt48` + `#gwill-comment-ads` — **deliberately NOT
            emitted**: it is gated on `comments_open()` and needs a comment
            backend this build has no backend for. A form that cannot post is a
            fake control. Revisit when comments land.
      - [x] mobile `.m-nl-wrap` / `.m-nl` newsletter block — added
      - [x] sidebar `.article-sidebar` sticky `top:72px` with `.sw` / `.sw-t` /
            `.toc-scroll` / `.toc-i` `.cur` / `.toc-bar` / `.toc-g`, the empty
            square-ad `.sw` WP really serves, and the digest card (the invented
            `.art-side` + `.legal-toc` are gone)
      - [x] the visible **"Comments — read-only in v1" placeholder**
            (`.comments-hold` + `.phase-tag`) — **deleted**; the gate now asserts
            it stays out
      - [x] article JS — progress, TOC `.cur` tracking, mobile dropdown with
            stored choice, copy button, comment-ad cloning (inert until comments
            exist), ported from the theme's `main.js`
      - [x] `src/styles/article.css` — the article slice of the theme's
            stylesheet verbatim, with `style.css` line provenance
- [x] **The three divergences measurement caught, all fixed** (full account in
      `docs/port/10-article-template.md`): the copy button's 30px-vs-27px height
      from an invented `button { font: inherit }`; the port's own `.art-body`
      prose (72ch, `margin-top:12px`, a gold `h2::before` WP does not draw)
      leaking into the article page from `Layout.astro` — moved to
      `prose.css` for about/contact only; and the two missing
      `--red-muted`/`--red-border` tokens the theme's `.brd` badge needs.
- [x] Heading ids server-rendered via `rehype-slug` (WP does it on
      `the_content` at priority 9); the client-side id-patching hack is gone.
- [x] `check-article-fidelity.mjs` rewritten: 22 assertions describing the stub →
      **80 describing WordPress's contract**. All 5 gates green.
- [x] **A fourth divergence, found by the live re-measure:** the related block
      showed 3 cards where WordPress showed 2 — `relatedTo()` was appending
      other categories. Aligned to `gwill_get_related_posts()`
      (primary category only, cap 3) plus `single.php`'s 2-most-recent
      fallback; verified across all seven articles.
- [x] README gate row + file list, CHANGELOG `[0.4.0]`, `docs/port/10-article-template.md`.
- [x] **Shipped (v0.4.0) 2026-09-23** — `main` `584f421`; staged `pages-dist`
      `c19456b`; Pages `built c19456b`; served article bytes 173,331 with
      `.art-hd`/`h1.art-t`/`.art-sub`/`.art-meta`/TOC dropdown/`.discl mb24`/
      `.share-row`/`data-copy`/`.abio.mt20`/`.article-sidebar` present, 2 related
      cards, and none of the forbidden stubs. Live parity vs
      `https://finance.fitnesslova.qzz.io/` at 390/768/1280: **198 identical
      fields**, every remaining difference content-driven (longer title, no
      `Updated` fragment on this post, longer bio, this post's heading count).

- [ ] **Visible staging notices on non-article pages (found while scanning the
      served bytes of this release).** `contact.astro:33` ships
      *"Form lands with the server leg"*, `newsletter.astro:10` ships
      *"Launching soon — no list yet"*, `newsletter-thanks.astro:8` ships
      *"You are early"* — the class of placeholder King's law forbids on a live
      page. Not touched in v0.4.0 because it is a different surface and the fix
      is a decision, not a sweep: either a real backend lands, or the notice
      goes and the control becomes a no-op that must NOT look like a working
      form. (`404.astro`'s "404" and `search.astro`'s "No matches" are legit
      states, not notices.)
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

- [x] **M-BASE-LAYER** — CLOSED in v0.3.4. All nine rules of the theme's
      `RESET / BASE` section (`style.css:170-199`) are now installed in
      `base.css` — the `*` reset, `html` scroll behaviour, `body`, the replaced-
      element `max-width` set, `img { height: auto; display: block }`,
      `a { text-decoration: none }`, control font inheritance, the heading
      letter-spacing, and the visually-hidden utility. Installed in one pass
      rather than "page-by-page with measurement" because the risk that argument
      was protecting against was measured away: A/B over 15 page/width combos
      gave 0 layout differences. See the v0.3.4 DONE section.

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
