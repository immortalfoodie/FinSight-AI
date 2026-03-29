// ============================================================
// Indian Tax Engine — FY 2025-26 (AY 2026-27)
// Real slab calculations, deductions, HRA, regime comparison
// ============================================================

const OLD_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.2 },
  { min: 1000000, max: Infinity, rate: 0.3 },
];

const NEW_SLABS_FY2526 = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400000, max: 800000, rate: 0.05 },
  { min: 800000, max: 1200000, rate: 0.10 },
  { min: 1200000, max: 1600000, rate: 0.15 },
  { min: 1600000, max: 2000000, rate: 0.20 },
  { min: 2000000, max: 2400000, rate: 0.25 },
  { min: 2400000, max: Infinity, rate: 0.30 },
];

function calcSlabTax(income, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxable = Math.min(income, slab.max) - slab.min;
    tax += taxable * slab.rate;
  }
  return tax;
}

function calcHRAExemption({ basicSalary, hraReceived, rentPaid, isMetro }) {
  if (!rentPaid || rentPaid <= 0) return 0;
  const a = hraReceived;
  const b = (isMetro ? 0.50 : 0.40) * basicSalary;
  const c = rentPaid - 0.10 * basicSalary;
  return Math.max(0, Math.min(a, b, Math.max(0, c)));
}

function inferRiskProfile({ age = 30, totalEMI = 0, monthlyIncome = 0 }) {
  const dti = monthlyIncome > 0 ? totalEMI / monthlyIncome : 0;
  if (dti > 0.4) return 'Conservative';
  if (age <= 32) return 'Aggressive';
  if (age <= 45) return 'Balanced';
  return 'Conservative';
}

function buildTaxSavingRecommendations({ section80C, section80CCD_1B, section80D, riskProfile }) {
  const recs = [];
  const gap80C = Math.max(0, 150000 - section80C);
  const gapNPS = Math.max(0, 50000 - section80CCD_1B);
  const gap80D = Math.max(0, 25000 - section80D);

  if (gap80C > 0) {
    recs.push({
      name: riskProfile === 'Aggressive' ? 'ELSS Index / Flexi-Cap Fund' : 'PPF + ELSS split',
      section: '80C',
      maxEligible: gap80C,
      risk: riskProfile === 'Aggressive' ? 'High' : 'Medium',
      liquidity: 'Medium (3-year lock-in for ELSS, low for PPF)',
      rationale: 'Uses available 80C room while balancing growth and lock-in.',
    });
  }

  if (gapNPS > 0) {
    recs.push({
      name: 'NPS Tier-I (80CCD(1B))',
      section: '80CCD(1B)',
      maxEligible: gapNPS,
      risk: riskProfile === 'Conservative' ? 'Low-Medium' : 'Medium',
      liquidity: 'Low (retirement-tilted lock-in)',
      rationale: 'Extra deduction over and above 80C up to ₹50,000.',
    });
  }

  if (gap80D > 0) {
    recs.push({
      name: 'Health Insurance (self/family/parents)',
      section: '80D',
      maxEligible: gap80D,
      risk: 'Low',
      liquidity: 'Not an investment (protection product)',
      rationale: 'Tax benefit plus risk protection against medical shocks.',
    });
  }

  return recs.sort((a, b) => {
    const liquidityRank = (v) => (v.startsWith('Medium') ? 2 : v.startsWith('Low') ? 1 : 3);
    return b.maxEligible - a.maxEligible || liquidityRank(b.liquidity) - liquidityRank(a.liquidity);
  });
}

export function computeTax(profile) {
  const {
    grossSalary = 0,
    basicSalary = 0,
    hraReceived = 0,
    rentPaid = 0,
    isMetro = false,
    section80C = 0,       // EPF + PPF + ELSS + LIC etc (max 150000)
    section80D = 0,       // Medical insurance (max 25000 self + 25-50k parents)
    section80CCD_1B = 0,  // NPS (max 50000)
    section80TTA = 0,     // Savings interest (max 10000)
    homeLoanInterest = 0, // Sec 24 (max 200000)
    otherDeductions = 0,
    currentAge = 30,
    totalEMI = 0,
    monthlyIncome = 0,
  } = profile;

  // --- OLD REGIME ---
  const stdDeductionOld = 50000;
  const hra = calcHRAExemption({ basicSalary, hraReceived, rentPaid, isMetro });
  const capped80C = Math.min(section80C, 150000);
  const capped80D = Math.min(section80D, 75000);
  const capped80CCD = Math.min(section80CCD_1B, 50000);
  const capped80TTA = Math.min(section80TTA, 10000);
  const cappedHomeLoan = Math.min(homeLoanInterest, 200000);

  const totalDeductionsOld = stdDeductionOld + hra + capped80C + capped80D + capped80CCD + capped80TTA + cappedHomeLoan + otherDeductions;
  const taxableIncomeOld = Math.max(0, grossSalary - totalDeductionsOld);
  let taxOld = calcSlabTax(taxableIncomeOld, OLD_SLABS);
  // Rebate u/s 87A old — if taxable <= 500000
  if (taxableIncomeOld <= 500000) taxOld = 0;
  const cessOld = taxOld * 0.04;
  const totalTaxOld = taxOld + cessOld;

  // --- NEW REGIME ---
  const stdDeductionNew = 75000;
  const taxableIncomeNew = Math.max(0, grossSalary - stdDeductionNew);
  let taxNew = calcSlabTax(taxableIncomeNew, NEW_SLABS_FY2526);
  // Rebate u/s 87A new — marginal relief if taxable <= 1200000
  if (taxableIncomeNew <= 1200000) taxNew = 0;
  const cessNew = taxNew * 0.04;
  const totalTaxNew = taxNew + cessNew;

  // --- MISSING DEDUCTIONS ANALYSIS ---
  const missingDeductions = [];
  const missedAmount = { total: 0 };

  if (section80C < 150000) {
    const gap = 150000 - section80C;
    missingDeductions.push({
      section: '80C',
      gap,
      tip: `You have ₹${(gap).toLocaleString('en-IN')} headroom in 80C. Consider ELSS mutual funds for tax saving + market-linked returns.`
    });
    missedAmount.total += gap;
  }
  if (section80CCD_1B < 50000) {
    const gap = 50000 - section80CCD_1B;
    missingDeductions.push({
      section: '80CCD(1B)',
      gap,
      tip: `Invest ₹${gap.toLocaleString('en-IN')} in NPS to claim additional deduction under 80CCD(1B) (over & above 80C limit).`
    });
    missedAmount.total += gap;
  }
  if (section80D < 25000) {
    missingDeductions.push({
      section: '80D',
      gap: 25000 - section80D,
      tip: `Get health insurance for yourself to claim up to ₹25,000 under 80D. For parents (senior citizen), claim up to ₹50,000 additionally.`
    });
    missedAmount.total += 25000 - section80D;
  }
  if (hraReceived > 0 && rentPaid === 0) {
    missingDeductions.push({
      section: 'HRA',
      gap: hra,
      tip: `You receive HRA but haven't claimed rent. If you pay rent, you could save significantly via HRA exemption.`
    });
  }
  if (homeLoanInterest === 0) {
    missingDeductions.push({
      section: 'Sec 24',
      gap: 0,
      tip: `No home loan interest claimed. If applicable, up to ₹2,00,000 can be deducted under Section 24(b).`
    });
  }

  const recommended = totalTaxNew <= totalTaxOld ? 'New Regime' : 'Old Regime';
  const savings = Math.abs(totalTaxOld - totalTaxNew);
  const riskProfile = inferRiskProfile({ age: currentAge, totalEMI, monthlyIncome });
  const recommendedInvestments = buildTaxSavingRecommendations({ section80C, section80CCD_1B, section80D, riskProfile });

  return {
    oldRegime: {
      taxableIncome: taxableIncomeOld,
      deductions: totalDeductionsOld,
      tax: taxOld,
      cess: cessOld,
      totalTax: Math.round(totalTaxOld),
      hraExemption: Math.round(hra),
      breakdown: { stdDeduction: stdDeductionOld, hra: Math.round(hra), '80C': capped80C, '80D': capped80D, '80CCD(1B)': capped80CCD, '80TTA': capped80TTA, 'Sec24': cappedHomeLoan }
    },
    newRegime: {
      taxableIncome: taxableIncomeNew,
      deductions: stdDeductionNew,
      tax: taxNew,
      cess: cessNew,
      totalTax: Math.round(totalTaxNew),
    },
    recommended,
    savings: Math.round(savings),
    missingDeductions,
    missedDeductionTotal: missedAmount.total,
    riskProfile,
    recommendedInvestments,
  };
}
