/**
 * GWill Finance, Spotlight Search (SMART) — static port
 *
 * Ported from gwill-finance-theme assets/js/spotlight-search.js (v1.0.191).
 * The relevance engine (norm/fuzzy/scoring/highlight) lives in
 * scripts/search-core.js — ONE engine shared with the /search/ results page.
 *
 * Static-site transport: the searchable corpus is embedded as
 * <script type="application/json" id="gwill-search-index"> by the layout
 * (title/excerpt/url/date/mins/cat per post), parsed here at runtime — no
 * REST endpoint, no network per keystroke after parse. Same UI/UX contract
 * as the theme: combobox input, .gs-row role=option, arrow-key nav with
 * aria-activedescendant, view-all footer → {base}search/?q=, .gs-state rows,
 * close() keeps the typed text, in-field x is the only text clearer,
 * focus returns with preventScroll (theme v1.0.199 rule).
 *
 * @package GWill_Finance
 */

import { norm, toks, smartMatch, highlight, escHtml } from './search-core.js';

(function () {
  'use strict';

  var INDEX = [];
  try {
    var idxEl = document.getElementById('gwill-search-index');
    if (idxEl) INDEX = JSON.parse(idxEl.textContent || '[]');
  } catch (e) { INDEX = []; }

  // Runtime base, read from the rendered form action (the is:inline
  // template-literal trap: ${} is never interpolated in inline scripts).
  var INDEX_BASE = '';
  try {
    var form = document.querySelector('.gs-form');
    if (form) INDEX_BASE = form.getAttribute('action') || '';
  } catch (e) {}
  if (!INDEX_BASE) INDEX_BASE = '/finance-astro/';

  var toggles = document.querySelectorAll('[data-gwill-search-toggle]');
  var panel = document.getElementById('gwill-search-panel');
  var input = document.getElementById('gwill-search-input');
  var results = document.getElementById('gwill-search-results');
  var clearBtn = document.getElementById('gwill-search-clear');
  var closeBtn = document.getElementById('gwill-search-close');
  if (!toggles.length || !panel || !input) return;

  var timer = null;
  var sel = -1;
  var data = [];
  var lastTrigger = null;
  var DEBOUNCE = 120;  // matching is local — respond almost instantly
  var MIN_CHARS = 2;
  var MAX_RESULTS = 8;

  function row(p, i, qtoks) {
    var mins = p.mins || p.read_time || 1;
    var date = p.date || '';
    var cat = p.cat || '';
    var title = highlight(p.title || '', qtoks);
    var snippet = highlight(p.excerpt || '', qtoks);
    var html = '<a href="' + escHtml(p.url || '#') + '" class="gs-row" id="gwill-gs-' + i + '" role="option" aria-selected="false" data-i="' + i + '">'
      + '<span class="gs-arrow">→</span>'
      + '<span class="gs-main">'
      + '<span class="gs-title">' + title + '</span>';
    if (snippet) html += '<span class="gs-excerpt">' + snippet + '</span>';
    html += '<span class="gs-meta">';
    if (date) html += '<span class="gs-date">' + escHtml(date) + '</span><span class="gs-dot">·</span>';
    html += '<span>' + mins + ' min read</span></span>'
      + '</span>'
      + '<span class="gs-pill">' + escHtml(cat || 'article') + '</span>'
      + '</a>';
    return html;
  }

  function renderResults(q) {
    var qtoks = toks(q);
    var matches = smartMatch(q, INDEX, MAX_RESULTS);
    data = matches.map(function (m) { return m.p; });
    sel = -1;
    if (!data.length) {
      // No dead end: "no matches" + the 3 newest posts (index order = newest
      // first), same fallback the theme ships.
      results.innerHTML = '<div class="gs-state" role="option" aria-disabled="true">No matches for “' + escHtml(q) + '”, try these recent posts:</div>'
        + data.length + '';
      var fb = '';
      var recent = INDEX.slice(0, 3);
      for (var i = 0; i < recent.length; i++) fb += row(recent[i], i, qtoks);
      results.innerHTML = '<div class="gs-state" role="option" aria-disabled="true">No matches for “' + escHtml(q) + '”, try these recent posts:</div>'
        + fb
        + '<a class="gs-viewall" role="option" href="' + escHtml(INDEX_BASE) + 'search/?q=' + encodeURIComponent(q) + '">View all results →</a>';
      results.classList.add('has-results');
      return;
    }
    var html = '';
    for (var j = 0; j < data.length; j++) html += row(data[j], j, qtoks);
    html += '<a class="gs-viewall" role="option" href="' + escHtml(INDEX_BASE) + 'search/?q=' + encodeURIComponent(q) + '">View all results →</a>';
    results.innerHTML = html;
    results.classList.add('has-results');
  }

  function showState(msg) {
    results.innerHTML = '<div class="gs-state" role="option" aria-disabled="true">' + escHtml(msg) + '</div>';
    results.classList.add('has-results');
  }

  function items() {
    return Array.prototype.slice.call(results.querySelectorAll('.gs-row'));
  }

  function highlightActive() {
    var rows = items();
    rows.forEach(function (el, i) {
      el.classList.toggle('cur', i === sel);
      el.setAttribute('aria-selected', i === sel ? 'true' : 'false');
    });
    if (rows[sel]) {
      input.setAttribute('aria-activedescendant', 'gwill-gs-' + sel);
      rows[sel].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function syncClear() {
    if (clearBtn) clearBtn.hidden = !(input && input.value.length > 0);
  }

  function open(trigger) {
    lastTrigger = trigger || null;
    panel.hidden = false;
    toggles.forEach(function (t) { t.setAttribute('aria-expanded', 'true'); });
    input.setAttribute('aria-expanded', 'true');
    syncClear();
    setTimeout(function () { input.focus(); }, 80);
  }

  function close() {
    panel.hidden = true;
    toggles.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    results.innerHTML = '';
    results.classList.remove('has-results');
    data = [];
    sel = -1;
    syncClear();
    if (lastTrigger && lastTrigger.focus) {
      // v1.0.199 (theme): plain .focus() on a sticky-header trigger drags the
      // page up on Android Chrome; preventScroll keeps the WCAG 2.4.3 focus
      // return WITHOUT the scroll.
      lastTrigger.focus({ preventScroll: true });
      lastTrigger = null;
    }
  }

  function clearOnly() {
    input.value = '';
    results.innerHTML = '';
    results.classList.remove('has-results');
    data = [];
    sel = -1;
    input.removeAttribute('aria-activedescendant');
    syncClear();
    input.focus();
  }

  if (clearBtn) clearBtn.addEventListener('click', clearOnly);
  if (closeBtn) closeBtn.addEventListener('click', function () { close(); syncClear(); });

  toggles.forEach(function (t) {
    t.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel.hidden) open(t); else close();
    });
  });

  input.addEventListener('keydown', function (e) {
    if ('Escape' === e.key) { e.preventDefault(); close(); }
    if ('ArrowDown' === e.key) { e.preventDefault(); sel = Math.min(sel + 1, data.length - 1); highlightActive(); }
    if ('ArrowUp' === e.key) { e.preventDefault(); sel = Math.max(sel - 1, 0); highlightActive(); }
    if ('Enter' === e.key) {
      e.preventDefault();
      if (sel >= 0 && data[sel] && data[sel].url) {
        window.location = data[sel].url;
        return;
      }
      // WP contract (spotlight-search.js:537-545): with no highlighted row,
      // Enter submits — WP routes ?s= to its search template. The static
      // build's /?s= is the homepage, so route it to the /search/ page.
      var v2 = input.value.trim();
      if (v2.length) {
        window.location = INDEX_BASE + 'search/?q=' + encodeURIComponent(v2);
      }
    }
  });

  input.addEventListener('input', function () {
    clearTimeout(timer);
    syncClear();
    var v = this.value.trim();
    if (v.length < MIN_CHARS) {
      results.innerHTML = '';
      results.classList.remove('has-results');
      if (v.length) showState('Keep typing, at least 2 characters…');
      return;
    }
    timer = setTimeout(function () { renderResults(v); }, DEBOUNCE);
  });

  syncClear();
})();
