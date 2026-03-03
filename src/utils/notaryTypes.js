/**
 * notaryTypes.js — Single Source of Truth for Service Types
 *
 * This module defines the canonical lists and mappings for notary service types
 * used across Schedule, Appointments, Journal, and Invoices.
 *
 * Per user request: "Act Type" in the Journal has been renamed to "Service Type"
 * to match the Schedule/Appointment form terminology.
 */

// ─── CANONICAL TYPES (Schedule, Journal, Invoices) ───────────────────────────
// These are the canonical names used across the entire application.
export const CANONICAL_TYPES = [
  'Loan Signing',
  'General Notary Work (GNW)',
  'Jurat',
  'Acknowledgment',
  'Oath / Affirmation',
  'I-9 Verification',
  'Apostille',
  'Copy Certification',
  'Power of Attorney',
  'Signature Witnessing',
  'Deed of Trust',
  'Remote Online Notary (RON)',
  'Other',
];

// Exported as SERVICE_TYPES for clarity
export const SERVICE_TYPES = [...CANONICAL_TYPES];

// Exported as ACT_TYPES for backward compatibility with existing code
export const ACT_TYPES = [...CANONICAL_TYPES];

// ─── FUZZY FALLBACK MAPPING ──────────────────────────────────────────────────
// For free-text or smart-parsed service types that don't exactly match canonical names.
const FUZZY_FALLBACK_MAP = {
  'loan signing':               'Loan Signing',
  'loan':                       'Loan Signing',
  'general notary work (gnw)':  'General Notary Work (GNW)',
  'general notary':             'General Notary Work (GNW)',
  'gnw':                        'General Notary Work (GNW)',
  'jurat':                      'Jurat',
  'acknowledgment':             'Acknowledgment',
  'oath / affirmation':         'Oath / Affirmation',
  'oath/affirmation':           'Oath / Affirmation',
  'oath':                       'Oath / Affirmation',
  'affirmation':                'Oath / Affirmation',
  'i-9 verification':           'I-9 Verification',
  'i-9':                        'I-9 Verification',
  'i9':                         'I-9 Verification',
  'i9 verification':            'I-9 Verification',
  'apostille':                  'Apostille',
  'copy certification':         'Copy Certification',
  'copy cert':                  'Copy Certification',
  'power of attorney':          'Power of Attorney',
  'poa':                        'Power of Attorney',
  'signature witnessing':       'Signature Witnessing',
  'signature witness':          'Signature Witnessing',
  'deed of trust':              'Deed of Trust',
  'deed':                       'Deed of Trust',
  'remote online notary (ron)': 'Remote Online Notary (RON)',
  'remote online notary':       'Remote Online Notary (RON)',
  'ron':                        'Remote Online Notary (RON)',
  'remote':                     'Remote Online Notary (RON)',
  'electronic':                 'Remote Online Notary (RON)',
  'other':                      'Other',
};

/**
 * Normalize a type to its canonical form.
 * Handles exact matches, case-insensitive matches, and fuzzy fallbacks.
 */
export function normalizeServiceType(type = '') {
  const raw = String(type || '').trim();
  if (!raw) return 'General Notary Work (GNW)';

  // Exact match (case-insensitive)
  const exactMatch = CANONICAL_TYPES.find((s) => s.toLowerCase() === raw.toLowerCase());
  if (exactMatch) return exactMatch;

  // Fuzzy fallback
  const lowerRaw = raw.toLowerCase();
  if (FUZZY_FALLBACK_MAP[lowerRaw]) return FUZZY_FALLBACK_MAP[lowerRaw];

  // Regex-based fallback for very loose input
  if (/loan/i.test(raw)) return 'Loan Signing';
  if (/jurat/i.test(raw)) return 'Jurat';
  if (/acknowledg/i.test(raw)) return 'Acknowledgment';
  if (/oath|affirm/i.test(raw)) return 'Oath / Affirmation';
  if (/i-?9/i.test(raw)) return 'I-9 Verification';
  if (/apostille/i.test(raw)) return 'Apostille';
  if (/copy cert/i.test(raw)) return 'Copy Certification';
  if (/power of attorney|poa/i.test(raw)) return 'Power of Attorney';
  if (/signature wit/i.test(raw)) return 'Signature Witnessing';
  if (/deed/i.test(raw)) return 'Deed of Trust';
  if (/remote|ron|electronic/i.test(raw)) return 'Remote Online Notary (RON)';
  if (/gnw|general notary/i.test(raw)) return 'General Notary Work (GNW)';

  // Default fallback
  return 'General Notary Work (GNW)';
}

/**
 * Convert a service type to its corresponding journal entry type.
 * Per user request: This is an exact 1:1 match.
 */
export function serviceTypeToActType(serviceType = '') {
  return normalizeServiceType(serviceType);
}

export function isValidServiceType(type = '') {
  return CANONICAL_TYPES.includes(type);
}

export function isValidActType(type = '') {
  return CANONICAL_TYPES.includes(type);
}

export function getServiceTypes() {
  return [...CANONICAL_TYPES];
}

export function getActTypes() {
  return [...CANONICAL_TYPES];
}

export function getServiceTypeMapping() {
  return CANONICAL_TYPES.map((label) => ({
    label,
    actType: label,
  }));
}
