import type { APIRoute } from "astro";

// Theme-owned sitemap (WP parity: inc/sitemap.php). Phase 1 routes only;
// calculators, archive, and article routes join in later phases.
export const GET: APIRoute = ({ site }) => {
  const origin = (site?.toString() ?? "https://godschi10.github.io").replace(/\/$/, "");
  const base = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;
  const routes = ["", "privacy-policy/", "disclaimer/", "affiliate-disclosure/", "tools/", "search/", "newsletter/"];
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes.map((r) => `  <url><loc>${origin}${base}${r}</loc><lastmod>${today}</lastmod></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
