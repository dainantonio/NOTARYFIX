import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, BookOpen, CheckCircle2, ChevronRight, Database,
  Info, Lightbulb, MapPin, MessageSquare, RotateCcw, Send, ShieldAlert, Sparkles, Zap,
} from 'lucide-react';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
  Input, Progress, Select,
} from '../components/UI';
import { useData } from '../context/DataContext';

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

// ─── TOPIC DETECTION ──────────────────────────────────────────────────────────
// Maps user question keywords → which answer sections to emphasize.
// All sections always render; matched topics get visual "highlight" treatment.
const TOPIC_RULES = [
  { id: 'fees',    keywords: ['fee', 'fees', 'cost', 'price', 'charge', 'max', 'limit', 'how much', 'rate', 'dollar', '$'] },
  { id: 'ids',     keywords: ['id', 'ids', 'identification', 'driver', 'passport', 'license', 'acceptable', 'identity', 'credential', 'credible witness', 'two form'] },
  { id: 'witness', keywords: ['witness', 'witnesses', 'witnessing', 'attestation', 'sign in presence'] },
  { id: 'caveats', keywords: ['caveat', 'exception', 'special', 'restriction', 'limitation', 'prohibited', 'cannot', 'not allowed'] },
  { id: 'ron',     keywords: ['ron', 'remote', 'online', 'electronic', 'e-notary', 'enotary', 'virtual', 'platform', 'audio', 'video'] },
  { id: 'journal', keywords: ['journal', 'record', 'log', 'retention', 'keep', 'years'] },
  { id: 'seal',    keywords: ['seal', 'stamp', 'ink', 'embossed', 'emboss'] },
  { id: 'general', keywords: ['overview', 'summary', 'everything', 'all', 'tell me about', 'what do i need', 'requirements', 'rules'] },
];

const detectTopics = (question) => {
  const q = (question || '').toLowerCase();
  const matched = TOPIC_RULES.filter((rule) =>
    rule.keywords.some((kw) => q.includes(kw))
  ).map((r) => r.id);
  // If nothing matched or "general" matched, show everything highlighted
  return matched.length === 0 || matched.includes('general') ? ['fees', 'ids', 'witness', 'caveats', 'ron', 'journal', 'seal'] : matched;
};

// ─── SUGGESTED PROMPTS ────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  { label: 'Fee limits', question: 'What are the notary fee limits?', icon: '💰' },
  { label: 'Acceptable IDs', question: 'What IDs are acceptable for signer identification?', icon: '🪪' },
  { label: 'Witness rules', question: 'When are witnesses required?', icon: '👥' },
  { label: 'RON allowed?', question: 'Is Remote Online Notarization (RON) permitted?', icon: '💻' },
  { label: 'Seal & journal', question: 'What are the seal and journal requirements?', icon: '📝' },
  { label: 'Full overview', question: 'Give me a complete overview of notary requirements', icon: '📋' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const maxIso = (isos) => {
  const valid = (isos || []).filter(Boolean).map((x) => new Date(x)).filter((d) => !Number.isNaN(d.getTime()));
  if (valid.length === 0) return null;
  valid.sort((a, b) => b.getTime() - a.getTime());
  return valid[0].toISOString();
};

const getStateName = (code) => US_STATES.find((s) => s.code === code)?.name || code;

const getPublishedPolicy = (stateRules, stateCode) => {
  const candidates = (stateRules || [])
    .filter((r) => r.stateCode === stateCode && r.publishedAt && r.status !== 'archived');
  candidates.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return candidates[0] || null;
};

// ─── KNOWLEDGE ARTICLE MATCHING ───────────────────────────────────────────────
// Returns published articles relevant to the state + question
const matchKnowledgeArticles = (articles, stateCode, question) => {
  const published = (articles || []).filter((a) => a.status === 'published');
  const q = (question || '').toLowerCase();
  const qTokens = q.split(/\s+/).filter((t) => t.length > 2);

  return published
    .filter((a) => {
      // Must be global (no stateCode) or match the queried state
      if (a.stateCode && a.stateCode !== stateCode) return false;
      return true;
    })
    .map((a) => {
      // Score relevance by keyword overlap
      const haystack = [a.title, a.content, ...(a.tags || [])].join(' ').toLowerCase();
      const hits = qTokens.filter((t) => haystack.includes(t)).length;
      const tagHits = (a.tags || []).filter((tag) => q.includes(tag.toLowerCase())).length;
      return { ...a, relevanceScore: hits + tagHits * 2 };
    })
    .filter((a) => a.stateCode === stateCode || a.relevanceScore > 0) // Keep state-specific or question-relevant
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
};

// ─── CONFIDENCE SCORING ───────────────────────────────────────────────────────
const computeConfidence = ({ policy, feeEntries, idReq, matchedArticles }) => {
  if (!policy) return { score: 0, label: 'None' };

  let score = 0.95;

  // Missing data sections reduce confidence
  if (!Array.isArray(feeEntries) || feeEntries.length === 0) score -= 0.15;
  if (!idReq) score -= 0.15;
  if (!policy.witnessRequirements) score -= 0.10;
  if (!(policy.specialActCaveats || policy.notes)) score -= 0.08;
  if (!policy.officialSourceUrl) score -= 0.05;

  // Knowledge article coverage boosts confidence
  if (Array.isArray(matchedArticles) && matchedArticles.length > 0) score += 0.05;

  // Staleness penalty
  const lastUpdated = maxIso([
    policy.updatedAt,
    ...(feeEntries || []).map((f) => f.updatedAt),
    idReq?.updatedAt,
    ...(matchedArticles || []).map((a) => a.updatedAt),
  ]);

  if (lastUpdated) {
    const days = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 86400000);
    if (days > 365 && days <= 730) score -= 0.10;
    if (days > 730) score -= 0.20;
  }

  score = Math.max(0, Math.min(1, score));
  const label = score >= 0.85 ? 'High' : score >= 0.60 ? 'Medium' : 'Low';
  return { score, label, lastUpdated };
};

// ─── GROUNDED ANSWER BUILDER ──────────────────────────────────────────────────
const buildGroundedAnswer = ({ question, stateCode, data }) => {
  const policy = getPublishedPolicy(data.stateRules || [], stateCode);
  const topics = detectTopics(question);

  if (!policy) {
    return {
      kind: 'missing',
      stateCode,
      stateName: getStateName(stateCode),
      question,
      topics,
      disclaimer: 'No answer generated. AI Trainer is grounded-only and requires a published state policy record.',
      source: { statePolicy: null, lastUpdated: null },
      confidence: { score: 0, label: 'None', lastUpdated: null },
    };
  }

  const feeEntries = (data.feeSchedules || [])
    .filter((f) => f.stateCode === stateCode)
    .slice()
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

  const idReq = (data.idRequirements || [])
    .filter((r) => r.stateCode === stateCode)
    .slice()
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0] || null;

  const matchedArticles = matchKnowledgeArticles(data.knowledgeArticles || [], stateCode, question);
  const confidence = computeConfidence({ policy, feeEntries, idReq, matchedArticles });

  return {
    kind: 'answer',
    stateCode,
    stateName: getStateName(stateCode),
    question,
    topics,
    policy,
    feeEntries,
    idReq,
    matchedArticles,
    witnessRequirements: policy.witnessRequirements || null,
    specialActCaveats: policy.specialActCaveats || policy.notes || null,
    officialSourceUrl: policy.officialSourceUrl || null,
    source: {
      statePolicy: {
        id: policy.id,
        version: policy.version,
        publishedAt: policy.publishedAt,
        updatedAt: policy.updatedAt,
        effectiveDate: policy.effectiveDate,
      },
      feeSchedule: feeEntries.map((f) => ({
        id: f.id,
        actType: f.actType,
        updatedAt: f.updatedAt,
        effectiveDate: f.effectiveDate,
      })),
      idRequirements: idReq ? { id: idReq.id, updatedAt: idReq.updatedAt } : null,
      knowledgeArticles: matchedArticles.map((a) => ({
        id: a.id,
        title: a.title,
        updatedAt: a.updatedAt,
        publishedAt: a.publishedAt,
      })),
      lastUpdated: confidence.lastUpdated,
    },
    confidence,
    disclaimer: 'Verify with the official state source before acting. This tool summarizes only the published Admin policy records.',
  };
};

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
const Section = ({ title, children, highlighted, icon }) => (
  <div className={`rounded-xl border p-4 transition-all ${highlighted
    ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-200 dark:ring-blue-800'
    : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/20'
  }`}>
    <div className="flex items-center gap-2">
      {icon && <span className="text-sm">{icon}</span>}
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</div>
      {highlighted && (
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
          <Sparkles className="h-2.5 w-2.5" /> Relevant
        </span>
      )}
    </div>
    <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{children}</div>
  </div>
);

const ConfidencePill = ({ label, score }) => {
  const Icon = score >= 0.85 ? CheckCircle2 : score >= 0.60 ? Info : AlertTriangle;
  const tone = score >= 0.85
    ? 'text-emerald-600 dark:text-emerald-400'
    : score >= 0.60
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${tone}`} />
      <span className={`text-xs font-semibold ${tone}`}>Confidence: {label}</span>
      <div className="w-28">
        <Progress value={Math.round(score * 100)} />
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs">Searching published policy records…</span>
      </div>
    </div>
  </div>
);

// ─── DATASET STATUS SIDEBAR ───────────────────────────────────────────────────
const DatasetStatusPanel = ({ stateCode, data }) => {
  const policy = getPublishedPolicy(data.stateRules || [], stateCode);
  const hasPolicy = Boolean(policy);
  const feeCount = (data.feeSchedules || []).filter((f) => f.stateCode === stateCode).length;
  const hasId = (data.idRequirements || []).some((r) => r.stateCode === stateCode);
  const articleCount = (data.knowledgeArticles || []).filter(
    (a) => a.status === 'published' && (!a.stateCode || a.stateCode === stateCode)
  ).length;

  const coverage = [hasPolicy, feeCount > 0, hasId, articleCount > 0].filter(Boolean).length;
  const coveragePercent = Math.round((coverage / 4) * 100);

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Dataset status</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {/* Selected state */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Selected state</div>
          <div className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">
            {stateCode ? `${getStateName(stateCode)} (${stateCode})` : '— Select a state —'}
          </div>
        </div>

        {stateCode ? (
          <div className="space-y-3">
            {/* Coverage bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Data coverage</span>
                <span className={`text-xs font-bold ${coveragePercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : coveragePercent >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {coveragePercent}%
                </span>
              </div>
              <Progress value={coveragePercent} />
            </div>

            {/* Checklist */}
            {[
              { label: 'Published policy', ok: hasPolicy, detail: hasPolicy ? `${policy.version} • ${fmtDate(policy.publishedAt)}` : 'Publish in Admin → State Policies' },
              { label: 'Fee schedule', ok: feeCount > 0, detail: feeCount > 0 ? `${feeCount} record(s)` : 'Add in Admin → Fee Tables' },
              { label: 'ID requirements', ok: hasId, detail: hasId ? 'Present' : 'Add in Admin → ID Requirements' },
              { label: 'Knowledge articles', ok: articleCount > 0, detail: articleCount > 0 ? `${articleCount} published` : 'Add in Admin → AI Content' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2">
                <div className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${item.ok ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {item.ok
                    ? <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    : <AlertTriangle className="h-3 w-3 text-red-500 dark:text-red-400" />}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.detail}</div>
                </div>
              </div>
            ))}

            {/* Grounding guarantee */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />
                Grounding guarantee
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>No published policy → no answer (no hallucinations).</li>
                <li>Missing sections marked "not provided in policy records".</li>
                <li>Every answer cites source record + last updated.</li>
                <li>Knowledge articles are cited when matched.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400">Select a state to see policy coverage status.</div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── ANSWER RENDERER ──────────────────────────────────────────────────────────
const AnswerCard = ({ model }) => {
  const topics = model.topics || [];
  const isHighlighted = (section) => topics.includes(section);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Notary guidance</div>
          <div className="mt-0.5 text-base font-bold text-slate-800 dark:text-slate-100">
            {model.stateName} ({model.stateCode})
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Policy {model.policy?.version || '—'} • Effective {fmtDate(model.policy?.effectiveDate)} • Published {fmtDate(model.policy?.publishedAt)}
          </div>
        </div>
        <ConfidencePill label={model.confidence.label} score={model.confidence.score} />
      </div>

      {/* ── Fee Limits ────────────────────────────────── */}
      <Section title="Fee limits" highlighted={isHighlighted('fees')} icon="💰">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">Max fee per act:</span>
          <Badge variant="success" className="text-[11px]">
            ${Number(model.policy?.maxFeePerAct ?? 0).toFixed(2)}
          </Badge>
        </div>
        <div className="mt-3">
          {Array.isArray(model.feeEntries) && model.feeEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-0">
                <thead className="text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="text-left py-1">Act</th>
                    <th className="text-left py-1">Max</th>
                    <th className="text-left py-1">Effective</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {model.feeEntries.slice(0, 12).map((f) => (
                    <tr key={f.id}>
                      <td className="py-1 pr-3 truncate max-w-[100px]">{f.actType}</td>
                      <td className="py-1 pr-3 font-semibold">${Number(f.maxFee ?? 0).toFixed(2)}</td>
                      <td className="py-1">{fmtDate(f.effectiveDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {model.feeEntries.length > 12 && (
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Showing 12 of {model.feeEntries.length} entries.</div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic">No fee schedule entries found in the published policy records.</div>
          )}
        </div>
      </Section>

      {/* ── Acceptable IDs ────────────────────────────── */}
      <Section title="Acceptable IDs" highlighted={isHighlighted('ids')} icon="🪪">
        {model.idReq ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Badge variant="blue" className="text-[11px]">Expiration required: {model.idReq.expirationRequired ? 'Yes' : 'No'}</Badge>
              <Badge variant="default" className="text-[11px]">Two forms allowed: {model.idReq.twoFormAllowed ? 'Yes' : 'No'}</Badge>
              <Badge variant="default" className="text-[11px]">Credible witness: {model.idReq.credibleWitnessAllowed ? 'Yes' : 'No'}</Badge>
            </div>
            <ul className="list-disc pl-5 text-sm">
              {(model.idReq.acceptedIdTypes || []).map((t) => <li key={t}>{t}</li>)}
            </ul>
            {model.idReq.notes && <div className="text-xs text-slate-500 dark:text-slate-400 italic">{model.idReq.notes}</div>}
          </div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400 italic">No ID requirements record found in the published policy records.</div>
        )}
      </Section>

      {/* ── Witness Requirements ───────────────────────── */}
      <Section title="Witness requirements" highlighted={isHighlighted('witness')} icon="👥">
        {model.witnessRequirements ? (
          <div className="whitespace-pre-wrap">{model.witnessRequirements}</div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400 italic">Not provided in the published policy records.</div>
        )}
      </Section>

      {/* ── Special Act Caveats ─────────────────────────── */}
      <Section title="Special act caveats" highlighted={isHighlighted('caveats')} icon="⚠️">
        {model.specialActCaveats ? (
          <div className="whitespace-pre-wrap">{model.specialActCaveats}</div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400 italic">Not provided in the published policy records.</div>
        )}
      </Section>

      {/* ── RON & Technology ───────────────────────────── */}
      <Section title="RON & technology" highlighted={isHighlighted('ron')} icon="💻">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={model.policy?.ronPermitted ? 'success' : 'danger'} className="text-[11px]">
              RON: {model.policy?.ronPermitted ? 'Permitted' : 'Not permitted'}
            </Badge>
            {model.policy?.ronStatute && (
              <span className="text-xs text-slate-500 dark:text-slate-400">Statute: <span className="font-mono">{model.policy.ronStatute}</span></span>
            )}
          </div>
          {!model.policy?.ronPermitted && (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic">
              Remote Online Notarization is not currently authorized under this state's published policy.
            </div>
          )}
        </div>
      </Section>

      {/* ── Seal, Journal & Retention ──────────────────── */}
      <Section title="Seal, journal & retention" highlighted={isHighlighted('journal') || isHighlighted('seal')} icon="📝">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Seal</div>
            <div className="text-sm mt-0.5">{model.policy?.seal || '—'}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Journal required</div>
            <div className="text-sm mt-0.5">{model.policy?.journalRequired ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Retention</div>
            <div className="text-sm mt-0.5">{model.policy?.retentionYears ? `${model.policy.retentionYears} years` : '—'}</div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant={model.policy?.thumbprintRequired ? 'warning' : 'default'} className="text-[11px]">
            Thumbprint: {model.policy?.thumbprintRequired ? 'Required' : 'Not required'}
          </Badge>
        </div>
      </Section>

      {/* ── Knowledge Articles ──────────────────────────── */}
      {Array.isArray(model.matchedArticles) && model.matchedArticles.length > 0 && (
        <Section title="Related knowledge articles" icon="📚">
          <div className="space-y-2">
            {model.matchedArticles.map((a) => (
              <div key={a.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3 text-violet-500" />
                      {a.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {a.category} {a.stateCode ? `• ${a.stateCode}` : '• All states'} • Published {fmtDate(a.publishedAt)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-3">{a.content}</div>
                {a.tags?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {a.tags.slice(0, 5).map((t) => (
                      <span key={t} className="rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800 px-1.5 py-0.5 text-[9px] font-medium">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Source + Last Updated ───────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 p-4 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Database className="h-3 w-3" />
          Source + last updated
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <div>
            <span className="font-semibold">State policy:</span> record #{model.source.statePolicy?.id} • {model.source.statePolicy?.version} • updated {fmtDate(model.source.statePolicy?.updatedAt)} • published {fmtDate(model.source.statePolicy?.publishedAt)}
          </div>
          <div>
            <span className="font-semibold">Fee schedule:</span> {model.source.feeSchedule?.length || 0} record(s) • latest update {fmtDate(maxIso((model.source.feeSchedule || []).map((x) => x.updatedAt)))}
          </div>
          <div>
            <span className="font-semibold">ID requirements:</span> {model.source.idRequirements ? `record #${model.source.idRequirements.id} • updated ${fmtDate(model.source.idRequirements.updatedAt)}` : '—'}
          </div>
          {model.source.knowledgeArticles?.length > 0 && (
            <div>
              <span className="font-semibold">Knowledge articles:</span>{' '}
              {model.source.knowledgeArticles.map((a) => `"${a.title}"`).join(', ')} • latest update {fmtDate(maxIso(model.source.knowledgeArticles.map((a) => a.updatedAt)))}
            </div>
          )}
          {model.officialSourceUrl && (
            <div className="truncate">
              <span className="font-semibold">Official source:</span>{' '}
              <a href={model.officialSourceUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">
                {model.officialSourceUrl}
              </a>
            </div>
          )}
          <div>
            <span className="font-semibold">Last updated:</span> {fmtDate(model.source.lastUpdated)}
          </div>
        </div>
      </div>

      {/* ── Disclaimer ─────────────────────────────────── */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-3 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div>{model.disclaimer}</div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const AITrainer = () => {
  const { data, updateSettings } = useData();

  const currentStateCode = data.settings?.currentStateCode || '';
  const [stateCode, setStateCode] = useState(currentStateCode || 'WA');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState(() => ([
    {
      id: 'welcome',
      role: 'assistant',
      createdAt: new Date().toISOString(),
      model: {
        kind: 'info',
        text: 'Ask a state-specific notary question. Answers are grounded-only — the Trainer responds exclusively from published Admin records. No hallucinations, ever.',
      },
    },
  ]));

  useEffect(() => {
    if (!currentStateCode) return;
    setStateCode((prev) => prev || currentStateCode);
  }, [currentStateCode]);

  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const stateOptions = useMemo(
    () => [{ value: '', label: '— Select State —' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))],
    []
  );

  const handleAsk = useCallback((questionOverride) => {
    const q = (questionOverride || input).trim();
    if (!q || !stateCode) return;

    const userMsg = { id: `${Date.now()}-u`, role: 'user', createdAt: new Date().toISOString(), text: q };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate brief "thinking" delay for grounded lookup
    setTimeout(() => {
      const model = buildGroundedAnswer({ question: q, stateCode, data });
      const assistantMsg = { id: `${Date.now()}-a`, role: 'assistant', createdAt: new Date().toISOString(), model };
      setMessages((m) => [...m, assistantMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  }, [input, stateCode, data]);

  const applyToCurrentState = () => {
    if (!stateCode) return;
    updateSettings({ currentStateCode: stateCode });
  };

  const useCurrentState = () => {
    if (!currentStateCode) return;
    setStateCode(currentStateCode);
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      createdAt: new Date().toISOString(),
      model: {
        kind: 'info',
        text: 'Chat cleared. Ask a new state-specific notary question — answers are grounded-only from the published Admin policy records.',
      },
    }]);
  };

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 mx-auto max-w-[1400px] space-y-5 sm:space-y-6 pb-20">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <Card className="app-hero-card">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Knowledge Copilot</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">AI Trainer</h1>
              <p className="mt-1 text-sm text-slate-200">
                On-the-fly, state-specific guidance for notaries — grounded only from the published Admin policy records.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-center">
                <div className="text-xl font-bold text-blue-300">{(data.stateRules || []).filter((r) => r.publishedAt && r.status !== 'archived').length}</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wide mt-0.5">Published policies</div>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-center">
                <div className="text-xl font-bold text-violet-300">{(data.knowledgeArticles || []).filter((a) => a.status === 'published').length}</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wide mt-0.5">AI articles</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Chat Panel (2/3 width) ─────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Ask a question
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Badge variant="default" className="text-[11px]">
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                Current: {currentStateCode || '—'}
              </Badge>
              <Button variant="secondary" size="sm" onClick={useCurrentState} disabled={!currentStateCode}>
                Use current
              </Button>
              <Button variant="ghost" size="sm" onClick={clearChat} title="Clear conversation">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* State selector + apply */}
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:max-w-md">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">State</div>
                <Select value={stateCode} onChange={(e) => setStateCode(e.target.value)} options={stateOptions} />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={applyToCurrentState} disabled={!stateCode || stateCode === currentStateCode}>
                  Apply to current state
                </Button>
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => handleAsk(prompt.question)}
                  disabled={!stateCode || isTyping}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{prompt.icon}</span>
                  {prompt.label}
                </button>
              ))}
            </div>

            {/* Message thread */}
            <div
              ref={scrollRef}
              className="h-[480px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-4 space-y-4"
            >
              {messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  {m.role === 'user' ? (
                    <div className="max-w-[85%] rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm shadow-sm">
                      {m.text}
                    </div>
                  ) : (
                    <div className="max-w-[92%] w-full rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
                      {m.model?.kind === 'info' ? (
                        <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                          <ShieldAlert className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-semibold">Grounded-only mode</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.model.text}</div>
                          </div>
                        </div>
                      ) : m.model?.kind === 'missing' ? (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">No published policy records</div>
                              <div className="mt-0.5 text-base font-bold text-slate-800 dark:text-slate-100">{m.model.stateName} ({m.model.stateCode})</div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Publish a state policy in <span className="font-semibold">Admin → State Policy Records</span> to enable answers.
                              </div>
                            </div>
                            <ConfidencePill label={m.model.confidence.label} score={m.model.confidence.score} />
                          </div>
                          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-3 text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>{m.model.disclaimer}</div>
                          </div>
                        </div>
                      ) : (
                        <AnswerCard model={m.model} />
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && <TypingIndicator />}
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about fees, IDs, witnesses, RON caveats…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                disabled={isTyping}
              />
              <Button onClick={() => handleAsk()} disabled={!stateCode || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {!stateCode && (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Select a state to enable grounded responses.
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Sidebar (1/3 width) ────────────────────────────────────── */}
        <DatasetStatusPanel stateCode={stateCode} data={data} />
      </div>
    </div>
  );
};

export default AITrainer;
