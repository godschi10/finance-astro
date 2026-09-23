# 08 — The article subtitle (net-new element)

**Order:** King, 2026-09-23 — *"Time for blogpost import but I want to add
subtitles after the title, if you can design it to match."*

## Why this is a new element, not a port

WordPress has no subtitle on posts. `single.php` renders, in order:
breadcrumb → category badge → `h1.art-t` → `div.art-meta` — nothing between the
title and the meta row. The only "subtitle" fields in the truth theme are page
heroes (`gwill_about_subtitle`, `gwill_apps_hero_sub`, `gwill_nl_hero_subtitle`,
`gwill_articles_subtitle`), which are unrelated surfaces.

So the port cannot copy this element; it has to **speak the theme's language**.
This file records the vocabulary the design was derived from, so a future
reader can check the reasoning instead of guessing.

## The vocabulary it matches

| Source in `gwill-finance-theme/style.css` | Value taken |
|---|---|
| `.art-t` (L2002) | `font-weight: 800`, `letter-spacing: -0.035em`, `line-height: 1.08`, `max-width: 720px` — the title the subtitle hangs from |
| `.art-meta` (L2003) | `font-size: 11px`, `font-weight: 300`, `color: var(--text-dim)` — the row right below |
| `.hero-sub` (L727) | supporting copy = `font-weight: 300`, `line-height: 1.75`, dimmed colour |
| `.feat-ex` (L794) / `.ac-ex` (L769) | supporting copy = `font-weight: 300`, `color: var(--text-dim)`, `line-height: 1.65–1.75` |
| `.callout` (L2168) | `border-left: 3px solid var(--gold)`, `color: var(--text-mid)`, `font-size: 14px` |
| `.art-body blockquote` (L2070) | `border-left: 3px solid var(--gold)`, `color: var(--text-mid)` |
| `.art-body .wp-block-pullquote` (L2072), `.tbl-best` (L1475) | same 3px gold left rule |

Two things are unambiguous in that table: **supporting copy is `font-weight:
300` in a dimmed colour**, and **the theme's accent idiom for a quoted or
standing-apart passage is a 3px `--gold` left rule** (used for callouts,
blockquotes and winning table rows — never for decoration).

## The design, and why

```css
.art-sub {
  margin-top: 16px;
  color: var(--text-mid);
  font-size: 1.0625rem;   /* 17px — above body copy, well under the 28–40px title */
  font-weight: 300;       /* the theme's supporting-copy weight */
  line-height: 1.6;
  max-width: 62ch;        /* readable measure, narrower than the title's 720px */
  border-left: 3px solid var(--gold);
  padding-left: 16px;
}
```

- The **gold rule** is the theme's own idiom for a passage that stands apart —
  which is exactly what a standfirst is. It also ties the subtitle to the
  callouts further down the article.
- **17px/300/`--text-mid`** picks up the theme's supporting-copy ramp and stays
  clearly subordinate to the title.
- **No new tokens, no new colours, no invented ornament** — every value is a
  token or a value already in the theme's stylesheet.

Rejected: a tinted callout box (competes with the affiliate-disclosure box that
sits a few lines below), a background wash (not in the article-header
vocabulary), and uppercase/mono (reserved for `.stitle` section labels).

## Placement and content source

Rendered as `p.art-sub`, directly after `h1.art-h`, before `div.feat-meta` —
verified by the gate assertion order in `scripts/check-article-fidelity.mjs`.

Content comes from the **optional `subtitle` frontmatter field** (added to
`src/content.config.ts`), falling back to `description` so any post without an
authored subtitle still renders a complete header. The `description` keeps doing
its own jobs — card excerpt, search result, `meta description`, JSON-LD — so an
authored subtitle *adds* an editorial line rather than duplicating one.

### Divergence from WordPress — declared, not accidental

The port now shows a line under the title that WordPress does not. That is a
deliberate, King-ordered divergence and is recorded here so no future fidelity
pass "fixes" it back out. If the two sites must stay pixel-identical, the
matched path is to add an ACF field to the theme's post field group and render
it in `single.php` with this same rule set — the design is portable as-is.

## Evidence

- `docs/evidence/art-sub-390.png`, `art-sub-768.png`, `art-sub-1280.png` — the
  shipped design at all three widths.
- `docs/evidence/art-sub-variants-390.png` — the three treatments considered
  (plain standfirst / gold rule / hairline), rendered from the built stylesheet.
- Measured at 390/768/1280: `17px`, weight `300`, line-height `27.2px` (1.6),
  `color: rgb(58,58,58)` (`--text-mid`), `border-left: 3px rgb(180,83,9)`
  (`--gold`), `padding-left: 16px`, `max-width: 632.4px` (62ch), gap to the
  title `16px`, 5 lines at 390 → 3 lines at 768/1280.
