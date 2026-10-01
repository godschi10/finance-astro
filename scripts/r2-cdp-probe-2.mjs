// R2 CDP probe part 2: full ₦ lifecycle on salary-tax-calculator #st-gross
// (label "Monthly gross ₦") at 390px — blur grouping, dip, symbol geometry,
// focus strip, live recompute.
import { WebSocket } from "ws";

const URL = "http://localhost:8080/finance-astro/money-tools/salary-tax-calculator/";
const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const tab = list.find((t) => t.type === "page");
const ws = new WebSocket(tab.webSocketDebuggerUrl, { origin: "http://127.0.0.1:9222" });
let id = 0; const pending = new Map();
const send = (method, params = {}) =>
  new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
};
ws.on("message", (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
await new Promise((r) => (ws.on("open", r)));

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Page.navigate", { url: URL });
for (let t = 0; t < 40; t++) {
  if (await ev(`document.readyState === 'complete' && !!document.getElementById('st-gross')`)) break;
  await new Promise((r) => setTimeout(r, 250));
}
await new Promise((r) => setTimeout(r, 1000));

const out = {};
out.viewport = await ev(`window.innerWidth + 'x' + window.innerHeight`);
out.labelText = await ev(`document.querySelector('label[for="st-gross"]').textContent`);
out.fiWrapped = await ev(`!!document.getElementById('st-gross').closest('.fi')`);
out.symbolText = await ev(`(document.querySelector('.fi .fi-sym')||{}).textContent || null`);

// numeric field on the SAME page must stay untouched (Years-type inputs / non-₦)
out.numericPenWrapped = await ev(`!!document.getElementById('st-pension').closest('.fi')`);
out.selectWrapped = await ev(`var s=document.querySelector('select'); s ? !!s.closest('.fi') : 'no select'`);

// TYPE 1500 (simulate per commission)
await ev(`(function(){
  var el = document.getElementById('st-gross');
  el.focus(); el.value = '';
  ['1','5','0','0'].forEach(function(ch){
    el.value += ch;
    el.dispatchEvent(new InputEvent('input',{bubbles:true}));
  });
})()`);
out.afterTyping_value = await ev(`document.getElementById('st-gross').value`);
out.afterTyping_fig = await ev(`document.getElementById('st-fig').textContent`);

// BLUR → grouping + dip class
await ev(`document.getElementById('st-gross').blur()`);
out.afterBlur_value = await ev(`document.getElementById('st-gross').value`);
out.dipClassImmediatelyAfterBlur = await ev(`document.getElementById('st-gross').className`);
out.symbolRect = await ev(`(function(){
  var s = document.querySelector('.fi .fi-sym');
  var r = s.getBoundingClientRect(), cs = getComputedStyle(s);
  return { x:+r.x.toFixed(1), y:+r.y.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1),
           color: cs.color, fontWeight: cs.fontWeight, pointerEvents: cs.pointerEvents };
})()`);
out.inputPaddingLeft = await ev(`getComputedStyle(document.getElementById('st-gross')).paddingLeft`);
await new Promise((r) => setTimeout(r, 450));
out.dipClassAfter400ms = await ev(`document.getElementById('st-gross').className`);

// FOCUS → commas stripped
await ev(`document.getElementById('st-gross').focus()`);
out.afterFocus_value = await ev(`document.getElementById('st-gross').value`);

// typing still recomputes
await ev(`(function(){
  var el = document.getElementById('st-gross');
  el.value = '2500000';
  el.dispatchEvent(new InputEvent('input',{bubbles:true}));
})()`);
out.after2500000_fig = await ev(`document.getElementById('st-fig').textContent`);

// blur with fractional tail preserved byte-for-byte
await ev(`(function(){
  var el = document.getElementById('st-gross');
  el.focus(); el.value = '1500.2500';
  el.dispatchEvent(new InputEvent('input',{bubbles:true}));
  el.blur();
})()`);
out.fractionalTail_blurValue = await ev(`document.getElementById('st-gross').value`);

console.log(JSON.stringify(out, null, 2));
await ws.close();
