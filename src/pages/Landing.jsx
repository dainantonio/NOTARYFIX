import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Sparkles, BadgeCheck, Bot, Clock3, AlertTriangle,
  XCircle, Wallet, CalendarCheck, FileCheck2, Car, Building2,
  Users, ArrowRight, Check, Zap, TrendingUp,
  Lock, Menu, X, MapPin, Stamp,
} from 'lucide-react';

// ─── DATA ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Features',      id: 'features'     },
  { label: 'How it works',  id: 'how-it-works'  },
  { label: 'Pricing',       id: 'pricing'       },
  { label: 'Early Access',  id: 'waitlist'      },
];

// Agent closeout live demo steps — shown in hero
const AGENT_STEPS = [
  { icon: '📅', label: 'Appointment completed',        status: 'done',    ms: 0    },
  { icon: '🤖', label: 'Agent triggered automatically', status: 'done',    ms: 600  },
  { icon: '📓', label: 'Journal entry drafted',         status: 'done',    ms: 1200 },
  { icon: '🧾', label: 'Invoice generated',             status: 'done',    ms: 1800 },
  { icon: '⚠️', label: 'Compliance check passed',       status: 'pass',    ms: 2400 },
  { icon: '✅', label: 'Awaiting your approval',        status: 'pending', ms: 3000 },
];

const STATS = [
  { val: '~90 sec', label: 'Avg Closeout Draft' },
  { val: '24/7',   label: 'Auto Post-Appointment Closeouts' },
  { val: '50',     label: 'States Supported' },
  { val: '256',    label: 'Agent Drafts This Week (Beta)' },
];

const ROLE_PROFILES = {
  mobile: { label: 'Mobile Notary',      weekly: 12, avgRevenue: 1450, adminCut: '9.5 agent hrs recovered/wk'  },
  loan:   { label: 'Loan Signing Agent', weekly: 18, avgRevenue: 2400, adminCut: '14.2 agent hrs recovered/wk' },
  agency: { label: 'Signing Agency',     weekly: 35, avgRevenue: 6200, adminCut: '32.8 agent hrs recovered/wk' },
};

const OLD_WAY = [
  { title: 'Lost Invoices',    desc: 'Tracking payments in Excel or paper logs leads to missed revenue.',  icon: XCircle      },
  { title: 'Compliance Risks', desc: 'Guessing fees or ID rules can cost you your commission.',            icon: AlertTriangle },
  { title: 'Admin Overload',   desc: 'Spending hours manually entering journal data after every signing.', icon: Clock3       },
];
const NEW_WAY = [
  { title: 'Agent-Drafted Invoices', desc: 'Your agent drafts professional invoices automatically after each completed appointment.', icon: Check },
  { title: 'Agent-Assisted Journaling', desc: 'Your agent prepares compliant journal drafts with state-specific prompts ready for review.', icon: Check },
  { title: 'Active Compliance Guardrails', desc: 'Your agent flags fee, ID, and act-level risks using grounded 50-state policy records.', icon: Check },
  { title: 'Agent-Ready Team Dispatch', desc: 'Coordinate multi-notary teams while agent drafts keep closeout workflows consistent.', icon: Check },
];

const HOW_STEPS = [
  { step: '01', title: 'Book the Job', desc: 'Capture signer details with Smart Fill and templates.', icon: CalendarCheck },
  { step: '02', title: 'Complete Signing', desc: 'Handle the appointment with guided compliance checks.', icon: FileCheck2 },
  { step: '03', title: 'Agent Closes Out', desc: 'AI Closeout Agent drafts journal + invoice and flags risks.', icon: Bot },
  { step: '04', title: 'Approve & Get Paid', desc: 'Review, approve, and send with one click.', icon: Wallet },
];

const BUSINESS_MODELS = [
  { title: 'Mobile Notaries',     desc: 'Run route-based signings, capture compliant entries on-site, and finish admin from desktop.',  icon: Car,       color: 'text-cyan-400',    bg: 'bg-cyan-400/10'    },
  { title: 'Loan Signing Agents', desc: 'Manage high-volume closings with reliable documentation, invoicing, and audit-ready workflows.',icon: Building2, color: 'text-violet-400',  bg: 'bg-violet-400/10'  },
  { title: 'Signing Agencies',    desc: 'Coordinate team dispatch, centralize records, and scale with standardized processes.',          icon: Users,     color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

const PRICING = [
  {
    name: 'Starter', price: 0,  yearly: 0,  sub: 'For the part-time notary.',
    features: ['5 Appointments/mo', 'Basic Journal', 'Client Management', 'Local Storage'],
    cta: 'Try Demo Free', highlight: false,
  },
  {
    name: 'Pro', price: 29, yearly: 23, sub: 'For the full-time professional.',
    features: ['Unlimited Appointments', 'AI Closeout Agent', 'Signer Portal', 'GPS Mileage Tracking', 'Invoice Automation', 'Cloud Backup', 'Unified Dark UI'],
    cta: 'Start 14-Day Trial', highlight: true, badge: 'Most Popular',
  },
  {
    name: 'Agency', price: 79, yearly: 63, sub: 'For scaling operations.',
    features: ['Everything in Pro', 'Team Dispatch Board', 'Multi-Notary Routing', 'SLA Tracking', 'Admin Control Center', 'Dedicated Manager', 'Standardized UI System'],
    cta: 'Contact Sales', highlight: false,
  },
];

const COMPARE_ROWS = [
  { feature: 'Appointments per month', starter: '5',         pro: 'Unlimited',              agency: 'Unlimited + team routing', proHighlight: true  },
  { feature: 'Journal workflows',      starter: 'Basic',     pro: '✓ Advanced + templates', agency: '✓ Team oversight',         proHighlight: true  },
  { feature: 'Storage & sync',         starter: 'Local only',pro: 'Cloud sync + backups',   agency: 'Cloud sync + multi-user',  proHighlight: true  },
  { feature: 'AI closeout agent',      starter: '—',         pro: '✓ Included',             agency: '✓ Included',               proHighlight: true  },
  { feature: 'API access',             starter: '—',         pro: '—',                      agency: '✓ Included',               proHighlight: false },
  { feature: 'Interface consistency', starter: 'Core layout', pro: '✓ Unified hero + spacing', agency: '✓ Unified + team surfaces', proHighlight: true  },
  { feature: 'Best for',               starter: 'Getting started', pro: 'Full-time solo notary', agency: 'Growing signing teams', proHighlight: true },
];

const FAQ = [
  { q: 'What are the core services of NotaryOS?', a: 'NotaryOS provides an AI notary agent for appointment closeout, plus scheduling, journaling, invoicing, and compliance controls. Agency adds team dispatch and multi-notary coordination.' },
  { q: 'How does the AI Closeout Agent work?', a: 'Our AI is grounded in 50-state jurisdiction policy records. It provides real-time guidance on fee caps, ID requirements, and state-specific notarial acts, then drafts next-step closeout actions so every signing stays compliant.' },
  { q: 'Can I manage my entire team on NotaryOS?', a: 'Yes. The Agency plan includes a centralized Dispatch Board, SLA tracking, and standardized UI for all team members, ensuring consistent service quality across your entire operation.' },
  { q: 'Is my data and signer information secure?', a: 'Security is our priority. We use AES-256 encryption at rest, TLS 1.3 in transit, and maintain strict data isolation. Signer data is never shared or sold.' },
  { q: 'Does it work for mobile notaries in the field?', a: 'Absolutely. NotaryOS is mobile-first and supports offline data capture. Your journal entries and appointment updates sync automatically once you&apos;re back online.' },
  { q: 'Can I switch plans or cancel anytime?', a: 'Yes. You can upgrade, downgrade, or cancel your subscription at any time from your settings. Your data remains accessible according to your plan tier.' },
  { q: 'How much time does the agent actually save?', a: 'Based on role profiles: Mobile Notaries recover ~9.5 agent hours per week, Loan Signing Agents recover ~14.2 hrs, and Signing Agencies recover 32+ hrs across their team. That\'s time the agent spends on closeouts, journaling, and invoicing — not you.' },
];

const TRUST_ITEMS = [
  { icon: Lock,        label: '100% Local Privacy'  },
  { icon: Sparkles,    label: 'AI Closeout Agent'    },
  { icon: BadgeCheck,  label: '50-State Workflows'   },
  { icon: ShieldCheck, label: 'No Credit Card Needed'},
];

const FOOTER_CONTENT = {
  terms: {
    title: 'Terms of Use',
    body: `Effective: January 1, 2025\n\n1. Acceptance. By using NotaryOS, you agree to these Terms. If you disagree, do not use the service.\n\n2. License. We grant you a limited, non-exclusive, non-transferable license to use NotaryOS for lawful notary business purposes only.\n\n3. Prohibited Use. You may not reverse engineer, resell, or use NotaryOS to facilitate fraud, identity theft, or any unlawful notarial act.\n\n4. Legal Disclaimer. NotaryOS provides workflow software, not legal counsel. Always confirm your state notarial statutes, fee caps, and journal retention requirements.\n\n5. Termination. We may terminate accounts violating these Terms without notice. You may cancel at any time.\n\n6. Limitation of Liability. NotaryOS shall not be liable for indirect, incidental, or consequential damages arising from use of the service.\n\nQuestions? legal@notaryos.com`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `1. Data We Collect. We collect information you provide (name, email, business details) and usage data to improve the product.\n\n2. How We Use It. Your data powers your NotaryOS workspace, compliance features, and customer support. We never sell your data to third parties.\n\n3. Signer Data. Signer information is fully isolated and private. It is not shared, analyzed, or sold under any circumstances.\n\n4. Security. We use encrypted transport (TLS 1.3), role-based access controls, and least-privilege principles throughout our infrastructure.\n\n5. Your Rights. You may request access, correction, or deletion of your data at any time. Contact privacy@notaryos.com.\n\n6. Cookies. We use only functional session cookies. No advertising or tracking cookies.`,
  },
  security: {
    title: 'Security at NotaryOS',
    body: `NotaryOS is built with a security-first architecture:\n\n• Encryption in transit — All data transmitted over TLS 1.3\n• Encrypted at rest — AES-256 for all stored data\n• Role-based access — Least-privilege model across all user roles\n• SOC 2 Type II — Certified compliance program\n• Isolated signer data — Journal records never cross user boundaries\n• Regular audits — Third-party penetration testing quarterly\n\nReport security issues to security@notaryos.com`,
  },
  contact: {
    title: 'Contact Us',
    body: `General: hello@notaryos.com\nSupport: support@notaryos.com\nLegal: legal@notaryos.com\nSecurity: security@notaryos.com\nAgency Sales: sales@notaryos.com\n\nFor agency pricing, team onboarding, or custom integrations, contact our sales team — we respond within one business day.`,
  },
  about: {
    title: 'About NotaryOS',
    body: `NotaryOS is built by a team who believe notary professionals deserve enterprise-grade tools without enterprise complexity.\n\nWe started with a simple question: why are notaries still running their businesses out of spreadsheets and paper logs in 2025? No one had built something good enough — so we did.\n\nOur team includes former notaries, compliance attorneys, and product engineers who have spent years studying where notary workflows break down in the field.\n\nWe are headquartered in Columbus, Ohio, and proudly serve notaries across all 50 states.`,
  },
  cookies: {
    title: 'Cookie Policy',
    body: `NotaryOS uses only functional cookies necessary to operate the service.\n\nSession cookies: Maintain your login state and workspace preferences.\n\nWe do not use:\n• Advertising or tracking cookies\n• Third-party analytics that share data\n• Fingerprinting or behavioral tracking\n\nYou can disable cookies in your browser settings, though this may affect core functionality.`,
  },
};

const SAMPLE_NOTARY_JSON = {
  AL: { state: 'Alabama', fees: { acknowledgment: '$5.00', jurat: '$5.00', oath: '$5.00' }, id_requirements: { credible_witnesses: 'Allowed', expired_id_rule: 'Not specified' }, red_flags: ['No Notarios'] },
  CA: { state: 'California', fees: { acknowledgment: '$15.00', jurat: '$15.00', oath: '$15.00' }, id_requirements: { credible_witnesses: '1 known OR 2 with ID', expired_id_rule: '5 years' }, red_flags: ['Thumbprint mandatory for Deeds/POA'] },
  OH: { state: 'Ohio', fees: { acknowledgment: '$5.00', jurat: '$5.00', oath: '$5.00' }, id_requirements: { credible_witnesses: 'Allowed', expired_id_rule: 'Not specified' }, red_flags: ['Conflict of Interest'] },
  TX: { state: 'Texas', fees: { acknowledgment: '$6.00', jurat: '$6.00', oath: '$6.00' }, id_requirements: { credible_witnesses: 'Allowed', expired_id_rule: 'Current' }, red_flags: ['No Notarios'] },
};

const findStateRecord = (input) => {
  const ql = input.toLowerCase();
  return Object.values(SAMPLE_NOTARY_JSON).find((r) => ql.includes(r.state.toLowerCase())) || null;
};

const answerAI = (q) => {
  const ql = q.toLowerCase();
  const state = findStateRecord(q);

  if (state && (ql.includes('fee') || ql.includes('jurat') || ql.includes('acknowledg') || ql.includes('oath'))) {
    return `${state.state} policy: acknowledgment ${state.fees.acknowledgment}, jurat ${state.fees.jurat}, oath ${state.fees.oath}.`;
  }
  if (state && (ql.includes('id') || ql.includes('identification') || ql.includes('expired'))) {
    return `${state.state} policy: credible witnesses ${state.id_requirements.credible_witnesses}; expired ID rule ${state.id_requirements.expired_id_rule}.`;
  }
  if (state && (ql.includes('red flag') || ql.includes('warning') || ql.includes('risk'))) {
    return `${state.state} red flags: ${state.red_flags.join('; ')}.`;
  }
  if (ql.includes('ron')) return 'RON requires KBA or credential analysis identity proofing, plus state-approved audio-video technology.';
  if (ql.includes('mileage') || ql.includes('mile')) return 'IRS mileage rate 2025: 67¢/mile. Log start/end odometer and route purpose for each trip.';
  if (ql.includes('json') || ql.includes('dataset')) return 'NotaryOS AI demo is grounded to sample jurisdiction policy records and mirrors the same structure used by Admin imports.';
  return 'Ask a state-specific question like “California jurat fee”, “Texas expired ID rule”, or “Ohio red flags” to see grounded answers.';
};

// ─── TELEMETRY ──────────────────────────────────────────────────────────────────
// Lightweight phase-3 telemetry — persisted to localStorage only (no network calls)
const TELEMETRY_KEY = 'notaryos_landing_events';
const track = (event, props = {}) => {
  try {
    const existing = JSON.parse(localStorage.getItem(TELEMETRY_KEY) || '[]');
    existing.push({ event, ts: new Date().toISOString(), ...props });
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(existing));
  } catch (_) { /* fail silently */ }
};

// ─── COMPONENT ─────────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();

  const [profile,        setProfile]        = useState('mobile');
  const [aiInput,        setAiInput]        = useState("What's the fee for a jurat in California?");
  const [aiOutput,       setAiOutput]       = useState(answerAI("What's the fee for a jurat in California?"));
  const [aiTyping,       setAiTyping]       = useState(false);
  const [beforeAfter,    setBeforeAfter]    = useState('old');
  const [weeklyApts,     setWeeklyApts]     = useState(8);
  const [adminMins,      setAdminMins]      = useState(20);
  const [hourlyRate,     setHourlyRate]     = useState(50);
  const [billing,        setBilling]        = useState('monthly');
  const [compSignings,   setCompSignings]   = useState(30);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [footerModal,    setFooterModal]    = useState(null);
  const [activeNav,      setActiveNav]      = useState('');
  const [focusedPhone,   setFocusedPhone]   = useState('route');
  const [hlInvoice,      setHlInvoice]      = useState(null);
  const [waitlistEmail,  setWaitlistEmail]  = useState('');
  const [waitlistRole,   setWaitlistRole]   = useState('mobile');
  const [waitlistDone,   setWaitlistDone]   = useState(false);
  const [waitlistLoading,setWaitlistLoading]= useState(false);
  const [agentStepsVisible, setAgentStepsVisible] = useState([false, false, false, false, false, false]);

  // Animate agent steps on mount
  useEffect(() => {
    AGENT_STEPS.forEach((step, i) => {
      setTimeout(() => {
        setAgentStepsVisible(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, step.ms + 400);
    });
  }, []);

  const trackEvent = (eventName, meta = {}) => {
    try {
      const key = 'notaryos_landing_events';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [...existing, { eventName, meta, ts: new Date().toISOString() }].slice(-200);
      localStorage.setItem(key, JSON.stringify(next));
    } catch (_) {
      // no-op telemetry fallback
    }
  };

  const activeProfile = ROLE_PROFILES[profile];
  const painPoints    = beforeAfter === 'old' ? OLD_WAY : NEW_WAY;

  const savedHours = useMemo(() => {
    const old = (weeklyApts * adminMins * 52) / 60;
    const opt = (weeklyApts * 5 * 52) / 60;
    return Math.max(0, Math.round(old - opt));
  }, [weeklyApts, adminMins]);
  const savedValue  = savedHours * hourlyRate;
  const stackCost   = Math.round(compSignings * 4.5 + 89);
  const nosCost     = billing === 'monthly' ? 29 : 23;
  const savings     = Math.max(0, stackCost - nosCost);

  // AI submit
  const submitAI = (source = 'ai_demo') => {
    if (!aiInput.trim()) return;
    trackEvent('landing_ai_query_submitted', { queryLength: aiInput.trim().length, source });
    setAiTyping(true);
    setAiOutput('');
    setTimeout(() => { setAiOutput(answerAI(aiInput)); setAiTyping(false); }, 650);
  };

  // FAQ Guide state
  const [faqInput,   setFaqInput]   = useState('');
  const [faqOutput,  setFaqOutput]  = useState('');
  const [faqTyping,  setFaqTyping]  = useState(false);

  // Chips are fully self-contained — answers are inline strings, no FAQ array dependency
  const FAQ_STARTER_CHIPS = [
    {
      label: 'How does the AI closeout agent work?',
      answer: "The moment you mark an appointment complete, the agent triggers automatically: it drafts your journal, generates a compliant invoice, flags any fee or ID-level risks, and queues everything for your approval. Supervised Mode by default — flip to Autonomous when you're ready to go hands-free.",
    },
    {
      label: 'Can I manage a team of notaries?',
      answer: 'Yes. The Agency plan includes a centralized Dispatch Board, SLA tracking, and standardized UI for all team members, ensuring consistent service quality across your entire operation.',
    },
    {
      label: 'What states are supported?',
      answer: 'All 50 states. Every state has its own configured fee caps, required journal fields, ID rules, and conditional requirements (like California\'s thumbprint law for deeds). Your primary state is set during onboarding and drives all compliance defaults.',
    },
    {
      label: 'How much time does the agent save?',
      answer: 'Mobile Notaries recover ~9.5 agent hours per week, Loan Signing Agents recover ~14.2 hrs, and Signing Agencies recover 32+ hrs across their team. That\'s time the agent spends on closeouts, journaling, and invoicing — not you.',
    },
    {
      label: 'Is my signer data secure?',
      answer: 'Yes. NotaryOS uses AES-256 encryption at rest, TLS 1.3 in transit, and strict data isolation. Signer data is never shared or sold under any circumstances.',
    },
    {
      label: 'Can I cancel anytime?',
      answer: 'Yes. You can upgrade, downgrade, or cancel your subscription at any time from your settings. Your data remains accessible according to your plan tier.',
    },
  ];

  const submitFaqGuide = (chip, source = 'faq_guide') => {
    // chip is either a FAQ_STARTER_CHIPS object (has .label + .answer) or null (freeform)
    const query = chip ? chip.label : faqInput.trim();
    if (!query) return;
    setFaqInput(query);
    track('ai_query_submitted', { query: query.slice(0, 120), source });
    setFaqTyping(true);
    setFaqOutput('');
    // Use pre-mapped answer for chips; fall back to answerAI for freeform
    const answer = chip ? chip.answer : answerAI(query);
    setTimeout(() => { setFaqOutput(answer); setFaqTyping(false); }, 600);
  };

  // Smooth scroll + close mobile menu
  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Nav highlight on scroll
  useEffect(() => {
    const sections = ['features', 'how-it-works', 'pricing', 'faq', 'waitlist'];
    const handler = () => {
      let current = '';
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 130) current = id;
      });
      setActiveNav(current);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const seen = new Set();
    const ids = ['features', 'how-it-works', 'pricing', 'waitlist'];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !seen.has(entry.target.id)) {
          seen.add(entry.target.id);
          trackEvent('landing_section_viewed', { section: entry.target.id });
        }
      });
    }, { threshold: 0.35 });

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Invoice highlight pulse
  const handleInvoiceClick = (id, amt) => {
    setHlInvoice(id);
    setTimeout(() => setHlInvoice(null), 1600);
  };

  // Waitlist submit — stores locally + could POST to a backend
  const handleWaitlist = (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistLoading(true);
    trackEvent('landing_waitlist_submitted', { role: waitlistRole });
    // Store in localStorage so entries survive page refresh during demo
    const existing = JSON.parse(localStorage.getItem('notaryos_waitlist') || '[]');
    existing.push({ email: waitlistEmail.trim(), role: waitlistRole, ts: new Date().toISOString() });
    localStorage.setItem('notaryos_waitlist', JSON.stringify(existing));
    setTimeout(() => { setWaitlistLoading(false); setWaitlistDone(true); }, 800);
  };

  return (
    <div className="min-h-screen bg-[#060d1b] text-white antialiased" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',backgroundSize:'44px 44px'}}>

      {/* ══ NAV ═══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#060d1b]/95 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05)]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-[#060d1b] shadow-lg shadow-cyan-500/30">N</div>
            <div className="leading-none text-left">
              <p className="text-sm font-bold tracking-tight text-white">NotaryOS</p>
              <p className="text-[10px] text-slate-400">AI Notary Agent</p>
            </div>
          </button>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(link => (
              <button key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeNav === link.id ? 'bg-white/8 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                {link.label}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/auth" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">Log in</Link>
            <button onClick={() => scrollTo('waitlist')}
              className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300 transition-all hover:bg-cyan-400/20">
              Join Waitlist
            </button>
            <Link to="/auth" onClick={() => trackEvent('landing_cta_live_demo', { location: 'nav' })}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 hover:shadow-cyan-500/40">
              Open Live Demo
            </Link>
          </div>

          {/* Mobile burger */}
          <button onClick={() => setMobileMenuOpen(p => !p)} className="rounded-lg p-2 text-slate-400 md:hidden">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="bg-[#060d1b] px-6 py-4 md:hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map(link => (
                <button key={link.id} onClick={() => scrollTo(link.id)}
                  className="text-left text-sm font-medium text-slate-300 transition-colors hover:text-white">
                  {link.label}
                </button>
              ))}
              <Link to="/auth" onClick={() => { trackEvent('landing_cta_live_demo', { location: 'mobile_menu' }); setMobileMenuOpen(false); }}
                className="mt-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-center text-sm font-bold text-white">
                See Agent Closeout
              </Link>
              <button onClick={() => { setMobileMenuOpen(false); scrollTo('waitlist'); }}
                className="rounded-lg border border-cyan-400/30 bg-cyan-400/8 px-4 py-3 text-center text-sm font-bold text-cyan-300">
                Join Waitlist
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#060d1b]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-600/8 blur-[140px]" />
          <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-blue-600/8 blur-[120px]" />
          <div className="absolute left-0 bottom-0 h-[300px] w-[300px] rounded-full bg-violet-600/6 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 md:pt-32">

          {/* Badge */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              AI Notary Agent · 2025
            </span>
          </div>

          {/* H1 — agent outcome first */}
          <h1 className="mx-auto max-w-5xl text-center text-5xl font-black leading-[1.02] tracking-tight md:text-7xl lg:text-[5.5rem]">
            Meet your AI notary agent.<br />
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Appointments close themselves.
            </span>
            <br />Your agent handles the rest.
          </h1>

          {/* Subtext — explicit agent actions */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-slate-400 md:text-xl">
            After every signing, NotaryOS automatically drafts your journal, generates your invoice, and flags compliance risks in seconds.
          </p>

          {/* CTAs — agent demo primary */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => { trackEvent('landing_cta_agent_closeout', { location: 'hero' }); navigate('/auth'); }}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-cyan-500/25 transition-all hover:brightness-110 hover:shadow-cyan-500/40 active:scale-[.98]">
              See Agent Closeout
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button onClick={() => { trackEvent('landing_cta_waitlist', { location: 'hero' }); scrollTo('waitlist'); }}
              className="rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10">
              Open Live Demo
            </button>
          </div>

          {/* Trust chips — directly under CTAs */}
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-400">
                <Icon className="h-4 w-4 shrink-0 text-cyan-400" /><span>{label}</span>
              </div>
            ))}
          </div>

          {/* ── Agent Closeout Live Preview ─────────────────────────────────── */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Agent Preview</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1525]/80 backdrop-blur-sm p-6 shadow-2xl shadow-black/40">
              {/* Agent header */}
              <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/20">
                    <Bot className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">NotaryOS AI Notary Agent</p>
                    <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Running · Loan Signing · Sarah Johnson
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  Supervised Mode
                </span>
              </div>

              {/* Animated steps */}
              <div className="space-y-2.5">
                {AGENT_STEPS.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500"
                    style={{
                      opacity: agentStepsVisible[i] ? 1 : 0,
                      transform: agentStepsVisible[i] ? 'translateY(0)' : 'translateY(8px)',
                      borderColor: step.status === 'pending'
                        ? 'rgba(34,211,238,0.3)'
                        : step.status === 'pass'
                        ? 'rgba(52,211,153,0.2)'
                        : 'rgba(255,255,255,0.06)',
                      background: step.status === 'pending'
                        ? 'rgba(34,211,238,0.05)'
                        : step.status === 'pass'
                        ? 'rgba(52,211,153,0.04)'
                        : 'rgba(255,255,255,0.02)',
                    }}>
                    <span className="text-base">{step.icon}</span>
                    <span className={`flex-1 text-sm font-medium ${
                      step.status === 'pending' ? 'text-cyan-300' :
                      step.status === 'pass' ? 'text-emerald-300' : 'text-slate-300'
                    }`}>
                      {step.label}
                    </span>
                    {step.status === 'done' && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">Done</span>
                    )}
                    {step.status === 'pass' && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">✓ Pass</span>
                    )}
                    {step.status === 'pending' && (
                      <span className="text-[10px] font-bold text-cyan-300 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-2 py-0.5 animate-pulse">Pending Review</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Approve / Edit row */}
              <div className="mt-4 flex items-center gap-3 border-t border-white/[0.06] pt-4">
                <button
                  onClick={() => navigate('/auth')}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110">
                  Approve &amp; Close Job
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10">
                  Edit Draft
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  className="rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-300">
                  Reject
                </button>
              </div>
            </div>
          </div>

          {/* Role selector */}
          <div className="mx-auto mt-14 max-w-4xl">
            <div className="mb-3 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Select your role to see agent impact</p>
            </div>
            <div className="mb-5 flex justify-center">
              <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
                {Object.entries(ROLE_PROFILES).map(([key, p]) => (
                  <button key={key} onClick={() => setProfile(key)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${profile === key ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Weekly Signings',        val: String(activeProfile.weekly),                      accent: 'border-cyan-500/30 bg-cyan-500/5'    },
                { label: 'Revenue Potential',       val: `$${activeProfile.avgRevenue.toLocaleString()}/wk`, accent: 'border-blue-500/30 bg-blue-500/5'    },
                { label: 'Agent Hours Recovered',   val: activeProfile.agentRecovery,                       accent: 'border-violet-500/30 bg-violet-500/5' },
              ].map(card => (
                <div key={card.label} className={`rounded-2xl border ${card.accent} p-4 text-center`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                  <p className="mt-2 text-lg font-black text-white sm:text-2xl">{card.val}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══ STATS BAR ═════════════════════════════════════════════════════════ */}
      <section className="bg-[#0a1525] py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-white md:text-4xl">{s.val}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AI COACH ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#060d1b] py-24">
        <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">AI Closeout Agent</span>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Your compliance agent,{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">grounded in state law.</span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">Ask anything — fee caps, ID rules, thumbprint requirements, RON statutes. Your agent knows all 50 states cold.</p>
            <p className="mt-3 text-sm font-medium text-cyan-300/80 border-l-2 border-cyan-400/40 pl-3">NotaryOS doesn't just answer questions — it prepares the next compliant actions automatically.</p>
            <div className="mt-8 flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5">
              <input className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                value={aiInput} onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitAI('ai_demo')}
                placeholder="Ask anything about notary compliance..." />
              <button onClick={() => submitAI('ai_demo')} className="shrink-0 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white">Ask AI</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["California jurat fee", "Texas expired ID rule", "Ohio red flags", "Dataset source?"].map(q => (
                <button key={q} onClick={() => { setAiInput(q); setTimeout(() => submitAI('ai_demo_quick'), 50); }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-400 transition-colors hover:border-cyan-400/30 hover:text-cyan-300">
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0d1a2e] p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15">
                <Stamp className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">NotaryOS AI Agent</p>
                <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Active · Answering instantly
                </p>
                <p className="text-[11px] text-slate-400">Grounded in 50-state jurisdiction policy</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
                  {aiInput || 'Ask your question'}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/15">
                  <Stamp className="h-4 w-4 text-cyan-400" />
                </div>
                <div className={`rounded-2xl rounded-tl-sm border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition-opacity duration-300 ${aiTyping ? 'opacity-40' : 'opacity-100'}`}>
                  {aiTyping
                    ? <span className="flex gap-1 py-1">
                        {[0, 150, 300].map(d => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />)}
                      </span>
                    : aiOutput}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ══ BEFORE / AFTER + CALCULATOR ═══════════════════════════════════════ */}
      <section id="features" className="bg-[#0a1525] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex rounded-full border border-rose-400/25 bg-rose-400/8 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-300">Before &amp; After</span>
              <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">Stop doing it the hard way.</h2>
              <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
                <button onClick={() => setBeforeAfter('old')}
                  className={`rounded-lg px-5 py-2 font-semibold transition-all ${beforeAfter === 'old' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'}`}>
                  The Old Way
                </button>
                <button onClick={() => setBeforeAfter('new')}
                  className={`rounded-lg px-5 py-2 font-semibold transition-all ${beforeAfter === 'new' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}>
                  With NotaryOS
                </button>
              </div>
              <div className="mt-6 space-y-3">
                {painPoints.map(({ title, desc, icon: Icon }) => (
                  <div key={title} className={`flex gap-4 rounded-2xl border p-5 transition-all ${beforeAfter === 'old' ? 'border-rose-500/20 bg-rose-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${beforeAfter === 'old' ? 'bg-rose-500/15' : 'bg-emerald-500/15'}`}>
                      <Icon className={`h-5 w-5 ${beforeAfter === 'old' ? 'text-rose-400' : 'text-emerald-400'}`} />
                    </div>
                    <div><p className="font-bold text-white">{title}</p><p className="mt-1 text-sm text-slate-400">{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Time calculator */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1a2e] p-7 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Calculate Your Lost Time</p>
              <h3 className="mt-2 text-2xl font-black text-white">How much are inefficiencies costing you?</h3>
              <div className="mt-7 space-y-6">
                {[
                  { label: 'Weekly Appointments', val: weeklyApts,  set: setWeeklyApts, min: 1,  max: 40,  step: 1,  fmt: v => `${v}`   },
                  { label: 'Admin Mins Per Appt',  val: adminMins,  set: setAdminMins,  min: 5,  max: 60,  step: 5,  fmt: v => `${v}m`  },
                  { label: 'Your Hourly Value',    val: hourlyRate, set: setHourlyRate, min: 25, max: 150, step: 5,  fmt: v => `$${v}`  },
                ].map(s => (
                  <div key={s.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-300">{s.label}</span>
                      <span className="font-bold text-cyan-400">{s.fmt(s.val)}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                      onChange={e => s.set(Number(e.target.value))} className="w-full accent-cyan-400" />
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6 text-center">
                <p className="text-sm text-slate-400">You could reclaim</p>
                <p className="mt-1 text-6xl font-black text-white">{savedHours}<span className="text-2xl font-bold text-slate-400"> hrs/yr</span></p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/8 px-4 py-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">That&apos;s ${savedValue.toLocaleString()} in billable time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PHONE MOCKUPS ═════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Phones */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-72 w-72 rounded-full bg-cyan-600/8 blur-3xl" />
            </div>
            <div className="relative flex items-start gap-5" style={{ zIndex: 2 }}>
              {/* Phone 1 — Route */}
              <div
                onClick={() => setFocusedPhone('route')}
                className="cursor-pointer transition-all duration-300"
                style={{ transform: focusedPhone === 'route' ? 'rotate(-6deg) translateY(8px) scale(1.06)' : 'rotate(-6deg) translateY(8px) scale(0.94)', zIndex: focusedPhone === 'route' ? 5 : 1 }}>
                {/* Phone shell */}
                <div className="relative" style={{ width: 188, background: 'linear-gradient(170deg,#18202e,#0e1422)', borderRadius: 42, border: '1.5px solid rgba(255,255,255,0.11)', boxShadow: '0 0 0 1px rgba(0,0,0,.6),0 40px 80px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.1)' }}>
                  {/* Side buttons via absolute divs */}
                  <div style={{ position:'absolute',left:-3,top:76,width:3,height:26,background:'#1e2738',borderRadius:'2px 0 0 2px' }} />
                  <div style={{ position:'absolute',right:-3,top:98,width:3,height:52,background:'#1e2738',borderRadius:'0 2px 2px 0' }} />
                  {/* Screen */}
                  <div style={{ margin:8, borderRadius:34, background:'#090e1c', overflow:'hidden', minHeight:382 }}>
                    {/* Dynamic island */}
                    <div style={{ position:'relative',display:'flex',justifyContent:'center',paddingTop:9 }}>
                      <div style={{ width:90,height:22,background:'#090e1c',borderRadius:20,border:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                        <div style={{ width:8,height:8,borderRadius:'50%',background:'#0c0c0c',border:'1px solid rgba(255,255,255,.04)' }} />
                        <div style={{ width:3,height:3,borderRadius:'50%',background:'#142030',boxShadow:'0 0 4px rgba(34,211,238,.4)' }} />
                      </div>
                    </div>
                    {/* Status bar */}
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 14px 5px',fontSize:9,fontWeight:700,color:'rgba(255,255,255,.55)' }}>
                      <span style={{ fontSize:11,fontWeight:700,letterSpacing:'-.2px' }}>9:41</span>
                      <span style={{ fontSize:8 }}>▲▲ WiFi 🔋</span>
                    </div>
                    {/* Content */}
                    <div style={{ padding:'3px 12px 14px' }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9 }}>
                        <span style={{ fontSize:12,fontWeight:800,color:'#fff' }}>Today&apos;s Route</span>
                        <span style={{ fontSize:8,fontWeight:800,padding:'2px 7px',borderRadius:999,background:'rgba(34,211,238,.15)',color:'#22d3ee',border:'1px solid rgba(34,211,238,.2)' }}>● Live</span>
                      </div>
                      {[
                        { name:'Sarah Johnson', time:'10:00 AM · Loan',  dot:'#4ade80', badge:'Done',  bc:'rgba(16,185,129,.15)',   tc:'#6ee7b7' },
                        { name:'Mike Chen',     time:'2:00 PM · GNW',    dot:'#22d3ee', badge:'Next',  bc:'rgba(34,211,238,.15)',   tc:'#22d3ee' },
                        { name:'Linda Rivera',  time:'4:30 PM · I-9',    dot:'#64748b', badge:'Later', bc:'rgba(100,116,139,.15)', tc:'#94a3b8' },
                      ].map(r => (
                        <div key={r.name} style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',borderRadius:9,padding:'7px 9px',marginBottom:5,cursor:'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(34,211,238,.07)'}
                          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.04)'}>
                          <div style={{ width:5,height:5,borderRadius:'50%',background:r.dot,flexShrink:0 }} />
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:10,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{r.name}</div>
                            <div style={{ fontSize:8,color:'#64748b',marginTop:1 }}>{r.time}</div>
                          </div>
                          <span style={{ fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:999,background:r.bc,color:r.tc,flexShrink:0 }}>{r.badge}</span>
                        </div>
                      ))}
                      <div style={{ background:'rgba(255,255,255,.04)',borderRadius:8,padding:'7px 9px',marginTop:3 }}>
                        <div style={{ fontSize:8,color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em' }}>Today&apos;s progress</div>
                        <div style={{ height:3,background:'rgba(255,255,255,.07)',borderRadius:999,marginTop:4,overflow:'hidden' }}>
                          <div style={{ height:'100%',width:'33%',background:'linear-gradient(90deg,#22d3ee,#3b82f6)',borderRadius:999 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 2 — Payments */}
              <div
                onClick={() => setFocusedPhone('pay')}
                className="cursor-pointer transition-all duration-300"
                style={{ transform: focusedPhone === 'pay' ? 'rotate(6deg) translateY(28px) scale(1.06)' : 'rotate(6deg) translateY(28px) scale(0.94)', zIndex: focusedPhone === 'pay' ? 5 : 1, marginTop: 20 }}>
                <div className="relative" style={{ width:188,background:'linear-gradient(170deg,#18202e,#0e1422)',borderRadius:42,border:'1.5px solid rgba(255,255,255,0.11)',boxShadow:'0 0 0 1px rgba(0,0,0,.6),0 40px 80px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.1)' }}>
                  <div style={{ position:'absolute',left:-3,top:76,width:3,height:26,background:'#1e2738',borderRadius:'2px 0 0 2px' }} />
                  <div style={{ position:'absolute',right:-3,top:98,width:3,height:52,background:'#1e2738',borderRadius:'0 2px 2px 0' }} />
                  <div style={{ margin:8,borderRadius:34,background:'#090e1c',overflow:'hidden',minHeight:382 }}>
                    <div style={{ position:'relative',display:'flex',justifyContent:'center',paddingTop:9 }}>
                      <div style={{ width:90,height:22,background:'#090e1c',borderRadius:20,border:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                        <div style={{ width:8,height:8,borderRadius:'50%',background:'#0c0c0c',border:'1px solid rgba(255,255,255,.04)' }} />
                        <div style={{ width:3,height:3,borderRadius:'50%',background:'#142030',boxShadow:'0 0 4px rgba(34,211,238,.4)' }} />
                      </div>
                    </div>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 14px 5px',fontSize:9,fontWeight:700,color:'rgba(255,255,255,.55)' }}>
                      <span style={{ fontSize:11,fontWeight:700 }}>9:41</span>
                      <span style={{ fontSize:8 }}>▲▲ WiFi 🔋</span>
                    </div>
                    <div style={{ padding:'3px 12px 14px' }}>
                      <div style={{ fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#64748b' }}>This Month</div>
                      <div style={{ fontSize:26,fontWeight:900,letterSpacing:'-.03em',color:'#fff',marginTop:2 }}>$4,280</div>
                      <div style={{ fontSize:9,color:'#4ade80',fontWeight:600,marginTop:1,marginBottom:8 }}>↑ +18% vs last month</div>
                      {[
                        { id:'#2948', client:'Sarah Johnson', badge:'Paid',    bc:'rgba(16,185,129,.15)', tc:'#6ee7b7' },
                        { id:'#2951', client:'Mike Chen',     badge:'Pending', bc:'rgba(251,191,36,.15)', tc:'#fbbf24' },
                        { id:'#2959', client:'Linda Rivera',  badge:'Sent',    bc:'rgba(99,102,241,.15)', tc:'#a5b4fc' },
                      ].map(inv => (
                        <div key={inv.id}
                          onClick={e => { e.stopPropagation(); handleInvoiceClick(inv.id); }}
                          style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:hlInvoice===inv.id?'rgba(34,211,238,.09)':'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',borderRadius:9,padding:'7px 9px',marginBottom:5,cursor:'pointer',transition:'background .2s' }}>
                          <div>
                            <div style={{ fontSize:10,fontWeight:700,color:'#fff' }}>{inv.id}</div>
                            <div style={{ fontSize:8,color:'#64748b',marginTop:1 }}>{inv.client}</div>
                          </div>
                          <span style={{ fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:999,background:inv.bc,color:inv.tc }}>{inv.badge}</span>
                        </div>
                      ))}
                      {/* Mini bar chart */}
                      <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.05)',borderRadius:9,padding:'7px 9px',marginTop:6 }}>
                        <div style={{ fontSize:8,color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em' }}>4-week trend</div>
                        <div style={{ display:'flex',alignItems:'flex-end',gap:2,height:24,marginTop:5 }}>
                          {[42,58,50,36,68,62,100].map((h,i) => (
                            <div key={i} style={{ flex:1,height:`${h}%`,borderRadius:'2px 2px 0 0',background:i===6?'linear-gradient(180deg,#22d3ee,#3b82f6)':'rgba(34,211,238,.22)' }} />
                          ))}
                        </div>
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:3,background:'rgba(34,211,238,.08)',border:'1px solid rgba(34,211,238,.14)',borderRadius:7,padding:4,marginTop:5,fontSize:9,fontWeight:800,color:'#22d3ee' }}>
                          +18% this month ↑
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copy + controls */}
          <div>
            <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-400/8 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-300">Mobile First</span>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Run your entire<br />business from your pocket.
            </h2>
            <p className="mt-5 text-lg text-slate-400">From booking to signature capture to final payout, NotaryOS mirrors how real mobile appointments happen.</p>
            <div className="mt-7 space-y-4">
              {[
                { icon: CalendarCheck, label: "Confirm today's route and appointment details"    },
                { icon: FileCheck2,    label: 'Capture signer details and journal proof on-site' },
                { icon: Wallet,        label: 'Send invoice and track paid status instantly'       },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/15">
                    <Icon className="h-4 w-4 text-violet-400" />
                  </div>
                  <p className="text-sm text-slate-300">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setFocusedPhone('route')}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${focusedPhone === 'route' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                <MapPin className="h-3.5 w-3.5" /> Route View
              </button>
              <button onClick={() => setFocusedPhone('pay')}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${focusedPhone === 'pay' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                <Wallet className="h-3.5 w-3.5" /> Payments View
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Click a phone or button to focus · Tap invoices inside the phone to interact</p>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-[#0a1525] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <span className="inline-flex rounded-full border border-blue-400/25 bg-blue-400/8 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">How It Works</span>
            <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">From booking to payout in 4 steps.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">A streamlined workflow designed for mobile-first notaries.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map(({ step, title, desc, icon: Icon }, i) => (
              <div key={title} className="relative rounded-2xl border border-white/8 bg-white/[0.03] p-7 transition-all hover:-translate-y-1 hover:border-white/15">
                {i < HOW_STEPS.length - 1 && <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 lg:block"><ArrowRight className="h-5 w-5 text-slate-700" /></div>}
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-4xl font-black text-white/5">{step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/8">
                    <Icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className={`text-xl font-black ${isAgentStep ? 'text-cyan-100' : 'text-white'}`}>{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
                </div>
              );
            })}
          </div>
          {/* Agent control callout */}
          <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.02] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 border border-violet-400/20">
              <Zap className="h-5 w-5 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">You stay in control — always.</p>
              <p className="text-sm text-slate-400 mt-0.5">The agent runs in Supervised Mode by default. Every draft waits for your tap to approve. Flip to Autonomous Mode when you're ready to go fully hands-free on low-risk actions.</p>
            </div>
            <button onClick={() => navigate('/auth')}
              className="shrink-0 rounded-xl border border-violet-400/25 bg-violet-400/8 px-4 py-2 text-sm font-bold text-violet-300 transition-all hover:bg-violet-400/15 whitespace-nowrap">
              See it live →
            </button>
          </div>
        </div>
      </section>

      {/* ══ BUSINESS MODELS ═══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">Built for every modern<br />notary business model.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {BUSINESS_MODELS.map(({ title, desc, icon: Icon, color, bg }) => (
            <div key={title} className="group rounded-2xl border border-white/8 bg-white/[0.03] p-7 transition-all hover:-translate-y-1 hover:border-white/15 hover:bg-white/5">
              <div className={`mb-5 inline-flex rounded-xl p-3 ${bg}`}><Icon className={`h-6 w-6 ${color}`} /></div>
              <h3 className="text-xl font-black text-white">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{desc}</p>
              <button onClick={() => { trackEvent('landing_cta_agent_closeout', { location: 'business_models' }); navigate('/auth'); }}
                className={`mt-5 flex items-center gap-1.5 text-sm font-semibold ${color} transition-all group-hover:gap-2.5`}>
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="bg-[#0a1525] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/8 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">Pricing</span>
            <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">Simple, transparent pricing.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">Start free. Upgrade when you&apos;re ready. No contracts, no surprises.</p>
            <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
              <button onClick={() => setBilling('monthly')}
                className={`rounded-lg px-5 py-2 font-semibold transition-all ${billing === 'monthly' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Monthly</button>
              <button onClick={() => setBilling('yearly')}
                className={`relative rounded-lg px-5 py-2 font-semibold transition-all ${billing === 'yearly' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                Yearly
                <span className="ml-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white">-20%</span>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map(tier => {
              const price = billing === 'monthly' ? tier.price : tier.yearly;
              return (
                <div key={tier.name}
                  className={`relative flex flex-col rounded-2xl border p-7 transition-all hover:-translate-y-1 ${tier.highlight ? 'border-cyan-400/50 bg-[#071f3a] shadow-2xl shadow-cyan-500/10' : 'border-white/8 bg-white/[0.03]'}`}>
                  {tier.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 text-xs font-black text-white shadow-lg shadow-cyan-500/20">{tier.badge}</span>
                    </div>
                  )}
                  <p className="text-sm font-black uppercase tracking-wider text-slate-400">{tier.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{tier.sub}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-5xl font-black text-white">${price}</span>
                    <span className="mb-1.5 text-slate-500">/mo</span>
                  </div>
                  {billing === 'yearly' && tier.price > 0 && (
                    <p className="mt-1 text-xs text-emerald-400">Billed yearly · Save ${(tier.price - tier.yearly) * 12}/yr</p>
                  )}
                  <ul className="my-7 flex-1 space-y-3 border-t border-white/8 pt-6">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => tier.highlight || tier.cta === 'Contact Sales' ? scrollTo('waitlist') : navigate('/auth')}
                    className={`w-full rounded-xl py-3 text-sm font-black transition-all ${tier.highlight ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110' : 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'}`}>
                    {tier.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── COMPARE PLANS TABLE ────────────────────────────────────────── */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/8">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-[#0c1928]">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500" style={{ width: '30%' }}>Compare plans</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Starter</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-cyan-400">Pro</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Agency</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${i === COMPARE_ROWS.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-500">{row.feature}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">
                      {row.starter === '—' ? <span className="text-slate-700">—</span> : row.starter}
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-medium ${row.proHighlight ? 'text-cyan-400' : 'text-slate-300'}`}>
                      {row.pro === '—' ? <span className="text-slate-700">—</span> : row.pro}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">
                      {row.agency === '—' ? <span className="text-slate-700">—</span> : row.agency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cost comparison tool */}
          <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.03] p-7">
            <p className="text-xs font-black uppercase tracking-wider text-cyan-400">Interactive Cost Comparison</p>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
              <p className="shrink-0 text-sm font-semibold text-slate-300">Monthly signings:</p>
              <input type="range" min="5" max="120" value={compSignings}
                onChange={e => setCompSignings(Number(e.target.value))}
                className="flex-1 accent-cyan-400" />
              <span className="shrink-0 text-lg font-black text-cyan-400">{compSignings}</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Typical Tool Stack', val: `$${stackCost}/mo`, cls: 'border-white/8 text-white' },
                { label: 'NotaryOS Pro',        val: `$${nosCost}/mo`,  cls: 'border-blue-500/30 text-cyan-400' },
                { label: 'Your Savings',         val: `$${savings}/mo`, cls: 'border-emerald-400/30 bg-emerald-400/5 text-emerald-300' },
              ].map(c => (
                <div key={c.label} className={`rounded-xl border px-4 py-4 ${c.cls}`}>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">{c.label}</p>
                  <p className={`mt-1 text-3xl font-black ${c.cls}`}>{c.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ AI GUIDE FAQ ══════════════════════════════════════════════════════ */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-24">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">AI Guide</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">Ask anything about pricing, workflows, compliance, or onboarding and get an instant guided answer.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {FAQ.map((item) => (
              <button
                key={item.q}
                onClick={() => {
                  trackEvent('landing_faq_starter_clicked', { question: item.q });
                  setAiInput(item.q);
                  setTimeout(() => submitAI('faq_guide_starter'), 50);
                }}
                className="rounded-lg border border-white/12 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
              >
                {item.q}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitAI('faq_guide')}
              placeholder="Try: What happens after I complete a signing?"
              className="flex-1 rounded-lg border border-white/10 bg-[#0b1526] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={() => submitAI('faq_guide')}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-bold text-white"
            >
              Ask AI Guide
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-white/8 bg-[#0a1220] p-4">
            <p className="text-[11px] uppercase tracking-wider text-cyan-300">AI Guide Response</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{aiTyping ? 'Thinking…' : aiOutput}</p>
          </div>
        </div>
      </section>

      {/* ══ WAITLIST / EARLY ACCESS ═══════════════════════════════════════ */}
      <section id="waitlist" className="bg-[#0a1525] py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            Early Access — Limited Spots
          </span>
          <h2 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
            Be first in line.<br />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
              Shape the product.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
            NotaryOS is in active development. Early access members get free Pro access, direct input on features, and priority onboarding.
          </p>

          {waitlistDone ? (
            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-emerald-400/30 bg-emerald-400/8 p-8">
              <div className="mb-3 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15">
                  <BadgeCheck className="h-7 w-7 text-emerald-400" />
                </div>
              </div>
              <p className="text-lg font-black text-white">You&apos;re on the list.</p>
              <p className="mt-2 text-sm text-slate-400">
                We&apos;ll reach out personally with your early access link. Expect to hear from us within 48 hours.
              </p>
              <button onClick={() => { trackEvent('landing_cta_agent_closeout', { location: 'waitlist_success' }); navigate('/auth'); }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110">
                Try the demo now <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="mx-auto mt-10 max-w-md space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={e => setWaitlistEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={waitlistLoading}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 disabled:opacity-60"
                >
                  {waitlistLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block" /> : 'Join Waitlist'}
                </button>
              </div>
              <div className="flex justify-center gap-2 rounded-xl border border-white/8 bg-white/4 p-1">
                {[
                  { key: 'mobile', label: 'Mobile Notary' },
                  { key: 'loan',   label: 'Loan Signing'  },
                  { key: 'agency', label: 'Agency'        },
                ].map(r => (
                  <button key={r.key} type="button"
                    onClick={() => setWaitlistRole(r.key)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${waitlistRole === r.key ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600">No credit card. No spam. Unsubscribe anytime.</p>
            </form>
          )}

          <div className="mt-14 grid grid-cols-3 gap-4 text-center">
            {[
              { val: 'Free Pro',  sub: 'for early members'     },
              { val: 'Direct',    sub: 'feature input channel'  },
              { val: '48hr',      sub: 'personal onboarding'    },
            ].map(item => (
              <div key={item.val} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xl font-black text-white">{item.val}</p>
                <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════════════════ */}
      <section className="bg-[#060d1b] py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Meet your AI notary agent.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            No signup required. Open the live demo and trigger a real agent closeout — see your journal drafted, invoice generated, and compliance checked in seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => { trackEvent('landing_cta_agent_closeout', { location: 'final_cta' }); navigate('/auth'); }}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-base font-black text-white shadow-2xl shadow-cyan-500/25 transition-all hover:brightness-110 active:scale-[.98]">
              See Agent Closeout
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button onClick={() => { trackEvent('landing_cta_waitlist', { location: 'final_cta' }); scrollTo('waitlist'); }}
              className="rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10">
              Join Waitlist
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-600">Demo uses sample data · Nothing is saved to a server</p>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#030b17] px-6 pt-14 pb-8">
        <div className="mx-auto max-w-7xl">
          {/* Four columns */}
          <div className="grid grid-cols-2 gap-10 pb-12 md:grid-cols-4 border-b border-white/[0.05]">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-[#060d1b]">N</div>
                <span className="text-sm font-black text-white">NotaryOS</span>
              </div>
              <p className="mb-5 max-w-[240px] text-sm leading-relaxed text-slate-500">
                The complete operating system for modern notary professionals. Scheduling, compliance, invoicing, and AI — all in one place.
              </p>
              <div className="flex gap-2">
                {['𝕏', 'in', 'f', '◎'].map(s => (
                  <button key={s} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-sm text-slate-500 transition-all hover:border-white/15 hover:text-white">{s}</button>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-wider text-slate-500">Product</p>
              {[
                { label: 'Features',    action: () => scrollTo('features')     },
                { label: 'How it works',action: () => scrollTo('how-it-works') },
                { label: 'Pricing',     action: () => scrollTo('pricing')      },
                { label: 'Changelog',   action: () => setFooterModal('terms')  },
                { label: 'Roadmap',     action: () => setFooterModal('terms')  },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="mb-2.5 block text-left text-sm text-slate-500 transition-colors hover:text-white">{item.label}</button>
              ))}
            </div>

            {/* Resources */}
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-wider text-slate-500">Resources</p>
              {[
                { label: 'Documentation',      action: () => setFooterModal('terms')   },
                { label: 'Notary Guides',       action: () => setFooterModal('terms')   },
                { label: 'Compliance Library',  action: () => setFooterModal('security')},
                { label: 'FAQ',                 action: () => scrollTo('faq')           },
                { label: 'Blog',                action: () => setFooterModal('terms')   },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="mb-2.5 block text-left text-sm text-slate-500 transition-colors hover:text-white">{item.label}</button>
              ))}
            </div>

            {/* Company */}
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-wider text-slate-500">Company</p>
              {[
                { label: 'About Us',      key: 'about'    },
                { label: 'Contact',       key: 'contact'  },
                { label: 'Terms of Use',  key: 'terms'    },
                { label: 'Privacy Policy',key: 'privacy'  },
                { label: 'Security',      key: 'security' },
              ].map(item => (
                <button key={item.label} onClick={() => setFooterModal(item.key)}
                  className="mb-2.5 block text-left text-sm text-slate-500 transition-colors hover:text-white">{item.label}</button>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-600">© {new Date().getFullYear()} NotaryOS Inc. All rights reserved. NotaryOS provides workflow software, not legal counsel.</p>
            <div className="flex gap-5">
              {[
                { label: 'Terms of Use',   key: 'terms'   },
                { label: 'Privacy Policy', key: 'privacy' },
                { label: 'Cookie Policy',  key: 'cookies' },
              ].map(item => (
                <button key={item.label} onClick={() => setFooterModal(item.key)}
                  className="text-xs text-slate-600 transition-colors hover:text-slate-400">{item.label}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ══ FOOTER MODAL ══════════════════════════════════════════════════════ */}
      {footerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onClick={() => setFooterModal(null)}>
          <div className="w-full max-w-lg overflow-y-auto rounded-2xl border border-white/12 bg-[#0d1a2e] p-7 shadow-2xl" style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{FOOTER_CONTENT[footerModal]?.title ?? footerModal}</h3>
              <button onClick={() => setFooterModal(null)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-all hover:text-white">
                ✕ Close
              </button>
            </div>
            <div className="whitespace-pre-line text-sm leading-relaxed text-slate-400">
              {FOOTER_CONTENT[footerModal]?.body ?? 'Coming soon.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

