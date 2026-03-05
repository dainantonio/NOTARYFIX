// Phase 3 — Agent command center: weekly digest, playbooks, pending suggestions, run history, KPIs
import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, CheckCircle2, XCircle, Clock, TrendingUp, FileText,
  Receipt, AlertTriangle, ChevronDown, ChevronUp, Pencil, Activity,
  Zap, Shield, BarChart2, Settings2, BellRing, Bell, UserPlus, RefreshCw, Send, X,
  ScrollText, DollarSign, Calendar
} from 'lucide-react';
import { Card, CardContent, Button, Badge } from '../components/UI';
import { useData } from '../context/DataContext';
import { AgentSuggestionCard } from '../components/AgentSuggestionCard';
import { toast } from '../hooks/useLinker';
import { useAgentTriggers } from '../hooks/useAgentTriggers';

// ─── KPI card ────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color = 'text-slate-800 dark:text-white', icon: Icon }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

// ─── Autonomy mode badge ─────────────────────────────────────────────────────
const AutoBadge = ({ mode }) => {
  const map = {
    assistive:   { label: 'Assist Mode',     color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' },
    supervised:  { label: 'Supervised',      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700' },
    autonomous:  { label: 'Autonomous',      color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700' },
  };
  const cfg = map[mode] || map.assistive;

  // ── Trigger status strip ──────────────────────────────────────────────────
  const TriggerStatusStrip = () => (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
      <span className="flex items-center gap-1">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${triggerStatus.lastARScan ? 'bg-emerald-400' : 'bg-slate-300'}`} />
        AR scan: {triggerStatus.lastARScan || 'not yet today'}
      </span>
      <span className="flex items-center gap-1">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${triggerStatus.lastDigest ? 'bg-emerald-400' : 'bg-slate-300'}`} />
        Digest: {triggerStatus.lastDigest || 'not yet this week'}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
        {triggerStatus.processedCompletions} completions processed
      </span>
    </div>
  );

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
      <Zap className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

// ─── Agent run history row ────────────────────────────────────────────────────
const RunRow = ({ run }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles className="h-4 w-4 text-violet-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
              {run.appointmentClient || 'Unknown'}
            </p>
            <p className="text-xs text-slate-400">
              {run.actor} · {new Date(run.ranAt || run.createdAt || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {run.status === 'approved' && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-2 py-0.5">Approved</span>}
          {run.status === 'rejected' && <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-full px-2 py-0.5">Rejected</span>}
          {run.status === 'pending'  && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full px-2 py-0.5">Pending</span>}
          {run.warnings?.length > 0  && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {(run.actions || []).map((a, i) => (
              <span key={i} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300">
                {a.type === 'journal_drafted' ? '📓 Journal drafted' : a.type === 'invoice_drafted' ? '🧾 Invoice drafted' : a.type}
              </span>
            ))}
          </div>
          {run.warnings?.length > 0 && (
            <div className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
              {run.warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
            </div>
          )}
          {run.diff && (
            <pre className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-900 rounded p-2 whitespace-pre-wrap">{run.diff}</pre>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const AgentPage = () => {
  const navigate = useNavigate();
  const { data, updateSettings, approveAgentSuggestion, rejectAgentSuggestion, editAgentSuggestion, runAgingARAgent, runARScan, runLeadIntakeAgent, updateReminderStatus, runCloseoutAgentWithAI, generateWeeklySummary } = useData();

  // ── Event-driven agent triggers (auto-run on data conditions) ───────────────
  const triggerStatus = useAgentTriggers({
    data,
    runARScan,
    generateWeeklySummary,
    runCloseoutAgent: runCloseoutAgentWithAI,
    enabled: data?.settings?.enableAutoCloseoutAgent !== false,
  });
  const [historyTab, setHistoryTab] = useState('all'); // all, approved, rejected, pending
  const [leadText, setLeadText] = useState('');
  const [leadParsing, setLeadParsing] = useState(false);

  // Weekly digest state
  const [digest, setDigest] = useState(null);
  const [digestLoading, setDigestLoading] = useState(false);

  // Closeout playbook state
  const [closeoutRunning, setCloseoutRunning] = useState(false);
  const closeoutRunningRef = useRef(false);

  const handleGenerateDigest = async () => {
    setDigestLoading(true);
    try {
      const result = await generateWeeklySummary?.();
      setDigest(result);
    } finally {
      setDigestLoading(false);
    }
  };

  const suggestions = useMemo(
    () => (data.agentSuggestions || []).filter((s) => s.status === 'pending'),
    [data.agentSuggestions]
  );

  const allRuns = useMemo(
    () => [...(data.agentSuggestions || [])].sort((a, b) => new Date(b.ranAt || b.createdAt || 0) - new Date(a.ranAt || a.createdAt || 0)),
    [data.agentSuggestions]
  );

  const filteredRuns = useMemo(() => {
    if (historyTab === 'all') return allRuns;
    return allRuns.filter((r) => r.status === historyTab);
  }, [allRuns, historyTab]);

  // KPIs
  const kpis = useMemo(() => {
    const runs = data.agentSuggestions || [];
    const approved = runs.filter((r) => r.status === 'approved');
    const rejected = runs.filter((r) => r.status === 'rejected');
    const edited = runs.filter((r) => r.wasEdited);
    const totalResolved = approved.length + rejected.length;
    const approvalRate = totalResolved > 0 ? Math.round((approved.length / totalResolved) * 100) : null;
    const editRate = approved.length > 0 ? Math.round((edited.length / approved.length) * 100) : null;
    return { total: runs.length, pending: suggestions.length, approved: approved.length, rejected: rejected.length, approvalRate, editRate };
  }, [data.agentSuggestions, suggestions]);

  // FIX 10: route based on suggestion type after approval
  const typeGroup = (suggestion) => {
    const t = suggestion.type || '';
    if (t === 'closeout' || t.includes('closeout')) return 'closeout';
    if (t === 'ar_reminder' || t.includes('ar') || t.includes('reminder')) return 'ar';
    if (t === 'lead_intake' || t.includes('lead')) return 'lead';
    return 'other';
  };
  const APPROVE_TOAST = {
    closeout: 'Journal entry + invoice drafted ✓',
    ar:       'AR reminder sent — check Invoices ✓',
    lead:     'Lead captured — view in Clients ✓',
    other:    'Suggestion approved ✓',
  };
  const APPROVE_ROUTE = {
    closeout: '/journal',
    ar:       '/invoices',
    lead:     '/clients',
    other:    '/agent',
  };
  const handleApprove = (suggestion) => {
    approveAgentSuggestion?.(suggestion.id);
    const group = typeGroup(suggestion);
    toast.success(APPROVE_TOAST[group]);
    navigate(APPROVE_ROUTE[group]);
  };

  const handleEdit = (suggestion) => {
    // FIX 4: onOpenEdit callback — navigates to the correct page for manual editing
    const aptId = suggestion.appointmentId || suggestion.linkedAppointmentId;
    navigate('/journal', { state: aptId ? { prefillFromAppointment: aptId } : undefined });
  };

  const handleReject = (suggestion) => {
    rejectAgentSuggestion?.(suggestion.id);
    toast.info('Draft rejected and dismissed');
  };

  const handleRunARCheck = () => {
    runAgingARAgent?.();
    toast.success('AR check complete — check pending drafts');
  };

  const pendingReminders = useMemo(() => {
    const today = new Date();
    const soon = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return (data.reminderQueue || [])
      .filter(r => r.status === 'pending')
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
      .map(r => ({ ...r, isSoon: new Date(r.scheduledFor) <= soon }));
  }, [data.reminderQueue]);

  const autonomyMode = data.settings?.autonomyMode || 'assistive';

  return (
    <div className="animate-fade-in space-y-5 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7 mx-auto max-w-[1400px] pb-24">

      {/* Hero */}
      <Card className="app-hero-card">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-violet-200">AI Command Center</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-violet-300" />
              Command Center
            </h1>
            <p className="mt-1 text-sm text-slate-200">Review AI drafts, approve actions, and track agent performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <AutoBadge mode={autonomyMode} />
            <Button
              variant="secondary"
              onClick={handleRunARCheck}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              AR Check
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1.5"
            >
              <Settings2 className="h-4 w-4" />
              Mode settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Digest */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Weekly Digest</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateDigest}
              disabled={digestLoading}
              className="flex items-center gap-1.5"
            >
              {digestLoading ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating…</> : <><RefreshCw className="h-3.5 w-3.5" /> {(digest || data.weeklyDigest) ? 'Refresh' : 'Generate Digest'}</>}
            </Button>
          </div>

          {(digest || data.weeklyDigest) ? (() => {
            const d = digest || data.weeklyDigest;
            return (
              <div className="space-y-3">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{d.narrative}</p>
                {d.stats && (
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <Calendar className="h-3 w-3" /> {d.stats.appointmentsCompleted} appts
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <DollarSign className="h-3 w-3" /> ${d.stats.totalRevenue?.toFixed(2) || '0.00'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      <Bell className="h-3 w-3" /> {d.stats.remindersSent} reminders sent
                    </span>
                    <span className="text-xs text-slate-400 self-center ml-auto">
                      Generated {new Date(d.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })() : (
            <p className="text-sm text-slate-400">Generate a weekly summary of your business activity, powered by AI.</p>
          )}
        </CardContent>
      </Card>

      {/* Trigger status strip */}
      <TriggerStatusStrip />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Pending review" value={kpis.pending} color="text-amber-600" icon={Clock} />
        <KpiCard label="Approved" value={kpis.approved} color="text-emerald-600" icon={CheckCircle2} />
        <KpiCard label="Approval rate" value={kpis.approvalRate != null ? `${kpis.approvalRate}%` : '—'} color="text-blue-600" icon={TrendingUp} />
        <KpiCard label="Edit rate" value={kpis.editRate != null ? `${kpis.editRate}%` : '—'} sub="how often you corrected drafts" icon={Pencil} />
      </div>

      {/* Playbooks */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Command Center</p>
            </div>
            <button
              onClick={() => navigate('/audit')}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
            >
              <ScrollText className="h-3.5 w-3.5" />
              View Full Audit Log →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Post-Appointment Closeout */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Closeout Agent</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Auto-draft journal + invoice from completed appointment</p>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {suggestions.length} pending closeout draft{suggestions.length !== 1 ? 's' : ''}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                disabled={closeoutRunning}
                onClick={async () => {
                  if (closeoutRunningRef.current) return;
                  closeoutRunningRef.current = true;
                  setCloseoutRunning(true);
                  try {
                    const pendingApptIds = new Set((data.agentSuggestions || []).filter(s => s.status === 'pending' && s.type === 'closeout').map(s => String(s.appointmentId)));
                    const target = [...(data.appointments || [])]
                      .filter(a => a.status === 'completed' && !pendingApptIds.has(String(a.id)))
                      .sort((a, b) => new Date(b.closeoutCompletedAt || b.date) - new Date(a.closeoutCompletedAt || a.date))[0]
                      || [...(data.appointments || [])].filter(a => a.status !== 'completed').sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                    if (!target) { toast.error('No eligible appointments found'); return; }
                    toast.info(`Running closeout for ${target.client}…`);
                    await runCloseoutAgentWithAI?.(target.id);
                    toast.success('Closeout draft created — check pending suggestions');
                  } finally {
                    closeoutRunningRef.current = false;
                    setCloseoutRunning(false);
                  }
                }}
              >
                {closeoutRunning ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Running…</> : <><Zap className="h-3.5 w-3.5 mr-1.5" /> Run on Latest</>}
              </Button>
            </div>

            {/* AR Check */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Collections</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scan for unpaid invoices and draft reminders</p>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {data.invoices?.filter(i => i.status === 'Overdue').length || 0} overdue invoices
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => { runARScan?.(); toast.success('AR check complete — check pending drafts'); }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Run Now
              </Button>
            </div>

            {/* Lead Intake */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Lead Parser</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Parse text or emails into appointment drafts</p>
              </div>
              <p className="text-xs text-slate-400">
                Paste text below to parse
              </p>
              <div className="space-y-2">
                <textarea
                  value={leadText}
                  onChange={(e) => setLeadText(e.target.value)}
                  placeholder="Paste lead text here..."
                  className="w-full h-20 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  disabled={leadParsing || !leadText.trim()}
                  onClick={async () => {
                    setLeadParsing(true);
                    try {
                      await runLeadIntakeAgent?.(leadText);
                      setLeadText('');
                      toast.success('Lead parsed — check pending suggestions');
                    } finally {
                      setLeadParsing(false);
                    }
                  }}
                >
                  {leadParsing ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Parsing…</> : <><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Parse Lead</>}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Pending Review
          </h2>
          <Badge variant="secondary">{suggestions.length} Drafts</Badge>
          {suggestions.length > 0 && (
            <button
              onClick={() => navigate('/review')}
              className="ml-auto text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {/* FIX 11: Review Queue as focused drill-down from Command Center */}
              Review All →
            </button>
          )}
        </div>

        {suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((s) => (
              <AgentSuggestionCard
                key={s.id}
                suggestion={s}
                onApprove={() => handleApprove(s)}
                onReject={() => handleReject(s)}
                onOpenEdit={() => handleEdit(s)}
                onPatchDraft={(id, patch) => editAgentSuggestion?.(id, patch)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">All caught up!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No pending agent suggestions to review.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Run History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-400" />
            Closeout Runs
          </h2>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {['all', 'approved', 'rejected', 'pending'].map((t) => (
              <button
                key={t}
                onClick={() => setHistoryTab(t)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${historyTab === t ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRuns.length > 0 ? (
              filteredRuns.slice(0, 10).map((run) => (
                <RunRow key={run.id} run={run} />
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">No history found for this filter.</div>
            )}
          </div>
          {filteredRuns.length > 10 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
              <button onClick={() => navigate('/audit')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View full history in Audit Log →</button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AgentPage;
