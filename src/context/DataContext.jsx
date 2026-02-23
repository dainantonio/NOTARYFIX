import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, BookOpen, Check, ChevronDown, ChevronRight, Clock,
  Edit2, Eye, EyeOff, FileText, Fingerprint, Globe, Hash, Info,
  MapPin, Plus, RefreshCw, ScrollText, Shield, Tag, Trash2,
  TrendingUp, X, Zap, Activity, Database, Sparkles,
} from 'lucide-react';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
  Input, Label, Select, Progress,
} from '../components/UI';
import { useData } from '../context/DataContext';
import { getGateState } from '../utils/gates';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
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
  created:     { label: 'Created',     color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  updated:     { label: 'Updated',     color: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500'    },
  published:   { label: 'Published',   color: 'text-violet-600 dark:text-violet-400',   dot: 'bg-violet-500'  },
  unpublished: { label: 'Unpublished', color: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500'   },
  deleted:     { label: 'Deleted',     color: 'text-red-600 dark:text-red-400',         dot: 'bg-red-500'     },
};

const RESOURCE_LABELS = {
  stateRules:        'State Policy',
  feeSchedules:      'Fee Schedule',
  idRequirements:    'ID Requirements',
  knowledgeArticles: 'AI Article',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
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
      diffs.push(`${f}: ${JSON.stringify(prev[f] ?? '')} → ${JSON.stringify(next[f] ?? '')}`);
    }
    return diffs;
  }, []).join('; ') || 'Record updated';

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

const ModalFooter = ({ onClose, label = 'Save', disabled }) => (
  <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
    <Button type="submit" className="flex-1" disabled={disabled}>{label}</Button>
  </div>
);

// ─── STATE RULE FORM ──────────────────────────────────────────────────────────
const StateRuleModal = ({ isOpen, onClose, onSave, initial }) => {
  const blank = { state: '', stateCode: '', version: '', effectiveDate: '', status: 'draft', publishedAt: null, maxFeePerAct: '', thumbprintRequired: false, journalRequired: false, ronPermitted: false, ronStatute: '', seal: '', retentionYears: '', notarizationTypes: [], witnessRequirements: '', specialActCaveats: '', officialSourceUrl: '', notes: '' };
  const [form, setForm] = useState(blank);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(initial ? { ...blank, ...initial, maxFeePerAct: String(initial.maxFeePerAct ?? ''), retentionYears: String(initial.retentionYears ?? ''), notarizationTypes: initial.notarizationTypes || [] } : { ...blank });
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleActType = (t) => setForm((f) => ({ ...f, notarizationTypes: f.notarizationTypes.includes(t) ? f.notarizationTypes.filter((x) => x !== t) : [...f.notarizationTypes, t] }));
  const stateOpts = [{ value: '', label: '— Select State —' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))];

  const handleSubmit = (e) => {
    e.preventDefault();
    const stateObj = US_STATES.find((s) => s.code === form.stateCode);
    onSave({ ...form, state: stateObj?.name || form.state, maxFeePerAct: parseFloat(form.maxFeePerAct) || 0, retentionYears: parseInt(form.retentionYears) || 0 });
    onClose();
  };

  return (
    <ModalShell title={initial ? 'Edit State Policy' : 'New State Policy'} icon={<Globe className="h-4 w-4" />} onClose={onClose} onSubmit={handleSubmit} wide>
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
          <Input placeholder="e.g. Required — black ink embossed" value={form.seal} onChange={(e) => set('seal', e.target.value)} />
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-3 gap-3">
        {[['thumbprintRequired', 'Thumbprint Required'], ['journalRequired', 'Journal Required'], ['ronPermitted', 'RON Permitted']].map(([k, lbl]) => (
          <button key={k} type="button" onClick={() => set(k, !form[k])}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-semibold transition-all ${form[k] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}>
            {form[k] ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-40" />}
            {lbl}
          </button>
        ))}
      </div>

      {/* Notarization types */}
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
        <textarea rows={3} placeholder="Grounded notes: e.g., when witnesses are required for specific documents or acts."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.witnessRequirements} onChange={(e) => set('witnessRequirements', e.target.value)} />
      </div>

      <div>
        <Label>Special Act Caveats</Label>
        <textarea rows={3} placeholder="Grounded notes: special act exceptions, RON caveats, document-specific limitations, etc."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.specialActCaveats} onChange={(e) => set('specialActCaveats', e.target.value)} />
      </div>

      <div>
        <Label>Official Source URL</Label>
        <Input placeholder="e.g. Secretary of State / statute link" value={form.officialSourceUrl} onChange={(e) => set('officialSourceUrl', e.target.value)} />
      </div>

      <div>
        <Label>Admin Notes</Label>
        <textarea rows={3} placeholder="Internal notes about this policy version…"
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
            options={[{ value: '', label: '— State —' }, ...US_STATES.map((s) => ({ value: s.code, label: s.code }))]} />
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
  const toggleId = (t) => setForm((f) => ({ ...f, acceptedIdTypes: f.acceptedIdTypes.includes(t) ? f.acceptedIdTypes.filter((x) => x !== t) : [...f.acceptedIdTypes, t] }));

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
          options={[{ value: '', label: '— State —' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))]} />
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
        <textarea rows={3} placeholder="State-specific ID policy details…"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <ModalFooter onClose={onClose} label={initial ? 'Save Changes' : 'Add Rules'} />
    </ModalShell>
  );
};

// ─── KNOWLEDGE ARTICLE FORM ───────────────────────────────────────────────────
const ArticleModal = ({ isOpen, onClose, onSave, initial }) => {
  const blank = { title: '', category: 'State Rules', stateCode: '', content: '', tags: '', status: 'draft' };
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
      <div>
        <Label>Title <span className="text-red-500">*</span></Label>
        <Input required placeholder="Article title visible to AI Trainer" value={form.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={form.category} onChange={(e) => set('category', e.target.value)} options={ARTICLE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <div>
          <Label>State (optional)</Label>
          <Select value={form.stateCode || ''} onChange={(e) => set('stateCode', e.target.value || null)}
            options={[{ value: '', label: '— All States —' }, ...US_STATES.map((s) => ({ value: s.code, label: s.code }))]} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onChange={(e) => set('status', e.target.value)} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} />
        </div>
      </div>
      <div>
        <Label>Content <span className="text-red-500">*</span></Label>
        <textarea required rows={8} placeholder="Full article content that will be fed to the AI Trainer for grounded responses…"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          value={form.content} onChange={(e) => set('content', e.target.value)} />
        <p className="mt-1 text-xs text-slate-400">{form.content.split(/\s+/).filter(Boolean).length} words</p>
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

// ─── PILL BADGE ───────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const s = { active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', draft: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', archived: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400', published: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400', unpublished: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${s[status] || s.draft}`}>{status}</span>;
};

// ─── ROW ACTIONS ─────────────────────────────────────────────────────────────
const RowActions = ({ onEdit, onDelete, extra }) => (
  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    {extra}
    <Button variant="ghost" size="sm" onClick={onEdit}><Edit2 className="h-3.5 w-3.5" /></Button>
    <Button variant="danger" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
  </div>
);

// ─── AI TRAINER COVERAGE DASHBOARD ────────────────────────────────────────────
const CoverageDashboard = ({ stateRules, feeSchedules, idRequirements, knowledgeArticles }) => {
  const [coverageFilter, setCoverageFilter] = useState('all'); // all | complete | partial | missing

  const coverage = useMemo(() => {
    return US_STATES.map((s) => {
      const hasPolicy = stateRules.some((r) => r.stateCode === s.code && r.publishedAt && r.status !== 'archived');
      const hasFees = feeSchedules.some((f) => f.stateCode === s.code);
      const hasIds = idRequirements.some((r) => r.stateCode === s.code);
      const hasArticles = knowledgeArticles.some((a) => a.status === 'published' && a.stateCode === s.code);
      const sections = [hasPolicy, hasFees, hasIds, hasArticles];
      const filled = sections.filter(Boolean).length;
      const percent = Math.round((filled / 4) * 100);
      const tier = filled === 4 ? 'complete' : filled > 0 ? 'partial' : 'missing';
      return { ...s, hasPolicy, hasFees, hasIds, hasArticles, filled, percent, tier };
    });
  }, [stateRules, feeSchedules, idRequirements, knowledgeArticles]);

  const totals = useMemo(() => ({
    complete: coverage.filter((c) => c.tier === 'complete').length,
    partial: coverage.filter((c) => c.tier === 'partial').length,
    missing: coverage.filter((c) => c.tier === 'missing').length,
  }), [coverage]);

  const filtered = coverageFilter === 'all' ? coverage : coverage.filter((c) => c.tier === coverageFilter);

  return (
    <SectionCard
      icon={<Sparkles className="h-4 w-4 text-blue-500" />}
      title="AI Trainer Coverage"
      count={`${totals.complete}/${US_STATES.length} ready`}
    >
      {/* Summary strip */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-6 text-xs">
          <button onClick={() => setCoverageFilter('all')}
            className={`flex items-center gap-1.5 font-semibold transition-colors ${coverageFilter === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <Database className="h-3 w-3" /> All ({US_STATES.length})
          </button>
          <button onClick={() => setCoverageFilter('complete')}
            className={`flex items-center gap-1.5 font-semibold transition-colors ${coverageFilter === 'complete' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Complete ({totals.complete})
          </button>
          <button onClick={() => setCoverageFilter('partial')}
            className={`flex items-center gap-1.5 font-semibold transition-colors ${coverageFilter === 'partial' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Partial ({totals.partial})
          </button>
          <button onClick={() => setCoverageFilter('missing')}
            className={`flex items-center gap-1.5 font-semibold transition-colors ${coverageFilter === 'missing' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <span className="w-2 h-2 rounded-full bg-red-500" /> Missing ({totals.missing})
          </button>
        </div>

        {/* Overall progress */}
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

      {/* Grid */}
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
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
                  </div>
                </td>
                {[s.hasPolicy, s.hasFees, s.hasIds, s.hasArticles].map((ok, i) => (
                  <td key={i} className="px-5 py-2.5">
                    {ok
                      ? <Check className="h-4 w-4 text-emerald-500" />
                      : <X className="h-4 w-4 text-slate-300 dark:text-slate-600" />}
                  </td>
                ))}
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16">
                      <Progress value={s.percent} />
                    </div>
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
  } = useData();

  const actor = data.settings?.name || 'Admin';
  const currentRole = data.settings?.userRole || 'owner';
  const isAdmin = useMemo(() => getGateState('admin', { role: currentRole, planTier: data.settings?.planTier }).allowed, [currentRole, data.settings?.planTier]);

  const stateRules       = data.stateRules        || [];
  const feeSchedules     = data.feeSchedules      || [];
  const idRequirements   = data.idRequirements    || [];
  const knowledgeArticles = data.knowledgeArticles || [];
  const auditLog         = data.adminAuditLog     || [];

  const [activeTab, setActiveTab]           = useState('stateRules');
  const [stateModal, setStateModal]         = useState({ open: false, item: null });
  const [feeModal, setFeeModal]             = useState({ open: false, item: null });
  const [idModal, setIdModal]               = useState({ open: false, item: null });
  const [articleModal, setArticleModal]     = useState({ open: false, item: null });
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [stateFilter, setStateFilter]       = useState('');
  const [auditFilter, setAuditFilter]       = useState('');
  const [expandedArticle, setExpandedArticle] = useState(null);

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

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    activeRules:      stateRules.filter((r) => r.status === 'active').length,
    draftRules:       stateRules.filter((r) => r.status === 'draft').length,
    publishedArticles: knowledgeArticles.filter((a) => a.status === 'published').length,
    draftArticles:    knowledgeArticles.filter((a) => a.status === 'draft').length,
    feeEntries:       feeSchedules.length,
    idEntries:        idRequirements.length,
    recentChanges:    auditLog.filter((l) => (Date.now() - new Date(l.timestamp)) < 7 * 86400000).length,
  }), [stateRules, knowledgeArticles, feeSchedules, idRequirements, auditLog]);

  // ── Coverage KPI ─────────────────────────────────────────────────────────────
  const coverageReadyCount = useMemo(() =>
    US_STATES.filter((s) => {
      const hasPolicy = stateRules.some((r) => r.stateCode === s.code && r.publishedAt && r.status !== 'archived');
      const hasFees = feeSchedules.some((f) => f.stateCode === s.code);
      const hasIds = idRequirements.some((r) => r.stateCode === s.code);
      const hasArticles = knowledgeArticles.some((a) => a.status === 'published' && a.stateCode === s.code);
      return hasPolicy && hasFees && hasIds && hasArticles;
    }).length,
    [stateRules, feeSchedules, idRequirements, knowledgeArticles]
  );

  // ── Filtered helpers ─────────────────────────────────────────────────────────
  const filteredRules = useMemo(() =>
    stateFilter ? stateRules.filter((r) => r.stateCode === stateFilter) : stateRules,
    [stateRules, stateFilter]
  );
  const filteredFees = useMemo(() =>
    stateFilter ? feeSchedules.filter((f) => f.stateCode === stateFilter) : feeSchedules,
    [feeSchedules, stateFilter]
  );
  const filteredIds = useMemo(() =>
    stateFilter ? idRequirements.filter((r) => r.stateCode === stateFilter) : idRequirements,
    [idRequirements, stateFilter]
  );
  const filteredAudit = useMemo(() => {
    const q = auditFilter.toLowerCase().trim();
    return q ? auditLog.filter((l) => [l.actor, l.action, l.resourceType, l.resourceLabel, l.diff].join(' ').toLowerCase().includes(q)) : auditLog;
  }, [auditLog, auditFilter]);

  const stateOpts = [{ value: '', label: 'All States' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))];

  // ── Delete dispatcher ─────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { type, id, label } = deleteTarget;
    if (type === 'stateRule')     deleteStateRule(id, actor);
    if (type === 'feeSchedule')   deleteFeeSchedule(id, actor);
    if (type === 'idRequirement') deleteIdRequirement(id, actor);
    if (type === 'article')       deleteKnowledgeArticle(id, actor);
    setDeleteTarget(null);
  };

  const TABS = [
    { key: 'stateRules',       icon: <Globe className="h-4 w-4" />,     label: 'State Policies',   count: stateRules.length },
    { key: 'feeSchedules',     icon: <Hash className="h-4 w-4" />,      label: 'Fee Tables',       count: feeSchedules.length },
    { key: 'idRequirements',   icon: <Shield className="h-4 w-4" />,    label: 'ID Requirements',  count: idRequirements.length },
    { key: 'knowledgeArticles',icon: <BookOpen className="h-4 w-4" />,  label: 'AI Content',       count: knowledgeArticles.length },
    { key: 'coverage',         icon: <Sparkles className="h-4 w-4" />,  label: 'AI Coverage',      count: `${coverageReadyCount}/${US_STATES.length}` },
    { key: 'auditLog',         icon: <Activity className="h-4 w-4" />,  label: 'Audit Log',        count: auditLog.length },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Modals */}
      {stateModal.open && (
        <StateRuleModal isOpen onClose={() => setStateModal({ open: false, item: null })}
          initial={stateModal.item}
          onSave={(form) => {
            if (stateModal.item) {
              const diff = diffStrings(stateModal.item, form, ['version', 'status', 'maxFeePerAct', 'ronPermitted', 'thumbprintRequired', 'journalRequired', 'retentionYears']);
              updateStateRule(stateModal.item.id, form, actor, diff);
            } else {
              addStateRule(form, actor);
            }
            setStateModal({ open: false, item: null });
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
        <ArticleModal isOpen onClose={() => setArticleModal({ open: false, item: null })}
          initial={articleModal.item}
          onSave={(form) => {
            if (articleModal.item) {
              const diff = diffStrings(articleModal.item, form, ['title', 'status', 'category', 'stateCode']);
              updateKnowledgeArticle(articleModal.item.id, form, actor, diff);
            } else {
              addKnowledgeArticle(form, actor);
            }
            setArticleModal({ open: false, item: null });
          }} />
      )}
      {deleteTarget && (
        <DeleteConfirm label={deleteTarget.label} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
        <CardContent className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Control Center</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Admin</h1>
            <p className="mt-1 text-sm text-slate-300">Manage state policies, fee tables, ID datasets, and AI knowledge content.</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {actor} · {currentRole}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Active Policies', value: kpis.activeRules, color: 'text-emerald-400' },
              { label: 'AI Articles',     value: kpis.publishedArticles, color: 'text-violet-400' },
              { label: 'Fee Entries',     value: kpis.feeEntries,        color: 'text-blue-400'   },
              { label: 'AI Ready',        value: `${coverageReadyCount}/${US_STATES.length}`, color: 'text-cyan-400' },
              { label: '7-Day Changes',   value: kpis.recentChanges,     color: 'text-amber-400'  },
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
        {stateFilter && <span className="text-xs text-slate-500">Filtering by <strong>{stateFilter}</strong> · <button onClick={() => setStateFilter('')} className="text-blue-600 hover:underline">Clear</button></span>}
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {tab.icon}{tab.label}
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════ STATE POLICIES ══════════════════════════════ */}
      {activeTab === 'stateRules' && (
        <SectionCard icon={<Globe className="h-4 w-4 text-blue-500" />} title="State Policy Records" count={filteredRules.length}
          action={<Button size="sm" onClick={() => setStateModal({ open: true, item: null })}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Policy</Button>}>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[740px]">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['State', 'Version', 'Effective', 'Published', 'Max Fee', 'Flags', 'Act Types', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredRules.length === 0 ? (
                  <tr><td colSpan={9} className="py-10 text-center text-sm text-slate-400">No state policies. Add one to get started.</td></tr>
                ) : filteredRules.map((rule) => (
                  <tr key={rule.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{rule.stateCode}</span>
                        <span className="text-xs text-slate-400 hidden sm:inline">{rule.state}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{rule.version}</span></td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(rule.effectiveDate)}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{rule.publishedAt ? fmtDate(rule.publishedAt) : '—'}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-100">${rule.maxFeePerAct}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {rule.thumbprintRequired && <span title="Thumbprint required"><Fingerprint className="h-3.5 w-3.5 text-amber-500" /></span>}
                        {rule.journalRequired && <span title="Journal required"><ScrollText className="h-3.5 w-3.5 text-blue-500" /></span>}
                        {rule.ronPermitted && <span title="RON permitted"><Zap className="h-3.5 w-3.5 text-violet-500" /></span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(rule.notarizationTypes || []).slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 px-2 py-0.5 text-[10px] font-medium">{t}</span>
                        ))}
                        {(rule.notarizationTypes || []).length > 3 && <span className="text-[10px] text-slate-400">+{rule.notarizationTypes.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3"><StatusPill status={rule.status} /></td>
                    <td className="px-5 py-3">
                      <RowActions
                        onEdit={() => setStateModal({ open: true, item: rule })}
                        onDelete={() => setDeleteTarget({ type: 'stateRule', id: rule.id, label: `${rule.state} ${rule.version}` })}
                        extra={rule.publishedAt ? (
                          <Button variant="ghost" size="sm" title="Unpublish from AI Trainer" onClick={() => unpublishStateRule(rule.id, actor)}>
                            <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" title="Publish to AI Trainer" onClick={() => publishStateRule(rule.id, actor)} disabled={rule.status === 'archived'}>
                            <Eye className="h-3.5 w-3.5 text-emerald-500" />
                          </Button>
                        )}
                      />
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
          action={<Button size="sm" onClick={() => setFeeModal({ open: true, item: null })}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Fee</Button>}>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['State', 'Act Type', 'Max Fee', 'Effective', 'Notes', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredFees.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">No fee entries.</td></tr>
                ) : filteredFees.map((fee) => (
                  <tr key={fee.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-100">{fee.stateCode}</td>
                    <td className="px-5 py-3"><Badge variant="blue" className="text-[10px]">{fee.actType}</Badge></td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        ${fee.maxFee?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(fee.effectiveDate)}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-[200px] truncate">{fee.notes || '—'}</td>
                    <td className="px-5 py-3">
                      <RowActions
                        onEdit={() => setFeeModal({ open: true, item: fee })}
                        onDelete={() => setDeleteTarget({ type: 'feeSchedule', id: fee.id, label: `${fee.stateCode} — ${fee.actType}` })}
                      />
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
          action={<Button size="sm" onClick={() => setIdModal({ open: true, item: null })}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Rules</Button>}>
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
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {[['expirationRequired', 'Expiration Req.'], ['twoFormAllowed', 'Two Forms OK'], ['credibleWitnessAllowed', 'Credible Witness OK']].map(([k, lbl]) => (
                      <span key={k} className={`inline-flex items-center gap-1 text-xs font-medium ${req[k] ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                        {req[k] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}{lbl}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(req.acceptedIdTypes || []).map((t) => (
                      <span key={t} className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">{t}</span>
                    ))}
                  </div>
                  {req.notes && <p className="mt-2 text-xs text-slate-400 italic">{req.notes}</p>}
                  <p className="mt-1 text-[10px] text-slate-300 dark:text-slate-600">Updated {timeAgo(req.updatedAt)}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setIdModal({ open: true, item: req })}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget({ type: 'idRequirement', id: req.id, label: `${req.stateCode} ID Rules` })}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ═══════════════════════ AI CONTENT ══════════════════════════════════ */}
      {activeTab === 'knowledgeArticles' && (
        <SectionCard icon={<BookOpen className="h-4 w-4 text-violet-500" />} title="AI Trainer Knowledge Base" count={knowledgeArticles.length}
          action={<Button size="sm" onClick={() => setArticleModal({ open: true, item: null })}><Plus className="mr-1.5 h-3.5 w-3.5" /> New Article</Button>}>

          {/* Stats bar */}
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
              const wordCount = (article.content || '').split(/\s+/).filter(Boolean).length;
              return (
                <div key={article.id} className="group">
                  <div className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {/* Status indicator */}
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
                        <button onClick={() => setExpandedArticle(isExpanded ? null : article.id)} className="text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
                          {isExpanded ? 'Collapse' : 'Expand'}{isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {/* Publish / Unpublish toggle */}
                      {article.status === 'draft' ? (
                        <Button variant="ghost" size="sm" title="Publish to AI Trainer"
                          onClick={() => updateKnowledgeArticle(article.id, { status: 'published' }, actor, 'status: draft → published')}>
                          <Eye className="h-3.5 w-3.5 text-violet-500" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" title="Unpublish"
                          onClick={() => updateKnowledgeArticle(article.id, { status: 'draft' }, actor, 'status: published → draft')}>
                          <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setArticleModal({ open: true, item: article })}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget({ type: 'article', id: article.id, label: article.title })}><Trash2 className="h-3.5 w-3.5" /></Button>
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

      {/* ═══════════════════════ AUDIT LOG ═══════════════════════════════════ */}
      {activeTab === 'auditLog' && (
        <SectionCard icon={<Activity className="h-4 w-4 text-slate-500" />} title="Audit Log" count={auditLog.length}>
          <div className="px-6 pb-3 pt-3 border-b border-slate-100 dark:border-slate-700">
            <input value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} placeholder="Search actor, action, resource…"
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
