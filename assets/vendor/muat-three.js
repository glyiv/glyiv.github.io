/* ══════════════════════════════════════════════════════════════════════════════
   Pemuat three.js — dijalankan sebagai <script type="module" src="…">.
   ══════════════════════════════════════════════════════════════════════════════

   Kenapa berkas perantara ini ada, dan bukan `import()` langsung dari kode React:

   `three.module.js` tinggal di `public/`, jadi ia BUKAN bagian dari graf modul
   Vite. Memanggil `import("/assets/vendor/three.module.js")` dari dalam kode
   aplikasi membuat analisis impor Vite menambahkan `?import` pada URL-nya —
   bahkan dengan `/* @vite-ignore *​/` — lalu middleware transform-nya mencoba
   memproses berkas 1,2 MB itu dan menjawab **500**:

       GET /assets/vendor/three.module.js          → 200  1.272.972 B
       GET /assets/vendor/three.module.js?import   → 500  "Failed to load url"

   Modelnya tetap tergambar (permintaan yang 200 yang dipakai), jadi cacatnya tak
   terlihat di layar — hanya konsol yang jadi kotor, dan konsol kotor adalah
   konsol yang tak lagi dibaca.

   Berkas ini menghindarinya: ia disuntik sebagai `<script type="module" src>`,
   jadi **peramban** yang menyelesaikan `import` di bawah, bukan Vite. Karena
   berkasnya juga tinggal di `public/`, ia disajikan verbatim tanpa transform.

   Tanpa skrip sebaris → tidak butuh `unsafe-inline` di CSP.
*/
import * as Tiga from "/assets/vendor/three.module.js";

window.__glyivTiga = Tiga;
window.dispatchEvent(new Event("glyiv-tiga-siap"));
