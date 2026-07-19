/* GLYIV KABAR — Studio (admin) logic. Google login gated to ADMIN_EMAIL.
   Queue table, publish/schedule/unpublish/delete, and content-pack import
   into Firestore (collection kabar_articles) with daily-drip scheduling. */
import {
  db, auth, COLL, ADMIN_EMAIL, fbReady, normalize, toMs,
  collection, doc, getDocs, setDoc, deleteDoc, updateDoc, Timestamp,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from "./kabar-fb.js";

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const fmt = (n) => (n || 0).toLocaleString("id-ID");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const dstr = (ms) => { if (!ms) return "—"; const d = new Date(ms); return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }); };
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 2600); }

let ITEMS = [];

/* ---- auth ---- */
function initAuth() {
  if (!fbReady) { showState("err", "Firebase tidak aktif di lingkungan ini."); return; }
  onAuthStateChanged(auth, (u) => {
    if (!u) { showState("login"); return; }
    if (u.email !== ADMIN_EMAIL) { showState("denied", u.email); return; }
    $("#who").textContent = u.email;
    showState("app"); loadAll();
  });
  $("#signin").addEventListener("click", () => signInWithPopup(auth, new GoogleAuthProvider().setCustomParameters({ prompt: "select_account" })).catch((e) => toast("Login gagal: " + (e.code || e.message))));
  $("#signout").addEventListener("click", () => signOut(auth));
}
function showState(s, extra) {
  ["login", "denied", "app", "err"].forEach((k) => { const el = $("#state-" + k); if (el) el.style.display = k === s ? "" : "none"; });
  if (s === "denied") $("#deniedEmail").textContent = extra || "";
  if (s === "err") $("#errMsg").textContent = extra || "";
}

/* ---- data ---- */
async function loadAll() {
  $("#rows").innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#6B7772">Memuat…</td></tr>';
  try {
    const snap = await getDocs(collection(db, COLL));
    ITEMS = snap.docs.map((d) => normalize(d.data(), d.id)).sort((a, b) => b.publishAt - a.publishAt);
    renderStats(); renderRows();
    if (!ITEMS.length) $("#rows").innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#6B7772">Belum ada artikel di Firestore. Klik <b>Import Content Pack</b> untuk mengisi antrean.</td></tr>';
  } catch (e) {
    $("#rows").innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#c0392b">Gagal membaca: ${esc(e.code || e.message)}.<br><small>Pastikan firestore.rules sudah di-deploy &amp; domain diizinkan.</small></td></tr>`;
  }
}
function statusOf(a) { if (a.status !== "published") return "draft"; return a.publishAt > Date.now() ? "scheduled" : "live"; }
function renderStats() {
  const live = ITEMS.filter((a) => statusOf(a) === "live").length;
  const sched = ITEMS.filter((a) => statusOf(a) === "scheduled").length;
  const draft = ITEMS.filter((a) => statusOf(a) === "draft").length;
  const V = ITEMS.reduce((s, a) => s + (a.views || 0), 0), L = ITEMS.reduce((s, a) => s + (a.likes || 0), 0), S = ITEMS.reduce((s, a) => s + (a.shares || 0), 0);
  $("#stats").innerHTML = [["Total", ITEMS.length], ["Live", live], ["Terjadwal", sched], ["Draft", draft], ["Views", fmt(V)], ["Likes", fmt(L)], ["Shares", fmt(S)]]
    .map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("");
}
function renderRows() {
  const q = ($("#search").value || "").toLowerCase();
  const list = ITEMS.filter((a) => !q || a.title.toLowerCase().includes(q) || a.topic.toLowerCase().includes(q));
  $("#rows").innerHTML = list.map((a) => {
    const st = statusOf(a);
    const pill = { live: "🟢 Live", scheduled: "🕒 Terjadwal", draft: "⚪ Draft" }[st];
    return `<tr>
      <td><div class="tt"><span class="dot" style="background:${esc(a.mood)}"></span><div><b>${esc(a.title)}</b><small>${esc(a.topic)} · ${esc(a.slug)}</small></div></div></td>
      <td><span class="pill ${st}">${pill}</span></td>
      <td class="mono">${dstr(a.publishAt)}</td>
      <td class="mono">${fmt(a.views)} · ${fmt(a.likes)}♥ · ${fmt(a.shares)}↗</td>
      <td class="act">
        <a href="artikel.html?a=${encodeURIComponent(a.slug)}" target="_blank" title="Pratinjau">👁</a>
        ${st !== "live" ? `<button data-pub="${esc(a.slug)}" title="Terbitkan sekarang">▲</button>` : ""}
        <button data-sched="${esc(a.slug)}" title="Jadwalkan">🕒</button>
        ${st !== "draft" ? `<button data-draft="${esc(a.slug)}" title="Jadikan draft">⏸</button>` : ""}
        <button data-del="${esc(a.slug)}" title="Hapus" class="del">✕</button>
      </td>
    </tr>`;
  }).join("");
  $$("[data-pub]").forEach((b) => b.addEventListener("click", () => setPublish(b.dataset.pub, Date.now(), "published")));
  $$("[data-draft]").forEach((b) => b.addEventListener("click", () => setPublish(b.dataset.draft, null, "draft")));
  $$("[data-sched]").forEach((b) => b.addEventListener("click", () => schedule(b.dataset.sched)));
  $$("[data-del]").forEach((b) => b.addEventListener("click", () => del(b.dataset.del)));
}
async function setPublish(slug, whenMs, status) {
  try {
    const patch = { status };
    if (whenMs != null) patch.publishAt = Timestamp.fromMillis(whenMs);
    await updateDoc(doc(db, COLL, slug), patch);
    toast("Diperbarui: " + slug); loadAll();
  } catch (e) { toast("Gagal: " + (e.code || e.message)); }
}
function schedule(slug) {
  const cur = ITEMS.find((a) => a.slug === slug);
  const def = new Date(cur && cur.publishAt ? cur.publishAt : Date.now() + 864e5);
  const val = prompt("Jadwalkan terbit (YYYY-MM-DD HH:MM):", def.toISOString().slice(0, 16).replace("T", " "));
  if (!val) return;
  const ms = Date.parse(val.replace(" ", "T"));
  if (isNaN(ms)) { toast("Format tanggal tidak valid"); return; }
  setPublish(slug, ms, "published");
}
async function del(slug) {
  if (!confirm("Hapus artikel '" + slug + "'? Tindakan ini permanen.")) return;
  try { await deleteDoc(doc(db, COLL, slug)); toast("Dihapus: " + slug); loadAll(); }
  catch (e) { toast("Gagal hapus: " + (e.code || e.message)); }
}

/* ---- import content pack ---- */
function corpus() {
  const base = (window.KABAR || []);
  const pack = (window.KABAR_PACK || []);
  const seen = new Set(); const out = [];
  base.concat(pack).forEach((a) => { const n = normalize(a); if (!seen.has(n.slug)) { seen.add(n.slug); out.push(n); } });
  return out;
}
async function runImport() {
  const all = corpus();
  if (!all.length) { toast("Content pack kosong."); return; }
  // existing slugs (skip to preserve engagement)
  let existing = new Set();
  try { const snap = await getDocs(collection(db, COLL)); existing = new Set(snap.docs.map((d) => d.id)); } catch (e) {}
  const fresh = all.filter((a) => !existing.has(a.slug));
  if (!fresh.length) { toast("Semua artikel sudah ada di Firestore."); return; }
  if (!confirm(`Import ${fresh.length} artikel baru ke Firestore?\n(Counters mulai dari 0 = real, bukan dummy. Yang sudah ada dilewati.)`)) return;
  // schedule: first 10 live/today staggered, rest one per day
  const now = Date.now(), DAY = 864e5;
  const bar = $("#impbar"), imp = $("#import"); imp.disabled = true;
  let done = 0;
  for (let i = 0; i < fresh.length; i++) {
    const a = fresh[i];
    let publishAt;
    if (i < 10) publishAt = now - (10 - i) * 3600e3;      // 10 live now (staggered past hours)
    else publishAt = now + (i - 9) * DAY;                  // rest: +1 day each (daily drip)
    const docData = {
      slug: a.slug, topic: a.topic, mood: a.mood, title: a.title, dek: a.dek, hook: a.hook,
      cover: a.cover, author: a.author, role: a.role, read: a.read,
      blocks: a.blocks, story: a.story, sources: a.sources, orb: a.orb,
      views: 0, likes: 0, shares: 0, storyViews: 0,
      status: "published", publishAt: Timestamp.fromMillis(publishAt), createdAt: Timestamp.fromMillis(now),
    };
    try { await setDoc(doc(db, COLL, a.slug), docData); done++; }
    catch (e) { console.warn("import fail", a.slug, e.code); if (e.code === "permission-denied") { toast("Ditolak — deploy firestore.rules & login admin dulu."); break; } }
    bar.style.width = Math.round(((i + 1) / fresh.length) * 100) + "%";
  }
  imp.disabled = false;
  toast(`Import selesai: ${done}/${fresh.length} artikel.`); loadAll();
}

/* ---- wire ---- */
$("#search").addEventListener("input", renderRows);
$("#import").addEventListener("click", runImport);
$("#refresh").addEventListener("click", loadAll);
$("#packcount").textContent = corpus().length;
initAuth();
