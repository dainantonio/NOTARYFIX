/**
 * src/schemas/index.js
 *
 * Canonical Zod schemas for every persisted record type in NotaryFix.
 * These are the single source of truth for field names and shapes.
 *
 * Usage:
 *   import { AppointmentSchema, InvoiceSchema } from '../schemas';
 *   import { validateRecord } from '../schemas/validate';
 *   validateRecord(AppointmentSchema, data, 'Appointment');
 *
 * All schemas use .passthrough() so extra fields don't throw errors —
 * we only want to WARN about missing/wrong required fields, never crash.
 */

import { z } from 'zod';

// ─── Shared primitives ────────────────────────────────────────────────────────

/** Accepts number OR numeric string (form fields) and coerces to number */
const coercedNumber = z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform(Number);

/** ISO date string YYYY-MM-DD */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected ISO date (YYYY-MM-DD)').optional().or(z.literal(''));

/** ISO datetime string */
const isoDateTime = z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/));

// ─── Appointment ──────────────────────────────────────────────────────────────
//
// CANONICAL field names:
//   client      (not clientName — that's Invoice)
//   amount      (not fee — fee is an alias for the form but amount is stored)
//   linkedAppointmentId — DOES NOT belong on Appointment itself (it's on Invoice/Journal)

export const AppointmentSchema = z.object({
  id:       z.union([z.number(), z.string()]),
  client:   z.string().min(1, 'client is required'),
  type:     z.string().min(1, 'type is required'),
  date:     isoDate,
  time:     z.string().optional(),
  amount:   coercedNumber.optional(),
  phone:    z.string().optional(),
  email:    z.string().optional(),
  address:  z.string().optional(),
  location: z.string().optional(),
  notes:    z.string().optional(),
  status:   z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
}).passthrough().refine(
  (d) => !('clientName' in d),
  { message: 'FIELD DRIFT: use "client" not "clientName" on Appointment records' }
).refine(
  (d) => !('sourceAppointmentId' in d),
  { message: 'FIELD DRIFT: use "linkedAppointmentId" not "sourceAppointmentId"' }
);

// ─── Invoice ──────────────────────────────────────────────────────────────────
//
// CANONICAL field names:
//   client               (NOT clientName)
//   amount               (number)
//   linkedAppointmentId  (NOT sourceAppointmentId)
//   due                  (ISO date YYYY-MM-DD)
//   date                 (locale display string OR ISO — whatever InvoiceModal sets)

export const InvoiceSchema = z.object({
  id:                   z.union([z.number(), z.string()]),
  client:               z.string().min(1, 'client is required'),
  amount:               z.number({ invalid_type_error: 'amount must be a number' }),
  status:               z.enum(['Draft', 'Pending', 'Sent', 'Overdue', 'Paid']),
  due:                  z.string().optional(),
  date:                 z.string().optional(),
  notes:                z.string().optional(),
  linkedAppointmentId:  z.union([z.number(), z.string(), z.null()]).optional(),
}).passthrough().refine(
  (d) => !('clientName' in d),
  { message: 'FIELD DRIFT: use "client" not "clientName" on Invoice records' }
).refine(
  (d) => !('sourceAppointmentId' in d),
  { message: 'FIELD DRIFT: use "linkedAppointmentId" not "sourceAppointmentId" on Invoice records' }
);

// ─── JournalEntry ─────────────────────────────────────────────────────────────
//
// CANONICAL field names match createJournalDraftFromAppointment in crudOps.js

export const JournalEntrySchema = z.object({
  id:                   z.union([z.number(), z.string()]),
  entryNumber:          z.string().optional(),
  date:                 z.string().min(1, 'date is required'),
  time:                 z.string().optional(),
  actType:              z.string().min(1, 'actType is required'),
  signerName:           z.string().min(1, 'signerName is required'),
  signerAddress:        z.string().optional(),
  idType:               z.string().optional(),
  idIssuingState:       z.string().optional(),
  idLast4:              z.string().optional(),
  idExpiration:         z.string().optional(),
  fee:                  z.number().optional(),
  thumbprintTaken:      z.boolean().optional(),
  witnessRequired:      z.boolean().optional(),
  notes:                z.string().optional(),
  documentDescription:  z.string().optional(),
  linkedAppointmentId:  z.union([z.number(), z.string(), z.null()]).optional(),
  linkedInvoiceId:      z.union([z.number(), z.string(), z.null()]).optional(),
}).passthrough().refine(
  (d) => !('sourceAppointmentId' in d),
  { message: 'FIELD DRIFT: use "linkedAppointmentId" not "sourceAppointmentId" on JournalEntry records' }
).refine(
  (d) => !('appointmentId' in d) || ('linkedAppointmentId' in d),
  { message: 'FIELD DRIFT: use "linkedAppointmentId" not bare "appointmentId" on JournalEntry records' }
);

// ─── AgentSuggestion ─────────────────────────────────────────────────────────
//
// type must be one of the three known suggestion kinds.
// confidenceScore must be 0-100.

export const AgentSuggestionSchema = z.object({
  type:               z.enum(['closeout', 'ar_reminder', 'lead_intake'], {
    errorMap: () => ({ message: 'type must be "closeout" | "ar_reminder" | "lead_intake"' }),
  }),
  status:             z.enum(['pending', 'approved', 'rejected']),
  autonomyMode:       z.string().optional(),
  appointmentId:      z.union([z.number(), z.string(), z.null()]).optional(),
  appointmentClient:  z.string().optional(),
  actor:              z.string().optional(),
  ranAt:              z.string().optional(),
  createdAt:          z.string().optional(),
  label:              z.string().min(1, 'label is required'),
  actions:            z.array(z.any()).optional(),
  warnings:           z.array(z.any()).optional(),
  missingFields:      z.array(z.string()).optional(),
  confidenceScore:    z.number().min(0).max(100).optional(),
  stateCode:          z.string().length(2).optional(),
  draftJournal:       z.record(z.any()).optional(),
  draftInvoice:       z.record(z.any()).optional(),
  diffData:           z.record(z.any()).optional(),
}).passthrough().refine(
  (d) => !('suggestionType' in d),
  { message: 'FIELD DRIFT: use "type" not "suggestionType" on AgentSuggestion records' }
);

// ─── Admin: StateRule ─────────────────────────────────────────────────────────
//
// Imported records land as pending_review.
// publishedAt must be null unless status === 'active'.
// officialSourceUrl is required before publish (enforced in importJurisdictionDataset).

export const StateRuleSchema = z.object({
  id:                 z.union([z.number(), z.string()]).optional(),
  stateCode:          z.string().length(2, 'stateCode must be 2-char state abbreviation'),
  state:              z.string().min(1, 'state name is required'),
  status:             z.enum(['pending_review', 'draft', 'active', 'archived']).default('pending_review'),
  publishedAt:        z.string().nullable().optional(),
  ronPermitted:       z.boolean({ invalid_type_error: 'ronPermitted must be a boolean' }),
  feeCap:             z.number().nullable().optional(),
  thumbprintRequired: z.boolean().optional(),
  officialSourceUrl:  z.string().optional(),
  requiresSourceUrl:  z.boolean().optional(),
  createdAt:          z.string().optional(),
  updatedAt:          z.string().optional(),
  versionHistory:     z.array(z.any()).optional(),
}).passthrough().refine(
  (d) => !(d.status === 'active' && !d.publishedAt),
  { message: 'RULE: active StateRules must have publishedAt set' }
).refine(
  (d) => !(d.status === 'pending_review' && d.publishedAt),
  { message: 'RULE: pending_review StateRules must NOT have publishedAt set' }
);

// ─── Admin: FeeSchedule ───────────────────────────────────────────────────────

export const FeeScheduleSchema = z.object({
  id:         z.union([z.number(), z.string()]).optional(),
  stateCode:  z.string().length(2, 'stateCode must be 2-char state abbreviation'),
  actType:    z.string().min(1, 'actType is required'),
  maxFee:     z.number({ invalid_type_error: 'maxFee must be a number' }),
  updatedAt:  z.string().optional(),
}).passthrough();

// ─── Re-export all ────────────────────────────────────────────────────────────

export const Schemas = {
  Appointment:      AppointmentSchema,
  Invoice:          InvoiceSchema,
  JournalEntry:     JournalEntrySchema,
  AgentSuggestion:  AgentSuggestionSchema,
  StateRule:        StateRuleSchema,
  FeeSchedule:      FeeScheduleSchema,
};
