import { defineConfig } from "astro/config";
import rehypeSlug from "rehype-slug";
import rehypeWpTable from "./scripts/rehype-wp-table.mjs";
// Astro 7 made Sätteri the default Markdown pipeline and dropped the
// remark/rehype one. The guide: "The deprecated `markdown.remarkPlugins`,
// `markdown.rehypePlugins`, and `markdown.remarkRehype` options still work,
// but now also require `@astrojs/markdown-remark` to be installed." We are not
// optional here — rehype-slug IS the WordPress-parity mechanism for heading ids
// (see the note below), so the unified() pipeline is pinned explicitly rather
// than left to a default that no longer runs these plugins.
import { unified } from "@astrojs/markdown-remark";
// Deploy coordinates are single-sourced in src/data/site.ts (pure data, zero
// imports — no cycle): ORIGIN/BASE carry the SITE_ORIGIN / SITE_BASE env
// overrides with today's values as defaults, so a default build is identical.
import { ORIGIN, BASE } from "./src/data/site.ts";

export default defineConfig({
  output: "static",
  site: ORIGIN,
  base: BASE,
  // trailingSlash intentionally UNSET: the effective behavior is the Astro 5
  // default ("ignore"), and every emitted link/canonical/sitemap-loc already
  // carries its own trailing slash. Trialed "always" 2026-10-04: it changed
  // exactly one served byte — money-tools/index.astro:57 emits raw BASE_URL,
  // so its breadcrumb Home item flips "/finance-astro" to "/finance-astro/".
  // That template line belongs to the sibling consumer leg; until it owns the
  // slash, the setting stays unset to preserve byte-identical output.
  compressHTML: true,
  build: { inlineStylesheets: 'always' },
  // WordPress injects heading ids server-side on the_content at priority 9
  // (inc/table-of-contents.php), and the article page's TOC anchors depend on
  // them. rehype-slug does the same job at build time, so the ids are in the
  // served HTML instead of being patched in by client JS.
  markdown: { processor: unified(), rehypePlugins: [rehypeSlug, rehypeWpTable] },
});
