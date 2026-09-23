// Static data — baked-in theme defaults (ACF absent in v1).
// Source: gwill-finance-theme inc/finance-helpers.php, inc/footer-links.php,
// inc/acf-field-groups.php defaults. Maintained tables (FX, transfer fees,
// savings rates) live as dated src/data/*.ts files.
export const SITE = {
  name: "GWill Finance",
  tagline: "Nigerian money. Explained.",
  origin: "https://godschi10.github.io",
  description:
    "Nigerian money. Explained. Honest, independent finance guides for Nigerians.",
  socials: {
    x: "https://x.com/gwillchijioke",
    instagram: "https://instagram.com/gwillchijioke",
    linkedin: "https://linkedin.com/in/gwillchijioke",
    youtube: "https://youtube.com/@gwillchijioke",
    github: "https://github.com/gwillchijioke",
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
  { slug: "investing", name: "Investing", emoji: "\u{1F4C8}", badge: "bgn", art: "i-inv", chip: "db-gr" },
  { slug: "crypto", name: "Crypto", emoji: "\u20BF", badge: "bpu", art: "i-cry", chip: "db-p" },
  { slug: "banking", name: "Banking", emoji: "\u{1F3E6}", badge: "bsl", art: "i-ban", chip: "db-s" },
  { slug: "remittance", name: "Remittance", emoji: "\u2708\uFE0F", badge: "bsl", art: "i-rem", chip: "db-g" },
  { slug: "dollar-accounts", name: "Dollar Accounts", emoji: "\u{1F4B5}", badge: "bg", art: "i-dol", chip: "db-gr" },
];

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
    { label: "Money Calculators", href: "/tools/" },
    { label: "About", href: "/about/" },
    { label: "Contact", href: "/contact/" },
  ],
};

// The "Network" column genuinely differs between the two footers in WP itself
// (footer.php 72–80 desktop vs 137–143 mobile), so both variants are kept.
export const FOOTER_NETWORK: { desktop: FooterLink[]; mobile: FooterLink[] } = {
  desktop: [
    { label: "gwillchijioke.com", href: "https://gwillchijioke.com", external: true },
    { label: "tech.gwillchijioke.com", href: "https://tech.gwillchijioke.com", external: true },
    { label: "About", href: "/about/" },
    { label: "Contact", href: "/contact/" },
    { label: "Newsletter", href: "/newsletter/" },
  ],
  mobile: [
    { label: "gwillchijioke.com", href: "https://gwillchijioke.com", external: true },
    { label: "tech.gwillchijioke.com", href: "https://tech.gwillchijioke.com", external: true },
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
  { label: "Money Calculators", href: "/tools/" },
  { label: "About", href: "/about/" },
];

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMins: number;
  author: string;
}

// Homepage seed excerpts mirror the article collection (src/content/articles/).
// The collection is the source of truth at render time.
export const POSTS: Post[] = [
  {
    slug: "piggyvest-vs-cowrywise-2026",
    title: "PiggyVest vs Cowrywise in 2026: Which Saves You More?",
    excerpt:
      "Interest rates, withdrawal rules, fees, and app experience compared side by side — plus the exact account to open first if you are starting from zero.",
    category: "savings",
    date: "Sep 2026",
    readMins: 9,
    author: "Gwill Chijioke",
  },
  {
    slug: "ngn-dollar-cost-averaging-guide",
    title: "Dollar-Cost Averaging Into NGX Stocks on a ₦50k Salary",
    excerpt:
      "A step-by-step plan for buying Nigerian stocks every month without timing the market — broker choice, fees to watch, and a worked example.",
    category: "investing",
    date: "Sep 2026",
    readMins: 11,
    author: "Gwill Chijioke",
  },
  {
    slug: "p2p-crypto-nigeria-safely",
    title: "How to Buy Crypto P2P in Nigeria Without Getting Scammed",
    excerpt:
      "Escrow rules, red flags, and the exact verification steps to run before you release a single naira on any P2P marketplace.",
    category: "crypto",
    date: "Aug 2026",
    readMins: 8,
    author: "Gwill Chijioke",
  },
  {
    slug: "kuda-vs-traditional-banks-charges",
    title: "Kuda vs Traditional Banks: The Real Cost of Free Transfers",
    excerpt:
      "Card fees, failed-transfer reversals, and customer support tested — what digital banks actually save you in a year, in naira.",
    category: "banking",
    date: "Aug 2026",
    readMins: 7,
    author: "Gwill Chijioke",
  },
  {
    slug: "cheapest-way-receive-dollars-nigeria",
    title: "Cheapest Way to Receive Dollars in Nigeria (2026 Compared)",
    excerpt:
      "Wise, Grey, Geegpay, and domiciliary accounts compared on fees, speed, and exchange margins — with the cheapest pick for three common amounts.",
    category: "remittance",
    date: "Aug 2026",
    readMins: 10,
    author: "Gwill Chijioke",
  },
  {
    slug: "grey-vs-geegpay-dollar-account",
    title: "Grey vs Geegpay: Which Dollar Account Should You Open?",
    excerpt:
      "Account opening, conversion spreads, card support, and payout speed — tested with real transfers so you know the true cost upfront.",
    category: "dollar-accounts",
    date: "Jul 2026",
    readMins: 8,
    author: "Gwill Chijioke",
  },
  {
    slug: "emergency-fund-naira-inflation",
    title: "How Much Emergency Fund Do You Need With Naira Inflation?",
    excerpt:
      "Why the classic 6-month rule breaks under double-digit inflation, and a simple formula to size your safety net in today's naira.",
    category: "savings",
    date: "Jul 2026",
    readMins: 6,
    author: "Gwill Chijioke",
  },
];

// The homepage's Featured Article — the port's equivalent of the theme's
// `gwill_featured_post_id` theme mod (live: post 5, the Dollar Accounts review).
// index.astro falls back to the newest article if this slug ever disappears.
export const FEATURED_SLUG = "grey-vs-geegpay-dollar-account";

export const catBySlug = (slug: string): Category =>
  CATEGORIES.find((c) => c.slug === slug) ?? {
    slug,
    name: "Finance",
    emoji: "\u{1F4B0}",
    badge: "bsl",
    art: "i-dol",
    chip: "db-g",
  };

// Static ticker snapshot — real fetched values from header-truth.html.
// label = data-pair, value = the rendered .t-rate for that pair. The
// data-src lets the live ticker script target the right source per pair.
export const TICKER_STATIC = [
  { label: "USD/NGN", value: "₦1,336", src: "fx" },
  { label: "GBP/NGN", value: "₦1,786", src: "fx" },
  { label: "EUR/NGN", value: "₦1,533", src: "fx" },
  { label: "BTC/USD", value: "$80,469", src: "btc" },
  { label: "ETH/USD", value: "$2,583", src: "eth" },
  { label: "XAU/USD", value: "$4,379", src: "gold" },
];
