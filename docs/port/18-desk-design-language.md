# Desk Design Language — /mod/ (King's order: "Dashboard doesn't have to look like shit", 2026-09-26)

Named visual target: **a private editor's console** — the calm, tool-grade
feel of Linear's settings or Stripe's dashboard, dressed in the finance
theme's own gold. Nothing playful; every pixel says "this is the owner's
instrument panel."

## Why the rebuild
The v1 desk shipped with Astro-scoped styles, but its tiles, list rows and
comment cards are built by `createElement` at runtime — they cannot carry the
scope attribute, so the entire data half rendered with ZERO CSS: jammed
strings ("1PendingReview", "132Reactions"), counts glued to titles
("Compared)6"), a monospace wall. Root cause: scoping, not taste. The rebuild
uses one **global** stylesheet, so runtime-built rows are guaranteed to dress.

## Principles
1. **Numbers are the headline.** Every stat leads with its figure large and
   gold-tinted; the label sits UNDER it in small caps — never inline-jammed.
2. **Card, not wall.** Every entity (stat, post, comment) is a bordered
   surface card on `--surface` with `--r-lg` radius and `--sh-sm` lift.
   Dividers inside, never run-on text.
3. **One control family.** All buttons = pill outline chips (44px min height,
   `--pill` radius, 1px `--border`), current state = gold fill/ink; press =
   scale(.97). No rectangle/pill mixing.
4. **Real glyphs, no word labels** (King's no-double-glyph law): reactions in
   any row render the exact brand SVG from the comment summary bubbles +
   count. A number never travels without its glyph.
5. **Faces.** Comment cards lead with the commenter's avatar (48px disc,
   lazy-loaded); initials disc as honest fallback when the gravatar 404s.
6. **Dark mode is first-class** — the desk inherits `[data-theme="dark"]`
   tokens; both themes shot for the gate.
7. **Touch comfort**: 44px targets everywhere, no horizontal scrollers,
   text-cage laws on long titles.
8. **Restraint**: one accent (gold), one danger (red), one positive (green);
   status chips carry the semantic color, nothing else does.

## Type scale
- Desk title: 1.25rem 700, tracking -0.02em
- Stat figure: 1.6rem 700 gold (`--gold`)
- Stat label: 11px uppercase 600, `--text-mid`, letter-spacing .06em
- Card body: 14px/1.55 `--text`
- Meta line: 11.5px `--text-dim`
- Section head: 0.78rem uppercase, tracking .08em, `--text-mid`

## Color roles (theme tokens only)
- Page bg: `--bg` · Card: `--surface` · Inset: `--surface-2`
- Figures/active: `--gold` · Positive: `--green` · Danger: `--red`
- Pending chip: gold-muted on `--gold-muted` bg; approved: green; spam: red;
  trash: dimmed strikethrough.
- The reactions tile: figures in `--text` (data neutral), label as usual —
  gold is for state and action, not every number.

## Layout (all breakpoints)
- Container: max 860px, `--con-pad` gutters.
- Stat grid: `repeat(auto-fit, minmax(150px, 1fr))` → 2-up on phone
  (390px), 4-up + full-width reactions tile on desktop.
- Most Commented rows: rank number (gold, tabular) + title link + count
  chip right-aligned; rank visible 01-08.
- Comment card: avatar left; author bold; status chip right; meta line
  (date · spam% · reactions w/ glyphs · reply-to); body; action row.
- Sign out: quiet ghost chip, bottom, never a lone floating pill.

## Motion
- 140-240ms ease transitions on hover/press only; `prefers-reduced-motion`
  honored (no transforms).

## Informed by
- Stat-card pattern (number-over-label in bordered card): shadcn dashboard
  blocks (shadcnblocks.com/blocks/dashboard) — structure, not pixels.
- Segmented tab rail with aria-selected gold state: uiplaybook.dev
  segmented control; tech-theme nav strip precedent.
- Chip families + reactive filter pills: the site's own vibe-comments
  reaction picker + AndroidScroll desk (v2 bar) laws.
- Avatar-led comment cards: the site's own live comment renderer.
