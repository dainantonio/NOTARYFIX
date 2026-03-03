// src/services/agentService.js
// All Gemini calls route through /api/gemini (Vercel serverless function).
// The API key lives server-side only — never in the browser bundle.

/**
 * Call the /api/gemini proxy with a prompt.
 * Returns the text response or null on failure.
 */
async function callGemini(prompt, generationConfig = null) {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        ...(generationConfig ? { generationConfig } : {}),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[agentService] /api/gemini error:', err);
      return null;
    }

    const data = await response.json();
    return data.text ? data.text.trim() : null;
  } catch (err) {
    console.error('[agentService] callGemini failed:', err);
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
  const client      = appointment?.client   || 'the signer';
  const apptType    = appointment?.type     || 'notary appointment';
  const apptDate    = appointment?.date     || new Date().toLocaleDateString();
  const apptTime    = appointment?.time     || '';
  const apptAddress = appointment?.address  || appointment?.location || '';
  const apptNotes   = appointment?.notes    || '';
  const fee         = appointment?.amount   ? `$${appointment.amount}` : 'fee per schedule';

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
    return {
      journalNotes: `Signer appeared in person and presented valid government-issued identification. Notarization performed for ${apptType} on ${apptDate}.${apptNotes ? ` Notes: ${apptNotes}` : ''}`,
      documentDescription: apptType || 'Notary appointment',
      invoiceNotes: `Notary services rendered for ${apptType} on ${apptDate}.`,
      documentType: /jurat/i.test(apptType) ? 'Jurat' : 'Acknowledgment',
      aiGenerated: false,
      aiConfidenceBoost: 0,
    };
  }

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed  = JSON.parse(cleaned);
    return {
      journalNotes:        parsed.journalNotes        || '',
      documentDescription: parsed.documentDescription || apptType,
      invoiceNotes:        parsed.invoiceNotes        || `Notary services for ${apptType}.`,
      documentType:        parsed.documentType        || 'Acknowledgment',
      aiGenerated:         true,
      aiConfidenceBoost:   10,
    };
  } catch (parseErr) {
    console.warn('[agentService] JSON parse failed — using raw text as notes:', parseErr);
    return {
      journalNotes:        raw.slice(0, 300),
      documentDescription: apptType,
      invoiceNotes:        `Notary services rendered for ${apptType} on ${apptDate}.`,
      documentType:        /jurat/i.test(apptType) ? 'Jurat' : 'Acknowledgment',
      aiGenerated:         true,
      aiConfidenceBoost:   5,
    };
  }
}

/**
 * Generate a compliance check summary narrative for the suggestion card.
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
  "serviceType": "most likely notary service type — use one of: Loan Signing, General Notary Work (GNW), Jurat, Oath / Affirmation, I-9 Verification, Apostille, Copy Certification, Power of Attorney, Signature Witnessing, Deed of Trust, Remote Online Notary (RON), Other — or null if unclear",
  "suggestedDate": "ISO date string YYYY-MM-DD or null",
  "suggestedTime": "time string like '2:00 PM' or null",
  "location": "address or city/zip or null",
  "estimatedFee": number or null,
  "notes": "any other relevant details as a short string or null",
  "confidence": number between 50 and 95 representing how confident you are in the parse
}`;

  const raw = await callGemini(prompt);

  const fallback = () => {
    const phoneMatch  = rawText.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    const emailMatch  = rawText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const dollarMatch = rawText.match(/\$(\d+)/);
    const dateMatch   = rawText.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
    const nameMatch   = rawText.match(/(?:from|for|hi,?\s+i(?:'m| am)?|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    return {
      clientName:    nameMatch?.[1]  || null,
      phone:         phoneMatch?.[0] || null,
      email:         emailMatch?.[0] || null,
      serviceType:   /loan/i.test(rawText)              ? 'Loan Signing'
                   : /i-?9/i.test(rawText)              ? 'I-9 Verification'
                   : /apostille/i.test(rawText)         ? 'Apostille'
                   : /power of attorney|poa/i.test(rawText) ? 'Power of Attorney'
                   : /jurat/i.test(rawText)             ? 'Jurat'
                   : /oath|affirm/i.test(rawText)       ? 'Oath / Affirmation'
                   : /copy cert/i.test(rawText)         ? 'Copy Certification'
                   : /deed/i.test(rawText)              ? 'Deed of Trust'
                   : /remote|ron/i.test(rawText)        ? 'Remote Online Notary (RON)'
                   : 'General Notary Work (GNW)',
      suggestedDate: dateMatch
        ? `${dateMatch[3]?.length === 2 ? '20' + dateMatch[3] : dateMatch[3]}-${String(dateMatch[1]).padStart(2,'0')}-${String(dateMatch[2]).padStart(2,'0')}`
        : null,
      suggestedTime: null,
      location:      null,
      estimatedFee:  dollarMatch ? parseInt(dollarMatch[1]) : null,
      notes:         rawText.slice(0, 200),
      confidence:    55,
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

/**
 * Generate an AI weekly summary narrative for the notary business.
 */
export async function generateWeeklySummary(stats, notaryName = 'Notary') {
  const prompt = `You are a business assistant for ${notaryName}, a mobile notary public.
Write a concise, encouraging 2-3 sentence weekly summary based on these stats:
- Appointments completed: ${stats.appointmentsCompleted}
- Invoices created: ${stats.invoicesCreated}
- Total revenue: $${stats.totalRevenue?.toFixed(2) || '0.00'}
- Payment reminders sent: ${stats.remindersSent}
- Compliance warnings flagged: ${stats.complianceWarnings}
- Pending agent suggestions: ${stats.pendingSuggestions}

Be specific, professional but warm. Highlight wins and any action needed.`;

  const text = await callGemini(prompt, { temperature: 0.5, maxOutputTokens: 256, topP: 0.9 });
  return text || `This week: ${stats.appointmentsCompleted} appointments completed, $${stats.totalRevenue?.toFixed(2) || '0.00'} revenue, ${stats.remindersSent} reminders sent.`;
}

export default { generateCloseoutDraft, generateComplianceSummary, parseLeadText, generateWeeklySummary };
