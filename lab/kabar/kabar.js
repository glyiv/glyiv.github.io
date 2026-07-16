/* GLYIV KABAR — renders home grid or article, mood orb, engagement, progress */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var A = window.KABAR || [];
  var fmt = function (n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "rb" : String(n); };
  var eye = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  var heart = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.5-9.5-8.5C.5 9 2.5 5 6 5c2 0 3.2 1 4 2 .8-1 2-2 4-2 3.5 0 5.5 4 3.5 7.5C19 16.5 12 21 12 21z"/></svg>';
  var share = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';

  /* ---- HOME GRID ---- */
  var grid = $("#kgrid");
  if (grid) {
    A.forEach(function (a, i) {
      var feat = i === 0;
      var el = document.createElement("a");
      el.href = "artikel.html?a=" + a.slug;
      el.className = "kc" + (feat ? " feat" : "");
      el.setAttribute("data-r", "");
      el.style.setProperty("--kc-mood", a.mood);
      el.innerHTML =
        '<div class="kc__img"><span class="kc__topic" style="background:' + a.mood + '">' + a.topic + '</span><img src="' + a.cover + '" alt=""></div>' +
        '<div class="kc__b"><h3>' + a.title + '</h3><p>' + a.dek + '</p>' +
        '<div class="kc__meta"><span>' + a.read + ' MIN</span><span class="eng"><span>' + eye + fmt(a.views) + '</span><span>' + heart + fmt(a.likes) + '</span></span></div></div>';
      grid.appendChild(el);
    });
  }

  /* ---- ARTICLE ---- */
  var root = $("#kart");
  if (root) {
    var slug = new URLSearchParams(location.search).get("a");
    var a = A.filter(function (x) { return x.slug === slug; })[0] || A[0];
    document.documentElement.style.setProperty("--mood", a.mood);
    document.documentElement.style.setProperty("--mood-soft", hexA(a.mood, .13));
    document.title = a.title + " — Kabar Glyiv";
    var body = a.blocks.map(function (b) {
      if (b.t === "lead") return '<p class="lead">' + b.x + '</p>';
      if (b.t === "p") return '<p>' + b.x + '</p>';
      if (b.t === "h2") return '<h2>' + b.x + '</h2>';
      if (b.t === "pull") return '<blockquote class="kpull">"' + b.x + '"</blockquote>';
      if (b.t === "stat") return '<div class="kstat"><div class="n">' + b.n + '</div><div class="l">' + b.l + '</div><div class="s">' + b.s + '</div></div>';
      if (b.t === "bars") return '<figure class="kfig" style="border:none;box-shadow:none;background:none"><div class="kbars" data-bars>' + b.h.map(function (h) { return '<i style="--h:' + h + '"></i>'; }).join("") + '</div><figcaption style="background:none;padding:8px 0 0">' + b.cap + '</figcaption></figure>';
      return "";
    }).join("");
    var srcs = (a.sources || []).map(function (s) { return '<li>' + s.a + (s.u ? ' <a href="' + s.u + '" target="_blank" rel="noopener">↗</a>' : "") + '</li>'; }).join("");
    root.innerHTML =
      '<header class="kart__cover"><img src="' + a.cover + '" alt=""><div class="kart__coverin">' +
      '<span class="kart__topic">' + a.topic + '</span><h1>' + a.title + '</h1><p class="kart__dek">' + a.dek + '</p>' +
      '<div class="kart__by"><span class="av">G</span><span>' + a.author + ' &middot; ' + a.role + '<br>' + a.read + ' menit baca</span></div></div></header>' +
      '<article class="kbody">' + body +
      '<div class="ksrc"><h3>Sumber</h3><ol>' + srcs + '</ol></div>' +
      '<div class="keng"><button data-like><span class="ic">' + heart + '</span><span data-likes>' + fmt(a.likes) + '</span></button>' +
      '<button class="vw">' + eye + '<span>' + fmt(a.views + 1) + ' dibaca</span></button>' +
      '<button data-share>' + share + 'Bagikan</button></div>' +
      '</article>';

    // engagement
    var likeBtn = $("[data-like]", root), liked = false, likes = a.likes;
    likeBtn && likeBtn.addEventListener("click", function () {
      liked = !liked; likes += liked ? 1 : -1;
      likeBtn.classList.toggle("liked", liked);
      $("[data-likes]", root).textContent = fmt(likes);
    });
    var shareBtn = $("[data-share]", root);
    shareBtn && shareBtn.addEventListener("click", function () {
      if (navigator.share) navigator.share({ title: a.title, url: location.href }).catch(function () {});
      else { navigator.clipboard && navigator.clipboard.writeText(location.href); shareBtn.lastChild.textContent = "Tersalin!"; }
    });
    // animate bars on scroll
    var bio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); bio.unobserve(e.target); } }); }, { threshold: .4 });
    $$("[data-bars]", root).forEach(function (b) { bio.observe(b); });
    buildOrb(a);
  }

  /* ---- reveal + nav + progress ---- */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .12, rootMargin: "0px 0px -8% 0px" });
  $$("[data-r]").forEach(function (e) { io.observe(e); });
  var nav = $(".knav"), prog = $(".kprog"), tick = false;
  addEventListener("scroll", function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      if (nav) nav.classList.toggle("scr", scrollY > 8);
      if (prog) { var h = document.documentElement; var m = h.scrollHeight - h.clientHeight; prog.style.width = (m > 0 ? scrollY / m * 100 : 0) + "%"; }
      tick = false;
    });
  }, { passive: true });
  $$("[data-yr]").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* ---- mood-color companion orb (canvas, cheap) ---- */
  function buildOrb(a) {
    var wrap = document.createElement("div");
    wrap.className = "korb";
    wrap.innerHTML = '<span class="korb__ring"></span><canvas></canvas><div class="korb__tip"><b>GLY · ASISTEN</b>' + (a.orb || "Tanya soal artikel ini") + '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function () { location.href = "/lab/index.html#demo"; });
    var cv = wrap.querySelector("canvas"), ctx = cv.getContext("2d");
    var dpr = Math.min(devicePixelRatio || 1, 2), S = 60; cv.width = S * dpr; cv.height = S * dpr; ctx.scale(dpr, dpr);
    var mood = a.mood;
    if (reduce) { drawOrb(ctx, S, mood, 0); return; }
    var t = 0, vis = true;
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(wrap);
    (function loop() { if (vis) { t += 0.03; drawOrb(ctx, S, mood, t); } requestAnimationFrame(loop); })();
  }
  function drawOrb(ctx, S, mood, t) {
    ctx.clearRect(0, 0, S, S);
    var cx = S / 2, cy = S / 2, br = 0.5 + Math.sin(t) * 0.5; // breathe 0..1
    var r = 20 + br * 2.5;
    // outer glow
    var g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r + 8);
    g.addColorStop(0, hexA(mood, .9)); g.addColorStop(.5, hexA(mood, .5)); g.addColorStop(1, hexA(mood, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, 7); ctx.fill();
    // core dark
    ctx.fillStyle = "#0a1712"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    // orbiting dots (mood)
    for (var i = 0; i < 3; i++) {
      var ang = t * (1 + i * .3) + i * 2.1, rr = r - 5 - i * 3;
      ctx.fillStyle = hexA(mood, .95 - i * .2);
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 2.2 - i * .4, 0, 7); ctx.fill();
    }
    // inner ring
    ctx.strokeStyle = hexA(mood, .55); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, r - 4, t % 6.28, t % 6.28 + 4.2); ctx.stroke();
    // bright core
    ctx.fillStyle = hexA("#eafff4", .9); ctx.beginPath(); ctx.arc(cx, cy, 3 + br, 0, 7); ctx.fill();
  }
  function hexA(hex, a) {
    hex = hex.replace("#", "");
    var r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
})();
