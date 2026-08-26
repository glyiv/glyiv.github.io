/* GLYIV KABAR — lapisan realtime + SATU-SATUNYA jalan artikel Firestore masuk
   ke halaman. Memuat Firebase lewat dynamic import di dalam try/catch, jadi
   kalau CDN diblokir/luring newsletter tetap jalan (kabar.js sudah menggambar
   dari content-pack lokal dengan engagement localStorage). Kalau Firestore
   (proyek glyiv-5cb33) terjangkau, berkas ini melakukan DUA hal:
     1. menaikkan window.KE ke views/likes/shares bersama secara realtime;
     2. meneruskan dokumen artikelnya ke `window.__kMerge` (kabar.js) — inilah
        yang membuat tulisan admin dari Studio benar-benar tampil di /news.
   ⚠︎ Sampai 14 Agustus 2026 hanya (1) yang ada, sehingga (2) tidak pernah
   terjadi dan Studio menerbitkan ke ruang hampa. Lihat catatan di dalam
   onSnapshot di bawah dan di `__kMerge`.

   ⛔ PROYEKNYA HARUS SAMA DENGAN `kabar-fb.js`. Sampai 13 Agustus 2026 keduanya
   menunjuk `glyiv-28711`, yang koleksi `kabar_articles`-nya KOSONG (terukur: 0
   dokumen), sementara 87 artikel terbit ada di `glyiv-5cb33`. Karena `onSnapshot`
   di bawah menjawab snapshot KOSONG — bukan galat — `any` tidak pernah true,
   `upgrade()` tidak pernah dipanggil, dan `window.KE` selamanya tinggal di
   localStorage. Halaman tetap tampil sempurna; yang hilang hanya kenyataan bahwa
   hitungannya bersama. Cacat yang diam adalah cacat yang bertahan lama. */
(function () {
  "use strict";
  /* Disalin apa adanya dari `.env` (VITE_FIREBASE_*), sama dengan kabar-fb.js. */
  var CFG = {
    apiKey: "AIzaSyDD-qemp0Y9A3nDUg_x3mKDCoDc450hC-E",
    authDomain: "glyiv-5cb33.firebaseapp.com",
    projectId: "glyiv-5cb33",
    storageBucket: "glyiv-5cb33.firebasestorage.app",
    messagingSenderId: "537596927094",
    appId: "1:537596927094:web:ef434f813b8a3aa0015357",
  };
  var COLL = "kabar_articles", V = "12.16.0";
  var cache = {}, upgraded = false;
  var LK = "glyiv_kabar_liked";
  function liked(slug) { try { return !!(JSON.parse(localStorage.getItem(LK) || "{}")[slug]); } catch (e) { return false; } }
  function setLiked(slug, on) { try { var m = JSON.parse(localStorage.getItem(LK) || "{}"); m[slug] = on; localStorage.setItem(LK, JSON.stringify(m)); } catch (e) {} }
  function toMs(v) { return !v ? 0 : (v.toMillis ? v.toMillis() : (v.seconds != null ? v.seconds * 1000 : (typeof v === "number" ? v : 0))); }

  /* ⛔ `initializeApp(CFG)` POLOS MEMATIKAN JEMBATAN INI, DAN DIAM-DIAM.
     `kabar-fb.js` (Studio) mengimpor URL CDN yang SAMA PERSIS, jadi peramban
     memberi kedua berkas SATU instans modul `firebase-app.js` dengan SATU peta
     `_apps`. Siapa pun yang jalan lebih dulu membuat `[DEFAULT]`; yang kedua
     memanggil `initializeApp` lagi, dan SDK melempar `app/duplicate-app` begitu
     opsinya berbeda walau satu kunci.

     Yang terjadi sebelum perbaikan ini, terukur di node dengan SDK 12.16.0 yang
     sama: buka /news/studio dulu → `[DEFAULT]` lahir dari kabar-fb.js →
     pindah ke /news → baris ini melempar → `catch` di bawah menelannya →
     `onSnapshot` tidak pernah berlangganan → `__kMerge` tidak pernah dipanggil.
     Artikel yang baru saja diterbitkan admin TIDAK MUNCUL, dan tidak ada satu
     pun galat yang bisa ia laporkan. `useSiteScripts` menyimpan src yang sudah
     dimuat seumur sesi, jadi kembali ke /news tidak mencobanya lagi.

     Dua penjaga sekarang, sengaja tidak saling bergantung:
       1. konfigurasi kedua berkas dibuat identik (`measurementId` dibuang dari
          kabar-fb.js) — jadi tidak ada lagi kunci yang bisa berbeda;
       2. fungsi ini: kalau `[DEFAULT]` sudah ada dan menunjuk PROYEK YANG SAMA,
          PAKAI ULANG, jangan panggil `initializeApp` lagi sama sekali.
     Penjaga (2) tetap benar walau suatu hari ada yang menambah kunci lagi.

     Kalau `[DEFAULT]` ternyata menunjuk proyek LAIN, kita tidak boleh
     menumpanginya — hitungan akan dibaca dari database yang salah. Untuk kasus
     itu dibuat aplikasi BERNAMA tersendiri, sama seperti `ambilApp()` di
     `kabar-fb.js`. */
  function ambilApp(appM) {
    var adaDefault = appM.getApps().some(function (a) { return a.name === "[DEFAULT]"; });
    if (adaDefault) {
      var bawaan = appM.getApp();
      if (bawaan.options && bawaan.options.projectId === CFG.projectId) return bawaan;
      console.warn("Kabar live: aplikasi [DEFAULT] menunjuk proyek lain (" + (bawaan.options && bawaan.options.projectId) + "); memakai aplikasi terpisah.");
      return appM.initializeApp(CFG, "kabar-live");
    }
    return appM.initializeApp(CFG);
  }

  (async function () {
    try {
      var appM = await import("https://www.gstatic.com/firebasejs/" + V + "/firebase-app.js");
      var fs = await import("https://www.gstatic.com/firebasejs/" + V + "/firebase-firestore.js");
      var db = fs.getFirestore(ambilApp(appM));
      var qy = fs.query(fs.collection(db, COLL), fs.where("status", "==", "published"));
      fs.onSnapshot(qy, function (snap) {
        var now = Date.now(), any = false, artikel = [];
        snap.forEach(function (d) {
          var a = d.data();
          /* ⛔ SATU ATURAN JADWAL UNTUK KEDUA LAPISAN. `kabar.js` menayangkan
             artikel pada pukul 07:00 WAKTU SETEMPAT PEMBACA (lihat catatan
             panjang di `tayangSejak()` di sana). Kalau baris ini tetap memakai
             perbandingan instan biasa, dokumen Firestore akan lolos lebih dulu
             daripada content-pack — dan pembaca melihat artikel muncul di jam
             yang berbeda tergantung lapisan mana yang menang. Karena itu fungsi
             yang sama dipakai, bukan disalin. */
          var ambang = window.__kTayangSejak ? window.__kTayangSejak(a) : toMs(a.publishAt);
          if (ambang > now) return;                         // terjadwal — belum tayang
          cache[d.id] = { views: a.views || 0, likes: a.likes || 0, shares: a.shares || 0 };
          any = true;
          /* ⛔ SEBELUM 14 AGUSTUS 2026 BARIS BERIKUT TIDAK ADA, dan itulah sebabnya
             Studio tidak pernah bisa menerbitkan apa pun yang terlihat. Snapshot
             ini SUDAH memuat dokumen artikel lengkap — judul, dek, blocks, cover —
             lalu tiga angka diambil dan sisanya dibuang. `kabar.js` karena itu
             selamanya menggambar content-pack statis, dan artikel yang ditulis
             admin hidup di Firestore tanpa satu pun halaman yang menampilkannya.
             Tidak ada galat, tidak ada 403, tidak ada keluhan — hanya fitur yang
             mati. Meneruskannya ke `__kMerge` TIDAK menambah biaya jaringan:
             dokumennya sudah dibayar oleh langganan yang sama. */
          a.slug = a.slug || d.id;
          artikel.push(a);
        });
        if (any && !upgraded) upgrade(db, fs);
        if (artikel.length && window.__kMerge) window.__kMerge(artikel);
        if (any && window.__kRefreshCounts) window.__kRefreshCounts();
      }, function (err) {
        /* ⚠︎ DULU KOSONG. Halaman tetap jalan (content-pack + localStorage), jadi
           kegagalan di sini memang tidak boleh menghentikan apa pun — tetapi
           MENELANNYA berarti "artikel saya tidak muncul" tidak punya satu pun
           petunjuk untuk ditelusuri. Yang benar: jangan hentikan halaman, tapi
           tinggalkan jejak yang menyebut sebabnya. */
        console.warn("Kabar live: langganan kabar_articles gagal (" + ((err && err.code) || err) + "). Artikel dari Studio tidak akan muncul; halaman memakai content-pack lokal.");
      });
    } catch (e) {
      /* ⚠︎ DULU SENYAP TOTAL, dan justru di sinilah `app/duplicate-app` mendarat
         — satu-satunya galat yang membuat tulisan admin tidak pernah tampil.
         Lihat catatan panjang di `ambilApp()` di atas. */
      console.warn("Kabar live: lapisan realtime mati (" + ((e && e.code) || (e && e.message) || e) + "). Halaman memakai content-pack lokal + localStorage.");
    }
  })();

  function inc(db, fs, slug, field, delta) { try { fs.updateDoc(fs.doc(db, COLL, slug), (function () { var o = {}; o[field] = fs.increment(delta); return o; })()).catch(function () {}); } catch (e) {} if (cache[slug]) { cache[slug][field] = Math.max(0, (cache[slug][field] || 0) + delta); if (window.__kRefreshCounts) window.__kRefreshCounts(); } }
  function upgrade(db, fs) {
    upgraded = true;
    var prev = window.KE;
    window.KE = {
      mode: "firestore",
      counts: function (a) { var c = cache[a.slug]; if (c) return { views: c.views, likes: c.likes, shares: c.shares, liked: liked(a.slug) }; return prev ? prev.counts(a) : { views: a.views || 0, likes: a.likes || 0, shares: a.shares || 0, liked: liked(a.slug) }; },
      view: function (slug) { var k = "kvf_" + slug, d = new Date().toISOString().slice(0, 10); try { if (localStorage.getItem(k) === d) return; localStorage.setItem(k, d); } catch (e) {} inc(db, fs, slug, "views", 1); },
      story: function (slug) { var k = "ksvf_" + slug, d = new Date().toISOString().slice(0, 10); try { if (localStorage.getItem(k) === d) return; localStorage.setItem(k, d); } catch (e) {} inc(db, fs, slug, "storyViews", 1); },
      share: function (slug) { inc(db, fs, slug, "shares", 1); },
      like: function (slug) { var now = !liked(slug); setLiked(slug, now); inc(db, fs, slug, "likes", now ? 1 : -1); return now; },
    };
    /* ⛔ TAYANGAN YANG SUDAH TERLANJUR DIHITUNG KE CADANGAN HARUS DIULANG.
       `kabar.js:566` memanggil `window.KE.view(slug)` saat artikel digambar —
       dan pada saat itu `window.KE` MASIH implementasi localStorage, karena
       `upgrade()` baru berjalan sesudah jawaban Firestore pertama tiba. Jadi
       kenaikan `views` yang sungguhan TIDAK PERNAH terjadi: penghitungnya macet
       di "0 reads" selamanya.

       Terukur agen pembantah, dua kunjungan berurutan di profil yang sama:
       `localStorage` hanya berisi `kv_<slug>` (kunci cadangan) dan TIDAK PERNAH
       `kvf_<slug>` (kunci Firestore), padahal `window.KE.mode === "firestore"`.
       Tidak ada galat di mana pun — hanya angka yang tidak pernah naik.

       Baris di bawah mengulang panggilannya lewat implementasi BARU. Ia aman
       dipanggil dua kali: `view()` versi Firestore memakai penjaga harian
       `kvf_<slug>` = tanggal hari ini, jadi tayangan kedua pada hari yang sama
       berhenti sendiri. */
    var slugTerbuka = window.__kArtikelTerbuka;
    if (slugTerbuka && window.KE && window.KE.view) {
      try { window.KE.view(slugTerbuka); } catch (e) {
        console.warn("[glyiv] tayangan gagal dihitung ulang sesudah upgrade:", e);
      }
    }
    if (window.__kRefreshCounts) window.__kRefreshCounts();
  }
})();
