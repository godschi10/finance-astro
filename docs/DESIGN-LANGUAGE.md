# DESIGN-LANGUAGE.md — Finance Astro · Sitewide Contract
Version: **1.0 STAMPED** · 2026-09-30 · **STATUS: King approved all §9 recommendations — rungs may now execute. src/ changes arrive per-rung, additive only, gates green each time.**
Role: the sitewide constitution. `docs/DESIGN-UPGRADE-PLAN.md` (per-surface rungs P0-1…P2-8) executes *inside* these laws; where they conflict, this file wins only after the King stamps it.
Evidence base: `~/work/research-notes/finance-design-research-2026-09-30.md` (NN/g, Wise/XE live anatomy, Coinbase/Stripe/Mastercard/Linear/Revolut/Kraken specs, anti-slop canon).

═══════════════════════════════════════════════════════════
## 0. BRAND COMMITMENTS (immutable identity)
═══════════════════════════════════════════════════════════
C1. **One family: JetBrains Mono.** Every word and number on the site. This is the signature — the tell of a ledger, not a template. Anti-slop research warns against *default Inter-everything*; a disciplined mono-everything site is the opposite: rare, bespoke, owned. (OPEN Q1 for the King, §9.)
C2. **Warm canvas, never white-black.** Light = paper `#f7f6f2` (Mastercard's "never pure white" family); dark = warm-black ladder `#0d0b08 → #131210 → #171512` (true deep, never grey-not-deep). Gold flips `#b45309` (on light) ↔ `#f59e0b` (on dark) for a11y — never unify.
C3. **One accent.** Gold holds the action role; green/red/purple exist ONLY as semantic text/badge tints, never as competing brand colors. Filled gold CTA appears at most ONCE per screen (above the fold priority).
C4. **Honest flat color.** The two sanctioned textures (dot-grid, SVG grain) and flat category tints stay; no new gradient washes, no glassmorphism on content surfaces (functional overlays exempt), no glow blooms.
C5. **Zero frameworks.** Vanilla + Astro islands only. 90+ mobile Lighthouse ceiling. Light + dark are both first-class in every change.
C6. **Striking, never quiet.** Bold rhythm, deliberate whitespace, one bespoke signature detail per surface. A lone block is a blob: every surface carries hierarchy.

═══════════════════════════════════════════════════════════
## 1. THE NUMBER LAW (the profession's loudest signal)
═══════════════════════════════════════════════════════════
N1. **Tabular figures everywhere money lives.** `font-variant-numeric: tabular-nums` on results, rates, tickers, tables, stat strips. Mono already locks width; tabular-nums makes the promise explicit and future-proof.
N2. **The money feast.** The result figure is the single largest element in its fold: `clamp(1.9rem, 6vw, 3rem)/1.1/-0.03em`, mono 800, gold. Borrowed: Wise hero displays (weight 900 doctrine), XE headline conversion.
N3. **Symbol quieter than digits.** ₦/$ rendered dim (`--text-dim` / 60% alpha gold) beside full-weight figures. The number is the hero; the unit is the caption.
N4. **Tables:** numeric columns right-aligned, decimal points stacked; money cells mono 700 at `0.75rem`+; headers `9–10px/700/0.14em uppercase` dim. Borrowed: Coinbase mono-every-number, uxpatterns currency-input.
N5. **Naira conventions:** ₦ prefix before amount; thousands commas; consumer results 0 decimals; exchange RATES print up to 4dp (precision is the product); `k/m` shorthand allowed on chart axes/prose only, never in result figures. Kobo exists but retail copy omits it.
N6. **Every dynamic figure carries its birth certificate:** source + timestamp in the same visual breath — `mid-market · 21:03 WAT · open.er-api.com`. Stale-and-unstamped reads as fraud; stamped reads as institution. Borrowed: XE rate lines, fuselab trust doctrine.

═══════════════════════════════════════════════════════════
## 2. TYPOGRAPHY SPEC
═══════════════════════════════════════════════════════════
T1. Display lock (already in plan, ratified here): hero H1 `clamp(2.375rem,5.5vw,3.875rem)/1.0/-0.045em`; article H1 `clamp(1.75rem,3.8vw,2.5rem)/1.08/-0.035em`; card titles `0.9375rem/1.35/-0.02em`.
T2. Tracking law: display text −3%…−4.5% (King's arsenal law −3…−7%, lower end — mono takes less tightening); body never tighter than −1%; eyebrows/labels `+0.12…0.18em` uppercase `10–11px/700`.
T3. Reading copy stays **16px/1.8 phone, 17px/1.9 desktop** — the v0.6.8 cramp repair is now brand law. Upgrades may only add breathing room, never take it.
T4. Section titles (`.stitle` pattern) stay `10–11px uppercase 0.18em` — labels, not headlines. Do not enlarge.

═══════════════════════════════════════════════════════════
## 3. SURFACE & DEPTH VOCABULARY
═══════════════════════════════════════════════════════════
R1. Radius ladder is CLOSED: `--r-sm 6` (inputs, chips) · `--r-md 10` (cards, tables) · `--r-lg 16` (inset panels) · `--r-xl 24` (bands, hero slabs) · `--pill 100` (CTAs, badges). Any value outside this set is slop (Mastercard: "in-between radii look generic").
D1. Default elevation = **1px hairline border + tint**, no shadow (Stripe/Coinbase doctrine). `--sh-sm/--sh-md` exist for cards that float over dense grids; `--sh-gold` halo is reserved for ONE thing per surface or hover states only.
D2. Hairline dividers (`--border-dim`) do the structural work between stacked blocks. The single 3px gold bar remains rationed: exactly one per surface (quote bar, winner row, TOC-active, ledger rule).
C7. **Ledger rule 48×3** is the cross-page rhyme (hero → legal clause → section anchor). Receipt dashed divider belongs ONLY to money-out panels. (Both from plan; locked.)

═══════════════════════════════════════════════════════════
## 4. CALCULATOR ANATOMY (NN/g's 12 → our binding 8)
═══════════════════════════════════════════════════════════
K1. Essential inputs only; text input over slider where precision matters; all optional inputs visibly optional.
K2. Live results while typing — never submit-and-wait, never register-wall.
K3. Input rationale: one de-emphasized `12px` line where a field asks something non-obvious (why age? why dependents?) — NN/g §7.
K4. In-field anchors: `e.g. ₦450,000` as placeholder/assistive text, not instruction walls beside the tool.
K5. Default honesty: every calculator's prefilled values must be realistic Nigerian ranges — misleading defaults are trust poison (NN/g §10). **AUDIT FLAG: verify all 16 tools' defaults at build time, before any visual work.**
K6. Restart affordance: visible reset that returns to honest defaults; tweak-any-input without re-entering everything (NN/g §8). **AUDIT FLAG: confirm reset exists on all 16.**
K7. Contextualize output: interpret the result (progress ring/bar for goal-based tools; plain verdict line for tax tools) + "How we calculate this" methodology disclosure — no competitor in our cluster does §7's transparency well; it is our trust moat.
K8. No AI-sounding language anywhere in results or labels.

═══════════════════════════════════════════════════════════
## 5. CONVERTER / AMOUNT-PAGE COMPOSITION (Wise+XE proven order)
═══════════════════════════════════════════════════════════
Sequence for the 16 amount pages + converter:
① H1 named for the query → ② amount + swap → ③ HERO RESULT (N2) → ④ rate line w/ source+timestamp (N6) → ⑤ two-direction rates ladder (1→10,000; both Wise and XE print it — we currently show neighbours only; DECISION D1) → ⑥ stats band 7/30/90d high/low/avg (needs history data; DECISION D2 — may be phase 2) → ⑦ chart/alert CTA (static SVG sparkline from build-time snapshot only — DECISION D3) → ⑧ trust band: "mid-market, no mark-up" + informational-only disclaimer → ⑨ FAQ + cross-links.
Receipt panel (plan P0-3) is the vessel for ③④⑧ — the page reads as a bank slip, which is the most professional thing a calculator can look like.

═══════════════════════════════════════════════════════════
## 6. MONEY FORMS MOBILE (input law)
═══════════════════════════════════════════════════════════
F1. **Never `type=number`** (steppers + comma rejection break trust). `type="text" inputmode="decimal"` + parse-tolerant (accept typed ₦ and commas), format on blur.
F2. On-blur format gets a 200ms opacity dip 0.7→1.0 — the tactile "I reformatted your number" cue (uxpatterns currency-input).
F3. Currency symbol inside the field (prefix, `aria-hidden`). The field **declares** its unit — `data-cur="NGN"`, re-declared by the page when the unit follows a `<select>` — and the symbol is rendered from the site's own currency table, never guessed from the label's text (the old `label.indexOf('₦')` test printed ₦ on a dollar amount; a substring test is not a claim about a unit). The **live currency name goes in the visible `<label>`**, not in `aria-label`: an `aria-label` overrides the `<label>` for the accessible name, which breaks WCAG 2.5.3 Label-in-Name the moment the two drift, so the label itself is kept in step and any field whose unit can change also gets a polite `aria-live` status announcing the switch.
F4. Touch: all controls ≥44px (inputs 48px phone). Keyboard-covering-results fix: result panel scrolls above viewport center on focus where feasible; sticky result on long forms (DECISION D4 — per-tool during rungs).
F5. Errors: inline, plain voice, next-step suggested. Empty states carry voice. Never a dead button, never a silent failure.

═══════════════════════════════════════════════════════════
## 7. MOTION BUDGET (vanilla/CSS only, reduced-motion gated)
═══════════════════════════════════════════════════════════
M0. LAW: every motion wrapped in `@media (prefers-reduced-motion: no-preference)`. Motion must communicate STATE CHANGE, never decorate.
M1. Result recompute 200ms dip (§F2). M2. Currency swap crossfade 150ms. M3. Hub cards once-in-view translateY(6px)+fade 0.55s cubic-bezier(.23,1,.32,1) — NOT article prose (fidelity-protected). M4. Stats odometer count-up 800ms once (plan P1-5). M5. Live-dot 2s pulse on ticker (plan P1-4). That's the whole vocabulary — no fade-up-everything.

═══════════════════════════════════════════════════════════
## 8. ANTI-SLOP AUDIT GATE (15 checks — every rung ships through this)
═══════════════════════════════════════════════════════════
□1 no default-palette indigo/violet/purple creep beyond sanctioned crypto badge tint
□2 no gradient-painted headlines; gradients only the two sanctioned flat-tint systems
□3 at least one off-center/asymmetric composition on each major surface; no centered hat-stacks
□4 no three-equal-cards-under-every-hero pattern
□5 type discipline: mono-only per C1, tracking per T2 — no accidental system-font fallback
□6 radius values exclusively from R1 ladder
□7 padding varies by hierarchy; uniform-card-slop padding banned
□8 no emoji as interface icons (category-tile emoji: plan decides per-surface; verify not slop-loud)
□9 zero "Unlock/Elevate/Supercharge/Seamless" class verbs; every hero carries one specific claim
□10 every interactive control has press/focus state; no static-feeling buttons
□11 reduced-motion honored site-wide (grep-gate in check.mjs)
□12 tables look designed (tabular, right-aligned, hairline) — never browser-default
□13 trust artifacts visible: source+timestamp+methodology on dynamic money
□14 error/empty/loading states have voice + next-step
□15 no stock/AI-illustration imagery anywhere
Plus the standing 6-gate battery (css-parse, header, footer, homepage, article fidelity, vectors, accuracy 26/26) stays green per rung.

═══════════════════════════════════════════════════════════
## 9. OPEN DECISIONS FOR THE KING
═══════════════════════════════════════════════════════════
Q1 FONT: keep mono-everything (recommended — it IS the ledger brand, and rare) or add a serif display for heroes only (more editorial, risks the pairing slop line)?
Q2 LADDER: full 1→10,000 rates ladder on amount pages (recommended — Wise/XE both print it, it fills thin pages honestly) or neighbours-only as today?
Q3 HISTORY: 7/30/90-day stats band + sparkline requires a build-time history source (er-api has no history; needs a second feed) — defer to a later batch or build the feed now? (Recommend: defer; add "rate history" once the feed exists — honesty before decoration.)
Q4 STICKY RESULT: long calculators keep result below fold on phone — adopt focus-scroll/sticky result pattern per tool? (Recommend: yes during calculator rung.)
Q5 DARK DEPTH: extend warm-black ladder with a 4th surface tier (`#1c1a15`) for floating panels, matching Linear's surface ladder? (Recommend: yes, token-only, low risk.)

═══════════════════════════════════════════════════════════
## 10. UNTOUCHABLES (damage control)
═══════════════════════════════════════════════════════════
U1. Calculator math layer + build-time FX snapshot single source of truth (v0.6.7) — no design change may alter computed values.
U2. The 6-gate battery — green before and after every rung.
U3. 16px/1.8 reading typography (v0.6.8 repair).
U4. ID-bound calculator scripts: presentation may change, element IDs + behavior may not.
U5. OG brand image, dual-theme parity, zero-framework, 90+ Lighthouse law, no staging notices ever visible.
U6. Fidelity-pinned WP details (footer ftag inline style, header structure) unless the King explicitly overrules the fidelity gate for a rung.

═══════════════════════════════════════════════════════════
## 11. RUNG ORDER (execution sequence after verdict)
═══════════════════════════════════════════════════════════
R0 this doc → KING VERDICT
R1 Number Law tokens (N1 tnum, figure scale, table alignment) — under everything else
R2 Controls (money inputs F1–F3, button family, focus gold 2px)
R3 Converters/amount pages composition (§5) — receipt panel first tool
R4 Calculator anatomy (K3/K5/K6/K7 + per-tool signatures)
R5 Hub + hero (ledger rule, stamp corner per plan)
R6 Chrome: ticker/header/search + live dot
R7 Stats strip odometer
R8 Tables/figures ledger captions
R9 Legal seal + footer colophon
R10 Motion pass + article polish + 404/search/mod-desk
Each rung = ONE surface → 360px+1280px light+dark screenshots → King approval → batch ship.
