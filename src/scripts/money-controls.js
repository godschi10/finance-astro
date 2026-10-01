/* ══════════════════════════════════════════════════════════════════════════
   MONEY-CONTROLS.JS — DESIGN-LANGUAGE.md §6 F1–F3 behaviors (rung R2)
   ══════════════════════════════════════════════════════════════════════════
   Plain IIFE, zero dependencies, wired sitewide from Layout.astro exactly
   like spotlight-search.js / ticker-live.js (bundler <script> import). It is
   inert everywhere except money-tools pages, because its only trigger is
   `.field` + ₦ label + inputmode="decimal" — a shape only those pages have.

   Contracts honored:
   - NEVER touches element IDs (U4), never preventDefault, listeners passive
     by default (we never call preventDefault, so default is correct).
   - Page calculators recompute on "input" via pm(), which strips commas by
     design (R2 spec step 2) — so the comma-grouped blur value keeps every
     tool live-accurate.
   - inputmode="numeric" fields (Years, Months, Tenor, Cover) are skipped:
     they never get commas, never get the ₦ glyph.
   - Non-₦ fields (converter/comparator "Amount" labels) are skipped whole.
   - Comma-grouping touches ONLY the integer part; the fractional tail is
     preserved byte-for-byte as typed ("1500." keeps its bare dot,
     "1500.2500" keeps its trailing zeros). Values that are not plain
     digit strings (empty, in-progress, "1e5") are left untouched —
     reformatting partial input would fight the person typing.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function boot() {
    var fields = document.querySelectorAll('.field');
    Array.prototype.forEach.call(fields, function (field) {
      var label = field.querySelector('label');
      var input = field.querySelector('input');
      if (!label || !input) return;
      if (input.getAttribute('inputmode') !== 'decimal') return; /* Years/Months/Tenor: never commas */
      if (label.textContent.indexOf('\u20A6') === -1) return;    /* non-\u20A6 fields: untouched */

      /* F3 — symbol inside the field, aria-hidden (decorative duplicate of
         the label's ₦, which assistive tech already reads). The wrap span.fi
         carries the positioning context; the input keeps its ID. */
      var wrap = document.createElement('span');
      wrap.className = 'fi';
      var sym = document.createElement('span');
      sym.className = 'fi-sym';
      sym.setAttribute('aria-hidden', 'true');
      sym.textContent = '\u20A6';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(sym);
      wrap.appendChild(input);

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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
