// File: src/context/DataContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

const todayISO = new Date().toISOString().split('T')[0];
const d1 = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const d2 = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
const d3 = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
const d4 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
const in2h = new Date(Date.now() + 2 * 3600000).toISOString();
const in6h = new Date(Date.now() + 6 * 3600000).toISOString();
const in1d = new Date(Date.now() + 86400000).toISOString();
const past4h = new Date(Date.now() - 4 * 3600000).toISOString();

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
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' },
];

const parseMoneyLike = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
};


const defaultData = {
  appointments: [
    { id: 1, client: 'Sarah Johnson', type: 'Loan Signing', date: todayISO, time: '2:00 PM', status: 'upcoming', amount: 150, location: 'Downtown' },
    { id: 2, client: 'TechCorp Inc', type: 'I-9 Verification', date: todayISO, time: '4:30 PM', status: 'upcoming', amount: 45, location: 'Remote' },
  ],
  clients: [
    { id: 1, name: 'TechCorp Inc', contact: 'Sarah Smith', email: 'sarah@techcorp.com', phone: '(555) 123-4567', type: 'Corporate', status: 'Active' },
    { id: 2, name: 'Sarah Johnson', contact: 'Sarah Johnson', email: 's.johnson@email.com', phone: '(555) 987-6543', type: 'Individual', status: 'Active' },
  ],
  invoices: [
    { id: 'INV-1024', client: 'Estate Realty', amount: 150.00, date: 'Oct 24, 2025', status: 'Paid', due: 'Oct 24, 2025' },
    { id: 'INV-1025', client: 'TechCorp Inc', amount: 45.00, date: 'Oct 25, 2025', status: 'Pending', due: 'Nov 01, 2025' },
  ],
  mileageLogs: [
    { id: 1, date: '2025-10-24', destination: 'Downtown Title Office', purpose: 'Loan Signing - Sarah Johnson', miles: 14.5 },
    { id: 2, date: '2025-10-22', destination: 'TechCorp HQ', purpose: 'I-9 Verifications', miles: 8.2 },
  ],
  settings: {
    name: 'Alex Rivera',
    businessName: 'Rivera Mobile Notary',
    planTier: 'free',
    userRole: 'owner',
    currentStateCode: 'WA',
    costPerMile: 0.67,
    taxRate: 15,
    monthlyGoal: 15000,
    commissionRate: 12,
    complianceReviewDay: 'Monday',
    eAndOExpiresOn: '2026-12-31',
    onboardingComplete: true,
  },
  complianceItems: [
    { id: 1, title: 'E&O Insurance Active', category: 'Insurance', dueDate: '2026-12-31', status: 'Compliant', notes: 'Policy #EON-3392 renewed.' },
    { id: 2, title: 'Journal Entries Up To Date', category: 'Records', dueDate: todayISO, status: 'Needs Review', notes: 'Audit journal entries for completeness.' },
  ],
  agentRuns: [],
  signerSessions: [
    { id: 1, clientName: 'Estate Realty', signerName: 'Sarah Johnson', signerEmail: 's.johnson@email.com', status: 'active', createdAt: past4h, startedAt: past4h, completedAt: null },
  ],
  signerDocuments: [
    { id: 1, sessionId: 1, name: 'Deed of Trust.pdf', status: 'uploaded', uploadedAt: past4h, reviewedAt: null, notes: '' },
  ],
  portalMessages: [
    { id: 1, sessionId: 1, sender: 'notary', body: 'Hi Sarah — your documents are ready. Please review and confirm the appointment time.', createdAt: past4h, isPinned: false },
  ],
  journalEntries: [
    {
      id: 1, entryNumber: 'JE-0001', date: d1, time: '14:00',
      actType: 'Acknowledgment', signerName: 'Sarah Johnson', signerAddress: '123 Maple St, Seattle, WA 98101',
      idType: "Driver's License", idIssuingState: 'WA', idLast4: '4821', idExpiration: '2028-06-15',
      fee: 15, thumbprintTaken: true, witnessRequired: false,
      notes: 'Loan package closing. Signer presented unexpired WA DL.',
      documentDescription: 'Deed of Trust', linkedAppointmentId: 1, linkedInvoiceId: 'INV-1024',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 2, entryNumber: 'JE-0002', date: d2, time: '10:30',
      actType: 'Jurat', signerName: 'Marcus Webb', signerAddress: '456 Pine Ave, San Jose, CA 95110',
      idType: 'Passport', idIssuingState: 'US', idLast4: '1142', idExpiration: '2027-11-01',
      fee: 15, thumbprintTaken: false, witnessRequired: false,
      notes: 'General affidavit; oath administered.',
      documentDescription: 'Affidavit', linkedAppointmentId: null, linkedInvoiceId: null,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
  journalSettings: {
    defaultFee: 15,
    requireThumbprintFor: ['Deed of Trust', 'Grant Deed'],
    enableScoring: true,
    retentionYears: 10,
  },
  teamMembers: [
    { id: 1, name: 'Alex Rivera', role: 'owner', status: 'active', email: 'alex@riveranotary.com', phone: '(555) 333-2211', createdAt: d4 },
    { id: 2, name: 'Alex Carter', role: 'dispatcher', status: 'active', email: 'alex@antonionotary.com', phone: '(555) 222-1144', createdAt: d3 },
  ],
  dispatchJobs: [
    { id: 1, title: 'Loan Signing — Johnson', state: 'WA', status: 'assigned', assignedTo: 2, scheduledAt: in2h, createdAt: d1, updatedAt: d1 },
    { id: 2, title: 'I-9 Verification — TechCorp', state: 'WA', status: 'queued', assignedTo: null, scheduledAt: in6h, createdAt: d1, updatedAt: d1 },
    { id: 3, title: 'Jurat — Webb', state: 'CA', status: 'completed', assignedTo: 2, scheduledAt: in1d, createdAt: d3, updatedAt: d1 },
  ],
  dispatchNotes: [
    { id: 1, jobId: 1, author: 'Alex Carter', body: 'Signer requested evening slot if possible.', createdAt: d1 },
  ],
  payouts: [],
  dispatchAuditLog: [],
  adminAuditLog: [
    { id: 1, actor: 'Alex Rivera', actorRole: 'owner', action: 'created', resourceType: 'stateRules', resourceId: 1, resourceLabel: 'Washington 2024-v2', diff: 'New record', timestamp: new Date(Date.now() - 7.5 * 3600000).toISOString() },
    { id: 2, actor: 'Alex Rivera', actorRole: 'owner', action: 'updated', resourceType: 'knowledgeArticles', resourceId: 2, resourceLabel: 'California Thumbprint Journal Requirements', diff: 'content updated', timestamp: new Date(Date.now() - 6.5 * 3600000).toISOString() },
    { id: 3, actor: 'Alex Carter', actorRole: 'dispatcher', action: 'deleted', resourceType: 'feeSchedules', resourceId: 88, resourceLabel: 'OH — Acknowledgment', diff: 'Record deleted', timestamp: new Date(Date.now() - 5.5 * 3600000).toISOString() },
    { id: 4, actor: 'Alex Rivera', actorRole: 'owner', action: 'published', resourceType: 'knowledgeArticles', resourceId: 1, resourceLabel: 'Washington RON Requirements & Platform Setup', diff: 'status: draft → published', timestamp: new Date(Date.now() - 4.5 * 3600000).toISOString() },
  ],

  // ─── ADMIN DATA ─────────────────────────────────────────────────────────────
  stateRules: [
    {
      id: 1,
      state: 'Washington',
      stateCode: 'WA',
      version: '2024-v2',
      effectiveDate: '2024-01-01',
      status: 'active',
      maxFeePerAct: 10,
      thumbprintRequired: true,
      journalRequired: true,
      ronPermitted: true,
      ronStatute: 'RCW 42.44.265',
      seal: 'Required — black ink embossed',
      retentionYears: 10,
      notarizationTypes: ['Acknowledgment', 'Jurat', 'Oath / Affirmation', 'Copy Certification', 'RON'],
      notes: 'WA amended notary rules effective 2024. RON permitted with approved platform.',
      witnessRequirements: '',
      specialActCaveats: '',
      officialSourceUrl: '',
      publishedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 2,
      state: 'California',
      stateCode: 'CA',
      version: '2023-v3',
      effectiveDate: '2023-07-01',
      status: 'active',
      maxFeePerAct: 15,
      thumbprintRequired: true,
      journalRequired: true,
      ronPermitted: false,
      ronStatute: '',
      seal: 'Required — blue or black ink',
      retentionYears: 10,
      notarizationTypes: ['Acknowledgment', 'Jurat', 'Oath / Affirmation', 'Copy Certification', 'Deposition'],
      notes: 'CA does not permit RON as of current statute. $15 max per signature.',
      witnessRequirements: '',
      specialActCaveats: '',
      officialSourceUrl: '',
      publishedAt: new Date(Date.now() - 180 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 3,
      state: 'Texas',
      stateCode: 'TX',
      version: '2024-v1',
      effectiveDate: '2024-03-01',
      status: 'draft',
      maxFeePerAct: 6,
      thumbprintRequired: false,
      journalRequired: false,
      ronPermitted: true,
      ronStatute: 'Gov. Code §406.110',
      seal: 'Required — black ink',
      retentionYears: 3,
      notarizationTypes: ['Acknowledgment', 'Jurat', 'Oath / Affirmation', 'RON'],
      notes: 'TX journal not required by statute but recommended. Max $6 per notarial act.',
      witnessRequirements: '',
      specialActCaveats: '',
      officialSourceUrl: '',
      publishedAt: null,
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ],

  feeSchedules: [
    {
      id: 1,
      stateCode: 'WA',
      actType: 'Acknowledgment',
      maxFee: 10,
      notes: 'Per signature, per signer.',
      effectiveDate: '2024-01-01',
      updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 2,
      stateCode: 'WA',
      actType: 'Jurat',
      maxFee: 10,
      notes: 'Per signature.',
      effectiveDate: '2024-01-01',
      updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 3,
      stateCode: 'CA',
      actType: 'Acknowledgment',
      maxFee: 15,
      notes: 'Per signature.',
      effectiveDate: '2023-07-01',
      updatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 4,
      stateCode: 'CA',
      actType: 'Jurat',
      maxFee: 15,
      notes: 'Per signature.',
      effectiveDate: '2023-07-01',
      updatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 5,
      stateCode: 'TX',
      actType: 'Acknowledgment',
      maxFee: 6,
      notes: 'Per notarial act.',
      effectiveDate: '2024-03-01',
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ],

  idRequirements: [
    {
      id: 1,
      stateCode: 'WA',
      acceptedIdTypes: ["Driver's License", 'Passport', 'Passport Card', 'State ID Card', 'Military ID', 'Tribal ID', 'Permanent Resident Card'],
      expirationRequired: true,
      twoFormAllowed: true,
      credibleWitnessAllowed: true,
      notes: 'ID must be current (not expired). Credible witnesses allowed when ID unavailable.',
      updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 2,
      stateCode: 'CA',
      acceptedIdTypes: ["Driver's License", 'Passport', 'Passport Card', 'State ID Card', 'Military ID', 'Inmate ID', 'Foreign Passport'],
      expirationRequired: true,
      twoFormAllowed: false,
      credibleWitnessAllowed: true,
      notes: 'CA requires thumbprint in journal for deeds of trust affecting real property. Single current ID typically required.',
      updatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 3,
      stateCode: 'TX',
      acceptedIdTypes: ["Driver's License", 'Passport', 'Passport Card', 'State ID Card', 'Military ID'],
      expirationRequired: true,
      twoFormAllowed: true,
      credibleWitnessAllowed: false,
      notes: 'TX does not allow credible witnesses. Two forms of ID accepted if neither alone is sufficient.',
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ],

  knowledgeArticles: [
    {
      id: 1,
      title: 'Washington RON Requirements & Platform Setup',
      category: 'State Rules',
      stateCode: 'WA',
      content: 'Washington permits Remote Online Notarization under RCW 42.44.265. Notaries must use an approved platform, maintain audio-video records for 10 years, and obtain a $5,000 E&O endorsement. Signers must present ID via credential analysis technology.',
      tags: ['RON', 'Washington', 'Technology', 'Compliance'],
      status: 'published',
      authorName: 'Alex Rivera',
      publishedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 2,
      title: 'California Thumbprint Journal Requirements',
      category: 'Compliance',
      stateCode: 'CA',
      content: 'California requires a thumbprint in the notary journal for certain real-property related documents (e.g., deeds, deeds of trust, powers of attorney). Ensure the thumbprint is placed in the journal line item and the signer’s ID information is complete.',
      tags: ['California', 'Journal', 'Thumbprint'],
      status: 'draft',
      authorName: 'Alex Rivera',
      publishedAt: null,
      updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
  ],
};

const hydrate = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('notaryfix_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultData,
          ...parsed,
          appointments:    Array.isArray(parsed.appointments)    ? parsed.appointments    : defaultData.appointments,
          clients:         Array.isArray(parsed.clients)         ? parsed.clients         : defaultData.clients,
          invoices:        Array.isArray(parsed.invoices)        ? parsed.invoices        : defaultData.invoices,
          mileageLogs:     Array.isArray(parsed.mileageLogs)     ? parsed.mileageLogs     : defaultData.mileageLogs,
          complianceItems: Array.isArray(parsed.complianceItems) ? parsed.complianceItems : defaultData.complianceItems,
          agentRuns:      Array.isArray(parsed.agentRuns)      ? parsed.agentRuns      : defaultData.agentRuns,
          signerSessions:  Array.isArray(parsed.signerSessions)  ? parsed.signerSessions  : defaultData.signerSessions,
          signerDocuments: Array.isArray(parsed.signerDocuments) ? parsed.signerDocuments : defaultData.signerDocuments,
          portalMessages:  Array.isArray(parsed.portalMessages)  ? parsed.portalMessages  : defaultData.portalMessages,
          journalEntries:  Array.isArray(parsed.journalEntries)  ? parsed.journalEntries  : defaultData.journalEntries,
          teamMembers:     Array.isArray(parsed.teamMembers)     ? parsed.teamMembers     : defaultData.teamMembers,
          dispatchJobs:    Array.isArray(parsed.dispatchJobs)    ? parsed.dispatchJobs    : defaultData.dispatchJobs,
          dispatchNotes:   Array.isArray(parsed.dispatchNotes)   ? parsed.dispatchNotes   : defaultData.dispatchNotes,
          payouts:         Array.isArray(parsed.payouts)         ? parsed.payouts         : defaultData.payouts,
          dispatchAuditLog: Array.isArray(parsed.dispatchAuditLog) ? parsed.dispatchAuditLog : defaultData.dispatchAuditLog,
          adminAuditLog:   Array.isArray(parsed.adminAuditLog)   ? parsed.adminAuditLog   : defaultData.adminAuditLog,
          stateRules:      Array.isArray(parsed.stateRules)      ? parsed.stateRules      : defaultData.stateRules,
          feeSchedules:    Array.isArray(parsed.feeSchedules)    ? parsed.feeSchedules    : defaultData.feeSchedules,
          idRequirements:  Array.isArray(parsed.idRequirements)  ? parsed.idRequirements  : defaultData.idRequirements,
          knowledgeArticles: Array.isArray(parsed.knowledgeArticles) ? parsed.knowledgeArticles : defaultData.knowledgeArticles,
          settings: { ...defaultData.settings, ...(parsed.settings || {}) },
          journalSettings: { ...defaultData.journalSettings, ...(parsed.journalSettings || {}) },
        };
      } catch (e) {
        return defaultData;
      }
    }
  }
  return defaultData;
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(hydrate);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('notaryfix_data', JSON.stringify(data));
  }, [data]);

  const updateSettings = (u) => setData((p) => ({ ...p, settings: { ...p.settings, ...u } }));

  const addClient = (c) => setData((p) => ({ ...p, clients: [c, ...(p.clients || [])] }));

  const addInvoice    = (i)      => setData((p) => ({ ...p, invoices: [i, ...(p.invoices || [])] }));
  const updateInvoice = (id, u)  => setData((p) => ({ ...p, invoices: (p.invoices || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteInvoice = (id)     => setData((p) => ({ ...p, invoices: (p.invoices || []).filter((x) => x.id !== id) }));

  const addMileageLog    = (m)     => setData((p) => ({ ...p, mileageLogs: [m, ...(p.mileageLogs || [])] }));
  const updateMileageLog = (id, u) => setData((p) => ({ ...p, mileageLogs: (p.mileageLogs || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteMileageLog = (id)    => setData((p) => ({ ...p, mileageLogs: (p.mileageLogs || []).filter((x) => x.id !== id) }));

  const addAppointment    = (a)     => setData((p) => ({ ...p, appointments: [a, ...(p.appointments || [])] }));
  const updateAppointment = (id, u) => setData((p) => ({ ...p, appointments: (p.appointments || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteAppointment = (id)    => setData((p) => ({ ...p, appointments: (p.appointments || []).filter((x) => x.id !== id) }));

  const addComplianceItem    = (c)     => setData((p) => ({ ...p, complianceItems: [c, ...(p.complianceItems || [])] }));
  const updateComplianceItem = (id, u) => setData((p) => ({ ...p, complianceItems: (p.complianceItems || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteComplianceItem = (id)    => setData((p) => ({ ...p, complianceItems: (p.complianceItems || []).filter((x) => x.id !== id) }));

  const addSignerSession    = (s)     => setData((p) => ({ ...p, signerSessions: [s, ...(p.signerSessions || [])] }));
  const updateSignerSession = (id, u) => setData((p) => ({ ...p, signerSessions: (p.signerSessions || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteSignerSession = (id)    => setData((p) => ({ ...p, signerSessions: (p.signerSessions || []).filter((x) => x.id !== id) }));

  const addSignerDocument    = (d)     => setData((p) => ({ ...p, signerDocuments: [d, ...(p.signerDocuments || [])] }));
  const updateSignerDocument = (id, u) => setData((p) => ({ ...p, signerDocuments: (p.signerDocuments || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteSignerDocument = (id)    => setData((p) => ({ ...p, signerDocuments: (p.signerDocuments || []).filter((x) => x.id !== id) }));

  const addPortalMessage    = (m)     => setData((p) => ({ ...p, portalMessages: [m, ...(p.portalMessages || [])] }));
  const updatePortalMessage = (id, u) => setData((p) => ({ ...p, portalMessages: (p.portalMessages || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deletePortalMessage = (id)    => setData((p) => ({ ...p, portalMessages: (p.portalMessages || []).filter((x) => x.id !== id) }));

  const addJournalEntry    = (j)     => setData((p) => ({ ...p, journalEntries: [j, ...(p.journalEntries || [])] }));
  const updateJournalEntry = (id, u) => setData((p) => ({ ...p, journalEntries: (p.journalEntries || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteJournalEntry = (id)    => setData((p) => ({ ...p, journalEntries: (p.journalEntries || []).filter((x) => x.id !== id) }));

  const updateJournalSettings = (u) => setData((p) => ({ ...p, journalSettings: { ...p.journalSettings, ...u } }));

  const createJournalDraftFromAppointment = (appointment) => ({
    id: Date.now(),
    entryNumber: `JE-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    date: appointment.date || todayISO,
    time: appointment.time?.replace(' PM', '').replace(' AM', '') || '09:00',
    actType: 'Acknowledgment',
    signerName: appointment.client,
    signerAddress: '',
    idType: '',
    idIssuingState: '',
    idLast4: '',
    idExpiration: '',
    fee: appointment.amount || defaultData.journalSettings.defaultFee || 0,
    thumbprintTaken: false,
    witnessRequired: false,
    notes: '',
    documentDescription: appointment.type,
    linkedAppointmentId: appointment.id,
    linkedInvoiceId: null,
    createdAt: new Date().toISOString(),
  });

  const scoreEntry = (entry) => {
    if (!defaultData.journalSettings.enableScoring) return 100;
    const checks = [
      entry.signerName,
      entry.actType,
      entry.date,
      entry.idType,
      entry.fee != null,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  };

  const runCloseoutAgent = (appointmentId, actor = 'Closeout Agent') => setData((p) => {
    const appointment = (p.appointments || []).find((apt) => String(apt.id) === String(appointmentId));
    if (!appointment) return p;

    const stateCode = p.settings?.currentStateCode || 'WA';
    const schedule = (p.feeSchedules || []).find((fee) => fee.stateCode === stateCode && fee.actType === 'Acknowledgment');
    const suggestedAmount = parseMoneyLike(appointment.amount) ?? 0;
    const maxFee = parseMoneyLike(schedule?.maxFee);
    const invoiceAmount = maxFee == null ? suggestedAmount : Math.min(suggestedAmount, maxFee);

    const nowIso = new Date().toISOString();
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const runId = `AGENT-${Date.now()}`;
    const journalId = Date.now() + Math.floor(Math.random() * 999);

    const draftJournal = {
      id: journalId,
      entryNumber: `JE-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      date: appointment.date || todayISO,
      time: appointment.time?.replace(' PM', '').replace(' AM', '') || '09:00',
      actType: /jurat/i.test(appointment.type || '') ? 'Jurat' : 'Acknowledgment',
      signerName: appointment.client || 'Unknown Signer',
      signerAddress: '',
      idType: '',
      idIssuingState: stateCode,
      idLast4: '',
      idExpiration: '',
      fee: invoiceAmount,
      thumbprintTaken: false,
      witnessRequired: false,
      notes: `Drafted by closeout agent from appointment #${appointment.id}.`,
      documentDescription: appointment.type || 'Notary appointment',
      linkedAppointmentId: appointment.id,
      linkedInvoiceId: invoiceId,
      qualityScore: 65,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const draftInvoice = {
      id: invoiceId,
      client: appointment.client || 'Unknown',
      amount: invoiceAmount,
      date: new Date(nowIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      due: appointment.date || todayISO,
      status: 'Pending',
      notes: `Auto-drafted by closeout agent for ${appointment.type || 'notary service'}.`,
      sourceAppointmentId: appointment.id,
      createdAt: nowIso,
      sentAt: null,
      paymentLink: '',
    };

    const runRecord = {
      id: runId,
      appointmentId: appointment.id,
      appointmentClient: appointment.client || 'Unknown',
      actor,
      ranAt: nowIso,
      actions: [
        { type: 'journal_drafted', refId: journalId },
        { type: 'invoice_drafted', refId: invoiceId },
      ],
      warnings: [
        !draftJournal.idType ? 'Missing ID type in draft journal entry.' : null,
        !draftJournal.idLast4 ? 'Missing signer ID last 4.' : null,
      ].filter(Boolean),
    };

    const nextAppointments = (p.appointments || []).map((apt) => {
      if (String(apt.id) !== String(appointmentId)) return apt;
      return {
        ...apt,
        status: apt.status || 'completed',
        agentCloseoutRunId: runId,
        linkedInvoiceId: invoiceId,
        linkedJournalEntryId: journalId,
        closeoutCompletedAt: nowIso,
      };
    });

    return _appendAuditLog({
      ...p,
      appointments: nextAppointments,
      invoices: [draftInvoice, ...(p.invoices || [])],
      journalEntries: [draftJournal, ...(p.journalEntries || [])],
      agentRuns: [runRecord, ...(p.agentRuns || [])].slice(0, 200),
    }, {
      actor,
      actorRole: 'ai_agent',
      action: 'created',
      resourceType: 'closeoutAgent',
      resourceId: runId,
      resourceLabel: `${appointment.client || 'Unknown'} closeout`,
      diff: `Drafted journal ${draftJournal.entryNumber} + invoice ${invoiceId}`,
    });
  });

  const addTeamMember    = (m)     => setData((p) => ({ ...p, teamMembers: [m, ...(p.teamMembers || [])] }));
  const updateTeamMember = (id, u) => setData((p) => ({ ...p, teamMembers: (p.teamMembers || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteTeamMember = (id)    => setData((p) => ({ ...p, teamMembers: (p.teamMembers || []).filter((x) => x.id !== id) }));

  const addDispatchJob    = (j)     => setData((p) => ({ ...p, dispatchJobs: [j, ...(p.dispatchJobs || [])] }));
  const updateDispatchJob = (id, u) => setData((p) => ({ ...p, dispatchJobs: (p.dispatchJobs || []).map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x) }));
  const deleteDispatchJob = (id)    => setData((p) => ({ ...p, dispatchJobs: (p.dispatchJobs || []).filter((x) => x.id !== id) }));

  const _addDispatchAudit = (p, entry) => {
    const log = [...(p.dispatchAuditLog || []), { id: Date.now() + Math.random(), ts: new Date().toISOString(), ...entry }];
    return { ...p, dispatchAuditLog: log.slice(-200) };
  };

  const assignDispatchJob = (id, memberId) => setData((p) => {
    const job = (p.dispatchJobs || []).find((j) => j.id === id);
    const member = (p.teamMembers || []).find((m) => m.id === memberId);
    const now = new Date().toISOString();
    const updated = (p.dispatchJobs || []).map((j) =>
      j.id === id ? { ...j, assignedMemberId: memberId, assignedAt: memberId ? now : null, status: memberId ? 'assigned' : 'unassigned', updatedAt: now } : j
    );
    const next = { ...p, dispatchJobs: updated };
    return _addDispatchAudit(next, {
      actor: 'Dispatcher', actorRole: p.settings?.userRole || 'owner',
      action: memberId ? 'assigned' : 'unassigned',
      jobId: id, jobNumber: job?.jobNumber,
      detail: memberId ? `Assigned to ${member?.name || memberId}` : `Unassigned`,
    });
  });

  const advanceDispatchJobStatus = (id, status) => setData((p) => {
    const job = (p.dispatchJobs || []).find((j) => j.id === id);
    const now = new Date().toISOString();
    const tsField = status === 'in_progress' ? 'startedAt' : status === 'completed' ? 'completedAt' : null;
    const extra = tsField ? { [tsField]: now } : {};
    const updated = (p.dispatchJobs || []).map((j) => j.id === id ? { ...j, status, ...extra, updatedAt: now } : j);
    const next = { ...p, dispatchJobs: updated };
    return _addDispatchAudit(next, {
      actor: 'Dispatcher', actorRole: p.settings?.userRole || 'owner',
      action: 'status_change', jobId: id, jobNumber: job?.jobNumber,
      detail: `Status changed to ${status}`,
    });
  });

  const addDispatchNote    = (n)     => setData((p) => ({ ...p, dispatchNotes: [n, ...(p.dispatchNotes || [])] }));
  const updateDispatchNote = (id, u) => setData((p) => ({ ...p, dispatchNotes: (p.dispatchNotes || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteDispatchNote = (id)    => setData((p) => ({ ...p, dispatchNotes: (p.dispatchNotes || []).filter((x) => x.id !== id) }));

  // ── Payout mutations ──────────────────────────────────────────────────────
  const addPayout    = (po) => setData((p) => ({ ...p, payouts: [{ id: Date.now(), createdAt: new Date().toISOString(), ...po }, ...(p.payouts || [])] }));
  const updatePayout = (id, u) => setData((p) => ({ ...p, payouts: (p.payouts || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deletePayout = (id)    => setData((p) => ({ ...p, payouts: (p.payouts || []).filter((x) => x.id !== id) }));
  const markJobPaid  = (jobId, payoutData) => setData((p) => {
    const job = (p.dispatchJobs || []).find((j) => j.id === jobId);
    if (!job) return p;
    const now = new Date().toISOString();
    const po = { id: Date.now(), createdAt: now, jobId, jobNumber: job.jobNumber, jobTitle: job.title, memberId: job.assignedMemberId, totalFee: job.fee || 0, status: 'paid', paidAt: now, ...payoutData };
    const next = { ...p, payouts: [po, ...(p.payouts || [])], dispatchJobs: (p.dispatchJobs || []).map((j) => j.id === jobId ? { ...j, payoutStatus: 'paid', updatedAt: now } : j) };
    return _addDispatchAudit(next, { actor: payoutData.paidBy || 'Dispatcher', actorRole: 'owner', action: 'payout_marked_paid', jobId, jobNumber: job.jobNumber, detail: `Payout: $${po.totalFee}` });
  });

  // ── Doc QA + Handoff mutations ────────────────────────────────────────────
  const updateJobQA = (jobId, qa) => setData((p) => {
    const now = new Date().toISOString();
    const next = { ...p, dispatchJobs: (p.dispatchJobs || []).map((j) => j.id === jobId ? { ...j, qa, updatedAt: now } : j) };
    return _addDispatchAudit(next, { actor: 'Dispatcher', actorRole: p.settings?.userRole || 'owner', action: 'qa_updated', jobId, detail: 'QA checklist updated' });
  });
  const addHandoffNote = (jobId, note) => setData((p) => {
    const now = new Date().toISOString();
    const next = { ...p, dispatchJobs: (p.dispatchJobs || []).map((j) => j.id === jobId ? { ...j, handoffNotes: [...(j.handoffNotes || []), note], updatedAt: now } : j) };
    return _addDispatchAudit(next, { actor: note.author || 'Dispatcher', actorRole: 'owner', action: 'handoff_note', jobId, detail: (note.content || '').slice(0, 80) });
  });
  const addDispatchAuditEntry = (entry) => setData((p) => {
    const log = [...(p.dispatchAuditLog || []), { id: Date.now() + Math.random(), ts: new Date().toISOString(), ...entry }];
    return { ...p, dispatchAuditLog: log.slice(-200) };
  });

  // ── Admin: Audit helper ───────────────────────────────────────────────────────
  const _appendAuditLog = (p, entry) => ({
    ...p,
    adminAuditLog: [
      { ...entry, id: Date.now() + Math.random(), timestamp: new Date().toISOString() },
      ...(p.adminAuditLog || []),
    ].slice(0, 200),
  });

  const appendAuditLog = (entry) => setData((p) => _appendAuditLog(p, entry));

  // ── State Rules ───────────────────────────────────────────────────────────────
  const addStateRule = (rule, actor) => setData((p) => {
    const next = { ...rule, id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    return _appendAuditLog(
      { ...p, stateRules: [next, ...(p.stateRules || [])] },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'created', resourceType: 'stateRules', resourceId: next.id, resourceLabel: `${rule.state} ${rule.version || ''}`, diff: 'New record' }
    );
  });

  const updateStateRule = (id, u, actor, diff) => setData((p) => {
    const rule = (p.stateRules || []).find((r) => r.id === id);
    const now = new Date().toISOString();
    const snap = rule ? { ...rule, versionHistory: undefined } : null;
    const versionHistory = snap
      ? [...(rule.versionHistory || []).slice(-19), { ts: now, actor, action: 'updated', diff: diff || 'Record updated', snapshot: snap }]
      : (rule?.versionHistory || []);
    return _appendAuditLog(
      { ...p, stateRules: (p.stateRules || []).map((r) => r.id === id ? { ...r, ...u, updatedAt: now, versionHistory } : r) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'updated', resourceType: 'stateRules', resourceId: id, resourceLabel: `${rule?.state} ${rule?.version || ''}`, diff: diff || 'Record updated' }
    );
  });

  const publishStateRule = (id, actor) => setData((p) => {
    const rule = (p.stateRules || []).find((r) => r.id === id);
    if (!rule) return p;

    const now = new Date().toISOString();
    const nextRules = (p.stateRules || []).map((r) => {
      if (r.id === id) return { ...r, status: r.status === 'archived' ? 'archived' : 'active', publishedAt: now, updatedAt: now };
      if (r.stateCode === rule.stateCode && r.id !== id && r.publishedAt) return { ...r, publishedAt: null, updatedAt: now };
      return r;
    });

    const diff = `publishedAt: ${JSON.stringify(rule.publishedAt)} → ${JSON.stringify(now)}`;
    return _appendAuditLog(
      { ...p, stateRules: nextRules },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'published', resourceType: 'stateRules', resourceId: id, resourceLabel: `${rule.state} ${rule.version || ''}`, diff }
    );
  });

  const unpublishStateRule = (id, actor) => setData((p) => {
    const rule = (p.stateRules || []).find((r) => r.id === id);
    if (!rule) return p;

    const now = new Date().toISOString();
    const nextRules = (p.stateRules || []).map((r) => (r.id === id ? { ...r, status: 'draft', publishedAt: null, updatedAt: now } : r));
    const diff = `publishedAt: ${JSON.stringify(rule.publishedAt)} → null`;
    return _appendAuditLog(
      { ...p, stateRules: nextRules },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'unpublished', resourceType: 'stateRules', resourceId: id, resourceLabel: `${rule.state} ${rule.version || ''}`, diff }
    );
  });

  const deleteStateRule = (id, actor) => setData((p) => {
    const rule = (p.stateRules || []).find((r) => r.id === id);
    return _appendAuditLog(
      { ...p, stateRules: (p.stateRules || []).filter((r) => r.id !== id) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'deleted', resourceType: 'stateRules', resourceId: id, resourceLabel: `${rule?.state} ${rule?.version || ''}`, diff: 'Record deleted' }
    );
  });

  // ── Fee Schedules ─────────────────────────────────────────────────────────────
  const addFeeSchedule = (fee, actor) => setData((p) => {
    const next = { ...fee, id: Date.now(), updatedAt: new Date().toISOString() };
    return _appendAuditLog(
      { ...p, feeSchedules: [next, ...(p.feeSchedules || [])] },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'created', resourceType: 'feeSchedules', resourceId: next.id, resourceLabel: `${fee.stateCode} — ${fee.actType}`, diff: 'New record' }
    );
  });

  const updateFeeSchedule = (id, u, actor, diff) => setData((p) => {
    const fee = (p.feeSchedules || []).find((f) => f.id === id);
    const now = new Date().toISOString();
    const snap = fee ? { ...fee, versionHistory: undefined } : null;
    const versionHistory = snap
      ? [...(fee.versionHistory || []).slice(-19), { ts: now, actor, action: 'updated', diff: diff || 'Record updated', snapshot: snap }]
      : (fee?.versionHistory || []);
    return _appendAuditLog(
      { ...p, feeSchedules: (p.feeSchedules || []).map((f) => f.id === id ? { ...f, ...u, updatedAt: now, versionHistory } : f) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'updated', resourceType: 'feeSchedules', resourceId: id, resourceLabel: `${fee?.stateCode} — ${fee?.actType}`, diff: diff || 'Record updated' }
    );
  });

  const deleteFeeSchedule = (id, actor) => setData((p) => {
    const fee = (p.feeSchedules || []).find((f) => f.id === id);
    return _appendAuditLog(
      { ...p, feeSchedules: (p.feeSchedules || []).filter((f) => f.id !== id) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'deleted', resourceType: 'feeSchedules', resourceId: id, resourceLabel: `${fee?.stateCode} — ${fee?.actType}`, diff: 'Record deleted' }
    );
  });

  // ── ID Requirements ───────────────────────────────────────────────────────────
  const addIdRequirement = (req, actor) => setData((p) => {
    const next = { ...req, id: Date.now(), updatedAt: new Date().toISOString() };
    return _appendAuditLog(
      { ...p, idRequirements: [next, ...(p.idRequirements || [])] },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'created', resourceType: 'idRequirements', resourceId: next.id, resourceLabel: `${req.stateCode} — ID Requirements`, diff: 'New record' }
    );
  });

  const updateIdRequirement = (id, u, actor, diff) => setData((p) => {
    const req = (p.idRequirements || []).find((r) => r.id === id);
    const now = new Date().toISOString();
    const snap = req ? { ...req, versionHistory: undefined } : null;
    const versionHistory = snap
      ? [...(req.versionHistory || []).slice(-19), { ts: now, actor, action: 'updated', diff: diff || 'Record updated', snapshot: snap }]
      : (req?.versionHistory || []);
    return _appendAuditLog(
      { ...p, idRequirements: (p.idRequirements || []).map((r) => r.id === id ? { ...r, ...u, updatedAt: now, versionHistory } : r) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'updated', resourceType: 'idRequirements', resourceId: id, resourceLabel: `${req?.stateCode} — ID Requirements`, diff: diff || 'Record updated' }
    );
  });

  const deleteIdRequirement = (id, actor) => setData((p) => {
    const req = (p.idRequirements || []).find((r) => r.id === id);
    return _appendAuditLog(
      { ...p, idRequirements: (p.idRequirements || []).filter((r) => r.id !== id) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'deleted', resourceType: 'idRequirements', resourceId: id, resourceLabel: `${req?.stateCode} — ID Requirements`, diff: 'Record deleted' }
    );
  });

  // ── Knowledge Articles ────────────────────────────────────────────────────────
  const addKnowledgeArticle = (article, actor) => setData((p) => {
    const next = { ...article, id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), publishedAt: article.status === 'published' ? new Date().toISOString() : null };
    return _appendAuditLog(
      { ...p, knowledgeArticles: [next, ...(p.knowledgeArticles || [])] },
      { actor, actorRole: p.settings?.userRole || 'owner', action: article.status === 'published' ? 'published' : 'created', resourceType: 'knowledgeArticles', resourceId: next.id, resourceLabel: article?.title || '', diff: 'New record' }
    );
  });

  const updateKnowledgeArticle = (id, u, actor, diff) => setData((p) => {
    const article = (p.knowledgeArticles || []).find((a) => a.id === id);
    const now = new Date().toISOString();
    const nextPublishedAt = u.status === 'published' && !article?.publishedAt ? now : article?.publishedAt ?? null;
    const snap = article ? { ...article, versionHistory: undefined } : null;
    const versionHistory = snap
      ? [...(article.versionHistory || []).slice(-19), { ts: now, actor, action: 'updated', diff: diff || 'Record updated', snapshot: snap }]
      : (article?.versionHistory || []);
    return _appendAuditLog(
      { ...p, knowledgeArticles: (p.knowledgeArticles || []).map((a) => a.id === id ? { ...a, ...u, updatedAt: now, publishedAt: nextPublishedAt, versionHistory } : a) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: u.status === 'published' ? 'published' : u.status === 'unpublished' ? 'unpublished' : 'updated', resourceType: 'knowledgeArticles', resourceId: id, resourceLabel: article?.title || '', diff: diff || 'Record updated' }
    );
  });

  const deleteKnowledgeArticle = (id, actor) => setData((p) => {
    const article = (p.knowledgeArticles || []).find((a) => a.id === id);
    return _appendAuditLog(
      { ...p, knowledgeArticles: (p.knowledgeArticles || []).filter((a) => a.id !== id) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'deleted', resourceType: 'knowledgeArticles', resourceId: id, resourceLabel: article?.title || '', diff: 'Record deleted' }
    );
  });

  // ── Admin: Review Workflow ────────────────────────────────────────────────────
  const _getRecordLabel = (records, id, type) => {
    const r = (records || []).find((x) => x.id === id);
    if (!r) return String(id);
    if (type === 'knowledgeArticles') return r.title || '';
    return `${r.state || r.stateCode || ''} ${r.version || ''}`.trim();
  };

  const submitForReview = (resourceType, id, actor) => setData((p) => {
    const records = p[resourceType] || [];
    const now = new Date().toISOString();
    const label = _getRecordLabel(records, id, resourceType);
    return _appendAuditLog(
      { ...p, [resourceType]: records.map((r) => r.id === id ? { ...r, status: 'pending_review', submittedForReviewAt: now, submittedBy: actor, updatedAt: now } : r) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'submitted_for_review', resourceType, resourceId: id, resourceLabel: label, diff: 'Submitted for compliance review' }
    );
  });

  const approveRecord = (resourceType, id, actor) => setData((p) => {
    const records = p[resourceType] || [];
    const record = records.find((r) => r.id === id);
    if (!record) return p;
    const now = new Date().toISOString();
    const newStatus = resourceType === 'knowledgeArticles' ? 'published' : 'active';
    const label = _getRecordLabel(records, id, resourceType);
    const snap = { ...record, versionHistory: undefined };
    const versionHistory = [...(record.versionHistory || []).slice(-19), { ts: now, actor, action: 'approved', diff: `Approved and set to ${newStatus}`, snapshot: snap }];
    return _appendAuditLog(
      { ...p, [resourceType]: records.map((r) => r.id === id ? { ...r, status: newStatus, publishedAt: now, approvedBy: actor, approvedAt: now, versionHistory, updatedAt: now } : r) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'published', resourceType, resourceId: id, resourceLabel: label, diff: `Approved and set to ${newStatus}` }
    );
  });


  const importJurisdictionDataset = (dataset, actor = 'System Import') => setData((p) => {
    if (!dataset || typeof dataset !== 'object' || Array.isArray(dataset)) {
      throw new Error('Dataset import expects a JSON object keyed by state code (e.g., {"CA": {...}}).');
    }

    const now = new Date().toISOString();
    const knownCodes = new Set(US_STATES.map((s) => s.code));
    const jurisdictions = Object.entries(dataset).filter(([code, rec]) => knownCodes.has(code) && rec && typeof rec === 'object');
    if (jurisdictions.length === 0) {
      throw new Error('No recognized jurisdiction entries found. Include US state/DC codes as top-level keys.');
    }

    const importedCodes = new Set(jurisdictions.map(([code]) => code));

    const keptRules = (p.stateRules || []).filter((r) => !importedCodes.has(r.stateCode));
    const keptFees = (p.feeSchedules || []).filter((f) => !importedCodes.has(f.stateCode));
    const keptIdReq = (p.idRequirements || []).filter((r) => !importedCodes.has(r.stateCode));

    const newRules = [];
    const newFees = [];
    const newIdReqs = [];
    const newCompliance = [];

    jurisdictions.forEach(([code, rec], i) => {
      const state = rec.state || US_STATES.find((s) => s.code === code)?.name || code;
      const fees = rec.fees || {};
      const idReq = rec.id_requirements || {};
      const redFlags = Array.isArray(rec.red_flags) ? rec.red_flags : [];
      const specialized = rec.specialized || {};

      const ackFee = parseMoneyLike(fees.acknowledgment);
      const juratFee = parseMoneyLike(fees.jurat);
      const oathFee = parseMoneyLike(fees.oath);
      const numericFees = [ackFee, juratFee, oathFee].filter((x) => x !== null);
      const maxFeePerAct = numericFees.length ? Math.max(...numericFees) : 0;

      const ruleId = Date.now() + i * 100 + 1;
      newRules.push({
        id: ruleId,
        state,
        stateCode: code,
        version: 'DB-Import-v1',
        effectiveDate: now.split('T')[0],
        status: 'active',
        publishedAt: now,
        maxFeePerAct,
        thumbprintRequired: redFlags.some((f) => /thumbprint/i.test(String(f))),
        journalRequired: true,
        ronPermitted: true,
        ronStatute: '',
        seal: '',
        retentionYears: 0,
        notarizationTypes: ['Acknowledgment', 'Jurat', 'Oath / Affirmation'],
        witnessRequirements: idReq.credible_witnesses || '',
        specialActCaveats: redFlags.join('; '),
        officialSourceUrl: '',
        notes: `Loan signing: ${specialized.loan_signing || 'n/a'} • Apostille: ${specialized.apostille || 'n/a'} • Marriage: ${specialized.marriage || 'n/a'}`,
        createdAt: now,
        updatedAt: now,
      });

      [
        ['Acknowledgment', fees.acknowledgment],
        ['Jurat', fees.jurat],
        ['Oath / Affirmation', fees.oath],
      ].forEach(([actType, value], j) => {
        const parsed = parseMoneyLike(value);
        newFees.push({
          id: Date.now() + i * 100 + 10 + j,
          stateCode: code,
          actType,
          maxFee: parsed ?? 0,
          maxFeePerAct: parsed ?? 0,
          notes: parsed === null ? `Source value: ${String(value || 'Not specified')}` : '',
          effectiveDate: now.split('T')[0],
          updatedAt: now,
          status: 'draft',
        });
      });

      newIdReqs.push({
        id: Date.now() + i * 100 + 40,
        stateCode: code,
        acceptedIdTypes: ["Driver's License", 'Passport', 'State ID Card', 'Military ID'],
        expirationRequired: true,
        twoFormAllowed: /2/.test(String(idReq.credible_witnesses || '')),
        credibleWitnessAllowed: !/not specified/i.test(String(idReq.credible_witnesses || '')),
        notes: `Credible witnesses: ${idReq.credible_witnesses || 'Not specified'}. Expired ID rule: ${idReq.expired_id_rule || 'Not specified'}.`,
        updatedAt: now,
        status: 'draft',
      });

      if (redFlags.length > 0) {
        newCompliance.push({
          id: Date.now() + i * 100 + 70,
          title: `${code} red flags review`,
          category: 'State Policy',
          dueDate: now.split('T')[0],
          status: 'Needs Review',
          notes: redFlags.join('; '),
        });
      }
    });

    const next = {
      ...p,
      stateRules: [...newRules, ...keptRules],
      feeSchedules: [...newFees, ...keptFees],
      idRequirements: [...newIdReqs, ...keptIdReq],
      complianceItems: [...newCompliance, ...(p.complianceItems || [])],
    };

    return _appendAuditLog(next, {
      actor,
      actorRole: p.settings?.userRole || 'owner',
      action: 'created',
      resourceType: 'stateRules',
      resourceId: Date.now(),
      resourceLabel: `Bulk dataset import (${jurisdictions.length} jurisdictions)`,
      diff: `Imported/updated ${jurisdictions.length} states + fee tables + ID requirements + compliance flags`,
    });
  });

  const rejectReview = (resourceType, id, actor, reason) => setData((p) => {
    const records = p[resourceType] || [];
    const record = records.find((r) => r.id === id);
    if (!record) return p;
    const now = new Date().toISOString();
    const label = _getRecordLabel(records, id, resourceType);
    const snap = { ...record, versionHistory: undefined };
    const versionHistory = [...(record.versionHistory || []).slice(-19), { ts: now, actor, action: 'rejected', diff: `Review rejected: ${reason}`, snapshot: snap }];
    return _appendAuditLog(
      { ...p, [resourceType]: records.map((r) => r.id === id ? { ...r, status: 'draft', rejectedAt: now, rejectedBy: actor, rejectionReason: reason, versionHistory, updatedAt: now } : r) },
      { actor, actorRole: p.settings?.userRole || 'owner', action: 'rejected', resourceType, resourceId: id, resourceLabel: label, diff: `Review rejected: ${reason}` }
    );
  });

  return (
    <DataContext.Provider
      value={{
        data,
        addAppointment, updateAppointment, deleteAppointment,
        updateSettings,
        addClient,
        addInvoice, updateInvoice, deleteInvoice,
        addMileageLog, updateMileageLog, deleteMileageLog,
        addComplianceItem, updateComplianceItem, deleteComplianceItem,
        addSignerSession, updateSignerSession, deleteSignerSession,
        addSignerDocument, updateSignerDocument, deleteSignerDocument,
        addPortalMessage, updatePortalMessage, deletePortalMessage,
        addJournalEntry, updateJournalEntry, deleteJournalEntry,
        updateJournalSettings, createJournalDraftFromAppointment, scoreEntry,
        addTeamMember, updateTeamMember, deleteTeamMember,
        addDispatchJob, updateDispatchJob, deleteDispatchJob,
        assignDispatchJob, advanceDispatchJobStatus,
        addDispatchNote, updateDispatchNote, deleteDispatchNote,
        addPayout, updatePayout, deletePayout, markJobPaid,
        updateJobQA, addHandoffNote, addDispatchAuditEntry,
        addStateRule, updateStateRule, publishStateRule, unpublishStateRule, deleteStateRule,
        addFeeSchedule, updateFeeSchedule, deleteFeeSchedule,
        addIdRequirement, updateIdRequirement, deleteIdRequirement,
        addKnowledgeArticle, updateKnowledgeArticle, deleteKnowledgeArticle,
        submitForReview, approveRecord, rejectReview,
        importJurisdictionDataset,
        runCloseoutAgent,
        appendAuditLog,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
