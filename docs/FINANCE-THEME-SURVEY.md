# Finance Theme Survey → Astro Conversion Spec

Surveyed: `/home/ubuntu/gwill-finance-theme/` (GWill Finance v1.13.39, WP 6.0+, PHP 7.4–8.3).
Live: finance.fitnesslova.qzz.io. Tagline: "Nigerian money. Explained."
Precedent port: `/home/ubuntu/portfolio-astro` (static Astro, `output:"static"`, `compressHTML`, `inlineStylesheets:'always'`).

## 1. Full template map

| WP template | Hierarchy role | Astro equivalent |
|---|---|---|
| `front-page.php` | Static front page (`page_on_front` = `home`) | `src/pages/index.astro` |
| `home.php` | Posts page (`page_for_posts` = `all-articles`) | `src/pages/articles.astro` |
| `single.php` | Single post | `src/pages/articles/[slug].astro` |
| `archive.php` | Category archives | `src/pages/category/[slug].astro` |
| `author.php` | Author archive (avatar+bio+socials+grid) | `src/pages/author/[slug].astro` |
| `search.php` | Search results (+Google-style did-you-mean) | `src/pages/search.astro` (client-side index) |
| `404.php` | 404 (ACF-editable copy via `404-settings` page) | `src/pages/404.astro` |
| `page.php` | Generic page fallback | `src/pages/[page].astro` / content collections |
| `attachment.php` | Attachment view | Drop (redirect to file URL) |
| `index.php` | Ultimate fallback | N/A |
| `comments.php` | Core comments shell | Replace (see Risks R1) |
| `searchform.php` | Search form partial | Astro component |
| `sitemap.php` (+`inc/sitemap.php`) | Theme-owned `/sitemap.xml` | Astro `src/pages/sitemap.xml.ts` endpoint |
| `header.php` / `footer.php` | Ticker+headers / 4-col footer | `src/layouts/Layout.astro` + components |
| `page-tools.php` (Finance Tools) | `/tools/` hub, 16 tool cards + 8 amount-page chips | `src/pages/tools/index.astro` |
| `page-apps.php` (Finance Apps) | `/apps/` directory, 9 ACF app-card slots | `src/pages/apps.astro` |
| `page-about.php` | `/about/` dark hero + What-I-Do grid | `src/pages/about.astro` |
| `template-contact.php` | `/contact/` routed form | `src/pages/contact.astro` (form → serverless, R2) |
| `page-newsletter.php` | `/newsletter/` Brevo capture | `src/pages/newsletter.astro` |
| `page-legal.php` ×3 | `/privacy-policy`, `/disclaimer`, `/affiliate-disclosure`, dark hero + sticky TOC | `src/pages/{privacy-policy,disclaimer,affiliate-disclosure}.astro` |
| `template-site-settings.php` | Hidden ACF anchor page (never public) | → `src/data/site.ts` constants, no route |
| 16× `page-*-calculator.php` | One template per calculator under `/tools/` | `src/pages/tools/<slug>.astro` + `src/lib/<calc>.ts` |
| `page-amount-converter.php` | ONE template serving 8 amount SEO pages | `src/pages/tools/<amount>.astro` ×8 (static, R5) |
| `template-parts/content.php`, `grid-loop.php`, `category-pills.php`, `content-none.php`, `forms/contact-newsletter.php`, `forms/contact-routed.php` | Card/loop/pill/form partials | Astro components |

Provisioned pages (self-provisioning, `inc/setup.php`): `home`, `all-articles`, `about`, `apps`, `contact`, `newsletter`, `site-settings` (hidden), `404-settings` (hidden), `newsletter-thanks`, `privacy-policy`, `disclaimer`, `affiliate-disclosure` — all under `/tools/*` calculators are child pages of `tools`.

## 2. Content model: CPTs / taxonomies / menus / widgets / shortcodes

- **CPTs: NONE.** Only built-in `post` + `page`. No migration of CPT registrations needed.
- **Taxonomies: NONE custom.** Only built-in `category` (+ tags unused in templates). Six brand categories, canonical order: `savings 🐷` / `investing 📈` / `crypto ₿` / `banking 🏦` / `remittance ✈️` / `dollar-accounts 💵`. Style map in `inc/finance-helpers.php::gwill_finance_cat_style()` → badge (`bgn/bg/bpu/bsl/brd`) + art gradient (`i-sav/i-inv/i-cry/i-ban/i-rem/i-dol`) + emoji. Fallback `💰/bsl/i-dol` for uncategorized.
- **Menus:** `primary` (desktop `.snav-list` + mobile drawer `.mno-list`, depth 3) and `footer` (currently rendered via `gwill_finance_footer_links('articles'|'apps')` groups + hardcoded Network column). Fallback `gwill_finance_default_nav()` when no menu assigned.
- **Widgets/sidebars: NONE.** Zero `register_sidebar()` calls (verified by theme's own cleanup audits). Sidebar content on single posts (TOC + ad + digest + also-read) is hardcoded template logic, not widgets — easy to port as components.
- **Shortcodes: NONE.** `add_shortcode` absent. Content uses Gutenberg blocks (all styled in `.art-body`).
- **Post meta:** `_gwill_video_url` (YouTube URL replaces featured image on single view); featured image size `gwill-hero` 1200×675 soft-crop; video embeds use click-to-play facades (`inc/embed-facades.php`).

## 3. ACF field groups (8, code-registered in `inc/acf-field-groups.php`, ~113 KB)

All optional — every `get_field` call falls back to a hardcoded default (`gwill_fh()`/`gwill_fs()` helpers). Astro port = bake defaults into `src/data/*.ts`, no CMS needed for v1.

1. `group_gwill_404_settings` — 404 title/copy/button label (page `404-settings`).
2. `group_gwill_about_page` — hero subtitle/bio, What-I-Do cards.
3. `group_gwill_apps_page` — hero copy + **9 App Card slots** (`gwill_app_slot_1..9`: name/cat/url/badge/art/emoji/desc/review-slug/stats `Label|Value|Colour` lines). Legacy pipe-parser textarea `gwill_apps_list` + hardcoded 3-app fallback (PiggyVest, Grey, Risevest).
4. `group_gwill_contact_page` — hero subtitle, contact details, work-with-me blocks.
5. `group_gwill_home_hero` — hero tag/headline/sub/CTAs/topics label.
6. `group_gwill_home_stats` — 4 stat numbers + labels (defaults: `10+` guides, `12+` apps, current year, `₦ 0` free).
7. `group_gwill_newsletter_page` — hero + benefit list + value pitch.
8. `group_gwill_site_settings` — the big one: footer about/blurb, 5 social URLs (X/IG/LinkedIn/YT/GitHub), `gwill_blog_sub`, `gwill_cat_archive_suffix` ("in Nigeria"), newsletter master/visibility toggles (`gwill_newsletter_master`, `gwill_nl_show_home`, `gwill_nl_header_cta`, `gwill_nl_footer_link`), newsletter titles/blurbs, parallel-spread option.

## 4. Token inventory (theme.json + style.css :root, ~3,470 lines / ~200 KB)

Single font: **JetBrains Mono** (self-hosted woff2, latin + latin-ext, `assets/css/fonts.css`). No Google Fonts call.

| Token | Light | Dark (`[data-theme=dark]`) |
|---|---|---|
| `--bg` | `#f7f6f2` cream | `#0d0b08` warm black |
| `--surface` / `--surface-2` | `#ffffff` / `#faf9f6` | `#131210` / `#171512` |
| `--border` / `--border-dim` | `#e4e2dc` / `#eeece7` | `#211f1a` / `#1d1a16` |
| `--text` / `--text-mid` / `--text-dim` | `#0d0d0d` / `#3a3a3a` / `#6b6b6b` | `#f0ede6` / `#c4b89a` / `#8f8575` |
| `--art-copy` / `--art-dim` | `#262626` / `#3a3a3a` | `#e8e4dc` / `#8a8070` |
| `--gold` / `--gold-b` / `--gold-btn` / `--gold-muted` / `--gold-border` | `#b45309` / `#f59e0b` / `#b45309` / `#fef9ee` / `#fcd97a` | `#f59e0b` / (same) / `#b45309` / `rgba(245,158,11,.08)` / `rgba(245,158,11,.25)` |
| `--green` / `--green-btn` / `--green-muted` | `#15803d` / `#15803d` / `#f0fdf4` | `#22c55e` / `#15803d` / `rgba(34,197,94,.08)` |
| `--red` / `--purple` / `--dark` | `#b91c1c` / `#7c3aed` / `#0d0b08` | `#f87171` / `#a78bfa` / same |

Layout: `contentSize 1200px`, `wideSize 1440px`; radii `--r-sm 6px / --r-md 10px / --r-lg 16px / --r-xl 24px / --pill 100px`; shadows `sh-sm/sh-md/sh-gold`; transitions `160ms/240ms`; `--header-h 64px`, `--con-pad 48px`. Type scale: h1 `clamp(1.75rem,4vw,2.5rem)` → h6 `1rem` uppercase; base `1rem/1.6`. Brand: `₦` gold + `gwillchijioke` wordmark (never shortened), gold→green gradient underline; `theme-color #0d0b08`; gold-on-dark scrollbar; grain-textured hero.

## 5. Homepage spec (front-page.php, section order — replicate exactly)

1. **Ticker** (`gwill_finance_ticker()`, in header): marquee `USD/NGN, GBP/NGN, EUR/NGN, BTC/USD, ETH/USD, XAU/USD`; server-rendered static values + `ticker-live.js` async refresh (8s abort, 60s client cache); pause-on-hover, press-drag scrub.
2. **Hero** (`.hero` + `.hero-grain`): tag `₦ Nigerian Finance · Honest Guides`; H1 "Nigerian money. / Explained."; sub "Savings, investing, dollar accounts, crypto… Tested by Gwill. No jargon. No AI slop."; CTAs [Browse All Articles →] (gold) + [Finance Apps] (ghost); topic chips (6 brand categories).
3. **Stats strip** (`.stat-strip`, 4× `.si`): guides / apps-reviewed / current-year / ₦0-free.
4. **Leaderboard ad slot**.
5. **Featured article** (`.feat`): `gwill_featured_post()` (Customizer `gwill_featured_post_id`, else most recent); LCP image eager+fetchpriority, else emoji art; badge, title, 32-word excerpt, `M Y · N min read · author`, Read → button.
6. **Latest grid** (`#latest`): "Latest Articles" + View-all; **client-side category filter pills** (All + 6, `data-gwill-cat`, AJAX via `inc/category-filter.php`, 10-min transients); card grid (`grid-loop`); below-grid leaderboard ad.
7. **Newsletter band** (`#newsletter`, gated by `gwill_newsletter_master && gwill_nl_show_home`): "Nigerian money news, weekly." + Free/No-spam/Unsubscribe meta + Brevo single-field form.
8. **Footer**: dark 4-col (brand+socials+push-bell+Google-News+install-app / Articles / Finance Apps / Network) + footer leaderboard ad + bottom bar (© host, "Designed & built by G-will Chijioke") + consent banner + sticky footer ad bar.

## 6. Remaining template specs

- **single.php**: progress bar → breadcrumb (Home › menu-path/category › title) → badge → H1 → meta (avatar+author, `F Y`, N min read, Updated `M Y`) → reading surface (affiliate **disclosure box**, hero, `.art-body` Gutenberg content, in-content ad, share row, author bio) → related (`inc/related-posts.php`, dive-deeper clustering) → comments → sticky sidebar (TOC from `gwill_finance_toc_items`, ad, weekly-digest form, also-read). Lightbox on images (←/→/Esc/swipe/counter).
- **home.php / archive.php / author.php / search.php**: shared `.phd` breadcrumb hero + pills + `.g3` card grid (`content.php` cards: art tile, badge, title, excerpt, meta) + `the_posts_pagination` (mid_size 2, ← Prev/Next →) + leaderboard ads. Search adds: result-count line, Google-style "Showing results for X / search instead for Y" (score ≥ 0.6), `<mark>` term highlight, "People also searched" chips, no-results "Did you mean" card.
- **page-apps.php**: dark trust hero → category tabs (derived from cards present) → app-card grid (badge, gradient art, emoji, desc, stats, review link, outbound URL) → ads. Data: 9 ACF slots → pipe textarea → 3 hardcoded defaults.
- **page-about / contact / newsletter / legal**: dark hero + content + sidebar variants; contact = routed admin-ajax form (`inc/forms.php`, needs SMTP/Brevo constants); newsletter = Brevo capture; legal = sticky TOC + gold-dot blocks.
- **Card media system** (`inc/card-media.php` + `assets/featured-templates/*.svg`): posts without thumbnails get category SVG/gradient/emoji art — reproduce as static assets.
- **PWA/push**: `manifest.webmanifest` route + `/sw.js` (site-root published) + VAPID web-push + install prompt. Astro: keep manifest + static `sw.js`; push needs a server leg (see R2).

## 7. Finance engines (17 calculators + amount pages — the heart of the port)

Pattern per tool: `inc/<name>.php` pure-PHP engine (server-renders REAL numbers for crawlers) + `page-*.php` template + `assets/js/<name>.js` client mirror (same math, no round-trip) + WebApplication+FAQPage JSON-LD + title/meta override. **Port each engine to a shared `src/lib/<name>.ts` used for both SSG pre-render and client interactivity** — this preserves the crawlable-numbers SEO property.

| # | Tool | Route slug | Engine notes |
|---|---|---|---|
| 1 | Currency Converter | `tools/currency-converter` | 16 currencies (`gwill_fx_currencies`: USD NGN GBP EUR CAD AED SAR GHS XOF XAF CNY JPY INR KES EGP ZAR); rates via `open.er-api.com/v6/latest/USD`, 30-min transient, fallback ₦1340/USD; parallel-market estimate = official × spread (default 1.045, admin-tunable) always labeled "estimated" |
| 2 | Money-Transfer Comparator | `tools/money-transfer-comparator` | MAINTAINED fee+markup table: Wise, Remitly, WU, WorldRemit, LemFi; live mid-market base from `gwill_fx_rates()` |
| 3 | Exchange Rate History | `tools/exchange-rate-history` | 30/90-day USD→NGN trend, daily-updated; `fx-history.js` |
| 4 | Naira Value (inflation/depreciation) | `tools/naira-value-calculator` | Present/future value erosion |
| 5 | Inflation Savings | `tools/inflation-savings-calculator` | Goal top-up for inflation |
| 6 | Compound Interest | `tools/compound-interest-calculator` | Year-by-year projection |
| 7 | Savings Goal | `tools/savings-goal-calculator` | Monthly amount for target |
| 8 | 50/30/20 Budget | `tools/50-30-20-budget-calculator` | Needs/wants/savings split |
| 9 | Budget Allocator | `tools/budget-allocator` | Needs-half naira buckets (rent/food/transport/data/bills) |
| 10 | Salary Tax (NTA 2025) | `tools/salary-tax-calculator` | NTA 2026 bands (0% ≤₦800k, 15/18/21/23/25%) vs old Finance-Act-2023 bands (7–24%) + rent relief (20% rent ≤₦500k) + ₦70k/mo minimum-wage exemption; old-vs-new comparison |
| 11 | Gross → Net | `tools/gross-to-net-calculator` | Reverse-solve gross from target net (pension 8%, NHF, NHIS, life, rent) |
| 12 | Loan Repayment | `tools/loan-repayment-calculator` | True APR from lender-quoted rate |
| 13 | Emergency Fund | `tools/emergency-fund-calculator` | Runway months, inflation-adjusted target |
| 14 | Dividend/ROI Estimator | `tools/dividend-calculator` | NGX stocks, DRIP year-by-year, naira |
| 15 | Crypto Profit | `tools/crypto-profit-calculator` | P2P buy/sell spread as explicit cost |
| 16 | Savings Rate Comparator | `tools/savings-rate-comparator` | MAINTAINED table (verified 2026-09-01): Renmoney 28%, PiggyVest, Cowrywise, Kuda, FairMoney, Carbon + FD/MMF benchmarks; pure-CSS bars, labeled indicative |
| 17 | Amount landing pages ×8 | `tools/100-dollars-to-naira`, `tools/1-million-naira-to-dollars`, `tools/50-dollars-to-naira`, `tools/500-dollars-to-naira`, `tools/1000-dollars-to-naira`, `tools/5000-dollars-to-naira`, `tools/10000-naira-to-dollars`, `tools/100000-naira-to-dollars` | ONE template+engine (`inc/amount-pages.php`, config-driven: amount/from/to/content sections+FAQs); same-rate server/client math; `wp gwill amount-pages create` installer. **Static-generate all 8 with build-time rates + "live" client refresh** |

Maintained-data rule (house style): every calculator carries specific maintained numbers + "verified/last-projected on X" stamp. Astro port must keep the stamps and make the tables (`transfer providers`, `savings rates`, `parallel spread`, `FX fallback`) single-edit data files.

## 8. SEO implementation (all theme-owned, no plugin)

- Title: WP core `title-tag` + `document_title_parts` filter (front page → "Nigerian Money, Explained - <brand>", ≤60 chars; long singulars drop brand suffix >65 chars); dash normalized to `-`.
- Meta description per context (home tagline / excerpt / term desc); robots: noindex search/404/date/attachment + hidden settings pages; canonical via core; `robots.txt` filter.
- JSON-LD: WebSite+Organization everywhere; Article on singles; BreadcrumbList; WebApplication+FAQPage on every calculator; FX schema on converter.
- Social cards (`inc/social-meta.php`): OG/Twitter, brand share image `assets/brand/gwill-social-share.png`.
- Sitemap: theme-owned `/sitemap.xml` (posts+pages, transient-cached, invalidated on save) → Astro endpoint; core `wp-sitemap.xml` disabled. Defers to SEO plugin if present (Astro: N/A).
- Breadcrumbs with menu-path resolution; spotlight live search (REST + prebuilt index `inc/search-index.php`) → Astro: build-time search index JSON + client filter; keep `<mark>` highlight + did-you-mean (ship a small static dictionary or drop with note).
- i18n: text domain `gwill-finance`, 200 KB `.pot`; Astro v1 can hardcode English (note for v2).

## 9. Performance tricks to preserve

Zero WP CSS (`inc/wp-css-off.php`); exactly 2 global stylesheets (fonts + style) + `main.js` deferred; per-page calculator JS only (`enqueue` conditionals); font preload + preconnect; LCP image preload (`gwill-hero` 1200×675, eager+fetchpriority, width/height, srcset/sizes); click-to-play embed facades (no iframe until tap); ticker async post-paint; transients (FX 30 min/6h, filter HTML 10 min, ticker 60 s, sitemap); no-flex-gap Safari-14 probe (keep or drop with browserlist note); darkmode head script pre-paint (no flash); FastCGI + Cloudflare full-cache purge on publish (`inc/cloudflare-purge.php`); reduced-motion guard; scroll-padding-top for anchors. Mirror in Astro: `compressHTML`, `inlineStylesheets:'always'`, deferred islands, preloaded font+LCP, facades, build-time data.

## 10. Plugins: REQUIRED vs optional

- **Required: NONE.** Zero required plugins, zero external services at runtime (fonts self-hosted).
- **Optional:** ACF Free (editable fields; all defaults hardcoded — Astro replaces with data files); vibe-comments (post comments, styled by `assets/css/vibe-comments.css`); Brevo SMTP + `GWILL_*` wp-config constants (form/newsletter delivery);SEO/security/caching plugins explicitly NOT needed (theme owns SEO/sitemap/security headers; recommends Limit Login Attempts only).

## 11. Demo content

No XML export. Provisioning (`inc/setup.php`) creates the 12 pages + 6 categories on activation; ACF values entered manually; posts are real guides. Astro seed: create `src/content/articles/` with 2–3 sample posts covering all 6 categories + one video-embed post; `src/data/apps.ts` (3 default apps), `tools` data, brand categories.

## 12. Route list for the Astro port (28 + dynamic)

`/`, `/articles`, `/category/[savings|investing|crypto|banking|remittance|dollar-accounts]`, `/articles/[slug]`, `/author/[slug]`, `/search`, `/about`, `/apps`, `/contact`, `/newsletter`, `/privacy-policy`, `/disclaimer`, `/affiliate-disclosure`, `/tools`, 16× `/tools/<calculator>`, 8× `/tools/<amount-page>`, `/404`, `/sitemap.xml`, `/manifest.webmanifest`, `/sw.js` (static), `/newsletter-thanks` (static confirm).

## 13. Ranked conversion risks

1. **Comments have no static equivalent** — vibe-comments/WP comments need a replacement (giscus/utterances/Staticman or deferred; ship v1 read-only with "closed" note).
2. **Forms + newsletter need a server leg** — admin-ajax contact router + Brevo capture must become a serverless endpoint; secrets move off wp-config. Ship static UI first, wire endpoint in leg 2.
3. **Live FX rates at build time go stale** — `gwill_fx_rates()` transient (30 min) becomes: SSG with build-time rate + client-side live refresh from open.er-api.com (same keyless source). Decide staleness label + fallback ₦1340 handling.
4. **Web-push/VAPID + `/sw.js` publishing are server features** — keep manifest + static SW for installability; push subscription endpoint must be rebuilt or cut.
5. **Calculator parity ×17** — each PHP engine + JS mirror must be re-derived in TS and numerically tested (salary-tax NTA bands + old-vs-new are the highest-stakes math; property-test against PHP outputs).
6. **Amount-page SEO cluster** — 8 near-duplicate pages risk thin-content flags; keep unique sections/FAQs per page and canonical discipline from `inc/amount-pages.php`.
7. **Maintained tables rot** — transfer fees, savings rates (verified 2026-09-01), parallel spread are manual-update data; port as dated `src/data/*.ts` with visible verified-stamps and an owner checklist.
8. **Spotlight search parity** — WP REST + 500-title index + fuzzy suggest becomes a static index; keep highlighting, accept weaker did-you-mean or ship a static correction list.
9. **Dark-mode tri-state + ticker + facades JS** — small but behavior-rich (`main.js`, `ticker-live.js`, `embeds.js`, `darkmode`); port as framework-free scripts, preserve no-flash + reduced-motion.
10. **Ad slots + consent + sticky footer bar** — Customizer ad-code textareas become config; empty-slot wireframe placeholders must be preserved or explicitly removed (affects layout widths).
11. **200 KB style.css → Astro styles** — full token + 75-section cascade port; risk of dropping edge cases (Gutenberg `.art-body` block styles, coarse-pointer ergonomics, Fenix scrollbar rule). Port `interior.css`-style per portfolio precedent and visually QA every page type.
12. **i18n strings** — `gwill-finance` domain + `.pot` dropped in v1; hardcode English, note re-add path (astro-i18n) for v2.
