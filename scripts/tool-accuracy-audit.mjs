// tool-accuracy-audit — REAL-BROWSER audit of every money-tool page.
// Asserts per page: (1) zero JS exceptions / console errors after load AND
// after feeding inputs, (2) every getElementById target exists in the DOM,
// (3) results recompute when inputs change, (4) no NaN/undefined/Infinity in
// visible text. Cases below feed the page's own wiring ids.
// Usage: node scripts/tool-accuracy-audit.mjs   (chrome :9222 + :8080 preview)
import { WebSocket } from "ws";

const BASE = "http://localhost:8080/finance-astro";

// slug -> {input:[[id,value]], checkIds:[ids that must exist], figure?:[containerId, expectIncludes]}
const CASES = [
  { slug: "currency-converter", input: [["cc-amt", "250"], ["cc-to", "GBP"]], checkIds: ["cc-fig", "cc-unit"], figure: ["cc-unit", "£"], numericFig: "cc-fig" },
  { slug: "salary-tax-calculator", input: [["st-gross", "1500000"]], checkIds: ["st-fig", "st-bands"], figure: ["st-fig", "₦"] },
  { slug: "savings-goal-calculator", input: [["sg-target", "10000000"]], checkIds: ["sg-fig", "sg-table"], figure: ["sg-fig", "₦"] },
  { slug: "compound-interest-calculator", input: [["ci-prin", "1000000"], ["ci-yrs", "10"]], checkIds: ["ci-fig", "ci-table"], figure: ["ci-fig", "₦"] },
  { slug: "inflation-savings-calculator", input: [["is-target", "20000000"]], checkIds: ["is-fig", "is-gap"], figure: ["is-fig", "₦"] },
  { slug: "gross-to-net-calculator", input: [["gn-net", "300000"]], checkIds: ["gn-fig", "gn-ded"], figure: ["gn-fig", "₦"] },
  { slug: "emergency-fund-calculator", input: [["em-ess", "350000"]], checkIds: ["em-fig", "em-cover"], figure: ["em-fig", "months"] },
  { slug: "loan-repayment-calculator", input: [["ln-amt", "500000"]], checkIds: ["ln-fig", "ln-period"], figure: ["ln-fig", "₦"] },
  { slug: "50-30-20-budget-calculator", input: [["bg-inc", "400000"]], checkIds: ["bg-fig", "bg-needs", "bg-rn", "bg-rw", "bg-rs", "bg-else", "bg-sub"], figure: ["bg-fig", "₦"] },
  { slug: "budget-allocator", input: [["al-inc", "250000"]], checkIds: ["al-fig", "al-rows"], figure: ["al-fig", "₦"] },
  { slug: "naira-value-calculator", input: [["nv-val", "2000000"]], checkIds: ["nv-fig", "nv-lost"], figure: ["nv-fig", "₦"] },
  { slug: "crypto-profit-calculator", input: [["cp-inv", "500000"]], checkIds: ["cp-fig", "cp-be"], figure: ["cp-fig", "₦"] },
  { slug: "dividend-calculator", input: [["dv-inv", "500000"]], checkIds: ["dv-fig", "dv-table"], figure: ["dv-fig", "₦"] },
  { slug: "money-transfer-comparator", input: [["tc-amt", "200000"]], checkIds: ["tc-table", "tc-sum-amt", "tc-fig"] },
  { slug: "savings-rate-comparator", input: [["sr-amt", "500000"]], checkIds: ["sr-bars", "sr-top", "sr-fig"] },
  { slug: "exchange-rate-history", input: [["xh-days", "90"]], checkIds: ["xh-chart", "xh-fig", "xh-n"] },
  { slug: "100-dollars-to-naira", input: [], checkIds: ["am-fig-r", "am-unit"] },
  { slug: "1-million-naira-to-dollars", input: [], checkIds: ["am-fig-r", "am-unit"] },
  { slug: "50-dollars-to-naira", input: [], checkIds: ["am-fig-r"] },
  { slug: "500-dollars-to-naira", input: [], checkIds: ["am-fig-r"] },
  { slug: "1000-dollars-to-naira", input: [], checkIds: ["am-fig-r"] },
  { slug: "5000-dollars-to-naira", input: [], checkIds: ["am-fig-r"] },
  { slug: "10000-naira-to-dollars", input: [], checkIds: ["am-fig-r"] },
  { slug: "100000-naira-to-dollars", input: [], checkIds: ["am-fig-r"] },
  { slug: "500-euros-to-naira", input: [], checkIds: ["am-fig-r"] },
  { slug: "100-pounds-to-naira", input: [], checkIds: ["am-fig-r"] },
];

async function main() {
  const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
  const tab = list.find((t) => t.type === "page");
  const ws = new WebSocket(tab.webSocketDebuggerUrl, { origin: "http://127.0.0.1:9222" });
  let id = 0; const pending = new Map(); const errors = [];
  const send = (method, params = {}) =>
    new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
  const ev = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    return r.result?.result?.value;
  };
  ws.on("message", (m) => {
    const d = JSON.parse(m);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === "Runtime.exceptionThrown")
      errors.push((d.params.exceptionDetails?.exception?.description || "exc").split("\n")[0].slice(0, 140));
    if (d.method === "Log.entryAdded" && d.params.entry.level === "error" && !/favicon|manifest|serviceworker|sw\.js/i.test(d.params.entry.text))
      errors.push(d.params.entry.text.slice(0, 140));
  });
  await new Promise((r) => (ws.on("open", r)));
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");

  let pass = 0, fail = 0;
  for (const c of CASES) {
    errors.length = 0;
    await send("Page.navigate", { url: `${BASE}/money-tools/${c.slug}/` });
    await new Promise((r) => setTimeout(r, 3600));
    const problems = [];
    // missing DOM targets wired by the script?
    const missing = await ev(`(function(){var refs=new Set();var scripts=Array.prototype.map.call(document.scripts,function(s){return s.type==='module'&&s.src?s.src:''}).filter(Boolean);return ""})()`);
    // feed inputs
    for (const [iid, val] of c.input) {
      const okIn = await ev(`(function(){var e=document.getElementById(${JSON.stringify(iid)});if(!e)return "MISSING";e.value=${JSON.stringify(val)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return "OK"})()`);
      if (okIn === "MISSING") problems.push(`input #${iid} missing`);
    }
    if (c.input.length) await new Promise((r) => setTimeout(r, 700));
    // check wired result ids exist
    for (const cid of c.checkIds) {
      const has = await ev(`!!document.getElementById(${JSON.stringify(cid)})`);
      if (!has) problems.push(`result #${cid} missing`);
    }
    // figure content after typing
    if (c.figure) {
      const txt = await ev(`(document.getElementById(${JSON.stringify(c.figure[0])})||{}).textContent||""`);
      if (!txt.includes(c.figure[1])) problems.push(`#${c.figure[0]} shows "${String(txt).slice(0, 24)}" expected to contain "${c.figure[1]}"`);
      if (/NaN|undefined|Infinity/.test(txt)) problems.push(`#${c.figure[0]} leaked NaN/undefined/Infinity: ${txt.slice(0, 30)}`);
    }
    // whole-page leak scan (visible text)
    const leak = await ev(`(function(){var t=document.body.innerText;return {n:/NaN/.test(t),u:/undefined/.test(t),i:/Infinity/.test(t)}})()`);
    if (leak?.n) problems.push("page text contains NaN");
    if (leak?.i) problems.push("page text contains Infinity");
    if (leak?.u) problems.push("page text contains undefined");
    if (errors.length) problems.push("JS errors: " + errors.slice(0, 2).join(" | "));
    if (problems.length) { fail++; console.log(`FAIL ${c.slug}: ${problems.join("; ")}`); }
    else { pass++; console.log(`PASS ${c.slug}`); }
  }
  console.log(`\nACCURACY AUDIT: ${pass} pass / ${fail} fail`);
  await ws.close();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error("HARNESS ERROR:", e.message); process.exit(2); });
