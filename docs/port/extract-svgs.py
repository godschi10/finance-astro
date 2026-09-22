#!/usr/bin/env python3
"""Pull every inline SVG out of the dumped live footer HTML, keyed by the
element that wraps it, so the Astro port can use the real icons verbatim."""
import json
import re

SRC = "/home/opc/work/finance-astro/docs/port/wp-footer-live.html"
OUT = "/home/opc/work/finance-astro/docs/port/footer-svgs.json"

html = open(SRC, encoding="utf-8", errors="replace").read()

svgs = []
for m in re.finditer(r"<svg\b.*?</svg>", html, re.S):
    svg = m.group(0)
    # find the wrapping element start tag before this svg
    before = html[:m.start()]
    ctx = ""
    for tag in re.finditer(r"<(a|button|div|span|nav)\b[^>]*>", before):
        ctx = tag.group(0)
    label = ""
    for attr in ("aria-label", "class", "id"):
        am = re.search(attr + r'="([^"]*)"', ctx)
        if am:
            label = f"{attr}={am.group(1)}"
            break
    svgs.append({"ctx": ctx[:160], "label": label, "svg": svg})

out = {}
for i, s in enumerate(svgs):
    key = s["label"] or f"svg{i}"
    out[key] = s["svg"]

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)

print(f"svg count: {len(svgs)}")
for k, v in out.items():
    print(f"  {k:<46} {len(v):>5} chars")
