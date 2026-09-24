# 14 — Subtitle and meta were too close (v0.4.4)

## The verdict

King, phone screenshot (img_30a2b4d4b69e): *"Subtitles and posts meta are
too close."* Vision read: the deck's bottom line ("...theme's own rules.")
sat flush on the author pill (`G-will Chijioke`); title→deck also tight.

## Root cause

The deck is the net-new subtitle element (`docs/port/08-article-subtitle.md`)
— WordPress has no equivalent, so its spacing was port-designed. The rule in
`Layout.astro` (net-new rules stay there until each page gets its own slice):

```css
.art-sub{margin-top:16px;…}
```

No `margin-bottom` at all. Measured on the built dist at 390px before the
fix: `gap_title_sub: 20` (margin collapse took the max of `.art-t`'s 20px
bottom and the deck's 16px top), `gap_sub_meta: 0` — the King's screenshot
was exactly right.

## Fix

The theme's own bordered-callout rhythm decides the scale: the disclosure
box renders `class="discl mb24"` — 24px below a callout is the theme's own
answer. The deck now carries the symmetric pair:

```css
.art-sub{margin-top:24px;margin-bottom:24px;…}
```

`.art-t`'s own `margin-bottom: 20px` (style.css:2002, ported verbatim)
collapses against the deck's 24px top, so the rendered title→deck gap is
24px.

## Measured after (390 dark, rebuilt dist)

```
badge → title     14px   (inline-flex margin, unchanged)
title → deck      24px   (was 20)
deck  → meta      24px   (was 0)   <-- the King's complaint
```

Gate 120/120; build 54 pages. Proof shot: `v0431-subtitle-gap.png`.

## Note

`.art-sub` appears on article pages only today, but the rule lives in
Layout.astro's shared block — the about/contact pages don't render a deck,
so no other surface moves.
