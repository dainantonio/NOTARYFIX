import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, BarChart2, CheckCircle2,
  ChevronDown, ChevronRight, Clock, DollarSign, Download, Edit2,
  FileCheck, FileText, Inbox, MapPin, MessageSquare, Phone, Pin,
  Plus, Search, Send, Shield, Star, Trash2, TrendingUp,
  User, UserCheck, Users, X, Zap,
} from 'lucide-react';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
  Input, Label, Select,
} from '../components/UI';
import { useData } from '../context/DataContext';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUSES = ['unassigned', 'assigned', 'in_progress', 'completed'];

const STATUS_META = {
  unassigned:  { label: 'Unassigned',  color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',          dot: 'bg-slate-400', badge: 'default' },
  assigned:    { label: 'Assigned',    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',             dot: 'bg-blue-500',  badge: 'blue'    },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',         dot: 'bg-amber-500', badge: 'warning' },
  completed:   { label: 'Completed',   color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', badge: 'success' },
};

const PRIORITY_META = {
  low:    { label: 'Low',    color: 'text-slate-500 dark:text-slate-400',       dot: 'bg-slate-400', badge: 'default' },
  normal: { label: 'Normal', color: 'text-blue-600 dark:text-blue-400',         dot: 'bg-blue-500',  badge: 'blue'    },
  high:   { label: 'High',   color: 'text-amber-600 dark:text-amber-400',       dot: 'bg-amber-500', badge: 'warning' },
  urgent: { label: 'Urgent', color: 'text-red-600 dark:text-red-400 font-bold', dot: 'bg-red-500',   badge: 'danger'  },
};

const MEMBER_STATUS_META = {
  available: { label: 'Available', color: 'bg-emerald-500' },
  on_job:    { label: 'On Job',    color: 'bg-amber-500'   },
  offline:   { label: 'Offline',   color: 'bg-slate-400'   },
};

const ACT_TYPES = [
  'Loan Signing', 'I-9 Verification', 'Acknowledgment', 'Jurat',
  'Power of Attorney', 'Deed of Trust', 'Copy Certification',
  'Remote Online Notary (RON)', 'Other',
];

const QA_STEPS = [
  { key: 'docsReceived',   label: 'Documents Received'       },
  { key: 'docsVerified',   label: 'Documents Verified'       },
  { key: 'docsSigned',     label: 'Signing Completed'        },
  { key: 'notarized',      label: 'Notarization Confirmed'   },
  { key: 'returnedClient', label: 'Documents Returned / Sent' },
];

const PAYOUT_STATUS_META = {
  pending:  { label: 'Pending',  color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'     },
  paid:     { label: 'Paid',     color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  disputed: { label: 'Disputed', color: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'             },
};

const AUDIT_ACTION_META = {
  assigned:           { label: 'Assigned',       color: 'bg-blue-500'    },
  unassigned:         { label: 'Unassigned',     color: 'bg-slate-400'   },
  status_change:      { label: 'Status Changed', color: 'bg-amber-500'   },
  payout_marked_paid: { label: 'Payout Paid',    color: 'bg-emerald-500' },
  qa_updated:         { label: 'QA Updated',     color: 'bg-violet-500'  },
  handoff_note:       { label: 'Handoff Note',   color: 'bg-indigo-500'  },
};

const BLANK_JOB = {
  title: '', clientName: '', clientPhone: '', actType: 'Loan Signing',
  priority: 'normal', region: '', address: '', fee: '',
  scheduledAt: '', slaDeadline: '', notes: '',
};

const AGENCY_CUT_PCT = 0.2;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDT = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return iso; }
};
const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
};
const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const slaStatus = (slaDeadline, status) => {
  if (status === 'completed') return { level: 'met',     label: 'Met',    ms: 0 };
  if (!slaDeadline)           return { level: 'none',    label: 'No SLA', ms: Infinity };
  const ms = new Date(slaDeadline).getTime() - Date.now();
  if (ms < 0)               return { level: 'overdue', label: `${Math.abs(Math.round(ms / 60000))}m overdue`, ms };
  if (ms < 3600000)         return { level: 'at_risk', label: `${Math.round(ms / 60000)}m left`,              ms };
  if (ms < 2 * 3600000)     return { level: 'warning', label: `${Math.round(ms / 3600000 * 10) / 10}h left`,  ms };
  return { level: 'ok', label: `${Math.round(ms / 3600000 * 10) / 10}h left`, ms };
};
const SLA_COLORS = {
  overdue: 'text-red-600 dark:text-red-400', at_risk: 'text-red-500 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400', ok: 'text-emerald-600 dark:text-emerald-400',
  met: 'text-slate-400', none: 'text-slate-400',
};
const avgMinutes = (list, from, to) => {
  const pairs = list.filter((j) => j[from] && j[to]);
  if (!pairs.length) return null;
  return Math.round(pairs.reduce((s, j) => s + (new Date(j[to]) - new Date(j[from])), 0) / pairs.length / 60000);
};
const scoreAssignment = (member, job, allJobs) => {
  let score = 0;
  if (member.status === 'offline') return -999;
  if (member.status === 'available') score += 30;
  if (member.status === 'on_job') score += 5;
  if (job.region && member.regions?.includes(job.region)) score += 40;
  const active = allJobs.filter((j) => j.assignedMemberId === member.id && j.status !== 'completed').length;
  score -= Math.min(active * 10, 30);
  score += Math.min((member.completedJobCount || 0) * 2, 20);
  return score;
};
const exportCSV = (rows, filename) => {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(',');
  const body = rows.map((r) =>
    Object.values(r).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ─── SLA TIMER ────────────────────────────────────────────────────────────────
const SlaTimer = ({ slaDeadline, status }) => {
  const [, rerender] = useState(0);
  useEffect(() => {
    if (status === 'completed') return;
    const t = setInterval(() => rerender((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, [status]);
  const info = slaStatus(slaDeadline, status);
  if (info.level === 'none') return null;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${SLA_COLORS[info.level]}`}>
      <Clock className="h-3 w-3 shrink-0" />{info.label}
    </span>
  );
};

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const Avatar = ({ member, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sz} ${member?.avatarColor || 'bg-slate-500'} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {member?.avatarInitials || '?'}
    </div>
  );
};

// ─── QA PROGRESS BAR ─────────────────────────────────────────────────────────
const QABar = ({ qa }) => {
  const done = QA_STEPS.filter((s) => qa?.[s.key]).length;
  const pct = Math.round((done / QA_STEPS.length) * 100);
  const color = pct === 100 ? 'bg-emerald-500' : pct > 60 ? 'bg-blue-500' : pct > 0 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-medium text-slate-500 w-8 text-right">{done}/{QA_STEPS.length}</span>
    </div>
  );
};

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, iconBg, label, value, sub, alert }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
          <p className={`text-2xl font-bold ${alert ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{value}</p>
          {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── JOB MODAL ────────────────────────────────────────────────────────────────
const JobModal = ({ isOpen, onClose, onSave, initial }) => {
  const [form, setForm] = useState(BLANK_JOB);
  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      const fmt = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
      setForm({ ...BLANK_JOB, ...initial, fee: String(initial.fee || ''), scheduledAt: fmt(initial.scheduledAt), slaDeadline: fmt(initial.slaDeadline) });
    } else {
      setForm({ ...BLANK_JOB });
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      fee: parseFloat(form.fee) || 0,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      slaDeadline: form.slaDeadline ? new Date(form.slaDeadline).toISOString() : null,
    });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white"><Inbox className="h-4 w-4" /></div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{initial ? 'Edit Job' : 'New Dispatch Job'}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Job Title <span className="text-red-500">*</span></Label>
            <Input required placeholder="e.g. Loan Closing — Waterfront Condo" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Client Name <span className="text-red-500">*</span></Label><Input required placeholder="Client or company" value={form.clientName} onChange={(e) => set('clientName', e.target.value)} /></div>
            <div><Label>Client Phone</Label><Input placeholder="(206) 555-0000" value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Act Type <span className="text-red-500">*</span></Label>
              <Select value={form.actType} onChange={(e) => set('actType', e.target.value)} options={ACT_TYPES.map((t) => ({ value: t, label: t }))} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onChange={(e) => set('priority', e.target.value)} options={[{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Region / ZIP</Label><Input placeholder="e.g. 98101" maxLength={10} value={form.region} onChange={(e) => set('region', e.target.value)} /></div>
            <div><Label>Fee ($)</Label><Input type="number" step="0.01" min="0" placeholder="0.00" value={form.fee} onChange={(e) => set('fee', e.target.value)} /></div>
          </div>
          <div><Label>Service Address</Label><Input placeholder="Full street address" value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Scheduled At</Label><Input type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} /></div>
            <div><Label>SLA Deadline</Label><Input type="datetime-local" value={form.slaDeadline} onChange={(e) => set('slaDeadline', e.target.value)} /></div>
          </div>
          <div>
            <Label>Internal Notes</Label>
            <textarea rows={3} placeholder="Parking instructions, client preferences..." value={form.notes} onChange={(e) => set('notes', e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1">{initial ? 'Save Changes' : 'Create Job'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── JOB DRAWER ───────────────────────────────────────────────────────────────
const JobDrawer = ({ job, onClose, teamMembers, dispatchNotes, allJobs, onAssign, onAdvanceStatus, onAddNote, onDeleteNote, onEdit, onDelete, onUpdateQA, onAddHandoff }) => {
  const [noteText, setNoteText]       = useState('');
  const [handoffText, setHandoffText] = useState('');
  const [drawerTab, setDrawerTab]     = useState('details');
  const [showDel, setShowDel]         = useState(false);
  const notesEndRef = useRef(null);

  const jobNotes = useMemo(() =>
    (dispatchNotes || []).filter((n) => n.jobId === job?.id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [dispatchNotes, job?.id]
  );
  useEffect(() => { notesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [jobNotes.length]);

  if (!job) return null;

  const assignedMember = teamMembers.find((m) => m.id === job.assignedMemberId);
  const sla = slaStatus(job.slaDeadline, job.status);
  const sm  = STATUS_META[job.status]   || STATUS_META.unassigned;
  const pm  = PRIORITY_META[job.priority] || PRIORITY_META.normal;
  const nextStatus      = { unassigned: null, assigned: 'in_progress', in_progress: 'completed', completed: null }[job.status];
  const nextStatusLabel = { in_progress: 'Start Job', completed: 'Complete Job' }[nextStatus];

  const scored = teamMembers
    .filter((m) => m.status !== 'offline')
    .map((m) => ({ ...m, score: scoreAssignment(m, job, allJobs) }))
    .sort((a, b) => b.score - a.score);
  const topSuggestion = scored[0]?.score > 0 ? scored[0] : null;

  const qa           = job.qa || {};
  const handoffNotes = job.handoffNotes || [];

  const handleSendNote = () => {
    const t = noteText.trim();
    if (!t) return;
    onAddNote({ jobId: job.id, authorName: 'Dispatcher', authorId: null, content: t, isPinned: false });
    setNoteText('');
  };
  const handleHandoff = () => {
    const t = handoffText.trim();
    if (!t) return;
    onAddHandoff(job.id, { content: t, author: 'Dispatcher', ts: new Date().toISOString() });
    setHandoffText('');
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{job.jobNumber}</span>
              <Badge variant={pm.badge} className="text-[10px]">{pm.label}</Badge>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sm.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />{sm.label}
              </span>
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">{job.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"><X className="h-5 w-5" /></button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {[['details', 'Details'], ['qa', 'Doc QA'], ['handoff', 'Handoff']].map(([k, lbl]) => (
            <button key={k} onClick={() => setDrawerTab(k)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${drawerTab === k ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── DETAILS ───────────────────────────────────────────────────────── */}
          {drawerTab === 'details' && (
            <>
              <div className="px-6 py-4 space-y-4 border-b border-slate-100 dark:border-slate-800">
                <div className={`flex items-center gap-2 rounded-xl p-3 border ${
                  sla.level === 'overdue' || sla.level === 'at_risk' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                  sla.level === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                  'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                  <Clock className={`h-4 w-4 shrink-0 ${SLA_COLORS[sla.level]}`} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">SLA Deadline</p>
                    <p className="text-xs text-slate-500">{fmtDT(job.slaDeadline)}</p>
                  </div>
                  <SlaTimer slaDeadline={job.slaDeadline} status={job.status} />
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div><dt className="text-slate-400 mb-0.5">Act Type</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{job.actType}</dd></div>
                  <div><dt className="text-slate-400 mb-0.5">Fee</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">${Number(job.fee || 0).toFixed(2)}</dd></div>
                  <div><dt className="text-slate-400 mb-0.5">Client</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{job.clientName}</dd></div>
                  <div><dt className="text-slate-400 mb-0.5">Phone</dt><dd>
                    {job.clientPhone
                      ? <a href={`tel:${job.clientPhone}`} className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1"><Phone className="h-3 w-3" />{job.clientPhone}</a>
                      : <span className="text-slate-400">—</span>}
                  </dd></div>
                  <div><dt className="text-slate-400 mb-0.5">Region</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{job.region || '—'}</dd></div>
                  <div><dt className="text-slate-400 mb-0.5">Scheduled</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{fmtDT(job.scheduledAt)}</dd></div>
                  {job.address && (
                    <div className="col-span-2">
                      <dt className="text-slate-400 mb-0.5">Address</dt>
                      <dd className="font-medium text-slate-700 dark:text-slate-200 flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5 text-slate-400 shrink-0" />{job.address}</dd>
                    </div>
                  )}
                  {job.notes && (
                    <div className="col-span-2">
                      <dt className="text-slate-400 mb-0.5">Notes</dt>
                      <dd className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-600 dark:text-slate-300 italic">{job.notes}</dd>
                    </div>
                  )}
                </dl>
                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {[['Created', job.createdAt], ['Assigned', job.assignedAt], ['Started', job.startedAt], ['Completed', job.completedAt]].map(([lbl, ts]) => ts && (
                    <div key={lbl} className="flex items-center gap-2">
                      <span className="w-16 text-slate-400">{lbl}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>{fmtDT(ts)}</span>
                      <span className="ml-auto text-slate-400">{timeAgo(ts)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment section */}
              {job.status !== 'completed' && (
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Assign Notary</p>
                  {assignedMember ? (
                    <div className="flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 mb-3">
                      <Avatar member={assignedMember} />
                      <div className="flex-1"><p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{assignedMember.name}</p><p className="text-xs text-slate-400">{assignedMember.regions?.join(', ')}</p></div>
                      <button onClick={() => onAssign(job.id, null)} className="text-xs text-red-500 hover:text-red-600 transition-colors">Unassign</button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mb-2">No notary assigned yet.</p>
                  )}
                  <div className="space-y-2">
                    {scored.map((m) => {
                      const mSm = MEMBER_STATUS_META[m.status] || MEMBER_STATUS_META.offline;
                      const isAssigned  = m.id === job.assignedMemberId;
                      const isSuggested = topSuggestion?.id === m.id && !isAssigned;
                      return (
                        <button key={m.id} onClick={() => !isAssigned && onAssign(job.id, m.id)} disabled={isAssigned}
                          className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${isAssigned ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 cursor-default' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'}`}>
                          <Avatar member={m} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{m.name}</p>
                              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className={`w-1.5 h-1.5 rounded-full ${mSm.color}`} />{mSm.label}</span>
                              {isSuggested && <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded px-1">Best Match</span>}
                            </div>
                            <p className="text-[10px] text-slate-400">Regions: {m.regions?.slice(0, 3).join(', ') || 'any'} · {m.activeJobCount || 0} active</p>
                          </div>
                          {isAssigned && <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Internal notes */}
              <div className="px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                  Internal Notes {jobNotes.length > 0 && <span className="ml-1 text-slate-500">({jobNotes.length})</span>}
                </p>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {jobNotes.length === 0 && <p className="text-xs text-slate-400 italic">No notes yet.</p>}
                  {jobNotes.map((note) => (
                    <div key={note.id} className="group relative rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{note.authorName}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{timeAgo(note.createdAt)}</span>
                        <button onClick={() => onDeleteNote(note.id)} className="hidden group-hover:block rounded p-0.5 text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                  <div ref={notesEndRef} />
                </div>
                <div className="flex gap-2">
                  <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendNote())}
                    placeholder="Add a note..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <Button size="icon" onClick={handleSendNote} disabled={!noteText.trim()}><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}

          {/* ── DOC QA ────────────────────────────────────────────────────────── */}
          {drawerTab === 'qa' && (
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Document QA Checklist</p>
                <p className="text-xs text-slate-500 mb-4">Track each stage of document handling for this job.</p>
                <div className="space-y-3">
                  {QA_STEPS.map((step) => {
                    const checked = !!qa[step.key];
                    return (
                      <button key={step.key}
                        onClick={() => onUpdateQA(job.id, { ...qa, [step.key]: !checked, [`${step.key}At`]: !checked ? new Date().toISOString() : null })}
                        className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${checked ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700'}`}>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                          {checked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${checked ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{step.label}</p>
                          {checked && qa[`${step.key}At`] && <p className="text-[10px] text-slate-400">{fmtDT(qa[`${step.key}At`])}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Overall QA Progress</p>
                <QABar qa={qa} />
              </div>
            </div>
          )}

          {/* ── HANDOFF ───────────────────────────────────────────────────────── */}
          {drawerTab === 'handoff' && (
            <div className="px-6 py-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Handoff Notes</p>
              <p className="text-xs text-slate-500 mb-3">Notes passed between team members during handoffs.</p>
              <div className="space-y-3 max-h-72 overflow-y-auto mb-4">
                {handoffNotes.length === 0 && <p className="text-xs text-slate-400 italic">No handoff notes yet.</p>}
                {handoffNotes.map((hn, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{hn.author}</span>
                      <span className="text-[10px] text-slate-400">{fmtDT(hn.ts)}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{hn.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={handoffText} onChange={(e) => setHandoffText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleHandoff())}
                  placeholder="Add handoff note..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <Button size="icon" onClick={handleHandoff} disabled={!handoffText.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 flex items-center gap-2">
          {nextStatus && job.assignedMemberId && (
            <Button className="flex-1" onClick={() => onAdvanceStatus(job.id, nextStatus)}>
              {nextStatus === 'in_progress' ? <Activity className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {nextStatusLabel}
            </Button>
          )}
          {nextStatus && !job.assignedMemberId && <p className="flex-1 text-xs text-slate-400 italic">Assign a notary to advance status.</p>}
          <Button variant="ghost" size="icon" onClick={() => onEdit(job)} title="Edit job"><Edit2 className="h-4 w-4" /></Button>
          {!showDel
            ? <Button variant="danger" size="icon" onClick={() => setShowDel(true)}><Trash2 className="h-4 w-4" /></Button>
            : <div className="flex gap-1 items-center">
                <span className="text-xs text-red-600">Delete?</span>
                <Button variant="danger" size="sm" onClick={() => { onDelete(job.id); onClose(); }}>Yes</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowDel(false)}>No</Button>
              </div>
          }
        </div>
      </div>
    </div>
  );
};

// ─── KANBAN COLUMN ────────────────────────────────────────────────────────────
const KanbanColumn = ({ status, jobs, onJobClick }) => {
  const meta = STATUS_META[status];
  const borderColor = { unassigned: 'border-slate-300', assigned: 'border-blue-400', in_progress: 'border-amber-400', completed: 'border-emerald-400' }[status];
  return (
    <div className="flex flex-col min-w-[82vw] sm:min-w-[260px] flex-1" style={{ scrollSnapAlign: "start" }}>
      <div className={`rounded-t-xl border-b-2 ${borderColor} px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-b-none`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{meta.label}</span>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5">{jobs.length}</span>
        </div>
      </div>
      <div className="flex-1 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-xl bg-slate-50 dark:bg-slate-800/30 p-2 space-y-2 min-h-[240px]">
        {jobs.length === 0 && <div className="flex items-center justify-center h-24 text-xs text-slate-400 italic">No jobs</div>}
        {jobs.map((job) => {
          const pm  = PRIORITY_META[job.priority] || PRIORITY_META.normal;
          const sla = slaStatus(job.slaDeadline, job.status);
          const risk = ['overdue', 'at_risk', 'warning'].includes(sla.level);
          return (
            <button key={job.id} onClick={() => onJobClick(job)}
              className={`w-full text-left rounded-xl border bg-white dark:bg-slate-800 p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${risk ? 'border-red-200 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs leading-snug flex-1">{job.title}</p>
                <Badge variant={pm.badge} className="text-[9px] shrink-0">{pm.label}</Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"><User className="h-3 w-3 shrink-0" /><span className="truncate">{job.clientName}</span></div>
                {job.region && <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"><MapPin className="h-3 w-3 shrink-0" /><span>{job.region}</span></div>}
                {job.scheduledAt && <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"><Clock className="h-3 w-3 shrink-0" /><span>{fmtDT(job.scheduledAt)}</span></div>}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <SlaTimer slaDeadline={job.slaDeadline} status={job.status} />
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">${Number(job.fee || 0).toFixed(0)}</span>
              </div>
              {job.qa && <div className="mt-2"><QABar qa={job.qa} /></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── MEMBER MODAL ─────────────────────────────────────────────────────────────
const MemberModal = ({ isOpen, onClose, onSave, initial }) => {
  const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500'];
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'notary', status: 'available', regions: '', avatarColor: 'bg-blue-500' });
  useEffect(() => {
    if (!isOpen) return;
    setForm(initial ? { ...initial, regions: (initial.regions || []).join(', ') } : { name: '', email: '', phone: '', role: 'notary', status: 'available', regions: '', avatarColor: 'bg-blue-500' });
  }, [isOpen, initial]);
  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    const initials = form.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    onSave({ ...form, avatarInitials: initials, regions: form.regions.split(',').map((s) => s.trim()).filter(Boolean), activeJobCount: initial?.activeJobCount || 0, completedJobCount: initial?.completedJobCount || 0, joinedAt: initial?.joinedAt || new Date().toISOString().split('T')[0] });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">{initial ? 'Edit Team Member' : 'Add Team Member'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><Label>Full Name <span className="text-red-500">*</span></Label><Input required placeholder="Maria Reyes" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Email</Label><Input type="email" placeholder="notary@agency.com" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div><Label>Phone</Label><Input placeholder="(206) 555-0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Role</Label><Select value={form.role} onChange={(e) => set('role', e.target.value)} options={[{ value: 'notary', label: 'Notary' }, { value: 'dispatcher', label: 'Dispatcher' }, { value: 'admin', label: 'Admin' }]} /></div>
            <div><Label>Status</Label><Select value={form.status} onChange={(e) => set('status', e.target.value)} options={[{ value: 'available', label: 'Available' }, { value: 'on_job', label: 'On Job' }, { value: 'offline', label: 'Offline' }]} /></div>
          </div>
          <div><Label>Coverage Regions (ZIP codes, comma-separated)</Label><Input placeholder="98101, 98102, 98103" value={form.regions} onChange={(e) => set('regions', e.target.value)} /></div>
          <div>
            <Label>Avatar Color</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => set('avatarColor', c)}
                  className={`w-7 h-7 rounded-full ${c} transition-transform ${form.avatarColor === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1">{initial ? 'Save Changes' : 'Add Member'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MEMBER CARD ──────────────────────────────────────────────────────────────
const MemberCard = ({ member, activeJobCount, onEdit, onDelete }) => {
  const sm = MEMBER_STATUS_META[member.status] || MEMBER_STATUS_META.offline;
  const smTextColor = { 'bg-emerald-500': 'text-emerald-600 dark:text-emerald-400', 'bg-amber-500': 'text-amber-600 dark:text-amber-400', 'bg-slate-400': 'text-slate-500 dark:text-slate-400' }[sm.color] || 'text-slate-500';
  return (
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar member={member} size="lg" />
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${sm.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{member.name}</p>
            <p className="text-xs text-slate-400 truncate">{member.email}</p>
          </div>
          <div className="hidden gap-1 group-hover:flex">
            <Button variant="ghost" size="sm" onClick={() => onEdit(member)}><Edit2 className="h-3.5 w-3.5" /></Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(member.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs">
          <span className={`flex items-center gap-1 font-medium ${smTextColor}`}><span className={`w-1.5 h-1.5 rounded-full ${sm.color}`} />{sm.label}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{activeJobCount} active</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{member.completedJobCount || 0} done</span>
        </div>
        {member.regions?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {member.regions.slice(0, 4).map((r) => (
              <span key={r} className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">{r}</span>
            ))}
            {member.regions.length > 4 && <span className="text-[10px] text-slate-400">+{member.regions.length - 4}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const TeamDispatch = () => {
  const {
    data,
    addDispatchJob, updateDispatchJob, deleteDispatchJob,
    assignDispatchJob, advanceDispatchJobStatus,
    addDispatchNote, updateDispatchNote, deleteDispatchNote,
    addTeamMember, updateTeamMember, deleteTeamMember,
    markJobPaid, updateJobQA, addHandoffNote,
  } = useData();

  const jobs         = data.dispatchJobs    || [];
  const teamMembers  = data.teamMembers     || [];
  const dispatchNotes = data.dispatchNotes  || [];
  const payouts      = data.payouts         || [];
  const auditLog     = data.dispatchAuditLog || [];

  const [activeTab,       setActiveTab]       = useState('board');
  const [selectedJob,     setSelectedJob]     = useState(null);
  const [jobModalOpen,    setJobModalOpen]     = useState(false);
  const [editingJob,      setEditingJob]       = useState(null);
  const [memberModalOpen, setMemberModalOpen]  = useState(false);
  const [editingMember,   setEditingMember]    = useState(null);
  const [searchQuery,     setSearchQuery]      = useState('');
  const [filterPriority,  setFilterPriority]   = useState('');
  const [filterRegion,    setFilterRegion]     = useState('');
  const [filterMember,    setFilterMember]     = useState('');
  const [auditFilter,     setAuditFilter]      = useState('');
  const [perfSort,        setPerfSort]         = useState('completed');

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const open       = jobs.filter((j) => j.status !== 'completed');
    const unassigned = jobs.filter((j) => j.status === 'unassigned');
    const slaRisk    = jobs.filter((j) => {
      if (j.status === 'completed') return false;
      return ['overdue', 'at_risk', 'warning'].includes(slaStatus(j.slaDeadline, j.status).level);
    });
    const avgAssignMins = avgMinutes(jobs.filter((j) => j.assignedAt), 'createdAt', 'assignedAt');
    const pending  = payouts.filter((p) => p.status === 'pending');
    const totalOut = pending.reduce((s, p) => s + Number(p.totalFee || 0), 0);
    return { open: open.length, unassigned: unassigned.length, slaRisk: slaRisk.length, avgAssignMins, pendingPayout: pending.length, totalOutstanding: totalOut };
  }, [jobs, payouts]);

  // ── Filtered jobs ────────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchQ  = !q || [j.title, j.clientName, j.jobNumber, j.region, j.actType].join(' ').toLowerCase().includes(q);
      const matchP  = !filterPriority || j.priority === filterPriority;
      const matchR  = !filterRegion   || j.region === filterRegion;
      const matchM  = !filterMember   || String(j.assignedMemberId) === filterMember;
      return matchQ && matchP && matchR && matchM;
    });
  }, [jobs, searchQuery, filterPriority, filterRegion, filterMember]);

  const jobsByStatus = useMemo(() =>
    STATUSES.reduce((acc, s) => ({ ...acc, [s]: filteredJobs.filter((j) => j.status === s) }), {}),
    [filteredJobs]
  );

  const regionOptions = useMemo(() =>
    [...new Set(jobs.map((j) => j.region).filter(Boolean))].sort().map((r) => ({ value: r, label: r })),
    [jobs]
  );

  // ── Performance data ────────────────────────────────────────────────────────
  const perfData = useMemo(() =>
    teamMembers.map((m) => {
      const mJobs      = jobs.filter((j) => j.assignedMemberId === m.id);
      const completed  = mJobs.filter((j) => j.status === 'completed');
      const slaMet     = completed.filter((j) => {
        if (!j.slaDeadline || !j.completedAt) return true;
        return new Date(j.completedAt) <= new Date(j.slaDeadline);
      });
      const avgComp = avgMinutes(completed, 'startedAt', 'completedAt');
      const revenue = completed.reduce((s, j) => s + Number(j.fee || 0), 0);
      return { id: m.id, name: m.name, avatar: m, totalJobs: mJobs.length, completed: completed.length, slaPct: completed.length ? Math.round((slaMet.length / completed.length) * 100) : null, avgCompMin: avgComp, revenue };
    }),
    [teamMembers, jobs]
  );

  const sortedPerf = useMemo(() => {
    return [...perfData].sort((a, b) => {
      if (perfSort === 'completed') return b.completed - a.completed;
      if (perfSort === 'revenue')   return b.revenue   - a.revenue;
      if (perfSort === 'sla')       return (b.slaPct ?? -1) - (a.slaPct ?? -1);
      return 0;
    });
  }, [perfData, perfSort]);

  // ── Client SLA data ─────────────────────────────────────────────────────────
  const clientSLA = useMemo(() => {
    const map = {};
    jobs.filter((j) => j.clientName).forEach((j) => {
      if (!map[j.clientName]) map[j.clientName] = { client: j.clientName, total: 0, met: 0, missed: 0, revenue: 0 };
      map[j.clientName].total += 1;
      map[j.clientName].revenue += Number(j.fee || 0);
      if (j.status === 'completed') {
        const sla = slaStatus(j.slaDeadline, j.status);
        if (!j.slaDeadline || new Date(j.completedAt) <= new Date(j.slaDeadline)) {
          map[j.clientName].met += 1;
        } else {
          map[j.clientName].missed += 1;
        }
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [jobs]);

  // ── Payout jobs (completed, not yet paid) ───────────────────────────────────
  const payableJobs = useMemo(() =>
    jobs.filter((j) => j.status === 'completed' && j.payoutStatus !== 'paid' && j.assignedMemberId),
    [jobs]
  );

  const jobSave = (form) => {
    if (editingJob) { updateDispatchJob(editingJob.id, form); }
    else { addDispatchJob({ ...form, id: Date.now(), jobNumber: `J-${String(Date.now()).slice(-5)}`, status: 'unassigned', createdAt: new Date().toISOString(), payoutStatus: 'pending' }); }
    setEditingJob(null);
  };
  const memberSave = (form) => {
    if (editingMember) { updateTeamMember(editingMember.id, form); }
    else { addTeamMember({ ...form, id: Date.now(), createdAt: new Date().toISOString() }); }
    setEditingMember(null);
  };
  const openEditJob = (job) => { setEditingJob(job); setJobModalOpen(true); setSelectedJob(null); };
  const clearFilters = () => { setSearchQuery(''); setFilterPriority(''); setFilterRegion(''); setFilterMember(''); };

  const TABS = [
    ['board',       'Dispatch Board'],
    ['team',        'Team & Coverage'],
    ['qa',          'Doc QA'],
    ['payouts',     'Payouts'],
    ['performance', 'Performance'],
    ['audit',       'Audit Log'],
    ['client-sla',  'Client SLA'],
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-10">
      {/* Modals */}
      <JobModal isOpen={jobModalOpen} onClose={() => { setJobModalOpen(false); setEditingJob(null); }} onSave={jobSave} initial={editingJob} />
      <MemberModal isOpen={memberModalOpen} onClose={() => { setMemberModalOpen(false); setEditingMember(null); }} onSave={memberSave} initial={editingMember} />
      {selectedJob && (
        <JobDrawer
          job={jobs.find((j) => j.id === selectedJob.id) || selectedJob}
          onClose={() => setSelectedJob(null)}
          teamMembers={teamMembers}
          dispatchNotes={dispatchNotes}
          allJobs={jobs}
          onAssign={assignDispatchJob}
          onAdvanceStatus={advanceDispatchJobStatus}
          onAddNote={(n) => addDispatchNote({ ...n, id: Date.now(), createdAt: new Date().toISOString() })}
          onDeleteNote={deleteDispatchNote}
          onEdit={openEditJob}
          onDelete={(id) => { deleteDispatchJob(id); setSelectedJob(null); }}
          onUpdateQA={updateJobQA}
          onAddHandoff={addHandoffNote}
        />
      )}

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <Card className="app-hero-card">
        <CardContent className="flex flex-col gap-3 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-200">Agency Operations</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Agency OS</h1>
            <p className="mt-1 text-sm text-slate-200">Dispatch board · SLA timers · QA · Payouts · Performance · Client reporting.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => { setEditingMember(null); setMemberModalOpen(true); }}>
              <Users className="mr-2 h-4 w-4" /> Add Notary
            </Button>
            <Button className="border-0 bg-indigo-500 text-white hover:bg-indigo-600" onClick={() => { setEditingJob(null); setJobModalOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> New Job
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── KPIs ──────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Inbox}         iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"      label="Open Jobs"        value={kpis.open} />
        <KpiCard icon={User}          iconBg="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"    label="Unassigned"       value={kpis.unassigned} alert={kpis.unassigned > 0} />
        <KpiCard icon={AlertTriangle} iconBg="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"          label="SLA at Risk"      value={kpis.slaRisk}    alert={kpis.slaRisk > 0} />
        <KpiCard icon={DollarSign}    iconBg="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"  label="Payout Pending"   value={kpis.pendingPayout} sub={kpis.totalOutstanding > 0 ? `$${kpis.totalOutstanding.toFixed(0)} outstanding` : undefined} alert={kpis.pendingPayout > 0} />
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`whitespace-nowrap px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px min-h-[44px] flex items-center ${activeTab === key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ DISPATCH BOARD ════════════════════════════════════════════════════════ */}
      {activeTab === 'board' && (
        <>
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search jobs..."
                    className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Priorities</option>
                  {['urgent', 'high', 'normal', 'low'].map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
                </select>
                {regionOptions.length > 0 && (
                  <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
                    className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Regions</option>
                    {regionOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                )}
                <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Notaries</option>
                  {teamMembers.map((m) => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
                </select>
                {(searchQuery || filterPriority || filterRegion || filterMember) && (
                  <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline px-2">Clear</button>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 sm:mx-0 px-4 sm:px-0" style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}>
            {STATUSES.map((status) => (
              <KanbanColumn key={status} status={status} jobs={jobsByStatus[status] || []} onJobClick={setSelectedJob} />
            ))}
          </div>
        </>
      )}

      {/* ══ TEAM & COVERAGE ═══════════════════════════════════════════════════════ */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {teamMembers.length === 0
            ? (
              <Card><CardContent className="py-16 text-center">
                <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="font-semibold text-slate-500">No team members yet.</p>
                <Button className="mt-4" onClick={() => setMemberModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add First Notary</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map((m) => {
                  const active = jobs.filter((j) => j.assignedMemberId === m.id && j.status !== 'completed').length;
                  return <MemberCard key={m.id} member={m} activeJobCount={active} onEdit={(mem) => { setEditingMember(mem); setMemberModalOpen(true); }} onDelete={deleteTeamMember} />;
                })}
              </div>
            )
          }

          {/* Regional coverage grid */}
          {regionOptions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-blue-500" /> Regional Coverage</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">Region / ZIP</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">Notaries</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">Open Jobs</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">Coverage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {regionOptions.map(({ value: region }) => {
                      const regionMembers = teamMembers.filter((m) => m.regions?.includes(region));
                      const regionJobs    = jobs.filter((j) => j.region === region && j.status !== 'completed');
                      const covered = regionMembers.length > 0;
                      return (
                        <tr key={region} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{region}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              {regionMembers.slice(0, 3).map((m) => <Avatar key={m.id} member={m} size="sm" />)}
                              {regionMembers.length === 0 && <span className="text-xs text-slate-400">None assigned</span>}
                              {regionMembers.length > 3 && <span className="text-xs text-slate-400">+{regionMembers.length - 3}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">{regionJobs.length}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${covered ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${covered ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {covered ? 'Covered' : 'Gap'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Active assignment table */}
          {teamMembers.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-blue-500" /> Active Assignments</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      {['Notary', 'Job', 'Status', 'SLA', 'Scheduled'].map((h) => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {jobs.filter((j) => j.status !== 'completed' && j.assignedMemberId).map((job) => {
                      const member = teamMembers.find((m) => m.id === job.assignedMemberId);
                      const sm = STATUS_META[job.status];
                      return (
                        <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => setSelectedJob(job)}>
                          <td className="px-5 py-3"><div className="flex items-center gap-2"><Avatar member={member} size="sm" /><span className="text-xs font-medium text-slate-700 dark:text-slate-200">{member?.name || '—'}</span></div></td>
                          <td className="px-5 py-3"><p className="text-xs font-medium text-slate-800 dark:text-slate-100">{job.title}</p><p className="text-[11px] text-slate-400">{job.jobNumber}</p></td>
                          <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sm.color}`}><span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />{sm.label}</span></td>
                          <td className="px-5 py-3"><SlaTimer slaDeadline={job.slaDeadline} status={job.status} /></td>
                          <td className="px-5 py-3 text-xs text-slate-500">{fmtDT(job.scheduledAt)}</td>
                        </tr>
                      );
                    })}
                    {jobs.filter((j) => j.status !== 'completed' && j.assignedMemberId).length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">No active assignments.</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ══ DOC QA ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'qa' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCheck className="h-4 w-4 text-violet-500" /> Document QA Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['Job', 'Client', 'Notary', 'Status', 'QA Progress', 'Scheduled'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {jobs.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">No jobs yet.</td></tr>
                )}
                {jobs.map((job) => {
                  const member = teamMembers.find((m) => m.id === job.assignedMemberId);
                  const sm = STATUS_META[job.status] || STATUS_META.unassigned;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => { setSelectedJob(job); }}>
                      <td className="px-5 py-3">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{job.title}</p>
                        <p className="text-[11px] text-slate-400">{job.jobNumber}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">{job.clientName}</td>
                      <td className="px-5 py-3">
                        {member ? (
                          <div className="flex items-center gap-2"><Avatar member={member} size="sm" /><span className="text-xs text-slate-700 dark:text-slate-200">{member.name}</span></div>
                        ) : <span className="text-xs text-slate-400">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sm.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />{sm.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 w-40"><QABar qa={job.qa} /></td>
                      <td className="px-5 py-3 text-xs text-slate-500">{fmtDT(job.scheduledAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ══ PAYOUTS ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard icon={DollarSign}  iconBg="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" label="Total Paid"        value={`$${payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.totalFee || 0), 0).toFixed(0)}`} />
            <KpiCard icon={Clock}       iconBg="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"          label="Awaiting Payment" value={payableJobs.length} sub={payableJobs.length > 0 ? `$${payableJobs.reduce((s, j) => s + Number(j.fee || 0), 0).toFixed(0)} due` : undefined} alert={payableJobs.length > 0} />
            <KpiCard icon={AlertTriangle} iconBg="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"                label="Disputed"         value={payouts.filter((p) => p.status === 'disputed').length} />
          </div>

          {/* Payable jobs table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-emerald-500" /> Completed Jobs — Awaiting Payout</CardTitle>
                {payableJobs.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => exportCSV(payableJobs.map((j) => ({ job: j.jobNumber, title: j.title, client: j.clientName, fee: j.fee, notary: teamMembers.find((m) => m.id === j.assignedMemberId)?.name || '', completed: fmtDate(j.completedAt) })), 'payouts-pending.csv')}>
                    <Download className="mr-1 h-3 w-3" /> Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    {['Job', 'Notary', 'Total Fee', 'Agency Cut (20%)', 'Notary Pay (80%)', 'Completed', 'Action'].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {payableJobs.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">No completed jobs awaiting payout.</td></tr>
                  )}
                  {payableJobs.map((job) => {
                    const member = teamMembers.find((m) => m.id === job.assignedMemberId);
                    const fee    = Number(job.fee || 0);
                    const agency = fee * AGENCY_CUT_PCT;
                    const notary = fee - agency;
                    return (
                      <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{job.title}</p>
                          <p className="text-[11px] text-slate-400">{job.jobNumber}</p>
                        </td>
                        <td className="px-5 py-3">
                          {member ? <div className="flex items-center gap-2"><Avatar member={member} size="sm" /><span className="text-xs text-slate-700 dark:text-slate-200">{member.name}</span></div> : <span className="text-xs text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">${fee.toFixed(2)}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">${agency.toFixed(2)}</td>
                        <td className="px-5 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">${notary.toFixed(2)}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(job.completedAt)}</td>
                        <td className="px-5 py-3">
                          <Button size="sm" onClick={() => markJobPaid(job.id, { memberName: member?.name || '', agencyCut: agency, notaryPay: notary, paidBy: 'Dispatcher' })}>
                            Mark Paid
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Paid payouts history */}
          {payouts.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Payout History</CardTitle>
                  <Button size="sm" variant="secondary" onClick={() => exportCSV(payouts.map((p) => ({ job: p.jobNumber, title: p.jobTitle, notary: p.memberName || '', fee: p.totalFee, status: p.status, paid: fmtDate(p.paidAt) })), 'payout-history.csv')}>
                    <Download className="mr-1 h-3 w-3" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      {['Job', 'Notary', 'Total Fee', 'Notary Pay', 'Status', 'Paid At'].map((h) => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {payouts.map((po) => {
                      const psm = PAYOUT_STATUS_META[po.status] || PAYOUT_STATUS_META.pending;
                      return (
                        <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3"><p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{po.jobTitle}</p><p className="text-[11px] text-slate-400">{po.jobNumber}</p></td>
                          <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">{po.memberName || '—'}</td>
                          <td className="px-5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">${Number(po.totalFee || 0).toFixed(2)}</td>
                          <td className="px-5 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">${Number(po.notaryPay || 0).toFixed(2)}</td>
                          <td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${psm.color}`}>{psm.label}</span></td>
                          <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(po.paidAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ══ PERFORMANCE ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm"><BarChart2 className="h-4 w-4 text-blue-500" /> Notary Performance</CardTitle>
                <div className="flex gap-2">
                  <select value={perfSort} onChange={(e) => setPerfSort(e.target.value)}
                    className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="completed">Sort: Most Completed</option>
                    <option value="revenue">Sort: Most Revenue</option>
                    <option value="sla">Sort: Best SLA %</option>
                  </select>
                  <Button size="sm" variant="secondary" onClick={() => exportCSV(sortedPerf.map((r) => ({ notary: r.name, total_jobs: r.totalJobs, completed: r.completed, sla_pct: r.slaPct ?? 'N/A', avg_completion_min: r.avgCompMin ?? 'N/A', revenue: r.revenue.toFixed(2) })), 'performance.csv')}>
                    <Download className="mr-1 h-3 w-3" /> Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    {['Notary', 'Total Jobs', 'Completed', 'SLA Met %', 'Avg Completion', 'Revenue'].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {sortedPerf.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">No team data yet.</td></tr>
                  )}
                  {sortedPerf.map((row, i) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {i < 3 && <span className="text-[10px] font-bold text-amber-500">#{i + 1}</span>}
                          <Avatar member={row.avatar} size="sm" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">{row.totalJobs}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">{row.completed}</td>
                      <td className="px-5 py-3">
                        {row.slaPct !== null ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${row.slaPct >= 90 ? 'text-emerald-600 dark:text-emerald-400' : row.slaPct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{row.slaPct}%</span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden w-16">
                              <div className={`h-full ${row.slaPct >= 90 ? 'bg-emerald-500' : row.slaPct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${row.slaPct}%` }} />
                            </div>
                          </div>
                        ) : <span className="text-xs text-slate-400">N/A</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">{row.avgCompMin !== null ? `${row.avgCompMin}m` : '—'}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">${row.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══ AUDIT LOG ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} placeholder="Filter by actor, action, job..."
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 text-indigo-500" /> Dispatch Audit Log</CardTitle></CardHeader>
            <CardContent className="p-4">
              {auditLog.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">No audit entries yet. Actions will appear here as your team works.</p>
              )}
              <div className="space-y-3">
                {[...auditLog].reverse().filter((e) => {
                  const q = auditFilter.trim().toLowerCase();
                  return !q || [e.actor, e.action, e.jobNumber, e.detail].join(' ').toLowerCase().includes(q);
                }).map((entry) => {
                  const am = AUDIT_ACTION_META[entry.action] || { label: entry.action, color: 'bg-slate-400' };
                  return (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full ${am.color} shrink-0`}>
                        <Activity className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{entry.actor}</span>
                          <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${am.color} text-white`}>{am.label}</span>
                          {entry.jobNumber && <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{entry.jobNumber}</span>}
                        </div>
                        {entry.detail && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{entry.detail}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">{fmtDT(entry.ts)} · {timeAgo(entry.ts)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══ CLIENT SLA ════════════════════════════════════════════════════════════ */}
      {activeTab === 'client-sla' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4 text-blue-500" /> Client SLA Report</CardTitle>
              {clientSLA.length > 0 && (
                <Button size="sm" variant="secondary" onClick={() => exportCSV(clientSLA.map((r) => ({ client: r.client, total_jobs: r.total, sla_met: r.met, sla_missed: r.missed, compliance_pct: r.total > 0 ? Math.round(((r.met + (r.total - r.met - r.missed)) / r.total) * 100) : 100, revenue: r.revenue.toFixed(2) })), 'client-sla.csv')}>
                  <Download className="mr-1 h-3 w-3" /> Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['Client', 'Total Jobs', 'SLA Met', 'SLA Missed', 'Compliance', 'Revenue'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {clientSLA.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">No completed jobs with client data yet.</td></tr>
                )}
                {clientSLA.map((row) => {
                  const compliancePct = row.total > 0 ? Math.round(((row.met + (row.total - row.met - row.missed)) / row.total) * 100) : 100;
                  const compColor = compliancePct >= 90 ? 'text-emerald-600 dark:text-emerald-400' : compliancePct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
                  return (
                    <tr key={row.client} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">{row.client}</td>
                      <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">{row.total}</td>
                      <td className="px-5 py-3 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{row.met}</td>
                      <td className="px-5 py-3 text-xs text-red-600 dark:text-red-400 font-semibold">{row.missed}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${compColor}`}>{compliancePct}%</span>
                          <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div className={`h-full ${compliancePct >= 90 ? 'bg-emerald-500' : compliancePct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${compliancePct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">${row.revenue.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamDispatch;
