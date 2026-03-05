/**
 * src/schemas/index.js
 *
 * Canonical field shapes for all persisted records.
 * Plain-JS — no runtime dependency on Zod or any other library.
 *
 * Usage (validation happens automatically in crudOps / agentOps):
 *   import { AppointmentSchema } from '../schemas';
 *   const result = AppointmentSchema.safeParse(data);
 *   if (!result.ok) console.error(result.errors);
 */

// ─── tiny runtime type helpers ───────────────────────────────────────────────

const is = {
  string:  v => typeof v === 'string',
  number:  v => typeof v === 'number' && !Number.isNaN(v),
  boolean: v => typeof v === 'boolean',
  array:   v => Array.isArray(v),
  object:  v => v !== null && typeof v === 'object' && !Array.isArray(v),
  nullish: v => v == null,
};

function makeSchema(name, requiredFields, optionalFields = {}, refines = []) {
  return {
    _name: name,
    safeParse(data) {
      const errors = [];

      // required field type checks
      for (const [field, type] of Object.entries(requiredFields)) {
        const val = data?.[field];
        if (is.nullish(val)) {
          errors.push(`[${name}] missing required field: "${field}"`);
        } else if (type !== 'any' && !is[type]?.(val)) {
          errors.push(`[${name}] "${field}" should be ${type}, got ${typeof val}`);
        }
      }

      // optional field type checks (only when present)
      for (const [field, type] of Object.entries(optionalFields)) {
        const val = data?.[field];
        if (!is.nullish(val) && type !== 'any' && !is[type]?.(val)) {
          errors.push(`[${name}] "${field}" should be ${type}, got ${typeof val}`);
        }
      }

      // custom refinements
      for (const [check, message] of refines) {
        if (!check(data)) errors.push(`[${name}] ${message}`);
      }

      return { ok: errors.length === 0, errors };
    },
  };
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export const AppointmentSchema = makeSchema(
  'Appointment',
  {
    clientName:  'string',
    date:        'string',
    notaryType:  'string',
    status:      'string',
  },
  {
    id:           'string',
    clientEmail:  'string',
    clientPhone:  'string',
    location:     'string',
    fee:          'number',
    notes:        'string',
    createdAt:    'string',
    updatedAt:    'string',
  }
);

// ─── Invoice ─────────────────────────────────────────────────────────────────

export const InvoiceSchema = makeSchema(
  'Invoice',
  {
    clientName:  'string',
    amount:      'number',
    status:      'string',
    dueDate:     'string',
  },
  {
    id:                    'string',
    linkedAppointmentId:   'string',   // canonical — NOT sourceAppointmentId
    description:           'string',
    lineItems:             'array',
    paidAt:                'string',
    createdAt:             'string',
    updatedAt:             'string',
  },
  [
    [
      d => !d || !d.sourceAppointmentId,
      'use "linkedAppointmentId" not "sourceAppointmentId" — fix the field name',
    ],
  ]
);

// ─── JournalEntry ────────────────────────────────────────────────────────────

export const JournalEntrySchema = makeSchema(
  'JournalEntry',
  {
    clientName:   'string',
    date:         'string',
    notaryType:   'string',
  },
  {
    id:                   'string',
    linkedAppointmentId:  'string',
    linkedInvoiceId:      'string',
    signerCount:          'number',
    fee:                  'number',
    notes:                'string',
    state:                'string',
    county:               'string',
    createdAt:            'string',
  },
  [
    [
      d => !d || !d.appointmentId,
      'use "linkedAppointmentId" not "appointmentId"',
    ],
  ]
);

// ─── AgentSuggestion ─────────────────────────────────────────────────────────

const SUGGESTION_TYPES = [
  'closeout', 'ar_reminder', 'lead_intake',
  'compliance_alert', 'scheduling', 'general',
];

export const AgentSuggestionSchema = makeSchema(
  'AgentSuggestion',
  {
    type:            'string',
    title:           'string',
    summary:         'string',
    status:          'string',
    confidenceScore: 'number',
  },
  {
    id:                   'string',
    linkedAppointmentId:  'string',
    linkedClientId:       'string',
    suggestedAction:      'object',
    createdAt:            'string',
    reviewedAt:           'string',
  },
  [
    [
      d => !d || SUGGESTION_TYPES.includes(d.type),
      `"type" must be one of: ${SUGGESTION_TYPES.join(', ')}`,
    ],
    [
      d => !d || (typeof d.confidenceScore !== 'number') || (d.confidenceScore >= 0 && d.confidenceScore <= 1),
      '"confidenceScore" must be between 0 and 1',
    ],
  ]
);

// ─── Admin dataset schemas ────────────────────────────────────────────────────

export const StateRuleSchema = makeSchema(
  'StateRule',
  {
    state:        'string',
    status:       'string',
  },
  {
    id:               'string',
    ronPermitted:     'boolean',
    maxFee:           'number',
    sealRequired:     'boolean',
    journalRequired:  'boolean',
    publishedAt:      'any',     // null until admin publishes
    officialSourceUrl:'string',
    createdAt:        'string',
  },
  [
    [
      d => !d || d.status !== 'active' || d.publishedAt != null,
      'active StateRule must have a publishedAt date — set status to "pending_review" on import',
    ],
  ]
);

export const FeeScheduleSchema = makeSchema(
  'FeeSchedule',
  {
    state:        'string',
    notaryType:   'string',
    fee:          'number',
  },
  {
    id:           'string',
    effectiveDate:'string',
    notes:        'string',
    status:       'string',
    createdAt:    'string',
  }
);
