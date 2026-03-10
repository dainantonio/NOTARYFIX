// File: src/context/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createCrudOps } from './slices/crudOps';
import { createDispatchOps } from './slices/dispatchOps';
import { createAgentOps } from './slices/agentOps';
import { createJobOps } from './slices/jobOps';
import { createFinanceOps } from './slices/financeOps';
import { useAuth } from './AuthContext';
import { enqueueAutomationJob, getUserDataDoc, upsertUserDataDoc } from '../services/firebaseRest';

const DataContext = createContext();

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

const defaultData = {
  appointments: [], clients: [], invoices: [], mileageLogs: [], complianceItems: [],
  agentRuns: [], agentSuggestions: [], reminderQueue: [], signerSessions: [], signerDocuments: [],
  portalMessages: [], journalEntries: [], teamMembers: [], dispatchJobs: [], dispatchNotes: [], payouts: [],
  dispatchAuditLog: [], adminAuditLog: [], agentTriggerLog: [], agentFeedback: [],
  agentMemory: { facts: [], updatedAt: null }, jobMessages: [], jobs: [], jobExpenses: [], businessExpenses: [], taxDocuments: [],
  settings: {
    name: '', businessName: '', businessLogo: '', businessLogoName: '',
    planTier: 'free', userRole: 'owner', currentStateCode: 'WA', commissionedStates: ['WA'],
    costPerMile: 0.67, taxRate: 15, monthlyGoal: 15000, commissionRate: 12,
    complianceReviewDay: 'Monday', eAndOExpiresOn: '', onboardingComplete: false,
    autonomyMode: 'supervised', enableAutoCloseoutAgent: true, enableAutoReminderDrafts: false,
    confidenceThreshold: 85, requireApprovalForWarnings: true, autoScanAR: false,
    licenseNumber: '', commissionExpiryDate: '', notaryType: 'Traditional',
    feeSchedule: { loanSigning: 150, deed: 50, affidavit: 25, i9: 45, general: 15, ron: 75 },
  },
  journalSettings: { defaultFee: 15, requireThumbprintFor: ['Deed of Trust', 'Grant Deed'], enableScoring: true, retentionYears: 10 },
  autonomyRoadmap: {
    owner: 'Product + Ops', updatedAt: new Date().toISOString(),
    phases: [
      { id: 'phase1', name: 'Assistive Foundation', status: 'in_progress', completion: 70 },
      { id: 'phase2', name: 'Supervised Autonomy', status: 'in_progress', completion: 35 },
      { id: 'phase3', name: 'Autonomous Operations', status: 'planned', completion: 0 },
      { id: 'phase4', name: 'Learning + Defensibility', status: 'planned', completion: 0 },
    ],
    kpis: { closeoutLatencyMinutes: null, draftApprovalRate: null, manualEditRate: null, dsoDays: null },
  },
  stateRules: [], feeSchedules: [], idRequirements: [], knowledgeArticles: [],
};

const mergeWithDefaults = (parsed = {}) => ({
  ...defaultData,
  ...parsed,
  settings: { ...defaultData.settings, ...(parsed.settings || {}) },
  journalSettings: { ...defaultData.journalSettings, ...(parsed.journalSettings || {}) },
  autonomyRoadmap: parsed.autonomyRoadmap && typeof parsed.autonomyRoadmap === 'object'
    ? { ...defaultData.autonomyRoadmap, ...parsed.autonomyRoadmap }
    : defaultData.autonomyRoadmap,
  agentMemory: parsed.agentMemory && typeof parsed.agentMemory === 'object'
    ? { facts: Array.isArray(parsed.agentMemory.facts) ? parsed.agentMemory.facts : [], updatedAt: parsed.agentMemory.updatedAt || null }
    : defaultData.agentMemory,
});

export const DataProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(defaultData);
  const [dataReady, setDataReady] = useState(false);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    const load = async () => {
      setDataReady(false);
      setSyncError('');

      if (!isAuthenticated || !user?.uid) {
        setData(defaultData);
        setDataReady(true);
        return;
      }

      try {
        const remote = await getUserDataDoc({ idToken: user.idToken, uid: user.uid });
        if (remote) {
          setData(mergeWithDefaults(remote));
          setDataReady(true);
          return;
        }

        const legacy = localStorage.getItem('notaryfix_data');
        if (legacy) {
          const parsed = mergeWithDefaults(JSON.parse(legacy));
          setData(parsed);
          await upsertUserDataDoc({ idToken: user.idToken, uid: user.uid, payload: parsed });
          localStorage.removeItem('notaryfix_data');
        } else {
          setData(defaultData);
          await upsertUserDataDoc({ idToken: user.idToken, uid: user.uid, payload: defaultData });
        }
      } catch (e) {
        setSyncError(e.message || 'Failed to sync with cloud');
      } finally {
        setDataReady(true);
      }
    };
    load();
  }, [isAuthenticated, user?.uid, user?.idToken]);

  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);
  const getData = useCallback(() => dataRef.current, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid || !dataReady) return;
    const id = setTimeout(() => {
      upsertUserDataDoc({ idToken: user.idToken, uid: user.uid, payload: data }).catch((e) => setSyncError(e.message || 'Sync failed'));
    }, 350);
    return () => clearTimeout(id);
  }, [data, dataReady, isAuthenticated, user?.idToken, user?.uid]);

  const crudOps = useMemo(() => createCrudOps(setData), []);
  const dispatchOps = useMemo(() => createDispatchOps(setData), []);
  const agentOps = useMemo(() => createAgentOps(setData, getData), [getData]);
  const jobOps = useMemo(() => createJobOps(setData, getData), [getData]);
  const financeOps = useMemo(() => createFinanceOps(setData, getData), [getData]);

  const runCloseoutAgentWithAI = useCallback(agentOps.runCloseoutAgentWithAI, []); // eslint-disable-line
  const checkAutoScanAR = useCallback(async (...args) => {
    const out = await agentOps.checkAutoScanAR(...args);
    if (user?.uid) enqueueAutomationJob({ idToken: user.idToken, uid: user.uid, type: 'ar_scan', payload: { source: 'client_trigger' } }).catch(() => {});
    return out;
  }, [agentOps, user?.idToken, user?.uid]);

  const generateWeeklySummary = useCallback(async (...args) => {
    const out = await agentOps.generateWeeklySummary(...args);
    if (user?.uid) enqueueAutomationJob({ idToken: user.idToken, uid: user.uid, type: 'weekly_digest', payload: { source: 'client_trigger' } }).catch(() => {});
    return out;
  }, [agentOps, user?.idToken, user?.uid]);

  const addFeedback = useCallback((record) => {
    if (!record?.id) return;
    setData((p) => {
      const existing = Array.isArray(p.agentFeedback) ? p.agentFeedback : [];
      const isDupe = existing.some((f) => f.suggestionId === record.suggestionId && f.outcome === record.outcome);
      if (isDupe) return p;
      return { ...p, agentFeedback: [record, ...existing].slice(0, 1000) };
    });
  }, []);

  const addAgentTriggerEntry = useCallback((key) => {
    if (!key) return;
    setData((p) => {
      const existing = Array.isArray(p.agentTriggerLog) ? p.agentTriggerLog : [];
      if (existing.includes(key)) return p;
      return { ...p, agentTriggerLog: [...existing, key].slice(-500) };
    });
  }, []);

  return (
    <DataContext.Provider
      value={{
        data,
        dataReady,
        syncError,
        ...crudOps,
        ...dispatchOps,
        ...agentOps,
        ...jobOps,
        ...financeOps,
        runCloseoutAgentWithAI,
        checkAutoScanAR,
        generateWeeklySummary,
        addAgentTriggerEntry,
        addFeedback,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
