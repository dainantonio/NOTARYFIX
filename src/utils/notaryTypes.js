/**
 * notaryTypes.js — Single Source of Truth for Service Types and Act Types
 *
 * This module defines the canonical lists and mappings for notary service types
 * (used in Schedule/Appointments) and journal act types (used in Journal entries).
 *
 * All components, slices, and utilities MUST use these exports to ensure consistency
 * across the application and prevent translation errors.
 *
 * NEVER duplicate these mappings elsewhere in the codebase.
 */

// ─── CANONICAL SERVICE TYPES (Schedule / Appointments) ────────────────────────
// These are the business-level service names shown to the user in the Schedule.
export const SERVICE_TYPES = [
  'Loan Signing',
  'General Notary Work (GNW)',
  'Jurat',
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

// ─── CANONICAL ACT TYPES (Journal) ────────────────────────────────────────────
// These are the legal notarial act types recorded in the Journal.
export const ACT_TYPES = [
  'Acknowledgment',
  'Jurat',
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

// ─── CANONICAL SERVICE → ACT TYPE MAPPING ────────────────────────────────────
// This is the single source of truth for translating between service types
// (what the user selects in Schedule) and act types (what gets recorded in Journal).
//
// Key principle: Each service type maps to exactly one act type.
// Multiple service types CAN map to the same act type (e.g., Loan Signing and GNW both → Acknowledgment).
export const SERVICE_TYPE_TO_ACT_TYPE_MAP = {
  'Loan Signing':               'Acknowledgment',
  'General Notary Work (GNW)':  'Acknowledgment',
  'Jurat':                      'Jurat',
  'Oath / Affirmation':         'Oath / Affirmation',
  'I-9 Verification':           'I-9 Verification',
  'Apostille':                  'Apostille',
  'Copy Certification':         'Copy Certification',
  'Power of Attorney':          'Power of Attorney',
  'Signature Witnessing':       'Signature Witnessing',
  'Deed of Trust':              'Deed of Trust',
  'Remote Online Notary (RON)': 'Remote Online Notary (RON)',
  'Other':                      'Other',
};

// ─── FUZZY FALLBACK MAPPING ──────────────────────────────────────────────────
// For free-text or smart-parsed service types that don't exactly match canonical names.
// Used when a user enters something like "loan" or "i-9" in smart calendar input.
const FUZZY_FALLBACK_MAP = {
  'loan signing':               'Acknowledgment',
  'loan':                       'Acknowledgment',
  'general notary work (gnw)':  'Acknowledgment',
  'general notary':             'Acknowledgment',
  'gnw':                        'Acknowledgment',
  'jurat':                      'Jurat',
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
 * Normalize a service type to its canonical form.
 * Handles exact matches, case-insensitive matches, and fuzzy fallbacks.
 *
 * @param {string} serviceType - The service type to normalize (e.g., "Loan Signing", "loan", "LOAN SIGNING")
 * @returns {string} - The canonical service type, or 'General Notary Work (GNW)' if no match
 *
 * @example
 * normalizeServiceType('Loan Signing')  // → 'Loan Signing'
 * normalizeServiceType('loan')          // → 'Loan Signing'
 * normalizeServiceType('LOAN SIGNING')  // → 'Loan Signing'
 * normalizeServiceType('')              // → 'General Notary Work (GNW)'
 */
export function normalizeServiceType(serviceType = '') {
  const raw = String(serviceType || '').trim();
  if (!raw) return 'General Notary Work (GNW)';

  // Exact match (case-insensitive)
  const exactMatch = SERVICE_TYPES.find((s) => s.toLowerCase() === raw.toLowerCase());
  if (exactMatch) return exactMatch;

  // Fuzzy fallback
  const lowerRaw = raw.toLowerCase();
  if (FUZZY_FALLBACK_MAP[lowerRaw]) return FUZZY_FALLBACK_MAP[lowerRaw];

  // Regex-based fallback for very loose input
  if (/loan/i.test(raw)) return 'Loan Signing';
  if (/jurat/i.test(raw)) return 'Jurat';
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
 * Convert a service type to its corresponding journal act type.
 * Uses the canonical mapping; handles normalization and fuzzy matching.
 *
 * @param {string} serviceType - The service type (e.g., "Loan Signing", "loan", "I-9")
 * @returns {string} - The corresponding act type (e.g., "Acknowledgment", "I-9 Verification")
 *
 * @example
 * serviceTypeToActType('Loan Signing')        // → 'Acknowledgment'
 * serviceTypeToActType('loan')                // → 'Acknowledgment'
 * serviceTypeToActType('I-9 Verification')    // → 'I-9 Verification'
 * serviceTypeToActType('i-9')                 // → 'I-9 Verification'
 * serviceTypeToActType('unknown')             // → 'Acknowledgment' (safe default)
 */
export function serviceTypeToActType(serviceType = '') {
  const normalized = normalizeServiceType(serviceType);
  return SERVICE_TYPE_TO_ACT_TYPE_MAP[normalized] || 'Acknowledgment';
}

/**
 * Validate that a service type is canonical (exactly matches SERVICE_TYPES).
 * Use this to catch typos or inconsistencies in data.
 *
 * @param {string} serviceType - The service type to validate
 * @returns {boolean} - True if the service type is canonical
 *
 * @example
 * isValidServiceType('Loan Signing')  // → true
 * isValidServiceType('loan')          // → false (not canonical, but normalizable)
 * isValidServiceType('Unknown Type')  // → false
 */
export function isValidServiceType(serviceType = '') {
  return SERVICE_TYPES.includes(serviceType);
}

/**
 * Validate that an act type is canonical (exactly matches ACT_TYPES).
 * Use this to catch typos or inconsistencies in journal data.
 *
 * @param {string} actType - The act type to validate
 * @returns {boolean} - True if the act type is canonical
 *
 * @example
 * isValidActType('Acknowledgment')  // → true
 * isValidActType('acknowledgment')  // → false (not canonical)
 * isValidActType('Unknown Act')     // → false
 */
export function isValidActType(actType = '') {
  return ACT_TYPES.includes(actType);
}

/**
 * Get all valid service types (for dropdowns, etc.)
 * @returns {string[]} - Array of canonical service types
 */
export function getServiceTypes() {
  return [...SERVICE_TYPES];
}

/**
 * Get all valid act types (for dropdowns, etc.)
 * @returns {string[]} - Array of canonical act types
 */
export function getActTypes() {
  return [...ACT_TYPES];
}

/**
 * Detect if a string looks like a service type (loose heuristic).
 * Useful for smart parsing and data validation.
 *
 * @param {string} text - The text to check
 * @returns {boolean} - True if the text appears to reference a service type
 */
export function looksLikeServiceType(text = '') {
  const lower = String(text || '').toLowerCase();
  return (
    /loan|jurat|oath|i-?9|apostille|copy cert|power of attorney|poa|signature|deed|ron|remote|electronic|notary|gnw/.test(lower)
  );
}

/**
 * Create a mapping object for use in forms or UI dropdowns.
 * Useful for showing the relationship between service types and act types.
 *
 * @returns {Array} - Array of { label, actType } objects
 */
export function getServiceTypeMapping() {
  return SERVICE_TYPES.map((label) => ({
    label,
    actType: SERVICE_TYPE_TO_ACT_TYPE_MAP[label] || 'Acknowledgment',
  }));
}
