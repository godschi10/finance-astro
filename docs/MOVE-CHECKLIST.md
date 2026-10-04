# MOVE CHECKLIST — domain / base / backend move

A domain or subpath move touches **two repos** (this one + `/home/opc/work/comments-api`)
and fails **silently at runtime** if you miss the Worker allowlist: the build stays
green while comments, forms, newsletter and the `/mod/` desk all break in-browser
(CORS returns an empty `Access-Control-Allow-Origin`). Work top to bottom, then run
the gate (§8) — `npm run check` green is the move gate.

## 1. Worker allowlist + redeploy (comments-api repo — do FIRST)

- File: `/home/opc/work/comments-api/src/index.js:36-42` (`ALLOWED_ORIGINS`).
  Exact strings, **no wildcards** — even a `www` vs apex variant breaks. Add the new
  origin string; keep the old one until cutover DNS flips.
- Redeploy the Worker after the edit (values below are keys only, never read):
  `cd /home/opc/work/comments-api && wrangler deploy`
- Secrets/bindings do **NOT** change on a domain move: `ADMIN_TOKEN`,
  `TURNSTILE_SECRET`, `EMAIL_HMAC_KEY`, `SALT`, optional `RESEND_API_KEY`,
  `EMAIL_TO`, `EMAIL_FROM`; bindings `DB` (D1), `RL` (KV) per `wrangler.toml:8-20`.

## 2. Site origin + base (this repo — SINGLE-SOURCED since the S2 fix)

- `src/data/site.ts:15-16`: `ORIGIN` / `BASE` consts are the single source of
  truth, with env overrides `SITE_ORIGIN` / `SITE_BASE` (defaults reproduce
  today's `https://godschi10.github.io` + `/finance-astro` byte-for-byte).
  A domain/base move is a build parameter, not a source edit:
  `SITE_ORIGIN=https://new.example SITE_BASE=/newbase npm run build`.
- `astro.config.mjs:7,11-12,16`: imports `ORIGIN`/`BASE`, sets `site`/`base`,
  plus `trailingSlash: "always"` matching the site's universal trailing-slash
  convention. No edit needed on a move (env covers it).
- `src/data/site.ts:21`: `SITE.origin` now derives from `ORIGIN` — feeds only
  the footer copyright string (`src/components/Footer.astro:18`). No separate edit.
- Four legacy `?? "https://godschi10.github.io"` fallbacks
  (`src/layouts/Layout.astro:43`, `src/components/ToolShell.astro:47`,
  `src/pages/articles/[slug].astro:75`, `src/pages/sitemap.xml.ts:14`) silently
  re-pin the old domain wherever `Astro.site` is unset — confirm they have been
  replaced by the shared helper; any survivor needs the same edit on a move.
- (If the Worker literal has since been centralized per the S2 fix plan, it lives
  as one exported const in `src/data/site.ts` — a backend move is then a one-line
  diff there. Until then, §3's four sites apply.)

## 3. Backend literal (Worker URL — stays absolute, it is external)

- Three ship sites + CSP + gate pin — rotate all five together:
  `src/layouts/Layout.astro:147` (`data-forms-api`),
  `src/pages/articles/[slug].astro:82` (`COMMENTS_API`),
  `src/pages/mod.astro:34` (`COMMENTS_API`),
  `src/layouts/Layout.astro:165` (CSP `connect-src` + `form-action` entries),
  `scripts/check-article-fidelity.mjs:395` (gate asserts the literal string).

## 4. CSP feed list

- `src/layouts/Layout.astro:165`: `connect-src` allowlist must keep matching the
  price feeds the client actually calls — `https://open.er-api.com`,
  `https://api.coingecko.com`, `https://api.coinbase.com`,
  `https://api.binance.com`, `https://api.gold-api.com` (callers:
  `src/scripts/ticker-live.js:224-306`, `scripts/fetch-snapshot.mjs:29-38`,
  `src/lib/fx.ts:103`). Swapping a feed = edit markup + client + build script + CSP.
- `frame-src` covers the three embed players (`player.vimeo.com`,
  `open.spotify.com`, `www.youtube.com`) — touch only if embeds change.

## 5. robots.txt + index posture (STAGING today — flipping is a LAUNCH decision)

- `public/robots.txt:1-3`: today `Disallow: /` + absolute
  `Sitemap: https://godschi10.github.io/finance-astro/sitemap.xml`. Update the
  Sitemap URL to the new origin+base on every move.
- Posture trio must flip together at LAUNCH (staging → production):
  `public/robots.txt` (`Disallow: /` → `Allow: /`),
  `src/layouts/Layout.astro:151` (`noindex,nofollow` → index),
  `src/layouts/Layout.astro:176` (remove the "GitHub Pages staging" marker).
  **Do NOT flip these for a staging-to-staging move.**

## 6. Manifest (PWA scope)

- `public/manifest.webmanifest:5-6`: `start_url` + `scope` hardcode the base
  (`/finance-astro/`); icons entry (`:11`) is the base-independent
  `"sizes": "any"` SVG form (`icons/icon.svg` — the only file in `public/icons/`).
  On a base move, update `start_url`/`scope` (or switch to `"./"` relative form);
  icon refs in `src/layouts/Layout.astro:63,178-180` point at the same `icon.svg`.

## 7. Article body content (base baked into *.md bodies)

- Since v0.7.15 frontmatter media fields are base-less (render-prefixed); only
  markdown BODY bytes still carry the prefix (WP parity — the importer re-adds
  them). Count, then rewrite bodies only:
  `grep -rc '/finance-astro/' src/content/articles/ | grep -v ':0'`
  (frontmatter must be 0 already — if not, the render-prefix layer broke, stop).
  `grep -rl '/finance-astro/' src/content/articles/ | xargs sed -i 's|/finance-astro/|/NEWBASE/|g'`
  (Moving to a domain root instead: `s|/finance-astro||g` — re-run the count after;
  it must be 0 outside intentional prose.)
- Client fallback literal: `src/scripts/spotlight-search.js` (`INDEX_BASE`
  fallback, fires only when no `.gs-form` exists) — same `s|/finance-astro/|/NEWBASE/|`.

## 8. Move gate: build + check + served-byte self-check

- `NODE_OPTIONS=--max-old-space-size=384 npm run build` → exit 0 (78 pages).
- `npm run check` → 6/6 green. ANY red: stop, fix, re-run.
- Sitemap/canonical self-check against the NEW origin+base (all emitted hrefs end
  in `/`; canonical `Layout.astro:46-48`, loc `src/pages/sitemap.xml.ts:63`):
  `grep -o 'rel="canonical"[^>]*' dist/index.html | head -3`
  `grep -o '<loc>[^<]*' dist/sitemap.xml | head -5`
  `grep -rho 'https://OLD-ORIGIN' dist/ | sort -u` — must print nothing.
- Ship via `scripts/ship-pages.sh <version> <message>` (manager runs it); it ends
  with homepage + category curl probes — both must be 200 on the new domain.
