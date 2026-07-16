/* GLYIV LAB — supplemental interactions (device 3D tilt · count-up · video fallback).
   Reveals/counters from glyiv.js also run; this adds lab-only bits. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* count-up for [data-cu] (label stays real in DOM) */
  var cuObs = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      cuObs.unobserve(en.target);
      var el = en.target, target = parseFloat(el.getAttribute("data-cu"));
      var pre = el.getAttribute("data-pre") || "", suf = el.getAttribute("data-suf") || "", dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      var f = function (v) { return pre + v.toLocaleString("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
      if (reduce || isNaN(target)) { el.textContent = f(target); return; }
      var t0 = performance.now(), dur = 1500;
      (function step(now) { var p = Math.min(1, (now - t0) / dur); el.textContent = f(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
    });
  }, { threshold: .4 });
  $$("[data-cu]").forEach(function (el) { cuObs.observe(el); });

  /* 3D tilt on device frames + cards (fine pointer only) */
  if (fine && !reduce) {
    $$("[data-tilt3d]").forEach(function (c) {
      var raf = null;
      c.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = c.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          c.style.transform = "perspective(1100px) rotateX(" + (-y * 7).toFixed(2) + "deg) rotateY(" + (x * 9).toFixed(2) + "deg)";
          raf = null;
        });
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }

  /* hero video: if it fails to load, reveal the poster image fallback already in DOM */
  $$(".vhero__media video").forEach(function (v) {
    v.addEventListener("error", function () { v.style.display = "none"; });
    // some browsers block autoplay until interaction; retry play on first scroll/touch
    var tryPlay = function () { var p = v.play && v.play(); if (p && p.catch) p.catch(function () {}); };
    tryPlay();
    window.addEventListener("scroll", tryPlay, { once: true, passive: true });
    window.addEventListener("touchstart", tryPlay, { once: true, passive: true });
  });

  /* nav: scroll shadow + mobile toggle */
  var lnav = $(".lnav");
  if (lnav) {
    var tick = false;
    var onScroll = function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () { lnav.classList.toggle("scrolled", window.scrollY > 10); tick = false; });
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    var bg = $(".lnav__burger");
    if (bg) bg.addEventListener("click", function () { document.body.classList.toggle("lnav-open"); });
  }

  /* 3D tablet: auto-cycle its stacked screens (gated to visible) */
  $$(".tablet .dstack").forEach(function (stack) {
    var screens = $$(".dscreen", stack);
    if (!screens.length) return;
    var i = 0, timer = null;
    var show = function (n) { screens.forEach(function (s, k) { s.classList.toggle("on", k === n); }); };
    var start = function () { if (timer || reduce) return; timer = setInterval(function () { i = (i + 1) % screens.length; show(i); }, 4500); };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    show(0);
    var vio = new IntersectionObserver(function (es) { es.forEach(function (en) { en.isIntersecting ? start() : stop(); }); }, { threshold: .3 });
    vio.observe(stack);
  });

  /* WEEX-style interactive phone: tabs drive screens, auto-advance + synthetic tap */
  $$("[data-phonedemo]").forEach(function (root) {
    var tabs = $$(".dtab", root), screens = $$(".phone .dscreen", root), phone = $(".phone", root);
    if (!tabs.length || !screens.length) return;
    var i = 0, timer = null;
    var go = function (n, tap) {
      i = ((n % screens.length) + screens.length) % screens.length;
      tabs.forEach(function (t, k) { t.classList.toggle("on", k === i); });
      screens.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      if (tap && phone && !reduce) { phone.classList.remove("tap"); void phone.offsetWidth; phone.classList.add("tap"); }
    };
    var reset = function () { stop(); start(); };
    var start = function () { if (timer || reduce) return; timer = setInterval(function () { go(i + 1, true); }, 5000); };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    tabs.forEach(function (t, k) { t.addEventListener("click", function () { go(k, true); reset(); }); });
    go(0);
    var pio = new IntersectionObserver(function (es) { es.forEach(function (en) { en.isIntersecting ? start() : stop(); }); }, { threshold: .35 });
    pio.observe(root);
  });

  /* sticky product tour: active step drives the cross-faded screen */
  var tour = $(".tour");
  if (tour) {
    var steps = $$("[data-step]", tour), screens = $$("[data-screen]", tour);
    var set = function (i) {
      steps.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      screens.forEach(function (s, k) { s.classList.toggle("on", k === i); });
    };
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { var i = steps.indexOf(en.target); if (i >= 0) set(i); } });
    }, { threshold: .6, rootMargin: "-20% 0px -30% 0px" });
    steps.forEach(function (s) { tio.observe(s); });
    set(0);
  }

  /* GLY BOT carbon chat (canned, offline, fast) */
  (function () {
    var fab = $("#glyBot"), chat = $("#glyChat"), msgs = $("#glyMsgs"), input = $("#glyInput");
    if (!fab || !chat) return;
    var opened = false;
    function bub(text, who) { var b = document.createElement("div"); b.className = "liv-bub " + (who || "bot"); b.textContent = text; msgs.appendChild(b); msgs.scrollTop = msgs.scrollHeight; }
    function open() { document.body.classList.add("livchat-open"); if (!opened) { opened = true; setTimeout(function () { bub("Hai! Saya Gly, asisten karbon Glyiv. 🌿 Mau tahu apa itu Glyiv, kenapa karbon penting, atau bagaimana platform kami bekerja?"); }, 250); } setTimeout(function () { input && input.focus(); }, 300); }
    function close() { document.body.classList.remove("livchat-open"); }
    function reply(t) {
      t = (t || "").toLowerCase();
      var has = function () { for (var i = 0; i < arguments.length; i++) if (t.indexOf(arguments[i]) >= 0) return true; return false; };
      if (has("apa itu", "glyiv", "produk")) return "Glyiv adalah platform intelijen karbon kelas enterprise — sebuah agen AI yang membaca data karbon Anda, menganalisis emisi terhadap biaya, lalu mengubahnya jadi keputusan. Ukur → Verifikasi → Offset.";
      if (has("kenapa", "penting", "mengapa")) return "Karbon kini biaya nyata di neraca: regulasi mewajibkan pelaporan (IFRS S2, POJK 51), pasar ekspor menagihnya (CBAM), dan investor memberi harga pada risiko karbon. Yang tak terukur diam-diam menggerus laba.";
      if (has("cara kerja", "bagaimana", "kerja", "how")) return "Tiga langkah: (1) Ingest — Carbon API menyerap data ERP, energi, invoice, satelit. (2) Intelligence — AI menghitung Scope 1/2/3 & menemukan pemborosan. (3) Act — offset lewat pohon ter-tokenisasi + laporan siap-regulasi.";
      if (has("industri", "sektor", "bank", "tambang", "sawit", "rumah sakit", "manufaktur")) return "Kami punya solusi untuk 11 industri — keuangan, tambang, konstruksi, manufaktur, sawit, logistik, F&B, rumah sakit, data center, pemerintah, dan investor. Cek menu Solusi di atas untuk industri Anda.";
      if (has("offset", "pohon", "tree", "rwa")) return "Offset Glyiv didukung aset pohon nyata yang dipantau satelit dan ter-tokenisasi sebagai RWA (ERC-3643), terekonsiliasi ke registri resmi. Originate, bukan bridge — bukan 'kredit zombie'.";
      if (has("harga", "biaya", "price", "demo")) return "Untuk harga & demo yang disesuaikan industri Anda, klik 'Jadwalkan Demo' di atas — tim kami senang menunjukkan datanya. 🙌";
      if (has("halo", "hai", "hi", "pagi", "siang", "sore", "malam")) return "Halo! 👋 Saya Gly. Tanyakan apa saja soal karbon atau platform Glyiv.";
      return "Saya paling paham soal: apa itu Glyiv, kenapa karbon penting, cara kerja platform, solusi per industri, dan Tree Marketplace. Mau bahas yang mana? Atau klik 'Jadwalkan Demo' untuk bicara dengan tim.";
    }
    function send(text) { text = (text || input.value || "").trim(); if (!text) return; input.value = ""; bub(text, "me"); setTimeout(function () { bub(reply(text)); }, 380); }
    fab.addEventListener("click", open);
    $("#glyClose") && $("#glyClose").addEventListener("click", close);
    $("#glySend") && $("#glySend").addEventListener("click", function () { send(); });
    input && input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
    $$(".liv-chip", $("#glyChips")).forEach(function (c) { c.addEventListener("click", function () { send(c.textContent); }); });
  })();

  /* year */
  $$("[data-yr]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
