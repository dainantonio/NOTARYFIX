/**
 * jobOps.js — DataContext slice for Job Intelligence
 * Provides CRUD operations for jobMessages, jobs, and jobExpenses.
 */

export function createJobOps(set, get) {
  return {
    // ── Raw message ingestion ───────────────────────────────────────────────
    addJobMessage: (message) => {
      const newMsg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        ...message,
        created_at: new Date().toISOString(),
      };
      set(prev => ({
        data: {
          ...prev.data,
          jobMessages: [newMsg, ...(prev.data.jobMessages || [])],
        },
      }));
      return newMsg;
    },

    // ── Job CRUD ────────────────────────────────────────────────────────────
    addJob: (jobData) => {
      const newJob = {
        id: jobData.id || `job_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        ...jobData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set(prev => ({
        data: {
          ...prev.data,
          jobs: [newJob, ...(prev.data.jobs || [])],
        },
      }));
      return newJob;
    },

    updateJob: (jobId, updates) => {
      set(prev => ({
        data: {
          ...prev.data,
          jobs: (prev.data.jobs || []).map(j =>
            j.id === jobId
              ? { ...j, ...updates, updated_at: new Date().toISOString() }
              : j
          ),
        },
      }));
    },

    deleteJob: (jobId) => {
      set(prev => ({
        data: {
          ...prev.data,
          jobs: (prev.data.jobs || []).filter(j => j.id !== jobId),
        },
      }));
    },

    advanceJobLifecycle: (jobId, newStage) => {
      set(prev => ({
        data: {
          ...prev.data,
          jobs: (prev.data.jobs || []).map(j =>
            j.id === jobId
              ? {
                  ...j,
                  lifecycle_stage: newStage,
                  [`${newStage}_at`]: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              : j
          ),
        },
      }));
    },

    // ── Expense tracking ────────────────────────────────────────────────────
    addJobExpense: (expense) => {
      const newExpense = {
        id: `exp_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        ...expense,
        created_at: new Date().toISOString(),
      };
      set(prev => ({
        data: {
          ...prev.data,
          jobExpenses: [newExpense, ...(prev.data.jobExpenses || [])],
        },
      }));
      return newExpense;
    },

    deleteJobExpense: (expenseId) => {
      set(prev => ({
        data: {
          ...prev.data,
          jobExpenses: (prev.data.jobExpenses || []).filter(e => e.id !== expenseId),
        },
      }));
    },

    // ── Selectors (pure, no set) ─────────────────────────────────────────────
    getJobsByStatus: (status) => {
      return (get().data.jobs || []).filter(j => j.status === status);
    },

    getJobExpensesForJob: (jobId) => {
      return (get().data.jobExpenses || []).filter(e => e.job_id === jobId);
    },

    getTotalJobIncome: () => {
      return (get().data.jobs || [])
        .filter(j => j.lifecycle_stage === 'payment_received')
        .reduce((sum, j) => sum + (j.offered_fee || 0), 0);
    },

    getTotalJobExpenses: () => {
      return (get().data.jobExpenses || [])
        .reduce((sum, e) => sum + (e.amount || 0), 0);
    },
  };
}
