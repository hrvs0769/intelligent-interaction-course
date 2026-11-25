# 智能交互与设计 · 课程网站

这是《制造美学下的产业思维》第一讲《智能交互与设计》的课程网站。

## 在线访问

**https://hrvs0769.github.io/intelligent-interaction-course/**

由 GitHub Pages 托管（仓库 `hrvs0769/intelligent-interaction-course`，分支 `main` 根目录）。
推送到 `main` 后会自动重新构建，通常一分钟内生效。

### 如何更新线上版本

本机网络里 `github.com`（git 推送端点）不可达、`api.github.com` 可达，所以请用仓库自带的
`publish.py` 通过 GitHub API 更新（只上传变化的文件）：

```bash
cd course-site
python3 publish.py "更新案例内容"
```

也可以 `git clone` 该仓库后，在可正常访问 `github.com` 的网络里用 `git push` 更新。
两种方式都会触发 Pages 自动重建（本机已不使用本地 git 仓库，发布统一走 `publish.py`）。

## 本地打开方式

双击 `启动课程.command`（或 `start.command`），浏览器会自动打开 `http://localhost:8080`。
也可以在自己的终端里运行：

```bash
cd course-site
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 讲课快捷键

| 按键 | 功能 |
|---|---|
| 空格 / → | 下一幕 |
| ← | 上一幕 |
| O | 总览 |
| P | 讲师备注 |
| F | 全屏 |
| B | 黑屏（讨论时用） |
| C | 案例库 |
| G | 术语表 |
| / 或 Ctrl/Cmd+K | 打开搜索 / 跳转面板 |
| D | 触发“有点冷”演示 |
| 音效按钮 | 可选，开启后按钮有点击音 |
| 0–9 | 跳到对应场景 |
| Esc | 关闭浮层 |

## 目录

- `index.html` — 课程网站主页面（11 个场景）
- `assets/css/styles.css` — 视觉系统与响应式布局
- `assets/js/data.js` — 44 条案例库、术语、讲师备注
- `assets/js/app.js` — 导航、翻卡、演示、案例库、讲师模式
- `assets/js/three-tower.js` — 场景 6 的 3D 交互五层塔（three.js）
- `assets/js/three-exhibits.js` — 场景 3 的 3D 制造美学爆炸图、场景 7 的 3D 案例走廊
- `assets/img/generated/` — 46 张 AI 生成的教学示意图（43 条案例 + 3 张制造美学透镜），统一"工程纸 × 材料样本"风格
- `assets/img/scenes/` — 17 张场景配图（课程地图 / 六个日常交互 / 四要素 / 产业链 / 作业卡）
- `assets/img/` — 真实产品图与 DUSTGUARD 系统截图（案例详情画廊中保留）
- `assets/img/thumbs/` — SVG 示意图，仅作为生成图缺失时的回退资源
- `assets/video/` — DUSTGUARD 宣传视频（样片，19.6 秒）

## 内容口径

- 父课程：制造美学下的产业思维
- 本讲主标题：智能交互与设计
- 第一次课：90 分钟；软件系统经验约 70%
- 制造美学是顶层，智能交互是支线，产业思维是判断方法
- 案例库首批 44 条，可继续增补
