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
  badge: string;
  art: string;
}

// Canonical brand order (finance-helpers.php::gwill_finance_brand_category_slugs).
export const CATEGORIES: Category[] = [
  { slug: "savings", name: "Savings", emoji: "\u{1F437}", badge: "bgn", art: "i-sav" },
  { slug: "investing", name: "Investing", emoji: "\u{1F4C8}", badge: "bg", art: "i-inv" },
  { slug: "crypto", name: "Crypto", emoji: "\u20BF", badge: "bpu", art: "i-cry" },
  { slug: "banking", name: "Banking", emoji: "\u{1F3E6}", badge: "bsl", art: "i-ban" },
  { slug: "remittance", name: "Remittance", emoji: "\u2708\uFE0F", badge: "brd", art: "i-rem" },
  { slug: "dollar-accounts", name: "Dollar Accounts", emoji: "\u{1F4B5}", badge: "bsl", art: "i-dol" },
];

// Phase 3 nav: every shipped route (honest chrome — nothing links nowhere).
export const NAV = [
  { label: "Articles", href: "articles/" },
  { label: "Calculators", href: "tools/" },
  { label: "Apps", href: "apps/" },
  { label: "About", href: "about/" },
  { label: "Contact", href: "contact/" },
  { label: "Search", href: "search/" },
  { label: "Newsletter", href: "newsletter/" },
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

export const catBySlug = (slug: string): Category =>
  CATEGORIES.find((c) => c.slug === slug) ?? {
    slug,
    name: "Finance",
    emoji: "\u{1F4B0}",
    badge: "bsl",
    art: "i-dol",
  };

// Static ticker snapshot — honest placeholder. Live refresh per R3.
export const TICKER_STATIC = [
  { label: "USD/NGN", value: "—" },
  { label: "GBP/NGN", value: "—" },
  { label: "EUR/NGN", value: "—" },
  { label: "BTC/USD", value: "—" },
  { label: "ETH/USD", value: "—" },
  { label: "XAU/USD", value: "—" },
];
