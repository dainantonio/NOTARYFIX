// src/pages/NetworkInsightsPage.jsx
// Network Insight Agent — Market intelligence dashboard
// Fee benchmarks, payment risk, your stats vs market, insight feed.
import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles,
  Search, Shield, MapPin, DollarSign, BarChart2, ChevronRight,
  Info, CheckCircle, XCircle, Clock, Users, Target,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  MARKET_BENCHMARKS,
  PAYMENT_RISK_DB,
  getUserStats,
  generateInsightFeed,
  calcTravelCost,
} from '../services/networkInsightService';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => `$${Number(n || 0).toFixed(0)}`;
const cx   = (...c) => c.filter(Boolean).join(' ');

const TREND_ICONS = {
  rising:   { Icon: TrendingUp,   color: 'text-emerald-500' },
  stable:   { Icon: Minus,        color: 'text-slate-400'   },
  declining:{ Icon: TrendingDown, color: 'text-red-500'     },
};

const RISK_STYLES = {
  low:     { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  medium:  { bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-400',    dot: 'bg-amber-500'   },
  high:    { bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-400',        dot: 'bg-red-500'     },
  unknown: { bg: 'bg-slate-100 dark:bg-slate-700',       text: 'text-slate-600 dark:text-slate-300',    dot: 'bg-slate-400'   },
};

const SEVERITY_STYLES = {
  high:   { bg: 'bg-red-50 dark:bg-red-900/20',    border: 'border-red-200 dark:border-red-800',    dot: 'bg-red-500'     },
  medium: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500'  },
  low:    { bg: 'bg-blue-50 dark:bg-blue-900/20',  border: 'border-blue-200 dark:border-blue-800',  dot: 'bg-blue-500'    },
};

// ── Market benchmark card ─────────────────────────────────────────────────────
const BenchmarkCard = ({ jobKey, bench, yourStat, onClick, isSelected }) => {
  const trend = TREND_ICONS[bench.trend] || TREND_ICONS.stable;
  const gap   = yourStat ? (bench.avgFee - yourStat.yourAvgFee) : null;
  const gapPct = yourStat && yourStat.yourAvgFee ? Math.round((gap / yourStat.yourAvgFee) * 100) : null;

  return (
    <button
      onClick={onClick}
      className={cx(
        'text-left p-4 rounded-2xl border transition-all duration-200',
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{bench.label}</div>
        <trend.Icon className={cx('w-4 h-4 flex-shrink-0 mt-0.5', trend.color)} />
      </div>

      <div className="mb-3">
        <div className="text-xl font-bold text-slate-900 dark:text-white">{fmt(bench.avgFee)}</div>
        <div className="text-xs text-slate-400">market avg</div>
      </div>

      {/* Fee bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 w-6">{fmt(bench.minFee)}</span>
          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 relative">
            <div
              className="absolute bg-blue-500 h-1.5 rounded-full"
              style={{
                left: `${((bench.avgFee - bench.minFee) / (bench.maxFee - bench.minFee)) * 70}%`,
                width: '4px',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
          <span className="text-[10px] text-slate-400 w-8 text-right">{fmt(bench.maxFee)}</span>
        </div>
        <div className="text-[10px] text-slate-400">Range: {fmt(bench.minFee)}–{fmt(bench.maxFee)}</div>
      </div>

      {/* Your avg vs market */}
      {yourStat && (
        <div className={cx(
          'flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold',
          gap > 15 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
          gap < -10 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
          'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        )}>
          <span>Your avg: {fmt(yourStat.yourAvgFee)}</span>
          {gapPct !== null && (
            <span>{gap > 0 ? `↓ ${gapPct}% under` : `↑ ${Math.abs(gapPct)}% over`}</span>
          )}
        </div>
      )}

      {bench.avgMiles > 0 && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
          <MapPin className="w-3 h-3" />
          <span>Avg {bench.avgMiles} mi · {bench.avgDurationMins} min</span>
        </div>
      )}
    </button>
  );
};

// ── Payment risk lookup ───────────────────────────────────────────────────────
const PaymentRiskLookup = () => {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    if (!query.trim()) return PAYMENT_RISK_DB.slice(0, 8);
    const q = query.toLowerCase();
    return PAYMENT_RISK_DB.filter(c =>
      c.name.toLowerCase().includes(q) || c.slug.includes(q)
    );
  }, [query]);

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search signing company…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div className="space-y-2">
        {results.map(company => {
          const style = RISK_STYLES[company.risk] || RISK_STYLES.unknown;
          return (
            <div key={company.slug} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={cx('w-2.5 h-2.5 rounded-full flex-shrink-0', style.dot)} />
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{company.name}</div>
                  {company.reports > 0 && (
                    <div className="text-xs text-slate-400">{company.reports.toLocaleString()} community reports</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {company.avgDays !== null && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{company.avgDays}d avg</span>
                  </div>
                )}
                <span className={cx('text-xs font-semibold px-2.5 py-1 rounded-full', style.bg, style.text)}>
                  {company.riskLabel}
                </span>
              </div>
            </div>
          );
        })}
        {results.length === 0 && (
          <div className="text-sm text-slate-400 text-center py-6">
            No data for "{query}" — this company isn't in our database yet.
          </div>
        )}
        <div className="text-xs text-slate-400 text-center pt-2">
          Payment data based on community reports. Always verify independently.
        </div>
      </div>
    </div>
  );
};

// ── Insight feed item ─────────────────────────────────────────────────────────
const InsightItem = ({ insight }) => {
  const style = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.low;
  const iconMap = {
    TrendingUp: TrendingUp, AlertTriangle, Sparkles, MapPin, Target,
  };
  const Icon = iconMap[insight.icon] || Sparkles;

  return (
    <div className={cx('border rounded-2xl p-4 flex items-start gap-3', style.bg, style.border)}>
      <div className={cx('w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5', style.dot)} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{insight.title}</div>
        <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{insight.body}</div>
        {insight.action && (
          <div className="mt-2">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              {insight.action}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Travel calculator ─────────────────────────────────────────────────────────
const TravelCalc = ({ settings }) => {
  const [miles, setMiles] = useState('');
  const cost = miles && !isNaN(Number(miles)) ? calcTravelCost(Number(miles), settings?.costPerMile || 0.67) : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="number" min="0" placeholder="One-way miles"
            value={miles} onChange={e => setMiles(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
      {cost ? (
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Round trip</span><span>{cost.roundTrip} miles</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Travel cost (IRS rate)</span><span>${cost.travelCost}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Avg printing cost</span><span>${cost.printCost}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-600 pt-2 text-slate-900 dark:text-white">
            <span>Total job cost</span><span>${cost.totalCost}</span>
          </div>
          <div className="text-xs text-slate-400 pt-1">
            Minimum profitable fee: ~${cost.totalCost + 40}–${cost.totalCost + 80}
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-400 text-center py-4">Enter miles to calculate job cost</div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NetworkInsightsPage() {
  const { data } = useData();
  const [activeTab, setActiveTab] = useState('benchmarks');
  const [selectedBenchmark, setSelectedBenchmark] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const userStats    = useMemo(() => getUserStats(data.jobs || []), [data.jobs]);
  const insightFeed  = useMemo(() => generateInsightFeed(data.jobs || [], data.settings), [data.jobs, data.settings]);

  const filteredBenchmarks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return Object.entries(MARKET_BENCHMARKS).filter(([, b]) =>
      !q || b.label.toLowerCase().includes(q) || b.documentTypes.some(d => d.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const selectedBench = selectedBenchmark ? MARKET_BENCHMARKS[selectedBenchmark] : null;
  const selectedYourStat = selectedBenchmark ? userStats[selectedBenchmark] : null;

  const TABS = [
    { id: 'benchmarks', label: 'Fee Benchmarks'  },
    { id: 'payment',    label: 'Payment Risk'    },
    { id: 'insights',   label: `Agent Insights ${insightFeed.length > 0 ? `(${insightFeed.length})` : ''}` },
    { id: 'travel',     label: 'Travel Calculator' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Market Insights</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fee benchmarks, payment risk data, and AI-powered optimization insights.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
          <Users className="w-4 h-4" />
          <span>Industry data · Not from your account</span>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Job Types Tracked', value: Object.keys(MARKET_BENCHMARKS).length, icon: BarChart2, color: 'blue' },
          { label: 'Your Job Types',    value: Object.keys(userStats).length || '—',  icon: Target,    color: 'green' },
          { label: 'Companies Rated',  value: PAYMENT_RISK_DB.length,                 icon: Shield,    color: 'purple' },
          { label: 'Agent Insights',   value: insightFeed.length,                     icon: Sparkles,  color: insightFeed.length > 0 ? 'amber' : 'slate' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
            <div className={cx('w-9 h-9 rounded-xl flex items-center justify-center', {
              blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600', green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
              purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600', amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
              slate: 'bg-slate-100 dark:bg-slate-700 text-slate-400',
            }[s.color])}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex gap-2 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cx(
                'px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── FEE BENCHMARKS ───────────────────────────────────────── */}
          {activeTab === 'benchmarks' && (
            <div>
              <div className="flex flex-col sm:flex-row gap-4 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text" placeholder="Search job type…"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> Rising</div>
                  <div className="flex items-center gap-1"><Minus className="w-3 h-3 text-slate-400" /> Stable</div>
                  <div className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500" /> Declining</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
                {filteredBenchmarks.map(([key, bench]) => (
                  <BenchmarkCard
                    key={key}
                    jobKey={key}
                    bench={bench}
                    yourStat={userStats[key]}
                    onClick={() => setSelectedBenchmark(selectedBenchmark === key ? null : key)}
                    isSelected={selectedBenchmark === key}
                  />
                ))}
              </div>

              {/* Detail panel */}
              {selectedBench && (
                <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedBench.label}</h3>
                    <button onClick={() => setSelectedBenchmark(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                      <div className="text-xs text-slate-500 mb-1">Fee Range</div>
                      <div className="font-bold text-slate-900 dark:text-white">{fmt(selectedBench.minFee)} – {fmt(selectedBench.maxFee)}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Avg: {fmt(selectedBench.avgFee)}</div>
                    </div>
                    {selectedBench.avgMiles > 0 && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                        <div className="text-xs text-slate-500 mb-1">Avg Travel</div>
                        <div className="font-bold text-slate-900 dark:text-white">{selectedBench.avgMiles} miles</div>
                        <div className="text-xs text-slate-400 mt-1">{selectedBench.avgDurationMins} min avg</div>
                      </div>
                    )}
                    {selectedYourStat && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                        <div className="text-xs text-slate-500 mb-1">Your Average</div>
                        <div className="font-bold text-slate-900 dark:text-white">{fmt(selectedYourStat.yourAvgFee)}</div>
                        <div className="text-xs text-slate-400 mt-1">{selectedYourStat.jobCount} jobs</div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">{selectedBench.trendNote}</div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Typical Documents</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedBench.documentTypes.map(d => (
                        <span key={d} className="text-xs px-2 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Your stats vs market comparison */}
              {Object.keys(userStats).length > 0 && (
                <div className="mt-5 border-t border-slate-100 dark:border-slate-700 pt-5">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Your Averages vs Market</div>
                  <div className="space-y-3">
                    {Object.entries(userStats).map(([key, stat]) => {
                      if (!stat.marketAvgFee) return null;
                      const pctOfMarket = Math.round((stat.yourAvgFee / stat.marketAvgFee) * 100);
                      const color = pctOfMarket >= 95 ? 'bg-emerald-500' : pctOfMarket >= 80 ? 'bg-amber-500' : 'bg-red-500';
                      return (
                        <div key={key} className="flex items-center gap-4">
                          <div className="text-sm text-slate-700 dark:text-slate-300 w-40 truncate">{stat.label}</div>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                            <div className={cx('rounded-full h-2 transition-all', color)} style={{ width: `${Math.min(pctOfMarket, 100)}%` }} />
                          </div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-32 text-right">
                            {fmt(stat.yourAvgFee)} / {fmt(stat.marketAvgFee)}
                          </div>
                          <div className={cx(
                            'text-xs font-bold w-12 text-right',
                            pctOfMarket >= 95 ? 'text-emerald-600' : pctOfMarket >= 80 ? 'text-amber-600' : 'text-red-600'
                          )}>
                            {pctOfMarket}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENT RISK ─────────────────────────────────────────── */}
          {activeTab === 'payment' && (
            <div>
              <div className="mb-5 flex items-start gap-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Payment ratings are based on notary community reports. Fast Payer = avg &lt;25 days · Reliable = 25–35 days · Slow Payer = 35+ days.
                  Always confirm payment terms before accepting a job.
                </div>
              </div>
              <PaymentRiskLookup />
            </div>
          )}

          {/* ── AGENT INSIGHTS ──────────────────────────────────────── */}
          {activeTab === 'insights' && (
            <div>
              {insightFeed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">No insights yet</div>
                    <div className="text-sm text-slate-400 mt-1">
                      Complete a few jobs to unlock AI-powered insights about your pricing and performance.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {insightFeed.map(insight => (
                    <InsightItem key={insight.id} insight={insight} />
                  ))}
                </div>
              )}

              {/* Privacy note */}
              <div className="mt-6 flex items-start gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Insights are generated locally using only your own job history. No data leaves your device.</span>
              </div>
            </div>
          )}

          {/* ── TRAVEL CALCULATOR ───────────────────────────────────── */}
          {activeTab === 'travel' && (
            <div className="max-w-md">
              <div className="mb-5 text-sm text-slate-600 dark:text-slate-300">
                Enter the one-way distance to a job to calculate your true cost and minimum profitable fee.
              </div>
              <TravelCalc settings={data.settings} />
              <div className="mt-5 border-t border-slate-100 dark:border-slate-700 pt-5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Reference</div>
                <div className="space-y-2 text-sm">
                  {[
                    { miles: 10, label: 'Local (10 mi)' },
                    { miles: 25, label: 'Nearby (25 mi)' },
                    { miles: 40, label: 'Extended (40 mi)' },
                    { miles: 60, label: 'Long haul (60 mi)' },
                  ].map(({ miles, label }) => {
                    const c = calcTravelCost(miles, data.settings?.costPerMile || 0.67);
                    return (
                      <div key={miles} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <span className="text-slate-600 dark:text-slate-300">{label}</span>
                        <div className="text-right">
                          <div className="font-semibold text-slate-900 dark:text-white">${c.totalCost} cost</div>
                          <div className="text-xs text-slate-400">min fee: ~${c.totalCost + 50}+</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Data disclaimer ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-slate-400 justify-center pb-2">
        <Info className="w-3.5 h-3.5" />
        <span>Market data sourced from NSA/NNA industry surveys. Your personal data never leaves your device.</span>
      </div>
    </div>
  );
}
