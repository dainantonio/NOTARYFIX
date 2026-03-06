// src/hooks/useAutonomousNotify.js
// Subscribe to agent:autonomous_commit events emitted by agentOps
// when the agent auto-commits records without user review.
//
// Usage:
//   const { notifications, clearAll } = useAutonomousNotify();
//   // then render notifications as toasts / banners in Layout or Dashboard
//
// Each notification: { id, type, label, runId, journalId?, invoiceId?, approvedAt, seenAt? }

import { useEffect, useState, useCallback } from 'react';

export function useAutonomousNotify({ maxNotifications = 20 } = {}) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handler = (event) => {
      const detail = event?.detail;
      if (!detail) return;
      setNotifications((prev) => {
        const next = [
          { ...detail, id: `NOTIFY-${Date.now()}`, receivedAt: new Date().toISOString() },
          ...prev,
        ].slice(0, maxNotifications);
        return next;
      });
    };

    window.addEventListener('agent:autonomous_commit', handler);
    return () => window.removeEventListener('agent:autonomous_commit', handler);
  }, [maxNotifications]);

  /** Mark a single notification as seen (removes the unread badge) */
  const markSeen = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, seenAt: new Date().toISOString() } : n)
    );
  }, []);

  /** Dismiss a single notification */
  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /** Dismiss all notifications */
  const clearAll = useCallback(() => setNotifications([]), []);

  const unseenCount = notifications.filter((n) => !n.seenAt).length;

  return { notifications, unseenCount, markSeen, dismiss, clearAll };
}
