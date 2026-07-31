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
     dist/) — dan yang kedua tidak boleh menginisialisasi ulang apa pun. Penjaga
     lama (`window.__glyivLang`) baru dipasang SESUDAH `.lnav` ditemukan, jadi ia
     tidak menutup jendela ketika instans pertama masih menunggu navbar muncul. */
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

  /* ── 2 · tunggu navbar situs muncul ─────────────────────────────────────────
     Versi lama langsung `return` kalau `.lnav` belum ada — benar untuk halaman
     statis, SALAH untuk aplikasi React: di sana navbar baru ada setelah React
     merender, dan berkas ini dulu dimuat lewat rantai `useSiteScripts →
     glyiv-nav.js → site-lang.js`, yaitu dua perjalanan jaringan SESUDAH mount.
     Akibatnya terukur: pada mesin yang sedang sibuk, hero beranda masih Bahasa
     Indonesia 2,6 detik sesudah halaman EN dimuat — audit menangkapnya satu kali
     dari tiga jalan, dan pengunjung melihatnya sebagai kedipan.
     Sekarang berkas ini boleh dimuat dari <head> dan menunggu navbarnya. */
  function siapNav(lanjut) {
    if (document.querySelector(".lnav")) { lanjut(); return; }
    var mo, henti;
    var coba = function () {
      if (!document.querySelector(".lnav")) return false;
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
           meninggalkan observer hidup selamanya. */
        henti = setTimeout(function () { if (mo) mo.disconnect(); }, 20000);
      } catch (e) { /* tanpa MutationObserver: halaman tetap tampil */ }
    };
    if (document.body) pasang();
    else document.addEventListener("DOMContentLoaded", pasang);
  }

  siapNav(function () { try { mulai(); } catch (e) { /* jangan pernah merusak halaman karena i18n */ } });

  function mulai() {
    if (window.__glyivLang) return;
    var nav = document.querySelector(".lnav");
    if (!nav) return;
    // Navbar aplikasi (AppShell) sudah punya pemilih bahasa React sendiri —
    // jangan suntik dua kali.
    if (nav.classList.contains("lnav--app")) return;
    window.__glyivLang = true;

    var LANGS = [
      { code: "id", short: "ID", dir: "ltr", native: "Bahasa Indonesia" },
      { code: "en", short: "EN", dir: "ltr", native: "English" },
      { code: "ar", short: "AR", dir: "rtl", native: "العربية" },
    ];

    /* Label navbar bersama — dipetakan dari teks Bahasa aslinya. Nama produk
       (Carbon Intelligence, Glyiv Aset, dst.) sengaja TIDAK diterjemahkan. */
    var NAV = {
      "Ekosistem": { en: "Ecosystem", ar: "النظام البيئي" },
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
        ar: 'لكل إيصال ورحلة وكيس نفايات بصمة كربونية. يقرأها غليف تلقائيًا من بياناتٍ تملكها أصلًا — ثم يحوّلها إلى <b>مكافآت حقيقية</b>.',
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
      var items = [].slice.call(nav.querySelectorAll(".lnav__links .ldrop__btn, .lnav__links > a, .lnav__cta"));
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
      var meta = LANGS.filter(function (l) { return l.code === lang; })[0] || LANGS[0];
      /* Arah teks dipasang mesin i18n.js (ia juga menyuntik glyiv-rtl.css).
         Kalau mesin belum/gagal dimuat, berkas ini tetap memasangnya sendiri
         supaya halaman Arab tidak pernah tampil kiri-ke-kanan. */
      if (!window.GlyivI18n) {
        document.documentElement.setAttribute("lang", lang);
        document.documentElement.setAttribute("dir", meta.dir);
      }

      // Navbar
      var items = [].slice.call(nav.querySelectorAll(".lnav__links .ldrop__btn, .lnav__links > a, .lnav__cta"));
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
      [].slice.call(nav.querySelectorAll(".lnav__lang button")).forEach(function (b) {
        var on = b.getAttribute("data-lang") === lang;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function build() {
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
      else nav.querySelector(".lnav__in").appendChild(wrap);
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
        var list = navigator.languages || [navigator.language || "id"];
        for (var i = 0; i < list.length; i++) {
          var c = (list[i] || "").toLowerCase();
          if (c.indexOf("id") === 0 || c.indexOf("in") === 0) return "id";
          if (c.indexOf("ar") === 0) return "ar";
          if (c.indexOf("en") === 0) return "en";
        }
      } catch (e) {}
      return "id";
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
  }
})();
