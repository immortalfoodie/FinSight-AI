// ============================================================
// Couples Finance Engine — Joint Tax Optimization
// SIP splitting, HRA optimal claim, NPS matching, Joint NW
// ============================================================

import { computeTax } from './taxEngine.js';

/**
 * Optimize HRA claim between partners
 * Only one should claim HRA — whichever saves more tax
 */
function optimizeHRA(p1, p2) {
  // Compute tax with and without HRA for each
  const p1WithHRA = computeTax(p1);
  const p1NoHRA = computeTax({ ...p1, rentPaid: 0 });
  const hraSavingsP1 = p1NoHRA.oldRegime.totalTax - p1WithHRA.oldRegime.totalTax;

  const p2WithHRA = computeTax(p2);
  const p2NoHRA = computeTax({ ...p2, rentPaid: 0 });
  const hraSavingsP2 = p2NoHRA.oldRegime.totalTax - p2WithHRA.oldRegime.totalTax;

  return {
    optimalClaimant: hraSavingsP1 >= hraSavingsP2 ? 'Partner 1' : 'Partner 2',
    p1HRASaving: Math.round(hraSavingsP1),
    p2HRASaving: Math.round(hraSavingsP2),
    maxSaving: Math.max(hraSavingsP1, hraSavingsP2),
  };
}

/**
 * Optimize 80C investment splitting
 */
function optimize80C(p1, p2) {
  const p1gap = 150000 - Math.min(p1.section80C || 0, 150000);
  const p2gap = 150000 - Math.min(p2.section80C || 0, 150000);
  const tips = [];
  if (p1gap > 0) tips.push(`Partner 1: Invest ₹${p1gap.toLocaleString('en-IN')} more in 80C (ELSS/PPF).`);
  if (p2gap > 0) tips.push(`Partner 2: Invest ₹${p2gap.toLocaleString('en-IN')} more in 80C (ELSS/PPF).`);
  return { p1gap, p2gap, tips, totalGap: p1gap + p2gap };
}

/**
 * Full couples analysis
 */
export function analyzeCouples(partner1, partner2) {
  const tax1 = computeTax(partner1);
  const tax2 = computeTax(partner2);
  const combinedTaxBefore = tax1.oldRegime.totalTax + tax2.oldRegime.totalTax;

  const hra = optimizeHRA(partner1, partner2);
  const sec80C = optimize80C(partner1, partner2);

  // NPS optimization — both should max 80CCD(1B) if not already
  const nps1gap = 50000 - Math.min(partner1.section80CCD_1B || 0, 50000);
  const nps2gap = 50000 - Math.min(partner2.section80CCD_1B || 0, 50000);

  // Optimal SIP split — higher income partner takes more equity risk
  const totalSIP = (partner1.monthlySIP || 0) + (partner2.monthlySIP || 0);
  const incomeRatio = partner1.grossSalary / (partner1.grossSalary + partner2.grossSalary);

  // Combined net worth
  const netWorth = {
    partner1: (partner1.existingCorpus || 0) + (partner1.emergencyFund || 0),
    partner2: (partner2.existingCorpus || 0) + (partner2.emergencyFund || 0),
  };
  netWorth.combined = netWorth.partner1 + netWorth.partner2;

  // Insurance check
  const p1LifeGap = Math.max(0, partner1.grossSalary * 15 - (partner1.lifeInsuranceCover || 0));
  const p2LifeGap = Math.max(0, partner2.grossSalary * 15 - (partner2.lifeInsuranceCover || 0));

  // Potential combined savings
  const potentialTaxSaved = hra.maxSaving + (sec80C.totalGap * 0.3) + ((nps1gap + nps2gap) * 0.3);

  return {
    partner1Tax: tax1,
    partner2Tax: tax2,
    combinedTaxBefore,
    hra,
    section80C: sec80C,
    nps: { p1gap: nps1gap, p2gap: nps2gap, totalGap: nps1gap + nps2gap },
    sipSplit: {
      totalSIP,
      recommended: `Partner 1: ${Math.round(incomeRatio * 100)}% (₹${Math.round(totalSIP * incomeRatio).toLocaleString('en-IN')}), Partner 2: ${Math.round((1 - incomeRatio) * 100)}% (₹${Math.round(totalSIP * (1 - incomeRatio)).toLocaleString('en-IN')})`,
    },
    netWorth,
    insuranceGaps: { p1LifeGap, p2LifeGap },
    potentialTaxSaved: Math.round(potentialTaxSaved),
  };
}
