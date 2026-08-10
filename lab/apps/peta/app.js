/* =============================================================
   GLYIV GREEN ASSET MAPS — /lab/apps/peta/
   Leaflet map of Glyiv-tracked green-asset plots in Indonesia.
   Sample data is deterministic (seeded PRNG, never Math.random)
   so every reload draws the exact same boundaries and curves.
   ============================================================= */
(function (root) {
  "use strict";

  /* ---------------------------------------------------------
     0. tiny helpers
  --------------------------------------------------------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  var fmt = function (n) {
    return (window.GA && GA.fmt) ? GA.fmt(n) : Math.round(n).toLocaleString("id-ID");
  };
  var WARN = "⚠"; /* U+26A0 — marks every estimated / illustrative figure */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  function tanggal(iso) {
    var p = String(iso).split("-");
    return parseInt(p[2], 10) + " " + MONTHS[parseInt(p[1], 10) - 1] + " " + p[0];
  }
  /* deterministic PRNG (mulberry32) + FNV-1a string seed */
  function seedOf(str) {
    var h = 2166136261, i;
    for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------------------------------------------------------
     1. provenance strings (glyiv-sources.js reads these)
  --------------------------------------------------------- */
  var SRC = {
    citra: "Copernicus Sentinel-2 (ESA)|https://sentinels.copernicus.eu/copernicus/sentinel-2 ;; Landsat 9 (USGS/NASA)|https://www.usgs.gov/landsat-missions/landsat-9",
    ndvi: "Copernicus Sentinel-2 (ESA)|https://sentinels.copernicus.eu/copernicus/sentinel-2 ;; Cara NDVI dibaca — NASA Earth Observatory|https://earthobservatory.nasa.gov/features/MeasuringVegetation ;; Nilai NDVI di halaman ini data contoh prototipe|",
    tajuk: "Global Forest Change (Hansen/UMD)|https://glad.earthengine.app/view/global-forest-change ;; Copernicus Sentinel-2 (ESA)|https://sentinels.copernicus.eu/copernicus/sentinel-2 ;; Persentase tajuk di halaman ini data contoh prototipe|",
    pohon: "FAO Global Forest Resources Assessment|https://www.fao.org/forest-resources-assessment/en/ ;; Jumlah pohon adalah estimasi kerapatan tanam, bukan sensus batang|",
    co2: "IPCC 2006 Guidelines Vol.4 (AFOLU)|https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html ;; IPCC 2019 Refinement|https://www.ipcc-nggip.iges.or.jp/public/2019rf/index.html ;; Angka serapan bersifat estimasi dengan rentang ketidakpastian, belum diverifikasi pihak ketiga|",
    luas: "Batas petak digambar dari citra satelit; luas belum dicocokkan dengan dokumen legal lahan|",
    peta: "OpenStreetMap contributors (ODbL)|https://www.openstreetmap.org/copyright ;; Esri World Imagery|https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9"
  };

  /* ---------------------------------------------------------
     2. SAMPLE DATA — 12 illustrative plots.
        Coordinates are real locations inside the province named;
        every figure is illustrative prototype data.
  --------------------------------------------------------- */
  var TIERS = {
    1: "Tier 1 · citra satelit",
    2: "Tier 2 · citra + kunjungan lapangan",
    3: "Tier 3 · citra + plot ukur + sensor lapangan"
  };
  var KINDS = {
    mangrove: "Mangrove pesisir",
    hutan: "Restorasi hutan",
    agro: "Agroforestri",
    pulih: "Pemulihan lahan",
    komoditas: "Lahan produktif"
  };
  /* Peran tiap petak di peta terpadu (#14):
     - "kebun"    → hutan/mangrove/agro/pemulihan: pohon virtual diturunkan dari petak.
     - "komoditas"→ lahan produktif: kepemilikan bagian panen + bursa (harga
                    penawaran-permintaan) yang memangkas tengkulak untuk petani. */
  var USE = { mangrove: "kebun", hutan: "kebun", agro: "kebun", pulih: "kebun", komoditas: "komoditas" };
  /* Daftar petaknya TIDAK lagi tinggal di berkas ini.
     ────────────────────────────────────────────────────────────────────────
     Sampai ronde 38 larik PLOTS diketik langsung di sini, sementara aplikasi
     Hijau (React) menyimpan daftarnya sendiri di src/lib/petakContoh.ts. Petak
     yang SAMA lalu punya luas dan NDVI berbeda di dua halaman — mis. Mangrove
     Pesisir Selatan 42 ha di sini dan 84 ha di aplikasi. Sekarang keduanya
     membaca satu berkas: /lab/apps/peta/petak-data.js (dimuat SEBELUM berkas
     ini), dan versi TypeScript-nya dibangkitkan dari sana oleh
     scripts/sinkron-petak.cjs.

     Tutupan tajuk, jumlah pohon, dan estimasi serapan ikut pindah ke sana
     sebagai TURUNAN — dihitung dengan rumus yang sama persis dengan aplikasi,
     bukan diketik tangan. */
  var SUMBER_PETAK = root.GLYIV_PETAK;
  var PLOTS = (SUMBER_PETAK && SUMBER_PETAK.PETAK) || [];
  if (!PLOTS.length) {
    /* Tanpa data tidak ada yang bisa digambar. Katakan itu di layar — peta
       kosong tanpa penjelasan terbaca sebagai halaman rusak. */
    var fbData = $("[data-fallback]");
    if (fbData) {
      fbData.classList.add("on");
      fbData.innerHTML = "<p>Data petak contoh gagal dimuat (/lab/apps/peta/petak-data.js).<br>Muat ulang halaman; kalau tetap gagal, peta ini sedang tidak lengkap.</p>";
    }
    return;
  }

  /* status derived from NDVI — also drives polygon + badge colour */
  function statusOf(p) {
    if (p.ndvi >= 0.65) return { key: "st-pulih", label: "Tutupan stabil", col: "#1F7A6B" };
    if (p.ndvi >= 0.50) return { key: "st-awal", label: "Pemulihan berjalan", col: "#1cae6b" };
    return { key: "st-tinjau", label: "Perlu tinjau lapangan", col: "#B0894F" };
  }

  /* deterministic, area-accurate plot boundary around the centre point */
  function ringOf(p) {
    var rnd = mulberry32(seedOf(p.id)),
      n = 16, i, s,
      wob = [], loc = [];
    for (i = 0; i < n; i++) wob.push(0.74 + rnd() * 0.55);
    for (s = 0; s < 2; s++) { /* smooth so the outline reads organic, not spiky */
      var w2 = [];
      for (i = 0; i < n; i++) w2.push((wob[(i - 1 + n) % n] + wob[i] * 2 + wob[(i + 1) % n]) / 4);
      wob = w2;
    }
    var rot = rnd() * Math.PI * 2, squash = 0.68 + rnd() * 0.55, r0 = Math.sqrt(p.ha * 10000 / Math.PI);
    for (i = 0; i < n; i++) {
      var a = rot + i / n * Math.PI * 2;
      loc.push([Math.cos(a) * r0 * wob[i] * squash, Math.sin(a) * r0 * wob[i]]);
    }
    var area = 0;
    for (i = 0; i < n; i++) {
      var b = loc[(i + 1) % n];
      area += loc[i][0] * b[1] - b[0] * loc[i][1];
    }
    area = Math.abs(area) / 2;
    var k = area > 0 ? Math.sqrt(p.ha * 10000 / area) : 1;                 /* rescale so drawn area ≈ stated hectares */
    var mLat = 1 / 110574, mLng = 1 / (111320 * Math.cos(p.lat * Math.PI / 180));
    return loc.map(function (q) { return [p.lat + q[1] * k * mLat, p.lng + q[0] * k * mLng]; });
  }

  /* deterministic 12-month NDVI composite series around the stated value */
  function ndviSeries(p) {
    var rnd = mulberry32(seedOf(p.id + "-ndvi")), out = [], i;
    for (i = 0; i < 12; i++) {
      var trend = (i - 11) * 0.0055;                                        /* gentle recovery toward today */
      var season = Math.sin((i / 12) * Math.PI * 2 + 1.1) * 0.022;
      out.push(+Math.max(0.05, Math.min(0.95, p.ndvi + trend + season + (rnd() - 0.5) * 0.03)).toFixed(3));
    }
    out[11] = p.ndvi;
    return out;
  }

  PLOTS.forEach(function (p) {
    p.st = statusOf(p);
    p.ring = ringOf(p);
    p.series = ndviSeries(p);
    p.kindLabel = KINDS[p.kind];
    p.use = USE[p.kind] || "kebun";
  });

  /* ---------------------------------------------------------
     2b. helper interaksi peta terpadu (#14)
     Rp / pohon virtual / bursa komoditas — semua ILUSTRATIF ⚠︎.
  --------------------------------------------------------- */
  function rupiah(n) {
    return "Rp" + Math.round(n).toLocaleString("id-ID");
  }
  /* Harga bursa dari penawaran-permintaan: makin banyak panen dipesan (permintaan
     naik terhadap pasokan tetap), harga bergerak naik — model elastisitas sederhana,
     deterministik, jelas ditandai contoh. */
  function hargaBursa(k, pesanTambahan) {
    var permintaan = k.terjual + (pesanTambahan || 0);
    var rasio = Math.min(1.4, permintaan / Math.max(1, k.panen)); /* 0..1.4 */
    var faktor = 0.72 + 0.62 * rasio;                              /* 0.72..~1.6 */
    return {
      permintaan: permintaan,
      harga: Math.round(k.hargaWajar * faktor / 500) * 500,
      rasio: rasio
    };
  }

  /* ---------------------------------------------------------
     3. summary strip (all figures are estimates)
  --------------------------------------------------------- */
  (function summary() {
    var ha = 0, tr = 0, co = 0;
    PLOTS.forEach(function (p) { ha += p.ha; tr += p.trees; co += p.co2; });
    function put(sel, val, dec) {
      var el = $(sel); if (!el) return;
      var t0 = null, dur = 850;
      function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = dec ? (val * e).toFixed(dec).replace(".", ",") : fmt(val * e);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    put("[data-sum-plots]", PLOTS.length);
    put("[data-sum-ha]", ha);
    put("[data-sum-trees]", tr);
    put("[data-sum-co2]", co / 1000, 2);
    var hh = $("[data-hero-plots]"), hb = $("[data-hero-ha]");
    if (hh) hh.textContent = PLOTS.length;
    if (hb) hb.textContent = fmt(ha) + " ha";
  })();

  /* ---------------------------------------------------------
     4. map
  --------------------------------------------------------- */
  var mapEl = $("#pt-map");
  if (!mapEl) return;
  if (typeof window.L === "undefined") {                                    /* CDN blocked / offline */
    var fb = $("[data-fallback]"); if (fb) fb.classList.add("on");
    return;
  }

  var ID_CENTER = [-2.4, 117.6];
  var map = L.map(mapEl, {
    center: ID_CENTER,
    zoom: 5,
    minZoom: 3,                                                             /* a phone-width map needs z3.5 to hold the whole archipelago */
    maxZoom: 18,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 110,
    zoomControl: false,
    scrollWheelZoom: false,                                                 /* enabled after the user clicks the map */
    attributionControl: true,
    worldCopyJump: true
  });

  var OSM = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  });
  var SAT = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 18,
    /* Coverage over rural Indonesia thins out past z17 — beyond that Esri can
       serve an empty tile, which reads as a broken map exactly when someone
       zooms in to inspect a plot. Upscale the deepest real imagery instead.
       Plot coordinates are guarded by _glyiv-brain/verify-peta-imagery.cjs. */
    maxNativeZoom: 17,
    attribution: 'Citra: Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
  });
  var LABELS = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 18, opacity: 0.9, attribution: ""
  });
  var base = "sat";
  SAT.addTo(map); LABELS.addTo(map);

  function setBase(which) {
    if (which === base) return;
    base = which;
    if (which === "sat") { map.removeLayer(OSM); SAT.addTo(map); LABELS.addTo(map); }
    else { map.removeLayer(SAT); map.removeLayer(LABELS); OSM.addTo(map); }
    $$("[data-base]").forEach(function (b) {
      var on = b.getAttribute("data-base") === which;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* --- custom controls (kept as real Leaflet controls so they stack cleanly) --- */
  function addControl(pos, el) {
    var C = L.Control.extend({
      options: { position: pos },
      onAdd: function () { L.DomEvent.disableClickPropagation(el); L.DomEvent.disableScrollPropagation(el); return el; }
    });
    map.addControl(new C());
  }
  var baseEl = L.DomUtil.create("div", "pt-base");
  baseEl.innerHTML =
    '<button type="button" data-base="peta" aria-pressed="false" title="Peta jalan (OpenStreetMap)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 7 9 4Z"/><path d="M9 4v13M15 7v12.5"/></svg><span>Peta</span></button>' +
    '<button type="button" data-base="sat" class="on" aria-pressed="true" title="Citra satelit (Esri World Imagery)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 3 2.6 15 0 18M12 3c-2.6 3-2.6 15 0 18"/></svg><span>Satelit</span></button>';
  addControl("topleft", baseEl);
  map.addControl(L.control.zoom({ position: "topleft", zoomInTitle: "Perbesar", zoomOutTitle: "Perkecil" }));
  var resetEl = L.DomUtil.create("button", "pt-ctlbtn");
  resetEl.type = "button";
  resetEl.title = "Kembali ke tampilan Indonesia";
  resetEl.setAttribute("aria-label", "Kembali ke tampilan Indonesia");
  resetEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>';
  addControl("topleft", resetEl);
  L.control.scale({ imperial: false, position: "bottomleft", maxWidth: 130 }).addTo(map);

  baseEl.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-base]") : null;
    if (b) setBase(b.getAttribute("data-base"));
  });
  resetEl.addEventListener("click", function () { fitAll(true); });

  /* --- layers --- */
  var polyLayer = L.layerGroup().addTo(map);
  var markLayer = L.layerGroup().addTo(map);
  /* Titik pohon virtual petak terpilih. Lapisan TERPISAH supaya menutupnya cukup
     satu clearLayers() — dan supaya ia tidak pernah ikut terhitung saat peta
     memasang/melepas penanda mengikuti filter. */
  var pohonLayer = L.layerGroup().addTo(map);
  var LEAF = "M20 4C20 4 8 4 5 12c-2.2 5.9 1.4 8 1.4 8s2.1 3.6 8-.6C21 16 20 4 20 4Z";

  /* ---------------------------------------------------------
     4b. POHON VIRTUAL — titik di dalam petak terpilih
     ---------------------------------------------------------
     Cermin `bangkitkanPohon()` di src/lib/hijau/pohonVirtual.ts: tolak-terima di
     dalam poligon dengan PRNG bersemai, tanpa Math.random, sehingga petak yang
     sama selalu menampilkan sebaran yang sama. Kisi teratur sengaja dihindari —
     barisan lurus terbaca seperti perkebunan yang benar-benar ditanam, kesan
     yang justru ingin dihindari.

     ⚠︎ Ini BUKAN pohon nyata dan bukan sensus batang. Ia titik yang dihitung
     dari satu angka kerapatan tanam perkiraan (900 batang/ha, satu angka untuk
     semua spesies), dan layar WAJIB mengatakan itu — lihat pita di bawah peta.

     BATAS RENDER 420 jauh di bawah batas 1.500 aplikasinya. Alasannya perangkat:
     halaman ini juga memuat peta ubin satelit, panel, dan kanvas 3D di bawahnya,
     dan pemilik mengujinya di tablet. Kalau dipotong, layar mengatakannya. */
  var BATAS_TITIK_POHON = 420;

  function titikDiPoligon(pt, ring) {
    var x = pt[1], y = pt[0], di = false, i, j;
    for (i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][1], yi = ring[i][0], xj = ring[j][1], yj = ring[j][0];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) di = !di;
    }
    return di;
  }

  /** Ringkasan jumlah — dipakai teks pita maupun hutan 3D di bawah peta. */
  function ringkasPohon(p) {
    var penuh = p.trees;
    var dirender = Math.min(BATAS_TITIK_POHON, penuh);
    return { penuh: penuh, dirender: dirender, dipotong: penuh > dirender };
  }

  /** Posisi pohon virtual — MURNI terhadap `p.id`; hasilnya di-cache di petaknya. */
  function pohonPetak(p) {
    if (p.pohon) return p.pohon;
    var r = ringkasPohon(p), rnd = mulberry32(seedOf("contoh-" + p.id)), out = [], i;
    var minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (i = 0; i < p.ring.length; i++) {
      var q = p.ring[i];
      if (q[0] < minLat) minLat = q[0];
      if (q[0] > maxLat) maxLat = q[0];
      if (q[1] < minLng) minLng = q[1];
      if (q[1] > maxLng) maxLng = q[1];
    }
    /* Pagar terhadap perulangan tak berujung: poligon menyerong punya rasio
       luas-terhadap-kotak-pembatas kecil, jadi sebagian undian pasti gagal. */
    var maksPercobaan = r.dirender * 60 + 2000;
    for (i = 0; i < maksPercobaan && out.length < r.dirender; i++) {
      var lat = minLat + rnd() * (maxLat - minLat);
      var lng = minLng + rnd() * (maxLng - minLng);
      if (!titikDiPoligon([lat, lng], p.ring)) continue;
      /* Satu undian "vigor" menggerakkan tinggi & lebar tajuk bersamaan —
         dipakai hutan 3D di bawah peta. Ilustratif ⚠︎. */
      out.push({ lat: lat, lng: lng, vigor: rnd() });
    }
    p.pohon = out;
    return out;
  }

  var pohonTampil = true;

  function gambarPohon(p) {
    pohonLayer.clearLayers();
    if (!p || !pohonTampil) return;
    var daftar = pohonPetak(p), col = p.st.col, i;
    for (i = 0; i < daftar.length; i++) {
      L.circleMarker([daftar[i].lat, daftar[i].lng], {
        radius: 1.9 + daftar[i].vigor * 1.5,
        stroke: false,
        fillColor: col,
        fillOpacity: 0.85,
        /* non-interaktif: 420 penanda yang bisa diklik membuat peta berat di
           tablet, dan tidak ada satu pun yang perlu diklik. */
        interactive: false,
        className: "pt-tree"
      }).addTo(pohonLayer);
    }
  }

  PLOTS.forEach(function (p) {
    p.poly = L.polygon(p.ring, {
      color: p.st.col, weight: 1.6, opacity: 0.95,
      fillColor: p.st.col, fillOpacity: 0.16,
      className: "pt-poly", interactive: true
    });
    p.marker = L.marker([p.lat, p.lng], {
      icon: L.divIcon({
        className: "pt-mk",
        /* The pin carries the leaf too, so a marker whose label the declutter
           pass has suppressed still reads as a Glyiv badge and not as a
           generic dot. Its ::before gives it a 44px touch target. */
        html: '<span class="pt-badge ' + p.st.key + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + LEAF + '"/></svg>' +
          '<b>' + esc(p.short) + '</b><i></i></span>' +
          '<span class="pt-pin ' + p.st.key + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + LEAF + '"/></svg></span>',
        iconSize: [0, 0], iconAnchor: [0, 0]
      }),
      title: p.name + " — " + p.prov,
      alt: p.name,
      riseOnHover: true,
      keyboard: true
    });
    p.poly.addTo(polyLayer);
    p.marker.addTo(markLayer);
    p.marker.on("click", function () { select(p.id, true); });
    p.poly.on("click", function () { select(p.id, true); });
    p.marker.on("mouseover", function () { hover(p.id, true); });
    p.marker.on("mouseout", function () { hover(p.id, false); });
    p.poly.on("mouseover", function () { hover(p.id, true); });
    p.poly.on("mouseout", function () { hover(p.id, false); });
    p.marker.on("keypress", function (e) {
      if (e.originalEvent && (e.originalEvent.key === "Enter" || e.originalEvent.key === " ")) select(p.id, true);
    });
  });

  /* the detail panel floats over the map, so bounds must be fitted into the
     part of the map the panel does NOT cover — otherwise plots hide behind it */
  function padOpts(x, y) {
    y = y == null ? x : y;
    var o = { paddingTopLeft: [x, y], paddingBottomRight: [x, y] };
    if (panel && !panel.classList.contains("out")) {
      if (mq.matches) o.paddingBottomRight = [x, Math.round(panel.getBoundingClientRect().height) + y];
      else o.paddingBottomRight = [Math.round(Math.min(400, mapWrap.clientWidth * 0.46)) + x, y];
    }
    /* Padding must never swallow the whole map. On a short viewport (landscape
       phone, split screen) panel height + margins can exceed the map height;
       Leaflet then computes a negative fit size, getScaleZoom() returns
       Infinity, and the map slams to maxZoom instead of framing the plot.
       Scale both sides down together so the plot still lands in the strip the
       panel leaves visible. */
    var sz = map.getSize();
    function fit(a, b, room) {
      var t = a + b;
      if (t <= room || t <= 0) return [a, b];
      var k = room / t;
      return [a * k, b * k];
    }
    var cx = fit(o.paddingTopLeft[0], o.paddingBottomRight[0], sz.x * 0.62);
    var cy = fit(o.paddingTopLeft[1], o.paddingBottomRight[1], sz.y * 0.62);
    o.paddingTopLeft = [Math.round(cx[0]), Math.round(cy[0])];
    o.paddingBottomRight = [Math.round(cx[1]), Math.round(cy[1])];
    return o;
  }
  function fitAll(animate) {
    var b = L.latLngBounds([]);
    visible().forEach(function (p) { b.extend([p.lat, p.lng]); });
    if (!b.isValid()) { map.setView(ID_CENTER, 5); return; }
    var opt = padOpts(mq.matches ? 48 : 86, mq.matches ? 40 : 54);          /* badges overhang their anchor — leave room */
    opt.maxZoom = 6.5;
    if (animate) { opt.duration = 0.9; map.flyToBounds(b, opt); }
    else map.fitBounds(b, opt);
  }

  /* ---------------------------------------------------------
     5. label decluttering — badges only where they fit.
        Runs on zoom/move END only (never per frame); widths are
        estimated from the label text, so no DOM measurement.
  --------------------------------------------------------- */
  var declutterQueued = false;
  function declutter() {
    declutterQueued = false;
    var taken = [], order = visible().slice().sort(function (a, b) {
      if (a.id === state.sel) return -1;
      if (b.id === state.sel) return 1;
      return b.ha - a.ha;
    });
    order.forEach(function (p) {
      var el = p.marker.getElement();
      if (!el) return;
      var pt = map.latLngToContainerPoint([p.lat, p.lng]);
      var w = 52 + p.short.length * 6.5, h = 26;
      var r = { x1: pt.x - w / 2 - 5, x2: pt.x + w / 2 + 5, y1: pt.y - 15 - h - 5, y2: pt.y - 15 + 5 };
      var hit = false, i;
      for (i = 0; i < taken.length; i++) {
        var t = taken[i];
        if (r.x1 < t.x2 && r.x2 > t.x1 && r.y1 < t.y2 && r.y2 > t.y1) { hit = true; break; }
      }
      if (hit) el.classList.remove("is-lbl");
      else { el.classList.add("is-lbl"); taken.push(r); }
    });
  }
  function queueDeclutter() {
    if (declutterQueued) return;
    declutterQueued = true;
    requestAnimationFrame(declutter);
  }
  map.on("zoomend moveend", queueDeclutter);

  /* ---------------------------------------------------------
     6. state, list, selection
  --------------------------------------------------------- */
  var state = { sel: null, q: "", kind: "all" };
  var listEl = $("[data-list]"), countEl = $("[data-count]");
  var panel = $("[data-panel]"), panelHd = $("[data-panel-hd]"), panelBody = $("[data-panel-b]");
  var mapWrap = $("[data-mapwrap]");
  var mq = window.matchMedia("(max-width:940px)");

  function visible() {
    var q = state.q.toLowerCase();
    return PLOTS.filter(function (p) {
      if (state.kind !== "all" && p.kind !== state.kind) return false;
      if (!q) return true;
      return (p.name + " " + p.prov + " " + p.id + " " + p.kindLabel + " " + p.species.join(" ")).toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderList() {
    var vis = visible();
    countEl.textContent = vis.length + " / " + PLOTS.length + " petak";
    if (!vis.length) {
      listEl.innerHTML = '<div class="pt-empty">Tidak ada petak yang cocok.<br>Coba kata kunci lain atau pilih “Semua”.</div>';
    } else {
      listEl.innerHTML = vis.map(function (p) {
        var pct = Math.round(p.ndvi * 100);
        return '<button type="button" class="pt-row' + (p.id === state.sel ? " on" : "") + '" data-go="' + p.id + '" aria-pressed="' + (p.id === state.sel) + '">' +
          '<span class="pt-row__top">' +
          '<span class="pt-row__ic"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + LEAF + '"/></svg></span>' +
          '<span class="pt-row__t"><b>' + esc(p.name) + '</b><small>' + esc(p.prov) + ' · ' + p.ha + ' ha · ' + esc(p.kindLabel) + '</small></span>' +
          '<span class="pt-row__v"><b>' + String(p.ndvi.toFixed(2)).replace(".", ",") + '</b><small>NDVI ' + WARN + '</small></span>' +
          '</span>' +
          '<span class="pt-row__meter"><i class="' + (p.st.key === "st-tinjau" ? "warn" : "") + '" style="width:' + pct + '%"></i></span>' +
          '</button>';
      }).join("");
    }
    /* sync map layers with the filter */
    PLOTS.forEach(function (p) {
      var on = vis.indexOf(p) >= 0;
      if (on && !markLayer.hasLayer(p.marker)) { markLayer.addLayer(p.marker); polyLayer.addLayer(p.poly); paint(p); }
      if (!on && markLayer.hasLayer(p.marker)) { markLayer.removeLayer(p.marker); polyLayer.removeLayer(p.poly); }
    });
    /* never leave the panel open on a plot the filter just removed */
    if (state.sel && !vis.some(function (p) { return p.id === state.sel; })) closePanel();
    queueDeclutter();
  }

  function paint(p) {
    var on = p.id === state.sel;
    p.poly.setStyle({
      weight: on ? 3 : 1.6,
      fillOpacity: on ? 0.3 : 0.16,
      color: on ? "#0F2E22" : p.st.col,
      fillColor: p.st.col
    });
    /* setStyle never touches className — toggle the SVG path class directly */
    var pel = p.poly.getElement ? p.poly.getElement() : null;
    if (pel && pel.classList) pel.classList.toggle("pt-poly-on", on);
    if (on) p.poly.bringToFront();
    var el = p.marker.getElement();
    if (el) el.classList.toggle("is-on", on);
    p.marker.setZIndexOffset(on ? 1200 : 0);
  }

  function hover(id, on) {
    var p = byId(id); if (!p) return;
    var el = p.marker.getElement();
    if (el) el.classList.toggle("is-hover", !!on && p.id !== state.sel);
    if (p.id !== state.sel) p.poly.setStyle({ weight: on ? 2.6 : 1.6, fillOpacity: on ? 0.26 : 0.16 });
  }
  function byId(id) {
    for (var i = 0; i < PLOTS.length; i++) if (PLOTS[i].id === id) return PLOTS[i];
    return null;
  }

  function select(id, fly) {
    var p = byId(id); if (!p) return;
    var prev = state.sel;
    state.sel = id;
    if (prev && byId(prev)) paint(byId(prev));
    paint(p);
    $$("[data-go]").forEach(function (b) {
      var on = b.getAttribute("data-go") === id;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    renderPanel(p);
    gambarPohon(p);
    /* Hutan 3D di bawah peta mendengarkan ini. Dikirim sebagai peristiwa, bukan
       panggilan langsung, supaya berkas peta tidak perlu tahu apa pun tentang
       three.js — dan supaya halaman tetap utuh kalau berkas 3D-nya gagal dimuat. */
    window.dispatchEvent(new CustomEvent("glyiv:petak-terpilih", {
      detail: { petak: p, pohon: pohonPetak(p), ringkas: ringkasPohon(p) }
    }));
    if (fly) {
      var opt = padOpts(56);
      opt.maxZoom = 15.5; opt.duration = 1.1;
      map.flyToBounds(p.poly.getBounds(), opt);
    }
    queueDeclutter();
  }

  /* ---------------------------------------------------------
     7. detail panel / bottom sheet
  --------------------------------------------------------- */
  function speciesHTML(list) {
    return list.map(function (s) {
      var m = s.match(/^(.*?)\s*\((.*)\)$/);
      return m ? '<span>' + esc(m[1]) + ' <em>' + esc(m[2]) + '</em></span>' : '<span>' + esc(s) + '</span>';
    }).join("");
  }
  function cell(k, v, cls, src) {
    return '<div><div class="k"' + (src ? ' data-src="' + esc(src) + '" data-src-inside="1" data-src-title="Sumber data"' : "") + '>' + k + '</div>' +
      '<div class="v ' + (cls || "") + '">' + v + '</div></div>';
  }

  /* ---- #14 seksi interaktif: Kebun Virtual (hutan) / Bursa (lahan produktif) ---- */

  /* Pohon virtual DITURUNKAN dari petak: sebagian batang nyata dibuka untuk diadopsi.
     Mengadopsi = mendanai perawatan pohon nyata itu; imbalan = poin "hari-pohon"
     simulasi. Semua ilustratif ⚠︎. */
  function kebunSection(p) {
    var tersedia = Math.max(20, Math.round(p.trees * 0.02));         /* ~2% batang dibuka */
    var serapanPohon = p.co2 * 1000 / p.trees;                       /* kg CO₂e / pohon / thn */
    var biayaPohon = 15000;                                          /* Rp / pohon / thn ⚠︎ */
    var awal = Math.min(10, tersedia);
    return '<div class="pt-sub">🌱 Kebun Virtual — dari petak ini</div>' +
      '<div class="uni-card" data-kebun data-trees="' + tersedia + '" data-serap="' + serapanPohon.toFixed(2) + '" data-biaya="' + biayaPohon + '">' +
      '<p class="uni-lead">Adopsi pohon nyata di petak ini sebagai <b>pohon virtual</b>: dana Anda membiayai perawatannya di lapangan, pertumbuhannya dipantau satelit, dan Anda kumpulkan imbalan “hari-pohon”. Angka contoh ⚠︎.</p>' +
      '<div class="uni-row"><span>Pohon virtual</span>' +
      '<span class="uni-step"><button type="button" class="uni-b" data-k-dec>−</button>' +
      '<b data-k-n>' + awal + '</b><button type="button" class="uni-b" data-k-inc>+</button></span></div>' +
      '<input type="range" class="uni-range" data-k-range min="1" max="' + tersedia + '" value="' + awal + '" aria-label="Jumlah pohon virtual">' +
      '<div class="uni-grid">' +
      '<div><div class="k">Serapan Anda ' + WARN + '</div><div class="v g" data-k-co2>0</div><small>kg CO₂e/thn</small></div>' +
      '<div><div class="k">Biaya perawatan ' + WARN + '</div><div class="v" data-k-cost>0</div><small>/tahun</small></div>' +
      '<div><div class="k">Imbalan ' + WARN + '</div><div class="v gold" data-k-reward>0</div><small>hari-pohon/thn</small></div>' +
      '</div>' +
      '<div class="uni-acts"><button type="button" class="ga-btn solid" data-k-adopt>Adopsi &amp; rawat →</button>' +
      '<a class="ga-btn glass" href="/register-land">Punya lahan? Daftar →</a></div>' +
      '<p class="uni-note">Dari <b>' + fmt(tersedia) + '</b> pohon yang dibuka untuk petak ini. Pohon virtual = pohon nyata yang sama, satu diadopsi satu orang — tak dijual dua kali.</p>' +
      '</div>';
  }

  /* Bursa komoditas: kepemilikan bagian panen + harga penawaran-permintaan yang
     memangkas tengkulak. Slider "bagian Anda" menaikkan permintaan → harga bergerak,
     dan memperlihatkan yang DITERIMA PETANI (wajar vs tengkulak). Ilustratif ⚠︎. */
  function bursaSection(p) {
    var k = p.komoditas, sisa = Math.max(1, k.panen - k.terjual);
    var awal = Math.min(Math.round(sisa * 0.1) || 1, sisa);
    return '<div class="pt-sub">🛒 Bursa Komoditas — ' + esc(k.nama) + '</div>' +
      '<div class="uni-card" data-bursa data-base="' + k.hargaWajar + '" data-teng="' + k.hargaTengkulak +
      '" data-panen="' + k.panen + '" data-terjual="' + k.terjual + '" data-unit="' + esc(k.unit) +
      '" data-ptani="' + k.bagiPetani + '" data-op="' + k.bagiOperasi + '" data-pmlk="' + k.bagiPemilik + '">' +
      '<p class="uni-lead">Miliki bagian panen langsung dari petani — <b>tanpa rantai tengkulak</b>. Makin banyak panen dipesan, harga bergerak mengikuti <b>penawaran &amp; permintaan</b> nyata; petani menerima jauh lebih besar dari harga tengkulak. Angka contoh ⚠︎.</p>' +
      '<div class="uni-row"><span>Bagian Anda (' + esc(k.unit) + ')</span>' +
      '<span class="uni-step"><button type="button" class="uni-b" data-bg-dec>−</button>' +
      '<b data-bg-n>' + awal + '</b><button type="button" class="uni-b" data-bg-inc>+</button></span></div>' +
      '<input type="range" class="uni-range" data-bg-range min="1" max="' + sisa + '" value="' + awal + '" aria-label="Bagian panen (kg)">' +
      '<div class="uni-price"><div><small>Harga bursa ' + WARN + '</small><b data-bg-harga>—</b><span data-bg-unit>/' + esc(k.unit) + '</span></div>' +
      '<div class="uni-bar"><i data-bg-fill></i></div>' +
      '<div class="uni-sd"><span data-bg-sd>—</span></div></div>' +
      '<div class="uni-grid">' +
      '<div><div class="k">Nilai bagian Anda ' + WARN + '</div><div class="v" data-bg-nilai>—</div></div>' +
      '<div><div class="k">Diterima petani ' + WARN + '</div><div class="v g" data-bg-petani>—</div></div>' +
      '<div><div class="k">Lewat tengkulak</div><div class="v" style="color:#B0894F;text-decoration:line-through" data-bg-teng>—</div></div>' +
      '</div>' +
      '<div class="uni-split" data-bg-split></div>' +
      '<div class="uni-acts"><button type="button" class="ga-btn solid" data-bg-buy>Ambil bagian →</button>' +
      '<a class="ga-btn glass" href="/register-land">Petani? Jual di sini →</a></div>' +
      '<p class="uni-note" data-bg-fair>—</p>' +
      '</div>';
  }

  function interaktifSection(p) {
    return p.use === "komoditas" && p.komoditas ? bursaSection(p) : kebunSection(p);
  }

  function renderPanel(p) {
    panel.hidden = false;
    panel.classList.remove("out");
    panelHd.innerHTML =
      '<div class="pt-panel__id">' + esc(p.id) + ' · ' + esc(TIERS[p.tier]) + '</div>' +
      '<h3>' + esc(p.name) + '</h3>' +
      '<div class="pt-panel__prov"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>' +
      esc(p.prov) + ' · ' + esc(p.kindLabel) + ' · ' + p.lat.toFixed(4) + ", " + p.lng.toFixed(4) + '</div>' +
      '<span class="pt-pill ' + p.st.key + '"><i></i>' + esc(p.st.label) + '</span>' +
      '<button class="pt-x" type="button" data-close aria-label="Tutup panel">&times;</button>';

    panelBody.innerHTML =
      '<div class="pt-big">' +
      '<div class="k" data-src="' + esc(SRC.co2) + '" data-src-inside="1" data-src-title="Sumber estimasi serapan">Estimasi serapan ' + WARN + '</div>' +
      '<div class="v">' + fmt(p.co2) + ' <small>tCO₂e / tahun</small></div>' +
      '<div class="rng">rentang ketidakpastian <b>' + fmt(p.co2lo) + ' – ' + fmt(p.co2hi) + '</b> tCO₂e/thn · kontribusi terlacak, belum diverifikasi pihak ketiga</div>' +
      '</div>' +

      '<div class="pt-meta">' +
      cell("Luas terpantau " + WARN, p.ha + ' <small>ha</small>', "", SRC.luas) +
      cell("Tahun tanam", p.year, "") +
      cell("NDVI komposit " + WARN, String(p.ndvi.toFixed(2)).replace(".", ","), "g", SRC.ndvi) +
      cell("Tutupan tajuk " + WARN, p.canopy + ' <small>%</small>', "g", SRC.tajuk) +
      cell("Pohon (est.) " + WARN, fmt(p.trees), "", SRC.pohon) +
      cell("Observasi terakhir", '<span style="font-size:14px">' + tanggal(p.obs) + '</span>', "gold", SRC.citra) +
      '</div>' +

      '<div class="pt-sub">Spesies tercatat</div>' +
      '<div class="pt-sp">' + speciesHTML(p.species) + '</div>' +

      '<div class="pt-sub">NDVI 12 bulan terakhir ' + WARN + '</div>' +
      '<div class="pt-spark"><div class="gt">komposit bulanan <b>' + String(p.ndvi.toFixed(2)).replace(".", ",") + '</b></div><canvas data-spark></canvas></div>' +

      '<div class="pt-sub">Sumber &amp; tingkat data</div>' +
      '<div class="pt-srcrow">' +
      '<div><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M5 5l3 3M19 5l-3 3M5 19l3-3M19 19l-3-3"/></svg></span>' +
      '<div><b>Citra satelit</b><small data-src="' + esc(SRC.citra) + '" data-src-inside="1" data-src-title="Sumber citra">' + esc(p.sat) + '</small></div></div>' +
      '<div><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6h16M4 12h16M4 18h10"/></svg></span>' +
      '<div><b>' + esc(TIERS[p.tier]) + '</b><small>tingkat kelengkapan data yang terlacak untuk petak ini</small></div></div>' +
      '</div>' +

      '<div class="pt-sub">Pohon virtual petak ini</div>' +
      '<div class="pt-vtree">' +
      '<div><b>' + fmt(ringkasPohon(p).penuh) + '</b><small>perkiraan batang ' + WARN + '</small></div>' +
      '<div><b>' + fmt(ringkasPohon(p).dirender) + '</b><small>titik digambar di peta</small></div>' +
      '<p>Titik hijau di dalam batas petak adalah <b>pohon virtual</b> — bukan pohon nyata dan bukan sensus batang, melainkan sebaran yang dihitung sistem dari perkiraan kerapatan tanam ' + fmt(SUMBER_PETAK.KERAPATAN_TANAM_PER_HA) + ' batang/ha ' + WARN + '. ' +
      (ringkasPohon(p).dipotong ? 'Peta hanya menggambar ' + fmt(ringkasPohon(p).dirender) + ' di antaranya supaya tetap lancar di tablet. ' : '') +
      '<b>Hutan 3D-nya ada tepat di bawah peta.</b></p>' +
      '</div>' +

      '<div class="pt-road"><span>⚠</span><div><b>Status:</b> sertifikasi, MRV pihak ketiga, dan registri kredit <b>belum tersedia</b> — masih dalam roadmap Glyiv. Angka di panel ini adalah data contoh untuk prototipe.</div></div>' +

      interaktifSection(p) +

      '<div class="pt-acts">' +
      '<button type="button" class="ga-btn solid" data-zoom>Zoom ke petak</button>' +
      '<a class="ga-btn glass" href="#forest-3d">Lihat hutan 3D ↓</a>' +
      '</div>';

    if (window.GlyivSources && GlyivSources.scan) GlyivSources.scan(panel);
    if (mq.matches) openSheet();
    drawSpark(p);
    syncInteraktif();
    state.selPlot = p;
  }

  /* ---- recompute seksi interaktif dari nilai slider ---- */
  function syncKebun(card) {
    var n = parseInt($("[data-k-range]", card).value, 10) || 1;
    var serap = parseFloat(card.getAttribute("data-serap")) || 0;
    var biaya = parseFloat(card.getAttribute("data-biaya")) || 0;
    $("[data-k-n]", card).textContent = fmt(n);
    $("[data-k-co2]", card).textContent = fmt(n * serap);
    $("[data-k-cost]", card).textContent = rupiah(n * biaya);
    $("[data-k-reward]", card).textContent = fmt(n * 8);            /* 8 hari-pohon/pohon/thn ⚠︎ */
  }
  function syncBursa(card) {
    var qty = parseInt($("[data-bg-range]", card).value, 10) || 1;
    var base = +card.getAttribute("data-base"), teng = +card.getAttribute("data-teng");
    var panen = +card.getAttribute("data-panen"), terjual = +card.getAttribute("data-terjual");
    var unit = card.getAttribute("data-unit");
    var pTani = +card.getAttribute("data-ptani"), pOp = +card.getAttribute("data-op"), pMlk = +card.getAttribute("data-pmlk");
    var hb = hargaBursa({ hargaWajar: base, panen: panen, terjual: terjual }, qty);
    var petaniTerima = hb.harga * pTani / 100;
    var tengTerima = teng;
    var lipat = tengTerima > 0 ? (petaniTerima / tengTerima) : 1;
    $("[data-bg-n]", card).textContent = fmt(qty);
    $("[data-bg-harga]", card).textContent = rupiah(hb.harga);
    $("[data-bg-nilai]", card).textContent = rupiah(qty * hb.harga);
    $("[data-bg-petani]", card).textContent = rupiah(qty * petaniTerima);
    $("[data-bg-teng]", card).textContent = rupiah(qty * tengTerima);
    var pct = Math.min(100, Math.round(hb.rasio / 1.4 * 100));
    var fill = $("[data-bg-fill]", card); if (fill) fill.style.width = pct + "%";
    $("[data-bg-sd]", card).textContent = fmt(hb.permintaan) + " / " + fmt(panen) + " " + unit + " dipesan · permintaan " +
      (hb.rasio >= 1 ? "melebihi" : "di bawah") + " pasokan";
    $("[data-bg-split]", card).innerHTML =
      '<span><i style="background:#1F7A6B"></i>Petani ' + pTani + '%</span>' +
      '<span><i style="background:#B0894F"></i>Operasi &amp; logistik ' + pOp + '%</span>' +
      '<span><i style="background:#1cae6b"></i>Pemilik bagian ' + pMlk + '%</span>';
    $("[data-bg-fair]", card).innerHTML = 'Lewat bursa Glyiv, petani menerima <b>' + rupiah(petaniTerima) + '/' + unit +
      '</b> — sekitar <b>' + lipat.toFixed(1).replace(".", ",") + '×</b> harga tengkulak (' + rupiah(tengTerima) + '/' + unit +
      '). Selisihnya kembali ke petani, bukan perantara. ' + WARN;
  }
  function syncInteraktif() {
    var kb = $("[data-kebun]", panelBody); if (kb) syncKebun(kb);
    var bs = $("[data-bursa]", panelBody); if (bs) syncBursa(bs);
  }

  function drawSpark(p) {
    var cv = $("[data-spark]", panelBody);
    if (!cv || !window.GA || !GA.lineChart) return;
    if (!cv.clientWidth) return;                                            /* sheet collapsed — redrawn on expand */
    GA.lineChart(cv, p.series, { color: "#1F7A6B", fillCol: "rgba(31,122,107,.16)" });
  }

  /* nudge a range slider by ±step then recompute */
  function nudge(sel, card, delta, sync) {
    var r = $(sel, card); if (!r) return;
    var v = Math.max(+r.min, Math.min(+r.max, (parseInt(r.value, 10) || 0) + delta));
    r.value = v; sync(card);
  }
  /* simulated confirmation — this is a prototype/teaser, so no real transaction */
  function konfirmasi(card, msg) {
    var acts = $(".uni-acts", card); if (!acts) return;
    acts.innerHTML = '<div class="uni-ok">✓ ' + esc(msg) + ' <small>— pratinjau, belum transaksi nyata ' + WARN + '</small></div>';
  }

  panel.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-close]")) { closePanel(); return; }
    if (t.closest("[data-zoom]") && state.selPlot) {
      var o = padOpts(56); o.maxZoom = 16; o.duration = 1;
      map.flyToBounds(state.selPlot.poly.getBounds(), o);
      return;
    }
    var kb = $("[data-kebun]", panelBody), bs = $("[data-bursa]", panelBody);
    if (kb) {
      if (t.closest("[data-k-inc]")) return nudge("[data-k-range]", kb, 1, syncKebun);
      if (t.closest("[data-k-dec]")) return nudge("[data-k-range]", kb, -1, syncKebun);
      if (t.closest("[data-k-adopt]")) return konfirmasi(kb, "Adopsi " + $("[data-k-n]", kb).textContent + " pohon virtual tercatat");
    }
    if (bs) {
      if (t.closest("[data-bg-inc]")) return nudge("[data-bg-range]", bs, 1, syncBursa);
      if (t.closest("[data-bg-dec]")) return nudge("[data-bg-range]", bs, -1, syncBursa);
      if (t.closest("[data-bg-buy]")) return konfirmasi(bs, "Bagian " + $("[data-bg-n]", bs).textContent + " tercatat");
    }
  });
  panel.addEventListener("input", function (e) {
    var t = e.target;
    if (t.matches("[data-k-range]")) { var kb = t.closest("[data-kebun]"); if (kb) syncKebun(kb); }
    else if (t.matches("[data-bg-range]")) { var bs = t.closest("[data-bursa]"); if (bs) syncBursa(bs); }
  });
  function closePanel() {
    panel.classList.add("out");
    var prev = state.sel;
    state.sel = null;
    state.selPlot = null;
    if (prev && byId(prev)) paint(byId(prev));
    $$("[data-go]").forEach(function (b) { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); });
    gambarPohon(null);
    /* Hutan 3D di bawah peta kembali ke keadaan "belum ada petak dipilih". */
    window.dispatchEvent(new CustomEvent("glyiv:petak-terpilih", { detail: { petak: null } }));
    queueDeclutter();
  }

  /* Sakelar titik pohon virtual — hidup di pita bawah peta, bukan di panel:
     panel bisa tertutup sementara titiknya masih tergambar, dan sakelar yang
     hilang bersama panelnya membuat orang mengira titiknya tidak bisa dimatikan. */
  var sakelarPohon = $("[data-toggle-pohon]");
  if (sakelarPohon) {
    sakelarPohon.addEventListener("click", function () {
      pohonTampil = !pohonTampil;
      sakelarPohon.setAttribute("aria-pressed", pohonTampil ? "true" : "false");
      sakelarPohon.classList.toggle("on", pohonTampil);
      gambarPohon(state.selPlot);
    });
  }

  /* ---- draggable bottom sheet (mobile only) ---- */
  var grab = $("[data-grab]"), PEEK = 150, drag = null, rafPending = false, nextH = 0;
  function sheetMax() { return Math.max(220, mapWrap.getBoundingClientRect().height - 10); }
  /* Expanded height: 78% of the sheet's travel, but always leave a usable strip
     of map above it. A landscape phone only gets ~360px of map here, and a sheet
     at a flat 78% would leave a 60px sliver that no plot is readable in. */
  function fullSheet(max) {
    max = max == null ? sheetMax() : max;
    var mapH = mapWrap.getBoundingClientRect().height;
    return Math.round(Math.max(PEEK, Math.min(max * 0.78, mapH - 150)));
  }
  function openSheet() { setSheet(fullSheet(), true); }
  function setSheet(h, animate) {
    if (!mq.matches) return;
    if (animate) {
      panel.style.transition = "height .28s cubic-bezier(.22,1,.36,1),transform .3s cubic-bezier(.22,1,.36,1)";
      setTimeout(function () { panel.style.transition = ""; drawSpark(state.selPlot); }, 300);
    }
    panel.style.height = h + "px";
  }
  if (grab) {
    grab.addEventListener("pointerdown", function (e) {
      if (!mq.matches) return;
      drag = { y: e.clientY, h: panel.getBoundingClientRect().height, max: sheetMax(), moved: 0 };
      panel.style.transition = "";
      if (grab.setPointerCapture) grab.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    grab.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var d = drag.y - e.clientY;
      drag.moved = Math.max(drag.moved, Math.abs(d));
      nextH = Math.max(96, Math.min(drag.max, drag.h + d));
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(function () { rafPending = false; panel.style.height = nextH + "px"; });
    });
    function endDrag() {
      if (!drag) return;
      var max = drag.max, cur = nextH || drag.h, tap = drag.moved < 7;
      drag = null;
      var full = fullSheet(max);
      if (tap) setSheet(cur > PEEK + 20 ? PEEK : full, true);
      else setSheet(cur > (PEEK + full) / 2 ? full : PEEK, true);
    }
    grab.addEventListener("pointerup", endDrag);
    grab.addEventListener("pointercancel", endDrag);
  }
  mq.addEventListener ? mq.addEventListener("change", onMQ) : mq.addListener(onMQ);
  function onMQ() {
    panel.style.height = "";
    panel.style.transition = "";
    setTimeout(function () { map.invalidateSize(); drawSpark(state.selPlot); }, 120);
  }

  /* ---------------------------------------------------------
     8. wiring
  --------------------------------------------------------- */
  listEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-go]");
    if (b) select(b.getAttribute("data-go"), true);
  });
  listEl.addEventListener("mouseover", function (e) {
    var b = e.target.closest("[data-go]");
    if (b) hover(b.getAttribute("data-go"), true);
  });
  listEl.addEventListener("mouseout", function (e) {
    var b = e.target.closest("[data-go]");
    if (b) hover(b.getAttribute("data-go"), false);
  });
  listEl.addEventListener("focusin", function (e) {
    var b = e.target.closest("[data-go]");
    if (b) hover(b.getAttribute("data-go"), true);
  });
  listEl.addEventListener("focusout", function (e) {
    var b = e.target.closest("[data-go]");
    if (b) hover(b.getAttribute("data-go"), false);
  });

  var search = $("[data-q]"), qT;
  if (search) search.addEventListener("input", function () {
    clearTimeout(qT);
    qT = setTimeout(function () { state.q = search.value.trim(); renderList(); }, 130);
  });
  $$("[data-kind]").forEach(function (c) {
    c.addEventListener("click", function () {
      state.kind = c.getAttribute("data-kind");
      $$("[data-kind]").forEach(function (x) {
        x.classList.toggle("on", x === c);
        x.setAttribute("aria-pressed", x === c ? "true" : "false");
      });
      renderList();
      fitAll(true);
    });
  });

  /* wheel-zoom only after the user opts in, so the page never gets hijacked */
  var hint = $("[data-hint]");
  function armWheel() {
    map.scrollWheelZoom.enable();
    if (hint) hint.classList.add("gone");
  }
  map.on("click", armWheel);
  map.on("focus", armWheel);
  if (hint) setTimeout(function () { hint.classList.add("gone"); }, 9000);
  mapEl.addEventListener("touchstart", function () { if (hint) hint.classList.add("gone"); }, { passive: true });
  mapEl.addEventListener("mouseleave", function () { map.scrollWheelZoom.disable(); });

  var rzT;
  window.addEventListener("resize", function () {
    clearTimeout(rzT);
    rzT = setTimeout(function () { map.invalidateSize(); queueDeclutter(); drawSpark(state.selPlot); }, 180);
  });

  /* ---------------------------------------------------------
     9. boot
  --------------------------------------------------------- */
  renderList();
  map.whenReady(function () {
    setTimeout(function () {
      map.invalidateSize();
      /* open on the whole archipelago with every badge visible — the panel stays
         closed so nothing is hidden behind it until the user picks a plot */
      fitAll(false);
      queueDeclutter();
    }, 60);
  });

  /* Diekspos supaya lapisan segmentasi NDVI (ndvi-layer.js) bisa mewarnai
     ulang poligon dan membaca data petak, TANPA harus menyalin logika peta
     ini. Sengaja hanya baca-tulis gaya, bukan API publik untuk umum. */
  window.__GLYIV_PETA = { map: map, plots: PLOTS, state: state, pilih: select, catatan: SUMBER_PETAK.CATATAN };
  window.dispatchEvent(new CustomEvent("glyiv:peta-siap"));
})(typeof window !== "undefined" ? window : globalThis);
