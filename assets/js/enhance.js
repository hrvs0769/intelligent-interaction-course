/* ============================================================
   Enhancements: boot, cursor, ambient, dock, command palette,
   tilt, magnetic, split text, micro-interactions.
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFine = window.matchMedia && window.matchMedia("(pointer:fine)").matches;
  const scenes = $$(".scene");
  const site = () => window.__site || {};

  document.body.classList.add("enhanced");

  /* ---------- boot ---------- */
  function boot() {
    const el = document.createElement("div");
    el.id = "boot";
    el.innerHTML = '<div class="mark">MI</div><div class="name">智能交互与设计</div><div class="line"><i></i></div><small>MANUFACTURING AESTHETICS / INTERACTION / INDUSTRY</small>';
    document.body.appendChild(el);
    const hide = () => {
      setTimeout(() => el.classList.add("is-done"), 650);
      setTimeout(() => el.remove(), 1500);
    };
    if (document.readyState === "complete") hide();
    else window.addEventListener("load", hide, { once: true });
  }
  boot();

  /* ---------- cursor / ambient ---------- */
  let dot, ring, glow;
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  let ringPos = { x: pointer.x, y: pointer.y };
  function initCursor() {
    dot = document.createElement("div");
    dot.className = "cursor-dot";
    ring = document.createElement("div");
    ring.className = "cursor-ring";
    glow = document.createElement("div");
    glow.className = "ambient-glow";
    document.body.append(glow, ring, dot);
    if (!isFine || reduce) { dot.style.display = ring.style.display = "none"; }
    document.addEventListener("mousemove", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      dot.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px) translate(-50%,-50%)";
      glow.style.setProperty("--mx", e.clientX + "px");
      glow.style.setProperty("--my", e.clientY + "px");
    }, { passive: true });
    document.addEventListener("mousedown", () => ring.classList.add("is-down"));
    document.addEventListener("mouseup", () => ring.classList.remove("is-down"));
    document.addEventListener("mouseover", (e) => {
      const hot = e.target.closest("a,button,[data-tilt],[data-magnetic],.case-card,.flip-card,.layer,.nav-btn,.btn");
      ring.classList.toggle("is-hot", !!hot);
    });
    const loop = () => {
      ringPos.x += (pointer.x - ringPos.x) * 0.16;
      ringPos.y += (pointer.y - ringPos.y) * 0.16;
      ring.style.transform = "translate(" + ringPos.x + "px," + ringPos.y + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    };
    if (isFine && !reduce) loop();
  }
  /* cursor disabled for performance */

  /* ---------- scene rail + dock ---------- */
  function initNav() {
    const rail = document.createElement("div");
    rail.className = "scene-rail";
    scenes.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.jump = i;
      b.innerHTML = '<span class="lbl">' + String(i).padStart(2, "0") + " " + (s.dataset.title || "") + '</span><span class="tick"></span>';
      b.addEventListener("click", () => site().goTo?.(i));
      rail.appendChild(b);
    });
    document.body.appendChild(rail);

    const dock = document.createElement("div");
    dock.className = "scene-dock";
    dock.innerHTML =
      '<span class="num" id="dockNum">00</span>' +
      '<span class="title" id="dockTitle">封面</span>' +
      '<span class="dots" id="dockDots"></span>' +
      '<button class="play" type="button" title="触发演示">▶</button>' +
      '<button class="next" type="button" title="下一幕">→</button>';
    document.body.appendChild(dock);
    const dots = $("#dockDots", dock);
    scenes.forEach((s, i) => {
      const i2 = document.createElement("i");
      i2.dataset.jump = i;
      i2.title = s.dataset.title || "";
      i2.addEventListener("click", () => site().goTo?.(i));
      dots.appendChild(i2);
    });
    $(".next", dock).addEventListener("click", () => site().goTo?.(Math.min(scenes.length - 1, currentIndex() + 1)));
    $(".play", dock).addEventListener("click", () => site().runDemo?.());
    syncNav();
  }

  function currentIndex() {
    const y = window.scrollY + window.innerHeight * 0.38;
    let idx = 0;
    scenes.forEach((s, i) => { if (s.offsetTop <= y) idx = i; });
    return idx;
  }

  function syncNav() {
    const idx = currentIndex();
    const scene = scenes[idx];
    const dark = scene && scene.dataset.theme === "dark";
    document.body.classList.toggle("is-light", !dark);
    const rail = $(".scene-rail");
    if (rail) {
      rail.classList.toggle("on-dark", dark);
      $$("button", rail).forEach((b, i) => b.classList.toggle("active", i === idx));
    }
    const dock = $(".scene-dock");
    if (dock) {
      const num = $("#dockNum", dock);
      const title = $("#dockTitle", dock);
      if (num) num.textContent = String(idx).padStart(2, "0");
      if (title) title.textContent = scene?.dataset.title || "";
      $$("#dockDots i", dock).forEach((d, i) => d.classList.toggle("active", i === idx));
    }
  }

  /* ---------- split text ---------- */
  function splitNode(node) {
    if (node.nodeType === 3) {
      const text = node.textContent;
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      Array.from(text).forEach((ch, i) => {
        const span = document.createElement("span");
        span.className = "split-char";
        span.textContent = ch;
        span.style.setProperty("--d", (i * 0.026) + "s");
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && node.tagName !== "BR") {
      Array.from(node.childNodes).forEach(splitNode);
    }
  }

  function initSplit() {
    if (reduce) return;
    const targets = $$(".hero-title .line, .scene-title");
    targets.forEach((el) => {
      Array.from(el.childNodes).forEach(splitNode);
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-split-in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      io.observe(el);
    });
  }

  /* ---------- tilt / magnetic / spotlight ---------- */
  function initTilt() {
    if (reduce || !isFine) return;
    $$(".case-card,.lens-card,.element-tile,.session-card,.chain-card,.homework,.dustguard-strip").forEach((el) => {
      if (el.hasAttribute("data-tilt")) return;
      el.setAttribute("data-tilt", "");
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * -5;
        const ry = (px - 0.5) * 5;
        el.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-2px)";
        el.style.setProperty("--px", (px * 100) + "%");
        el.style.setProperty("--py", (py * 100) + "%");
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  function initMagnetic() {
    if (reduce || !isFine) return;
    $$(".btn,.nav-btn,.scene-dock .next,.scene-dock .play").forEach((el) => {
      if (el.hasAttribute("data-magnetic")) return;
      el.setAttribute("data-magnetic", "");
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.12;
        const y = (e.clientY - r.top - r.height / 2) * 0.18;
        el.style.transform = "translate(" + x + "px," + y + "px)";
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- ripple ---------- */
  function initRipple() {
    document.addEventListener("click", (e) => {
      const target = e.target.closest("button,.btn,.nav-btn,.case-card,.flip-card,.layer,.session-card,.ld-card");
      if (!target) return;
      const r = target.getBoundingClientRect();
      const span = document.createElement("span");
      span.className = "ripple";
      const size = Math.max(r.width, r.height) * 0.8;
      span.style.width = span.style.height = size + "px";
      span.style.left = (e.clientX - r.left) + "px";
      span.style.top = (e.clientY - r.top) + "px";
      target.appendChild(span);
      setTimeout(() => span.remove(), 650);
    });
  }

  /* ---------- hero atmosphere / parallax ---------- */
  function initHero() {
    const hero = $(".hero");
    if (!hero) return;
    const scan = document.createElement("div");
    scan.className = "hero-scan";
    hero.appendChild(scan);
    const specs = [
      ["s1", "MATERIAL / AL-6061"],
      ["s2", "PROCESS / CNC + ANODIZED"],
      ["s3", "INTERACTION / DAMPING + KNURLING"]
    ];
    specs.forEach(([cls, text]) => {
      const d = document.createElement("div");
      d.className = "hero-spec " + cls;
      d.textContent = text;
      hero.appendChild(d);
    });
    // 性能优先：保留扫描线与标注，不做鼠标视差
  }

  /* ---------- command palette ---------- */
  let cmdk, cmdkInput, cmdkList, cmdkItems = [], cmdkIndex = 0;
  function initCmdk() {
    const nav = $(".topnav");
    if (nav) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "nav-btn";
      b.innerHTML = '搜索 <kbd>/</kbd>';
      b.addEventListener("click", openCmdk);
      nav.insertBefore(b, nav.firstChild);
    }
    cmdk = document.createElement("div");
    cmdk.className = "cmdk";
    cmdk.innerHTML =
      '<div class="cmdk-box"><div class="cmdk-head"><span>SEARCH / JUMP</span><input class="cmdk-input" placeholder="搜索场景、案例、关键词……"><span class="cmdk-hint">ESC 关闭</span></div><div class="cmdk-list"></div></div>';
    document.body.appendChild(cmdk);
    cmdkInput = $(".cmdk-input", cmdk);
    cmdkList = $(".cmdk-list", cmdk);
    cmdk.addEventListener("click", (e) => { if (e.target === cmdk) closeCmdk(); });
    cmdkInput.addEventListener("input", renderCmdk);
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCmdk();
        return;
      }
      if (e.key === "/" && !isTyping()) {
        e.preventDefault();
        openCmdk();
        return;
      }
      if (!cmdk.classList.contains("is-open")) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); closeCmdk(); }
      if (e.key === "ArrowDown") { e.preventDefault(); e.stopImmediatePropagation(); moveCmdk(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); e.stopImmediatePropagation(); moveCmdk(-1); }
      if (e.key === "Enter") { e.preventDefault(); e.stopImmediatePropagation(); selectCmdk(); }
    }, true);
  }

  function isTyping() {
    const t = document.activeElement;
    return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
  }

  function openCmdk() {
    cmdk.classList.add("is-open");
    cmdkInput.value = "";
    renderCmdk();
    setTimeout(() => cmdkInput.focus(), 20);
    document.body.classList.add("is-locked");
  }
  function closeCmdk() {
    cmdk.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  }

  function renderCmdk() {
    const q = cmdkInput.value.trim().toLowerCase();
    const sceneItems = scenes.map((s, i) => ({
      type: "scene", id: i, key: String(i).padStart(2, "0"), title: s.dataset.title || "场景", sub: "跳转场景"
    }));
    const caseItems = (window.CASES || []).map(c => ({
      type: "case", id: c.id, key: c.id.replace("C", "C-"), title: c.name + "（" + c.year + "）", sub: c.category
    }));
    let items = sceneItems.concat(caseItems);
    if (q) {
      items = items.filter(it => (it.title + " " + it.sub + " " + it.key).toLowerCase().includes(q));
    }
    cmdkItems = items.slice(0, 30);
    cmdkIndex = 0;
    if (!cmdkItems.length) {
      cmdkList.innerHTML = '<div class="cmdk-empty">没有匹配结果。试试“华为”“案例”“产业”。</div>';
      return;
    }
    cmdkList.innerHTML = cmdkItems.map((it, i) =>
      '<div class="cmdk-item' + (i === 0 ? " is-active" : "") + '" data-index="' + i + '">' +
      '<span class="k">' + it.key + '</span><span class="t">' + it.title + '</span><span class="s">' + it.sub + '</span></div>'
    ).join("");
    $$(".cmdk-item", cmdkList).forEach(el => {
      el.addEventListener("mouseenter", () => { cmdkIndex = Number(el.dataset.index); paintCmdk(); });
      el.addEventListener("click", () => { cmdkIndex = Number(el.dataset.index); selectCmdk(); });
    });
  }

  function paintCmdk() {
    $$(".cmdk-item", cmdkList).forEach((el, i) => el.classList.toggle("is-active", i === cmdkIndex));
    const active = $$(".cmdk-item", cmdkList)[cmdkIndex];
    if (active) active.scrollIntoView({ block: "nearest" });
  }
  function moveCmdk(delta) {
    if (!cmdkItems.length) return;
    cmdkIndex = (cmdkIndex + delta + cmdkItems.length) % cmdkItems.length;
    paintCmdk();
  }
  function selectCmdk() {
    const item = cmdkItems[cmdkIndex];
    if (!item) return;
    closeCmdk();
    if (item.type === "scene") site().goTo?.(item.id);
    else site().openCase?.(item.id);
  }

  /* ---------- sound ---------- */
  let audioCtx = null;
  let soundOn = false;
  function initSound() {
    const nav = $(".topnav");
    if (!nav) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "nav-btn sound-toggle";
    b.innerHTML = '<span class="dot"></span>音效';
    b.addEventListener("click", () => {
      soundOn = !soundOn;
      b.classList.toggle("on", soundOn);
      if (soundOn && !audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (soundOn) tone(520, 0.04, 0.03);
      showToast(soundOn ? "音效已开启" : "音效已关闭");
    });
    nav.appendChild(b);
    document.addEventListener("click", (e) => {
      if (!soundOn) return;
      if (e.target.closest("button,.btn,.nav-btn,.case-card,.flip-card")) tone(420, 0.03, 0.02);
    });
  }
  function tone(freq, dur, gain) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.stop(audioCtx.currentTime + dur + 0.01);
  }

  /* ---------- toast ---------- */
  function showToast(text) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = text;
    t.classList.add("is-show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => t.classList.remove("is-show"), 1800);
  }

  /* ---------- scene metadata + sync ---------- */
  function initMeta() {
    scenes.forEach((s, i) => {
      s.dataset.num = String(i).padStart(2, "0");
    });
    window.addEventListener("scroll", syncNav, { passive: true });
    window.addEventListener("resize", syncNav);
    setInterval(syncNav, 500);
  }

  function initMapLinks() {
    $$("[data-map-jump]").forEach((el) => {
      const go = () => site().goTo?.(Number(el.dataset.mapJump));
      el.addEventListener("click", go);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
    });
    $$("[data-map-toast]").forEach((el) => {
      el.addEventListener("click", () => showToast(el.dataset.mapToast || ""));
    });
  }

  /* ---------- init ---------- */
  initNav();
  initSplit();
  initRipple();
  initHero();
  initCmdk();
  initSound();
  initMeta();
  initMapLinks();
  syncNav();
})();
