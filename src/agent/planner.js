// src/agent/planner.js
// Planner: maps task types to ordered step arrays.
// Pure data — no side effects, no imports.

export const TASK_TYPES = {
  CLOSEOUT:      'closeout',
  AR_SCAN:       'ar_scan',
  LEAD_INTAKE:   'lead_intake',
  WEEKLY_DIGEST: 'weekly_digest',
};

/**
 * Build a plan for the given task type.
 * Returns { taskType, context, steps[] }
 * Each step: { id, tool, args }
 */
export function buildPlan(taskType, context = {}) {
  switch (taskType) {
    case TASK_TYPES.CLOSEOUT:
      return {
        taskType,
        context,
        steps: [
          { id: 'draft_journal',       tool: 'draftJournal',      args: context },
          { id: 'draft_invoice',       tool: 'draftInvoice',      args: context },
          { id: 'verify_compliance',   tool: 'verifyCompliance',  args: context },
          { id: 'attach_citations',    tool: 'attachCitations',   args: context },
        ],
      };

    case TASK_TYPES.AR_SCAN:
      return {
        taskType,
        context,
        steps: [
          { id: 'scan_overdue',        tool: 'scanOverdue',       args: context },
          { id: 'draft_reminders',     tool: 'draftReminders',    args: context },
          { id: 'attach_citations',    tool: 'attachCitations',   args: context },
        ],
      };

    case TASK_TYPES.LEAD_INTAKE:
      return {
        taskType,
        context,
        steps: [
          { id: 'parse_lead',          tool: 'parseLead',         args: context },
          { id: 'draft_client',        tool: 'draftClient',       args: context },
          { id: 'draft_appointment',   tool: 'draftAppointment',  args: context },
        ],
      };

    case TASK_TYPES.WEEKLY_DIGEST:
      return {
        taskType,
        context,
        steps: [
          { id: 'aggregate_week',      tool: 'aggregateWeek',     args: context },
          { id: 'generate_summary',    tool: 'generateSummary',   args: context },
        ],
      };

    default:
      return { taskType, context, steps: [] };
  }
}

/** Human-readable label for a task type */
export function taskLabel(taskType) {
  const labels = {
    [TASK_TYPES.CLOSEOUT]:      'Closeout Agent',
    [TASK_TYPES.AR_SCAN]:       'AR Scan',
    [TASK_TYPES.LEAD_INTAKE]:   'Lead Intake',
    [TASK_TYPES.WEEKLY_DIGEST]: 'Weekly Digest',
  };
  return labels[taskType] || taskType;
}
