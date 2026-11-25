# -*- coding: utf-8 -*-
"""Generate schematic thumbnails for cases without a real product image."""
import csv, os, math

BASE = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(os.path.dirname(BASE), "docs", "智能交互与设计-课程案例库-v1.0.csv")
OUT = os.path.join(BASE, "assets", "img", "thumbs")
os.makedirs(OUT, exist_ok=True)

palette = {
    "A": ("#24476B", "#0B1018", "#8FC3E8"),
    "B": ("#E4572E", "#180C08", "#F0A58E"),
    "C": ("#2F7F88", "#071214", "#8DE3F2"),
    "D": ("#6B5BA8", "#0D0A16", "#C9B8FF"),
    "E": ("#4D6A78", "#080E12", "#B7D6DD"),
    "F": ("#A33B34", "#160A09", "#F0A58E"),
}

def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def glasses_motif():
    return '''<path d="M56 112h96c12 0 22 10 22 22v8c0 24-18 42-42 42h-18c-24 0-42-18-42-42v-8c0-12 10-22 22-22z" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <path d="M174 112h96c12 0 22 10 22 22v8c0 24-18 42-42 42h-18c-24 0-42-18-42-42v-8c0-12 10-22 22-22z" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <path d="M174 134h-22M56 134H24M292 134h32" stroke="currentColor" stroke-width="1.8" opacity=".6"/>
    <circle cx="152" cy="175" r="4" fill="#E4572E"/><circle cx="256" cy="175" r="4" fill="#E4572E"/>'''

def motif(cat):

    if cat == "A":
        return '''<rect x="56" y="58" width="92" height="150" rx="16" fill="none" stroke="currentColor" stroke-width="2.4"/>
        <rect x="164" y="58" width="92" height="150" rx="16" fill="none" stroke="currentColor" stroke-width="2.4"/>
        <path d="M156 70v126" stroke="#E4572E" stroke-width="1.6" stroke-dasharray="5 5"/>
        <path d="M112 236h86" stroke="currentColor" stroke-width="1.4" opacity=".5"/>'''
    if cat == "B":
        return '''<rect x="58" y="82" width="210" height="54" rx="27" fill="#05070A" stroke="#E4572E" stroke-width="1.2"/>
        <circle cx="92" cy="109" r="5" fill="#8DE3F2"/><circle cx="118" cy="109" r="5" fill="#E4572E"/><circle cx="144" cy="109" r="5" fill="#F6F2E9" opacity=".8"/>
        <path d="M58 174h210M58 196h140M58 218h180" stroke="currentColor" stroke-width="1.5" opacity=".45"/>'''
    if cat == "C":
        return '''<rect x="104" y="58" width="104" height="170" rx="18" fill="none" stroke="currentColor" stroke-width="2.2"/>
        <circle cx="156" cy="143" r="95" fill="none" stroke="#E4572E" stroke-width="1.2" opacity=".75"/>
        <circle cx="156" cy="143" r="66" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55"/>
        <circle cx="156" cy="143" r="9" fill="#E4572E"/>'''
    if cat == "D":
        return '''<rect x="64" y="70" width="190" height="128" rx="18" fill="none" stroke="currentColor" stroke-width="2.2"/>
        <path d="M96 112h84M96 138h126M96 164h64" stroke="currentColor" stroke-width="1.6" opacity=".55"/>
        <path d="M252 166l22 22-22 22-22-22z" fill="none" stroke="#E4572E" stroke-width="1.8"/>
        <circle cx="252" cy="188" r="4" fill="#E4572E"/>'''
    if cat == "E":
        return '''<path d="M66 92h82v78H66zM164 92h82v78h-82zM262 92h82v78h-82z" fill="none" stroke="currentColor" stroke-width="1.8"/>
        <path d="M148 130h16M246 130h16M66 214h278" stroke="#E4572E" stroke-width="1.4" stroke-dasharray="4 5"/>
        <circle cx="107" cy="131" r="8" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="205" cy="131" r="8" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="303" cy="131" r="8" fill="none" stroke="currentColor" stroke-width="1.2"/>'''
    return '''<path d="M150 56l112 194H38z" fill="none" stroke="currentColor" stroke-width="2.2"/>
    <path d="M150 96v82" stroke="#E4572E" stroke-width="9" stroke-linecap="round"/>
    <circle cx="150" cy="216" r="7" fill="#E4572E"/>'''

rows = []
with open(CSV, encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        rows.append(r)

for r in rows:
    cid = r["id"]
    cat = r["类别"][0]
    dark, bg2, accent = palette.get(cat, ("#24476B", "#0B1018", "#8DE3F2"))
    no = esc(cid)
    year = esc(r["年份"])
    catlabel = esc(r["类别"])
    name = esc(r["名称"])
    # keep SVG text short; full name is on the card
    short = name if len(name) <= 16 else name[:16] + "…"
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{dark}" stop-opacity=".92"/>
    <stop offset="1" stop-color="{bg2}"/>
  </linearGradient>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="1"/>
  </pattern>
</defs>
<rect width="640" height="360" fill="url(#bg)"/>
<rect width="640" height="360" fill="url(#grid)" opacity=".8"/>
<rect x="20" y="20" width="600" height="320" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="1"/>
<text x="38" y="48" font-family="Menlo, monospace" font-size="11" letter-spacing="2" fill="{accent}">{no} / CASE</text>
<text x="38" y="68" font-family="Menlo, monospace" font-size="9" letter-spacing="1" fill="rgba(255,255,255,.52)">{year} · {catlabel}</text>
<g transform="translate(245,55)">{(glasses_motif() if cid in ("C007","C009") else motif(cat)).replace("currentColor", accent)}</g>
<text x="600" y="315" text-anchor="end" font-family="Arial Black, Arial, sans-serif" font-size="168" font-weight="900" fill="rgba(255,255,255,.10)">{cat}</text>
<text x="40" y="315" font-family="Menlo, monospace" font-size="10" letter-spacing="1.5" fill="{accent}">SCHEMATIC / CASE LIBRARY</text>
<circle cx="590" cy="44" r="4" fill="#E4572E"/>
</svg>'''
    with open(os.path.join(OUT, cid + ".svg"), "w", encoding="utf-8") as f:
        f.write(svg)

print("generated", len(rows), "thumbs")
