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
    costPerMile: 0.67,
    taxRate: 15,
    monthlyGoal: 15000,
    commissionRate: 12,
    complianceReviewDay: 'Monday',
    eAndOExpiresOn: '2026-12-31',
  },
  complianceItems: [
    { id: 1, title: 'E&O Insurance Active', category: 'Insurance', dueDate: '2026-12-31', status: 'Compliant', notes: 'Policy #EON-3392 renewed.' },
    { id: 2, title: 'Journal Entries Up To Date', category: 'Records', dueDate: todayISO, status: 'Needs Review', notes: 'Review latest 5 signings for completeness.' },
  ],
  signerSessions: [
    { id: 1, clientId: 2, title: 'Sarah Johnson Loan Docs', signingDate: '2025-11-15', signingTime: '10:00 AM', location: 'Remote', status: 'pending', tasks: [{ id: 1, description: 'Upload Photo ID', completed: false }, { id: 2, description: 'Review Loan Agreement', completed: false }] },
    { id: 2, clientId: 1, title: 'TechCorp I-9 Verification', signingDate: '2025-11-20', signingTime: '02:00 PM', location: 'Client Office', status: 'in-progress', tasks: [{ id: 1, description: 'Sign I-9 Form', completed: false }] },
  ],
  signerDocuments: [
    { id: 1, sessionId: 1, name: 'Loan Agreement', status: 'pending upload', eSignReady: false, fileUrl: '' },
    { id: 2, sessionId: 1, name: 'Promissory Note', status: 'pending upload', eSignReady: false, fileUrl: '' },
    { id: 3, sessionId: 2, name: 'I-9 Form', status: 'uploaded', eSignReady: true, fileUrl: '/docs/i9_form.pdf' },
  ],
  portalMessages: [
    { id: 1, sessionId: 1, sender: 'notary', timestamp: '2025-11-10T10:00:00Z', message: 'Please upload your photo ID for verification.' },
    { id: 2, sessionId: 1, sender: 'signer', timestamp: '2025-11-10T10:15:00Z', message: 'I will upload it by end of day.' },
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
      actType: 'Jurat', signerName: 'Marcus Webb', signerAddress: '456 Pine Ave, Bellevue, WA 98004',
      idType: 'Passport', idIssuingState: '', idLast4: '3390', idExpiration: '2027-03-01',
      fee: 10, thumbprintTaken: false, witnessRequired: false, notes: '',
      documentDescription: 'Affidavit of Residency', linkedAppointmentId: null, linkedInvoiceId: null,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 3, entryNumber: 'JE-0003', date: d3, time: '09:15',
      actType: 'I-9 Verification', signerName: 'TechCorp Inc (James Park)', signerAddress: 'Remote',
      idType: "Driver's License", idIssuingState: 'CA', idLast4: '', idExpiration: '',
      fee: 45, thumbprintTaken: false, witnessRequired: false,
      notes: 'Remote I-9 verification session.',
      documentDescription: 'I-9 Employment Eligibility Verification', linkedAppointmentId: 2, linkedInvoiceId: 'INV-1025',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  journalSettings: {
    requireThumbprintForActTypes: ['Acknowledgment', 'Deed of Trust', 'Power of Attorney'],
    retentionYears: 10,
    retentionReminderEnabled: true,
    autoLinkOnAppointmentComplete: true,
    entryNumberPrefix: 'JE',
    nextSequenceNumber: 4,
  },

  // ─── TEAM DISPATCH ──────────────────────────────────────────────────────────
  teamMembers: [
    {
      id: 1,
      name: 'Maria Reyes',
      email: 'maria@antonionotary.com',
      phone: '(206) 555-0142',
      role: 'notary',
      status: 'available',
      regions: ['98101', '98102', '98103', '98121'],
      activeJobCount: 1,
      completedJobCount: 47,
      avatarInitials: 'MR',
      avatarColor: 'bg-violet-500',
      joinedAt: '2024-03-15',
    },
    {
      id: 2,
      name: 'Derek Okafor',
      email: 'derek@antonionotary.com',
      phone: '(206) 555-0198',
      role: 'notary',
      status: 'on_job',
      regions: ['98004', '98005', '98006', '98007'],
      activeJobCount: 2,
      completedJobCount: 31,
      avatarInitials: 'DO',
      avatarColor: 'bg-blue-500',
      joinedAt: '2024-07-01',
    },
    {
      id: 3,
      name: 'Priya Nair',
      email: 'priya@antonionotary.com',
      phone: '(206) 555-0317',
      role: 'notary',
      status: 'offline',
      regions: ['98031', '98032', '98033'],
      activeJobCount: 0,
      completedJobCount: 19,
      avatarInitials: 'PN',
      avatarColor: 'bg-emerald-500',
      joinedAt: '2025-01-10',
    },
  ],

  dispatchJobs: [
    {
      id: 1,
      jobNumber: 'DJB-0001',
      title: 'Loan Closing — Estate Realty',
      clientName: 'Estate Realty Group',
      clientPhone: '(206) 555-0400',
      actType: 'Loan Signing',
      status: 'unassigned',
      priority: 'urgent',
      region: '98101',
      address: '801 2nd Ave, Seattle, WA 98101',
      scheduledAt: in2h,
      slaDeadline: in2h,
      assignedMemberId: null,
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      assignedAt: null,
      startedAt: null,
      completedAt: null,
      fee: 175,
      notes: 'Client has a 3:00 PM hard deadline for signing. Docs ready in portal.',
    },
    {
      id: 2,
      jobNumber: 'DJB-0002',
      title: 'I-9 Verifications — TechCorp Onboarding',
      clientName: 'TechCorp Inc',
      clientPhone: '(206) 555-0198',
      actType: 'I-9 Verification',
      status: 'assigned',
      priority: 'normal',
      region: '98004',
      address: '1000 156th Ave NE, Bellevue, WA 98004',
      scheduledAt: in6h,
      slaDeadline: in1d,
      assignedMemberId: 2,
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      assignedAt: new Date(Date.now() - 90 * 60000).toISOString(),
      startedAt: null,
      completedAt: null,
      fee: 90,
      notes: 'Three employees need I-9. Park in visitor lot B.',
    },
    {
      id: 3,
      jobNumber: 'DJB-0003',
      title: 'POA Notarization — Family Trust',
      clientName: 'Henderson Family',
      clientPhone: '(425) 555-0277',
      actType: 'Power of Attorney',
      status: 'in_progress',
      priority: 'normal',
      region: '98004',
      address: '302 Bellevue Way NE, Bellevue, WA 98004',
      scheduledAt: past4h,
      slaDeadline: past4h,
      assignedMemberId: 2,
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      assignedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      startedAt: past4h,
      completedAt: null,
      fee: 60,
      notes: 'Two signers — husband and wife. Both must be present.',
    },
    {
      id: 4,
      jobNumber: 'DJB-0004',
      title: 'Real Estate Closing — Downtown Condo',
      clientName: 'Pacific Title & Escrow',
      clientPhone: '(206) 555-0501',
      actType: 'Loan Signing',
      status: 'assigned',
      priority: 'high',
      region: '98121',
      address: '2201 Western Ave #400, Seattle, WA 98121',
      scheduledAt: in6h,
      slaDeadline: in6h,
      assignedMemberId: 1,
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      assignedAt: new Date(Date.now() - 2.5 * 3600000).toISOString(),
      startedAt: null,
      completedAt: null,
      fee: 200,
      notes: 'Condo package, approx 120 pages. Bring blue ink pens.',
    },
    {
      id: 5,
      jobNumber: 'DJB-0005',
      title: 'Refinance Signing — Residential',
      clientName: 'HomePoint Mortgage',
      clientPhone: '(800) 555-0288',
      actType: 'Loan Signing',
      status: 'completed',
      priority: 'normal',
      region: '98031',
      address: '445 Sunrise Blvd, Kent, WA 98031',
      scheduledAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      slaDeadline: new Date(Date.now() - 6 * 3600000).toISOString(),
      assignedMemberId: 1,
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      assignedAt: new Date(Date.now() - 11 * 3600000).toISOString(),
      startedAt: new Date(Date.now() - 9 * 3600000).toISOString(),
      completedAt: new Date(Date.now() - 7.5 * 3600000).toISOString(),
      fee: 150,
      notes: 'Completed on time. Docs shipped via FedEx.',
    },
  ],

  dispatchNotes: [
    {
      id: 1,
      jobId: 1,
      authorId: null,
      authorName: 'Dain Antonio',
      content: 'Confirmed doc package is ready. Client is anxious about timeline — prioritize.',
      createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
      isPinned: true,
    },
    {
      id: 2,
      jobId: 2,
      authorId: 2,
      authorName: 'Derek Okafor',
      content: 'Confirmed address with client. Will arrive 15 min early.',
      createdAt: new Date(Date.now() - 75 * 60000).toISOString(),
      isPinned: false,
    },
    {
      id: 3,
      jobId: 3,
      authorId: 2,
      authorName: 'Derek Okafor',
      content: 'On-site now. Both signers present. Starting docs.',
      createdAt: past4h,
      isPinned: false,
    },
    {
      id: 4,
      jobId: 5,
      authorId: 1,
      authorName: 'Maria Reyes',
      content: 'All docs signed. Shipping confirmation #1Z7A4E.',
      createdAt: new Date(Date.now() - 7.5 * 3600000).toISOString(),
      isPinned: false,
    },
  ],
};

// ─── JOURNAL SCORING ─────────────────────────────────────────────────────────
export const scoreEntry = (entry) => {
  const required = ['date', 'time', 'actType', 'signerName', 'idType', 'idLast4', 'fee'];
  const optional = ['signerAddress', 'idExpiration', 'idIssuingState', 'documentDescription', 'notes'];
  const rb = Math.round((required.filter((f) => { const v = entry[f]; return v !== undefined && v !== null && String(v).trim() !== ''; }).length / required.length) * 75);
  const ob = Math.round((optional.filter((f) => { const v = entry[f]; return v !== undefined && v !== null && String(v).trim() !== ''; }).length / optional.length) * 25);
  return Math.min(100, rb + ob);
};

const makeEntryNumber = (prefix, seq) => `${prefix}-${String(seq).padStart(4, '0')}`;
const makeJobNumber = (seq) => `DJB-${String(seq).padStart(4, '0')}`;

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
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
            settings:        { ...defaultData.settings,        ...(parsed.settings        || {}) },
            journalSettings: { ...defaultData.journalSettings, ...(parsed.journalSettings || {}) },
          };
        } catch { return defaultData; }
      }
    }
    return defaultData;
  });

  useEffect(() => { localStorage.setItem('notaryfix_data', JSON.stringify(data)); }, [data]);

  // ── Appointments ─────────────────────────────────────────────────────────────
  const addAppointment    = (a)      => setData((p) => ({ ...p, appointments: [a, ...p.appointments] }));
  const updateAppointment = (id, u)  => setData((p) => ({ ...p, appointments: p.appointments.map((a) => (a.id === id ? { ...a, ...u } : a)) }));
  const deleteAppointment = (id)     => setData((p) => ({ ...p, appointments: p.appointments.filter((a) => a.id !== id) }));

  // ── Settings ─────────────────────────────────────────────────────────────────
  const updateSettings = (u) => setData((p) => ({ ...p, settings: { ...p.settings, ...u } }));

  // ── Clients ──────────────────────────────────────────────────────────────────
  const addClient = (c) => setData((p) => ({ ...p, clients: [c, ...(p.clients || [])] }));

  // ── Invoices ─────────────────────────────────────────────────────────────────
  const addInvoice    = (i)      => setData((p) => ({ ...p, invoices: [i, ...(p.invoices || [])] }));
  const updateInvoice = (id, u)  => setData((p) => ({ ...p, invoices: (p.invoices || []).map((i) => (i.id === id ? { ...i, ...u } : i)) }));
  const deleteInvoice = (id)     => setData((p) => ({ ...p, invoices: (p.invoices || []).filter((i) => i.id !== id) }));

  // ── Mileage ──────────────────────────────────────────────────────────────────
  const addMileageLog    = (l)      => setData((p) => ({ ...p, mileageLogs: [l, ...(p.mileageLogs || [])] }));
  const updateMileageLog = (id, u)  => setData((p) => ({ ...p, mileageLogs: (p.mileageLogs || []).map((l) => (l.id === id ? { ...l, ...u } : l)) }));
  const deleteMileageLog = (id)     => setData((p) => ({ ...p, mileageLogs: (p.mileageLogs || []).filter((l) => l.id !== id) }));

  // ── Compliance ───────────────────────────────────────────────────────────────
  const addComplianceItem    = (c)      => setData((p) => ({ ...p, complianceItems: [c, ...(p.complianceItems || [])] }));
  const updateComplianceItem = (id, u)  => setData((p) => ({ ...p, complianceItems: (p.complianceItems || []).map((c) => (c.id === id ? { ...c, ...u } : c)) }));
  const deleteComplianceItem = (id)     => setData((p) => ({ ...p, complianceItems: (p.complianceItems || []).filter((c) => c.id !== id) }));

  // ── Signer Portal ─────────────────────────────────────────────────────────────
  const addSignerSession    = (s)      => setData((p) => ({ ...p, signerSessions: [s, ...(p.signerSessions || [])] }));
  const updateSignerSession = (id, u)  => setData((p) => ({ ...p, signerSessions: (p.signerSessions || []).map((s) => (s.id === id ? { ...s, ...u } : s)) }));
  const deleteSignerSession = (id)     => setData((p) => ({ ...p, signerSessions: (p.signerSessions || []).filter((s) => s.id !== id), signerDocuments: (p.signerDocuments || []).filter((d) => d.sessionId !== id), portalMessages: (p.portalMessages || []).filter((m) => m.sessionId !== id) }));
  const addSignerDocument    = (d)      => setData((p) => ({ ...p, signerDocuments: [d, ...(p.signerDocuments || [])] }));
  const updateSignerDocument = (id, u)  => setData((p) => ({ ...p, signerDocuments: (p.signerDocuments || []).map((d) => (d.id === id ? { ...d, ...u } : d)) }));
  const deleteSignerDocument = (id)     => setData((p) => ({ ...p, signerDocuments: (p.signerDocuments || []).filter((d) => d.id !== id) }));
  const addPortalMessage    = (m)      => setData((p) => ({ ...p, portalMessages: [m, ...(p.portalMessages || [])] }));
  const updatePortalMessage = (id, u)  => setData((p) => ({ ...p, portalMessages: (p.portalMessages || []).map((m) => (m.id === id ? { ...m, ...u } : m)) }));
  const deletePortalMessage = (id)     => setData((p) => ({ ...p, portalMessages: (p.portalMessages || []).filter((m) => m.id !== id) }));

  // ── Journal ───────────────────────────────────────────────────────────────────
  const addJournalEntry = (entry) => {
    setData((p) => {
      const js = p.journalSettings || defaultData.journalSettings;
      const withMeta = { ...entry, id: Date.now(), entryNumber: makeEntryNumber(js.entryNumberPrefix, js.nextSequenceNumber), createdAt: new Date().toISOString() };
      withMeta.completenessScore = scoreEntry(withMeta);
      return { ...p, journalEntries: [withMeta, ...(p.journalEntries || [])], journalSettings: { ...js, nextSequenceNumber: (js.nextSequenceNumber || 1) + 1 } };
    });
  };
  const updateJournalEntry = (id, u) => {
    setData((p) => ({
      ...p,
      journalEntries: (p.journalEntries || []).map((e) => { if (e.id !== id) return e; const upd = { ...e, ...u }; upd.completenessScore = scoreEntry(upd); return upd; }),
    }));
  };
  const deleteJournalEntry   = (id)  => setData((p) => ({ ...p, journalEntries: (p.journalEntries || []).filter((e) => e.id !== id) }));
  const updateJournalSettings = (u)  => setData((p) => ({ ...p, journalSettings: { ...(p.journalSettings || defaultData.journalSettings), ...u } }));
  const createJournalDraftFromAppointment = (apt) => ({
    date: apt.date || todayISO, time: '',
    actType: apt.type === 'Loan Signing' ? 'Acknowledgment' : apt.type === 'I-9 Verification' ? 'I-9 Verification' : 'Acknowledgment',
    signerName: apt.client || '', signerAddress: apt.location || '',
    idType: "Driver's License", idIssuingState: '', idLast4: '', idExpiration: '',
    fee: apt.amount || 0, thumbprintTaken: false, witnessRequired: false,
    notes: '', documentDescription: '', linkedAppointmentId: apt.id, linkedInvoiceId: null,
  });

  // ── Team Members ─────────────────────────────────────────────────────────────
  const addTeamMember    = (m)      => setData((p) => ({ ...p, teamMembers: [...(p.teamMembers || []), { ...m, id: Date.now() }] }));
  const updateTeamMember = (id, u)  => setData((p) => ({ ...p, teamMembers: (p.teamMembers || []).map((m) => (m.id === id ? { ...m, ...u } : m)) }));
  const deleteTeamMember = (id)     => setData((p) => ({ ...p, teamMembers: (p.teamMembers || []).filter((m) => m.id !== id) }));

  // ── Dispatch Jobs ─────────────────────────────────────────────────────────────
  const addDispatchJob = (job) => {
    setData((p) => {
      const nextNum = (p.dispatchJobs || []).length + 1;
      return {
        ...p,
        dispatchJobs: [{ ...job, id: Date.now(), jobNumber: makeJobNumber(nextNum), createdAt: new Date().toISOString(), status: 'unassigned', assignedAt: null, startedAt: null, completedAt: null }, ...(p.dispatchJobs || [])],
      };
    });
  };

  const updateDispatchJob = (id, u) => setData((p) => ({ ...p, dispatchJobs: (p.dispatchJobs || []).map((j) => (j.id === id ? { ...j, ...u } : j)) }));
  const deleteDispatchJob = (id)    => setData((p) => ({ ...p, dispatchJobs: (p.dispatchJobs || []).filter((j) => j.id !== id), dispatchNotes: (p.dispatchNotes || []).filter((n) => n.jobId !== id) }));

  const assignDispatchJob = (jobId, memberId) => {
    setData((p) => ({
      ...p,
      dispatchJobs: (p.dispatchJobs || []).map((j) =>
        j.id === jobId ? { ...j, assignedMemberId: memberId, status: memberId ? 'assigned' : 'unassigned', assignedAt: memberId ? new Date().toISOString() : null } : j
      ),
      teamMembers: (p.teamMembers || []).map((m) => {
        if (m.id === memberId) return { ...m, activeJobCount: (m.activeJobCount || 0) + 1, status: 'on_job' };
        const prevJob = (p.dispatchJobs || []).find((j) => j.id === jobId);
        if (prevJob && m.id === prevJob.assignedMemberId) return { ...m, activeJobCount: Math.max(0, (m.activeJobCount || 1) - 1) };
        return m;
      }),
    }));
  };

  const advanceDispatchJobStatus = (jobId, newStatus) => {
    setData((p) => ({
      ...p,
      dispatchJobs: (p.dispatchJobs || []).map((j) => {
        if (j.id !== jobId) return j;
        const ts = new Date().toISOString();
        return {
          ...j, status: newStatus,
          startedAt:   newStatus === 'in_progress' && !j.startedAt   ? ts : j.startedAt,
          completedAt: newStatus === 'completed'   && !j.completedAt ? ts : j.completedAt,
        };
      }),
      teamMembers: newStatus === 'completed'
        ? (p.teamMembers || []).map((m) => {
            const job = (p.dispatchJobs || []).find((j) => j.id === jobId);
            if (!job || m.id !== job.assignedMemberId) return m;
            const stillHasJobs = (p.dispatchJobs || []).some((j) => j.id !== jobId && j.assignedMemberId === m.id && ['assigned', 'in_progress'].includes(j.status));
            return { ...m, activeJobCount: Math.max(0, (m.activeJobCount || 1) - 1), completedJobCount: (m.completedJobCount || 0) + 1, status: stillHasJobs ? 'on_job' : 'available' };
          })
        : p.teamMembers,
    }));
  };

  // ── Dispatch Notes ────────────────────────────────────────────────────────────
  const addDispatchNote = (note) => setData((p) => ({ ...p, dispatchNotes: [...(p.dispatchNotes || []), { ...note, id: Date.now(), createdAt: new Date().toISOString() }] }));
  const updateDispatchNote = (id, u) => setData((p) => ({ ...p, dispatchNotes: (p.dispatchNotes || []).map((n) => (n.id === id ? { ...n, ...u } : n)) }));
  const deleteDispatchNote = (id)    => setData((p) => ({ ...p, dispatchNotes: (p.dispatchNotes || []).filter((n) => n.id !== id) }));

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
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
