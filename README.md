# finance-astro

Static port of the **GWill Finance** WordPress theme (the Nigerian personal-finance
blog) to [Astro](https://astro.build). Same gold-on-dark identity, same header
contract, same calculator engines — served as a static bundle instead of PHP.

**Live (staging branch):** https://godschi10.github.io/finance-astro/
**WP original (parity target):** https://finance.fitnesslova.qzz.io/

## Source of truth

The WordPress theme lives at `gwill-finance-theme/` (production:
`/var/www/finance/wp-content/themes/gwill-finance-theme/`). This repo is a **port**,
not a redesign: where the two disagree, the WP theme wins unless the CHANGELOG
records a deliberate, reasoned divergence.

## Commands

```bash
npm install
npm run build     # astro build → dist/ (53 pages)
npm run check     # ALL gates: header-fidelity contract + PHP-vector parity
npx astro dev     # local dev server
```

`npm run check` is the release gate. It runs every gate in `scripts/` and exits
non-zero if any of them fail, so a green build alone never means "shippable".

### Gates

| Gate | What it proves |
| --- | --- |
| `scripts/check-header-fidelity.mjs` | Every MUST clause of the WP header port spec — brand, theme pill, search spotlight, ticker, nav nesting, the **responsive show/hide contract**, and the theme pill's **focus-return discipline** (a plain `.focus()` in a sticky header drags the page up on tap). |
| `scripts/check-footer-fidelity.mjs` | The footer port: WP `footer.php` sections 2–5 plus the footer slice of stylesheet section 19 — markup and copy, class-by-class CSS values, the responsive contract (`≤767px` phone / `≥768px` desktop), the icon-escape guard, and the print rules. 64 assertions. |
| `scripts/check-homepage-fidelity.mjs` | The homepage port: WP `front-page.php` sections 2–8, `template-parts/content.php`, `inc/card-media.php`, the homepage slice of the stylesheet, plus the BASE and FORMS sections in their own files — section order, class vocabulary, byte-exact copy, the pill-strip/filter contract, the static-build divergences, the anchor reset, and the control geometry measurement had to fight for. 123 assertions. |
| `scripts/check-article-fidelity.mjs` | The ported single-post page (`single.php`): the title stack in WordPress's order (`.art-hd` → `.bc` breadcrumb → `.badge` → `h1.art-t` → the **net-new subtitle** → `.art-meta` in its `F Y` / `N min read` / conditional-updated shape), the page scaffolding (`.prog`, `.con`, `.sb-layout`, `.art-reading-surface`), the mobile TOC dropdown, the byte-exact disclosure and share row with all four controls, the `.abio` author box and its generated social icons, the `.mt40`/`.g2` related block, both newsletter blocks, the sidebar's three `.sw` cards, plus the rules that keep it honest — the theme's stylesheet is installed verbatim, the forbidden staging notice stays out, heading ids are server-rendered, the port's own prose no longer leaks into the article page, markdown tables get Gutenberg's `<figure class="wp-block-table">` wrapper, the embed facade stylesheet ships with the article, the ≥1024 media block keeps the theme's source order, and the Gutenberg showcase carries every block class. 106 assertions. |
| `scripts/vectors-check.mjs` | Every TypeScript calculator engine reproduces the PHP engine's numbers, vector-for-vector, against the PHP truth oracle in `scripts/php-harness/vectors.json`. |

All five are wrapped by `scripts/check.mjs`.

## Layout

```
src/layouts/Layout.astro      # chrome: <head>, tokens, header, footer, inline scripts
src/components/Header.astro   # desktop + mobile headers (WP header.php)
src/components/Footer.astro   # desktop + phone footers (WP footer.php sections 2–5)
src/components/ArticleCard.astro  # WP card anatomy (inc/card-media.php + template-parts/content.php)
src/components/NewsletterForm.astro  # WP template-parts/forms/contact-newsletter.php, id passed in like wp_unique_id()
src/components/AuthorSocials.astro   # GENERATED from inc/author.php — the article author box's icon row
src/pages/index.astro         # homepage (WP front-page.php sections 2–8)
src/pages/articles/[slug].astro  # article page (WP single.php), on WP's class vocabulary
src/scripts/article.js        # article behaviours ported from the theme's main.js
src/styles/article.css        # the article slice of the theme stylesheet, verbatim
src/styles/prose.css          # the port's own .art-body prose, for about/contact only
src/styles/header.css         # header/ticker/search/theme-pill styles + responsive blocks
src/styles/home.css           # homepage slice of the theme stylesheet, source order kept
src/styles/base.css           # WP stylesheet section 2 (RESET/BASE): full base layer — `*` reset, anchor reset, replaced-element max-width, img block, heading tracking, control fonts, hidden utility
src/styles/forms.css          # WP stylesheet section 46 (FORMS): control geometry, labels, submit/status chrome
src/styles/footer.css         # footer grid, CTAs, socials, bottom bar + responsive/touch blocks
src/lib/                      # calculator engines (TS ports of inc/*.php)
src/pages/                    # routes: home, articles, tools/*, amount pages, legal
src/data/site.ts              # nav tree, ticker pairs, categories (badge/art/chip), page config
scripts/php-harness/          # PHP truth oracle + generator (vectors.php, stubs.php)
docs/port/                    # per-port verification records + rule-diff tooling
docs/evidence/                # screenshots proving responsive behaviour per breakpoint
```

## The PHP oracle

`scripts/php-harness/vectors.php` runs the *actual* PHP engines from the WP theme
and dumps JSON reference values; `vectors.json` is that frozen snapshot, committed.
The TS gate compares against it.

Two consequences worth knowing before you touch either side:

1. **The oracle is a snapshot of a live clock.** `gwill_fx_history_range()` windows
   on `strtotime('-N days')`, so its point counts encode the instant it was
   generated. The TS gate therefore pins `HIST_ORACLE_MS` in `vectors-check.mjs` to
   that instant — regenerate `vectors.json` and you must bump that constant in the
   same change.
2. **`vectors.php` expects the theme's `inc/` on disk.** Its `$INC` path is
   machine-specific; adjust it when running the generator on a new box.

## Deploy

Two branches, both on `origin` (GitHub — no GitLab remote exists for this repo):

- `main` — source of truth.
- `pages-dist` — the built `dist/` mirror that GitHub Pages serves. Rebuilding and
  pushing it **is** the staging deploy; keep `public/.nojekyll` in place or Pages
  skips the underscore-prefixed `_astro/` assets.

Verify a deploy against the served bytes and the Pages build for *your* commit —
a green push is not a live fix.
