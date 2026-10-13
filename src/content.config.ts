import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
// Astro 6 deprecated `z` from astro:content in favour of astro/zod (and 6.0
// moved to Zod 4 underneath). Same validator, supported import path.
import { z } from "astro/zod";

// Phase 3: markdown article collection (WP `post` parity — no CPTs in the
// truth theme). Category slugs follow the six canonical brand categories;
// unknown slugs fall back to the Finance default at render time.
//
// Astro 6 removed the legacy Content Collections API outright — the guide's
// words: "All content collections must now use the Content Layer API
// introduced in Astro v5.0. **No backwards compatibility support is
// available.**" A collection with no `loader` now fails with
// ContentCollectionMissingALoaderError (observed: "The collection \"articles\"
// does not exist or is empty"). So the bare `type: "content"` becomes an
// explicit glob() loader over the same flat directory. glob()'s default
// generateId returns the path-derived slug, and this directory is flat (15 .md,
// no subdirs), so entry.id === the legacy entry.slug the pages used before.
const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Optional editorial standfirst rendered under the article title. WordPress
    // has no post-subtitle field (only hero subtitles elsewhere), so the port
    // owns this: authored per post, and the article page falls back to
    // `description` so every post still reads complete.
    subtitle: z.string().optional(),
    category: z.string(),
    author: z.string(),
    authorSlug: z.string(),
    pubDate: z.coerce.date(),
    updated: z.coerce.date().optional(),
    // SITE-9 (2026-10-12, YMYL trust): the last date the post was editorially
    // reviewed — rendered in the article meta row ("Reviewed …") and fed into
    // JSON-LD/OG dateModified. Explicit frontmatter, never computed from git
    // (a build machine has no git history). Default per batch S4: the post's
    // own last-edit date (updated ?? pubDate) — the publish/edits WERE the
    // review; a future review moves the field forward.
    reviewed: z.coerce.date().optional(),
    readMins: z.number(),
    // Featured image (WP has_post_thumbnail(), single.php:106 + inc/card-media.php).
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageSrcset: z.string().optional(),
    videoUrl: z.string().url().optional(),
  }),
});

export const collections = { articles };
