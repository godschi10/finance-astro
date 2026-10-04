// OG card renderer — a PURE function: (card) → SVG string at 1200×630.
// No file I/O, no child_process, no network. gen-og.mjs owns rasterising.
//
// LEG OG-C. Rewritten to the shipped coordinate contract:
//   /home/opc/work/research-notes/og-card-design-spec.md   (the spec)
//   proofs: og-brand-preview.svg · og-tool-preview.svg · og-article-preview.svg
// Every number below cites its spec section; nothing here is tuned by eye.
//
// Three rules are load-bearing and were learned the hard way on this box:
//
//   1. NO @font-face / woff2. rsvg-convert resolves faces through fontconfig and
//      the repo's JetBrains woff2 files are not installed system-wide, so a
//      webfont reference silently renders blank. A STACK only.
//   2. The naira glyph is NEVER typed. The shipped latin subset has no U+20A6
//      (spec 0.2) and no U+2192 (spec 2.3), so the mark is geometry (spec 5.1)
//      and cardText() rewrites the two known-absent codepoints before they can
//      become a render-time lottery.
//   3. The wrapper is pure arithmetic, not a measuring loop. Advance is exactly
//      0.600 em in both the bake face and the shipped face (spec 0.2 / 6.2), so
//      chars per line is fontSize x 0.600 and never depends on kerning.
//
// One deliberate, documented departure from the proofs: spec 2.3 forbids
// letter-spacing on WRAPPED text because it breaks the 0.600 em identity the
// char cap is computed from. The proofs carry -0.02em on the tool name and the
// article title (both wrappable); here only the single-line BRAND wordmark keeps
// its tracking token. Widest real effect: 33 chars x 52px x 0.02 = 34px of line
// length on a 1040px measure (3.3%) — never an overflow, since tracking of this
// sign only ever narrows the estimate.

/* ── CANVAS + GRID (spec 1.1) ─────────────────────────────────────────────── */
export const CANVAS = { w: 1200, h: 630 };

/** Safe content box x 80 -> 1120 (1040 wide). Every measure below uses 1040. */
export const GRID = { x: 80, right: 1120, width: 1040 };

/* ── PALETTE (spec 4.1) ───────────────────────────────────────────────────── */
export const PALETTE = {
  ink: "#0d0b08", // card ground
  plate: "#131210", // mark plate (NOT ink — an ink plate is invisible)
  text: "#f0ede6", // bright text
  dim: "#8f8575", // meta / lede / tick
  gold: "#f59e0b", // accent; the ONLY gold on a card
  goldMuted: "#fef9ee", // live-domain footer, at .82
  glow: "#d97706", // gold glow core
  dot: "#ffffff", // dot-grid, at .035
};

/* ── TYPE SCALE (spec 2.2) ────────────────────────────────────────────────── */
export const TYPE = {
  hero: { size: 56, weight: 800, tracking: "-0.02em", fill: PALETTE.text },
  title: { size: 52, weight: 800, tracking: "-0.02em", fill: PALETTE.text },
  lede: { size: 24, weight: 400, tracking: "0", fill: PALETTE.dim },
  meta: { size: 22, weight: 400, tracking: "0.02em", fill: PALETTE.dim },
  domain: { size: 20, weight: 700, tracking: "0.02em", fill: PALETTE.goldMuted, fillOpacity: 0.82 },
  chip: { size: 15, weight: 700, tracking: "0.12em" },
  tick: { size: 16, weight: 400, tracking: "0.14em", fill: PALETTE.dim, fillOpacity: 0.7 },
};

/** Advance per character as a fraction of font size (spec 0.2 / 2.1). */
export const ADVANCE = 0.600;

/**
 * charsPerLine — spec 2.3: floor(1040 / (fontSize x 0.600)).
 * 30 @56, 33 @52, 72 @24.
 */
export function charsPerLine(fontSize) {
  return Math.floor(GRID.width / (fontSize * ADVANCE));
}

/**
 * lineHeight — spec 2.3: round(fontSize x 1.20). 67 @56, 62 @52, 29 @24.
 * ARTICLE title is the one spec'd exception: 64px leading (spec 3.3), which keeps
 * a 1.23 ratio at 52px and optically matches the 64px mark column beside it.
 */
export function lineHeight(fontSize) {
  return Math.round(fontSize * 1.2);
}

/** Article title leading, spec 3.3 — not the 62px grid value. */
export const ARTICLE_TITLE_LEADING = 64;

/* ── BASELINES (spec 1.3, 3.1, 3.2, 3.3) ─────────────────────────────────── */

/**
 * y=524 is the single most important number in the spec: it puts the footer
 * 106px above the bottom edge, clear of Twitter's bottom 10% crop band
 * (y >= 567) with 43px to spare, in EVERY variant.
 */
export const FOOTER_BASELINE = 524;
export const FOOTER_TEXT = "finance.gwillchijioke.com";

export const BASELINES = {
  brand: { headline: 340, lede: 392 },
  tool: { headline: 252, lede: 388 },
  article: { headline: 252, meta: 404 },
};

/** 88 x 4, radius 2, SOLID gold — spec 4.2 (never a gradient). */
export const RULE = {
  x: GRID.x,
  width: 88,
  height: 4,
  rx: 2,
  y: { brand: 442, tool: 460, article: 460 },
};

/* ── THE MARK (spec 5) ────────────────────────────────────────────────────── */

/**
 * Authored once on a 64-unit grid and scaled by size/64, so stroke weights scale
 * with it automatically. Pure rect primitives — the font subset has no naira
 * sign, so a text glyph would render differently on every machine (spec 0.2).
 */
export const MARK = {
  unit: 64,
  plate: { x: 0, y: 0, w: 64, h: 64, rx: 12, fill: PALETTE.plate },
  hairline: { x: 0.5, y: 0.5, w: 63, h: 63, rx: 11.5, strokeWidth: 1 },
  glyph: {
    fill: PALETTE.gold,
    rx: 1.6,
    rects: [
      { x: 20, y: 13, w: 5, h: 38 }, // vertical L
      { x: 39, y: 13, w: 5, h: 38 }, // vertical R
      { x: 16, y: 23, w: 32, h: 5 }, // crossbar 1
      { x: 16, y: 36, w: 32, h: 5 }, // crossbar 2
    ],
  },
  /** Placement + scale per variant (spec 5.2). */
  place: {
    brand: { x: 80, y: 76, scale: 2.625 }, // 168 x 168 — the brand card's hero
    tool: { x: 80, y: 64, scale: 1 },
    article: { x: 80, y: 64, scale: 1 },
  },
};

/* ── CHIP (spec 3.2 geometry) ─────────────────────────────────────────────── */

export const CHIP = { height: 34, rx: 17, y: 79, baseline: 101, padX: 40 };

/**
 * chipWidth = textWidth + 40, where the text carries 0.12em tracking so the
 * width counts chars AND the gaps between them (spec 3.2).
 */
export function chipWidth(label) {
  const chars = [...String(label)].length;
  const t = TYPE.chip;
  const textWidth = chars * t.size * ADVANCE + (chars - 1) * t.size * 0.12;
  return textWidth + CHIP.padX;
}

/** Right-aligned to x=1120, so a shorter chip sits further right (spec 3.2). */
export function chipX(label) {
  return GRID.right - chipWidth(label);
}

/** Article chip colours — the site's badge palette at dark-mode values (spec 4.1). */
export const CHIP_COLORS = {
  savings: "#22c55e",
  investing: "#2dd4bf",
  crypto: "#a78bfa",
  banking: "#60a5fa",
  remittance: "#22d3ee",
  "dollar-accounts": "#fb7185",
  budgeting: "#f87171",
  "fixed-income": "#818cf8",
  uncategorized: "#94a3b8",
};

/** The one category the palette does not cover falls back to the neutral grey. */
export const chipColor = (slug) => CHIP_COLORS[String(slug)] ?? CHIP_COLORS.uncategorized;

/* ── FONT ─────────────────────────────────────────────────────────────────── */

/**
 * The brief's literal value. This box has NO DejaVu Sans Mono installed, so
 * fontconfig resolves it to Source Code Pro — which is ALSO exactly 0.600 em
 * advance, identical to the shipped JetBrains Mono's 600/1000 upem (spec 6.2).
 * The substitution is therefore metrically invisible: the bake and the browser
 * card break lines at the same characters.
 */
export const FONT = "DejaVu Sans Mono, monospace";

/* ── TEXT SAFETY ──────────────────────────────────────────────────────────── */

/**
 * Card text may never contain a codepoint the shipped subset lacks.
 * Spec 0.2 / 2.3: U+20A6 (naira) and U+2192 (arrow) are both ABSENT, so they
 * would render as tofu or an OS-substituted glyph. Both are rewritten to the
 * nearest ASCII the data already uses elsewhere, and every swap is reported so
 * the generator can log it rather than hide it.
 */
const TEXT_SWAPS = [
  ["→", "/", "U+2192 absent from the font subset"],
  ["₦", "N", "U+20A6 absent from the font subset"],
];

/**
 * @param {string} str
 * @returns {{text: string, swaps: Array<{from: string, to: string, why: string}>}}
 */
export function cardText(str) {
  let text = String(str ?? "");
  const swaps = [];
  for (const [from, to, why] of TEXT_SWAPS) {
    if (!text.includes(from)) continue;
    swaps.push({ from, to, why });
    text = text.split(from).join(to);
  }
  return { text, swaps };
}

/* ── ENGINE ───────────────────────────────────────────────────────────────── */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * Word wrap on a pure arithmetic measure, then truncate with an ellipsis.
 * Truncation threshold is maxLines x charsPerLine, which is where the spec's
 * caps come from: 2 x 33 = 66 chars for an article title, 2 x 72 = 144 for a
 * descriptor (spec 2.3).
 *
 * @returns {{lines: string[], truncated: boolean}}
 */
export function wrapText(str, fontSize, maxLines) {
  const cap = charsPerLine(fontSize);
  const budget = cap * maxLines;
  let s = String(str ?? "").trim().replace(/\s+/g, " ");

  let truncated = false;
  if (s.length > budget) {
    // Cut one short of the budget so the ellipsis itself fits the measure.
    s = s.slice(0, Math.max(0, budget - 1)).trimEnd() + "…";
    truncated = true;
  }

  const words = s.split(" ").filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (lines.length >= maxLines) break;
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= cap) {
      cur = next;
      continue;
    }
    if (cur) lines.push(cur);
    // A single word wider than the measure is split, never allowed to overflow.
    let rest = w;
    while (rest.length > cap && lines.length < maxLines) {
      lines.push(rest.slice(0, cap));
      rest = rest.slice(cap);
    }
    cur = lines.length >= maxLines ? "" : rest;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return { lines, truncated };
}

/** One <text> node. tracking is a token from TYPE, never applied ad hoc. */
function textNode({ x, y, str, t, anchor, opacity }) {
  const alpha = opacity ?? t.fillOpacity;
  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    anchor ? `text-anchor="${anchor}"` : "",
    `font-family="${FONT}"`,
    `font-size="${t.size}"`,
    `font-weight="${t.weight}"`,
    `letter-spacing="${t.tracking}"`,
    `fill="${t.fill}"`,
    alpha != null ? `fill-opacity="${alpha}"` : "",
  ].filter(Boolean);
  return `<text ${attrs.join(" ")}>${esc(str)}</text>`;
}

/** The ₦ plate at 1:1 units; callers scale it via a transform. */
function markPath() {
  const p = MARK.plate;
  const h = MARK.hairline;
  const g = MARK.glyph;
  return [
    `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.rx}" fill="${p.fill}"/>`,
    `<rect x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}" rx="${h.rx}" fill="none" stroke="url(#og-plateedge)" stroke-width="${h.strokeWidth}"/>`,
    `<g fill="${g.fill}">`,
    ...g.rects.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${g.rx}"/>`),
    `</g>`,
  ].join("");
}

/** Shared shell + defs, byte-identical to the proofs (spec 3.0, 4.3, 4.4, 4.5). */
function shell() {
  return {
    defs: [
      `<defs>`,
      `<pattern id="og-dotgrid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" fill="${PALETTE.dot}" fill-opacity="0.035"/></pattern>`,
      `<radialGradient id="og-goldglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="${PALETTE.glow}" stop-opacity="0.10"/><stop offset="65%" stop-color="${PALETTE.glow}" stop-opacity="0"/></radialGradient>`,
      `<linearGradient id="og-plateedge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${PALETTE.text}" stop-opacity="0.20"/><stop offset="100%" stop-color="${PALETTE.text}" stop-opacity="0.08"/></linearGradient>`,
      `<g id="og-mark">${markPath()}</g>`,
      `</defs>`,
    ].join("\n"),
    // No radius and no border on the card itself — platforms crop it (spec 4.5).
    ground: [
      `<rect x="0" y="0" width="${CANVAS.w}" height="${CANVAS.h}" fill="${PALETTE.ink}"/>`,
      `<rect x="0" y="0" width="${CANVAS.w}" height="${CANVAS.h}" fill="url(#og-dotgrid)"/>`,
      `<circle cx="1300" cy="-100" r="500" fill="url(#og-goldglow)"/>`,
    ].join("\n"),
  };
}

/** Category / tool chip, right-aligned, vertically centred on the 64px mark. */
function chip(label, color) {
  if (!label) return "";
  const text = String(label).toUpperCase();
  const w = chipWidth(text);
  const x = GRID.right - w;
  const c = color || PALETTE.gold;
  return [
    `<rect x="${x}" y="${CHIP.y}" width="${w}" height="${CHIP.height}" rx="${CHIP.rx}" fill="${c}" fill-opacity="0.12" stroke="${c}" stroke-opacity="0.45"/>`,
    textNode({ x: x + w / 2, y: CHIP.baseline, str: text, t: { ...TYPE.chip, fill: c }, anchor: "middle" }),
  ].join("\n");
}

/** Footer + optional right-hand tick. Baseline 524 in every variant (spec 1.3). */
function footer(tick) {
  return [
    textNode({ x: GRID.x, y: FOOTER_BASELINE, str: FOOTER_TEXT, t: TYPE.domain }),
    tick ? textNode({ x: GRID.right, y: FOOTER_BASELINE, str: String(tick), t: TYPE.tick, anchor: "end" }) : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Render one card.
 *
 * @param {{variant: 'brand'|'tool'|'article', headline?: string, lede?: string,
 *          meta?: string, chip?: string, chipColor?: string, tick?: string}} card
 * @returns {string} standalone SVG markup, 1200 x 630
 */
export function renderCard({ variant = "brand", headline = "", lede = "", meta = "", chip: chipLabel = "", chipColor: chipHue = "", tick = "" } = {}) {
  const v = MARK.place[variant] ? variant : "brand";
  const { defs, ground } = shell();
  const body = [];

  // Z1 · logo zone — always top-left, never moves (spec 1.2).
  const place = MARK.place[v];
  body.push(`<use href="#og-mark" transform="translate(${place.x},${place.y})${place.scale !== 1 ? ` scale(${place.scale})` : ""}"/>`);

  // Z2 · headline zone.
  if (v === "brand") {
    // Wordmark + tagline. Both single-line items, so the wordmark keeps its
    // -0.02em tracking token; no wrapping is possible.
    const w = wrapText(headline, TYPE.hero.size, 1);
    for (const [i, line] of w.lines.entries()) {
      body.push(textNode({ x: GRID.x, y: BASELINES.brand.headline + i * lineHeight(TYPE.hero.size), str: line, t: TYPE.hero }));
    }
    if (lede) {
      const l = wrapText(lede, TYPE.lede.size, 1);
      for (const [i, line] of l.lines.entries()) {
        body.push(textNode({ x: GRID.x, y: BASELINES.brand.lede + i * lineHeight(TYPE.lede.size), str: line, t: TYPE.lede }));
      }
    }
  } else if (v === "tool") {
    if (chipLabel) body.push(chip(chipLabel, chipHue));
    // Tool name: 2 lines max. Every real name fits 1 line at 56px.
    const h = wrapText(headline, TYPE.hero.size, 2);
    for (const [i, line] of h.lines.entries()) {
      body.push(textNode({ x: GRID.x, y: BASELINES.tool.headline + i * lineHeight(TYPE.hero.size), str: line, t: { ...TYPE.hero, tracking: "0" } }));
    }
    if (lede) {
      const l = wrapText(lede, TYPE.lede.size, 2);
      for (const [i, line] of l.lines.entries()) {
        body.push(textNode({ x: GRID.x, y: BASELINES.tool.lede + i * lineHeight(TYPE.lede.size), str: line, t: TYPE.lede }));
      }
    }
  } else {
    if (chipLabel) body.push(chip(chipLabel, chipHue));
    // Article title: 2 lines max, 64px leading (spec 3.3).
    const h = wrapText(headline, TYPE.title.size, 2);
    for (const [i, line] of h.lines.entries()) {
      body.push(textNode({ x: GRID.x, y: BASELINES.article.headline + i * ARTICLE_TITLE_LEADING, str: line, t: { ...TYPE.title, tracking: "0" } }));
    }
    if (meta) {
      const m = wrapText(meta, TYPE.meta.size, 1);
      for (const [i, line] of m.lines.entries()) {
        body.push(textNode({ x: GRID.x, y: BASELINES.article.meta + i * lineHeight(TYPE.meta.size), str: line, t: TYPE.meta }));
      }
    }
  }

  // Gold rule, then the footer band.
  body.push(`<rect x="${RULE.x}" y="${RULE.y[v]}" width="${RULE.width}" height="${RULE.height}" rx="${RULE.rx}" fill="${PALETTE.gold}"/>`);
  body.push(footer(tick));

  // NOTE for maintainers: a CSS custom-property name contains a double hyphen, so
  // token names must never be pasted into an XML comment in here — librsvg
  // rejects the file outright (spec 6.5).
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.w}" height="${CANVAS.h}" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}">
${defs}
${ground}
${body.join("\n")}
</svg>
`;
}
