/**
 * Guardian Compliance Service — v2
 * Uses notary_primary_sources_v2.json (schema v2.0.0).
 *
 * Key upgrade: injects only the queried state's jurisdiction record + its
 * source registry entries — not all 51 states. This cuts prompt tokens by ~96%
 * while providing richer structured evidence (fees, ID policy, RON, journal,
 * seal, evidence citations).
 *
 * Env var required: VITE_GEMINI_API_KEY (Vercel → Settings → Environment Variables)
 */

import { GoogleGenAI, Type } from '@google/genai';
import dataset from '../data/notary_primary_sources_v2.json';

// ─── State context builder ─────────────────────────────────────────────────

/**
 * Extract the relevant state slice + its source registry entries.
 * Returns a compact JSON string for the system prompt.
 */
function buildStateContext(stateCode) {
  const code = stateCode?.toUpperCase();
  const jurisdiction = dataset.jurisdictions?.[code];
  if (!jurisdiction) {
    return `No data found in dataset for state code: ${code ?? 'unknown'}`;
  }

  // Pull only the sources referenced by this jurisdiction
  const relevantSources = {};
  for (const srcId of (jurisdiction.sources || [])) {
    if (dataset.sources_registry?.[srcId]) {
      relevantSources[srcId] = dataset.sources_registry[srcId];
    }
  }
  // Also pull any source_ids referenced in evidence
  for (const ev of (jurisdiction.evidence || [])) {
    const sid = ev.source_id;
    if (sid && dataset.sources_registry?.[sid] && !relevantSources[sid]) {
      relevantSources[sid] = dataset.sources_registry[sid];
    }
  }

  return JSON.stringify({ jurisdiction, sources: relevantSources }, null, 2);
}

// ─── System prompt ─────────────────────────────────────────────────────────

function buildSystemInstruction(stateCode) {
  const stateCtx = buildStateContext(stateCode);

  return `
You are Guardian, a Notary Compliance Assistant for NotaryFix.

HARD RULES:
1. Answer ONLY using the STATE DATA provided below.
2. If the dataset does not address the question, say: "Not found in provided primary sources."
3. NEVER use general knowledge. NEVER guess. NEVER hallucinate.
4. Your source citations MUST reference real source_ids from the sources registry below.
5. Always return the structured JSON response — no markdown fences.

---

STATE DATA (schema v2.0.0 — ${stateCode?.toUpperCase() ?? 'Unknown State'}):
${stateCtx}

---

DATASET SCHEMA GUIDE:
- jurisdiction.rules.fees.acknowledgment / .jurat → fee amount, unit, cap, policy
- jurisdiction.rules.identification.standard → acceptable ID types
- jurisdiction.rules.identification.expired_id_policy → whether expired IDs allowed
- jurisdiction.rules.identification.credible_witnesses → credible witness rules
- jurisdiction.rules.journal_requirement → journal mandate and retention
- jurisdiction.rules.seal_requirement → seal/stamp requirements
- jurisdiction.rules.ron_status → { status, notes } for remote online notarization
- jurisdiction.evidence → field_path + snippet + source_id + location for each rule
- jurisdiction.rules.revised_code → primary statute citation
- jurisdiction.rules.handbook_url → official state handbook (null if not available)
- sources → { source_id: { title, url, source_type, last_updated, retrieved_at } }

---

JSON OUTPUT MODE (MANDATORY)
Output ONLY valid JSON matching this schema exactly:
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
- details: array of 1–6 concise bullets.
- source: use the most specific source from the registry (prefer Statute > Handbook > SOS > VendorSummary).
- source.where_found: use evidence[].location if available (e.g. statute section "§ 8200").
- source.last_updated: use sources[source_id].last_updated if non-null, else "".
- clarifying_questions: [] if none needed.
- next_ctas: [] if none appropriate.
- risk_level defaults to MEDIUM when clarifying is required.
- confidence: "High" (direct statute match), "Partial" (indirect), "None" (not in dataset).

TONE: Calm · Professional · Reassuring · Clear · Non-judgmental · Senior-notary demeanor.
`;
}

// ─── Route map ────────────────────────────────────────────────────────────

export const GUARDIAN_ROUTE_MAP = {
  schedule:           '/schedule',
  journal:            '/journal',
  journal_draft:      '/journal',
  clients:            '/clients',
  finances:           '/invoices',
  settings:           '/settings',
  export:             '/invoices',
  checklist:          '/agent',
  generate_checklist: '/agent',
};

// ─── Main function ────────────────────────────────────────────────────────

/**
 * @param {string} message - The user's question
 * @param {{ state?: string, appointmentType?: string, phase: string, clientInfo?: string, journalStatus: string }} context
 * @returns {Promise<GuardianResponse>}
 */
export async function getGuardianResponse(message, context) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not set. Add it to Vercel → Settings → Environment Variables.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const contextStr = `
CURRENT NOTARY SESSION CONTEXT:
- State: ${context.state || 'Unknown'}
- Appointment Type: ${context.appointmentType || 'Unknown'}
- Phase: ${context.phase}
- Client Info: ${context.clientInfo || 'Unknown'}
- Journal Status: ${context.journalStatus}
`;

  const systemInstruction = buildSystemInstruction(context.state) + '\n\n' + contextStr;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ parts: [{ text: message }] }],
    config: {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary:    { type: Type.STRING },
          action:     { type: Type.STRING },
          details:    { type: Type.ARRAY, items: { type: Type.STRING } },
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
          confidence:           { type: Type.STRING },
          disclaimer:           { type: Type.STRING },
          clarifying_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
          next_ctas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label:       { type: Type.STRING },
                target_view: {
                  type: Type.STRING,
                  enum: [
                    'schedule', 'journal', 'journal_draft', 'clients',
                    'finances', 'settings', 'export', 'checklist', 'generate_checklist',
                  ],
                },
              },
              required: ['label', 'target_view'],
            },
          },
        },
        required: [
          'summary', 'action', 'details', 'risk_level', 'source',
          'confidence', 'disclaimer', 'clarifying_questions', 'next_ctas',
        ],
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
