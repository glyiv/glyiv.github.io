/* GLYIV — asisten "Gly" (versi kaya, SAMA dengan homepage). Dimuat site-wide oleh
   glyiv-nav.js. Menyuntik chatbox homepage yang sesungguhnya: FAB bot 3D BESAR
   tanpa lingkaran (.liv-fab + #botLauncherCanvas) yang membuka panel berisi
   MODEL GLY 3D di dalamnya (.liv-chat__bot + #botPanelCanvas) — persis homepage,
   di SETIAP halaman. Gaya dari lab.css (dimuat global); 3D dari scenes.js (satu
   konteks WebGL, aman di tablet). Backend jujur berbasis LLM (proxy Groq) +
   fallback kalengan saat offline. Melewati halaman yang sudah punya widgetnya
   sendiri (mis. bot artikel Kabar). */
(function () {
  "use strict";
  if (window.__glyivGly) return;
  // jangan dobel di halaman yang sudah membawa widget chat sendiri
  if (document.getElementById("gvChat") || document.getElementById("livLauncher") ||
      document.getElementById("glyChat") || document.querySelector(".liv-fab") ||
      document.querySelector(".korb--3d")) return;
  window.__glyivGly = true;

  var PROXY = (window.GLYIV_CHAT_PROXY || "https://glyiv-chat.archourium.workers.dev").trim();
  var MODEL = "llama-3.3-70b-versatile";

  /* ---- konteks halaman (membuat Gly sadar posisi pengguna) ---- */
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
      '- Ekosistem 13 business tree: Carbon Intelligence, Glyiv Aset (pohon/lahan RWA), Glyiv Outlet (POS/titik bayar berdata karbon), Glyiv Saku (aplikasi konsumen di /app), Glyiv Pasar (marketplace), Glyiv Pangan (hub pangan: label kalori+emisi+tebus), Glyiv Dompet (carbon wallet), Glyiv IoT, Glyiv Dana, Bank Sampah, Glyiv Sehat, Glyiv Belajar, Glyiv Lab/RnD; + alat konsumen (Scan Karbon, Kalkulator) & Kabar (media).\n' +
      '- Glyiv Saku = SATU-SATUNYA cabang konsumen yang SUDAH BISA DIPAKAI hari ini (buka /app, halamannya /lab/ekosistem/saku.html): cari barang dari NAMA -> estimasi CO2e berentang + tier, kalkulator IMT, catatan harian + grafik. Batasnya harus disebut kalau ditanya: BELUM ada pengenalan gambar (bukan foto, tapi ketik nama), hasilnya rentang bukan angka pasti, padanan pohon = gambaran skala bukan penebusan, IMT bukan nasihat medis, aplikasi Android/iOS masih roadmap (belum di Play Store).\n' +
      '- Web3: aset hijau token RWA ERC-3643 (permissioned, KYC on-chain); oracle & DePIN (sensor/foto-GPS, satelit masa depan); anti double-counting.\n' +
      '- Pendorong regulasi: EU CBAM (fase bayar 1 Jan 2026), IFRS S2/ISSB, POJK, IDXCarbon.\n' +
      'POSTUR JUJUR (WAJIB): klaim "kontribusi", BUKAN "netral karbon"; "terlacak", bukan "terukur"; sertifikasi/MRV masih dalam roadmap. Jangan mengarang angka. Jangan menyebut kamu LLM/model/Groq. JANGAN pakai kata "kasir"/"kafe" — gunakan "outlet"/"titik bayar".\n' +
      'KONTEKS HALAMAN SAAT INI → ' + pageContext() + '\nKaitkan jawaban ke konteks halaman ini bila relevan; kalau ditanya di luar Glyiv, arahkan balik dengan ramah.';
  }

  // Muat bot 3D lewat scenes.js (satu konteks WebGL bersama untuk semua kanvas —
  // tak menambah konteks GPU). Panggil hook idempoten untuk memasang KEDUA bot.
  function loadBot3D() {
    try {
      if (!document.querySelector('script[type="importmap"]')) {
        var im = document.createElement("script"); im.type = "importmap";
        im.textContent = '{"imports":{"three":"/assets/vendor/three.module.js"}}';
        document.head.appendChild(im);
      }
      if (!document.getElementById("glyiv-scenes-js") && !document.querySelector('script[src*="/assets/js/scenes.js"]')) {
        var s = document.createElement("script"); s.type = "module"; s.src = "/assets/js/scenes.js"; s.id = "glyiv-scenes-js";
        document.head.appendChild(s);
      }
      var tries = 0;
      (function pasang() {
        if (window.glyivMountChatBots) { window.glyivMountChatBots(); return; }
        if (window.glyivMountBot) { window.glyivMountBot(document.getElementById("botLauncherCanvas"), "bust"); window.glyivMountBot(document.getElementById("botPanelCanvas"), "full"); return; }
        if (tries++ < 100) setTimeout(pasang, 60);
      })();
    } catch (e) {}
  }

  function mount() {
    if (!document.body) return setTimeout(mount, 30);

    var fab = document.createElement("button");
    fab.className = "liv-fab"; fab.id = "glyBot"; fab.setAttribute("aria-label", "Tanya Gly");
    fab.innerHTML = '<span class="liv-fab__ping"></span><canvas id="botLauncherCanvas"></canvas>';
    document.body.appendChild(fab);

    var chat = document.createElement("div");
    chat.className = "liv-chat"; chat.id = "glyChat"; chat.setAttribute("role", "dialog"); chat.setAttribute("aria-label", "Chat dengan Gly");
    chat.innerHTML =
      '<div class="liv-chat__hd"><span class="av"></span><div><b>Gly</b><small>ASISTEN GLYIV · AI</small></div><button class="cls" id="glyClose" aria-label="Tutup">&times;</button></div>' +
      '<div class="liv-chat__bot"><canvas id="botPanelCanvas"></canvas><span class="liv-chat__cap">Gly &middot; online</span></div>' +
      '<div class="liv-chat__msgs" id="glyMsgs"></div>' +
      '<div class="liv-chat__chips" id="glyChips"></div>' +
      '<div class="liv-chat__in"><input id="glyInput" placeholder="Tanya soal Glyiv atau halaman ini…" aria-label="Pesan"><button id="glySend" aria-label="Kirim">&rarr;</button></div>';
    document.body.appendChild(chat);

    loadBot3D();

    var msgs = chat.querySelector("#glyMsgs"), input = chat.querySelector("#glyInput");
    var history = [], opened = false, busy = false;

    function bub(text, who) {
      var b = document.createElement("div"); b.className = "liv-bub " + (who || "bot"); b.textContent = text;
      msgs.appendChild(b); msgs.scrollTop = msgs.scrollHeight;
      // gerakkan mulut bot 3D saat "bicara"
      if ((who || "bot") === "bot" && window.glyivBot && window.glyivBot.speak) {
        window.glyivBot.speak(true);
        setTimeout(function () { window.glyivBot.speak(false); }, Math.min(4200, 700 + text.length * 26));
      }
      return b;
    }
    function chips() {
      var p = location.pathname, list;
      if (/\/industri\//.test(p)) list = ["Apa solusi Glyiv untuk sektor ini?", "Bagaimana cara Glyiv mengukur emisinya?", "Apa itu CBAM & kenapa penting?"];
      else if (/\/ekosistem\/pangan/.test(p)) list = ["Bagaimana label pangan dihitung?", "Apa itu hari-pohon?", "Kenapa daging lebih tinggi emisinya?"];
      else if (/\/ekosistem\//.test(p) || /\/apps\//.test(p)) list = ["Apa fungsi business tree ini?", "Bagaimana ini terhubung ke ekosistem?", "Apa itu Glyiv?"];
      else if (/kalkulator|scanner|imt/.test(p)) list = ["Bagaimana estimasi karbonnya dihitung?", "Apa maksud 'pohon untuk menebus'?", "Apa itu Glyiv?"];
      else list = ["Apa itu Glyiv?", "12 business tree apa saja?", "Kenapa carbon accounting penting?", "Untuk perusahaan saya?"];
      var el = chat.querySelector("#glyChips");
      el.innerHTML = list.map(function (c) { return '<span class="liv-chip">' + c + "</span>"; }).join("");
      Array.prototype.forEach.call(el.querySelectorAll(".liv-chip"), function (c) { c.addEventListener("click", function () { send(c.textContent); }); });
    }
    function open() {
      document.body.classList.add("livchat-open");
      if (!opened) { opened = true; chips(); setTimeout(function () { bub("Hai! Saya Gly, asisten Glyiv 🌿 Saya paham konteks halaman ini — tanya apa saja soal Glyiv, cara kerjanya, atau isi halaman ini."); }, 220); }
      setTimeout(function () { input.focus(); }, 300);
    }
    function close() { document.body.classList.remove("livchat-open"); }

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
    chat.querySelector("#glyClose").addEventListener("click", close);
    chat.querySelector("#glySend").addEventListener("click", function () { send(); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
  }
  mount();
})();
