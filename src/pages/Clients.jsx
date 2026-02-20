import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Search, MoreHorizontal, Mail, Phone, Plus, Filter, Download, 
  X, User, Building, LayoutGrid, List as ListIcon, CheckCircle2, Clock, AlertCircle
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
    outline: "bg-transparent border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
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
  <label className={cn("text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block", className)} {...props}>{children}</label>
);

const Select = ({ value, onChange, options, className }) => (
  <div className="relative">
    <select 
      value={value} 
      onChange={onChange} 
      className={cn("appearance-none w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-10", className)}
    >
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  </div>
);

// --- CONTEXT ---
const DataContext = createContext();

const defaultData = {
  appointments: [
    { id: 1, client: 'Sarah Johnson', type: 'Loan Signing', date: new Date().toISOString().split('T')[0], time: '2:00 PM', status: 'upcoming', amount: 150, location: 'Downtown' },
    { id: 2, client: 'TechCorp Inc', type: 'I-9 Verification', date: new Date().toISOString().split('T')[0], time: '4:30 PM', status: 'upcoming', amount: 45, location: 'Remote' },
  ],
  clients: [
    { id: 1, name: 'TechCorp Inc', contact: 'Sarah Smith', email: 'sarah@techcorp.com', phone: '(555) 123-4567', type: 'Corporate', status: 'Active' },
    { id: 2, name: 'Sarah Johnson', contact: 'Sarah Johnson', email: 's.johnson@email.com', phone: '(555) 987-6543', type: 'Individual', status: 'Active' },
  ],
  invoices: [],
  settings: { name: 'Dain Antonio', businessName: 'Antonio Mobile Notary', monthlyGoal: 15000 }
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

  const addAppointment = (appointment) => setData(prev => ({ ...prev, appointments: [appointment, ...(prev.appointments || [])] }));
  const addClient = (client) => setData(prev => ({ ...prev, clients: [client, ...(prev.clients || [])] }));
  const addInvoice = (invoice) => setData(prev => ({ ...prev, invoices: [invoice, ...(prev.invoices || [])] }));

  return (
    <DataContext.Provider value={{ data, addAppointment, addClient, addInvoice }}>
      {children}
    </DataContext.Provider>
  );
};

const useData = () => useContext(DataContext);

// --- MODALS ---
const ClientModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', contact: '', email: '', phone: '', type: 'Individual' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: Date.now(), ...formData, status: 'Active' });
    setFormData({ name: '', contact: '', email: '', phone: '', type: 'Individual' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add New Client</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Client / Company Name</Label>
            <div className="relative"><Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input required placeholder="Acme Corp" className="pl-9" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
          </div>
          <div className="space-y-2">
            <Label>Primary Contact</Label>
            <div className="relative"><User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="Contact Name" className="pl-9" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative"><Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input type="email" placeholder="email@ext.com" className="pl-9" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="relative"><Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input type="tel" placeholder="(555) 000-0000" className="pl-9" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Client Type</Label>
            <Select 
              options={[{label: 'Individual', value: 'Individual'}, {label: 'Corporate', value: 'Corporate'}, {label: 'Title Company', value: 'Title Company'}]} 
              value={formData.type} 
              onChange={(e) => setFormData({...formData, type: e.target.value})} 
            />
          </div>
          <div className="pt-4 flex gap-3"><Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button><Button type="submit" className="flex-1">Save Client</Button></div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const Clients = () => {
  const { data, addClient } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const clients = data?.clients || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addClient} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Clients</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your relationships and contact details.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-blue-500/20 shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search clients..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
             </div>
             <Button variant="secondary" size="icon" className="hidden sm:flex"><Filter className="w-4 h-4" /></Button>
             <Button variant="secondary" size="icon" className="hidden sm:flex"><Download className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">No clients found. Add one above!</td>
                </tr>
              ) : clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-200 dark:border-blue-800">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{client.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{client.contact}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="blue">{client.type}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={client.status === 'Active' ? 'success' : 'default'}>{client.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
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

// --- EXPORT ---
export default function App() {
  return (
    <DataProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
        <div className="max-w-6xl mx-auto">
          <Clients />
        </div>
      </div>
    </DataProvider>
  );
}