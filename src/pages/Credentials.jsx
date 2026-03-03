import React, { useState, useEffect, useMemo } from 'react';
import {
  BadgeCheck, ShieldCheck, AlertTriangle, CheckCircle2, Clock,
  Save, RotateCcw, FileText, MapPin, Calendar, Stamp, Star,
  Info, ChevronRight, ExternalLink, Lock, Unlock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '../components/UI';
import { useData } from '../context/DataContext';
import { toast } from '../hooks/useLinker';

const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const NOTARY_TYPES = ['Traditional', 'Electronic', 'RON (Remote Online)'];

const DAYS_UNTIL = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

const ExpiryBadge = ({ days }) => {
  if (days === null) return <span className="text-xs text-slate-400">Not set</span>;
  if (days < 0)
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle className="h-3 w-3" /> Expired</span>;
  if (days <= 30)
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="h-3 w-3" /> {days}d left</span>;
  if (days <= 90)
    return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3" /> {days}d left</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" /> {days}d left</span>;
};

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    </div>
    <div>
      <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  </div>
);

export default function Credentials() {
  const { data, updateSettings } = useData();
  const [form, setForm] = useState({ ...data.settings });
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setForm({ ...data.settings });
  }, [data.settings]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    updateSettings(form);
    setSavedFlash(true);
    toast.success('Credentials saved');
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleReset = () => {
    setForm({ ...data.settings });
    toast.success('Changes discarded');
  };

  const commissionDays = DAYS_UNTIL(form.commissionExpiryDate);
  const eandoDays = DAYS_UNTIL(form.eAndOExpiresOn);

  const completeness = useMemo(() => {
    const checks = [
      form.licenseNumber,
      form.commissionExpiryDate,
      form.eAndOExpiresOn,
      form.notaryType,
      form.currentStateCode,
      (form.commissionedStates || []).length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const statusColor =
    completeness === 100 ? 'text-emerald-600 dark:text-emerald-400' :
    completeness >= 60  ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400';

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 mx-auto max-w-[1100px] space-y-6 pb-24">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BadgeCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Credentials
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your notary commission, license, E&amp;O insurance, and state authorizations.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Button variant="secondary" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> {savedFlash ? 'Saved ✓' : 'Save Credentials'}
          </Button>
        </div>
      </div>

      {/* ── Completeness Banner ──────────────────────────────────────────── */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-blue-200 dark:border-blue-800">
                <span className={`text-sm font-black ${statusColor}`}>{completeness}%</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Credential Profile Completeness</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {completeness === 100
                    ? 'All credential fields are filled in — your profile is complete.'
                    : 'Fill in all fields below to complete your credential profile.'}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Commission:
                <ExpiryBadge days={commissionDays} />
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-400" /> E&amp;O:
                <ExpiryBadge days={eandoDays} />
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${completeness === 100 ? 'bg-emerald-500' : completeness >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Commission & License ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={Stamp}
            title="Commission & License"
            subtitle="Your official notary commission number and expiration date."
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Notary License / Commission Number</Label>
              <Input
                value={form.licenseNumber || ''}
                onChange={(e) => set('licenseNumber', e.target.value)}
                placeholder="e.g. OH-2024-098765"
              />
              <p className="mt-1 text-xs text-slate-400">This number appears on compliance records and client documents.</p>
            </div>
            <div>
              <Label>Commission Expiry Date</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={form.commissionExpiryDate || ''}
                  onChange={(e) => set('commissionExpiryDate', e.target.value)}
                  className="flex-1"
                />
                <ExpiryBadge days={commissionDays} />
              </div>
              {commissionDays !== null && commissionDays <= 60 && commissionDays >= 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Commission renews soon — schedule your renewal.
                </p>
              )}
              {commissionDays !== null && commissionDays < 0 && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Commission has expired. Update immediately.
                </p>
              )}
            </div>
            <div>
              <Label>Notary Type</Label>
              <select
                value={form.notaryType || 'Traditional'}
                onChange={(e) => set('notaryType', e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NOTARY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-400">Determines which compliance workflows and act types are available.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── E&O Insurance ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={ShieldCheck}
            title="Errors & Omissions Insurance"
            subtitle="Track your E&O policy expiration to stay covered and compliant."
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>E&amp;O Policy Expiry Date</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={form.eAndOExpiresOn || ''}
                  onChange={(e) => set('eAndOExpiresOn', e.target.value)}
                  className="flex-1"
                />
                <ExpiryBadge days={eandoDays} />
              </div>
              {eandoDays !== null && eandoDays <= 60 && eandoDays >= 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> E&amp;O policy renews soon — contact your insurer.
                </p>
              )}
              {eandoDays !== null && eandoDays < 0 && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> E&amp;O policy has lapsed. Renew immediately.
                </p>
              )}
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Most title companies and signing services require active E&amp;O coverage of at least $25,000 per occurrence. Keep your policy current to avoid assignment rejections.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── State Authorizations ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={MapPin}
            title="State Authorizations"
            subtitle="Your primary operating state and all commissioned states."
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Primary Operating State</Label>
              <select
                value={form.currentStateCode || ''}
                onChange={(e) => set('currentStateCode', e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select state</option>
                {US_STATE_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-400">Drives fee caps, journal requirements, and compliance defaults.</p>
            </div>
            <div>
              <Label>Weekly Compliance Review Day</Label>
              <select
                value={form.complianceReviewDay || 'Monday'}
                onChange={(e) => set('complianceReviewDay', e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">The agent surfaces compliance reminders on this day each week.</p>
            </div>
          </div>

          {/* Commissioned states multi-select */}
          <div className="mt-5">
            <Label>Commissioned States</Label>
            <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              {/* Selected chips */}
              <div className="mb-3 flex flex-wrap gap-2 min-h-[28px]">
                {(form.commissionedStates || []).length === 0 && (
                  <span className="text-xs text-slate-400">No states selected</span>
                )}
                {(form.commissionedStates || []).map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {code}
                    <button
                      type="button"
                      onClick={() => {
                        const next = (form.commissionedStates || []).filter((c) => c !== code);
                        set('commissionedStates', next);
                      }}
                      className="ml-0.5 text-blue-400 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {/* State grid */}
              <div className="grid max-h-40 grid-cols-6 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-8 md:grid-cols-10">
                {US_STATE_CODES.map((code) => {
                  const active = (form.commissionedStates || []).includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        const s = new Set(form.commissionedStates || []);
                        if (active) s.delete(code); else s.add(code);
                        const next = Array.from(s);
                        set('commissionedStates', next);
                        if (!next.includes(form.currentStateCode)) {
                          set('currentStateCode', next[0] || form.currentStateCode);
                        }
                      }}
                      className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Select all states where you hold an active commission. Multi-state commissions are tracked separately.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Fee Schedule ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={FileText}
            title="Fee Schedule"
            subtitle="Your standard per-act fees. Used for invoice generation and compliance checks."
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {[
              { key: 'loanSigning',  label: 'Loan Signing',     placeholder: '150' },
              { key: 'deed',         label: 'Deed / Real Prop.', placeholder: '50'  },
              { key: 'affidavit',    label: 'Affidavit / Jurat', placeholder: '25'  },
              { key: 'i9',           label: 'I-9 Verification',  placeholder: '45'  },
              { key: 'general',      label: 'General Notarial',  placeholder: '15'  },
              { key: 'ron',          label: 'RON Session',       placeholder: '75'  },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.feeSchedule?.[key] ?? ''}
                    onChange={(e) =>
                      set('feeSchedule', { ...(form.feeSchedule || {}), [key]: parseFloat(e.target.value) || 0 })
                    }
                    placeholder={placeholder}
                    className="pl-7"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Fees are pre-filled on invoices. State fee caps are enforced automatically during compliance checks.
          </p>
        </CardContent>
      </Card>

      {/* ── Save footer ──────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pb-4">
        <Button variant="secondary" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset Changes
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" /> {savedFlash ? 'Saved ✓' : 'Save Credentials'}
        </Button>
      </div>
    </div>
  );
}
