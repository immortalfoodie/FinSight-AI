// ============================================================
// Future story — milestone ages from FIRE trajectory (lakhs)
// ============================================================

import { computeFirePlan } from './fireEngine.js';

const LAKH = 100000;

/**
 * @returns {{ milestones: Array<{ age: number, year: number, label: string, amount: number, highlight?: string }>, narrative: string }}
 */
export function getFutureStory(profile) {
  const plan = computeFirePlan({
    currentAge: profile.currentAge,
    retirementAge: profile.retirementAge,
    monthlyIncome: profile.monthlyIncome,
    monthlyExpenses: profile.monthlyExpenses,
    existingCorpus: profile.existingCorpus || 0,
    expectedReturn: 0.12,
    inflationRate: 0.06,
    sipStepUp: 0.1,
  });

  if (plan.error) {
    return { milestones: [], narrative: 'Add income and expenses to unlock your wealth timeline.', plan: null };
  }

  const tr = plan.trajectory || [];
  const findFirst = (minLakhs) => {
    const row = tr.find((t) => t.corpus >= minLakhs);
    return row || null;
  };

  const m25 = findFirst(25);
  const m100 = findFirst(100);
  const fireAge = profile.retirementAge;
  const fireRow = tr[tr.length - 1];

  const milestones = [];

  if (m25) {
    milestones.push({
      age: m25.age,
      year: m25.year,
      label: '₹25L milestone',
      amount: 25 * LAKH,
      highlight: 'Liquidity buffer + early compounding mass',
    });
  }
  if (m100) {
    milestones.push({
      age: m100.age,
      year: m100.year,
      label: '₹1 Cr milestone',
      amount: 100 * LAKH,
      highlight: 'Psychological & portfolio gravity shift',
    });
  }
  milestones.push({
    age: fireAge,
    year: fireRow?.year || new Date().getFullYear() + (fireAge - profile.currentAge),
    label: 'FIRE target age',
    amount: plan.targetCorpus,
    highlight: plan.surplusOrDeficit >= 0 ? 'On track at current plan' : 'Close the gap with SIP or horizon',
  });

  const narrative = `From age ${profile.currentAge} to ${fireAge}, your plan connects short-term discipline to a ${(plan.targetCorpus / 1e7).toFixed(1)} Cr retirement corpus (nominal math, not a promise).`;

  return { milestones, narrative, plan };
}
