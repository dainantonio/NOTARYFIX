/**
 * Guardian Compliance Service
 * Adapted from NotaryOS-Guardian (geminiService.ts) for NotaryFix.
 *
 * Calls Gemini with the notary_primary_sources_v1.json dataset embedded in the
 * system prompt. All responses are grounded — the model is instructed to cite
 * only from the dataset and never use general knowledge.
 *
 * Env var required: VITE_GEMINI_API_KEY (set in Vercel → Settings → Environment Variables)
 */

import { GoogleGenAI, Type } from '@google/genai';
import rulesData from '../data/notary_primary_sources_v1.json';

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `
You are a Notary Compliance Assistant for NotaryFix.

HARD RULES:
1. Answer ONLY using the provided PRIMARY SOURCES dataset below and any context provided.
2. If the dataset does not contain relevant text for the selected state/topic, you MUST say: "Not found in provided primary sources."
3. NEVER use general knowledge. NEVER guess. NEVER hallucinate.
4. You MUST return:
   - A direct, clear answer.
   - A source list (title + url).
   - Where found (specific page, section, or field if available).
   - "Last updated" date (from the source or registry record).

---

PRIMARY SOURCES DATASET (notary_primary_sources_v1.json):
${JSON.stringify(rulesData, null, 2)}

---

JSON OUTPUT MODE (MANDATORY)
You MUST output ONLY valid JSON.
Do NOT include markdown fences.

Schema:
{
  "summary": "string",
  "action": "string",
  "details": ["string"],
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "source": {
    "title": "string",
    "url": "string",
    "where_found": "string",
    "last_updated": "YYYY-MM-DD" | ""
  },
  "confidence": "string",
  "disclaimer": "This is not legal advice. Verify with the official source.",
  "clarifying_questions": ["string"],
  "next_ctas": [
    { "label": "string", "target_view": "schedule|journal|journal_draft|clients|finances|settings|export|checklist|generate_checklist" }
  ]
}

Rules:
- details must always be an array (use 1–6 bullets).
- If you cannot verify a source from the dataset, set:
  source.title = "Not available in this dataset"
  source.url = ""
  source.where_found = ""
  source.last_updated = ""
- clarifying_questions must be [] if none are needed.
- next_ctas must be [] if none are appropriate.
- risk_level defaults to MEDIUM when clarifying is required.
- confidence should reflect how well the query matches the dataset (e.g., "High", "Partial", "None").

---

TONE
- Calm
- Professional
- Reassuring
- Clear
- Non-judgmental
- Senior-notary demeanor
`;

// ─── Route map: next_ctas target_view → NotaryFix route ─────────────────────

export const GUARDIAN_ROUTE_MAP = {
  schedule:           '/schedule',
  journal:            '/journal',
  journal_draft:      '/journal',
  clients:            '/clients',
  finances:           '/invoices',
  settings:           '/settings',
  export:             '/invoices',   // closest equivalent
  checklist:          '/agent',      // handled inline in component
  generate_checklist: '/agent',      // handled inline in component
};

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * @param {string} message - The user's question
 * @param {{ state?: string, appointmentType?: string, phase: string, clientInfo?: string, journalStatus: string }} context
 * @returns {Promise<GuardianResponse>}
 */
export async function getGuardianResponse(message, context) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your Vercel environment variables.');

  const ai = new GoogleGenAI({ apiKey });

  const contextStr = `
CURRENT CONTEXT:
- State: ${context.state || 'Unknown'}
- Appointment Type: ${context.appointmentType || 'Unknown'}
- Phase: ${context.phase}
- Client Info: ${context.clientInfo || 'Unknown'}
- Journal Status: ${context.journalStatus}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ parts: [{ text: message }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + '\n\n' + contextStr,
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary:  { type: Type.STRING },
          action:   { type: Type.STRING },
          details:  { type: Type.ARRAY, items: { type: Type.STRING } },
          risk_level: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
          source: {
            type: Type.OBJECT,
            properties: {
              title:        { type: Type.STRING },
              url:          { type: Type.STRING },
              where_found:  { type: Type.STRING },
              last_updated: { type: Type.STRING },
            },
            required: ['title', 'url', 'where_found', 'last_updated'],
          },
          confidence:             { type: Type.STRING },
          disclaimer:             { type: Type.STRING },
          clarifying_questions:   { type: Type.ARRAY, items: { type: Type.STRING } },
          next_ctas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label:       { type: Type.STRING },
                target_view: {
                  type: Type.STRING,
                  enum: [
                    'schedule',
                    'journal',
                    'journal_draft',
                    'clients',
                    'finances',
                    'settings',
                    'export',
                    'checklist',
                    'generate_checklist',
                  ],
                },
              },
              required: ['label', 'target_view'],
            },
          },
        },
        required: ['summary', 'action', 'details', 'risk_level', 'source', 'confidence', 'disclaimer', 'clarifying_questions', 'next_ctas'],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error('Guardian: failed to parse Gemini response', e);
    throw new Error('Invalid response format from AI');
  }
}
