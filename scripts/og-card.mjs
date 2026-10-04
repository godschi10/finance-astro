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
//   2. The BAKE FACE is not the shipped subset. An OG card is rasterised once by
//      rsvg and served as a PNG; no browser ever lays it out, so a codepoint the
//      site's own webfont lacks is still perfectly safe here as long as
//      fontconfig's answer carries it. FONT resolves to Source Code Pro, which
//      HAS U+20A6 (real glyph: 2 ink stems top and bottom, 60% mid-ink; a tofu
//      box is 1 run across 100% of the top row with 9% mid-ink). So the naira
//      sign is never rewritten — it bakes as the real sign, in data copy AND in
//      the logo lockup. Only the arrow is swapped, and that is a copy choice.
//      See TEXT_SWAPS for the full measurement table.
//   3. The wrapper is pure arithmetic, not a measuring loop. Advance is exactly
//      0.600 em in both the bake face and the shipped face (spec 0.2 / 6.2), so
//      chars per line is fontSize x 0.600 and never depends on kerning. Measured
//      again for this leg on 'n' x10, 'g' x13 and U+20A6 x5: 60.000px per char
//      at font-size 100, i.e. 0.6000 em, no exceptions.
//
// One deliberate, documented departure from the proofs: spec 2.3 forbids
// letter-spacing on WRAPPED text because it breaks the 0.600 em identity the
// char cap is computed from. The proofs carry -0.02em on the tool name and the
// article title (both wrappable); here only single-line items keep their
// tracking token — the logo lockup, whose tracking is part of the mark itself.
// Widest real effect: 33 chars x 52px x 0.02 = 34px of line length on a 1040px
// measure (3.3%) — never an overflow, since tracking of this sign only ever
// narrows the estimate.

/* ── CANVAS + GRID (spec 1.1) ─────────────────────────────────────────────── */
export const CANVAS = { w: 1200, h: 630 };

/** Safe content box x 80 -> 1120 (1040 wide). Every measure below uses 1040. */
export const GRID = { x: 80, right: 1120, width: 1040 };

/* ── PALETTE (spec 4.1) ───────────────────────────────────────────────────── */
export const PALETTE = {
  ink: "#0d0b08", // card ground
  text: "#f0ede6", // bright text -- the dark-theme --text token
  dim: "#8f8575", // meta / lede / tick
  gold: "#f59e0b", // accent; the ONLY gold on a card -- the dark-theme --gold
  goldMuted: "#fef9ee", // live-domain footer, at .82
  green: "#22c55e", // the dark-theme --green; the logo underline's far stop
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
  // The BRAND card has no headline baseline: its headline slot is the logo
  // lockup, whose baseline lives in WORDMARK.place.brand.
  brand: { lede: 392 },
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

/* ── THE LOGO LOCKUP ───────────────────────────────────────────────────────── */

/**
 * The site's real wordmark, transcribed from the source of truth:
 *
 *   src/layouts/Layout.astro:552   <a class="logo"><span class="n">₦</span><span class="nm">gwillchijioke</span></a>
 *   src/styles/header.css:70-92    .logo { font-weight:800; font-size:18px; letter-spacing:-0.03em }
 *                                 .logo .n  { color:var(--gold); text-shadow:0 0 14px var(--gold-glow); margin-right:0.14em }
 *                                 .logo .nm { color:var(--text) }
 *                                 .logo::after { bottom:-3px; height:1.5px; opacity:.65;
 *                                               background:linear-gradient(90deg,var(--gold),var(--green)) }
 *
 * That gold -> GREEN rule is part of his mark, not decoration: the live header
 * wears it. An earlier leg of this card banned green, and the King rejected the
 * result for not being his logo. So the underline keeps the green.
 *
 * Every token below is expressed in em against the lockup's own font-size, and
 * the ONLY input is `size`, so the logo is the header lockup at any scale with
 * no second set of coordinates to drift out of step.
 */
export const WORDMARK = {
  naira: "₦",
  name: "gwillchijioke",
  /** font shorthand of `.logo`, minus the size. */
  weight: 800,
  tracking: -0.03, // em, letter-spacing
  gap: 0.14, // em, `.logo .n { margin-right }` between the glyph and the name
  rule: {
    heightEm: 1.5 / 18, // 1.5px tall at the header's 18px
    // `.logo::after { bottom: -3px }` is 3px below the INLINE BOX, not below the
    // baseline. The box has to clear the descender first: measured on this box,
    // "gwillchijioke" descends 0.190 em while the naira glyph sits on the
    // baseline. 0.190 + a 0.08 em air gap = 0.27 em. The first cut used the
    // header's raw 0.167 em and the rule sliced straight through the g and j.
    dropEm: 0.27,
    opacity: 0.65, // `.logo::after { opacity }`
  },
  /**
   * `.logo .n { text-shadow: 0 0 14px var(--gold-glow) }` with --gold-glow
   * rgba(245,158,11,.35). CSS states the shadow's blur RADIUS, so a faithful
   * sigma would be 7px at 18px = 0.389em; at the brand card's 88px that is a
   * 34px bloom, which reads as a halo blob rather than a lit glyph. Capped to
   * 0.26em and verified by eye on the baked card.
   */
  glow: { sigmaEm: 0.26, color: "#f59e0b", opacity: 0.35 },

  /** Placement per variant. `baseline` is the lockup's TEXT baseline, not a top. */
  place: {
    // 316 puts the lockup optically centred (ink spans 248..333, rule 340..347)
    // and leaves the spec'd lede baseline 392 and gold rule 442 untouched below.
    brand: { x: 80, baseline: 316, size: 88 }, // the hero — 8.12em x 88 = 715px
    tool: { x: 80, baseline: 104, size: 38 }, // header 18px -> 38px
    article: { x: 80, baseline: 104, size: 38 },
  },
};

/**
 * Inline-box width of the lockup, in em of its own font-size.
 *
 * CSS letter-spacing is added AFTER every character including the last, so the
 * box is `chars x (advance + tracking)`, and `.logo .n`'s margin-right adds one
 * more gap between the glyph and the name:
 *   (1 + 13) x 0.57 + 0.14 = 8.12 em        // 'gwillchijioke' is THIRTEEN chars
 * `.logo::after` spans `left:0; right:0` of that same box, so the underline
 * width IS this number — the logo can never outgrow its own rule. Verified on
 * the baked card: the name's ink ends at x=387 and the rule ends at x=389.
 */
export const WORDMARK_EM = (1 + WORDMARK.name.length) * (ADVANCE + WORDMARK.tracking) + WORDMARK.gap;

export function wordmarkWidth(size) {
  return WORDMARK_EM * size;
}

/** Distance from the lockup's left edge to where the name starts. */
export function wordmarkNameX(size) {
  return (ADVANCE + WORDMARK.tracking + WORDMARK.gap) * size;
}

/** The gold -> green rule: y of its top edge, its height, and its own width. */
export function wordmarkRule(size, baseline) {
  const h = Math.max(2, Math.round(WORDMARK.rule.heightEm * size));
  return { y: Math.round(baseline + WORDMARK.rule.dropEm * size), h };
}

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
 * Card text may never carry a codepoint the BAKE FACE lacks.
 *
 * The bake face is whatever fontconfig hands rsvg for FONT above — Source Code
 * Pro — and it is NOT the shipped site subset. An OG card is rasterised once and
 * served as a PNG; it is never laid out by a browser, so "the shipped subset has
 * no U+20A6" was never a constraint on this file. Swapping it to a plain "N"
 * turned a headline into "on a N50k Salary" — a different number, on a card the
 * King reads as his own words.
 *
 * U+20A6 is therefore NOT swapped, and that is measured, not assumed. Rendered
 * alone at 180px through this exact stack:
 *
 *   cp        char  bbox      topRuns  topCov%  botRuns  botCov%  mid%   verdict
 *   U+20A6    '₦'   102x114    2        49       2        49       60    REAL GLYPH
 *   TOFU-CTL  ''    125x137    1       100       1        99        9    TOFU/BOX
 *
 * Two ink stems on the top row and two on the bottom, with 60% ink across the
 * middle, is a glyph. A tofu box is ONE unbroken run across 100% of its top row
 * with under 10% mid-ink — that is the control, and the control fails.
 *
 * U+2192 KEEPS its swap, but for the honest reason rather than the old one: the
 * arrow renders (same test: 1% top coverage, 100% mid-ink — a solid shaft), so
 * this is a COPY choice, "USD/NGN" over "USD→NGN" to match the two labels the
 * rest of the site already uses. The old "U+2192 absent from the font subset"
 * claim was false and is corrected here.
 */
const TEXT_SWAPS = [["→", "/", "copy choice: USD/NGN, matching the site's own pair labels"]];

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

/**
 * The gold -> green underline, drawn across the lockup's full inline box, the
 * way `.logo::after` does with left:0 / right:0.
 *
 * @param {number} x the lockup's left edge, in card coordinates
 */
function wordmarkRuleNode(x, size, baseline) {
  const r = wordmarkRule(size, baseline);
  return `<rect x="${x}" y="${r.y}" width="${Math.round(wordmarkWidth(size))}" height="${r.h}" rx="${Math.min(2, r.h / 2)}" fill="url(#og-lockuprule)" fill-opacity="${WORDMARK.rule.opacity}"/>`;
}

/**
 * The lockup: the naira glyph in gold (with the header's glow bloom) and the
 * name in --text, sharing one baseline exactly as `.logo`'s
 * `align-items: baseline` puts them on one line.
 *
 * The glyph and the name are two <text> nodes rather than two <tspan>s because
 * librsvg applies `filter` to a tspan unreliably; a node each keeps the bloom
 * on the glyph alone and still shares one y. The 0.14em gap between them is the
 * margin the header gets from `.logo .n { margin-right }`.
 *
 * Both x values are ABSOLUTE card coordinates — there is no wrapping <g>, so
 * there is exactly one authority for where the lockup sits and no way to apply
 * its origin twice.
 *
 * @param {number} x the lockup's left edge, in card coordinates
 * @param {string} glowId filter id sized for this variant
 */
function wordmark(x, baseline, size, glowId) {
  const common = [
    `font-family="${FONT}"`,
    `font-size="${size}"`,
    `font-weight="${WORDMARK.weight}"`,
    `letter-spacing="${WORDMARK.tracking}em"`,
  ].join(" ");
  return [
    `<text x="${x}" y="${baseline}" ${common} fill="${PALETTE.gold}" filter="url(#${glowId})">${esc(WORDMARK.naira)}</text>`,
    `<text x="${x + wordmarkNameX(size)}" y="${baseline}" ${common} fill="${PALETTE.text}">${esc(WORDMARK.name)}</text>`,
  ].join("\n");
}

/** Shared shell + defs (spec 3.0, 4.3, 4.4, 4.5). */
function shell() {
  // One bloom filter per size actually used, so stdDeviation is in real px and
  // never has to be re-derived at paint time.
  const glow = (id, size) =>
    `<filter id="${id}" x="-80%" y="-80%" width="260%" height="260%" color-interpolation-filters="sRGB">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${(WORDMARK.glow.sigmaEm * size).toFixed(2)}" result="blur"/>` +
    `<feFlood flood-color="${WORDMARK.glow.color}" flood-opacity="${WORDMARK.glow.opacity}" result="tint"/>` +
    `<feComposite in="tint" in2="blur" operator="in" result="halo"/>` +
    `<feMerge><feMergeNode in="halo"/><feMergeNode in="SourceGraphic"/></feMerge>` +
    `</filter>`;
  return {
    defs: [
      `<defs>`,
      `<pattern id="og-dotgrid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" fill="${PALETTE.dot}" fill-opacity="0.035"/></pattern>`,
      `<radialGradient id="og-goldglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="${PALETTE.glow}" stop-opacity="0.10"/><stop offset="65%" stop-color="${PALETTE.glow}" stop-opacity="0"/></radialGradient>`,
      // `.logo::after` — var(--gold) -> var(--green), left to right.
      `<linearGradient id="og-lockuprule" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${PALETTE.gold}"/><stop offset="100%" stop-color="${PALETTE.green}"/></linearGradient>`,
      glow("og-wm-glow-brand", WORDMARK.place.brand.size),
      glow("og-wm-glow-small", WORDMARK.place.tool.size),
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

/** Category / tool chip, right-aligned, vertically centred on the logo row. */
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
 * BRAND: the headline slot IS the logo lockup — `headline` is not consumed,
 * because the King rejected a card that printed his brand name under a mark
 * that was not his. The lockup IS the brand; the tagline and the live domain
 * carry the rest.
 *
 * @param {{variant: 'brand'|'tool'|'article', headline?: string, lede?: string,
 *          meta?: string, chip?: string, chipColor?: string, tick?: string}} card
 * @returns {string} standalone SVG markup, 1200 x 630
 */
export function renderCard({ variant = "brand", headline = "", lede = "", meta = "", chip: chipLabel = "", chipColor: chipHue = "", tick = "" } = {}) {
  const v = WORDMARK.place[variant] ? variant : "brand";
  const { defs, ground } = shell();
  const body = [];

  // Z1 · logo zone — always top-left, never moves (spec 1.2). On the brand card
  // it is the hero at 88px; on tool/article it sits in the header's own slot.
  const place = WORDMARK.place[v];
  body.push(wordmark(place.x, place.baseline, place.size, v === "brand" ? "og-wm-glow-brand" : "og-wm-glow-small"));
  body.push(wordmarkRuleNode(place.x, place.size, place.baseline));

  // Z2 · headline zone.
  if (v === "brand") {
    // No headline: the lockup above is the brand line. Tagline only.
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
