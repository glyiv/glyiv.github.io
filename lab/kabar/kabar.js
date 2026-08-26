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

  /* ⛔ PEMASANG TOMBOL LAPOR — TAHAN URUTAN MUAT.
     `assets/js/content-report.js` disuntik `glyiv-nav.js` secara DINAMIS,
     sedangkan berkas ini dimuat sebagai <script> penghambat-parser. Skrip yang
     disisipkan lewat DOM tidak mengikuti aturan `defer`, jadi keduanya berlomba
     dan pemenangnya berganti-ganti antara muat-dingin, muat-cache, dan navigasi
     React. Menulis `if (window.GlyivReport)` saja berarti tombol wajib-Play itu
     ADA atau TIDAK ADA tergantung keberuntungan — dan ketiadaannya tidak
     memunculkan galat apa pun.
     Karena itu: pasang sekarang kalau modulnya sudah ada, dan kalau belum,
     tunggu satu peristiwa `glyiv:report-ready`. Slot yang sudah terisi tidak
     diisi dua kali (`__terisi`), sebab `initArticle()` memang berjalan
     berkali-kali untuk satu artikel yang sama. */
  function pasangLapor(slot, ctx, label) {
    if (!slot || slot.__terisi) return;
    function pasang() {
      if (!slot.__terisi && window.GlyivReport && slot.isConnected !== false) {
        slot.__terisi = true;
        slot.appendChild(window.GlyivReport.button(ctx, label));
      }
    }
    if (window.GlyivReport) { pasang(); return; }
    document.addEventListener("glyiv:report-ready", pasang, { once: true });
  }

  /* ⚠︎ ABSOLUT, JANGAN DIKEMBALIKAN JADI "artikel.html?a=".
     Tautan RELATIF diselesaikan terhadap DIREKTORI alamat yang sedang dibuka.
     Di glyiv.github.io alamatnya `/lab/kabar/` (ada index.html sungguhan), jadi
     bentuk relatif kebetulan benar. Di aplikasi React alamatnya `/lab/kabar`
     TANPA garis miring akhir — direktorinya `/lab/`, sehingga "artikel.html"
     menjadi `/lab/artikel.html`: rute yang tidak ada, dan penangkap `*`
     melempar pembaca ke BERANDA. Terukur di peramban sebelum perbaikan ini:
     menekan kartu artikel mendarat di "/" dengan judul beranda, bukan artikel.
     Bentuk absolut benar di KEDUA tempat (situsnya dilayani dari akar domain).
     Dipakai ketiga tautan artikel di berkas ini: kartu feed, layar akhir Story,
     dan lompatan otomatis di akhir Story. `shareUrl()` sudah absolut sejak awal. */
  var URL_ARTIKEL = "/lab/kabar/artikel.html?a=";

  /* ══════════════════════════════════════════════════════════════════════════
     ALAMAT ARTIKEL BERBENTUK JALUR — supaya cuplikan berbagi punya isi sendiri
     ══════════════════════════════════════════════════════════════════════════
     Pemilik, ronde 66: ia ingin tautan yang dibagikan menampilkan cuplikan
     halamannya sendiri, bukan judul beranda.

     Sudah ada mesinnya (`scripts/buat-halaman-berbagi.cjs`): ia menulis
     `build/<rute>/index.html` berisi og:title/og:description halaman itu,
     dan Firebase Hosting menyajikan BERKAS STATIS lebih dulu sebelum menerapkan
     rewrite — jadi perayap WhatsApp/Telegram/X (yang TIDAK menjalankan
     JavaScript) membaca cuplikan yang benar.

     ⛔ Tapi 102 artikel Kabar tidak bisa ikut, dan sebabnya struktural: alamatnya
     `/news/article?a=<slug>`. Kueri BUKAN bagian dari nama berkas — Hosting
     mencocokkan `/news/article` saja, jadi ke-102 artikel berbagi SATU berkas
     dan karenanya SATU cuplikan. Itu persis gejala yang dikeluhkan.

     Karena itu artikel kini punya alamat berbentuk JALUR juga:
     `/news/article/<slug>` — bentuk yang BISA jadi berkas statis, satu per
     artikel. Bentuk `?a=` TIDAK dimatikan: ia sudah tersebar di tautan, umpan,
     dan hasil pencarian, dan `initArticle()` di bawah tetap membacanya.

     ⚠︎ HANYA di aplikasi React. Di `glyiv.github.io` tidak ada router yang bisa
     melayani `/news/article/<slug>`; di sana yang ada berkas `artikel.html`
     sungguhan. Deteksinya STRUKTURAL (`#root` = akar React), bukan lewat nama
     host: berkas ini juga dijalankan dari dalam APK Newsletter yang memuat
     salinan statisnya, dan uji berbasis hostname akan salah menebak di sana. */
  var DI_APLIKASI_REACT = !!document.getElementById("root");

  /* ⛔ GARIS MIRING DITULIS TERPISAH, DAN ITU BUKAN GAYA PENULISAN.
     `scripts/peta-rute.cjs` menulis ulang SETIAP literal string berbentuk jalur
     di berkas .js saat disalin `dist/` → `public/`, dan `normalkan()` di
     dalamnya MEMBUANG garis miring akhir. Ditulis utuh sebagai "/news/article/",
     salinan `public/`-nya lahir sebagai "/news/article" — dan ke-99 tautan
     artikel kehilangan pemisah slug-nya ("/news/articlepajak-karbon-…").
     Terukur pada port pertama baris ini. Bentuk "/news/article" sendiri adalah
     rute KANONIS, jadi pemetaannya no-op dan literalnya lolos apa adanya. */
  var JALUR_ARTIKEL = "/news/article" + "/";
  var urlArtikel = function (slug) {
    return DI_APLIKASI_REACT ? JALUR_ARTIKEL + enc(slug) : URL_ARTIKEL + enc(slug);
  };
  /* Daftar artikel. Alasannya sama dengan `urlArtikel` di atas: bentuk yang
     benar berbeda antara aplikasi React dan situs statis. */
  var urlDaftar = function () { return DI_APLIKASI_REACT ? "/news" : "/lab/kabar/"; };

  /* ══════════════════════════════════════════════════════════════════════════
     JEMBATAN KE GERBANG IKLAN & LANGGANAN
     ══════════════════════════════════════════════════════════════════════════
     `window.GlyivIklan` diterbitkan `src/lib/iklanGlobal.ts` — hanya di dalam
     aplikasi React. Berkas ini juga dilayani `glyiv.github.io`, situs statis
     tanpa React, dan di sana objek itu TIDAK PERNAH ADA.

     ⛔ Karena itu SETIAP pemakaian di bawah punya cabang "tidak ada gerbang".
     Cabang itu bukan penanganan galat — ia jalur normal untuk seluruh pembaca
     web. Tanpa gerbang: navigasinya berjalan persis seperti sebelum ronde ini,
     tanpa satu pun iklan dan tanpa satu pun tombol langganan.

     ⛔ JANGAN mengganti pemeriksaan ini dengan "apakah kita di dalam APK".
     Sudah pernah jadi cacat di jalur masuk Google: APK LAMA yang terpasang hari
     ini juga mengaku APK, dan tombol yang mati di sana lebih buruk daripada
     tidak ada tombol. Yang diperiksa adalah ADANYA FUNGSINYA. */
  function gerbangIklan() {
    var g = window.GlyivIklan;
    return g && typeof g.lanjutDenganIklan === "function" ? g : null;
  }
  function konteksIklan(unit) {
    return {
      aplikasi: "news",
      unit: unit,
      rute: location.pathname,
      /* ⛔ WAJIB. Gerbang MENOLAK iklan pertama seseorang kalau penempatannya
         tidak menyediakan layar penjelasan — keputusan pemilik yang ditegakkan
         mesin, bukan diserahkan pada ingatan. Lihat `kartuPenjelasan()`. */
      jelaskanDulu: kartuPenjelasan,
    };
  }
  /**
   * Menjalankan `lanjut` — dengan satu iklan layar penuh di depannya kalau
   * seluruh gerbang mengizinkan, tanpa apa pun kalau tidak.
   *
   * ⛔ `lanjut` HARUS berupa perpindahan halaman saja. Jangan pernah menaruh
   * penyimpanan data di dalamnya: urutannya selalu SIMPAN dulu, baru iklan.
   */
  function lanjutDenganIklan(lanjut, unit) {
    var g = gerbangIklan();
    if (!g) { lanjut(); return; }
    try {
      var hasil = g.lanjutDenganIklan(lanjut, konteksIklan(unit));
      /* Gerbangnya sendiri menjamin `lanjut()` dipanggil di SETIAP cabang.
         Penangkap ini hanya untuk versi yang melempar sebelum sempat menjanjikan
         apa pun — pembaca tetap sampai ke tujuannya. */
      if (hasil && typeof hasil.catch === "function") hasil.catch(function () { lanjut(); });
    } catch (e) { lanjut(); }
  }
  /**
   * Satu unit BENAR-BENAR tuntas — bukan dibuka, tuntas.
   *
   * ⚠︎ Inilah yang mengisi syarat "minimal 2 unit tuntas sejak iklan terakhir".
   * Tanpa panggilan ini gerbangnya tidak pernah membuka; itu arah gagal yang
   * aman, tetapi ia juga berarti penempatan yang lupa memanggilnya akan tampak
   * "tidak ada iklan sama sekali" tanpa satu pun galat.
   */
  function catatUnitSelesai() {
    var g = gerbangIklan();
    if (!g || typeof g.catatUnitSelesai !== "function") return;
    try { g.catatUnitSelesai(); } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════════════════
     TOMBOL BERLANGGANAN
     ══════════════════════════════════════════════════════════════════════════
     ⛔ SYARAT MUNCULNYA: `beliLangganan` BENAR-BENAR ADA sebagai fungsi di
     jembatan native. Bukan "kita di dalam APK" — itu sudah pernah jadi cacat di
     jalur masuk Google: APK LAMA yang terpasang hari ini juga mengaku APK lewat
     User-Agent, dan tombol "Berlangganan" yang mati di sana lebih buruk daripada
     tidak ada tombol sama sekali. Di peramban biasa dan di APK lama, tombol ini
     TIDAK DIGAMBAR — bukan digambar lalu dinonaktifkan.

     ⛔ HARGA TIDAK PERNAH DITULIS DI SINI. Ia datang dari Play lewat
     `ambilProduk()`. Angka yang ditulis di kode akan berbohong begitu pemilik
     mengubahnya di Play Console, dan sudah berbohong hari ini di setiap negara
     selain satu. Kalau daftarnya kosong atau gagal, tombolnya tidak muncul —
     lebih baik tidak ada tawaran daripada tawaran tanpa harga. */
  function pasangTombolLangganan(wadah, saatBerhasil) {
    if (!wadah) return;
    var g = gerbangIklan();
    if (!g || typeof g.bisaBerlangganan !== "function" || !g.bisaBerlangganan()) return;
    if (typeof g.ambilProduk !== "function" || typeof g.beli !== "function") return;
    Promise.resolve(g.ambilProduk()).then(function (daftar) {
      if (!daftar || !daftar.length) return;
      if (wadah.isConnected === false) return;
      wadah.hidden = false;
      wadah.innerHTML = daftar.map(function (p) {
        /* Harga dipisah jadi simpulnya sendiri ber-`data-i18n-skip`, alasan yang
           sama dengan baris kredit gambar: tetangganya nilai yang berubah, dan
           kunci kamus "Bebas iklan · Rp29.000" tidak akan pernah cocok dua kali. */
        return '<button class="klang__btn" type="button" data-produk="' + esc(p.id) + '">' +
          '<span>' + esc(kata("bebasIklan")) + '</span>' +
          (p.harga ? '<b data-i18n-skip>' + esc(p.harga) + "</b>" : "") + "</button>";
      }).join("");
      $$("[data-produk]", wadah).forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.disabled) return;
          var semula = b.innerHTML;
          b.disabled = true;
          b.textContent = kata("memuat");
          Promise.resolve(g.beli(b.getAttribute("data-produk"))).then(function (kode) {
            b.disabled = false; b.innerHTML = semula;
            if (kode === "ok") { toast(kata("langgananAktif")); if (saatBerhasil) saatBerhasil(); return; }
            /* "batal" = ia menutup layar Play sendiri. Memberitahunya bahwa ia
               membatalkan adalah menegur orang atas keputusannya sendiri. */
            if (kode !== "batal") toast(kata("langgananGagal"));
          }).catch(function () {
            b.disabled = false; b.innerHTML = semula; toast(kata("langgananGagal"));
          });
        });
      });
    }).catch(function () { /* tanpa tombol; bukan galat yang perlu dilihat pembaca */ });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     LAYAR PENJELASAN — sekali seumur akun, SEBELUM iklan pertama
     ══════════════════════════════════════════════════════════════════════════
     Ritme yang bisa ditebak adalah yang membuat orang berhenti takut menekan
     tombol. Menjelaskannya sekali di depan membeli ketenangan itu dengan satu
     ketukan seumur hidup; mengulanginya tiap kali akan jadi gangguan KEDUA di
     samping iklannya.

     Ini juga satu-satunya momen di mana seseorang persis sedang memikirkan
     iklan — karena itu tawaran bebas iklan berdiri di sini, bukan di rute
     terpisah yang tidak akan pernah dikunjungi siapa pun.

     ⛔ JANJI YANG TIDAK BOLEH DILANGGAR: fungsi ini SELALU menyelesaikan
     janjinya. Gerbang `lanjutDenganIklan()` menunggunya, dan janji yang
     menggantung berarti pembaca tertahan di halaman yang sudah ia tinggalkan.
     Karena itu tiap jalan keluar — tombol, latar, Escape — memanggil `tutup()`. */
  var penjelasanEl = null;
  function kartuPenjelasan() {
    return new Promise(function (selesai) {
      if (!penjelasanEl) {
        penjelasanEl = document.createElement("div");
        penjelasanEl.className = "kjelas";
        document.body.appendChild(penjelasanEl);
      }
      var el = penjelasanEl, sudah = false;
      el.innerHTML = '<div class="kjelas__panel" role="dialog" aria-modal="true" aria-labelledby="kjelasJudul">' +
        '<h4 id="kjelasJudul">' + esc(kata("iklanJudul")) + "</h4>" +
        "<p>" + esc(kata("iklanIsi")) + "</p>" +
        '<button class="kjelas__ok" type="button">' + esc(kata("iklanLanjut")) + " →</button>" +
        '<div class="klang" hidden></div></div>';
      function tutup(hasil) {
        if (sudah) return;
        sudah = true;
        el.classList.remove("on");
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKey);
        el.removeEventListener("click", onLatar);
        selesai(hasil);
      }
      /* ⚠︎ Latar & Escape menjawab "tanpa-iklan", BUKAN "lanjut". Orang yang
         mengetuk di luar kartu tidak sedang menyetujui apa pun; memberinya
         iklan karenanya adalah persis "muncul saat pengguna memilih hal lain".
         Arah amannya jelas: ia tetap sampai ke artikel berikutnya, tanpa iklan. */
      function onKey(e) { if (e.key === "Escape") tutup("tanpa-iklan"); }
      function onLatar(e) { if (e.target === el) tutup("tanpa-iklan"); }
      $(".kjelas__ok", el).addEventListener("click", function () { tutup("lanjut"); });
      pasangTombolLangganan($(".klang", el), function () { tutup("tanpa-iklan"); });
      document.addEventListener("keydown", onKey);
      el.addEventListener("click", onLatar);
      document.body.style.overflow = "hidden";
      el.classList.add("on");
      try { $(".kjelas__ok", el).focus(); } catch (e) {}
    });
  }

  /** Slug artikel yang sedang dibuka — bentuk jalur DULU, lalu bentuk kueri. */
  var slugTerbuka = function () {
    var m = /^\/news\/article\/([^/]+)\/?$/.exec(location.pathname);
    if (m) {
      try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
    }
    return new URLSearchParams(location.search).get("a");
  };

  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ══ LABEL YANG DIRAKIT SAAT JALAN — DISUSUN PER BAHASA, BUKAN DICOCOKKAN ═══
     ⛔ CACAT YANG MELAHIRKAN BLOK INI (14 Agustus 2026)
     ───────────────────────────────────────────────────────────────────────────
     Mesin kamus (`assets/js/i18n.js`) menerjemahkan dengan mencocokkan SIMPUL
     TEKS UTUH ke kunci harfiah. Label yang dirakit di berkas ini —
     `total + " artikel · hal " + page + "/" + pages` — karena itu masuk kamus
     sebagai FOTO SATU KEADAAN: `"102 artikel · hal 1/12"` (i18n-en.js).
     Akibatnya terukur:
       · hanya halaman 1 dengan TEPAT 102 artikel yang berlabel Inggris;
       · halaman 2 dan seterusnya berbalik Bahasa di tengah halaman Inggris;
       · begitu SATU artikel baru terbit lewat jembatan `__kMerge`, totalnya 103,
         kuncinya meleset, dan HALAMAN 1 PUN ikut berbalik Bahasa.
     Kelas yang sama ikut memakan `fmt()` (kamus memuat `"10rb"`) dan waktu baca.

     Menambahkan 12 kunci harfiah hanya MEMINDAHKAN cacatnya — angkanya tak
     terbatas, kuncinya terbatas. Jadi labelnya DISUSUN dari potongan per-bahasa
     di sini, elemennya ditandai `data-i18n-skip` supaya:
       1. penelusur simpul teks i18n.js tidak pernah menyentuhnya (kalau tidak,
          dua mekanisme menulis simpul yang sama dan "kembali ke Bahasa"
          memulihkan teks yang salah), dan
       2. `scripts/panen-bahasa.cjs` — yang menghormati atribut yang sama
          (baris 147) — tidak pernah lagi MEMOTRET angka hasil hitungan ke dalam
          kamus. Itu pagarnya: bukan catatan, melainkan atribut yang dibaca mesin.

     ⚠︎ Angka sengaja tetap Latin di ketiga bahasa, termasuk AR — sama dengan
     nilai `"10rb" → "10 آلاف"` yang sudah ada di i18n-ar.js, dan i18n.js sudah
     punya `isolasiSatuan()` yang menjaga angka Latin terbaca benar di dalam
     kalimat kanan-ke-kiri. */
  /* ⚠︎ `artikel1` = bentuk TUNGGAL, dan ia ada karena Bahasa Inggris memaksanya.
     Sebelum ini pencarian yang menemukan satu artikel berlabel "1 articles" —
     terukur di peramban 14 Agustus 2026 pada kueri "bank sampah". Indonesia dan
     Arab tidak berubah bentuk di sini, jadi nilainya sama dengan bentuk jamaknya
     dan kuncinya tetap dibaca — lebih murah daripada cabang per-bahasa. */
  /* ⚠︎ `baca` = kata di sebelah penghitung pembaca ("<b>1,2rb</b> membaca").
     Ia MASUK KE SINI, bukan ke kamus, karena alasan yang sama dengan pager:
     tetangganya angka yang berubah terus. Simpulnya memang terpisah dari
     `<b>`-nya, jadi kunci harfiah "membaca" secara teknis bisa dipakai — tapi
     "membaca" adalah kata umum, dan kamus berlaku ke SELURUH situs: satu kunci
     sependek itu akan menerjemahkan simpul teks mana pun yang kebetulan
     berbunyi sama, di halaman yang tidak ada urusannya dengan Kabar.
     ⚠︎ Nilai Inggrisnya "reads", BUKAN "reading". Angka yang ditampilkan adalah
     `counts(a).views` — jumlah KUMULATIF, bukan pembaca yang sedang membuka
     halaman saat ini. "reading" akan mengklaim keserentakan yang tidak diukur,
     dan itu jenis klaim berlebih yang dilarang aturan kejujuran proyek ini.
     `tanya` = baris kedua gelembung Gly; topiknya sendiri diterjemahkan kamus,
     lihat `teksOrb()`.
     ⚠︎ `tanya` adalah LANJUTAN kalimat, bukan kalimat utuh — dan itu terukur.
     Markup tetapnya berbunyi `Tanya Gly<b>…</b>`, dengan `.korb__tip b`
     ber-`display:block`: baris kecil di BAWAH "Tanya Gly", bukan gelembung
     kedua. Isi bawaannya "tentang artikel ini", jadi yang terbaca "Tanya Gly /
     tentang artikel ini". Sampai 14 Agustus 2026 berkas ini menimpanya dengan
     "Tanya soal <topik>" — sehingga gelembungnya berbunyi "Tanya Gly / Tanya
     soal Regulasi", dan versi Inggrisnya "Ask Gly / Ask about Regulation".
     Kata kerjanya muncul dua kali di kedua bahasa. */
  /* ⚠︎ `fotoOleh` / `fotoDi` / `fotoDari` = KATA PENGHUBUNG baris kredit gambar,
     dan ia masuk ke sini karena alasan yang PALING kuat di seluruh tabel ini:
     tetangganya adalah NAMA DIRI — nama fotografer dan nama platform. Kalau
     barisnya dibiarkan jadi satu simpul teks biasa, kunci kamus yang lahir
     adalah "Foto oleh Marek Piwnicki di Unsplash": satu kunci per fotografer,
     dan tiap gambar baru menambah satu kunci lagi yang tidak akan pernah
     ditulis. Lebih buruk: kalau kunci semacam itu KEBETULAN tertangkap panen
     kamus, mesin akan MENERJEMAHKAN NAMA ORANG. Karena itu barisnya dirakit
     per bahasa di `kreditIsi()`, dan seluruh wadahnya ber-`data-i18n-skip`.
     ⚠︎ `fotoDari` adalah cabang untuk gambar yang platformnya tercatat tetapi
     fotografernya tidak (mis. berkas Pexels lama). Ia BUKAN salinan `fotoOleh`
     tanpa nama: "Foto oleh di Pexels" bukan kalimat, dan menutupinya dengan
     nama karangan justru kebalikan dari tujuan baris ini. */
  /* ⚠︎ Label BLOK PENUTUP ikut ke sini, bukan ke kamus i18n, dan alasannya sama
     dengan pager: tetangganya angka yang berubah ("3 dari 99 artikel"). Sebuah
     kunci kamus berbunyi "3 dari 99 artikel" akan lahir baru untuk tiap artikel
     dan tidak satu pun akan pernah ditulis.
     ⚠︎ `bebasIklan` adalah label tombol langganan TANPA harga. Harganya
     ditempelkan saat jalan dari jawaban Play (`Produk.harga`) — harga langganan
     TIDAK PERNAH ditulis di dalam berkas ini. Ia berbeda per negara, per
     penawaran perkenalan, dan bisa diubah pemilik di Play Console tanpa
     menyentuh kode; angka yang ditulis di sini akan berbohong sejak hari kedua. */
  var LABEL = {
    id: { bagikanKe: "Bagikan ke", mitraBadge: "Mitra", mitraTitle: "Konten mitra — belum diverifikasi Glyiv", mitraJudul: "Konten mitra", mitraSiap: "Disiapkan bersama", mitraGlyiv: "mitra Glyiv.", mitraAwas: "Isi dan klaim di dalamnya berasal dari mitra dan belum diverifikasi Glyiv. ⚠︎", kosong: "Tak ada artikel yang cocok dengan pencarianmu.", memuatArtikel: "Memuat artikel…", takKetemu: "Artikel tidak ditemukan.", keKabar: "Kembali ke Glyiv News", storyHint: "45 detik · geser untuk lanjut", sumberJudul: "Sumber", aiUngkap: "Artikel ini disusun dengan bantuan AI lalu diperiksa dan disunting redaksi Glyiv sebelum terbit. Angka dan kutipan bersumber dari daftar di atas.", aiKebijakan: "Kebijakan redaksi", laporArtikel: "Laporkan artikel ini", lapor: "Laporkan", jeda: "❚❚ jeda", tutup: "Tutup", bagikanLain: "Bagikan lainnya", bagikanArtikel: "Bagikan artikel", bagikanSub: "Sebarkan ke jaringanmu — atau salin tautannya.", salin: "Salin", tautanDisalin: "Tautan disalin ✓", tautanIg: "Tautan disalin — tempel di Instagram Story/bio", hariIni: "Hari ini", kemarin: "Kemarin", terbit: "Terbit", diperbarui: "Diperbarui", arsipTerbaru: "Terbaru diperbarui", artikel: "artikel", artikel1: "artikel", hal: "hal", mnt: "mnt", mntBaca: "mnt baca", rb: "rb", baca: "membaca", tanya: "soal", fotoOleh: "Foto oleh", fotoDi: "di", fotoDari: "Foto dari", ilustrasiAi: "Ilustrasi AI", selesaiBaca: "Selesai dibaca", dari: "dari", berikutnya: "Artikel berikutnya", story: "Lihat sebagai Story", keDaftar: "Kembali ke daftar", bebasIklan: "Bebas iklan", memuat: "Memuat…", langgananAktif: "Terima kasih — langganan Anda aktif.", langgananGagal: "Layar langganan tidak bisa dibuka. Coba lagi nanti.", iklanJudul: "Sebelum lanjut", iklanIsi: "Glyiv News gratis karena satu layar iklan muncul setelah Anda selesai membaca — maksimal dua kali sehari di seluruh Glyiv. Tidak pernah saat Anda sedang membaca.", iklanLanjut: "Mengerti, lanjut", stAngka: "Angka", stSelesai: "Selesai", stBaca: "Baca lengkap →", stEndJudul: "Baca selengkapnya di Glyiv", stEndTeks: "Ekonomi hijau, jujur & bisa dipertanggungjawabkan." },
    en: { bagikanKe: "Share to", mitraBadge: "Partner", mitraTitle: "Partner content — not verified by Glyiv", mitraJudul: "Partner content", mitraSiap: "Prepared together with", mitraGlyiv: "a Glyiv partner.", mitraAwas: "Its content and claims come from the partner and have not been verified by Glyiv. ⚠︎", kosong: "No article matches your search.", memuatArtikel: "Loading article…", takKetemu: "Article not found.", keKabar: "Back to Glyiv News", storyHint: "45 seconds · swipe to continue", sumberJudul: "Sources", aiUngkap: "This article was drafted with AI assistance, then checked and edited by the Glyiv newsroom before publication. Figures and quotations come from the sources listed above.", aiKebijakan: "Editorial policy", laporArtikel: "Report this article", lapor: "Report", jeda: "❚❚ pause", tutup: "Close", bagikanLain: "Share another way", bagikanArtikel: "Share this article", bagikanSub: "Send it to your network — or just copy the link.", salin: "Copy", tautanDisalin: "Link copied ✓", tautanIg: "Link copied — paste it in your Instagram Story or bio", hariIni: "Today", kemarin: "Yesterday", terbit: "Published", diperbarui: "Updated", arsipTerbaru: "Last updated", artikel: "articles", artikel1: "article", hal: "page", mnt: "min", mntBaca: "min read", rb: "k", baca: "reads", tanya: "about", fotoOleh: "Photo by", fotoDi: "on", fotoDari: "Photo from", ilustrasiAi: "AI illustration", selesaiBaca: "Finished reading", dari: "of", berikutnya: "Next article", story: "View as Story", keDaftar: "Back to the list", bebasIklan: "Ad-free", memuat: "Loading…", langgananAktif: "Thank you — your subscription is active.", langgananGagal: "The subscription screen could not be opened. Please try again later.", iklanJudul: "Before you continue", iklanIsi: "Glyiv News is free because one full-screen ad appears after you finish reading — at most twice a day across all of Glyiv. Never while you are reading.", iklanLanjut: "Got it, continue", stAngka: "Number", stSelesai: "The end", stBaca: "Read the full story →", stEndJudul: "Read more on Glyiv", stEndTeks: "The green economy — honestly, and accountably." },
    ar: { bagikanKe: "مشاركة إلى", mitraBadge: "شريك", mitraTitle: "محتوى شريك — لم تتحقق منه Glyiv", mitraJudul: "محتوى شريك", mitraSiap: "أُعِدّ بالتعاون مع", mitraGlyiv: "أحد شركاء Glyiv.", mitraAwas: "المحتوى والادعاءات الواردة فيه من الشريك ولم تتحقق منها Glyiv. ⚠︎", kosong: "لا توجد مقالة تطابق بحثك.", memuatArtikel: "جارٍ تحميل المقالة…", takKetemu: "لم يتم العثور على المقالة.", keKabar: "العودة إلى Glyiv News", storyHint: "45 ثانية · اسحب للمتابعة", sumberJudul: "المصادر", aiUngkap: "أُعِدّت هذه المقالة بمساعدة الذكاء الاصطناعي، ثم راجعتها وحرّرتها هيئة تحرير Glyiv قبل النشر. الأرقام والاقتباسات مأخوذة من المصادر المذكورة أعلاه.", aiKebijakan: "سياسة التحرير", laporArtikel: "الإبلاغ عن هذه المقالة", lapor: "إبلاغ", jeda: "❚❚ إيقاف مؤقت", tutup: "إغلاق", bagikanLain: "مشاركة بطريقة أخرى", bagikanArtikel: "مشاركة المقالة", bagikanSub: "شاركها مع شبكتك — أو انسخ الرابط فقط.", salin: "نسخ", tautanDisalin: "تم نسخ الرابط ✓", tautanIg: "تم نسخ الرابط — الصقه في قصة إنستغرام أو نبذتك", hariIni: "اليوم", kemarin: "أمس", terbit: "نُشر", diperbarui: "حُدِّث", arsipTerbaru: "آخر تحديث", artikel: "مقالة", artikel1: "مقالة", hal: "صفحة", mnt: "دقيقة", mntBaca: "دقيقة قراءة", rb: " ألف", baca: "قراءة", tanya: "عن", fotoOleh: "صورة بعدسة", fotoDi: "على", fotoDari: "صورة من", ilustrasiAi: "رسم توضيحي بالذكاء الاصطناعي", selesaiBaca: "انتهت القراءة", dari: "من", berikutnya: "المقالة التالية", story: "عرض كقصة", keDaftar: "العودة إلى القائمة", bebasIklan: "بدون إعلانات", memuat: "جارٍ التحميل…", langgananAktif: "شكرًا لك — اشتراكك مُفعّل.", langgananGagal: "تعذّر فتح شاشة الاشتراك. حاول مرة أخرى لاحقًا.", iklanJudul: "قبل المتابعة", iklanIsi: "‏Glyiv News مجاني لأن إعلانًا واحدًا بملء الشاشة يظهر بعد انتهائك من القراءة — مرتين كحد أقصى يوميًا في Glyiv كله. ولا يظهر أبدًا أثناء القراءة.", iklanLanjut: "فهمت، تابع", stAngka: "رقم", stSelesai: "النهاية", stBaca: "اقرأ المقالة كاملة ←", stEndJudul: "اقرأ المزيد على Glyiv", stEndTeks: "الاقتصاد الأخضر — بصدق وبمسؤولية." },
  };
  function bahasaKini() {
    var l;
    try { l = (window.GlyivI18n && window.GlyivI18n.lang) || window.GLYIV_LANG; } catch (e) {}
    return LABEL[l] ? l : "id";
  }
  function kata(k) { return LABEL[bahasaKini()][k]; }

  /* ── NASKAH PER BAHASA ────────────────────────────────────────────────────
     Kenapa ini ada, dan kenapa BUKAN lewat kamus i18n:

     Kamus `i18n-{en,ar}.js` berkunci TEKS INDONESIA dan dipasang dengan
     menyusuri simpul teks DOM. Untuk label antarmuka itu tepat. Untuk isi
     artikel ia salah dua kali:
       1. kuncinya adalah kalimatnya sendiri, jadi setiap kali sebuah kalimat
          Indonesia disunting — persis yang dilakukan ronde QC narasi —
          terjemahannya MATI dan paragraf itu diam-diam kembali berbahasa
          Indonesia di tengah halaman Inggris. Tidak ada galat;
       2. 1.324 potong teks × dua bahasa akan menambah ±1 MB pada kamus yang
          diunduh di SETIAP halaman, padahal yang dibutuhkan hanya satu artikel.

     Karena itu naskah artikel disimpan PER ARTIKEL (`blocksEn`, `blocksAr`, …)
     dan dipilih di sini, saat render — bukan saat `norm()`, sebab bahasa bisa
     berubah setelah halaman tergambar dan penggantinya harus ikut berubah.

     Jatuh-balik per MEDAN, bukan per artikel: artikel yang baru punya `titleEn`
     tetap menampilkan judul Inggris di atas badan Indonesia — jelek, tapi jujur
     dan tidak kosong. Yang tidak boleh terjadi adalah halaman hampa. */
  function naskah(a) {
    var l = bahasaKini();
    if (!a || l === "id") return a;
    var suf = l === "en" ? "En" : "Ar";
    var o = null;
    ["title", "dek", "hook", "role", "topic", "blocks", "sources", "story"].forEach(function (k) {
      var v = a[k + suf];
      var kosong = !v || (v.length === 0);
      if (kosong) return;
      if (!o) { o = {}; for (var x in a) if (Object.prototype.hasOwnProperty.call(a, x)) o[x] = a[x]; }
      o[k] = v;
    });
    /* ⛔ STORY TIDAK BOLEH DIBIARKAN JATUH KE `deriveStory()` APA ADANYA.
       99 dari 102 artikel MENYIMPAN `story` sendiri, dan `deriveStory()`
       mengembalikan yang tersimpan itu bila ada. Jadi artikel yang punya
       `blocksEn` tetapi tidak punya `storyEn` akan menampilkan badan berbahasa
       Inggris dengan kartu Story berbahasa Indonesia — dan Story justru
       permukaan yang paling sering dibagikan ulang.
       Kalau naskah terjemahannya tidak menyediakan `story`, ia diturunkan dari
       `blocks` yang SUDAH diterjemahkan, dengan menyingkirkan `story` lama
       lebih dulu supaya turunannya benar-benar dipakai. */
    if (o && !a["story" + suf] && o.blocks !== a.blocks) {
      var tanpaStory = {};
      for (var y in o) if (Object.prototype.hasOwnProperty.call(o, y)) tanpaStory[y] = o[y];
      tanpaStory.story = null;
      o.story = deriveStory(tanpaStory);
    }
    return o || a;
  }
  /** "102 artikel · hal 1/12" · "102 articles · page 1/12" · "102 مقالة · صفحة 1/12" */
  function labelPager(total, page, pages) {
    if (pages <= 1) return total + " " + kata(total === 1 ? "artikel1" : "artikel");
    return total + " " + kata("artikel") + " · " + kata("hal") + " " + page + "/" + pages;
  }
  /** Satu kata/frasa data (topik) lewat kamus, kalau mesinnya sudah ada. */
  function alih1(t) {
    try { if (window.GlyivI18n && window.GlyivI18n.t) return window.GlyivI18n.t(t); } catch (e) {}
    return t;
  }
  /** Baris kedua gelembung Gly: "soal Regulasi" · "about Regulation" · "عن التنظيم" */
  function teksOrb(a) { return a.orb || (kata("tanya") + " " + alih1(a.orbTopik)); }
  var fmt = function (n) { n = n || 0; return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + kata("rb") : String(n); };
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

  /* ══════════════════════════════════════════════════════════════════════════
     STORY DAN KARTU MEDIA SOSIAL ADALAH SATU BENDA — MAKA JUMLAHNYA SAMA: 4
     ══════════════════════════════════════════════════════════════════════════

     Pemilik, 20 Agustus 2026, apa adanya: *"story dan social media card itu
     satu. Jadi di mode story artikel itu basically social media card yang
     ditampilkan."*

     Sampai hari ini kalimat itu hanya benar di satu sisi. Konsol admin sudah
     memangkas tiap postingan jadi EMPAT kartu (`POST_CARD_COUNT` di
     `src/pages/admin/newsletter/storyCard.ts`, karena X hanya menerima empat
     gambar per posting), sementara halaman publik menyajikan `story` tersimpan
     apa adanya — dan diukur atas `dist/lab/kabar/content-pack.js`, KESEMBILAN
     PULUH SEMBILAN artikel menyimpan `story` sepanjang TUJUH. Jadi pembaca
     melihat 7 kartu untuk benda yang di konsol berjumlah 4. Dua jumlah untuk
     satu benda berarti ia bukan satu benda.

     ⛔ TIGA KARTU YANG DIBUANG ADALAH ISI REDAKSI, JADI TIDAK DIPOTONG BUTA.
     Memangkas "empat pertama" akan membuang kartu PENUTUP — kartu yang membawa
     ajakan membaca — pada 99 dari 99 artikel, dan jumlahnya tetap 4 sehingga
     tidak ada penghitung yang mengeluh. Aturannya karena itu ditulis:

       1. kartu SAMPUL selalu ikut (kartu `cover` pertama; kalau tidak ada,
          kartu pertama apa adanya);
       2. kartu PENUTUP selalu ikut, dan selalu terakhir (kartu `end` terakhir
          yang berada sesudah sampul; kalau tidak ada, kartu terakhir);
       3. dua kartu tengah dipilih menurut peringkat `MIDDLE_RANK` di bawah —
          `hook` lalu `stat` lalu `quote`, dan `point` kalah paling akhir sebab
          ia yang paling sering berulang (diukur: tiap story menyimpan 2–3
          `point`, tetapi hanya satu `stat`);
       4. seri diputus oleh urutan aslinya, jadi hasilnya tidak pernah acak.

     ⛔ TIDAK ADA SATU KALIMAT PUN YANG DIRINGKAS ATAU DITULIS ULANG DI SINI.
     Kartu yang tidak terpilih dibuang utuh. Menggabung dua klaim iklim tanpa
     ada manusia yang membacanya persis risiko yang dijaga aturan kejujuran.

     ⛔ SALINANNYA ADA DI `storyCard.ts`, DAN KEDUANYA DIADU, BUKAN DIPERCAYA.
     `scripts/check-card-count.cjs` MENGAMBIL blok di antara penanda
     `<ATURAN-4-KARTU>` di bawah, MENJALANKANNYA, lalu membandingkan hasilnya
     dengan `toPostCards()` versi TypeScript atas ke-99 artikel korpus, kartu
     demi kartu, medan demi medan. Dua aturan yang sama hari ini tetapi ditulis
     di dua tempat akan berpisah suatu hari; yang menahannya adalah gerbang itu,
     bukan komentar ini. Menyunting yang satu tanpa yang lain = gerbang merah. */

  /* <ATURAN-4-KARTU> */
  var POST_CARD_COUNT = 4;
  var MIDDLE_RANK = { hook: 0, stat: 1, quote: 2, point: 3, cover: 4, end: 5 };
  function emptyStoryCard(kind) {
    return { kind: kind, title: "", text: "", big: "", label: "", source: "" };
  }
  function toPostCards(cards) {
    var list = Object.prototype.toString.call(cards) === "[object Array]" ? cards : [];
    if (list.length === POST_CARD_COUNT) return list;

    if (list.length > POST_CARD_COUNT) {
      var openIndex = 0;
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].kind === "cover") { openIndex = i; break; }
      }
      var closeIndex = list.length - 1;
      for (var j = list.length - 1; j > openIndex; j--) {
        if (list[j] && list[j].kind === "end") { closeIndex = j; break; }
      }
      var middle = [];
      for (var m = openIndex + 1; m < closeIndex; m++) {
        var kind = list[m] && list[m].kind;
        var rank = Object.prototype.hasOwnProperty.call(MIDDLE_RANK, kind)
          ? MIDDLE_RANK[kind]
          : MIDDLE_RANK.point;
        middle.push({ card: list[m], order: m, rank: rank });
      }
      middle.sort(function (a, b) { return a.rank - b.rank || a.order - b.order; });
      var keep = middle.slice(0, POST_CARD_COUNT - 2);
      keep.sort(function (a, b) { return a.order - b.order; });
      var out = [list[openIndex]];
      for (var k = 0; k < keep.length; k++) out.push(keep[k].card);
      out.push(list[closeIndex]);
      list = out;
    }

    /* Terlalu pendek: disulam kartu KOSONG, tidak pernah kalimat karangan. Sisip
       SEBELUM kartu penutup supaya penutupnya tetap terakhir. */
    var padded = list.slice();
    while (padded.length < POST_CARD_COUNT) {
      var last = padded.length > 0 ? padded[padded.length - 1] : null;
      var atEnd = last && last.kind === "end";
      padded.splice(atEnd ? padded.length - 1 : padded.length, 0, emptyStoryCard("point"));
    }
    return padded;
  }
  /* </ATURAN-4-KARTU> */

  function deriveStory(a) {
    if (a.story && a.story.length) return toPostCards(a.story);
    var s = [{ kind: "cover", title: a.title, text: a.dek }];
    if (a.hook) s.push({ kind: "hook", title: a.hook });
    (a.blocks || []).forEach(function (b) {
      if (b.t === "h2") s.push({ kind: "point", title: b.x });
      else if (b.t === "pull") s.push({ kind: "quote", text: b.x });
      else if (b.t === "stat") s.push({ kind: "stat", big: b.n, label: b.l, source: b.s });
    });
    s.push({ kind: "end", title: kata("stEndJudul"), text: kata("stEndTeks") });
    /* ⛔ `slice(0, 8)` DIGANTI, BUKAN DILONGGARKAN. Batas delapan itu potongan
       dari EKOR: ia membuang kartu penutup persis pada artikel yang paling
       panjang. `toPostCards` memilih, bukan memotong. */
    return toPostCards(s);
  }
  /* ══ KREDIT GAMBAR SAMPUL — medan `coverCredit` ═══════════════════════════════
     ⛔ KENAPA MEDAN BARU, DAN KENAPA BUKAN DI DALAM `blocks`.
     `blocks` adalah BADAN ARTIKEL: yang ada di sana ikut diringkas
     `deriveStory()`, ikut dibongkar-pasang komposer Studio (`dariBlok()` /
     `keBlok()` di kabar-admin.js), dan ikut disunting siapa pun yang mengedit
     narasinya. Menyisipkan kredit ke sana berarti satu suntingan salah
     menghapus catatan asal-usul gambar tanpa ada yang tahu — dan catatan itu
     ada justru untuk saat seseorang bertanya dari mana gambarnya datang.
     Kredit gambar adalah METADATA aset, umurnya sama dengan `cover`, jadi ia
     tinggal bersebelahan dengan `cover`.

     Bentuknya:
       coverCredit: {
         by:     "Marek Piwnicki",                    // nama fotografer
         on:     "Unsplash",                          // nama platform
         url:    "https://unsplash.com/photos/<id>",  // halaman foto aslinya
         lic:    "Unsplash License",                  // opsional — diisi otomatis
         licUrl: "https://unsplash.com/license"       // opsional — diisi otomatis
       }
     `by` dan `on` sengaja dinamai persis seperti kalimatnya ("Photo BY … ON …"),
     supaya yang mengisi data tahu bagian kalimat mana yang sedang ia isi.

     ⚠︎ LISENSI DITURUNKAN DARI PLATFORM, BUKAN DIKETIK ULANG 87 KALI. Unsplash
     dan Pexels masing-masing punya SATU lisensi untuk seluruh katalognya, jadi
     mengharuskan tiap artikel mengetik nama + alamat lisensinya sendiri hanya
     menambah 174 tempat untuk salah ketik. Yang mengisi data cukup menulis
     fotografer + platform + alamat fotonya; kalau suatu hari ada gambar dengan
     lisensi lain, `lic`/`licUrl` boleh ditulis eksplisit dan menang.

     ⚠︎ Platform DI LUAR daftar ini tidak mengarang lisensi apa pun — barisnya
     tampil tanpa tautan lisensi. Menebak lisensi adalah persis jenis klaim yang
     berkas ini seharusnya mencegah. */
  var PLATFORM = {
    unsplash: { nama: "Unsplash", lic: "Unsplash License", licUrl: "https://unsplash.com/license" },
    pexels: { nama: "Pexels", lic: "Pexels License", licUrl: "https://www.pexels.com/license/" },
  };
  /** Bentuk apa pun → objek kredit yang siap digambar, atau `null` kalau kosong. */
  function kreditNorm(k) {
    if (!k) return null;
    /* Bentuk pendek: satu string = nama fotografernya saja. Ada supaya catatan
       yang cuma tahu namanya tetap bisa masuk tanpa membungkusnya jadi objek. */
    if (typeof k === "string") k = { by: k };
    if (typeof k !== "object") return null;
    var by = String(k.by || k.oleh || "").trim();
    var on = String(k.on || k.platform || "").trim();
    /* Bentuk AI: tidak punya `by` maupun `on` sama sekali, jadi ia harus lolos
       SEBELUM penjaga di bawah — kalau tidak, barisnya hilang tanpa jejak dan
       hero bangkitan AI tampil tanpa pengakuan. */
    if (k.ai === true) return { ai: true, by: "", on: "", url: "", lic: "", licUrl: "" };
    if (!by && !on) return null;   // tidak ada yang bisa dikreditkan → tidak ada baris
    var p = PLATFORM[on.toLowerCase()] || null;
    return {
      by: by,
      on: on ? (p ? p.nama : on) : "",   // pembetulan huruf besar-kecil: "unsplash" → "Unsplash"
      url: String(k.url || "").trim(),
      lic: String(k.lic || (p ? p.lic : "")).trim(),
      licUrl: String(k.licUrl || (p ? p.licUrl : "")).trim(),
    };
  }
  /* ⛔ DUA BENTUK DOKUMEN MASUK KE SINI, DAN NAMANYA BERBEDA.
     `window.KABAR` (content-pack statis) memakai `topic` dan `read`.
     Dokumen Firestore `kabar_articles` memakai `category` dan `readMinutes` —
     dan `kabar-live.js` meneruskannya MENTAH ke `__kMerge` (baris 101), tanpa
     memetakan nama field.

     Sampai 14 Agustus 2026 selisih itu tidak pernah terlihat karena tidak ada
     satu pun artikel yang benar-benar datang dari Firestore. Begitu artikel
     terjadwal mulai tiba, tiap kartunya akan berlencana "Kabar" alih-alih
     "Regulasi"/"Offset"/…, dan waktu bacanya 4 menit untuk semua — bukan galat,
     bukan kotak kosong, sekadar salah tanpa ada yang mengeluh. Menerima KEDUA
     nama di sini menutupnya di satu tempat, untuk content-pack maupun untuk
     artikel yang ditulis lewat Studio. */
  /**
   * URL keempat kartu media sosial artikel ini, TERURUT, atau `[]`.
   *
   * ⛔ KEMBARAN `kartuSosial()` DI kabar-fb.js, DAN GERBANGNYA MENGADU KEDUANYA.
   * Berkas ini skrip biasa dan tidak bisa mengimpor modul ESM itu, jadi ada dua
   * salinan aturan yang sama. Dua salinan berarti keduanya bisa MENYIMPANG;
   * `check-story-cards.cjs` karena itu menjalankan keduanya atas masukan yang
   * sama dan menuntut jawabannya identik.
   *
   * Diurutkan menurut `index`, bukan menurut posisi array — keduanya kebetulan
   * sama hari ini, dan ketika tidak, Story akan membuka dengan kartu 3.
   * Mengembalikan `[]` kecuali keempatnya ada: Story setengah gambar setengah
   * teks terbaca seperti halaman rusak.
   */
  function kartuSosialDari(a) {
    if (a && Array.isArray(a.cardImages) && a.cardImages.length === 4) return a.cardImages;
    var r = a && a.socialCards && a.socialCards.rendered;
    var daftar = (r && Array.isArray(r.cards)) ? r.cards.slice() : [];
    if (daftar.length !== 4) return [];
    daftar.sort(function (x, y) { return Number((x && x.index) || 0) - Number((y && y.index) || 0); });
    var url = daftar.map(function (k) { return String((k && k.url) || "").trim(); });
    return url.every(function (u) { return !!u; }) ? url : [];
  }

  function norm(a, i) {
    var slug = a.slug || ("art-" + i);
    return {
      slug: slug, _i: i, topic: a.topic || a.category || "Kabar", mood: a.mood || "#1F7A6B",
      /* ⛔ KETIGA KALINYA MEDAN HILANG DI FUNGSI INI — BACA DUA CATATAN DI BAWAH
         SEBELUM MENAMBAH APA PUN KE DATA ARTIKEL.
         `norm()` menyalin medan SATU PER SATU, jadi medan baru yang tidak
         disebutkan di sini DIBUANG diam-diam. Dua korban sebelumnya sudah
         tercatat di bawah (`hookEn`/`hookAr`, lalu `storyEn`/`storyAr`).
         Korban ketiga, 21 Agustus 2026, ditemukan di situs HIDUP sesudah deploy:
         `slugEn` dan `cardImages` ada lengkap di content-pack (99/99) dan di
         `kabar-fb.js`, tetapi hilang di sini — sehingga alamat Inggris tidak
         menyelesaikan ke artikel mana pun (halaman tergantung di "memuat
         artikel…") dan Story tetap menggambar slide teks alih-alih kartu media
         sosial. KEDUA gerbangnya hijau, karena keduanya menguji pack dan
         `kabar-fb.js`, bukan jalur ini. */
      slugEn: a.slugEn || "",
      cardImages: kartuSosialDari(a),
      title: a.title || "", dek: a.dek || "", hook: a.hook || a.dek || a.title,
      cover: a.cover || "", author: a.author || "Glyiv Team", role: a.role || "",
      /* ⚠︎ `kreditGambar` diterima sebagai nama lama/alias supaya catatan yang
         ditulis dengan nama itu tidak hilang diam-diam. Kanonisnya
         `coverCredit` — satu nama yang dipakai renderer, Studio, dan Firestore. */
      coverCredit: kreditNorm(a.coverCredit || a.kreditGambar),
      read: a.read || a.readMinutes || 4,
      /* ⛔ `orb` DISIMPAN MENTAH, TIDAK LAGI DIRAKIT DI SINI. Sampai 14 Agustus
         2026 baris ini menulis `"Tanya soal " + topik` — satu simpul teks utuh
         yang lahir dari data, sehingga kamus harus memuat satu kunci per topik
         ("Tanya soal Regulasi", "Tanya soal Offset", …) dan setiap topik BARU
         yang ditulis lewat Studio langsung berbahasa Indonesia di halaman
         Inggris, tanpa ada yang tahu. Kelas cacat yang sama dengan pager.
         Sekarang topiknya disimpan apa adanya dan kalimatnya disusun per bahasa
         di `teksOrb()`; topiknya sendiri diterjemahkan kamus (kunci "Regulasi",
         "Offset", … memang sudah ada). */
      blocks: a.blocks || [], story: deriveStory(a), sources: a.sources || [], orb: a.orb || "", orbTopik: a.topic || a.category || "ini",
      views: a.views || 0, likes: a.likes || 0, shares: a.shares || 0,
      /* ⛔ NASKAH TERJEMAHAN DIBAWA APA ADANYA — lihat `naskah()` di bawah.
         Sampai 14 Agustus 2026 medan-medan ini dibuang di sini, dan itulah
         sebabnya halaman `?lang=en` menampilkan judul Inggris di atas SELURUH
         badan artikel berbahasa Indonesia, sementara `?lang=ar` tidak memuat
         satu kata Arab pun. Terukur atas 102 artikel: dari 1.324 potong teks
         yang tampil, EN punya 306 (judul/dek/kredit saja) dan AR punya 0. */
      titleEn: a.titleEn || "", dekEn: a.dekEn || "", roleEn: a.roleEn || "",
      blocksEn: a.blocksEn || null, sourcesEn: a.sourcesEn || null, topicEn: a.topicEn || "",
      titleAr: a.titleAr || "", dekAr: a.dekAr || "", roleAr: a.roleAr || "",
      blocksAr: a.blocksAr || null, sourcesAr: a.sourcesAr || null, topicAr: a.topicAr || "",
      /* ⛔ `hook` DAN `story` IKUT — DAFTAR DI ATAS MASIH KURANG DUA.
         `naskah()` menukar delapan medan: title, dek, hook, role, topic, blocks,
         sources, story. Tetapi sampai 16 Agustus 2026 `norm()` hanya meneruskan
         ENAM di antaranya; `hookEn`/`hookAr` dan `storyEn`/`storyAr` dibuang di
         sini, sehingga `naskah()` tidak punya apa pun untuk ditukar dan diam-diam
         mempertahankan versi Indonesia.
         Akibat nyatanya terlihat di mode Story: `deriveStory()` adalah
         satu-satunya perender `a.hook`, jadi tiap Story berbahasa Arab menyisipkan
         SATU kalimat berbahasa Indonesia di tengahnya. Terukur: `hookEn` dan
         `hookAr` ADA pada seluruh 102 artikel — datanya lengkap, hanya jalannya
         yang terputus di baris ini.
         `storyEn`/`storyAr` belum ada di data mana pun (terukur: 0 dari 102);
         ia diteruskan supaya kelas cacat yang sama tidak lahir lagi saat Studio
         mulai menulisnya. */
      hookEn: a.hookEn || "", hookAr: a.hookAr || "",
      storyEn: a.storyEn || null, storyAr: a.storyAr || null,
      /* ⛔ `publishAt` HARUS IKUT. Ia dibuang di sini sampai 16 Agustus 2026,
         dan cacatnya menyamar dengan baik: penyaring jadwal (`sudahWaktunya`)
         bekerja pada artikel MENTAH, jadi artikel terjadwal memang tetap
         tersembunyi dan semuanya terlihat benar. Yang tidak terlihat: pengurut
         bekerja SESUDAH normalisasi, dan di sana tanggalnya sudah hilang —
         `waktuTerbit()` mengembalikan 0 untuk semua artikel, seluruh daftar
         seri, dan pemutus serinya (`_i`) yang menentukan. Hasilnya kartu HERO
         menampilkan artikel yang kebetulan terakhir di berkas, bukan yang baru
         terbit. Pemilik melihatnya sebagai "Telegram mengirim artikel baru tapi
         hero-nya artikel lain".

         Normalisasi yang MEMBUANG medan diam-diam adalah kelas cacat tersendiri:
         yang membuang tidak tahu siapa yang akan membutuhkannya nanti. */
      publishAt: a.publishAt != null ? a.publishAt : null,
      /* enum tertutup — lihat catatan panjang di kabar-fb.js `normalize()` */
      jenis: a.jenis === "mitra" ? "mitra" : "redaksi", mitra: a.mitra || "",
    };
  }
  /* ⛔ PENJADWALAN BERLAKU UNTUK KEDUA LAPISAN, BUKAN HANYA FIRESTORE.
     `kabar-live.js` sudah melewati dokumen ber-`publishAt` di masa depan, tetapi
     content-pack statis di bawahnya TIDAK punya penyaring apa pun. Akibatnya
     "jadwalkan 89 artikel besok" tidak menyembunyikan apa-apa: versi statis
     lamanya tetap tergambar hari ini, dan pemilik melihat persis artikel yang
     ia minta ditunda.

     Ditemukan 14 Agustus 2026, saat menyiapkan penerbitan 10-sekarang/89-besok.
     Penyaring yang sama dipasang di sini supaya SATU aturan berlaku: sebuah
     artikel tayang bila `publishAt` sudah lewat, dari mana pun ia datang.
     Entri tanpa `publishAt` dianggap sudah tayang — itu perilaku lama, dan
     memutarbalikkannya akan mengosongkan halaman pada pack mana pun yang belum
     dibubuhi stempel. */
  /* ══ JAM TAYANG: 07:00 WAKTU SETEMPAT PEMBACA ════════════════════════════════
     Permintaan pemilik, 15 Agustus 2026: *"Saya mau ubah jam tayangnya menjadi
     setiap jam 07:00 pagi. Kalau bisa tidak peduli di mana orang itu berada, dia
     akan publish jam 7 pagi waktu setempat."*

     Sebuah `publishAt` adalah SATU titik waktu — satu instan yang sama untuk
     seluruh dunia. Menayangkan "jam 7 pagi di mana pun" karena itu tidak bisa
     dijawab dengan satu stempel waktu; ia harus dihitung ulang di peramban
     tiap pembaca. Yang dilakukan di sini:

       1. dari `publishAt`, ambil TANGGAL terbitnya menurut zona rujukan tetap
          (UTC+8, zona pemilik). Ini yang menentukan artikel mana milik hari mana;
       2. bandingkan dengan pukul 07:00 pada tanggal itu, DI ZONA PEMBACA.

     Jadi artikel bertanggal 15 Agustus muncul pukul 07:00 tanggal 15 Agustus —
     di Jakarta, di Kuala Lumpur, di London, di mana pun pembacanya berada.
     Pembaca di zona yang lebih barat melihatnya belakangan menurut jam dunia,
     tetapi pada jam pagi yang sama menurut jamnya sendiri, dan itulah yang
     diminta.

     ⚠︎ Telegram tidak bisa mengikuti aturan ini: satu kanal mengirim satu pesan
     pada satu instan untuk semua anggotanya. Fungsi pengirimnya karena itu
     memakai 07:00 zona rujukan (UTC+8). Perbedaan itu disengaja dan dicatat di
     sini supaya tidak dikira cacat. */
  var ZONA_RUJUKAN_MENIT = 8 * 60;        // UTC+8, zona pemilik

  function tayangSejak(a) {
    if (!a || a.publishAt == null) return 0;
    /* Dokumen Firestore membawa Timestamp (objek ber-toMillis/seconds), bukan
       untai ISO. Date.parse(objek) = NaN, dan NaN diam-diam jadi 0 — seluruh
       daftar seri lalu diurutkan pemutus seri. Ketiga bentuk ditangani. */
    var t = typeof a.publishAt === "number" ? a.publishAt
      : (a.publishAt && typeof a.publishAt.toMillis === "function") ? a.publishAt.toMillis()
      : (a.publishAt && a.publishAt.seconds != null) ? a.publishAt.seconds * 1000
      : Date.parse(a.publishAt);
    if (!t || isNaN(t)) return 0;
    /* Tanggal terbit menurut zona rujukan — bukan menurut zona pembaca, sebab
       kalau tanggalnya ikut bergeser maka pembaca di zona timur dan barat bisa
       melihat urutan artikel yang berbeda. */
    var d = new Date(t + ZONA_RUJUKAN_MENIT * 60000);
    var y = d.getUTCFullYear(), m = d.getUTCMonth(), hari = d.getUTCDate();
    /* Pukul 07:00 pada tanggal itu, di zona PEMBACA. `new Date(y, m, d, 7)`
       memang ditafsirkan sebagai waktu setempat — itu yang dibutuhkan. */
    return new Date(y, m, hari, 7, 0, 0, 0).getTime();
  }
  function sudahWaktunya(a) {
    if (!a || a.publishAt == null) return true;
    return Date.now() >= tayangSejak(a);
  }
  window.__kTayangSejak = tayangSejak;   // dipakai kabar-live.js supaya SATU aturan berlaku

  /* ══ TANGGAL TERBIT YANG TERLIHAT ═══════════════════════════════════════════
     ⛔ INI SYARAT PENERBITAN, BUKAN HIASAN. Google Play menolak `co.glyiv.news`
     pada 19 Agustus 2026 dengan salah satu alasannya berbunyi persis:
     *"Content's age cannot be verified either in-app or website."*

     Terukur di glyiv.io/news sebelum blok ini ada:
     `document.querySelectorAll('time').length === 0` di halaman daftar DAN di
     halaman artikel, dan tidak ada satu pun `article:published_time`. Umur isi
     memang tidak bisa diperiksa siapa pun — peninjau Play maupun pembaca.

     Tanggal yang ditampilkan adalah tanggal terbit menurut ZONA RUJUKAN (UTC+8),
     bukan hasil `tayangSejak()` yang dihitung ulang di zona pembaca. Alasannya:
     `tayangSejak()` sengaja menggeser JAM munculnya supaya jatuh pukul 07:00 di
     mana pun pembaca berada, sementara TANGGAL artikel harus satu untuk semua
     orang — kalau tidak, pembaca di Los Angeles dan di Jakarta melihat dua
     tanggal berbeda pada artikel yang sama, dan tanggal yang berbeda-beda justru
     kebalikan dari "umurnya bisa diperiksa".

     Semua perhitungan di bawah memakai anggapan UTC (`Date.UTC` + `timeZone:
     "UTC"`) supaya zona peramban tidak pernah menggeser tanggalnya semalam. */
  var DATE_LOCALE = { id: "id-ID", en: "en-GB", ar: "ar" };

  /** Milidetik `publishAt` dalam bentuk apa pun (ISO · angka · Timestamp) → angka, atau 0. */
  function publishMs(a) {
    if (!a || a.publishAt == null) return 0;
    var t = typeof a.publishAt === "number" ? a.publishAt
      : (a.publishAt && typeof a.publishAt.toMillis === "function") ? a.publishAt.toMillis()
      : (a.publishAt && a.publishAt.seconds != null) ? a.publishAt.seconds * 1000
      : Date.parse(a.publishAt);
    return t && !isNaN(t) ? t : 0;
  }

  /**
   * Tengah malam UTC pada TANGGAL terbit menurut zona rujukan.
   * Dipakai sebagai satu-satunya jangkar untuk ISO, label, dan selisih hari,
   * supaya ketiganya tidak bisa berselisih.
   */
  function publishMidnightUtc(a) {
    var t = publishMs(a);
    if (!t) return null;
    var d = new Date(t + ZONA_RUJUKAN_MENIT * 60000);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  /** "YYYY-MM-DD" untuk atribut `datetime` dan `<meta article:published_time>`. */
  function publishIso(a) {
    var d = publishMidnightUtc(a);
    return d ? d.toISOString().slice(0, 10) : "";
  }

  /** Hari ini menurut zona rujukan, sebagai tengah malam UTC. Pasangan `publishMidnightUtc`. */
  function todayMidnightUtc() {
    var n = new Date(Date.now() + ZONA_RUJUKAN_MENIT * 60000);
    return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
  }

  /** Selisih hari penuh: 0 = hari ini, 1 = kemarin. `null` kalau tanpa `publishAt`. */
  function ageInDays(a) {
    var d = publishMidnightUtc(a);
    if (!d) return null;
    return Math.round((todayMidnightUtc().getTime() - d.getTime()) / 864e5);
  }

  /**
   * Label tanggal untuk pembaca. Absolut selalu — "3 hari lalu" saja TIDAK cukup
   * untuk syarat Play, sebab ia tidak menyebut umur isi yang lebih tua dari
   * seminggu. Yang relatif hanya DITAMBAHKAN untuk hari ini & kemarin.
   */
  function publishLabel(a) {
    var d = publishMidnightUtc(a);
    if (!d) return "";
    var l = bahasaKini(), umur = ageInDays(a);
    if (umur === 0) return kata("hariIni");
    if (umur === 1) return kata("kemarin");
    var abs;
    try {
      abs = new Intl.DateTimeFormat(DATE_LOCALE[l] || "en-GB",
        { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
    } catch (e) { abs = d.toISOString().slice(0, 10); }   /* peramban tanpa Intl: ISO tetap terbaca */
    return abs;
  }

  /**
   * `<time>` sungguhan — bukan `<span>` bergaya tanggal.
   * `datetime` yang bisa diurai mesin adalah bagian yang membuat klaim "umurnya
   * bisa diperiksa" bisa dibuktikan otomatis, dan `data-date` membuatnya ikut
   * berganti saat pembaca mengganti bahasa (lihat `segarkanLabel`).
   */
  function timeHTML(a, cls) {
    var iso = publishIso(a);
    if (!iso) return "";
    return '<time class="' + (cls || "kdate") + '" datetime="' + iso + '" data-i18n-skip data-date="' +
      esc(a.slug) + '">' + esc(publishLabel(a)) + "</time>";
  }
  window.__kPublishIso = publishIso;
  window.__kPublishLabel = publishLabel;

  /**
   * "Last updated 23 Aug 2026 · 47 articles" — cap kesegaran daftar.
   *
   * Dihitung dari artikel TERBARU yang benar-benar tayang, bukan dari `Date.now()`.
   * Kalau ia memakai jam sekarang, ia akan berbunyi "diperbarui hari ini" pada
   * feed yang membeku seminggu — persis kebohongan yang membuat Play menolak.
   * Bila arsipnya memang basi, baris ini HARUS memperlihatkannya.
   */
  function archiveStampText() {
    var d = window.__kData || [];
    if (!d.length) return "";
    var baru = null;
    for (var i = 0; i < d.length; i++) {
      var t = publishMs(d[i]);
      if (t && (!baru || t > publishMs(baru))) baru = d[i];
    }
    var n = d.length + " " + kata(d.length === 1 ? "artikel1" : "artikel");
    if (!baru) return n;
    return kata("arsipTerbaru") + " " + publishLabel(baru) + " · " + n;
  }
  function renderArchiveStamp() {
    var e = document.querySelector("[data-archive-updated]");
    if (e) e.textContent = archiveStampText();
  }
  window.__kRenderArchiveStamp = renderArchiveStamp;

  /* ── METADATA UMUR ISI YANG BISA DIBACA MESIN ──────────────────────────────
     Tanggal di layar menjawab pembaca; `article:published_time` dan JSON-LD
     `NewsArticle` menjawab MESIN — dan pemeriksa kepatuhan Play, perayap Google
     News, serta pratinjau tautan semuanya membaca yang kedua, bukan yang pertama.

     ⛔ DIPASANG DARI JS, BUKAN DARI MARKUP HALAMAN, dan itu keputusan sadar:
     satu halaman artikel melayani 102 slug lewat `?a=` / `/news/article/<slug>`,
     jadi tidak ada satu pun tanggal yang benar untuk ditulis di `<head>` statis.
     Sekaligus ini melewati jebakan porter yang sudah tercatat: `port-dist-page.cjs`
     TIDAK memindahkan `<meta>` dari dist ke versi React, sehingga apa pun yang
     ditulis di `<head>` dist akan HILANG di glyiv.web.app — yaitu justru versi
     yang dibungkus APK. Yang dipasang dari JS ikut ke kedua-duanya. */
  function setMetaTag(kunci, nilai, pakaiName) {
    var atr = pakaiName ? "name" : "property";
    var el = document.head.querySelector("meta[" + atr + '="' + kunci + '"]');
    if (!nilai) { if (el) el.parentNode.removeChild(el); return; }
    if (!el) { el = document.createElement("meta"); el.setAttribute(atr, kunci); document.head.appendChild(el); }
    el.setAttribute("content", nilai);
  }

  function setArticleMeta(a) {
    var iso = publishIso(a);
    setMetaTag("article:published_time", iso);
    setMetaTag("article:modified_time", iso);
    setMetaTag("article:author", a && a.author ? a.author : "");
    setMetaTag("article:section", a && a.topic ? a.topic : "");
    setMetaTag("date", iso, true);           /* dibaca sebagian perayap berita lama */

    var lama = document.getElementById("kldjson");
    if (lama) lama.parentNode.removeChild(lama);
    if (!a || !iso) return;
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "kldjson";
    s.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: a.title,
      description: a.dek || "",
      datePublished: iso,
      dateModified: iso,
      inLanguage: bahasaKini(),
      author: { "@type": "Organization", name: a.author || "Glyiv Team" },
      publisher: { "@type": "Organization", name: "Glyiv News", url: "https://glyiv.io/news" },
      mainEntityOfPage: { "@type": "WebPage", "@id": location.href },
      isAccessibleForFree: true
    });
    document.head.appendChild(s);
  }

  var DATA = (window.KABAR || []).filter(sudahWaktunya).map(norm);
  window.__kData = DATA;
  /* ⛔ DUA ALAMAT, SATU ARTIKEL — DAN `slug` DIPERIKSA LEBIH DULU.
     Sejak alamat Inggris ada (`slugEn`), satu artikel bisa dipanggil dengan dua
     nama. Slug asli didahulukan supaya setiap tautan yang pernah dibagikan tetap
     mendarat di tempat yang sama persis, bahkan seandainya alamat Inggris sebuah
     artikel kebetulan sama dengan slug artikel lain. */
  window.__kGet = function (slug) {
    if (!slug) return null;
    for (var i = 0; i < DATA.length; i++) if (DATA[i].slug === slug) return DATA[i];
    for (var j = 0; j < DATA.length; j++) if (DATA[j].slugEn === slug) return DATA[j];
    return null;
  };

  /* ══ JEMBATAN FIRESTORE ══════════════════════════════════════════════════════
     ⛔ CACAT YANG DITUTUP DI SINI, DAN IA TIDAK PERNAH MEMUNCULKAN SATU GALAT PUN.
     Sampai 14 Agustus 2026 berkas ini merender feed dan halaman artikel HANYA
     dari `window.KABAR` — content-pack statis yang ikut ter-bundel. `kabar-live.js`
     memang berlangganan `kabar_articles`, tapi dari setiap dokumen ia hanya
     mengambil TIGA angka (views/likes/shares) lalu membuang sisanya.

     Akibatnya: artikel yang dibuat admin lewat Studio tersimpan dengan benar di
     Firestore, aturan mengizinkannya, `status`-nya "published" — dan TIDAK PERNAH
     MUNCUL di /news maupun /news/article. Server mengizinkan, UI menyembunyikan:
     arah yang tidak melempar galat, jadi tidak pernah jadi keluhan. Menambah
     formulir penulisan tanpa jembatan ini berarti membangun tombol "Terbitkan"
     yang tidak menerbitkan apa pun.

     `__kMerge` dipanggil `kabar-live.js` dengan dokumen yang SUDAH ia bayar
     (snapshot yang sama), jadi tidak ada permintaan jaringan tambahan.

     Aturan gabungnya:
       · slug yang sudah ada di pack DITIMPA versi Firestore — supaya menyunting
         artikel lama di Studio benar-benar mengubah halaman publik (sebelumnya
         mustahil: pack statis selalu menang);
       · slug baru masuk dengan `_i` NEGATIF, terurut publishAt menurun. Urutan
         "Terbaru" di feed ini adalah `_i` MENAIK (indeks pack = terbaru dulu),
         jadi nilai negatif menempatkan tulisan admin di atas seluruh pack —
         yang memang artinya "baru terbit". */
  var artikelDiminta = null;      // slug pada ?a= yang belum ketemu
  var artikelTerpasang = null;    // slug yang sedang tergambar di layar
  var gambarUlangFeed = null;     // diisi initFeed()

  window.__kMerge = function (masuk) {
    if (!masuk || !masuk.length) return;
    var berubah = false, baru = [];
    masuk.forEach(function (raw) {
      var slug = raw.slug || raw.id;
      if (!slug) return;
      var lama = window.__kGet(slug);
      var n = norm(raw, 0);
      n.slug = slug;
      n._publishAt = raw.publishAt || 0;
      if (lama) {
        /* ⛔ MENIMPA UTUH MENGHAPUS FIELD YANG TIDAK DIPUNYAI FIRESTORE.
           Koleksi `kabar_articles` tidak punya `sources` sama sekali, sementara
           content-pack punya untuk ke-99 artikelnya. Sebelum baris ini ada,
           begitu satu artikel tiba dari Firestore, daftar sumber di kakinya
           LENYAP — dan justru daftar itu yang membuat artikelnya bisa
           diperiksa pembaca. Cacatnya tak bersuara: tidak ada galat, hanya satu
           bagian halaman yang tidak lagi digambar.

           Karena itu field di bawah DIWARISI kalau dokumen yang masuk tidak
           membawanya. Ia BUKAN daftar "semua field": hanya yang aman diwarisi,
           yaitu yang isinya menerangkan artikel yang sama, bukan keadaannya. */
        /* ⛔ MEDAN TERJEMAHAN WAJIB IKUT DIWARISI — kalau tidak, seluruh
           terjemahan LENYAP begitu Firestore menjawab.

           Terukur 16 Agustus 2026, dan pemilik yang menemukannya di tabletnya:
           halaman berbahasa Inggris menampilkan JUDUL Inggris tetapi BADAN
           ARTIKEL Bahasa Indonesia. Sebabnya persis di sini — dokumen
           `kabar_articles` memuat `blocks` (Indonesia) dan `titleEn`/`dekEn`,
           tetapi TIDAK memuat `blocksEn`/`blocksAr`/`titleAr`/`story`. Karena
           daftar warisan ini hanya berisi empat medan, penggabungan menimpa
           artikel statis yang SUDAH lengkap terjemahannya dengan dokumen yang
           tidak punya, dan `naskah()` jatuh ke Indonesia.

           Tidak ada galat, tidak ada kotak kosong — hanya bahasa yang salah,
           dan hanya untuk artikel yang sudah terbit (yang ada di Firestore).
           Artikel terjadwal terlihat benar, sehingga cacatnya menyamar sebagai
           "kadang benar kadang tidak".

           Perbaikan keduanya dipasang bersama, sengaja: medan terjemahan juga
           dikirim ke Firestore. Yang satu memperbaiki data, yang ini memastikan
           dokumen LAMA atau dokumen yang ditulis lewat Studio tidak menghapus
           terjemahan yang sudah ada. */
        ['sources', 'cover', 'mood', 'orb', 'story',
          'titleEn', 'dekEn', 'hookEn', 'roleEn', 'topicEn', 'blocksEn', 'sourcesEn', 'storyEn',
          'titleAr', 'dekAr', 'hookAr', 'roleAr', 'topicAr', 'blocksAr', 'sourcesAr', 'storyAr',
        ].forEach(function (k) {
          var kosong = !n[k] || (n[k].length === 0);
          if (kosong && lama[k]) n[k] = lama[k];
        });
        /* ⛔ KREDIT GAMBAR TIDAK BOLEH MASUK DAFTAR DI ATAS, DAN INI BUKAN
           KERAPIAN — mewarisinya begitu saja MEMBUAT ATRIBUSI PALSU.
           Bayangkan artikel pack dengan sampul Unsplash milik fotografer A,
           lalu Studio menyuntingnya dan menempel sampul BARU tanpa mengisi
           kreditnya. Aturan "warisi kalau kosong" akan memasang nama fotografer
           A di bawah foto fotografer B — sebuah pernyataan asal-usul yang
           salah, dipasang oleh kode kita sendiri, di halaman publik. Itu lebih
           berbahaya daripada tidak ada kredit sama sekali: yang kosong
           mengundang pertanyaan, yang salah mengundang tuntutan.

           Kreditnya karena itu hanya ikut kalau GAMBARNYA memang gambar yang
           sama — dan kesamaannya diperiksa terhadap `n.cover` SESUDAH pewarisan
           di atas, jadi sampul yang diwarisi otomatis membawa kreditnya. */
        if (!n.coverCredit && lama.coverCredit && n.cover && n.cover === lama.cover) n.coverCredit = lama.coverCredit;
        n._i = lama._i;
        DATA[DATA.indexOf(lama)] = n;
        berubah = true;
      }
      else baru.push(n);
    });
    if (baru.length) {
      baru.sort(function (a, b) { return (b._publishAt || 0) - (a._publishAt || 0); });
      baru.forEach(function (n, i) { n._i = -(baru.length - i); DATA.push(n); });
      berubah = true;
    }
    if (!berubah) return;
    if (gambarUlangFeed) gambarUlangFeed();
    /* Halaman artikel: kalau slug yang diminta baru sekarang ada, gambar. */
    if (artikelDiminta && artikelTerpasang !== artikelDiminta && window.__kGet(artikelDiminta)) initArticle();
  };

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

  /* ══ PENCARIAN DWIBAHASA ═══════════════════════════════════════════════════
     ⛔ GEJALA (terukur di peramban, 14 Agustus 2026, lokal Inggris):
        cari "waste banks" → 0 · "bank sampah" → 1
        cari "Technology"  → 0 · "Teknologi"   → 2
     Placeholder-nya sendiri berbunyi "Search articles — CBAM, mangrove, AI…",
     jadi halaman ini MENGUNDANG kata yang dijamin gagal. Pembaca berbahasa
     Inggris menyimpulkan artikelnya tidak ada — sambil menatap judulnya yang
     tergambar dalam bahasa Inggris tepat di bawah kotak pencarian.

     AKAR. `match()` mencocokkan `a.title`/`a.dek`/`a.topic` MENTAH, yaitu teks
     Indonesia dari content-pack. Yang berbahasa Inggris hanyalah SIMPUL TEKS di
     layar: mesin `assets/js/i18n.js` menukar isi DOM, ia tidak pernah menyentuh
     data. Yang dibaca mata dan yang dicari mesin adalah dua string berbeda.

     ⛔ KENAPA BUKAN "baca saja teks kartunya". Kartu yang dicari belum tentu ada
     di DOM — hanya 9 artikel tergambar per halaman, dan pencarian wajib
     menemukan yang duduk di halaman 2. Indeks karena itu dibangun dari DATA,
     bukan dari layar.

     CARANYA. Tiap artikel menyimpan SATU "jerami" huruf-kecil: judul + dek +
     topik dalam Bahasa, DITAMBAH terjemahannya dari setiap kamus yang KEBETULAN
     sudah termuat (`window.GLYIV_EN`, `window.GLYIV_AR`). Kamus itu peta harfiah
     Indonesia→X yang kuncinya teks Indonesia apa adanya, jadi biayanya satu
     pencarian peta per medan per bahasa. Karena Bahasa SELALU ikut di jerami,
     kedua arah bekerja sekaligus: "waste banks" menemukan judul Indonesia, dan
     "bank sampah" tetap menemukannya di halaman Inggris.

     ⚠︎ JALUR INDONESIA TIDAK BOLEH BERGANTUNG PADA BERKAS INGGRIS — dan tidak.
     Pengunjung berbahasa Indonesia tidak pernah mengunduh `i18n-en.js` (± 1 MB
     sebelum kompresi), dan berkas ini TIDAK memaksanya turun: kalau
     `window.GLYIV_EN` tidak ada, jeraminya berisi Bahasa saja dan pencarian
     bekerja persis seperti sebelum perbaikan ini. Kamus dipakai kalau ada,
     tidak pernah diminta.

     ⚠︎ DIBANGUN SEKALI, BUKAN PER KETUKAN. 102 artikel × 3 medan × 2 kamus =
     612 pencarian peta; per ketukan, mengetik "mangrove" berarti delapan kali
     angka itu — di tablet Android pemilik itu terasa. Jerami disimpan di objek
     artikelnya dan hanya dibangun ULANG kalau SIDIK kamus berubah, yaitu saat
     sebuah kamus baru tiba (ganti bahasa) — bukan saat kuerinya berubah.
     Sidiknya dihitung sekali per penggambaran, bukan sekali per artikel.

     ⚠︎ KAMUS DATANG BELAKANGAN, DAN ITU BUKAN KASUS LANGKA. `i18n.js` disuntik
     `site-lang.js` lalu mengunduh kamusnya secara asinkron; feed sudah tergambar
     jauh sebelum itu. Karena penanda bangun-ulang adalah KEBERADAAN kamus dan
     bukan sebuah peristiwa yang harus tertangkap tepat waktu, pencarian pertama
     sesudah kamus mendarat sudah memakai kamus itu — tanpa pendengar peristiwa
     yang bisa terpasang terlambat dan gagal dalam diam. */
  var KAMUS = ["GLYIV_EN", "GLYIV_AR"];
  function sidikKamus() {
    var s = "";
    for (var i = 0; i < KAMUS.length; i++) s += window[KAMUS[i]] ? "1" : "0";
    return s;
  }
  /* Spasi tak-putus & kutip melengkung dirapikan PERSIS seperti `norm()` di
     i18n.js. Kunci kamus dipanen dalam bentuk rapi itu; tanpa perapian yang
     sama, judul yang memuat satu spasi tak-putus meleset walau terjemahannya
     ada — cacat yang sudah pernah memakan satu kalimat di beranda. */
  function rapi(s) {
    return String(s == null ? "" : s)
      .replace(/[\u00A0\u202F\u2007\u2009\u200A\uFEFF]/g, " ")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }
  function alih(d, t) {
    if (!t) return "";
    var v = d[t];
    if (typeof v !== "string") v = d[rapi(t)];
    return typeof v === "string" ? v : "";
  }
  function jerami(a, sidik) {
    if (a._jerSidik !== sidik) {
      a._jerSidik = sidik;
      var medan = [a.title, a.dek, a.topic], s = medan.join(" · ");
      for (var i = 0; i < KAMUS.length; i++) {
        var d = window[KAMUS[i]];
        if (!d) continue;
        for (var j = 0; j < medan.length; j++) s += " · " + alih(d, medan[j]);
      }
      /* ⛔ NASKAH PER ARTIKEL IKUT MASUK JERAMI, bukan hanya kamus.
         Jerami di atas menerjemahkan judul/dek lewat kamus i18n. Itu cukup
         SELAMA terjemahannya memang ada di kamus — dan untuk bahasa Arab
         terukur NOL: pembaca Arab yang mengetik kata Arab tidak akan menemukan
         satu artikel pun, sementara halamannya sendiri tampak baik-baik saja.
         Sejak naskah artikel pindah ke medan per artikel (`titleEn`, `dekAr`, …
         lihat `naskah()`), medan itulah sumber yang benar. Ditambahkan di sini
         supaya pencarian tidak diam-diam tertinggal di belakang tampilan. */
      ["En", "Ar"].forEach(function (suf) {
        [a["title" + suf], a["dek" + suf], a["topic" + suf]].forEach(function (v) {
          if (v) s += " · " + v;
        });
      });
      a._jerami = s.toLowerCase();
    }
    return a._jerami;
  }
  /* Kueri dipecah per KATA, dan tiap kata harus ada di jerami. Ini lebih longgar
     daripada mencocokkan frasa utuh ke satu medan: "carbon tax" kini juga
     menemukan judul yang menulis "tax on carbon", dan urutan kata tidak lagi
     menentukan. Tidak ada hasil yang HILANG karenanya — frasa utuh selalu
     memenuhi syarat "tiap katanya ada". */
  function kataKunci(q) { q = rapi(q).toLowerCase(); return q ? q.split(" ") : []; }
  function cocok(a, kunci, sidik) {
    if (!kunci.length) return true;
    var h = jerami(a, sidik);
    for (var i = 0; i < kunci.length; i++) if (h.indexOf(kunci[i]) < 0) return false;
    return true;
  }

  /* ============================ FEED (grid + search + sort + pagination) ============================ */
  function initFeed() {
    var grid = $("#kgrid"); if (!grid) return;
    /* Simpul yang SUDAH disiapkan dilewati. Di aplikasi React `boot()` dipanggil
       ulang tiap halaman dipasang; tanpa penjaga ini, membuka /news dua kali
       memasang DUA pendengar klik pada simpul yang sama dan satu ketukan
       "Story" membuka dua kali. Simpul BARU (hasil pasang ulang React) tidak
       punya penanda ini, jadi ia tetap diinisialisasi penuh. */
    if (grid.dataset.kSiap) return;
    grid.dataset.kSiap = "1";
    var searchEl = $("#ksearch"), sortEl = $("#ksort"), pagerEl = $("#kpager");
    var state = { q: "", sort: "new", page: 1, per: 9 };
    /* ⛔ "TERBARU" ARTINYA TANGGAL TERBIT, BUKAN POSISI DI DALAM BERKAS.
       Sampai 16 Agustus 2026 ketiga urutan memakai `_i` — indeks artikel di
       dalam `content-pack.js`. Itu urutan penulisan, dan ia tidak punya
       hubungan apa pun dengan kapan artikelnya tayang.

       Akibatnya terlihat pemilik dan dilaporkan langsung: Telegram mengirim
       "Two years of IDXCarbon" sebagai artikel hari itu, sementara kartu HERO
       di /news masih menampilkan "A carbon tax of Rp30 per kilogram" — artikel
       lain yang kebetulan lebih awal di berkas. Sejak jadwalnya jadi satu
       artikel per hari, jarak antara "yang baru terbit" dan "yang tampil di
       puncak" hanya akan melebar.

       `publishAt` yang dipakai, dengan `_i` sebagai pemutus seri supaya
       urutannya tetap pasti kalau dua artikel berbagi tanggal yang sama. */
    function waktuTerbit(a) {
      if (!a || a.publishAt == null) return 0;
      /* Dokumen Firestore membawa Timestamp (objek ber-toMillis/seconds), bukan
       untai ISO. Date.parse(objek) = NaN, dan NaN diam-diam jadi 0 — seluruh
       daftar seri lalu diurutkan pemutus seri. Ketiga bentuk ditangani. */
    var t = typeof a.publishAt === "number" ? a.publishAt
      : (a.publishAt && typeof a.publishAt.toMillis === "function") ? a.publishAt.toMillis()
      : (a.publishAt && a.publishAt.seconds != null) ? a.publishAt.seconds * 1000
      : Date.parse(a.publishAt);
      return t && !isNaN(t) ? t : 0;
    }
    function sorted(list) {
      if (state.sort === "az") return list.slice().sort(function (a, b) { return a.title.localeCompare(b.title, "id"); });
      var arah = state.sort === "old" ? 1 : -1;   // "new" (bawaan) = terbaru dulu
      return list.slice().sort(function (a, b) {
        var d = waktuTerbit(a) - waktuTerbit(b);
        if (d !== 0) return d * arah;
        return (a._i - b._i) * arah;
      });
    }
    function card(a, feat) {
      var c = counts(a);
      a = naskah(a);                 // judul/dek kartu ikut bahasa pembaca
      return '<a class="kc' + (feat ? " feat" : "") + '" href="' + urlArtikel(a.slug) + '" style="--kc-mood:' + esc(a.mood) + '">' +
        '<div class="kc__img">' + (a.cover ? '<img src="' + esc(a.cover) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : "") + '<span class="kc__topic">' + esc(a.topic) + "</span>" +
        (a.jenis === "mitra" ? '<span class="kc__mitra" data-i18n-skip title="' + esc(kata("mitraTitle")) + '">' + esc(kata("mitraBadge")) + '</span>' : "") + "</div>" +
        '<div class="kc__b"><h3>' + esc(a.title) + '</h3><p>' + esc(a.dek) + '</p>' +
        /* ⛔ TANGGAL LEBIH DULU, SEBELUM WAKTU BACA. Syarat Play "News and
           Magazines" bukan sekadar "ada tanggalnya di suatu tempat" — peninjau
           membuka DAFTAR lebih dulu, dan kalau di sana tidak ada tanggal ia
           mencatat isinya statis tanpa pernah membuka satu artikel pun. Itulah
           yang terjadi pada version code 6. */
        '<div class="kc__meta">' + timeHTML(a, "kc__date") + '<span data-i18n-skip>' + a.read + " " + kata("mnt") + '</span>' +
        '<span class="eng"><span class="eng__i">' + ICON.eye + '<b data-i18n-skip data-vw="' + esc(a.slug) + '">' + fmt(c.views) + '</b></span>' +
        '<span class="eng__i">' + ICON.heart + '<b data-i18n-skip data-lk="' + esc(a.slug) + '">' + fmt(c.likes) + '</b></span></span>' +
        '<button class="kc__story" type="button" data-story="' + esc(a.slug) + '">' + ICON.play + ' Story</button></div></div></a>';
    }
    function render() {
      /* Kata kunci dan sidik kamus dihitung SEKALI per penggambaran, lalu
         dipinjamkan ke tiap artikel. Menghitungnya di dalam penyaring berarti
         mengulanginya 102 kali untuk hasil yang sama. */
      var kunci = kataKunci(state.q), sidik = sidikKamus();
      /* Cap kesegaran digambar ulang tiap render — bukan sekali saat muat —
         supaya artikel yang datang belakangan dari Firestore (`__kMerge`)
         ikut memajukan tanggalnya. */
      renderArchiveStamp();
      var list = sorted(DATA.filter(function (a) { return cocok(a, kunci, sidik); }));
      var total = list.length, pages = Math.max(1, Math.ceil(total / state.per));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * state.per, pageItems = list.slice(start, start + state.per);
      if (!total) { grid.innerHTML = '<div class="kempty" data-i18n-skip>' + esc(kata("kosong")) + '</div>'; if (pagerEl) pagerEl.innerHTML = ""; return; }
      grid.innerHTML = pageItems.map(function (a, i) { return card(a, state.page === 1 && i === 0 && state.sort === "new" && !state.q); }).join("");
      renderPager(pages, total);
    }
    function renderPager(pages, total) {
      if (!pagerEl) return;
      if (pages <= 1) { pagerEl.innerHTML = '<span class="kpager__info" data-i18n-skip>' + esc(labelPager(total, 1, 1)) + '</span>'; return; }
      var btns = "";
      btns += '<button class="kpg" data-pg="' + (state.page - 1) + '"' + (state.page === 1 ? " disabled" : "") + '>‹</button>';
      var win = [];
      for (var p = 1; p <= pages; p++) { if (p === 1 || p === pages || Math.abs(p - state.page) <= 1) win.push(p); else if (win[win.length - 1] !== "…") win.push("…"); }
      win.forEach(function (p) { btns += p === "…" ? '<span class="kpg__dot">…</span>' : '<button class="kpg' + (p === state.page ? " on" : "") + '" data-pg="' + p + '">' + p + "</button>"; });
      btns += '<button class="kpg" data-pg="' + (state.page + 1) + '"' + (state.page === pages ? " disabled" : "") + '>›</button>';
      pagerEl.innerHTML = '<span class="kpager__info" data-i18n-skip>' + esc(labelPager(total, state.page, pages)) + '</span><div class="kpager__btns">' + btns + "</div>";
      $$("[data-pg]", pagerEl).forEach(function (b) { b.addEventListener("click", function () { var p = +b.dataset.pg; if (p >= 1 && p <= pages) { state.page = p; render(); window.scrollTo({ top: (grid.getBoundingClientRect().top + window.scrollY - 120), behavior: "smooth" }); } }); });
    }
    if (searchEl) { var t; searchEl.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { state.q = searchEl.value.trim(); state.page = 1; render(); }, 180); }); }
    if (sortEl) sortEl.addEventListener("change", function () { state.sort = sortEl.value; state.page = 1; render(); });
    grid.addEventListener("click", function (e) { var s = e.target.closest("[data-story]"); if (s) { e.preventDefault(); e.stopPropagation(); openStory(s.getAttribute("data-story")); } });
    /* Dipegang `__kMerge` supaya artikel yang datang dari Firestore langsung
       masuk ke halaman yang sedang terbuka, tanpa muat ulang. */
    gambarUlangFeed = render;
    render();
  }

  /* ============================ ARTICLE ============================ */
  /* `tuntasPantau` / `jamTuntas` MODUL-LEVEL, bukan lokal di `initArticle()`,
     dan itu bukan selera. `initArticle()` berjalan BERKALI-KALI untuk satu
     halaman — sekali menggambar "Memuat…", sekali lagi sesudah Firestore
     menjawab, dan sekali lagi tiap kali React memasang ulang halamannya (lihat
     catatan panjang pada pendengar gulir di bawah). Kalau keduanya lokal, jam
     dari pemanggilan LAMA tetap hidup dan menyalakan blok penutup artikel yang
     sudah tidak ada di layar. */
  var tungguArtikel = null, gulirTerpasang = false, progEl = null, tuntasPantau = null, jamTuntas = null;

  /* ══════════════════════════════════════════════════════════════════════════
     BLOK PENUTUP ARTIKEL — batas PENYELESAIAN yang selama ini tidak ada
     ══════════════════════════════════════════════════════════════════════════
     Sampai ronde ini halaman artikel adalah JALAN BUNTU. Tidak ada "artikel
     terkait", tidak ada "baca berikutnya", tidak ada tautan kembali: sesudah
     baris suka/lihat/bagikan (`.keng`) tidak ada apa-apa lagi. Satu-satunya
     pintu keluar adalah tombol KEMBALI perangkat, tombol bagikan, atau navigasi
     situs — dan ketiganya adalah batas KEPERGIAN, bukan batas SELESAI.

     Itu sebabnya pertanyaan pemilik ("iklan saat user mau kembali") terdengar
     wajar: kembali memang satu-satunya pintu yang ada. Jawabannya bukan menaruh
     iklan di pintu itu — kebijakan AdMob melarangnya secara eksplisit untuk
     tombol kembali — melainkan MEMBUAT batas selesainya lebih dulu.

     ⛔ Blok ini berguna dengan sendirinya. Kalau iklannya tidak pernah dipasang,
     atau pembacanya berlangganan, atau jatah hariannya sudah habis, blok ini
     tetap muncul dan tetap menawarkan artikel berikutnya. Ia bukan bungkus
     iklan; iklannya yang menumpang di sini.

     ── DEFINISI "TUNTAS" — DUA SYARAT, KEDUANYA WAJIB ─────────────────────────
     Gulir saja bisa diselesaikan satu lemparan jempol dalam dua detik; itu bukan
     membaca. Waktu saja tidak membedakan membaca dari meletakkan HP di meja.
     Bersama-sama keduanya adalah padanan terdekat dari pagar `menitFokus < 1`
     yang sudah terbukti di Pocket. */
  var TUNTAS_GULIR = 0.95;
  var TUNTAS_LANTAI_MS = 45000;   /* lantai untuk artikel terpendek (2 mnt baca) */
  var TUNTAS_BAGIAN = 0.6;        /* 60% dari perkiraan waktu baca artikel ini   */

  /**
   * Slug artikel berikutnya dalam urutan bawaan feed ("Terbaru" = `_i` MENAIK,
   * lihat `sorted()` di initFeed).
   *
   * Mengembalikan `null` kalau tidak ada artikel LAIN — dengan satu artikel,
   * "berikutnya" akan memuat ulang artikel yang sama, dan tombol yang tidak
   * memindahkan pembaca ke mana pun tidak boleh memicu iklan.
   */
  function slugBerikutnya(slug) {
    if (DATA.length < 2) return null;
    var urut = DATA.slice().sort(function (x, y) { return x._i - y._i; });
    var i = -1;
    for (var k = 0; k < urut.length; k++) { if (urut[k].slug === slug) { i = k; break; } }
    if (i < 0) return urut[0].slug;
    return urut[(i + 1) % urut.length].slug;   /* melingkar: sesudah terakhir, kembali ke awal */
  }

  /** Nomor urut artikel ini di dalam feed (1-basis). 0 kalau tidak ketemu. */
  function nomorArtikel(slug) {
    var urut = DATA.slice().sort(function (x, y) { return x._i - y._i; });
    for (var k = 0; k < urut.length; k++) { if (urut[k].slug === slug) return k + 1; }
    return 0;
  }

  function blokPenutupHTML(a, berikut) {
    var no = nomorArtikel(a.slug);
    var posisi = no ? no + " " + kata("dari") + " " + DATA.length + " " + kata("artikel") : "";
    var menit = (+a.read || 0) ? (a.read + " " + kata("mnt")) : "";
    var sub = [posisi, menit].filter(Boolean).join(" · ");
    return '<section class="kdone" id="kdone" hidden>' +
      '<div class="kdone__in">' +
        '<div class="kdone__mark" aria-hidden="true">✓</div>' +
        '<h3>' + esc(kata("selesaiBaca")) + '</h3>' +
        (sub ? '<p class="kdone__sub" data-i18n-skip>' + esc(sub) + '</p>' : "") +
        /* ⛔ `data-muat-penuh` WAJIB, DAN INI CACAT TERUKUR — BUKAN KEHATI-HATIAN.
           `src/components/PindahHalus.tsx` menyadap SETIAP `<a href>` di seluruh
           aplikasi pada fase TANGKAP di `document` (`capture:true`, baris 160),
           jadi ia berjalan SEBELUM pendengar apa pun yang dipasang pada simpul
           tautannya sendiri. Akibatnya `e.preventDefault()` milik `#kNext` di
           bawah datang TERLAMBAT: router sudah berpindah, dan iklannya akan
           muncul DI ATAS artikel berikutnya yang sudah tergambar — persis bunyi
           pelanggaran AdMob "show unexpectedly".
           Terukur di peramban sebelum baris ini ada: menekan "Artikel
           berikutnya" mengubah `location.pathname` ke artikel tujuan selagi alur
           iklannya masih menunggu.
           `data-muat-penuh` adalah jalan keluar yang PindahHalus sediakan
           sendiri (baris 103): ia pulang tanpa menyentuh peristiwanya, sehingga
           pembatalan kita kembali menjadi yang pertama dan satu-satunya. */
        (berikut ? '<a class="kdone__go" id="kNext" data-muat-penuh href="' + urlArtikel(berikut) + '">' + esc(kata("berikutnya")) + ' →</a>' : "") +
        '<div class="kdone__alt">' +
          '<button type="button" id="kDoneStory">' + esc(kata("story")) + '</button>' +
          '<a href="' + urlDaftar() + '">' + esc(kata("keDaftar")) + '</a>' +
        '</div>' +
        '<div class="klang" hidden></div>' +
      '</div></section>';
  }

  function initArticle() {
    var root = $("#kart"); if (!root) return;
    /* Dua bentuk alamat, satu pembaca: `/news/article/<slug>` (bentuk jalur,
       yang punya cuplikan berbagi sendiri) dan `?a=<slug>` (bentuk lama yang
       sudah tersebar). Lihat `slugTerbuka()` di kepala berkas. */
    var slug = slugTerbuka();
    artikelDiminta = slug || null;

    /* ⛔ DULU: `window.__kGet(slug) || DATA[0]` — slug yang tidak dikenal diam-diam
       menggambar ARTIKEL PERTAMA content-pack, lengkap dengan `KE.view()` yang
       menaikkan penghitung baca artikel itu. Pembaca melihat judul yang salah dan
       tidak ada yang memberitahunya bahwa yang ia klik bukan yang ia dapat.
       Sejak ada jembatan Firestore, kasus ini jadi JALUR NORMAL: artikel tulisan
       admin selalu belum ada saat gambar pertama. Jadi selagi `kabar-live.js`
       belum menjawab, halaman menunggu — bukan mengarang. */
    var a = slug ? window.__kGet(slug) : DATA[0];
    if (!a) {
      if (slug) {
        root.innerHTML = '<div class="wrap" data-i18n-skip style="padding:140px 0;text-align:center;color:var(--muted)">' + esc(kata("memuatArtikel")) + '</div>';
        clearTimeout(tungguArtikel);
        tungguArtikel = setTimeout(function () {
          if (artikelTerpasang !== slug) root.innerHTML = '<div class="wrap" data-i18n-skip style="padding:120px 0;text-align:center">' + esc(kata("takKetemu")) + '<br><a href="' + urlDaftar() + '" style="color:var(--teal)">' + esc(kata("keKabar")) + '</a></div>';
          /* ⛔ 7 DETIK TERLALU PENDEK, DAN ITU TERUKUR DI PRODUKSI.
             23 Agustus 2026, glyiv.io/news/article/<slug> pada muat PERTAMA
             (cache & service worker baru dibersihkan): halaman menampilkan
             "Article not found." padahal artikelnya ada — `content-pack.js`
             berukuran **1,6 MB** dan belum selesai diunduh saat jam ini berbunyi.
             Muat kedua, dengan pack sudah di cache, tampil seketika.

             Untuk aplikasi yang baru DITOLAK Play dengan alasan *"News section
             is empty and or not working"*, pesan "tidak ditemukan" di atas
             artikel yang sebenarnya ada adalah cacat yang paling mahal yang bisa
             kita punya — dan ia hanya muncul pada pengunjung BARU di jaringan
             lambat, yaitu persis peninjau Play.

             ⚠︎ Jamnya TIDAK dihapus, hanya diperpanjang. Artikel yang benar-benar
             tidak ada (slug salah ketik) tetap harus berhenti pada satu kalimat
             yang jelas, bukan berputar selamanya. 20 detik dipilih karena ia di
             atas waktu unduh pack pada 3G lambat, dan masih di bawah batas
             kesabaran orang yang salah alamat. */
        }, 20000);
        return;
      }
      root.innerHTML = '<div class="wrap" data-i18n-skip style="padding:120px 0;text-align:center">' + esc(kata("takKetemu")) + '</div>'; return;
    }
    clearTimeout(tungguArtikel);
    artikelTerpasang = a.slug;
    /* Naskah dipilih SESUDAH slug dicatat: `artikelTerpasang` dan `window.KE`
       memakai slug, yang tidak pernah berubah antar bahasa. */
    a = naskah(a);
    setMood(a.mood); document.title = a.title + " — Glyiv News";
    setArticleMeta(a);
    /* `data-i18n-skip` dipasang di sini, bukan di markup statis artikel.html:
       sebelum artikelnya tergambar simpul itu masih berbunyi "tentang artikel
       ini" — kalimat yang MEMANG punya kunci kamus dan harus diterjemahkan.
       Sesudah diisi `teksOrb()` ia jadi label rakitan, dan mulai saat itulah ia
       milik berkas ini. `segarkanLabel()` yang menggambarnya ulang. */
    var orbTip = $(".korb__tip b");
    if (orbTip) { orbTip.setAttribute("data-i18n-skip", ""); orbTip.setAttribute("data-orb", a.slug); orbTip.textContent = teksOrb(a); }
    var c = counts(a), av = (a.author || "G").trim().charAt(0).toUpperCase();
    var berikut = slugBerikutnya(a.slug);
    root.innerHTML =
      '<header class="kart__cover">' + (a.cover ? '<img src="' + esc(a.cover) + '" alt="" onerror="this.style.display=\'none\'">' : "") +
      '<div class="kart__coverin"><span class="kart__topic">' + esc(a.topic) + '</span><h1>' + esc(a.title) + '</h1><p class="kart__dek">' + esc(a.dek) + "</p>" +
      /* ⛔ NAMA DAN PERAN DIPISAH JADI DUA SIMPUL TEKS, DAN ITU BUKAN KOSMETIK.
         Mesin kamus (`assets/js/i18n.js`) menerjemahkan dengan mencari KUNCI
         PENUH satu simpul teks — tidak ada pencocokan sub-string. Selama nama
         penulis dan baris kredit digabung jadi satu simpul, yang dicari adalah
         "Redaksi Glyiv · Disusun dari laman CBAM Komisi Eropa…", sementara
         kunci yang ada di kamus adalah perannya SAJA. Terukur atas 102 artikel
         sebelum perubahan ini: hook cocok 102/102, role cocok 0/102 — seluruh
         102 terjemahan baris kredit tidak akan pernah terpakai.
         Kunci gabungan BUKAN jalan keluarnya: ia pecah begitu `author` berbeda
         dari "Glyiv Team". Yang benar memisahkan simpulnya.
         ⚠︎ Kata di sebelah penghitung pembaca ("membaca") DULU sebuah simpul
         teks telanjang di sini. Ia kini `kata("baca")` di dalam span sendiri
         yang ber-`data-i18n-skip` — lihat catatan di tabel LABEL. */
      '<div class="kart__by"><span class="av">' + av + '</span><span>' + esc(a.author) + '</span>' + (a.role ? '<span> · </span><span>' + esc(a.role) + '</span>' : "") + '<span>·</span>' + timeHTML(a, 'kart__date') + '<span>·</span><span data-i18n-skip data-baca="' + esc(a.slug) + '">' + a.read + " " + kata("mntBaca") + '</span><span>·</span><span class="klive"><i></i><b data-i18n-skip data-vw="' + esc(a.slug) + '">' + fmt(c.views) + '</b><span data-i18n-skip data-bacalive>' + kata("baca") + '</span></span></div>' +
      '<div class="kart__storyrow"><button id="openStory" type="button" class="kart__story"><span class="pi">' + ICON.play + '</span><span class="tx" data-i18n-skip>' + esc(kata("story")) + '</span></button><span class="kart__storyhint" data-i18n-skip>' + esc(kata("storyHint")) + '</span></div></div></header>' +
      '<article class="kbody">' + mitraHTML(a) + (a.blocks || []).map(blockHTML).join("") +
      (a.sources && a.sources.length ? '<div class="ksrc"><h3 data-i18n-skip>' + esc(kata("sumberJudul")) + '</h3><ol>' + a.sources.map(function (s) { return "<li>" + (s.u ? '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.a) + "</a>" : esc(s.a)) + "</li>"; }).join("") + "</ol></div>" : "") +
      /* Kredit gambar berdiri SESUDAH daftar sumber — permintaan pemilik,
         verbatim: "sertakan atribusi gambar mungkin setelah source". Urutannya
         juga yang benar secara isi: daftar sumber menjawab dari mana ANGKA dan
         kutipannya datang, baris ini menjawab dari mana GAMBARNYA datang. */
      kreditHTML(a) +
      /* ⛔ PENGUNGKAPAN AI + TOMBOL LAPOR — SYARAT PLAY, DUA-DUANYA.
         Kebijakan "AI-Generated Content" Google Play menuntut dua hal dari
         aplikasi yang menerbitkan isi bantuan AI, dan Kabar melakukannya:
           1. mengatakannya kepada pembaca, bukan hanya di formulir konsol;
           2. menyediakan cara melapor TANPA keluar dari aplikasi.
         Ia berdiri sesudah kredit gambar dan sebelum baris suka/bagikan,
         karena ia keterangan tentang naskahnya — bukan ajakan bertindak, dan
         bukan pula bagian dari badan artikel.
         ⚠︎ Kalimatnya menyebut "disunting redaksi": itu klaim tentang proses
         kami sendiri, dan ia benar hanya selama Studio memang dipakai
         menyunting sebelum terbit. Kalau alurnya berubah jadi terbit-otomatis,
         KALIMAT INI WAJIB IKUT BERUBAH — pengungkapan yang tidak lagi benar
         lebih buruk daripada tidak ada. */
      '<div class="kai"><p data-i18n-skip>' + esc(kata("aiUngkap")) + ' <a href="/masthead.html">' + esc(kata("aiKebijakan")) + '</a>.</p>' +
      '<span class="kai__rep"></span></div>' +
      '<div class="keng"><button data-like="' + esc(a.slug) + '"' + (c.liked ? ' class="liked"' : "") + '>' + ICON.heart + '<span data-i18n-skip data-lk="' + esc(a.slug) + '">' + fmt(c.likes) + '</span></button>' +
      '<button class="vw">' + ICON.eye + '<span data-i18n-skip data-vw="' + esc(a.slug) + '">' + fmt(c.views) + '</span></button>' +
      '<button data-sharebtn>' + ICON.share + '<span data-i18n-skip data-sh="' + esc(a.slug) + '">' + fmt(c.shares) + "</span></button></div></article>" +
      /* Blok penutup berdiri DI LUAR `<article>`, sesudah `.keng`. Ia bukan isi
         artikel — ia batas penyelesaiannya. Lahir `hidden`; yang membukanya
         hanya `tandaiTuntas()` di bawah. */
      blokPenutupHTML(a, berikut);
    /* Tombol lapor disuntik sebagai SIMPUL, bukan sebagai markup di atas:
       `GlyivReport.button()` membawa pendengarnya sendiri, dan menyalin markupnya
       ke sini akan melahirkan salinan kedua yang harus ikut diubah setiap kali
       modulnya berubah. Kalau modulnya gagal dimuat, blok pengungkapan AI tetap
       tampil tanpa tombol — dan `audit-lapor.cjs` yang akan meneriakkannya,
       bukan pembaca yang menemukannya sendiri. */
    var repSlot = $(".kai__rep", root);
    if (repSlot) {
      pasangLapor(repSlot, { kind: "ai-article", ref: a.slug, excerpt: a.title }, kata("laporArtikel"));
    }
    $("#openStory").addEventListener("click", function () { openStory(a.slug); });
    $("[data-like]", root).addEventListener("click", function () { var liked = window.KE.like(a.slug); this.classList.toggle("liked", liked); });
    $("[data-sharebtn]", root).addEventListener("click", function () { openShare(a); });
    /* Slug yang sedang dibuka dicatat supaya `kabar-live.js` bisa MENGULANG
       perhitungan tayangan sesudah `window.KE` ditingkatkan ke Firestore —
       panggilan di baris berikutnya hampir selalu mengenai implementasi
       CADANGAN, sebab upgrade-nya baru terjadi setelah jawaban Firestore tiba.
       Tanpa ini penghitungnya macet di "0 reads" selamanya, tanpa satu galat
       pun. Lihat catatan panjang di `kabar-live.js` → `upgrade()`. */
    window.__kArtikelTerbuka = a.slug;
    window.KE.view(a.slug);
    var prog = $(".kprog");
    /* ⚠︎ Dulu baris ini menulis `style.width` PADA SETIAP PERISTIWA GULIR — satu
       properti tata letak, diubah puluhan kali per detik selama orang membaca.
       Sekarang yang ditulis variabel `--kprog` (0–1) yang dipakai `scaleX` di
       kabar.css: pekerjaannya pindah dari layout ke komposit. */
    /* SATU pendengar gulir untuk seumur halaman, dan bilah yang ditulisnya
       disimpan di `progEl`. `initArticle()` kini bisa berjalan berkali-kali —
       sekali menampilkan "Memuat…", sekali lagi sesudah Firestore menjawab, dan
       sekali lagi tiap kali halaman dipasang ulang oleh React. Kalau tiap kali
       itu memasang pendengar baru, jumlah tulisan `--kprog` per peristiwa gulir
       bertambah terus di perangkat pemilik, dan pendengar lama menulis ke
       simpul yang sudah lepas dari dokumen. */
    progEl = prog;
    if (!gulirTerpasang) {
      gulirTerpasang = true;
      document.addEventListener("scroll", function () {
        if (!progEl) return;
        var h = document.documentElement;
        var p = Math.min(1, h.scrollTop / (h.scrollHeight - h.clientHeight || 1));
        progEl.style.setProperty("--kprog", String(p));
        /* ⚠︎ Kemajuan baca DIPINJAM dari perhitungan yang sudah ada, tidak
           dihitung ulang. Menambah pembacaan `scrollTop`/`scrollHeight` sendiri
           di sini berarti membaca tata letak DUA KALI per peristiwa gulir —
           persis jenis kerja per-bingkai yang membuat gulir tersendat di tablet
           pemilik. Yang ditambahkan hanya satu perbandingan angka. */
        if (tuntasPantau) tuntasPantau(p);
      }, { passive: true });
    }
    if ("IntersectionObserver" in window) { var bio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("in"); }); }, { threshold: 0.3 }); $$(".kbars", root).forEach(function (b) { bio.observe(b); }); }

    /* ══ KAPAN ARTIKEL DIANGGAP TUNTAS ══════════════════════════════════════
       Ambangnya 60% dari perkiraan waktu baca artikel ini, dengan lantai 45
       detik. Atas 99 artikel content-pack (min 2 · median 2 · maks 4 menit) itu
       berarti 72–144 detik, dan lantainya hanya mengikat pada yang terpendek. */
    var mulaiBaca = Date.now();
    var ambangMs = Math.max(TUNTAS_LANTAI_MS, Math.round((+a.read || 2) * 60000 * TUNTAS_BAGIAN));
    var dasarTercapai = false, sudahTuntas = false;

    function tandaiTuntas() {
      if (sudahTuntas || !dasarTercapai) return;
      if (Date.now() - mulaiBaca < ambangMs) return;
      sudahTuntas = true;
      tuntasPantau = null;
      clearTimeout(jamTuntas);
      /* Dicatat SEBELUM blok tergambar: yang mengisi syarat "2 unit tuntas
         sejak iklan terakhir" adalah membacanya sampai habis, bukan menekan
         tombolnya. Orang yang tuntas membaca lalu menutup halaman tetap
         terhitung. */
      catatUnitSelesai();
      var blok = $("#kdone", root);
      if (!blok) return;
      blok.hidden = false;
      /* Dua bingkai: `hidden` dilepas dulu, baru kelasnya — kalau keduanya di
         bingkai yang sama, transisi CSS-nya tidak pernah punya keadaan awal
         untuk beranjak dan blok itu muncul mengedip. */
      requestAnimationFrame(function () { blok.classList.add("on"); });
      pasangTombolLangganan($(".klang", blok), null);
    }

    tuntasPantau = function (p) { if (p >= TUNTAS_GULIR) { dasarTercapai = true; tandaiTuntas(); } };
    clearTimeout(jamTuntas);
    jamTuntas = setTimeout(function () {
      /* Halaman yang MUAT DI SATU LAYAR tidak pernah memancarkan `scroll`, jadi
         `tuntasPantau` di atas tidak akan pernah dipanggil dan blok penutupnya
         tidak akan pernah muncul. SATU pembacaan tata letak, SEKALI, sesudah
         ambang waktunya lewat — bukan per bingkai. */
      var h = document.documentElement;
      if ((h.scrollHeight - h.clientHeight) < 40) dasarTercapai = true;
      tandaiTuntas();
    }, ambangMs + 80);

    /* ══ PEMICU N-A — satu-satunya tombol MAJU di halaman artikel ═══════════
       [KEBIJAKAN AdMob] interstisial memang tempatnya *"in between pages of app
       content"* dan *"at the end of the content segment"*. Di sini ia persis di
       antara dua artikel, sesudah yang pertama tuntas dibaca.
       ⚠︎ Yang dipilih pengguna adalah "beri saya artikel berikutnya" — dan itu
       persis yang ia dapat sesudah iklannya. Bandingkan dengan tombol kembali,
       yang berarti "saya mau pergi" lalu diberi hal yang tidak ia minta. */
    var elNext = $("#kNext", root);
    if (elNext) elNext.addEventListener("click", function (e) {
      e.preventDefault();
      var tujuan = elNext.getAttribute("href");
      lanjutDenganIklan(function () { location.href = tujuan; }, "artikel");
    });
    /* ⛔ TIDAK memicu iklan: ini MASUK ke unit baru, dan kebijakan yang sama
       melarang iklan *"at the beginning of a content segment"*. */
    var elStory = $("#kDoneStory", root);
    if (elStory) elStory.addEventListener("click", function () { openStory(a.slug); });
    /* ⛔ "Kembali ke daftar" juga tidak memicu apa pun — itu batas KEPERGIAN. */
  }
  /* ⚠︎ PENGUNGKAPAN MITRA — INI YANG MENUTUP RISIKONYA, BUKAN `jenis` ITU SENDIRI.
     Artikel mitra adalah tulisan yang disiapkan bersama pihak luar. Menaruhnya
     di kanal yang sama dengan tulisan redaksi TANPA label berarti klaim mitra
     terbaca sebagai temuan Glyiv — persis jenis overclaim yang aturan kejujuran
     iklim proyek ini larang. Penalarannya sama persis dengan kabar outlet
     berjenis `green` di firestore.rules: aturan tidak bisa memverifikasi isi,
     jadi yang bekerja adalah label di halaman publik.
     Label ini digambar dari `jenis` — BUKAN dari kesediaan mitra menuliskannya. */
  /* ⚠︎ NAMA MITRA DIPISAH JADI SIMPULNYA SENDIRI — alasan yang sama dengan
     baris kredit di atas. Selama kalimatnya utuh, kunci kamus yang dicari adalah
     "Disiapkan bersama PT Anu. Isi dan klaim…" — satu kunci per nama mitra,
     yaitu kunci yang tak terbatas jumlahnya. Dipecah begini, kalimat tetapnya
     punya SATU kunci dan namanya (yang memang tidak boleh diterjemahkan) lewat
     tanpa disentuh. */
  function mitraHTML(a) {
    if (a.jenis !== "mitra") return "";
    var nama = (a.mitra || "").trim();
    /* ⚠︎ TITIKNYA IKUT KE SIMPUL NAMA, dan itu bukan selera. `scripts/audit-
       kalimat-terpecah.cjs` menggolongkan penggalan yang DIAWALI tanda baca
       sebagai "BERAT" — penanda prosa yang dibelah di tengah kalimat. Kalau
       titiknya berdiri sebagai simpul sendiri (". "), pecahan ini masuk kelas
       itu tanpa alasan. Dengan titik menempel pada nama, tiap penggalan tetap
       frasa utuh dan tak satu pun diawali tanda baca. */
    return '<aside class="kmitra" data-i18n-skip><b>' + esc(kata("mitraJudul")) + '</b><span><span>' + esc(kata("mitraSiap")) + '</span> ' +
      (nama ? '<span data-i18n-skip>' + esc(nama) + '.</span>' : '<span>' + esc(kata("mitraGlyiv")) + '</span>') +
      ' <span>' + esc(kata("mitraAwas")) + '</span></span></aside>';
  }
  /* ══ BARIS KREDIT GAMBAR ═════════════════════════════════════════════════════
     ⚠︎ LISENSI UNSPLASH DAN PEXELS TIDAK MEWAJIBKAN ATRIBUSI. Baris ini karena
     itu bukan kepatuhan lisensi — ia MITIGASI SENGKETA. Yang menjadi tuntutan
     hampir tidak pernah "pakai foto stok"; yang jadi tuntutan adalah pemakaian
     yang asal-usulnya tidak bisa dijawab saat ditanya. Dengan nama fotografer,
     nama platform, tautan ke halaman fotonya, dan tautan ke teks lisensinya,
     pertanyaan siapa pun terjawab di halaman itu juga — tanpa harus membuka
     arsip internal, dan tanpa bergantung pada ingatan siapa pun. Itu yang
     menghentikan perkara sebelum ia menjadi perkara.

     ⛔ KOSONG = TIDAK ADA APA-APA DI LAYAR. Bukan baris kosong, bukan garis,
     bukan "Kredit: —". Elemennya tidak dibuat sama sekali, jadi tidak ada jarak
     yang tersisa dan tidak ada yang perlu disembunyikan CSS.

     ⚠︎ SELURUH WADAHNYA `data-i18n-skip`, dan isinya dirakit ulang oleh
     `segarkanLabel()` saat bahasa berganti. Nama fotografer dan nama platform
     adalah nama diri: mesin kamus tidak boleh menyentuhnya. Yang berganti
     bahasa hanya kata penghubungnya, dan kata itu datang dari tabel LABEL. */
  function kreditHTML(a) {
    if (!a.coverCredit) return "";
    return '<div class="kcred" data-i18n-skip data-kredit="' + esc(a.slug) + '">' + kreditIsi(a.coverCredit) + "</div>";
  }
  /* `<bdi>` bukan hiasan: dalam bahasa Arab barisnya mengalir kanan-ke-kiri,
     sementara "Marek Piwnicki" dan "Unsplash" tetap Latin. Tanpa isolasi,
     algoritma bidi peramban menyeret tanda baca di ujung nama ke sisi yang
     salah — persoalan yang sama dengan `isolasiSatuan()` di assets/js/i18n.js,
     yang mengisolasi angka. `<bdi>` adalah bentuk elemen dari isolasi itu. */
  function namaDiri(teks, url) {
    var t = "<bdi>" + esc(teks) + "</bdi>";
    /* `nofollow` sebab tautan ini kredit, bukan rekomendasi editorial. */
    return url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener nofollow">' + t + "</a>" : t;
  }
  function kreditIsi(k) {
    /* ⛔ GAMBAR BANGKITAN AI HARUS MENGAKU DIRINYA.
       Hero artikel Kabar dibangkitkan AI (lihat `scratchpad/hero/buat-hero.cjs`).
       Sebuah gambar hutan yang tampak fotografis, dipasang di sebelah artikel
       yang menyebut angka deforestasi, akan dibaca sebagai FOTO KEJADIAN itu.
       Itu klaim yang tidak pernah kita buat dan tidak bisa kita pertahankan —
       kelas yang sama dengan "terukur" versus "terlacak". Barisnya karena itu
       berbunyi "Ilustrasi AI · Glyiv" dalam bahasa pembacanya, bukan kosong.
       Tidak ada pihak ketiga yang dikreditkan sebab tidak ada karya pihak
       ketiga yang dipakai. */
    if (k.ai) return kata("ilustrasiAi") + " · <bdi>Glyiv</bdi>";
    var s = k.by
      ? kata("fotoOleh") + " " + namaDiri(k.by, k.url) + (k.on ? " " + kata("fotoDi") + " " + namaDiri(k.on, "") : "")
      : kata("fotoDari") + " " + namaDiri(k.on, k.url);
    if (k.lic) s += " · " + namaDiri(k.lic, k.licUrl);
    return s;
  }
  function blockHTML(b) {
    switch (b.t) {
      case "lead": return '<p class="lead">' + b.x + "</p>";
      case "p": return "<p>" + b.x + "</p>";
      case "h2": return "<h2>" + esc(b.x) + "</h2>";
      /* Daftar berbutir. Blok ini TIDAK ADA sebelum 14 Agustus 2026: `default`
         mengembalikan string kosong, jadi daftar apa pun yang tersimpan akan
         HILANG TANPA JEJAK saat digambar — bukan galat, bukan kotak kosong,
         sekadar tidak ada. Ditambah karena Studio kini bisa menulisnya.
         Butirnya sengaja TIDAK di-`esc()`, sama seperti `lead`/`p` di atas:
         ketiganya boleh memuat <strong>/<em>/<a> sebaris. Yang menjaga sisi
         penulis adalah `teksAman()` di kabar-admin.js, yang meng-escape SELURUH
         ketikan lebih dulu lalu hanya memasang tag yang ia bangun sendiri. */
      case "ul": return '<ul class="klist">' + (b.items || []).map(function (it) { return "<li>" + it + "</li>"; }).join("") + "</ul>";
      case "pull": return '<blockquote class="kpull">' + esc(b.x) + "</blockquote>";
      case "stat": return '<div class="kstat"><div class="n">' + esc(b.n) + '</div><div class="l">' + esc(b.l) + "</div>" + (b.s ? '<div class="s">' + esc(b.s) + "</div>" : "") + "</div>";
      case "bars": return '<div class="kbars">' + (b.h || []).map(function (h) { return '<i style="--h:' + h + '"></i>'; }).join("") + "</div>" + (b.cap ? '<div class="kbars__cap">' + esc(b.cap) + "</div>" : "");
      default: return "";
    }
  }

  /* ============================ STORY MODE ============================ */
  var storyEl = null;
  function openStory(slug) {
    var a = window.__kGet(slug); if (!a) return;
    /* ⛔ `naskah()` WAJIB DI SINI. Kartu feed (lihat pemanggilan di render kisi)
       dan halaman artikel keduanya memanggilnya; Story TIDAK — jadi Story selalu
       menggambar naskah Indonesia, apa pun bahasa yang dipilih pembaca. Pemilik
       melaporkannya 16 Agustus 2026 dengan tangkapan layar: antarmuka berbahasa
       Arab, isi Story berbahasa Indonesia.
       Ini menimpa `title`, `dek`, `topic`, `blocks`, DAN `story` sekaligus —
       karena `naskah()` juga menurunkan `story` dari `blocks` terjemahan bila
       `storyAr`/`storyEn` tidak tersedia. Menambal hanya medan `story` akan
       menghasilkan Story Arab dengan pil topik Indonesia, dan itu tetap cacat.
       Cacat yang sama menimpa bahasa Inggris, bukan hanya Arab. */
    a = naskah(a);
    window.KE.story(slug); setMood(a.mood);
    if (!storyEl) { storyEl = document.createElement("div"); storyEl.className = "kstory"; document.body.appendChild(storyEl); }
    /* Arah teks ikut bahasa pembaca. Tanpa ini, kalimat Arab dirender rata kiri
       di dalam lapisan Story — benar hurufnya, salah arahnya. Disetel pada
       simpul Story sendiri, bukan pada <html>, sebab lapisan ini dipasang ke
       <body> dan hidup di luar pohon halaman. */
    storyEl.setAttribute("dir", bahasaKini() === "ar" ? "rtl" : "ltr");
    storyEl.setAttribute("lang", bahasaKini());
    var scenes = a.story || [], av = (a.author || "R").charAt(0).toUpperCase();
    storyEl.innerHTML = '<div class="kstory__stage" style="--mood:' + esc(a.mood) + '"><div class="kstory__bg">' + (a.cover ? '<img src="' + esc(a.cover) + '" alt="">' : "") + "</div>" +
      '<div class="kstory__bars">' + scenes.map(function (_, i) { return "<i" + (i === 0 ? ' class="act"' : "") + "><b></b></i>"; }).join("") + "</div>" +
      /* Story juga membawa labelnya. Kalau pengungkapan mitra hanya ada di
         halaman artikel, mode Story jadi kanal yang menampilkan klaim mitra
         TANPA label — dan Story-lah yang paling sering dibagikan ulang. */
      /* Merek + topik + label mitra = TIGA simpul, bukan satu kalimat rakitan:
         "Glyiv News" nama merek (tak diterjemahkan), topiknya punya kunci kamus
         sendiri, label mitranya juga. Digabung, tak satu pun dari ketiganya
         pernah cocok. */
      '<div class="kstory__top"><span class="av">' + av + '</span><span><span data-i18n-skip>Glyiv News · </span><span>' + esc(a.topic) + '</span>' +
      /* Tanggal terbit ikut ke Story: bentuk ini paling sering dibagikan ulang,
         dan syarat Play soal umur isi berlaku untuk SETIAP permukaan baca — bukan
         hanya untuk halaman artikel. */
      '<span data-i18n-skip> · </span>' + timeHTML(a, 'kstory__date') +
      (a.jenis === "mitra" ? '<span data-i18n-skip> · </span><span data-i18n-skip>' + esc(kata("mitraJudul")) + '</span>' + (a.mitra ? '<span data-i18n-skip> (' + esc(a.mitra) + ')</span>' : "") : "") +
      /* ⛔ Story MEMBAWA TOMBOL LAPORNYA SENDIRI, dengan alasan yang persis sama
         dengan label mitra dua komentar di atas: Story adalah layar penuh yang
         MENUTUP halaman artikel. Orang yang membuka Kabar lewat tautan Story —
         dan itu bentuk yang paling sering dibagikan ulang — tidak pernah melihat
         blok `.kai` di badan artikel, jadi bagi dia tombol lapor itu sama saja
         tidak ada. Syarat Play berbunyi "tanpa keluar dari aplikasi", bukan
         "tersedia di suatu tempat". */
      '</span><span class="kstory__rep"></span><button class="kstory__x" aria-label="' + esc(kata("tutup")) + '">×</button></div>' +
      '<div class="kstory__scenewrap"></div><div class="kstory__nav"><div class="prev"></div><div class="next"></div></div>' +
      '<button class="kstory__pause" data-i18n-skip>' + esc(kata("jeda")) + '</button><div class="kstory__share">' + sbtn("wa") + sbtn("x") + '<button data-net="gen" aria-label="' + esc(kata("bagikanLain")) + '">' + ICON.share + "</button></div></div>";
    var stage = $(".kstory__stage", storyEl), wrap = $(".kstory__scenewrap", storyEl), bars = $$(".kstory__bars i", storyEl);
    var idx = 0, timer = null, paused = false, dur = 5200;

    /* ⛔ STORY MENAMPILKAN KARTU MEDIA SOSIAL YANG SUDAH JADI — BUKAN TIRUANNYA.
       Permintaan pemilik 20 Agustus 2026: *"Harusnya story di artikel itu
       tampilkan card yang sama saja dengan yang ditampilkan di sosial media."*

       Naskah keduanya memang sudah sama (`toPostCards()` memangkas cerita
       tersimpan jadi empat, untuk kedua kanal). Yang berbeda RUPANYA. Menggambar
       ulang desain kartu di dalam Story akan menghasilkan rupa KETIGA yang
       melenceng pada perubahan desain pertama — tanpa galat, dan tampak sengaja
       di kedua sisi. Jadi yang ditampilkan adalah berkas JPEG yang sama persis
       yang diunggah ke Instagram.

       ⚠︎ SEMUA-ATAU-TIDAK. `kartuSosial()` mengembalikan `[]` kecuali keempatnya
       ada; Story setengah gambar setengah teks terbaca seperti halaman rusak,
       sedangkan Story teks sepenuhnya adalah bentuk lama yang memang bekerja. */
    var kartu = Array.isArray(a.cardImages) ? a.cardImages : [];
    var pakaiKartu = kartu.length === scenes.length && kartu.length > 0;

    function sceneHTML(s, i) {
      if (pakaiKartu) {
        /* ⛔ TOMBOL "BACA LENGKAP" TETAP DI ATAS GAMBAR PENUTUP. Gambar kartu
           keempat MEMUAT ajakan itu sebagai gambar — dan gambar tidak bisa
           ditekan. Story yang berakhir dengan ajakan yang tidak bisa diketuk
           adalah persis cacat yang sudah pernah terjadi di layar ini (tombolnya
           81% tertutup zona ketuk "mundur", 20 Agustus 2026): satu-satunya
           tindakan yang dituju seluruh Story, dan ia mati. */
        return '<div class="kstory__scene kstory__scene--kartu">'
          + '<img src="' + esc(kartu[i]) + '" alt="" loading="' + (i === 0 ? "eager" : "lazy") + '">'
          + (s.kind === "end"
              ? '<a class="go" data-muat-penuh href="' + urlArtikel(a.slug) + '">' + esc(kata("stBaca")) + '</a>'
              : "")
          + '</div>';
      }
      return sceneTeksHTML(s);
    }

    function sceneTeksHTML(s) {
      if (s.kind === "cover") return '<div class="kstory__scene cover"><div><span class="lab">Glyiv News</span><h2>' + esc(s.title) + "</h2>" + (s.text ? "<p>" + esc(s.text) + "</p>" : "") + "</div></div>";
      if (s.kind === "hook") return '<div class="kstory__scene"><span class="lab">' + esc(a.topic) + "</span><h2>" + esc(s.title) + "</h2>" + (s.text ? "<p>" + esc(s.text) + "</p>" : "") + "</div>";
      if (s.kind === "stat") return '<div class="kstory__scene"><span class="lab">' + esc(kata("stAngka")) + '</span><div class="big">' + esc(s.big) + "</div><p>" + esc(s.label || "") + "</p>" + (s.source ? '<div class="src">' + esc(s.source) + "</div>" : "") + "</div>";
      if (s.kind === "quote") return '<div class="kstory__scene quote"><h2>' + esc(s.text) + "”</h2></div>";
      /* `data-muat-penuh` — alasan yang sama persis dengan `#kNext` di blok
         penutup artikel: tanpanya `PindahHalus` menyadap tautan ini di fase
         tangkap dan berpindah rute SEBELUM `keTeksLengkap()` sempat membatalkan,
         sehingga iklannya muncul di atas artikel yang sudah tergambar. Di sini
         cacatnya lebih mudah luput karena Story yang dibuka DARI artikelnya
         sendiri menunjuk alamat yang sama, dan PindahHalus kebetulan pulang
         lebih awal untuk kasus itu — tetapi Story yang dibuka dari FEED tidak. */
      if (s.kind === "end") {
        /* ⛔ Adegan penutup adalah teks BOILERPLATE kami, bukan isi artikel.
           Sampai 16 Agustus 2026 keempat kalimatnya ditulis keras dalam Bahasa
           Indonesia, jadi Story berbahasa Arab berakhir dengan layar berbahasa
           Indonesia — terukur di halaman hidup. Diambil dari kamus SAAT DIGAMBAR,
           bukan dari s.title/s.text yang diturunkan saat memuat, supaya ia
           benar walau artikelnya tidak punya blok terjemahan. */
        return '<div class="kstory__scene"><span class="lab">' + esc(kata("stSelesai")) + '</span><h2>' + esc(kata("stEndJudul")) + "</h2><p>" + esc(kata("stEndTeks")) + "</p>" + '<a class="go" data-muat-penuh href="' + urlArtikel(a.slug) + '">' + esc(kata("stBaca")) + '</a></div>';
      }
      return '<div class="kstory__scene"><span class="lab">' + esc(a.topic) + "</span><h2>" + esc(s.title || "") + "</h2>" + (s.text ? "<p>" + esc(s.text) + "</p>" : "") + "</div>";
    }
    /* ══════════════════════════════════════════════════════════════════════
       PEMICU N-B — SATU PINTU KELUAR, DAN SEMUA JALAN BERMUARA KE SINI
       ══════════════════════════════════════════════════════════════════════
       ⛔ INI PERBAIKAN ATAS CACAT NYATA DI RANCANGAN. Rancangan §3.4 berbunyi
       "iklan hanya pada ketukan `.go`, tidak pernah pada jalur otomatis". Itu
       TIDAK BISA DILAKSANAKAN sebagaimana ditulis, sebab ia hanya menyebut dua
       jalur sementara ada LIMA yang sampai ke akhir Story — dan empat di
       antaranya bermuara ke potongan kode yang SAMA:

         1. tautan `.go` di adegan `kind:"end"`  → `sceneHTML()`
         2. jam otomatis `schedule()`            → `show(idx+1)`
         3. papan tik `onKey` ArrowRight / Spasi → `show(idx+1)`
         4. tombol `.kstory__nav .next`          → `show(idx+1)`
         5. usap layar ke kiri (`touchend`)      → `show(idx+1)`

       Jalur 5 tidak disebut rancangan sama sekali, dan justru ITU jalur utama
       di tablet pemilik. Melarang "jalur otomatis" saja karena itu meninggalkan
       tiga jalur ketukan yang lolos tanpa iklan — atau, kalau ditambal satu per
       satu, membuka peluang iklan tampil dua kali.

       Yang dikerjakan sebagai gantinya:
         · jalur 2 (jam) DIPUTUS di sumbernya — lihat `schedule()`;
         · jalur 1, 3, 4, 5 semuanya diarahkan ke `keTeksLengkap()`;
         · `keluar` menjaga agar dua jalur yang menyala hampir bersamaan
           (usap + tombol) tetap menghasilkan satu iklan, bukan dua.

       ⛔ Tombol `×` TIDAK ikut ke sini. Itu batas KEPERGIAN. */
    var keluar = false;
    function keTeksLengkap() {
      if (keluar) return;
      keluar = true;
      clearTimeout(timer);
      catatUnitSelesai();
      var tujuan = urlArtikel(a.slug);
      lanjutDenganIklan(function () { close(); location.href = tujuan; }, "story");
    }
    function show(n) {
      if (n >= scenes.length) { keTeksLengkap(); return; }
      /* ⛔ `idx` IKUT DIKIRIM — tanpanya, mode kartu selalu menggambar gambar
         PERTAMA di setiap adegan: empat slide identik, tanpa satu pun galat. */
      if (n < 0) n = 0; idx = n; wrap.innerHTML = sceneHTML(scenes[idx], idx);
      var terakhir = idx >= scenes.length - 1;
      /* Pada adegan terakhir bilahnya langsung PENUH, tidak dianimasikan.
         Bilah yang merambat adalah janji "sebentar lagi pindah sendiri", dan
         sejak jam otomatisnya diputus janji itu tidak lagi ditepati. */
      bars.forEach(function (b, i) {
        b.classList.remove("act", "done");
        if (i < idx) b.classList.add("done");
        if (i === idx) {
          if (terakhir) b.classList.add("done");
          else if (!paused) { b.style.setProperty("--sdur", dur + "ms"); void b.offsetWidth; b.classList.add("act"); }
        }
      });
      schedule();
    }
    /* ⛔ ADEGAN TERAKHIR TIDAK PERNAH DIJADWALKAN, dan itu perbaikan yang berdiri
       sendiri terlepas dari iklan. Sebelumnya `show(7)` berjalan 5,2 detik
       sesudah adegan penutup tergambar dan langsung melompat ke artikel TANPA
       satu pun ketukan — sehingga tautan "Baca lengkap →" hampir tidak pernah
       sempat dibaca. Dengan iklan terpasang, ia akan jadi iklan yang muncul dari
       JAM, bukan dari tindakan: bentuk yang kebijakan AdMob sebut *"show
       unexpectedly"*. Orangnya bisa saja sudah meletakkan HP-nya.
       Sekarang adegan penutup MENUNGGU — ia memang ajakan bertindak. */
    function schedule() {
      clearTimeout(timer);
      if (paused) return;
      if (idx >= scenes.length - 1) return;
      timer = setTimeout(function () { show(idx + 1); }, dur);
    }
    function close() { clearTimeout(timer); storyEl.classList.remove("on"); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); else if (e.key === "ArrowRight" || e.key === " ") show(idx + 1); else if (e.key === "ArrowLeft") show(idx - 1); }
    pasangLapor($(".kstory__rep", storyEl), { kind: "ai-article", ref: a.slug + "#story", excerpt: a.title }, kata("lapor"));
    $(".kstory__x", storyEl).addEventListener("click", close);
    /* Tautan `.go` digambar ulang tiap adegan, jadi pendengarnya DIDELEGASIKAN
       ke wadahnya — memasangnya pada simpul tautan berarti memasangnya ulang
       tiap `show()`, dan yang lama menunjuk simpul yang sudah dibuang. */
    wrap.addEventListener("click", function (e) {
      var go = e.target && e.target.closest ? e.target.closest(".go") : null;
      if (!go) return;
      e.preventDefault(); e.stopPropagation();
      keTeksLengkap();
    });
    $(".kstory__nav .next", storyEl).addEventListener("click", function () { show(idx + 1); });
    $(".kstory__nav .prev", storyEl).addEventListener("click", function () { show(idx - 1); });
    var pb = $(".kstory__pause", storyEl);
    pb.addEventListener("click", function () { paused = !paused; pb.textContent = paused ? "▶ main" : kata("jeda"); if (paused) clearTimeout(timer); else show(idx); });
    var tx = 0; stage.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); });
    $$(".kstory__share button", storyEl).forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); var net = b.dataset.net; if (net === "gen") openShare(a); else shareTo(net, a); }); });
    document.body.style.overflow = "hidden"; document.addEventListener("keydown", onKey); storyEl.classList.add("on"); show(0);
  }

  /* ============================ SHARE ============================ */
  /* ⛔ ALAMAT BERBAGI: SELALU jalur `/news/article/<slug>` di host kanonis, apa
     pun host tempat berkas ini berjalan.

     Dua hal yang diperbaiki sekaligus, dan keduanya terukur sebagai cacat:
       1. **Bentuk kueri tidak bisa punya cuplikan sendiri.** `?a=<slug>` bukan
          bagian dari nama berkas, jadi Hosting menyajikan SATU berkas untuk 102
          artikel — perayap WhatsApp/Telegram/X melihat judul beranda situs untuk
          setiap artikel yang dibagikan. Bentuk jalur punya berkas statisnya
          sendiri (`scripts/buat-halaman-berbagi.cjs`).
       2. **`location.origin` menyebarkan host yang salah.** Dijalankan di
          glyiv.github.io ia membagikan tautan github.io; di kanal pratinjau atau
          localhost ia membagikan alamat yang tidak bisa dibuka siapa pun.
          Yang dibagikan ke luar harus alamat kanonis pemilik.

     ⚠︎ Ini SATU-SATUNYA tempat nama domain ditulis di berkas ini, dan ia
     pengecualian yang dituntut fungsinya — kelas yang sama dengan `canonical` di
     `src/components/Kanonis.tsx` dan `scripts/buat-sitemap.cjs`. Tautan NAVIGASI
     tetap relatif; lihat `urlArtikel()`. */
  var ASAL_KANONIS = "https://glyiv.io";
  function shareUrl(a) { return ASAL_KANONIS + JALUR_ARTIKEL + enc(a.slug); }
  function shareText(a) { return a.title + " — Glyiv News"; }
  /* ⚠︎ Dulu `aria-label="Bagikan " + net` — dan `net` adalah KODE ("wa", "x"),
     bukan nama. Pembaca layar melafalkan "Bagikan wa". Sekaligus tak mungkin
     diterjemahkan: kuncinya harus "Bagikan wa", string yang tidak berarti apa
     pun dalam bahasa mana pun. Nama aslinya dipakai, dan kunci kamusnya
     ("Bagikan WhatsApp", "Bagikan X") kini kalimat yang wajar. */
  var NAMA_NET = { x: "X", fb: "Facebook", li: "LinkedIn", wa: "WhatsApp", ig: "Instagram" };
  function sbtn(net) { return '<button data-net="' + net + '" aria-label="' + esc(kata("bagikanKe")) + ' ' + (NAMA_NET[net] || net) + '">' + ssvg(net) + "</button>"; }
  function shareTo(net, a) {
    var u = enc(shareUrl(a)), t = enc(shareText(a));
    var map = { x: "https://twitter.com/intent/tweet?text=" + t + "&url=" + u, fb: "https://www.facebook.com/sharer/sharer.php?u=" + u, li: "https://www.linkedin.com/sharing/share-offsite/?url=" + u, wa: "https://wa.me/?text=" + t + "%20" + u };
    if (net === "ig") { if (navigator.clipboard) navigator.clipboard.writeText(shareUrl(a)); toast(kata("tautanIg")); window.KE.share(a.slug); return; }
    if (net === "native" && navigator.share) { navigator.share({ title: a.title, text: shareText(a), url: shareUrl(a) }).then(function () { window.KE.share(a.slug); }).catch(function () {}); return; }
    if (map[net]) { window.open(map[net], "_blank", "noopener,width=620,height=560"); window.KE.share(a.slug); }
  }
  var shareEl = null;
  function openShare(a) {
    if (!shareEl) { shareEl = document.createElement("div"); shareEl.className = "kshare"; document.body.appendChild(shareEl); shareEl.addEventListener("click", function (e) { if (e.target === shareEl) shareEl.classList.remove("on"); }); }
    var nets = [["x", "X", "#0f1419"], ["fb", "Facebook", "#1877f2"], ["li", "LinkedIn", "#0a66c2"], ["wa", "WhatsApp", "#25d366"], ["ig", "Instagram", "linear-gradient(45deg,#f09433,#dc2743,#bc1888)"]];
    shareEl.innerHTML = '<div class="kshare__panel" data-i18n-skip><h4>' + esc(kata("bagikanArtikel")) + '</h4><p class="sub">' + esc(kata("bagikanSub")) + '</p>' +
      '<div class="kshare__row">' + nets.map(function (n) { return '<button class="kshare__btn" data-net="' + n[0] + '"><span class="ic" style="background:' + n[2] + '">' + ssvg(n[0]) + "</span>" + n[1] + "</button>"; }).join("") + "</div>" +
      '<div class="kshare__copy"><input readonly value="' + esc(shareUrl(a)) + '"><button data-copy data-i18n-skip>' + esc(kata("salin")) + '</button></div>' +
      (navigator.share ? '<button data-net="native" style="width:100%;margin-top:12px;background:var(--paper2);border:1px solid var(--hair);border-radius:12px;padding:12px;font-weight:700;color:var(--pine);cursor:pointer">Bagikan via perangkat…</button>' : "") + "</div>";
    $$("[data-net]", shareEl).forEach(function (b) { b.addEventListener("click", function () { shareTo(b.dataset.net, a); if (b.dataset.net !== "ig") shareEl.classList.remove("on"); }); });
    $("[data-copy]", shareEl).addEventListener("click", function () { if (navigator.clipboard) navigator.clipboard.writeText(shareUrl(a)); toast(kata("tautanDisalin")); window.KE.share(a.slug); });
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

  function pasangReveal() {
    if ("IntersectionObserver" in window) { var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } }); }, { threshold: 0.1 }); $$("[data-r]").forEach(function (el) { rio.observe(el); }); }
    else $$("[data-r]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ⛔ DI SITUS STATIS BERKAS INI JALAN SEKALI PER MUAT HALAMAN; DI APLIKASI
     REACT TIDAK. `useSiteScripts` memuat tiap `<script src>` SEKALI PER SESI
     (lihat Set `loaded` di src/hooks/useSiteScripts.ts), jadi berpindah
     /news → /news/studio → /news TIDAK menjalankan berkas ini lagi, sementara
     React sudah mengganti seluruh simpulnya dengan yang baru dan kosong.
     Yang tersisa: halaman tanpa satu pun kartu, tanpa satu pun galat.

     `glyiv:page` dikirim `useSiteScripts` SETIAP halaman dipasang — persis untuk
     ini, dan sudah dipakai glyiv-nav.js, glyiv-cards.js, hero-langkah.js, dan
     dok-hukum.js. Kabar tidak pernah ikut memakainya. Sekarang ikut.
     Penjaga `dataset.kSiap` di initFeed/initArticle membuat pemanggilan pada
     simpul yang SAMA tidak berbiaya apa pun. */
  function boot() {
    initFeed();
    var root = $("#kart");
    if (root && !root.dataset.kSiap) { root.dataset.kSiap = "1"; initArticle(); }
    pasangReveal();
  }
  boot();
  window.addEventListener("glyiv:page", boot);

  /* ── bahasa berubah → label RAKITAN digambar ulang ──────────────────────────
     Konsekuensi wajib dari `data-i18n-skip`: mesin kamus kini menjauh dari
     elemen-elemen itu, jadi kalau tidak ada yang menggambarnya ulang ia akan
     tinggal dalam bahasa saat pertama dirender. Ini pasangan sahnya.

     Dipasang pada `document`, sama dengan yang didengar site-lang.js:
     `umumkan()` di i18n.js memancarkan "glyiv:lang" SAAT SIAP dan setiap kali
     bahasa diganti — jadi urutan muat tidak penting. Kalau berkas ini merender
     lebih dulu daripada mesin kamus selesai memuat kamusnya (di halaman statis
     mesin datang lewat rantai glyiv-nav.js → site-lang.js, yaitu SESUDAH
     berkas ini), pengumuman pertama itulah yang membetulkannya.
     Tidak bisa berputar: menggambar ulang tidak memancarkan "glyiv:lang". */
  function segarkanLabel() {
    if (gambarUlangFeed) gambarUlangFeed();                 // pager + meta kartu
    /* ⛔ ARTIKEL YANG SEDANG TERBUKA HARUS IKUT DIGAMBAR ULANG.
       Sebelum ada baris ini, mengganti bahasa di halaman artikel hanya
       mengganti label ("2 mnt baca" → "2 min read") sementara judul, dek, dan
       seluruh badannya tetap dalam bahasa sebelumnya — sebab naskah per bahasa
       dipilih di `initArticle()`, dan `initArticle()` tidak pernah dipanggil
       lagi. Pembaca melihat halaman setengah berganti dan menyimpulkan
       terjemahannya rusak. `artikelTerpasang` dikosongkan lebih dulu supaya
       penjaga "sudah tergambar" tidak menolak gambar ulangnya. */
    if (artikelTerpasang && $("#kart")) { artikelTerpasang = null; initArticle(); }
    $$("[data-baca]").forEach(function (e) {
      var a = window.__kGet(e.getAttribute("data-baca"));
      if (a) e.textContent = a.read + " " + kata("mntBaca");
    });
    $$("[data-bacalive]").forEach(function (e) { e.textContent = kata("baca"); });
    /* Tanggal ikut bahasa. Wadahnya `data-i18n-skip` (isinya angka + nama bulan
       yang dirakit, bukan kunci kamus), jadi tanpa baris ini "15 Agu 2026" akan
       bertahan di halaman Inggris dan Arab — dan "Hari ini"/"Kemarin" jauh lebih
       kentara lagi. `datetime` TIDAK ikut berubah: ia sudah ISO, satu untuk
       semua bahasa, dan itulah yang dibaca mesin. */
    $$("[data-date]").forEach(function (e) {
      var a = window.__kGet(e.getAttribute("data-date"));
      if (a) e.textContent = publishLabel(a);
    });
    var stamp = $("[data-archive-updated]");
    if (stamp) stamp.textContent = archiveStampText();
    /* Baris kredit gambar. Wadahnya `data-i18n-skip`, jadi mesin kamus TIDAK
       akan menyentuhnya saat bahasa berganti — dan itu memang yang diinginkan
       untuk nama fotografernya. Konsekuensinya kata penghubungnya harus
       dirakit ulang DI SINI; tanpa baris ini, "Foto oleh" akan tetap berbahasa
       Indonesia di halaman Inggris dan Arab, tanpa satu galat pun. */
    $$("[data-kredit]").forEach(function (e) {
      var a = window.__kGet(e.getAttribute("data-kredit"));
      if (a && a.coverCredit) e.innerHTML = kreditIsi(a.coverCredit);
    });
    $$("[data-orb]").forEach(function (e) {
      var a = window.__kGet(e.getAttribute("data-orb"));
      if (a) e.textContent = teksOrb(a);
    });
    if (window.__kRefreshCounts) window.__kRefreshCounts();  // "1.2rb" → "1.2k"
  }
  document.addEventListener("glyiv:lang", segarkanLabel);
})();
