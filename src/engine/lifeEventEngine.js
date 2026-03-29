// ============================================================
// Life Event Advisor — Allocation, tax heuristics, FIRE impact
// ============================================================

import { computeFirePlan, findMinimumFeasibleRetirementAge } from './fireEngine.js';

const DISCLAIMER = 'Educational model only. Not tax/legal advice — consult a CA and SEBI-RIA for your situation.';

function baselineInputs(profile, overrides = {}) {
  return {
    currentAge: profile.currentAge,
    retirementAge: profile.retirementAge,
    monthlyIncome: profile.monthlyIncome,
    monthlyExpenses: profile.monthlyExpenses,
    existingCorpus: profile.existingCorpus,
    expectedReturn: 0.12,
    inflationRate: 0.06,
    sipStepUp: 0.1,
    swr: 0.035,
    ...overrides,
  };
}

function estimateBonusTDS(bonusAmount, grossAnnual) {
  if (bonusAmount <= 0) return { tdsRate: 0, approxTDS: 0, note: 'No bonus amount.' };
  const slab = grossAnnual >= 2000000 ? 0.31 : grossAnnual >= 1000000 ? 0.21 : 0.11;
  const approxTDS = Math.round(bonusAmount * slab);
  return { tdsRate: slab, approxTDS, note: `Marginal blend ~${(slab * 100).toFixed(0)}% on bonus (illustrative).` };
}

function compareFireImpact(profile, adjustedProfileFields) {
  const before = computeFirePlan(baselineInputs(profile));
  const after = computeFirePlan(baselineInputs({ ...profile, ...adjustedProfileFields }));
  const minBefore = findMinimumFeasibleRetirementAge(baselineInputs(profile));
  const minAfter = findMinimumFeasibleRetirementAge(baselineInputs({ ...profile, ...adjustedProfileFields }));

  return {
    before,
    after,
    retirementAgeDeltaYears:
      minBefore != null && minAfter != null ? minAfter - minBefore : null,
    minFeasibleRetirementBefore: minBefore,
    minFeasibleRetirementAfter: minAfter,
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseIndianAmount(raw) {
  if (!raw) return 0;
  const text = String(raw).toLowerCase().trim().replace(/[,₹]/g, '');
  const numMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return 0;
  const base = Number(numMatch[1]) || 0;
  if (text.includes('crore') || text.includes('cr')) return Math.round(base * 10000000);
  if (text.includes('lakh') || text.includes('lac') || text.includes('lk')) return Math.round(base * 100000);
  if (text.includes('k')) return Math.round(base * 1000);
  return Math.round(base);
}

function detectGoalFromText(goalText = '') {
  const t = String(goalText).toLowerCase();
  const currentAgeMatch = t.match(/\b(?:i am|i'm|im)\s+(\d{1,2})\b/);
  const targetAgeMatch = t.match(/\b(?:at|by|before|when i am|when i'm)\s+(\d{1,2})\b/);
  const yearsMatch = t.match(/\bin\s+(\d{1,2})\s+years?\b/);

  const explicitAmountMatch = t.match(/(?:₹|rs\.?\s*)\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakh|lac|lk|crore|cr|k))?/i)
    || t.match(/\b\d+(?:\.\d+)?\s*(?:lakh|lac|lk|crore|cr|k)\b/i);

  const currentAge = currentAgeMatch ? Number(currentAgeMatch[1]) : null;
  const targetAge = targetAgeMatch ? Number(targetAgeMatch[1]) : null;
  const yearsToGoal = yearsMatch
    ? Number(yearsMatch[1])
    : (currentAge != null && targetAge != null && targetAge > currentAge ? targetAge - currentAge : null);

  let goalType = 'general_goal';
  if (/marri|wedding|shaadi/.test(t)) goalType = 'marriage';
  else if (/house|home|flat|property/.test(t)) goalType = 'home';
  else if (/baby|child|kid|children/.test(t)) goalType = 'child';
  else if (/retire|retirement/.test(t)) goalType = 'retirement';
  else if (/car|vehicle/.test(t)) goalType = 'car';

  return {
    goalType,
    currentAge,
    targetAge,
    yearsToGoal: yearsToGoal != null ? clamp(yearsToGoal, 1, 40) : null,
    statedAmount: explicitAmountMatch ? parseIndianAmount(explicitAmountMatch[0]) : 0,
  };
}

function monthlySIPForGoal(targetAmount, years, expectedReturnAnnual = 0.12) {
  if (targetAmount <= 0 || years <= 0) return 0;
  const r = expectedReturnAnnual / 12;
  const n = years * 12;
  const factor = (Math.pow(1 + r, n) - 1) / r;
  if (!Number.isFinite(factor) || factor <= 0) return 0;
  return Math.round(targetAmount / factor);
}

function buildCustomGoalPlan(profile, goalText) {
  const parsed = detectGoalFromText(goalText);
  const inflationRate = 0.06;
  const expectedReturn = 0.12;
  const years = parsed.yearsToGoal || 8;

  const defaultCorpusByGoal = {
    marriage: 1500000,
    home: 3000000,
    child: 2000000,
    retirement: 5000000,
    car: 1000000,
    general_goal: 1200000,
  };

  const baseToday = parsed.statedAmount > 0 ? parsed.statedAmount : defaultCorpusByGoal[parsed.goalType];
  const targetCorpus = Math.round(baseToday * Math.pow(1 + inflationRate, years));
  const requiredMonthlySIP = monthlySIPForGoal(targetCorpus, years, expectedReturn);

  const currentSavings = Math.max(0, (profile.monthlyIncome || 0) - (profile.monthlyExpenses || 0));
  const investableNow = Math.max(0, currentSavings - (profile.monthlySIP || 0));
  const shortfall = Math.max(0, requiredMonthlySIP - investableNow);

  const emergencyGap = Math.max(0, (profile.monthlyExpenses || 0) * 6 - (profile.emergencyFund || 0));
  const bucketBase = requiredMonthlySIP;
  const safety = Math.round(bucketBase * 0.25);
  const growth = Math.round(bucketBase * 0.6);
  const taxSave = Math.max(0, bucketBase - safety - growth);

  const fire = compareFireImpact(profile, { monthlyExpenses: (profile.monthlyExpenses || 0) + Math.round(requiredMonthlySIP * 0.2) });

  const goalLabelMap = {
    marriage: 'marriage goal',
    home: 'home goal',
    child: 'child goal',
    retirement: 'retirement bridge goal',
    car: 'vehicle goal',
    general_goal: 'financial goal',
  };
  const goalLabel = goalLabelMap[parsed.goalType] || 'financial goal';

  return {
    summary: `For your ${goalLabel} in ~${years} years, target corpus is ${`₹${targetCorpus.toLocaleString('en-IN')}`}. Estimated SIP needed: ${`₹${requiredMonthlySIP.toLocaleString('en-IN')}`}/month.`,
    detailedBreakdown: [
      `Interpreted from text: current age ${parsed.currentAge ?? profile.currentAge || 'N/A'}, target age ${parsed.targetAge ?? 'N/A'}, horizon ${years} years.`,
      `Goal in today's value: ₹${baseToday.toLocaleString('en-IN')} → inflation-adjusted target: ₹${targetCorpus.toLocaleString('en-IN')}.`,
      `Current free monthly surplus after expenses/SIPs: ₹${Math.max(0, investableNow).toLocaleString('en-IN')}. Gap to required SIP: ₹${shortfall.toLocaleString('en-IN')}/month.`,
    ],
    reasoning: [
      'Goal corpus is inflation-adjusted first, then SIP is solved using monthly compounding.',
      'Allocation order prioritizes downside protection (emergency + debt) before long-horizon equity.',
    ],
    assumptions: [
      'Expected return 12% p.a. and inflation 6% p.a. are heuristic defaults.',
      "If your goal amount is explicitly written in prompt, it overrides model defaults.",
    ],
    sensitivity: [
      'If return is 10% instead of 12%, required SIP rises materially — revisit every 6 months.',
      'If timeline shortens by 1–2 years, increase SIP and shift more to debt in final 24 months.',
    ],
    actionPlan: [
      `Automate SIP of ₹${requiredMonthlySIP.toLocaleString('en-IN')}/month tagged to "${goalLabel}".`,
      emergencyGap > 0
        ? `First close emergency fund gap of ₹${emergencyGap.toLocaleString('en-IN')} before increasing equity risk.`
        : 'Emergency fund already near target; maintain 6 months expenses in liquid funds.',
      shortfall > 0
        ? `Bridge SIP gap of ₹${shortfall.toLocaleString('en-IN')}/month by cutting discretionary spends or increasing income.`
        : 'Current surplus can support this goal SIP without stress.',
    ],
    followUpQuestions: [
      'Do you want a simple, moderate, or aggressive allocation for this goal?',
    ],
    warnings: [
      'Marriage and life-event costs vary by city/family expectations; update goal amount with realistic estimates.',
    ],
    allocationStrategy: [
      { bucket: 'Safety (liquid + short debt)', percent: 25, amount: safety, rationale: 'Protect near-term certainty and event timing.' },
      { bucket: 'Growth (index/flexi-cap equity)', percent: 60, amount: growth, rationale: 'Primary compounding engine for multi-year horizon.' },
      { bucket: 'Tax-efficient sleeve (ELSS/PPF/EPF)', percent: 15, amount: taxSave, rationale: 'Improve post-tax returns when eligible.' },
    ],
    taxImpact: {
      items: [
        { label: 'Illustrative annual tax edge from tax-efficient sleeve', amount: Math.round(taxSave * 12 * 0.2) },
      ],
      approxTotalTaxSaved: Math.round(taxSave * 12 * 0.2),
    },
    impact: {
      savingsRateBefore: profile.monthlyIncome > 0 ? ((profile.monthlyIncome - profile.monthlyExpenses) / profile.monthlyIncome) : 0,
      savingsRateAfter: profile.monthlyIncome > 0 ? ((profile.monthlyIncome - profile.monthlyExpenses - requiredMonthlySIP) / profile.monthlyIncome) : 0,
      retirementAgeDeltaYears: fire.retirementAgeDeltaYears,
      netWorthDelta: 0,
      requiredSIPDelta: requiredMonthlySIP - (profile.monthlySIP || 0),
      impactDashboard: {
        savingsRateBeforePct: Math.round(((profile.monthlyIncome > 0 ? ((profile.monthlyIncome - profile.monthlyExpenses) / profile.monthlyIncome) : 0) * 1000)) / 10,
        savingsRateAfterPct: Math.round(((profile.monthlyIncome > 0 ? ((profile.monthlyIncome - profile.monthlyExpenses - requiredMonthlySIP) / profile.monthlyIncome) : 0) * 1000)) / 10,
        taxSavedApprox: Math.round(taxSave * 12 * 0.2),
        retirementAgeDeltaYears: fire.retirementAgeDeltaYears,
        netWorthGrowth: 0,
        requiredSIPChange: requiredMonthlySIP - (profile.monthlySIP || 0),
      },
    },
    actions: [
      { action: 'Monthly goal SIP', amount: requiredMonthlySIP },
      { action: 'Safety bucket monthly', amount: safety },
      { action: 'Growth bucket monthly', amount: growth },
      { action: 'Tax-efficient monthly', amount: taxSave },
    ],
    advice: [],
    disclaimer: DISCLAIMER,
    explanationLog: ['LifeEvent_Agent: custom_goal parser + inflation-adjusted corpus + SIP solver.'],
  };
}

/**
 * @param {{ event: string, profile: object }} data
 */
export function computeLifeEventPlan(data) {
  const { event, profile } = data;
  const grossAnnual = profile.grossSalary || profile.monthlyIncome * 12;

  const allocationStrategy = [];
  const taxImpact = { items: [], approxTotalTaxSaved: 0 };
  const impact = {
    savingsRateBefore: 0,
    savingsRateAfter: 0,
    retirementAgeDeltaYears: null,
    netWorthDelta: 0,
    requiredSIPDelta: 0,
  };

  const monthlySavings = profile.monthlyIncome - profile.monthlyExpenses;
  impact.savingsRateBefore = profile.monthlyIncome > 0 ? monthlySavings / profile.monthlyIncome : 0;

  let summary = '';
  const detailedBreakdown = [];
  const reasoning = [];
  const assumptions = [
    'Uses same 12% return / 6% inflation as FIRE planner unless event overrides expenses or corpus.',
    'Tax figures are simplified marginal estimates, not payroll-exact TDS.',
  ];
  const sensitivity = [];
  const actionPlan = [];
  const followUpQuestions = [];
  const warnings = [];
  const actions = [];
  let explanationLog = [`LifeEvent_Agent: event="${event}"`];

  switch (event) {
    case 'bonus': {
      const bonus = Number(profile.bonusAmount) || profile.monthlyIncome * 2;
      const tds = estimateBonusTDS(bonus, grossAnnual);
      const postTax = Math.max(0, bonus - tds.approxTDS);
      const emergencyGap = Math.max(0, profile.monthlyExpenses * 6 - (profile.emergencyFund || 0));
      const sec80CGap = Math.max(0, 150000 - (profile.section80C || 0));
      const allocEmergency = Math.min(postTax * 0.35, emergencyGap);
      const alloc80C = Math.min(postTax * 0.25, sec80CGap);
      const equityLump = Math.max(0, postTax - allocEmergency - alloc80C);

      allocationStrategy.push(
        { bucket: 'Emergency top-up', percent: postTax > 0 ? (allocEmergency / postTax) * 100 : 0, amount: Math.round(allocEmergency), rationale: 'Close 6-month expense gap first.' },
        { bucket: '80C (ELSS/PPF)', percent: postTax > 0 ? (alloc80C / postTax) * 100 : 0, amount: Math.round(alloc80C), rationale: 'Use unused 80C room to save tax on salary + bonus curve.' },
        { bucket: 'Equity MF (STP)', percent: postTax > 0 ? (equityLump / postTax) * 100 : 0, amount: Math.round(equityLump), rationale: 'Deploy surplus into diversified equity via STP over 3–6 months.' },
      );

      taxImpact.items.push({ label: 'Approx TDS on bonus', amount: tds.approxTDS });
      const taxSavedFrom80C = Math.min(alloc80C, sec80CGap) * 0.3;
      taxImpact.approxTotalTaxSaved = Math.round(taxSavedFrom80C);
      taxImpact.items.push({ label: 'Illustrative tax saved via 80C deployment', amount: Math.round(taxSavedFrom80C) });

      const deployedToCorpus = allocEmergency + equityLump * 0.7;
      const fire = compareFireImpact(profile, { existingCorpus: profile.existingCorpus + deployedToCorpus });
      impact.retirementAgeDeltaYears = fire.retirementAgeDeltaYears;
      impact.requiredSIPDelta = (fire.before.requiredMonthlySIP || 0) - (fire.after.requiredMonthlySIP || 0);
      impact.netWorthDelta = deployedToCorpus;
      impact.savingsRateAfter = impact.savingsRateBefore;

      summary = `Deploy ₹${postTax.toLocaleString('en-IN')} post-tax bonus: ${(allocationStrategy[0].percent).toFixed(0)}% emergency, ${allocationStrategy[1].percent.toFixed(0)}% tax-saving, rest to growth.`;
      detailedBreakdown.push(`Gross bonus ₹${bonus.toLocaleString('en-IN')}; approx TDS ₹${tds.approxTDS.toLocaleString('en-IN')} (${tds.note}).`);
      detailedBreakdown.push(`Projected FIRE SIP need drops by ₹${Math.max(0, Math.round(impact.requiredSIPDelta)).toLocaleString('en-IN')}/mo after deploying ₹${Math.round(deployedToCorpus).toLocaleString('en-IN')} to corpus/emergency.`);

      reasoning.push('Liquidity and tax-advantaged buckets are filled before market risk.');
      reasoning.push('Emergency gap drives first rupee — prevents forced equity exits in shocks.');

      actionPlan.push(`Park ₹${Math.round(allocEmergency).toLocaleString('en-IN')} to liquid/FD ladder if EF still short.`);
      actionPlan.push(`Route ₹${Math.round(alloc80C).toLocaleString('en-IN')} to ELSS/PPF before March 31.`);
      actionPlan.push(`STP ₹${Math.round(equityLump).toLocaleString('en-IN')} into flexi-cap/index over 90–180 days.`);

      actions.push(
        { action: 'Emergency / Liquid', amount: Math.round(allocEmergency) },
        { action: '80C top-up', amount: Math.round(alloc80C) },
        { action: 'Equity via STP', amount: Math.round(equityLump) },
      );

      sensitivity.push('If bonus is deferred to next FY, time ELSS/80C to the year of receipt.');
      explanationLog.push('Bonus path: TDS heuristic + 3-bucket allocator + FIRE SIP delta.');
      break;
    }

    case 'marriage': {
      const combinedExpenses = Math.round(profile.monthlyExpenses * 1.18);
      const combinedIncome = Math.round(profile.monthlyIncome * 1.05);
      impact.savingsRateAfter = (combinedIncome - combinedExpenses) / combinedIncome;
      const fire = compareFireImpact(profile, { monthlyExpenses: combinedExpenses, monthlyIncome: combinedIncome });
      impact.retirementAgeDeltaYears = fire.retirementAgeDeltaYears;
      impact.requiredSIPDelta = (fire.after.requiredMonthlySIP || 0) - (fire.before.requiredMonthlySIP || 0);

      allocationStrategy.push(
        { bucket: 'Joint emergency (6 mo)', percent: 25, amount: Math.round(combinedExpenses * 6 * 0.1), rationale: 'Top-up joint buffer in first 90 days.' },
        { bucket: 'Term life top-up', percent: 15, amount: 15000, rationale: 'Cover income replacement for both earners.' },
        { bucket: 'Goal SIP (home/travel)', percent: 60, amount: Math.round(combinedIncome * 0.12), rationale: 'Shared medium-term goals post-alignment.' },
      );

      taxImpact.items.push({ label: 'HRA optimisation (higher basic claims rent)', amount: 0 });
      taxImpact.approxTotalTaxSaved = Math.round(profile.monthlyIncome * 0.02 * 12);

      summary = 'Marriage shifts cashflows: model assumes ~18% higher household expenses and modest income synergy; revisit FIRE age jointly.';
      detailedBreakdown.push(`Illustrative new household expenses ₹${combinedExpenses.toLocaleString('en-IN')}/mo; required SIP may change by ₹${Math.round(impact.requiredSIPDelta).toLocaleString('en-IN')}/mo.`);
      reasoning.push('Nominee updates and insurance are non-negotiable before asset consolidation.');
      followUpQuestions.push('Will you merge accounts or keep separate SIPs with a joint sheet?');

      actionPlan.push('Update nominees across MF demat, EPF, bank, and term plans.');
      actionPlan.push('Run Couples Planner for HRA + 80C split optimisation.');
      actions.push({ action: 'Nominee audit', amount: 0 }, { action: 'Joint EF top-up', amount: Math.round(combinedExpenses * 0.5) });
      warnings.push('If only one partner earns, set higher term cover on earner + health floater ≥ ₹10L.');
      explanationLog.push('Marriage: expense +5–18% heuristic, joint FIRE recompute.');
      break;
    }

    case 'new_baby': {
      const childCost = 12000;
      const newExpenses = profile.monthlyExpenses + childCost;
      const fire = compareFireImpact(profile, { monthlyExpenses: newExpenses });
      impact.savingsRateAfter = (profile.monthlyIncome - newExpenses) / profile.monthlyIncome;
      impact.retirementAgeDeltaYears = fire.retirementAgeDeltaYears;
      impact.requiredSIPDelta = (fire.after.requiredMonthlySIP || 0) - (fire.before.requiredMonthlySIP || 0);

      allocationStrategy.push(
        { bucket: 'Health floater upgrade', percent: 10, amount: 18000, rationale: 'Add member + bump sum insured.' },
        { bucket: 'SSY / education SIP', percent: 45, amount: 7500, rationale: 'Tax-advantaged + goal-specific compounding.' },
        { bucket: 'Term cover increase', percent: 10, amount: 12000, rationale: 'Cover new dependent liability.' },
        { bucket: 'Liquid buffer (12 mo childcare)', percent: 35, amount: Math.round(childCost * 12), rationale: 'Smooth volatile first-year costs.' },
      );

      taxImpact.items.push({ label: '80C via SSY (eligible portion)', amount: 0 });
      summary = `New dependent: +₹${childCost.toLocaleString('en-IN')}/mo expenses shifts FIRE; education SIP anchors long horizon.`;
      detailedBreakdown.push(`Minimum feasible retirement age moves ${impact.retirementAgeDeltaYears != null ? `${impact.retirementAgeDeltaYears > 0 ? '+' : ''}${impact.retirementAgeDeltaYears} yrs` : 'N/A'} under this demo's assumptions.`);

      reasoning.push('Education is a dated liability — start equity-heavy SIP early, shift to debt near Year 12.');
      actionPlan.push('Increase family floater to ₹10L+; add ₹20–25% term cover.');
      actions.push({ action: 'Child education SIP', amount: 7500 }, { action: 'Health upgrade', amount: 18000 });
      followUpQuestions.push('Do grandparents support childcare? (reduces monthly shock.)');
      warnings.push('Do not stop retirement SIP entirely — balance child goal vs. FIRE shortfall.');
      explanationLog.push('Baby: +expense shock, education SIP, term/health adjustments.');
      break;
    }

    case 'inheritance': {
      const amount = Number(profile.inheritanceAmount) || 2000000;
      const ltcgEstimate = 0;
      taxImpact.items.push({ label: 'LTCG/STCG (if any liquidated)', amount: ltcgEstimate });
      taxImpact.approxTotalTaxSaved = 0;

      allocationStrategy.push(
        { bucket: 'Liquid park (30–60d)', percent: 15, amount: Math.round(amount * 0.15), rationale: 'Decision clarity before equity deployment.' },
        { bucket: 'Equity MF (STP 9 mo)', percent: 40, amount: Math.round(amount * 0.4), rationale: 'Core wealth builder.' },
        { bucket: 'Debt / Gilt short duration', percent: 25, amount: Math.round(amount * 0.25), rationale: 'Stability + rebalancing ballast.' },
        { bucket: 'Gold / REIT satellite', percent: 20, amount: Math.round(amount * 0.2), rationale: 'Diversifier vs equity drawdowns.' },
      );

      const fire = compareFireImpact(profile, { existingCorpus: profile.existingCorpus + amount * 0.85 });
      impact.retirementAgeDeltaYears = fire.retirementAgeDeltaYears;
      impact.requiredSIPDelta = (fire.before.requiredMonthlySIP || 0) - (fire.after.requiredMonthlySIP || 0);
      impact.netWorthDelta = amount;
      impact.savingsRateAfter = impact.savingsRateBefore;

      summary = `Inherit ₹${amount.toLocaleString('en-IN')}: stagger deployment; model adds 85% to investable corpus after liquidity reserve.`;
      detailedBreakdown.push(`FIRE SIP need falls ~₹${Math.max(0, Math.round(impact.requiredSIPDelta)).toLocaleString('en-IN')}/mo; min feasible retirement age improves by ${impact.retirementAgeDeltaYears != null ? `${Math.abs(impact.retirementAgeDeltaYears)} yrs` : 'N/A'}.`);

      reasoning.push('Lumpsum equity entry risk → STP; verify tax residency and deed registration separately.');
      actionPlan.push('Keep 15% liquid, STP to equity, document source for future scrutiny.');
      actions.push(
        { action: 'Liquid reserve', amount: Math.round(amount * 0.15) },
        { action: 'STP to equity', amount: Math.round(amount * 0.4) },
        { action: 'Debt book', amount: Math.round(amount * 0.25) },
        { action: 'Gold/REIT', amount: Math.round(amount * 0.2) },
      );
      warnings.push('Property inheritance may attract stamp duty/capital gains on sale — validate with CA.');
      sensitivity.push('If markets are euphoric, lengthen STP to 12–18 months.');
      explanationLog.push('Inheritance: 4-bucket deployment + corpus shock to FIRE.');
      break;
    }

    case 'job_loss': {
      const runwayMonths = (profile.emergencyFund || 0) / Math.max(1, profile.monthlyExpenses);
      impact.savingsRateAfter = 0;
      impact.retirementAgeDeltaYears = null;
      impact.requiredSIPDelta = 0;

      allocationStrategy.push(
        { bucket: 'Essential expenses only', percent: 70, amount: Math.round(profile.monthlyExpenses * 0.65), rationale: 'Cut discretionary 30–40% immediately.' },
        { bucket: 'Pause SIPs (except term/health)', percent: 20, amount: 0, rationale: 'Preserve runway; resume on first salary credit.' },
        { bucket: 'Skill / runway buffer', percent: 10, amount: Math.round(profile.monthlyExpenses * 0.5), rationale: 'Interview travel, certifications.' },
      );

      taxImpact.items.push({ label: 'Loss of salary TDS / PF continuity', amount: 0 });

      summary = `Emergency runway ≈ ${runwayMonths.toFixed(1)} months at current spend. Do not redeem long-term equity unless EF exhausted.`;
      detailedBreakdown.push(`EF ₹${(profile.emergencyFund || 0).toLocaleString('en-IN')} vs spend ₹${profile.monthlyExpenses.toLocaleString('en-IN')}/mo.`);

      reasoning.push('Sequence of returns risk is behavioural — selling equity at trough locks losses.');
      actionPlan.push('Call lenders for EMI moratorium options; avoid new debt.');
      warnings.push('If runway < 3 months, consider liquidating only debt/Arbitrage before equity.');
      followUpQuestions.push('Any severance or notice-period income? Add to EF before pausing SIPs.');
      explanationLog.push('Job loss: runway math + behaviour guardrails.');
      break;
    }

    case 'custom_goal': {
      const goalPlan = buildCustomGoalPlan(profile, profile.goalText || '');
      return {
        event,
        ...goalPlan,
        advice: [
          ...goalPlan.actionPlan,
          ...goalPlan.detailedBreakdown,
        ],
      };
    }

    default: {
      summary = 'Select a specific event for a tailored allocation and FIRE impact.';
      warnings.push('Unknown event id.');
      actionPlan.push(summary);
    }
  }

  return {
    event,
    summary,
    detailedBreakdown,
    reasoning,
    assumptions,
    sensitivity,
    actionPlan,
    followUpQuestions,
    warnings,
    allocationStrategy,
    taxImpact,
    impact: {
      ...impact,
      impactDashboard: {
        savingsRateBeforePct: Math.round(impact.savingsRateBefore * 1000) / 10,
        savingsRateAfterPct: Math.round(impact.savingsRateAfter * 1000) / 10,
        taxSavedApprox: taxImpact.approxTotalTaxSaved,
        retirementAgeDeltaYears: impact.retirementAgeDeltaYears,
        netWorthGrowth: impact.netWorthDelta,
        requiredSIPChange: Math.round(impact.requiredSIPDelta),
      },
    },
    actions,
    advice: [
      ...actionPlan,
      ...detailedBreakdown,
    ],
    disclaimer: DISCLAIMER,
    explanationLog,
  };
}
