// File: src/components/SignerConfirmationModal.jsx
// After saving an appointment, surfaces a pre-written signer confirmation
// message with one-tap copy / SMS / email.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, MessageSquare, Mail, Check } from 'lucide-react';
import { Button } from './UI';

// ── What-to-bring per appointment type ───────────────────────────────────────
const WHAT_TO_BRING = {
  'Loan Signing': [
    '✅ Valid government-issued photo ID (driver\'s license or passport)',
    '✅ Any secondary ID if your lender requested it',
    '✅ All co-signers/borrowers must be present with their own ID',
    '✅ Your checkbook if fees are owed at signing',
  ],
  'General Notary Work (GNW)': [
    '✅ Valid government-issued photo ID (driver\'s license or passport)',
    '✅ The document(s) you need notarized — do not sign them yet',
  ],
  'I-9 Verification': [
    '✅ List A document (U.S. Passport, Permanent Resident Card, etc.), OR',
    '✅ One List B document (photo ID) AND one List C document (Social Security card, birth certificate, etc.)',
    '✅ All documents must be originals — no photocopies accepted',
  ],
  'Apostille': [
    '✅ The original document requiring the apostille',
    '✅ Government-issued photo ID',
    '✅ Any translations if the document is not in English',
  ],
  'Remote Online Notary (RON)': [
    '✅ A computer, tablet, or phone with a working camera and microphone',
    '✅ Stable internet connection',
    '✅ Valid government-issued photo ID (held up to camera for verification)',
  ],
};

const DEFAULT_BRING = [
  '✅ Valid government-issued photo ID (driver\'s license or passport)',
  '✅ Any documents that need to be notarized — do not sign them ahead of time',
];

function getWhatToBring(type = '') {
  if (WHAT_TO_BRING[type]) return WHAT_TO_BRING[type];
  const lower = type.toLowerCase();
  if (lower.includes('loan'))     return WHAT_TO_BRING['Loan Signing'];
  if (lower.includes('i-9') || lower.includes('i9')) return WHAT_TO_BRING['I-9 Verification'];
  if (lower.includes('apostille')) return WHAT_TO_BRING['Apostille'];
  if (lower.includes('ron') || lower.includes('remote online')) return WHAT_TO_BRING['Remote Online Notary (RON)'];
  return DEFAULT_BRING;
}

// ── Date / time formatters ────────────────────────────────────────────────────
function formatDate(dateStr = '') {
  if (!dateStr) return 'TBD';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr = '') {
  if (!timeStr) return 'TBD';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── Main component ─────────────────────────────────────────────────────────────
const SignerConfirmationModal = ({ isOpen, onClose, appointment, notaryName }) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const message = useMemo(() => {
    if (!appointment) return '';
    const { client, type, date, time, address, location } = appointment;
    const displayName  = notaryName || 'Your Notary';
    const displayAddr  = address || location || 'the location provided';
    const bring        = getWhatToBring(type).join('\n');
    const displayDate  = formatDate(date);
    const displayTime  = formatTime(time);

    return [
      `Hi ${client || 'there'}! This is ${displayName}, your notary.`,
      '',
      `I'm confirming your upcoming appointment:`,
      `📅 Date: ${displayDate}`,
      `🕐 Time: ${displayTime}`,
      `📍 Location: ${displayAddr}`,
      `📋 Service: ${type || 'Notarization'}`,
      '',
      `What to bring:`,
      bring,
      '',
      `Please don't sign any documents before we meet — I'll guide you through everything at the signing.`,
      '',
      `Questions? Feel free to reply to this message. See you soon!`,
      `– ${displayName}`,
    ].join('\n');
  }, [appointment, notaryName]);

  const [editable, setEditable] = useState(message);
  useEffect(() => { setEditable(message); setCopied(false); }, [message]);

  if (!isOpen || !appointment) return null;

  const phone = appointment.phone?.replace(/\D/g, '');
  const email = appointment.email?.trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editable);
    } catch {
      // Fallback: select all text
      textareaRef.current?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSMS = () => {
    const encoded = encodeURIComponent(editable);
    if (phone) {
      window.open(`sms:+1${phone}?body=${encoded}`, '_blank');
    } else {
      window.open(`sms:?body=${encoded}`, '_blank');
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Your Notarization Appointment – ${formatDate(appointment.date)}`);
    const body    = encodeURIComponent(editable);
    window.open(`mailto:${email || ''}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-5 py-4 rounded-t-xl">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Send Signer Confirmation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pre-written for {appointment.client || 'signer'} · edit if needed
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <textarea
            ref={textareaRef}
            rows={16}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono leading-relaxed"
            value={editable}
            onChange={(e) => setEditable(e.target.value)}
          />

          {/* Contact chips */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {phone && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <MessageSquare className="h-3 w-3" />
                {appointment.phone}
              </span>
            )}
            {email && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-blue-700 dark:text-blue-400 font-medium">
                <Mail className="h-3 w-3" />
                {email}
              </span>
            )}
            {!phone && !email && (
              <span className="text-slate-400 italic">No contact info on file — copy and send manually.</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4 flex flex-wrap gap-2 justify-end rounded-b-xl bg-slate-50 dark:bg-slate-800/60">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Skip
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className={copied ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700' : ''}
          >
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {phone && (
            <Button size="sm" onClick={handleSMS} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <MessageSquare className="h-4 w-4 mr-1" />
              Open SMS
            </Button>
          )}
          {email && (
            <Button size="sm" onClick={handleEmail}>
              <Mail className="h-4 w-4 mr-1" />
              Open Email
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignerConfirmationModal;
