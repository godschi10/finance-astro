#!/usr/bin/env node
/* merge-proof.mjs — one-off live-DOM proof for the 50-30-20 × allocator merge.
 * Own Chrome (free CDP port, never 9222/9333), own static server on a free port,
 * 390px viewport, both themes. Prints PASS/FAIL lines + writes screenshots. */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import net from "node:net";
import WebSocket from "ws";

const here = dirname(fileURLToPath(import.meta.url));
const repo = dirname(here);
const root = process.env.PROOF_ROOT || join(repo, "dist");
const OUT = "/home/opc/work/research-notes/merge-503020-2026-10-07";
mkdirSync(OUT, { recursive: true });

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".xml": "text/xml" };
function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.once("error", rej);
    s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); });
  });
}
async function freeCdp() {
  for (let p = 9560; p < 9620; p++) {
    if (p === 9222 || p === 9333) continue;
    const ok = await new Promise((r) => {
      const s = net.createServer();
      s.once("error", () => r(false));
      s.listen(p, "127.0.0.1", () => s.close(() => r(true)));
    });
    if (ok) return p;
  }
  throw new Error("no free CDP port");
}
function serve(rootDir, port) {
  const srv = createServer(async (req, res) => {
    try {
      let u = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (u.startsWith("/finance-astro")) u = u.slice("/finance-astro".length) || "/";
      let p = join(rootDir, u);
      if (u.endsWith("/")) p = join(p, "index.html");
      try { if ((await stat(p)).isDirectory()) p = join(p, "index.html"); } catch {}
      const buf = await readFile(p);
      res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
      res.end(buf);
    } catch { res.writeHead(404); res.end("nf"); }
  });
  return new Promise((r) => srv.listen(port, "127.0.0.1", () => r(srv)));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws = null;
let msgId = 0;
const pending = new Map();
function send(method, params = {}, timeout = 30000) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    const t = setTimeout(() => { pending.delete(id); rej(new Error("cdp timeout " + method)); }, timeout);
    pending.set(id, { res: (v) => { clearTimeout(t); res(v); }, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function ev(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("js: " + JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result?.value;
}
const say = (ok, label, extra = "") => console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`);

const CHROME = process.env.CHROME_BIN || "/home/opc/.cache/ms-playwright/chromium-1243/chrome-linux/chrome";
const main = async () => {
  const httpPort = await freePort();
  const cdpPort = await freeCdp();
  const srv = await serve(root, httpPort);
  const base = `http://127.0.0.1:${httpPort}/finance-astro`;
  const profile = join(tmpdir(), `merge-proof-${process.pid}`);
  rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
  const child = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
    "--no-first-run", "--no-default-browser-check", "--disable-extensions",
    `--user-data-dir=${profile}`, `--remote-debugging-port=${cdpPort}`, "--remote-allow-origins=*", "--ozone-platform=headless", "about:blank"],
    { stdio: ["ignore", "pipe", "pipe"] });
  try {
    let dbg = null;
    for (let i = 0; i < 100; i++) {
      await sleep(200);
      try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`).then((x) => x.json()); dbg = r.webSocketDebuggerUrl; break; } catch {}
    }
    if (!dbg) throw new Error("cdp never came up");
    const list = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((x) => x.json());
    const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (!page) throw new Error("no page target");
    dbg = page.webSocketDebuggerUrl;
    ws = new WebSocket(dbg);
    ws.on("message", (d) => { try { const m = JSON.parse(d); if (m.id && pending.has(m.id)) { pending.get(m.id).res(m.result); pending.delete(m.id); } } catch {} });
    await new Promise((r) => ws.on("open", r));
    await send("Page.enable"); await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    const shot = async (name) => {
      const r = await send("Page.captureScreenshot", { format: "png" });
      await writeFile(join(OUT, name), Buffer.from(r.data, "base64"));
    };
    const nav = async (url) => { await send("Page.navigate", { url }); await sleep(1500); };

    // 1. pointer page: raw bytes carry refresh+canonical+noindex+fallback
    const ptrRaw = await (await fetch(`${base}/money-tools/budget-allocator/`)).text();
    say(/http-equiv="refresh" content="0; url=/.test(ptrRaw), "pointer: meta refresh 0");
    say(ptrRaw.includes('rel="canonical"') && ptrRaw.includes("50-30-20-budget-calculator"), "pointer: canonical to 50-30-20");
    say(ptrRaw.includes('name="robots" content="noindex,follow"'), "pointer: noindex,follow");
    say(/<a href="[^"]*50-30-20-budget-calculator\/">open the 50\/30\/20 Budget Calculator<\/a>/.test(ptrRaw), "pointer: human fallback link");
    say(!ptrRaw.includes("ToolShell") && !ptrRaw.includes("receipt-row"), "pointer: no duplicate tool content");

    // meta refresh fires in headless chrome: where do we land?
    await nav(`${base}/money-tools/budget-allocator/`);
    const landed = await ev(`location.href`);
    say(landed.includes("50-30-20-budget-calculator"), "pointer: lands on 50-30-20", landed);

    // fallback with refresh blocked: take the href straight from the pointer bytes and fetch it
    const fbHref = (ptrRaw.match(/<a href="([^"]+)">open the 50\/30\/20 Budget Calculator<\/a>/) || [])[1];
    const fbAbs = fbHref.startsWith("http") ? fbHref : `http://127.0.0.1:${httpPort}${fbHref}`;
    const fbRes = await fetch(fbAbs);
    say(fbRes.status === 200 && fbHref.includes("50-30-20"), "pointer: fallback link target 200", fbHref);

    // 2. merged page: step 2 present + moves with step 1
    await nav(`${base}/money-tools/50-30-20-budget-calculator/`);
    await ev(`try{localStorage.clear()}catch(e){};location.reload()`);
    await sleep(1500);
    const hasStep2 = await ev(`!!document.getElementById("step2") && !!document.getElementById("al-rows") && !!document.getElementById("al-needs")`);
    say(hasStep2, "merged: step 2 section in DOM");
    const before = await ev(`document.getElementById("al-needs").textContent + " | " + document.querySelector('[data-al-amt="rent"]').textContent`);
    say(true, "step2 before", before);
    await shot("merge-hero-light-390.png");
    // change income 250000 -> 400000 via real input events
    await ev(`(()=>{const i=document.getElementById("bg-inc");i.focus();i.value="400000";i.dispatchEvent(new Event("input",{bubbles:true}));})()`);
    await sleep(800);
    const afterInc = await ev(`document.getElementById("al-needs").textContent + " | " + document.querySelector('[data-al-amt="rent"]').textContent`);
    say(afterInc.includes("₦200,000") && afterInc.includes("₦80,000"), "step2 follows income", `250k→400k: ${before} → ${afterInc}`);
    // change needs split 50 -> 60
    await ev(`(()=>{const i=document.getElementById("bg-needs");i.focus();i.value="60";i.dispatchEvent(new Event("input",{bubbles:true}));})()`);
    await sleep(800);
    const afterSplit = await ev(`document.getElementById("al-needs").textContent + " | " + document.querySelector('[data-al-amt="rent"]').textContent`);
    say(afterSplit.includes("₦240,000") && afterSplit.includes("₦96,000"), "step2 follows split", `needs 50→60: ${afterSplit}`);
    // live delta visible near fields (F2)
    // put the split field where the visitor's thumbs are, then check the line answers beside it
    await ev(`document.getElementById("bg-needs").scrollIntoView({block:"start"})`); await sleep(400);
    const liveVis = await ev(`(()=>{const l=document.getElementById("bg-live");const r=l.getBoundingClientRect();return !l.hidden && r.top>0 && r.top<844 ? l.textContent : "HIDDEN@" + Math.round(r.top)})()`);
    say(!String(liveVis).startsWith("HIDDEN"), "F2: live plan line visible at field", String(liveVis).slice(0, 80));
    await ev(`document.getElementById("bg-live").scrollIntoView({block:"center"})`); await sleep(400);
    await shot("merge-live-light-390.png");
    await ev(`document.getElementById("step2").scrollIntoView() `); await sleep(400);
    await shot("merge-step2-light-390.png");

    // F1: actuals-path trap — clear, type only into Spent on needs
    await ev(`try{localStorage.clear()}catch(e){};location.reload()`); await sleep(1500);
    await ev(`(()=>{const i=document.getElementById("bg-spn");i.focus();i.value="80000";i.dispatchEvent(new Event("input",{bubbles:true}));})()`);
    await sleep(800);
    const offer = await ev(`(()=>{const o=document.querySelector(".offer");if(!o||o.hidden)return "HIDDEN";return o.querySelector("span").textContent})()`);
    say(offer.includes("Plan puts needs at ₦125,000"), "F1: actuals-path meets teaching sentence", String(offer).slice(0, 90));

    // F3: Use this -> pasted note, Needs left 0
    await ev(`try{localStorage.clear()}catch(e){};location.reload()`); await sleep(1500);
    await ev(`(()=>{const i=document.getElementById("bg-needs");i.value="60";i.dispatchEvent(new Event("input",{bubbles:true}));})()`);
    await sleep(800);
    await ev(`document.querySelector('.offer b[data-use="bg-spn"]').click()`);
    await sleep(800);
    const pasted = await ev(`(()=>{const n=document.getElementById("bg-pasted");return n.hidden? "HIDDEN" : n.textContent})()`);
    const needsLeft = await ev(`document.getElementById("bg-rn").textContent`);
    say(!pasted.startsWith("HIDDEN") && pasted.includes("by construction"), "F3: paste named, compare survives", `${String(pasted).slice(0, 60)}… · Needs left ${needsLeft}`);
    await shot("merge-pasted-light-390.png");
    // typing real figure lifts the note
    await ev(`(()=>{const i=document.getElementById("bg-spn");i.value="90000";i.dispatchEvent(new Event("input",{bubbles:true}));})()`);
    await sleep(600);
    say(await ev(`document.getElementById("bg-pasted").hidden`), "F3: note lifts on real typing");

    // F4: type ONE field, reload, only it wears LAST USED
    await ev(`try{localStorage.clear()}catch(e){};location.reload()`); await sleep(1500);
    await ev(`(()=>{const i=document.getElementById("bg-inc");i.value="180000";i.dispatchEvent(new Event("input",{bubbles:true}));})()`);
    await sleep(600);
    await ev(`location.reload()`); await sleep(1500);
    const badges = await ev(`(()=>{const r=[];document.querySelectorAll(".field").forEach(f=>{const b=f.querySelector(".sd");const l=f.querySelector("label");let t="";l.childNodes.forEach(n=>{if(n.nodeType===3)t+=n.textContent});r.push(t.trim()+":"+(b?b.textContent:"plain"))});return r.join(" | ")})()`);
    const lastUsedCount = (badges.match(/:Last used/g) || []).length;
    const sampleCount = (badges.match(/:Sample/g) || []).length;
    say(lastUsedCount === 1 && badges.includes("Monthly income ₦:Last used"), "F4: only the typed field wears LAST USED", `${lastUsedCount} last-used, ${sampleCount} sample · ${badges.slice(0, 260)}`);

    // F5: outward links + lies
    const bodyText = await (await fetch(`${base}/money-tools/50-30-20-budget-calculator/`)).text();
    say(!bodyText.includes("sliders"), "F5: 'sliders' lie gone");
    say(!bodyText.includes("calculator below"), "F5: 'below' lie gone");
    const related = await ev(`Array.from(document.querySelectorAll(".g3 .app-card a, .fx-aff a")).map(a=>a.getAttribute("href")).join(" ")`);
    say(related.includes("compound-interest-calculator") && related.includes("savings-goal-calculator") && related.includes("inflation-savings-calculator"), "F5: outward links live", related.slice(0, 160));
    say(bodyText.includes('id="step2"') && bodyText.includes("Step 2 of this same calculator, below the receipt"), "F5: step1→step2 named in copy");

    // dark theme
    await send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-color-scheme", value: "dark" }] });
    await ev(`location.reload()`); await sleep(1500);
    await ev(`document.getElementById("step2").scrollIntoView()`); await sleep(400);
    await shot("merge-step2-dark-390.png");

    // served-bytes sweep: budget-allocator hrefs anywhere except pointer page
    say(true, "bytes sweep: see shell grep (below)");
  } finally {
    try { child.kill("SIGKILL"); } catch {}
    srv.close();
  }
};
main().catch((e) => { console.error("PROOF ERROR", e.message); process.exit(1); });
