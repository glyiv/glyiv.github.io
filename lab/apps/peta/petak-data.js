/* ══════════════════════════════════════════════════════════════════════════════
   PETAK CONTOH GLYIV — SATU-SATUNYA daftar petak untuk SELURUH Glyiv
   ══════════════════════════════════════════════════════════════════════════════

   ⚠︎ DATA CONTOH PROTOTIPE. Tidak satu pun petak di bawah adalah lahan milik
   Glyiv, lahan klien, atau lahan yang sedang dipantau untuk siapa pun.
   Koordinatnya sengaja jatuh di daratan yang benar-benar punya citra satelit,
   supaya peta tidak menampilkan kotak abu-abu. Selebihnya angka peragaan ⚠︎.

   ── KENAPA BERKAS INI ADA ───────────────────────────────────────────────────
   Sampai ronde ini ada DUA daftar petak yang hidup terpisah:

     · `dist/lab/apps/peta/app.js`  — 14 petak (GLYV-P01…P14)
     · `src/lib/petakContoh.ts`     — 10 petak (GLV-SMP-01…10)

   Keduanya memakai KOORDINAT YANG SAMA untuk petak yang sama, tetapi memberi
   LUAS dan NDVI yang berbeda. Contoh nyata sebelum perbaikan:

     Mangrove Pesisir Selatan  (-5,17 / 120,29)   42 ha di /lab/apps/peta
                                                  84 ha di aplikasi Hijau
     Restorasi Tepi Gambut     ( 0,618 / 102,047) 96 ha · NDVI 0,64
                                                 240 ha · NDVI 0,34

   Satu petak yang sama tidak boleh punya dua luas berbeda di dua halaman —
   pada produk iklim itu bukan sekadar tidak rapi, itu angka yang tidak bisa
   dipertanggungjawabkan. Sejak sekarang HANYA berkas ini yang menyimpan
   angkanya. `src/lib/petakContoh.ts` DIBANGKITKAN dari sini oleh
   `node scripts/sinkron-petak.cjs`, dan `--periksa` menggagalkan gerbang kalau
   keduanya melenceng lagi.

   ── YANG DISIMPAN VS YANG DITURUNKAN ────────────────────────────────────────
   Yang DISIMPAN hanyalah besaran dasar: koordinat, luas, NDVI, spesies,
   tingkat data, tanggal citra contoh. Semua turunannya — tutupan tajuk, jumlah
   pohon, estimasi serapan — DIHITUNG di bawah dengan rumus yang sama persis
   dengan aplikasi React, sehingga tidak mungkin lagi ada angka hasil ketik
   tangan yang berbeda dari hasil hitung aplikasinya.

   Konstanta rumusnya adalah CERMIN dari sumber TypeScript-nya:
     · KERAPATAN_TANAM_PER_HA → `src/lib/hijau/pohonVirtual.ts`
     · NDVI_SOIL / NDVI_DENSE / SERAPAN_PER_HA → `src/lib/ndvi.ts`
   `scripts/sinkron-petak.cjs` MEMBACA ketiga konstanta itu dari berkas TS-nya
   dan menolak berjalan kalau nilainya beda. Jadi cermin ini bukan salinan yang
   bisa membusuk diam-diam — ia salinan yang dijaga gerbang.

   ── BENTUK POLIGON ──────────────────────────────────────────────────────────
   Berkas ini TIDAK menyimpan batas poligon, dan itu disengaja: kami tidak punya
   delineasi untuk koordinat-koordinat ini. Halaman /lab/apps/peta membangkitkan
   cincin bergelombang dari benih tetap, aplikasi Hijau membangkitkan cincin
   beraturan yang dikalibrasi ke luas petak. Keduanya PERKIRAAN dan keduanya
   mengatakan itu di layar.

   Dimuat sebagai <script> biasa (bukan modul) supaya bisa dipakai halaman
   statis glyiv.github.io, halaman hasil port di glyiv.web.app, DAN skrip Node
   yang menyinkronkan versi TypeScript-nya.
   ══════════════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";

  /* ── konstanta cermin (dijaga scripts/sinkron-petak.cjs) ─────────────────── */

  /** Perkiraan kasar batang/ha. Cermin `KERAPATAN_TANAM_PER_HA` di pohonVirtual.ts. */
  var KERAPATAN_TANAM_PER_HA = 900;

  /** Endmember NDVI. Cermin `NDVI_SOIL` / `NDVI_DENSE` di src/lib/ndvi.ts. */
  var NDVI_SOIL = 0.15;
  var NDVI_DENSE = 0.85;

  /** tCO₂e/ha/tahun. Cermin `ABSORPTION_PER_HA` di src/lib/ndvi.ts. */
  var SERAPAN_PER_HA = {
    mangrove: { mid: 13.5, lo: 8.0, hi: 19.0, label: "Mangrove pesisir" },
    hutan: { mid: 9.0, lo: 5.5, hi: 13.0, label: "Restorasi hutan" },
    agro: { mid: 5.5, lo: 3.0, hi: 8.0, label: "Agroforestri" },
    pulih: { mid: 3.5, lo: 1.5, hi: 6.0, label: "Pemulihan lahan kritis" }
  };

  /* ── rumus turunan (cermin src/lib/ndvi.ts + pohonVirtual.ts) ────────────── */

  /** fc = (NDVI − tanah) / (rapat − tanah), dijepit 0..1. */
  function fraksiTajuk(ndvi) {
    if (NDVI_DENSE <= NDVI_SOIL) return 0;
    return Math.min(1, Math.max(0, (ndvi - NDVI_SOIL) / (NDVI_DENSE - NDVI_SOIL)));
  }

  /** Estimasi serapan tahunan — SELALU rentang, tidak pernah angka tunggal. */
  function serapan(ha, ndvi, spesies) {
    var laju = SERAPAN_PER_HA[spesies] || SERAPAN_PER_HA.hutan;
    var efektif = Math.max(0, ha) * fraksiTajuk(ndvi);
    return {
      mid: Math.round(efektif * laju.mid),
      lo: Math.round(efektif * laju.lo),
      hi: Math.round(efektif * laju.hi)
    };
  }

  /**
   * Perkiraan jumlah batang. SATU kerapatan untuk semua spesies — bukan karena
   * itu benar (mangrove memang jauh lebih rapat daripada agroforestri), tetapi
   * karena tidak ada satu pun angka per-spesies bersumber di pustaka Glyiv, dan
   * mengarang angka bersumber palsu pada produk iklim dilarang. Alasan panjangnya
   * ada di `src/lib/hijau/pohonVirtual.ts`.
   */
  function jumlahPohon(ha) {
    return Math.round(ha * KERAPATAN_TANAM_PER_HA);
  }

  /* ── BESARAN DASAR — satu-satunya angka yang diketik tangan ──────────────── */

  /* `kind`     kelompok tampilan di halaman peta (chip filter).
     `spesies`  SpeciesId aplikasi Hijau: mangrove | hutan | agro | pulih.
                Dua petak "komoditas" memakai `agro` karena keduanya memang
                agroforestri berpohon peneduh — kelompok bursanya ada di `kind`.
     `terrain`  + `provId`: kunci terjemahan halaman /peta-aset (React, i18n).
     `tingkat`  1 = citra satelit · 2 = + kunjungan lapangan · 3 = + plot ukur.
                Turunannya `kelasData`: 1 → "C", 2 & 3 → "B". Tier A (MRV
                terverifikasi) SENGAJA tidak pernah muncul — kami belum punya. */
  var DASAR = [
    {
      id: "GLYV-P01", short: "Mangrove Selatan", kind: "mangrove", spesies: "mangrove",
      name: "Mangrove Pesisir Selatan", prov: "Sulawesi Selatan", provId: "sulsel", terrain: "coast",
      /* Tongke-Tongke, Sinjai — pesisir Teluk Bone (bukan pedalaman). */
      lat: -5.1700, lng: 120.2930, ha: 42,
      species: ["Bakau (Rhizophora mucronata)", "Api-api (Avicennia marina)"],
      year: 2021, ndvi: 0.71, tingkat: 2,
      obs: "2026-07-14", sat: "Sentinel-2 L2A · tutupan awan 6%"
    },
    {
      id: "GLYV-P02", short: "Tepi Gambut", kind: "hutan", spesies: "hutan",
      name: "Restorasi Tepi Gambut Timur", prov: "Riau", provId: "riau", terrain: "peat",
      lat: 0.6180, lng: 102.0470, ha: 96,
      species: ["Balangeran (Shorea balangeran)", "Pulai rawa (Alstonia pneumatophora)"],
      year: 2020, ndvi: 0.64, tingkat: 1,
      obs: "2026-07-09", sat: "Sentinel-2 L2A · tutupan awan 21%"
    },
    {
      id: "GLYV-P03", short: "Agro Kaki Gunung", kind: "agro", spesies: "agro",
      name: "Agroforestri Kaki Gunung", prov: "Jawa Barat", provId: "jabar", terrain: "highland",
      lat: -7.1400, lng: 107.6200, ha: 28,
      species: ["Kopi arabika", "Suren (Toona sureni)", "Alpukat"],
      year: 2022, ndvi: 0.68, tingkat: 2,
      obs: "2026-07-16", sat: "Sentinel-2 L2A · tutupan awan 12%"
    },
    {
      id: "GLYV-P04", short: "Dataran Tinggi", kind: "hutan", spesies: "hutan",
      name: "Restorasi Hutan Dataran Tinggi", prov: "Jawa Tengah", provId: "jateng", terrain: "hills",
      lat: -7.3020, lng: 110.0460, ha: 61,
      species: ["Rasamala (Altingia excelsa)", "Puspa (Schima wallichii)", "Saninten"],
      year: 2019, ndvi: 0.76, tingkat: 2,
      obs: "2026-07-12", sat: "Sentinel-2 L2A · tutupan awan 9%"
    },
    {
      id: "GLYV-P05", short: "Delta Mangrove", kind: "mangrove", spesies: "mangrove",
      name: "Mangrove Delta Mahakam", prov: "Kalimantan Timur", provId: "kaltim", terrain: "coast",
      /* Delta Mahakam — muara/estuari pesisir (bukan dekat kota Samarinda). */
      lat: -0.9000, lng: 117.5600, ha: 118,
      species: ["Bakau minyak (Rhizophora apiculata)", "Nipah (Nypa fruticans)"],
      year: 2018, ndvi: 0.73, tingkat: 2,
      obs: "2026-07-11", sat: "Sentinel-2 L2A · tutupan awan 17%"
    },
    {
      id: "GLYV-P06", short: "Lahan Kritis", kind: "pulih", spesies: "pulih",
      name: "Rehabilitasi Lahan Kritis", prov: "Nusa Tenggara Timur", provId: "ntt", terrain: "savanna",
      lat: -9.6480, lng: 124.0520, ha: 74,
      species: ["Kayu putih (Melaleuca cajuputi)", "Johar", "Gamal"],
      year: 2021, ndvi: 0.42, tingkat: 1,
      obs: "2026-06-28", sat: "Landsat 9 OLI-2 · tutupan awan 14%"
    },
    {
      id: "GLYV-P07", short: "Penyangga Papua", kind: "hutan", spesies: "hutan",
      name: "Hutan Penyangga Dataran Rendah", prov: "Papua Barat Daya", provId: "pbd", terrain: "hills",
      lat: -1.2050, lng: 132.1120, ha: 150,
      species: ["Matoa (Pometia pinnata)", "Merbau (Intsia bijuga)", "Bintangur"],
      year: 2017, ndvi: 0.82, tingkat: 1,
      obs: "2026-07-06", sat: "Sentinel-2 L2A · tutupan awan 28%"
    },
    {
      id: "GLYV-P08", short: "Agro Kopi", kind: "agro", spesies: "agro",
      name: "Agroforestri Kopi Dataran Tinggi", prov: "Aceh", provId: "aceh", terrain: "valley",
      lat: 4.6010, lng: 96.8480, ha: 36,
      species: ["Kopi arabika", "Lamtoro (Leucaena leucocephala)", "Alpukat"],
      year: 2022, ndvi: 0.66, tingkat: 2,
      obs: "2026-07-15", sat: "Sentinel-2 L2A · tutupan awan 11%"
    },
    {
      id: "GLYV-P09", short: "Koridor Riparian", kind: "hutan", spesies: "hutan",
      name: "Koridor Riparian Sungai", prov: "Sumatera Selatan", provId: "sumsel", terrain: "corridor",
      lat: -2.9200, lng: 104.0500, ha: 53,
      species: ["Bambu betung", "Trembesi (Samanea saman)", "Ketapang"],
      year: 2023, ndvi: 0.58, tingkat: 2,
      obs: "2026-07-13", sat: "Sentinel-2 L2A · tutupan awan 19%"
    },
    {
      id: "GLYV-P10", short: "Sabuk Hijau", kind: "pulih", spesies: "pulih",
      name: "Sabuk Hijau Kawasan Penyangga", prov: "Banten", provId: "banten", terrain: "lowland",
      lat: -6.3480, lng: 106.1520, ha: 12,
      species: ["Trembesi (Samanea saman)", "Tabebuya", "Mahoni"],
      year: 2023, ndvi: 0.55, tingkat: 3,
      obs: "2026-07-18", sat: "Sentinel-2 L2A · tutupan awan 8%"
    },
    {
      id: "GLYV-P11", short: "Mangrove Muara", kind: "mangrove", spesies: "mangrove",
      name: "Mangrove Muara Perancak", prov: "Bali", provId: "bali", terrain: "coast",
      /* Perancak, Jembrana — muara pesisir barat-daya Bali (bukan pedalaman). */
      lat: -8.4080, lng: 114.6100, ha: 19,
      species: ["Bakau (Rhizophora stylosa)", "Perepat (Sonneratia alba)"],
      year: 2020, ndvi: 0.74, tingkat: 3,
      obs: "2026-07-17", sat: "Sentinel-2 L2A · tutupan awan 5%"
    },
    {
      id: "GLYV-P12", short: "Pascatambang", kind: "pulih", spesies: "pulih",
      name: "Restorasi Lahan Pascatambang", prov: "Kalimantan Selatan", provId: "kalsel", terrain: "lowland",
      lat: -3.6200, lng: 115.3800, ha: 88,
      species: ["Sengon (Falcataria moluccana)", "Jabon", "Trembesi"],
      year: 2020, ndvi: 0.61, tingkat: 2,
      obs: "2026-07-08", sat: "Landsat 9 OLI-2 · tutupan awan 16%"
    },
    {
      /* ── LAHAN PRODUKTIF / KOMODITAS — bursa penawaran-permintaan ── */
      id: "GLYV-P13", short: "Kebun Stroberi", kind: "komoditas", spesies: "agro",
      name: "Kebun Stroberi Dataran Tinggi", prov: "Jawa Barat", provId: "jabar", terrain: "highland",
      /* Dataran tinggi Ciwidey — sentra stroberi (lahan produktif). */
      lat: -7.1330, lng: 107.3720, ha: 8,
      species: ["Stroberi (Fragaria × ananassa)", "Pohon peneduh: alpukat"],
      year: 2023, ndvi: 0.62, tingkat: 3,
      obs: "2026-07-19", sat: "Sentinel-2 L2A · tutupan awan 7%",
      komoditas: {
        nama: "Stroberi", unit: "kg",
        panen: 3200,           /* estimasi panen musim ini (kg) ⚠︎ */
        terjual: 2100,         /* sudah dipesan/dimiliki (kg) — dasar permintaan */
        hargaWajar: 45000,     /* harga wajar konsumen /kg ⚠︎ */
        hargaTengkulak: 22000, /* yang biasa diterima petani lewat tengkulak /kg ⚠︎ */
        bagiPetani: 78, bagiOperasi: 10, bagiPemilik: 12 /* % dari harga wajar */
      }
    },
    {
      id: "GLYV-P14", short: "Kebun Vanili", kind: "komoditas", spesies: "agro",
      name: "Kebun Vanili Agroforestri", prov: "Bali", provId: "bali", terrain: "highland",
      /* Dataran tinggi Bedugul — hortikultura/vanili (lahan produktif). */
      lat: -8.2750, lng: 115.1650, ha: 14,
      species: ["Vanili (Vanilla planifolia)", "Gamal (panjatan)", "Kopi"],
      year: 2022, ndvi: 0.69, tingkat: 2,
      obs: "2026-07-18", sat: "Sentinel-2 L2A · tutupan awan 10%",
      komoditas: {
        nama: "Vanili kering", unit: "kg",
        panen: 210, terjual: 120,
        hargaWajar: 3200000, hargaTengkulak: 1600000,
        bagiPetani: 74, bagiOperasi: 12, bagiPemilik: 14
      }
    }
  ];

  /* ── TURUNAN ─────────────────────────────────────────────────────────────── */

  var PETAK = DASAR.map(function (p) {
    var c = serapan(p.ha, p.ndvi, p.spesies);
    var salinan = {};
    for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) salinan[k] = p[k];
    salinan.canopy = Math.round(fraksiTajuk(p.ndvi) * 100);
    salinan.trees = jumlahPohon(p.ha);
    salinan.co2 = c.mid;
    salinan.co2lo = c.lo;
    salinan.co2hi = c.hi;
    /* `tier` DIPERTAHANKAN namanya karena app.js sudah memakainya sebagai kunci
       TIERS 1/2/3; `kelasData` adalah bentuk B/C yang dipakai halaman React. */
    salinan.tier = p.tingkat;
    salinan.kelasData = p.tingkat >= 2 ? "B" : "C";
    return salinan;
  });

  /**
   * Kalimat yang WAJIB ikut tampil setiap kali petak contoh dipakai di luar
   * halaman peta. Jangan diperhalus, dan jangan diringkas jadi "data contoh"
   * saja — yang penting justru bagian "bukan lahan milik Glyiv".
   */
  var CATATAN =
    "Petak contoh adalah data prototipe Glyiv: bukan lahan milik Glyiv, bukan lahan klien, dan bukan lahan yang sedang dipantau siapa pun. Berkas datanya hanya menyimpan titik pusat dan luas — batas poligonnya tidak ada, jadi bentuk yang dipakai di aplikasi ini dibangkitkan sebagai perkiraan di sekitar titik pusat, bukan batas sungguhan. Nilai NDVI-nya pun angka contoh ⚠︎, bukan hasil pembacaan citra untuk koordinat itu, sehingga estimasi serapan yang muncul setelah adopsi adalah hitungan sungguhan atas bentuk perkiraan DAN kehijauan karangan.";

  root.GLYIV_PETAK = {
    PETAK: PETAK,
    CATATAN: CATATAN,
    KERAPATAN_TANAM_PER_HA: KERAPATAN_TANAM_PER_HA,
    NDVI_SOIL: NDVI_SOIL,
    NDVI_DENSE: NDVI_DENSE,
    SERAPAN_PER_HA: SERAPAN_PER_HA,
    fraksiTajuk: fraksiTajuk,
    jumlahPohon: jumlahPohon,
    serapan: serapan
  };
})(typeof window !== "undefined" ? window : globalThis);
