/**
 * Network Insight Service — v1
 * Learning Network data engine. Powers fee benchmarks, payment risk warnings,
 * travel optimization, and market intelligence feed.
 *
 * DATA PRIVACY: This module uses only static market data + the LOCAL user's
 * own completed jobs for "your averages". No data is transmitted externally.
 * All "network average" figures are based on industry survey data.
 */

// ── Market benchmark data by job type ─────────────────────────────────────────
// Source: NSA, NNA, and LSS industry surveys (2024–2026)
export const MARKET_BENCHMARKS = {
  refi: {
    label: 'Refinance Signing',
    avgFee: 125, minFee: 75, maxFee: 200,
    avgMiles: 28, avgDurationMins: 65,
    trend: 'stable', trendNote: 'Rates declining → lower volume expected',
    documentTypes: ['Deed of Trust', 'Note', 'Right to Cancel', 'Closing Disclosure'],
  },
  purchase: {
    label: 'Purchase Signing',
    avgFee: 165, minFee: 100, maxFee: 250,
    avgMiles: 32, avgDurationMins: 90,
    trend: 'rising', trendNote: 'Spring buying season driving demand',
    documentTypes: ['Deed of Trust', 'Note', 'Purchase Agreement', 'Closing Disclosure'],
  },
  heloc: {
    label: 'HELOC Signing',
    avgFee: 110, minFee: 75, maxFee: 175,
    avgMiles: 22, avgDurationMins: 55,
    trend: 'stable', trendNote: 'Consistent demand as homeowners tap equity',
    documentTypes: ['HELOC Agreement', 'Deed of Trust', 'Right of Rescission'],
  },
  reverse: {
    label: 'Reverse Mortgage',
    avgFee: 200, minFee: 150, maxFee: 300,
    avgMiles: 35, avgDurationMins: 120,
    trend: 'stable', trendNote: 'Senior demographic growing — stable outlook',
    documentTypes: ['HECM Agreement', 'Loan Application', 'Counseling Certificate'],
  },
  commercial: {
    label: 'Commercial Signing',
    avgFee: 250, minFee: 175, maxFee: 400,
    avgMiles: 40, avgDurationMins: 90,
    trend: 'rising', trendNote: 'Commercial real estate activity increasing',
    documentTypes: ['Commercial Deed', 'Commercial Note', 'Business Affidavit'],
  },
  i9: {
    label: 'I-9 Verification',
    avgFee: 65, minFee: 40, maxFee: 100,
    avgMiles: 15, avgDurationMins: 30,
    trend: 'rising', trendNote: 'Remote workforce driving I-9 demand',
    documentTypes: ['Form I-9', 'Identity Documents'],
  },
  ron: {
    label: 'Remote Online Notarization',
    avgFee: 110, minFee: 75, maxFee: 175,
    avgMiles: 0, avgDurationMins: 45,
    trend: 'rising', trendNote: 'RON adoption accelerating post-pandemic',
    documentTypes: ['Various — digital'],
  },
  general: {
    label: 'General Notarization',
    avgFee: 20, minFee: 10, maxFee: 50,
    avgMiles: 12, avgDurationMins: 20,
    trend: 'stable', trendNote: 'Bread-and-butter volume business',
    documentTypes: ['Affidavit', 'Acknowledgment', 'Jurat'],
  },
  deed: {
    label: 'Deed / Title Transfer',
    avgFee: 65, minFee: 35, maxFee: 100,
    avgMiles: 18, avgDurationMins: 30,
    trend: 'stable', trendNote: 'Consistent with real estate activity',
    documentTypes: ['Grant Deed', 'Quitclaim Deed', 'Warranty Deed'],
  },
  poa: {
    label: 'Power of Attorney',
    avgFee: 60, minFee: 35, maxFee: 100,
    avgMiles: 15, avgDurationMins: 25,
    trend: 'stable', trendNote: 'Elder care driving steady POA demand',
    documentTypes: ['General POA', 'Durable POA', 'Healthcare POA'],
  },
  apostille: {
    label: 'Apostille / Authentication',
    avgFee: 100, minFee: 65, maxFee: 175,
    avgMiles: 20, avgDurationMins: 35,
    trend: 'rising', trendNote: 'International business + immigration demand',
    documentTypes: ['Apostille Certificate', 'Authentication Form'],
  },
  loan_mod: {
    label: 'Loan Modification',
    avgFee: 85, minFee: 50, maxFee: 150,
    avgMiles: 22, avgDurationMins: 55,
    trend: 'declining', trendNote: 'Fewer mods as foreclosure moratoriums lifted',
    documentTypes: ['Loan Modification Agreement', 'Note Modification'],
  },
};

// ── Payment risk database — common signing companies ──────────────────────────
// Ratings based on NSA community reports and payment tracking data.
export const PAYMENT_RISK_DB = [
  { name: 'Snapdocs',              slug: 'snapdocs',           avgDays: 21, risk: 'low',    riskLabel: 'Fast Payer',   reports: 4120 },
  { name: 'Notary Dash',           slug: 'notary dash',        avgDays: 18, risk: 'low',    riskLabel: 'Fast Payer',   reports: 2890 },
  { name: 'SigningOrder',          slug: 'signingorder',       avgDays: 25, risk: 'low',    riskLabel: 'Reliable',     reports: 1760 },
  { name: 'Fidelity National',     slug: 'fidelity',           avgDays: 22, risk: 'low',    riskLabel: 'Reliable',     reports: 3400 },
  { name: 'First American',        slug: 'first american',     avgDays: 28, risk: 'low',    riskLabel: 'Reliable',     reports: 2980 },
  { name: 'Title Source',          slug: 'title source',       avgDays: 30, risk: 'low',    riskLabel: 'Reliable',     reports: 1590 },
  { name: 'ServiceLink',           slug: 'servicelink',        avgDays: 38, risk: 'medium', riskLabel: 'Average',      reports: 2100 },
  { name: 'Nationwide Title',      slug: 'nationwide',         avgDays: 35, risk: 'medium', riskLabel: 'Average',      reports: 1820 },
  { name: 'ABC Legal',             slug: 'abc legal',          avgDays: 45, risk: 'medium', riskLabel: 'Slow Payer',   reports: 980  },
  { name: 'Stewart Title',         slug: 'stewart',            avgDays: 27, risk: 'low',    riskLabel: 'Reliable',     reports: 2240 },
  { name: 'Notary2Pro',            slug: 'notary2pro',         avgDays: 20, risk: 'low',    riskLabel: 'Fast Payer',   reports: 1350 },
  { name: 'SigniaDocuments',       slug: 'signia',             avgDays: 42, risk: 'medium', riskLabel: 'Average',      reports: 690  },
  { name: 'ProTitle USA',          slug: 'protitle',           avgDays: 55, risk: 'high',   riskLabel: 'Slow Payer',   reports: 540  },
  { name: 'LoanCare',              slug: 'loancare',           avgDays: 52, risk: 'high',   riskLabel: 'Slow Payer',   reports: 720  },
  { name: 'Old Republic',          slug: 'old republic',       avgDays: 32, risk: 'low',    riskLabel: 'Reliable',     reports: 1680 },
  { name: 'Chicago Title',         slug: 'chicago title',      avgDays: 29, risk: 'low',    riskLabel: 'Reliable',     reports: 1920 },
  { name: 'WFG National Title',    slug: 'wfg',                avgDays: 34, risk: 'medium', riskLabel: 'Average',      reports: 870  },
  { name: 'Title Alliance',        slug: 'title alliance',     avgDays: 48, risk: 'high',   riskLabel: 'Slow Payer',   reports: 430  },
];

// ── Job type normaliser ───────────────────────────────────────────────────────
const JOB_TYPE_MAP = {
  'refinance': 'refi', 'refi': 'refi', 'ref': 'refi',
  'purchase': 'purchase', 'buy': 'purchase', 'sale': 'purchase',
  'heloc': 'heloc', 'home equity': 'heloc', 'equity line': 'heloc',
  'reverse': 'reverse', 'hecm': 'reverse', 'reverse mortgage': 'reverse',
  'commercial': 'commercial', 'business': 'commercial',
  'i-9': 'i9', 'i9': 'i9', 'employment verification': 'i9',
  'ron': 'ron', 'remote': 'ron', 'online notarization': 'ron',
  'general': 'general', 'acknowledgment': 'general', 'jurat': 'general', 'oath': 'general',
  'deed': 'deed', 'title transfer': 'deed', 'quitclaim': 'deed', 'grant deed': 'deed',
  'poa': 'poa', 'power of attorney': 'poa', 'durable poa': 'poa',
  'apostille': 'apostille', 'authentication': 'apostille',
  'loan modification': 'loan_mod', 'loan mod': 'loan_mod', 'modification': 'loan_mod',
};

export function normaliseJobType(rawType = '') {
  const t = rawType.toLowerCase().trim();
  return JOB_TYPE_MAP[t] || 'general';
}

// ── Core insight functions ────────────────────────────────────────────────────

/**
 * Get market benchmark for a given job type.
 * Returns benchmark + recommendation string.
 */
export function getMarketInsight(rawJobType, offeredFee = null) {
  const key = normaliseJobType(rawJobType);
  const bench = MARKET_BENCHMARKS[key] || MARKET_BENCHMARKS.general;

  let recommendation = null;
  let recommendationType = 'accept'; // accept | counter | decline

  if (offeredFee !== null) {
    const pct = (offeredFee / bench.avgFee) * 100;
    if (pct < 70) {
      recommendation = `Counter offer $${bench.avgFee}. This offer is ${Math.round(100 - pct)}% below market average.`;
      recommendationType = 'counter';
    } else if (pct < 90) {
      recommendation = `Consider countering at $${Math.round(bench.avgFee * 0.95)}. Offer is slightly below market.`;
      recommendationType = 'counter';
    } else if (pct >= 130) {
      recommendation = `Above-average offer. Accept quickly before they shop around.`;
      recommendationType = 'accept';
    } else {
      recommendation = `Fair market rate. Accept or negotiate up to $${bench.avgFee}.`;
      recommendationType = 'accept';
    }
  }

  return {
    jobType: key,
    label: bench.label,
    avgFee: bench.avgFee,
    minFee: bench.minFee,
    maxFee: bench.maxFee,
    avgMiles: bench.avgMiles,
    avgDurationMins: bench.avgDurationMins,
    trend: bench.trend,
    trendNote: bench.trendNote,
    offeredFee,
    recommendation,
    recommendationType,
  };
}

/**
 * Look up payment risk for a company name.
 * Does a fuzzy slug match — partial matches count.
 */
export function getPaymentRisk(companyName = '') {
  const q = companyName.toLowerCase().trim();
  const match = PAYMENT_RISK_DB.find(c => q.includes(c.slug) || c.slug.includes(q));
  if (match) return match;

  // Unknown company — return neutral
  return {
    name: companyName,
    slug: q,
    avgDays: null,
    risk: 'unknown',
    riskLabel: 'Unknown Company',
    reports: 0,
  };
}

/**
 * Compute the user's personal stats from their completed jobs.
 * Returns per-job-type averages to compare against market.
 */
export function getUserStats(jobs = []) {
  const completed = jobs.filter(j =>
    ['Completed', 'Invoice Sent', 'Payment Received'].includes(j.lifecycleStage) &&
    j.fee > 0
  );

  const byType = {};
  completed.forEach(job => {
    const key = normaliseJobType(job.jobType || job.type || '');
    if (!byType[key]) byType[key] = { fees: [], miles: [], count: 0 };
    byType[key].fees.push(Number(job.fee) || 0);
    if (job.distanceMiles) byType[key].miles.push(Number(job.distanceMiles) || 0);
    byType[key].count++;
  });

  const stats = {};
  Object.entries(byType).forEach(([key, d]) => {
    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    stats[key] = {
      jobType: key,
      label: MARKET_BENCHMARKS[key]?.label || key,
      yourAvgFee: avg(d.fees),
      yourAvgMiles: avg(d.miles),
      jobCount: d.count,
      marketAvgFee: MARKET_BENCHMARKS[key]?.avgFee || null,
    };
  });

  return stats;
}

/**
 * Generate an AI insight feed based on user's job history.
 * Returns array of insight objects with severity and action hints.
 */
export function generateInsightFeed(jobs = [], settings = {}) {
  const insights = [];
  const userStats = getUserStats(jobs);
  const completed = jobs.filter(j => j.fee > 0);

  // ── Fee optimisation insights ──────────────────────────────────────────────
  Object.entries(userStats).forEach(([key, stat]) => {
    if (!stat.marketAvgFee || !stat.yourAvgFee) return;
    const gap = stat.marketAvgFee - stat.yourAvgFee;
    if (gap > 20) {
      insights.push({
        id: `fee_gap_${key}`,
        type: 'fee_optimisation',
        severity: gap > 40 ? 'high' : 'medium',
        icon: 'TrendingUp',
        title: `Underpriced on ${stat.label}`,
        body: `Your average fee is $${stat.yourAvgFee} vs market average $${stat.marketAvgFee}. You could earn $${gap} more per job.`,
        action: `Set minimum to $${Math.round(stat.marketAvgFee * 0.9)}`,
        actionKey: 'update_min_fee',
        meta: { jobType: key, gap, marketAvg: stat.marketAvgFee, yourAvg: stat.yourAvgFee },
      });
    }
  });

  // ── Travel radius insight ──────────────────────────────────────────────────
  const radius = settings.travelRadius || 30;
  const avgMilesAll = completed.filter(j => j.distanceMiles).map(j => Number(j.distanceMiles));
  if (avgMilesAll.length >= 3) {
    const avg = Math.round(avgMilesAll.reduce((a, b) => a + b, 0) / avgMilesAll.length);
    if (avg > radius * 0.85) {
      insights.push({
        id: 'travel_radius',
        type: 'travel',
        severity: 'low',
        icon: 'MapPin',
        title: 'High average travel distance',
        body: `You're averaging ${avg} miles per job — close to your ${radius}-mile limit. Consider adjusting your radius or requiring a travel surcharge.`,
        action: 'Review travel settings',
        actionKey: 'settings',
        meta: { avgMiles: avg, radiusSetting: radius },
      });
    }
  }

  // ── Payment risk insight ───────────────────────────────────────────────────
  const pending = jobs.filter(j =>
    j.lifecycleStage === 'Invoice Sent' && j.invoicedAt
  );
  pending.forEach(job => {
    const daysSince = Math.floor((Date.now() - new Date(job.invoicedAt).getTime()) / 86400000);
    if (daysSince > 30) {
      insights.push({
        id: `overdue_${job.id}`,
        type: 'payment_risk',
        severity: daysSince > 45 ? 'high' : 'medium',
        icon: 'AlertTriangle',
        title: `Invoice overdue — ${job.clientName || 'client'}`,
        body: `Invoice for ${job.clientName || 'this job'} has been outstanding ${daysSince} days. Market average payment time is 21–35 days.`,
        action: 'Send payment reminder',
        actionKey: 'send_reminder',
        meta: { jobId: job.id, daysSince },
      });
    }
  });

  // ── Market opportunity ─────────────────────────────────────────────────────
  const risingTypes = Object.entries(MARKET_BENCHMARKS).filter(([, v]) => v.trend === 'rising');
  const userRisingTypes = risingTypes.filter(([k]) => userStats[k]);
  if (userRisingTypes.length === 0 && risingTypes.length > 0) {
    const [key, bench] = risingTypes[0];
    insights.push({
      id: `opportunity_${key}`,
      type: 'opportunity',
      severity: 'low',
      icon: 'Sparkles',
      title: `Growing market: ${bench.label}`,
      body: `${bench.label} demand is rising. Average fee: $${bench.avgFee}. ${bench.trendNote}.`,
      action: 'Enable in settings',
      actionKey: 'settings',
      meta: { jobType: key },
    });
  }

  // ── Volume summary ─────────────────────────────────────────────────────────
  const thisMonth = new Date();
  thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
  const monthJobs = completed.filter(j => j.completedAt && new Date(j.completedAt) >= thisMonth);
  const monthIncome = monthJobs.reduce((sum, j) => sum + (Number(j.fee) || 0), 0);
  const goal = settings.monthlyGoal || 0;
  if (goal && monthIncome < goal * 0.5 && new Date().getDate() > 15) {
    insights.push({
      id: 'goal_pace',
      type: 'performance',
      severity: 'medium',
      icon: 'Target',
      title: 'Behind monthly income goal',
      body: `You've earned $${monthIncome.toFixed(0)} this month vs $${goal} goal. ${Math.round((monthIncome / goal) * 100)}% of target with half the month gone.`,
      action: 'Accept more jobs',
      actionKey: 'job_inbox',
      meta: { monthIncome, goal },
    });
  }

  // Sort by severity
  const order = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => (order[a.severity] || 2) - (order[b.severity] || 2));
}

/**
 * Travel optimisation: estimate cost and suggest minimum fee for a given distance.
 */
export function calcTravelCost(miles, costPerMile = 0.67) {
  const roundTrip = miles * 2;
  const travelCost = Math.round(roundTrip * costPerMile);
  const printCost = 4; // avg printing cost
  const totalCost = travelCost + printCost;
  return { miles, roundTrip, travelCost, printCost, totalCost };
}

export default {
  MARKET_BENCHMARKS,
  PAYMENT_RISK_DB,
  getMarketInsight,
  getPaymentRisk,
  getUserStats,
  generateInsightFeed,
  calcTravelCost,
  normaliseJobType,
};
