/* ============================================================================
   GLYIV — SEGMENTASI WARNA NDVI + KALKULATOR SERAPAN
   Perluasan untuk /lab/apps/peta/. Berjalan setelah app.js siap.

   KENAPA ADA: pembanding terdekat memakai indeks kesehatan mangrove dengan TIGA
   kelas (merah/kuning/hijau) dan menampilkan SATU angka serapan tanpa rentang.
   Kita melangkah lebih jauh pada dua hal yang benar-benar menentukan kredibilitas:

     1. ENAM kelas tutupan dengan gradasi warna KONTINU — petak yang "sedang
        pulih" tidak lagi tercampur dengan yang "kritis".
     2. Setiap angka keluar sebagai RENTANG dengan tier data, plus pembagian
        70/30 (dijual / cadangan penyangga). Angka tunggal menyesatkan karena
        NDVI jenuh di tegakan rapat dan endmember berbeda per wilayah & musim.

   Semua parameter di sini adalah nilai perencanaan yang WAJIB dikalibrasi dengan
   ground-truth. Lihat whitepaper bab Glyiv Aset §2.3.
   ============================================================================ */
(function () {
  "use strict";

  /* ── Tangga kelas NDVI ─────────────────────────────────────────────────── */
  var CLASSES = [
    { id: "air", min: -1, label: "Air / non-vegetasi", note: "Perairan, tambak terbuka, atau sisa awan", col: "#1E4E8C" },
    { id: "terbuka", min: 0.10, label: "Lahan terbuka", note: "Tanah kosong atau vegetasi sangat jarang", col: "#B4553A" },
    { id: "kritis", min: 0.25, label: "Kritis", note: "Tutupan rendah — perlu rehabilitasi", col: "#D98324" },
    { id: "pemulihan", min: 0.40, label: "Pemulihan berjalan", note: "Tegakan muda, tutupan mulai menutup", col: "#E3B505" },
    { id: "sedang", min: 0.55, label: "Tutupan sedang", note: "Tegakan sehat, belum rapat penuh", col: "#5BA85A" },
    { id: "rapat", min: 0.70, label: "Tutupan rapat", note: "Kanopi rapat — nilai NDVI mulai jenuh", col: "#1F7A6B" }
  ];

  function classify(v) {
    v = Math.min(1, Math.max(-1, v));
    var found = CLASSES[0];
    for (var i = 0; i < CLASSES.length; i++) if (v >= CLASSES[i].min) found = CLASSES[i];
    return found;
  }

  function hex2rgb(h) {
    h = h.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hex(r, g, b) {
    var t = function (n) { return Math.round(n).toString(16).padStart(2, "0"); };
    return "#" + t(r) + t(g) + t(b);
  }
  /* Warna KONTINU: interpolasi antar warna kelas, sehingga peta memperlihatkan
     gradasi halus, bukan sekadar blok warna. Inilah yang membuat segmentasi kita
     terbaca "hidup" dibanding tangga tiga warna. */
  function ndviColor(v) {
    v = Math.min(1, Math.max(-1, v));
    var idx = 0;
    for (var i = 0; i < CLASSES.length; i++) {
      var next = CLASSES[i + 1];
      if (v >= CLASSES[i].min && (!next || v < next.min)) { idx = i; break; }
    }
    var lo = CLASSES[idx], hi = CLASSES[Math.min(CLASSES.length - 1, idx + 1)];
    if (lo === hi) return lo.col;
    var span = hi.min - lo.min;
    var t = span > 0 ? Math.min(1, Math.max(0, (v - lo.min) / span)) : 0;
    var a = hex2rgb(lo.col), b = hex2rgb(hi.col);
    return rgb2hex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
  }

  /* ── Tutupan kanopi & serapan ──────────────────────────────────────────── */
  var NDVI_SOIL = 0.15, NDVI_DENSE = 0.85;
  function canopyFraction(v) {
    if (NDVI_DENSE <= NDVI_SOIL) return 0;
    return Math.min(1, Math.max(0, (v - NDVI_SOIL) / (NDVI_DENSE - NDVI_SOIL)));
  }
  /* tCO2e per hektar per tahun. Mangrove tinggi karena karbon biru; tetap konservatif.
     Rujukan konseptual: IPCC 2006 Vol.4 (AFOLU) & IPCC Wetlands Supplement 2014. */
  var RATE = {
    mangrove: { mid: 13.5, lo: 8.0, hi: 19.0, label: "Mangrove pesisir" },
    hutan: { mid: 9.0, lo: 5.5, hi: 13.0, label: "Restorasi hutan" },
    agro: { mid: 5.5, lo: 3.0, hi: 8.0, label: "Agroforestri" },
    pulih: { mid: 3.5, lo: 1.5, hi: 6.0, label: "Pemulihan lahan kritis" }
  };
  var BUFFER = 0.30; /* cadangan penyangga — sejalan praktik buffer pool standar karbon lahan */

  function estimate(ha, ndvi, kind) {
    var fc = canopyFraction(ndvi);
    var r = RATE[kind] || RATE.hutan;
    var eff = Math.max(0, ha) * fc;
    var mid = eff * r.mid;
    return {
      mid: mid, lo: eff * r.lo, hi: eff * r.hi,
      dijual: mid * (1 - BUFFER), cadangan: mid * BUFFER,
      fc: fc, kelas: classify(ndvi)
    };
  }

  /* Padanan awam. Pembagi adalah rata-rata kasar untuk membangun intuisi —
     selalu disertai kata "setara", tidak pernah "sama dengan". */
  function setara(t) {
    return {
      motor: Math.round(t / 1.1),          /* motor harian ~1,1 tCO2e/tahun */
      terbang: Math.round(t / 0.25),       /* Jakarta–Bali PP ~0,25 tCO2e/penumpang */
      rumah: Math.round(t / 1.8)           /* listrik satu rumah ~1,8 tCO2e/tahun */
    };
  }

  var nf = function (n, d) {
    return Number(n).toLocaleString("id-ID", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  };

  /* ── Pasang ke peta ────────────────────────────────────────────────────── */
  function boot() {
    var P = window.__GLYIV_PETA;
    if (!P || !P.plots) return;

    var mode = "status"; /* "status" | "ndvi" */

    function repaint() {
      P.plots.forEach(function (p) {
        if (!p.poly) return;
        var col = mode === "ndvi" ? ndviColor(p.ndvi) : (p.st && p.st.col) || "#1F7A6B";
        p.poly.setStyle({ color: col, fillColor: col, fillOpacity: mode === "ndvi" ? 0.42 : 0.16 });
      });
    }

    /* Panel: pengalih mode + legenda + kalkulator */
    var host = document.querySelector("[data-ndvi-panel]");
    if (!host) return;

    host.innerHTML =
      '<div class="nd">' +
        '<div class="nd__hd">' +
          '<div>' +
            '<p class="nd__k">Segmentasi tutupan</p>' +
            '<h3 class="nd__t">Warna petak mengikuti NDVI</h3>' +
          '</div>' +
          '<div class="nd__sw" role="group" aria-label="Mode pewarnaan peta">' +
            '<button type="button" class="nd__b is-on" data-mode="status">Status</button>' +
            '<button type="button" class="nd__b" data-mode="ndvi">Segmentasi NDVI</button>' +
          '</div>' +
        '</div>' +

        '<div class="nd__ramp" aria-hidden="true"></div>' +
        '<div class="nd__scale"><span>-1,0</span><span>0,25</span><span>0,55</span><span>1,0</span></div>' +

        '<ul class="nd__leg">' +
          CLASSES.map(function (c) {
            return '<li><i style="background:' + c.col + '"></i>' +
              '<b>' + c.label + '</b><em>NDVI &ge; ' + nf(c.min, 2) + '</em>' +
              '<span>' + c.note + '</span></li>';
          }).join("") +
        '</ul>' +

        '<div class="nd__calc">' +
          '<p class="nd__k">Kalkulator serapan</p>' +
          '<div class="nd__row">' +
            '<label>Luas (ha)<input type="number" min="0" step="0.5" value="10" data-ha></label>' +
            '<label>Jenis<select data-kind>' +
              Object.keys(RATE).map(function (k) {
                return '<option value="' + k + '">' + RATE[k].label + '</option>';
              }).join("") +
            '</select></label>' +
          '</div>' +
          '<label class="nd__slider">NDVI komposit <b data-ndvi-val>0,65</b>' +
            '<input type="range" min="-0.2" max="0.95" step="0.01" value="0.65" data-ndvi>' +
          '</label>' +
          '<div class="nd__out" data-out></div>' +
        '</div>' +

        '<p class="nd__note">Semua angka adalah <b>estimasi terlacak</b> dengan rentang ' +
        'ketidakpastian &#9888; — bukan hasil pengukuran, bukan kredit karbon tersertifikasi. ' +
        'Citra 10 m tidak dapat menghitung pohon satu per satu, sehingga yang sah adalah ' +
        'estimasi per hektar. Sertifikasi, MRV pihak ketiga, dan registri masih dalam peta jalan.</p>' +
      '</div>';

    /* Gradien legenda dibangun dari fungsi warna yang sama dengan peta,
       jadi legenda tidak akan pernah berbeda dari yang tampil. */
    var stops = [];
    for (var v = -1; v <= 1.0001; v += 0.1) {
      stops.push(ndviColor(v) + " " + Math.round(((v + 1) / 2) * 100) + "%");
    }
    host.querySelector(".nd__ramp").style.background = "linear-gradient(90deg," + stops.join(",") + ")";

    host.querySelectorAll("[data-mode]").forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-mode");
        host.querySelectorAll("[data-mode]").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        host.querySelector(".nd").classList.toggle("nd--ndvi", mode === "ndvi");
        repaint();
      });
    });

    var haEl = host.querySelector("[data-ha]");
    var kindEl = host.querySelector("[data-kind]");
    var ndEl = host.querySelector("[data-ndvi]");
    var ndVal = host.querySelector("[data-ndvi-val]");
    var out = host.querySelector("[data-out]");

    function calc() {
      var ha = parseFloat(haEl.value) || 0;
      var nd = parseFloat(ndEl.value);
      var kind = kindEl.value;
      var e = estimate(ha, nd, kind);
      var s = setara(e.mid);
      ndVal.textContent = nf(nd, 2);

      out.innerHTML =
        '<div class="nd__big"><b>' + nf(e.mid, 1) + '</b><span>tCO&#8322;e / tahun</span></div>' +
        '<div class="nd__band"><i style="background:' + e.kelas.col + '"></i>' +
          '<span>rentang ' + nf(e.lo, 1) + ' &ndash; ' + nf(e.hi, 1) + ' &#9888;</span></div>' +
        '<div class="nd__split">' +
          '<div><b>' + nf(e.dijual, 1) + '</b><span>dapat diterbitkan (70%)</span></div>' +
          '<div><b>' + nf(e.cadangan, 1) + '</b><span>cadangan penyangga (30%)</span></div>' +
        '</div>' +
        '<p class="nd__eq">Kelas <b>' + e.kelas.label + '</b> &middot; tutupan kanopi ' +
          nf(e.fc * 100, 0) + '% &#9888;<br>Setara serapan tahunan dari &plusmn;' +
          nf(s.motor, 0) + ' motor harian, ' + nf(s.terbang, 0) +
          ' penerbangan Jakarta&ndash;Bali PP, atau listrik ' + nf(s.rumah, 0) + ' rumah &#9888;</p>';
    }

    [haEl, kindEl, ndEl].forEach(function (el) {
      el.addEventListener("input", calc);
      el.addEventListener("change", calc);
    });
    calc();
    repaint();
  }

  if (window.__GLYIV_PETA) boot();
  else window.addEventListener("glyiv:peta-siap", boot);
})();
