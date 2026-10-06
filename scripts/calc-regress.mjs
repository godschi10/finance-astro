#!/usr/bin/env node
/* calc-regress.mjs — permanent behavioural regression suite for the 16 money tools.
 *
 * WHY THIS EXISTS: scripts/check-*.mjs pin static markup and vectors-check.mjs
 * pins the maths engines, but NOTHING asserted how the calculators behave —
 * Reset without reload, the Clear-examples cycle, the honest empty state, typed
 * zero vs absent, stale-figure recompute. Every leg re-proved those by hand and
 * the proof evaporated at the next ship. This runner asserts them on every
 * build, against served dist/ bytes, through a real Chrome, and exits non-zero
 * on any failure so it can gate a ship.
 *
 * CONTRACTS (one row each per tool, where applicable):
 *   reset      — sentinel window var survives Reset (no reload) + every control
 *                returns to its server-seeded value + figures repaint to seeded.
 *   clear      — type real values -> Clear examples -> empty -> type again ->
 *                real figures return (this exact regression shipped twice).
 *   empty      — on a genuinely empty form, receipt figures read "—", never ₦0.
 *   zero       — a deliberately typed 0 still produces a real zero (THE ZERO
 *                LAW, tool-fields.ts: entering "0" is entered; "" / "." / "abc"
 *                is absent). At least one hero figure must show a real 0.
 *   derived    — blanking one input dashes at least one dependent figure
 *                (sfFig withholds as "—", never a fabricated naira amount).
 *   adversarial— after "", "-5000", "99999999999", ".", "abc", "₦1,234.50" and
 *                "1,234.50" in every text field, the DOM holds no NaN/Infinity/
 *                "undefined" string anywhere in its rendered text.
 *   stale      — changing one input actually changes a dependent figure.
 *   rails      — with inputs blank, .receipt-note/.bar-note prose asserts no
 *                naira conclusion (no ₦<digit>, no "you keep/you save" claim).
 *   console    — zero console errors / unhandled rejections while we drive.
 *
 * APPLICABILITY (read off the repo's own table, never invented): seeds/required
 * per tool are parsed from src/data/tool-fields.ts TOOL_FIELDS. A tool with no
 * required fields (exchange-rate-history: select-only, never empty by design)
 * SKIP-marks clear/empty/zero/derived/rails with the reason, and still runs
 * reset/adversarial/stale/console. A SKIP is never a pass and never a fail.
 *
 * HARD RULES: zero new dependencies (ws + node builtins only). One Chrome, one
 * reused tab, sequential. Deterministic waits only — every wait polls a real
 * condition (value equality, text change, stability); there is no bare sleep.
 * Own Chrome on a free port (never :9222/:9333); browser + server die in the
 * finally even when a run crashes mid-tool.
 *
 * Usage: node scripts/calc-regress.mjs [--probe slug] [--tool slug]
 *   --probe slug  dump raw DOM states for calibration, no assertions, exit 0.
 *   --tool slug   run the full suite for one tool only (debugging).
 * Env: CHROME_BIN override; CALC_REGRESS_OUT result-file path
 *      (default /tmp/calc-regress-results.json); CALC_REGRESS_ROOT dist override
 *      (the deliberate-failure proof runs the suite against a scratch copy).
 */

import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import WebSocket from "ws";

const here = dirname(fileURLToPath(import.meta.url));
const repo = dirname(here);
const args = process.argv.slice(2);
const opt = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : null;
};
const PROBE = opt("--probe");
const ONLY = opt("--tool");

/* ── the sixteen, in hub print order, from the repo's own manifest ── */
function toolSlugs() {
  const src = new URL("../src/data/tool-manifest.ts", import.meta.url);
  return import("node:fs").then(({ readFileSync }) => {
    const txt = readFileSync(src, "utf8");
    const slugs = [...txt.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
    if (slugs.length !== 16) throw new Error(`expected 16 slugs, parsed ${slugs.length}`);
    return slugs;
  });
}
/* seeds/required per tool, parsed from the repo's own TOOL_FIELDS table. */
import { readFileSync } from "node:fs";
function parseToolFields() {
  const txt = readFileSync(join(repo, "src", "data", "tool-fields.ts"), "utf8");
  const out = {};
  for (const m of txt.matchAll(/"([a-z0-9-]+)":\s*\{([\s\S]*?)\n  \},/g)) {
    const [, slug, body] = m;
    const grab = (k) => {
      const mm = body.match(new RegExp(k + ":\\s*\\[([^\\]]*)\\]"));
      if (!mm) return [];
      return [...mm[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    };
    out[slug] = { seeds: grab("seeds"), required: grab("required") };
  }
  return out;
}

const ADV = ["", "-5000", "99999999999", ".", "abc", "₦1,234.50", "1,234.50"];
const BAD_RE = /NaN|Infinity|undefined/;
const GOLD_ZERO_RE = /^[₦$£€]?\s*0(\.0+)?$/;
const RAIL_MONEY_RE = /₦\s*[\d,]/;
const RAIL_CLAIM_RE = /you keep|you save|both regimes leave|best rate for you/i;
/* The spine's own honest-empty voice (SUB_VOICE, tool-fields.ts): it names ₦0
   only to DENY it ("an empty field is not ₦0"). Judging the rails against the
   sentence that teaches the honesty rule would fail every honest page. */
const VOICE_RE = /enter your numbers above.{0,40}empty field is not ₦0\.?/i;
/* The pages' own demand-for-input rails: "Enter a monthly gross above ₦0 —
   take-home waits until you do." These name ₦0 as a THRESHOLD the visitor has
   not met, assert no figure about the visitor, and vanish the moment a value
   is typed. Failing them would punish the exact honesty the rails contract
   exists to require. A rail fails only when it prints a naira amount with NO
   demand, denial, or emptiness word anywhere in it — i.e. a bare conclusion. */
const RAIL_HONEST_RE = /enter |waits? until|is not ₦0|not a .* goal|empty/i;

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json",
  ".xml": "text/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8",
};

/* ── free ports (loopback only) ── */
import net from "node:net";
function freePort() {
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
  for (let p = 9550; p < 9620; p++) {
    const ok = await new Promise((r) => {
      const s = net.createServer();
      s.once("error", () => r(false));
      s.listen(p, "127.0.0.1", () => s.close(() => r(true)));
    });
    if (ok) {
      if (p === 9222 || p === 9333) continue;
      return p;
    }
  }
  throw new Error("no free CDP port in 9550-9619");
}

/* ── static server over a dist root (the /finance-astro base is stripped) ── */
function serve(root) {
  const srv = createServer(async (req, res) => {
    try {
      let u = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (u.startsWith("/finance-astro")) u = u.slice("/finance-astro".length) || "/";
      let p = join(root, u);
      if (u.endsWith("/")) p = join(p, "index.html");
      try {
        const st = await stat(p);
        if (st.isDirectory()) p = join(p, "index.html");
      } catch { /* fall through to 404 */ }
      const buf = await readFile(p);
      res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
      res.end(buf);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("nope");
    }
  });
  return new Promise((resolve) => srv.listen(0, "127.0.0.1", () => resolve(srv)));
}

/* ── minimal CDP client over ws ── */
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { maxPayload: 64 * 1024 * 1024 });
    const pending = new Map();
    let id = 0;
    const handlers = [];
    ws.on("open", () => resolve({
      onEvent(fn) { handlers.push(fn); },
      send(method, params = {}, timeoutMs = 30000) {
        const myId = ++id;
        return new Promise((res, rej) => {
          const t = setTimeout(() => { pending.delete(myId); rej(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
          pending.set(myId, { res, rej, t });
          ws.send(JSON.stringify({ id: myId, method, params }));
        });
      },
      close() { ws.close(); },
    }));
    ws.on("message", (raw) => {
      let m;
      try { m = JSON.parse(raw.toString()); } catch { return; }
      if (m.id && pending.has(m.id)) {
        const { res, rej, t } = pending.get(m.id);
        pending.delete(m.id);
        clearTimeout(t);
        if (m.error) rej(new Error(`CDP ${m.error.message}`));
        else res(m.result);
      } else if (m.method) {
        handlers.forEach((fn) => { try { fn(m); } catch {} });
      }
    });
    ws.on("error", reject);
  });
}

async function httpJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}

/* ── page helpers (all real conditions, no sleeps) ── */
const cdp = { session: null, loadResolve: null };
const capRef = { current: [] };
function attachHandlers(session) {
  session.onEvent((m) => {
    if (m.method === "Runtime.consoleAPICalled") {
      const a = m.params || {};
      if (a.type === "error") {
        const text = (a.args || []).map((x) => x.description || x.value || "").join(" ").slice(0, 300);
        capRef.current.push({ type: "error", text });
      }
    } else if (m.method === "Runtime.exceptionThrown") {
      const d = m.params?.exceptionDetails || {};
      capRef.current.push({ type: "exception", text: (d.text || d.exception?.description || "exception").slice(0, 300) });
    } else if (m.method === "Page.loadEventFired") {
      if (cdp.loadResolve) { const f = cdp.loadResolve; cdp.loadResolve = null; f(); }
    }
  });
}
/* Hang-vs-load discriminator (run-4 lesson). A per-value timeout has TWO
   possible authors: the page (unbounded render loop — a site bug) or the box
   (swap-starved, 90s+ page loads — an environment wobble that run 4 showed
   repeatedly). Declaring HANG on a box wobble is a false positive against the
   site, so before the verdict we ask a FRESH blank target on the SAME browser
   to evaluate 1+1. Fresh target answers => the browser is fine and the tool
   tab is truly wedged => HangError. Fresh target silent => the box/browser
   is the author => ordinary error (relaunch + retry, no verdict against the
   page). An all-blank form ("") can never loop — it withholds without
   calling the schedule — so a "" timeout that the probe contradicts is the
   exact signature of box slowness, and is classified as such. */
async function probeAnswers(timeoutMs = 20000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(`http://127.0.0.1:${browser.cdpPort}/json/new?about:blank`, { method: "PUT", signal: ctl.signal });
    const target = await r.json();
    try {
      const s = await Promise.race([
        connect(target.webSocketDebuggerUrl),
        new Promise((_, rej) => setTimeout(() => rej(new Error("probe connect timeout")), timeoutMs)),
      ]);
      try {
        await s.send("Runtime.evaluate", { expression: "1+1", returnByValue: true }, timeoutMs);
        return true;
      } finally { try { s.close(); } catch {} }
    } finally {
      try { await fetch(`http://127.0.0.1:${browser.cdpPort}/json/close/${target.id}`, { method: "PUT", signal: AbortSignal.timeout(10000) }); } catch {}
    }
  } finally { clearTimeout(t); }
}
/* A page that stops answering mid-contract. The confirmed instances are
   UNBOUNDED RENDER LOOPS: savings-goal typed 99999999999 into every field and
   the tab never answered again — buildSchedule() in src/lib/savings.ts loops
   `months` times with no cap, and the page's "Out of range" guard only checks
   savingsCalculate() finiteness, which short-circuits to finite when
   target == current. The schedule then iterates ~1e11 times. Same engine
   feeds compound-interest (confirmed hung the same way). One hung tab must
   never poison the rest of the run, so the cure is a fresh browser process:
   a renderer wedged in a 1e11-iteration loop (or OOM from the rows it builds)
   cannot be reasoned with over the same CDP connection. */
class HangError extends Error {
  constructor(value, extra = "") {
    super(`tab unresponsive after ${JSON.stringify(value)}${extra ? ` — ${extra}` : ""}`);
    this.value = value;
  }
}
/* Box wobble, not a page verdict: propagates out of runTool so the main loop
   relaunches and retries the whole tool instead of recording a failure. */
class EnvError extends Error {}
const browser = { child: null, profile: "", cdpPort: 0, chrome: "" };
async function waitChromeUp() {
  for (let i = 0; i < 100; i++) {
    try { await httpJson(`http://127.0.0.1:${browser.cdpPort}/json/version`); return; }
    catch { await new Promise((r) => setTimeout(r, 200)); }
  }
  throw new Error("chrome CDP never came up");
}
async function attachFreshSession() {
  const targets = await httpJson(`http://127.0.0.1:${browser.cdpPort}/json/list`);
  const page = targets.find((t) => t.type === "page") || targets[0];
  if (!page?.webSocketDebuggerUrl) throw new Error("no page target to attach");
  try { if (cdp.session) cdp.session.close(); } catch {}
  cdp.session = await connect(page.webSocketDebuggerUrl);
  attachHandlers(cdp.session);
  await cdp.session.send("Page.enable", {}, 60000);
  await cdp.session.send("Runtime.enable", {}, 60000);
}
async function launchBrowser() {
  rmSync(browser.profile, { recursive: true, force: true });
  mkdirSync(browser.profile, { recursive: true });
  browser.child = spawn(browser.chrome, [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
    "--no-first-run", "--no-default-browser-check", "--disable-extensions",
    "--js-flags=--max-old-space-size=256",
    `--user-data-dir=${browser.profile}`, `--remote-debugging-port=${browser.cdpPort}`,
    "--ozone-platform=headless", "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe"] });
  browser.child.stdout.on("data", () => {});
  browser.child.stderr.on("data", () => {});
  await waitChromeUp();
  await attachFreshSession();
}
async function killBrowser() {
  const c = browser.child;
  browser.child = null;
  if (c) {
    try { c.kill("SIGKILL"); } catch {}
    await new Promise((r) => {
      let done = false;
      const fin = () => { if (!done) { done = true; r(); } };
      c.once("exit", fin);
      setTimeout(fin, 8000);
    });
    try {
      await new Promise((res) => {
        const t = setInterval(async () => {
          try { process.kill(c.pid, 0); } catch { clearInterval(t); res(); }
        }, 200);
        setTimeout(() => { clearInterval(t); res(); }, 8000);
      });
    } catch {}
  }
  /* The whole tree, not just the parent: a renderer wedged in an unbounded
     loop outlives its SIGKILLed browser (reparented, still burning CPU/RAM).
     The profile dir is unique per run, so this pattern cannot touch the
     shared :9222/:9333 browsers or anyone else's tree. */
  if (browser.profile) {
    try { execFileSync("pkill", ["-f", `user-data-dir=${browser.profile}`]); } catch {}
  }
}
/* The full cure for a wedged renderer: fresh process, fresh session, profile
   wiped. Used both for a hang inside a tool and for a dead tab between tools. */
async function relaunchBrowser() {
  try { if (cdp.session) cdp.session.close(); } catch {}
  cdp.session = null;
  await killBrowser();
  await launchBrowser();
}
async function navigate(url) {
  await cdp.session.send("Page.navigate", { url }, 90000);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("loadEvent timeout")), 90000);
    cdp.loadResolve = () => { clearTimeout(t); resolve(); };
  });
}
async function ev(expr, timeoutMs = 60000) {
  const r = await cdp.session.send("Runtime.evaluate", {
    expression: expr, returnByValue: true, awaitPromise: true,
  }, timeoutMs);
  if (r.exceptionDetails) throw new Error(`page threw: ${JSON.stringify(r.exceptionDetails).slice(0, 300)}`);
  return r.result?.value;
}
async function waitFor(expr, timeoutMs = 15000, label = "condition") {
  const t0 = Date.now();
  let last;
  for (;;) {
    last = await ev(`(${expr})`);
    if (last) return last;
    if (Date.now() - t0 > timeoutMs) throw new Error(`wait timeout (${label}); last=${JSON.stringify(last)?.slice(0, 200)}`);
    await new Promise((r) => setTimeout(r, 120));
  }
}
/* stable = same JSON twice in a row; stillMs of quiet across polls. */
async function waitStable(expr, stillMs = 1200, timeoutMs = 30000, label = "settle") {
  const t0 = Date.now();
  let prev = await ev(`JSON.stringify((${expr}))`);
  let quietSince = Date.now();
  for (;;) {
    await new Promise((r) => setTimeout(r, 200));
    const cur = await ev(`JSON.stringify((${expr}))`);
    if (cur === prev) {
      if (Date.now() - quietSince >= stillMs) return JSON.parse(cur);
    } else { prev = cur; quietSince = Date.now(); }
    if (Date.now() - t0 > timeoutMs) throw new Error(`settle timeout (${label})`);
  }
}

const JS_CONTROLS = `(() => { const out = [];
  document.querySelectorAll(".con input,.con select,.con textarea").forEach((n) => {
    if (!n.id || /^(hidden|submit|button|reset|image)$/.test(n.type)) return;
    const chk = /^(checkbox|radio)$/.test(n.type);
    out.push({ id: n.id, kind: n.tagName === "SELECT" ? "select" : (chk ? "check" : "text"),
      val: chk ? !!n.checked : n.value });
  }); return out; })()`;
const JS_STATE = `(() => {
  const T = (s) => Array.from(document.querySelectorAll(s)).map((n) => (n.textContent || "").trim().slice(0, 220));
  const card = document.querySelector("[data-sf-card]");
  const clear = document.querySelector("[data-sf-clear]");
  return { hero: T(".receipt-fig,.receipt-row b,[data-sf-fig]"),
    notes: T(".receipt-note,.bar-note,.receipt-sub"),
    cardHidden: card ? !!card.hidden : "absent",
    clearHidden: clear ? !!clear.hidden : "absent",
    body: (document.body ? document.body.innerText : "").slice(0, 30000) };
})()`;
const JS_SETTLE_KEY = `(() => {
  const T = (s) => Array.from(document.querySelectorAll(s)).map((n) => (n.textContent || "").trim());
  return { h: T(".receipt-fig,.receipt-row b,[data-sf-fig]"), n: T(".receipt-note,.bar-note,.receipt-sub") }; })()`;

function setCtlExpr(c, value) {
  const v = JSON.stringify(value);
  if (c.kind === "select") {
    return `(() => { const n = document.getElementById(${JSON.stringify(c.id)});
      n.value = ${v}; n.dispatchEvent(new Event("input", { bubbles: true }));
      n.dispatchEvent(new Event("change", { bubbles: true })); return n.value; })()`;
  }
  if (c.kind === "check") {
    return `(() => { const n = document.getElementById(${JSON.stringify(c.id)});
      n.checked = ${value ? "true" : "false"};
      n.dispatchEvent(new Event("input", { bubbles: true }));
      n.dispatchEvent(new Event("change", { bubbles: true })); return !!n.checked; })()`;
  }
  return `(() => { const n = document.getElementById(${JSON.stringify(c.id)});
    n.value = ${v}; n.dispatchEvent(new Event("input", { bubbles: true })); return n.value; })()`;
}
const ctrlsKey = (cs) => JSON.stringify(cs.map((c) => [c.id, c.kind === "text" ? String(c.val) : c.val]));

/* ── per-tool run ── */
function rec(status, detail = "") { return { status, detail: String(detail).slice(0, 400) }; }

async function runTool(slug, base, fields) {
  const R = {};
  const url = `${base}/money-tools/${slug}/`;
  const cap = [];
  capRef.current = cap;
  await navigate(url);
  /* deterministic start: clean memory, server-seeded values, settled figures. */
  await ev(`(async () => { try { localStorage.clear(); } catch (e) {} })()`);
  await cdp.session.send("Page.reload", { ignoreCache: true }, 90000);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("reload timeout")), 90000);
    cdp.loadResolve = () => { clearTimeout(t); resolve(); };
  });
  await waitFor(`!!document.querySelector(".receipt,[data-sf-card]")`, 30000, "receipt present");
  const st0 = await waitStable(JS_SETTLE_KEY, 1500, 60000, "initial settle");
  const seed = await ev(JS_CONTROLS);
  const texts = seed.filter((c) => c.kind === "text");
  const req = (fields[slug] && fields[slug].required) || [];
  const hasInputs = texts.length > 0;
  const emptyCapable = req.length > 0;
  let emptyHero = null; // the genuinely-empty hero set: typed-0 must differ from it.

  /* RESET — sentinel survives (no reload) + controls + figures back to seeded. */
  try {
    if (!await ev(`!!document.querySelector("[data-sf-reset]")`)) {
      R.reset = rec("skip", "no [data-sf-reset] on page");
    } else {
      await ev(`window.__rr = "alive"`);
      for (const c of seed) {
        if (c.kind === "text") await ev(setCtlExpr(c, "424242"));
        else if (c.kind === "select") {
          await ev(`(() => { const n = document.getElementById(${JSON.stringify(c.id)});
            if (n.options.length > 1) { n.selectedIndex = (n.selectedIndex + 1) % n.options.length; }
            n.dispatchEvent(new Event("change", { bubbles: true })); return 1; })()`);
        } else await ev(setCtlExpr(c, !c.val));
      }
      await waitStable(JS_SETTLE_KEY, 600, 20000, "mutated settle");
      await ev(`document.querySelector("[data-sf-reset]").click()`);
      await waitFor(`JSON.stringify((${JS_CONTROLS}).map((c) => [c.id, c.kind === "text" ? String(c.val) : c.val])) === ${JSON.stringify(ctrlsKey(seed))}`, 15000, "controls restored");
      const figsBack = await waitStable(JS_SETTLE_KEY, 800, 20000, "reset repaint");
      const alive = await ev(`window.__rr === "alive"`);
      const figsMatch = JSON.stringify(figsBack.h) === JSON.stringify(st0.h);
      R.reset = (alive && figsMatch)
        ? rec("pass", `${seed.length} controls restored, figures match seeded`)
        : rec("fail", `sentinel=${alive ? "alive" : "DEAD (reload!)"} figsMatch=${figsMatch}`);
    }
  } catch (e) { R.reset = rec("fail", `harness: ${e.message}`); }

  /* CLEAR CYCLE (+ EMPTY + RAILS while the form is genuinely empty). */
  let clearedState = null;
  try {
    if (!emptyCapable) {
      R.clear = rec("skip", "no required fields (never empty by design)");
      R.empty = rec("skip", "no required fields");
      R.rails = rec("skip", "no empty state to judge prose against");
    } else {
      const clearHidden = await ev(`(() => { const b = document.querySelector("[data-sf-clear]"); return b ? !!b.hidden : "absent"; })()`);
      if (clearHidden !== false) {
        /* No live seeds (button absent/hidden): reach a genuine empty by
           blanking every required+seed field, then retype and assert return. */
        const ids = [...new Set([...req, ...((fields[slug] || {}).seeds || [])])];
        for (const c of seed.filter((c) => ids.includes(c.id) && c.kind === "text")) await ev(setCtlExpr(c, ""));
        clearedState = await waitStable(JS_SETTLE_KEY, 800, 20000, "manual empty settle");
        const allDash = clearedState.h.length > 0 && clearedState.h.every((t) => t === "—");
        const noGoldZero = clearedState.h.every((t) => !GOLD_ZERO_RE.test(t));
        R.empty = (allDash && noGoldZero) ? rec("pass", `${clearedState.h.length} figures all "—"`)
          : rec("fail", `hero=${JSON.stringify(clearedState.h).slice(0, 300)}`);
        for (const c of seed) await ev(setCtlExpr(c, c.kind === "text" ? String(c.val) : c.val));
        const back = await waitStable(JS_SETTLE_KEY, 800, 20000, "manual retype settle");
        const match = JSON.stringify(back.h) === JSON.stringify(st0.h);
        R.clear = (allDash && match)
          ? rec("pass", `manual empty "—" then figures returned (${back.h.length})`)
          : rec("fail", `empty=${allDash} retypeMatch=${match} back=${JSON.stringify(back.h).slice(0, 250)}`);
      } else {
        await ev(`document.querySelector("[data-sf-clear]").click()`);
        clearedState = await waitStable(JS_SETTLE_KEY, 800, 20000, "cleared settle");
        const card = await ev(`(() => { const c = document.querySelector("[data-sf-card]"); return c ? !!c.hidden : "absent"; })()`);
        const allDash = clearedState.h.length > 0 && clearedState.h.every((t) => t === "—");
        const noGoldZero = clearedState.h.every((t) => !GOLD_ZERO_RE.test(t));
        R.empty = (allDash && noGoldZero) ? rec("pass", `${clearedState.h.length} figures all "—"`)
          : rec("fail", `hero=${JSON.stringify(clearedState.h).slice(0, 300)}`);
        /* type AGAIN from the cleared state — the twice-shipped regression. */
        for (const c of seed) await ev(setCtlExpr(c, c.kind === "text" ? String(c.val) : c.val));
        const back = await waitStable(JS_SETTLE_KEY, 800, 20000, "retype settle");
        const match = JSON.stringify(back.h) === JSON.stringify(st0.h);
        R.clear = (allDash && match)
          ? rec("pass", `empty "—" then figures returned (${back.h.length})`)
          : rec("fail", `empty=${allDash} retypeMatch=${match} back=${JSON.stringify(back.h).slice(0, 250)}`);
      }
      /* RAILS — judged on the genuinely-empty figures captured above. A rail
         fails only for a BARE naira conclusion: ₦<digit> with no demand,
         denial, or emptiness word in the sentence (see RAIL_HONEST_RE). */
      const vis = clearedState.n.filter((t) => t && t.length).map((t) => t.replace(VOICE_RE, ""));
      const money = vis.filter((t) => RAIL_MONEY_RE.test(t) && !RAIL_HONEST_RE.test(t));
      const claim = vis.filter((t) => RAIL_CLAIM_RE.test(t));
      R.rails = (money.length === 0 && claim.length === 0)
        ? rec("pass", `${vis.length} rails, none asserts naira`)
        : rec("fail", `money=${JSON.stringify(money).slice(0, 250)} claim=${JSON.stringify(claim).slice(0, 250)}`);
      emptyHero = clearedState.h;
    }
  } catch (e) {
    R.clear = R.clear || rec("fail", `harness: ${e.message}`);
    R.empty = R.empty || rec("fail", `harness: ${e.message}`);
    R.rails = R.rails || rec("fail", `harness: ${e.message}`);
  }

  /* restore seeded state before the value-driven contracts. */
  try {
    await ev(`document.querySelector("[data-sf-reset]").click()`);
    await waitFor(`JSON.stringify((${JS_CONTROLS}).map((c) => [c.id, c.kind === "text" ? String(c.val) : c.val])) === ${JSON.stringify(ctrlsKey(seed))}`, 15000, "reseed");
    await waitStable(JS_SETTLE_KEY, 800, 20000, "reseed settle");
  } catch (e) { /* reset already judged; keep going from whatever state */ }

  /* TYPED ZERO — every text field "0". The page must DISTINGUISH it from
     absent: either real zeros print (the zero law), or the heroes voice an
     explicit demand ("Enter a target") that the empty state never shows. What
     fails is a zero-state identical to the empty state (0 swallowed as
     absent — the shipped-twice bug class in both directions), or NaN/Infinity. */
  try {
    if (!hasInputs) R.zero = rec("skip", "no text inputs");
    else if (!emptyHero) R.zero = rec("skip", "no empty baseline to distinguish from");
    else {
      for (const c of texts) await ev(setCtlExpr(c, "0"));
      const z = await waitStable(JS_SETTLE_KEY, 800, 30000, "zero settle");
      const full = await ev(JS_STATE);
      const anyRealZero = z.h.some((t) => /0/.test(t) && t !== "—");
      const distinguished = JSON.stringify(z.h) !== JSON.stringify(emptyHero);
      const bad = BAD_RE.test(full.body);
      R.zero = ((anyRealZero || distinguished) && !bad)
        ? rec("pass", anyRealZero ? `real zero prints (${JSON.stringify(z.h).slice(0, 200)})` : `zero voiced distinctly (${JSON.stringify(z.h).slice(0, 200)})`)
        : rec("fail", `anyRealZero=${anyRealZero} distinguished=${distinguished} domClean=${!bad} hero=${JSON.stringify(z.h).slice(0, 250)}`);
    }
  } catch (e) { R.zero = rec("fail", `harness: ${e.message}`); }

  /* DERIVED HONESTY — blank one secondary input: a dependent must dash. */
  try {
    if (!emptyCapable || texts.length === 0) R.derived = rec("skip", "no blankable dependency");
    else {
      for (const c of texts) await ev(setCtlExpr(c, "0"));
      await waitStable(JS_SETTLE_KEY, 600, 20000, "derived base");
      const victim = texts[1] || texts[0];
      await ev(setCtlExpr(victim, ""));
      const d = await waitStable(JS_SETTLE_KEY, 800, 20000, "derived settle");
      const dashed = d.h.filter((t) => t === "—").length;
      const full = await ev(JS_STATE);
      const bad = BAD_RE.test(full.body);
      R.derived = (dashed >= 1 && !bad)
        ? rec("pass", `${victim.id} blank → ${dashed} figure(s) withheld`)
        : rec("fail", `dashed=${dashed} domClean=${!bad} hero=${JSON.stringify(d.h).slice(0, 250)}`);
    }
  } catch (e) { R.derived = rec("fail", `harness: ${e.message}`); }

  /* ADVERSARIAL — hostile values in every text field, DOM must stay clean.
     A value that leaves the tab unresponsive past a 12s leash is recorded as
     the failure it is (input-driven hang — see HangError note above), the
     browser is relaunched, and the tool CONTINUES on a fresh tab so one hung
     page cannot eat the contracts below it. Remaining hostile values are
     listed untested in the detail line. */
  try {
    if (!hasInputs) R.adversarial = rec("skip", "no text inputs");
    else {
      const badAt = [];
      const untested = [];
      let hung = null;
      for (const v of ADV) {
        if (hung) { untested.push(JSON.stringify(v)); continue; }
        try {
          for (const c of texts) await ev(setCtlExpr(c, v), 15000);
          await waitStable(JS_SETTLE_KEY, 600, 12000, `adv ${JSON.stringify(v)}`);
          const full = await ev(JS_STATE, 15000);
          if (BAD_RE.test(full.body)) {
            const m = full.body.match(/.{0,40}(NaN|Infinity|undefined).{0,40}/);
            badAt.push(`${JSON.stringify(v)}→${m ? m[0] : "?"}`);
          }
        } catch (e) {
          /* Timeout here: page hang or box wobble? The probe decides. A TRUE
             hang (probe answers, tool tab silent) becomes the recorded HANG
             failure; a box wobble (probe silent too) rethrows as environment
             so the whole tool is relaunched and retried with no verdict. */
          let answered = false;
          try { answered = await probeAnswers(); } catch { answered = false; }
          if (answered) hung = new HangError(v, e.message);
          else throw new EnvError(`box too slow during adversarial ${JSON.stringify(v)} (probe silent): ${e.message}`);
        }
      }
      if (hung) {
        await relaunchBrowser();
        capRef.current = cap;
        await navigate(url);
        await ev(`(async () => { try { localStorage.clear(); } catch (e) {} })()`);
        await cdp.session.send("Page.reload", { ignoreCache: true }, 90000);
        await new Promise((resolve, reject) => {
          const t = setTimeout(() => reject(new Error("post-hang reload timeout")), 90000);
          cdp.loadResolve = () => { clearTimeout(t); resolve(); };
        });
        await waitFor(`!!document.querySelector(".receipt,[data-sf-card]")`, 30000, "receipt present");
        await waitStable(JS_SETTLE_KEY, 1500, 60000, "post-hang settle");
      }
      R.adversarial = (!hung && badAt.length === 0)
        ? rec("pass", `${ADV.length} hostile values, DOM clean`)
        : rec("fail", [hung ? `HANG on ${JSON.stringify(hung.value)} (tab relaunched; site hung, not the harness)` : "",
            ...badAt, ...(untested.length ? [`untested after hang: ${untested.join(",")}`] : [])].filter(Boolean).join(" | "));
    }
  } catch (e) {
    if (e instanceof EnvError) throw e;
    R.adversarial = rec("fail", `harness: ${e.message}`);
  }

  /* STALE RECOMPUTE — one input changes => a dependent figure changes. */
  try {
    if (!hasInputs) R.stale = rec("skip", "no text inputs");
    else {
      await ev(`document.querySelector("[data-sf-reset]").click()`);
      await waitStable(JS_SETTLE_KEY, 800, 20000, "stale base");
      const before = await ev(JS_SETTLE_KEY);
      const first = texts[0];
      const alt = String(first.val).replace(/\d$/, (d) => (d === "7" ? "8" : "7")) + "7";
      await ev(setCtlExpr(first, alt));
      await waitStable(JS_SETTLE_KEY, 800, 20000, "stale changed");
      const after = await ev(JS_SETTLE_KEY);
      const changed = before.h.some((t, i) => after.h[i] !== t) ||
        before.n.some((t, i) => after.n[i] !== t);
      R.stale = changed
        ? rec("pass", `${first.id} changed a dependent figure`)
        : rec("fail", `no figure moved after ${first.id} edit`);
    }
  } catch (e) { R.stale = rec("fail", `harness: ${e.message}`); }

  /* CONSOLE — any error/rejection captured while driving this tool fails it. */
  const errs = cap.filter((m) => m.type === "error" || m.type === "exception");
  R.console = errs.length === 0
    ? rec("pass", "no console errors")
    : rec("fail", errs.slice(0, 3).map((m) => m.text.slice(0, 150)).join(" | "));
  return R;
}

/* ── main ── */
async function main() {
  const t0 = Date.now();
  const root = process.env.CALC_REGRESS_ROOT || join(repo, "dist");
  if (!existsSync(join(root, "money-tools"))) {
    console.error(`calc-regress: FAIL — no money-tools/ under ${root}. Run \`npm run build\` first (this suite never builds for you).`);
    process.exit(2);
  }
  const slugsAll = await toolSlugs();
  const fields = parseToolFields();
  const slugs = ONLY ? (slugsAll.includes(ONLY) ? [ONLY] : (() => { throw new Error(`unknown tool ${ONLY}`); })()) : slugsAll;
  if (PROBE && !slugsAll.includes(PROBE)) throw new Error(`unknown tool ${PROBE}`);

  const srv = await serve(root);
  const srvPort = srv.address().port;
  const base = `http://127.0.0.1:${srvPort}/finance-astro`;

  browser.cdpPort = await freeCdpPort();
  browser.profile = join(tmpdir(), `calc-regress-${process.pid}`);
  browser.chrome = process.env.CHROME_BIN
    || "/home/opc/.cache/ms-playwright/chromium-1243/chrome-linux/chrome";
  if (!existsSync(browser.chrome)) throw new Error(`chrome not found at ${browser.chrome} (set CHROME_BIN)`);
  if (browser.cdpPort === 9222 || browser.cdpPort === 9333) throw new Error("refusing shared CDP port");

  const results = { root, startedAt: new Date().toISOString(), tools: {} };
  let exitCode = 0;
  try {
    await launchBrowser();

    if (PROBE) {
      const url = `${base}/money-tools/${PROBE}/`;
      await navigate(url);
      await ev(`(async () => { try { localStorage.clear(); } catch (e) {} })()`);
      await cdp.session.send("Page.reload", { ignoreCache: true }, 90000);
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("reload timeout")), 90000);
        cdp.loadResolve = () => { clearTimeout(t); resolve(); };
      });
      await waitFor(`!!document.querySelector(".receipt")`, 30000, "receipt");
      const settled = await waitStable(JS_SETTLE_KEY, 1500, 45000, "probe settle");
      console.log(JSON.stringify({
        seeded: { ctrls: await ev(JS_CONTROLS), figs: settled },
        fields: fields[PROBE],
      }, null, 1));
      for (const c of (await ev(JS_CONTROLS)).filter((c) => c.kind === "text"))
        await ev(setCtlExpr(c, ""));
      const empty = await waitStable(JS_SETTLE_KEY, 800, 20000, "probe empty");
      console.log(JSON.stringify({ emptied: empty }, null, 1));
      for (const c of (await ev(JS_CONTROLS)).filter((c) => c.kind === "text"))
        await ev(setCtlExpr(c, "0"));
      const zeroed = await waitStable(JS_SETTLE_KEY, 800, 20000, "probe zero");
      console.log(JSON.stringify({ zeroed }, null, 1));
      return;
    }

    for (const slug of slugs) {
      process.stdout.write(`… ${slug} `);
      let R = null, err = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          R = await runTool(slug, base, fields);
          err = null;
          break;
        } catch (e) {
          err = e;
          process.stdout.write(`(tab stuck: ${e.message.slice(0, 60)} — relaunching…) `);
          try { await relaunchBrowser(); }
          catch (re) { err = new Error(`${e.message} + relaunch failed: ${re.message}`); break; }
        }
      }
      if (R) {
        results.tools[slug] = R;
        const n = (s) => Object.values(R).filter((r) => r.status === s).length;
        console.log(`${n("pass")} pass / ${n("fail")} fail / ${n("skip")} skip` +
          (n("fail") ? `  ← ${Object.entries(R).filter(([, r]) => r.status === "fail").map(([k]) => k).join(",")}` : ""));
      } else {
        results.tools[slug] = { _tool: rec("fail", `harness: ${err.message}`) };
        console.log(`HARNESS ERROR: ${err.message}`);
      }
    }
  } finally {
    try { if (cdp.session) cdp.session.close(); } catch {}
    cdp.session = null;
    await killBrowser();
    await new Promise((r) => srv.close(r));
    rmSync(browser.profile, { recursive: true, force: true });
  }

  /* table + result file; non-zero exit on any failure. */
  const ORDER = ["reset", "clear", "empty", "zero", "derived", "adversarial", "stale", "rails", "console"];
  let tp = 0, tf = 0, ts = 0;
  console.log("\n" + ["tool", ...ORDER].join(" | "));
  for (const slug of slugs) {
    const R = results.tools[slug];
    const row = ORDER.map((k) => {
      const r = R[k];
      if (!r) return "?";
      if (r.status === "pass") tp++;
      if (r.status === "fail") tf++;
      if (r.status === "skip") ts++;
      return r.status === "pass" ? "✓" : r.status === "fail" ? "FAIL" : "-";
    });
    console.log([slug, ...row].join(" | "));
  }
  for (const slug of slugs) {
    for (const [k, r] of Object.entries(results.tools[slug])) {
      if (r.status === "fail") console.log(`FAIL ${slug}/${k}: ${r.detail}`);
      if (r.status === "skip") console.log(`skip ${slug}/${k}: ${r.detail}`);
    }
  }
  results.summary = { pass: tp, fail: tf, skip: ts, ms: Date.now() - t0 };
  console.log(`\ncalc-regress: ${tp} pass / ${tf} fail / ${ts} skip in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  const out = process.env.CALC_REGRESS_OUT || "/tmp/calc-regress-results.json";
  const { writeFileSync } = await import("node:fs");
  writeFileSync(out, JSON.stringify(results, null, 1));
  console.log(`results: ${out}`);
  if (tf > 0) { console.log("calc-regress: FAIL"); exitCode = 1; }
  else console.log("calc-regress: PASS");
  process.exit(exitCode);
}

/* top-level guard so an early throw still reports instead of hanging. */
main().catch((e) => { console.error(`calc-regress: FATAL ${e.message}`); process.exit(2); });
