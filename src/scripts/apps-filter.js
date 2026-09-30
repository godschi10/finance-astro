/* GWill Finance — Finance Apps page category pills (v1.0.163).
 *
 * Ported verbatim from the theme's assets/js/apps-filter.js on 2026-09-30
 * when /apps/ was imported (King order). The apps grid renders ALL cards
 * server-side (max 9 ACF slots) and each card carries data-cat (letters-only
 * slug, e.g. "DollarAccounts"). The pills above the grid carry data-filter
 * (same slug, or "all"). Clicking a pill shows only the matching cards, no
 * AJAX needed, everything is in the DOM. The count line ("All Apps, 3
 * listed") updates to the active filter, and an empty-state message appears
 * if a category has no cards.
 *
 * The strip is NOT wrapped on this page in the live capture (no
 * cp-strip-wrap), so the optional reveal helper call is kept exactly as the
 * source has it — guarded, no-op when absent.
 */

/*
Table of Contents
1. chip clicks re-query apps grid
*/
// ── 1. chip clicks re-query apps grid ──

(function () {
  'use strict';

  var strip = document.querySelector('.apps-tabs .cp-strip');
  var grid = document.getElementById('apps-grid');
  if (! strip || ! grid) return;

  var A_I18N = { allApps: 'All Apps' };

  var pills = Array.prototype.slice.call(strip.querySelectorAll('.cp'));
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.app-card'));
  var countLabel = document.getElementById('apps-count-label');
  var countNum = document.getElementById('apps-count');
  var empty = document.getElementById('apps-empty');

  var setActive = function (active) {
    pills.forEach(function (p) {
      p.classList.toggle('on', p === active);
      p.setAttribute('aria-pressed', p === active ? 'true' : 'false');
    });
    // Keep the newly active pill fully visible, clear of the edge fade
    // + scroll buttons (v1.0.147; main.js exposes the helper).
    if (window.gwillRevealStripActive) {
      window.gwillRevealStripActive(strip);
    }
  };

  var applyFilter = function (filter, pill) {
    var shown = 0;
    cards.forEach(function (card) {
      var cat = card.getAttribute('data-cat') || '';
      var match = filter === 'all' || cat === filter;
      card.hidden = ! match;
      if (match) shown++;
    });
    if (countLabel) {
      countLabel.textContent = pill ? pill.textContent.replace(/^\S+\s/, '').trim() : (A_I18N.allApps || 'All Apps');
      if ('all' === filter) countLabel.textContent = A_I18N.allApps || 'All Apps';
    }
    if (countNum) countNum.textContent = shown;
    if (empty) empty.hidden = shown > 0;
    setActive(pill);
  };

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      if (pill.classList.contains('on')) return; // already showing this
      applyFilter(pill.getAttribute('data-filter') || 'all', pill);
    });
  });
})();
