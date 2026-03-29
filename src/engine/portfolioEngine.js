// ============================================================
// Portfolio X-Ray Engine — XIRR, Overlap, Rebalancing
// ============================================================

import { CATEGORY_BENCHMARK_RETURNS } from '../data/fundCatalog.js';

/**
 * XIRR calculation using Newton-Raphson method
 * cashflows: array of { amount, date } where investments are negative, current value is positive
 */
export function calculateXIRR(cashflows, guess = 0.1) {
  if (!cashflows || cashflows.length < 2) return null;

  const hasInflow = cashflows.some((cf) => Number(cf.amount) > 0);
  const hasOutflow = cashflows.some((cf) => Number(cf.amount) < 0);
  if (!hasInflow || !hasOutflow) return null;

  const validDates = cashflows
    .map((cf) => cf.date)
    .filter((d) => d instanceof Date && !Number.isNaN(d.getTime()));
  if (validDates.length !== cashflows.length) return null;

  const minTs = Math.min(...validDates.map((d) => d.getTime()));
  const maxTs = Math.max(...validDates.map((d) => d.getTime()));
  const spanDays = (maxTs - minTs) / (1000 * 60 * 60 * 24);
  if (spanDays < 30) return null;

  const daysBetween = (d1, d2) => (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
  const d0 = cashflows[0].date;

  function f(rate) {
    return cashflows.reduce((sum, cf) => {
      const days = daysBetween(d0, cf.date);
      return sum + cf.amount / Math.pow(1 + rate, days / 365);
    }, 0);
  }

  function df(rate) {
    return cashflows.reduce((sum, cf) => {
      const days = daysBetween(d0, cf.date);
      return sum + (-days / 365) * cf.amount / Math.pow(1 + rate, (days / 365) + 1);
    }, 0);
  }

  let rate = guess;
  for (let i = 0; i < 100; i++) {
    const fVal = f(rate);
    const dfVal = df(rate);
    if (Math.abs(dfVal) < 1e-10) break;
    const newRate = rate - fVal / dfVal;
    if (!Number.isFinite(newRate) || newRate <= -0.999 || newRate > 10) return null;
    if (Math.abs(newRate - rate) < 1e-7) {
      const pct = Math.round(newRate * 10000) / 100;
      return Number.isFinite(pct) && Math.abs(pct) <= 1000 ? pct : null;
    }
    rate = newRate;
  }
  const pct = Math.round(rate * 10000) / 100;
  return Number.isFinite(pct) && Math.abs(pct) <= 1000 ? pct : null;
}

/**
 * Portfolio analysis from holdings
 */
export function analyzePortfolio(holdings) {
  // holdings: [{ name, category, value, investedValue, startDate, topHoldings: [string] }]
  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  const totalInvested = holdings.reduce((s, h) => s + h.investedValue, 0);
  const absoluteReturn = totalValue - totalInvested;
  const absoluteReturnPct = totalInvested > 0 ? ((absoluteReturn / totalInvested) * 100).toFixed(1) : 0;

  // Category allocation
  const categoryMap = {};
  holdings.forEach(h => {
    if (!categoryMap[h.category]) categoryMap[h.category] = 0;
    categoryMap[h.category] += h.value;
  });
  const allocation = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value: Math.round(value),
    percent: ((value / totalValue) * 100).toFixed(1),
  }));

  // Overlap analysis — find common top holdings across funds
  const holdingCount = {};
  holdings.forEach(h => {
    (h.topHoldings || []).forEach(stock => {
      if (!holdingCount[stock]) holdingCount[stock] = { stock, funds: [] };
      holdingCount[stock].funds.push(h.name);
    });
  });
  const overlaps = Object.values(holdingCount)
    .filter(o => o.funds.length > 1)
    .sort((a, b) => b.funds.length - a.funds.length)
    .slice(0, 10);

  const overlapScore = overlaps.length > 5 ? 'High' : overlaps.length > 2 ? 'Medium' : 'Low';

  // Expense ratio analysis (simplified)
  const avgExpenseRatio = holdings.reduce((s, h) => s + (h.expenseRatio || 1.5), 0) / holdings.length;
  const expenseDrag = Math.round(totalValue * avgExpenseRatio / 100);

  // Rebalancing suggestions
  const suggestions = [];
  const largeCap = categoryMap['Large Cap'] || 0;
  const midCap = categoryMap['Mid Cap'] || 0;
  const smallCap = categoryMap['Small Cap'] || 0;
  const debtFunds = categoryMap['Debt'] || 0;

  const equityTotal = largeCap + midCap + smallCap;
  if (equityTotal > 0) {
    if (midCap / equityTotal > 0.4) suggestions.push('Mid-cap exposure is >40% of equity. Consider shifting some to large-cap for stability.');
    if (smallCap / equityTotal > 0.3) suggestions.push('Small-cap heavy portfolio. High risk. Add large-cap index fund for balance.');
  }
  if (debtFunds / totalValue < 0.15 && totalValue > 500000) {
    suggestions.push('Debt allocation under 15%. Add short-duration debt fund for portfolio stability.');
  }
  if (overlaps.length > 5) {
    suggestions.push(`${overlaps.length} overlapping stocks detected. Consolidate overlapping funds to reduce redundancy.`);
  }
  if (avgExpenseRatio > 1.5) {
    suggestions.push(`Average expense ratio ${avgExpenseRatio.toFixed(2)}% is high. Switch to direct plans or index funds to save ₹${expenseDrag.toLocaleString('en-IN')}/yr.`);
  }

  // Actionable rebalancing steps (ordered)
  const rebalancingSteps = [];
  const riskWarnings = [];

  if (midCap / Math.max(equityTotal, 1) > 0.4 && equityTotal > 0) {
    rebalancingSteps.push({
      priority: 1,
      action: `Trim Mid-cap by ~${Math.min(15, Math.round((midCap / equityTotal) * 100 - 30))}% of equity → add to Large-cap index.`,
      from: 'Mid Cap',
      to: 'Large Cap Index',
    });
  }
  if (smallCap / Math.max(equityTotal, 1) > 0.28 && equityTotal > 0) {
    rebalancingSteps.push({
      priority: 2,
      action: 'Cap small-cap at ~25% of equity; rotate into flexi/large-cap for core.',
      from: 'Small Cap',
      to: 'Flexi / Large Cap',
    });
  }
  if (debtFunds / totalValue < 0.12 && totalValue > 400000) {
    rebalancingSteps.push({
      priority: 3,
      action: 'Add 8–12% short-duration debt for drawdown buffer.',
      from: 'Cash / new SIP',
      to: 'Short Duration / Money Market',
    });
  }
  if (overlaps.length > 4) {
    rebalancingSteps.push({
      priority: 4,
      action: `Consolidate ${overlaps.length} overlapping active funds into 1–2 diversified funds.`,
      from: 'Overlapping actives',
      to: 'Core index + one satellite',
    });
  }
  if (rebalancingSteps.length === 0) {
    rebalancingSteps.push({
      priority: 0,
      action: 'Maintain current glide path; review annually or if any fund drifts >5% from target.',
      from: '—',
      to: '—',
    });
  }

  if (equityTotal / totalValue > 0.92 && totalValue > 300000) {
    riskWarnings.push('Equity >92% of portfolio — sequence-of-returns risk if goals are <7 years away.');
  }
  if (overlapScore === 'High') {
    riskWarnings.push('High stock overlap — concentration risk if the same names correct together.');
  }
  if (avgExpenseRatio > 1.6) {
    riskWarnings.push('High TER erodes compounding — prioritize direct plans / index funds.');
  }

  // XIRR from holdings (simplified: use invested date → today for each)
  const today = new Date();
  const cashflowsAll = [];
  holdings.forEach(h => {
    cashflowsAll.push({ amount: -h.investedValue, date: new Date(h.startDate) });
  });
  cashflowsAll.push({ amount: totalValue, date: today });
  const xirr = calculateXIRR(cashflowsAll);

  // Category-weighted benchmark simulation
  const benchmarkCashflows = [];
  let benchmarkValue = 0;
  holdings.forEach((h) => {
    const r = CATEGORY_BENCHMARK_RETURNS[h.category] ?? 0.11;
    const start = new Date(h.startDate);
    const years = Math.max(0.01, (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const fv = (h.investedValue || 0) * Math.pow(1 + r, years);
    benchmarkValue += fv;
    benchmarkCashflows.push({ amount: -(h.investedValue || 0), date: start });
  });
  benchmarkCashflows.push({ amount: benchmarkValue, date: today });
  const benchmarkXirr = calculateXIRR(benchmarkCashflows);
  const benchmarkReturnPct = totalInvested > 0 ? ((benchmarkValue - totalInvested) / totalInvested) * 100 : 0;
  const excessReturnPct = Number(absoluteReturnPct) - benchmarkReturnPct;

  return {
    totalValue,
    totalInvested,
    absoluteReturn,
    absoluteReturnPct,
    xirr,
    allocation,
    overlaps,
    overlapScore,
    avgExpenseRatio: avgExpenseRatio.toFixed(2),
    expenseDrag,
    suggestions,
    rebalancingSteps,
    riskWarnings,
    benchmarkComparison: {
      benchmarkName: 'Category-Weighted Blended Index',
      benchmarkValue: Math.round(benchmarkValue),
      benchmarkReturnPct,
      excessReturnPct,
      benchmarkXirr,
      alphaXirr: xirr != null && benchmarkXirr != null ? xirr - benchmarkXirr : null,
    },
  };
}
