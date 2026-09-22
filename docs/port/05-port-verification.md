# Footer port — verification record

Release: **finance-astro v0.2.0** · Source of truth: `gwill-finance-theme` **1.13.39**
(`footer.php`, `inc/footer-links.php`, `style.css` section 19 + the responsive/touch
blocks that touch footer classes) · Date: 2026-09-22.

The bar for this port was: the rendered footer must be indistinguishable from the
WordPress one, and every claim about it must come from a measurement, not from
reading the source.

## 1. What was ported

| WP section | What it is | Where it lives now |
| --- | --- | --- |
| 2 | desktop grid `.footer > .ftop` — brand column + 3 link columns | `src/components/Footer.astro` (desktop block) |
| 2b | follow CTAs `.ffollow` — bell, Google News, install, iOS guide | same |
| 3 | social nav `.fsoc > .soci` × 4 | same |
| 4 | bottom bar `.fbot` — ©, credit, legal links, back-to-top | same |
| 5 | phone footer `.mfooter` — brand, 2×2 grid, socials, CTAs, `.mfbot` | same |

CSS: `src/styles/footer.css` — 94 lines, 65 rules: the footer slice of stylesheet
section 19, WP §49's tablet padding, §54's touch rule, and the print block.
Custom properties it depends on (`--dark`, `--dark-2`, `--dark-b`, `--dark-dim`,
`--gold-b`, `--con-pad`, `--r-sm`, `--t`) come from `Layout.astro`'s token block,
which already carries the light/dark variants.

Icons: every footer glyph is the theme's own SVG path, copied verbatim — the four
socials via the `social_svg()` helper, plus Google News, install, iOS-home and the
bell. They are injected with `<Fragment set:html={…} />` (see defect 1).

## 2. How it was checked (weakest → strongest)

### 2.1 Source gate — `scripts/check-footer-fidelity.mjs`, 64 assertions

Pins markup structure, exact copy, class names per section, the CSS values of
every footer rule, the responsive contract, the icon-escape guard and the print
rules. `npm run check` → **3/3 gates green** (vectors 95/95). The gate collapses
whitespace before matching, so the assertions stay readable while remaining exact
about values and order.

### 2.2 Rule diff — `docs/port/footer-css-diff.py`

Parses WP `style.css` into `(media context, selector, declarations)` triples,
keeps every rule touching a footer selector (**138 rules**), and reports which the
port's 59 rules do not reproduce. Result:

- **1 real gap:** `@media (max-width: 1023px) { .footer { padding: 36px var(--con-pad) 20px } }`
  (WP §49) — not ported. → **fixed** (it was exactly the +12px seen at 768px).
- 3 "absent" selectors that are not gaps: `.soci` (the header/search-overlay
  variant of the class, not used outside the footer in this port), and the two
  grouped visibility rules `.sh, .footer` / `.mh, .mfooter, .mno` — the port
  splits those across `header.css` and `footer.css` and renders identically
  (verified live: `display` flips at 767/768 on both).
- everything else absent is out of scope by decision (see §5).

### 2.3 Measurement — built site vs the live WordPress site

Same browser session, same viewport, same eval, alternating between
`http://127.0.0.1:8899/finance-astro/` (fresh build) and
`https://finance.fitnesslova.qzz.io/`.

| Viewport | `.ftop` grid template | `.fpush` | `.fgooglenews` | `.soci` | `.fbot` | overflow |
| --- | --- | --- | --- | --- | --- | --- |
| 1280px | `435.188px 217.609px 217.594px 217.609px` — **identical** | 234×40 | 203×40 | 34×34 | 1184×37 | 0 |
| 768px | `340px 340px` — **identical** | 234×40 | 203×40 | 34×34 | 712×65 | 0 |
| 390px | 2×2 `165px 165px` — **identical**; `.mfgrid` 350×290 | 234×40 | 203×40 | 34×34 | — | 0 |

Colour/type tokens also match exactly: `.soci` `rgb(19,18,16)` on
`rgb(143,133,117)` with a `rgb(33,31,26)` border and 8px radius; `.fct` 9px/700
with 1.8px letter-spacing in `rgb(240,237,230)`; `.fl` 12px/300; `.fpush`
`rgb(245,158,11)` text on `rgb(19,18,16)` with a `rgb(252,217,122)` border,
10px/16px padding, 10px radius, 13px/700; `.ftag` 12px/300/1.75;
`.fbot` 1px top border + 20px padding-top.

Footer height: **461px @1280** = 48 + 312 + 40 + 37 + 24, **667px @768** =
36 + 506 + 40 + 65 + 20 — both are exactly the WordPress stylesheet's own
arithmetic, i.e. the port reproduces the sheet, not an approximation of it.

## 3. Deltas versus the live site, and why neither is a defect

1. **Footer is 20–24px taller than the live one.** The live site has a docked ad
   bar, so `body.ad-sticky-bottom .footer { padding-bottom: inherit !important }`
   zeroes the footer's bottom padding there. The port has no ad bar, so WP's
   designed padding applies. Keeping WP's base padding is the correct behaviour.
2. **Phone footer is 74px taller (770 vs 696).** Two parts: the same 24px ad-bar
   padding, plus 50px because the port's install CTA is genuinely **visible** —
   the build is an installable PWA, so Chrome fires `beforeinstallprompt` and the
   theme reveals the third CTA (one 40px row + the 10px flex gap). The live WP
   render never qualified for the prompt in the same headless browser. Button
   sizes and the follow-row gap are identical (234×40, 203×40, gap 10px).

## 4. Defects this process caught

1. **Escaped icons rendered as page text.** `{ICON.bell}` — and `install`, `ios`,
   `gnews`, in both footers — were interpolated without `set:html`, so Astro
   escaped the markup and four buttons printed literal `&lt;svg …&gt;`. Visually
   the bell boxed 320×178 instead of 234×40. Caught by the first measurement pass
   (children reported as text nodes), not by reading the file. Fixed with
   `<Fragment set:html={…} />` on all ten interpolations, and the gate now fails
   if a bare `>{ICON.x}` returns.
2. **Missing tablet padding rule** (see §2.2) — +12px at 768px.
3. **Stuck hover on touch.** No `@media (hover: none)` reset meant a tap left the
   social button in its hover state on a phone. WP §54 ported.
4. **A dead CSS branch was avoided.** `[data-push-state="unsupported"]` exists in
   the WP stylesheet but its JS never sets it (only `on`/`off`), so the port does
   not fake an "unsupported" bell. Instead the bell renders exactly as WP does and
   explains, on tap, that push needs a backend.

## 5. Deliberately not ported

| Omitted | Why |
| --- | --- |
| section 6 — consent banner (`gconsent`, storage key, accept/decline) | needs a consent/analytics backend; separate component |
| section 7 — sticky ad bar (scroll trigger, dismissal key, `@keyframes ad-sticky-in`) | needs an ad service |
| bell push panel (`.gwill-bell-panel`, `.gbp-*`, `@keyframes gbp-*` / `gwill-spin`) | needs a push service |
| `body.ad-sticky-*` footer padding rules | activate only with the ad bar |
| `.fs-lg` footer variants | part of the `.fs-lg` font-scale system, not ported |
| `.no-flex-gap` footer fallbacks | inert without the WP theme's old-Safari JS class |

All are tracked in `PENDING-WORK.md`.

## 6. Reproducing the checks

```bash
cd ~/work/finance-astro
npm run check                                   # 3/3 gates, 64 footer assertions
python3 docs/port/footer-css-diff.py            # rule diff vs WP style.css

npm run build
cp -a dist ~/.hermes/cache/scratch/serve/finance-astro   # preview mount
# (python3 -m http.server 8899 in that serve dir if it is not already up)

export AGENT_BROWSER_EXECUTABLE_PATH=~/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome
agent-browser --namespace fin5 open "http://127.0.0.1:8899/finance-astro/"
agent-browser --namespace fin5 set viewport 390 844
agent-browser --namespace fin5 eval '<the footer measurement expression>'
python3 docs/port/summarise-parity.py           # table + port-vs-WP comparison
```

Note: `browser_exec` refuses loopback addresses (SSRF guard) — local previews need
`agent-browser` or raw CDP. If evals suddenly time out, the daemon's browser is
wedged; a fresh `--namespace` gets a clean one.
