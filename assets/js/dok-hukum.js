/* ═══════════════════════════════════════════════════════════════════════════
   DOKUMEN HUKUM — perilaku daftar isi & lipatan pasal (/ketentuan · /privasi)
   ───────────────────────────────────────────────────────────────────────────
   Tiga hal, tidak lebih:
     1. menandai bagian yang sedang dibaca di daftar isi;
     2. tombol "Ciutkan semua" / "Buka semua";
     3. mengetuk butir daftar isi di ponsel MENUTUP lipatannya lagi.

   ⚠︎ Halaman ini juga hidup sebagai komponen React hasil port. Karena itu:
     · TIDAK ADA penjaga "sekali per sesi" yang memakai `window` global —
       kalau ada, berpindah halaman DI DALAM React akan mendarat di halaman
       kedua tanpa perilaku apa pun;
     · IntersectionObserver LAMA dibongkar sebelum yang baru dipasang, kalau
       tidak dua pengamat berebut menandai bagian yang berbeda;
     · pemasang dijalankan lagi pada event `glyiv:page` (dikirim useSiteScripts
       tiap halaman React dipasang), sama seperti gerbang admin di glyiv-nav.js.

   ⚠︎ `scrollIntoView` TIDAK dipakai untuk tautan #bagian: halaman React punya
   `GulirKeJangkar` yang sudah mengejar posisi yang masih bergerak. Menambah
   pengejar kedua = dua gulir berebut, dan yang kalah membuat halaman berkedut.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var pengamat = null;

  function bongkar() {
    if (pengamat) { try { pengamat.disconnect(); } catch (e) {} pengamat = null; }
  }

  function pasang() {
    var toc = document.querySelector("[data-dok-toc]");
    var sekat = Array.prototype.slice.call(document.querySelectorAll(".dok-sec[id]"));
    if (!toc && !sekat.length) return; // bukan halaman dokumen

    bongkar();

    /* ── 1. penanda bagian yang sedang dibaca ─────────────────────────────── */
    var tautan = {};
    Array.prototype.forEach.call(toc ? toc.querySelectorAll('a[href^="#"]') : [], function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id) tautan[id] = a;
    });

    if (sekat.length && "IntersectionObserver" in window) {
      pengamat = new IntersectionObserver(
        function (entri) {
          entri.forEach(function (e) {
            var a = tautan[e.target.id];
            if (!a) return;
            if (e.isIntersecting) {
              Object.keys(tautan).forEach(function (k) { tautan[k].classList.remove("is-here"); });
              a.classList.add("is-here");
            }
          });
        },
        /* Jendela sempit di sepertiga atas layar: bagian dianggap "sedang
           dibaca" saat judulnya lewat di bawah navbar, bukan saat ia sekadar
           terlihat — kalau tidak, tiga bagian pendek menyala bersamaan. */
        { rootMargin: "-84px 0px -68% 0px", threshold: 0 },
      );
      sekat.forEach(function (s) { pengamat.observe(s); });
    }

    /* ── 2. buka / ciutkan semua ──────────────────────────────────────────── */
    var tombol = document.querySelector("[data-dok-lipat]");
    if (tombol && !tombol.__dok) {
      tombol.__dok = true;
      tombol.addEventListener("click", function () {
        var pasal = Array.prototype.slice.call(document.querySelectorAll(".dok-pasal"));
        if (!pasal.length) return;
        /* Keadaan berikutnya ditentukan dari yang BENAR-BENAR terbuka sekarang,
           bukan dari penanda di tombol: pembaca bisa membuka-tutup sendiri, dan
           penanda yang tidak sinkron membuat ketukan pertama seolah tak berguna. */
        var adaTerbuka = pasal.some(function (d) { return d.open; });
        pasal.forEach(function (d) { d.open = !adaTerbuka; });
        var label = tombol.querySelector("[data-dok-label]");
        if (label) label.textContent = adaTerbuka ? "Buka semua bagian" : "Ciutkan semua bagian";
      });
    }

    /* ── 3. ponsel: mengetuk butir daftar isi menutup lipatannya ──────────── */
    var lipat = document.querySelector(".dok-toc__lipat");
    if (lipat && !lipat.__dok) {
      lipat.__dok = true;
      lipat.addEventListener("click", function (ev) {
        var a = ev.target && ev.target.closest ? ev.target.closest("a[href^='#']") : null;
        if (a) lipat.open = false;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pasang, { once: true });
  } else {
    pasang();
  }
  /* Navigasi React: halaman baru, DOM baru, pengamat baru. */
  addEventListener("glyiv:page", pasang);
})();
