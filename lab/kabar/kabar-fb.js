/* GLYIV KABAR — Firebase data + realtime engagement layer (ESM).
   Project glyiv-28711. Reads published articles from Firestore (collection
   `kabar_articles`), realtime views/likes/shares via onSnapshot + increment().
   Falls back to window.KABAR (local content pack) if Firestore is unavailable
   or empty, so the newsletter always renders. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, onSnapshot,
  query, where, orderBy, updateDoc, increment, setDoc, deleteDoc,
  writeBatch, serverTimestamp, Timestamp,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAB7BEYrSueFTi0GDg3GSySIceNJfN5aG8",
  authDomain: "glyiv-28711.firebaseapp.com",
  projectId: "glyiv-28711",
  storageBucket: "glyiv-28711.firebasestorage.app",
  messagingSenderId: "429607082737",
  appId: "1:429607082737:web:4890b9fab47f6b242aa750",
  measurementId: "G-TMBPLR0573",
};
export const ADMIN_EMAIL = "glyiv.archourium@gmail.com";
export const COLL = "kabar_articles";

let app = null, db = null, auth = null;
export let fbReady = false;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  fbReady = true;
} catch (e) { console.warn("Kabar: Firebase off, local fallback.", e && e.message); fbReady = false; }

export { db, auth, doc, collection, getDoc, getDocs, onSnapshot, query, where, orderBy, updateDoc, increment, setDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };

/* ---------- helpers ---------- */
const nowMs = () => Date.now();
export function toMs(v) {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (v.toMillis) return v.toMillis();            // Firestore Timestamp
  if (v.seconds != null) return v.seconds * 1000; // raw
  const t = Date.parse(v); return isNaN(t) ? 0 : t;
}
function slugify(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60); }

/* derive story slides from blocks when an article has none */
function deriveStory(a) {
  if (a.story && a.story.length) return a.story;
  const s = [{ kind: "cover", title: a.title, text: a.dek }];
  if (a.hook) s.push({ kind: "hook", title: a.hook });
  (a.blocks || []).forEach((b) => {
    if (b.t === "h2") s.push({ kind: "point", title: b.x });
    else if (b.t === "pull") s.push({ kind: "quote", text: b.x });
    else if (b.t === "stat") s.push({ kind: "stat", big: b.n, label: b.l, source: b.s });
  });
  s.push({ kind: "end", title: "Baca selengkapnya di Glyiv", text: "Wawasan karbon, jujur & bisa dipertanggungjawabkan." });
  return s.slice(0, 8);
}

export function normalize(a, id) {
  const slug = a.slug || id || slugify(a.title);
  return {
    slug, id: slug,
    topic: a.topic || "Kabar",
    mood: a.mood || "#1F7A6B",
    title: a.title || "",
    dek: a.dek || "",
    hook: a.hook || a.dek || a.title,
    cover: a.cover || "",
    author: a.author || "Redaksi Glyiv",
    role: a.role || "",
    read: a.read || 4,
    blocks: a.blocks || [],
    story: deriveStory(a),
    sources: a.sources || [],
    orb: a.orb || ("Tanya soal " + (a.topic || "ini")),
    views: a.views || 0, likes: a.likes || 0, shares: a.shares || 0, storyViews: a.storyViews || 0,
    status: a.status || "published",
    publishAt: a.publishAt != null ? toMs(a.publishAt) : (a.publishAtMs || 0),
  };
}

/* ---------- local fallback store ---------- */
const LKEY = "glyiv_kabar_stats", LLIKE = "glyiv_kabar_liked";
function lread(k) { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) { return {}; } }
function lwrite(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function localArticles() {
  const raw = (typeof window !== "undefined" && window.KABAR) ? window.KABAR : [];
  const st = lread(LKEY), lk = lread(LLIKE);
  return raw.map((a, i) => {
    const n = normalize(a);
    const s = st[n.slug] || {};
    n.views += (s.views || 0); n.likes += (s.likes || 0); n.shares += (s.shares || 0); n.storyViews += (s.storyViews || 0);
    n._liked = !!lk[n.slug];
    n.publishAt = n.publishAt || (nowMs() - i * 864e5);
    return n;
  });
}

/* ---------- reads ---------- */
export async function listArticles() {
  if (fbReady) {
    try {
      const snap = await getDocs(query(collection(db, COLL), where("status", "==", "published")));
      let arr = snap.docs.map((d) => normalize(d.data(), d.id)).filter((a) => a.publishAt <= nowMs());
      if (arr.length) { arr.sort((a, b) => b.publishAt - a.publishAt); markLiked(arr); return arr; }
    } catch (e) { console.warn("Kabar list fallback:", e && e.code); }
  }
  return localArticles();
}
export async function getArticle(slug) {
  if (fbReady) {
    try { const d = await getDoc(doc(db, COLL, slug)); if (d.exists()) { const a = normalize(d.data(), d.id); a._liked = isLikedLocal(slug); return a; } }
    catch (e) { /* fall through */ }
  }
  return localArticles().find((a) => a.slug === slug) || null;
}
/* realtime: call cb(article) on every change to counts */
export function listenArticle(slug, cb) {
  if (fbReady) {
    try { return onSnapshot(doc(db, COLL, slug), (d) => { if (d.exists()) { const a = normalize(d.data(), d.id); a._liked = isLikedLocal(slug); cb(a); } }); }
    catch (e) {}
  }
  const a = localArticles().find((x) => x.slug === slug); if (a) cb(a);
  return () => {};
}
export function listenFeed(cb) {
  if (fbReady) {
    try { return onSnapshot(query(collection(db, COLL), where("status", "==", "published")), (snap) => {
      let arr = snap.docs.map((d) => normalize(d.data(), d.id)).filter((a) => a.publishAt <= nowMs());
      if (arr.length) { arr.sort((a, b) => b.publishAt - a.publishAt); markLiked(arr); cb(arr); }
      else cb(localArticles());
    }); } catch (e) {}
  }
  cb(localArticles());
  return () => {};
}

function isLikedLocal(slug) { return !!lread(LLIKE)[slug]; }
function markLiked(arr) { const lk = lread(LLIKE); arr.forEach((a) => { a._liked = !!lk[a.slug]; }); }

/* ---------- writes (engagement) ---------- */
export async function recordView(slug) {
  const seen = "kv_" + slug, today = new Date().toISOString().slice(0, 10);
  try { if (localStorage.getItem(seen) === today) return; localStorage.setItem(seen, today); } catch (e) {}
  bump(slug, "views", 1);
}
export async function recordStoryView(slug) {
  const seen = "ksv_" + slug, today = new Date().toISOString().slice(0, 10);
  try { if (localStorage.getItem(seen) === today) return; localStorage.setItem(seen, today); } catch (e) {}
  bump(slug, "storyViews", 1);
}
export async function recordShare(slug) { bump(slug, "shares", 1); }
export async function toggleLike(slug) {
  const lk = lread(LLIKE); const nowLiked = !lk[slug]; lk[slug] = nowLiked; lwrite(LLIKE, lk);
  bump(slug, "likes", nowLiked ? 1 : -1);
  return nowLiked;
}
function bump(slug, field, delta) {
  if (fbReady) {
    updateDoc(doc(db, COLL, slug), { [field]: increment(delta) }).catch(() => bumpLocal(slug, field, delta));
  } else { bumpLocal(slug, field, delta); }
}
function bumpLocal(slug, field, delta) { const st = lread(LKEY); st[slug] = st[slug] || {}; st[slug][field] = Math.max(0, (st[slug][field] || 0) + delta); lwrite(LKEY, st); }

export function isLiked(slug) { return isLikedLocal(slug); }
