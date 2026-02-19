#!/bin/bash

echo "🚑 Starting Repair & Upgrade Operation..."

# 1. REPAIR DASHBOARD.JSX (Fixing the Unterminated JSX error)
# -----------------------------------------------------------------------------
echo "🔧 Repairing src/pages/Dashboard.jsx..."
cat << 'EOF' > src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileSignature, 
  DollarSign, 
  MapPin, 
  Plus, 
  Clock,
  TrendingUp,
  CheckCircle2,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Award,
  Wallet
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Badge, 
  Select,
  CircularProgress,
  Skeleton,
  Progress
} from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';
import { useTheme } from '../context/ThemeContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const revenueData = [
  { name: 'Jan', amount: 2400, prev: 2100 },
  { name: 'Feb', amount: 1398, prev: 1800 },
  { name: 'Mar', amount: 9800, prev: 2200 },
  { name: 'Apr', amount: 3908, prev: 2600 },
  { name: 'May', amount: 4800, prev: 3200 },
  { name: 'Jun', amount: 3800, prev: 3500 },
  { name: 'Jul', amount: 4300, prev: 3800 },
];

const initialAppointments = [
  { id: 1, client: 'Sarah Johnson', type: 'Loan Signing', date: 'Today', time: '2:00 PM', status: 'upcoming', amount: 150, location: 'Downtown' },
  { id: 2, client: 'TechCorp Inc', type: 'I-9 Verification', date: 'Today', time: '4:30 PM', status: 'upcoming', amount: 45, location: 'Remote' },
  { id: 3, client: 'Michael Smith', type: 'Power of Attorney', date: 'Yesterday', time: '10:00 AM', status: 'completed', amount: 75, location: 'North Hills' },
];

const recentActivity = [
  { id: 1, text: 'Invoice #1024 paid by Estate Realty', time: '2h ago', type: 'money' },
  { id: 2, text: 'New client "TechCorp" added', time: '5h ago', type: 'user' },
  { id: 3, text: 'Mileage log exported for Q3', time: '1d ago', type: 'file' },
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

const AIInsightWidget = ({ loading }) => {
  if (loading) return <Skeleton className="w-full h-32 rounded-xl" />;
  
  return (
    <Card className="bg-gradient-to-r from-violet-600 to-indigo-600 border-none text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-20">
        <Sparkles className="w-24 h-24" />
      </div>
      <CardContent className="relative z-10 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">AI Insight</span>
        </div>
        <h4 className="text-lg font-bold mb-1">Revenue spike detected on Fridays</h4>
        <p className="text-indigo-100 text-sm mb-3">
          Your data shows a 40% increase in Loan Signings at the end of the week. Consider opening more Friday afternoon slots.
        </p>
        <div className="flex gap-2">
           <Button size="xs" className="bg-white/20 hover:bg-white/30 text-white border-0">View Report</Button>
           <Button size="xs" className="bg-transparent hover:bg-white/10 text-white border-0">Dismiss</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SetupProgress = ({ loading }) => {
  if (loading) return <Skeleton className="w-full h-24 rounded-xl" />;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="py-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" /> Setup Progress
          </h4>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">75%</span>
        </div>
        <Progress value={75} className="h-2 mb-2" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Almost there! Add your first <span className="text-slate-900 dark:text-white font-medium">Invoice</span> to reach 100%.
        </p>
      </CardContent>
    </Card>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-blue-200">Revenue: <span className="text-white font-bold ml-1">${payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState(initialAppointments);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const totalRevenue = 12450 + appointments.reduce((sum, apt) => sum + (typeof apt.amount === 'number' ? apt.amount : 0), 0);
  const upcomingCount = appointments.filter(a => a.status === 'upcoming').length;
  
  // New Metric Calculation
  const estimatedExpense = 1200; // Mock overhead
  const netProfit = totalRevenue - estimatedExpense;
  const profitMargin = Math.round((netProfit / totalRevenue) * 100);
  
  const monthlyGoal = 15000;
  const currentMonthRevenue = 9800;
  const goalPercent = Math.min(100, Math.round((currentMonthRevenue / monthlyGoal) * 100));

  const handleSaveAppointment = (data) => {
    const newApt = {
      id: Date.now(),
      client: data.client,
      type: data.type,
      date: 'Upcoming', 
      time: data.time,
      status: 'upcoming',
      amount: parseFloat(data.fee) || 0,
      location: data.location || 'TBD'
    };
    setAppointments([newApt, ...appointments]);
  };

  const chartStroke = theme === 'dark' ? '#3b82f6' : '#2563eb';
  const gridStroke = theme === 'dark' ? '#334155' : '#e2e8f0';

  return (
    <div className="min-h-screen pb-20">
      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveAppointment}
      />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
             {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </p>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" className="relative">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </header>

      {/* TOP ROW WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
           <AIInsightWidget loading={loading} />
        </div>
        <div>
           <SetupProgress loading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="12.5%" trend="up" icon={DollarSign} loading={loading} />
        {/* REPLACED SIGNINGS with NET PROFIT */}
        <StatsCard title="Net Profit (Est)" value={`$${netProfit.toLocaleString()}`} change={`${profitMargin}% Margin`} trend="up" icon={Wallet} loading={loading} />
        <StatsCard title="Signings" value="52" change="4.2%" trend="up" icon={FileSignature} loading={loading} />
        <StatsCard title="Mileage Deduct." value="$564" change="0.8%" trend="down" icon={MapPin} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <Card className="h-[400px]">
            <CardHeader>
              <div>
                <CardTitle>Revenue Velocity</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">Financial performance over time</p>
              </div>
              <Select options={[{label: 'This Year', value: 'year'}]} className="w-32" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="w-full h-[300px]" /> : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartStroke} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartStroke} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="amount" stroke={chartStroke} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <Button variant="ghost" size="sm">View Calendar</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  [1,2,3].map(i => <div key={i} className="p-6"><Skeleton className="w-full h-12" /></div>)
                ) : (
                  appointments.slice(0, 5).map((apt) => (
                    <div key={apt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${
                          apt.status === 'upcoming' 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{apt.client}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                            <span className="font-medium">{apt.time}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{apt.type}</span>
                          </p>
                        </div>
                      </div>
                      <Badge variant={apt.status === 'upcoming' ? 'blue' : 'success'} className="mt-4 sm:mt-0">
                        {apt.status === 'upcoming' ? 'Scheduled' : 'Completed'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          
          <Card>
            <CardHeader><CardTitle>Business Pulse</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
              {loading ? <Skeleton className="w-32 h-32 rounded-full" /> : (
                <>
                  <CircularProgress value={goalPercent} size={180} strokeWidth={12}>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">{goalPercent}%</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">of Goal</p>
                    </div>
                  </CircularProgress>
                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Target: <span className="font-semibold text-slate-900 dark:text-white">$15,000</span></p>
                    <p className="text-xs text-emerald-500 mt-1 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" /> On track to exceed
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="px-6 pb-6 space-y-6">
                {recentActivity.map((act, i) => (
                  <div key={act.id} className="relative pl-6 border-l border-slate-200 dark:border-slate-700 last:border-0">
                    <div className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
                      act.type === 'money' ? 'bg-emerald-500' : act.type === 'user' ? 'bg-blue-500' : 'bg-slate-400'
                    }`}></div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{act.text}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{act.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

           <div className="bg-slate-900 dark:bg-black rounded-xl p-6 text-white relative overflow-hidden">
             <div className="relative z-10">
               <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                 <Award className="w-6 h-6 text-white" />
               </div>
               <h4 className="font-bold text-lg mb-2">Pro Tip</h4>
               <p className="text-slate-300 text-sm mb-4">Press <kbd className="bg-white/20 px-1 py-0.5 rounded text-white font-mono">Cmd + K</kbd> to search or take quick actions.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
EOF

# 2. UPGRADE TO V7 (Add Settings, Form Components, and Router)
# -----------------------------------------------------------------------------
echo "🚀 Applying V7 Upgrade (Settings & UI Components)..."

echo "🎨 Updating src/components/UI.jsx..."
cat << 'EOF' > src/components/UI.jsx
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- LAYOUT ---
export const Card = ({ children, className }) => (
  <div className={cn(
    "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-200 hover:shadow-md dark:shadow-slate-900/50", 
    className
  )}>
    {children}
  </div>
);

export const CardHeader = ({ children, className }) => (
  <div className={cn("px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between", className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className }) => (
  <h3 className={cn("text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight", className)}>
    {children}
  </h3>
);

export const CardContent = ({ children, className }) => (
  <div className={cn("p-6 text-slate-900 dark:text-slate-200", className)}>
    {children}
  </div>
);

// --- INTERACTIVE ---
export const Button = ({ children, variant = 'primary', size = 'default', className, ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm shadow-blue-500/20 hover:shadow-blue-500/40 border border-transparent",
    secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100",
    danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-transparent",
    outline: "bg-transparent border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600"
  };
  
  const sizes = {
    xs: "h-7 px-2 text-xs",
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10 p-2 flex items-center justify-center",
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600",
    success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
    warning: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
    danger: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800",
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", variants[variant], className)}>
      {children}
    </span>
  );
};

// --- FORM ELEMENTS ---
export const Input = ({ className, ...props }) => (
  <input
    className={cn(
      "flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-50 transition-all",
      className
    )}
    {...props}
  />
);

export const Label = ({ className, children, ...props }) => (
  <label
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300 mb-2 block",
      className
    )}
    {...props}
  >
    {children}
  </label>
);

export const Select = ({ value, onChange, options, className }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className={cn(
        "appearance-none w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 px-3 pr-8 rounded-lg leading-tight focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm h-10",
        className
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  </div>
);

// --- VISUALIZATION ---
export const Progress = ({ value, max = 100, className, indicatorClassName }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden", className)}>
      <div 
        className={cn("h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 ease-out", indicatorClassName)} 
        style={{ width: `${percentage}%` }}
      />
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-blue-600 dark:text-blue-500 transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export const Skeleton = ({ className }) => (
  <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-700 rounded", className)} />
);
EOF

echo "⚙️  Creating src/pages/Settings.jsx..."
cat << 'EOF' > src/pages/Settings.jsx
import React, { useState } from 'react';
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  CreditCard, 
  Save, 
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select } from '../components/UI';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, toggleTheme } = useTheme();
  
  // Mock State
  const [formData, setFormData] = useState({
    name: 'Dain Antonio',
    email: 'dain@example.com',
    businessName: 'Antonio Mobile Notary',
    costPerMile: '0.67',
    taxRate: '15'
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'preferences', label: 'Preferences', icon: Bell },
  ];

  const handleSave = () => {
    // In a real app, this would write to Firebase/Database
    alert('Settings Saved! (Simulation)');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account and business preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            
            <div className="my-2 border-t border-slate-200 dark:border-slate-700 hidden md:block"></div>
            
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full text-left">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Public Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-400">
                    DA
                  </div>
                  <div className="space-y-2">
                    <Button variant="secondary" size="sm">Upload New Picture</Button>
                    <p className="text-xs text-slate-500 dark:text-slate-400">JPG, GIF or PNG. Max size 800K.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BUSINESS SETTINGS */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Business Legal Name</Label>
                    <Input 
                      value={formData.businessName} 
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})} 
                      placeholder="e.g. Acme Notary Services LLC"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label>Mileage Rate ($)</Label>
                       <Input 
                        type="number" 
                        value={formData.costPerMile} 
                        onChange={(e) => setFormData({...formData, costPerMile: e.target.value})}
                       />
                       <p className="text-xs text-slate-500">Used to calculate tax deductions.</p>
                    </div>
                    <div className="space-y-2">
                       <Label>Est. Tax Rate (%)</Label>
                       <Input 
                        type="number" 
                        value={formData.taxRate} 
                        onChange={(e) => setFormData({...formData, taxRate: e.target.value})}
                       />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Update Business</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                 <CardHeader><CardTitle>Data Management</CardTitle></CardHeader>
                 <CardContent>
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="font-medium text-slate-900 dark:text-white">Export Data</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Download all your invoices and clients as CSV.</p>
                       </div>
                       <Button variant="secondary">Export CSV</Button>
                    </div>
                 </CardContent>
              </Card>
            </div>
          )}

          {/* PREFERENCES */}
          {activeTab === 'preferences' && (
             <Card>
               <CardHeader><CardTitle>Appearance & Notifications</CardTitle></CardHeader>
               <CardContent className="space-y-6">
                 
                 <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Theme</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Customize how NotaryFix looks on your device.</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => theme === 'dark' && toggleTheme()}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-2 w-24 ${theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                       >
                         <Sun className="w-5 h-5" />
                         <span className="text-xs font-medium">Light</span>
                       </button>
                       <button 
                        onClick={() => theme === 'light' && toggleTheme()}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-2 w-24 ${theme === 'dark' ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                       >
                         <Moon className="w-5 h-5" />
                         <span className="text-xs font-medium">Dark</span>
                       </button>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="font-medium text-slate-900 dark:text-white mb-2">Email Notifications</p>
                    {['New Appointment Booked', 'Invoice Paid', 'Weekly Summary'].map(item => (
                       <label key={item} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
                       </label>
                    ))}
                 </div>

               </CardContent>
             </Card>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
EOF

echo "🔗 Wiring Settings Page into Router..."
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

echo "✅ Repair and Upgrade Complete!"
echo "👉 The Dashboard error is fixed, and the Settings page is now live."