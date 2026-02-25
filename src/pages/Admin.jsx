import React, { useMemo, useState } from 'react';
import {
  Activity, AlertCircle, AlertTriangle, BookOpen, Check, CheckCheck,
  ChevronDown, ChevronRight, Clock, Database, Edit2, Eye, EyeOff,
  FileText, Fingerprint, Globe, Hash, History, Info, MapPin, Plus,
  ScrollText, Send, Shield, Sparkles, Tag, Trash2,
  UserCheck, X, XCircle, Zap,
} from 'lucide-react';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
  Input, Label, Select, Progress,
} from '../components/UI';
import { useData } from '../context/DataContext';
import { getGateState } from '../utils/gates';
import { toast } from '../hooks/useLinker';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STALE_DAYS = 90;

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'Washington DC' },
];

const ACT_TYPES = [
  'Acknowledgment', 'Jurat', 'Oath / Affirmation', 'Copy Certification',
  'Signature Witnessing', 'I-9 Verification', 'Apostille', 'Deposition',
  'Deed of Trust', 'Power of Attorney', 'Remote Online Notary (RON)', 'Protest', 'Other',
];

const ID_TYPES_ALL = [
  "Driver's License", 'Passport', 'Passport Card', 'State ID Card',
  'Military ID', 'Tribal ID', 'Permanent Resident Card', 'Foreign Passport',
  'Inmate ID', 'Other Gov-Issued Photo ID',
];

const ARTICLE_CATEGORIES = ['State Rules', 'Compliance', 'Best Practices', 'Fee Tables', 'Technology', 'RON', 'Other'];

const ACTION_META = {
  created:              { label: 'Created',              color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  updated:              { label: 'Updated',              color: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500'    },
  published:            { label: 'Published',            color: 'text-violet-600 dark:text-violet-400',   dot: 'bg-violet-500'  },
  unpublished:          { label: 'Unpublished',          color: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500'   },
  deleted:              { label: 'Deleted',              color: 'text-red-600 dark:text-red-400',         dot: 'bg-red-500'     },
  submitted_for_review: { label: 'Sent for Review',      color: 'text-cyan-600 dark:text-cyan-400',       dot: 'bg-cyan-500'    },
  rejected:             { label: 'Rejected',             color: 'text-red-600 dark:text-red-400',         dot: 'bg-red-500'     },
};

const RESOURCE_LABELS = {
  stateRules:        'State Policy',
  feeSchedules:      'Fee Schedule',
  idRequirements:    'ID Requirements',
  knowledgeArticles: 'AI Article',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const diffStrings = (prev, next, fields) =>
  fields.reduce((diffs, f) => {
    if (String(prev[f] ?? '') !== String(next[f] ?? '')) {
      diffs.push(`${f}: ${JSON.stringify(prev[f] ?? '')} \u2192 ${JSON.stringify(next[f] ?? '')}`);
    }
    return diffs;
  }, []).join('; ') || 'Record updated';

const isStale = (record) => {
  const ts = record.updatedAt || record.createdAt;
  if (!ts) return false;
  return (Date.now() - new Date(ts)) > STALE_DAYS * 24 * 3600 * 1000;
};

// ─── REUSABLE: SECTION CONTAINER ─────────────────────────────────────────────
const SectionCard = ({ icon, title, count, children, action }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        {icon}
        {title}
        {count !== undefined && (
          <span className="ml-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {count}
          </span>
        )}
      </CardTitle>
      {action}
    </CardHeader>
    {children}
  </Card>
);

// ─── REUSABLE: MODAL SHELL ────────────────────────────────────────────────────
const ModalShell = ({ title, icon, onClose, onSubmit, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-white">{icon}</div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X className="h-5 w-5" /></button>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        {children}
      </form>
    </div>
  </div>
);

const DatasetImportModal = ({ isOpen, onClose, onImport }) => {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setRaw('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const normalized = raw.trim().replace(/\\n/g, '\n');
      const parsed = JSON.parse(normalized);
      onImport(parsed);
      onClose();
    } catch (err) {
      setError(err?.message?.startsWith('No recognized') || err?.message?.startsWith('Dataset import expects')
        ? err.message
        : `Invalid JSON: ${err.message}`);
    }
  };

  return (
    <ModalShell title="Import Jurisdiction Dataset" icon={<Database className="h-4 w-4" />} onClose={onClose} onSubmit={handleSubmit} wide>
      <p className="text-xs text-slate-500 dark:text-slate-400">Paste the 50-state + DC JSON payload. This will refresh state policies, fee schedules, ID requirements, and create compliance red-flag reminders for imported jurisdictions.</p>
      <div>
        <Label>Dataset JSON</Label>
        <textarea
          required
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='{"AL": { ... }}'
          className="mt-1 min-h-[240px] w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <ModalFooter onClose={onClose} label="Import Dataset" disabled={!raw.trim()} />
    </ModalShell>
  );
};

const ModalFooter = ({ onClose, label = 'Save', disabled }) => (
  <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
    <Button type="submit" className="flex-1" disabled={disabled}>{label}</Button>
  </div>
);

// ─── SOURCE URL BANNER ────────────────────────────────────────────────────────
const SourceUrlBanner = () => (
  <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3">
    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
      An official source URL is required before this record can be submitted for review or published. Add one below.
    </p>
  </div>
);

// ─── STATE RULE FORM ──────────────────────────────────────────────────────────
const StateRuleModal = ({ isOpen, onClose, onSave, initial, requireSourceUrl }) => {
  const blank = {
    state: '', stateCode: '', version: '', effectiveDate: '', status: 'draft', publishedAt: null,
    maxFeePerAct: '', thumbprintRequired: false, journalRequired: false, ronPermitted: false,
    ronStatute: '', seal: '', retentionYears: '', notarizationTypes: [], witnessRequirements: '',
    specialActCaveats: '', officialSourceUrl: '', notes: '',
  };
  const [form, setForm] = useState(blank);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(initial
      ? { ...blank, ...initial, maxFeePerAct: String(initial.maxFeePerAct ?? ''), retentionYears: String(initial.retentionYears ?? ''), notarizationTypes: initial.notarizationTypes || [] }
      : { ...blank });
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleActType = (t) => setForm((f) => ({
    ...f,
    notarizationTypes: f.notarizationTypes.includes(t) ? f.notarizationTypes.filter((x) => x !== t) : [...f.notarizationTypes, t],
  }));
  const stateOpts = [{ value: '', label: '\u2014 Select State \u2014' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))];

  const handleSubmit = (e) => {
    e.preventDefault();
    const stateObj = US_STATES.find((s) => s.code === form.stateCode);
    onSave({ ...form, state: stateObj?.name || form.state, maxFeePerAct: parseFloat(form.maxFeePerAct) || 0, retentionYears: parseInt(form.retentionYears) || 0 });
    onClose();
  };

  return (
    <ModalShell title={initial ? 'Edit State Policy' : 'New State Policy'} icon={<Globe className="h-4 w-4" />} onClose={onClose} onSubmit={handleSubmit} wide>
      {requireSourceUrl && <SourceUrlBanner />}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>State <span className="text-red-500">*</span></Label>
          <Select required value={form.stateCode} onChange={(e) => { const s = US_STATES.find((x) => x.code === e.target.value); set('stateCode', e.target.value); if (s) set('state', s.name); }} options={stateOpts} />
        </div>
        <div>
          <Label>Version Tag <span className="text-red-500">*</span></Label>
          <Input required placeholder="e.g. 2024-v2" value={form.version} onChange={(e) => set('version', e.target.value)} />
        </div>
        <div>
          <Label>Effective Date</Label>
          <Input type="date" value={form.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onChange={(e) => set('status', e.target.value)} options={[{ value: 'draft', label: 'Draft' }, { value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} />
        </div>
        <div>
          <Label>Max Fee Per Act ($)</Label>
          <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.maxFeePerAct} onChange={(e) => set('maxFeePerAct', e.target.value)} />
        </div>
        <div>
          <Label>Retention Years</Label>
          <Input type="number" min="1" placeholder="10" value={form.retentionYears} onChange={(e) => set('retentionYears', e.target.value)} />
        </div>
        <div>
          <Label>RON Statute</Label>
          <Input placeholder="e.g. RCW 42.44.265" value={form.ronStatute} onChange={(e) => set('ronStatute', e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Seal Requirement</Label>
          <Input placeholder="e.g. Required \u2014 black ink embossed" value={form.seal} onChange={(e) => set('seal', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['thumbprintRequired', 'Thumbprint Required'], ['journalRequired', 'Journal Required'], ['ronPermitted', 'RON Permitted']].map(([k, lbl]) => (
          <button key={k} type="button" onClick={() => set(k, !form[k])}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-semibold transition-all ${form[k] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}>
            {form[k] ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-40" />}
            {lbl}
          </button>
        ))}
      </div>

      <div>
        <Label>Permitted Notarization Types</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {ACT_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => toggleActType(t)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${form.notarizationTypes.includes(t) ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Witness Requirements</Label>
        <textarea rows={3} placeholder="When witnesses are required for specific documents or acts."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.witnessRequirements} onChange={(e) => set('witnessRequirements', e.target.value)} />
      </div>

      <div>
        <Label>Special Act Caveats</Label>
        <textarea rows={3} placeholder="Special act exceptions, RON caveats, document-specific limitations, etc."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.specialActCaveats} onChange={(e) => set('specialActCaveats', e.target.value)} />
      </div>

      <div>
        <Label>
          Official Source URL
          <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">Required to Publish</span>
        </Label>
        <Input placeholder="e.g. Secretary of State / statute link" value={form.officialSourceUrl} onChange={(e) => set('officialSourceUrl', e.target.value)} />
      </div>

      <div>
        <Label>Admin Notes</Label>
        <textarea rows={3} placeholder="Internal notes about this policy version\u2026"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <ModalFooter onClose={onClose} label={initial ? 'Save Changes' : 'Create Policy'} />
    </ModalShell>
  );
};

// ─── FEE SCHEDULE FORM ────────────────────────────────────────────────────────
const FeeScheduleModal = ({ isOpen, onClose, onSave, initial }) => {
  const blank = { stateCode: '', actType: 'Acknowledgment', maxFee: '', effectiveDate: '', notes: '' };
  const [form, setForm] = useState(blank);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(initial ? { ...blank, ...initial, maxFee: String(initial.maxFee ?? '') } : { ...blank });
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, maxFee: parseFloat(form.maxFee) || 0 });
    onClose();
  };

  return (
    <ModalShell title={initial ? 'Edit Fee Schedule' : 'New Fee Schedule'} icon={<Hash className="h-4 w-4" />} onClose={onClose} onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>State Code <span className="text-red-500">*</span></Label>
          <Select required value={form.stateCode} onChange={(e) => set('stateCode', e.target.value)}
            options={[{ value: '', label: '\u2014 State \u2014' }, ...US_STATES.map((s) => ({ value: s.code, label: s.code }))]} />
        </div>
        <div>
          <Label>Act Type <span className="text-red-500">*</span></Label>
          <Select value={form.actType} onChange={(e) => set('actType', e.target.value)} options={ACT_TYPES.map((t) => ({ value: t, label: t }))} />
        </div>
        <div>
          <Label>Max Fee ($) <span className="text-red-500">*</span></Label>
          <Input required type="number" step="0.01" min="0" placeholder="0.00" value={form.maxFee} onChange={(e) => set('maxFee', e.target.value)} />
        </div>
        <div>
          <Label>Effective Date</Label>
          <Input type="date" value={form.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Input placeholder="Per signature, per signer, etc." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <ModalFooter onClose={onClose} label={initial ? 'Save Changes' : 'Add Fee'} />
    </ModalShell>
  );
};

// ─── ID REQUIREMENTS FORM ─────────────────────────────────────────────────────
const IdRequirementModal = ({ isOpen, onClose, onSave, initial }) => {
  const blank = { stateCode: '', acceptedIdTypes: [], expirationRequired: true, twoFormAllowed: false, credibleWitnessAllowed: false, notes: '' };
  const [form, setForm] = useState(blank);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(initial ? { ...blank, ...initial, acceptedIdTypes: initial.acceptedIdTypes || [] } : { ...blank });
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleId = (t) => setForm((f) => ({
    ...f,
    acceptedIdTypes: f.acceptedIdTypes.includes(t) ? f.acceptedIdTypes.filter((x) => x !== t) : [...f.acceptedIdTypes, t],
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <ModalShell title={initial ? 'Edit ID Requirements' : 'New ID Requirements'} icon={<Shield className="h-4 w-4" />} onClose={onClose} onSubmit={handleSubmit} wide>
      <div>
        <Label>State Code <span className="text-red-500">*</span></Label>
        <Select required value={form.stateCode} onChange={(e) => set('stateCode', e.target.value)}
          options={[{ value: '', label: '\u2014 State \u2014' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))]} />
      </div>

      <div>
        <Label>Accepted ID Types</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {ID_TYPES_ALL.map((t) => (
            <button key={t} type="button" onClick={() => toggleId(t)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${form.acceptedIdTypes.includes(t) ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['expirationRequired', 'Expiration Required'], ['twoFormAllowed', 'Two Forms Allowed'], ['credibleWitnessAllowed', 'Credible Witness OK']].map(([k, lbl]) => (
          <button key={k} type="button" onClick={() => set(k, !form[k])}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-semibold transition-all ${form[k] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}>
            {form[k] ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-40" />}
            {lbl}
          </button>
        ))}
      </div>

      <div>
        <Label>Notes</Label>
        <textarea rows={3} placeholder="State-specific ID policy details\u2026"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <ModalFooter onClose={onClose} label={initial ? 'Save Changes' : 'Add Rules'} />
    </ModalShell>
  );
};

// ─── KNOWLEDGE ARTICLE FORM ───────────────────────────────────────────────────
const ArticleModal = ({ isOpen, onClose, onSave, initial, requireSourceUrl }) => {
  const blank = { title: '', category: 'State Rules', stateCode: '', content: '', tags: '', status: 'draft', officialSourceUrl: '' };
  const [form, setForm] = useState(blank);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(initial ? { ...blank, ...initial, tags: (initial.tags || []).join(', ') } : { ...blank });
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) });
    onClose();
  };

  return (
    <ModalShell title={initial ? 'Edit Article' : 'New Knowledge Article'} icon={<BookOpen className="h-4 w-4" />} onClose={onClose} onSubmit={handleSubmit} wide>
      {requireSourceUrl && <SourceUrlBanner />}
      <div>
        <Label>Title <span className="text-red-500">*</span></Label>
        <Input required placeholder="Article title visible to the Compliance Advisor" value={form.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={form.category} onChange={(e) => set('category', e.target.value)} options={ARTICLE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <div>
          <Label>State (optional)</Label>
          <Select value={form.stateCode || ''} onChange={(e) => set('stateCode', e.target.value || null)}
            options={[{ value: '', label: '\u2014 All States \u2014' }, ...US_STATES.map((s) => ({ value: s.code, label: s.code }))]} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onChange={(e) => set('status', e.target.value)} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} />
        </div>
      </div>
      <div>
        <Label>Content <span className="text-red-500">*</span></Label>
        <textarea required rows={8} placeholder="Full article content fed to the Compliance Advisor for grounded responses\u2026"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          value={form.content} onChange={(e) => set('content', e.target.value)} />
        <p className="mt-1 text-xs text-slate-400">{form.content.split(/\s+/).filter(Boolean).length} words</p>
      </div>
      <div>
        <Label>
          Official Source URL
          <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">Required to Publish</span>
        </Label>
        <Input placeholder="e.g. State statute, official guidance document URL" value={form.officialSourceUrl || ''} onChange={(e) => set('officialSourceUrl', e.target.value)} />
      </div>
      <div>
        <Label>Tags (comma-separated)</Label>
        <Input placeholder="e.g. RON, Washington, Compliance" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
      </div>
      <ModalFooter onClose={onClose} label={initial ? 'Save Changes' : 'Create Article'} />
    </ModalShell>
  );
};

// ─── DELETE CONFIRM ───────────────────────────────────────────────────────────
const DeleteConfirm = ({ label, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Delete Record?</h3>
          <p className="text-xs text-slate-500 truncate max-w-[220px]">{label}</p>
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">This action will be recorded in the audit log and cannot be undone.</p>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" className="flex-1" onClick={onConfirm}>Delete</Button>
      </div>
    </div>
  </div>
);

// ─── REJECT REVIEW MODAL ──────────────────────────────────────────────────────
const RejectModal = ({ label, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Reject Review</h3>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{label}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Provide a reason. This will be recorded in the audit log and version history.</p>
        <textarea
          rows={3}
          placeholder="e.g. Source URL missing, fee cap needs verification\u2026"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" className="flex-1" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>Reject</Button>
        </div>
      </div>
    </div>
  );
};

// ─── VERSION HISTORY MODAL ────────────────────────────────────────────────────
const VersionHistoryModal = ({ record, resourceLabel, onClose }) => {
  const history = (record.versionHistory || []).slice().reverse();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-white">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Version History</h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{resourceLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {history.length === 0 ? (
            <div className="text-center py-10">
              <History className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No version history yet.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Snapshots are recorded with each future update.</p>
            </div>
          ) : (
            <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 space-y-6 pl-6">
              {history.map((entry, i) => {
                const actionColors = {
                  updated:  'bg-blue-500',
                  approved: 'bg-emerald-500',
                  rejected: 'bg-red-500',
                };
                const dotColor = actionColors[entry.action] || 'bg-slate-400';
                return (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${dotColor}`} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 capitalize">{entry.action}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono bg-slate-50 dark:bg-slate-700/50 rounded px-2 py-1 mt-1 break-words">{entry.diff}</p>
                        <p className="text-[10px] text-slate-400 mt-1">by {entry.actor}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{fmtDate(entry.ts)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-3 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

// ─── STATUS PILL ──────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const styles = {
    active:         'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    draft:          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    archived:       'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    published:      'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    unpublished:    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    pending_review: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  };
  const labels = { pending_review: 'Pending Review' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
};

// ─── STALE CHIP ───────────────────────────────────────────────────────────────
const StaleChip = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 text-[10px] font-semibold">
    <AlertCircle className="h-3 w-3" />
    Stale {STALE_DAYS}d+
  </span>
);

// ─── COVERAGE DASHBOARD ───────────────────────────────────────────────────────
const CoverageDashboard = ({ stateRules, feeSchedules, idRequirements, knowledgeArticles }) => {
  const [coverageFilter, setCoverageFilter] = useState('all');

  const coverage = useMemo(() => {
    return US_STATES.map((s) => {
      const policy = stateRules.find((r) => r.stateCode === s.code && r.publishedAt && r.status !== 'archived');
      const hasFees = feeSchedules.some((f) => f.stateCode === s.code);
      const hasIds = idRequirements.some((r) => r.stateCode === s.code);
      const hasArticles = knowledgeArticles.some((a) => a.status === 'published' && a.stateCode === s.code);
      const stalePolicy = policy && isStale(policy);
      const sections = [!!policy, hasFees, hasIds, hasArticles];
      const filled = sections.filter(Boolean).length;
      const percent = Math.round((filled / 4) * 100);
      const tier = filled === 4 ? 'complete' : filled > 0 ? 'partial' : 'missing';
      return { ...s, hasPolicy: !!policy, hasFees, hasIds, hasArticles, stalePolicy, filled, percent, tier };
    });
  }, [stateRules, feeSchedules, idRequirements, knowledgeArticles]);

  const totals = useMemo(() => ({
    complete: coverage.filter((c) => c.tier === 'complete').length,
    partial:  coverage.filter((c) => c.tier === 'partial').length,
    missing:  coverage.filter((c) => c.tier === 'missing').length,
    stale:    coverage.filter((c) => c.stalePolicy).length,
  }), [coverage]);

  const filtered = coverageFilter === 'all' ? coverage
    : coverageFilter === 'stale' ? coverage.filter((c) => c.stalePolicy)
    : coverage.filter((c) => c.tier === coverageFilter);

  return (
    <SectionCard
      icon={<Sparkles className="h-4 w-4 text-blue-500" />}
      title="AI Trainer Coverage"
      count={`${totals.complete}/${US_STATES.length} ready`}
    >
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {[
            { key: 'all',      label: `All (${US_STATES.length})`,      icon: <Database className="h-3 w-3" />,                         activeColor: 'text-blue-600 dark:text-blue-400'    },
            { key: 'complete', label: `Complete (${totals.complete})`,   dot: 'bg-emerald-500',                                          activeColor: 'text-emerald-600 dark:text-emerald-400' },
            { key: 'partial',  label: `Partial (${totals.partial})`,     dot: 'bg-amber-500',                                            activeColor: 'text-amber-600 dark:text-amber-400'  },
            { key: 'missing',  label: `Missing (${totals.missing})`,     dot: 'bg-red-500',                                              activeColor: 'text-red-600 dark:text-red-400'      },
            { key: 'stale',    label: `Stale Policy (${totals.stale})`,  dot: 'bg-orange-500',                                           activeColor: 'text-orange-600 dark:text-orange-400'},
          ].map(({ key, label, icon, dot, activeColor }) => (
            <button key={key} onClick={() => setCoverageFilter(key)}
              className={`flex items-center gap-1.5 font-semibold transition-colors ${coverageFilter === key ? activeColor : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {icon || <span className={`w-2 h-2 rounded-full ${dot}`} />}
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Overall readiness</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{Math.round((totals.complete / US_STATES.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all" style={{ width: `${(totals.complete / US_STATES.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {['State', 'Policy', 'Fees', 'IDs', 'Articles', 'Coverage'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">No states match this filter.</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{s.code}</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">{s.name}</span>
                    {s.stalePolicy && <AlertCircle className="h-3 w-3 text-orange-500" title="Policy is stale (90+ days)" />}
                  </div>
                </td>
                {[s.hasPolicy, s.hasFees, s.hasIds, s.hasArticles].map((ok, i) => (
                  <td key={i} className="px-5 py-2.5">
                    {ok ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-slate-300 dark:text-slate-600" />}
                  </td>
                ))}
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16"><Progress value={s.percent} /></div>
                    <span className={`text-xs font-bold ${s.tier === 'complete' ? 'text-emerald-600 dark:text-emerald-400' : s.tier === 'partial' ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                      {s.percent}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </SectionCard>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const Admin = () => {
  const {
    data,
    addStateRule, updateStateRule, publishStateRule, unpublishStateRule, deleteStateRule,
    addFeeSchedule, updateFeeSchedule, deleteFeeSchedule,
    addIdRequirement, updateIdRequirement, deleteIdRequirement,
    addKnowledgeArticle, updateKnowledgeArticle, deleteKnowledgeArticle,
    submitForReview, approveRecord, rejectReview,
    importJurisdictionDataset,
  } = useData();

  const actor      = data.settings?.name || 'Admin';
  const currentRole = data.settings?.userRole || 'owner';
  const isAdmin    = useMemo(() => getGateState('admin', { role: currentRole, planTier: data.settings?.planTier }).allowed, [currentRole, data.settings?.planTier]);

  // ── Role gates ────────────────────────────────────────────────────────────────
  const canPublishDirectly = ['owner', 'compliance_manager'].includes(currentRole);
  const canApproveReject   = ['owner', 'compliance_manager'].includes(currentRole);
  const canSubmitForReview = ['owner', 'agency_admin', 'compliance_manager'].includes(currentRole);
  const canEdit            = ['owner', 'agency_admin', 'compliance_manager'].includes(currentRole);
  const canDelete          = currentRole === 'owner';

  const stateRules        = data.stateRules        || [];
  const feeSchedules      = data.feeSchedules      || [];
  const idRequirements    = data.idRequirements    || [];
  const knowledgeArticles = data.knowledgeArticles || [];
  const auditLog          = data.adminAuditLog     || [];

  const [activeTab, setActiveTab]         = useState('stateRules');
  const [stateModal, setStateModal]       = useState({ open: false, item: null, requireSourceUrl: false });
  const [feeModal, setFeeModal]           = useState({ open: false, item: null });
  const [idModal, setIdModal]             = useState({ open: false, item: null });
  const [articleModal, setArticleModal]   = useState({ open: false, item: null, requireSourceUrl: false });
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [stateFilter, setStateFilter]     = useState('');
  const [auditFilter, setAuditFilter]     = useState('');
  const [expandedArticle, setExpandedArticle] = useState(null);
  const [datasetModalOpen, setDatasetModalOpen] = useState(false);

  const handleDatasetImport = (payload) => {
    try {
      importJurisdictionDataset(payload, actor);
      const count = Object.keys(payload || {}).length;
      toast.success(`Dataset import completed (${count} entries processed).`);
    } catch (error) {
      toast.error(error?.message || 'Dataset import failed. Check payload format and try again.');
      throw error;
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Shield className="h-12 w-12 text-red-300 dark:text-red-800 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Admin Access Required</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your current role ({currentRole}) does not have access to the Admin control center.</p>
        </CardContent>
      </Card>
    );
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const allRecords = [...stateRules, ...feeSchedules, ...idRequirements, ...knowledgeArticles];
    return {
      activeRules:       stateRules.filter((r) => r.status === 'active').length,
      draftRules:        stateRules.filter((r) => r.status === 'draft').length,
      publishedArticles: knowledgeArticles.filter((a) => a.status === 'published').length,
      draftArticles:     knowledgeArticles.filter((a) => a.status === 'draft').length,
      feeEntries:        feeSchedules.length,
      idEntries:         idRequirements.length,
      recentChanges:     auditLog.filter((l) => (Date.now() - new Date(l.timestamp)) < 7 * 86400000).length,
      pendingReview:     allRecords.filter((r) => r.status === 'pending_review').length,
      staleCount:        allRecords.filter((r) => isStale(r)).length,
    };
  }, [stateRules, knowledgeArticles, feeSchedules, idRequirements, auditLog]);

  const coverageReadyCount = useMemo(() =>
    US_STATES.filter((s) => {
      const hasPolicy   = stateRules.some((r) => r.stateCode === s.code && r.publishedAt && r.status !== 'archived');
      const hasFees     = feeSchedules.some((f) => f.stateCode === s.code);
      const hasIds      = idRequirements.some((r) => r.stateCode === s.code);
      const hasArticles = knowledgeArticles.some((a) => a.status === 'published' && a.stateCode === s.code);
      return hasPolicy && hasFees && hasIds && hasArticles;
    }).length,
    [stateRules, feeSchedules, idRequirements, knowledgeArticles]
  );

  // ── Review Queue ─────────────────────────────────────────────────────────────
  const reviewQueue = useMemo(() => [
    ...stateRules.filter((r) => r.status === 'pending_review').map((r) => ({ ...r, _type: 'stateRules', _label: `${r.state} ${r.version}` })),
    ...feeSchedules.filter((r) => r.status === 'pending_review').map((r) => ({ ...r, _type: 'feeSchedules', _label: `${r.stateCode} \u2014 ${r.actType}` })),
    ...idRequirements.filter((r) => r.status === 'pending_review').map((r) => ({ ...r, _type: 'idRequirements', _label: `${r.stateCode} ID Rules` })),
    ...knowledgeArticles.filter((r) => r.status === 'pending_review').map((r) => ({ ...r, _type: 'knowledgeArticles', _label: r.title })),
  ], [stateRules, feeSchedules, idRequirements, knowledgeArticles]);

  // ── Filtered helpers ──────────────────────────────────────────────────────────
  const filteredRules   = useMemo(() => stateFilter ? stateRules.filter((r) => r.stateCode === stateFilter) : stateRules, [stateRules, stateFilter]);
  const filteredFees    = useMemo(() => stateFilter ? feeSchedules.filter((f) => f.stateCode === stateFilter) : feeSchedules, [feeSchedules, stateFilter]);
  const filteredIds     = useMemo(() => stateFilter ? idRequirements.filter((r) => r.stateCode === stateFilter) : idRequirements, [idRequirements, stateFilter]);
  const filteredAudit   = useMemo(() => {
    const q = auditFilter.toLowerCase().trim();
    return q ? auditLog.filter((l) => [l.actor, l.action, l.resourceType, l.resourceLabel, l.diff].join(' ').toLowerCase().includes(q)) : auditLog;
  }, [auditLog, auditFilter]);

  const stateOpts = [{ value: '', label: 'All States' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))];

  // ── Helpers: source-URL gated actions ─────────────────────────────────────────
  const guardedSubmit = (resourceType, record) => {
    if (!record.officialSourceUrl) {
      if (resourceType === 'stateRules') { setStateModal({ open: true, item: record, requireSourceUrl: true }); return; }
      if (resourceType === 'knowledgeArticles') { setArticleModal({ open: true, item: record, requireSourceUrl: true }); return; }
    }
    submitForReview(resourceType, record.id, actor);
  };

  const guardedPublish = (resourceType, record) => {
    if (!record.officialSourceUrl) {
      if (resourceType === 'stateRules') { setStateModal({ open: true, item: record, requireSourceUrl: true }); return; }
      if (resourceType === 'knowledgeArticles') { setArticleModal({ open: true, item: record, requireSourceUrl: true }); return; }
    }
    if (resourceType === 'stateRules') { publishStateRule(record.id, actor); return; }
    if (resourceType === 'knowledgeArticles') { updateKnowledgeArticle(record.id, { status: 'published' }, actor, 'status: draft \u2192 published'); return; }
  };

  // ── Delete dispatcher ─────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    if (type === 'stateRule')     deleteStateRule(id, actor);
    if (type === 'feeSchedule')   deleteFeeSchedule(id, actor);
    if (type === 'idRequirement') deleteIdRequirement(id, actor);
    if (type === 'article')       deleteKnowledgeArticle(id, actor);
    setDeleteTarget(null);
  };

  const TABS = [
    { key: 'stateRules',        icon: <Globe className="h-4 w-4" />,      label: 'State Policies',   count: stateRules.length        },
    { key: 'feeSchedules',      icon: <Hash className="h-4 w-4" />,       label: 'Fee Tables',       count: feeSchedules.length      },
    { key: 'idRequirements',    icon: <Shield className="h-4 w-4" />,     label: 'ID Requirements',  count: idRequirements.length    },
    { key: 'knowledgeArticles', icon: <BookOpen className="h-4 w-4" />,   label: 'AI Content',       count: knowledgeArticles.length },
    { key: 'coverage',          icon: <Sparkles className="h-4 w-4" />,   label: 'AI Coverage',      count: `${coverageReadyCount}/${US_STATES.length}` },
    { key: 'reviewQueue',       icon: <CheckCheck className="h-4 w-4" />, label: 'Review Queue',     count: reviewQueue.length, alert: reviewQueue.length > 0 },
    { key: 'auditLog',          icon: <Activity className="h-4 w-4" />,   label: 'Audit Log',        count: auditLog.length          },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
      {/* ── MODALS ──────────────────────────────────────────────────────────── */}
      {stateModal.open && (
        <StateRuleModal isOpen onClose={() => setStateModal({ open: false, item: null, requireSourceUrl: false })}
          initial={stateModal.item}
          requireSourceUrl={stateModal.requireSourceUrl}
          onSave={(form) => {
            if (stateModal.item) {
              const diff = diffStrings(stateModal.item, form, ['version', 'status', 'maxFeePerAct', 'ronPermitted', 'thumbprintRequired', 'journalRequired', 'retentionYears']);
              updateStateRule(stateModal.item.id, form, actor, diff);
            } else {
              addStateRule(form, actor);
            }
            setStateModal({ open: false, item: null, requireSourceUrl: false });
          }} />
      )}
      {feeModal.open && (
        <FeeScheduleModal isOpen onClose={() => setFeeModal({ open: false, item: null })}
          initial={feeModal.item}
          onSave={(form) => {
            if (feeModal.item) {
              const diff = diffStrings(feeModal.item, form, ['maxFee', 'effectiveDate', 'stateCode', 'actType']);
              updateFeeSchedule(feeModal.item.id, form, actor, diff);
            } else {
              addFeeSchedule(form, actor);
            }
            setFeeModal({ open: false, item: null });
          }} />
      )}
      {idModal.open && (
        <IdRequirementModal isOpen onClose={() => setIdModal({ open: false, item: null })}
          initial={idModal.item}
          onSave={(form) => {
            if (idModal.item) {
              const diff = diffStrings(idModal.item, form, ['expirationRequired', 'twoFormAllowed', 'credibleWitnessAllowed']);
              updateIdRequirement(idModal.item.id, form, actor, diff);
            } else {
              addIdRequirement(form, actor);
            }
            setIdModal({ open: false, item: null });
          }} />
      )}
      {articleModal.open && (
        <ArticleModal isOpen onClose={() => setArticleModal({ open: false, item: null, requireSourceUrl: false })}
          initial={articleModal.item}
          requireSourceUrl={articleModal.requireSourceUrl}
          onSave={(form) => {
            if (articleModal.item) {
              const diff = diffStrings(articleModal.item, form, ['title', 'status', 'category', 'stateCode']);
              updateKnowledgeArticle(articleModal.item.id, form, actor, diff);
            } else {
              addKnowledgeArticle(form, actor);
            }
            setArticleModal({ open: false, item: null, requireSourceUrl: false });
          }} />
      )}
      {deleteTarget && (
        <DeleteConfirm label={deleteTarget.label} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}
      {rejectTarget && (
        <RejectModal
          label={rejectTarget.label}
          onConfirm={(reason) => {
            rejectReview(rejectTarget.type, rejectTarget.id, actor, reason);
            setRejectTarget(null);
          }}
          onCancel={() => setRejectTarget(null)}
        />
      )}
      <DatasetImportModal isOpen={datasetModalOpen} onClose={() => setDatasetModalOpen(false)} onImport={handleDatasetImport} />
      {historyTarget && (
        <VersionHistoryModal
          record={historyTarget.record}
          resourceLabel={historyTarget.label}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <Card className="app-hero-card">
        <CardContent className="relative flex flex-col gap-3 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Control Center</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Admin</h1>
            <p className="mt-1 text-sm text-slate-300">Manage state policies, fee tables, ID datasets, and AI knowledge content.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {actor} \u00b7 {currentRole}
              </span>
              {kpis.pendingReview > 0 && (
                <button onClick={() => setActiveTab('reviewQueue')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-colors">
                  <CheckCheck className="h-3 w-3" />
                  {kpis.pendingReview} pending review
                </button>
              )}
              {kpis.staleCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-400/30 px-3 py-1 text-xs font-semibold text-orange-300">
                  <AlertCircle className="h-3 w-3" />
                  {kpis.staleCount} stale record{kpis.staleCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {[
              { label: 'Active Policies',  value: kpis.activeRules,       color: 'text-emerald-400' },
              { label: 'AI Articles',      value: kpis.publishedArticles,  color: 'text-violet-400'  },
              { label: 'Fee Entries',      value: kpis.feeEntries,         color: 'text-blue-400'    },
              { label: 'AI Ready',         value: `${coverageReadyCount}/${US_STATES.length}`, color: 'text-cyan-400' },
              { label: 'Pending Review',   value: kpis.pendingReview,      color: kpis.pendingReview > 0 ? 'text-amber-400' : 'text-slate-400' },
            ].map((k) => (
              <div key={k.label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">{k.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── GLOBAL STATE FILTER ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
        <div className="w-52">
          <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} options={stateOpts} />
        </div>
        {stateFilter && (
          <span className="text-xs text-slate-500">
            Filtering by <strong>{stateFilter}</strong> \u00b7{' '}
            <button onClick={() => setStateFilter('')} className="text-blue-600 hover:underline">Clear</button>
          </span>
        )}
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-slate-200 dark:border-slate-700">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 sm:gap-1.5 whitespace-nowrap px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px min-h-[44px] ${activeTab === tab.key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {tab.icon}{tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab.alert ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════ STATE POLICIES ══════════════════════════════ */}
      {activeTab === 'stateRules' && (
        <SectionCard icon={<Globe className="h-4 w-4 text-blue-500" />} title="State Policy Records" count={filteredRules.length}
          action={canEdit && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDatasetModalOpen(true)}><Database className="mr-1.5 h-3.5 w-3.5" /> Import JSON</Button>
              <Button size="sm" onClick={() => setStateModal({ open: true, item: null, requireSourceUrl: false })}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Policy</Button>
            </div>
          )}>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['State', 'Version', 'Effective', 'Published', 'Max Fee', 'Flags', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredRules.length === 0 ? (
                  <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">No state policies. Add one to get started.</td></tr>
                ) : filteredRules.map((rule) => (
                  <tr key={rule.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{rule.stateCode}</span>
                        <span className="text-xs text-slate-400 hidden sm:inline">{rule.state}</span>
                        {isStale(rule) && <StaleChip />}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{rule.version}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(rule.effectiveDate)}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{rule.publishedAt ? fmtDate(rule.publishedAt) : '\u2014'}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-100">${rule.maxFeePerAct}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {rule.thumbprintRequired && <span title="Thumbprint required"><Fingerprint className="h-3.5 w-3.5 text-amber-500" /></span>}
                        {rule.journalRequired     && <span title="Journal required"><ScrollText className="h-3.5 w-3.5 text-blue-500" /></span>}
                        {rule.ronPermitted        && <span title="RON permitted"><Zap className="h-3.5 w-3.5 text-violet-500" /></span>}
                      </div>
                    </td>
                    <td className="px-5 py-3"><StatusPill status={rule.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {/* Version history */}
                        {(rule.versionHistory || []).length > 0 && (
                          <Button variant="ghost" size="sm" title="Version history" onClick={() => setHistoryTarget({ record: rule, label: `${rule.state} ${rule.version}` })}>
                            <History className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                        )}
                        {/* Review workflow */}
                        {rule.status === 'pending_review' && canApproveReject && (
                          <>
                            <Button variant="ghost" size="sm" title="Approve and publish" onClick={() => approveRecord('stateRules', rule.id, actor)}>
                              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Reject review" onClick={() => setRejectTarget({ type: 'stateRules', id: rule.id, label: `${rule.state} ${rule.version}` })}>
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                        {rule.status !== 'pending_review' && canSubmitForReview && !rule.publishedAt && (
                          <Button variant="ghost" size="sm" title="Submit for review" onClick={() => guardedSubmit('stateRules', rule)}>
                            <Send className="h-3.5 w-3.5 text-cyan-500" />
                          </Button>
                        )}
                        {/* Direct publish / unpublish */}
                        {canPublishDirectly && rule.status !== 'pending_review' && (
                          rule.publishedAt ? (
                            <Button variant="ghost" size="sm" title="Unpublish" onClick={() => unpublishStateRule(rule.id, actor)}>
                              <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" title="Publish directly" onClick={() => guardedPublish('stateRules', rule)} disabled={rule.status === 'archived'}>
                              <Eye className="h-3.5 w-3.5 text-emerald-500" />
                            </Button>
                          )
                        )}
                        {canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => setStateModal({ open: true, item: rule, requireSourceUrl: false })}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="danger" size="sm" onClick={() => setDeleteTarget({ type: 'stateRule', id: rule.id, label: `${rule.state} ${rule.version}` })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </SectionCard>
      )}

      {/* ═══════════════════════ FEE TABLES ══════════════════════════════════ */}
      {activeTab === 'feeSchedules' && (
        <SectionCard icon={<Hash className="h-4 w-4 text-emerald-500" />} title="Fee Schedule" count={filteredFees.length}
          action={canEdit && <Button size="sm" onClick={() => setFeeModal({ open: true, item: null })}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Fee</Button>}>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['State', 'Act Type', 'Max Fee', 'Effective', 'Notes', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredFees.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">No fee entries.</td></tr>
                ) : filteredFees.map((fee) => (
                  <tr key={fee.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{fee.stateCode}</span>
                        {isStale(fee) && <StaleChip />}
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge variant="blue" className="text-[10px]">{fee.actType}</Badge></td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        ${fee.maxFee?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(fee.effectiveDate)}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-[180px] truncate">{fee.notes || '\u2014'}</td>
                    <td className="px-5 py-3">{fee.status === 'pending_review' && <StatusPill status="pending_review" />}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {(fee.versionHistory || []).length > 0 && (
                          <Button variant="ghost" size="sm" title="Version history" onClick={() => setHistoryTarget({ record: fee, label: `${fee.stateCode} \u2014 ${fee.actType}` })}>
                            <History className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                        )}
                        {fee.status === 'pending_review' && canApproveReject && (
                          <>
                            <Button variant="ghost" size="sm" title="Approve" onClick={() => approveRecord('feeSchedules', fee.id, actor)}>
                              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Reject" onClick={() => setRejectTarget({ type: 'feeSchedules', id: fee.id, label: `${fee.stateCode} \u2014 ${fee.actType}` })}>
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                        {fee.status !== 'pending_review' && canSubmitForReview && (
                          <Button variant="ghost" size="sm" title="Submit for review" onClick={() => submitForReview('feeSchedules', fee.id, actor)}>
                            <Send className="h-3.5 w-3.5 text-cyan-500" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => setFeeModal({ open: true, item: fee })}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="danger" size="sm" onClick={() => setDeleteTarget({ type: 'feeSchedule', id: fee.id, label: `${fee.stateCode} \u2014 ${fee.actType}` })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </SectionCard>
      )}

      {/* ═══════════════════════ ID REQUIREMENTS ═════════════════════════════ */}
      {activeTab === 'idRequirements' && (
        <SectionCard icon={<Shield className="h-4 w-4 text-amber-500" />} title="ID Requirements Dataset" count={filteredIds.length}
          action={canEdit && <Button size="sm" onClick={() => setIdModal({ open: true, item: null })}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Rules</Button>}>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredIds.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">No ID requirement records.</div>
            )}
            {filteredIds.map((req) => (
              <div key={req.id} className="group flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 shrink-0">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{req.stateCode}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {[['expirationRequired', 'Expiration Req.'], ['twoFormAllowed', 'Two Forms OK'], ['credibleWitnessAllowed', 'Credible Witness OK']].map(([k, lbl]) => (
                      <span key={k} className={`inline-flex items-center gap-1 text-xs font-medium ${req[k] ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through'}`}>
                        {req[k] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}{lbl}
                      </span>
                    ))}
                    {isStale(req) && <StaleChip />}
                    {req.status === 'pending_review' && <StatusPill status="pending_review" />}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(req.acceptedIdTypes || []).map((t) => (
                      <span key={t} className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">{t}</span>
                    ))}
                  </div>
                  {req.notes && <p className="mt-2 text-xs text-slate-400 italic">{req.notes}</p>}
                  <p className="mt-1 text-[10px] text-slate-300 dark:text-slate-600">Updated {timeAgo(req.updatedAt)}</p>
                </div>
                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                  {(req.versionHistory || []).length > 0 && (
                    <Button variant="ghost" size="sm" title="Version history" onClick={() => setHistoryTarget({ record: req, label: `${req.stateCode} ID Rules` })}>
                      <History className="h-3.5 w-3.5 text-slate-500" />
                    </Button>
                  )}
                  {req.status === 'pending_review' && canApproveReject && (
                    <>
                      <Button variant="ghost" size="sm" title="Approve" onClick={() => approveRecord('idRequirements', req.id, actor)}>
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Reject" onClick={() => setRejectTarget({ type: 'idRequirements', id: req.id, label: `${req.stateCode} ID Rules` })}>
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </>
                  )}
                  {req.status !== 'pending_review' && canSubmitForReview && (
                    <Button variant="ghost" size="sm" title="Submit for review" onClick={() => submitForReview('idRequirements', req.id, actor)}>
                      <Send className="h-3.5 w-3.5 text-cyan-500" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => setIdModal({ open: true, item: req })}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget({ type: 'idRequirement', id: req.id, label: `${req.stateCode} ID Rules` })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ═══════════════════════ AI CONTENT ══════════════════════════════════ */}
      {activeTab === 'knowledgeArticles' && (
        <SectionCard icon={<BookOpen className="h-4 w-4 text-violet-500" />} title="AI Trainer Knowledge Base" count={knowledgeArticles.length}
          action={canEdit && <Button size="sm" onClick={() => setArticleModal({ open: true, item: null, requireSourceUrl: false })}><Plus className="mr-1.5 h-3.5 w-3.5" /> New Article</Button>}>

          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" />{kpis.publishedArticles} published</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />{kpis.draftArticles} draft</span>
            <span className="text-slate-400">{knowledgeArticles.reduce((s, a) => s + (a.content?.split(/\s+/).filter(Boolean).length || 0), 0).toLocaleString()} total words indexed</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {knowledgeArticles.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">No articles yet. Create your first knowledge article.</div>
            )}
            {knowledgeArticles.map((article) => {
              const isExpanded = expandedArticle === article.id;
              const wordCount  = (article.content || '').split(/\s+/).filter(Boolean).length;
              return (
                <div key={article.id} className="group">
                  <div className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${article.status === 'published' ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800' : 'bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600'}`}>
                      {article.status === 'published'
                        ? <Eye className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{article.title}</p>
                        <StatusPill status={article.status} />
                        <Badge variant="default" className="text-[10px]">{article.category}</Badge>
                        {article.stateCode && <Badge variant="blue" className="text-[10px]">{article.stateCode}</Badge>}
                        {isStale(article) && <StaleChip />}
                      </div>
                      <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 ${isExpanded ? '' : 'line-clamp-2'}`}>{article.content}</p>
                      {isExpanded && article.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {article.tags.map((t) => (
                            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300"><Tag className="h-2.5 w-2.5" />{t}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-400">
                        <span>{wordCount} words</span>
                        {article.publishedAt && <span>Published {timeAgo(article.publishedAt)}</span>}
                        <span>Updated {timeAgo(article.updatedAt)}</span>
                        {!article.officialSourceUrl && <span className="text-orange-500 font-semibold">No source URL</span>}
                        <button onClick={() => setExpandedArticle(isExpanded ? null : article.id)} className="text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
                          {isExpanded ? 'Collapse' : 'Expand'}{isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                      {(article.versionHistory || []).length > 0 && (
                        <Button variant="ghost" size="sm" title="Version history" onClick={() => setHistoryTarget({ record: article, label: article.title })}>
                          <History className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                      )}
                      {article.status === 'pending_review' && canApproveReject && (
                        <>
                          <Button variant="ghost" size="sm" title="Approve and publish" onClick={() => approveRecord('knowledgeArticles', article.id, actor)}>
                            <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Reject review" onClick={() => setRejectTarget({ type: 'knowledgeArticles', id: article.id, label: article.title })}>
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </>
                      )}
                      {article.status === 'draft' && canSubmitForReview && (
                        <Button variant="ghost" size="sm" title="Submit for review" onClick={() => guardedSubmit('knowledgeArticles', article)}>
                          <Send className="h-3.5 w-3.5 text-cyan-500" />
                        </Button>
                      )}
                      {article.status === 'draft' && canPublishDirectly && (
                        <Button variant="ghost" size="sm" title="Publish directly" onClick={() => guardedPublish('knowledgeArticles', article)}>
                          <Eye className="h-3.5 w-3.5 text-violet-500" />
                        </Button>
                      )}
                      {article.status === 'published' && canPublishDirectly && (
                        <Button variant="ghost" size="sm" title="Unpublish" onClick={() => updateKnowledgeArticle(article.id, { status: 'draft' }, actor, 'status: published \u2192 draft')}>
                          <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => setArticleModal({ open: true, item: article, requireSourceUrl: false })}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget({ type: 'article', id: article.id, label: article.title })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ═══════════════════════ AI COVERAGE ════════════════════════════════ */}
      {activeTab === 'coverage' && (
        <CoverageDashboard
          stateRules={stateRules}
          feeSchedules={feeSchedules}
          idRequirements={idRequirements}
          knowledgeArticles={knowledgeArticles}
        />
      )}

      {/* ═══════════════════════ REVIEW QUEUE ═══════════════════════════════ */}
      {activeTab === 'reviewQueue' && (
        <SectionCard icon={<CheckCheck className="h-4 w-4 text-cyan-500" />} title="Compliance Review Queue" count={reviewQueue.length}>
          {reviewQueue.length === 0 ? (
            <CardContent className="py-16 text-center">
              <CheckCheck className="h-10 w-10 text-emerald-300 dark:text-emerald-700 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Queue is clear</p>
              <p className="text-sm text-slate-400 mt-1">No records are pending compliance review.</p>
            </CardContent>
          ) : (
            <>
              {!canApproveReject && (
                <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">Your role (<strong>{currentRole}</strong>) can view but not approve records. A compliance_manager or owner must approve.</p>
                </div>
              )}
              <CardContent className="p-0 overflow-x-auto mt-2">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      {['Resource', 'Type', 'Submitted By', 'Submitted', 'Source URL', ''].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {reviewQueue.map((item) => (
                      <tr key={`${item._type}-${item.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{item._label}</p>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="default" className="text-[10px]">{RESOURCE_LABELS[item._type]}</Badge>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">{item.submittedBy || '\u2014'}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{item.submittedForReviewAt ? timeAgo(item.submittedForReviewAt) : '\u2014'}</td>
                        <td className="px-5 py-3">
                          {item.officialSourceUrl
                            ? <a href={item.officialSourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[160px] block">View source</a>
                            : <span className="text-xs text-orange-500 font-semibold">Missing</span>}
                        </td>
                        <td className="px-5 py-3">
                          {canApproveReject && (
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={() => approveRecord(item._type, item.id, actor)}>
                                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => setRejectTarget({ type: item._type, id: item.id, label: item._label })}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </>
          )}
        </SectionCard>
      )}

      {/* ═══════════════════════ AUDIT LOG ═══════════════════════════════════ */}
      {activeTab === 'auditLog' && (
        <SectionCard icon={<Activity className="h-4 w-4 text-slate-500" />} title="Audit Log" count={auditLog.length}>
          <div className="px-6 pb-3 pt-3 border-b border-slate-100 dark:border-slate-700">
            <input value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} placeholder="Search actor, action, resource\u2026"
              className="h-9 w-full max-w-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['When', 'Actor', 'Action', 'Resource', 'Changes'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredAudit.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400">No audit entries found.</td></tr>
                ) : filteredAudit.map((log) => {
                  const am = ACTION_META[log.action] || ACTION_META.updated;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                        <p>{fmtDate(log.timestamp)}</p>
                        <p className="text-slate-400">{timeAgo(log.timestamp)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{log.actor}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{log.actorRole}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${am.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${am.dot}`} />{am.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[160px] truncate">{log.resourceLabel}</p>
                        <p className="text-[10px] text-slate-400">{RESOURCE_LABELS[log.resourceType] || log.resourceType}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400 max-w-[200px]">
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{log.diff}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </SectionCard>
      )}
    </div>
  );
};

export default Admin;
