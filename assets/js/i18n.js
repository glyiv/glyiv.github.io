/* Glyiv i18n — Indonesian (default) ⇄ English.
   Mechanism: a client-side ID→EN dictionary applied by walking text nodes + key
   attributes, plus a MutationObserver so dynamically-rendered UI (demos, chat) is
   translated too. Locale is auto-detected (navigator.language + timezone); a manual
   pill lets the visitor override. Default language is Indonesian. */
(function () {
  "use strict";
  var STORE = "glyiv-lang";

  function resolveLang() {
    try {
      var saved = localStorage.getItem(STORE);
      if (saved === "en" || saved === "id") return saved;
    } catch (e) {}
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q === "en" || q === "id") return q;
    } catch (e) {}
    // auto-detect: Indonesian locale OR Indonesian timezone → id, otherwise → en
    var langs = ((navigator.languages && navigator.languages.join(",")) || navigator.language || "").toLowerCase();
    var tz = "";
    try { tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase(); } catch (e) {}
    var idTz = /jakarta|makassar|pontianak|jayapura|ujung_pandang/.test(tz);
    if (/\bid\b|id-|in-|^id|,id/.test(langs) || idTz) return "id";
    if (langs) return "en";
    return "id"; // ultimate fallback
  }

  var LANG = resolveLang();
  window.GLYIV_LANG = LANG;

  // dictionary (window.GLYIV_EN) is loaded on demand only for EN visitors
  var DICT = {};
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1, TEXTAREA: 1 };

  function norm(s) { return s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"); }
  function tr(key) {
    var v = DICT[key];
    if (v == null) v = DICT[norm(key)];
    return (typeof v === "string" && v.length) ? v : null;
  }

  function translateTextNodes(root) {
    if (!root || !root.ownerDocument && root.nodeType !== 9 && root.nodeType !== 1) return;
    var doc = root.ownerDocument || document;
    var walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        if (!p || SKIP[p.nodeName] || p.closest && p.closest("[data-i18n-skip]")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var batch = [], n;
    while ((n = walker.nextNode())) batch.push(n);
    batch.forEach(function (node) {
      var raw = node.nodeValue, key = raw.trim();
      var en = tr(key);
      if (en != null) node.nodeValue = raw.replace(key, en);
    });
  }

  var ATTRS = ["placeholder", "aria-label", "title", "alt"];
  function translateAttrs(scope) {
    var els = (scope.querySelectorAll ? scope : document).querySelectorAll("[placeholder],[aria-label],[title],[alt]");
    els.forEach(function (el) {
      ATTRS.forEach(function (a) {
        var v = el.getAttribute(a);
        if (v == null) return;
        var en = tr(v.trim());
        if (en != null) el.setAttribute(a, en);
      });
    });
  }

  function translate(scope) {
    var s = scope || document.body;
    if (!s) return;
    translateTextNodes(s);
    translateAttrs(s);
  }

  function translateAll() {
    if (document.title && tr(document.title.trim())) document.title = tr(document.title.trim());
    translate(document.body);
  }

  // ---- toggle pill ----
  function injectToggle() {
    if (document.getElementById("glyivLangPill")) return;
    var pill = document.createElement("button");
    pill.id = "glyivLangPill";
    pill.type = "button";
    pill.setAttribute("aria-label", "Language");
    pill.setAttribute("data-i18n-skip", "");
    pill.innerHTML =
      '<span class="' + (LANG === "id" ? "on" : "") + '">ID</span><i></i><span class="' + (LANG === "en" ? "on" : "") + '">EN</span>';
    var css = document.createElement("style");
    css.textContent =
      "#glyivLangPill{position:fixed;top:16px;right:78px;z-index:120;display:flex;align-items:center;gap:6px;" +
      "padding:7px 12px;border-radius:999px;border:1px solid rgba(138,255,193,.22);background:rgba(7,33,23,.72);" +
      "backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer;font-family:'Space Mono',ui-monospace,monospace;" +
      "font-size:11px;letter-spacing:.06em;color:#6f9580;box-shadow:0 8px 26px -12px rgba(0,0,0,.6);transition:.2s}" +
      "#glyivLangPill:hover{border-color:rgba(138,255,193,.4)}" +
      "#glyivLangPill span{transition:.2s}#glyivLangPill span.on{color:#33d188;font-weight:700}" +
      "#glyivLangPill i{width:1px;height:11px;background:rgba(138,255,193,.25);display:block}" +
      "@media(max-width:560px){#glyivLangPill{top:12px;right:66px;padding:6px 10px;font-size:10px}}";
    document.head.appendChild(css);
    pill.addEventListener("click", function () {
      var next = LANG === "id" ? "en" : "id";
      try { localStorage.setItem(STORE, next); } catch (e) {}
      location.reload();
    });
    document.body.appendChild(pill);
  }

  function startObserver() {
    try {
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          for (var j = 0; j < m.addedNodes.length; j++) {
            var nd = m.addedNodes[j];
            if (nd.nodeType === 1) translate(nd);
            else if (nd.nodeType === 3) {
              var key = (nd.nodeValue || "").trim(), en = tr(key);
              if (en != null) nd.nodeValue = nd.nodeValue.replace(key, en);
            }
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  function applyEn() {
    DICT = (window.GLYIV_EN && typeof window.GLYIV_EN === "object") ? window.GLYIV_EN : {};
    translateAll();
    startObserver();
    injectToggle();
    document.documentElement.classList.remove("i18n-hide");
  }

  function boot() {
    if (LANG === "en") {
      // load the EN dictionary on demand, then translate
      var s = document.createElement("script");
      s.src = "assets/js/i18n-en.js?v=9";
      s.onload = applyEn;
      s.onerror = function () { injectToggle(); document.documentElement.classList.remove("i18n-hide"); };
      document.head.appendChild(s);
    } else {
      injectToggle();
      document.documentElement.classList.remove("i18n-hide");
    }
  }

  // avoid a flash of Indonesian before EN is applied
  if (LANG === "en") {
    document.documentElement.classList.add("i18n-hide");
    var st = document.createElement("style");
    st.textContent = ".i18n-hide body{visibility:hidden!important}";
    (document.head || document.documentElement).appendChild(st);
    setTimeout(function () { document.documentElement.classList.remove("i18n-hide"); }, 1500); // safety reveal
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // expose for dynamic JS (chat prompts, demo strings)
  window.glyivT = function (id, en) { return LANG === "en" ? en : id; };
})();
