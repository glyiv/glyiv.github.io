# Kabar (newsletter) — Firebase setup

The Kabar feed works immediately with a local content pack. To turn on **real,
shared, real-time engagement** (views/likes/shares synced across all visitors)
and admin publishing, connect Firestore on project **glyiv-28711**.

## One-time setup (≈5 minutes)

1. **Deploy security rules** — Firebase Console → *Firestore Database* → *Rules*.
   Paste the `match /kabar_articles/{slug}` block from
   [`firestore.rules`](./firestore.rules) into your rules (keep any other
   collections you already have), then **Publish**.
   *(Or with the CLI: `firebase deploy --only firestore:rules`.)*

2. **Enable Google sign-in** — Console → *Authentication* → *Sign-in method* →
   enable **Google**.

3. **Authorize domains** — Console → *Authentication* → *Settings* →
   *Authorized domains* → add **`glyiv.github.io`**, **`localhost`**, and
   **`127.0.0.1`**.

## Seed the content (publish the queue)

1. Open **`/lab/kabar/admin.html`** and sign in with **glyiv.archourium@gmail.com**
   (the only admin allowed to write).
2. Click **Import Content Pack**. This writes the article set into Firestore
   (`kabar_articles`) with:
   - **10 articles live now**, the **rest scheduled 1 per day** (auto-drip),
   - every counter starting at **0 — real, not dummy**.
   Articles that already exist are **skipped** so engagement is never reset.
3. Manage the queue from the same page: **Publish now**, **Schedule**,
   **Unpublish (draft)**, **Delete**, **Preview**.

## How engagement stays real-time

- The public feed & article pages read `kabar_articles` and subscribe with
  `onSnapshot`, so counts update live.
- Views/likes/shares are `increment()` writes; the rules allow the public to
  change **only** those counters (never article content). A device likes once
  (deduped locally) and a view counts once per day per article.
- Before Firestore is seeded, the site falls back to the bundled
  `content-pack.js` so the newsletter always renders.

## Sharing

Each article/story has **X, Facebook, LinkedIn, WhatsApp** share intents plus
**Instagram** (copies the link) and the device's native share sheet. Every share
increments the real `shares` counter.

_No Cloudflare Worker is required for Kabar — Firestore is accessed directly
with security rules. (The existing `chat-proxy-worker.js` is only for the Gly
chat/Groq proxy.)_
