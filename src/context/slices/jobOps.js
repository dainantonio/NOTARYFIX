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
        ...prev,
        jobMessages: [newMsg, ...(prev.jobMessages || [])],
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
        ...prev,
        jobs: [newJob, ...(prev.jobs || [])],
      }));
      return newJob;
    },

    updateJob: (jobId, updates) => {
      set(prev => ({
        ...prev,
        jobs: (prev.jobs || []).map(j =>
          j.id === jobId
            ? { ...j, ...updates, updated_at: new Date().toISOString() }
            : j
        ),
      }));
    },

    deleteJob: (jobId) => {
      set(prev => ({
        ...prev,
        jobs: (prev.jobs || []).filter(j => j.id !== jobId),
      }));
    },

    advanceJobLifecycle: (jobId, newStage) => {
      set(prev => ({
        ...prev,
        jobs: (prev.jobs || []).map(j =>
          j.id === jobId
            ? {
                ...j,
                lifecycle_stage: newStage,
                [`${newStage}_at`]: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : j
        ),
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
        ...prev,
        jobExpenses: [newExpense, ...(prev.jobExpenses || [])],
      }));
      return newExpense;
    },

    deleteJobExpense: (expenseId) => {
      set(prev => ({
        ...prev,
        jobExpenses: (prev.jobExpenses || []).filter(e => e.id !== expenseId),
      }));
    },

    // ── Selectors (pure, no set) ─────────────────────────────────────────────
    getJobsByStatus: (status) => {
      return (get().jobs || []).filter(j => j.status === status);
    },

    getJobExpensesForJob: (jobId) => {
      return (get().jobExpenses || []).filter(e => e.job_id === jobId);
    },

    getTotalJobIncome: () => {
      return (get().jobs || [])
        .filter(j => j.lifecycle_stage === 'payment_received')
        .reduce((sum, j) => sum + (j.offered_fee || 0), 0);
    },

    getTotalJobExpenses: () => {
      return (get().jobExpenses || [])
        .reduce((sum, e) => sum + (e.amount || 0), 0);
    },
  };
}
