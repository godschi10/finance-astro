# 15 — Comments for the static port: the plan (awaiting King's approval)

> King's order: "port comments, make serious plans for comments let's give it
> a custom comment, but for our custom Cloudflare comments style. Let's plan
> first." **No implementation until this plan is approved.**

## 0. What the King's own comment system actually is (the evidence)

The finance theme's comment surface is **vibe-comments, the King's own plugin**
(v3.20.28 live on finance.fitnesslova.qzz.io), skinned gold by the theme's
override stylesheet. "Port comments" therefore means porting THIS, not
inventing a new design.

- **Template**: `wp-content/plugins/vibe-comments/templates/comments.php`
  (257 lines). Lazy by design: a "Load Comments" button is all that renders;
  toolbar + list + form sit in `#vibe-comments-container[display:none]`
  until clicked. `<noscript>` honest-notice with count. Guest fields hidden
  behind a "Comment as Guest" toggle. Honeypot `vibe_hp`. Char counter
  `0 / 2000`. "Notify me about replies" (push) + "Email me about replies"
  opt-ins.
- **Placement**: `single.php` after related + leaderboard ad slot, inside
  `.comments-area.mt48`, plus TWO hidden `#gwill-comment-ads` slots that
  main.js clones after every 5th main comment (comment ads = later leg,
  depends on the ad-slot system still on the open-holds list).
- **Backend**: 14 `wp_ajax[_nopriv]` actions (class-ajax-handler.php:14-23):
  `vibe_refresh_nonce, vibe_submit_comment, vibe_session_state,
  vibe_load_comments, vibe_load_replies, vibe_sync_likes, vibe_toggle_like,
  vibe_toggle_notify, vibe_edit_comment, vibe_get_comment_count,
  vibe_search_comments, vibe_google_auth, vibe_accept_answer, vibe_pin_comment`.
- **Wire shape**: comment object `{id, author, content, date, children[],
  reactions, can_edit, is_edited, owns, …}` (class-ajax-handler.php:1273+).
- **Config object** `var vibeComments = {…}` (iconMode, nonce, ajaxUrl,
  postId, replyPush.publicKey, mentions.authors, maxCommentLength:2000,
  full i18n dict) — served inline before the script.
- **Style layers**: plugin base `public/css/vibe-comments.css` (40,720 bytes)
  + theme override `assets/css/vibe-comments.css` (24,412 bytes, enqueued
  only when the plugin is active — enqueue.php:491-505). The override IS the
  gold skin: `--vibe-primary:#d97706`, hover `#b45309`, light `--vibe-bg:
  #ffffff`, dark `#f59e0b` on `#131210`, borders `#5e5748`, radius 10px.
- **Client JS**: `public/js/vibe-comments.js` (151,632 bytes): comment card
  builder with inline-SVG reaction picker (emoji-first + SVG fallback),
  @mention pills, 5-min edit window + `(edited)` badge, in-thread search,
  sort (Newest/Oldest/Top), relative time, markdown-lite renderer with
  escapeHtml at every sink.

## 1. Architecture — two layers, honest about the split

```
Static port (GitHub Pages)              Cloudflare (the custom backend)
┌──────────────────────────────┐        ┌────────────────────────────────┐
│ [slug].astro after related:  │  fetch │ Worker: comments-api            │
│  .comments-area.mt48         │ ──────►│  GET  /count?post=             │
│  templates/comments.php      │ CORS  │  GET  /comments?post=&cursor=  │
│  markup, ported minus WP     │        │  POST /comments               │
│  vibe-comments.css ×2 files  │        │  POST /comments/:id/reactions │
│  (verbatim) = gold skin       │        │  GET  /comments/:id/replies   │
│  comments.js: render core    │        │  (moderation) ADMIN_TOKEN rail │
│  ported; transport swapped    │        │  D1: comments + reactions     │
└──────────────────────────────┘        │  KV: rate-limit counters       │
                                         └────────────────────────────────┘
```

- **UI = port** (Law 0): the King's own gold-skinned vibe design, byte-faithful.
- **Backend = custom on Cloudflare**: this IS the "custom Cloudflare comments"
  half — a Worker + D1 replacing admin-ajax/PHP/WP-DB, zero external
  dependencies (plugin law #1 holds: no Disqus, no SaaS, no third-party
  comment services).

## 2. Worker API v1 — mapped from the 14 actions

| WP action | v1 Worker endpoint | Notes |
|---|---|---|
| vibe_load_comments | `GET /comments?post=<slug>&cursor=` | approved only, nested children, 50/page (plugin's showingFirst50 parity) |
| vibe_load_replies | `GET /comments/:id/replies` | same shape, `has_more` |
| vibe_submit_comment | `POST /comments` | honeypot + Turnstile + rate-limit; returns the formatted comment |
| vibe_get_comment_count | `GET /count?post=<slug>` | runtime count; also refreshes the title ("N Comments") |
| vibe_toggle_like / sync_likes | `POST /comments/:id/reactions` | one kind per guest token; totals returned |
| vibe_refresh_nonce | **dropped** | WP nonces are meaningless off WP; Turnstile token replaces the anti-CSRF rail |
| vibe_edit_comment | P2 | edit window ships in phase 2 |
| vibe_search_comments, toggle_notify, google_auth, session_state, pin, accept_answer | P2/P3 | search+sort P2; no WP users → login paths P3 |

**D1 schema** (mirrors the plugin's commentmeta semantics — state lives on the
comment, nothing third-party stored):

```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,          -- the Astro slug is the post key
  parent_id INTEGER DEFAULT 0,      -- 0 = top-level
  author TEXT NOT NULL,
  email_hash TEXT NOT NULL,         -- SHA-256(email+salt); email NEVER stored raw
  content_md TEXT NOT NULL,         -- stored markdown-lite, rendered client-side
  approved INTEGER DEFAULT 0,      -- moderation queue
  spam_score INTEGER DEFAULT 0,    -- ported scorer, display-only
  guest_token TEXT,                 -- SHA-256(IP+UA+salt+day): ownership rail
  created_at INTEGER NOT NULL,
  edited_at INTEGER
);
CREATE TABLE reactions (
  comment_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('like','heart','fire','laugh')),
  guest_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(comment_id, kind, guest_token)
);
```

**KV**: `rl:<ip>` submit counter (the plugin's live law is ~1/min per IP —
kept); no other state.

## 3. Antispam — the plugin's philosophy, Cloudflare's tools

1. **Honeypot `vibe_hp`** — verbatim (template line 211).
2. **Rate limit** — 1 submit/min/IP, 10/hour/IP (KV).
3. **Cloudflare Turnstile** (managed, free) — the one place "Cloudflare
   comments" buys real protection at zero dependency cost; hidden widget on
   the form, token verified Worker-side. *King decision 3 — can be declined;
   honeypot+ratelimit still hold.*
4. **Spam scorer** — port `class-spam-score.php` (pure heuristics, stateless)
   to the Worker; flags for moderation, never auto-acts (plugin law).

## 4. Moderation + identity

- **Guests only in v1** (matches the port: no WP users exist). Name + email;
  email hashed at rest, never rendered, never shared.
- **Approve-first by default** (WP parity: comments held for moderation).
  The King gets an email per submission (Worker + MailChannels, free) with
  one-click Approove/Delete links signed by HMAC token — or a minimal admin
  page on the Worker guarded by `ADMIN_TOKEN`. *King decision 2.*
- Guest token (SHA-256 of IP+UA+salt+day) = the plugin's `_vibe_owner` rail:
  powers reaction ownership now, the 5-min edit window in P2.

## 5. UI port specifics (Law 0 discipline)

- **Markup**: byte-port of `templates/comments.php` minus WP conditionals:
  `comments_open()` always true (comments are a shipped feature now);
  `is_user_logged_in()` always false → auth-bar renders "Comment as Guest"
  only; WP-login/Google buttons honestly removed (declared divergence:
  no WP behind a static site). `#gwill-comment-ads` hidden slots ship as-is
  (dead until the ad system lands — honest hold, not deleted).
- **CSS**: BOTH stylesheets verbatim, in the same cascade order the theme
  enqueues (plugin base first, gold override second). The 40KB base +
  24KB override ride on the article page only (not every page — lazy import),
  so the 54-page inline bundle grows only where comments live.
- **JS**: port the render core from `vibe-comments.js` (card builder,
  reaction picker with emoji-first+SVG fallback, relative time, markdown-lite
  with escapeHtml at every sink, i18n dict verbatim); swap the transport
  layer (XHR→admin-ajax) for `fetch()`→Worker with the SAME payload shapes.
  Config object `vibeComments` ported field-for-field: `ajaxUrl` → Worker
  URL, `replyPush` disabled (no push rail on static yet — P3), `mentions`
  seeded from content authors, `maxCommentLength: 2000`, i18n unchanged.
- **Single-bind law** (the × -twice lesson): the comments script ships as
  exactly ONE module; the gate asserts one init path.

## 6. Honest holds (never fake controls)

- Reactions and replies are REAL in v1 (Worker-backed). Push notify, email
  notify, mentions, search, edit, Q&A: not in v1 — their opt-in UI is not
  rendered rather than rendered-dead (the plugin hides unavailable rails the
  same way: `Vibe_Comments_Reply_Push::is_available()` gates its block).
- Comment-ad slots: hidden markup shipped, no clone behaviour until the ad
  system port (open-hold dependency).
- Worker unreachable → the list/form show the plugin's own honest error
  strings ("Could not load comments." / "Try again") — no silent failure.

## 7. Phases

- **P1 (v0.5.0, on approval)**: Worker + D1 + the 5 v1 endpoints; UI port
  (lazy Load button, list, guest form, char counter, reactions, replies,
  count title); antispam trio + scorer; moderation email + admin page;
  gates; live E2E on the Pages URL with real input.
- **P2 (v0.5.x)**: 5-min edit window + `(edited)` badge; sort modes;
  in-thread search; mentions seeded from content authors; spam-score
  moderation queue view.
- **P3 (v0.6.x)**: reply push (Worker-based VAPID push rail for the static
  site), reply email with unsubscribe rail (MailChannels), magic-link email
  login (replaces WP/Google login), Q&A mode.

## 8. Gates (added to check-article-fidelity / a new comments gate)

1. Markup parity: ported template renders every template id/class
   (`vibe-comments-section`, `vibe-load-comments-btn`, `vibe-comment-list`,
   form fields, honeypot, counter) — counted, not grepped.
2. Style: both CSS files verbatim-diffed (rule-by-rule, media contexts
   included); gold tokens present (`--vibe-primary:#d97706`, dark `#f59e0b`).
3. Config: `vibeComments` object field-for-field vs the captured live one.
4. Single-bind: exactly one comments script import; no folded copy anywhere.
5. No dead controls: every rendered control maps to a Worker endpoint;
   P2/P3 features absent from markup, not hidden.
6. E2E: real input on the deployed Pages URL — load → guest submit →
   moderation approve → visible; reaction toggles and re-toggles.

## 9. Ops (Cloudflare free tier, fits easily)

- Workers free: 100k req/day; D1 free: 5M reads/100k writes per day;
  KV free: 100k reads/day; Turnstile: free; MailChannels via Workers: free.
  A finance blog's comments sit orders of magnitude below all of these.
- Deploy: `wrangler deploy` from the VPS (wrangler not yet installed — npm
  install at implementation); secrets `ADMIN_TOKEN`, `TURNSTILE_SECRET`,
  `EMAIL_HMAC_KEY`, `SALT` via `wrangler secret put`; D1 backup via
  `wrangler d1 export`.
- CORS: locked to the port's origin (+ localhost for dev).

## 10. The King's five decisions (the plan's ask)

1. **Worker domain**: `comments-api.<account>.workers.dev` (free, zero DNS,
   recommended to start) or a route on a King-owned domain?
2. **Moderation**: approve-first (recommended — WP parity, spam stays off
   the page) or instant-publish?
3. **Turnstile**: on (recommended, free, no dependency violation) or
   honeypot+ratelimit only?
4. **Reactions in v1**: ship the 4 (like/heart/fire/laugh, emoji-first +
   SVG fallback, exactly as live) or hold for P2?
5. **Phase cut**: confirm P1 floor above (list/replies/guest-form/reactions/
   moderation/antispam) — anything the King wants pulled forward?
