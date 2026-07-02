/* =============================================================
   GLYIV — Three.js signature scenes
   #heroCanvas  -> bioluminescent "living orb" (Liv / carbon sphere)
   #globeCanvas -> carbon-network globe (Indonesia -> world)
   Loaded as ES module. Fails gracefully to CSS fallback.
   ============================================================= */
import * as THREE from "three";

const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Touch GPUs (phones/tablets) have far less fill-rate than a desktop. Cap render
// resolution lower there so a scene crossing the viewport mid-scroll can't drop frames.
const COARSE = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const capDPR = (x) => Math.min(window.devicePixelRatio || 1, COARSE ? Math.min(x, 1.3) : x);
const DPR = capDPR(1.75);
// True render-visibility: IntersectionObserver ignores visibility:hidden (e.g. the
// closed chat panel), so a hidden canvas would keep rendering ~60fps. We check
// visibility:hidden/display:none but NOT opacity, so opacity fade-in reveals still animate.
// checkVisibility() forces a SYNCHRONOUS LAYOUT on every call. Calling it once per
// animation frame inside every scene's render loop thrashes layout during scroll —
// it was the dominant cause of scroll jank on mobile. The only state it catches that
// the IntersectionObserver can't is an ancestor toggled to visibility:hidden (the
// closed chat panel), which changes on a click, not per frame. So cache the answer
// and re-test at most ~4x/second: imperceptible delay, ~94% fewer forced layouts.
const _visCache = new WeakMap();
const SHOWN = (c) => {
  if (typeof c.checkVisibility !== "function") return true;
  const now = performance.now();
  const e = _visCache.get(c);
  if (e && now - e.t < 250) return e.v;
  const v = c.checkVisibility({ checkVisibilityCSS: true });
  _visCache.set(c, { t: now, v });
  return v;
};

/* soft round sprite (shared) */
function dotTexture(inner = "#eafff4", outer = "rgba(51,209,136,0)") {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.35, "rgba(125,241,166,.9)");
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  return t;
}

function lerp(a, b, t) { return a + (b - a) * t; }

/* ---------- HERO: living carbon orb ---------- */
function initHeroOrb(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 3.25);

  const group = new THREE.Group();
  scene.add(group);

  // particle sphere (fibonacci)
  const N = window.innerWidth < 700 ? 1100 : 1700;
  const positions = new Float32Array(N * 3);
  const base = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const seeds = new Float32Array(N);
  const cTop = new THREE.Color("#c9ffe3");
  const cMid = new THREE.Color("#33d188");
  const cLow = new THREE.Color("#13573b");
  const cGold = new THREE.Color("#f5c451");
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    base[i * 3] = x; base[i * 3 + 1] = y; base[i * 3 + 2] = z;
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
    seeds[i] = Math.random() * 10;
    let col;
    if (Math.random() < 0.05) col = cGold;
    else { const t = (y + 1) / 2; col = t > 0.5 ? cTop.clone().lerp(cMid, (1 - t) * 2) : cMid.clone().lerp(cLow, (0.5 - t) * 2); }
    colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: window.innerWidth < 700 ? 0.045 : 0.04, sizeAttenuation: true, vertexColors: true,
    map: dotTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.95,
  });
  const points = new THREE.Points(geo, mat);
  group.add(points);

  // inner glow sprite
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture("#baffe0", "rgba(31,174,107,0)"), color: 0x1fae6b, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(2.4, 2.4, 1);
  group.add(glow);

  // wire icosahedron shell
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.32, 1)),
    new THREE.LineBasicMaterial({ color: 0x33d188, transparent: true, opacity: 0.1 })
  );
  group.add(wire);

  // orbiting motes
  const motes = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: i === 1 ? 0xf5c451 : 0x8affc1, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.scale.set(0.22, 0.22, 1);
    scene.add(m);
    motes.push({ s: m, rad: 1.6 + i * 0.22, speed: 0.5 + i * 0.25, tilt: i * 1.1, phase: i * 2 });
  }

  // pointer parallax
  const target = { x: 0, y: 0 };
  function onMove(e) {
    const p = e.touches ? e.touches[0] : e;
    target.x = (p.clientX / window.innerWidth - 0.5) * 0.6;
    target.y = (p.clientY / window.innerHeight - 0.5) * 0.6;
  }
  window.addEventListener("pointermove", onMove, { passive: true });

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();

  let visible = true;
  new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.01 }).observe(canvas);

  const clock = new THREE.Clock();
  const pos = geo.attributes.position.array;
  let fc = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || !SHOWN(canvas)) return;
    const t = clock.getElapsedTime();
    // breathe / morph — throttled to every other frame (heavy GPU buffer upload)
    if (!REDUCE && (fc++ & 1) === 0) {
      for (let i = 0; i < N; i++) {
        const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
        const s = seeds[i];
        const d = 1 + 0.075 * Math.sin(t * 1.1 + s) + 0.045 * Math.sin(t * 0.6 + s * 1.7);
        pos[i * 3] = bx * d; pos[i * 3 + 1] = by * d; pos[i * 3 + 2] = bz * d;
      }
      geo.attributes.position.needsUpdate = true;
    }
    group.rotation.y += 0.0016;
    group.rotation.x = lerp(group.rotation.x, target.y, 0.04);
    group.rotation.z = lerp(group.rotation.z, target.x * 0.3, 0.04);
    const pulse = 1 + Math.sin(t * 1.6) * 0.06;
    glow.scale.set(2.3 * pulse, 2.3 * pulse, 1);
    motes.forEach((o) => {
      const a = t * o.speed + o.phase;
      o.s.position.set(Math.cos(a) * o.rad, Math.sin(a * 0.8 + o.tilt) * 0.5, Math.sin(a) * o.rad);
      o.s.position.applyAxisAngle(new THREE.Vector3(1, 0.4, 0).normalize(), o.tilt);
    });
    renderer.render(scene, camera);
  }
  frame();
}

/* ---------- VISION: carbon-network globe ---------- */
function latLon(lat, lon, R) {
  const phi = (90 - lat) * Math.PI / 180;
  const th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-R * Math.sin(phi) * Math.cos(th), R * Math.cos(phi), R * Math.sin(phi) * Math.sin(th));
}
function worldMask() {
  const W = 400, H = 200, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#fff";
  const P = (lon, lat) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
  const blob = (lon, lat, rx, ry, rot) => { const [px, py] = P(lon, lat); x.beginPath(); x.ellipse(px, py, rx, ry, (rot || 0), 0, Math.PI * 2); x.fill(); };
  // North America
  blob(-103, 50, 32, 20, -0.3); blob(-92, 34, 20, 13); blob(-118, 60, 16, 11); blob(-78, 44, 13, 12); blob(-100, 23, 9, 7);
  // Central + South America
  blob(-84, 13, 7, 6); blob(-63, -12, 18, 24, 0.2); blob(-60, -33, 10, 12); blob(-72, 4, 9, 9);
  // Greenland
  blob(-42, 72, 12, 9);
  // Europe
  blob(12, 52, 15, 10); blob(26, 56, 12, 9); blob(5, 45, 8, 7);
  // Africa
  blob(18, 4, 20, 22, 0); blob(26, 12, 13, 11); blob(22, -22, 13, 13); blob(40, 8, 8, 9);
  // Asia
  blob(82, 52, 44, 22, 0.05); blob(108, 42, 26, 16); blob(70, 27, 19, 15); blob(100, 18, 15, 11); blob(132, 58, 20, 13); blob(48, 40, 14, 12);
  // Indonesia / SE Asia
  blob(112, -2, 16, 6); blob(135, -4, 9, 5); blob(122, 0, 8, 5);
  // Australia
  blob(134, -26, 19, 13);
  return c;
}
function initGlobe(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.4, 3.5);
  const group = new THREE.Group();
  group.rotation.z = 0.35; group.rotation.y = -0.4;
  scene.add(group);

  const R = 1;
  // dotted WORLD MAP — bright land dots + faint ocean dots for the sphere form
  const mask = worldMask(), mw = mask.width, mh = mask.height;
  const mdata = mask.getContext("2d").getImageData(0, 0, mw, mh).data;
  const isLand = (lat, lon) => { let u = Math.floor((lon + 180) / 360 * mw); u = ((u % mw) + mw) % mw; let v = Math.max(0, Math.min(mh - 1, Math.floor((90 - lat) / 180 * mh))); return mdata[(v * mw + u) * 4] > 120; };
  const SAMP = window.innerWidth < 700 ? 7000 : 13000;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const land = [], ocean = [];
  for (let i = 0; i < SAMP; i++) {
    const y = 1 - (i / (SAMP - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    const lat = Math.asin(y) * 180 / Math.PI, lon = Math.atan2(z, x) * 180 / Math.PI;
    if (isLand(lat, lon)) land.push(x * R, y * R, z * R);
    else if (i % 7 === 0) ocean.push(x * R, y * R, z * R);
  }
  const mkPoints = (arr, opt) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(arr), 3)); return new THREE.Points(g, new THREE.PointsMaterial(opt)); };
  group.add(mkPoints(ocean, { size: 0.012, color: 0x1c7a52, transparent: true, opacity: 0.26, map: dotTexture("#7df1a6", "rgba(31,174,107,0)"), depthWrite: false }));
  const planet = mkPoints(land, { size: 0.021, color: 0x33d188, transparent: true, opacity: 0.95, map: dotTexture("#aaffd0", "rgba(51,209,136,0)"), depthWrite: false });
  group.add(planet);

  // faint shell
  group.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 32, 32), new THREE.MeshBasicMaterial({ color: 0x062016, transparent: true, opacity: 0.55 })));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(R * 1.003, 18, 14)), new THREE.LineBasicMaterial({ color: 0x33d188, transparent: true, opacity: 0.06 })));

  const cities = {
    makassar: [-5.15, 119.43], jakarta: [-6.2, 106.85], surabaya: [-7.25, 112.75],
    medan: [3.6, 98.67], bandung: [-6.9, 107.6], bali: [-8.65, 115.22],
    singapore: [1.35, 103.82], tokyo: [35.68, 139.69], frankfurt: [50.11, 8.68],
    sf: [37.77, -122.42], sydney: [-33.87, 151.21],
  };
  // node markers
  const nodeTex = dotTexture("#fff7e0", "rgba(245,196,81,0)");
  Object.entries(cities).forEach(([k, c]) => {
    const v = latLon(c[0], c[1], R * 1.02);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: k === "makassar" ? nodeTex : dotTexture(), color: k === "makassar" ? 0xf5c451 : 0x8affc1, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.position.copy(v); sp.scale.set(k === "makassar" ? 0.16 : 0.1, k === "makassar" ? 0.16 : 0.1, 1);
    group.add(sp);
  });

  // arcs (domestic -> global), each with a traveling pulse
  const pairs = [
    ["makassar", "jakarta"], ["makassar", "surabaya"], ["makassar", "bali"], ["makassar", "medan"], ["makassar", "bandung"],
    ["jakarta", "singapore"], ["singapore", "tokyo"], ["singapore", "frankfurt"], ["frankfurt", "sf"], ["jakarta", "sydney"], ["tokyo", "sf"],
  ];
  const arcs = [];
  pairs.forEach(([a, b], idx) => {
    const va = latLon(cities[a][0], cities[a][1], R * 1.01);
    const vb = latLon(cities[b][0], cities[b][1], R * 1.01);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    const lift = 1 + va.distanceTo(vb) * 0.35;
    mid.normalize().multiplyScalar(R * lift);
    const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    const domestic = a === "makassar";
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 44, 0.0035, 6, false),
      new THREE.MeshBasicMaterial({ color: domestic ? 0x8affc1 : 0x33d188, transparent: true, opacity: domestic ? 0.5 : 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(tube);
    const pulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: domestic ? 0xf5c451 : 0x8affc1, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pulse.scale.set(0.085, 0.085, 1); group.add(pulse);
    arcs.push({ curve, pulse, speed: 0.16 + (idx % 4) * 0.04, off: Math.random() });
  });

  const target = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => { const p = e.touches ? e.touches[0] : e; target.x = (p.clientX / window.innerWidth - 0.5) * 0.5; target.y = (p.clientY / window.innerHeight - 0.5) * 0.4; }, { passive: true });

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  let visible = true;
  new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.01 }).observe(canvas);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || !SHOWN(canvas)) return;
    const t = clock.getElapsedTime();
    group.rotation.y += REDUCE ? 0 : 0.0011;
    group.rotation.x = lerp(group.rotation.x, target.y, 0.03);
    arcs.forEach((o) => { const tt = (t * o.speed + o.off) % 1; o.pulse.position.copy(o.curve.getPoint(tt)); });
    renderer.render(scene, camera);
  }
  frame();
}

/* ---------- MASALAH: 3D café diorama (2 floors, stairs, people, queue vs seated) ---------- */
function initCafe(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(capDPR(1.25)); // small stage, opaque fill -> cap DPR for fill-rate
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(8.4, 7.2, 10.2);
  camera.lookAt(0, 1.5, -0.4);
  scene.add(new THREE.AmbientLight(0x9affd0, 0.78));
  const d1 = new THREE.DirectionalLight(0xffffff, 1.05); d1.position.set(7, 12, 6); scene.add(d1);

  const root = new THREE.Group(); scene.add(root);
  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  function box(w, h, dp, c, x, y, z, o) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), M(c, o)); m.position.set(x, y, z); root.add(m); return m; }

  // floors
  box(9, 0.3, 6, 0x0c3325, 0, 0, 0);
  box(9, 0.3, 3.3, 0x10402d, 0, 2.6, -1.35);
  // walls
  box(9, 3.6, 0.2, 0x07241a, 0, 1.8, -3);
  box(0.2, 3.6, 6, 0x081f16, -4.5, 1.8, 0);
  // mezzanine railing + posts
  box(9, 0.1, 0.1, 0x33d188, 0, 3.05, 0.05, { emissive: 0x145c3f, emissiveIntensity: 0.35 });
  for (let i = -4; i <= 4; i += 1) box(0.06, 0.5, 0.06, 0x1f7a52, i, 2.85, 0.05);
  // counter / cashier
  box(2.5, 1.05, 0.85, 0x16563a, 2.5, 0.68, 1.7);
  box(2.5, 0.1, 0.85, 0x1f9d63, 2.5, 1.21, 1.7);
  box(0.6, 0.32, 0.45, 0x0c2c1e, 2.7, 1.36, 1.7);
  // stairs (left)
  for (let i = 0; i < 7; i++) box(1.5, 0.28, 0.44, i % 2 ? 0x123f2c : 0x18603f, -3.1, 0.3 + i * 0.37, 1.5 - i * 0.3);

  function person(shirt, capCol) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.23, 0.66, 10), M(shirt)); body.position.y = 0.5;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), M(0xf0c49b)); head.position.y = 0.96;
    g.add(body, head);
    if (capCol != null) { const cp = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 8, 0, 6.3, 0, 1.5), M(capCol)); cp.position.y = 1.0; g.add(cp); }
    return g;
  }
  function tableAt(x, z, y) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 18), M(0xe6dcc4)); top.position.y = 0.72;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.72, 8), M(0x0c2c1e)); leg.position.y = 0.36;
    g.add(top, leg); g.position.set(x, y, z); root.add(g); return g;
  }

  const TBL = [
    [-1.4, 1.5, 0.15], [0.5, 2.6, 0.15], [-2.7, 0.4, 0.15],
    [-1.1, -1.5, 2.75], [1.3, -2.1, 2.75], [0.1, -0.9, 2.75],
  ];
  TBL.forEach((t) => tableAt(t[0], t[1], t[2]));

  // always-present barista behind counter
  const barista = person(0x1f9d63, 0x0e3a28); barista.position.set(2.95, 0.15, 2.25); barista.rotation.y = -0.5; root.add(barista);

  // PROBLEM state: queue + stair walker
  const problem = [];
  const qcol = [0xe8743b, 0xd9682f, 0xc75c39, 0xe0a92b];
  for (let i = 0; i < 4; i++) { const p = person(qcol[i]); p.position.set(1.15 - i * 0.6, 0.15, 1.6); p.userData.baseY = 0.15; root.add(p); problem.push(p); }
  const walker = person(0xe8743b); walker.position.set(-3.1, 2.75, -0.2); root.add(walker);

  // SOLUTION state: seated patrons + phone glow per table
  const seated = [], phones = [];
  const scol = [0x33d188, 0x46ad79, 0x7fcca0];
  TBL.forEach((t, i) => {
    const p = person(scol[i % 3]); p.position.set(t[0] + 0.55, t[2], t[1] + 0.15); p.userData.baseY = t[2]; root.add(p); seated.push(p);
    const ph = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.29, 0.03), M(0x8affc1, { emissive: 0x33d188, emissiveIntensity: 0.8 }));
    ph.position.set(t[0], t[2] + 1.25, t[1]); ph.userData.base = t[2] + 1.25; root.add(ph); phones.push(ph);
  });

  let mix = 0, target = 0;
  canvas.__setCafe = (on) => { target = on ? 1 : 0; };

  // drag-to-rotate (turntable) + vertical tilt
  let dragging = false, lastX = 0, lastY = 0, userRotY = 0, userTilt = 0, interacted = false;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; interacted = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = "grabbing"; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
  const endDrag = () => { dragging = false; canvas.style.cursor = "grab"; };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointermove", (e) => { if (!dragging) return; userRotY += (e.clientX - lastX) * 0.006; userTilt = Math.max(-1.6, Math.min(2.2, userTilt + (e.clientY - lastY) * 0.012)); lastX = e.clientX; lastY = e.clientY; });

  // speech bubbles (HTML overlays projected from 3D)
  const cbA = document.getElementById("cbA"), cbB = document.getElementById("cbB");
  const _v = new THREE.Vector3();
  function placeBubble(el, obj, yOff, op) {
    if (!el) return;
    if (op < 0.05) { el.style.opacity = "0"; return; }
    obj.getWorldPosition(_v); _v.y += yOff; _v.project(camera);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const px = Math.max(96, Math.min(w - 96, (_v.x * 0.5 + 0.5) * w));
    const py = Math.max(34, (-_v.y * 0.5 + 0.5) * h);
    el.style.left = px.toFixed(0) + "px";
    el.style.top = py.toFixed(0) + "px";
    el.style.opacity = (_v.z < 1 ? op : 0).toFixed(2);
  }
  let bubbleState = -1;

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  let visible = true;
  new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.01 }).observe(canvas);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || !SHOWN(canvas)) return;
    const t = clock.getElapsedTime();
    mix += (target - mix) * 0.07;
    const inv = Math.max(0, 1 - mix);
    problem.forEach((p, i) => { p.scale.setScalar(inv); p.visible = inv > 0.02; p.position.y = p.userData.baseY + (REDUCE ? 0 : Math.sin(t * 2 + i) * 0.02); });
    walker.scale.setScalar(inv); walker.visible = inv > 0.02;
    const wt = REDUCE ? 0.5 : (t * 0.16) % 1;
    walker.position.set(-3.1, 2.62 - wt * 2.3, -0.15 + wt * 1.85);
    seated.forEach((p, i) => { p.scale.setScalar(mix); p.visible = mix > 0.02; p.position.y = p.userData.baseY + (REDUCE ? 0 : Math.sin(t * 1.8 + i) * 0.02); });
    phones.forEach((ph, i) => { ph.scale.setScalar(mix); ph.visible = mix > 0.02; ph.position.y = ph.userData.base + (REDUCE ? 0 : Math.sin(t * 2.4 + i) * 0.05); ph.rotation.y = t * 0.9 + i; });
    camera.position.y = 7.2 - userTilt; camera.lookAt(0, 1.5, -0.4);
    root.rotation.y = userRotY + (interacted || REDUCE ? 0 : Math.sin(t * 0.14) * 0.07);
    // speech bubbles: pain points (problem) vs benefits (solution)
    const probOp = Math.max(0, 1 - mix * 2), solOp = Math.max(0, (mix - 0.5) * 2);
    if (probOp >= solOp) {
      if (bubbleState !== 0) { cbA.textContent = "Aduh, turun tangga lagi 😮‍💨"; cbA.className = "cafe-bubble warn"; cbB.textContent = "Aduh, harus antri 😩"; cbB.className = "cafe-bubble warn"; bubbleState = 0; }
      placeBubble(cbA, walker, 1.0, probOp); placeBubble(cbB, problem[1], 1.25, probOp);
    } else {
      if (bubbleState !== 1) { cbA.textContent = "Pesan dari meja ✨"; cbA.className = "cafe-bubble good"; cbB.textContent = "Tanpa antri 🎉"; cbB.className = "cafe-bubble good"; bubbleState = 1; }
      placeBubble(cbA, seated[3], 1.3, solOp); placeBubble(cbB, seated[0], 1.3, solOp);
    }
    renderer.render(scene, camera);
  }
  frame();
}

/* ---------- LIV-BOT: TITAN-style 3D website assistant (crystal core + eye + rings + vocoder) ---------- */
function initLivBot(canvas, framing) {
  const ACC = new THREE.Color("#33d188");
  const GOLD = new THREE.Color("#f5c451");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(capDPR(1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  if (framing === "full") { camera.position.set(0, 0.18, 6.2); camera.lookAt(0, 0.05, 0); }
  else { camera.position.set(0, 0.05, 5.8); camera.lookAt(0, 0.02, 0); }

  const keep = [];
  const k = (x) => { keep.push(x); return x; };
  const std = (h, o = {}) => k(new THREE.MeshStandardMaterial({ color: new THREE.Color(h), roughness: o.rough ?? 0.4, metalness: o.metal ?? 0.6, emissive: new THREE.Color(o.emissive ?? 0x000000), emissiveIntensity: o.ei ?? 1, flatShading: o.flat ?? false }));
  const glow = (h, op = 1) => k(new THREE.MeshBasicMaterial({ color: new THREE.Color(h), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
  const EYE_Z = 0.92;

  const titan = new THREE.Group(); scene.add(titan);
  const head = new THREE.Group(); titan.add(head);
  // bio-crystal "seed" core (dodecahedron, slightly elongated) — distinct from the koios icosahedron
  const core = new THREE.Mesh(k(new THREE.DodecahedronGeometry(0.9, 0)), std("#08251a", { rough: 0.3, metal: 0.55, emissive: ACC, ei: 0.2, flat: true })); core.scale.set(1, 1.08, 1); head.add(core);
  const wire = new THREE.LineSegments(k(new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(0.93, 0))), k(new THREE.LineBasicMaterial({ color: ACC, transparent: true, opacity: 0.85 }))); wire.scale.set(1, 1.08, 1); head.add(wire);
  const inner = new THREE.Mesh(k(new THREE.IcosahedronGeometry(0.48, 0)), std("#0c3a28", { rough: 0.2, metal: 0.4, emissive: GOLD, ei: 0.5, flat: true })); head.add(inner);

  const eyeGrp = new THREE.Group(); eyeGrp.position.set(0, 0.08, EYE_Z); head.add(eyeGrp);
  eyeGrp.add(new THREE.Mesh(k(new THREE.CircleGeometry(0.34, 28)), std("#03120c", { rough: 0.6, metal: 0.2, emissive: ACC, ei: 0.12 })));
  const iris = new THREE.Mesh(k(new THREE.CircleGeometry(0.26, 28)), glow(ACC, 0.85)); iris.position.z = 0.02; eyeGrp.add(iris);
  const pupil = new THREE.Mesh(k(new THREE.CircleGeometry(0.12, 24)), k(new THREE.MeshBasicMaterial({ color: 0xf2fff5, transparent: true }))); pupil.position.z = 0.03; eyeGrp.add(pupil);
  const eyeRing = new THREE.Mesh(k(new THREE.RingGeometry(0.3, 0.36, 32)), glow("#ffffff", 0.5)); eyeRing.position.z = 0.015; eyeGrp.add(eyeRing);
  const bars = [];
  for (let i = 0; i < 5; i++) { const bar = new THREE.Mesh(k(new THREE.BoxGeometry(0.052, 0.2, 0.04)), glow(ACC, 0.95)); bar.position.set(-0.16 + i * 0.08, 0, 0.045); bar.scale.y = 0.001; eyeGrp.add(bar); bars.push(bar); }
  const brow = new THREE.Mesh(k(new THREE.TorusGeometry(0.42, 0.035, 8, 24, Math.PI)), std("#08251a", { emissive: ACC, ei: 0.6, metal: 0.8, rough: 0.3 })); brow.position.set(0, 0.14, EYE_Z - 0.02); head.add(brow);
  const mouth = new THREE.Mesh(k(new THREE.BoxGeometry(0.4, 0.045, 0.05)), glow(ACC, 0.85)); mouth.position.set(0, -0.34, EYE_Z - 0.04); head.add(mouth);

  // leaf shape (reused for orbiting leaves + sprout)
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0); leafShape.bezierCurveTo(0.17, 0.13, 0.17, 0.36, 0, 0.52); leafShape.bezierCurveTo(-0.17, 0.36, -0.17, 0.13, 0, 0);
  const leafGeo = k(new THREE.ShapeGeometry(leafShape));
  const leafMat = std("#1faf6b", { emissive: ACC, ei: 0.55, rough: 0.45, metal: 0.1 }); leafMat.side = THREE.DoubleSide;
  const leafMatGold = std("#c9a23c", { emissive: GOLD, ei: 0.4, rough: 0.5, metal: 0.2 }); leafMatGold.side = THREE.DoubleSide;

  // single thin orbit ring (vine) + traveling node
  const ring1 = new THREE.Mesh(k(new THREE.TorusGeometry(1.5, 0.02, 8, 90)), std("#08251a", { emissive: ACC, ei: 0.85, metal: 0.6, rough: 0.3 })); ring1.rotation.set(Math.PI / 2.1, 0, 0.2); titan.add(ring1);
  const node = new THREE.Mesh(k(new THREE.SphereGeometry(0.06, 12, 12)), glow("#ffffff", 0.95)); titan.add(node);

  // orbiting leaves (replace the geometric shards)
  const leaves = [];
  for (let i = 0; i < 6; i++) {
    const lf = new THREE.Mesh(leafGeo, i % 3 === 0 ? leafMatGold : leafMat);
    lf.userData = { a: (i / 6) * Math.PI * 2, rad: 1.42 + (i % 2) * 0.22, yr: (i % 3 - 1) * 0.55, sp: 0.16 + (i % 3) * 0.05, t: i };
    lf.scale.setScalar(0.78 + (i % 2) * 0.28); titan.add(lf); leaves.push(lf);
  }

  // sprout growing from the crown
  const sprout = new THREE.Group(); sprout.position.set(0, 0.82, 0.16); head.add(sprout);
  const stem = new THREE.Mesh(k(new THREE.CylinderGeometry(0.018, 0.032, 0.34, 6)), std("#2a7d52", { emissive: ACC, ei: 0.4, rough: 0.6 })); stem.position.y = 0.17; sprout.add(stem);
  const sLeafL = new THREE.Mesh(leafGeo, leafMat); sLeafL.position.set(-0.02, 0.26, 0); sLeafL.scale.setScalar(0.62); sLeafL.rotation.z = 0.6; sprout.add(sLeafL);
  const sLeafR = new THREE.Mesh(leafGeo, leafMat); sLeafR.position.set(0.02, 0.22, 0); sLeafR.scale.setScalar(0.62); sLeafR.rotation.z = -0.6; sprout.add(sLeafR);

  // drifting spores
  const spN = 50, spPos = new Float32Array(spN * 3);
  for (let i = 0; i < spN; i++) { const rr = 1.55 + Math.random() * 1.15, th = Math.random() * Math.PI * 2; spPos[i * 3] = Math.cos(th) * rr; spPos[i * 3 + 1] = (Math.random() - 0.5) * 2.6; spPos[i * 3 + 2] = Math.sin(th) * rr; }
  const spGeo = k(new THREE.BufferGeometry()); spGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
  const spores = new THREE.Points(spGeo, k(new THREE.PointsMaterial({ size: 0.05, map: dotTexture("#bfffd9", "rgba(51,209,136,0)"), color: 0x8affc1, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }))); titan.add(spores);

  const halo = new THREE.Mesh(k(new THREE.CircleGeometry(1.7, 40)), glow(ACC, 0.1)); halo.position.z = -1.2; scene.add(halo);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-2.4, 3, 4); scene.add(key);
  const rim = new THREE.PointLight(ACC.getHex(), 14, 12); rim.position.set(2.2, -1, 2.6); scene.add(rim);
  const rim2 = new THREE.PointLight(GOLD.getHex(), 7, 12); rim2.position.set(-2.5, 1.5, -2); scene.add(rim2);

  if (!window.glyivBot) { window.__botSpeaking = false; window.glyivBot = { speak(on) { window.__botSpeaking = !!on; } }; }

  let tRY = 0, tRX = 0, cRY = 0, cRX = 0, blink = 1, blinkT = 1, spinBoost = 0;
  let action = null, actionStart = 0;
  const DUR = { pulse: 1100, nod: 900, spin: 1700 };
  const timers = [];
  const play = (a) => { action = a; actionStart = performance.now(); };
  let rect = canvas.getBoundingClientRect(), rectRaf = 0;
  const refreshRect = () => { rectRaf = 0; rect = canvas.getBoundingClientRect(); };
  const invalidate = () => { if (!rectRaf) rectRaf = requestAnimationFrame(refreshRect); };
  const onMove = (e) => { const nx = Math.max(-1, Math.min(1, (e.clientX - (rect.left + rect.width / 2)) / 420)); const ny = Math.max(-1, Math.min(1, (e.clientY - (rect.top + rect.height / 2)) / 420)); tRY = nx * 0.6; tRX = ny * 0.4; };
  if (!REDUCE) {
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate);
    const blinkLoop = () => timers.push(setTimeout(() => { blinkT = 0.08; timers.push(setTimeout(() => (blinkT = 1), 120)); blinkLoop(); }, 2600 + Math.random() * 3600));
    const behav = () => timers.push(setTimeout(() => { if (!action) { const pool = ["pulse", "pulse", "nod", "nod", "spin"]; play(pool[Math.floor(Math.random() * pool.length)]); } behav(); }, 4200 + Math.random() * 4400));
    blinkLoop(); behav(); timers.push(setTimeout(() => play("pulse"), 420));
  } else { head.rotation.set(-0.05, -0.2, 0); }

  function resize() { const w = canvas.clientWidth || canvas.parentElement.clientWidth, h = canvas.clientHeight || canvas.parentElement.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); rect = canvas.getBoundingClientRect(); if (REDUCE) renderer.render(scene, camera); }
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  let visible = true; new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.01 }).observe(canvas);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || REDUCE || !SHOWN(canvas)) return;
    const now = performance.now();
    cRY += (tRY - cRY) * 0.09; cRX += (tRX - cRX) * 0.09;
    let nod = 0, pulse = 0, eyeFlash = 0;
    if (action) { const p = (now - actionStart) / DUR[action]; if (p >= 1) action = null; else { const env = Math.sin(p * Math.PI); if (action === "pulse") { pulse = env; eyeFlash = env; } else if (action === "nod") nod = Math.sin(p * Math.PI * 2) * 0.32; else if (action === "spin") spinBoost = env * 0.5; } }
    head.rotation.y = cRY; head.rotation.x = cRX + nod;
    titan.position.y = Math.sin(now * 0.0014) * 0.05;
    const breath = 1 + Math.sin(now * 0.0016) * 0.015 + pulse * 0.06;
    core.scale.set(breath, breath * 1.08, breath); wire.scale.set(breath * 1.01, breath * 1.09, breath * 1.01);
    core.rotation.y += 0.004; core.rotation.x += 0.0016; inner.rotation.y -= 0.012; inner.rotation.z += 0.008;
    blink += (blinkT - blink) * 0.5; eyeGrp.scale.y = blink;
    const sp = window.__botSpeaking;
    const irisM = iris.material, pupilM = pupil.material;
    if (sp) { irisM.opacity += (0.3 - irisM.opacity) * 0.2; pupilM.opacity += (0 - pupilM.opacity) * 0.3; bars.forEach((bar, i) => { const o = Math.abs(Math.sin(now * 0.013 + i * 1.15)); bar.scale.y += (0.35 + o * 2.6 - bar.scale.y) * 0.4; }); }
    else { const bi = 0.7 + eyeFlash * 0.3; irisM.opacity += (bi - irisM.opacity) * 0.25; pupilM.opacity += (1 - pupilM.opacity) * 0.25; bars.forEach((bar) => (bar.scale.y += (0.001 - bar.scale.y) * 0.3)); }
    const mouthM = mouth.material;
    if (sp) { const o = Math.abs(Math.sin(now * 0.017)); mouth.scale.set(0.4 + o * 0.9, 1 + o * 1.6, 1); mouthM.opacity = 0.85; }
    else { mouth.scale.x += (1 - mouth.scale.x) * 0.2; mouth.scale.y += (1 - mouth.scale.y) * 0.2; mouthM.opacity += (0.4 - mouthM.opacity) * 0.2; }
    core.material.emissiveIntensity = 0.18 + pulse * 0.5 + (sp ? 0.12 : 0);
    const rs = 0.005 + spinBoost; ring1.rotation.z += rs;
    const na = now * (0.0012 + spinBoost * 0.4); node.position.set(Math.cos(na) * 1.5, Math.sin(na) * 0.5, Math.sin(na) * 1.5);
    leaves.forEach((lf) => { const d = lf.userData; d.a += d.sp * 0.016 * (1 + spinBoost * 2); const x = Math.cos(d.a) * d.rad, z = Math.sin(d.a) * d.rad; lf.position.set(x, d.yr + Math.sin(now * 0.0013 + d.t) * 0.18, z); lf.rotation.set(Math.sin(now * 0.002 + d.t) * 0.5, d.a + Math.PI / 2, Math.cos(now * 0.0018 + d.t) * 0.4 + 0.3); });
    sprout.rotation.z = Math.sin(now * 0.0015) * 0.12; sLeafL.rotation.x = Math.sin(now * 0.003) * 0.2; sLeafR.rotation.x = Math.sin(now * 0.003 + 1) * 0.2;
    spores.rotation.y += 0.0009; spores.position.y = Math.sin(now * 0.0009) * 0.1;
    spinBoost *= 0.96;
    renderer.render(scene, camera);
  }
  if (REDUCE) renderer.render(scene, camera); else frame();
}

/* ---------- (legacy barista 3D — unused) ---------- */
function initLiv(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(capDPR(1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
  camera.position.set(0, 0.85, 8.2); camera.lookAt(0, 0.85, 0);
  scene.add(new THREE.AmbientLight(0xbfe6d2, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(3.5, 5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x33d188, 0.7); rim.position.set(-4, 2, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x8affc1, 0.3); fill.position.set(-2, 1, 4); scene.add(fill);

  function logoTex(txt) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    x.fillStyle = "#f6fbf4"; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#15623f"; x.font = '800 78px "Bricolage Grotesque", sans-serif'; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, 64, 70);
    const t = new THREE.CanvasTexture(c); return t;
  }
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0.04, ...o });
  const skinMat = mat(0xf1c79c, { roughness: 0.65 });
  const shirtMat = mat(0x17593c);
  const apronMat = mat(0x1f9d63, { roughness: 0.82 });
  const capMat = mat(0x0e3a28);
  const brimMat = mat(0x0a2c1f);
  const hairMat = mat(0x2a1a0e, { roughness: 0.95 });
  const dark = new THREE.MeshBasicMaterial({ color: 0x20140c });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const liv = new THREE.Group(); scene.add(liv);
  const body = new THREE.Group(); liv.add(body);
  const head = new THREE.Group(); head.position.y = 1.95; liv.add(head);

  const sh = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshBasicMaterial({ color: 0x020c07, transparent: true, opacity: 0.32 }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = -1.2; liv.add(sh);

  // torso, neck
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 1.0, 8, 16), shirtMat); torso.position.y = 0.1; torso.scale.set(1, 1, 0.82); body.add(torso);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.5, 16), skinMat); neck.position.y = 1.05; body.add(neck);
  // apron
  const apron = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.7, 0.14), apronMat); apron.position.set(0, 0.05, 0.74); body.add(apron);
  const bib = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.62, 0.14), apronMat); bib.position.set(0, 0.98, 0.7); body.add(bib);
  const strapG = new THREE.BoxGeometry(0.13, 0.72, 0.1);
  const sL = new THREE.Mesh(strapG, apronMat); sL.position.set(-0.34, 1.18, 0.66); sL.rotation.z = 0.22; body.add(sL);
  const sR = new THREE.Mesh(strapG, apronMat); sR.position.set(0.34, 1.18, 0.66); sR.rotation.z = -0.22; body.add(sR);
  const apronLogoMat = new THREE.MeshBasicMaterial({ transparent: true, map: logoTex("G") });
  const apronLogo = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), apronLogoMat); apronLogo.position.set(0, 0.1, 0.82); body.add(apronLogo);
  // arms
  const armG = new THREE.CapsuleGeometry(0.24, 0.85, 6, 12);
  const armL = new THREE.Mesh(armG, shirtMat); armL.position.set(-1.02, 0.2, 0); armL.rotation.z = 0.28; body.add(armL);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), skinMat); handL.position.set(-1.26, -0.42, 0); body.add(handL);
  const armRG = new THREE.Group(); armRG.position.set(0.95, 0.6, 0); body.add(armRG);
  const armR = new THREE.Mesh(armG, shirtMat); armR.position.set(0.18, 0.35, 0); armR.rotation.z = -0.55; armRG.add(armR);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), skinMat); handR.position.set(0.55, 0.82, 0); armRG.add(handR);

  // head
  const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 28), skinMat); skull.scale.set(1, 1.05, 0.96); head.add(skull);
  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), skinMat); earL.position.set(-0.98, 0, 0); head.add(earL);
  const earR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), skinMat); earR.position.set(0.98, 0, 0); head.add(earR);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(1.01, 24, 20), hairMat); hairBack.scale.set(1.02, 1.04, 0.95); hairBack.position.set(0, 0.08, -0.12); head.add(hairBack);
  const hairF = new THREE.Group(); hairF.visible = false; head.add(hairF);
  [-1, 1].forEach((s) => { const lk = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.1, 6, 10), hairMat); lk.position.set(s * 0.86, -0.65, -0.12); hairF.add(lk); });
  // cap
  const capG = new THREE.Group(); capG.position.y = 0.32; head.add(capG);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.07, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), capMat); dome.scale.set(1, 0.92, 1); capG.add(dome);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.1, 28, 1, false, 0, Math.PI), brimMat); brim.rotation.x = -0.34; brim.position.set(0, -0.08, 0.74); brim.scale.set(1, 1, 1.4); capG.add(brim);
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), brimMat); button.position.y = 0.62; capG.add(button);
  const capLogoMat = new THREE.MeshBasicMaterial({ transparent: true, map: logoTex("G") });
  const capLogo = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), capLogoMat); capLogo.position.set(0, 0.12, 0.96); capLogo.rotation.x = -0.06; capG.add(capLogo);
  // eyes
  const eyeG = new THREE.Group(); head.add(eyeG);
  function eye(x) {
    const g = new THREE.Group(); g.position.set(x, 0.04, 0.9);
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), white); w.scale.set(1, 1.12, 0.45); g.add(w);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), dark); p.position.z = 0.08; g.add(p);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), white); hl.position.set(0.035, 0.05, 0.16); g.add(hl);
    g.userData.p = p; eyeG.add(g); return g;
  }
  const eL = eye(-0.37), eR = eye(0.37);
  const browG = new THREE.BoxGeometry(0.34, 0.07, 0.07);
  const bL = new THREE.Mesh(browG, hairMat); bL.position.set(-0.37, 0.34, 0.92); head.add(bL);
  const bR = new THREE.Mesh(browG, hairMat); bR.position.set(0.37, 0.34, 0.92); head.add(bR);
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff8f7a, transparent: true, opacity: 0.3 });
  [-1, 1].forEach((s) => { const c = new THREE.Mesh(new THREE.CircleGeometry(0.17, 16), cheekMat); c.position.set(s * 0.56, -0.26, 0.86); head.add(c); });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), new THREE.MeshBasicMaterial({ color: 0x6b2f1c })); mouth.position.set(0, -0.5, 0.9); mouth.scale.set(1.3, 0.18, 0.45); head.add(mouth);

  const darken = (hex) => new THREE.Color(hex).multiplyScalar(0.65);
  let talking = false;
  window.glyivLiv = {
    apron(c) { apronMat.color.set(c); },
    cap(c) { capMat.color.set(c); brimMat.color.copy(darken(c)); button.material.color.copy(darken(c)); },
    logo(v) { apronLogoMat.map.dispose(); apronLogoMat.map = logoTex(v); apronLogoMat.needsUpdate = true; capLogoMat.map.dispose(); capLogoMat.map = logoTex(v); capLogoMat.needsUpdate = true; },
    gender(g) { hairF.visible = g === "f"; },
    talk(on) { talking = on; },
  };

  const target = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => { target.x = (e.clientX / window.innerWidth - 0.5) * 2; target.y = (e.clientY / window.innerHeight - 0.5) * 2; }, { passive: true });

  function resize() { const w = canvas.clientWidth || canvas.parentElement.clientWidth, h = canvas.clientHeight || canvas.parentElement.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  let visible = true; new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.01 }).observe(canvas);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || !SHOWN(canvas)) return;
    const t = clock.getElapsedTime();
    head.rotation.y += (target.x * 0.55 - head.rotation.y) * 0.08;
    head.rotation.x += (target.y * 0.3 - head.rotation.x) * 0.08;
    body.rotation.y += (target.x * 0.18 - body.rotation.y) * 0.06;
    eL.userData.p.position.x = eR.userData.p.position.x = target.x * 0.05;
    eL.userData.p.position.y = eR.userData.p.position.y = -target.y * 0.04;
    liv.position.y = REDUCE ? 0 : Math.sin(t * 1.4) * 0.05;
    const blink = (t % 4) > 3.9 ? 0.12 : 1; eL.scale.y = eR.scale.y = blink;
    armRG.rotation.z = REDUCE ? 0 : -0.05 + Math.sin(t * 2.2) * 0.16;
    const openTarget = talking ? 0.2 + Math.abs(Math.sin(t * 16)) * 0.72 : 0.18;
    mouth.scale.y += (openTarget - mouth.scale.y) * 0.5;
    renderer.render(scene, camera);
  }
  frame();
}

/* ---------- LIV-HOST: stylized 3D café host (mouse-follow, blink, wave, talk) ---------- */
function makeLogoTexture(glyph) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d");
  x.fillStyle = "#f6fbf4"; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#15623f"; x.textAlign = "center"; x.textBaseline = "middle";
  x.font = "800 78px Bricolage Grotesque, Inter, sans-serif";
  x.fillText(glyph || "G", 64, 70);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function initLivHost(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(capDPR(1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.42, 4.15); camera.lookAt(0, 1.12, 0);

  const keep = [];
  const M = (h, o = {}) => { const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(h), roughness: o.r ?? 0.85, metalness: o.m ?? 0, emissive: new THREE.Color(o.e ?? 0x000000), emissiveIntensity: o.ei ?? 1, flatShading: !!o.flat }); keep.push(m); return m; };
  const G = (g) => { keep.push(g); return g; };

  const skinM = M("#f1c69c", { r: 0.9 }), hairM = M("#241a12", { r: 0.95 });
  const shirtM = M("#17593c", { r: 0.8 }), apronM = M("#1f9d63", { r: 0.7 });
  const capM = M("#0e3a28", { r: 0.6 }), eyeM = M("#1c1109", { r: 0.4 });
  const browM = M("#3a2614", { r: 0.7 });
  let apronLogoTex = makeLogoTexture("G"), capLogoTex = makeLogoTexture("G");
  const apronBadgeM = new THREE.MeshBasicMaterial({ map: apronLogoTex, transparent: true });
  const capBadgeM = new THREE.MeshBasicMaterial({ map: capLogoTex, transparent: true });
  keep.push(apronBadgeM, capBadgeM);

  const host = new THREE.Group(); scene.add(host);
  const upper = new THREE.Group(); host.add(upper);

  // torso
  const torso = new THREE.Mesh(G(new THREE.CapsuleGeometry(0.5, 0.62, 8, 24)), shirtM);
  torso.position.y = 0.62; torso.scale.set(1.18, 1, 0.82); upper.add(torso);
  // neck
  const neck = new THREE.Mesh(G(new THREE.CylinderGeometry(0.17, 0.2, 0.22, 18)), skinM);
  neck.position.y = 1.14; upper.add(neck);
  // apron slab + bib + straps + badge
  const apron = new THREE.Mesh(G(new THREE.CapsuleGeometry(0.4, 0.5, 6, 20)), apronM);
  apron.position.set(0, 0.5, 0.36); apron.scale.set(1, 1, 0.2); upper.add(apron);
  const bib = new THREE.Mesh(G(new THREE.BoxGeometry(0.44, 0.34, 0.08)), apronM);
  bib.position.set(0, 0.96, 0.41); upper.add(bib);
  [-0.2, 0.2].forEach((sx) => { const st = new THREE.Mesh(G(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 8)), apronM); st.position.set(sx, 1.06, 0.36); st.rotation.x = -0.18; upper.add(st); });
  const apronBadge = new THREE.Mesh(G(new THREE.CircleGeometry(0.13, 28)), apronBadgeM);
  apronBadge.position.set(0, 0.58, 0.47); upper.add(apronBadge);

  // arms (hinged at shoulder)
  function makeArm(side) {
    const pivot = new THREE.Group(); pivot.position.set(0.62 * side, 1.02, 0.02); upper.add(pivot);
    const upperArm = new THREE.Mesh(G(new THREE.CapsuleGeometry(0.15, 0.42, 6, 14)), shirtM);
    upperArm.position.y = -0.3; pivot.add(upperArm);
    const fore = new THREE.Mesh(G(new THREE.CapsuleGeometry(0.13, 0.34, 6, 14)), skinM);
    fore.position.y = -0.62; pivot.add(fore);
    const hand = new THREE.Mesh(G(new THREE.SphereGeometry(0.16, 16, 16)), skinM);
    hand.position.y = -0.86; pivot.add(hand);
    pivot.rotation.z = side * 0.12; // rest slightly out
    return pivot;
  }
  const armL = makeArm(1), armR = makeArm(-1);

  // head group (pivots at neck — follows mouse more)
  const head = new THREE.Group(); head.position.set(0, 1.28, 0); upper.add(head);
  const skull = new THREE.Mesh(G(new THREE.SphereGeometry(0.6, 32, 32)), skinM);
  skull.position.y = 0.34; skull.scale.set(1, 1.07, 0.98); head.add(skull);
  [-1, 1].forEach((s) => { const ear = new THREE.Mesh(G(new THREE.SphereGeometry(0.11, 14, 14)), skinM); ear.position.set(0.58 * s, 0.32, 0); head.add(ear); });
  // female hair — a continuous shell that wraps the whole head (open only at the face) plus
  // length flowing down the back, so it reads as real hair from every angle (no detached "ears").
  const locks = new THREE.Group(); head.add(locks);
  // 1) wrap-around shell: a sphere section covering back + sides + crown, windowed at the front (face)
  const shell = new THREE.Mesh(G(new THREE.SphereGeometry(0.63, 40, 30, Math.PI * 0.79, Math.PI * 1.42)), hairM);
  shell.position.set(0, 0.31, -0.03); shell.scale.set(1.07, 1.1, 1.07); locks.add(shell);
  // 2) solid inner fill so the head reads as hair-backed (not hollow) when it turns
  const hairFill = new THREE.Mesh(G(new THREE.SphereGeometry(0.6, 24, 20, Math.PI * 0.86, Math.PI * 1.28)), hairM);
  hairFill.position.set(0, 0.3, -0.06); hairFill.scale.set(1.04, 1.08, 1.0); locks.add(hairFill);
  // 3) length flowing down the back to the shoulders (one connected sheet, slightly tapered)
  const back = new THREE.Mesh(G(new THREE.CapsuleGeometry(0.34, 0.46, 10, 24)), hairM);
  back.position.set(0, -0.2, -0.24); back.scale.set(1.4, 1, 0.5); locks.add(back);
  const backTip = new THREE.Mesh(G(new THREE.SphereGeometry(0.3, 18, 14)), hairM);
  backTip.position.set(0, -0.62, -0.2); backTip.scale.set(1.25, 0.7, 0.5); locks.add(backTip);
  // 4) two soft strands sweeping in front of the shoulders (lie along the chest, not out to the sides)
  [-1, 1].forEach((s) => {
    const str = new THREE.Mesh(G(new THREE.CapsuleGeometry(0.1, 0.42, 8, 14)), hairM);
    str.position.set(0.32 * s, -0.32, 0.2); str.rotation.z = s * 0.18; str.scale.set(0.8, 1, 0.62); locks.add(str);
  });
  locks.visible = false;
  // eyes (each eye flattens IN PLACE for a real blink; an eyelid sweeps down with it)
  const eyes = new THREE.Group(); head.add(eyes);
  const eyeMeshes = [], hlMeshes = [], lidMeshes = [];
  [-1, 1].forEach((s) => {
    const socket = new THREE.Group(); socket.position.set(0.2 * s, 0.38, 0.5); eyes.add(socket);
    const e = new THREE.Mesh(G(new THREE.SphereGeometry(0.082, 18, 18)), eyeM); e.position.z = 0.03; e.scale.set(0.92, 1, 0.7); socket.add(e); eyeMeshes.push(e);
    const hl = new THREE.Mesh(G(new THREE.SphereGeometry(0.028, 8, 8)), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(0.028, 0.03, 0.085); socket.add(hl); keep.push(hl.material); hlMeshes.push(hl);
    // eyelid: a skin-coloured cap that sits just above the eye and drops on blink
    const lid = new THREE.Mesh(G(new THREE.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5)), skinM); lid.position.set(0, 0.11, 0.02); lid.scale.set(1, 0.7, 0.8); socket.add(lid); lidMeshes.push(lid);
    const brow = new THREE.Mesh(G(new THREE.BoxGeometry(0.17, 0.032, 0.05)), browM); brow.position.set(0.2 * s, 0.52, 0.52); brow.rotation.z = -0.07 * s; head.add(brow);
  });
  // cheeks
  [-1, 1].forEach((s) => { const ch = new THREE.Mesh(G(new THREE.CircleGeometry(0.12, 20)), new THREE.MeshBasicMaterial({ color: 0xff9a8a, transparent: true, opacity: 0.34 })); ch.position.set(0.32 * s, 0.26, 0.51); head.add(ch); keep.push(ch.material); });
  // mouth: smile arc + open oval
  const smile = new THREE.Mesh(G(new THREE.TorusGeometry(0.12, 0.022, 8, 20, Math.PI)), browM);
  smile.position.set(0, 0.2, 0.54); smile.rotation.z = Math.PI; head.add(smile);
  const mouthOpen = new THREE.Mesh(G(new THREE.SphereGeometry(0.1, 16, 16)), M("#5a2a1e", { r: 0.6 }));
  mouthOpen.position.set(0, 0.18, 0.52); mouthOpen.scale.set(1, 0.35, 0.5); mouthOpen.visible = false; head.add(mouthOpen);
  // hats: two switchable styles (baseball cap + knit beanie), both with a front logo badge
  const crownGeo = G(new THREE.SphereGeometry(0.64, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.44));
  const hatCap = new THREE.Group(); head.add(hatCap);
  const capCrown = new THREE.Mesh(crownGeo, capM); capCrown.position.y = 0.34; capCrown.scale.set(1.03, 1.07, 1.02); hatCap.add(capCrown);
  const capBtn = new THREE.Mesh(G(new THREE.SphereGeometry(0.04, 12, 12)), capM); capBtn.position.set(0, 1.0, 0); hatCap.add(capBtn);
  // proper baseball-cap bill: a wide FRONT semicircle (+Z) that curves down from the front rim
  const bill = new THREE.Mesh(G(new THREE.CylinderGeometry(0.46, 0.46, 0.05, 48, 1, false, -Math.PI / 2, Math.PI)), capM);
  bill.position.set(0, 0.45, 0.44); bill.rotation.x = -0.26; bill.scale.set(1.06, 1, 1.04); hatCap.add(bill);
  const capBadge = new THREE.Mesh(G(new THREE.CircleGeometry(0.097, 24)), capBadgeM); capBadge.position.set(0, 0.75, 0.55); capBadge.rotation.x = -0.34; hatCap.add(capBadge);

  const hatBeanie = new THREE.Group(); head.add(hatBeanie);
  const beanieCrown = new THREE.Mesh(crownGeo, capM); beanieCrown.position.y = 0.34; beanieCrown.scale.set(1.03, 1.07, 1.02); hatBeanie.add(beanieCrown);
  const band = new THREE.Mesh(G(new THREE.TorusGeometry(0.6, 0.06, 16, 46)), capM); band.position.y = 0.55; band.rotation.x = Math.PI / 2; band.scale.set(1.06, 1.06, 1); hatBeanie.add(band);
  const pom = new THREE.Mesh(G(new THREE.SphereGeometry(0.075, 14, 14)), capM); pom.position.set(0, 1.02, 0); hatBeanie.add(pom);
  const beanieBadge = new THREE.Mesh(G(new THREE.CircleGeometry(0.097, 24)), capBadgeM); beanieBadge.position.set(0, 0.75, 0.55); beanieBadge.rotation.x = -0.34; hatBeanie.add(beanieBadge);
  hatBeanie.visible = false;

  // lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  const key = new THREE.DirectionalLight(0xfff4e6, 1.15); key.position.set(-2.2, 3.4, 3.2); scene.add(key);
  const rim = new THREE.PointLight(0x33d188, 10, 14); rim.position.set(2.6, 1.2, 1.6); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xbfe9d4, 0.4); fill.position.set(2, 0.5, 2); scene.add(fill);

  // state + interaction
  let tRY = 0, tRX = 0, cRY = 0, cRX = 0, blink = 1, blinkT = 1;
  let talking = false, talkAmp = 0, waveT = 0, waving = false;
  const timers = [];
  let rect = canvas.getBoundingClientRect(), rectRaf = 0;
  const refresh = () => { rectRaf = 0; rect = canvas.getBoundingClientRect(); };
  const invalidate = () => { if (!rectRaf) rectRaf = requestAnimationFrame(refresh); };
  const onMove = (e) => {
    const nx = Math.max(-1, Math.min(1, (e.clientX - (rect.left + rect.width / 2)) / 460));
    const ny = Math.max(-1, Math.min(1, (e.clientY - (rect.top + rect.height / 2)) / 460));
    tRY = nx * 0.5; tRX = ny * 0.32;
  };
  function doWave() { if (waving) return; waving = true; waveT = 0; }
  if (!REDUCE) {
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate);
    const blinkLoop = () => timers.push(setTimeout(() => { blinkT = 0.08; timers.push(setTimeout(() => (blinkT = 1), 110)); blinkLoop(); }, 2400 + Math.random() * 3400));
    const waveLoop = () => timers.push(setTimeout(() => { doWave(); waveLoop(); }, 6000 + Math.random() * 6000));
    blinkLoop(); timers.push(setTimeout(doWave, 900)); waveLoop();
  }

  window.glyivHost = {
    talk(on) { talking = !!on; },
    wave: doWave,
    setApron(hex) { apronM.color.set(hex); },
    setCap(hex) { capM.color.set(hex); },
    setShirt(hex) { shirtM.color.set(hex); },
    setHat(t) { const cap = t === "cap"; hatCap.visible = cap; hatBeanie.visible = !cap; },
    setLogo(g) { apronLogoTex = makeLogoTexture(g); capLogoTex = makeLogoTexture(g); apronBadgeM.map = apronLogoTex; capBadgeM.map = capLogoTex; apronBadgeM.needsUpdate = true; capBadgeM.needsUpdate = true; },
    setGender(g) { locks.visible = g === "f"; },
  };

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth, h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    rect = canvas.getBoundingClientRect(); if (REDUCE) renderer.render(scene, camera);
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  let visible = true; new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.01 }).observe(canvas);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || REDUCE || !SHOWN(canvas)) return;
    const now = performance.now(), t = now * 0.001;
    cRY += (tRY - cRY) * 0.09; cRX += (tRX - cRX) * 0.09;
    head.rotation.y = cRY; head.rotation.x = cRX + Math.sin(t * 0.9) * 0.015;
    upper.rotation.y = cRY * 0.32; upper.position.y = Math.sin(t * 1.1) * 0.012;
    blink += (blinkT - blink) * 0.45;
    eyeMeshes.forEach((m) => (m.scale.y = blink));
    hlMeshes.forEach((m) => (m.visible = blink > 0.5));
    lidMeshes.forEach((m) => (m.position.y = 0.11 - (1 - blink) * 0.12));
    // talk
    talkAmp += ((talking ? 1 : 0) - talkAmp) * 0.2;
    const open = talkAmp * (0.5 + Math.abs(Math.sin(now * 0.018)) * 0.9);
    mouthOpen.visible = talkAmp > 0.05; smile.visible = talkAmp < 0.5;
    mouthOpen.scale.set(1, 0.18 + open * 0.9, 0.5);
    // wave
    if (waving) {
      waveT += 0.018; const p = waveT;
      if (p >= 1) { waving = false; armR.rotation.z = -0.12; armR.rotation.x = 0; }
      else { const env = Math.sin(p * Math.PI); armR.rotation.z = -0.12 - env * 1.7; armR.rotation.x = -env * 0.2; armR.children[2].position.x = 0; armR.rotation.y = Math.sin(p * Math.PI * 6) * 0.18 * env; }
    }
    armL.rotation.z = 0.12 + Math.sin(t * 1.2) * 0.02;
    renderer.render(scene, camera);
  }
  if (REDUCE) renderer.render(scene, camera); else frame();
}

/* ---------- HOLOGRAM FOREST: draggable, hover-tree carbon tooltip + satellite ---------- */
function initForest(canvas) {
  const wrap = canvas.parentElement, tip = wrap.querySelector(".holo-tip");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(capDPR(1.6));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 3.1, 6.4); camera.lookAt(0, 0.4, 0);

  const keep = [];
  const K = (x) => { keep.push(x); return x; };
  const world = new THREE.Group(); scene.add(world);
  const GREEN = 0x33d188;

  // holographic platform: disc + polar grid + glowing rim
  const disc = new THREE.Mesh(K(new THREE.CircleGeometry(2.6, 48)), K(new THREE.MeshBasicMaterial({ color: 0x0a3325, transparent: true, opacity: 0.4 })));
  disc.rotation.x = -Math.PI / 2; world.add(disc);
  const grid = new THREE.PolarGridHelper(2.6, 8, 6, 48, 0x1f9d63, 0x14573b); grid.position.y = 0.002; world.add(grid); keep.push(grid.material);
  const rim = new THREE.Mesh(K(new THREE.TorusGeometry(2.6, 0.02, 8, 80)), K(new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }))); rim.rotation.x = -Math.PI / 2; world.add(rim);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const pl = new THREE.PointLight(GREEN, 8, 20); pl.position.set(0, 4, 2); scene.add(pl);

  // trees
  const SPECIES = [
    { nm: "Trembesi", tons: 28.5, pos: [0, 0], s: 1.35 },
    { nm: "Beringin", tons: 5.4, pos: [-1.5, 0.4], s: 1.0 },
    { nm: "Mangrove", tons: 1.2, pos: [1.5, 0.5], s: 0.8 },
    { nm: "Mahoni", tons: 0.9, pos: [-1.0, -1.3], s: 0.85 },
    { nm: "Jati", tons: 0.7, pos: [1.2, -1.2], s: 0.8 },
    { nm: "Cemara", tons: 0.6, pos: [-1.9, -0.6], s: 0.75 },
    { nm: "Pinus", tons: 0.5, pos: [1.9, -0.3], s: 0.75 },
  ];
  const foliageGeo = K(new THREE.IcosahedronGeometry(0.42, 0));
  const trunkGeo = K(new THREE.CylinderGeometry(0.05, 0.08, 0.5, 7));
  const folM = K(new THREE.MeshStandardMaterial({ color: 0x0f3a28, emissive: GREEN, emissiveIntensity: 0.55, roughness: 0.5, metalness: 0.2, transparent: true, opacity: 0.92, flatShading: true }));
  const folWireM = K(new THREE.MeshBasicMaterial({ color: 0x8affc1, wireframe: true, transparent: true, opacity: 0.25 }));
  const trunkM = K(new THREE.MeshStandardMaterial({ color: 0x2a1d12, emissive: 0x1f9d63, emissiveIntensity: 0.15, roughness: 0.8 }));
  const pickables = [];
  SPECIES.forEach((sp) => {
    const g = new THREE.Group(); g.position.set(sp.pos[0], 0, sp.pos[1]); g.scale.setScalar(sp.s); world.add(g);
    const trunk = new THREE.Mesh(trunkGeo, trunkM); trunk.position.y = 0.25; g.add(trunk);
    const f1 = new THREE.Mesh(foliageGeo, folM); f1.position.y = 0.72; g.add(f1);
    const f2 = new THREE.Mesh(foliageGeo, folM); f2.position.set(0.14, 0.5, 0.05); f2.scale.setScalar(0.7); g.add(f2);
    g.add(new THREE.Mesh(foliageGeo, folWireM).translateY(0.72));
    f1.userData = sp; f2.userData = sp; g.userData = sp;
    pickables.push(f1, f2);
  });

  // satellite above
  const sat = new THREE.Group(); sat.position.set(0, 3.0, 0); world.add(sat);
  const body = new THREE.Mesh(K(new THREE.BoxGeometry(0.34, 0.24, 0.5)), K(new THREE.MeshStandardMaterial({ color: 0x12342a, emissive: GREEN, emissiveIntensity: 0.3, metalness: 0.6, roughness: 0.4, flatShading: true }))); sat.add(body);
  [-1, 1].forEach((s) => { const panel = new THREE.Mesh(K(new THREE.BoxGeometry(0.5, 0.02, 0.34)), K(new THREE.MeshStandardMaterial({ color: 0x0c2c4a, emissive: 0x1f6e8a, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.3 }))); panel.position.x = s * 0.46; sat.add(panel); });
  const dish = new THREE.Mesh(K(new THREE.ConeGeometry(0.12, 0.12, 12, 1, true)), K(new THREE.MeshBasicMaterial({ color: 0x8affc1, side: THREE.DoubleSide }))); dish.position.y = -0.18; dish.rotation.x = Math.PI; sat.add(dish);
  // scan cone to ground
  const beam = new THREE.Mesh(K(new THREE.ConeGeometry(1.5, 3.0, 28, 1, true)), K(new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.08, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }))); beam.position.y = -1.5; sat.add(beam);
  // expanding scan ring on ground
  const scanRing = new THREE.Mesh(K(new THREE.RingGeometry(0.1, 0.16, 48)), K(new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }))); scanRing.rotation.x = -Math.PI / 2; scanRing.position.y = 0.01; world.add(scanRing);

  // interaction: drag rotate + hover pick
  let rotY = 0.5, rotX = 0.18, tRotY = 0.5, tRotX = 0.18, dragging = false, lastX = 0, lastY = 0, autorot = true;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let rect = canvas.getBoundingClientRect();
  const refit = () => (rect = canvas.getBoundingClientRect());
  canvas.addEventListener("pointerdown", (e) => { dragging = true; autorot = false; lastX = e.clientX; lastY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
  window.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) { tRotY += (e.clientX - lastX) * 0.01; tRotX = Math.max(-0.1, Math.min(0.7, tRotX + (e.clientY - lastY) * 0.005)); lastX = e.clientX; lastY = e.clientY; if (tip) tip.classList.remove("is-on"); return; }
    if (REDUCE) return;
    rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (hit && tip) {
      const sp = hit.object.userData;
      tip.innerHTML = "<b>" + sp.nm + "</b><span>menyerap ~" + sp.tons.toLocaleString("id-ID") + " ton CO₂ / tahun</span>";
      tip.style.left = (e.clientX - rect.left) + "px"; tip.style.top = (e.clientY - rect.top) + "px";
      tip.classList.add("is-on"); canvas.style.cursor = "pointer";
    } else if (tip) { tip.classList.remove("is-on"); canvas.style.cursor = "grab"; }
  });
  canvas.addEventListener("pointerleave", () => { if (tip) tip.classList.remove("is-on"); });

  function resize() { const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); refit(); if (REDUCE) renderer.render(scene, camera); }
  const ro = new ResizeObserver(resize); ro.observe(wrap); resize();
  let visible = true; new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.01 }).observe(canvas);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || REDUCE || !SHOWN(canvas)) return;
    const t = performance.now() * 0.001;
    if (autorot) tRotY += 0.0024;
    rotY += (tRotY - rotY) * 0.08; rotX += (tRotX - rotX) * 0.08;
    world.rotation.y = rotY; world.rotation.x = rotX;
    sat.position.x = Math.cos(t * 0.5) * 0.5; sat.position.z = Math.sin(t * 0.5) * 0.5; sat.rotation.y = t * 0.6;
    const sr = (t * 0.5) % 1; scanRing.scale.setScalar(0.2 + sr * 9); scanRing.material.opacity = 0.6 * (1 - sr);
    renderer.render(scene, camera);
  }
  if (REDUCE) renderer.render(scene, camera); else frame();
}

/* ---------- PROBLEMS: one shared scene, several low-poly groups (only the active renders) ---------- */
function initProblems(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(capDPR(1.45));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 2.5, 7.2); camera.lookAt(0, 0.65, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.82));
  const key = new THREE.DirectionalLight(0xffffff, 1.05); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new THREE.PointLight(0x33d188, 16, 24); rim.position.set(3, 1.6, 3); scene.add(rim);
  const rim2 = new THREE.PointLight(0xf5c451, 7, 22); rim2.position.set(-3, 2.2, -1); scene.add(rim2);

  const keep = [];
  const K = (x) => { keep.push(x); return x; };
  const M = (h, o = {}) => K(new THREE.MeshStandardMaterial({ color: new THREE.Color(h), roughness: o.r ?? 0.7, metalness: o.m ?? 0.1, emissive: new THREE.Color(o.e ?? 0x000000), emissiveIntensity: o.ei ?? 1, flatShading: !!o.flat, transparent: !!o.t, opacity: o.o ?? 1, side: o.side || THREE.FrontSide }));
  const glow = (h, op = 1) => K(new THREE.MeshBasicMaterial({ color: new THREE.Color(h), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
  const groups = [];
  const mkGroup = () => { const g = new THREE.Group(); g.visible = false; g.userData.anim = () => {}; g.userData.anchors = []; scene.add(g); groups.push(g); return g; };
  const boxG = K(new THREE.BoxGeometry(1, 1, 1));
  function person(col) {
    const p = new THREE.Group();
    const b = new THREE.Mesh(K(new THREE.CapsuleGeometry(0.2, 0.46, 4, 12)), M(col, { r: 0.6, flat: true })); b.position.y = 0.46; p.add(b);
    const hd = new THREE.Mesh(K(new THREE.SphereGeometry(0.18, 16, 16)), M("#f1c69c", { r: 0.85 })); hd.position.y = 0.92; p.add(hd);
    return p;
  }
  function makeClock() {
    const c = new THREE.Group();
    c.add(new THREE.Mesh(K(new THREE.CircleGeometry(0.42, 44)), M("#08231a", { r: 0.5, e: "#0e3a28", ei: 0.25 })));
    c.add(new THREE.Mesh(K(new THREE.TorusGeometry(0.42, 0.035, 12, 48)), M("#f5c451", { e: "#f5c451", ei: 0.7, m: 0.5, r: 0.3 })));
    for (let i = 0; i < 12; i++) { const tk = new THREE.Mesh(K(new THREE.BoxGeometry(0.022, i % 3 === 0 ? 0.08 : 0.045, 0.02)), glow("#f5c451", 0.85)); const a = i / 12 * Math.PI * 2; tk.position.set(Math.sin(a) * 0.34, Math.cos(a) * 0.34, 0.02); tk.rotation.z = -a; c.add(tk); }
    const mkHand = (len, w, col) => { const gh = new THREE.BoxGeometry(w, len, 0.02); gh.translate(0, len / 2, 0); const m = new THREE.Mesh(K(gh), glow(col, 0.95)); c.add(m); return m; };
    const hour = mkHand(0.2, 0.03, "#fff7e0"); hour.position.z = 0.035;
    const min = mkHand(0.3, 0.024, "#ffffff"); min.position.z = 0.04;
    c.add(new THREE.Mesh(K(new THREE.SphereGeometry(0.032, 10, 10)), glow("#f5c451", 1)).translateZ(0.05));
    c.userData = { hour, min };
    return c;
  }

  // ---------- G0 CAFÉ: antri + lantai 2 + pesan ulang ----------
  { const g = mkGroup();
    const f1 = new THREE.Mesh(boxG, M("#0e3a28", { flat: true })); f1.scale.set(5, 0.2, 3); f1.position.y = -0.1; g.add(f1);
    const f2 = new THREE.Mesh(boxG, M("#123a2a", { flat: true })); f2.scale.set(2.4, 0.2, 2.4); f2.position.set(-1.5, 1.5, -0.2); g.add(f2);
    const goldEdge = new THREE.Mesh(boxG, M("#1f6e49", { e: "#f5c451", ei: 0.22, flat: true })); goldEdge.scale.set(2.4, 0.06, 0.12); goldEdge.position.set(-1.5, 1.63, 1.0); g.add(goldEdge);
    for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(boxG, M("#15623f", { flat: true })); s.scale.set(0.9, 0.18, 0.42); s.position.set(0.1, 0.18 + i * 0.3, 1.15 - i * 0.34); g.add(s); }
    const counter = new THREE.Mesh(boxG, M("#1f6e49", { flat: true })); counter.scale.set(1.5, 0.75, 0.5); counter.position.set(1.7, 0.38, -0.6); g.add(counter);
    const reg = new THREE.Mesh(boxG, glow("#33ffb0", 0.85)); reg.scale.set(0.34, 0.22, 0.06); reg.position.set(1.7, 0.86, -0.42); g.add(reg);
    const queue = [];
    [0, 1, 2].forEach((i) => { const p = person(i % 2 ? "#c75c39" : "#1f9d63"); p.position.set(1.7 - i * 0.62, 0, 0.34 + i * 0.04); g.add(p); queue.push(p); });
    const up = person("#3a5bd0"); up.position.set(-1.5, 1.6, -0.1); up.scale.setScalar(0.92); g.add(up);
    const t2 = new THREE.Mesh(K(new THREE.CylinderGeometry(0.32, 0.28, 0.1, 16)), M("#e9efe7", { r: 0.7 })); t2.position.set(-0.85, 1.95, 0.2); g.add(t2);
    g.userData.anchors = [new THREE.Vector3(1.7, 1.35, 0.34), new THREE.Vector3(-1.5, 2.65, -0.1)];
    g.userData.anim = (t) => {
      queue.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 2.4 + i * 1.3)) * 0.05; p.rotation.y = Math.sin(t * 0.8 + i) * 0.18; });
      up.rotation.y = Math.sin(t * 0.6) * 0.4; up.children[1].rotation.x = -0.2 + Math.sin(t * 1.2) * 0.08;
      reg.material.opacity = 0.5 + Math.abs(Math.sin(t * 3)) * 0.45;
    };
  }

  // ---------- G1 MENU / AI: kostumisasi + bingung pesan ----------
  { const g = mkGroup();
    const cup = new THREE.Group(); cup.position.y = 0.25; g.add(cup);
    const glass = M("#bfeede", { r: 0.12, m: 0.1, t: true, o: 0.34, side: THREE.DoubleSide });
    cup.add(new THREE.Mesh(K(new THREE.CylinderGeometry(0.64, 0.46, 1.5, 32, 1, true)), glass));
    const layer = (c, h, y, e) => { const m = new THREE.Mesh(K(new THREE.CylinderGeometry(0.58, 0.5, h, 28)), M(c, { r: 0.5, e: e || c, ei: 0.22 })); m.position.y = y; cup.add(m); };
    layer("#5a2a1e", 0.55, -0.35); layer("#caa56a", 0.34, 0.0); layer("#eef3ee", 0.2, 0.26);
    const ices = [];
    for (let i = 0; i < 4; i++) { const ice = new THREE.Mesh(K(new THREE.BoxGeometry(0.17, 0.17, 0.17)), M("#dff3ff", { r: 0.1, t: true, o: 0.7, flat: true })); ice.userData = { p: i * 1.6 }; cup.add(ice); ices.push(ice); }
    const straw = new THREE.Mesh(K(new THREE.CylinderGeometry(0.045, 0.045, 1.7, 8)), glow("#33ffb0", 0.9)); straw.position.set(0.22, 0.75, 0); straw.rotation.z = 0.22; cup.add(straw);
    const rings = [];
    [0.85, 1.05].forEach((r, i) => { const ring = new THREE.Mesh(K(new THREE.TorusGeometry(r, 0.014, 8, 50)), glow(i ? "#f5c451" : "#33d188", 0.55)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.25; cup.add(ring); rings.push(ring); });
    const qG = new THREE.Group(); qG.position.set(-1.55, 1.45, 0); g.add(qG);
    qG.add(new THREE.Mesh(K(new THREE.TorusGeometry(0.16, 0.05, 8, 22, Math.PI * 1.4)), glow("#f5c451", 0.95)));
    qG.add(new THREE.Mesh(K(new THREE.SphereGeometry(0.05, 8, 8)), glow("#f5c451", 0.95)).translateY(-0.34));
    const spark = new THREE.Mesh(K(new THREE.OctahedronGeometry(0.13, 0)), glow("#aaffd0", 1)); g.add(spark);
    g.userData.anchors = [new THREE.Vector3(-1.55, 2.0, 0)];
    g.userData.anim = (t) => {
      cup.rotation.y = t * 0.5;
      ices.forEach((ice, i) => { ice.position.set(Math.sin(t + ice.userData.p) * 0.22, -0.1 + Math.sin(t * 1.5 + ice.userData.p) * 0.18, Math.cos(t + ice.userData.p) * 0.18); ice.rotation.set(t + i, t * 1.3 + i, 0); });
      rings.forEach((r, i) => (r.rotation.z = t * (i ? -0.6 : 0.6)));
      qG.position.y = 1.45 + Math.sin(t * 2) * 0.1; qG.rotation.z = Math.sin(t) * 0.15;
      spark.position.set(-1.55 + Math.cos(t * 1.6) * 0.5, 1.45 + Math.sin(t * 2.2) * 0.4, Math.sin(t * 1.6) * 0.5); spark.rotation.set(t, t * 1.4, 0);
    };
  }

  // ---------- G2 BOOKING / CLOSE ORDER: meja penuh + telat ----------
  { const g = mkGroup();
    const floor = new THREE.Mesh(K(new THREE.CylinderGeometry(2.6, 2.6, 0.12, 44)), M("#0e3a28", { flat: true })); floor.position.y = -0.05; g.add(floor);
    const occPeople = [], freeTables = [];
    const tablePos = [[-1.3, -0.5, 1], [0.2, -0.9, 1], [1.35, 0.1, 1], [-0.9, 1.0, 0], [1.0, 1.2, 0], [-1.7, 0.5, 0]];
    tablePos.forEach(([x, z, occ]) => {
      const t = new THREE.Mesh(K(new THREE.CylinderGeometry(0.34, 0.3, 0.12, 18)), M(occ ? "#7a2f1c" : "#13573b", { r: 0.6, e: occ ? "#c75c39" : "#33d188", ei: occ ? 0.3 : 0.5, flat: true })); t.position.set(x, 0.18, z); g.add(t);
      if (occ) { const p = person("#9a5a3a"); p.position.set(x, 0.06, z + 0.06); p.scale.setScalar(0.72); g.add(p); occPeople.push(p); }
      else freeTables.push(t);
    });
    const clk = makeClock(); clk.position.set(0, 2.05, 0.3); clk.scale.setScalar(1.05); g.add(clk);
    g.userData.anchors = [new THREE.Vector3(-1.3, 1.1, -0.5), new THREE.Vector3(0, 2.6, 0.3)];
    g.userData.anim = (t) => {
      occPeople.forEach((p, i) => (p.position.y = 0.06 + Math.abs(Math.sin(t * 2 + i)) * 0.03));
      freeTables.forEach((tb, i) => (tb.material.emissiveIntensity = 0.4 + Math.abs(Math.sin(t * 2.2 + i)) * 0.5));
      clk.userData.min.rotation.z = -t * 1.6; clk.userData.hour.rotation.z = -t * 0.16;
    };
  }

  // ---------- G3 DATA & DAMPAK: struk buang data item-level -> pohon ----------
  { const g = mkGroup();
    const receipt = new THREE.Mesh(K(new THREE.BoxGeometry(1.0, 0.04, 1.5)), M("#e9efe7", { r: 0.85 })); receipt.position.set(-1.75, 1.0, 0); receipt.rotation.set(-0.5, 0.3, 0.1); g.add(receipt);
    for (let i = 0; i < 4; i++) { const ln = new THREE.Mesh(boxG, M("#9fb0a6", { r: 0.9 })); ln.scale.set(0.6, 0.012, 0.06); ln.position.set(-1.75, 1.03, -0.4 + i * 0.26); ln.rotation.copy(receipt.rotation); g.add(ln); }
    const cubes = [];
    for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(K(new THREE.BoxGeometry(0.13, 0.13, 0.13)), glow(i % 2 ? "#f5c451" : "#33ffb0", 0.9)); c.userData = { t: i / 8 }; g.add(c); cubes.push(c); }
    const tree = new THREE.Group(); tree.position.set(1.7, 0, 0); g.add(tree);
    tree.add(new THREE.Mesh(K(new THREE.CylinderGeometry(0.1, 0.14, 0.7, 8)), M("#3a2a18", { r: 0.8 })).translateY(0.35));
    const fol1 = new THREE.Mesh(K(new THREE.IcosahedronGeometry(0.62, 0)), M("#1faf6b", { e: "#33d188", ei: 0.45, flat: true })); fol1.position.y = 1.05; tree.add(fol1);
    const fol2 = new THREE.Mesh(K(new THREE.IcosahedronGeometry(0.38, 0)), M("#1faf6b", { e: "#33d188", ei: 0.45, flat: true })); fol2.position.set(0.3, 0.75, 0.1); tree.add(fol2);
    g.userData.anchors = [new THREE.Vector3(-1.75, 1.55, 0)];
    g.userData.anim = (t) => {
      cubes.forEach((c) => { const tt = (t * 0.32 + c.userData.t) % 1; c.position.set(-1.6 + tt * 3.2, 1.0 + Math.sin(tt * Math.PI) * 0.35 - tt * 0.05, Math.sin(tt * 8) * 0.12); c.material.opacity = Math.sin(tt * Math.PI) * 0.95; c.rotation.set(tt * 6, tt * 7, 0); c.scale.setScalar(1 - tt * 0.5); });
      fol1.rotation.y = Math.sin(t * 0.6) * 0.1; fol1.position.y = 1.05 + Math.sin(t * 1.5) * 0.02; fol2.position.y = 0.75 + Math.sin(t * 1.7 + 1) * 0.02;
    };
  }

  // ---------- G4 SOLUTION HOLOGRAM: duduk -> scan -> asisten -> nikmati ----------
  { const g = mkGroup();
    const holoM = (h, o = 0.5) => K(new THREE.MeshBasicMaterial({ color: new THREE.Color(h), transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(new THREE.Mesh(K(new THREE.CylinderGeometry(2.2, 2.2, 0.04, 50)), holoM("#33d188", 0.1)));
    const ring1 = new THREE.Mesh(K(new THREE.TorusGeometry(2.2, 0.02, 8, 64)), holoM("#33ffb0", 0.7)); ring1.rotation.x = Math.PI / 2; g.add(ring1);
    const ring2 = new THREE.Mesh(K(new THREE.TorusGeometry(1.4, 0.012, 8, 56)), holoM("#33ffb0", 0.4)); ring2.rotation.x = Math.PI / 2; g.add(ring2);
    const scanRing = new THREE.Mesh(K(new THREE.RingGeometry(0.2, 0.26, 40)), holoM("#33ffb0", 0.6)); scanRing.rotation.x = -Math.PI / 2; scanRing.position.set(-0.7, 0.66, 0.4); g.add(scanRing);
    const table = new THREE.Mesh(K(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 22)), holoM("#33d188", 0.32)); table.position.set(-0.7, 0.55, 0.4); g.add(table);
    table.add(new THREE.Mesh(K(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8)), holoM("#33d188", 0.4)).translateY(-0.3));
    const qr = new THREE.Mesh(K(new THREE.PlaneGeometry(0.34, 0.34)), K(new THREE.MeshBasicMaterial({ map: makeLogoTexture("⌗"), transparent: true, opacity: 0.95 }))); qr.position.set(-0.7, 0.62, 0.4); qr.rotation.x = -Math.PI / 2; g.add(qr);
    const a = new THREE.Group(); a.position.set(0.9, 0, 0.1); g.add(a);
    a.add(new THREE.Mesh(K(new THREE.CapsuleGeometry(0.3, 0.7, 4, 12)), holoM("#33d188", 0.42)).translateY(0.7));
    a.add(new THREE.Mesh(K(new THREE.SphereGeometry(0.28, 18, 18)), holoM("#33ffb0", 0.46)).translateY(1.45));
    a.add(new THREE.Mesh(K(new THREE.SphereGeometry(0.3, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5)), holoM("#33d188", 0.6)).translateY(1.62));
    a.add(new THREE.Mesh(K(new THREE.CircleGeometry(0.045, 12)), holoM("#eafff4", 1)).translateY(1.46).translateZ(0.27));
    const arm = new THREE.Group(); arm.position.set(0.32, 1.05, 0); const armMesh = new THREE.Mesh(K(new THREE.CapsuleGeometry(0.08, 0.4, 4, 8)), holoM("#33d188", 0.42)); armMesh.position.y = -0.2; arm.add(armMesh); a.add(arm);
    const cust = person("#1f9d63"); cust.position.set(-1.55, 0, 0.4); cust.scale.setScalar(0.82); cust.children.forEach((c) => (c.material = holoM("#33d188", 0.5))); g.add(cust);
    const steps = [];
    for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(K(new THREE.SphereGeometry(0.06, 10, 10)), holoM("#aaffd0", 1)); d.userData = { a: (i / 6) * Math.PI * 2 }; g.add(d); steps.push(d); }
    g.userData.anchors = [new THREE.Vector3(0.9, 2.05, 0.1)];
    g.userData.anim = (t) => {
      a.rotation.y = Math.sin(t * 0.8) * 0.25; arm.rotation.z = -0.6 + Math.sin(t * 2.2) * 0.5;
      const sr = (t * 0.4) % 1; scanRing.scale.setScalar(1 + sr * 6); scanRing.material.opacity = 0.6 * (1 - sr);
      ring2.rotation.z += 0.01;
      steps.forEach((d) => { d.userData.a += 0.012; d.position.set(Math.cos(d.userData.a) * 2.0, 0.12 + Math.sin(d.userData.a * 2) * 0.12, Math.sin(d.userData.a) * 2.0); });
    };
  }

  // drag-to-rotate state
  let userRotY = 0, userRotX = 0, dragging = false, lastX = 0, lastY = 0, interacted = false;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; interacted = true; lastX = e.clientX; lastY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
  window.addEventListener("pointerup", () => (dragging = false));
  canvas.addEventListener("pointermove", (e) => { if (!dragging) return; userRotY += (e.clientX - lastX) * 0.01; userRotX = Math.max(-0.5, Math.min(0.6, userRotX + (e.clientY - lastY) * 0.006)); lastX = e.clientX; lastY = e.clientY; });

  if (!window.glyivProblems) window.glyivProblems = { show() {} };
  let active = 0;
  window.glyivProblems.show = (i) => { active = Math.max(0, Math.min(groups.length - 1, i)); groups.forEach((g, k) => (g.visible = k === active)); interacted = false; userRotY = 0; userRotX = 0; };
  window.glyivProblems.count = groups.length;

  // speech bubbles projected onto 3D anchors
  const bubblesByGroup = {};
  if (canvas.parentElement) Array.from(canvas.parentElement.querySelectorAll(".pb-bubble")).forEach((el) => { const p = +el.dataset.p; (bubblesByGroup[p] = bubblesByGroup[p] || []).push(el); });

  window.glyivProblems.show(0);

  let cw = 0, ch = 0; // cached canvas size — avoids a per-frame clientWidth layout read
  function resize() { const w = canvas.clientWidth || canvas.parentElement.clientWidth, h = canvas.clientHeight || canvas.parentElement.clientHeight; if (!w || !h) return; cw = w; ch = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (REDUCE) renderer.render(scene, camera); }
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  let visible = true; new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.01 }).observe(canvas);

  const _v = new THREE.Vector3();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || REDUCE || !SHOWN(canvas)) return;
    const t = performance.now() * 0.001;
    const g = groups[active];
    if (g) {
      g.rotation.y = userRotY + (interacted ? 0 : Math.sin(t * 0.3) * 0.45);
      g.rotation.x = userRotX;
      g.updateMatrixWorld(true);
      g.userData.anim(t);
      const bs = bubblesByGroup[active] || [], ans = g.userData.anchors || [];
      const W = cw, H = ch;
      bs.forEach((el, k) => { if (!ans[k]) return; _v.copy(ans[k]).applyMatrix4(g.matrixWorld).project(camera); if (_v.z > 1) { el.style.left = "-9999px"; return; } el.style.left = ((_v.x * 0.5 + 0.5) * W) + "px"; el.style.top = ((-_v.y * 0.5 + 0.5) * H) + "px"; });
    }
    renderer.render(scene, camera);
  }
  if (REDUCE) renderer.render(scene, camera); else frame();
}

/* ---------- SECTION HOLO EMBLEMS: one interactive 3D metaphor per section ----------
   Each <canvas data-holo="TYPE"> renders a small holographic object that signals the
   section's topic at a glance. Shares the perf harness: drag-rotate, autorotate, DPR
   cap, offscreen pause (IntersectionObserver + SHOWN), cached size. */
function initHoloEmblem(canvas) {
  const type = canvas.dataset.holo || "precision";
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(capDPR(1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  const world = new THREE.Group(); scene.add(world);
  const keep = []; const K = (x) => { keep.push(x); return x; };
  const GREEN = 0x33d188, BIO = 0x8affc1, LIME = 0x7df1a6, GOLD = 0xf5c451, EMER = 0x1fae6b;
  const addPts = (arr, color, size, op) => new THREE.Points(K(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(arr, 3))), K(new THREE.PointsMaterial({ color, size, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })));
  const edges = (geo, color, op) => new THREE.LineSegments(K(new THREE.EdgesGeometry(geo)), K(new THREE.LineBasicMaterial({ color, transparent: true, opacity: op })));
  let update = () => {};

  if (type === "precision") {
    // scattered noise that resolves into an ordered data sphere -> estimate vs precise
    const N = 440, scat = new Float32Array(N * 3), ord = new Float32Array(N * 3), pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      let x, y, z, d; do { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; d = x * x + y * y + z * z; } while (d > 1);
      scat[i * 3] = x * 1.75; scat[i * 3 + 1] = y * 1.75; scat[i * 3 + 2] = z * 1.75;
      const gi = i + 0.5, phi = Math.acos(1 - 2 * gi / N), th = Math.PI * (1 + Math.sqrt(5)) * gi;
      ord[i * 3] = Math.cos(th) * Math.sin(phi) * 1.4; ord[i * 3 + 1] = Math.cos(phi) * 1.4; ord[i * 3 + 2] = Math.sin(th) * Math.sin(phi) * 1.4;
      pos[i * 3] = scat[i * 3]; pos[i * 3 + 1] = scat[i * 3 + 1]; pos[i * 3 + 2] = scat[i * 3 + 2];
    }
    const pts = addPts(pos, BIO, 0.06, 0.9); world.add(pts);
    const ico = edges(new THREE.IcosahedronGeometry(1.4, 0), GREEN, 0); world.add(ico);
    const g = pts.geometry;
    update = (t) => { let k = Math.sin(t * 0.5) * 0.5 + 0.5; k = k * k * (3 - 2 * k); const a = g.attributes.position.array; for (let i = 0; i < N * 3; i++) a[i] = scat[i] + (ord[i] - scat[i]) * k; g.attributes.position.needsUpdate = true; ico.material.opacity = 0.55 * k; };
  } else if (type === "layers") {
    // four glowing stacked plates + data flowing upward -> the 4-layer platform
    const cols = [EMER, LIME, BIO, GOLD], ys = [-1.2, -0.4, 0.4, 1.2];
    ys.forEach((y, i) => {
      const plate = new THREE.Mesh(K(new THREE.BoxGeometry(2.3, 0.13, 1.5)), K(new THREE.MeshBasicMaterial({ color: cols[i], transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false }))); plate.position.y = y; world.add(plate);
      const e = edges(new THREE.BoxGeometry(2.3, 0.13, 1.5), cols[i], 0.7); e.position.y = y; world.add(e);
    });
    const M = 64, pp = new Float32Array(M * 3), spd = new Float32Array(M);
    for (let i = 0; i < M; i++) { pp[i * 3] = (Math.random() * 2 - 1) * 1.05; pp[i * 3 + 1] = Math.random() * 3 - 1.5; pp[i * 3 + 2] = (Math.random() * 2 - 1) * 0.65; spd[i] = 0.5 + Math.random() * 0.7; }
    const parts = addPts(pp, BIO, 0.05, 0.85); world.add(parts); const g = parts.geometry;
    update = () => { const a = g.attributes.position.array; for (let i = 0; i < M; i++) { a[i * 3 + 1] += spd[i] * 0.02; if (a[i * 3 + 1] > 1.65) { a[i * 3 + 1] = -1.65; a[i * 3] = (Math.random() * 2 - 1) * 1.05; a[i * 3 + 2] = (Math.random() * 2 - 1) * 0.65; } } g.attributes.position.needsUpdate = true; };
  } else if (type === "flow") {
    // a data packet flows up a helix through transformation rings -> carbon flow
    const turns = 3, H = 3, R = 1.1, P = 96, hp = new Float32Array(P * 3);
    for (let i = 0; i < P; i++) { const u = i / (P - 1), ang = u * turns * Math.PI * 2; hp[i * 3] = Math.cos(ang) * R; hp[i * 3 + 1] = (u - 0.5) * H; hp[i * 3 + 2] = Math.sin(ang) * R; }
    world.add(addPts(hp, LIME, 0.05, 0.5));
    [-1, 0, 1].forEach((y, i) => { const c = [EMER, BIO, GOLD][i]; const r = new THREE.Mesh(K(new THREE.TorusGeometry(1.18, 0.02, 8, 48)), K(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }))); r.rotation.x = Math.PI / 2; r.position.y = y; world.add(r); });
    const pkt = new THREE.Mesh(K(new THREE.SphereGeometry(0.13, 12, 12)), K(new THREE.MeshBasicMaterial({ color: 0xeafff4, transparent: true, blending: THREE.AdditiveBlending })));
    world.add(pkt);
    update = (t) => { const u = (t * 0.18) % 1, ang = u * turns * Math.PI * 2; pkt.position.set(Math.cos(ang) * R, (u - 0.5) * H, Math.sin(ang) * R); };
  } else if (type === "market") {
    // rising bar chart in front of a wireframe globe -> market growth
    const mGlobe = new THREE.LineSegments(K(new THREE.WireframeGeometry(new THREE.SphereGeometry(1.8, 14, 10))), K(new THREE.LineBasicMaterial({ color: EMER, transparent: true, opacity: 0.12 }))); world.add(mGlobe);
    const bars = [], bn = 5, bc = [EMER, LIME, BIO, GOLD, LIME];
    for (let i = 0; i < bn; i++) { const geo = new THREE.BoxGeometry(0.34, 1, 0.34); const b = new THREE.Mesh(K(geo), K(new THREE.MeshBasicMaterial({ color: bc[i], transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending }))); b.position.x = (i - (bn - 1) / 2) * 0.52; world.add(b); b.add(edges(geo, bc[i], 0.9)); bars.push(b); }
    update = (t) => { bars.forEach((b, i) => { const h = 0.5 + i * 0.26 + Math.sin(t * 1.2 + i * 0.6) * 0.16 + 0.2; b.scale.y = h; b.position.y = -1 + h * 0.5; }); mGlobe.rotation.y = t * 0.1; };
  } else if (type === "edge") {
    // a bright data core with dim competitors orbiting -> Glyiv's advantage
    world.add(new THREE.Mesh(K(new THREE.IcosahedronGeometry(0.95, 0)), K(new THREE.MeshBasicMaterial({ color: 0x0e3a28, transparent: true, opacity: 0.5 }))));
    const coreW = edges(new THREE.IcosahedronGeometry(0.95, 0), BIO, 0.9); world.add(coreW);
    const glow = new THREE.Mesh(K(new THREE.SphereGeometry(0.34, 16, 16)), K(new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }))); world.add(glow);
    const sats = []; for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(K(new THREE.SphereGeometry(0.14, 10, 10)), K(new THREE.MeshBasicMaterial({ color: 0x6f9580, transparent: true, opacity: 0.55 }))); world.add(s); sats.push({ m: s, r: 2.05, sp: 0.5 + i * 0.22, ph: i * 2.1, tl: i * 0.5 }); }
    update = (t) => { coreW.rotation.y = t * 0.3; coreW.rotation.x = t * 0.15; glow.scale.setScalar(1 + Math.sin(t * 2) * 0.08); sats.forEach((s) => { const a = t * s.sp + s.ph; s.m.position.set(Math.cos(a) * s.r, Math.sin(a * 0.7 + s.tl) * 0.6, Math.sin(a) * s.r); }); };
  } else { // "journey" — wireframe globe with an arc + a marker traveling Makassar -> world
    const globe = new THREE.LineSegments(K(new THREE.WireframeGeometry(new THREE.SphereGeometry(1.3, 16, 12))), K(new THREE.LineBasicMaterial({ color: EMER, transparent: true, opacity: 0.28 }))); world.add(globe);
    const A = new THREE.Vector3(-0.9, -0.5, 0.7).normalize().multiplyScalar(1.3);
    const B = new THREE.Vector3(1.0, 0.85, -0.2).normalize().multiplyScalar(1.3);
    const mid = A.clone().add(B).multiplyScalar(0.5).normalize().multiplyScalar(2.2);
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    world.add(new THREE.Mesh(K(new THREE.TubeGeometry(curve, 40, 0.02, 8, false)), K(new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }))));
    const start = new THREE.Mesh(K(new THREE.SphereGeometry(0.09, 10, 10)), K(new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, blending: THREE.AdditiveBlending }))); start.position.copy(A); world.add(start);
    const mk = new THREE.Mesh(K(new THREE.SphereGeometry(0.1, 12, 12)), K(new THREE.MeshBasicMaterial({ color: 0xeafff4, transparent: true, blending: THREE.AdditiveBlending }))); world.add(mk);
    const end = new THREE.Mesh(K(new THREE.OctahedronGeometry(0.16, 0)), K(new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.9 }))); end.position.copy(B); world.add(end);
    update = (t) => { mk.position.copy(curve.getPoint((t * 0.2) % 1)); globe.rotation.y = t * 0.12; end.rotation.y = t * 1.5; };
  }

  // drag rotate + autorotate
  let rotY = 0.4, rotX = 0.14, tRotY = 0.4, tRotX = 0.14, dragging = false, lastX = 0, lastY = 0, autorot = true;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; autorot = false; lastX = e.clientX; lastY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
  window.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointermove", (e) => { if (!dragging) return; tRotY += (e.clientX - lastX) * 0.01; tRotX = Math.max(-0.6, Math.min(0.6, tRotX + (e.clientY - lastY) * 0.008)); lastX = e.clientX; lastY = e.clientY; });

  let cw = 0, ch = 0; const host = canvas.parentElement;
  function resize() { const w = canvas.clientWidth || host.clientWidth, h = canvas.clientHeight || host.clientHeight; if (!w || !h) return; cw = w; ch = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (REDUCE) renderer.render(scene, camera); }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  let visible = true; new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.01 }).observe(canvas);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || !SHOWN(canvas)) return;
    const t = performance.now() * 0.001;
    if (autorot) tRotY += 0.004;
    rotY += (tRotY - rotY) * 0.08; rotX += (tRotX - rotX) * 0.08;
    world.rotation.y = rotY; world.rotation.x = rotX;
    update(t);
    renderer.render(scene, camera);
  }
  if (REDUCE) { update(0); world.rotation.set(0.14, 0.4, 0); renderer.render(scene, camera); } else frame();
}

/* ---------- boot ---------- */
function boot() {
  try {
    const hero = document.getElementById("heroCanvas");
    if (hero) initHeroOrb(hero);
    const globe = document.getElementById("globeCanvas");
    if (globe) initGlobe(globe);
    const cafe = document.getElementById("cafeCanvas");
    if (cafe) initCafe(cafe);
    const pc = document.getElementById("problemCanvas");
    if (pc) initProblems(pc);
    const botL = document.getElementById("botLauncherCanvas");
    if (botL) initLivBot(botL, "bust");
    const botP = document.getElementById("botPanelCanvas");
    if (botP) initLivBot(botP, "full");
    const livHost = document.getElementById("livHostCanvas");
    if (livHost) initLivHost(livHost);
    const forest = document.getElementById("forestCanvas");
    if (forest) initForest(forest);
    document.querySelectorAll("canvas[data-holo]").forEach((c) => { try { initHoloEmblem(c); } catch (e) { console.warn("[glyiv] holo emblem failed:", c.dataset.holo, e); } });
    document.body.classList.add("webgl-on");
  } catch (e) {
    console.warn("[glyiv] WebGL scene failed, using CSS fallback:", e);
  }
}
boot();
