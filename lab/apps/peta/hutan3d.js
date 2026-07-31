/* ══════════════════════════════════════════════════════════════════════════════
   HUTAN 3D — model hutan + pohon virtual petak terpilih, DI BAWAH PETA
   ══════════════════════════════════════════════════════════════════════════════

   Menutup jarak antara teaser peta dan aplikasi gamifikasi Glyiv Green Assets:
   menekan sebuah petak di peta menampilkan titik pohon virtualnya di peta, dan
   hutan 3D yang sama — pohon yang sama, posisi yang sama — tepat di bawahnya.

   ── YANG SUNGGUHAN DAN YANG PERMAINAN ───────────────────────────────────────
   Batang di adegan ini BUKAN pohon nyata. Posisinya dibangkitkan app.js dari
   satu angka kerapatan tanam perkiraan (900 batang/ha ⚠︎), tingginya angka
   contoh, dan tidak ada seorang pun yang menanamnya. Lencana "MODEL SIMULASI"
   di sudut kanvas TIDAK BISA dimatikan, persis seperti di aplikasinya.

   ── KENAPA three.js DIMUAT BELAKANGAN ───────────────────────────────────────
   `three.module.js` berukuran 1,2 MB. Membuatnya ikut terunduh pada setiap
   kunjungan halaman peta akan membebani tablet untuk bagian halaman yang belum
   tentu digulir sampai ke sana. Jadi ia diambil pada saat PERTAMA seksi ini
   masuk layar (IntersectionObserver) — bukan pada saat memuat halaman, dan
   bukan pula lewat tombol yang harus ditekan.

   Pemuatnya `/assets/vendor/muat-three.js` disuntik sebagai <script
   type="module">, bukan `import()` langsung: berkas vendornya tinggal di luar
   graf modul Vite, dan `import()` langsung membuat middleware Vite menjawab 500
   untuk halaman hasil port di glyiv.web.app. Alasan lengkapnya ada di dalam
   berkas pemuat itu.

   ── ANIMASI TIDAK PERNAH DIMATIKAN, HANYA TIDAK DIGAMBAR SAAT TAK TERLIHAT ──
   Orbit lambatnya berjalan terus selama seksi ini di layar. Saat ia keluar
   layar, gelung render berhenti — itu bukan memangkas animasi, itu berhenti
   menggambar sesuatu yang tidak ada yang melihat. Begitu kembali terlihat,
   gerakannya lanjut dari sudut yang sama.
   ══════════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var wrap = document.querySelector("[data-hutan3d]");
  if (!wrap) return;

  var kanvasBox = wrap.querySelector("[data-h3-kanvas]");
  var judulEl = wrap.querySelector("[data-h3-judul]");
  var metaEl = wrap.querySelector("[data-h3-meta]");
  var statusEl = wrap.querySelector("[data-h3-status]");
  if (!kanvasBox || !statusEl) return;

  /** Jari-jari bola yang dipakai SELURUH sistem Glyiv (lihat _glyiv-brain/RULES.md).
   *  Dipakai di sini hanya untuk mengubah selisih derajat menjadi meter adegan —
   *  bukan perhitungan luas — tetapi tetap dari bola yang sama supaya tidak ada
   *  konstanta geodesi kedua yang bisa melenceng. */
  var R_BUMI = 6371008.8;
  var METER_PER_DERAJAT = (R_BUMI * Math.PI) / 180;

  var terpilih = null;   /* { petak, pohon, ringkas } */
  var Tiga = null;       /* namespace three.js begitu termuat */
  var adegan = null;     /* { renderer, scene, camera, … } */
  var mintaMuat = false;
  var terlihat = false;
  var gagal = false;

  /* ── teks status: selalu jujur tentang keadaan yang sedang berlaku ───────── */

  function status(teks, nada) {
    statusEl.textContent = teks;
    statusEl.className = "h3-status" + (nada ? " " + nada : "");
  }

  function angka(n) {
    return (window.GA && GA.fmt) ? GA.fmt(n) : Math.round(n).toLocaleString("id-ID");
  }

  /* ── pemuat three.js ─────────────────────────────────────────────────────── */

  function muatTiga() {
    if (Tiga || mintaMuat || gagal) return;
    mintaMuat = true;
    if (window.__glyivTiga) { Tiga = window.__glyivTiga; siap(); return; }

    status("Mengambil pustaka 3D (1,2 MB)…", "");
    window.addEventListener("glyiv-tiga-siap", function () {
      Tiga = window.__glyivTiga;
      siap();
    }, { once: true });

    var s = document.createElement("script");
    s.type = "module";
    s.src = "/assets/vendor/muat-three.js";
    s.onerror = function () {
      gagal = true;
      status("Pustaka 3D gagal dimuat, jadi hutannya tidak bisa digambar di sini. Titik pohon virtual di peta di atas tetap berlaku, dan hutan 3D penuhnya ada di aplikasi Glyiv Green Assets.", "warn");
    };
    document.head.appendChild(s);
  }

  function siap() {
    if (!Tiga) return;
    bangunAdegan();
    if (terpilih) isiHutan();
    else status("Pilih sebuah petak di peta di atas — hutan 3D-nya digambar di sini.", "");
  }

  /* ── adegan ──────────────────────────────────────────────────────────────── */

  function bangunAdegan() {
    if (adegan) return;

    var renderer = new Tiga.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    /* Tablet: piksel rasio dijepit 1,75. Di atas itu jumlah piksel yang digambar
       naik kuadratik tanpa perbedaan yang terlihat pada adegan sesederhana ini. */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(kanvasBox.clientWidth, kanvasBox.clientHeight, false);
    renderer.setClearColor(0xeef2ee, 1);
    kanvasBox.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "Model 3D hutan petak terpilih");

    var scene = new Tiga.Scene();
    scene.fog = new Tiga.Fog(0xeef2ee, 70, 190);

    var camera = new Tiga.PerspectiveCamera(42, kanvasBox.clientWidth / Math.max(1, kanvasBox.clientHeight), 0.5, 400);

    scene.add(new Tiga.HemisphereLight(0xffffff, 0xb8c6b4, 1.15));
    var matahari = new Tiga.DirectionalLight(0xfff6e2, 1.05);
    matahari.position.set(38, 60, 24);
    scene.add(matahari);

    var grup = new Tiga.Group();
    scene.add(grup);

    /* Sudut pandang awal DIUKUR di peramban, bukan ditebak: pada tinggi 0,42 dan
       jarak 74 setengah bingkai terisi langit kosong dan tegakan terbaca sebagai
       garis di kejauhan. 0,62 / 62 menaruh mata sedikit di atas tajuk — cukup
       untuk melihat sebaran pohonnya sebagai hutan, bukan siluet. */
    adegan = {
      renderer: renderer, scene: scene, camera: camera, grup: grup,
      sudut: 0.6, tinggi: 0.62, jarak: 62, target: new Tiga.Vector3(0, 3, 0),
      seret: null, jalan: false, terakhir: 0
    };

    pasangKendali(renderer.domElement);
    window.addEventListener("resize", ukurUlang);
  }

  function ukurUlang() {
    if (!adegan) return;
    var w = kanvasBox.clientWidth, h = kanvasBox.clientHeight;
    if (!w || !h) return;
    adegan.renderer.setSize(w, h, false);
    adegan.camera.aspect = w / h;
    adegan.camera.updateProjectionMatrix();
  }

  /* Pengendali orbit sendiri — sama pendekatannya dengan PohonTiga di aplikasi
     React: OrbitControls tidak ikut dalam berkas vendor yang kami simpan, jadi
     yang dibutuhkan (putar, naik-turun, dekat-jauh) ditulis langsung. Semua
     pendengar `passive:false` HANYA pada wheel/touchmove yang memang harus
     mencegah gulir halaman saat jari berada di dalam kanvas. */
  function pasangKendali(el) {
    el.style.touchAction = "none";

    el.addEventListener("pointerdown", function (e) {
      adegan.seret = { x: e.clientX, y: e.clientY };
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", function (e) {
      if (!adegan.seret) return;
      adegan.sudut -= (e.clientX - adegan.seret.x) * 0.006;
      adegan.tinggi = Math.max(0.06, Math.min(1.2, adegan.tinggi + (e.clientY - adegan.seret.y) * 0.005));
      adegan.seret = { x: e.clientX, y: e.clientY };
    });
    function lepas() { adegan.seret = null; }
    el.addEventListener("pointerup", lepas);
    el.addEventListener("pointercancel", lepas);
    el.addEventListener("pointerleave", lepas);

    el.addEventListener("wheel", function (e) {
      e.preventDefault();
      adegan.jarak = Math.max(18, Math.min(150, adegan.jarak + e.deltaY * 0.06));
    }, { passive: false });

    var cubit = null;
    el.addEventListener("touchmove", function (e) {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (cubit) adegan.jarak = Math.max(18, Math.min(150, adegan.jarak * (cubit / d)));
      cubit = d;
    }, { passive: false });
    el.addEventListener("touchend", function () { cubit = null; });
  }

  /* ── isi hutan dari petak terpilih ───────────────────────────────────────── */

  var WARNA_TAJUK = {
    mangrove: 0x1f7a6b,
    hutan: 0x2f8a55,
    agro: 0x6f9a46,
    pulih: 0x8aa55f
  };

  /* MEMBUANG SEMUA yang dipegang GPU — termasuk yang tidak dipegang geometri.
     ─────────────────────────────────────────────────────────────────────────
     `geometry.dispose()` + `material.dispose()` TIDAK cukup untuk InstancedMesh.
     Matriks per-instans (`instanceMatrix`) dan warna per-instans
     (`instanceColor`) adalah buffer GPU TERPISAH, dan three.js hanya
     melepaskannya lewat `InstancedMesh.dispose()` — lihat `onInstancedMeshDispose`
     di three.module.js r160 (`attributes.remove(instancedMesh.instanceMatrix)`).

     Diukur, bukan ditebak: dengan `gl.createBuffer`/`gl.deleteBuffer` dihitung
     dari luar, mengganti petak 8 kali membuat 125 buffer dan menghapus 101 —
     24 tersisa, tepat 3 per pergantian (batang.instanceMatrix +
     tajuk.instanceMatrix + tajuk.instanceColor). Pada tablet yang dipakai
     memilih-milih petak berpuluh kali, itu tumpukan yang tidak pernah surut.
     Sesudah `dispose()` ditambahkan: 101 buat / 101 hapus, sisa 0.

     `parent` dikosongkan sendiri karena `pop()` sudah mengeluarkan anaknya dari
     larik `children`, sehingga `grup.remove(anak)` tidak akan menemukannya lagi
     dan diam-diam meninggalkan `anak.parent` menunjuk grup yang sudah kosong. */
  function bersihkan(grup) {
    while (grup.children.length) {
      var anak = grup.children.pop();
      anak.parent = null;
      if (anak.geometry) anak.geometry.dispose();
      if (anak.material) anak.material.dispose();
      if (typeof anak.dispose === "function") anak.dispose();
    }
  }

  function isiHutan() {
    if (!adegan || !terpilih || !terpilih.petak) return;
    var p = terpilih.petak, pohon = terpilih.pohon || [];
    bersihkan(adegan.grup);

    /* Derajat → meter adegan, lalu diperkecil supaya petak seluas apa pun jatuh
       pada rentang pandang yang sama. Skala DITAMPILKAN di bawah kanvas, karena
       adegan yang diperkecil diam-diam akan menipu soal ukuran petak. */
    var kosLat = Math.max(0.2, Math.cos((p.lat * Math.PI) / 180));
    var jangkauan = 0;
    var lokal = pohon.map(function (t) {
      var x = (t.lng - p.lng) * METER_PER_DERAJAT * kosLat;
      var z = -(t.lat - p.lat) * METER_PER_DERAJAT;
      jangkauan = Math.max(jangkauan, Math.abs(x), Math.abs(z));
      return { x: x, z: z, vigor: t.vigor };
    });
    if (!lokal.length) { status("Petak ini tidak menghasilkan satu pun titik pohon.", "warn"); return; }

    var skala = 46 / Math.max(1, jangkauan);            /* petak selalu selebar ±46 satuan */
    var meterPerSatuan = 1 / skala;

    /* PEMBESARAN TINGGI POHON — dan kenapa ia harus ditulis di layar.
       ─────────────────────────────────────────────────────────────────────────
       Karena setiap petak dipaskan ke lebar bingkai yang sama, petak 118 ha
       memakai skala jauh lebih kecil daripada petak 42 ha — dan pada skala
       sejati pohon 9 m di petak 118 ha hanya setinggi setengah piksel. Hasilnya
       "hutan" yang terbaca sebagai debu, dan petak besar justru terlihat lebih
       gundul daripada petak kecil: kebalikan dari yang benar.

       Jadi tinggi batang dilebihkan sampai pohon 9 m selalu setinggi ±2,6
       satuan, berapa pun luas petaknya. Itu perangkat kartografi biasa
       (vertical exaggeration) — tetapi perangkat yang tidak disebutkan adalah
       kebohongan, jadi faktornya DITULIS di baris meta, bukan disembunyikan. */
    var TINGGI_TARGET = 2.6;
    var lebihTinggi = Math.min(14, Math.max(1, TINGGI_TARGET / Math.max(1e-6, 9 * skala)));

    /* alas: cakram tanah + jejak batas petak dengan warna status petaknya */
    var tanah = new Tiga.Mesh(
      new Tiga.CircleGeometry(60, 64),
      new Tiga.MeshLambertMaterial({ color: 0xe2e8dc })
    );
    tanah.rotation.x = -Math.PI / 2;
    adegan.grup.add(tanah);

    var batas = [];
    for (var i = 0; i < p.ring.length; i++) {
      var q = p.ring[i];
      batas.push(new Tiga.Vector3(
        (q[1] - p.lng) * METER_PER_DERAJAT * kosLat * skala,
        0.12,
        -(q[0] - p.lat) * METER_PER_DERAJAT * skala
      ));
    }
    batas.push(batas[0].clone());
    adegan.grup.add(new Tiga.Line(
      new Tiga.BufferGeometry().setFromPoints(batas),
      new Tiga.LineBasicMaterial({ color: parseInt((p.st && p.st.col ? p.st.col : "#1F7A6B").slice(1), 16) })
    ));

    /* Batang + tajuk sebagai InstancedMesh: satu panggilan gambar untuk ratusan
       pohon. Inilah yang membuat 420 pohon tetap ringan di tablet. */
    var n = lokal.length;
    var batang = new Tiga.InstancedMesh(
      new Tiga.CylinderGeometry(0.11, 0.17, 1, 6),
      new Tiga.MeshLambertMaterial({ color: 0x7a5c3a }),
      n
    );
    var kerucut = p.spesies === "agro" || p.spesies === "pulih";
    var geoTajuk = kerucut
      ? new Tiga.IcosahedronGeometry(0.62, 0)
      : new Tiga.ConeGeometry(0.62, 1.5, 7);
    var tajuk = new Tiga.InstancedMesh(
      geoTajuk,
      new Tiga.MeshLambertMaterial({ color: WARNA_TAJUK[p.spesies] || WARNA_TAJUK.hutan, flatShading: true }),
      n
    );

    var m = new Tiga.Matrix4(), qr = new Tiga.Quaternion(), pos = new Tiga.Vector3(), sc = new Tiga.Vector3();
    var sumbuY = new Tiga.Vector3(0, 1, 0);
    /* Warna per batang: satu warna rata membuat 420 kerucut terbaca sebagai satu
       gumpalan. Ragamnya kecil (±8% terang) dan diturunkan dari `vigor` yang
       sama, jadi tetap deterministik — pohon yang sama selalu warna yang sama. */
    var warnaTajuk = new Tiga.Color(WARNA_TAJUK[p.spesies] || WARNA_TAJUK.hutan);
    var warna = new Tiga.Color();
    for (var k = 0; k < n; k++) {
      var t = lokal[k];
      /* Tinggi ILUSTRATIF ⚠︎: 3,5–14,5 m, digerakkan satu undian "vigor" yang
         sama dengan yang dipakai ukuran titik di peta — pohon besar di peta juga
         besar di sini. */
      var tinggiM = 3.5 + t.vigor * 11;
      var tinggi = tinggiM * skala * lebihTinggi;
      var lebar = tinggi * (0.42 + t.vigor * 0.16);

      qr.setFromAxisAngle(sumbuY, t.vigor * Math.PI * 2);

      pos.set(t.x * skala, tinggi * 0.28, t.z * skala);
      sc.set(lebar * 0.16, tinggi * 0.56, lebar * 0.16);
      m.compose(pos, qr, sc);
      batang.setMatrixAt(k, m);

      pos.set(t.x * skala, tinggi * 0.62, t.z * skala);
      sc.set(lebar, tinggi * 0.62, lebar);
      m.compose(pos, qr, sc);
      tajuk.setMatrixAt(k, m);

      warna.copy(warnaTajuk).multiplyScalar(0.92 + t.vigor * 0.16);
      tajuk.setColorAt(k, warna);
    }
    batang.instanceMatrix.needsUpdate = true;
    tajuk.instanceMatrix.needsUpdate = true;
    if (tajuk.instanceColor) tajuk.instanceColor.needsUpdate = true;
    adegan.grup.add(batang);
    adegan.grup.add(tajuk);

    if (judulEl) judulEl.textContent = p.name;
    if (metaEl) {
      metaEl.innerHTML =
        "<span>" + p.prov + " · " + p.kindLabel + "</span>" +
        "<span>" + angka(p.ha) + " ha</span>" +
        /* `n`, BUKAN `ringkas.dirender`. Keduanya 420 selama tolak-terima
           berhasil memenuhi kuotanya, tetapi `pohonPetak()` di app.js berhenti
           setelah `dirender*60+2000` undian — poligon yang sangat menyerong bisa
           pulang dengan lebih sedikit. Memakai angka yang DIMINTA alih-alih
           angka yang BENAR-BENAR digambar adalah persis jenis selisih diam-diam
           yang tidak boleh ada di produk iklim. */
        "<span>" + angka(n) + " pohon digambar</span>" +
        /* Koma desimal, bukan titik: seluruh angka di situs ini berbahasa Indonesia. */
        "<span>skala ±" + (Math.round(meterPerSatuan * 10) / 10).toLocaleString("id-ID") + " m / satuan</span>" +
        "<span>tinggi pohon ×" + (Math.round(lebihTinggi * 10) / 10).toLocaleString("id-ID") + " ⚠︎</span>";
    }
    status(
      "Menggambar " + angka(n) + " pohon virtual dari perkiraan " +
      angka(terpilih.ringkas.penuh) + " batang ⚠︎ untuk petak ini. Posisinya sama persis dengan titik hijau di peta di atas. " +
      "Bukan pohon nyata, bukan sensus batang, dan tinggi batangnya angka contoh yang dilebihkan ×" +
      (Math.round(lebihTinggi * 10) / 10).toLocaleString("id-ID") +
      " agar tegakannya terbaca — seret untuk memutar.",
      ""
    );

    adegan.jarak = 74;
    jalankan();
  }

  /* ── gelung render ───────────────────────────────────────────────────────── */

  function bingkai(waktu) {
    if (!adegan || !adegan.jalan) return;
    var dt = adegan.terakhir ? Math.min(0.05, (waktu - adegan.terakhir) / 1000) : 0.016;
    adegan.terakhir = waktu;
    if (!adegan.seret) adegan.sudut += dt * 0.09;       /* orbit lambat yang berjalan sendiri */

    var c = adegan.camera;
    c.position.set(
      Math.cos(adegan.sudut) * adegan.jarak * Math.cos(adegan.tinggi),
      Math.max(3, Math.sin(adegan.tinggi) * adegan.jarak),
      Math.sin(adegan.sudut) * adegan.jarak * Math.cos(adegan.tinggi)
    );
    c.lookAt(adegan.target);
    adegan.renderer.render(adegan.scene, c);
    requestAnimationFrame(bingkai);
  }

  function jalankan() {
    if (!adegan || adegan.jalan || !terlihat) return;
    adegan.jalan = true;
    adegan.terakhir = 0;
    requestAnimationFrame(bingkai);
  }
  function berhenti() {
    if (adegan) adegan.jalan = false;
  }

  /* ── kabel ───────────────────────────────────────────────────────────────── */

  window.addEventListener("glyiv:petak-terpilih", function (e) {
    var d = e.detail || {};
    if (!d.petak) {
      terpilih = null;
      if (adegan) { bersihkan(adegan.grup); berhenti(); }
      if (judulEl) judulEl.textContent = "Belum ada petak dipilih";
      if (metaEl) metaEl.innerHTML = "";
      status("Pilih sebuah petak di peta di atas — hutan 3D-nya digambar di sini.", "");
      return;
    }
    terpilih = d;
    if (judulEl) judulEl.textContent = d.petak.name;
    if (Tiga && adegan) isiHutan();
    else if (terlihat) muatTiga();
    else status("Hutan 3D " + d.petak.name + " digambar begitu bagian ini masuk layar.", "");
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entri) {
      terlihat = entri[0].isIntersecting;
      if (terlihat) { muatTiga(); jalankan(); }
      else berhenti();
    }, { rootMargin: "160px" }).observe(wrap);
  } else {
    terlihat = true;
    muatTiga();
  }
})();
