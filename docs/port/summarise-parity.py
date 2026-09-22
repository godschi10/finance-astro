#!/usr/bin/env python3
"""Summarise footer-parity.sh output into a compact table, and compare the
port against the numbers harvested from the live WordPress footer."""
import json
import re
import subprocess
import sys

WP = {  # harvested from finance.fitnesslova.qzz.io (theme 1.13.39)
    1280: {"footerH": 437, "ftopW": 1184, "ftopH": 312, "grid": "435.188px 217.609px 217.594px 217.609px",
           "brandW": 320, "ffollowH": 140, "fpush": "234x40", "gnews": "203x40", "fbotH": 37, "soci": "34x34"},
    768: {"footerH": 647, "ftopW": 712, "ftopH": 506, "grid": "340px 340px",
          "brandW": 320, "ffollowH": 140, "fpush": "234x40", "gnews": "203x40", "fbotH": 65, "soci": "34x34"},
}

out = subprocess.run(["bash", "/home/opc/.hermes/cache/scratch/footer-parity.sh"],
                     capture_output=True, text=True).stdout

blobs = []
for m in re.finditer(r'"(\{\\n[\s\S]*?\\n\})"', out):
    raw = json.loads('"' + m.group(1) + '"') if False else m.group(1)
    try:
        blobs.append(json.loads(raw.replace('\\"', '"').replace("\\n", "\n")))
    except Exception as e:
        print("parse skip:", e)

if not blobs:
    print("no measurements parsed; raw tail:")
    print(out[-1500:])
    sys.exit(1)

print(f"{'viewport':>9} {'footerH':>8} {'ftopW':>7} {'ftopH':>7} {'brandW':>7} {'ffollowH':>9} {'fpush':>9} {'gnews':>8} {'fbotH':>6} {'soci':>7} {'over':>5} {'soci#':>6} {'fl#':>4} {'adDisp':>7}")
for b in blobs:
    vw = b["vw"]
    f = b["desktopFooter"] if vw >= 768 else b["mobileFooter"]
    ftop = b["ftop"]; brand = b["brandCol"]; ff = b["ffollow"]; fp = b["fpush"]; gn = b["gnews"]
    fbot = b["fbot"]; soci = b["soci"]
    print(f"{vw:>9} {f['h']:>8} {ftop['w']:>7} {ftop['h']:>7} {brand['w']:>7} {ff['h']:>9} "
          f"{str(fp['w']) + 'x' + str(fp['h']):>9} {str(gn['w']) + 'x' + str(gn['h']):>8} {fbot['h']:>6} "
          f"{str(soci['w']) + 'x' + str(soci['h']):>7} {b['over']:>5} {b['sociCount']:>6} {b['flCount']:>4} {b['adDisplay']:>7}")

print("\n--- port vs live WP (desktop viewports) ---")
for b in blobs:
    vw = b["vw"]
    if vw not in WP:
        print(f"{vw}px: (no WP baseline harvested for the mobile footer yet)")
        continue
    wp = WP[vw]
    rows = [
        ("footer height", b["desktopFooter"]["h"], wp["footerH"]),
        (".ftop width", b["ftop"]["w"], wp["ftopW"]),
        (".ftop height", b["ftop"]["h"], wp["ftopH"]),
        (".ftop grid", b["ftop"]["grid"], wp["grid"]),
        (".fcol--brand width", b["brandCol"]["w"], wp["brandW"]),
        (".ffollow height", b["ffollow"]["h"], wp["ffollowH"]),
        (".fpush size", f"{b['fpush']['w']}x{b['fpush']['h']}", wp["fpush"]),
        (".fgooglenews size", f"{b['gnews']['w']}x{b['gnews']['h']}", wp["gnews"]),
        (".fbot height", b["fbot"]["h"], wp["fbotH"]),
        (".soci size", f"{b['soci']['w']}x{b['soci']['h']}", wp["soci"]),
    ]
    print(f"\n@ {vw}px")
    for name, mine, theirs in rows:
        mark = "OK  " if str(mine) == str(theirs) else "DIFF"
        print(f"  {mark} {name:<20} port={mine:<42} wp={theirs}")
