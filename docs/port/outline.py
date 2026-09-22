#!/usr/bin/env python3
"""Decode the agent-browser JSON-escaped dump of the live WP footer into clean
HTML plus a structural outline, so the port can be built from ground truth."""
import json
import re
import sys
from html.parser import HTMLParser

SRC = sys.argv[1] if len(sys.argv) > 1 else "/home/opc/work/finance-astro/docs/port/raw-footer-html.txt"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/home/opc/work/finance-astro/docs/port/wp-footer-live.html"

raw = open(SRC, encoding="utf-8", errors="replace").read().strip()
# agent-browser prints the value as a JSON string (sometimes double-encoded).
html = raw
for _ in range(3):
    try:
        parsed = json.loads(html)
    except Exception:
        break
    if isinstance(parsed, str):
        html = parsed
    else:
        break

open(OUT, "w", encoding="utf-8").write(html)
print(f"clean html written: {OUT} ({len(html)} chars)")

VOID = {"br", "img", "input", "hr", "meta", "link", "source", "path", "use", "circle", "rect"}


class Outline(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.lines = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get("class", "")
        keep = []
        for k in ("href", "id", "type", "aria-label", "data-install-app", "data-install-ios",
                  "hidden", "target", "rel", "viewBox", "width", "height", "d", "fill"):
            if k in a:
                v = a[k]
                if k == "d":
                    v = v[:40] + ("..." if len(v) > 40 else "")
                keep.append(f'{k}="{v}"')
        self.lines.append("  " * self.depth + f"<{tag}" + (f' .{cls}' if cls else "") +
                          ((" " + " ".join(keep)) if keep else "") + ">")
        if tag not in VOID:
            self.depth += 1

    def handle_endtag(self, tag):
        if tag not in VOID and self.depth > 0:
            self.depth -= 1

    def handle_data(self, data):
        t = " ".join(data.split())
        if t:
            self.lines.append("  " * self.depth + f'"{t}"')


p = Outline()
p.feed(html)
outline = "\n".join(p.lines)
print(f"outline lines: {len(p.lines)}")
print("=" * 70)
print(outline[:9000])
