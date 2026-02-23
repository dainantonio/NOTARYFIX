import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, Clock, Edit2,
  MapPin, MessageSquare, MoreHorizontal, Phone, Pin, Plus, Search,
  Send, Trash2, User, Users, X, Zap, Activity, TrendingUp, Inbox,
} from 'lucide-react';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
  Input, Label, Select,
} from '../components/UI';
import { useData } from '../context/DataContext';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUSES = ['unassigned', 'assigned', 'in_progress', 'completed'];

const STATUS_META = {
  unassigned:  { label: 'Unassigned',  color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',        dot: 'bg-slate-400',   badge: 'default'  },
  assigned:    { label: 'Assigned',    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',           dot: 'bg-blue-500',    badge: 'blue'     },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',       dot: 'bg-amber-500',   badge: 'warning'  },
  completed:   { label: 'Completed',   color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', badge: 'success'  },
};

const PRIORITY_META = {
  low:    { label: 'Low',    color: 'text-slate-500 dark:text-slate-400',        dot: 'bg-slate-400',   badge: 'default' },
  normal: { label: 'Normal', color: 'text-blue-600 dark:text-blue-400',          dot: 'bg-blue-500',    badge: 'blue'    },
  high:   { label: 'High',   color: 'text-amber-600 dark:text-amber-400',        dot: 'bg-amber-500',   badge: 'warning' },
  urgent: { label: 'Urgent', color: 'text-red-600 dark:text-red-400 font-bold',  dot: 'bg-red-500',     badge: 'danger'  },
};

const MEMBER_STATUS_META = {
  available: { label: 'Available', color: 'bg-emerald-500' },
  on_job:    { label: 'On Job',    color: 'bg-amber-500'   },
  offline:   { label: 'Offline',   color: 'bg-slate-400'   },
};

const ACT_TYPES = ['Loan Signing', 'I-9 Verification', 'Acknowledgment', 'Jurat', 'Power of Attorney', 'Deed of Trust', 'Copy Certification', 'Remote Online Notary (RON)', 'Other'];

const BLANK_JOB = {
  title: '', clientName: '', clientPhone: '', actType: 'Loan Signing',
  priority: 'normal', region: '', address: '', fee: '',
  scheduledAt: '', slaDeadline: '', notes: '',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDT = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return iso; }
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
  if (status === 'completed') return { level: 'met', label: 'Met', ms: 0 };
  if (!slaDeadline) return { level: 'none', label: 'No SLA', ms: Infinity };
  const ms = new Date(slaDeadline).getTime() - Date.now();
  if (ms < 0)           return { level: 'overdue',  label: `${Math.abs(Math.round(ms / 60000))}m overdue`,  ms };
  if (ms < 3600000)     return { level: 'at_risk',  label: `${Math.round(ms / 60000)}m left`,               ms };
  if (ms < 2 * 3600000) return { level: 'warning',  label: `${Math.round(ms / 3600000 * 10) / 10}h left`,   ms };
  return { level: 'ok', label: `${Math.round(ms / 3600000 * 10) / 10}h left`, ms };
};

const SLA_COLORS = {
  overdue:  'text-red-600 dark:text-red-400',
  at_risk:  'text-red-500 dark:text-red-400',
  warning:  'text-amber-600 dark:text-amber-400',
  ok:       'text-emerald-600 dark:text-emerald-400',
  met:      'text-slate-400',
  none:     'text-slate-400',
};

const avgMinutes = (jobs, fromField, toField) => {
  const pairs = jobs.filter((j) => j[fromField] && j[toField]);
  if (!pairs.length) return null;
  const avg = pairs.reduce((s, j) => s + (new Date(j[toField]) - new Date(j[fromField])), 0) / pairs.length / 60000;
  return Math.round(avg);
};

// ─── SLA LIVE TIMER ───────────────────────────────────────────────────────────
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
      <Clock className="h-3 w-3 shrink-0" />
      {info.label}
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

// ─── JOB FORM MODAL ───────────────────────────────────────────────────────────
const JobModal = ({ isOpen, onClose, onSave, initial, teamMembers }) => {
  const [form, setForm] = useState(BLANK_JOB);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      const fmt = (iso) => iso ? new Date(iso).toISOString().slice(0, 16) : '';
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Inbox className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{initial ? 'Edit Job' : 'New Dispatch Job'}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Job Title <span className="text-red-500">*</span></Label>
            <Input required placeholder="e.g. Loan Closing — Waterfront Condo" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client Name <span className="text-red-500">*</span></Label>
              <Input required placeholder="Client or company" value={form.clientName} onChange={(e) => set('clientName', e.target.value)} />
            </div>
            <div>
              <Label>Client Phone</Label>
              <Input placeholder="(206) 555-0000" value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Act Type <span className="text-red-500">*</span></Label>
              <Select value={form.actType} onChange={(e) => set('actType', e.target.value)} options={ACT_TYPES.map((t) => ({ value: t, label: t }))} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onChange={(e) => set('priority', e.target.value)} options={[{value:'low',label:'Low'},{value:'normal',label:'Normal'},{value:'high',label:'High'},{value:'urgent',label:'Urgent'}]} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Region / ZIP</Label>
              <Input placeholder="e.g. 98101" maxLength={10} value={form.region} onChange={(e) => set('region', e.target.value)} />
            </div>
            <div>
              <Label>Fee ($)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.fee} onChange={(e) => set('fee', e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Service Address</Label>
            <Input placeholder="Full street address" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Scheduled At</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
            </div>
            <div>
              <Label>SLA Deadline</Label>
              <Input type="datetime-local" value={form.slaDeadline} onChange={(e) => set('slaDeadline', e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Internal Notes</Label>
            <textarea rows={3} placeholder="Parking instructions, client preferences, special requirements…"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.notes} onChange={(e) => set('notes', e.target.value)} />
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

// ─── JOB DETAIL DRAWER ────────────────────────────────────────────────────────
const JobDrawer = ({ job, onClose, teamMembers, dispatchNotes, onAssign, onAdvanceStatus, onAddNote, onDeleteNote, onEdit, onDelete }) => {
  const [noteText, setNoteText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const notesEndRef = useRef(null);

  const jobNotes = useMemo(() =>
    (dispatchNotes || []).filter((n) => n.jobId === job?.id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [dispatchNotes, job?.id]
  );

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [jobNotes.length]);

  if (!job) return null;

  const assignedMember = teamMembers.find((m) => m.id === job.assignedMemberId);
  const sla = slaStatus(job.slaDeadline, job.status);
  const sm = STATUS_META[job.status] || STATUS_META.unassigned;
  const pm = PRIORITY_META[job.priority] || PRIORITY_META.normal;

  const nextStatus = {
    unassigned: null,
    assigned: 'in_progress',
    in_progress: 'completed',
    completed: null,
  }[job.status];

  const nextStatusLabel = { in_progress: 'Start Job', completed: 'Complete Job' }[nextStatus];

  const handleSendNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    onAddNote({ jobId: job.id, authorName: 'Dain Antonio', authorId: null, content: trimmed, isPinned: false });
    setNoteText('');
  };

  const availableMembers = teamMembers.filter((m) =>
    m.status !== 'offline' &&
    (!job.region || !m.regions?.length || m.regions.includes(job.region))
  );

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 dark:border-slate-700">
        {/* Drawer Header */}
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
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Job Details */}
          <div className="px-6 py-4 space-y-4 border-b border-slate-100 dark:border-slate-800">
            {/* SLA */}
            <div className={`flex items-center gap-2 rounded-xl p-3 ${sla.level === 'overdue' || sla.level === 'at_risk' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : sla.level === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
              <Clock className={`h-4 w-4 shrink-0 ${SLA_COLORS[sla.level]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">SLA Deadline</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{fmtDT(job.slaDeadline)}</p>
              </div>
              <SlaTimer slaDeadline={job.slaDeadline} status={job.status} />
            </div>

            {/* Info grid */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div><dt className="text-slate-400 mb-0.5">Act Type</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{job.actType}</dd></div>
              <div><dt className="text-slate-400 mb-0.5">Fee</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">${Number(job.fee || 0).toFixed(2)}</dd></div>
              <div><dt className="text-slate-400 mb-0.5">Client</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{job.clientName}</dd></div>
              <div><dt className="text-slate-400 mb-0.5">Phone</dt>
                <dd>{job.clientPhone ? (
                  <a href={`tel:${job.clientPhone}`} className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Phone className="h-3 w-3" />{job.clientPhone}
                  </a>
                ) : <span className="text-slate-400">—</span>}</dd>
              </div>
              <div><dt className="text-slate-400 mb-0.5">Region/ZIP</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{job.region || '—'}</dd></div>
              <div><dt className="text-slate-400 mb-0.5">Scheduled</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{fmtDT(job.scheduledAt)}</dd></div>
              {job.address && (
                <div className="col-span-2">
                  <dt className="text-slate-400 mb-0.5">Address</dt>
                  <dd className="font-medium text-slate-700 dark:text-slate-200 flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-0.5 text-slate-400 shrink-0" />{job.address}
                  </dd>
                </div>
              )}
              {job.notes && (
                <div className="col-span-2">
                  <dt className="text-slate-400 mb-0.5">Job Notes</dt>
                  <dd className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-600 dark:text-slate-300 italic">{job.notes}</dd>
                </div>
              )}
            </dl>

            {/* Timeline */}
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {[['Created', job.createdAt], ['Assigned', job.assignedAt], ['Started', job.startedAt], ['Completed', job.completedAt]].map(([lbl, ts]) => ts && (
                <div key={lbl} className="flex items-center gap-2">
                  <span className="w-16 text-slate-400">{lbl}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span>{fmtDT(ts)}</span>
                  <span className="text-slate-400 ml-auto">{timeAgo(ts)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment */}
          {job.status !== 'completed' && (
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Assign Notary</p>
              {assignedMember ? (
                <div className="flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3">
                  <Avatar member={assignedMember} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{assignedMember.name}</p>
                    <p className="text-xs text-slate-400">{assignedMember.regions?.join(', ')}</p>
                  </div>
                  <button onClick={() => onAssign(job.id, null)} className="text-xs text-red-500 hover:text-red-600 transition-colors">Unassign</button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mb-2">No notary assigned yet.</p>
              )}

              {availableMembers.length > 0 && (
                <div className="mt-3 space-y-2">
                  {availableMembers.map((m) => {
                    const mSm = MEMBER_STATUS_META[m.status] || MEMBER_STATUS_META.offline;
                    const isAssigned = m.id === job.assignedMemberId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => !isAssigned && onAssign(job.id, m.id)}
                        disabled={isAssigned}
                        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${isAssigned ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 cursor-default' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'}`}
                      >
                        <Avatar member={m} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{m.name}</p>
                            <span className={`flex items-center gap-1 text-[10px] font-medium text-slate-500`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${mSm.color}`} />{mSm.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">ZIP: {m.regions?.slice(0, 3).join(', ')} · {m.activeJobCount} active · {m.completedJobCount} done</p>
                        </div>
                        {isAssigned && <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Internal Notes */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Internal Notes {jobNotes.length > 0 && <span className="ml-1 text-slate-500">({jobNotes.length})</span>}
            </p>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {jobNotes.length === 0 && (
                <p className="text-xs text-slate-400 italic">No notes yet. Add context for your team.</p>
              )}
              {jobNotes.map((note) => (
                <div key={note.id} className={`group relative rounded-xl border px-4 py-3 ${note.isPinned ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {note.isPinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{note.authorName}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{timeAgo(note.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{note.content}</p>
                  <div className="absolute top-2 right-2 hidden gap-1 group-hover:flex">
                    <button onClick={() => onDeleteNote(note.id)} className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
              <div ref={notesEndRef} />
            </div>

            {/* Note input */}
            <div className="flex gap-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendNote())}
                placeholder="Add a note…"
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button size="icon" onClick={handleSendNote} disabled={!noteText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 flex items-center gap-2">
          {nextStatus && job.assignedMemberId && (
            <Button className="flex-1" onClick={() => { onAdvanceStatus(job.id, nextStatus); }}>
              {nextStatus === 'in_progress' ? <Activity className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {nextStatusLabel}
            </Button>
          )}
          {nextStatus && !job.assignedMemberId && (
            <p className="flex-1 text-xs text-slate-400 italic">Assign a notary to advance status.</p>
          )}
          <Button variant="ghost" size="icon" onClick={() => onEdit(job)} title="Edit job"><Edit2 className="h-4 w-4" /></Button>
          {!showDeleteConfirm ? (
            <Button variant="danger" size="icon" onClick={() => setShowDeleteConfirm(true)} title="Delete job"><Trash2 className="h-4 w-4" /></Button>
          ) : (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-red-600 dark:text-red-400">Delete?</span>
              <Button variant="danger" size="sm" onClick={() => { onDelete(job.id); onClose(); }}>Yes</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>No</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── KANBAN COLUMN ────────────────────────────────────────────────────────────
const KanbanColumn = ({ status, jobs, onJobClick }) => {
  const meta = STATUS_META[status];
  return (
    <div className="flex flex-col min-w-[260px] flex-1">
      {/* Column header */}
      <div className={`rounded-t-xl border-b-2 ${status === 'unassigned' ? 'border-slate-300' : status === 'assigned' ? 'border-blue-400' : status === 'in_progress' ? 'border-amber-400' : 'border-emerald-400'} px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-0 rounded-b-none`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{meta.label}</span>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5">{jobs.length}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-xl bg-slate-50 dark:bg-slate-800/30 p-2 space-y-2 min-h-[240px]">
        {jobs.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-slate-400 italic">No jobs</div>
        )}
        {jobs.map((job) => {
          const pm = PRIORITY_META[job.priority] || PRIORITY_META.normal;
          const sla = slaStatus(job.slaDeadline, job.status);
          const isSlaRisk = ['overdue', 'at_risk', 'warning'].includes(sla.level);

          return (
            <button
              key={job.id}
              onClick={() => onJobClick(job)}
              className={`w-full text-left rounded-xl border bg-white dark:bg-slate-800 p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${isSlaRisk ? 'border-red-200 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs leading-snug flex-1">{job.title}</p>
                <Badge variant={pm.badge} className="text-[9px] shrink-0">{pm.label}</Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">{job.clientName}</span>
                </div>
                {job.region && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{job.region}</span>
                  </div>
                )}
                {job.scheduledAt && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{fmtDT(job.scheduledAt)}</span>
                  </div>
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <SlaTimer slaDeadline={job.slaDeadline} status={job.status} />
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">${Number(job.fee || 0).toFixed(0)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── TEAM MEMBER CARD ─────────────────────────────────────────────────────────
const MemberCard = ({ member, jobCount, onEdit, onDelete }) => {
  const sm = MEMBER_STATUS_META[member.status] || MEMBER_STATUS_META.offline;
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
          <span className={`flex items-center gap-1 font-medium ${sm.color === 'bg-emerald-500' ? 'text-emerald-600 dark:text-emerald-400' : sm.color === 'bg-amber-500' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sm.color}`} />{sm.label}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{member.activeJobCount || 0} active</span>
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

// ─── MEMBER MODAL ─────────────────────────────────────────────────────────────
const MemberModal = ({ isOpen, onClose, onSave, initial }) => {
  const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500'];
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'notary', status: 'available', regions: '', avatarColor: 'bg-blue-500' });

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setForm({ ...initial, regions: (initial.regions || []).join(', ') });
    } else {
      setForm({ name: '', email: '', phone: '', role: 'notary', status: 'available', regions: '', avatarColor: 'bg-blue-500' });
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const initials = form.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    onSave({
      ...form,
      avatarInitials: initials,
      regions: form.regions.split(',').map((s) => s.trim()).filter(Boolean),
      activeJobCount: initial?.activeJobCount || 0,
      completedJobCount: initial?.completedJobCount || 0,
      joinedAt: initial?.joinedAt || todayISO,
    });
    onClose();
  };

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">{initial ? 'Edit Team Member' : 'Add Team Member'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input required placeholder="Maria Reyes" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="notary@agency.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input placeholder="(206) 555-0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Role</Label>
              <Select value={form.role} onChange={(e) => set('role', e.target.value)} options={[{value:'notary',label:'Notary'},{value:'dispatcher',label:'Dispatcher'},{value:'admin',label:'Admin'}]} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => set('status', e.target.value)} options={[{value:'available',label:'Available'},{value:'on_job',label:'On Job'},{value:'offline',label:'Offline'}]} />
            </div>
          </div>
          <div>
            <Label>Coverage Regions (ZIP codes, comma-separated)</Label>
            <Input placeholder="98101, 98102, 98103" value={form.regions} onChange={(e) => set('regions', e.target.value)} />
          </div>
          <div>
            <Label>Avatar Color</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => set('avatarColor', c)}
                  className={`w-7 h-7 rounded-full ${c} flex items-center justify-center transition-transform ${form.avatarColor === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
                />
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const TeamDispatch = () => {
  const {
    data,
    addDispatchJob, updateDispatchJob, deleteDispatchJob,
    assignDispatchJob, advanceDispatchJobStatus,
    addDispatchNote, updateDispatchNote, deleteDispatchNote,
    addTeamMember, updateTeamMember, deleteTeamMember,
  } = useData();

  const jobs = data.dispatchJobs || [];
  const teamMembers = data.teamMembers || [];
  const dispatchNotes = data.dispatchNotes || [];

  const [activeTab, setActiveTab] = useState('board'); // board | team
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterMember, setFilterMember] = useState('');

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const open = jobs.filter((j) => j.status !== 'completed');
    const unassigned = jobs.filter((j) => j.status === 'unassigned');
    const slaRisk = jobs.filter((j) => {
      if (j.status === 'completed') return false;
      const s = slaStatus(j.slaDeadline, j.status);
      return ['overdue', 'at_risk', 'warning'].includes(s.level);
    });
    const avgAssignMins = avgMinutes(jobs.filter((j) => j.assignedAt), 'createdAt', 'assignedAt');
    const todayCompleted = jobs.filter((j) => j.status === 'completed' && j.completedAt?.startsWith(new Date().toISOString().slice(0, 10)));
    return { open: open.length, unassigned: unassigned.length, slaRisk: slaRisk.length, avgAssignMins, todayCompleted: todayCompleted.length };
  }, [jobs]);

  // ── Filtered jobs for board ─────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchQ = !q || [j.title, j.clientName, j.jobNumber, j.region, j.actType].join(' ').toLowerCase().includes(q);
      const matchPrio = !filterPriority || j.priority === filterPriority;
      const matchRegion = !filterRegion || j.region === filterRegion;
      const matchMember = !filterMember || String(j.assignedMemberId) === filterMember;
      return matchQ && matchPrio && matchRegion && matchMember;
    });
  }, [jobs, searchQuery, filterPriority, filterRegion, filterMember]);

  const jobsByStatus = useMemo(() =>
    STATUSES.reduce((acc, s) => ({ ...acc, [s]: filteredJobs.filter((j) => j.status === s) }), {}),
    [filteredJobs]
  );

  // Region options
  const regionOptions = useMemo(() => {
    const regions = [...new Set(jobs.map((j) => j.region).filter(Boolean))].sort();
    return regions.map((r) => ({ value: r, label: r }));
  }, [jobs]);

  const handleJobSave = (form) => {
    if (editingJob) {
      updateDispatchJob(editingJob.id, form);
    } else {
      addDispatchJob(form);
    }
    setEditingJob(null);
  };

  const handleMemberSave = (form) => {
    if (editingMember) {
      updateTeamMember(editingMember.id, form);
    } else {
      addTeamMember(form);
    }
    setEditingMember(null);
  };

  const openEditJob = (job) => {
    setEditingJob(job);
    setJobModalOpen(true);
    setSelectedJob(null);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Modals & Drawer */}
      <JobModal
        isOpen={jobModalOpen}
        onClose={() => { setJobModalOpen(false); setEditingJob(null); }}
        onSave={handleJobSave}
        initial={editingJob}
        teamMembers={teamMembers}
      />
      <MemberModal
        isOpen={memberModalOpen}
        onClose={() => { setMemberModalOpen(false); setEditingMember(null); }}
        onSave={handleMemberSave}
        initial={editingMember}
      />
      {selectedJob && (
        <JobDrawer
          job={jobs.find((j) => j.id === selectedJob.id) || selectedJob}
          onClose={() => setSelectedJob(null)}
          teamMembers={teamMembers}
          dispatchNotes={dispatchNotes}
          onAssign={assignDispatchJob}
          onAdvanceStatus={advanceDispatchJobStatus}
          onAddNote={addDispatchNote}
          onDeleteNote={deleteDispatchNote}
          onEdit={openEditJob}
          onDelete={(id) => { deleteDispatchJob(id); setSelectedJob(null); }}
        />
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-200">Agency Operations</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Team Dispatch</h1>
            <p className="mt-1 text-sm text-slate-200">Multi-notary operations board with SLA tracking, region routing, and team assignment.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => { setEditingMember(null); setMemberModalOpen(true); }}
            >
              <Users className="mr-2 h-4 w-4" /> Add Notary
            </Button>
            <Button
              className="border-0 bg-indigo-500 text-white hover:bg-indigo-600"
              onClick={() => { setEditingJob(null); setJobModalOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" /> New Job
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI ROW ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Open Jobs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpis.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
                <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Unassigned</p>
                <p className={`text-2xl font-bold ${kpis.unassigned > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  {kpis.unassigned}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">SLA at Risk</p>
                <p className={`text-2xl font-bold ${kpis.slaRisk > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {kpis.slaRisk}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Avg Assign Time</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {kpis.avgAssignMins !== null ? `${kpis.avgAssignMins}m` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {[['board', 'Dispatch Board'], ['team', 'Team Roster']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── DISPATCH BOARD ────────────────────────────────────────────────────── */}
      {activeTab === 'board' && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search jobs…"
                    className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Priorities</option>
                  {['urgent','high','normal','low'].map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
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
                  <button onClick={() => { setSearchQuery(''); setFilterPriority(''); setFilterRegion(''); setFilterMember(''); }} className="text-xs text-blue-600 hover:underline px-2">
                    Clear
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kanban board */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                jobs={jobsByStatus[status] || []}
                onJobClick={setSelectedJob}
              />
            ))}
          </div>
        </>
      )}

      {/* ── TEAM ROSTER ──────────────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          {teamMembers.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="font-semibold text-slate-500 dark:text-slate-400">No team members yet.</p>
                <Button className="mt-4" onClick={() => setMemberModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add First Notary
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => {
                const memberJobs = jobs.filter((j) => j.assignedMemberId === member.id && j.status !== 'completed');
                return (
                  <MemberCard
                    key={member.id}
                    member={member}
                    jobCount={memberJobs.length}
                    onEdit={(m) => { setEditingMember(m); setMemberModalOpen(true); }}
                    onDelete={deleteTeamMember}
                  />
                );
              })}
            </div>
          )}

          {/* Active jobs per member */}
          {teamMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-blue-500" /> Active Job Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">Notary</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">Job</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">SLA</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left">Scheduled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {jobs.filter((j) => j.status !== 'completed' && j.assignedMemberId).map((job) => {
                      const member = teamMembers.find((m) => m.id === job.assignedMemberId);
                      const sm = STATUS_META[job.status];
                      return (
                        <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => setSelectedJob(job)}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar member={member} size="sm" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{member?.name || '—'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-100">{job.title}</p>
                            <p className="text-[11px] text-slate-400">{job.jobNumber}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sm.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />{sm.label}
                            </span>
                          </td>
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
    </div>
  );
};

export default TeamDispatch;
