#!/usr/bin/env python3
"""Swap the placeholder footer for the ported WP footer in Layout.astro.

Every edit is anchored on an exact string that must appear exactly once; the
script refuses to write unless all anchors resolve, so it cannot half-apply.
"""
import sys

P = "/home/opc/work/finance-astro/src/layouts/Layout.astro"
s = open(P, encoding="utf-8").read()
orig = s

EDITS = []

# ── 1. imports ───────────────────────────────────────────────────────────────
EDITS.append((
    'import "../styles/header.css";',
    'import "../styles/header.css";\nimport Footer from "../components/Footer.astro";\nimport "../styles/footer.css";',
))

# ── 2. the footer-only brand CSS (now unused: the WP footer uses .flogo) ─────
EDITS.append((
    """/* Header chrome lives in src/styles/header.css (WP port) — .sh/.mh/.mno/.gs/.ticker/.tp/.ncta/.nsearch. .brand + .wordmark remain here for the FOOTER brand only. */
.brand{display:inline-flex;align-items:center;gap:8px;margin-right:auto;min-height:48px;text-decoration:none;flex-shrink:0}
.brand-naira{color:var(--gold);font-weight:800;font-size:22px;line-height:1}
.wordmark{position:relative;font-weight:800;font-size:clamp(18px,2.6vw,22px);letter-spacing:-.03em;white-space:nowrap}
.wordmark::after{content:"";position:absolute;bottom:-6px;left:0;right:0;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--gold-b),var(--green));opacity:.8}""",
    """/* Header chrome lives in src/styles/header.css and the footer chrome in
   src/styles/footer.css — both are WP ports. The old placeholder footer classes
   (.footer-grid/.flink-list/.socials/.footer-bottom/.brand/.wordmark) were removed
   with it; nothing referenced them. */""",
))

# ── 3. the placeholder footer CSS block ─────────────────────────────────────
EDITS.append((
    """/* Footer */
.footer{background:var(--dark);color:#f0ede6;margin-top:48px}
.footer-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:32px;padding-block:48px 32px}
.ftag{color:#c4b89a;font-size:14px;margin-top:12px;max-width:44ch}
.fct{font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#8f8575;margin-bottom:12px}
.flink-list{list-style:none;display:flex;flex-direction:column}
.flink-list a{display:inline-flex;align-items:center;min-height:44px;color:#c4b89a;text-decoration:none;font-size:13px}
.flink-list a:hover{color:#fff}
.socials{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}
.socials a{display:inline-flex;align-items:center;justify-content:center;min-width:48px;min-height:48px;border:1px solid #2b2822;border-radius:var(--r-sm);color:#c4b89a;font-size:13px;font-weight:800;text-decoration:none;padding:0 10px}
.socials a:hover{color:var(--gold-b);border-color:var(--gold-b)}
.footer-bottom{border-top:1px solid #211f1a;padding-block:20px;display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between;font-size:11px;color:#8f8575}
.colophon{font-size:10px;letter-spacing:.06em;text-transform:uppercase}
""",
    "",
))

# ── 4. tablet override for the removed grid ─────────────────────────────────
EDITS.append(("  .footer-grid{grid-template-columns:2fr 1fr 1fr 1fr}\n", ""))

# ── 5. the ≤359px + forced-colors brand rules ───────────────────────────────
EDITS.append((
    """@media(max-width:359px){
  .brand{grid-column:1;grid-row:1;min-width:0}
  .wordmark{font-size:16px}
}
@media(forced-colors:active){.wordmark::after{background:LinkText}}
""",
    "",
))

for old, new in EDITS:
    n = s.count(old)
    if n != 1:
        sys.exit(f"ABORT: anchor found {n} times (expected 1):\n{old[:90]!r}")
    s = s.replace(old, new)

# ── 6. replace the placeholder footer markup with the component ─────────────
start = s.index('<footer class="footer"><div class="wrap">')
end_marker = "</div></footer>"
end = s.index(end_marker, start) + len(end_marker)
removed = s[start:end]
if removed.count("<footer") != 1:
    sys.exit(f"ABORT: markup block looks wrong, found {removed.count('<footer')} <footer tags")
s = s[:start] + "<Footer />" + s[end:]

open(P, "w", encoding="utf-8").write(s)
print(f"OK — {len(EDITS)} CSS/import edits + markup swap")
print(f"placeholder footer markup removed: {len(removed)} chars, {removed.count(chr(10)) + 1} lines")
print(f"file: {len(orig)} -> {len(s)} chars")
