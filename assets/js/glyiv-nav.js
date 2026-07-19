/* GLYIV — SHARED NAVBAR behaviour (scroll state · mobile burger · active page).
   Pairs with /assets/css/glyiv-nav.css. Safe to load on any page, once. */
(function () {
  "use strict";
  if (window.__glyivNav) return; window.__glyivNav = true;

  var nav = document.querySelector(".lnav");
  if (!nav) return;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* scroll state — pages without a dark hero pin the solid style so the nav is
     never white-on-white (data-solid on the header) */
  var solid = nav.hasAttribute("data-solid");
  var tick = false;
  function onScroll() {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { nav.classList.toggle("scrolled", solid || window.scrollY > 10); tick = false; });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  var burger = nav.querySelector(".lnav__burger");
  if (burger) burger.addEventListener("click", function () { document.body.classList.toggle("lnav-open"); });
  // close the panel after tapping a link
  $$(".lnav__links a", nav).forEach(function (a) {
    a.addEventListener("click", function () { document.body.classList.remove("lnav-open"); });
  });

  /* active page — same markup everywhere, so derive it from the URL.
     A link to a section index (…/kabar/) also owns its children (…/kabar/artikel.html). */
  var here = location.pathname.replace(/index\.html$/, "");
  $$(".lnav__links a[href]", nav).forEach(function (a) {
    var raw = a.getAttribute("href");
    if (!raw || raw.indexOf("#") > -1) return; // in-page anchors are never "the current page"
    var path;
    try { path = new URL(a.href, location.href).pathname.replace(/index\.html$/, ""); } catch (e) { return; }
    var owns = path === here || (path !== "/" && path.slice(-1) === "/" && here.indexOf(path) === 0);
    if (!owns) return;
    a.classList.add("is-active");
    var drop = a.closest && a.closest(".ldrop");
    if (drop) { var btn = drop.querySelector(".ldrop__btn"); if (btn) btn.classList.add("is-active"); }
  });

  /* load the admin gate site-wide (reveals .lnav__admin items + gates /lab/landing/) */
  if (!document.getElementById("glyiv-admin-js")) {
    var as = document.createElement("script");
    as.id = "glyiv-admin-js"; as.src = "/assets/js/glyiv-admin.js"; as.defer = true;
    document.head.appendChild(as);
  }
  /* load the context-aware Gly assistant (self-skips pages that already have one) */
  if (!document.getElementById("glyiv-gly-js")) {
    var gs = document.createElement("script");
    gs.id = "glyiv-gly-js"; gs.src = "/assets/js/glyiv-gly.js"; gs.defer = true;
    document.head.appendChild(gs);
  }
})();
