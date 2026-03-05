// src/hooks/useFeedbackLoop.js
// Capture diffs when users edit AI drafts.
// Stored for confidence adjustment and future prompt improvement.
// No ML required — statistical edit rate is enough to nudge scores.

import { useMemo } from 'react';

/**
 * Compute field-level diff between original and edited drafts.
 * Returns { fieldName: { from, to } } for every changed field.
 */
export function computeDiff(original = {}, edited = {}) {
  const changed  = {};
  const allKeys  = new Set([...Object.keys(original), ...Object.keys(edited)]);
  for (const key of allKeys) {
    // Normalize numbers/strings for comparison
    const a = original[key];
    const b = edited[key];
    if (String(a ?? '') !== String(b ?? '')) {
      changed[key] = { from: a, to: b };
    }
  }
  return changed;
}

/**
 * Get confidence score adjustment based on edit history.
 * Returns a negative integer (-15 to 0) when the agent tends to be wrong
 * for this suggestion type in this state.
 * Returns 0 if there is insufficient data (< 3 samples).
 */
export function getConfidenceAdjustment(feedbackHistory = [], suggestionType, stateCode) {
  const relevant = feedbackHistory.filter(
    (f) =>
      f.suggestionType === suggestionType &&
      (!stateCode || !f.stateCode || f.stateCode === stateCode)
  );

  if (relevant.length < 3) return 0; // not enough signal

  const withEdits = relevant.filter((f) => Object.keys(f.diff || {}).length > 0);
  const editRate  = withEdits.length / relevant.length;

  if (editRate > 0.7) return -15; // agent is frequently wrong
  if (editRate > 0.4) return -8;  // agent is sometimes wrong
  return 0;
}

/**
 * useFeedbackLoop
 *
 * Props:
 *   addFeedback      — fn(feedbackRecord) — persists to Firestore / app state
 *   feedbackHistory  — array of past feedback records
 *
 * Returns:
 *   recordEdit(suggestion, editedDraft, reason?)  — call when user saves an edited draft
 *   adjustedConfidence(suggestion)                — confidence score adjusted by history
 */
export function useFeedbackLoop({ addFeedback, feedbackHistory = [] }) {

  /**
   * Record an edit when a user saves changes to an AI-generated draft.
   * No-ops if nothing actually changed.
   */
  const recordEdit = useMemo(() => (suggestion, editedDraft, reason = '') => {
    const original = suggestion.draftJournal || suggestion.draftInvoice || {};
    const diff     = computeDiff(original, editedDraft);

    if (Object.keys(diff).length === 0) return; // no meaningful change

    const record = {
      id:                 `FB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      suggestionId:       suggestion.id,
      suggestionType:     suggestion.type || 'closeout',
      stateCode:          suggestion.stateCode || '',
      serviceType:        suggestion.draftJournal?.actType || '',
      diff,
      reason,
      editedAt:           new Date().toISOString(),
      originalConfidence: suggestion.confidenceScore ?? null,
      runtimeRunId:       suggestion.runtimeRunId || null,
    };

    addFeedback?.(record);
  }, [addFeedback]);

  /**
   * Return a history-adjusted confidence score for a suggestion.
   */
  const adjustedConfidence = useMemo(() => (suggestion) => {
    const base       = suggestion.confidenceScore ?? 65;
    const adjustment = getConfidenceAdjustment(
      feedbackHistory,
      suggestion.type || 'closeout',
      suggestion.stateCode
    );
    return Math.max(0, Math.min(100, base + adjustment));
  }, [feedbackHistory]);

  return { recordEdit, adjustedConfidence };
}
