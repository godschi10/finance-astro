/* ══════════════════════════════════════════════════════════════════════════
   ANATOMY.JS — DESIGN-LANGUAGE.md §4 K6 restart affordance (rung R4)
   ══════════════════════════════════════════════════════════════════════════
   Plain IIFE, zero dependencies, wired sitewide from Layout.astro exactly
   like money-controls.js (R2). Inert wherever [data-anat-reset] is absent.

   Contract (U1/U4 — the untouchables):
   - NEVER touches element IDs, never edits a formula. A reset ONLY sets
     .value on the inputs/selects inside its nearest .fx-card and dispatches
     the SAME 'input'/'change' events each tool's live compute already
     listens to. Defaults are the server-rendered markup itself — captured
     at boot, before the person can change anything (Phase-1 K5 audit:
     every server-rendered default is already the honest value).
   - Verdict lines and goal bars are owned by each page's own script (a few
     lines added at the END of their existing render() — no formula lines
     touched); this file deliberately does not duplicate them.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-anat-reset]'), function (btn) {
      // Scope = ToolShell's .con content wrapper: it contains exactly this
      // tool's inputs (some pages keep a field outside the .fx-card — budget
      // allocator's income, rate comparator's amount), while the header
      // search and footer newsletter live outside .con, so they can never be
      // caught. Fallback to document only if the wrapper is somehow absent.
      var scope = btn.closest('.con') || document;
      var controls = scope.querySelectorAll('input, select');
      // Defaults = the server-rendered values at first boot (K5-honest).
      var defaults = Array.prototype.map.call(controls, function (el) {
        return { el: el, value: el.value };
      });
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(defaults, function (d) {
          d.el.value = d.value;
          d.el.dispatchEvent(new Event('input', { bubbles: true }));
          d.el.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
