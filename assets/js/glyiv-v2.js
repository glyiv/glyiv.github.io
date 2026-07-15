/* =============================================================
   GLYIV v2 — motion engine (light, tablet-safe, ZERO WebGL)
   tier system · shared IntersectionObserver reveals · count-ups ·
   live dashboard gating · magnetic/tilt (fine pointer only) ·
   SVG data-network · team scrollytelling · nav
   ============================================================= */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* -------- capability tier (decide once) -------- */
  var mq = function (q) { return window.matchMedia(q).matches; };
  var reduced = mq("(prefers-reduced-motion: reduce)");
  var finePointer = mq("(hover: hover) and (pointer: fine)");
  var lowPower = (navigator.deviceMemory || 4) < 4 || (navigator.hardwareConcurrency || 4) < 4;
  var tier = reduced ? "static" : (finePointer && !lowPower ? "full" : "reduced");
  var root = document.documentElement;
  root.dataset.motion = tier;                       // full | reduced | static
  root.dataset.pointer = finePointer ? "fine" : "coarse";
  var STATIC = tier === "static";

  /* -------- shared IntersectionObserver: reveals + count-ups + gating -------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var el = en.target;
      if (en.isIntersecting) {
        el.classList.add("in");
        if (el.hasAttribute("data-count")) countUp(el);
        $$("[data-count]", el).forEach(countUp);
        if (el.classList.contains("dash") || el.hasAttribute("data-play")) el.classList.add("is-playing");
        if (el.hasAttribute("data-reveal") && !el.hasAttribute("data-play")) io.unobserve(el); // one-shot reveal
      } else {
        // pause "play only while visible" hosts (battery/GPU guard); reveals already unobserved
        if (el.classList.contains("dash") || el.hasAttribute("data-play")) el.classList.remove("is-playing");
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  $$("[data-reveal]").forEach(function (el) { io.observe(el); });
  $$("[data-count]").forEach(function (el) { if (!el.closest("[data-reveal]")) io.observe(el); });
  $$(".dash,[data-play]").forEach(function (el) { io.observe(el); });

  /* -------- count-up (real value stays in DOM; tween only decorates) -------- */
  function countUp(el) {
    if (el.__counted) return; el.__counted = true;
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var fmt = function (v) { return prefix + v.toLocaleString("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix; };
    if (STATIC || isNaN(target)) { el.textContent = fmt(target); return; }
    var dur = 1400, t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(2, -10 * p);            // easeOutExpo
      el.textContent = fmt(target * (p >= 1 ? 1 : e));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* -------- NAV: scroll shadow + mobile toggle -------- */
  var nav = $(".nav");
  var onScroll = (function () {
    var ticking = false;
    return function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        if (nav) nav.classList.toggle("scrolled", window.scrollY > 8);
        ticking = false;
      });
    };
  })();
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  $(".nav__burger") && $(".nav__burger").addEventListener("click", function () {
    document.body.classList.toggle("nav-mobile-open");
  });

  /* -------- MAGNETIC CTA + CARD TILT (fine pointer only) -------- */
  if (tier === "full") {
    $$("[data-magnetic]").forEach(function (b) {
      var raf = null;
      b.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = b.getBoundingClientRect();
          var x = (e.clientX - (r.left + r.width / 2)) * 0.22;
          var y = (e.clientY - (r.top + r.height / 2)) * 0.22;
          b.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
          raf = null;
        });
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
    $$("[data-tilt]").forEach(function (c) {
      var raf = null;
      c.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = c.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          c.style.transform = "perspective(900px) rotateX(" + (-y * 4).toFixed(2) + "deg) rotateY(" + (x * 4).toFixed(2) + "deg)";
          raf = null;
        });
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }

  /* -------- SVG data-network: measure path lengths for draw-on -------- */
  $$("svg [data-draw]").forEach(function (p) {
    try { var L = p.getTotalLength(); p.style.setProperty("--len", Math.ceil(L)); } catch (e) {}
  });
  // hero sparkline: set its dash length too
  $$(".chart__spark path").forEach(function (p) {
    try { var L = p.getTotalLength(); p.style.setProperty("--len", Math.ceil(L)); } catch (e) {}
  });

  /* -------- TEAM: duotone→color reveal (coarse=scroll/tap, fine=hover) -------- */
  var portraits = $$(".pf");
  if (portraits.length) {
    if (finePointer) {
      // hover handled by CSS :hover; also allow click-to-pin
      portraits.forEach(function (p) { p.addEventListener("click", function () { p.classList.toggle("lit"); }); });
    } else {
      // coarse: reveal to color when scrolled into view; tap toggles back
      var pio = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("lit"); pio.unobserve(en.target); } });
      }, { threshold: 0.5 });
      portraits.forEach(function (p) {
        pio.observe(p);
        p.addEventListener("click", function () { p.classList.toggle("lit"); });
      });
    }
  }

  /* -------- TEAM: scrollytelling — sticky visual crossfade via chapter sentinels -------- */
  var spine = $(".spine");
  if (spine) {
    var chapters = $$(".chapter", spine);
    var scenes = $$(".scene", spine);
    var setScene = function (i) {
      scenes.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      chapters.forEach(function (c, k) { c.classList.toggle("active", k === i); });
    };
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { var i = chapters.indexOf(en.target); if (i >= 0) setScene(i); }
      });
    }, { threshold: 0.55, rootMargin: "-20% 0px -35% 0px" });
    chapters.forEach(function (c) { cio.observe(c); });
    setScene(0);
  }

  /* -------- YEAR -------- */
  $$("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
