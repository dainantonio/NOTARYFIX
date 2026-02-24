import React, { useMemo, useState } from 'react';
import { ArrowLeft, Plus, ShieldCheck, Wand2, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../components/UI';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

const defaultItem = {
  title: '',
  category: '',
  dueDate: new Date().toISOString().split('T')[0],
  status: 'Needs Review',
  notes: '',
};

const Legal = () => {
  const { data, addComplianceItem, updateComplianceItem, deleteComplianceItem } = useData();
  const [formData, setFormData] = useState(defaultItem);
  const [smartInput, setSmartInput] = useState('');
  const [editingId, setEditingId] = useState(null);

  const items = data.complianceItems || [];
  const compliantCount = useMemo(() => items.filter((item) => item.status === 'Compliant').length, [items]);
  const reviewCount = Math.max(items.length - compliantCount, 0);

  const applySmartFill = () => {
    const source = smartInput.trim();
    if (!source) return;
    const title = source.match(/(?:item|task|policy)\s*[:\-]?\s*([^,\n]+)/i)?.[1]?.trim() || formData.title;
    const category = source.match(/(?:category|type)\s*[:\-]?\s*([^,\n]+)/i)?.[1]?.trim() || formData.category;
    const dueDate = source.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || formData.dueDate;
    const status = source.match(/(compliant|needs review|expired)/i)?.[1] || formData.status;

    setFormData((prev) => ({
      ...prev,
      title,
      category,
      dueDate,
      status: status.toLowerCase() === 'compliant' ? 'Compliant' : status.toLowerCase() === 'expired' ? 'Expired' : prev.status,
      notes: prev.notes || source,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (editingId) {
      updateComplianceItem(editingId, payload);
      setEditingId(null);
    } else {
      addComplianceItem({ id: Date.now(), ...payload });
    }
    setFormData(defaultItem);
    setSmartInput('');
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      category: item.category,
      dueDate: item.dueDate,
      status: item.status,
      notes: item.notes,
    });
  };

  return (
    <div className="space-y-6 pb-10">
      <Link to="/dashboard">
        <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-blue-600"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
      </Link>

      <Card className="app-hero-card">
        <CardContent className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Risk & Controls</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Compliance Command</h1>
          <p className="mt-1 text-sm text-slate-200">Track required records, due dates, and audit readiness from one workspace.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Checklist Items</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{items.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Compliant</p><p className="text-2xl font-bold text-emerald-600">{compliantCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs uppercase text-slate-500">Needs Action</p><p className="text-2xl font-bold text-amber-600">{reviewCount}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>{editingId ? 'Edit Compliance Item' : 'Add Compliance Item'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Wand2 className="h-3.5 w-3.5" /> Smart Fill</div>
              <textarea value={smartInput} onChange={(e) => setSmartInput(e.target.value)} className="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="Example: task: E&O renewal, category: Insurance, due 2026-12-31" />
              <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={applySmartFill}><Wand2 className="mr-1 h-3.5 w-3.5" /> Apply Smart Fill</Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Title</Label><Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
              <div><Label>Category</Label><Input required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} /></div>
              <div><Label>Due Date</Label><Input required type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900">
                  <option>Needs Review</option>
                  <option>Compliant</option>
                  <option>Expired</option>
                </select>
              </div>
              <div><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full"><Plus className="mr-2 h-4 w-4" /> {editingId ? 'Save Item' : 'Add Item'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-500" /> Compliance Register</CardTitle></CardHeader>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 sm:hidden">
            {items.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No compliance items yet.</p> : items.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-slate-500">{item.category} · Due {item.dueDate}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.status === 'Compliant' ? 'bg-emerald-100 text-emerald-700' : item.status === 'Expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="danger" onClick={() => deleteComplianceItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <CardContent className="overflow-x-auto p-0 hidden sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr><th className="px-6 py-4">Item</th><th className="px-6 py-4">Due</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.length === 0 ? <tr><td colSpan="4" className="py-10 text-center text-slate-500">No compliance items yet.</td></tr> : items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4"><p className="font-medium text-slate-900 dark:text-white">{item.title}</p><p className="text-xs text-slate-500">{item.category}</p></td>
                    <td className="px-6 py-4 text-slate-500">{item.dueDate}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.status === 'Compliant' ? 'bg-emerald-100 text-emerald-700' : item.status === 'Expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="danger" onClick={() => deleteComplianceItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Legal;
