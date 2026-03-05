// src/components/AgentSuggestionCard.jsx
// Phase 1 — Suggestion card: Approve / Edit / Reject with confidence + missing fields
import React, { useState } from 'react';
import { useFeedbackLoop } from '../hooks/useFeedbackLoop';
import { CheckCircle2, XCircle, Pencil, ChevronDown, ChevronUp, AlertTriangle, Sparkles, Clock, FileText, Receipt, UserPlus, DollarSign, Bell, Phone, Mail, MapPin, Calendar, Save, X, BookOpen, ExternalLink } from 'lucide-react';

const CONFIDENCE_COLORS = {
  high:   { bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
  medium: { bar: 'bg-amber-400',   text: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800'   },
  low:    { bar: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-900/20',    border: 'border-rose-200 dark:border-rose-800'    },
};

const confidenceTier = (score) => score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';

const MISSING_FIELD_LABELS = {
  idType:        'Signer ID type',
  idLast4:       'ID last 4 digits',
  idExpiration:  'ID expiration date',
  idIssuingState:'ID issuing state',
  signerAddress: 'Signer address',
  thumbprintTaken: 'Thumbprint confirmation',
  documentDescription: 'Document description',
};

const ActionIcon = ({ type }) => {
  if (type === 'journal_drafted') return <FileText className="h-3.5 w-3.5 text-blue-500" />;
  if (type === 'invoice_drafted') return <Receipt className="h-3.5 w-3.5 text-emerald-500" />;
  if (type === 'reminder_drafted') return <Clock className="h-3.5 w-3.5 text-violet-500" />;
  if (type === 'client_drafted') return <UserPlus className="h-3.5 w-3.5 text-blue-500" />;
  if (type === 'appointment_drafted') return <Calendar className="h-3.5 w-3.5 text-violet-500" />;
  return <Sparkles className="h-3.5 w-3.5 text-slate-400" />;
};

const ActionLabel = ({ type }) => {
  const labels = {
    journal_drafted: 'Journal entry drafted',
    invoice_drafted: 'Invoice drafted',
    reminder_drafted: 'Reminder queued',
    client_drafted: 'Client created',
    appointment_drafted: 'Appointment drafted',
  };
  return <span>{labels[type] || type}</span>;
};


// ── Citation chips — grounded policy links ────────────────────────────────────
const CitationChips = ({ citations = [] }) => {
  if (!citations.length) return null;
  return (
    <div className="mx-4 mb-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5 flex items-center gap-1">
        <BookOpen className="h-3 w-3" />
        Policy citations
      </p>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c) => (
          <span
            key={c.policyId}
            title={c.lastUpdated ? `Updated ${new Date(c.lastUpdated).toLocaleDateString()}` : undefined}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-400"
          >
            <span className="font-semibold text-slate-700 dark:text-slate-300">{c.label}:</span>
            {c.value}
            {c.officialSourceUrl && (
              <a
                href={c.officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ml-0.5 text-blue-400 hover:text-blue-600"
              >
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

// FIX 4: Split onEdit into onOpenEdit (navigate) and onPatchDraft (id+patch save)
// Keep onEdit for backward compat with legacy callers.
export const AgentSuggestionCard = ({ suggestion, onApprove, onOpenEdit, onPatchDraft, onEdit, onReject }) => {
  const [expanded, setExpanded] = useState(false);
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editedFields, setEditedFields] = useState({
    actType: suggestion.draftJournal?.actType || '',
    fee: suggestion.draftJournal?.fee || '',
    notes: suggestion.draftJournal?.notes || '',
    documentDescription: suggestion.draftJournal?.documentDescription || '',
  });

  const score = suggestion.confidenceScore ?? 65;
  // Feedback loop — record when user saves edits to AI drafts
  const { recordEdit } = useFeedbackLoop({ addFeedback: null, feedbackHistory: [] });
  const tier = confidenceTier(score);
  const colors = CONFIDENCE_COLORS[tier];
  const missingFields = suggestion.missingFields || [];
  const hasWarnings = missingFields.length > 0 || (suggestion.warnings || []).length > 0;

  const isAgingAR = suggestion.type === 'aging_ar';
  const isLeadIntake = suggestion.type === 'lead_intake';

  const handleSaveEdits = () => {
    // FIX 4: use onPatchDraft for saving inline edits (id + patch pattern)
    // Falls back gracefully — does not call navigate-based onEdit with wrong args
    const patch = {
      draftJournal: {
        ...suggestion.draftJournal,
        actType: editedFields.actType,
        fee: parseFloat(editedFields.fee) || suggestion.draftJournal?.fee,
        notes: editedFields.notes,
        documentDescription: editedFields.documentDescription,
      },
    };
    if (typeof onPatchDraft === 'function') {
      onPatchDraft(suggestion.id, patch);
    }
    // Record the diff for feedback loop (adjusts future confidence scores)
    recordEdit(suggestion, patch.draftJournal || {});
    setIsEditingInline(false);
  };

  const handleCancelEdits = () => {
    setEditedFields({
      actType: suggestion.draftJournal?.actType || '',
      fee: suggestion.draftJournal?.fee || '',
      notes: suggestion.draftJournal?.notes || '',
      documentDescription: suggestion.draftJournal?.documentDescription || '',
    });
    setIsEditingInline(false);
  };

  // Aging AR card
  if (isAgingAR) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 shadow-sm overflow-hidden transition-all">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 mt-0.5">
            <Receipt className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                {suggestion.label || 'Overdue Invoice'}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                {suggestion.daysOverdue} days overdue
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {suggestion.appointmentClient} · Invoice {suggestion.invoiceId} · ${suggestion.invoiceAmount}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {suggestion.actor} · {new Date(suggestion.ranAt || suggestion.createdAt || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-amber-200/60 dark:border-amber-700/40 px-4 py-3">
          <button
            onClick={() => onReject?.(suggestion)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            Dismiss
          </button>
          <button
            onClick={() => onApprove?.(suggestion)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Send Reminder
          </button>
        </div>
      </div>
    );
  }

  // Lead intake card
  if (isLeadIntake) {
    const dc = suggestion.draftClient || {};
    const da = suggestion.draftAppointment || {};
    return (
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm overflow-hidden transition-all">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 mt-0.5">
            <UserPlus className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                {suggestion.label || 'New Lead'}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                {score}% confidence
              </span>
              {suggestion.aiGenerated && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                  ✦ AI Parsed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {suggestion.actor} · {new Date(suggestion.ranAt || suggestion.createdAt || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>

        {expanded && (
          <div className="mx-4 mb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-blue-100 dark:border-blue-900 bg-white dark:bg-slate-900 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-400 mb-2">Client Info</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200">
                    <UserPlus className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    <span className="font-medium">{dc.name || '—'}</span>
                  </div>
                  {dc.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      {dc.phone}
                    </div>
                  )}
                  {dc.email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {dc.email}
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 dark:border-blue-900 bg-white dark:bg-slate-900 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-400 mb-2">Appointment</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200">
                    <FileText className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    <span className="font-medium">{da.type || '—'}</span>
                  </div>
                  {da.date && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      {da.date}{da.time ? ` · ${da.time}` : ''}
                    </div>
                  )}
                  {da.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {da.location}
                    </div>
                  )}
                  {da.amount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <DollarSign className="h-3 w-3 flex-shrink-0" />
                      ${da.amount}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {suggestion.rawText && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                <button
                  onClick={() => setSourceExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Source text
                  {sourceExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {sourceExpanded && (
                  <pre className="px-3 pb-3 text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap font-mono">{suggestion.rawText}</pre>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-blue-200/60 dark:border-blue-700/40 px-4 py-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Hide details' : 'View details'}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReject?.(suggestion)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
            <button
              onClick={() => (onOpenEdit || onEdit)?.(suggestion)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={() => onApprove?.(suggestion)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Create Lead
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Closeout (default) card
  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} shadow-sm overflow-hidden transition-all`}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">
          <Sparkles className="h-5 w-5 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              {suggestion.label || 'Agent Draft'}
            </p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${colors.text} bg-white/60 dark:bg-black/20 border ${colors.border}`}>
              {score}% confidence
            </span>
            {suggestion.aiGenerated && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                ✦ AI Drafted
              </span>
            )}
            {suggestion.stateName && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {suggestion.stateName}
              </span>
            )}
            {suggestion.autonomyMode && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                {suggestion.autonomyMode}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {suggestion.appointmentClient} · {new Date(suggestion.ranAt || suggestion.createdAt || Date.now()).toLocaleString()}
          </p>

          {/* Confidence bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
            <div className={`h-1.5 rounded-full ${colors.bar} transition-all`} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>

      {/* Actions drafted */}
      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {(suggestion.actions || []).map((action, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200">
              <ActionIcon type={action.type} />
              <ActionLabel type={action.type} />
            </span>
          ))}
        </div>
      </div>

      {/* Compliance issues — rich display with fix instructions */}
      {hasWarnings && (
        <div className="mx-4 mb-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {(suggestion.complianceIssues || []).some(i => i.severity === 'error')
              ? 'Required fields missing — complete in journal before submitting'
              : 'Needs your review before approving'}
          </div>
          <ul className="space-y-1.5">
            {(suggestion.complianceIssues || []).map((issue, i) => (
              <li key={`ci-${i}`} className="flex items-start gap-2">
                <span className={`mt-0.5 text-xs font-bold flex-shrink-0 ${issue.severity === 'error' ? 'text-rose-500' : 'text-amber-500'}`}>
                  {issue.severity === 'error' ? '✕' : '!'}
                </span>
                <div>
                  <span className={`text-xs font-semibold ${issue.severity === 'error' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-300'}`}>
                    {MISSING_FIELD_LABELS[issue.field] || issue.field}
                  </span>
                  {issue.fix && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{issue.fix}</p>
                  )}
                </div>
              </li>
            ))}
            {!(suggestion.complianceIssues || []).length && missingFields.map((field) => (
              <li key={field} className="text-xs text-amber-700 dark:text-amber-300">
                · Missing: {MISSING_FIELD_LABELS[field] || field}
              </li>
            ))}
            {(suggestion.warnings || []).map((w, i) => (
              <li key={`w-${i}`} className="text-xs text-amber-600 dark:text-amber-400">· {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Inline editing section */}
      {isEditingInline && (
        <div className="mx-4 mb-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Edit Draft</p>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Service Type</label>
              <input
                type="text"
                value={editedFields.actType}
                onChange={(e) => setEditedFields({...editedFields, actType: e.target.value})}
                className="w-full mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fee</label>
              <input
                type="number"
                value={editedFields.fee}
                onChange={(e) => setEditedFields({...editedFields, fee: e.target.value})}
                className="w-full mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Document Description</label>
              <input
                type="text"
                value={editedFields.documentDescription}
                onChange={(e) => setEditedFields({...editedFields, documentDescription: e.target.value})}
                className="w-full mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea
                value={editedFields.notes}
                onChange={(e) => setEditedFields({...editedFields, notes: e.target.value})}
                rows={2}
                className="w-full mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdits}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              onClick={handleCancelEdits}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expandable diff / details */}
      {expanded && !isEditingInline && (
        <div className="mx-4 mb-2 space-y-2">
          {/* Structured diff — labeled fields */}
          {suggestion.diffData ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Agent actions</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {suggestion.diffData.signerName && (
                  <>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Signer</dt>
                    <dd className="text-xs font-semibold text-slate-800 dark:text-slate-100">{suggestion.diffData.signerName}</dd>
                  </>
                )}
                {suggestion.diffData.serviceType && (
                  <>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Service</dt>
                    <dd className="text-xs font-semibold text-slate-800 dark:text-slate-100">{suggestion.diffData.serviceType}</dd>
                  </>
                )}
                {suggestion.diffData.actType && (
                  <>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Act type</dt>
                    <dd className="text-xs font-semibold text-slate-800 dark:text-slate-100">{suggestion.diffData.actType}</dd>
                  </>
                )}
                {suggestion.diffData.date && (
                  <>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Date</dt>
                    <dd className="text-xs font-semibold text-slate-800 dark:text-slate-100">{suggestion.diffData.date}</dd>
                  </>
                )}
                {(suggestion.diffData.fee != null && suggestion.diffData.fee !== '') && (
                  <>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Fee</dt>
                    <dd className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">${Number(suggestion.diffData.fee).toFixed(2)}</dd>
                  </>
                )}
                {suggestion.diffData.state && (
                  <>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">State</dt>
                    <dd className="text-xs font-semibold text-slate-800 dark:text-slate-100">{suggestion.diffData.state}</dd>
                  </>
                )}
                {suggestion.diffData.journalEntry && (
                  <>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Journal</dt>
                    <dd className="text-xs font-semibold text-slate-800 dark:text-slate-100">{suggestion.diffData.journalEntry}</dd>
                  </>
                )}
                {suggestion.diffData.invoiceId && (
                  <>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Invoice</dt>
                    <dd className="text-xs font-semibold text-slate-800 dark:text-slate-100">{suggestion.diffData.invoiceId}</dd>
                  </>
                )}
                {suggestion.diffData.daysOverdue != null && (
                  <>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Days overdue</dt>
                    <dd className="text-xs font-semibold text-rose-600 dark:text-rose-400">{suggestion.diffData.daysOverdue}</dd>
                  </>
                )}
              </dl>
            </div>
          ) : suggestion.diff ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Agent actions</p>
              <pre className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono">{suggestion.diff}</pre>
            </div>
          ) : null}
          {suggestion.draftJournal?.notes && (
            <div className="rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-400 mb-1">
                {suggestion.aiGenerated ? '✦ AI-Written Journal Notes' : 'Journal Notes Draft'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{suggestion.draftJournal.notes}</p>
            </div>
          )}
          {suggestion.draftInvoice?.notes && (
            <div className="rounded-lg border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400 mb-1">Invoice Note</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{suggestion.draftInvoice.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Citation chips — grounded policy references */}
      {expanded && !isEditingInline && suggestion.citations?.length > 0 && (
        <CitationChips citations={suggestion.citations} />
      )}

      {/* Footer: actions */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-700/60 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? 'Hide details' : 'View details'}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onReject?.(suggestion)}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </button>
          <button
            onClick={() => setIsEditingInline(!isEditingInline)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            {isEditingInline ? 'Cancel Edit' : 'Edit'}
          </button>
          <button
            onClick={() => onApprove?.(suggestion)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Pending suggestions panel (for Dashboard embed) ─────────────────────────
// FIX 4: Added onOpenEdit and onPatchDraft forwarding
export const PendingSuggestionsPanel = ({ suggestions = [], onApprove, onOpenEdit, onPatchDraft, onEdit, onReject, onViewAll }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Agent Drafts
          </p>
          <span className="rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:text-violet-300">
            {suggestions.length}
          </span>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
            View all →
          </button>
        )}
      </div>
      {suggestions.slice(0, 3).map((s) => (
        <AgentSuggestionCard
          key={s.id}
          suggestion={s}
          onApprove={onApprove}
          onOpenEdit={onOpenEdit}
          onPatchDraft={onPatchDraft}
          onEdit={onEdit}
          onReject={onReject}
        />
      ))}
    </div>
  );
};

export default AgentSuggestionCard;
