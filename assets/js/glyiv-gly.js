/* GLYIV — "Gly" assistant (classic, self-contained). Loaded site-wide by glyiv-nav.js.
   Skips pages that already carry their own chat widget (homepage Liv / Kabar bot).
   Context-aware: sends the current page's title + heading + path to the LLM so answers
   fit the page. Uses the deployed Groq proxy; falls back to canned replies offline.
   Honest posture + carbon-platform positioning (no "kasir/kafe"). */
(function () {
  "use strict";
  if (window.__glyivGly) return;
  // don't double-up where a page already has a Gly/Liv widget
  if (document.getElementById("gvChat") || document.getElementById("livLauncher") ||
      document.getElementById("glyChat") || document.querySelector(".liv-fab")) return;
  window.__glyivGly = true;

  var PROXY = (window.GLYIV_CHAT_PROXY || "https://glyiv-chat.archourium.workers.dev").trim();
  var MODEL = "llama-3.3-70b-versatile";

  /* ---- page context (makes Gly aware of where the user is) ---- */
  function pageContext() {
    var h1 = document.querySelector("h1, .lh1, .kart__cover h1");
    var kicker = document.querySelector(".lkick, .vhero__eyebrow, .kkick, .ga-crumb");
    var desc = document.querySelector('meta[name="description"]');
    var parts = [];
    parts.push('Judul: "' + (document.title || "Glyiv").replace(/\s*[—|].*$/, "").trim() + '"');
    if (h1) parts.push('Heading: "' + h1.textContent.trim().slice(0, 120) + '"');
    if (kicker) parts.push('Bagian: "' + kicker.textContent.trim().slice(0, 60) + '"');
    if (desc && desc.content) parts.push("Ringkasan: " + desc.content.slice(0, 220));
    parts.push("URL: " + location.pathname);
    return parts.join(" · ");
  }
  function sysPrompt() {
    return 'Kamu adalah "Gly", asisten AI dari Glyiv — Carbon Intelligence & Offset Platform kelas enterprise untuk Indonesia (produk PT WOSU Innovation Technology).\n' +
      'Gaya: Bahasa Indonesia santai tapi kredibel, ringkas (2-4 kalimat), ramah ke konsumen maupun enterprise/investor. Boleh 1 emoji sesekali. Jangan bertele-tele.\n' +
      'Yang HARUS kamu tahu:\n' +
      '- Tiga lapisan: Ukur → Verifikasi → Offset. Dua wajah satu sistem: konsumen = "Platform Ekonomi Hijau" (tagline "Hidup hijau, imbalan nyata."); enterprise = "Carbon Intelligence".\n' +
      '- Mengukur emisi dari aktivitas nyata: activity-based/process-LCA (resep × faktor emisi) + fallback spend-based EEIO (EXIOBASE). Library faktor: ecoinvent, Poore & Nemecek 2018, ADEME Agribalyse, DEFRA, IPCC.\n' +
      '- Ekosistem 12 business tree: Carbon Intelligence, Glyiv Aset (pohon/lahan RWA), Glyiv Outlet (POS/titik bayar berdata karbon), Glyiv Pasar (marketplace), Glyiv Pangan (hub pangan: label kalori+emisi+tebus), Glyiv Dompet (carbon wallet), Glyiv IoT, Glyiv Dana, Bank Sampah, Glyiv Sehat, Glyiv Belajar, Glyiv Lab/RnD; + alat konsumen (Scan Karbon, Kalkulator) & Kabar (media).\n' +
      '- Web3: aset hijau token RWA ERC-3643 (permissioned, KYC on-chain); oracle & DePIN (sensor/foto-GPS, satelit masa depan); anti double-counting.\n' +
      '- Pendorong regulasi: EU CBAM (fase bayar 1 Jan 2026), IFRS S2/ISSB, POJK, IDXCarbon.\n' +
      'POSTUR JUJUR (WAJIB): klaim "kontribusi", BUKAN "netral karbon"; "terlacak", bukan "terukur"; sertifikasi/MRV masih dalam roadmap. Jangan mengarang angka. Jangan menyebut kamu LLM/model/Groq. JANGAN pakai kata "kasir"/"kafe" — gunakan "outlet"/"titik bayar".\n' +
      'KONTEKS HALAMAN SAAT INI → ' + pageContext() + '\nKaitkan jawaban ke konteks halaman ini bila relevan; kalau ditanya di luar Glyiv, arahkan balik dengan ramah.';
  }

  /* ---- styles ---- */
  var css = document.createElement("style");
  css.textContent =
    "#gly-fab{position:fixed;right:20px;bottom:20px;z-index:120;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:linear-gradient(145deg,#1f7a6b,#0f2e22);box-shadow:0 12px 30px -8px rgba(15,46,34,.5);display:grid;place-items:center;transition:transform .2s,box-shadow .2s;-webkit-tap-highlight-color:transparent}" +
    "#gly-fab:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 18px 40px -10px rgba(15,46,34,.6)}" +
    "#gly-fab canvas{position:absolute;inset:0;width:100%;height:100%;border-radius:50%;z-index:1}" +
    "#gly-fab .gly-fallback{position:relative;z-index:1;display:grid;place-items:center}" +
    "#gly-fab .gly-fallback svg{width:30px;height:30px}" +
    "body.webgl-on #gly-fab .gly-fallback{display:none}" +
    "#gly-fab .pg{position:absolute;inset:-4px;border-radius:50%;border:2px solid #33d188;opacity:.5;animation:glyping 2.8s cubic-bezier(.22,1,.36,1) infinite;z-index:2}" +
    "@keyframes glyping{0%{transform:scale(.85);opacity:.5}70%,100%{transform:scale(1.45);opacity:0}}" +
    "#gly-fab .tip{position:absolute;right:70px;bottom:12px;white-space:nowrap;background:#0F2E22;color:#fff;font:600 12px 'Hanken Grotesk',system-ui,sans-serif;padding:7px 12px;border-radius:10px;opacity:0;transform:translateX(6px);transition:.2s;pointer-events:none}" +
    "#gly-fab:hover .tip{opacity:1;transform:none}" +
    "#gly-panel{position:fixed;right:20px;bottom:20px;z-index:121;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 40px));background:#fff;border:1px solid #E6EAE6;border-radius:20px;box-shadow:0 30px 80px -24px rgba(15,46,34,.4);display:none;flex-direction:column;overflow:hidden;font-family:'Hanken Grotesk',system-ui,sans-serif}" +
    "#gly-panel.on{display:flex;animation:glyup .28s cubic-bezier(.22,1,.36,1)}" +
    "@keyframes glyup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}" +
    ".gly-hd{display:flex;align-items:center;gap:11px;padding:15px 16px;background:linear-gradient(145deg,#123c2c,#0f2e22);color:#fff}" +
    ".gly-hd .av{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.14);display:grid;place-items:center;flex:0 0 auto}" +
    ".gly-hd .av svg{width:20px;height:20px}" +
    ".gly-hd b{font-family:'Newsreader',Georgia,serif;font-weight:600;font-size:16px;line-height:1}" +
    ".gly-hd small{display:block;font:600 9px 'IBM Plex Mono',monospace;letter-spacing:.1em;color:#8affc1;margin-top:3px}" +
    ".gly-hd .x{margin-left:auto;background:rgba(255,255,255,.14);border:0;color:#fff;width:30px;height:30px;border-radius:9px;font-size:17px;cursor:pointer;line-height:1}" +
    ".gly-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#F6F8F6}" +
    ".gly-bub{max-width:85%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.5;white-space:pre-wrap}" +
    ".gly-bub.bot{align-self:flex-start;background:#fff;border:1px solid #E6EAE6;color:#25302a;border-bottom-left-radius:4px}" +
    ".gly-bub.me{align-self:flex-end;background:#0F2E22;color:#fff;border-bottom-right-radius:4px}" +
    ".gly-bub.typing{color:#6B7772;font-style:italic}" +
    ".gly-chips{display:flex;flex-wrap:wrap;gap:7px;padding:10px 14px 4px;background:#F6F8F6}" +
    ".gly-chip{font:600 11.5px 'Hanken Grotesk',system-ui,sans-serif;color:#0F2E22;background:#fff;border:1px solid #E6EAE6;border-radius:999px;padding:6px 11px;cursor:pointer;transition:.15s}" +
    ".gly-chip:hover{border-color:#1F7A6B;color:#1F7A6B}" +
    ".gly-in{display:flex;gap:8px;padding:12px 14px 14px;background:#F6F8F6;border-top:1px solid #E6EAE6}" +
    ".gly-in input{flex:1;border:1px solid #E6EAE6;border-radius:12px;padding:11px 13px;font:14px 'Hanken Grotesk',system-ui,sans-serif;color:#0F2E22;outline:0;background:#fff}" +
    ".gly-in input:focus{border-color:#1F7A6B;box-shadow:0 0 0 3px rgba(31,122,107,.12)}" +
    ".gly-in button{background:#0F2E22;color:#fff;border:0;border-radius:12px;width:44px;font-size:18px;cursor:pointer;flex:0 0 auto}" +
    "@media(max-width:520px){#gly-panel{right:10px;bottom:10px;width:calc(100vw - 20px);height:calc(100vh - 20px)}#gly-fab{right:14px;bottom:14px}#gly-fab .tip{display:none}}";
  (document.head || document.documentElement).appendChild(css);

  var LEAF = '<svg viewBox="0 0 24 24" fill="none"><path d="M20 4C20 4 8 4 5 12c-2.2 5.9 1.4 8 1.4 8s2.1 3.6 8-.6C21 16 20 4 20 4Z" fill="#33d188"/><path d="M6.4 20C8 14 12.5 9.5 17 7" stroke="#eafff4" stroke-width="1.5" stroke-linecap="round"/></svg>';

  // Load the shared-context 3D bot (scenes.js auto-inits it on #botLauncherCanvas via boot()).
  // scenes.js draws ALL 3D through ONE WebGL context, so this adds no extra GPU context.
  function loadBot3D() {
    try {
      if (!document.querySelector('script[type="importmap"]')) {
        var im = document.createElement("script"); im.type = "importmap";
        im.textContent = '{"imports":{"three":"/assets/vendor/three.module.js"}}';
        document.head.appendChild(im);
      }
      if (!document.getElementById("glyiv-scenes-js")) {
        var s = document.createElement("script"); s.type = "module"; s.src = "/assets/js/scenes.js"; s.id = "glyiv-scenes-js";
        document.head.appendChild(s);
      }
    } catch (e) {}
  }

  function mount() {
    if (!document.body) return setTimeout(mount, 30);
    var fab = document.createElement("button");
    fab.id = "gly-fab"; fab.setAttribute("aria-label", "Tanya Gly");
    // 3D bot canvas (same model as the homepage, via scenes.js shared-context renderer);
    // the leaf is a CSS fallback shown only when WebGL is unavailable (no body.webgl-on).
    fab.innerHTML = '<span class="pg"></span><canvas id="botLauncherCanvas"></canvas><span class="gly-fallback">' + LEAF + '</span><span class="tip">Tanya Gly</span>';
    document.body.appendChild(fab);
    loadBot3D();

    var panel = document.createElement("div");
    panel.id = "gly-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Chat dengan Gly");
    panel.innerHTML =
      '<div class="gly-hd"><span class="av">' + LEAF + '</span><div><b>Gly</b><small>ASISTEN GLYIV · AI</small></div><button class="x" aria-label="Tutup">&times;</button></div>' +
      '<div class="gly-msgs" id="gly-msgs"></div>' +
      '<div class="gly-chips" id="gly-chips"></div>' +
      '<div class="gly-in"><input id="gly-input" placeholder="Tanya soal Glyiv atau halaman ini…" aria-label="Pesan"><button id="gly-send" aria-label="Kirim">&rarr;</button></div>';
    document.body.appendChild(panel);

    var msgs = panel.querySelector("#gly-msgs"), input = panel.querySelector("#gly-input");
    var history = [], opened = false, busy = false;

    function bub(text, who) { var b = document.createElement("div"); b.className = "gly-bub " + (who || "bot"); b.textContent = text; msgs.appendChild(b); msgs.scrollTop = msgs.scrollHeight; return b; }
    function chips() {
      var p = location.pathname, list;
      if (/\/industri\//.test(p)) list = ["Apa solusi Glyiv untuk sektor ini?", "Bagaimana cara Glyiv mengukur emisinya?", "Apa itu CBAM & kenapa penting?"];
      else if (/\/ekosistem\/pangan/.test(p)) list = ["Bagaimana label pangan dihitung?", "Apa itu hari-pohon?", "Kenapa daging lebih tinggi emisinya?"];
      else if (/\/ekosistem\//.test(p) || /\/apps\//.test(p)) list = ["Apa fungsi business tree ini?", "Bagaimana ini terhubung ke ekosistem?", "Apa itu Glyiv?"];
      else if (/kalkulator|scanner|imt/.test(p)) list = ["Bagaimana estimasi karbonnya dihitung?", "Apa maksud 'pohon untuk menebus'?", "Apa itu Glyiv?"];
      else list = ["Apa itu Glyiv?", "12 business tree apa saja?", "Kenapa carbon accounting penting?", "Untuk perusahaan saya?"];
      var el = panel.querySelector("#gly-chips");
      el.innerHTML = list.map(function (c) { return '<span class="gly-chip">' + c + "</span>"; }).join("");
      Array.prototype.forEach.call(el.querySelectorAll(".gly-chip"), function (c) { c.addEventListener("click", function () { send(c.textContent); }); });
    }
    function open() { panel.classList.add("on"); fab.style.display = "none"; if (!opened) { opened = true; chips(); setTimeout(function () { bub("Hai! Saya Gly, asisten Glyiv 🌿 Saya paham konteks halaman ini — tanya apa saja soal Glyiv, cara kerjanya, atau isi halaman ini."); }, 200); } setTimeout(function () { input.focus(); }, 300); }
    function close() { panel.classList.remove("on"); fab.style.display = "grid"; }

    function fallback(t) {
      t = (t || "").toLowerCase();
      var has = function () { for (var i = 0; i < arguments.length; i++) if (t.indexOf(arguments[i]) >= 0) return true; return false; };
      if (has("apa itu", "glyiv", "produk")) return "Glyiv adalah Carbon Intelligence & Offset Platform: mengukur emisi dari aktivitas nyata (terlacak, bukan tebakan), lalu menyalurkannya ke kontribusi iklim yang berimbal. Tiga lapisan: Ukur → Verifikasi → Offset. 🌿";
      if (has("business tree", "ekosistem", "cabang")) return "Ada 12 business tree: Carbon Intelligence, Glyiv Aset (pohon/lahan RWA), Outlet, Pasar, Pangan, Dompet, IoT, Dana, Bank Sampah, Sehat, Belajar, Lab — plus alat konsumen (Scan, Kalkulator) & Kabar. Semua berbagi satu tulang punggung data karbon.";
      if (has("kenapa", "penting", "regulasi", "cbam")) return "Karbon kini biaya nyata: EU CBAM masuk fase bayar 1 Jan 2026 ⚠︎, plus IFRS S2/ISSB, POJK, IDXCarbon. Yang tak terlacak diam-diam menggerus laba & akses pasar.";
      if (has("offset", "pohon", "tebus", "rwa")) return "Offset Glyiv diikat ke aset pohon/lahan nyata yang dipantau (oracle) dan ter-tokenisasi RWA (ERC-3643). Kami menyebutnya kontribusi terlacak, bukan klaim 'netral karbon'.";
      if (has("perusahaan", "enterprise", "bisnis", "demo", "harga")) return "Untuk enterprise, Glyiv mengukur Scope 1/2/3 dari data aktivitas nyata (selaras GHG Protocol/ISO 14064) + demo per-industri. Klik 'Gabung' atau hubungi tim untuk demo. 🙌";
      return "Saya paling paham soal Glyiv: apa itu, 12 business tree, kenapa karbon penting, cara mengukur & offset, dan isi halaman ini. Mau bahas yang mana?";
    }

    function send(text) {
      text = (text || input.value || "").trim(); if (!text || busy) return;
      input.value = ""; bub(text, "me"); history.push({ role: "user", content: text });
      busy = true; var typing = bub("Gly mengetik…", "bot typing");
      var msgArr = [{ role: "system", content: sysPrompt() }].concat(history.slice(-10));
      var done = function (reply) { typing.remove(); bub(reply, "bot"); history.push({ role: "assistant", content: reply }); busy = false; };
      fetch(PROXY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: MODEL, messages: msgArr, temperature: 0.6, max_tokens: 320 }) })
        .then(function (r) { return r.json(); })
        .then(function (d) { var m = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content; done((m || fallback(text)).trim()); })
        .catch(function () { done(fallback(text)); });
    }

    fab.addEventListener("click", open);
    panel.querySelector(".x").addEventListener("click", close);
    panel.querySelector("#gly-send").addEventListener("click", function () { send(); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
  }
  mount();
})();
