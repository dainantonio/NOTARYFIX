import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  Plus, Download, CheckCircle2, Clock, AlertCircle, LayoutGrid,
  List as ListIcon, X, DollarSign, ChevronRight, Wand2, ScanLine
} from 'lucide-react';

// --- UTILS ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- UI COMPONENTS ---
const Card = ({ children, className }) => (
  <div className={cn("bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-200 hover:shadow-md", className)}>
    {children}
  </div>
);

const CardHeader = ({ children, className }) => (
  <div className={cn("px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between", className)}>
    {children}
  </div>
);

const CardTitle = ({ children, className }) => (
  <h3 className={cn("text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight", className)}>
    {children}
  </h3>
);

const CardContent = ({ children, className }) => (
  <div className={cn("p-6 text-slate-900 dark:text-slate-200", className)}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'default', className, ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm",
    secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700",
  };
  const sizes = { 
    sm: "h-8 px-3 text-xs", 
    default: "h-10 px-4 py-2 text-sm", 
    lg: "h-12 px-6 text-base", 
    icon: "h-10 w-10 p-2 flex items-center justify-center" 
  };
  return (
    <button 
      className={cn("inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none active:scale-95", variants[variant], sizes[size], className)} 
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200",
    success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800",
    warning: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800",
    danger: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800",
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800",
  };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", variants[variant], className)}>{children}</span>;
};

const Input = ({ className, ...props }) => (
  <input 
    className={cn("flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all", className)} 
    {...props} 
  />
);

const Label = ({ className, children, ...props }) => (
  <label className={cn("text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block", className)} {...props}>{children}</label>
);

const Select = ({ value, onChange, options, className }) => (
  <div className="relative">
    <select 
      value={value} 
      onChange={onChange} 
      className={cn("appearance-none w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-10 transition-all", className)}
    >
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
      <ChevronRight className="w-4 h-4 rotate-90" />
    </div>
  </div>
);

// --- CONTEXT ---
const DataContext = createContext();

const defaultData = {
  clients: [
    { id: 1, name: 'Sarah Johnson' },
    { id: 2, name: 'TechCorp Inc' },
  ],
  invoices: [
    { id: 'INV-1024', client: 'Sarah Johnson', amount: 150.00, date: 'Oct 24, 2025', status: 'Paid', due: 'Oct 24, 2025' },
    { id: 'INV-1025', client: 'TechCorp Inc', amount: 45.00, date: 'Oct 25, 2025', status: 'Pending', due: 'Nov 01, 2025' },
  ]
};

const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('notaryfix_data');
        if (saved) return { ...defaultData, ...JSON.parse(saved) };
      } catch (e) { console.error("Data Load Error", e); }
    }
    return defaultData;
  });

  useEffect(() => {
    localStorage.setItem('notaryfix_data', JSON.stringify(data));
  }, [data]);

  const addInvoice = (invoice) => setData(prev => ({ ...prev, invoices: [invoice, ...(prev.invoices || [])] }));

  return (
    <DataContext.Provider value={{ data, addInvoice }}>
      {children}
    </DataContext.Provider>
  );
};

const useData = () => useContext(DataContext);

// --- MODAL ---
const InvoiceModal = ({ isOpen, onClose, onSave }) => {
  const { data } = useData();
  const clientOptions = (data?.clients || []).map(c => ({ label: c.name, value: c.name }));

  const [formData, setFormData] = useState({
    client: clientOptions.length > 0 ? clientOptions[0].value : '',
    amount: '',
    due: ''
  });
  const [smartInput, setSmartInput] = useState('');

  if (!isOpen) return null;

  const applySmartFill = (text) => {
    const source = text.trim();
    if (!source) return;
    const amount = source.match(/\$?\s*(\d+(?:\.\d{1,2})?)/)?.[1] || '';
    const due = source.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '';
    const matchedClient = clientOptions.find((opt) => source.toLowerCase().includes(opt.label.toLowerCase()));

    setFormData((prev) => ({
      ...prev,
      amount: prev.amount || amount,
      due: prev.due || due,
      client: matchedClient?.value || prev.client,
    }));
  };

  const handleReceiptScan = async (file) => {
    if (!file) return;
    const pseudoExtract = file.name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '');
    applySmartFill(pseudoExtract);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      client: formData.client || (clientOptions[0]?.value || 'Unknown'),
      amount: parseFloat(formData.amount) || 0,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      due: formData.due,
      status: 'Pending'
    });
    setFormData({ client: clientOptions.length > 0 ? clientOptions[0].value : '', amount: '', due: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-900 dark:text-white">Create Invoice</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
          <div className="space-y-2">
            <Label>Select Client</Label>
            {clientOptions.length > 0 ? (
              <Select options={clientOptions} value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} />
            ) : ( <p className="text-sm text-red-500 bg-red-50 p-2 rounded-md">Please add a client first.</p> )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input required type="number" step="0.01" placeholder="0.00" className="pl-9" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input required type="date" value={formData.due} onChange={(e) => setFormData({...formData, due: e.target.value})} />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={clientOptions.length === 0}>Generate</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const Invoices = () => {
  const [viewMode, setViewMode] = useState('board');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, addInvoice } = useData();
  const invoices = data?.invoices || [];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Paid': return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</Badge>;
      case 'Pending': return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'Overdue': return <Badge variant="danger" className="gap-1"><AlertCircle className="w-3 h-3" /> Overdue</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const columns = {
    'Draft': invoices.filter(i => i.status === 'Draft'),
    'Pending': invoices.filter(i => i.status === 'Pending'),
    'Overdue': invoices.filter(i => i.status === 'Overdue'),
    'Paid': invoices.filter(i => i.status === 'Paid'),
  };

  const totalCollected = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const totalOutstanding = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <InvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addInvoice} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400">Track payments and manage billing pipeline.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}><ListIcon className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('board')} className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
          </div>
          <Button variant="secondary" className="hidden sm:flex"><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button onClick={() => setIsModalOpen(true)} className="shadow-blue-500/20 shadow-lg">
            <Plus className="w-4 h-4 mr-2" /> Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-none text-white shadow-lg shadow-blue-500/20">
          <CardContent className="p-6 text-white">
            <p className="text-blue-100 font-medium mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Collected</p>
            <h3 className="text-3xl font-bold text-white tracking-tight font-mono">${totalCollected.toFixed(2)}</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Outstanding</p>
            <h3 className="text-3xl font-bold text-amber-500 tracking-tight font-mono">${totalOutstanding.toFixed(2)}</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Overdue</p>
            <h3 className="text-3xl font-bold text-red-500 tracking-tight font-mono">${totalOverdue.toFixed(2)}</h3>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'list' ? (
        <Card>
           <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>
           <CardContent className="p-0 overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                 <tr>
                   <th className="px-6 py-4">Invoice ID</th>
                   <th className="px-6 py-4">Client</th>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Amount</th>
                   <th className="px-6 py-4">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                 {invoices.length === 0 ? (
                   <tr><td colSpan="5" className="text-center py-12 text-slate-500">No invoices yet. Create your first one to get started.</td></tr>
                 ) : invoices.map((inv) => (
                   <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                     <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{inv.id}</td>
                     <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{inv.client}</td>
                     <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.date}</td>
                     <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${inv.amount.toFixed(2)}</td>
                     <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(columns).map(([title, items]) => (
            <div key={title} className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider">{title}</h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-bold">{items.length}</span>
              </div>
              <div className="flex flex-col gap-3 min-h-[200px]">
                {items.length === 0 ? (
                  <div className="h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-medium">Empty</div>
                ) : (
                  items.map(inv => (
                    <Card key={inv.id} className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{inv.id}</span>
                        {getStatusBadge(inv.status)}
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{inv.client}</h4>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-mono">${inv.amount.toFixed(2)}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        <Clock className="w-3 h-3" /> Due {inv.due}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- WRAPPER FOR STANDALONE RUNNING ---
export default function App() {
  return (
    <DataProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
        <div className="max-w-6xl mx-auto">
          <Invoices />
        </div>
      </div>
    </DataProvider>
  );
}
