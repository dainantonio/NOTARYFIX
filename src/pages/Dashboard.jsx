import React, { useEffect, useMemo, useState } from 'react';
import {
  FileSignature,
  DollarSign,
  MapPin,
  Plus,
  Clock,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Award,
  Wallet,
  Search,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  CalendarClock,
  BarChart3,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Select, CircularProgress, Skeleton, Progress } from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: 'Jan', amount: 2400 },
  { name: 'Feb', amount: 1398 },
  { name: 'Mar', amount: 9800 },
  { name: 'Apr', amount: 3908 },
  { name: 'May', amount: 4800 },
  { name: 'Jun', amount: 3800 },
  { name: 'Jul', amount: 4300 },
];

const DASHBOARD_PROFILES = {
  owner: {
    label: 'Owner View',
    heroSubtitle: 'Executive visibility on growth, profit, and strategic bottlenecks.',
    primaryKpi: { title: 'Net Profit', accent: 'purple' },
    quickActions: [
      { label: 'Create Appointment', icon: FileSignature, action: 'newAppointment', variant: 'primary' },
      { label: 'Open Invoices', icon: BarChart3, action: 'invoices', variant: 'secondary' },
      { label: 'Open Clients', icon: Users, action: 'clients', variant: 'secondary' },
      { label: 'Business Settings', icon: MapPin, action: 'settings', variant: 'secondary' },
    ],
    proTip: 'Owner focus: review margin trends daily and clear pending invoices before end-of-week.',
  },
  operator: {
    label: 'Operator View',
    heroSubtitle: 'Execution-focused workflow for scheduling, fulfillment, and same-day actions.',
    primaryKpi: { title: 'Upcoming Signings', accent: 'orange' },
    quickActions: [
      { label: 'Create Appointment', icon: FileSignature, action: 'newAppointment', variant: 'primary' },
      { label: 'Open Calendar', icon: CalendarClock, action: 'schedule', variant: 'secondary' },
      { label: 'Open Clients', icon: Users, action: 'clients', variant: 'secondary' },
      { label: 'Open Invoices', icon: BarChart3, action: 'invoices', variant: 'secondary' },
    ],
    proTip: 'Operator focus: block similar service types together to reduce travel/context-switching.',
  },
};

const StatsCard = ({ title, value, change, icon: Icon, trend, loading, accent = 'blue' }) => {
  const accentStyles = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-amber-500',
    purple: 'from-violet-500 to-fuchsia-500',
  };

  return (
    <Card className={`border-0 bg-gradient-to-br ${accentStyles[accent]} text-white shadow-lg`}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-lg bg-white/20 p-2">
            <Icon className="h-5 w-5 text-white" />
          </div>
          {loading ? (
            <Skeleton className="h-6 w-14 bg-white/20" />
          ) : (
            <Badge variant="default" className="border-0 bg-white/20 text-white">
              {trend === 'up' ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
              {change}
            </Badge>
          )}
        </div>
        <p className="mb-1 text-xs uppercase tracking-wider text-white/80">{title}</p>
        {loading ? <Skeleton className="h-8 w-24 bg-white/20" /> : <h3 className="text-3xl font-bold tracking-tight">{value}</h3>}
      </CardContent>
    </Card>
  );
};

const SetupProgress = ({ loading, checklist, onToggle, onCompleteNext }) => {
  if (loading) return <Skeleton className="h-36 w-full rounded-xl" />;
  const completed = checklist.filter((i) => i.done).length;
  const percent = Math.round((completed / checklist.length) * 100);
  const hasIncomplete = checklist.some((i) => !i.done);

  return (
    <Card className="border-slate-200/70 dark:border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Zap className="h-4 w-4 text-blue-500" /> Setup Progress</CardTitle>
          <Badge variant="blue">{percent}%</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={percent} className="mb-4 h-2" />
        <div className="space-y-2">
          {checklist.map((item) => (
            <button key={item.id} onClick={() => onToggle(item.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-slate-700">
              <span className={`h-3 w-3 rounded-full border ${item.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-400'}`} />
              <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}>{item.label}</span>
            </button>
          ))}
        </div>
        <Button size="xs" className="mt-4 w-full" disabled={!hasIncomplete} onClick={onCompleteNext}>
          {hasIncomplete ? 'Complete next setup step' : 'Setup complete'}
        </Button>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartType, setChartType] = useState(() => {
    if (typeof window === 'undefined') return 'area';
    return localStorage.getItem('dashboard_chart_type') || 'area';
  });
  const [dashboardRole, setDashboardRole] = useState(() => {
    if (typeof window === 'undefined') return 'owner';
    const saved = localStorage.getItem('dashboard_role_profile');
    return saved && DASHBOARD_PROFILES[saved] ? saved : 'owner';
  });
  const [setupChecklist, setSetupChecklist] = useState([
    { id: 'profile', label: 'Complete business profile', done: true },
    { id: 'client', label: 'Add first client', done: true },
    { id: 'invoice', label: 'Create first invoice', done: false },
    { id: 'payment', label: 'Connect payout settings', done: false },
  ]);

  const { theme } = useTheme();
  const navigate = useNavigate();
  const { data, addAppointment } = useData();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const totalRevenue = 12450 + data.appointments.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0);
  const upcomingCount = data.appointments.filter((a) => a.status === 'upcoming').length;
  const completedCount = data.appointments.filter((a) => a.status === 'completed').length;

  const estimatedExpense = 1200;
  const netProfit = totalRevenue - estimatedExpense;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const currentMonthRevenue = 9800 + data.appointments.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0);
  const goalPercent = Math.min(100, Math.round((currentMonthRevenue / data.settings.monthlyGoal) * 100));

  const avgTicket = useMemo(() => {
    const all = 52 + data.appointments.length;
    return all > 0 ? Math.round(totalRevenue / all) : 0;
  }, [data.appointments.length, totalRevenue]);

  const completionRate = useMemo(() => {
    const total = upcomingCount + completedCount;
    return total ? Math.round((completedCount / total) * 100) : 0;
  }, [upcomingCount, completedCount]);

  const upcomingAppointments = useMemo(
    () => data.appointments.filter((apt) => apt.status === 'upcoming').slice(0, 5),
    [data.appointments],
  );
  const activeProfile = DASHBOARD_PROFILES[dashboardRole] || DASHBOARD_PROFILES.owner;

  const handleSaveAppointment = (formData) => {
    addAppointment({
      id: Date.now(),
      client: formData.client,
      type: formData.type,
      date: formData.date || 'Upcoming',
      time: formData.time,
      status: 'upcoming',
      amount: parseFloat(formData.fee) || 0,
      location: formData.location || 'TBD',
      notes: formData.notes || '',
      receiptName: formData.receiptName || '',
      receiptImage: formData.receiptImage || '',
    });
  };

  const toggleSetup = (id) => {
    setSetupChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const completeNextSetup = () => {
    setSetupChecklist((prev) => {
      const nextIncompleteIndex = prev.findIndex((item) => !item.done);
      if (nextIncompleteIndex < 0) return prev;
      return prev.map((item, index) => (index === nextIncompleteIndex ? { ...item, done: true } : item));
    });
  };

  const handleChartTypeChange = (value) => {
    setChartType(value);
    if (typeof window !== 'undefined') localStorage.setItem('dashboard_chart_type', value);
  };

  const handleRoleProfileChange = (value) => {
    setDashboardRole(value);
    if (typeof window !== 'undefined') localStorage.setItem('dashboard_role_profile', value);
  };

  const runQuickAction = (action) => {
    if (action === 'newAppointment') return setIsModalOpen(true);
    if (action === 'schedule') return navigate('/schedule');
    if (action === 'clients') return navigate('/clients');
    if (action === 'invoices') return navigate('/invoices');
    if (action === 'settings') return navigate('/settings');
  };

  const chartStroke = theme === 'dark' ? '#60a5fa' : '#2563eb';
  const gridStroke = theme === 'dark' ? '#334155' : '#e2e8f0';

  return (
    <div className="min-h-screen pb-10">
      <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-8 md:px-8">
        <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveAppointment} />

        <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Enterprise Command Center</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Good {new Date().getHours() >= 12 ? 'afternoon' : 'morning'}, {data.settings.name.split(' ')[0]}</h1>
              <p className="mt-1 text-sm text-slate-200">{activeProfile.heroSubtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={dashboardRole}
                onChange={(e) => handleRoleProfileChange(e.target.value)}
                options={Object.entries(DASHBOARD_PROFILES).map(([value, profile]) => ({ value, label: profile.label }))}
                className="w-40 border-white/20 bg-white/10 text-white"
              />
              <div className="hidden items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/90 md:flex">
                <Search className="h-4 w-4" /> Search dashboard
              </div>
              <Button variant="secondary" size="icon" className="relative border-white/20 bg-white/10 text-white hover:bg-white/20">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
              <Button onClick={() => setIsModalOpen(true)} className="border-0 bg-blue-500 text-white hover:bg-blue-600"><Plus className="mr-2 h-4 w-4" /> New Appointment</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="12.5%" trend="up" icon={DollarSign} loading={loading} accent="blue" />
          <StatsCard title="Completion Rate" value={`${completionRate}%`} change="6.2%" trend="up" icon={CheckCircle2} loading={loading} accent="green" />
          <StatsCard title="Upcoming Signings" value={`${upcomingCount}`} change="3 today" trend="up" icon={CalendarClock} loading={loading} accent="orange" />
          <StatsCard title="Net Profit" value={`$${netProfit.toLocaleString()}`} change={`${profitMargin}% margin`} trend="up" icon={Wallet} loading={loading} accent="purple" />
        </div>

        <Card className="border-slate-200/70 dark:border-slate-700">
          <CardContent className="flex items-center justify-between p-4 text-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Badge variant="blue">Profile</Badge>
              <span>{activeProfile.label}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">Saved automatically for this browser.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="space-y-6 xl:col-span-8">
            <Card className="h-[420px] border-slate-200/70 shadow-sm dark:border-slate-700">
              <CardHeader>
                <div>
                  <CardTitle>Revenue Velocity</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Financial performance over time</p>
                </div>
                <Select value={chartType} onChange={(e) => handleChartTypeChange(e.target.value)} options={[{ label: 'Area', value: 'area' }, { label: 'Bar', value: 'bar' }]} className="w-28" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'area' ? (
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartStroke} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={chartStroke} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="amount" stroke={chartStroke} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      ) : (
                        <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                          <RechartsTooltip />
                          <Bar dataKey="amount" fill={chartStroke} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CardTitle>Upcoming Schedule</CardTitle>
                    <Badge variant="blue">{upcomingCount} Pending</Badge>
                  </div>
                  <Button size="xs" variant="secondary" onClick={() => navigate('/schedule')}>Open Calendar <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                    [1, 2, 3].map((i) => <div key={i} className="p-6"><Skeleton className="h-12 w-full" /></div>)
                  ) : upcomingAppointments.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No appointments scheduled.</div>
                  ) : (
                    upcomingAppointments.map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => navigate('/schedule', { state: { editAppointmentId: apt.id } })}
                        className="group flex w-full flex-col justify-between p-6 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-4">
                          <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{apt.client}</h4>
                            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <span className="font-medium">{apt.time}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                              <span>{apt.type}</span>
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4 sm:mt-0">
                          <span className="font-bold text-slate-900 dark:text-white">${apt.amount}</span>
                          <Badge variant="blue">Scheduled</Badge>
                          <span className="text-xs text-blue-600 dark:text-blue-400">Edit</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6 xl:col-span-4">
            <SetupProgress loading={loading} checklist={setupChecklist} onToggle={toggleSetup} onCompleteNext={completeNextSetup} />

            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader><CardTitle>Monthly Goal</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center">
                {loading ? (
                  <Skeleton className="h-32 w-32 rounded-full" />
                ) : (
                  <CircularProgress value={goalPercent} size={170} strokeWidth={11}>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">{goalPercent}%</span>
                      <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">of ${data.settings.monthlyGoal.toLocaleString()}</p>
                    </div>
                  </CircularProgress>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {activeProfile.quickActions.map((actionItem) => {
                  const ActionIcon = actionItem.icon;
                  return (
                    <Button key={actionItem.label} className="w-full justify-start" variant={actionItem.variant === 'primary' ? 'default' : 'secondary'} onClick={() => runQuickAction(actionItem.action)}>
                      <ActionIcon className="mr-2 h-4 w-4" /> {actionItem.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <CardContent className="p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20"><Award className="h-6 w-6" /></div>
                <h4 className="mb-2 text-lg font-bold">Premium Pro Tip</h4>
                <p className="mb-4 text-sm text-indigo-100">{activeProfile.proTip}</p>
                <Button size="sm" className="bg-white/20 text-white hover:bg-white/30" onClick={() => navigate('/clients')}>Open Command Path</Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
