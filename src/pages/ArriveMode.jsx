/**
 * ArriveMode.jsx — On-site appointment workflow assistant
 * Route: /arrive/:id
 *
 * Sections:
 *   1. Pre-arrival checklist (type-aware)
 *   2. ID requirements (state-aware)
 *   3. Witness & document checklist (type-aware)
 *   4. Fee cap warning (state-aware)
 *   5. State-specific rules & reminders
 *   6. Quick actions: Start Mileage · Open Journal · Create Invoice
 *
 * Works for:  Loan Signing | General Notary Work | I-9 | Apostille | RON
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, BadgeCheck, BookOpen, Car,
  CheckCircle2, ChevronDown, ChevronUp, Circle, Clock,
  DollarSign, FileText, Fingerprint, Info, MapPin,
  Receipt, ShieldAlert, ShieldCheck, Star, User, Users,
} from 'lucide-react';
import { useData } from '../context/DataContext';

// ─── Colour palette helpers ──────────────────────────────────────────────────

const cls = (...args) => args.filter(Boolean).join(' ');

// ─── Per-type pre-arrival checklists ─────────────────────────────────────────

const CHECKLIST = {
  'Loan Signing': [
    { id: 'ls-1',  critical: true,  label: 'Confirm signer name matches lender package' },
    { id: 'ls-2',  critical: true,  label: 'All borrowers present and have valid photo ID' },
    { id: 'ls-3',  critical: true,  label: 'Entire package printed and page-counted' },
    { id: 'ls-4',  critical: true,  label: 'Notary seal, commission card, journal in bag' },
    { id: 'ls-5',  critical: false, label: 'Two or more blue-ink pens' },
    { id: 'ls-6',  critical: false, label: 'Signing surface cleared and well-lit' },
    { id: 'ls-7',  critical: false, label: 'Phone on silent / do-not-disturb' },
    { id: 'ls-8',  critical: false, label: 'Lender contact saved in case of questions' },
    { id: 'ls-9',  critical: false, label: 'Return shipping label ready (FedEx / UPS)' },
  ],
  'General Notary Work (GNW)': [
    { id: 'gnw-1', critical: true,  label: 'Signer has unexpired, government-issued photo ID' },
    { id: 'gnw-2', critical: true,  label: 'Document reviewed — no blank fields left' },
    { id: 'gnw-3', critical: true,  label: 'Correct act confirmed (Acknowledgment vs. Jurat)' },
    { id: 'gnw-4', critical: true,  label: 'Notary seal, journal, and commission card ready' },
    { id: 'gnw-5', critical: false, label: 'Fee amount agreed upon before starting' },
    { id: 'gnw-6', critical: false, label: 'Payment method confirmed (cash / Venmo / Zelle)' },
    { id: 'gnw-7', critical: false, label: 'Phone on silent' },
  ],
  'I-9 Verification': [
    { id: 'i9-1',  critical: true,  label: 'Employee has completed Section 1 before arrival' },
    { id: 'i9-2',  critical: true,  label: 'Acceptable List A or (List B + List C) docs are present' },
    { id: 'i9-3',  critical: true,  label: 'All documents are original — no photocopies' },
    { id: 'i9-4',  critical: true,  label: 'Documents are unexpired' },
    { id: 'i9-5',  critical: true,  label: 'Section 2 must be completed same day as document inspection' },
    { id: 'i9-6',  critical: false, label: 'Employer contact on hand if questions arise' },
    { id: 'i9-7',  critical: false, label: 'Completed form returned to employer — not retained by you' },
  ],
  'Apostille': [
    { id: 'ap-1',  critical: true,  label: 'Document is an original or certified copy — no photocopies' },
    { id: 'ap-2',  critical: true,  label: 'Issuing state confirmed and matches submission state' },
    { id: 'ap-3',  critical: true,  label: 'Secretary of State requirements reviewed for that state' },
    { id: 'ap-4',  critical: true,  label: 'Notary acknowledgment attached if required' },
    { id: 'ap-5',  critical: false, label: 'Correct fee confirmed with SOS office' },
    { id: 'ap-6',  critical: false, label: 'Turnaround time communicated to client' },
  ],
  'Remote Online Notary (RON)': [
    { id: 'ron-1', critical: true,  label: 'RON platform open and session link sent to signer' },
    { id: 'ron-2', critical: true,  label: 'Signer has completed identity proofing (KBA/biometric)' },
    { id: 'ron-3', critical: true,  label: 'Your state RON commission active and on file' },
    { id: 'ron-4', critical: true,  label: 'Audio/video recording will be enabled for the session' },
    { id: 'ron-5', critical: false, label: 'Documents uploaded to platform' },
    { id: 'ron-6', critical: false, label: 'Back-up phone/internet connection available' },
    { id: 'ron-7', critical: false, label: 'Quiet, professional background confirmed' },
  ],
};

const DEFAULT_CHECKLIST = CHECKLIST['General Notary Work (GNW)'];

// ─── Document checklists per type ─────────────────────────────────────────────

const DOCS_BY_TYPE = {
  'Loan Signing': [
    'Note / Promissory Note',
    'Deed of Trust / Mortgage',
    'Closing Disclosure',
    'Right to Cancel (RTC) — 3 copies if refinance',
    'Affidavit of Occupancy',
    'Signature / Name Affidavit',
    'Tax Authorization (4506-C)',
    'Any lender-specific addenda',
  ],
  'General Notary Work (GNW)': [
    'Primary document to be notarized',
    'Any attached exhibits',
    'Personal Acknowledgment or Jurat wording (if not pre-printed)',
  ],
  'I-9 Verification': [
    'Form I-9 (Section 1 pre-filled by employee)',
    'List A document  OR  List B + List C documents',
  ],
  'Apostille': [
    'Original document for apostille',
    'Notary certificate (if required)',
    'SOS cover sheet (if applicable)',
    'Payment / money order for SOS fees',
  ],
  'Remote Online Notary (RON)': [
    'RON session recording enabled',
    'Electronic certificate / digital seal ready',
    'Document uploaded to platform',
  ],
};

// ─── Witness requirements per type ───────────────────────────────────────────

const WITNESS_BY_TYPE = {
  'Loan Signing': {
    required: false,
    note: 'Witnesses are typically not required for standard loan signings unless the deed specifies it.',
    statesRequiring: ['FL', 'GA', 'SC', 'LA', 'VT', 'CT'],
  },
  'General Notary Work (GNW)': {
    required: false,
    note: 'Most GNW acts do not require witnesses, but Wills and some POAs may. Confirm per document.',
    statesRequiring: [],
  },
  'I-9 Verification': {
    required: false,
    note: 'No witnesses required for I-9 completion.',
    statesRequiring: [],
  },
  'Apostille': {
    required: false,
    note: 'Witnesses are not required for apostille certification.',
    statesRequiring: [],
  },
  'Remote Online Notary (RON)': {
    required: false,
    note: 'Some states require an electronic witness for RON sessions (e.g., FL, VA for wills). Confirm per document.',
    statesRequiring: ['FL', 'VA', 'TX', 'OH'],
  },
};

// ─── State fee caps (per notarial act / per signature) ───────────────────────
// Source: state statutes as of 2024. Always verify current rates.

const STATE_FEE_CAPS = {
  AL: { cap: 5,    note: 'Per signature — Code of Ala. §36-20-73' },
  AK: { cap: 15,   note: 'Per notarial act — AS 44.50.065' },
  AZ: { cap: 10,   note: 'Per act — ARS §41-326' },
  AR: { cap: 5,    note: 'Per signature — A.C.A. §21-6-309' },
  CA: { cap: 15,   note: 'Per signature — Cal. Gov. Code §8211' },
  CO: { cap: 10,   note: 'Per notarial act — CRS 24-21-519' },
  CT: { cap: 5,    note: 'Per signature — CGS §3-94b' },
  DE: { cap: 5,    note: 'Per signature — 29 Del. C. §4327' },
  FL: { cap: 10,   note: 'Per notarial act — F.S. §117.05(2)' },
  GA: { cap: 2,    note: 'Per signature — O.C.G.A. §45-17-11' },
  HI: { cap: 5,    note: 'Per signature — HRS §456-15' },
  ID: { cap: 5,    note: 'Per act — Idaho Code §51-115' },
  IL: { cap: 1,    note: 'Per signature — 5 ILCS 312/3-104' },
  IN: { cap: 10,   note: 'Per signature — IC 33-42-12-5' },
  IA: { cap: 5,    note: 'Per act — Iowa Code §9E.9' },
  KS: { cap: 2,    note: 'Per act — K.S.A. 53-511' },
  KY: { cap: 5,    note: 'Per act — KRS 423.050' },
  LA: { cap: 25,   note: 'Per act — R.S. 35:11' },
  ME: { cap: 6,    note: 'Per act — 4 M.R.S.A. §953' },
  MD: { cap: 4,    note: 'Per notarial act — Md. Code, State Gov't §18-107' },
  MA: { cap: 1.25, note: 'Per act — M.G.L. c.222 §28' },
  MI: { cap: 10,   note: 'Per act — MCL 55.299' },
  MN: { cap: 5,    note: 'Per act — Minn. Stat. §359.01' },
  MS: { cap: 5,    note: 'Per act — Miss. Code §25-33-19' },
  MO: { cap: 5,    note: 'Per act — RSMo §486.290' },
  MT: { cap: 10,   note: 'Per act — Mont. Code §1-5-621' },
  NE: { cap: 5,    note: 'Per act — Neb. Rev. Stat. §64-105.01' },
  NV: { cap: 15,   note: 'Per act — NRS 240.100' },
  NH: { cap: 10,   note: 'Per act — RSA 455:11' },
  NJ: { cap: 2.50, note: 'Per act — N.J.S.A. 52:7-20' },
  NM: { cap: 5,    note: 'Per act — NMSA §14-12A-18' },
  NY: { cap: 2,    note: 'Per act — N.Y. Exec. Law §137' },
  NC: { cap: 10,   note: 'Per act — NCGS §10B-31' },
  ND: { cap: 10,   note: 'Per act — N.D.C.C. §44-06.1-28' },
  OH: { cap: 5,    note: 'Per act — ORC 147.08' },
  OK: { cap: 5,    note: 'Per act — 49 O.S. §5' },
  OR: { cap: 10,   note: 'Per act — ORS 194.415' },
  PA: { cap: 5,    note: 'Per act — 57 Pa.C.S. §319' },
  RI: { cap: 2,    note: 'Per act — R.I. Gen. Laws §42-30.1-11' },
  SC: { cap: 5,    note: 'Per act — S.C. Code §26-1-120' },
  SD: { cap: 10,   note: 'Per act — SDCL §18-1-3' },
  TN: { cap: 5,    note: 'Per act — T.C.A. §8-16-119' },
  TX: { cap: 6,    note: 'Per act — Tex. Gov't Code §406.024' },
  UT: { cap: 10,   note: 'Per act — Utah Code §46-1-19' },
  VT: { cap: 5,    note: 'Per act — 26 V.S.A. §5718' },
  VA: { cap: 5,    note: 'Per act — Va. Code §47.1-19' },
  WA: { cap: 10,   note: 'Per act — RCW 42.44.090' },
  WV: { cap: 2,    note: 'Per act — W. Va. Code §39-4-14' },
  WI: { cap: 5,    note: 'Per act — Wis. Stat. §137.01(6)' },
  WY: { cap: 5,    note: 'Per act — Wyo. Stat. §34-26-117' },
  DC: { cap: 5,    note: 'Per act — D.C. Code §1-1201' },
};

// ─── ID requirements by state ────────────────────────────────────────────────

const ID_REQS = {
  CA: {
    acceptedForms: ["Driver's License", 'State ID', 'Passport', 'Passport Card', 'Military ID'],
    mustBeUnexpired: true,
    biometricRequired: false,
    notes: 'California requires ID be current or issued within the past 5 years if expired.',
    credWitnessAllowed: true,
  },
  TX: {
    acceptedForms: ["Driver's License", 'State ID', 'Passport', 'Military ID'],
    mustBeUnexpired: true,
    biometricRequired: false,
    notes: 'ID must not be expired. Credible witnesses allowed if signer lacks ID.',
    credWitnessAllowed: true,
  },
  FL: {
    acceptedForms: ["Driver's License", 'State ID', 'Passport', 'Passport Card', 'Military ID'],
    mustBeUnexpired: true,
    biometricRequired: false,
    notes: 'For loan signings, lender packages often specify additional ID requirements.',
    credWitnessAllowed: true,
  },
  WA: {
    acceptedForms: ["Driver's License", 'State ID', 'Passport', 'Tribal Card', 'Military ID'],
    mustBeUnexpired: true,
    biometricRequired: false,
    notes: 'WA does not recognize credible witnesses. ID must be unexpired.',
    credWitnessAllowed: false,
  },
  NY: {
    acceptedForms: ["Driver's License", 'State ID', 'Passport'],
    mustBeUnexpired: true,
    biometricRequired: false,
    notes: 'NY does not specify a list by statute — notary uses reasonable judgment.',
    credWitnessAllowed: false,
  },
  OR: {
    acceptedForms: ["Driver's License", 'State ID', 'Passport', 'Military ID'],
    mustBeUnexpired: true,
    biometricRequired: false,
    notes: 'Thumbprint required for deeds and POAs.',
    credWitnessAllowed: true,
  },
};

const DEFAULT_ID_REQS = {
  acceptedForms: ["Driver's License", 'State ID', 'Passport', 'Military ID'],
  mustBeUnexpired: true,
  biometricRequired: false,
  notes: 'Verify your state statute for complete accepted ID list.',
  credWitnessAllowed: false,
};

// ─── State-specific notary rules ─────────────────────────────────────────────

const STATE_RULES = {
  CA: [
    '📌 Thumbprint required in journal for deeds, POAs, and quitclaims.',
    '📌 Sequential journal required — every act logged in order.',
    '📌 Never notarize a document without a complete venue clause.',
    '📌 You may not certify copies of recordable docs.',
  ],
  TX: [
    '📌 Journal is optional but highly recommended.',
    '📌 Do not notarize your own signature or that of a relative with interest.',
    '📌 Acknowledgment and Jurat certificates must use Texas-approved wording.',
  ],
  FL: [
    '📌 Two witnesses required on deeds and wills.',
    '📌 Journal recommended but not required by statute.',
    '📌 RON sessions must be recorded for 10 years.',
  ],
  WA: [
    '📌 Journal not required by statute but recommended.',
    '📌 No credible witness rule — signer must present ID.',
    '📌 Venue must include county where notarization took place.',
  ],
  OR: [
    '📌 Thumbprint required in journal for conveyances and POAs.',
    '📌 Must refuse if document has blank spaces.',
    '📌 Do not perform an act if you have financial interest in the transaction.',
  ],
  NY: [
    '📌 Journal not required, but keep personal records.',
    '📌 Certificate of authority required if notarizing outside your county.',
    '📌 Cannot charge more than $2 per act by statute.',
  ],
};

// ─── Thumbprint-required acts (by state) ────────────────────────────────────

const THUMBPRINT_STATES = {
  CA: ['Deed', 'Grant Deed', 'Quitclaim Deed', 'Deed of Trust', 'Power of Attorney'],
  OR: ['Deed of Trust', 'Power of Attorney', 'Real Property Conveyance'],
  CO: ['Deed of Trust', 'Mortgage'],
};

// ─── Section accordion component ─────────────────────────────────────────────

function Section({ id, title, icon: Icon, badge, badgeColor = 'bg-blue-100 text-blue-700', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </span>
        <span className="flex-1 font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</span>
        {badge && (
          <span className={cls('text-[10px] font-bold px-2 py-0.5 rounded-full', badgeColor)}>{badge}</span>
        )}
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">{children}</div>}
    </div>
  );
}

// ─── Check row component ──────────────────────────────────────────────────────

function CheckRow({ id, label, critical, checked, onToggle }) {
  return (
    <button
      onClick={() => onToggle(id)}
      className={cls(
        'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all border',
        checked
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
          : critical
          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
          : 'bg-slate-50 dark:bg-slate-700/40 border-transparent hover:border-slate-200 dark:hover:border-slate-600',
      )}
    >
      <span className="flex-shrink-0 mt-0.5">
        {checked ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Circle className={cls('w-5 h-5', critical ? 'text-amber-500' : 'text-slate-300 dark:text-slate-500')} />
        )}
      </span>
      <span className="flex-1">
        <span className={cls('text-sm font-medium', checked ? 'line-through text-slate-400' : critical ? 'text-amber-800 dark:text-amber-300' : 'text-slate-700 dark:text-slate-200')}>
          {label}
        </span>
        {critical && !checked && (
          <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mt-0.5">Required</span>
        )}
      </span>
    </button>
  );
}

// ─── Quick action button ──────────────────────────────────────────────────────

function ActionBtn({ icon: Icon, label, sublabel, color, done, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cls(
        'flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all',
        done
          ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700'
          : `border-dashed border-slate-200 dark:border-slate-600 hover:border-${color}-300 hover:bg-${color}-50 dark:hover:bg-${color}-900/10`,
      )}
    >
      <span className={cls('w-10 h-10 rounded-xl flex items-center justify-center', done ? 'bg-emerald-100 dark:bg-emerald-800' : `bg-${color}-100 dark:bg-${color}-900/30`)}>
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Icon className={cls('w-5 h-5', `text-${color}-600 dark:text-${color}-400`)} />
        )}
      </span>
      <span className={cls('text-xs font-semibold text-center leading-tight', done ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200')}>
        {done ? '✓ Done' : label}
      </span>
      {sublabel && !done && (
        <span className="text-[10px] text-slate-400 text-center leading-tight">{sublabel}</span>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ArriveMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useData();

  // Resolve appointment
  const appt = useMemo(
    () => data.appointments?.find((a) => String(a.id) === String(id)),
    [data.appointments, id],
  );

  // Notary state code
  const stateCode = data.settings?.currentStateCode || 'WA';

  // Checklist state — keyed by item id
  const checklistItems = useMemo(
    () => CHECKLIST[appt?.type] || DEFAULT_CHECKLIST,
    [appt?.type],
  );
  const [checks, setChecks] = useState({});
  const toggleCheck = (itemId) => setChecks((prev) => ({ ...prev, [itemId]: !prev[itemId] }));

  // Doc checklist state
  const docItems = useMemo(
    () => DOCS_BY_TYPE[appt?.type] || DOCS_BY_TYPE['General Notary Work (GNW)'],
    [appt?.type],
  );
  const [docChecks, setDocChecks] = useState({});
  const toggleDoc = (key) => setDocChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  // Quick action state
  const [mileageStarted, setMileageStarted] = useState(false);
  const [journalOpened, setJournalOpened] = useState(false);
  const [invoiceCreated, setInvoiceCreated] = useState(false);

  // Progress calculation
  const criticalItems = checklistItems.filter((i) => i.critical);
  const criticalDone = criticalItems.filter((i) => checks[i.id]).length;
  const allDone = checklistItems.filter((i) => checks[i.id]).length;
  const progressPct = checklistItems.length > 0 ? Math.round((allDone / checklistItems.length) * 100) : 0;
  const criticalAllDone = criticalDone === criticalItems.length;

  // State-specific data
  const feeInfo = STATE_FEE_CAPS[stateCode];
  const idReqs = ID_REQS[stateCode] || DEFAULT_ID_REQS;
  const stateRules = STATE_RULES[stateCode] || [];
  const witnessInfo = WITNESS_BY_TYPE[appt?.type] || WITNESS_BY_TYPE['General Notary Work (GNW)'];
  const witnessWarning = witnessInfo.statesRequiring.includes(stateCode);
  const thumbprintActs = THUMBPRINT_STATES[stateCode] || [];

  // Fee overage check
  const apptFee = parseFloat(appt?.amount) || 0;
  const feeCapNum = feeInfo ? parseFloat(feeInfo.cap) : null;
  const feeExceedsCap = feeCapNum !== null && apptFee > feeCapNum * 10; // rough "per signing" threshold
  // (Actual fee cap is per-act not per-appointment; we flag as advisory only)

  if (!appt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <ShieldAlert className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500 text-center">Appointment not found.<br />It may have been deleted.</p>
        <button
          onClick={() => navigate('/schedule')}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to Schedule
        </button>
      </div>
    );
  }

  const typeLabel = appt.type || 'Notary Signing';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-32">

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/schedule')}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Arrive Mode</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium truncate">
                  {typeLabel}
                </span>
              </div>
              <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">{appt.client}</h1>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appt.time}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{appt.location || 'TBD'}</span>
                {appt.amount > 0 && (
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${appt.amount}</span>
                )}
              </div>
            </div>
            {/* Progress ring */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className={cls(
                'w-12 h-12 rounded-full flex items-center justify-center border-4 text-sm font-bold',
                progressPct === 100
                  ? 'border-emerald-400 text-emerald-600 dark:text-emerald-400'
                  : criticalAllDone
                  ? 'border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-amber-400 text-amber-600 dark:text-amber-400',
              )}>
                {progressPct}%
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">ready</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cls(
                'h-full rounded-full transition-all duration-500',
                progressPct === 100 ? 'bg-emerald-500' : criticalAllDone ? 'bg-blue-500' : 'bg-amber-500',
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Alert banners ────────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-2">
        {witnessWarning && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Users className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Witness Required — {stateCode}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{witnessInfo.note}</p>
            </div>
          </div>
        )}
        {thumbprintActs.length > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <Fingerprint className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">Thumbprint Required — {stateCode}</p>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                Required in your journal for: {thumbprintActs.join(', ')}.
              </p>
            </div>
          </div>
        )}
        {feeExceedsCap && feeInfo && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Fee Cap Advisory — {stateCode}</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                {stateCode} caps notarial acts at <strong>${feeInfo.cap}/act</strong>. ({feeInfo.note})
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">

        {/* 1. Pre-arrival checklist */}
        <Section
          id="checklist"
          title="Pre-Arrival Checklist"
          icon={BadgeCheck}
          badge={`${allDone}/${checklistItems.length}`}
          badgeColor={criticalAllDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}
          defaultOpen
        >
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <CheckRow
                key={item.id}
                {...item}
                checked={!!checks[item.id]}
                onToggle={toggleCheck}
              />
            ))}
          </div>
          {!criticalAllDone && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {criticalItems.length - criticalDone} required item{criticalItems.length - criticalDone !== 1 ? 's' : ''} remaining before you're fully ready.
            </p>
          )}
          {criticalAllDone && (
            <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              All required items checked — you're cleared to proceed.
            </p>
          )}
        </Section>

        {/* 2. ID requirements */}
        <Section
          id="id"
          title={`ID Requirements — ${stateCode}`}
          icon={User}
          badge="ID"
          badgeColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Accepted Forms of ID</p>
              <div className="flex flex-wrap gap-2">
                {idReqs.acceptedForms.map((form) => (
                  <span key={form} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 font-medium">
                    {form}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40">
              <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300">{idReqs.notes}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className={cls('p-3 rounded-xl text-center', idReqs.mustBeUnexpired ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-700/40')}>
                <ShieldCheck className={cls('w-5 h-5 mx-auto mb-1', idReqs.mustBeUnexpired ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Unexpired Only</p>
                <p className="text-[10px] text-slate-500">{idReqs.mustBeUnexpired ? 'Required' : 'Not required'}</p>
              </div>
              <div className={cls('p-3 rounded-xl text-center', idReqs.credWitnessAllowed ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-700/40')}>
                <Users className={cls('w-5 h-5 mx-auto mb-1', idReqs.credWitnessAllowed ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')} />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Cred. Witness</p>
                <p className="text-[10px] text-slate-500">{idReqs.credWitnessAllowed ? 'Allowed' : 'Not allowed'}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 3. Document checklist */}
        <Section
          id="docs"
          title="Document Checklist"
          icon={FileText}
          badge={`${Object.values(docChecks).filter(Boolean).length}/${docItems.length}`}
          badgeColor="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
        >
          <div className="space-y-2">
            {docItems.map((doc, i) => {
              const key = `doc-${i}`;
              const checked = !!docChecks[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleDoc(key)}
                  className={cls(
                    'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border',
                    checked
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-700/40 border-transparent hover:border-slate-200 dark:hover:border-slate-600',
                  )}
                >
                  {checked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-500 flex-shrink-0" />
                  )}
                  <span className={cls('text-sm', checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200')}>
                    {doc}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 4. Fee cap */}
        <Section
          id="fee"
          title={`Fee Cap — ${stateCode}`}
          icon={DollarSign}
          badge={feeInfo ? `$${feeInfo.cap}/act` : 'Check statute'}
          badgeColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        >
          {feeInfo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">${feeInfo.cap}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Maximum per notarial act</p>
                </div>
                <ShieldCheck className="w-8 h-8 text-green-400 dark:text-green-600" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feeInfo.note}</p>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This cap applies <strong>per notarial act</strong>, not per appointment. A loan signing may include many acts. Travel/print fees may be charged separately where allowed.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No fee cap data found for <strong>{stateCode}</strong>. Verify with your state's notary statute.
            </p>
          )}
        </Section>

        {/* 5. State rules */}
        {stateRules.length > 0 && (
          <Section
            id="rules"
            title={`${stateCode} Notary Rules`}
            icon={ShieldAlert}
            badge={`${stateRules.length} reminders`}
            badgeColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          >
            <div className="space-y-2">
              {stateRules.map((rule, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900">
                  <p className="text-sm text-purple-800 dark:text-purple-300">{rule}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 6. Quick actions */}
        <Section
          id="actions"
          title="Quick Actions"
          icon={Star}
          defaultOpen
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Tap to launch each step — check them off as you go.</p>
          <div className="flex gap-2">
            <ActionBtn
              icon={Car}
              label="Start Mileage"
              sublabel="Log this trip"
              color="blue"
              done={mileageStarted}
              onClick={() => {
                setMileageStarted(true);
                navigate('/mileage', {
                  state: {
                    autoStartTrip: true,
                    linkedAppointmentId: appt.id,
                    destination: appt.location,
                    purpose: `${appt.type} — ${appt.client}`,
                  },
                });
              }}
            />
            <ActionBtn
              icon={BookOpen}
              label="Open Journal"
              sublabel="Log this act"
              color="indigo"
              done={journalOpened}
              onClick={() => {
                setJournalOpened(true);
                navigate('/journal', {
                  state: {
                    prefillAppointmentId: appt.id,
                    prefillClient: appt.client,
                    prefillActType: appt.type === 'Loan Signing' ? 'Acknowledgment' : '',
                  },
                });
              }}
            />
            <ActionBtn
              icon={Receipt}
              label="Invoice"
              sublabel="Close out job"
              color="emerald"
              done={invoiceCreated}
              onClick={() => {
                setInvoiceCreated(true);
                navigate('/invoices', {
                  state: {
                    prefillClient: appt.client,
                    prefillAmount: appt.amount,
                    prefillDate: appt.date,
                    prefillDescription: `${appt.type} — ${appt.date}`,
                  },
                });
              }}
            />
          </div>
        </Section>

        {/* Notes block */}
        {appt.notes && (
          <div className="px-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Appointment Notes</p>
            <p className="text-sm text-blue-800 dark:text-blue-200">{appt.notes}</p>
          </div>
        )}
      </div>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => navigate('/schedule')}
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            ← Schedule
          </button>
          <button
            disabled={!criticalAllDone}
            className={cls(
              'flex-[2] py-3 rounded-2xl text-white text-sm font-bold transition-all',
              criticalAllDone
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-emerald-900'
                : 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed',
            )}
            onClick={() => {
              // Mark appointment as in-progress / arrived
              // Navigate to journal to start logging
              navigate('/journal', {
                state: { prefillAppointmentId: appt.id, prefillClient: appt.client },
              });
            }}
          >
            {criticalAllDone ? "✓ I'm Ready — Open Journal" : `Complete ${criticalItems.length - criticalDone} required item${criticalItems.length - criticalDone !== 1 ? 's' : ''} first`}
          </button>
        </div>
      </div>
    </div>
  );
}
