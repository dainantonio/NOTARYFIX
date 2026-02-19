import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileSignature, 
  DollarSign, 
  MapPin, 
  Plus, 
  ChevronRight, 
  Clock,
  TrendingUp,
  CheckCircle2,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Target,
  Zap,
  Briefcase
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
  Skeleton
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

// --- MOCK DATA ---
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

// --- COMPONENTS ---

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

const WelcomeBanner = ({ name, count }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-500/20 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-32 blur-3xl"></div>
      <div className="relative z-10">
        <h1 className="text-3xl font-bold mb-2">{greeting}, {name}.</h1>
        <p className="text-blue-100 text-lg max-w-2xl">
          You have <span className="font-semibold bg-white/20 px-2 py-0.5 rounded">{count} appointments</span> scheduled for today. 
          Your revenue is trending <span className="font-semibold text-emerald-300">up 12.5%</span> this month.
        </p>
      </div>
    </div>
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

// --- MAIN PAGE ---

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState(initialAppointments);
  const { theme } = useTheme();

  // Simulate data fetching
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Logic
  const totalRevenue = 12450 + appointments.reduce((sum, apt) => sum + (typeof apt.amount === 'number' ? apt.amount : 0), 0);
  const upcomingCount = appointments.filter(a => a.status === 'upcoming').length;
  const avgFee = Math.round(totalRevenue / (48 + appointments.length)); // Mock calculation
  
  // Goal Calculation
  const monthlyGoal = 15000;
  const currentMonthRevenue = 9800; // Mock current month
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

      {/* Header Controls */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           {/* Breadcrumbs or Date could go here */}
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
             {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white w-64 shadow-sm" />
          </div>
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

      {loading ? (
        <Skeleton className="w-full h-48 mb-8 rounded-2xl" />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <WelcomeBanner name="Dain" count={upcomingCount} />
        </motion.div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="12.5%" trend="up" icon={DollarSign} loading={loading} />
        <StatsCard title="Signings" value="52" change="4.2%" trend="up" icon={FileSignature} loading={loading} />
        <StatsCard title="Avg. Fee" value={`$${avgFee}`} change="1.8%" trend="up" icon={Briefcase} loading={loading} />
        <StatsCard title="Mileage Deduct." value="$564" change="0.8%" trend="down" icon={MapPin} loading={loading} />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts & Tables */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart */}
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

          {/* Appointments Table */}
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

        {/* Right Column: Widgets */}
        <div className="space-y-8">
          
          {/* Business Health / Goal Widget */}
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

          {/* Recent System Activity Feed */}
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

          {/* Smart Action: Tax/Mileage */}
           <div className="bg-slate-900 dark:bg-black rounded-xl p-6 text-white relative overflow-hidden">
             <div className="relative z-10">
               <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                 <Target className="w-6 h-6 text-white" />
               </div>
               <h4 className="font-bold text-lg mb-2">Q4 Goals</h4>
               <p className="text-slate-300 text-sm mb-4">You need 12 more signings to hit your quarterly bonus target.</p>
               <Button size="sm" className="w-full bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-800 dark:text-white">View Targets</Button>
             </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
