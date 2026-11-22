import type { APIRoute } from "astro";
import { buildSearchIndex, serializeSearchIndex } from "../data/search-index";

// E40 leg 5: the shared spotlight/search corpus as a static JSON asset served
// at {base}search-index.json (e.g. /finance-astro/search-index.json). Both
// consumers fetch this instead of reading a 10k inline <script> on every page.
// Same rows, same serialization as the removed inline index ;  no behaviour
// change beyond moving the bytes off the HTML critical path.
export const GET: APIRoute = async () => {
  const base = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;
  const index = await buildSearchIndex(base);
  return new Response(serializeSearchIndex(index), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
