// Static data — baked-in theme defaults (ACF absent in v1).
// Source: gwill-finance-theme inc/finance-helpers.php, inc/footer-links.php,
// inc/acf-field-groups.php defaults. Maintained tables (FX, transfer fees,
// savings rates) live as dated src/data/*.ts files.
//
// ── Deploy coordinates: SINGLE SOURCE OF TRUTH ──
// Canonical ORIGIN + BASE are defined ONCE here. This module is pure data
// (zero imports — verified), so astro.config.mjs imports them with no cycle;
// the reverse direction (site.ts importing the config) would drag
// astro/config + rehype plugins into page bundles, so it is NOT done.
// Env overrides for domain/base moves (defaults reproduce today's committed
// values byte-for-byte; full move checklist lives in the sibling leg's doc):
//   SITE_ORIGIN — default "https://godschi10.github.io" (feeds astro `site`)
//   SITE_BASE   — default "/finance-astro" (feeds astro `base` / BASE_URL)
export const ORIGIN = process.env.SITE_ORIGIN ?? "https://godschi10.github.io";
export const BASE = process.env.SITE_BASE ?? "/finance-astro";

// KING PORTABILITY FIX 2026-10-04: single Worker literal — was the same URL
// copy-pasted in Layout.astro / [slug].astro / mod.astro (CSP keeps its own
// explicit literal: security policy reads better explicit than interpolated).
export const COMMENTS_API = "https://comments-api.gwill.workers.dev";

// SITE-6 (2026-10-12): every profile URL lives in ONE place — the footer
// network column, the article author box, the About "Elsewhere" card and the
// JSON-LD sameAs all read PROFILES, so a handle or domain move is a one-line
// edit and drift dies.
//   github  — the gwillchijioke account has no public repositories (audit
//             SITE-6, checked during the portfolio audit); the King's public
//             work lives under godschi10. Pointed there.
//   portfolio — tech.gwillchijioke.com is RETIRED: the King's portfolio
//             CHANGELOG moved every such link to androidscroll.com, so this
//             site's references move the same way.
//   x/instagram/linkedin/youtube — KING-HELD: the audit warns @gwill_chijioke
//             (underscore) and @gwillchijioke are different accounts and says
//             to confirm with the owner. Not confirmed yet, so these keep the
//             handle the site has always carried (no underscore). Do NOT
//             guess-swap; flip them the moment the King rules.
export const PROFILES = {
  site: "https://gwillchijioke.com",
  portfolio: "https://androidscroll.com",
  github: "https://github.com/godschi10",
  x: "https://x.com/gwillchijioke",
  instagram: "https://instagram.com/gwillchijioke",
  linkedin: "https://linkedin.com/in/gwillchijioke",
  youtube: "https://youtube.com/@gwillchijioke",
} as const;

export const SITE = {
  name: "GWill Finance",
  tagline: "Nigerian money. Explained.",
  origin: ORIGIN,
  description:
    "Nigerian money. Explained. Honest, independent finance guides for Nigerians.",
  socials: {
    x: PROFILES.x,
    instagram: PROFILES.instagram,
    linkedin: PROFILES.linkedin,
    youtube: PROFILES.youtube,
    github: PROFILES.github,
  },
};

export interface Category {
  slug: string;
  name: string;
  emoji: string;
  /** Theme badge class — inc/finance-helpers.php::gwill_finance_cat_style(). */
  badge: string;
  /** Theme art tile class (card / featured image fallback) — same source. */
  art: string;
  /** Hero chip + pill tint — gwill_finance_brand_chip_class() (default db-g). */
  chip: string;
}

// Canonical brand order (finance-helpers.php::gwill_finance_brand_category_slugs).
// badge + art + emoji are the theme's map verbatim (gwill_finance_cat_style):
//   savings bgn/i-sav/🐷 · investing bgn/i-inv/📈 · crypto bpu/i-cry/₿
//   banking bsl/i-ban/🏦 · remittance bsl/i-rem/✈️ · dollar-accounts bg/i-dol/💵
// chip is gwill_finance_brand_chip_class(): savings db-g · investing db-gr ·
//   crypto db-p · banking db-s · remittance db-g · dollar-accounts db-gr.
export const CATEGORIES: Category[] = [
  { slug: "savings", name: "Savings", emoji: "\u{1F437}", badge: "bgn", art: "i-sav", chip: "db-g" },
  { slug: "investing", name: "Investing", emoji: "\u{1F4C8}", badge: "bte", art: "i-inv", chip: "db-te" },
  { slug: "crypto", name: "Crypto", emoji: "\u20BF", badge: "bpu", art: "i-cry", chip: "db-p" },
  { slug: "banking", name: "Banking", emoji: "\u{1F3E6}", badge: "bbl", art: "i-ban", chip: "db-bl" },
  { slug: "remittance", name: "Remittance", emoji: "\u2708\uFE0F", badge: "bcy", art: "i-rem", chip: "db-cy" },
  { slug: "dollar-accounts", name: "Dollar Accounts", emoji: "\u{1F4B5}", badge: "bg", art: "i-dol", chip: "db-gr" },
  { slug: "budgeting", name: "Budgeting", emoji: "\u{1F4B0}", badge: "bpk", art: "i-dol", chip: "db-pk" },
  { slug: "fixed-income", name: "Fixed Income", emoji: "\u{1F4C9}", badge: "bin", art: "i-inv", chip: "db-in" },
  // The theme's pill strips list Uncategorized too (homepage cp buttons + db
  // chips + every archive strip, captured live 2026-09-29). Its archive is
  // empty on WP as well — h1 only, no grid.
  { slug: "uncategorized", name: "Uncategorized", emoji: "\u{1F4C1}", badge: "bsl", art: "i-ban", chip: "db-s" },
];

// 2026-10-03 King order: new categories auto-claim a color on creation. Deterministic hash so a slug keeps its color across builds; slate is last in the palette so it is claimed least. A category promoted to an explicit CATEGORIES entry should pin its badge+chip explicitly.
export const BADGE_PALETTE = ["bg","bgn","bpu","bte","bbl","bcy","bpk","bin","bsl"] as const;
export const CHIP_PALETTE = ["db-g","db-gr","db-p","db-te","db-bl","db-cy","db-pk","db-in","db-s"] as const;

export function autoClaim(slug: string): { badge: string; chip: string } {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) h = ((h * 33) ^ slug.charCodeAt(i)) >>> 0;
  const idx = h % BADGE_PALETTE.length;
  return { badge: BADGE_PALETTE[idx], chip: CHIP_PALETTE[idx] };
}

// WP category archive descriptors, captured verbatim from the live origin
// (h1 + archive intro <p>, 2026-09-29). The theme prints these on every
// category archive header; uncategorized has none (h1 only).
export const CATEGORY_META: Record<string, { h1: string; desc?: string }> = {
  savings: {
    h1: "Savings in Nigeria",
    desc: "Honest, tested guides to Nigerian savings apps \u2014 PiggyVest, Cowrywise, SafeLock and more. Real rates, real withdrawal experience, no hype.",
  },
  investing: {
    h1: "Investing in Nigeria",
    desc: "Nigerian investing explained without jargon \u2014 Risevest, Trove, Bamboo, mutual funds and what beginners should actually do with their money.",
  },
  crypto: {
    h1: "Crypto in Nigeria",
    desc: "Crypto in Nigeria after the SEC rules \u2014 what is legal, what still works, and where Nigerians actually trade in 2026.",
  },
  banking: {
    h1: "Banking in Nigeria",
    desc: "Nigerian banking apps compared honestly \u2014 Kuda, Moniepoint and more, tested for daily use, fees and reliability.",
  },
  remittance: {
    h1: "Remittance in Nigeria",
    // SITE-9 (2026-10-12): the desc claimed "tested with real transfers" — the
    // posts behind it are fee/rate/speed comparisons, not published transfer
    // logs. Reworded to the comparison that is actually there (methodology
    // page defines what "tested" means on this site).
    desc: "Sending and receiving money across borders — Wise, Remitly, WorldRemit and SWIFT compared on fees, speed and what actually lands in the naira account.",
  },
  "dollar-accounts": {
    h1: "Dollar Accounts in Nigeria",
    // SITE-9 (2026-10-12): "tested with real money" scoped out — same reasoning
    // as the remittance descriptor above.
    desc: "Dollar account apps for Nigerians — Grey, Vance, Geegpay and Chipper Cash compared on fees, limits and virtual cards.",
  },
  budgeting: {
    h1: "Budgeting in Nigeria",
    desc: "Budgeting guides for Nigerians \u2014 how to track spending, save more and make every naira work harder.",
  },
  "fixed-income": {
    h1: "Fixed Income in Nigeria",
    desc: "Treasury bills, fixed deposits, bonds and other predictable Nigerian investment options \u2014 explained without the broker jargon.",
  },
  uncategorized: { h1: "Uncategorized in Nigeria" },
};

// Footer link groups — faithful port of inc/footer-links.php (gwill-finance-theme
// 1.13.39). The theme renders these in three places: the desktop footer's
// "Articles" and "Finance Apps" columns, and the mobile footer's "Site" column.
// hrefs are site-root-relative and get the `${base}` prefix at render time.
//
// NOTE on hrefs: WP links "All Articles" to its /all-articles/ permalink. That
// path does not exist in this port (it 404s — the real route is /articles/), so
// the port points at its own route rather than copying a dead link.
export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export const FOOTER_GROUPS: Record<"articles" | "apps" | "site", FooterLink[]> = {
  articles: [
    { label: "All Articles", href: "/articles/" },
    { label: "Savings", href: "/category/savings/" },
    { label: "Investing", href: "/category/investing/" },
    { label: "Crypto", href: "/category/crypto/" },
  ],
  apps: [
    { label: "Dollar Accounts", href: "/category/dollar-accounts/" },
    { label: "Finance Apps", href: "/apps/" },
    { label: "Banking", href: "/category/banking/" },
    { label: "Remittance", href: "/category/remittance/" },
  ],
  site: [
    { label: "Finance Apps", href: "/apps/" },
    { label: "Money Calculators", href: "/money-tools/" },
    { label: "About", href: "/about/" },
    { label: "Methodology", href: "/methodology/" },
    { label: "Editorial Policy", href: "/editorial-policy/" },
    { label: "Contact", href: "/contact/" },
  ],
};

// The "Network" column genuinely differs between the two footers in WP itself
// (footer.php 72–80 desktop vs 137–143 mobile), so both variants are kept.
// SITE-6 (2026-10-12): tech.gwillchijioke.com → androidscroll.com (the King's
// portfolio CHANGELOG moved every such link; the checker pin moved with it).
export const FOOTER_NETWORK: { desktop: FooterLink[]; mobile: FooterLink[] } = {
  desktop: [
    { label: "gwillchijioke.com", href: PROFILES.site, external: true },
    { label: "androidscroll.com", href: PROFILES.portfolio, external: true },
    { label: "About", href: "/about/" },
    { label: "Contact", href: "/contact/" },
    { label: "Newsletter", href: "/newsletter/" },
  ],
  mobile: [
    { label: "gwillchijioke.com", href: PROFILES.site, external: true },
    { label: "androidscroll.com", href: PROFILES.portfolio, external: true },
    { label: "Newsletter", href: "/newsletter/" },
  ],
};

// NESTED nav tree — faithful port of the WP primary-navigation menu
// (menu-primary-navigation / .snav-list). Parent rows with a `children`
// array are rendered as .menu-item-has-children with a chevron caret +
// .sub-menu dropdown (desktop) / accordion (mobile drawer). hrefs are
// site-root-relative ("/all-articles/") and get the ${base} prefix at
// render time in Layout.astro.
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "All Articles",
    href: "/articles/",
    children: [
      { label: "Savings", href: "/category/savings/" },
      {
        label: "Investing",
        href: "/category/investing/",
        children: [
          { label: "Fixed Income", href: "/category/investing/fixed-income/" },
        ],
      },
      { label: "Crypto", href: "/category/crypto/" },
    ],
  },
  {
    label: "Finance Apps",
    href: "/apps/",
    children: [
      { label: "Dollar Accounts", href: "/category/dollar-accounts/" },
      { label: "Remittance", href: "/category/remittance/" },
    ],
  },
  { label: "Money Calculators", href: "/money-tools/" },
  { label: "About", href: "/about/" },
];


// The homepage's Featured Article — the port's equivalent of the theme's
// `gwill_featured_post_id` theme mod (live: post 5, the Dollar Accounts review).
// index.astro falls back to the newest article if this slug ever disappears.
export const FEATURED_SLUG = "grey-vs-geegpay-dollar-account";

export const catBySlug = (slug: string): Category => {
  const claim = autoClaim(slug);
  return CATEGORIES.find((c) => c.slug === slug) ?? {
    slug,
    name: "Finance",
    emoji: "\u{1F4B0}",
    badge: claim.badge,
    art: "i-dol",
    chip: claim.chip,
  };
};

// TICKER_STATIC is REWRITTEN at build time by scripts/fetch-snapshot.mjs
// from the same feeds the calculators use — label = data-pair, value =
// the rendered .t-rate. data-src lets the ported ticker-live.js refresh
// pairs per source. Never hand-edit the values; they are generated.
export const TICKER_STATIC = [
  { label: "USD/NGN", value: "₦1,331", src: "fx" },
  { label: "GBP/NGN", value: "₦1,760", src: "fx" },
  { label: "EUR/NGN", value: "₦1,487", src: "fx" },
  { label: "BTC/USD", value: "$83,834", src: "btc" },
  { label: "ETH/USD", value: "$2,531", src: "eth" },
  { label: "XAU/USD", value: "$4,195", src: "gold" },
];
