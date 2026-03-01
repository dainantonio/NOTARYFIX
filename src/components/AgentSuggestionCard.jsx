// src/components/AgentSuggestionCard.jsx
// Phase 1 — Suggestion card: Approve / Edit / Reject with confidence + missing fields
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Pencil, ChevronDown, ChevronUp, AlertTriangle, Sparkles, Clock, FileText, Receipt } from 'lucide-react';

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
  return <Sparkles className="h-3.5 w-3.5 text-slate-400" />;
};

const ActionLabel = ({ type }) => {
  const labels = {
    journal_drafted: 'Journal entry drafted',
    invoice_drafted: 'Invoice drafted',
    reminder_drafted: 'Reminder queued',
  };
  return <span>{labels[type] || type}</span>;
};

export const AgentSuggestionCard = ({ suggestion, onApprove, onEdit, onReject }) => {
  const [expanded, setExpanded] = useState(false);
  const score = suggestion.confidenceScore ?? 65;
  const tier = confidenceTier(score);
  const colors = CONFIDENCE_COLORS[tier];
  const missingFields = suggestion.missingFields || [];
  const hasWarnings = missingFields.length > 0 || (suggestion.warnings || []).length > 0;

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

      {/* Warnings / missing fields */}
      {hasWarnings && (
        <div className="mx-4 mb-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Needs your review before approving
          </div>
          <ul className="space-y-0.5">
            {missingFields.map((field) => (
              <li key={field} className="text-xs text-amber-700 dark:text-amber-300">
                · Missing: {MISSING_FIELD_LABELS[field] || field}
              </li>
            ))}
            {(suggestion.warnings || []).map((w, i) => (
              <li key={`w-${i}`} className="text-xs text-amber-700 dark:text-amber-300">· {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable diff / details */}
      {expanded && suggestion.diff && (
        <div className="mx-4 mb-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Agent actions</p>
          <pre className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono">{suggestion.diff}</pre>
        </div>
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
            onClick={() => onEdit?.(suggestion)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
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
export const PendingSuggestionsPanel = ({ suggestions = [], onApprove, onEdit, onReject, onViewAll }) => {
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
          onEdit={onEdit}
          onReject={onReject}
        />
      ))}
    </div>
  );
};

export default AgentSuggestionCard;
