// ============================================================
// FIRE Engine — Real SIP, Compound Growth, Corpus Projection
// Step-up SIP, Inflation-adjusted retirement, SWR analysis
// ============================================================

/**
 * Future value of monthly SIP with annual step-up
 * FV = P * [((1+r)^n - 1) / r] * (1+r)  (for each year block then sum)
 */
export function sipFutureValue(monthlySIP, annualReturn, years, annualStepUp = 0) {
  const monthlyRate = annualReturn / 12;
  let totalCorpus = 0;
  let currentSIP = monthlySIP;

  for (let y = 0; y < years; y++) {
    // FV of 12 months of SIP at this year's amount
    const fv12 = currentSIP * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate) * (1 + monthlyRate);
    // Grow previous corpus by 1 year
    totalCorpus = totalCorpus * Math.pow(1 + monthlyRate, 12) + fv12;
    // Step up
    currentSIP = currentSIP * (1 + annualStepUp);
  }
  return Math.round(totalCorpus);
}

/**
 * Lumpsum compound growth
 */
export function lumpsumGrowth(principal, annualReturn, years) {
  return Math.round(principal * Math.pow(1 + annualReturn, years));
}

/**
 * Inflation-adjusted future monthly expense
 */
export function inflationAdjusted(currentMonthly, inflationRate, years) {
  return Math.round(currentMonthly * Math.pow(1 + inflationRate, years));
}

/**
 * Required corpus at retirement using Safe Withdrawal Rate
 * corpus = (annual_expense_at_retirement) / SWR
 */
export function requiredCorpus(monthlyExpenseAtRetirement, swr = 0.035) {
  return Math.round((monthlyExpenseAtRetirement * 12) / swr);
}

/**
 * Full FIRE Plan computation
 */
export function computeFirePlan({
  currentAge,
  retirementAge,
  monthlyIncome,
  monthlyExpenses,
  existingCorpus,
  emergencyFund = 0,
  lifeInsuranceCover = 0,
  grossSalary = 0,
  section80C = 0,
  expectedReturn = 0.12,      // 12% equity blended
  inflationRate = 0.06,
  sipStepUp = 0.10,            // 10% annual step-up
  swr = 0.035,
}) {
  const years = retirementAge - currentAge;
  if (years <= 0) return { error: 'Retirement age must be greater than current age' };

  const monthlySavings = monthlyIncome - monthlyExpenses;
  if (monthlySavings <= 0) return { error: 'Monthly expenses exceed income. Reduce expenses first.' };

  // Target corpus
  const futureMonthlyExpense = inflationAdjusted(monthlyExpenses, inflationRate, years);
  const targetCorpus = requiredCorpus(futureMonthlyExpense, swr);

  // Growth of existing corpus
  const existingGrowth = lumpsumGrowth(existingCorpus, expectedReturn, years);

  // Gap to fill via SIP
  const gap = Math.max(0, targetCorpus - existingGrowth);

  // Required monthly SIP (iterative solve — binary search for monthly SIP)
  let loSIP = 0, hiSIP = monthlyIncome, requiredSIP = 0;
  for (let i = 0; i < 50; i++) {
    const midSIP = (loSIP + hiSIP) / 2;
    const fv = sipFutureValue(midSIP, expectedReturn, years, sipStepUp);
    if (fv < gap) {
      loSIP = midSIP;
    } else {
      hiSIP = midSIP;
      requiredSIP = midSIP;
    }
  }
  requiredSIP = Math.round(requiredSIP);

  // Year-by-year trajectory
  const trajectory = [];
  let corpus = existingCorpus;
  let sip = requiredSIP;
  const monthlyRate = expectedReturn / 12;

  for (let y = 0; y <= years; y++) {
    const yearLabel = new Date().getFullYear() + y;
    const targetAtYear = requiredCorpus(inflationAdjusted(monthlyExpenses, inflationRate, y), swr);
    trajectory.push({
      year: yearLabel,
      corpus: Math.round(corpus / 100000),   // in lakhs
      goal: Math.round(targetAtYear * (y / Math.max(years, 1)) / 100000), // linear interpolation of goal
      age: currentAge + y,
    });
    if (y < years) {
      // Grow corpus
      const fv12 = sip * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate) * (1 + monthlyRate);
      corpus = corpus * Math.pow(1 + monthlyRate, 12) + fv12;
      sip = Math.round(sip * (1 + sipStepUp));
    }
  }

  // Asset allocation recommendation based on age
  const equityPercent = Math.max(30, Math.min(80, 100 - currentAge));
  const debtPercent = 100 - equityPercent;

  // Emergency fund target
  const emergencyFundTarget = monthlyExpenses * 6;

  // Month-by-month roadmap with goal buckets
  const months = years * 12;
  const monthlyRoadmap = [];
  const monthlyRet = Math.pow(1 + expectedReturn, 1 / 12) - 1;
  let corpusMonthly = existingCorpus;
  let sipMonthly = requiredSIP;
  let emergencyRemaining = Math.max(0, emergencyFundTarget - emergencyFund);
  let insuranceRemaining = Math.max(0, grossSalary * 15 - lifeInsuranceCover);
  let taxRemaining = Math.max(0, 150000 - section80C);

  const goalTotals = {
    emergency: 0,
    insurance: 0,
    taxSaving: 0,
    retirement: 0,
  };

  for (let m = 1; m <= months; m += 1) {
    if (m > 1 && (m - 1) % 12 === 0) sipMonthly = Math.round(sipMonthly * (1 + sipStepUp));

    const baseContribution = sipMonthly;
    let toEmergency = 0;
    let toInsurance = 0;
    let toTax = 0;

    if (emergencyRemaining > 0) {
      toEmergency = Math.min(emergencyRemaining, Math.round(baseContribution * 0.35));
      emergencyRemaining -= toEmergency;
    }
    if (insuranceRemaining > 0) {
      toInsurance = Math.min(insuranceRemaining, Math.round(baseContribution * 0.1));
      insuranceRemaining -= toInsurance;
    }
    if (taxRemaining > 0) {
      toTax = Math.min(taxRemaining, Math.round(baseContribution * 0.2));
      taxRemaining -= toTax;
    }

    const used = toEmergency + toInsurance + toTax;
    const toRetirement = Math.max(0, baseContribution - used);

    goalTotals.emergency += toEmergency;
    goalTotals.insurance += toInsurance;
    goalTotals.taxSaving += toTax;
    goalTotals.retirement += toRetirement;

    corpusMonthly = corpusMonthly * (1 + monthlyRet) + baseContribution;
    monthlyRoadmap.push({
      month: m,
      age: Number((currentAge + (m / 12)).toFixed(2)),
      sip: baseContribution,
      corpus: Math.round(corpusMonthly),
      goalSplit: {
        emergency: toEmergency,
        insurance: toInsurance,
        taxSaving: toTax,
        retirement: toRetirement,
      },
    });
  }

  return {
    currentAge,
    retirementAge,
    yearsToRetire: years,
    futureMonthlyExpense,
    targetCorpus,
    existingCorpusGrowth: existingGrowth,
    gap,
    requiredMonthlySIP: requiredSIP,
    sipStepUpPercent: sipStepUp * 100,
    trajectory,
    assetAllocation: {
      equity: equityPercent,
      debt: debtPercent,
      recommended: `${equityPercent}% Equity / ${debtPercent}% Debt`,
    },
    emergencyFund: {
      target: emergencyFundTarget,
      months: 6,
    },
    goalRoadmapSummary: goalTotals,
    monthlyRoadmap,
    projectedCorpusAtRetirement: Math.round(corpus),
    surplusOrDeficit: Math.round(corpus - targetCorpus),
    swr,
  };
}

/**
 * Validate inputs — used by UI and orchestrator guardrails
 */
export function validateFireInputs(p) {
  const errs = [];
  if (p.currentAge == null || p.retirementAge == null) errs.push('Age fields are required.');
  if (p.retirementAge <= p.currentAge) errs.push('Retirement age must be greater than current age.');
  if (p.monthlyIncome <= 0) errs.push('Monthly income must be positive.');
  if (p.monthlyExpenses < 0) errs.push('Monthly expenses cannot be negative.');
  if (p.monthlyExpenses >= p.monthlyIncome) errs.push('Expenses meet or exceed income — adjust to model savings.');
  if (p.expectedReturn < 0.04 || p.expectedReturn > 0.22) errs.push('Expected return should be between 4% and 22% for realistic planning.');
  if (p.inflationRate < 0.03 || p.inflationRate > 0.12) errs.push('Inflation assumption should stay between 3% and 12%.');
  if (p.existingCorpus < 0) errs.push('Existing corpus cannot be negative.');
  return errs;
}

/**
 * Minimum retirement age at which required SIP ≤ monthly surplus (binary search).
 * Returns null if infeasible in search range.
 */
export function findMinimumFeasibleRetirementAge(inputs) {
  const monthlySavings = inputs.monthlyIncome - inputs.monthlyExpenses;
  if (monthlySavings <= 0) return null;

  const hi = 80;
  let lo = inputs.currentAge + 1;
  if (lo > hi) return null;

  let best = null;
  let left = lo;
  let right = hi;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const r = computeFirePlan({ ...inputs, retirementAge: mid });
    if (r.error) {
      right = mid - 1;
      continue;
    }
    if (r.requiredMonthlySIP <= monthlySavings) {
      best = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  return best;
}
