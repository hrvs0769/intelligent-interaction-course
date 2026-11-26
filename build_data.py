# -*- coding: utf-8 -*-
"""Build course-site/assets/js/data.js from the case CSV."""
import csv, json, os

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
CSV = os.path.join(ROOT, "docs", "智能交互与设计-课程案例库-v1.0.csv")
OUT = os.path.join(BASE, "assets", "js", "data.js")
CONTENT = json.load(open(os.path.join(BASE, "content.json"), encoding="utf-8"))

rows = []
with open(CSV, encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        rows.append({
            "id": r["id"],
            "name": r["名称"],
            "year": r["年份"],
            "category": r["类别"],
            "type": r["交互类型"],
            "innovation": r["交互创新"],
            "teaching": r["教学点"],
            "manufacturing": r["制造基础"],
            "industry": r["产业位置"],
            "source": ("本地项目资料（授课者提供）"
                       if (r["来源"].startswith(("/", "~")) or "/Users/" in r["来源"])
                       else r["来源"]),
            "use": r["使用建议"],
            "imageNote": r["图片建议"],
        })

# Every case now has a bespoke, style-consistent AI-generated teaching illustration.
# DUSTGUARD keeps real system screenshots (an AI render of software would mislead).
generated = {r["id"]: "assets/img/generated/" + r["id"] + ".jpg"
             for r in rows if r["id"] != "C040"}
images = dict(generated)
images["C040"] = "assets/img/dustguard-duty.jpg"

# Real product / system screenshots stay in the detail gallery for reference.
galleries = {
    "C001": ["assets/img/purax-2.jpg", "assets/img/purax-1.jpg", "assets/img/purax-3.jpg"],
    "C002": ["assets/img/matexts.jpg"],
    "C005": ["assets/img/vision-pro.jpg"],
    "C008": ["assets/img/quark.jpg"],
    "C040": [
        "assets/img/dustguard-duty.jpg",
        "assets/img/dustguard-mobile.jpg",
        "assets/img/dustguard-boss.jpg",
        "assets/img/dustguard-pitch-04.jpg",
        "assets/img/dustguard-pitch-01.jpg",
    ],
}
featured = {f["id"] for f in CONTENT["featured"]}
SKILL = {f["id"]: f["skill"] for f in CONTENT["featured"]}
USAGE = {f["id"]: f["usage"] for f in CONTENT["featured"]}

for r in rows:
    main = images.get(r["id"], "")
    # Fall back to the schematic SVG only if a generated file is missing.
    if main.startswith("assets/img/generated/") and not os.path.exists(os.path.join(BASE, main)):
        main = "assets/img/thumbs/" + r["id"] + ".svg"
    r["image"] = main
    r["thumb"] = main
    r["aiImage"] = r["id"] != "C040"
    r["featured"] = r["id"] in featured
    r["skill"] = SKILL.get(r["id"], "")
    r["usage"] = USAGE.get(r["id"], "")
    r["gallery"] = galleries.get(r["id"], [])
    r["video"] = "assets/video/dustguard-promo.mp4" if r["id"] == "C040" else ""

glossary = CONTENT["glossary"]


notes = {str(sc["id"]): sc["note"] for sc in CONTENT["scenes"]}

course = CONTENT["course"]

with open(OUT, "w", encoding="utf-8") as f:
    f.write("window.COURSE = " + json.dumps(course, ensure_ascii=False, indent=2) + ";\n\n")
    f.write("window.CASES = " + json.dumps(rows, ensure_ascii=False, indent=2) + ";\n\n")
    f.write("window.GLOSSARY = " + json.dumps(glossary, ensure_ascii=False, indent=2) + ";\n\n")
    f.write("window.NOTES = " + json.dumps(notes, ensure_ascii=False, indent=2) + ";\n")

print("wrote", OUT, "cases", len(rows))
