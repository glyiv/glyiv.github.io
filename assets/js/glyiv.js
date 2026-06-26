/* =============================================================
   GLYIV — site interactions
   splash · sidebar/scrollspy · reveal · counters · meters/bars ·
   spores · Liv chat (Groq + fallback) · device demo · tilt
   ============================================================= */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------- SPLASH -------------------- */
  function hideSplash() { document.body.classList.add("is-ready"); }
  if (document.querySelector(".gv-splash")) {
    window.addEventListener("load", () => setTimeout(hideSplash, 700));
    // hard fallback so splash never traps the user
    setTimeout(hideSplash, 3200);
  }

  /* -------------------- SIDEBAR / NAV -------------------- */
  const body = document.body;
  $("#gvBurger")?.addEventListener("click", () => body.classList.toggle("nav-open"));
  $("#gvScrim")?.addEventListener("click", () => body.classList.remove("nav-open"));

  const navItems = $$(".gv-nav__item");
  navItems.forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id && id.startsWith("#")) {
        const t = $(id);
        if (t) {
          e.preventDefault();
          t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          body.classList.remove("nav-open");
        }
      }
    });
  });

  /* -------------------- SCROLL SPY + PROGRESS -------------------- */
  const navHrefs = [...new Set(navItems.map((a) => a.getAttribute("href")).filter((h) => h && h.startsWith("#")))];
  const sections = navHrefs.map((h) => document.getElementById(h.slice(1))).filter(Boolean);
  const progress = $("#gvProgress");
  function setActive() {
    if (!sections.length) return;
    const line = window.innerHeight * 0.34;
    let cur = sections[0];
    for (const s of sections) { if (s.getBoundingClientRect().top <= line) cur = s; }
    const id = cur.id;
    navItems.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (progress) progress.style.width = pct.toFixed(2) + "%";
      setActive();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* -------------------- REVEAL + COUNTERS + METERS -------------------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || "0", 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (reduce) { el.textContent = prefix + target.toLocaleString("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix; return; }
    const dur = 1500; const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const val = target * e;
      el.textContent = prefix + val.toLocaleString("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const revealObs = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("is-in");
        $$("[data-count]", el).forEach(animateCount);
        if (el.hasAttribute("data-count")) animateCount(el);
        $$("[data-val]", el).forEach((m) => { m.style.width = m.dataset.val + "%"; });
        if (el.hasAttribute("data-val")) el.style.width = el.dataset.val + "%";
        obs.unobserve(el);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );
  $$("[data-reveal]").forEach((el) => revealObs.observe(el));
  // standalone counters/meters not wrapped in reveal
  $$("[data-count]:not([data-reveal])").forEach((el) => revealObs.observe(el));
  $$(".gv-meter i[data-val],.gv-bar__f[data-val]").forEach((el) => revealObs.observe(el));

  /* -------------------- AMBIENT SPORES -------------------- */
  if (!reduce) {
    const n = window.innerWidth < 700 ? 7 : 14;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "gv-spore";
      const sz = 2 + Math.random() * 5;
      s.style.width = s.style.height = sz + "px";
      s.style.left = Math.random() * 100 + "vw";
      s.style.bottom = "-20px";
      s.style.animationDuration = 14 + Math.random() * 18 + "s";
      s.style.animationDelay = -Math.random() * 24 + "s";
      document.body.appendChild(s);
    }
  }

  /* -------------------- TEAM CARD TILT -------------------- */
  if (!reduce && window.matchMedia("(pointer:fine)").matches) {
    $$(".gv-tcard").forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `translateY(-5px) perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
      });
      c.addEventListener("pointerleave", () => { c.style.transform = ""; });
    });
  }

  /* =====================================================
     LIV — AI host chat (Groq, with offline fallback brain)
     ===================================================== */
  // Chat is proxied through a serverless function that holds the Groq key server-side —
  // the API key is NOT in this client code. Set the Worker URL in assets/js/config.js.
  const GROQ_PROXY = (window.GLYIV_CHAT_PROXY || "").trim();
  const GROQ_MODEL = "llama-3.3-70b-versatile";
  const SYSTEM_PROMPT = `Kamu adalah "Liv", AI host & pemandu dari Glyiv — sistem operasi kafe yang cerdas-karbon, buatan tim Makassar.
Gaya: Bahasa Indonesia santai, hangat, ringkas (maks 2-4 kalimat), ramah ke calon pengunjung kafe MAUPUN investor. Boleh 1 emoji sesekali. Jangan kaku/formal, jangan bertele-tele.
Tentang Glyiv yang HARUS kamu tahu:
- Produk inti (skala awal): Glyiv POS untuk kafe — pesan lewat QR di meja tanpa antri ke kasir, ada AI host (kamu, Liv) yang rekomendasi menu sesuai mood/cuaca/preferensi, kustomisasi menu (gula/es/ukuran), info nutrisi, tracking pesanan (Diproses → Dimasak → Diantar → Selesai), booking meja, pre-order, cek stok.
- Green Membership: tiap pembelian menyumbang ke komunitas hijau lokal Makassar (mangrove Lantebung, bersih Pantai Losari, hutan kota, bank sampah) secara transparan; pengguna dapat Green Points dan bisa lihat dampak nyatanya.
- Green Receipt + Glyiv Carbon Engine: tiap struk digital menampilkan estimasi karbon per item (metode bertingkat Tier A/B/C, jujur soal ketidakpastian — bukan klaim "pasti/karbon netral").
- Keunggulan: data karbon LEVEL-ITEM langsung dari sumber (POS kafe) — bank & tools lain cuma dapat data level-kategori. Itu data moat Glyiv.
- Visi jangka panjang: jadi infrastruktur data karbon, e-wallet yang menampilkan karbon per item, marketplace Tree RWA + monitoring pohon (NDVI), sampai jadi Digital Public Infrastructure.
- Traksi: prototipe pendahulu "Gryn" juara 3 Indibiz, akses pilot Pemkot Makassar, jaringan Walhi Makassar; survei UX memvalidasi orang malas antri & tertarik kontribusi hijau.
ATURAN: Jangan mengarang fakta/angka di luar ini. Kalau ditanya hal teknis/bisnis, jawab to-the-point. Kalau cocok, ajak orang "coba demo" atau lihat halaman visi. Jangan menyebut kamu LLM/Groq.`;

  let chatHistory = [];
  let apiUp = true;
  const wrap = $("#gvChat");
  const msgsEl = $("#gvChatMsgs");
  const inputEl = $("#gvChatInput");
  const launcher = $("#livLauncher");
  const caption = $("#livCaption");

  function openChat() {
    if (!wrap) return;
    wrap.classList.add("is-open");
    launcher?.classList.add("is-hidden");
    if (caption) caption.style.display = "none";
    if (chatHistory.length === 0) {
      setTimeout(() => livSay(window.GLYIV_LANG === "en" ? "Hi! 👋 I'm Liv, Glyiv's AI assistant. Curious how no-queue ordering works, about Green Membership, or have investor questions? Just ask." : "Hai! 👋 Aku Liv, asisten AI-nya Glyiv. Mau tahu cara kerja pemesanan tanpa antri, soal Green Membership, atau pertanyaan investor? Tanya aja."), 250);
    }
    setTimeout(() => inputEl?.focus(), 360);
  }
  function closeChat() {
    wrap?.classList.remove("is-open");
    launcher?.classList.remove("is-hidden");
    layoutLauncher(); positionLauncher();
  }
  launcher?.addEventListener("click", openChat);
  $$("[data-open-chat]").forEach((b) => b.addEventListener("click", openChat));
  $("#gvChatClose")?.addEventListener("click", closeChat);

  /* ---- TITAN launcher: lives in hero, morphs to bottom-right dock on scroll ---- */
  let LL = null;
  // pages with their own hero 3D (e.g. vision globe) keep the launcher docked in the corner so it never covers the scene
  const heroDock = !document.getElementById("globeCanvas") && !document.body.hasAttribute("data-dock-launcher");
  function layoutLauncher() {
    if (!launcher) return;
    const vw = innerWidth, vh = innerHeight, CORNER = 24;
    const wide = vw > 1080 && heroDock;
    const BASE = wide ? Math.min(300, Math.round(vw * 0.3)) : 96;
    launcher.style.width = launcher.style.height = BASE + "px";
    const cornerCx = vw - CORNER - BASE / 2, cornerCy = vh - CORNER - BASE / 2;
    LL = { vw, vh, wide, BASE, SMALL: wide ? 96 / BASE : 1, cornerCx, cornerCy, heroCx: vw * 0.72, heroCy: vh * 0.46, end: vh * 0.74 };
  }
  function positionLauncher() {
    if (!launcher || !LL) return;
    if (!LL.wide) { launcher.style.transform = "none"; if (caption) caption.style.display = "none"; return; }
    const p = Math.max(0, Math.min(1, scrollY / LL.end));
    const x = (LL.heroCx - LL.cornerCx) * (1 - p), y = (LL.heroCy - LL.cornerCy) * (1 - p);
    launcher.style.transform = "translate(" + x + "px," + y + "px) scale(" + (1 + (LL.SMALL - 1) * p) + ")";
    if (caption) {
      const op = Math.max(0, 1 - scrollY / (LL.vh * 0.2));
      caption.style.opacity = op;
      caption.style.left = LL.heroCx + "px";
      caption.style.top = (LL.heroCy + LL.BASE * 0.46) + "px";
      caption.style.display = wrap?.classList.contains("is-open") || op < 0.02 ? "none" : "block";
    }
  }
  if (launcher) {
    layoutLauncher(); positionLauncher();
    addEventListener("scroll", positionLauncher, { passive: true });
    addEventListener("resize", () => { layoutLauncher(); positionLauncher(); });
  }

  function addBubble(text, who) {
    const b = document.createElement("div");
    b.className = "gv-bubble " + (who === "me" ? "is-me" : "is-liv");
    b.textContent = text;
    msgsEl.appendChild(b);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return b;
  }
  function livSay(text) {
    addBubble(text, "liv");
    if (window.glyivBot) { window.glyivBot.speak(true); clearTimeout(window.__lt); window.__lt = setTimeout(() => window.glyivBot && window.glyivBot.speak(false), Math.min(6500, 1400 + text.length * 28)); }
  }

  function fallback(text) {
    const t = (text || "").toLowerCase();
    const has = (...k) => k.some((w) => t.includes(w));
    if (has("halo", "hai", "hi", "pagi", "siang", "sore", "malam", "assalam"))
      return "Halo juga! 👋 Aku Liv. Penasaran sama pemesanan tanpa antri, Green Membership, atau sisi bisnis Glyiv buat investor?";
    if (has("antri", "kasir", "pesan", "order", "qr", "meja"))
      return "Di Glyiv kamu scan QR di meja, ngobrol sama aku buat pilih menu, lalu bayar via QRIS — tanpa turun ke kasir, bahkan di lantai 2. Mau coba? Klik 'Coba Demo' ya.";
    if (has("karbon", "carbon", "emisi", "hijau", "green", "lingkungan"))
      return "Tiap pesanan dapat estimasi karbon per item (metode bertingkat, jujur soal ketidakpastian) dan sebagian dana mengalir transparan ke komunitas hijau Makassar. Itu inti Glyiv 🌿.";
    if (has("membership", "poin", "point", "reward", "loyalty"))
      return "Green Membership: login, kumpulkan Green Points tiap pesan, dan salurkan ke proyek hijau lokal — kamu bisa lacak dampaknya secara nyata.";
    if (has("investor", "bisnis", "revenue", "model", "untung", "monet", "pendapatan"))
      return "Wedge-nya SaaS kafe (langganan per outlet ~Rp199k–799k) + modul green receipt, lalu jadi data karbon level-item, e-wallet, sampai Tree RWA. Detail lengkap ada di dokumen investor — cek tombol 'Untuk Investor'.";
    if (has("rwa", "pohon", "tree", "e-wallet", "ewallet", "wallet", "visi", "masa depan", "jangka panjang"))
      return "Jangka panjang Glyiv jadi infrastruktur: e-wallet ber-karbon, marketplace Tree RWA + monitoring pohon, hingga Digital Public Infrastructure. Lihat halaman Visi buat ceritanya 🌍.";
    if (has("makassar", "tim", "team", "siapa"))
      return "Glyiv dibangun tim Makassar (pendahulunya 'Gryn' juara 3 Indibiz), didukung akses pilot Pemkot Makassar & jaringan Walhi. Mulai dari kafe lokal, lalu seluruh Indonesia.";
    if (has("demo", "coba", "cobain"))
      return "Mantap! Klik 'Coba Demo' untuk merasakan alur pesan dari meja — scan, ngobrol sama aku, pesan, bayar, lacak. Seru kok ✨";
    if (has("terima kasih", "makasih", "thanks", "mksh"))
      return "Sama-sama! 🤗 Kalau ada yang mau ditanya lagi soal Glyiv, aku di sini.";
    return "Aku catat ya 🌱 Aku paling bisa bantu soal: pemesanan tanpa antri, Green Membership & karbon, atau model bisnis Glyiv buat investor. Mau bahas yang mana?";
  }

  async function send() {
    const text = (inputEl.value || "").trim();
    if (!text) return;
    inputEl.value = "";
    addBubble(text, "me");
    chatHistory.push({ role: "user", content: text });

    const typing = document.createElement("div");
    typing.className = "gv-typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    msgsEl.appendChild(typing);
    msgsEl.scrollTop = msgsEl.scrollHeight;

    let reply;
    if (apiUp && GROQ_PROXY) {
      try {
        const res = await fetch(GROQ_PROXY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: GROQ_MODEL,
            temperature: 0.7,
            max_tokens: 320,
            // pages may publish the open document so Liv can explain it directly
            messages: [{ role: "system", content: SYSTEM_PROMPT + (window.GLYIV_LANG === "en" ? "\n\nLANGUAGE: The user is browsing in English — always reply in natural, friendly English." : "") + (window.glyivDocContext ? "\n\nKONTEKS HALAMAN (dokumen yang sedang dibuka pengguna — jawab berdasarkan ini bila relevan, ringkas & akurat):\n" + window.glyivDocContext : "") }, ...chatHistory.slice(-8)],
          }),
        });
        if (!res.ok) throw new Error("http " + res.status);
        const data = await res.json();
        reply = (data.choices?.[0]?.message?.content || "").trim();
        if (!reply) throw new Error("empty");
      } catch (e) {
        apiUp = false;
        reply = fallback(text);
      }
    } else {
      reply = fallback(text);
    }
    typing.remove();
    chatHistory.push({ role: "assistant", content: reply });
    livSay(reply);
  }

  $("#gvChatSend")?.addEventListener("click", send);
  inputEl?.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  $$(".gv-qchip").forEach((c) => c.addEventListener("click", () => { inputEl.value = c.dataset.q || c.textContent; send(); }));

  /* -------------------- DEMO STEP HIGHLIGHT (cosmetic) -------------------- */
  $$(".gv-step").forEach((s, i) => {
    s.addEventListener("mouseenter", () => $$(".gv-step").forEach((o, j) => o.style.opacity = j === i ? "1" : ".55"));
    s.addEventListener("mouseleave", () => $$(".gv-step").forEach((o) => o.style.opacity = "1"));
  });

  /* -------------------- MASALAH: problem carousel (drives the shared 3D scene) -------------------- */
  const pb = $("#pb");
  if (pb) {
    const cards = $$(".pb-card", pb), bubbles = $$(".pb-bubble", pb), dotsWrap = $("#pbDots"), state = $("#pbState");
    const Np = cards.length; let pi = 0;
    cards.forEach((c, k) => { const d = document.createElement("button"); d.className = "pb-dot" + (k === Np - 1 ? " is-sol" : "") + (k === 0 ? " is-on" : ""); d.setAttribute("aria-label", "Masalah " + (k + 1)); d.addEventListener("click", () => setPb(k)); dotsWrap.appendChild(d); });
    const pdots = $$(".pb-dot", dotsWrap);
    function setPb(i) {
      pi = ((i % Np) + Np) % Np;
      pb.setAttribute("data-p", pi);
      cards.forEach((c, k) => c.classList.toggle("is-on", k === pi));
      pdots.forEach((d, k) => d.classList.toggle("is-on", k === pi));
      bubbles.forEach((b) => b.classList.toggle("is-on", +b.dataset.p === pi));
      if (state) state.textContent = pi === Np - 1 ? "Dengan Glyiv" : "Tanpa Glyiv";
      if (window.glyivProblems) window.glyivProblems.show(pi);
    }
    $(".pb-next", pb)?.addEventListener("click", () => setPb(pi + 1));
    $(".pb-prev", pb)?.addEventListener("click", () => setPb(pi - 1));
    // (drag on the 3D stage rotates the model — slide change is via arrows/dots/keyboard)
    pb.tabIndex = 0;
    pb.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") setPb(pi + 1); else if (e.key === "ArrowLeft") setPb(pi - 1); });
    let hover = false;
    pb.addEventListener("pointerenter", () => (hover = true));
    pb.addEventListener("pointerleave", () => (hover = false));
    if (!reduce) setInterval(() => { if (!hover && !document.hidden) setPb(pi + 1); }, 5200);
    setPb(0);
  }

  /* -------------------- LIV HOST CUSTOMIZER (app host · 3D) -------------------- */
  if ($("#livHostCanvas")) {
    $$(".cz-sw").forEach((sw) =>
      sw.addEventListener("click", () => {
        const k = sw.dataset.cz, v = sw.dataset.val;
        $$('.cz-sw[data-cz="' + k + '"]').forEach((s) => s.classList.toggle("is-sel", s === sw));
        const H = window.glyivHost; if (!H) return;
        if (k === "apron") H.setApron(v);
        else if (k === "cap") H.setCap(v);
        else if (k === "shirt") H.setShirt(v);
        else if (k === "hat") H.setHat(v);
        else if (k === "logo") H.setLogo(v);
        else if (k === "gender") H.setGender(v);
      })
    );
    /* idle speech: Liv occasionally greets with a speech bubble + talking mouth */
    const bubble = $("#hostBubble");
    const livLines = [
      "Hai! Mau kopi yang bikin melek? ☕",
      "Cuaca lagi terik — Teh Markisa dingin paling seger 🌿",
      "Aku bisa pakai logo & warna kafemu, lho.",
      "Pesan dari meja, tanpa antri. Gampang!",
      "Tiap pesanan jadi green receipt 🌱",
    ];
    let li = 0, bubbleOn = false;
    function sayIdle() {
      if (reduce || !bubble || !window.glyivHost) return;
      if (document.hidden) return;
      const sec = $("#liv");
      if (sec) { const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; }
      const text = livLines[li % livLines.length]; li++;
      bubble.textContent = text;
      bubble.classList.add("is-on"); bubbleOn = true;
      window.glyivHost.talk(true);
      const dur = Math.min(5200, 1600 + text.length * 55);
      clearTimeout(window.__hb1); clearTimeout(window.__hb2);
      window.__hb1 = setTimeout(() => { window.glyivHost && window.glyivHost.talk(false); }, dur);
      window.__hb2 = setTimeout(() => { bubble.classList.remove("is-on"); bubbleOn = false; }, dur + 400);
    }
    setTimeout(sayIdle, 2600);
    setInterval(() => { if (!bubbleOn) sayIdle(); }, 8000);
  }

  /* -------------------- MENU CAROUSEL + LIVE CUSTOMIZATION -------------------- */
  const mcRing = $("#mcRing");
  if (mcRing) {
    const MENU_C = [
      { em: "🧊", nm: "Teh Dingin Markisa", cat: "Minuman · rendah karbon 🌿", pr: 18000, kcal: 90, sugar: 16, co2: 0.2, params: [["Gula", "sugar"], ["Es", "ice"]] },
      { em: "☕", nm: "Kopi Susu Gula Aren", cat: "Minuman", pr: 28000, kcal: 180, sugar: 22, co2: 0.5, params: [["Gula", "sugar"], ["Susu", "milk"], ["Es", "ice"]] },
      { em: "🍵", nm: "Matcha Cream Shake", cat: "Minuman", pr: 32000, kcal: 250, sugar: 28, co2: 0.7, params: [["Gula", "sugar"], ["Susu", "milk"]] },
      { em: "🥤", nm: "Es Coklat Spesial", cat: "Minuman", pr: 25000, kcal: 220, sugar: 30, co2: 0.6, params: [["Gula", "sugar"], ["Susu", "milk"], ["Es", "ice"]] },
      { em: "🍚", nm: "Nasi Goreng Merah", cat: "Makanan · khas Makassar", pr: 30000, kcal: 600, sugar: 6, co2: 1.3, params: [["MSG", "msg"], ["Pedas", "spice"]] },
      { em: "🍜", nm: "Mie Goreng Spesial", cat: "Makanan", pr: 27000, kcal: 520, sugar: 5, co2: 0.9, params: [["MSG", "msg"], ["Pedas", "spice"]] },
      { em: "🍌", nm: "Pisang Epe Keju", cat: "Dessert · rendah karbon 🌿", pr: 22000, kcal: 300, sugar: 24, co2: 0.4, params: [["Keju", "cheese"], ["Gula", "sugar"]] },
    ];
    const n = MENU_C.length, angle = 360 / n, R = 230;
    MENU_C.forEach((it, i) => { const d = document.createElement("div"); d.className = "mc-item"; d.style.transform = `rotateY(${i * angle}deg) translateZ(${R}px)`; d.innerHTML = `<div class="mc-iem">${it.em}</div><div class="mc-inm">${it.nm}</div>`; mcRing.appendChild(d); });
    const itemsEls = Array.from(mcRing.children);
    let cur = 0, deg = 0, dragging = false, lastX = 0, size = 1;
    const state = {};
    const fmt = (v) => "Rp " + v.toLocaleString("id-ID");
    function setRing(anim) { mcRing.style.transition = anim ? "transform .5s cubic-bezier(.22,1,.36,1)" : "none"; mcRing.style.transform = `translateZ(-${R}px) rotateY(${deg}deg)`; }
    function mark() { itemsEls.forEach((e, i) => e.classList.toggle("is-active", i === cur)); }
    function recalc() {
      const it = MENU_C[cur];
      const sg = state.sugar == null ? 50 : state.sugar, mk = state.milk == null ? 50 : state.milk;
      const kcal = Math.round(it.kcal * size * (1 + (sg - 50) / 100 * 0.2 + (mk - 50) / 100 * 0.25));
      const sugar = Math.round(it.sugar * size * (sg / 50));
      const co2 = Math.round(it.co2 * size * (1 + (mk - 50) / 100 * 0.2) * 10) / 10;
      $("#mcKcal").textContent = kcal + " kkal"; $("#mcSugar").textContent = sugar + " g"; $("#mcCo2").textContent = co2 + " kg";
      $("#mcPrice").textContent = fmt(Math.round(it.pr * size / 500) * 500);
    }
    function buildSliders(it) {
      const wrap = $("#mcSliders"); wrap.innerHTML = "";
      it.params.forEach(([label, key]) => {
        state[key] = 50;
        const row = document.createElement("div"); row.className = "mc-slider";
        row.innerHTML = `<label>${label} <b>50%</b></label><input type="range" min="0" max="100" value="50" aria-label="${label}">`;
        const out = row.querySelector("b"), inp = row.querySelector("input");
        inp.addEventListener("input", () => { state[key] = +inp.value; out.textContent = state[key] + "%"; recalc(); });
        wrap.appendChild(row);
      });
    }
    function updatePanel() { const it = MENU_C[cur]; $("#mcEm").textContent = it.em; $("#mcTitle").textContent = it.nm; $("#mcCat").textContent = it.cat; $("#mcName").textContent = it.nm; Object.keys(state).forEach((k) => delete state[k]); buildSliders(it); recalc(); }
    const mcSwap = $("#mcSwap");
    function snap(i) {
      cur = ((i % n) + n) % n; deg = -cur * angle; setRing(true); mark();
      if (mcSwap && !reduce) {
        mcSwap.classList.add("is-swapping");
        clearTimeout(snap._t);
        snap._t = setTimeout(() => { updatePanel(); mcSwap.classList.remove("is-swapping"); }, 200);
      } else updatePanel();
    }
    $$("#mcSizes button").forEach((b) => b.addEventListener("click", () => { $$("#mcSizes button").forEach((x) => x.classList.toggle("is-sel", x === b)); size = +b.dataset.m; recalc(); }));
    $("#mcPrev").addEventListener("click", () => snap(cur - 1));
    $("#mcNext").addEventListener("click", () => snap(cur + 1));
    const stage = $("#mcStage");
    stage.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; setRing(false); try { stage.setPointerCapture(e.pointerId); } catch (x) {} });
    window.addEventListener("pointermove", (e) => { if (!dragging) return; deg += (e.clientX - lastX) * 0.4; lastX = e.clientX; setRing(false); });
    window.addEventListener("pointerup", () => { if (!dragging) return; dragging = false; snap(Math.round(-deg / angle)); });
    deg = 0; setRing(false); mark(); updatePanel();
  }

  /* -------------------- FEATURE CAROUSELS (supports many) -------------------- */
  function countUp(el, target, dur) {
    const t0 = performance.now();
    (function step(t) { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString("id-ID"); if (p < 1) requestAnimationFrame(step); })(performance.now());
  }
  function initCarousel(cf) {
    const track = $(".cf-track", cf), vp = $(".cf-viewport", cf), dotsWrap = $(".cf-dots", cf);
    if (!track || !vp || !dotsWrap) return;
    const slides = $$(".cf-slide", track), N = slides.length;
    if (!N) return;
    let idx = 0;
    slides.forEach((s, i) => {
      const d = document.createElement("button");
      d.className = "cf-dot" + (i === 0 ? " is-on" : "");
      d.setAttribute("aria-label", "Fitur " + (i + 1));
      d.addEventListener("click", () => go(i));
      dotsWrap.appendChild(d);
    });
    const dots = $$(".cf-dot", dotsWrap);
    const hasMc = !!$(".cf-slide--mc", track);
    function go(i) {
      idx = ((i % N) + N) % N;
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      slides.forEach((s, k) => s.classList.toggle("is-on", k === idx));
      dots.forEach((d, k) => d.classList.toggle("is-on", k === idx));
      const pts = slides[idx].querySelector("[data-countup]");
      if (pts) countUp(pts, +pts.dataset.countup, 1100);
    }
    $(".cf-next", cf)?.addEventListener("click", () => go(idx + 1));
    $(".cf-prev", cf)?.addEventListener("click", () => go(idx - 1));
    cf.tabIndex = 0;
    cf.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(idx + 1); else if (e.key === "ArrowLeft") go(idx - 1); });
    let sx = 0, sy = 0, sw = false;
    vp.addEventListener("pointerdown", (e) => { if (e.target.closest(".cf-slide--mc")) return; sw = true; sx = e.clientX; sy = e.clientY; });
    vp.addEventListener("pointerup", (e) => { if (!sw) return; sw = false; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1)); });
    let hover = false;
    cf.addEventListener("pointerenter", () => (hover = true));
    cf.addEventListener("pointerleave", () => (hover = false));
    cf.addEventListener("focusin", () => (hover = true));
    cf.addEventListener("focusout", () => (hover = false));
    if (!reduce) setInterval(() => { if (!hover && !document.hidden) go(idx + 1); }, 6500);
    go(0);
  }
  $$(".cf").forEach(initCarousel);

  /* -------------------- SKALA: "Garis Cahaya" — Indonesia map lights up per phase -------------------- */
  const gl = $("#gl");
  if (gl) {
    const N = 5; let gi = 0;
    const fill = $(".gl-fill", gl), terr = $$(".gl-terr span", gl);
    const cards = $$(".gl-card", gl), dots = $$(".gl-rdot", gl);
    const regions = $$(".gl-reg", gl), routes = $$(".gl-route", gl), gnodes = $$(".gl-node", gl), gdots = $$(".gl-dot", gl);
    const regUnlock = { sulawesi: 1, jawa: 2, sumatra: 3, kalimantan: 3, papua: 3, nusa: 3, maluku: 3 };
    const nodeUnlock = { makassar: 0, surabaya: 2, jakarta: 3, world: 4 };
    const cover = [10, 20, 48, 80, 100];
    function setPhase(p) {
      gi = ((p % N) + N) % N;
      gl.setAttribute("data-phase", gi);
      if (fill) fill.style.width = cover[gi] + "%";
      terr.forEach((s) => s.classList.toggle("is-on", +s.dataset.t === gi));
      regions.forEach((r) => r.classList.toggle("lit", gi >= (regUnlock[r.dataset.region] || 1)));
      routes.forEach((r) => r.classList.toggle("lit", gi >= +r.dataset.r));
      gnodes.forEach((n) => n.classList.toggle("lit", gi >= (nodeUnlock[n.dataset.node] || 0)));
      gdots.forEach((d) => d.classList.toggle("lit", gi >= (nodeUnlock[d.dataset.node] || 0)));
      cards.forEach((c, k) => c.classList.toggle("is-on", k === gi));
      dots.forEach((d, k) => { d.classList.toggle("is-on", k === gi); d.classList.toggle("is-done", k < gi); });
    }
    dots.forEach((d) => d.addEventListener("click", () => setPhase(+d.dataset.goto)));
    setPhase(0);
    let hover = false;
    gl.addEventListener("pointerenter", () => (hover = true));
    gl.addEventListener("pointerleave", () => (hover = false));
    gl.addEventListener("focusin", () => (hover = true));
    gl.addEventListener("focusout", () => (hover = false));
    if (!reduce) setInterval(() => { if (!hover && !document.hidden) setPhase(gi + 1); }, 4000);
  }

  /* -------------------- DECIMAL COUNT-UP ([data-co], e.g. carbon kg) -------------------- */
  const coEls = $$("[data-co]");
  if (coEls.length) {
    const coIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        coIO.unobserve(en.target);
        const el = en.target, target = parseFloat(el.dataset.co) || 0;
        if (reduce) { el.textContent = target.toFixed(2).replace(".", ","); return; }
        const t0 = performance.now();
        (function step(t) { const p = Math.min(1, (t - t0) / 900); el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(2).replace(".", ","); if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: 0.5 });
    coEls.forEach((el) => coIO.observe(el));
  }

  /* -------------------- YEAR -------------------- */
  $$("[data-year]").forEach((e) => (e.textContent = new Date().getFullYear()));
})();
