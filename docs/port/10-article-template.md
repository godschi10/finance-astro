# 10 — The article page, ported from `single.php` (v0.4.0)

## What was wrong before this

The article page existed, but it was not a port. It was a page I designed in the
theme's *general* idiom and then called done: an `.art-h` heading where WordPress
has `h1.art-t`, a `.disc-box` where WordPress has `.discl`, `.author-bio` where
WordPress has `.abio`, "Keep reading" where WordPress has "Related Articles", a
`.g3` three-up grid where WordPress has `.g2`, a `.legal-toc` re-used from the
legal pages, and — worst of it — a visible *"Comments — read-only in v1"* box,
the kind of staging notice the porting rules forbid outright. Nothing about that
page could be checked against WordPress, because almost no class name on it
matched.

The port's own gate asserted the stub's contract, which is how a page can pass
its tests while being wrong about the thing that matters.

## The source of truth

Everything on the rebuilt page comes from the theme, cited line by line in
`~/work/article-port/01-article-markup.md` (755 lines) and its three siblings:

| Spec | Contents |
|---|---|
| `01-article-markup.md` | markup skeleton in source order, every conditional with its option name and default, byte-exact copy strings, share-URL construction, TOC internals, sidebar order, "what is dynamic" inventory |
| `02-article-css.md` | the article CSS slice, verbatim, with `style.css` line provenance, grouped by media query, dark overrides, and a no-rule-found list |
| `03-article-js.md` | the article behaviours with `main.js` line references |
| `04-live-oracle.md` | the live WordPress article measured at 390/768/1280, DOM captures, asset inventory, screenshots |

The class vocabulary is now WordPress's, so the theme's own stylesheet applies
to it unchanged: `article.css` is the theme's rules copied verbatim, not adapted.

## What the page is now

In source order, exactly as `single.php` emits it:

`.prog > .prog-f` → `.con[padding-bottom:48px]` → `.sb-layout` (the theme's
`1fr 300px` grid) → left column with an `.art-hd` header (`.bc` breadcrumb →
`.badge` → `h1.art-t` → subtitle → `.art-meta`) → `.art-reading-surface` →
`.art-surface-pad` (mobile TOC dropdown, `.discl.mb24`, `.art-body`,
`.share-row`, `.abio.mt20`) → `.mt40` related block → `.m-nl-wrap`; then
`aside.article-sidebar[position:sticky;top:72px]` carrying the TOC `.sw` card,
the square-ad `.sw` box and the digest `.sw` card.

Copy is byte-exact, including the punctuation the theme chooses: the affiliate
sentence with the period *inside* the `<strong>`, `In this article` (lower-case)
in the mobile summary against `In This Article` in the sidebar, `Weekly digest.`
with its period in both newsletter blocks (which is what the live site serves,
because the ACF field is set there), and the ⚠ mark at U+26A0 with no variation
selector.

## The judgement calls, stated plainly

1. **`.art-sub` stays.** It is the one element on the page that WordPress does
   not have, and King asked for it. It sits between `h1.art-t` and `.art-meta`,
   designed in the theme's idiom (`docs/port/08-article-subtitle.md`).
2. **`.art-cover` is absent.** WordPress emits it only when
   `has_post_thumbnail()` is true (single.php:106). No port article has a
   featured image, so WordPress would omit it too — that is parity, not a
   missing feature, and the day a post has a featured image the wrapper should
   come back with it.
3. **No ad slots.** `gwill_finance_ad_slot()` emits nothing when ads are off or
   no code is configured, and the live article serves nothing at all four
   left-column and comment slots. Emitting an empty shell would be inventing
   markup WordPress does not send.
4. **No `.comments-area` block.** It is gated on
   `comments_open() || get_comments_number()` and, on the live site, filled by
   the Vibe Comments plugin. This build has no comment backend; a form that
   cannot post is a fake control, so the block is absent by design. Tracked in
   PENDING-WORK.md rather than papered over.
5. **The sidebar's empty `.sw` square-ad box is kept.** WordPress serves exactly
   that — a wrapper with an inline style and nothing inside — whenever no square
   ad code is configured. It is one of the few places where faithfulness and
   tidiness disagree, and faithfulness won.
6. **`.abio-t` prints the port's authored bio, not the theme's fallback
   sentence.** The theme's logic is "the author's description, else a fixed
   sentence"; this port's author *has* a description, so the theme's logic
   prints it. The fallback sentence is preserved in the template for authors
   without one. Swapping to the sentence is a one-line change if King prefers
   the exact live-site text.
7. **Avatars point at the author's Gravatar**, with the theme's own
   `d=wavatar&r=g` query and 2x srcset, because that is what `get_avatar()`
   produces and the page would otherwise lose a real visual element.

## The three divergences the first measurement caught

Running the same probe against the port and the live article at 390/768/1280
found three real differences. All three are fixed:

1. **The copy button was 30px tall against WordPress's 27px.** Cause: an
   invented `button { font: inherit }` in the layout, which forced
   `line-height: 1.6` onto every button in the port. WordPress leaves the
   browser's default (`normal`) in place because the theme only ever sets
   `font-family`. Replaced with `font-family: inherit; font-size: inherit`, and
   verified: every button on the homepage now matches WordPress exactly
   (`.btn b-gold b-sm` 32px/17.6, `.gwill-form__submit` 46→48, `.fpush` 40/13).
   This cost the homepage 3–4px of document height — movement *toward*
   WordPress, which is why it was kept rather than reverted.
2. **`.art-body` paragraphs carried `max-width: 72ch` and `margin-top: 12px`**,
   and every `.art-body h2` wore a 48×3px gold `::before` bar **that WordPress
   does not draw**. Cause: the port's own prose rules lived in `Layout.astro`, so
   they applied to the article page too. They moved to `src/styles/prose.css`,
   imported by the two pages that still want them (about, contact) — a verbatim
   move, and both pages measure byte-identical afterwards (2731/2164/1930 and
   2750/2288/1789 unchanged).
3. **Two missing CSS tokens** (`--red-muted`, `--red-border`) that the theme's
   `.brd` badge rule needs; the port had only `--red`. Installed with the
   theme's own light and dark values, and the port's redundant literal-rgba
   `.brd` copy was removed so the verbatim rule owns the badge.

## Evidence

Same harness, same widths, both pages:

- **Behaviour** — reading progress fills on scroll; the sidebar TOC moves `.cur`
  to the current section; the mobile summary toggles `.toc-open` +
  `aria-expanded` and hides the list; the copy button reports through the
  theme's own strings. On a fresh profile the dropdown's default is
  `toc-open` + `aria-expanded="true"` + list visible on both the port and
  WordPress, and after one click both store `closed`, set `aria-expanded="false"`
  and hide the list. *(An earlier run appeared to disagree — that was my own
  harness leaving `closed` in localStorage from a previous toggle test. Worth
  recording so nobody re-finds it.)*
- **Geometry at 390/768/1280** — identical for the `h1` font-size, line-height,
  letter-spacing and column width; `.art-meta` styling; the 20px header avatar;
  `.discl` background, border, radius and padding; `.art-body` font-size,
  line-height and width; `.share-b` padding, radius, border and font-size; the
  48px `.aav`; `.sw` padding, border and radius; the `.toc-i` row geometry; and
  the `.g2` columns (350px / 211+211 / 328+328).
- **What legitimately differs** — `h1` height (my article's title is longer, so
  it wraps to more lines at the same width), the `.art-meta` row height (the
  WordPress post carries an `Updated Aug 2026` fragment; mine has no differing
  modified date, so the conditional correctly emits nothing), and the `.abio`
  height (my bio text is longer than the theme's fallback sentence).

## What is still not ported

- **Comments.** No backend, so no thread, and no comment-ad cloning (the JS
  ports that behaviour guarded, but it is inert until comments exist).
- **Ad slots** stay empty until ad code is configured — which matches WordPress.
- **The article-page slice of the tablet rules** (`@media (max-width: 1023px)`)
  and any rule the CSS spec listed as "no rule found".
- **The blog import itself**: the WP posts still have to be imported into
  `src/content/articles/`.
