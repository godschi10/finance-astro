# 07 — Base and forms layers: the phone-review fixes

Release **v0.3.1**. Source of truth: `gwill-finance-theme` **1.13.39**
`style.css`, sections 2 (RESET / BASE) and 46 (FORMS).

Reported from a phone screenshot of the live staging URL, 2026-09-23:
"so many places have underline link which looks visually unappealing. Also the
newsletter from is unstyled. Fix all."

Both symptoms had one shape: the port's extractions were scoped to the
stylesheet sections the homepage renders, and the theme keeps anchors and form
controls in other sections. Measured on both sides before touching anything.

## Defect 1 — links underlined

| | port (before) | port (after) | WordPress |
| --- | --- | --- | --- |
| underlined links | **79** of 109 | **2** of 109 | 3 of 128 |
| which | hero CTAs, all 7 pills, badges, `Read →`, card titles, nav, footer links | `.fcredit-link` ×2 | `.fcredit-link` ×2 + `.gconsent-link` |
| `a { text-decoration }` | inherit (browser default) | none | none |

Cause: `style.css:186` — `a { text-decoration: none; color: inherit; }` — lives
in the theme's RESET/BASE section, which no port had ever installed. Every real
link fell back to the browser's default underline.

**Why four earlier measurement passes missed it:** Chrome only underlines `a`
elements that carry an `href`. The probe that measured the base state appended
an anchor *without* an `href` to `document.body`, which computes to
`text-decoration: none` — the same value WordPress reports — while all 109 real
links on the page were underlined. The lesson: probe the elements the page
actually has, not a synthetic one.

WordPress's own 3 underlined links are deliberate (`.fcredit-link` sets
`text-decoration: underline` and a gold `text-decoration-color`;
`.gconsent-link` likewise). Removing the default changes nothing about them.

## Defect 2 — the newsletter field was a browser-default box

Measured at 390px, `.nl-s` email input (the visible field, `name="gwill_email"`):

| property | port (before) | port (after) | WordPress |
| --- | --- | --- | --- |
| box | 175×19 | **300×46** | 261×46 (narrower container) |
| border-radius | 0px | **10px** | 10px |
| border | 2px `rgb(118,118,118)` | **1px `rgba(245,158,11,0.4)`** | 1px |
| padding | 0px | **12px 16px** | 12px 16px |
| font-size | 13.33px | **16px** | 16px |
| background | `rgb(255,255,255)` | `rgb(19,18,16)` | dark |
| height | 19px | **46px** | 46px |

Cause: the homepage rules only override that field's **colours**
(`.nl-s .gwill-form input[type="email"] { background / border / color }`) and
take its geometry from the theme's FORMS section (`style.css:2889-2894`:
`width: 100%; padding: 12px 16px; height: 46px; border-radius: var(--r-md);
font-size: 16px`), which was not installed.

The honeypot label confirms the same fix from the other direction: it now
measures 261×18, 11px/700/uppercase/`display: block`, which is exactly what the
WordPress original measures for the same element.

## Defect 3 — the label WordPress hides was visible

The form's "Email" label carries `class="screen-reader-text"` in both the theme
and the port. WordPress hides it with `style.css:191-194` (also in the BASE
section); the port had a different utility (`.sr-only`) and never defined this
one, so the label rendered as an uppercase `EMAIL` line above the field.
Measured: **300×18 visible → 1×1 hidden**.

## What was installed

- **`src/styles/base.css`** — the BASE rules the port was missing:
  antialiased text (`:172-173`), the anchor reset (`:186`), control font
  inheritance (`:188-189`), and the visually-hidden utility + its focus reveal
  (`:191-198`). Imported *before* the component stylesheets so components keep
  winning.
- **`src/styles/forms.css`** — the FORMS section verbatim (`:2883-2948`):
  field spacing, control geometry, textarea, the brand select chevron,
  autofill guards (light + dark), the focus ring, label styling, required /
  hint chrome, submit base + hover + active + the `[data-loading]` swap,
  status and field-error chrome, and the honeypot rule.
- The three form rules that had been sitting in `home.css` as an ad-hoc
  addition — the hidden "Subscribing…" label, the `[data-loading]` swap and the
  honeypot — **moved** to `forms.css`. They were the only part of that section
  anyone had noticed, which is exactly why the rest of it went missing.

Gate: **123 assertions** in `scripts/check-homepage-fidelity.mjs`, of which 17
are new — each pins one moved or added rule in the file that now owns it, plus
two guards: the anchor reset exists, and no `text-decoration: underline`
declaration may appear anywhere in `base.css`.

## Regression check after adding two site-wide layers

Geometry re-measured on the rebuilt page at all three widths — unchanged from
the v0.3.0 build, and unchanged against WordPress:

- 390 — `.g3` `350px` single column gap 16, `.bh`/`.bhg` `350×45`, submit `300×46`, strip `has-overflow can-next`, overflow 0
- 768 — `.g3` `348px 348px`, CTAs `212×45` / `144×45`, submit `105×48`, overflow 0
- 1280 — `.g3` `324px 324px 324px` gap 16, `.feat` `501px 501px`, submit `105×48`, overflow 0
- Behaviour probes unchanged: filter (Investing → 1 card + `aria-pressed`, active pill no-op, All → 7), honest newsletter submit, no navigation.

## Not in scope here (tracked as M-BASE-LAYER)

The BASE section also carries element resets that would re-flow pages already
measured and reviewed: `* { margin: 0; padding: 0 }`, `img { display: block }`,
`max-width: 100%` on img/iframe/table, and heading letter-spacing. They are
deliberately **not** installed; each needs its own measurement pass per page.

## Still unverified

- Dark theme on the homepage, and the same two layers' effect on the pages that
  are not yet ported (articles, tools, legal) — those pages render fine in
  Chromium at the three widths but have not been pixel-compared to WordPress.
- WebKit / Firefox.
