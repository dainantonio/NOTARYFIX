import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { US_STATES_DATA } from '../data/stateData';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// ── DEFAULT DATA SHAPE ─────────────────────────────────────────────────────
const DEFAULT_DATA = {
  clients: [],
  appointments: [],
  invoices: [],
  inventory: [],
  auditLog: [],
  journalEntries: [],
  complianceItems: [],
  mileageEntries: [],
  knowledgeArticles: [],
  dispatchJobs: [],
  teamMembers: [],
  signerSessions: [],
  crossModuleEvents: [],
  stateRules: US_STATES_DATA || [],
  journalSettings: {
    autoSequentialEntry: true,
    retentionReminderEnabled: true,
    retentionYears: 7,
    requireThumbprintForActTypes: ['Deed of Trust', 'Power of Attorney'],
  },
  settings: {
    planTier: 'agency',
    userRole: 'owner',
    name: 'Demo Admin',
    businessName: 'NotaryOS Pro',
    email: 'demo@notaryos.com',
    commissionState: 'CA',
  },
};

// ── LOAD / SAVE TO LOCALSTORAGE ────────────────────────────────────────────
const STORAGE_KEY = 'notaryos_data';

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DATA,
        ...parsed,
        settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
        journalSettings: { ...DEFAULT_DATA.journalSettings, ...(parsed.journalSettings || {}) },
        crossModuleEvents: parsed.crossModuleEvents || [],
        signerSessions: parsed.signerSessions || [],
      };
    }
  } catch (e) {
    console.warn('DataContext: failed to load from localStorage', e);
  }
  return DEFAULT_DATA;
};

const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('DataContext: failed to save', e);
  }
};

// ── PROVIDER ───────────────────────────────────────────────────────────────
export const DataProvider = ({ children }) => {
  const [data, setData] = useState(loadData);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Atomic updater that always persists
  const update = useCallback((fn) => {
    setData((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveData(next);
      dataRef.current = next;
      return next;
    });
  }, []);

  // ── SETTINGS ─────────────────────────────────────────────────────────────
  const updateSettings = useCallback((patch) => {
    update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, [update]);

  const updateJournalSettings = useCallback((patch) => {
    update((d) => ({ ...d, journalSettings: { ...d.journalSettings, ...patch } }));
  }, [update]);

  // ── CLIENTS ──────────────────────────────────────────────────────────────
  const addClient = useCallback((c) => update((d) => ({ ...d, clients: [...d.clients, c] })), [update]);
  const updateClient = useCallback((id, patch) => update((d) => ({
    ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  })), [update]);
  const deleteClient = useCallback((id) => update((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) })), [update]);

  // ── APPOINTMENTS ─────────────────────────────────────────────────────────
  const addAppointment = useCallback((a) => update((d) => ({ ...d, appointments: [...d.appointments, a] })), [update]);
  const updateAppointment = useCallback((id, patch) => update((d) => ({
    ...d, appointments: d.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  })), [update]);
  const deleteAppointment = useCallback((id) => update((d) => ({
    ...d, appointments: d.appointments.filter((a) => a.id !== id),
  })), [update]);

  // ── Complete Appointment (cross-module) ──
  const completeAppointment = useCallback((id) => {
    update((d) => {
      const apt = d.appointments.find((a) => a.id === id);
      if (!apt || apt.status === 'completed') return d;

      const updatedAppointments = d.appointments.map((a) =>
        a.id === id ? { ...a, status: 'completed' } : a
      );

      // Push cross-module event
      const evt = {
        id: `cme_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'appointment_completed',
        title: 'Appointment Completed',
        message: `${apt.client} · ${apt.type} ($${apt.amount || 0}) is done. Create a journal entry?`,
        module: 'schedule',
        linkedId: id,
        timestamp: new Date().toISOString(),
        action: { label: 'Go to Journal', path: '/journal' },
      };

      return {
        ...d,
        appointments: updatedAppointments,
        crossModuleEvents: [...d.crossModuleEvents, evt],
      };
    });
  }, [update]);

  // ── Create Journal Draft from Appointment ──
  const createJournalDraftFromAppointment = useCallback((apt) => {
    const typeMap = {
      'General Notary': 'Acknowledgment',
      'Loan Signing': 'Deed of Trust',
      'I-9 Verification': 'I-9 Verification',
      'Apostille': 'Apostille',
      'Remote Online Notary (RON)': 'Remote Online Notary (RON)',
    };
    return {
      date: apt.date || new Date().toISOString().split('T')[0],
      time: apt.time || '12:00',
      actType: typeMap[apt.type] || 'Acknowledgment',
      signerName: apt.client || '',
      signerAddress: apt.location || '',
      idType: "Driver's License",
      idIssuingState: '',
      idLast4: '',
      idExpiration: '',
      fee: apt.amount || 0,
      thumbprintTaken: false,
      witnessRequired: false,
      notes: `Auto-drafted from appointment: ${apt.type}`,
      documentDescription: apt.type || '',
      linkedAppointmentId: apt.id,
      linkedInvoiceId: null,
    };
  }, []);

  // ── INVOICES ─────────────────────────────────────────────────────────────
  const addInvoice = useCallback((i) => update((d) => ({ ...d, invoices: [...d.invoices, i] })), [update]);
  const updateInvoice = useCallback((id, patch) => update((d) => ({
    ...d, invoices: d.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  })), [update]);
  const deleteInvoice = useCallback((id) => update((d) => ({ ...d, invoices: d.invoices.filter((i) => i.id !== id) })), [update]);

  // ── JOURNAL ENTRIES ──────────────────────────────────────────────────────
  const addJournalEntry = useCallback((e) => {
    const entry = {
      ...e,
      id: e.id || Date.now(),
      entryNumber: e.entryNumber || `JE-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      createdAt: e.createdAt || new Date().toISOString(),
    };
    update((d) => ({ ...d, journalEntries: [...d.journalEntries, entry] }));
    return entry;
  }, [update]);

  const updateJournalEntry = useCallback((id, patch) => update((d) => ({
    ...d, journalEntries: d.journalEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  })), [update]);

  const deleteJournalEntry = useCallback((id) => update((d) => ({
    ...d, journalEntries: d.journalEntries.filter((e) => e.id !== id),
  })), [update]);

  // ── Complete Journal Entry (cross-module → suggest invoice) ──
  const completeJournalEntry = useCallback((entry) => {
    if (!entry || !entry.fee || parseFloat(entry.fee) <= 0) return;

    const evt = {
      id: `cme_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'journal_completed',
      title: 'Journal Entry Saved',
      message: `${entry.signerName} · ${entry.actType} ($${entry.fee}). Create an invoice line item?`,
      module: 'journal',
      linkedId: entry.id,
      timestamp: new Date().toISOString(),
      action: { label: 'Go to Invoices', path: '/invoices' },
    };

    update((d) => ({
      ...d,
      crossModuleEvents: [...d.crossModuleEvents, evt],
    }));
  }, [update]);

  // ── Score Journal Entry ──
  const scoreEntry = useCallback((entry) => {
    if (!entry) return 0;
    let score = 0;
    const max = 100;
    // Core fields (70 pts)
    if (entry.date) score += 10;
    if (entry.time) score += 5;
    if (entry.actType) score += 10;
    if (entry.signerName) score += 15;
    if (entry.idType) score += 10;
    if (entry.idLast4) score += 10;
    if (entry.fee !== undefined && entry.fee !== '' && entry.fee !== null) score += 10;
    // Bonus fields (30 pts)
    if (entry.idExpiration) score += 5;
    if (entry.idIssuingState) score += 5;
    if (entry.signerAddress) score += 5;
    if (entry.documentDescription) score += 5;
    if (entry.linkedAppointmentId || entry.linkedInvoiceId) score += 10;
    return Math.min(max, score);
  }, []);

  // ── SIGNER SESSIONS ─────────────────────────────────────────────────────
  const completeSignerSession = useCallback((session) => {
    update((d) => {
      const events = [...d.crossModuleEvents];

      // If linked to dispatch, push event
      if (session.linkedDispatchJobId) {
        events.push({
          id: `cme_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'signer_portal_completed',
          title: 'Signer Portal Complete',
          message: `${session.signerName} completed ${session.documentType}. Dispatch job #${session.linkedDispatchJobId} ready for close-out.`,
          module: 'signer-portal',
          linkedId: session.id,
          timestamp: new Date().toISOString(),
          action: { label: 'View Dispatch', path: '/team-dispatch' },
        });
      }

      // If linked to appointment, push event
      if (session.linkedAppointmentId) {
        events.push({
          id: `cme_${Date.now()}_apt_${Math.random().toString(36).slice(2, 6)}`,
          type: 'appointment_completed',
          title: 'Appointment Auto-Completed',
          message: `${session.signerName} portal session completed. Appointment #${session.linkedAppointmentId} marked done.`,
          module: 'signer-portal',
          linkedId: session.linkedAppointmentId,
          timestamp: new Date().toISOString(),
          action: { label: 'View Schedule', path: '/schedule' },
        });
      }

      return {
        ...d,
        signerSessions: [...(d.signerSessions || []), session],
        crossModuleEvents: events,
      };
    });
  }, [update]);

  // ── CROSS-MODULE EVENT BUS ───────────────────────────────────────────────
  const pushCrossModuleEvent = useCallback((evt) => {
    const event = {
      ...evt,
      id: evt.id || `cme_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: evt.timestamp || new Date().toISOString(),
    };
    update((d) => ({
      ...d,
      crossModuleEvents: [...d.crossModuleEvents, event],
    }));
  }, [update]);

  const dismissCrossModuleEvent = useCallback((id) => {
    update((d) => ({
      ...d,
      crossModuleEvents: d.crossModuleEvents.filter((e) => e.id !== id),
    }));
  }, [update]);

  const clearAllCrossModuleEvents = useCallback(() => {
    update((d) => ({ ...d, crossModuleEvents: [] }));
  }, [update]);

  // ── COMPLIANCE ───────────────────────────────────────────────────────────
  const addComplianceItem = useCallback((c) => update((d) => ({
    ...d, complianceItems: [...d.complianceItems, c],
  })), [update]);
  const updateComplianceItem = useCallback((id, patch) => update((d) => ({
    ...d, complianceItems: d.complianceItems.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  })), [update]);
  const deleteComplianceItem = useCallback((id) => update((d) => ({
    ...d, complianceItems: d.complianceItems.filter((c) => c.id !== id),
  })), [update]);

  // ── MILEAGE ──────────────────────────────────────────────────────────────
  const addMileageEntry = useCallback((m) => update((d) => ({
    ...d, mileageEntries: [...d.mileageEntries, m],
  })), [update]);
  const updateMileageEntry = useCallback((id, patch) => update((d) => ({
    ...d, mileageEntries: d.mileageEntries.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  })), [update]);
  const deleteMileageEntry = useCallback((id) => update((d) => ({
    ...d, mileageEntries: d.mileageEntries.filter((m) => m.id !== id),
  })), [update]);

  // ── KNOWLEDGE ARTICLES ───────────────────────────────────────────────────
  const addKnowledgeArticle = useCallback((a) => update((d) => ({
    ...d, knowledgeArticles: [...d.knowledgeArticles, a],
  })), [update]);
  const updateKnowledgeArticle = useCallback((id, patch) => update((d) => ({
    ...d, knowledgeArticles: d.knowledgeArticles.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  })), [update]);
  const deleteKnowledgeArticle = useCallback((id) => update((d) => ({
    ...d, knowledgeArticles: d.knowledgeArticles.filter((a) => a.id !== id),
  })), [update]);

  // ── DISPATCH JOBS ────────────────────────────────────────────────────────
  const addDispatchJob = useCallback((j) => update((d) => ({
    ...d, dispatchJobs: [...d.dispatchJobs, j],
  })), [update]);
  const updateDispatchJob = useCallback((id, patch) => update((d) => ({
    ...d, dispatchJobs: d.dispatchJobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
  })), [update]);
  const deleteDispatchJob = useCallback((id) => update((d) => ({
    ...d, dispatchJobs: d.dispatchJobs.filter((j) => j.id !== id),
  })), [update]);

  // ── TEAM MEMBERS ─────────────────────────────────────────────────────────
  const addTeamMember = useCallback((m) => update((d) => ({
    ...d, teamMembers: [...d.teamMembers, m],
  })), [update]);
  const updateTeamMember = useCallback((id, patch) => update((d) => ({
    ...d, teamMembers: d.teamMembers.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  })), [update]);
  const deleteTeamMember = useCallback((id) => update((d) => ({
    ...d, teamMembers: d.teamMembers.filter((m) => m.id !== id),
  })), [update]);

  // ── STATE RULES ──────────────────────────────────────────────────────────
  const updateStateRule = useCallback((code, patch) => update((d) => ({
    ...d,
    stateRules: d.stateRules.map((s) =>
      s.code === code ? { ...s, ...patch, lastUpdated: new Date().toISOString().split('T')[0], version: (s.version || 1) + 1 } : s
    ),
  })), [update]);

  // ── AUDIT LOG ────────────────────────────────────────────────────────────
  const addAuditEntry = useCallback((entry) => update((d) => ({
    ...d, auditLog: [{ ...entry, id: Date.now(), timestamp: new Date().toISOString() }, ...d.auditLog],
  })), [update]);

  // ── INVENTORY ────────────────────────────────────────────────────────────
  const addInventoryItem = useCallback((item) => update((d) => ({
    ...d, inventory: [...d.inventory, item],
  })), [update]);
  const updateInventoryItem = useCallback((id, patch) => update((d) => ({
    ...d, inventory: d.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  })), [update]);
  const deleteInventoryItem = useCallback((id) => update((d) => ({
    ...d, inventory: d.inventory.filter((i) => i.id !== id),
  })), [update]);

  // ── RESET ────────────────────────────────────────────────────────────────
  const resetAllData = useCallback(() => {
    update(DEFAULT_DATA);
  }, [update]);

  const value = {
    data,
    // Settings
    updateSettings,
    updateJournalSettings,
    // Clients
    addClient, updateClient, deleteClient,
    // Appointments
    addAppointment, updateAppointment, deleteAppointment, completeAppointment,
    // Invoices
    addInvoice, updateInvoice, deleteInvoice,
    // Journal
    addJournalEntry, updateJournalEntry, deleteJournalEntry,
    createJournalDraftFromAppointment, scoreEntry, completeJournalEntry,
    // Signer Sessions
    completeSignerSession,
    // Cross-module events
    pushCrossModuleEvent, dismissCrossModuleEvent, clearAllCrossModuleEvents,
    // Compliance
    addComplianceItem, updateComplianceItem, deleteComplianceItem,
    // Mileage
    addMileageEntry, updateMileageEntry, deleteMileageEntry,
    // Knowledge Articles
    addKnowledgeArticle, updateKnowledgeArticle, deleteKnowledgeArticle,
    // Dispatch
    addDispatchJob, updateDispatchJob, deleteDispatchJob,
    // Team
    addTeamMember, updateTeamMember, deleteTeamMember,
    // State Rules
    updateStateRule,
    // Audit
    addAuditEntry,
    // Inventory
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    // Reset
    resetAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export default DataContext;
