## SHIPPED — 2026-10-05 · THREE CALCULATOR DEFECTS — v0.7.23
King: "Do it" — the three defects the Reset fix had exposed.
- [x] **D-A FIXED — the budget allocator's receipt had NEVER updated from any
      input.** `budget-allocator.astro:68` wrote to `id="al-needs"`, which no
      element carried, so `render()` threw on every call (4 TypeErrors per
      keystroke, measured) and the receipt was frozen on its seed since the tool
      shipped. The span now carries the id. Proved by reproducing the frozen
      behaviour first (income 600,000 + rent 10 → still ₦125,000), then the fix
      (900,000 + rent 60 → ₦450,000 · ₦270,000 · ₦180,000, every naira line
      moving, zero errors).
- [x] **D-B FIXED — `Clear examples` permanently killed the render on two
      pages.** `paintEmpty()` did `textContent =`, deleting the very nodes the
      render writes to (`#bg-else`, `#al-wants`, `#al-sav`). The death was
      reproduced on the live DOM first. Subs that carry render targets now park
      their children in a hidden holder (still in the document, so the render
      keeps writing into them) with the honest voice line beside it; prose-only
      subs keep the old overwrite. Proven: type → clear → **type again** → real
      figures return on both pages, zero errors.
- [x] **D-C FIXED — 14 of 15 calculators could never leave the empty state.**
      They judged it once at load. `sfBind()` now judges on every input and
      change, delegated on `document` so it runs after the page's own render —
      the same model as 50/30/20, with zero page edits. The predicate reads
      VALUES, never badge state, so first paint stays order-independent (the
      trap the earlier leg hit). Proven on 4 tools × both themes: `—` → real
      figures → `—` again → Reset restores the seed.
- [x] **Reset contract re-proved after the changes**: 777 into every field →
      Reset → server seed on all tools, no reload (sentinel survived), badges
      re-armed.
- [x] **Two self-inflicted regressions caught by the live proof, not the gates:**
      holding *every* sub (broke salary-tax's own sub rewrite, 2 errors per
      keystroke) and a stranded-dash path. Both fixed before shipping.
- Proofs: build 79 pages; 6/6 (article 147/147, vectors 95/95); `id="al-needs"`
      served; 4 screenshots read (no visual change — no CSS, no class, no token).
- **Left open deliberately (reported, not fixed):** a latent `paintEmpty` variant
      no page can currently reach; the page's own `₦144,000 · ₦0 · ₦0` on a
      partly-filled form (its render, not the empty state); a lost
      `data-al-amt` attribute nothing reads.

## ACTIVE — FIX LEG: 4 QA BREAKS + 3 SWEEP FINDINGS, King's "fix all findings"
@qa-inspector audited the honesty pass: **SHIPPABLE WITH FOLLOW-UP** — engine
unbreakable, 4 claims CONFIRMED, typed-zero trap PASSES on 5 cases, HN-4 unbreakable.
Gates Reset/D-B/D-C all PASS. Files now free (audit closed).
- [ ] **BREAK-1** withheld line ships garbled: *"Needs %Last used is empty, not
      zero."* — `labelOf()` reads `label.textContent` and smart-fields injects the
      badge INSIDE the label. User-visible on the flagship tool. MUST NOT ship.
- [ ] **BREAK-2** clear `nv-pv` → 3 siblings go `—` but discount rate prints
      **`0.0%`** (`pv / (future>0 ? future : 1)` divides by 1). Only instance.
- [ ] **BREAK-3 (latent)** offer inertness is CSS-only; a programmatic `.click()`
      bypasses `pointer-events`. Not a visitor path — close it if cheap.
- [ ] **BREAK-4** salary-tax `#st-save` bar-note asserts *"Both regimes leave you
      with the same take-home."* with gross BLANK — an assertion with no data.
- [ ] **C1 CRITICAL** emergency `monthsToReach` ignores `saved` (emergency.ts:34).
      VERIFIED: gap ₦0 + 100% bar + "11.3 months" simultaneously. Correct 5.6.
- [ ] **M1** loan "Quoted rate %" = per month / per day / per year under one label.
      24x APR spread from one dropdown. Label must state the unit.
- [ ] **M2** `Math.max(1, pm(v) || SEED)` — a typed 0 silently becomes the seed,
      7 pages. Inverts our own ZERO LAW. Blank stays honest, typed 0 stays 0.
- [ ] **SEED** 50/30/20 shipped seed: spent 140,000 vs plan-needs 125,000 → opens
      on **₦-15,000 remaining**. The flagship tool's flagship example contradicts
      itself on first load.
- **DEFERRED (reported, not hidden):** loan reducing-APR ≈ its own input vs FAQ;
      currency-converter unit rate ≠ its own conversion; dividend "Starting
      yield" gated on fields it never reads; transfer 4.5% renders identical to
      Wise; footer tap targets 13-19px vs WCAG 24px. UNVERIFIED TABLES: 8 NGX
      prices, 10 savings rates, 5 transfer models — arithmetic verified, rates
      not. exchange-rate-history needs >=2 device points across days; live-FX
      corrupt-feed guard UNTESTED (sandbox could not reach the feed).

## ACTIVE — CALCULATOR INTELLIGENCE MISSION, King's order 2026-10-05
King: *"Calculators are still dumb as fuck, why do I have to fill shit why can't
figure ls enter automatically by changing percentage or price of one side, all
calculators not smart enough. Do extensive research on how to make all perfect
and better. UX still shit."* (screenshot: 50/30/20 offering **"Plan puts needs at
₦0"** with an ACTIVE "Use this" button)
- [ ] **CI-1 @researcher** — how real finance tools make figures derive themselves:
      two-way linked %, two-way linked totals, defaults that fill honestly, undo,
      "what changed" affordances. Evidence-backed, per-tool plan for all 16 tools.
- [ ] **CI-2 @builder** — kill the ₦0 offer. A tool must NEVER volunteer a zero: an
      empty percentage must not read as 0, and the offer must withhold (with an
      honest line) instead of offering ₦0. Audit EVERY `derive` entry in
      tool-fields.ts for the same zero-volunteering defect, not just this one.
- [x] **CI-1 RESEARCH LANDED** — `/home/opc/work/research-notes/calc-intelligence-MASTER-2026-10-05.md`
      (656 lines, 32 URLs, all fetched). THE MODEL: **one value, one input.** The
      other unit is RENDERED BESIDE the field as a live `.twin` in plain text —
      never an `<input>`, never persisted, never gold. Anchor wins when the two
      disagree; the tool shows both side by side and never resolves by overwriting.
      **NO code path in this fleet writes a derived figure into an input element.**
      Tier 0 (display twin) answers the screenshot; Tier 1 (`.tgl` unit toggle,
      the grammar already on currency-converter:42) makes it two-way, on 50/30-20
      (3 fields) + allocator (5) only.
- [x] **CI-2 @builder DONE, UNSHIPPED** — the ₦0 offer is dead. Empty ≠ zero.
      Root cause: `pm("") === 0` fed the offer, and the shipped page-empty guard
      never fired on "income typed, % cleared". `SfOffer.needs` now withholds while
      a declared input is blank and says **"Nothing to compute yet — Needs % is
      empty, not zero."** Verified by me: 6/6, 79 pages, scope = 1 file.
      *HELD FROM SHIP* — its own proof exposed a worse contradiction (see HN-3).
- [ ] **HN — HONESTY BREACHES the research exposed. Mine, and worse than the UX
      complaint. All three CONFIRMED BY ME against served bytes:**
  - [ ] **HN-1** `SUB_VOICE` tells the user *"Enter your numbers above — empty
        counts as ₦0."* (tool-fields.ts:194, live on 2 pages) — states the exact
        falsehood we built the whole empty-state rail to prevent. One clause.
  - [ ] **HN-2** the inflation default is dishonest for our biggest audience.
        We ship *"We start at 20% as a cautious band"* against a national 15.39%
        headline — but **Lagos was 23.68%** (Aug 2026, NBS; I verified against two
        independent outlets). For our largest readership "cautious" is 3.68 points
        BELOW reality. Worse, all three context lines cite
        `https://www.nigerianstat.gov.ng/` — the NBS **homepage**, not the report.
        We wrote the "no URL, no line" law and shipped a citation-shaped
        decoration inside the feature that enforces it.
  - [ ] **HN-3** the receipt asserts **gold `₦0 · ₦0 · ₦0`** under an offer that
        honestly says nothing is computable. Each page's own `render()` prints its
        product of empty inputs as a confident gold zero. Fleet-wide, 16 pages.
        This is why CI-2 is HELD: shipping the honest offer alone would make the
        breach MORE visible, not less.
  - [ ] **HN-4** a derived value would be persisted and handed back wearing
        `LAST USED` (`smart-fields.js:178 if (s !== "") v[id] = s`) — a number no
        human typed, presented as the user's own remembered number. Latent today;
        goes LIVE the moment CI-4 lands. Must ship with it.
- [ ] **CALC BUG SWEEP — King's order 2026-10-05: *"Rerun audit to find calculator
      bugs."*** A FRESH full audit of all 16 calculators, not a re-read of the last
      one. @qa-inspector, own Chrome on **:9333** (never 9222 — @qa-inspector's
      other leg holds it), read-only on the repo. Scope per tool: independent
      recomputation of every output (no reusing the site's own helper as truth),
      input robustness (0, empty, ".", negative, huge, unicode, pasted "₦1,234.50",
      leading zeros), derived-figure correctness, both themes, 390/834/1440px,
      console errors, and every honest rail still telling the truth. Ships a
      MASTER findings doc; **fixes are a separate leg after you and I read it.**
      NOT a re-brief of the in-flight honesty pass — different questions.

- [ ] **CI-3 @designer** (after CI-1 lands) — the pattern's visual vocabulary:
      which side is source vs mirror, how a filled-by-derivation value is marked so
      it can never be mistaken for the user's own figure. Both themes, 390px.
- [ ] **CI-4 @builder** (after CI-3) — the twin model on 50/30/20 + allocator,
      Tier 0 display twin fleet-wide, Tier 1 toggle only where earned, HN-3 and
      HN-4 in the same push. Ships with CI-2 + HN-1 + HN-2 as ONE honesty pass.
- **HOLD:** the second tool list `src/data/content.ts:80 TOOLS` still needs its own
      leg. Do not fold it into this one.

## ACTIVE — DEFECTS THE FIX LEGS FOUND, King's order 2026-10-05
Found by @builder while fixing Reset — pre-existing, NOT shipped broken:
- [ ] **D-A** — `budget-allocator.astro:68` writes to `id="al-needs"`, which does
      not exist in the served HTML → that page's `render()` throws on every call,
      so its receipt has NEVER updated from any input.
- [ ] **D-B** — `tool-fields.ts` `paintEmpty()` uses `textContent =` which
      destroys nested render targets (#bg-else, #al-wants, #al-sav) → after
      `Clear examples` those pages' render is dead for good.
- [ ] **D-C** — 14 of 15 pages call `sfEmpty()` once at load, outside
      `render()`, so they can never leave the empty state themselves.

## SHIPPED — 2026-10-05 · FOOTER ARCHIVE REMOVED — v0.7.22
King: *"I don't like the archive section in the footer, remove it"* (phone
screenshot showing the empty half-row it left).
- [x] **Removed completely, as a revert — not a compromise.** No relocation, no
      trimmed single link, no "Archive" heading left anywhere. @builder removed
      the explanatory comment, `ARCHIVE_MONTHS`, the `ARCHIVE_LINKS` IIFE,
      `ARCHIVE_SUB`, both `sub:` properties, BOTH render sites, and the
      now-unused `allArticles` import (proven unused by grep, not assumed).
      **2 insertions / 78 deletions, pure subtraction.**
- [x] **The date archives themselves stay.** He rejected the footer SECTION,
      not the archives: all 11 `[year]` routes still build, remain in the
      sitemap, and still return 200.
- Proofs: build 79 pages; 6/6 green (the footer gate never pinned the block, so
      no gate was edited); `Archive` count **0** in served bytes on every page;
      live DOM probe in both themes at 390px + 1280px confirms the mobile 2×2
      grid is balanced again with no dead half-row, and the Articles column is
      back to its original 4 links.
- **Open for the King (not shipped, reported not decided):** the archives are
      now reachable only via the sitemap/breadcrumbs; @builder's proposal is an
      "Archive by year" affordance on the /articles/ listing page instead of the
      footer. His recommendation: ship neither until you ask.

## ACTIVE — HUB LABELS + RESET FIX, King's order 2026-10-05
King (screenshots): two hub cards look identical (same 🧮 emoji + colour, "50/30/20
Budget Calculator" vs "Budget Allocator (50/30/20 in Naira)"); Reset does nothing.
- [x] **Reset (real bug, mine) — SHIPPED v0.7.22** — Reset does `location.reload()` and the
      smart-fields memory restores his numbers straight back; it must clear the
      tool's stored key + inputs, then restore the worked example. Must work on
      EVERY tool incl. ones with no memory. Live probe each tool.
- [x] **Hub labels — SHIPPED v0.7.22** — the two budget tools are genuinely different (3 buckets
      vs the needs half itemised into naira lines) but share emoji+gradient, so
      they read as duplicates. Differentiate honestly + name the relationship.