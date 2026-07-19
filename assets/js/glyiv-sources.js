/* GLYIV SOURCES — click-to-view data provenance. Self-contained (injects its own CSS + modal).
   Usage: add data-src="Label satu|https://url ;; Label dua|" to ANY element that shows data.
   A small "ⓘ sumber" affordance is inserted after it; clicking opens a modal listing the sources.
   Include once per page: <script src="/assets/js/glyiv-sources.js" defer></script> */
(function () {
  "use strict";
  if (window.GlyivSources) return;
  var esc = function (s) { return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  var css = document.createElement("style");
  css.textContent =
    ".gsrc-btn{display:inline-flex;align-items:center;gap:4px;margin-left:8px;vertical-align:middle;" +
    "font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.04em;text-transform:uppercase;" +
    "color:#6B7772;background:rgba(31,122,107,.07);border:1px solid rgba(31,122,107,.18);border-radius:999px;" +
    "padding:2px 8px;cursor:pointer;transition:.16s;line-height:1.6;white-space:nowrap}" +
    ".gsrc-btn:hover{color:#1F7A6B;background:rgba(31,122,107,.13);border-color:rgba(31,122,107,.4)}" +
    ".gsrc-btn.on-dark{color:#bff0d5;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}" +
    ".gsrc-btn.on-dark:hover{color:#fff;background:rgba(255,255,255,.16)}" +
    ".gsrc-modal{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:22px;" +
    "background:rgba(8,20,14,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}" +
    ".gsrc-modal.open{display:flex;animation:gsrcIn .2s ease}" +
    "@keyframes gsrcIn{from{opacity:0}to{opacity:1}}" +
    ".gsrc-card{background:#fff;border:1px solid #E6EAE6;border-radius:18px;max-width:440px;width:100%;padding:24px;" +
    "box-shadow:0 30px 80px -30px rgba(8,20,14,.5);position:relative;font-family:'Hanken Grotesk',system-ui,sans-serif;color:#1a2621}" +
    ".gsrc-card h4{font-family:'Newsreader',Georgia,serif;font-weight:600;font-size:19px;color:#0F2E22;margin:0 0 4px}" +
    ".gsrc-card .gsrc-sub{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#B0894F;margin:0 0 16px}" +
    ".gsrc-x{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:9px;border:1px solid #E6EAE6;background:#fff;" +
    "color:#6B7772;font-size:18px;line-height:1;cursor:pointer;display:grid;place-items:center}.gsrc-x:hover{color:#0F2E22;border-color:#0F2E22}" +
    ".gsrc-item{padding:11px 0;border-bottom:1px solid #EEF1EE;font-size:14px}.gsrc-item:last-of-type{border-bottom:0}" +
    ".gsrc-item a{color:#1F7A6B;text-decoration:none;font-weight:600}.gsrc-item a:hover{text-decoration:underline}" +
    ".gsrc-item span{color:#46524B}" +
    ".gsrc-item small{display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#6B7772;margin-top:3px}" +
    ".gsrc-note{margin:16px 0 0;font-family:'IBM Plex Mono',monospace;font-size:10px;line-height:1.5;color:#6B7772}";
  document.head.appendChild(css);

  var modal = document.createElement("div");
  modal.className = "gsrc-modal";
  modal.setAttribute("role", "dialog");
  modal.innerHTML = '<div class="gsrc-card"><button class="gsrc-x" aria-label="Tutup">&times;</button>' +
    '<h4>Sumber data</h4><div class="gsrc-sub">Transparansi &middot; Glyiv</div><div class="gsrc-list"></div>' +
    '<p class="gsrc-note">Pratinjau produk: sebagian angka bersifat ilustrasi. Item bertanda &#9888;&#65038; adalah acuan yang perlu diverifikasi ulang sebelum dipakai untuk keputusan eksternal.</p></div>';
  var mount = function () {
    if (!document.body) { return setTimeout(mount, 30); }
    document.body.appendChild(modal);
  };
  mount();
  var list = modal.querySelector(".gsrc-list");

  function open(srcs, title) {
    modal.querySelector("h4").textContent = title || "Sumber data";
    list.innerHTML = (srcs || []).map(function (s) {
      var lbl = esc(s.label);
      return '<div class="gsrc-item">' + (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + lbl + " &#8599;</a>" : '<span>' + lbl + "</span>") + (s.note ? "<small>" + esc(s.note) + "</small>" : "") + "</div>";
    }).join("") || '<div class="gsrc-item"><span>Sumber menyusul.</span></div>';
    modal.classList.add("open");
  }
  function close() { modal.classList.remove("open"); }
  modal.addEventListener("click", function (e) { if (e.target === modal || e.target.classList.contains("gsrc-x")) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  function parse(str) {
    return (str || "").split(";;").map(function (x) {
      var seg = x.split("|");
      return { label: (seg[0] || "").trim(), url: (seg[1] || "").trim(), note: (seg[2] || "").trim() };
    }).filter(function (s) { return s.label; });
  }
  function wire(el) {
    if (el.getAttribute("data-src-wired")) return;
    el.setAttribute("data-src-wired", "1");
    var srcs = parse(el.getAttribute("data-src"));
    if (!srcs.length) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "gsrc-btn" + (el.hasAttribute("data-src-dark") ? " on-dark" : "");
    b.innerHTML = "&#9432; sumber";
    b.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); open(srcs, el.getAttribute("data-src-title")); });
    if (el.getAttribute("data-src-inside")) el.appendChild(b);
    else el.insertAdjacentElement("afterend", b);
  }
  function scan(root) { Array.prototype.forEach.call((root || document).querySelectorAll("[data-src]"), wire); }
  window.GlyivSources = { open: open, scan: scan };
  if (document.readyState !== "loading") scan(); else document.addEventListener("DOMContentLoaded", function () { scan(); });
})();
