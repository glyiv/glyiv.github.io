/* GLYIV CIP demo data — per-industry emission factors (sourced). Auto-generated. */
window.CIP_DATA = {
 "tambang-logam": {
  "name": "Tambang & Logam",
  "inputs": [
   {
    "label": "Solar alat berat tambang (excavator, haul truck)",
    "unit": "liter",
    "qty": 500000,
    "ef": 2.51,
    "src": "DEFRA/DESNZ 2024 GHG Conversion Factors — Diesel (average biofuel blend), 2.51279 kgCO2e/liter",
    "url": "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
    "scope": "1"
   },
   {
    "label": "Baja mentah (crude steel) diproduksi",
    "unit": "ton",
    "qty": 5000,
    "ef": 1920,
    "src": "worldsteel Sustainability Indicators 2024 — rata-rata global 2023 = 1,92 tCO2/ton baja (rute BF-BOF 2,32; DRI-EAF 1,43; scrap-EAF 0,70)",
    "url": "https://worldsteel.org/wp-content/uploads/Sustainability-Indicators-report-2024.pdf",
    "scope": "1"
   },
   {
    "label": "Aluminium primer (smelting)",
    "unit": "ton",
    "qty": 500,
    "ef": 14800,
    "src": "International Aluminium Institute — intensitas GRK aluminium primer 2023 = 14,8 tCO2e/ton (rentang cradle-to-gate 4,5–22 t)",
    "url": "https://international-aluminium.org/statistics/greenhouse-gas-emissions-primary-aluminium/",
    "scope": "1"
   }
  ],
  "agent": "Aluminium primer menyumbang porsi jejak terbesar per ton meski volumenya kecil — hampir seluruhnya berasal dari listrik smelter. Beralih ke pasokan berbasis PLTA (mis. model Inalum) berpotensi menurunkan EF dari ~14,8 ke <4 tCO2e/ton. Untuk nikel Indonesia (NPI/RKEF & HPAL dengan PLTU captive), intensitas jauh lebih tinggi lagi ⚠︎ (perlu EF spesifik smelter, bukan angka global) — dekarbonisasi listrik captive adalah lever terbesar sebelum offset.",
  "offset": "Pada default ini jejak didominasi baja (~9.600 tCO2e) + aluminium (~7.400 tCO2e) ≈ 18.250 tCO2e/tahun. Setara ~830.000 pohon/tahun (asumsi ~22 kgCO2e/pohon/tahun ⚠︎ perlu diverifikasi per spesies & iklim). Postur: prioritaskan reduksi (scrap-EAF menurunkan baja ke ~0,7 t/ton) sebelum kompensasi — offset menutup sisa (kontribusi), bukan mengklaim netral."
 },
 "konstruksi-semen": {
  "name": "Konstruksi & Semen",
  "inputs": [
   {
    "label": "Semen Portland terpakai",
    "unit": "ton",
    "qty": 2000,
    "ef": 590,
    "src": "GCCA GNR / IEA — intensitas rata-rata global semen 2022 ≈ 0,58–0,59 tCO2/ton semen (OPC/CEM I lebih tinggi ~0,8–0,9 ⚠︎)",
    "url": "https://www.iea.org/energy-system/industry/cement",
    "scope": "3"
   },
   {
    "label": "Beton ready-mix (C30/37)",
    "unit": "m3",
    "qty": 3000,
    "ef": 290,
    "src": "ICE Database (Circular Ecology) / EPD ready-mix — ~250–300 kgCO2e/m³ tergantung kelas & kadar semen ⚠︎ verifikasi mix design",
    "url": "https://circularecology.com/embodied-carbon-footprint-database.html",
    "scope": "3"
   },
   {
    "label": "Baja tulangan (rebar)",
    "unit": "ton",
    "qty": 300,
    "ef": 1850,
    "src": "worldsteel Sustainability Indicators 2024 — rata-rata global 2023 ≈ 1,92 tCO2/ton (rebar EAF-scrap dapat ~0,7 t)",
    "url": "https://worldsteel.org/wp-content/uploads/Sustainability-Indicators-report-2024.pdf",
    "scope": "3"
   }
  ],
  "agent": "Semen adalah hotspot: ~60% emisinya proses kalsinasi (CO2 dari batu kapur), bukan bahan bakar, jadi tak hilang hanya dengan efisiensi energi. Substitusi klinker dengan fly ash/slag (blended cement CEM II/III) memangkas EF ~590 → ~400 kgCO2e/ton (turun ~30%). Rekomendasi konkret: spesifikasikan beton berbasis SCM di RKS/BoQ dan minta EPD per batching plant — ini reduksi terbesar tanpa mengorbankan mutu.",
  "offset": "Default ini ≈ 2.600 tCO2e (semen 1.180 + beton 870 + baja 555). Setara ~118.000 pohon/tahun (~22 kgCO2e/pohon/tahun ⚠︎). Reduksi via SCM & baja scrap-EAF dulu; offset (mis. reforestasi mangrove) menutup sisa sebagai kontribusi, bukan klaim carbon-neutral."
 },
 "manufaktur": {
  "name": "Manufaktur",
  "inputs": [
   {
    "label": "Listrik jaringan (PLN)",
    "unit": "kWh",
    "qty": 2000000,
    "ef": 0.68,
    "src": "IEA Emissions Factors 2024 — intensitas pembangkitan listrik Indonesia 2023 ≈ 0,68 kgCO2e/kWh (grid nasional resmi KLHK dapat berbeda ~0,79–0,87 ⚠︎ verifikasi sistem/tahun)",
    "url": "https://www.iea.org/data-and-statistics/data-product/emissions-factors-2024",
    "scope": "2"
   },
   {
    "label": "Gas alam (proses/boiler)",
    "unit": "m3",
    "qty": 100000,
    "ef": 2.02,
    "src": "DEFRA/DESNZ 2024 — Natural gas ≈ 2,02 kgCO2e/m³ (net CV)",
    "url": "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
    "scope": "1"
   },
   {
    "label": "Solar (diesel) genset/forklift",
    "unit": "liter",
    "qty": 20000,
    "ef": 2.51,
    "src": "DEFRA/DESNZ 2024 — Diesel (average biofuel blend), 2,51 kgCO2e/liter",
    "url": "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
    "scope": "1"
   }
  ],
  "agent": "Karena grid Indonesia masih coal-heavy (~0,68 kgCO2e/kWh, salah satu tertinggi di ASEAN), listrik mendominasi jejak manufaktur — sekitar 84% pada default ini. Lever tercepat: PPA renewable atau REC bundled + PLTS atap untuk beban siang. Sebelum itu, sub-metering per lini produksi biasanya menemukan 10–15% pemborosan idle (kompresor & HVAC). EF grid WAJIB diperbarui tiap tahun mengikuti bauran PLN.",
  "offset": "Default ≈ 1.610 tCO2e/tahun (listrik 1.360 + gas 202 + diesel 50). Setara ~73.000 pohon/tahun (~22 kgCO2e/pohon/tahun ⚠︎). Dekarbonisasi listrik dulu (PPA/PLTS) — offset hanya menutup residual Scope 1 yang sulit dihindari."
 },
 "sawit-agribisnis": {
  "name": "Sawit & Agribisnis",
  "inputs": [
   {
    "label": "Minyak sawit mentah (CPO) — tanpa biogas capture (POME)",
    "unit": "ton",
    "qty": 10000,
    "ef": 880,
    "src": "Review LCA industri sawit (IIETA/IJSDP 2023) — pabrik tanpa tangkap metana POME ≈ 637–1.131 kgCO2e/ton CPO (metana POME dominan) ⚠︎",
    "url": "https://www.iieta.org/journals/ijsdp/paper/10.18280/ijsdp.180213",
    "scope": "1"
   },
   {
    "label": "Pupuk nitrogen (kandungan N diaplikasikan)",
    "unit": "kg N",
    "qty": 200000,
    "ef": 4.3,
    "src": "IPCC 2006 GL Vol.4 Ch.11 — N2O langsung EF1=0,01 kg N2O-N/kg N × 44/28 × GWP100 N2O (AR6 = 273) ≈ 4,3 kgCO2e/kg N (belum termasuk emisi produksi pupuk & N2O tak-langsung)",
    "url": "https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html",
    "scope": "1"
   },
   {
    "label": "Perubahan guna lahan / drainase gambut (jika ada)",
    "unit": "ton",
    "qty": 0,
    "ef": 7000,
    "src": "LCA sawit Asia Tenggara — net CPO dengan LUC (deforestasi + degradasi gambut) dapat mencapai ~8.000 kgCO2e/ton CPO ⚠︎ SANGAT bervariasi, hanya jika kebun di lahan gambut/hutan; nol jika lahan legacy",
    "url": "https://www.oaepublish.com/articles/cf.2025.90",
    "scope": "1"
   }
  ],
  "agent": "Metana dari POME adalah hotspot yang paling murah ditekan: instalasi biogas capture (methane capture + flare/genset) dapat memangkas ~60–70% emisi pabrik dan sekaligus menghasilkan listrik. Namun jika kebun berada di lahan gambut, emisi drainase gambut mengerdilkan semua faktor lain — angka LUC harus diverifikasi per estate (⚠︎ jangan pakai default), bukan diratakan. Rekomendasi: pisahkan pelaporan 'CPO tanpa LUC' vs 'dengan LUC' agar klaim tetap jujur dan bankable untuk RSPO/ISPO.",
  "offset": "Tanpa LUC, default ≈ 9.660 tCO2e/tahun (CPO 8.800 + pupuk 860) ≈ ~439.000 pohon/tahun (~22 kgCO2e/pohon/tahun ⚠︎). Jika ada gambut, LUC bisa >70.000 tCO2e dan tak realistis dioffset — di sini reduksi (biogas + hentikan buka gambut) mutlak lebih dulu; offset hanya untuk residual."
 },
 "logistik-transport": {
  "name": "Logistik & Transport",
  "inputs": [
   {
    "label": "Solar armada truk (bahan bakar langsung)",
    "unit": "liter",
    "qty": 300000,
    "ef": 2.51,
    "src": "DEFRA/DESNZ 2024 — Diesel (average biofuel blend), 2,51 kgCO2e/liter",
    "url": "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
    "scope": "1"
   },
   {
    "label": "Angkutan barang jalan (HGV rigid, muatan rata-rata)",
    "unit": "ton.km",
    "qty": 5000000,
    "ef": 0.19,
    "src": "DEFRA/DESNZ 2024 Freighting Goods — HGV all rigids, average laden ≈ 0,19 kgCO2e/ton.km ⚠︎ (artikulasi jauh lebih rendah ~0,08)",
    "url": "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
    "scope": "3"
   },
   {
    "label": "Angkutan laut peti kemas",
    "unit": "ton.km",
    "qty": 20000000,
    "ef": 0.016,
    "src": "DEFRA/DESNZ 2024 Freighting Goods — container ship ≈ 0,016 kgCO2e/ton.km",
    "url": "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
    "scope": "3"
   }
  ],
  "agent": "Modal shift adalah lever terbesar: angkutan laut (~0,016) sekitar 12× lebih rendah per ton.km dibanding truk rigid (~0,19). Untuk armada sendiri, kombinasi optimasi rute + peningkatan faktor muat (menghindari backhaul kosong) biasanya memangkas 10–20% liter/ton terkirim tanpa capex besar. Prioritaskan pengukuran ton.km aktual per shipment (bukan estimasi jarak lurus) agar klaim Scope 3 'terlacak', bukan sekadar 'terukur' asumsi.",
  "offset": "Default ≈ 2.020 tCO2e/tahun (truk-BBM 753 + jalan 950 + laut 320) ≈ ~92.000 pohon/tahun (~22 kgCO2e/pohon/tahun ⚠︎). Reduksi via modal shift & load factor dulu; offset menutup residual mil-terakhir yang belum bisa dielektrifikasi."
 },
 "data-center": {
  "name": "Data Center",
  "inputs": [
   {
    "label": "Listrik total (IT + pendingin)",
    "unit": "kWh",
    "qty": 5000000,
    "ef": 0.68,
    "src": "IEA Emissions Factors 2024 — grid Indonesia 2023 ≈ 0,68 kgCO2e/kWh (grid nasional resmi KLHK dapat ~0,79–0,87 ⚠︎ verifikasi sistem/tahun)",
    "url": "https://www.iea.org/data-and-statistics/data-product/emissions-factors-2024",
    "scope": "2"
   },
   {
    "label": "Solar genset cadangan (uji + outage)",
    "unit": "liter",
    "qty": 30000,
    "ef": 2.51,
    "src": "DEFRA/DESNZ 2024 — Diesel (average biofuel blend), 2,51 kgCO2e/liter",
    "url": "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
    "scope": "1"
   },
   {
    "label": "Kebocoran refrigeran pendingin (R-410A)",
    "unit": "kg",
    "qty": 50,
    "ef": 2088,
    "src": "IPCC AR5 GWP100 — R-410A = 2.088 kgCO2e/kg (R-134a=1.430; verifikasi jenis refrigeran unit CRAC ⚠︎)",
    "url": "https://www.ipcc.ch/report/ar5/wg1/",
    "scope": "1"
   }
  ],
  "agent": "Listrik mendominasi (~95% pada default) dan besarnya diperkuat PUE serta grid kotor 0,68. Dua lever: (1) turunkan PUE via free/liquid cooling & containment — tiap penurunan 0,1 PUE memangkas ~10% total listrik fasilitas; (2) PPA renewable/REC untuk menekan EF Scope 2. Kebocoran refrigeran kecil dalam volume tetapi berdampak tinggi per kg (GWP >2.000) — deteksi bocor rutin murah dan efektif. Laporkan angka berbasis kWh terukur meter, bukan nameplate.",
  "offset": "Default ≈ 3.580 tCO2e/tahun (listrik 3.400 + genset 75 + refrigeran 104) ≈ ~163.000 pohon/tahun (~22 kgCO2e/pohon/tahun ⚠︎). Dekarbonisasi listrik (PPA renewable + PUE) adalah reduksi utama; offset hanya menutup residual Scope 1 (BBM genset & refrigeran) sebagai kontribusi, bukan klaim netral."
 },
 "bank-lembaga-keuangan": {
  "name": "Bank & Lembaga Keuangan",
  "inputs": [
   {
    "label": "Portofolio pinjaman korporat tersalurkan (financed emissions) ⚠︎",
    "unit": "juta USD",
    "qty": 100,
    "ef": 300000,
    "src": "PCAF Global GHG Accounting Standard (Part A) + rata-rata intensitas emisi ekonomi EXIOBASE 3 (~0,3 kg CO2e/USD) — nilai portofolio-dependent, WAJIB diganti data emiten riil ⚠︎",
    "url": "https://carbonaccountingfinancials.com/en/standard",
    "scope": "3 (Kategori 15 - Investasi/Financed Emissions)"
   },
   {
    "label": "Listrik jaringan kantor cabang & data center",
    "unit": "kWh",
    "qty": 500000,
    "ef": 0.68,
    "src": "IEA Emissions Factors 2024 (grid Indonesia, data 2023 ~0,68 kg CO2e/kWh)",
    "url": "https://www.iea.org/data-and-statistics/data-product/emissions-factors-2024",
    "scope": "2"
   },
   {
    "label": "Perjalanan bisnis penerbangan domestik",
    "unit": "penumpang-km",
    "qty": 200000,
    "ef": 0.2443,
    "src": "DEFRA/DESNZ 2023 GHG Conversion Factors (domestic flight, incl. radiative forcing)",
    "url": "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting",
    "scope": "3"
   }
  ],
  "agent": "Emisi terbiayai (financed emissions) portofolio pinjaman menyumbang >98% dari total jejak bank — lebih dari 600x gabungan emisi listrik & perjalanan operasional. Fokuskan target SBTi & dekarbonisasi pada sektor high-carbon (batu bara, sawit, semen) di buku kredit; program 'kantor hijau' hanya menyentuh <1% jejak dan tidak boleh dijadikan klaim utama.",
  "offset": "Dengan angka default (~30.389 tCO2e/tahun, didominasi financed emissions), offset penuh setara ~1,38 juta pohon/tahun (asumsi ~22 kg CO2e/pohon/tahun ⚠︎). Ini menegaskan offset tidak realistis untuk emisi terbiayai — postur jujur: prioritaskan pengurangan di portofolio, bukan klaim 'netral karbon'. Sebut 'kontribusi', bukan 'netral'."
 },
 "investor-aset-manajemen": {
  "name": "Investor & Aset Manajemen",
  "inputs": [
   {
    "label": "Portofolio ekuitas terdaftar (AUM) ⚠︎",
    "unit": "juta USD",
    "qty": 200,
    "ef": 150000,
    "src": "PCAF (Listed Equity, weighted-average carbon intensity) + EXIOBASE 3 (~0,15 kg CO2e/USD diinvestasikan) — portofolio-dependent, ganti dengan intensitas emiten riil ⚠︎",
    "url": "https://carbonaccountingfinancials.com/en/standard",
    "scope": "3 (Kategori 15 - Investasi)"
   },
   {
    "label": "Portofolio obligasi/kredit korporat ⚠︎",
    "unit": "juta USD",
    "qty": 100,
    "ef": 120000,
    "src": "PCAF (Corporate Bonds) + EXIOBASE 3 (~0,12 kg CO2e/USD) — portofolio-dependent ⚠︎",
    "url": "https://carbonaccountingfinancials.com/en/standard",
    "scope": "3 (Kategori 15 - Investasi)"
   },
   {
    "label": "Listrik kantor manajer investasi",
    "unit": "kWh",
    "qty": 120000,
    "ef": 0.68,
    "src": "IEA Emissions Factors 2024 (grid Indonesia, data 2023)",
    "url": "https://www.iea.org/data-and-statistics/data-product/emissions-factors-2024",
    "scope": "2"
   }
  ],
  "agent": "Weighted-average carbon intensity (WACI) portofolio investasi mendominasi >99% jejak — operasional kantor nyaris tak relevan. Merotasi ~10% AUM dari sektor fosil ke green/sustainability bonds dapat memangkas jejak terbiayai ~15-30% tanpa mengubah profil risiko-return secara material. Laporkan per PCAF & TCFD/ISSB, dan lacak per-emiten (data quality score) alih-alih rata-rata sektor.",
  "offset": "Angka default (~42.082 tCO2e/tahun) setara ~1,91 juta pohon/tahun (~22 kg CO2e/pohon/tahun ⚠︎). Offset bukan solusi untuk emisi terbiayai; posisikan sebagai 'transisi portofolio terlacak' dengan lintasan pengurangan, bukan klaim netralitas. Offset hanya untuk sisa jejak operasional (~82 tCO2e ≈ 3.700 pohon)."
 },
 "fnb-ritel": {
  "name": "F&B & Ritel",
  "inputs": [
   {
    "label": "Kopi (biji/roasted) sebagai bahan baku",
    "unit": "kg",
    "qty": 2000,
    "ef": 28.53,
    "src": "Poore & Nemecek 2018 (Science) via Our World in Data — coffee, rata-rata global LCA cradle-to-retail",
    "url": "https://ourworldindata.org/grapher/ghg-per-kg-poore",
    "scope": "3"
   },
   {
    "label": "Daging sapi (beef herd)",
    "unit": "kg",
    "qty": 500,
    "ef": 99.48,
    "src": "Poore & Nemecek 2018 (Science) via Our World in Data — beef (beef herd), rata-rata global ⚠︎ (sourcing lokal dapat berbeda)",
    "url": "https://ourworldindata.org/grapher/ghg-per-kg-poore",
    "scope": "3"
   },
   {
    "label": "Listrik gerai (chiller, mesin kopi, pencahayaan)",
    "unit": "kWh",
    "qty": 40000,
    "ef": 0.68,
    "src": "IEA Emissions Factors 2024 (grid Indonesia, data 2023)",
    "url": "https://www.iea.org/data-and-statistics/data-product/emissions-factors-2024",
    "scope": "2"
   }
  ],
  "agent": "Bahan baku (Scope 3) mengalahkan energi: daging sapi ~99 kg CO2e/kg dan kopi ~28 kg CO2e/kg, sementara listrik hanya 0,68 kg CO2e/kWh. Mengganti 30% porsi sapi dengan ayam (~9,9 kg CO2e/kg) atau nabati memangkas jejak lebih besar daripada seluruh penghematan energi gerai. Prioritas: menu engineering & sourcing kopi bersertifikat, baru efisiensi chiller/LED.",
  "offset": "Total default ~134 tCO2e/tahun setara ~6.090 pohon/tahun (~22 kg CO2e/pohon/tahun ⚠︎). Karena skala UMKM-menengah, sisa emisi realistis di-offset sebagian via program reforestasi lokal terverifikasi — sampaikan sebagai 'kontribusi iklim terlacak', bukan 'kopi netral karbon'."
 },
 "rumah-sakit": {
  "name": "Rumah Sakit",
  "inputs": [
   {
    "label": "Desflurane (botol 240 ml) — gas anestesi",
    "unit": "botol",
    "qty": 300,
    "ef": 886,
    "src": "Sherman/Ryan & BJA Education 2017 (GWP100 IPCC AR5, penguapan 1 botol desflurane ≈ 886 kg CO2e) ⚠︎",
    "url": "https://www.bjaed.org/article/S2058-5349(17)30142-7/fulltext",
    "scope": "1"
   },
   {
    "label": "Listrik rumah sakit (24/7: OK, ICU, HVAC, imaging)",
    "unit": "kWh",
    "qty": 2000000,
    "ef": 0.68,
    "src": "IEA Emissions Factors 2024 (grid Indonesia, data 2023)",
    "url": "https://www.iea.org/data-and-statistics/data-product/emissions-factors-2024",
    "scope": "2"
   },
   {
    "label": "Solar/diesel genset cadangan",
    "unit": "liter",
    "qty": 20000,
    "ef": 2.51,
    "src": "DEFRA/DESNZ 2023 GHG Conversion Factors (diesel, average biofuel blend, kg CO2e/liter)",
    "url": "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting",
    "scope": "1"
   }
  ],
  "agent": "Satu botol desflurane ≈ 886 kg CO2e (setara ~5.200 km mobil bensin) — GWP100 ~2.540, hampir 20x sevoflurane. Beralih ke sevoflurane/anestesi regional untuk kasus rutin dan menutup low-flow dapat memangkas emisi gas anestesi >80-90%. Ini quick-win Scope 1 terbesar dan tercepat sebelum menyentuh listrik; listrik 24/7 tetap kontributor absolut terbesar, arahkan ke PLTS atap + PPA hijau.",
  "offset": "Total default ~1.676 tCO2e/tahun setara ~76.180 pohon/tahun (~22 kg CO2e/pohon/tahun ⚠︎). Offset hanya untuk sisa setelah pengurangan gas anestesi & efisiensi energi — hindari klaim 'rumah sakit netral karbon'; gunakan 'jejak karbon terlacak & lintasan pengurangan' sesuai postur jujur."
 },
 "pemerintah": {
  "name": "Pemerintah",
  "inputs": [
   {
    "label": "BBM armada kendaraan dinas (diesel)",
    "unit": "liter",
    "qty": 50000,
    "ef": 2.51,
    "src": "DEFRA/DESNZ 2023 GHG Conversion Factors (diesel, average biofuel blend)",
    "url": "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting",
    "scope": "1"
   },
   {
    "label": "Listrik gedung perkantoran pemerintah",
    "unit": "kWh",
    "qty": 800000,
    "ef": 0.68,
    "src": "IEA Emissions Factors 2024 (grid Indonesia, data 2023)",
    "url": "https://www.iea.org/data-and-statistics/data-product/emissions-factors-2024",
    "scope": "2"
   },
   {
    "label": "Kertas A4 (rim, ~2,5 kg) ⚠︎",
    "unit": "rim",
    "qty": 2000,
    "ef": 2.5,
    "src": "ecoinvent / DEFRA paper (~1,0 kg CO2e/kg kertas × ~2,5 kg per rim) — perlu verifikasi grade & sumber pulp ⚠︎",
    "url": "",
    "scope": "3"
   }
  ],
  "agent": "Listrik gedung (Scope 2) ~81% jejak — konversi ke PLTS atap plus pengadaan REC/energi terbarukan bisa memangkas hampir seluruhnya dan paling scalable lintas instansi. Armada dinas terbesar kedua (~19%); elektrifikasi bertahap + rasionalisasi perjalanan jauh lebih berdampak daripada kebijakan 'paperless' yang hanya menyentuh <1% jejak. Jadikan pengadaan hijau (green public procurement) pengungkit utama.",
  "offset": "Total default ~674,5 tCO2e/tahun setara ~30.660 pohon/tahun (~22 kg CO2e/pohon/tahun ⚠︎). Untuk instansi, offset diposisikan sebagai pelengkap setelah efisiensi energi & elektrifikasi armada — bukan pengganti target pengurangan. Framing: 'jejak karbon instansi terlacak & dikurangi', bukan klaim netralitas."
 },
 "retailer-toko-umkm": {
  "name": "Retailer (Toko/UMKM)",
  "inputs": [
   {
    "label": "Listrik toko (pendingin, pencahayaan, kasir)",
    "unit": "kWh",
    "qty": 6000,
    "ef": 0.68,
    "src": "IEA Emissions Factors 2024 (grid Indonesia, data 2023)",
    "url": "https://www.iea.org/data-and-statistics/data-product/emissions-factors-2024",
    "scope": "2"
   },
   {
    "label": "LPG untuk memasak/pemanas (tabung)",
    "unit": "kg",
    "qty": 300,
    "ef": 2.94,
    "src": "DEFRA/DESNZ 2023 GHG Conversion Factors (LPG, kg CO2e per kg)",
    "url": "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting",
    "scope": "1"
   },
   {
    "label": "Kantong plastik sekali pakai (HDPE) ⚠︎",
    "unit": "lembar",
    "qty": 20000,
    "ef": 0.033,
    "src": "ecoinvent (produksi film HDPE ~2-3 kg CO2e/kg × ~11 g/kantong, cradle-to-gate) — perlu verifikasi berat & jenis kantong ⚠︎",
    "url": "",
    "scope": "3"
   }
  ],
  "agent": "Listrik (terutama chiller/kulkas & pencahayaan) ~73% jejak toko. Ganti ke lemari pendingin inverter + LED dan matikan chiller kosong bisa memangkas ~20-30% listrik; kurangi kantong plastik sekali pakai (kontributor kecil tapi nilai naratif tinggi ke pelanggan). Skala UMKM membuat efisiensi energi ROI-nya cepat via penghematan tagihan PLN.",
  "offset": "Total default hanya ~5,6 tCO2e/tahun setara ~256 pohon/tahun (~22 kg CO2e/pohon/tahun ⚠︎). Pada skala UMKM ini, offset penuh via program reforestasi lokal terverifikasi realistis dan terjangkau — sampaikan sebagai 'kontribusi iklim toko terlacak', tetap hindari klaim absolut 'netral karbon' tanpa audit."
 }
};
