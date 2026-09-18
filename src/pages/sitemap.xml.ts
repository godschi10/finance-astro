import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { CATEGORIES } from "../data/site";
import { TOOLS, AUTHORS } from "../data/content";
import { amountSlugs } from "../lib/amount";

// Theme-owned sitemap (WP parity: inc/sitemap.php). Phase 3: every shipped
// route. Staging-noindexed pages (search, thanks) stay out, per robots parity.
export const GET: APIRoute = async ({ site }) => {
  const origin = (site?.toString() ?? "https://godschi10.github.io").replace(/\/$/, "");
  const base = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;
  const posts = await getCollection("articles");
  const routes = [
    "",
    "articles/",
    "about/",
    "apps/",
    "contact/",
    "newsletter/",
    "privacy-policy/",
    "disclaimer/",
    "affiliate-disclosure/",
    "tools/",
    ...TOOLS.map((t) => `tools/${t.slug}/`),
    ...amountSlugs().map((s) => `tools/${s}/`),
    ...posts.map((p) => `articles/${p.slug}/`),
    ...CATEGORIES.map((c) => `category/${c.slug}/`),
    ...AUTHORS.map((a) => `author/${a.slug}/`),
  ];
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes.map((r) => `  <url><loc>${origin}${base}${r}</loc><lastmod>${today}</lastmod></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
