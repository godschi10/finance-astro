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