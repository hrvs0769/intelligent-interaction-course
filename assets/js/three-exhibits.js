/* ============================================================
   3D exploded view · manufacturing aesthetics teaching exhibit
   Local three.js, classic script.
   ============================================================ */
(function () {
  "use strict";

  /* ============================================================
     A. 3D exploded view (manufacturing aesthetics)
     ============================================================ */
  const EX = [
    { n: "01", name: "盖板玻璃", en: "COVER GLASS", color: 0x8de3f2,
      body: "材料：超薄玻璃 / UTG；工艺：化学强化、CNC、AG 蚀刻；CMF：防指纹镀膜、雾度；交互：触控手感、折痕可见度。" },
    { n: "02", name: "柔性显示", en: "FLEX DISPLAY", color: 0x5b9bd5,
      body: "材料：OLED / UTG；工艺：蒸镀、贴合、弯折测试；CMF：色域、亮度、反射率；交互：展开/折叠、折痕控制。" },
    { n: "03", name: "中框 / 铰链", en: "FRAME / HINGE", color: 0xe4572e,
      body: "材料：铝合金 / 液态金属；工艺：CNC、压铸、精密装配；CMF：阳极氧化、喷砂；交互：阻尼、折叠手感、寿命。" },
    { n: "04", name: "电池 / 结构", en: "BATTERY / STRUCTURE", color: 0x6b5ba8,
      body: "材料：锂聚合物 / 石墨散热；工艺：叠片、封装、堆叠；CMF：厚度、重量；交互：续航、发热、重心。" },
    { n: "05", name: "后盖 / 表面", en: "BACK / CMF", color: 0x6e8a9a,
      body: "材料：玻璃 / 素皮 / 陶瓷；工艺：热弯、蚀纹、喷涂；CMF：颜色、触感、耐刮；交互：握持、重量、防滑。" }
  ];

  function exEl(id) { return document.getElementById(id); }
  let exRenderer, exScene, exCamera, exGroup, exPlates = [], exSelected = 0, exInited = false, exRaf = null;
  let exDrag = false, exLastX = 0, exLastY = 0, exMoved = 0, exRotY = 0, exRotX = 0, exZoom = 10.8, exRay, exPointer;

  function exLabel(text, en) {
    const c = document.createElement("canvas"); c.width = 640; c.height = 140;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 640, 140);
    ctx.fillStyle = "rgba(245,241,232,.92)";
    ctx.font = "600 46px PingFang SC, Noto Sans SC, sans-serif";
    ctx.fillText(text, 4, 62);
    ctx.fillStyle = "rgba(141,227,242,.6)";
    ctx.font = "500 20px Menlo, monospace";
    ctx.fillText(en, 6, 102);
    const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
    const sp = new THREE.Sprite(mat); sp.scale.set(2.7, 0.6, 1); sp.renderOrder = 20;
    return sp;
  }

  function exPanel(i) {
    exSelected = i;
    const d = EX[i];
    exEl("explodeNo").textContent = d.n + " / " + d.en;
    exEl("explodeTitle").textContent = d.name;
    exEl("explodeBody").textContent = d.body;
    document.querySelectorAll("#explodeButtons button").forEach((b, bi) => b.classList.toggle("is-active", bi === i));
    exPlates.forEach((p, pi) => {
      p.userData.selected = pi === i;
      p.material.opacity = pi === i ? 0.88 : 0.45;
    });
  }

  function exBuildPanel() {
    const box = exEl("explodeButtons");
    if (!box) return;
    box.innerHTML = EX.map((d, i) =>
      '<button type="button" data-ex="' + i + '"><span>' + d.n + ' / ' + d.en + '</span>' + d.name + '</button>'
    ).join("");
    box.querySelectorAll("button").forEach(b => b.addEventListener("click", () => exPanel(Number(b.dataset.ex))));
  }

  function exInit() {
    if (exInited) return true;
    const canvas = exEl("explodeCanvas");
    if (!window.THREE || !canvas) { const fb = exEl("explodeFallback"); if (fb) fb.style.display = "flex"; return false; }
    try { exRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch (e) { const fb = exEl("explodeFallback"); if (fb) fb.style.display = "flex"; return false; }
    exRenderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    exScene = new THREE.Scene();
    exScene.fog = new THREE.FogExp2(0x05080c, 0.028);
    exCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    exCamera.position.set(6.4, 4.2, exZoom);
    exCamera.lookAt(0, 0, 0);
    exGroup = new THREE.Group(); exScene.add(exGroup);
    EX.forEach((d, i) => {
      const geo = new THREE.BoxGeometry(3.5, 0.16, 2.15);
      const mat = new THREE.MeshStandardMaterial({ color: d.color, transparent: true, opacity: 0.45, roughness: .3, metalness: .35, emissive: d.color, emissiveIntensity: .1 });
      const mesh = new THREE.Mesh(geo, mat);
      const baseY = (i - 2) * 0.9;
      mesh.position.set(0, baseY, 0);
      mesh.userData = { index: i, baseY, selected: false };
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: .5 })));
      exGroup.add(mesh); exPlates.push(mesh);
      const label = exLabel(d.name, d.en);
      label.position.set(0, baseY + .18, 1.6);
      exGroup.add(label);
    });
    // faint phone outline
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(3.9, 5.2, 2.5)),
      new THREE.LineBasicMaterial({ color: 0x24476b, transparent: true, opacity: .35 })
    );
    exGroup.add(outline);
    const grid = new THREE.GridHelper(14, 28, 0x24476b, 0x143249); grid.position.y = -3.4; grid.material.transparent = true; grid.material.opacity = .2; exGroup.add(grid);
    exScene.add(new THREE.AmbientLight(0x9bc7dd, .8));
    const d1 = new THREE.DirectionalLight(0xffffff, 1.3); d1.position.set(4, 8, 8); exScene.add(d1);
    const d2 = new THREE.DirectionalLight(0xe4572e, .7); d2.position.set(-7, 2, -4); exScene.add(d2);
    exRay = new THREE.Raycaster(); exPointer = new THREE.Vector2();
    const el = canvas;
    el.addEventListener("pointerdown", e => { exDrag = true; exMoved = 0; exLastX = e.clientX; exLastY = e.clientY; el.setPointerCapture?.(e.pointerId); });
    el.addEventListener("pointermove", e => {
      if (!exDrag) return;
      const dx = e.clientX - exLastX, dy = e.clientY - exLastY;
      exLastX = e.clientX; exLastY = e.clientY; exMoved += Math.abs(dx) + Math.abs(dy);
      exRotY += dx * 0.006; exRotX = Math.max(-.6, Math.min(.6, exRotX + dy * .004));
    });
    el.addEventListener("pointerup", e => { exDrag = false; if (exMoved < 5) exPick(e); });
    el.addEventListener("pointercancel", () => { exDrag = false; });
    el.addEventListener("wheel", e => { e.preventDefault(); exZoom = Math.max(6, Math.min(15, exZoom + e.deltaY * .006)); }, { passive: false });
    new ResizeObserver(() => exResize()).observe(canvas);
    exInited = true; exResize(); exBuildPanel(); exPanel(0); exAnimate();
    return true;
  }

  function exPick(e) {
    const el = exEl("explodeCanvas"); const r = el.getBoundingClientRect();
    exPointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    exPointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    exRay.setFromCamera(exPointer, exCamera);
    const hits = exRay.intersectObjects(exPlates, true);
    if (!hits.length) return;
    let obj = hits[0].object;
    while (obj && obj.userData.index === undefined) obj = obj.parent;
    if (obj && obj.userData.index !== undefined) exPanel(obj.userData.index);
  }

  function exResize() {
    if (!exRenderer) return;
    const el = exEl("explodeCanvas"); const w = el.clientWidth || 800, h = el.clientHeight || 500;
    exRenderer.setSize(w, h, false); exCamera.aspect = w / h; exCamera.updateProjectionMatrix();
  }

  function exAnimate() {
    if (!exEl("explodeOverlay").classList.contains("is-open")) { exRaf = null; return; }
    if (!exDrag) exRotY += 0.0013;
    exGroup.rotation.y += (exRotY - exGroup.rotation.y) * .07;
    exGroup.rotation.x += (exRotX - exGroup.rotation.x) * .07;
    exCamera.position.z += (exZoom - exCamera.position.z) * .08;
    exCamera.lookAt(0, 0, 0);
    exPlates.forEach(p => {
      const target = p.userData.baseY + (p.userData.selected ? .28 : 0);
      p.position.y += (target - p.position.y) * .12;
      p.rotation.z = p.userData.selected ? .015 : 0;
    });
    exRenderer.render(exScene, exCamera);
    exRaf = requestAnimationFrame(exAnimate);
  }

  function exOpen() {
    const ov = exEl("explodeOverlay"); if (!ov) return;
    ov.classList.add("is-open"); document.body.classList.add("is-locked");
    if (exInit()) { exResize(); if (!exRaf) exAnimate(); }
  }
  function exClose() {
    const ov = exEl("explodeOverlay"); if (!ov) return;
    ov.classList.remove("is-open"); document.body.classList.remove("is-locked");
    if (exRaf) { cancelAnimationFrame(exRaf); exRaf = null; }
  }

  /* ============================================================
     Bind
     ============================================================ */
  function bind() {
    const exCloseBtn = exEl("explodeClose");
    if (exCloseBtn) exCloseBtn.addEventListener("click", exClose);
    window.addEventListener("open-explode", exOpen);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const ex = exEl("explodeOverlay");
      if (ex && ex.classList.contains("is-open")) {
        e.preventDefault(); e.stopImmediatePropagation(); exClose();
      }
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
