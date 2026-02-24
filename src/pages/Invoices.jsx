import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X, DollarSign, CheckCircle2, Clock, AlertCircle, Wand2, ScanLine, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Label, Select } from '../components/UI';
import { useData } from '../context/DataContext';

const InvoiceModal = ({ isOpen, onClose, onSave, initialInvoice }) => {
  const { data } = useData();
  const clientOptions = (data?.clients || []).map((c) => ({ label: c.name, value: c.name }));
  const [formData, setFormData] = useState({ client: '', amount: '', due: '', status: 'Pending' });
  const [smartInput, setSmartInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialInvoice) {
      setFormData({
        client: initialInvoice.client || '',
        amount: String(initialInvoice.amount || ''),
        due: /^\d{4}-\d{2}-\d{2}$/.test(initialInvoice.due || '') ? initialInvoice.due : '',
        status: initialInvoice.status || 'Pending',
      });
      return;
    }
    setFormData({ client: clientOptions[0]?.value || '', amount: '', due: '', status: 'Pending' });
  }, [isOpen, initialInvoice, clientOptions]);

  if (!isOpen) return null;

  const applySmartFill = (text) => {
    const source = text.trim();
    if (!source) return;
    const amount = source.match(/\$?\s*(\d+(?:\.\d{1,2})?)/)?.[1] || '';
    const due = source.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '';
    const status = /paid/i.test(source) ? 'Paid' : /overdue/i.test(source) ? 'Overdue' : 'Pending';
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
            <textarea value={smartInput} onChange={(e) => setSmartInput(e.target.value)} className="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Paste invoice details (client, amount, due date, status)" />
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
              <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={[{ label: 'Pending', value: 'Pending' }, { label: 'Paid', value: 'Paid' }, { label: 'Overdue', value: 'Overdue' }]} />
            </div>
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

const Invoices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const { data, addInvoice, updateInvoice, deleteInvoice } = useData();
  const invoices = data?.invoices || [];

  const totals = useMemo(() => ({
    paid: invoices.filter((i) => i.status === 'Paid').reduce((sum, i) => sum + Number(i.amount || 0), 0),
    pending: invoices.filter((i) => i.status === 'Pending').reduce((sum, i) => sum + Number(i.amount || 0), 0),
    overdue: invoices.filter((i) => i.status === 'Overdue').reduce((sum, i) => sum + Number(i.amount || 0), 0),
  }), [invoices]);

  const getStatusBadge = (status) => {
    if (status === 'Paid') return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Paid</Badge>;
    if (status === 'Pending') return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    if (status === 'Overdue') return <Badge variant="danger" className="gap-1"><AlertCircle className="h-3 w-3" /> Overdue</Badge>;
    return <Badge>{status}</Badge>;
  };

  const handleSaveInvoice = (payload) => {
    if (editingInvoice) {
      updateInvoice(editingInvoice.id, payload);
      setEditingInvoice(null);
      return;
    }
    addInvoice(payload);
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 mx-auto max-w-[1400px] space-y-5 sm:space-y-6 pb-20">
      <InvoiceModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingInvoice(null); }} onSave={handleSaveInvoice} initialInvoice={editingInvoice} />

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Collected</p><p className="text-2xl font-bold text-emerald-600">${totals.paid.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Outstanding</p><p className="text-2xl font-bold text-amber-600">${totals.pending.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Overdue</p><p className="text-2xl font-bold text-rose-600">${totals.overdue.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>

        {/* ── Mobile card list ── */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No invoices yet.</p>
          ) : invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{invoice.id}</span>
                  {getStatusBadge(invoice.status)}
                </div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{invoice.client}</p>
                <p className="text-xs text-slate-500 mt-0.5">Due {invoice.due}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">${Number(invoice.amount).toLocaleString()}</p>
                <div className="flex gap-1 mt-1 justify-end">
                  <button onClick={() => { setEditingInvoice(invoice); setIsModalOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteInvoice(invoice.id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

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
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {invoices.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-500">No invoices yet.</td></tr>
              ) : invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{invoice.id}</td>
                  <td className="px-6 py-4 max-w-[160px] truncate">{invoice.client}</td>
                  <td className="px-6 py-4 font-semibold">${Number(invoice.amount).toLocaleString()}</td>
                  <td className="px-6 py-4">{invoice.date}</td>
                  <td className="px-6 py-4">{invoice.due}</td>
                  <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingInvoice(invoice); setIsModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="danger" onClick={() => deleteInvoice(invoice.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
