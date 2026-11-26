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

glossary = [
    {"term": "智能交互", "def": "机器在感知用户、场景和上下文的基础上，推断人的真实意图，并在合适的时机以合适的方式主动响应；人保留关键决策、打断和纠错权。"},
    {"term": "制造美学", "def": "材料、结构、工艺、CMF 等制造能力所构成的产品物质与审美基础；不是表面装饰，而是“美从哪里来”。"},
    {"term": "产业思维", "def": "把设计放进产业链、成本、商业、生命周期里判断：该不该做、能不能做、值不值得做。"},
    {"term": "意图", "def": "用户真正想完成的目标，而不是他说出的字面指令。"},
    {"term": "主动响应", "def": "用户没说全时，机器给出可执行的下一步，并允许打断、确认与纠正。"},
    {"term": "多模态", "def": "语音、文字、图像、手势、传感器等多种输入被统一理解。"},
    {"term": "五步闭环", "def": "感知 → 理解 → 决策 → 响应 → 反馈，构成一次完整交互。"},
    {"term": "交互五层", "def": "物理层、界面层、行为/任务层、系统/数据层、产业/生态层。"},
    {"term": "GUI", "def": "图形用户界面，通过窗口、图标、菜单、指针进行操作。"},
    {"term": "OPC UA / MQTT", "def": "工业设备与系统之间常用的数据交互协议；前者偏工业语义与互操作，后者轻量、适合实时消息。"},
]

notes = {str(sc["id"]): sc["note"] for sc in CONTENT["scenes"]}

course = CONTENT["course"]

with open(OUT, "w", encoding="utf-8") as f:
    f.write("window.COURSE = " + json.dumps(course, ensure_ascii=False, indent=2) + ";\n\n")
    f.write("window.CASES = " + json.dumps(rows, ensure_ascii=False, indent=2) + ";\n\n")
    f.write("window.GLOSSARY = " + json.dumps(glossary, ensure_ascii=False, indent=2) + ";\n\n")
    f.write("window.NOTES = " + json.dumps(notes, ensure_ascii=False, indent=2) + ";\n")

print("wrote", OUT, "cases", len(rows))
