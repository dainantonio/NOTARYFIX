// src/agent/runtime.js
// Agent Runtime: Planner → Step Executor → Verify → Emit
// Each step in the plan runs sequentially with its own result/error captured.
// A failed step marks the run as partial — prior steps are NOT rolled back
// (client-side append-only model), but the run record carries a rollback signal
// so a future server-side implementation can act on it.
//
// Designed to move behind a serverless function without UI changes.

import { buildPlan, TASK_TYPES } from './planner';
import { verifySuggestion }      from './verifier';

export { TASK_TYPES };

// ── Tool registry ─────────────────────────────────────────────────────────────
// Maps planner tool names → agentOps function keys.
// Add new tools here as the agent grows — no changes to the executor needed.
const TOOL_MAP = {
  draftJournal:      (ops, args) => ops.runCloseoutAgent?.(args.appointmentId),
  draftInvoice:      (ops, args) => ops.runCloseoutAgent?.(args.appointmentId),
  verifyCompliance:  (ops, args) => ops.runCloseoutAgent?.(args.appointmentId),
  attachCitations:   ()          => ({ ok: true, skipped: true }),   // verifier handles this post-run
  scanOverdue:       (ops)       => ops.runARScan?.(),
  draftReminders:    (ops)       => ops.runARScan?.(),
  parseLead:         (ops, args) => ops.runLeadIntakeAgent?.(args.rawText),
  draftClient:       (ops, args) => ops.runLeadIntakeAgent?.(args.rawText),
  draftAppointment:  (ops, args) => ops.runLeadIntakeAgent?.(args.rawText),
  aggregateWeek:     (ops)       => ops.generateWeeklySummary?.(),
  generateSummary:   (ops)       => ops.generateWeeklySummary?.(),
};

// ── Step deduplication ────────────────────────────────────────────────────────
// Some agentOps (closeout, leadIntake) do all their work in one call.
// The planner lists all logical steps; the executor skips steps whose tool
// maps to the same underlying op as a prior completed step.
const OP_GROUPS = {
  draftJournal:     'closeout',
  draftInvoice:     'closeout',
  verifyCompliance: 'closeout',
  parseLead:        'lead_intake',
  draftClient:      'lead_intake',
  draftAppointment: 'lead_intake',
  aggregateWeek:    'weekly_digest',
  generateSummary:  'weekly_digest',
  scanOverdue:      'ar_scan',
  draftReminders:   'ar_scan',
  attachCitations:  null,   // always runs (no-op — verifier owns this)
};

export class AgentRuntime {
  constructor({ getData, onSuggestionReady } = {}) {
    this.getData           = getData;
    this.onSuggestionReady = onSuggestionReady;
    this._runLog           = [];
  }

  /**
   * Run a full task cycle: plan → execute steps → verify → emit.
   *
   * agentOps: { runCloseoutAgent, runARScan, runLeadIntakeAgent, generateWeeklySummary }
   *
   * Returns:
   *   { ok, runId, result, stepResults[], startedAt, completedAt, rollbackIds[] }
   *   ok = false if any non-skipped step errored
   */
  async run(taskType, context = {}, agentOps = {}) {
    const plan      = buildPlan(taskType, context);
    const runId     = `RUNTIME-${Date.now()}`;
    const startedAt = new Date().toISOString();

    this._log(runId, 'planned', { taskType, steps: plan.steps.map(s => s.tool) });

    // ── Execute each step in sequence ─────────────────────────────────────────
    const stepResults  = [];
    let   result       = null;
    let   runOk        = true;
    const completedOps = new Set();

    for (const step of plan.steps) {
      const opGroup = OP_GROUPS[step.tool] ?? step.tool;

      // Skip if this op group already ran successfully (deduplication)
      if (opGroup && completedOps.has(opGroup)) {
        stepResults.push({ stepId: step.id, tool: step.tool, status: 'deduped' });
        this._log(runId, 'step_deduped', { stepId: step.id, tool: step.tool });
        continue;
      }

      const stepStart = Date.now();
      try {
        const toolFn     = TOOL_MAP[step.tool];
        const stepResult = toolFn
          ? await Promise.resolve(toolFn(agentOps, step.args) ?? { ok: true })
          : { ok: true, skipped: true, reason: `No tool registered for "${step.tool}"` };

        stepResults.push({
          stepId:     step.id,
          tool:       step.tool,
          status:     stepResult?.skipped ? 'skipped' : 'ok',
          durationMs: Date.now() - stepStart,
          output:     stepResult,
        });

        this._log(runId, 'step_ok', { stepId: step.id, tool: step.tool });

        // Track result from the last successful substantive step
        if (stepResult && !stepResult.skipped) result = stepResult;
        if (opGroup) completedOps.add(opGroup);

      } catch (err) {
        runOk = false;
        stepResults.push({
          stepId:     step.id,
          tool:       step.tool,
          status:     'error',
          durationMs: Date.now() - stepStart,
          error:      err.message,
        });
        this._log(runId, 'step_error', { stepId: step.id, tool: step.tool, error: err.message });
        // Continue rather than abort so independent steps still complete.
        // To halt on first error (strict mode), add: break;
      }
    }

    this._log(runId, 'executed', { taskType, ok: runOk, steps: stepResults.length });

    // ── Post-run verification (attach citations + compliance) ─────────────────
    if (result?.suggestion) {
      const data         = this.getData?.() || {};
      const verification = verifySuggestion(result.suggestion, data);
      result.suggestion  = {
        ...result.suggestion,
        citations:        verification.citations,
        confidenceScore:  verification.adjustedScore,
        complianceIssues: verification.issues,
        runtimeRunId:     runId,
      };
      this.onSuggestionReady?.(result.suggestion);
    }

    this._log(runId, 'verified', { taskType, ok: runOk });

    return {
      ok:          runOk,
      runId,
      result,
      stepResults,
      startedAt,
      completedAt: new Date().toISOString(),
      // Rollback signal: step IDs that succeeded before any error.
      // A server-side implementation uses this to reverse committed side-effects.
      rollbackIds: runOk
        ? []
        : stepResults.filter(s => s.status === 'ok').map(s => s.stepId),
    };
  }

  _log(runId, event, meta = {}) {
    this._runLog.unshift({ runId, event, meta, at: new Date().toISOString() });
    if (this._runLog.length > 200) this._runLog.pop();
  }

  /** Returns a copy of the internal run log for debugging */
  getRunLog() { return [...this._runLog]; }
}

// ── App-wide singleton ────────────────────────────────────────────────────────
let _runtime = null;

export function getAgentRuntime(opts = {}) {
  if (!_runtime) _runtime = new AgentRuntime(opts);
  return _runtime;
}

export function resetAgentRuntime() { _runtime = null; }
