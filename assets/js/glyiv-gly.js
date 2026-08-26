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
  /* ── MUNDUR HANYA KALAU ADA *CHAT* LAIN, BUKAN SEKADAR TOMBOL ────────────
     Versi lama juga mundur begitu menemukan `.liv-fab` atau `.korb--3d` di
     halaman. Satu-satunya halaman yang punya keduanya adalah artikel Kabar
     (`dist/lab/kabar/artikel.html:99`) — dan TERUKUR: tidak ada satu pun
     pendengar untuk `#glyBot` atau `.korb--3d` di seluruh dist/, public/ dan
     src/. Jadi selama ini orb Gly di halaman artikel adalah tombol HIASAN:
     ditekan, tidak terjadi apa-apa. Justru di halaman yang paling butuh —
     pembaca sedang menatap satu artikel dan ingin bertanya tentangnya.

     Sekarang: yang membuat berkas ini mundur hanya keberadaan panel obrolan
     milik widget lain (`#gvChat` di design1.html, `#livLauncher`, atau
     `#glyChat` yang sudah dipasang berkas ini sendiri). Tombol yang sudah ada
     TIDAK membuatnya mundur — ia DIPAKAI apa adanya (lihat `mount()`), lengkap
     dengan halo mood dan label per-artikelnya. */
  if (document.getElementById("gvChat") || document.getElementById("livLauncher") ||
      document.getElementById("glyChat")) return;
  window.__glyivGly = true;

  var PROXY = (window.GLYIV_CHAT_PROXY || "https://glyiv-chat.archourium.workers.dev").trim();
  var MODEL = "llama-3.3-70b-versatile";

  /* ── BAHASA · MENUMPANG MESIN YANG SUDAH ADA, BUKAN MEKANISME KEDUA ─────────
     Cacat yang diperbaiki blok ini: badge rekomendasi ("chip") Gly tetap
     Bahasa Indonesia di halaman EN/AR. Sebabnya BUKAN mesin i18n tidak ada —
     `assets/js/i18n.js` sudah berjalan di setiap halaman dan sudah punya dua
     alat yang tepat untuk skrip penyuntik markup seperti berkas ini:
        GlyivI18n.apply(elemen)  — terjemahkan satu cabang DOM
        peristiwa "glyiv:lang"   — diumumkan tiap kali bahasa berganti
     Yang hilang cuma pemakaiannya. `MutationObserver` mesin memang menangkap
     simpul yang disuntik, tetapi (1) ia bisa kalah cepat dari suntikan yang
     terjadi sebelum mesin menyala, dan (2) chip dirender SEKALI saat panel
     pertama dibuka — mengganti bahasa sesudah itu tidak pernah menyentuhnya
     lagi. Dua-duanya ditutup di bawah.
     ⚠︎ Kamusnya sendiri tetap satu: `i18n-en.js` / `i18n-ar.js`, kunci = teks
     Indonesia. Kalimat baru di berkas ini belum ada di sana sampai
     `scripts/panen-bahasa.cjs` → `gabung-bahasa.cjs` dijalankan. Tidak ada
     tabel terjemahan cadangan di berkas ini — itu justru mekanisme kedua yang
     dilarang. */
  var NAMA_BAHASA = { id: "Bahasa Indonesia", en: "English", ar: "Arabic (العربية)" };
  function bahasaAktif() {
    try { return (window.GlyivI18n && window.GlyivI18n.lang) || window.GLYIV_LANG || "id"; } catch (e) { return "id"; }
  }
  function terjemahkan(el) {
    try { if (el && window.GlyivI18n && window.GlyivI18n.apply) window.GlyivI18n.apply(el); } catch (e) {}
  }

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
    var lang = bahasaAktif();
    return 'Kamu adalah "Gly", asisten AI dari Glyiv — Your Green Industry Intelligence Platform (produk PT WOSU Innovation Technology).\n' +
      /* Bahasa jawaban mengikuti bahasa halaman. Sebelum ini prompt memaksa
         Bahasa Indonesia, jadi pengunjung halaman EN/AR mendapat chip yang sudah
         berbahasa mereka tetapi jawaban yang tidak. */
      'BAHASA JAWABAN: ' + (NAMA_BAHASA[lang] || NAMA_BAHASA.id) + '. Jawab HANYA dalam bahasa itu, apa pun bahasa pertanyaannya.\n' +
      'Gaya: santai tapi kredibel, ringkas (2-4 kalimat), ramah ke konsumen maupun enterprise/investor. Boleh 1 emoji sesekali. Jangan bertele-tele.\n' +
      'Yang HARUS kamu tahu:\n' +
      /* Lima butir pertama = LIMA POIN HERO BERANDA, berurutan: apa itu Glyiv →
         untung buat individu → untung buat perusahaan → bagaimana dapatnya →
         langkahnya. Kalau hero berubah, butir-butir ini ikut berubah. */
      '- APA ITU: platform kecerdasan hijau. "Green" di sini berarti TERLACAK — belanja harian, perjalanan, dan bahan baku dibaca jadi estimasi karbon dari aktivitas nyata, bukan klaim.\n' +
      '- UNTUNG BUAT INDIVIDU: catat belanja & kebiasaan harian, lihat jejaknya, kumpulkan reward dari pilihan yang berkesinambungan.\n' +
      '- UNTUNG BUAT PERUSAHAAN: jejak terlacak dari aktivitas nyata di titik bayar, dapur produksi, dan rantai pasok — bahan laporan, bukan tebakan rata-rata kategori.\n' +
      '- CARA DAPAT REWARD-NYA & LANGKAHNYA: 01 Tangkap (aktivitas masuk sebagai data) → 02 Process (pustaka faktor emisi jadi estimasi berentang) → 03 Reward (kurangi dulu, lalu salurkan kontribusi ke aset hijau nyata). Hanya langkah pertama yang butuh dunia nyata.\n' +
      '- Dua wajah satu sistem: konsumen = ekonomi hijau harian; enterprise = Green Intelligence.\n' +
      '- Mengukur emisi dari aktivitas nyata: activity-based/process-LCA (resep × faktor emisi) + fallback spend-based EEIO (EXIOBASE). Library faktor: ecoinvent, Poore & Nemecek 2018, ADEME Agribalyse, DEFRA, IPCC.\n' +
      '- Ekosistem 13 business tree: Green Intelligence, Glyiv Aset (pohon/lahan RWA), Glyiv Outlet (POS/titik bayar berdata karbon), Glyiv Pocket (aplikasi konsumen di /app), Glyiv Pasar (marketplace), Glyiv Pangan (hub pangan: label kalori+emisi+tebus), Glyiv Dompet (carbon wallet), Glyiv IoT, Glyiv Dana, Bank Sampah, Glyiv Sehat, Glyiv Belajar, Glyiv Lab/RnD; + alat konsumen (Scan Karbon, Kalkulator) & Kabar (media).\n' +
      '- Glyiv Pocket = SATU-SATUNYA cabang konsumen yang SUDAH BISA DIPAKAI hari ini (buka /app, halamannya /lab/ekosistem/saku.html): cari barang dari NAMA -> estimasi CO2e berentang + tier, kalkulator IMT, catatan harian + grafik. Batasnya harus disebut kalau ditanya: BELUM ada pengenalan gambar (bukan foto, tapi ketik nama), hasilnya rentang bukan angka pasti, padanan pohon = gambaran skala bukan penebusan, IMT bukan nasihat medis.\n' +
      /* Butir ini dulu berbunyi "aplikasi Android/iOS masih roadmap (belum di
         Play Store)" — sudah tidak benar untuk Android. TERUKUR hari ini:
         GET https://glyiv.io/download/Glyiv-Pocket.apk → 200 (33.490 byte) dan
         .../Glyiv-Green-Assets.apk → 200 (29.395 byte). Keduanya kini juga
         ditautkan langsung dari hero beranda, jadi Gly tidak boleh menyangkal
         hal yang tautannya ada di layar yang sama. */
      '- APK Android BISA DIUNDUH LANGSUNG hari ini (di luar Play Store): /download/Glyiv-Pocket.apk dan /download/Glyiv-Green-Assets.apk, keduanya ditautkan dari hero beranda dan dari /download.html. Play Store & iOS masih peta jalan.\n' +
      '- Web3: aset hijau token RWA ERC-3643 (permissioned, KYC on-chain); oracle & DePIN (sensor/foto-GPS, satelit masa depan); anti double-counting.\n' +
      '- Pendorong regulasi: EU CBAM (fase bayar 1 Jan 2026), IFRS S2/ISSB, POJK, IDXCarbon.\n' +
      'POSTUR JUJUR (WAJIB, berlaku di ketiga bahasa): klaim "kontribusi"/"contribution", BUKAN "netral karbon"/"carbon neutral"; "terlacak"/"tracked", bukan "terukur"/"measured"/"verified"; "reward"/"imbalan", bukan "penghasilan"/"income"; sertifikasi/MRV masih peta jalan. Jangan mengarang angka. Jangan menyebut kamu LLM/model/Groq. JANGAN pakai kata "kasir"/"kafe"/"cashier"/"cafe" — gunakan "outlet"/"titik bayar".\n' +
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

    /* Tombol yang SUDAH ADA di markup halaman dipakai apa adanya — jangan
       ditimpa. Di halaman artikel Kabar ia membawa halo mood dan label
       `.korb__tip` yang sudah berbunyi tentang artikel yang sedang dibuka;
       menggantinya dengan tombol generik justru membuang konteks yang sudah
       benar. Yang dipastikan hanya dua hal: ada kanvas 3D di dalamnya, dan
       tombolnya punya nama yang bisa dibaca pembaca layar. */
    var fab = document.querySelector(".liv-fab");
    if (!fab) {
      fab = document.createElement("button");
      fab.className = "liv-fab"; fab.id = "glyBot"; fab.setAttribute("aria-label", "Tanya Gly");
    /* ⚠︎ Keterangan "Tanya Gly" ditulis sebagai SIMPUL TEKS di dalam <i>, bukan
       lewat CSS `content:`. Isi `content:` tidak bisa dijangkau kamus i18n, jadi
       versi lamanya bertahan Bahasa Indonesia di halaman EN dan AR — di setiap
       halaman, tepat di bawah model 3D. Sebagai simpul teks ia diterjemahkan
       kamus seperti teks lain di situs. */
      fab.innerHTML = '<span class="liv-fab__bubble"><i>Tanya Gly</i></span><canvas id="botLauncherCanvas"></canvas>';
      document.body.appendChild(fab);
    } else {
      /* Gelembung TIDAK ditambahkan ke tombol adopsi: halaman artikel sudah
         punya `.korb__tip`, dan dua label untuk satu tombol adalah dua kali
         kalimat yang sama di satu sudut layar. */
      if (!fab.querySelector("canvas")) {
        var cv = document.createElement("canvas"); cv.id = "botLauncherCanvas"; fab.appendChild(cv);
      } else if (!fab.querySelector("#botLauncherCanvas")) {
        fab.querySelector("canvas").id = "botLauncherCanvas";
      }
      if (!fab.getAttribute("aria-label")) fab.setAttribute("aria-label", "Tanya Gly");
    }

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
      /* Gelembung yang kami tulis sendiri (sapaan, jawaban cadangan offline)
         lewat kamus juga — supaya bukan hanya chip yang berbahasa halaman.
         Jawaban dari LLM sudah datang dalam bahasa yang benar lewat sysPrompt,
         dan `tr()` di i18n.js hanya menulis kalau kuncinya persis ada, jadi
         memanggilnya di sini aman untuk teks apa pun.
         Gelembung "me" DIKECUALIKAN: itu kata-kata pengunjung sendiri, dan
         menuliskan ulang kalimat orang bukan tugas mesin bahasa. */
      if ((who || "bot") !== "me") terjemahkan(b);

      /* ⛔ TOMBOL LAPOR DI SETIAP JAWABAN — SYARAT PLAY, BUKAN HIASAN.
         Kebijakan "AI-Generated Content" menuntut cara melaporkan isi yang
         menyinggung tanpa keluar dari aplikasi. Jawaban Gly dirakit LLM saat
         itu juga: tidak ada peninjau di antaranya, jadi kalimat yang tidak
         pantas HANYA bisa ketahuan dari pembacanya.

         Ia dipasang per gelembung, bukan satu di kepala panel, karena yang
         dilaporkan adalah SATU kalimat tertentu — dan `excerpt` di bawah
         membawa kalimat itu apa adanya ke laporan, sehingga redaksi tidak
         perlu menebak jawaban mana yang dimaksud.

         Gelembung "typing" dan gelembung "me" dikecualikan: yang pertama
         bukan jawaban, yang kedua kata-kata pelapornya sendiri. */
      if ((who || "bot") === "bot" && window.GlyivReport) {
        var kaki = document.createElement("div");
        kaki.className = "liv-bub__rep";
        kaki.appendChild(window.GlyivReport.button({
          kind: "ai-chat",
          ref: "gly" + location.pathname,
          excerpt: text,
        }));
        msgs.appendChild(kaki);
        msgs.scrollTop = msgs.scrollHeight;
      }

      // gerakkan mulut bot 3D saat "bicara"
      if ((who || "bot") === "bot" && window.glyivBot && window.glyivBot.speak) {
        window.glyivBot.speak(true);
        setTimeout(function () { window.glyivBot.speak(false); }, Math.min(4200, 700 + text.length * 26));
      }
      return b;
    }

    /* BADGE REKOMENDASI BERANDA = LIMA POIN HERO, URUTANNYA SAMA:
       apa itu → untung buat individu → untung buat perusahaan → bagaimana dapat
       reward-nya → apa langkahnya. Daftar lama ("12 business tree apa saja?",
       "Kenapa carbon accounting penting?") menawarkan tur fitur, bukan lima
       pertanyaan yang baru saja ditimbulkan hero di layar yang sama. */
    var CHIP_BERANDA = [
      "Apa itu Glyiv?",
      "Apa untungnya buat saya?",
      "Untuk perusahaan saya?",
      "Bagaimana cara dapat reward-nya?",
      "Apa saja langkahnya?",
    ];
    /* Apakah halaman ini SATU artikel, bukan daftarnya? Dua penanda, dan
       keduanya harus setuju supaya /news (daftar) tidak ikut terjaring:
       rutenya artikel DAN ada badan artikel yang benar-benar tergambar. */
    function halamanArtikel() {
      var p = location.pathname;
      if (!/\/news\/article|\/lab\/kabar\/artikel/.test(p)) return false;
      return !!document.querySelector(".kart__body, .kart, article");
    }
    function daftarChip() {
      var p = location.pathname;
      /* ── ARTIKEL: pertanyaan tentang YANG SEDANG DIBACA ────────────────────
         Kalimatnya sengaja TIDAK menyisipkan judul artikel. Kunci kamus i18n
         adalah kalimat Indonesia apa adanya, jadi chip yang menempelkan judul
         akan menghasilkan kunci baru untuk setiap artikel — 95 artikel × 4 chip
         = 380 kunci yang tidak akan pernah diterjemahkan.
         Judulnya tidak hilang: `pageContext()` sudah mengirim judul, heading,
         bagian dan ringkasan halaman ke dalam prompt sistem, jadi jawabannya
         tetap tentang artikel INI. Chip yang tetap + konteks yang bergerak. */
      if (halamanArtikel()) return [
        "Ringkas artikel ini dalam tiga poin",
        "Apa sumber datanya?",
        "Apa kaitannya dengan Glyiv?",
        "Apa artinya buat perusahaan saya?",
      ];
      if (/\/news|\/lab\/kabar/.test(p)) return [
        "Apa isi kabar terbaru?",
        "Bagaimana Glyiv memilih topiknya?",
        "Apakah artikelnya dibantu AI?",
        "Apa itu Glyiv?",
      ];
      if (/\/industri\//.test(p)) return ["Apa solusi Glyiv untuk sektor ini?", "Bagaimana jejaknya dilacak?", "Apa itu CBAM & kenapa penting?"];
      if (/\/ekosistem\/pangan/.test(p)) return ["Bagaimana label pangan dihitung?", "Apa itu hari-pohon?", "Kenapa daging lebih tinggi emisinya?"];
      if (/\/ekosistem\//.test(p) || /\/apps\//.test(p)) return ["Apa fungsi business tree ini?", "Bagaimana ini terhubung ke ekosistem?", "Apa itu Glyiv?"];
      if (/kalkulator|scanner|imt/.test(p)) return ["Bagaimana estimasi karbonnya dihitung?", "Apa maksud 'pohon untuk menebus'?", "Apa itu Glyiv?"];
      return CHIP_BERANDA;
    }
    function chips() {
      var el = chat.querySelector("#glyChips");
      if (!el) return;
      el.innerHTML = daftarChip().map(function (c) {
        return '<span class="liv-chip" role="button" tabindex="0">' + c + "</span>";
      }).join("");
      Array.prototype.forEach.call(el.querySelectorAll(".liv-chip"), function (c) {
        var pakai = function () { send(c.textContent); };
        c.addEventListener("click", pakai);
        /* Chip adalah <span> (kelas `.liv-chip` di lab.css menggayai span, bukan
           button), jadi papan ketik tidak mendapatkannya gratis. */
        c.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pakai(); }
        });
      });
      /* Suntik dulu, terjemahkan sesudahnya — `GlyivI18n.apply` menelusuri cabang
         ini apa adanya. Tanpa baris ini chip bergantung pada MutationObserver
         mesin, yang tidak berjalan kalau mesin baru menyala setelah chip ada. */
      terjemahkan(el);
    }
    /* Ganti bahasa SESUDAH panel terbuka: chip dirender sekali, jadi tanpa
       pendengar ini ia membeku di bahasa saat pertama dibuka. Peristiwanya milik
       i18n.js dan diumumkan oleh SEMUA pemilih bahasa (pil navbar situs, pemilih
       React, ?lang=), jadi tidak ada jalur yang terlewat. */
    document.addEventListener("glyiv:lang", function () { if (opened) chips(); });

    /* ── SEKALI MENGAJAK, SESUDAH ITU DIAM ────────────────────────────────
       Gelembung "Tanya Gly" berdenyut tiap 14 detik supaya bot 3D di sudut
       layar terbaca sebagai sesuatu yang BISA DITEKAN — itu masalah nyata:
       tanpa kata, ia hanya hiasan. Tetapi ajakan yang tidak pernah berhenti
       berubah jadi gangguan pada kunjungan kedua.

       Karena itu, begitu pengunjung SEKALI membuka obrolan, `body.gly-met`
       mematikan siklusnya dan gelembungnya hanya keluar saat disorot atau
       difokus (lihat lab.css). Ditandai di localStorage, jadi ia tetap diam
       di kunjungan berikutnya.

       `try/catch` bukan hiasan: localStorage MELEMPAR di jendela penyamaran
       dan saat penyimpanan situs diblokir, dan lemparan di sini akan
       mematikan seluruh pemasangan bot. */
    function tandaiKenal() {
      document.body.classList.add("gly-met");
      try { localStorage.setItem("glyivGlyMet", "1"); } catch (e) {}
    }
    try { if (localStorage.getItem("glyivGlyMet") === "1") document.body.classList.add("gly-met"); } catch (e) {}

    function open() {
      document.body.classList.add("livchat-open");
      tandaiKenal();
      /* ⛔ `chips()` DI LUAR penjaga `!opened`, dan itu perbaikan cacat.
         Dulu chip hanya dirender pada pembukaan PERTAMA. Di aplikasi React
         halamannya berganti tanpa memuat ulang, jadi pengunjung yang membuka
         Gly di beranda lalu pindah ke sebuah artikel dan membukanya lagi tetap
         melihat chip beranda — persis kebalikan dari "saran sesuai halaman".
         Merender ulang itu murah: lima <span> dan satu panggilan kamus. */
      chips();
      if (!opened) { opened = true; setTimeout(function () { bub("Hai! Saya Gly, asisten Glyiv 🌿 Di sini 'green' berarti terlacak — tanya apa itu Glyiv, apa untungnya buat kamu atau perusahaanmu, dan apa saja langkahnya."); }, 220); }
      setTimeout(function () { input.focus(); }, 300);
    }
    function close() { document.body.classList.remove("livchat-open"); }

    /* Jawaban cadangan saat proxy tak terjangkau. Kelimanya menjawab kelima chip
       di atas, dengan isi yang sama dengan hero — bukan cerita ketiga.
       ⚠︎ "mengukur emisi" dibuang dari dua jawaban: diksi tetap proyek adalah
       "terlacak", bukan "terukur". */
    function fallback(t) {
      t = (t || "").toLowerCase();
      var has = function () { for (var i = 0; i < arguments.length; i++) if (t.indexOf(arguments[i]) >= 0) return true; return false; };
      if (has("langkah", "step", "cara kerja")) return "Tiga langkah, dan hanya yang pertama butuh dunia nyata: 01 Tangkap — belanja, perjalanan, dan transaksi outlet masuk sebagai data; 02 Process — pustaka faktor emisi mengubahnya jadi estimasi berentang; 03 Reward — kurangi dulu, lalu salurkan kontribusi ke aset hijau nyata. 🌿";
      if (has("reward", "imbalan", "untung", "dapat apa")) return "Reward datang dari pilihan yang berkesinambungan: catat belanja & kebiasaan harian di Glyiv Pocket, lihat jejaknya, lalu kurangi dan salurkan kontribusi ke aset hijau nyata. Kami menyebutnya kontribusi terlacak — bukan klaim netral karbon.";
      if (has("perusahaan", "enterprise", "bisnis", "demo", "harga")) return "Untuk perusahaan: jejak terlacak dari aktivitas nyata di titik bayar, dapur produksi, dan rantai pasok — selaras GHG Protocol/ISO 14064, lengkap dengan tier data dan rentangnya. Klik 'Gabung' atau hubungi tim untuk demo. 🙌";
      if (has("apa itu", "glyiv", "produk")) return "Glyiv adalah Your Green Industry Intelligence Platform. 'Green' di sini berarti terlacak: belanja harian, perjalanan, dan bahan baku dibaca jadi estimasi karbon dari aktivitas nyata — lalu jadi reward untuk pilihan yang berkesinambungan. 🌿";
      if (has("business tree", "ekosistem", "cabang")) return "Ada 12 business tree: Green Intelligence, Glyiv Aset (pohon/lahan RWA), Outlet, Pasar, Pangan, Dompet, IoT, Dana, Bank Sampah, Sehat, Belajar, Lab — plus alat konsumen (Scan, Kalkulator) & Kabar. Semua berbagi satu tulang punggung data karbon.";
      if (has("kenapa", "penting", "regulasi", "cbam")) return "Karbon kini biaya nyata: EU CBAM masuk fase bayar 1 Jan 2026 ⚠︎, plus IFRS S2/ISSB, POJK, IDXCarbon. Yang tak terlacak diam-diam menggerus laba & akses pasar.";
      if (has("offset", "pohon", "tebus", "rwa")) return "Kontribusi Glyiv diikat ke aset pohon/lahan nyata yang dipantau (oracle) dan ter-tokenisasi RWA (ERC-3643). Kami menyebutnya kontribusi terlacak, bukan klaim 'netral karbon'.";
      if (has("unduh", "apk", "aplikasi", "android", "download")) return "APK Android bisa diunduh langsung dari hero beranda: Glyiv Pocket dan Glyiv Green Assets. Keduanya di luar Play Store — Play Store dan iOS masih peta jalan.";
      return "Saya paling paham soal Glyiv: apa itu, apa untungnya buat kamu atau perusahaanmu, bagaimana reward-nya datang, apa saja langkahnya, dan isi halaman ini. Mau bahas yang mana?";
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
