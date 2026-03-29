// ============================================================
// Money Health Score Engine — All 6 Dimensions
// Weighted scoring with actionable insights per dimension
// ============================================================

const WEIGHTS = {
  emergency: 20,
  insurance: 20,
  investments: 15,
  debt: 15,
  tax: 15,
  retirement: 15,
};

function clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }

function scoreEmergency(profile) {
  const { monthlyExpenses, emergencyFund } = profile;
  const target = monthlyExpenses * 6;
  if (target <= 0) return { score: 50, status: 'Unknown', insight: 'Enter your monthly expenses to calculate.' };
  const ratio = emergencyFund / target;
  const score = clamp(Math.round(ratio * 100));
  let status, insight;
  if (ratio >= 1) { status = 'Healthy'; insight = `You’re sitting on about ${(ratio * 6).toFixed(1)} months of expenses in liquid savings — that’s the kind of cushion that lets you invest calmly elsewhere.`; }
  else if (ratio >= 0.5) { status = 'Needs Work'; insight = `You’ve covered roughly ${(ratio * 6).toFixed(1)} months of expenses. We’d like to see six months (₹${target.toLocaleString('en-IN')}) so a surprise bill doesn’t force you to touch long-term investments.`; }
  else { status = 'Critical'; insight = `Your emergency buffer is thin — about ${(ratio * 6).toFixed(1)} months. Prioritise ₹${target.toLocaleString('en-IN')} in liquid funds before adding more market risk.`; }
  return { score, status, insight, target, current: emergencyFund };
}

function scoreInsurance(profile) {
  const { grossSalary, annualIncome, lifeInsuranceCover, healthInsuranceCover } = profile;
  const income = annualIncome || grossSalary || 0;
  const targetLife = income * 15;
  const lifeRatio = targetLife > 0 ? lifeInsuranceCover / targetLife : 0;
  const hasHealth = Number(profile.healthInsuranceCover || 0) > 0;

  let score = 0;
  score += clamp(Math.round(lifeRatio * 70)); // 70 points for life cover
  score += hasHealth ? 30 : (healthInsuranceCover > 0 ? 15 : 0); // 30 for health

  let status, insight;
  if (score >= 80) { status = 'Healthy'; insight = 'Life and health coverage look aligned with a typical income — you’ve reduced “what if” stress for your family.'; }
  else if (score >= 40) { 
    status = 'Needs Work'; 
    const parts = [];
    if (lifeRatio < 1) parts.push(`Life cover is roughly ${(lifeRatio * 15).toFixed(1)}× annual income; many families aim for ~15× (about ₹${targetLife.toLocaleString('en-IN')}) so goals aren’t derailed`);
    if (!hasHealth) parts.push('Health insurance is below the ₹5L floor we use for peace of mind on hospital bills');
    insight = parts.join('. ') + '.';
  }
  else { status = 'Critical'; insight = `Life cover is far below what your income implies — a pure term plan toward ₹${targetLife.toLocaleString('en-IN')} is the first lever. ${!hasHealth ? 'Add a solid health policy too — premiums are usually cheaper than one unprepared bill.' : ''}`; }
  return { score: clamp(score), status, insight, targetLife, currentLife: lifeInsuranceCover };
}

function scoreInvestments(profile) {
  const { monthlyIncome, monthlySIP, investmentTypes = [] } = profile;
  const idealSIP = monthlyIncome * 0.2; // 20% of income
  const sipRatio = idealSIP > 0 ? monthlySIP / idealSIP : 0;
  const diversified = investmentTypes.length >= 3; // equity, debt, gold etc.

  let score = 0;
  score += clamp(Math.round(sipRatio * 60));
  score += diversified ? 40 : investmentTypes.length * 13;

  let status, insight;
  if (score >= 75) { status = 'Healthy'; insight = `You’re investing about ${((monthlySIP / monthlyIncome) * 100).toFixed(0)}% of income across ${investmentTypes.length} buckets — that habit is doing the heavy lifting.`; }
  else if (score >= 40) { status = 'Needs Work'; insight = `You’re putting ₹${monthlySIP.toLocaleString('en-IN')}/mo to work; nudging toward ~₹${Math.round(idealSIP).toLocaleString('en-IN')}/mo (20% of income) and adding one more asset class usually smooths returns.`; }
  else { status = 'Critical'; insight = `Investments are still a small slice of income — even ₹${Math.round(idealSIP).toLocaleString('en-IN')}/mo as a starting SIP can change the arc over years.`; }
  return { score: clamp(score), status, insight };
}

function scoreDebt(profile) {
  const { monthlyIncome, totalEMI } = profile;
  if (totalEMI === 0) return { score: 100, status: 'Excellent', insight: 'No debt obligations. Full income available for saving and investing.' };
  const dtiRatio = totalEMI / monthlyIncome;
  const score = clamp(Math.round((1 - dtiRatio / 0.5) * 100)); // 50% DTI = 0 score

  let status, insight;
  if (dtiRatio <= 0.2) { status = 'Healthy'; insight = `EMIs are about ${(dtiRatio * 100).toFixed(0)}% of income — you’ve kept debt from crowding out savings.`; }
  else if (dtiRatio <= 0.4) { status = 'Needs Work'; insight = `EMIs are roughly ${(dtiRatio * 100).toFixed(0)}% of income — trimming the highest-rate loan first often beats chasing market returns.`; }
  else { status = 'Critical'; insight = `EMIs are ${(dtiRatio * 100).toFixed(0)}% of income — that’s hard to sustain. Pause new goals until you carve out breathing room.`; }
  return { score: clamp(score), status, insight };
}

function scoreTaxEfficiency(profile) {
  const { section80C, section80D, section80CCD_1B, filedOnTime } = profile;
  const max80C = 150000, max80D = 25000, maxNPS = 50000;

  let score = 0;
  score += (section80C / max80C) * 35;
  score += (section80D / max80D) * 25;
  score += (section80CCD_1B / maxNPS) * 20;
  score += filedOnTime ? 20 : 0;

  let status, insight;
  const total = section80C + section80D + section80CCD_1B;
  const maxTotal = max80C + max80D + maxNPS;
  if (score >= 75) { status = 'Healthy'; insight = `You’re using roughly ${((total / maxTotal) * 100).toFixed(0)}% of the deduction room we model — that usually means less leakage to tax than peers.`; }
  else if (score >= 40) { 
    status = 'Needs Work'; 
    const gaps = [];
    if (section80C < max80C) gaps.push(`about ₹${(max80C - section80C).toLocaleString('en-IN')} still available in 80C`);
    if (section80CCD_1B < maxNPS) gaps.push(`up to ₹${(maxNPS - section80CCD_1B).toLocaleString('en-IN')} in extra NPS (80CCD)`);
    insight = `A few structured investments could close: ${gaps.join(', ')} — often the easiest “return” you’ll get.`;
  }
  else { status = 'Critical'; insight = 'Most deduction levers are unused — you may be leaving meaningful money on the table each year.'; }
  return { score: clamp(Math.round(score)), status, insight };
}

function scoreRetirement(profile) {
  const { currentAge, retirementAge, existingCorpus, monthlyExpenses } = profile;
  const years = retirementAge - currentAge;
  if (years <= 0) return { score: 50, status: 'N/A', insight: 'Already at or past retirement age.' };

  // Simple adequacy check: will corpus grow enough?
  const futureExpense = monthlyExpenses * Math.pow(1.06, years) * 12;
  const requiredCorpus = futureExpense / 0.035; // 3.5% SWR
  const projectedCorpus = existingCorpus * Math.pow(1.12, years); // assuming 12% return
  const adequacy = projectedCorpus / requiredCorpus;

  const score = clamp(Math.round(adequacy * 100));
  let status, insight;
  if (adequacy >= 1) { status = 'On Track'; insight = `On paper, today’s corpus path could cover about ${(adequacy * 100).toFixed(0)}% of the retirement need we estimate — keep the discipline.`; }
  else if (adequacy >= 0.5) { status = 'Needs Work'; insight = `You’re roughly halfway to a ₹${(requiredCorpus / 10000000).toFixed(1)} Cr-style target; raising SIPs or horizon usually closes it faster than timing markets.`; }
  else { status = 'Critical'; insight = `Retirement funding looks far short of a ₹${(requiredCorpus / 10000000).toFixed(1)} Cr need — small, steady increases beat waiting for the “right” year.`; }
  return { score, status, insight, requiredCorpus, projectedCorpus };
}

export function computeHealthScore(profile) {
  const emergency = scoreEmergency(profile);
  const insurance = scoreInsurance(profile);
  const investments = scoreInvestments(profile);
  const debt = scoreDebt(profile);
  const tax = scoreTaxEfficiency(profile);
  const retirement = scoreRetirement(profile);

  const dimensions = [
    { key: 'emergency', name: 'Emergency Preparedness', ...emergency, weight: WEIGHTS.emergency },
    { key: 'insurance', name: 'Insurance Coverage', ...insurance, weight: WEIGHTS.insurance },
    { key: 'investments', name: 'Investment Diversification', ...investments, weight: WEIGHTS.investments },
    { key: 'debt', name: 'Debt Health', ...debt, weight: WEIGHTS.debt },
    { key: 'tax', name: 'Tax Efficiency', ...tax, weight: WEIGHTS.tax },
    { key: 'retirement', name: 'Retirement Readiness', ...retirement, weight: WEIGHTS.retirement },
  ];

  const totalScore = Math.round(
    dimensions.reduce((sum, d) => sum + (d.score * d.weight / 100), 0)
  );

  // Top priority action — human, not robotic
  const worstDimension = dimensions.reduce((worst, d) => d.score < worst.score ? d : worst, dimensions[0]);

  return {
    totalScore: clamp(totalScore),
    dimensions,
    topPriority: `If you change one thing this month, make it ${worstDimension.name.toLowerCase()}: ${worstDimension.insight}`,
  };
}
