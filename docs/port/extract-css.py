#!/usr/bin/env python3
"""Extract every CSS rule that styles the WP footer system from the live
stylesheet, preserving @media context and source order.

Outputs docs/port/footer-css-extract.txt (verbatim rules, with the media
condition annotated) so the Astro port can be a faithful transliteration.
"""
import re
import sys

SRC = "/home/opc/work/finance-astro/docs/port/live-style.css"
OUT = "/home/opc/work/finance-astro/docs/port/footer-css-extract.txt"

FOOTER_CLASSES = [
    "footer", "ftop", "fcol", "flogo", "ftag", "fnet", "ffollow", "fpush",
    "fgooglenews", "finstall", "fsoc", "soci", "fct", "fl", "fbot", "fcredit",
    "flegal", "fdot", "ftoplink", "fcol--brand", "ad-bg", "mfooter", "mfgrid",
    "mfbot", "mfcredit", "fct--net",
]
pat = re.compile(r"\.(?:" + "|".join(re.escape(c) for c in FOOTER_CLASSES) + r")\b")

css = open(SRC, encoding="utf-8", errors="replace").read()

# Tokenise into rules, tracking @media / @supports nesting.
i = 0
n = len(css)
stack = []          # enclosing at-rule preludes
out = []
count = 0
while i < n:
    brace = css.find("{", i)
    if brace == -1:
        break
    prelude = css[i:brace].strip()
    # find matching close brace
    depth = 1
    j = brace + 1
    while j < n and depth:
        if css[j] == "{":
            depth += 1
        elif css[j] == "}":
            depth -= 1
        j += 1
    body = css[brace + 1:j - 1]
    line = css.count("\n", 0, i) + 1

    if prelude.startswith("@media") or prelude.startswith("@supports"):
        # descend into the block, collecting inner rules
        inner_i = 0
        inner_n = len(body)
        while inner_i < inner_n:
            b2 = body.find("{", inner_i)
            if b2 == -1:
                break
            inner_prelude = body[inner_i:b2].strip()
            d2 = 1
            k = b2 + 1
            while k < inner_n and d2:
                if body[k] == "{":
                    d2 += 1
                elif body[k] == "}":
                    d2 -= 1
                k += 1
            inner_body = body[b2 + 1:k - 1]
            if pat.search(inner_prelude):
                count += 1
                out.append((prelude, inner_prelude, inner_body.strip(), line))
            inner_i = k
    else:
        if pat.search(prelude):
            count += 1
            out.append((None, prelude, body.strip(), line))
    i = j

with open(OUT, "w", encoding="utf-8") as f:
    f.write(f"/* Footer CSS extracted verbatim from the live WP stylesheet\n"
            f"   (gwill-finance-theme 1.13.39, {SRC}).\n"
            f"   {count} rules. @media conditions are annotated on the line above\n"
            f"   each rule; everything else is copied exactly as served. */\n\n")
    cur_media = object()
    for media, sel, body, line in out:
        if media != cur_media:
            if media:
                f.write(f"\n/* ───── {media} ───── */\n")
            else:
                f.write("\n/* ───── top level ───── */\n")
            cur_media = media
        f.write(f"/* L{line} */\n{sel} {{\n")
        for decl in re.split(r";(?![^(]*\))", body):
            d = decl.strip()
            if d:
                f.write(f"  {d};\n")
        f.write("}\n\n")

print(f"rules extracted: {count}")
print(f"written: {OUT}")
print("\n=== selectors found (source order) ===")
for media, sel, body, line in out:
    print(f"L{line:>5}  {'@media ' + media[7:] if media else '':<26} {sel}")
