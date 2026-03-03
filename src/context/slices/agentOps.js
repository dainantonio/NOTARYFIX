// File: src/context/slices/agentOps.js
// AI/agent operations: closeout, AR, lead intake, weekly summary, autonomy.
// No React imports — pure factory function.
// getData() is passed as second param to read current state snapshot.

// ─── SERVICE TYPE → ACT TYPE MAPPING ─────────────────────────────────────────
// Mirrors SERVICE_TYPE_MAP in AppointmentModal.jsx — keep in sync.
const _SERVICE_ACT_MAP = {
  'loan signing':               'Acknowledgment',
  'general notary work (gnw)':  'Acknowledgment',
  'general notary':             'Acknowledgment',
  'gnw':                        'Acknowledgment',
  'jurat':                      'Jurat',
  'oath / affirmation':         'Oath / Affirmation',
  'oath/affirmation':           'Oath / Affirmation',
  'i-9 verification':           'I-9 Verification',
  'i9 verification':            'I-9 Verification',
  'apostille':                  'Apostille',
  'copy certification':         'Copy Certification',
  'power of attorney':          'Power of Attorney',
  'poa':                        'Power of Attorney',
  'signature witnessing':       'Signature Witnessing',
  'deed of trust':              'Deed of Trust',
  'remote online notary (ron)': 'Remote Online Notary (RON)',
  'ron':                        'Remote Online Notary (RON)',
  'remote online notary':       'Remote Online Notary (RON)',
  'other':                      'Other',
};

const apptTypeToActType = (apptType = '', aiHint = '') => {
  const key = (apptType || '').trim().toLowerCase();
  if (_SERVICE_ACT_MAP[key]) return _SERVICE_ACT_MAP[key];
  // Fuzzy fallbacks
  if (/loan/i.test(apptType))                     return 'Acknowledgment';
  if (/jurat/i.test(apptType))                    return 'Jurat';
  if (/oath|affirm/i.test(apptType))              return 'Oath / Affirmation';
  if (/i-?9/i.test(apptType))                     return 'I-9 Verification';
  if (/apostille/i.test(apptType))                return 'Apostille';
  if (/copy cert/i.test(apptType))                return 'Copy Certification';
  if (/power of attorney|poa/i.test(apptType))    return 'Power of Attorney';
  if (/signature wit/i.test(apptType))            return 'Signature Witnessing';
  if (/deed/i.test(apptType))                     return 'Deed of Trust';
  if (/remote|ron|electronic/i.test(apptType))    return 'Remote Online Notary (RON)';
  if (/gnw|general notary/i.test(apptType))       return 'Acknowledgment';
  // Use AI hint if present
  if (aiHint && _SERVICE_ACT_MAP[aiHint.trim().toLowerCase()]) return _SERVICE_ACT_MAP[aiHint.trim().toLowerCase()];
  return 'Acknowledgment'; // safe default
};

import { generateCloseoutDraft, generateWeeklySummary as generateWeeklySummaryAI, parseLeadText } from '../../services/agentService';
import { checkCompliance, STATE_RULES } from '../../hooks/useComplianceChecker';
import { mapServiceTypeToJournalActType } from '../../utils/notaryMappings';

// ── Internal helpers (module-private) ────────────────────────────────────────

const todayISO = new Date().toISOString().split('T')[0];

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

// ── Factory ──────────────────────────────────────────────────────────────────

export function createAgentOps(setData, getData) {

  // ── Sync Closeout Agent ───────────────────────────────────────────────────
  const runCloseoutAgent = (appointmentId, actor = 'Closeout Agent') => setData((p) => {
    const appointment = (p.appointments || []).find((apt) => String(apt.id) === String(appointmentId));
    if (!appointment) return p;

    const autoCloseoutEnabled = p.settings?.enableAutoCloseoutAgent !== false;
    if (!autoCloseoutEnabled) return p;
    const autonomyMode = p.settings?.autonomyMode || 'assistive';

    const stateCode = p.settings?.currentStateCode || 'WA';
    const schedule = (p.feeSchedules || []).find((fee) => fee.stateCode === stateCode && fee.actType === 'Acknowledgment');
    const suggestedAmount = parseMoneyLike(appointment.amount) ?? 0;
    const maxFee = parseMoneyLike(schedule?.maxFee);
    const invoiceAmount = maxFee == null ? suggestedAmount : Math.min(suggestedAmount, maxFee);

    const nowIso = new Date().toISOString();
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const runId = `AGENT-${Date.now()}`;
    const journalId = Date.now() + Math.floor(Math.random() * 999);

    const draftJournal = {
      id: journalId,
      entryNumber: `JE-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      date: appointment.date || todayISO,
      time: appointment.time?.replace(' PM', '').replace(' AM', '') || '09:00',
      actType: mapServiceTypeToJournalActType(appointment.type),
      signerName: appointment.client || 'Unknown Signer',
      signerAddress: '',
      idType: "Driver's License",
      idIssuingState: stateCode,
      idLast4: '',
      idExpiration: '',
      fee: invoiceAmount,
      thumbprintTaken: false,
      witnessRequired: false,
      notes: `Drafted by closeout agent from appointment #${appointment.id}.`,
      documentDescription: appointment.type || 'Notary appointment',
      linkedAppointmentId: appointment.id,
      linkedInvoiceId: invoiceId,
      qualityScore: 65,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const draftInvoice = {
      id: invoiceId,
      client: appointment.client || 'Unknown',
      amount: invoiceAmount,
      date: new Date(nowIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      due: appointment.date || todayISO,
      status: 'Pending',
      notes: `Auto-drafted by closeout agent for ${appointment.type || 'notary service'}.`,
      sourceAppointmentId: appointment.id,
      createdAt: nowIso,
      sentAt: null,
      paymentLink: '',
    };

    const runRecord = {
      id: runId,
      appointmentId: appointment.id,
      appointmentClient: appointment.client || 'Unknown',
      actor,
      ranAt: nowIso,
      actions: [
        { type: 'journal_drafted', refId: journalId },
        { type: 'invoice_drafted', refId: invoiceId },
      ],
      warnings: [
        !draftJournal.idType ? 'Missing ID type in draft journal entry.' : null,
        !draftJournal.idLast4 ? 'Missing signer ID last 4.' : null,
      ].filter(Boolean),
    };

    const nextAppointments = (p.appointments || []).map((apt) => {
      if (String(apt.id) !== String(appointmentId)) return apt;
      return { ...apt, status: 'completed', agentCloseoutRunId: runId, linkedInvoiceId: invoiceId, linkedJournalEntryId: journalId, closeoutCompletedAt: nowIso };
    });

    const missingFields = [];
    if (!draftJournal.idType) missingFields.push('idType');
    if (!draftJournal.idLast4) missingFields.push('idLast4');
    if (!draftJournal.signerAddress) missingFields.push('signerAddress');
    if (!draftJournal.idExpiration) missingFields.push('idExpiration');
    const confidenceScore = Math.max(10, 100 - (missingFields.length * 15) - (runRecord.warnings.length * 5));

    const suggestion = {
      id: runId,
      type: 'closeout',
      status: 'pending',
      autonomyMode,
      appointmentId: appointment.id,
      appointmentClient: appointment.client || 'Unknown',
      actor,
      ranAt: nowIso,
      createdAt: nowIso,
      label: `Closeout — ${appointment.client || 'Unknown'}`,
      actions: runRecord.actions,
      warnings: runRecord.warnings,
      missingFields,
      confidenceScore,
      draftJournal,
      draftInvoice,
      diff: `Journal ${draftJournal.entryNumber} + Invoice ${invoiceId}\nFee: $${invoiceAmount}\nState: ${stateCode}`,
      wasEdited: false,
    };

    if (autonomyMode === 'autonomous') {
      return _appendAuditLog({
        ...p,
        appointments: nextAppointments,
        invoices: [draftInvoice, ...(p.invoices || [])],
        journalEntries: [draftJournal, ...(p.journalEntries || [])],
        agentRuns: [runRecord, ...(p.agentRuns || [])].slice(0, 200),
        agentSuggestions: [{ ...suggestion, status: 'approved', approvedAt: nowIso }, ...(p.agentSuggestions || [])].slice(0, 200),
      }, {
        actor, actorRole: 'ai_agent', action: 'created', resourceType: 'closeoutAgent',
        resourceId: runId, resourceLabel: `${appointment.client || 'Unknown'} closeout`,
        diff: `Auto-approved: journal ${draftJournal.entryNumber} + invoice ${invoiceId}`,
      });
    }

    return _appendAuditLog({
      ...p,
      appointments: nextAppointments,
      agentRuns: [runRecord, ...(p.agentRuns || [])].slice(0, 200),
      agentSuggestions: [suggestion, ...(p.agentSuggestions || [])].slice(0, 200),
    }, {
      actor, actorRole: 'ai_agent', action: 'created', resourceType: 'closeoutAgent',
      resourceId: runId, resourceLabel: `${appointment.client || 'Unknown'} closeout`,
      diff: `Drafted journal ${draftJournal.entryNumber} + invoice ${invoiceId} — pending approval`,
    });
  });

  // ── AI-Enhanced Async Closeout Agent ─────────────────────────────────────
  // Note: DataContext.jsx wraps this with useCallback([]) for memoization.
  const runCloseoutAgentWithAI = async (appointmentId, actor = 'Closeout Agent') => {
    const currentData = getData();
    const appointment = (currentData?.appointments || []).find(
      (apt) => String(apt.id) === String(appointmentId)
    );

    const stateCode = currentData?.settings?.currentStateCode || 'WA';
    const stateRules = STATE_RULES[stateCode];

    let aiDraft = null;
    try {
      aiDraft = await generateCloseoutDraft(appointment, stateCode, stateRules);
    } catch (e) {
      console.warn('[runCloseoutAgentWithAI] AI draft failed, using fallback:', e);
    }

    setData((p) => {
      const apt = (p.appointments || []).find((a) => String(a.id) === String(appointmentId));
      if (!apt) return p;

      const autoCloseoutEnabled = p.settings?.enableAutoCloseoutAgent !== false;
      if (!autoCloseoutEnabled) return p;
      let autonomyMode = p.settings?.autonomyMode || 'assistive';
      const sc = p.settings?.currentStateCode || 'WA';
      const schedule = (p.feeSchedules || []).find((fee) => fee.stateCode === sc && fee.actType === 'Acknowledgment');
      const suggestedAmount = parseMoneyLike(apt.amount) ?? 0;
      const maxFee = parseMoneyLike(schedule?.maxFee);
      const invoiceAmount = maxFee == null ? suggestedAmount : Math.min(suggestedAmount, maxFee);

      const nowIso = new Date().toISOString();
      const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      const runId = `AGENT-${Date.now()}`;
      const journalId = Date.now() + Math.floor(Math.random() * 999);

      const detectedActType = aiDraft?.documentType
        || apptTypeToActType(apt.type);

      const draftJournal = {
        id: journalId,
        entryNumber: `JE-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        date: apt.date || todayISO,
        time: apt.time?.replace(' PM', '').replace(' AM', '') || '09:00',
        actType: detectedActType,
        signerName: apt.client || '',
        signerAddress: apt.address || apt.location || '',
        idType: "Driver's License",
        idIssuingState: sc,
        idLast4: '',
        idExpiration: '',
        fee: invoiceAmount,
        thumbprintTaken: false,
        witnessRequired: false,
        notes: aiDraft?.journalNotes || `Drafted by closeout agent from appointment #${apt.id}.`,
        documentDescription: aiDraft?.documentDescription || apt.type || 'Notary appointment',
        linkedAppointmentId: apt.id,
        linkedInvoiceId: invoiceId,
        aiGenerated: aiDraft?.aiGenerated || false,
        qualityScore: 65,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const draftInvoice = {
        id: invoiceId,
        client: apt.client || 'Unknown',
        amount: invoiceAmount,
        date: new Date(nowIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        due: apt.date || todayISO,
        status: 'Pending',
        notes: aiDraft?.invoiceNotes || `Notary services rendered for ${apt.type || 'appointment'}.`,
        sourceAppointmentId: apt.id,
        createdAt: nowIso,
        sentAt: null,
        paymentLink: '',
      };

      const complianceResult = checkCompliance(draftJournal, sc);
      const missingFields = complianceResult.missingRequired.map((m) => m.field);
      const complianceWarnings = complianceResult.allIssues.map((i) => i.message);
      const aiBoost = aiDraft?.aiConfidenceBoost || 0;
      const confidenceScore = Math.min(100, complianceResult.score + aiBoost);

      const runRecord = {
        id: runId,
        appointmentId: apt.id,
        appointmentClient: apt.client || 'Unknown',
        actor,
        ranAt: nowIso,
        aiGenerated: aiDraft?.aiGenerated || false,
        actions: [
          { type: 'journal_drafted', refId: journalId },
          { type: 'invoice_drafted', refId: invoiceId },
        ],
        warnings: complianceWarnings.slice(0, 5),
      };

      const nextAppointments = (p.appointments || []).map((a) =>
        String(a.id) !== String(appointmentId) ? a : {
          ...a, status: 'completed', agentCloseoutRunId: runId,
          linkedInvoiceId: invoiceId, linkedJournalEntryId: journalId,
          closeoutCompletedAt: nowIso,
        }
      );

      const suggestion = {
        id: runId,
        type: 'closeout',
        status: 'pending',
        autonomyMode,
        appointmentId: apt.id,
        appointmentClient: apt.client || 'Unknown',
        actor,
        ranAt: nowIso,
        createdAt: nowIso,
        label: `Closeout — ${apt.client || 'Unknown'}`,
        actions: runRecord.actions,
        warnings: runRecord.warnings,
        missingFields,
        complianceIssues: complianceResult.allIssues,
        confidenceScore,
        stateCode: sc,
        stateName: complianceResult.stateName,
        aiGenerated: aiDraft?.aiGenerated || false,
        draftJournal,
        draftInvoice,
        diff: `Journal ${draftJournal.entryNumber} + Invoice ${invoiceId}\nFee: $${invoiceAmount}\nState: ${sc}`,
        wasEdited: false,
      };

      const threshold = p.settings?.confidenceThreshold ?? 85;
      const requireWarningApproval = p.settings?.requireApprovalForWarnings ?? true;
      const hasWarnings = (suggestion.warnings || []).length > 0;

      if (autonomyMode === 'supervised') {
        const meetsConfidence = (suggestion.confidenceScore || 0) >= threshold;
        const warningBlocks = requireWarningApproval && hasWarnings;
        if (meetsConfidence && !warningBlocks) {
          autonomyMode = 'autonomous';
        }
      }

      if (autonomyMode === 'autonomous') {
        return _appendAuditLog({
          ...p,
          appointments: nextAppointments,
          invoices: [draftInvoice, ...(p.invoices || [])],
          journalEntries: [draftJournal, ...(p.journalEntries || [])],
          agentRuns: [runRecord, ...(p.agentRuns || [])].slice(0, 200),
          agentSuggestions: [{ ...suggestion, status: 'approved', approvedAt: nowIso }, ...(p.agentSuggestions || [])].slice(0, 200),
        }, { actor, actorRole: 'ai_agent', action: 'created', resourceType: 'closeoutAgent', resourceId: runId, resourceLabel: `${apt.client || 'Unknown'} closeout`, diff: `Auto-approved: journal ${draftJournal.entryNumber} + invoice ${invoiceId}` });
      }

      return _appendAuditLog({
        ...p,
        appointments: nextAppointments,
        agentRuns: [runRecord, ...(p.agentRuns || [])].slice(0, 200),
        agentSuggestions: [suggestion, ...(p.agentSuggestions || [])].slice(0, 200),
      }, { actor, actorRole: 'ai_agent', action: 'created', resourceType: 'closeoutAgent', resourceId: runId, resourceLabel: `${apt.client || 'Unknown'} closeout`, diff: `AI-drafted journal ${draftJournal.entryNumber} + invoice ${invoiceId} — pending approval` });
    });
  };

  // ── Approve / Reject / Edit Agent Suggestion ──────────────────────────────
  const approveAgentSuggestion = (id) => setData((p) => {
    const suggestion = (p.agentSuggestions || []).find((s) => s.id === id);
    if (!suggestion || suggestion.status !== 'pending') return p;
    const nowIso = new Date().toISOString();
    const updated = (p.agentSuggestions || []).map((s) =>
      s.id === id ? { ...s, status: 'approved', approvedAt: nowIso } : s
    );

    if (suggestion.type === 'aging_ar') {
      const sentReminder = {
        id: `REM-${Date.now()}`,
        invoiceId: suggestion.invoiceId,
        clientName: suggestion.appointmentClient,
        amount: suggestion.invoiceAmount,
        type: 'reminder_sent',
        scheduledFor: nowIso,
        status: 'sent',
        createdAt: nowIso,
      };
      const updatedInvoices = (p.invoices || []).map((inv) =>
        inv.id === suggestion.invoiceId ? { ...inv, status: 'Overdue', reminderSentAt: nowIso } : inv
      );
      return _appendAuditLog({
        ...p,
        invoices: updatedInvoices,
        reminderQueue: [sentReminder, ...(p.reminderQueue || [])],
        agentSuggestions: updated,
      }, {
        actor: p.settings?.name || 'User', actorRole: p.settings?.userRole || 'owner',
        action: 'approved', resourceType: 'agentSuggestion', resourceId: id,
        resourceLabel: suggestion.label || 'Aging AR draft',
        diff: `Sent reminder for invoice ${suggestion.invoiceId}`,
      });
    }

    if (suggestion.type === 'lead_intake') {
      return _appendAuditLog({
        ...p,
        clients: suggestion.draftClient ? [suggestion.draftClient, ...(p.clients || [])] : (p.clients || []),
        appointments: suggestion.draftAppointment ? [suggestion.draftAppointment, ...(p.appointments || [])] : (p.appointments || []),
        agentSuggestions: updated,
      }, {
        actor: p.settings?.name || 'User', actorRole: p.settings?.userRole || 'owner',
        action: 'approved', resourceType: 'agentSuggestion', resourceId: id,
        resourceLabel: suggestion.label || 'Lead intake draft',
        diff: `Created client ${suggestion.draftClient?.name} + appointment`,
      });
    }

    const reminders = [];
    if (suggestion.draftInvoice) {
      const dueDate = new Date(suggestion.draftInvoice.due || nowIso);
      const followupDate = new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const overdueDate = new Date(dueDate.getTime() + 21 * 24 * 60 * 60 * 1000);
      reminders.push(
        {
          id: `REM-${Date.now()}-1`,
          invoiceId: suggestion.draftInvoice.id,
          clientName: suggestion.draftInvoice.client,
          amount: suggestion.draftInvoice.amount,
          type: 'initial_followup',
          scheduledFor: followupDate.toISOString(),
          status: 'pending',
          createdAt: nowIso,
        },
        {
          id: `REM-${Date.now()}-2`,
          invoiceId: suggestion.draftInvoice.id,
          clientName: suggestion.draftInvoice.client,
          amount: suggestion.draftInvoice.amount,
          type: 'overdue_notice',
          scheduledFor: overdueDate.toISOString(),
          status: 'pending',
          createdAt: nowIso,
        }
      );
    }

    return _appendAuditLog({
      ...p,
      journalEntries: suggestion.draftJournal ? [suggestion.draftJournal, ...(p.journalEntries || [])] : (p.journalEntries || []),
      invoices: suggestion.draftInvoice ? [suggestion.draftInvoice, ...(p.invoices || [])] : (p.invoices || []),
      reminderQueue: [...reminders, ...(p.reminderQueue || [])],
      agentSuggestions: updated,
    }, {
      actor: p.settings?.name || 'User', actorRole: p.settings?.userRole || 'owner',
      action: 'approved', resourceType: 'agentSuggestion', resourceId: id,
      resourceLabel: suggestion.label || 'Agent draft',
      diff: `Approved — journal + invoice committed${reminders.length ? ' + 2 reminders queued' : ''}`,
    });
  });

  const rejectAgentSuggestion = (id) => setData((p) => {
    const suggestion = (p.agentSuggestions || []).find((s) => s.id === id);
    const nowIso = new Date().toISOString();
    const updated = (p.agentSuggestions || []).map((s) =>
      s.id === id ? { ...s, status: 'rejected', rejectedAt: nowIso } : s
    );
    return _appendAuditLog({ ...p, agentSuggestions: updated }, {
      actor: p.settings?.name || 'User', actorRole: p.settings?.userRole || 'owner',
      action: 'rejected', resourceType: 'agentSuggestion', resourceId: id,
      resourceLabel: suggestion?.label || 'Agent draft', diff: 'Draft rejected by user',
    });
  });

  const editAgentSuggestion = (id, changes) => setData((p) => {
    const updated = (p.agentSuggestions || []).map((s) =>
      s.id === id ? { ...s, ...changes, wasEdited: true, editedAt: new Date().toISOString() } : s
    );
    return { ...p, agentSuggestions: updated };
  });

  // ── Autonomy Roadmap ──────────────────────────────────────────────────────
  const updateAutonomyRoadmap = (updater) => setData((p) => {
    const current = p.autonomyRoadmap || {};
    const next = typeof updater === 'function' ? updater(current) : { ...current, ...(updater || {}) };
    return { ...p, autonomyRoadmap: { ...current, ...next, updatedAt: new Date().toISOString() } };
  });

  // ── Aging AR Agent ────────────────────────────────────────────────────────
  const runAgingARAgent = () => setData((p) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingARSuggestions = new Set(
      (p.agentSuggestions || [])
        .filter((s) => s.type === 'aging_ar' && s.status === 'pending')
        .map((s) => s.invoiceId)
    );

    const overdueInvoices = (p.invoices || []).filter((inv) => {
      if (existingARSuggestions.has(inv.id)) return false;
      if (!['Pending', 'Overdue'].includes(inv.status)) return false;
      const dueDate = new Date(inv.due);
      return !isNaN(dueDate.getTime()) && dueDate < today;
    });

    if (overdueInvoices.length === 0) return p;

    const nowIso = new Date().toISOString();
    const newSuggestions = overdueInvoices.map((inv) => {
      const dueDate = new Date(inv.due);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      return {
        id: `AR-${inv.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'aging_ar',
        status: 'pending',
        label: `Overdue Invoice — ${inv.client}`,
        appointmentClient: inv.client,
        ranAt: nowIso,
        createdAt: nowIso,
        actor: 'Aging AR Agent',
        invoiceId: inv.id,
        invoiceAmount: inv.amount,
        daysOverdue,
        diff: `Invoice ${inv.id} — $${inv.amount} — ${daysOverdue} days overdue`,
        actions: [{ type: 'reminder_drafted', refId: inv.id }],
        confidenceScore: 90,
        warnings: [],
        missingFields: [],
      };
    });

    return {
      ...p,
      agentSuggestions: [...newSuggestions, ...(p.agentSuggestions || [])].slice(0, 200),
    };
  });

  // Alias for AgentPage playbook launcher
  const runARScan = () => runAgingARAgent();

  // ── Lead Intake Agent ─────────────────────────────────────────────────────
  const runLeadIntakeAgent = async (rawText) => {
    if (!rawText?.trim()) return;
    const parsed = await parseLeadText(rawText);
    const nowIso = new Date().toISOString();
    const id = `LEAD-${Date.now()}`;
    const clientId = `C-${Date.now()}`;
    const apptId = Date.now() + 1;

    const suggestion = {
      id,
      type: 'lead_intake',
      status: 'pending',
      label: `New Lead — ${parsed.clientName || 'Unknown'}`,
      appointmentClient: parsed.clientName || 'Unknown',
      ranAt: nowIso,
      createdAt: nowIso,
      actor: 'Lead Intake Agent',
      rawText,
      draftClient: {
        id: clientId,
        name: parsed.clientName || '',
        phone: parsed.phone || '',
        email: parsed.email || '',
        type: 'Individual',
        status: 'Active',
      },
      draftAppointment: {
        id: apptId,
        client: parsed.clientName || '',
        type: parsed.serviceType || 'Notary Appointment',
        date: parsed.suggestedDate || '',
        time: parsed.suggestedTime || '',
        location: parsed.location || '',
        amount: parsed.estimatedFee || 0,
        status: 'upcoming',
        notes: parsed.notes || '',
      },
      confidenceScore: parsed.confidence || 70,
      diff: `Client: ${parsed.clientName || 'Unknown'}\nService: ${parsed.serviceType || 'TBD'}\nDate: ${parsed.suggestedDate || 'TBD'}`,
      actions: [{ type: 'client_drafted', refId: clientId }, { type: 'appointment_drafted', refId: String(apptId) }],
      warnings: [],
      missingFields: [],
      aiGenerated: true,
    };

    setData((p) => ({
      ...p,
      agentSuggestions: [suggestion, ...(p.agentSuggestions || [])].slice(0, 200),
    }));
  };

  // ── Auto AR Scan on Mount ─────────────────────────────────────────────────
  // Note: DataContext.jsx wraps this with useCallback([]) for memoization.
  const checkAutoScanAR = () => {
    setData((p) => {
      if (!p.settings?.autoScanAR) return p;
      const today = new Date().toISOString().split('T')[0];
      if (p.settings?.autoScanAR_lastRun === today) return p;
      const updated = { ...p, settings: { ...p.settings, autoScanAR_lastRun: today } };
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const existingARSuggestions = new Set(
        (updated.agentSuggestions || [])
          .filter((s) => s.type === 'aging_ar' && s.status === 'pending')
          .map((s) => s.invoiceId)
      );
      const overdueInvoices = (updated.invoices || []).filter((inv) => {
        if (existingARSuggestions.has(inv.id)) return false;
        if (!['Pending', 'Overdue'].includes(inv.status)) return false;
        const dueDate = new Date(inv.due);
        return !isNaN(dueDate.getTime()) && dueDate < todayDate;
      });
      if (overdueInvoices.length === 0) return updated;
      const nowIso = new Date().toISOString();
      const newSuggestions = overdueInvoices.map((inv) => {
        const dueDate = new Date(inv.due);
        const daysOverdue = Math.floor((todayDate - dueDate) / (1000 * 60 * 60 * 24));
        return {
          id: `AR-${inv.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'aging_ar', status: 'pending',
          label: `Overdue Invoice — ${inv.client}`,
          appointmentClient: inv.client, ranAt: nowIso, createdAt: nowIso,
          actor: 'Aging AR Agent (Auto)', invoiceId: inv.id, invoiceAmount: inv.amount,
          daysOverdue, diff: `Invoice ${inv.id} — $${inv.amount} — ${daysOverdue} days overdue`,
          actions: [{ type: 'reminder_drafted', refId: inv.id }],
          confidenceScore: 90, warnings: [], missingFields: [],
        };
      });
      return { ...updated, agentSuggestions: [...newSuggestions, ...(updated.agentSuggestions || [])].slice(0, 200) };
    });
  };

  // ── Weekly Digest ─────────────────────────────────────────────────────────
  // Note: DataContext.jsx wraps this with useCallback([]) for memoization.
  const generateWeeklySummary = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const snap = getData();

    const sevenDaysAgoISO = sevenDaysAgo.toISOString();
    const appointmentsCompleted = (snap.appointments || []).filter((a) =>
      a.status === 'completed' && a.closeoutCompletedAt && a.closeoutCompletedAt >= sevenDaysAgoISO
    ).length;
    const invoicesCreated = (snap.invoices || []).filter((i) =>
      i.createdAt && i.createdAt >= sevenDaysAgoISO
    ).length;
    const totalRevenue = (snap.invoices || [])
      .filter((i) => i.createdAt && i.createdAt >= sevenDaysAgoISO)
      .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    const remindersSent = (snap.reminderQueue || []).filter((r) =>
      r.status === 'sent' && r.createdAt && r.createdAt >= sevenDaysAgoISO
    ).length;
    const complianceWarnings = (snap.agentRuns || []).filter((r) =>
      r.ranAt && r.ranAt >= sevenDaysAgoISO && (r.warnings || []).length > 0
    ).length;
    const pendingSuggestions = (snap.agentSuggestions || []).filter((s) => s.status === 'pending').length;

    const stats = { appointmentsCompleted, invoicesCreated, totalRevenue, remindersSent, complianceWarnings, pendingSuggestions };
    const narrative = await generateWeeklySummaryAI(stats, snap.settings?.name);
    const result = { stats, narrative, generatedAt: new Date().toISOString() };

    setData((p) => ({ ...p, weeklyDigest: result }));
    return result;
  };

  return {
    runCloseoutAgent,
    runCloseoutAgentWithAI,
    approveAgentSuggestion,
    rejectAgentSuggestion,
    editAgentSuggestion,
    updateAutonomyRoadmap,
    runAgingARAgent,
    runARScan,
    runLeadIntakeAgent,
    checkAutoScanAR,
    generateWeeklySummary,
  };
}
