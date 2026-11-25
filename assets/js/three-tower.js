/* ============================================================
   3D Interaction Stack · three.js
   Lightweight, local, offline. Classic script (global THREE).
   ============================================================ */
(function () {
  "use strict";

  const DATA = [
    { n: "01", name: "物理层", en: "PHYSICAL", color: 0x4d7aa8, body: "形态、材料、按键、触感、声光反馈。用户摸得到的东西。例：徕卡拨盘、SU7 物理按键。" },
    { n: "02", name: "界面层", en: "INTERFACE", color: 0x3c9fb0, body: "屏幕、语音、手势、视觉与听觉反馈。用户看得见、说得出的部分。例：灵动岛、Vision Pro 的空间界面。" },
    { n: "03", name: "行为 / 任务层", en: "TASK", color: 0xe4572e, body: "用户目标、操作流程、状态转换、出错处理、权限。用户办不办得成，靠这一层。例：DUSTGUARD 的告警接警→处置→闭环。" },
    { n: "04", name: "系统 / 数据层", en: "SYSTEM", color: 0x6b5ba8, body: "设备接口、数据流、算法、后台服务、跨设备协同。机器接不接得住。例：OPC UA、MQTT、云端数据服务。" },
    { n: "05", name: "产业 / 生态层", en: "INDUSTRY", color: 0x6e8a9a, body: "标准、供应链、平台、商业模式、合规。产业转不转得动。例：Matter 协议、工业互联网平台、汽车生态。" }
  ];

  const overlay = () => document.getElementById("towerOverlay");
  const canvas = () => document.getElementById("towerCanvas");
  let renderer, scene, camera, group, plates = [], raycaster, pointer, selected = 0;
  let raf = null, inited = false, dragging = false, lastX = 0, lastY = 0, moved = 0;
  let targetRotY = 0, targetRotX = 0, zoom = 11.2;

  function buildPanel() {
    const box = document.getElementById("towerButtons");
    if (!box) return;
    box.innerHTML = DATA.map((d, i) =>
      '<button type="button" data-tower-layer="' + i + '"><span>' + d.n + ' / ' + d.en + '</span>' + d.name + '</button>'
    ).join("");
    box.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => select(Number(btn.dataset.towerLayer)));
    });
  }

  function select(i) {
    selected = i;
    const d = DATA[i];
    document.getElementById("towerNo").textContent = d.n + " / " + d.en;
    document.getElementById("towerTitle").textContent = d.name;
    document.getElementById("towerBody").textContent = d.body;
    document.querySelectorAll("#towerButtons button").forEach((b, bi) => b.classList.toggle("is-active", bi === i));
    plates.forEach((p, pi) => {
      p.userData.selected = pi === i;
      p.material.opacity = pi === i ? 0.9 : 0.46;
    });
  }

  function makeLabel(text, en) {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 150;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(245,241,232,.92)";
    ctx.font = "600 52px PingFang SC, Noto Sans SC, sans-serif";
    ctx.fillText(text, 6, 72);
    ctx.fillStyle = "rgba(141,227,242,.6)";
    ctx.font = "500 22px Menlo, monospace";
    ctx.fillText(en, 8, 114);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(3.1, 0.73, 1);
    sp.renderOrder = 20;
    return sp;
  }

  function init() {
    if (inited) return true;
    const ov = overlay();
    if (!window.THREE || !canvas()) {
      const fb = document.getElementById("towerFallback");
      if (fb) fb.style.display = "flex";
      return false;
    }
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas(), antialias: true, alpha: true });
    } catch (e) {
      const fb = document.getElementById("towerFallback");
      if (fb) fb.style.display = "flex";
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05080c, 0.032);

    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(6.4, 4.6, zoom);
    camera.lookAt(0, 0, 0);

    group = new THREE.Group();
    scene.add(group);

    DATA.forEach((d, i) => {
      const y = (i - 2) * 1.15;
      const geo = new THREE.BoxGeometry(4.2, 0.24, 3.05);
      const mat = new THREE.MeshStandardMaterial({
        color: d.color, transparent: true, opacity: 0.46,
        roughness: 0.32, metalness: 0.3,
        emissive: d.color, emissiveIntensity: 0.12
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, y, 0);
      mesh.userData = { layer: i, baseY: y, selected: false };
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0.5 })
      );
      mesh.add(edges);
      group.add(mesh);
      plates.push(mesh);
      const label = makeLabel(d.name, d.en);
      label.position.set(0, y + 0.28, 2.0);
      group.add(label);
      mesh.userData.label = label;
    });

    // central beam + moving particle
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 7.2, 8),
      new THREE.MeshBasicMaterial({ color: 0x8de3f2, transparent: true, opacity: 0.18 })
    );
    beam.position.y = 0;
    group.add(beam);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x8de3f2 })
    );
    dot.userData.flow = true;
    group.add(dot);

    // grid floor
    const grid = new THREE.GridHelper(16, 32, 0x24476b, 0x143249);
    grid.position.y = -3.6;
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
    group.add(grid);

    scene.add(new THREE.AmbientLight(0x9bc7dd, 0.7));
    const d1 = new THREE.DirectionalLight(0xffffff, 1.2); d1.position.set(5, 8, 8); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xe4572e, 0.7); d2.position.set(-7, 2, -4); scene.add(d2);

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    const el = canvas();

    el.addEventListener("pointerdown", (e) => {
      dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      targetRotY += dx * 0.006;
      targetRotX = Math.max(-0.65, Math.min(0.65, targetRotX + dy * 0.004));
    });
    el.addEventListener("pointerup", (e) => {
      dragging = false;
      if (moved < 5) pick(e);
    });
    el.addEventListener("pointercancel", () => { dragging = false; });
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      zoom = Math.max(6.2, Math.min(14, zoom + e.deltaY * 0.006));
    }, { passive: false });

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas());
    inited = true;
    resize();
    buildPanel();
    select(0);
    animate();
    return true;
  }

  function pick(e) {
    const el = canvas();
    const r = el.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(plates, true);
    if (!hits.length) return;
    let obj = hits[0].object;
    while (obj && obj.userData.layer === undefined) obj = obj.parent;
    if (obj && obj.userData.layer !== undefined) select(obj.userData.layer);
  }

  function resize() {
    if (!renderer) return;
    const el = canvas();
    const w = el.clientWidth || 800, h = el.clientHeight || 500;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function animate() {
    if (!overlay().classList.contains("is-open")) { raf = null; return; }
    const t = performance.now() * 0.001;
    if (!dragging) targetRotY += 0.0014;
    group.rotation.y += (targetRotY - group.rotation.y) * 0.07;
    group.rotation.x += (targetRotX - group.rotation.x) * 0.07;
    camera.position.z += (zoom - camera.position.z) * 0.08;
    camera.lookAt(0, 0, 0);
    plates.forEach((p) => {
      const targetY = p.userData.baseY + (p.userData.selected ? 0.32 : 0);
      p.position.y += (targetY - p.position.y) * 0.12;
      p.rotation.z = p.userData.selected ? 0.015 : 0;
    });
    const dot = group.children.find(c => c.userData && c.userData.flow);
    if (dot) dot.position.y = -3.1 + ((t * 0.6) % 6.2);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  }

  function openTower() {
    const ov = overlay();
    if (!ov) return;
    ov.classList.add("is-open");
    document.body.classList.add("is-locked");
    const ok = init();
    if (ok) {
      resize();
      if (!raf) animate();
    }
  }

  function closeTower() {
    const ov = overlay();
    if (!ov) return;
    ov.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  function bindTowerUI() {
    const close = document.getElementById("towerClose");
    if (close) close.addEventListener("click", closeTower);
    window.addEventListener("open-tower", openTower);
    document.addEventListener("keydown", (e) => {
      const ov = overlay();
      if (ov && ov.classList.contains("is-open") && e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeTower();
      }
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindTowerUI);
  else bindTowerUI();
})();
