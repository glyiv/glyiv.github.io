/* GLYIV CIP DEMO — reusable per-industry widget: Kalkulator jejak + Agen AI + Offset.
   Usage: <div data-cip-demo="SLUG"></div> ; needs window.CIP_DATA (cip-data.js).
   Optional: /assets/js/glyiv-sources.js for the "ⓘ sumber" modals on emission factors.
   Self-contained styling (cipw- scoped, own tokens). */
(function () {
  "use strict";
  if (window.__cipDemo) return; window.__cipDemo = true;

  var CSS = ''
    + '.cipw{--cp:#0F2E22;--ct:#1F7A6B;--cb:#B0894F;--cm:#6B7772;--cs:#46524B;--ch:#E6EAE6;--cp2:#F5F7F5;'
    + '--cf-serif:"Newsreader",Georgia,serif;--cf-sans:"Hanken Grotesk",system-ui,sans-serif;--cf-mono:"IBM Plex Mono",monospace;'
    + 'background:#fff;border:1px solid var(--ch);border-radius:22px;box-shadow:0 2px 10px rgba(15,26,20,.05),0 22px 48px -22px rgba(15,26,20,.16);overflow:hidden;color:var(--cs)}'
    + '.cipw *{box-sizing:border-box}'
    + '.cipw__hd{padding:22px 24px 16px;border-bottom:1px solid var(--ch)}'
    + '.cipw__k{font-family:var(--cf-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--cb);font-weight:600}'
    + '.cipw__hd h3{font-family:var(--cf-serif);font-weight:600;font-size:clamp(19px,2.4vw,25px);color:var(--cp);margin:8px 0 5px;line-height:1.12}'
    + '.cipw__hd p{font-size:13px;color:var(--cm);margin:0;line-height:1.5;max-width:64ch}'
    + '.cipw__grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr)}'
    + '.cipw__calc{padding:20px 24px;border-right:1px solid var(--ch)}'
    + '.cipw__side{display:flex;flex-direction:column}'
    + '.cipw__ct{display:flex;align-items:center;gap:8px;font-family:var(--cf-mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--ct);font-weight:600;margin-bottom:14px}'
    + '.cipw__ct span{margin-left:auto;color:var(--cm);font-weight:400;text-transform:none;letter-spacing:0}'
    + '.cipw__row{display:grid;grid-template-columns:1.5fr 1.05fr auto;gap:8px 12px;align-items:center;padding:11px 0;border-bottom:1px dashed var(--ch)}'
    + '.cipw__row:first-of-type{padding-top:2px}'
    + '.cipw__lab{font-size:12.5px;color:var(--cp);font-weight:600;line-height:1.3}'
    + '.cipw__lab small{display:block;font-family:var(--cf-mono);font-size:8.5px;color:var(--cm);font-weight:400;margin-top:2px}'
    + '.cipw__in{display:flex;align-items:center;border:1px solid var(--ch);border-radius:9px;overflow:hidden;background:var(--cp2)}'
    + '.cipw__in input{width:100%;min-width:0;border:0;background:none;outline:0;padding:9px 8px;font-family:var(--cf-serif);font-size:15px;color:var(--cp);text-align:right}'
    + '.cipw__in .u{font-family:var(--cf-mono);font-size:9px;color:var(--cm);padding:0 9px;white-space:nowrap}'
    + '.cipw__em{grid-column:1/-1;display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:-2px}'
    + '.cipw__ef{font-family:var(--cf-mono);font-size:10px;color:var(--cm);background:var(--cp2);border:1px solid var(--ch);border-radius:7px;padding:4px 8px}'
    + '.cipw__ef b{color:var(--cs)}'
    + '.cipw__arrow{color:var(--cm);font-size:11px}'
    + '.cipw__val{font-family:var(--cf-serif);font-weight:600;font-size:15px;color:var(--ct)}'
    + '.cipw__val.hot{color:var(--cb)}'
    + '.cipw__bar{grid-column:1/-1;height:5px;border-radius:999px;background:var(--cp2);overflow:hidden;margin-top:2px}'
    + '.cipw__bar i{display:block;height:100%;background:linear-gradient(90deg,var(--ct),#57b97e);border-radius:999px;transition:width .5s cubic-bezier(.2,.7,.2,1)}'
    + '.cipw__bar i.hot{background:linear-gradient(90deg,var(--cb),#e0c48f)}'
    + '.cipw__total{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:2px solid var(--cp)}'
    + '.cipw__total .t{font-family:var(--cf-mono);font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--cm)}'
    + '.cipw__total b{font-family:var(--cf-serif);font-weight:600;font-size:30px;color:var(--cp);line-height:1}'
    + '.cipw__total b span{font-size:15px;color:var(--cm)}'
    + '.cipw__total small{margin-left:auto;font-family:var(--cf-mono);font-size:9px;color:var(--cm)}'
    + '.cipw__agent{padding:20px 22px;border-bottom:1px solid var(--ch);background:linear-gradient(180deg,rgba(31,122,107,.045),transparent)}'
    + '.cipw__live{display:inline-flex;align-items:center;gap:6px}'
    + '.cipw__live i{width:7px;height:7px;border-radius:50%;background:var(--ct);box-shadow:0 0 0 0 rgba(31,122,107,.4);animation:cipwPulse 1.8s infinite}'
    + '@keyframes cipwPulse{0%{box-shadow:0 0 0 0 rgba(31,122,107,.4)}70%{box-shadow:0 0 0 7px rgba(31,122,107,0)}100%{box-shadow:0 0 0 0 rgba(31,122,107,0)}}'
    + '.cipw__hot2{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--cp);background:rgba(176,137,79,.09);border:1px solid rgba(176,137,79,.25);border-radius:10px;padding:9px 11px;margin-bottom:11px}'
    + '.cipw__hot2 b{color:var(--cb)}'
    + '.cipw__think{display:flex;align-items:center;gap:9px;color:var(--cm);font-size:12.5px;padding:6px 0}'
    + '.cipw__think .sp{width:15px;height:15px;border:2px solid rgba(31,122,107,.25);border-top-color:var(--ct);border-radius:50%;animation:cipwSpin .8s linear infinite;flex:0 0 auto}'
    + '@keyframes cipwSpin{to{transform:rotate(360deg)}}'
    + '.cipw__insight{font-size:12.8px;line-height:1.6;color:var(--cs);margin:0;opacity:0;transition:opacity .5s}'
    + '.cipw__insight.show{opacity:1}'
    + '.cipw__offset{padding:20px 22px}'
    + '.cipw__trees{display:flex;align-items:center;gap:12px;margin-bottom:11px}'
    + '.cipw__trees .tn{font-family:var(--cf-serif);font-weight:600;font-size:30px;color:var(--ct);line-height:1}'
    + '.cipw__trees .tl{font-size:11.5px;color:var(--cm);line-height:1.35}'
    + '.cipw__leaf{width:34px;height:34px;flex:0 0 auto;border-radius:10px;background:rgba(31,122,107,.1);display:grid;place-items:center;color:var(--ct)}'
    + '.cipw__offset p{font-size:11.8px;line-height:1.55;color:var(--cm);margin:0 0 12px}'
    + '.cipw__cta{display:inline-flex;align-items:center;gap:7px;font-family:var(--cf-sans);font-weight:700;font-size:12.5px;color:#fff;background:var(--cp);border-radius:999px;padding:9px 15px;text-decoration:none;transition:background .18s}'
    + '.cipw__cta:hover{background:var(--ct)}'
    + '.cipw__foot{padding:12px 24px;background:var(--cp2);border-top:1px solid var(--ch);font-family:var(--cf-mono);font-size:9px;color:var(--cm);line-height:1.5}'
    + '@media(max-width:760px){.cipw__grid{grid-template-columns:1fr}.cipw__calc{border-right:0;border-bottom:1px solid var(--ch)}.cipw__row{grid-template-columns:1fr auto}.cipw__lab{grid-column:1/-1}}';

  function inject() { if (document.getElementById("cipw-css")) return; var s = document.createElement("style"); s.id = "cipw-css"; s.textContent = CSS; document.head.appendChild(s); }
  function fmt(n) { return Math.round(n).toLocaleString("id-ID"); }
  function tonnes(kg) { return kg / 1000; }
  function emStr(kg) { return kg >= 1000 ? (kg / 1000 >= 100 ? fmt(kg / 1000) : (kg / 1000).toFixed(1)) + " t" : fmt(kg) + " kg"; }

  function build(el, slug) {
    var cfg = (window.CIP_DATA || {})[slug];
    if (!cfg) { el.innerHTML = '<p style="font-family:monospace;color:#888">CIP demo: data untuk "' + slug + '" belum tersedia.</p>'; return; }
    el.className = "cipw";
    var rows = cfg.inputs.map(function (x, i) {
      var srcAttr = x.url ? (x.src + "|" + x.url) : x.src;
      return '<div class="cipw__row" data-row="' + i + '">'
        + '<div class="cipw__lab">' + x.label + (x.scope ? '<small>Scope ' + x.scope + '</small>' : '') + '</div>'
        + '<div class="cipw__in"><input type="number" min="0" step="any" value="' + x.qty + '" data-q="' + i + '" name="cip-' + slug + '-' + i + '" aria-label="' + x.label.replace(/"/g, "&quot;").replace(/ ⚠︎/, "") + ' (' + x.unit + ')"><span class="u">' + x.unit + '</span></div>'
        + '<div class="cipw__em">'
          + '<span class="cipw__ef" data-src="' + srcAttr.replace(/"/g, "&quot;") + '" data-src-title="Faktor emisi">EF <b>' + (x.ef >= 1 ? fmt(x.ef) : x.ef) + '</b> kg/' + x.unit + '</span>'
          + '<span class="cipw__arrow">=</span><span class="cipw__val" data-v="' + i + '">—</span>'
          + '<span class="cipw__bar" style="flex:1"><i data-b="' + i + '" style="width:0%"></i></span>'
        + '</div></div>';
    }).join("");

    el.innerHTML =
      '<div class="cipw__hd"><span class="cipw__k">Demo interaktif · pratinjau</span>'
        + '<h3>Ukur → Agen AI → Offset: ' + cfg.name + '</h3>'
        + '<p>Ubah angka aktivitas untuk melihat estimasi jejak karbon dihitung real-time (faktor emisi bersumber, klik ⓘ), lalu rekomendasi Agen AI &amp; skenario offset. Angka ilustrasi &amp; contoh — <b>estimasi terlacak, bukan pengukuran presisi</b>.</p></div>'
      + '<div class="cipw__grid">'
        + '<div class="cipw__calc"><div class="cipw__ct">1 · Kalkulator jejak <span>activity-based LCA</span></div>' + rows
          + '<div class="cipw__total"><span class="t">Total estimasi</span><b data-total><span data-total-n>—</span><span> tCO₂e/thn</span></b><small>Scope campuran · ⚠︎ ilustrasi</small></div></div>'
        + '<div class="cipw__side">'
          + '<div class="cipw__agent"><div class="cipw__ct"><span class="cipw__live"><i></i>2 · Agen AI Glyiv</span></div>'
            + '<div class="cipw__hot2">Hotspot emisi: <b data-hot>—</b></div>'
            + '<div class="cipw__think" data-think><span class="sp"></span> Agen menganalisis pola emisi…</div>'
            + '<p class="cipw__insight" data-insight>' + cfg.agent + '</p></div>'
          + '<div class="cipw__offset"><div class="cipw__ct">3 · Offset &amp; kontribusi</div>'
            + '<div class="cipw__trees"><span class="cipw__leaf"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3C7 3 3 7 3 12c0 3 1.5 5.5 3.8 7C7 14 11 10 17 8c-4 3.5-6.5 8-7 11.5C15.5 20 21 16 21 9c0-3.3-4-6-9-6z"/></svg></span>'
              + '<div><div class="tn" data-trees>—</div><div class="tl">pohon/thn setara<br><span style="font-family:var(--cf-mono);font-size:8.5px">~22 kgCO₂e/pohon/thn ⚠︎</span></div></div></div>'
            + '<p>' + cfg.offset + '</p>'
            + '<a class="cipw__cta" href="/lab/apps/tree-marketplace/">Buka Tree Marketplace →</a></div>'
        + '</div></div>'
      + '<div class="cipw__foot">Metodologi: activity-based process-LCA (aktivitas × faktor emisi) selaras GHG Protocol &amp; ISO 14064; faktor dari ecoinvent, DEFRA/DESNZ, IEA, worldsteel, GCCA, EXIOBASE, IPCC. Faktor global/rata-rata — verifikasi spesifik-lokasi diperlukan sebelum pelaporan resmi. Sertifikasi dalam roadmap.</div>';

    var inputs = [].slice.call(el.querySelectorAll("[data-q]"));
    function recompute() {
      var ems = cfg.inputs.map(function (x, i) { var q = parseFloat(inputs[i].value) || 0; return q * x.ef; });
      var totalKg = ems.reduce(function (a, b) { return a + b; }, 0);
      var max = Math.max.apply(null, ems.concat([0])), hotIdx = ems.indexOf(max);
      ems.forEach(function (kg, i) {
        var v = el.querySelector('[data-v="' + i + '"]'), b = el.querySelector('[data-b="' + i + '"]');
        v.textContent = emStr(kg); v.classList.toggle("hot", i === hotIdx && kg > 0);
        var pct = totalKg > 0 ? kg / totalKg * 100 : 0;
        b.style.width = pct.toFixed(1) + "%"; b.classList.toggle("hot", i === hotIdx && kg > 0);
      });
      var tt = tonnes(totalKg);
      tween(el.querySelector("[data-total-n]"), tt, 1);
      var hotPct = totalKg > 0 ? (max / totalKg * 100) : 0;
      el.querySelector("[data-hot]").innerHTML = (totalKg > 0 ? cfg.inputs[hotIdx].label.replace(/ ⚠︎/, "") + " · " + hotPct.toFixed(0) + "%" : "—");
      tween(el.querySelector("[data-trees]"), totalKg / 22, 0);
    }
    function tween(node, to, mode) {
      if (!node) return;
      var from = node._v || 0, t0 = null;
      function f(v) { return mode === 0 ? Math.round(v).toLocaleString("id-ID") : (v >= 100 ? Math.round(v).toLocaleString("id-ID") : v.toFixed(1)); }
      if (node._raf) cancelAnimationFrame(node._raf);
      function step(t) { if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / 500), e = 1 - Math.pow(1 - p, 3), v = from + (to - from) * e; node.textContent = f(v); if (p < 1) { node._raf = requestAnimationFrame(step); } else { node._v = to; node._raf = 0; } }
      node._raf = requestAnimationFrame(step);
    }
    inputs.forEach(function (inp) { inp.addEventListener("input", recompute); });
    recompute();

    // agent "thinking" reveal on first view
    var revealed = false;
    function reveal() {
      if (revealed) return; revealed = true;
      setTimeout(function () {
        var th = el.querySelector("[data-think]"); if (th) th.style.display = "none";
        el.querySelector("[data-insight]").classList.add("show");
      }, 1100);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { reveal(); io.disconnect(); } }); }, { threshold: .25 });
      io.observe(el);
    } else reveal();

    if (window.GlyivSources) window.GlyivSources.scan(el);
  }

  function init() {
    inject();
    [].slice.call(document.querySelectorAll("[data-cip-demo]")).forEach(function (el) { build(el, el.getAttribute("data-cip-demo")); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
