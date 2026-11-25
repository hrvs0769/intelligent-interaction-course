/* ============================================================
   three.js loader
   - three.min.js (~650KB) is loaded lazily, never on first paint.
   - After first paint we load the tiny ambient field.
   - Clicking a 3D exhibit loads the exhibit modules on demand.
   ============================================================ */
(function () {
  "use strict";

  const CORE = "assets/js/vendor/three.min.js";
  const AMBIENT = "assets/js/three-ambient.js";
  const EXHIBITS = ["assets/js/three-tower.js", "assets/js/three-exhibits.js"];

  let corePromise = null;
  let exhibitPromise = null;

  function loadOne(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = () => reject(new Error("failed to load " + src));
      document.head.appendChild(s);
    });
  }

  function ensureCore() {
    if (window.THREE) return Promise.resolve();
    if (corePromise) return corePromise;
    corePromise = loadOne(CORE);
    return corePromise;
  }

  function ensureExhibits() {
    if (exhibitPromise) return exhibitPromise;
    exhibitPromise = ensureCore().then(() => {
      let chain = Promise.resolve();
      EXHIBITS.forEach(f => { chain = chain.then(() => loadOne(f)); });
      return chain;
    });
    return exhibitPromise;
  }

  function toast(text, ms) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = text;
    t.classList.add("is-show");
    setTimeout(() => t.classList.remove("is-show"), ms || 1800);
  }

  window.open3D = function (kind) {
    ensureExhibits()
      .then(() => window.dispatchEvent(new Event("open-" + kind)))
      .catch(() => toast("3D 模块加载失败，请检查网络后重试", 2400));
    toast("正在加载 3D 模块…", 1400);
  };

  function startAmbient() {
    ensureCore()
      .then(() => loadOne(AMBIENT))
      .then(() => window.initAmbient && window.initAmbient())
      .catch(() => { /* decorative layer is optional */ });
  }

  function whenIdle(fn) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(fn, { timeout: 2500 });
    } else {
      setTimeout(fn, 900);
    }
  }

  if (document.readyState === "complete") whenIdle(startAmbient);
  else window.addEventListener("load", () => whenIdle(startAmbient), { once: true });
})();
