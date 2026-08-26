/* GLYIV KABAR — Firebase data + realtime engagement layer (ESM).
   Project glyiv-5cb33. Reads published articles from Firestore (collection
   `kabar_articles`), realtime views/likes/shares via onSnapshot + increment().
   Falls back to window.KABAR (local content pack) if Firestore is unavailable
   or empty, so the newsletter always renders.

   ⛔ PROYEKNYA PERNAH SALAH, DAN SALAHNYA TIDAK PERNAH MEMUNCULKAN GALAT.
   Sampai 13 Agustus 2026 berkas ini menunjuk `glyiv-28711` — proyek tempat
   Kabar LAHIR, waktu ia masih hanya hidup di glyiv.github.io. Diukur di
   produksi hari itu:

     GET  kabar_articles/pajak-karbon-indonesia-kemana @glyiv-5cb33 → 200
     GET  kabar_articles/pajak-karbon-indonesia-kemana @glyiv-28711 → 404
     runQuery status=="published" @glyiv-5cb33                      → 87 dokumen
     runQuery status=="published" @glyiv-28711                      → 0 dokumen

   Seluruh artikel ada di `glyiv-5cb33`; koleksi di `glyiv-28711` KOSONG. Situs
   tetap terlihat benar karena `listArticles()` di bawah diam-diam jatuh ke
   `window.KABAR` (content-pack statis) begitu Firestore menjawab nol — jadi
   selama setahun tidak ada satu pun galat, satu pun keluhan, dan satu pun
   artikel yang benar-benar datang dari Firestore. Yang MATI diam-diam:
   penerbitan lewat Studio, penjadwalan, dan hitungan views/likes bersama.

   Dan Studio-nya sendiri tidak bisa dibuka di glyiv.web.app: authorizedDomains
   `glyiv-28711` hanya memuat [localhost, glyiv-28711.firebaseapp.com,
   glyiv-28711.web.app, glyiv.github.io] — `glyiv.web.app` tidak ada di sana,
   jadi `signInWithPopup` ditolak `auth/unauthorized-domain` SEBELUM surel siapa
   pun sempat dibaca.

   Konfigurasi di bawah SENGAJA disalin apa adanya dari `.env`
   (`VITE_FIREBASE_*`) supaya berkas statis ini dan aplikasi React memakai
   proyek, sesi login, dan aturan yang PERSIS SAMA. Kalau `.env` berubah,
   berkas ini ikut diubah — tidak ada mekanisme yang menyinkronkannya sendiri. */
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, onSnapshot,
  query, where, orderBy, updateDoc, increment, setDoc, deleteDoc,
  writeBatch, serverTimestamp, Timestamp,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getStorage, ref as srefRaw, uploadBytes, getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDD-qemp0Y9A3nDUg_x3mKDCoDc450hC-E",
  authDomain: "glyiv-5cb33.firebaseapp.com",
  projectId: "glyiv-5cb33",
  storageBucket: "glyiv-5cb33.firebasestorage.app",
  messagingSenderId: "537596927094",
  appId: "1:537596927094:web:ef434f813b8a3aa0015357",
  /* ⛔ JANGAN MENAMBAHKAN `measurementId` KEMBALI KE SINI. Ia pernah ada, tidak
     pernah dipakai (tidak ada satu pun `getAnalytics()` di seluruh /lab/kabar/),
     dan ia MEMATIKAN halaman berita — diam-diam.

     Sebabnya: `initializeApp()` membandingkan opsi dengan `deepEqual`. Kalau
     aplikasi `[DEFAULT]` sudah ada dengan opsi yang BERBEDA SATU KUNCI PUN, ia
     melempar `app/duplicate-app`. Berkas ini dan `kabar-live.js` mengimpor URL
     CDN yang SAMA PERSIS (firebase-app.js 12.16.0), jadi peramban memberi
     keduanya SATU instans modul — satu peta `_apps` bersama.

     Terukur (node, SDK 12.16.0 yang sama, satu registri modul):
       initializeApp(<7 kunci, dari kabar-fb.js>)   → [DEFAULT] dibuat
       initializeApp(<6 kunci, dari kabar-live.js>) → LEMPAR app/duplicate-app

     Di aplikasi React itu berarti: buka /news/studio DULU (berkas ini menang,
     7 kunci), lalu pindah ke /news → `kabar-live.js` melempar, galatnya ditelan
     `catch` senyapnya, `onSnapshot` tidak pernah berlangganan, dan
     `window.__kMerge` tidak pernah dipanggil. Artikel yang BARU SAJA diterbitkan
     admin tidak muncul di halaman berita — tanpa galat, tanpa 403, tanpa satu
     pun petunjuk. Dan `useSiteScripts` menyimpan src yang sudah dimuat seumur
     sesi, jadi bolak-balik halaman TIDAK mencobanya lagi: mati sampai muat ulang
     penuh. Persis urutan yang ditempuh admin sesudah menekan "Terbitkan".

     Konfigurasi di sini karena itu WAJIB identik dengan `CFG` di
     `kabar-live.js` dan dengan `firebaseConfig` di `src/firebaseInti.ts` —
     enam kunci, tidak lebih. */
};

/* ⛔ DAFTAR, BUKAN SATU EMAIL. Sebelumnya `ADMIN_EMAIL` memaku
   "glyiv.archourium@gmail.com" seorang diri, sementara `firestore.rules` dan
   `src/config/adminAllowlist.ts` mengenal DUA pendiri. Akibatnya bukan lubang
   keamanan — server tetap mengizinkan keduanya — melainkan arah kebalikannya,
   yang tidak pernah memunculkan galat: pendiri yang login dengan
   archourium@gmail.com dijawab layar "Akun ini bukan admin" oleh Studio,
   padahal aturan di server mempersilakannya menulis.

   Daftar ini WAJIB sama persis dengan `ADMIN_ALLOWLIST` di
   `src/config/adminAllowlist.ts` dan dengan `isAdminEmail()` di
   `firestore.rules`. */
export const ADMIN_EMAILS = [
  "archourium@gmail.com",
  "glyiv.archourium@gmail.com",
];
/** Benar bila `email` termasuk pendiri. Perbandingan huruf kecil: Google
    mengembalikan surel apa adanya, dan "Archourium@gmail.com" adalah akun yang
    sama dengan "archourium@gmail.com". */
export function isKabarAdmin(email) {
  return ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
}
/** @deprecated dipertahankan untuk pemanggil lama; pakai `isKabarAdmin()`. */
export const ADMIN_EMAIL = ADMIN_EMAILS[0];

/** Koleksi admin DINAMIS — kembaran `admin_emails` di `firestore.rules`. */
export const COLL_ADMIN = "admin_emails";

/* ⛔ DAFTAR STATIS DI ATAS BUKAN LAGI SELURUH JAWABANNYA, DAN ITU SEBABNYA
   FUNGSI INI ADA.

   Gejalanya, dilaporkan pemilik 20 Agustus 2026: *"admin glyiv.io@gmail.com yang
   sudah jadi admin harusnya bisa tambah atau edit berita"* — Studio menjawabnya
   dengan layar "Akun ini bukan admin".

   Terukur, bukan dikira: `admin_emails/glyiv.io@gmail.com` MEMANG ADA di
   Firestore, dan akun Auth-nya `emailVerified: true`. Artinya `isAdminEmail()`
   di `firestore.rules` sudah mempersilakannya menulis — yang menolak cuma
   `ADMIN_EMAILS` di berkas ini, sebuah daftar yang dipaku saat hanya ada dua
   pendiri dan tidak pernah tahu bahwa halaman "Kelola admin" bisa menambah orang.

   Ini bentuk cacat yang SAMA dengan yang melahirkan daftar itu, hanya terbalik
   arahnya: dulu Studio menolak pendiri yang server izinkan; kini ia menolak admin
   dinamis yang server izinkan. Karena itu yang ditulis di sini bukan daftar
   ketiga, melainkan pertanyaan yang PERSIS sama dengan yang server tanyakan.

   ⛔ `email_verified` IKUT DIPERIKSA, DAN ITU DISENGAJA. Aturannya menuntutnya;
   kalau di sini tidak, kita menukar kegagalan yang jujur ("bukan admin", terbaca
   di layar) dengan kegagalan yang diam: Studio membuka pintu, lalu setiap
   simpanan ditolak server sebagai galat izin yang jauh dari sebabnya.

   Async, karena jawabannya ada di server. Pemanggilnya sudah async keduanya. */
/* ⛔ KEPUTUSANNYA DIPISAH DARI PEMBACAANNYA, DAN ITU BUKAN KERAPIAN.
   Cacat yang melahirkan fungsi ini murni LOGIKA — sebuah daftar yang dipaku —
   bukan tampilan. Selama keputusan itu terkurung di dalam pemanggilan Firestore,
   satu-satunya cara mengujinya adalah membuka peramban dan benar-benar login
   sebagai tiap jenis akun; artinya, dalam praktiknya, tidak pernah diuji.
   Dengan pembacaannya disuntikkan, seluruh cabangnya bisa diadu di Node dalam
   hitungan milidetik — lihat `scripts/test-kabar-admin-gate.cjs`. */
export async function putuskanAdmin(user, adaDiKoleksi) {
  const email = String((user && user.email) || "").trim().toLowerCase();
  if (!email) return false;
  if (ADMIN_EMAILS.includes(email)) return true;      // pendiri: tanpa baca
  /* Cerminan `request.auth.token.email_verified == true` di firestore.rules.
     Kalau syarat ini dilewat di sini, kita menukar penolakan yang JUJUR dengan
     penolakan yang DIAM: Studio terbuka, lalu tiap simpanan ditolak server. */
  if (user && user.emailVerified !== true) return false;
  try {
    return (await adaDiKoleksi(email)) === true;
  } catch {
    /* Aturan mengizinkan admin membaca dokumennya sendiri; bagi yang BUKAN admin
       bacaannya ditolak, dan penolakan itu justru jawabannya. Dilempar ke layar
       sebagai galat akan menyebut "permission-denied" kepada orang yang memang
       tidak berwenang — membingungkan, dan bukan kesalahan sistem. */
    return false;
  }
}

export async function isKabarAdminAsync(user) {
  return putuskanAdmin(user, async (email) => {
    if (!db) return false;
    const d = await getDoc(doc(db, COLL_ADMIN, email));
    return d.exists();
  });
}
export const COLL = "kabar_articles";

let app = null, db = null, auth = null, storage = null;
export let fbReady = false;

/* ⛔ `initializeApp()` POLOS MEMATIKAN STUDIO DI glyiv.web.app, DAN DIAM-DIAM.
   Aplikasi React sudah memanggil `initializeApp` untuk aplikasi [DEFAULT] di
   `src/firebase.ts`. Ketika berkas ini memanggilnya LAGI, Firebase melempar
   `app/duplicate-app` — dan `catch` di bawah mengubahnya jadi
   `fbReady = false`, yang di layar hanya berbunyi "Firebase belum siap".

   Ini BALAPAN, jadi ia tidak selalu terlihat. Terukur di peramban
   14 Agustus 2026, dev server:
     · buka LANGSUNG /news/studio  → kabar-fb.js menang → Studio hidup
     · buka /news dulu lalu ke Studio → src/firebase.ts menang → app/duplicate-app
       → panel "Firebase belum siap", dan tidak ada satu pun galat merah
   Artinya menyimpan berita bisa mustahil TERGANTUNG halaman mana yang dibuka
   lebih dulu — bentuk kegagalan yang paling sulit dipercaya saat dilaporkan.

   Yang benar: PAKAI ULANG aplikasi yang sudah ada. Itu juga yang sejak awal
   dimaksudkan catatan konfigurasi di atas ("supaya berkas statis ini dan
   aplikasi React memakai proyek, sesi login, dan aturan yang PERSIS SAMA"), dan
   ia memberi bonus yang nyata: SESI LOGIN JADI SATU. Admin yang sudah masuk di
   konsol React tidak perlu menekan "Masuk dengan Google" lagi di Studio.

   Kalau aplikasi [DEFAULT] yang sudah ada ternyata menunjuk PROYEK LAIN, kita
   tidak boleh menumpanginya — artikel akan ditulis ke tempat yang salah tanpa
   galat apa pun. Untuk kasus itu dibuat aplikasi BERNAMA tersendiri. */
function ambilApp() {
  const adaDefault = getApps().some((a) => a.name === "[DEFAULT]");
  if (adaDefault) {
    const bawaan = getApp();
    if (bawaan.options && bawaan.options.projectId === firebaseConfig.projectId) return bawaan;
    console.warn("Kabar: aplikasi [DEFAULT] menunjuk proyek lain (" + (bawaan.options && bawaan.options.projectId) + "); memakai aplikasi terpisah.");
    return initializeApp(firebaseConfig, "kabar");
  }
  return initializeApp(firebaseConfig);
}

try {
  app = ambilApp();
  db = getFirestore(app);
  auth = getAuth(app);
  fbReady = true;
} catch (e) { console.warn("Kabar: Firebase off, local fallback.", e && e.message); fbReady = false; }

/* Storage TERPISAH dari blok di atas dengan sengaja: kegagalannya tidak boleh
   ikut mematikan Firestore. Tanpa pemisahan ini, satu masalah pada modul
   Storage membuat seluruh Studio berbunyi "Firebase belum siap" — padahal
   membaca dan menerbitkan artikel sama sekali tidak membutuhkannya, dan
   gambar hero masih bisa diisi lewat kolom alamat. */
try {
  if (app) storage = getStorage(app);
} catch (e) { console.warn("Kabar: Storage tidak aktif; unggah hero memakai kolom alamat.", e && e.message); storage = null; }

export { db, auth, storage, doc, collection, getDoc, getDocs, onSnapshot, query, where, orderBy, updateDoc, increment, setDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };

/* ---------- gambar hero: unggah ke Cloud Storage ---------- */

/* ⛔ JALUR INI HARUS ADA DI `storage.rules`, DAN KALAU BELUM, KEGAGALANNYA
   WAJIB TERBACA. Per 14 Agustus 2026 `storage.rules` mengenal empat prefiks
   saja — `kyc/`, `outlets/{slug}/menu/`, `outlets/{slug}/qris/`,
   `outlets/{slug}/brand/` — dan tidak satu pun cocok dengan `kabar/`. Perilaku
   bawaan Cloud Storage adalah TOLAK SEMUA, jadi tanpa blok baru di sana setiap
   unggahan hero dijawab `storage/unauthorized`.

   Yang HARUS ditambahkan agen utama ke `storage.rules` (di dalam
   `match /b/{bucket}/o`), persis seperti ini:

     match /kabar/{articleId}/{berkas} {
       allow read: if true;
       allow write: if isAdminEmail() && ukuranWajar() && tipeDiizinkan();
     }

   `allow read: if true` BUKAN kelalaian — alasannya sama persis dengan foto
   menu outlet: gambar hero tampil di /news kepada pembaca yang TIDAK login,
   sering sebelum sesi apa pun ada. Objek yang butuh sesi untuk dibaca akan
   membuat setiap kartu artikel kosong.

   ⚠︎ Kegagalannya SENGAJA tidak ditelan di sini (bandingkan `kabar-live.js`
   yang menulis `.catch(function () {})` dan karena itu mematikan tombol suka
   selama berbulan-bulan tanpa satu pun galat). `unggahHero()` melempar galat
   berbahasa manusia yang menyebut jalurnya, supaya yang muncul di layar adalah
   sebab dan langkah berikutnya — bukan "gagal". */
export const HERO_MAX_BYTES = 5 * 1024 * 1024;
export const HERO_TIPE = ["image/jpeg", "image/png", "image/webp"];

function ekstensiDari(file) {
  const m = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  return m[file.type] || "jpg";
}

/** Unggah satu gambar hero untuk `slug`. Mengembalikan URL unduh publik.
    Nama berkas BERVERSI (stempel waktu), jadi "ganti gambar" menulis objek
    BARU alih-alih menimpa — pola yang sama dengan QRIS, logo outlet, dan KYC,
    supaya artikel yang sudah terbit tidak berubah gambarnya di belakang
    pembaca yang sedang membukanya. */
export async function unggahHero(slug, file) {
  if (!fbReady || !storage) throw new Error("Firebase tidak aktif di lingkungan ini.");
  if (!file) throw new Error("Tidak ada berkas yang dipilih.");
  if (!HERO_TIPE.includes(file.type)) throw new Error("Format tidak didukung. Pakai JPG, PNG, atau WebP.");
  if (file.size > HERO_MAX_BYTES) throw new Error("Berkas " + (file.size / 1048576).toFixed(1) + " MB — batasnya 5 MB. Perkecil dulu gambarnya.");
  const jalur = "kabar/" + slug + "/hero-" + Date.now() + "." + ekstensiDari(file);
  try {
    const r = srefRaw(storage, jalur);
    await uploadBytes(r, file, { contentType: file.type });
    return await getDownloadURL(r);
  } catch (e) {
    const kode = (e && e.code) || "";
    if (kode === "storage/unauthorized") {
      throw new Error(
        "Ditolak Cloud Storage untuk jalur " + jalur + ". Aturan `kabar/{articleId}/{berkas}` " +
        "belum diterbitkan, atau akun ini bukan admin. Sementara itu, isi kolom " +
        "\"atau tempel alamat gambar\" di bawah — artikel tetap bisa terbit."
      );
    }
    if (kode === "storage/unauthenticated") throw new Error("Sesi login habis. Keluar lalu masuk lagi sebagai admin.");
    if (kode === "storage/retry-limit-exceeded") throw new Error("Unggahan putus (jaringan). Coba lagi.");
    throw new Error("Gagal mengunggah: " + (kode || (e && e.message) || "sebab tidak diketahui"));
  }
}

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

/* ⛔ MESIN KETIGA — DAN SAMPAI 20 AGUSTUS 2026 IA SATU-SATUNYA YANG TIDAK
   MEMANGKAS JADI EMPAT.

   Ronde "Story = 4 kartu" menyatukan DUA mesin: `dist/lab/kabar/kabar.js`
   (halaman publik) dan `src/pages/admin/newsletter/storyCard.ts` (konsol
   React), lalu mengadu keduanya di `scripts/check-card-count.cjs`. Berkas ini
   adalah mesin KETIGA — jalur baca Kabar Studio (`kabar-admin.js`) — dan ia
   tidak ikut, jadi gerbangnya hijau sementara aturannya masih terbelah:

     · `if (a.story && a.story.length) return a.story;` mengembalikan `story`
       tersimpan APA ADANYA. Dokumen mana pun yang masih menyimpan tujuh kartu
       digambar Studio sebagai tujuh, sementara situs menggambar empat — dua
       jumlah untuk satu benda, persis cacat yang ronde itu tutup di sisi lain.
     · `.slice(0, 8)` adalah batas LAMA. Turunan dari naskah panjang keluar
       sebagai delapan kartu di Studio.

   Sekarang blok aturannya DISALIN UTUH dari `kabar.js` (penanda yang sama), dan
   `scripts/check-card-count.cjs` MENJALANKAN salinan ini juga lalu mengadunya
   kartu-demi-kartu dengan dua mesin lainnya. Tiga salinan yang diadu tidak bisa
   berpisah diam-diam; tiga salinan yang hanya dibaca, bisa. */

/* <ATURAN-4-KARTU> */
var POST_CARD_COUNT = 4;
var MIDDLE_RANK = { hook: 0, stat: 1, quote: 2, point: 3, cover: 4, end: 5 };
function emptyStoryCard(kind) {
  return { kind: kind, title: "", text: "", big: "", label: "", source: "" };
}
function toPostCards(cards) {
  var list = Object.prototype.toString.call(cards) === "[object Array]" ? cards : [];
  if (list.length === POST_CARD_COUNT) return list;

  if (list.length > POST_CARD_COUNT) {
    var openIndex = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].kind === "cover") { openIndex = i; break; }
    }
    var closeIndex = list.length - 1;
    for (var j = list.length - 1; j > openIndex; j--) {
      if (list[j] && list[j].kind === "end") { closeIndex = j; break; }
    }
    var middle = [];
    for (var m = openIndex + 1; m < closeIndex; m++) {
      var kind = list[m] && list[m].kind;
      var rank = Object.prototype.hasOwnProperty.call(MIDDLE_RANK, kind)
        ? MIDDLE_RANK[kind]
        : MIDDLE_RANK.point;
      middle.push({ card: list[m], order: m, rank: rank });
    }
    middle.sort(function (a, b) { return a.rank - b.rank || a.order - b.order; });
    var keep = middle.slice(0, POST_CARD_COUNT - 2);
    keep.sort(function (a, b) { return a.order - b.order; });
    var out = [list[openIndex]];
    for (var k = 0; k < keep.length; k++) out.push(keep[k].card);
    out.push(list[closeIndex]);
    list = out;
  }

  /* Terlalu pendek: disulam kartu KOSONG, tidak pernah kalimat karangan. Sisip
     SEBELUM kartu penutup supaya penutupnya tetap terakhir. */
  var padded = list.slice();
  while (padded.length < POST_CARD_COUNT) {
    var last = padded.length > 0 ? padded[padded.length - 1] : null;
    var atEnd = last && last.kind === "end";
    padded.splice(atEnd ? padded.length - 1 : padded.length, 0, emptyStoryCard("point"));
  }
  return padded;
}
/* </ATURAN-4-KARTU> */

export { toPostCards, POST_CARD_COUNT };

/* derive story slides from blocks when an article has none */
function deriveStory(a) {
  if (a.story && a.story.length) return toPostCards(a.story);
  const s = [{ kind: "cover", title: a.title, text: a.dek }];
  if (a.hook) s.push({ kind: "hook", title: a.hook });
  (a.blocks || []).forEach((b) => {
    if (b.t === "h2") s.push({ kind: "point", title: b.x });
    else if (b.t === "pull") s.push({ kind: "quote", text: b.x });
    else if (b.t === "stat") s.push({ kind: "stat", big: b.n, label: b.l, source: b.s });
  });
  s.push({ kind: "end", title: "Baca selengkapnya di Glyiv", text: "Wawasan karbon, jujur & bisa dipertanggungjawabkan." });
  /* `.slice(0, 8)` LAMA DIGANTI, BUKAN DITAMBAHI — satu batas panjang di
     seluruh sistem, dan batas itu POST_CARD_COUNT. */
  return toPostCards(s);
}

/**
 * URL keempat kartu media sosial, TERURUT, atau `[]`.
 *
 * ⛔ DIURUTKAN MENURUT `index`, BUKAN MENURUT URUTAN DI DALAM ARRAY. Keduanya
 * kebetulan sama hari ini; ketika tidak, Story akan menampilkan kartu 3 sebagai
 * pembuka — tanpa galat, dan tampak sengaja.
 *
 * Mengembalikan `[]` kalau JUMLAHNYA tidak persis empat. Sebagian gambar lebih
 * buruk daripada tidak sama sekali: Story yang setengah gambar setengah teks
 * terbaca seperti halaman yang rusak, sedangkan Story teks sepenuhnya adalah
 * bentuk yang memang sudah ada dan bekerja.
 */
export function kartuSosial(a) {
  const r = a && a.socialCards && a.socialCards.rendered;
  const daftar = (r && Array.isArray(r.cards)) ? r.cards.slice() : [];
  if (daftar.length !== POST_CARD_COUNT) return [];
  daftar.sort((x, y) => Number(x.index || 0) - Number(y.index || 0));
  const url = daftar.map((k) => String((k && k.url) || "").trim());
  return url.every(Boolean) ? url : [];
}

export function normalize(a, id) {
  const slug = a.slug || id || slugify(a.title);
  /* ⛔ ALAMAT INGGRIS — MEDAN TAMBAHAN, BUKAN PENGGANTI `slug`.
     `slug` tetap ID dokumen Firestore, nama berkas hero, dan alamat yang sudah
     tersebar; menggantinya akan mematikan semuanya sekaligus. Permintaan pemilik
     20 Agustus 2026 (*"linknya yang kita post di komunitas telegram masih bahasa
     indonesia"*) dijawab dengan alamat KEDUA yang menunjuk artikel yang sama.
     Artikel yang belum punya (mis. tulisan baru dari Studio) jatuh ke slugnya
     sendiri — alamatnya tetap bekerja, hanya belum berbahasa Inggris. */
  const slugEn = a.slugEn || slug;
  return {
    slug, id: slug, slugEn,
    /* ⛔ KARTU MEDIA SOSIAL YANG SUDAH JADI, DIBAWA KE PEMBACA.
       Permintaan pemilik 20 Agustus 2026: *"Harusnya story di artikel itu
       tampilkan card yang sama saja dengan yang ditampilkan di sosial media."*

       Naskahnya memang sudah sama — `deriveStory()` di bawah memangkas cerita
       tersimpan lewat `toPostCards()`, jadi pembaca dan Instagram melihat empat
       adegan yang sama, dalam urutan yang sama. Yang BERBEDA rupanya: Story
       menggambar slide HTML-nya sendiri, sementara media sosial memakai kartu
       1:1 lengkap dengan bentuk merek dan gambar heronya. Dua rupa untuk satu isi.

       Medan ini membawa gambar kartu yang SUDAH DITERBITKAN (terukur: ada di
       102/102 dokumen), supaya Story menampilkan benda yang sama persis — bukan
       tiruannya yang digambar ulang, yang akan melenceng pada perubahan desain
       pertama tanpa satu pun galat. */
    cardImages: kartuSosial(a),
    topic: a.topic || "Kabar",
    mood: a.mood || "#1F7A6B",
    title: a.title || "",
    dek: a.dek || "",
    hook: a.hook || a.dek || a.title,
    cover: a.cover || "",
    /* Kredit gambar sampul — metadata aset, bukan bagian badan artikel. Bentuk
       dan alasannya ditulis panjang di `kabar.js` → `kreditNorm()`; di sini ia
       hanya DITERUSKAN apa adanya supaya Studio bisa membacanya kembali dan
       halaman publik bisa menggambarnya. `null` = artikel ini belum punya
       catatan asal gambar, dan halaman tidak menggambar apa pun. */
    coverCredit: a.coverCredit || null,
    author: a.author || "Glyiv Team",
    role: a.role || "",
    read: a.read || 4,
    blocks: a.blocks || [],
    story: deriveStory(a),
    /* Apakah `story` DATANG DARI DOKUMEN, atau baru diturunkan barusan.
       `deriveStory()` selalu mengembalikan daftar tidak kosong, jadi sesudah
       baris di atas kedua asal-usul itu tidak bisa dibedakan lagi — padahal
       Studio perlu membedakannya untuk memperingatkan bahwa slide rakitan
       tangan akan disusun ulang saat disimpan. Berawalan `_` = turunan,
       tidak pernah ditulis kembali ke Firestore. */
    _storyAsli: Array.isArray(a.story) && a.story.length > 0,
    sources: a.sources || [],
    orb: a.orb || ("Tanya soal " + (a.topic || "ini")),
    views: a.views || 0, likes: a.likes || 0, shares: a.shares || 0, storyViews: a.storyViews || 0,
    status: a.status || "published",
    /* `jenis` adalah ENUM TERTUTUP, bukan teks bebas seperti `topic`, dan itu
       yang membedakannya. `topic` hanya digambar sebagai chip; `jenis` memilih
       apakah halaman publik memasang PENGUNGKAPAN "konten mitra, belum
       diverifikasi Glyiv". Label yang membawa disclaimer tidak boleh bergantung
       pada apa yang diketik orang — penalarannya sama dengan `jenis` di
       `outlets/{slug}/posts` (lihat firestore.rules): sebuah artikel mitra
       adalah KLAIM MITRA, bukan temuan Glyiv. Nilai apa pun di luar daftar
       diperlakukan sebagai "redaksi", yang merupakan sisi yang lebih ketat
       hanya kalau labelnya tidak bisa hilang diam-diam — karena itu Studio
       memvalidasinya saat menulis, bukan hanya saat membaca. */
    jenis: a.jenis === "mitra" ? "mitra" : "redaksi",
    mitra: a.mitra || "",
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
