# -*- coding: utf-8 -*-
"""Build course-site/assets/js/data.js from the case CSV."""
import csv, json, os

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
CSV = os.path.join(ROOT, "docs", "智能交互与设计-课程案例库-v1.0.csv")
OUT = os.path.join(BASE, "assets", "js", "data.js")

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
featured = {"C001", "C004", "C005", "C011", "C016", "C017"}

# Theme tags: map each featured case to one of the four interaction elements.
SKILL = {
    "C001": "形态 × 理解",
    "C004": "状态反馈",
    "C005": "感知 × 输入",
    "C011": "意图直达",
    "C016": "代理执行",
    "C017": "反例 · 容错",
}

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

notes = {
    "0": "开场 0–3 分钟。先停在封面，让学生看清标题和“制造美学是根、智能交互是枝、设计是连接两者的语言”。不要急着讲定义。",
    "1": "课程地图 3–8 分钟。用四个概念建立坐标系；强调今天只讲“智能交互”这条支线，但始终放在“制造美学下的产业思维”里。",
    "2": "开场互动 8–15 分钟。六张卡逐一点开，让学生自己说“哪些是操作、哪些是机器在猜”。控制在 7 分钟。",
    "3": "制造美学透镜 15–24 分钟。只讲直接改变交互感受的制造细节：徕卡拨盘的滚花/阻尼、Pura X 铰链的折叠手感、SU7 按键的盲操作。不要展开成材料课。",
    "4": "智能交互定义 24–38 分钟。四要素慢慢讲；四个“不等于”用来纠偏。这里是全课核心，要留时间让学生提问。",
    "5": "“有点冷”演示 38–43 分钟。先让左栏跑一遍关键词模式，再跑右栏意图模式；问学生差别在哪。不要急着给答案。",
    "6": "交互五层/五步闭环 43–57 分钟。强调工业设计通常停在 1–2 层；往上走一层，才能定义完整交互。五步闭环作为分析工具，不要求背。",
    "7": "2022–2026 案例墙 57–75 分钟。课堂只精讲 5 个：Pura X、灵动岛、Vision Pro、Camera Control、努比亚 M153。其余打开案例库让学生课后看。",
    "8": "软件→实体映射 75–83 分钟。用你的软件产品经验讲流程、状态、权限、数据、API、灰度；每一项都对应到实体产品。最后用 DUSTGUARD 收口。",
    "9": "产业思维 83–87 分钟。产业链三层、工业设计位置、微笑曲线。不要把“中游”说成固定事实，要说是“产品定义与开发环节”。",
    "10": "小结 87–90 分钟。三句话、作业、第二次课预告。作业要让学生去“看产品”，不是写论文。",
}

course = {
    "title": "智能交互与设计",
    "parent": "制造美学下的产业思维",
    "subtitle": "从制造美学到智能交互",
    "session": "企业导师课 · 第一讲",
    "duration": "90 分钟 · 2 学时",
}

with open(OUT, "w", encoding="utf-8") as f:
    f.write("window.COURSE = " + json.dumps(course, ensure_ascii=False, indent=2) + ";\n\n")
    f.write("window.CASES = " + json.dumps(rows, ensure_ascii=False, indent=2) + ";\n\n")
    f.write("window.GLOSSARY = " + json.dumps(glossary, ensure_ascii=False, indent=2) + ";\n\n")
    f.write("window.NOTES = " + json.dumps(notes, ensure_ascii=False, indent=2) + ";\n")

print("wrote", OUT, "cases", len(rows))
