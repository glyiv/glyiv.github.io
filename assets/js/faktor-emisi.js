/* ⛔ JANGAN SUNTING BERKAS INI DENGAN TANGAN.
   Dibangkitkan dari src/lib/emissionFactors.ts oleh scripts/bangun-faktor-emisi.cjs.
   Menyunting di sini akan membuat halaman statis dan aplikasi React menampilkan
   angka karbon yang berbeda untuk bahan yang sama. Ubah sumbernya, lalu
   jalankan: node scripts/bangun-faktor-emisi.cjs */
var GlyivFaktor = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/lib/emissionFactors.ts
  var emissionFactors_exports = {};
  __export(emissionFactors_exports, {
    AMBANG_AMBIGU: () => AMBANG_AMBIGU,
    AMBANG_AMBIGU_NILAI_BEDA: () => AMBANG_AMBIGU_NILAI_BEDA,
    AMBANG_MINIMUM: () => AMBANG_MINIMUM,
    AMBANG_YAKIN: () => AMBANG_YAKIN,
    CONTOH_SATUAN_DITERIMA: () => CONTOH_SATUAN_DITERIMA,
    DESKRIPSI_TIER: () => DESKRIPSI_TIER,
    FAKTOR_EEIO_EXIOBASE_KG_PER_EUR: () => FAKTOR_EEIO_EXIOBASE_KG_PER_EUR,
    FAKTOR_EMISI: () => FAKTOR_EMISI,
    FAKTOR_TIDAK_DIKENAL: () => FAKTOR_TIDAK_DIKENAL,
    JEMBATAN_CAIRAN_UMUM: () => JEMBATAN_CAIRAN_UMUM,
    JEMBATAN_SATUAN: () => JEMBATAN_SATUAN,
    OPSI_MASSA_KARDUS: () => OPSI_MASSA_KARDUS,
    OPSI_MASSA_TABUNG_LPG: () => OPSI_MASSA_TABUNG_LPG,
    PERINGATAN_FAKTOR: () => PERINGATAN_FAKTOR,
    PERINGKAT_TIER: () => PERINGKAT_TIER,
    RASIO_NILAI_MATERIAL: () => RASIO_NILAI_MATERIAL,
    RENTANG_TIER: () => RENTANG_TIER,
    SEMUA_TIER: () => SEMUA_TIER,
    SINONIM_BERISIKO: () => SINONIM_BERISIKO,
    cariFaktor: () => cariFaktor,
    faktorById: () => faktorById,
    hitungFallbackBelanja: () => hitungFallbackBelanja,
    jembatanFaktor: () => jembatanFaktor,
    jembataniKeSatuanFaktor: () => jembataniKeSatuanFaktor,
    konversiKeSatuanDasar: () => konversiKeSatuanDasar,
    normalisasiNama: () => normalisasiNama,
    peringatanFaktor: () => peringatanFaktor,
    rentangFaktor: () => rentangFaktor
  });
  var RENTANG_TIER = {
    T1: 0.1,
    T2: 0.2,
    T3: 0.35,
    T4: 0.6
  };
  var DESKRIPSI_TIER = {
    T1: "Data primer pemasok atau pengukuran langsung",
    T2: "Faktor nasional/regional (mis. grid listrik Indonesia)",
    T3: "Rata-rata proses-LCA global (Poore & Nemecek 2018; ADEME Agribalyse)",
    T4: "Fallback — proksi kelas produk (median internal). Jalur spend-based EEIO/EXIOBASE 3 masih ROADMAP, belum aktif."
  };
  var PERINGKAT_TIER = { T1: 1, T2: 2, T3: 3, T4: 4 };
  var SEMUA_TIER = ["T1", "T2", "T3", "T4"];
  function rentangFaktor(faktor) {
    const r = RENTANG_TIER[faktor.tier];
    return { lo: faktor.kgCO2ePerSatuan * (1 - r), hi: faktor.kgCO2ePerSatuan * (1 + r) };
  }
  var FAKTOR_EMISI = [
    {
      id: "susu-sapi",
      nama: "Susu sapi segar",
      sinonim: ["susu", "susu segar", "fresh milk", "susu full cream", "susu murni"],
      satuanDasar: "liter",
      kategori: "bahan",
      kgCO2ePerSatuan: 3.15,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data",
      catatan: "Rata-rata proses-LCA GLOBAL per kg produk di titik ritel (mencakup perubahan tata guna lahan, budi daya, pakan, pengolahan, transportasi, ritel, kemasan). Susu ≈1,03 kg/L sehingga per liter dan per kg praktis sama. Batasan: asal Indonesia bisa berbeda — produktivitas sapi perah lokal jauh di bawah rata-rata global (menaikkan faktor), sementara ADEME Agribalyse 3.1 memberi 1,46 kg CO₂e/kg untuk susu Prancis (menurunkan). ⚠︎ Selisih antar-sumber lebih lebar dari rentang ±35% tier T3."
    },
    {
      id: "susu-uht",
      nama: "Susu UHT",
      sinonim: ["uht", "susu uht", "susu kotak", "susu tetra", "ultra milk"],
      satuanDasar: "liter",
      kategori: "bahan",
      kgCO2ePerSatuan: 3.15,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data",
      catatan: "Dipakai nilai susu global yang sama karena Poore & Nemecek tidak memisahkan UHT dari susu pasteurisasi — nilainya IDENTIK dengan entri susu sapi segar, jangan dibaca sebagai dua pengukuran berbeda. Pembanding bernama: ADEME Agribalyse 3.1 “Lait entier, UHT” = 1,46 kg CO₂e/kg. ⚠︎ Ini estimasi, bukan hasil pengukuran; nilai UHT Indonesia belum terlacak dari data primer pemasok. Naikkan ke T1 bila pemasok memberi lembar data emisi produknya."
    },
    {
      id: "susu-kental-manis",
      nama: "Susu kental manis",
      sinonim: ["skm", "kental manis", "susu kaleng", "condensed milk", "frisian flag", "indomilk kental"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 2.53,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Lait concentré sucré, entier”",
      catatan: "Nilai basis data LCA Prancis per kg produk. Batasan penting: banyak SKM di pasar Indonesia diformulasi dengan lemak nabati (sawit) + bubuk susu skim, bukan susu segar pekat seperti asumsi Agribalyse, sehingga komposisi emisinya bisa bergeser. ⚠︎ Perlakukan sebagai estimasi kelas produk, bukan nilai spesifik merek."
    },
    {
      id: "susu-bubuk",
      nama: "Susu bubuk full cream",
      sinonim: ["susu bubuk", "milk powder", "susu serbuk", "full cream powder"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 12.5,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Lait en poudre, entier”",
      catatan: "Tinggi karena ±8 liter susu cair menguap menjadi 1 kg bubuk plus energi pengeringan semprot. Agribalyse memberi 9,38 kg CO₂e/kg untuk versi skim dan 10,6 untuk semi-skim. Batasan: sistem persusuan Prancis; susu bubuk yang diimpor ke Indonesia (umumnya Selandia Baru/Australia) punya jejak dan jarak angkut berbeda."
    },
    {
      id: "krimer-nabati",
      nama: "Krimer nabati (non-dairy creamer)",
      sinonim: ["krimer", "creamer", "non dairy creamer", "krimer bubuk", "coffee mate", "krimmer"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 2.8,
      tier: "T4",
      sumber: "Proksi komposisi dari ADEME Agribalyse 3.1 (tidak ada faktor LCA bernama untuk krimer nabati)",
      catatan: "⚠︎ BUKAN nilai dari basis data mana pun. Ini perkiraan kelas produk yang diturunkan secara terbuka: ±35% lemak sawit (“Huile de palme raffinée” 6,65 kg CO₂e/kg) + ±60% sirup glukosa/gula (“Sirop à diluer, sucré” 0,833 kg CO₂e/kg) → ≈2,8. Tidak ada sumber yang bisa disebut namanya untuk krimer nabati utuh, sehingga tier diturunkan ke T4 dan rentang ±60% wajib ditampilkan. Ganti dengan data primer pemasok begitu tersedia.",
      rincianTurunan: {
        ringkasAritmetika: "(0,35 × 6,65 kg CO₂e/kg lemak sawit) + (0,60 × 0,833 kg CO₂e/kg sirup gula) ≈ 2,33 + 0,50 ≈ 2,8 kg CO₂e/kg",
        asumsiMassa: "Komposisi ±35% lemak sawit + ±60% sirup glukosa/gula adalah ASUMSI KAMI, bukan formulasi pemasok."
      }
    },
    {
      id: "susu-oat",
      nama: "Susu oat",
      sinonim: ["oat milk", "oatmilk", "susu gandum", "oatside", "oatly"],
      satuanDasar: "liter",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.9,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data",
      catatan: "Per liter minuman siap konsumsi, rata-rata global. Pembanding bernama: ADEME Agribalyse 3.1 “Boisson à base d'avoine, nature” = 0,566 kg CO₂e/kg. Batasan: oat hampir seluruhnya impor ke Indonesia — komponen transportasi laut belum dipisahkan dalam angka ini."
    },
    {
      id: "susu-almond",
      nama: "Susu almond",
      sinonim: ["almond milk", "susu kacang almond", "almondmilk"],
      satuanDasar: "liter",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.7,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data",
      catatan: "Per liter, rata-rata global. Catatan kejujuran: rendah pada emisi GRK, TETAPI intensitas air almond sangat tinggi (California) — angka karbon saja tidak boleh dibaca sebagai “ramah lingkungan” secara menyeluruh. Batasan: bukan data Indonesia."
    },
    {
      id: "susu-kedelai",
      nama: "Susu kedelai",
      sinonim: ["soy milk", "soya", "susu kacang kedelai", "sari kedelai"],
      satuanDasar: "liter",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.98,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data",
      catatan: "Per liter, rata-rata global. Batasan: kedelai untuk pasar Indonesia sebagian besar impor; bila berasal dari lahan hasil alih fungsi hutan, komponen perubahan tata guna lahan bisa jauh lebih besar daripada rata-rata global ini."
    },
    {
      id: "santan",
      nama: "Santan kelapa",
      sinonim: ["santan", "coconut milk", "santen", "kara", "santan kental"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.682,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Lait de coco ou Crème de coco”",
      catatan: "Batasan: rantai pasok Agribalyse mengasumsikan kelapa impor ke Eropa. Untuk Indonesia komponen transportasi jauh lebih pendek, jadi nilai riil kemungkinan LEBIH RENDAH — angka ini konservatif (cenderung melebihkan)."
    },
    {
      id: "kopi-arabika",
      nama: "Biji kopi arabika",
      sinonim: ["arabika", "arabica", "kopi arabika", "biji kopi", "green bean arabika", "house blend"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 28.53,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data",
      catatan: "⚠︎ ANGKA PALING DIPERDEBATKAN dalam daftar ini. Rata-rata global per kg kopi, didominasi komponen perubahan tata guna lahan. Sumber bernama lain memberi jauh lebih rendah: ADEME Agribalyse 3.1 “Café, moulu” = 8,4 kg CO₂e/kg; WWF Sverige & SLU/RISE 2022 = 0,25 kg CO₂e per liter kopi seduh. Selisih antar-sumber JAUH melampaui rentang ±35% tier T3 dan berasal dari perbedaan perlakuan alih fungsi lahan. Tampilkan divergensi ini di panel, jangan sembunyikan."
    },
    {
      id: "kopi-robusta",
      nama: "Biji kopi robusta",
      sinonim: ["robusta", "kopi robusta", "biji robusta", "kopi lokal"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 28.53,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — kategori “Coffee” (tidak dipisah per varietas)",
      catatan: "⚠︎ Poore & Nemecek TIDAK memisahkan arabika dan robusta; nilai ini identik dengan arabika semata-mata karena sumbernya satu kategori. Robusta umumnya berproduktivitas lebih tinggi per hektare sehingga jejak per kg berpotensi lebih rendah, tetapi TIDAK ADA sumber bernama yang memberi angka pisahnya — jangan mengklaim selisih itu sebelum ada data primer. Berlaku juga catatan divergensi Agribalyse (8,4 kg CO₂e/kg) seperti pada arabika."
    },
    {
      id: "teh",
      nama: "Teh (daun kering)",
      sinonim: ["teh", "tea", "teh celup", "daun teh", "teh tubruk", "black tea", "teh hijau"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 6.3,
      tier: "T3",
      sumber: "WWF Sverige & SLU/RISE 2022 — “Environmental effects of coffee, tea and cocoa”",
      catatan: "Per kg daun teh kering, setara ±0,064 kg CO₂e per liter teh siap minum menurut sumber yang sama. Batasan: Poore & Nemecek dan Agribalyse tidak memuat daun teh kering (Agribalyse hanya “Thé infusé, non sucré” 0,0436 kg CO₂e/kg cairan, yang sebagian besar berupa energi memasak air). Literatur LCA lain melaporkan 4,5–19,9 kg CO₂e/kg teh kering tergantung teknik pengolahan — ⚠︎ rentang riil lebih lebar dari ±35%. Kemasan teh celup individual dapat mendominasi jejak dan TIDAK termasuk di sini."
    },
    {
      id: "kakao-bubuk",
      nama: "Cokelat bubuk / kakao bubuk",
      sinonim: ["kakao", "cocoa", "cokelat bubuk", "coklat bubuk", "cocoa powder", "bubuk coklat", "van houten"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 29.1,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Cacao, non sucré, poudre soluble”",
      catatan: "⚠︎ Divergensi antar-sumber sangat besar untuk kakao: Agribalyse 29,1; WWF Sverige & SLU/RISE 2022 memberi 2,8 kg CO₂e/kg bubuk kakao di pasar Swedia; Poore & Nemecek memberi 46,65 kg CO₂e/kg untuk cokelat hitam batangan. Penyebab utama adalah cara mengalokasikan emisi alih fungsi hutan di Afrika Barat. Nilai Agribalyse dipilih karena paling spesifik untuk bentuk “bubuk”, tetapi rentang ±35% TIDAK mencerminkan ketidakpastian sebenarnya."
    },
    {
      id: "cokelat-hitam",
      nama: "Cokelat hitam (batang/couverture)",
      sinonim: ["dark chocolate", "cokelat batang", "coklat hitam", "couverture", "dcp", "compound coklat"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 46.65,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Dark Chocolate”",
      catatan: "Salah satu jejak per kg tertinggi setelah daging sapi, hampir seluruhnya dari perubahan tata guna lahan pada budi daya kakao. Batasan: rata-rata global, didominasi kakao Afrika Barat; kakao asal Sulawesi/Sumatera bisa berbeda tetapi belum ada faktor Indonesia yang bisa disebut namanya. Pembanding: Agribalyse 3.1 “Chocolat noir <70% cacao” = 19,1 kg CO₂e/kg. ⚠︎"
    },
    {
      id: "gula-pasir",
      nama: "Gula pasir (tebu)",
      sinonim: ["gula", "gula pasir", "sugar", "gula putih", "gula tebu", "gulaku"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 3.2,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Cane Sugar”",
      catatan: "Dipilih gula tebu, bukan gula bit, karena hampir seluruh gula konsumsi Indonesia berbasis tebu. Batasan: rata-rata global; pembakaran daun tebu sebelum panen — praktik yang masih terjadi di sebagian sentra Indonesia — dapat menaikkan faktor ini dan tidak terwakili merata di data global. Pembanding: Agribalyse 3.1 “Sucre blanc” (bit, Prancis) = 0,746 kg CO₂e/kg."
    },
    {
      id: "gula-aren",
      nama: "Gula aren",
      sinonim: ["aren", "gula aren", "palm sugar", "gula semut", "gula nira", "arean"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 1.04,
      tier: "T4",
      sumber: "Proksi kelas produk dari ADEME Agribalyse 3.1 — “Sucre roux” (gula tebu mentah)",
      catatan: "⚠︎ TIDAK ADA faktor emisi bernama untuk gula aren (nira Arenga pinnata) di Poore & Nemecek, Agribalyse, maupun EXIOBASE. Nilai ini adalah perkiraan KELAS PRODUK memakai gula mentah sebagai proksi, bukan nilai spesifik gula aren. Arah bias yang diketahui: pemasakan nira secara tradisional memakai kayu bakar dalam jumlah besar, sehingga faktor riil kemungkinan LEBIH TINGGI dari 1,04. Tier diturunkan ke T4; tampilkan rentang ±60%. Ini kandidat prioritas untuk pengumpulan data primer T1."
    },
    {
      id: "gula-merah",
      nama: "Gula merah / gula jawa",
      sinonim: ["gula merah", "gula jawa", "gula kelapa", "brown sugar", "gula batok", "palm sugar"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 1.04,
      tier: "T4",
      sumber: "Proksi kelas produk dari ADEME Agribalyse 3.1 — “Sucre roux” (gula tebu mentah)",
      catatan: "⚠︎ Sama seperti gula aren: perkiraan kelas produk, bukan nilai spesifik. Gula merah kelapa/jawa tidak punya faktor LCA dari sumber yang bisa disebut namanya. Bias yang diketahui: energi kayu bakar pada pemasakan nira tidak tercakup, sehingga nilai riil kemungkinan lebih tinggi. Tier T4, rentang ±60%."
    },
    {
      id: "sirup",
      nama: "Sirup (perisa manis)",
      sinonim: ["sirup", "syrup", "sirop", "sirup vanila", "sirup caramel", "monin", "marjan"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.833,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Sirop à diluer, sucré”",
      catatan: "Sirup pekat berbasis gula. Batasan: sirup barista beraroma (vanila, karamel, hazelnut) mengandung perisa dan pengental yang tidak dimodelkan Agribalyse; kemasan botol kaca juga tidak dipisahkan. ⚠︎ Perlakukan sebagai estimasi kelas produk."
    },
    {
      id: "telur",
      nama: "Telur ayam",
      sinonim: ["telur", "telor", "egg", "telur ayam", "telur negeri"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 4.67,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Eggs”",
      catatan: "Per kg telur berkulit. Untuk konversi ke butir: 1 butir telur ayam ras ukuran M ≈ 60 g → ≈0,28 kg CO₂e per butir (konversi berat, bukan angka dari sumber). Batasan: rata-rata global; peternakan layer Indonesia sangat bergantung pakan jagung/bungkil kedelai impor yang membawa emisi alih fungsi lahan tersendiri."
    },
    {
      id: "tepung-terigu",
      nama: "Tepung terigu",
      sinonim: ["terigu", "tepung", "flour", "tepung terigu", "bogasari", "cakra", "segitiga biru"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.791,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Farine de blé T65”",
      catatan: "Nilai tepung (sudah termasuk penggilingan), bukan gandum butiran. Batasan penting: gandum Prancis ditanam dekat pabrik gilingnya, sedangkan 100% gandum Indonesia diimpor (Australia, Kanada, Ukraina) lalu digiling di dalam negeri — komponen pelayaran samudra TIDAK tercakup, sehingga nilai riil Indonesia kemungkinan LEBIH TINGGI. Pembanding: Poore & Nemecek “Wheat & Rye” (butiran, global) = 1,57 kg CO₂e/kg. ⚠︎"
    },
    {
      id: "beras",
      nama: "Beras",
      sinonim: ["beras", "nasi", "rice", "beras putih", "nasi putih"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 4.45,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Rice”",
      catatan: "Tinggi untuk sebuah biji-bijian karena metana dari sawah tergenang. Per kg beras (bukan nasi matang); nasi matang menyerap air sehingga faktor per kg nasi kira-kira sepertiganya — lakukan konversi di lapisan resep, jangan di faktor ini. Batasan: rata-rata global; sawah Indonesia yang irigasi terus-menerus cenderung DI ATAS rata-rata, sedangkan praktik pengeringan berselang (AWD) menurunkannya tajam."
    },
    {
      id: "daging-ayam",
      nama: "Daging ayam",
      sinonim: ["ayam", "chicken", "daging ayam", "fillet ayam", "dada ayam", "ayam potong"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 9.87,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Poultry Meat”",
      catatan: "Per kg karkas/daging di titik ritel. Batasan: rata-rata global; broiler Indonesia memakai pakan berbasis bungkil kedelai impor, dan komponen alih fungsi lahan pakan itu bervariasi besar antar sumber pasokan."
    },
    {
      id: "daging-sapi",
      nama: "Daging sapi",
      sinonim: ["sapi", "beef", "daging sapi", "daging", "rendang", "sirloin", "tenderloin"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 99.48,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Beef (beef herd)”",
      catatan: "⚠︎ Nilai ini untuk sapi dari kawanan pedaging. Sumber yang sama memberi 33,3 kg CO₂e/kg untuk daging sapi dari kawanan perah (produk sampingan) — selisih 3x yang TIDAK tercakup rentang ±35%. Pasokan daging sapi Indonesia mencampur sapi lokal, sapi bakalan impor Australia, dan daging beku India, sehingga nilai efektifnya ada di antara kedua angka itu. Tampilkan kedua batas di panel dan jangan mengklaim presisi yang tidak ada."
    },
    {
      id: "ikan",
      nama: "Ikan (budidaya)",
      sinonim: ["ikan", "fish", "ikan nila", "lele", "gurame", "patin", "dori", "salmon"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 13.63,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Fish (farmed)”",
      catatan: "Rata-rata global ikan BUDIDAYA, didominasi pakan dan energi tambak. Batasan besar: ikan tangkap laut sangat berbeda — ADEME Agribalyse 3.1 memberi “Maquereau, cru” 2,62 dan “Thon, cru” 4,98 kg CO₂e/kg, sedangkan “Pangasius/Poisson-chat, cru” 12,3 (sejalan dengan nilai budidaya ini). ⚠︎ Bila merchant memakai ikan laut tangkap, faktor ini melebihkan 3–5x; pisahkan jenisnya di menu bila memungkinkan."
    },
    {
      id: "udang",
      nama: "Udang (budidaya)",
      sinonim: ["udang", "shrimp", "prawn", "udang vaname", "udang windu"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 26.87,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Prawns (farmed)”",
      catatan: "Sangat tinggi karena sebagian besar tambak udang global dibuka di lahan bekas mangrove yang menyimpan karbon sangat padat, ditambah aerasi listrik. Batasan: relevan untuk Indonesia sebagai produsen udang besar, tetapi nilainya rata-rata global — tambak di lahan non-mangrove yang sudah lama beroperasi jauh lebih rendah. ⚠︎"
    },
    {
      id: "tahu",
      nama: "Tahu",
      sinonim: ["tahu", "tofu", "tahu putih", "tahu goreng"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 3.16,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Tofu”",
      catatan: "Rata-rata global termasuk alih fungsi lahan kedelai. Pembanding bernama: ADEME Agribalyse 3.1 “Tofu, nature” = 1,00 kg CO₂e/kg — jauh lebih rendah karena memakai kedelai Eropa tanpa komponen deforestasi. Indonesia mengimpor mayoritas kedelainya, jadi nilai global dipilih sebagai yang lebih mewakili. ⚠︎"
    },
    {
      id: "tempe",
      nama: "Tempe",
      sinonim: ["tempe", "tempeh", "tempe kedelai", "tempe goreng"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 2.37,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Tempeh”",
      catatan: "⚠︎ Satu-satunya sumber bernama yang memuat tempe, TETAPI berasal dari sistem Eropa yang nilai tahunya hanya 1,00 (versus 3,16 global). Artinya angka ini kemungkinan besar MENGECILKAN tempe Indonesia yang dibuat dari kedelai impor. Di dalam sistem Agribalyse sendiri tempe memang lebih tinggi dari tahu (2,37 vs 1,00) karena tempe memakai lebih banyak kedelai per kg produk. Perlakukan batas ATAS rentang ±35% sebagai yang lebih mungkin benar."
    },
    {
      id: "minyak-goreng-sawit",
      nama: "Minyak goreng sawit",
      sinonim: ["minyak goreng", "minyak", "cooking oil", "minyak sawit", "palm oil", "bimoli", "sania"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 6.65,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Huile de palme raffinée”",
      catatan: "Per kg minyak; 1 liter ≈ 0,91 kg → ≈6,1 kg CO₂e per liter. Pembanding bernama: total rantai pasok Poore & Nemecek untuk “Palm Oil” ≈ 6,8 kg CO₂e per liter — dua sumber independen sejalan, jadi keyakinan relatif tinggi. Batasan: komponen terbesar adalah perubahan tata guna lahan; minyak dari kebun bersertifikat pada lahan lama bisa jauh lebih rendah, minyak dari lahan gambut yang baru dibuka bisa jauh lebih tinggi. ⚠︎"
    },
    {
      id: "mentega",
      nama: "Mentega",
      // "margarin" DIHAPUS dari sinonim — lihat catatan penyuntingan no. 4. Margarin
      // adalah produk berbeda dan kini punya entri sendiri (id: "margarin").
      sinonim: ["mentega", "butter", "butter unsalted", "wysman", "anchor"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 7.94,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Beurre à 82% MG, doux”",
      catatan: "Versi asin 80% lemak = 7,88 kg CO₂e/kg pada sumber yang sama. ⚠︎ PENTING: nilai ini untuk MENTEGA (dari susu). Margarin adalah produk berbeda berbasis minyak nabati — jangan pakai faktor ini untuk margarin; gunakan entri “margarin” (proksi minyak sawit, T4). Batasan: sistem persusuan Prancis; mentega di Indonesia umumnya impor sehingga transportasi rantai dingin tidak tercakup."
    },
    {
      id: "margarin",
      nama: "Margarin (proksi minyak sawit)",
      sinonim: ["margarin", "margarine", "mentega nabati"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 6.65,
      tier: "T4",
      sumber: "⚠︎ PROKSI — memakai faktor minyak sawit ADEME Agribalyse 3.1 “Huile de palme raffinée” (6,65 kg CO₂e/kg) atas perintah eksplisit catatan riset pada entri mentega",
      catatan: "⚠︎ ENTRI TURUNAN, BUKAN BARIS RISET TERPISAH. Berkas riset melarang memakai faktor mentega untuk margarin dan memerintahkan “gunakan faktor minyak sawit sebagai proksi dan turunkan ke T4” — itu persis yang dilakukan di sini, supaya sistem tidak diam-diam menghitung margarin sebagai mentega (7,94, dari susu). Batasan: margarin komersial adalah emulsi minyak nabati + air + emulsifier + garam, sehingga kandungan minyaknya biasanya 60–80%, BUKAN 100%; artinya proksi ini kemungkinan MELEBIHKAN. Tier T4, rentang ±60%. Ganti begitu ada faktor margarin dari sumber yang bisa disebut namanya.",
      rincianTurunan: {
        ringkasAritmetika: "Faktor minyak sawit rafinasi 6,65 kg CO₂e/kg dipakai apa adanya sebagai proksi 1:1",
        asumsiMassa: "Diasumsikan 100% basis minyak sawit — asumsi kami, dan diketahui melebihkan."
      }
    },
    {
      id: "keju",
      nama: "Keju",
      sinonim: ["keju", "cheese", "cheddar", "mozzarella", "keju parut", "kraft"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 23.88,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Cheese”",
      catatan: "Tinggi karena ±10 liter susu dibutuhkan per kg keju. Rata-rata global lintas jenis keju. Batasan: keju olahan/analog berbasis minyak nabati (banyak dipakai di F&B kecil Indonesia) BUKAN keju susu dan jejaknya jauh lebih rendah — bila merchant memakai keju analog, faktor ini melebihkan secara serius. ⚠︎"
    },
    {
      id: "es-batu",
      nama: "Es batu",
      sinonim: ["es", "es batu", "ice", "es kristal", "es tube", "es balok"],
      satuanDasar: "kg",
      kategori: "energi",
      kgCO2ePerSatuan: 0.089,
      tier: "T4",
      sumber: "Turunan: faktor emisi grid sistem Jawa-Madura-Bali (Jamali) 0,89 tCO₂/MWh — daftar faktor emisi per sistem Ditjen Ketenagalistrikan ESDM (nilai terbit Pemerintah Indonesia 2017, direproduksi di Lampiran 2 metodologi JCM ID_PM037) × asumsi energi mesin es",
      catatan: "⚠︎ NILAI TURUNAN, BUKAN dari basis data LCA mana pun. Ini faktor ENERGI (listrik mesin es), bukan bahan pangan. Perhitungan yang dipakai, terbuka: 0,10 kWh listrik per kg es (asumsi mesin es komersial di suhu lingkungan tropis — BELUM diverifikasi dari lembar data pabrikan) × 0,89 kg CO₂e/kWh = 0,089. Faktor grid-nya memakai nilai yang sama dengan entri “Listrik grid Jamali” (0,89), tetapi asumsi intensitas energinya tidak bersumber, sehingga keseluruhan diturunkan ke T4 dengan rentang ±60%. Tidak mencakup air, kemasan, maupun pengangkutan es beli-jadi. Perbaiki dengan membaca meteran listrik mesin es outlet — itu akan menaikkannya ke T1.",
      rincianTurunan: {
        ringkasAritmetika: "0,10 kWh/kg es × 0,89 kg CO₂e/kWh (grid Jamali, daftar per sistem Ditjen Ketenagalistrikan ESDM) = 0,089 kg CO₂e/kg",
        asumsiMassa: "⚠︎ Intensitas energi 0,10 kWh per kg es adalah ASUMSI KAMI, belum diverifikasi dari lembar data pabrikan mesin es."
      }
    },
    {
      id: "pisang",
      nama: "Pisang",
      sinonim: ["pisang", "banana", "pisang cavendish", "pisang ambon"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.86,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Bananas”",
      catatan: "Rata-rata global per kg buah di titik ritel. Pembanding: ADEME Agribalyse 3.1 “Banane, pulpe, crue” = 0,909 — dua sumber sejalan. Batasan: rata-rata global mencakup pelayaran ekspor lintas benua; pisang lokal Indonesia kemungkinan lebih rendah pada komponen transportasi."
    },
    {
      id: "jeruk",
      nama: "Jeruk",
      sinonim: ["jeruk", "orange", "jeruk peras", "citrus", "jeruk nipis", "lemon"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.39,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Citrus Fruit”",
      catatan: "Kategori jeruk secara umum (tidak dipisah jeruk manis, lemon, nipis). Salah satu faktor pangan terendah dalam basis data. Batasan: rata-rata global; jeruk yang dipasok berpendingin lintas provinsi di Indonesia akan sedikit lebih tinggi."
    },
    {
      id: "alpukat",
      nama: "Alpukat",
      sinonim: ["alpukat", "avocado", "avokad", "apokat", "jus alpukat"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 1.55,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Avocat, pulpe, cru”",
      catatan: "Per kg daging buah (bukan buah utuh dengan biji dan kulit — bila merchant menimbang buah utuh, sekitar 70% saja yang jadi daging buah). Poore & Nemecek tidak memuat alpukat secara terpisah; Our World in Data menyebut angka sekitar 2,5 kg CO₂e/kg untuk alpukat pada tulisan penjelasnya. ⚠︎ Rentang antar-sumber 1,55–2,5. Catatan air: alpukat berintensitas air tinggi — jejak karbon saja tidak menggambarkan seluruh dampaknya."
    },
    {
      id: "mangga",
      nama: "Mangga",
      sinonim: ["mangga", "mango", "mangga harum manis", "jus mangga"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.728,
      tier: "T3",
      sumber: "ADEME Agribalyse 3.1 — “Mangue importée par bateau, pulpe, crue”",
      catatan: "Per kg daging buah, jalur impor LAUT. Batasan penting: sumber yang sama memberi 11,6 kg CO₂e/kg untuk mangga impor jalur UDARA — 16x lipat. Mangga di Indonesia umumnya lokal dan diangkut darat, sehingga 0,728 adalah proksi yang wajar tetapi komponen transportasinya tidak sama. Alternatif bernama: Poore & Nemecek “Other Fruit” = 1,05 kg CO₂e/kg. ⚠︎"
    },
    {
      id: "sayuran-umum",
      nama: "Sayuran umum (daun & campuran)",
      sinonim: ["sayur", "sayuran", "vegetable", "selada", "bayam", "kangkung", "sawi", "brokoli", "timun"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.53,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Other Vegetables”",
      catatan: "Kategori payung untuk sayuran yang tidak punya baris sendiri. Sumber yang sama memberi “Brassicas” (kubis, brokoli, sawi) = 0,51 dan “Root Vegetables” = 0,43 — semuanya sekelas. ⚠︎ JANGAN pakai kategori payung ini untuk sayuran rumah kaca berpemanas atau sayuran impor beku; keduanya jauh lebih tinggi."
    },
    {
      id: "tomat",
      nama: "Tomat",
      sinonim: ["tomat", "tomato", "tomat ceri", "saus tomat"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 2.09,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Tomatoes”",
      catatan: "Lebih tinggi dari sayuran lain karena rata-rata global ini mencakup produksi rumah kaca berpemanas di negara empat musim. ⚠︎ Tomat lapangan Indonesia kemungkinan JAUH lebih rendah dari 2,09 — angka ini melebihkan untuk konteks tropis. Kandidat untuk diganti dengan data primer."
    },
    {
      id: "bawang",
      nama: "Bawang (merah, putih, bombay)",
      sinonim: ["bawang", "bawang merah", "bawang putih", "bawang bombay", "onion", "garlic"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.5,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Onions & Leeks”",
      catatan: "Kategori gabungan bawang dan daun bawang; tidak memisahkan bawang putih (yang di Indonesia hampir seluruhnya impor dari Tiongkok sehingga komponen transportasinya lebih besar). ⚠︎ Estimasi kelas produk."
    },
    {
      id: "kentang",
      nama: "Kentang",
      sinonim: ["kentang", "potato", "kentang goreng", "french fries"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 0.46,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Potatoes”",
      catatan: "Per kg kentang mentah. ⚠︎ Kentang goreng beku impor BUKAN produk yang sama: pembekuan, penggorengan awal, dan rantai dingin lintas negara menambah jejak yang tidak tercakup di sini. Bila merchant memakai kentang beku, turunkan ke T4 dan gunakan rentang ±60%."
    },
    {
      id: "buah-lainnya",
      nama: "Buah lainnya (kategori payung)",
      sinonim: ["buah", "fruit", "buah campur", "salad buah", "semangka", "melon", "pepaya", "nanas"],
      satuanDasar: "kg",
      kategori: "bahan",
      kgCO2ePerSatuan: 1.05,
      tier: "T3",
      sumber: "Poore & Nemecek 2018 (Science), kompilasi Our World in Data — “Other Fruit”",
      catatan: "Kategori payung untuk buah yang tidak punya baris sendiri (pepaya, nanas, semangka, melon, dll.). ⚠︎ Ini rata-rata lintas-buah, bukan nilai spesifik buah mana pun — tandai di antarmuka sebagai perkiraan kelas produk. Bila sebuah buah menjadi bahan utama sebuah menu, cari faktor spesifiknya sebelum menampilkan angkanya ke pelanggan."
    },
    {
      id: "listrik-grid-nasional",
      nama: "Listrik grid PLN (rata-rata nasional)",
      sinonim: ["listrik", "listrik pln", "token listrik", "energi listrik", "kwh", "strom", "daya listrik"],
      satuanDasar: "buah",
      satuanTampil: "kWh",
      kategori: "energi",
      kgCO2ePerSatuan: 0.87,
      tier: "T2",
      sumber: "Kementerian ESDM / Ditjen Ketenagalistrikan — Faktor Emisi GRK Sistem Ketenagalistrikan (dasar hukum Kepmen ESDM No. 163.K/HK.02/MEM.S/2021, berlaku 30 Agustus 2021); data dasar tahun 2019",
      catatan: "PENTING: satuan dasar sebenarnya adalah kWh, bukan “buah”. Enum skema hanya mengizinkan kg/liter/buah, jadi 1 unit = 1 kWh — UI WAJIB menampilkannya sebagai kWh. Angka 0,87 kg CO₂e/kWh adalah rata-rata sistem nasional. Rentang T2 ±20% = 0,70–1,04. Rentang itu memang mencakup pembacaan lain yang sah dari sumber berbeda: ESDM mencatat 0,867 (2015) dan 0,934 (2017), sementara Ember Yearly Electricity Data rilis 2025 menghitung 0,680 kg CO₂e/kWh untuk 2024 karena batas sistemnya hanya pembakaran di pembangkit (tanpa susut jaringan dan tanpa hulu bahan bakar). Grid Indonesia sedang berubah — faktor ini WAJIB diperbarui tiap tahun, jangan dikunci. Ini estimasi berbasis faktor rata-rata, bukan pengukuran meteran per outlet."
    },
    {
      id: "listrik-grid-jamali",
      nama: "Listrik grid sistem Jawa-Madura-Bali (Jamali)",
      sinonim: ["listrik jawa", "listrik jamali", "grid jawa", "listrik bali", "listrik jabodetabek"],
      satuanDasar: "buah",
      satuanTampil: "kWh",
      kategori: "energi",
      kgCO2ePerSatuan: 0.89,
      tier: "T2",
      sumber: "Daftar faktor emisi per sistem ketenagalistrikan Ditjen Ketenagalistrikan ESDM (nilai terbit Pemerintah Indonesia 2017; direproduksi utuh — 134 sistem — di Lampiran 2 metodologi JCM ID_PM037; sumber data: Directorate General of Electricity, Kementerian ESDM, 2020)",
      catatan: "⚠︎ Satuan sebenarnya kWh (lihat catatan listrik-grid-nasional). Nilai 0,89 kg CO₂e/kWh adalah faktor sistem Jamali pada daftar per-sistem Ditjen Ketenagalistrikan ESDM (nilai terbit 2017), yang bisa disebut namanya dan diperiksa di Lampiran 2 JCM ID_PM037. Pada daftar itu Jamali 0,89 ternyata setara Sumatera (0,89) — jadi jangan pakai selisih Jamali vs nasional (0,87) untuk mengklaim satu wilayah “lebih bersih” dari wilayah lain; selisihnya lebih kecil daripada lebar ketidakpastian ±20% T2. Bauran Jamali terus berubah (tambahan PLTU besar, lalu tambahan EBT), jadi faktor grid WAJIB diperbarui tiap tahun begitu ESDM menerbitkan nilai baru. Ini estimasi berbasis faktor rata-rata sistem, bukan pembacaan meteran per outlet."
    },
    {
      id: "listrik-grid-sumatera",
      nama: "Listrik grid sistem Sumatera",
      sinonim: [
        "listrik sumatera",
        "listrik sumatra",
        "grid sumatera",
        "listrik aceh",
        "listrik medan",
        "listrik palembang",
        "listrik lampung",
        "listrik pekanbaru",
        "listrik jambi"
      ],
      satuanDasar: "buah",
      satuanTampil: "kWh",
      kategori: "energi",
      kgCO2ePerSatuan: 0.89,
      tier: "T2",
      sumber: "Daftar faktor emisi per sistem ketenagalistrikan Ditjen Ketenagalistrikan ESDM (nilai terbit Pemerintah Indonesia 2017; Lampiran 2 JCM ID_PM037; sumber data DJK ESDM 2020) — sistem Sumatera",
      catatan: "⚠︎ Satuan sebenarnya kWh. Faktor sistem interkoneksi Sumatera 0,89 kg CO₂e/kWh dari daftar per-sistem Ditjen Ketenagalistrikan ESDM (terbit 2017). Sistem Sumatera mencakup Aceh, Sumut, Sumbar, Riau, Sumsel, Jambi, Bengkulu, Lampung. Faktor grid WAJIB diperbarui tiap tahun. Ini estimasi berbasis faktor rata-rata sistem, bukan pembacaan meteran outlet."
    },
    {
      id: "listrik-grid-sulselbar",
      nama: "Listrik grid sistem Sulselbar (Sulawesi Selatan–Barat)",
      sinonim: ["listrik sulawesi selatan", "listrik sulselbar", "listrik makassar", "grid sulselbar"],
      satuanDasar: "buah",
      satuanTampil: "kWh",
      kategori: "energi",
      kgCO2ePerSatuan: 0.87,
      tier: "T2",
      sumber: "Daftar faktor emisi per sistem ketenagalistrikan Ditjen Ketenagalistrikan ESDM (nilai terbit Pemerintah Indonesia 2017; Lampiran 2 JCM ID_PM037; sumber data DJK ESDM 2020) — sistem Sulselbar",
      catatan: "⚠︎ Satuan sebenarnya kWh. Faktor sistem Sulselbar 0,87 kg CO₂e/kWh dari daftar per-sistem Ditjen Ketenagalistrikan ESDM (terbit 2017); bauran Sulselbar berbagi tenaga air (PLTA) yang cukup besar. Faktor grid WAJIB diperbarui tiap tahun."
    },
    {
      id: "listrik-grid-khatulistiwa",
      nama: "Listrik grid sistem Khatulistiwa (Kalimantan Barat)",
      sinonim: ["listrik kalimantan barat", "listrik kalbar", "listrik khatulistiwa", "listrik pontianak"],
      satuanDasar: "buah",
      satuanTampil: "kWh",
      kategori: "energi",
      kgCO2ePerSatuan: 0.9,
      tier: "T2",
      sumber: "Daftar faktor emisi per sistem ketenagalistrikan Ditjen Ketenagalistrikan ESDM (nilai terbit Pemerintah Indonesia 2017; Lampiran 2 JCM ID_PM037; sumber data DJK ESDM 2020) — sistem Khatulistiwa",
      catatan: "⚠︎ Satuan sebenarnya kWh. Faktor sistem Khatulistiwa (Kalimantan Barat) 0,90 kg CO₂e/kWh dari daftar per-sistem Ditjen Ketenagalistrikan ESDM (terbit 2017). Faktor grid WAJIB diperbarui tiap tahun."
    },
    {
      id: "listrik-grid-barito",
      nama: "Listrik grid sistem Barito (Kalimantan Selatan–Tengah)",
      sinonim: [
        "listrik kalimantan selatan",
        "listrik kalimantan tengah",
        "listrik kalselteng",
        "listrik barito",
        "listrik banjarmasin",
        "listrik palangkaraya"
      ],
      satuanDasar: "buah",
      satuanTampil: "kWh",
      kategori: "energi",
      kgCO2ePerSatuan: 0.95,
      tier: "T2",
      sumber: "Daftar faktor emisi per sistem ketenagalistrikan Ditjen Ketenagalistrikan ESDM (nilai terbit Pemerintah Indonesia 2017; Lampiran 2 JCM ID_PM037; sumber data DJK ESDM 2020) — sistem Barito",
      catatan: "⚠︎ Satuan sebenarnya kWh. Faktor sistem Barito (Kalsel–Kalteng) 0,95 kg CO₂e/kWh dari daftar per-sistem Ditjen Ketenagalistrikan ESDM (terbit 2017); bauran didominasi batubara. Faktor grid WAJIB diperbarui tiap tahun."
    },
    {
      id: "listrik-grid-mahakam",
      nama: "Listrik grid sistem Mahakam (Kalimantan Timur)",
      sinonim: [
        "listrik kalimantan timur",
        "listrik kaltim",
        "listrik mahakam",
        "listrik samarinda",
        "listrik balikpapan"
      ],
      satuanDasar: "buah",
      satuanTampil: "kWh",
      kategori: "energi",
      kgCO2ePerSatuan: 1.08,
      tier: "T2",
      sumber: "Daftar faktor emisi per sistem ketenagalistrikan Ditjen Ketenagalistrikan ESDM (nilai terbit Pemerintah Indonesia 2017; Lampiran 2 JCM ID_PM037; sumber data DJK ESDM 2020) — sistem Mahakam",
      catatan: "⚠︎ Satuan sebenarnya kWh. Faktor sistem Mahakam (Kalimantan Timur) 1,08 kg CO₂e/kWh dari daftar per-sistem Ditjen Ketenagalistrikan ESDM (terbit 2017) — lebih tinggi dari Jamali karena bauran diesel/gas yang besar. Faktor grid WAJIB diperbarui tiap tahun."
    },
    {
      id: "listrik-grid-sulutgo",
      nama: "Listrik grid sistem Sulutgo (Sulawesi Utara–Gorontalo)",
      sinonim: ["listrik sulawesi utara", "listrik sulutgo", "listrik manado", "listrik gorontalo"],
      satuanDasar: "buah",
      satuanTampil: "kWh",
      kategori: "energi",
      kgCO2ePerSatuan: 1.49,
      tier: "T2",
      sumber: "Daftar faktor emisi per sistem ketenagalistrikan Ditjen Ketenagalistrikan ESDM (nilai terbit Pemerintah Indonesia 2017; Lampiran 2 JCM ID_PM037; sumber data DJK ESDM 2020) — sistem Sulutgo",
      catatan: "⚠︎ Satuan sebenarnya kWh. Faktor sistem Sulutgo (Sulut–Gorontalo) 1,49 kg CO₂e/kWh dari daftar per-sistem Ditjen Ketenagalistrikan ESDM (terbit 2017) — jauh di atas Jamali. Ini membuktikan grid Indonesia timur TIDAK boleh diwakili angka Jawa. Faktor grid WAJIB diperbarui tiap tahun."
    },
    {
      id: "listrik-grid-luar-jamali",
      nama: "Listrik grid luar Jamali — sistem lain (catch-all Indonesia timur & kepulauan)",
      sinonim: [
        "listrik luar jawa",
        "listrik luar jamali",
        "listrik kalimantan",
        "listrik sulawesi",
        "listrik indonesia timur",
        "listrik papua",
        "listrik maluku",
        "listrik nusa tenggara",
        "listrik ntt",
        "listrik flores",
        "grid isolated",
        "grid terisolasi"
      ],
      satuanDasar: "buah",
      satuanTampil: "kWh",
      kategori: "energi",
      kgCO2ePerSatuan: 1.05,
      tier: "T4",
      sumber: "Daftar faktor emisi per sistem ketenagalistrikan Ditjen Ketenagalistrikan ESDM (nilai terbit Pemerintah Indonesia 2017; Lampiran 2 JCM ID_PM037; sumber data DJK ESDM 2020) — dipakai sebagai catch-all bila sistem spesifik tidak disebut",
      catatan: "⚠︎ Satuan sebenarnya kWh. Entri ini HANYA penanda kasar untuk input yang tidak menyebut sistemnya (mis. sekadar “listrik luar Jawa”). Nilai per sistem yang bisa disebut namanya, dari daftar Ditjen Ketenagalistrikan ESDM (terbit 2017), berkisar sangat lebar: Sumatera 0,89 · Sulselbar 0,87 · Khatulistiwa 0,90 · Barito 0,95 · Mahakam 1,08 · Batam-Tanjung Pinang 1,13 · Ternate-Tidore 1,24 · Bangka 1,27 · Sulutgo 1,49 · Kendari 1,67 · Belitung 1,77 · Ende 2,02 tCO₂/MWh. Karena rentangnya begitu lebar, entri catch-all ini dipertahankan T4 (±60% → 0,42–1,68) dan sengaja condong ke sistem diesel terisolasi. ⚠︎ Beberapa sistem (Kendari 1,67 · Belitung 1,77 · Ende 2,02) berada DI ATAS batas atas pita ini — untuk sistem itu WAJIB pilih entri sistemnya, jangan pakai catch-all. Sistem besar (Sumatera, Sulselbar, Kalimantan, Sulut) punya entri T2 tersendiri; ketik nama sistemnya untuk angka yang lebih rapat."
    },
    {
      id: "lpg",
      nama: "LPG (elpiji) untuk kompor/water heater outlet",
      sinonim: ["elpiji", "gas", "gas melon", "tabung gas", "tabung 3 kg", "tabung 12 kg", "lpg 3kg", "propana"],
      satuanDasar: "kg",
      kategori: "energi",
      kgCO2ePerSatuan: 2.99,
      tier: "T2",
      sumber: "IPCC 2006 Guidelines for National Greenhouse Gas Inventories, Vol. 2 (Energy) — faktor default LPG; metodologi yang sama dipakai Pusdatin ESDM untuk inventarisasi GRK sektor energi Indonesia (Permen ESDM No. 22 Tahun 2019)",
      catatan: "Perhitungan terbuka: EF CO₂ default LPG 63.100 kg CO₂/TJ × NCV 47,3 TJ/Gg = 2,985 kg CO₂/kg, ditambah CH₄ (5 kg/TJ, GWP100 28) 0,0066 dan N₂O (0,1 kg/TJ, GWP100 265) 0,0013 → 2,99 kg CO₂e/kg. HANYA PEMBAKARAN (Scope 1). Emisi hulu (kilang, distribusi, pengisian tabung) TIDAK termasuk — literatur well-to-tank menambah kira-kira +0,4 kg CO₂e/kg, jadi angka daur-hidup penuh lebih dekat ke 3,4. Konversi praktis: 1 tabung “melon” 3 kg ≈ 9,0 kg CO₂e; 1 tabung 12 kg ≈ 35,9 kg CO₂e. Karena EF bahan bakar ditentukan kandungan karbon yang sempit, ketidakpastian nyata jauh di bawah ±20% T2 — kalau outlet mencatat jumlah tabung terpakai, entri ini kandidat kuat naik ke T1.",
      rincianTurunan: {
        ringkasAritmetika: "CO₂: 63.100 kg/TJ × 47,3 TJ/Gg = 2,985 kg/kg · CH₄: 5 kg/TJ × GWP100 28 = 0,0066 · N₂O: 0,1 kg/TJ × GWP100 265 = 0,0013 → total 2,99 kg CO₂e/kg (hanya pembakaran)"
      }
    },
    {
      id: "air-pdam",
      nama: "Air PDAM (penyediaan air bersih)",
      sinonim: ["air", "air pdam", "air ledeng", "air keran", "air baku", "air bersih"],
      satuanDasar: "liter",
      kategori: "energi",
      kgCO2ePerSatuan: 153e-6,
      tier: "T4",
      sumber: "UK DESNZ/Defra — Greenhouse Gas Reporting: Conversion Factors 2024, tabel “Water supply” (0,153 kg CO₂e/m³)",
      catatan: "⚠︎ FAKTOR ASING DIPAKAI SEBAGAI PROKSI. Tidak ada faktor emisi penyediaan air PDAM Indonesia yang bisa kami sebut sumbernya. Kami memakai faktor penyediaan air Inggris 0,153 kg CO₂e/m³ ÷ 1.000 = 0,000153 kg CO₂e/liter. Tier diturunkan ke T4 (±60%) BUKAN karena metodenya spend-based, melainkan karena ketidakpastian memindahkan faktor Inggris ke konteks Indonesia setidaknya sebesar itu — PDAM Indonesia umumnya lebih boros listrik pemompaan dan susut jaringannya lebih tinggi, jadi arah biasnya meremehkan. Hanya mencakup penyediaan, TIDAK termasuk pengolahan air limbah (faktor Defra 2024 terpisah: 0,186 kg CO₂e/m³). Kontribusi air terhadap total jejak kafe sangat kecil dibanding susu dan listrik — jangan dijadikan sorotan panel.",
      rincianTurunan: {
        ringkasAritmetika: "0,153 kg CO₂e/m³ (Defra 2024, “Water supply”) ÷ 1.000 liter/m³ = 0,000153 kg CO₂e/liter"
      }
    },
    {
      id: "gelas-kertas-8oz",
      nama: "Gelas kertas 8 oz (240 ml)",
      sinonim: ["paper cup 8oz", "gelas kertas kecil", "cup kertas 8 oz", "gelas kopi kertas", "paper cup 240ml"],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 76e-4,
      tier: "T3",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Paper (primary material production)” 1.339,3 kg CO₂e/t (2024) dan “Average plastic film” 2.574,2 kg CO₂e/t (2021); massa item dari spesifikasi pemasok kemasan Indonesia (sentrapak.com, trigunajayasentosaplastik.com)",
      catatan: "ASUMSI MASSA TERLIHAT: 5,4 g/gelas (kertas food grade 210 gsm, tinggi 9,5 cm, Ø atas 8 cm). Diasumsikan 95% massa serat kertas + 5% lapisan PE. ⚠︎ BATAS BAWAH: faktor Defra untuk kertas/karton mencakup produksi material sampai titik jual, TAPI TIDAK mencakup proses pembentukan gelas (die-cut, laminasi, cetak), pengapalan ke Indonesia, maupun akhir masa pakai. LCA cradle-to-grave gelas kopi sekali pakai di literatur jauh lebih tinggi — Intertek untuk Frugalpac (2020) menyebut sampai 60,9 g CO₂e/gelas (termasuk sleeve, tutup, dan pengolahan sampah; catat bahwa pemberi kerja studi itu menjual gelas pesaing). Konteks penting dari LCA VTT untuk Huhtamaki (2019): gelas hanya sekitar 4% jejak iklim satu latte take-away — 96% sisanya dari kopi dan susu.",
      rincianTurunan: {
        ringkasAritmetika: "(5,13 g × 1.339,3 kg CO₂e/t) + (0,27 g × 2.574,2 kg CO₂e/t) = 0,00687 + 0,00070 = 0,0076 kg CO₂e/gelas",
        asumsiMassa: "5,4 g/gelas — kertas food grade 210 gsm, tinggi 9,5 cm, Ø atas 8 cm (spesifikasi pemasok). Pembagian 95% serat / 5% PE adalah asumsi kami.",
        komponen: [
          {
            nama: "Serat kertas food grade (95% massa)",
            massaKg: 513e-5,
            faktorMaterialKgPerTon: 1339.3,
            sumberMaterial: "Defra/DESNZ 2024 — Paper (primary material production)",
            hasilKgCO2e: 687e-5
          },
          {
            nama: "Lapisan PE (5% massa)",
            massaKg: 27e-5,
            faktorMaterialKgPerTon: 2574.2,
            sumberMaterial: "Defra/DESNZ 2021 — Average plastic film",
            hasilKgCO2e: 7e-4
          }
        ]
      }
    },
    {
      id: "gelas-kertas-12oz",
      nama: "Gelas kertas 12 oz (360 ml)",
      sinonim: ["paper cup 12oz", "cup kertas 12 oz", "gelas kertas besar", "paper cup 360ml", "gelas kertas takeaway"],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 94e-4,
      tier: "T3",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Paper (primary material production)” 1.339,3 kg CO₂e/t (2024) dan “Average plastic film” 2.574,2 kg CO₂e/t (2021); massa item dari spesifikasi pemasok kemasan Indonesia (akapack.id, trigunajayasentosaplastik.com)",
      catatan: "ASUMSI MASSA TERLIHAT: 6,7 g/gelas (kertas food grade 220 gsm, Ø atas 8,9 cm, tinggi 10,9 cm). Diasumsikan 95% serat kertas + 5% lapisan PE. ⚠︎ Batas bawah dengan alasan yang sama seperti gelas 8 oz: pembentukan gelas, cetak, pengapalan, dan akhir masa pakai belum masuk. Tutup dijual/dihitung terpisah — lihat entri tutup-plastik, jangan lupa menambahkannya kalau outlet memakai tutup.",
      rincianTurunan: {
        ringkasAritmetika: "(6,365 g × 1.339,3 kg CO₂e/t) + (0,335 g × 2.574,2 kg CO₂e/t) = 0,00852 + 0,00086 = 0,0094 kg CO₂e/gelas",
        asumsiMassa: "6,7 g/gelas — kertas food grade 220 gsm, Ø atas 8,9 cm, tinggi 10,9 cm (spesifikasi pemasok). Pembagian 95% serat / 5% PE adalah asumsi kami.",
        komponen: [
          {
            nama: "Serat kertas food grade (95% massa)",
            massaKg: 6365e-6,
            faktorMaterialKgPerTon: 1339.3,
            sumberMaterial: "Defra/DESNZ 2024 — Paper (primary material production)",
            hasilKgCO2e: 852e-5
          },
          {
            nama: "Lapisan PE (5% massa)",
            massaKg: 335e-6,
            faktorMaterialKgPerTon: 2574.2,
            sumberMaterial: "Defra/DESNZ 2021 — Average plastic film",
            hasilKgCO2e: 86e-5
          }
        ]
      }
    },
    {
      id: "gelas-plastik-pp-16oz",
      nama: "Gelas plastik PP 16 oz (470 ml)",
      sinonim: [
        "cup plastik 16oz",
        "gelas plastik",
        "cup 16 oz",
        "gelas pp",
        "cup pp 16oz",
        "gelas es 16oz",
        "cup thai tea"
      ],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 0.0217,
      tier: "T3",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Plastics: PP (incl. forming), primary material production” 3.104,7 kg CO₂e/t (2021); massa item dari spesifikasi pemasok kemasan Indonesia (saranakemasan.com “Gelas Cup 16 oz, tebal 7 gr”, juraganplastik.com)",
      catatan: "ASUMSI MASSA TERLIHAT: 7 g/gelas — ini ketebalan standar yang dijual di pasar Indonesia untuk 16 oz. Faktor Defra ini SUDAH termasuk “forming” (pencetakan polimer menjadi produk), jadi cakupannya lebih lengkap daripada entri gelas kertas — belum termasuk pengapalan ke Indonesia dan akhir masa pakai. Perhatikan temuan yang tidak intuitif: satu gelas PP 16 oz (0,0217) berjejak sekitar 2,3× gelas kertas 12 oz versi batas-bawah kami (0,0094). Perbandingan ini TIDAK setara secara metode (cakupan berbeda) — jangan dipakai untuk klaim “plastik lebih buruk dari kertas” di hadapan juri. Ketebalan 4/5/9/11 gram juga beredar di pasar; kalau outlet tahu gramasinya, skalakan linear terhadap massa dan tier bisa naik.",
      rincianTurunan: {
        ringkasAritmetika: "7 g × 3.104,7 kg CO₂e/t = 0,0217 kg CO₂e/gelas",
        asumsiMassa: "7 g/gelas — gramasi standar pasar Indonesia untuk 16 oz (spesifikasi pemasok).",
        komponen: [
          {
            nama: "Polipropilena (PP), termasuk pembentukan",
            massaKg: 7e-3,
            faktorMaterialKgPerTon: 3104.7,
            sumberMaterial: "Defra/DESNZ 2021 — Plastics: PP (incl. forming)",
            hasilKgCO2e: 0.0217
          }
        ]
      }
    },
    {
      id: "gelas-plastik-pp-22oz",
      nama: "Gelas plastik PP 22 oz (650 ml)",
      sinonim: ["cup plastik 22oz", "cup 22 oz", "gelas plastik besar", "cup pp 22oz", "gelas boba", "cup jumbo"],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 0.0279,
      tier: "T3",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Plastics: PP (incl. forming), primary material production” 3.104,7 kg CO₂e/t (2021); massa item dari spesifikasi pemasok kemasan Indonesia (juraganplastik.com, lazada.co.id/Ecoplast-Starindo)",
      catatan: "ASUMSI MASSA TERLIHAT: 9 g/gelas (ketebalan 9 gram adalah standar pasar Indonesia untuk 22 oz; 18 oz memakai 8 gram). Faktor sudah termasuk forming; belum termasuk pengapalan ke Indonesia dan akhir masa pakai. Ini ukuran yang lazim untuk thai tea, boba, dan es kopi susu — kalau outlet mayoritas memakai 22 oz, kemasan bisa menjadi pos yang terlihat di panel, walaupun tetap kecil dibanding susu.",
      rincianTurunan: {
        ringkasAritmetika: "9 g × 3.104,7 kg CO₂e/t = 0,0279 kg CO₂e/gelas",
        asumsiMassa: "9 g/gelas — gramasi standar pasar Indonesia untuk 22 oz (spesifikasi pemasok).",
        komponen: [
          {
            nama: "Polipropilena (PP), termasuk pembentukan",
            massaKg: 9e-3,
            faktorMaterialKgPerTon: 3104.7,
            sumberMaterial: "Defra/DESNZ 2021 — Plastics: PP (incl. forming)",
            hasilKgCO2e: 0.0279
          }
        ]
      }
    },
    {
      id: "tutup-plastik",
      nama: "Tutup plastik gelas (lid)",
      sinonim: ["tutup cup", "lid", "tutup gelas", "tutup paper cup", "dome lid", "tutup plastik cup", "penutup gelas"],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 49e-4,
      tier: "T3",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Average plastic rigid (primary material production)” 3.276,7 kg CO₂e/t (2022); massa item dari spesifikasi pemasok kemasan Indonesia (trigunajayasentosaplastik.com)",
      catatan: "ASUMSI MASSA TERLIHAT: 1,5 g/tutup — spesifikasi tutup paper cup 8 oz (Ø 8 cm, tebal 0,2 mm). Varian lain yang terdokumentasi: tutup 12 oz 1,1 g → 0,0036 kg CO₂e; jadi rentang praktis satu entri ini 0,0036–0,0049. Kami memakai angka yang lebih tinggi supaya tidak meremehkan. Dome lid (tutup cembung untuk whipped cream/topping) LEBIH BERAT dari keduanya dan tidak punya spesifikasi bersumber yang kami temukan — kalau outlet memakai dome lid, angka ini meremehkan. Faktor “average plastic rigid” adalah rata-rata campuran polimer, bukan PS atau PP spesifik.",
      rincianTurunan: {
        ringkasAritmetika: "1,5 g × 3.276,7 kg CO₂e/t = 0,0049 kg CO₂e/tutup",
        asumsiMassa: "1,5 g/tutup — tutup paper cup 8 oz, Ø 8 cm, tebal 0,2 mm (spesifikasi pemasok).",
        komponen: [
          {
            nama: "Plastik kaku (rata-rata campuran polimer)",
            massaKg: 15e-4,
            faktorMaterialKgPerTon: 3276.7,
            sumberMaterial: "Defra/DESNZ 2022 — Average plastic rigid",
            hasilKgCO2e: 49e-4
          }
        ]
      }
    },
    {
      id: "segel-plastik-cup",
      nama: "Segel plastik cup (lid sealing film)",
      sinonim: ["seal cup", "plastik seal", "film seal", "segel gelas", "lid sealer", "plastik press cup", "segel mesin press"],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 64e-5,
      tier: "T4",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Average plastic film (primary material production)” 2.574,2 kg CO₂e/t (2021); ⚠︎ massa per cup adalah PERHITUNGAN GEOMETRIS KAMI SENDIRI, bukan spesifikasi pemasok",
      catatan: "⚠︎ ASUMSI MASSA BUATAN KAMI, DITAMPILKAN PENUH AGAR BISA DIBANTAH: lebar rol 8,8 cm × maju 9,5 cm per gelas = 83,6 cm² film; tebal 30 µm; densitas PP 0,905 g/cm³ → 83,6 × 0,003 cm × 0,905 = 0,227 g, dibulatkan ke 0,25 g. Karena massanya tidak berasal dari sumber yang bisa disebut namanya, tier DITURUNKAN ke T4 (±60% → 0,00026–0,00102). Item ini sangat lazim di kafe Indonesia (mesin press untuk thai tea, boba, es kopi susu) sehingga lebih jujur memasukkannya dengan tier rendah daripada menghilangkannya. Kalau outlet menimbang satu rol dan membagi jumlah gelas yang bisa disegel, entri ini langsung naik ke T1.",
      rincianTurunan: {
        ringkasAritmetika: "8,8 cm × 9,5 cm = 83,6 cm² × 0,003 cm × 0,905 g/cm³ = 0,227 g → dibulatkan 0,25 g × 2.574,2 kg CO₂e/t = 0,00064 kg CO₂e/gelas",
        asumsiMassa: "⚠︎ 0,25 g/segel — hasil perhitungan geometris KAMI, bukan spesifikasi pemasok.",
        komponen: [
          {
            nama: "Film plastik (PP)",
            massaKg: 25e-5,
            faktorMaterialKgPerTon: 2574.2,
            sumberMaterial: "Defra/DESNZ 2021 — Average plastic film",
            hasilKgCO2e: 64e-5
          }
        ]
      }
    },
    {
      id: "sedotan-plastik",
      nama: "Sedotan plastik",
      sinonim: ["sedotan", "straw", "sedotan pp", "pipet", "sedotan minum", "sedotan bengkok"],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 13e-4,
      tier: "T3",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Plastics: PP (incl. forming), primary material production” 3.104,7 kg CO₂e/t (2021); massa item dari HSU Straw Analysis (Appropedia) — rata-rata sedotan plastik 0,42 g",
      catatan: "ASUMSI MASSA TERLIHAT: 0,42 g/sedotan (rata-rata; sedotan PP tipis bisa 0,20 g, sedotan boba tebal 1,5–2 g). Faktor sudah termasuk forming. ⚠︎ Sedotan boba/jumbo bisa 4–5× angka ini — kalau outlet menjual boba, jangan pakai entri ini apa adanya. PERINGATAN KERANGKA: GWP tidak menangkap alasan utama sedotan plastik diatur, yaitu sampah laut dan mikroplastik. Jangan pernah menyimpulkan “sedotan plastik lebih baik untuk lingkungan” hanya dari angka karbon di panel ini.",
      rincianTurunan: {
        ringkasAritmetika: "0,42 g × 3.104,7 kg CO₂e/t = 0,0013 kg CO₂e/sedotan",
        asumsiMassa: "0,42 g/sedotan — rata-rata HSU Straw Analysis (Appropedia).",
        komponen: [
          {
            nama: "Polipropilena (PP), termasuk pembentukan",
            massaKg: 42e-5,
            faktorMaterialKgPerTon: 3104.7,
            sumberMaterial: "Defra/DESNZ 2021 — Plastics: PP (incl. forming)",
            hasilKgCO2e: 13e-4
          }
        ]
      }
    },
    {
      id: "sedotan-kertas",
      nama: "Sedotan kertas",
      sinonim: ["paper straw", "sedotan ramah lingkungan", "sedotan kertas food grade", "straw kertas", "sedotan eco"],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 33e-4,
      tier: "T3",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Paper (primary material production)” 1.339,3 kg CO₂e/t (2024); massa item dari rentang industri sedotan kertas (paperstrawtech.com, millionpack.com: 2–3 g per sedotan)",
      catatan: "ASUMSI MASSA TERLIHAT: 2,5 g/sedotan (tengah rentang industri 2–3 g untuk sedotan 3–4 lapis; bervariasi menurut jumlah lapisan dan pelapis wax/PLA). TEMUAN JUJUR YANG HARUS DITAMPILKAN, BUKAN DISEMBUNYIKAN: sedotan kertas berjejak karbon ±2,5× sedotan plastik (0,0033 vs 0,0013) karena massanya 6× lebih besar, meski faktor materialnya lebih rendah. Itu tidak berarti sedotan kertas “lebih buruk” — GWP bukan satu-satunya dampak, dan sedotan kertas terurai serta tidak menjadi mikroplastik laut. Panel harus menampilkan angka ini apa adanya beserta kalimat batasan ini, bukan memilih angka yang enak dilihat. Belum termasuk pembentukan (penggulungan, pengeleman) dan akhir masa pakai.",
      rincianTurunan: {
        ringkasAritmetika: "2,5 g × 1.339,3 kg CO₂e/t = 0,0033 kg CO₂e/sedotan",
        asumsiMassa: "2,5 g/sedotan — tengah rentang industri 2–3 g (paperstrawtech.com, millionpack.com).",
        komponen: [
          {
            nama: "Serat kertas",
            massaKg: 25e-4,
            faktorMaterialKgPerTon: 1339.3,
            sumberMaterial: "Defra/DESNZ 2024 — Paper (primary material production)",
            hasilKgCO2e: 33e-4
          }
        ]
      }
    },
    {
      id: "kantong-plastik-kresek",
      nama: "Kantong plastik kresek HDPE (uk. 28)",
      sinonim: [
        "kresek",
        "kantong plastik",
        "plastik kresek",
        "kantong kresek",
        "tas plastik",
        "asoy",
        "kantong belanja plastik",
        "hdpe bag"
      ],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 0.0286,
      tier: "T3",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Average plastic film (primary material production)” 2.574,2 kg CO₂e/t (2021); massa item dari spesifikasi pemasok Indonesia (trigunajayasentosaplastik.com: kresek HDPE uk. 28, 40 mikron, 11,1 g/pcs)",
      catatan: "ASUMSI MASSA TERLIHAT: 11,1 g/lembar untuk ukuran 28 (28×48 cm, tebal 40 mikron). SKALAKAN LINEAR untuk ukuran lain — kafe lebih sering memakai uk. 17 (17×33 cm) atau uk. 24 (24×38 cm) yang jauh lebih ringan, sehingga nilainya turun kira-kira ke 0,013–0,021 kg CO₂e. ⚠︎ Kalau outlet memakai kresek kecil dan tetap dihitung dengan entri ini, hasilnya MELEBIH-LEBIHKAN. Sebaiknya UI menanyakan ukuran kresek, bukan menerapkan satu angka ke semua. Konteks: satu kresek uk. 28 (0,0286) berjejak setara sekitar 1,3 gelas plastik PP 16 oz — kemasan pembawa sering luput dari perhitungan padahal bobotnya nyata. Belum termasuk akhir masa pakai; sebagian besar kresek Indonesia berakhir di TPA atau lingkungan terbuka, yang dampak metananya tidak masuk angka ini.",
      rincianTurunan: {
        ringkasAritmetika: "11,1 g × 2.574,2 kg CO₂e/t = 0,0286 kg CO₂e/lembar",
        asumsiMassa: "11,1 g/lembar — kresek HDPE uk. 28 (28×48 cm, 40 mikron), spesifikasi pemasok.",
        komponen: [
          {
            nama: "Film HDPE",
            massaKg: 0.0111,
            faktorMaterialKgPerTon: 2574.2,
            sumberMaterial: "Defra/DESNZ 2021 — Average plastic film",
            hasilKgCO2e: 0.0286
          }
        ]
      }
    },
    {
      id: "kardus",
      nama: "Kardus / karton gelombang",
      sinonim: ["kardus", "karton", "dus", "box kardus", "corrugated", "kardus packing", "kotak karton", "dus takeaway"],
      satuanDasar: "kg",
      kategori: "kemasan",
      kgCO2ePerSatuan: 0.84,
      tier: "T3",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Paper and board: board (primary material production)” 842,6 kg CO₂e/t (2019)",
      catatan: "Satuan per KILOGRAM, bukan per lembar — kardus terlalu bervariasi ukurannya untuk difaktorkan per buah. Konversi praktis dengan asumsi massa yang harus ditampilkan: kotak takeaway kecil ±40 g → 0,034 kg CO₂e; carrier 4 gelas ±60 g → 0,050 kg CO₂e; kardus pengiriman sedang ±500 g → 0,42 kg CO₂e. Faktor ini untuk material PERAWAN (primary). Karton gelombang di Indonesia berkandungan serat daur ulang tinggi, yang biasanya MENURUNKAN jejaknya — jadi angka ini kemungkinan MELEBIH-LEBIHKAN untuk kardus lokal. ⚠︎ Vintage faktor 2019 dan belum mencakup konversi menjadi kotak, cetak, maupun akhir masa pakai. Kalau pemasok kardus bisa memberi kandungan daur ulang dan jejak per ton, entri ini naik ke T1.",
      rincianTurunan: {
        ringkasAritmetika: "842,6 kg CO₂e/t ÷ 1.000 = 0,8426 kg CO₂e/kg → dibulatkan 0,84"
      }
    },
    {
      id: "tisu-makan",
      nama: "Tisu makan / serbet kertas",
      sinonim: ["tisu", "tissue", "serbet", "tisu makan", "napkin", "tisu meja", "kertas tisu"],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 87e-5,
      tier: "T4",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Paper (primary material production)” 1.339,3 kg CO₂e/t (2024); gramatur dari data industri tisu (grammage serbet ±16 g/m²); ⚠︎ ukuran lembar adalah asumsi kami",
      catatan: "⚠︎ ASUMSI MASSA SEBAGIAN BUATAN KAMI: lembar 20×20 cm = 0,04 m² × 16 g/m² = 0,64 g, dibulatkan 0,65 g. Tier DITURUNKAN ke T4 (±60% → 0,00035–0,00139) karena ukuran lembar tidak berasal dari spesifikasi pemasok bernama, dan karena tisu 2-ply atau ukuran 21×21/23×23 cm juga lazim. Selain itu faktor “paper” Defra bukan faktor khusus tisu — studi jejak karbon pulp & kertas AS (BioResources) menunjukkan grade tisu berada di ujung ATAS rentang 608–1.978 kg CO₂e/ton, jadi 1.339 kemungkinan sedikit meremehkan. Per lembar angkanya sangat kecil; yang membuatnya terlihat adalah volume — 1.000 tisu/hari ≈ 0,87 kg CO₂e/hari.",
      rincianTurunan: {
        ringkasAritmetika: "0,04 m² × 16 g/m² = 0,64 g → dibulatkan 0,65 g × 1.339,3 kg CO₂e/t = 0,00087 kg CO₂e/lembar",
        asumsiMassa: "⚠︎ Lembar 20×20 cm adalah asumsi KAMI; gramatur 16 g/m² dari data industri tisu.",
        komponen: [
          {
            nama: "Serat kertas tisu",
            massaKg: 65e-5,
            faktorMaterialKgPerTon: 1339.3,
            sumberMaterial: "Defra/DESNZ 2024 — Paper (primary material production)",
            hasilKgCO2e: 87e-5
          }
        ]
      }
    },
    {
      id: "kertas-struk-termal",
      nama: "Kertas struk termal (thermal receipt)",
      sinonim: ["struk", "kertas struk", "nota", "thermal paper", "kertas kasir", "roll struk", "bon", "kertas printer kasir"],
      satuanDasar: "buah",
      kategori: "kemasan",
      kgCO2ePerSatuan: 88e-5,
      tier: "T4",
      sumber: "Defra/DESNZ UK GHG Conversion Factors — “Paper (primary material production)” 1.339,3 kg CO₂e/t (2024); ⚠︎ panjang dan gramatur struk adalah asumsi kami",
      catatan: "⚠︎ ASUMSI MASSA BUATAN KAMI, DITAMPILKAN PENUH: lebar rol 80 mm (standar printer termal titik bayar) × panjang cetak 15 cm = 0,012 m²; kertas termal 55 g/m² → 0,66 g per struk. Tier T4 (±60% → 0,00035–0,00141) karena panjang struk bergantung jumlah baris item dan bukan angka bersumber. Sanity check independen: estimasi industri menyebut satu struk kertas menghasilkan “kurang dari 2 gram CO₂ termasuk transportasi hulu-hilir” — hasil kami konsisten dan berada di sisi rendah karena tidak memasukkan transportasi. ⚠︎ Klaim viral NRDC “0,5 pon CO₂ per struk” (±227 g) beredar luas dan BESARNYA TIDAK MASUK AKAL untuk selembar kertas 0,66 g — jangan pernah dipakai. JALUR NAIK TIER: kalau printer melaporkan panjang cetak sebenarnya per transaksi, entri ini bisa naik ke T1 dan menjadi contoh bagus di panel tentang bagaimana data primer menggantikan asumsi. Batasan non-karbon: kertas termal berlapis pengembang warna (BPA/BPS) sehingga umumnya tidak dapat didaur ulang — dampak itu tidak tertangkap GWP.",
      rincianTurunan: {
        ringkasAritmetika: "8 cm × 15 cm = 0,012 m² × 55 g/m² = 0,66 g × 1.339,3 kg CO₂e/t = 0,00088 kg CO₂e/struk",
        asumsiMassa: "⚠︎ Panjang cetak 15 cm adalah asumsi KAMI; lebar rol 80 mm standar printer termal titik bayar.",
        komponen: [
          {
            nama: "Kertas termal",
            massaKg: 66e-5,
            faktorMaterialKgPerTon: 1339.3,
            sumberMaterial: "Defra/DESNZ 2024 — Paper (primary material production)",
            hasilKgCO2e: 88e-5
          }
        ]
      }
    }
  ];
  var PETA_FAKTOR = new Map(FAKTOR_EMISI.map((f) => [f.id, f]));
  function faktorById(id) {
    return PETA_FAKTOR.get(id);
  }
  var PERINGATAN_FAKTOR = {
    "kopi-arabika": [
      "⚠︎ Divergensi antar-sumber besar: Poore & Nemecek 28,53 vs ADEME Agribalyse 8,4 kg CO₂e/kg. Tampilkan keduanya."
    ],
    "kopi-robusta": [
      "⚠︎ Sumber tidak memisahkan robusta dari arabika — nilainya identik karena satu kategori, bukan karena diukur sama."
    ],
    "kakao-bubuk": ["⚠︎ Rentang antar-sumber 2,8–46,65 kg CO₂e/kg; ±35% T3 tidak mencerminkan ketidakpastian sebenarnya."],
    "cokelat-hitam": ["⚠︎ Pembanding ADEME Agribalyse untuk cokelat hitam <70% kakao hanya 19,1 kg CO₂e/kg."],
    "daging-sapi": [
      "⚠︎ 99,48 adalah kawanan pedaging; kawanan perah 33,3 kg CO₂e/kg pada sumber yang sama. Pasokan Indonesia bercampur.",
      "⚠︎ Sinonim “rendang”/“daging” dicocokkan ke daging sapi — rendang adalah masakan (ada santan & bumbu), bukan bahan tunggal."
    ],
    ikan: [
      "⚠︎ Faktor ini untuk ikan BUDIDAYA. Untuk ikan laut tangkap (mis. tongkol, kembung) angka ini melebihkan 3–5×.",
      "⚠︎ “Salmon” dan “dori” umumnya impor beku — rantai dingin lintas negara tidak tercakup."
    ],
    keju: ["⚠︎ Keju analog berbasis minyak nabati jauh lebih rendah; faktor ini melebihkan serius bila outlet memakainya."],
    mentega: ["⚠︎ Jangan pakai untuk margarin — margarin punya entri sendiri (proksi minyak sawit, T4)."],
    margarin: ["⚠︎ Proksi minyak sawit 100%; margarin komersial hanya 60–80% minyak, jadi ini cenderung melebihkan."],
    beras: [
      "⚠︎ Faktor per kg BERAS mentah. Bila yang ditimbang nasi matang, bagi kira-kira 3 — konfirmasi ke merchant, jangan asumsikan."
    ],
    kentang: ["⚠︎ Kentang goreng beku impor bukan produk yang sama; bila itu yang dipakai, turunkan ke T4 (±60%)."],
    tomat: [
      "⚠︎ Rata-rata global memuat rumah kaca berpemanas — melebihkan untuk tomat lapangan tropis.",
      "⚠︎ “Saus tomat” adalah produk olahan berkemasan; faktor tomat segar meremehkannya."
    ],
    alpukat: ["⚠︎ Per kg DAGING buah; buah utuh hanya ±70% daging. Intensitas air tinggi, tidak tertangkap GWP."],
    mangga: ["⚠︎ Nilai jalur impor laut; jalur udara 11,6 kg CO₂e/kg (16×) pada sumber yang sama."],
    "buah-lainnya": ["⚠︎ Rata-rata lintas-buah, bukan nilai spesifik buah mana pun."],
    "sayuran-umum": ["⚠︎ Kategori payung; jangan dipakai untuk sayuran rumah kaca berpemanas atau sayuran impor beku."],
    bawang: ["⚠︎ Bawang putih Indonesia hampir seluruhnya impor — komponen transportasinya tidak terpisah di sini."],
    "gula-aren": ["⚠︎ Proksi gula tebu mentah. Kayu bakar pemasakan nira tidak tercakup — nilai riil kemungkinan lebih tinggi."],
    "gula-merah": ["⚠︎ Proksi gula tebu mentah. Kayu bakar pemasakan nira tidak tercakup — nilai riil kemungkinan lebih tinggi."],
    "krimer-nabati": ["⚠︎ Bukan nilai basis data mana pun; komposisi proksi buatan kami. Ganti dengan data pemasok."],
    teh: ["⚠︎ Literatur melaporkan 4,5–19,9 kg CO₂e/kg teh kering. Kemasan teh celup individual tidak termasuk."],
    tempe: ["⚠︎ Sumber Eropa; kemungkinan mengecilkan tempe Indonesia dari kedelai impor. Batas atas lebih mungkin benar."],
    tahu: ["⚠︎ Pembanding Agribalyse hanya 1,00 kg CO₂e/kg (kedelai Eropa tanpa deforestasi)."],
    "susu-sapi": ["⚠︎ Selisih antar-sumber (3,15 global vs 1,46 Agribalyse) lebih lebar dari rentang ±35%."],
    "susu-uht": ["⚠︎ Nilainya identik dengan susu segar karena sumber tidak memisahkannya — bukan hasil pengukuran terpisah."],
    "es-batu": ["⚠︎ Faktor energi (listrik mesin es), bukan bahan pangan. Asumsi 0,10 kWh/kg es belum diverifikasi. Baca meteran mesin es outlet untuk naik ke T1."],
    "air-pdam": [
      "⚠︎ Proksi faktor Inggris; PDAM Indonesia kemungkinan lebih tinggi. Tidak termasuk pengolahan air limbah.",
      "⚠︎ Air kemasan botol BUKAN air PDAM — kemasannya mendominasi dan tidak dihitung di sini."
    ],
    "listrik-grid-nasional": [
      "Satuan sebenarnya kWh (1 unit = 1 kWh). Faktor grid wajib diperbarui tiap tahun."
    ],
    "listrik-grid-jamali": [
      "Faktor grid per sistem Ditjen Ketenagalistrikan ESDM (terbit 2017); Jamali 0,89 setara Sumatera — jangan dipakai untuk klaim “lebih bersih” antarwilayah. Wajib diperbarui tiap tahun."
    ],
    "listrik-grid-sumatera": ["Faktor grid per sistem Ditjen Ketenagalistrikan ESDM (terbit 2017). Wajib diperbarui tiap tahun."],
    "listrik-grid-sulselbar": ["Faktor grid per sistem Ditjen Ketenagalistrikan ESDM (terbit 2017). Wajib diperbarui tiap tahun."],
    "listrik-grid-khatulistiwa": ["Faktor grid per sistem Ditjen Ketenagalistrikan ESDM (terbit 2017). Wajib diperbarui tiap tahun."],
    "listrik-grid-barito": ["Faktor grid per sistem Ditjen Ketenagalistrikan ESDM (terbit 2017). Wajib diperbarui tiap tahun."],
    "listrik-grid-mahakam": ["Faktor grid per sistem Ditjen Ketenagalistrikan ESDM (terbit 2017). Wajib diperbarui tiap tahun."],
    "listrik-grid-sulutgo": ["⚠︎ 1,49 kg CO₂e/kWh — jauh di atas Jawa. Faktor grid per sistem Ditjen Ketenagalistrikan ESDM (terbit 2017). Wajib diperbarui tiap tahun."],
    "listrik-grid-luar-jamali": [
      "⚠︎ Catch-all kasar (T4) untuk input yang tidak menyebut sistemnya. Nilai per sistem yang bisa disebut namanya ada di daftar Ditjen Ketenagalistrikan ESDM (terbit 2017) dan berkisar 0,87 (Sulselbar) sampai 2,02 (Ende) — pilih entri sistem spesifik untuk angka yang benar."
    ],
    lpg: ["Hanya pembakaran (Scope 1). Emisi hulu ±+0,4 kg CO₂e/kg tidak termasuk."],
    "sedotan-plastik": [
      "⚠︎ Sedotan boba/jumbo 4–5× angka ini.",
      "⚠︎ GWP tidak menangkap sampah laut & mikroplastik — jangan simpulkan “plastik lebih baik” dari kolom karbon."
    ],
    "sedotan-kertas": [
      "⚠︎ Jejak karbonnya ±2,5× sedotan plastik karena massanya 6× lebih besar. Itu temuan, bukan kesimpulan bahwa kertas lebih buruk."
    ],
    "tutup-plastik": ["⚠︎ Dome lid lebih berat dari 1,5 g — angka ini meremehkan bila outlet memakainya."],
    "kantong-plastik-kresek": ["⚠︎ Nilai untuk kresek uk. 28 (11,1 g). Kresek kecil uk. 17/24 jauh lebih ringan — ini melebihkan."],
    "gelas-kertas-8oz": ["⚠︎ BATAS BAWAH: pembentukan gelas, cetak, pengapalan, dan akhir masa pakai belum termasuk."],
    "gelas-kertas-12oz": ["⚠︎ BATAS BAWAH: pembentukan gelas, cetak, pengapalan, dan akhir masa pakai belum termasuk. Tutup dihitung terpisah."],
    "gelas-plastik-pp-16oz": ["⚠︎ Gramasi 4–11 g beredar di pasar; bila outlet tahu gramasinya, skalakan linear."],
    "gelas-plastik-pp-22oz": ["⚠︎ Gramasi pasar bervariasi; bila outlet tahu gramasinya, skalakan linear."],
    "segel-plastik-cup": ["⚠︎ Massa 0,25 g adalah hitungan geometris kami, bukan spesifikasi pemasok."],
    "tisu-makan": ["⚠︎ Ukuran lembar 20×20 cm adalah asumsi kami; tisu 2-ply lebih berat."],
    "kertas-struk-termal": [
      "⚠︎ Panjang struk 15 cm adalah asumsi kami.",
      "⚠︎ Klaim viral “0,5 pon CO₂ per struk” tidak masuk akal — jangan pernah dipakai."
    ],
    kardus: ["⚠︎ Faktor material perawan; karton Indonesia berkandungan daur ulang tinggi, jadi ini cenderung melebihkan."],
    "susu-bubuk": ["Sistem persusuan Prancis; susu bubuk impor ke Indonesia punya jarak angkut berbeda."],
    "susu-kental-manis": ["⚠︎ SKM Indonesia banyak memakai lemak nabati + skim, bukan susu pekat seperti asumsi sumber."],
    "tepung-terigu": ["⚠︎ 100% gandum Indonesia diimpor; pelayaran samudra tidak tercakup — nilai riil kemungkinan lebih tinggi."],
    udang: ["⚠︎ Didominasi konversi mangrove global; tambak lama non-mangrove jauh lebih rendah."],
    sirup: ["⚠︎ Perisa, pengental, dan kemasan botol kaca tidak dimodelkan sumber."],
    telur: ["Konversi butir→kg memakai 60 g/butir (ukuran M) — konversi berat, bukan angka dari sumber."],
    jeruk: ["Kategori payung sitrus: jeruk manis, lemon, dan nipis tidak dipisahkan."]
  };
  function peringatanFaktor(id) {
    return Object.hasOwn(PERINGATAN_FAKTOR, id) ? PERINGATAN_FAKTOR[id] : [];
  }
  var DAFTAR_SATUAN = [
    // massa → kg
    { kunci: ["kg", "kgs", "kilo", "kilos", "kilogram", "kilograms", "kilo gram"], aturan: { satuan: "kg", pengali: 1 } },
    { kunci: ["g", "gr", "grm", "gram", "grams", "gramme"], aturan: { satuan: "kg", pengali: 1e-3 } },
    { kunci: ["mg", "miligram", "milligram"], aturan: { satuan: "kg", pengali: 1e-6 } },
    {
      // "ons" Indonesia = 100 g. Ini BUKAN ounce internasional — kekeliruan yang
      // menggeser hasil 3,5× kalau disamakan.
      kunci: ["ons", "hg", "hektogram"],
      aturan: { satuan: "kg", pengali: 0.1, asumsi: "“ons” dibaca sebagai satuan Indonesia = 100 g (bukan ounce 28,35 g)" }
    },
    {
      kunci: ["oz", "ounce", "ounces"],
      aturan: {
        satuan: "kg",
        pengali: 0.02835,
        asumsi: "“oz” dibaca sebagai ounce massa 28,35 g",
        alternatif: { satuan: "liter", pengali: 0.02957, asumsi: "“oz” dibaca sebagai fluid ounce 29,57 ml (lazim untuk ukuran gelas)" }
      }
    },
    { kunci: ["lb", "lbs", "pound", "pounds"], aturan: { satuan: "kg", pengali: 0.45359 } },
    { kunci: ["kuintal", "kwintal"], aturan: { satuan: "kg", pengali: 100 } },
    { kunci: ["ton", "tonne", "tonnes"], aturan: { satuan: "kg", pengali: 1e3 } },
    // volume → liter
    { kunci: ["l", "lt", "ltr", "liter", "litre", "liters", "litres"], aturan: { satuan: "liter", pengali: 1 } },
    { kunci: ["ml", "mililiter", "milliliter", "mili liter", "cc", "cm3"], aturan: { satuan: "liter", pengali: 1e-3 } },
    { kunci: ["dl", "desiliter"], aturan: { satuan: "liter", pengali: 0.1 } },
    {
      kunci: ["sdt", "sendok teh", "teaspoon", "tsp"],
      aturan: { satuan: "liter", pengali: 5e-3, asumsi: "⚠︎ 1 sendok teh diasumsikan 5 ml — asumsi kami; untuk bahan kering hasilnya bergantung densitas" }
    },
    {
      kunci: ["sdm", "sendok makan", "tablespoon", "tbsp"],
      aturan: { satuan: "liter", pengali: 0.015, asumsi: "⚠︎ 1 sendok makan diasumsikan 15 ml — asumsi kami; untuk bahan kering hasilnya bergantung densitas" }
    },
    {
      kunci: ["shot", "shots"],
      aturan: { satuan: "liter", pengali: 0.03, asumsi: "⚠︎ 1 shot diasumsikan 30 ml — asumsi kami" }
    },
    {
      kunci: ["cangkir"],
      aturan: { satuan: "liter", pengali: 0.24, asumsi: "⚠︎ 1 cangkir takar diasumsikan 240 ml — asumsi kami" }
    },
    // hitungan → buah
    {
      kunci: ["buah", "bh", "pcs", "pc", "piece", "pieces", "biji", "butir", "btr", "lembar", "lbr", "helai", "batang", "unit", "ea"],
      aturan: { satuan: "buah", pengali: 1 }
    },
    {
      // "gelas"/"cup" bermakna ganda di kafe: benda yang dihitung ATAU takaran volume.
      kunci: ["gelas", "cup", "cups"],
      aturan: {
        satuan: "buah",
        pengali: 1,
        asumsi: "“gelas/cup” dibaca sebagai HITUNGAN benda",
        alternatif: { satuan: "liter", pengali: 0.24, asumsi: "⚠︎ “gelas/cup” dibaca sebagai takaran volume 240 ml — asumsi kami" }
      }
    },
    {
      // Listrik: skema hanya punya kg/liter/buah, jadi 1 "buah" = 1 kWh.
      kunci: ["kwh", "kw h", "kwj", "kilowatt jam", "kilowatt hour", "kilo watt hour"],
      aturan: { satuan: "buah", pengali: 1, asumsi: "1 unit = 1 kWh (konvensi skema; UI wajib menampilkan “kWh”)" }
    }
  ];
  var PETA_SATUAN = /* @__PURE__ */ new Map();
  for (const baris of DAFTAR_SATUAN) {
    for (const kunci of baris.kunci) PETA_SATUAN.set(kunci, baris.aturan);
  }
  var SATUAN_AMBIGU = {
    pon: "“pon” bisa berarti 500 g (Indonesia) atau pound 453,6 g. Tulis “500 g” atau “lb”.",
    sendok: "“sendok” tanpa keterangan ambigu. Tulis “sdt” (5 ml) atau “sdm” (15 ml).",
    galon: "“galon” berbeda antara AS (3,79 L) dan Imperial (4,55 L), dan galon air isi ulang 19 L. Tulis liternya.",
    gallon: "“gallon” berbeda antara AS (3,79 L) dan Imperial (4,55 L). Tulis liternya.",
    tabung: "Isi tabung berbeda-beda. Tulis beratnya, mis. “3 kg” atau “12 kg”.",
    botol: "Isi botol berbeda-beda. Tulis volume atau beratnya.",
    kaleng: "Isi kaleng berbeda-beda. Tulis volume atau beratnya.",
    sachet: "Isi sachet berbeda-beda. Tulis beratnya dalam gram.",
    bungkus: "Isi bungkus berbeda-beda. Tulis berat atau volumenya.",
    pak: "Isi pak berbeda-beda. Tulis jumlah buah atau beratnya.",
    pack: "Isi pack berbeda-beda. Tulis jumlah buah atau beratnya.",
    dus: "Isi dus berbeda-beda. Tulis jumlah buah atau beratnya.",
    rol: "Isi rol berbeda-beda. Tulis panjang atau beratnya.",
    roll: "Isi rol berbeda-beda. Tulis panjang atau beratnya.",
    ikat: "Berat satu ikat tidak baku. Tulis beratnya dalam gram.",
    porsi: "Berat satu porsi tidak baku. Tulis berat atau volumenya.",
    potong: "Berat satu potong tidak baku. Tulis beratnya dalam gram.",
    secukupnya: "“secukupnya” tidak bisa dihitung. Tulis jumlah yang sebenarnya dipakai."
  };
  var CONTOH_SATUAN_DITERIMA = [
    "kg",
    "gram",
    "ons",
    "liter",
    "ml",
    "sdm",
    "sdt",
    "buah",
    "butir",
    "lembar",
    "kWh"
  ];
  function angkaLangkah(nilai) {
    if (!Number.isFinite(nilai)) return "-";
    return new Intl.NumberFormat("id-ID", { maximumSignificantDigits: 6 }).format(nilai);
  }
  function normalisasiSatuan(teks) {
    return teks.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function konversiKeSatuanDasar(jumlah, satuan) {
    const tertulis = (satuan ?? "").trim();
    const kunci = normalisasiSatuan(tertulis);
    if (!Number.isFinite(jumlah)) {
      return { ok: false, satuanTertulis: tertulis, alasan: "Jumlah bukan angka yang sah.", contohSatuan: CONTOH_SATUAN_DITERIMA };
    }
    if (jumlah < 0) {
      return { ok: false, satuanTertulis: tertulis, alasan: "Jumlah tidak boleh negatif.", contohSatuan: CONTOH_SATUAN_DITERIMA };
    }
    if (!kunci) {
      return { ok: false, satuanTertulis: tertulis, alasan: "Satuan kosong — wajib diisi.", contohSatuan: CONTOH_SATUAN_DITERIMA };
    }
    if (Object.hasOwn(SATUAN_AMBIGU, kunci)) {
      return { ok: false, satuanTertulis: tertulis, alasan: SATUAN_AMBIGU[kunci], contohSatuan: CONTOH_SATUAN_DITERIMA };
    }
    const aturan = PETA_SATUAN.get(kunci) ?? PETA_SATUAN.get(kunci.replace(/\s+/g, "")) ?? (kunci.endsWith("s") ? PETA_SATUAN.get(kunci.slice(0, -1)) : void 0);
    if (!aturan) {
      return {
        ok: false,
        satuanTertulis: tertulis,
        alasan: `Satuan “${tertulis}” tidak dikenal. Jangan ditebak — pilih satuan yang jelas.`,
        contohSatuan: CONTOH_SATUAN_DITERIMA
      };
    }
    const hasil = jumlah * aturan.pengali;
    return {
      ok: true,
      jumlah: hasil,
      satuan: aturan.satuan,
      pengali: aturan.pengali,
      satuanTertulis: tertulis,
      langkah: `${angkaLangkah(jumlah)} ${tertulis} × ${angkaLangkah(aturan.pengali)} = ${angkaLangkah(hasil)} ${aturan.satuan}`,
      asumsi: aturan.asumsi,
      alternatif: aturan.alternatif ? { jumlah: jumlah * aturan.alternatif.pengali, satuan: aturan.alternatif.satuan, asumsi: aturan.alternatif.asumsi } : void 0
    };
  }
  var JEMBATAN_CAIRAN_UMUM = {
    kgPerLiter: 1,
    sumber: "⚠︎ Asumsi umum kami: densitas 1,00 kg/L. Tidak berlaku untuk sirup pekat, minyak, atau bahan kering.",
    asumsi: true
  };
  var JEMBATAN_SATUAN = {
    "susu-sapi": { kgPerLiter: 1.03, sumber: "Catatan riset: susu ≈1,03 kg/L", asumsi: false },
    "susu-uht": { kgPerLiter: 1.03, sumber: "Catatan riset: susu ≈1,03 kg/L", asumsi: false },
    "minyak-goreng-sawit": { kgPerLiter: 0.91, sumber: "Catatan riset: 1 L minyak ≈ 0,91 kg", asumsi: false },
    "air-pdam": { kgPerLiter: 1, sumber: "Densitas air ±1,00 kg/L pada suhu ruang", asumsi: false },
    telur: { kgPerBuah: 0.06, sumber: "Catatan riset: 1 butir telur ayam ras ukuran M ≈ 60 g", asumsi: false },
    // Kemasan: massa per item sudah dinyatakan pada rincianTurunan masing-masing,
    // jadi merchant yang menimbang kemasan per kg tetap bisa dihitung.
    "gelas-kertas-8oz": { kgPerBuah: 54e-4, sumber: "Spesifikasi pemasok: 5,4 g/gelas", asumsi: false },
    "gelas-kertas-12oz": { kgPerBuah: 67e-4, sumber: "Spesifikasi pemasok: 6,7 g/gelas", asumsi: false },
    "gelas-plastik-pp-16oz": { kgPerBuah: 7e-3, sumber: "Spesifikasi pemasok: 7 g/gelas", asumsi: false },
    "gelas-plastik-pp-22oz": { kgPerBuah: 9e-3, sumber: "Spesifikasi pemasok: 9 g/gelas", asumsi: false },
    "tutup-plastik": { kgPerBuah: 15e-4, sumber: "Spesifikasi pemasok: 1,5 g/tutup", asumsi: false },
    "segel-plastik-cup": { kgPerBuah: 25e-5, sumber: "⚠︎ Hitungan geometris kami: 0,25 g/segel", asumsi: true },
    "sedotan-plastik": { kgPerBuah: 42e-5, sumber: "HSU Straw Analysis: 0,42 g/sedotan", asumsi: false },
    "sedotan-kertas": { kgPerBuah: 25e-4, sumber: "Rentang industri 2–3 g, dipakai 2,5 g/sedotan", asumsi: false },
    "kantong-plastik-kresek": { kgPerBuah: 0.0111, sumber: "Spesifikasi pemasok: 11,1 g/lembar (uk. 28)", asumsi: false },
    "tisu-makan": { kgPerBuah: 65e-5, sumber: "⚠︎ Asumsi kami: lembar 20×20 cm, 16 g/m² → 0,65 g", asumsi: true },
    "kertas-struk-termal": { kgPerBuah: 66e-5, sumber: "⚠︎ Asumsi kami: 8 cm × 15 cm, 55 g/m² → 0,66 g", asumsi: true }
  };
  var OPSI_MASSA_KARDUS = [
    { label: "Kotak takeaway kecil (±40 g)", kg: 0.04 },
    { label: "Carrier 4 gelas (±60 g)", kg: 0.06 },
    { label: "Kardus pengiriman sedang (±500 g)", kg: 0.5 }
  ];
  var OPSI_MASSA_TABUNG_LPG = [
    { label: "Tabung melon 3 kg", kg: 3 },
    { label: "Tabung 12 kg", kg: 12 }
  ];
  function jembatanFaktor(id) {
    return Object.hasOwn(JEMBATAN_SATUAN, id) ? JEMBATAN_SATUAN[id] : void 0;
  }
  function jembataniKeSatuanFaktor(jumlah, satuanAsal, faktor) {
    const tujuan = faktor.satuanDasar;
    if (satuanAsal === tujuan) return { ok: true, jumlah, langkah: [], asumsi: false };
    const jembatan = jembatanFaktor(faktor.id);
    if (satuanAsal === "kg" && tujuan === "liter" || satuanAsal === "liter" && tujuan === "kg") {
      const dipakai = jembatan?.kgPerLiter !== void 0 ? jembatan : JEMBATAN_CAIRAN_UMUM;
      const kgPerLiter = dipakai.kgPerLiter ?? 1;
      const hasil = satuanAsal === "liter" ? jumlah * kgPerLiter : jumlah / kgPerLiter;
      return {
        ok: true,
        jumlah: hasil,
        asumsi: dipakai.asumsi,
        langkah: [
          satuanAsal === "liter" ? `${angkaLangkah(jumlah)} liter × ${angkaLangkah(kgPerLiter)} kg/L = ${angkaLangkah(hasil)} kg — ${dipakai.sumber}` : `${angkaLangkah(jumlah)} kg ÷ ${angkaLangkah(kgPerLiter)} kg/L = ${angkaLangkah(hasil)} liter — ${dipakai.sumber}`
        ]
      };
    }
    if (jembatan?.kgPerBuah !== void 0) {
      const kgPerBuah = jembatan.kgPerBuah;
      if (satuanAsal === "buah" && tujuan === "kg") {
        const hasil = jumlah * kgPerBuah;
        return {
          ok: true,
          jumlah: hasil,
          asumsi: jembatan.asumsi,
          langkah: [`${angkaLangkah(jumlah)} buah × ${angkaLangkah(kgPerBuah)} kg/buah = ${angkaLangkah(hasil)} kg — ${jembatan.sumber}`]
        };
      }
      if (satuanAsal === "kg" && tujuan === "buah") {
        const hasil = jumlah / kgPerBuah;
        return {
          ok: true,
          jumlah: hasil,
          asumsi: jembatan.asumsi,
          langkah: [`${angkaLangkah(jumlah)} kg ÷ ${angkaLangkah(kgPerBuah)} kg/buah = ${angkaLangkah(hasil)} buah — ${jembatan.sumber}`]
        };
      }
    }
    if (faktor.id === "kardus" && satuanAsal === "buah") {
      return {
        ok: false,
        alasan: "Kardus dihitung per kilogram; satu “buah” kardus tidak punya massa baku.",
        saran: `Tulis beratnya, atau pilih: ${OPSI_MASSA_KARDUS.map((o) => o.label).join(" · ")}`
      };
    }
    if (faktor.id === "lpg" && satuanAsal === "buah") {
      return {
        ok: false,
        alasan: "LPG dihitung per kilogram; jumlah tabung harus dinyatakan beratnya.",
        saran: `Pilih: ${OPSI_MASSA_TABUNG_LPG.map((o) => o.label).join(" · ")}`
      };
    }
    return {
      ok: false,
      alasan: `Tidak ada konversi bersumber dari “${satuanAsal}” ke satuan dasar faktor “${tujuan}” untuk ${faktor.nama}.`,
      saran: `Tulis jumlahnya dalam ${tujuan === "buah" ? "jumlah buah" : tujuan}.`
    };
  }
  function medianFaktorBahan() {
    const nilai = FAKTOR_EMISI.filter((f) => f.kategori === "bahan").map((f) => f.kgCO2ePerSatuan).sort((a, b) => a - b);
    const tengah = Math.floor(nilai.length / 2);
    const m = nilai.length % 2 === 1 ? nilai[tengah] : (nilai[tengah - 1] + nilai[tengah]) / 2;
    return Math.round(m * 1e3) / 1e3;
  }
  var JUMLAH_FAKTOR_BAHAN = FAKTOR_EMISI.filter((f) => f.kategori === "bahan").length;
  var NILAI_MEDIAN_BAHAN = medianFaktorBahan();
  var FAKTOR_TIDAK_DIKENAL = {
    id: "tidak-dikenal-proksi",
    nama: "Bahan tidak dikenal (proksi median)",
    sinonim: [],
    satuanDasar: "kg",
    kategori: "bahan",
    kgCO2ePerSatuan: NILAI_MEDIAN_BAHAN,
    tier: "T4",
    sumber: `⚠︎ PROKSI INTERNAL GLYIV — median dari ${JUMLAH_FAKTOR_BAHAN} faktor bahan pangan di pustaka ini. BUKAN sumber bernama.`,
    catatan: `⚠︎ Bahan ini tidak cocok dengan satu pun baris pustaka, sehingga dihitung dengan proksi median ${NILAI_MEDIAN_BAHAN} kg CO₂e/kg. Ini BUKAN faktor emisi bahan tersebut — ia penanda “kami belum tahu”, dipasang supaya total tidak mengecil hanya karena ada bahan yang tidak dikenali. Tier T4, rentang ±60%. Jalur yang benar: (a) cocokkan manual ke bahan yang ada, atau (b) tarik faktor EXIOBASE 3.8.2 Indonesia untuk jalur berbasis nilai belanja — nilai numeriknya belum diverifikasi dan TIDAK BOLEH ditebak.`,
    rincianTurunan: {
      ringkasAritmetika: `median(${JUMLAH_FAKTOR_BAHAN} faktor kategori bahan) = ${NILAI_MEDIAN_BAHAN} kg CO₂e/kg`,
      asumsiMassa: "⚠︎ Seluruh nilai ini adalah penanda ketidaktahuan, bukan estimasi bahan yang bersangkutan."
    }
  };
  var FAKTOR_EEIO_EXIOBASE_KG_PER_EUR = null;
  function hitungFallbackBelanja(nilaiRupiah, kursIdrPerEur) {
    const rumus = "kg CO₂e = nilai belanja (IDR) ÷ kurs (IDR/EUR) × faktor EXIOBASE 3 Indonesia (kg CO₂e/EUR, harga dasar), dideflasi ke tahun dasar EXIOBASE";
    if (FAKTOR_EEIO_EXIOBASE_KG_PER_EUR === null || !kursIdrPerEur) {
      return {
        tersedia: false,
        kgCO2e: null,
        tier: "T4",
        alasan: "⚠︎ Faktor EXIOBASE 3.8.2 untuk Indonesia belum ditarik dan diverifikasi dari rilis resmi (Zenodo), dan kurs dasarnya belum dinyatakan. Angka spend-based TIDAK dihitung dari ingatan.",
        rumus
      };
    }
    const kg = nilaiRupiah / kursIdrPerEur * FAKTOR_EEIO_EXIOBASE_KG_PER_EUR;
    return { tersedia: true, kgCO2e: kg, tier: "T4", alasan: "Fallback berbasis nilai belanja, otomatis T4 (±60%).", rumus };
  }
  var AMBANG_MINIMUM = 0.55;
  var AMBANG_YAKIN = 0.7;
  var AMBANG_AMBIGU = 0.06;
  var AMBANG_AMBIGU_NILAI_BEDA = 0.15;
  var RASIO_NILAI_MATERIAL = 2;
  var SINONIM_BERISIKO = /* @__PURE__ */ new Set([
    "rendang",
    "daging",
    "saus tomat",
    "salmon",
    "dori"
  ]);
  function normalisasiNama(teks) {
    let t = (teks ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/(\d)([a-z])/g, "$1 $2").replace(/([a-z])(\d)/g, "$1 $2").replace(/\s+/g, " ").trim();
    t = t.replace(/oe/g, "u").replace(/dj/g, "j").replace(/tj/g, "c").replace(/nj/g, "ny").replace(/sj/g, "sy");
    t = t.replace(/cokelat/g, "coklat").replace(/telor/g, "telur").replace(/santen/g, "santan");
    t = t.replace(/([a-z])\1+/g, "$1");
    return t.replace(/\s+/g, " ").trim();
  }
  function jarakTerbatas(a, b, maks) {
    if (Math.abs(a.length - b.length) > maks) return maks + 1;
    let baris = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const barisBaru = [i];
      let minBaris = i;
      for (let j = 1; j <= b.length; j++) {
        const biaya = a[i - 1] === b[j - 1] ? 0 : 1;
        const nilai = Math.min(barisBaru[j - 1] + 1, baris[j] + 1, baris[j - 1] + biaya);
        barisBaru.push(nilai);
        if (nilai < minBaris) minBaris = nilai;
      }
      if (minBaris > maks) return maks + 1;
      baris = barisBaru;
    }
    return baris[b.length];
  }
  function bobotToken(a, b) {
    if (a === b) return 1;
    const min = Math.min(a.length, b.length);
    if (min >= 4 && (a.startsWith(b) || b.startsWith(a))) return 0.75;
    if (min >= 4 && jarakTerbatas(a, b, 1) <= 1) return 0.7;
    if (min >= 8 && jarakTerbatas(a, b, 2) <= 2) return 0.55;
    return 0;
  }
  function adaSubrangkaian(induk, anak) {
    if (anak.length === 0 || anak.length > induk.length) return false;
    for (let i = 0; i + anak.length <= induk.length; i++) {
      let cocok = true;
      for (let j = 0; j < anak.length; j++) {
        if (induk[i + j] !== anak[j]) {
          cocok = false;
          break;
        }
      }
      if (cocok) return true;
    }
    return false;
  }
  var INDEKS_VARIAN = FAKTOR_EMISI.flatMap(
    (f) => [f.nama, ...f.sinonim].map((teks, i) => {
      const norm = normalisasiNama(teks);
      return { id: f.id, teks, token: norm ? norm.split(" ") : [], rapat: norm.replace(/ /g, ""), dariNama: i === 0 };
    })
  ).filter((v) => v.token.length > 0);
  var FREKUENSI_TOKEN = (() => {
    const perToken = /* @__PURE__ */ new Map();
    for (const v of INDEKS_VARIAN) {
      for (const t of v.token) {
        let himpunan = perToken.get(t);
        if (!himpunan) {
          himpunan = /* @__PURE__ */ new Set();
          perToken.set(t, himpunan);
        }
        himpunan.add(v.id);
      }
    }
    const hasil = /* @__PURE__ */ new Map();
    for (const [t, himpunan] of perToken) hasil.set(t, himpunan.size);
    return hasil;
  })();
  function bobotKekhasan(token) {
    const df = FREKUENSI_TOKEN.get(token) ?? 1;
    return 1 / (1 + Math.log(1 + df));
  }
  function skorVarian(qToken, qRapat, v) {
    if (qRapat === v.rapat) return 1;
    let cocok = 0;
    const dipakai = /* @__PURE__ */ new Set();
    for (const qt of qToken) {
      let terbaik = 0;
      let idx = -1;
      for (let i = 0; i < v.token.length; i++) {
        if (dipakai.has(i)) continue;
        const w = bobotToken(qt, v.token[i]);
        if (w > terbaik) {
          terbaik = w;
          idx = i;
        }
      }
      if (idx >= 0 && terbaik > 0) {
        dipakai.add(idx);
        cocok += terbaik * bobotKekhasan(qt);
      }
    }
    const bobotQ = qToken.reduce((s, t) => s + bobotKekhasan(t), 0);
    const bobotV = v.token.reduce((s, t) => s + bobotKekhasan(t), 0);
    let skor = 2 * cocok / (bobotQ + bobotV);
    if (adaSubrangkaian(qToken, v.token)) {
      const cakupan = Math.min(1, bobotV / Math.max(1e-9, bobotQ));
      skor = Math.max(skor, 0.6 + 0.35 * cakupan);
    }
    if (adaSubrangkaian(v.token, qToken)) {
      const cakupan = Math.min(1, bobotQ / Math.max(1e-9, bobotV));
      skor = Math.max(skor, 0.5 + 0.3 * cakupan);
    }
    return Math.min(skor, 0.95);
  }
  function cariFaktor(namaBahan, batas = 5) {
    const norm = normalisasiNama(namaBahan);
    if (!norm) return [];
    const qToken = norm.split(" ");
    const qRapat = norm.replace(/ /g, "");
    const terbaikPerFaktor = /* @__PURE__ */ new Map();
    for (const v of INDEKS_VARIAN) {
      const s = skorVarian(qToken, qRapat, v);
      if (s <= 0) continue;
      const kini = terbaikPerFaktor.get(v.id);
      if (!kini || s > kini.skor) terbaikPerFaktor.set(v.id, { skor: s, lewat: v.teks });
    }
    const urut = [...terbaikPerFaktor.entries()].map(([id, nilai]) => ({ id, ...nilai })).filter((k) => k.skor >= AMBANG_MINIMUM).sort((a, b) => b.skor - a.skor).slice(0, Math.max(1, batas));
    return urut.map((k, i) => {
      const faktor = PETA_FAKTOR.get(k.id);
      const pesaing = i === 0 ? urut[1] : urut[0];
      const faktorPesaing = pesaing ? PETA_FAKTOR.get(pesaing.id) : void 0;
      let ambigu = false;
      if (pesaing && faktorPesaing) {
        const selisihSkor = Math.abs(pesaing.skor - k.skor);
        const a = faktor.kgCO2ePerSatuan;
        const b = faktorPesaing.kgCO2ePerSatuan;
        const nilaiBerbeda = Math.abs(a - b) > 1e-9;
        const rasio = Math.min(a, b) > 0 ? Math.max(a, b) / Math.min(a, b) : Infinity;
        const jendela = rasio >= RASIO_NILAI_MATERIAL ? AMBANG_AMBIGU_NILAI_BEDA : AMBANG_AMBIGU;
        ambigu = nilaiBerbeda && selisihSkor <= jendela;
      }
      const lewatBerisiko = SINONIM_BERISIKO.has(normalisasiNama(k.lewat));
      const perluKonfirmasi = k.skor < AMBANG_YAKIN || ambigu || lewatBerisiko;
      const alasan = lewatBerisiko && !ambigu ? `Cocok lewat “${k.lewat}” → “${faktor.nama}”, tetapi sinonim itu berisiko salah arah — wajib dikonfirmasi merchant sebelum angkanya dipakai.` : k.skor >= 1 ? `Sama persis dengan “${k.lewat}”.` : ambigu ? `Cocok lewat “${k.lewat}” (skor ${k.skor.toFixed(2)}), tetapi “${faktorPesaing?.nama}” sama kuatnya dengan nilai berbeda — wajib dikonfirmasi.` : `Cocok lewat “${k.lewat}” (skor ${k.skor.toFixed(2)}).`;
      return { faktor, skor: Math.round(k.skor * 100) / 100, cocokLewat: k.lewat, perluKonfirmasi, alasan };
    });
  }
  return __toCommonJS(emissionFactors_exports);
})();
