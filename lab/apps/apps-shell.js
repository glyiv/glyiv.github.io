/* GLYIV APPS SHELL — injects the shared nav + footer into <div id="ga-nav">/<div id="ga-foot">,
   and exposes window.GA helpers (toast, light line-chart, agentic/on-chain feed, formatters).
   Load BEFORE /assets/js/glyiv-nav.js. */
(function () {
  "use strict";
  var NAV = '<header class="lnav" data-solid><div class="lnav__in">' +
    /* ⚠︎ Lambang WAJIB `/logo.svg` — aset resmi (Glyiv Pendant), bukan SVG sebaris.
       Berkas ini menyuntik nav+kaki ke 29 halaman, jadi satu kunci merek yang salah
       di sini muncul 29 kali; ronde penyeragaman lambang menyisir *.html dan tidak
       melihat yang di dalam string JS ini. Markup ini SAMA PERSIS dengan 42 kunci
       merek di 25 berkas HTML lain supaya ukuran & jarak
       datang dari CSS yang sudah ada — glyiv-nav.css:67 mengunci 28×28 px dan
       .lbrand{gap:9px}; jangan tulis ulang nilainya di sini. */
    '<a class="lbrand" href="/"><img src="/logo.svg" width="28" height="28" alt="" class="lbrand__mark"><b>Gl<i>yiv</i></b></a>' +
    '<span class="lnav__tag">Your Green Industry Intelligence Platform</span>' +
    '<nav class="lnav__links">' +
      '<div class="ldrop ldrop--mega"><button class="ldrop__btn">Ekosistem <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg></button><div class="ldrop__menu">' +
        '<div class="ldrop__grp"><h4>Inti platform</h4><a href="/lab/green-intelligence.html"><b>Green Intelligence</b><small>Lacak &middot; hitung &middot; offset</small></a><a href="/lab/tree.html"><b>Glyiv Green Assets</b><small>Pohon &amp; lahan (RWA)</small></a><a href="/lab/apps/kebun/"><b>Kebun Virtual</b><small>Rawat pohonmu, panen imbalan</small></a><a href="/lab/outlet.html"><b>Glyiv Outlet</b><small>POS berdata karbon</small></a></div>' +
        '<div class="ldrop__grp"><h4>Ekonomi hijau</h4><a href="/lab/ekosistem/pasar.html"><b>Glyiv Pasar</b><small>Marketplace</small></a><a href="/lab/ekosistem/pangan.html"><b>Glyiv Pangan</b><small>Hub pangan berdata karbon</small></a><a href="/lab/ekosistem/dana.html"><b>Glyiv Dana</b><small>Investasi hijau</small></a><a href="/lab/ekosistem/bank-sampah.html"><b>Bank Sampah</b><small>Setor di titik komunitas</small></a><a href="/lab/ekosistem/recycle.html"><b>Glyiv Recycle</b><small>Komposter &amp; jemput terjadwal</small></a></div>' +
        '<div class="ldrop__grp"><h4>Gaya hidup</h4><a href="/lab/ekosistem/saku.html"><b>Glyiv Pocket</b><small>Scan &amp; catat harian &middot; sudah jalan</small></a><a href="/lab/ekosistem/iot.html"><b>Glyiv IoT</b><small>Rumah pintar &amp; trash-bin</small></a><a href="/lab/ekosistem/sehat.html"><b>Glyiv Sehat</b><small>Habit sehat &amp; hijau</small></a><a href="/lab/ekosistem/belajar.html"><b>Glyiv Belajar</b><small>Literasi &amp; game</small></a></div>' +
        '<div class="ldrop__grp"><h4>Riset &amp; alat</h4><a href="/lab/ekosistem/lab-rnd.html"><b>Glyiv Lab</b><small>Material rendah-karbon</small></a><a href="/lab/kalkulator.html"><b>Kalkulator Karbon</b><small>Individu &amp; per-item</small></a><a href="/download.html"><b>Unduh Aplikasi</b><small>APK Android &middot; di luar Play Store</small></a></div>' +
        '<div class="ldrop__mega-foot"><span>Business tree tumbuh bertahap &middot; Live &amp; Roadmap</span><a href="/lab/apps/">Lihat semua aplikasi &rarr;</a></div>' +
      '</div></div>' +
      '<div class="ldrop"><button class="ldrop__btn">Solusi <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg></button><div class="ldrop__menu">' +
        '<div class="ldrop__grp"><h4>Keuangan</h4><a href="/lab/industri/bank-lembaga-keuangan.html">Bank &amp; Lembaga Keuangan</a><a href="/lab/industri/investor-aset-manajemen.html">Investor &amp; Aset Manajemen</a></div>' +
        '<div class="ldrop__grp"><h4>Industri Berat</h4><a href="/lab/industri/tambang-dan-logam.html">Tambang &amp; Logam</a><a href="/lab/industri/konstruksi-dan-semen.html">Konstruksi &amp; Semen</a><a href="/lab/industri/manufaktur.html">Manufaktur</a></div>' +
        '<div class="ldrop__grp"><h4>Operasional</h4><a href="/lab/industri/sawit-agri.html">Sawit &amp; Agribisnis</a><a href="/lab/industri/logistik-transport.html">Logistik &amp; Transport</a><a href="/lab/industri/fnb-ritel.html">F&amp;B &amp; Ritel</a><a href="/lab/industri/retailer.html">Retailer (Toko/UMKM)</a></div>' +
        '<div class="ldrop__grp"><h4>Publik &amp; Teknologi</h4><a href="/lab/industri/rumah-sakit.html">Rumah Sakit</a><a href="/lab/industri/data-center.html">Data Center</a><a href="/lab/industri/pemerintah.html">Pemerintah</a></div>' +
      '</div></div>' +
      '<a href="/lab/kabar/index.html">Kabar</a><a href="/download.html">Store</a><a href="/lab/landing/index.html" class="lnav__admin">Landing</a>' +
      '<div class="ldrop ldrop--r"><button class="ldrop__btn">Perusahaan <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg></button><div class="ldrop__menu">' +
        '<div class="ldrop__grp"><h4>Glyiv</h4><a href="/visi-misi.html">Visi &amp; Misi</a><a href="/team.html">Tim &amp; Manifesto</a><a href="/lab/kabar/index.html">Kabar</a></div>' +
        /* Pintu masuk PT WOSU di laci "Perusahaan" DICABUT atas permintaan pemilik;
           /wosu tetap ada dan tetap tertaut dari kaki halaman. Sama persis dengan
           25 salinan navbar di dist/*.html. */
      '</div></div>' +
    '</nav>' +
    '<span class="lnav__sp"></span>' +
    '<a class="lnav__cta" href="/auth">Login</a>' +
    '<button class="lnav__burger" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>' +
    '</div></header>';

  var FOOT = '<footer class="lfoot"><div class="lwrap"><div class="lfoot__grid">' +
    /* Kunci merek kaki halaman: markup identik dengan bilah atas — itu memang yang
       diandalkan lab.css:433 (`.lfoot a:not(.lbrand)`) — pengecualian itu menjaga
       merek tetap mewarisi flex+gap bilah atas dan tidak jatuh ke dua baris, dan
       lab.css:439 membatasi lebarnya ke `max-content` demi target sentuh. */
    '<div><a class="lbrand" href="/"><img src="/logo.svg" width="28" height="28" alt="" class="lbrand__mark"><b>Gl<i>yiv</i></b></a>' +
    '<p class="lfoot__about">Platform ekonomi hijau dengan fondasi intelijen karbon. Aset, marketplace, wallet, IoT, dan lainnya — tumbuh bertahap.</p>' +
    '<div class="lfoot__sos" data-i18n-skip="sosial"><a class="lsos" href="https://www.instagram.com/glyiv.io" target="_blank" rel="noopener noreferrer" aria-label="Instagram Glyiv" title="Instagram"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a><a class="lsos" href="https://www.tiktok.com/@glyiv.io" target="_blank" rel="noopener noreferrer" aria-label="TikTok Glyiv" title="TikTok"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M16 3c.3 2 1.5 3.6 3.5 4v3c-1.4 0-2.7-.4-3.8-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3.1a2.5 2.5 0 1 0 1.7 2.4V3H16z"/></svg></a><a class="lsos" href="https://www.youtube.com/@glyiv_io" target="_blank" rel="noopener noreferrer" aria-label="YouTube Glyiv" title="YouTube"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor"/></svg></a><a class="lsos" href="https://x.com/glyiv_io" target="_blank" rel="noopener noreferrer" aria-label="X Glyiv" title="X"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M4 4l7.6 9.8L4.4 20h2.1l6-6.5L17 20h3l-8-10.3L19.4 4h-2.1l-5.6 6.1L7 4H4z"/></svg></a><a class="lsos" href="https://www.facebook.com/profile.php?id=61592151959052" target="_blank" rel="noopener noreferrer" aria-label="Facebook Glyiv" title="Facebook"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.2c0-.9.3-1.5 1.5-1.5h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.8v3h2.2v8h3.5z"/></svg></a><a class="lsos" href="https://www.linkedin.com/company/glyivio/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Glyiv" title="LinkedIn"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M4.5 3.5A2 2 0 1 1 4 7a2 2 0 0 1 .5-3.5zM3 9h3v12H3zM9 9h3v1.7c.5-.9 1.7-1.9 3.5-1.9 3 0 4.5 2 4.5 5.4V21h-3v-6c0-1.7-.6-2.8-2.1-2.8-1.2 0-1.9.8-2.2 1.6-.1.3-.1.7-.1 1V21H9z"/></svg></a></div>' +
    '</div>' +
    '<div><h4>Ekosistem</h4><a href="/lab/tree.html">Glyiv Green Assets</a><a href="/lab/outlet.html">Glyiv Outlet</a><a href="/lab/ekosistem/saku.html">Glyiv Pocket</a><a href="/lab/apps/">Semua aplikasi</a><a href="/download.html">Unduh aplikasi Android</a></div>' +
    '<div><h4>Platform</h4><a href="/lab/green-intelligence.html#platform">Carbon Accounting</a><a href="/lab/green-intelligence.html#tour">Cara Kerja</a><a href="/#ekosistem">Ekosistem</a></div>' +
    '<div><h4>Perusahaan</h4><a href="/team.html">Tim</a><a href="/wosu/index.html">PT WOSU</a><a href="/lab/green-intelligence.html#komunitas">Komunitas</a>' +
    /* ⛔ DOKUMEN HUKUM WAJIB TERJANGKAU DARI SETIAP HALAMAN. Dua alasan yang
       keduanya nyata: (a) Play Store menuntut URL kebijakan privasi yang bisa
       dibuka publik tanpa masuk; (b) rekaman persetujuan outlet menyimpan nomor
       versi dokumen ini, dan persetujuan yang menunjuk ke halaman yang sulit
       ditemukan tidak berarti apa-apa. */
    '<a href="/ketentuan.html">Ketentuan Layanan</a><a href="/privasi.html">Kebijakan Privasi</a></div>' +
    '</div><div class="lfoot__legal"><span>© <span data-yr>2026</span> Glyiv</span>' +
    '<span><a href="/ketentuan.html" style="color:#8affc1">Ketentuan Layanan</a> &middot; <a href="/privasi.html" style="color:#8affc1">Kebijakan Privasi</a></span>' +
    '<span>Produk dari <a href="/wosu/index.html" style="color:#8affc1">PT WOSU Innovation Technology</a> &middot; pratinjau produk &middot; angka ilustrasi</span></div></div></footer>';

  /* ⛔ SATU BARIS INI DULU MENINGGALKAN NAVBAR & FOOTER DI DOM SELAMANYA.

     Versi lamanya berbunyi `el.outerHTML = html`, dan itu MENGGANTI elemen
     penampung yang dibuat React dengan simpul baru hasil parse string. Simpul
     baru itu tidak punya kunci fiber (`__reactFiber$…`), jadi React tidak
     mengenalinya sama sekali. Saat rutenya dilepas, React memanggil
     `removeChild` pada PENAMPUNG — yang sudah tidak ada di DOM — sehingga
     navbar dan footer penggantinya tidak pernah ikut terlepas.

     Terukur di halaman live, dari /app-store menekan lambang merek ke "/":
       anak #root : HEADER.lnav · FOOTER.lfoot · STYLE · DIV.gv-bg-root ·
                    HEADER.lnav · SECTION.vhero · … · FOOTER.lfoot · DIV.lstick
       navbar LAMA (Inggris) menumpuk navbar BARU (Indonesia) → label dobel,
       dan footer lama berdiri di y=0 sementara hero halaman baru di y=435.
     Itulah "footernya tiba-tiba di atas" yang pemilik laporkan dua ronde
     berturut-turut — dan yang dua kali salah saya duga sebagai cacat gulir.
     Kunci yang membedakannya: simpul yang tertinggal TIDAK punya kunci fiber,
     sementara simpul halaman baru punya. React tidak kehilangan simpulnya;
     simpulnya yang dicabut dari bawah kaki React.

     ⛔ JANGAN mengembalikan `outerHTML` di sini, dan jangan memakainya pada
     elemen mana pun yang dibuat React. Yang benar: isi PENAMPUNGNYA. React
     tetap memiliki penampung itu, jadi ia melepasnya berikut seluruh isinya.
     `.lnav` `position:fixed` dan `.lfoot` blok biasa — keduanya tidak
     terpengaruh oleh satu pembungkus tambahan (diperiksa: nol selektor CSS
     yang menuntut keduanya jadi anak LANGSUNG dari induknya).

     Penjaga `innerHTML.trim()`: skrip ini bisa dijalankan dua kali dalam satu
     sesi SPA (halaman yang sama dibuka lagi), dan tanpa penjaga itu navbar
     kedua akan disuntikkan ke dalam penampung yang sama. */
  function mount(id, html) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.innerHTML.trim()) return;
    el.innerHTML = html;
  }
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
