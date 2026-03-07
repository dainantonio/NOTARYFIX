// api/gemini.js — Vercel serverless function
// Proxies Gemini API calls server-side so the key never reaches the browser.
// Supports text-only and multimodal (image + text) requests.
// Rate limited: 20 requests/minute per IP, plus origin check.

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// In-memory rate limit store: IP → { count, resetAt }
// Vercel functions are warm for ~5 min, so this provides meaningful protection
// against accidental loops and casual abuse without external infra.
const rateLimitMap = new Map();
const RATE_LIMIT    = 20;   // max requests
const WINDOW_MS     = 60_000; // per 60 seconds

function checkRateLimit(ip) {
  const now  = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Allowed origins — expand if you add a custom domain
const ALLOWED_ORIGINS = [
  'https://dainantonio.github.io',
  'https://notaryfix.vercel.app',
];

export default async function handler(req, res) {
  // ── CORS / Origin check ──────────────────────────────────────────────────
  const origin = req.headers.origin || '';
  const isAllowed =
    ALLOWED_ORIGINS.some((o) => origin === o || origin.endsWith('.vercel.app')) ||
    origin === ''; // server-to-server or same-origin (Vercel preview deploys)

  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden origin.' });
  }

  // ── Method guard ─────────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Rate limit ───────────────────────────────────────────────────────────
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (!checkRateLimit(ip)) {
    console.warn('[api/gemini] Rate limit hit for IP:', ip);
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // ── API key check ─────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server.' });
  }

  // ── Request validation ────────────────────────────────────────────────────
  const { prompt, generationConfig, safetySettings, imageBase64, mimeType } = req.body || {};

  // At least one of prompt or imageBase64 must be present
  if (!prompt && !imageBase64) {
    return res.status(400).json({ error: 'Missing prompt or image.' });
  }
  if (prompt && typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt.' });
  }
  if (prompt && prompt.length > 32_000) {
    return res.status(400).json({ error: 'Prompt too long (max 32,000 chars).' });
  }
  // Validate image payload: base64 string + valid mime
  if (imageBase64) {
    if (typeof imageBase64 !== 'string' || imageBase64.length > 10_000_000) {
      return res.status(400).json({ error: 'Image too large. Please use a smaller screenshot (under ~7MB).' });
    }
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    if (mimeType && !allowedMimes.includes(mimeType)) {
      return res.status(400).json({ error: `Unsupported image type: ${mimeType}` });
    }
  }

  // ── Build content parts (text-only OR image+text multimodal) ─────────────
  const parts = [];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } });
  }
  if (prompt) {
    parts.push({ text: prompt });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: generationConfig || {
      temperature: 0.3,
      maxOutputTokens: 1024,
      topP: 0.8,
    },
    safetySettings: safetySettings || [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  try {
    const upstream = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      const geminiMsg = err?.error?.message || err?.error?.status || JSON.stringify(err);
      console.error('[api/gemini] Upstream error:', upstream.status, geminiMsg);
      return res.status(upstream.status).json({
        error: `Gemini error (${upstream.status}): ${geminiMsg}`,
        details: err,
      });
    }

    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    return res.status(200).json({ text });
  } catch (err) {
    console.error('[api/gemini] Request failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
