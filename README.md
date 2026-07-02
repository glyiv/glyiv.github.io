# glyiv.github.io — Glyiv marketing & investor site

Static site published via GitHub Pages at **https://glyiv.github.io/**.

> Glyiv — *"The carbon-intelligent operating system for commerce."* Café-ordering POS (QR + AI host "Liv")
> as the wedge in Makassar, scaling into item-level carbon-data infrastructure across Indonesia.

## Pages
- `index.html` — **home**: Glyiv as a Carbon Intelligence Platform (thesis + holographic globe, why-now,
  4-layer platform, carbon-flow signature, focus areas, market, competitive edge, roadmap, "Mulai dari mana?"
  bridge → POS app, investor CTA). Carbon-first positioning for investors.
- `pos.html` — **the POS product page** (formerly the landing): Glyiv POS, Liv, Green Membership, Carbon Engine,
  traction, roadmap, team. Reached from the home's "Mulai dari mana?" bridge.
- `vision.html` — redirect stub → `index.html` (the vision is now the home).
- `demo.html` — interactive ordering demo (QR → chat with Liv → order → pay → track → allocate Green Points).
- `demo-kasir.html` — cashier POS board demo (synced with the customer demo).
- Investor docs (roadmap + business model) are kept OFF-site and shared privately as PDFs
  (generated under the project's `docs/` folder, outside this deploy repo).
- Confidential strategy (exact ARR / revenue streams / funding rounds / named unsigned partners / internal OKRs
  from the strategy decks) is intentionally NOT published on the public site.

## Tech
- Plain HTML/CSS/JS (no build step). Fonts: Bricolage Grotesque, Plus Jakarta Sans, Space Mono.
- 3D scenes via Three.js (CDN, ES module): `assets/js/scenes.js` (hero "living orb", vision carbon globe).
- Interactions: `assets/js/glyiv.js` (splash, koios-style section nav + scrollspy, reveals, counters, Liv chat).
- Styles: `assets/css/glyiv.css`.
- Liv/Gli AI hosts are powered by Groq (Llama 3.3 70B) via a server-side proxy — set the proxy
  URL in `assets/js/config.js` (`window.GLYIV_CHAT_PROXY`); the API key lives only in that proxy,
  never in client code. Without a proxy configured, the hosts use an offline rule-based fallback.
- `assets/js/i18n.js` + `assets/js/i18n-en.js` — Indonesian (default) ⇄ English, auto-detected by locale.

## Editing / publishing
This folder **is** the published repo. Edit files here and push to deploy. No `npm run build` is needed for
this static site — that command belongs to the separate React app in the parent project and would overwrite
these files.

> ⚠️ Security note: the Groq API key is embedded client-side for the demo. For production, proxy it through a
> small serverless function and restrict by referrer/origin, or it can be scraped from the page.
