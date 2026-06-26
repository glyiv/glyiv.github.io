/* Glyiv runtime config.
   Set GLYIV_CHAT_PROXY to your deployed chat proxy URL (Cloudflare Worker / Vercel / Netlify
   function) that holds the Groq API key server-side. While empty, Liv & Gli fall back to the
   built-in offline responses. The Groq key must NEVER be placed in client code. */
window.GLYIV_CHAT_PROXY = "https://glyiv-chat.archourium.workers.dev";
