// File: src/pages/FormGuide.jsx
// NotaryOS — Form Guidance AI Agent
// Helps notaries identify the correct form and act for any signing scenario.
// Integrated into the app as a standalone page (add to nav + App.jsx routes).

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, Sparkles, BookOpen, ChevronDown, ChevronRight,
  FileText, ShieldCheck, AlertTriangle, Lightbulb, Copy, Check,
  RefreshCw, Star, MapPin, Scale, ScrollText, X, RotateCcw,
  ClipboardList, ArrowRight, Zap, Info,
} from 'lucide-react';
import { useData } from '../context/DataContext';

// ─── FORM KNOWLEDGE BASE ────────────────────────────────────────────────────
// These are built-in instant answers — no API call needed, zero latency.
const FORM_KB = {
  // ── Notarial Acts ──────────────────────────────────────────────────────────
  acknowledgment: {
    title: 'Acknowledgment',
    icon: '📋',
    when: 'The signer is personally present and acknowledges their signature on a previously-signed document, OR signs in front of you.',
    notSuitable: 'Do NOT use when the signer needs to swear/affirm the contents are true.',
    keyFacts: [
      'Signer does NOT re-sign in your presence (they already signed)',
      'You confirm identity and voluntary signing intent',
      'Most common for: deeds, mortgages, powers of attorney',
      'Certificate wording: "acknowledged before me"',
    ],
    stateNotes: 'Most states use URPERA (Uniform Real Property Electronic Recording Act) language. Verify your state\'s specific certificate wording.',
    complianceFlags: ['Confirm signer identity with acceptable ID', 'Signer must be physically present', 'Never backdate'],
  },
  jurat: {
    title: 'Jurat (Verification on Oath)',
    icon: '✋',
    when: 'The signer MUST swear or affirm that the contents of the document are true and correct, AND the signature is made in your presence.',
    notSuitable: 'Do NOT use for real property conveyances or when the signer only needs to acknowledge they signed.',
    keyFacts: [
      'Signer MUST sign in your presence (no pre-signed documents)',
      'You administer an oath or affirmation verbally',
      'Most common for: affidavits, sworn statements, court documents',
      'Certificate wording: "subscribed and sworn before me"',
    ],
    stateNotes: 'Some states call this a "Verification on Oath." Certificate language varies — always use your state\'s exact approved wording.',
    complianceFlags: ['Administer oath/affirmation out loud', 'Signer must sign in front of you', 'Document this act type in journal'],
  },
  'copy-certification': {
    title: 'Copy Certification',
    icon: '📄',
    when: 'Certifying that a copy of an original document is a true, complete, and accurate reproduction.',
    notSuitable: 'Many states PROHIBIT notarizing copies of vital records (birth certificates, death certificates, marriage licenses). Check your state.',
    keyFacts: [
      'You must have the original in front of you',
      'You compare the copy to the original',
      'Most common for: diplomas, contracts, passports (copy only — some states)',
      'Prohibited for vital records in most states',
    ],
    stateNotes: 'CA, TX, FL, NY all restrict copy certification of vital records. Some states do not authorize copy certification at all (e.g., Indiana).',
    complianceFlags: ['Verify state authorization', 'Original must be present', 'Never certify government-issued IDs'],
  },
  'oath-affirmation': {
    title: 'Oath / Affirmation',
    icon: '🤚',
    when: 'Administering a verbal oath or affirmation — not always tied to a document. Used for witnesses, depositions, officials.',
    notSuitable: 'Not for certifying document signatures or contents directly.',
    keyFacts: [
      'Can be performed without any document',
      'Oath: signer swears to God (or deity of choice)',
      'Affirmation: secular alternative, same legal weight',
      'Common for: depositions, public officials taking office',
    ],
    stateNotes: 'Both oath and affirmation have identical legal standing. Always ask the signer which they prefer.',
    complianceFlags: ['Note in journal whether oath or affirmation was given', 'Must be administered verbally'],
  },
  'signature-witnessing': {
    title: 'Signature Witnessing',
    icon: '👁️',
    when: 'You witness the signer personally signing the document, but you do NOT administer an oath and they are not acknowledging a prior signature.',
    notSuitable: 'Not available in all states — check authorization.',
    keyFacts: [
      'Signer MUST sign in your presence',
      'No oath or affirmation involved',
      'Common in: FL, NY, and several other states',
      'Similar to acknowledgment but requires in-person signing',
    ],
    stateNotes: 'Only authorized in states that recognize this act. Confirm your state statutes before using.',
    complianceFlags: ['Verify state authorization', 'Signer signs in your presence'],
  },
};

// ── Common document → act mapping ─────────────────────────────────────────────
const DOC_TO_ACT = [
  { docs: ['deed of trust', 'deed', 'mortgage', 'grant deed', 'quitclaim'], act: 'acknowledgment', confidence: 'High' },
  { docs: ['power of attorney', 'poa', 'healthcare directive', 'living will'], act: 'acknowledgment', confidence: 'High' },
  { docs: ['affidavit', 'sworn statement', 'declaration under penalty'], act: 'jurat', confidence: 'High' },
  { docs: ['i-9', 'employment verification'], act: 'acknowledgment', confidence: 'High' },
  { docs: ['loan package', 'closing disclosure', 'note', 'right to cancel'], act: 'acknowledgment', confidence: 'High', note: 'Individual documents within loan packages may need different acts. Review each page.' },
  { docs: ['birth certificate', 'death certificate', 'marriage license'], act: 'copy-certification', confidence: 'Caution', warning: 'Vital records — many states PROHIBIT copy certification. Verify your state law before proceeding.' },
  { docs: ['diploma', 'degree', 'transcript'], act: 'copy-certification', confidence: 'High', note: 'Educational documents are generally certifiable.' },
  { docs: ['deposition', 'sworn testimony'], act: 'jurat', confidence: 'High' },
  { docs: ['auto title', 'vehicle title'], act: 'acknowledgment', confidence: 'High' },
];

// ── Scenario-based quick answers ───────────────────────────────────────────────
const SCENARIOS = [
  {
    id: 's1',
    question: 'Signer already signed — what act do I use?',
    answer: 'Use an **Acknowledgment**. The signer acknowledges that (1) they signed the document, (2) it was their voluntary act, and (3) they are who they say they are. You confirm their identity with valid ID. No oath is needed.',
    act: 'acknowledgment',
    tag: 'Most common',
  },
  {
    id: 's2',
    question: 'Document is an affidavit or sworn statement',
    answer: 'Use a **Jurat**. The signer MUST sign in your presence and you MUST administer a verbal oath or affirmation. Say: "Do you swear (or affirm) that the contents of this document are true and correct to the best of your knowledge?" Have them sign after they respond.',
    act: 'jurat',
    tag: 'Court/Legal',
  },
  {
    id: 's3',
    question: 'Signer wants a copy of their passport notarized',
    answer: 'Proceed **carefully**. You can certify a copy of the data pages of a US passport in most states (it\'s not a vital record). However, you should NOT certify a copy of government-issued IDs like a driver\'s license. Use a **Copy Certification** act. Check your state statute first.',
    act: 'copy-certification',
    tag: 'Travel docs',
  },
  {
    id: 's4',
    question: 'Loan package has no certificate form — what do I add?',
    answer: 'When a document has no certificate but requires notarization, you attach a **loose certificate** using your state\'s approved wording. Use an Acknowledgment certificate for most loan documents. Never use another state\'s certificate wording or create your own.',
    act: 'acknowledgment',
    tag: 'Loan signing',
  },
  {
    id: 's5',
    question: 'Signer can\'t write — can I notarize?',
    answer: 'Yes, in most states. The signer makes their mark (an X) in your presence. You sign as witness notating "Mark of [name]" next to it, and another witness may be required. This is called notarizing a "signature by mark." Document thoroughly in your journal. Procedures vary by state.',
    act: 'acknowledgment',
    tag: 'Special cases',
  },
  {
    id: 's6',
    question: 'Document is in a foreign language',
    answer: 'You CAN notarize a foreign language document — you are notarizing the person\'s signature, not certifying the translation. However: (1) you cannot certify the translation, (2) the signer should understand what they\'re signing, and (3) your certificate must be in English. Use the appropriate act based on what the document requires.',
    act: 'acknowledgment',
    tag: 'Foreign docs',
  },
];

// ── Red flag patterns ──────────────────────────────────────────────────────────
const RED_FLAGS = [
  { trigger: ['backdate', 'back date', 'wrong date', 'yesterday', 'last week'], message: 'NEVER backdate a notarial certificate. The date must reflect the actual date of notarization. This is fraud and grounds for commission revocation.' },
  { trigger: ['not present', 'not here', 'send the document', 'mail', 'remote', 'fax'], message: 'The signer MUST be physically present (or via RON platform if authorized in your state). You cannot notarize for absent signers via traditional notarization.' },
  { trigger: ['unsure', 'confused', 'don\'t understand', 'not sure'], message: 'When in doubt, do not notarize. Call your state notary hotline or consult the NNA Hotline (1-888-876-0827) before proceeding.' },
  { trigger: ['no id', 'forgot id', 'can\'t verify', 'no identification'], message: 'Without satisfactory evidence of identity, you cannot proceed. Options: credible witness procedure (if your state allows), or reschedule with proper ID.' },
  { trigger: ['sign for', 'sign my', 'sign their', 'proxy', 'on behalf'], message: 'A notary cannot sign on behalf of a signer. The signer must personally sign. You may notarize an attorney-in-fact\'s signature on a Power of Attorney.' },
];

// ─── AI RESPONSE ENGINE ─────────────────────────────────────────────────────
function generateResponse(query, stateCode) {
  const q = query.toLowerCase().trim();

  // Check red flags first
  for (const flag of RED_FLAGS) {
    if (flag.trigger.some(t => q.includes(t))) {
      return {
        type: 'warning',
        title: '⚠️ Stop — Compliance Alert',
        body: flag.message,
        act: null,
        confidence: null,
      };
    }
  }

  // Check document type matches
  for (const entry of DOC_TO_ACT) {
    if (entry.docs.some(d => q.includes(d))) {
      const act = FORM_KB[entry.act];
      return {
        type: entry.confidence === 'Caution' ? 'caution' : 'answer',
        title: `Use: ${act.title}`,
        body: act.when,
        act: entry.act,
        actData: act,
        confidence: entry.confidence,
        note: entry.note,
        warning: entry.warning,
      };
    }
  }

  // Check direct act name queries
  for (const [key, act] of Object.entries(FORM_KB)) {
    if (q.includes(key) || q.includes(act.title.toLowerCase())) {
      return {
        type: 'answer',
        title: act.title,
        body: act.when,
        act: key,
        actData: act,
        confidence: 'High',
      };
    }
  }

  // Scenario keyword matches
  const scenarioMatches = {
    'already signed': 's1', 'pre-signed': 's1', 'signed before': 's1',
    'affidavit': 's2', 'sworn': 's2', 'swear': 's2',
    'passport copy': 's3', 'copy of passport': 's3',
    'no certificate': 's4', 'loose certificate': 's4', 'no notarial': 's4',
    'can\'t write': 's5', 'cannot write': 's5', 'sign with mark': 's5', 'signature by mark': 's5',
    'foreign language': 's6', 'spanish': 's6', 'translated': 's6',
  };
  for (const [kw, sid] of Object.entries(scenarioMatches)) {
    if (q.includes(kw)) {
      const sc = SCENARIOS.find(s => s.id === sid);
      if (sc) return { type: 'scenario', title: sc.question, body: sc.answer, act: sc.act, actData: FORM_KB[sc.act] };
    }
  }

  // Fallback: helpful guide
  return {
    type: 'guide',
    title: 'Let\'s figure out the right act',
    body: 'I couldn\'t find a direct match. Use these questions to determine the correct notarial act:',
    questions: [
      { q: 'Did the signer already sign the document?', yes: 'Likely an Acknowledgment', no: 'They\'ll sign in front of you' },
      { q: 'Does the document require an oath/affirmation?', yes: 'Use a Jurat', no: 'Acknowledgment or Signature Witnessing' },
      { q: 'Are you certifying a copy?', yes: 'Copy Certification (check state auth)', no: 'Not applicable' },
    ],
    act: null,
    confidence: null,
  };
}

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function ActBadge({ act }) {
  const colors = {
    acknowledgment: 'bg-blue-500/15 text-blue-400 border-blue-400/25',
    jurat: 'bg-purple-500/15 text-purple-400 border-purple-400/25',
    'copy-certification': 'bg-emerald-500/15 text-emerald-400 border-emerald-400/25',
    'oath-affirmation': 'bg-amber-500/15 text-amber-400 border-amber-400/25',
    'signature-witnessing': 'bg-cyan-500/15 text-cyan-400 border-cyan-400/25',
  };
  const labels = {
    acknowledgment: 'Acknowledgment',
    jurat: 'Jurat',
    'copy-certification': 'Copy Certification',
    'oath-affirmation': 'Oath / Affirmation',
    'signature-witnessing': 'Signature Witnessing',
  };
  if (!act) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${colors[act] || 'bg-slate-500/15 text-slate-400 border-slate-400/25'}`}>
      <FileText className="h-3 w-3" />{labels[act] || act}
    </span>
  );
}

function ConfidenceBadge({ level }) {
  if (!level) return null;
  const styles = {
    High: 'bg-emerald-500/15 text-emerald-400',
    Medium: 'bg-amber-500/15 text-amber-400',
    Caution: 'bg-rose-500/15 text-rose-400',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${styles[level] || styles.Medium}`}>
      <ShieldCheck className="h-3 w-3" />{level} confidence
    </span>
  );
}

function ActCard({ actKey, actData, onClose }) {
  if (!actData) return null;
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{actData.icon}</span>
            <h4 className="font-black text-white text-base">{actData.title}</h4>
          </div>
          <p className="text-sm text-slate-400">{actData.when}</p>
        </div>
        {onClose && <button onClick={onClose} className="p-1 text-slate-600 hover:text-slate-300"><X className="h-4 w-4" /></button>}
      </div>

      {actData.notSuitable && (
        <div className="mb-4 flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p className="text-xs text-amber-300">{actData.notSuitable}</p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Facts</p>
        <ul className="space-y-1.5">
          {actData.keyFacts.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />{f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4 rounded-xl border border-blue-400/15 bg-blue-400/5 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-300 mb-1">State Notes</p>
        <p className="text-xs text-slate-400">{actData.stateNotes}</p>
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

function ChatBubble({ msg }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(msg.response?.body || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-sm text-white">
          {msg.content}
        </div>
      </div>
    );
  }

  const res = msg.response;
  if (!res) return null;

  const isWarning = res.type === 'warning';
  const isCaution = res.type === 'caution';

  return (
    <div className="flex gap-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isWarning ? 'bg-rose-500/20' : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'}`}>
        {isWarning ? <AlertTriangle className="h-4 w-4 text-rose-400" /> : <Bot className="h-4 w-4 text-blue-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`rounded-2xl rounded-tl-sm border p-4 ${isWarning ? 'border-rose-500/30 bg-rose-500/8' : isCaution ? 'border-amber-500/30 bg-amber-500/8' : 'border-white/[0.08] bg-white/[0.03]'}`}>

          {/* Title + badges */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className={`font-black text-sm ${isWarning ? 'text-rose-300' : 'text-white'}`}>{res.title}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {res.act && <ActBadge act={res.act} />}
                {res.confidence && <ConfidenceBadge level={res.confidence} />}
              </div>
            </div>
            <button onClick={copyText} className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Body — render markdown-ish bold */}
          <div className="text-sm text-slate-300 leading-relaxed">
            {res.body.split('**').map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
            )}
          </div>

          {/* Warning / note */}
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

          {/* Guide mode — decision questions */}
          {res.type === 'guide' && res.questions && (
            <div className="mt-4 space-y-2">
              {res.questions.map((q, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <p className="text-xs font-semibold text-white mb-2">{q.q}</p>
                  <div className="flex gap-2">
                    <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400">Yes → {q.yes}</span>
                    <span className="rounded-lg bg-slate-500/10 px-2.5 py-1 text-[11px] text-slate-400">No → {q.no}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Expandable act detail card */}
          {res.actData && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                {expanded ? 'Hide' : 'Show'} full act details & compliance checklist
              </button>
              {expanded && <ActCard actKey={res.act} actData={res.actData} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── QUICK REFERENCE PANEL ───────────────────────────────────────────────────
function QuickRefPanel({ onAsk }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-4 w-4 text-slate-500" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Reference</p>
      </div>

      {/* Scenarios */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Common Scenarios</p>
        <div className="space-y-1.5">
          {SCENARIOS.map(sc => (
            <button key={sc.id} onClick={() => onAsk(sc.question)}
              className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-400 hover:bg-white/[0.04] hover:border-white/12 hover:text-slate-200 transition-all group">
              <div className="flex items-start justify-between gap-2">
                <span>{sc.question}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-700 group-hover:text-blue-400 transition-colors mt-0.5" />
              </div>
              <span className="mt-1 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-600">{sc.tag}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Acts at a Glance</p>
        <div className="space-y-1">
          {Object.entries(FORM_KB).map(([key, act]) => (
            <button key={key} onClick={() => setExpanded(expanded === key ? null : key)}
              className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] hover:border-white/10 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{act.icon}</span>
                  <span className="text-xs font-semibold text-white">{act.title}</span>
                </div>
                {expanded === key ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}
              </div>
              {expanded !== key && <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">{act.when}</p>}
              {expanded === key && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-400">{act.when}</p>
                  <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2">
                    <p className="text-[11px] text-amber-400">{act.notSuitable}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onAsk(`Tell me about ${act.title}`); }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Zap className="h-3 w-3" />Ask about this act
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

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function FormGuide() {
  const { data } = useData();
  const stateCode = data.settings?.currentStateCode || 'your state';

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      response: {
        type: 'welcome',
        title: 'Form & Act Guidance',
        body: `I help you identify the correct notarial act for any document or situation — fast, so you stay compliant on-site. Ask me anything: "What act do I use for an affidavit?" or "The signer already signed the deed — now what?"`,
        act: null,
        confidence: null,
        actData: null,
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback((text) => {
    const query = (text || input).trim();
    if (!query) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: query };
    setMessages(m => [...m, userMsg]);
    setThinking(true);

    // Simulate brief "thinking" for UX feel (instant response would feel jarring)
    setTimeout(() => {
      const response = generateResponse(query, stateCode);
      setMessages(m => [...m, { id: Date.now() + 1, role: 'assistant', response }]);
      setThinking(false);
    }, 380);
  }, [input, stateCode]);

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      response: {
        type: 'welcome',
        title: 'Form & Act Guidance',
        body: `Chat cleared. Ask me anything about notarial acts, document types, or compliance.`,
        act: null, confidence: null, actData: null,
      },
    }]);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen bg-slate-50 dark:bg-slate-900">

      {/* ── SIDEBAR — Quick Reference ──────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Scale className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-sm">Form Guide</h2>
              <p className="text-[11px] text-slate-500">AI-powered act selector</p>
            </div>
          </div>
          {stateCode !== 'your state' && (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2">
              <MapPin className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Personalized for {stateCode}</span>
            </div>
          )}
        </div>
        <div className="flex-1 p-4">
          <QuickRefPanel onAsk={sendMessage} />
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-3">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">⚠️ Disclaimer</p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-500 leading-relaxed">This tool provides general guidance only. Always verify requirements with your state notary statutes or the NNA Hotline: <strong>1-888-876-0827</strong></p>
          </div>
        </div>
      </aside>

      {/* ── CHAT AREA ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 dark:text-white text-sm">Notarial Act Advisor</h1>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-slate-500">Instant guidance · Always compliant</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearChat} className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              <RotateCcw className="h-3 w-3" />Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 dark:bg-slate-900">
          {messages.map(msg => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}

          {thinking && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <Bot className="h-4 w-4 text-blue-400" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03] px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mobile quick scenarios */}
          {messages.length <= 1 && !thinking && (
            <div className="lg:hidden">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Common Questions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SCENARIOS.slice(0, 4).map(sc => (
                  <button key={sc.id} onClick={() => sendMessage(sc.question)}
                    className="text-left rounded-xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.02] p-3 hover:border-blue-300 dark:hover:border-blue-500/40 transition-all group">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-300">{sc.question}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">{sc.tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder='Ask: "What form for an affidavit?" or "Signer already signed the deed…"'
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              style={{ fontSize: 16 }} // prevent iOS zoom
            />
            <button type="submit" disabled={!input.trim() || thinking}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Deed of trust', 'Affidavit', 'Power of attorney', 'Copy certification', 'No signer ID'].map(q => (
              <button key={q} onClick={() => sendMessage(q)}
                className="rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
