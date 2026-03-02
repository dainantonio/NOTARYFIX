// File: src/context/DataContext.jsx
// Slim orchestrator: initialises state, imports slice factories, exposes context.
// ~280 lines — all business logic lives in src/context/slices/.
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createCrudOps }     from './slices/crudOps';
import { createDispatchOps } from './slices/dispatchOps';
import { createAgentOps }    from './slices/agentOps';

const DataContext = createContext();

// ── US States lookup (used by pages via useData) ─────────────────────────────
export const US_STATES = [
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

export const parseMoneyLike = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
};

// ── Default / seed data ───────────────────────────────────────────────────────
// Mock arrays are intentionally empty for production.
// Config objects (settings, journalSettings, autonomyRoadmap, etc.) are kept.
const defaultData = {
  appointments:    [],
  clients:         [],
  invoices:        [],
  mileageLogs:     [],
  complianceItems: [],
  agentRuns:       [],
  agentSuggestions:[],
  reminderQueue:   [],
  signerSessions:  [],
  signerDocuments: [],
  portalMessages:  [],
  journalEntries:  [],
  teamMembers:     [],
  dispatchJobs:    [],
  dispatchNotes:   [],
  payouts:         [],
  dispatchAuditLog:[],
  adminAuditLog:   [],

  settings: {
    name: '',
    businessName: '',
    planTier: 'free',
    userRole: 'owner',
    currentStateCode: 'WA',
    costPerMile: 0.67,
    taxRate: 15,
    monthlyGoal: 15000,
    commissionRate: 12,
    complianceReviewDay: 'Monday',
    eAndOExpiresOn: '',
    onboardingComplete: false,
    autonomyMode: 'supervised',
    enableAutoCloseoutAgent: true,
    enableAutoReminderDrafts: false,
    confidenceThreshold: 85,
    requireApprovalForWarnings: true,
    autoScanAR: false,
    licenseNumber: '',
    commissionExpiryDate: '',
    notaryType: 'Traditional',
    feeSchedule: { loanSigning: 150, deed: 50, affidavit: 25, i9: 45, general: 15, ron: 75 },
  },

  journalSettings: {
    defaultFee: 15,
    requireThumbprintFor: ['Deed of Trust', 'Grant Deed'],
    enableScoring: true,
    retentionYears: 10,
  },

  autonomyRoadmap: {
    owner: 'Product + Ops',
    updatedAt: new Date().toISOString(),
    phases: [
      { id: 'phase1', name: 'Assistive Foundation',      status: 'in_progress', completion: 70 },
      { id: 'phase2', name: 'Supervised Autonomy',       status: 'in_progress', completion: 35 },
      { id: 'phase3', name: 'Autonomous Operations',     status: 'planned',     completion: 0  },
      { id: 'phase4', name: 'Learning + Defensibility',  status: 'planned',     completion: 0  },
    ],
    kpis: {
      closeoutLatencyMinutes: null,
      draftApprovalRate: null,
      manualEditRate: null,
      dsoDays: null,
    },
  },

  // Admin reference data (kept — not mock)
  stateRules:        [],
  feeSchedules:      [],
  idRequirements:    [],
  knowledgeArticles: [],
};

// ── Hydration from localStorage ───────────────────────────────────────────────
const hydrate = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('notaryfix_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultData,
          ...parsed,
          appointments:     Array.isArray(parsed.appointments)     ? parsed.appointments     : defaultData.appointments,
          clients:          Array.isArray(parsed.clients)          ? parsed.clients          : defaultData.clients,
          invoices:         Array.isArray(parsed.invoices)         ? parsed.invoices         : defaultData.invoices,
          mileageLogs:      Array.isArray(parsed.mileageLogs)      ? parsed.mileageLogs      : defaultData.mileageLogs,
          complianceItems:  Array.isArray(parsed.complianceItems)  ? parsed.complianceItems  : defaultData.complianceItems,
          agentRuns:        Array.isArray(parsed.agentRuns)        ? parsed.agentRuns        : defaultData.agentRuns,
          agentSuggestions: Array.isArray(parsed.agentSuggestions) ? parsed.agentSuggestions : defaultData.agentSuggestions,
          reminderQueue:    Array.isArray(parsed.reminderQueue)    ? parsed.reminderQueue    : defaultData.reminderQueue,
          signerSessions:   Array.isArray(parsed.signerSessions)   ? parsed.signerSessions   : defaultData.signerSessions,
          signerDocuments:  Array.isArray(parsed.signerDocuments)  ? parsed.signerDocuments  : defaultData.signerDocuments,
          portalMessages:   Array.isArray(parsed.portalMessages)   ? parsed.portalMessages   : defaultData.portalMessages,
          journalEntries:   Array.isArray(parsed.journalEntries)   ? parsed.journalEntries   : defaultData.journalEntries,
          teamMembers:      Array.isArray(parsed.teamMembers)      ? parsed.teamMembers      : defaultData.teamMembers,
          dispatchJobs:     Array.isArray(parsed.dispatchJobs)     ? parsed.dispatchJobs     : defaultData.dispatchJobs,
          dispatchNotes:    Array.isArray(parsed.dispatchNotes)    ? parsed.dispatchNotes    : defaultData.dispatchNotes,
          payouts:          Array.isArray(parsed.payouts)          ? parsed.payouts          : defaultData.payouts,
          dispatchAuditLog: Array.isArray(parsed.dispatchAuditLog) ? parsed.dispatchAuditLog : defaultData.dispatchAuditLog,
          adminAuditLog:    Array.isArray(parsed.adminAuditLog)    ? parsed.adminAuditLog    : defaultData.adminAuditLog,
          stateRules:       Array.isArray(parsed.stateRules)       ? parsed.stateRules       : defaultData.stateRules,
          feeSchedules:     Array.isArray(parsed.feeSchedules)     ? parsed.feeSchedules     : defaultData.feeSchedules,
          idRequirements:   Array.isArray(parsed.idRequirements)   ? parsed.idRequirements   : defaultData.idRequirements,
          knowledgeArticles:Array.isArray(parsed.knowledgeArticles)? parsed.knowledgeArticles: defaultData.knowledgeArticles,
          autonomyRoadmap:  parsed.autonomyRoadmap && typeof parsed.autonomyRoadmap === 'object'
            ? { ...defaultData.autonomyRoadmap, ...parsed.autonomyRoadmap }
            : defaultData.autonomyRoadmap,
          settings:         { ...defaultData.settings,        ...(parsed.settings        || {}) },
          journalSettings:  { ...defaultData.journalSettings, ...(parsed.journalSettings || {}) },
        };
      } catch (e) {
        return defaultData;
      }
    }
  }
  return defaultData;
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const DataProvider = ({ children }) => {
  const [data, setData] = useState(hydrate);

  // Persist to localStorage on every data change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('notaryfix_data', JSON.stringify(data));
  }, [data]);

  // Stable snapshot reader — always reflects latest state via ref.
  // More reliable than the setState snapshot trick (no batching edge-cases).
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);
  const getData = useCallback(() => dataRef.current, []);

  // ── Instantiate slice ops (memoised — only recreated if setData/getData change) ──
  const crudOps     = useMemo(() => createCrudOps(setData),          []);       // eslint-disable-line react-hooks/exhaustive-deps
  const dispatchOps = useMemo(() => createDispatchOps(setData),      []);       // eslint-disable-line react-hooks/exhaustive-deps
  const agentOps    = useMemo(() => createAgentOps(setData, getData), [getData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrap the three async/callback ops that were originally useCallback in DataContext
  const runCloseoutAgentWithAI = useCallback(agentOps.runCloseoutAgentWithAI, []); // eslint-disable-line react-hooks/exhaustive-deps
  const checkAutoScanAR        = useCallback(agentOps.checkAutoScanAR,        []); // eslint-disable-line react-hooks/exhaustive-deps
  const generateWeeklySummary  = useCallback(agentOps.generateWeeklySummary,  []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DataContext.Provider
      value={{
        data,
        // ── CRUD ────────────────────────────────────────────────────────────
        ...crudOps,
        // ── Dispatch / Team / Payouts ────────────────────────────────────────
        ...dispatchOps,
        // ── Agent ops (spread base, then override the three memoised fns) ───
        ...agentOps,
        runCloseoutAgentWithAI,
        checkAutoScanAR,
        generateWeeklySummary,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
