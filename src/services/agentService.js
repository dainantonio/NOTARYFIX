// src/services/agentService.js
// Phase 2 Step 1 — Gemini-powered AI drafting for the Post-Appointment Closeout Agent
// Generates real journal narratives, document descriptions, and invoice notes

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function getApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

/**
 * Call Gemini API with a prompt. Returns the text response or null on failure.
 */
async function callGemini(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[agentService] VITE_GEMINI_API_KEY not set — skipping AI draft.');
    return null;
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 512,
          topP: 0.8,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[agentService] Gemini API error:', err);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  } catch (err) {
    console.error('[agentService] Gemini call failed:', err);
    return null;
  }
}

/**
 * Generate AI-enriched content for a closeout agent draft.
 *
 * @param {Object} appointment - The appointment object
 * @param {string} stateCode - Two-letter state code (e.g., 'OH', 'CA')
 * @param {Object} stateRules - Rules from useComplianceChecker
 * @returns {Object} { journalNotes, documentDescription, invoiceNotes, aiConfidenceBoost, aiGenerated }
 */
export async function generateCloseoutDraft(appointment, stateCode = 'WA', stateRules = null) {
  const client = appointment?.client || 'the signer';
  const apptType = appointment?.type || 'notary appointment';
  const apptDate = appointment?.date || new Date().toLocaleDateString();
  const apptTime = appointment?.time || '';
  const apptAddress = appointment?.address || appointment?.location || '';
  const apptNotes = appointment?.notes || '';
  const fee = appointment?.amount ? `$${appointment.amount}` : 'fee per schedule';

  // Build state-specific compliance context
  const stateContext = stateRules
    ? `This notarization was performed in ${stateRules.name} (${stateCode}). ${stateRules.notes || ''}`
    : `State: ${stateCode}.`;

  const prompt = `You are a professional notary journal assistant. Generate concise, professional journal entry notes for the following appointment. Be factual and compliance-focused. Use first-person notary voice.

Appointment details:
- Client/Signer: ${client}
- Service type: ${apptType}
- Date: ${apptDate}${apptTime ? `, Time: ${apptTime}` : ''}
- Location: ${apptAddress || 'client-specified location'}
- Fee: ${fee}
- Additional notes: ${apptNotes || 'none'}
- State compliance: ${stateContext}

Output a JSON object with exactly these keys (no extra text, just JSON):
{
  "journalNotes": "2-3 sentence professional journal notes describing the notarization performed, signer appeared, acts performed, and any relevant observations. Do not include name or fee (those are separate fields).",
  "documentDescription": "Brief description of the document type notarized based on the service type. 5-10 words.",
  "invoiceNotes": "One professional sentence for the invoice describing services rendered.",
  "documentType": "The most likely notary act type: Acknowledgment, Jurat, Oath, Copy Certification, or Signature Witnessing"
}`;

  const raw = await callGemini(prompt);

  if (!raw) {
    // Fallback: generate reasonable defaults without AI
    return {
      journalNotes: `Signer appeared in person and presented valid government-issued identification. Notarization performed for ${apptType} on ${apptDate}.${apptNotes ? ` Notes: ${apptNotes}` : ''}`,
      documentDescription: apptType || 'Notary appointment',
      invoiceNotes: `Notary services rendered for ${apptType} on ${apptDate}.`,
      documentType: /jurat/i.test(apptType) ? 'Jurat' : 'Acknowledgment',
      aiGenerated: false,
      aiConfidenceBoost: 0,
    };
  }

  // Parse JSON from AI response
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      journalNotes: parsed.journalNotes || '',
      documentDescription: parsed.documentDescription || apptType,
      invoiceNotes: parsed.invoiceNotes || `Notary services for ${apptType}.`,
      documentType: parsed.documentType || 'Acknowledgment',
      aiGenerated: true,
      aiConfidenceBoost: 10, // AI-generated content bumps confidence score by 10 points
    };
  } catch (parseErr) {
    console.warn('[agentService] JSON parse failed — using raw text as notes:', parseErr);
    return {
      journalNotes: raw.slice(0, 300),
      documentDescription: apptType,
      invoiceNotes: `Notary services rendered for ${apptType} on ${apptDate}.`,
      documentType: /jurat/i.test(apptType) ? 'Jurat' : 'Acknowledgment',
      aiGenerated: true,
      aiConfidenceBoost: 5,
    };
  }
}

/**
 * Generate a compliance check summary narrative for the suggestion card.
 * Used to explain to the notary what still needs to be filled in and why.
 */
export async function generateComplianceSummary(missingFields = [], stateCode = 'WA', stateName = '') {
  if (missingFields.length === 0) return null;

  const fieldList = missingFields.map((f) => f.field || f).join(', ');

  const prompt = `You are a notary compliance assistant. Write a single short, friendly sentence (max 25 words) telling a notary they need to fill in these missing fields before the journal entry is complete in ${stateName || stateCode}: ${fieldList}. Be specific and helpful.`;

  return await callGemini(prompt);
}


/**
 * Parse raw lead text (SMS, email, voicemail) into structured lead data.
 */
export async function parseLeadText(rawText) {
  const prompt = `You are a notary business assistant. Parse the following raw text (could be an SMS, email, or voicemail transcript) about a potential notary appointment request. Extract structured data.

Raw text:
"${rawText.slice(0, 1000)}"

Output ONLY a JSON object with these keys (use null for anything not found):
{
  "clientName": "full name or null",
  "phone": "phone number or null",
  "email": "email address or null",
  "serviceType": "most likely notary service type (Loan Signing, Acknowledgment, Jurat, I-9, Power of Attorney, etc.) or null",
  "suggestedDate": "ISO date string YYYY-MM-DD or null",
  "suggestedTime": "time string like '2:00 PM' or null",
  "location": "address or city/zip or null",
  "estimatedFee": number or null,
  "notes": "any other relevant details as a short string or null",
  "confidence": number between 50 and 95 representing how confident you are in the parse
}`;

  const raw = await callGemini(prompt);

  // Fallback: simple regex heuristics
  const fallback = () => {
    const phoneMatch = rawText.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const dollarMatch = rawText.match(/\$(\d+)/);
    const dateMatch = rawText.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
    const nameMatch = rawText.match(/(?:from|for|hi,?\s+i(?:'m| am)?|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    return {
      clientName: nameMatch?.[1] || null,
      phone: phoneMatch?.[0] || null,
      email: emailMatch?.[0] || null,
      serviceType: /loan/i.test(rawText) ? 'Loan Signing'
        : /i-?9/i.test(rawText) ? 'I-9 Verification'
        : /power of attorney|poa/i.test(rawText) ? 'Power of Attorney'
        : /jurat/i.test(rawText) ? 'Jurat'
        : 'Notary Appointment',
      suggestedDate: dateMatch ? `${dateMatch[3]?.length === 2 ? '20' + dateMatch[3] : dateMatch[3]}-${String(dateMatch[1]).padStart(2,'0')}-${String(dateMatch[2]).padStart(2,'0')}` : null,
      suggestedTime: null,
      location: null,
      estimatedFee: dollarMatch ? parseInt(dollarMatch[1]) : null,
      notes: rawText.slice(0, 200),
      confidence: 55,
    };
  };

  if (!raw) return fallback();

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback();
  }
}

export default { generateCloseoutDraft, generateComplianceSummary, parseLeadText };
