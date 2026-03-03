// File: src/context/slices/crudOps.js
// Simple CRUD, journal helpers, admin data management, and audit utilities.
// No React imports — pure factory functions that close over setData.
import { serviceTypeToActType } from '../../utils/notaryTypes';

const todayISO = new Date().toISOString().split('T')[0];

// ─── SERVICE TYPE → JOURNAL ACT TYPE ──────────────────────────────────────
// Now uses centralized mapping from notaryTypes.js — single source of truth.
const _apptTypeToActType = (apptType = '') => serviceTypeToActType(apptType);
const DEFAULT_JOURNAL_FEE = 15;

// ── Shared helpers (module-private) ─────────────────────────────────────────

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' },
];

const parseMoneyLike = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
};

const _appendAuditLog = (p, entry) => ({
  ...p,
  adminAuditLog: [
    { ...entry, id: Date.now() + Math.random(), timestamp: new Date().toISOString() },
    ...(p.adminAuditLog || []),
  ].slice(0, 200),
});

const _getRecordLabel = (records, id, type) => {
  const r = (records || []).find((x) => x.id === id);
  if (!r) return String(id);
  if (type === 'knowledgeArticles') return r.title || '';
  return `${r.state || r.stateCode || ''} ${r.version || ''}`.trim();
};

// ── Factory ──────────────────────────────────────────────────────────────────

export function createCrudOps(setData) {

  // ── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = (u) => setData((p) => ({ ...p, settings: { ...p.settings, ...u } }));

  // ── Clients ───────────────────────────────────────────────────────────────
  const addClient = (c) => setData((p) => ({ ...p, clients: [c, ...(p.clients || [])] }));

  // ── Invoices ──────────────────────────────────────────────────────────────
  const addInvoice    = (i)      => setData((p) => ({ ...p, invoices: [i, ...(p.invoices || [])] }));
  const updateInvoice = (id, u)  => setData((p) => ({ ...p, invoices: (p.invoices || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteInvoice = (id)     => setData((p) => ({ ...p, invoices: (p.invoices || []).filter((x) => x.id !== id) }));

  // ── Mileage Logs ──────────────────────────────────────────────────────────
  const addMileageLog    = (m)     => setData((p) => ({ ...p, mileageLogs: [m, ...(p.mileageLogs || [])] }));
  const updateMileageLog = (id, u) => setData((p) => ({ ...p, mileageLogs: (p.mileageLogs || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteMileageLog = (id)    => setData((p) => ({ ...p, mileageLogs: (p.mileageLogs || []).filter((x) => x.id !== id) }));

  // ── Appointments ──────────────────────────────────────────────────────────
  const addAppointment    = (a)     => setData((p) => ({ ...p, appointments: [a, ...(p.appointments || [])] }));
  const updateAppointment = (id, u) => setData((p) => ({ ...p, appointments: (p.appointments || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteAppointment = (id)    => setData((p) => ({ ...p, appointments: (p.appointments || []).filter((x) => x.id !== id) }));

  // ── Compliance Items ──────────────────────────────────────────────────────
  const addComplianceItem    = (c)     => setData((p) => ({ ...p, complianceItems: [c, ...(p.complianceItems || [])] }));
  const updateComplianceItem = (id, u) => setData((p) => ({ ...p, complianceItems: (p.complianceItems || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteComplianceItem = (id)    => setData((p) => ({ ...p, complianceItems: (p.complianceItems || []).filter((x) => x.id !== id) }));

  // ── Signer Sessions ───────────────────────────────────────────────────────
  const addSignerSession    = (s)     => setData((p) => ({ ...p, signerSessions: [s, ...(p.signerSessions || [])] }));
  const updateSignerSession = (id, u) => setData((p) => ({ ...p, signerSessions: (p.signerSessions || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteSignerSession = (id)    => setData((p) => ({ ...p, signerSessions: (p.signerSessions || []).filter((x) => x.id !== id) }));

  // ── Signer Documents ──────────────────────────────────────────────────────
  const addSignerDocument    = (d)     => setData((p) => ({ ...p, signerDocuments: [d, ...(p.signerDocuments || [])] }));
  const updateSignerDocument = (id, u) => setData((p) => ({ ...p, signerDocuments: (p.signerDocuments || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteSignerDocument = (id)    => setData((p) => ({ ...p, signerDocuments: (p.signerDocuments || []).filter((x) => x.id !== id) }));

  // ── Portal Messages ───────────────────────────────────────────────────────
  const addPortalMessage    = (m)     => setData((p) => ({ ...p, portalMessages: [m, ...(p.portalMessages || [])] }));
  const updatePortalMessage = (id, u) => setData((p) => ({ ...p, portalMessages: (p.portalMessages || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deletePortalMessage = (id)    => setData((p) => ({ ...p, portalMessages: (p.portalMessages || []).filter((x) => x.id !== id) }));

  // ── Journal Entries ───────────────────────────────────────────────────────
  const addJournalEntry    = (j)     => setData((p) => ({ ...p, journalEntries: [j, ...(p.journalEntries || [])] }));
  const updateJournalEntry = (id, u) => setData((p) => ({ ...p, journalEntries: (p.journalEntries || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteJournalEntry = (id)    => setData((p) => ({ ...p, journalEntries: (p.journalEntries || []).filter((x) => x.id !== id) }));

  const updateJournalSettings = (u) => setData((p) => ({ ...p, journalSettings: { ...p.journalSettings, ...u } }));

  // ── Journal Utilities (pure — no setData) ─────────────────────────────────
  const createJournalDraftFromAppointment = (appointment) => ({
    id: Date.now(),
    entryNumber: `JE-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    date: appointment.date || todayISO,
    time: appointment.time?.replace(' PM', '').replace(' AM', '') || '09:00',
    actType: serviceTypeToActType(appointment.type),
    signerName: appointment.client,
    signerAddress: appointment.address || appointment.location || '',
    idType: "Driver's License",
    idIssuingState: '',
    idLast4: '',
    idExpiration: '',
    fee: appointment.amount || DEFAULT_JOURNAL_FEE,
    thumbprintTaken: false,
    witnessRequired: false,
    notes: '',
    documentDescription: appointment.type,
    linkedAppointmentId: appointment.id,
    linkedInvoiceId: null,
    createdAt: new Date().toISOString(),
  });

  const scoreEntry = (entry) => {
    const checks = [
      entry.signerName,
      entry.actType,
      entry.date,
      entry.idType,
      entry.fee != null,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  };

  // ── Reminder Queue ────────────────────────────────────────────────────────
  const updateReminderStatus = (id, status) => setData((p) => ({
    ...p,
    reminderQueue: (p.reminderQueue || []).map((r) => r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r),
  }));

  // ── Admin Audit Log (public) ──────────────────────────────────────────────
  const appendAuditLog = (entry) => setData((p) => _appendAuditLog(p, entry));

  // ── State Rules ───────────────────────────────────────────────────────────
  const addStateRule = (rule, actor) => setData((p) => {
    const next = { ...rule, id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    return _appendAuditLog(
      { ...p, stateRules: [next, ...(p.stateRules || [])] },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'created', resourceType: 'stateRules', resourceId: next.id, resourceLabel: `${rule.state} ${rule.version || ''}`, diff: 'New record' }
    );
  });

  const updateStateRule = (id, u, actor, diff) => setData((p) => {
    const rule = (p.stateRules || []).find((r) => r.id === id);
    const now = new Date().toISOString();
    const snap = rule ? { ...rule, versionHistory: undefined } : null;
    const versionHistory = snap
      ? [...(rule.versionHistory || []).slice(-19), { ts: now, actor, action: 'updated', diff: diff || 'Record updated', snapshot: snap }]
      : (rule?.versionHistory || []);
    return _appendAuditLog(
      { ...p, stateRules: (p.stateRules || []).map((r) => r.id === id ? { ...r, ...u, updatedAt: now, versionHistory } : r) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'updated', resourceType: 'stateRules', resourceId: id, resourceLabel: `${rule?.state} ${rule?.version || ''}`, diff: diff || 'Record updated' }
    );
  });

  const publishStateRule = (id, actor) => setData((p) => {
    const rule = (p.stateRules || []).find((r) => r.id === id);
    if (!rule) return p;
    const now = new Date().toISOString();
    const nextRules = (p.stateRules || []).map((r) => {
      if (r.id === id) return { ...r, status: r.status === 'archived' ? 'archived' : 'active', publishedAt: now, updatedAt: now };
      if (r.stateCode === rule.stateCode && r.id !== id && r.publishedAt) return { ...r, publishedAt: null, updatedAt: now };
      return r;
    });
    const diff = `publishedAt: ${JSON.stringify(rule.publishedAt)} → ${JSON.stringify(now)}`;
    return _appendAuditLog(
      { ...p, stateRules: nextRules },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'published', resourceType: 'stateRules', resourceId: id, resourceLabel: `${rule.state} ${rule.version || ''}`, diff }
    );
  });

  const unpublishStateRule = (id, actor) => setData((p) => {
    const rule = (p.stateRules || []).find((r) => r.id === id);
    if (!rule) return p;
    const now = new Date().toISOString();
    const nextRules = (p.stateRules || []).map((r) => (r.id === id ? { ...r, status: 'draft', publishedAt: null, updatedAt: now } : r));
    const diff = `publishedAt: ${JSON.stringify(rule.publishedAt)} → null`;
    return _appendAuditLog(
      { ...p, stateRules: nextRules },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'unpublished', resourceType: 'stateRules', resourceId: id, resourceLabel: `${rule.state} ${rule.version || ''}`, diff }
    );
  });

  const deleteStateRule = (id, actor) => setData((p) => {
    const rule = (p.stateRules || []).find((r) => r.id === id);
    return _appendAuditLog(
      { ...p, stateRules: (p.stateRules || []).filter((r) => r.id !== id) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'deleted', resourceType: 'stateRules', resourceId: id, resourceLabel: `${rule?.state} ${rule?.version || ''}`, diff: 'Record deleted' }
    );
  });

  // ── Fee Schedules ─────────────────────────────────────────────────────────
  const addFeeSchedule = (fee, actor) => setData((p) => {
    const next = { ...fee, id: Date.now(), updatedAt: new Date().toISOString() };
    return _appendAuditLog(
      { ...p, feeSchedules: [next, ...(p.feeSchedules || [])] },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'created', resourceType: 'feeSchedules', resourceId: next.id, resourceLabel: `${fee.stateCode} — ${fee.actType}`, diff: 'New record' }
    );
  });

  const updateFeeSchedule = (id, u, actor, diff) => setData((p) => {
    const fee = (p.feeSchedules || []).find((f) => f.id === id);
    const now = new Date().toISOString();
    const snap = fee ? { ...fee, versionHistory: undefined } : null;
    const versionHistory = snap
      ? [...(fee.versionHistory || []).slice(-19), { ts: now, actor, action: 'updated', diff: diff || 'Record updated', snapshot: snap }]
      : (fee?.versionHistory || []);
    return _appendAuditLog(
      { ...p, feeSchedules: (p.feeSchedules || []).map((f) => f.id === id ? { ...f, ...u, updatedAt: now, versionHistory } : f) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'updated', resourceType: 'feeSchedules', resourceId: id, resourceLabel: `${fee?.stateCode} — ${fee?.actType}`, diff: diff || 'Record updated' }
    );
  });

  const deleteFeeSchedule = (id, actor) => setData((p) => {
    const fee = (p.feeSchedules || []).find((f) => f.id === id);
    return _appendAuditLog(
      { ...p, feeSchedules: (p.feeSchedules || []).filter((f) => f.id !== id) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'deleted', resourceType: 'feeSchedules', resourceId: id, resourceLabel: `${fee?.stateCode} — ${fee?.actType}`, diff: 'Record deleted' }
    );
  });

  // ── ID Requirements ───────────────────────────────────────────────────────
  const addIdRequirement = (req, actor) => setData((p) => {
    const next = { ...req, id: Date.now(), updatedAt: new Date().toISOString() };
    return _appendAuditLog(
      { ...p, idRequirements: [next, ...(p.idRequirements || [])] },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'created', resourceType: 'idRequirements', resourceId: next.id, resourceLabel: `${req.stateCode} — ID Requirements`, diff: 'New record' }
    );
  });

  const updateIdRequirement = (id, u, actor, diff) => setData((p) => {
    const req = (p.idRequirements || []).find((r) => r.id === id);
    const now = new Date().toISOString();
    const snap = req ? { ...req, versionHistory: undefined } : null;
    const versionHistory = snap
      ? [...(req.versionHistory || []).slice(-19), { ts: now, actor, action: 'updated', diff: diff || 'Record updated', snapshot: snap }]
      : (req?.versionHistory || []);
    return _appendAuditLog(
      { ...p, idRequirements: (p.idRequirements || []).map((r) => r.id === id ? { ...r, ...u, updatedAt: now, versionHistory } : r) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'updated', resourceType: 'idRequirements', resourceId: id, resourceLabel: `${req?.stateCode} — ID Requirements`, diff: diff || 'Record updated' }
    );
  });

  const deleteIdRequirement = (id, actor) => setData((p) => {
    const req = (p.idRequirements || []).find((r) => r.id === id);
    return _appendAuditLog(
      { ...p, idRequirements: (p.idRequirements || []).filter((r) => r.id !== id) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'deleted', resourceType: 'idRequirements', resourceId: id, resourceLabel: `${req?.stateCode} — ID Requirements`, diff: 'Record deleted' }
    );
  });

  // ── Knowledge Articles ────────────────────────────────────────────────────
  const addKnowledgeArticle = (article, actor) => setData((p) => {
    const next = { ...article, id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), publishedAt: article.status === 'published' ? new Date().toISOString() : null };
    return _appendAuditLog(
      { ...p, knowledgeArticles: [next, ...(p.knowledgeArticles || [])] },
      { actor, actorRole: p.settings?.userRole || 'owner', action: article.status === 'published' ? 'published' : 'created', resourceType: 'knowledgeArticles', resourceId: next.id, resourceLabel: article?.title || '', diff: 'New record' }
    );
  });

  const updateKnowledgeArticle = (id, u, actor, diff) => setData((p) => {
    const article = (p.knowledgeArticles || []).find((a) => a.id === id);
    const now = new Date().toISOString();
    const nextPublishedAt = u.status === 'published' && !article?.publishedAt ? now : article?.publishedAt ?? null;
    const snap = article ? { ...article, versionHistory: undefined } : null;
    const versionHistory = snap
      ? [...(article.versionHistory || []).slice(-19), { ts: now, actor, action: 'updated', diff: diff || 'Record updated', snapshot: snap }]
      : (article?.versionHistory || []);
    return _appendAuditLog(
      { ...p, knowledgeArticles: (p.knowledgeArticles || []).map((a) => a.id === id ? { ...a, ...u, updatedAt: now, publishedAt: nextPublishedAt, versionHistory } : a) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: u.status === 'published' ? 'published' : u.status === 'unpublished' ? 'unpublished' : 'updated', resourceType: 'knowledgeArticles', resourceId: id, resourceLabel: article?.title || '', diff: diff || 'Record updated' }
    );
  });

  const deleteKnowledgeArticle = (id, actor) => setData((p) => {
    const article = (p.knowledgeArticles || []).find((a) => a.id === id);
    return _appendAuditLog(
      { ...p, knowledgeArticles: (p.knowledgeArticles || []).filter((a) => a.id !== id) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'deleted', resourceType: 'knowledgeArticles', resourceId: id, resourceLabel: article?.title || '', diff: 'Record deleted' }
    );
  });

  // ── Review Workflow ───────────────────────────────────────────────────────
  const submitForReview = (resourceType, id, actor) => setData((p) => {
    const records = p[resourceType] || [];
    const now = new Date().toISOString();
    const label = _getRecordLabel(records, id, resourceType);
    return _appendAuditLog(
      { ...p, [resourceType]: records.map((r) => r.id === id ? { ...r, status: 'pending_review', submittedForReviewAt: now, submittedBy: actor, updatedAt: now } : r) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'submitted_for_review', resourceType, resourceId: id, resourceLabel: label, diff: 'Submitted for compliance review' }
    );
  });

  const approveRecord = (resourceType, id, actor) => setData((p) => {
    const records = p[resourceType] || [];
    const record = records.find((r) => r.id === id);
    if (!record) return p;
    const now = new Date().toISOString();
    const newStatus = resourceType === 'knowledgeArticles' ? 'published' : 'active';
    const label = _getRecordLabel(records, id, resourceType);
    const snap = { ...record, versionHistory: undefined };
    const versionHistory = [...(record.versionHistory || []).slice(-19), { ts: now, actor, action: 'approved', diff: `Approved and set to ${newStatus}`, snapshot: snap }];
    return _appendAuditLog(
      { ...p, [resourceType]: records.map((r) => r.id === id ? { ...r, status: newStatus, publishedAt: now, approvedBy: actor, approvedAt: now, versionHistory, updatedAt: now } : r) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'published', resourceType, resourceId: id, resourceLabel: label, diff: `Approved and set to ${newStatus}` }
    );
  });

  const rejectReview = (resourceType, id, actor, reason) => setData((p) => {
    const records = p[resourceType] || [];
    const record = records.find((r) => r.id === id);
    if (!record) return p;
    const now = new Date().toISOString();
    const label = _getRecordLabel(records, id, resourceType);
    const snap = { ...record, versionHistory: undefined };
    const versionHistory = [...(record.versionHistory || []).slice(-19), { ts: now, actor, action: 'rejected', diff: `Review rejected: ${reason}`, snapshot: snap }];
    return _appendAuditLog(
      { ...p, [resourceType]: records.map((r) => r.id === id ? { ...r, status: 'draft', rejectedAt: now, rejectedBy: actor, rejectionReason: reason, versionHistory, updatedAt: now } : r) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'rejected', resourceType, resourceId: id, resourceLabel: label, diff: `Review rejected: ${reason}` }
    );
  });

  // ── Bulk Jurisdiction Dataset Import ──────────────────────────────────────
  const importJurisdictionDataset = (dataset, actor = 'System Import') => setData((p) => {
    if (!dataset || typeof dataset !== 'object' || Array.isArray(dataset)) {
      throw new Error('Dataset import expects a JSON object keyed by state code (e.g., {"CA": {...}}).');
    }

    const now = new Date().toISOString();
    const knownCodes = new Set(US_STATES.map((s) => s.code));
    const jurisdictions = Object.entries(dataset).filter(([code, rec]) => knownCodes.has(code) && rec && typeof rec === 'object');
    if (jurisdictions.length === 0) {
      throw new Error('No recognized jurisdiction entries found. Include US state/DC codes as top-level keys.');
    }

    const importedCodes = new Set(jurisdictions.map(([code]) => code));
    const keptRules = (p.stateRules || []).filter((r) => !importedCodes.has(r.stateCode));
    const keptFees = (p.feeSchedules || []).filter((f) => !importedCodes.has(f.stateCode));
    const keptIdReq = (p.idRequirements || []).filter((r) => !importedCodes.has(r.stateCode));

    const newRules = [];
    const newFees = [];
    const newIdReqs = [];
    const newCompliance = [];

    jurisdictions.forEach(([code, rec], i) => {
      const state = rec.state || US_STATES.find((s) => s.code === code)?.name || code;
      const fees = rec.fees || {};
      const idReq = rec.id_requirements || {};
      const redFlags = Array.isArray(rec.red_flags) ? rec.red_flags : [];
      const specialized = rec.specialized || {};

      const ackFee = parseMoneyLike(fees.acknowledgment);
      const juratFee = parseMoneyLike(fees.jurat);
      const oathFee = parseMoneyLike(fees.oath);
      const numericFees = [ackFee, juratFee, oathFee].filter((x) => x !== null);
      const maxFeePerAct = numericFees.length ? Math.max(...numericFees) : 0;

      const ruleId = Date.now() + i * 100 + 1;
      newRules.push({
        id: ruleId,
        state,
        stateCode: code,
        version: 'DB-Import-v1',
        effectiveDate: now.split('T')[0],
        status: 'active',
        publishedAt: now,
        maxFeePerAct,
        thumbprintRequired: redFlags.some((f) => /thumbprint/i.test(String(f))),
        journalRequired: true,
        ronPermitted: true,
        ronStatute: '',
        seal: '',
        retentionYears: 0,
        notarizationTypes: ['Acknowledgment', 'Jurat', 'Oath / Affirmation'],
        witnessRequirements: idReq.credible_witnesses || '',
        specialActCaveats: redFlags.join('; '),
        officialSourceUrl: '',
        notes: `Loan signing: ${specialized.loan_signing || 'n/a'} • Apostille: ${specialized.apostille || 'n/a'} • Marriage: ${specialized.marriage || 'n/a'}`,
        createdAt: now,
        updatedAt: now,
      });

      [
        ['Acknowledgment', fees.acknowledgment],
        ['Jurat', fees.jurat],
        ['Oath / Affirmation', fees.oath],
      ].forEach(([actType, value], j) => {
        const parsed = parseMoneyLike(value);
        newFees.push({
          id: Date.now() + i * 100 + 10 + j,
          stateCode: code,
          actType,
          maxFee: parsed ?? 0,
          maxFeePerAct: parsed ?? 0,
          notes: parsed === null ? `Source value: ${String(value || 'Not specified')}` : '',
          effectiveDate: now.split('T')[0],
          updatedAt: now,
          status: 'draft',
        });
      });

      newIdReqs.push({
        id: Date.now() + i * 100 + 40,
        stateCode: code,
        acceptedIdTypes: ["Driver's License", 'Passport', 'State ID Card', 'Military ID'],
        expirationRequired: true,
        twoFormAllowed: /2/.test(String(idReq.credible_witnesses || '')),
        credibleWitnessAllowed: !/not specified/i.test(String(idReq.credible_witnesses || '')),
        notes: `Credible witnesses: ${idReq.credible_witnesses || 'Not specified'}. Expired ID rule: ${idReq.expired_id_rule || 'Not specified'}.`,
        updatedAt: now,
        status: 'draft',
      });

      if (redFlags.length > 0) {
        newCompliance.push({
          id: Date.now() + i * 100 + 70,
          title: `${code} red flags review`,
          category: 'State Policy',
          dueDate: now.split('T')[0],
          status: 'Needs Review',
          notes: redFlags.join('; '),
        });
      }
    });

    const next = {
      ...p,
      stateRules: [...newRules, ...keptRules],
      feeSchedules: [...newFees, ...keptFees],
      idRequirements: [...newIdReqs, ...keptIdReq],
      complianceItems: [...newCompliance, ...(p.complianceItems || [])],
    };

    return _appendAuditLog(next, {
      actor,
      actorRole: p.settings?.userRole || 'owner',
      action: 'created',
      resourceType: 'stateRules',
      resourceId: Date.now(),
      resourceLabel: `Bulk dataset import (${jurisdictions.length} jurisdictions)`,
      diff: `Imported/updated ${jurisdictions.length} states + fee tables + ID requirements + compliance flags`,
    });
  });

  return {
    updateSettings,
    addClient,
    addInvoice, updateInvoice, deleteInvoice,
    addMileageLog, updateMileageLog, deleteMileageLog,
    addAppointment, updateAppointment, deleteAppointment,
    addComplianceItem, updateComplianceItem, deleteComplianceItem,
    addSignerSession, updateSignerSession, deleteSignerSession,
    addSignerDocument, updateSignerDocument, deleteSignerDocument,
    addPortalMessage, updatePortalMessage, deletePortalMessage,
    addJournalEntry, updateJournalEntry, deleteJournalEntry,
    updateJournalSettings,
    createJournalDraftFromAppointment,
    scoreEntry,
    updateReminderStatus,
    appendAuditLog,
    addStateRule, updateStateRule, publishStateRule, unpublishStateRule, deleteStateRule,
    addFeeSchedule, updateFeeSchedule, deleteFeeSchedule,
    addIdRequirement, updateIdRequirement, deleteIdRequirement,
    addKnowledgeArticle, updateKnowledgeArticle, deleteKnowledgeArticle,
    submitForReview, approveRecord, rejectReview,
    importJurisdictionDataset,
  };
}
