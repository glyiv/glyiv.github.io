/* ══════════════════════════════════════════════════════════════════════════════
   GLYIV — Globe 3D halaman /team  ·  #team-globe
   ══════════════════════════════════════════════════════════════════════════════
   Mengganti peta datar SVG (EROPA / GLOBAL / INDONESIA) dengan bola bumi yang
   berputar: titik daratan + garis lintang-bujur, dan busur yang BERANGKAT dari
   satu titik asal (Indonesia) menuju negara-negara tujuan, dengan jalur berjalan.

   Muatnya persis seperti scenes.js:
       <script type="importmap">{"imports":{"three":"/assets/vendor/three.module.js"}}</script>
       <script type="module" src="/assets/js/globe-tim.js"></script>
   Berkas ini TIDAK menyunting team.html — ia hanya mencari elemen ber-id
   "team-globe". Kalau elemen itu tidak ada, modul diam total: tanpa galat,
   tanpa peringatan konsol, tanpa konteks WebGL yang dibuat sia-sia.

   ── KINERJA (pemilik menguji di Samsung Galaxy Tab S10, tuntutannya NOL lag) ──
   1. TIDAK ADA satu pun API pembaca tata letak di seluruh berkas ini — bukan
      hanya "tidak di dalam loop". Semua nama API rect/offset/scroll/visibility
      yang memaksa tata letak sinkron: NOL kemunculan (silakan di-grep).
      Ukurannya datang GRATIS dari `ResizeObserver.contentRect`, disimpan di
      variabel, dan hanya diperbarui saat ukurannya benar-benar berubah.
      Penyeretan memakai SELISIH `clientX/clientY` — tidak butuh rect.
   2. `prefers-reduced-motion` → globe DIAM. Tidak ada rAF berulang sama sekali;
      hanya satu bingkai digambar saat perlu (ukuran berubah / mulai terlihat /
      diseret pengguna).
   3. Kanvas di luar layar → berhenti merender (IntersectionObserver), begitu
      pula saat tab tidak aktif (`document.hidden`).
   4. devicePixelRatio dibatasi maksimal 2 (1,5 pada layar sentuh, yang fill-rate
      GPU-nya jauh lebih sempit daripada desktop).
   5. Jalur berjalan digambar dengan `setDrawRange` — tidak ada unggahan buffer
      ke GPU per bingkai, tidak ada alokasi objek per bingkai.
   6. `touch-action: pan-y` → gerakan jari ke ATAS-BAWAH tetap menggulir halaman
      seperti biasa (globe tidak pernah menyandera gulir); yang diambil globe
      hanya gerakan mendatar.
   ══════════════════════════════════════════════════════════════════════════════ */
import * as THREE from "three";

/* ── palet merek (situs terang & editorial — bukan dasbor gelap) ───────────── */
const PINE = 0x0f2e22;
const TEAL = 0x1f7a6b;
const BRASS = 0xb0894f;
const PAPER = 0xf9fbfa;

const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
/* Batas keras devicePixelRatio: 2. Layar sentuh dipotong lebih rendah lagi. */
const DPR = Math.min(window.devicePixelRatio || 1, COARSE ? 1.5 : 2);
/* Dibaca SEKALI saat init (bukan di dalam loop) untuk menentukan kepadatan titik. */
const KECIL = COARSE || window.innerWidth < 760;

/* ── titik asal & negara tujuan ────────────────────────────────────────────────
   Koordinat tingkat NEGARA (bukan kota/daerah — situs publik tidak menyebut
   nama kota). `eropa: true` diwarnai kuningan: itulah jembatan yang diceritakan
   halaman ini; sisanya teal. */
const ASAL = { lat: -2.5, lng: 118 };
const TUJUAN = [
  { nama: "Jerman", lat: 51.2, lng: 10.4, eropa: true },
  { nama: "Britania Raya", lat: 54.0, lng: -2.5, eropa: true },
  { nama: "Swiss", lat: 46.8, lng: 8.2, eropa: true },
  { nama: "Uni Emirat Arab", lat: 24.3, lng: 54.0 },
  { nama: "India", lat: 22.5, lng: 79.0 },
  { nama: "Jepang", lat: 36.4, lng: 138.3 },
  { nama: "Singapura", lat: 1.35, lng: 103.8 },
  { nama: "Australia", lat: -25.3, lng: 133.8 },
  { nama: "Amerika Serikat", lat: 39.5, lng: -98.5 },
];

/* ── util ─────────────────────────────────────────────────────────────────── */
function latLon(lat, lon, R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -R * Math.sin(phi) * Math.cos(th),
    R * Math.cos(phi),
    R * Math.sin(phi) * Math.sin(th)
  );
}

/* Tekstur PUTIH lembut → diwarnai lewat `color` materialnya, jadi satu tekstur
   dipakai ulang untuk semua penanda (hemat memori GPU). */
function teksturTitik(keras) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "#ffffff");
  if (keras) {
    /* Titik daratan butuh tepi TEGAS: dengan gradien lembut, titik selebar 3 px
       di ponsel meleber jadi kelabu dan benua tidak terbaca lagi. */
    grd.addColorStop(0.58, "rgba(255,255,255,.98)");
    grd.addColorStop(0.82, "rgba(255,255,255,.45)");
  } else {
    grd.addColorStop(0.42, "rgba(255,255,255,.92)");
  }
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  if ("SRGBColorSpace" in THREE) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/* Gradien vertikal untuk permukaan bola. Sengaja TEKSTUR, bukan lampu:
   sejak three r155 satuan intensitas cahaya berubah (bagi π), sehingga
   `AmbientLight(0.9)` menghasilkan bola KELABU — persis cacat yang terlihat di
   uji pertama. Gradien tidak bergantung versi, lebih murah (tanpa shader
   pencahayaan), dan hasilnya persis seperti yang dirancang: kertas terang di
   atas, teduh sangat tipis di bawah. */
function teksturBola() {
  const c = document.createElement("canvas");
  c.width = 4; c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(0.45, "#fbfdfc");
  grd.addColorStop(1, "#dfe9e3");
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  if ("SRGBColorSpace" in THREE) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function teksturCincin() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.strokeStyle = "#ffffff";
  g.lineWidth = 5;
  g.globalAlpha = 0.9;
  g.beginPath();
  g.arc(32, 32, 24, 0, Math.PI * 2);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  if ("SRGBColorSpace" in THREE) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Topeng daratan: elips-elips kasar yang membentuk benua. Sengaja BUKAN tekstur
   foto — halaman ini editorial, bukan dasbor satelit. */
function topengDunia() {
  const W = 400, H = 200;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#fff";
  const P = (lon, lat) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
  const b = (lon, lat, rx, ry, rot) => {
    const [px, py] = P(lon, lat);
    x.beginPath(); x.ellipse(px, py, rx, ry, rot || 0, 0, Math.PI * 2); x.fill();
  };
  b(-103, 50, 32, 20, -0.3); b(-92, 34, 20, 13); b(-118, 60, 16, 11); b(-78, 44, 13, 12); b(-100, 23, 9, 7);
  b(-84, 13, 7, 6); b(-63, -12, 18, 24, 0.2); b(-60, -33, 10, 12); b(-72, 4, 9, 9);
  b(-42, 72, 12, 9);
  b(12, 52, 15, 10); b(26, 56, 12, 9); b(5, 45, 8, 7);
  b(18, 4, 20, 22, 0); b(26, 12, 13, 11); b(22, -22, 13, 13); b(40, 8, 8, 9);
  b(82, 52, 44, 22, 0.05); b(108, 42, 26, 16); b(70, 27, 19, 15); b(100, 18, 15, 11); b(132, 58, 20, 13); b(48, 40, 14, 12);
  b(112, -2, 16, 6); b(135, -4, 9, 5); b(122, 0, 8, 5);
  b(134, -26, 19, 13);
  return c;
}

/* Kisi lintang–bujur SUNGGUHAN: meridian dan paralel, digambar sendiri.
   `WireframeGeometry(SphereGeometry)` sempat dipakai dan hasilnya salah — ia
   mengeluarkan sisi SEGITIGA, jadi tiap kotak kisi dapat garis diagonal dan
   globe-nya penuh bentuk bintang (terlihat jelas di uji ponsel). */
function geoKisi(R, meridian, paralel, halus) {
  const p = [];
  const dorong = (a, b) => { p.push(a.x, a.y, a.z, b.x, b.y, b.z); };
  for (let m = 0; m < meridian; m++) {
    const lon = -180 + (m * 360) / meridian;
    let sebelum = latLon(-90, lon, R);
    for (let i = 1; i <= halus; i++) {
      const v = latLon(-90 + (180 * i) / halus, lon, R);
      dorong(sebelum, v); sebelum = v;
    }
  }
  for (let q = 1; q < paralel; q++) {
    const lat = -90 + (q * 180) / paralel;
    let sebelum = latLon(lat, -180, R);
    for (let i = 1; i <= halus; i++) {
      const v = latLon(lat, -180 + (360 * i) / halus, R);
      dorong(sebelum, v); sebelum = v;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(p), 3));
  return g;
}

/* Busur lingkaran-besar (slerp) yang diangkat ke atas permukaan — makin jauh
   tujuannya, makin tinggi lengkungnya. Dihitung SEKALI saat init. */
function titikBusur(va, vb, N, R) {
  const a = va.clone().normalize();
  const bb = vb.clone().normalize();
  const dot = Math.max(-1, Math.min(1, a.dot(bb)));
  const om = Math.acos(dot);
  const so = Math.sin(om);
  const puncak = 0.07 + 0.3 * (om / Math.PI);
  const titik = [];
  const q = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const p = new THREE.Vector3();
    if (so < 1e-6) p.copy(a).lerp(bb, t).normalize();
    else {
      p.copy(a).multiplyScalar(Math.sin((1 - t) * om) / so);
      q.copy(bb).multiplyScalar(Math.sin(t * om) / so);
      p.add(q).normalize();
    }
    p.multiplyScalar(R * (1 + puncak * Math.sin(Math.PI * t)));
    titik.push(p);
  }
  return titik;
}

/* ══════════════════════════════════════════════════════════════════════════════
   PEMASANGAN
   `induk` boleh berupa <canvas> atau wadah apa pun (div/figure); kalau bukan
   kanvas, satu <canvas> dibuat di dalamnya.
   ══════════════════════════════════════════════════════════════════════════════ */
export function pasangGlobeTim(induk) {
  if (!induk || induk.__globeTim) return null;

  const kanvas = induk.tagName === "CANVAS" ? induk : document.createElement("canvas");
  const host = kanvas === induk ? induk.parentElement || induk : induk;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: kanvas, alpha: true, antialias: !COARSE });
  } catch (e) {
    /* Tanpa WebGL: tandai lewat atribut data supaya CSS bisa menyiapkan cadangan.
       Sengaja TIDAK menulis ke konsol — konsol kotor adalah konsol yang tak dibaca. */
    induk.setAttribute("data-globe", "gagal");
    return null;
  }
  induk.__globeTim = true;
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);

  if (kanvas !== induk) {
    kanvas.style.cssText = "width:100%;height:100%;display:block";
    induk.appendChild(kanvas);
  }
  kanvas.style.touchAction = "pan-y"; /* gulir vertikal tetap milik halaman */
  kanvas.style.cursor = "grab";
  kanvas.setAttribute("role", "img");
  kanvas.setAttribute("aria-label", "Globe 3D berputar: jalur dari titik Indonesia menuju negara-negara lain");
  kanvas.setAttribute("data-label-en", "Rotating 3D globe: routes from Indonesia to other countries");
  kanvas.setAttribute("data-label-ar", "كرة أرضية ثلاثية الأبعاد دوّارة: مسارات من إندونيسيا إلى دول أخرى");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.37, 3.72); /* diperbarui oleh resize() sesuai bentuk wadah */
  camera.lookAt(0, 0, 0);

  /* Tiga tingkat grup supaya kemiringan sumbu TIDAK ikut berputar:
     miring(z) → sumbu(x, dari seretan) → putar(y, putaran globe). */
  const miring = new THREE.Group();
  miring.rotation.z = 0.26;
  scene.add(miring);
  const sumbu = new THREE.Group();
  miring.add(sumbu);
  const putar = new THREE.Group();
  sumbu.add(putar);

  const R = 1;

  /* ── bola dasar: kertas dengan gradien tetap. Ditaruh di grup yang TIDAK
     berputar — bolanya polos, jadi memutarnya tak mengubah apa pun, sementara
     gradiennya tetap diam dan berlaku seperti cahaya tetap. */
  const texBola = teksturBola();
  const bola = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.995, 44, 32),
    new THREE.MeshBasicMaterial({ map: texBola, color: PAPER })
  );
  miring.add(bola);

  /* ── halo tipis di siluet (BackSide → hanya cincin di tepi yang terlihat) */
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.05, 36, 26),
    new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.13, side: THREE.BackSide, depthWrite: false })
  );
  miring.add(halo);

  /* ── kisi lintang–bujur (bagian "bergaris") */
  const kisi = new THREE.LineSegments(
    geoKisi(R * 1.002, KECIL ? 12 : 18, KECIL ? 6 : 9, 56),
    new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.26, depthWrite: false })
  );
  putar.add(kisi);

  /* ── titik daratan (bagian "bertitik") */
  const topeng = topengDunia();
  const tw = topeng.width, th = topeng.height;
  const td = topeng.getContext("2d").getImageData(0, 0, tw, th).data;
  const daratan = (lat, lon) => {
    let u = Math.floor(((lon + 180) / 360) * tw);
    u = ((u % tw) + tw) % tw;
    const v = Math.max(0, Math.min(th - 1, Math.floor(((90 - lat) / 180) * th)));
    return td[(v * tw + u) * 4] > 120;
  };
  const CACAH = KECIL ? 9000 : 13000;
  const emas = Math.PI * (3 - Math.sqrt(5));
  const tanah = [];
  for (let i = 0; i < CACAH; i++) {
    const y = 1 - (i / (CACAH - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = emas * i;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = (Math.atan2(z, x) * 180) / Math.PI;
    if (daratan(lat, lon)) tanah.push(x * R, y * R, z * R);
  }
  const texTitik = teksturTitik(false);   /* penanda & kepala busur: lembut, berpendar */
  const texTanah = teksturTitik(true);    /* daratan: tepi tegas, terbaca sampai ukuran ponsel */
  const geoTanah = new THREE.BufferGeometry();
  geoTanah.setAttribute("position", new THREE.BufferAttribute(new Float32Array(tanah), 3));
  const titikTanah = new THREE.Points(
    geoTanah,
    new THREE.PointsMaterial({ size: 0.022, color: PINE, map: texTanah, transparent: true, opacity: 0.95, depthWrite: false })
  );
  putar.add(titikTanah);

  /* ── penanda: asal (kuningan, lebih besar) + negara tujuan (teal) */
  const vAsal = latLon(ASAL.lat, ASAL.lng, R * 1.012);
  const penanda = (v, warna, ukuran) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texTitik, color: warna, transparent: true, depthWrite: false }));
    s.position.copy(v);
    s.scale.set(ukuran, ukuran, 1);
    putar.add(s);
    return s;
  };
  penanda(vAsal, BRASS, 0.115);
  const texCincin = teksturCincin();
  const denyut = new THREE.Sprite(new THREE.SpriteMaterial({ map: texCincin, color: BRASS, transparent: true, opacity: 0.55, depthWrite: false }));
  denyut.position.copy(vAsal);
  denyut.scale.set(0.2, 0.2, 1);
  putar.add(denyut);

  /* ── busur berjalan ───────────────────────────────────────────────────────
     Jalurnya TABUNG (TubeGeometry), bukan `Line`. Sebabnya diukur, bukan selera:
     `LineBasicMaterial` selalu setebal 1 piksel PERANGKAT — pada tablet ber-DPR 2
     itu jadi setengah piksel CSS, dan di uji pertama busurnya nyaris lenyap.
     Tabung punya ketebalan sungguhan di ruang 3D, jadi tetap terbaca di DPR
     berapa pun.

     Tiap busur dua benda:
       · `penuh` — seluruh jalur, tipis dan samar (jejak yang dituju);
       · `jalan` — potongan tebal yang BERJALAN dari asal ke tujuan.
     Yang berjalan digeser dengan `setDrawRange` pada buffer indeks. Indeks
     TubeGeometry berurutan per ruas memanjang (radial × 6 indeks per ruas),
     jadi satu rentang indeks = satu potongan tabung. Biayanya dua bilangan per
     bingkai: TANPA unggahan buffer, TANPA alokasi. */
  const N = 72;                                 // titik per busur
  const RUAS = N - 1;                           // ruas memanjang TubeGeometry
  const RADIAL = 6;                             // sisi penampang tabung
  const IPR = RADIAL * 6;                       // indeks per ruas
  const SPAN = KECIL ? 11 : 15;                 // panjang potongan berjalan (ruas)
  const busur = [];
  TUJUAN.forEach((t, i) => {
    const vb = latLon(t.lat, t.lng, R * 1.012);
    penanda(vb, TEAL, 0.072);
    const titik = titikBusur(vAsal, vb, N, R * 1.012);
    const kurva = new THREE.CatmullRomCurve3(titik);
    const warna = t.eropa ? BRASS : TEAL;

    putar.add(new THREE.Mesh(
      new THREE.TubeGeometry(kurva, RUAS, 0.0028, RADIAL, false),
      new THREE.MeshBasicMaterial({ color: warna, transparent: true, opacity: REDUCE ? 0.62 : 0.3, depthWrite: false })
    ));

    if (REDUCE) return; /* gerak dimatikan → cukup jalur penuh yang jelas */

    const gJalan = new THREE.TubeGeometry(kurva, RUAS, 0.0055, RADIAL, false);
    gJalan.setDrawRange(0, 0);
    putar.add(new THREE.Mesh(gJalan, new THREE.MeshBasicMaterial({ color: warna, transparent: true, opacity: 0.95, depthWrite: false })));

    const kepala = new THREE.Sprite(new THREE.SpriteMaterial({ map: texTitik, color: warna, transparent: true, depthWrite: false }));
    kepala.scale.set(0.058, 0.058, 1);
    kepala.visible = false;
    putar.add(kepala);

    busur.push({ titik, geo: gJalan, kepala, laju: 0.12 + (i % 4) * 0.026, off: (i * 0.37) % 1 });
  });

  /* ── orientasi awal: hadapkan titik asal ke kamera (DIHITUNG, bukan ditebak).
     Rotasi +Y menggeser titik ke KANAN layar, jadi asalnya ditaruh sedikit di
     KIRI tengah: putaran otomatis membawanya melewati tengah beberapa detik
     setelah bagian ini masuk layar, lalu perlahan ke tepi. Kalau ditaruh pas di
     tengah, Indonesia justru langsung menjauh — padahal dialah titik ceritanya. */
  const azAsal = Math.atan2(vAsal.x, vAsal.z);
  let tPutarY = -azAsal - 0.34;
  let putarY = tPutarY;
  let tSumbuX = 0.16, sumbuX = tSumbuX;
  putar.rotation.y = putarY;
  sumbu.rotation.x = sumbuX;

  /* ── seret untuk memutar; putaran otomatis BERHENTI selama diseret ───────── */
  let menyeret = false, autoputar = !REDUCE, xTerakhir = 0, yTerakhir = 0, jamLanjut = 0;
  const mulaiSeret = (e) => {
    menyeret = true;
    autoputar = false;
    xTerakhir = e.clientX; yTerakhir = e.clientY;
    kanvas.style.cursor = "grabbing";
    try { kanvas.setPointerCapture(e.pointerId); } catch (x) { /* diabaikan */ }
  };
  const geserSeret = (e) => {
    if (!menyeret) return;
    tPutarY += (e.clientX - xTerakhir) * 0.0075;
    /* Sentuhan hanya memutar mendatar: gerakan vertikal jari milik gulir halaman. */
    if (e.pointerType !== "touch") {
      tSumbuX = Math.max(-0.8, Math.min(0.8, tSumbuX + (e.clientY - yTerakhir) * 0.006));
    }
    xTerakhir = e.clientX; yTerakhir = e.clientY;
    if (REDUCE) { putarY = tPutarY; sumbuX = tSumbuX; putar.rotation.y = putarY; sumbu.rotation.x = sumbuX; gambarSekali(); }
  };
  const selesaiSeret = () => {
    if (!menyeret) return;
    menyeret = false;
    kanvas.style.cursor = "grab";
    jamLanjut = performance.now() + 1800; /* jeda sejenak sebelum berputar lagi */
  };
  kanvas.addEventListener("pointerdown", mulaiSeret, { passive: true });
  kanvas.addEventListener("pointermove", geserSeret, { passive: true });
  window.addEventListener("pointerup", selesaiSeret, { passive: true });
  window.addEventListener("pointercancel", selesaiSeret, { passive: true });

  /* ── ukuran: SATU-SATUNYA sumbernya contentRect dari ResizeObserver ───────── */
  let mati = false, menunggu = false;
  let L = 0, T = 0, tinggiDipaksa = false;
  const ro = new ResizeObserver((entri) => {
    const kotak = entri[entri.length - 1].contentRect;
    let w = Math.round(kotak.width);
    let h = Math.round(kotak.height);
    if (!w) return;
    /* Pagar: kalau wadahnya tidak diberi tinggi oleh CSS, tetapkan tinggi wajar
       SEKALI (bukan berulang — kalau berulang, RO akan saling memicu). */
    if (h < 80 && !tinggiDipaksa) {
      tinggiDipaksa = true;
      h = Math.round(Math.min(560, Math.max(300, w * 0.62)));
      kanvas.style.height = h + "px";
    }
    if (h < 1 || (w === L && h === T)) return;
    L = w; T = h;
    renderer.setSize(w, h, false);
    /* Jarak kamera MENGIKUTI bentuk wadah supaya bola selalu utuh. Tanpa ini,
       wadah tegak di ponsel memotong globe di kiri-kanan (terbukti di uji 390px:
       bolanya terpotong). Hitungannya: setengah-tinggi bidang pandang pada
       jarak d = d·tan(fov/2); setengah-lebar = itu × rasio. Sisi terkecil yang
       harus memuat MUAT. Dihitung di sini — SEKALI per perubahan ukuran, tidak
       pernah di dalam loop. */
    const rasio = w / h;
    const MUAT = 1.28; /* jari-jari bola 1 + ruang untuk lengkung busur */
    const jarak = MUAT / (Math.tan((camera.fov * Math.PI) / 360) * Math.min(1, rasio));
    camera.aspect = rasio;
    camera.position.set(0, jarak * 0.1, jarak);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    gambarSekali();
  });
  ro.observe(host);

  let terlihat = false;
  const io = new IntersectionObserver(
    (es) => {
      terlihat = es[es.length - 1].isIntersecting;
      if (terlihat) gambarSekali();
    },
    { threshold: 0.01 }
  );
  io.observe(kanvas);

  /* ── render ───────────────────────────────────────────────────────────────
     Mode DIAM (prefers-reduced-motion): tidak ada loop sama sekali; satu bingkai
     digambar saat ukuran berubah / mulai terlihat / diseret. */
  function gambarSekali() {
    if (mati || menunggu || !L || !T) return;
    menunggu = true;
    requestAnimationFrame(() => {
      menunggu = false;
      if (!mati) renderer.render(scene, camera);
    });
  }

  /* Gerak diikat ke WAKTU, bukan ke jumlah bingkai. Pemilik menguji di Galaxy
     Tab S10 yang layarnya 90 Hz — dengan penambahan per-bingkai, globe di sana
     berputar 1,5× lebih cepat daripada di layar 60 Hz (dan di uji headless
     terukur ~165 bingkai/detik, 2,8× terlalu cepat). `dt` dibatasi supaya
     kembalinya tab dari latar tidak membuat globe melompat. */
  const LAJU = 0.055; /* rad/detik → satu putaran ±114 detik */
  const jam = new THREE.Clock();
  let t = 0;
  function bingkai() {
    if (mati) return;
    requestAnimationFrame(bingkai);
    const dt = Math.min(jam.getDelta(), 0.05);
    if (!terlihat || document.hidden || !L) return;
    t += dt;

    if (!menyeret && !autoputar && jamLanjut && performance.now() > jamLanjut) { autoputar = true; jamLanjut = 0; }
    if (autoputar && !menyeret) tPutarY += LAJU * dt;

    /* Peredaman eksponensial: hasilnya sama di 60 Hz maupun 120 Hz. */
    const k = 1 - Math.exp(-6 * dt);
    putarY += (tPutarY - putarY) * k;
    sumbuX += (tSumbuX - sumbuX) * k;
    putar.rotation.y = putarY;
    sumbu.rotation.x = sumbuX;

    const d = 0.19 + 0.075 * (1 + Math.sin(t * 1.7));
    denyut.scale.set(d, d, 1);
    denyut.material.opacity = 0.5 - 0.22 * Math.sin(t * 1.7);

    for (let i = 0; i < busur.length; i++) {
      const b = busur[i];
      const p = (t * b.laju + b.off) % 1;
      /* Mulai dari -SPAN supaya potongannya MUNCUL dari titik asal dan HABIS di
         titik tujuan — bukan sekadar melompat balik ke awal. */
      const s = Math.round(p * (RUAS + SPAN)) - SPAN;
      const awal = Math.max(0, s);
      const akhir = Math.min(RUAS, s + SPAN);
      const jml = Math.max(0, akhir - awal);
      b.geo.setDrawRange(awal * IPR, jml * IPR);
      if (jml > 0) {
        b.kepala.visible = true;
        b.kepala.position.copy(b.titik[akhir]);
      } else b.kepala.visible = false;
    }
    renderer.render(scene, camera);
  }
  if (!REDUCE) bingkai();

  /* ── pelepasan (SPA/React bisa melepas-pasang elemen yang sama) ──────────── */
  function lepas() {
    if (mati) return;
    mati = true;
    ro.disconnect();
    io.disconnect();
    kanvas.removeEventListener("pointerdown", mulaiSeret);
    kanvas.removeEventListener("pointermove", geserSeret);
    window.removeEventListener("pointerup", selesaiSeret);
    window.removeEventListener("pointercancel", selesaiSeret);
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    texTitik.dispose();
    texTanah.dispose();
    texCincin.dispose();
    texBola.dispose();
    renderer.dispose();
    induk.__globeTim = false;
  }
  /* Keadaan yang BISA DIBACA dari peramban. Aturan proyek ini melarang menyebut
     sesuatu "jalan" tanpa membaca keadaannya di halaman hidup — jadi keadaannya
     disediakan, bukan disembunyikan. Murni pembacaan: memanggilnya tidak
     mengubah apa pun dan tidak menyentuh tata letak. */
  induk.__globeTimKeadaan = () => ({
    putarY, sumbuX, menyeret, autoputar, terlihat, lebar: L, tinggi: T, diam: REDUCE, busur: busur.length,
  });
  induk.__globeTimLepas = lepas;
  return { lepas };
}

/* ══════════════════════════════════════════════════════════════════════════════
   PEMASANGAN OTOMATIS — elemen ber-id "team-globe" (juga [data-globe-tim]).
   Kalau tidak ada: diam. Tanpa galat, tanpa konteks WebGL.
   Init ditunda sampai elemennya mendekati layar supaya boot halaman tetap ringan.
   ══════════════════════════════════════════════════════════════════════════════ */
function pasangOtomatis() {
  const daftar = [];
  const utama = document.getElementById("team-globe");
  if (utama) daftar.push(utama);
  document.querySelectorAll("[data-globe-tim]").forEach((el) => {
    if (daftar.indexOf(el) < 0) daftar.push(el);
  });
  if (!daftar.length) return; /* halaman lain → tidak melakukan apa pun */

  daftar.forEach((el) => {
    if (!("IntersectionObserver" in window)) { pasangGlobeTim(el); return; }
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        pasangGlobeTim(el);
      },
      { rootMargin: "250px" }
    );
    io.observe(el);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", pasangOtomatis, { once: true });
} else {
  pasangOtomatis();
}

/* Kait global yang idempoten — polanya sama dengan `window.glyivMountBot` di
   scenes.js. Gunanya untuk halaman yang membuat wadahnya SESUDAH modul ini
   dimuat (mis. hasil port ke React yang me-mount ulang komponennya). Aman
   dipanggil berkali-kali: pemasangan kedua ditolak oleh penjaga per-elemen. */
window.glyivPasangGlobeTim = function (el) {
  el = el || document.getElementById("team-globe");
  if (!el) return null;
  return pasangGlobeTim(el);
};

export default pasangGlobeTim;
