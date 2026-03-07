import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowUpRight, Award, BarChart3,
  Bell, BookOpen, Brain, Building2, CalendarClock, Car, CheckCircle2,
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
import DepartureChecklistModal from '../components/DepartureChecklistModal';
import SignerConfirmationModal from '../components/SignerConfirmationModal';
import { useTheme } from '../context/ThemeContext';
import { PendingSuggestionsPanel } from '../components/AgentSuggestionCard';
import { useData } from '../context/DataContext';
import { getGateState } from '../utils/gates';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
// Use LOCAL date (not UTC) so appointments match correctly after 7 PM when UTC rolls to next day
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

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
        <ChevronRight className="h-4 w-4 text-white/80" />
      </div>
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/70">{title}</p>
      {loading
        ? <div className="mt-1 h-7 w-24 animate-pulse rounded-lg bg-white/20" />
        : <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      }
      {sub && !loading && <p className="mt-1 text-xs text-white/60">{sub}</p>}
      {!loading && (
        <div className="mt-2.5 flex items-center justify-end gap-1 text-[11px] font-semibold text-white/80 sm:hidden">
          <span>Tap to open</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      )}
    </button>
  );
};

// ─── AGENT COMMAND STRIP ─────────────────────────────────────────────────────
const AgentCommandStrip = ({ data, navigate, onApprove, onReject }) => {
  const pending = useMemo(() =>
    (data.agentSuggestions || []).filter(s => s.status === 'pending'),
    [data.agentSuggestions]
  );

  const lastApproved = useMemo(() =>
    (data.agentSuggestions || [])
      .filter(s => s.status === 'approved')
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
      [0],
    [data.agentSuggestions]
  );

  const hasAction = pending.length > 0;

  const statusText = hasAction
    ? `"${pending[0].title || 'Closeout draft'}" — tap to review & approve`
    : lastApproved
      ? `Last action: ${lastApproved.title || 'Closeout'} approved ${timeAgo(lastApproved.updatedAt || lastApproved.createdAt)}`
      : 'Ready to generate closeouts, follow-ups, and journal drafts';

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      hasAction
        ? 'border-amber-300/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-700/40 dark:from-amber-950/30 dark:to-orange-950/20'
        : 'border-violet-200/60 bg-gradient-to-r from-violet-50 to-indigo-50 dark:border-violet-800/40 dark:from-violet-950/30 dark:to-indigo-950/20'
    }`}>
      <div className="flex items-center gap-3">
        {/* Brain icon */}
        <div className="relative flex-shrink-0">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${
            hasAction ? 'bg-amber-500' : 'bg-violet-600'
          }`}>
            <Brain className="h-5 w-5 text-white" />
          </div>
          {pending.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
              {pending.length}
            </span>
          )}
        </div>

        {/* Status */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
              hasAction ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              hasAction
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-violet-700 dark:text-violet-300'
            }`}>
              {hasAction ? `${pending.length} Draft${pending.length > 1 ? 's' : ''} Awaiting Review` : 'Command Center · Agent Standing By'}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {statusText}
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-shrink-0 gap-2">
          {hasAction ? (
            <>
              <button
                onClick={() => onApprove && onApprove(pending[0])}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
              >
                Approve
              </button>
              <button
                onClick={() => navigate('/agent')}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                  hasAction
                    ? 'border-amber-300 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                    : 'border-violet-200 bg-white text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                }`}
              >
                Review All
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/agent')}
              className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 active:scale-95 transition-all dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
            >
              Open Agent →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── AGENT INSIGHT CARDS ──────────────────────────────────────────────────────
const AgentInsightCards = ({ data, navigate }) => {
  const insights = useMemo(() => {
    const results = [];
    const apts     = data.appointments   || [];
    const invoices = data.invoices       || [];

    // 1. Revenue pace vs monthly goal
    const now          = new Date();
    const dayOfMonth   = now.getDate();
    const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const thisMonthKey = now.toISOString().slice(0, 7);
    const thisMonthRev = apts
      .filter(a => (a.date || '').slice(0, 7) === thisMonthKey)
      .reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const monthlyGoal  = data.settings?.monthlyGoal || 0;

    if (monthlyGoal > 0 && dayOfMonth > 0) {
      const dailyRate      = thisMonthRev / dayOfMonth;
      const projected      = Math.round(dailyRate * daysInMonth);
      const pct            = Math.min(200, Math.round((projected / monthlyGoal) * 100));
      const daysLeft       = daysInMonth - dayOfMonth;
      const needed         = Math.max(0, monthlyGoal - thisMonthRev);
      const aptsPerDayNeeded = dailyRate > 0 ? (needed / dailyRate).toFixed(1) : null;

      const isGood = pct >= 100;
      const isOk   = pct >= 70;

      results.push({
        key: 'revenue_pace',
        Icon: TrendingUp,
        iconCls:  isGood ? 'text-emerald-500' : isOk ? 'text-blue-500' : 'text-amber-500',
        border:   isGood ? 'border-emerald-200/70 dark:border-emerald-800/40' : isOk ? 'border-blue-200/70 dark:border-blue-800/40' : 'border-amber-200/70 dark:border-amber-800/40',
        bg:       isGood ? 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20' : isOk ? 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20' : 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20',
        label:    'Revenue Pace',
        message:  isGood
          ? `On track to exceed goal by $${(projected - monthlyGoal).toLocaleString()} this month 🎉`
          : `Projected $${projected.toLocaleString()} of $${monthlyGoal.toLocaleString()} goal · ${daysLeft}d left${aptsPerDayNeeded ? ` · pace up $${Math.round(needed / Math.max(1, daysLeft)).toLocaleString()}/day` : ''}`,
        action:   'View Invoices',
        path:     '/invoices',
      });
    }

    // 2. Overdue invoices — agent can help
    const overdue    = invoices.filter(i => i.status === 'Overdue');
    const overdueAmt = overdue.reduce((s, i) => s + Number(i.amount || 0), 0);
    if (overdue.length > 0) {
      results.push({
        key:      'overdue',
        Icon:     AlertTriangle,
        iconCls:  'text-red-500',
        border:   'border-red-200/70 dark:border-red-800/40',
        bg:       'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20',
        label:    'Overdue Invoices',
        message:  `${overdue.length} invoice${overdue.length > 1 ? 's' : ''} overdue — $${overdueAmt.toLocaleString()} uncollected. Agent can draft follow-up emails now.`,
        action:   'Draft Follow-ups',
        path:     '/agent',
      });
    }

    // 3. Compliance / E&O countdown
    const eao = data.settings?.eAndOExpiresOn;
    if (eao) {
      const days = Math.ceil((new Date(eao) - Date.now()) / 86400000);
      if (days <= 90) {
        results.push({
          key:      'compliance',
          Icon:     Shield,
          iconCls:  days <= 14 ? 'text-red-500' : 'text-amber-500',
          border:   days <= 14 ? 'border-red-200/70 dark:border-red-800/40' : 'border-amber-200/70 dark:border-amber-800/40',
          bg:       days <= 14 ? 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20' : 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20',
          label:    'E&O Expiring',
          message:  `Your E&O insurance expires in ${days} day${days !== 1 ? 's' : ''} — ${days <= 14 ? 'renew immediately to stay compliant' : 'schedule renewal before it lapses'}.`,
          action:   'View Compliance',
          path:     '/compliance',
        });
      }
    }

    // 4. Completed appointments missing journal entries
    const journaledIds = new Set(
      (data.journalEntries || []).map(j => j.appointmentId).filter(Boolean)
    );
    const missingJournal = (apts || []).filter(
      a => a.status === 'completed' && !journaledIds.has(a.id)
    );
    if (missingJournal.length > 0) {
      results.push({
        key:      'journal_gaps',
        Icon:     ScrollText,
        iconCls:  'text-indigo-500',
        border:   'border-indigo-200/70 dark:border-indigo-800/40',
        bg:       'from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20',
        label:    'Journal Gaps',
        message:  `${missingJournal.length} completed appointment${missingJournal.length > 1 ? 's' : ''} with no journal entry. Your agent can auto-draft them.`,
        action:   'Auto-Draft Entries',
        path:     '/agent',
      });
    }

    // 5. Scheduling pattern (busiest day) — only if enough data
    if (apts.length >= 5) {
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      apts.forEach(a => {
        if (a.date) dayCounts[new Date(a.date + 'T12:00:00').getDay()]++;
      });
      const maxIdx  = dayCounts.indexOf(Math.max(...dayCounts));
      const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][maxIdx];
      results.push({
        key:      'pattern',
        Icon:     BarChart3,
        iconCls:  'text-violet-500',
        border:   'border-violet-200/70 dark:border-violet-800/40',
        bg:       'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20',
        label:    'Scheduling Pattern',
        message:  `${dayName}s are your busiest day (${dayCounts[maxIdx]} appointments). Consider blocking that day for premium-rate jobs only.`,
        action:   'View Schedule',
        path:     '/schedule',
      });
    }

    return results.slice(0, 3);
  }, [data]);

  if (!insights.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-0.5">
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Agent Insights
        </span>
        <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">Updated now</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {insights.map(insight => (
          <button
            key={insight.key}
            onClick={() => navigate(insight.path)}
            className={`group flex flex-col gap-2.5 rounded-xl border bg-gradient-to-br ${insight.bg} ${insight.border} p-3.5 text-left transition-all hover:scale-[1.02] active:scale-[.98]`}
          >
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/70 shadow-sm dark:bg-white/10">
                <insight.Icon className={`h-3.5 w-3.5 ${insight.iconCls}`} />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {insight.label}
              </span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">
              {insight.message}
            </p>
            <span className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-violet-600 group-hover:underline dark:text-violet-300">
              {insight.action} <ArrowUpRight className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>
    </div>
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

  const pendingAgentDrafts  = (data.agentSuggestions || []).filter(s => s.status === 'pending').length;
  const approvedAgentDrafts = (data.agentSuggestions || []).filter(s => s.status === 'approved').length;

  const agentActivityLine = pendingAgentDrafts > 0
    ? `You have ${pendingAgentDrafts} agent draft${pendingAgentDrafts > 1 ? 's' : ''} awaiting review.`
    : approvedAgentDrafts > 0
      ? `Your agent has completed ${approvedAgentDrafts} approved draft${approvedAgentDrafts > 1 ? 's' : ''}.`
      : 'Your agent is standing by for the next appointment. Try a test closeout → Schedule.';

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
      path: todayApts[0]?.id ? { pathname: '/schedule', state: { editAppointmentId: todayApts[0].id } } : '/schedule',
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
      path: { pathname: '/invoices', state: { statusFilter: ['Pending', 'Overdue'] } },
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
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <span className="mt-1 text-[11px] text-violet-500 dark:text-violet-300">
            {agentActivityLine}
          </span>
        </div>
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
const TodayTimeline = ({ appointments, navigate, updateAppointment }) => {
  const [departingApt, setDepartingApt] = useState(null);
  const today    = todayISO();
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

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
    <>
    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
      {all.map(apt => {
        const { bar } = aptAccent(apt.type);
        const done = apt.status === 'completed';
        return (
          <div key={apt.id}
            className="group flex w-full items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
            {/* clickable area → edit in Schedule */}
            <button
              className="flex flex-1 items-center gap-3 text-left min-w-0"
              onClick={() => navigate('/schedule', { state: { editAppointmentId: apt.id } })}
            >
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
              {/* fee */}
              <div className="shrink-0 text-right mr-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">${apt.amount || 0}</p>
                {done
                  ? <p className="text-[10px] font-bold text-emerald-500">Done</p>
                  : <p className="text-[10px] text-blue-500">Upcoming</p>
                }
              </div>
            </button>
            {/* Depart button — only for upcoming */}
            {!done && (
              <button
                onClick={() => setDepartingApt(apt)}
                title="Pre-Departure Checklist"
                className="shrink-0 flex items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                <Car className="h-3.5 w-3.5" /> Depart
              </button>
            )}
          </div>
        );
      })}
    </div>

    {/* Pre-Departure Checklist Modal */}
    <DepartureChecklistModal
      appointment={departingApt}
      isOpen={!!departingApt}
      onClose={() => setDepartingApt(null)}
      onDepart={(aptId) => {
        updateAppointment?.(aptId, { status: 'en_route', departed_at: new Date().toISOString() });
        setDepartingApt(null);
        navigate(`/arrive/${aptId}`);
      }}
    />
    </>
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
    { Icon: ScrollText, label: 'Journal',     hint: 'Notary Log',     value: `${journalThisMonth} this mo`,              color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', path: '/journal',       ok: true },
    { Icon: Shield,     label: 'Compliance',  hint: 'Policy Check',   value: `${(data.complianceItems||[]).filter(c=>c.status==='Compliant').length}/${(data.complianceItems||[]).length} OK`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', path: '/compliance', ok: true },
    { Icon: Users,      label: 'Portal',      hint: 'Client Docs',    value: portalOK   ? `${(data.signerSessions||[]).filter(s=>s.status==='active').length} active` : 'PRO',    color: portalOK   ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400', bg: portalOK   ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-slate-100 dark:bg-slate-700/40', path: '/signer-portal', ok: portalOK   },
    { Icon: Truck,      label: 'Dispatch',    hint: 'Team Jobs',      value: dispatchOK ? `${(data.dispatchJobs||[]).filter(j=>j.status!=='completed').length} open` : 'AGENCY', color: dispatchOK ? 'text-amber-600 dark:text-amber-400'  : 'text-slate-400', bg: dispatchOK ? 'bg-amber-50 dark:bg-amber-900/20'   : 'bg-slate-100 dark:bg-slate-700/40', path: '/team-dispatch', ok: dispatchOK },
    { Icon: Brain,      label: 'AI Trainer',  hint: 'Policy Q&A',     value: aiOK       ? `${(data.knowledgeArticles||[]).filter(a=>a.status==='published').length} art.` : 'PRO',    color: aiOK       ? 'text-rose-600 dark:text-rose-400'    : 'text-slate-400', bg: aiOK       ? 'bg-rose-50 dark:bg-rose-900/20'       : 'bg-slate-100 dark:bg-slate-700/40', path: '/ai-trainer',    ok: aiOK       },
    { Icon: Building2,  label: 'Admin',       hint: 'Policy Records', value: adminOK    ? `${(data.stateRules||[]).filter(r=>r.status==='active').length} rules` : 'ADMIN',  color: adminOK    ? 'text-blue-600 dark:text-blue-400'    : 'text-slate-400', bg: adminOK    ? 'bg-blue-50 dark:bg-blue-900/20'       : 'bg-slate-100 dark:bg-slate-700/40', path: '/admin',         ok: adminOK    },
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
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{m.hint}</p>
          <p className={`text-xs font-semibold ${m.color}`}>{m.value}</p>
        </button>
      ))}
    </div>
  );
};

// ─── QUICK ACTIONS GRID ───────────────────────────────────────────────────────
const QuickActions = ({ navigate, onNew, planTier, userRole, pendingAgentDrafts = 0 }) => {
  const ctx = { planTier, role: userRole };
  const portalOK   = getGateState('signerPortal', ctx).allowed;
  const dispatchOK = getGateState('teamDispatch', ctx).allowed;
  const aiOK       = getGateState('aiTrainer', ctx).allowed;

  const actions = [
    { Icon: FileSignature, label: 'New Appt',      cls: 'bg-blue-600 hover:bg-blue-700 text-white',    fn: onNew,                          locked: false },
    { Icon: ScrollText,    label: 'Log Journal',   cls: 'bg-indigo-600 hover:bg-indigo-700 text-white', fn: () => navigate('/journal'),     locked: false },
    { Icon: DollarSign,    label: 'New Invoice',   cls: 'bg-emerald-600 hover:bg-emerald-700 text-white', fn: () => navigate('/invoices'), locked: false },
    { Icon: Users,         label: 'Signer Portal', cls: portalOK   ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400', fn: () => navigate('/signer-portal'),  locked: !portalOK,   lockLabel:'PRO'    },
    { Icon: Truck,         label: 'Dispatch',      cls: dispatchOK ? 'bg-amber-600 hover:bg-amber-700 text-white'  : 'bg-slate-100 dark:bg-slate-700 text-slate-400', fn: () => navigate('/team-dispatch'),  locked: !dispatchOK, lockLabel:'AGENCY' },
    { Icon: Sparkles,      label: pendingAgentDrafts > 0 ? `Review ${pendingAgentDrafts} Draft${pendingAgentDrafts > 1 ? 's' : ''}` : 'Command Center', cls: 'bg-violet-600 hover:bg-violet-700 text-white', fn: () => navigate('/agent'), locked: false },
    { Icon: Brain,         label: 'AI Trainer',    cls: aiOK       ? 'bg-rose-600 hover:bg-rose-700 text-white'   : 'bg-slate-100 dark:bg-slate-700 text-slate-400', fn: () => navigate('/ai-trainer'),     locked: !aiOK,       lockLabel:'PRO'    },
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
const SetupProgress = ({ checklist, onAction }) => {
  const done = checklist.filter(i => i.done).length;
  const pct  = Math.round((done / checklist.length) * 100);
  if (pct === 100) return null;
  return (
    <Card className="border-slate-200/70 dark:border-slate-700">
      <CardHeader className="px-5 py-3.5">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-blue-500" /> Setup for new account
        </CardTitle>
        <Badge variant="blue">{pct}%</Badge>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-3">
        <Progress value={pct} className="mb-3 h-1.5" />
        <div className="space-y-1.5">
          {checklist.map(item => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs">
              <span className={`h-3 w-3 shrink-0 rounded-full border-2 transition-colors ${item.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'}`} />
              <span className={`flex-1 ${item.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{item.label}</span>
              {!item.done && item.path ? (
                <Button size="sm" variant="secondary" onClick={() => onAction(item.path)}>{item.cta || 'Open'}</Button>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [loading,     setLoading]     = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signerConfirmAppt, setSignerConfirmAppt] = useState(null);
  const [chartType,   setChartType]   = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('dashboard_chart_type') || 'area') : 'area'
  );
  const [isProTip,    setIsProTip]    = useState(false);

  const { theme }             = useTheme();
  const navigate              = useNavigate();
  const { data, addAppointment, updateAppointment, approveAgentSuggestion, rejectAgentSuggestion } = useData();

  const planTier  = data.settings?.planTier  || 'free';
  const userRole  = data.settings?.userRole  || 'owner';
  const firstName = (data.settings?.name || 'there').split(' ')[0];

  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const apts     = data.appointments || [];
  const invoices = data.invoices     || [];
  const miles    = data.mileageLogs  || [];

  const totalRevenue = useMemo(() =>
    apts.reduce((s,a) => s + (Number(a.amount)||0), 0), [apts]);

  const completedCount = apts.filter(a => a.status === 'completed').length;
  const upcomingCount  = apts.filter(a => a.status === 'upcoming').length;

  const pendingAmt = invoices
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((s,i) => s + Number(i.amount||0), 0);

  const totalMiles = miles.reduce((s,m) => s + Number(m.miles||0), 0);
  const cpm        = data.settings?.costPerMile || 0.67;
  const netProfit  = totalRevenue - 1200 - Math.round(totalMiles * cpm);
  const margin     = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const monthlyGoal         = data.settings?.monthlyGoal || 15000;
  const currentMonthRevenue = useMemo(() =>
    apts.filter((a) => (a.date || '').slice(0,7) === new Date().toISOString().slice(0,7)).reduce((s,a) => s + (Number(a.amount)||0), 0), [apts]);
  const goalPct = Math.min(100, Math.round((currentMonthRevenue / monthlyGoal) * 100));

  // Revenue projection
  const revenueProjection = useMemo(() => {
    const now        = new Date();
    const day        = now.getDate();
    const daysInMo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (day === 0) return null;
    const rate       = currentMonthRevenue / day;
    return Math.round(rate * daysInMo);
  }, [currentMonthRevenue]);

  const revenueData = useMemo(() => {
    const now = new Date();
    const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
      return { key: key(d), name: d.toLocaleDateString('en-US', { month: 'short' }), amount: 0 };
    });
    const map = new Map(buckets.map((b) => [b.key, b]));
    (apts || []).forEach((a) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(a?.date || '')) return;
      const k = (a.date || '').slice(0, 7);
      if (!map.has(k)) return;
      map.get(k).amount += Number(a.amount || 0);
    });
    return buckets;
  }, [apts]);

  // ── chart theming ─────────────────────────────────────────────────────────
  const chartStroke = theme === 'dark' ? '#60a5fa' : '#2563eb';
  const gridStroke  = theme === 'dark' ? '#1e293b' : '#f1f5f9';
  const tickFill    = theme === 'dark' ? '#475569' : '#94a3b8';

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSave = fd => {
    const newAppt = {
      id: Date.now(),
      client: fd.client, type: fd.type,
      date: fd.date || todayISO(),
      time: fd.time, status: 'upcoming',
      amount: parseFloat(fd.fee) || 0,
      phone: fd.phone || '',
      email: fd.email || '',
      address: fd.address || '',
      location: fd.location || 'TBD',
      notes: fd.notes || '',
    };
    addAppointment(newAppt);
    setIsModalOpen(false);
    setSignerConfirmAppt(newAppt);
  };

  const setupChecklist = useMemo(() => [
    { id: 'profile',  label: 'Complete business profile',      done: Boolean(data.settings?.onboardingComplete), path: '/settings', cta: 'Open Settings'   },
    { id: 'client',   label: 'Add your first client',          done: (data.clients || []).length > 0,            path: '/clients',  cta: 'Add Client'      },
    { id: 'schedule', label: 'Create your first appointment',  done: (data.appointments || []).length > 0,       path: '/schedule', cta: 'New Appointment' },
    { id: 'invoice',  label: 'Create your first invoice',      done: (data.invoices || []).length > 0,           path: '/invoices', cta: 'New Invoice'     },
    { id: 'journal',  label: 'Log your first journal entry',   done: (data.journalEntries || []).length > 0,     path: '/journal',  cta: 'Add Entry'       },
  ], [data.settings, data.clients, data.appointments, data.invoices, data.journalEntries]);

  const greeting  = getGreeting();
  const GreetIcon = greeting.Icon;

  const agentActivityLine = (() => {
    const suggestions  = data.agentSuggestions || [];
    const pendingCount = suggestions.filter(s => s.status === 'pending').length;
    if (pendingCount > 0) return `You have ${pendingCount} agent draft${pendingCount > 1 ? 's' : ''} awaiting review.`;
    const midnight       = new Date(); midnight.setHours(0, 0, 0, 0);
    const overnightCount = suggestions.filter(s => {
      const t = s.createdAt ? new Date(s.createdAt).getTime() : 0;
      return t >= midnight.getTime();
    }).length;
    if (overnightCount > 0) return `Your agent prepared ${overnightCount} closeout${overnightCount > 1 ? 's' : ''} overnight.`;
    return 'Your agent is standing by for the next appointment.';
  })();

  const TIPS = [
    'Core Service: Use the Digital Journal to capture compliant on-site entries with automated prompts.',
    'Core Service: Automated Invoicing keeps your cash flow visible — track status in real-time.',
    'Core Service: Let the AI Closeout Agent draft next-step actions grounded in jurisdiction policy records.',
    'Owner focus: Review revenue velocity and net profit margins to optimize your business growth.',
  ];

  const pendingAgentDrafts = (data.agentSuggestions || []).filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen pb-24">
      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
      <SignerConfirmationModal
        isOpen={!!signerConfirmAppt}
        appointment={signerConfirmAppt}
        notaryName={data.settings?.name || data.settings?.businessName || 'Your Notary'}
        onClose={() => setSignerConfirmAppt(null)}
      />

      <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-5 sm:space-y-5 sm:px-6 sm:py-7 md:px-8 md:py-8">

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <Card className="app-hero-card shadow-2xl">
          <CardContent className="relative px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* greeting */}
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <GreetIcon className={`h-5 w-5 ${greeting.color}`} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                    {data.settings?.businessName || 'NotaryFix'}
                  </p>
                  <h1 className="mt-0.5 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                    {greeting.label}, {firstName}
                  </h1>
                  <p className="mt-0.5 text-xs text-white/75">
                    {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-cyan-300/90">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                    {agentActivityLine}
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
                  New Appointment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══ AGENT COMMAND STRIP (always visible) ═══════════════════════════ */}
        {!loading && (
          <AgentCommandStrip
            data={data}
            navigate={navigate}
            onApprove={(s) => { approveAgentSuggestion?.(s.id); navigate('/journal'); }}
            onReject={(s) => rejectAgentSuggestion?.(s.id)}
          />
        )}

        {/* ══ AGENT SUGGESTIONS (pending drafts panel) ════════════════════════ */}
        {(data.agentSuggestions || []).filter(s => s.status === 'pending').length > 0 && (
          <Card>
            <CardContent className="p-4">
              <PendingSuggestionsPanel
                suggestions={(data.agentSuggestions || []).filter(s => s.status === 'pending')}
                onApprove={(s) => { approveAgentSuggestion?.(s.id); navigate('/journal'); }}
                onEdit={() => navigate('/agent')}
                onReject={(s) => rejectAgentSuggestion?.(s.id)}
                onViewAll={() => navigate('/agent')}
              />
            </CardContent>
          </Card>
        )}

        {/* ══ AGENT INSIGHT CARDS ════════════════════════════════════════════ */}
        {!loading && (
          <AgentInsightCards data={data} navigate={navigate} />
        )}

        {/* ══ KPI STRIP ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {loading ? (
            [1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />)
          ) : (
            <>
              <KpiTile title="Total Revenue"   value={`$${totalRevenue.toLocaleString()}`}  sub={`Goal: $${(data.settings?.monthlyGoal || 0).toLocaleString()}/mo`} Icon={DollarSign}    accent="blue"   onClick={() => navigate('/invoices')} />
              <KpiTile title="Net Profit"       value={`$${netProfit.toLocaleString()}`}     sub={`${margin}% margin`}  Icon={Wallet}        accent="purple" onClick={() => navigate('/invoices')} />
              <KpiTile title="Journal Entries"  value={String((data.journalEntries || []).length)} sub="Compliant records" Icon={BookOpen} accent="green" onClick={() => navigate('/journal')} />
              <KpiTile title="Outstanding"      value={`$${pendingAmt.toLocaleString()}`}    sub="Invoices pending"     Icon={FileText}      accent={pendingAmt > 0 ? 'rose' : 'orange'} onClick={() => navigate('/invoices', { state: { statusFilter: ['Pending', 'Overdue'] } })} />
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
                  : <TodayTimeline appointments={data.appointments||[]} navigate={navigate} updateAppointment={updateAppointment} />
                }
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader className="px-5 py-3.5">
                <div>
                  <CardTitle className="text-sm font-semibold">Revenue Velocity</CardTitle>
                  <p className="text-xs text-slate-400">Live appointments · last 7 months</p>
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
                  : revenueData.every(d => d.amount === 0)
                  ? (
                    <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <TrendingUp className="h-8 w-8 text-slate-200 dark:text-slate-700" />
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No revenue data yet</p>
                      <p className="text-xs text-slate-300 dark:text-slate-600">Add appointments with fees to see your chart</p>
                      <Button size="sm" variant="secondary" onClick={() => navigate('/schedule')} className="mt-1">Add appointment</Button>
                    </div>
                  )
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

            {/* Monthly Goal + Projection */}
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
                  <button onClick={() => navigate('/invoices')} className="w-full rounded-lg bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">This month</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">${currentMonthRevenue.toLocaleString()}</p>
                  </button>
                  <button onClick={() => navigate('/invoices')} className="w-full rounded-lg bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Remaining</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">${Math.max(0, monthlyGoal - currentMonthRevenue).toLocaleString()}</p>
                  </button>
                </div>
                {/* Projection row */}
                {!loading && revenueProjection !== null && (
                  <div className={`mt-2 w-full rounded-lg p-2.5 text-center ${
                    revenueProjection >= monthlyGoal
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Agent Projection</p>
                    <p className={`text-sm font-bold ${
                      revenueProjection >= monthlyGoal
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      ${revenueProjection.toLocaleString()} est. month-end
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {revenueProjection >= monthlyGoal ? '🎯 On track to hit goal' : `$${Math.max(0, monthlyGoal - revenueProjection).toLocaleString()} short of goal`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader className="px-5 py-3.5">
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <QuickActions navigate={navigate} onNew={() => setIsModalOpen(true)} planTier={planTier} userRole={userRole} pendingAgentDrafts={pendingAgentDrafts} />
              </CardContent>
            </Card>

            {/* Setup Progress */}
            {!loading && (
              <SetupProgress checklist={setupChecklist} onAction={(path) => navigate(path)} />
            )}

            {/* At a Glance */}
            <Card className="border-slate-200/70 dark:border-slate-700">
              <CardHeader className="px-5 py-3.5">
                <CardTitle className="text-sm font-semibold">At a Glance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 px-4 pb-4 pt-0">
                {[
                  { Icon:MapPin,    label:'Miles logged',    val:`${totalMiles.toFixed(1)} mi`,  sub:`$${(totalMiles*cpm).toFixed(0)} est. reimbursement value`, cls:'text-blue-500',    path:'/mileage' },
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
