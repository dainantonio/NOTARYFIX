// File: src/pages/Mileage.jsx
// NotaryOS — Mileage Tracker  (the moat feature)
// Replaces MileIQ + Everlance entirely.
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Car, Play, Square, MapPin, Navigation, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, Split, Link2, Download, FileText, TrendingUp,
  Calendar, Clock, Check, X, AlertCircle, Briefcase, Home, Star,
  Filter, Search, ArrowUpDown, ChevronLeft, ChevronUp,
  MoreVertical, Zap, Shield, DollarSign, BarChart3, Target, Copy,
  Bell, Printer,
} from 'lucide-react';
import { useData } from '../context/DataContext';

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const IRS_RATE_2025   = 0.67; // per mile
const REMINDER_MIN    = 90;   // minutes before "still driving?" nudge fires
const PURPOSES        = ['Business', 'Medical', 'Charity', 'Personal'];
const PURPOSE_COLORS  = {
  Business: { bg: 'bg-cyan-500/15',     text: 'text-cyan-400',    border: 'border-cyan-500/25',    dot: '#22d3ee' },
  Medical:  { bg: 'bg-emerald-500/15',  text: 'text-emerald-400', border: 'border-emerald-500/25', dot: '#4ade80' },
  Charity:  { bg: 'bg-violet-500/15',   text: 'text-violet-400',  border: 'border-violet-500/25',  dot: '#a78bfa' },
  Personal: { bg: 'bg-slate-500/15',    text: 'text-slate-400',   border: 'border-slate-500/25',   dot: '#64748b' },
};

const SEED_TRIPS = [
  { id: 't1', date: '2025-02-17', start: '8:12 AM',  end: '8:54 AM',  origin: 'Home',                  destination: 'Downtown Title Office',      miles: 14.5, purpose: 'Business', linkedJobId: '1',  linkedJobLabel: 'Loan Signing — Sarah Johnson', notes: '',                       verified: true  },
  { id: 't2', date: '2025-02-17', start: '3:40 PM',  end: '4:18 PM',  origin: 'Downtown Title Office',  destination: 'Home',                       miles: 14.2, purpose: 'Business', linkedJobId: '1',  linkedJobLabel: 'Loan Signing — Sarah Johnson', notes: '',                       verified: true  },
  { id: 't3', date: '2025-02-15', start: '1:05 PM',  end: '1:31 PM',  origin: 'Home',                  destination: 'TechCorp HQ',                miles: 8.2,  purpose: 'Business', linkedJobId: null, linkedJobLabel: '',                             notes: 'I-9 batch session',      verified: true  },
  { id: 't4', date: '2025-02-14', start: '9:30 AM',  end: '10:47 AM', origin: 'Office',                destination: 'Riverside Medical Center',   miles: 22.7, purpose: 'Business', linkedJobId: null, linkedJobLabel: '',                             notes: 'Hospital loan signing',  verified: false },
  { id: 't5', date: '2025-02-12', start: '6:00 PM',  end: '6:28 PM',  origin: 'Home',                  destination: 'Grocery Store',              miles: 3.8,  purpose: 'Personal', linkedJobId: null, linkedJobLabel: '',                             notes: '',                       verified: true  },
  { id: 't6', date: '2025-02-11', start: '7:15 AM',  end: '8:02 AM',  origin: 'Home',                  destination: 'County Recorder',            miles: 18.3, purpose: 'Business', linkedJobId: null, linkedJobLabel: '',                             notes: 'Document filing',        verified: true  },
  { id: 't7', date: '2025-02-10', start: '2:00 PM',  end: '2:44 PM',  origin: 'Home',                  destination: "St. Luke's Hospital",        miles: 11.9, purpose: 'Business', linkedJobId: null, linkedJobLabel: '',                             notes: '',                       verified: false },
  { id: 't8', date: '2025-02-08', start: '10:20 AM', end: '11:15 AM', origin: 'Office',                destination: 'Willow Creek Assisted Living',miles: 16.4, purpose: 'Business', linkedJobId: null, linkedJobLabel: '',                             notes: '',                       verified: true  },
];

const FALLBACK_APPOINTMENTS = [
  { id: 'appt-1', label: 'Loan Signing — Sarah Johnson (Feb 17)' },
  { id: 'appt-2', label: 'I-9 Verification — TechCorp (Feb 19)'  },
  { id: 'appt-3', label: 'Jurat — Marcus Webb (Feb 20)'           },
  { id: 'appt-4', label: 'Acknowledgment — Linda Rivera (Feb 22)' },
];

const fmtCurrency = (n)  => '$' + n.toFixed(2);
const monthName   = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long',  year: 'numeric' });
const shortDate   = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric'  });

const csvEscape = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const normalizeTrips = (logs) => {
  const arr = Array.isArray(logs) ? logs : [];
  return arr.map((t, idx) => {
    const id         = t?.id ?? `t-seed-${idx}`;
    const rawPurpose = t?.purpose ?? 'Business';
    const purpose    = PURPOSES.includes(rawPurpose)
      ? rawPurpose
      : /personal/i.test(String(rawPurpose)) ? 'Personal' : 'Business';
    const destination = t?.destination ?? t?.to    ?? '';
    const origin      = t?.origin      ?? t?.from  ?? 'Home';
    const miles       = typeof t?.miles === 'number' ? t.miles : (parseFloat(t?.miles) || 0);
    return {
      id:            String(id),
      date:          t?.date        ?? new Date().toISOString().split('T')[0],
      start:         t?.start       ?? t?.startTime ?? '',
      end:           t?.end         ?? '',
      origin,
      destination,
      miles,
      purpose,
      linkedJobId:   t?.linkedJobId   ?? null,
      linkedJobLabel:t?.linkedJobLabel ?? '',
      notes:         t?.notes        ?? (PURPOSES.includes(rawPurpose) ? '' : String(rawPurpose ?? '')),
      verified:      typeof t?.verified === 'boolean' ? t.verified : true,
    };
  });
};

// ─── LIVE TRIP TIMER ────────────────────────────────────────────────────────────
function useTripTimer(active) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (active) {
      ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(ref.current);
      setElapsed(0);
    }
    return () => clearInterval(ref.current);
  }, [active]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return { display: `${m}:${String(s).padStart(2, '0')}`, minutes: m };
}

// ─── MODALS ─────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-2xl border border-white/10 bg-[#0e1b2e] shadow-2xl shadow-black/60 overflow-hidden`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <h3 className="font-black text-white text-base">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/8 hover:text-white transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function FInput({ label, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
      />
    </div>
  );
}

function FSelect({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#0e1b2e] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none transition-all"
      >
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

// ─── TRIP FORM (Add / Edit) ──────────────────────────────────────────────────────
function TripForm({ initial, onSave, onCancel, appointments }) {
  const appts = appointments?.length ? appointments : FALLBACK_APPOINTMENTS;
  const [form, setForm] = useState(initial || {
    date: new Date().toISOString().split('T')[0],
    start: '', end: '', origin: 'Home', destination: '',
    miles: '', purpose: 'Business', linkedJobId: '', linkedJobLabel: '', notes: '',
  });
  const set   = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.destination && parseFloat(form.miles) > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FInput label="Date"    type="date" value={form.date}    onChange={set('date')} />
        <FSelect label="Purpose" value={form.purpose} onChange={set('purpose')} options={PURPOSES} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FInput label="Start Time" type="time" value={form.start} onChange={set('start')} />
        <FInput label="End Time"   type="time" value={form.end}   onChange={set('end')} />
      </div>
      <FInput label="Origin"      value={form.origin}      onChange={set('origin')}      placeholder="e.g. Home, Office…" />
      <FInput label="Destination" value={form.destination} onChange={set('destination')} placeholder="e.g. Title Company, Client's address…" />
      <FInput label="Miles"       type="number" value={form.miles} onChange={set('miles')} placeholder="0.0" />
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Attach to Appointment</label>
        <select
          value={form.linkedJobId || ''}
          onChange={e => {
            const appt = appts.find(a => String(a.id) === String(e.target.value));
            setForm(f => ({ ...f, linkedJobId: e.target.value, linkedJobLabel: appt?.label ?? '' }));
          }}
          className="w-full rounded-xl border border-white/10 bg-[#0e1b2e] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none transition-all"
        >
          <option value="">— None —</option>
          {appts.map(a => <option key={a.id} value={String(a.id)}>{a.label}</option>)}
        </select>
      </div>
      <FInput label="Notes (optional)" value={form.notes} onChange={set('notes')} placeholder="Extra context…" />
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-all">Cancel</button>
        <button disabled={!valid} onClick={() => onSave(form)}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-40 hover:brightness-110 transition-all">
          Save Trip
        </button>
      </div>
    </div>
  );
}

// ─── STOP TRIP MODAL ─────────────────────────────────────────────────────────────
// Shown when user taps "Stop Trip" — lets them confirm/enter actual miles,
// verify destination, and optionally link to an appointment.
function StopTripModal({ liveTrip, elapsed, appointments, onConfirm, onCancel }) {
  const appts = appointments?.length ? appointments : FALLBACK_APPOINTMENTS;
  const [miles, setMiles]   = useState('');
  const [dest,  setDest]    = useState(liveTrip?.destination || '');
  const [purpose, setPurpose] = useState(liveTrip?.purpose || 'Business');
  const [notes, setNotes]   = useState('');
  const [linkedJobId, setLinkedJobId] = useState(liveTrip?.linkedJobId || '');
  const [linkedJobLabel, setLinkedJobLabel] = useState(liveTrip?.linkedJobLabel || '');

  const valid = dest.trim() && parseFloat(miles) > 0;

  return (
    <Modal open onClose={onCancel} title="End Trip — Confirm Details">
      <div className="space-y-4">
        {/* Summary banner */}
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] px-4 py-3 flex items-center gap-3">
          <Navigation className="h-5 w-5 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Trip duration</p>
            <p className="font-black text-white text-lg">{elapsed}</p>
          </div>
          <div className="min-w-0 ml-auto text-right">
            <p className="text-xs text-slate-400">Started from</p>
            <p className="text-sm font-semibold text-white truncate">{liveTrip?.origin || 'Home'}</p>
          </div>
        </div>

        <FInput
          label="Destination *"
          value={dest}
          onChange={setDest}
          placeholder="Client address, Title company…"
        />

        <FInput
          label="Miles Driven *"
          type="number"
          value={miles}
          onChange={setMiles}
          placeholder="Enter odometer difference or estimated miles"
        />
        <p className="text-xs text-slate-600 -mt-2">
          Tip: check your odometer for IRS-quality records. GPS auto-capture coming soon.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <FSelect label="Purpose" value={purpose} onChange={setPurpose} options={PURPOSES} />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Attach to Appointment (optional)</label>
          <select
            value={linkedJobId}
            onChange={e => {
              const appt = appts.find(a => String(a.id) === String(e.target.value));
              setLinkedJobId(e.target.value);
              setLinkedJobLabel(appt?.label ?? '');
            }}
            className="w-full rounded-xl border border-white/10 bg-[#0e1b2e] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none transition-all"
          >
            <option value="">— None —</option>
            {appts.map(a => <option key={a.id} value={String(a.id)}>{a.label}</option>)}
          </select>
        </div>

        <FInput label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Client name, job type…" />

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onCancel} className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-all">
            Keep Tracking
          </button>
          <button
            disabled={!valid}
            onClick={() => onConfirm({ destination: dest, miles: parseFloat(miles), purpose, notes, linkedJobId: linkedJobId || null, linkedJobLabel })}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 disabled:opacity-40 hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Square className="h-4 w-4 fill-white" /> Save Trip
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── SPLIT TRIP MODAL ─────────────────────────────────────────────────────────────
function SplitModal({ trip, onSave, onClose }) {
  const total = parseFloat(trip.miles) || 0;
  const [ratio, setRatio]       = useState(50);
  const [purpose1, setPurpose1] = useState(trip.purpose);
  const [purpose2, setPurpose2] = useState('Personal');

  const miles1 = useMemo(() => Math.round((total * (ratio / 100)) * 10) / 10, [total, ratio]);
  const miles2 = useMemo(() => Math.round((total - miles1)         * 10) / 10, [total, miles1]);

  const clamp = (n, mn, mx) => Math.min(mx, Math.max(mn, n));

  const setMiles1Input = (v) => {
    const n = clamp(parseFloat(v) || 0, 0, total);
    setRatio(clamp(total ? (n / total) * 100 : 0, 0, 100));
  };
  const setMiles2Input = (v) => {
    const n = clamp(parseFloat(v) || 0, 0, total);
    setRatio(clamp(total ? ((total - n) / total) * 100 : 0, 0, 100));
  };

  return (
    <Modal open onClose={onClose} title="Split Trip" wide>
      <div className="space-y-5">
        <p className="text-sm text-slate-400">
          Drag to split <strong className="text-white">{total.toFixed(1)} mi</strong> from{' '}
          <strong className="text-white">{trip.origin} → {trip.destination}</strong> into two segments.
        </p>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Split ratio</span>
            <span className="text-xs font-bold text-white">{ratio.toFixed(0)}% / {(100 - ratio).toFixed(0)}%</span>
          </div>
          <input type="range" min={0} max={100} value={ratio}
            onChange={(e) => setRatio(parseFloat(e.target.value))}
            className="w-full accent-cyan-400" />
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
              <span className="font-bold text-cyan-300">Trip A</span>
              <span className="font-black text-white">{miles1.toFixed(1)} mi</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-500/20 bg-slate-500/5 px-3 py-2">
              <span className="font-bold text-slate-300">Trip B</span>
              <span className="font-black text-white">{miles2.toFixed(1)} mi</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cyan-400">Trip A</p>
          <div className="grid grid-cols-2 gap-3">
            <FInput label="Miles" type="number" value={miles1} onChange={setMiles1Input} />
            <FSelect label="Purpose" value={purpose1} onChange={setPurpose1} options={PURPOSES} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Trip B</p>
          <div className="grid grid-cols-2 gap-3">
            <FInput label="Miles" type="number" value={miles2} onChange={setMiles2Input} />
            <FSelect label="Purpose" value={purpose2} onChange={setPurpose2} options={PURPOSES} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-all">Cancel</button>
          <button disabled={!total} onClick={() => onSave({ miles1, purpose1, miles2, purpose2 })}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-40 hover:brightness-110 transition-all">
            Split Trip
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── EXPORT MODAL ─────────────────────────────────────────────────────────────────
function ExportModal({ trips, onClose }) {
  const [scope,   setScope]   = useState('ytd');
  const [purpose, setPurpose] = useState('All');
  const [copied,  setCopied]  = useState(false);

  const verifiedTrips  = trips.filter(t => t.verified);
  const businessTrips  = verifiedTrips.filter(t => t.purpose === 'Business');
  const totalMiles     = businessTrips.reduce((s, t) => s + parseFloat(t.miles || 0), 0);
  const deduction      = totalMiles * IRS_RATE_2025;

  const csvHeader = [
    'Date','Start','End','Origin','Destination','Miles',
    'Purpose Category','Business Purpose','Linked Appointment','Verified','Notes',
  ].join(',');

  const filteredTrips = trips
    .filter(t => purpose === 'All' || t.purpose === purpose)
    .map(t => ({ ...t, businessPurpose: t.purpose === 'Business' ? (t.linkedJobLabel || t.notes || 'Business travel') : '' }));

  const csvContent = [
    csvHeader,
    ...filteredTrips.map(t => ([
      csvEscape(t.date), csvEscape(t.start), csvEscape(t.end),
      csvEscape(t.origin), csvEscape(t.destination),
      csvEscape(parseFloat(t.miles || 0).toFixed(1)),
      csvEscape(t.purpose), csvEscape(t.businessPurpose),
      csvEscape(t.linkedJobLabel || ''),
      csvEscape(t.verified ? 'true' : 'false'),
      csvEscape(t.notes || ''),
    ].join(','))),
  ].join('\n');

  const downloadCSV = () => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `NotaryOS-Mileage-${scope}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const rows = filteredTrips.map(t => `
      <tr>
        <td>${t.date}</td>
        <td>${t.start || '—'} – ${t.end || '—'}</td>
        <td>${t.origin}</td>
        <td>${t.destination}</td>
        <td style="text-align:right">${parseFloat(t.miles || 0).toFixed(1)}</td>
        <td>${t.purpose}</td>
        <td>${t.purpose === 'Business' ? (t.linkedJobLabel || t.notes || 'Business travel') : ''}</td>
        <td style="text-align:center">${t.verified ? '✓' : '⚠'}</td>
      </tr>`).join('');

    const html = `
<!DOCTYPE html><html><head><title>NotaryOS Mileage Log</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 20px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .sub { color: #555; font-size: 12px; margin-bottom: 20px; }
  .summary { display: flex; gap: 40px; background: #f4f4f4; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; }
  .stat-label { font-size: 10px; color: #777; text-transform: uppercase; }
  .stat-value { font-size: 20px; font-weight: 900; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1a2c4a; color: white; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #fafafa; }
  tfoot td { font-weight: bold; background: #f4f4f4; border-top: 2px solid #1a2c4a; }
  .note { margin-top: 20px; font-size: 10px; color: #777; font-style: italic; }
</style></head><body>
<h1>NotaryOS — Mileage Log (IRS Pub. 463)</h1>
<div class="sub">Exported ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
<div class="summary">
  <div><div class="stat-label">Business Miles</div><div class="stat-value">${totalMiles.toFixed(1)}</div></div>
  <div><div class="stat-label">IRS Rate 2025</div><div class="stat-value">$${IRS_RATE_2025}</div></div>
  <div><div class="stat-label">Est. Deduction</div><div class="stat-value">$${deduction.toFixed(2)}</div></div>
</div>
<table>
  <thead><tr>
    <th>Date</th><th>Time</th><th>From</th><th>To</th>
    <th>Miles</th><th>Purpose</th><th>Business Purpose</th><th>Verified</th>
  </tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr>
    <td colspan="4">Total</td>
    <td style="text-align:right">${filteredTrips.reduce((s,t)=>s+parseFloat(t.miles||0),0).toFixed(1)}</td>
    <td colspan="3"></td>
  </tr></tfoot>
</table>
<p class="note">Generated by NotaryOS · Records meet IRS Publication 463 substantiation requirements.</p>
</body></html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const copyCSV = () => {
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open onClose={onClose} title="Export Mileage Log" wide>
      <div className="space-y-5">
        {/* Deduction summary */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Deduction-ready (verified only)</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 mb-1">Business Miles</p>
              <p className="text-2xl font-black text-white">{totalMiles.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">IRS Rate (2025)</p>
              <p className="text-2xl font-black text-white">$0.67</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Est. Deduction</p>
              <p className="text-2xl font-black text-emerald-400">${deduction.toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Trips marked <span className="text-amber-400 font-semibold">Needs review</span> are exported but excluded from the deduction totals until verified.
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          <FSelect label="Scope" value={scope} onChange={setScope} options={[
            { value: 'ytd', label: 'Year to Date' },
            { value: 'q1',  label: 'Q1 2025'      },
            { value: 'q4',  label: 'Q4 2024'      },
            { value: 'all', label: 'All Time'      },
          ]} />
          <FSelect
            label="Purpose Filter"
            value={purpose}
            onChange={setPurpose}
            options={[{ value: 'All', label: 'All Purposes' }, ...PURPOSES.map(p => ({ value: p, label: p }))]}
          />
        </div>

        {/* CSV Preview */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Preview (IRS Pub 463 fields)</p>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-white/8 bg-[#070f1c] p-4 font-mono text-xs text-slate-400 leading-relaxed">
            {csvContent.split('\n').slice(0, 8).map((row, i) => (
              <div key={i} className={i === 0 ? 'text-cyan-400 font-bold mb-1' : ''}>{row}</div>
            ))}
            {csvContent.split('\n').length > 8 && <div className="text-slate-600 mt-1">…{csvContent.split('\n').length - 8} more rows</div>}
          </div>
        </div>

        <div className="flex justify-end gap-3 flex-wrap">
          <button onClick={copyCSV}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-all">
            {copied ? <><Check className="h-4 w-4 text-emerald-400" /> Copied!</> : <><FileText className="h-4 w-4" /> Copy CSV</>}
          </button>
          <button onClick={printReport}
            className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 transition-all">
            <Printer className="h-4 w-4" /> PDF / Print
          </button>
          <button onClick={downloadCSV}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all">
            <Download className="h-4 w-4" /> Download CSV
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── TRIP ROW ────────────────────────────────────────────────────────────────────
function TripRow({ trip, onEdit, onDelete, onSplit, onLinkJob, onVerify, onDuplicate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pc        = PURPOSE_COLORS[trip.purpose] || PURPOSE_COLORS.Personal;
  const deduction = (trip.purpose === 'Business' && trip.verified) ? parseFloat(trip.miles) * IRS_RATE_2025 : 0;

  return (
    <div className={`group relative rounded-2xl border ${trip.verified ? 'border-white/[0.07]' : 'border-amber-500/30'} bg-white/[0.025] transition-all hover:bg-white/[0.04] hover:border-white/12`}>
      {!trip.verified && (
        <div className="absolute -top-2 right-4 flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
          <AlertCircle className="h-3 w-3" /> Needs review
        </div>
      )}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Purpose icon */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${pc.bg}`}>
          <Car className={`h-5 w-5 ${pc.text}`} />
        </div>

        {/* Route */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-white truncate">{trip.destination}</span>
            {trip.linkedJobLabel && (
              <span className="shrink-0 flex items-center gap-1 rounded-full border border-violet-400/25 bg-violet-400/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                <Link2 className="h-3 w-3" />{trip.linkedJobLabel.split('—')[0].trim()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{trip.origin}</span>
            <span>→</span>
            <span>{trip.destination}</span>
            {trip.start && <><span>·</span><span>{trip.start}{trip.end ? ` – ${trip.end}` : ''}</span></>}
            {trip.notes && <><span>·</span><span className="italic truncate max-w-[120px]">{trip.notes}</span></>}
          </div>
        </div>

        {/* Date */}
        <div className="hidden sm:block text-xs text-slate-500 shrink-0 w-20 text-right">
          {shortDate(trip.date)}
        </div>

        {/* Purpose badge */}
        <div className={`hidden md:flex shrink-0 items-center gap-1.5 rounded-full border ${pc.border} ${pc.bg} px-3 py-1 text-xs font-bold ${pc.text}`}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: pc.dot }} />
          {trip.purpose}
        </div>

        {/* Miles + deduction */}
        <div className="shrink-0 text-right">
          <p className="text-base font-black text-white">{parseFloat(trip.miles).toFixed(1)} <span className="text-xs font-medium text-slate-500">mi</span></p>
          {deduction > 0 && <p className="text-xs text-emerald-400 font-semibold">{fmtCurrency(deduction)}</p>}
        </div>

        {/* Context menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(m => !m)}
            className="rounded-lg p-1.5 text-slate-600 opacity-0 group-hover:opacity-100 hover:bg-white/8 hover:text-white transition-all"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-white/10 bg-[#0e1b2e] shadow-2xl py-1"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {[
                { icon: Pencil,    label: 'Edit',                         action: onEdit      },
                { icon: Copy,      label: 'Duplicate',                    action: onDuplicate },
                { icon: Split,     label: 'Split trip',                   action: onSplit     },
                { icon: Link2,     label: 'Attach to job',                action: onLinkJob   },
                { icon: Check,     label: trip.verified ? 'Mark unverified' : 'Mark verified', action: onVerify },
                { icon: Trash2,    label: 'Delete',                       action: onDelete,   danger: true },
              ].map(item => (
                <button key={item.label} onClick={() => { item.action(); setMenuOpen(false); }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-white/5 ${item.danger ? 'text-rose-400' : 'text-slate-300'}`}>
                  <item.icon className="h-3.5 w-3.5" />{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SUMMARY STAT CARD ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className={`rounded-2xl border ${accent} p-5`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-slate-600" />}
      </div>
      <p className="text-3xl font-black text-white leading-none">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── LIVE TRIP BANNER (one-tap start/stop) ─────────────────────────────────────────
function LiveTripBanner({ active, trip, elapsed, reminderActive, onReminderDismiss, onStop, onStart, appointments }) {
  const appts = appointments?.length ? appointments : FALLBACK_APPOINTMENTS;
  const [startModal, setStartModal] = useState(false);
  const [newTrip, setNewTrip] = useState({ origin: 'Home', destination: '', purpose: 'Business', linkedJobId: '', linkedJobLabel: '' });

  if (active) {
    return (
      <div className="space-y-3">
        {/* Auto-end reminder banner */}
        {reminderActive && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/[0.07] px-5 py-3">
            <Bell className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-300">Still driving?</p>
              <p className="text-xs text-slate-400">Your trip has been active for over {REMINDER_MIN} minutes.</p>
            </div>
            <button
              onClick={onReminderDismiss}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
            >
              Yes, keep going
            </button>
            <button
              onClick={onStop}
              className="rounded-xl bg-rose-500/90 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-all"
            >
              End trip
            </button>
          </div>
        )}

        {/* Active trip card */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/10 via-blue-500/8 to-transparent p-5">
          <div className="absolute top-5 right-5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
            </span>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-cyan-400/30">
              <Navigation className="h-7 w-7 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Trip in progress</span>
              </div>
              <p className="text-base font-black text-white">{trip.origin} → {trip.destination || 'Destination not set'}</p>
              <p className="text-sm text-slate-400 mt-0.5">{trip.purpose} · started {trip.startTime}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-3xl font-black text-cyan-400 font-mono">{elapsed}</p>
              <p className="text-xs text-slate-500 mt-0.5">elapsed</p>
            </div>
            <button
              onClick={onStop}
              className="shrink-0 flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600 active:scale-95 transition-all"
            >
              <Square className="h-4 w-4 fill-white" /> Stop Trip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setStartModal(true)}
        className="group cursor-pointer rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/5"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 group-hover:border-cyan-400/40 group-hover:bg-cyan-400/10 transition-all">
            <Play className="h-6 w-6 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <div>
            <p className="font-bold text-white group-hover:text-cyan-100 transition-colors">Start a Trip</p>
            <p className="text-sm text-slate-500">One tap to begin tracking · No more NG + MileIQ/Everlance split.</p>
          </div>
          <div className="ml-auto">
            <div className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 group-hover:brightness-110 transition-all flex items-center gap-2">
              <Play className="h-4 w-4 fill-white" /> Start Trip
            </div>
          </div>
        </div>
      </div>

      {startModal && (
        <Modal open onClose={() => setStartModal(false)} title="Start New Trip">
          <div className="space-y-4">
            <p className="text-sm text-slate-400">No more NG + MileIQ/Everlance split.</p>
            <FInput label="From" value={newTrip.origin} onChange={v => setNewTrip(t => ({ ...t, origin: v }))} placeholder="Home, Office…" />
            <FInput label="To"   value={newTrip.destination} onChange={v => setNewTrip(t => ({ ...t, destination: v }))} placeholder="Client address, Title company…" />
            <FSelect label="Purpose" value={newTrip.purpose} onChange={v => setNewTrip(t => ({ ...t, purpose: v }))} options={PURPOSES} />
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Attach to appointment (optional)</label>
              <select
                value={newTrip.linkedJobId || ''}
                onChange={e => {
                  const appt = appts.find(a => String(a.id) === String(e.target.value));
                  setNewTrip(t => ({ ...t, linkedJobId: e.target.value, linkedJobLabel: appt?.label ?? '' }));
                }}
                className="w-full rounded-xl border border-white/10 bg-[#0e1b2e] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none transition-all"
              >
                <option value="">— None —</option>
                {appts.map(a => <option key={a.id} value={String(a.id)}>{a.label}</option>)}
              </select>
            </div>
            <button
              disabled={!newTrip.destination}
              onClick={() => { onStart(newTrip); setStartModal(false); }}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 disabled:opacity-40 hover:brightness-110 active:scale-[.98] transition-all flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4 fill-white" /> Begin Tracking
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── MONTHLY SUMMARY CHART ────────────────────────────────────────────────────────
function MonthlyChart({ trips }) {
  const months = useMemo(() => {
    const map = {};
    trips.forEach(t => {
      const key = t.date.substring(0, 7);
      if (!map[key]) map[key] = { business: 0, personal: 0 };
      if (t.purpose === 'Business') map[key].business += parseFloat(t.miles);
      else                          map[key].personal += parseFloat(t.miles);
    });
    return Object.entries(map).sort().slice(-6).map(([k, v]) => ({
      label:    new Date(k + '-01').toLocaleDateString('en-US', { month: 'short' }),
      business: v.business,
      personal: v.personal,
      total:    v.business + v.personal,
    }));
  }, [trips]);

  const max = Math.max(...months.map(m => m.total), 1);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Monthly Miles</p>
          <p className="text-lg font-black text-white">6-month trend</p>
        </div>
        <BarChart3 className="h-5 w-5 text-slate-600" />
      </div>
      <div className="flex items-end gap-2 h-32">
        {months.map((m) => (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex flex-col gap-0.5" style={{ height: `${(m.total / max) * 100}%`, minHeight: 4 }}>
              <div className="w-full rounded-t bg-cyan-500/70"    style={{ flex: m.business }} />
              <div className="w-full rounded-b bg-slate-600/50"   style={{ flex: m.personal }} />
            </div>
            <span className="text-[10px] text-slate-600 font-medium">{m.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-sm bg-cyan-500/70" />Business</div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-sm bg-slate-600/50" />Personal</div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────────
export default function Mileage() {
  const { data, addMileageLog, updateMileageLog, deleteMileageLog, setMileageLogs } = useData();

  // Seed demo data once on mount if empty
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    const logs = Array.isArray(data?.mileageLogs) ? data.mileageLogs : [];
    if (logs.length === 0 && typeof setMileageLogs === 'function') {
      setMileageLogs(SEED_TRIPS);
    }
    seededRef.current = true;
  }, [data?.mileageLogs, setMileageLogs]);

  const trips = useMemo(
    () => normalizeTrips(Array.isArray(data?.mileageLogs) && data.mileageLogs.length ? data.mileageLogs : SEED_TRIPS),
    [data?.mileageLogs]
  );

  // ── State ──────────────────────────────────────────────────────────────────────
  const [liveTrip,        setLiveTrip]        = useState(null);
  const [stopModalOpen,   setStopModalOpen]    = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [view,            setView]            = useState('log'); // 'log' | 'summary'
  const [search,          setSearch]          = useState('');
  const [filterPurpose,   setFilterPurpose]   = useState('All');
  const [filterMonth,     setFilterMonth]     = useState('All');
  const [sortBy,          setSortBy]          = useState('date-desc');
  const [editModal,       setEditModal]       = useState(null);
  const [splitModal,      setSplitModal]      = useState(null);
  const [exportModal,     setExportModal]     = useState(false);
  const [linkModal,       setLinkModal]       = useState(null);
  const [selectedAppt,    setSelectedAppt]    = useState('');

  const { display: elapsedDisplay, minutes: elapsedMinutes } = useTripTimer(!!liveTrip);

  // Auto-end reminder: fires after REMINDER_MIN minutes, can be dismissed once
  const reminderActive = !!liveTrip && elapsedMinutes >= REMINDER_MIN && !reminderDismissed;

  // ── Appointment options ────────────────────────────────────────────────────────
  const appointmentOptions = useMemo(() => {
    const apts = Array.isArray(data?.appointments) ? data.appointments : [];
    const opts = apts.map(a => {
      const datePart = a?.date ? ` (${new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})` : '';
      return { id: String(a.id), label: `${a.type} — ${a.client}${datePart}`.trim() };
    });
    return opts.length ? opts : FALLBACK_APPOINTMENTS.map(a => ({ id: String(a.id), label: a.label }));
  }, [data?.appointments]);

  // ── Computed stats ─────────────────────────────────────────────────────────────
  const now         = new Date();
  const yearPrefix  = String(now.getFullYear());
  const monthPrefix = `${yearPrefix}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const verifiedTrips          = trips.filter(t => t.verified);
  const ytdTrips               = verifiedTrips.filter(t => t.date.startsWith(yearPrefix));
  const mtdTrips               = verifiedTrips.filter(t => t.date.startsWith(monthPrefix));

  const businessYTD            = ytdTrips.filter(t => t.purpose === 'Business').reduce((s, t) => s + parseFloat(t.miles), 0);
  const allYTD                 = ytdTrips.reduce((s, t) => s + parseFloat(t.miles), 0);
  const deductionYTD           = businessYTD * IRS_RATE_2025;
  const businessMTD            = mtdTrips.filter(t => t.purpose === 'Business').reduce((s, t) => s + parseFloat(t.miles), 0);
  const unverified             = trips.filter(t => !t.verified).length;
  const pendingBusinessMilesYTD = trips
    .filter(t => !t.verified && t.purpose === 'Business' && t.date.startsWith(yearPrefix))
    .reduce((s, t) => s + parseFloat(t.miles), 0);

  // ── Filtered + sorted trips ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...trips];
    if (search)          list = list.filter(t =>
      t.destination.toLowerCase().includes(search.toLowerCase()) ||
      t.origin.toLowerCase().includes(search.toLowerCase()) ||
      (t.linkedJobLabel || '').toLowerCase().includes(search.toLowerCase())
    );
    if (filterPurpose !== 'All') list = list.filter(t => t.purpose === filterPurpose);
    if (filterMonth   !== 'All') list = list.filter(t => t.date.startsWith(filterMonth));
    list.sort((a, b) => {
      if (sortBy === 'date-desc')  return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc')   return a.date.localeCompare(b.date);
      if (sortBy === 'miles-desc') return parseFloat(b.miles) - parseFloat(a.miles);
      if (sortBy === 'miles-asc')  return parseFloat(a.miles) - parseFloat(b.miles);
      return 0;
    });
    return list;
  }, [trips, search, filterPurpose, filterMonth, sortBy]);

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(t => { if (!map[t.date]) map[t.date] = []; map[t.date].push(t); });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Unique months for filter dropdown
  const months = useMemo(() => {
    const set = new Set(trips.map(t => t.date.substring(0, 7)));
    return Array.from(set).sort().reverse();
  }, [trips]);

  // ── Trip CRUD ──────────────────────────────────────────────────────────────────
  const saveTrip = useCallback((form, id) => {
    const normalized = { ...form, miles: parseFloat(form.miles || 0) || 0 };
    if (id) {
      updateMileageLog(id, { ...normalized, verified: true });
    } else {
      addMileageLog({ ...normalized, id: `t${Date.now()}`, verified: true });
    }
    setEditModal(null);
  }, [addMileageLog, updateMileageLog]);

  const deleteTrip = useCallback((id) => {
    if (confirm('Delete this trip?')) deleteMileageLog(id);
  }, [deleteMileageLog]);

  const duplicateTrip = useCallback((trip) => {
    addMileageLog({
      ...trip,
      id:       `t${Date.now()}`,
      date:     new Date().toISOString().split('T')[0],
      verified: false,
      notes:    `${trip.notes ? trip.notes + ' ' : ''}(duplicate)`,
    });
  }, [addMileageLog]);

  const splitTrip = useCallback((original, { miles1, purpose1, miles2, purpose2 }) => {
    deleteMileageLog(original.id);
    const base = { ...original, verified: true };
    addMileageLog({ ...base, id: `t${Date.now()}b`, miles: miles2, purpose: purpose2, notes: `${original.notes || ''} (split B)`.trim() });
    addMileageLog({ ...base, id: `t${Date.now()}a`, miles: miles1, purpose: purpose1, notes: `${original.notes || ''} (split A)`.trim() });
    setSplitModal(null);
  }, [addMileageLog, deleteMileageLog]);

  const toggleVerify = useCallback((trip) => {
    updateMileageLog(trip.id, { verified: !trip.verified });
  }, [updateMileageLog]);

  const attachJob = useCallback((tripId, apptId) => {
    const appt = appointmentOptions.find(a => String(a.id) === String(apptId));
    updateMileageLog(tripId, { linkedJobId: apptId || null, linkedJobLabel: appt?.label ?? '' });
    setLinkModal(null);
  }, [appointmentOptions, updateMileageLog]);

  // ── Live trip ──────────────────────────────────────────────────────────────────
  const startTrip = useCallback((info) => {
    setReminderDismissed(false);
    setLiveTrip({
      ...info,
      startTime: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    });
  }, []);

  // Tapping "Stop" opens the confirmation modal
  const requestStopTrip = useCallback(() => {
    setStopModalOpen(true);
  }, []);

  // Confirm stop: save the trip with real miles entered by user
  const confirmStopTrip = useCallback((details) => {
    if (!liveTrip) return;
    addMileageLog({
      id:             `t${Date.now()}`,
      date:           new Date().toISOString().split('T')[0],
      start:          liveTrip.startTime,
      end:            new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      origin:         liveTrip.origin,
      destination:    details.destination,
      miles:          details.miles,
      purpose:        details.purpose,
      linkedJobId:    details.linkedJobId,
      linkedJobLabel: details.linkedJobLabel,
      notes:          details.notes,
      verified:       false, // always starts unverified — user can mark after review
    });
    setLiveTrip(null);
    setStopModalOpen(false);
    setReminderDismissed(false);
  }, [addMileageLog, liveTrip]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: '#060d1b' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/15">
              <Car className="h-4 w-4 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-black text-white">Mileage Tracker</h1>
            {unverified > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                <AlertCircle className="h-3 w-3" />{unverified} to review
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">All-in-one mileage log · IRS-ready exports · No more NG + MileIQ/Everlance split.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setExportModal(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-all">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => setEditModal('new')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all">
            <Plus className="h-4 w-4" /> Log Trip
          </button>
        </div>
      </div>

      {/* ── LIVE TRIP BANNER ────────────────────────────────────────────────── */}
      <LiveTripBanner
        active={!!liveTrip}
        trip={liveTrip}
        elapsed={elapsedDisplay}
        reminderActive={reminderActive}
        onReminderDismiss={() => setReminderDismissed(true)}
        onStart={startTrip}
        onStop={requestStopTrip}
        appointments={appointmentOptions}
      />

      {/* ── KPI CARDS ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Business YTD" value={`${businessYTD.toFixed(0)} mi`}
          sub={pendingBusinessMilesYTD > 0 ? `+${pendingBusinessMilesYTD.toFixed(1)} mi pending review` : `${allYTD.toFixed(0)} mi verified total`}
          accent="border-cyan-500/20 bg-cyan-500/[0.04]"
          icon={TrendingUp}
        />
        <StatCard
          label="Est. Deduction" value={`$${deductionYTD.toFixed(0)}`}
          sub={`@ $${IRS_RATE_2025}/mi IRS 2025`}
          accent="border-emerald-500/20 bg-emerald-500/[0.04]"
          icon={DollarSign}
        />
        <StatCard
          label="This Month" value={`${businessMTD.toFixed(0)} mi`}
          sub={`${mtdTrips.length} trips logged`}
          accent="border-violet-500/20 bg-violet-500/[0.04]"
          icon={Calendar}
        />
        <StatCard
          label="Total Trips" value={trips.length}
          sub={`${unverified} need review`}
          accent={unverified > 0 ? 'border-amber-500/20 bg-amber-500/[0.04]' : 'border-white/[0.07] bg-white/[0.025]'}
          icon={Target}
        />
      </div>

      {/* ── VIEW TABS ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1 w-fit">
        {[{ id: 'log', label: 'Trip Log' }, { id: 'summary', label: 'Summary' }].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            className={`rounded-lg px-5 py-2 text-sm font-bold transition-all ${view === tab.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'log' ? (
        <>
          {/* ── FILTERS ─────────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search trips…"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/40 focus:outline-none transition-all" />
            </div>
            <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0a1525] px-3 py-2.5 text-sm text-white focus:border-cyan-500/40 focus:outline-none transition-all">
              <option value="All">All purposes</option>
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0a1525] px-3 py-2.5 text-sm text-white focus:border-cyan-500/40 focus:outline-none transition-all">
              <option value="All">All months</option>
              {months.map(m => <option key={m} value={m}>{monthName(m + '-01')}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0a1525] px-3 py-2.5 text-sm text-white focus:border-cyan-500/40 focus:outline-none transition-all">
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="miles-desc">Most miles</option>
              <option value="miles-asc">Fewest miles</option>
            </select>
          </div>

          {/* ── TRIP LIST ─────────────────────────────────────────────── */}
          {grouped.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center">
              <Car className="mx-auto h-10 w-10 text-slate-700 mb-3" />
              <p className="font-bold text-slate-500">No trips found</p>
              <p className="text-sm text-slate-600 mt-1">Start a trip or log one manually.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map(([date, dayTrips]) => {
                const dayMiles     = dayTrips.reduce((s, t) => s + parseFloat(t.miles), 0);
                const dayDeduction = dayTrips
                  .filter(t => t.purpose === 'Business' && t.verified)
                  .reduce((s, t) => s + parseFloat(t.miles) * IRS_RATE_2025, 0);
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-black text-white">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{dayMiles.toFixed(1)} mi total</span>
                        {dayDeduction > 0 && <span className="text-emerald-400 font-semibold">{fmtCurrency(dayDeduction)} deductible</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {dayTrips.map(trip => (
                        <TripRow
                          key={trip.id}
                          trip={trip}
                          onEdit={()      => setEditModal(trip)}
                          onDelete={()    => deleteTrip(trip.id)}
                          onSplit={()     => setSplitModal(trip)}
                          onLinkJob={()   => { setLinkModal(trip); setSelectedAppt(trip.linkedJobId || ''); }}
                          onVerify={()    => toggleVerify(trip)}
                          onDuplicate={()  => duplicateTrip(trip)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ── SUMMARY VIEW ───────────────────────────────────────────────── */
        <div className="space-y-6">
          <MonthlyChart trips={verifiedTrips} />

          {/* By purpose */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">YTD by Purpose</p>
            <div className="space-y-3">
              {PURPOSES.map(p => {
                const miles = ytdTrips.filter(t => t.purpose === p).reduce((s, t) => s + parseFloat(t.miles), 0);
                const pct   = allYTD > 0 ? (miles / allYTD) * 100 : 0;
                const pc    = PURPOSE_COLORS[p];
                return (
                  <div key={p}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className={`font-semibold ${pc.text}`}>{p}</span>
                      <span className="text-slate-400">{miles.toFixed(1)} mi · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pc.dot }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Month-by-month table */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Month-by-Month</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Month','Business','Personal','Total','Deduction'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map(month => {
                  const mTrips   = trips.filter(t => t.verified && t.date.startsWith(month));
                  const biz      = mTrips.filter(t => t.purpose === 'Business').reduce((s, t) => s + parseFloat(t.miles), 0);
                  const personal = mTrips.filter(t => t.purpose !== 'Business').reduce((s, t) => s + parseFloat(t.miles), 0);
                  const total    = biz + personal;
                  const ded      = biz * IRS_RATE_2025;
                  return (
                    <tr key={month} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-white">{monthName(month + '-01')}</td>
                      <td className="px-5 py-3.5 text-cyan-400 font-semibold">{biz.toFixed(1)} mi</td>
                      <td className="px-5 py-3.5 text-slate-400">{personal.toFixed(1)} mi</td>
                      <td className="px-5 py-3.5 text-white font-semibold">{total.toFixed(1)} mi</td>
                      <td className="px-5 py-3.5 text-emerald-400 font-bold">${ded.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 bg-white/[0.02]">
                  <td className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-400">YTD Total</td>
                  <td className="px-5 py-3.5 font-black text-cyan-400">{businessYTD.toFixed(1)} mi</td>
                  <td className="px-5 py-3.5 font-black text-slate-400">{(allYTD - businessYTD).toFixed(1)} mi</td>
                  <td className="px-5 py-3.5 font-black text-white">{allYTD.toFixed(1)} mi</td>
                  <td className="px-5 py-3.5 font-black text-emerald-400">${deductionYTD.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* IRS compliance note */}
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5 flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
              <Shield className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="font-bold text-white mb-1">IRS Audit-Ready</p>
              <p className="text-sm text-slate-400">
                NotaryOS logs origin, destination, business purpose, and timestamps for every trip —
                meeting IRS Publication 463 substantiation requirements. Export your log as CSV or
                print a formatted PDF report for your accountant or tax filing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}

      {/* Stop trip confirmation */}
      {stopModalOpen && liveTrip && (
        <StopTripModal
          liveTrip={liveTrip}
          elapsed={elapsedDisplay}
          appointments={appointmentOptions}
          onConfirm={confirmStopTrip}
          onCancel={() => setStopModalOpen(false)}
        />
      )}

      {/* Add / Edit trip */}
      {editModal && (
        <Modal open onClose={() => setEditModal(null)} title={editModal === 'new' ? 'Log New Trip' : 'Edit Trip'} wide>
          <TripForm
            initial={editModal !== 'new' ? editModal : null}
            onSave={(form) => saveTrip(form, editModal !== 'new' ? editModal.id : null)}
            onCancel={() => setEditModal(null)}
            appointments={appointmentOptions}
          />
        </Modal>
      )}

      {/* Split trip */}
      {splitModal && (
        <SplitModal
          trip={splitModal}
          onSave={(parts) => splitTrip(splitModal, parts)}
          onClose={() => setSplitModal(null)}
        />
      )}

      {/* Attach to appointment */}
      {linkModal && (
        <Modal open onClose={() => setLinkModal(null)} title="Attach to Appointment">
          <p className="mb-4 text-sm text-slate-400">
            Linking <strong className="text-white">{linkModal.destination}</strong> to a job lets you include
            mileage in job reports and auto-fill invoices.
          </p>
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Select Appointment</label>
            <select value={selectedAppt} onChange={e => setSelectedAppt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0e1b2e] px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none transition-all">
              <option value="">— None —</option>
              {appointmentOptions.map(a => <option key={a.id} value={String(a.id)}>{a.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setLinkModal(null)} className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-all">Cancel</button>
            <button onClick={() => attachJob(linkModal.id, selectedAppt)}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all">
              Attach
            </button>
          </div>
        </Modal>
      )}

      {/* Export */}
      {exportModal && <ExportModal trips={trips} onClose={() => setExportModal(false)} />}
    </div>
  );
}
