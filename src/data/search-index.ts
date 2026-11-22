// Spotlight search index ; ONE corpus shared with the /search/ results page.
// Extracted from Layout.astro (E40 leg 5) so the corpus is built once as a
// static JSON asset (src/pages/search-index.json.ts) instead of being typed
// inline into every one of the 84 built pages. No behaviour change: the row
// shape and field values are byte-for-byte the same as the old inline script.
//
// Every article (title/excerpt/category-name/date/read-mins, badge/art/emoji
// for the engine's map) AND every calculator. The old 7-item POSTS-only array
// left the calculators unsearchable in the spotlight (the /search/ page
// searched 31 items; the drop-down only 7 ;  found by probing the built page).
import { allArticles as allPosts, fmtMonthYear, TOOLS } from "./content";
import { catBySlug } from "./site";

export interface SearchIndexRow {
  title: string;
  excerpt: string;
  url: string;
  date: string;
  mins: number;
  cat: string;
  category: string;
  badge: string;
  art: string;
  emoji: string;
  kind: string;
}

/** Build the shared corpus. `base` is the site base WITH a trailing slash. */
export async function buildSearchIndex(base: string): Promise<SearchIndexRow[]> {
  const posts = await allPosts(); // async getCollection
  return [
    ...posts.map((p) => {
      const c = catBySlug(p.data.category);
      return {
        title: p.data.title,
        excerpt: p.data.description,
        url: `${base}articles/${p.id}/`,
        date: fmtMonthYear(p.data.pubDate),
        mins: p.data.readMins,
        cat: c?.name ?? "Finance",
        category: p.data.category,
        badge: c?.badge ?? "bsl",
        art: c?.art ?? "",
        emoji: c?.emoji ?? "",
        kind: "article",
      };
    }),
    ...TOOLS.map((t) => ({
      title: t.name,
      excerpt: t.desc,
      url: `${base}money-tools/${t.slug}/`,
      date: "",
      mins: 1,
      cat: "Calculator",
      category: "tools",
      badge: "bsl",
      art: "",
      emoji: "",
      kind: "tool",
    })),
  ];
}

/**
 * Serialize exactly as the old inline <script> did: JSON.stringify with
 * `<` escaped to `\u003c`, so JSON.parse of the served asset yields the
 * identical row array (no HTML-script-breakout risk, same bytes on the wire).
 */
export function serializeSearchIndex(index: SearchIndexRow[]): string {
  return JSON.stringify(index).replace(/</g, "\\u003c");
}
