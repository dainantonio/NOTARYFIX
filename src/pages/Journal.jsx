import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, X, Search, Download, Pencil, Trash2, ChevronDown, ChevronUp,
  FileText, Link2, AlertTriangle, CheckCircle2, Clock, BookOpen,
  ShieldCheck, Fingerprint, CalendarDays, DollarSign, Hash,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Input, Label, Select, Progress,
} from '../components/UI';
import { useData } from '../context/DataContext';
import { useLocation } from 'react-router-dom';
import { useLinker } from '../hooks/useLinker';
import { isJournalAtLimit } from '../utils/gates';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ACT_TYPES = [
  'Acknowledgment', 'Jurat', 'Oath / Affirmation', 'Copy Certification',
  'Signature Witnessing', 'I-9 Verification', 'Apostille', 'Protest',
  'Deed of Trust', 'Power of Attorney', 'Remote Online Notary (RON)', 'Other',
];

const ID_TYPES = [
  "Driver's License", 'Passport', 'Passport Card', 'State ID Card',
  'Military ID', 'Tribal ID', 'Permanent Resident Card', 'Foreign Passport', 'Other',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const BLANK_FORM = {
  date: new Date().toISOString().split('T')[0],
  time: (() => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })(),
  actType: 'Acknowledgment',
  signerName: '',
  signerAddress: '',
  idType: "Driver's License",
  idIssuingState: '',
  idLast4: '',
  idExpiration: '',
  fee: '',
  thumbprintTaken: false,
  witnessRequired: false,
  notes: '',
  documentDescription: '',
  linkedAppointmentId: null,
  linkedInvoiceId: null,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
};

const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hh = parseInt(h, 10);
  return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
};

const scoreColor = (s) => {
  if (s >= 90) return { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', ring: '#10b981' };
  if (s >= 65) return { text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', ring: '#f59e0b' };
  return { text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500', ring: '#ef4444' };
};

const exportCSV = (entries) => {
  const cols = [
    'Entry #', 'Date', 'Time', 'Act Type', 'Signer Name', 'Signer Address',
    'ID Type', 'ID State', 'ID Last 4', 'ID Expiration', 'Fee ($)',
    'Thumbprint Taken', 'Witness Required', 'Document Description', 'Notes',
    'Linked Appt ID', 'Linked Invoice ID', 'Completeness %',
  ];
  const rows = entries.map((e) => [
    e.entryNumber, e.date, e.time, e.actType, e.signerName, e.signerAddress,
    e.idType, e.idIssuingState, e.idLast4, e.idExpiration, e.fee,
    e.thumbprintTaken ? 'Yes' : 'No', e.witnessRequired ? 'Yes' : 'No',
    e.documentDescription, e.notes,
    e.linkedAppointmentId || '', e.linkedInvoiceId || '',
    e.completenessScore ?? '—',
  ]);
  const csv = [cols, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `notary-journal-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
};

// ─── SVG COMPLETENESS RING ────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 44 }) => {
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const { ring } = scoreColor(score);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} strokeWidth={sw} stroke="currentColor" fill="none" className="text-slate-200 dark:text-slate-700" />
        <circle cx={size/2} cy={size/2} r={r} strokeWidth={sw} stroke={ring} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color: ring }}>{score}</span>
    </div>
  );
};

// ─── TOGGLE SWITCH ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, sublabel }) => (
  <label className="flex cursor-pointer items-center gap-3 select-none">
    <div
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>}
    </div>
  </label>
);

// ─── ENTRY MODAL ──────────────────────────────────────────────────────────────
const EntryModal = ({ isOpen, onClose, onSave, initial, appointments, invoices, journalSettings }) => {
  const [form, setForm] = useState(BLANK_FORM);
  const [section, setSection] = useState(0); // 0=act 1=signer 2=id 3=fee 4=links

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setForm({
        ...BLANK_FORM,
        ...initial,
        fee: initial.fee !== undefined ? String(initial.fee) : '',
        thumbprintTaken: !!initial.thumbprintTaken,
        witnessRequired: !!initial.witnessRequired,
      });
    } else {
      setForm({ ...BLANK_FORM });
    }
    setSection(0);
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const thumbRequired = (journalSettings?.requireThumbprintForActTypes || []).includes(form.actType);
  const thumbWarning = thumbRequired && !form.thumbprintTaken;

  const apptOptions = [
    { value: '', label: '— None —' },
    ...(appointments || []).map((a) => ({ value: String(a.id), label: `${a.date} · ${a.client} · ${a.type}` })),
  ];
  const invOptions = [
    { value: '', label: '— None —' },
    ...(invoices || []).map((i) => ({ value: String(i.id), label: `${i.id} · ${i.client} · $${i.amount}` })),
  ];

  const sections = [
    { title: 'Notarial Act', icon: <FileText className="h-3.5 w-3.5" /> },
    { title: 'Signer', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { title: 'ID Verification', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { title: 'Fee & Flags', icon: <DollarSign className="h-3.5 w-3.5" /> },
    { title: 'Link Records', icon: <Link2 className="h-3.5 w-3.5" /> },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, fee: parseFloat(form.fee) || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-700 flex flex-col">

        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                {initial ? 'Edit Journal Entry' : 'New Journal Entry'}
              </h3>
              {initial?.entryNumber && (
                <p className="text-xs font-mono text-slate-400">{initial.entryNumber}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4">
          {sections.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSection(i)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                section === i
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {s.icon}{s.title}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-4">

            {/* Section 0: Notarial Act */}
            {section === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <Label>Date <span className="text-red-500">*</span></Label>
                    <Input required type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
                  </div>
                  <div>
                    <Label>Time <span className="text-red-500">*</span></Label>
                    <Input required type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Act Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={form.actType}
                      onChange={(e) => set('actType', e.target.value)}
                      options={ACT_TYPES.map((t) => ({ value: t, label: t }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Document Description</Label>
                  <Input
                    placeholder="e.g. Deed of Trust, Affidavit of Residency"
                    value={form.documentDescription}
                    onChange={(e) => set('documentDescription', e.target.value)}
                  />
                </div>
                {thumbWarning && (
                  <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Your settings require a thumbprint for <strong>{form.actType}</strong>. Set thumbprint flag on the Fee &amp; Flags tab.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Section 1: Signer */}
            {section === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Signer Full Name <span className="text-red-500">*</span></Label>
                  <Input required placeholder="Legal name as it appears on ID" value={form.signerName} onChange={(e) => set('signerName', e.target.value)} />
                </div>
                <div>
                  <Label>Signer Address</Label>
                  <Input placeholder="Street, City, State ZIP" value={form.signerAddress} onChange={(e) => set('signerAddress', e.target.value)} />
                </div>
              </div>
            )}

            {/* Section 2: ID Verification */}
            {section === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={form.idType}
                      onChange={(e) => set('idType', e.target.value)}
                      options={ID_TYPES.map((t) => ({ value: t, label: t }))}
                    />
                  </div>
                  <div>
                    <Label>Issuing State</Label>
                    <Select
                      value={form.idIssuingState}
                      onChange={(e) => set('idIssuingState', e.target.value)}
                      options={[{ value: '', label: '— N/A —' }, ...US_STATES.map((s) => ({ value: s, label: s }))]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID Last 4 Digits <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. 4821"
                      maxLength={4}
                      value={form.idLast4}
                      onChange={(e) => set('idLast4', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                    <p className="mt-1 text-xs text-slate-400">Never store full ID numbers.</p>
                  </div>
                  <div>
                    <Label>ID Expiration Date</Label>
                    <Input type="date" value={form.idExpiration} onChange={(e) => set('idExpiration', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Fee & Flags */}
            {section === 3 && (
              <div className="space-y-5">
                <div>
                  <Label>Notary Fee ($) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.fee} onChange={(e) => set('fee', e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <Toggle
                    checked={form.thumbprintTaken}
                    onChange={(v) => set('thumbprintTaken', v)}
                    label="Thumbprint / Biometric Taken"
                    sublabel={thumbRequired ? `Required for ${form.actType}` : 'Optional for this act type'}
                  />
                  <Toggle
                    checked={form.witnessRequired}
                    onChange={(v) => set('witnessRequired', v)}
                    label="Witness Was Required"
                    sublabel="Mark if the signing required a witness"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <textarea
                    rows={4}
                    placeholder="Observations, circumstances, or any remarks for the record…"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Section 4: Link Records */}
            {section === 4 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optionally link this entry to an existing appointment or invoice for cross-reference and audit trail completeness.
                </p>
                <div>
                  <Label>Link to Appointment</Label>
                  <Select
                    value={form.linkedAppointmentId ? String(form.linkedAppointmentId) : ''}
                    onChange={(e) => set('linkedAppointmentId', e.target.value ? Number(e.target.value) : null)}
                    options={apptOptions}
                  />
                </div>
                <div>
                  <Label>Link to Invoice</Label>
                  <Select
                    value={form.linkedInvoiceId ? String(form.linkedInvoiceId) : ''}
                    onChange={(e) => set('linkedInvoiceId', e.target.value || null)}
                    options={invOptions}
                  />
                </div>
                {(form.linkedAppointmentId || form.linkedInvoiceId) && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-3 py-2">
                    <Link2 className="h-4 w-4 text-blue-500 shrink-0" />
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Linked entries earn +10 pts on your report-ready score.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSection((s) => Math.max(0, s - 1))} disabled={section === 0}>
                ← Prev
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSection((s) => Math.min(sections.length - 1, s + 1))} disabled={section === sections.length - 1}>
                Next →
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit">{initial ? 'Save Changes' : 'Add Entry'}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── DELETE CONFIRM ───────────────────────────────────────────────────────────
const DeleteConfirm = ({ entry, onConfirm, onCancel }) => {
  if (!entry) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Delete Journal Entry?</h3>
            <p className="text-xs text-slate-500">{entry.entryNumber} — {entry.signerName}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Notary records may be subject to state retention laws. Confirm you have authority to delete this entry.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => onConfirm(entry.id)}>Delete Entry</Button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const Journal = () => {
  const {
    data,
    addJournalEntry, updateJournalEntry, deleteJournalEntry,
    createJournalDraftFromAppointment, scoreEntry,
  } = useData();
  const location = useLocation();
  const { afterJournalSave } = useLinker();
  const planTier = data.settings?.planTier || 'free';
  const atJournalLimit = isJournalAtLimit(data.journalEntries || [], planTier);

  const entries = data.journalEntries || [];
  const journalSettings = data.journalSettings || {};
  const appointments = data.appointments || [];
  const invoices = data.invoices || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [query, setQuery] = useState('');
  const [filterActType, setFilterActType] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  // Re-score entries live (in case scoring logic changed)
  const scoredEntries = useMemo(() =>
    entries.map((e) => ({ ...e, completenessScore: scoreEntry(e) })),
    [entries]
  );

  // KPIs
  const currentMonth = new Date().toISOString().slice(0, 7);
  const kpis = useMemo(() => {
    const thisMonth = scoredEntries.filter((e) => e.date?.startsWith(currentMonth));
    const missingFields = scoredEntries.filter((e) => e.completenessScore < 80);
    const avgScore = scoredEntries.length
      ? Math.round(scoredEntries.reduce((s, e) => s + e.completenessScore, 0) / scoredEntries.length)
      : 0;
    const linked = scoredEntries.filter((e) => e.linkedAppointmentId || e.linkedInvoiceId).length;
    // Report-ready: avg score weighted, bonus for link coverage
    const linkBonus = scoredEntries.length ? Math.round((linked / scoredEntries.length) * 10) : 0;
    const reportScore = scoredEntries.length ? Math.min(100, Math.round(avgScore * 0.9 + linkBonus)) : 0;
    return { thisMonth: thisMonth.length, missingFields: missingFields.length, avgScore, reportScore, linked, total: scoredEntries.length };
  }, [scoredEntries, currentMonth]);

  // Month options
  const monthOptions = useMemo(() => {
    const months = [...new Set(entries.map((e) => e.date?.slice(0, 7)).filter(Boolean))].sort().reverse();
    return months.map((m) => ({ value: m, label: new Date(m + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }));
  }, [entries]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = scoredEntries.filter((e) => {
      const matchQ = !q || [e.signerName, e.actType, e.entryNumber, e.documentDescription, e.notes, e.signerAddress].join(' ').toLowerCase().includes(q);
      const matchAct = !filterActType || e.actType === filterActType;
      const matchMonth = !filterMonth || e.date?.startsWith(filterMonth);
      return matchQ && matchAct && matchMonth;
    });
    result.sort((a, b) => {
      const cmp = (a.date + a.time).localeCompare(b.date + b.time);
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [scoredEntries, query, filterActType, filterMonth, sortAsc]);

  const openNew = (prefill = null) => {
    if (atJournalLimit && !prefill) {
      // Show inline notice — handled in the UI
    }
    setEditing(prefill);
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditing(entry);
    setModalOpen(true);
  };

  const handleSave = (form) => {
    if (editing?.id) {
      updateJournalEntry(editing.id, form);
    } else {
      addJournalEntry(form);
      // Suggest invoice after saving a new entry with a fee
      afterJournalSave(form);
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    deleteJournalEntry(id);
    setPendingDelete(null);
    if (expandedId === id) setExpandedId(null);
  };

  const handleQuickLink = (apt) => {
    const draft = createJournalDraftFromAppointment(apt);
    openNew(draft);
  };

  const linkedApptIds = useMemo(() => new Set(entries.map((e) => e.linkedAppointmentId).filter(Boolean)), [entries]);

  // Handle deep-link from Schedule "Mark Complete" flow
  React.useEffect(() => {
    const aptId = location.state?.prefillFromAppointment;
    if (!aptId) return;
    const apt = appointments.find((a) => a.id === aptId || a.id === Number(aptId));
    if (apt) {
      const alreadyLogged = entries.some((e) => e.linkedAppointmentId === apt.id);
      if (!alreadyLogged) {
        const draft = createJournalDraftFromAppointment(apt);
        openNew(draft);
      }
    }
    window.history.replaceState({}, '');
  }, [location.state]);

  return (
    <div className="space-y-6 pb-10">
      {/* Modals */}
      <EntryModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        appointments={appointments}
        invoices={invoices}
        journalSettings={journalSettings}
      />
      <DeleteConfirm
        entry={pendingDelete}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* ── HERO HEADER ──────────────────────────────────────────────────────── */}
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Records & Audit</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Notary Journal</h1>
            <p className="mt-1 text-sm text-slate-200">
              Legally compliant journal with audit-trail entries, ID tracking, and export.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => exportCSV(filtered.length ? filtered : scoredEntries)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              className="border-0 bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => openNew()}
            >
              <Plus className="mr-2 h-4 w-4" /> New Entry
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
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">This Month</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpis.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Missing Fields</p>
                <p className={`text-2xl font-bold ${kpis.missingFields > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {kpis.missingFields}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Report-Ready</p>
                <p className={`text-2xl font-bold ${scoreColor(kpis.reportScore).text}`}>{kpis.reportScore}%</p>
              </div>
            </div>
            <Progress value={kpis.reportScore} className="mt-3 h-1.5" indicatorClassName={scoreColor(kpis.reportScore).bar} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30">
                <Link2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Linked Records</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {kpis.linked}
                  <span className="ml-0.5 text-sm font-normal text-slate-400">/{kpis.total}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── RETENTION REMINDER ───────────────────────────────────────────────── */}
      {journalSettings.retentionReminderEnabled && (
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="flex items-start gap-3 p-4">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Retention Policy Reminder</p>
              <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-300">
                Your journal settings require a <strong>{journalSettings.retentionYears}-year</strong> retention period.
                Always confirm your state's notary statutes. Do not destroy records without proper authorization.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SEARCH & FILTERS ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search signer, act type, entry #, notes…"
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-3 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterActType}
                onChange={(e) => setFilterActType(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Act Types</option>
                {ACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <button
                onClick={() => setSortAsc((v) => !v)}
                className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {sortAsc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Date
              </button>
            </div>
          </div>
          {(query || filterActType || filterMonth) && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              <button onClick={() => { setQuery(''); setFilterActType(''); setFilterMonth(''); }} className="text-xs text-blue-600 hover:underline">
                Clear filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── JOURNAL TABLE ────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700 mb-4">
                <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-500" />
              </div>
              <p className="font-semibold text-slate-600 dark:text-slate-300">No journal entries found.</p>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Add your first entry to build an audit-ready record.</p>
              <Button className="mt-5" onClick={() => openNew()}>
                <Plus className="mr-2 h-4 w-4" /> Add First Entry
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[820px]">
              <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-10"></th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Entry #</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date / Time</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Act Type</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Signer</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Fee</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Score</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const sc = entry.completenessScore;
                  const { text: scoreText } = scoreColor(sc);
                  const thumbprintReqButMissing =
                    (journalSettings?.requireThumbprintForActTypes || []).includes(entry.actType) && !entry.thumbprintTaken;
                  const hasLinks = entry.linkedAppointmentId || entry.linkedInvoiceId;

                  return (
                    <React.Fragment key={entry.id}>
                      <tr className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isExpanded ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                        {/* Expand toggle */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{entry.entryNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100 text-xs">{fmtDate(entry.date)}</p>
                          <p className="text-slate-400 text-[11px]">{fmtTime(entry.time)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="blue" className="text-[10px] whitespace-nowrap">{entry.actType}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100 text-xs leading-tight">{entry.signerName || '—'}</p>
                          {entry.signerAddress && (
                            <p className="text-slate-400 text-[11px] truncate max-w-[140px]">{entry.signerAddress}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-600 dark:text-slate-300">{entry.idType || '—'}</p>
                          {entry.idLast4 ? (
                            <p className="text-[11px] text-slate-400">····{entry.idLast4}{entry.idIssuingState ? ` · ${entry.idIssuingState}` : ''}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900 dark:text-white text-xs">${Number(entry.fee || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <ScoreRing score={sc} size={38} />
                            {thumbprintReqButMissing && (
                              <span title="Thumbprint required but not recorded">
                                <Fingerprint className="h-3.5 w-3.5 text-amber-500" />
                              </span>
                            )}
                            {hasLinks && (
                              <span title="Linked to appointment/invoice">
                                <Link2 className="h-3.5 w-3.5 text-blue-400" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(entry)} title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setPendingDelete(entry)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* ── EXPANDED DETAIL ROW ─────────────────────────────── */}
                      {isExpanded && (
                        <tr className="bg-blue-50/30 dark:bg-blue-900/10">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                              {/* ID Block */}
                              <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">ID Details</p>
                                <dl className="space-y-1 text-xs">
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Type</dt><dd className="text-slate-700 dark:text-slate-200">{entry.idType || '—'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">State</dt><dd className="text-slate-700 dark:text-slate-200">{entry.idIssuingState || '—'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Last 4</dt><dd className="text-slate-700 dark:text-slate-200 font-mono">{entry.idLast4 ? `····${entry.idLast4}` : '—'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Expires</dt><dd className="text-slate-700 dark:text-slate-200">{entry.idExpiration ? fmtDate(entry.idExpiration) : '—'}</dd></div>
                                </dl>
                              </div>

                              {/* Act Block */}
                              <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Act Details</p>
                                <dl className="space-y-1 text-xs">
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Document</dt><dd className="text-slate-700 dark:text-slate-200">{entry.documentDescription || '—'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Thumbprint</dt><dd className={entry.thumbprintTaken ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>{entry.thumbprintTaken ? '✓ Taken' : '✗ Not taken'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Witness</dt><dd className="text-slate-700 dark:text-slate-200">{entry.witnessRequired ? 'Required' : 'Not required'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Fee</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">${Number(entry.fee || 0).toFixed(2)}</dd></div>
                                </dl>
                              </div>

                              {/* Links & Notes Block */}
                              <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Links & Notes</p>
                                <dl className="space-y-1 text-xs">
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Appointment</dt><dd className="text-slate-700 dark:text-slate-200">{entry.linkedAppointmentId ? `#${entry.linkedAppointmentId}` : '—'}</dd></div>
                                  <div className="flex gap-2"><dt className="w-24 text-slate-400 shrink-0">Invoice</dt><dd className="text-slate-700 dark:text-slate-200">{entry.linkedInvoiceId || '—'}</dd></div>
                                </dl>
                                {entry.notes && (
                                  <p className="mt-2 rounded-md bg-slate-100 dark:bg-slate-700/60 px-3 py-2 text-xs italic text-slate-500 dark:text-slate-400">
                                    "{entry.notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ── QUICK-LINK FROM APPOINTMENTS ────────────────────────────────────── */}
      {appointments.filter((a) => !linkedApptIds.has(a.id)).length > 0 && (
        <Card className="border-dashed border-slate-300 dark:border-slate-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-4 w-4 text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quick-Create from Appointments Without Journal Entries
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {appointments
                .filter((a) => !linkedApptIds.has(a.id))
                .slice(0, 6)
                .map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => handleQuickLink(apt)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <Plus className="h-3 w-3 text-blue-500" />
                    {apt.date} · {apt.client} · {apt.type}
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Journal;
