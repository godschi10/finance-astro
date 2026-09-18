import { defineCollection, z } from "astro:content";

// Phase 3: markdown article collection (WP `post` parity — no CPTs in the
// truth theme). Category slugs follow the six canonical brand categories;
// unknown slugs fall back to the Finance default at render time.
const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    author: z.string(),
    authorSlug: z.string(),
    pubDate: z.coerce.date(),
    updated: z.coerce.date().optional(),
    readMins: z.number(),
    videoUrl: z.string().url().optional(),
  }),
});

export const collections = { articles };
