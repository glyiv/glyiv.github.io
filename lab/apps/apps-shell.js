/* GLYIV APPS SHELL — injects the shared nav + footer into <div id="ga-nav">/<div id="ga-foot">,
   and exposes window.GA helpers (toast, light line-chart, agentic/on-chain feed, formatters).
   Load BEFORE /assets/js/glyiv-nav.js. */
(function () {
  "use strict";
  var NAV = '<header class="lnav" data-solid><div class="lnav__in">' +
    '<a class="lbrand" href="/"><svg viewBox="0 0 24 24" fill="none"><path d="M20 4C20 4 8 4 5 12c-2.2 5.9 1.4 8 1.4 8s2.1 3.6 8-.6C21 16 20 4 20 4Z" fill="#33d188"/><path d="M6.4 20C8 14 12.5 9.5 17 7" stroke="#0a2a1d" stroke-width="1.5" stroke-linecap="round"/></svg><b>Gl<i>yiv</i></b></a>' +
    '<nav class="lnav__links">' +
      '<div class="ldrop ldrop--mega"><button class="ldrop__btn">Ekosistem <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg></button><div class="ldrop__menu">' +
        '<div class="ldrop__grp"><h4>Inti platform</h4><a href="/lab/carbon-intelligence.html"><b>Carbon Intelligence</b><small>Ukur \\u00b7 verifikasi \\u00b7 offset</small></a><a href="/lab/tree.html"><b>Glyiv Aset</b><small>Pohon &amp; lahan (RWA)</small></a><a href="/lab/apps/kebun/"><b>Kebun Virtual</b><small>Rawat pohonmu, panen imbalan</small></a><a href="/lab/outlet.html"><b>Glyiv Outlet</b><small>POS berdata karbon</small></a></div>' +
        '<div class="ldrop__grp"><h4>Ekonomi hijau</h4><a href="/lab/ekosistem/pasar.html"><b>Glyiv Pasar</b><small>Marketplace</small></a><a href="/lab/ekosistem/pangan.html"><b>Glyiv Pangan</b><small>Hub pangan berdata karbon</small></a><a href="/lab/ekosistem/dompet.html"><b>Glyiv Dompet</b><small>Carbon wallet</small></a><a href="/lab/ekosistem/dana.html"><b>Glyiv Dana</b><small>Investasi hijau</small></a><a href="/lab/ekosistem/bank-sampah.html"><b>Bank Sampah</b><small>Sampah jadi imbalan</small></a></div>' +
        '<div class="ldrop__grp"><h4>Gaya hidup</h4><a href="/lab/ekosistem/iot.html"><b>Glyiv IoT</b><small>Rumah pintar &amp; trash-bin</small></a><a href="/lab/ekosistem/sehat.html"><b>Glyiv Sehat</b><small>Habit sehat &amp; hijau</small></a><a href="/lab/ekosistem/belajar.html"><b>Glyiv Belajar</b><small>Literasi &amp; game</small></a></div>' +
        '<div class="ldrop__grp"><h4>Riset &amp; alat</h4><a href="/lab/ekosistem/lab-rnd.html"><b>Glyiv Lab</b><small>Material rendah-karbon</small></a><a href="/lab/apps/scanner/"><b>Scan Karbon</b><small>Foto item \\u2192 estimasi</small></a><a href="/lab/kalkulator.html"><b>Kalkulator Karbon</b><small>Individu &amp; per-item</small></a></div>' +
        '<div class="ldrop__mega-foot"><span>Business tree tumbuh bertahap \\u00b7 Live &amp; Roadmap</span><a href="/lab/apps/">Lihat semua aplikasi &rarr;</a></div>' +
      '</div></div>' +
      '<div class="ldrop"><button class="ldrop__btn">Solusi <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg></button><div class="ldrop__menu">' +
        '<div class="ldrop__grp"><h4>Keuangan</h4><a href="/lab/industri/bank-lembaga-keuangan.html">Bank &amp; Lembaga Keuangan</a><a href="/lab/industri/investor-aset-manajemen.html">Investor &amp; Aset Manajemen</a></div>' +
        '<div class="ldrop__grp"><h4>Industri Berat</h4><a href="/lab/industri/tambang-dan-logam.html">Tambang &amp; Logam</a><a href="/lab/industri/konstruksi-dan-semen.html">Konstruksi &amp; Semen</a><a href="/lab/industri/manufaktur.html">Manufaktur</a></div>' +
        '<div class="ldrop__grp"><h4>Operasional</h4><a href="/lab/industri/sawit-agri.html">Sawit &amp; Agribisnis</a><a href="/lab/industri/logistik-transport.html">Logistik &amp; Transport</a><a href="/lab/industri/fnb-ritel.html">F&amp;B &amp; Ritel</a><a href="/lab/industri/retailer.html">Retailer (Toko/UMKM)</a></div>' +
        '<div class="ldrop__grp"><h4>Publik &amp; Teknologi</h4><a href="/lab/industri/rumah-sakit.html">Rumah Sakit</a><a href="/lab/industri/data-center.html">Data Center</a><a href="/lab/industri/pemerintah.html">Pemerintah</a></div>' +
      '</div></div>' +
      '<a href="/lab/kabar/index.html">Kabar</a><a href="/lab/landing/index.html" class="lnav__admin">Landing</a>' +
      '<div class="ldrop ldrop--r"><button class="ldrop__btn">Perusahaan <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg></button><div class="ldrop__menu">' +
        '<div class="ldrop__grp"><h4>Glyiv</h4><a href="/visi-misi.html">Visi &amp; Misi</a><a href="/team.html">Tim &amp; Manifesto</a><a href="/lab/kabar/index.html">Kabar</a></div>' +
        '<div class="ldrop__grp"><h4>Induk perusahaan</h4><a href="/wosu/index.html">PT WOSU Innovation Technology<small>Perusahaan induk</small></a></div>' +
      '</div></div>' +
    '</nav>' +
    '<span class="lnav__sp"></span>' +
    '<a class="lnav__cta" href="/#gabung">Gabung</a>' +
    '<button class="lnav__burger" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>' +
    '</div></header>';

  var FOOT = '<footer class="lfoot"><div class="lwrap"><div class="lfoot__grid">' +
    '<div><a class="lbrand" href="/"><b>Gl<i>yiv</i></b></a>' +
    '<p class="lfoot__about">Platform ekonomi hijau dengan fondasi intelijen karbon. Aset, marketplace, wallet, IoT, dan lainnya — tumbuh bertahap.</p></div>' +
    '<div><h4>Ekosistem</h4><a href="/lab/tree.html">Glyiv Aset</a><a href="/lab/outlet.html">Glyiv Outlet</a><a href="/lab/apps/">Semua aplikasi</a></div>' +
    '<div><h4>Platform</h4><a href="/#platform">Carbon Accounting</a><a href="/#tour">Cara Kerja</a><a href="/#ekosistem">Ekosistem</a></div>' +
    '<div><h4>Perusahaan</h4><a href="/team.html">Tim</a><a href="/wosu/index.html">PT WOSU</a><a href="/#komunitas">Komunitas</a></div>' +
    '</div><div class="lfoot__legal"><span>© <span data-yr>2026</span> Glyiv</span><span>Produk dari <a href="/wosu/index.html" style="color:#8affc1">PT WOSU Innovation Technology</a> &middot; pratinjau produk &middot; angka ilustrasi</span></div></div></footer>';

  function mount(id, html) { var el = document.getElementById(id); if (el) el.outerHTML = html; }
  mount("ga-nav", NAV);
  mount("ga-foot", FOOT);
  var yr = document.querySelector("[data-yr]"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---- helpers ---- */
  var GA = {};
  GA.$ = function (s, r) { return (r || document).querySelector(s); };
  GA.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  GA.rnd = function (a, b) { return a + Math.random() * (b - a); };
  GA.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  GA.fmt = function (n) { return Math.round(n).toLocaleString("id-ID"); };
  GA.money = function (n) { return "Rp" + Math.round(n).toLocaleString("id-ID"); };
  GA.short = function () { var h = "0123456789abcdef", s = "0x"; for (var i = 0; i < 8; i++) s += h[Math.floor(Math.random() * 16)]; return s + "…" + h[Math.floor(Math.random() * 16)] + h[Math.floor(Math.random() * 16)] + h[Math.floor(Math.random() * 16)] + h[Math.floor(Math.random() * 16)]; };
  var toastT;
  GA.toast = function (m) { var t = GA.$(".ga-toast"); if (!t) { t = document.createElement("div"); t.className = "ga-toast"; document.body.appendChild(t); } t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2400); };

  // light line/area chart
  GA.lineChart = function (cv, data, opt) {
    if (!cv) return; opt = opt || {};
    var ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
    var w = cv.clientWidth, h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    var max = Math.max.apply(null, data), min = Math.min.apply(null, data), pad = 10, col = opt.color || "#1F7A6B";
    ctx.strokeStyle = "rgba(15,46,34,.07)"; ctx.lineWidth = 1;
    for (var g = 1; g < 4; g++) { var yy = pad + (h - 2 * pad) * g / 4; ctx.beginPath(); ctx.moveTo(pad, yy); ctx.lineTo(w - pad, yy); ctx.stroke(); }
    ctx.beginPath(); data.forEach(function (v, i) { var x = pad + (w - 2 * pad) * i / (data.length - 1), y = h - pad - (h - 2 * pad) * (v - min) / (max - min || 1); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke();
    if (opt.fill !== false) { ctx.lineTo(w - pad, h - pad); ctx.lineTo(pad, h - pad); ctx.closePath(); var fg = ctx.createLinearGradient(0, 0, 0, h); fg.addColorStop(0, opt.fillCol || "rgba(31,122,107,.16)"); fg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = fg; ctx.fill(); }
    var lx = w - pad, ly = h - pad - (h - 2 * pad) * (data[data.length - 1] - min) / (max - min || 1); ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
  };
  // vertical bars
  GA.barChart = function (cv, data, opt) {
    if (!cv) return; opt = opt || {};
    var ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
    var w = cv.clientWidth, h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    var max = Math.max.apply(null, data), pad = 8, bw = (w - 2 * pad) / data.length * 0.62, gap = (w - 2 * pad) / data.length;
    data.forEach(function (v, i) { var bh = (h - 2 * pad) * v / (max || 1), x = pad + i * gap + (gap - bw) / 2, y = h - pad - bh; var gr = ctx.createLinearGradient(0, y, 0, h - pad); gr.addColorStop(0, opt.color || "#1F7A6B"); gr.addColorStop(1, "#8fd9bf"); ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, bw, bh, 3) : ctx.rect(x, y, bw, bh); ctx.fill(); });
  };
  // agentic / on-chain feed manager bound to a host selector
  GA.makeFeed = function (hostSel, seed) {
    var host = GA.$(hostSel), items = [];
    function render() { host.innerHTML = items.map(function (f) { var cls = f.kind || "chain"; var lbl = { ai: "Agen AI", chain: "On-chain", sat: "Satelit", iot: "IoT" }[cls] || "On-chain"; return '<div class="ga-line"><span class="ga-tagx ' + cls + '">' + lbl + '</span><div class="ga-tx"><b>' + f.title + '</b><small>' + f.sub + '</small></div></div>'; }).join(""); }
    var api = { push: function (kind, title, sub) { items.unshift({ kind: kind, title: title, sub: sub }); if (items.length > 7) items.pop(); render(); } };
    (seed || []).forEach(function (s) { api.push(s[0], s[1], s[2]); });
    return api;
  };
  /* reveal-on-scroll — adds .is-in to [data-reveal]/.img-reveal (see lab.css).
     Story/ecosystem pages load this shell but not glyiv.js, so without this their
     hero + sections stay at opacity:0. Stagger (data-d) is handled in CSS. */
  (function () {
    var els = GA.$$("[data-reveal], .img-reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  })();

  window.GA = GA;
})();
