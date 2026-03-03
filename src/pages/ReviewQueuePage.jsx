// src/pages/ReviewQueuePage.jsx
// Dedicated review queue for all pending agent suggestions
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Filter, Inbox, Sparkles, FileText, Receipt, UserPlus, Bell, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataContext';
import { AgentSuggestionCard } from '../components/AgentSuggestionCard';

const TYPE_FILTERS = [
  { key: 'all',      label: 'All',        icon: Filter },
  { key: 'closeout', label: 'Closeouts',  icon: FileText },
  { key: 'ar',       label: 'AR / Reminders', icon: Receipt },
  { key: 'lead',     label: 'Lead Intake', icon: UserPlus },
];

const SORT_OPTIONS = [
  { key: 'oldest',     label: 'Oldest first'     },
  { key: 'newest',     label: 'Newest first'     },
  { key: 'confidence', label: 'Highest confidence' },
];

function typeGroup(suggestion) {
  const t = suggestion.type || '';
  if (t === 'closeout' || t.includes('closeout')) return 'closeout';
  if (t === 'ar_reminder' || t.includes('ar') || t.includes('reminder')) return 'ar';
  if (t === 'lead_intake' || t.includes('lead')) return 'lead';
  return 'other';
}

const TYPE_ICON = {
  closeout: FileText,
  ar:       Receipt,
  lead:     UserPlus,
  other:    Bell,
};

const TYPE_COLOR = {
  closeout: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  ar:       'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
  lead:     'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20',
  other:    'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700',
};

export default function ReviewQueuePage() {
  const { data, approveAgentSuggestion, rejectAgentSuggestion } = useData();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState('oldest');

  const allPending = useMemo(
    () => (data.agentSuggestions || []).filter(s => s.status === 'pending'),
    [data.agentSuggestions]
  );

  const counts = useMemo(() => {
    const c = { all: allPending.length, closeout: 0, ar: 0, lead: 0, other: 0 };
    allPending.forEach(s => { c[typeGroup(s)] = (c[typeGroup(s)] || 0) + 1; });
    return c;
  }, [allPending]);

  const filtered = useMemo(() => {
    let list = typeFilter === 'all' ? allPending : allPending.filter(s => typeGroup(s) === typeFilter);
    if (sortKey === 'oldest')     list = [...list].sort((a, b) => new Date(a.createdAt || a.ranAt || 0) - new Date(b.createdAt || b.ranAt || 0));
    if (sortKey === 'newest')     list = [...list].sort((a, b) => new Date(b.createdAt || b.ranAt || 0) - new Date(a.createdAt || a.ranAt || 0));
    if (sortKey === 'confidence') list = [...list].sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0));
    return list;
  }, [allPending, typeFilter, sortKey]);

  function handleApprove(suggestion) {
    approveAgentSuggestion?.(suggestion.id);
  }

  function handleReject(suggestion) {
    rejectAgentSuggestion?.(suggestion.id);
  }

  function handleEdit(suggestion) {
    // Route to relevant page for manual editing
    const t = typeGroup(suggestion);
    if (t === 'closeout') navigate('/journal');
    else if (t === 'ar') navigate('/invoices');
    else if (t === 'lead') navigate('/clients');
    else navigate('/agent');
  }

  const highConfidenceCount = filtered.filter(s => (s.confidenceScore ?? 0) >= 75).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Review Queue</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {allPending.length === 0 ? 'All caught up' : `${allPending.length} pending · ${highConfidenceCount} high-confidence`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/agent')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Command Center
            </button>
          </div>

          {/* Stat chips */}
          {allPending.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {[
                { label: 'Closeouts', key: 'closeout', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
                { label: 'AR / Reminders', key: 'ar', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
                { label: 'Lead Intake', key: 'lead', color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400' },
              ].filter(s => counts[s.key] > 0).map(s => (
                <span key={s.key} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
                  {counts[s.key]} {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-5 space-y-5">
        {/* Filter + Sort bar */}
        {allPending.length > 0 && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Type tabs */}
            <div className="flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {TYPE_FILTERS.filter(f => f.key === 'all' || counts[f.key] > 0).map(f => (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    typeFilter === f.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <f.icon className="h-3 w-3" />
                  {f.label}
                  {f.key !== 'all' && counts[f.key] > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {counts[f.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
        )}

        {/* Suggestions list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {allPending.length === 0 ? 'Queue is clear' : 'No items match this filter'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              {allPending.length === 0
                ? 'Complete an appointment or run an AR check to generate agent suggestions.'
                : 'Try switching to "All" to see all pending items.'}
            </p>
            {allPending.length === 0 && (
              <button
                onClick={() => navigate('/agent')}
                className="mt-5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Go to Command Center
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* High confidence banner */}
            {highConfidenceCount > 0 && sortKey === 'confidence' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                {highConfidenceCount} item{highConfidenceCount !== 1 ? 's' : ''} ready to approve with high confidence — review and one-tap approve.
              </div>
            )}

            {filtered.map(suggestion => (
              <AgentSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onApprove={handleApprove}
                onEdit={handleEdit}
                onReject={handleReject}
              />
            ))}

            {/* Bulk approve high-confidence CTA */}
            {highConfidenceCount >= 2 && (
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 mt-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {highConfidenceCount} high-confidence items
                  </span>
                </div>
                <button
                  onClick={() => {
                    filtered
                      .filter(s => (s.confidenceScore ?? 0) >= 75)
                      .forEach(s => approveAgentSuggestion?.(s.id));
                  }}
                  className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Approve all high-confidence
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
