# 09 — Base layer (v0.3.4)

## What this is

The port was built surface by surface: header first, then footer, then the
homepage. Each of those releases measured only the stylesheet sections its own
surface rendered, so the theme's base layer — `style.css` section 2,
`RESET / BASE`, lines 170–199 — was never installed. `base.css` existed from the
v0.3.1 pass but carried a deliberately small subset: the `*` reset, the anchor
reset, control font inheritance, the visually-hidden utility and the `html`
scroll behaviour. It also carried a written argument for leaving the rest out:
those rules "would re-flow pages already measured and reviewed".

That argument was correct while nothing needed them. It stops being correct the
moment the single-post page is ported at parity, because parity on an article
means the theme's base layer underneath it. So the remaining rules land first,
as their own release, with the risk the earlier note was protecting against
measured rather than assumed.

## The gap, line by line

| theme line | rule | port before v0.3.4 |
| --- | --- | --- |
| `style.css:171` | `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }` | present (v0.3.1) |
| `style.css:172` | `html { overflow-x: clip; scroll-behavior: smooth; scroll-padding-top: … }` | present (v0.3.1) |
| `style.css:173` | `[data-theme="dark"] { color-scheme: dark }` | present (theme block) |
| `style.css:174-183` | `body { font, bg, colour, antialiased, overflow-wrap, line-height }` | present (except the theme-switch `transition`) |
| `style.css:184` | `img, picture, video, canvas, svg, iframe, input, textarea, select, table { max-width: 100% }` | **missing** — only `img` was capped |
| `style.css:185` | `img { height: auto; display: block }` | **missing** the `display: block` half |
| `style.css:186` | `a { text-decoration: none; color: inherit }` | present (v0.3.1, the anchor reset) |
| `style.css:187-188` | `button`, `input, select, textarea { font-family: var(--font) }` | present (v0.3.1) |
| `style.css:189` | `h1, h2, h3, h4 { letter-spacing: -0.02em }` | **missing** |
| `style.css:190-198` | `.skip-link`, `.screen-reader-text` | present (v0.3.1) |

Three rules, therefore. All three are installed verbatim in
`src/styles/base.css`.

The `body` theme-switch `transition: background var(--t-md), color var(--t-md)`
is the one rule in the section still not ported, and deliberately: the port
paints the stored theme before first paint, so animating `background`/`color`
would animate the initial correct paint — a visible flash on load that the
theme's own markup does not have to worry about the same way. It is a candidate
for a later pass with its own before/after capture, not a silent addition.

## Why the rules matter

- **`max-width: 100%` on every replaced element.** The port capped only `img`.
  A `<video>`, an `<iframe>` embed or a wide data table could therefore overflow
  a phone column. The theme never allows that; the article port is about to bring
  exactly those elements in.
- **`img { display: block }`.** Inline images sit on the text baseline and add a
  few pixels of descender gap beneath them. WordPress does not have that gap.
- **`h1, h2, h3, h4 { letter-spacing: -0.02em }`.** The theme's global heading
  tracking. Component headings that set their own tracking keep it — a class
  beats an element selector — so this only reaches headings the port had left at
  the browser default.

## The evidence

Asserting "no visual change" is not evidence. The same commit was built twice —
CSS at `HEAD`, then CSS with the three rules — the two trees were served on
separate local origins on the same machine, and both were measured by the same
harness in the same session.

- harness: `~/work/regression/measure.py` (Chrome 153 over CDP, 390×844 /
  768×1024 / 1280×900, device-metrics override per width)
- pages: `/`, `/articles/`, `/articles/cheapest-way-receive-dollars-nigeria/`,
  `/about/`, `/affiliate-disclosure/` — 15 page/width combinations
- captured per combination: document height, horizontal overflow, header and
  footer height, the computed font-size/letter-spacing of every heading on the
  page, `<img>` count and how many are `display: block`, section order and
  offsets, card-grid geometry, the article elements, and the underlined-link
  count the anchor reset governs

**Result: the served byte diff is exactly +143 bytes — the three rules and
nothing else — and the layout diff is 0 fields across all 15 combinations.**

Cross-checked against the real site: the live v0.3.3 baseline was captured
*before* the change, and re-measured *after* publishing. `/ @768` reads 4209px
in both, and the live before/after diff is likewise 0 fields. That agreement is
what rules out "nothing changed because both runs were stale".

## The outlier, recorded

The first old-build pass measured `/ @768` at 4159px against the new build's
4209px — a 50px difference on one combination. Re-running that single
combination four times on *each* build returned 4209 every time, so the first
reading was a flaky render (a reveal/settle timing artefact in that pass), not a
layout shift. Recorded here because a measurement that disagrees with itself is
worth writing down, not quietly re-running until it looks right.

## The honest limit

The port renders **no `<img>` elements at all** on those five pages today —
card and hero art is CSS. So `display: block` cannot move anything yet; it is
installed for the article page, which is where real images arrive. The A/B proves
the rules are inert on today's pages; it does not prove they are inert on pages
that do not exist yet. That proof comes with the article port, against the WP
article page as the oracle.
