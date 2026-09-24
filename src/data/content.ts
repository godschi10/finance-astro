// Phase 3 shared content helpers — articles collection, authors, search
// index data. Single-edit data files per the maintained-data rule.
import { getCollection, type CollectionEntry } from "astro:content";
import { CATEGORIES, catBySlug } from "./site";

export type Article = CollectionEntry<"articles">;

export const AUTHORS = [
  {
    slug: "gwill-chijioke",
    name: "Gwill Chijioke",
    role: "Founder & tester-in-chief",
    bio: "Gwill tests Nigerian savings apps, dollar accounts, and money tools with real transfers — then writes up exactly what each one costs. No sponsored rankings, no jargon.",
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
  const rest = others.filter((p) => p.data.category !== current.data.category);
  return [...sameCat, ...rest].slice(0, n);
}

// Headings for the sticky TOC — extracted from the raw markdown body.
export function tocOf(body: string): { depth: number; text: string; id: string }[] {
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/₦|\$/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  return body
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => {
      const text = l.replace(/^##\s+/, "").trim();
      return { depth: 2, text, id: slugify(text) };
    });
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
  { slug: "budget-allocator", name: "Budget Allocator", desc: "The needs half itemized: rent, food, transport, data, bills — shares you can tune." },
  { slug: "loan-repayment-calculator", name: "Loan Repayment", desc: "Lender quote in, real cost out: installment, total interest, true effective APR." },
  { slug: "emergency-fund-calculator", name: "Emergency Fund", desc: "Runway in months, inflation-adjusted target, and the saving that closes the gap." },
  { slug: "dividend-calculator", name: "Dividend / ROI Estimator", desc: "NGX shares year by year: DRIP vs cash, yield, gain, and CAGR." },
  { slug: "crypto-profit-calculator", name: "Crypto Profit", desc: "P2P profit in naira: spread, both-side fees, break-even rate, true ROI." },
  { slug: "savings-rate-comparator", name: "Savings-Rate Comparator", desc: "Who pays the most right now: fintech plans vs bank benchmarks, best first." },
];

// Default apps directory entries (truth-theme ACF fallback: PiggyVest,
// Grey, Risevest — honest copy, no sponsored order).
export const APPS = [
  {
    name: "PiggyVest",
    category: "Savings",
    emoji: "🐷",
    badge: "bgn",
    desc: "Automated savings with 17% flexible interest and up to 28% on fixed Safelocks. Best for building the habit.",
    stats: [["Flexible", "17% p.a."], ["Safelock", "up to 28%"]],
    url: "https://www.piggyvest.com/",
    reviewSlug: "piggyvest-vs-cowrywise-2026",
  },
  {
    name: "Grey",
    category: "Dollar Accounts",
    emoji: "💵",
    badge: "bsl",
    desc: "US, UK and EU receiving accounts with fast conversion to naira. Best for receiving wires cleanly.",
    stats: [["Spread", "~1–1.5%"], ["Maintenance", "₦0"]],
    url: "https://grey.co/",
    reviewSlug: "grey-vs-geegpay-dollar-account",
  },
  {
    name: "Risevest",
    category: "Investing",
    emoji: "📈",
    badge: "bg",
    desc: "Dollar-denominated US stocks and real-estate plans from naira. Best for hedging against devaluation.",
    stats: [["Assets", "US stocks"], ["Start", "from $10"]],
    url: "https://risevest.com/",
    reviewSlug: "ngn-dollar-cost-averaging-guide",
  },
];
