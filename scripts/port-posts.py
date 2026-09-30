#!/usr/bin/env python3
"""port-posts: import the 10 canonical live WP posts as port markdown articles."""
import json, re, html as H, os, sys

WP = "/home/opc/work/finance-truth/posts"
ROOT = "/home/opc/work/finance-astro"
ART = f"{ROOT}/src/content/articles"
UP = f"{ROOT}/public/wp-content/uploads"

def inline(s):
    s = re.sub(r'<strong>(.*?)</strong>', r'**\1**', s, flags=re.S)
    s = re.sub(r'<b>(.*?)</b>', r'**\1**', s, flags=re.S)
    s = re.sub(r'<em>(.*?)</em>', r'*\1*', s, flags=re.S)
    s = re.sub(r'<a [^>]*href="([^"]*)"[^>]*>(.*?)</a>', r'[\2](\1)', s, flags=re.S)
    s = re.sub(r'<[^>]+>', '', s)
    return H.unescape(s.strip())

def html_to_md(c):
    c = re.sub(r'<!-- wp:[^>]*-->|<!-- /wp:[^>]*-->', '', c)
    blocks = [b.strip() for b in re.split(r'\n\s*\n', c) if b.strip()]
    out = []
    for b in blocks:
        m = re.match(r'<(h[1-6])[^>]*>(.*?)</\1>', b, re.S)
        if m:
            lvl = int(m.group(1)[1])
            out.append("#" * lvl + " " + inline(m.group(2))); continue
        m = re.match(r'<p[^>]*>(.*?)</p>', b, re.S)
        if m:
            txt = inline(m.group(1))
            if txt: out.append(txt)
            continue
        m = re.match(r'<(ul|ol)[^>]*>(.*?)</\1>', b, re.S)
        if m:
            items = re.findall(r'<li[^>]*>(.*?)</li>', m.group(2), re.S)
            for i, it in enumerate(items, 1):
                pre = "- " if m.group(1) == "ul" else f"{i}. "
                out.append(pre + inline(it).replace("\n", " ").strip())
            continue
        m = re.match(r'<blockquote[^>]*>(.*?)</blockquote>', b, re.S)
        if m:
            inner = re.sub(r'<p[^>]*>(.*?)</p>', r'\1', m.group(1), flags=re.S)
            out.append("> " + inline(inner).replace("\n", " ").strip()); continue
        if "<table" in b or "wp-block-table" in b:
            # keep WP tables as raw HTML (article.css carries .wp-block-table —
            # the figure wrapper is part of the live markup, keep it intact)
            out.append(b.strip()); continue
        m = re.match(r'<hr[^>]*/?>', b)
        if m:
            out.append("---"); continue
        t = inline(b)
        if t: out.append(t)
    return "\n\n".join(out).strip() + "\n"

SLUGS = [
 ("best-nigerian-fintech-apps-full-list", "budgeting"),
 ("risevest-vs-trove", "investing"),
 ("piggyvest-safelock-explained", "savings"),
 ("how-to-send-money-abroad-nigeria-cheaply", "remittance"),
 ("crypto-in-nigeria-whats-legal", "crypto"),
 ("kuda-vs-moniepoint", "banking"),
 ("best-investment-apps-nigerian-beginners", "investing"),
 ("how-to-receive-money-from-abroad-in-nigeria", "remittance"),
 ("piggyvest-vs-cowrywise-which-savings-app-is-better", "savings"),
 ("best-dollar-account-apps-for-nigerians-in-2026", "dollar-accounts"),
]
FEAT = {
 "piggyvest-vs-cowrywise-which-savings-app-is-better": "2026/05/savings.png",
 "how-to-receive-money-from-abroad-in-nigeria": "2026/05/remittance.png",
 "best-dollar-account-apps-for-nigerians-in-2026": "2026/06/dollar.png",
 "best-nigerian-fintech-apps-full-list": "2026/01/savings.png",
 "risevest-vs-trove": "2026/02/investing.png",
 "piggyvest-safelock-explained": "2026/02/savings.png",
 "how-to-send-money-abroad-nigeria-cheaply": "2026/03/remittance.png",
 "crypto-in-nigeria-whats-legal": "2026/03/crypto.png",
 "kuda-vs-moniepoint": "2026/04/banking.png",
 "best-investment-apps-nigerian-beginners": "2026/04/investing.png",
}
BASE = "/finance-astro"
REPLACE = {  # live slug -> port file whose content the canonical version takes over
               # (port slugs stay canonical links: 10+ tool/app pages already point
               # at them — renaming URLs would break shipped links)
 "piggyvest-vs-cowrywise-which-savings-app-is-better": "piggyvest-vs-cowrywise-2026",
 "how-to-receive-money-from-abroad-in-nigeria": "cheapest-way-receive-dollars-nigeria",
 "best-dollar-account-apps-for-nigerians-in-2026": "grey-vs-geegpay-dollar-account",
}
def q(s): return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'

made = []
for slug, cat in SLUGS:
    d = json.load(open(f"{WP}/{slug}.json"))[0]
    title = H.unescape(d["title"]["rendered"]).strip()
    excerpt = re.sub(r'<[^>]+>', '', H.unescape(d["excerpt"]["rendered"])).strip()
    if excerpt.endswith("Read more") or excerpt.endswith("[&hellip;]"):
        excerpt = re.sub(r'\s*(\[?Read more.*|\[&hellip;\].*)$', '', excerpt).strip()
    desc = excerpt if len(excerpt) > 40 else title
    pub = d["date"][:10]
    feat = FEAT[slug]
    stem = feat.rsplit("/", 1)[1][:-4]
    srcset = f"{BASE}/wp-content/uploads/{feat} 1200w, {BASE}/wp-content/uploads/{feat.rsplit('.',1)[0]}-300x169.png 300w, {BASE}/wp-content/uploads/{feat.rsplit('.',1)[0]}-1024x576.png 1024w, {BASE}/wp-content/uploads/{feat.rsplit('.',1)[0]}-768x432.png 768w"
    words = len(re.sub(r"<[^>]+>", " ", d["content"]["rendered"]).split())
    mins = max(2, round(words / 220))
    out_slug = REPLACE.get(slug, slug)
    body = html_to_md(d["content"]["rendered"])
    front = (f"---\ntitle: {q(title)}\ndescription: {q(desc)}\ncategory: {q(cat)}\n"
             f"author: \"G-will Chijioke\"\nauthorSlug: \"gwill-chijioke\"\n"
             f"pubDate: {pub}\nreadMins: {mins}\n"
             f"image: \"{BASE}/wp-content/uploads/{feat}\"\nimageAlt: {q(title)}\n"
             f"imageSrcset: {q(srcset)}\n---\n\n")
    path = f"{ART}/{out_slug}.md"
    open(path, "w").write(front + body)
    made.append((out_slug, slug, os.path.basename(path)))
    print(f"{'REPLACED' if slug in REPLACE else 'ADDED   '} {out_slug:50s} <- {slug} ({mins} min, {words} words)")
# delete the two port-only lookalikes whose content moved under live slugs
for gone in ["ngn-dollar-cost-averaging-guide", "p2p-crypto-nigeria-safely", "kuda-vs-traditional-banks-charges", "emergency-fund-naira-inflation"]:
    p = f"{ART}/{gone}.md"
    if os.path.exists(p):
        print("NOTE keeping port-only article:", gone)
