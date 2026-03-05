// src/pages/PayInvoicePage.jsx
// FIX 3: Public payment landing page for /pay/:invoiceId links
// This page is accessible without login — it shows invoice details and
// a "Contact to pay" prompt. Can be upgraded later with a real payment gateway.
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { CheckCircle2, DollarSign, Calendar, ArrowLeft, Sparkles } from 'lucide-react';

export default function PayInvoicePage() {
  const { invoiceId } = useParams();
  const { data } = useData();

  // Look up invoice by id (handle URL encoding)
  const decodedId = decodeURIComponent(invoiceId || '');
  const invoice = (data?.invoices || []).find(
    (inv) => String(inv.id) === String(decodedId)
  );

  const businessName = data?.settings?.businessName || 'Your Notary';
  const businessPhone = data?.settings?.phone || '';
  const businessEmail = data?.settings?.email || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-blue-300 font-medium">{businessName}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {invoice ? (
            <>
              {/* Status banner */}
              <div className={`px-6 py-4 ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800'
                  : invoice.status === 'Overdue'
                    ? 'bg-rose-50 dark:bg-rose-900/20 border-b border-rose-200 dark:border-rose-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Invoice</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{invoice.id}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    invoice.status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/30 dark:text-emerald-400'
                      : invoice.status === 'Overdue'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-800/30 dark:text-rose-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-400'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>

              {/* Invoice details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Amount Due</span>
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ${Number(invoice.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Due Date</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {invoice.due || '—'}
                  </span>
                </div>

                {invoice.client && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Client</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{invoice.client}</span>
                  </div>
                )}

                {invoice.notes && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{invoice.notes}</p>
                  </div>
                )}

                {invoice.status === 'Paid' ? (
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Payment Received</p>
                      {invoice.paidAt && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Paid on {new Date(invoice.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                      To complete payment, please contact:
                    </p>
                    <div className="space-y-2">
                      {businessPhone && (
                        <a
                          href={`tel:${businessPhone}`}
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                        >
                          Call {businessPhone}
                        </a>
                      )}
                      {businessEmail && (
                        <a
                          href={`mailto:${businessEmail}?subject=Payment for Invoice ${invoice.id}&body=Hi, I'd like to pay invoice ${invoice.id} for $${invoice.amount}.`}
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          Email {businessEmail}
                        </a>
                      )}
                      {!businessPhone && !businessEmail && (
                        <p className="text-center text-sm text-slate-500 italic">
                          Contact your notary directly to arrange payment.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-slate-400" />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-slate-200">Invoice Not Found</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This invoice link may have expired or is no longer valid. Please contact your notary for a new link.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            <p className="text-xs text-center text-slate-400">
              Powered by <span className="font-semibold text-blue-500">NotaryFix</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
