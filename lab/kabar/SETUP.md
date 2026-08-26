# Kabar / Glyiv News — Firebase setup

Kabar runs on the **same Firebase project as the rest of Glyiv: `glyiv-5cb33`**.
There is no separate newsletter project any more.

The feed itself renders from the bundled content pack (`kabar-data.js` +
`content-pack.js`), so it never depends on Firestore being up. Firestore adds two
things on top: **shared real-time engagement** (views/likes/shares) and **admin
publishing** through Studio.

---

## ⛔ Kalau kamu datang ke berkas ini karena Kabar "kosong" — baca ini dulu

Sampai **13 Agustus 2026** seluruh mesin Kabar menunjuk proyek **`glyiv-28711`**.
Itu proyek tempat Kabar lahir, waktu ia hanya hidup di glyiv.github.io. Diukur di
produksi hari itu, `runQuery` tanpa token:

```
GET  kabar_articles/pajak-karbon-indonesia-kemana @glyiv-5cb33 → 200 (ada isinya)
GET  kabar_articles/pajak-karbon-indonesia-kemana @glyiv-28711 → 404 NOT_FOUND
runQuery status=="published" @glyiv-5cb33                      → 200, 87 dokumen
runQuery status=="published" @glyiv-28711                      → 200, 0 dokumen
```

Artikelnya tidak pernah hilang — ia ada di proyek sebelah. Dan **tidak ada satu
pun galat** yang muncul, karena:

- `listArticles()` jatuh ke `window.KABAR` begitu Firestore menjawab nol, jadi
  halamannya tetap penuh artikel;
- `kabar-live.js` menelan galat langganan (`function () {}` kosong), jadi
  penghitung tinggal di localStorage dan terlihat berfungsi;
- Studio di `glyiv.web.app` ditolak `auth/unauthorized-domain` **sebelum** surel
  siapa pun dibaca — `glyiv.web.app` tidak pernah ada di authorizedDomains
  `glyiv-28711` (isinya: localhost, glyiv-28711.firebaseapp.com,
  glyiv-28711.web.app, glyiv.github.io).

Versi lama dokumen ini menyuruh orang menerbitkan aturan **ke proyek yang salah**,
dan itu bagian dari sebabnya. Jangan hidupkan lagi jalur `glyiv-28711`.

---

## Yang sudah beres (tidak perlu dikerjakan lagi)

1. **Aturan keamanan** — ada di `/firestore.rules` di akar repo, blok
   `match /kabar_articles/{articleId}`. Terbit bersama aturan lain lewat
   `firebase deploy --only firestore:rules`. Berkas `./firestore.rules` di folder
   ini sudah dikosongkan jadi penunjuk arah; **jangan** menerbitkan dari sana.
2. **Indeks gabungan** (`status` ASC + `publishAt` DESC) — ada di
   `/firestore.indexes.json` di akar repo. *Diukur 2026-07-31:* tanpa indeks itu
   kueri berurut menjawab **HTTP 400 `FAILED_PRECONDITION`**, bukan daftar
   kosong. Feed web dan widget Android sama-sama mundur ke kueri tanpa urutan
   lalu mengurutkan di perangkat, jadi tidak ada yang terlihat rusak — persis
   sebabnya langkah ini selalu dilewati, lalu diam-diam membayar satu pembacaan
   per artikel setiap penyegaran.
3. **Google sign-in** — sudah menyala di `glyiv-5cb33`.

## ⚠︎ SATU LANGKAH YANG MASIH MILIK PEMILIK — dan tanpanya Studio di github.io mati

Pemindahan ini **menukar** domain mana yang bisa login, dan itu harus disebut
apa adanya. Diukur lewat `identitytoolkit.googleapis.com/v1/projects` hari ini:

```
glyiv-5cb33 authorizedDomains: localhost, glyiv-5cb33.firebaseapp.com,
                               glyiv-5cb33.web.app, glyiv.web.app,
                               glyiv.firebaseapp.com, glyiv.io, www.glyiv.io
glyiv-28711 authorizedDomains: localhost, glyiv-28711.firebaseapp.com,
                               glyiv-28711.web.app, glyiv.github.io
```

`glyiv.web.app` **ada** di `glyiv-5cb33` — itulah yang memperbaiki Studio di situs
yang pemilik uji. Tetapi `glyiv.github.io` **TIDAK ada** di sana. Jadi:

| Halaman | glyiv.web.app | glyiv.github.io |
|---|---|---|
| Membaca artikel & penghitung | jalan | jalan |
| Masuk ke Studio (`/news/studio`, `/lab/kabar/admin.html`) | **jalan (baru)** | **mati sampai langkah di bawah dikerjakan** |
| Gerbang admin situs (`#admin`, `/lab/landing/*`) | **jalan (baru)** | **mati sampai langkah di bawah dikerjakan** |

Membaca tidak terpengaruh sama sekali — `authorizedDomains` hanya mengatur
jendela login OAuth, bukan pembacaan Firestore.

**Langkah yang tersisa (± 30 detik, hanya bisa dilakukan pemilik proyek):**
Firebase Console → proyek **glyiv-5cb33** → *Authentication* → *Settings* →
*Authorized domains* → **Add domain** → `glyiv.github.io`.

Selama itu belum dikerjakan, login di glyiv.github.io dijawab
`auth/unauthorized-domain`. Ini ditulis di sini, bukan cuma di laporan ronde,
supaya orang berikutnya yang menemukan Studio github.io mati tahu sebabnya dalam
sepuluh detik alih-alih membongkar ulang seluruh rantai konfigurasi.

## Menerbitkan artikel

1. Buka **`/news/studio`** (di glyiv.web.app) atau `/lab/kabar/admin.html`
   (di glyiv.github.io) dan masuk dengan **salah satu** surel pendiri:
   `archourium@gmail.com` atau `glyiv.archourium@gmail.com`.
   Daftarnya satu sumber: `ADMIN_EMAILS` di `kabar-fb.js`, `ADMIN_ALLOWLIST` di
   `src/config/adminAllowlist.ts`, dan `isFounderEmail()` di `/firestore.rules`
   — ketiganya WAJIB sama.
2. **Import Content Pack** menulis artikel yang belum ada ke `kabar_articles`:
   10 tayang sekarang, sisanya terjadwal satu per hari. Yang sudah ada
   **dilewati**, jadi angka keterlibatan tidak pernah tereset.
3. Kelola antrean dari halaman yang sama: **Publish now**, **Schedule**,
   **Unpublish (draft)**, **Delete**, **Preview**.

## Bagaimana keterlibatan tetap real-time

- Halaman feed & artikel berlangganan `kabar_articles` lewat `onSnapshot`.
- Views/likes/shares/storyViews ditulis dengan `increment()`. Aturan mengizinkan
  publik mengubah **hanya** keempat kolom itu, **hanya** pada artikel yang sudah
  terbit, dan **paling banyak ±1 per permintaan** — batas terakhir itu penting:
  tanpa dia, "hanya boleh mengubah kolom penghitung" masih membiarkan satu
  permintaan menyetel views ke 10⁹.
- Satu perangkat menyukai sekali (dideduplikasi lokal); satu tayangan dihitung
  sekali per hari per artikel.
- Sebelum Firestore terisi, situs mundur ke `content-pack.js`, jadi newsletter
  selalu tampil.

## Berbagi

Tiap artikel/story punya **X, Facebook, LinkedIn, WhatsApp** plus **Instagram**
(menyalin tautan) dan lembar berbagi bawaan perangkat. Tiap berbagi menaikkan
penghitung `shares` yang sesungguhnya.

_Kabar tidak butuh Cloudflare Worker — Firestore diakses langsung dengan aturan
keamanan. (`chat-proxy-worker.js` hanya untuk proxy chat Gly/Groq.)_
