// src/agent/runtime.js
// Agent Runtime: Planner → Execute → Verify
// Orchestrates existing agentOps as "tools" — no logic is duplicated.
// Designed to drop behind a serverless function later without UI changes.

import { buildPlan, TASK_TYPES } from './planner';
import { verifySuggestion }      from './verifier';

export { TASK_TYPES };

export class AgentRuntime {
  constructor({ getData, onSuggestionReady } = {}) {
    this.getData           = getData;
    this.onSuggestionReady = onSuggestionReady;
    this._runLog           = [];
  }

  /**
   * Run a full task cycle: plan → execute (via agentOps) → verify → emit.
   * agentOps is an object of { runCloseoutAgent, runARScan, runLeadIntakeAgent, generateWeeklySummary }
   * Returns { ok, runId, result, startedAt, completedAt }
   */
  async run(taskType, context = {}, agentOps = {}) {
    const plan      = buildPlan(taskType, context);
    const runId     = `RUNTIME-${Date.now()}`;
    const startedAt = new Date().toISOString();

    this._log(runId, 'planned', { taskType, steps: plan.steps.length });

    let result;
    try {
      result = await this._execute(plan, agentOps);
      this._log(runId, 'executed', { taskType });
    } catch (err) {
      this._log(runId, 'error', { taskType, error: err.message });
      return { ok: false, runId, error: err.message, startedAt };
    }

    // ── Verify any suggestion produced and attach grounded citations ──────────
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

    this._log(runId, 'verified', { taskType, ok: result?.ok ?? true });

    return {
      ok:          true,
      runId,
      result,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  // ── Internal: delegate to existing agentOps ─────────────────────────────────
  _execute(plan, agentOps) {
    const { taskType, context } = plan;
    switch (taskType) {
      case TASK_TYPES.CLOSEOUT:
        return Promise.resolve(agentOps.runCloseoutAgent?.(context.appointmentId) ?? { ok: true });

      case TASK_TYPES.AR_SCAN:
        return Promise.resolve(agentOps.runARScan?.() ?? { ok: true });

      case TASK_TYPES.LEAD_INTAKE:
        return Promise.resolve(agentOps.runLeadIntakeAgent?.(context.rawText) ?? { ok: true });

      case TASK_TYPES.WEEKLY_DIGEST:
        return Promise.resolve(agentOps.generateWeeklySummary?.() ?? { ok: true });

      default:
        return Promise.resolve({ ok: true });
    }
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
