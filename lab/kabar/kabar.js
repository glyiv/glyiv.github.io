/* GLYIV KABAR — renderer (classic, robust). Renders the grid feed + article +
   story + share from window.KABAR (local content pack — always available, so the
   page never depends on a network import to display). Engagement uses
   localStorage by default; the optional kabar-live.js module upgrades it to
   realtime Firestore if the SDK loads & Firestore is configured. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var enc = encodeURIComponent;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var fmt = function (n) { n = n || 0; return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + "rb" : String(n); };
  function hexA(hex, a) { var h = (hex || "#1F7A6B").replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); var n = parseInt(h, 16); return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
  function setMood(m) {
    var r = document.documentElement;
    r.style.setProperty("--mood", m);
    r.style.setProperty("--mood-soft", hexA(m, 0.13));
    r.style.setProperty("--mood-wash", hexA(m, 0.20)); // full-page tint (top-right)
    r.style.setProperty("--mood-edge", hexA(m, 0.11)); // full-page tint (bottom-left)
    r.style.setProperty("--mood-base", hexA(m, 0.06)); // uniform tint everywhere
    r.style.setProperty("--mood-line", hexA(m, 0.22));
    r.setAttribute("data-mooded", "1");
  }

  var ICON = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  };

  /* ---------- content ---------- */
  function deriveStory(a) {
    if (a.story && a.story.length) return a.story;
    var s = [{ kind: "cover", title: a.title, text: a.dek }];
    if (a.hook) s.push({ kind: "hook", title: a.hook });
    (a.blocks || []).forEach(function (b) {
      if (b.t === "h2") s.push({ kind: "point", title: b.x });
      else if (b.t === "pull") s.push({ kind: "quote", text: b.x });
      else if (b.t === "stat") s.push({ kind: "stat", big: b.n, label: b.l, source: b.s });
    });
    s.push({ kind: "end", title: "Baca selengkapnya di Glyiv", text: "Wawasan karbon, jujur & bisa dipertanggungjawabkan." });
    return s.slice(0, 8);
  }
  function norm(a, i) {
    var slug = a.slug || ("art-" + i);
    return {
      slug: slug, _i: i, topic: a.topic || "Kabar", mood: a.mood || "#1F7A6B",
      title: a.title || "", dek: a.dek || "", hook: a.hook || a.dek || a.title,
      cover: a.cover || "", author: a.author || "Redaksi Glyiv", role: a.role || "", read: a.read || 4,
      blocks: a.blocks || [], story: deriveStory(a), sources: a.sources || [], orb: a.orb || ("Tanya soal " + (a.topic || "ini")),
      views: a.views || 0, likes: a.likes || 0, shares: a.shares || 0,
    };
  }
  var DATA = (window.KABAR || []).map(norm);
  window.__kData = DATA;
  window.__kGet = function (slug) { for (var i = 0; i < DATA.length; i++) if (DATA[i].slug === slug) return DATA[i]; return null; };

  /* ---------- engagement: localStorage default (window.KE) ---------- */
  if (!window.KE) {
    window.KE = (function () {
      var SK = "glyiv_kabar_stats", LK = "glyiv_kabar_liked";
      function rd(k) { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) { return {}; } }
      function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
      function bump(slug, f, d) { var s = rd(SK); s[slug] = s[slug] || {}; s[slug][f] = Math.max(0, (s[slug][f] || 0) + d); wr(SK, s); if (window.__kRefreshCounts) window.__kRefreshCounts(); }
      return {
        mode: "local",
        counts: function (a) { var s = rd(SK)[a.slug] || {}; return { views: (a.views || 0) + (s.views || 0), likes: (a.likes || 0) + (s.likes || 0), shares: (a.shares || 0) + (s.shares || 0), liked: !!rd(LK)[a.slug] }; },
        view: function (slug) { var k = "kv_" + slug, d = new Date().toISOString().slice(0, 10); if (localStorage.getItem(k) === d) return; try { localStorage.setItem(k, d); } catch (e) {} bump(slug, "views", 1); },
        story: function (slug) { var k = "ksv_" + slug, d = new Date().toISOString().slice(0, 10); if (localStorage.getItem(k) === d) return; try { localStorage.setItem(k, d); } catch (e) {} },
        share: function (slug) { bump(slug, "shares", 1); },
        like: function (slug) { var lk = rd(LK), now = !lk[slug]; lk[slug] = now; wr(LK, lk); bump(slug, "likes", now ? 1 : -1); return now; },
      };
    })();
  }
  function counts(a) { return window.KE.counts(a); }
  window.__kRefreshCounts = function () {
    $$("[data-vw]").forEach(function (e) { var a = window.__kGet(e.getAttribute("data-vw")); if (a) e.textContent = fmt(counts(a).views); });
    $$("[data-lk]").forEach(function (e) { var a = window.__kGet(e.getAttribute("data-lk")); if (a) e.textContent = fmt(counts(a).likes); });
    $$("[data-sh]").forEach(function (e) { var a = window.__kGet(e.getAttribute("data-sh")); if (a) e.textContent = fmt(counts(a).shares); });
    var lb = $("[data-like]"); if (lb) { var a2 = window.__kGet(lb.getAttribute("data-like")); if (a2) lb.classList.toggle("liked", counts(a2).liked); }
  };

  /* ============================ FEED (grid + search + sort + pagination) ============================ */
  function initFeed() {
    var grid = $("#kgrid"); if (!grid) return;
    var searchEl = $("#ksearch"), sortEl = $("#ksort"), pagerEl = $("#kpager");
    var state = { q: "", sort: "new", page: 1, per: 9 };
    function match(a) { var q = state.q.toLowerCase(); return !q || a.title.toLowerCase().indexOf(q) >= 0 || a.dek.toLowerCase().indexOf(q) >= 0 || a.topic.toLowerCase().indexOf(q) >= 0; }
    function sorted(list) {
      if (state.sort === "old") return list.slice().sort(function (a, b) { return b._i - a._i; });
      if (state.sort === "az") return list.slice().sort(function (a, b) { return a.title.localeCompare(b.title, "id"); });
      return list.slice().sort(function (a, b) { return a._i - b._i; }); // new (default)
    }
    function card(a, feat) {
      var c = counts(a);
      return '<a class="kc' + (feat ? " feat" : "") + '" href="artikel.html?a=' + enc(a.slug) + '" style="--kc-mood:' + esc(a.mood) + '">' +
        '<div class="kc__img">' + (a.cover ? '<img src="' + esc(a.cover) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : "") + '<span class="kc__topic">' + esc(a.topic) + '</span></div>' +
        '<div class="kc__b"><h3>' + esc(a.title) + '</h3><p>' + esc(a.dek) + '</p>' +
        '<div class="kc__meta"><span>' + a.read + ' mnt</span>' +
        '<span class="eng"><span class="eng__i">' + ICON.eye + '<b data-vw="' + esc(a.slug) + '">' + fmt(c.views) + '</b></span>' +
        '<span class="eng__i">' + ICON.heart + '<b data-lk="' + esc(a.slug) + '">' + fmt(c.likes) + '</b></span></span>' +
        '<button class="kc__story" type="button" data-story="' + esc(a.slug) + '">' + ICON.play + ' Story</button></div></div></a>';
    }
    function render() {
      var list = sorted(DATA.filter(match));
      var total = list.length, pages = Math.max(1, Math.ceil(total / state.per));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * state.per, pageItems = list.slice(start, start + state.per);
      if (!total) { grid.innerHTML = '<div class="kempty">Tak ada artikel yang cocok dengan pencarianmu.</div>'; if (pagerEl) pagerEl.innerHTML = ""; return; }
      grid.innerHTML = pageItems.map(function (a, i) { return card(a, state.page === 1 && i === 0 && state.sort === "new" && !state.q); }).join("");
      renderPager(pages, total);
    }
    function renderPager(pages, total) {
      if (!pagerEl) return;
      if (pages <= 1) { pagerEl.innerHTML = '<span class="kpager__info">' + total + ' artikel</span>'; return; }
      var btns = "";
      btns += '<button class="kpg" data-pg="' + (state.page - 1) + '"' + (state.page === 1 ? " disabled" : "") + '>‹</button>';
      var win = [];
      for (var p = 1; p <= pages; p++) { if (p === 1 || p === pages || Math.abs(p - state.page) <= 1) win.push(p); else if (win[win.length - 1] !== "…") win.push("…"); }
      win.forEach(function (p) { btns += p === "…" ? '<span class="kpg__dot">…</span>' : '<button class="kpg' + (p === state.page ? " on" : "") + '" data-pg="' + p + '">' + p + "</button>"; });
      btns += '<button class="kpg" data-pg="' + (state.page + 1) + '"' + (state.page === pages ? " disabled" : "") + '>›</button>';
      pagerEl.innerHTML = '<span class="kpager__info">' + total + ' artikel · hal ' + state.page + '/' + pages + '</span><div class="kpager__btns">' + btns + "</div>";
      $$("[data-pg]", pagerEl).forEach(function (b) { b.addEventListener("click", function () { var p = +b.dataset.pg; if (p >= 1 && p <= pages) { state.page = p; render(); window.scrollTo({ top: (grid.getBoundingClientRect().top + window.scrollY - 120), behavior: "smooth" }); } }); });
    }
    if (searchEl) { var t; searchEl.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { state.q = searchEl.value.trim(); state.page = 1; render(); }, 180); }); }
    if (sortEl) sortEl.addEventListener("change", function () { state.sort = sortEl.value; state.page = 1; render(); });
    grid.addEventListener("click", function (e) { var s = e.target.closest("[data-story]"); if (s) { e.preventDefault(); e.stopPropagation(); openStory(s.getAttribute("data-story")); } });
    render();
  }

  /* ============================ ARTICLE ============================ */
  function initArticle() {
    var root = $("#kart"); if (!root) return;
    var slug = new URLSearchParams(location.search).get("a");
    var a = window.__kGet(slug) || DATA[0];
    if (!a) { root.innerHTML = '<div class="wrap" style="padding:120px 0;text-align:center">Artikel tidak ditemukan.</div>'; return; }
    setMood(a.mood); document.title = a.title + " — Glyiv Kabar";
    var orbTip = $(".korb__tip b"); if (orbTip) orbTip.textContent = a.orb;
    var c = counts(a), av = (a.author || "R").trim().charAt(0).toUpperCase();
    root.innerHTML =
      '<header class="kart__cover">' + (a.cover ? '<img src="' + esc(a.cover) + '" alt="" onerror="this.style.display=\'none\'">' : "") +
      '<div class="kart__coverin"><span class="kart__topic">' + esc(a.topic) + '</span><h1>' + esc(a.title) + '</h1><p class="kart__dek">' + esc(a.dek) + "</p>" +
      '<div class="kart__by"><span class="av">' + av + '</span><span>' + esc(a.author) + (a.role ? " · " + esc(a.role) : "") + '</span><span>·</span><span>' + a.read + ' mnt baca</span><span>·</span><span class="klive"><i></i><b data-vw="' + esc(a.slug) + '">' + fmt(c.views) + '</b> membaca</span></div>' +
      '<div class="kart__storyrow"><button id="openStory" type="button" class="kart__story"><span class="pi">' + ICON.play + '</span><span class="tx">Lihat sebagai <b>Story</b></span></button><span class="kart__storyhint">45 detik · geser untuk lanjut</span></div></div></header>' +
      '<article class="kbody">' + (a.blocks || []).map(blockHTML).join("") +
      (a.sources && a.sources.length ? '<div class="ksrc"><h3>Sumber</h3><ol>' + a.sources.map(function (s) { return "<li>" + (s.u ? '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.a) + "</a>" : esc(s.a)) + "</li>"; }).join("") + "</ol></div>" : "") +
      '<div class="keng"><button data-like="' + esc(a.slug) + '"' + (c.liked ? ' class="liked"' : "") + '>' + ICON.heart + '<span data-lk="' + esc(a.slug) + '">' + fmt(c.likes) + '</span></button>' +
      '<button class="vw">' + ICON.eye + '<span data-vw="' + esc(a.slug) + '">' + fmt(c.views) + '</span></button>' +
      '<button data-sharebtn>' + ICON.share + '<span data-sh="' + esc(a.slug) + '">' + fmt(c.shares) + "</span></button></div></article>";
    $("#openStory").addEventListener("click", function () { openStory(a.slug); });
    $("[data-like]", root).addEventListener("click", function () { var liked = window.KE.like(a.slug); this.classList.toggle("liked", liked); });
    $("[data-sharebtn]", root).addEventListener("click", function () { openShare(a); });
    window.KE.view(a.slug);
    var prog = $(".kprog");
    if (prog) { var onS = function () { var h = document.documentElement; prog.style.width = Math.min(100, h.scrollTop / (h.scrollHeight - h.clientHeight || 1) * 100) + "%"; }; document.addEventListener("scroll", onS, { passive: true }); onS(); }
    if ("IntersectionObserver" in window) { var bio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("in"); }); }, { threshold: 0.3 }); $$(".kbars", root).forEach(function (b) { bio.observe(b); }); }
  }
  function blockHTML(b) {
    switch (b.t) {
      case "lead": return '<p class="lead">' + b.x + "</p>";
      case "p": return "<p>" + b.x + "</p>";
      case "h2": return "<h2>" + esc(b.x) + "</h2>";
      case "pull": return '<blockquote class="kpull">' + esc(b.x) + "</blockquote>";
      case "stat": return '<div class="kstat"><div class="n">' + esc(b.n) + '</div><div class="l">' + esc(b.l) + "</div>" + (b.s ? '<div class="s">' + esc(b.s) + "</div>" : "") + "</div>";
      case "bars": return '<div class="kbars">' + (b.h || []).map(function (h) { return '<i style="--h:' + h + '"></i>'; }).join("") + "</div>" + (b.cap ? '<div class="s" style="font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:6px">' + esc(b.cap) + "</div>" : "");
      default: return "";
    }
  }

  /* ============================ STORY MODE ============================ */
  var storyEl = null;
  function openStory(slug) {
    var a = window.__kGet(slug); if (!a) return;
    window.KE.story(slug); setMood(a.mood);
    if (!storyEl) { storyEl = document.createElement("div"); storyEl.className = "kstory"; document.body.appendChild(storyEl); }
    var scenes = a.story || [], av = (a.author || "R").charAt(0).toUpperCase();
    storyEl.innerHTML = '<div class="kstory__stage" style="--mood:' + esc(a.mood) + '"><div class="kstory__bg">' + (a.cover ? '<img src="' + esc(a.cover) + '" alt="">' : "") + "</div>" +
      '<div class="kstory__bars">' + scenes.map(function (_, i) { return "<i" + (i === 0 ? ' class="act"' : "") + "><b></b></i>"; }).join("") + "</div>" +
      '<div class="kstory__top"><span class="av">' + av + '</span><span>Glyiv Kabar · ' + esc(a.topic) + '</span><button class="kstory__x" aria-label="Tutup">×</button></div>' +
      '<div class="kstory__scenewrap"></div><div class="kstory__nav"><div class="prev"></div><div class="next"></div></div>' +
      '<button class="kstory__pause">❚❚ jeda</button><div class="kstory__share">' + sbtn("wa") + sbtn("x") + '<button data-net="gen" aria-label="Bagikan lainnya">' + ICON.share + "</button></div></div>";
    var stage = $(".kstory__stage", storyEl), wrap = $(".kstory__scenewrap", storyEl), bars = $$(".kstory__bars i", storyEl);
    var idx = 0, timer = null, paused = false, dur = 5200;
    function sceneHTML(s) {
      if (s.kind === "cover") return '<div class="kstory__scene cover"><div><span class="lab">Glyiv Kabar</span><h2>' + esc(s.title) + "</h2>" + (s.text ? "<p>" + esc(s.text) + "</p>" : "") + "</div></div>";
      if (s.kind === "hook") return '<div class="kstory__scene"><span class="lab">' + esc(a.topic) + "</span><h2>" + esc(s.title) + "</h2>" + (s.text ? "<p>" + esc(s.text) + "</p>" : "") + "</div>";
      if (s.kind === "stat") return '<div class="kstory__scene"><span class="lab">Angka</span><div class="big">' + esc(s.big) + "</div><p>" + esc(s.label || "") + "</p>" + (s.source ? '<div class="src">' + esc(s.source) + "</div>" : "") + "</div>";
      if (s.kind === "quote") return '<div class="kstory__scene quote"><h2>' + esc(s.text) + "”</h2></div>";
      if (s.kind === "end") return '<div class="kstory__scene"><span class="lab">Selesai</span><h2>' + esc(s.title) + "</h2>" + (s.text ? "<p>" + esc(s.text) + "</p>" : "") + '<a class="go" href="artikel.html?a=' + enc(a.slug) + '">Baca lengkap →</a></div>';
      return '<div class="kstory__scene"><span class="lab">' + esc(a.topic) + "</span><h2>" + esc(s.title || "") + "</h2>" + (s.text ? "<p>" + esc(s.text) + "</p>" : "") + "</div>";
    }
    function show(n) {
      if (n >= scenes.length) { close(); location.href = "artikel.html?a=" + enc(a.slug); return; }
      if (n < 0) n = 0; idx = n; wrap.innerHTML = sceneHTML(scenes[idx]);
      bars.forEach(function (b, i) { b.classList.remove("act", "done"); if (i < idx) b.classList.add("done"); if (i === idx && !paused) { b.style.setProperty("--sdur", dur + "ms"); void b.offsetWidth; b.classList.add("act"); } });
      schedule();
    }
    function schedule() { clearTimeout(timer); if (!paused) timer = setTimeout(function () { show(idx + 1); }, dur); }
    function close() { clearTimeout(timer); storyEl.classList.remove("on"); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); else if (e.key === "ArrowRight" || e.key === " ") show(idx + 1); else if (e.key === "ArrowLeft") show(idx - 1); }
    $(".kstory__x", storyEl).addEventListener("click", close);
    $(".kstory__nav .next", storyEl).addEventListener("click", function () { show(idx + 1); });
    $(".kstory__nav .prev", storyEl).addEventListener("click", function () { show(idx - 1); });
    var pb = $(".kstory__pause", storyEl);
    pb.addEventListener("click", function () { paused = !paused; pb.textContent = paused ? "▶ main" : "❚❚ jeda"; if (paused) clearTimeout(timer); else show(idx); });
    var tx = 0; stage.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); });
    $$(".kstory__share button", storyEl).forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); var net = b.dataset.net; if (net === "gen") openShare(a); else shareTo(net, a); }); });
    document.body.style.overflow = "hidden"; document.addEventListener("keydown", onKey); storyEl.classList.add("on"); show(0);
  }

  /* ============================ SHARE ============================ */
  function shareUrl(a) { return location.origin + "/lab/kabar/artikel.html?a=" + enc(a.slug); }
  function shareText(a) { return a.title + " — Glyiv Kabar"; }
  function sbtn(net) { return '<button data-net="' + net + '" aria-label="Bagikan ' + net + '">' + ssvg(net) + "</button>"; }
  function shareTo(net, a) {
    var u = enc(shareUrl(a)), t = enc(shareText(a));
    var map = { x: "https://twitter.com/intent/tweet?text=" + t + "&url=" + u, fb: "https://www.facebook.com/sharer/sharer.php?u=" + u, li: "https://www.linkedin.com/sharing/share-offsite/?url=" + u, wa: "https://wa.me/?text=" + t + "%20" + u };
    if (net === "ig") { if (navigator.clipboard) navigator.clipboard.writeText(shareUrl(a)); toast("Tautan disalin — tempel di Instagram Story/bio"); window.KE.share(a.slug); return; }
    if (net === "native" && navigator.share) { navigator.share({ title: a.title, text: shareText(a), url: shareUrl(a) }).then(function () { window.KE.share(a.slug); }).catch(function () {}); return; }
    if (map[net]) { window.open(map[net], "_blank", "noopener,width=620,height=560"); window.KE.share(a.slug); }
  }
  var shareEl = null;
  function openShare(a) {
    if (!shareEl) { shareEl = document.createElement("div"); shareEl.className = "kshare"; document.body.appendChild(shareEl); shareEl.addEventListener("click", function (e) { if (e.target === shareEl) shareEl.classList.remove("on"); }); }
    var nets = [["x", "X", "#0f1419"], ["fb", "Facebook", "#1877f2"], ["li", "LinkedIn", "#0a66c2"], ["wa", "WhatsApp", "#25d366"], ["ig", "Instagram", "linear-gradient(45deg,#f09433,#dc2743,#bc1888)"]];
    shareEl.innerHTML = '<div class="kshare__panel"><h4>Bagikan artikel</h4><p class="sub">Sebarkan ke jaringanmu — atau salin tautannya.</p>' +
      '<div class="kshare__row">' + nets.map(function (n) { return '<button class="kshare__btn" data-net="' + n[0] + '"><span class="ic" style="background:' + n[2] + '">' + ssvg(n[0]) + "</span>" + n[1] + "</button>"; }).join("") + "</div>" +
      '<div class="kshare__copy"><input readonly value="' + esc(shareUrl(a)) + '"><button data-copy>Salin</button></div>' +
      (navigator.share ? '<button data-net="native" style="width:100%;margin-top:12px;background:var(--paper2);border:1px solid var(--hair);border-radius:12px;padding:12px;font-weight:700;color:var(--pine);cursor:pointer">Bagikan via perangkat…</button>' : "") + "</div>";
    $$("[data-net]", shareEl).forEach(function (b) { b.addEventListener("click", function () { shareTo(b.dataset.net, a); if (b.dataset.net !== "ig") shareEl.classList.remove("on"); }); });
    $("[data-copy]", shareEl).addEventListener("click", function () { if (navigator.clipboard) navigator.clipboard.writeText(shareUrl(a)); toast("Tautan disalin ✓"); window.KE.share(a.slug); });
    shareEl.classList.add("on");
  }
  function ssvg(n) {
    var s = {
      x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7 8.1L23 22h-6.5l-5-6.5L5.7 22H2.5l7.5-8.6L2 2h6.6l4.6 6zM17 20h1.7L7 4H5.3z"/></svg>',
      fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 22v-9h3l.5-3.5H13V7.3c0-1 .3-1.7 1.8-1.7H17V2.4C16.6 2.3 15.4 2.2 14 2.2c-3 0-5 1.8-5 5.1v2.2H6V13h3v9z"/></svg>',
      li: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 3.5A2 2 0 1 1 4 7a2 2 0 0 1 .5-3.5zM3 9h3v12H3zM9 9h3v1.7c.5-.9 1.7-1.9 3.5-1.9 3 0 4.5 2 4.5 5.4V21h-3v-6c0-1.7-.6-2.8-2.1-2.8-1.2 0-1.9.8-2.2 1.6V21H9z"/></svg>',
      wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.9-2.7-1.2-4.4-4-4.5-4.2-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.5c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l2 .9c.2.1.4.2.4.3.1.2.1.7-.1 1.3z"/></svg>',
      ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    };
    return s[n] || "";
  }
  var toastT;
  function toast(m) { var t = $(".ktoast"); if (!t) { t = document.createElement("div"); t.className = "ktoast"; t.style.cssText = "position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);background:var(--pine);color:#fff;padding:12px 18px;border-radius:12px;font-size:13.5px;z-index:140;box-shadow:var(--sh3);opacity:0;transition:.25s"; document.body.appendChild(t); } t.textContent = m; requestAnimationFrame(function () { t.style.opacity = "1"; t.style.transform = "translateX(-50%) translateY(0)"; }); clearTimeout(toastT); toastT = setTimeout(function () { t.style.opacity = "0"; t.style.transform = "translateX(-50%) translateY(20px)"; }, 2400); }

  var nav = $(".knav"); if (nav) addEventListener("scroll", function () { nav.classList.toggle("scr", scrollY > 8); }, { passive: true });
  window.openStory = openStory;
  if ("IntersectionObserver" in window) { var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } }); }, { threshold: 0.1 }); $$("[data-r]").forEach(function (el) { rio.observe(el); }); }
  else $$("[data-r]").forEach(function (el) { el.classList.add("in"); });

  initFeed();
  initArticle();
})();
