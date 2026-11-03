import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { CATEGORIES } from "../data/site";
import { TOOLS, AUTHORS } from "../data/content";
import { amountSlugs } from "../lib/amount";
import { paginate } from "../lib/pagination";

// Theme-owned sitemap (WP parity: inc/sitemap.php). Every shipped route,
// including the archive family: /articles/ + its pages, every category
// archive (flat), the nested child category, and the date archives
// (/{year}/ + /{year}/{month}/) the theme emits for any year/month holding
// posts. Staging-noindexed pages (search, thanks) stay out, per robots parity.
export const GET: APIRoute = async ({ site }) => {
  const origin = (site?.toString() ?? "https://godschi10.github.io").replace(/\/$/, "");
  const base = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;
  const posts = await getCollection("articles");

  // Date archives — WP generates year + month archives for every date with
  // posts (no day archives: /2026/01/01/ 404s live).
  const years = new Set<string>();
  const months = new Set<string>();
  posts.forEach((p) => {
    const d = p.data.pubDate;
    const y = String(d.getUTCFullYear());
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    years.add(y);
    months.add(`${y}/${m}`);
  });
  // Paginated archive tails (only when an archive exceeds posts_per_page).
  const extraPages: string[] = [];
  const pagesFor = (n: number, path: string) => {
    paginate(new Array(n)).forEach((_, i) => {
      if (i > 0) extraPages.push(`${path}/page/${i + 1}/`);
    });
  };
  pagesFor(posts.length, "articles");
  Array.from(years).forEach((y) => {
    pagesFor(posts.filter((p) => String(p.data.pubDate.getUTCFullYear()) === y).length, y);
  });
  // Author archive tails (2026-11-03, King: "Fix all 3 if safe" — R-3). The
  // articles archive lists /page/N/ above; author archives paginate through the
  // same PER_PAGE=10 contract (author/[slug]/[page].astro), so any author whose
  // post count exceeds posts_per_page gets identical treatment. Previously the
  // built /author/gwill-chijioke/page/2/ was indexed-reachable only through the
  // on-page pagination nav, while its article twin was listed — an
  // inconsistency inside this file, now closed additively (WP parity
  // emitter inc/sitemap.php remains off-box; nothing is removed here).
  AUTHORS.forEach((a) => {
    pagesFor(posts.filter((p) => p.data.authorSlug === a.slug).length, `author/${a.slug}`);
  });

  const routes = [
    "",
    "articles/",
    ...extraPages,
    ...Array.from(years).map((y) => `${y}/`),
    ...Array.from(months).map((m) => `${m}/`),
    "about/",
    "apps/",
    "contact/",
    // SITE-9 (BATCH S4, 2026-10-12): the trust pages — methodology/sources and
    // the editorial policy (corrections + sponsorship). The fifth audit's
    // launch checklist names both.
    "methodology/",
    "editorial-policy/",
    "newsletter/",
    "privacy-policy/",
    "disclaimer/",
    "affiliate-disclosure/",
    "money-tools/",
    ...TOOLS.map((t) => `money-tools/${t.slug}/`),
    ...amountSlugs().map((s) => `money-tools/${s}/`),
    ...posts.map((p) => `articles/${p.id}/`),
    ...CATEGORIES.map((c) => `category/${c.slug}/`),
    "category/investing/fixed-income/",
    ...AUTHORS.map((a) => `author/${a.slug}/`),
  ];
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes.map((r) => `  <url><loc>${origin}${base}${r}</loc><lastmod>${today}</lastmod></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
