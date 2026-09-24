import { defineCollection, z } from "astro:content";

// Phase 3: markdown article collection (WP `post` parity — no CPTs in the
// truth theme). Category slugs follow the six canonical brand categories;
// unknown slugs fall back to the Finance default at render time.
const articles = defineCollection({
  type: "content",
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
    readMins: z.number(),
    // Featured image (WP has_post_thumbnail(), single.php:106 + inc/card-media.php).
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageSrcset: z.string().optional(),
    videoUrl: z.string().url().optional(),
  }),
});

export const collections = { articles };
