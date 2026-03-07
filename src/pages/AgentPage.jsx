// Phase 3 — Agent command center: weekly digest, playbooks, pending suggestions, run history, KPIs
import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, CheckCircle2, XCircle, Clock, TrendingUp, FileText,
  Receipt, AlertTriangle, ChevronDown, ChevronUp, Pencil, Activity,
  Zap, Shield, BarChart2, Settings2, BellRing, Bell, UserPlus, RefreshCw, Send, X,
  ScrollText, DollarSign, Calendar, MessageSquare, ExternalLink, ChevronRight,
  Eye, Cpu, ListChecks, Download, Edit3, Brain
} from 'lucide-react';
import { Card, CardContent, Button, Badge } from '../components/UI';
import { useData } from '../context/DataContext';
import { AgentActivityFeed } from '../components/AgentActivityFeed';
import { AgentSuggestionCard } from '../components/AgentSuggestionCard';
import { toast } from '../hooks/useLinker';
import { useAgentTriggers } from '../hooks/useAgentTriggers';
import { getGuardianResponse, GUARDIAN_ROUTE_MAP } from '../services/guardianService';

// ─── Phase-based checklist templates ─────────────────────────────────────────
const PHASE_CHECKLISTS = {
  'BEFORE APPOINTMENT': [
    'Verify signer identity documents are valid and unexpired',
    'Confirm your notary commission is active and not expired',
    'Review document type requirements for this signing',
    'Ensure journal is prepared and ready',
    'Check applicable state fee limits for this act type',
    'Confirm appointment location and time with client',
  ],
  'DURING SIGNING': [
    'Record ID type, number, expiration, and issuing state in journal',
    'Confirm signer is signing willingly and appears competent',
    'Complete all journal fields before signer leaves',
    'Collect thumbprint if required by state law',
    'Apply and affix seal/stamp as required',
    'Charge and record the correct fee',
  ],
  'AFTER SIGNING': [
    'Review journal entry for completeness and accuracy',
    'Send invoice to client',
    'File or scan document copies as required',
    'Submit recording documents if applicable',
    'Update appointment status to completed',
    'Archive evidence and compliance notes',
  ],
};

// ─── Autonomy mode config ─────────────────────────────────────────────────────
const AUTONOMY_MODES = [
  {
    key: 'assistive',
    label: 'Assistive',
    Icon: Eye,
    desc: 'Suggests only — you control everything',
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  },
  {
    key: 'supervised',
    label: 'Supervised',
    Icon: Edit3,
    desc: 'Suggests + pre-fills drafts for your review',
    color: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  },
  {
    key: 'autonomous',
    label: 'Autonomous',
    Icon: Cpu,
    desc: 'Auto-creates checklists + drafts on phase change',
    color: 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300',
  },
];

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

// ─── Autonomy mode picker ─────────────────────────────────────────────────────
const AutonomyPicker = ({ mode, onChange }) => (
  <div className="grid grid-cols-3 gap-2">
    {AUTONOMY_MODES.map(({ key, label, Icon, desc, color }) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
          mode === key
            ? color
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3.5 w-3.5 ${mode === key ? '' : 'text-slate-400'}`} />
          <span className="text-xs font-bold">{label}</span>
        </div>
        <p className="text-[10px] leading-tight opacity-80">{desc}</p>
      </button>
    ))}
  </div>
);

// ─── Trigger status strip (standalone — reads triggerStatus from props) ────────
const TriggerStatusStrip = ({ triggerStatus }) => (
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

// RunRow replaced by AgentActivityFeed component (see below in Run History section)


// ─── Guardian constants ───────────────────────────────────────────────────────
const PHASES = ['BEFORE APPOINTMENT', 'DURING SIGNING', 'AFTER SIGNING'];

const QUICK_CHIPS = [
  { label: 'Max fee?',           q: 'What is the maximum fee I can charge per notarial act?' },
  { label: 'ID requirements?',   q: 'What ID documents must signers present?' },
  { label: 'Journal required?',  q: 'Is a notary journal required?' },
  { label: 'Seal rules?',        q: 'What are the seal and stamp requirements?' },
  { label: 'RON allowed?',       q: 'Is Remote Online Notarization (RON) permitted?' },
  { label: 'Commission renewal?',q: 'How do I renew my notary commission?' },
];

const RISK_COLORS = {
  LOW:    'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
  MEDIUM: 'text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  HIGH:   'text-rose-700 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400',
};

// ─── Guardian message renderer ────────────────────────────────────────────────
const GuardianMessage = ({ res, onCta, onAddToChecklist, onStartJournal, onGenerateChecklist, onExportEvidence }) => {
  if (!res) return null;
  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{res.summary}</p>
      {res.action && <p className="text-slate-600 dark:text-slate-300 text-sm">{res.action}</p>}
      {res.details?.length > 0 && (
        <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300 text-xs">
          {res.details.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${RISK_COLORS[res.risk_level] || RISK_COLORS.MEDIUM}`}>
          {res.risk_level} risk
        </span>
        <span className="text-[10px] text-slate-400">Confidence: {res.confidence}</span>
      </div>
      {res.source?.title && res.source.title !== 'Not available in this dataset' && (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Source</p>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{res.source.title}</p>
          {res.source.where_found && <p className="text-[11px] text-slate-500">{res.source.where_found}</p>}
          {res.source.url && (
            <a href={res.source.url} target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5">
              Official source <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          )}
          {res.source.last_updated && <p className="text-[10px] text-slate-400">Updated: {res.source.last_updated}</p>}
        </div>
      )}
      {res.clarifying_questions?.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Clarifying questions</p>
          {res.clarifying_questions.map((q, i) => (
            <button key={i} onClick={() => onCta({ type: 'question', q })}
              className="block text-left text-xs text-blue-600 dark:text-blue-400 hover:underline">
              → {q}
            </button>
          ))}
        </div>
      )}
      {res.next_ctas?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {res.next_ctas.map((cta, i) => (
            <button key={i} onClick={() => onCta({ type: 'nav', target: cta.target_view })}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-colors">
              {cta.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Persistent agent action buttons ── */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Agent Actions</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={onAddToChecklist}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ListChecks className="h-3 w-3" /> Add to Checklist
          </button>
          <button
            onClick={onStartJournal}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ScrollText className="h-3 w-3" /> Start Journal Entry
          </button>
          <button
            onClick={onGenerateChecklist}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <CheckCircle2 className="h-3 w-3" /> Generate Checklist
          </button>
          <button
            onClick={onExportEvidence}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <Download className="h-3 w-3" /> Export Evidence
          </button>
        </div>
      </div>

      {res.disclaimer && <p className="text-[10px] text-slate-400 italic pt-1">{res.disclaimer}</p>}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const AgentPage = () => {
  const navigate = useNavigate();
  const {
    data,
    updateSettings,
    addComplianceItem,
    updateComplianceItem,
    deleteComplianceItem,
    approveAgentSuggestion,
    rejectAgentSuggestion,
    editAgentSuggestion,
    runAgingARAgent,
    runARScan,
    runLeadIntakeAgent,
    updateReminderStatus,
    runCloseoutAgentWithAI,
    generateWeeklySummary,
  } = useData();

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

  // ── Guardian compliance chat ──────────────────────────────────────────────
  const [guardianOpen, setGuardianOpen] = useState(false);
  const [guardianMessages, setGuardianMessages] = useState([]);
  const [guardianInput, setGuardianInput] = useState('');
  const [guardianLoading, setGuardianLoading] = useState(false);
  const [guardianCtx, setGuardianCtx] = useState({
    state: '',
    appointmentType: '',
    phase: 'BEFORE APPOINTMENT',
    journalStatus: 'not started',
  });
  const guardianBottomRef = useRef(null);

  // Pre-fill state from settings
  React.useEffect(() => {
    const s = data.settings?.notaryState || data.settings?.state || '';
    if (s) setGuardianCtx(c => ({ ...c, state: s }));
  }, [data.settings]);

  React.useEffect(() => {
    guardianBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [guardianMessages]);

  const handleGuardianSend = async (overrideMsg) => {
    const msg = overrideMsg || guardianInput.trim();
    if (!msg || guardianLoading) return;
    if (!overrideMsg) setGuardianInput('');
    setGuardianMessages(prev => [...prev, { role: 'user', text: msg }]);
    setGuardianLoading(true);
    try {
      const res = await getGuardianResponse(msg, guardianCtx);
      setGuardianMessages(prev => [...prev, { role: 'guardian', res }]);
      // Autonomous mode: auto-add to checklist
      if (data.settings?.autonomyMode === 'autonomous') {
        addComplianceItem({
          id: Date.now() + 1,
          title: res.action || res.summary,
          category: 'Guardian Auto-Capture',
          dueDate: new Date().toISOString().split('T')[0],
          status: 'Pending',
          notes: `Auto-captured · ${guardianCtx.state} · ${guardianCtx.phase}`,
          sourceUrl: res.source?.url || '',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setGuardianMessages(prev => [...prev, { role: 'guardian', res: {
        summary: err.message || 'Something went wrong. Please try again.',
        action: 'Check that your VITE_GEMINI_API_KEY is set in Vercel environment variables.',
        details: [],
        risk_level: 'HIGH',
        source: { title: 'Error', url: '', where_found: '', last_updated: '' },
        confidence: 'None',
        disclaimer: '',
        clarifying_questions: [],
        next_ctas: [],
      }}]);
    } finally {
      setGuardianLoading(false);
    }
  };

  const handleGuardianCta = (cta) => {
    if (cta.type === 'nav') {
      navigate(GUARDIAN_ROUTE_MAP[cta.target] || '/agent');
    } else if (cta.type === 'question') {
      handleGuardianSend(cta.q);
    }
  };

  // ── Agent CTA action handlers ──────────────────────────────────────────────
  const todayISO = new Date().toISOString().split('T')[0];

  const handleAddToChecklist = (res) => {
    addComplianceItem({
      id: Date.now(),
      title: res.action || res.summary,
      category: 'Guardian Compliance',
      dueDate: todayISO,
      status: 'Needs Review',
      notes: `State: ${guardianCtx.state} · Phase: ${guardianCtx.phase}${res.source?.where_found ? ' · ' + res.source.where_found : ''}`,
      sourceUrl: res.source?.url || '',
      guardianSource: res.source,
      createdAt: new Date().toISOString(),
    });
    toast.success('Added to compliance checklist ✓');
  };

  const handleStartJournalEntry = () => {
    navigate('/journal', {
      state: {
        prefillDraft: {
          notes: `Guardian compliance note — State: ${guardianCtx.state}, Phase: ${guardianCtx.phase}`,
          date: todayISO,
        },
      },
    });
  };

  const handleGenerateChecklist = () => {
    const phase = guardianCtx.phase || 'BEFORE APPOINTMENT';
    const items = (PHASE_CHECKLISTS[phase] || []).map((title, i) => ({
      id: Date.now() + i,
      title,
      category: 'Phase Checklist',
      dueDate: todayISO,
      status: 'Pending',
      notes: `Auto-generated · ${phase} · State: ${guardianCtx.state || 'All states'}`,
      createdAt: new Date().toISOString(),
    }));
    items.forEach((item) => addComplianceItem(item));
    toast.success(`${items.length} checklist items created ✓`);
  };

  const handleExportEvidence = (res) => {
    const evidence = {
      exportedAt: new Date().toISOString(),
      context: guardianCtx,
      response: res,
      conversation: guardianMessages.map((m) => ({
        role: m.role,
        content: m.role === 'user' ? m.text : m.res,
      })),
    };
    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guardian-evidence-${guardianCtx.state || 'unknown'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Evidence report exported ✓');
  };

  const handleAutonomyChange = (mode) => {
    updateSettings({ autonomyMode: mode });
    toast.info(`Switched to ${mode} mode`);
  };

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
    // Issue 16: copy the pre-written follow-up message to clipboard for AR suggestions
    if (suggestion.type === 'aging_ar' && suggestion.followUpMessage) {
      navigator.clipboard?.writeText(suggestion.followUpMessage);
      toast.success('Follow-up message copied to clipboard — invoice marked overdue ✓');
    } else {
      toast.success(APPROVE_TOAST[group]);
    }
    navigate(APPROVE_ROUTE[group]);
  };

  const handleEdit = (suggestion) => {
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

  const guardianChecklist = useMemo(
    () => (data.complianceItems || []).filter(
      (c) => c.category === 'Guardian Compliance' || c.category === 'Phase Checklist' || c.category === 'Guardian Auto-Capture'
    ).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [data.complianceItems]
  );

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
          </div>
        </CardContent>
      </Card>

      {/* Agent Autonomy Control */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-violet-500" />
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Agent Autonomy</p>
            <AutoBadge mode={autonomyMode} />
          </div>
          <AutonomyPicker mode={autonomyMode} onChange={handleAutonomyChange} />
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">
            {autonomyMode === 'assistive' && '👁 Assistive mode: Guardian answers your questions. You manually act on every suggestion.'}
            {autonomyMode === 'supervised' && '✍ Supervised mode: Guardian pre-fills drafts and suggests checklist items. You review before saving.'}
            {autonomyMode === 'autonomous' && '⚡ Autonomous mode: Every Guardian response automatically adds a compliance item to your checklist. Drafts are created without review prompts.'}
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
      <TriggerStatusStrip triggerStatus={triggerStatus} />

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
              Review All →
            </button>
          )}
        </div>

        {suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((s) => (
              <div key={s.id} className="space-y-2">
                <AgentSuggestionCard
                  suggestion={s}
                  onApprove={() => handleApprove(s)}
                  onReject={() => handleReject(s)}
                  onOpenEdit={() => handleEdit(s)}
                  onPatchDraft={(id, patch) => editAgentSuggestion?.(id, patch)}
                />
                {/* Issue 16: pre-written follow-up message for overdue AR suggestions */}
                {s.type === 'aging_ar' && s.followUpMessage && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/10 px-4 py-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-rose-500 flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3" /> Pre-written Follow-up Message
                    </p>
                    <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-white dark:bg-slate-900 rounded-lg border border-rose-100 dark:border-rose-900 p-3">
                      {s.followUpMessage}
                    </pre>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(s.followUpMessage); toast.success('Follow-up message copied!'); }}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                    >
                      <MessageSquare className="h-3 w-3" /> Copy Message
                    </button>
                  </div>
                )}
              </div>
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

      {/* Run History — replaced with AgentActivityFeed for inline confidence + reasoning */}
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

        <Card className="overflow-hidden bg-[#080f1a] border-slate-800">
          <AgentActivityFeed
            runs={filteredRuns}
            maxItems={20}
            compact={false}
            emptyLabel={historyTab === 'all'
              ? 'No closeout runs yet. Mark an appointment complete to trigger the agent.'
              : `No ${historyTab} runs.`
            }
            onViewAll={() => navigate('/audit')}
          />
          {filteredRuns.length > 20 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
              <button onClick={() => navigate('/audit')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View full history in Audit Log →</button>
            </div>
          )}
        </Card>
      </div>

      {/* ── Agent Compliance Checklist ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-emerald-500" />
            Compliance Checklist
          </h2>
          <div className="flex items-center gap-2">
            {guardianChecklist.length > 0 && (
              <span className="text-xs text-slate-400">{guardianChecklist.filter(c => c.status !== 'Done').length} remaining</span>
            )}
            <Button size="sm" variant="secondary" onClick={handleGenerateChecklist}
              className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              Generate for {(guardianCtx.phase || 'BEFORE APPOINTMENT').split(' ')[0]}
            </Button>
          </div>
        </div>

        <Card className={guardianChecklist.length === 0 ? 'border-dashed' : ''}>
          {guardianChecklist.length === 0 ? (
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <ListChecks className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No checklist items yet</p>
              <p className="text-xs text-slate-400 mt-1">Ask Guardian a question and click "Add to Checklist", or use "Generate Checklist" to create phase-specific items.</p>
            </CardContent>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {guardianChecklist.slice(0, 15).map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <button
                    onClick={() => updateComplianceItem(item.id, { status: item.status === 'Done' ? 'Pending' : 'Done' })}
                    className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-all ${
                      item.status === 'Done'
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                    }`}
                  >
                    {item.status === 'Done' && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {item.title}
                    </p>
                    {item.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{item.notes}</p>}
                    {item.sourceUrl && (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5">
                        Source <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    item.status === 'Done' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' :
                    item.status === 'Needs Review' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' :
                    'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}>{item.status}</span>
                  <button onClick={() => deleteComplianceItem(item.id)}
                    className="text-slate-300 dark:text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {guardianChecklist.length > 15 && (
                <div className="p-3 text-center text-xs text-slate-400">
                  +{guardianChecklist.length - 15} more items
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* ── Guardian Compliance Chat ──────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <button
            onClick={() => setGuardianOpen(o => !o)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Guardian Compliance Chat</p>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">AI · Grounded</span>
            </div>
            {guardianOpen
              ? <ChevronUp className="h-4 w-4 text-slate-400" />
              : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {guardianOpen && (
            <div className="space-y-4">
              {/* Context selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">State</label>
                  <select
                    value={guardianCtx.state}
                    onChange={e => setGuardianCtx(c => ({ ...c, state: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select state</option>
                    {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Appointment Type</label>
                  <select
                    value={guardianCtx.appointmentType}
                    onChange={e => setGuardianCtx(c => ({ ...c, appointmentType: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    {['Loan Signing','Power of Attorney','Affidavit','Deed','Will/Trust','Medical Directive','General Notarization'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Phase</label>
                  <div className="flex gap-1">
                    {PHASES.map(p => (
                      <button key={p} onClick={() => setGuardianCtx(c => ({ ...c, phase: p }))}
                        className={`flex-1 text-[9px] font-bold uppercase py-1.5 rounded-md border transition-all ${guardianCtx.phase === p ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                        {p === 'BEFORE APPOINTMENT' ? 'Before' : p === 'DURING SIGNING' ? 'During' : 'After'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick chips */}
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map(chip => (
                  <button key={chip.label}
                    onClick={() => handleGuardianSend(chip.q)}
                    disabled={!guardianCtx.state || guardianLoading}
                    className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Messages */}
              {guardianMessages.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {guardianMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${m.role === 'user' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-tr-none text-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none'}`}>
                        {m.role === 'user'
                          ? <p>{m.text}</p>
                          : <GuardianMessage
                              res={m.res}
                              onCta={handleGuardianCta}
                              onAddToChecklist={() => handleAddToChecklist(m.res)}
                              onStartJournal={handleStartJournalEntry}
                              onGenerateChecklist={handleGenerateChecklist}
                              onExportEvidence={() => handleExportEvidence(m.res)}
                            />}
                      </div>
                    </div>
                  ))}
                  {guardianLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={guardianBottomRef} />
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guardianInput}
                  onChange={e => setGuardianInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGuardianSend()}
                  placeholder={guardianCtx.state ? 'Ask about compliance, fees, ID rules…' : 'Select a state above first…'}
                  disabled={!guardianCtx.state || guardianLoading}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleGuardianSend()}
                  disabled={!guardianInput.trim() || !guardianCtx.state || guardianLoading}
                  className="px-4 py-2.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-xl hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center">
                Grounded in 50-state primary sources · Not legal advice · Verify with official state statutes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default AgentPage;
