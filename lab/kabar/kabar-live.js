/* GLYIV KABAR — optional realtime layer. Loads Firebase via dynamic import
   inside try/catch, so if the CDN is blocked/offline the newsletter still works
   (kabar.js already rendered from local content with localStorage engagement).
   If Firestore (project glyiv-28711) is reachable & seeded, this upgrades
   window.KE to realtime shared views/likes/shares. */
(function () {
  "use strict";
  var CFG = {
    apiKey: "AIzaSyAB7BEYrSueFTi0GDg3GSySIceNJfN5aG8",
    authDomain: "glyiv-28711.firebaseapp.com",
    projectId: "glyiv-28711",
    storageBucket: "glyiv-28711.firebasestorage.app",
    messagingSenderId: "429607082737",
    appId: "1:429607082737:web:4890b9fab47f6b242aa750",
  };
  var COLL = "kabar_articles", V = "12.16.0";
  var cache = {}, upgraded = false;
  var LK = "glyiv_kabar_liked";
  function liked(slug) { try { return !!(JSON.parse(localStorage.getItem(LK) || "{}")[slug]); } catch (e) { return false; } }
  function setLiked(slug, on) { try { var m = JSON.parse(localStorage.getItem(LK) || "{}"); m[slug] = on; localStorage.setItem(LK, JSON.stringify(m)); } catch (e) {} }
  function toMs(v) { return !v ? 0 : (v.toMillis ? v.toMillis() : (v.seconds != null ? v.seconds * 1000 : (typeof v === "number" ? v : 0))); }

  (async function () {
    try {
      var appM = await import("https://www.gstatic.com/firebasejs/" + V + "/firebase-app.js");
      var fs = await import("https://www.gstatic.com/firebasejs/" + V + "/firebase-firestore.js");
      var db = fs.getFirestore(appM.initializeApp(CFG));
      var qy = fs.query(fs.collection(db, COLL), fs.where("status", "==", "published"));
      fs.onSnapshot(qy, function (snap) {
        var now = Date.now(), any = false;
        snap.forEach(function (d) { var a = d.data(); if (toMs(a.publishAt) <= now) { cache[d.id] = { views: a.views || 0, likes: a.likes || 0, shares: a.shares || 0 }; any = true; } });
        if (any && !upgraded) upgrade(db, fs);
        if (any && window.__kRefreshCounts) window.__kRefreshCounts();
      }, function () { /* rules not deployed / permission — stay on localStorage */ });
    } catch (e) { /* CDN blocked / offline — silent; localStorage KE remains */ }
  })();

  function inc(db, fs, slug, field, delta) { try { fs.updateDoc(fs.doc(db, COLL, slug), (function () { var o = {}; o[field] = fs.increment(delta); return o; })()).catch(function () {}); } catch (e) {} if (cache[slug]) { cache[slug][field] = Math.max(0, (cache[slug][field] || 0) + delta); if (window.__kRefreshCounts) window.__kRefreshCounts(); } }
  function upgrade(db, fs) {
    upgraded = true;
    var prev = window.KE;
    window.KE = {
      mode: "firestore",
      counts: function (a) { var c = cache[a.slug]; if (c) return { views: c.views, likes: c.likes, shares: c.shares, liked: liked(a.slug) }; return prev ? prev.counts(a) : { views: a.views || 0, likes: a.likes || 0, shares: a.shares || 0, liked: liked(a.slug) }; },
      view: function (slug) { var k = "kvf_" + slug, d = new Date().toISOString().slice(0, 10); try { if (localStorage.getItem(k) === d) return; localStorage.setItem(k, d); } catch (e) {} inc(db, fs, slug, "views", 1); },
      story: function (slug) { var k = "ksvf_" + slug, d = new Date().toISOString().slice(0, 10); try { if (localStorage.getItem(k) === d) return; localStorage.setItem(k, d); } catch (e) {} inc(db, fs, slug, "storyViews", 1); },
      share: function (slug) { inc(db, fs, slug, "shares", 1); },
      like: function (slug) { var now = !liked(slug); setLiked(slug, now); inc(db, fs, slug, "likes", now ? 1 : -1); return now; },
    };
    if (window.__kRefreshCounts) window.__kRefreshCounts();
  }
})();
