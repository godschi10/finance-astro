#!/usr/bin/env node
/* Salary-tax UX contract: pins the grammar the human audits won.
   Serves dist/ over loopback unless UX_BASE is supplied, launches its own
   Chromium, and fails non-zero on the first regression. */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = dirname(here);
const DIST = process.env.UX_DIST || join(repo, "dist");
const PREFIX = "/finance-astro";
const CHROME = process.env.CHROME_BIN || "/home/opc/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome";
const MIME = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".mjs":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png", ".ico":"image/x-icon", ".webmanifest":"application/manifest+json", ".woff2":"font/woff2" };

let server = null, base = process.env.UX_BASE || "";
if (!base) {
  server = createServer(async (req, res) => {
    try {
      const p = decodeURIComponent((req.url || "/").split("?")[0]);
      if (!p.startsWith(PREFIX)) { res.writeHead(404); return res.end("not found"); }
      let rel = normalize(p.slice(PREFIX.length)).replace(/^\/+/, "");
      let file = join(DIST, rel);
      if (rel === "" || rel.endsWith("/")) file = join(file, "index.html");
      if (!existsSync(file) && existsSync(file + "/index.html")) file += "/index.html";
      const body = await readFile(file);
      res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch { res.writeHead(404); res.end("not found"); }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}${PREFIX}`;
}
const U = base + "/money-tools/salary-tax-calculator/";
const results = [];
function check(name, ok, detail = "") { results.push({ name, ok: !!ok, detail }); }

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const set = async (id, value) => p.evaluate(({ id, value }) => {
    const e = document.getElementById(id); if (!e) throw new Error("missing " + id);
    e.value = value; e.dispatchEvent(new Event("input", { bubbles: true }));
  }, { id, value });
  const txt = (id) => p.evaluate((id) => document.getElementById(id)?.textContent.trim() || "", id);
  const attr = (id, name) => p.evaluate(({ id, name }) => document.getElementById(id)?.getAttribute(name), { id, name });

  await p.goto(U, { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(250);

  // A30/A35: cold seed is ours, no invented change, no false exemption.
  check("A30 seed has 8 Sample badges", await p.locator(".field[data-sd]").count() === 8);
  check("A30 seed says Ours, not yours", (await txt("st-own-rec")).startsWith("Ours, not yours"));
  check("A30 seed has no last-change line", await p.locator("#st-last-change").evaluate((e) => e.hidden));
  check("A35 seed has no false EXEMPT", await p.locator("#st-bands-note").evaluate((e) => e.hidden));

  // A30/A27: reload is not an edit.
  await p.reload({ waitUntil: "networkidle" }); await p.waitForTimeout(250);
  check("A30 reload keeps 8 Sample badges", await p.locator(".field[data-sd]").count() === 8);
  check("A30 reload keeps Ours, not yours", (await txt("st-own-rec")).startsWith("Ours, not yours"));
  check("A30 reload hides last-change", await p.locator("#st-last-change").evaluate((e) => e.hidden));

  // A34/A35: malformed gross is withheld, not called “No salary”.
  await set("st-gross", "12.5.5"); await p.waitForTimeout(350);
  check("A34 malformed gross is withheld", (await txt("st-fig")) === "–");
  check("A34 malformed gross is not No salary", (await txt("st-fig")) !== "No salary");
  check("A34 malformed save is human", (await txt("st-save")).includes("Cannot work this out yet."));
  const warnMal = await txt("st-warn");
  check("A34 warn names not-a-figure", warnMal.includes("not a figure we can read"));
  check("A34 warn has Go-to separator", warnMal.includes("do. Go to"));

  // A34: NHF cap rail is a fix, not a statute dump.
  await p.evaluate(() => document.querySelector("[data-sf-reset]").click()); await p.waitForTimeout(250);
  await set("st-gross", "450000"); await set("st-pension", "8"); await set("st-nhf", "999999999"); await p.waitForTimeout(400);
  const warnNhf = await txt("st-warn");
  check("A34 NHF rail drops the Act citation", !warnNhf.includes("NHF Act") && !warnNhf.includes("Last checked"));
  check("A34 NHF rail still names the fix", warnNhf.includes("NHF has no statutory ceiling") && warnNhf.includes("Go to"));

  // A30: shortcut provenance.
  await p.evaluate(() => document.querySelector("[data-sf-reset]").click()); await p.waitForTimeout(250);
  await p.getByRole("button", { name: "Use this" }).click(); await p.waitForTimeout(300);
  check("A30 shortcut marks the field", await p.locator("#st-gross").evaluate((e) => e.closest(".field")?.getAttribute("data-shortcut")) === "minimum-wage");
  check("A30 shortcut is not counted as typed", (await txt("st-own-rec")).includes("from a shortcut"));
  check("A30 shortcut line is labelled", (await txt("st-last-change")).startsWith("Minimum-wage shortcut."));
  check("A30 shortcut says down, not negative", (await txt("st-last-change")).includes("take-home down ₦179,420/mo"));

  // A35: empty state is a waiting state, not EXEMPT/correction language.
  await p.evaluate(() => document.querySelector("[data-sf-reset]").click()); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector("[data-sf-clear]").click()); await p.waitForTimeout(350);
  check("A35 clear hides band note", await p.locator("#st-bands-note").evaluate((e) => e.hidden));
  check("A35 clear aria asks for numbers", (await attr("st-fig", "aria-label")) === "Take-home: enter your numbers to see it.");
  check("A35 clear save waits for gross", (await txt("st-save")).includes("wait for your gross"));
  check("A35 clear echo is present", await p.locator(".echo").evaluate((e) => !e.hidden));

  // A27/A31: reset keeps the period; units stay explicit.
  await p.evaluate(() => document.querySelector("[data-sf-reset]").click()); await p.waitForTimeout(250);
  await p.locator('[data-st-period="annual"]').click(); await p.waitForTimeout(300);
  await p.click("[data-sf-reset]"); await p.waitForTimeout(300);
  check("A27 reset keeps Annual", await p.locator('[data-st-period="annual"]').getAttribute("aria-pressed") === "true");
  check("A31 annual label is per year", (await txt("st-lbl")) === "Take-home per year");
  check("A31 annual comparison is /yr", (await txt("st-cmp-net-h")) === "Take-home /yr");
  check("A31 band headers are /yr", (await p.locator("#st-bands thead").innerText()).toUpperCase().includes("SLICE ₦/YR") && (await p.locator("#st-bands thead").innerText()).toUpperCase().includes("TAX ₦/YR"));

  // A28: next-step handoff carries the visible take-home.
  await p.locator('[data-st-period="monthly"]').click();
  await p.evaluate(() => { const e=document.getElementById("st-gross"); e.value="450000"; e.dispatchEvent(new Event("input",{bubbles:true})); });
  await p.evaluate(() => { const e=document.getElementById("st-pension"); e.value="10"; e.dispatchEvent(new Event("input",{bubbles:true})); });
  await p.waitForTimeout(450);
  const hrefs = await p.locator('a[href*="50-30-20-budget-calculator"],a[href*="gross-to-net-calculator"]').evaluateAll((as) => as.map((a) => a.href));
  check("A28 budget link carries income", hrefs.some((h) => h.includes("50-30-20") && h.includes("income=349600")), hrefs.join(" "));
  check("A28 gross link carries gross", hrefs.some((h) => h.includes("gross-to-net") && h.includes("gross=349600")), hrefs.join(" "));

  // A29: eight FAQs, plain schema text.
  check("A29 has 8 FAQs", await p.locator("details.faq").count() === 8);
  const faqSchema = await p.evaluate(() => {
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try { const d = JSON.parse(s.textContent); const g = d["@graph"]?.find((x) => x["@type"] === "FAQPage"); if (g) return g.mainEntity.map((q) => q.acceptedAnswer.text); } catch {}
    }
    return [];
  });
  check("A29 schema has 8 answers", faqSchema.length === 8);
  check("A29 schema has no HTML links", faqSchema.every((t) => !t.includes("<a")));

  // A36/A32: large amount fits at 320; print has no dead controls.
  await p.setViewportSize({ width: 320, height: 568 });
  await p.evaluate(() => { const e=document.getElementById("st-gross"); e.value=""; e.dispatchEvent(new Event("input",{bubbles:true})); });
  await p.evaluate(() => { const e=document.getElementById("st-gross"); e.value="2931625"; e.dispatchEvent(new Event("input",{bubbles:true})); });
  await p.waitForTimeout(350);
  const width = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, fsw: document.getElementById("st-fig").scrollWidth, fcw: document.getElementById("st-fig").clientWidth }));
  check("A36 320 has no page overflow", width.sw <= width.vw + 1, JSON.stringify(width));
  check("A36 large figure is not clipped", width.fsw <= width.fcw + 1, JSON.stringify(width));
  await p.emulateMedia({ media: "print" }); await p.waitForTimeout(250);
  const visibleButtons = await p.locator("button").evaluateAll((bs) => bs.filter((b) => { const s=getComputedStyle(b), r=b.getBoundingClientRect(); return s.display!=="none"&&s.visibility!=="hidden"&&r.width>2&&r.height>2; }).length);
  check("A32 print has zero buttons", visibleButtons === 0, String(visibleButtons));
  check("A32 print hides article/FAQ", await p.locator(".fx-copy.art-body").first().evaluate((e) => getComputedStyle(e).display === "none"));
  check("A32 print hides next action", await p.locator("#st-next").evaluate((e) => getComputedStyle(e).display === "none"));
} finally {
  await browser.close();
  if (server) await new Promise((r) => server.close(r));
}
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  [" + r.detail + "]" : ""}`);
console.log(`\nsalary-ux-contract: ${results.length - failed.length}/${results.length} PASS`);
process.exit(failed.length ? 1 : 0);
