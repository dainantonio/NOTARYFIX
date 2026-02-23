import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowUpRight, Award, BarChart3,
  Bell, BookOpen, Brain, Building2, CalendarClock, CheckCircle2,
  ChevronDown, ChevronRight, Clock, DollarSign, FileSignature,
  FileText, MapPin, Moon, Plus, ScrollText, Search, Shield,
  Sparkles, Sun, Sunset, TrendingUp, Truck, Users, Wallet, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Select, CircularProgress, Skeleton, Progress,
} from '../components/UI';
import AppointmentModal from '../components/AppointmentModal';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getGateState } from '../utils/gates';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().split('T')[0];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { label: 'Good morning', Icon: Sun,    color: 'text-amber-400' };
  if (h < 17) return { label: 'Good afternoon', Icon: Sunset, color: 'text-orange-400' };
  return        { label: 'Good evening',   Icon: Moon,   color: 'text-indigo-400' };
};

const fmt12h = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  if (isNaN(h)) return time24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${suffix}`;
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
};

// ─── BASE REVENUE (YTD + live last point) ────────────────────────────────────
const BASE_YTD = [
  { name: 'Aug', amount: 6400  },
  { name: 'Sep', amount: 8200  },
  { name: 'Oct', amount: 11400 },
  { name: 'Nov', amount: 9800  },
  { name: 'Dec', amount: 7600  },
  { name: 'Jan', amount: 10200 },
];

// ─── TYPE ACCENT MAP ─────────────────────────────────────────────────────────
const APT_ACCENT = {
  'Loan Signing':                  { dot: 'bg-blue-500',    bar: 'border-l-2 border-blue-500' },
  'I-9 Verification':              { dot: 'bg-emerald-500', bar: 'border-l-2 border-emerald-500' },
  'General Notary Work (GNW)':     { dot: 'bg-slate-400',   bar: 'border-l-2 border-slate-400' },
  'Apostille':                     { dot: 'bg-violet-500',  bar: 'border-l-2 border-violet-500' },
  'Remote Online Notary (RON)':    { dot: 'bg-indigo-500',  bar: 'border-l-2 border-indigo-500' },
};
const aptAccent = (type) => APT_ACCENT[type] || { dot: 'bg-slate-400', bar: 'border-l-2 border-slate-300' };

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── KPI TILE ─────────────────────────────────────────────────────────────────
const KpiTile = ({ title, value, sub, Icon, accent = 'blue', loading, onClick }) => {
  const g = {
    blue:   'from-blue-500 to-blue-700',
    green:  'from-emerald-500 to-emerald-700',
    orange: 'from-orange-400 to-amber-600',
    purple: 'from-violet-500 to-fuchsia-600',
    rose:   'from-rose-500 to-pink-600',
  }[accent] || 'from-blue-500 to-blue-700';

  return (
    <button onClick={onClick}
      className={`group w-full rounded-2xl bg-gradient-to-br ${g} p-4 text-left text-white shadow-lg transition-all active:scale-[.97] hover:shadow-xl`}>
      <div className="mb-3 flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20">
          <Icon className="h-4 w-4 text-white" />
        </span>
      </div>
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/70">{title}</p>
      {loading
        ? <div className="mt-1 h-7 w-24 animate-pulse rounded-lg bg-white/20" />
        : <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      }
      {sub && !loading && <p className="mt-1 text-xs text-white/60">{sub}</p>}
    </button>
  );
};

// ─── DAILY BRIEF ─────────────────────────────────────────────────────────────
const DailyBrief = ({ data, navigate }) => {
  const today = todayISO();

  const todayApts = useMemo(() =>
    (data.appointments || [])
      .filter(a => a.date === today)
      .sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [data.appointments, today]
  );

  const pendingInvoices = useMemo(() =>
    (data.invoices || []).filter(i => i.status === 'Pending' || i.status === 'Overdue'),
    [data.invoices]
  );

  const openDispatch = useMemo(() =>
    (data.dispatchJobs || []).filter(j => j.status !== 'completed').length,
    [data.dispatchJobs]
  );

  const activeSessions = useMemo(() =>
    (data.signerSessions || []).filter(s => s.status === 'active').length,
    [data.signerSessions]
  );

  const complianceAlerts = useMemo(() => {
    const alerts = [];
    (data.complianceItems || []).forEach(c => {
      if (c.status === 'Needs Review' || c.status === 'Expired')
        alerts.push({ label: c.title, urgent: c.status === 'Expired' });
    });
    const eao = data.settings?.eAndOExpiresOn;
    if (eao) {
      const days = Math.ceil((new Date(eao) - Date.now()) / 86400000);
      if (days <= 60) alerts.push({ label: `E&O expires in ${days}d`, urgent: days <= 14 });
    }
    return alerts.slice(0, 2);
  }, [data.complianceItems, data.settings]);

  const todayEarnings = todayApts.reduce((s, a) => s + (Number(a.amount) || 0), 0);

  const items = [
    {
      Icon: CalendarClock,
      iconCls: 'text-blue-600 dark:text-blue-400',
      bgCls: 'bg-blue-50 dark:bg-blue-900/20',
      label: todayApts.length === 0
        ? 'No appointments today'
        : `${todayApts.length} appointment${todayApts.length > 1 ? 's' : ''} today`,
      sub: todayApts.length > 0
        ? `$${todayEarnings} projected · First at ${todayApts[0].time}`
        : 'Schedule is clear',
      path: '/schedule',
    },
    {
      Icon: DollarSign,
      iconCls: pendingInvoices.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
      bgCls: pendingInvoices.length > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20',
      label: pendingInvoices.length === 0
        ? 'All invoices cleared'
        : `${pendingInvoices.length} invoice${pendingInvoices.length > 1 ? 's' : ''} outstanding`,
      sub: pendingInvoices.length > 0
        ? `$${pendingInvoices.reduce((s,i) => s + Number(i.amount||0), 0).toLocaleString()} total`
        : 'Finances up to date',
      path: '/invoices',
    },
    ...(openDispatch > 0 ? [{
      Icon: Truck,
      iconCls: 'text-violet-600 dark:text-violet-400',
      bgCls: 'bg-violet-50 dark:bg-violet-900/20',
      label: `${openDispatch} dispatch job${openDispatch > 1 ? 's' : ''} open`,
      sub: 'Team coordination needed',
      path: '/team-dispatch',
    }] : []),
    ...(activeSessions > 0 ? [{
      Icon: Users,
      iconCls: 'text-indigo-600 dark:text-indigo-400',
      bgCls: 'bg-indigo-50 dark:bg-indigo-900/20',
      label: `${activeSessions} signer session${activeSessions > 1 ? 's' : ''} active`,
      sub: 'Awaiting client action',
      path: '/signer-portal',
    }] : []),
    {
      Icon: ScrollText,
      iconCls: 'text-slate-500 dark:text-slate-400',
      bgCls: 'bg-slate-50 dark:bg-slate-800/50',
      label: `${(data.journalEntries || []).length} journal entries logged`,
      sub: 'Tap to review or add',
      path: '/journal',
    },
    ...complianceAlerts.map(a => ({
      Icon: a.urgent ? AlertTriangle : Shield,
      iconCls: a.urgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
      bgCls: a.urgent ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20',
      label: a.label,
      sub: 'Compliance attention required',
      path: '/compliance',
    })),
  ];

  return (
    <Card className="border-slate-200/70 dark:border-slate-700">
      <CardHeader className="px-5 py-3.5">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-amber-400" />
          Daily Brief
        </CardTitle>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {items.map((item, i) => (
          <button key={i} onClick={() => navigate(item.path)}
            className="group flex w-full items-center gap-3 border-b border-slate-100 px-5 py-3 text-left last:border-0 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/30">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.bgCls}`}>
              <item.Icon className={`h-4 w-4 ${item.iconCls}`} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">{item.sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

// ─── TODAY'S TIMELINE ─────────────────────────────────────────────────────────
const TodayTimeline = ({ appointments, navigate }) => {
  const today = todayISO();
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();

  const todayApts = useMemo(() =>
    appointments.filter(a => a.date === today).sort((a,b) => (a.time||'').localeCompare(b.time||'')),
    [appointments, today]
  );
  const tomorrowApts = useMemo(() =>
    appointments.filter(a => a.date === tomorrow && a.status !== 'completed').sort((a,b) => (a.time||'').localeCompare(b.time||'')).slice(0,2),
    [appointments, tomorrow]
  );

  const all = [
    ...todayApts.map(a => ({ ...a, _day: 'Today' })),
    ...tomorrowApts.map(a => ({ ...a, _day: 'Tomorrow' })),
  ];

  if (all.length === 0) return (
    <div className="flex flex-col items-center py-10 text-center">
      <CalendarClock className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
      <p className="text-sm text-slate-400">Nothing scheduled yet</p>
      <button onClick={() => navigate('/schedule')}
        className="mt-2 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
        Open Calendar →
      </button>
    </div>
  );

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
      {all.map(apt => {
        const { bar } = aptAccent(apt.type);
        const done = apt.status === 'completed';
        return (
          <button key={apt.id}
            onClick={() => navigate('/schedule', { state: { editAppointmentId: apt.id } })}
            className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
            {/* time */}
            <div className="w-14 shrink-0 text-right">
              <p className={`text-xs font-bold tabular-nums ${done ? 'text-slate-300 dark:text-slate-600 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                {apt.time || '—'}
              </p>
              <p className="text-[10px] text-slate-400">{apt._day}</p>
            </div>
            {/* accent bar */}
            <div className={`h-10 w-0.5 shrink-0 rounded-full ${bar.replace('border-l-2 ','bg-').replace('border-','bg-')} opacity-80`} />
            {/* content */}
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${done ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                {apt.client}
              </p>
              <p className="truncate text-xs text-slate-400">{apt.type} · {apt.location || 'TBD'}</p>
            </div>
            {/* right */}
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">${apt.amount || 0}</p>
              {done
                ? <p className="text-[10px] font-bold text-emerald-500">Done</p>
                : <p className="text-[10px] text-blue-500">Upcoming</p>
              }
            </div>
            <ChevronRight className="ml-1 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
          </button>
        );
      })}
    </div>
  );
};

// ─── MODULE STATUS ROW ────────────────────────────────────────────────────────
const ModuleStatus = ({ data, navigate, planTier, userRole }) => {
  const ctx = { planTier, role: userRole };
  const portalOK   = getGateState('signerPortal', ctx).allowed;
  const dispatchOK = getGateState('teamDispatch', ctx).allowed;
  const aiOK       = getGateState('aiTrainer', ctx).allowed;
  const adminOK    = getGateState('admin', ctx).allowed;

  const now = new Date();
  const journalThisMonth = (data.journalEntries || []).filter(e => {
    const d = new Date(e.createdAt || e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const modules = [
    { Icon: ScrollText, label: 'Journal',     value: `${journalThisMonth} this mo`,              color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', path: '/journal',        ok: true },
    { Icon: Shield,     label: 'Compliance',  value: `${(data.complianceItems||[]).filter(c=>c.status==='Compliant').length}/${(data.complianceItems||[]).length} OK`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', path: '/compliance', ok: true },
    { Icon: Users,      label: 'Portal',      value: portalOK ? `${(data.signerSessions||[]).filter(s=>s.status==='active').length} active` : 'PRO', color: portalOK ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400', bg: portalOK ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-slate-100 dark:bg-slate-700/40', path: '/signer-portal', ok: portalOK },
    { Icon: Truck,      label: 'Dispatch',    value: dispatchOK ? `${(data.dispatchJobs||[]).filter(j=>j.status!=='completed').length} open` : 'AGENCY', color: dispatchOK ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400', bg: dispatchOK ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-100 dark:bg-slate-700/40', path: '/team-dispatch', ok: dispatchOK },
    { Icon: Brain,      label: 'AI Trainer',  value: aiOK ? `${(data.knowledgeArticles||[]).filter(a=>a.status==='published').length} art.` : 'PRO', color: aiOK ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400', bg: aiOK ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-slate-100 dark:bg-slate-700/40', path: '/ai-trainer', ok: aiOK },
    { Icon: Building2,  label: 'Admin',       value: adminOK ? `${(data.stateRules||[]).filter(r=>r.status==='active').length} rules` : 'ADMIN', color: adminOK ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400', bg: adminOK ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-100 dark:bg-slate-700/40', path: '/admin', ok: adminOK },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {modules.map(m => (
        <button key={m.label} onClick={() => navigate(m.path)}
          className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all hover:scale-[1.04] active:scale-95 ${!m.ok ? 'opacity-50' : ''}`}>
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.bg}`}>
            <m.Icon className={`h-5 w-5 ${m.color}`} />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{m.label}</p>
          <p className={`text-xs font-semibold ${m.color}`}>{m.value}</p>
        </button>
      ))}
    </div>
  );
};

// ─── QUICK ACTIONS GRID ───────────────────────────────────────────────────────
const QuickActions = ({ navigate, onNew, planTier, userRole }) => {
  const ctx = { planTier, role: userRole };
  const portalOK   = getGateState('signerPortal', ctx).allowed;
  const dispatchOK = getGateState('teamDispatch', ctx).allowed;
  const aiOK       = getGateState('aiTrainer', ctx).allowed;

  const actions = [
    { Icon: FileSignature, label: 'New Appt',      cls: 'bg-blue-600 hover:bg-blue-700 text-white',    fn: onNew,                          locked: false },
    { Icon: ScrollText,    label: 'Log Journal',   cls: 'bg-indigo-600 hover:bg-indigo-700 text-white', fn: () => navigate('/journal'),     locked: false },
    { Icon: DollarSign,    label: 'New Invoice',   cls: 'bg-emerald-600 hover:bg-emerald-700 text-white', fn: () => navigate('/invoices'), locked: false },
    { Icon: Users,         label: 'Signer Portal', cls: portalOK   ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400', fn: () => navigate('/signer-portal'),  locked: !portalOK,   lockLabel:'PRO' },
    { Icon: Truck,         label: 'Dispatch',      cls: dispatchOK ? 'bg-amber-600 hover:bg-amber-700 text-white'  : 'bg-slate-100 dark:bg-slate-700 text-slate-400', fn: () => navigate('/team-dispatch'),  locked: !dispatchOK, lockLabel:'AGENCY' },
    { Icon: Brain,         label: 'AI Trainer',    cls: aiOK       ? 'bg-rose-600 hover:bg-rose-700 text-white'   : 'bg-slate-100 dark:bg-slate-700 text-slate-400', fn: () => navigate('/ai-trainer'),     locked: !aiOK,       lockLabel:'PRO' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map(a => (
        <button key={a.label} onClick={a.fn}
          className={`relative flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center text-[11px] font-semibold leading-tight transition-all active:scale-95 ${a.cls}`}>
          <a.Icon className="h-5 w-5" />
          {a.label}
          {a.locked && (
            <span className="absolute right-1 top-1 rounded-full bg-black/25 px-1.5 py-px text-[8px] font-bold tracking-wide">
              {a.lockLabel}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
const ActivityFeed = ({ data, navigate }) => {
  const events = useMemo(() => {
    const list = [];
    (data.appointments||[]).filter(a => a.status==='completed' && a.completedAt).slice(0,2).forEach(a =>
      list.push({ Icon: CheckCircle2, cls:'text-emerald-500', label:`Completed: ${a.client}`, sub:a.type, ts:a.completedAt, path:'/schedule' })
    );
    (data.journalEntries||[]).slice(0,2).forEach(j =>
      list.push({ Icon: ScrollText, cls:'text-indigo-500', label:`Journal: ${j.actType}`, sub:j.signerName, ts:j.createdAt, path:'/journal' })
    );
    (data.invoices||[]).slice(0,2).forEach(inv =>
      list.push({ Icon: DollarSign, cls:'text-blue-500', label:`Invoice ${inv.id}`, sub:`${inv.client} · $${inv.amount}`, ts:null, path:'/invoices' })
    );
    (data.adminAuditLog||[]).slice(0,1).forEach(log =>
      list.push({ Icon: Activity, cls:'text-slate-400', label:`${log.action}: ${log.resourceLabel}`, sub:log.actor, ts:log.timestamp, path:'/admin' })
    );
    return list.sort((a,b) => (b.ts||'0').localeCompare(a.ts||'0')).slice(0,6);
  }, [data]);

  if (!events.length) return <p className="px-5 py-6 text-center text-xs text-slate-400">No recent activity.</p>;

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
      {events.map((ev,i) => (
        <button key={i} onClick={() => navigate(ev.path)}
          className="group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
          <ev.Icon className={`h-4 w-4 shrink-0 ${ev.cls}`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{ev.label}</p>
            <p className="truncate text-[10px] text-slate-400">{ev.sub}</p>
          </div>
          {ev.ts && <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(ev.ts)}</span>}
        </button>
      ))}
    </div>
  );
};

// ─── SETUP CHECKLIST ─────────────────────────────────────────────────────────
const SetupProgress = ({ checklist, onToggle, onCompleteNext }) => {
  const done = checklist.filter(i => i.done).length;
  const pct = Math.round((done / checklist.length) * 100);
  if (pct === 100) return null;
  return (
    <Card className="border-slate-200/70 dark:border-slate-700">
      <CardHeader className="px-5 py-3.5">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-blue-500" /> Setup
        </CardTitle>
        <Badge variant="blue">{pct}%</Badge>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-3">
        <Progress value={pct} className="mb-3 h-1.5" />
        <div className="space-y-1.5">
          {checklist.map(item => (
            <button key={item.id} onClick={() => onToggle(item.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className={`h-3 w-3 shrink-0 rounded-full border-2 transition-colors ${item.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'}`} />
              <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}>{item.label}</span>
            </button>
          ))}
        </div>
        <Button size="sm" className="mt-3 w-full" onClick={onCompleteNext}>Complete next step</Button>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [loading,       setLoading]       = useState(true);
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [chartType,     setChartType]     = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('dashboard_chart_type') || 'area') : 'area'
  );
  const [isProTip,      setIsProTip]      = useState(false);
  const [setupChecklist, setSetup]        = useState([
    { id: 'profile',  label: 'Complete business profile',    done: true  },
    { id: 'client',   label: 'Add first client',             done: true  },
    { id: 'invoice',  label: 'Create first invoice',         done: false },
    { id: 'journal',  label: 'Log first journal entry',      done: true  },
    { id: 'payment',  label: 'Connect payout settings',      done: false },
  ]);

  const { theme }             = useTheme();
  const navigate              = useNavigate();
  const { data, addAppointment } = useData();

  const planTier  = data.settings?.planTier  || 'free';
  const userRole  = data.settings?.userRole  || 'owner';
  const firstName = (data.settings?.name || 'there').split(' ')[0];

  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const apts     = data.appointments || [];
  const invoices = data.invoices     || [];
  const miles    = data.mileageLogs  || [];

  const totalRevenue = useMemo(() =>
    12450 + apts.reduce((s,a) => s + (Number(a.amount)||0), 0), [apts]);

  const completedCount = apts.filter(a => a.status === 'completed').length;
  const upcomingCount  = apts.filter(a => a.status === 'upcoming').length;

  const pendingAmt = invoices
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((s,i) => s + Number(i.amount||0), 0);

  const totalMiles = miles.reduce((s,m) => s + Number(m.miles||0), 0);
  const cpm        = data.settings?.costPerMile || 0.67;
  const netProfit  = totalRevenue - 1200 - Math.round(totalMiles * cpm);
  const margin     = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const monthlyGoal        = data.settings?.monthlyGoal || 15000;
  const currentMonthRevenue = useMemo(() =>
    9800 + apts.reduce((s,a) => s + (Number(a.amount)||0), 0), [apts]);
  const goalPct = Math.min(100, Math.round((currentMonthRevenue / monthlyGoal) * 100));

  const revenueData = useMemo(() => [
    ...BASE_YTD,
    { name: 'Feb', amount: currentMonthRevenue },
  ], [currentMonthRevenue]);

  // ── chart theming ────────────────────────────────────────────────────────
  const chartStroke = theme === 'dark' ? '#60a5fa' : '#2563eb';
  const gridStroke  = theme === 'dark' ? '#1e293b' : '#f1f5f9';
  const tickFill    = theme === 'dark' ? '#475569' : '#94a3b8';

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleSave = fd => {
    addAppointment({
      id: Date.now(),
      client: fd.client, type: fd.type,
      date: fd.date || todayISO(),
      time: fd.time, status: 'upcoming',
      amount: parseFloat(fd.fee) || 0,
      location: fd.location || 'TBD',
      notes: fd.notes || '',
      receiptName: fd.receiptName || '',
      receiptImage: fd.receiptImage || '',
    });
    setIsModalOpen(false);
  };

  const toggleSetup     = id => setSetup(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const completeNext    = ()  => setSetup(prev => {
    const idx = prev.findIndex(i => !i.done);
    return idx < 0 ? prev : prev.map((i,n) => n === idx ? { ...i, done: true } : i);
  });

  const greeting = getGreeting();
  const GreetIcon = greeting.Icon;

  const TIPS = [
    'Owner focus: review margin trends daily and clear pending invoices before end-of-week.',
    'Operator focus: block similar service types together to reduce travel and context-switching.',
    'Batch mileage entries weekly — keeping them current saves hours at tax time.',
  ];

  return (
    <div className="min-h-screen pb-16">
      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} />

      <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-5 sm:space-y-5 sm:px-6 sm:py-7 md:px-8 md:py-8">

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white shadow-2xl">
          {/* grid overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <CardContent className="relative px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* greeting */}
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <GreetIcon className={`h-5 w-5 ${greeting.color}`} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                    {data.settings?.businessName || 'NotaryOS'}
                  </p>
                  <h1 className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
                    {greeting.label}, {firstName}
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
                  </p>
                </div>
              </div>
              {/* hero right */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                  {planTier.charAt(0).toUpperCase() + planTier.slice(1)} · {userRole}
                </span>
                <Button size="sm" variant="secondary"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                  onClick={() => navigate('/schedule')}>
                  <CalendarClock className="mr-1.5 h-4 w-4" /> Schedule
                </Button>
                <Button onClick={() => setIsModalOpen(true)}
                  className="border-0 bg-blue-500 text-white shadow-lg shadow-blue-900/30 hover:bg-blue-600">
                  <Plus className="mr-1.5 h-4 w-4" />
                  <span className="hidden xs:inline">New </span>Appointment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══ KPI STRIP ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {loading ? (
            [1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />)
          ) : (
            <>
              <KpiTile title="Total Revenue"   value={`$${totalRevenue.toLocaleString()}`}  sub="All-time"             Icon={DollarSign}    accent="blue"   onClick={() => navigate('/invoices')} />
              <KpiTile title="Net Profit"       value={`$${netProfit.toLocaleString()}`}     sub={`${margin}% margin`}  Icon={Wallet}        accent="purple" onClick={() => navigate('/invoices')} />
              <KpiTile title="Upcoming"         value={String(upcomingCount)}                sub={`${completedCount} completed`} Icon={CalendarClock} accent="orange" onClick={() => navigate('/schedule')} />
              <KpiTile title="Outstanding"      value={`$${pendingAmt.toLocaleString()}`}    sub="Invoices pending"     Icon={FileText}      accent={pendingAmt > 0 ? 'rose' : 'green'} onClick={() => navigate('/invoices')} />
            </>
          )}
        </div>

        {/* ══ MODULE STATUS STRIP ═════════════════════════════════════════════ */}
        <Card className="border-slate-200/70 dark:border-slate-700">
          <CardContent className="px-4 py-4 sm:px-5">
            {loading
              ? <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              : <ModuleStatus data={data} navigate={navigate} planTier={planTier} userRole={userRole} />
            }
          </CardContent>
        </Card>

        {/* ══ MAIN 2-COL GRID ═════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12">

          {/* LEFT — 8 cols */}
          <section className="space-y-4 sm:space-y-5 xl:col-span-8">

            {/* Daily Brief */}
            {loading
              ? <div className="h-56 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              : <DailyBrief data={data} navigate={navigate} />
            }

            {/* Today's Schedule */}
            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader className="px-5 py-3.5">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="h-4 w-4 text-blue-500" />
                  Today's Schedule
                  <Badge variant="blue">
                    {(data.appointments||[]).filter(a => a.date === todayISO()).length} today
                  </Badge>
                </CardTitle>
                <Button size="sm" variant="secondary" onClick={() => navigate('/schedule')}>
                  Full calendar <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {loading
                  ? [1,2].map(i => <div key={i} className="mx-5 my-3 h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)
                  : <TodayTimeline appointments={data.appointments||[]} navigate={navigate} />
                }
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader className="px-5 py-3.5">
                <div>
                  <CardTitle className="text-sm font-semibold">Revenue Velocity</CardTitle>
                  <p className="text-xs text-slate-400">YTD · last 7 months</p>
                </div>
                <Select
                  value={chartType}
                  onChange={e => { setChartType(e.target.value); localStorage.setItem('dashboard_chart_type', e.target.value); }}
                  options={[{ label:'Area', value:'area' }, { label:'Bar', value:'bar' }]}
                  className="w-24"
                />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {loading
                  ? <div className="h-52 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                  : (
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'area' ? (
                          <AreaChart data={revenueData} margin={{ top:8, right:0, left:-20, bottom:0 }}>
                            <defs>
                              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={chartStroke} stopOpacity={0.28} />
                                <stop offset="95%" stopColor={chartStroke} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill:tickFill, fontSize:11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill:tickFill, fontSize:11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                            <RechartsTooltip formatter={v => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius:8, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,.12)' }} />
                            <Area type="monotone" dataKey="amount" stroke={chartStroke} strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
                          </AreaChart>
                        ) : (
                          <BarChart data={revenueData} margin={{ top:8, right:0, left:-20, bottom:0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill:tickFill, fontSize:11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill:tickFill, fontSize:11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                            <RechartsTooltip formatter={v => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius:8, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,.12)' }} />
                            <Bar dataKey="amount" fill={chartStroke} radius={[4,4,0,0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )
                }
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader className="px-5 py-3.5">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="h-4 w-4 text-slate-400" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading
                  ? [1,2,3].map(i => <div key={i} className="mx-5 my-2.5 h-9 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)
                  : <ActivityFeed data={data} navigate={navigate} />
                }
              </CardContent>
            </Card>
          </section>

          {/* RIGHT — 4 cols */}
          <aside className="space-y-4 sm:space-y-5 xl:col-span-4">

            {/* Monthly Goal */}
            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader className="px-5 py-3.5">
                <CardTitle className="text-sm font-semibold">Monthly Goal</CardTitle>
                <Badge variant={goalPct >= 100 ? 'success' : 'blue'}>{goalPct}%</Badge>
              </CardHeader>
              <CardContent className="flex flex-col items-center px-5 pb-5 pt-2">
                {loading
                  ? <div className="h-36 w-36 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                  : (
                    <CircularProgress value={goalPct} size={148} strokeWidth={10}>
                      <div className="text-center">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">{goalPct}%</span>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          of ${monthlyGoal.toLocaleString()}
                        </p>
                      </div>
                    </CircularProgress>
                  )
                }
                <div className="mt-3 grid w-full grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">This month</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">${currentMonthRevenue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Remaining</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">${Math.max(0, monthlyGoal - currentMonthRevenue).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader className="px-5 py-3.5">
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <QuickActions navigate={navigate} onNew={() => setIsModalOpen(true)} planTier={planTier} userRole={userRole} />
              </CardContent>
            </Card>

            {/* Setup Progress */}
            {!loading && (
              <SetupProgress checklist={setupChecklist} onToggle={toggleSetup} onCompleteNext={completeNext} />
            )}

            {/* At a Glance */}
            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader className="px-5 py-3.5">
                <CardTitle className="text-sm font-semibold">At a Glance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 px-4 pb-4 pt-0">
                {[
                  { Icon:MapPin,    label:'Miles logged',    val:`${totalMiles.toFixed(1)} mi`,  sub:`$${(totalMiles*cpm).toFixed(0)} deductible`, cls:'text-blue-500',    path:'/mileage' },
                  { Icon:Shield,    label:'Compliance',      val:`${(data.complianceItems||[]).filter(c=>c.status==='Compliant').length}/${(data.complianceItems||[]).length}`, sub:'items compliant', cls:'text-emerald-500', path:'/compliance' },
                  { Icon:BookOpen,  label:'Journal entries', val:String((data.journalEntries||[]).length), sub:'all time',   cls:'text-indigo-500', path:'/journal' },
                  { Icon:TrendingUp,label:'Team members',    val:String((data.teamMembers||[]).length), sub:'on roster', cls:'text-amber-500',  path:'/team-dispatch' },
                ].map(item => (
                  <button key={item.label} onClick={() => navigate(item.path)}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <item.Icon className={`h-4 w-4 shrink-0 ${item.cls}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {item.val} <span className="font-normal text-slate-400">{item.sub}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">{item.label}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Pro Tip */}
            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader className="px-5 py-3.5">
                <CardTitle className="text-sm font-semibold">Pro Tip</CardTitle>
                <Button size="sm" variant="secondary" onClick={() => setIsProTip(p => !p)}>
                  {isProTip ? 'Hide' : 'Show'} <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${isProTip ? 'rotate-180' : ''}`} />
                </Button>
              </CardHeader>
              {isProTip && (
                <CardContent className="rounded-b-xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                    <Award className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-indigo-100">{TIPS[0]}</p>
                  <Button size="sm" className="mt-4 bg-white/20 text-white hover:bg-white/30"
                    onClick={() => navigate('/clients')}>
                    Open Clients
                  </Button>
                </CardContent>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
