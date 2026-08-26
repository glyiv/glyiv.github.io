/* GLYIV KABAR — Studio (admin) logic. Google login gated to ADMIN_EMAILS.
   Queue table, publish/schedule/unpublish/delete, and content-pack import
   into Firestore (collection kabar_articles) with daily-drip scheduling.

   ⛔ GERBANGNYA DULU SATU EMAIL. `ADMIN_EMAIL` memaku "glyiv.archourium@gmail.com",
   jadi pendiri yang login dengan archourium@gmail.com — yang DIIZINKAN
   firestore.rules — tetap dijawab layar "bukan admin" oleh Studio. Server
   mengizinkan, UI menyembunyikan: arah yang tidak pernah memunculkan galat, dan
   karena itu tidak pernah jadi keluhan. Sekarang gerbangnya membaca daftar yang
   sama dengan `src/config/adminAllowlist.ts`. */
import {
  db, auth, COLL, ADMIN_EMAILS, isKabarAdmin, isKabarAdminAsync, fbReady, normalize, toMs, unggahHero, toPostCards,
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, Timestamp,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from "./kabar-fb.js";

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const fmt = (n) => (n || 0).toLocaleString("id-ID");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const dstr = (ms) => { if (!ms) return "—"; const d = new Date(ms); return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }); };
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 2600); }

let ITEMS = [];

/* ---- auth ----
   ⛔ KEADAAN LOGIN DIPISAH DARI PEMASANGANNYA, dan itu bukan kerapian belaka.
   Di aplikasi React berkas ini dieksekusi SEKALI PER SESI (`useSiteScripts`
   menyimpan src yang sudah dimuat di sebuah Set). Versi lama memanggil
   `showState()` HANYA dari dalam callback `onAuthStateChanged`, yang menyala
   sekali saja di awal sesi. Akibatnya, membuka /news/studio untuk KEDUA kalinya
   tanpa muat ulang penuh menghasilkan LAYAR KOSONG: React sudah memasang
   ulang keempat panel dengan `display:none` bawaannya, dan tidak ada lagi yang
   pernah menyalakan satu pun.
   Terukur di peramban 14 Agustus 2026, /news → /news/studio:
     state-login none · state-denied none · state-app none · state-err none
   Sekarang jawaban auth terakhir disimpan di `PENGGUNA`, dan `terapkanKeadaan()`
   dipanggil ulang tiap `boot()` — jadi panel yang benar menyala lagi. */
let PENGGUNA;                 // undefined = jawaban pertama belum datang
let authTerpasang = false;

/* ⛔ TRI-KEADAAN, BUKAN BOOLEAN. `undefined` = jawabannya BELUM TIBA.
   Keadmin-an sekarang bisa datang dari koleksi `admin_emails` di server (lihat
   `isKabarAdminAsync` di kabar-fb.js), jadi ada jeda antara "sudah login" dan
   "sudah tahu ia admin". Boolean memaksa jeda itu dibaca sebagai `false`, dan
   `false` di sini berarti layar "Akses ditolak" — tuduhan yang dilontarkan
   kepada admin yang sah, atas jawaban yang belum sampai. */
let ADMIN_SAH;                // undefined = masih memeriksa ke server

function terapkanKeadaan() {
  if (!fbReady) { showState("err", "Firebase tidak aktif di lingkungan ini."); return; }
  if (PENGGUNA === undefined) { showState("login"); return; }
  if (!PENGGUNA) { showState("login"); return; }
  if (ADMIN_SAH === undefined) { showState("cek"); return; }
  if (!ADMIN_SAH) { showState("denied", PENGGUNA.email); return; }
  $("#who").textContent = PENGGUNA.email;
  showState("app");
}

function initAuth() {
  if (!fbReady) { terapkanKeadaan(); return; }
  if (authTerpasang) return;          // SATU langganan seumur sesi
  authTerpasang = true;
  onAuthStateChanged(auth, (u) => {
    PENGGUNA = u || null;
    if (!u) { ADMIN_SAH = false; terapkanKeadaan(); return; }

    ADMIN_SAH = undefined;            // jawaban lama tidak berlaku untuk akun baru
    terapkanKeadaan();                // → "cek"
    isKabarAdminAsync(u).then((ok) => {
      /* Akun bisa berganti selagi pembacaan berjalan (keluar lalu masuk cepat).
         Jawaban untuk akun LAMA tidak boleh membuka Studio bagi akun baru. */
      if (PENGGUNA !== u) return;
      ADMIN_SAH = ok;
      terapkanKeadaan();
      if (ok) loadAll();
    });
  });
}
function showState(s, extra) {
  /* ⛔ "cek" WAJIB ADA DI DAFTAR INI. Daftar ini bukan sekadar penyala — ia juga
     PEMADAM: panel yang tidak disebut di sini tidak pernah disembunyikan lagi.
     Menambah keadaan di `terapkanKeadaan()` tanpa menambahnya di sini membuat
     "Checking access" menempel di layar selamanya, menutupi Studio yang sudah
     terbuka di belakangnya. */
  ["login", "cek", "denied", "app", "err"].forEach((k) => { const el = $("#state-" + k); if (el) el.style.display = k === s ? "" : "none"; });
  /* Surel yang DIIZINKAN ikut disebut. Layar "akses ditolak" yang hanya
     mengulang surel si penekan tidak memberi tahu apa pun yang bisa ia lakukan
     berikutnya — dan pendiri yang punya dua akun Google tidak bisa menebak yang
     mana. */
  if (s === "denied") {
    $("#deniedEmail").textContent = extra || "";
    const petunjuk = $("#deniedHint");
    /* ⛔ TIDAK LAGI MENYEBUT DAFTAR PENDIRI SEBAGAI "SATU-SATUNYA".
       Sejak keadmin-an bisa diberikan lewat "Kelola admin", kalimat lama
       ("Akun yang berwenang: <dua pendiri>") berbohong kepada admin dinamis yang
       kebetulan salah akun Google: ia menyuruh mereka memakai akun yang justru
       bukan milik mereka. Yang benar disebut sekarang: pendiri, ATAU akun yang
       sudah didaftarkan seorang admin. */
    if (petunjuk) {
      petunjuk.textContent =
        "Authorised: " + ADMIN_EMAILS.join(" or ")
        + ", or any account added under “Manage admins”.";
    }
  }
  if (s === "err") $("#errMsg").textContent = extra || "";
}

/* ---- data ---- */
async function loadAll() {
  $("#rows").innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#6B7772">Memuat…</td></tr>';
  try {
    const snap = await getDocs(collection(db, COLL));
    ITEMS = snap.docs.map((d) => normalize(d.data(), d.id)).sort((a, b) => b.publishAt - a.publishAt);
    renderStats(); renderRows();
    if (!ITEMS.length) $("#rows").innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#6B7772">Belum ada artikel di Firestore. Klik <b>✍ Tulis berita</b> untuk menulis yang pertama.</td></tr>';
  } catch (e) {
    $("#rows").innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:#c0392b">Gagal membaca: ${esc(e.code || e.message)}.<br><small>Pastikan firestore.rules sudah di-deploy &amp; domain diizinkan.</small></td></tr>`;
  }
}
function statusOf(a) { if (a.status !== "published") return "draft"; return a.publishAt > Date.now() ? "scheduled" : "live"; }
function renderStats() {
  const live = ITEMS.filter((a) => statusOf(a) === "live").length;
  const sched = ITEMS.filter((a) => statusOf(a) === "scheduled").length;
  const draft = ITEMS.filter((a) => statusOf(a) === "draft").length;
  const V = ITEMS.reduce((s, a) => s + (a.views || 0), 0), L = ITEMS.reduce((s, a) => s + (a.likes || 0), 0), S = ITEMS.reduce((s, a) => s + (a.shares || 0), 0);
  const mitra = ITEMS.filter((a) => a.jenis === "mitra").length;
  $("#stats").innerHTML = [["Total", ITEMS.length], ["Live", live], ["Terjadwal", sched], ["Draft", draft], ["Mitra", mitra], ["Views", fmt(V)], ["Likes", fmt(L)], ["Shares", fmt(S)]]
    .map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("");
}
/* ⛔ PENCARIAN MENYARING SELURUH KOLEKSI, PAGINASI DATANG SESUDAHNYA — dan
   urutan itu bukan selera. Aturan tetap proyek: setiap daftar panjang wajib
   paginasi DAN pencarian atas SELURUH data, bukan halaman yang sedang tampil.
   Kalau dibalik (potong dulu, cari di potongan), mengetik "mangrove" di
   halaman 1 menjawab "tidak ada" padahal artikelnya ada di halaman 7 — jawaban
   yang salah tanpa satu pun galat. `ITEMS` selalu berisi koleksi penuh. */
const PER = 12;
let HAL = 1;

function daftarTersaring() {
  const q = ($("#search").value || "").trim().toLowerCase();
  const f = ($("#fstatus") && $("#fstatus").value) || "";
  return ITEMS.filter((a) => {
    if (f === "mitra") { if (a.jenis !== "mitra") return false; }
    else if (f && statusOf(a) !== f) return false;
    if (!q) return true;
    return (a.title || "").toLowerCase().includes(q)
      || (a.topic || "").toLowerCase().includes(q)
      || (a.slug || "").toLowerCase().includes(q)
      || (a.mitra || "").toLowerCase().includes(q)
      || (a.dek || "").toLowerCase().includes(q);
  });
}

function renderRows() {
  const list = daftarTersaring();
  const halaman = Math.max(1, Math.ceil(list.length / PER));
  if (HAL > halaman) HAL = halaman;
  const potong = list.slice((HAL - 1) * PER, HAL * PER);

  if (!list.length) {
    $("#rows").innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#6B7772">Tidak ada artikel yang cocok dengan saringan ini.</td></tr>';
    $("#apager").innerHTML = "";
    return;
  }
  $("#rows").innerHTML = potong.map((a) => {
    const st = statusOf(a);
    const pill = { live: "🟢 Live", scheduled: "🕒 Terjadwal", draft: "⚪ Draft" }[st];
    return `<tr>
      <td><div class="tt"><span class="dot" style="background:${esc(a.mood)}"></span><div><b>${esc(a.title)}</b><small>${esc(a.topic)} · ${esc(a.slug)}${a.jenis === "mitra" ? " · 🤝 mitra" + (a.mitra ? " (" + esc(a.mitra) + ")" : "") : ""}</small></div></div></td>
      <td><span class="pill ${st}">${pill}</span></td>
      <td class="mono">${dstr(a.publishAt)}</td>
      <td class="mono">${fmt(a.views)} · ${fmt(a.likes)}♥ · ${fmt(a.shares)}↗</td>
      <td class="act">
        <button data-edit="${esc(a.slug)}" title="Sunting">✎</button>
        <a href="artikel.html?a=${encodeURIComponent(a.slug)}" target="_blank" title="Lihat di halaman berita">👁</a>
        ${st !== "live" ? `<button data-pub="${esc(a.slug)}" title="Terbitkan sekarang">▲</button>` : ""}
        <button data-sched="${esc(a.slug)}" title="Jadwalkan">🕒</button>
        ${st !== "draft" ? `<button data-draft="${esc(a.slug)}" title="Jadikan draft">⏸</button>` : ""}
        <button data-del="${esc(a.slug)}" title="Hapus" class="del">✕</button>
      </td>
    </tr>`;
  }).join("");
  renderPager(halaman, list.length);
  $$("[data-edit]").forEach((b) => b.addEventListener("click", () => bukaKomposer(b.dataset.edit)));
  $$("[data-pub]").forEach((b) => b.addEventListener("click", () => setPublish(b.dataset.pub, Date.now(), "published")));
  $$("[data-draft]").forEach((b) => b.addEventListener("click", () => setPublish(b.dataset.draft, null, "draft")));
  $$("[data-sched]").forEach((b) => b.addEventListener("click", () => schedule(b.dataset.sched)));
  $$("[data-del]").forEach((b) => b.addEventListener("click", () => del(b.dataset.del)));
}

function renderPager(halaman, total) {
  const el = $("#apager"); if (!el) return;
  const dari = (HAL - 1) * PER + 1, sampai = Math.min(HAL * PER, total);
  if (halaman <= 1) { el.innerHTML = `<span class="apager__info">${total} artikel</span>`; return; }
  const jendela = [];
  for (let p = 1; p <= halaman; p++) {
    if (p === 1 || p === halaman || Math.abs(p - HAL) <= 1) jendela.push(p);
    else if (jendela[jendela.length - 1] !== "…") jendela.push("…");
  }
  el.innerHTML = `<span class="apager__info">${dari}–${sampai} dari ${total} artikel · hal ${HAL}/${halaman}</span><div class="apager__btns">`
    + `<button class="apg" data-hal="${HAL - 1}"${HAL === 1 ? " disabled" : ""}>‹</button>`
    + jendela.map((p) => (p === "…" ? '<span class="apg__dot">…</span>' : `<button class="apg${p === HAL ? " on" : ""}" data-hal="${p}">${p}</button>`)).join("")
    + `<button class="apg" data-hal="${HAL + 1}"${HAL === halaman ? " disabled" : ""}>›</button></div>`;
  $$("[data-hal]", el).forEach((b) => b.addEventListener("click", () => {
    const p = +b.dataset.hal;
    if (p >= 1 && p <= halaman) { HAL = p; renderRows(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }));
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
      /* `jenis` ditulis EKSPLISIT, tidak dibiarkan kosong. Artikel pack adalah
         tulisan redaksi, dan membiarkan medannya absen berarti pembedaan
         mitra/redaksi bergantung pada nilai bawaan pembaca — satu pembaca yang
         lupa memberi bawaan, dan label pengungkapan hilang tanpa galat. */
      slug: a.slug, jenis: "redaksi", mitra: "", topic: a.topic, mood: a.mood, title: a.title, dek: a.dek, hook: a.hook,
      cover: a.cover, coverCredit: a.coverCredit || null, author: a.author, role: a.role, read: a.read,
      /* ⛔ `story` LEWAT ATURAN EMPAT-KARTU, TIDAK DISALIN MENTAH.
         `dist/lab/kabar/content-pack.js` adalah ARSIP REDAKSI dan sengaja tetap
         menyimpan tujuh kartu per artikel (tiga yang tidak terpilih tulisan
         sungguhan, bukan sampah). Sampai 20 Agustus 2026 baris ini menyalinnya
         apa adanya ke Firestore, jadi tombol "Import Content Pack" MENULIS
         dokumen tujuh kartu — persis keadaan yang baru saja dipangkas
         `scripts/trim-kabar-story.cjs`, dikembalikan oleh satu klik dan tanpa
         satu pun gerbang berbunyi. Jebakan yang sama sudah ditutup di
         `scripts/sync-kabar-firestore.cjs`; ini jalur keduanya. */
      blocks: a.blocks, story: toPostCards(a.story), sources: a.sources, orb: a.orb,
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

/* ═══════════════════════════════════════════════════════════════════════════
   KOMPOSER — tulis / sunting berita (judul, narasi, gambar hero)
   ═══════════════════════════════════════════════════════════════════════════
   Permintaan pemilik, verbatim: "tambahkan juga fitur di mana admin bisa
   posting berita tersendiri yang masuk di newsletter… admin bisa buat narasi,
   judul dan upload gambar untuk hero." Ia menyebutnya untuk konten mitra,
   BUKAN hanya artikel redaksi — karena itu `jenis` ada di tingkat data.

   ⛔ MENULIS SAJA TIDAK CUKUP, DAN ITU BUKAN TEORI. Sampai ronde ini
   `kabar.js` menggambar /news HANYA dari content-pack statis; artikel di
   Firestore tidak pernah dibacanya. Formulir ini akan menyimpan dengan benar,
   aturan mengizinkan, `status` "published" — dan halaman berita tetap tidak
   menampilkan apa pun. Jembatannya (`window.__kMerge` di kabar.js +
   penerusan dokumen di kabar-live.js) adalah BAGIAN DARI fitur ini, bukan
   pekerjaan terpisah. Jangan hapus salah satunya tanpa yang lain. */

const K = {};                     // keadaan komposer
let bacaManual = false;

function slugify(s) {
  return String(s || "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

/* ⛔ SATU-SATUNYA GERBANG XSS DI JALUR INI, dan ia bekerja dengan URUTAN.
   `blockHTML()` di kabar.js sengaja TIDAK meng-escape blok `lead`/`p`/`ul`:
   artikel content-pack memuat <strong>, <em>, dan <a data-cite> sebaris. Jadi
   apa pun yang ditulis komposer ke sana masuk ke halaman publik APA ADANYA.
   Karena itu di sini SELURUH ketikan di-escape LEBIH DULU, baru penanda yang
   kita kenali diubah jadi tag yang KITA bangun sendiri. Membalik urutannya —
   mengubah penanda dulu lalu escape — akan meng-escape tag sendiri; melewatkan
   escape sama sekali berarti `<img onerror=…>` yang diketik siapa pun yang
   memegang akun admin akan hidup di setiap halaman pembaca.

   Alamat tautan DIBATASI ke https:// dan jalur internal `/…`. Tanpa itu
   `[klik](javascript:…)` lolos: teksnya sudah aman, tapi href-nya tidak. */
function teksAman(s) {
  let t = String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  /* ⚠︎ SATU TINGKAT TANDA KURUNG DIIZINKAN DI DALAM ALAMAT. Pola lama memakai
     `[^)\s]` — berhenti pada `)` PERTAMA — sehingga alamat yang memang memuat
     tanda kurung terpotong diam-diam. Terukur:
       [Karbon](https://en.wikipedia.org/wiki/Carbon_(element))
       → href "https://en.wikipedia.org/wiki/Carbon_(element"  ← rusak, 404
       → dan sisa ")" tertinggal sebagai teks di badan artikel
     Alamat semacam itu justru yang paling sering dikutip halaman ini (Wikipedia,
     dokumen regulasi Uni Eropa), jadi tautan yang mati adalah cacat yang akan
     benar-benar terjadi — dan ia hanya terlihat kalau ada yang mengeklik.

     Efek sampingnya menguntungkan gerbang keamanan: `javascript:alert(1)` kini
     tertangkap UTUH, jadi uji skema di bawah menolaknya dan yang tersisa hanya
     teksnya — sebelumnya `)` yatim ikut tercecer ke halaman.

     Panjangnya dibatasi DI DALAM KODE, bukan oleh `{1,300}` pada gugus
     berselang-seling: kuantifier di sana menghitung PENGULANGAN GUGUS, bukan
     karakter, jadi ia bukan batas panjang sama sekali. */
  t = t.replace(/\[([^\]]{1,120})\]\(((?:[^()\s]|\([^()\s]*\)){1,300})\)/g, (m, teks, url) => {
    if (url.length > 300) return teks;                // alamat tak masuk akal → sisakan teksnya
    if (!/^(https:\/\/|\/)/.test(url)) return teks;   // alamat ditolak → sisakan teksnya
    return '<a href="' + url + '" target="_blank" rel="noopener">' + teks + "</a>";
  });
  t = t.replace(/\*\*([^*]{1,300})\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*\n]{1,300})\*/g, "$1<em>$2</em>");
  return t;
}

/* Narasi → blok. Cukup untuk paragraf, subjudul, kutipan, dan daftar —
   sengaja tidak lebih. Baris kosong memisahkan paragraf; paragraf PERTAMA jadi
   `lead` (paragraf pembuka besar), mengikuti gaya rumah seluruh artikel Kabar. */
function keBlok(narasi) {
  const blok = [];
  const baris = String(narasi || "").replace(/\r\n/g, "\n").split("\n");
  let paragraf = [], daftar = [], sudahLead = false;

  const tutupParagraf = () => {
    if (!paragraf.length) return;
    const isi = teksAman(paragraf.join(" ").trim());
    paragraf = [];
    if (!isi) return;
    blok.push({ t: sudahLead ? "p" : "lead", x: isi });
    sudahLead = true;
  };
  const tutupDaftar = () => {
    if (!daftar.length) return;
    blok.push({ t: "ul", items: daftar.map(teksAman) });
    daftar = [];
  };

  baris.forEach((raw) => {
    const b = raw.trim();
    if (!b) { tutupParagraf(); tutupDaftar(); return; }
    if (/^##\s+/.test(b)) { tutupParagraf(); tutupDaftar(); blok.push({ t: "h2", x: b.replace(/^##\s+/, "") }); sudahLead = true; return; }
    if (/^>\s?/.test(b)) { tutupParagraf(); tutupDaftar(); blok.push({ t: "pull", x: b.replace(/^>\s?/, "") }); sudahLead = true; return; }
    if (/^[-*•]\s+/.test(b)) { tutupParagraf(); daftar.push(b.replace(/^[-*•]\s+/, "")); return; }
    tutupDaftar(); paragraf.push(b);
  });
  tutupParagraf(); tutupDaftar();
  return blok;
}

/* Pratinjau memakai KELAS YANG SAMA dengan halaman artikel publik. Bentuknya
   sengaja meniru `blockHTML()` di kabar.js baris demi baris; kalau salah satu
   berubah, yang satunya ikut — pratinjau yang berbeda dari hasil terbit lebih
   buruk daripada tidak ada pratinjau, karena ia meyakinkan. */
function blokKeHTML(blok) {
  return (blok || []).map((b) => {
    if (b.t === "lead") return '<p class="lead">' + b.x + "</p>";
    if (b.t === "p") return "<p>" + b.x + "</p>";
    if (b.t === "h2") return "<h2>" + esc(b.x) + "</h2>";
    if (b.t === "pull") return '<blockquote class="kpull">' + esc(b.x) + "</blockquote>";
    if (b.t === "ul") return '<ul class="klist">' + (b.items || []).map((i) => "<li>" + i + "</li>").join("") + "</ul>";
    return "";
  }).join("");
}

function keSumber(teks) {
  return String(teks || "").split("\n").map((b) => b.trim()).filter(Boolean).map((b) => {
    const p = b.split("|");
    const a = (p[0] || "").trim(), u = (p[1] || "").trim();
    return u && /^https?:\/\//.test(u) ? { a, u } : { a };
  });
}
function dariSumber(arr) {
  return (arr || []).map((s) => (s.u ? s.a + " | " + s.u : s.a)).join("\n");
}

/* ── KREDIT GAMBAR SAMPUL ──────────────────────────────────────────────────────
   Satu baris, tiga bagian, dipisah `|` — pola yang SAMA dengan kolom Sumber di
   atas, supaya tidak ada bentuk isian baru yang harus dipelajari:

       Marek Piwnicki | Unsplash | https://unsplash.com/photos/<id>

   Urutannya sengaja mengikuti kalimat yang akan tampil ("Foto oleh … di …"),
   jadi yang mengisi tahu bagian mana yang sedang ia tulis. Nama lisensi dan
   alamat lisensinya TIDAK diketik di sini: `kreditNorm()` di kabar.js
   menurunkannya dari nama platform, supaya 87 artikel tidak mengetik alamat
   yang sama 87 kali (dan salah ketik di salah satunya).
   Kosong = artikel ini belum punya catatan asal gambar, dan halaman publik
   tidak menggambar apa pun — bukan baris kosong, bukan garis. */
function keKredit(teks) {
  const p = String(teks || "").split("|").map((x) => x.trim());
  const by = p[0] || "", on = p[1] || "";
  const url = /^https?:\/\//.test(p[2] || "") ? p[2] : "";
  if (!by && !on) return null;
  return { by, on, url };
}
function dariKredit(k) {
  if (!k) return "";
  if (typeof k === "string") return k;
  return [k.by || "", k.on || "", k.url || ""].join(" | ").replace(/(\s*\|\s*)+$/, "");
}

function pratinjau() {
  const d = kumpul();
  const komp = $("#komp");
  komp.style.setProperty("--mood", d.mood);
  komp.style.setProperty("--mood-soft", d.mood + "22");
  $("#kPrevTopik").textContent = d.topic || "Kabar";
  $("#kPrevJudul").textContent = d.title || "Judul berita";
  $("#kPrevDek").textContent = d.dek || "Ringkasan berita.";
  $("#kPrevAv").textContent = (d.author || "G").trim().charAt(0).toUpperCase();
  $("#kPrevBy").textContent = d.author + (d.role ? " · " + d.role : "") + " · " + d.read + " mnt baca";
  $("#kPrevCover").style.backgroundImage = d.cover ? 'url("' + d.cover.replace(/"/g, "%22") + '")' : "";
  const mitra = d.jenis === "mitra"
    ? '<aside class="kmitra"><b>Konten mitra</b><span>Disiapkan bersama ' + esc(d.mitra || "mitra Glyiv")
      + '. Isi dan klaim di dalamnya berasal dari mitra dan belum diverifikasi Glyiv. ⚠︎</span></aside>'
    : "";
  const sumber = d.sources.length
    ? '<div class="ksrc"><h3>Sumber</h3><ol>' + d.sources.map((s) => "<li>" + (s.u ? '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.a) + "</a>" : esc(s.a)) + "</li>").join("") + "</ol></div>"
    : "";
  /* Pratinjau kredit gambar. Kata penghubungnya ditulis Indonesia apa adanya di
     sini — Studio berbahasa Indonesia, dan halaman publiklah yang merakit
     kalimatnya per bahasa (`kreditIsi()` di kabar.js). Yang harus SAMA dengan
     halaman publik adalah keadaan kosongnya: tidak ada kredit → tidak ada
     elemen sama sekali, supaya pratinjau tidak menjanjikan baris yang tidak
     akan muncul. */
  const kr = d.coverCredit;
  const nd = (t, u) => (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener nofollow"><bdi>' + esc(t) + "</bdi></a>" : "<bdi>" + esc(t) + "</bdi>");
  const kredit = kr
    ? '<div class="kcred">' + (kr.by
      ? "Foto oleh " + nd(kr.by, kr.url) + (kr.on ? " di " + nd(kr.on, "") : "")
      : "Foto dari " + nd(kr.on, kr.url)) + "</div>"
    : "";
  $("#kPrevBody").innerHTML = mitra + blokKeHTML(d.blocks) + sumber + kredit;
  $("#kompStat").textContent = d.blocks.length + " blok · " + d.kata + " kata · ± " + d.read + " mnt baca";
  $("#kompSlug").textContent = d.slug ? "/news/article?a=" + d.slug : "";
}

function kumpul() {
  const val = (id) => ($(id) ? $(id).value : "");
  const judul = val("#kJudul").trim();
  const narasi = val("#kNarasi");
  const blocks = keBlok(narasi);
  const kata = narasi.trim() ? narasi.trim().split(/\s+/).length : 0;
  const mood = /^#[0-9a-fA-F]{6}$/.test(val("#kMoodHex").trim()) ? val("#kMoodHex").trim() : "#1F7A6B";
  return {
    slug: K.slug || slugify(val("#kSlugIn").trim() || judul),
    jenis: K.jenis === "mitra" ? "mitra" : "redaksi",
    mitra: val("#kMitra").trim(),
    title: judul,
    dek: val("#kDek").trim(),
    topic: val("#kTopik").trim() || (K.jenis === "mitra" ? "Mitra" : "Kabar"),
    mood,
    cover: val("#kCover").trim(),
    author: val("#kPenulis").trim() || "Glyiv Team",
    role: val("#kPeran").trim(),
    read: Math.max(1, Math.min(60, parseInt(val("#kBaca"), 10) || Math.max(1, Math.round(kata / 200)))),
    blocks, kata,
    sources: keSumber(val("#kSumber")),
    coverCredit: keKredit(val("#kKredit")),
  };
}

function galat(pesan) {
  const el = $("#kErr");
  if (!pesan) { el.hidden = true; el.textContent = ""; return; }
  el.hidden = false; el.textContent = pesan;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* Validasi yang MENYEBUT kolomnya, bukan "isian tidak lengkap". */
function periksa(d) {
  const tandai = (id, salah) => { const e = $(id); if (e) e.classList.toggle("bad", !!salah); };
  const kosongJudul = !d.title, kosongDek = !d.dek, kosongNarasi = !d.blocks.length;
  const kosongMitra = d.jenis === "mitra" && !d.mitra;
  tandai("#kJudul", kosongJudul); tandai("#kDek", kosongDek);
  tandai("#kNarasi", kosongNarasi); tandai("#kMitra", kosongMitra);
  if (kosongJudul) return "Judul belum diisi.";
  if (kosongDek) return "Ringkasan (dek) belum diisi — teks inilah yang tampil di kartu feed.";
  if (kosongNarasi) return "Narasi masih kosong.";
  if (kosongMitra) return "Jenis \"Mitra\" dipilih, jadi nama mitra wajib diisi — label pengungkapan di halaman publik menyebut namanya.";
  if (!d.slug) return "Alamat (slug) tidak bisa dibuat dari judul ini. Isi kolom Alamat (slug) secara manual.";
  return "";
}

function isiForm(a) {
  $("#kJudul").value = a ? a.title || "" : "";
  $("#kDek").value = a ? a.dek || "" : "";
  $("#kTopik").value = a ? a.topic || "" : "";
  $("#kPenulis").value = a ? a.author || "" : "Glyiv Team";
  $("#kPeran").value = a ? a.role || "" : "";
  $("#kBaca").value = a ? a.read || 4 : 4;
  $("#kCover").value = a ? a.cover || "" : "";
  $("#kMitra").value = a ? a.mitra || "" : "";
  $("#kSlugIn").value = a ? a.slug || "" : "";
  $("#kSumber").value = a ? dariSumber(a.sources) : "";
  $("#kKredit").value = a ? dariKredit(a.coverCredit) : "";
  const m = (a && a.mood) || "#1F7A6B";
  $("#kMood").value = m; $("#kMoodHex").value = m;
  $("#kNarasi").value = a ? dariBlok(a.blocks) : "";
  setJenis(a && a.jenis === "mitra" ? "mitra" : "redaksi");
  setHeroPratinjau(a ? a.cover : "");
}

/* Blok → narasi, supaya "Sunting" mengembalikan teks yang bisa diedit lagi.
   ⚠︎ Artikel content-pack memuat blok yang komposer TIDAK bisa tulis (`stat`,
   `bars`). Ia dikembalikan sebagai penanda yang JELAS TERLIHAT, bukan dibuang
   diam-diam: menyunting satu kata di artikel lama tidak boleh menghapus
   grafiknya tanpa ada yang tahu. Menyimpan artikel semacam itu memang akan
   kehilangan bloknya — karena itu peringatannya ada di layar, bukan di sini. */
function dariBlok(blok) {
  return (blok || []).map((b) => {
    if (b.t === "h2") return "## " + b.x;
    if (b.t === "pull") return "> " + b.x;
    if (b.t === "ul") return (b.items || []).map((i) => "- " + keTeks(i)).join("\n");
    if (b.t === "lead" || b.t === "p") return keTeks(b.x);
    if (b.t === "stat") return "⟦BLOK ANGKA — tidak bisa disunting di sini: " + (b.n || "") + " / " + (b.l || "") + "⟧";
    if (b.t === "bars") return "⟦BLOK GRAFIK — tidak bisa disunting di sini⟧";
    return "";
  }).filter(Boolean).join("\n\n");
}
/* HTML sebaris → penanda, kebalikan `teksAman()`. */
function keTeks(html) {
  return String(html || "")
    .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

function setJenis(v) {
  K.jenis = v;
  $$("#kJenis button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
  $("#kMitraRow").hidden = v !== "mitra";
  $("#kJenisHint").textContent = v === "mitra"
    ? "Konten mitra. Halaman publik memasang label \"Konten mitra\" di kartu, di badan artikel, dan di mode Story — klaim mitra tidak boleh terbaca sebagai temuan Glyiv."
    : "Tulisan redaksi Glyiv. Tampil tanpa label tambahan.";
}

function setHeroPratinjau(url) {
  const el = $("#kHeroPrev");
  el.style.backgroundImage = url ? 'url("' + String(url).replace(/"/g, "%22") + '")' : "";
  el.classList.toggle("on", !!url);
}

function bukaKomposer(slug) {
  const a = slug ? ITEMS.find((x) => x.slug === slug) : null;
  K.slug = a ? a.slug : "";                 // id dokumen beku saat menyunting
  K.baru = !a;
  bacaManual = !!a;
  galat("");
  isiForm(a);
  $("#kompJudul").textContent = a ? "Sunting berita" : "Tulis berita";
  $("#kSlugIn").disabled = !!a;             // slug = id dokumen; tak bisa diubah
  $("#kTerbit").textContent = a && statusOf(a) === "live" ? "Simpan & tetap tayang" : "Terbitkan";
  $("#kDraf").textContent = a ? "Simpan sebagai draf" : "Simpan draf";
  /* Peringatan kehilangan data disusun dari APA YANG BENAR-BENAR ADA di artikel
     ini, bukan kalimat tetap: menyebut "grafik akan hilang" pada artikel yang
     tidak punya grafik membuat peringatan berikutnya ikut diabaikan. */
  const punyaBlokKhusus = a && (a.blocks || []).some((b) => b.t === "stat" || b.t === "bars");
  const punyaStoryRakitan = !!(a && a._storyAsli);
  const hilang = [];
  if (punyaBlokKhusus) hilang.push("blok angka/grafik (ditandai ⟦…⟧ di narasi)");
  if (punyaStoryRakitan) hilang.push("slide mode Story rakitan tangan — akan disusun ulang otomatis dari judul, ringkasan, subjudul, dan kutipan yang kamu simpan");
  if (hilang.length) {
    galat(
      "Menyimpan artikel ini akan mengganti: " + hilang.join("; ") + ". "
      + "Editor sederhana ini tidak bisa menyuntingnya. Batalkan kalau tidak bermaksud mengubahnya."
    );
  }
  $("#komp").hidden = false;
  $("#komp").dataset.tab = "tulis";
  $$("#kompTab button").forEach((b) => b.classList.toggle("on", b.dataset.tab === "tulis"));
  document.body.style.overflow = "hidden";
  pratinjau();
  $("#kJudul").focus();
}
function tutupKomposer() {
  $("#komp").hidden = true;
  document.body.style.overflow = "";
}

async function simpan(status) {
  const d = kumpul();
  const pesan = periksa(d);
  if (pesan) { galat(pesan); return; }
  galat("");

  const tombol = [$("#kDraf"), $("#kTerbit"), $("#kBatal")];
  tombol.forEach((b) => { b.disabled = true; });
  try {
    /* ⛔ TABRAKAN SLUG DIPERIKSA SEBELUM MENULIS. `setDoc` menimpa tanpa
       bertanya: tanpa pemeriksaan ini, menulis berita berjudul mirip artikel
       lama akan MENGGANTI artikel itu — beserta views/likes-nya — dan tidak ada
       satu pun galat yang muncul. */
    if (K.baru) {
      const ada = await getDoc(doc(db, COLL, d.slug));
      if (ada.exists()) {
        galat("Alamat \"" + d.slug + "\" sudah dipakai artikel lain. Ubah judul, atau isi kolom Alamat (slug) dengan yang lain.");
        return;
      }
    }
    const inti = {
      slug: d.slug, jenis: d.jenis, mitra: d.mitra,
      topic: d.topic, mood: d.mood, title: d.title, dek: d.dek, hook: d.dek,
      cover: d.cover, coverCredit: d.coverCredit, author: d.author, role: d.role, read: d.read,
      blocks: d.blocks, sources: d.sources,
      /* ⛔ `story` DIKOSONGKAN, DAN ITU BUKAN MEMBUANG DATA — itu menyerahkannya
         ke `deriveStory()` (kabar-fb.js / kabar.js), yang menyusun slide dari
         judul, dek, dan blok yang BARU SAJA disimpan.

         Tanpa baris ini, menyunting artikel yang sudah punya `story` tersimpan
         (seluruh 87 artikel hasil Import Content Pack punya) meninggalkan slide
         LAMA: admin memperbaiki judul, halaman artikel ikut berubah, tetapi mode
         Story tetap membawa judul yang lama. `deriveStory()` mengembalikan
         `a.story` apa adanya begitu ia tidak kosong, jadi tidak ada satu pun
         jalur yang akan memperbaruinya. Dan Story-lah yang paling sering
         dibagikan ulang (lihat catatan di `openStory()` di kabar.js) — versi
         basi justru di kanal yang paling banyak dilihat orang luar.

         Array kosong, BUKAN penghapusan medan: `deriveStory()` menguji
         `a.story && a.story.length`, jadi `[]` sudah cukup memicu penurunan
         ulang, dan bentuk dokumennya tetap sama untuk pembaca lain. Kehilangan
         slide rakitan tangan milik artikel pack diberitahukan di layar sebelum
         admin menyimpan — lihat peringatan di `bukaKomposer()`. */
      story: [],
      orb: "Tanya soal " + d.topic,
      status,
      diperbaruiPada: Timestamp.fromMillis(Date.now()),
    };
    if (K.baru) {
      await setDoc(doc(db, COLL, d.slug), Object.assign({}, inti, {
        views: 0, likes: 0, shares: 0, storyViews: 0,
        publishAt: Timestamp.fromMillis(Date.now()),
        createdAt: Timestamp.fromMillis(Date.now()),
      }));
    } else {
      /* `updateDoc`, BUKAN `setDoc`: penghitung, `createdAt`, dan `publishAt`
         milik artikel yang sudah hidup tidak boleh ikut ter-reset oleh
         penyuntingan satu kalimat. */
      const patch = Object.assign({}, inti);
      const lama = ITEMS.find((x) => x.slug === d.slug);
      if (status === "published" && lama && !lama.publishAt) patch.publishAt = Timestamp.fromMillis(Date.now());
      await updateDoc(doc(db, COLL, d.slug), patch);
    }
    tutupKomposer();
    toast(status === "published" ? "Terbit: " + d.slug : "Tersimpan sebagai draf: " + d.slug);
    HAL = 1;
    loadAll();
  } catch (e) {
    const kode = (e && e.code) || "";
    if (kode === "permission-denied") galat("Ditolak Firestore. Akun ini bukan admin di aturan yang sedang aktif, atau firestore.rules belum diterbitkan.");
    else galat("Gagal menyimpan: " + (kode || (e && e.message) || "sebab tidak diketahui"));
  } finally {
    tombol.forEach((b) => { b.disabled = false; });
  }
}

/* ---- wire komposer ---- */
let escTerpasang = false;
function wireKomposer() {
  const komp = $("#komp"); if (!komp || komp.dataset.wired) return;
  komp.dataset.wired = "1";
  $("#new").addEventListener("click", () => bukaKomposer(null));
  $("#kompBatal").addEventListener("click", tutupKomposer);
  $("#kBatal").addEventListener("click", tutupKomposer);
  $("#kDraf").addEventListener("click", () => simpan("draft"));
  $("#kTerbit").addEventListener("click", () => simpan("published"));
  $$("#kJenis button").forEach((b) => b.addEventListener("click", () => { setJenis(b.dataset.v); pratinjau(); }));
  $$("#kompTab button").forEach((b) => b.addEventListener("click", () => {
    $("#komp").dataset.tab = b.dataset.tab;
    $$("#kompTab button").forEach((x) => x.classList.toggle("on", x === b));
  }));

  /* Pratinjau HIDUP: setiap ketikan menggambar ulang. Di-debounce 160 ms supaya
     mengetik di tablet pemilik tidak menggambar ulang tiap huruf. */
  let t;
  const pantau = ["#kJudul", "#kDek", "#kNarasi", "#kTopik", "#kPenulis", "#kPeran", "#kBaca", "#kCover", "#kKredit", "#kMitra", "#kSumber", "#kMoodHex"];
  pantau.forEach((id) => {
    const el = $(id); if (!el) return;
    el.addEventListener("input", () => { clearTimeout(t); t = setTimeout(pratinjau, 160); });
  });
  $("#kJudul").addEventListener("input", () => {
    $("#kJudulN").textContent = $("#kJudul").value.length;
    if (K.baru && !$("#kSlugIn").value.trim()) $("#kompSlug").textContent = "/news/article?a=" + slugify($("#kJudul").value);
  });
  $("#kDek").addEventListener("input", () => { $("#kDekN").textContent = $("#kDek").value.length; });
  $("#kBaca").addEventListener("input", () => { bacaManual = true; });
  $("#kNarasi").addEventListener("input", () => {
    if (bacaManual) return;
    const kata = $("#kNarasi").value.trim() ? $("#kNarasi").value.trim().split(/\s+/).length : 0;
    $("#kBaca").value = Math.max(1, Math.round(kata / 200));
  });
  $("#kMood").addEventListener("input", () => { $("#kMoodHex").value = $("#kMood").value; pratinjau(); });
  $("#kMoodHex").addEventListener("input", () => {
    const v = $("#kMoodHex").value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) $("#kMood").value = v;
  });
  $("#kCover").addEventListener("input", () => setHeroPratinjau($("#kCover").value.trim()));

  /* Sisipan penanda di posisi kursor. */
  $$("#kTools button").forEach((b) => b.addEventListener("click", () => {
    const ta = $("#kNarasi");
    const map = { h2: ["\n## ", "Subjudul"], quote: ["\n> ", "Kalimat kutipan"], list: ["\n- ", "Butir pertama"], bold: ["**", "teks tebal", "**"], link: ["[", "teks tautan", "](https://)"] };
    const m = map[b.dataset.ins]; if (!m) return;
    const a = ta.selectionStart, z = ta.selectionEnd;
    const dipilih = ta.value.slice(a, z) || m[1];
    const sisip = m[0] + dipilih + (m[2] || "");
    ta.value = ta.value.slice(0, a) + sisip + ta.value.slice(z);
    ta.focus();
    ta.selectionStart = a + m[0].length; ta.selectionEnd = a + m[0].length + dipilih.length;
    pratinjau();
  }));

  /* Unggah hero. Kegagalannya DITAMPILKAN, tidak ditelan — dan pesannya
     menyebut jalur Storage yang dibutuhkan (lihat unggahHero() di kabar-fb.js). */
  $("#kHeroFile").addEventListener("change", async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const d = kumpul();
    const slugUnggah = d.slug || "draf-" + Date.now();
    const pesanEl = $("#kHeroPesan");
    pesanEl.textContent = "Mengunggah " + (file.size / 1048576).toFixed(1) + " MB…";
    try {
      const url = await unggahHero(slugUnggah, file);
      $("#kCover").value = url;
      setHeroPratinjau(url);
      pratinjau();
      pesanEl.textContent = "Gambar terunggah ✓";
      galat("");
    } catch (e) {
      pesanEl.textContent = "JPG / PNG / WebP, maksimal 5 MB.";
      galat(e && e.message ? e.message : "Gagal mengunggah gambar.");
    } finally {
      ev.target.value = "";      // supaya berkas yang sama bisa dipilih lagi
    }
  });

  /* Pendengar dokumen dipasang sekali seumur sesi — `document` tidak diganti
     React, jadi penanda per-simpul tidak berlaku untuknya. */
  if (!escTerpasang) {
    escTerpasang = true;
    document.addEventListener("keydown", (e) => {
      const k = $("#komp");
      if (e.key === "Escape" && k && !k.hidden) tutupKomposer();
    });
  }
}

/* ---- wire ----
   `pasang()` menempelkan pendengar SEKALI PER SIMPUL. React membuat simpul baru
   tiap halaman dipasang, jadi penanda `data-*` ikut hilang bersamanya dan
   pemasangan terjadi lagi — sementara pada simpul yang sama (mis. `glyiv:page`
   menyala tanpa pergantian halaman) ia tidak menumpuk pendengar kedua. */
function pasang(sel, ev, fn) {
  const el = $(sel); if (!el) return;
  const kunci = "w" + ev;
  if (el.dataset[kunci]) return;
  el.dataset[kunci] = "1";
  el.addEventListener(ev, fn);
}

function boot() {
  if (!$("#state-app")) return;          // halaman lain — berkas ini ikut termuat sekali per sesi
  pasang("#search", "input", () => { HAL = 1; renderRows(); });
  pasang("#fstatus", "change", () => { HAL = 1; renderRows(); });
  pasang("#import", "click", runImport);
  pasang("#refresh", "click", loadAll);
  pasang("#signin", "click", () => signInWithPopup(auth, new GoogleAuthProvider().setCustomParameters({ prompt: "select_account" })).catch((e) => toast("Login gagal: " + (e.code || e.message))));
  pasang("#signout", "click", () => signOut(auth));
  const pc = $("#packcount"); if (pc) pc.textContent = corpus().length;
  wireKomposer();
  initAuth();
  terapkanKeadaan();
  /* Tabel digambar ulang ke simpul BARU. Tanpa ini, kembali ke Studio
     memperlihatkan kerangka tabel kosong walau ITEMS masih penuh di memori. */
  if (ITEMS.length) { renderStats(); renderRows(); }
}

boot();
window.addEventListener("glyiv:page", boot);
