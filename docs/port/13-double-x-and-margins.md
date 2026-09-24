# 13 — The × that needed two presses, and the margins that were never ported (v0.4.3)

## The verdicts

King, on v0.4.2: *"Why do I have to press the × twice to close"* — then,
with three phone screenshots: *"You still didn't fix the spacing issue, these
elements are too close to each other, look."*

## 1. The double × — a double-bound lightbox

Probing the port with one real click returned the answer immediately:

```js
document.querySelector('.art-body img').click();
document.querySelectorAll('.gl-overlay').length   // → 2   (two stacked overlays!)
```

The port bound the lightbox twice: v0.4.2 added the verbatim
`src/scripts/lightbox.js` import beside `article.js` — but `article.js` had
carried a **full folded copy** of the same script since the v0.3 article port
(§11, 211 lines, labeled "lightbox.js, whole file"). Both copies listened on
`document`; both built an overlay on the same click; the second overlay sat
on top of the first. Pressing × closed the top one; the bottom one still
covered the page. Press again.

The theme's own architecture settles the honest fix: `main.js` has **no**
lightbox section (its 14 sections end at pills/scrollBy; lightbox is its own
`assets/js/lightbox.js`, enqueued `is_singular()` in enqueue.php:169-193).
The folded §11 copy is deleted from `article.js` with a tombstone comment
explaining why; the verbatim module import remains. Gate assertions now
enforce the single bind (`article.js` must contain no `lbInit|lbBuild|lbOpen|
lbOverlay` and no `createElement('div')…gl-overlay` overlay-builder).

After: one click → `overlays: 1, open: 1`. One × press → `gl-open` removed,
`body.style.overflow` unlocked. (The lazy-built overlay node remains in the
DOM after close — that is the theme's own behaviour, not a leak.)

## 2. "Too close" — the §48 utilities were never extracted

The v0.4.2 spacing matrix measured box **heights** and every box matched.
King's screenshots showed the *margins between* boxes — the untested
dimension. A new gap probe (`gap-probe2.py` / `accept-v043.py`) measures
`next.top − prev.bottom` for the real stack, and the first run found it:

```
pair                LIVE gap  PORT gap       Δ
discl -> body          24.0       0.0   -24.0  <-- DIV
```

Live WP renders the disclosure with `class="discl mb24"` — the theme's
LAYOUT UTILITIES section (style.css:2966-2982) — giving 24px below before
the body. The port's served bundle had **no `.mb24` rule at all**: the
article.css extraction had carried §48's first four rules (`.con/.g2/.g3/
.sb-layout`, style.css:2966-2970) and stopped — the rest (`.sg .mt20 .mt40
.mt48 .mb12 .mb20 .mb24 .flex .aic .jsb .g16 .fw3 .fz11/12/14 .cm-c .cd
.lh`, plus `.cl-layout`) never landed. Same story for `.abio.mt20` (author
box 20px top gap) and the related section's `.mt40`.

And the fix had to be global, not article-scoped: 14 non-article templates
(home, category, author, tools, legal pages) use the same utilities, and the
theme ships them in the one global stylesheet. Installed in `base.css`
(imported by Layout.astro on every page); the article.css §3.2 block now
points at it. An audit of the rebuilt dist confirms all 54 built pages carry
every utility.

### Measured after the fix (390px, dark, port vs live)

```
toc   ->discl    live=  20.0  port=  20.0  Δ= +0.0
discl ->body     live=  24.0  port=  24.0  Δ= +0.0
body  ->share    live=  28.0  port=  28.0  Δ= +0.0
share ->abio     live=  20.0  port=  20.0  Δ= +0.0
abio  ->related  live=  64.0  port=  64.0  Δ= +0.0   (.mt40 + heading margin)
0 divergent pairs
```

## Proof screenshots

- `v043-gaps-fixed.png` — disclosure/TOC/body at phone width with live-matched gaps
- `v043-lightbox-single.png` — the single-overlay lightbox open

## Verification record

- Gate: article gate **120/120** (4 new assertions: single-bind ×2, global
  utilities ×2); 5/5 gates green.
- Acceptance probe: single overlay + one-press close + gap chain, all PASS.
- Build: 54 pages, all carrying §48 utilities (audited programmatically).
- Served-bytes check to follow the Pages deploy (cover markup, lightbox
  bundle, utilities in the inline CSS).
