/* GLYIV — SHARED NAVBAR behaviour (scroll state · mobile burger · active page).
   Pairs with /assets/css/glyiv-nav.css. Safe to load on any page, once. */
(function () {
  "use strict";
  if (window.__glyivNav) return; window.__glyivNav = true;

  /* Penjaga muat: halaman tanpa navbar situs sama sekali (mis. /design1.html,
     /lab/gabung/, /lab/kabar/admin.html — terukur: 3 dari 62 halaman dist) tidak
     perlu apa pun dari berkas ini, termasuk pemuat Gly & site-lang di bawah.
     Sengaja `.lnav` APA SAJA, bukan `navSitus()`: navbar aplikasi React
     (`.lnav--app`) tidak memakai perilaku di bawah tetapi TETAP butuh chatbot
     dan kamus bahasanya. */
  if (!document.querySelector(".lnav")) return;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ══ LEMBAR GAYA PASANGANNYA — DIPERIKSA, BUKAN DIPERCAYA ═══════════════════
     ⛔ CACAT YANG MELAHIRKAN BLOK INI. Pemilik: bilah di ponsel "terbalik" —
     tembus pandang saat laci dibuka, padahal aturan yang membuatnya pekat ADA di
     glyiv-nav.css. Yang salah bukan aturannya, melainkan SALINAN yang dipakai
     peramban. Terukur di glyiv.web.app/app-store, 412x915, pointer kasar:

       lembar yang TERPASANG (dari cache)   : 56 aturan puncak,
                                              @media(max-width:900px) beranak 12
       berkas di URL yang SAMA, diambil
       dengan fetch(cache:"reload")         : 80 aturan puncak, beranak 20

     Delapan aturan yang hilang itu seluruhnya di dalam blok <=900px — termasuk
     kelima `body.lnav-open .lnav…`. Karena itu cacatnya hanya muncul di ponsel
     dan tidak pernah di desktop. Akibatnya, dengan laci dibuka lewat ketukan
     sungguhan di puncak halaman:

       salinan basi  : .lnav background rgba(0, 0, 0, 0)  · merek rgb(255,255,255)
       salinan segar : .lnav background rgb(255, 255, 255) · merek rgb(15, 46, 34)
                       (kontras merek/bilah 14,64:1)

     Header pun tidak menyelamatkan: `/assets/css/glyiv-nav.css` disajikan dengan
     `Cache-Control: no-cache, must-revalidate` dan TETAP terpakai dari cache
     (terukur `transferSize` 0, `encodedBodySize` 2.395 bait melawan 8.298 bait
     salinan hari ini). Sementara itu skripnya SENDIRI selalu segar, karena
     `useSiteScripts` menempelkan `?v=<BUILD_ID>` pada berkas JS — tetapi
     `index.html:194` memuat CSS-nya TANPA penanda versi. Jadi pasangan ini bisa
     berbeda umur, dan yang bisa mendeteksinya hanya sisi yang selalu segar.

     Blok panjang "LACI TERBUKA" di glyiv-nav.css sudah menuliskan bahaya
     pasangan beda-umur ini dan menutup arah yang satu (CSS baru + JS lama).
     Blok ini menutup arah sebaliknya (CSS lama + JS baru), yang justru yang
     terjadi. Yang jadi USANG karenanya: langkah manual "Ctrl+Shift+R" di
     CLAUDE.md — untuk navbar, tidak diperlukan lagi.

     ⚠︎ Yang diperiksa KEMAMPUAN, bukan nomor versi: nomor versi harus dinaikkan
     dengan tangan dan akan berbohong pada ronde pertama yang lupa. Di sini
     ditanyakan langsung: apakah lembar yang terpasang punya aturan latar untuk
     bilah saat laci terbuka? Kalau tidak ada, salinannya mendahului skrip ini.

     ⚠︎ Diganti sebagai <style> sebaris, bukan <link> ber-`?t=`: `cache:"reload"`
     MEMPERBARUI entri cache-nya sekaligus, jadi muat berikutnya sudah benar
     tanpa permintaan tambahan — sementara URL ber-cap waktu akan mengunduh ulang
     selamanya. Aman disebariskan karena berkas ini tidak punya satu pun `url(`
     maupun `@import` (terukur: 0), jadi tidak ada alamat relatif yang berpindah
     acuan. Disisipkan TEPAT DI TEMPAT tautannya berdiri supaya urutan kaskade
     terhadap lab.css / glyiv-rtl.css / bundel Vite tidak bergeser sedikit pun.

     Kalau salinan barunya ternyata tidak lebih baik, tautan lamanya TIDAK jadi
     dibuang — halaman tidak boleh keluar dari sini dalam keadaan lebih buruk. */
  /* ⚠︎ DUA CIRI, BUKAN SATU — ditambah ronde ini bersama panel dropdown selebar
     layar. Ciri pertama (latar bilah saat laci terbuka) hanya membuktikan bahwa
     salinannya lebih baru daripada ronde 58; sebuah salinan yang lolos ciri itu
     tetap bisa mendahului ronde ini, dan hasilnya panel dropdown yang masih
     berupa kartu 920px mengambang sementara `glyiv-nav.js` sudah memasang kelas
     `lnav--drop`/`ldrop--kilau` yang tidak dikenal siapa pun. Ciri kedua
     menanyakan langsung apakah lembar terpasang sudah punya panel selebar layar
     — lewat custom property `--n-drop-x`, yang hanya ada sejak ronde ini.
     ⛔ Kalau ronde berikutnya menambah kemampuan baru pada berkas gaya, TAMBAH
     ciri ketiga di sini. Nomor versi tidak dipakai justru karena ia harus
     dinaikkan dengan tangan dan akan berbohong pada ronde pertama yang lupa. */
  var BERKAS_GAYA = "/assets/css/glyiv-nav.css";
  function kumpulkanCiri(daftar, ciri) {
    for (var i = 0; i < daftar.length; i++) {
      var r = daftar[i];
      if (!r.selectorText && r.cssRules) { kumpulkanCiri(r.cssRules, ciri); continue; }
      if (!r.selectorText || !r.style) continue;
      if (!ciri.panel && r.style.getPropertyValue("--n-drop-x")) ciri.panel = true;
      if (ciri.laci) continue;
      var bagian = r.selectorText.split(",");
      for (var j = 0; j < bagian.length; j++) {
        var sel = bagian[j].trim();
        if (sel.indexOf("lnav-open") > -1 && /\.lnav$/.test(sel) &&
            r.style.getPropertyValue("background-color")) { ciri.laci = true; break; }
      }
    }
    return ciri;
  }
  function punyaAturanLaci(daftar) {
    var c = kumpulkanCiri(daftar, { laci: false, panel: false });
    return c.laci && c.panel;
  }
  function periksaGayaNav() {
    if (window.__glyivNavGaya) return; window.__glyivNavGaya = true;
    var tautan = null, semua = document.querySelectorAll("link[rel~=stylesheet][href]");
    for (var i = 0; i < semua.length; i++) {
      if (semua[i].href.indexOf(BERKAS_GAYA) > -1) tautan = semua[i];
    }
    /* Tidak dimuat sebagai berkas (mis. disebariskan halaman) → jangan menebak. */
    if (!tautan) return;
    if (!tautan.sheet) { // belum selesai diurai — coba lagi saat ia selesai
      window.__glyivNavGaya = false;
      tautan.addEventListener("load", periksaGayaNav, { once: true });
      return;
    }
    var aturan; try { aturan = tautan.sheet.cssRules; } catch (e) { return; } // lintas-asal
    if (!aturan || punyaAturanLaci(aturan)) return; // sudah sezaman
    if (typeof fetch !== "function") return;
    fetch(tautan.href, { cache: "reload" })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (css) {
        if (!css || !tautan.parentNode) return;
        var gaya = document.createElement("style");
        gaya.setAttribute("data-glyiv-nav", "segar");
        gaya.textContent = css;
        tautan.parentNode.insertBefore(gaya, tautan);
        var baik = false;
        try { baik = punyaAturanLaci(gaya.sheet.cssRules); } catch (e) { baik = false; }
        if (baik) tautan.parentNode.removeChild(tautan);
        else gaya.parentNode.removeChild(gaya);
      })
      .catch(function () {});
  }
  periksaGayaNav();

  /* ══ NAVBAR YANG SEDANG HIDUP, BUKAN YANG DITEMUKAN SEKALI ══════════════════
     ⛔ CACAT YANG MELAHIRKAN SELURUH BLOK INI — pemilik, ronde ini:
        "di beberapa halaman, tombol yang menampilkan menu navbar itu tidak bisa
         tertekan" dan "saat di scroll ke bawah, logo dan tulisan Glyivnya hilang".

     Kedua keluhan itu berbagi SATU sebab di dalam SPA. (Keluhan burger punya
     sebab KEDUA yang sama sekali berbeda pada 3 halaman statis — kanvas
     `.liv-fab` yang meluap; penjelasan & angkanya ada di `max-width:100vw`
     di glyiv-nav.css, dan akarnya bukan di berkas ini.)

     Berkas ini dulu memegang `var nav` dan
     `var burger` hasil satu kali `querySelector`, lalu memasang pendengar
     LANGSUNG pada simpul itu. Di dalam SPA React, berpindah halaman MELEPAS
     `<header class="lnav">` lama dan memasang simpul BARU — jadi pendengarnya
     ikut hilang bersama simpul lamanya, dan `nav` yang dipegang di sini menunjuk
     simpul yatim yang tidak lagi ada di dokumen.

     Diukur dengan meniru persis apa yang React lakukan (header dilepas, klon
     dipasang, lalu digulir ke y=1500) di /index.html, 412px, pointer kasar:
       kelas navbar               : "lnav"          ← `.scrolled` tak pernah kembali
       warna teks merek           : rgb(255,255,255) ← PUTIH di atas halaman terang
       laci sesudah burger diketuk: false           ← burger mati
     Itu kedua keluhan pemilik sekaligus, dan sebabnya "beberapa halaman":
     halaman PERTAMA yang dimuat selalu benar, setiap halaman yang dicapai lewat
     navigasi di dalam aplikasi selalu rusak.

     Karena itu: TIDAK ADA pendengar yang dipasang pada simpul navbar.
     Semuanya didelegasikan ke `document`, dan navbarnya dicari ulang setiap kali
     dipakai. `document.contains()` dipakai sebagai penyaring cache — ia tidak
     memaksa tata letak dihitung ulang, jadi aman dipanggil dari jalur gulir
     (pelajaran yang sudah tertulis di memori proyek soal API pembaca tata letak
     per bingkai). */
  var LEBAR_LACI = "(max-width: 900px)";
  /* SATU `MediaQueryList`, dipakai semua pihak. Sebelum ronde ini ada lima
     `matchMedia(LEBAR_LACI)` yang tersebar plus satu lagi yang disimpan di dalam
     `try` di bawah; menambah pemakai keenam (pendengar hover panel) berarti
     menambah tempat keenam yang bisa berbeda pendapat. `laciMode()` juga
     memberi jawaban aman (`false`) di lingkungan tanpa `matchMedia`, yang dulu
     berarti pengecualian yang tak tertangkap di tengah penanganan ketukan. */
  var mqLaci = (function () { try { return matchMedia(LEBAR_LACI); } catch (e) { return null; } })();
  function laciMode() { return mqLaci ? mqLaci.matches : false; }
  var navCache = null;

  /* Navbar SITUS. `.lnav--app` (AppShell React) sengaja dilewati: ia memasang
     tombol burgernya sendiri lewat onClick React, dan kalau berkas ini ikut
     menanganinya keduanya akan menyalakan-lalu-mematikan laci pada satu ketukan. */
  function navSitus() {
    if (navCache && document.contains(navCache)) return navCache;
    var semua = document.querySelectorAll(".lnav");
    for (var i = 0; i < semua.length; i++) {
      if (!semua[i].classList.contains("lnav--app")) { navCache = semua[i]; return navCache; }
    }
    navCache = null;
    return null;
  }

  function milikNavSitus(el) {
    var h = el && el.closest ? el.closest(".lnav") : null;
    return !!h && !h.classList.contains("lnav--app");
  }

  /* ══ TRANSPARAN ATAU TIDAK — DIUKUR, BUKAN DIDEKLARASIKAN ═════════════════
     ⛔ CACAT YANG MELAHIRKAN BLOK INI — pemilik, ronde ini:
        "di halaman apps-store itu navbarnya sudah mentok di atas pun tidak
         berubah backgroundnya menjadi transparan. Harusnya diubah jadi
         transparan."

     Keadaan ini dulu dibaca dari atribut `data-solid` yang ditulis HALAMAN.
     Deklarasi itu tidak bisa benar, karena pada 29 dari 59 halaman dist
     ber-navbar bilahnya BUKAN milik halaman: `lab/apps/apps-shell.js`
     menyuntikkan SATU string `<header class="lnav" data-solid>` yang sama ke
     semua halaman yang memuatnya, dan halaman-halaman itu tidak sejenis.
     Terukur di 412x915 pada seluruh 63 halaman dist:
       · 27 dari 29 halaman suntikan itu PUNYA hero setinggi satu layar
         (`.ga-hero` / `.vhero`, tinggi 915 px, `color` rgb(255, 255, 255))
       · 2 sisanya tidak (/lab/apps/kebun/, /lab/landing/)
     Satu nilai tetap mustahil benar untuk keduanya. Karena itu `data-solid`
     TIDAK lagi dibaca sama sekali; bilah mengukur sendiri apa yang ada di
     bawahnya.

     Yang jadi USANG karenanya (PRINSIP-UIUX §1): atribut `data-solid` itu
     sendiri. Ia kini tidak berpengaruh apa pun dan boleh dihapus dari 7 berkas
     dist + 6 berkas src yang masih membawanya (daftarnya ada di laporan ronde
     ini). Tidak dihapus dari sini karena berkas-berkas itu di luar wilayah
     suntingan ronde ini — meninggalkannya tidak berbahaya, hanya berisik.

     Terukur SESUDAH, 412x915, seluruh 63 halaman dist: 29 halaman berpindah
     dari solid menjadi transparan di puncak, dan 0 halaman berpindah ke arah
     sebaliknya — jadi tidak ada satu pun teks putih baru di atas kertas
     terang. */
  var heroGelap = false;

  function terangkah(warna) {
    var m = (warna || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return false;
    return (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 255 > 0.6;
  }

  /* Hero = blok yang selebar layar, MULAI di atas garis bawah bilah, dan
     MENERUS sedikitnya 45% layar di bawahnya — dan berteks TERANG, yang di
     proyek ini selalu berarti latarnya gelap.

     ⚠︎ `color`, BUKAN `backgroundColor`. Hero situs ini bergambar: terukur di
     /lab/apps/, `.ga-hero` punya `background-color: rgba(0, 0, 0, 0)` — gelapnya
     datang dari `<img class=bg>` dan gradien `::after`. Uji luminansi LATAR
     karena itu menyimpulkan "terang" dan meleset di setiap hero foto.

     ⚠︎ Menyisir DOM, BUKAN `document.elementFromPoint()`. Percobaan pertama
     memakai hit-test dan salah menyimpulkan "tidak ada hero" pada halaman yang
     memasang tirai muat `.gv-splash` — 16 halaman dist. Terukur di /index.html:
     yang terkena di titik uji `div.gv-splash`, `position:fixed; z-index:1000`,
     412x915, sehingga `.vhero` di belakangnya tak pernah terlihat. Berapa
     halaman yang meleset bergantung KAPAN diukur (tirainya menghilang sendiri),
     dan uji yang hasilnya berubah menurut waktu bukan uji. Penyisir tidak
     bergantung siapa yang berada di atas: `position:fixed` dilewati, lalu
     heronya ketemu.

     Biaya terukur sekali sisir: 0,04–0,50 ms (terburuk /pos.html — 115 kandidat
     dan tanpa hero, jadi tersisir sampai habis). Hero yang ada selalu ketemu
     pada kandidat ke-8 sampai ke-15. Fungsi ini TIDAK PERNAH dipanggil dari
     jalur gulir; hasilnya disimpan di `heroGelap` dan jalur gulir hanya membaca
     boolean itu. */
  function ukurHero(nav) {
    var kand = document.body.querySelectorAll("body > *, body > * > *, body > * > * > *");
    var h = nav.getBoundingClientRect().height || 68;
    for (var i = 0; i < kand.length; i++) {
      var el = kand[i], tag = el.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "LINK" || tag === "NOSCRIPT" || tag === "TEMPLATE") continue;
      if (el === nav || nav.contains(el) || (el.closest && el.closest(".lnav"))) continue;
      var r = el.getBoundingClientRect();
      if (r.width < window.innerWidth * 0.9) continue;
      var atas = r.top + window.scrollY;
      if (atas > h || atas + r.height < h + window.innerHeight * 0.45) continue;
      var cs = getComputedStyle(el);
      if (cs.position === "fixed" || cs.display === "none" || cs.visibility === "hidden") continue;
      if (!terangkah(cs.color)) continue;
      return true;
    }
    return false;
  }

  var tick = false;
  function terapkanGulir() {
    var nav = navSitus();
    if (!nav) return;
    /* ⚠︎ Keluhan (b) pemilik — "laci terbuka tapi navbarnya masih transparan" —
       SENGAJA tidak ditangani di sini. Keadaan itu dikunci ke `body.lnav-open`
       di glyiv-nav.css, karena kelas badan itu juga dinyalakan
       `src/layout/AppShell.tsx` tanpa melewati berkas ini; alasan lengkap dan
       angka terukurnya ada di blok "LACI TERBUKA" pada berkas gaya. Menambahkan
       `lnav-open` ke baris di bawah akan membuat dua pihak menyatakan hal yang
       sama — dan yang satu bisa hadir tanpa yang lain.

       ⚠︎ `dropAktif` — panel dropdown desktop — JUSTRU ditangani di sini, dan
       perbedaannya bukan selera. Keadaan itu tidak dimiliki pihak lain mana
       pun: panel dibuka `:hover`/`:focus-within` di CSS, dan berkas inilah
       satu-satunya yang mengubahnya jadi keadaan yang bisa dinamai. Dan karena
       yang dipasang `.scrolled` — kelas yang SUDAH membawa seluruh pasangan
       warna bilah terang — latar dan warna huruf tidak mungkin berpisah. Kalau
       berkas ini kebetulan lebih tua daripada berkas gayanya, yang terjadi
       hanyalah bilah tetap tembus pandang seperti sebelum ronde ini; tidak ada
       jalan menuju putih-di-atas-putih. */
    nav.classList.toggle("scrolled", !heroGelap || window.scrollY > 10 || !!dropAktif);
  }
  function segarkanHero() {
    var nav = navSitus();
    heroGelap = nav ? ukurHero(nav) : false;
    terapkanGulir();
  }
  function onScroll() {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { terapkanGulir(); tick = false; });
  }
  addEventListener("scroll", onScroll, { passive: true });
  /* Hero setinggi `100dvh` berubah ukuran saat bilah alamat ponsel menyembunyi
     diri dan saat tablet diputar, jadi ukurannya diambil ulang — tetapi
     DIREDAM, dan tidak pernah dari jalur gulir. */
  var tikUkur = 0;
  addEventListener("resize", function () {
    clearTimeout(tikUkur);
    tikUkur = setTimeout(segarkanHero, 180);
  }, { passive: true });
  /* Dipanggil SEKARANG, bukan hanya lewat penjadwal di bawah: halaman tanpa
     hero harus solid sejak bingkai pertama, kalau tidak mereknya sempat
     tergambar putih di atas kertas terang selama satu kedipan. Aman dipanggil
     di sini: dari 55 pemuatan berkas ini, 54 memakai `defer` di HTML dan satu
     (/demo.html) menyisipkan skripnya dari JS di ujung `<body>` — pada
     keduanya DOM halaman sudah lengkap dan `apps-shell.js` (dimuat lebih dulu)
     sudah menyuntikkan bilahnya. Kalau toh terlalu awal, penjadwal di bawah
     mengukur ulang pada lima tik berikutnya. */
  segarkanHero();

  /* ── LACI PONSEL: grup selalu TERLIPAT saat dibuka ────────────────────────
     Pemilik, ronde ini: "saya tekan itu tombol tampilkan item navbar yang 3 bar
     itu, lalu saya maunya semua item yang bisa didropdown/expand itu tercollapse
     dulu. Dan ini item Ecosystem saat saya collapse dia tidak bisa."

     Ia tidak bisa karena MEKANISMENYA TIDAK PERNAH ADA: di ≤900px
     `glyiv-nav.css` memaksa `.ldrop__menu{position:static;opacity:1;
     visibility:visible}` tanpa syarat, jadi setiap grup selalu terbuka dan tidak
     ada satu pun kelas/atribut yang bisa menutupnya. Terukur di /index.html
     412px saat laci dibuka: submenu "Ecosystem" setinggi 506 px, "Company"
     170 px, isi laci 1001 px di dalam panel yang hanya 750 px — pengguna harus
     menggulir hanya untuk melihat butir menu tingkat pertama.

     Sekarang `.ldrop` memegang kelas `is-open`, dan CSS-nya `display:none`
     kecuali kelas itu ada. Grup dilipat pada SETIAP pergantian keadaan laci
     (buka maupun tutup) supaya tidak pernah ada submenu yang tertinggal terbuka
     di dalam laci yang sudah tersembunyi. */
  function lipatSemuaGrup(nav) {
    /* `aria-expanded` hanya dipasang di lebar laci — lihat tandaiGrup(): di
       desktop tombolnya bukan pengungkap, dan menulis atribut itu di sana akan
       memberi tahu pembaca layar soal keadaan yang tidak ada. */
    var dalamLaci = laciMode();
    var grup = nav.querySelectorAll(".ldrop");
    for (var i = 0; i < grup.length; i++) {
      grup[i].classList.remove("is-open");
      var b = grup[i].querySelector(".ldrop__btn");
      if (!b) continue;
      if (dalamLaci) b.setAttribute("aria-expanded", "false");
      else b.removeAttribute("aria-expanded");
    }
  }

  /* ══ KILAU SAMBUTAN — SATU KELAS, DUA ARTI "PERTAMA KALI" ══════════════════
     Pemilik, ronde ini: *"Mungkin ketika user buka navbarnya pertama kali,
     setiap navbar item itu ada animasi glossy sesaat."*

     "Membuka navbar" bukan satu peristiwa. Di desktop bilahnya memang sudah
     terbuka sejak halaman muncul; di ponsel butir-butirnya berada di dalam laci
     yang baru ada setelah burger ditekan. Kalau kilau dinyalakan hanya oleh CSS
     (mis. animasi tanpa syarat pada `.lnav__links>a`), pengguna ponsel tidak
     akan pernah melihatnya: animasinya sudah selesai jauh sebelum lacinya
     dibuka. Karena itu pemicunya di SINI — berkas ini satu-satunya pihak yang
     tahu kapan laci berpindah keadaan.

     Dua penjaga TERPISAH, bukan satu: `kilauMuat` untuk bilah desktop,
     `kilauLaci` untuk bukaan laci pertama. Digabung menjadi satu penjaga, siapa
     pun yang lebih dulu menyala akan mencuri giliran yang lain.

     ⚠︎ `void nav.offsetWidth` MEMANG membaca tata letak, dan itu disengaja: ia
     yang memaksa peramban mengakui bahwa kelasnya sempat dicabut, sehingga
     animasi benar-benar diputar ulang alih-alih dianggap masih yang lama. Ia
     dipanggil PALING BANYAK DUA KALI per muat halaman dan tidak pernah dari
     jalur gulir — jadi ia bukan pelanggaran atas larangan "membaca tata letak
     per bingkai" di memori proyek.

     Kelasnya dicabut lagi sesudah 1,4 detik. Animasinya sendiri sudah tidak
     akan berulang (`animation-iteration-count:1` + `forwards`), tetapi kelas
     yang tertinggal akan ikut TERSALIN ketika React menukar simpul header, dan
     salinan itu akan memutar kilau sekali lagi di halaman berikutnya. */
  var KILAU_MS = 1400;
  var kilauJam = 0, kilauMuat = false, kilauLaci = false;
  function jalankanKilau(nav) {
    if (!nav) return;
    try { if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; } catch (e) {}
    nav.classList.remove("lnav--masuk");
    void nav.offsetWidth;
    nav.classList.add("lnav--masuk");
    clearTimeout(kilauJam);
    kilauJam = setTimeout(function () {
      var n = navSitus();
      if (n) n.classList.remove("lnav--masuk");
    }, KILAU_MS);
  }

  function setLaci(nav, buka) {
    lipatSemuaGrup(nav);
    document.body.classList.toggle("lnav-open", buka);
    var b = nav.querySelector(".lnav__burger");
    if (b) b.setAttribute("aria-expanded", buka ? "true" : "false");
    if (buka && !kilauLaci) { kilauLaci = true; jalankanKilau(nav); }
  }

  /* ══ PANEL DROPDOWN DESKTOP — KEADAAN YANG BISA DINAMAI ═════════════════════
     Pemilik, ronde ini: *"animasi glowing kiri ke kanan… SETIAP KALI dropdownnya
     dibuka."*

     Panelnya sendiri tetap dibuka CSS (`:hover` / `:focus-within`) — tidak ada
     satu pun `display`/`opacity` yang dipegang berkas ini, jadi menu tetap
     bekerja utuh walau skrip ini gagal dimuat. Yang ditambahkan hanya penamaan
     keadaannya, karena TIGA hal mustahil dinyatakan CSS sendirian:
       1. "SETIAP KALI dibuka". Animasi yang dipasang pada `:hover` akan berjalan
          ulang tanpa henti selama kursor diam di atas panel. Yang membuat sapuan
          berikutnya benar-benar mulai dari awal adalah kelasnya DICABUT saat
          panel ditutup — dan hanya JS yang bisa mencabut.
       2. Bilah harus jadi pekat selagi panel selebar layar terbuka (lihat blok
          "PANEL DROPDOWN TERBUKA" di berkas gaya).
       3. `prefers-reduced-motion` diperiksa di sini JUGA, bukan hanya di CSS,
          supaya kelas kilaunya tidak pernah dipasang sama sekali.

     ⚠︎ Pendengarnya `mouseover` yang DIDELEGASIKAN ke `document`, bukan
     `mouseenter` pada tiap `.ldrop` — alasannya sama persis dengan yang sudah
     ditulis panjang di blok "NAVBAR YANG SEDANG HIDUP": di dalam SPA, React
     MELEPAS simpul header lama dan memasang yang baru, jadi pendengar yang
     menempel pada simpul akan mati diam-diam pada halaman kedua.
     `mouseover` menggelembung (`mouseenter` tidak), dan ia hanya menyala saat
     kursor BERPINDAH elemen — bukan tiap piksel gerakan. Tidak ada satu pun API
     pembaca tata letak di dalamnya kecuali `void offsetWidth`, yang dipanggil
     paling banyak sekali per bukaan panel dan tidak pernah dari jalur gulir. */
  var KILAU_DROP_MS = 1000;
  var dropAktif = null, dropJam = 0;

  function panelBuka(grup) {
    if (grup === dropAktif) return;
    panelTutup();
    dropAktif = grup;
    var nav = grup.closest(".lnav");
    if (nav) nav.classList.add("lnav--drop");
    terapkanGulir();
    try { if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; } catch (e) {}
    grup.classList.remove("ldrop--kilau");
    void grup.offsetWidth;              // memaksa pencabutan diakui → animasi diputar ULANG
    grup.classList.add("ldrop--kilau");
    dropJam = setTimeout(function () {
      if (dropAktif) dropAktif.classList.remove("ldrop--kilau");
    }, KILAU_DROP_MS);
  }

  function panelTutup() {
    clearTimeout(dropJam);
    if (dropAktif) { dropAktif.classList.remove("ldrop--kilau"); dropAktif = null; }
    /* Kelas bilah dicabut dari SEMUA navbar situs, bukan dari simpul yang
       tersimpan: kalau React sempat menukar headernya selagi panel terbuka,
       simpul lama sudah tidak ada di dokumen dan yang baru membawa kelas
       tersalin yang tidak akan pernah dicabut siapa pun. */
    var semua = document.querySelectorAll(".lnav--drop, .ldrop--kilau");
    for (var i = 0; i < semua.length; i++) {
      semua[i].classList.remove("lnav--drop");
      semua[i].classList.remove("ldrop--kilau");
    }
    terapkanGulir();
  }

  /* ⛔ CACAT YANG MELAHIRKAN PENJAGA `:hover` DI BAWAH — tertangkap saat memotret
     panel ronde ini. Versi pertama menutup keadaan panel begitu ada `mouseout`
     tanpa `relatedTarget` (artinya "kursor keluar jendela") atau `focusin` di
     luar `.ldrop`. Keduanya bisa menyala SEMENTARA PANELNYA MASIH TERBUKA,
     karena yang membuka panel adalah `:hover` milik CSS, bukan peristiwa ini.
     Terukur di /index.html 1440x900, dengan kursor diam di dalam panel:
       kelas bilah sebelum → "lnav lnav--drop scrolled"
       kelas bilah sesudah → "lnav"          ← panel masih terlihat
     Hasilnya persis cacat yang blok ini justru ada untuk mencegah: panel putih
     selebar layar menggantung dari bilah TEMBUS PANDANG, dengan merek putih di
     atas kertas terang. Jadi sebelum membongkar keadaan, ditanyakan dulu apakah
     panelnya memang sudah tidak ter-hover. `matches(":hover")` hanya mencocokkan
     selektor — ia tidak memaksa tata letak dihitung ulang, jadi aman dipanggil
     dari jalur peristiwa tetikus. */
  function masihDiPanel() {
    try { return !!dropAktif && dropAktif.matches(":hover"); } catch (e) { return false; }
  }
  function sentuhPanel(t) {
    if (laciMode()) return;             // di laci, grup dibuka dengan ketukan (lihat pendengar klik)
    if (!t || !t.closest) return;
    var grup = t.closest(".ldrop");
    if (grup) { if (milikNavSitus(grup)) panelBuka(grup); return; }
    if (dropAktif && !masihDiPanel()) panelTutup();
  }
  document.addEventListener("mouseover", function (e) { sentuhPanel(e.target); }, { passive: true });
  document.addEventListener("focusin", function (e) { sentuhPanel(e.target); }, { passive: true });
  /* Kursor keluar dari JENDELA tidak memicu `mouseover` di mana pun, jadi tanpa
     baris ini keadaan panel bisa tertinggal "terbuka" dan bukaan berikutnya atas
     panel yang sama tidak akan menyapu ulang. */
  document.addEventListener("mouseout", function (e) {
    if (!e.relatedTarget && dropAktif && !masihDiPanel()) panelTutup();
  }, { passive: true });

  function tutupPanelBahasa() {
    var buka = document.querySelectorAll(".lnav__lang.is-open");
    for (var i = 0; i < buka.length; i++) {
      buka[i].classList.remove("is-open");
      var p = buka[i].querySelector(".lnav__lang__now");
      if (p) p.setAttribute("aria-expanded", "false");
    }
  }

  /* SATU pendengar untuk seluruh navbar. Ia bertahan melewati pergantian simpul
     karena ia tidak pernah memegang simpul apa pun. */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var burger = t.closest(".lnav__burger");
    if (burger) {
      if (!milikNavSitus(burger)) return;
      tutupPanelBahasa();
      setLaci(burger.closest(".lnav"), !document.body.classList.contains("lnav-open"));
      return;
    }

    /* Tombol grup: hanya di lebar laci. Di desktop menunya dibuka
       `:hover`/`:focus-within` seperti sebelumnya — tidak ada yang berubah. */
    var tombolGrup = t.closest(".ldrop__btn");
    if (tombolGrup && milikNavSitus(tombolGrup) && laciMode()) {
      e.preventDefault();
      var grup = tombolGrup.closest(".ldrop");
      var kini = grup.classList.toggle("is-open");
      tombolGrup.setAttribute("aria-expanded", kini ? "true" : "false");
      return;
    }

    var pemicuBahasa = t.closest(".lnav__lang__now");
    if (pemicuBahasa) {
      var kotak = pemicuBahasa.closest(".lnav__lang");
      var mauBuka = !kotak.classList.contains("is-open");
      tutupPanelBahasa();
      if (mauBuka) {
        /* Panel bahasa dan laci sama-sama menggantung dari bilah dan saling
           menutupi (terukur: panel y=64–209, laci mulai y=68). Yang dibuka
           terakhir yang berlaku. */
        var navB = pemicuBahasa.closest(".lnav");
        if (navB && document.body.classList.contains("lnav-open")) setLaci(navB, false);
        kotak.classList.add("is-open");
        pemicuBahasa.setAttribute("aria-expanded", "true");
      }
      return;
    }

    /* Memilih bahasa: penggantiannya tetap milik site-lang.js (pendengar pada
       tombol itu sendiri). Di sini panelnya cukup ditutup. */
    if (t.closest(".lnav__lang__list")) { tutupPanelBahasa(); return; }

    var tautan = t.closest(".lnav__links a");
    if (tautan && milikNavSitus(tautan)) {
      var navT = tautan.closest(".lnav");
      tutupPanelBahasa();
      setLaci(navT, false);
      return;
    }

    tutupPanelBahasa(); // ketukan di luar panel bahasa
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    tutupPanelBahasa();
    var nav = navSitus();
    if (nav && document.body.classList.contains("lnav-open")) setLaci(nav, false);
  });

  /* Berpindah ke lebar desktop saat laci terbuka meninggalkan `body.lnav-open`
     dan `aria-expanded="true"` yang tidak lagi berarti apa-apa. */
  try {
    var onMq = function () {
      var nav = navSitus();
      if (!nav) return;
      /* Berpindah ke lebar laci saat panel desktop sedang terbuka meninggalkan
         `.lnav--drop` + `.scrolled` paksa yang tidak ada lagi yang mencabutnya. */
      panelTutup();
      if (!laciMode()) { setLaci(nav, false); tandaiGrup(nav); }
      else tandaiGrup(nav);
    };
    if (mqLaci && mqLaci.addEventListener) mqLaci.addEventListener("change", onMq);
    else if (mqLaci && mqLaci.addListener) mqLaci.addListener(onMq);
  } catch (e) {}

  /* `aria-expanded` hanya berarti di lebar laci — di desktop tombolnya bukan
     pengungkap, jadi atributnya dicabut supaya pembaca layar tidak diberi tahu
     soal keadaan yang tidak ada. */
  function tandaiGrup(nav) {
    var dalamLaci = laciMode();
    var btn = nav.querySelectorAll(".ldrop__btn");
    for (var i = 0; i < btn.length; i++) {
      if (!dalamLaci) { btn[i].removeAttribute("aria-expanded"); continue; }
      var grup = btn[i].closest(".ldrop");
      btn[i].setAttribute("aria-expanded", grup && grup.classList.contains("is-open") ? "true" : "false");
    }
    var b = nav.querySelector(".lnav__burger");
    if (b && !b.hasAttribute("aria-expanded")) b.setAttribute("aria-expanded", "false");
  }

  /* ── Tombol Login di dalam laci ponsel (butir 3, ronde 44) ────────────────
     `.lnav__cta` DISEMBUNYIKAN di bawah 900px, dan itu keputusan yang benar:
     bilahnya memang tidak muat, dan memaksanya masuk mendesak logo (cacat
     "Sign in yang terbaca Sig", terukur 156px di luar layar pada 320px).
     Konsekuensinya sebelum ronde ini ditutup oleh pita `.lstick` — tetapi pita
     itu ajakan PEMASARAN ("Cara ikut"), bukan jalan masuk. Sesudah CTA berubah
     dari "Gabung" menjadi "Login", ponsel jadi TIDAK punya satu pun jalan masuk
     sama sekali. Terukur di 390px: `.lnav__cta` display:none, laci burger nihil.

     Diperbaiki dengan MENYALIN tombolnya ke dalam laci, bukan menampilkannya
     kembali di bilah — laci adalah panel setinggi 82vh yang memang punya ruang,
     dan itu tempat orang mencari aksi akun di ponsel. Disalin lewat JS karena
     navbar bukan komponen: 53 halaman membawa markupnya masing-masing, dan
     menulis tombolnya ke dalam markup berarti 53 berkas yang akan ditimpa port
     berikutnya (alasan yang sama sudah ditulis di PintuAplikasiSitus.tsx). */
  function pasangSalinanCta(nav) {
    /* ⚠︎ `.lnav__in > .lnav__cta`, BUKAN `.lnav__cta`. Selektor lama cocok juga
       dengan salinannya sendiri — dan salinan itu berada LEBIH DULU dalam urutan
       dokumen (ia anak `.lnav__links`, yang mendahului `.lnav__cta` asli), jadi
       pemanggilan kedua akan mengklon klon. */
    var cta = nav.querySelector(".lnav__in > .lnav__cta");
    var laci = nav.querySelector(".lnav__links");
    if (!cta || !laci || laci.querySelector(".lnav__cta--laci")) return;
    var salin = cta.cloneNode(true);
    salin.classList.add("lnav__cta--laci");
    /* Tombol asli tetap sumber kebenarannya; salinan ini hanya cermin. Kalau
       suatu hari CTA-nya berubah, ia berubah di kedua tempat tanpa disentuh. */
    laci.appendChild(salin);
  }

  /* ══ PEMILIH BAHASA — SATU tombol ringkas, bukan tiga pil ═══════════════════
     Pemilik, ronde ini: "tombol ganti bahasa terlalu besar, kebesaran itu
     tombolnya, kecilkan… mending pakai dropdown untuk ganti bahasa. Lebih
     menghemat tempat."

     DUA cacat yang terukur di /index.html, 412px, `(pointer:coarse)`:
       1. UKURAN — wadah `.lnav__lang` 143x51 px: tiga pil 44x44 berjajar.
       2. TEMPAT — wadahnya berada DI DALAM `.lnav__links` (laci), pada y=938,
          yaitu 119 px di bawah tepi laci yang terlihat: pemilih bahasanya tidak
          terjangkau tanpa menggulir laci sampai habis.
          Sebabnya berkas INI: `site-lang.js` menyisipkan pil "sebelum
          `nav.querySelector('.lnav__cta')`", dan sejak ronde 44 salinan CTA laci
          berada lebih dulu dalam urutan dokumen — jadi yang ditemukannya adalah
          KLON di dalam laci, bukan tombol di bilah.

     Perbaikannya MENGGANTI, bukan menumpuk (PRINSIP-UIUX §1):
       · barisan tiga pil di bilah DIBUANG — yang usang karenanya adalah seluruh
         blok gaya `.lnav__lang button` lama (tiga tempat di glyiv-nav.css,
         termasuk penimpa cascade di akhir berkas), yang ikut dihapus;
       · TOMBOL-nya sendiri tidak dibuang dan tidak diduplikasi — tombol yang
         sama dipindahkan menjadi baris di dalam panel, jadi pendengar klik dan
         penanda `is-on` milik site-lang.js tetap bekerja apa adanya;
       · wadahnya dipindahkan ke bilah, tepat sebelum burger, di mana pun
         site-lang.js sempat menaruhnya. */
  function bangunPemilihBahasa(nav) {
    var kotak = nav.querySelector(".lnav__lang");
    if (!kotak) return;
    /* Urutan bilah: … | pemilih bahasa | CTA | burger — sama dengan niat asli
       site-lang.js ("sisipkan sebelum CTA"), yang meleset hanya karena selektornya
       menemukan klon di dalam laci lebih dulu. */
    var bar = nav.querySelector(".lnav__in");
    var jangkar = nav.querySelector(".lnav__in > .lnav__cta") || nav.querySelector(".lnav__burger");
    if (bar && (kotak.parentNode !== bar || (jangkar && kotak.nextElementSibling !== jangkar))) {
      bar.insertBefore(kotak, jangkar || null);
    }

    if (!kotak.querySelector(".lnav__lang__now")) {
      var opsi = [];
      for (var i = 0; i < kotak.children.length; i++) {
        if (kotak.children[i].tagName === "BUTTON") opsi.push(kotak.children[i]);
      }
      if (!opsi.length) return;

      var daftar = document.createElement("div");
      daftar.className = "lnav__lang__list";
      for (var j = 0; j < opsi.length; j++) daftar.appendChild(opsi[j]);

      var pemicu = document.createElement("button");
      pemicu.type = "button";
      pemicu.className = "lnav__lang__now";
      pemicu.setAttribute("aria-haspopup", "true");
      pemicu.setAttribute("aria-expanded", "false");
      pemicu.innerHTML =
        '<span class="lnav__lang__kode"></span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
      kotak.appendChild(pemicu);
      kotak.appendChild(daftar);

      /* Label pemicu mengikuti tombol yang ditandai `is-on` oleh site-lang.js.
         Diamati, bukan dijadwal: penandanya berubah saat mesin kamus selesai
         DAN setiap kali bahasa diganti dari mana pun (pil situs, pemilih React,
         atau ?lang=). Penulisan di dalam penyegar selalu diperiksa-dulu, jadi
         pengamatnya berhenti sendiri, tidak berputar. */
      try {
        new MutationObserver(function () { segarkanLabelBahasa(kotak); })
          .observe(kotak, { attributes: true, attributeFilter: ["class", "aria-label"], subtree: true });
      } catch (e) {}
    }
    segarkanLabelBahasa(kotak);
  }

  function segarkanLabelBahasa(kotak) {
    var aktif = kotak.querySelector(".lnav__lang__list button.is-on") ||
                kotak.querySelector(".lnav__lang__list button");
    var pemicu = kotak.querySelector(".lnav__lang__now");
    if (!aktif || !pemicu) return;
    var kode = pemicu.querySelector(".lnav__lang__kode");
    var singkat = (aktif.textContent || "").trim();
    if (kode && kode.textContent !== singkat) kode.textContent = singkat;
    /* Nama bahasa dari tombolnya, kata "pilih bahasa" dari wadahnya — keduanya
       sudah diterjemahkan site-lang.js, jadi tidak ada teks Indonesia yang
       ditulis keras di sini dan ikut terbaca pada versi EN/AR. */
    var nama = aktif.getAttribute("aria-label") || singkat;
    var ajakan = kotak.getAttribute("aria-label") || "";
    var label = ajakan ? nama + " · " + ajakan : nama;
    if (pemicu.getAttribute("aria-label") !== label) pemicu.setAttribute("aria-label", label);
    /* site-lang.js menyapu `.lnav__lang button` untuk memasang `aria-pressed`;
       pemicu ini bukan pil bahasa, jadi atribut itu dicabut lagi. */
    if (pemicu.hasAttribute("aria-pressed")) pemicu.removeAttribute("aria-pressed");
  }

  /* active page — same markup everywhere, so derive it from the URL.
     A link to a section index (…/kabar/) also owns its children (…/kabar/artikel.html).
     Dibersihkan dulu: di dalam SPA alamatnya berubah tanpa memuat ulang, jadi
     penanda halaman lama harus dicabut sebelum yang baru dipasang. */
  function tandaiAktif(nav) {
    var here = location.pathname.replace(/index\.html$/, "");
    $$(".is-active", nav).forEach(function (el) { el.classList.remove("is-active"); });
    $$(".lnav__links a[href]", nav).forEach(function (a) {
      var raw = a.getAttribute("href");
      if (!raw || raw.indexOf("#") > -1) return; // in-page anchors are never "the current page"
      var path;
      try { path = new URL(a.href, location.href).pathname.replace(/index\.html$/, ""); } catch (e) { return; }
      var owns = path === here || (path !== "/" && path.slice(-1) === "/" && here.indexOf(path) === 0);
      if (!owns) return;
      a.classList.add("is-active");
      var drop = a.closest && a.closest(".ldrop");
      if (drop) { var btn = drop.querySelector(".ldrop__btn"); if (btn) btn.classList.add("is-active"); }
    });
  }

  /* ── Menyusul navbar yang baru dipasang ───────────────────────────────────
     Yang dikumpulkan di sini HANYA tulisan navbar yang tidak bergantung
     interaksi dan idempoten: keadaan gulir, salinan CTA laci, penataan pemilih
     bahasa, tautan aktif, penanda aria grup. Dijalankan dua kali pada navbar yang
     sama, tidak satu pun menghasilkan sesuatu yang kedua.

     Yang sengaja TIDAK di sini: `setLaci()`, `lipatSemuaGrup()`, dan
     `tutupPanelBahasa()`. Ketiganya juga menulis ke navbar, tetapi milik
     interaksi — menjalankannya tiap simpul berganti akan menutup laci atau panel
     bahasa yang sedang dibuka pengguna.

     ⚠︎ `bangunPemilihBahasa()` MEMINDAHKAN dan menyusun ulang `.lnav__lang`; ia
     TIDAK membuatnya. Pembuatnya `build()` di site-lang.js, dan selama wadah itu
     belum ada fungsi di sini pulang tanpa berbuat apa pun (`if (!kotak) return`).
     Terukur di /index.html 412×915 saat header ditukar persis seperti yang
     dilakukan React: segarkanNav() jelas ikut berjalan pada simpul baru (salinan
     CTA laci 1, tautan aktif 1) sementara `.lnav__lang` tidak ada sama sekali.
     Karena itu "pil bahasa hilang sesudah pindah halaman" adalah cacat
     site-lang.js, bukan cacat berkas ini. */
  function segarkanNav() {
    var nav = navSitus();
    if (!nav) return;
    /* `segarkanHero()`, bukan `terapkanGulir()`: di dalam SPA halaman
       berikutnya bisa ber-hero sedangkan yang sekarang tidak (atau sebaliknya),
       jadi ukurannya harus diambil ulang bersama simpul barunya. */
    segarkanHero();
    pasangSalinanCta(nav);
    bangunPemilihBahasa(nav);
    tandaiAktif(nav);
    tandaiGrup(nav);
    /* Kilau sambutan bilah DESKTOP. Di lebar laci butirnya berada di dalam panel
       yang masih tersembunyi, jadi menyalakannya di sini hanya akan membakar
       giliran satu-satunya tanpa satu piksel pun terlihat — di sana pemicunya
       `setLaci()`. Idempoten seperti seisi fungsi ini: penjaganya sekali pakai. */
    if (!kilauMuat) {
      if (!laciMode()) { kilauMuat = true; jalankanKilau(nav); }
    }
  }

  /* Beberapa tik, bukan satu tenggat tebakan — alasannya sama persis dengan yang
     sudah tertulis untuk rel bagian di bawah: React menahan pergantian halaman
     sampai gambar di atas lipatan selesai di-decode, dan `site-lang.js` baru
     membangun pilnya setelah `i18n.js` selesai diunduh. */
  var TIK = [0, 150, 700, 1600, 3000];
  var jadwalNav = [];
  function jadwalkanSegarNav() {
    /* Alamat berubah → panel dropdown apa pun yang sedang terbuka sudah tidak
       relevan, dan kelas `.lnav--drop`/`.ldrop--kilau` yang tertinggal akan ikut
       TERSALIN saat React menukar simpul header — persis jebakan yang sudah
       tercatat untuk `.lnav--masuk`. Dibersihkan di sini, di satu tempat yang
       memang dipanggil setiap navigasi. */
    panelTutup();
    for (var i = 0; i < jadwalNav.length; i++) clearTimeout(jadwalNav[i]);
    jadwalNav = [];
    for (var j = 0; j < TIK.length; j++) jadwalNav.push(setTimeout(segarkanNav, TIK[j]));
  }
  jadwalkanSegarNav();
  addEventListener("glyiv:page", jadwalkanSegarNav);
  addEventListener("popstate", jadwalkanSegarNav);
  document.addEventListener("glyiv:lang", function () { setTimeout(segarkanNav, 0); });
  ["pushState", "replaceState"].forEach(function (nama) {
    var asli = history[nama];
    if (typeof asli !== "function") return;
    history[nama] = function () {
      var hasil = asli.apply(this, arguments);
      setTimeout(jadwalkanSegarNav, 0);
      return hasil;
    };
  });

  /* ── GERBANG ADMIN — dimuat SESUAI KEBUTUHAN, bukan lagi di setiap halaman ──
     Dulu glyiv-admin.js disisipkan tanpa syarat di SETIAP halaman. Berkas itu
     meng-import firebase-app.js + firebase-auth.js dari gstatic: SDK Firebase
     KEDUA, proyek kedua, di atas potongan firebase yang SUDAH dibawa aplikasi
     (terukur 63,5 kB brotli + 2 sambungan lintas-asal, di tiap halaman).
     Seluruh gunanya memunculkan butir nav .lnav__admin untuk SATU alamat surel —
     untuk 100% pengunjung hasilnya `false`.

     Ia tetap dimuat, dan gerbangnya tetap menggigit, pada tiga keadaan:
       1. /lab/landing/*  — halaman yang memang dijaga. TANPA SYARAT.
       2. #admin / ?admin — pemicu masuk manual. Regexnya SAMA PERSIS dengan
          `forceLogin` di glyiv-admin.js supaya keduanya tak pernah beda pendapat.
       3. penanda "pernah masuk sebagai admin" di localStorage — supaya navbar
          admin muncul lagi tanpa perlu mengetik #admin tiap kali.

     Penandanya ditulis DI SINI (glyiv-admin.js tidak disentuh): berkas itu
     memasang/mencabut <html data-admin>, dan kita mengikutinya.

     ⚠︎ Pemeriksaannya WAJIB diulang tiap navigasi SPA. glyiv-nav.js hanya jalan
     SEKALI per sesi (penjaga __glyivNav di atas), jadi tanpa ini pengunjung yang
     mendarat di / lalu berpindah ke /lab/landing/ DI DALAM React tidak akan
     pernah memuat gerbangnya. `glyiv:page` dikirim useSiteScripts tiap halaman
     dipasang; hashchange menangkap #admin yang ditambahkan belakangan. */
  var KUNCI_ADMIN = "glyiv:admin-pernah";
  function pernahAdmin() { try { return localStorage.getItem(KUNCI_ADMIN) === "1"; } catch (e) { return false; } }
  function catatAdmin(on) { try { if (on) localStorage.setItem(KUNCI_ADMIN, "1"); else localStorage.removeItem(KUNCI_ADMIN); } catch (e) {} }
  function perluAdmin() {
    return /\/lab\/landing\//.test(location.pathname) || /[?#&]admin\b/i.test(location.href) || pernahAdmin();
  }
  function muatAdmin() {
    if (document.getElementById("glyiv-admin-js")) return;
    var as = document.createElement("script");
    as.id = "glyiv-admin-js"; as.src = "/assets/js/glyiv-admin.js";
    // `defer` tidak berlaku untuk skrip yang disisipkan JavaScript — hanya untuk
    // yang disisipkan parser. Yang berlaku di sini `async`, dan itu memang mau kita.
    as.async = true;
    // Rujukkan penandanya ke kenyataan sesudah Firebase menjawab: penanda basi
    // (mis. admin sudah keluar di tab lain) akan mencabut dirinya sendiri, jadi
    // halaman berikutnya tidak memuat SDK kedua lagi.
    as.addEventListener("load", function () {
      setTimeout(function () { catatAdmin(document.documentElement.hasAttribute("data-admin")); }, 6000);
    });
    document.head.appendChild(as);
  }
  function cekAdmin() { if (perluAdmin()) muatAdmin(); }
  cekAdmin();
  addEventListener("glyiv:page", cekAdmin);
  addEventListener("hashchange", cekAdmin);
  addEventListener("popstate", cekAdmin);
  try {
    new MutationObserver(function () { catatAdmin(document.documentElement.hasAttribute("data-admin")); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-admin"] });
  } catch (e) {}
  /* load the context-aware Gly assistant (self-skips pages that already have one) */
  if (!document.getElementById("glyiv-gly-js")) {
    var gs = document.createElement("script");
    gs.id = "glyiv-gly-js"; gs.src = "/assets/js/glyiv-gly.js"; gs.defer = true;
    document.head.appendChild(gs);
  }
  /* language switcher for the site navbar (id/en/ar), shared localStorage with the app */
  if (!document.getElementById("glyiv-lang-js")) {
    var ls = document.createElement("script");
    ls.id = "glyiv-lang-js"; ls.src = "/assets/js/site-lang.js"; ls.defer = true;
    document.head.appendChild(ls);
  }
})();


/* ═══════════════════════════════════════════════════════════════════════════
   NAVIGASI BAGIAN (rel kanan) — digabung ke berkas ini pada ronde 55.
   Sebelumnya ia berkas sendiri, dan itu berarti SATU PERMINTAAN TAMBAHAN di
   setiap halaman situs — terukur oleh scripts/uji-performa.cjs sebagai
   permintaanLokal 33→34 di beranda, 24→25 di green-intelligence, 8→9 di
   fnb-retail. Isinya sama persis; yang hilang hanya permintaannya.
   Tempatnya di sini memang benar: berkas ini sudah menampung perilaku navigasi
   situs (keadaan gulir, burger, tautan aktif), dan rel bagian adalah navigasi.
   ═══════════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════════
 * NAVIGASI BAGIAN (section navigator) — rel tipis di tepi kanan
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Pemilik, 4 Agustus 2026: *"Saya mau setiap halaman yang di website kita yang
 * ada section dan narasi2nya itu buatkan sidebar di kanan. Gunakan saja sidebar
 * dari referensi 'https://void.gt.tc/koios/?i=1#/about' jadi setiap sectionnya
 * bisa navigasi dengan mudah. Implementasikan ini ke semua, tidak hanya di
 * homepage. Pokoknya di semua halaman, setiap halaman business tree glyiv."*
 *
 * ── RUJUKANNYA DIBEDAH, BUKAN DITEBAK ──────────────────────────────────────
 * Halaman koios dibuka dengan peramban sungguhan (inangnya memakai tantangan JS
 * anti-bot, jadi curl hanya mengembalikan 843 bait). Bentuk aslinya:
 *   <nav aria-label="Section navigator"
 *        class="fixed right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end gap-3.5">
 *     <button><span[label, opacity 0, translateX(8px)]><span[garis 2px, lebar 16px]></button>
 *     <button aria-current="true">
 *       <span[label, opacity 1, translateX(0), warna aksen]>
 *       <span[garis 2px, lebar 30px, background aksen, box-shadow menyala]>
 *
 * Jadi butirnya BUKAN titik, melainkan GARIS PENDEK yang MEMANJANG saat aktif,
 * dan labelnya hanya muncul saat aktif/hover. Nomor dua digit di depan label
 * beropasitas 50%. Transisi 300 ms.
 *
 * ── APA YANG SENGAJA BERBEDA DARI RUJUKANNYA ───────────────────────────────
 * 1. WARNA. Koios gelap dengan aksen cyan #22d3ee. Merek Glyiv terang dan
 *    editorial. Jadi garisnya teal `--teal` di atas latar terang.
 * 2. ⛔ SEKSI GELAP. Beberapa halaman Glyiv punya seksi `.on-dark`. Rel ini
 *    `position:fixed`, jadi ia MELEWATI seksi terang dan gelap dalam satu
 *    halaman — dan teal gelap di atas latar gelap adalah cacat yang sudah
 *    pernah memakan 13 halaman di ronde sebelumnya. Karena itu rel membaca
 *    seksi yang sedang aktif dan berganti ke mint `#8affc1` saat seksi itu
 *    gelap. Ini satu-satunya cara yang tidak menuntut setiap halaman
 *    mendeklarasikan temanya sendiri.
 * 3. Label dipakai sebagai `aria-label` pada tombolnya, bukan hanya teks visual,
 *    karena teksnya beropasitas 0 saat tidak aktif.
 *
 * ── KENAPA IntersectionObserver, BUKAN PENDENGAR SCROLL ────────────────────
 * Pemilik menguji di tablet Android dan sudah pernah mengeluh soal gulir
 * tersendat. Pendengar `scroll` yang memanggil `getBoundingClientRect()` per
 * seksi berarti membaca tata letak pada SETIAP bingkai gulir — persis pola yang
 * sudah dilarang di memori proyek ini. IntersectionObserver melapor di luar
 * jalur gulir dan tidak memaksa reflow.
 *
 * ── TIDAK TAMPIL KALAU TIDAK BERGUNA ───────────────────────────────────────
 * · < 1100 px: sembunyi. Di ponsel rel ini menutupi isi dan tidak ada ruang
 *   untuk labelnya; halaman sudah punya bilah aksi ponsel sendiri (.lstick).
 * · < 3 seksi: tidak dipasang sama sekali. Navigator untuk dua bagian hanya
 *   perabot.
 * ════════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  if (window.__glyivSecnav) return;
  window.__glyivSecnav = true;

  var MIN_SEKSI = 3;
  var MIN_LEBAR = 1100;

  /* ⛔ CACAT YANG MELAHIRKAN BLOK INI (5 Agustus 2026)
     Rel ini dulu dibangun SEKALI saat muat, lalu ditempel ke <body> dan tidak
     pernah dibongkar. Di dalam SPA React itu berarti: begitu pengguna membuka
     beranda lalu berpindah ke /auth atau ke konsol outlet, rel BERANDA ikut
     terbawa — lengkap dengan butir "01 LIVE GREEN, REAL…" di halaman yang tidak
     punya artikel sama sekali. Pemilik menemukannya di dua halaman sekaligus.

     Jadi rel sekarang punya SIKLUS HIDUP: dibongkar setiap kali alamat berubah,
     lalu dibangun ULANG hanya kalau halaman barunya memang layak. Dua penjaga,
     bukan satu, karena masing-masing menangkap hal yang berbeda:
       1. JALUR_TERLARANG — daerah aplikasi/auth/konsol, tidak peduli isinya.
       2. Uji jumlah seksi di bangun() — halaman artikel yang kebetulan pendek. */
  var JALUR_TERLARANG = [
    /^\/auth\b/, /^\/masuk\b/, /^\/daftar\b/, /^\/login\b/, /^\/register\b/,
    /^\/dashboard\b/, /^\/admin\b/, /^\/akun\b/, /^\/konsol\b/, /^\/console\b/,
    /^\/gip\b/, /^\/cip\b/, /^\/outlet\b/, /^\/o\//, /^\/app-store\b/,
    /^\/green-assets\b/, /^\/hijau\b/, /^\/saku\b/, /^\/my-lands\b/,
  ];

  function bolehDiSini() {
    var p = location.pathname;
    for (var i = 0; i < JALUR_TERLARANG.length; i++) {
      if (JALUR_TERLARANG[i].test(p)) return false;
    }
    return true;
  }

  /* Pegangan ke rel yang sedang hidup, supaya bisa dibongkar utuh — termasuk
     pengamatnya dan pendengar ganti-bahasanya, yang kalau ditinggal akan bocor
     dan menumpuk satu salinan tiap kali pengguna berpindah halaman. */
  var navAktif = null;
  var pengamatAktif = null;
  var dengarBahasa = null;
  /* Seksi yang dipakai rel yang sedang hidup, plus fungsi penyegar labelnya.
     Keduanya dipakai oleh pemeriksaan berkala di bawah. */
  var seksiTerpakai = [];
  var segarkanLabel = null;

  /* Rel dianggap BASI kalau seksi yang dipeganganya sudah dilepas dari dokumen —
     persis yang terjadi ketika React menukar isi halaman. Ini lebih tepercaya
     daripada menebak berapa milidetik React butuh, karena PindahHalus sengaja
     menahan pergantian sampai gambar di atas lipatan selesai di-decode, dan
     lamanya bergantung jaringan. */
  function masihSah() {
    if (!seksiTerpakai.length) return false;
    for (var i = 0; i < seksiTerpakai.length; i++) {
      if (!document.contains(seksiTerpakai[i])) return false;
    }
    return true;
  }

  /* ⛔ JANGAN menuntut `id`. Percobaan pertama memakai `section[id]` dan hasilnya
     hanya 10 dari 63 halaman yang memenuhi syarat — sementara 53 yang terlewat
     justru halaman POHON BISNIS (`lab/ekosistem/*`, `lab/industri/*`) yang
     persis diminta pemilik, karena seksi di sana memang tidak pernah diberi
     `id` (tidak ada yang pernah menautinya). Menambahkan `id` dengan tangan ke
     53 berkas berarti 53 kesempatan untuk salah ketik dan 53 berkas yang harus
     dijaga selamanya. Rel ini memberi `id` sendiri, diturunkan dari judul seksi,
     dan hanya bila belum ada — jadi setiap `id` yang sudah ditulis tangan
     (dan mungkin ditautkan dari tempat lain) tetap menang. */
  var PILIH = "section, .lsec, .wsec";

  /* Seksi yang TIDAK boleh masuk daftar.
     ⚠︎ HERO SENGAJA TIDAK DITOLAK — rujukan koios menaruh "01 Home" sebagai
     butir pertama, dan tanpa itu tidak ada cara kembali ke atas lewat rel.
     Yang ditolak hanya footer dan apa pun yang menandai dirinya sendiri.
     (Uji pertama menolak hero lewat daftar ini, dan hasilnya rel yang tidak
     punya titik awal — plus kelas hero situs ini ternyata `vhero`, bukan
     `hero`, jadi penolakannya toh tidak bekerja.) */
  var TOLAK = ["lfoot", "wfoot"];

  /* Mengambil teks judul dengan dua koreksi yang keduanya lahir dari cacat nyata:
     1. `<small>` DIBUANG. Judul WOSU berbentuk
        `<h1><span>WOSU</span><small>PT WOSU Innovation Technology</small></h1>`,
        dan `<small>` di situ sub-judul hukum, bukan bagian dari nama.
     2. Batas elemen jadi SPASI. `textContent` menyambung anak tanpa pemisah,
        sehingga judul yang sama tadi terbaca "WOSUPT WOSU Innovation Technology"
        — terukur di rel sebelum perbaikan ini. */
  function teksJudul(el) {
    var salin = el.cloneNode(true);
    var buang = salin.querySelectorAll("small, sup, .whero__legal, .lsecnav");
    for (var i = 0; i < buang.length; i++) buang[i].remove();
    var potong = [];
    var jalan = document.createTreeWalker(salin, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = jalan.nextNode())) { var t = n.nodeValue.trim(); if (t) potong.push(t); }
    return potong.join(" ").replace(/\s+/g, " ").trim();
  }

  function judulDari(sek) {
    /* Urutan sengaja: kicker dulu (pendek, memang label bagian), baru judul.
       `.lkick`/`.wkick` biasanya 1-3 kata — persis panjang yang muat di rel. */
    var k = sek.querySelector(".lkick, .wkick, .kicker");
    if (k && teksJudul(k)) return teksJudul(k);
    /* ⚠︎ h1 IKUT, dan urutannya SESUDAH h2 bukan tanpa sebab. Hero memakai h1
       sementara seksi biasa memakai h2; kalau h1 tidak ikut, butir pertama rel
       jatuh ke kata cadangan dan terbaca "bagian" — terukur di 4 dari 5 halaman
       pada uji pertama. Tetapi h1 dicari SESUDAH h2 karena beberapa halaman
       menaruh h1 di dalam seksi yang juga punya h2, dan yang benar di situ
       adalah h2-nya. */
    var h = sek.querySelector("h2, h3");
    if (h && teksJudul(h)) return teksJudul(h);
    var h1 = sek.querySelector("h1");
    if (h1 && teksJudul(h1)) return teksJudul(h1);
    var al = sek.getAttribute("aria-label");
    if (al) return al;
    /* Kalau id-nya sendiri hasil bangkitan rel ini (lihat pastikanId), ia tidak
       memberi informasi apa pun — jangan dipantulkan kembali sebagai label. */
    return /^bagian(-\d+)?$/.test(sek.id) ? "" : sek.id.replace(/[-_]/g, " ");
  }

  function pendek(t) {
    t = t.replace(/\s+/g, " ").trim();
    /* Rel selebar ±150 px. Lebih dari 22 karakter akan membungkus atau terpotong
       di tengah kata; potong di batas kata lalu beri elipsis. */
    if (t.length <= 22) return t;
    var potong = t.slice(0, 22);
    var spasi = potong.lastIndexOf(" ");
    return (spasi > 12 ? potong.slice(0, spasi) : potong).replace(/[\s,.;:—-]+$/, "") + "…";
  }

  function gelapkah(el) {
    /* Dua sumber: kelas yang memang dipakai proyek ini, dan — kalau tidak ada —
       luminansi latar terhitung. Yang kedua menangkap seksi yang latarnya
       diberi gaya sebaris, yang memang ada di beberapa halaman industri. */
    var n = el;
    while (n && n !== document.body) {
      if (n.classList && (n.classList.contains("on-dark") || n.classList.contains("wsec--gelap"))) return true;
      n = n.parentElement;
    }
    var bg = getComputedStyle(el).backgroundColor;
    var m = bg && bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return false;
    if (m[4] !== undefined && parseFloat(m[4]) < 0.5) return false; // hampir transparan → pakai induknya
    var L = (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255;
    return L < 0.45;
  }

  /* Membuat `id` yang stabil dari judul. Stabil itu penting: kalau `id` berubah
     tiap muat, tautan yang orang salin tidak akan pernah bekerja dua kali. */
  function siput(t) {
    return t.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "bagian";
  }

  function pastikanId(sek, i) {
    if (sek.id) return sek.id;
    var dasar = siput(judulDari(sek)) || "bagian-" + (i + 1);
    var id = dasar, n = 2;
    while (document.getElementById(id)) id = dasar + "-" + n++;
    sek.id = id;
    return id;
  }

  function bangun() {
    if (!bolehDiSini()) return;
    var semua = Array.prototype.slice.call(document.querySelectorAll(PILIH));
    var seksi = semua.filter(function (s) {
      if (s.hasAttribute("data-secnav-skip")) return false;
      for (var i = 0; i < TOLAK.length; i++) if (s.classList.contains(TOLAK[i])) return false;
      /* Seksi bersarang: kalau sebuah seksi berada DI DALAM seksi lain yang juga
         terpilih, hanya yang terluar yang dihitung — kalau tidak, rel akan
         memuat butir ganda untuk daerah halaman yang sama. */
      for (var j = 0; j < semua.length; j++) if (semua[j] !== s && semua[j].contains(s)) return false;
      /* Seksi yang lebih pendek dari sepertiga layar biasanya pemisah/pita,
         bukan bagian yang orang mau lompati. */
      return s.getBoundingClientRect().height > window.innerHeight * 0.35;
    });

    if (seksi.length < MIN_SEKSI) return;
    seksi.forEach(pastikanId);

    var nav = document.createElement("nav");
    nav.className = "lsecnav";
    nav.setAttribute("aria-label", "Navigasi bagian");
    /* ⛔ Mesin i18n berjalan di halaman ini dan berjalan ULANG tiap ganti bahasa.
       Label di sini DITURUNKAN dari judul seksi yang sudah diterjemahkan mesin
       itu; membiarkannya diterjemahkan lagi berarti menerjemahkan terjemahan.
       Rel ini membangun ulang labelnya sendiri saat bahasa berganti (lihat bawah). */
    nav.setAttribute("data-i18n-skip", "secnav");

    var tombol = [];
    seksi.forEach(function (sek, i) {
      var b = document.createElement("button");
      b.type = "button";
      var judul = pendek(judulDari(sek));
      b.setAttribute("aria-label", judul);
      b.className = "lsecnav__b";
      b.innerHTML =
        '<span class="lsecnav__t"><i>' +
        String(i + 1).padStart(2, "0") +
        "</i>" +
        judul.replace(/[<>&]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]; }) +
        '</span><span class="lsecnav__g"></span>';
      b.addEventListener("click", function () {
        var halus = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        sek.scrollIntoView({ behavior: halus ? "smooth" : "auto", block: "start" });
        /* Fokus dipindahkan ke seksinya supaya pengguna papan ketik & pembaca
           layar ikut berpindah — menggulir saja meninggalkan fokus di rel. */
        sek.setAttribute("tabindex", "-1");
        sek.focus({ preventScroll: true });
      });
      nav.appendChild(b);
      tombol.push(b);
    });

    document.body.appendChild(nav);
    navAktif = nav;

    /* ── Seksi aktif ──────────────────────────────────────────────────────── */
    var terlihat = new Map();
    var aktifKini = -1;

    function pilihAktif() {
      var terbaik = -1, skorTerbaik = 0;
      seksi.forEach(function (s, i) {
        var r = terlihat.get(s) || 0;
        if (r > skorTerbaik) { skorTerbaik = r; terbaik = i; }
      });
      if (terbaik < 0 || terbaik === aktifKini) return;
      aktifKini = terbaik;
      tombol.forEach(function (b, i) {
        if (i === terbaik) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
      nav.classList.toggle("lsecnav--gelap", gelapkah(seksi[terbaik]));
    }

    var pengamat = new IntersectionObserver(
      function (masuk) {
        masuk.forEach(function (e) { terlihat.set(e.target, e.intersectionRatio); });
        pilihAktif();
      },
      /* Ambang bertingkat: rasio, bukan sekadar "terlihat/tidak", supaya seksi
         yang paling banyak mengisi layar yang menang — bukan yang kebetulan
         menyenggol tepi bawah. rootMargin memangkas bilah navigasi atas. */
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1], rootMargin: "-72px 0px -35% 0px" },
    );
    seksi.forEach(function (s) { pengamat.observe(s); });
    pengamatAktif = pengamat;

    /* Ganti bahasa → judul seksi berubah → label rel ikut dibangun ulang.
       Pendengarnya DISIMPAN supaya bisa dilepas saat rel dibongkar; kalau tidak,
       tiap perpindahan halaman meninggalkan satu pendengar mati yang masih
       memegang rujukan ke seksi halaman lama. */
    function perbaruiLabel() {
      seksi.forEach(function (sek, i) {
        var judul = pendek(judulDari(sek));
        var t = tombol[i].querySelector(".lsecnav__t");
        if (t) t.innerHTML = "<i>" + String(i + 1).padStart(2, "0") + "</i>" + judul.replace(/[<>&]/g, function (c) {
          return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c];
        });
        tombol[i].setAttribute("aria-label", judul);
      });
    }
    dengarBahasa = function () { setTimeout(perbaruiLabel, 120); };
    document.addEventListener("glyiv:lang", dengarBahasa);

    seksiTerpakai = seksi;
    segarkanLabel = perbaruiLabel;
  }

  function bongkar() {
    if (pengamatAktif) { pengamatAktif.disconnect(); pengamatAktif = null; }
    if (dengarBahasa) { document.removeEventListener("glyiv:lang", dengarBahasa); dengarBahasa = null; }
    navAktif = null;
    seksiTerpakai = [];
    segarkanLabel = null;
    /* Disapu lewat querySelectorAll, bukan lewat `navAktif` saja: kalau pernah
       ada rel yatim dari muat sebelumnya, ia ikut terangkat juga. */
    var sisa = document.querySelectorAll(".lsecnav");
    for (var i = 0; i < sisa.length; i++) {
      if (sisa[i].parentNode) sisa[i].parentNode.removeChild(sisa[i]);
    }
  }

  var jadwal = [];
  function batalkanJadwal() {
    for (var i = 0; i < jadwal.length; i++) clearTimeout(jadwal[i]);
    jadwal = [];
  }

  /* Membangun rel SEKALI pada tenggat tebakan tidak pernah benar: kalau terlalu
     cepat, ia menyalin seksi halaman LAMA (terukur — rel di /lab/... masih
     menampilkan butir beranda); kalau terlalu lambat, rel berkedip muncul.
     Jadi rel dibangun cepat, lalu DIPERIKSA beberapa kali: kalau seksi yang
     dipegangnya sudah dilepas dokumen, ia dibangun ulang. Pemeriksaan yang sama
     sekaligus menyegarkan label, karena mesin i18n sering selesai belakangan. */
  var TIK = [260, 900, 1700, 2800];

  function segarkan() {
    batalkanJadwal();
    bongkar();
    if (window.matchMedia("(max-width: " + (MIN_LEBAR - 1) + "px)").matches) return;
    if (!bolehDiSini()) return;

    TIK.forEach(function (ms) {
      jadwal.push(setTimeout(function () {
        if (!bolehDiSini()) { bongkar(); return; }
        if (!navAktif) { bangun(); return; }
        if (!masihSah()) { bongkar(); bangun(); return; }
        if (segarkanLabel) segarkanLabel();
      }, ms));
    });
  }

  /* ── Mengikuti perpindahan halaman SPA ────────────────────────────────────
     Router React tidak memancarkan peristiwa yang bisa didengar dari luar, jadi
     `history` yang ditambal. Cara ini tidak bergantung pada router mana pun dan
     tetap bekerja untuk tombol maju/mundur peramban. */
  var jalurTerakhir = location.pathname;
  function mungkinPindah() {
    if (location.pathname === jalurTerakhir) return;
    jalurTerakhir = location.pathname;
    segarkan();
  }
  ["pushState", "replaceState"].forEach(function (nama) {
    var asli = history[nama];
    if (typeof asli !== "function") return;
    history[nama] = function () {
      var hasil = asli.apply(this, arguments);
      setTimeout(mungkinPindah, 0);
      return hasil;
    };
  });
  window.addEventListener("popstate", function () { setTimeout(mungkinPindah, 0); });
  /* Halaman situs memancarkan ini sesudah skrip bersamanya siap. */
  window.addEventListener("glyiv:page", function () { setTimeout(mungkinPindah, 0); });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", segarkan);
  else segarkan();
})();
