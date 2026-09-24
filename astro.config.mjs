import { defineConfig } from "astro/config";
import rehypeSlug from "rehype-slug";

export default defineConfig({
  output: "static",
  site: "https://godschi10.github.io",
  base: "/finance-astro",
  compressHTML: true,
  build: { inlineStylesheets: 'always' },
  // WordPress injects heading ids server-side on the_content at priority 9
  // (inc/table-of-contents.php), and the article page's TOC anchors depend on
  // them. rehype-slug does the same job at build time, so the ids are in the
  // served HTML instead of being patched in by client JS.
  markdown: { rehypePlugins: [rehypeSlug] },
});
