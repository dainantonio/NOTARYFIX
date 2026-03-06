import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, Bot, ShieldCheck, Wallet, Users,
  Lock, Zap, BookOpen, ArrowRight, Search,
} from 'lucide-react';

// ─── FAQ DATA ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'agent',
    label: 'AI Agent & Runtime',
    icon: Bot,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
    items: [
      {
        q: 'How does the AI Agent Runtime work?',
        a: `When you mark an appointment complete, the Agent Runtime fires automatically — no button press needed.

It runs a three-stage pipeline:
1. **Planner** — maps your task type (closeout, AR scan, weekly digest) into an ordered step sequence before anything executes.
2. **Tools** — each step executes using your existing data (agentOps, crudOps). Journal draft, invoice generation, compliance check — all in sequence.
3. **Verifier** — after execution, reads admin-published state policy records and attaches grounded citations + an adjusted confidence score to every suggestion.

All output lands in Command Center as pending suggestions ready for your one-tap approval, edit, or reject.`,
      },
      {
        q: 'What are grounded citations?',
        a: `Every AI suggestion includes citation chips showing the exact admin-published policy record that justified the decision.

Example: "Fee capped at $15 — per 'VA Notarial Acts Fee Schedule', updated Jan 2025."

Each chip shows:
- The record name and category
- The specific value (fee cap, ID rule, RON permission)
- When the record was last published by your Admin
- A link to the official source URL if one is on file

If the Admin hasn't published a policy record for that state yet, the agent falls back to hardcoded 50-state baselines and flags the gap clearly so you know it's not admin-verified.`,
      },
      {
        q: 'What is the Closeout Agent specifically?',
        a: `The Closeout Agent is the most-used agent task. It fires automatically when an appointment status flips to "complete" and:

- Drafts a compliant journal entry with all required per-act fields for your state
- Generates a linked invoice using your configured fee schedule
- Attaches grounded citations for any fee cap or ID requirement that applies
- Flags any compliance risks (e.g. expired ID, missing thumbprint for CA deeds, RON platform not specified)

The agent runs in whatever mode you've configured: Assistive (drafts only), Supervised (you approve before commit), or Autonomous (auto-commits safe actions, surfaces exceptions).`,
      },
      {
        q: 'What is the feedback loop and how does it learn from me?',
        a: `Every time you edit an AI draft before saving, NotaryFix captures the diff — what changed, what suggestion type it was, what state and service type the appointment was.

This data is stored in your account's feedback history. Over time it powers a confidence adjustment engine:
- If your edit rate for a specific suggestion type in a specific state exceeds 70%, the agent lowers its confidence score by 15 points for those drafts, signaling they need closer review.
- If edit rate exceeds 40%, confidence drops by 8 points.

This doesn't require ML training — it's a running edit-rate signal that surfaces where the agent needs the most human oversight right now. Future product updates will use this signal to improve the agent's prompts and parsers.`,
      },
      {
        q: 'What are the event-driven triggers?',
        a: `Three automatic triggers run without any manual action:

1. **Appointment Complete** — fires immediately when you mark an appointment done. Runs the Closeout Agent for that appointment. Gated per-appointment so it never double-fires.

2. **Daily AR Scan** — fires once per day on app open. Checks for outstanding invoices past due date, surfaces AR reminder suggestions, and optionally schedules follow-up messages.

3. **Weekly Digest** — fires once per week (Monday). Generates a revenue summary, open AR total, busiest service type, and any compliance flags from the week.

All three are client-side for now (localStorage-gated). They're designed to move behind a serverless function in a future release with no UI changes required.`,
      },
      {
        q: 'What is Command Center vs Review Queue?',
        a: `**Command Center** (/agent) is your proactive agent hub:
- Live badge showing count of pending suggestions (disappears when empty)
- KPI cards: revenue, appointments, open AR, compliance score
- Playbook shortcuts: trigger a manual closeout, AR scan, or digest
- Recent agent action history

**Review Queue** (/review) is focused batch processing:
- Filter by type, state, confidence level
- Sort by date, confidence, or suggestion type
- Bulk approve or reject
- Individual drill-down view

Command Center links to Review Queue with a "Review All →" button. Review Queue links back. Command Center = proactive hub; Review Queue = focused processing.`,
      },
      {
        q: 'What does confidence score mean?',
        a: `Each AI suggestion carries a confidence score (0–100) representing how certain the agent is that the draft is correct and compliant.

The score starts at a base level per task type, then gets adjusted by the Verifier:
- Compliance issues found → score reduced
- Feedback loop signals high edit rate for this type/state → score reduced
- All checks pass + admin policy record found → score maintained or boosted

Suggestions below a threshold are flagged visually so you know to review them more carefully. High-confidence suggestions in Autonomous mode can be auto-committed without requiring your approval.`,
      },
    ],
  },
  {
    id: 'features',
    label: 'Features & Workflows',
    icon: Zap,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
    items: [
      {
        q: 'What is the Act Library?',
        a: `The Act Library (formerly called the AI Trainer in some interfaces) is your grounded knowledge base for notarial acts.

It stores admin-published state rules including:
- Per-act fee schedules
- ID requirements and credible witness rules
- RON permissions and platform requirements
- State-specific red flags

The AI agent reads from this library when building suggestions. Records can be imported from official jurisdiction datasets or created manually by your Admin. Every imported record lands in "pending review" status first — no dataset goes live without an admin sign-off.`,
      },
      {
        q: 'How does the invoicing system work?',
        a: `Invoices in NotaryFix are linked to appointments via a \`linkedAppointmentId\` field, which keeps your records consistent and prevents duplicates.

The Closeout Agent drafts invoices automatically after each signing using your fee schedule. You can also:
- Prefill an invoice from any appointment directly using the "Create Invoice" button on the appointment detail
- Apply payment links that route to the public payment page
- Track paid/pending/overdue status with AR scanning

Invoice data is validated at write time by the schema layer — field drift (e.g. wrong ID field names) is caught before it reaches your records.`,
      },
      {
        q: 'What is the compliance checker and how does it stay current?',
        a: `The compliance checker is a two-layer engine:

**Layer 1 — Admin-published rules**: Reads your account's active \`stateRules\`, \`feeSchedules\`, and \`idRequirements\` records. These are the authoritative source when available.

**Layer 2 — Hardcoded baseline fallback**: 50-state baseline data compiled from public notarial statutes. Used only when no admin record exists for a given state/act combination.

This means your compliance checks stay current as long as your Admin keeps the Act Library up to date. Every compliance warning includes a citation pointing to the specific record and when it was published.`,
      },
      {
        q: 'How does GPS mileage tracking work?',
        a: `NotaryFix logs mileage per appointment. You can enter start and end odometer readings or let the app calculate based on your route. Mileage is stored per appointment and rolled up in your monthly tax summary view using the current IRS rate (67¢/mile for 2025).`,
      },
      {
        q: 'What happens to data I enter if I\'m offline?',
        a: `NotaryFix is mobile-first and designed for field use. Journal entries, appointment updates, and client data are captured locally and synced automatically when your connection returns. No data is lost if you lose signal mid-appointment.`,
      },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance & Data Integrity',
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    items: [
      {
        q: 'How does the role system work?',
        a: `NotaryFix uses a structured role system with five roles:

- **owner** — full access, billing, admin settings
- **admin** — manages users, publishes compliance rules, imports datasets
- **compliance_manager** — manages Act Library and compliance records (no billing access)
- **dispatcher** — manages appointments and team routing
- **notary** — standard working role

Roles are gated at the route level. If a user's role isn't recognized, the system defaults to \`notary\` (the least-privileged role) rather than escalating access. This fail-safe model means misconfiguration never accidentally grants admin-level access.`,
      },
      {
        q: 'How are jurisdiction datasets imported safely?',
        a: `Dataset imports go through a mandatory review gate:

- Imported records land as \`status: 'pending_review'\` — never immediately active
- \`publishedAt\` is null until an admin explicitly publishes the record
- \`ronPermitted\` is read from the actual imported data, not assumed true
- Records without an \`officialSourceUrl\` are flagged as requiring source verification before publishing

This means no dataset can affect your agent's compliance decisions until an Admin has reviewed and published it. The "grounded + governed" promise only holds if imports go through this gate.`,
      },
      {
        q: 'What is schema validation and why does it matter?',
        a: `NotaryFix enforces a lightweight schema validation layer on every write — appointments, invoices, journal entries, agent suggestions, and admin records all go through field-level validation before being saved.

This catches issues like:
- Using \`sourceAppointmentId\` when the app expects \`linkedAppointmentId\`
- Missing required fields on invoice records
- Unknown fields being added to agent suggestions

In development: validation failures produce a \`console.error\` (red) so you see them immediately. In production: \`console.warn\` — never throws, never breaks the app. The layer is a safety net, not a hard blocker.`,
      },
      {
        q: 'Is my signer data ever shared or sold?',
        a: `Never. Signer data is fully isolated and private. It is not used for training, analytics, sold to third parties, or accessible by any other account. We use AES-256 encryption at rest and TLS 1.3 in transit. Signer records never cross user account boundaries.`,
      },
    ],
  },
  {
    id: 'pricing',
    label: 'Plans & Pricing',
    icon: Wallet,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    items: [
      {
        q: 'What is included in the free Starter plan?',
        a: `Starter is free forever and includes:
- Up to 5 appointments per month
- Basic journal (10 entries/month)
- Client management
- Mileage tracking
- Local storage

Starter does not include the AI Agent Runtime, Command Center, Signer Portal, or Team Dispatch. Upgrade to Pro to unlock all agent features.`,
      },
      {
        q: 'What does Pro include?',
        a: `Pro ($29/mo, $23/mo billed annually) includes everything in Starter plus:
- Unlimited appointments
- AI Agent Runtime (Planner → Tools → Verifier) with grounded citations
- Command Center with live pending-suggestion badge
- Signer Portal
- GPS Mileage Tracking
- Invoice Automation with payment links
- Cloud backup and sync
- Unified dark interface across all modules

All paid plans include a 14-day full-feature trial.`,
      },
      {
        q: 'What does Agency add over Pro?',
        a: `Agency ($79/mo, $63/mo billed annually) includes everything in Pro plus:
- Team Dispatch Board
- Multi-notary routing and SLA tracking
- Admin Control Center with Act Library management
- compliance_manager and agency_admin role support
- Dedicated account manager
- Standardized team UI system

Agency is designed for signing agencies running multiple notaries under one operation.`,
      },
      {
        q: 'Can I upgrade or cancel anytime?',
        a: `Yes. You can upgrade, downgrade, or cancel at any time from Settings → Billing. There are no contracts or cancellation fees. Your data remains accessible according to your plan tier after downgrade.`,
      },
    ],
  },
  {
    id: 'team',
    label: 'Teams & Admin',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    items: [
      {
        q: 'How does team dispatch work?',
        a: `The Dispatch Board (Agency plan) lets you assign appointments to notaries on your team, set SLA windows, and track completion status across your operation. Each notary gets their own workspace with the same consistent interface — their agent runs independently and surfaces their suggestions in their own Command Center.`,
      },
      {
        q: 'Can different team members have different roles?',
        a: `Yes. You can assign any of the five roles (owner, admin, compliance_manager, dispatcher, notary) to team members. Routes and features are gated per role — a dispatcher sees the dispatch board but not billing; a compliance_manager can publish Act Library records but can't manage users. The role system is enforced at the app level with fail-safe defaults.`,
      },
      {
        q: 'How does the Admin manage the compliance knowledge base?',
        a: `Admins (and compliance_managers) manage the Act Library from the Admin Control Center. They can:
- Import jurisdiction datasets from official sources
- Review and publish or reject imported records
- Manually add or edit state rules, fee schedules, and ID requirements
- Set official source URLs for traceability

All changes are versioned with a \`publishedAt\` timestamp. The AI agent always reads the most recently published record for each state/act combination.`,
      },
    ],
  },
,
  {
    id: 'job_intelligence',
    label: 'Job Intelligence Agent',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    items: [
      {
        q: 'How does the Job Intelligence Agent detect jobs?',
        a: `When you paste an email, SMS, voicemail transcript, or platform notification into the Job Inbox, the agent scans it for job signals — keywords like "signing," "refi," "closing," "deed," or any mention of a fee, time, or location.\n\nIf a job is detected, it extracts structured fields automatically:\n- **Job type** (refinance, purchase, deed, POA, I-9, RON, etc.)\n- **Location** — city/state or address\n- **Date and time**\n- **Offered fee** — any dollar amount mentioned\n- **Contact** — email, phone, or name\n\nIf no job signal is found, you see a clear message explaining what to add for a more complete detection.`,
      },
      {
        q: 'How does the platform estimate profit?',
        a: `The profitability analysis uses three inputs:\n\n**1. Your configured settings:** minimum acceptable fee, travel radius, and IRS mileage rate (default 67¢/mile for 2025).\n\n**2. Estimated costs:** round-trip mileage × your rate, plus estimated printing cost (number of pages × 12¢) based on job type.\n\n**3. Market benchmarks:** current average market fees by job type (e.g. refinance: $150 avg, purchase: $165 avg, I-9: $65 avg) built into the engine.\n\nThe result: offered fee - total estimated cost = net profit. The agent compares your net profit against market averages and flags if you're leaving money on the table.`,
      },
      {
        q: 'Does the AI automatically accept jobs?',
        a: `Never. The Job Intelligence Agent is advisory by design — it generates a recommendation (Accept, Counter Offer, Request Info, or Decline) but you must tap the action button to confirm.\n\nThis is by design: accepting a job triggers calendar scheduling, client creation, and expense tracking. These are irreversible actions in your business workflow. The agent presents the clearest possible recommendation so your decision takes one tap — but that tap is always yours.`,
      },
      {
        q: 'What is a counter offer negotiation script?',
        a: `After evaluating a job, the agent generates a ready-to-send negotiation script tailored to the situation:\n\n- **Accept:** A professional confirmation message\n- **Counter offer:** A polite message explaining your rate and the market context, with the counter amount clearly stated\n- **Decline:** A gracious decline leaving the door open for future work\n- **Request info:** A brief message asking for fee, location, or package details\n\nYou can expand the script, copy it with one tap, and paste it directly into your email or SMS.`,
      },
      {
        q: 'How are job expenses tracked for taxes?',
        a: `Every job has an expense tracker linked to it. You can record:\n- **Mileage** (in dollars — enter your total per IRS rate)\n- **Printing costs**\n- **Supplies**\n- **Platform fees**\n- **Other**\n\nAll expenses roll up in the Job Analytics view, which shows total income (paid jobs), total expenses, and net profit — exportable as a tax-ready summary. Mileage deductions are tracked separately to match Schedule C reporting requirements.`,
      },
      {
        q: 'Can I override AI recommendations?',
        a: `Always. The recommendation is a starting point, not a directive. You can:\n- Accept a job the agent suggested declining (you know your schedule and relationships better)\n- Counter at a different amount than suggested\n- Ignore the script entirely and write your own\n- Edit any extracted field if the parser missed something\n\nThe agent learns nothing from your overrides (no feedback loop for job intelligence yet) — but every job you process builds your analytics, which refines the market benchmarks over time.`,
      },
    ],
  }
,
  {
    id: 'security',
    label: 'Security & Privacy',
    icon: Lock,
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
    items: [
      {
        q: 'How is my data protected?',
        a: `NotaryFix uses a security-first architecture:
- AES-256 encryption at rest for all stored data
- TLS 1.3 for all data in transit
- Role-based access control with least-privilege model
- Strict data isolation — records never cross account boundaries
- Schema validation at every write to prevent data corruption`,
      },
      {
        q: 'Does NotaryFix use cookies for tracking?',
        a: `We use only functional session cookies necessary to operate the service (login state, workspace preferences). We do not use advertising cookies, third-party tracking cookies, fingerprinting, or behavioral tracking of any kind.`,
      },
      {
        q: 'Where does agent feedback data go?',
        a: `Feedback data (edit diffs when you correct an AI draft) is stored in your account's \`agentFeedback\` collection. It is never shared across accounts and is used only to adjust confidence scoring within your own workspace. You can request deletion of all feedback data at any time by contacting support.`,
      },
    ],
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);

  // Convert **bold** markdown and newlines in answer text
  const renderAnswer = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <p key={i} className={`${i > 0 ? 'mt-2' : ''} text-sm leading-relaxed text-slate-300`}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-bold text-white">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className={`rounded-xl border transition-all ${open ? 'border-white/15 bg-white/[0.04]' : 'border-white/8 bg-white/[0.02] hover:border-white/12'}`}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className={`text-sm font-semibold transition-colors ${open ? 'text-white' : 'text-slate-200'}`}>{q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-cyan-400" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />}
      </button>
      {open && (
        <div className="border-t border-white/8 px-5 pb-5 pt-4">
          {renderAnswer(a)}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(null);

  const filtered = SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !query ||
      item.q.toLowerCase().includes(query.toLowerCase()) ||
      item.a.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter(section =>
    (!activeSection || activeSection === section.id) && section.items.length > 0
  );

  const totalResults = filtered.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="min-h-screen bg-[#080f1d] text-white">

      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a1220] px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-[#060d1b]">N</div>
            <div className="leading-none">
              <p className="text-sm font-bold text-white">NotaryFix</p>
              <p className="text-[10px] text-slate-500">Help Center</p>
            </div>
          </div>
          <Link to="/dashboard" className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10">
            Dashboard <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/8 px-4 py-1.5 text-xs font-semibold text-cyan-300">
            <BookOpen className="h-3.5 w-3.5" /> Help Center
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Frequently Asked Questions</h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Everything about NotaryFix — the AI Agent Runtime, grounded citations, compliance, pricing, and team tools.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          {query && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {totalResults} result{totalResults !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Section filter pills */}
        {!query && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSection(null)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                activeSection === null ? 'border-white/20 bg-white/10 text-white' : 'border-white/8 text-slate-400 hover:border-white/15 hover:text-white'
              }`}
            >
              All topics
            </button>
            {SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                    activeSection === section.id
                      ? `${section.border} ${section.bg} ${section.color}`
                      : 'border-white/8 text-slate-400 hover:border-white/15 hover:text-white'
                  }`}
                >
                  <Icon className="h-3 w-3" />{section.label}
                </button>
              );
            })}
          </div>
        )}

        {/* FAQ sections */}
        <div className="space-y-10">
          {filtered.map(section => {
            const Icon = section.icon;
            return (
              <div key={section.id}>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${section.bg} border ${section.border}`}>
                    <Icon className={`h-4 w-4 ${section.color}`} />
                  </div>
                  <h2 className="text-base font-black text-white">{section.label}</h2>
                  <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {section.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {section.items.map(item => (
                    <FAQItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-12 text-center">
              <p className="text-slate-400">No results for "{query}"</p>
              <button onClick={() => setQuery('')} className="mt-3 text-sm text-cyan-400 hover:underline">Clear search</button>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-white/8 bg-white/[0.03] p-8 text-center">
          <p className="text-lg font-black text-white">Still have questions?</p>
          <p className="mt-2 text-sm text-slate-400">Our support team responds within one business day.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a href="mailto:support@notaryfix.com"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110">
              Email Support
            </a>
            <Link to="/dashboard"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
