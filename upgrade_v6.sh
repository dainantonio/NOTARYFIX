#!/bin/bash

echo "🚀 Initiating V6 Upgrade..."
echo "📊 Implementing Invoice Kanban Board & Net Profit Metrics..."

# 1. UPGRADE INVOICES PAGE (Add Kanban View)
# -----------------------------------------------------------------------------
echo "🗂️  Refactoring Invoices.jsx to support Kanban Board..."
cat << 'EOF' > src/pages/Invoices.jsx
import React, { useState } from 'react';
import { 
  Plus, 
  Download, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/UI';

const Invoices = () => {
  const [viewMode, setViewMode] = useState('board'); // 'list' or 'board'

  const invoices = [
    { id: 'INV-1024', client: 'Estate Realty', amount: 150.00, date: 'Oct 24, 2025', status: 'Paid', due: 'Oct 24, 2025' },
    { id: 'INV-1023', client: 'TechCorp Inc', amount: 450.00, date: 'Oct 22, 2025', status: 'Pending', due: 'Nov 01, 2025' },
    { id: 'INV-1022', client: 'Sarah Johnson', amount: 75.00, date: 'Oct 20, 2025', status: 'Overdue', due: 'Oct 21, 2025' },
    { id: 'INV-1021', client: 'Legal Partners LLP', amount: 200.00, date: 'Oct 15, 2025', status: 'Paid', due: 'Oct 15, 2025' },
    { id: 'INV-1025', client: 'Title Source', amount: 125.00, date: 'Oct 25, 2025', status: 'Draft', due: 'TBD' },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Paid': return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</Badge>;
      case 'Pending': return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'Overdue': return <Badge variant="danger" className="gap-1"><AlertCircle className="w-3 h-3" /> Overdue</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  // Group invoices for Kanban
  const columns = {
    'Draft': invoices.filter(i => i.status === 'Draft'),
    'Pending': invoices.filter(i => i.status === 'Pending'),
    'Overdue': invoices.filter(i => i.status === 'Overdue'),
    'Paid': invoices.filter(i => i.status === 'Paid'),
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400">Track payments and manage billing pipeline.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button variant="secondary" className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-none text-white shadow-lg shadow-blue-500/20">
          <CardContent className="p-6 text-white">
            <p className="text-blue-100 font-medium mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Collected (Oct)</p>
            <h3 className="text-3xl font-bold">$4,250.00</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Outstanding</p>
            <h3 className="text-3xl font-bold text-amber-500">$850.00</h3>
          </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Overdue</p>
            <h3 className="text-3xl font-bold text-red-500">$75.00</h3>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'list' ? (
        <Card>
           <CardHeader>
             <div className="flex items-center gap-4">
               <CardTitle>All Invoices</CardTitle>
             </div>
           </CardHeader>
           <CardContent className="p-0 overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                 <tr>
                   <th className="px-6 py-4">Invoice ID</th>
                   <th className="px-6 py-4">Client</th>
                   <th className="px-6 py-4">Date Issued</th>
                   <th className="px-6 py-4">Due Date</th>
                   <th className="px-6 py-4">Amount</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                 {invoices.map((inv) => (
                   <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                     <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{inv.id}</td>
                     <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inv.client}</td>
                     <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.date}</td>
                     <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.due}</td>
                     <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${inv.amount.toFixed(2)}</td>
                     <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                     <td className="px-6 py-4 text-right">
                       <Button variant="ghost" size="sm">
                         <MoreHorizontal className="w-4 h-4" />
                       </Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </CardContent>
        </Card>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(columns).map(([title, items]) => (
            <div key={title} className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">{items.length}</span>
              </div>
              
              <div className="flex flex-col gap-3 min-h-[200px]">
                {items.length === 0 ? (
                  <div className="h-24 rounded-lg border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">
                    No invoices
                  </div>
                ) : (
                  items.map(inv => (
                    <Card key={inv.id} className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-slate-400">{inv.id}</span>
                        {getStatusBadge(inv.status)}
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{inv.client}</h4>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">${inv.amount.toFixed(2)}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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

export default Invoices;
EOF

# 2. UPDATE DASHBOARD TO SHOW NET PROFIT
# -----------------------------------------------------------------------------
echo "💵 Injecting Net Profit logic into Dashboard.jsx..."
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

echo "✅ V6 Upgrade Complete! Check out the Kanban Board and Net Profit."