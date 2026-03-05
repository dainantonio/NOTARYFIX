import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Building2, Target,
  MapPin, Star, Zap, Shield, Users, Check,
} from 'lucide-react';

// ─── STEP CONFIG ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'welcome',  label: 'Welcome'  },
  { id: 'identity', label: 'You'      },
  { id: 'business', label: 'Business' },
  { id: 'license',  label: 'License'  },
  { id: 'fees',     label: 'Fees'     },
  { id: 'plan',     label: 'Plan'     },
  { id: 'agent',    label: 'Agent'    },
  { id: 'launch',   label: 'Launch'   },
];

// ─── PLAN DATA ────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    period: 'forever',
    tagline: 'Test the waters',
    accent: 'border-slate-600 bg-slate-800/60',
    badge: null,
    features: ['Appointments', 'Basic Journal (10/mo)', 'Clients & Invoices', 'Mileage tracking'],
    locked: ['Signer Portal', 'AI Trainer', 'Team Dispatch'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: 'per month',
    tagline: 'For full-time professionals',
    accent: 'border-blue-500 bg-blue-600/10',
    badge: 'Most Popular',
    features: ['Everything in Starter', 'Unlimited Journal', 'Signer Portal', 'AI Compliance Trainer', 'Invoice Automation', 'Priority Support', 'Unified Dark Interface'],
    locked: ['Team Dispatch', 'Multi-notary'],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '$79',
    period: 'per month',
    tagline: 'Run a full operation',
    accent: 'border-violet-500 bg-violet-600/10',
    badge: 'Full Power',
    features: ['Everything in Pro', 'Team Dispatch', 'Multi-notary', 'SLA Tracking', 'Admin Control Center', 'State Policy Database', 'Dedicated Manager', 'Standardized Team UI'],
    locked: [],
  },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

// ─── STEP ILLUSTRATIONS ───────────────────────────────────────────────────────
const IllustrationWelcome = () => (
  <div className="relative flex h-full items-center justify-center">
    <div className="absolute h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
    <div className="relative grid grid-cols-2 gap-3 p-4">
      {[
        { label: 'Appointments', val: '24', color: 'bg-blue-600' },
        { label: 'Revenue',      val: '$4.2k', color: 'bg-emerald-600' },
        { label: 'Journal',      val: '18 entries', color: 'bg-indigo-600' },
        { label: 'Compliance',   val: '100%', color: 'bg-violet-600' },
      ].map(card => (
        <div key={card.label} className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className={`h-2 w-2 rounded-full ${card.color}`} />
          <p className="text-xl font-bold text-white">{card.val}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
        </div>
      ))}
    </div>
  </div>
);

const IllustrationBusiness = () => (
  <div className="flex h-full items-center justify-center">
    <div className="relative">
      <div className="absolute inset-0 rounded-3xl bg-emerald-600/10 blur-3xl" />
      <div className="relative flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-3xl font-black text-white shadow-lg shadow-emerald-600/30">
          N
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">Antonio Mobile Notary</p>
          <p className="text-sm text-slate-400">Washington · Est. 2024</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2">
          {['Journal', 'Invoices', 'Compliance'].map(item => (
            <div key={item} className="flex flex-col items-center gap-1 rounded-xl bg-white/5 py-2">
              <Check className="h-3 w-3 text-emerald-400" />
              <p className="text-[9px] font-semibold text-slate-400">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const IllustrationLaunch = () => (
  <div className="flex h-full items-center justify-center">
    <div className="relative text-center">
      <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-amber-500/30">
          <Zap className="h-12 w-12 text-white" />
          <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
            <Check className="h-4 w-4 text-white" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">You're all set.</p>
          <p className="mt-1 text-sm text-slate-400">Your workspace is ready.</p>
        </div>
      </div>
    </div>
  </div>
);

// ─── FIELD COMPONENT ─────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
    {children}
  </div>
);

const TextInput = ({ className = '', ...props }) => (
  <input
    className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${className}`}
    {...props}
  />
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const { data, updateSettings } = useData();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name:                 data.settings?.name          || '',
    businessName:         data.settings?.businessName  || '',
    businessLogo:         data.settings?.businessLogo || '',
    businessLogoName:     data.settings?.businessLogoName || '',
    stateCode:            data.settings?.currentStateCode || 'OH',
    commissionedStates:    Array.isArray(data.settings?.commissionedStates) && data.settings.commissionedStates.length ? data.settings.commissionedStates : [data.settings?.currentStateCode || 'OH'],
    monthlyGoal:          data.settings?.monthlyGoal   || 10000,
    selectedPlan:         data.settings?.planTier      || 'pro',
    licenseNumber:        '',
    commissionExpiryDate: data.settings?.commissionExpiryDate || '',
    notaryType:           Array.isArray(data.settings?.notaryType) ? data.settings.notaryType : (data.settings?.notaryType ? [data.settings.notaryType] : ['Traditional']),
    autonomyMode:         data.settings?.autonomyMode || 'supervised',
    feeSchedule:          data.settings?.feeSchedule || { loanSigning: 150, deed: 50, affidavit: 25, i9: 45, general: 15, ron: 75 },
    agentMode:            data.settings?.agentMode || 'supervised',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const canAdvance = () => {
    if (step === 1) return form.name.trim().length > 1 && (form.commissionedStates || []).length > 0;
    if (step === 2) return form.businessName.trim().length > 1;
    if (step === 3) return form.licenseNumber.trim().length > 3;
    if (step === 4) return true;
    if (step === 5) return true;
    return true;
  };

  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1); };
  const back = () => { if (step > 0) setStep(s => s - 1); };

  const finish = () => {
    updateSettings({
      name:                 form.name,
      businessName:         form.businessName,
      businessLogo:         form.businessLogo || '',
      businessLogoName:     form.businessLogoName || '',
      currentStateCode:     form.stateCode,
      commissionedStates:    Array.from(new Set([form.stateCode, ...(form.commissionedStates || [])])),
      monthlyGoal:          Number(form.monthlyGoal),
      planTier:             form.selectedPlan,
      licenseNumber:        form.licenseNumber,
      commissionExpiryDate: form.commissionExpiryDate,
      notaryType:           form.notaryType,
      autonomyMode:         form.autonomyMode,
      feeSchedule:          form.feeSchedule,
      onboardingComplete:   true,
      agentMode:            form.agentMode,
    });
    navigate('/dashboard');
  };

  const pct = Math.round((step / (STEPS.length - 1)) * 100);

  // ── LEFT PANEL CONTENT PER STEP ─────────────────────────────────────────
  const leftContent = {
    0: { title: `Your business, one platform.`,    sub: 'Everything a professional notary needs — scheduling, compliance, invoicing, and team tools — with a consistent interface across every core module.', Illustration: IllustrationWelcome },
    1: { title: `Let's get to know you.`,           sub: 'Your name and profile power your invoices, journal entries, and client-facing documents.', Illustration: IllustrationWelcome },
    2: { title: `Build your business identity.`,   sub: 'Your business name appears on every invoice and client-facing document you generate.', Illustration: IllustrationBusiness },
    3: { title: `Your notary credentials.`,        sub: 'Your license number and commission details appear on compliance records and client documents.', Illustration: IllustrationBusiness },
    4: { title: `Set your fee schedule.`,          sub: 'Establish your standard per-act fees. These power invoice automation and AI drafts.', Illustration: IllustrationBusiness },
    5: { title: `Pick the plan that fits you.`,    sub: 'Start free, upgrade anytime. Every plan includes a 14-day full-feature trial.', Illustration: IllustrationBusiness },
    6: { title: `Meet your closeout agent.`,       sub: 'After each appointment, your agent drafts the journal entry, invoice, and compliance checks — automatically.', Illustration: IllustrationLaunch },
    7: { title: `Ready to launch.`,                sub: 'Your workspace is configured and waiting. Jump in — your first appointment is one tap away.', Illustration: IllustrationLaunch },
  };
  const lc = leftContent[step];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0a0e1a]">

      {/* ══ LEFT ════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex md:w-[44%] lg:w-[48%] flex-col justify-between p-10 lg:p-14 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d1528] via-[#0a0e1a] to-[#0d1528]" />
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-600/8 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-indigo-600/6 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/30">N</div>
          <span className="text-lg font-bold tracking-tight text-white">NotaryFix</span>
        </div>

        {/* Step copy */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-[1.15] tracking-tight text-white lg:text-[2.6rem]"
            style={{ whiteSpace: 'pre-line' }}>
            {lc.title}
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">{lc.sub}</p>

          {/* Illustration area */}
          <div className="h-56 lg:h-64">
            <lc.Illustration />
          </div>
        </div>

        {/* Step dots */}
        <div className="relative z-10 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id}
              className={`transition-all duration-300 rounded-full ${
                i === step ? 'w-6 bg-blue-500' : i < step ? 'w-2 bg-blue-700' : 'w-2 bg-slate-700'
              } h-2`}
            />
          ))}
          <span className="ml-3 text-xs text-slate-500">{step + 1} of {STEPS.length}</span>
        </div>
      </div>

      {/* ══ RIGHT — FORM ════════════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col px-6 py-10 md:px-10 lg:px-16">

        {/* Mobile header */}
        <div className="mb-6 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-base font-bold text-white">N</div>
            <span className="text-base font-bold text-white">NotaryFix</span>
          </div>
          <span className="text-xs text-slate-400">{step + 1} / {STEPS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>

        {/* Step label */}
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            Step {step + 1}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{STEPS[step].label}</span>
        </div>

        {/* ── STEP CONTENT ───────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-between">
          <div className="mt-4 space-y-6">

            {/* STEP 0: WELCOME */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white">Welcome to NotaryFix</h1>
                  <p className="mt-2 text-sm text-slate-400">
                    Let's take 2 minutes to set up your workspace. You can change anything later in Settings.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { Icon: Shield,   title: 'Compliance Built-in',   sub: 'Grounded in admin-published state policy records — fee caps, ID requirements, and act-level red flags with citations on every AI decision' },
                    { Icon: Zap,      title: 'Agent Runtime',          sub: 'Planner → Tools → Verifier runs automatically after each signing. Drafts journal, invoice, and compliance check without you lifting a finger' },
                    { Icon: Target,   title: 'Revenue Tracking',       sub: 'Goals, mileage deductions, and profit visibility' },
                    { Icon: CheckCircle2, title: 'Command Center',     sub: 'Live badge counts, AI suggestion queue, KPI cards, and playbook shortcuts — your proactive agent hub' },
                    { Icon: Users,    title: 'Team Ready',             sub: 'Dispatch, signer portal, and multi-notary coordination' },
                  ].map(({ Icon, title, sub }) => (
                    <div key={title} className="flex gap-3 rounded-xl border border-white/8 bg-white/4 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/20">
                        <Icon className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="mt-0.5 text-xs text-slate-400 leading-snug">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Your details</h1>
                  <p className="mt-1.5 text-sm text-slate-400">This appears on invoices and documents you send to clients.</p>
                </div>
                <Field label="Your Full Name">
                  <TextInput
                    placeholder="Dain Antonio"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Primary State">
                  <div className="relative">
                    <select
                      value={form.stateCode}
                      onChange={e => set('stateCode', e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                      {US_STATES.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">We'll load the right fee limits and ID requirements.</p>
                </Field>
                <Field label="Commissioned States (multi-select)">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex flex-wrap gap-2">
                      {(form.commissionedStates || []).map(code => (
                        <span key={code} className="rounded-full border border-blue-500/40 bg-blue-500/15 px-2.5 py-1 text-[11px] font-semibold text-blue-300">{code}</span>
                      ))}
                      {(!form.commissionedStates || form.commissionedStates.length === 0) && (
                        <span className="text-xs text-slate-500">Select at least one state</span>
                      )}
                    </div>
                    <div className="grid max-h-40 grid-cols-5 gap-2 overflow-y-auto pr-1 sm:grid-cols-7">
                      {US_STATES.map(code => {
                        const active = (form.commissionedStates || []).includes(code);
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => {
                              const setStates = new Set(form.commissionedStates || []);
                              if (active) setStates.delete(code); else setStates.add(code);
                              const next = Array.from(setStates);
                              set('commissionedStates', next);
                              if (!next.includes(form.stateCode)) set('stateCode', next[0] || 'OH');
                            }}
                            className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all ${active ? 'border-blue-500 bg-blue-600/20 text-blue-300' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}`}
                          >
                            {code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Primary state drives defaults. Additional states are stored for multi-state commissions.</p>
                </Field>
              </div>
            )}

            {/* STEP 2: BUSINESS */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Your business</h1>
                  <p className="mt-1.5 text-sm text-slate-400">Used on invoices, the client-facing signer portal, and compliance records.</p>
                </div>
                <Field label="Legal Business Name">
                  <TextInput
                    placeholder="Antonio Mobile Notary LLC"
                    value={form.businessName}
                    onChange={e => set('businessName', e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Business Logo (optional)">
                  <div className="flex items-center gap-3">
                    {form.businessLogo ? (
                      <img src={form.businessLogo} alt="Business logo" className="h-14 w-14 rounded-xl border border-white/15 object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-xs font-bold text-slate-400">LOGO</div>
                    )}
                    <div className="flex-1 space-y-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10">
                        Upload logo
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              set('businessLogo', reader.result);
                              set('businessLogoName', file.name);
                            }
                          };
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                      {form.businessLogo && (
                        <button type="button" onClick={() => { set('businessLogo', ''); set('businessLogoName', ''); }} className="text-xs text-rose-400 hover:text-rose-300">Remove logo</button>
                      )}
                    </div>
                  </div>
                </Field>
                <Field label="Monthly Revenue Goal">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                    <TextInput
                      type="number"
                      className="pl-8 !text-white"
                      placeholder="10000"
                      value={form.monthlyGoal}
                      onChange={e => set('monthlyGoal', e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-slate-500">Tracked on your dashboard as a progress goal.</p>
                </Field>
              </div>
            )}

            {/* STEP 3: LICENSE */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Your credentials</h1>
                  <p className="mt-1.5 text-sm text-slate-400">This appears on compliance records and client documents.</p>
                </div>
                <Field label="Notary License / Commission Number">
                  <TextInput
                    placeholder="e.g. OH-2024-098765"
                    value={form.licenseNumber}
                    onChange={e => set('licenseNumber', e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Commission Expiry Date">
                  <input
                    type="date"
                    value={form.commissionExpiryDate}
                    onChange={e => set('commissionExpiryDate', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </Field>
                <Field label="Notary Type (select all that apply)">
                  <div className="flex gap-3 flex-wrap">
                    {['Traditional', 'Electronic', 'RON (Remote Online)'].map(t => {
                      const selected = (form.notaryType || []).includes(t);
                      return (
                        <button key={t} onClick={() => {
                          const next = selected
                            ? (form.notaryType || []).filter(x => x !== t)
                            : [...(form.notaryType || []), t];
                          set('notaryType', next);
                        }}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                          selected
                            ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}>
                          <span className="flex items-center gap-2">
                            {selected && <span className="text-blue-400">✓</span>}
                            {t}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Select all types you perform.</p>
                </Field>
              </div>
            )}

            {/* STEP 4: FEES */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Your fee schedule</h1>
                  <p className="mt-1.5 text-sm text-slate-400">Set your standard per-appointment fees. You can always adjust per-job.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'loanSigning', label: 'Loan Signing', placeholder: '150' },
                    { key: 'deed',        label: 'Deed / Title',  placeholder: '50'  },
                    { key: 'affidavit',   label: 'Affidavit',     placeholder: '25'  },
                    { key: 'i9',          label: 'I-9 Verification', placeholder: '45' },
                    { key: 'general',     label: 'General Notarial', placeholder: '15' },
                    { key: 'ron',         label: 'RON / Remote Online', placeholder: '75' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="flex items-center gap-4">
                      <span className="w-40 text-sm text-slate-300 shrink-0">{label}</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                        <input
                          type="number"
                          value={form.feeSchedule[key] ?? ''}
                          onChange={e => set('feeSchedule', { ...form.feeSchedule, [key]: parseFloat(e.target.value) || 0 })}
                          placeholder={placeholder}
                          className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">These are used as defaults when the Agent Runtime drafts invoices. Your state's published fee cap takes priority — the Verifier will flag any overages with a grounded citation.</p>
              </div>
            )}

            {/* STEP 5: PLAN */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Choose your plan</h1>
                  <p className="mt-1.5 text-sm text-slate-400">Start free, upgrade any time. All paid plans include a 14-day full trial.</p>
                </div>
                <div className="space-y-3">
                  {PLANS.map(plan => (
                    <button key={plan.id} onClick={() => set('selectedPlan', plan.id)}
                      className={`relative w-full rounded-xl border p-4 text-left transition-all ${
                        form.selectedPlan === plan.id ? plan.accent : 'border-white/8 bg-white/3 hover:border-white/15'
                      }`}>
                      {plan.badge && (
                        <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {plan.badge}
                        </span>
                      )}
                      <div className="flex items-start justify-between pr-16">
                        <div>
                          <p className="text-sm font-bold text-white">{plan.name}</p>
                          <p className="text-xs text-slate-400">{plan.tagline}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">{plan.price}</p>
                          <p className="text-[10px] text-slate-500">{plan.period}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                        {plan.features.slice(0, 3).map(f => (
                          <span key={f} className="flex items-center gap-1 text-[11px] text-slate-300">
                            <Check className="h-3 w-3 text-emerald-400 shrink-0" />{f}
                          </span>
                        ))}
                      </div>
                      {form.selectedPlan === plan.id && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: AGENT SETUP */}
            {step === 6 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Your closeout agent is now active.</h1>
                  <p className="mt-1.5 text-sm text-slate-400">
                    The Agent Runtime fires automatically after every completed appointment — Planner builds the plan, Tools execute it, Verifier attaches grounded citations. Everything lands in Command Center ready for your one-tap approval.
                  </p>
                </div>

                {/* Agent expectations */}
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/6 p-4 space-y-2.5">
                  {[
                    { icon: '🗺️', text: 'Planner maps your task into steps — journal, invoice, compliance — before anything runs' },
                    { icon: '📋', text: 'Drafts the journal entry with compliant per-act fields for your state' },
                    { icon: '🧾', text: 'Generates the invoice from your fee schedule, linked to the appointment' },
                    { icon: '🔬', text: 'Verifier checks compliance and attaches grounded citations — the exact policy record behind every decision' },
                    { icon: '✅', text: 'All drafts queue in Command Center for your one-tap approval, edit, or reject' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <span className="text-base leading-none mt-0.5">{icon}</span>
                      <p className="text-xs text-cyan-200 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>

                {/* Autonomy mode primer */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Choose your agent mode</p>
                  <div className="space-y-2">
                    {[
                      {
                        id: 'assistive',
                        label: 'Assistive',
                        desc: 'Drafts only — you review and submit everything manually.',
                        icon: '✏️',
                      },
                      {
                        id: 'supervised',
                        label: 'Supervised',
                        desc: 'Suggests actions and applies them after your one-tap approval.',
                        icon: '👁️',
                        recommended: true,
                      },
                      {
                        id: 'autonomous',
                        label: 'Autonomous',
                        desc: 'Auto-commits safe actions. You review exceptions only.',
                        icon: '⚡',
                      },
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => set('agentMode', mode.id)}
                        className={`relative w-full rounded-xl border p-3.5 text-left transition-all ${
                          form.agentMode === mode.id
                            ? 'border-cyan-500/50 bg-cyan-500/10'
                            : 'border-white/8 bg-white/3 hover:border-white/15'
                        }`}
                      >
                        {mode.recommended && (
                          <span className="absolute right-3 top-3 rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            Recommended
                          </span>
                        )}
                        <div className="flex items-start gap-3 pr-24">
                          <span className="text-base leading-none mt-0.5">{mode.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-white">{mode.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{mode.desc}</p>
                          </div>
                        </div>
                        {form.agentMode === mode.id && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">You can change this any time in Settings → Agent.</p>
                </div>
              </div>
            )}

            {/* STEP 7: LAUNCH */}
            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">You're ready to go.</h1>
                  <p className="mt-1.5 text-sm text-slate-400">Here's a summary of your setup:</p>
                </div>
                <div className="divide-y divide-white/8 rounded-2xl border border-white/10 bg-white/4 overflow-hidden">
                  {[
                    { label: 'Name',       val: form.name          || '—' },
                    { label: 'Business',   val: form.businessName  || '—' },
                    { label: 'Primary State', val: form.stateCode },
                    { label: 'Commissioned States', val: (form.commissionedStates || []).join(', ') || '—' },
                    { label: 'License',    val: form.licenseNumber || '—' },
                    { label: 'Notary Type', val: Array.isArray(form.notaryType) ? form.notaryType.join(', ') : form.notaryType },
                    { label: 'Autonomy Mode', val: form.autonomyMode.charAt(0).toUpperCase() + form.autonomyMode.slice(1) },
                    { label: 'Goal',       val: `$${Number(form.monthlyGoal).toLocaleString()}/mo` },
                    { label: 'Plan',       val: PLANS.find(p => p.id === form.selectedPlan)?.name || '—' },
                    { label: 'Agent Runtime', val: { assistive: 'Assistive — drafts only', supervised: 'Supervised — approve before commit', autonomous: 'Autonomous — auto-commit safe actions' }[form.agentMode] || '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{row.label}</span>
                      <span className="text-sm font-semibold text-white">{row.val}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <p className="text-xs text-emerald-300 leading-relaxed">
                    You can change anything in Settings at any time. Your first 30 days are fully unlocked — explore every feature.
                  </p>
                </div>

                <div className="space-y-3 rounded-xl border border-blue-500/25 bg-blue-500/10 p-4">
                  <p className="text-sm font-semibold text-blue-200">Your AI Agent Runtime is now active.</p>
                  <p className="text-xs text-blue-100/90 leading-relaxed">
                    Planner → Tools → Verifier runs automatically after each signing. Journal, invoice, and grounded compliance citations queue in Command Center for your approval. Feedback you give on edits improves confidence scoring over time.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Autonomy Mode</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { value: 'assistive', label: 'Assistive', desc: 'Drafts only' },
                      { value: 'supervised', label: 'Supervised', desc: 'Suggests actions, you review before commit' },
                      { value: 'autonomous', label: 'Autonomous', desc: 'Auto-commits safe actions' },
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('autonomyMode', value)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          form.autonomyMode === value
                            ? 'border-blue-400 bg-blue-500/15'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <p className="text-sm font-semibold text-white">{label}</p>
                        <p className="mt-1 text-xs text-slate-400">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── NAV BUTTONS ─────────────────────────────────────────────────── */}
          <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-white/8">
            {step > 0 ? (
              <button onClick={back}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button onClick={next} disabled={!canAdvance()}
                className="group flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:opacity-40 active:scale-[.98]">
                Continue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <button onClick={finish}
                className="group flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-[.98]">
                <Zap className="h-4 w-4" />
                Launch NotaryFix
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
