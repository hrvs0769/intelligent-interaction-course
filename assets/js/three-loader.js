/* ============================================================
   Lazy-load the 3D exhibits. three.js is ~650KB and is only needed
   when the lecturer opens the tower / exploded view / corridor.
   ============================================================ */
(function () {
  "use strict";
  const FILES = [
    "assets/js/vendor/three.min.js",
    "assets/js/three-tower.js",
    "assets/js/three-exhibits.js"
  ];
  let loading = null;

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

  function loadAll() {
    if (window.__threeReady) return Promise.resolve();
    if (loading) return loading;
    let chain = Promise.resolve();
    FILES.forEach(f => { chain = chain.then(() => loadOne(f)); });
    loading = chain.then(() => { window.__threeReady = true; });
    return loading;
  }

  window.open3D = function (kind) {
    const fire = () => window.dispatchEvent(new Event("open-" + kind));
    if (window.__threeReady) { fire(); return; }
    loadAll().then(fire).catch(() => {
      const t = document.getElementById("toast");
      if (t) {
        t.textContent = "3D 模块加载失败，请检查网络后重试";
        t.classList.add("is-show");
        setTimeout(() => t.classList.remove("is-show"), 2400);
      }
    });
    const t = document.getElementById("toast");
    if (t) {
      t.textContent = "正在加载 3D 模块…";
      t.classList.add("is-show");
      setTimeout(() => t.classList.remove("is-show"), 1600);
    }
  };
})();
