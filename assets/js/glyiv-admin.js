/* GLYIV — admin gate (classic script, loaded site-wide by glyiv-nav.js).
   - Reveals nav items marked .lnav__admin only when the Glyiv admin is signed in.
   - Gates /lab/landing/* pages behind Google sign-in (glyiv.archourium@gmail.com).
   Uses Firebase Auth via dynamic import (project glyiv-28711); the auth session
   persists across the whole glyiv.github.io domain (shared with Kabar Studio),
   so signing in once reveals the Landing directory everywhere. */
(function () {
  "use strict";
  if (window.__glyivAdmin) return; window.__glyivAdmin = true;
  var ADMIN = "glyiv.archourium@gmail.com";
  var V = "12.16.0";
  var CFG = {
    apiKey: "AIzaSyAB7BEYrSueFTi0GDg3GSySIceNJfN5aG8",
    authDomain: "glyiv-28711.firebaseapp.com",
    projectId: "glyiv-28711",
    storageBucket: "glyiv-28711.firebasestorage.app",
    messagingSenderId: "429607082737",
    appId: "1:429607082737:web:4890b9fab47f6b242aa750",
  };
  var isLanding = /\/lab\/landing\//.test(location.pathname);
  // universal admin login trigger: add #admin (or ?admin) to ANY url to open the sign-in.
  var forceLogin = /[?#&]admin\b/i.test(location.href);
  var authRef = null, providerRef = null, signInFn = null, signOutFn = null, resolved = false;

  function setAdmin(on) { var r = document.documentElement; if (on) r.setAttribute("data-admin", "1"); else r.removeAttribute("data-admin"); }

  /* ---- gate styles (self-contained) ---- */
  var css = document.createElement("style");
  css.textContent =
    "#glyiv-adgate{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:24px;" +
    "background:radial-gradient(120% 90% at 82% 8%,#12402d,#0F2E22 60%,#0a2116);font-family:'Hanken Grotesk',system-ui,sans-serif}" +
    "#glyiv-adgate .ag-card{background:#fff;border-radius:22px;max-width:420px;width:100%;padding:34px 30px;text-align:center;box-shadow:0 30px 80px -30px rgba(0,0,0,.6)}" +
    "#glyiv-adgate .ag-badge{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.16em;color:#B0894F;font-weight:600;margin-bottom:16px}" +
    "#glyiv-adgate h2{font-family:'Newsreader',Georgia,serif;font-weight:600;font-size:25px;color:#0F2E22;margin:0 0 8px}" +
    "#glyiv-adgate p{font-size:14px;color:#46524B;line-height:1.55;margin:0 0 22px}" +
    "#glyiv-adgate .ag-google{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;background:#0F2E22;color:#fff;border:0;border-radius:12px;padding:13px 18px;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer;transition:transform .18s,box-shadow .18s}" +
    "#glyiv-adgate .ag-google:hover{transform:translateY(-1px);box-shadow:0 12px 28px -12px rgba(15,46,34,.5)}" +
    "#glyiv-adgate .ag-google svg{width:18px;height:18px;background:#fff;border-radius:3px;padding:1px}" +
    "#glyiv-adgate .ag-alt{display:inline-block;margin-top:14px;font-size:12.5px;color:#6B7772;text-decoration:none;background:none;border:0;cursor:pointer;font-family:inherit}" +
    "#glyiv-adgate .ag-alt:hover{color:#0F2E22}" +
    "#glyiv-adgate .ag-spin{width:26px;height:26px;border:3px solid #E6EAE6;border-top-color:#1F7A6B;border-radius:50%;margin:6px auto 0;animation:agspin .8s linear infinite}" +
    "@keyframes agspin{to{transform:rotate(360deg)}}";
  (document.head || document.documentElement).appendChild(css);

  var GBTN = '<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.4 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.8-9.9 6.8-17.4z"/><path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.2 0 20 0 24s1 7.8 2.6 11l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.7 2.3-7.7 2.3-6.4 0-11.7-3.9-13.6-9.3l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

  var gate = null;
  function ensureGate() { if (!gate && document.body) { gate = document.createElement("div"); gate.id = "glyiv-adgate"; document.body.appendChild(gate); } return gate; }
  function showGate(state, dismissible) { // 'checking' | 'login' | 'denied'
    if (!ensureGate()) { return setTimeout(function () { showGate(state, dismissible); }, 30); }
    if (!dismissible) document.documentElement.style.overflow = "hidden";
    if (state === "checking") {
      gate.innerHTML = '<div class="ag-card"><div class="ag-badge">GLYIV · ADMIN</div><h2>Memeriksa akses…</h2><div class="ag-spin"></div></div>';
      return;
    }
    var msg = state === "denied"
      ? "<h2>Akses khusus admin</h2><p>Akun ini bukan admin Glyiv. Masuk dengan akun admin untuk membuka direktori Landing &amp; panel admin.</p>"
      : (dismissible
        ? "<h2>Masuk sebagai admin</h2><p>Masuk dengan Google (akun admin Glyiv) untuk membuka direktori Landing di navbar.</p>"
        : "<h2>Direktori Landing</h2><p>Halaman ini khusus admin Glyiv. Masuk dengan Google untuk melanjutkan.</p>");
    gate.innerHTML = '<div class="ag-card"><div class="ag-badge">GLYIV · ADMIN</div>' + msg +
      '<button class="ag-google" id="agLogin">' + GBTN + 'Lanjutkan dengan Google</button>' +
      (state === "denied" ? '<button class="ag-alt" id="agLogout">Keluar &amp; ganti akun</button>' : "") +
      (dismissible ? '<button class="ag-alt" id="agClose" style="display:block">Nanti saja</button>'
                   : '<a class="ag-alt" href="/" style="display:block">&larr; Kembali ke beranda</a>') + '</div>';
    document.getElementById("agLogin").onclick = doLogin;
    var lo = document.getElementById("agLogout"); if (lo) lo.onclick = doLogout;
    var cl = document.getElementById("agClose"); if (cl) cl.onclick = closeGate;
    if (dismissible) gate.onclick = function (e) { if (e.target === gate) closeGate(); };
  }
  function hideGate() { if (gate) { gate.remove(); gate = null; } document.documentElement.style.overflow = ""; }
  function closeGate() { hideGate(); if (/^#admin/i.test(location.hash)) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} } }

  function doLogin() { if (signInFn && authRef && providerRef) { signInFn(authRef, providerRef).catch(function (e) { console.warn("admin login:", e && e.message); }); } }
  function doLogout() { if (signOutFn && authRef) { signOutFn(authRef); } }
  window.GlyivAdmin = { login: doLogin, logout: doLogout, isAdmin: function () { return document.documentElement.hasAttribute("data-admin"); } };

  // On landing pages, cover content immediately (before auth resolves) to avoid a flash.
  if (isLanding) { if (document.body) showGate("checking"); else document.addEventListener("DOMContentLoaded", function () { showGate("checking"); }); }

  (async function () {
    try {
      var appM = await import("https://www.gstatic.com/firebasejs/" + V + "/firebase-app.js");
      var authM = await import("https://www.gstatic.com/firebasejs/" + V + "/firebase-auth.js");
      var app = appM.initializeApp(CFG);
      authRef = authM.getAuth(app);
      providerRef = new authM.GoogleAuthProvider();
      signInFn = authM.signInWithPopup; signOutFn = authM.signOut;
      authM.onAuthStateChanged(authRef, function (user) {
        resolved = true;
        var admin = !!(user && user.email === ADMIN);
        setAdmin(admin);
        if (admin) hideGate();
        else if (isLanding) showGate(user ? "denied" : "login", false);
        else if (forceLogin) showGate(user ? "denied" : "login", true);
      });
    } catch (e) {
      if (isLanding) showGate("login"); // CDN blocked: still offer login (will retry when online)
    }
  })();
})();
