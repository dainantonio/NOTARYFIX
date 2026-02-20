#!/bin/bash

echo "🚀 Initiating Master Reset & V10 Sync..."

# 1. CREATE CONTEXTS (Theme & Data)
# -----------------------------------------------------------------------------
echo "💾 Writing Contexts..."
mkdir -p src/context

cat << 'EOF' > src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
EOF

cat << 'EOF' > src/context/DataContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

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
  invoices: [
    { id: 'INV-1024', client: 'Sarah Johnson', amount: 150.00, date: 'Oct 24, 2025', status: 'Paid', due: 'Oct 24, 2025' },
    { id: 'INV-1025', client: 'TechCorp Inc', amount: 45.00, date: 'Oct 25, 2025', status: 'Pending', due: 'Nov 01, 2025' },
  ],
  settings: { name: 'Dain Antonio', businessName: 'Antonio Mobile Notary', costPerMile: 0.67, taxRate: 15, monthlyGoal: 15000 }
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('notaryfix_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...defaultData,
            ...parsed,
            appointments: parsed.appointments || defaultData.appointments,
            clients: parsed.clients || defaultData.clients,
            invoices: parsed.invoices || defaultData.invoices,
            settings: { ...defaultData.settings, ...(parsed.settings || {}) }
          };
        }
      } catch (e) { console.error("Failed to parse local storage", e); }
    }
    return defaultData;
  });

  useEffect(() => {
    localStorage.setItem('notaryfix_data', JSON.stringify(data));
  }, [data]);

  const addAppointment = (appointment) => setData(prev => ({ ...prev, appointments: [appointment, ...(prev.appointments || [])] }));
  const addClient = (client) => setData(prev => ({ ...prev, clients: [client, ...(prev.clients || [])] }));
  const addInvoice = (invoice) => setData(prev => ({ ...prev, invoices: [invoice, ...(prev.invoices || [])] }));
  const updateSettings = (newSettings) => setData(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));

  return (
    <DataContext.Provider value={{ data, addAppointment, updateSettings, addClient, addInvoice }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
EOF

# 2. WRITE UI COMPONENTS
# -----------------------------------------------------------------------------
echo "🎨 Writing UI Components..."
cat << 'EOF' > src/components/UI.jsx
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) { return twMerge(clsx(inputs)); }

export const Card = ({ children, className }) => (
  <div className={cn("bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm", className)}>{children}</div>
);
export const CardHeader = ({ children, className }) => (
  <div className={cn("px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between", className)}>{children}</div>
);
export const CardTitle = ({ children, className }) => (
  <h3 className={cn("text-lg font-semibold text-slate-800 dark:text-slate-100", className)}>{children}</h3>
);
export const CardContent = ({ children, className }) => (
  <div className={cn("p-6 text-slate-900 dark:text-slate-200", className)}>{children}</div>
);
export const Button = ({ children, variant = 'primary', size = 'default', className, ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700",
  };
  const sizes = { sm: "h-8 px-3 text-xs", default: "h-10 px-4 py-2", lg: "h-12 px-6", icon: "h-10 w-10 p-2 flex items-center justify-center" };
  return (
    <button className={cn("inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50", variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};
export const Badge = ({ children, variant = 'default', className }) => {
  const variants = { default: "bg-slate-100 text-slate-800", success: "bg-green-100 text-green-700", warning: "bg-amber-100 text-amber-700", danger: "bg-red-100 text-red-700", blue: "bg-blue-100 text-blue-700" };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>{children}</span>;
};
export const Input = ({ className, ...props }) => (
  <input className={cn("flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white", className)} {...props} />
);
export const Label = ({ className, children, ...props }) => (
  <label className={cn("text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block", className)} {...props}>{children}</label>
);
export const Select = ({ value, onChange, options, className }) => (
  <div className="relative">
    <select value={value} onChange={onChange} className={cn("appearance-none w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-10", className)}>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  </div>
);
export const Skeleton = ({ className }) => <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-700 rounded", className)} />;
export const Progress = ({ value, max = 100, className, indicatorClassName }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden", className)}>
      <div className={cn("h-full bg-blue-600 transition-all duration-500", indicatorClassName)} style={{ width: `${percentage}%` }} />
    </div>
  );
};
export const CircularProgress = ({ value, max = 100, size = 120, strokeWidth = 10, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100 dark:text-slate-800" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-blue-600 transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};
EOF

# 3. WRITE MODALS
# -----------------------------------------------------------------------------
echo "🪟 Writing Modals..."

cat << 'EOF' > src/components/AppointmentModal.jsx
import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, User, FileText, MapPin } from 'lucide-react';
import { Button, Input, Label, Select } from './UI';

const AppointmentModal = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;
  const [formData, setFormData] = useState({ client: '', type: 'Loan Signing', date: '', time: '', fee: '', location: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
    setFormData({ client: '', type: 'Loan Signing', date: '', time: '', fee: '', location: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-900 dark:text-white">New Appointment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <Label>Client Name</Label>
            <div className="relative"><User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input required placeholder="e.g. John Doe" className="pl-9" value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} /></div>
          </div>
          <div className="space-y-1">
            <Label>Service Type</Label>
            <Select options={[{label: 'Loan Signing', value: 'Loan Signing'}, {label: 'GNW', value: 'GNW'}, {label: 'I-9 Verification', value: 'I-9 Verification'}]} value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Date</Label><Input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
            <div className="space-y-1"><Label>Time</Label><Input required type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fee ($)</Label>
              <div className="relative"><DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input required type="number" placeholder="0.00" className="pl-9" value={formData.fee} onChange={(e) => setFormData({...formData, fee: e.target.value})} /></div>
            </div>
             <div className="space-y-1">
              <Label>Location</Label>
              <div className="relative"><MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input type="text" placeholder="12345" className="pl-9" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
            </div>
          </div>
          <div className="pt-4 flex gap-3"><Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button><Button type="submit" className="flex-1">Save Appointment</Button></div>
        </form>
      </div>
    </div>
  );
};
export default AppointmentModal;
EOF

cat << 'EOF' > src/components/ClientModal.jsx
import React, { useState } from 'react';
import { X, User, Mail, Phone, Building } from 'lucide-react';
import { Button, Input, Label, Select } from './UI';

const ClientModal = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;
  const [formData, setFormData] = useState({ name: '', contact: '', email: '', phone: '', type: 'Individual' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: Date.now(), ...formData, status: 'Active' });
    setFormData({ name: '', contact: '', email: '', phone: '', type: 'Individual' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add New Client</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2"><Label>Client / Company Name</Label><div className="relative"><Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input required placeholder="Acme Corp" className="pl-9" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div></div>
          <div className="space-y-2"><Label>Primary Contact</Label><div className="relative"><User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="Contact Name" className="pl-9" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} /></div></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email</Label><div className="relative"><Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input type="email" placeholder="email@ext.com" className="pl-9" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div></div>
            <div className="space-y-2"><Label>Phone</Label><div className="relative"><Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input type="tel" placeholder="(555) 000-0000" className="pl-9" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div></div>
          </div>
          <div className="space-y-2"><Label>Client Type</Label><Select options={[ {label: 'Individual', value: 'Individual'}, {label: 'Corporate', value: 'Corporate'}, {label: 'Title Company', value: 'Title Company'} ]} value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} /></div>
          <div className="pt-4 flex gap-3"><Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button><Button type="submit" className="flex-1">Save Client</Button></div>
        </form>
      </div>
    </div>
  );
};
export default ClientModal;
EOF

cat << 'EOF' > src/components/InvoiceModal.jsx
import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Button, Input, Label, Select } from './UI';
import { useData } from '../context/DataContext';

const InvoiceModal = ({ isOpen, onClose, onSave }) => {
  const { data } = useData();
  const clientOptions = (data?.clients || []).map(c => ({ label: c.name, value: c.name }));

  const [formData, setFormData] = useState({ client: clientOptions.length > 0 ? clientOptions[0].value : '', amount: '', due: '' });

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-900 dark:text-white">Create Invoice</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Select Client</Label>
            {clientOptions.length > 0 ? (
              <Select options={clientOptions} value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} />
            ) : ( <p className="text-sm text-red-500 bg-red-50 p-2 rounded-md">Please add a client first.</p> )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Amount ($)</Label><div className="relative"><DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input required type="number" step="0.01" placeholder="0.00" className="pl-9" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} /></div></div>
            <div className="space-y-2"><Label>Due Date</Label><Input required type="date" value={formData.due} onChange={(e) => setFormData({...formData, due: e.target.value})} /></div>
          </div>
          <div className="pt-4 flex gap-3"><Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button><Button type="submit" className="flex-1" disabled={clientOptions.length === 0}>Generate</Button></div>
        </form>
      </div>
    </div>
  );
};
export default InvoiceModal;
EOF

# 4. WRITE DASHBOARD
# -----------------------------------------------------------------------------
echo "📊 Compiling V10 Dashboard..."
cat << 'EOF' > src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, FileSignature, DollarSign, MapPin, Plus, Clock, TrendingUp, CheckCircle2, 
  Bell, Search, ArrowUpRight, ArrowDownRight, Sparkles, Zap, Award, Wallet, Calendar as CalendarIcon, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Select, CircularProgress, Skeleton, Progress } from '../components/UI';

import AppointmentModal from '../components/AppointmentModal';
import ClientModal from '../components/ClientModal';
import InvoiceModal from '../components/InvoiceModal';

import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: 'Jan', amount: 2400 }, { name: 'Feb', amount: 1398 },
  { name: 'Mar', amount: 9800 }, { name: 'Apr', amount: 3908 },
  { name: 'May', amount: 4800 }, { name: 'Jun', amount: 3800 },
  { name: 'Jul', amount: 4300 },
];

const StatsCard = ({ title, value, change, icon: Icon, trend, loading }) => (
  <Card className="border-none shadow-sm hover:shadow-lg dark:shadow-none dark:hover:bg-slate-700/50 transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </div>
        {loading ? <Skeleton className="w-12 h-6" /> : (
          <Badge variant={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'default'} className="flex items-center gap-1">
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
            {change}
          </Badge>
        )}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
        {loading ? <Skeleton className="w-24 h-8" /> : (
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
        )}
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const { theme } = useTheme();
  const { data, addAppointment, addClient, addInvoice } = useData();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const totalRevenue = 12450 + (data?.appointments || []).reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0);
  const upcomingCount = (data?.appointments || []).filter(a => a.status === 'upcoming').length;
  const netProfit = totalRevenue - 1200;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const goalPercent = Math.min(100, Math.round(((9800 + totalRevenue - 12450) / (data?.settings?.monthlyGoal || 15000)) * 100));

  const chartStroke = theme === 'dark' ? '#3b82f6' : '#2563eb';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      <AppointmentModal isOpen={isAptModalOpen} onClose={() => setIsAptModalOpen(false)} onSave={addAppointment} />
      <ClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onSave={addClient} />
      <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} onSave={addInvoice} />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
             {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </p>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Overview, {data?.settings?.name?.split(' ')[0] || 'Notary'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" className="relative hidden sm:flex">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          </Button>
          <Button onClick={() => setIsAptModalOpen(true)} className="shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-2" /> New Appointment
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="12.5%" trend="up" icon={DollarSign} loading={loading} />
        <StatsCard title="Net Profit (Est)" value={`$${netProfit.toLocaleString()}`} change={`${profitMargin}% Margin`} trend="up" icon={Wallet} loading={loading} />
        <StatsCard title="Signings" value={52 + (data?.appointments || []).length} change="4.2%" trend="up" icon={FileSignature} loading={loading} />
        <StatsCard title="Clients" value={(data?.clients || []).length} change="Total Roster" trend="up" icon={Users} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="h-[400px]">
            <CardHeader>
              <div><CardTitle>Revenue Velocity</CardTitle><p className="text-sm text-slate-500 dark:text-slate-400">Financial performance over time</p></div>
              <Select options={[{label: 'This Year', value: 'year'}]} className="w-32" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="w-full h-[300px]" /> : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartStroke} stopOpacity={0.3}/><stop offset="95%" stopColor={chartStroke} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="amount" stroke={chartStroke} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4"><CardTitle>Upcoming Schedule</CardTitle><Badge variant="blue">{upcomingCount} Pending</Badge></div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? ( [1,2,3].map(i => <div key={i} className="p-6"><Skeleton className="w-full h-12" /></div>) ) : (data?.appointments || []).length === 0 ? ( <div className="p-8 text-center text-slate-500">No appointments scheduled.</div> ) : (
                  (data.appointments || []).slice(0, 5).map((apt) => (
                    <div key={apt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${apt.status === 'upcoming' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}><Clock className="w-5 h-5" /></div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{apt.client}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2"><span className="font-medium">{apt.time}</span><span className="w-1 h-1 bg-slate-300 rounded-full"></span><span>{apt.type}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 sm:mt-0"><span className="font-bold text-slate-900 dark:text-white">${apt.amount}</span><Badge variant={apt.status === 'upcoming' ? 'blue' : 'success'}>{apt.status === 'upcoming' ? 'Scheduled' : 'Completed'}</Badge></div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Monthly Goal</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
              {loading ? <Skeleton className="w-32 h-32 rounded-full" /> : (
                <CircularProgress value={goalPercent} size={180} strokeWidth={12}>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{goalPercent}%</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">of ${(data?.settings?.monthlyGoal || 15000).toLocaleString()}</p>
                  </div>
                </CircularProgress>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-slate-800">
            <CardHeader className="border-slate-800"><CardTitle className="text-white">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <button onClick={() => setIsInvoiceModalOpen(true)} className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors group">
                <span className="flex items-center gap-3"><div className="p-2 bg-blue-500 rounded-md"><FileSignature className="w-4 h-4" /></div><span className="font-medium">Create Invoice</span></span><ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>
              <button onClick={() => setIsClientModalOpen(true)} className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors group">
                <span className="flex items-center gap-3"><div className="p-2 bg-purple-500 rounded-md"><Users className="w-4 h-4" /></div><span className="font-medium">Add New Client</span></span><ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
EOF

# 5. WRITE MAIN AND APP (To connect providers)
# -----------------------------------------------------------------------------
echo "🔌 Connecting Providers..."
cat << 'EOF' > src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Legal from './pages/Legal';

// A wrapper to intelligently hide the Dashboard Layout when on Landing/Auth pages
const AppLayout = ({ children }) => {
  const location = useLocation();
  const publicRoutes = ['/', '/auth', '/legal'];
  
  if (publicRoutes.includes(location.pathname)) {
    return <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">{children}</div>;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/legal" element={<Legal />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
EOF

cat << 'EOF' > src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { DataProvider } from './context/DataContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
EOF

echo "✅ MASTER RESET COMPLETE! Your Dashboard, Modals, and Engine are perfectly synced."