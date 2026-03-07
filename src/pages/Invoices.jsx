import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, X, DollarSign, CheckCircle2, Clock, AlertCircle, Wand2, ScanLine, Pencil, Trash2, Send, Link2, FileText, MessageSquare, Eye, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Label, Select } from '../components/UI';
import { useData } from '../context/DataContext';
import { toast } from '../hooks/useLinker';
import { exportInvoicePDF, generateInvoiceEmailTemplate } from '../services/invoiceService';
import { generatePaymentReminderMessage } from '../services/emailService';

const InvoiceModal = ({ isOpen, onClose, onSave, initialInvoice, prefillClientName }) => {
  const { data } = useData();
  const clientOptions = (data?.clients || []).map((c) => ({ label: c.name, value: c.name }));
  const [formData, setFormData] = useState({ client: '', amount: '', due: '', status: 'Draft', notes: '' });
  const [smartInput, setSmartInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialInvoice) {
      setFormData({
        client: initialInvoice.client || '',
        amount: String(initialInvoice.amount || ''),
        due: /^\d{4}-\d{2}-\d{2}$/.test(initialInvoice.due || '') ? initialInvoice.due : '',
        status: initialInvoice.status || 'Draft',
        notes: initialInvoice.notes || '',
      });
      return;
    }
      setFormData({ client: prefillClientName || clientOptions[0]?.value || '', amount: '', due: '', status: 'Draft', notes: '' });
  }, [isOpen, initialInvoice, clientOptions, prefillClientName]);

  if (!isOpen) return null;

  const applySmartFill = (text) => {
    const source = text.trim();
    if (!source) return;
    const amount = source.match(/\$?\s*(\d+(?:\.\d{1,2})?)/)?.[1] || '';
    const due = source.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '';
    const status = /paid/i.test(source) ? 'Paid' : /overdue/i.test(source) ? 'Overdue' : /sent/i.test(source) ? 'Sent' : /pending/i.test(source) ? 'Pending' : 'Draft';
    const matchedClient = clientOptions.find((opt) => source.toLowerCase().includes(opt.label.toLowerCase()));
    setFormData((prev) => ({ ...prev, amount: prev.amount || amount, due: prev.due || due, client: matchedClient?.value || prev.client, status }));
  };

  const handleReceiptScan = (file) => {
    if (!file) return;
    applySmartFill(file.name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, ''));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: initialInvoice?.id || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      client: formData.client || (clientOptions[0]?.value || 'Unknown'),
      amount: parseFloat(formData.amount) || 0,
      date: initialInvoice?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      due: formData.due,
      status: formData.status,
      notes: formData.notes || '',
      // FIX 2: preserve linkedAppointmentId from prefill so cross-linking works
      ...(initialInvoice?.linkedAppointmentId && { linkedAppointmentId: initialInvoice.linkedAppointmentId }),
    });
    setSmartInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="font-semibold text-slate-900 dark:text-white">{initialInvoice ? 'Edit Invoice' : 'Create Invoice'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Wand2 className="h-3.5 w-3.5" /> Smart Fill</div>
            <textarea value={smartInput} onChange={(e) => setSmartInput(e.target.value)} className="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="Paste invoice details (client, amount, due date, status)" />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => applySmartFill(smartInput)}><Wand2 className="mr-1 h-3.5 w-3.5" /> Apply Smart Fill</Button>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300">
                <ScanLine className="h-3.5 w-3.5" /> Scan receipt
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleReceiptScan(e.target.files?.[0])} />
              </label>
            </div>
          </div>

          <div>
            <Label>Select Client</Label>
            {clientOptions.length > 0 ? <Select options={clientOptions} value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} /> : <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">Please add a client first.</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Amount ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input required type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="pl-9" placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input required type="date" value={formData.due} onChange={(e) => setFormData({ ...formData, due: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={[{ label: 'Draft', value: 'Draft' }, { label: 'Pending', value: 'Pending' }, { label: 'Sent', value: 'Sent' }, { label: 'Overdue', value: 'Overdue' }, { label: 'Paid', value: 'Paid' }]} />
            </div>
          </div>



          <div>
            <Label>Notes / Breakdown (optional)</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Signing fee $125, Travel $35, Printing $20"
              className="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={clientOptions.length === 0}>{initialInvoice ? 'Save Changes' : 'Generate'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   InvoiceReviewModal — step 1 of the two-step Review & Send flow.
   Shows a read-only invoice preview + smart warnings before anything
   is dispatched. The real send only fires on "Confirm & Send".
───────────────────────────────────────────────────────────────── */
const InvoiceReviewModal = ({ invoice, onClose, onConfirmSend, onEditFirst, knownClientNames }) => {
  if (!invoice) return null;

  const amount = Number(invoice.amount || 0);
  const hasZeroAmount  = amount === 0;
  const hasMissingDue  = !invoice.due;
  const clientUnknown  = invoice.client && knownClientNames.length > 0
    ? !knownClientNames.some((n) => n.toLowerCase() === (invoice.client || '').toLowerCase())
    : false;

  const warnings = [
    hasZeroAmount  && { level: 'critical', text: 'Amount is $0 — verify the fee before sending.' },
    hasMissingDue  && { level: 'warn',     text: 'No due date set — the client won\'t know when payment is expected.' },
    clientUnknown  && { level: 'warn',     text: `"${invoice.client}" doesn't match any saved Client — check the name.` },
  ].filter(Boolean);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Review Invoice</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((w, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${
                  w.level === 'critical'
                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}>
                  <TriangleAlert className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>{w.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Invoice preview card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Invoice Preview</span>
              {invoice.id && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">#{String(invoice.id).slice(-6)}</span>}
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5">Bill To</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{invoice.client || <span className="italic text-slate-400">No client</span>}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5">Amount Due</p>
                  <p className={`text-lg font-bold ${hasZeroAmount ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmt(invoice.amount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5">Due Date</p>
                  <p className={`text-xs font-medium ${hasMissingDue ? 'text-amber-500 italic' : 'text-slate-700 dark:text-slate-300'}`}>
                    {hasMissingDue ? 'Not set' : fmtDate(invoice.due)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5">Status</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{invoice.status || 'Draft'}</p>
                </div>
              </div>
              {invoice.notes && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">Notes</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">{invoice.notes}</p>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">Payment Link</p>
                <p className="text-xs font-mono text-blue-500 truncate">{`${window.location.origin}/pay/${encodeURIComponent(invoice.id)}`}</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
            Confirming copies a branded email template to your clipboard and marks this invoice as <strong>Sent</strong>.
          </p>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            onClick={onEditFirst}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Edit First
          </button>
          <button
            onClick={onConfirmSend}
            disabled={hasZeroAmount}
            className={`flex-[2] rounded-xl px-4 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
              hasZeroAmount
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            title={hasZeroAmount ? 'Fix the $0 amount before sending' : undefined}
          >
            <Send className="h-3.5 w-3.5" />
            Confirm &amp; Send
          </button>
        </div>
      </div>
    </div>
  );
};

const Invoices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState([]);
  const [prefillClientName, setPrefillClientName] = useState('');
  const [reviewingInvoice, setReviewingInvoice] = useState(null);
  const { data, addInvoice, updateInvoice, deleteInvoice } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const invoices = data?.invoices || [];

  useEffect(() => {
    const incoming = location.state?.statusFilter;
    const prefillClient = location.state?.prefillClientName;
    const prefillAptId = location.state?.prefillFromAppointment;   // FIX 2
    const prefillInvData = location.state?.prefillInvoice;         // FIX 2
    const prefillSessionId = location.state?.prefillFromSession;   // FIX 2
    let shouldClearState = false;

    if (Array.isArray(incoming) && incoming.length > 0) {
      setStatusFilter(incoming.filter((x) => ['Draft', 'Pending', 'Sent', 'Overdue', 'Paid'].includes(x)));
      shouldClearState = true;
    }

    if (prefillClient) {
      setEditingInvoice(null);
      setPrefillClientName(prefillClient);
      setIsModalOpen(true);
      shouldClearState = true;
    }

    // FIX 2: prefillFromAppointment — look up appointment and prefill modal
    if (prefillAptId) {
      const apt = (data.appointments || []).find((a) => String(a.id) === String(prefillAptId));
      if (apt) {
        setEditingInvoice({
          linkedAppointmentId: apt.id,
          client: apt.client || '',
          amount: apt.amount || '',
          due: apt.date || '',
          status: 'Draft',
          notes: `Notary services — ${apt.type || 'appointment'} on ${apt.date || ''}.`,
        });
        setPrefillClientName('');
        setIsModalOpen(true);
        shouldClearState = true;
      }
    }

    // FIX 2: prefillInvoice — pre-populated from journal's afterJournalSave prompt
    if (prefillInvData && !prefillAptId) {
      setEditingInvoice({
        client: prefillInvData.client || '',
        amount: prefillInvData.amount || '',
        status: 'Draft',
        notes: prefillInvData.actType ? `Act type: ${prefillInvData.actType}` : '',
      });
      setPrefillClientName(prefillInvData.client || '');
      setIsModalOpen(true);
      shouldClearState = true;
    }

    // FIX 2: prefillFromSession — signer session complete prompt
    if (prefillSessionId && !prefillAptId) {
      const session = (data.signerSessions || []).find((s) => String(s.id) === String(prefillSessionId));
      if (session) {
        setEditingInvoice({
          client: session.clientName || session.title || '',
          amount: session.amount || '',
          status: 'Draft',
          notes: `Invoice for signing session: ${session.title || ''}.`,
        });
        setPrefillClientName(session.clientName || session.title || '');
        setIsModalOpen(true);
        shouldClearState = true;
      }
    }

    if (shouldClearState) navigate('/invoices', { replace: true, state: {} });
  }, [location.state, navigate, data.appointments, data.signerSessions]);

  const visibleInvoices = useMemo(() => {
    if (!statusFilter.length) return invoices;
    return invoices.filter((inv) => statusFilter.includes(inv.status));
  }, [invoices, statusFilter]);


  const totals = useMemo(() => ({
    paid: invoices.filter((i) => i.status === 'Paid').reduce((sum, i) => sum + Number(i.amount || 0), 0),
    pending: invoices.filter((i) => ['Draft', 'Pending', 'Sent'].includes(i.status)).reduce((sum, i) => sum + Number(i.amount || 0), 0),
    overdue: invoices.filter((i) => i.status === 'Overdue').reduce((sum, i) => sum + Number(i.amount || 0), 0),
  }), [invoices]);

  const visibleTotals = useMemo(() => ({
    paid: visibleInvoices.filter((i) => i.status === 'Paid').reduce((sum, i) => sum + Number(i.amount || 0), 0),
    pending: visibleInvoices.filter((i) => ['Draft', 'Pending', 'Sent'].includes(i.status)).reduce((sum, i) => sum + Number(i.amount || 0), 0),
    overdue: visibleInvoices.filter((i) => i.status === 'Overdue').reduce((sum, i) => sum + Number(i.amount || 0), 0),
  }), [visibleInvoices]);

  const getStatusBadge = (status) => {
    if (status === 'Paid') return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Paid</Badge>;
    if (status === 'Sent') return <Badge variant="info" className="gap-1"><Send className="h-3 w-3" /> Sent</Badge>;
    if (status === 'Pending') return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    if (status === 'Draft') return <Badge variant="secondary" className="gap-1"><Pencil className="h-3 w-3" /> Draft</Badge>;
    if (status === 'Overdue') return <Badge variant="danger" className="gap-1"><AlertCircle className="h-3 w-3" /> Overdue</Badge>;
    return <Badge>{status}</Badge>;
  };


  // FIX 3: /pay/:id route now exists in App.jsx — this link is correctly wired
  const buildInvoiceLink = (invoice) => `${window.location.origin}/pay/${encodeURIComponent(invoice.id)}`;

  const markSent = (invoice) => {
    updateInvoice(invoice.id, {
      sentAt: new Date().toISOString(),
      paymentLink: invoice.paymentLink || buildInvoiceLink(invoice),
      status: invoice.status === 'Paid' ? 'Paid' : 'Sent',
    });
    toast.success('Marked as sent');
  };

  // Step 2 of Review & Send: user has seen the preview and clicked Confirm.
  // Copies branded email template to clipboard then marks the invoice Sent.
  const handleConfirmSend = () => {
    if (!reviewingInvoice) return;
    const inv = reviewingInvoice;
    const link = inv.paymentLink || buildInvoiceLink(inv);
    const withLink = { ...inv, paymentLink: link };
    const emailTemplate = generateInvoiceEmailTemplate(withLink, data.settings);
    navigator.clipboard?.writeText(emailTemplate);
    updateInvoice(inv.id, {
      sentAt: new Date().toISOString(),
      paymentLink: link,
      status: inv.status === 'Paid' ? 'Paid' : 'Sent',
    });
    toast.success('Email template copied — invoice marked as Sent');
    setReviewingInvoice(null);
  };

  const markPaid = (invoice) => {
    updateInvoice(invoice.id, {
      status: 'Paid',
      paidAt: new Date().toISOString(),
    });
    toast.success('Invoice marked as paid');
  };

  const sendReminder = (invoice) => {
    const link = invoice.paymentLink || buildInvoiceLink(invoice);
    const updatedInvoice = { ...invoice, paymentLink: link };
    
    // Generate branded email template
    const emailTemplate = generateInvoiceEmailTemplate(updatedInvoice, data.settings);
    
    // Copy to clipboard
    navigator.clipboard?.writeText(emailTemplate);
    updateInvoice(invoice.id, { lastReminderSentAt: new Date().toISOString(), paymentLink: link });
    toast.success('Branded email template copied to clipboard');
  };

  const copyInvoiceLink = async (invoice) => {
    const link = invoice.paymentLink || buildInvoiceLink(invoice);
    await navigator.clipboard?.writeText(link);
    updateInvoice(invoice.id, { paymentLink: link });
    toast.success('Link copied to clipboard');
  };

  const sendInvoiceSmsStub = async (invoice) => {
    const link = invoice.paymentLink || buildInvoiceLink(invoice);
    const message = generatePaymentReminderMessage(invoice, data.settings);
    await navigator.clipboard?.writeText(message);
    updateInvoice(invoice.id, { paymentLink: link, sentAt: new Date().toISOString() });
    toast.success('SMS message copied to clipboard');
  };

  const exportInvoicePdfStub = (invoice) => {
    try {
      exportInvoicePDF(invoice, data.settings);
      toast.success('Invoice PDF opened for printing/export');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleSaveInvoice = (payload) => {
    if (editingInvoice) {
      updateInvoice(editingInvoice.id, payload);
      toast.success('Invoice updated');
      setEditingInvoice(null);
      setPrefillClientName('');
      return;
    }
    addInvoice(payload);
    toast.success('Invoice created');
    setPrefillClientName('');
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 mx-auto max-w-[1400px] space-y-5 sm:space-y-6 pb-24">
      <InvoiceModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingInvoice(null); setPrefillClientName(''); }} onSave={handleSaveInvoice} initialInvoice={editingInvoice} prefillClientName={prefillClientName} />
      <InvoiceReviewModal
        invoice={reviewingInvoice}
        knownClientNames={(data?.clients || []).map((c) => c.name)}
        onClose={() => setReviewingInvoice(null)}
        onConfirmSend={handleConfirmSend}
        onEditFirst={() => {
          const inv = reviewingInvoice;
          setReviewingInvoice(null);
          setEditingInvoice(inv);
          setIsModalOpen(true);
        }}
      />

      <Card className="app-hero-card">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Billing Pipeline</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="mt-1 text-sm text-slate-200">Enterprise invoicing and payment tracking.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="border-0 bg-blue-500 text-white hover:bg-blue-600"><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button>
        </CardContent>
      </Card>

      {statusFilter.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between gap-2 p-3 text-xs">
            <p className="text-slate-600 dark:text-slate-300">Showing filtered invoices: {statusFilter.join(' + ')}</p>
            <Button size="sm" variant="secondary" onClick={() => setStatusFilter([])}>Clear filter</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Collected</p><p className="text-2xl font-bold text-emerald-600">${totals.paid.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Outstanding</p><p className="text-2xl font-bold text-amber-600">${totals.pending.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Overdue</p><p className="text-2xl font-bold text-rose-600">${totals.overdue.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>

        {/* ── Mobile card list ── */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
          {visibleInvoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">{statusFilter.length ? 'No invoices match the current filter.' : 'No invoices yet.'}</p>
          ) : visibleInvoices.map((invoice) => (
            <div key={invoice.id} className={`px-4 py-3.5 border-l-2 ${
              invoice.status === 'Overdue' ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-900/10'
              : invoice.status === 'Draft' ? 'border-slate-300 bg-slate-50/50 dark:bg-slate-800/20'
              : 'border-transparent'
            }`}>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{invoice.id}</span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{invoice.client}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Due {invoice.due}</p>
                  {invoice.sentAt && <p className="text-[11px] text-blue-600">Sent {new Date(invoice.sentAt).toLocaleDateString()}</p>}
                  {invoice.status === 'Paid' && invoice.paidAt && <p className="text-[11px] text-emerald-600">Paid {new Date(invoice.paidAt).toLocaleDateString()}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400">${Number(invoice.amount).toLocaleString()}</p>
                  <div className="flex gap-1 mt-1 justify-end">
                    <button onClick={() => { setEditingInvoice(invoice); setIsModalOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => copyInvoiceLink(invoice)} className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Copy payment link"><Link2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => exportInvoicePdfStub(invoice)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Export PDF"><FileText className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { deleteInvoice(invoice.id); toast.success('Invoice deleted'); }} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
              {/* ── Status-aware next-action strip ── */}
              {invoice.status === 'Draft' && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setReviewingInvoice(invoice)} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                    <Eye className="h-3.5 w-3.5" /> Review &amp; Send
                  </button>
                </div>
              )}
              {(invoice.status === 'Sent' || invoice.status === 'Pending') && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => markPaid(invoice)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
                  </button>
                  <button onClick={() => sendReminder(invoice)} className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors">
                    <MessageSquare className="h-3.5 w-3.5" /> Send Reminder
                  </button>
                </div>
              )}
              {invoice.status === 'Overdue' && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => sendReminder(invoice)} className="flex items-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors">
                    <MessageSquare className="h-3.5 w-3.5" /> Send Reminder
                  </button>
                  <button onClick={() => markPaid(invoice)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
                  </button>
                </div>
              )}
              {invoice.status === 'Paid' && invoice.paidAt && (
                <p className="mt-1.5 text-[11px] text-slate-400">Paid on {new Date(invoice.paidAt).toLocaleDateString()}</p>
              )}
            </div>
          ))}
        </div>

          {visibleInvoices.length > 0 ? (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs dark:border-slate-700 dark:bg-slate-800/40">
              <div className="grid grid-cols-3 gap-2">
                <p className="text-slate-600">Collected <span className="font-semibold text-emerald-600">${visibleTotals.paid.toLocaleString()}</span></p>
                <p className="text-slate-600">Outstanding <span className="font-semibold text-amber-600">${visibleTotals.pending.toLocaleString()}</span></p>
                <p className="text-slate-600">Overdue <span className="font-semibold text-rose-600">${visibleTotals.overdue.toLocaleString()}</span></p>
              </div>
            </div>
          ) : null}

        {/* ── Desktop table ── */}
        <CardContent className="hidden sm:block overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Issued</th>
                <th className="px-6 py-4">Due</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Sent / Paid</th>
                <th className="px-6 py-4">Next Action</th>
                <th className="px-4 py-4 text-right">Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {visibleInvoices.length === 0 ? (
                <tr><td colSpan="9" className="py-8 text-center text-slate-500">{statusFilter.length ? 'No invoices match the current filter.' : 'No invoices yet.'}</td></tr>
              ) : visibleInvoices.map((invoice) => (
                <tr key={invoice.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-2 ${
                  invoice.status === 'Overdue' ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-900/10'
                  : invoice.status === 'Draft' ? 'border-slate-300 bg-slate-50/30 dark:bg-slate-800/20'
                  : 'border-transparent'
                }`}>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{invoice.id}</td>
                  <td className="px-6 py-4 max-w-[160px] truncate">{invoice.client}</td>
                  <td className="px-6 py-4 font-semibold">${Number(invoice.amount).toLocaleString()}</td>
                  <td className="px-6 py-4">{invoice.date}</td>
                  <td className="px-6 py-4">{invoice.due}</td>
                  <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4 text-xs">
                    {invoice.status === 'Paid' && invoice.paidAt
                      ? <span className="text-emerald-600">Paid {new Date(invoice.paidAt).toLocaleDateString()}</span>
                      : invoice.sentAt
                        ? <span className="text-blue-600">Sent {new Date(invoice.sentAt).toLocaleDateString()}</span>
                        : <span className="text-slate-400">—</span>}
                  </td>
                  {/* ── Status-aware next-action column ── */}
                  <td className="px-6 py-4">
                    {invoice.status === 'Draft' && (
                      <Button size="sm" variant="primary" onClick={() => setReviewingInvoice(invoice)} className="whitespace-nowrap">
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Review &amp; Send
                      </Button>
                    )}
                    {(invoice.status === 'Sent' || invoice.status === 'Pending') && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => markPaid(invoice)} className="whitespace-nowrap">
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Paid
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => sendReminder(invoice)} className="whitespace-nowrap">
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Reminder
                        </Button>
                      </div>
                    )}
                    {invoice.status === 'Overdue' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="danger" onClick={() => sendReminder(invoice)} className="whitespace-nowrap">
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Send Reminder
                        </Button>
                        <Button size="sm" variant="success" onClick={() => markPaid(invoice)} className="whitespace-nowrap">
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Paid
                        </Button>
                      </div>
                    )}
                    {invoice.status === 'Paid' && (
                      <span className="text-xs text-slate-400 italic">No action needed</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingInvoice(invoice); setIsModalOpen(true); }} title="Edit"><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => copyInvoiceLink(invoice)} title="Copy link"><Link2 className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => exportInvoicePdfStub(invoice)} title="PDF"><FileText className="h-4 w-4" /></Button>
                      <Button size="sm" variant="danger" onClick={() => { deleteInvoice(invoice.id); toast.success('Invoice deleted'); }} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>

        {visibleInvoices.length > 0 ? (
          <div className="hidden sm:block border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs dark:border-slate-700 dark:bg-slate-800/40">
            <div className="grid grid-cols-3 gap-2">
              <p className="text-slate-600">Total collected <span className="font-semibold text-emerald-600">${visibleTotals.paid.toLocaleString()}</span></p>
              <p className="text-slate-600">Total outstanding <span className="font-semibold text-amber-600">${visibleTotals.pending.toLocaleString()}</span></p>
              <p className="text-slate-600">Total overdue <span className="font-semibold text-rose-600">${visibleTotals.overdue.toLocaleString()}</span></p>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default Invoices;
