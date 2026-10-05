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
- [ ] **Reset (real bug, mine)** — Reset does `location.reload()` and the
      smart-fields memory restores his numbers straight back; it must clear the
      tool's stored key + inputs, then restore the worked example. Must work on
      EVERY tool incl. ones with no memory. Live probe each tool.
- [ ] **Hub labels** — the two budget tools are genuinely different (3 buckets
      vs the needs half itemised into naira lines) but share emoji+gradient, so
      they read as duplicates. Differentiate honestly + name the relationship.