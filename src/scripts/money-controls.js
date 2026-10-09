/* ══════════════════════════════════════════════════════════════════════════
   MONEY-CONTROLS.JS — DESIGN-LANGUAGE.md §6 F1–F3 behaviors (rung R2)
   ══════════════════════════════════════════════════════════════════════════
   ES module, one tiny dependency (the site's own currency table), wired
   sitewide from Layout.astro exactly like spotlight-search.js / ticker-live.js
   (bundler <script> import). It is inert everywhere except fields that DECLARE
   a currency — see CURRENCY below — so it stays off the other 90 pages.

   ── CURRENCY: THE FIELD DECLARES, THE SCRIPT RENDERS ───────────────────────
   The gate used to be `label.textContent.indexOf('₦') !== -1` — a substring
   test on PROSE, and it was wrong in both directions at once. On the converter
   it passed "Amount (₦ $ £ € and 12 more)", where ₦ is item one of fifteen,
   and printed a naira sign beside a dollar figure the visitor had just typed;
   tomorrow "Rent (₦ or $)" would pass it too. A currency symbol is a CLAIM
   about the unit, so the claim is now made explicitly, by the field, and is
   never inferred from how a label happens to be worded:

       <div class="field" data-cur="NGN">   the unit is fixed — 36 fields,
                                            every one of them genuinely naira
       <div class="field" data-cur="USD">   the PAGE re-declares data-cur
                                            whenever the visitor's choice
                                            changes (converter From, comparator
                                            Direction)

   Whoever changes the currency changes data-cur; this script renders it — at
   boot, and again on every change/input, delegated on `document` so it lands
   AFTER the page's own render() (target phase first, document bubble second:
   the same ordering tool-fields.ts relies on for its emptiness judge). Symbols
   come from the site's own table (fxCurrencies(), lib/fx.ts — the SAME object
   the converter's <select> is built from), so there is no second symbol map
   here to drift, and a code the table does not know prints ITSELF rather than
   a wrong glyph.

   THE GLYPH IS INJECTED ONCE AND REUSED: sync() looks the existing .fi-sym up
   before it makes one. The smart-fields spine re-renders around these fields
   (Reset, Clear examples, restored values) and a second injection would double
   the currency sign — the same "not lost, not duplicated" law, enforced by
   lookup rather than by trusting the machinery upstream.

   Contracts honored:
   - NEVER touches element IDs (U4), never preventDefault, listeners passive
     by default (we never call preventDefault, so default is correct).
   - Page calculators recompute on "input" via pm(), which strips commas by
     design (R2 spec step 2) — so the comma-grouped blur value keeps every
     tool live-accurate.
   - inputmode="numeric" fields (Years, Months, Tenor, Cover) are skipped:
     they never get commas, never get the glyph.
   - A field that declares no data-cur is left completely alone: no glyph, no
     commas. There is no default currency here and no fallback guess — that
     guess is the bug this file used to be.
   - Comma-grouping touches ONLY the integer part; the fractional tail is
     preserved byte-for-byte as typed ("1500." keeps its bare dot,
     "1500.2500" keeps its trailing zeros). Values that are not plain
     digit strings (empty, in-progress, "1e5") are left untouched —
     reformatting partial input would fight the person typing.
   ══════════════════════════════════════════════════════════════════════════ */
import { fxCurrencies } from "../lib/fx";

(function () {
  'use strict';

  /* The site's own currency table — the single source the converter's
     <select>, the receipt figures and this glyph all read, so a sign can never
     disagree with the dropdown that chose it. */
  var CUR = fxCurrencies();

  function cur(code) {
    var k = String(code == null ? '' : code).trim().toUpperCase();
    var hit = CUR[k];
    return { code: k, symbol: hit ? hit.symbol : k, name: hit ? hit.name : k };
  }

  /* The label's OWN prose — text nodes only. smart-fields appends its SAMPLE /
     LAST USED badge INSIDE the label (mark(), smart-fields.js) and
     [data-cur-unit] is ours; both are elements, so both are skipped here and
     no badge shape can contaminate a spoken label. Same rule tool-fields.ts
     labelOf() uses, for the same reason. */
  function ownText(node) {
    var t = '';
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.nodeType === 3) t += n.nodeValue || '';
    }
    return t.replace(/\s+/g, ' ').trim();
  }

  function glyph(field, input) {
    var sym = field.querySelector('.fi-sym');
    if (sym) return sym;                       // reused, never doubled
    /* F3 — symbol inside the field. The wrap span.fi carries the positioning
       context; the input keeps its ID. aria-hidden is honest here because the
       LABEL names the unit in words and is kept in step with it below. */
    var wrap = document.createElement('span');
    wrap.className = 'fi';
    sym = document.createElement('span');
    sym.className = 'fi-sym';
    sym.setAttribute('aria-hidden', 'true');
    wrap.appendChild(sym);
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    return sym;
  }

  /* F3's other half, for the two fields whose unit FOLLOWS a select. Their
     label can no longer name a fixed unit, so it carries an empty
     [data-cur-unit] span this script keeps filled, and the field gets a polite
     status that announces a switch to a visitor already sitting in it. Both
     are created once, and only where the unit can change: the fixed-₦ fields
     have no switch to announce and never pay for one. */
  function status(field) {
    var live = field.querySelector('[data-cur-live]');
    if (live) return live;
    if (!field.querySelector('[data-cur-unit]')) return null;
    live = document.createElement('span');
    live.className = 'sr-only';                 // the site's own utility (Layout.astro)
    live.setAttribute('data-cur-live', '');
    live.setAttribute('aria-live', 'polite');
    field.appendChild(live);
    return live;
  }

  function sync(field, label, input) {
    var code = field.getAttribute('data-cur');
    if (!code) return;
    var c = cur(code);
    var sym = glyph(field, input);
    if (sym.textContent !== c.symbol) {
      sym.textContent = c.symbol;
      /* A currency is not always one character wide — CA$, GH₵, CFA, FCFA,
         KSh, E£, د.إ — so the digits' left padding is measured from the glyph
         the site actually rendered and published as --fi-pad (controls.css
         reads it with a 28px fallback). Only a MULTI-character symbol
         overrides: a one-character symbol leaves the variable unset and keeps
         exactly the padding every fixed-₦ field has always had. */
      if (c.symbol.length > 1) {
        sym.parentNode.style.setProperty('--fi-pad', (20 + Math.ceil(sym.offsetWidth || 0)) + 'px');
      } else {
        sym.parentNode.style.removeProperty('--fi-pad');
      }
    }
    var unit = field.querySelector('[data-cur-unit]');
    if (!unit) return;
    var words = 'in ' + c.name + (c.symbol && c.symbol !== c.code ? ' (' + c.symbol + ')' : '');
    if (unit.textContent !== words) unit.textContent = words;
    /* Announce a real SWITCH, never the first paint: the label already names
       the unit on load, and a live region that fires on every page view is
       noise. data-cur-said is the memory of what has been said — ABSENT means
       nothing has been announced yet (first paint, silent), and every later
       change of code is a switch worth speaking. */
    var live = status(field);
    var said = live ? live.getAttribute('data-cur-said') : c.code;
    if (live && said !== c.code) {
      live.setAttribute('data-cur-said', c.code);
      if (said !== null) live.textContent = ownText(label) + ' is now ' + words + '.';
    }
  }

  function syncAll() {
    var fields = document.querySelectorAll('.field');
    Array.prototype.forEach.call(fields, function (field) {
      if (!field.getAttribute('data-cur')) return;
      var label = field.querySelector('label');
      var input = field.querySelector('input');
      if (!label || !input) return;
      if (input.getAttribute('inputmode') !== 'decimal') return;
      sync(field, label, input);
    });
  }

  function boot() {
    var fields = document.querySelectorAll('.field');
    /* forEach, never a `for` + `var`: the blur/focus closures below capture
       `input`, and a function-scoped loop variable would hand every field the
       LAST field's element. */
    Array.prototype.forEach.call(fields, function (field) {
      var label = field.querySelector('label');
      var input = field.querySelector('input');
      if (!label || !input) return;
      if (input.getAttribute('inputmode') !== 'decimal') return; /* Years/Months/Tenor: never commas */
      if (!field.getAttribute('data-cur')) return;               /* no declared unit: untouched, no guess */

      sync(field, label, input);

      /* F2 — blur: group ONLY the integer part, dip to signal the reformat.
         The regex whitelists plain digit strings with an optional fractional
         tail, so already-grouped values (second blur), empty fields and
         partially-typed input pass through untouched. */
      input.addEventListener('blur', function () {
        var m = input.value.match(/^(\s*)(\d+)(\.\d*)?(\s*)$/);
        if (!m) return;
        var grouped = m[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        input.value = m[1] + grouped + (m[3] || '') + m[4];
        input.classList.add('fx-dip');
        requestAnimationFrame(function () {
          setTimeout(function () { input.classList.remove('fx-dip'); }, 200);
        });
      });

      /* focus — strip commas back to raw digits for painless editing
         (pm() tolerates commas anyway; this keeps caret math sane). */
      input.addEventListener('focus', function () {
        if (input.value.indexOf(',') !== -1) input.value = input.value.replace(/,/g, '');
      });
    });

    /* A unit that FOLLOWS a select can change long after boot. Delegated on
       `document` so this runs AFTER the page's own render() has re-declared
       data-cur — the page listens on the control itself (target phase), this
       listens on the bubble. */
    document.addEventListener('change', syncAll);
    document.addEventListener('input', syncAll);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
