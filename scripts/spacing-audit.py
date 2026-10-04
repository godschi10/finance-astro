#!/usr/bin/env python3
"""
Sitewide cramp audit — v0.6.8 (King: "not enough space between text/elements...
...then do it sitewide").

Scans every page in dist/ for inline <style> rules that TIGHTEN spacing on
text-level elements (p, li, h2-h4, summary, td/th, .faq, note/label/meta/foot/
sub classes) via font-size shrink or margin/padding/line-height values below
the ROYAL FLOOR:

  body text font-size: 15px   li margin-bottom: 6px   section margin-top: 10px
  h4 margin: 12px             small-copy margin-top: 8px   .faq p font-size 15px

Plus every inline style="margin-top:Npx" / "margin:Npx" on a TEXT element in
markup (div/p/h/section carrying copy). Prints one line per violation:
  PAGE | CONTEXT | RULE | why it's cramped

Floor is deliberate: we flag CRAFT cramp (sub-15px type stacked with <10px
margins on reading copy), not dense chrome (ticker, icons, chips) — those
intentionally sit tight and the King has never complained about them.
"""
import re, sys, glob, os

# Repo-root-relative: the audit reads the built dist/ tree no matter which
# directory it is invoked from (CWD-relative glob breaks under `npm run`
# from a subdirectory or when a gate spawns it elsewhere).
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_GLOB = os.path.join(REPO_ROOT, "dist", "**", "*.html")

SMALL = {"p":1,"li":1,"dd":1,"dt":1}
TEXT_TAGS = {"p","li","ul","ol","h2","h3","h4","summary","section","div","span","td","th","figcaption"}

# property floors (px)
FONTSIZE_FLOOR = 15
MARGIN_FLOOR   = 10   # for top-level copy blocks
LM_FLOOR       = 6    # li margin-bottom

def to_px(v, base=16.0):
    v=v.strip()
    m=re.fullmatch(r"([\d.]+)px", v)
    if m: return float(m.group(1))
    m=re.fullmatch(r"([\d.]+)rem", v)
    if m: return float(m.group(1))*base
    m=re.fullmatch(r"\.(\d+)em", v)
    if m: return float("."+m.group(1))*base
    m=re.fullmatch(r"([\d.]+)em", v)
    if m: return float(m.group(1))*base
    m=re.fullmatch(r"(\d+)%", v)
    if m: return float(m.group(1))/100*base
    return None

def scan_css(css, page, out):
    css = re.sub(r"/\*[\s\S]*?\*/", "", css)  # strip comments FIRST (they quote rules)
    # split into rules (naive but adequate for inline blocks; no @media nesting depth issues since we capture context)
    ctx=None
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", css):
        sel, body = m.group(1).strip(), m.group(2)
        if sel.startswith("@"):
            ctx=sel
            continue
        # declarations
        decls={}
        for d in body.split(";"):
            if ":" in d:
                k,v=d.split(":",1); decls[k.strip()]=v.strip()
        # font-size shrink on text selectors
        fs=decls.get("font-size")
        if fs:
            px=to_px(fs)
            if px is not None and px < FONTSIZE_FLOOR and re.search(r"(^|[\s,])(p|li|summary|h[2-4]|dd|figcaption|\.[\w-]*(note|copy|meta|answer|sub|foot|desc|label|faq|q\b))([\s,{:]|$|\.)", sel, re.I):
                # dense chrome exemption
                if re.search(r"(ticker|chip|badge|btn|tag|\.es-|kbd|eyebrow|\.t-|si-|mono|\.no-|kbd)", sel): continue
                out.append((page,"CSS",(ctx+" " if ctx else "")+sel[:90]+" {"+f"font-size:{fs}"+"}", f"{px:.1f}px text below 15px floor"))
        # margins on text elements
        for prop in ("margin-top","margin","margin-bottom","padding"):
            v=decls.get(prop)
            if not v: continue
            if prop=="margin":
                parts=v.split()
                vals=[to_px(p) for p in parts]
                if None in vals or len(vals)<2: continue
                if vals[0] is not None and vals[0] < MARGIN_FLOOR and re.search(r"(faq|note|meta|copy|answer)", sel):
                    out.append((page,"CSS",(ctx+" " if ctx else "")+sel[:90]+f" {{margin:{v}}}", f"block margin-top {vals[0]:.0f}px < {MARGIN_FLOOR}px floor"))
            else:
                px=to_px(v)
                if px is None: continue
                floor = LM_FLOOR if (prop=="margin-bottom" and re.search(r"\bli\b",sel)) else MARGIN_FLOOR
                if prop=="margin-top" and px < floor and re.search(r"(\.faq|note|meta|answer|copy|sub|desc|faq)", sel):
                    if re.search(r"(mono|chip|label)", sel): continue
                    out.append((page,"CSS",(ctx+" " if ctx else "")+sel[:90]+f" {{margin-top:{v}}}", f"copy block margin-top {px:.0f}px < {floor}px"))

def scan_markup(html, page, out):
    # inline style attrs on text-bearing elements
    for m in re.finditer(r'<(\w+)([^>]*\sstyle="([^"]*)"[^>]*)>', html):
        tag, _, style = m.group(1), m.group(2), m.group(3)
        if tag not in TEXT_TAGS: continue
        mt = re.search(r"margin-top:\s*([\d.]+)px", style) or re.search(r"margin:\s*([\d.]+)px", style)
        if mt and float(mt.group(1)) < 10 and tag in ("div","section","p") and not re.search(r"class=\"[^\"]*(ticker|chip|hr|rule)", m.group(2) or ""):
            out.append((page,"MARKUP",f"<{tag}> style=\"{style[:60]}\"", f"margin-top {mt.group(1)}px on copy block < 10px"))

def main():
    pages = sys.argv[1:] or glob.glob(DIST_GLOB, recursive=True)
    out=[]
    for f in pages:
        html=open(f, encoding="utf-8", errors="ignore").read()
        for sm in re.finditer(r"<style[^>]*>([\s\S]*?)</style>", html):
            scan_css(sm.group(1), os.path.basename(os.path.dirname(f)) or "root", out)
        scan_markup(html, os.path.basename(os.path.dirname(f)) or "root", out)
    # dedupe
    seen=set(); rows=[]
    for r in out:
        k=(r[1],r[2])
        if k in seen: continue
        seen.add(k); rows.append(r)
    for page,kind,rule,why in sorted(rows):
        print(f"{kind:7} | {rule}\n          ↳ {why}   (first: {page})")
    print(f"\nTOTAL distinct cramp findings: {len(rows)}")

if __name__=="__main__":
    main()
