# 17 — Comments integration (the vibe-comments port, v0.4.6)

The approved plan is `15-comments-plan.md`. This is the record of what was
actually wired into the site, what was deliberately left out, and how each claim
was proven.

## What the surface is

The theme has no bespoke comment markup. `comments.php` hands the surface to the
King's own **vibe-comments plugin** and the theme only skins it with a gold
stylesheet — so the port is a port of the plugin, not an invention.

Two shipped sheets, byte-identical copies of what the plugin and theme enqueue:

| file | source | bytes | sha256 (first 12) |
|---|---|---|---|
| `src/styles/vibe-comments.base.css` | plugin `public/css/vibe-comments.css` | 40,720 | `8fa856847899` |
| `src/styles/vibe-comments.gold.css` | theme `assets/css/vibe-comments.css` | 24,412 | `0cdc300fec7c` |

**Cascade order matters**: `inc/enqueue.php:491-505` registers the theme's
override with `vibe-comments` as a dependency so WordPress prints the plugin
sheet first and the override last. The imports in `[slug].astro` reproduce that
order exactly, and the gate asserts it.

They are imported in the page rather than the layout because WP enqueues both
only on singulars (`is_singular() && !is_front_page()`); importing them in
`[slug].astro` keeps the ~65 KB off every other page, which is the closest
static equivalent of that condition.

## Placement

`single.php` renders, in order: related posts (`div.mt40`, lines 183-204) →
`.comments-area.mt48` wrapping `comments_template()` + the `#gwill-comment-ads`
slots (212-226) → the mobile newsletter (228-236).

`[slug].astro` puts `<VibeComments />` in exactly that slot, and the component
carries the `.comments-area.mt48` wrapper and the hidden ad slots itself, so the
served structure is the theme's.

## The client module — a seam patch, not a rewrite

`src/scripts/vibe-comments.js` **is the plugin's own client script**: 3,087
lines in, 3,064 out, **233 changed lines**. Everything was done with targeted
replacements on a byte copy — the render core (`createCommentElement`,
`buildCommentTree`), the markdown-lite pipeline, `escapeHtml`/`linkify`, the
77-key i18n dict, the draft autosave, the char counter, the relative-time sweep
and the guest-identity rail are untouched.

Only the transport seam moved:

| plugin (WP) | port (Worker) |
|---|---|
| `ajaxUrl + '?action=vibe_load_comments&post_id=…'` | `GET {apiBase}/comments?post=<slug>&page=&per_page=` |
| `action=vibe_load_replies` | `GET {apiBase}/comments/:id/replies?post=` |
| `action=vibe_submit_comment` (POST) | `POST {apiBase}/comments` |
| `action=vibe_get_comment_count` | `GET {apiBase}/count?post=` |
| `action=vibe_toggle_like` (POST) | `POST {apiBase}/comments/:id/reactions` |

- `nonce` is gone everywhere (meaningless off WP; Turnstile rides `submit`).
- `post_id` is now the **slug string** — the numeric `parseInt` is removed, the
  hidden `comment_post_ID` field name is kept so the client reads it unchanged.
- The response envelope is still `{success, data}`, so the render core needs no
  changes.
- One addition: the client now serializes `vibe_hp`. In WP the honeypot lived in
  the form and the plugin read it server-side; the Worker reads it from the body,
  so the port sends it.
- Bootstrap calls only the v1 inits. The held features (mentions, push, edit
  window, sort, search, pin, notify, Q&A, Google auth, nonce/session refresh,
  live polling, bulk sync) remain defined but are never invoked.

### Two dead-code decisions
- The held functions still contained old `ajaxUrl`/`action`/`nonce` tokens. They
  were re-pointed at `{apiBase}` paths, each tagged
  `// PORT SEAM: no v1 Worker route — retained, unreachable`. They are placeholders
  for unreachable code, not implemented endpoints.
- `refreshNonce()` / `refreshSessionState()` are documented no-op stubs: no
  Worker equivalent can exist for WP nonces or sessions.

## The count

WordPress bakes the stored count into the heading (`comments.php:42-52`). The
port fetches it at build time from `GET /count?post=<slug>` with a 4 s timeout
and a **non-fatal 0 fallback** — if the Worker is unreachable the heading renders
empty, which is exactly what WP does for a post with no comments, and the client
patches it to the live total on Load. Zero comments therefore hides the heading
through the plugin's own `:empty` rule.

## Holds — absence, never a dead control

- The reply-push opt-in and the email opt-in are **removed**, not inert: v1 has
  neither rail (plan §6). They return with the P3 rails.
- The `.vibe-or` separator went with the WP-login and Google buttons it
  separated — a separator with nothing to separate is dead markup.
- The sort/search toolbar is **not revealed**. WP ships it `display:none` and
  shows it only from the P2 sort code; revealing it in v1 would put an inert
  sort button on screen.

## Worker-side fixes found by comparing against live

Live WP is the ground truth for the wire shape. Two divergences were found and
fixed in the Worker:

1. **Gravatar**: the plugin calls WordPress core
   `get_avatar_url($email, ['size' => 48])`, and WP 7.1 core hashes with
   `hash('sha256', strtolower(trim($email)))`. The Worker was emitting MD5 with
   `s=64`. It now stores/emits SHA-256 with `?s=48&d=wavatar&r=g` — byte-identical
   to live. The hand-written MD5 helper is deleted.
2. **`date`**: live sends WP's `human_time_diff()` string ("2 weeks ago"), not a
   timestamp. The Worker now ports `human_time_diff()` and
   `gmdate('Y-m-d H:i:s')`, and the wire object carries the same 20 keys as live.

## Verification

- **Article gate 147/147** (was 124). New assertions: component present and
  imported, renders between related posts and the mobile newsletter, the
  `.comments-area.mt48` wrapper, cascade order, byte-faithful stylesheets, the
  live Worker base wired (not a placeholder), the build-time count with its
  fallback, the slug-keyed form fields, the honeypot, the guest toggle, the holds
  staying absent, single-bind (exactly one module import), the seam greps, and
  the served bytes.
- **Worker 60/60 against the deployed URL**, including the new wire-parity
  assertions.
- **Real Chrome at 390px** (`/home/opc/work/regression/comments-probe.py`):
  collapsed shell → Load Comments → live fetch → submit → "pending review" →
  approved in D1 → the card renders with author, gravatar, 7 reaction controls,
  a reply affordance and a relative timestamp, **0 JS errors**. The probe aims
  its submission at a throwaway slug and cleans up after itself.

## Ops

- Worker: `https://comments-api.gwill.workers.dev` (see `comments-api/README.md`
  for the runbook, the auth law, and the Cloudflare UA gotcha).
- Test rows live under `smoke-%` slugs only; `comments-api/clean_smoke_rows.py`
  removes them and prints the counts it leaves behind. Production D1 must read
  zero after a verification run.
