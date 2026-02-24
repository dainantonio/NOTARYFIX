import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, AlertOctagon, Info, ShieldAlert,
  ChevronDown, ChevronRight, CheckCircle2,
} from 'lucide-react';
import { useData } from '../context/DataContext';

// ─── Static thumbprint act-type fallback ──────────────────────────────────────
const STATIC_THUMB_ACTS = {
  CA: ['Deed of Trust', 'Grant Deed', 'Quitclaim Deed', 'Trust Deed', 'Power of Attorney'],
  FL: ['Deed', 'Will', 'Trust', 'Mortgage'],
  TX: ['Real Property', 'Deed', 'Deed of Trust'],
  NY: ['Real Property Deed', 'Mortgage'],
  IL: ['Real Estate', 'Deed'],
  NV: ['Deed', 'Power of Attorney'],
  AZ: ['Deed', 'Trust Deed'],
  WA: ['Deed of Trust', 'Real Property'],
  CO: ['Deed of Trust', 'Real Property'],
  GA: ['Deed', 'Real Estate'],
};

// ─── Full state name lookup ────────────────────────────────────────────────────
const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'Washington D.C.',
};

// ─── Confidence scoring ────────────────────────────────────────────────────────
function computeConfidence(updatedAt, publishedAt) {
  const ref = updatedAt || publishedAt;
  if (!ref) return { score: 0.60, label: 'Medium', fromDataset: false };
  const daysSince = (Date.now() - new Date(ref).getTime()) / 86400000;
  const score = daysSince > 730 ? 0.60 : daysSince > 365 ? 0.75 : 0.90;
  const label = score >= 0.85 ? 'High' : score >= 0.60 ? 'Medium' : 'Low';
  return { score, label, fromDataset: true };
}

function staticConfidence() {
  return { score: 0.60, label: 'Medium', fromDataset: false };
}

// ─── Severity style map ────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    Icon: AlertOctagon,
    label: 'Critical',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    Icon: AlertTriangle,
    label: 'Warning',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    Icon: Info,
    label: 'Info',
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────
function ConfidencePill({ score, label }) {
  const dot =
    score >= 0.85
      ? 'bg-emerald-400'
      : score >= 0.60
      ? 'bg-amber-400'
      : 'bg-red-400';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function ConfidenceBar({ score }) {
  const pct = Math.round(score * 100);
  const fill =
    score >= 0.85
      ? 'bg-emerald-500'
      : score >= 0.60
      ? 'bg-amber-500'
      : 'bg-red-500';
  return (
    <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RuleCard({ rule }) {
  const [expanded, setExpanded] = useState(false);
  const styles = SEVERITY_STYLES[rule.severity] || SEVERITY_STYLES.info;
  const { Icon } = styles;

  return (
    <div className={`rounded-lg border p-3 ${styles.bg} ${styles.border}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${styles.text}`} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-xs font-semibold uppercase tracking-wide ${styles.text}`}>
                {rule.title}
              </span>
              <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${styles.badge}`}>
                {styles.label}
              </span>
            </div>
            <p className={`mt-1 text-xs leading-snug ${styles.text}`}>{rule.body}</p>
          </div>
        </div>
        {/* Confidence column */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <ConfidencePill score={rule.confidence.score} label={rule.confidence.label} />
          <ConfidenceBar score={rule.confidence.score} />
        </div>
      </div>

      {/* Source note */}
      {rule.sourceNote && (
        <p className="mt-1.5 pl-6 text-[10px] text-slate-400 dark:text-slate-500">
          📋 {rule.sourceNote}
        </p>
      )}

      {/* Expandable debug */}
      <div className="mt-2 pl-6">
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {expanded
            ? <ChevronDown className="h-3 w-3" />
            : <ChevronRight className="h-3 w-3" />
          }
          Why this appeared
        </button>
        {expanded && (
          <div className="mt-1.5 rounded bg-white/60 dark:bg-slate-800/60 px-2 py-1.5 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
            <div>State: {rule.debug.stateCode} &middot; Act type: {rule.debug.actType}</div>
            <div>Triggered by: {rule.debug.trigger}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
/**
 * ComplianceAdvisor
 * @param {string}        stateCode  — two-letter state code, e.g. "CA"
 * @param {string}        actType    — notarial act type, e.g. "Acknowledgment"
 * @param {number|string} fee        — optional; enables fee-cap check
 * @param {"journal"|"arrive"} context — rendering context (default "journal")
 * @param {string}        className  — extra Tailwind classes for the wrapper
 */
const ComplianceAdvisor = ({
  stateCode,
  actType,
  fee,
  context = 'journal',
  className = '',
}) => {
  const { data } = useData();
  const [minimized, setMinimized] = useState(false);

  const rules = useMemo(() => {
    if (!stateCode || !actType) return [];

    const stateRules   = Array.isArray(data?.stateRules)   ? data.stateRules   : [];
    const feeSchedules = Array.isArray(data?.feeSchedules) ? data.feeSchedules : [];
    const idReqsList   = Array.isArray(data?.idRequirements) ? data.idRequirements : [];

    const policy = stateRules.find(
      r => r.stateCode === stateCode && r.status !== 'archived'
    ) || null;

    const idReq = idReqsList.find(r => r.stateCode === stateCode) || null;
    const stateName = STATE_NAMES[stateCode] || stateCode;
    const result = [];

    // ── Rule 1: Thumbprint Required ──────────────────────────────────────────
    const staticThumb = !!(STATIC_THUMB_ACTS[stateCode]?.includes(actType));
    const policyThumb = policy?.thumbprintRequired === true;
    if (policyThumb || staticThumb) {
      const conf = policy
        ? computeConfidence(policy.updatedAt, policy.publishedAt)
        : staticConfidence();
      const sourceNote = conf.fromDataset
        ? `Admin dataset · Updated ${new Date(policy.updatedAt || policy.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : 'Built-in rule — verify with your state authority';
      result.push({
        id: 'thumbprint',
        severity: 'critical',
        title: 'Thumbprint Required',
        body: `${stateName} requires a thumbprint for ${actType} acts. Obtain before completing.`,
        confidence: conf,
        sourceNote,
        debug: {
          stateCode,
          actType,
          trigger: policyThumb
            ? 'policy.thumbprintRequired = true'
            : `STATIC_THUMB_ACTS[${stateCode}] includes "${actType}"`,
        },
      });
    }

    // ── Rule 2: Fee Cap ──────────────────────────────────────────────────────
    const feeEntry =
      feeSchedules.find(f => f.stateCode === stateCode && f.actType === actType) ||
      feeSchedules.find(f => f.stateCode === stateCode) ||
      null;
    const cap = feeEntry != null ? feeEntry.maxFee : (policy?.maxFeePerAct ?? null);
    if (cap != null) {
      const feeNum = parseFloat(fee);
      const feeExceeds = !isNaN(feeNum) && feeNum > parseFloat(cap);
      const conf = feeEntry
        ? computeConfidence(feeEntry.updatedAt, feeEntry.effectiveDate)
        : policy
        ? computeConfidence(policy.updatedAt, policy.publishedAt)
        : staticConfidence();
      result.push({
        id: 'fee-cap',
        severity: feeExceeds ? 'critical' : 'info',
        title: 'Statutory Fee Cap',
        body: `Maximum for ${actType} in ${stateName}: $${cap}. ${
          feeExceeds
            ? 'Your entered fee EXCEEDS this limit.'
            : 'Your fee is within limits.'
        }`,
        confidence: conf,
        sourceNote: conf.fromDataset
          ? 'Admin dataset · Fee schedule'
          : 'Built-in rule — verify with your state authority',
        debug: {
          stateCode,
          actType,
          trigger: feeEntry
            ? `feeSchedules match stateCode=${stateCode} actType=${actType} maxFee=${cap}`
            : `policy.maxFeePerAct = ${cap}`,
        },
      });
    }

    // ── Rule 3: Witness Requirements ─────────────────────────────────────────
    if (policy?.witnessRequirements) {
      const raw = policy.witnessRequirements;
      const body = raw.length > 250 ? raw.slice(0, 250) + '\u2026' : raw;
      const conf = computeConfidence(policy.updatedAt, policy.publishedAt);
      result.push({
        id: 'witness',
        severity: 'warning',
        title: 'Witness Requirements',
        body,
        confidence: conf,
        sourceNote: conf.fromDataset
          ? `Admin dataset · Updated ${new Date(policy.updatedAt || policy.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'Built-in rule — verify with your state authority',
        debug: {
          stateCode,
          actType,
          trigger: 'policy.witnessRequirements is non-empty',
        },
      });
    }

    // ── Rule 4: Accepted IDs ─────────────────────────────────────────────────
    if (idReq?.acceptedIdTypes?.length) {
      const conf = computeConfidence(idReq.updatedAt, null);
      const extras = [];
      if (idReq.expirationRequired)    extras.push('expiration required');
      if (idReq.credibleWitnessAllowed) extras.push('credible witness allowed');
      const extraStr = extras.length ? ` (${extras.join(', ')})` : '';
      result.push({
        id: 'accepted-ids',
        severity: 'info',
        title: 'Accepted ID Types',
        body: `${idReq.acceptedIdTypes.join(', ')}${extraStr}.`,
        confidence: conf,
        sourceNote: 'Admin dataset · ID requirements',
        debug: {
          stateCode,
          actType,
          trigger: `idRequirements record found for stateCode=${stateCode}`,
        },
      });
    }

    // ── Rule 5: Special Act Caveats ──────────────────────────────────────────
    const caveats = policy?.specialActCaveats || policy?.notes || '';
    if (caveats) {
      const body = caveats.length > 250 ? caveats.slice(0, 250) + '\u2026' : caveats;
      const conf = computeConfidence(policy.updatedAt, policy.publishedAt);
      result.push({
        id: 'caveats',
        severity: 'warning',
        title: 'Special Act Caveats',
        body,
        confidence: conf,
        sourceNote: `Admin dataset · Policy v${policy.version || '\u2014'}`,
        debug: {
          stateCode,
          actType,
          trigger: 'policy.specialActCaveats or policy.notes is non-empty',
        },
      });
    }

    // ── Rule 6: RON Status ───────────────────────────────────────────────────
    const isRemote = /remote|ron|electronic/i.test(actType);
    if (isRemote && policy) {
      const conf = computeConfidence(policy.updatedAt, policy.publishedAt);
      result.push({
        id: 'ron',
        severity: 'info',
        title: 'Remote Notarization Status',
        body: `RON is ${policy.ronPermitted ? 'permitted' : 'not permitted'} in ${stateName}. Statute: ${policy.ronStatute || '\u2014'}`,
        confidence: conf,
        sourceNote: conf.fromDataset
          ? `Admin dataset · Updated ${new Date(policy.updatedAt || policy.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'Built-in rule — verify with your state authority',
        debug: {
          stateCode,
          actType,
          trigger: `actType matches /remote|ron|electronic/i · policy.ronPermitted = ${policy.ronPermitted}`,
        },
      });
    }

    return result;
  }, [stateCode, actType, fee, data]);

  // Return nothing when there is nothing to show
  if (!stateCode || !actType || rules.length === 0) return null;

  const stateName = STATE_NAMES[stateCode] || stateCode;

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm ${className}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
            Compliance Check &middot; {stateName} &middot; {actType}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
            {rules.length} rule{rules.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(m => !m)}
          className="ml-2 shrink-0 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {minimized ? 'Show' : 'Minimize'}
        </button>
      </div>

      {/* ── Rule cards ── */}
      {!minimized && (
        <div className="space-y-2">
          {rules.map(rule => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplianceAdvisor;
