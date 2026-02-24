// File: src/pages/FormGuide.jsx
// NotaryOS — Form Guidance AI Agent
// v2: Wired to Admin state policies (stateRules + knowledgeArticles + feeSchedules)
//     + "Log This Act" button pre-fills a new journal entry

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Send, BookOpen, ChevronDown, ChevronRight,
  FileText, ShieldCheck, AlertTriangle, Copy, Check,
  RotateCcw, Scale, MapPin, ArrowRight, Zap, Info,
  DollarSign, Fingerprint, BookMarked, Wifi, WifiOff,
  ExternalLink, PenLine, X, CheckCircle2,
} from 'lucide-react';
import { useData } from '../context/DataContext';

// ─── STATIC KNOWLEDGE BASE (fallback when no state rule is configured) ────────
const FORM_KB = {
  acknowledgment: {
    title: 'Acknowledgment',
    icon: '📋',
    when: 'The signer is personally present and acknowledges their signature on a previously-signed document, OR signs in front of you.',
    notSuitable: 'Do NOT use when the signer needs to swear or affirm the contents are true.',
    keyFacts: [
      'Signer does NOT need to re-sign (they may have already signed)',
      'You confirm identity and voluntary signing intent',
      'Most common for: deeds, mortgages, powers of attorney',
      'Certificate wording: "acknowledged before me"',
    ],
    stateNotes: 'Most states use URPERA language. Verify your state\'s specific certificate wording.',
    complianceFlags: ['Confirm signer identity with acceptable ID', 'Signer must be physically present', 'Never backdate'],
    journalActType: 'Acknowledgment',
  },
  jurat: {
    title: 'Jurat',
    icon: '✋',
    when: 'The signer MUST swear or affirm that the contents are true AND must sign in your presence.',
    notSuitable: 'Do NOT use for real property conveyances or when only acknowledging a prior signature.',
    keyFacts: [
      'Signer MUST sign in your presence — no pre-signed documents',
      'You administer a verbal oath or affirmation',
      'Most common for: affidavits, sworn statements, court documents',
      'Certificate wording: "subscribed and sworn before me"',
    ],
    stateNotes: 'Some states call this "Verification on Oath." Use your state\'s exact approved certificate language.',
    complianceFlags: ['Administer oath/affirmation out loud', 'Signer signs in front of you', 'Document act type in journal'],
    journalActType: 'Jurat',
  },
  'copy-certification': {
    title: 'Copy Certification',
    icon: '📄',
    when: 'Certifying that a copy of an original document is a true, complete, and accurate reproduction.',
    notSuitable: 'Many states PROHIBIT notarizing copies of vital records. Check your state before proceeding.',
    keyFacts: [
      'Original document must be present',
      'You compare the copy to the original document',
      'Common for: diplomas, contracts, passports (copy pages)',
      'Prohibited for vital records in most states',
    ],
    stateNotes: 'CA, TX, FL, NY restrict copy certification of vital records. Some states do not authorize this act at all.',
    complianceFlags: ['Verify state authorization', 'Original must be present', 'Never certify government-issued IDs'],
    journalActType: 'Copy Certification',
  },
  'oath-affirmation': {
    title: 'Oath / Affirmation',
    icon: '🤚',
    when: 'Administering a verbal oath or affirmation — not always tied to a document. Used for witnesses, depositions, public officials.',
    notSuitable: 'Not for certifying document signatures or contents directly.',
    keyFacts: [
      'Can be performed without any document present',
      'Oath: signer swears to God (or deity of choice)',
      'Affirmation: secular alternative with identical legal standing',
      'Common for: depositions, officials taking office',
    ],
    stateNotes: 'Always ask the signer whether they prefer an oath or affirmation.',
    complianceFlags: ['Note in journal: oath or affirmation', 'Must be administered verbally'],
    journalActType: 'Oath/Affirmation',
  },
  'signature-witnessing': {
    title: 'Signature Witnessing',
    icon: '👁️',
    when: 'You witness the signer personally signing — no oath administered, not acknowledging a prior signature.',
    notSuitable: 'Not available in all states. Confirm authorization.',
    keyFacts: [
      'Signer MUST sign in your presence',
      'No oath or affirmation involved',
      'Authorized in FL, NY, and several other states',
    ],
    stateNotes: 'Only use where explicitly authorized by state statute.',
    complianceFlags: ['Verify state authorization', 'Signer signs in your presence'],
    journalActType: 'Signature Witnessing',
  },
};

const DOC_TO_ACT = [
  { docs: ['deed of trust', 'deed', 'mortgage', 'grant deed', 'quitclaim'], act: 'acknowledgment', confidence: 'High' },
  { docs: ['power of attorney', 'poa', 'healthcare directive', 'living will', 'advance directive'], act: 'acknowledgment', confidence: 'High' },
  { docs: ['affidavit', 'sworn statement', 'declaration under penalty', 'declaration under oath'], act: 'jurat', confidence: 'High' },
  { docs: ['i-9', 'employment verification', 'i9'], act: 'acknowledgment', confidence: 'High' },
  { docs: ['loan package', 'closing disclosure', 'note', 'right to cancel', 'closing'], act: 'acknowledgment', confidence: 'High', note: 'Individual documents within a loan package may require different acts. Review each page\'s certificate block.' },
  { docs: ['birth certificate', 'death certificate', 'marriage license', 'vital record'], act: 'copy-certification', confidence: 'Caution', warning: 'Vital records — many states PROHIBIT copy certification. Verify your state law before proceeding.' },
  { docs: ['diploma', 'degree', 'transcript', 'educational'], act: 'copy-certification', confidence: 'High' },
  { docs: ['deposition', 'sworn testimony', 'witness statement'], act: 'jurat', confidence: 'High' },
  { docs: ['auto title', 'vehicle title', 'car title', 'dmv'], act: 'acknowledgment', confidence: 'High' },
  { docs: ['passport copy', 'copy of passport', 'passport page'], act: 'copy-certification', confidence: 'High', note: 'Passport data pages are generally certifiable. Do not certify government-issued IDs like a driver\'s license.' },
];

const SCENARIOS = [
  { id: 's1', question: 'Signer already signed — what act do I use?', answer: 'Use an **Acknowledgment**. The signer acknowledges that (1) they signed, (2) it was voluntary, and (3) they are who they say they are. Confirm identity with valid ID. No oath needed.', act: 'acknowledgment', tag: 'Most common' },
  { id: 's2', question: 'Document is an affidavit or sworn statement', answer: 'Use a **Jurat**. The signer MUST sign in your presence and you MUST administer a verbal oath: *"Do you swear (or affirm) that the contents of this document are true and correct to the best of your knowledge?"* Have them sign after responding.', act: 'jurat', tag: 'Court/Legal' },
  { id: 's3', question: 'Loan package has no certificate — what do I attach?', answer: 'Attach a **loose Acknowledgment certificate** using your state\'s approved wording. Never use another state\'s certificate or create custom language. Most loan documents require acknowledgments unless specifically indicated otherwise.', act: 'acknowledgment', tag: 'Loan signing' },
  { id: 's4', question: 'Signer can\'t write — can I notarize?', answer: 'Yes, in most states via **signature by mark**. The signer makes an X in your presence, you note "Mark of [name]" beside it, and a witness may be required. Document thoroughly in your journal. Procedures vary by state — verify yours.', act: 'acknowledgment', tag: 'Special cases' },
  { id: 's5', question: 'Document is in a foreign language', answer: 'You **can** notarize a foreign language document — you are notarizing the person\'s signature, not the content. The signer should understand what they\'re signing. Your certificate must be in English. Use the act appropriate to the document type.', act: 'acknowledgment', tag: 'Foreign docs' },
  { id: 's6', question: 'Signer has no ID — what are my options?', answer: 'Without satisfactory evidence of identity you cannot proceed normally. Options: **credible witness procedure** (if your state allows — one or two personal acquaintances who can vouch), or reschedule with proper ID. Never notarize without confirming identity.', act: null, tag: 'ID issues' },
];

const RED_FLAGS = [
  { triggers: ['backdate', 'back date', 'wrong date', 'yesterday', 'last week', 'last month'], message: 'STOP — Never backdate a notarial certificate. The date must reflect the actual date of notarization. Backdating is fraud and grounds for commission revocation.' },
  { triggers: ['not present', 'not here', 'send the document', 'mail it', 'over the phone', 'fax'], message: 'STOP — The signer must be physically present (or via an authorized RON platform). You cannot notarize for absent signers via traditional notarization.' },
  { triggers: ['sign for', 'sign their', 'sign on behalf', 'proxy sign', 'they can\'t come'], message: 'STOP — A notary cannot sign on behalf of a signer. The signer must personally sign. Exception: an attorney-in-fact may sign under a valid Power of Attorney.' },
  { triggers: ['no id', 'forgot id', 'no identification', 'can\'t verify identity'], message: 'Cannot proceed without identity verification. Consider the credible witness procedure if your state allows it, otherwise reschedule. Never skip identity verification.' },
];

// ─── RESPONSE ENGINE ──────────────────────────────────────────────────────────
function generateResponse(query, stateRule, feeSchedules, knowledgeArticles) {
  const q = query.toLowerCase().trim();

  // Red flags first
  for (const flag of RED_FLAGS) {
    if (flag.triggers.some(t => q.includes(t))) {
      return { type: 'warning', title: '⚠️ Compliance Alert', body: flag.message, act: null };
    }
  }

  // Find doc type match
  let matched = null;
  for (const entry of DOC_TO_ACT) {
    if (entry.docs.some(d => q.includes(d))) { matched = entry; break; }
  }

  // Find direct act name match
  if (!matched) {
    for (const [key, act] of Object.entries(FORM_KB)) {
      if (q.includes(key) || q.includes(act.title.toLowerCase())) {
        matched = { act: key, confidence: 'High' };
        break;
      }
    }
  }

  // Scenario matches
  const kwMap = {
    'already signed': 's1', 'pre-signed': 's1', 'signed before': 's1',
    'affidavit': 's2', 'sworn': 's2',
    'no certificate': 's3', 'loose certificate': 's3', 'missing certificate': 's3',
    'can\'t write': 's4', 'cannot write': 's4', 'signature by mark': 's4',
    'foreign language': 's5', 'spanish': 's5', 'portuguese': 's5', 'translated': 's5',
    'no id': 's6', 'forgot id': 's6', 'no identification': 's6',
  };
  for (const [kw, sid] of Object.entries(kwMap)) {
    if (q.includes(kw) && !matched) {
      const sc = SCENARIOS.find(s => s.id === sid);
      if (sc) {
        const actData = sc.act ? FORM_KB[sc.act] : null;
        // Enrich with state data
        const stateEnrichment = stateRule && actData ? buildStateEnrichment(sc.act, stateRule, feeSchedules) : null;
        const relatedArticles = knowledgeArticles.filter(a =>
          a.status === 'published' &&
          (!stateRule || a.stateCode === stateRule.stateCode || !a.stateCode) &&
          (a.content.toLowerCase().includes(sc.act || '') || a.tags?.some(t => q.includes(t.toLowerCase())))
        ).slice(0, 2);
        return { type: 'scenario', title: sc.question, body: sc.answer, act: sc.act, actData, stateEnrichment, relatedArticles };
      }
    }
  }

  if (matched) {
    const actData = FORM_KB[matched.act];
    const stateEnrichment = stateRule && actData ? buildStateEnrichment(matched.act, stateRule, feeSchedules) : null;
    const relatedArticles = knowledgeArticles.filter(a =>
      a.status === 'published' &&
      (!stateRule || a.stateCode === stateRule.stateCode || !a.stateCode)
    ).slice(0, 2);
    return {
      type: matched.confidence === 'Caution' ? 'caution' : 'answer',
      title: `Use: ${actData.title}`,
      body: actData.when,
      act: matched.act, actData,
      confidence: matched.confidence,
      note: matched.note,
      warning: matched.warning,
      stateEnrichment,
      relatedArticles,
    };
  }

  // Guide fallback
  return {
    type: 'guide',
    title: 'Let\'s determine the right act',
    body: 'I couldn\'t find a direct match. Answer these questions to narrow it down:',
    questions: [
      { q: 'Did the signer already sign the document?', yes: '→ Likely Acknowledgment', no: '→ They\'ll sign in front of you' },
      { q: 'Does the document require swearing the contents are true?', yes: '→ Use a Jurat', no: '→ Acknowledgment or Signature Witnessing' },
      { q: 'Are you certifying a copy of an original?', yes: '→ Copy Certification (check state)', no: '→ Not applicable' },
    ],
    act: null,
    stateEnrichment: null,
    relatedArticles: [],
  };
}

function buildStateEnrichment(actKey, stateRule, feeSchedules) {
  if (!stateRule) return null;

  const actTitle = FORM_KB[actKey]?.title || actKey;
  const authorized = stateRule.notarizationTypes?.some(t =>
    t.toLowerCase().includes(actKey.replace(/-/g, ' ')) ||
    t.toLowerCase().includes(actTitle.toLowerCase().split(' ')[0])
  );

  const fee = feeSchedules?.find(f =>
    f.stateCode === stateRule.stateCode &&
    (f.actType?.toLowerCase().includes(actKey.replace(/-/g, ' ')) ||
     f.actType?.toLowerCase().includes(actTitle.toLowerCase().split(' ')[0]))
  );

  return {
    state: stateRule.state,
    stateCode: stateRule.stateCode,
    authorized: authorized !== false, // default true if notarizationTypes not granular
    maxFee: fee?.maxFeePerAct ?? stateRule.maxFeePerAct,
    thumbprintRequired: stateRule.thumbprintRequired,
    journalRequired: stateRule.journalRequired,
    ronPermitted: stateRule.ronPermitted,
    specialCaveats: stateRule.specialActCaveats,
    notes: stateRule.notes,
    officialSourceUrl: stateRule.officialSourceUrl,
    version: stateRule.version,
  };
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function ActBadge({ act }) {
  const cfg = {
    acknowledgment:       { color: 'bg-blue-500/15 text-blue-400 border-blue-400/25' },
    jurat:                { color: 'bg-purple-500/15 text-purple-400 border-purple-400/25' },
    'copy-certification': { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/25' },
    'oath-affirmation':   { color: 'bg-amber-500/15 text-amber-400 border-amber-400/25' },
    'signature-witnessing':{ color: 'bg-cyan-500/15 text-cyan-400 border-cyan-400/25' },
  };
  const labels = {
    acknowledgment: 'Acknowledgment', jurat: 'Jurat',
    'copy-certification': 'Copy Certification',
    'oath-affirmation': 'Oath / Affirmation',
    'signature-witnessing': 'Signature Witnessing',
  };
  if (!act || !labels[act]) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg[act]?.color || 'bg-slate-500/15 text-slate-400 border-slate-400/25'}`}>
      <FileText className="h-3 w-3" />{labels[act]}
    </span>
  );
}

function StatePanel({ enrichment }) {
  if (!enrichment) return null;
  return (
    <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-400/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-black uppercase tracking-wider text-blue-400">{enrichment.state} Rules</span>
          <span className="text-[10px] text-blue-500/70">{enrichment.version}</span>
        </div>
        {enrichment.authorized
          ? <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400"><CheckCircle2 className="h-3 w-3" />Authorized</span>
          : <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold text-rose-400"><X className="h-3 w-3" />Not authorized</span>
        }
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {enrichment.maxFee != null && (
          <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1"><DollarSign className="h-3 w-3 text-emerald-400" /></div>
            <p className="text-base font-black text-white">${enrichment.maxFee}</p>
            <p className="text-[10px] text-slate-500">Max fee</p>
          </div>
        )}
        <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
          <div className="flex items-center justify-center mb-1">
            <Fingerprint className={`h-3 w-3 ${enrichment.thumbprintRequired ? 'text-amber-400' : 'text-slate-600'}`} />
          </div>
          <p className={`text-[11px] font-bold ${enrichment.thumbprintRequired ? 'text-amber-400' : 'text-slate-500'}`}>
            {enrichment.thumbprintRequired ? 'Required' : 'Not required'}
          </p>
          <p className="text-[10px] text-slate-500">Thumbprint</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
          <div className="flex items-center justify-center mb-1">
            <BookMarked className={`h-3 w-3 ${enrichment.journalRequired ? 'text-cyan-400' : 'text-slate-600'}`} />
          </div>
          <p className={`text-[11px] font-bold ${enrichment.journalRequired ? 'text-cyan-400' : 'text-slate-500'}`}>
            {enrichment.journalRequired ? 'Required' : 'Optional'}
          </p>
          <p className="text-[10px] text-slate-500">Journal</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
          <div className="flex items-center justify-center mb-1">
            {enrichment.ronPermitted
              ? <Wifi className="h-3 w-3 text-violet-400" />
              : <WifiOff className="h-3 w-3 text-slate-600" />}
          </div>
          <p className={`text-[11px] font-bold ${enrichment.ronPermitted ? 'text-violet-400' : 'text-slate-500'}`}>
            {enrichment.ronPermitted ? 'Permitted' : 'Not permitted'}
          </p>
          <p className="text-[10px] text-slate-500">RON</p>
        </div>
      </div>

      {enrichment.notes && (
        <p className="text-[11px] text-slate-400 italic">{enrichment.notes}</p>
      )}
      {enrichment.officialSourceUrl && (
        <a href={enrichment.officialSourceUrl} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
          <ExternalLink className="h-3 w-3" />Official statute
        </a>
      )}
    </div>
  );
}

function RelatedArticles({ articles }) {
  if (!articles?.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">From your knowledge base</p>
      <div className="space-y-1.5">
        {articles.map(a => (
          <div key={a.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <p className="text-xs font-semibold text-slate-300">{a.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogActButton({ act, actData, stateEnrichment, onLog }) {
  if (!act || !actData) return null;
  return (
    <button onClick={() => onLog(act, actData, stateEnrichment)}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 py-3 text-sm font-bold text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/50 active:scale-[.98] transition-all">
      <PenLine className="h-4 w-4" />
      Log this act in Journal
    </button>
  );
}

function ActDetailCard({ actData }) {
  if (!actData) return null;
  return (
    <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Facts</p>
        <ul className="space-y-1.5">
          {actData.keyFacts.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />{f}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2.5">
        <p className="text-[11px] text-amber-400">{actData.notSuitable}</p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Compliance Checklist</p>
        <ul className="space-y-1.5">
          {actData.complianceFlags.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cyan-400 mt-0.5" />{f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChatBubble({ msg, onLog }) {
  const [showDetail, setShowDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-sm text-white leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  const res = msg.response;
  if (!res) return null;

  const isWarning = res.type === 'warning';
  const isCaution = res.type === 'caution';

  const copy = () => {
    navigator.clipboard.writeText(res.body || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5 ${isWarning ? 'bg-rose-500/20' : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'}`}>
        {isWarning ? <AlertTriangle className="h-4 w-4 text-rose-400" /> : <Bot className="h-4 w-4 text-blue-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`rounded-2xl rounded-tl-sm border p-4 ${isWarning ? 'border-rose-500/30 bg-rose-500/8' : isCaution ? 'border-amber-500/30 bg-amber-500/8' : 'border-white/[0.08] bg-white/[0.03]'}`}>

          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className={`font-black text-sm ${isWarning ? 'text-rose-300' : 'text-white'}`}>{res.title}</p>
              {(res.act || res.confidence) && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {res.act && <ActBadge act={res.act} />}
                  {res.confidence && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${res.confidence === 'High' ? 'bg-emerald-500/15 text-emerald-400' : res.confidence === 'Caution' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      <ShieldCheck className="h-3 w-3" />{res.confidence} confidence
                    </span>
                  )}
                </div>
              )}
            </div>
            <button onClick={copy} className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Body */}
          <div className="text-sm text-slate-300 leading-relaxed">
            {res.body.split('**').map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
            )}
          </div>

          {/* Alerts */}
          {res.warning && (
            <div className="mt-3 flex gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <p className="text-xs text-rose-300">{res.warning}</p>
            </div>
          )}
          {res.note && !res.warning && (
            <div className="mt-3 flex gap-2 rounded-xl border border-blue-400/15 bg-blue-400/5 px-3 py-2.5">
              <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
              <p className="text-xs text-blue-300">{res.note}</p>
            </div>
          )}

          {/* Guide fallback questions */}
          {res.type === 'guide' && res.questions && (
            <div className="mt-4 space-y-2">
              {res.questions.map((q, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <p className="text-xs font-semibold text-white mb-2">{q.q}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400">{q.yes}</span>
                    <span className="rounded-lg bg-slate-500/10 px-2.5 py-1 text-[11px] text-slate-400">{q.no}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* State policy enrichment — live from Admin */}
          {res.stateEnrichment && <StatePanel enrichment={res.stateEnrichment} />}

          {/* Related knowledge articles */}
          {res.relatedArticles?.length > 0 && <RelatedArticles articles={res.relatedArticles} />}

          {/* Expandable act detail */}
          {res.actData && (
            <div className="mt-3">
              <button onClick={() => setShowDetail(d => !d)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                {showDetail ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                {showDetail ? 'Hide' : 'Show'} compliance checklist & key facts
              </button>
              {showDetail && <ActDetailCard actData={res.actData} />}
            </div>
          )}

          {/* Log This Act */}
          {!isWarning && res.act && (
            <LogActButton act={res.act} actData={res.actData} stateEnrichment={res.stateEnrichment}
              onLog={onLog} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR QUICK REFERENCE ──────────────────────────────────────────────────
function QuickRefPanel({ onAsk, stateRule }) {
  const [openAct, setOpenAct] = useState(null);

  return (
    <div className="space-y-5">
      {/* State badge */}
      {stateRule ? (
        <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-black text-blue-400">{stateRule.state}</span>
            <span className="text-[10px] text-blue-500/60">{stateRule.version}</span>
          </div>
          <p className="text-[11px] text-slate-500">State policies loaded from Admin · answers are state-aware</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-white/[0.02] px-4 py-3">
          <p className="text-[11px] text-slate-500">No state rule configured in Admin for your state. Answers use general guidance.</p>
        </div>
      )}

      {/* Scenarios */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">Common Situations</p>
        <div className="space-y-1.5">
          {SCENARIOS.map(sc => (
            <button key={sc.id} onClick={() => onAsk(sc.question)}
              className="w-full text-left rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-xs text-slate-400 hover:bg-white/[0.05] hover:border-white/10 hover:text-slate-200 transition-all group">
              <div className="flex items-start justify-between gap-2">
                <span className="leading-relaxed">{sc.question}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-700 group-hover:text-blue-400 transition-colors mt-0.5" />
              </div>
              <span className="mt-1.5 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-600">{sc.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Acts at a glance */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">Acts at a Glance</p>
        <div className="space-y-1">
          {Object.entries(FORM_KB).map(([key, act]) => (
            <button key={key} onClick={() => setOpenAct(openAct === key ? null : key)}
              className="w-full text-left rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 hover:bg-white/[0.04] hover:border-white/8 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{act.icon}</span>
                  <span className="text-xs font-bold text-white">{act.title}</span>
                </div>
                {openAct === key ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}
              </div>
              {openAct !== key && <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">{act.when}</p>}
              {openAct === key && (
                <div className="mt-2.5 space-y-2">
                  <p className="text-xs text-slate-400 leading-relaxed">{act.when}</p>
                  <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-2.5 py-2">
                    <p className="text-[11px] text-amber-400">{act.notSuitable}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onAsk(`Tell me about ${act.title}`); }}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                    <Zap className="h-3 w-3" />Ask about this
                  </button>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── JOURNAL PRE-FILL MODAL ───────────────────────────────────────────────────
function LogActModal({ actKey, actData, stateEnrichment, onConfirm, onClose }) {
  const [signerName, setSignerName] = useState('');
  const [documentDesc, setDocumentDesc] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e1b2e] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-emerald-400" />
            <h3 className="font-black text-white text-sm">Log to Journal</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 mb-1">
              <ActBadge act={actKey} />
            </div>
            {stateEnrichment && (
              <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-500">
                {stateEnrichment.thumbprintRequired && <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3 text-amber-400" />Thumbprint req'd</span>}
                {stateEnrichment.maxFee != null && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-emerald-400" />Max ${stateEnrichment.maxFee}</span>}
                {stateEnrichment.journalRequired && <span className="flex items-center gap-1"><BookMarked className="h-3 w-3 text-cyan-400" />Journal req'd</span>}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Signer Name (optional)</label>
            <input value={signerName} onChange={e => setSignerName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:outline-none transition-all"
              style={{ fontSize: 16 }} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Document Description (optional)</label>
            <input value={documentDesc} onChange={e => setDocumentDesc(e.target.value)}
              placeholder="e.g. Deed of Trust, Affidavit of Heirship…"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:outline-none transition-all"
              style={{ fontSize: 16 }} />
          </div>
          <p className="text-[11px] text-slate-500">You'll land on the Journal page with a new entry pre-filled. Complete the remaining fields there.</p>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-all">Cancel</button>
            <button onClick={() => onConfirm(actData.journalActType, signerName, documentDesc)}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[.98] transition-all">
              Open Journal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function FormGuide() {
  const { data, addJournalEntry } = useData();
  const navigate = useNavigate();

  const stateCode = data.settings?.currentStateCode;
  const stateRule = useMemo(() =>
    (data.stateRules || []).find(r => r.stateCode === stateCode && r.status === 'active') || null,
    [data.stateRules, stateCode]
  );
  const feeSchedules = data.feeSchedules || [];
  const knowledgeArticles = data.knowledgeArticles || [];

  const [messages, setMessages] = useState([{
    id: 'welcome',
    role: 'assistant',
    response: {
      type: 'welcome',
      title: 'Notarial Act Advisor',
      body: stateRule
        ? `State policies for **${stateRule.state}** are loaded from your Admin configuration — answers are state-aware. Ask me anything: "What act for an affidavit?" or "Deed of trust, signer already signed."`
        : `Ask me anything about notarial acts: "What act do I use for an affidavit?" or "Signer already signed the deed — now what?" Configure your state in Admin Settings to get state-specific fee caps and requirements.`,
      act: null, actData: null, stateEnrichment: null,
    },
  }]);

  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [logModal, setLogModal] = useState(null); // { act, actData, stateEnrichment }
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback((text) => {
    const query = (text || input).trim();
    if (!query) return;
    setInput('');
    setMessages(m => [...m, { id: Date.now(), role: 'user', content: query }]);
    setThinking(true);

    setTimeout(() => {
      const response = generateResponse(query, stateRule, feeSchedules, knowledgeArticles);
      setMessages(m => [...m, { id: Date.now() + 1, role: 'assistant', response }]);
      setThinking(false);
    }, 350);
  }, [input, stateRule, feeSchedules, knowledgeArticles]);

  const handleLog = useCallback((act, actData, stateEnrichment) => {
    setLogModal({ act, actData, stateEnrichment });
  }, []);

  const confirmLog = useCallback((actType, signerName, documentDesc) => {
    // Pre-build the journal entry and navigate
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Store prefill in sessionStorage so Journal page can pick it up
    sessionStorage.setItem('journalPrefill', JSON.stringify({
      actType,
      signerName: signerName || '',
      documentDescription: documentDesc || '',
      date: today,
      time: timeNow,
      fee: stateRule?.maxFeePerAct ?? data.journalSettings?.defaultFee ?? 15,
      thumbprintRequired: logModal?.stateEnrichment?.thumbprintRequired ?? false,
      source: 'formGuide',
    }));

    setLogModal(null);
    navigate('/journal');
  }, [stateRule, data.journalSettings, logModal, navigate]);

  const clearChat = () => {
    setMessages([{
      id: 'welcome-2',
      role: 'assistant',
      response: {
        type: 'welcome',
        title: 'Notarial Act Advisor',
        body: 'Chat cleared. Ask me anything.',
        act: null, actData: null, stateEnrichment: null,
      },
    }]);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen bg-slate-50 dark:bg-slate-900">

      {/* ── SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-80 shrink-0 border-r border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/60 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 dark:text-white text-sm">Form Guide</h2>
            <p className="text-[11px] text-slate-500">AI-powered act selector</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <QuickRefPanel onAsk={sendMessage} stateRule={stateRule} />
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700/60 p-4">
          <div className="rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/15 p-3">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">⚠️ Disclaimer</p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-500/80 leading-relaxed">General guidance only. Always verify with your state statutes or NNA Hotline: <strong>1-888-876-0827</strong></p>
          </div>
        </div>
      </aside>

      {/* ── CHAT ── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 dark:text-white text-sm">Notarial Act Advisor</h1>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-slate-500">
                  {stateRule ? `${stateRule.state} policies active` : 'General guidance mode'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={clearChat}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white transition-colors">
            <RotateCcw className="h-3 w-3" />Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 space-y-4 dark:bg-slate-900/50">
          {messages.map(msg => (
            <ChatBubble key={msg.id} msg={msg} onLog={handleLog} />
          ))}

          {thinking && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <Bot className="h-4 w-4 text-blue-400" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-white/[0.03] px-4 py-3.5">
                <div className="flex gap-1.5 items-center">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mobile quick starters */}
          {messages.length <= 1 && !thinking && (
            <div className="lg:hidden pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-3">Common Questions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SCENARIOS.slice(0, 4).map(sc => (
                  <button key={sc.id} onClick={() => sendMessage(sc.question)}
                    className="text-left rounded-xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.02] p-3 hover:border-blue-300 dark:hover:border-blue-500/40 transition-all group">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-300 leading-relaxed">{sc.question}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">{sc.tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 p-4 shrink-0">
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder='Try: "Affidavit" · "Deed of trust, already signed" · "No certificate on form"'
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              style={{ fontSize: 16 }}
            />
            <button type="submit" disabled={!input.trim() || thinking}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {['Deed of trust', 'Affidavit', 'Power of attorney', 'Copy certification', 'No signer ID', 'Loan package'].map(q => (
              <button key={q} onClick={() => sendMessage(q)}
                className="rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/60 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Act Modal */}
      {logModal && (
        <LogActModal
          actKey={logModal.act}
          actData={logModal.actData}
          stateEnrichment={logModal.stateEnrichment}
          onConfirm={confirmLog}
          onClose={() => setLogModal(null)}
        />
      )}
    </div>
  );
}
