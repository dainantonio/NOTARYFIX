// src/pages/AgentPage.jsx
// Phase 3 — Agent command center: weekly digest, playbooks, pending suggestions, run history, KPIs
import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, CheckCircle2, XCircle, Clock, TrendingUp, FileText,
  Receipt, AlertTriangle, ChevronDown, ChevronUp, Pencil, Activity,
  Zap, Shield, BarChart2, Settings2, BellRing, Bell, UserPlus, RefreshCw, Send, X,
  ScrollText, DollarSign, Calendar
} from 'lucide-react';
import { Card, CardContent, Button } from '../components/UI';
import { useData } from '../context/DataContext';
import { AgentSuggestionCard } from '../components/AgentSuggestionCard';
import { toast } from '../hooks/useLinker';

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
  const [historyTab, setHistoryTab] = useState('all');
  const [leadText, setLeadText] = useState('');
  const [leadParsing, setLeadParsing] = useState(false);

  // Weekly digest state
  const [digest, setDigest] = useState(null);
  const [digestLoading, setDigestLoading] = useState(false);

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

  const handleApprove = (suggestion) => {
    approveAgentSuggestion?.(suggestion.id);
    toast.success(`Approved — journal + invoice added`);
    navigate('/journal');
  };

  const handleEdit = (suggestion) => {
    // Navigate to journal with the linked appointment pre-filled for editing
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
            <p className="text-xs uppercase tracking-[0.18em] text-violet-200">Agentic Operations</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-violet-300" />
              AI Agent
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
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Playbooks</p>
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
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Post-Appointment Closeout</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Auto-draft journal + invoice from completed appointment</p>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {suggestions.length} pending closeout draft{suggestions.length !== 1 ? 's' : ''}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  // Find most recent completed appointment without a pending suggestion
                  const pendingApptIds = new Set((data.agentSuggestions || []).filter(s => s.status === 'pending' && s.type === 'closeout').map(s => String(s.appointmentId)));
                  const target = [...(data.appointments || [])]
                    .filter(a => a.status === 'completed' && !pendingApptIds.has(String(a.id)))
                    .sort((a, b) => new Date(b.closeoutCompletedAt || b.date) - new Date(a.closeoutCompletedAt || a.date))[0]
                    || [...(data.appointments || [])].filter(a => a.status !== 'completed').sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                  if (!target) { toast.error('No eligible appointments found'); return; }
                  toast.info(`Running closeout for ${target.client}…`);
                  await runCloseoutAgentWithAI?.(target.id);
                  toast.success('Closeout draft created — check pending suggestions');
                }}
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" /> Run on Latest
              </Button>
            </div>

            {/* AR Check */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">AR Check</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scan all overdue invoices and queue reminder suggestions</p>
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {(data.invoices || []).filter(i => ['Pending', 'Overdue'].includes(i.status)).length} overdue invoice{(data.invoices || []).filter(i => ['Pending', 'Overdue'].includes(i.status)).length !== 1 ? 's' : ''}
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
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Lead Intake</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Parse a text snippet into a client + appointment</p>
              </div>
              <textarea
                value={leadText}
                onChange={(e) => setLeadText(e.target.value)}
                rows={3}
                placeholder="Paste SMS, email, or voicemail text..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={async () => {
                  if (!leadText.trim()) return;
                  setLeadParsing(true);
                  try { await runLeadIntakeAgent?.(leadText); setLeadText(''); toast.success('Lead parsed — review the draft below'); }
                  finally { setLeadParsing(false); }
                }}
                disabled={!leadText.trim() || leadParsing}
              >
                {leadParsing ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Parsing…</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Parse Lead</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Queue */}
      {pendingReminders.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-amber-500" />
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Payment Reminders</p>
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                {pendingReminders.length}
              </span>
            </div>
            <div className="space-y-2">
              {pendingReminders.map((r) => (
                <div key={r.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${r.isSoon ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Bell className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{r.clientName}</p>
                      <p className="text-xs text-slate-400">
                        {r.type === 'initial_followup' ? '7-day follow-up' : 'Overdue notice'} · ${r.amount} · Due {new Date(r.scheduledFor).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateReminderStatus?.(r.id, 'sent')}
                      className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 transition-colors"
                    >
                      <Send className="h-3 w-3" />
                      Sent
                    </button>
                    <button
                      onClick={() => updateReminderStatus?.(r.id, 'dismissed')}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending suggestions */}
      {suggestions.length > 0 ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Pending Agent Drafts</p>
              <span className="rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:text-violet-300">
                {suggestions.length}
              </span>
            </div>
            <div className="space-y-3">
              {suggestions.map((s) => (
                <AgentSuggestionCard
                  key={s.id}
                  suggestion={s}
                  onApprove={handleApprove}
                  onEdit={handleEdit}
                  onReject={handleReject}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">All caught up</p>
            <p className="text-sm text-slate-400 max-w-xs">No pending agent drafts. Complete an appointment to trigger the closeout agent.</p>
          </CardContent>
        </Card>
      )}

      {/* Autonomy mode info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Autonomy Controls</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { mode: 'assistive', label: 'Assist', desc: 'Agent drafts — you approve everything', icon: '🤝' },
              { mode: 'supervised', label: 'Supervised', desc: 'Agent acts — you review before commit', icon: '👁' },
              { mode: 'autonomous', label: 'Autonomous', desc: 'Agent auto-commits safe actions', icon: '⚡' },
            ].map(({ mode, label, desc, icon }) => (
              <button
                key={mode}
                onClick={() => { updateSettings({ autonomyMode: mode }); toast.success(`Switched to ${label} mode`); }}
                className={`rounded-xl border p-3 text-left transition-all ${
                  autonomyMode === mode
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-300 dark:ring-violet-700'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <p className="text-base mb-0.5">{icon}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Run history */}
      {allRuns.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Agent Run History</p>
              </div>
              <div className="flex gap-1 text-xs">
                {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setHistoryTab(tab)}
                    className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                      historyTab === tab
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div>
              {filteredRuns.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">No runs to show</p>
              ) : (
                filteredRuns.slice(0, 20).map((run) => <RunRow key={run.id} run={run} />)
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentPage;
