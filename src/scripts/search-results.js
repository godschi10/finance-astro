/**
 * GWill Finance — /search/ results page controller
 *
 * Drives the rebuilt search page (search.astro): same smart engine as the
 * spotlight (scripts/search-core.js), the theme's card anatomy via the
 * ArticleCard HTML emitted at build time is NOT available to runtime-built
 * rows — so rows are built here with the theme's own class vocabulary
 * (article.ac > .ac-img/.ac-emoji + .ac-body > a.badge + h2.ac-t > a +
 * .ac-ex > p + .ac-ft), matching template-parts/content.php. The badge/art/
 * emoji map comes from the embedded index (badgeClass/art/emoji per item).
 *
 * WP contracts ported: header count line "{n} results for <strong>{q}</strong>",
 * breadcrumb "Search: {q}", URL state ?q=, category pill filter
 * (Everything + 6 categories + Calculators), the .es no-results block.
 *
 * @package GWill_Finance
 */

import { norm, toks, smartMatch, highlight, escHtml } from './search-core.js';

(function () {
  'use strict';

  var idx = { articles: [], tools: [] };
  try {
    var el = document.getElementById('search-index');
    if (el) idx = JSON.parse(el.textContent || '{"articles":[],"tools":[]}');
  } catch (e) {}

  var input = document.getElementById('search-input');
  var form = document.querySelector('.search-form');
  var grid = document.getElementById('search-results-grid');
  var countEl = document.getElementById('result-count');
  var countP = document.getElementById('search-count-p');
  var empty = document.getElementById('search-empty');
  if (!input || !grid || !countEl || !empty) return;

  var pills = Array.prototype.slice.call(document.querySelectorAll('[data-scat]'));
  var cat = '';

  // Runtime base, read from the rendered breadcrumb link (the is:inline
  // template-literal trap never applies to a bundled module — but the base
  // must still be read from the DOM so sub-path deploys stay correct).
  var homeHref = '/';
  try {
    var crumbLink = document.querySelector('.bc a');
    if (crumbLink) homeHref = crumbLink.getAttribute('href') || '/';
  } catch (e) {}

  function href(it) {
    return it.kind === 'tool' ? homeHref + 'tools/' + it.slug + '/' : homeHref + 'articles/' + it.slug + '/';
  }

  var CAT_DEFAULT = { badge: 'bsl', art: '', emoji: '' };

  // theme's card anatomy: template-parts/content.php with card-media.php's
  // emoji branch — class vocabulary + badge/art map verbatim. The badge/art/
  // emoji map is baked into the index at build time (search.astro, the
  // theme's gwill_finance_cat_style map via CATEGORIES).
  function card(it, qtoks) {
    var cm = Object.assign({}, CAT_DEFAULT, it);
    var badgeCls = cm.badge || 'bsl';
    var title = highlight(it.title, qtoks);
    var excerpt = highlight(it.desc || '', qtoks);
    var meta = it.kind === 'tool'
      ? 'Calculator'
      : (cm.categoryName + ' · ' + escHtml(it.date || '') + ' · ' + (it.readMins || 1) + ' min read');
    return '<article class="ac">'
      + '<div class="ac-img ' + cm.art + '"><span class="ac-emoji">' + cm.emoji + '</span></div>'
      + '<div class="ac-body">'
      + '<a class="badge ' + badgeCls + '" href="' + (it.kind === 'tool' ? homeHref + 'tools/' : homeHref + 'category/' + it.category + '/') + '">' + escHtml(cm.categoryName) + '</a>'
      + '<h2 class="ac-t"><a href="' + href(it) + '">' + title + '</a></h2>'
      + (excerpt ? '<div class="ac-ex"><p>' + excerpt + '</p></div>' : '')
      + '<div class="ac-ft"><span class="a-dt">' + meta + '</span><a class="a-rd" href="' + href(it) + '">Read →</a></div>'
      + '</div>'
      + '</article>';
  }

  function run() {
    var q = (input.value || '').trim();
    // smartMatch's category hit reads p.cat (the theme's index field). The
    // page index carries category=slug + categoryName=name — map cat over
    // so category-name matches score (and the pill filter still sees slug).
    var pool = idx.articles.concat(idx.tools).map(function (p) {
      return Object.assign({}, p, { cat: p.cat || p.categoryName || '' });
    });
    var matches = smartMatch(q, pool, 50);
    // Category pill filter applies AFTER scoring (the theme filters the pool
    // by cat; scoring orders within it).
    if (cat) matches = matches.filter(function (m) { return m.p.category === cat; });
    var qtoks = toks(q);

    if (!q) {
      // Empty query: show everything (the theme's "Showing all N entries").
      var allHtml = '';
      for (var i = 0; i < matches.length; i++) allHtml += card(matches[i].p, []);
      grid.innerHTML = allHtml;
      countEl.textContent = 'Showing all ' + matches.length + ' entries';
      countP.textContent = 'Every guide and calculator, searched on your device.';
      empty.hidden = matches.length !== 0;
      syncUrl('');
      return;
    }

    var html = '';
    for (var j = 0; j < matches.length; j++) html += card(matches[j].p, qtoks);
    grid.innerHTML = html;
    countEl.innerHTML = matches.length + ' ' + (matches.length === 1 ? 'result' : 'results') + ' for <strong>' + escHtml(q) + '</strong>';
    countP.textContent = matches.length + ' ' + (matches.length === 1 ? 'result' : 'results') + ' for “' + q + '”';
    empty.hidden = matches.length !== 0;
    syncUrl(q);
  }

  function syncUrl(q) {
    try {
      var u = new URL(window.location.href);
      // The form submits ?s= (WP's dialect); the page state stays ?q= —
      // accept both on load, write q on change.
      if (q) u.searchParams.set('q', q); else u.searchParams.delete('q');
      window.history.replaceState(null, '', u.toString());
    } catch (e) {}
  }

  // Accept the theme's ?s= dialect as well as ?q= on load.
  (function initial() {
    try {
      var u = new URL(window.location.href);
      var sq = u.searchParams.get('s');
      var qq = u.searchParams.get('q');
      if (sq !== null && sq !== '' && qq === null) {
        input.value = sq.slice(0, 80);
        try { u.searchParams.delete('s'); u.searchParams.set('q', sq.slice(0, 80)); window.history.replaceState(null, '', u.toString()); } catch (e2) {}
      }
    } catch (e) {}
  })();

  pills.forEach(function (p) {
    p.addEventListener('click', function () {
      pills.forEach(function (x) { x.classList.toggle('on', x === p); x.setAttribute('aria-pressed', x === p ? 'true' : 'false'); });
      cat = p.getAttribute('data-scat') || '';
      run();
    });
  });

  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  input.addEventListener('input', run);
  run();
})();
