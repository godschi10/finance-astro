// Phase 3 shared content helpers — articles collection, authors, search
// index data. Single-edit data files per the maintained-data rule.
import { getCollection, type CollectionEntry } from "astro:content";
import { CATEGORIES, catBySlug } from "./site";

export type Article = CollectionEntry<"articles">;

export const AUTHORS = [
  {
    slug: "gwill-chijioke",
    name: "G-will Chijioke",
    role: "Founder & tester-in-chief",
    bio: "Web developer and finance writer. I build this site and write everything on it. I test every app before recommending it. Based in Nigeria.",
    socials: {
      x: "https://x.com/gwillchijioke",
      linkedin: "https://linkedin.com/in/gwillchijioke",
      github: "https://github.com/gwillchijioke",
    },
  },
];

export const authorBySlug = (slug: string) =>
  AUTHORS.find((a) => a.slug === slug) ?? {
    slug,
    name: "GWill Finance",
    role: "Editorial team",
    bio: "Independent Nigerian finance guides — tested, priced in naira, free to read.",
    socials: {} as Record<string, string>,
  };

// The real Gravatar registered to godschi10@gmail.com (King, 2026-09-28 —
// verified grayscale portrait). Shared by the article byline (20/48px) and the
// author archive head (96px). Single-edit data file: one constant for the hash.
export const GRAVATAR =
  "https://secure.gravatar.com/avatar/cd2c5f952ac6bbcba85fbf973b030b6d5af4f62f46e3c4a37abbcb7dfc28b6a9";

export const fmtMonthYear = (d: Date) =>
  d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

/**
 * WordPress prints the article page's date with date_i18n('F Y') — the full
 * month name (single.php:96, "April 2026"), while the cards use date_i18n('M Y')
 * ("Apr 2026") via fmtMonthYear above. Two formatters, because the theme really
 * does print two different formats on the same page.
 */
export const fmtLongMonthYear = (d: Date) =>
  d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export async function allArticles(): Promise<Article[]> {
  const posts = await getCollection("articles");
  return posts.sort((a, b) => +b.data.pubDate - +a.data.pubDate);
}

export async function articlesByCategory(slug: string): Promise<Article[]> {
  return (await allArticles()).filter((p) => p.data.category === slug);
}

export async function articlesByAuthor(slug: string): Promise<Article[]> {
  return (await allArticles()).filter((p) => p.data.authorSlug === slug);
}

export function relatedTo(all: Article[], current: Article, n = 3): Article[] {
  const others = all.filter((p) => p.slug !== current.slug);
  const sameCat = others.filter(
    (p) => p.data.category === current.data.category
  );
  // gwill_get_related_posts() queries the PRIMARY category only, capped at
  // $count (3) — it never mixes other categories in. WordPress's fallback in
  // single.php then takes the 2 most recent posts when no same-category post
  // exists, so the section never dies. `all` arrives sorted by date desc, which
  // is the query's own `orderby => date / order => DESC`.
  if (sameCat.length) return sameCat.slice(0, n);
  return others.slice(0, 2);
}

export { CATEGORIES, catBySlug };

// Tools catalogue for search + sitemap (mirrors tools/index.astro — keep in
// sync when a tool ships).
export const TOOLS = [
  { slug: "currency-converter", name: "Currency Converter", desc: "16 currencies to naira at the live mid-market rate, plus an honest parallel-market estimate." },
  { slug: "money-transfer-comparator", name: "Money-Transfer Comparator", desc: "Wise, Remitly, WU, WorldRemit, LemFi — ranked by what actually lands after fee and rate." },
  { slug: "exchange-rate-history", name: "Exchange-Rate History", desc: "USD→NGN trend over 30 or 90 days, built from real fetched points on your device." },
  { slug: "salary-tax-calculator", name: "Salary Tax (NTA 2026)", desc: "PAYE under the 2026 bands vs the old bands — rent relief, minimum-wage exemption, band table." },
  { slug: "gross-to-net-calculator", name: "Gross → Net", desc: "Start from the take-home you want; reverse-solve the gross you must negotiate." },
  { slug: "compound-interest-calculator", name: "Compound Interest", desc: "Principal plus top-ups, compounding your way to the future value, year by year." },
  { slug: "savings-goal-calculator", name: "Savings Goal", desc: "Name the target and deadline — get the exact monthly price, plus the path." },
  { slug: "naira-value-calculator", name: "Naira Value", desc: "What your naira still buys after N years of inflation — and what standing still costs." },
  { slug: "inflation-savings-calculator", name: "Inflation Savings", desc: "Inflate the goal first, then price nominal vs real monthly. The gap is the insight." },
  { slug: "50-30-20-budget-calculator", name: "50/30/20 Budget", desc: "Split any income into needs, wants, savings — then check real spending against plan." },
  { slug: "loan-repayment-calculator", name: "Loan Repayment", desc: "Lender quote in, real cost out: installment, total interest, true effective APR." },
  { slug: "emergency-fund-calculator", name: "Emergency Fund", desc: "Runway in months, inflation-adjusted target, and the saving that closes the gap." },
  { slug: "dividend-calculator", name: "Dividend / ROI Estimator", desc: "NGX shares year by year: DRIP vs cash, yield, gain, and CAGR." },
  { slug: "crypto-profit-calculator", name: "Crypto Profit", desc: "P2P profit in naira: spread, both-side fees, break-even rate, true ROI." },
  { slug: "savings-rate-comparator", name: "Savings-Rate Comparator", desc: "Who pays the most right now: fintech plans vs bank benchmarks, best first." },
];

// Default apps directory entries (truth-theme ACF fallback: PiggyVest,
// Grey, Risevest — honest copy, no sponsored order).
// page-apps.php v1.0.163 ACF slots — the 3 live cards scraped from
// finance.fitnesslova.qzz.io/apps/ on 2026-09-30 (slot 1-3 verbatim:
// name, cat, url, badge, art tile colours, emoji, desc, stats triplets
// [label, value, colourHint], review permalink slug). stats colour hints
// map gold/green → theme tokens exactly like the template's stat-colour block
// (a11y fix v1.0.145: raw CSS keywords failed WCAG on white).
export const APPS = [
  {
    name: "PiggyVest",
    cat: "Savings",
    url: "https://piggyvest.com",
    badge: "bgn",
    art: "#fef3c7,#fcd34d",
    emoji: "🐷",
    desc: "Nigeria's most popular savings app. Lock money in flexible savings, fixed deposits, or investment portfolios. Earn up to 13% p.a. on naira savings.",
    stats: [
      ["Min. Deposit", "₦100", ""],
      ["Interest p.a.", "Up to 13%", "green"],
      ["Rating", "★ 4.6 / 5", "gold"],
    ] as [string, string, string][],
    review: "piggyvest-vs-cowrywise-2026",
  },
  {
    name: "Grey",
    cat: "Dollar Accounts",
    url: "https://grey.co",
    badge: "bg",
    art: "#fef9ee,#fde68a",
    emoji: "💵",
    desc: "Open a US dollar account in minutes. International payments, virtual cards, and competitive rate withdrawals to Nigerian banks.",
    stats: [
      ["Account Type", "USD · GBP · EUR", ""],
      ["Free Withdrawals", "3 / month", "green"],
      ["Rating", "★ 4.5 / 5", "gold"],
    ] as [string, string, string][],
    review: "grey-vs-geegpay-dollar-account",
  },
  {
    name: "Risevest",
    cat: "Investing",
    url: "https://rise.capital",
    badge: "bgn",
    art: "#dcfce7,#86efac",
    emoji: "📈",
    desc: "Invest in US stocks, real estate, fixed-income directly from Nigeria. Low minimums, earnings returns, simple mobile interface.",
    stats: [
      ["Min. free", "$10", ""],
      ["Returns (avg)", "10–15% p.a.", "green"],
      ["Rating", "★ 4.4 / 5", "gold"],
    ] as [string, string, string][],
    review: "",
  },
];
