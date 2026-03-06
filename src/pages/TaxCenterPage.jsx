// src/pages/TaxCenterPage.jsx
// Finance Intelligence — Tax Center
// Tracks income, mileage deductions, expenses, and tax documents.
// Generates CPA-ready exports. All data is user-controlled.
import React, { useState, useMemo } from 'react';
import {
  DollarSign, Car, Receipt, FileText, Download, Plus, Trash2,
  TrendingUp, Shield, Upload, Check, ChevronRight, Info,
  BarChart2, Calendar, X, AlertTriangle, BookOpen,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  calcTaxSummary,
  exportCSV, downloadCSV,
  generateCPAReport, downloadCPAReport,
  EXPENSE_CATEGORIES,
} from '../services/financeAgentService';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = (n) => Number(n || 0) >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);
const cx   = (...classes) => classes.filter(Boolean).join(' ');

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const TAX_DOC_TYPES = ['1099-NEC', 'W-9', 'Receipt', 'Invoice', '1099-K', 'Other'];

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue', badge }) => {
  const colors = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{badge}</span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
};

const Tab = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cx(
      'px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap',
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
    )}
  >
    {children}
  </button>
);

const EmptyState = ({ icon: Icon, title, body }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
      <Icon className="w-7 h-7 text-slate-400" />
    </div>
    <div>
      <div className="font-semibold text-slate-700 dark:text-slate-300">{title}</div>
      <div className="text-sm text-slate-400 mt-1">{body}</div>
    </div>
  </div>
);

// ── Add Expense Modal ─────────────────────────────────────────────────────────
const AddExpenseModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'printing',
    description: '',
    vendor: '',
    amount: '',
    notes: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.amount || isNaN(Number(form.amount))) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Business Expense</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount ($)</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              {EXPENSE_CATEGORIES.filter(c => c.deductible).map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
            <input type="text" placeholder="What was this for?" value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Vendor / Payee</label>
            <input type="text" placeholder="Amazon, Staples, etc." value={form.vendor} onChange={e => set('vendor', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">Save Expense</button>
        </div>
      </div>
    </div>
  );
};

// ── Add Tax Document Modal ────────────────────────────────────────────────────
const AddDocModal = ({ onClose, onSave, year }) => {
  const [form, setForm] = useState({ docType: '1099-NEC', taxYear: year, payer: '', amount: '', notes: '' });
  const [agentSuggestion, setAgentSuggestion] = useState(null);
  const [simulated, setSimulated] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Simulate agent extraction on "upload"
  const handleSimulateUpload = () => {
    if (form.docType === '1099-NEC' && !simulated) {
      setAgentSuggestion({
        docType: '1099-NEC',
        payer: 'Signing Services LLC',
        amount: '4820.00',
        note: 'Agent detected payer name and box 1 amount from document.',
      });
      setSimulated(true);
    }
  };

  const handleAcceptSuggestion = () => {
    setForm(f => ({ ...f, payer: agentSuggestion.payer, amount: agentSuggestion.amount }));
    setAgentSuggestion(null);
  };

  const handleSave = () => {
    onSave({ ...form, agentExtracted: simulated });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Tax Document</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Simulated upload zone */}
          <div
            onClick={handleSimulateUpload}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Click to simulate upload</div>
            <div className="text-xs text-slate-400 mt-1">1099-NEC, W-9, Receipts, Invoices</div>
          </div>

          {/* Agent suggestion */}
          {agentSuggestion && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Agent Detected</div>
                  <div className="text-xs text-blue-700 dark:text-blue-400 mb-2">{agentSuggestion.note}</div>
                  <div className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                    <div>Payer: <strong>{agentSuggestion.payer}</strong></div>
                    <div>Amount: <strong>${agentSuggestion.amount}</strong></div>
                  </div>
                  <button onClick={handleAcceptSuggestion} className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    Add to Income Ledger
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Document Type</label>
              <select value={form.docType} onChange={e => set('docType', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                {TAX_DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tax Year</label>
              <select value={form.taxYear} onChange={e => set('taxYear', Number(e.target.value))}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Payer / Issuer</label>
            <input type="text" placeholder="Company name" value={form.payer} onChange={e => set('payer', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount</label>
            <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes</label>
            <input type="text" placeholder="Optional notes" value={form.notes} onChange={e => set('notes', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">Save Document</button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TaxCenterPage() {
  const { data, addBusinessExpense, deleteBusinessExpense, addTaxDocument, deleteTaxDocument } = useData();
  const [activeTab, setActiveTab] = useState('income');
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // ── Compute tax summary ──────────────────────────────────────────────────
  const summary = useMemo(() =>
    calcTaxSummary(
      data.jobs || [],
      data.mileageLogs || [],
      data.businessExpenses || [],
      data.jobExpenses || [],
      data.settings,
      selectedYear
    ),
    [data.jobs, data.mileageLogs, data.businessExpenses, data.jobExpenses, data.settings, selectedYear]
  );

  // ── Income: completed jobs for year ─────────────────────────────────────
  const incomeJobs = useMemo(() => {
    const yearStart = new Date(`${selectedYear}-01-01T00:00:00`);
    const yearEnd   = new Date(`${selectedYear}-12-31T23:59:59`);
    return (data.jobs || []).filter(j => {
      const incomeStages = ['Completed', 'Invoice Sent', 'Payment Received'];
      if (!incomeStages.includes(j.lifecycleStage)) return false;
      const d = new Date(j.completedAt || j.date || j.createdAt || 0);
      return d >= yearStart && d <= yearEnd;
    }).sort((a, b) => new Date(b.completedAt || b.date || 0) - new Date(a.completedAt || a.date || 0));
  }, [data.jobs, selectedYear]);

  // ── Mileage logs for year ───────────────────────────────────────────────
  const yearMileage = useMemo(() => {
    const yearStart = new Date(`${selectedYear}-01-01T00:00:00`);
    const yearEnd   = new Date(`${selectedYear}-12-31T23:59:59`);
    return (data.mileageLogs || []).filter(l => {
      const d = new Date(l.date || l.createdAt || 0);
      return d >= yearStart && d <= yearEnd;
    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [data.mileageLogs, selectedYear]);

  // ── Business expenses for year ──────────────────────────────────────────
  const yearExpenses = useMemo(() => {
    const yearStart = new Date(`${selectedYear}-01-01T00:00:00`);
    const yearEnd   = new Date(`${selectedYear}-12-31T23:59:59`);
    return (data.businessExpenses || []).filter(e => {
      const d = new Date(e.date || e.createdAt || 0);
      return d >= yearStart && d <= yearEnd;
    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [data.businessExpenses, selectedYear]);

  // ── Tax documents ────────────────────────────────────────────────────────
  const yearDocs = useMemo(() =>
    (data.taxDocuments || []).filter(d => d.taxYear === selectedYear),
    [data.taxDocuments, selectedYear]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    setExportLoading(true);
    setTimeout(() => {
      const csv = exportCSV(
        data.jobs || [], data.businessExpenses || [],
        data.jobExpenses || [], data.mileageLogs || [], selectedYear
      );
      downloadCSV(csv, selectedYear);
      setExportLoading(false);
    }, 300);
  };

  const handleExportCPA = () => {
    setExportLoading(true);
    setTimeout(() => {
      const report = generateCPAReport(
        data.jobs || [], data.businessExpenses || [],
        data.jobExpenses || [], data.mileageLogs || [],
        data.settings, selectedYear
      );
      downloadCPAReport(report, selectedYear);
      setExportLoading(false);
    }, 300);
  };

  const TABS = [
    { id: 'income',    label: 'Income',     count: incomeJobs.length },
    { id: 'mileage',   label: 'Mileage',    count: yearMileage.length },
    { id: 'expenses',  label: 'Expenses',   count: yearExpenses.length },
    { id: 'documents', label: 'Documents',  count: yearDocs.length },
    { id: 'export',    label: 'Export',     count: null },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tax Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Income tracking, mileage deductions, and CPA-ready exports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent outline-none"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Disclaimer banner ────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Tax figures are <strong>estimates for planning purposes only</strong>. Consult a licensed CPA or tax professional before filing.
        </p>
      </div>

      {/* ── YTD Summary cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign} label="Gross Income" color="green"
          value={fmtK(summary.grossIncome)}
          sub={`${summary.income.jobCount} completed jobs`}
        />
        <StatCard
          icon={Car} label="Mileage Deduction" color="blue"
          value={fmtK(summary.mileageDeduction)}
          sub={`${summary.mileage.totalMiles} miles @ $${summary.mileage.ratePerMile}/mi`}
          badge="IRS 2026"
        />
        <StatCard
          icon={Receipt} label="Total Expenses" color="amber"
          value={fmtK(summary.expenseDeduction)}
          sub={`${yearExpenses.length} business expenses`}
        />
        <StatCard
          icon={TrendingUp} label="Est. Net Income" color="purple"
          value={fmtK(summary.netIncome)}
          sub={`After deductions`}
        />
      </div>

      {/* ── Tax estimate strip ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 rounded-2xl p-5 border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">SE Tax (est.)</div>
              <div className="text-lg font-bold text-white">{fmt(summary.seTax)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Income Tax (est.)</div>
              <div className="text-lg font-bold text-white">{fmt(summary.estimatedIncomeTax)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Total Tax (est.)</div>
              <div className="text-lg font-bold text-amber-400">{fmt(summary.totalTax)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Quarterly Payment</div>
              <div className="text-lg font-bold text-blue-400">{fmt(summary.quarterlyPayment)}</div>
            </div>
          </div>
          <button
            onClick={handleExportCPA}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            CPA Report
          </button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex gap-2 overflow-x-auto">
          {TABS.map(tab => (
            <Tab key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className={cx(
                  'ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                )}>{tab.count}</span>
              )}
            </Tab>
          ))}
        </div>

        <div className="p-5">

          {/* ── INCOME TAB ────────────────────────────────────────────── */}
          {activeTab === 'income' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Completed Jobs — {selectedYear}
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Total: {fmt(summary.grossIncome)}
                </div>
              </div>
              {incomeJobs.length === 0 ? (
                <EmptyState icon={DollarSign} title="No income recorded" body={`Complete jobs to see ${selectedYear} income here.`} />
              ) : (
                <div className="space-y-2">
                  {incomeJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {job.clientName || 'Unknown Client'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-500">{job.jobType || job.type || 'General'}</span>
                          {job.location && <span className="text-xs text-slate-400">· {job.location}</span>}
                          <span className="text-xs text-slate-400">
                            · {new Date(job.completedAt || job.date || job.createdAt || 0).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cx(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          job.lifecycleStage === 'Payment Received'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        )}>
                          {job.lifecycleStage}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{fmt(job.fee)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Monthly breakdown */}
              {summary.income.monthly.some(m => m.income > 0) && (
                <div className="mt-6">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Monthly Breakdown</div>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                    {summary.income.monthly.map((m, i) => {
                      const maxIncome = Math.max(...summary.income.monthly.map(x => x.income), 1);
                      const pct = (m.income / maxIncome) * 100;
                      return (
                        <div key={i} className="flex flex-col items-center gap-1" title={`${m.label}: ${fmt(m.income)}`}>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-sm" style={{ height: 40 }}>
                            <div
                              className="bg-emerald-500 dark:bg-emerald-400 rounded-sm transition-all"
                              style={{ height: `${pct}%`, minHeight: m.income > 0 ? 2 : 0 }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MILEAGE TAB ───────────────────────────────────────────── */}
          {activeTab === 'mileage' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mileage Log — {selectedYear}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{fmt(summary.mileageDeduction)} deduction</div>
                  <div className="text-xs text-slate-400">{summary.mileage.totalMiles} miles @ ${summary.mileage.ratePerMile}/mi</div>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Car className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Mileage logs are managed on the <strong>Mileage</strong> page. This view shows deduction calculations for tax year {selectedYear}.
                  </div>
                </div>
              </div>
              {yearMileage.length === 0 ? (
                <EmptyState icon={Car} title="No mileage logs" body="Add mileage on the Mileage page to calculate your IRS deduction." />
              ) : (
                <div className="space-y-2">
                  {yearMileage.slice(0, 50).map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {log.destination || log.purpose || 'Business Trip'}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(log.date || log.createdAt || 0).toLocaleDateString()}
                          {log.purpose && log.destination ? ` · ${log.purpose}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {Number(log.miles || log.distance || 0).toFixed(1)} mi
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {fmt((Number(log.miles || log.distance || 0)) * summary.mileage.ratePerMile)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {yearMileage.length > 50 && (
                    <div className="text-xs text-center text-slate-400 py-2">Showing 50 of {yearMileage.length} records</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── EXPENSES TAB ──────────────────────────────────────────── */}
          {activeTab === 'expenses' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Business Expenses — {selectedYear}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400">{fmt(summary.expenseDeduction)}</div>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
              {yearExpenses.length === 0 ? (
                <EmptyState icon={Receipt} title="No expenses recorded" body="Track deductible business expenses to reduce your tax bill." />
              ) : (
                <div className="space-y-2">
                  {yearExpenses.map(exp => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.key === exp.category);
                    return (
                      <div key={exp.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              {cat?.label || exp.category}
                            </span>
                            {cat?.schedule && (
                              <span className="text-[10px] text-slate-400">{cat.schedule}</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300 mt-1 truncate">
                            {exp.description || 'Business expense'}
                            {exp.vendor && <span className="text-slate-400"> · {exp.vendor}</span>}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {new Date(exp.date || exp.createdAt || 0).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{fmt(exp.amount)}</span>
                          <button onClick={() => deleteBusinessExpense?.(exp.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Category breakdown */}
              {Object.keys(summary.expenses.byCategory).length > 0 && (
                <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-5">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">By Category</div>
                  <div className="space-y-2">
                    {Object.entries(summary.expenses.byCategory).sort(([,a],[,b]) => b - a).map(([cat, amt]) => {
                      const info = EXPENSE_CATEGORIES.find(c => c.key === cat);
                      const pct = summary.expenseDeduction > 0 ? (amt / summary.expenseDeduction) * 100 : 0;
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <div className="text-xs text-slate-600 dark:text-slate-300 w-36 truncate">{info?.label || cat}</div>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                            <div className="bg-amber-500 rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-20 text-right">{fmt(amt)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DOCUMENTS TAB ────────────────────────────────────────── */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tax Documents — {selectedYear}</div>
                <button
                  onClick={() => setShowAddDoc(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Document
                </button>
              </div>
              {yearDocs.length === 0 ? (
                <EmptyState icon={FileText} title="No documents uploaded" body="Upload 1099-NEC, W-9, receipts, and other tax documents here." />
              ) : (
                <div className="space-y-2">
                  {yearDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.docType}</span>
                          {doc.agentExtracted && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">AI Extracted</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {doc.payer && <span>{doc.payer}</span>}
                          {doc.amount != null && <span> · {fmt(doc.amount)}</span>}
                          {doc.notes && <span> · {doc.notes}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteTaxDocument?.(doc.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── EXPORT TAB ───────────────────────────────────────────── */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Export your financial data for your records or share with your CPA.
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {/* CSV Export */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                    <Download className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">CSV Export</div>
                    <div className="text-sm text-slate-500 mt-1">Income, expenses, and mileage in spreadsheet format. Import into Excel, Google Sheets, or QuickBooks.</div>
                  </div>
                  <button onClick={handleExportCSV} disabled={exportLoading}
                    className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                </div>

                {/* CPA Report */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">CPA Report</div>
                    <div className="text-sm text-slate-500 mt-1">Formatted Schedule C summary with income, deductions, and estimated tax. Send directly to your accountant.</div>
                  </div>
                  <button onClick={handleExportCPA} disabled={exportLoading}
                    className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                    <FileText className="w-4 h-4" />
                    Download Report
                  </button>
                </div>

                {/* Yearly Summary */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                    <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">On-Screen Summary</div>
                    <div className="text-sm text-slate-500 mt-1">View a complete {selectedYear} financial breakdown on-screen. Switch to Income or Expenses tabs for details.</div>
                  </div>
                  <div className="mt-auto space-y-2 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Gross Income</span><span className="font-semibold">{fmt(summary.grossIncome)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Deductions</span><span className="font-semibold text-red-500">-{fmt(summary.totalDeductions)}</span></div>
                    <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-2"><span className="font-bold">Net Income</span><span className="font-bold text-emerald-600">{fmt(summary.netIncome)}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mt-4">
                <BookOpen className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-300">Schedule C reminder:</strong> As a self-employed notary, report business income and expenses on Schedule C. Your net profit is subject to self-employment tax (15.3%) in addition to regular income tax.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onSave={(exp) => addBusinessExpense?.(exp)}
        />
      )}
      {showAddDoc && (
        <AddDocModal
          onClose={() => setShowAddDoc(false)}
          onSave={(doc) => addTaxDocument?.(doc)}
          year={selectedYear}
        />
      )}
    </div>
  );
}
