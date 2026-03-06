/**
 * Finance Agent Service — v1
 * Tax calculations, mileage deduction, expense categorisation, and export engine.
 *
 * Designed for self-employed notaries filing Schedule C.
 * All tax figures are estimates — users should consult a CPA.
 */

// ── IRS rates ─────────────────────────────────────────────────────────────────
export const IRS_RATES = {
  2024: { mileage: 0.67, seTaxRate: 0.153, standardDeduction: 14600 },
  2025: { mileage: 0.70, seTaxRate: 0.153, standardDeduction: 15000 },
  2026: { mileage: 0.70, seTaxRate: 0.153, standardDeduction: 15350 }, // estimated
};

// ── Expense categories ────────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  { key: 'mileage',      label: 'Mileage',               icon: 'Car',           deductible: true,  schedule: 'Schedule C Line 9' },
  { key: 'printing',     label: 'Printing & Supplies',   icon: 'Printer',       deductible: true,  schedule: 'Schedule C Line 22' },
  { key: 'eo_insurance', label: 'E&O Insurance',         icon: 'Shield',        deductible: true,  schedule: 'Schedule C Line 15' },
  { key: 'education',    label: 'Education & Training',  icon: 'BookOpen',      deductible: true,  schedule: 'Schedule C Line 27' },
  { key: 'phone',        label: 'Phone (Business %)',    icon: 'Smartphone',    deductible: true,  schedule: 'Schedule C Line 25' },
  { key: 'home_office',  label: 'Home Office',           icon: 'Home',          deductible: true,  schedule: 'Schedule C Line 30' },
  { key: 'software',     label: 'Software & Tools',      icon: 'Laptop',        deductible: true,  schedule: 'Schedule C Line 27' },
  { key: 'marketing',    label: 'Marketing',             icon: 'Megaphone',     deductible: true,  schedule: 'Schedule C Line 8' },
  { key: 'notary_fees',  label: 'Notary Bond & Fees',    icon: 'BadgeCheck',    deductible: true,  schedule: 'Schedule C Line 27' },
  { key: 'meals',        label: 'Business Meals (50%)',  icon: 'UtensilsCrossed', deductible: true, schedule: 'Schedule C Line 24b' },
  { key: 'other',        label: 'Other Business Expense', icon: 'Receipt',      deductible: true,  schedule: 'Schedule C Line 27' },
  { key: 'personal',     label: 'Personal (Non-deductible)', icon: 'X',         deductible: false, schedule: null },
];

// ── Year-to-date income calculation ──────────────────────────────────────────
/**
 * Compute YTD income from completed jobs in a given year.
 * "Income" = jobs where lifecycleStage is Completed, Invoice Sent, or Payment Received.
 */
export function calcIncome(jobs = [], year = new Date().getFullYear()) {
  const yearStart = new Date(`${year}-01-01T00:00:00`);
  const yearEnd   = new Date(`${year}-12-31T23:59:59`);

  const eligible = jobs.filter(j => {
    const incomeStages = ['Completed', 'Invoice Sent', 'Payment Received'];
    if (!incomeStages.includes(j.lifecycleStage)) return false;
    const date = new Date(j.completedAt || j.date || j.createdAt || 0);
    return date >= yearStart && date <= yearEnd;
  });

  const total = eligible.reduce((sum, j) => sum + (Number(j.fee) || 0), 0);
  const byType = {};
  eligible.forEach(j => {
    const type = j.jobType || j.type || 'General';
    byType[type] = (byType[type] || 0) + (Number(j.fee) || 0);
  });

  // Monthly breakdown Jan–Dec
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const monthJobs = eligible.filter(j => {
      const d = new Date(j.completedAt || j.date || j.createdAt || 0);
      return d.getMonth() === i && d.getFullYear() === year;
    });
    return {
      month: i,
      label: new Date(year, i).toLocaleString('default', { month: 'short' }),
      income: monthJobs.reduce((s, j) => s + (Number(j.fee) || 0), 0),
      jobs: monthJobs.length,
    };
  });

  return { total, byType, monthly, jobCount: eligible.length };
}

// ── Mileage deduction calculation ────────────────────────────────────────────
/**
 * Compute IRS mileage deduction from mileageLogs in a given year.
 */
export function calcMileageDeduction(mileageLogs = [], year = new Date().getFullYear()) {
  const rates = IRS_RATES[year] || IRS_RATES[2026];
  const yearStart = new Date(`${year}-01-01T00:00:00`);
  const yearEnd   = new Date(`${year}-12-31T23:59:59`);

  const eligible = mileageLogs.filter(log => {
    const d = new Date(log.date || log.createdAt || 0);
    return d >= yearStart && d <= yearEnd && (log.miles || log.distance) > 0;
  });

  const totalMiles = eligible.reduce((sum, log) => {
    return sum + (Number(log.miles || log.distance) || 0);
  }, 0);

  const deduction = totalMiles * rates.mileage;

  return {
    totalMiles: Math.round(totalMiles * 10) / 10,
    ratePerMile: rates.mileage,
    deduction: Math.round(deduction * 100) / 100,
    logCount: eligible.length,
  };
}

// ── Expense totals ────────────────────────────────────────────────────────────
/**
 * Sum all deductible expenses in a given year.
 * Combines businessExpenses + jobExpenses (printing, platform fees, etc.)
 */
export function calcExpenses(businessExpenses = [], jobExpenses = [], year = new Date().getFullYear()) {
  const yearStart = new Date(`${year}-01-01T00:00:00`);
  const yearEnd   = new Date(`${year}-12-31T23:59:59`);

  const inYear = (items) => items.filter(e => {
    const d = new Date(e.date || e.createdAt || 0);
    return d >= yearStart && d <= yearEnd;
  });

  const bizExp = inYear(businessExpenses);
  const jobExp = inYear(jobExpenses);

  const total = [
    ...bizExp.filter(e => {
      const cat = EXPENSE_CATEGORIES.find(c => c.key === e.category);
      return cat?.deductible !== false;
    }),
    ...jobExp.filter(e => e.type !== 'personal'),
  ].reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const byCategory = {};
  [...bizExp, ...jobExp].forEach(e => {
    const cat = e.category || e.type || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + (Number(e.amount) || 0);
  });

  return { total: Math.round(total * 100) / 100, byCategory, count: bizExp.length + jobExp.length };
}

// ── Full tax summary ──────────────────────────────────────────────────────────
/**
 * Full Schedule C estimated summary.
 * Returns: gross income, deductions, net income, SE tax, estimated quarterly payment.
 */
export function calcTaxSummary(jobs, mileageLogs, businessExpenses, jobExpenses, settings, year) {
  const y = year || new Date().getFullYear();
  const rates = IRS_RATES[y] || IRS_RATES[2026];
  const taxRate = (settings?.taxRate || 25) / 100; // user-configured effective rate

  const income    = calcIncome(jobs, y);
  const mileage   = calcMileageDeduction(mileageLogs, y);
  const expenses  = calcExpenses(businessExpenses, jobExpenses, y);

  const grossIncome    = income.total;
  const totalDeductions = mileage.deduction + expenses.total;
  const netIncome       = Math.max(0, grossIncome - totalDeductions);
  const seTax           = Math.round(netIncome * rates.seTaxRate * 100) / 100;
  const seTaxDeduction  = Math.round(seTax * 0.5 * 100) / 100;
  const taxableIncome   = Math.max(0, netIncome - seTaxDeduction);
  const estimatedTax    = Math.round(taxableIncome * taxRate * 100) / 100;
  const totalTax        = Math.round((seTax + estimatedTax) * 100) / 100;
  const quarterlyPayment = Math.round(totalTax / 4 * 100) / 100;

  return {
    year: y,
    grossIncome,
    mileageDeduction: mileage.deduction,
    expenseDeduction: expenses.total,
    totalDeductions,
    netIncome,
    seTax,
    seTaxDeduction,
    taxableIncome,
    estimatedIncomeTax: estimatedTax,
    totalTax,
    quarterlyPayment,
    // Components
    income,
    mileage,
    expenses,
  };
}

// ── CSV Export ────────────────────────────────────────────────────────────────
/**
 * Generate a CSV string for income + expenses.
 * Downloadable as a file.
 */
export function exportCSV(jobs, businessExpenses, jobExpenses, mileageLogs, year) {
  const y = year || new Date().getFullYear();
  const summary = calcTaxSummary(jobs, mileageLogs, businessExpenses, jobExpenses, {}, y);
  const income = calcIncome(jobs, y);

  const rows = [];

  // Header
  rows.push(['NotaryOS Financial Export', `Year: ${y}`, '', '', '']);
  rows.push(['Generated:', new Date().toLocaleDateString(), '', '', '']);
  rows.push([]);

  // Income section
  rows.push(['INCOME', '', '', '', '']);
  rows.push(['Date', 'Client', 'Job Type', 'Description', 'Amount']);
  const yearStart = new Date(`${y}-01-01T00:00:00`);
  const yearEnd   = new Date(`${y}-12-31T23:59:59`);
  const incomeJobs = jobs.filter(j => {
    const incomeStages = ['Completed', 'Invoice Sent', 'Payment Received'];
    if (!incomeStages.includes(j.lifecycleStage)) return false;
    const date = new Date(j.completedAt || j.date || j.createdAt || 0);
    return date >= yearStart && date <= yearEnd;
  });
  incomeJobs.forEach(j => {
    rows.push([
      new Date(j.completedAt || j.date || j.createdAt || 0).toLocaleDateString(),
      j.clientName || '',
      j.jobType || j.type || 'General',
      j.description || '',
      (Number(j.fee) || 0).toFixed(2),
    ]);
  });
  rows.push(['', '', '', 'TOTAL INCOME', income.total.toFixed(2)]);
  rows.push([]);

  // Mileage
  rows.push(['MILEAGE DEDUCTION', '', '', '', '']);
  rows.push(['Total Miles', summary.mileage.totalMiles, '', 'Rate', summary.mileage.ratePerMile]);
  rows.push(['', '', '', 'MILEAGE DEDUCTION', summary.mileageDeduction.toFixed(2)]);
  rows.push([]);

  // Expenses
  rows.push(['EXPENSES', '', '', '', '']);
  rows.push(['Date', 'Category', 'Description', 'Vendor', 'Amount']);
  businessExpenses.forEach(e => {
    const d = new Date(e.date || e.createdAt || 0);
    if (d >= yearStart && d <= yearEnd) {
      rows.push([
        d.toLocaleDateString(),
        e.category || 'Other',
        e.description || '',
        e.vendor || '',
        (Number(e.amount) || 0).toFixed(2),
      ]);
    }
  });
  rows.push(['', '', '', 'TOTAL EXPENSES', summary.expenseDeduction.toFixed(2)]);
  rows.push([]);

  // Summary
  rows.push(['TAX SUMMARY', '', '', '', '']);
  rows.push(['Gross Income', '', '', '', summary.grossIncome.toFixed(2)]);
  rows.push(['Total Deductions', '', '', '', `-${summary.totalDeductions.toFixed(2)}`]);
  rows.push(['Net Income', '', '', '', summary.netIncome.toFixed(2)]);
  rows.push(['Self-Employment Tax (est.)', '', '', '', summary.seTax.toFixed(2)]);
  rows.push(['Estimated Income Tax (est.)', '', '', '', summary.estimatedIncomeTax.toFixed(2)]);
  rows.push(['TOTAL ESTIMATED TAX', '', '', '', summary.totalTax.toFixed(2)]);
  rows.push(['Quarterly Payment (est.)', '', '', '', summary.quarterlyPayment.toFixed(2)]);

  // Convert to CSV string
  return rows.map(row =>
    row.map(cell => {
      const s = String(cell ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    }).join(',')
  ).join('\n');
}

/**
 * Trigger a browser CSV file download.
 */
export function downloadCSV(csvString, year) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notaryos_financial_${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a CPA-ready text report.
 */
export function generateCPAReport(jobs, businessExpenses, jobExpenses, mileageLogs, settings, year) {
  const y = year || new Date().getFullYear();
  const summary = calcTaxSummary(jobs, mileageLogs, businessExpenses, jobExpenses, settings, y);
  const { income, mileage, expenses } = summary;

  const fmt = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const name = settings?.name || settings?.businessName || 'Notary Professional';

  return `
================================================================================
  NOTARYOS — FINANCIAL SUMMARY REPORT FOR CPA
  Prepared for: ${name}
  Tax Year: ${y}
  Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
================================================================================

SECTION 1 — BUSINESS INCOME (Schedule C)
─────────────────────────────────────────
  Total Jobs Completed:     ${income.jobCount}
  Gross Business Income:    ${fmt(summary.grossIncome)}

  By Job Type:
${Object.entries(income.byType).map(([type, amt]) =>
  `    ${type.padEnd(30)} ${fmt(amt)}`
).join('\n')}

SECTION 2 — MILEAGE DEDUCTION (Schedule C, Line 9)
─────────────────────────────────────────────────────
  Total Business Miles:     ${mileage.totalMiles} miles
  IRS Rate (${y}):          ${fmt(mileage.ratePerMile)}/mile
  Mileage Deduction:        ${fmt(summary.mileageDeduction)}

SECTION 3 — BUSINESS EXPENSES (Schedule C)
───────────────────────────────────────────
  Total Deductible Expenses: ${fmt(summary.expenseDeduction)}

  By Category:
${Object.entries(expenses.byCategory).map(([cat, amt]) => {
  const info = EXPENSE_CATEGORIES.find(c => c.key === cat);
  return `    ${(info?.label || cat).padEnd(30)} ${fmt(amt)}${info?.schedule ? ` (${info.schedule})` : ''}`;
}).join('\n') || '    No expenses recorded'}

SECTION 4 — NET INCOME & TAX ESTIMATES
────────────────────────────────────────
  Gross Income:                ${fmt(summary.grossIncome)}
  Less: Mileage Deduction:    (${fmt(summary.mileageDeduction)})
  Less: Business Expenses:    (${fmt(summary.expenseDeduction)})
  ─────────────────────────────────────
  Net Profit:                  ${fmt(summary.netIncome)}

  Self-Employment Tax (15.3%): ${fmt(summary.seTax)}
  SE Tax Deduction (50%):     (${fmt(summary.seTaxDeduction)})
  Taxable Income:              ${fmt(summary.taxableIncome)}

  Estimated Income Tax:        ${fmt(summary.estimatedIncomeTax)}
  Estimated Total Tax:         ${fmt(summary.totalTax)}
  Estimated Quarterly Payment: ${fmt(summary.quarterlyPayment)}

DISCLAIMER
──────────
  These figures are estimates generated by NotaryOS for planning purposes only.
  They do not constitute tax advice. Please consult a licensed CPA or tax
  professional before filing. Actual tax liability may differ.

================================================================================
`.trim();
}

/**
 * Download the CPA report as a .txt file.
 */
export function downloadCPAReport(report, year) {
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notaryos_cpa_report_${year}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default {
  IRS_RATES,
  EXPENSE_CATEGORIES,
  calcIncome,
  calcMileageDeduction,
  calcExpenses,
  calcTaxSummary,
  exportCSV,
  downloadCSV,
  generateCPAReport,
  downloadCPAReport,
};
