// src/components/DepartureChecklistModal.jsx
// Pre-departure blocking checklist before navigating to ArriveMode.
// Critical items MUST all be checked. Non-critical can be skipped with confirmation.
// On confirm: starts GPS tracking immediately via ActiveTripContext (no page visit needed).

import React, { useState, useEffect } from 'react';
import {
  X, Car, AlertTriangle, CheckCircle2, Circle,
  ShieldAlert, ChevronRight,
} from 'lucide-react';
import { useActiveTrip } from '../context/ActiveTripContext';

// ─── Per-type pre-departure checklists (mirrored from ArriveMode) ─────────────
const CHECKLIST = {
  'Loan Signing': [
    { id: 'ls-1', critical: true,  label: 'Full package printed and page-counted' },
    { id: 'ls-2', critical: true,  label: 'All borrower names match the lender package' },
    { id: 'ls-3', critical: true,  label: 'Notary seal, commission card, journal in bag' },
    { id: 'ls-4', critical: false, label: 'Blue pens (×2 minimum)' },
    { id: 'ls-5', critical: false, label: 'Return shipping label (FedEx / UPS)' },
    { id: 'ls-6', critical: false, label: 'Lender contact saved in phone' },
    { id: 'ls-7', critical: false, label: 'Phone on Do Not Disturb' },
  ],
  'General Notary Work (GNW)': [
    { id: 'gnw-1', critical: true,  label: 'Notary seal, journal, and commission card packed' },
    { id: 'gnw-2', critical: true,  label: 'Document reviewed — correct act confirmed' },
    { id: 'gnw-3', critical: false, label: 'Blue pens packed' },
    { id: 'gnw-4', critical: false, label: 'Fee amount confirmed with client' },
    { id: 'gnw-5', critical: false, label: 'Phone on Do Not Disturb' },
  ],
  'I-9 Verification': [
    { id: 'i9-1', critical: true,  label: 'Employee has completed Section 1 before you arrive' },
    { id: 'i9-2', critical: true,  label: 'Acceptable document list reviewed (List A or B+C)' },
    { id: 'i9-3', critical: false, label: 'Employer contact saved in phone' },
    { id: 'i9-4', critical: false, label: 'Phone on Do Not Disturb' },
  ],
  'Apostille': [
    { id: 'ap-1', critical: true,  label: 'Document is original or certified copy — no photocopies' },
    { id: 'ap-2', critical: true,  label: 'Issuing state confirmed, SOS requirements reviewed' },
    { id: 'ap-3', critical: false, label: 'Correct fee confirmed with SOS office' },
    { id: 'ap-4', critical: false, label: 'Turnaround time communicated to client' },
  ],
  'Remote Online Notary (RON)': [
    { id: 'ron-1', critical: true,  label: 'RON platform open and session link sent to signer' },
    { id: 'ron-2', critical: true,  label: 'Your state RON commission is active' },
    { id: 'ron-3', critical: true,  label: 'Audio/video recording will be enabled' },
    { id: 'ron-4', critical: false, label: 'Documents uploaded to platform' },
    { id: 'ron-5', critical: false, label: 'Quiet, professional background confirmed' },
    { id: 'ron-6', critical: false, label: 'Back-up internet connection available' },
  ],
};

const DEFAULT_CHECKLIST = CHECKLIST['General Notary Work (GNW)'];

const getChecklist = (appointmentType = '') => {
  // Try exact match first
  if (CHECKLIST[appointmentType]) return CHECKLIST[appointmentType];
  // Fuzzy match
  const lower = appointmentType.toLowerCase();
  if (lower.includes('loan')) return CHECKLIST['Loan Signing'];
  if (lower.includes('i-9') || lower.includes('i9')) return CHECKLIST['I-9 Verification'];
  if (lower.includes('apostille')) return CHECKLIST['Apostille'];
  if (lower.includes('ron') || lower.includes('remote online')) return CHECKLIST['Remote Online Notary (RON)'];
  return DEFAULT_CHECKLIST;
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const DepartureChecklistModal = ({ appointment, isOpen, onClose, onDepart }) => {
  const { startTrip } = useActiveTrip();
  const [checked, setChecked] = useState(new Set());
  const [confirmingSkip, setConfirmingSkip] = useState(false);

  const items = getChecklist(appointment?.type);
  const criticalItems    = items.filter(i => i.critical);
  const nonCriticalItems = items.filter(i => !i.critical);

  const allCriticalChecked = criticalItems.every(i => checked.has(i.id));
  const uncheckedNonCritical = nonCriticalItems.filter(i => !checked.has(i.id));

  // Reset state when modal opens for a new appointment
  useEffect(() => {
    if (isOpen) {
      setChecked(new Set());
      setConfirmingSkip(false);
    }
  }, [isOpen, appointment?.id]);

  if (!isOpen || !appointment) return null;

  const toggle = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDepartClick = () => {
    if (!allCriticalChecked) return; // button should be disabled, but safety check
    if (uncheckedNonCritical.length > 0 && !confirmingSkip) {
      setConfirmingSkip(true);
      return;
    }

    // Start GPS trip tracking immediately via context — no page visit needed
    const label = [appointment.type, appointment.client].filter(Boolean).join(' — ');
    const dest  = appointment.address || appointment.location || '';
    if (startTrip) {
      startTrip({
        origin:         'Home',
        destination:    dest,
        linkedJobId:    appointment.id   || null,
        linkedJobLabel: label            || '',
        purpose:        'Business',
      });
    } else {
      // Fallback: queue via localStorage if context is unavailable
      try {
        localStorage.setItem('notaryfix_pending_trip', JSON.stringify({
          origin: 'Home', destination: dest,
          linkedJobId: appointment.id || null,
          linkedJobLabel: label || '', purpose: 'Business',
        }));
      } catch (e) { /* storage unavailable */ }
    }

    onDepart(appointment.id);
  };

  const totalChecked = checked.size;
  const totalItems   = items.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Car className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Pre-Departure Checklist</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                {appointment.client} · {appointment.type}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-1 bg-amber-500 transition-all duration-300 rounded-r"
            style={{ width: `${totalItems > 0 ? (totalChecked / totalItems) * 100 : 0}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="max-h-[55vh] overflow-y-auto px-4 py-4 space-y-1">
          {/* Critical items */}
          {criticalItems.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Critical — must complete</p>
              </div>
              {criticalItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all mb-1
                    ${checked.has(item.id)
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700'
                      : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/20'
                    }`}
                >
                  {checked.has(item.id)
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    : <Circle className="h-5 w-5 text-red-400 shrink-0" />
                  }
                  <span className={`text-sm font-medium flex-1 leading-snug ${
                    checked.has(item.id)
                      ? 'text-emerald-700 dark:text-emerald-300 line-through'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Non-critical items */}
          {nonCriticalItems.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">Recommended</p>
              {nonCriticalItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all mb-1
                    ${checked.has(item.id)
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                >
                  {checked.has(item.id)
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    : <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 shrink-0" />
                  }
                  <span className={`text-sm flex-1 leading-snug ${
                    checked.has(item.id)
                      ? 'text-emerald-600 dark:text-emerald-400 line-through'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Skip confirmation warning */}
        {confirmingSkip && uncheckedNonCritical.length > 0 && (
          <div className="mx-4 mb-2 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {uncheckedNonCritical.length} recommended item{uncheckedNonCritical.length > 1 ? 's' : ''} unchecked. Proceed anyway?
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* Status */}
          {!allCriticalChecked && (
            <p className="text-center text-xs text-red-500 font-medium">
              {criticalItems.filter(i => !checked.has(i.id)).length} critical item{criticalItems.filter(i => !checked.has(i.id)).length !== 1 ? 's' : ''} remaining
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Not Yet
            </button>
            <button
              onClick={handleDepartClick}
              disabled={!allCriticalChecked}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95
                ${allCriticalChecked
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
            >
              <Car className="h-4 w-4" />
              {confirmingSkip ? 'Confirm & Depart' : "I'm Leaving →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartureChecklistModal;
