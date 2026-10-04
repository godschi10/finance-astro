#!/usr/bin/env node
// Build-time OG card generator — writes public/images/og/*.png.
//
// Leg OG-C. Wired as the FIRST step of `npm run build` so a deploy can never
// serve a meta tag pointing at a card that was not regenerated: Astro bakes the
// og:image URLs into the HTML, so the PNGs must exist before the build reads
// the pages.
//
// Card geometry and every coordinate live in scripts/og-card.mjs, which is a
// literal implementation of /home/opc/work/research-notes/og-card-design-spec.md.
// This file only decides WHAT goes on each card, and it reads that from the real
// sources — nothing is invented:
//
//   brand   — SITE.name / SITE.tagline in src/data/site.ts
//   tool    — the TOOLS catalogue in src/data/content.ts (16 entries): name is
//             the headline, desc is the descriptor. The catalogue is the source
//             of truth because it is the same copy the search index ships.
//   hub     — the literal title/description index.astro passes to Layout
//   amount  — amountSeo() of the first entry in src/data/amount-pages.json
//             (one shared card for the 10-slug family, as [amount].astro wires)
//   article — title / category / readMins / pubDate frontmatter in
//             src/content/articles/*.md
//
// Filenames are load-bearing: Layout.astro and each ToolShell page already point
// og:image at exactly these paths, so they are frozen (spec, builder note 7).
//
// Rasterise: rsvg-convert -w 1200 -h 630, fed the SVG on STDIN. Verified on this
// box that rsvg 2.50.7 accepts stdin, so no temp file is written.
//
// Idempotent: the PNG is only rewritten when the bytes differ, so an unchanged
// card keeps its mtime and the build stays quiet.
//
// Exit non-zero on ANY failure — a half-generated og/ directory would ship
// broken og:image tags, which is worse than a failed build.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { renderCard, cardText, chipColor as chipColorFor } from "./og-card.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(root, "public", "images", "og");
const TOOLS_DIR = path.join(root, "src", "pages", "money-tools");
const ART_DIR = path.join(root, "src", "content", "articles");

/** The site-name suffix every page appends to its <title>; not card copy. */
const stripSite = (s) => String(s || "").replace(/\s*[-–|]\s*GWill Finance\s*$/i, "").trim();

/** Minimal YAML-ish frontmatter reader: `key: value`, quoted or bare. */
function frontmatter(src) {
  const out = {};
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src);
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^".*"$/.test(v) || /^'.*'$/.test(v)) v = v.slice(1, -1);
    out[kv[1]] = v;
  }
  return out;
}

/** First literal attribute of `name="…"` on a page, skipping `{…}` expressions. */
function attr(src, name) {
  const re = new RegExp(`${name}="([^"{}]*)"`);
  const m = re.exec(src);
  return m ? m[1] : "";
}

/**
 * The TOOLS catalogue out of src/data/content.ts. That file is TypeScript and
 * imports astro:content at module scope, so it cannot be imported from a plain
 * node script — but the array is a literal, so a strict per-line scan of exactly
 * the three fields we consume is honest and verifiable. The count is asserted
 * below: a silent regex miss would emit wrong copy, so it fails the build.
 */
function readToolsCatalogue() {
  const src = readFileSync(path.join(root, "src", "data", "content.ts"), "utf8");
  const block = /export const TOOLS = \[([\s\S]*?)\n\];/.exec(src);
  if (!block) throw new Error("no `export const TOOLS = [` block found in src/data/content.ts");
  const re = /\{\s*slug:\s*"([^"]*)",\s*name:\s*"([^"]*)",\s*desc:\s*"([^"]*)"\s*\}/g;
  const tools = [];
  let m;
  while ((m = re.exec(block[1])) !== null) tools.push({ slug: m[1], name: m[2], desc: m[3] });
  return tools;
}

/** rsvg-convert, SVG on stdin → PNG Buffer. Throws with context on failure. */
function rasterise(svg) {
  const res = spawnSync("rsvg-convert", ["-w", "1200", "-h", "630"], {
    input: svg,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (res.error) throw new Error(`rsvg-convert could not run: ${res.error.message}`);
  if (res.status !== 0) throw new Error(`rsvg-convert exited ${res.status}: ${String(res.stderr).trim()}`);
  if (!res.stdout || !res.stdout.length) throw new Error("rsvg-convert produced no bytes");
  return res.stdout;
}

let written = 0;
let skipped = 0;
const swapsSeen = new Map();

/**
 * Write only when the bytes differ. Prints one line per card either way.
 * `copy` is passed through cardText() first: the shipped font subset has no
 * naira sign and no arrow (spec 0.2 / 2.3), so those are rewritten to ASCII and
 * every substitution is logged rather than hidden.
 */
function emit(file, card, copy = {}) {
  const fields = {};
  for (const [key, raw] of Object.entries(copy)) {
    if (raw == null || raw === "") continue;
    const { text, swaps } = cardText(raw);
    fields[key] = text;
    for (const s of swaps) {
      const k = `${s.from} -> ${s.to}`;
      swapsSeen.set(k, (swapsSeen.get(k) ?? 0) + 1);
    }
  }
  const png = rasterise(renderCard({ ...fields, ...card }));
  const dest = path.join(OUT_DIR, file);
  if (existsSync(dest)) {
    try {
      if (readFileSync(dest).equals(png)) {
        skipped++;
        console.log(`  skip  ${path.relative(root, dest)} (${png.length} bytes, unchanged)`);
        return;
      }
    } catch {
      /* unreadable ⇒ fall through and rewrite */
    }
  }
  writeFileSync(dest, png);
  written++;
  console.log(`  write ${path.relative(root, dest)} (${png.length} bytes)`);
}

const jobs = [];
const failures = [];

const push = (file, card, copy) => jobs.push({ file, card, copy });

// ── brand ────────────────────────────────────────────────────────────────────
// Wordmark + tagline, ink ground, gold rule at y=442, tick as a right-hand
// counterweight (spec 3.1).
try {
  const site = readFileSync(path.join(root, "src", "data", "site.ts"), "utf8");
  const pick = (key) => {
    const m = new RegExp(`${key}:\\s*"([^"]*)"`).exec(site);
    return m ? m[1] : "";
  };
  const name = pick("name");
  const tagline = pick("tagline");
  if (!tagline) throw new Error("no SITE.tagline found in src/data/site.ts");
  push("brand.png", { variant: "brand", tick: "MONEY TOOLS · GUIDES · RATES" }, { headline: name, lede: tagline });
} catch (e) {
  failures.push(`brand: ${e.message}`);
}

// ── money tools ──────────────────────────────────────────────────────────────
// 16 catalogue entries -> 16 pages (spec 3.2). Chip copy: EXCHANGE for the two
// FX tools, MONEY CALCULATOR for the other 14. The right-hand tick is only
// printed where it is literally true — the two FX cards — because the tick is a
// claim, not decoration.
const FX_TOOLS = new Set(["currency-converter", "exchange-rate-history"]);
try {
  const tools = readToolsCatalogue();
  if (tools.length !== 16) throw new Error(`expected 16 TOOLS entries in content.ts, parsed ${tools.length}`);
  const pageSlugs = readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".astro"))
    .map((f) => f.replace(/\.astro$/, ""))
    .filter((f) => f !== "index" && f !== "[amount]")
    .sort();
  const catSlugs = tools.map((t) => t.slug).sort();
  const orphan = catSlugs.filter((s) => !pageSlugs.includes(s));
  const orphanPage = pageSlugs.filter((s) => !catSlugs.includes(s));
  if (orphan.length || orphanPage.length) {
    throw new Error(`catalogue and pages are not 1:1 — catalogue-only: ${orphan.join(", ") || "none"} · page-only: ${orphanPage.join(", ") || "none"}`);
  }
  for (const t of tools) {
    push(`tool-${t.slug}.png`, {
      variant: "tool",
      chip: FX_TOOLS.has(t.slug) ? "EXCHANGE" : "MONEY CALCULATOR",
      tick: FX_TOOLS.has(t.slug) ? "LIVE RATES" : "",
    }, { headline: t.name, lede: t.desc });
  }
} catch (e) {
  failures.push(`tools: ${e.message}`);
}

// ── the /money-tools/ hub ────────────────────────────────────────────────────
try {
  const src = readFileSync(path.join(TOOLS_DIR, "index.astro"), "utf8");
  const headline = stripSite(attr(src, "title"));
  const lede = attr(src, "description");
  if (!headline) throw new Error("no literal title attribute on index.astro");
  push("tool-index.png", { variant: "tool", chip: "MONEY TOOLS" }, { headline, lede });
} catch (e) {
  failures.push(`tool-index: ${e.message}`);
}

// ── the amount family (10 slugs, one shared card) ────────────────────────────
// [amount].astro wires every one of the 10 amount pages at tool-amount.png, so
// there is exactly one card. Copy is amountSeo() of the FIRST config entry,
// which is the hub entry of the family: h1 = the entry's own h1 or its title
// minus the ", Live Rate" suffix amountSeo() appends.
try {
  const cfg = JSON.parse(readFileSync(path.join(root, "src", "data", "amount-pages.json"), "utf8"));
  const firstSlug = Object.keys(cfg)[0];
  const first = cfg[firstSlug];
  if (!first) throw new Error("amount-pages.json is empty");
  const headline = first.h1 || String(first.title || "").replace(/,\s*Live Rate$/i, "").trim();
  if (!headline) throw new Error(`no h1 resolvable for amount entry ${firstSlug}`);
  push("tool-amount.png", { variant: "tool", chip: "EXCHANGE", tick: "LIVE RATES" }, { headline, lede: first.meta_desc || "" });
} catch (e) {
  failures.push(`tool-amount: ${e.message}`);
}

// ── articles ─────────────────────────────────────────────────────────────────
// Chip = the category, in that category's own colour (spec 4.1). Meta line =
// readMins + pubDate in the site's own en-GB short month, the format
// content.ts fmtMonthYear() uses.
for (const entry of readdirSync(ART_DIR).sort()) {
  if (!entry.endsWith(".md")) continue;
  const slug = entry.replace(/\.md$/, "");
  const fm = frontmatter(readFileSync(path.join(ART_DIR, entry), "utf8"));
  if (!fm.title) {
    failures.push(`article ${slug}: frontmatter has no title`);
    continue;
  }
  if (!fm.category || !fm.pubDate || !fm.readMins) {
    failures.push(`article ${slug}: frontmatter is missing category/pubDate/readMins`);
    continue;
  }
  const month = new Date(`${fm.pubDate}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  push(`article-${slug}.png`, {
    variant: "article",
    chip: String(fm.category).replace(/-/g, " "),
    chipColor: chipColorFor(String(fm.category)),
    tick: "GWILL FINANCE",
  }, { headline: fm.title, meta: `${fm.readMins} min read · ${month}` });
}

// ── render ───────────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
for (const { file, card, copy } of jobs) {
  try {
    emit(file, card, copy);
  } catch (e) {
    failures.push(`${file}: ${e.message}`);
  }
}

if (swapsSeen.size) {
  console.log(`\ngen-og: glyph substitutions (font subset has no such codepoint):`);
  for (const [k, n] of swapsSeen) console.log(`  ${k} × ${n}`);
}

console.log(`\ngen-og: ${written} written, ${skipped} unchanged, ${jobs.length} cards total`);
if (failures.length) {
  console.error(`\ngen-og: FAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
