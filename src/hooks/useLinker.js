// src/hooks/useLinker.js
// Cross-module action bus — prompts, toasts, and cross-linking helpers
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

// ─── GLOBAL TOAST STORE (simple pub/sub, no extra dep) ───────────────────────
const _listeners = new Set();
let _toastId = 0;
const _items = { current: [] };

export const toast = {
  subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn); },
  _emit() { _listeners.forEach((fn) => fn([..._items.current])); },
  show(msg, type = 'info', duration = 4200) {
    const id = ++_toastId;
    _items.current = [{ id, msg, type }, ..._items.current].slice(0, 5);
    this._emit();
    if (duration > 0) setTimeout(() => this.dismiss(id), duration);
    return id;
  },
  success(msg, d) { return this.show(msg, 'success', d); },
  error(msg, d)   { return this.show(msg, 'error', d); },
  info(msg, d)    { return this.show(msg, 'info', d); },
  dismiss(id) {
    _items.current = _items.current.filter((t) => t.id !== id);
    this._emit();
  },
};

// ─── PROMPT STORE ─────────────────────────────────────────────────────────────
const _promptListeners = new Set();
let _activePrompt = null;

export const promptBus = {
  subscribe(fn) { _promptListeners.add(fn); return () => _promptListeners.delete(fn); },
  _emit() { _promptListeners.forEach((fn) => fn(_activePrompt)); },
  show(prompt) { _activePrompt = { ...prompt, id: ++_toastId }; this._emit(); },
  dismiss()    { _activePrompt = null; this._emit(); },
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export const useLinker = () => {
  const navigate = useNavigate();
  const { data, updateAppointment, updateSignerSession, updateDispatchJob, runCloseoutAgent } = useData();

  // ── Appointment → Journal + Invoice chain ────────────────────────────────────
  const completeAppointment = useCallback((apt) => {
    updateAppointment(apt.id, { status: 'completed', completedAt: new Date().toISOString() });
    toast.success(`"${apt.client}" marked complete.`);

    const alreadyRan = (data.agentRuns || []).some((run) => String(run.appointmentId) === String(apt.id));
    if (!alreadyRan && (parseFloat(apt.amount) || 0) > 0) {
      runCloseoutAgent(apt.id, 'Closeout Agent');
      toast.info('Agent drafted journal + invoice for review.');
    }

    const hasJournal = (data.journalEntries || []).some((e) => e.linkedAppointmentId === apt.id);
    const hasInvoice = (data.invoices || []).some((i) => i.linkedAppointmentId === apt.id);

    const showInvoicePrompt = () => {
      if (hasInvoice || !(apt.amount > 0)) return;
      setTimeout(() => {
        promptBus.show({
          type: 'invoicePrompt',
          title: 'Create Invoice?',
          body: `Generate a $${apt.amount} invoice for "${apt.client}"?`,
          confirmLabel: 'Create Invoice',
          cancelLabel: 'Skip',
          onConfirm: () => {
            promptBus.dismiss();
            navigate('/invoices', { state: { prefillFromAppointment: apt.id } });
          },
          onDismiss: () => promptBus.dismiss(),
        });
      }, hasJournal ? 0 : 350);
    };

    if (!hasJournal) {
      promptBus.show({
        type: 'journalPrompt',
        title: 'Log in Journal?',
        body: `Create a journal entry for "${apt.client} — ${apt.type}"?`,
        confirmLabel: 'Open Journal',
        cancelLabel: 'Skip',
        onConfirm: () => {
          promptBus.dismiss();
          navigate('/journal', { state: { prefillFromAppointment: apt.id } });
        },
        onDismiss: () => { promptBus.dismiss(); showInvoicePrompt(); },
      });
    } else {
      showInvoicePrompt();
    }
  }, [data.agentRuns, data.journalEntries, data.invoices, updateAppointment, navigate, runCloseoutAgent]);

  // ── Journal entry saved → suggest Invoice ────────────────────────────────────
  const afterJournalSave = useCallback((entry) => {
    const fee = parseFloat(entry.fee) || 0;
    if (fee <= 0) return;
    const alreadyLinked = entry.linkedInvoiceId;
    const hasMatchingInvoice = (data.invoices || []).some(
      (i) => i.linkedAppointmentId && i.linkedAppointmentId === entry.linkedAppointmentId
    );
    if (alreadyLinked || hasMatchingInvoice) return;

    setTimeout(() => {
      promptBus.show({
        type: 'invoicePrompt',
        title: 'Add Invoice Line?',
        body: `This act has a $${fee} fee. Create an invoice for "${entry.signerName}"?`,
        confirmLabel: 'Create Invoice',
        cancelLabel: 'Skip',
        onConfirm: () => {
          promptBus.dismiss();
          navigate('/invoices', {
            state: {
              prefillInvoice: {
                client: entry.signerName,
                amount: fee,
                actType: entry.actType,
              },
            },
          });
        },
        onDismiss: () => promptBus.dismiss(),
      });
    }, 300);
  }, [data.invoices, navigate]);

  // ── Signer session complete → appointment + dispatch ─────────────────────────
  const completeSignerSession = useCallback((session) => {
    updateSignerSession(session.id, { status: 'completed', completedAt: new Date().toISOString() });
    toast.success(`Session "${session.title}" completed.`);

    if (session.linkedAppointmentId) {
      updateAppointment(session.linkedAppointmentId, { status: 'completed' });
      toast.info('Linked appointment updated.');
    }
    if (session.linkedDispatchJobId && updateDispatchJob) {
      updateDispatchJob(session.linkedDispatchJobId, { status: 'completed', completedAt: new Date().toISOString() });
      toast.info('Linked dispatch job closed.');
    }

    promptBus.show({
      type: 'invoicePrompt',
      title: 'Session Complete — Invoice?',
      body: `"${session.title}" is done. Create an invoice for this signing?`,
      confirmLabel: 'Create Invoice',
      cancelLabel: 'Later',
      onConfirm: () => {
        promptBus.dismiss();
        navigate('/invoices', { state: { prefillFromSession: session.id } });
      },
      onDismiss: () => promptBus.dismiss(),
    });
  }, [updateSignerSession, updateAppointment, updateDispatchJob, navigate]);

  return { completeAppointment, afterJournalSave, completeSignerSession };
};
