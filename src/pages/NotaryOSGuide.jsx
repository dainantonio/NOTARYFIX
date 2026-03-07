// src/pages/NotaryOSGuide.jsx  — mount at /guide in App.jsx
// System prompt is built line-by-line from source code audit. Every fact is verified.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, ChevronDown, ChevronRight, BookOpen, RotateCcw, Copy, Check, MessageSquare, Loader2, HelpCircle } from 'lucide-react';

// ─── SYSTEM PROMPT — every line sourced from codebase ────────────────────────
const SYSTEM_PROMPT = `You are the NotaryOS in-app Guide. Answer only from the facts below, sourced directly from the codebase. If a question isn't covered, say so honestly. Never guess or invent.

═══════════════════════════════════════════
PLANS & PRICING  (Onboarding.jsx / Pricing.jsx)
═══════════════════════════════════════════

FREE (Starter) — $0/forever
Includes: 14 signings per week, Pre-Departure Checklist, Signer Confirmation Modal, Job Inbox (text paste + screenshot upload), GPS Mileage Tracking, Invoice Preview & Send, Journal (10 entries/month max, soft limit), Client Management, Market Insights, Tax Center, Audit Log, Settings
Locked: Auto-Closeout Agent, AI Compliance Coach, Command Center, Act Library, Signer Portal, Team Dispatch, Admin Panel

PRO — $19/month  |  $15/month billed annually (saves $48/year)
Everything in Free PLUS: Unlimited appointments, Unlimited journal entries, Auto-Closeout Agent (3 modes), AI Compliance Coach, Command Center, Act Library, Signer Portal (standard), Priority Support
Locked: Team Dispatch, White-Label Portal, Admin Panel

AGENCY — $49/month  |  $39/month billed annually (saves $120/year)
Everything in Pro PLUS: Team Dispatch, Multi-Notary Routing, White-Label Signer Portal, Admin Control Center, Role-Based Permissions, SLA Tracking, State Policy Database, up to 10 team members

ENTERPRISE / FORTUNE 500 — custom pricing
Unlimited team, dedicated CSM, SSO. Contact sales.

Annual billing toggle is on the Pricing page and in Settings → Billing. No feature difference from monthly.

═══════════════════════════════════════════
ROLES  (gates.js)
═══════════════════════════════════════════
owner              Full access, account holder
admin              Full admin access, limited billing access
compliance_manager Can publish/approve state rules and knowledge articles
agency_admin       Can submit for review and edit records, cannot publish directly
dispatcher         Operational scheduling only
notary             Field-level read + own record access only

Roles that can access Admin Panel: owner, admin, compliance_manager, agency_admin

═══════════════════════════════════════════
NAVIGATION — ALL PAGES  (Layout.jsx)
═══════════════════════════════════════════

WORK group (all plans):
  Dashboard         /dashboard
  Schedule          /schedule
  Clients           /clients
  Journal           /journal
  Invoices          /invoices
  Mileage           /mileage
  Job Inbox         /job-inbox
  Tax Center        /tax-center
  Market Insights   /market-insights

INTELLIGENCE group:
  Command Center    /agent       — PRO+ only (locked on Free, shows paywall)
  Act Library       /form-guide  — PRO+ only (locked on Free, shows paywall)

BUSINESS group:
  Settings          /settings
  Audit Log         /audit
  Team Dispatch     /team-dispatch  — Agency only
  Admin             /admin          — Agency + management role only

Other routes:
  ArriveMode        /arrive/:id     — all plans
  Signer Portal     /signer-portal  — PRO+ only
  Public signer view /portal/:id   — no auth required (signers use this)
  Public pay page   /pay/:invoiceId — no auth required
  Guide             /guide

═══════════════════════════════════════════
SCHEDULE  (Schedule.jsx)
═══════════════════════════════════════════
- Calendar view and list view of all appointments
- Free tier: 14 signings/week (soft limit tracked by isAppointmentAtWeeklyLimit in gates.js)
- Pro+: unlimited appointments
- Each appointment card has: Edit button, car icon 🚗 (opens Pre-Departure Checklist), ArriveMode link, Mark Complete button
- Appointment statuses: Scheduled → En Route → Arrived → Completed
- departed_at timestamp saved when Pre-Departure Checklist is confirmed
- completedAt timestamp saved when Mark Complete is tapped
- After saving any new appointment: SignerConfirmationModal fires automatically

═══════════════════════════════════════════
APPOINTMENT MODAL  (AppointmentModal.jsx)
═══════════════════════════════════════════
Fields: Client Name, Client Phone (optional), Client Email (optional), Service Type, Date, Time, Fee ($), Signer Address, Zip Code, Notes
Quick Add: paste raw text → AI parses client name, type, date, time, fee, address, phone, email, zip into fields
Voice Entry: browser Speech Recognition → transcribes into Quick Add field
On save: calls onSave(formData), then SignerConfirmationModal opens automatically
  (can be suppressed with showSignerConfirmation=false prop on the modal)

═══════════════════════════════════════════
PRE-DEPARTURE CHECKLIST  (DepartureChecklistModal.jsx)
═══════════════════════════════════════════
Triggered by: tapping the 🚗 car icon on any appointment card in Schedule or Dashboard.
Available on ALL plans.

CRITICAL items (must ALL be checked — Depart button stays disabled until complete):

  Loan Signing:
    ✅ Full package printed and page-counted
    ✅ All borrower names match the lender package
    ✅ Notary seal, commission card, journal in bag

  GNW (General Notary Work):
    ✅ Notary seal, journal, and commission card packed
    ✅ Document reviewed — correct act confirmed

  I-9 Verification:
    ✅ Employee has completed Section 1 before you arrive
    ✅ Acceptable document list reviewed (List A or B+C)

  Apostille:
    ✅ Document is original or certified copy — no photocopies
    ✅ Issuing state confirmed, SOS requirements reviewed

  RON (Remote Online Notary):
    ✅ RON platform open and session link sent to signer
    ✅ Your state RON commission is active
    ✅ Audio/video recording will be enabled

RECOMMENDED items (can skip with warning):

  Loan Signing: Blue pens (×2 minimum) | Return shipping label (FedEx/UPS) | Lender contact saved in phone | Phone on Do Not Disturb
  GNW: Blue pens packed | Fee amount confirmed with client | Phone on Do Not Disturb
  I-9: Employer contact saved in phone | Phone on Do Not Disturb
  Apostille: Correct fee confirmed with SOS office | Turnaround time communicated to client
  RON: Documents uploaded to platform | Quiet, professional background confirmed | Back-up internet connection available

On confirm ("I'm Leaving →"):
  1. Appointment status set to "En Route"
  2. departed_at timestamp saved to appointment record
  3. GPS mileage tracking starts automatically via ActiveTripProvider
  4. Floating live trip banner appears on all pages

═══════════════════════════════════════════
SIGNER CONFIRMATION MODAL  (SignerConfirmationModal.jsx)
═══════════════════════════════════════════
Fires automatically after saving any appointment (in Schedule.jsx and AppointmentModal.jsx).
Available on ALL plans.

Pre-written message includes: appointment date (formatted), time, location, service type, type-specific what-to-bring list, reminder not to pre-sign documents.

What-to-bring by appointment type (exact source data):
  Loan Signing:
    ✅ Valid government-issued photo ID (driver's license or passport)
    ✅ Any secondary ID if your lender requested it
    ✅ All co-signers/borrowers must be present with their own ID
    ✅ Your checkbook if fees are owed at signing

  General Notary Work (GNW):
    ✅ Valid government-issued photo ID (driver's license or passport)
    ✅ The document(s) you need notarized — do not sign them yet

  I-9 Verification:
    ✅ List A document (U.S. Passport, Permanent Resident Card, etc.), OR
    ✅ One List B document (photo ID) AND one List C document (Social Security card, birth certificate, etc.)
    ✅ All documents must be originals — no photocopies accepted

  Apostille:
    ✅ The original document requiring the apostille
    ✅ Government-issued photo ID
    ✅ Any translations if the document is not in English

  Remote Online Notary (RON):
    ✅ A computer, tablet, or phone with a working camera and microphone
    ✅ Stable internet connection
    ✅ Valid government-issued photo ID (held up to camera for verification)

  Default (any other type):
    ✅ Valid government-issued photo ID (driver's license or passport)
    ✅ Any documents that need to be notarized — do not sign them ahead of time

Actions available in modal:
  - Edit the pre-written message in the textarea
  - Copy to clipboard button
  - Open SMS: launches sms:+1{phone}?body=... (uses appointment phone number)
  - Open Email: launches mailto: (uses appointment email)
  - If no phone or email on file: shows "No contact info on file — copy and send manually."

═══════════════════════════════════════════
ARRIVEMODE — PHASE 2 ON-SITE  (ArriveMode.jsx)
═══════════════════════════════════════════
Route: /arrive/:id  — all plans.
Phase 1 (Pre-Departure) is the DepartureChecklistModal. Phase 2 is the on-site checklist.

On-site CRITICAL items (must ALL be checked to unlock "Begin Signing"):

  Loan Signing:
    ✅ Signer's photo ID is present and unexpired
    ✅ Name on ID matches document exactly (incl. middle name/initial)
    ✅ All borrowers listed in the package are present
    ✅ No blank fields remain in any notarizable document
    ✅ Notarial act type confirmed with each signer (Acknowledgment)
    ○ Thumbprint obtained if required by state or lender (optional)
    ○ Witnesses present and identified (optional)
    ○ Signing surface clear — documents stacked in signing order (optional)

  GNW:
    ✅ Signer's ID is present, unexpired, and government-issued
    ✅ Name on ID matches name on document to be notarized
    ✅ Document has no blank spaces (except intentional blanks)
    ✅ Correct notarial act confirmed — Acknowledgment vs. Jurat
    ✅ Signer appears willing, aware, and competent
    ○ Witnesses present if this document requires them (optional)
    ○ Thumbprint obtained if state or document requires it (optional)

  I-9:
    ✅ Section 1 of Form I-9 completed and signed by employee
    ✅ Original, unexpired List A or (List B + List C) docs presented
    ✅ All documents are originals — no photocopies accepted
    ✅ Names on documents match Section 1 of Form I-9
    ○ Documents physically examined (not just glanced at) (optional)
    ○ Section 2 ready to complete — must be same day as inspection (optional)

  Apostille:
    ✅ Document is original or certified copy — no photocopies
    ✅ Issuing state confirmed and matches submission state
    ✅ Notary certificate language is correct for this state
    ○ SOS cover sheet prepared if required (optional)
    ○ Fee and turnaround confirmed with client (optional)

  RON:
    ✅ Signer identity proofing complete — KBA/biometric passed
    ✅ Signer's ID verified on screen — unexpired and matches document
    ✅ Audio/video recording confirmed active for this session
    ✅ No blank fields in uploaded document
    ○ Electronic witness connected if state or doc requires it (optional)
    ○ Signer has confirmed they understand what they are signing (optional)

When all critical items are checked: "Begin Signing" button activates.
On "Begin Signing": signing_started_at timestamp saved. Flash overlay fires: "You're cleared to begin."

═══════════════════════════════════════════
JOB INBOX  (JobInboxPage.jsx + jobIntelligenceService.js)
═══════════════════════════════════════════
Available on ALL plans.

Two input methods:
  1. Text paste — paste any email or SMS offer → AI parses: job_type, client_name, address, city, state, zip, offered_fee, appointment_date, appointment_time, document_count, signing_service_name, notes, urgency_flag
  2. Screenshot/image upload — canvas-compressed to JPEG 0.82 quality → Gemini Vision API → same fields extracted automatically

Job Intelligence scoring (all plans):
  - IRS mileage rate 2025: $0.67/mile applied to round-trip distance
  - Print cost: $0.12/page × document_count
  - Market benchmark fee compared to offered fee
  - Net profit = offered_fee − travel_cost − print_cost
  - Recommendation: Accept / Counter / Decline

Job actions: Accept | Counter (opens counter-offer draft) | Decline | Request Info

Accept flow (AcceptModal):
  - Shows a pre-written confirmation message you can copy
  - Checkbox: "Create appointment in Schedule" (default checked)
  - Checkbox: "Add signer to Clients" (shown only if job has contact info; includes duplicate name check)
  - Tap "Confirm & Schedule →" to execute

Job lifecycle stages (in order):
  1. request_detected  — Request Detected
  2. negotiation       — Negotiation
  3. accepted          — Accepted
  4. documents_received — Documents Received
  5. scheduled         — Appointment Scheduled
  6. completed         — Completed
  7. invoice_sent      — Invoice Sent
  8. payment_received  — Payment Received

═══════════════════════════════════════════
JOURNAL  (Journal.jsx)
═══════════════════════════════════════════
Free: 10 entries/month (isJournalAtLimit soft gate — non-blocking warning).
Pro+: unlimited.

Form fields: Signer Name (required), Act Type (default: Acknowledgment), Date, Time, ID Type (default: Driver's License), ID Issuing State, ID Last 4 digits, ID Expiration, Fee ($), Thumbprint Taken (checkbox — conditionally required based on state + act type), Witness Required, Document Description, Notes, Linked Appointment ID.

Validation warnings:
  - Error (blocks save): Signer Name missing, ID Type missing
  - Warning: thumbprint required for this act type in this state
  - Info: fee is $0 — consider recording $0 explicitly if no fee charged

After saving an entry with fee > $0: promptBus fires "Create Invoice?" prompt (cross-module link via useLinker).
Entries can be linked to an appointment via linkedAppointmentId.

═══════════════════════════════════════════
INVOICES  (Invoices.jsx)
═══════════════════════════════════════════
Available on ALL plans.

Invoice statuses: Draft → Sent → Paid → Overdue → Pending

Two-step send flow (InvoiceReviewModal):
  Step 1 — Preview: shows client name, invoice number, line items, due date, total, payment link, notes
  Step 2 — Smart warnings before Confirm & Send:
    CRITICAL (blocks send): "Amount is $0 — verify the fee before sending."
    WARN: "No due date set — the client won't know when payment is expected."
    WARN: "[client name] doesn't match any saved Client — check the name."
  Step 3 — Confirm & Send: marks invoice as Sent, copies branded email template to clipboard

Public pay page: /pay/:invoiceId — no auth required.
SMS reminder: built-in send reminder flow on sent invoices.

═══════════════════════════════════════════
MILEAGE  (mileage.jsx + ActiveTripContext.jsx)
═══════════════════════════════════════════
Available on ALL plans.

GPS uses Haversine formula. Jitter filter: ignores position changes under 50 ft (~0.0095 miles) to avoid GPS drift noise.
IRS 2025 rate: $0.67/mile — applied automatically to every trip.

How tracking starts:
  AUTO: When user confirms Pre-Departure Checklist → ActiveTripProvider.startTrip() called directly
  MANUAL: Mileage page Start button

How tracking stops:
  - Floating live trip banner (visible on all pages) → Stop button
  - ArriveMode page → "Stop & Log" button
  - Mileage page → Stop button

Trip record saves: origin, destination, miles, linked job ID (if from Job Inbox accept), purpose, start time, end time.

═══════════════════════════════════════════
COMMAND CENTER / AUTO-CLOSEOUT AGENT  (AgentPage.jsx + agentOps.js)
═══════════════════════════════════════════
PRO+ only. Locked on Free (shows paywall with upgrade prompt).

THREE AUTONOMY MODES (set in Settings → Agent Mode):
  Assistive  — "Suggests only — you control everything"
               Agent surfaces suggestions but waits for explicit approval on every step.
  Supervised — "Suggests + pre-fills drafts for your review"
               Agent creates draft journal + invoice. Both wait in Review Queue. Nothing saves without your approval.
  Autonomous — "Auto-creates checklists + drafts on phase change"
               Agent drafts AND saves journal + invoice automatically after appointment completes.

How Auto-Closeout fires (useLinker.js):
  1. User taps "Mark Complete" on an appointment in Schedule or ArriveMode
  2. useLinker.completeAppointment(apt) fires
  3. Checks: (a) agent hasn't already run for this appointment, (b) enableAutoCloseoutAgent is not false
  4. If both clear: toast fires "⚡ Auto-Closeout triggered — check Command Center in ~30 seconds."
  5. runCloseoutAgentWithAI(appointmentId) calls AI API asynchronously
  6. On success: toast fires "✦ Closeout ready — journal + invoice drafted in Command Center."
  7. On AI failure: fallback to sync runCloseoutAgent — creates draft journal + invoice from appointment data directly

What the agent creates (runCloseoutAgent in agentOps.js):
  Draft Journal Entry:
    - actType: mapped from appointment service type
    - signerName: from appointment.client
    - idType: "Driver's License" (default, user should update)
    - fee: min(appointment.amount, state fee cap from feeSchedules)
    - notes: "Drafted by closeout agent from appointment #[id]"
    - qualityScore: 65 (baseline, needs user review)
    - linked to appointment via linkedAppointmentId

  Draft Invoice:
    - client: from appointment.client
    - amount: min(appointment.amount, state fee cap)
    - due: appointment.date
    - status: "Draft"
    - notes: "Auto-drafted by closeout agent for [service type]"
    - linked to appointment via linkedAppointmentId

Review Queue in Command Center: approve, edit, or reject AI-drafted items.
pendingAgentCount drives the badge on the Command Center nav item (Pro+ only).

═══════════════════════════════════════════
AI COMPLIANCE COACH  (guardianService.js)
═══════════════════════════════════════════
PRO+ only. Accessible from Command Center.
Data source: notary_primary_sources_v2.json — verified statutes for all 50 states.

Rules the AI follows:
  - Answers ONLY from the state data in notary_primary_sources_v2.json
  - If information isn't in the dataset: responds "Not found in provided primary sources" — never guesses
  - Only injects the queried state's jurisdiction record (not all 51) — cuts token usage by ~96%
  - Covers: fee caps, acceptable ID types, RON authorization, journal requirements, seal requirements, evidence citations

═══════════════════════════════════════════
ACT LIBRARY  (FormGuide.jsx)
═══════════════════════════════════════════
PRO+ only. Locked on Free.
Full reference for every notarial act type with state-specific requirements.

═══════════════════════════════════════════
SIGNER PORTAL  (SignerPortal.jsx)
═══════════════════════════════════════════
PRO+: standard portal.
Agency: white-label (custom branding).
Signers access their view at /portal/:id — no login required.
KPI dashboard for portal activity visible to the notary.

═══════════════════════════════════════════
TAX CENTER  (TaxCenterPage.jsx)
═══════════════════════════════════════════
Available on ALL plans.
Tabs: Income, Deductions, Mileage, Expenses
Income is pulled from jobs at lifecycle stages: Completed, Invoice Sent, Payment Received.
Deductible expense categories tracked.
CPA-ready CSV export available.
Quarterly tax estimate calculator.

═══════════════════════════════════════════
MARKET INSIGHTS  (NetworkInsightsPage.jsx + jobIntelligenceService.js)
═══════════════════════════════════════════
Available on ALL plans.
Fee benchmarks by job type with low/avg/high ranges.
Same benchmark data powers the Job Intelligence profitability score in Job Inbox.

═══════════════════════════════════════════
TEAM DISPATCH  (TeamDispatch.jsx)
═══════════════════════════════════════════
Agency only.
Assign and dispatch jobs to team notaries.
Track status and SLA per job.
When a dispatch job is completed: linked appointment status updates automatically (via useLinker.completeSignerSession).

═══════════════════════════════════════════
ADMIN PANEL  (Admin.jsx)
═══════════════════════════════════════════
Agency plan + Owner/Admin/Compliance Manager/Agency Admin role required.
Manage: state fee schedules, ID requirements, state policy records, knowledge articles, user roles.
Changes propagate to AI Compliance Coach immediately.

═══════════════════════════════════════════
SETTINGS  (Settings.jsx)
═══════════════════════════════════════════
All plans: profile name (used in Signer Confirmation messages), notification preferences, dark/light theme.
Pro+: autonomy mode selector (Assistive / Supervised / Autonomous), enable/disable Auto-Closeout agent toggle.
Billing: plan tier, annual/monthly toggle, upgrade prompts.

═══════════════════════════════════════════
AUDIT LOG  (AuditPage.jsx)
═══════════════════════════════════════════
All plans. Timestamped log of every action: actor, role, action type, resource type, resource ID, label, diff.
Compliance-ready export.

═══════════════════════════════════════════
SIGN OUT  (Layout.jsx — recently fixed)
═══════════════════════════════════════════
Sign out button: clears localStorage key 'notaryfix_data', sets onboardingComplete: false, navigates to /auth.
Previously broken: it only reset planTier and userRole but left onboardingComplete: true, causing RouteGuard to redirect back to /dashboard. This was fixed — Layout.jsx now calls localStorage.removeItem('notaryfix_data') first.

═══════════════════════════════════════════
DATA STORAGE
═══════════════════════════════════════════
All data stored in localStorage under key: 'notaryfix_data'
State compliance data in: notary_primary_sources_v2.json (50 states)
App is a PWA — installable on iOS and Android.

═══════════════════════════════════════════
CROSS-MODULE WIRING (useLinker.js)
═══════════════════════════════════════════
completeAppointment(apt): marks complete → fires closeout agent → shows journal/invoice prompts if agent not available
afterJournalSave(entry): if fee > 0 and no invoice yet → shows "Create Invoice?" prompt
completeSignerSession(session): updates linked appointment + linked dispatch job → shows invoice prompt
toast: global toast notifications (success/info/error) used everywhere
promptBus: global modal prompts (journal prompt, invoice prompt) fired cross-module

═══════════════════════════════════════════
RESPONSE RULES
═══════════════════════════════════════════
1. Always tell the user which page or button to use — be specific
2. If a feature needs upgrading, state the minimum plan required
3. Use numbered steps for any workflow
4. If the question isn't covered above, say "I don't have that detail in my source data" — never invent
5. Keep answers concise and practical`;

// ─── QUICK QUESTIONS ──────────────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  { label: 'What does the Free plan include?', icon: '🆓' },
  { label: 'Walk me through the full job workflow', icon: '🗺️' },
  { label: 'How does Pre-Departure Checklist work?', icon: '🚗' },
  { label: 'What are all the on-site ArriveMode checks?', icon: '✅' },
  { label: 'What does the Auto-Closeout Agent create?', icon: '⚡' },
  { label: 'What are the 3 agent autonomy modes?', icon: '🤖' },
  { label: 'How do I send an invoice?', icon: '💸' },
  { label: 'What does accepting a job do automatically?', icon: '📥' },
  { label: 'How does GPS mileage tracking start?', icon: '📍' },
  { label: "What's the difference between Pro and Agency?", icon: '📊' },
];

// ─── FEATURE MAP ──────────────────────────────────────────────────────────────
const FEATURE_SECTIONS = [
  {
    title: 'Core Workflow',
    color: '#3b82f6',
    items: [
      { name: 'Schedule', tier: 'free', path: '/schedule', desc: '14/week (Free) or unlimited (Pro+). 🚗 Pre-Departure on every card. Signer Confirmation fires on save.' },
      { name: 'Pre-Departure Checklist', tier: 'free', path: null, desc: 'Blocking checklist before leaving. Critical items gate the Depart button. GPS auto-starts on confirm.' },
      { name: 'Signer Confirmation', tier: 'free', path: null, desc: 'Auto-fires after every appointment save. Type-specific what-to-bring. SMS/email with one tap.' },
      { name: 'ArriveMode', tier: 'free', path: '/arrive/:id', desc: 'Phase 2 on-site checklist. All critical items must be checked to unlock Begin Signing.' },
      { name: 'Clients', tier: 'free', path: '/clients', desc: 'Address book. Auto-populated from Job Inbox accept. Duplicate name check.' },
    ],
  },
  {
    title: 'Job Inbox & Finance',
    color: '#10b981',
    items: [
      { name: 'Job Inbox', tier: 'free', path: '/job-inbox', desc: 'Text paste + screenshot upload. Job Intelligence scoring. Accept → auto-schedule + auto-add client.' },
      { name: 'Invoices', tier: 'free', path: '/invoices', desc: 'Two-step Preview → Confirm & Send. Warns on $0, missing due date, unknown client.' },
      { name: 'Mileage', tier: 'free', path: '/mileage', desc: 'Haversine GPS, jitter-filtered. $0.67/mile IRS 2025. Auto-starts from Pre-Departure Checklist.' },
      { name: 'Tax Center', tier: 'free', path: '/tax-center', desc: 'Income, deductions, expenses, mileage. CPA-ready CSV export. Quarterly estimates.' },
      { name: 'Market Insights', tier: 'free', path: '/market-insights', desc: 'Fee benchmarks low/avg/high for every job type. Same data as Job Intelligence scoring.' },
    ],
  },
  {
    title: 'AI & Intelligence',
    color: '#6366f1',
    items: [
      { name: 'Command Center', tier: 'pro', path: '/agent', desc: 'Auto-Closeout hub. 3 modes: Assistive / Supervised / Autonomous. Review queue. Agent history.' },
      { name: 'AI Compliance Coach', tier: 'pro', path: '/agent', desc: 'Q&A from notary_primary_sources_v2.json. Covers all 50 states. Never guesses — says not found if unknown.' },
      { name: 'Act Library', tier: 'pro', path: '/form-guide', desc: 'Full reference for every notarial act type with state-specific requirements.' },
    ],
  },
  {
    title: 'Agency & Team',
    color: '#8b5cf6',
    items: [
      { name: 'Signer Portal', tier: 'pro', path: '/signer-portal', desc: 'Standard (Pro) or white-label (Agency). Public view at /portal/:id — no signer login needed.' },
      { name: 'Team Dispatch', tier: 'agency', path: '/team-dispatch', desc: 'Assign jobs to team notaries. SLA tracking. Completion updates linked appointment automatically.' },
      { name: 'Admin Panel', tier: 'agency', path: '/admin', desc: 'State fees, ID requirements, policy records, user roles. Changes feed AI Compliance Coach immediately.' },
      { name: 'Audit Log', tier: 'free', path: '/audit', desc: 'Full timestamped log. Actor, role, action, resource, diff. Compliance-ready.' },
    ],
  },
];

// ─── TIER BADGE ───────────────────────────────────────────────────────────────
const TierBadge = ({ tier }) => {
  const s = {
    free:   { bg: '#1e293b', text: '#94a3b8', label: 'FREE' },
    pro:    { bg: '#1e3a5f', text: '#60a5fa', label: 'PRO' },
    agency: { bg: '#2d1b69', text: '#a78bfa', label: 'AGENCY' },
  }[tier] || { bg: '#1e293b', text: '#94a3b8', label: tier?.toUpperCase() };
  return (
    <span style={{ background: s.bg, color: s.text, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, letterSpacing: 1 }}>
      {s.label}
    </span>
  );
};

// ─── MESSAGE RENDERER ─────────────────────────────────────────────────────────
const renderMarkdown = (text) => {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14, marginTop: 12, marginBottom: 4 }}>{line.slice(4)}</div>;
    if (line.startsWith('## '))  return <div key={i} style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15, marginTop: 14, marginBottom: 4 }}>{line.slice(3)}</div>;
    if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('✅ ') || line.startsWith('○ ')) {
      const content = line.replace(/^[-•✅○]\s*/, '');
      const icon = line.startsWith('✅') ? '✅' : line.startsWith('○') ? '○' : '·';
      const parts = content.split(/\*\*(.+?)\*\*/g);
      return <div key={i} style={{ display: 'flex', gap: 6, marginLeft: 8, marginBottom: 2 }}>
        <span style={{ color: '#64748b', minWidth: 14 }}>{icon}</span>
        <span style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#f1f5f9' }}>{p}</strong> : p)}</span>
      </div>;
    }
    if (/^\d+\./.test(line)) {
      const content = line.replace(/^\d+\.\s*/, '');
      const num = line.match(/^(\d+)/)?.[1];
      const parts = content.split(/\*\*(.+?)\*\*/g);
      return <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4, marginBottom: 3 }}>
        <span style={{ color: '#3b82f6', fontWeight: 700, minWidth: 16, fontSize: 12 }}>{num}.</span>
        <span style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#f1f5f9' }}>{p}</strong> : p)}</span>
      </div>;
    }
    if (line.trim() === '') return <div key={i} style={{ height: 6 }} />;
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return <div key={i} style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6, marginBottom: 2 }}>
      {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#f1f5f9' }}>{p}</strong> : p)}
    </div>;
  });
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function NotaryOSGuide() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi — I'm the NotaryOS Guide. My knowledge is built directly from the app's source code, so I can give you accurate answers about every feature, workflow, and plan.\n\nAsk me anything, or tap a question below to get started.",
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('chat');
  const [openSection, setOpenSection] = useState(null);
  const [copied, setCopied] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setTab('chat');
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.find(b => b.type === 'text')?.text || 'No response. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, loading, messages]);

  const reset = () => {
    setMessages([{ role: 'assistant', content: "Hi — I'm the NotaryOS Guide. My knowledge is built directly from the app's source code, so I can give you accurate answers about every feature, workflow, and plan.\n\nAsk me anything, or tap a question below to get started." }]);
    setInput('');
  };

  const copyMsg = async (content, idx) => {
    await navigator.clipboard.writeText(content).catch(() => {});
    setCopied(idx);
    setTimeout(() => setCopied(null), 1800);
  };

  // ── styles ──
  const S = {
    root:     { display: 'flex', flexDirection: 'column', height: '100%', background: '#080f1a', fontFamily: 'system-ui, sans-serif' },
    header:   { flexShrink: 0, borderBottom: '1px solid #1e293b', background: '#0d1627', padding: '12px 16px' },
    tabs:     { display: 'flex', gap: 4, marginTop: 10 },
    tab:      (active) => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', background: active ? '#2563eb' : 'transparent', color: active ? '#fff' : '#64748b' }),
    scroll:   { flex: 1, overflowY: 'auto', padding: '16px', scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' },
    userBub:  { display: 'flex', justifyContent: 'flex-end', marginBottom: 12 },
    aiBub:    { display: 'flex', gap: 10, marginBottom: 12 },
    aiBubInner: { flex: 1, background: '#0d1627', border: '1px solid #1e293b', borderRadius: '0 16px 16px 16px', padding: '12px 14px' },
    userInner:  { maxWidth: '80%', background: '#2563eb', borderRadius: '16px 16px 0 16px', padding: '10px 14px' },
    avatar:   { width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
    inputRow: { flexShrink: 0, borderTop: '1px solid #1e293b', background: '#0d1627', padding: '12px 16px' },
    input:    { flex: 1, background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '10px 14px', color: '#f1f5f9', fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 100, overflowY: 'auto' },
    sendBtn:  (on) => ({ width: 40, height: 40, borderRadius: 10, border: 'none', cursor: on ? 'pointer' : 'not-allowed', background: on ? '#2563eb' : '#1e293b', color: on ? '#fff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }),
    chip:     { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#0d1627', border: '1px solid #1e293b', borderRadius: 10, color: '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' },
    section:  (color) => ({ borderRadius: 12, border: `1px solid ${color}30`, marginBottom: 10, overflow: 'hidden' }),
    secHead:  (color) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: `${color}10`, cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' }),
    featureRow: { padding: '10px 14px', background: '#0d1627', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    askBtn:   { flexShrink: 0, padding: '4px 10px', borderRadius: 8, border: '1px solid #1e293b', background: 'transparent', color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
    copyBtn:  (active) => ({ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'transparent', border: 'none', color: active ? '#22c55e' : '#475569', fontSize: 11, cursor: 'pointer', marginTop: 4 }),
  };

  return (
    <div style={S.root}>

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 15 }}>NotaryOS Guide</div>
              <div style={{ fontSize: 11, color: '#475569' }}>Grounded in source code</div>
            </div>
          </div>
          <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'transparent', border: '1px solid #1e293b', borderRadius: 8, color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            New Chat
          </button>
        </div>
        <div style={S.tabs}>
          {[{ id: 'chat', label: 'Ask Guide' }, { id: 'features', label: 'Feature Map' }].map(t => (
            <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* CHAT */}
      {tab === 'chat' && (
        <>
          <div style={S.scroll}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {messages.map((msg, i) => msg.role === 'user' ? (
                <div key={i} style={S.userBub}>
                  <div style={S.userInner}>
                    <div style={{ color: '#fff', fontSize: 13, lineHeight: 1.5 }}>{msg.content}</div>
                  </div>
                </div>
              ) : (
                <div key={i} style={S.aiBub}>
                  <div style={S.avatar}><svg width="15" height="15" fill="#fff" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
                  <div style={{ flex: 1 }}>
                    <div style={S.aiBubInner}>{renderMarkdown(msg.content)}</div>
                    <button style={S.copyBtn(copied === i)} onClick={() => copyMsg(msg.content, i)}>
                      {copied === i ? '✓ Copied' : '⎘ Copy'}
                    </button>
                  </div>
                </div>
              ))}

              {loading && (
                <div style={S.aiBub}>
                  <div style={S.avatar}><svg width="15" height="15" fill="#fff" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
                  <div style={S.aiBubInner}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', color: '#475569', fontSize: 13 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1s infinite' }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1s 0.2s infinite' }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1s 0.4s infinite' }} />
                    </div>
                  </div>
                </div>
              )}

              {messages.length === 1 && !loading && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Quick questions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {QUICK_QUESTIONS.map(q => (
                      <button key={q.label} style={S.chip} onClick={() => send(q.label)}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#93c5fd'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}>
                        <span>{q.icon}</span>{q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div style={S.inputRow}>
            <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea ref={inputRef} rows={1} placeholder="Ask anything about NotaryOS…" style={S.input}
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
              <button style={S.sendBtn(!!input.trim() && !loading)} onClick={() => send()} disabled={!input.trim() || loading}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#1e293b', marginTop: 6 }}>Enter to send · Shift+Enter for new line</div>
          </div>
        </>
      )}

      {/* FEATURE MAP */}
      {tab === 'features' && (
        <div style={S.scroll}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14, padding: '10px 14px', background: '#0d1627', borderRadius: 12, border: '1px solid #1e293b', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Plans:</span>
              {[{ tier: 'free', price: '$0/mo' }, { tier: 'pro', price: '$19/mo' }, { tier: 'agency', price: '$49/mo' }].map(p => (
                <div key={p.tier} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TierBadge tier={p.tier} />
                  <span style={{ fontSize: 12, color: '#475569' }}>{p.price}</span>
                </div>
              ))}
            </div>

            {FEATURE_SECTIONS.map(sec => (
              <div key={sec.title} style={S.section(sec.color)}>
                <button style={S.secHead(sec.color)} onClick={() => setOpenSection(openSection === sec.title ? null : sec.title)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sec.color }} />
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13 }}>{sec.title}</span>
                    <span style={{ fontSize: 11, color: '#475569' }}>{sec.items.length} features</span>
                  </div>
                  <svg width="14" height="14" fill="none" stroke="#475569" strokeWidth="2" viewBox="0 0 24 24">
                    {openSection === sec.title ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                  </svg>
                </button>
                {openSection === sec.title && sec.items.map(item => (
                  <div key={item.name} style={S.featureRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13 }}>{item.name}</span>
                        <TierBadge tier={item.tier} />
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                      {item.path && <div style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace', marginTop: 3 }}>{item.path}</div>}
                    </div>
                    <button style={S.askBtn} onClick={() => send(`Tell me everything about the ${item.name} feature`)}
                      onMouseEnter={e => { e.currentTarget.style.color = '#93c5fd'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#1e293b'; }}>
                      Ask →
                    </button>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ textAlign: 'center', padding: 20, borderRadius: 12, border: '1px solid #1e3a5f', background: '#0d1a2f' }}>
              <div style={{ fontWeight: 700, color: '#93c5fd', marginBottom: 8, fontSize: 13 }}>Have a specific question?</div>
              <button onClick={() => setTab('chat')} style={{ padding: '8px 18px', background: '#2563eb', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Open Chat Guide
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  );
}
