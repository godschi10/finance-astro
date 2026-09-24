/**
 * WordPress/Gutenberg wraps every content table in `<figure class="wp-block-table">`
 * — style.css:896-924 styles that wrapper (border, radius, overflow, thin gold
 * scrollbar) and the ≤767 full-bleed rule targets it as a DIRECT child of
 * `.art-body`. Markdown pipe tables emit a bare `<table>`, so every table in the
 * port rendered unstyled: no border, no radius, zero cell padding (measured on
 * the live Grey vs Geegpay article: thPad 0px, tdPad 0px, borderCollapse
 * separate). This rehype plugin inserts exactly the wrapper Gutenberg emits,
 * keeping the table a direct child of its container so the break-out rules match.
 *
 * Skip tables already wrapped (a hand-authored raw `<figure class="wp-block-table">`
 * in markdown) so we never double-wrap.
 */
export default function rehypeWpTable() {
  return (tree) => {
    walk(tree);
  };
}

function walk(node) {
  if (!node || !Array.isArray(node.children)) return;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (
      child.type === "element" &&
      child.tagName === "table" &&
      !(
        node.type === "element" &&
        node.tagName === "figure" &&
        Array.isArray(node.properties?.className) &&
        node.properties.className.includes("wp-block-table")
      )
    ) {
      node.children[i] = {
        type: "element",
        tagName: "figure",
        properties: { className: ["wp-block-table"] },
        children: [child],
      };
    } else {
      walk(child);
    }
  }
}
