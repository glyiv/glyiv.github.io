/* GLYIV Tree Marketplace — interactive 3D tree (three.js, local module).
   Drag to rotate, auto-rotates when idle; 3 growth stages (bibit/muda/dewasa)
   change the model + per-tree metadata (age, serapan, coordinates). */
import * as THREE from "three";

(function () {
  var canvas = document.getElementById("tree3d");
  if (!canvas) return;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (e) { return; } // no WebGL — leave the gradient backdrop
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b241a, 7, 17);
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 2.2, 6.4);

  scene.add(new THREE.AmbientLight(0x9bc7b4, 0.95));
  var sun = new THREE.DirectionalLight(0xffffff, 1.15); sun.position.set(4, 9, 5); scene.add(sun);
  var rim = new THREE.DirectionalLight(0x8affc1, 0.45); rim.position.set(-5, 3, -4); scene.add(rim);

  var ground = new THREE.Mesh(new THREE.CircleGeometry(2.7, 44), new THREE.MeshStandardMaterial({ color: 0x2f6a48, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  var ring = new THREE.Mesh(new THREE.RingGeometry(2.55, 2.7, 52), new THREE.MeshBasicMaterial({ color: 0x8affc1, transparent: true, opacity: 0.38, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; scene.add(ring);

  var group = new THREE.Group(); scene.add(group);

  var STAGES = {
    bibit: { h: 0.75, tr: 0.05, fol: [[0.34, 0.9]], col: 0x8fd9bf, age: 2, co2: 9, coord: "-6.12210, 106.89241" },
    muda: { h: 1.55, tr: 0.095, fol: [[0.58, 1.25], [0.42, 1.68]], col: 0x57b97e, age: 8, co2: 34, coord: "-6.12217, 106.89259" },
    dewasa: { h: 2.5, tr: 0.17, fol: [[0.98, 1.85], [0.78, 2.45], [0.56, 2.95]], col: 0x2f8f5f, age: 18, co2: 58, coord: "-6.12231, 106.89272" },
  };
  function set(sel, html) { var el = document.querySelector(sel); if (el) el.innerHTML = html; }
  var sm = 'small style="font-family:var(--l-mono);font-size:9px;color:var(--muted)"';
  function build(key) {
    while (group.children.length) { var o = group.children[0]; group.remove(o); if (o.geometry) o.geometry.dispose(); }
    var c = STAGES[key];
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(c.tr * 0.55, c.tr, c.h, 8), new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.95 }));
    trunk.position.y = c.h / 2; group.add(trunk);
    c.fol.forEach(function (f) {
      var geo = new THREE.IcosahedronGeometry(f[0], 1), pos = geo.attributes.position;
      for (var k = 0; k < pos.count; k++) { var j = Math.sin(k * 12.9898) * 0.5 * f[0] * 0.18; pos.setXYZ(k, pos.getX(k) + j, pos.getY(k) + j * 0.5, pos.getZ(k) - j); }
      geo.computeVertexNormals();
      var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c.col, roughness: 0.85, flatShading: true }));
      m.position.y = f[1]; m.scale.set(1, 1.08, 1); group.add(m);
    });
    set("[data-t3age]", c.age + '<' + sm + '> thn</small>');
    set("[data-t3co2]", c.co2 + '<' + sm + '> kg</small>');
    var co = document.querySelector("[data-t3coord]"); if (co) co.textContent = c.coord;
  }

  /* interaction */
  var rot = 0.4, vel = 0, dragging = false, lastX = 0, idle = 0;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
  canvas.addEventListener("pointerdown", function (e) { dragging = true; lastX = e.clientX; idle = 0; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
  canvas.addEventListener("pointermove", function (e) { if (!dragging) return; var dx = e.clientX - lastX; lastX = e.clientX; rot += dx * 0.01; vel = dx * 0.01; });
  window.addEventListener("pointerup", function () { dragging = false; });
  document.querySelectorAll("[data-stage]").forEach(function (b) {
    b.addEventListener("click", function () { document.querySelectorAll("[data-stage]").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); build(b.dataset.stage); });
  });
  var buy = document.querySelector("[data-t3buy]");
  if (buy) buy.addEventListener("click", function (e) { e.preventDefault(); var t = document.querySelector("[data-toast]"); if (t) { t.textContent = "Miliki fraksi pohon (simulasi) — hubungkan wallet di konsol"; t.classList.add("show"); setTimeout(function () { t.classList.remove("show"); }, 2600); } });

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
  }
  var running = true;
  function loop() {
    if (!running) return;
    resize();
    if (dragging) { /* follow */ }
    else { idle++; if (Math.abs(vel) > 0.0002) { rot += vel; vel *= 0.93; } else if (!reduce && idle > 90) { rot += 0.004; } }
    group.rotation.y = rot; camera.lookAt(0, 1.3, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  if ("IntersectionObserver" in window) { new IntersectionObserver(function (es) { es.forEach(function (e) { running = e.isIntersecting; if (running) loop(); }); }, { threshold: 0.05 }).observe(canvas); }
  build("muda");
  loop();
})();
