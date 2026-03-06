/**
 * Job Intelligence Service
 * Parses incoming communications for job opportunities,
 * evaluates profitability, and generates recommendations.
 * Pure JS — no external dependencies.
 */

// ─── MARKET BENCHMARKS ────────────────────────────────────────────────────────
// Per job type: { low, avg, high } in USD, plus estimated print pages
export const MARKET_BENCHMARKS = {
  loan_signing:       { low: 100, avg: 150, high: 200, printPages: 75,  label: 'Loan Signing'          },
  refi:               { low: 100, avg: 150, high: 200, printPages: 75,  label: 'Refinance'             },
  deed:               { low:  50, avg: 100, high: 150, printPages: 10,  label: 'Deed / Title'          },
  purchase:           { low: 125, avg: 165, high: 225, printPages: 90,  label: 'Purchase Closing'      },
  heloc:              { low:  90, avg: 130, high: 175, printPages: 60,  label: 'HELOC'                 },
  affidavit:          { low:  25, avg:  40, high:  75, printPages:  5,  label: 'Affidavit'             },
  power_of_attorney:  { low:  50, avg:  75, high: 120, printPages:  8,  label: 'Power of Attorney'    },
  i9:                 { low:  50, avg:  65, high:  85, printPages:  3,  label: 'I-9 Verification'     },
  general:            { low:  25, avg:  50, high:  75, printPages:  5,  label: 'General Notarial'     },
  ron:                { low:  75, avg: 110, high: 175, printPages:  0,  label: 'RON (Remote Online)'  },
  hybrid:             { low:  90, avg: 130, high: 180, printPages: 30,  label: 'Hybrid Signing'       },
  will:               { low:  75, avg: 100, high: 150, printPages: 10,  label: 'Will / Trust'         },
  unknown:            { low:  50, avg:  85, high: 150, printPages: 20,  label: 'General Signing'      },
};

// IRS standard mileage rate 2025
const IRS_MILEAGE_RATE = 0.67;
const COST_PER_PAGE    = 0.12;  // print cost
const AVG_SPEED_MPH    = 28;    // suburban average for travel time estimate

// ─── KEYWORDS → JOB TYPE ──────────────────────────────────────────────────────
const JOB_TYPE_PATTERNS = [
  { type: 'loan_signing',      keywords: ['loan signing', 'lender', 'closing package', 'mortgage closing']              },
  { type: 'refi',              keywords: ['refi', 'refinanc', 'cash-out', 'cash out refi']                               },
  { type: 'purchase',          keywords: ['purchase', 'purchase closing', 'buy closing', 'real estate closing']          },
  { type: 'heloc',             keywords: ['heloc', 'home equity', 'line of credit']                                      },
  { type: 'deed',              keywords: ['deed', 'grant deed', 'quitclaim', 'title transfer', 'deed of trust']          },
  { type: 'power_of_attorney', keywords: ['power of attorney', 'poa']                                                   },
  { type: 'i9',                keywords: ['i-9', 'i9', 'employment verification', 'form i-9']                           },
  { type: 'will',              keywords: ['will', 'trust', 'estate', 'living will', 'testamentary']                     },
  { type: 'ron',               keywords: ['ron', 'remote online', 'remote notarization', 'virtual signing']             },
  { type: 'hybrid',            keywords: ['hybrid', 'hybrid signing', 'hybrid closing']                                 },
  { type: 'affidavit',         keywords: ['affidavit', 'sworn statement', 'declaration']                                },
];

// ─── DOCUMENT TYPE EXTRACTION ─────────────────────────────────────────────────
const DOC_TYPE_PATTERNS = [
  { type: 'Refinance Package',         keywords: ['refi', 'refinanc'] },
  { type: 'Loan Closing Package',      keywords: ['loan', 'mortgage', 'closing'] },
  { type: 'Purchase Package',          keywords: ['purchase'] },
  { type: 'HELOC Documents',           keywords: ['heloc', 'home equity'] },
  { type: 'Deed',                      keywords: ['deed', 'quitclaim', 'grant deed'] },
  { type: 'Power of Attorney',         keywords: ['power of attorney', 'poa'] },
  { type: 'I-9 Form',                  keywords: ['i-9', 'i9'] },
  { type: 'Will / Trust Documents',    keywords: ['will', 'trust', 'estate'] },
  { type: 'Affidavit',                 keywords: ['affidavit', 'sworn'] },
  { type: 'RON Signing',               keywords: ['ron', 'remote'] },
];

// ─── TIME PARSING ─────────────────────────────────────────────────────────────
const TIME_PATTERNS = [
  /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i,
  /\b(\d{1,2})\s*(am|pm)\b/i,
  /\b(noon|midnight|morning|afternoon|evening)\b/i,
];

const DATE_PATTERNS = [
  { pattern: /\b(today)\b/i,                 resolve: () => 'Today'     },
  { pattern: /\b(tomorrow|tmrw|tom)\b/i,     resolve: () => 'Tomorrow'  },
  { pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, resolve: (m) => m[1] },
  { pattern: /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/, resolve: (m) => `${m[1]}/${m[2]}${m[3] ? '/'+m[3] : ''}` },
  { pattern: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?\b/i, resolve: (m) => `${m[1]} ${m[2]}${m[3] ? ', '+m[3] : ''}` },
  { pattern: /\b(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i, resolve: (m) => m[1] },
];

// ─── PARSE JOB MESSAGE ────────────────────────────────────────────────────────
/**
 * Analyzes raw text and extracts structured job fields.
 * Returns null if no job opportunity is detected.
 */
export function parseJobMessage(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 10) return null;
  const lower = text.toLowerCase();

  // Must contain at least one job signal
  const jobSignals = [
    'signing', 'notarize', 'notary needed', 'closing', 'appt', 'appointment',
    'job', 'refi', 'loan', 'deed', 'affidavit', 'poa', 'i-9', 'ron',
    'will', 'trust', 'heloc', 'hybrid',
  ];
  const hasJobSignal = jobSignals.some(sig => lower.includes(sig));
  if (!hasJobSignal) return null;

  // ── Job type ──────────────────────────────────────────────────────────────
  let job_type = 'unknown';
  for (const { type, keywords } of JOB_TYPE_PATTERNS) {
    if (keywords.some(kw => lower.includes(kw))) { job_type = type; break; }
  }

  // ── Document type ─────────────────────────────────────────────────────────
  let document_type = null;
  for (const { type, keywords } of DOC_TYPE_PATTERNS) {
    if (keywords.some(kw => lower.includes(kw))) { document_type = type; break; }
  }
  if (!document_type) document_type = MARKET_BENCHMARKS[job_type]?.label || 'General Signing';

  // ── Fee extraction ────────────────────────────────────────────────────────
  let offered_fee = null;
  const feePatterns = [
    /\$\s*(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)\s*(?:dollar|bucks|USD)/i,
    /pay(?:ing|s|ment)?\s+(?:of\s+)?\$?\s*(\d+)/i,
    /fee(?:\s+of)?\s+\$?\s*(\d+)/i,
    /offer(?:ing|ed)?\s+\$?\s*(\d+)/i,
  ];
  for (const pat of feePatterns) {
    const m = text.match(pat);
    if (m) { offered_fee = parseFloat(m[1]); break; }
  }

  // ── Date extraction ───────────────────────────────────────────────────────
  let date = null;
  for (const { pattern, resolve } of DATE_PATTERNS) {
    const m = text.match(pattern);
    if (m) { date = resolve(m); break; }
  }

  // ── Time extraction ───────────────────────────────────────────────────────
  let time = null;
  for (const pat of TIME_PATTERNS) {
    const m = text.match(pat);
    if (m) {
      if (/noon|midnight|morning|afternoon|evening/i.test(m[0])) {
        time = m[0];
      } else {
        const h = parseInt(m[1]);
        const min = m[2] ? `:${m[2]}` : ':00';
        const period = m[3] || m[2] || '';
        time = `${h}${min} ${period.toUpperCase()}`.trim();
      }
      break;
    }
  }

  // ── Location extraction ───────────────────────────────────────────────────
  let location = null;
  // City, ST pattern
  const locationPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/,
    /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /\bat\s+(\d+\s+[A-Z][a-z]+(?:\s+[A-Za-z]+)*)/,
    /\b(\d{5})\b/, // zip code
  ];
  for (const pat of locationPatterns) {
    const m = text.match(pat);
    if (m) { location = m[0].trim(); break; }
  }

  // ── Contact extraction ────────────────────────────────────────────────────
  let contact = null;
  const emailMatch = text.match(/\b[\w.+-]+@[\w-]+\.\w+\b/);
  const phoneMatch = text.match(/\b(?:\+1\s?)?(?:\(?\d{3}\)?[\s.\-]?)?\d{3}[\s.\-]?\d{4}\b/);
  const nameMatch  = text.match(/(?:from|by|contact)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (emailMatch) contact = emailMatch[0];
  else if (phoneMatch) contact = phoneMatch[0];
  else if (nameMatch) contact = nameMatch[1];

  // ── Distance hint ─────────────────────────────────────────────────────────
  let distance_miles = null;
  const distMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:miles?|mi\.?)\s+(?:away|from|drive)/i);
  if (distMatch) distance_miles = parseFloat(distMatch[1]);

  return {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    raw_message: text,
    job_type,
    document_type,
    offered_fee,
    date,
    time,
    location,
    contact,
    distance_miles,
    parsed_at: new Date().toISOString(),
    status: 'detected',
    lifecycle_stage: 'request_detected',
  };
}

// ─── PROFITABILITY ANALYSIS ───────────────────────────────────────────────────
/**
 * Evaluates a parsed job's profitability.
 * userSettings: { costPerMile, feeSchedule, minAcceptableFee, travelRadiusMiles }
 */
export function evaluateProfitability(job, userSettings = {}) {
  const {
    costPerMile         = IRS_MILEAGE_RATE,
    minAcceptableFee    = 75,
    travelRadiusMiles   = 40,
  } = userSettings;

  const benchmark = MARKET_BENCHMARKS[job.job_type] || MARKET_BENCHMARKS.unknown;

  // Distance
  const distance = job.distance_miles || null;
  const estimatedMiles = distance || 20; // fallback: assume 20 miles
  const roundTripMiles = estimatedMiles * 2;

  // Costs
  const travel_cost    = Math.round(roundTripMiles * costPerMile * 100) / 100;
  const print_cost     = Math.round(benchmark.printPages * COST_PER_PAGE * 100) / 100;
  const total_cost     = Math.round((travel_cost + print_cost) * 100) / 100;
  const travel_minutes = Math.round((estimatedMiles / AVG_SPEED_MPH) * 60);

  // Fee analysis
  const offered = job.offered_fee || null;
  const market_avg = benchmark.avg;
  const profit = offered !== null ? Math.round((offered - total_cost) * 100) / 100 : null;
  const market_profit = Math.round((market_avg - total_cost) * 100) / 100;

  // Recommendation logic
  let recommendation = 'evaluate';
  let recommendation_label = 'Evaluate';
  let counter_offer = null;
  let reasoning = [];

  if (offered !== null) {
    const diff_from_market = offered - market_avg;
    const diff_pct = Math.round((diff_from_market / market_avg) * 100);

    if (offered < minAcceptableFee) {
      recommendation = 'decline';
      recommendation_label = 'Decline';
      reasoning.push(`Offered fee $${offered} is below your minimum acceptable fee of $${minAcceptableFee}.`);
    } else if (offered < total_cost * 1.5) {
      recommendation = 'counter';
      recommendation_label = 'Counter Offer';
      counter_offer = benchmark.avg;
      reasoning.push(`After $${total_cost} in costs, net profit is only $${profit}.`);
      reasoning.push(`Market average for this job type is $${market_avg}.`);
    } else if (diff_from_market < -20) {
      recommendation = 'counter';
      recommendation_label = 'Counter Offer';
      counter_offer = Math.round(market_avg * 0.95); // slightly below market
      reasoning.push(`Offered fee is ${Math.abs(diff_pct)}% below market average of $${market_avg}.`);
    } else if (offered >= market_avg) {
      recommendation = 'accept';
      recommendation_label = 'Accept';
      reasoning.push(`Fee meets or exceeds market rate. Estimated profit: $${profit}.`);
    } else {
      recommendation = 'accept';
      recommendation_label = 'Accept';
      reasoning.push(`Fee within acceptable range. Estimated profit: $${profit}.`);
    }

    if (distance !== null && distance > travelRadiusMiles) {
      recommendation = 'counter';
      recommendation_label = 'Counter Offer';
      counter_offer = counter_offer || Math.round(offered + (distance - travelRadiusMiles) * 2);
      reasoning.push(`Job is ${distance} miles away — outside your ${travelRadiusMiles}-mile radius. Consider a travel surcharge.`);
    }
  } else {
    recommendation = 'request_info';
    recommendation_label = 'Request More Information';
    reasoning.push('No fee was specified in the message. Request fee confirmation before evaluating.');
  }

  return {
    job_id: job.id,
    benchmark,
    distance_miles: distance,
    estimated_miles: estimatedMiles,
    round_trip_miles: roundTripMiles,
    travel_minutes,
    travel_cost,
    print_cost,
    total_cost,
    offered_fee: offered,
    market_avg,
    profit,
    market_profit,
    recommendation,
    recommendation_label,
    counter_offer,
    reasoning,
    evaluated_at: new Date().toISOString(),
  };
}

// ─── NEGOTIATION SCRIPT ───────────────────────────────────────────────────────
export function generateNegotiationScript(job, evaluation) {
  const { counter_offer, market_avg, offered_fee, recommendation } = evaluation;
  const docType = job.document_type || 'signing';
  const target = counter_offer || market_avg;

  if (recommendation === 'accept') {
    return `Hi,\n\nThank you for reaching out! I'd be happy to handle the ${docType} on ${job.date || 'the scheduled date'}${job.time ? ' at ' + job.time : ''}${job.location ? ' in ' + job.location : ''}.\n\nI can confirm availability at the offered fee of $${offered_fee}. Please send the package details and I'll get everything prepared.\n\nLooking forward to working with you.\n\nBest regards`;
  }

  if (recommendation === 'counter') {
    return `Hi,\n\nThank you for thinking of me for the ${docType}${job.date ? ' on ' + job.date : ''}${job.location ? ' in ' + job.location : ''}.\n\nI'd love to accept this assignment. To make it work given travel distance and document preparation, I'd need to bring the fee up to $${target}. This is right in line with the current market rate for this signing type in your area.\n\nPlease let me know if that works — I can confirm immediately.\n\nBest regards`;
  }

  if (recommendation === 'decline') {
    return `Hi,\n\nThank you for reaching out about the ${docType}. Unfortunately, at the offered fee of $${offered_fee}, I'm unable to take the assignment given my current schedule and operating costs.\n\nIf you have flexibility on the fee or future signings, I'd love to be your go-to notary in the area.\n\nBest regards`;
  }

  return `Hi,\n\nThank you for the signing opportunity. Could you provide additional details — specifically the fee, the signing package type, and the exact location? With that information I can confirm availability quickly.\n\nLooking forward to hearing from you.\n\nBest regards`;
}

// ─── LIFECYCLE STAGES ─────────────────────────────────────────────────────────
export const JOB_LIFECYCLE_STAGES = [
  { id: 'request_detected',    label: 'Request Detected',   icon: '📩', color: 'text-slate-400'   },
  { id: 'negotiation',         label: 'Negotiation',        icon: '💬', color: 'text-amber-400'   },
  { id: 'accepted',            label: 'Accepted',           icon: '✅', color: 'text-emerald-400' },
  { id: 'documents_received',  label: 'Documents Received', icon: '📄', color: 'text-blue-400'    },
  { id: 'scheduled',           label: 'Appointment Scheduled', icon: '📅', color: 'text-cyan-400' },
  { id: 'completed',           label: 'Completed',          icon: '🏁', color: 'text-violet-400'  },
  { id: 'invoice_sent',        label: 'Invoice Sent',       icon: '🧾', color: 'text-indigo-400'  },
  { id: 'payment_received',    label: 'Payment Received',   icon: '💰', color: 'text-emerald-500' },
];

export function getLifecycleIndex(stage) {
  return JOB_LIFECYCLE_STAGES.findIndex(s => s.id === stage);
}

// ─── SOURCE CLASSIFICATION ────────────────────────────────────────────────────
export const MESSAGE_SOURCES = [
  { id: 'email',    label: 'Email',             icon: '📧' },
  { id: 'sms',      label: 'SMS / Text',         icon: '💬' },
  { id: 'platform', label: 'Signing Platform',   icon: '🏢' },
  { id: 'voicemail',label: 'Voicemail',          icon: '📞' },
  { id: 'manual',   label: 'Manual Entry',       icon: '✏️' },
];

// ─── EXPENSE CATEGORIES FOR TAX TRACKING ─────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  { id: 'mileage',   label: 'Mileage',           icon: '🚗' },
  { id: 'printing',  label: 'Printing',          icon: '🖨️' },
  { id: 'supplies',  label: 'Supplies',          icon: '📎' },
  { id: 'platform',  label: 'Platform Fee',      icon: '💼' },
  { id: 'other',     label: 'Other',             icon: '📋' },
];
