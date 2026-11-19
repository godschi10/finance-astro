#!/usr/bin/env node
/*
 * ux-parity.mjs - UX grammar parity contract for the 50/30/20 budget calculator.
 *
 * WHY: calc-regress.mjs pins 277 numeric engine rows and check-*.mjs pin static
 * markup, but none of them asserted the UX grammar a human audit won: the seed
 * disclosure notes, the too-large / negative / junk rails, CANNOT SCORE, the
 * NEEDS OVER and AHEAD next-action links, the single named "Plan now" AX node,
 * and phone-first no-overflow. This harness drives the BUILT dist through a
 * real Chromium and fails non-zero the moment any of that grammar regresses.
 *
 * ADDITIVE ONLY: one file, no dependency added (Playwright is already in
 * node_modules), no existing gate or engine touched.
 *
 * Usage:
 *   node scripts/ux-parity.mjs
 *   UX_BASE=http://host/finance-astro node scripts/ux-parity.mjs
 * Env:
 *   UX_BASE  optional already-served site root (must include the /finance-astro
 *            base). When absent a tiny Node static server serves dist/ with
 *            that prefix stripped, so the built /finance-astro/... paths work.
 *   UX_DIST  optional dist root override (default <repo>/dist); used by the
 *            deliberate-failure proof, which runs a scratch copy from /tmp.
 *   CHROME_BIN optional chromium binary override.
 *
 * CDP: launches its OWN browser on a free debugging port in the 9411+ range.
 * Never attaches to a shared browser; 9222 and 9333 are never used.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const here = dirname(fileURLToPath(import.meta.url));
const repo = dirname(here);
const DIST = process.env.UX_DIST || join(repo, "dist");
const BASE_PREFIX = "/finance-astro";
const PAGE_PATH = "/money-tools/50-30-20-budget-calculator/";
const CHROME = process.env.CHROME_BIN ||
  "/home/opc/.cache/ms-playwright/chromium-1254/chrome-linux-arm64/chrome";

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".ico": "image/x-icon", ".webmanifest": "application/manifest+json",
  ".xml": "text/xml", ".txt": "text/plain", ".woff": "font/woff",
  ".woff2": "font/woff2", ".map": "application/json",
};

/* ---- free loopback ports (CDP port strictly in 9411+, never 9222/9333) ---- */
function freeHttpPort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}
async function freeCdpPort() {
  for (let p = 9411; p < 9500; p++) {
    if (p === 9222 || p === 9333) continue; // defence in depth
    const ok = await new Promise((r) => {
      const s = net.createServer();
      s.once("error", () => r(false));
      s.listen(p, "127.0.0.1", () => s.close(() => r(true)));
    });
    if (ok) return p;
  }
  throw new Error("no free CDP port in 9411-9499");
}

/* ---- tiny static server: root at dist, strip the /finance-astro prefix ---- */
function serve(root) {
  const srv = createServer(async (req, res) => {
    try {
      let u = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (u.startsWith(BASE_PREFIX)) u = u.slice(BASE_PREFIX.length) || "/";
      let p = join(root, u);
      if (u.endsWith("/")) p = join(p, "index.html");
      try { if ((await stat(p)).isDirectory()) p = join(p, "index.html"); } catch {}
      const buf = await readFile(p);
      res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
      res.end(buf);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    }
  });
  return new Promise((resolve) => srv.listen(0, "127.0.0.1", () => resolve(srv)));
}

/* ---- assertion recorder: every result printed as PASS/FAIL <name> ---- */
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name}${detail ? " | " + detail : ""}`); }
};
const has = (s, needle) => String(s).includes(needle);

async function main() {
  let server = null, browser = null;
  try {
    let baseUrl;
    if (process.env.UX_BASE) {
      baseUrl = process.env.UX_BASE.replace(/\/$/, "");
      if (!has(baseUrl, BASE_PREFIX)) {
        console.log(`NOTE UX_BASE does not contain ${BASE_PREFIX}; using it verbatim`);
      }
    } else {
      if (!existsSync(DIST)) throw new Error("dist not found at " + DIST + " (run npm run build, or set UX_DIST/UX_BASE)");
      server = await serve(DIST);
      baseUrl = `http://127.0.0.1:${server.address().port}${BASE_PREFIX}`;
    }
    const url = baseUrl + PAGE_PATH;
    const cdpPort = await freeCdpPort();
    const args = [
      "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
      "--no-first-run", "--no-default-browser-check", "--disable-extensions",
      "--ozone-platform=headless", `--remote-debugging-port=${cdpPort}`,
    ];
    browser = await chromium.launch({
      executablePath: CHROME, headless: true, args,
    });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, colorScheme: "light",
      deviceScaleFactor: 2, isMobile: true,
    });
    /* Wipe persisted calculator state on EVERY navigation: each state below
       starts from the server-seeded example, never a prior run's localStorage. */
    await context.addInitScript(() => { try { localStorage.clear(); } catch {} });
    const page = await context.newPage();

    const text = (id) => page.evaluate((x) => {
      const el = document.getElementById(x);
      return el ? (el.textContent || "").trim() : "";
    }, id);
    const visible = (id) => page.locator("#" + id).isVisible();

    async function fresh(values = {}) {
      await page.goto(url, { waitUntil: "load", timeout: 30000 });
      await page.waitForFunction(() => {
        const c = document.querySelector(".fx-card");
        return c && c.getAttribute("aria-busy") !== "true" &&
          !!document.getElementById("bg-fig") && !!document.getElementById("al-verdict");
      }, null, { timeout: 20000 });
      for (const [id, val] of Object.entries(values)) {
        const el = page.locator("#" + id);
        await el.fill(val);                       // real input event
        await el.evaluate((e) => e.dispatchEvent(new Event("change", { bubbles: true })));
      }
      await page.waitForTimeout(200);             // let the synchronous render settle
    }

    /* 1. SEED disclosure notes */
    await fresh();
    check("seed/targets-note visible", await visible("bg-targets-note"));
    check("seed/targets-note substring", has(await text("bg-targets-note"), "fill the spent-on lines"));
    check("seed/shares-note visible", await visible("bg-shares-note"));
    check("seed/shares-note substring", has(await text("bg-shares-note"), "replaces your current shares"));
    check("seed/clear-reset-note visible", await visible("bg-clear-reset-note"));
    check("seed/clear-reset-note substring", has(await text("bg-clear-reset-note"), "Clear removes saved numbers"));

    /* 2. TOO-LARGE income */
    await fresh({ "bg-inc": "1000000000000000" });
    const w2 = await text("bg-warn"), v2 = await text("al-verdict");
    check("too-large/warn substring", has(w2, "looks unusually large"), w2);
    check("too-large/verdict CANNOT SCORE", has(v2, "CANNOT SCORE"), v2);
    check("too-large/verdict no SAVE GAP", !has(v2, "SAVE GAP"), v2);

    /* 3. 42-DIGIT income: same grammar plus no e-notation */
    await fresh({ "bg-inc": "1" + "0".repeat(41) });
    const w3 = await text("bg-warn"), v3 = await text("al-verdict"), f3 = await text("bg-fig");
    check("42-digit/warn substring", has(w3, "looks unusually large"), w3);
    check("42-digit/verdict CANNOT SCORE", has(v3, "CANNOT SCORE"), v3);
    check("42-digit/verdict no SAVE GAP", !has(v3, "SAVE GAP"), v3);
    check("42-digit/fig no e-notation", !/e[+-]/i.test(f3), f3.slice(0, 120));

    /* 4. NEGATIVE income */
    await fresh({ "bg-inc": "-5000" });
    const w4 = await text("bg-warn"), l4 = await text("bg-live");
    check("negative/warn names Monthly income", has(w4, "Monthly income"), w4);
    check("negative/warn says negative", has(w4, "negative"), w4);
    check("negative/live no Plan now", !has(l4, "Plan now"), l4);

    /* 5. JUNK income */
    await fresh({ "bg-inc": "50,5" });
    const j5 = await text("bg-junk"), v5 = await text("al-verdict");
    check("junk/bg-junk not a number", has(j5, "not a number"), j5);
    check("junk/verdict CANNOT SCORE", has(v5, "CANNOT SCORE"), v5);

    /* 6. NEEDS OVER */
    await fresh({ "bg-inc": "300000", "bg-spn": "200000" });
    const v6 = await text("al-verdict"), n6 = await text("bg-next");
    check("needs-over/verdict NEEDS OVER", has(v6, "NEEDS OVER"), v6);
    check("needs-over/next link savings gap", has(n6, "savings gap"), n6);
    check("needs-over/next link Raise Needs %", has(n6, "Raise Needs %"), n6);
    check("needs-over/next link Trim rent/food/transport shares", has(n6, "Trim rent/food/transport shares"), n6);
    check("needs-over/next has three links",
      (await page.locator("#bg-next a").count()) === 3, n6);

    /* 7. AHEAD */
    await fresh({ "bg-inc": "300000", "bg-sps": "90000" });
    const v7 = await text("al-verdict"), n7 = await text("bg-next");
    check("ahead/verdict AHEAD", has(v7, "AHEAD"), v7);
    check("ahead/next link Bank the extra", has(n7, "Bank the extra"), n7);

    /* 8. AX: one named "Plan now" node; no StaticText duplicating the bare
          fig triple. InlineTextBox / LineBreak are raw rendering boxes, not
          named accessibility nodes, so they are excluded from the count (this
          is the E36 M1 / E16 F3 contract: #bg-fig is aria-hidden and the
          labelled #bg-live sentence is the single announcement). */
    await fresh();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Accessibility.enable");
    const { nodes } = await cdp.send("Accessibility.getFullAXTree");
    const figText = await text("bg-fig");
    const named = nodes.filter((n) => !n.ignored && n.role && n.role.value &&
      !/^(InlineTextBox|LineBreak)$/.test(n.role.value) && n.name && n.name.value);
    const planNow = named.filter((n) => n.name.value.startsWith("Plan now"));
    const figDup = nodes.filter((n) => !n.ignored && n.role && n.role.value === "StaticText" &&
      n.name && n.name.value.trim() === figText);
    check("ax/exactly one named Plan now node", planNow.length === 1,
      "count=" + planNow.length);
    check("ax/no StaticText duplicate of full bg-fig", figDup.length === 0,
      "count=" + figDup.length + " fig=" + figText);

    /* 9. Phone-first: no horizontal overflow at 320 and 390, seed + too-large */
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const [state, values] of [
        ["seed", {}],
        ["too-large", { "bg-inc": "1000000000000000" }],
      ]) {
        await fresh(values);
        const m = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          iw: window.innerWidth,
        }));
        check(`phone/${width}/${state} no horizontal overflow`, m.sw === m.iw,
          `scrollWidth=${m.sw} innerWidth=${m.iw}`);
      }
    }
    await cdp.detach().catch(() => {});
  } catch (err) {
    fail++;
    console.log("FAIL harness-error | " + (err && err.stack || err));
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await new Promise((r) => server.close(r));
  }
  const total = pass + fail;
  console.log(`\nux-parity: ${pass}/${total} PASS, ${fail} FAIL`);
  console.log(fail === 0 ? "ux-parity: PASS" : "ux-parity: FAIL");
  process.exit(fail === 0 ? 0 : 1);
}

main();
