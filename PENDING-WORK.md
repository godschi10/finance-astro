## ACTIVE — OG IMAGE PREMIUM MISSION, King's order 2026-10-04
King (screenshot): "the og image is looking like shit… use our logo and all that
and design a premium OG image… all the pictures and brand files are made SVG
logo."
- [x] **AUDIT OG SURFACE** — @manager-opencode: current OG = ONE static PNG
      (public/images/gwill-social-share.png, 1200×675, all-cream #f7f6f2 with
      the mono wordmark + gold rule + "finance.gwillchijioke.com" footer).
      Every page shares it; articles override with their 300x169 category art
      strip (small, low-res, no logo/title treatment). Brand assets on disk:
      public/icons/icon.svg (the ONLY SVG — a ₦ glyph on #0d0b08 rounded square).
      No OG generator, no og-image endpoint, no per-route OG design.
      Rasteriser available on box: rsvg-convert + DejaVu (JetBrains woff2 lives
      in /tmp + hermes app, not the repo).
- [ ] **DESIGN + BUILD** — premium OG card(s): SVG source in repo (brand
      tokens: gold #b45309/#f59e0b, ink #0d0b08, cream #f7f6f2, green #15803d),
      rasterised to PNG 1200×630 (OG spec) by a build script; logo extracted
      from the site's own wordmark/icon.svg treatment; per-route variants
      (brand / tool / article) with title + description typeset in mono, gold
      rule, dark premium background. King's note: brand files are SVG.
- [ ] **VERIFY + SHIP** — served-byte probe per route (og:image 200, 1200×630,
      file size sane) + QA renders the actual shared card in a 1200×630
      context and screenshots it.

## SHIPPED — 2026-10-04 · REAL LOGO ON EVERY CARD + CONTROL FIXES — v0.7.19
King rejected v0.7.18: *"These are not my logos you pissing me off… og image
doesn't have a single place with my finance blog actual logo. U suck"* + *"And
why is the check box in the calculator unstyled… that means there are plenty
unstyled elements u added to calculators and God knows where else."*
- [x] **The logo mistake, owned.** I invented a `#`-in-a-plate mark. His real
      logo was IN THE REPO the whole time — `Layout.astro:552` `.logo` →
      `<span class="n">₦</span><span class="nm">gwillchijioke</span>` with
      `header.css:70-92` (800/-0.03em, `.n` gold + 14px glow, gold→green 1.5px
      underline @.65). I never read it. Now every one of the 34 cards carries
      that exact lockup: ₦ typeset in the bake face (proved non-tofu: 2 stems
      top+bottom, 62% mid-ink vs tofu's 1 run/100%/8%), wordmark at logo scale,
      gold→green gradient underline dropped 0.27em to clear the descenders.
      Plate/`#` deleted from source entirely.
- [x] **My own sweep found the other two unstyled things** (the King was right
      about "God knows where else"): `.tool-h2` — used in **11 places across 8
      pages**, styled NOWHERE → now 22px/800/-0.02em in the tool vocabulary;
      `.tool-faq` — dead class, proven no-op, removed. The 80+ unclassed
      `<input type=number>` are NOT defects (they sit inside `.field` wrappers
      styled by descendant selectors) — proven, not assumed.
- [x] **The checkbox → a real in-theme control**: `.tgl` gold switch (hidden
      native input + 40×22 track + 16px ink thumb), 44px hit target, gold
      `:focus-visible` ring in both themes, id + checked default untouched so
      the page script is unchanged. Verified: real Tab reaches it, Space flips
      it, no double-toggle, and it reads as part of the card in 4 screenshots.
- [x] **One card defect the builder flagged and I sent back**: a wrong glyph
      swap printed "on a **N**50k Salary" — swap removed (proved the bake face
      HAS U+20A6), real ₦ now renders. Its own false premise about `→` was
      self-corrected by testing; the swap stays as a copy choice, relabelled.
- Proofs: build 79 pages; 6/6 (article 147/147, vectors 95/95); all 34 cards
      re-baked, **0 tofu** across 74 distinct codepoints (exhaustive test) and
      0 hollow-box glyphs (four-side-closure scan, validated against a real
      tofu control); brand gold 4,235px; 1 of 34 cards changed by the glyph fix.

## SHIPPED — 2026-10-04 · PREMIUM OG CARDS — v0.7.18
King: *"the og image is looking like shit… use our logo and all that and design
a premium OG image… all the pictures and brand files are made SVG logo."*
- [x] **Root cause found first (@manager + @designer, verified):** the old card
      was 1200×**675** with a clipped "Dollar to Nai…" screenshot of one
      calculator — not a brand card — and the wrong height was baked into
      `og:image:height`. JetBrains Mono ships NO U+20A6 (₦) → the mark must be
      pure SVG rects. 7 art files cover 15 articles and each carries a stale
      `₦ gwillchijioke` wordmark baked in → article art NOT overlaid (card is
      pure brand; the category chip carries the colour).
- [x] **@designer shipped a coordinate contract** (og-card-design-spec.md, 589
      lines + 3 rendered proofs): dark ink direction (gold-on-ink 9.15:1 vs
      3.4:1 on cream — cream is the category default and vanishes in a
      WhatsApp bubble), 1200×630, footer baseline y=524 (43px clear of the
      Twitter bottom-10% crop), mark plate #131210 rx12 + 1px hairline + 4-rect
      ₦ glyph scaled 168px brand / 64px others, dot-grid + gold glow ported
      from home.css, 88×4 gold rule.
- [x] **@builder built the generator** (scripts/og-card.mjs + scripts/gen-og.mjs,
      first step of `npm run build`): 34 cards, idempotent, rsvg stdin,
      generated dir gitignored. **Brand card is byte-identical to the designer's
      proof.** Tool/article cards structurally identical (chip copy follows the
      spec's colour rules; `LIVE RATES` tick only on genuinely live cards).
- [x] **Wiring (@builder)**: ToolShell now forwards ogImage (26 tool pages were
      silently falling back to the brand card); `[slug]` points at its article
      card; BRAND_SHARE height 675→630; orphaned gwill-social-share.png deleted
      after a zero-reference gate; /search/ corpus dedupe from arch Leg A.
- [x] **Proofs:** build 79 pages; 6/6 (article 147/147, vectors 95/95); meta
      census reconciles exactly (37 brand + 27 tool + 15 article = 79 pages,
      one og:image each, zero gwill-social-share refs); 34/34 PNGs exist in
      dist; PIL on 5 cards: 1200×630, gold present, **0 bright pixels in the
      bottom 10%**, left margin 80. King's original complaint reproduced and
      fixed at source.

## SHIPPED — 2026-10-04 · ARCH FIXES — v0.7.17