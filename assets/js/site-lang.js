/* GLYIV — pemilih bahasa untuk NAVBAR SITUS (id · en · ar).
   Dimuat oleh glyiv-nav.js pada setiap halaman situs.

   PEMBAGIAN TUGAS (penting, pernah salah):
    · `i18n.js` (mesin) memiliki KAMUS, arah teks, dan penelusuran simpul teks.
      Berkas ini MEMUATNYA — itulah cara ~2.000 kalimat kamus sampai ke halaman
      statis. Sebelum ronde ini mesin hanya dimuat 4 halaman warisan, jadi 51
      halaman lain hanya menerjemahkan label navbar + hero: itu sebab audit
      bahasa menunjukkan 54% kalimat masih Bahasa saat EN/AR dipilih.
    · berkas INI memiliki pil bahasa di navbar + dua hal yang tidak bisa
      dikerjakan penelusur simpul teks:
        1. label navbar (teks pendek, ambigu di kamus — "Kabar" bisa berarti
           banyak hal),
        2. hero beranda, yang terjemahannya membawa MARKUP (<span>, <b>) jadi
           harus mengganti innerHTML, bukan simpul teks.
      Mesin melewati elemen ini (ditandai `data-i18n-skip` / `data-i18n`), jadi
      keduanya tidak saling menimpa.

   Semua dibungkus try/catch: kalau ada yang meleset, halaman tetap tampil dalam
   Bahasa, tak pernah rusak. */
(function () {
  "use strict";

  /* Penjaga SATU INSTANS, dipasang paling awal. Berkas ini kini dimuat dari dua
     tempat — <head> index.html (aplikasi React) dan glyiv-nav.js (halaman statis
     dist/) — dan yang kedua tidak boleh menginisialisasi ulang apa pun. Penjaganya
     harus di SINI, bukan di dalam `mulai()`: penanda "sudah mulai" baru dipasang
     SESUDAH navbar ditemukan, jadi ia tidak menutup jendela ketika instans pertama
     masih menunggu navbar muncul. */
  if (window.__glyivLangDimuat) return;
  window.__glyivLangDimuat = true;

  /* ── 1 · pastikan mesin kamus ada ────────────────────────────────────────────
     Dijalankan SEBELUM penjagaan .lnav di bawah: halaman aplikasi React tidak
     punya navbar situs, tapi tetap butuh kamus. */
  try {
    if (!window.GlyivI18n && !document.getElementById("glyiv-i18n-js")) {
      var mesin = document.createElement("script");
      mesin.id = "glyiv-i18n-js";
      // Alamat diturunkan dari alamat berkas ini supaya benar baik di halaman
      // statis (relatif) maupun di aplikasi React (mutlak, ber-?v=).
      var src = (document.currentScript && document.currentScript.src) || "";
      var m = src.match(/^(.*\/)site-lang\.js(\?[^#]*)?$/);
      mesin.src = m ? m[1] + "i18n.js" + (m[2] || "") : "/assets/js/i18n.js";
      mesin.async = false;
      (document.head || document.documentElement).appendChild(mesin);
    }
  } catch (e) { /* jangan pernah merusak halaman karena i18n */ }

  /* ── 2 · navbar situs yang SEDANG hidup, bukan yang ditemukan sekali ────────
     Versi lama langsung `return` kalau `.lnav` belum ada — benar untuk halaman
     statis, SALAH untuk aplikasi React: di sana navbar baru ada setelah React
     merender, dan berkas ini dulu dimuat lewat rantai `useSiteScripts →
     glyiv-nav.js → site-lang.js`, yaitu dua perjalanan jaringan SESUDAH mount.
     Akibatnya terukur: pada mesin yang sedang sibuk, hero beranda masih Bahasa
     Indonesia 2,6 detik sesudah halaman EN dimuat — audit menangkapnya satu kali
     dari tiga jalan, dan pengunjung melihatnya sebagai kedipan.
     Sekarang berkas ini boleh dimuat dari <head> dan menunggu navbarnya.

     ⛔ CACAT YANG MELAHIRKAN `navSitus()` (8 Agustus 2026)
     Berkas ini dulu memegang `var nav = document.querySelector(".lnav")` sebagai
     closure di dalam `mulai()`, dan `mulai()` hanya boleh jalan SEKALI. Di dalam
     SPA React, berpindah halaman MELEPAS `<header class="lnav">` lama dan
     memasang simpul BARU — jadi `nav` menunjuk simpul yatim, dan pil bahasanya
     tidak pernah kembali. Terukur di /index.html 412×915 `(pointer:coarse)`
     dengan meniru persis apa yang React lakukan (header lama dilepas, markup
     header dari server dipasang, lalu pushState + `glyiv:page`):
       `.lnav__lang` SEBELUM pergantian : ada, 45,5×44 px pada (279,9 · 12),
                                          3 tombol bahasa + 1 pemicu ringkas
       `.lnav__lang` SESUDAH pergantian : TIDAK ADA — dan tidak pernah kembali
     Permanen, karena `build()` — satu-satunya pembuat pil — hanya dipanggil dari
     dalam `mulai()`. `bangunPemilihBahasa()` di glyiv-nav.js tidak bisa menolong:
     pada pengukuran yang sama ia jelas ikut berjalan pada navbar baru (salinan
     CTA laci 1, tautan aktif 1), tetapi ia MEMINDAHKAN dan menyusun ulang
     `.lnav__lang` yang sudah ada, bukan membuatnya.

     Karena itu navbarnya dicari ULANG setiap kali dipakai, tidak pernah disimpan.
     `document.contains()` dipakai sebagai penyaring cache — ia tidak memaksa tata
     letak dihitung ulang, jadi aman dipanggil sesering apa pun.
     `.lnav--app` (navbar AppShell React) dilewati: ia punya pemilih bahasa React
     sendiri, dan menyuntik pil kedua di sana berarti dua pemilih di satu bilah. */
  var navCache = null;
  function navSitus() {
    if (navCache && document.contains(navCache)) return navCache;
    var semua = document.querySelectorAll(".lnav");
    for (var i = 0; i < semua.length; i++) {
      if (!semua[i].classList.contains("lnav--app")) { navCache = semua[i]; return navCache; }
    }
    navCache = null;
    return null;
  }

  function siapNav(lanjut, menyerah) {
    if (navSitus()) { lanjut(); return; }
    var mo, henti;
    var coba = function () {
      if (!navSitus()) return false;
      if (mo) mo.disconnect();
      clearTimeout(henti);
      lanjut();
      return true;
    };
    var pasang = function () {
      if (coba()) return;
      try {
        mo = new MutationObserver(coba);
        mo.observe(document.body, { childList: true, subtree: true });
        /* Batas waktu: halaman tanpa navbar situs (mis. /app) tidak boleh
           meninggalkan observer hidup selamanya. Menyerah di sini BUKAN menyerah
           selamanya — `pastikanMulai()` memasang pengamat baru begitu alamatnya
           berubah, jadi pengunjung yang mendarat di /auth lalu pindah ke halaman
           situs tetap mendapat pil bahasanya. */
        henti = setTimeout(function () {
          if (mo) mo.disconnect();
          if (menyerah) menyerah();
        }, 20000);
      } catch (e) { /* tanpa MutationObserver: halaman tetap tampil */ }
    };
    if (document.body) pasang();
    else document.addEventListener("DOMContentLoaded", pasang);
  }

  var sudahMulai = false;   // `mulai()` sudah dijalankan pada dokumen ini
  var menungguNav = false;  // ada pengamat siapNav yang masih menunggu navbar
  var susul = null;         // diisi mulai(): penyusul navbar + hero sesudah pindah halaman

  function pastikanMulai() {
    if (sudahMulai || menungguNav) return;
    menungguNav = true;
    siapNav(
      function () {
        menungguNav = false;
        if (sudahMulai) return;
        sudahMulai = true;
        try { mulai(); } catch (e) { /* jangan pernah merusak halaman karena i18n */ }
      },
      function () { menungguNav = false; },
    );
  }

  /* ── 3 · ikut berpindah halaman ─────────────────────────────────────────────
     ⛔ CACAT YANG MELAHIRKAN BLOK INI (5 Agustus 2026)
     Hero beranda memakai `data-i18n` dan SENGAJA dilewati mesin kamus
     (`MILIK_LAIN` di i18n.js) karena berkas inilah pemiliknya. Tetapi berkas ini
     dulu hanya berjalan SEKALI: `captureOriginals()` menyimpan teks aslinya pada
     ELEMENNYA (`el.__oHtml`), lalu `apply()` menulis terjemahannya. Di dalam SPA
     React, menekan tombol kembali memasang ULANG beranda dengan elemen `<h1>`
     yang BARU — tanpa `__oHtml`, dan tanpa ada yang memanggil `apply()` lagi.
     Hasilnya terukur: `<html lang="en">` tetapi judulnya berbunyi "Hidup hijau,
     imbalan nyata." Mesin kamus tidak bisa menolong, karena ia justru
     diperintahkan menjauh dari elemen ini.

     Blok ini berada di RUANG MODUL, bukan lagi di dalam `mulai()`: kalau halaman
     yang pertama dimuat tidak punya navbar situs (mis. /auth), `mulai()` belum
     pernah jalan — dan penambal `history` yang dulu berada di dalamnya ikut tidak
     pernah terpasang. Pola penambalannya sama persis dengan `glyiv-nav.js`; tidak
     bergantung router mana pun. */
  var jalurTerakhir = location.pathname;
  function mungkinPindah() {
    if (location.pathname === jalurTerakhir) return;
    jalurTerakhir = location.pathname;
    pastikanMulai();
    if (susul) susul();
  }
  ["pushState", "replaceState"].forEach(function (nama) {
    var asli = history[nama];
    if (typeof asli !== "function") return;
    history[nama] = function () {
      var hasil = asli.apply(this, arguments);
      setTimeout(mungkinPindah, 0);
      return hasil;
    };
  });
  window.addEventListener("popstate", function () { setTimeout(mungkinPindah, 0); });
  window.addEventListener("glyiv:page", function () { setTimeout(mungkinPindah, 0); });

  pastikanMulai();

  function mulai() {
    var LANGS = [
      { code: "id", short: "ID", dir: "ltr", native: "Bahasa Indonesia" },
      { code: "en", short: "EN", dir: "ltr", native: "English" },
      { code: "ar", short: "AR", dir: "rtl", native: "العربية" },
    ];

    /* Label navbar bersama — dipetakan dari teks Bahasa aslinya. Nama produk
       (Green Intelligence, Glyiv Aset, dst.) sengaja TIDAK diterjemahkan. */
    var NAV = {
      "Ekosistem": { en: "Ecosystem", ar: "النظام البيئي" },
      /* ⚠︎ "Solusi" HANYA ada di navbar cangkang lab/apps (`apps-shell.js`),
         tidak di `index.html`. Karena `captureOriginals()` menandai SETIAP
         `.ldrop__btn` dengan `data-i18n-skip="nav"`, mesin kamus i18n.js
         melewatinya — jadi label yang tidak terdaftar di sini TIDAK PERNAH
         diterjemahkan meski kuncinya ada di `i18n-en.js`/`i18n-ar.js`.
         Itulah sebabnya beranda bersih 0% sementara SETIAP halaman lab
         menyisakan tepat satu kata Indonesia di EN dan AR. */
      "Solusi": { en: "Solutions", ar: "الحلول" },
      "Kabar": { en: "News", ar: "الأخبار" },
      "Perusahaan": { en: "Company", ar: "الشركة" },
      "Gabung": { en: "Join", ar: "انضم" },
    };

    /* Hero homepage (elemen ber-data-i18n). Nilai id diambil dari HTML asli saat
       muat pertama; en/ar dari sini. innerHTML boleh berisi markup (mis. span). */
    var I18N = {
      "hero.h1": {
        en: 'Live green, <span class="lserif-accent">real rewards.</span>',
        ar: 'عِش أخضر، <span class="lserif-accent">مكافآت حقيقية.</span>',
      },
      "hero.lead": {
        en: 'Every receipt, trip, and bag of waste carries a carbon footprint. Glyiv reads it automatically from data you already have — then turns it into <b>real rewards</b>.',
        ar: 'لكل إيصال ورحلة وكيس نفايات بصمة كربونية. يقرأها Glyiv تلقائيًا من بياناتٍ تملكها أصلًا — ثم يحوّلها إلى <b>مكافآت حقيقية</b>.',
      },
      "hero.cta1": { en: "Explore the Ecosystem", ar: "استكشف النظام" },
      "hero.cta2": { en: "Join the Community", ar: "انضم إلى المجتمع" },
    };

    function firstTextNode(el) {
      for (var i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3 && el.childNodes[i].nodeValue.trim()) return el.childNodes[i];
      }
      return null;
    }

    /* Simpan teks/HTML Bahasa asli sekali, supaya kembali ke "id" bisa pulih. */
    function captureOriginals() {
      // Label navbar: tombol dropdown + tautan langsung + CTA.
      var nav = navSitus();
      var items = nav ? [].slice.call(nav.querySelectorAll(".lnav__links .ldrop__btn, .lnav__links > a, .lnav__cta")) : [];
      items.forEach(function (el) {
        /* Ditandai supaya penelusur simpul teks di i18n.js TIDAK ikut menyentuh
           elemen ini — kalau dua mekanisme menulis simpul yang sama, tombol
           "kembali ke Bahasa" memulihkan teks yang salah. */
        el.setAttribute("data-i18n-skip", "nav");
        if (el.__oLang != null) return;
        var tn = firstTextNode(el);
        var txt = (tn ? tn.nodeValue : el.textContent).trim();
        if (NAV[txt]) { el.__oLang = txt; el.__oNode = tn; }
      });
      // Hero data-i18n.
      [].slice.call(document.querySelectorAll("[data-i18n]")).forEach(function (el) {
        if (el.__oHtml == null) el.__oHtml = el.innerHTML;
      });
    }

    function apply(lang) {
      var nav = navSitus();
      var meta = LANGS.filter(function (l) { return l.code === lang; })[0] || LANGS[0];
      /* Arah teks dipasang mesin i18n.js (ia juga menyuntik glyiv-rtl.css).
         Kalau mesin belum/gagal dimuat, berkas ini tetap memasangnya sendiri
         supaya halaman Arab tidak pernah tampil kiri-ke-kanan. */
      if (!window.GlyivI18n) {
        document.documentElement.setAttribute("lang", lang);
        document.documentElement.setAttribute("dir", meta.dir);
      }

      // Navbar
      var items = nav ? [].slice.call(nav.querySelectorAll(".lnav__links .ldrop__btn, .lnav__links > a, .lnav__cta")) : [];
      items.forEach(function (el) {
        var o = el.__oLang; if (o == null || !NAV[o]) return;
        var val = lang === "id" ? o : (NAV[o][lang] || o);
        var tn = el.__oNode || firstTextNode(el);
        if (tn) tn.nodeValue = (el.__oNode ? val + " " : val);
        else el.textContent = val;
      });

      // Hero
      [].slice.call(document.querySelectorAll("[data-i18n]")).forEach(function (el) {
        var key = el.getAttribute("data-i18n");
        if (lang === "id") { el.innerHTML = el.__oHtml; return; }
        var d = I18N[key];
        el.innerHTML = (d && d[lang]) ? d[lang] : el.__oHtml;
      });

      // Status pil
      (nav ? [].slice.call(nav.querySelectorAll(".lnav__lang button")) : []).forEach(function (b) {
        var on = b.getAttribute("data-lang") === lang;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });

      /* ⛔ ARIA pil bahasa — cacat yang ditemukan audit ronde 45, dan ia hidup di
         SETIAP halaman situs sekaligus. Wadah pil diberi `data-i18n-skip` di
         build() supaya mesin kamus tidak mengacaknya; konsekuensinya
         `aria-label` di sana TIDAK PERNAH ikut diterjemahkan, jadi pembaca layar
         berbahasa Inggris maupun Arab mendengar "Pilih bahasa" apa adanya.
         Terjemahannya SUDAH ADA di kamus ("Choose language" / "اختر اللغة") —
         yang hilang cuma jalan untuk memakainya, persis kelas cacat yang sama
         dengan label nav "Solusi". Diterapkan di sini, bukan di build(), karena
         ia harus ikut berubah setiap kali bahasa diganti.
         ⚠︎ Ini juga kelas utang yang gerbang bahasa TIDAK BISA lihat:
         `panen-bahasa.cjs` dan `audit-bahasa.cjs` sama-sama hanya menelusuri
         simpul TEKS, tidak satu pun nilai atribut. */
      var ariaPil = { id: "Pilih bahasa", en: "Choose language", ar: "اختر اللغة" };
      var wrapPil = nav && nav.querySelector(".lnav__lang");
      if (wrapPil) wrapPil.setAttribute("aria-label", ariaPil[lang] || ariaPil.id);
    }

    /* Membangun pil bahasa DI NAVBAR YANG SEDANG HIDUP. Boleh — dan memang —
       dipanggil ulang: kalau navbarnya sudah punya `.lnav__lang`, ia tidak
       melakukan apa pun dan menjawab `false`; kalau simpul navbarnya baru (pil
       ikut lenyap bersama header lama), pil dibangun lagi di simpul itu dan
       jawabannya `true`. Jawaban itu yang dipakai `susul()` di bawah untuk
       memberi tahu glyiv-nav.js bahwa ada pil baru yang perlu ditata ulang. */
    function build() {
      var nav = navSitus();
      if (!nav || nav.querySelector(".lnav__lang")) return false;
      var wrap = document.createElement("div");
      wrap.className = "lnav__lang";
      wrap.setAttribute("role", "group");
      wrap.setAttribute("aria-label", "Pilih bahasa");
      wrap.setAttribute("data-i18n-skip", "");
      LANGS.forEach(function (l) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("data-lang", l.code);
        b.setAttribute("lang", l.code);
        b.setAttribute("title", l.native);
        b.setAttribute("aria-label", l.native);
        b.textContent = l.short;
        b.addEventListener("click", function () { window.glyivSetLang(l.code); });
        wrap.appendChild(b);
      });
      // Sisipkan sebelum CTA (atau sebelum burger kalau tak ada CTA).
      var cta = nav.querySelector(".lnav__cta");
      var burger = nav.querySelector(".lnav__burger");
      var ref = cta || burger;
      if (ref && ref.parentNode) ref.parentNode.insertBefore(wrap, ref);
      else {
        var bar = nav.querySelector(".lnav__in");
        (bar || nav).appendChild(wrap);
      }
      return true;
    }

    /* Pilihan EKSPLISIT pengguna. Mesin i18n.js yang menyimpan & menerapkan
       kamusnya; berkas ini hanya menyusul untuk navbar + hero (lewat event
       "glyiv:lang" di bawah). Satu sumber kebenaran, bukan dua. */
    window.glyivSetLang = function (code) {
      try { localStorage.setItem("glyiv-lang", code); } catch (e) {}
      if (window.GlyivI18n) { try { window.GlyivI18n.setLang(code); return; } catch (e) {} }
      try { apply(code); } catch (e) {}
    };

    /* Deteksi bahasa dari LOKAL peramban pengunjung (proksi lokasi yang instan &
       ramah-privasi). DEFAULT tetap Bahasa Indonesia. Hanya dipakai saat pengguna
       BELUM pernah memilih sendiri — pilihan eksplisit selalu menang & disimpan.
       Kalau mesin sudah ada, deteksinya milik mesin supaya tidak ada dua jawaban. */
    function detect() {
      if (window.GlyivI18n && window.GlyivI18n.lang) return window.GlyivI18n.lang;
      try {
        var list = navigator.languages || [navigator.language || "en"];
        for (var i = 0; i < list.length; i++) {
          var c = (list[i] || "").toLowerCase();
          if (c.indexOf("id") === 0 || c.indexOf("in") === 0) return "id";
          if (c.indexOf("ar") === 0) return "ar";
          if (c.indexOf("en") === 0) return "en";
        }
      } catch (e) {}
      return "en"; // butir 15 — Inggris default
    }

    captureOriginals();
    build();
    var saved = null;
    try { saved = localStorage.getItem("glyiv-lang"); } catch (e) {}
    apply(saved || detect());

    /* Mesin mengumumkan bahasa aktif saat siap DAN setiap kali diganti — dari
       pil manapun (navbar situs, pemilih React di AppShell, atau ?lang=). */
    document.addEventListener("glyiv:lang", function (ev) {
      try { apply((ev && ev.detail) || (window.GlyivI18n && window.GlyivI18n.lang) || "id"); } catch (e) {}
    });

    /* Penyusul halaman baru: pil bahasa DULU, baru navbar & hero. Dipanggil dari
       `mungkinPindah()` di ruang modul (bagian 3 di atas), yang juga memasang
       penambal `history`-nya. */
    var jadwalUlang = [];
    susul = function () {
      for (var i = 0; i < jadwalUlang.length; i++) clearTimeout(jadwalUlang[i]);
      jadwalUlang = [];
      /* Beberapa tik, bukan satu tenggat tebakan: PindahHalus menahan pergantian
         halaman sampai gambar di atas lipatan selesai di-decode, jadi lama
         pemasangannya bergantung jaringan. Mengulang aman karena `build()` diam
         kalau pilnya sudah ada, `captureOriginals()` tidak menimpa `__oHtml` yang
         sudah ada, dan `apply()` bersifat idempoten. */
      [120, 600, 1400, 2600].forEach(function (ms) {
        jadwalUlang.push(setTimeout(function () {
          try {
            var pilBaru = build();
            captureOriginals();
            apply((window.GlyivI18n && window.GlyivI18n.lang) || window.GLYIV_LANG || "id");
            /* Pil yang baru dibangun masih berupa tiga tombol polos. Yang
               mengubahnya menjadi satu tombol ringkas + panel adalah
               `bangunPemilihBahasa()` di glyiv-nav.js, dan ia berjalan pada tik
               jadwalnya sendiri. `glyiv:page` adalah peristiwa yang SUDAH
               didengarnya untuk menjadwal ulang tik itu, jadi ia dipancarkan di
               sini — hanya ketika benar-benar ada pil baru, sehingga tidak bisa
               berputar: pemanggilan berikutnya menemukan pilnya sudah ada. */
            if (pilBaru) window.dispatchEvent(new CustomEvent("glyiv:page"));
          } catch (e) {}
        }, ms));
      });
    };
  }
})();
