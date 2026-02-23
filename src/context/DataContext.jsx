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
    name: 'Dain Antonio',
    businessName: 'Antonio Mobile Notary',
    planTier: 'free',
    userRole: 'owner',
    currentStateCode: 'WA',
    costPerMile: 0.67,
    taxRate: 15,
    monthlyGoal: 15000,
    commissionRate: 12,
    complianceReviewDay: 'Monday',
    eAndOExpiresOn: '2026-12-31',
  },
  complianceItems: [
    { id: 1, title: 'E&O Insurance Active', category: 'Insurance', dueDate: '2026-12-31', status: 'Compliant', notes: 'Policy #EON-3392 renewed.' },
    { id: 2, title: 'Journal Entries Up To Date', category: 'Records', dueDate: todayISO, status: 'Needs Review', notes: 'Audit journal entries for completeness.' },
  ],
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
    { id: 1, name: 'Dain Antonio', role: 'owner', status: 'active', email: 'dain@antonionotary.com', phone: '(555) 333-2211', createdAt: d4 },
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
  adminAuditLog: [
    { id: 1, actor: 'Dain Antonio', actorRole: 'owner', action: 'created', resourceType: 'stateRules', resourceId: 1, resourceLabel: 'Washington 2024-v2', diff: 'New record', timestamp: new Date(Date.now() - 7.5 * 3600000).toISOString() },
    { id: 2, actor: 'Dain Antonio', actorRole: 'owner', action: 'updated', resourceType: 'knowledgeArticles', resourceId: 2, resourceLabel: 'California Thumbprint Journal Requirements', diff: 'content updated', timestamp: new Date(Date.now() - 6.5 * 3600000).toISOString() },
    { id: 3, actor: 'Alex Carter', actorRole: 'dispatcher', action: 'deleted', resourceType: 'feeSchedules', resourceId: 88, resourceLabel: 'OH — Acknowledgment', diff: 'Record deleted', timestamp: new Date(Date.now() - 5.5 * 3600000).toISOString() },
    { id: 4, actor: 'Dain Antonio', actorRole: 'owner', action: 'published', resourceType: 'knowledgeArticles', resourceId: 1, resourceLabel: 'Washington RON Requirements & Platform Setup', diff: 'status: draft → published', timestamp: new Date(Date.now() - 4.5 * 3600000).toISOString() },
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
      authorName: 'Dain Antonio',
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
      authorName: 'Dain Antonio',
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
          signerSessions:  Array.isArray(parsed.signerSessions)  ? parsed.signerSessions  : defaultData.signerSessions,
          signerDocuments: Array.isArray(parsed.signerDocuments) ? parsed.signerDocuments : defaultData.signerDocuments,
          portalMessages:  Array.isArray(parsed.portalMessages)  ? parsed.portalMessages  : defaultData.portalMessages,
          journalEntries:  Array.isArray(parsed.journalEntries)  ? parsed.journalEntries  : defaultData.journalEntries,
          teamMembers:     Array.isArray(parsed.teamMembers)     ? parsed.teamMembers     : defaultData.teamMembers,
          dispatchJobs:    Array.isArray(parsed.dispatchJobs)    ? parsed.dispatchJobs    : defaultData.dispatchJobs,
          dispatchNotes:   Array.isArray(parsed.dispatchNotes)   ? parsed.dispatchNotes   : defaultData.dispatchNotes,
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

  const addTeamMember    = (m)     => setData((p) => ({ ...p, teamMembers: [m, ...(p.teamMembers || [])] }));
  const updateTeamMember = (id, u) => setData((p) => ({ ...p, teamMembers: (p.teamMembers || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteTeamMember = (id)    => setData((p) => ({ ...p, teamMembers: (p.teamMembers || []).filter((x) => x.id !== id) }));

  const addDispatchJob    = (j)     => setData((p) => ({ ...p, dispatchJobs: [j, ...(p.dispatchJobs || [])] }));
  const updateDispatchJob = (id, u) => setData((p) => ({ ...p, dispatchJobs: (p.dispatchJobs || []).map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x) }));
  const deleteDispatchJob = (id)    => setData((p) => ({ ...p, dispatchJobs: (p.dispatchJobs || []).filter((x) => x.id !== id) }));

  const assignDispatchJob = (id, assignedTo) => updateDispatchJob(id, { assignedTo, status: 'assigned' });
  const advanceDispatchJobStatus = (id, status) => updateDispatchJob(id, { status });

  const addDispatchNote    = (n)     => setData((p) => ({ ...p, dispatchNotes: [n, ...(p.dispatchNotes || [])] }));
  const updateDispatchNote = (id, u) => setData((p) => ({ ...p, dispatchNotes: (p.dispatchNotes || []).map((x) => x.id === id ? { ...x, ...u } : x) }));
  const deleteDispatchNote = (id)    => setData((p) => ({ ...p, dispatchNotes: (p.dispatchNotes || []).filter((x) => x.id !== id) }));

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
    return _appendAuditLog(
      { ...p, stateRules: (p.stateRules || []).map((r) => r.id === id ? { ...r, ...u, updatedAt: new Date().toISOString() } : r) },
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
    return _appendAuditLog(
      { ...p, feeSchedules: (p.feeSchedules || []).map((f) => f.id === id ? { ...f, ...u, updatedAt: new Date().toISOString() } : f) },
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
    return _appendAuditLog(
      { ...p, idRequirements: (p.idRequirements || []).map((r) => r.id === id ? { ...r, ...u, updatedAt: new Date().toISOString() } : r) },
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
    const nextPublishedAt = u.status === 'published' && !article?.publishedAt ? new Date().toISOString() : article?.publishedAt ?? null;

    return _appendAuditLog(
      { ...p, knowledgeArticles: (p.knowledgeArticles || []).map((a) => a.id === id ? { ...a, ...u, updatedAt: new Date().toISOString(), publishedAt: nextPublishedAt } : a) },
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
        addStateRule, updateStateRule, publishStateRule, unpublishStateRule, deleteStateRule,
        addFeeSchedule, updateFeeSchedule, deleteFeeSchedule,
        addIdRequirement, updateIdRequirement, deleteIdRequirement,
        addKnowledgeArticle, updateKnowledgeArticle, deleteKnowledgeArticle,
        appendAuditLog,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

// File: src/pages/Admin.jsx
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, BookOpen, Check, ChevronDown, ChevronRight, Clock,
  Edit2, Eye, EyeOff, FileText, Fingerprint, Globe, Hash, Info,
  MapPin, Plus, RefreshCw, ScrollText, Shield, Tag, Trash2,
  TrendingUp, X, Zap, Activity, Database,
} from 'lucide-react';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
  Input, Label, Select, Progress,
} from '../components/UI';
import { useData } from '../context/DataContext';
import { getGateState } from '../utils/gates';

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
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'Washington DC' },
];

const ACT_TYPES = [
  'Acknowledgment', 'Jurat', 'Oath / Affirmation', 'Copy Certification',
  'Signature Witnessing', 'I-9 Verification', 'Apostille', 'Deposition',
  'Deed of Trust', 'Power of Attorney', 'Remote Online Notary (RON)', 'Protest', 'Other',
];

const ID_TYPES_ALL = [
  "Driver's License", 'Passport', 'Passport Card', 'State ID Card',
  'Military ID', 'Tribal ID', 'Permanent Resident Card', 'Foreign Passport',
  'Inmate ID', 'Other Gov-Issued Photo ID',
];

const ARTICLE_CATEGORIES = ['State Rules', 'Compliance', 'Best Practices', 'Fee Tables', 'Technology', 'RON', 'Other'];

const ACTION_META = {
  created:     { label: 'Created',     color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  updated:     { label: 'Updated',     color: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500'    },
  published:   { label: 'Published',   color: 'text-violet-600 dark:text-violet-400',   dot: 'bg-violet-500'  },
  unpublished: { label: 'Unpublished', color: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500'   },
  deleted:     { label: 'Deleted',     color: 'text-red-600 dark:text-red-400',         dot: 'bg-red-500'     },
};

const RESOURCE_LABELS = {
  stateRules:        'State Policy',
  feeSchedules:      'Fee Schedule',
  idRequirements:    'ID Requirements',
  knowledgeArticles: 'AI Article',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const diffStrings = (prev, next, fields) =>
  fields.reduce((diffs, f) => {
    if (String(prev[f] ?? '') !== String(next[f] ?? '')) {
      diffs.push(`${f}: ${JSON.stringify(prev[f] ?? '')} → ${JSON.stringify(next[f] ?? '')}`);
    }
    return diffs;
  }, []).join('; ') || 'Record updated';

// ─── REUSABLE: SECTION CONTAINER ─────────────────────────────────────────────
const SectionCard = ({ icon, title, count, children, action }) => (
  <Card>
    <CardHeader className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-slate-100 dark:bg-slate-700 p-2">{icon}</div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="text-xs text-slate-500 dark:text-slate-400">{count} record(s)</div>
        </div>
      </div>
      {action}
    </CardHeader>
    {children}
  </Card>
);

const StatusPill = ({ status }) => {
  const s = {
    active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    draft: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    archived: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    published: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    unpublished: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  }[status] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${s}`}>{status || '—'}</span>;
};

// ─── MODAL SHELL ─────────────────────────────────────────────────────────────
const ModalShell = ({ title, icon, children, onClose, onSubmit, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <form onSubmit={onSubmit} className={`w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl`}>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2">{icon}</div>
          <div className="font-bold text-slate-800 dark:text-slate-100">{title}</div>
        </div>
        <Button type="button" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </form>
  </div>
);

const ModalFooter = ({ onClose, label }) => (
  <div className="pt-2 flex items-center justify-end gap-2">
    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
    <Button type="submit">{label}</Button>
  </div>
);

// ─── STATE POLICY FORM ────────────────────────────────────────────────────────
const StateRuleModal = ({ isOpen, onClose, onSave, initial }) => {
  const blank = { state: '', stateCode: '', version: '', effectiveDate: '', status: 'draft', publishedAt: null, maxFeePerAct: '', thumbprintRequired: false, journalRequired: false, ronPermitted: false, ronStatute: '', seal: '', retentionYears: '', notarizationTypes: [], witnessRequirements: '', specialActCaveats: '', officialSourceUrl: '', notes: '' };
  const [form, setForm] = useState(blank);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(initial ? { ...blank, ...initial, maxFeePerAct: String(initial.maxFeePerAct ?? ''), retentionYears: String(initial.retentionYears ?? '') } : { ...blank });
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleActType = (t) => setForm((f) => ({ ...f, notarizationTypes: f.notarizationTypes.includes(t) ? f.notarizationTypes.filter((x) => x !== t) : [...f.notarizationTypes, t] }));
  const stateOpts = [{ value: '', label: '— Select State —' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))];

  const handleSubmit = (e) => {
    e.preventDefault();
    const stateObj = US_STATES.find((s) => s.code === form.stateCode);
    onSave({ ...form, state: stateObj?.name || form.state, maxFeePerAct: parseFloat(form.maxFeePerAct) || 0, retentionYears: parseInt(form.retentionYears) || 0 });
    onClose();
  };

  return (
    <ModalShell title={initial ? 'Edit State Policy' : 'New State Policy'} icon={<Globe className="h-4 w-4" />} onClose={onClose} onSubmit={handleSubmit} wide>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>State <span className="text-red-500">*</span></Label>
          <Select required value={form.stateCode} onChange={(e) => { const s = US_STATES.find((x) => x.code === e.target.value); set('stateCode', e.target.value); if (s) set('state', s.name); }} options={stateOpts} />
        </div>
        <div>
          <Label>Version Tag <span className="text-red-500">*</span></Label>
          <Input required placeholder="e.g. 2024-v2" value={form.version} onChange={(e) => set('version', e.target.value)} />
        </div>
        <div>
          <Label>Effective Date</Label>
          <Input type="date" value={form.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onChange={(e) => set('status', e.target.value)} options={[{ value: 'draft', label: 'Draft' }, { value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} />
        </div>
        <div>
          <Label>Max Fee Per Act ($)</Label>
          <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.maxFeePerAct} onChange={(e) => set('maxFeePerAct', e.target.value)} />
        </div>
        <div>
          <Label>Retention Years</Label>
          <Input type="number" min="1" placeholder="10" value={form.retentionYears} onChange={(e) => set('retentionYears', e.target.value)} />
        </div>
        <div>
          <Label>RON Statute</Label>
          <Input placeholder="e.g. RCW 42.44.265" value={form.ronStatute} onChange={(e) => set('ronStatute', e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Seal Requirement</Label>
          <Input placeholder="e.g. Required — black ink embossed" value={form.seal} onChange={(e) => set('seal', e.target.value)} />
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-3 gap-3">
        {[['thumbprintRequired', 'Thumbprint Required'], ['journalRequired', 'Journal Required'], ['ronPermitted', 'RON Permitted']].map(([k, lbl]) => (
          <button key={k} type="button" onClick={() => set(k, !form[k])}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-semibold transition-all ${form[k] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}>
            {form[k] ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-40" />}
            {lbl}
          </button>
        ))}
      </div>

      {/* Notarization types */}
      <div>
        <Label>Permitted Notarization Types</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {ACT_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => toggleActType(t)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${form.notarizationTypes.includes(t) ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Witness Requirements</Label>
        <textarea rows={3} placeholder="Grounded notes: e.g., when witnesses are required for specific documents or acts."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.witnessRequirements} onChange={(e) => set('witnessRequirements', e.target.value)} />
      </div>

      <div>
        <Label>Special Act Caveats</Label>
        <textarea rows={3} placeholder="Grounded notes: special act exceptions, RON caveats, document-specific limitations, etc."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.specialActCaveats} onChange={(e) => set('specialActCaveats', e.target.value)} />
      </div>

      <div>
        <Label>Official Source URL</Label>
        <Input placeholder="e.g. Secretary of State / statute link" value={form.officialSourceUrl} onChange={(e) => set('officialSourceUrl', e.target.value)} />
      </div>

      <div>
        <Label>Admin Notes</Label>
        <textarea rows={3} placeholder="Internal notes about this policy version…"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <ModalFooter onClose={onClose} label={initial ? 'Save Changes' : 'Create Policy'} />
    </ModalShell>
  );
};

// ─── FEE SCHEDULE FORM ────────────────────────────────────────────────────────
const FeeScheduleModal = ({ isOpen, onClose, onSave, initial }) => {
  const blank = { stateCode: '', actType: 'Acknowledgment', maxFee: '', effectiveDate: '', notes: '' };
  const [form, setForm] = useState(blank);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(initial ? { ...blank, ...initial, maxFee: String(initial.maxFee ?? '') } : { ...blank });
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, maxFee: parseFloat(form.maxFee) || 0 });
    onClose();
  };

  return (
    <ModalShell title={initial ? 'Edit Fee Schedule' : 'New Fee Schedule'} icon={<Hash className="h-4 w-4" />} onClose={onClose} onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>State Code <span className="text-red-500">*</span></Label>
          <Select required value={form.stateCode} onChange={(e) => set('stateCode', e.target.value)}
            options={[{ value: '', label: '— State —' }, ...US_STATES.map((s) => ({ value: s.code, label: s.code }))]} />
        </div>
        <div>
          <Label>Act Type <span className="text-red-500">*</span></Label>
          <Select value={form.actType} onChange={(e) => set('actType', e.target.value)} options={ACT_TYPES.map((t) => ({ value: t, label: t }))} />
        </div>
        <div>
          <Label>Max Fee ($) <span className="text-red-500">*</span></Label>
          <Input required type="number" step="0.01" min="0" placeholder="0.00" value={form.maxFee} onChange={(e) => set('maxFee', e.target.value)} />
        </div>
        <div>
          <Label>Effective Date</Label>
          <Input type="date" value={form.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Input placeholder="Per signature, per signer, etc." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <ModalFooter onClose={onClose} label={initial ? 'Save Changes' : 'Add Fee'} />
    </ModalShell>
  );
};

// ─── ID REQUIREMENTS FORM ─────────────────────────────────────────────────────
const IdRequirementModal = ({ isOpen, onClose, onSave, initial }) => {
  const blank = { stateCode: '', acceptedIdTypes: [], expirationRequired: true, twoFormAllowed: false, credibleWitnessAllowed: false, notes: '' };
  const [form, setForm] = useState(blank);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(initial ? { ...blank, ...initial } : { ...blank });
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleId = (t) => setForm((f) => ({ ...f, acceptedIdTypes: f.acceptedIdTypes.includes(t) ? f.acceptedIdTypes.filter((x) => x !== t) : [...f.acceptedIdTypes, t] }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form });
    onClose();
  };

  return (
    <ModalShell title={initial ? 'Edit ID Requirements' : 'New ID Requirements'} icon={<FileText className="h-4 w-4" />} onClose={onClose} onSubmit={handleSubmit} wide>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>State Code <span className="text-red-500">*</span></Label>
          <Select required value={form.stateCode} onChange={(e) => set('stateCode', e.target.value)}
            options={[{ value: '', label: '— State —' }, ...US_STATES.map((s) => ({ value: s.code, label: s.code }))]} />
        </div>
        <div className="flex items-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => set('acceptedIdTypes', ID_TYPES_ALL.slice(0, 6))}>Quick Fill</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => set('acceptedIdTypes', [])}>Clear</Button>
        </div>
      </div>

      <div>
        <Label>Accepted ID Types</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {ID_TYPES_ALL.map((t) => (
            <button key={t} type="button" onClick={() => toggleId(t)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${form.acceptedIdTypes.includes(t) ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['expirationRequired', 'Expiration Required'], ['twoFormAllowed', 'Two Forms Allowed'], ['credibleWitnessAllowed', 'Credible Witness Allowed']].map(([k, lbl]) => (
          <button key={k} type="button" onClick={() => set(k, !form[k])}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-semibold transition-all ${form[k] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'}`}>
            {form[k] ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-40" />}
            {lbl}
          </button>
        ))}
      </div>

      <div>
        <Label>Notes</Label>
        <Input placeholder="Any special ID nuances or caveats..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <ModalFooter onClose={onClose} label={initial ? 'Save Changes' : 'Create Record'} />
    </ModalShell>
  );
};

// ─── KNOWLEDGE ARTICLE FORM ───────────────────────────────────────────────────
const ArticleModal = ({ isOpen, onClose, onSave, initial }) => {
  const blank = { title: '', category: 'State Rules', stateCode: '', content: '', tags: '', status: 'draft' };
  const [form, setForm] = useState(blank);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(initial ? { ...blank, ...initial, tags: (initial.tags || []).join(', ') } : { ...blank });
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) });
    onClose();
  };

  return (
    <ModalShell title={initial ? 'Edit Article' : 'New Knowledge Article'} icon={<BookOpen className="h-4 w-4" />} onClose={onClose} onSubmit={handleSubmit} wide>
      <div>
        <Label>Title <span className="text-red-500">*</span></Label>
        <Input required placeholder="Article title visible to AI Trainer" value={form.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={form.category} onChange={(e) => set('category', e.target.value)} options={ARTICLE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <div>
          <Label>State (optional)</Label>
          <Select value={form.stateCode || ''} onChange={(e) => set('stateCode', e.target.value || null)}
            options={[{ value: '', label: '— All States —' }, ...US_STATES.map((s) => ({ value: s.code, label: s.code }))]} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onChange={(e) => set('status', e.target.value)} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} />
        </div>
      </div>
      <div>
        <Label>Content <span className="text-red-500">*</span></Label>
        <textarea required rows={7} placeholder="Write a concise, grounded article. AI Trainer will cite published articles."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.content} onChange={(e) => set('content', e.target.value)} />
      </div>
      <div>
        <Label>Tags</Label>
        <Input placeholder="Comma-separated (RON, fees, IDs...)" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
      </div>
      <ModalFooter onClose={onClose} label={initial ? 'Save Changes' : 'Create Article'} />
    </ModalShell>
  );
};

// ─── DELETE CONFIRM ───────────────────────────────────────────────────────────
const ConfirmDelete = ({ target, onCancel, onConfirm }) => {
  if (!target) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2"><AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-100">Delete {target.label}?</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">This action cannot be undone.</div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
};

const RowActions = ({ onEdit, onDelete, extra }) => (
  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    {extra}
    <Button variant="ghost" size="sm" onClick={onEdit}><Edit2 className="h-3.5 w-3.5" /></Button>
    <Button variant="danger" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const Admin = () => {
  const {
    data,
    addStateRule, updateStateRule, publishStateRule, unpublishStateRule, deleteStateRule,
    addFeeSchedule, updateFeeSchedule, deleteFeeSchedule,
    addIdRequirement, updateIdRequirement, deleteIdRequirement,
    addKnowledgeArticle, updateKnowledgeArticle, deleteKnowledgeArticle,
  } = useData();

  const actor = data.settings?.name || 'Admin';
  const currentRole = data.settings?.userRole || 'owner';
  const isAdmin = useMemo(() => getGateState('admin', { role: currentRole, planTier: data.settings?.planTier }).allowed, [currentRole, data.settings?.planTier]);

  const stateRules       = data.stateRules        || [];
  const feeSchedules     = data.feeSchedules      || [];
  const idRequirements   = data.idRequirements    || [];
  const knowledgeArticles = data.knowledgeArticles || [];
  const auditLog         = data.adminAuditLog     || [];

  const [activeTab, setActiveTab]           = useState('stateRules');
  const [stateModal, setStateModal]         = useState({ open: false, item: null });
  const [feeModal, setFeeModal]             = useState({ open: false, item: null });
  const [idModal, setIdModal]               = useState({ open: false, item: null });
  const [articleModal, setArticleModal]     = useState({ open: false, item: null });
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [stateFilter, setStateFilter]       = useState('');
  const [auditFilter, setAuditFilter]       = useState('');
  const [expandedArticle, setExpandedArticle] = useState(null);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Shield className="h-12 w-12 text-red-300 dark:text-red-800 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Admin Access Required</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your current role ({currentRole}) does not have access to the Admin control center.</p>
        </CardContent>
      </Card>
    );
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    activeRules:      stateRules.filter((r) => r.status === 'active').length,
    draftRules:       stateRules.filter((r) => r.status === 'draft').length,
    publishedArticles: knowledgeArticles.filter((a) => a.status === 'published').length,
    draftArticles:    knowledgeArticles.filter((a) => a.status === 'draft').length,
    feeEntries:       feeSchedules.length,
    idEntries:        idRequirements.length,
    auditEvents:      auditLog.length,
  }), [stateRules, knowledgeArticles, feeSchedules, idRequirements, auditLog]);

  const filteredRules = useMemo(() => stateRules
    .filter((r) => !stateFilter || r.stateCode?.toLowerCase().includes(stateFilter.toLowerCase()) || r.state?.toLowerCase().includes(stateFilter.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)), [stateRules, stateFilter]);

  const filteredFees = useMemo(() => feeSchedules
    .filter((f) => !stateFilter || f.stateCode?.toLowerCase().includes(stateFilter.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)), [feeSchedules, stateFilter]);

  const filteredIds = useMemo(() => idRequirements
    .filter((r) => !stateFilter || r.stateCode?.toLowerCase().includes(stateFilter.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)), [idRequirements, stateFilter]);

  const filteredArticles = useMemo(() => knowledgeArticles
    .filter((a) => !stateFilter || (a.stateCode || '').toLowerCase().includes(stateFilter.toLowerCase()) || (a.title || '').toLowerCase().includes(stateFilter.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)), [knowledgeArticles, stateFilter]);

  const filteredAudit = useMemo(() => auditLog
    .filter((e) => !auditFilter || (e.resourceType || '').toLowerCase().includes(auditFilter.toLowerCase()) || (e.resourceLabel || '').toLowerCase().includes(auditFilter.toLowerCase()) || (e.actor || '').toLowerCase().includes(auditFilter.toLowerCase()))
    .slice(0, 50), [auditLog, auditFilter]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    if (type === 'stateRule') deleteStateRule(id, actor);
    if (type === 'feeSchedule') deleteFeeSchedule(id, actor);
    if (type === 'idRequirement') deleteIdRequirement(id, actor);
    if (type === 'knowledgeArticle') deleteKnowledgeArticle(id, actor);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Control Center</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Admin</h1>
              <p className="mt-1 text-sm text-slate-200">Edit state rules, fee tables, ID requirements, and publish grounded datasets for AI Trainer.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <div className="text-[11px] text-blue-200">Signed in as</div>
                <div className="font-bold">{actor}</div>
                <div className="text-[11px] text-blue-200">Role: {currentRole}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Globe className="h-4 w-4 text-blue-500" />, label: 'Active Policies', value: kpis.activeRules },
          { icon: <Edit2 className="h-4 w-4 text-amber-500" />, label: 'Draft Policies', value: kpis.draftRules },
          { icon: <BookOpen className="h-4 w-4 text-violet-500" />, label: 'Published Articles', value: kpis.publishedArticles },
          { icon: <Activity className="h-4 w-4 text-slate-500" />, label: 'Audit Events', value: kpis.auditEvents },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{k.label}</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{k.value}</div>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-700 p-2">{k.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Tabs */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Input placeholder="Filter by state, code, title..." value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} />
            <Button variant="secondary" size="sm" onClick={() => setStateFilter('')}><RefreshCw className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['stateRules', 'State Rules', Globe],
              ['feeSchedules', 'Fee Tables', Hash],
              ['idRequirements', 'ID Requirements', FileText],
              ['knowledgeArticles', 'AI Articles', BookOpen],
              ['audit', 'Audit Log', Clock],
            ].map(([id, label, Icon]) => (
              <Button key={id} size="sm" variant={activeTab === id ? 'primary' : 'secondary'} onClick={() => setActiveTab(id)}>
                <Icon className="mr-1.5 h-3.5 w-3.5" /> {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════ STATE POLICIES ══════════════════════════════ */}
      {activeTab === 'stateRules' && (
        <SectionCard icon={<Globe className="h-4 w-4 text-blue-500" />} title="State Policy Records" count={filteredRules.length}
          action={<Button size="sm" onClick={() => setStateModal({ open: true, item: null })}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Policy</Button>}>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[840px]">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['State', 'Version', 'Effective', 'Published', 'Max Fee', 'Flags', 'Act Types', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredRules.length === 0 ? (
                  <tr><td colSpan={9} className="py-10 text-center text-sm text-slate-400">No state policies. Add one to get started.</td></tr>
                ) : filteredRules.map((rule) => (
                  <tr key={rule.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{rule.stateCode}</span>
                        <span className="text-xs text-slate-400 hidden sm:inline">{rule.state}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{rule.version}</span></td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(rule.effectiveDate)}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{rule.publishedAt ? fmtDate(rule.publishedAt) : '—'}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-100">${rule.maxFeePerAct}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {rule.thumbprintRequired && <span title="Thumbprint required"><Fingerprint className="h-3.5 w-3.5 text-amber-500" /></span>}
                        {rule.journalRequired && <span title="Journal required"><ScrollText className="h-3.5 w-3.5 text-blue-500" /></span>}
                        {rule.ronPermitted && <span title="RON permitted"><Zap className="h-3.5 w-3.5 text-violet-500" /></span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(rule.notarizationTypes || []).slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 px-2 py-0.5 text-[10px] font-medium">{t}</span>
                        ))}
                        {(rule.notarizationTypes || []).length > 3 && <span className="text-[10px] text-slate-400">+{rule.notarizationTypes.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3"><StatusPill status={rule.status} /></td>
                    <td className="px-5 py-3">
                      <RowActions
                        onEdit={() => setStateModal({ open: true, item: rule })}
                        onDelete={() => setDeleteTarget({ type: 'stateRule', id: rule.id, label: `${rule.state} ${rule.version}` })}
                        extra={rule.publishedAt ? (
                          <Button variant="ghost" size="sm" title="Unpublish from AI Trainer" onClick={() => unpublishStateRule(rule.id, actor)}>
                            <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" title="Publish to AI Trainer" onClick={() => publishStateRule(rule.id, actor)} disabled={rule.status === 'archived'}>
                            <Eye className="h-3.5 w-3.5 text-emerald-500" />
                          </Button>
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </SectionCard>
      )}

      {/* ═══════════════════════ FEE TABLES ══════════════════════════════════ */}
      {activeTab === 'feeSchedules' && (
        <SectionCard icon={<Hash className="h-4 w-4 text-emerald-500" />} title="Fee Schedule" count={filteredFees.length}
          action={<Button size="sm" onClick={() => setFeeModal({ open: true, item: null })}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Fee</Button>}>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['State', 'Act Type', 'Max Fee', 'Effective', 'Notes', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredFees.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">No fee entries.</td></tr>
                ) : filteredFees.map((fee) => (
                  <tr key={fee.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-100">{fee.stateCode}</td>
                    <td className="px-5 py-3"><Badge variant="blue" className="text-[10px]">{fee.actType}</Badge></td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        ${fee.maxFee?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(fee.effectiveDate)}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-[200px] truncate">{fee.notes || '—'}</td>
                    <td className="px-5 py-3">
                      <RowActions
                        onEdit={() => setFeeModal({ open: true, item: fee })}
                        onDelete={() => setDeleteTarget({ type: 'feeSchedule', id: fee.id, label: `${fee.stateCode} — ${fee.actType}` })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </SectionCard>
      )}

      {/* ═══════════════════════ ID REQUIREMENTS ═════════════════════════════ */}
      {activeTab === 'idRequirements' && (
        <SectionCard icon={<FileText className="h-4 w-4 text-blue-500" />} title="ID Requirements" count={filteredIds.length}
          action={<Button size="sm" onClick={() => setIdModal({ open: true, item: null })}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Record</Button>}>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['State', 'Accepted IDs', 'Flags', 'Notes', 'Updated', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredIds.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">No ID requirement records.</td></tr>
                ) : filteredIds.map((r) => (
                  <tr key={r.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-100">{r.stateCode}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-[240px] truncate">{(r.acceptedIdTypes || []).join(', ') || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge className="text-[10px]">Exp: {r.expirationRequired ? 'Y' : 'N'}</Badge>
                        <Badge className="text-[10px]">2-Form: {r.twoFormAllowed ? 'Y' : 'N'}</Badge>
                        <Badge className="text-[10px]">Credible: {r.credibleWitnessAllowed ? 'Y' : 'N'}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-[240px] truncate">{r.notes || '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(r.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <RowActions
                        onEdit={() => setIdModal({ open: true, item: r })}
                        onDelete={() => setDeleteTarget({ type: 'idRequirement', id: r.id, label: `${r.stateCode} — ID Requirements` })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </SectionCard>
      )}

      {/* ═══════════════════════ KNOWLEDGE ARTICLES ══════════════════════════ */}
      {activeTab === 'knowledgeArticles' && (
        <SectionCard icon={<BookOpen className="h-4 w-4 text-violet-500" />} title="AI Knowledge Articles" count={filteredArticles.length}
          action={<Button size="sm" onClick={() => setArticleModal({ open: true, item: null })}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Article</Button>}>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['Title', 'Category', 'State', 'Status', 'Updated', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredArticles.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">No knowledge articles.</td></tr>
                ) : filteredArticles.map((a) => {
                  const isExpanded = expandedArticle === a.id;
                  return (
                    <React.Fragment key={a.id}>
                      <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3">
                          <button type="button" className="flex items-center gap-2 text-left" onClick={() => setExpandedArticle(isExpanded ? null : a.id)}>
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">{a.title}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{(a.tags || []).slice(0, 4).join(' • ') || '—'}</div>
                            </div>
                          </button>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">{a.category}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{a.stateCode || 'All'}</td>
                        <td className="px-5 py-3"><StatusPill status={a.status} /></td>
                        <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(a.updatedAt)}</td>
                        <td className="px-5 py-3">
                          <RowActions
                            onEdit={() => setArticleModal({ open: true, item: a })}
                            onDelete={() => setDeleteTarget({ type: 'knowledgeArticle', id: a.id, label: a.title })}
                            extra={a.status !== 'published' ? (
                              <Button variant="ghost" size="sm" title="Publish" onClick={() => updateKnowledgeArticle(a.id, { status: 'published' }, actor, 'status: draft → published')}>
                                <Eye className="h-3.5 w-3.5 text-emerald-500" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" title="Unpublish" onClick={() => updateKnowledgeArticle(a.id, { status: 'draft' }, actor, 'status: published → draft')}>
                                <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                              </Button>
                            )}
                          />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50 dark:bg-slate-800/30">
                          <td colSpan={6} className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-slate-400 mt-0.5" />
                              <div className="whitespace-pre-wrap">{a.content}</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </SectionCard>
      )}

      {/* ═══════════════════════ AUDIT LOG ═══════════════════════════════════ */}
      {activeTab === 'audit' && (
        <SectionCard icon={<Clock className="h-4 w-4 text-slate-500" />} title="Admin Audit Log" count={auditLog.length}
          action={<div className="flex items-center gap-2">
            <Input placeholder="Filter audit…" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} />
            <Button variant="secondary" size="sm" onClick={() => setAuditFilter('')}><X className="h-4 w-4" /></Button>
          </div>}>
          <CardContent className="space-y-3">
            {filteredAudit.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No audit events.</div>
            ) : filteredAudit.map((e) => {
              const meta = ACTION_META[e.action] || ACTION_META.updated;
              const label = RESOURCE_LABELS[e.resourceType] || e.resourceType;
              return (
                <div key={e.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{meta.label} <span className="text-slate-400 font-normal">•</span> {label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{e.resourceLabel || '—'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{e.diff || '—'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{e.actor} <span className="text-slate-400 font-normal">({e.actorRole})</span></div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(e.timestamp)} • {timeAgo(e.timestamp)}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </SectionCard>
      )}

      {/* Modals */}
      <StateRuleModal
        isOpen={stateModal.open}
        initial={stateModal.item}
        onClose={() => setStateModal({ open: false, item: null })}
        onSave={(payload) => {
          if (stateModal.item) {
            const prev = stateModal.item;
            const diff = diffStrings(prev, payload, ['stateCode', 'version', 'effectiveDate', 'status', 'maxFeePerAct', 'thumbprintRequired', 'journalRequired', 'ronPermitted', 'ronStatute', 'seal', 'retentionYears', 'notes', 'witnessRequirements', 'specialActCaveats', 'officialSourceUrl']);
            updateStateRule(prev.id, payload, actor, diff);
          } else {
            addStateRule(payload, actor);
          }
        }}
      />
      <FeeScheduleModal
        isOpen={feeModal.open}
        initial={feeModal.item}
        onClose={() => setFeeModal({ open: false, item: null })}
        onSave={(payload) => {
          if (feeModal.item) {
            const prev = feeModal.item;
            const diff = diffStrings(prev, payload, ['stateCode', 'actType', 'maxFee', 'effectiveDate', 'notes']);
            updateFeeSchedule(prev.id, payload, actor, diff);
          } else {
            addFeeSchedule(payload, actor);
          }
        }}
      />
      <IdRequirementModal
        isOpen={idModal.open}
        initial={idModal.item}
        onClose={() => setIdModal({ open: false, item: null })}
        onSave={(payload) => {
          if (idModal.item) {
            const prev = idModal.item;
            const diff = diffStrings(prev, payload, ['stateCode', 'acceptedIdTypes', 'expirationRequired', 'twoFormAllowed', 'credibleWitnessAllowed', 'notes']);
            updateIdRequirement(prev.id, payload, actor, diff);
          } else {
            addIdRequirement(payload, actor);
          }
        }}
      />
      <ArticleModal
        isOpen={articleModal.open}
        initial={articleModal.item}
        onClose={() => setArticleModal({ open: false, item: null })}
        onSave={(payload) => {
          if (articleModal.item) {
            const prev = articleModal.item;
            const diff = diffStrings(prev, payload, ['title', 'category', 'stateCode', 'status', 'content', 'tags']);
            updateKnowledgeArticle(prev.id, payload, actor, diff);
          } else {
            addKnowledgeArticle(payload, actor);
          }
        }}
      />
      <ConfirmDelete target={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Admin;

// File: src/pages/AITrainer.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, MapPin, Send, ShieldAlert } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Progress, Select } from '../components/UI';
import { useData } from '../context/DataContext';

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

const computeConfidence = ({ policy, feeEntries, idReq }) => {
  if (!policy) return { score: 0, label: 'None' };

  let score = 0.95;
  if (!Array.isArray(feeEntries) || feeEntries.length === 0) score -= 0.2;
  if (!idReq) score -= 0.2;
  if (!policy.witnessRequirements) score -= 0.15;
  if (!(policy.specialActCaveats || policy.notes)) score -= 0.1;

  const lastUpdated = maxIso([
    policy.updatedAt,
    ...(feeEntries || []).map((f) => f.updatedAt),
    idReq?.updatedAt,
  ]);

  if (lastUpdated) {
    const days = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 86400000);
    if (days > 365 && days <= 730) score -= 0.1;
    if (days > 730) score -= 0.2;
  }

  score = Math.max(0, Math.min(1, score));
  const label = score >= 0.85 ? 'High' : score >= 0.65 ? 'Medium' : 'Low';
  return { score, label, lastUpdated };
};

const buildGroundedAnswer = ({ question, stateCode, data }) => {
  const policy = getPublishedPolicy(data.stateRules || [], stateCode);
  if (!policy) {
    return {
      kind: 'missing',
      stateCode,
      stateName: getStateName(stateCode),
      question,
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

  const confidence = computeConfidence({ policy, feeEntries, idReq });

  return {
    kind: 'answer',
    stateCode,
    stateName: getStateName(stateCode),
    question,
    policy,
    feeEntries,
    idReq,
    witnessRequirements: policy.witnessRequirements || null,
    specialActCaveats: policy.specialActCaveats || policy.notes || null,
    officialSourceUrl: policy.officialSourceUrl || null,
    source: {
      statePolicy: { id: policy.id, version: policy.version, publishedAt: policy.publishedAt, updatedAt: policy.updatedAt, effectiveDate: policy.effectiveDate },
      feeSchedule: feeEntries.map((f) => ({ id: f.id, actType: f.actType, updatedAt: f.updatedAt, effectiveDate: f.effectiveDate })),
      idRequirements: idReq ? { id: idReq.id, updatedAt: idReq.updatedAt } : null,
      lastUpdated: confidence.lastUpdated,
    },
    confidence,
    disclaimer: 'Verify with the official state source before acting. This tool summarizes only the published Admin dataset.',
  };
};

const Section = ({ title, children }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/20 p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</div>
    <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{children}</div>
  </div>
);

const ConfidencePill = ({ label, score }) => {
  const Icon = score >= 0.85 ? CheckCircle2 : score >= 0.65 ? Info : AlertTriangle;
  const tone = score >= 0.85 ? 'text-emerald-600 dark:text-emerald-400' : score >= 0.65 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

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

const AITrainer = () => {
  const { data, updateSettings } = useData();

  const currentStateCode = data.settings?.currentStateCode || '';
  const [stateCode, setStateCode] = useState(currentStateCode || 'WA');
  const [input, setInput] = useState('');

  const [messages, setMessages] = useState(() => ([
    {
      id: 'welcome',
      role: 'assistant',
      createdAt: new Date().toISOString(),
      model: { kind: 'info', text: 'Ask a state-specific notary question. Answers are grounded-only: the Trainer will respond only from published Admin records.' },
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
  }, [messages]);

  const stateOptions = useMemo(
    () => [{ value: '', label: '— Select State —' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))],
    []
  );

  const handleAsk = () => {
    const q = input.trim();
    if (!q) return;

    const userMsg = { id: `${Date.now()}-u`, role: 'user', createdAt: new Date().toISOString(), text: q };
    const model = buildGroundedAnswer({ question: q, stateCode, data });
    const assistantMsg = { id: `${Date.now()}-a`, role: 'assistant', createdAt: new Date().toISOString(), model };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput('');
  };

  const applyToCurrentState = () => {
    if (!stateCode) return;
    updateSettings({ currentStateCode: stateCode });
  };

  const useCurrentState = () => {
    if (!currentStateCode) return;
    setStateCode(currentStateCode);
  };

  return (
    <div className="space-y-6 pb-10">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Knowledge Copilot</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">AI Trainer</h1>
          <p className="mt-1 text-sm text-slate-200">On-the-fly, state-specific guidance for notaries — grounded only from the published Admin dataset.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ask a question</CardTitle>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Badge variant="default" className="text-[11px]">
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                Current: {currentStateCode || '—'}
              </Badge>
              <Button variant="secondary" size="sm" onClick={useCurrentState} disabled={!currentStateCode}>
                Use current
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
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

            <div ref={scrollRef} className="h-[440px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-4 space-y-4">
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
                          <ShieldAlert className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div>
                            <div className="font-semibold">Grounded-only mode</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.model.text}</div>
                          </div>
                        </div>
                      ) : m.model?.kind === 'missing' ? (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">No published dataset</div>
                              <div className="mt-0.5 text-base font-bold text-slate-800 dark:text-slate-100">{m.model.stateName} ({m.model.stateCode})</div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Publish a state policy in <span className="font-semibold">Admin → State Policy Records</span> to enable answers.
                              </div>
                            </div>
                            <ConfidencePill label={m.model.confidence.label} score={m.model.confidence.score} />
                          </div>
                          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-3 text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5" />
                            <div>{m.model.disclaimer}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Notary guidance</div>
                              <div className="mt-0.5 text-base font-bold text-slate-800 dark:text-slate-100">
                                {m.model.stateName} ({m.model.stateCode})
                              </div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Policy {m.model.policy?.version || '—'} • Effective {fmtDate(m.model.policy?.effectiveDate)} • Published {fmtDate(m.model.policy?.publishedAt)}
                              </div>
                            </div>
                            <ConfidencePill label={m.model.confidence.label} score={m.model.confidence.score} />
                          </div>

                          <Section title="Fee limits">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Max fee per act:</span>
                              <Badge variant="success" className="text-[11px]">
                                ${Number(m.model.policy?.maxFeePerAct ?? 0).toFixed(2)}
                              </Badge>
                            </div>

                            <div className="mt-3">
                              {Array.isArray(m.model.feeEntries) && m.model.feeEntries.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="text-slate-500 dark:text-slate-400">
                                      <tr>
                                        <th className="text-left py-1">Act</th>
                                        <th className="text-left py-1">Max</th>
                                        <th className="text-left py-1">Effective</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                      {m.model.feeEntries.slice(0, 12).map((f) => (
                                        <tr key={f.id}>
                                          <td className="py-1 pr-3">{f.actType}</td>
                                          <td className="py-1 pr-3 font-semibold">${Number(f.maxFee ?? 0).toFixed(2)}</td>
                                          <td className="py-1">{fmtDate(f.effectiveDate)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {m.model.feeEntries.length > 12 && (
                                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Showing 12 of {m.model.feeEntries.length} entries.</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500 dark:text-slate-400">No fee schedule entries found in the published dataset.</div>
                              )}
                            </div>
                          </Section>

                          <Section title="Acceptable IDs">
                            {m.model.idReq ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                                  <Badge variant="blue" className="text-[11px]">Expiration required: {m.model.idReq.expirationRequired ? 'Yes' : 'No'}</Badge>
                                  <Badge variant="default" className="text-[11px]">Two forms allowed: {m.model.idReq.twoFormAllowed ? 'Yes' : 'No'}</Badge>
                                  <Badge variant="default" className="text-[11px]">Credible witness: {m.model.idReq.credibleWitnessAllowed ? 'Yes' : 'No'}</Badge>
                                </div>
                                <ul className="list-disc pl-5 text-sm">
                                  {(m.model.idReq.acceptedIdTypes || []).map((t) => <li key={t} className="text-sm">{t}</li>)}
                                </ul>
                                {m.model.idReq.notes ? <div className="text-xs text-slate-500 dark:text-slate-400">{m.model.idReq.notes}</div> : null}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 dark:text-slate-400">No ID requirements record found in the published dataset.</div>
                            )}
                          </Section>

                          <Section title="Witness requirements">
                            {m.model.witnessRequirements ? (
                              <div className="whitespace-pre-wrap">{m.model.witnessRequirements}</div>
                            ) : (
                              <div className="text-xs text-slate-500 dark:text-slate-400">Not provided in the published dataset.</div>
                            )}
                          </Section>

                          <Section title="Special act caveats">
                            {m.model.specialActCaveats ? (
                              <div className="whitespace-pre-wrap">{m.model.specialActCaveats}</div>
                            ) : (
                              <div className="text-xs text-slate-500 dark:text-slate-400">Not provided in the published dataset.</div>
                            )}
                          </Section>

                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 p-4 space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Source + last updated</div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                              <div>
                                <span className="font-semibold">State policy:</span> record #{m.model.source.statePolicy?.id} • {m.model.source.statePolicy?.version} • updated {fmtDate(m.model.source.statePolicy?.updatedAt)} • published {fmtDate(m.model.source.statePolicy?.publishedAt)}
                              </div>
                              <div>
                                <span className="font-semibold">Fee schedule:</span> {m.model.source.feeSchedule?.length || 0} record(s) • latest update {fmtDate(maxIso((m.model.source.feeSchedule || []).map((x) => x.updatedAt)))}
                              </div>
                              <div>
                                <span className="font-semibold">ID requirements:</span> {m.model.source.idRequirements ? `record #${m.model.source.idRequirements.id} • updated ${fmtDate(m.model.source.idRequirements.updatedAt)}` : '—'}
                              </div>
                              {m.model.officialSourceUrl ? (
                                <div className="truncate">
                                  <span className="font-semibold">Official source:</span>{' '}
                                  <a href={m.model.officialSourceUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">
                                    {m.model.officialSourceUrl}
                                  </a>
                                </div>
                              ) : null}
                              <div>
                                <span className="font-semibold">Last updated:</span> {fmtDate(m.model.source.lastUpdated)}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-3 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
                            <Info className="h-4 w-4 mt-0.5" />
                            <div>{m.model.disclaimer}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about fees, IDs, witnesses, RON caveats..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />
              <Button onClick={handleAsk} disabled={!stateCode}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {!stateCode ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Select a state to enable grounded responses.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dataset status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Selected state</div>
              <div className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">{getStateName(stateCode)} ({stateCode || '—'})</div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                AI Trainer will answer only if there is a <span className="font-semibold">published state policy</span> for the selected state.
              </div>
            </div>

            {stateCode ? (
              (() => {
                const policy = getPublishedPolicy(data.stateRules || [], stateCode);
                const hasPolicy = Boolean(policy);
                const feeCount = (data.feeSchedules || []).filter((f) => f.stateCode === stateCode).length;
                const hasId = (data.idRequirements || []).some((r) => r.stateCode === stateCode);

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Published policy</span>
                      {hasPolicy ? <Badge variant="success" className="text-[11px]">Yes</Badge> : <Badge variant="danger" className="text-[11px]">No</Badge>}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {hasPolicy ? (
                        <>
                          Version <span className="font-mono">{policy.version}</span> • published {fmtDate(policy.publishedAt)} • updated {fmtDate(policy.updatedAt)}
                        </>
                      ) : (
                        <>Publish a policy in Admin to enable answers for this state.</>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Fee schedule records</span>
                      <Badge variant="default" className="text-[11px]">{feeCount}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">ID requirements record</span>
                      {hasId ? <Badge variant="default" className="text-[11px]">Present</Badge> : <Badge variant="warning" className="text-[11px]">Missing</Badge>}
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="font-semibold mb-1">Grounding guarantee</div>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>No published policy ⇒ no answer (no hallucinations).</li>
                        <li>Sections with missing records are marked as “not provided in dataset”.</li>
                        <li>Every answer includes a source + last updated block.</li>
                      </ul>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">Select a state to see dataset status.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AITrainer;

// File: src/pages/Settings.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { User, Building, Bell, Save, LogOut, Moon, Sun, Wand2, ScanLine, RotateCcw, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

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

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [smartBusinessInput, setSmartBusinessInput] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { data, updateSettings } = useData();

  const [formData, setFormData] = useState(data.settings);

  useEffect(() => {
    setFormData(data.settings);
  }, [data.settings]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'preferences', label: 'Preferences', icon: Bell },
  ];

  const settingsHealth = useMemo(() => {
    const checks = [formData.name, formData.businessName, formData.costPerMile, formData.taxRate, formData.monthlyGoal, formData.eAndOExpiresOn, formData.complianceReviewDay];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [formData]);

  const handleSave = () => {
    updateSettings(formData);
  };

  const applySmartBusinessFill = (text) => {
    const source = text.trim();
    if (!source) return;
    const businessName = source.match(/(?:business|company)\s*[:\-]\s*([^,\n]+)/i)?.[1]?.trim() || '';
    const mileage = source.match(/(?:mileage|mile\s*rate)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i)?.[1] || '';
    const tax = source.match(/(?:tax|tax\s*rate)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i)?.[1] || '';
    const goal = source.match(/(?:goal|monthly\s*goal)\s*[:\-]?\s*(\d+)/i)?.[1] || '';

    setFormData((prev) => ({
      ...prev,
      businessName: prev.businessName || businessName,
      costPerMile: prev.costPerMile || mileage,
      taxRate: prev.taxRate || tax,
      monthlyGoal: prev.monthlyGoal || goal,
    }));
  };

  return (
    <div className="space-y-6 pb-10">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Settings</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Account & Preferences</h1>
          <p className="mt-1 text-sm text-slate-200">Manage your profile, compliance settings, and app preferences.</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab.id} size="sm" variant={activeTab === tab.id ? 'primary' : 'secondary'} onClick={() => setActiveTab(tab.id)}>
            <tab.icon className="mr-1.5 h-3.5 w-3.5" /> {tab.label}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'profile' && (
          <Card>
            <CardHeader><CardTitle>Public Profile</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-2xl font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">{String(formData.name || 'NA').substring(0, 2).toUpperCase()}</div>
                <Button variant="secondary" size="sm">Upload New Picture</Button>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div><Label>Full Name</Label><Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div>
                  <Label>Commission State (for AI Trainer)</Label>
                  <Select
                    value={formData.currentStateCode || ''}
                    onChange={(e) => setFormData({ ...formData, currentStateCode: e.target.value })}
                    options={[{ value: '', label: '—' }, ...US_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))]}
                  />
                </div>
              </div>
              <div className="flex justify-end"><Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button></div>
            </CardContent>
          </Card>
        )}

        {/* rest of Settings.jsx unchanged */}
      </div>
    </div>
  );
};

export default Settings;
