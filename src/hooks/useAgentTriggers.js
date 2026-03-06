// src/hooks/useAgentTriggers.js
// Event-driven agent triggers — run automatically on data conditions.
//
// DEDUPLICATION MODEL (upgraded from localStorage):
//   - Completion IDs are stored in data.agentTriggerLog (persisted to app state
//     and therefore localStorage via DataContext), not raw localStorage keys.
//   - Daily/weekly cadence gates use a lightweight entry in agentTriggerLog
//     keyed by date string — same shape as completion IDs.
//   - This survives incognito, storage clears, and future Firebase migration
//     without any interface change.
//
// All client-side; designed to move server-side without UI changes.

import { useEffect, useRef, useCallback } from 'react';

// ── Date helpers ──────────────────────────────────────────────────────────────
function todayKey()    { return `ar_scan::${new Date().toISOString().split('T')[0]}`; }
function thisWeekKey() {
  const d   = new Date();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
  return `weekly_digest::${mon.toISOString().split('T')[0]}`;
}
function completionKey(apptId) { return `closeout::${apptId}`; }

/**
 * useAgentTriggers
 *
 * Props:
 *   data                   — app data snapshot (reads data.agentTriggerLog)
 *   addAgentTriggerEntry   — fn(key: string) — persists a fired key to data layer
 *   runCloseoutAgent       — fn(appointmentId)
 *   runARScan              — fn()
 *   generateWeeklySummary  — fn()
 *   enabled                — master switch (default true)
 *
 * Returns: { lastARScan, lastDigest, processedCompletions } for UI display.
 *
 * MIGRATION NOTE: When moving server-side, replace addAgentTriggerEntry with
 * a Firebase/Supabase write. The hook interface is unchanged.
 */
export function useAgentTriggers({
  data,
  addAgentTriggerEntry,
  runCloseoutAgent,
  runARScan,
  generateWeeklySummary,
  enabled = true,
}) {
  // Stable set of already-fired keys, seeded from persisted data on mount.
  const firedRef = useRef(null);

  // Lazily initialise from data on first render
  if (firedRef.current === null) {
    firedRef.current = new Set(
      Array.isArray(data?.agentTriggerLog) ? data.agentTriggerLog : []
    );
  }

  // Keep in sync if data rehydrates (e.g. after Firebase pull)
  useEffect(() => {
    if (Array.isArray(data?.agentTriggerLog)) {
      for (const key of data.agentTriggerLog) firedRef.current.add(key);
    }
  }, [data?.agentTriggerLog]);

  // Stable helper: fire once then persist
  const fireOnce = useCallback((key, fn, delayMs = 0) => {
    if (firedRef.current.has(key)) return false;
    firedRef.current.add(key);
    addAgentTriggerEntry?.(key);
    if (delayMs > 0) {
      setTimeout(fn, delayMs);
    } else {
      fn();
    }
    return true;
  }, [addAgentTriggerEntry]);

  // ── Trigger 1: appointment completion → closeout agent ──────────────────────
  useEffect(() => {
    if (!enabled || !runCloseoutAgent) return;
    if (data?.settings?.enableAutoCloseoutAgent === false) return;

    const completed = (data?.appointments || []).filter(
      (a) => a.status === 'complete' || a.status === 'completed'
    );

    for (const appt of completed) {
      const key = completionKey(appt.id);
      fireOnce(key, () => runCloseoutAgent(appt.id), 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.appointments, enabled]);

  // ── Trigger 2: daily AR scan ────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !runARScan) return;
    fireOnce(todayKey(), () => runARScan(), 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── Trigger 3: weekly digest (Mondays only) ─────────────────────────────────
  useEffect(() => {
    if (!enabled || !generateWeeklySummary) return;
    if (new Date().getDay() !== 1) return; // 1 = Monday
    fireOnce(thisWeekKey(), () => generateWeeklySummary(), 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── Return status for UI display ──────────────────────────────────────────
  const logArr = Array.isArray(data?.agentTriggerLog) ? data.agentTriggerLog : [];
  const lastARScan = logArr
    .filter(k => k.startsWith('ar_scan::'))
    .sort()
    .at(-1)
    ?.replace('ar_scan::', '') ?? null;

  const lastDigest = logArr
    .filter(k => k.startsWith('weekly_digest::'))
    .sort()
    .at(-1)
    ?.replace('weekly_digest::', '') ?? null;

  const processedCompletions = logArr.filter(k => k.startsWith('closeout::')).length;

  return { lastARScan, lastDigest, processedCompletions };
}
