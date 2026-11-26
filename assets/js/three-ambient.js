/* ============================================================
   Ambient 3D layer — an always-on, very light three.js field that
   morphs with the current course scene. It is decorative, never
   interactive, never follows the mouse, and stays behind content.

   Loaded lazily after first paint by three-loader.js.
   ============================================================ */
(function () {
  "use strict";
  if (window.__ambientReady) return;
  window.__ambientReady = true;

  const reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const MAIN = 1250;
  const ACC = 260;

  function rnd(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // Eleven deterministic point-cloud shapes, one per scene.
  function make(index, count, phase) {
    index = ((index % 11) + 11) % 11;
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const a = t * Math.PI * 2 * (1 + (index % 4) * 0.5) + (phase || 0);
      const r = rnd(i + index * 97);
      const s = rnd(i * 1.7 + index * 31 + (phase || 0) * 10);
      let x = 0, y = 0, z = 0;
      switch (index) {
        case 0: // cover: core ring
          x = Math.cos(a) * 5.2 + (r - 0.5) * 0.6;
          y = Math.sin(a) * 3.1 + (s - 0.5) * 0.5;
          z = (s - 0.5) * 2.6;
          break;
        case 1: // course map: three branches
          {
            const g = i % 3;
            x = (g - 1) * 4.4 + Math.cos(a * 3) * (1 + r);
            y = (g === 0 ? 1.8 : g === 1 ? 0.2 : -1.7) + Math.sin(a * 3) * 1.2;
            z = (s - 0.5) * 2.2;
          }
          break;
        case 2: // six daily interactions
          {
            const g = i % 6;
            const gx = (g % 3 - 1) * 3.6;
            const gy = (Math.floor(g / 3) - 0.5) * 3.2;
            x = gx + Math.cos(a * 6) * (0.55 + r * 0.5);
            y = gy + Math.sin(a * 6) * (0.55 + s * 0.5);
            z = (s - 0.5) * 2;
          }
          break;
        case 3: // manufacturing: three material layers
          {
            const layer = i % 3;
            x = (r - 0.5) * 10;
            y = (layer - 1) * 2.1 + (s - 0.5) * 0.3;
            z = (s - 0.5) * 3;
          }
          break;
        case 4: // four elements
          {
            const q = i % 4;
            x = (q % 2 ? 1 : -1) * 3.1 + Math.cos(a * 4) * (0.7 + r * 0.5);
            y = (q < 2 ? 1 : -1) * 2.2 + Math.sin(a * 4) * (0.7 + s * 0.5);
            z = (s - 0.5) * 2;
          }
          break;
        case 5: // demo: two streams
          {
            const side = i % 2 ? 1 : -1;
            x = side * 4.2 + Math.sin(t * 30 + index) * 0.5;
            y = (t - 0.5) * 8;
            z = (s - 0.5) * 2.5;
          }
          break;
        case 6: // five-step loop: torus
          {
            const R = 3.8;
            const rr = 0.8 + r * 0.5;
            x = (R + rr * Math.cos(a * 5)) * Math.cos(a);
            y = (R + rr * Math.cos(a * 5)) * Math.sin(a) * 0.62;
            z = rr * Math.sin(a * 5) * 2;
          }
          break;
        case 7: // case wall: card cloud
          {
            const g = i % 6;
            const gx = (g % 3 - 1) * 3.5;
            const gy = (Math.floor(g / 3) - 0.5) * 3;
            x = gx + Math.cos(a * 6) * (0.9 + r * 0.4);
            y = gy + Math.sin(a * 6) * (0.6 + s * 0.4);
            z = (s - 0.5) * 3;
          }
          break;
        case 8: // software -> physical: converging streams
          {
            const side = i % 2 ? 1 : -1;
            const u = t;
            x = side * (4.8 - u * 3.5) + Math.cos(a * 8) * 0.4;
            y = (u - 0.5) * 8;
            z = (s - 0.5) * 2.5;
          }
          break;
        case 9: // industry chain: three nodes
          {
            const g = i % 3;
            x = (g - 1) * 4.6 + Math.cos(a * 3) * (1.1 + r * 0.4);
            y = Math.sin(a * 3) * (1.1 + s * 0.4);
            z = (s - 0.5) * 2.2;
          }
          break;
        default: // summary: spiral converging inward
          {
            const u = t;
            const rad = 5 * (1 - u) + 0.3;
            x = Math.cos(u * Math.PI * 8) * rad;
            y = Math.sin(u * Math.PI * 8) * rad * 0.6;
            z = (s - 0.5) * 2 * (1 - u);
          }
      }
      out[i * 3] = x;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = z;
    }
    return out;
  }

  const presets = [];
  for (let i = 0; i < 11; i++) {
    presets.push({
      main: make(i, MAIN, 0),
      acc: make(i, ACC, 0.7)
    });
  }

  let renderer, scene, camera, group;
  let mainAttr, accAttr;
  let mainMat, accMat;
  let targetMain, targetAcc;
  let targetBase = new THREE.Color("#24476b");
  let targetAccent = new THREE.Color("#e4572e");
  let currentScene = 0;
  let running = false;
  let lastFrame = 0;

  function init() {
    if (renderer) return;
    const canvas = document.createElement("canvas");
    canvas.id = "ambientCanvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);

    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: false, powerPreference: "low-power"
    });
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 14);
    group = new THREE.Group();
    scene.add(group);

    const start = presets[0];
    const mainGeo = new THREE.BufferGeometry();
    mainAttr = new THREE.Float32BufferAttribute(new Float32Array(start.main), 3);
    mainAttr.setUsage(THREE.DynamicDrawUsage);
    mainGeo.setAttribute("position", mainAttr);
    mainMat = new THREE.PointsMaterial({
      color: targetBase.clone(), size: 0.12, transparent: true,
      opacity: 0.95, sizeAttenuation: true, depthWrite: false
    });
    const mainPoints = new THREE.Points(mainGeo, mainMat);
    mainPoints.frustumCulled = false;
    group.add(mainPoints);

    const accGeo = new THREE.BufferGeometry();
    accAttr = new THREE.Float32BufferAttribute(new Float32Array(start.acc), 3);
    accAttr.setUsage(THREE.DynamicDrawUsage);
    accGeo.setAttribute("position", accAttr);
    accMat = new THREE.PointsMaterial({
      color: targetAccent.clone(), size: 0.17, transparent: true,
      opacity: 0.88, sizeAttenuation: true, depthWrite: false
    });
    const accPoints = new THREE.Points(accGeo, accMat);
    accPoints.frustumCulled = false;
    group.add(accPoints);

    targetMain = new Float32Array(start.main);
    targetAcc = new Float32Array(start.acc);

    // A faint wireframe core gives the field real 3D depth on the cover.
    const core = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.6, 1)),
      new THREE.LineBasicMaterial({ color: 0x8de3f2, transparent: true, opacity: 0.1 })
    );
    core.name = "ambientCore";
    group.add(core);

    const idx = (window.__site && window.__site.index) || 0;
    const dark = document.querySelector(".scene.is-current")?.dataset.theme === "dark";
    setScene(idx, dark);
    if (!reduced) {
      window.addEventListener("resize", resize);
      window.addEventListener("course:scene", onScene);
      running = true;
      requestAnimationFrame(animate);
    } else {
      renderer.render(scene, camera);
    }
    canvas.classList.add("is-ready");
  }

  function resize() {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  function onScene(e) {
    const d = e.detail || {};
    setScene(Number(d.index) || 0, !!d.dark);
  }

  function setScene(index, dark) {
    if (!presets[index]) index = 0;
    currentScene = index;
    targetMain = presets[index].main;
    targetAcc = presets[index].acc;
    targetBase.set(dark ? "#4cc9f0" : "#24476b");
    targetAccent.set("#e4572e");
    if (reduced && renderer) {
      mainAttr.array.set(targetMain);
      accAttr.array.set(targetAcc);
      mainAttr.needsUpdate = accAttr.needsUpdate = true;
      mainMat.color.copy(targetBase);
      accMat.color.copy(targetAccent);
      renderer.render(scene, camera);
    }
  }

  function animate(t) {
    if (!running) return;
    requestAnimationFrame(animate);
    if (t - lastFrame < 24) return; // ~40fps cap, very light
    lastFrame = t;

    const k = 0.035;
    const ma = mainAttr.array, tm = targetMain;
    for (let i = 0; i < ma.length; i++) ma[i] += (tm[i] - ma[i]) * k;
    mainAttr.needsUpdate = true;
    const aa = accAttr.array, ta = targetAcc;
    for (let i = 0; i < aa.length; i++) aa[i] += (ta[i] - aa[i]) * k;
    accAttr.needsUpdate = true;

    mainMat.color.lerp(targetBase, 0.04);
    accMat.color.lerp(targetAccent, 0.04);

    group.rotation.y += 0.0007;
    group.rotation.x = Math.sin(t * 0.0002) * 0.06;
    const core = group.getObjectByName("ambientCore");
    if (core) {
      core.rotation.x += 0.0011;
      core.rotation.y -= 0.0008;
      core.visible = currentScene === 0 || currentScene === 4 || currentScene === 6;
    }
    renderer.render(scene, camera);
  }

  window.initAmbient = init;
})();
