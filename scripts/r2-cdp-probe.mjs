// R2 one-shot CDP probe (spec step 5, manual behavior proof).
// /money-tools/currency-converter/ at 390px: #cc-amt type/blur/focus lifecycle
// + ₦ symbol-in-field geometry/computed style + live recompute while typing.
import { WebSocket } from "ws";

const URL = "http://localhost:8080/finance-astro/money-tools/currency-converter/";
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
  if (await ev(`document.readyState === 'complete' && !!document.getElementById('cc-amt')`)) break;
  await new Promise((r) => setTimeout(r, 250));
}
await new Promise((r) => setTimeout(r, 1000));

const out = {};
out.viewport = await ev(`window.innerWidth + 'x' + window.innerHeight`);
out.inputType = await ev(`document.getElementById('cc-amt').type`);
out.inputmode = await ev(`document.getElementById('cc-amt').getAttribute('inputmode')`);

// 1) TYPE 1500 via keyboard events (real typing → page 'input' listener fires)
await ev(`(function(){
  var el = document.getElementById('cc-amt');
  el.focus();
  el.value = '';
  ['1','5','0','0'].forEach(function(ch){
    el.value += ch;
    el.dispatchEvent(new KeyboardEvent('keydown',{key:ch,bubbles:true}));
    el.dispatchEvent(new InputEvent('input',{bubbles:true,data:ch}));
    el.dispatchEvent(new KeyboardEvent('keyup',{key:ch,bubbles:true}));
  });
})()`);
out.afterTyping_value = await ev(`document.getElementById('cc-amt').value`);
out.afterTyping_liveFig = await ev(`document.getElementById('cc-fig').textContent`);

// 2) BLUR → comma-group + dip
await ev(`document.getElementById('cc-amt').dispatchEvent(new FocusEvent('blur',{bubbles:false}))`);
out.afterBlur_value = await ev(`document.getElementById('cc-amt').value`);
out.dipClassDuring = await ev(`document.getElementById('cc-amt').className`);
await new Promise((r) => setTimeout(r, 500));
out.dipClassAfter400ms = await ev(`document.getElementById('cc-amt').className`);

// 3) ₦ symbol probe: geometry + computed style + value baked into markup
out.fiWrapped = await ev(`!!document.querySelector('#cc-amt').closest('.fi')`);
out.symProbe = await ev(`(function(){
  var s = document.querySelector('.fi .fi-sym');
  if (!s) return null;
  var r = s.getBoundingClientRect(), cs = getComputedStyle(s);
  return { text: s.textContent, ariaHidden: s.getAttribute('aria-hidden'),
           rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
           color: cs.color, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily.split(',')[0],
           pointerEvents: cs.pointerEvents, position: cs.position, left: cs.left, top: cs.top };
})()`);
out.inputPaddingLeft = await ev(`getComputedStyle(document.getElementById('cc-amt')).paddingLeft`);
out.symInsideField = await ev(`(function(){
  var i = document.getElementById('cc-amt').getBoundingClientRect();
  var s = document.querySelector('.fi .fi-sym').getBoundingClientRect();
  return s.left >= i.left && s.right <= i.right && s.top >= i.top && s.bottom <= i.bottom;
})()`);
out.inputMinHeightAt390 = await ev(`getComputedStyle(document.getElementById('cc-amt')).minHeight`);
out.swapbtnMinHeightAt390 = await ev(`getComputedStyle(document.getElementById('cc-swap')).minHeight`);

// 4) FOCUS → commas stripped back to raw digits
await ev(`document.getElementById('cc-amt').focus()`);
out.afterFocus_value = await ev(`document.getElementById('cc-amt').value`);

// 5) typing still recomputes live AFTER the cycle
await ev(`(function(){
  var el = document.getElementById('cc-amt');
  el.value = '2500';
  el.dispatchEvent(new InputEvent('input',{bubbles:true}));
})()`);
out.after2500_fig = await ev(`document.getElementById('cc-fig').textContent`);
out.selectsUntouched = await ev(`var f=document.getElementById('cc-from'),t=document.getElementById('cc-to');
  ({ fromIsSelect: f.tagName === 'SELECT', toIsSelect: t.tagName === 'SELECT',
     fromWrapped: !!f.closest('.fi'), toWrapped: !!t.closest('.fi') })`);

console.log(JSON.stringify(out, null, 2));
await ws.close();
