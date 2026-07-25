/* ============================================================================
   GLYIV — kartu 3D + kilau, dan carousel.
   Dipasang di halaman mana pun yang memakai .tcard / .gcar.

   PERFORMA: pemilik menguji di tablet Android dan tidak menoleransi lag, jadi
   aturan mainnya keras:
     - getBoundingClientRect() dibaca SEKALI saat pointer masuk (dan saat resize),
       TIDAK pernah di dalam pointermove
     - pointermove hanya menghitung angka lalu menulis CSS custom property
     - penulisan dibungkus requestAnimationFrame, satu frame satu tulis
     - efek mati total di perangkat sentuh dan saat prefers-reduced-motion
   ============================================================================ */
(function () {
  "use strict";
  if (window.__glyivCards) return;
  window.__glyivCards = true;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── Kartu 3D + kilau ──────────────────────────────────────────────────── */
  function initTilt(card) {
    if (card.__tilt) return;
    card.__tilt = true;

    // Lapisan kilau disuntik supaya markup halaman tetap bersih.
    if (!card.querySelector(".tcard__gloss")) {
      var g = document.createElement("span");
      g.className = "tcard__gloss";
      g.setAttribute("aria-hidden", "true");
      card.appendChild(g);
    }
    if (reduce || !fine) return;

    var rect = null, raf = 0, rx = 0, ry = 0, mx = 50, my = 0;
    var MAX = 7; // derajat — cukup terasa 3D tanpa membuat teks sulit dibaca

    function write() {
      raf = 0;
      card.style.setProperty("--rx", rx.toFixed(2) + "deg");
      card.style.setProperty("--ry", ry.toFixed(2) + "deg");
      card.style.setProperty("--mx", mx.toFixed(1) + "%");
      card.style.setProperty("--my", my.toFixed(1) + "%");
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(write); }

    card.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch") return;
      rect = card.getBoundingClientRect();   // dibaca SEKALI
      card.classList.add("is-tilting");
    });

    card.addEventListener("pointermove", function (e) {
      if (!rect) return;                      // tanpa pembacaan layout di sini
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      ry = (px - 0.5) * 2 * MAX;
      rx = -(py - 0.5) * 2 * MAX;
      mx = px * 100;
      my = py * 100;
      schedule();
    });

    function reset() {
      rect = null;
      card.classList.remove("is-tilting");
      rx = ry = 0; mx = 50; my = 0;
      schedule();
    }
    card.addEventListener("pointerleave", reset);
    card.addEventListener("blur", reset, true);
    window.addEventListener("resize", function () { rect = null; }, { passive: true });
  }

  /* ── Carousel ──────────────────────────────────────────────────────────── */
  function initCarousel(root) {
    if (root.__car) return;
    root.__car = true;

    var track = root.querySelector(".gcar__track");
    if (!track) return;
    var prev = root.querySelector("[data-car-prev]");
    var next = root.querySelector("[data-car-next]");
    var dotsWrap = root.querySelector(".gcar__dots");
    var items = $$(":scope > *", track);

    // Titik indikator dibuat dari jumlah item sebenarnya.
    var dots = [];
    if (dotsWrap && items.length > 1) {
      items.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "gcar__dot";
        b.setAttribute("aria-label", "Ke item " + (i + 1));
        b.addEventListener("click", function () {
          items[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "start", block: "nearest" });
        });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function step() {
      // Lebar satu item + jarak; dibaca saat dibutuhkan saja (klik), bukan per frame.
      var first = items[0];
      if (!first) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap || "16") || 16;
      return first.getBoundingClientRect().width + gap;
    }

    // Arah dibalik otomatis saat RTL supaya tombol tetap terasa benar.
    var rtl = getComputedStyle(track).direction === "rtl";
    function go(dir) {
      track.scrollBy({ left: (rtl ? -dir : dir) * step(), behavior: reduce ? "auto" : "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });

    /* ── Jalan sendiri ──────────────────────────────────────────────────
       Dinyalakan lewat data-autoplay="<detik>" pada .gcar.
       Sopan: berhenti saat kursor di atasnya, saat ada fokus keyboard di
       dalamnya, saat pengguna menggeser sendiri, dan saat tab tidak aktif
       (menghemat baterai). Mati total kalau prefers-reduced-motion.
       Sampai ujung -> kembali ke awal, jadi terasa berputar. */
    var apMs = parseFloat(root.getAttribute('data-autoplay') || '0') * 1000;
    if (apMs > 0 && !reduce) {
      var timer = null, paused = false;
      var tick = function () {
        if (paused || document.hidden) return;
        var max = track.scrollWidth - track.clientWidth - 2;
        if (Math.abs(track.scrollLeft) >= max) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else { go(1); }
      };
      var start = function () { if (!timer) timer = setInterval(tick, apMs); };
      var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
      root.addEventListener('pointerenter', function () { paused = true; });
      root.addEventListener('pointerleave', function () { paused = false; });
      root.addEventListener('focusin', function () { paused = true; });
      root.addEventListener('focusout', function () { paused = false; });
      // Geseran manual menunda putaran otomatis sejenak agar tidak berebut.
      var resume;
      track.addEventListener('pointerdown', function () {
        paused = true; clearTimeout(resume);
        resume = setTimeout(function () { paused = false; }, 6000);
      });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });
      // Hanya berputar saat carousel benar-benar terlihat di layar.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
        }, { threshold: 0.25 }).observe(root);
      } else { start(); }
    }

    var ticking = false;
    function sync() {
      ticking = false;
      var max = track.scrollWidth - track.clientWidth - 2;
      var x = Math.abs(track.scrollLeft);
      if (prev) prev.disabled = x <= 2;
      if (next) next.disabled = x >= max;
      if (dots.length) {
        var idx = Math.round(x / step());
        idx = Math.max(0, Math.min(dots.length - 1, idx));
        dots.forEach(function (d, i) { d.setAttribute("aria-current", i === idx ? "true" : "false"); });
      }
    }
    track.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(sync); }
    }, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    sync();
  }

  function boot() {
    $$(".tcard").forEach(initTilt);
    $$(".gcar").forEach(initCarousel);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // Halaman React memuat ulang konten tanpa reload penuh; ikut pasang lagi.
  window.addEventListener("glyiv:page", boot);
})();
