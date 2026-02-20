import React, { useState, useEffect, createContext, useContext } from 'react';
import { MapPin, Plus, Download, Car, DollarSign } from 'lucide-react';

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
    lg: "h-12 px-6 text-base"
  };
  return (
    <button 
      className={cn("inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 active:scale-95", variants[variant] || variants.primary, sizes[size] || sizes.default, className)} 
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200",
  };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", variants[variant] || variants.default, className)}>{children}</span>;
};

const Input = ({ className, ...props }) => (
  <input 
    className={cn("flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all", className)} 
    {...props} 
  />
);

const Label = ({ className, children, ...props }) => (
  <label className={cn("text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block", className)} {...props}>{children}</label>
);

// --- CONTEXT ---
const DataContext = createContext();

const defaultData = {
  mileageLogs: [
    { id: 1, date: '2025-10-24', destination: 'Downtown Title Office', purpose: 'Loan Signing - Sarah Johnson', miles: 14.5 },
    { id: 2, date: '2025-10-22', destination: 'TechCorp HQ', purpose: 'I-9 Verifications', miles: 8.2 },
  ],
  settings: {
    costPerMile: 0.67
  }
};

const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('notaryfix_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...defaultData,
            ...parsed,
            mileageLogs: parsed.mileageLogs || defaultData.mileageLogs,
            settings: { ...defaultData.settings, ...(parsed.settings || {}) }
          };
        }
      } catch (e) { console.error("Data Load Error", e); }
    }
    return defaultData;
  });

  useEffect(() => {
    localStorage.setItem('notaryfix_data', JSON.stringify(data));
  }, [data]);

  const addMileageLog = (log) => setData(prev => ({ ...prev, mileageLogs: [log, ...(prev.mileageLogs || [])] }));

  return (
    <DataContext.Provider value={{ data, addMileageLog }}>
      {children}
    </DataContext.Provider>
  );
};

const useData = () => useContext(DataContext);

// --- MAIN MILEAGE COMPONENT ---
const Mileage = () => {
  const { data, addMileageLog } = useData();
  const logs = data.mileageLogs || [];
  const costPerMile = data.settings?.costPerMile || 0.67;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    destination: '',
    purpose: '',
    miles: ''
  });

  const totalMiles = logs.reduce((sum, log) => sum + (parseFloat(log.miles) || 0), 0);
  const totalDeduction = totalMiles * costPerMile;

  const handleSaveLog = (e) => {
    e.preventDefault();
    addMileageLog({
      id: Date.now(),
      date: formData.date,
      destination: formData.destination,
      purpose: formData.purpose,
      miles: parseFloat(formData.miles) || 0
    });
    setFormData({ ...formData, destination: '', purpose: '', miles: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mileage Log</h1>
          <p className="text-slate-500 dark:text-slate-400">Track drives for IRS tax deductions.</p>
        </div>
        <Button variant="secondary" className="shadow-sm">
          <Download className="w-4 h-4 mr-2" /> Export Log
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-none text-white shadow-lg shadow-emerald-500/20">
          <CardContent className="p-6 text-white">
            <p className="text-emerald-100 font-medium mb-1 flex items-center gap-2"><DollarSign className="w-4 h-4" /> YTD Tax Deduction</p>
            <h3 className="text-3xl font-bold text-white tracking-tight font-mono">${totalDeduction.toFixed(2)}</h3>
            <p className="text-xs text-emerald-200 mt-2">Based on current IRS rate: ${costPerMile}/mi</p>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-2"><Car className="w-4 h-4" /> Total Miles Driven</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-mono">{totalMiles.toFixed(1)} mi</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Add Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>Log a Trip</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSaveLog} className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Destination / Address</Label>
                  <Input required placeholder="123 Main St" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Business Purpose</Label>
                  <Input required placeholder="e.g. Loan Signing for Smith" value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Round-trip Miles</Label>
                  <Input required type="number" step="0.1" placeholder="0.0" value={formData.miles} onChange={(e) => setFormData({...formData, miles: e.target.value})} />
                </div>
                <Button type="submit" className="w-full mt-4"><Plus className="w-4 h-4 mr-2" /> Save Trip</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Trip History</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                   <tr>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Destination & Purpose</th>
                     <th className="px-6 py-4 text-right">Miles</th>
                     <th className="px-6 py-4 text-right">Deduction</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                   {logs.length === 0 ? (
                     <tr><td colSpan="4" className="text-center py-12 text-slate-500">No miles logged yet.</td></tr>
                   ) : logs.map((log) => (
                     <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{log.date}</td>
                       <td className="px-6 py-4">
                         <p className="font-medium text-slate-900 dark:text-white">{log.destination}</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400">{log.purpose}</p>
                       </td>
                       <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">{log.miles.toFixed(1)}</td>
                       <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">${(log.miles * costPerMile).toFixed(2)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- WRAPPER FOR STANDALONE RUNNING ---
export default function App() {
  return (
    <DataProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
        <div className="max-w-6xl mx-auto">
          <Mileage />
        </div>
      </div>
    </DataProvider>
  );
}