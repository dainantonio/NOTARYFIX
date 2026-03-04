// src/pages/AuditPage.jsx
// Phase 3 — Full audit log viewer
import React, { useMemo, useState } from 'react';
import { ScrollText, Search, Bot, User, CheckCircle, XCircle, PlusCircle, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '../components/UI';
import { useData } from '../context/DataContext';

const DATE_FILTERS = [
  { label: 'Last 7d', days: 7 },
  { label: 'Last 30d', days: 30 },
  { label: 'Last 90d', days: 90 },
  { label: 'All time', days: null },
];

const RESOURCE_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'Auto-Closeout', label: 'Closeout Agent' },
  { value: 'agentSuggestion', label: 'Agent Suggestion' },
  { value: 'journalEntry', label: 'Journal Entry' },
  { value: 'invoice', label: 'Invoice' },
];

const ActorBadge = ({ actor, actorRole }) => {
  if (actorRole === 'ai_agent' || actor?.toLowerCase().includes('agent')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
        <Bot className="h-3 w-3" /> AI Agent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
      <User className="h-3 w-3" /> You
    </span>
  );
};

const ActionBadge = ({ action }) => {
  const map = {
    created:   'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    approved:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
    rejected:  'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700',
    edited:    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    updated:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    published: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    deleted:   'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  };
  const cls = map[action] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${cls}`}>
      {action}
    </span>
  );
};

const AuditEntry = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const diff = entry.diff || '';
  const truncated = diff.length > 80 ? diff.slice(0, 80) + '…' : diff;
  const needsExpand = diff.length > 80;

  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
      <div className="flex flex-wrap items-start gap-2 sm:gap-3">
        {/* Timestamp */}
        <div className="text-xs text-slate-400 whitespace-nowrap mt-0.5 min-w-[110px]">
          {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Actor */}
        <ActorBadge actor={entry.actor} actorRole={entry.actorRole} />

        {/* Action */}
        <ActionBadge action={entry.action} />

        {/* Resource label */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
            {entry.resourceLabel || entry.resourceType || 'Unknown resource'}
          </p>
          {diff && (
            <div className="mt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all">
                {expanded ? diff : truncated}
              </p>
              {needsExpand && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-0.5 flex items-center gap-0.5 text-[11px] text-blue-500 hover:text-blue-700"
                >
                  {expanded ? <><ChevronUp className="h-3 w-3" /> Less</> : <><ChevronDown className="h-3 w-3" /> More</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AuditPage = () => {
  const { data } = useData();
  const auditLog = data.adminAuditLog || [];

  const [daysFilter, setDaysFilter] = useState(30);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const cutoff = daysFilter ? new Date(Date.now() - daysFilter * 24 * 60 * 60 * 1000).toISOString() : null;
    return [...auditLog]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .filter((e) => {
        if (cutoff && e.timestamp < cutoff) return false;
        if (typeFilter !== 'all' && e.resourceType !== typeFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            (e.resourceLabel || '').toLowerCase().includes(q) ||
            (e.actor || '').toLowerCase().includes(q) ||
            (e.action || '').toLowerCase().includes(q) ||
            (e.diff || '').toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [auditLog, daysFilter, typeFilter, search]);

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 mx-auto max-w-[1400px] space-y-6 pb-24">
      {/* Hero */}
      <Card className="app-hero-card">
        <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Audit &amp; Compliance</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <ScrollText className="h-7 w-7 text-blue-300" />
              Audit Log
            </h1>
            <p className="mt-1 text-sm text-slate-200">Every agent action, approval, and edit — fully logged.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 text-sm font-bold text-blue-100">
            {auditLog.length} {auditLog.length === 1 ? 'entry' : 'entries'}
          </span>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          {/* Date range */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs font-medium">
            {DATE_FILTERS.map(({ label, days }) => (
              <button
                key={label}
                onClick={() => setDaysFilter(days)}
                className={`px-3 py-1.5 transition-colors ${
                  daysFilter === days
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Resource type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {RESOURCE_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="text-xs text-slate-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      {/* Log table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-4">
              <ScrollText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">No audit entries yet</p>
              <p className="text-sm text-slate-400 max-w-xs">Complete an appointment to start the log, or adjust your filters.</p>
            </div>
          ) : (
            filtered.map((entry) => <AuditEntry key={entry.id} entry={entry} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditPage;
