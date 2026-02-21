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
  GripVertical,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Select, CircularProgress, Skeleton, Progress } from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: 'Jan', amount: 2400, prev: 2100 },
  { name: 'Feb', amount: 1398, prev: 1800 },
  { name: 'Mar', amount: 9800, prev: 2200 },
  { name: 'Apr', amount: 3908, prev: 2600 },
  { name: 'May', amount: 4800, prev: 3200 },
  { name: 'Jun', amount: 3800, prev: 3500 },
  { name: 'Jul', amount: 4300, prev: 3800 },
];

const DEFAULT_WIDGET_ORDER = ['ai-insight', 'setup-progress', 'revenue-velocity', 'upcoming-schedule', 'monthly-goal', 'pipeline-health', 'pro-tip'];

const WIDGET_LAYOUT = {
  'ai-insight': 'xl:col-span-8',
  'setup-progress': 'xl:col-span-4',
  'revenue-velocity': 'xl:col-span-8',
  'upcoming-schedule': 'xl:col-span-8',
  'monthly-goal': 'xl:col-span-4',
  'pipeline-health': 'xl:col-span-4',
  'pro-tip': 'xl:col-span-4',
};

const StatsCard = ({ title, value, change, icon: Icon, trend, loading }) => (
  <Card className="border border-slate-200/70 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700">
    <CardContent className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-600 dark:bg-slate-700">
          <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </div>
        {loading ? (
          <Skeleton className="h-6 w-14" />
        ) : (
          <Badge variant={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'default'} className="flex items-center gap-1">
            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
            {change}
          </Badge>
        )}
      </div>
      <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      {loading ? <Skeleton className="h-8 w-24" /> : <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</h3>}
    </CardContent>
  </Card>
);

const AIInsightWidget = ({ loading, onOpenReport }) => {
  if (loading) return <Skeleton className="h-36 w-full rounded-xl" />;
  return (
    <Card className="border-none bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
      <CardContent className="p-6 text-white">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">AI Insight</span>
        </div>
        <h4 className="mb-1 text-lg font-bold">Revenue spike detected on Fridays</h4>
        <p className="mb-4 text-sm text-indigo-100">Your data shows a 40% increase in Loan Signings at week-end. Consider opening more Friday afternoon slots.</p>
        <Button size="xs" onClick={onOpenReport} className="border-0 bg-white/20 text-white hover:bg-white/30">View Report</Button>
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
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Zap className="h-4 w-4 text-blue-500" /> Setup Progress</h4>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{percent}%</span>
        </div>
        <Progress value={percent} className="mb-3 h-2" />
        <div className="space-y-2">
          {checklist.map((item) => (
            <button key={item.id} onClick={() => onToggle(item.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-slate-700">
              <span className={`h-3 w-3 rounded-full border ${item.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-400'}`} />
              <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}>{item.label}</span>
            </button>
          ))}
        </div>
        <Button
          size="xs"
          className="mt-4 w-full"
          disabled={!hasIncomplete}
          onClick={onCompleteNext}
        >
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
  const [setupChecklist, setSetupChecklist] = useState([
    { id: 'profile', label: 'Complete business profile', done: true },
    { id: 'client', label: 'Add first client', done: true },
    { id: 'invoice', label: 'Create first invoice', done: false },
    { id: 'payment', label: 'Connect payout settings', done: false },
  ]);
  const [widgetOrder, setWidgetOrder] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDGET_ORDER;
    const saved = localStorage.getItem('dashboard_widget_order');
    if (!saved) return DEFAULT_WIDGET_ORDER;

    try {
      const parsed = JSON.parse(saved);
      const valid = parsed.filter((id) => DEFAULT_WIDGET_ORDER.includes(id));
      const missing = DEFAULT_WIDGET_ORDER.filter((id) => !valid.includes(id));
      return [...valid, ...missing];
    } catch {
      return DEFAULT_WIDGET_ORDER;
    }
  });
  const [draggingWidgetId, setDraggingWidgetId] = useState(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState(null);

  const { theme } = useTheme();
  const navigate = useNavigate();
  const { data, addAppointment } = useData();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_widget_order', JSON.stringify(widgetOrder));
    }
  }, [widgetOrder]);

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

  const chartStroke = theme === 'dark' ? '#3b82f6' : '#2563eb';
  const gridStroke = theme === 'dark' ? '#334155' : '#e2e8f0';

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
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_chart_type', value);
    }
  };

  const moveWidget = (draggedId, targetId) => {
    if (!draggedId || draggedId === targetId) return;

    setWidgetOrder((prev) => {
      const next = [...prev];
      const fromIndex = next.indexOf(draggedId);
      const toIndex = next.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggedId);
      return next;
    });
  };

  const widgetContent = {
    'ai-insight': <AIInsightWidget loading={loading} onOpenReport={() => navigate('/invoices')} />,
    'setup-progress': <SetupProgress loading={loading} checklist={setupChecklist} onToggle={toggleSetup} onCompleteNext={completeNextSetup} />,
    'revenue-velocity': (
      <Card className="h-[420px] border-slate-200/70 dark:border-slate-700">
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
    ),
    'upcoming-schedule': (
      <Card className="border-slate-200/70 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>Upcoming Schedule</CardTitle>
            <Badge variant="blue">{upcomingCount} Pending</Badge>
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
                    <div className={`rounded-xl p-3 ${apt.status === 'upcoming' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
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
    ),
    'monthly-goal': (
      <Card className="border-slate-200/70 dark:border-slate-700">
        <CardHeader><CardTitle>Monthly Goal</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center">
          {loading ? (
            <Skeleton className="h-32 w-32 rounded-full" />
          ) : (
            <CircularProgress value={goalPercent} size={180} strokeWidth={12}>
              <div className="text-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{goalPercent}%</span>
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">of ${data.settings.monthlyGoal.toLocaleString()}</p>
              </div>
            </CircularProgress>
          )}
        </CardContent>
      </Card>
    ),
    'pipeline-health': (
      <Card className="border-slate-200/70 dark:border-slate-700">
        <CardHeader><CardTitle>Pipeline Health</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><span className="text-slate-500 dark:text-slate-300">Upcoming</span><span className="font-bold">{upcomingCount}</span></div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><span className="text-slate-500 dark:text-slate-300">Completed</span><span className="font-bold">{completedCount}</span></div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><span className="text-slate-500 dark:text-slate-300">Avg per signing</span><span className="font-bold">${avgTicket}</span></div>
        </CardContent>
      </Card>
    ),
    'pro-tip': (
      <Card className="overflow-hidden border-slate-200/70 bg-slate-900 text-white dark:border-slate-700 dark:bg-black">
        <CardContent className="p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600"><Award className="h-6 w-6 text-white" /></div>
          <h4 className="mb-2 text-lg font-bold">Pro Tip</h4>
          <p className="mb-4 text-sm text-slate-300">
            Use <kbd className="rounded bg-white/20 px-1 py-0.5 font-mono text-white">Cmd + K</kbd> on Mac or <kbd className="rounded bg-white/20 px-1 py-0.5 font-mono text-white">Ctrl + K</kbd> on Windows for quick actions.
          </p>
          <Button size="sm" className="bg-white/20 text-white hover:bg-white/30" onClick={() => navigate('/clients')}>Open Clients</Button>
        </CardContent>
      </Card>
    ),
  };

  return (
    <div className="min-h-screen pb-10">
      <div className="mx-auto max-w-[1400px] space-y-8 px-5 py-8 md:px-8">
        <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveAppointment} />

        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Executive Overview, {data.settings.name.split(' ')[0]}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 md:flex">
              <Search className="h-4 w-4" /> Search dashboard
            </div>
            <Button variant="secondary" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500 dark:border-slate-800"></span>
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-blue-500/20"><Plus className="mr-2 h-4 w-4" /> New Appointment</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-slate-200/70 dark:border-slate-700"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs uppercase text-slate-500">Avg Ticket</p><p className="text-xl font-bold">${avgTicket}</p></div><TrendingUp className="h-5 w-5 text-emerald-500" /></CardContent></Card>
          <Card className="border-slate-200/70 dark:border-slate-700"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs uppercase text-slate-500">Completion Rate</p><p className="text-xl font-bold">{completionRate}%</p></div><CheckCircle2 className="h-5 w-5 text-blue-500" /></CardContent></Card>
          <Card className="border-slate-200/70 dark:border-slate-700"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs uppercase text-slate-500">Upcoming Today</p><p className="text-xl font-bold">{upcomingCount}</p></div><Clock className="h-5 w-5 text-violet-500" /></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="12.5%" trend="up" icon={DollarSign} loading={loading} />
          <StatsCard title="Net Profit (Est)" value={`$${netProfit.toLocaleString()}`} change={`${profitMargin}% Margin`} trend="up" icon={Wallet} loading={loading} />
          <StatsCard title="Signings" value={52 + data.appointments.length} change="4.2%" trend="up" icon={FileSignature} loading={loading} />
          <StatsCard title="Mileage Deduct." value="$564" change="0.8%" trend="down" icon={MapPin} loading={loading} />
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-300">
          Drag and drop dashboard cards to personalize layout. This is a strong option for power users, because teams can prioritize what they need most.
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {widgetOrder.map((widgetId) => (
            <section
              key={widgetId}
              draggable
              onDragStart={() => setDraggingWidgetId(widgetId)}
              onDragEnd={() => {
                setDraggingWidgetId(null);
                setDragOverWidgetId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (dragOverWidgetId !== widgetId) {
                  setDragOverWidgetId(widgetId);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                moveWidget(draggingWidgetId, widgetId);
                setDragOverWidgetId(null);
              }}
              className={`${WIDGET_LAYOUT[widgetId] || 'xl:col-span-4'} transition ${dragOverWidgetId === widgetId ? 'scale-[1.01]' : ''}`}
            >
              <div className={`mb-2 flex items-center justify-end ${draggingWidgetId === widgetId ? 'opacity-70' : ''}`}>
                <span className="inline-flex cursor-grab items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <GripVertical className="h-3.5 w-3.5" /> Drag card
                </span>
              </div>
              {widgetContent[widgetId]}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
