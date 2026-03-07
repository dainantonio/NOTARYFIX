// src/components/AgentActivityFeed.jsx
// Shared agent activity timeline — used in Dashboard and AgentPage.
// Shows what the agent did, why, confidence, citations, and outcome.
// No accordion. Every run is readable at a glance.

import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronRight, BookOpen, Zap, FileText, ScrollText,
} from 'lucide-react';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const confidenceTier = (score) => {
  if (score >= 85) return { label: 'High',   color: 'text-emerald-400', bar: 'bg-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  if (score >= 65) return { label: 'Good',   color: 'text-blue-400',    bar: 'bg-blue-500',    bg: 'bg-blue-500/10 border-blue-500/20'       };
  if (score >= 45) return { label: 'Fair',   color: 'text-amber-400',   bar: 'bg-amber-500',   bg: 'bg-amber-500/10 border-amber-500/20'     };
  return               { label: 'Low',    color: 'text-red-400',     bar: 'bg-red-500',     bg: 'bg-red-500/10 border-red-500/20'         };
};

const statusConfig = {
  approved: { Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Approved' },
  rejected: { Icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Rejected' },
  pending:  { Icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Pending'  },
};

// ─── CONFIDENCE BAR ───────────────────────────────────────────────────────────
const ConfidenceBar = ({ score = 65 }) => {
  const tier = confidenceTier(score);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[64px]">
        <div className={`h-full rounded-full transition-all ${tier.bar}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-[10px] font-bold ${tier.color}`}>{score}%</span>
      <span className="text-[10px] text-slate-600">{tier.label}</span>
    </div>
  );
};

// ─── CITATION CHIPS ───────────────────────────────────────────────────────────
const CitationChips = ({ citations = [] }) => {
  if (!citations.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {citations.slice(0, 3).map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400">
          <BookOpen className="h-2.5 w-2.5" />
          {c.label || c.source || `${c.state} — ${c.actType}`}
        </span>
      ))}
    </div>
  );
};

// ─── REASONING LINE ───────────────────────────────────────────────────────────
// Builds a human-readable "why" sentence from the run record
const buildReasoning = (run) => {
  const parts = [];
  if (run.stateCode) parts.push(`${run.stateCode} fee schedule applied`);
  if (run.diffData?.fee) parts.push(`fee set to $${Number(run.diffData.fee).toFixed(0)}`);
  if (run.diffData?.actType) parts.push(`act type: ${run.diffData.actType}`);
  if (run.aiGenerated) parts.push('AI-enhanced draft');
  if (!parts.length && run.diff) return run.diff;
  return parts.join(' · ');
};

// ─── SINGLE FEED ITEM ─────────────────────────────────────────────────────────
const FeedItem = ({ run, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const status  = statusConfig[run.status] || statusConfig.pending;
  const score   = run.confidenceScore ?? run.qualityScore ?? 65;
  const tier    = confidenceTier(score);
  const reason  = buildReasoning(run);
  const hasWarnings = (run.warnings || []).length > 0;
  const hasMissing  = (run.missingFields || []).length > 0;
  const hasIssues   = hasWarnings || hasMissing;

  return (
    <div
      className={`group relative border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02] ${compact ? 'py-2.5 px-4' : 'py-3.5 px-5'}`}
    >
      {/* Left accent line by confidence */}
      <div className={`absolute left-0 top-0 bottom-0 w-[2px] rounded-r ${tier.bar} opacity-60`} />

      <div className="flex items-start gap-3">
        {/* Agent icon */}
        <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          {run.aiGenerated
            ? <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            : <Zap className="h-3.5 w-3.5 text-blue-400" />
          }
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: client + status + time */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[13px] font-semibold text-slate-100 truncate">
                {run.appointmentClient || 'Unknown Signer'}
              </span>
              {run.diffData?.serviceType && (
                <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                  · {run.diffData.serviceType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasIssues && <AlertTriangle className="h-3 w-3 text-amber-500" />}
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${tier.bg} ${tier.color}`}>
                {score}% confidence
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.bg} ${status.color}`}>
                <status.Icon className="h-2.5 w-2.5" />
                {status.label}
              </span>
              <span className="text-[10px] text-slate-600">{timeAgo(run.ranAt || run.createdAt)}</span>
            </div>
          </div>

          {/* Row 2: reasoning */}
          {reason && (
            <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">{reason}</p>
          )}

          {/* Row 3: confidence bar + actions */}
          {!compact && (
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              <ConfidenceBar score={score} />
              <div className="flex items-center gap-1.5 flex-wrap">
                {(run.actions || []).map((a, i) => (
                  <span key={i} className="text-[10px] text-slate-500 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">
                    {a.type === 'journal_drafted' ? '📓 Journal' : a.type === 'invoice_drafted' ? '🧾 Invoice' : a.type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Citation chips */}
          {!compact && <CitationChips citations={run.citations || []} />}

          {/* Expandable warnings / missing fields */}
          {hasIssues && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 mt-1.5 text-[10px] text-amber-500 hover:text-amber-400 transition-colors"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              {(run.warnings?.length || 0) + (run.missingFields?.length || 0)} issue{((run.warnings?.length || 0) + (run.missingFields?.length || 0)) > 1 ? 's' : ''} flagged
              <ChevronRight className={`h-2.5 w-2.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          )}
          {expanded && hasIssues && (
            <div className="mt-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2 space-y-0.5">
              {(run.warnings || []).map((w, i) => (
                <p key={i} className="text-[11px] text-amber-400">⚠ {w}</p>
              ))}
              {(run.missingFields || []).map((f, i) => (
                <p key={i} className="text-[11px] text-slate-500">Missing: {f}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
// props:
//   runs        — array of agentRun records
//   maxItems    — max to show (default 10)
//   compact     — bool, reduces padding for sidebar / dashboard use
//   emptyLabel  — string shown when no runs
//   onViewAll   — optional callback for "View all" link
export const AgentActivityFeed = ({
  runs = [],
  maxItems = 10,
  compact = false,
  emptyLabel = 'No agent runs yet. Complete an appointment to trigger the closeout agent.',
  onViewAll,
}) => {
  const sorted = [...runs]
    .sort((a, b) => new Date(b.ranAt || b.createdAt || 0) - new Date(a.ranAt || a.createdAt || 0))
    .slice(0, maxItems);

  if (!sorted.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
          <Sparkles className="h-5 w-5 text-violet-400/50" />
        </div>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">{emptyLabel}</p>
        {onViewAll && (
          <button onClick={onViewAll} className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Go to Command Center →
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-white/[0.04]">
        {sorted.map((run) => (
          <FeedItem key={run.id} run={run} compact={compact} />
        ))}
      </div>
      {runs.length > maxItems && onViewAll && (
        <button onClick={onViewAll}
          className="w-full py-2.5 text-[11px] text-slate-500 hover:text-slate-300 font-medium border-t border-white/[0.04] transition-colors text-center">
          View all {runs.length} runs in Command Center →
        </button>
      )}
    </div>
  );
};

export default AgentActivityFeed;
