// ============================================================
// AI Reasoning Layer — Structured explanations on top of engines
// Separates: calculations vs. narrative + confidence + guardrails
// ============================================================

import { findMinimumFeasibleRetirementAge } from './fireEngine.js';

/**
 * @typedef {Object} StructuredInsight
 * @property {string} summary
 * @property {string[]} detailedBreakdown
 * @property {string[]} reasoning — why the AI recommends this
 * @property {string[]} assumptions
 * @property {string[]} sensitivity — what changes if inputs change
 * @property {string[]} actionPlan
 * @property {number} confidence — 0–100
 * @property {string[]} followUpQuestions
 * @property {string[]} warnings
 */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/**
 * Enrich FIRE plan with advisor-style narrative and guardrails
 */
export function enrichFirePlan(raw, inputs) {
  if (raw?.error) {
    return {
      ...raw,
      structured: null,
      explanationLog: [`Validation failed: ${raw.error}`],
    };
  }

  const {
    currentAge,
    retirementAge,
    monthlyIncome,
    monthlyExpenses,
    expectedReturn = 0.12,
    inflationRate = 0.06,
    sipStepUp = 0.1,
  } = inputs;

  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0;
  const years = retirementAge - currentAge;
  const targetCr = raw.targetCorpus / 10000000;
  const sipNeeded = raw.requiredMonthlySIP;
  const sipPctOfIncome = monthlyIncome > 0 ? (sipNeeded / monthlyIncome) * 100 : 0;
  const currentSipGap = sipNeeded - Math.min(monthlySavings, sipNeeded);

  const minFeasibleAge = findMinimumFeasibleRetirementAge(inputs);
  const aggressive = retirementAge < currentAge + 12 || sipPctOfIncome > 55;

  const reasoning = [
    `Your FIRE number is driven by expenses at age ${retirementAge}: we inflated ₹${monthlyExpenses.toLocaleString('en-IN')}/mo at ${(inflationRate * 100).toFixed(1)}% for ${years} years, then applied a ${(raw.swr * 100).toFixed(1)}% safe withdrawal rate (≈${targetCr.toFixed(2)} Cr corpus).`,
    `Required SIP of ₹${sipNeeded.toLocaleString('en-IN')}/mo assumes ${(expectedReturn * 100).toFixed(1)}% portfolio return and ${(sipStepUp * 100).toFixed(0)}% annual step-up on SIP — typical for a disciplined equity-heavy plan.`,
    savingsRate >= sipPctOfIncome / 100
      ? `Your current savings rate (${(savingsRate * 100).toFixed(1)}% of income) can fund the required SIP after reallocating existing flows.`
      : `Gap: you need ₹${Math.round(currentSipGap).toLocaleString('en-IN')}/mo more investable surplus (or lower expenses) versus today’s ₹${Math.round(monthlySavings).toLocaleString('en-IN')}/mo savings.`,
  ];

  const assumptions = [
    `Inflation ${(inflationRate * 100).toFixed(1)}% and investment return ${(expectedReturn * 100).toFixed(1)}% stay stable; real returns ≈${((expectedReturn - inflationRate) * 100).toFixed(1)}%.`,
    `Withdrawal rule: ${(raw.swr * 100).toFixed(1)}% of corpus annually (capital preservation heuristic).`,
    `Existing corpus ₹${(inputs.existingCorpus || 0).toLocaleString('en-IN')} compounds until retirement at the same blended return.`,
  ];

  const sensitivity = [
    `If expected return drops 1% point, required SIP typically rises materially — stress-test in What-If.`,
    `If you retire 3 years later, required SIP usually falls (more time + less inflation-adjusted expense window).`,
    `If monthly expenses rise ₹5,000 today, FIRE corpus target scales with inflated lifestyle over ${years} years.`,
  ];

  const warnings = [];
  if (aggressive) {
    warnings.push(`Retiring at ${retirementAge} in ${years} years is aggressive: required SIP is ${sipPctOfIncome.toFixed(0)}% of gross income. Consider target age ${minFeasibleAge != null ? minFeasibleAge : retirementAge + 3} for a safer margin.`);
  }
  if (sipPctOfIncome > 100) {
    warnings.push('Required SIP exceeds income — plan is mathematically infeasible without higher income, lower expenses, or later retirement.');
  }
  if (expectedReturn > 0.15) {
    warnings.push('Return assumption above 15% is optimistic for long horizons; model may understate required savings.');
  }

  const followUpQuestions = [];
  if (monthlyExpenses / monthlyIncome > 0.85) {
    followUpQuestions.push('Are large EMIs or rent locked in for 5+ years? (Affects how much you can redirect to SIP.)');
  }
  if (aggressive) {
    followUpQuestions.push(`Would you consider a more conservative plan with retirement at ${retirementAge + 5}?`);
  }

  const confidence = clamp(
    72
      - (aggressive ? 12 : 0)
      - (expectedReturn > 0.14 ? 8 : 0)
      + (years >= 15 ? 5 : 0)
      + (savingsRate > 0.25 ? 6 : 0),
    38,
    92,
  );

  const summary = `Based on your ₹${targetCr.toFixed(2)} Cr inflation-adjusted goal, ${(inflationRate * 100).toFixed(0)}% inflation, and ${(expectedReturn * 100).toFixed(0)}% return assumption, you need ₹${sipNeeded.toLocaleString('en-IN')}/mo SIP${sipPctOfIncome > 0 ? ` (${sipPctOfIncome.toFixed(0)}% of income)` : ''}.`;

  const detailedBreakdown = [
    `Future monthly expense at retirement: ₹${raw.futureMonthlyExpense.toLocaleString('en-IN')} (nominal).`,
    `Target corpus @ ${(raw.swr * 100).toFixed(1)}% SWR: ₹${raw.targetCorpus.toLocaleString('en-IN')}.`,
    `Existing corpus projected to: ₹${raw.existingCorpusGrowth.toLocaleString('en-IN')}; gap filled by SIP trajectory: ₹${Math.max(0, raw.gap).toLocaleString('en-IN')}.`,
    `Projected corpus at retirement: ₹${raw.projectedCorpusAtRetirement.toLocaleString('en-IN')} (${raw.surplusOrDeficit >= 0 ? 'surplus' : 'shortfall'} vs target).`,
  ];

  const actionPlan = [
    `Set SIP to ₹${sipNeeded.toLocaleString('en-IN')}/mo with ${(sipStepUp * 100).toFixed(0)}% annual step-up.`,
    `Maintain emergency fund of ₹${raw.emergencyFund.target.toLocaleString('en-IN')} before increasing market exposure.`,
    `Rebalance toward ${raw.assetAllocation.recommended} as you age; reduce equity within 5 years of retirement.`,
  ];

  const explanationLog = [
    'FIRE_Agent: solved required SIP via binary search on future value of stepped SIP.',
    `Orchestrator: routed to Gemini-1.5-Pro tier for multi-year deterministic projection (cost simulation).`,
  ];

  return {
    ...raw,
    structured: {
      summary,
      detailedBreakdown,
      reasoning,
      assumptions,
      sensitivity,
      actionPlan,
      confidence,
      followUpQuestions,
      warnings,
    },
    explanationLog,
    minFeasibleRetirementAge: minFeasibleAge,
  };
}

/**
 * Portfolio X-Ray narrative
 */
export function enrichPortfolioXRay(raw) {
  if (!raw || raw.totalValue === undefined) return raw;

  const reasoning = [
    `XIRR blends each fund’s invested amount and timeline; overlap flags when the same stocks appear in multiple active funds (diworsification risk).`,
    `Expense drag ₹${(raw.expenseDrag || 0).toLocaleString('en-IN')}/yr is the cost of average TER — direct/index funds usually reduce this.`,
  ];

  const confidence = clamp(65 + (raw.overlaps?.length < 4 ? 10 : -8) + (Number(raw.avgExpenseRatio) < 1.2 ? 8 : -5), 40, 90);

  return {
    ...raw,
    structured: {
      summary: `Portfolio ₹${raw.totalValue.toLocaleString('en-IN')} across ${raw.allocation?.length || 0} categories; overlap ${raw.overlapScore?.toLowerCase() || 'unknown'}.`,
      detailedBreakdown: [
        `Absolute return ${raw.absoluteReturnPct}% on invested ₹${raw.totalInvested.toLocaleString('en-IN')}.`,
        raw.xirr != null ? `XIRR ≈ ${raw.xirr}% (annualized money-weighted return).` : 'XIRR unavailable — need more cashflow points.',
      ],
      reasoning,
      assumptions: ['Holdings and dates are as entered; benchmark is a category-weighted blended proxy, not exact index tracking.'],
      sensitivity: ['If equity allocation rises, expect higher volatility and tracking error vs. Nifty 50.'],
      actionPlan: (raw.rebalancingSteps || []).map((s) => s.action),
      confidence,
      followUpQuestions: raw.riskWarnings?.length ? ['Do you need liquidity within 24 months?'] : [],
      warnings: raw.riskWarnings || [],
    },
    explanationLog: ['Portfolio_Agent: Newton-Raphson XIRR + category weights + overlap graph.'],
  };
}

/**
 * Life event — merge engine output with narrative
 */
export function enrichLifeEvent(raw) {
  if (!raw || raw.error) return raw;

  const confidence = clamp(58 + (raw.impact?.retirementAgeDeltaYears != null ? 12 : 0), 42, 88);

  return {
    ...raw,
    structured: {
      summary: raw.summary || 'Life event strategy generated from your profile and tax heuristics.',
      detailedBreakdown: raw.detailedBreakdown || [],
      reasoning: raw.reasoning || [],
      assumptions: raw.assumptions || [],
      sensitivity: raw.sensitivity || [],
      actionPlan: raw.actionPlan || [],
      confidence,
      followUpQuestions: raw.followUpQuestions || [],
      warnings: raw.warnings || [],
    },
    explanationLog: raw.explanationLog || ['LifeEvent_Agent: rule-based allocation + FIRE delta vs baseline.'],
  };
}

/**
 * Tax Wizard — regime comparison narrative
 */
export function enrichTax(raw) {
  if (!raw || raw.oldRegime === undefined) return raw;

  const oldT = raw.oldRegime.totalTax;
  const newT = raw.newRegime.totalTax;
  const rec = raw.recommended;
  const confidence = clamp(68 - (raw.missingDeductions?.length > 4 ? 8 : 0) + (oldT !== newT ? 6 : 0), 45, 90);

  const summary =
    rec === 'New Regime'
      ? `With your numbers, the new regime likely keeps more in your pocket — about ${fmtINR(raw.savings)} less tax than the old path for this illustration.`
      : `The old regime’s deductions (HRA, 80C, 80D, etc.) tilt in your favour — roughly ${fmtINR(raw.savings)} vs switching to new, before behaviour changes.`;

  const reasoning = [
    'We slab both taxable incomes independently, add 4% cess, and compare totals — same as payroll logic at a high level.',
    raw.missingDeductions?.length
      ? `There’s still headroom in ${raw.missingDeductions.length} deduction bucket(s) — closing them is usually the highest “return” per rupee.`
      : 'Deductions look well used; next wins come from income timing and investment discipline, not form-filling.',
  ];

  const assumptions = [
    'FY 2025–26 slab structure; rebate 87A applied where taxable income falls in zero-tax bands.',
    'HRA exemption = min(HRA received, metro 50% / non-metro 40% of basic, rent − 10% of basic).',
  ];

  const sensitivity = [
    'If gross salary jumps a bracket, marginal rates change — re-run before March investments.',
    'New regime: fewer levers; old regime: rewards documentation (rent receipts, ELSS, etc.).',
  ];

  const actionPlan = [
    `File and invest aligned with ${rec} for the current year (verify with your CA if borderline).`,
    ...((raw.missingDeductions || []).slice(0, 3).map((d) => d.tip)),
  ];

  const warnings = [
    'Figures are illustrative; actual TDS, perquisites, and exemptions differ by employer.',
  ];

  return {
    ...raw,
    structured: {
      summary,
      detailedBreakdown: [
        `Old regime total (incl. cess): ${fmtINR(oldT)} · Taxable: ${fmtINR(raw.oldRegime.taxableIncome)}`,
        `New regime total (incl. cess): ${fmtINR(newT)} · Taxable: ${fmtINR(raw.newRegime.taxableIncome)}`,
      ],
      reasoning,
      assumptions,
      sensitivity,
      actionPlan,
      confidence,
      followUpQuestions: ['Do you have variable pay or RSUs not reflected here?'],
      warnings,
      explainability: {
        formula: 'Tax = Σ slab(rate × slice) + 4% cess; compare Old (deductions + HRA) vs New (₹75k std deduction only).',
        tradeoffs: 'Old: more paperwork, higher savings if deductions are real. New: simpler, better for fewer deductions.',
      },
    },
    explanationLog: ['Tax_Agent: dual-regime slab engine + gap finder on 80C/80D/NPS/HRA.'],
  };
}

function fmtINR(n) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/**
 * Couples planner — joint narrative
 */
export function enrichCouples(raw) {
  if (!raw || !raw.netWorth) return raw;

  const confidence = clamp(62 + (raw.hra?.maxSaving > 0 ? 10 : 0) + (raw.potentialTaxSaved > 20000 ? 8 : 0), 48, 88);

  const summary = `Together you’re optimising across two tax profiles: HRA is best claimed by ${raw.hra.optimalClaimant.toLowerCase()}, and we estimate ~${fmtINR(raw.potentialTaxSaved)} in annual headroom when you close NPS/80C gaps — before lifestyle trade-offs.`;

  const reasoning = [
    'We compare each partner’s old-regime tax with and without HRA to see who gains more from claiming rent.',
    'SIP split follows income share so risk aligns with earning power — not a rule, a sensible default.',
  ];

  const assumptions = [
    'Both incomes are salary-like; business income and capital gains are out of scope here.',
    '15× income is a heuristic for life cover — adjust for loans and dependents.',
  ];

  const sensitivity = [
    'If one partner switches jobs mid-year, withholdings change — revisit in Q4.',
    'Joint goals may need one emergency fund, not two full buffers — discuss openly.',
  ];

  const actionPlan = [
    `Route rent proof through ${raw.hra.optimalClaimant} if still on the old regime.`,
    ...(raw.section80C?.tips || []),
    `Consider NPS: P1 gap ${fmtINR(raw.nps.p1gap)}, P2 gap ${fmtINR(raw.nps.p2gap)}.`,
  ];

  return {
    ...raw,
    structured: {
      summary,
      detailedBreakdown: [
        `Combined net worth: ${fmtINR(raw.netWorth.combined)} (liquid + invested proxies).`,
        `HRA max delta vs alternate claimant: ${fmtINR(raw.hra.maxSaving)} (illustrative).`,
      ],
      reasoning,
      assumptions,
      sensitivity,
      actionPlan,
      confidence,
      followUpQuestions: ['Will you file jointly for house purchase or keep separate goal accounts?'],
      warnings: ['Potential tax saved uses a simple 30% marginal proxy on gaps — use as a signpost, not exact tax.'],
      explainability: {
        formula: 'HRA savings = tax(old, no rent) − tax(old, with rent); 80C/NPS gaps × marginal rate for “potential saved”.',
        tradeoffs: 'Concentrating SIP in higher earner increases equity risk for that household — balance with goals.',
      },
    },
    explanationLog: ['Couples_Agent: HRA argmax + 80C gaps + income-weighted SIP.'],
  };
}

/**
 * Money health — wrap raw score with advisor tone + structure
 */
export function enrichHealthScore(raw) {
  if (!raw || raw.dimensions === undefined) return raw;

  const worst = raw.dimensions.reduce((a, b) => (a.score <= b.score ? a : b));
  const best = raw.dimensions.reduce((a, b) => (a.score >= b.score ? a : b));
  const confidence = clamp(55 + Math.round(raw.totalScore / 4), 48, 92);

  const summary = `Overall you’re at ${raw.totalScore}/100 — ${best.name} is a strength; ${worst.name} is where small fixes will feel most meaningful.`;

  const reasoning = [
    'Scores blend weighted dimensions (emergency, insurance, investments, debt, tax, retirement) — not a single KPI.',
    `The lowest pillar (${worst.name}) often drags peace of mind more than the average suggests — we prioritise it in your next steps.`,
  ];

  const assumptions = [
    'Targets assume 6-month emergency buffer, 15× income life cover, ~20% invest rate, and 3.5% withdrawal at retirement.',
  ];

  const sensitivity = [
    'One large EMI or a new dependent can move two dimensions at once — update when life changes.',
  ];

  const actionPlan = [
    `This month: one concrete step on ${worst.name} — keep it small enough to finish.`,
    `Keep ${best.name} steady — don’t dismantle what’s working while you fix gaps.`,
  ];

  return {
    ...raw,
    structured: {
      summary,
      detailedBreakdown: raw.dimensions.map((d) => `${d.name}: ${d.score}/100 — ${d.status}`),
      reasoning,
      assumptions,
      sensitivity,
      actionPlan,
      confidence,
      followUpQuestions: ['Any major expense in the next 12 months we should model?'],
      warnings: ['Scores are educational — not credit, insurance, or investment advice.'],
      explainability: {
        formula: 'Total = Σ (dimension score × weight) / 100; each dimension uses ratio rules (e.g. EF / 6-month expenses).',
        tradeoffs: 'Chasing a perfect 100 can mean over-insurance or idle cash — balance with goals.',
      },
    },
    explanationLog: ['Health_Agent: weighted 6-dimension model with worst-dimension prioritisation.'],
  };
}
