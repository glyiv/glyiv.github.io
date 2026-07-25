/* GLYIV — pemilih bahasa untuk NAVBAR SITUS (id · en · ar).
   Dimuat oleh glyiv-nav.js pada setiap halaman situs. Menyuntikkan pil pemilih
   bahasa ke dalam .lnav supaya SETIAP navbar punya opsi bahasa (sama seperti
   navbar aplikasi), memakai kunci localStorage yang SAMA ("glyiv-lang") sehingga
   pilihan terbawa mulus antara situs dan portal aplikasi.

   Yang diterjemahkan sekarang: label navbar bersama (di semua halaman) + hero
   homepage (elemen ber-atribut data-i18n). Isi badan halaman lain masih Bahasa
   — penerjemahan penuh marketing adalah langkah berikutnya. Semua dibungkus
   try/catch: kalau ada yang meleset, halaman tetap tampil dalam Bahasa, tak
   pernah rusak. */
(function () {
  "use strict";
  try {
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
        en: 'Glyiv turns everyday choices — shopping, travel, waste — into <b>traceable climate action and real rewards</b>. One ecosystem: from green assets &amp; a carbon wallet for everyone, to carbon intelligence for enterprise.',
        ar: 'يحوّل غليف خياراتك اليومية — التسوّق والتنقّل والنفايات — إلى <b>عملٍ مناخي قابل للتتبّع ومكافآت حقيقية</b>. نظام واحد: من الأصول الخضراء ومحفظة الكربون للجميع، إلى ذكاء الكربون للمؤسسات.',
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
      document.documentElement.setAttribute("lang", lang);
      document.documentElement.setAttribute("dir", meta.dir);

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

    // Pilihan EKSPLISIT pengguna: simpan (menang atas auto-deteksi selamanya).
    window.glyivSetLang = function (code) {
      try { localStorage.setItem("glyiv-lang", code); } catch (e) {}
      try { apply(code); } catch (e) {}
    };

    /* Deteksi bahasa dari LOKAL peramban pengunjung (proksi lokasi yang instan &
       ramah-privasi). DEFAULT tetap Bahasa Indonesia. Hanya dipakai saat pengguna
       BELUM pernah memilih sendiri — pilihan eksplisit selalu menang & disimpan. */
    function detect() {
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
    // Auto-deteksi TIDAK disimpan — supaya tetap mengikuti peramban sampai pengguna
    // memilih sendiri (barulah tersimpan lewat apply()).
    apply(saved || detect());
  } catch (e) { /* jangan pernah merusak halaman karena i18n */ }
})();
