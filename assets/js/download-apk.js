/* ═══════════════════════════════════════════════════════════════════════════
   GLYIV — TAUTAN UNDUH APK ANDROID
   ═══════════════════════════════════════════════════════════════════════════

   ⬇ INI SATU-SATUNYA BERKAS YANG PERLU DISUNTING UNTUK MENYALAKAN TOMBOL UNDUH.
     Tidak ada URL unduhan di berkas lain mana pun. Kalau Anda menemukan satu,
     itu cacat — pindahkan ke sini.

   CARA MEMAKAINYA
   ---------------
   1. Unggah berkas APK-nya (mis. ke Google Drive), lalu setel berbagi menjadi
      "siapa saja yang punya link".
   2. Tempel tautannya ke medan yang tepat di dalam `tautan` di bawah.
   3. Simpan berkas ini. Tombol "Unduh APK" di halaman /unduh menyala sendiri,
      dan pita "belum tersedia" di atas halaman ikut berubah. Tidak ada berkas
      lain yang perlu diubah, tidak ada yang perlu dibangun ulang.

   BENTUK TAUTAN GOOGLE DRIVE — DIUJI, DAN DUA BENTUK YANG "BIASA" DIPAKAI GAGAL
   ----------------------------------------------------------------------------
   Google menandai SETIAP berkas .apk sebagai tidak bisa dipindai, dan menyisipkan
   layar peringatan sebelum unduhannya. Ini bukan soal ukuran — keenam berkas kami
   cuma 17–30 KB dan tetap kena. Ditarik sungguhan pada 31 Juli 2026, keenam ID:

      https://drive.google.com/file/d/<ID>/view      → HTML, bukan APK
      https://drive.google.com/uc?export=download&id=<ID>
                                                     → HTML 2,4 KB berjudul
                                                       "Google Drive - Virus scan warning"

   Kalau salah satu bentuk itu dipasang sebagai tombol "Unduh", yang dilihat
   pengunjung adalah layar peringatan virus Google ATAS APLIKASI KAMI SENDIRI.
   Untuk produk iklim yang sedang membangun kepercayaan, itu kesan pertama yang
   mahal — dan tidak ada gerbang otomatis yang akan pernah menangkapnya, karena
   tautannya "berfungsi": ia menjawab HTTP 200.

   Bentuk yang BENAR-BENAR mengirim berkasnya (dipakai di bawah):
      https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t

   `<ID>` adalah potongan panjang di tengah alamat berbagi Drive.

   Biarkan "" selama tautannya belum ada. Halaman TIDAK menyembunyikan kartunya
   dan TIDAK menampilkan tombol abu-abu tanpa sebab — ia menulis alasannya di
   layar, karena pemilik dan pengunjung memakai layar sentuh dan tooltip `title`
   tidak pernah muncul di sana.

   ⚠︎ SIDIK SHA-256 DAN UKURAN TIDAK TINGGAL DI BERKAS INI — DAN ITU PERNAH
   MENYESATKAN. Catatan lama di sini menyuruh "perbarui `sha256` dan
   `ukuranByte` di sini pada ronde yang sama"; kedua medan itu SUDAH TIDAK ADA
   di berkas ini. Angka yang benar-benar dilihat pengunjung dicetak langsung di
   `dist/download.html` (`<div class="und-sidik__v" data-sha>` di tiap kartu, dan
   ukurannya di baris `Glyiv-….apk &middot; NN,N KB`). Siapa pun yang menyunting
   berkas ini "untuk memperbarui sidik" akan mengira pekerjaannya selesai
   sementara halaman tetap memajang angka basi — persis kegagalan yang sidik itu
   ada untuk mencegah.
   Yang benar: `node scripts/kumpulkan-apk.cjs` — ia membangun, mengukur ulang,
   dan menulis sidik ke `dist/download.html` PLUS menyetel `driveMutakhir: true` di
   sini, dalam satu perintah. Jangan mengetik sidik dengan tangan.
      PowerShell : Get-FileHash -Algorithm SHA256 .\Glyiv-Pocket.apk
      Git Bash   : sha256sum Glyiv-Pocket.apk

   Berkas sumbernya ada di repo `glyiv-app`:
      green-assets/rilis/apk/Glyiv-Green-Assets.apk
      ukur/rilis/apk/Glyiv-DBH.apk
      saku/rilis/apk/Glyiv-Pocket.apk
      news/rilis/apk/Glyiv-News.apk
      cip/outlet/rilis/apk/Glyiv-Outlet.apk
      cip/outlet/rilis/apk/Glyiv-Outlet.apk
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  window.GLYIV_APK = {
    /* Tanggal berkas APK ini dibangun. Ditampilkan di layar. */
    dibangun: "2026-08-09",

    /* ⛔ SAKLAR KEJUJURAN — jangan dihapus, dan jangan disetel `true` sambil
       menebak.
       `false` berarti: APK sudah dibangun ulang di repo, tetapi berkas yang
       duduk di Google Drive MASIH VERSI LAMA. Selama itu, `sha256` di kartu
       halaman /unduh adalah sidik berkas BARU — jadi siapa pun yang mengunduh
       hari ini lalu mencocokkannya akan mendapat "TIDAK COCOK" atas berkas yang
       sebenarnya sah. Itu tuduhan palsu terhadap aplikasi kita sendiri, dan
       orang paling teliti — orang yang paling ingin kita yakinkan — yang
       pertama kena.
       Karena itu halaman menampilkan pita peringatan selama nilainya `false`.
       `node scripts/kumpulkan-apk.cjs` MENYETELNYA KE `false` setiap kali ia
       membangun ulang; setel `true` HANYA sesudah keenam berkas benar-benar
       diganti di Drive dan salah satunya ditarik ulang untuk dicocokkan. */
    driveMutakhir: true,

    /* Sertifikat penanda tangan — sama untuk keenam berkas (sudah diperiksa,
       bukan diasumsikan). Selama `jenis` masih "debug", halaman WAJIB memberi
       tahu bahwa aplikasi ini tidak bisa diperbarui lewat Play Store nanti. */
    sertifikat: {
      jenis: "rilis",
      nama: "CN=PT WOSU Innovation Technology, OU=Glyiv, O=PT WOSU Innovation Technology, L=Indonesia, C=ID",
      sha1: "2A:87:0D:1B:69:D1:46:1C:A8:7E:DD:68:41:68:1C:5B:65:44:67:E7",
      sha256: "80:F5:75:C7:D4:C6:B3:C2:E9:D1:81:41:10:88:BD:3C:C0:08:11:A0:37:E3:41:4F:38:41:C0:99:26:48:A8:F8"
    },

    /* ── TAUTANNYA DI SINI ────────────────────────────────────────────────────
       Diunggah pemilik ke Google Drive 31 Juli 2026. Keenamnya SUDAH DITARIK dan
       diperiksa, bukan sekadar ditempel: `aapt2 dump badging` atas hasil unduhan
       membuktikan tiap tautan berisi paket yang namanya cocok dengan labelnya
       (nol tertukar), dan SHA-256 hasil unduhan cocok persis dengan angka
       `sha256` di kartunya masing-masing.
       Catatan pemeriksaan itu lengkap di `dokumen/TAUTAN-APK.md`.

       ⚠︎ ID Drive-nya TETAP saat APK dibangun ulang — yang pemilik ganti adalah
       ISI berkas di ID yang sama, lewat "Kelola versi" di Drive. Jangan pernah
       mengunggah sebagai berkas BARU: ID-nya berubah, keenam tautan di bawah
       mati, dan tidak ada yang akan melihatnya sampai ada yang mengadu. */
    tautan: {
      "co.glyiv.greenassets": "/download/Glyiv-Green-Assets.apk",
      "co.glyiv.dbh": "/download/Glyiv-DBH.apk",
      "co.glyiv.pocket": "/download/Glyiv-Pocket.apk",
      "co.glyiv.news": "/download/Glyiv-News.apk",
      "co.glyiv.outlet": "/download/Glyiv-GIP-Outlet.apk"
    }
  };
})();
