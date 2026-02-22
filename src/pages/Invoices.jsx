import React, { useMemo, useState } from 'react';
import { Plus, X, DollarSign, CheckCircle2, Clock, AlertCircle, Wand2, ScanLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Label, Select } from '../components/UI';
import { useData } from '../context/DataContext';

const InvoiceModal = ({ isOpen, onClose, onSave }) => {
  const { data } = useData();
  const clientOptions = (data?.clients || []).map((c) => ({ label: c.name, value: c.name }));
  const [formData, setFormData] = useState({ client: clientOptions[0]?.value || '', amount: '', due: '' });
  const [smartInput, setSmartInput] = useState('');

  if (!isOpen) return null;

  const applySmartFill = (text) => {
    const source = text.trim();
    if (!source) return;
    const amount = source.match(/\$?\s*(\d+(?:\.\d{1,2})?)/)?.[1] || '';
    const due = source.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '';
    const matchedClient = clientOptions.find((opt) => source.toLowerCase().includes(opt.label.toLowerCase()));
    setFormData((prev) => ({ ...prev, amount: prev.amount || amount, due: prev.due || due, client: matchedClient?.value || prev.client }));
  };

  const handleReceiptScan = (file) => {
    if (!file) return;
    applySmartFill(file.name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, ''));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      client: formData.client || (clientOptions[0]?.value || 'Unknown'),
      amount: parseFloat(formData.amount) || 0,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      due: formData.due,
      status: 'Pending',
    });
    setFormData({ client: clientOptions[0]?.value || '', amount: '', due: '' });
    setSmartInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="font-semibold text-slate-900 dark:text-white">Create Invoice</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Wand2 className="h-3.5 w-3.5" /> Smart Fill</div>
            <textarea value={smartInput} onChange={(e) => setSmartInput(e.target.value)} className="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" placeholder="Paste invoice details (client, amount, due date)" />
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={clientOptions.length === 0}>Generate</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Invoices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, addInvoice } = useData();
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

  return (
    <div className="space-y-6 pb-10">
      <InvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addInvoice} />

      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Billing Pipeline</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="mt-1 text-sm text-slate-200">Enterprise invoicing and payment tracking.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="border-0 bg-blue-500 text-white hover:bg-blue-600"><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Collected</p><p className="text-2xl font-bold text-emerald-600">${totals.paid.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Outstanding</p><p className="text-2xl font-bold text-amber-600">${totals.pending.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Overdue</p><p className="text-2xl font-bold text-rose-600">${totals.overdue.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Issued</th>
                <th className="px-6 py-4">Due</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {invoices.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-500">No invoices yet.</td></tr>
              ) : invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{invoice.id}</td>
                  <td className="px-6 py-4">{invoice.client}</td>
                  <td className="px-6 py-4 font-semibold">${Number(invoice.amount).toLocaleString()}</td>
                  <td className="px-6 py-4">{invoice.date}</td>
                  <td className="px-6 py-4">{invoice.due}</td>
                  <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
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
