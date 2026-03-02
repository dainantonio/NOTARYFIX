// api/gemini.js — Vercel serverless function
// Proxies Gemini API calls server-side so the key never reaches the browser.
// Frontend calls POST /api/gemini with { prompt, generationConfig?, safetySettings? }

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server.' });
  }

  const { prompt, generationConfig, safetySettings } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prompt.' });
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: generationConfig || {
      temperature: 0.3,
      maxOutputTokens: 512,
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
      console.error('[api/gemini] Upstream error:', upstream.status, err);
      return res.status(upstream.status).json({ error: 'Gemini API error', details: err });
    }

    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    return res.status(200).json({ text });
  } catch (err) {
    console.error('[api/gemini] Request failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
