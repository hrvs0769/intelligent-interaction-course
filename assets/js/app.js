/* ============================================================
   《智能交互与设计》课程网站 · app.js
   Zero dependencies / vanilla JS
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));

  const scenes = $$(".scene");
  const state = {
    index: 0,
    flipCount: 0,
    libraryFilter: "all",
    libraryQuery: "",
    featuredFilter: "all",
    demoTimer: [],
    activeCaseId: "",
    timerStart: Date.now()
  };

  const LAYERS = [
    { title: "物理层", body: "<strong>物理层：</strong>形态、材料、按键、触感、声光反馈。用户摸得到的东西。例：徕卡拨盘、SU7 物理按键。" },
    { title: "界面层", body: "<strong>界面层：</strong>屏幕、语音、手势、视觉与听觉反馈。用户看得见、说得出的部分。例：灵动岛、Vision Pro 的空间界面。" },
    { title: "行为 / 任务层", body: "<strong>行为 / 任务层：</strong>用户目标、操作流程、状态转换、出错处理、权限。用户办不办得成，靠这一层。例：DUSTGUARD 的告警接警→处置→闭环。" },
    { title: "系统 / 数据层", body: "<strong>系统 / 数据层：</strong>设备接口、数据流、算法、后台服务、跨设备协同。机器接不接得住。例：OPC UA、MQTT、云端数据服务。" },
    { title: "产业 / 生态层", body: "<strong>产业 / 生态层：</strong>标准、供应链、平台、商业模式、合规。产业转不转得动。例：Matter 协议、工业互联网平台、汽车生态。" }
  ];

  const LOOP = [
    "<b>感知：</b>麦克风、摄像头、传感器先拿到信号；这一步失败，用户的表现是“喊三次没反应”。",
    "<b>理解：</b>结合上下文、对象、历史与场景判断真实意图；这一步失败，用户会觉得“答非所问”。",
    "<b>决策：</b>决定做什么、做到什么程度、要不要确认；这一步失败，会出现“擅自下单、越权操作”。",
    "<b>响应：</b>用语音、界面、动作或灯光回话；这一步失败，用户会觉得“做完了却没说”。",
    "<b>反馈：</b>用户纠正，信息回到理解环节；这一步失败，用户会觉得“错了改不回来”。"
  ];

  const LENS = {
    leica: {
      look: "金属的冷峻、滚花的咬合、机身的重量——它先是一件“被制造出来的物件”。",
      make: "铝合金／黄铜机身、CNC 加工、阳极氧化、蒙皮。滚花的齿距、倒角、表面处理，决定了它“摸起来贵不贵”。",
      interact: "滚花让手指有抓力，阻尼让转动有节奏，快门回弹和声音让拍摄有仪式感。制造细节直接变成了交互质感。"
    },
    purax: {
      look: "16:10 的阔型比例，让“折叠”不只是变小，而是换一种使用姿态。",
      make: "铰链结构、柔性屏、超薄玻璃、应力缓冲层。折痕深浅、阻尼、寿命，都是结构方案决定的。",
      interact: "外屏 1:1 处理快任务，内屏 16:10 看内容；展开那一下的阻尼，决定了“折叠”是不是一个让人愿意反复做的动作。"
    },
    su7: {
      look: "在全是屏幕的座舱里，保留一排可以盲操作的物理按键。",
      make: "按键的行程、阻尼、材质和排布，决定了手指能不能不看屏幕找到它。",
      interact: "温度和风量可以盲操作，不占用驾驶注意力；物理按键不是“反科技”，是把安全关键场景留给触觉。"
    }
  };

  /* ---------- navigation ---------- */
  function goTo(index, smooth = true) {
    index = Math.max(0, Math.min(scenes.length - 1, index));
    state.index = index;
    const top = scenes[index].offsetTop;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
    updateChrome();
  }

  function updateChrome() {
    scenes.forEach((s, i) => s.classList.toggle("is-current", i === state.index));
    const scene = scenes[state.index];
    const dark = scene && scene.dataset.theme === "dark";
    $("#topbar").classList.toggle("on-dark", dark);
    $("#hud").classList.toggle("on-dark", dark);
    $("#topbar").classList.toggle("is-scrolled", window.scrollY > 30);
    const chapter = String(state.index).padStart(2, "0") + " / " + (scene?.dataset.title || "");
    $("#hudChapter").textContent = chapter;
    $("#hudTitle").textContent = (window.COURSE && window.COURSE.title) || "智能交互与设计";
    const pct = scenes.length > 1 ? (state.index / (scenes.length - 1)) * 100 : 0;
    $("#progressFill").style.width = pct + "%";
    updateNotes();
    window.dispatchEvent(new CustomEvent("course:scene", {
      detail: { index: state.index, dark: !!dark }
    }));
  }

  function onScroll() {
    const y = window.scrollY + window.innerHeight * 0.38;
    let idx = 0;
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].offsetTop <= y) idx = i;
    }
    if (idx !== state.index) {
      state.index = idx;
      updateChrome();
    } else {
      $("#topbar").classList.toggle("is-scrolled", window.scrollY > 30);
    }
  }

  /* ---------- reveal ---------- */
  function initReveal() {
    const els = $$("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(el => io.observe(el));
  }

  /* ---------- flip cards ---------- */
  function initFlipCards() {
    $$(".flip-card").forEach((card) => {
      card.addEventListener("click", () => {
        card.classList.toggle("is-flipped");
        state.flipCount = $$(".flip-card.is-flipped").length;
        $("#flipCounter").textContent = "已翻 " + state.flipCount + " / 6";
      });
    });
  }

  /* ---------- lens tabs ---------- */
  function initLens() {
    $$(".lens-card").forEach((card) => {
      const key = card.dataset.lensCard;
      const copy = $(".lens-copy", card);
      $$(".lens-tab", card).forEach((tab) => {
        tab.addEventListener("click", () => {
          $$(".lens-tab", card).forEach(t => t.classList.remove("is-active"));
          tab.classList.add("is-active");
          const val = LENS[key] && LENS[key][tab.dataset.tab];
          if (val) copy.textContent = val;
        });
      });
    });
  }

  /* ---------- demo ---------- */
  function clearDemoTimers() {
    state.demoTimer.forEach(t => clearTimeout(t));
    state.demoTimer = [];
  }

  function addLog(container, tag, text, cls = "", delay = 0) {
    const t = setTimeout(() => {
      const div = document.createElement("div");
      div.className = "demo-line " + cls;
      div.innerHTML = '<span class="tag">' + esc(tag) + '</span><span class="txt">' + esc(text) + '</span>';
      container.appendChild(div);
      requestAnimationFrame(() => div.classList.add("is-in"));
    }, delay);
    state.demoTimer.push(t);
  }

  function runDemo() {
    clearDemoTimers();
    const leftText = $("#demoLeftText");
    const rightText = $("#demoRightText");
    const leftLog = $("#demoLeftLog");
    const rightLog = $("#demoRightLog");
    leftText.textContent = "等待输入…";
    rightText.textContent = "等待输入…";
    leftLog.innerHTML = "";
    rightLog.innerHTML = "";
    leftText.textContent = "“有点冷”";
    rightText.textContent = "“有点冷”";
    addLog(leftLog, "USER", "用户说了：“有点冷”", "", 150);
    addLog(leftLog, "SYS", "未匹配到固定指令", "error", 650);
    addLog(leftLog, "SYS", "请说：“打开空调”或“调高温度”", "error", 1100);
    addLog(rightLog, "SENSOR", "场景：卧室 · 18°C · 夜间模式", "", 250);
    addLog(rightLog, "INTENT", "意图：用户觉得冷，希望升温", "good", 750);
    addLog(rightLog, "ACTION", "调高 2°C；询问是否关窗", "good", 1250);
    addLog(rightLog, "STATE", "等待用户确认，可打断、可纠正", "good", 1750);
    showToast("演示：同一句话，两种系统");
  }

  function resetDemo() {
    clearDemoTimers();
    $("#demoLeftText").textContent = "等待输入…";
    $("#demoRightText").textContent = "等待输入…";
    $("#demoLeftLog").innerHTML = '<div class="demo-line"><span class="tag">SYS</span><span class="txt">系统只认固定指令。请说：“打开空调”或“调高温度”。</span></div>';
    $("#demoRightLog").innerHTML = '<div class="demo-line"><span class="tag">SYS</span><span class="txt">已读取场景：卧室 · 18°C · 夜间模式</span></div>';
  }

  /* ---------- layers / loop ---------- */
  function initLayers() {
    const items = $$(".layer");
    items.forEach((btn) => {
      btn.addEventListener("click", () => {
        items.forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const d = LAYERS[Number(btn.dataset.layer)];
        if (d) $("#layerDetail").innerHTML = d.body;
      });
    });
    const loopNodes = $$(".loop-node");
    loopNodes.forEach((node) => {
      node.addEventListener("click", () => {
        loopNodes.forEach(n => n.classList.remove("is-active"));
        node.classList.add("is-active");
        const i = Number(node.dataset.step);
        if (LOOP[i]) $("#loopDetail").innerHTML = LOOP[i];
      });
    });
  }

  /* ---------- cases ---------- */
  const ART = {
    C004: '<div class="art-island"><span class="pill"><i></i><i></i><i></i></span><span class="label">LIVE ACTIVITY</span></div>',
    C011: '<div class="art-tap"><span class="phone"></span><span class="ring"></span><span class="ring two"></span><span class="label">TAP / NFC</span></div>',
    C016: '<div class="art-agent"><span class="screen">AI</span><span class="cursor"></span><span class="label">GUI AGENT</span></div>',
    C017: '<div class="art-button"><span class="key"></span><span class="label">CAMERA CONTROL</span></div>'
  };

  function caseArt(c) {
    if (c.image) {
      return '<img src="' + esc(c.image) + '" alt="' + esc(c.name) + '" loading="lazy">';
    }
    if (ART[c.id]) return ART[c.id];
    if (c.thumb) return '<img src="' + esc(c.thumb) + '" alt="' + esc(c.name) + '" loading="lazy">';
    return '<div class="pattern"></div>';
  }

  function featuredCard(c) {
    return '<button class="case-card" type="button" data-case="' + esc(c.id) + '">' +
      '<div class="case-art">' + caseArt(c) +
      '<div class="meta"><span class="year">' + esc(c.year) + '</span><span class="cat">' + esc(c.category.split(" ")[0]) + '</span></div></div>' +
      '<div class="body"><h4>' + esc(c.name) + '</h4><p>' + esc(c.teaching) + '</p>' +
      (c.skill ? '<div class="case-skill">' + esc(c.skill) + '</div>' : '') +
      '<div class="open">OPEN CASE →</div></div>' +
      '</button>';
  }

  function renderFeatured(filter = "all") {
    const grid = $("#featuredGrid");
    let list = window.CASES.filter(c => c.featured);
    if (filter !== "all") {
      const prefix = filter.split(" ")[0];
      list = list.filter(c => c.category.startsWith(prefix));
    }
    grid.innerHTML = list.map(featuredCard).join("");
  }

  function renderLibrary() {
    const grid = $("#libraryGrid");
    const q = state.libraryQuery.trim().toLowerCase();
    let list = window.CASES;
    if (state.libraryFilter !== "all") {
      const prefix = state.libraryFilter.split(" ")[0];
      list = list.filter(c => c.category.startsWith(prefix));
    }
    if (q) {
      list = list.filter(c => [c.name, c.year, c.category, c.type, c.innovation, c.teaching, c.industry].join(" ").toLowerCase().includes(q));
    }
    $("#libraryCount").textContent = list.length + " / " + window.CASES.length;
    grid.innerHTML = list.map(c => {
      const art = c.image || c.thumb;
      const artHtml = art
        ? '<span class="lib-art"><img src="' + esc(art) + '" alt="' + esc(c.name) + '" loading="lazy"></span>'
        : '<span class="lib-art"><span class="pattern"></span></span>';
      return '<button class="lib-card" type="button" data-case="' + esc(c.id) + '">' +
        artHtml +
        '<div class="meta"><span class="year">' + esc(c.year) + '</span><span class="cat">' + esc(c.category.split(" ")[0]) + '</span></div>' +
        '<h4>' + esc(c.name) + '</h4><p>' + esc(c.teaching) + '</p><div class="open">OPEN CASE →</div></button>';
    }).join("");
  }

  function promptsFor(c) {
    const cat = (c.category || "").charAt(0);
    if (cat === "F") {
      return ["它为什么会失败或产生争议？", "如果让你重做，你会删掉哪个功能或哪一步？", "它有没有一个可以被保留的好点子？"];
    }
    if (cat === "D") {
      return ["它把哪些步骤交给了机器？", "人保留了什么控制权？", "如果机器做错了，用户怎么发现、怎么改回来？"];
    }
    if (cat === "A") {
      return ["形态变了以后，哪些交互可以重做一遍？", "它改变了用户的哪种使用姿态？", "这个形态在制造上靠什么成立？"];
    }
    if (cat === "B") {
      return ["它把哪个隐藏状态变成了可见反馈？", "这个反馈在什么情况下会误导用户？", "它改变了用户对产品的哪一点信任？"];
    }
    if (cat === "C") {
      return ["它省掉了哪一步？", "省掉的这一步原来在防止什么问题？", "如果用户不熟悉这个动作，怎么被发现？"];
    }
    return ["它改变了产业链的哪一环？", "它解决了现场什么真实问题？", "它为什么不是一张普通的报表？"];
  }

  function relatedFor(c) {
    const cat = (c.category || "").charAt(0);
    return window.CASES.filter(x => x.id !== c.id && (x.category || "").charAt(0) === cat).slice(0, 3);
  }

  function openCase(id) {
    const c = window.CASES.find(x => x.id === id);
    if (!c) return;
    state.activeCaseId = id;
    const idx = window.CASES.findIndex(x => x.id === id);
    const d = (window.CASE_DETAILS || {})[id] || {};
    const mediaSrc = c.image || c.thumb || "";
    const rawSource = c.source || "公开资料（待补）";
    const source = /^https?:/.test(rawSource)
      ? '<a href="' + esc(rawSource) + '" target="_blank" rel="noopener">' + esc(rawSource) + '</a>'
      : (/^(\/|~)/.test(rawSource) || rawSource.includes("/Users/")
          ? "本地项目资料（授课者提供）"
          : esc(rawSource));
    const media = c.video
      ? '<video src="' + esc(c.video) + '" controls autoplay muted loop playsinline preload="metadata" poster="' + esc(mediaSrc) + '"></video>'
      : (mediaSrc
        ? '<img src="' + esc(mediaSrc) + '" alt="' + esc(c.name) + '">'
        : '<div class="case-placeholder"></div>');
    const discuss = (d.discuss && d.discuss.length ? d.discuss : promptsFor(c))
      .map(p => '<li>' + esc(p) + '</li>').join("");
    const related = relatedFor(c).map(x =>
      '<button type="button" class="case-related-btn" data-case="' + esc(x.id) + '"><span>' + esc(x.name) + '</span><em>' + esc(x.year) + '</em></button>'
    ).join("") || '<div class="case-muted">暂无同类别案例</div>';
    const gallery = (c.gallery && c.gallery.length)
      ? '<div class="case-filmstrip">' + c.gallery.map(src => '<img src="' + esc(src) + '" alt="">').join("") + '</div>'
      : '';
    const tags = [
      ['年份', c.year], ['类别', c.category], ['交互类型', c.type], ['产业', c.industry], ['课堂用法', c.use]
    ].map(([k, v]) => '<span class="case-tag"><i>' + esc(k) + '</i>' + esc(v) + '</span>').join("");

    // Substantive content the lecturer can actually talk through.
    const lead = d.lead || c.teaching;
    const howSteps = (d.how || []).map((step, i) =>
      '<li class="how-step"><span class="how-no">' + String(i + 1).padStart(2, "0") + '</span>' +
      '<span class="how-text">' + esc(step) + '</span></li>').join("");
    const designCards = (d.design || []).map((item, i) =>
      '<div class="design-card"><span class="design-no">0' + (i + 1) + '</span>' +
      '<p>' + esc(item) + '</p></div>').join("");

    $("#caseSheet").innerHTML =
      '<div class="case-hero' + (c.video ? ' is-video' : '') + '">' +
        '<div class="case-hero__media">' + media + '</div>' +
        '<div class="case-hero__shade"></div>' +
        '<div class="case-hero__copy">' +
          '<div class="case-hero__eyebrow">CASE / ' + esc(c.id) + ' / ' + esc(c.year) + '</div>' +
          '<h1 class="' + (c.name.length > 14 ? 'long' : '') + '">' + esc(c.name) + '</h1>' +
          '<p>' + esc(lead) + '</p>' +
          '<div class="case-hero__tags">' + tags + '</div>' +
        '</div>' +
        '<div class="case-hero__index">' + String(idx + 1).padStart(2, "0") + '</div>' +
      '</div>' +
      gallery +
      '<div class="case-body">' +
        '<div class="case-main">' +
          (d.background
            ? '<section class="case-section"><div class="case-label">背景与场景 / CONTEXT</div><p class="case-para">' + esc(d.background) + '</p></section>'
            : '') +
          (howSteps
            ? '<section class="case-section"><div class="case-label">交互怎么发生 / HOW IT WORKS</div><ol class="how-list">' + howSteps + '</ol></section>'
            : '') +
          (designCards
            ? '<section class="case-section"><div class="case-label">设计要点 / DESIGN DECISIONS</div><div class="design-grid">' + designCards + '</div></section>'
            : '') +
          (d.detail
            ? '<section class="case-section case-highlight"><div class="case-label">值得展开讲的一个细节 / UNPACK THIS</div><p class="case-para">' + esc(d.detail) + '</p></section>'
            : '') +
          (d.framework
            ? '<section class="case-section case-framework"><div class="case-label">放回主题：智能交互与设计 / BACK TO THEME</div><p class="case-para case-para--small">' + esc(d.framework) + '</p></section>'
            : '') +
          '<div class="case-two-col">' +
            (d.boundary
              ? '<section class="case-section"><div class="case-label">局限与争议 / LIMITS</div><p class="case-para case-para--small">' + esc(d.boundary) + '</p></section>'
              : '') +
          '</div>' +
        '</div>' +
        '<aside class="case-aside">' +
          '<div class="case-side"><div class="case-label">可以怎么问学生 / IN CLASS</div><ul class="case-prompts">' + discuss + '</ul></div>' +
          '<div class="case-side"><div class="case-label">一句话概括 / IN ONE LINE</div><div class="case-source">' + esc(c.innovation) + '</div></div>' +
          '<div class="case-side"><div class="case-label">案例标签 / TAGS</div><div class="case-tag-list">' + tags + '</div></div>' +
          '<div class="case-side"><div class="case-label">来源 / SOURCE</div><div class="case-source">' + source + '</div></div>' +
          (c.aiImage
            ? '<div class="case-side"><div class="case-label">配图说明</div><div class="case-source">配图为 AI 生成的教学示意图，用于呈现交互类型，并非产品实拍。部分案例另附真实产品／系统截图。</div></div>'
            : '') +
          '<div class="case-side"><div class="case-label">同类案例 / RELATED</div><div class="case-related">' + related + '</div></div>' +
        '</aside>' +
      '</div>';
    $("#caseCounter").textContent = String(idx + 1).padStart(2, "0") + " / " + String(window.CASES.length);
    $("#caseModal").classList.add("is-open");
    document.body.classList.add("is-locked");
    $("#caseSheet").scrollTop = 0;
    $$(".case-filmstrip img", $("#caseSheet")).forEach(img => {
      img.addEventListener("click", () => {
        const heroMedia = $(".case-hero__media", $("#caseSheet"));
        if (heroMedia) heroMedia.innerHTML = '<img src="' + img.src + '" alt="">';
      });
    });
  }

  function navigateCase(delta) {
    if (!window.CASES.length) return;
    const i = Math.max(0, window.CASES.findIndex(x => x.id === state.activeCaseId));
    const next = (i + delta + window.CASES.length) % window.CASES.length;
    openCase(window.CASES[next].id);
  }

  function closeCase() {
    $("#caseModal").classList.remove("is-open");
    if (!$("#libraryOverlay").classList.contains("is-open") && !$("#glossaryOverlay").classList.contains("is-open") && !$("#overviewOverlay").classList.contains("is-open")) {
      document.body.classList.remove("is-locked");
    }
  }

  /* ---------- glossary / overview ---------- */
  function renderGlossary() {
    $("#glossaryList").innerHTML = window.GLOSSARY.map(g =>
      '<div class="glossary-item"><h3>' + esc(g.term) + '</h3><p>' + esc(g.def) + '</p></div>'
    ).join("");
  }

  function renderOverview() {
    $("#overviewGrid").innerHTML = scenes.map((s, i) =>
      '<button class="ov-card" type="button" data-scene-jump="' + i + '"><div class="n">' + String(i).padStart(2, "0") + '</div><h3>' + esc(s.dataset.title || "") + '</h3><p>' + (i === 0 ? "封面 / 课程标题" : "点击跳转") + '</p></button>'
    ).join("");
  }

  /* ---------- notes ---------- */
  function updateNotes() {
    const note = window.NOTES && window.NOTES[String(state.index)];
    $("#notesScene").textContent = "SCENE " + String(state.index).padStart(2, "0") + " / " + (scenes[state.index]?.dataset.title || "");
    $("#notesText").textContent = note || "暂无备注。";
  }

  function toggleNotes(force) {
    const drawer = $("#notesDrawer");
    const open = typeof force === "boolean" ? force : !drawer.classList.contains("is-open");
    drawer.classList.toggle("is-open", open);
    document.body.classList.toggle("is-locked", open);
  }

  /* ---------- overlays ---------- */
  function openOverlay(id) {
    closeAllOverlays(false);
    const el = $(id);
    if (!el) return;
    el.classList.add("is-open");
    document.body.classList.add("is-locked");
    if (id === "#libraryOverlay") renderLibrary();
    if (id === "#glossaryOverlay") renderGlossary();
    if (id === "#overviewOverlay") renderOverview();
  }

  function closeAllOverlays(unlock = true) {
    ["#libraryOverlay", "#glossaryOverlay", "#overviewOverlay"].forEach(id => $(id).classList.remove("is-open"));
    $("#caseModal").classList.remove("is-open");
    $("#notesDrawer").classList.remove("is-open");
    if (unlock) document.body.classList.remove("is-locked");
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function showToast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-show"), 2200);
  }

  /* ---------- blackout ---------- */
  function toggleBlackout(force) {
    const b = $("#blackout");
    const open = typeof force === "boolean" ? force : !b.classList.contains("is-open");
    b.classList.toggle("is-open", open);
    if (open) updateBlackoutClock();
  }

  function updateBlackoutClock() {
    const d = new Date();
    $("#blackoutClock").textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  setInterval(() => {
    if ($("#blackout").classList.contains("is-open")) updateBlackoutClock();
  }, 1000);

  /* ---------- fullscreen ---------- */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  /* ---------- events ---------- */
  function bind() {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateChrome);

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-case-prev]")) { navigateCase(-1); return; }
      if (e.target.closest("[data-case-next]")) { navigateCase(1); return; }
      const action = e.target.closest("[data-action]");
      if (action) {
        const a = action.dataset.action;
        if (a === "library") openOverlay("#libraryOverlay");
        if (a === "glossary") openOverlay("#glossaryOverlay");
        if (a === "overview") openOverlay("#overviewOverlay");
        if (a === "notes") toggleNotes();
        if (a === "notes-close") toggleNotes(false);
        if (a === "fullscreen") toggleFullscreen();
        if (a === "start") goTo(1);
        if (a === "ambient") {
          const off = document.body.classList.toggle("no-ambient");
          showToast(off ? "3D 氛围已关闭" : "3D 氛围已开启");
        }
        if (a === "tower") window.open3D && window.open3D("tower");
        if (a === "explode") window.open3D && window.open3D("explode");
        if (a === "corridor") window.open3D && window.open3D("corridor");
        if (a === "close") closeAllOverlays();
        if (a === "case-close") closeCase();
        return;
      }
      const caseBtn = e.target.closest("[data-case]");
      if (caseBtn) { openCase(caseBtn.dataset.case); return; }
      const jump = e.target.closest("[data-scene-jump]");
      if (jump) { goTo(Number(jump.dataset.sceneJump)); closeAllOverlays(); return; }
    });

    // case filters
    $("#caseFilters").addEventListener("click", (e) => {
      const b = e.target.closest(".filter");
      if (!b) return;
      $$("#caseFilters .filter").forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
      state.featuredFilter = b.dataset.filter;
      renderFeatured(state.featuredFilter);
    });

    // library filters
    $("#libraryFilters").addEventListener("click", (e) => {
      const b = e.target.closest(".filter");
      if (!b) return;
      $$("#libraryFilters .filter").forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
      state.libraryFilter = b.dataset.filter;
      renderLibrary();
    });
    $("#librarySearch").addEventListener("input", (e) => {
      state.libraryQuery = e.target.value;
      renderLibrary();
    });

    $("#runDemo").addEventListener("click", runDemo);
    $("#resetDemo").addEventListener("click", resetDemo);

    // map pair hover/click
    $$(".map-item").forEach(item => {
      item.addEventListener("mouseenter", () => highlightPair(item.dataset.pair, true));
      item.addEventListener("mouseleave", () => highlightPair(item.dataset.pair, false));
      item.addEventListener("click", () => highlightPair(item.dataset.pair, true));
    });

    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        if (e.key === "Escape") closeAllOverlays();
        return;
      }
      // 避免按钮保持着焦点时按空格既触发按钮又翻页
      if (document.activeElement && document.activeElement.tagName === "BUTTON") {
        document.activeElement.blur();
      }
      const k = e.key;
      if ($("#caseModal").classList.contains("is-open")) {
        if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown") { e.preventDefault(); navigateCase(1); return; }
        if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") { e.preventDefault(); navigateCase(-1); return; }
        if (k === "Escape") { e.preventDefault(); closeCase(); return; }
      }
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " ") {
        e.preventDefault(); goTo(state.index + 1);
      } else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") {
        e.preventDefault(); goTo(state.index - 1);
      } else if (k === "Home") {
        e.preventDefault(); goTo(0);
      } else if (k === "End") {
        e.preventDefault(); goTo(scenes.length - 1);
      } else if (k === "o" || k === "O") {
        e.preventDefault(); openOverlay("#overviewOverlay");
      } else if (k === "p" || k === "P") {
        e.preventDefault(); toggleNotes();
      } else if (k === "f" || k === "F") {
        e.preventDefault(); toggleFullscreen();
      } else if (k === "b" || k === "B") {
        e.preventDefault(); toggleBlackout();
      } else if (k === "c" || k === "C") {
        e.preventDefault(); openOverlay("#libraryOverlay");
      } else if (k === "g" || k === "G") {
        e.preventDefault(); openOverlay("#glossaryOverlay");
      } else if (k === "a" || k === "A") {
        e.preventDefault();
        const off = document.body.classList.toggle("no-ambient");
        showToast(off ? "3D 氛围已关闭" : "3D 氛围已开启");
      } else if (k === "d" || k === "D") {
        e.preventDefault(); runDemo();
      } else if (k === "Escape") {
        if ($("#blackout").classList.contains("is-open")) toggleBlackout(false);
        else closeAllOverlays();
      } else if (/^[0-9]$/.test(k)) {
        const idx = Number(k);
        if (idx < scenes.length) goTo(idx);
      }
    });

    // close overlays by clicking backdrop (not box)
    $("#caseModal").addEventListener("click", (e) => {
      if (e.target === $("#caseModal")) closeCase();
    });
  }

  function highlightPair(pair, on) {
    $$('.map-item[data-pair="' + pair + '"]').forEach(el => el.classList.toggle("is-active", on));
  }

  /* ---------- init ---------- */
  function init() {
    initReveal();
    initFlipCards();
    initLens();
    initLayers();
    renderFeatured("all");
    renderLibrary();
    renderGlossary();
    renderOverview();
    bind();
    updateChrome();
    // hero reveal immediately
    requestAnimationFrame(() => {
      $$('.hero [data-reveal]').forEach(el => el.classList.add("is-in"));
    });
  }

  window.__site = {
    goTo,
    openCase,
    openOverlay,
    closeAllOverlays,
    runDemo,
    showToast,
    toggleNotes,
    toggleBlackout,
    get index() { return state.index; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
