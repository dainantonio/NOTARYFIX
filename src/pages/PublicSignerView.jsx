import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, FileText, DollarSign, Phone, Mail, Shield, CheckCircle2 } from 'lucide-react';

const WHAT_TO_BRING = {
  'Loan Signing':     ['Government-issued photo ID', 'Any additional IDs if borrower is different from title', 'Checkbook for closing costs (if applicable)'],
  'I-9 Verification': ['List A document (passport or permanent resident card) OR List B + List C documents', 'Examples: US Passport, Driver\'s License + Social Security Card'],
  'Deed':             ['Government-issued photo ID', 'Any required co-signers must also be present'],
  'Affidavit':        ['Government-issued photo ID'],
  'RON (Remote Online)': ['Government-issued photo ID', 'Device with camera and microphone', 'Stable internet connection'],
  'default':          ['Government-issued photo ID', 'Any documents related to your appointment'],
};

export default function PublicSignerView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const apptData = useMemo(() => {
    try {
      const encoded = searchParams.get('d');
      if (encoded) return JSON.parse(atob(encoded));
    } catch {}
    return null;
  }, [searchParams]);

  if (!apptData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NotaryFix Portal</h1>
          <p className="text-slate-400">This link appears to be invalid or expired. Please contact your notary for a new link.</p>
        </div>
      </div>
    );
  }

  const { client, type, date, time, location, amount, notaryName, notaryPhone, notaryEmail, status = 'confirmed' } = apptData;
  const bringList = WHAT_TO_BRING[type] || WHAT_TO_BRING['default'];

  const statusColors = {
    confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    upcoming:  'bg-blue-500/15 text-blue-300 border-blue-500/30',
    completed: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-950 to-slate-950 px-6 py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider">NotaryFix</p>
              <p className="text-xs text-slate-400">Secure Signing Portal</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Hi {client?.split(' ')[0] || 'there'} 👋</h1>
          <p className="mt-1 text-slate-400 text-sm">Here are the details for your upcoming notary appointment.</p>
          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusColors[status] || statusColors.confirmed}`}>
            <CheckCircle2 className="w-3 h-3" /> {status === 'confirmed' ? 'Appointment Confirmed' : status}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
        {/* Appointment Details */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Appointment Details</p>
          </div>
          <div className="divide-y divide-white/8">
            {[
              { icon: FileText, label: 'Service',  val: type || 'Notary Appointment' },
              { icon: Calendar, label: 'Date',     val: date || '—' },
              { icon: Clock,    label: 'Time',     val: time || '—' },
              { icon: MapPin,   label: 'Location', val: location || '—' },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-medium text-white truncate">{val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What to Bring */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">What to Bring</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {bringList.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice */}
        {amount && (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-600/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Estimated Fee</p>
                  <p className="text-xl font-bold text-white">${Number(amount).toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Due at appointment</p>
            </div>
          </div>
        )}

        {/* Contact */}
        {(notaryName || notaryPhone || notaryEmail) && (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Notary</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {notaryName  && <p className="text-sm font-semibold text-white">{notaryName}</p>}
              {notaryPhone && (
                <a href={`tel:${notaryPhone}`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                  <Phone className="w-4 h-4" /> {notaryPhone}
                </a>
              )}
              {notaryEmail && (
                <a href={`mailto:${notaryEmail}`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                  <Mail className="w-4 h-4" /> {notaryEmail}
                </a>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 pb-6">Powered by NotaryFix · Secure &amp; Compliant</p>
      </div>
    </div>
  );
}
