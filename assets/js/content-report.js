/* GLYIV — PELAPORAN ISI (satu mekanisme untuk seluruh situs & kelima aplikasi).
   ═══════════════════════════════════════════════════════════════════════════════

   ⛔ KENAPA BERKAS INI ADA — SYARAT PLAY, BUKAN FITUR TAMBAHAN.

   Kebijakan Google Play "AI-Generated Content" menuntut aplikasi yang
   MENGHASILKAN isi lewat AI menyediakan cara melaporkan isi yang menyinggung
   *"without needing to exit the app"*. Dua permukaan Glyiv memenuhi definisi
   "menghasilkan isi lewat AI":

     · Gly       — jawaban asisten dirakit LLM saat itu juga (proxy Groq);
     · Kabar     — artikel disusun dengan bantuan AI lalu disunting redaksi.

   Sampai 18 Agustus 2026 TIDAK ADA satu pun tombol lapor di keduanya. Kelima
   APK memuat halaman-halaman ini di dalam WebView, jadi kekurangannya
   diwariskan utuh oleh kelima aplikasi sekaligus — dan itu MEMBLOKIR
   pengiriman ke Play, bukan sekadar mengurangi nilai.

   ⛔ "TANPA KELUAR DARI APLIKASI" ITU HARFIAH. Karena itu jalur utamanya BUKAN
   `mailto:` — tautan surel MEMINDAHKAN orang ke aplikasi surel, yang persis
   yang dilarang kalimat kebijakannya. Surel hanya muncul sebagai jalan terakhir
   di layar kegagalan, sesudah percobaan kirim benar-benar gagal, lengkap dengan
   nomor laporan supaya usahanya tidak hilang.

   ⛔ TIDAK MENUNTUT LOGIN. Yang melapor sering justru orang yang tidak punya
   akun; gerbang login akan mengubah "bisa melapor" jadi "bisa mendaftar dulu".
   Karena itu `content_reports` menerima tulisan tanpa sesi — dan karena itu
   pula aturannya di `firestore.rules` MEMBATASI BENTUKNYA dengan ketat
   (enum alasan, panjang tiap kolom, tanpa kolom liar), sebab yang tidak dijaga
   sesi harus dijaga bentuk.

   ⛔ TANPA SDK. Berkas ini dimuat sebagai <script> biasa di setiap halaman,
   termasuk halaman statis `dist/` yang tidak memuat Firebase sama sekali.
   Menyeret SDK modular ke sana hanya demi satu tulisan akan menambah beban
   yang dibayar SETIAP pembaca demi tombol yang ditekan segelintir orang. REST
   `:commit` melakukan hal yang sama dengan satu `fetch`.

   Dipakai:
     GlyivReport.open({ kind: "ai-chat"|"ai-article"|"page", ref, excerpt })
     GlyivReport.button({ kind, ref, excerpt })   → <button> siap pasang
*/
(function () {
  "use strict";
  if (window.GlyivReport) return;

  /* Proyek & kunci Web SAMA dengan `dist/lab/kabar/kabar-fb.js` dan
     `src/firebaseInti.ts`. Kunci `AIza…` memang publik menurut desain Firebase:
     yang menjaga tulisan ini adalah `firestore.rules`, bukan kerahasiaan kunci.
     Kalau proyeknya berubah, KETIGA tempat itu diubah bersama — tidak ada yang
     menyinkronkannya sendiri. */
  var PROYEK = "glyiv-5cb33";
  var KUNCI = "AIzaSyDD-qemp0Y9A3nDUg_x3mKDCoDc450hC-E";
  var DASAR = "https://firestore.googleapis.com/v1/projects/" + PROYEK + "/databases/(default)/documents";
  var KOLEKSI = "content_reports";
  var SUREL_CADANGAN = "glyiv.archourium@gmail.com";

  /* Antrean lokal untuk laporan yang gagal terkirim. Tanpa ini, laporan yang
     dibuat di kereta bawah tanah hilang begitu saja — dan orang yang sudah
     mengetik keluhannya tidak akan mengetiknya dua kali. */
  var ANTREAN = "glyiv:reportQueue";

  /* ⛔ ENUM TERTUTUP, dan nilainya WAJIB sama persis dengan daftar di
     `firestore.rules` → `alasanLaporanSah()`. Nilainya bahasa Inggris karena ia
     kunci mesin, bukan kalimat yang dibaca orang; labelnya di bawah yang dibaca
     orang. Menambah alasan berarti menyunting DUA tempat, dan aturan akan
     menolak nilai yang belum dikenalnya — kegagalan yang berisik, bukan senyap. */
  var ALASAN = [
    { nilai: "hate",        label: "Kebencian, pelecehan, atau kekerasan" },
    { nilai: "sexual",      label: "Isi seksual atau tidak pantas" },
    { nilai: "misleading",  label: "Keliru atau menyesatkan" },
    { nilai: "greenwash",   label: "Klaim lingkungan yang berlebihan" },
    { nilai: "privacy",     label: "Memuat data pribadi saya" },
    { nilai: "other",       label: "Lainnya" },
  ];

  var BATAS_CATATAN = 1000;
  var BATAS_KUTIPAN = 2000;

  /* ── gaya ───────────────────────────────────────────────────────────────────
     Disuntik dari sini, bukan dari lembar gaya situs, karena widget ini juga
     hidup di halaman yang TIDAK memuat `lab.css` (Studio Kabar, halaman uji,
     WebView aplikasi). Token merek diambil lewat `var(--x, cadangan)` sehingga
     ia ikut tema kalau tokennya ada, dan tetap benar kalau tidak. */
  var GAYA = [
    '.grep-bd{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;',
    'padding:16px;background:rgba(18,33,27,.55);backdrop-filter:blur(3px)}',
    '.grep-card{width:100%;max-width:460px;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);',
    'overflow:auto;background:var(--paper,#fff);color:var(--ink,#12211B);border-radius:16px;',
    'box-shadow:0 24px 60px rgba(15,46,34,.28);padding:22px 22px 18px;',
    "font-family:'Hanken Grotesk',system-ui,sans-serif;-webkit-overflow-scrolling:touch}",
    ".grep-card h2{font-family:Newsreader,Georgia,serif;font-weight:600;font-size:22px;line-height:1.25;margin:0 0 6px}",
    '.grep-sub{font-size:13.5px;line-height:1.55;color:var(--slate,#48524B);margin:0 0 14px}',
    '.grep-quote{font-size:12.5px;line-height:1.5;color:var(--muted,#6B7280);background:var(--paper2,#F5F7F5);',
    'border-left:3px solid var(--hairline,#E7E9E6);border-radius:0 8px 8px 0;padding:8px 10px;margin:0 0 14px;',
    'max-height:88px;overflow:auto;white-space:pre-wrap;word-break:break-word}',
    '.grep-l{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;',
    "font-family:'IBM Plex Mono',ui-monospace,monospace;color:var(--muted,#6B7280);margin:0 0 7px}",
    '.grep-opts{display:grid;gap:6px;margin:0 0 14px}',
    '.grep-opt{display:flex;gap:10px;align-items:flex-start;padding:9px 11px;border:1px solid var(--hairline,#E7E9E6);',
    'border-radius:10px;cursor:pointer;font-size:14px;line-height:1.4;min-height:44px;box-sizing:border-box}',
    '.grep-opt:hover{background:var(--paper2,#F5F7F5)}',
    '.grep-opt input{margin:2px 0 0;accent-color:var(--teal,#1F7A6B);flex:0 0 auto;width:16px;height:16px}',
    '.grep-opt.on{border-color:var(--teal,#1F7A6B);background:rgba(31,122,107,.06)}',
    '.grep-card textarea,.grep-card input[type=email]{width:100%;box-sizing:border-box;border:1px solid var(--hairline,#E7E9E6);',
    "border-radius:10px;padding:10px 11px;font:inherit;font-size:14px;color:inherit;background:var(--paper,#fff);resize:vertical}",
    '.grep-card textarea{min-height:84px}',
    '.grep-card textarea:focus,.grep-card input:focus{outline:2px solid var(--teal,#1F7A6B);outline-offset:1px;border-color:transparent}',
    '.grep-count{font-size:11.5px;color:var(--muted,#6B7280);text-align:right;margin:4px 0 12px}',
    '.grep-count.over{color:#B3261E;font-weight:600}',
    '.grep-act{display:flex;gap:9px;justify-content:flex-end;flex-wrap:wrap;margin-top:4px}',
    '.grep-b{font:inherit;font-size:14px;font-weight:600;border-radius:10px;padding:11px 17px;min-height:44px;cursor:pointer;border:1px solid transparent}',
    '.grep-b--go{background:var(--pine,#0F2E22);color:#fff}',
    '.grep-b--go:disabled{opacity:.45;cursor:not-allowed}',
    '.grep-b--no{background:transparent;color:var(--slate,#48524B);border-color:var(--hairline,#E7E9E6)}',
    '.grep-msg{font-size:13.5px;line-height:1.55;margin:12px 0 0}',
    '.grep-msg.bad{color:#B3261E}',
    '.grep-id{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:12px;background:var(--paper2,#F5F7F5);',
    'padding:2px 6px;border-radius:5px;word-break:break-all}',
    /* Pemicunya sengaja bersahaja: ini bukan ajakan bertindak, ia jalan keluar
       darurat yang harus ADA tapi tidak boleh bersaing dengan isinya. */
    /* ⛔ TINGGI 44px WAJIB, dan ia BUKAN sekadar mengikuti pedoman.
       Terukur di halaman hidup, 412×915: versi pertama tombol ini 100×20 px —
       target sentuh setengah dari batas minimum. Pemilik menguji di Samsung
       Galaxy Tab S10 dengan jari, dan ini satu-satunya jalan keluar yang
       dituntut kebijakan Play; kontrol kepatuhan yang meleset saat disentuh
       sama saja tidak ada. Tingginya datang dari `min-height` + `inline-flex`,
       bukan dari `padding` besar, supaya JEJAK VISUALNYA tetap sekecil semula —
       ia memang harus ada, tapi tidak boleh bersaing dengan isi halaman. */
    '.grep-trig{background:none;border:0;padding:0 4px;margin:0;font:inherit;font-size:11.5px;line-height:1.2;',
    'display:inline-flex;align-items:center;min-height:44px;',
    'color:var(--muted,#6B7280);cursor:pointer;text-decoration:underline;text-underline-offset:2px;opacity:.75}',
    '.grep-trig:hover,.grep-trig:focus-visible{opacity:1;color:var(--teal,#1F7A6B)}',
    '@media (prefers-reduced-motion:no-preference){.grep-card{animation:grepIn .16s ease-out}',
    '@keyframes grepIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}}',
  ].join("");

  function pasangGaya() {
    if (document.getElementById("grep-css")) return;
    var s = document.createElement("style");
    s.id = "grep-css"; s.textContent = GAYA;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ── util ─────────────────────────────────────────────────────────────────── */

  function terjemahkan(el) {
    /* Menumpang mesin bahasa yang sudah ada — TIDAK membuat tabel kedua.
       Kalimat-kalimat di berkas ini masuk kamus lewat
       `scripts/panen-bahasa.cjs` → `scripts/gabung-bahasa.cjs` seperti kalimat
       lain di situs; `GlyivI18n.apply` hanya menulis kalau kuncinya persis ada,
       jadi memanggilnya sebelum panen pun aman. */
    try { if (window.GlyivI18n && window.GlyivI18n.apply) window.GlyivI18n.apply(el); } catch (e) {}
  }

  /* Id dokumen 20 karakter, bentuk yang sama dengan id otomatis Firestore.
     Dibuat di klien karena `:commit` menuntut nama dokumen yang lengkap —
     dan itu justru berguna: nomornya bisa ditunjukkan ke pelapor SEBELUM
     jaringan menjawab, jadi laporan yang gagal kirim tetap punya identitas. */
  var ABJAD = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  function idBaru() {
    var out = "", i, n = 20;
    try {
      var b = new Uint8Array(n);
      (window.crypto || window.msCrypto).getRandomValues(b);
      for (i = 0; i < n; i++) out += ABJAD[b[i] % ABJAD.length];
      return out;
    } catch (e) {
      for (i = 0; i < n; i++) out += ABJAD[Math.floor(Math.random() * ABJAD.length)];
      return out;
    }
  }

  function potong(s, n) { s = String(s == null ? "" : s); return s.length > n ? s.slice(0, n) : s; }

  /** Bungkus nilai JS jadi bentuk bernama-tipe milik REST Firestore. */
  function nilai(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") return { integerValue: String(Math.round(v)) };
    return { stringValue: String(v) };
  }

  /* ── kirim ────────────────────────────────────────────────────────────────── */

  /** Kirim satu laporan. Menolak (reject) kalau gagal — pemanggil yang memutuskan
      apakah mengantre atau menampilkan jalan keluar. */
  function kirim(rec) {
    var fields = {};
    for (var k in rec) if (Object.prototype.hasOwnProperty.call(rec, k)) fields[k] = nilai(rec[k]);

    var body = {
      writes: [{
        update: {
          name: "projects/" + PROYEK + "/databases/(default)/documents/" + KOLEKSI + "/" + rec.reportId,
          fields: fields,
        },
        /* Menolak menimpa dokumen yang sudah ada. Tanpa ini, id yang kebetulan
           bertabrakan (atau dikirim ulang antrean) akan MENGHAPUS laporan orang
           lain — bentuk kehilangan data yang tidak akan pernah ada yang tahu. */
        currentDocument: { exists: false },
        /* ⛔ WAKTU DARI SERVER, BUKAN DARI PERANGKAT. Jam tablet bisa salah
           berbulan-bulan, dan laporan penyalahgunaan yang stempel waktunya tidak
           bisa dipercaya kehilangan gunanya justru saat paling dibutuhkan.
           `firestore.rules` menuntut kolom ini SAMA DENGAN `request.time`, jadi
           klien tidak bisa mengarangnya sendiri. */
        updateTransforms: [{ fieldPath: "receivedAt", setToServerValue: "REQUEST_TIME" }],
      }],
    };

    return fetch(DASAR + ":commit?key=" + KUNCI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) {
      if (r.ok) return rec.reportId;
      return r.text().then(function (t) {
        throw new Error("HTTP " + r.status + " " + potong(t, 300));
      });
    });
  }

  function bacaAntrean() {
    try { return JSON.parse(localStorage.getItem(ANTREAN) || "[]"); } catch (e) { return []; }
  }
  function tulisAntrean(a) {
    try { localStorage.setItem(ANTREAN, JSON.stringify(a.slice(-20))); } catch (e) {}
  }
  function antre(rec) { var a = bacaAntrean(); a.push(rec); tulisAntrean(a); }

  /** Coba kirim ulang laporan yang tertahan. Dipanggil saat modul dimuat dan
      setiap kali jaringan kembali — diam-diam, sebab pelapornya sudah pergi. */
  function kurasAntrean() {
    var a = bacaAntrean();
    if (!a.length) return;
    tulisAntrean([]);
    a.forEach(function (rec) {
      kirim(rec).catch(function () { antre(rec); });
    });
  }

  /* ── dialog ───────────────────────────────────────────────────────────────── */

  var terbuka = null;

  function open(ctx) {
    ctx = ctx || {};
    if (terbuka) return;
    pasangGaya();

    var fokusSebelum = document.activeElement;
    var bd = document.createElement("div");
    bd.className = "grep-bd";
    bd.setAttribute("role", "dialog");
    bd.setAttribute("aria-modal", "true");
    bd.setAttribute("aria-label", "Laporkan isi ini");

    var kutipan = potong(ctx.excerpt || "", 300);
    var html =
      '<div class="grep-card">' +
        "<h2>Laporkan isi ini</h2>" +
        '<p class="grep-sub">Laporan dibaca redaksi Glyiv. Tidak perlu punya akun, dan Anda tidak akan meninggalkan halaman ini.</p>' +
        (kutipan ? '<div class="grep-quote"></div>' : "") +
        '<span class="grep-l">Alasan</span>' +
        '<div class="grep-opts">' +
          ALASAN.map(function (a, i) {
            return '<label class="grep-opt"><input type="radio" name="grepR" value="' + a.nilai + '"' +
              (i === 0 ? ' checked' : '') + '><span>' + a.label + "</span></label>";
          }).join("") +
        "</div>" +
        '<span class="grep-l">Keterangan <i>(boleh dikosongkan)</i></span>' +
        '<textarea id="grepNote" maxlength="' + BATAS_CATATAN + '" placeholder="Bagian mana yang bermasalah, dan kenapa?"></textarea>' +
        '<div class="grep-count" id="grepCount">0 / ' + BATAS_CATATAN + "</div>" +
        '<span class="grep-l">Surel Anda <i>(boleh dikosongkan — hanya untuk membalas)</i></span>' +
        '<input type="email" id="grepMail" maxlength="120" placeholder="nama@contoh.com" autocomplete="email">' +
        '<p class="grep-msg" id="grepMsg" hidden></p>' +
        '<div class="grep-act">' +
          '<button type="button" class="grep-b grep-b--no" id="grepNo">Batal</button>' +
          '<button type="button" class="grep-b grep-b--go" id="grepGo">Kirim laporan</button>' +
        "</div>" +
      "</div>";
    bd.innerHTML = html;
    /* Kutipan disuntik sebagai TEKS, bukan HTML: isinya kalimat mentah dari LLM
       atau dari artikel, dan menempelkannya sebagai markup akan mengubah
       laporan penyalahgunaan menjadi jalur XSS di halaman kami sendiri. */
    if (kutipan) bd.querySelector(".grep-quote").textContent = kutipan;

    document.body.appendChild(bd);
    terbuka = bd;
    terjemahkan(bd);

    var opts = bd.querySelectorAll(".grep-opt");
    function tandai() {
      Array.prototype.forEach.call(opts, function (o) {
        o.classList.toggle("on", !!o.querySelector("input").checked);
      });
    }
    Array.prototype.forEach.call(opts, function (o) {
      o.querySelector("input").addEventListener("change", tandai);
    });
    tandai();

    var note = bd.querySelector("#grepNote");
    var hitung = bd.querySelector("#grepCount");
    note.addEventListener("input", function () {
      hitung.textContent = note.value.length + " / " + BATAS_CATATAN;
      hitung.classList.toggle("over", note.value.length >= BATAS_CATATAN);
    });

    var msg = bd.querySelector("#grepMsg");
    var go = bd.querySelector("#grepGo");

    function tutup() {
      if (!terbuka) return;
      document.removeEventListener("keydown", esc, true);
      bd.remove(); terbuka = null;
      try { if (fokusSebelum && fokusSebelum.focus) fokusSebelum.focus(); } catch (e) {}
    }
    function esc(e) {
      if (e.key === "Escape") { e.stopPropagation(); tutup(); }
      /* Jerat fokus. Tanpa ini, Tab berjalan ke halaman di belakang tirai —
         yang bagi pemakai pembaca layar berarti dialognya seolah tidak ada. */
      if (e.key === "Tab") {
        var f = bd.querySelectorAll("button,input,textarea,select,a[href]");
        if (!f.length) return;
        var pertama = f[0], akhir = f[f.length - 1];
        if (e.shiftKey && document.activeElement === pertama) { e.preventDefault(); akhir.focus(); }
        else if (!e.shiftKey && document.activeElement === akhir) { e.preventDefault(); pertama.focus(); }
      }
    }
    document.addEventListener("keydown", esc, true);
    bd.addEventListener("mousedown", function (e) { if (e.target === bd) tutup(); });
    bd.querySelector("#grepNo").addEventListener("click", tutup);

    go.addEventListener("click", function () {
      var pilih = bd.querySelector('input[name="grepR"]:checked');
      var rec = {
        reportId: idBaru(),
        kind: ctx.kind === "ai-chat" || ctx.kind === "ai-article" ? ctx.kind : "page",
        reason: pilih ? pilih.value : "other",
        ref: potong(ctx.ref || location.pathname, 200),
        excerpt: potong(ctx.excerpt || "", BATAS_KUTIPAN),
        note: potong(note.value.trim(), BATAS_CATATAN),
        email: potong(bd.querySelector("#grepMail").value.trim(), 120),
        page: potong(location.pathname + location.search, 300),
        lang: potong((window.GlyivI18n && window.GlyivI18n.lang) || window.GLYIV_LANG || "id", 8),
        status: "open",
      };

      go.disabled = true;
      msg.hidden = false; msg.className = "grep-msg"; msg.textContent = "Mengirim…";
      terjemahkan(msg);

      kirim(rec).then(function (id) {
        bd.querySelector(".grep-card").innerHTML =
          "<h2>Terima kasih — laporan Anda masuk.</h2>" +
          '<p class="grep-sub">Redaksi Glyiv membacanya dalam 3 hari kerja. Simpan nomor ini kalau Anda ingin menanyakannya kembali:</p>' +
          '<p class="grep-msg"><span class="grep-id">' + id + "</span></p>" +
          '<div class="grep-act"><button type="button" class="grep-b grep-b--go" id="grepDone">Tutup</button></div>';
        terjemahkan(bd);
        bd.querySelector("#grepDone").addEventListener("click", tutup);
        bd.querySelector("#grepDone").focus();
      }).catch(function (e) {
        /* ⛔ JANGAN DIAM. Laporan yang hilang tanpa kabar lebih buruk daripada
           tombol yang tidak ada, sebab pelapornya percaya sudah melapor.
           Isinya disimpan dan akan dikirim ulang sendiri; nomornya diberikan
           supaya usahanya tidak menguap; surel disebut sebagai jalan terakhir
           — bukan jalan pertama. */
        antre(rec);
        msg.className = "grep-msg bad";
        msg.innerHTML = "Belum terkirim — jaringan menolak. Laporan Anda DISIMPAN di perangkat ini dan " +
          "dikirim ulang otomatis saat sambungan pulih. Nomornya: " +
          '<span class="grep-id">' + rec.reportId + "</span>. Kalau mendesak, kirimkan nomor itu ke " +
          '<span class="grep-id">' + SUREL_CADANGAN + "</span>.";
        terjemahkan(msg);
        go.disabled = false;
        console.warn("Glyiv report gagal:", e && e.message);
      });
    });

    /* Fokus ke pilihan pertama, bukan ke tombol Kirim: dialog yang membuka
       dengan fokus di tombol kirim mengundang tekan-tanpa-baca. */
    var awal = bd.querySelector('input[name="grepR"]');
    if (awal) awal.focus();
  }

  /** <button> pemicu yang sudah terpasang pendengarnya. */
  function button(ctx, label) {
    pasangGaya();
    var b = document.createElement("button");
    b.type = "button";
    b.className = "grep-trig";
    b.textContent = label || "Laporkan";
    b.setAttribute("aria-label", "Laporkan isi ini");
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); open(ctx); });
    terjemahkan(b);
    return b;
  }

  window.GlyivReport = { open: open, button: button, ALASAN: ALASAN };

  /* ⛔ PENGUMUMAN KESIAPAN — supaya tidak ada yang bergantung pada URUTAN MUAT.
     `kabar.js` dimuat sebagai <script> penghambat-parser, sementara modul ini
     disuntik `glyiv-nav.js` secara dinamis; skrip yang disisipkan lewat DOM
     TIDAK mengikuti aturan `defer` (defer hanya berlaku untuk skrip yang
     ditemukan parser), jadi ia berlomba. Pemeriksaan `if (window.GlyivReport)`
     saja karena itu bisa MELESET — dan melesetnya senyap: halaman tetap
     tampil, hanya tombol lapornya yang tidak pernah ada. Persis bentuk cacat
     yang sudah dua kali memakan waktu di proyek ini.
     Pemanggil memakai `GlyivReport.siap(cb)` (di bawah) atau mendengarkan
     peristiwa ini; keduanya bekerja baik modul ini datang lebih dulu maupun
     lebih akhir. */
  window.GlyivReport.siap = function (cb) { try { cb(window.GlyivReport); } catch (e) {} };
  try { document.dispatchEvent(new CustomEvent("glyiv:report-ready")); } catch (e) {}

  /* Kuras saat muat & saat jaringan pulih. */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kurasAntrean);
  else kurasAntrean();
  window.addEventListener("online", kurasAntrean);
})();
