#!/usr/bin/env python3
"""Definitive CSS fidelity check for the footer port.

Parses the WordPress theme's style.css into (media-context, selector, declarations)
triples, keeps every rule that touches a footer selector, and reports which of
them are NOT present in the ported src/styles/footer.css (compared on normalised
selector + declarations, media context included).
"""
import re
import sys

WP = "/home/opc/projects/gwill-finance-theme/style.css"
MINE = "/home/opc/work/finance-astro/src/styles/footer.css"

FOOTER_SEL = re.compile(r"\.(footer|mfooter|ftop|fbot|fcol|flogo|ftag|fnet|ffollow|fpush|fgooglenews|finstall|fsoc|soci|fct|fl|fcredit|flegal|ftoplink|mf[a-z]*|no-flex-gap|ad-bg)\b")


def strip_comments(css: str) -> str:
    return re.sub(r"/\*.*?\*/", " ", css, flags=re.S)


def parse(css: str):
    """Yield (media, selector, decls) in source order."""
    css = strip_comments(css)
    out, stack, buf, i = [], [], "", 0
    while i < len(css):
        ch = css[i]
        if ch == "{":
            head = buf.strip()
            buf = ""
            if head.startswith("@media") or head.startswith("@supports"):
                stack.append(head if head.startswith("@media") else None)
                i += 1
                continue
            if head.startswith("@") and not head.startswith("@keyframes"):
                stack.append(None)
                i += 1
                continue
            # a normal rule: read to matching close brace
            depth, j = 1, i + 1
            while j < len(css) and depth:
                if css[j] == "{":
                    depth += 1
                elif css[j] == "}":
                    depth -= 1
                j += 1
            decls = css[i + 1:j - 1]
            media = next((m for m in reversed(stack) if m), None)
            out.append((media, head, decls))
            i = j
            continue
        if ch == "}":
            if stack:
                stack.pop()
            buf = ""
            i += 1
            continue
        buf += ch
        i += 1
    return out


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().rstrip(";")


wp_rules = [(m, s, d) for (m, s, d) in parse(open(WP, encoding="utf-8").read()) if FOOTER_SEL.search(s)]
mine_text = norm(open(MINE, encoding="utf-8").read())
mine_rules = parse(open(MINE, encoding="utf-8").read())
mine_sel_decl = {(norm(s), norm(d)) for (_m, s, d) in mine_rules}
mine_sel = {norm(s) for (_m, s, _d) in mine_rules}

print(f"WP footer-touching rules: {len(wp_rules)}   port rules: {len(mine_rules)}\n")
missing_sel, missing_decl = [], []
for media, sel, decls in wp_rules:
    s, d = norm(sel), norm(decls)
    if s in mine_sel and (s, d) in mine_sel_decl:
        continue
    if s in mine_sel:
        missing_decl.append((media, s, d))
    else:
        missing_sel.append((media, s, d))

print("=== selectors ABSENT from the port (excluding ad-bar/consent/panel scope) ===")
SKIP = re.compile(r"gwill-bell|gbp-|gconsent|ad-sticky|ad-slot|ad-ring|ad-bg|ad-label|ad-x|no-flex-gap|\.fs-lg")
for media, s, d in missing_sel:
    if SKIP.search(s):
        continue
    print(f"  [{(media or 'top level')[:46]}] {s}\n      {d[:160]}")

print("\n=== selectors present but with DIFFERENT declarations ===")
for media, s, d in missing_decl:
    if SKIP.search(s):
        continue
    print(f"  [{(media or 'top level')[:46]}] {s}\n      wp: {d[:220]}")

print("\n=== out-of-scope (documented omissions) ===")
seen = set()
for media, s, d in missing_sel + missing_decl:
    if SKIP.search(s) and s not in seen:
        seen.add(s)
        print(f"  {s}")
print(f"\ntotal out-of-scope skipped: {len(seen)}")
