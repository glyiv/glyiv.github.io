/* ════════════════════════════════════════════════════════════════════════════
   Glyiv i18n — Bahasa Indonesia (asal) ⇄ English ⇄ العربية.
   ════════════════════════════════════════════════════════════════════════════

   MEKANISME. Kamus ID→EN / ID→AR diterapkan dengan menelusuri SIMPUL TEKS dan
   beberapa atribut, ditambah MutationObserver supaya UI yang dirender belakangan
   (React, demo, chatbot) ikut diterjemahkan. Kunci kamus = teks Indonesia apa
   adanya, jadi halaman hasil port tidak perlu ditandai apa pun.

   KENAPA MENELUSURI DOM, BUKAN KUNCI. Situs ini adalah port mekanis dari
   glyiv.github.io: markup-nya ribuan baris tanpa kunci i18n. Menambahkan kunci
   satu per satu berarti menyentuh setiap halaman — dan setiap sentuhan adalah
   kesempatan merusak desain yang sudah disetujui. Menelusuri DOM menjangkau
   halaman statis DAN halaman React dengan satu mekanisme.

   YANG BERUBAH DI RONDE INI:
    · dua bahasa → TIGA. `resolveLang` mengenal "ar", dan kamus dimuat sesuai
      bahasa terpilih (i18n-en.js / i18n-ar.js).
    · ganti bahasa TIDAK lagi memuat ulang halaman. Nilai asli tiap simpul yang
      disentuh disimpan, jadi ID⇄EN⇄AR bisa bolak-balik. Ini syarat supaya
      pemilih bahasa React (AppShell) dan pil navbar situs bisa memakai mesin
      yang SAMA — sebelumnya masing-masing punya keadaan sendiri dan bisa
      berbeda pendapat.
    · RTL bukan sekadar dir="rtl": lembar gaya `glyiv-rtl.css` disuntikkan, dan
      daun yang isinya angka/satuan ditandai supaya tetap dibaca kiri-ke-kanan
      di dalam kalimat Arab.
    · mutasi DIANTRE per-frame, tidak diproses satu per satu. Halaman peta &
      konsol memicu ratusan mutasi saat memuat; memanggil penelusur untuk tiap
      mutasi membuat gulir tersendat di tablet.

   MILIK SIAPA APA. Elemen ber-`data-i18n` dan label navbar bersama dikelola
   `site-lang.js` (ia mengganti innerHTML, termasuk markup di dalamnya). Mesin
   ini MELEWATI elemen itu — kalau tidak, keduanya saling menimpa dan tombol
   kembali ke Bahasa akan memulihkan teks yang salah.

   Dipakai lewat: window.GlyivI18n.setLang("ar") · event "glyiv:lang".
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.GlyivI18n) return; // satu mesin per halaman

  var STORE = "glyiv-lang";
  var BAHASA = { id: 1, en: 1, ar: 1 };
  var RTL = { ar: 1 };
  var GLOBAL = { en: "GLYIV_EN", ar: "GLYIV_AR" };

  /* Alamat berkas kamus diturunkan dari alamat berkas INI, bukan ditulis tetap:
     halaman statis memuatnya relatif ("assets/js/i18n.js"), aplikasi React
     mutlak ("/assets/js/i18n.js?v=…"). Penanda ?v= ikut dibawa supaya kamus
     tidak terjebak cache lama saat berkasnya berubah. */
  var SELF = document.currentScript;
  var DIR_JS = "assets/js/";
  var VERSI = "";
  if (SELF && SELF.src) {
    var m = SELF.src.match(/^(.*\/)i18n\.js(\?[^#]*)?$/);
    if (m) { DIR_JS = m[1]; VERSI = m[2] || ""; }
  }
  var urlKamus = function (lang) { return DIR_JS + "i18n-" + lang + ".js" + VERSI; };
  var urlGayaRtl = function () { return DIR_JS.replace(/js\/$/, "css/") + "glyiv-rtl.css" + VERSI; };

  /* ── bahasa terpilih ───────────────────────────────────────────────────────
     Urutan: pilihan tersimpan → ?lang= → lokal peramban → en.
     Zona waktu SENGAJA tidak dipakai: ia menandakan di mana seseorang berada,
     bukan bahasa apa yang ia baca (butir 15, ronde 44). */
  function resolveLang() {
    try { var s = localStorage.getItem(STORE); if (BAHASA[s]) return s; } catch (e) {}
    try { var q = new URLSearchParams(location.search).get("lang"); if (BAHASA[q]) return q; } catch (e) {}
    var langs = ((navigator.languages && navigator.languages.join(",")) || navigator.language || "").toLowerCase();
    var tz = "";
    try { tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase(); } catch (e) {}
    if (/(^|,)(id|in)\b/.test(langs)) return "id";
    if (/(^|,)ar\b/.test(langs)) return "ar";
    if (langs) return "en";
    return "en"; // cadangan terakhir: Inggris — target internasional (butir 15, ronde 44)
  }

  var LANG = resolveLang();
  window.GLYIV_LANG = LANG;

  var DICT = {};
  var LEWATI = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1, TEXTAREA: 1 };
  /* Elemen yang dikelola pihak lain (site-lang.js) atau sengaja tidak
     diterjemahkan (pil bahasa, nama merek). */
  var MILIK_LAIN = "[data-i18n-skip],[data-i18n]";

  /* Kunci kamus dipanen dari DOM dengan spasi dirapikan (`\s+` → satu spasi).
     Teks di halaman TIDAK serapi itu: markup asli memakai `&nbsp;` (U+00A0) dan
     baris HTML yang diindentasi, sehingga pencarian harfiah meleset walau
     kalimatnya sudah ada di kamus. Ini bukan teori — kalimat "…faktor
     EXIOBASE&nbsp;3…" di beranda adalah satu-satunya kalimat yang tersisa dalam
     Bahasa Indonesia setelah kamus dipasang, hanya karena satu spasi tak-putus. */
  function norm(s) {
    return s
      .replace(/[\u00A0\u202F\u2007\u2009\u200A\uFEFF]/g, " ")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }
  var DICT_NORM = null;
  function indeksNorm() {
    if (DICT_NORM) return DICT_NORM;
    DICT_NORM = Object.create(null);
    for (var k in DICT) {
      if (!Object.prototype.hasOwnProperty.call(DICT, k)) continue;
      var n = norm(k);
      if (n !== k && DICT_NORM[n] === undefined) DICT_NORM[n] = DICT[k];
    }
    return DICT_NORM;
  }
  function tr(key) {
    var v = DICT[key];
    if (v == null) {
      var n = norm(key);
      v = DICT[n];
      if (v == null) v = indeksNorm()[n];
    }
    return (typeof v === "string" && v.length) ? v : null;
  }

  /* ── memori "aslinya begini" ───────────────────────────────────────────────
     Tanpa ini, ganti bahasa harus memuat ulang halaman. Yang disimpan hanya
     simpul yang BENAR-BENAR diubah, beserta nilai yang kami tulis — supaya saat
     memulihkan kami tidak menimpa teks yang sudah diperbarui React. */
  var asli = [];
  function ingat(rec) {
    asli.push(rec);
    if (asli.length > 6000) {
      asli = asli.filter(function (r) {
        var n = r.n || r.e;
        return n && n.isConnected;
      });
    }
  }
  function pulihkan() {
    diam(function () {
      for (var i = asli.length - 1; i >= 0; i--) {
        var r = asli[i];
        if (r.n) {
          if (r.n.isConnected && r.n.nodeValue === r.w) r.n.nodeValue = r.v;
        } else if (r.e && r.e.isConnected && r.e.getAttribute(r.a) === r.w) {
          if (r.v == null) r.e.removeAttribute(r.a); else r.e.setAttribute(r.a, r.v);
        }
      }
      asli = [];
    });
  }

  /* ── angka & satuan tetap kiri-ke-kanan di dalam kalimat Arab ──────────────
     "18,2 tCO₂e" dan "Rp71 M" dirender terbalik kalau ikut arah paragraf RTL.
     Daun yang isinya HANYA angka/latin ditandai; `glyiv-rtl.css` memberinya
     `unicode-bidi:plaintext`, yang menurut algoritma bidi Unicode jatuh ke LTR
     ketika tidak ada satu pun huruf berarah kuat. Elemennya TIDAK dibungkus
     ulang — membungkus simpul teks milik React memicu removeChild yang gagal. */
  var ARAB = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  var ANGKA = /[0-9]/;
  function tandaiAngka(node) {
    var t = node.nodeValue;
    if (!ANGKA.test(t) || ARAB.test(t)) return;
    var p = node.parentElement;
    if (!p || p.childNodes.length !== 1 || p.hasAttribute("data-i18n-ltr")) return;
    p.setAttribute("data-i18n-ltr", "");
  }

  /* ── SATUAN DI TENGAH KALIMAT ARAB — cacat yang `tandaiAngka` TIDAK bisa lihat.
     Fungsi di atas hanya menolong DAUN yang isinya murni angka/latin; ia keluar
     lebih awal begitu simpulnya juga memuat huruf Arab. Tetapi justru simpul
     campur itulah yang salah gambar, dan ini terukur di layar, bukan diduga:
     `/ukur/antrean` AR menampilkan **«MB 7.6 من MB 10247.6»** untuk kalimat
     "…المساحة المستخدمة 7.6 MB من 10247.6 MB." — angka dan satuannya bertukar
     tempat. Sebabnya algoritma bidi Unicode: angka Eropa (kelas EN) diperlakukan
     sebagai R saat menyelesaikan karakter netral, jadi spasi antara "7.6" dan
     "MB" jatuh ke arah paragraf (RTL) dan memisahkan keduanya menjadi dua
     potongan yang lalu diurutkan kanan-ke-kiri.
     Perbaikannya adalah alat yang memang dibuat Unicode untuk kasus ini:
     ISOLASI (U+2066 LRI … U+2069 PDI) di sekeliling "angka + satuan". Ia
     karakter teks, jadi tidak menyentuh struktur DOM sama sekali — penting,
     karena membungkus simpul teks milik React memicu removeChild yang gagal
     (catatan di atas). Perubahannya dicatat lewat `ingat()` supaya kembali ke
     ID/EN memulihkan teks aslinya persis.
     Contoh yang ikut benar: "82 m²", "0,0082 ha", "18,2 tCO₂e", "5 MB". */
  var RE_SATUAN = /\d[\d.,٫٬]*(?:\s*[A-Za-z][A-Za-z0-9²³₂/·%^-]*)+/g;
  function isolasiSatuan(node) {
    var t = node.nodeValue;
    if (!t || !ANGKA.test(t) || !ARAB.test(t)) return;
    if (t.indexOf("⁦") >= 0) return; /* sudah diisolasi */
    var baru = t.replace(RE_SATUAN, function (m) { return "⁦" + m + "⁩"; });
    if (baru === t) return;
    ingat({ n: node, v: t, w: baru });
    node.nodeValue = baru;
  }

  /* ── penelusur simpul teks ─────────────────────────────────────────────────── */
  function terjemahkanTeks(root) {
    if (!root) return;
    var doc = root.ownerDocument || document;
    if (root.nodeType === 3) { satuSimpul(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && root.closest && root.closest(MILIK_LAIN)) return;

    var walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        if (!p || LEWATI[p.nodeName] || (p.closest && p.closest(MILIK_LAIN))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var batch = [], n;
    while ((n = walker.nextNode())) batch.push(n);
    for (var i = 0; i < batch.length; i++) satuSimpul(batch[i]);
  }

  function satuSimpul(node) {
    var raw = node.nodeValue;
    if (!raw || !raw.trim()) return;
    var p = node.parentNode;
    if (!p || LEWATI[p.nodeName] || (p.closest && p.closest(MILIK_LAIN))) return;
    var key = raw.trim();
    var val = tr(key);
    if (val != null) {
      /* Spasi di kiri/kanan simpul dipertahankan — ia yang memisahkan kata dari
         elemen sebaris tetangganya. Disusun ulang, BUKAN lewat String.replace:
         terjemahan yang kebetulan memuat "$&" akan ditafsirkan replace() sebagai
         pola pengganti dan menghasilkan teks rusak. */
      var baru = raw.slice(0, raw.length - raw.replace(/^\s+/, "").length) + val + raw.slice(raw.replace(/\s+$/, "").length);
      if (baru !== raw) { ingat({ n: node, v: raw, w: baru }); node.nodeValue = baru; }
    }
    if (RTL[LANG]) { tandaiAngka(node); isolasiSatuan(node); }
  }

  var ATTRS = ["placeholder", "aria-label", "title", "alt"];
  var SEL_ATTR = "[placeholder],[aria-label],[title],[alt]";
  function terjemahkanAtribut(scope) {
    if (!scope || scope.nodeType !== 1 && scope.nodeType !== 9 && scope.nodeType !== 11) return;
    var els = [];
    if (scope.nodeType === 1 && scope.matches && scope.matches(SEL_ATTR)) els.push(scope);
    if (scope.querySelectorAll) els = els.concat([].slice.call(scope.querySelectorAll(SEL_ATTR)));
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest && el.closest("[data-i18n-skip]")) continue;
      for (var j = 0; j < ATTRS.length; j++) {
        var a = ATTRS[j], v = el.getAttribute(a);
        if (v == null) continue;
        var val = tr(v.trim());
        if (val != null && val !== v) { ingat({ e: el, a: a, v: v, w: val }); el.setAttribute(a, val); }
      }
    }
  }

  /* Label navbar bersama & hero dikelola site-lang.js. Ditandai di sini supaya
     penelusur tidak menyentuhnya — navbar situs baru ada setelah React memasang
     halamannya, jadi penandaan diulang tiap batch (satu querySelectorAll pada
     elemen kecil, bukan pada seluruh dokumen). */
  function tandaiMilikNav(scope) {
    var akar = (scope && scope.querySelector) ? scope : document;
    var nav = akar.querySelector && akar.querySelector(".lnav");
    if (!nav && akar.matches && akar.matches(".lnav")) nav = akar;
    if (!nav || nav.__i18nTag) return;
    nav.__i18nTag = 1;
    var els = nav.querySelectorAll(".lnav__links .ldrop__btn, .lnav__links > a, .lnav__cta, .lnav__lang");
    for (var i = 0; i < els.length; i++) els[i].setAttribute("data-i18n-skip", "nav");
  }

  function terjemahkan(scope) {
    var s = scope || document.body;
    if (!s) return;
    tandaiMilikNav(s === document.body ? document : s);
    terjemahkanTeks(s);
    terjemahkanAtribut(s);
  }

  /* Judul tab ikut bahasa. Disimpan terpisah dari `asli` karena document.title
     bukan simpul yang bisa dipulihkan lewat jalur yang sama. */
  var judulAsli = null;
  function terjemahkanSemua() {
    if (document.title) {
      if (judulAsli == null) judulAsli = document.title;
      var t = tr(judulAsli.trim());
      if (t) document.title = t;
    }
    terjemahkan(document.body);
  }

  /* ── arah & lembar gaya RTL ────────────────────────────────────────────────── */
  var gayaRtlDimuat = false;
  function muatGayaRtl() {
    if (gayaRtlDimuat || document.getElementById("glyiv-rtl-css")) { gayaRtlDimuat = true; return; }
    gayaRtlDimuat = true;
    var l = document.createElement("link");
    l.id = "glyiv-rtl-css";
    l.rel = "stylesheet";
    l.href = urlGayaRtl();
    (document.head || document.documentElement).appendChild(l);
  }
  function arah() {
    var el = document.documentElement;
    el.setAttribute("lang", LANG);
    el.setAttribute("dir", RTL[LANG] ? "rtl" : "ltr");
    if (RTL[LANG]) muatGayaRtl();
  }

  /* ── pemuatan kamus ───────────────────────────────────────────────────────── */
  var sedangMuat = {};
  function muatKamus(lang, cb) {
    if (lang === "id") return cb({});
    var g = GLOBAL[lang];
    if (window[g]) return cb(window[g]);
    var antre = sedangMuat[lang];
    if (antre) { antre.push(cb); return; }
    sedangMuat[lang] = [cb];
    var s = document.createElement("script");
    s.src = urlKamus(lang);
    s.async = true;
    var selesai = function (d) {
      var list = sedangMuat[lang] || [];
      sedangMuat[lang] = null;
      for (var i = 0; i < list.length; i++) list[i](d);
    };
    s.onload = function () { selesai(window[g] || {}); };
    /* Gagal memuat kamus BUKAN alasan menampilkan halaman kosong: halaman tetap
       terbaca dalam Bahasa Indonesia. */
    s.onerror = function () { console.warn("[glyiv] kamus " + lang + " gagal dimuat"); selesai(null); };
    (document.head || document.documentElement).appendChild(s);
  }

  /* ── MutationObserver, diantre per-frame ──────────────────────────────────── */
  var mo = null, jalan = false, antreSimpul = [], terjadwal = false;
  function diam(fn) {
    jalan = true;
    try { fn(); } finally { if (mo) mo.takeRecords(); jalan = false; }
  }
  /* Mutasi dikerjakan per-bingkai, BUKAN satu per satu: halaman peta & konsol
     memicu ratusan mutasi saat memuat, dan memanggil penelusur untuk tiap mutasi
     membuat gulir tersendat di tablet.

     rAF DAN setTimeout dipasang bersamaan, yang duluan menang.
     ─────────────────────────────────────────────────────────────────────────
     requestAnimationFrame TIDAK dijalankan peramban ketika dokumennya tidak
     terlihat (tab latar, jendela terminimalkan) dan dijeda saat bingkai berat.
     Kalau ia satu-satunya penjadwal, terjemahan untuk elemen yang baru dirender
     bisa TERTUNDA TANPA BATAS — dan itu terlihat: pada satu jalan audit,
     /lab/apps/peta (peta Leaflet + lapisan NDVI, kerja per-bingkai yang berat)
     menyisakan 5 kalimat Bahasa Indonesia sementara jalan lain 0. Cacat yang
     muncul hanya kadang-kadang adalah cacat yang paling mudah dianggap selesai. */
  function jadwalkan() {
    if (terjadwal) return;
    terjadwal = true;
    var idRaf = 0, idJam = 0;
    var kerja = function () {
      if (!terjadwal) return; // penjadwal kembarannya sudah mengerjakannya
      terjadwal = false;
      if (idRaf && window.cancelAnimationFrame) cancelAnimationFrame(idRaf);
      clearTimeout(idJam);
      var n = antreSimpul; antreSimpul = [];
      diam(function () {
        for (var i = 0; i < n.length; i++) {
          var nd = n[i];
          if (!nd || !nd.isConnected) continue;
          if (nd.nodeType === 3) satuSimpul(nd);
          else terjemahkan(nd);
        }
      });
    };
    if (window.requestAnimationFrame) idRaf = requestAnimationFrame(kerja);
    idJam = setTimeout(kerja, 50);
  }
  function mulaiObserver() {
    if (mo) return;
    try {
      mo = new MutationObserver(function (muts) {
        if (jalan) return;
        for (var i = 0; i < muts.length; i++) {
          var mu = muts[i];
          if (mu.type === "characterData") { antreSimpul.push(mu.target); continue; }
          for (var j = 0; j < mu.addedNodes.length; j++) antreSimpul.push(mu.addedNodes[j]);
        }
        if (antreSimpul.length) jadwalkan();
      });
      mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) { /* peramban tanpa MutationObserver: halaman tetap jalan */ }
  }

  /* ── pil bahasa cadangan ──────────────────────────────────────────────────────
     HANYA untuk halaman yang tidak punya navbar situs (.lnav → site-lang.js) dan
     bukan aplikasi React (#root → LanguageSwitcher). Tanpa penjagaan ini sebuah
     halaman bisa menampilkan DUA pemilih bahasa. */
  function pilCadangan() {
    if (document.getElementById("glyivLangPill")) return;
    if (document.querySelector(".lnav") || document.getElementById("root")) return;
    var pill = document.createElement("div");
    pill.id = "glyivLangPill";
    pill.setAttribute("role", "group");
    pill.setAttribute("aria-label", "Language");
    pill.setAttribute("data-i18n-skip", "");
    ["id", "en", "ar"].forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("data-lang", c);
      b.setAttribute("lang", c);
      b.className = c === LANG ? "on" : "";
      b.setAttribute("aria-pressed", c === LANG ? "true" : "false");
      b.textContent = c.toUpperCase();
      b.addEventListener("click", function () { setLang(c); });
      pill.appendChild(b);
    });
    var css = document.createElement("style");
    css.textContent =
      "#glyivLangPill{display:inline-flex;align-items:center;gap:2px;flex:0 0 auto;padding:3px;border-radius:999px;" +
      "border:1px solid rgba(138,255,193,.22);background:rgba(7,33,23,.7);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);" +
      "box-shadow:0 8px 26px -12px rgba(0,0,0,.6)}" +
      "#glyivLangPill button{min-height:32px;min-width:38px;padding:0 9px;border:0;border-radius:999px;background:none;cursor:pointer;" +
      "font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;line-height:1;letter-spacing:.06em;color:#6f9580;" +
      "transition:.2s;-webkit-tap-highlight-color:transparent}" +
      "#glyivLangPill button.on{color:#0b241a;background:#8affc1;font-weight:700}" +
      "#glyivLangPill.glp-fixed{position:fixed;top:14px;right:16px;z-index:130}" +
      "#glyivLangPill.glp-app{position:absolute;top:12px;right:10px;z-index:40}" +
      ".app > .view .appbar,.app > .view .topnav{padding-right:96px}" +
      "[dir=rtl] #glyivLangPill.glp-fixed{right:auto;left:16px}" +
      "[dir=rtl] #glyivLangPill.glp-app{right:auto;left:10px}";
    document.head.appendChild(css);
    var burger = document.querySelector(".gv-burger");
    var tbRight = document.querySelector(".tb-right");
    var app = document.querySelector(".app");
    if (burger && burger.parentNode) burger.parentNode.insertBefore(pill, burger);
    else if (tbRight) tbRight.insertBefore(pill, tbRight.firstChild);
    else if (app) { pill.classList.add("glp-app"); app.appendChild(pill); }
    else { pill.classList.add("glp-fixed"); document.body.appendChild(pill); }
  }
  function segarkanPil() {
    var p = document.getElementById("glyivLangPill");
    if (!p) return;
    [].forEach.call(p.querySelectorAll("button"), function (b) {
      var on = b.getAttribute("data-lang") === LANG;
      b.className = on ? "on" : "";
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* ── API publik ───────────────────────────────────────────────────────────── */
  function umumkan() {
    try { document.dispatchEvent(new CustomEvent("glyiv:lang", { detail: LANG })); } catch (e) {}
  }
  /* Bahasa yang TERAKHIR diminta, belum tentu yang sedang aktif.
     ─────────────────────────────────────────────────────────────────────────
     Kamus dimuat asinkron (i18n-ar.js ± 0,5 MB sebelum kompresi), jadi antara
     klik dan penerapan ada jeda. Tanpa penanda ini, menekan AR lalu ID dengan
     cepat berakhir di ARAB: permintaan ID melihat LANG masih "id" dan langsung
     pulang, lalu callback AR yang tertunda tetap berjalan dan menerapkan Arab.
     Diukur di peramban — bukan kekhawatiran teoretis. */
  var diminta = LANG;
  function setLang(next) {
    if (!BAHASA[next]) return;
    try { localStorage.setItem(STORE, next); } catch (e) {}
    diminta = next;
    if (next === LANG) { umumkan(); return; }
    muatKamus(next, function (d) {
      if (diminta !== next) return; // sudah disusul permintaan bahasa lain
      if (d == null) return; // kamus gagal dimuat → biarkan halaman apa adanya
      pulihkan();
      if (judulAsli != null) document.title = judulAsli;
      LANG = next;
      window.GLYIV_LANG = next;
      GlyivI18n.lang = next;
      DICT = d;
      DICT_NORM = null;
      arah();
      terjemahkanSemua();
      segarkanPil();
      umumkan();
    });
  }

  var GlyivI18n = {
    lang: LANG,
    langs: ["id", "en", "ar"],
    setLang: setLang,
    /** Terjemahkan satu cabang DOM (dipakai skrip yang menyuntik markup sendiri). */
    apply: function (scope) { diam(function () { terjemahkan(scope); }); },
    /** Terjemahan satu kalimat, untuk string yang dibuat JS. */
    t: function (idText, fallback) {
      var v = tr(String(idText).trim());
      return v != null ? v : (fallback != null ? fallback : idText);
    },
    dir: function () { return RTL[LANG] ? "rtl" : "ltr"; },
  };
  window.GlyivI18n = GlyivI18n;

  /* Kompatibilitas: skrip lama memanggil glyivT(id, en). */
  window.glyivT = function (idText, enText) { return LANG === "id" ? idText : (tr(String(idText).trim()) || enText || idText); };

  /* ── boot ─────────────────────────────────────────────────────────────────── */
  arah(); // lang/dir/RTL dipasang SEBELUM cat pertama — tak ada kedipan arah

  if (LANG !== "id") {
    // sembunyikan badan halaman sebentar supaya tidak berkedip Bahasa → EN/AR
    document.documentElement.classList.add("i18n-hide");
    var st = document.createElement("style");
    st.textContent = ".i18n-hide body{visibility:hidden!important}";
    (document.head || document.documentElement).appendChild(st);
    setTimeout(function () { document.documentElement.classList.remove("i18n-hide"); }, 1500);
  }

  function siapBadan(fn) {
    if (document.body) fn();
    else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else setTimeout(fn, 0);
  }

  function nyalakan() {
    siapBadan(function () {
      diam(function () { terjemahkanSemua(); });
      mulaiObserver();
      pilCadangan();
      document.documentElement.classList.remove("i18n-hide");
      umumkan();
    });
  }

  if (LANG === "id") nyalakan();
  else muatKamus(LANG, function (d) {
    /* Kamus gagal dimuat (offline, 404, pemblokir skrip). Halaman tetap terbaca
       dalam Bahasa Indonesia — tapi JANGAN tinggalkan `dir="rtl"` menempel:
       teks Indonesia dalam tata letak kanan-ke-kiri lebih membingungkan daripada
       teks Indonesia dalam tata letak biasa, dan itu bukan kegagalan yang
       ditanggung pengunjung karena kesalahan kami memuat berkas. */
    if (d == null) {
      LANG = "id";
      window.GLYIV_LANG = "id";
      GlyivI18n.lang = "id";
      arah();
    }
    DICT = d || {};
    nyalakan();
  });
})();
