// src/hooks/useFeedbackLoop.js
// Capture diffs when users edit AI drafts AND outcomes when they approve/reject.
// Stored for confidence adjustment and future prompt improvement.
// No ML required — statistical edit + rejection rate is enough to nudge scores.

import { useMemo } from 'react';

/**
 * Compute field-level diff between original and edited drafts.
 * Returns { fieldName: { from, to } } for every changed field.
 */
export function computeDiff(original = {}, edited = {}) {
  const changed  = {};
  const allKeys  = new Set([...Object.keys(original), ...Object.keys(edited)]);
  for (const key of allKeys) {
    const a = original[key];
    const b = edited[key];
    if (String(a ?? '') !== String(b ?? '')) {
      changed[key] = { from: a, to: b };
    }
  }
  return changed;
}

/**
 * Get confidence score adjustment based on combined edit + rejection history.
 *
 * Signals used:
 *   - editRate       → how often the agent is wrong enough to need correction
 *   - rejectionRate  → how often the user throws the draft away entirely
 *   - approvalRate   → positive signal; can lift score when history is clean
 *
 * Returns a score delta in the range [-20, +5].
 * Returns 0 if there are fewer than 3 samples (insufficient signal).
 */
export function getConfidenceAdjustment(feedbackHistory = [], suggestionType, stateCode) {
  const relevant = feedbackHistory.filter(
    (f) =>
      f.suggestionType === suggestionType &&
      (!stateCode || !f.stateCode || f.stateCode === stateCode)
  );

  if (relevant.length < 3) return 0; // not enough signal

  const withEdits      = relevant.filter((f) => Object.keys(f.diff || {}).length > 0);
  const withRejections = relevant.filter((f) => f.outcome === 'rejected');
  const withApprovals  = relevant.filter((f) => f.outcome === 'approved' && Object.keys(f.diff || {}).length === 0);

  const editRate       = withEdits.length      / relevant.length;
  const rejectionRate  = withRejections.length  / relevant.length;
  const cleanApprovalRate = withApprovals.length / relevant.length;

  // Rejection is a stronger signal than editing
  if (rejectionRate > 0.5)  return -20;
  if (rejectionRate > 0.25) return -12;

  // Edit rate: agent is producing drafts that need correction
  if (editRate > 0.7)  return -15;
  if (editRate > 0.4)  return -8;

  // Positive signal: agent is consistently approved without edits
  if (cleanApprovalRate > 0.8 && relevant.length >= 5) return +5;

  return 0;
}

/**
 * useFeedbackLoop
 *
 * Props:
 *   addFeedback      — fn(feedbackRecord) — persists to app state / Firestore
 *   feedbackHistory  — array of past feedback records from data.agentFeedback
 *
 * Returns:
 *   recordEdit(suggestion, editedDraft, reason?)   — call when user saves an edited draft
 *   recordOutcome(suggestion, outcome)             — call on approve ('approved') or reject ('rejected')
 *   adjustedConfidence(suggestion)                 — confidence score adjusted by history
 */
export function useFeedbackLoop({ addFeedback, feedbackHistory = [] }) {

  /**
   * Record an edit when a user saves changes to an AI-generated draft.
   * Also captures the outcome as 'edited' for rejection-rate calculations.
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
      outcome:            'edited',
      reason,
      editedAt:           new Date().toISOString(),
      originalConfidence: suggestion.confidenceScore ?? null,
      runtimeRunId:       suggestion.runtimeRunId || null,
    };

    addFeedback?.(record);
  }, [addFeedback]);

  /**
   * Record the final outcome when a user approves or rejects a suggestion.
   * Should be called by the approve/reject handlers in AgentSuggestionCard
   * BEFORE calling the actual approveAgentSuggestion / rejectAgentSuggestion ops.
   *
   * outcome: 'approved' | 'rejected'
   */
  const recordOutcome = useMemo(() => (suggestion, outcome) => {
    if (!suggestion?.id) return;
    if (outcome !== 'approved' && outcome !== 'rejected') return;

    const record = {
      id:                 `FB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      suggestionId:       suggestion.id,
      suggestionType:     suggestion.type || 'closeout',
      stateCode:          suggestion.stateCode || '',
      serviceType:        suggestion.draftJournal?.actType || '',
      diff:               suggestion.wasEdited ? { _edited: true } : {},
      outcome,
      reason:             '',
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

  return { recordEdit, recordOutcome, adjustedConfidence };
}
