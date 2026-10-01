# TRANSFER — OpenCode Manager
**From:** Hermes Manager (GWill Finance Astro) · **To:** OpenCode Manager
**Date:** 2026-10-01 · **Status at handoff:** R6 code-complete + independently verified; NOT committed, NOT shipped.

> King G-will ordered a full transfer of pending work to the OpenCode manager and
> an immediate stop of Hermes' execution. This file is the complete, self-contained
> brief. Work in `/home/opc/work/finance-astro` (branch `main`).

---

## 0. What this project is

A faithful WordPress → Astro port of GWill Finance (`gwillchijioke`), plus an
approved sitewide professional design upgrade executed rung-by-rung per two
stamped docs — read BOTH before touching anything:

- `docs/DESIGN-LANGUAGE.md` (v1.0 STAMPED) — the laws (§11 has the rung order).
- `docs/DESIGN-UPGRADE-PLAN.md` — the per-rung spec (R6 = **P1-4 · Chrome**).

**Standing law (never violate):**
1. Port live WordPress markup/CSS/data/scripts/interactions — never invent layouts.
2. Additive CSS layers only: `numbers.css → controls.css → ladder.css → anatomy.css
   → hub.css → chrome.css`, imported in that order in `src/layouts/Layout.astro`.
   No `!important`. Never rewrite a verbatim WP rule in place unless the plan
   sanctions it (cite the plan line in a comment).
3. **Never edit a gate script to make it pass** (`scripts/check-*.mjs`,
   `vectors-check.mjs`). Adapt the implementation instead.
4. Preserve every calculator element ID and formula. 26/26 accuracy audit must
   pass before shipping anything calculator-adjacent.
5. No dead controls, fake interactions, staging notices, or incomplete calculators.
6. Money forms are REAL backends (comments-api Worker; GitHub Pages admin-ajax 403s
   cross-origin).
7. rsync to Pages ALWAYS `--exclude=.git --exclude=.nojekyll`.
8. Nothing ships on a claim — verify SERVED bytes after deploy.

---

## 1. Shipped state (do not redo)

| Rung | Version | Main commit | Status |
|---|---|---|---|
| R1 Number Law | 0.7.0 | `2a4287b` | live |
| R2 Control Law | 0.7.1 | `9cea4d4` | live |
| R3 Converter + ladder | 0.7.2 | (Pages `82659cd`) | live |
| R4 Calculator anatomy | 0.7.3 | (Pages `2e9aa0e`) | live |
| R5 Hub + Hero | **0.7.4** | main `25fde25` / Pages `f7df03a` | live |

Staging: https://godschi10.github.io/finance-astro/ (currently serves **v0.7.4**).
All five rungs passed build + 6/6 gates + 26/26 accuracy + CDP probes + luminance
screenshots before ship. `PENDING-WORK.md` is the ledger (read it first).

---

## 2. R6 — what is DONE (in working tree, uncommitted)

R6 = plan **§P1-4 · Chrome: ticker + header + search + live dot**.

Files changed (the ONLY two):
- **`src/styles/chrome.css` (NEW)** — entire R6 elevation, additive:
  - Gold hairline under both sticky bars: `.sh/.mh { border-bottom-color:
    rgba(245,158,11,0.22) }` (color-only, geometry untouched).
  - Nav links `font-weight:700` all widths, `font-size:13px` at ≥1024px
    (header.css tablet 11px fit-size stays authoritative 768–1023px).
  - `.ticker { font-family: var(--font-mono) }` (11px rate line already correct).
  - **SIGNATURE — "the live dot"**: `.tl` = 6px `var(--green)` pulsing dot (2s,
    `prefers-reduced-motion` → none) + `LIVE` 9px/0.14em gold, pinned as a flow
    child of `.ticker` BEFORE `.ticker-drag` (outside the marquee ⇒ halves stay
    identical; dark bed masks sliding items).
  - Drawer links `15px`, padding `14px 20px` (min-height 48px kept).
  - Phone: `.gs-input { min-height:48px }`, `.gs-foot { display:none }`
    (kbd markup kept — header gate asserts it exists).
- **`src/layouts/Layout.astro`** — two edits only:
  1. `import "../styles/chrome.css";` after the hub.css import.
  2. `<span class="tl"><span class="tl-dot"></span><span class="tl-tx">LIVE</span></span>`
     inserted between `<nav class="ticker"…>` and `<div class="ticker-drag">`.

**`header.css` is intentionally UNTOUCHED** — its media-query regexes are
header-fidelity gate anchors (tablet 30px strip, 767px show/hide, desktop hide).
Do not edit it.

### Verified already (Hermes' own runs — trust, but re-run if you change anything)
- Build: exit 0, 78 pages.
- `npm run check`: **6/6 gates green** (incl. header fidelity + homepage fidelity).
- CDP probe (`/home/opc/.hermes/cache/scratch/r6-mgr-probe.py`):
  - DOM: exactly 1 `.tl`, 1 dot, text `LIVE`, 12 `.t-pair` (6×2 halves intact).
  - Dot: 6×6px `rgb(21,128,61)`, `animation: tl-pulse 2s`.
  - LIVE label: 9px, 1.26px letter-spacing (0.14em), gold, uppercase.
  - **Seam identity: halfW 897 × 2 ≈ total 1793 — marquee halves equal.**
  - Hairline `1px rgba(245,158,11,0.22)` on `.sh` AND `.mh`, light+dark.
  - Nav `13px/700`; ticker font `JetBrains Mono`; `.gs-foot` visible desktop.
  - Phone: `.tl` 27px in 28px strip, `scrollWidth 390` (no overflow).
  - Drawer: `15px/700, padding 14px 20px, min-height 48px, open:true`.
  - Search phone: input `49px`, foot `display:none`, panel present.
  - Zero JS errors (`B_errs: []`).
- Screenshots in `/home/opc/work/research-notes/`:
  `r6-desk-light.png (92.0)`, `r6-desk-dark.png (22.3)`, `r6-phone-light-top.png (64.1)`,
  `r6-phone-search-light.png (77.0)`, `r6-phone-drawer.png (21.2)`,
  `r6-phone-dark.png (33.4)`.

---

## 3. R6 — what remains (in order)

- [ ] **Accuracy audit: `node scripts/tool-accuracy-audit.mjs` → must print
      `26 pass / 0 fail`.** (Hermes was killed mid-run by the King; result unknown.)
      **Pitfall:** the harness REUSES an existing page tab from
      `http://127.0.0.1:9222/json/list` — if zero tabs are open it dies with
      `HARNESS ERROR: Cannot read properties of undefined (reading
      'webSocketDebuggerUrl')`. Open one blank tab first:
      `curl -s -X PUT -H "Origin: http://127.0.0.1:9222" "http://127.0.0.1:9222/json/new?about:blank"`
      Do NOT run probes concurrently with the audit (tab contention).
- [ ] Release docs: add `## [0.7.5] — 2026-10-01 — Design Language R6: Chrome + live dot`
      to `CHANGELOG.md` (style: see the 0.7.4 entry — include spec bullets +
      "Proof (Manager's runs)" listing gates/audit/probe/shots).
- [ ] `package.json` `"version": "0.7.4"` → `"0.7.5"`.
- [ ] Close the R6 line in `PENDING-WORK.md`; leave R7–R10 pending.
- [ ] `git add -A && git commit` (message style: `feat(design): Rung R6 — Chrome + live dot (v0.7.5)`)
      and `git push origin main`.
- [ ] Ship staging (exact sequence):
      ```
      rsync -a --exclude=.git --exclude=.nojekyll --delete dist/ ~/work/finance-astro-pages/
      cd ~/work/finance-astro-pages && git add -A
      git commit -m "v0.7.5 — R6 chrome: live dot, gold hairline, nav 13/700, mono ticker"
      git push origin HEAD:pages-dist
      ```
- [ ] Wait for Pages: `gh api repos/godschi10/finance-astro/pages/builds/latest
      --jq '.status + " " + .commit[0:7]'` → `built <sha>`.
- [ ] Verify SERVED bytes: homepage contains `.tl`/`tl-pulse`, gold hairline
      `rgba(245, 158, 11, 0.22)`, and NO regressions (`sheen` count 0).
- [ ] Rebuild commands: build `NODE_OPTIONS=--max-old-space-size=384 npm run build`;
      gates `npm run check` (6/6 expected).

## 4. Remaining rungs after R6 (per §11 — one rung per ship, screenshots each)

- **R7** Stats strip odometer (plan §P1-5).
- **R8** Tables/figures ledger captions (§P1-6 area).
- **R9** Legal seal + footer colophon (§P1-7) — `check-footer-fidelity.mjs` governs.
- **R10** Motion pass + article polish + 404/search/mod-desk.
- Deferred flag: pre-stamp plan said “sticky results” in R4 — NOT in stamped §11;
  flagged to King, do not silently add.

---

## 5. Environment & pitfalls (VPS truths)

- Preview server: `http://localhost:8080/finance-astro/` (`astro preview` — check
  it's running; restart: `NODE_OPTIONS=--max-old-space-size=384 npx astro preview`).
- Chrome CDP: `http://127.0.0.1:9222`; serve script `~/.hermes/scripts/chrome-serve.sh`
  (Chrome For Testing arm64 at `~/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome`;
  must run with `--remote-allow-origins=*` for raw websocket, origin header
  `http://127.0.0.1:9222`).
- Theme seeding for screenshots: navigate FIRST, then
  `localStorage.setItem('gwill-finance-theme-v3','light'|'dark')`, then reload.
  Setting it before navigation executes on `about:blank` (opaque origin) and is lost.
  Stored theme overrides media emulation. Light homepage ≈ 64 lum, dark ≈ 33
  (dark hero slab is the brand, not a regression); desk light 92 / dark 22.
- Sweep stray CDP tabs via `/json/close/<id>` (closing the websocket does NOT
  close the target), but ALWAYS leave ≥1 page tab for the accuracy harness.
- `npm run check` gate facts you must not fight: homepage gate truncates
  `index.astro` at its FIRST `<script>` (scripts belong in the existing ported
  block at file end) and forbids a `.ledger` DOM element (R5 renders it as
  `.hero-sub::after`); header gate anchors live in `header.css` + Layout tokens.
- `pkill -f <pattern>` can self-match your own shell — use exact names.
- Delegation state at handoff: native Hermes delegate broken (`No module named
  'tools.delegation_output_schema'`); freebuff quota **0/25 Freebucks** (dry);
  YOU (OpenCode) are the designated manager now. Note: OpenCode legs <3 min by
  config — split long steps (build/audit/ship) into separate invocations.
- `dnf` needs `--disableplugin=spacewalk,ulninfo`; tmux installed; `freebuff` +
  node live at `~/.local/bin`; `/tmp` wipes on reboot (evidence lives in `~/work`).
- Never print API keys/tokens — redact as `[REDACTED]`.
- Address King as “My King”; ship notices must name the exact URL he verifies on
  his phone; no staging-warning boxes ever.

## 6. Useful artifacts

- Ledger: `PENDING-WORK.md` · Changelog: `CHANGELOG.md`
- Probes: `/home/opc/.hermes/cache/scratch/r6-mgr-probe.py` (and r5-*, r4-*)
- Accuracy log (R5): `/home/opc/.hermes/cache/scratch/acc-r5.log` (26/26)
- R6 audit log (incomplete run): `/home/opc/.hermes/cache/scratch/acc-r6.log`
- Guarded pages checkout: `~/work/finance-astro-pages/`
- R1–R4 delegated deliverables: `/tmp/r3-freebuff/`, `/tmp/r4-freebuff/` (ephemeral)

**Start here:** `git status` (expect: modified `Layout.astro`, `CHANGELOG.md`,
`PENDING-WORK.md`, `package.json` … plus untracked `src/styles/chrome.css`) →
run §3's checklist top to bottom.
