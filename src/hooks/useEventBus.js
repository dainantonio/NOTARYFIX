// src/hooks/useEventBus.js
// Agentic event bus — formal event model for NOTARYFIX
// Events: AppointmentCompleted, DocumentUploaded, InvoiceOverdue, AgentSuggestionCreated
import { useCallback, useEffect, useRef } from 'react';

// ─── Global singleton event bus ───────────────────────────────────────────────
const _handlers = {};
let _eventId = 0;

export const EventBus = {
  /**
   * Subscribe to an event type. Returns an unsubscribe function.
   * @param {string} eventType
   * @param {function} handler  - receives (payload, meta)
   */
  subscribe(eventType, handler) {
    if (!_handlers[eventType]) _handlers[eventType] = new Set();
    _handlers[eventType].add(handler);
    return () => _handlers[eventType]?.delete(handler);
  },

  /**
   * Emit an event synchronously to all subscribers.
   * @param {string} eventType
   * @param {object} payload
   */
  emit(eventType, payload = {}) {
    const meta = { eventType, eventId: ++_eventId, emittedAt: new Date().toISOString() };
    (_handlers[eventType] || []).forEach((fn) => {
      try { fn(payload, meta); } catch (e) { console.error(`[EventBus] handler error for ${eventType}:`, e); }
    });
    // Also fire wildcard subscribers
    (_handlers['*'] || []).forEach((fn) => {
      try { fn(payload, meta); } catch (e) { console.error('[EventBus] wildcard handler error:', e); }
    });
  },
};

// ─── Event type constants ──────────────────────────────────────────────────────
export const EVENTS = {
  APPOINTMENT_COMPLETED:      'AppointmentCompleted',
  APPOINTMENT_CREATED:        'AppointmentCreated',
  DOCUMENT_UPLOADED:          'DocumentUploaded',
  INVOICE_OVERDUE:            'InvoiceOverdue',
  INVOICE_CREATED:            'InvoiceCreated',
  JOURNAL_ENTRY_SAVED:        'JournalEntrySaved',
  AGENT_SUGGESTION_CREATED:   'AgentSuggestionCreated',
  AGENT_SUGGESTION_APPROVED:  'AgentSuggestionApproved',
  AGENT_SUGGESTION_REJECTED:  'AgentSuggestionRejected',
  AGENT_SUGGESTION_EDITED:    'AgentSuggestionEdited',
};

// ─── React hook wrapper ───────────────────────────────────────────────────────
export const useEventBus = () => {
  const subscriptionsRef = useRef([]);

  const subscribe = useCallback((eventType, handler) => {
    const unsub = EventBus.subscribe(eventType, handler);
    subscriptionsRef.current.push(unsub);
    return unsub;
  }, []);

  const emit = useCallback((eventType, payload) => {
    EventBus.emit(eventType, payload);
  }, []);

  // Cleanup all subscriptions when component unmounts
  useEffect(() => {
    return () => { subscriptionsRef.current.forEach((fn) => fn()); };
  }, []);

  return { emit, subscribe, EVENTS };
};

export default useEventBus;
