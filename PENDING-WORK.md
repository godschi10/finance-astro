## ACTIVE — 2026-10-08 · MANAGER TRANSITION — King's order
King: *"Take over the project, make sure you have your own persistent memory
for work. Just make sure your work is as organized as his."*
- [x] **Hermes Manager took the throne from the OpenCode twin at v0.7.40
      (a9d41b9).** The twin's session is superseded — it must not edit this
      repo anymore.
- [x] **Persistent program state now lives at
      `/home/opc/.hermes/memory/finance-astro-program.md`** — position, laws,
      commands, ship sequence, conventions, carried items. Read at session
      start; updated after every leg.
- Ledger discipline unchanged: every order → line here; every ship →
  CHANGELOG entry + scoreboard round-log line + version bump + served-byte
  proof + ship notice naming the exact live URL.
- NOTE: C1 emergency-fund was FIXED in v0.7.38; older "C1 held" lines in this
  file are historical and superseded.
- Resume point: **50-30-20 A13** (A1–A12 + E1–E12 done). Serial program
  continues from here.

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

## LAW — 2026-10-06 · FORTY ROUNDS. King: *"Go another 10 rounds, I want the best
## and smartest of all my calculators. Look for little details that people miss then
## go 20 rounds of hunting for bugs and another 20 rounds looking for what is missing
## and what can make it easier using the calculators. That's 40 rounds for each
## calculator. Get busy"*
## LAW — 2026-10-07 · SERIAL UX PROGRAM (King clarifies).
## *"One calculator after the other."* + *"How users interact with the calculators is
## vital. And any friction should be fixed and every missing feature should be added.
## No shortcuts. 40 audits each. 40 edits each."*
Execution is SERIAL per tool: one calculator runs its full A→E pairs to completion
before the next begins. One active leg at a time on the active tool (audit then its
edit — inherently serial; no parallel legs on the same tool). Every audit is
interaction-first: full tap/scroll/keystroke order, hesitation points, friction log.
Every E answers its A completely: each friction fixed, each missing feature added —
or explicitly HELD only by the King's word, never by convenience. A finding carried
past its E without a fix or a hold is a broken promise; the next A re-opens it as
regression. Tool order (King may reorder): 50-30-20 → salary-tax → savings-goal →
compound-interest → loan-repayment → gross-to-net → emergency-fund (audits run, C1
fix held) → inflation-savings → naira-value → currency-converter →
money-transfer → crypto → dividend → savings-rate → exchange-rate-history.
ACTIVE TOOL: 50-30-20 (A1–A12 + E1–E12 done, A13 next).

## LAW — 2026-10-07 · UX AUDITS: 40 AUDITS + 40 EDITS PER CALCULATOR. King:
## *"What about the calculators. I was asking you to audit the UX. How people use
## each calculator. 40 audits and 40 edit rounds for each calculator."*
My second correction. The program is UX-first, not correctness-first: each audit
studies HOW PEOPLE USE the tool (first-use, comprehension, friction, trust,
next-action), and each edit round answers the audit. Per calculator: A1-A40 audits
+ E1-E40 edit rounds = 80 rounds × 16 calculators = **1280 rounds.** Executed as
audit→edit pairs (A1→E1→A2→E2…). The banked correctness work (fleet R1/R2/R3, B4s,
FIX legs) stands as the correctness base — it is NOT re-counted as UX audits.
Scoreboard v2: `/home/opc/work/research-notes/forty-rounds-scoreboard.md`.
Emergency-fund UX audits run (using the tool is auditable); only its C1 *fix* is held.

**CORRECTION 2026-10-06: per CALCULATOR, not per fleet.** The King: *"Not 10 rounds
again, it's 40 rounds per calculator."* My forty-fleet-rounds reading was wrong.
Truth: 16 calculators × 40 rounds (20 bug B1-B20 + 20 improvement I1-I20) =
**640 rounds.** Fleet R1/R2/R3 bank B1-B3 for every tool; 592 legs remain.
Scoreboard: `/home/opc/work/research-notes/forty-rounds-scoreboard.md` — the single
source of truth for what's done per tool. Emergency-fund HELD (C1 WP-parity call).
Fixes owed from R3: 3 prose drifts (naira-value + inflation-savings 20%→24% body
copy, dividend FAQ 9.19% vs 9.38%).
Standing order. An audit round is a SAMPLE with a distinct primary angle, never a
re-tread and never a clearance. Fixes ship between rounds; the next round re-proves
the fixes first (a broken shipped fix is CRITICAL and outranks everything).
- [x] **R1** (2026-10-05) — arithmetic correctness, input robustness, derived figures.
      1 CRIT · 2 MAJOR · 6 MINOR. Shipped v0.7.24 (C1 held for WP-parity).
- [x] **R2** (2026-10-06) — regressions of v0.7.24 + gaps + keyboard/a11y + cross-tool
      + rounding + extremes + storage. 0 · 0 · 8 MINOR. SHIPPABLE WITH FOLLOW-UP.
- [x] **FIX-8 + SUITE-PROOF SHIPPED v0.7.26** (`main 05e3aec`): suite proven honest then green (137/0/7, exit 0, 3x identical, failure proof, hygiene clean); 7 minors fixed (F5 tap-targets proposal-only, needs stylesheet); suite-caught tab hang capped at 100y page-level, `src/lib` untouched, vectors 95/95. All served-byte-confirmed by me.
- [ ] **R3** — FIX-8 verification + seed consistency on all 16 (every worked example
      recomputed by hand) + mobile touch + prose-vs-numbers consistency.
- [ ] **R4** — hostile inputs: XSS/malformed payloads, stored values re-rendered
      unescaped, URL params, what leaves the device (any network call with user data).
- [ ] **R5** — performance on a thin device: JS weight per tool, render cost per
      keystroke, suite timing budget.
- [ ] **R6** — words: every FAQ/claim/citation on all 16 tools re-checked against
      sources; prose contradicting its numbers is a finding.
- [ ] **R7** — cross-browser + no-JS: Firefox/Safari where available; scriptless
      tools must fail honest, never confident-wrong.
- [ ] **R8** — Nigerian-realism scenarios: real salary structures, informal income,
      tax edge cases vs FIRS/PwC guidance, Lagos-vs-national defaults.
- [ ] **R9** — suite-vs-human parity: does the suite catch everything R1-R8 found?
      Every gap becomes a new suite contract.
- [ ] **R10** — state & memory deep: expiry, cross-tool keys, multi-tab, Reset edge
      cases, private mode.
- [ ] **R11** — formatting micro-details: grouping, decimals, rounding, signs, units,
      % precision, symbol placement — the little details people miss.
- [ ] **R12** — blank-states matrix: every field blank × every figure, all 16 tools.
- [ ] **R13** — boundaries: 0, 1, cap edges, off-by-one months/years, rate edges.
- [ ] **R14** — staleness: every input × every dependent, rapid typing, paste, autofill.
- [ ] **R15** — console silence: warnings, rejections, failed fetches, blocked resources.
- [ ] **R16** — accessibility deep: focus order, aria-live announcements, labels,
      figure contrast, reduced motion.
- [ ] **R17** — viewport matrix: 320/360/390/768/834/1024/1440 × both themes × 200% zoom.
- [ ] **R18** — cross-tool agreement + shared-engine drift (lib vs page copies).
- [ ] **R19** — data audit: all NGX/DPS, savings rates, transfer models, FX staleness.
- [ ] **R20** — bug-phase clearance: re-prove every prior fix, suite green, sign-off list.
- [ ] **R21** — Tier 0 display twin fleet-wide (the researched model).
- [ ] **R22** — Tier 1 unit toggles (50/30/20 + allocator only).
- [ ] **R23** — first-run: disclosure lines, worked-example guidance.
- [ ] **R24** — input ergonomics: steppers/sliders/chips where typing is dumb.
- [ ] **R25** — results comprehension: plain-language verdicts, "what this means".
- [ ] **R26** — comparisons: vs goal, vs last input, vs honest averages.
- [ ] **R27** — export/share: copy results, WhatsApp text, print stylesheet.
- [ ] **R28** — per-tool local history (not just fx-history).
- [ ] **R29** — cross-tool goal wiring (salary → budget → savings → emergency).
- [ ] **R30** — accessibility upgrades from R16.
- [ ] **R31** — performance upgrades from R5.
- [ ] **R32** — content upgrades from R6.
- [ ] **R33** — trust upgrades: methodology notes, last-verified stamps, citations UI.
- [ ] **R34** — app-feel: PWA install, offline honesty, install prompts.
- [ ] **R35** — personalization: remembered defaults, household profiles.
- [ ] **R36** — nudges: review reminders, yearly band updates.
- [ ] **R37** — error prevention: inline validation, warn-before-clamp, undo.
- [ ] **R38** — empty-state upgrades: guided first-fill, scenario picker.
- [ ] **R39** — suite hardening: every improvement gets a contract.
- [ ] **R40** — finale: King's acceptance pass. He calls done.

- [ ] **R3** — FIX-8 verification + seed consistency on all 16 (every worked example
      recomputed by hand) + mobile touch + prose-vs-numbers consistency.
- [ ] **R4** — hostile inputs: XSS/malformed payloads in every field, stored values
      re-rendered unescaped, URL params, what leaves the device (any network call
      a tool makes with user data).
- [ ] **R5** — performance on a thin device: JS weight per tool, render cost per
      keystroke, suite timing budget.
- [ ] **R6** — words: every FAQ/claim/citation on all 16 tools re-checked against
      sources; prose that contradicts its own numbers is a finding.
- [ ] **R7** — cross-browser + no-JS: Firefox/Safari where available, tools with
      scripting disabled must fail honest, never confident-wrong.
- [ ] **R8** — Nigerian-realism scenarios: real salary structures, informal income,
      tax edge cases against FIRS/PwC guidance, Lagos-vs-national defaults.
- [ ] **R9** — suite-vs-human parity: does the permanent suite catch everything
      rounds 1-8 found? Every gap becomes a new suite contract.
- [ ] **R10** — final clearance sweep + sign-off checklist. The King calls clean.

## LAW — 2026-10-06 · CALCULATORS ARE APPS. King: *"all Calculators are apps and
## apps need massive bug hunts and we have not even come close."*
Standing order, not a one-off. Two consequences I bind myself to:
1. **No calculator change ships without a behavioural proof that runs on every
   build.** Today the contracts (Reset = no reload, Clear examples, empty state,
   typed zero, stale-figure recompute, no NaN in the DOM) are re-proved BY HAND
   every leg and the proof evaporates at the next ship. That is why we keep
   re-finding the same classes of bug. @builder is building the permanent suite
   (`scripts/calc-regress.mjs`, zero new deps — CDP over the existing `ws`).
   Once it exists, `npm run check` gates on behaviour, not just markup.
2. **An audit is a sample, never a clearance.** Passing N sweeps is not "clean".
   The standard is: the suite is green, the remaining findings are enumerated
   with severity, and the unverified surfaces (rate tables, live feeds) are
   named rather than implied safe.
- [ ] **QA-SUITE @builder** — permanent behavioural regression suite over dist/,
      CDP-driven, one browser, sequential, deterministic waits. Asserts every
      contract listed above across all 16 tools. Non-zero exit on failure.

## ACTIVE — 2026-10-07 · MERGE (King chose option 2) + E1s
King on the two 50/30/20s: **"2"** — fold the allocator in as step 2 inside the
50/30/20 page. One tool, one journey. The old URL becomes a pointer (fixed-income
precedent: meta-refresh 0 + canonical + noindex,follow + human fallback link).
Pre-checked by me: NO gate asserts the allocator or a 16-tool count; the allocator
engine (`src/lib/allocator.ts`) + vectors entries stay UNTOUCHED (step 2 reuses the
same engine, oracle never moves); references live in content.ts:91, tool-manifest,
tool-fields, vectors.php (keep), tool-accuracy-audit.mjs (not in gate chain).
- [ ] **MERGE+E1-50 @builder** — step 2 inside 50-30-20 (needs-half buckets, tunable,
      same engine) + old URL → pointer + manifest 16→15 + content.ts entry out +
      tool-fields allocator entry out + accuracy-audit entry fixed + 50-30-20 card
      copy updated + salary→budget→etc onward links + A1-503020 findings (history
      trap, invisible moves, Use-this-eats-lesson, Last-used seeds, dead-end links,
      sliders/below copy). Owns tool-manifest.ts + tool-fields.ts + shared files.
- [ ] **E1-SALARY @builder-or-qa (PAGE-ONLY)** — salary-tax A1 findings, page file
      ONLY. If a finding needs tool-fields/shared/ToolShell, report as proposal.
      Disjoint by construction; may run parallel with MERGE.

## ACTIVE — 2026-10-06 · King's two orders
King: **"Make TOC default closed, after that run another round of bug hunt and
Audit of all calculators."**
- [ ] **TOC-1 @builder** — mobile "In this article" dropdown defaults **OPEN**
      (`src/scripts/article.js:135` `setToc(savedToc !== 'closed')`). King's
      order: **default closed.** NOTE: `check-article-fidelity.mjs:135` PINS the
      server-rendered `aria-expanded="true"` (WP single.php:126 parity) and
      `article.js` also reproduces a deliberate WP FOUC quirk (server says
      expanded, class absent until deferred JS runs). **The King's explicit
      order OVERRULES the parity pin** — per the gates-are-contracts law I update
      that assertion MYSELF, recording his words, the date and the reason, then
      re-run green. Workers never edit gates.
- [x] **AUDIT-2 DONE 2026-10-06** — `calc-BUG-SWEEP-ROUND2-2026-10-06.md` (151 lines).
      **0 CRITICAL · 0 MAJOR · 8 MINOR — SHIPPABLE WITH FOLLOW-UP.** All 7 v0.7.24
      fixes re-proved live, no wrong-number bug found. New minors: F1 negatives
      print `₦-X` (sign after symbol) on most pages while crypto prints `−₦X`
      (I confirmed both patterns in source); F2 naira-value prints a raw
      `₦2.19…e+23` on one unguarded path (two sibling figures already guard with
      `tooBig ? "—"`); F3 transfer `0.0008/0.0008` hides the P2P edge; F4 dividend
      yield vanishes on cleared growth; F5 tap targets sub-24px; F6 converter
      rounding trivia; F7 expired storage key lingers; F8 silent negative
      clamping on 11 pages. C1 stays HELD (WP-parity call). 5 rate-table rows
      verified exact (DANGCEM ₦45, GTCO ₦11.76, Zenith ₦10, SafeLock 18.5%,
      FairLock 20%); rest UNVERIFIED.
- [x] **FIX-8 folded into the v0.7.26 leg above** — done, shipped.
- [ ] **AUDIT-2 @qa-inspector** — round 2 bug hunt, all 16 calculators, AFTER
      v0.7.24. Baseline = `calc-BUG-SWEEP-MASTER-2026-10-05.md`; must re-verify
      the 7 shipped fixes did not regress, attack the 6 deferred MINORs, and close
      the gaps round 1 declared: **UNVERIFIED rate tables** (8 NGX, 10 savings,
      5 transfer), the **untested live-FX corrupt-feed guard**, and
      exchange-rate-history's multi-point chart. Also: keyboard/a11y on the tool
      forms, and cross-tool agreement.
- **STILL HELD, awaiting the King's word:** C1 Emergency Fund months-to-finish.
      Inherited from `emergency-fund.php:52`; needs PHP + oracle regeneration.

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