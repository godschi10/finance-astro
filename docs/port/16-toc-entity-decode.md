# 16 — The TOC printed "&amp;" (v0.4.5)

## The verdict

King, phone screenshot (img_febf26ee0d1b): *"Why is TOC showing &amp;"* — the
"IN THIS ARTICLE" list showed item 5 as `5. Images &amp; gallery` instead of
`5. Images & gallery`.

## Root cause — a double escape

The showcase article's body is byte-captured WordPress HTML, so its headings
carry entities in source (`<h2 id="5-images-gallery">5. Images &amp;
gallery</h2>`). The raw-HTML TOC extractor (`[slug].astro`, the fallback when
markdown headings are empty) regexes that source and strips tags — but never
decoded entities, so the TOC text kept the literal five characters `&amp;`.
Astro then escaped the `&` again, the page served `&amp;amp;`, and the phone
rendered `&amp;`.

Live WP never had the bug: `inc/table-of-contents.php:99` reads the RENDERED
document via DOMXPath — `textContent` is entity-decoded — and WP escapes once
on output.

## The fix

`decode()` in the extractor, before Astro escapes once:

```js
const decode = (s: string) =>
  s
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x3D;/g, "=")
    .replace(/&amp;/g, "&");
```

Named entities run BEFORE the ampersand so nothing double-decodes.

## Verification (served bytes, not eyeballs)

- dist: `<a href="#5-images-gallery">5. Images &amp; gallery</a>` —
  byte-identical to live WP's served anchor.
- All four ampersand headings (5/8/9/10) match live byte-for-byte.
- No `&amp;amp;` anywhere in served dist.
- `npm run check` 5/5; article gate 124/124; 54 pages built.

## Lessons

1. **The patch tool is an entity hazard** — writing an ampersand-entity
   replace through the chat layer normalised BOTH sides into no-ops. Repair
   entity-bearing code via Python constructing strings from chr(38), never
   through the patch tool with literal entities.
2. **Raw-source extractors must decode** — any extractor that reads raw HTML
   bytes (TOC, future search indexes, RSS) must entity-decode before the
   framework escapes once; live WP's DOM already did that for us.
3. **Gate needles that contain entities are chat-layer hazards too** — build
   them at runtime from `String.fromCharCode(38)` (this gate does) so the
   gate itself cannot be silently de-fanged in transit.
