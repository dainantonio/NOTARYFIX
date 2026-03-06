// src/pages/JobInboxPage.jsx
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox, Zap, MapPin, Clock, DollarSign, TrendingUp, TrendingDown,
  CheckCircle2, X, MessageSquare, Phone, Mail, Building2, Edit3,
  ChevronRight, AlertTriangle, Trash2, Plus, FileText, Car,
  Printer, BarChart2, ArrowRight, Sparkles, RefreshCw, Info,
  Camera, Copy, UserPlus,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  parseJobMessage,
  evaluateProfitability,
  generateNegotiationScript,
  MARKET_BENCHMARKS,
  JOB_LIFECYCLE_STAGES,
  getLifecycleIndex,
  MESSAGE_SOURCES,
  EXPENSE_CATEGORIES,
} from '../services/jobIntelligenceService';
import AppointmentModal from '../components/AppointmentModal';
import { parseJobImage } from '../services/agentService';

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/8 bg-white/[0.03] p-5 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = 'slate' }) => {
  const colors = {
    slate:   'bg-slate-700/50 text-slate-300 border-slate-600/30',
    blue:    'bg-blue-900/30 text-blue-300 border-blue-600/30',
    emerald: 'bg-emerald-900/30 text-emerald-300 border-emerald-600/30',
    amber:   'bg-amber-900/30 text-amber-300 border-amber-600/30',
    red:     'bg-red-900/30 text-red-300 border-red-600/30',
    violet:  'bg-violet-900/30 text-violet-300 border-violet-600/30',
    cyan:    'bg-cyan-900/30 text-cyan-300 border-cyan-600/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

const Btn = ({ children, onClick, variant = 'primary', size = 'default', disabled, className = '' }) => {
  const v = {
    primary:  'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
    emerald:  'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20',
    amber:    'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20',
    red:      'bg-red-600/80 hover:bg-red-600 text-white',
    ghost:    'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10',
    outline:  'border border-white/15 text-slate-200 hover:bg-white/10',
  };
  const s = {
    default: 'h-10 px-4 text-sm',
    sm:      'h-8 px-3 text-xs',
    lg:      'h-12 px-6 text-base',
    icon:    'h-9 w-9 p-0',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-40 ${v[variant]} ${s[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// ─── RECOMMENDATION CHIP ──────────────────────────────────────────────────────
const RecommendationChip = ({ rec }) => {
  const map = {
    accept:       { color: 'emerald', label: '✓ Accept',              icon: CheckCircle2 },
    counter:      { color: 'amber',   label: '↕ Counter Offer',       icon: TrendingUp   },
    decline:      { color: 'red',     label: '✗ Decline',             icon: X            },
    request_info: { color: 'blue',    label: '? Request Info',         icon: Info         },
    evaluate:     { color: 'slate',   label: '⊙ Evaluate',            icon: BarChart2    },
  };
  const cfg = map[rec] || map.evaluate;
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
};

// ─── LIFECYCLE TRACKER ────────────────────────────────────────────────────────
const LifecycleTracker = ({ currentStage, onAdvance }) => {
  const currentIdx = getLifecycleIndex(currentStage);
  return (
    <div className="space-y-2">
      {JOB_LIFECYCLE_STAGES.map((stage, idx) => {
        const done    = idx < currentIdx;
        const active  = idx === currentIdx;
        const pending = idx > currentIdx;
        return (
          <div
            key={stage.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all
              ${active  ? 'bg-blue-600/15 border border-blue-500/25' : ''}
              ${done    ? 'opacity-60' : ''}
              ${pending ? 'opacity-30' : ''}
            `}
          >
            <span className="text-lg leading-none">{stage.icon}</span>
            <span className={`text-sm font-medium flex-1 ${active ? 'text-white' : 'text-slate-400'}`}>
              {stage.label}
            </span>
            {done   && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {active && onAdvance && idx < JOB_LIFECYCLE_STAGES.length - 1 && (
              <button
                onClick={() => onAdvance(JOB_LIFECYCLE_STAGES[idx + 1].id)}
                className="rounded-lg bg-blue-600/25 px-2 py-1 text-[10px] font-bold text-blue-300 hover:bg-blue-600/40 transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── JOB EVALUATION CARD ──────────────────────────────────────────────────────
const JobEvaluationCard = ({ job, evaluation, onAction, onCopyScript }) => {
  const [showScript, setShowScript] = useState(false);
  const script = useMemo(
    () => generateNegotiationScript(job, evaluation),
    [job, evaluation]
  );

  const profitColor = (evaluation.profit || 0) >= 50 ? 'text-emerald-400'
                    : (evaluation.profit || 0) >= 20 ? 'text-amber-400'
                    : 'text-red-400';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Job Detected</span>
          </div>
          <h3 className="mt-1 text-lg font-black text-white">{job.document_type}</h3>
        </div>
        <RecommendationChip rec={evaluation.recommendation} />
      </div>

      {/* Extracted fields */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: FileText, label: 'Type',     value: MARKET_BENCHMARKS[job.job_type]?.label || job.job_type },
          { icon: MapPin,   label: 'Location', value: job.location || '—' },
          { icon: Clock,    label: 'Date',     value: `${job.date || '—'}${job.time ? ' · ' + job.time : ''}` },
          { icon: DollarSign, label: 'Offered Fee', value: job.offered_fee ? `$${job.offered_fee}` : 'Not specified' },
          { icon: MessageSquare, label: 'Contact', value: job.contact || '—' },
          { icon: Car,      label: 'Distance', value: job.distance_miles ? `${job.distance_miles} mi` : 'Unknown' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-white/[0.04] px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
            </div>
            <p className="text-sm font-semibold text-white truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Profitability analysis */}
      <div className="rounded-2xl border border-white/8 bg-[#060d1a] p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Profitability Analysis</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 mb-1">Estimated Cost</p>
            <p className="text-xl font-black text-slate-300">${evaluation.total_cost}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">${evaluation.travel_cost} travel · ${evaluation.print_cost} print</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 mb-1">Market Average</p>
            <p className="text-xl font-black text-blue-400">${evaluation.market_avg}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">for {evaluation.benchmark?.label}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 mb-1">Est. Profit</p>
            <p className={`text-xl font-black ${profitColor}`}>
              {evaluation.profit !== null ? `$${evaluation.profit}` : '—'}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">{evaluation.travel_minutes} min travel</p>
          </div>
        </div>

        {/* Counter offer callout */}
        {evaluation.counter_offer && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2.5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-300">Counter Offer Suggested: ${evaluation.counter_offer}</p>
              <p className="text-[11px] text-amber-400/70">{evaluation.reasoning[0]}</p>
            </div>
          </div>
        )}

        {/* Reasoning */}
        {evaluation.reasoning.length > 0 && (
          <div className="space-y-1">
            {evaluation.reasoning.map((r, i) => (
              <p key={i} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">·</span>{r}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Btn variant="emerald" onClick={() => onAction('accept')}>
          <CheckCircle2 className="h-4 w-4" /> Accept
        </Btn>
        {evaluation.counter_offer ? (
          <Btn variant="amber" onClick={() => onAction('counter')}>
            <TrendingUp className="h-4 w-4" /> Counter ${evaluation.counter_offer}
          </Btn>
        ) : (
          <Btn variant="ghost" onClick={() => onAction('request_info')}>
            <MessageSquare className="h-4 w-4" /> Request Info
          </Btn>
        )}
        <Btn variant="ghost" onClick={() => onAction('request_info')} className="text-xs">
          <MessageSquare className="h-3.5 w-3.5" /> Request Info
        </Btn>
        <Btn variant="red" onClick={() => onAction('decline')} className="text-xs">
          <X className="h-3.5 w-3.5" /> Decline
        </Btn>
      </div>

      {/* Negotiation script */}
      <div>
        <button
          onClick={() => setShowScript(p => !p)}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" />
          {showScript ? 'Hide' : 'Show'} Negotiation Script
        </button>
        {showScript && (
          <div className="mt-2 rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <pre className="whitespace-pre-wrap text-[11px] text-slate-300 font-sans leading-relaxed">{script}</pre>
            <button
              onClick={() => { navigator.clipboard?.writeText(script); onCopyScript?.(); }}
              className="mt-3 rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-600/30 transition-colors"
            >
              Copy to clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── JOB ROW (list item) ──────────────────────────────────────────────────────
const JobRow = ({ job, onSelect, onDelete }) => {
  const stageIdx = getLifecycleIndex(job.lifecycle_stage);
  const stageCfg = JOB_LIFECYCLE_STAGES[stageIdx] || JOB_LIFECYCLE_STAGES[0];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] p-3 hover:bg-white/[0.04] transition-colors cursor-pointer group"
         onClick={() => onSelect(job)}>
      <span className="text-xl">{stageCfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{job.document_type}</p>
        <p className="text-[11px] text-slate-500 truncate">
          {job.location || 'Location unknown'} · {job.date || 'Date TBD'}
          {job.offered_fee ? ` · $${job.offered_fee}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge color={
          job.status === 'accepted' ? 'emerald' :
          job.status === 'declined' ? 'red' :
          job.status === 'negotiating' ? 'amber' : 'slate'
        }>{job.status || 'detected'}</Badge>
        <button
          onClick={e => { e.stopPropagation(); onDelete(job.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-600/20 text-slate-600 hover:text-red-400 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <ChevronRight className="h-4 w-4 text-slate-600" />
      </div>
    </div>
  );
};

// ─── EXPENSE RECORDER ─────────────────────────────────────────────────────────
const ExpenseRecorder = ({ jobId, expenses, onAdd, onDelete }) => {
  const [form, setForm] = useState({ category: 'mileage', amount: '', note: '' });
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const handleAdd = () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    onAdd({ job_id: jobId, category: form.category, amount: parseFloat(form.amount), note: form.note });
    setForm({ category: 'mileage', amount: '', note: '' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Expenses / Tax Tracking</p>
        <Badge color="emerald">Total: ${total.toFixed(2)}</Badge>
      </div>

      {/* Add expense form */}
      <div className="flex gap-2">
        <select
          value={form.category}
          onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
          className="rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs px-2 py-1.5 flex-1"
        >
          {EXPENSE_CATEGORIES.map(c => (
            <option key={c.id} value={c.id} className="bg-slate-900">{c.icon} {c.label}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Amount $"
          value={form.amount}
          onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
          className="rounded-lg bg-white/5 border border-white/10 text-white text-xs px-2 py-1.5 w-24"
        />
        <Btn variant="ghost" size="sm" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Btn>
      </div>

      {/* Expense list */}
      {expenses.length > 0 && (
        <div className="space-y-1.5">
          {expenses.map(e => (
            <div key={e.id} className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 w-20 capitalize">{e.category}</span>
              <span className="text-white font-semibold">${e.amount.toFixed(2)}</span>
              {e.note && <span className="text-slate-500 flex-1 truncate">{e.note}</span>}
              <button onClick={() => onDelete(e.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ACCEPT FLOW MODAL (Changes #2 #3 #4) ────────────────────────────────────
const AcceptModal = ({ job, onConfirm, onClose }) => {
  const [createAppt,   setCreateAppt]   = useState(true);
  const [doAddClient,  setDoAddClient]  = useState(!!job?.contact);
  const [copied,       setCopied]       = useState(false);

  const confirmMsg = [
    `Confirmed! I'll be there on ${job?.date || 'the scheduled date'}`,
    job?.time     ? ` at ${job.time}`         : '',
    job?.location ? ` at ${job.location}`     : '',
    ` for the ${job?.document_type || 'signing'}`,
    job?.offered_fee ? ` at a fee of $${job.offered_fee}` : '',
    '. Thank you for the assignment!',
  ].join('');

  const handleCopy = () => {
    navigator.clipboard?.writeText(confirmMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1627] p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-black text-white">Job Accepted! ✅</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Change #3: Confirmation draft */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3" /> Confirmation Draft
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{confirmMsg}</p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors mt-1"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? '✓ Copied!' : 'Copy to clipboard'}
          </button>
        </div>

        {/* Options */}
        <div className="space-y-1">
          {/* Change #2: Create appointment */}
          <label className="flex items-start gap-3 cursor-pointer rounded-xl p-3 hover:bg-white/[0.03] transition-colors">
            <input
              type="checkbox"
              checked={createAppt}
              onChange={e => setCreateAppt(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-blue-500"
            />
            <div>
              <p className="text-sm font-semibold text-white">Create appointment in Schedule</p>
              <p className="text-[11px] text-slate-500">Fields pre-filled from this job — one tap to confirm</p>
            </div>
          </label>

          {/* Change #4: Add to Clients */}
          {job?.contact && (
            <label className="flex items-start gap-3 cursor-pointer rounded-xl p-3 hover:bg-white/[0.03] transition-colors">
              <input
                type="checkbox"
                checked={doAddClient}
                onChange={e => setDoAddClient(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-blue-500"
              />
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5 text-blue-400" />
                  Add <span className="text-blue-300 mx-1">"{job.contact}"</span> to Clients
                </p>
                <p className="text-[11px] text-slate-500">For follow-up, portal links &amp; invoicing</p>
              </div>
            </label>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Btn variant="ghost" size="sm" className="flex-1" onClick={onClose}>
            Skip
          </Btn>
          <Btn variant="emerald" size="sm" className="flex-1" onClick={() => onConfirm({ createAppt, doAddClient })}>
            {createAppt ? 'Confirm & Schedule →' : 'Confirm Job'}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function JobInboxPage() {
  const { data, addJob, updateJob, deleteJob, advanceJobLifecycle, addJobExpense, deleteJobExpense, addAppointment, addClient } = useData();
  const navigate = useNavigate();

  const [messageText,  setMessageText]  = useState('');
  const [messageSource, setMessageSource] = useState('email');
  const [parsing,      setParsing]      = useState(false);
  const [parsedJob,    setParsedJob]    = useState(null);
  const [evaluation,   setEvaluation]   = useState(null);
  const [parseError,   setParseError]   = useState('');
  const [selectedJob,  setSelectedJob]  = useState(null);
  const [tab,          setTab]          = useState('inbox'); // 'inbox' | 'detail' | 'analytics'
  const [toast,        setToast]        = useState('');

  // ── Image upload state (Change #1) ─────────────────────────────────────
  const [imagePreview,  setImagePreview]  = useState('');
  const [imageBase64,   setImageBase64]   = useState('');
  const [imageMime,     setImageMime]     = useState('');
  const [imageScanning, setImageScanning] = useState(false);
  const fileInputRef = useRef(null);

  // ── Accept flow state (Changes #2 #3 #4) ──────────────────────────────
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptingJob,    setAcceptingJob]    = useState(null);
  const [showApptModal,   setShowApptModal]   = useState(false);
  const [apptInitial,     setApptInitial]     = useState(null);

  const jobs      = data.jobs || [];
  const expenses  = data.jobExpenses || [];
  const settings  = data.settings || {};

  const userSettings = {
    minAcceptableFee:  settings.minAcceptableFee  || 75,
    travelRadiusMiles: settings.travelRadiusMiles || 40,
    costPerMile:       settings.costPerMile        || 0.67,
  };

  // analytics
  const totalIncome   = jobs.filter(j => j.lifecycle_stage === 'payment_received').reduce((s, j) => s + (j.offered_fee || 0), 0);
  const pendingJobs   = jobs.filter(j => ['request_detected','negotiation'].includes(j.lifecycle_stage)).length;
  const acceptedJobs  = jobs.filter(j => ['accepted','documents_received','scheduled','completed','invoice_sent','payment_received'].includes(j.lifecycle_stage)).length;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // ── Parse message ──────────────────────────────────────────────────────────
  const handleAnalyze = () => {
    setParseError('');
    setParsedJob(null);
    setEvaluation(null);
    setParsing(true);

    setTimeout(() => {
      const result = parseJobMessage(messageText);
      if (!result) {
        setParseError("No job opportunity detected in this message. Try including job type, location, date, or fee details.");
        setParsing(false);
        return;
      }
      result.source = messageSource;
      const eval_ = evaluateProfitability(result, userSettings);
      setParsedJob(result);
      setEvaluation(eval_);
      setParsing(false);
    }, 600); // brief "thinking" delay for UX
  };

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleAction = (action) => {
    if (!parsedJob) return;
    const statusMap = {
      accept:       { status: 'accepted',    lifecycle_stage: 'accepted'     },
      counter:      { status: 'negotiating', lifecycle_stage: 'negotiation'  },
      decline:      { status: 'declined',    lifecycle_stage: 'request_detected' },
      request_info: { status: 'pending_info',lifecycle_stage: 'request_detected' },
    };
    const updates = statusMap[action] || {};
    const newJob = {
      ...parsedJob,
      ...updates,
      counter_offer: action === 'counter' ? evaluation?.counter_offer : undefined,
      evaluation,
    };

    // ── Accept: show the Accept Flow modal (Changes #2 #3 #4) ─────────────
    if (action === 'accept') {
      setAcceptingJob(newJob);
      setShowAcceptModal(true);
      // Reset parse state
      setMessageText('');
      setParsedJob(null);
      setEvaluation(null);
      setImagePreview('');
      setImageBase64('');
      return;
    }

    addJob(newJob);
    showToast(
      action === 'counter'    ? `💬 Counter offer of $${evaluation?.counter_offer} logged.`
      : action === 'decline'    ? '✗ Job declined.'
      : 'ℹ️ More info requested — job saved as pending.'
    );
    // Reset
    setMessageText('');
    setParsedJob(null);
    setEvaluation(null);
    if (action !== 'decline') {
      setSelectedJob(newJob);
      setTab('detail');
    }
  };

  // ── Confirm accept (from AcceptModal) ──────────────────────────────────────
  const handleConfirmAccept = ({ createAppt, doAddClient }) => {
    if (!acceptingJob) return;
    addJob(acceptingJob);

    // Change #4: add signer to Clients if requested
    if (doAddClient && acceptingJob.contact) {
      const existing = (data.clients || []).find(
        (c) => c.name?.toLowerCase() === acceptingJob.contact?.toLowerCase()
      );
      if (!existing) {
        addClient({
          id: `client_job_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          name:      acceptingJob.contact,
          phone:     acceptingJob.phone || '',
          email:     '',
          type:      'Signer',
          notes:     `Added from Job Inbox — ${acceptingJob.document_type || 'signing job'}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    setShowAcceptModal(false);

    // Change #2: open AppointmentModal pre-filled
    if (createAppt) {
      setApptInitial({
        client:   acceptingJob.contact || '',
        type:     MARKET_BENCHMARKS[acceptingJob.job_type]?.label || 'Loan Signing',
        date:     acceptingJob.date || '',
        time:     acceptingJob.time || '',
        fee:      acceptingJob.offered_fee ? String(acceptingJob.offered_fee) : '',
        address:  acceptingJob.location || '',
        location: '',
        phone:    acceptingJob.phone || '',
        email:    '',
        notes:    `From Job Inbox · Source: ${acceptingJob.source || 'unknown'}`,
      });
      setShowApptModal(true);
    } else {
      setSelectedJob(acceptingJob);
      setTab('detail');
      showToast('✅ Job accepted!');
    }
  };

  // ── Save appointment created from accepted job ─────────────────────────────
  const handleSaveFromJobAppt = (formData) => {
    const newAppt = {
      id:          `appt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      clientName:  formData.client,
      date:        formData.date,
      time:        formData.time,
      notaryType:  formData.type,
      status:      'scheduled',
      clientEmail: formData.email  || '',
      clientPhone: formData.phone  || '',
      location:    formData.location || formData.address || '',
      address:     formData.address || '',
      fee:         formData.fee ? parseFloat(formData.fee) : 0,
      notes:       formData.notes || '',
      createdAt:   new Date().toISOString(),
    };
    addAppointment(newAppt);
    setShowApptModal(false);
    setSelectedJob(acceptingJob);
    setTab('detail');
    showToast('✅ Job accepted & appointment created!');
  };

  // ── Image upload handlers (Change #1) ──────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImagePreview(dataUrl);
      const [header, b64] = dataUrl.split(',');
      const mime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
      setImageBase64(b64);
      setImageMime(mime);
    };
    reader.readAsDataURL(file);
    // Reset file input so the same file can be re-selected
    e.target.value = '';
  };

  const handleScanImage = async () => {
    if (!imageBase64) return;
    setImageScanning(true);
    setParseError('');
    setParsedJob(null);
    setEvaluation(null);
    try {
      const extracted = await parseJobImage(imageBase64, imageMime);
      if (!extracted) {
        setParseError('Could not extract job details from this image. Try a clearer screenshot or crop it to just the offer details.');
        setImageScanning(false);
        return;
      }
      const mapped = {
        id:            `job_img_${Date.now()}`,
        document_type: extracted.documentType || 'Unknown',
        job_type:      extracted.jobType      || 'general_notary',
        location:      extracted.address      || extracted.location || '',
        date:          extracted.date         || '',
        time:          extracted.time         || '',
        offered_fee:   extracted.offeredFee   || null,
        contact:       extracted.clientName   || extracted.contact  || '',
        phone:         extracted.phone        || '',
        distance_miles:null,
        source:        messageSource,
      };
      const eval_ = evaluateProfitability(mapped, userSettings);
      setParsedJob(mapped);
      setEvaluation(eval_);
    } catch {
      setParseError('Image scan failed. Please try again or paste the text instead.');
    }
    setImageScanning(false);
  };

  const clearImage = () => {
    setImagePreview('');
    setImageBase64('');
    setImageMime('');
    setParsedJob(null);
    setEvaluation(null);
    setParseError('');
  };

  // ── Lifecycle advance ──────────────────────────────────────────────────────
  const handleAdvanceLifecycle = (jobId, newStage) => {
    advanceJobLifecycle(jobId, newStage);
    setSelectedJob(prev => prev ? { ...prev, lifecycle_stage: newStage } : prev);
    showToast(`Stage updated: ${JOB_LIFECYCLE_STAGES.find(s => s.id === newStage)?.label}`);
    // If payment received → offer to create invoice
    if (newStage === 'invoice_sent') {
      navigate('/invoices');
    }
  };

  const selectedJobExpenses = selectedJob ? expenses.filter(e => e.job_id === selectedJob.id) : [];

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080f1d] text-white">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-white/15 bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] bg-[#0a1220] px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/25">
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Job Inbox</h1>
              <p className="text-xs text-slate-500">AI-powered job detection &amp; profitability analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="ghost" size="sm" onClick={() => setTab('analytics')}>
              <BarChart2 className="h-3.5 w-3.5" /> Analytics
            </Btn>
          </div>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.04] bg-[#090e1c] px-6 py-3">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Income',    value: `$${totalIncome.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
            { label: 'Active Jobs',     value: acceptedJobs,                        icon: CheckCircle2, color: 'text-blue-400'   },
            { label: 'Pending Review',  value: pendingJobs,                         icon: Clock,       color: 'text-amber-400'  },
            { label: 'Total Expenses',  value: `$${totalExpenses.toFixed(0)}`,      icon: TrendingDown, color: 'text-slate-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className={`text-lg font-black leading-none ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-wide">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-6">

        {/* ── Tab: Analytics ────────────────────────────────────────────────── */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setTab('inbox')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Back to Inbox</button>
              <h2 className="text-lg font-black">Job Analytics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <p className="text-sm font-bold text-slate-300 mb-4">Job Type Breakdown</p>
                {Object.entries(
                  jobs.reduce((acc, j) => {
                    acc[j.job_type] = (acc[j.job_type] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3 mb-2">
                    <p className="text-xs text-slate-400 w-32 truncate capitalize">{type.replace(/_/g,' ')}</p>
                    <div className="flex-1 h-2 rounded-full bg-white/5">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min((count / jobs.length) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 w-4 text-right">{count}</span>
                  </div>
                ))}
                {jobs.length === 0 && <p className="text-xs text-slate-600 py-4 text-center">No jobs yet</p>}
              </Card>

              <Card>
                <p className="text-sm font-bold text-slate-300 mb-4">Income vs Expenses</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total Income (paid)</span>
                    <span className="text-sm font-black text-emerald-400">${totalIncome.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total Expenses</span>
                    <span className="text-sm font-black text-red-400">${totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/8 pt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Net Profit</span>
                    <span className={`text-base font-black ${totalIncome - totalExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${(totalIncome - totalExpenses).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-white/[0.03] p-3 border border-white/6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tax Deduction (IRS mileage)</p>
                  <p className="text-lg font-black text-blue-400">
                    ${expenses.filter(e => e.category === 'mileage').reduce((s, e) => s + (e.amount || 0), 0).toFixed(2)}
                  </p>
                </div>
              </Card>
            </div>

            {/* All expenses table */}
            <Card>
              <p className="text-sm font-bold text-slate-300 mb-4">All Expenses (Tax Ready)</p>
              {expenses.length === 0 ? (
                <p className="text-xs text-slate-600 py-4 text-center">No expenses recorded yet. Add expenses from the job detail view.</p>
              ) : (
                <div className="space-y-2">
                  {expenses.map(e => {
                    const job = jobs.find(j => j.id === e.job_id);
                    return (
                      <div key={e.id} className="flex items-center gap-3 text-xs border-b border-white/5 pb-2">
                        <span className="text-slate-500 w-20 capitalize">{e.category}</span>
                        <span className="text-white font-semibold w-16">${e.amount?.toFixed(2)}</span>
                        <span className="text-slate-500 flex-1 truncate">{job?.document_type || 'Unlinked'} · {e.note || ''}</span>
                        <span className="text-slate-600">{e.created_at?.slice(0,10)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── Tab: Job Detail ────────────────────────────────────────────────── */}
        {tab === 'detail' && selectedJob && (
          <div className="space-y-4">
            <button onClick={() => { setTab('inbox'); setSelectedJob(null); }} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
              ← Back to Inbox
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: lifecycle tracker */}
              <Card>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Job Lifecycle</p>
                <div className="mb-3">
                  <h3 className="text-base font-black text-white">{selectedJob.document_type}</h3>
                  <p className="text-xs text-slate-500">{selectedJob.location} · {selectedJob.date} {selectedJob.time}</p>
                </div>
                <LifecycleTracker
                  currentStage={selectedJob.lifecycle_stage}
                  onAdvance={(newStage) => handleAdvanceLifecycle(selectedJob.id, newStage)}
                />
              </Card>

              {/* Right: expense tracker + detail */}
              <div className="space-y-4">
                <Card>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Offered Fee',    value: selectedJob.offered_fee ? `$${selectedJob.offered_fee}` : '—' },
                      { label: 'Counter Offer',  value: selectedJob.counter_offer ? `$${selectedJob.counter_offer}` : '—' },
                      { label: 'Status',         value: selectedJob.status || '—' },
                      { label: 'Source',         value: selectedJob.source || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl bg-white/[0.03] p-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-bold text-white mt-1 capitalize">{value}</p>
                      </div>
                    ))}
                  </div>
                  {selectedJob.evaluation?.reasoning?.map((r, i) => (
                    <p key={i} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                      <Info className="h-3 w-3 shrink-0 mt-0.5 text-blue-500" />{r}
                    </p>
                  ))}
                </Card>

                <Card>
                  <ExpenseRecorder
                    jobId={selectedJob.id}
                    expenses={selectedJobExpenses}
                    onAdd={addJobExpense}
                    onDelete={deleteJobExpense}
                  />
                </Card>

                <div className="flex gap-2">
                  <Btn
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate('/schedule')}
                  >
                    <Clock className="h-3.5 w-3.5" /> Add to Schedule
                  </Btn>
                  <Btn
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate('/invoices')}
                  >
                    <FileText className="h-3.5 w-3.5" /> Create Invoice
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Inbox (default) ──────────────────────────────────────────── */}
        {tab === 'inbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left column: message input + analysis */}
            <div className="space-y-4">
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-blue-400" /> Paste a Message to Analyze
                  </p>
                  {/* Source selector */}
                  <div className="flex gap-1">
                    {MESSAGE_SOURCES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setMessageSource(s.id)}
                        title={s.label}
                        className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all
                          ${messageSource === s.id ? 'bg-blue-600/30 text-blue-300' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                        {s.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change #1: Image upload section */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                {!imagePreview ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-3 py-2.5 text-xs font-semibold text-slate-500 hover:border-blue-500/40 hover:text-blue-400 hover:bg-blue-500/[0.04] transition-all"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Upload Screenshot — Snapdocs, SigningOrder, Amrock, etc.
                  </button>
                ) : (
                  <div className="mb-3 space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20">
                      <img src={imagePreview} alt="Job offer screenshot" className="w-full max-h-52 object-contain" />
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Btn
                      variant="primary"
                      onClick={handleScanImage}
                      disabled={imageScanning}
                      className="w-full"
                    >
                      {imageScanning
                        ? <><RefreshCw className="h-4 w-4 animate-spin" /> Scanning Image…</>
                        : <><Sparkles className="h-4 w-4" /> Scan with AI</>
                      }
                    </Btn>
                    <div className="flex items-center gap-2 my-1">
                      <div className="flex-1 h-px bg-white/8" />
                      <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">or paste text below</span>
                      <div className="flex-1 h-px bg-white/8" />
                    </div>
                  </div>
                )}

                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder={`Paste an email, SMS, or voicemail transcript here...\n\nExample: "Refi signing tomorrow at 2pm in Columbus OH. $90 fee. Call John at 555-1234."`}
                  rows={6}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />

                {parseError && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">{parseError}</p>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Btn
                    variant="primary"
                    onClick={handleAnalyze}
                    disabled={!messageText.trim() || parsing}
                    className="flex-1"
                  >
                    {parsing ? <><RefreshCw className="h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="h-4 w-4" /> Analyze Message</>}
                  </Btn>
                  {messageText && (
                    <Btn variant="ghost" size="icon" onClick={() => { setMessageText(''); setParsedJob(null); setEvaluation(null); setParseError(''); }}>
                      <X className="h-4 w-4" />
                    </Btn>
                  )}
                </div>
              </Card>

              {/* Analysis result */}
              {parsedJob && evaluation && (
                <Card>
                  <JobEvaluationCard
                    job={parsedJob}
                    evaluation={evaluation}
                    onAction={handleAction}
                    onCopyScript={() => showToast('Script copied!')}
                  />
                </Card>
              )}

              {/* Quick settings hint */}
              {!parsedJob && (
                <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">Your Intelligence Settings</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Min Acceptable Fee', value: `$${userSettings.minAcceptableFee}` },
                      { label: 'Travel Radius',       value: `${userSettings.travelRadiusMiles} mi` },
                      { label: 'Mileage Rate',        value: `$${userSettings.costPerMile}/mi`     },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-xs">
                        <span className="text-slate-600">{label}: </span>
                        <span className="text-slate-300 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/settings')}
                    className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    Update in Settings <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Right column: job list */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-white">
                  Your Jobs <span className="text-slate-600 font-normal text-xs ml-1">({jobs.length})</span>
                </p>
                <Btn variant="ghost" size="sm" onClick={() => setTab('analytics')}>
                  <BarChart2 className="h-3.5 w-3.5" /> View Analytics
                </Btn>
              </div>

              {jobs.length === 0 ? (
                <Card className="text-center py-12">
                  <Inbox className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">No jobs yet</p>
                  <p className="text-xs text-slate-600 mt-1">Paste a message on the left to detect your first job.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {/* Active / Pending */}
                  {jobs.filter(j => !['declined'].includes(j.status)).map(job => (
                    <JobRow
                      key={job.id}
                      job={job}
                      onSelect={(j) => { setSelectedJob(j); setTab('detail'); }}
                      onDelete={deleteJob}
                    />
                  ))}
                  {/* Declined (collapsed) */}
                  {jobs.filter(j => j.status === 'declined').length > 0 && (
                    <details className="group">
                      <summary className="text-[11px] text-slate-600 hover:text-slate-400 cursor-pointer py-1 list-none flex items-center gap-1">
                        <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                        {jobs.filter(j => j.status === 'declined').length} declined job(s)
                      </summary>
                      <div className="space-y-2 mt-2">
                        {jobs.filter(j => j.status === 'declined').map(job => (
                          <JobRow key={job.id} job={job} onSelect={(j) => { setSelectedJob(j); setTab('detail'); }} onDelete={deleteJob} />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change #2 #3 #4: Accept flow modal */}
      {showAcceptModal && acceptingJob && (
        <AcceptModal
          job={acceptingJob}
          onConfirm={handleConfirmAccept}
          onClose={() => {
            setShowAcceptModal(false);
            addJob(acceptingJob);
            setSelectedJob(acceptingJob);
            setTab('detail');
            showToast('✅ Job accepted!');
          }}
        />
      )}

      {/* Change #2: Appointment modal pre-filled from job */}
      {showApptModal && (
        <AppointmentModal
          isOpen={showApptModal}
          onClose={() => { setShowApptModal(false); setSelectedJob(acceptingJob); setTab('detail'); showToast('✅ Job accepted!'); }}
          onSave={handleSaveFromJobAppt}
          initialData={apptInitial}
          submitLabel="Create Appointment"
        />
      )}
    </div>
  );
}
