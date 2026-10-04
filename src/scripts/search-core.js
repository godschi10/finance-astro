/**
 * GWill Finance — search core (SMART engine)
 *
 * The theme's relevance engine (assets/js/spotlight-search.js v1.0.191,
 * ported from the tech theme's v1.16.80 smart dropdown), extracted into ONE
 * module shared by the spotlight overlay and the /search/ results page —
 * one behaviour ships in exactly one place. ES5-style internals; ESM export.
 *
 * Contract (all functions pure except highlight/escHtml):
 * - norm(): lowercase → NFD strip diacritics → punctuation→space → collapse.
 *   Matching runs on normalized text only.
 * - toks(): normalized whitespace tokens.
 * - editDist(): bounded Levenshtein — 9 when clearly too far.
 * - fuzzyOk(): len≥6 ≤2 edits / len 4–5 ≤1 / len<4 exact — MUST keep the
 *   first-letter anchor (tok[0] === word[0]): without it "battery"↔"matter"
 *   (dist 2, same length, unrelated) leaks false positives. "andriod"→
 *   "android" still passes (a==a).
 * - smartMatch(): title-heavy Google-ish scoring (exact title +150 /
 *   title prefix +110 / title substring ≥3 +70; per token: title-word exact
 *   +34 / prefix +28 / fuzzy +15, else title +20 / slug +12 / excerpt +8 /
 *   category +6; ALL-tokens-in-title +40, ALL-tokens-anywhere +25;
 *   ties → newer first; top N).
 * - highlight(): single-pass mark on RAW text BEFORE escaping (longest
 *   tokens first, no double-wraps) — marking escaped text hit entity
 *   interiors (e.g. "amp" in "&amp;").
 *
 * @package GWill_Finance
 */

export function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function norm(s) {
  s = String(s || '').toLowerCase();
  if (s.normalize) s = s.normalize('NFD'); // strips diacritics
  return s.replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')   // punctuation → space
    .replace(/\s+/g, ' ').trim();
}

export function toks(s) {
  var n = norm(s);
  return n ? n.split(' ') : [];
}

// Bounded Levenshtein, typo tolerance (returns 9 when clearly too far).
export function editDist(a, b) {
  var la = a.length, lb = b.length;
  if (a === b) return 0;
  if (Math.abs(la - lb) > 2) return 9;
  var row = [], i, j;
  for (j = 0; j <= lb; j++) row[j] = j;
  for (i = 1; i <= la; i++) {
    var prev = row[0], cur;
    row[0] = i;
    for (j = 1; j <= lb; j++) {
      cur = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = row[j];
      row[j] = cur;
    }
  }
  return row[lb];
}

// A query token tolerates a small typo in a title word (len >= 4 only,
// so 2-char tokens never fuzzy-match into junk). The first-letter anchor
// blocks unrelated words that happen to sit within edit distance
// ("battery" vs "matter" = dist 2, same length, unrelated meaning).
export function fuzzyOk(tok, word) {
  var l = word.length;
  if (l >= 6) return editDist(tok, word) <= 2 && tok[0] === word[0];
  if (l >= 4) return editDist(tok, word) <= 1 && tok[0] === word[0];
  return tok === word;
}

export function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── smartMatch(): relevance scoring ─────────────────────────────
// Score model (title-heavy, Google-ish):
//   exact title        +150   title prefix       +110
//   title substring    +70    per token in title word (exact +34, prefix +28, fuzzy +15)
//   token in title     +20    token in slug      +12
//   token in excerpt   +8     token in category  +6
//   ALL tokens in title +40   ALL tokens anywhere +25
// p: { title, excerpt, url, cat, cat_slug?, date, read_time?|mins? }
export function smartMatch(query, posts, maxResults) {
  var MAX = maxResults || 8;
  var q = norm(query);
  if (!q) return [];
  var qtoks = q.split(' ');

  var scored = [];
  for (var pi = 0; pi < posts.length; pi++) {
    var p = posts[pi];
    var titleN = norm(p.title);
    var tToks = toks(p.title);
    var slugN = norm((p.url || '').split('/').filter(Boolean).pop() || '');
    var excerptN = norm(p.excerpt);
    var catN = norm(p.cat);
    var score = 0;
    var allInTitle = true;
    var allAnywhere = true;

    if (q === titleN) score += 150;
    else if (titleN.indexOf(q) === 0) score += 110;
    else if (q.length >= 3 && titleN.indexOf(q) !== -1) score += 70;

    for (var ti = 0; ti < qtoks.length; ti++) {
      var t = qtoks[ti];
      var best = 0;

      // 1) title word exact / prefix / fuzzy
      for (var wi = 0; wi < tToks.length; wi++) {
        var w = tToks[wi];
        if (w === t) { best = Math.max(best, 34); }
        else if (w.indexOf(t) === 0) { best = Math.max(best, 28); }
        else if (fuzzyOk(t, w)) { best = Math.max(best, 15); }
      }
      // 2) looser containment fallbacks
      if (!best) {
        if (titleN.indexOf(t) !== -1) best = 20;
        else if (slugN.indexOf(t) !== -1) best = 12;
        else if (excerptN.indexOf(t) !== -1) best = 8;
        else if (catN.indexOf(t) !== -1) best = 6;
      }

      if (!best) allAnywhere = false;
      // A token "in the title" = title-word exact/prefix/fuzzy (15+)
      // or title substring (20). Slug/excerpt/category hits don't count.
      if (best < 15) allInTitle = false;
      score += best;
    }

    if (allInTitle && qtoks.length > 1) score += 40;
    if (allAnywhere && qtoks.length > 1) score += 25;
    if (score > 0) scored.push({ p: p, s: score });
  }

  scored.sort(function (a, b) {
    if (b.s !== a.s) return b.s - a.s;
    return (b.p.date || '') < (a.p.date || '') ? -1 : 1; // newer first on ties
  });
  return scored.slice(0, MAX);
}

export function highlight(text, qtoks) {
  // Mark BEFORE escaping: single-pass split on raw text (longest tokens
  // first so the alternation prefers the longest), escape each segment,
  // wrap matches. Marking escaped text hit entity interiors (query "amp"
  // inside "&amp;" → "&<mark>amp</mark>;") and shredded the entity, and
  // sequential passes could match inside earlier <mark> tags.
  var ordered = qtoks.slice().sort(function (a, b) { return b.length - a.length; })
    .filter(function (t) { return t.length >= 2; });
  if (!ordered.length) return escHtml(text);
  var re = new RegExp('(' + ordered.map(escRe).join('|') + ')', 'gi');
  return String(text).split(re).map(function (part, i) {
    return (i % 2 === 1) ? '<mark>' + escHtml(part) + '</mark>' : escHtml(part);
  }).join('');
}
