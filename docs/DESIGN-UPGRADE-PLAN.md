# Finance Astro — Premium Design-Upgrade Plan

**Scope:** elevate the truth theme (`gwill-finance-theme` v1.13.39, JetBrains Mono, cream `#f7f6f2` / warm-black `#0d0b08`, gold `#b45309`/`#f59e0b`, green `#15803d`) into a premium static port. Same design language, sharper. No new brand, no new palette, no gradients/glassmorphism/twin-card rows.
**Law:** PREMIUM, never AI-slop. Confident type rhythm, deliberate whitespace, hairline rules, **one bespoke signature detail per surface**, honest flat theme colors. Phone + tablet always. Striking, never quiet. A lone block is a blob — every surface needs hierarchy.
**Ranked by visual impact, phone-first.** P0 ships first.

---

## Global type + spacing contract (applies to every surface)

Current voice: single-family JetBrains Mono everywhere, tight tracking on headings (`-0.03em` to `-0.045em`), small uppercase eyebrow labels (`10–11px`, `0.14–0.18em`), body `16px/1.8` (17px/1.9 desktop), hairline borders (`--border #e4e2dc` / `--border-dim #eeece7`), radii 6/10/16/24.

Elevation moves (do once, inherit everywhere):
- **Display scale (locked):** hero H1 `clamp(2.375rem, 5.5vw, 3.875rem)` / `line-height 1.0` / `tracking -0.045em`; article H1 `clamp(1.75rem, 3.8vw, 2.5rem)` / `1.08` / `-0.035em`; section titles stay `10–11px uppercase 0.18em` (`.stitle` pattern — do not enlarge, they are labels not headlines); card titles `0.9375rem/1.35/-0.02em`; body `1rem/1.8`, desktop lede `1.1875rem/1.85`.
- **Headline tracking rule:** display text always `-3%` to `-4.5%`; body never tighter than `-1%`.
- **Rhythm:** section gap phone `56px`, tablet `64px`, desktop `72px`. Inside cards: `12px` label→title, `8px` title→excerpt, `12px` hairline→meta. No `margin: 0 0 18px` soup — every stack uses one spacing token per level.
- **Hairlines:** 1px `var(--border-dim)` dividers between stacked blocks; 3px gold (`var(--gold)`) reserved for exactly one accent per surface (quote bar, winner-row bar, TOC bar, active-tab underline).
- **Signature-budget rule:** one bespoke detail per surface, listed below. A second decorative element on the same surface is slop — cut it.
- **NOT to change:** JetBrains Mono only (no second font, no Google Fonts); token hex values; dark-mode warm blacks (`#0d0b08` not pure black); gold-on-dark `#f59e0b` vs gold-on-light `#b45309` split (a11y-tuned, do not unify); `contentSize 1200px`; `theme-color #0d0b08`.

---

## P0-1 · Hero (highest impact)

**Current voice:** dark `#0d0b08` slab, dotted-grid `::before` (28px, 3.5% white), gold radial glow top-right, SVG-noise `.hero-grain`, pill tag (`10px uppercase 0.14em`, gold on 10% wash), two-line H1 (gold line 1 / cream line 2, 38–62px, `-0.045em`), 15px light sub, gold solid + ghost CTAs, italic "Topics:" + 6 category chips. Confident already; the weakness is flatness — tag, H1, sub, CTAs, chips all sit at one depth.

**Elevation moves:**
- **Type:** H1 `clamp(2.375rem, 5.5vw, 3.875rem)`, keep the two-line gold/cream split (it IS the brand). Tag `10px/0.16em` with `6px 14px` padding. Sub `0.9375rem/1.75`, max-width `29rem` (460px — keep). Phone: H1 floor `2.375rem` (38px), sub `0.9375rem`, CTAs full-width stacked (see below).
- **Spacing:** hero padding phone `56px 20px 52px`, tablet `64px 32px 60px`, desktop `72px 48px 68px` (theme's 72/68 stands). Tag→H1 `22px`, H1→sub `16px`, sub→CTAs `28px`, CTAs→chips `36px`. Chips row gets its own hairline: `1px rgba(245,158,11,0.18)` top border, `20px` padding-top — separates navigation from message.
- **Rules:** hairline gold divider above topic chips (above). Nothing else — the dark slab must stay clean.
- **Signature detail (one): "the ledger rule" — a 48px × 3px solid gold bar between the sub and the CTAs** (left-aligned, `var(--gold-b)` on dark). It is the only new geometry in the hero: a typesetter's rule that says "money, accounted for." Reuse the same 48×3 bar (cream on light) as the section anchor on tools/legal heroes for cross-page rhyme. Do NOT animate it.
- **Chips:** keep `.db` pill language, bump to `10px/0.1em`, `5px 12px`, 44px min touch target on phone via padding (not fixed height). Keep category tint washes (gold/green/purple/slate) — honest flat tints, no gradients.
- **CTAs:** primary gold solid `#f59e0b` on dark, 13px/800, `12px 24px`, radius 6px. Ghost keeps 1px border. Phone: stack full-width, 48px min-height each, 12px gap. Hover lift `translateY(-1px)` only — no glow, no shadow bloom.

**NOT to change:** dotted grid + grain + corner glow stack (brand texture, keep all three but never add a fourth); H1 copy split and wording ("Nigerian money. / Explained."); gold/cream line colors; ticker-above-hero order.

## P0-2 · Article cards + featured block (homepage + archives)

**Current voice:** `.ac` surface cards (1px border, 10px radius, 16/9 art tile with category pastel gradient + emoji, badge, 14px title, 11px excerpt, hairline meta footer with date/read-time). `.feat` 2-col grid (art left, 32/36px body right, 22px title, 32-word excerpt). Hover: `-3px` lift + gold border + gold shadow. Category art: six pastel linear-gradient tiles (`i-sav/i-inv/i-cry/i-ban/i-rem/i-dol`) + emoji. Weakness: art tiles are the loudest thing on the page but say nothing (pastel wash + emoji), and grid cards + featured + tool cards all share one visual weight — no hierarchy.

**Elevation moves:**
- **Type:** card title `0.9375rem/1.35/-0.02em` (keep 14–15px, do NOT enlarge — density is the grid's job). Excerpt `0.6875rem–0.75rem/1.65`, clamp 2 lines phone / 3 lines desktop. Meta `10px/300` with 3px dot separators (keep). Featured title `1.375rem/1.2/-0.03em` (22px — keep), excerpt `0.8125rem/1.75`.
- **Spacing:** card body `16px 20px 20px` (keep); grid gap phone `16px` single column, tablet 2-col `20px`, desktop 3-col `24px`. Featured body `32px 36px` desktop, `24px 20px` phone, stacked (art on top, 16/9, min-height 200px phone).
- **Rules:** keep the meta hairline (`border-top border-dim`, `12px` padding-top). Add a 3px gold left bar on the **featured card only** (`border-left: 3px solid var(--gold-b)` on `.feat-body`) — featured earns the accent, grid cards don't. That single difference creates the hierarchy.
- **Signature detail (one): "the stamp corner" — replace the emoji-on-pastel art tile with a flat category-ink tile: solid `#0d0b08` tile, giant `₦`-style category glyph (keep each category's emoji, rendered at 40px card / 56px featured, warm-cream `#f0ede6`), plus a 10px uppercase category wordmark bottom-left in the category's tint color.** Flat ink, not pastel wash. Thumbnails (real photos) always win when present — the ink tile is the fallback, same slot. Kill the `::after` white-sheen gradient on `.ac-img`/`.feat-img` (generic gloss = slop).
- **Hover:** keep lift + gold border, drop the gold box-shadow to `sh-sm` weight (current `sh-gold` blooms on dense grids). Title color shifts to gold on hover — one signal, not two.
- **Phone:** single column, art 16/9 fixed, title 15px, full-bleed meta row (date · read-time · author, wrap allowed). Never 2-col cards on phone.

**NOT to change:** badge system (`bg/bgn/bpu/bsl/brd` + uppercase 9px pills); fully-clickable-card stretched-link pattern; LCP eager+fetchpriority on featured image; 32-word excerpt length; category→badge/art/emoji mapping (bake into data file, same six).

## P0-3 · Calculators (the heart — 17 tools + 8 amount pages)

**Current voice:** `.fx-card` surface buckets (10px radius, `sh-md`), mono 16px inputs on `surface-2` with gold focus ring, circular gold swap button (rotates 180° on hover), dark `#0d0b08` result panel with 34px gold mono figure, `.st-table` comparison tables (9px uppercase headers, right-aligned mono amounts, gold-muted winner row with 3px left bar + BEST tag), `.sr-chart` pure-CSS bars, old-vs-new `.st-compare` card, verified-date stamps. Strongest system in the theme; weakness is sameness — every tool reads as one long form, results don't celebrate, and amount pages risk thin-content flags.

**Elevation moves:**
- **Type:** result figure `clamp(1.9rem, 6vw, 3rem)/1.1/-0.03em` mono 800 gold (theme's `.fxap-figure` scale — adopt everywhere, not just amount pages). Input `1rem` mono. Table `0.75rem`, headers `9px/0.14em uppercase`. Section H2 inside tools `1.25rem/800/-0.02em` desktop, `1.125rem` phone.
- **Spacing:** tool hero (title + lede + verified stamp) `40px 0 28px` phone / `48px 0 32px` desktop. Input grid gap `14px`, wrap to single column under 480px. Result panel `18px` padding, `18px` margin-top. Verified-stamp line sits directly under the H1 (`11px`, dim, with gold `◆` marker) — never in the footer.
- **Rules:** hairline `border-dim` between input group / result / table / FAQ blocks. Winner row keeps 3px gold left bar + `BEST` tag (already the house language — extend to every comparator table, don't redesign).
- **Signature detail (one): "the receipt" — the result panel is styled as a printed receipt: dark `#0d0b08` slab, mono gold figure, and a dashed 1px `rgba(245,158,11,0.35)` divider between the figure and the rate-note line, with the verified-stamp as the "receipt footer" (`10px uppercase 0.12em`, dim).** Dashed divider appears NOWHERE else on the site — it belongs to money-out. Amount pages get the same receipt with the conversion equation (`$100 = ₦148,200`) as the figure line.
- **Inputs:** 48px min-height phone, 12px/14px padding, 10px radius, 1px border → 2px gold outline on focus (keep). Labels `11px/700/0.08em uppercase` dim above each field (keep). Swap button stays circular gold-outline, 44px.
- **Amount pages (SEO cluster):** each of the 8 keeps unique H1 (`$100 → ₦` phrasing), unique 2–3 FAQ entries, unique intro paragraph, canonical to itself. Shared receipt component, per-page copy. No templated sameness.
- **Phone:** inputs stack full-width; result figure floors at `1.9rem`; tables break full-bleed edge-to-edge (theme's `.con > .st-table-wrap` negative-margin pattern — keep); bars chart collapses to label-above/bar+rate row (theme's 480px pattern — keep).

**NOT to change:** the shared-engine math (TS port must be numerically identical — NTA-2026 bands + old-vs-new is highest-stakes); server-rendered real numbers for crawlers (SSG pre-render + client refresh); maintained-data stamps (transfer fees, savings rates verified 2026-09-01, parallel spread) as single-edit dated data files; `₦1340` fallback semantics + "estimated" labeling on parallel-market numbers.

## P1-4 · Chrome: ticker + header + search + theme pill

**Current voice:** 36px warm-black ticker (marquee FX pairs, pause-on-hover, drag-scrub), sticky 64px header (wordmark `₦` gold-glow + `gwillchijioke` cream, primary nav, theme pill, search icon, gold Newsletter CTA), mobile bar + drawer (`.mno` with gold-diamond submenu markers, CTA bottom), spotlight search panel (mono input, `₦` glyph, kbd footer). Tight and branded; weakness is header flatness — nav links and CTA compete at one weight.

**Elevation moves:**
- **Type:** wordmark `1rem/800/-0.03em` (keep), nav links `13px/700`, ticker `11px mono`. Drawer links `15px/700`, section labels `10px uppercase 0.14em`.
- **Spacing:** header `64px` desktop / `56px` phone (keep). Ticker `36px` (keep). Drawer item padding `14px 20px` (44px+ targets).
- **Rules:** 1px `var(--dark-b)` bottom border on ticker (keep); add 1px gold-tinted hairline (`rgba(245,158,11,0.22)`) under the sticky header — the header is dark-on-cream boundary, it earns the one gold rule in chrome.
- **Signature detail (one): "the live dot" — a 6px solid green (`var(--green)`) pulsing dot (2s, respects `prefers-reduced-motion`) before the first ticker item, labeled "LIVE" in `9px uppercase 0.14em` gold.** Says rates are fresh without a word of copy. Appears once (first item only), never per-item.
- **Search panel:** keep spotlight structure; input 48px phone; results with `<mark>` gold-highlight (keep); kbd footer desktop-only (hide phone).

**NOT to change:** ticker data + 60s cache + async refresh behavior; darkmode pre-paint script (no flash); skip-link; drawer CTA + ad-slot order; `₦` mark + full `gwillchijioke` wordmark (never shortened).

## P1-5 · Stats strip

**Current voice:** gold-tinted band (`gold-muted` bg, gold borders top/bottom), 4× `.si` cells divided by gold hairlines, 24px/800 gold numbers, 10px uppercase labels. Honest but flat — four equal cells read as a spec sheet.

**Elevation moves:**
- **Type:** numbers `1.5rem/800/-0.04em` mono (24px — keep scale, switch to mono for ledger voice), labels `10px/700/0.14em uppercase` (keep).
- **Spacing:** cell padding phone `16px 12px`, desktop `20px 32px`. Phone: 2×2 grid (not 4-across, not stacked 1×4) with hairline dividers on both axes.
- **Rules:** keep gold hairlines between cells; add the 48×3 gold ledger bar? No — budget spent on hero. The strip's distinction is rhythm, not ornament.
- **Signature detail (one): "the odometer" — numbers render in tabular figures (`font-variant-numeric: tabular-nums`) and count up once on scroll-into-view (IntersectionObserver, 800ms, reduced-motion = static).** The strip becomes the site's one kinetic moment. Static SSG values first (crawlers see real numbers), animation enhances only.
- **Fourth cell (`₦ 0` free):** set in green (`var(--green)` light / `#22c55e` dark) instead of gold — the punchline cell breaks the row's color, drawing the eye down-page.

**NOT to change:** the four stats + labels (guides / apps-reviewed / current-year / ₦0-free) and ACF-baked defaults; gold-muted band (do not restyle as dark slab — the cream→dark→cream page rhythm needs this light beat after the dark hero).

## P1-6 · Tables + figures (article body + tools)

**Current voice:** `.wp-block-table`/`.st-table` bordered rounded wrappers, `surface-2` uppercase headers, row hover gold wash, gold square scrollbars, auto-detected winner rows (gold tint + 3px bar + BEST), ✓/✗/★ chips with tinted pills, mobile full-bleed break-out. Figures: rounded images, centered 12px captions. Solid; weakness is header timidity and caption anonymity.

**Elevation moves:**
- **Type:** table headers `9px/700/0.14em uppercase` dim (keep); body `0.75rem`; amounts right-aligned mono 700. Captions `0.75rem/300` dim with a gold `◆ 6px` marker prefix + `10px` top margin.
- **Spacing:** table wrapper radius 10px desktop, 0 phone (full-bleed). Cell padding `12px 14px` (keep). Figure margin `18px 0` phone / `26px 0` desktop.
- **Rules:** winner-row 3px gold bar (keep, universal blog+tools). Figures get a 1px `border-dim` frame + 10px radius (screenshots/charts read as artifacts, not floats).
- **Signature detail (one): "the figure ledger" — every figure/table gets a numbered ledger caption: `FIG. 01 — <caption>` / `TABLE 02 — <caption>`, mono `10px/700/0.12em uppercase`, dim with gold number.** Auto-numbered per article (CSS counters or build-time). Turns scattered images into a documented record — the finance-voice signature.
- **Phone:** keep edge-to-edge table break-out + momentum scroll; sticky first column on 3+ column comparison tables (position sticky, surface bg).

**NOT to change:** ✓/✗/★ chip semantics + auto-detection JS; BEST tag format; gold scrollbar language (desktop) / hidden (Fenix touch); row-hover wash.

## P2-7 · Legal pages (privacy / disclaimer / affiliates)

**Current voice:** dark hero + sticky TOC + gold-dot blocks (post v1.0.115 redesign). Correct structure, quiet styling — legal reads as obligation, not brand.

**Elevation moves:**
- **Type:** legal H1 `clamp(1.75rem, 4vw, 2.5rem)/1.05/-0.035em` cream with gold keyword (match article H1, not marketing display). Body `1rem/1.8`. TOC links `13px`, active `700` gold with 2px gold bar (keep `.toc-bar` language).
- **Spacing:** dark hero `56px 48px` desktop / `40px 20px` phone; content max-width `720px`; clause blocks separated by `28px` + hairline (not whitespace alone — legal needs visible joints).
- **Rules:** each clause H2 gets the 48×3 gold ledger bar above it (rhyme with hero rule) + hairline below the clause. TOC card keeps square 220px scroll box desktop / dropdown phone (keep mechanics).
- **Signature detail (one): "the seal" — a mono `10px uppercase 0.12em` stamp line under the legal hero H1: `LAST REVIEWED — <DATE> · <VERSION>`, gold-bordered pill on dark.** Legal authority comes from dates. Every legal page carries it; bake the date into frontmatter, visible in UI.
- **Affiliate disclosure box (article surface):** keep gold-muted box, tighten to `14px/1.7`, 10px radius, `14px 18px` padding, 3px gold left bar. One line on cards/feeds, full box on singles (keep).

**NOT to change:** sticky TOC mechanics (desktop square scroll + mobile dropdown + gold scrollbars + idle-fade JS); dark-hero breadcrumb treatment; the three routes + canonical URLs.

## P2-8 · Footer (+ newsletter band)

**Current voice:** dark 4-col grid (brand + socials + push-bell + Google-News + install / Articles / Apps / Network) + footer leaderboard ad + bottom bar (© host, "Designed & built by G-will Chijioke", legal links, back-to-top) + separate compact `.mfooter` (4-mini-col grid). Newsletter `.nl-s`: dark rounded-24 band, dot-grid + glow, 20px H2, meta row (Free/No-spam/Unsubscribe), Brevo single-field form with 46px gold submit. Weakness: footer columns are link lists with no voice; newsletter band is handsome but the form and copy sit side-by-side even when the copy is thin.

**Elevation moves:**
- **Type:** column titles `10px/700/0.18em uppercase` dim (match `.stitle` — unify, currently `.fct` unspecified). Links `13px/400`, `10px` vertical rhythm. Newsletter H2 `1.25rem/800/-0.03em` cream. Bottom bar `11px` dim.
- **Spacing:** footer padding `48px 48px 24px` desktop / `40px 20px 20px` phone (keep). Column gap `32px`. Newsletter band `36px 44px` desktop / `28px 20px` phone, stacked (copy above form) under 768px.
- **Rules:** 1px `var(--dark-b)` hairline above bottom bar (keep/verify); column-title underline? No — one rule budget already spent. Keep footer clean.
- **Signature detail (one): "the colophon line" — bottom bar gains a third element between credit and legal links: a mono `10px` dim line reading `SET IN JETBRAINS MONO · ₦ RATES LIVE` (static text, no JS).** A print-colophon nod that names the typeface and the live-data promise. Distinctive, zero-cost, uncopyable by templates.
- **Newsletter:** keep dark band + dot texture; form input 46px to match submit exactly (theme rule — keep); meta row keeps ✓ separators. Phone: input + button stack full-width (button below input, not beside — 46px each).
- **Phone footer:** keep `.mfooter` structure; socials row 44px targets; follow CTAs full-width; legal links wrap with `·` separators (keep).

**NOT to change:** 4-column IA (brand/Articles/Apps/Network) + mobile 4-mini-col; push-bell + Google-News + install-app row (behavior-rich, keep); consent banner + sticky ad bar mechanics (glass cards are functional overlays, exempt from the no-glass rule — do not "flatten" them); "Designed & built by G-will Chijioke" credit; copyright-host auto behavior.

---

## Phone + tablet contract (every surface)

- **Breakpoints:** phone ≤767px (single column, 20px gutters, full-width CTAs/inputs, 44–48px targets), tablet 768–1023px (2-col grids, 32px gutters, 728×90 ad logic), desktop ≥1024px (3-col, 1200px container).
- **Touch:** all interactive elements ≥44px; pill rows scroll horizontally with edge fades (keep `.cp-strip-wrap` mechanics); tables scroll in-box, never blow page width (`overflow-x: clip` on html — keep).
- **Type floors:** no display text under `2rem` phone hero / `1.75rem` article H1; no UI text under `10px`; no body under `15px` phone.
- **Dark mode:** every elevation move ships both themes; gold flips `#b45309`↔`#f59e0b`, surfaces flip cream↔warm-black per token table. Verify phone + dark together (worst-case combo).
- **Reduced motion:** odometer, marquee, lightbox, consent/sticky entrances all gate on `prefers-reduced-motion` (keep theme guards, add odometer).

## Explicit anti-slop bans

No linear-gradient washes (except the two sanctioned flat-tint category chips and the existing dot-grid/noise textures); no glassmorphism on content surfaces (overlays exempt); no twin-card rows (feature grids are 3-up or editorial 2-col, never 1+1 lookalikes); no globe/orb/curve SVGs; no "Everything you need" generic H2s; no emoji-as-icon outside category tiles; no drop shadows heavier than `sh-sm` on grids; no second font; no purple/blue accent creep beyond the crypto badge tint.

## Build order (visual impact rank)

1. Hero (P0-1) — first paint, brand statement.
2. Cards + featured (P0-2) — homepage density is the product.
3. Calculators receipt (P0-3) — traffic + revenue core; ship converter + salary-tax first, then the 15, then 8 amount pages.
4. Chrome (P1-4) — frames everything above.
5. Stats strip (P1-5) — one-day lift with odometer.
6. Tables/figures ledger (P1-6) — article authority.
7. Legal seal (P2-7) — trust pages.
8. Footer colophon + newsletter stack (P2-8) — last, lowest risk.
