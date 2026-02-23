import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

const todayISO = new Date().toISOString().split('T')[0];
const d1 = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const d2 = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
const d3 = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];

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

  // ─── JOURNAL DATA MODEL ──────────────────────────────────────────────────────
  journalEntries: [
    {
      id: 1,
      entryNumber: 'JE-0001',
      date: d1,
      time: '14:00',
      actType: 'Acknowledgment',
      signerName: 'Sarah Johnson',
      signerAddress: '123 Maple St, Seattle, WA 98101',
      idType: "Driver's License",
      idIssuingState: 'WA',
      idLast4: '4821',
      idExpiration: '2028-06-15',
      fee: 15,
      thumbprintTaken: true,
      witnessRequired: false,
      notes: 'Loan package closing. Signer presented unexpired WA DL. No issues.',
      documentDescription: 'Deed of Trust',
      linkedAppointmentId: 1,
      linkedInvoiceId: 'INV-1024',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 2,
      entryNumber: 'JE-0002',
      date: d2,
      time: '10:30',
      actType: 'Jurat',
      signerName: 'Marcus Webb',
      signerAddress: '456 Pine Ave, Bellevue, WA 98004',
      idType: 'Passport',
      idIssuingState: '',
      idLast4: '3390',
      idExpiration: '2027-03-01',
      fee: 10,
      thumbprintTaken: false,
      witnessRequired: false,
      notes: '',
      documentDescription: 'Affidavit of Residency',
      linkedAppointmentId: null,
      linkedInvoiceId: null,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 3,
      entryNumber: 'JE-0003',
      date: d3,
      time: '09:15',
      actType: 'I-9 Verification',
      signerName: 'TechCorp Inc (James Park)',
      signerAddress: 'Remote — 789 Innovation Dr, Redmond, WA 98052',
      idType: "Driver's License",
      idIssuingState: 'CA',
      idLast4: '',
      idExpiration: '',
      fee: 45,
      thumbprintTaken: false,
      witnessRequired: false,
      notes: 'Remote I-9 verification for onboarding. ID not required for this act type.',
      documentDescription: 'I-9 Employment Eligibility Verification',
      linkedAppointmentId: 2,
      linkedInvoiceId: 'INV-1025',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],

  journalSettings: {
    // Act types that require a thumbprint
    requireThumbprintForActTypes: ['Acknowledgment', 'Deed of Trust', 'Power of Attorney'],
    // State retention requirement (years)
    retentionYears: 10,
    retentionReminderEnabled: true,
    // Auto-suggest journal link when appointment is completed
    autoLinkOnAppointmentComplete: true,
    // Sequential numbering
    entryNumberPrefix: 'JE',
    nextSequenceNumber: 4,
  },
};

// ─── COMPLETENESS SCORER ─────────────────────────────────────────────────────
// Returns 0-100 based on how many required + optional fields are filled
const scoreEntry = (entry) => {
  const required = ['date', 'time', 'actType', 'signerName', 'idType', 'idLast4', 'fee'];
  const optional = ['signerAddress', 'idExpiration', 'idIssuingState', 'documentDescription', 'notes'];
  const reqFilled = required.filter((f) => {
    const v = entry[f];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;
  const optFilled = optional.filter((f) => {
    const v = entry[f];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;
  const base = Math.round((reqFilled / required.length) * 75);
  const bonus = Math.round((optFilled / optional.length) * 25);
  return Math.min(100, base + bonus);
};

const makeEntryNumber = (prefix, seq) => `${prefix}-${String(seq).padStart(4, '0')}`;

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
            appointments: Array.isArray(parsed.appointments) ? parsed.appointments : defaultData.appointments,
            clients: Array.isArray(parsed.clients) ? parsed.clients : defaultData.clients,
            invoices: Array.isArray(parsed.invoices) ? parsed.invoices : defaultData.invoices,
            mileageLogs: Array.isArray(parsed.mileageLogs) ? parsed.mileageLogs : defaultData.mileageLogs,
            complianceItems: Array.isArray(parsed.complianceItems) ? parsed.complianceItems : defaultData.complianceItems,
            signerSessions: Array.isArray(parsed.signerSessions) ? parsed.signerSessions : defaultData.signerSessions,
            signerDocuments: Array.isArray(parsed.signerDocuments) ? parsed.signerDocuments : defaultData.signerDocuments,
            portalMessages: Array.isArray(parsed.portalMessages) ? parsed.portalMessages : defaultData.portalMessages,
            journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : defaultData.journalEntries,
            settings: { ...defaultData.settings, ...(parsed.settings || {}) },
            journalSettings: { ...defaultData.journalSettings, ...(parsed.journalSettings || {}) },
          };
        } catch {
          return defaultData;
        }
      }
    }
    return defaultData;
  });

  useEffect(() => {
    localStorage.setItem('notaryfix_data', JSON.stringify(data));
  }, [data]);

  // ── Appointments ────────────────────────────────────────────────────────────
  const addAppointment = (appointment) => setData((prev) => ({ ...prev, appointments: [appointment, ...prev.appointments] }));
  const updateAppointment = (appointmentId, updates) => setData((prev) => ({ ...prev, appointments: prev.appointments.map((a) => (a.id === appointmentId ? { ...a, ...updates } : a)) }));
  const deleteAppointment = (appointmentId) => setData((prev) => ({ ...prev, appointments: prev.appointments.filter((a) => a.id !== appointmentId) }));

  // ── Settings ────────────────────────────────────────────────────────────────
  const updateSettings = (newSettings) => setData((prev) => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));

  // ── Clients ─────────────────────────────────────────────────────────────────
  const addClient = (client) => setData((prev) => ({ ...prev, clients: [client, ...(prev.clients || [])] }));

  // ── Invoices ────────────────────────────────────────────────────────────────
  const addInvoice = (invoice) => setData((prev) => ({ ...prev, invoices: [invoice, ...(prev.invoices || [])] }));
  const updateInvoice = (invoiceId, updates) => setData((prev) => ({ ...prev, invoices: (prev.invoices || []).map((i) => (i.id === invoiceId ? { ...i, ...updates } : i)) }));
  const deleteInvoice = (invoiceId) => setData((prev) => ({ ...prev, invoices: (prev.invoices || []).filter((i) => i.id !== invoiceId) }));

  // ── Mileage ─────────────────────────────────────────────────────────────────
  const addMileageLog = (log) => setData((prev) => ({ ...prev, mileageLogs: [log, ...(prev.mileageLogs || [])] }));
  const updateMileageLog = (logId, updates) => setData((prev) => ({ ...prev, mileageLogs: (prev.mileageLogs || []).map((l) => (l.id === logId ? { ...l, ...updates } : l)) }));
  const deleteMileageLog = (logId) => setData((prev) => ({ ...prev, mileageLogs: (prev.mileageLogs || []).filter((l) => l.id !== logId) }));

  // ── Compliance ──────────────────────────────────────────────────────────────
  const addComplianceItem = (item) => setData((prev) => ({ ...prev, complianceItems: [item, ...(prev.complianceItems || [])] }));
  const updateComplianceItem = (itemId, updates) => setData((prev) => ({ ...prev, complianceItems: (prev.complianceItems || []).map((c) => (c.id === itemId ? { ...c, ...updates } : c)) }));
  const deleteComplianceItem = (itemId) => setData((prev) => ({ ...prev, complianceItems: (prev.complianceItems || []).filter((c) => c.id !== itemId) }));

  // ── Signer Portal ───────────────────────────────────────────────────────────
  const addSignerSession = (session) => setData((prev) => ({ ...prev, signerSessions: [session, ...(prev.signerSessions || [])] }));
  const updateSignerSession = (sessionId, updates) => setData((prev) => ({ ...prev, signerSessions: (prev.signerSessions || []).map((s) => (s.id === sessionId ? { ...s, ...updates } : s)) }));
  const deleteSignerSession = (sessionId) => setData((prev) => ({ ...prev, signerSessions: (prev.signerSessions || []).filter((s) => s.id !== sessionId), signerDocuments: (prev.signerDocuments || []).filter((d) => d.sessionId !== sessionId), portalMessages: (prev.portalMessages || []).filter((m) => m.sessionId !== sessionId) }));
  const addSignerDocument = (document) => setData((prev) => ({ ...prev, signerDocuments: [document, ...(prev.signerDocuments || [])] }));
  const updateSignerDocument = (documentId, updates) => setData((prev) => ({ ...prev, signerDocuments: (prev.signerDocuments || []).map((d) => (d.id === documentId ? { ...d, ...updates } : d)) }));
  const deleteSignerDocument = (documentId) => setData((prev) => ({ ...prev, signerDocuments: (prev.signerDocuments || []).filter((d) => d.id !== documentId) }));
  const addPortalMessage = (message) => setData((prev) => ({ ...prev, portalMessages: [message, ...(prev.portalMessages || [])] }));
  const updatePortalMessage = (messageId, updates) => setData((prev) => ({ ...prev, portalMessages: (prev.portalMessages || []).map((m) => (m.id === messageId ? { ...m, ...updates } : m)) }));
  const deletePortalMessage = (messageId) => setData((prev) => ({ ...prev, portalMessages: (prev.portalMessages || []).filter((m) => m.id !== messageId) }));

  // ── Journal ─────────────────────────────────────────────────────────────────
  const addJournalEntry = (entry) => {
    setData((prev) => {
      const js = prev.journalSettings || defaultData.journalSettings;
      const entryNumber = makeEntryNumber(js.entryNumberPrefix, js.nextSequenceNumber);
      const withMeta = {
        ...entry,
        id: Date.now(),
        entryNumber,
        createdAt: new Date().toISOString(),
      };
      // score is computed fresh in the Journal page from live data, but store it too
      withMeta.completenessScore = scoreEntry(withMeta);
      return {
        ...prev,
        journalEntries: [withMeta, ...(prev.journalEntries || [])],
        journalSettings: {
          ...js,
          nextSequenceNumber: (js.nextSequenceNumber || 1) + 1,
        },
      };
    });
  };

  const updateJournalEntry = (entryId, updates) => {
    setData((prev) => ({
      ...prev,
      journalEntries: (prev.journalEntries || []).map((e) => {
        if (e.id !== entryId) return e;
        const updated = { ...e, ...updates };
        updated.completenessScore = scoreEntry(updated);
        return updated;
      }),
    }));
  };

  const deleteJournalEntry = (entryId) => {
    setData((prev) => ({ ...prev, journalEntries: (prev.journalEntries || []).filter((e) => e.id !== entryId) }));
  };

  const updateJournalSettings = (updates) => {
    setData((prev) => ({ ...prev, journalSettings: { ...(prev.journalSettings || defaultData.journalSettings), ...updates } }));
  };

  // Create a draft journal entry pre-filled from a completed appointment
  const createJournalDraftFromAppointment = (appointment) => {
    const js = data.journalSettings || defaultData.journalSettings;
    return {
      date: appointment.date || todayISO,
      time: '',
      actType: appointment.type === 'Loan Signing' ? 'Acknowledgment'
             : appointment.type === 'I-9 Verification' ? 'I-9 Verification'
             : 'Acknowledgment',
      signerName: appointment.client || '',
      signerAddress: appointment.location || '',
      idType: "Driver's License",
      idIssuingState: '',
      idLast4: '',
      idExpiration: '',
      fee: appointment.amount || 0,
      thumbprintTaken: false,
      witnessRequired: false,
      notes: '',
      documentDescription: '',
      linkedAppointmentId: appointment.id,
      linkedInvoiceId: null,
    };
  };

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
        updateJournalSettings, createJournalDraftFromAppointment,
        scoreEntry,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
