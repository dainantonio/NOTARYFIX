// src/hooks/useAgentTriggers.js
// Event-driven agent triggers — run automatically on data conditions.
// Gated by localStorage timestamps so they never fire more than once per period.
// All client-side now; designed to move server-side without UI changes.

import { useEffect, useRef } from 'react';

const KEYS = {
  LAST_AR_SCAN:           'agent_last_ar_scan',
  LAST_DIGEST:            'agent_last_digest',
  PROCESSED_COMPLETIONS:  'agent_processed_completions',
};

function todayKey()    { return new Date().toISOString().split('T')[0]; }
function thisWeekKey() {
  const d   = new Date();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
  return mon.toISOString().split('T')[0];
}

function loadProcessed() {
  try { return new Set(JSON.parse(localStorage.getItem(KEYS.PROCESSED_COMPLETIONS) || '[]')); }
  catch { return new Set(); }
}

function saveProcessed(set) {
  const arr = [...set].slice(-200); // keep last 200 IDs
  localStorage.setItem(KEYS.PROCESSED_COMPLETIONS, JSON.stringify(arr));
}

/**
 * useAgentTriggers
 * Fires agent tasks automatically based on data state + elapsed time.
 *
 * Props:
 *   data                  — app data snapshot
 *   runCloseoutAgent      — fn(appointmentId)
 *   runARScan             — fn()
 *   generateWeeklySummary — fn()
 *   enabled               — master switch (default true)
 *
 * Returns trigger status for display in UI.
 */
export function useAgentTriggers({
  data,
  runCloseoutAgent,
  runARScan,
  generateWeeklySummary,
  enabled = true,
}) {
  const processedRef = useRef(loadProcessed());

  // ── Trigger 1: appointment completion → closeout agent ──────────────────────
  useEffect(() => {
    if (!enabled || !runCloseoutAgent) return;
    if (data?.settings?.enableAutoCloseoutAgent === false) return;

    const completed = (data?.appointments || []).filter(
      (a) => a.status === 'complete' || a.status === 'completed'
    );

    let fired = false;
    for (const appt of completed) {
      const id = String(appt.id);
      if (!processedRef.current.has(id)) {
        processedRef.current.add(id);
        fired = true;
        // Defer slightly to avoid firing during render
        setTimeout(() => runCloseoutAgent(appt.id), 600);
      }
    }
    if (fired) saveProcessed(processedRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.appointments, enabled]);

  // ── Trigger 2: daily AR scan ────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !runARScan) return;
    if (localStorage.getItem(KEYS.LAST_AR_SCAN) === todayKey()) return;
    localStorage.setItem(KEYS.LAST_AR_SCAN, todayKey());
    setTimeout(() => runARScan(), 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── Trigger 3: weekly digest (Mondays only) ─────────────────────────────────
  useEffect(() => {
    if (!enabled || !generateWeeklySummary) return;
    if (new Date().getDay() !== 1) return; // 1 = Monday
    if (localStorage.getItem(KEYS.LAST_DIGEST) === thisWeekKey()) return;
    localStorage.setItem(KEYS.LAST_DIGEST, thisWeekKey());
    setTimeout(() => generateWeeklySummary(), 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Return status for UI display
  return {
    lastARScan:            localStorage.getItem(KEYS.LAST_AR_SCAN),
    lastDigest:            localStorage.getItem(KEYS.LAST_DIGEST),
    processedCompletions:  processedRef.current.size,
  };
}
