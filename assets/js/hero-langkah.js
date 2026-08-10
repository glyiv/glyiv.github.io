/* ============================================================================
   GLYIV — CAROUSEL LANGKAH VERTIKAL di kolom kanan hero beranda.
   Pasangan markup `.vcar` + aturan `.vcar*` di dalam <style> dist/index.html.

   Kenapa perilakunya di berkas terpisah, bukan di glyiv-cards.js: `.gcar` di
   sana adalah carousel GESER-HORIZONTAL berbasis `scrollLeft` (rel yang
   digulir peramban). Yang ini menampilkan SATU slide pada satu waktu dengan
   `transform` vertikal — tidak ada satu baris pun yang bisa dipakai bersama.

   ATURAN YANG DIPEGANG BERKAS INI:
    · Maju otomatis BERHENTI saat tetikus di atasnya, saat ada fokus papan
      ketik di dalamnya, saat jari sedang menggeser, saat tab tidak terlihat,
      dan saat pengguna meminta `prefers-reduced-motion: reduce`. Pemilik
      menguji di tablet; pencacah yang jalan di tab tersembunyi membakar
      baterai tanpa satu pun mata yang melihat hasilnya.
    · Tidak ada satu pun pembacaan tata letak (getBoundingClientRect /
      offsetTop) — sama sekali. Perpindahan slide murni menulis satu properti
      kustom `--o` per slide dan membiarkan pengompos yang bekerja.
    · `data-auto="jalan|henti"` ditulis ke elemen supaya keadaan pencacah bisa
      DIBACA dari luar (uji peramban), bukan cuma dipercaya.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__glyivHeroLangkah) return;
  window.__glyivHeroLangkah = true;

  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function pasang(root) {
    if (root.__vcar) return;
    root.__vcar = true;

    var vp = root.querySelector(".vcar__vp");
    var slides = Array.prototype.slice.call(root.querySelectorAll(".vcar__slide"));
    var dots = Array.prototype.slice.call(root.querySelectorAll(".vcar__dot"));
    var n = slides.length;
    if (!vp || n < 2) return;

    var jeda = parseInt(root.getAttribute("data-jeda"), 10) || 5000;
    var aktif = 0, timer = 0;
    var hover = false, fokus = false, geser = false;

    /* Offset MODULAR, bukan (i - aktif). Dengan (i - aktif) slide terakhir
       melompat +2 saat carousel berputar balik ke slide pertama, sehingga
       arahnya terbalik satu kali per putaran — terlihat sebagai "tersentak".
       Rumus ini menjaga nilainya selalu di {-1, 0, 1}: satu slide selalu naik
       keluar, satu selalu naik masuk dari bawah. */
    function ke(i) {
      aktif = ((i % n) + n) % n;
      for (var k = 0; k < n; k++) {
        var o = (((k - aktif + n + 1) % n) - 1);
        slides[k].style.setProperty("--o", String(o));
        var on = k === aktif;
        slides[k].classList.toggle("is-on", on);
        /* Wadahnya `aria-live="polite"`; membuka/menutup `aria-hidden` di
           dalamnya itulah yang membuat pembaca layar mengumumkan langkah baru.
           Tanpa ini tiga langkah terbaca sekaligus, terus-menerus. */
        slides[k].setAttribute("aria-hidden", on ? "false" : "true");
      }
      for (var d = 0; d < dots.length; d++) {
        dots[d].setAttribute("aria-current", d === aktif ? "true" : "false");
      }
    }

    function berhenti() {
      if (timer) { clearInterval(timer); timer = 0; }
      root.setAttribute("data-auto", "henti");
    }
    function mulai() {
      if (timer) return;
      timer = window.setInterval(function () {
        /* Halaman React membuang & memasang ulang komponennya; pencacah dari
           salinan lama harus mati sendiri, bukan menunggu diingat. */
        if (!root.isConnected) { berhenti(); return; }
        ke(aktif + 1);
      }, jeda);
      root.setAttribute("data-auto", "jalan");
    }
    function segarkan() {
      if (hover || fokus || geser || document.hidden || mqReduce.matches) berhenti();
      else mulai();
    }

    root.addEventListener("mouseenter", function () { hover = true; segarkan(); });
    root.addEventListener("mouseleave", function () { hover = false; segarkan(); });
    root.addEventListener("focusin", function () { fokus = true; segarkan(); });
    root.addEventListener("focusout", function () { fokus = false; segarkan(); });
    document.addEventListener("visibilitychange", segarkan);
    if (mqReduce.addEventListener) mqReduce.addEventListener("change", segarkan);
    else if (mqReduce.addListener) mqReduce.addListener(segarkan);

    dots.forEach(function (b, i) {
      b.addEventListener("click", function () { ke(i); });
    });

    /* Papan ketik: panah naik/turun (dan kiri/kanan, karena orang memakainya
       untuk carousel apa pun) saat fokus ada di dalam wadah. */
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { ke(aktif + 1); e.preventDefault(); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { ke(aktif - 1); e.preventDefault(); }
    });

    /* Geser VERTIKAL di layar sentuh. `touch-action:pan-x pinch-zoom` di CSS
       yang menyerahkan sumbu tegak ke sini; tanpa itu peramban menggulir
       halaman lebih dulu lalu mengirim `pointercancel`, dan gesernya tidak
       pernah selesai. Ambangnya 34px supaya ketukan biasa tidak ikut terhitung. */
    var y0 = 0, x0 = 0, turun = false;
    vp.addEventListener("pointerdown", function (e) {
      turun = true; geser = true; y0 = e.clientY; x0 = e.clientX; segarkan();
    }, { passive: true });
    function lepas(e) {
      if (!turun) return;
      turun = false; geser = false;
      var dy = e.clientY - y0, dx = e.clientX - x0;
      if (Math.abs(dy) > 34 && Math.abs(dy) > Math.abs(dx)) ke(aktif + (dy < 0 ? 1 : -1));
      segarkan();
    }
    vp.addEventListener("pointerup", lepas, { passive: true });
    vp.addEventListener("pointercancel", function () {
      turun = false; geser = false; segarkan();
    }, { passive: true });

    ke(0);
    segarkan();
  }

  function boot() {
    Array.prototype.slice.call(document.querySelectorAll(".vcar")).forEach(pasang);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  /* Halaman React memuat isi tanpa reload penuh; ikut pasang lagi. */
  window.addEventListener("glyiv:page", boot);
})();
