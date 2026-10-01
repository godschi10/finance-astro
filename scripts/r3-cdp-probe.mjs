// R3 one-shot CDP probe (commission step 4): rates-ladder behavior + overflow
// + 5 theme screenshots. Requires chrome :9222 and the :8080 dist preview.
import { WebSocket } from "ws";

const BASE = "http://localhost:8080/finance-astro";
const SHOTS = "/home/opc/work/research-notes";
const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const tab = list.find((t) => t.type === "page");
const ws = new WebSocket(tab.webSocketDebuggerUrl, { origin: "http://127.0.0.1:9222" });
let id = 0; const pending = new Map();
const send = (method, params = {}) =>
  new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) return "EXC: " + JSON.stringify(r.result.exceptionDetails).slice(0, 200);
  return r.result?.result?.value;
};
ws.on("message", (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
await new Promise((r) => (ws.on("open", r)));
await send("Page.enable");

async function goto(url, waitSel) {
  await send("Page.navigate", { url });
  for (let t = 0; t < 40; t++) {
    if (await ev(`document.readyState === 'complete' && !!document.querySelector(${JSON.stringify(waitSel)})`)) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  await new Promise((r) => setTimeout(r, 1100)); // module scripts' first render + live fetch window
}
const setViewport = (w, h, mobile) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile });
const setTheme = async (mode) => {
  await ev(`localStorage.setItem('gwill-finance-theme-v3','${mode}')`);
  await send("Page.reload");
  for (let t = 0; t < 40; t++) {
    if (await ev(`document.readyState === 'complete' && !!document.querySelector(${JSON.stringify("#main")})`)) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  await new Promise((r) => setTimeout(r, 1100));
};
import { writeFileSync } from "fs";
// R2-proven capture: base64 data (a bare "path" param is silently ignored by
// this Chrome build — found by the empty research-notes dir on the first run).
const shot = async (p) => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(p, Buffer.from(r.result.data, "base64")); };

const out = {};

/* ── (a) converter @390 light: ladder visible, row1 == #cc-unit rate, 8 rows,
        GBP switch rebuild, swap flips direction ── */
await setViewport(390, 844, true);
await setTheme("light");
await goto(`${BASE}/money-tools/currency-converter/`, "#cc-ladder");

out.a_ladderVisible = await ev(`(function(){var l=document.getElementById('cc-ladder');return !!l && !l.hidden && l.offsetParent !== null})()`);
out.a_row1 = await ev(`document.querySelector('#cc-ladder tbody tr').innerText.replace(/\\s+/g,' ').trim()`);
out.a_unit = await ev(`document.getElementById('cc-unit').textContent.trim()`);
out.a_unitRateNum = await ev(`document.getElementById('cc-unit').textContent.trim().replace(/^1 [A-Z]{3} = /,'')`);
out.a_row1RateNum = await ev(`document.querySelector('#cc-ladder tbody tr .st-amt').textContent.trim().replace(/^= /,'')`);
out.a_ratesEqual = await ev(`(function(){var u=document.getElementById('cc-unit').textContent.trim().replace(/^1 [A-Z]{3} = /,'').split(' ')[0];var r=document.querySelector('#cc-ladder tbody tr .st-amt').textContent.trim().replace(/^= /,'').split(' ').pop();return u===r})()`);
out.a_fwdRows = await ev(`document.querySelectorAll('#cc-ladder table:first-child tbody tr').length`);
out.a_revRows = await ev(`document.querySelectorAll('#cc-ladder table:last-of-type tbody tr').length`);
out.a_stamp = await ev(`document.querySelector('#cc-ladder .receipt-foot').textContent.trim()`);

// switch FROM to GBP → ladder rebuilds with "1 GBP ="
await ev(`(function(){var f=document.getElementById('cc-from');f.value='GBP';f.dispatchEvent(new Event('change',{bubbles:true}));})()`);
await new Promise((r) => setTimeout(r, 400));
out.a_row1_afterGBP = await ev(`document.querySelector('#cc-ladder tbody tr').innerText.replace(/\\s+/g,' ').trim()`);
out.a_row1_afterGBP_ok = String(out.a_row1_afterGBP).startsWith("1 GBP =");

// swap → direction flips
out.a_head_before_swap = await ev(`document.querySelector('#cc-ladder thead th').textContent.trim()`);
await ev(`document.getElementById('cc-swap').click()`);
await new Promise((r) => setTimeout(r, 400));
out.a_head_after_swap = await ev(`document.querySelector('#cc-ladder thead th').textContent.trim()`);
out.a_row1_after_swap = await ev(`document.querySelector('#cc-ladder tbody tr').innerText.replace(/\\s+/g,' ').trim()`);
out.a_swap_flipped = out.a_head_before_swap === "GBP → NGN" && out.a_head_after_swap === "NGN → GBP";

// (c) horizontal overflow at phone width, ladder open
out.c_scrollWidth_390 = await ev(`document.documentElement.scrollWidth`);
out.c_overflow_ok = out.c_scrollWidth_390 === 390;

/* ── (b) amount page /money-tools/500-dollars-to-naira/ @390 + @1280:
        rows present; spot-check TWO rows against amountFmt(q*unit_rate)
        computed in-page from #am-unit's printed 4dp rate ── */
const spotCheck = async () => ev(`(function(){
  var unitTxt = document.getElementById('am-unit').textContent;      // "1 USD = ₦1,328.6457 · ..."
  var rate = parseFloat(unitTxt.replace(/^1 [A-Z]{3} = [^0-9]*/, '').replace(/,/g, '')); // strip grouping commas: parseFloat stops at them
  var rows = document.querySelectorAll('.fx-ladder table:first-child tbody tr');
  if (!rows.length) return { err: 'no ladder rows' };
  var r1 = rows[0], r5 = rows[4];
  function cell(tr){ return tr.querySelector('.st-amt').textContent.trim(); }
  var sym = unitTxt.match(/^1 [A-Z]{3} = (.)/)[1];
  function fmt(n){ var s = n < 100 ? 2 : 0; var v = n.toFixed(s); var p = v.split('.'); p[0] = p[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g, ','); return sym + p.join('.'); }
  var q1 = parseFloat(r1.querySelector('td').textContent.replace(/[^0-9.]/g, ''));
  var q5 = parseFloat(r5.querySelector('td').textContent.replace(/[^0-9.]/g, ''));
  return {
    rate_used: rate,
    row1_printed: cell(r1), row1_expected: fmt(q1 * rate),
    row5_printed: cell(r5), row5_expected: fmt(q5 * rate),
    row1_match: cell(r1) === '= ' + fmt(q1 * rate),
    row5_match: cell(r5) === '= ' + fmt(q5 * rate),
    total_rows: document.querySelectorAll('.fx-ladder tbody tr').length
  };
})()`);

await goto(`${BASE}/money-tools/500-dollars-to-naira/`, ".fx-ladder");
out.b_phone_ladder_present = await ev(`!!document.querySelector('.fx-ladder')`);
out.b_phone_spots = await spotCheck();
out.b_phone_stamp = await ev(`document.querySelector('.fx-ladder .fx-result-note').textContent.trim()`);
out.b_phone_row1 = await ev(`document.querySelector('.fx-ladder tbody tr').innerText.replace(/\\s+/g,' ').trim()`);
out.b_phone_scrollWidth = await ev(`document.documentElement.scrollWidth`);

await shot(`${SHOTS}/r3-am-light-phone.png`);

await setTheme("dark");
out.b_phone_dark_ok = await ev(`document.documentElement.getAttribute('data-theme') === 'dark' && !!document.querySelector('.fx-ladder')`);

await setViewport(1280, 900, false);
await new Promise((r) => setTimeout(r, 500));
await shot(`${SHOTS}/r3-am-dark-desk.png`);
out.b_desk_spots = await spotCheck();

/* ── screenshots: each shot sets viewport + theme EXPLICITLY (a stored
   'dark' choice from an earlier step must never leak into a 'light' shot —
   media emulation alone is defeated by the stored choice, and so is trust in
   whatever the last step left behind). ── */
const shotAt = async (file, url, w, h, mobile, theme) => {
  await setViewport(w, h, mobile);
  await goto(url, mobile ? "#cc-ladder, .fx-ladder" : "#main");
  await setTheme(theme);
  await shot(file);
};
await shotAt(`${SHOTS}/r3-cc-light-phone.png`, `${BASE}/money-tools/currency-converter/`, 390, 844, true, "light");
out.cc_dark_ok = await ev(`document.documentElement.getAttribute('data-theme')`);
await shotAt(`${SHOTS}/r3-cc-dark-phone.png`, `${BASE}/money-tools/currency-converter/`, 390, 844, true, "dark");
out.cc_dark_ok2 = await ev(`document.documentElement.getAttribute('data-theme')`);
await shotAt(`${SHOTS}/r3-cc-light-desk.png`, `${BASE}/money-tools/currency-converter/`, 1280, 900, false, "light");
await ev(`localStorage.removeItem('gwill-finance-theme-v3')`);

console.log(JSON.stringify(out, null, 2));
await ws.close();
process.exit(0);
