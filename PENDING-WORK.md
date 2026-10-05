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