import React, { useMemo, useState } from 'react';
import { Plus, Search, Mail, Phone, X, Wand2, ScanLine, MoreHorizontal, UserPlus, CalendarClock, FileText, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, Button, Badge, Input, Label, Select } from '../components/UI';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

const ClientModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', contact: '', email: '', phone: '', type: 'Individual' });
  const [smartInput, setSmartInput] = useState('');

  if (!isOpen) return null;

  const applySmartFill = (text) => {
    const source = text.trim();
    if (!source) return;
    const email = source.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] || '';
    const phone = source.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0] || '';
    const company = source.match(/(?:company|client|business)\s*[:\-]\s*([^,\n]+)/i)?.[1]?.trim() || '';
    const contact = source.match(/(?:contact|name)\s*[:\-]\s*([^,\n]+)/i)?.[1]?.trim() || '';
    const inferredType = /corp|inc|llc|company|title/i.test(source) ? 'Corporate' : formData.type;

    setFormData((prev) => ({
      ...prev,
      name: prev.name || company || contact,
      contact: prev.contact || contact,
      email: prev.email || email,
      phone: prev.phone || phone,
      type: prev.type === 'Individual' ? inferredType : prev.type,
    }));
  };

  const handleReceiptScan = (file) => {
    if (!file) return;
    applySmartFill(file.name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, ''));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: Date.now(), ...formData, status: 'Active' });
    setFormData({ name: '', contact: '', email: '', phone: '', type: 'Individual' });
    setSmartInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add New Client</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Wand2 className="h-3.5 w-3.5" /> Smart Fill</div>
            <textarea value={smartInput} onChange={(e) => setSmartInput(e.target.value)} className="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="Paste typed notes, business card text, or details" />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => applySmartFill(smartInput)}><Wand2 className="mr-1 h-3.5 w-3.5" /> Apply Smart Fill</Button>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300">
                <ScanLine className="h-3.5 w-3.5" /> Scan image
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleReceiptScan(e.target.files?.[0])} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Client / Company Name</Label>
              <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Acme Corp" />
            </div>
            <div>
              <Label>Primary Contact</Label>
              <Input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Contact Name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@corp.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 000-0000" />
            </div>
          </div>
          <div>
            <Label>Client Type</Label>
            <Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} options={[{ label: 'Individual', value: 'Individual' }, { label: 'Corporate', value: 'Corporate' }, { label: 'Title Company', value: 'Title Company' }]} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1">Save Client</Button>
          </div>
        </form>
      </div>
    </div>
  );
};


const ClientDetailModal = ({ client, details, onClose, onSchedule, onInvoice }) => {
  if (!client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/60">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{client.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{client.type} · {client.status}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Signings</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{details.appointments.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Invoices</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{details.invoices.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Revenue</p>
              <p className="text-lg font-bold text-emerald-600">${Number(details.totalRevenue || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Appointments</p></CardHeader>
              <CardContent className="space-y-2">
                {details.appointments.length === 0 ? <p className="text-xs text-slate-500">No signings yet.</p> : details.appointments.slice(0, 6).map((apt) => (
                  <p key={apt.id} className="text-xs text-slate-600 dark:text-slate-300">{apt.date} {apt.time || ''} · {apt.type} · ${Number(apt.amount || 0).toLocaleString()}</p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoices</p></CardHeader>
              <CardContent className="space-y-2">
                {details.invoices.length === 0 ? <p className="text-xs text-slate-500">No invoices yet.</p> : details.invoices.slice(0, 6).map((inv) => (
                  <p key={inv.id} className="text-xs text-slate-600 dark:text-slate-300">{inv.id} · {inv.status} · ${Number(inv.amount || 0).toLocaleString()}</p>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button onClick={onSchedule}><CalendarClock className="mr-1.5 h-4 w-4" /> Schedule</Button>
            <Button variant="secondary" onClick={onInvoice}><FileText className="mr-1.5 h-4 w-4" /> New Invoice</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Clients = () => {
  const { data, addClient } = useData();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.clients || [];
    return (data.clients || []).filter((client) => [client.name, client.contact, client.email, client.phone, client.type].join(' ').toLowerCase().includes(q));
  }, [data.clients, query]);

  const clientMetrics = useMemo(() => {
    const allClients = data.clients || [];
    return {
      total: allClients.length,
      corporate: allClients.filter((client) => /corporate|title/i.test(client.type || '')).length,
      active: allClients.filter((client) => client.status === 'Active').length,
    };
  }, [data.clients]);

  const clientInsights = useMemo(() => {
    const appointments = data.appointments || [];
    const invoices = data.invoices || [];
    return Object.fromEntries((data.clients || []).map((client) => {
      const clientApts = appointments.filter((a) => (a.client || '').toLowerCase() === (client.name || '').toLowerCase());
      const latest = [...clientApts].sort((a, b) => (`${b.date} ${b.time || ''}`).localeCompare(`${a.date} ${a.time || ''}`))[0];
      const outstanding = invoices
        .filter((i) => (i.client || '').toLowerCase() === (client.name || '').toLowerCase() && i.status !== 'Paid')
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
      return [client.id, { latest, outstanding }];
    }));
  }, [data.clients, data.appointments, data.invoices]);

  const clientHistory = useMemo(() => Object.fromEntries((data.clients || []).map((client) => {
    const appointments = (data.appointments || []).filter((a) => (a.client || '').toLowerCase() === (client.name || '').toLowerCase())
      .sort((a, b) => (`${b.date} ${b.time || ''}`).localeCompare(`${a.date} ${a.time || ''}`));
    const invoices = (data.invoices || []).filter((i) => (i.client || '').toLowerCase() === (client.name || '').toLowerCase());
    const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    return [client.id, { appointments, invoices, totalRevenue }];
  })), [data.clients, data.appointments, data.invoices]);

  return (
    <div className="min-h-[calc(100vh-6rem)] px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 mx-auto max-w-[1400px] space-y-5 sm:space-y-6 pb-20">
      <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addClient} />
      <ClientDetailModal
        client={selectedClient}
        details={selectedClient ? (clientHistory[selectedClient.id] || { appointments: [], invoices: [], totalRevenue: 0 }) : { appointments: [], invoices: [], totalRevenue: 0 }}
        onClose={() => setSelectedClient(null)}
        onSchedule={() => navigate('/schedule', { state: { quickClientName: selectedClient?.name } })}
        onInvoice={() => navigate('/invoices', { state: { prefillClientName: selectedClient?.name } })}
      />

      <Card className="app-hero-card">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Client Operations</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Clients</h1>
            <p className="mt-1 text-sm text-slate-200">Manage relationships with a clean enterprise workflow.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="border-0 bg-blue-500 text-white hover:bg-blue-600"><Plus className="mr-2 h-4 w-4" /> Add Client</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Total Clients</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{clientMetrics.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Enterprise Accounts</p><p className="text-2xl font-bold text-blue-600">{clientMetrics.corporate}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Active</p><p className="text-2xl font-bold text-emerald-600">{clientMetrics.active}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" style={{fontSize:16}} />
          </div>
        </CardHeader>

        {/* ── Mobile card list ── */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
          {filteredClients.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <UserPlus className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{(data.clients || []).length === 0 ? 'No clients yet' : 'No clients found'}</p>
              <p className="mt-1 text-xs text-slate-500">{(data.clients || []).length === 0 ? 'Add your first client to start scheduling and invoicing.' : 'Try a different search query.'}</p>
              {(data.clients || []).length === 0 ? <Button className="mt-3" onClick={() => setIsModalOpen(true)}>Add your first client</Button> : null}
            </div>
          ) : filteredClients.map((client) => (
            <div key={client.id} onClick={() => setSelectedClient(client)} className="flex cursor-pointer items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{client.name.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{client.name}</p>
                  <Badge variant={client.status === 'Active' ? 'success' : 'default'}>{client.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{client.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{client.phone}</p>
                <p className="text-[11px] text-slate-500">Last signing: {clientInsights[client.id]?.latest ? `${clientInsights[client.id].latest.date} ${clientInsights[client.id].latest.time || ''}` : 'None'} · Outstanding: ${Number(clientInsights[client.id]?.outstanding || 0).toLocaleString()}</p>
                <div className="mt-1.5 flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); navigate('/schedule', { state: { quickClientName: client.name } }); }} className="rounded-md bg-blue-50 text-blue-700 px-2 py-1 text-[11px] font-semibold">Schedule</button>
                  <button onClick={(e) => { e.stopPropagation(); navigate('/invoices', { state: { prefillClientName: client.name } }); }} className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px] font-semibold">Invoice</button>
                </div>
              </div>
              <Badge variant="blue" className="shrink-0 hidden xs:inline-flex">{client.type}</Badge>
            </div>
          ))}
        </div>

        {/* ── Desktop table ── */}
        <CardContent className="hidden sm:block overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Last signing</th>
                <th className="px-6 py-4">Outstanding</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredClients.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-500">{(data.clients || []).length === 0 ? 'No clients yet.' : 'No clients found.'}</td></tr>
              ) : filteredClients.map((client) => (
                <tr key={client.id} onClick={() => setSelectedClient(client)} className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{client.name.slice(0, 2).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{client.name}</p>
                        <div className="mt-1 flex items-center gap-1"><Badge variant="blue">{client.type}</Badge><Badge variant={client.status === 'Active' ? 'success' : 'default'}>{client.status}</Badge></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> <span className="truncate">{client.email}</span></p>
                      <p className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {client.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">{clientInsights[client.id]?.latest ? `${clientInsights[client.id].latest.date} ${clientInsights[client.id].latest.time || ''}` : 'None'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-600">${Number(clientInsights[client.id]?.outstanding || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/schedule', { state: { quickClientName: client.name } })}>Schedule</Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/invoices', { state: { prefillClientName: client.name } })}>Invoice</Button>
                      <Button variant="ghost" size="icon" className="opacity-80" onClick={() => setSelectedClient(client)}><MoreHorizontal className="h-4 w-4" /></Button>
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

export default Clients;
