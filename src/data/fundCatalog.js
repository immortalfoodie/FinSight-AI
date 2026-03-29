export const CATEGORY_BENCHMARK_RETURNS = {
  'Large Cap': 0.11,
  'Mid Cap': 0.13,
  'Small Cap': 0.14,
  'Flexi Cap': 0.12,
  Debt: 0.07,
  Hybrid: 0.095,
  Index: 0.11,
};

export const FUND_CATALOG = {
  'Parag Parikh Flexi Cap Fund': {
    category: 'Flexi Cap',
    expenseRatio: 0.79,
    topHoldings: ['HDFC Bank', 'ICICI Bank', 'Bajaj Holdings', 'ITC', 'Power Grid'],
  },
  'Mirae Asset Emerging Bluechip Fund': {
    category: 'Large Cap',
    expenseRatio: 0.56,
    topHoldings: ['HDFC Bank', 'Reliance Industries', 'ICICI Bank', 'Infosys', 'L&T'],
  },
  'SBI Small Cap Fund': {
    category: 'Small Cap',
    expenseRatio: 0.72,
    topHoldings: ['Multi Commodity Exchange', 'Elgi Equipments', 'Kirloskar Brothers', 'Carborundum Universal', 'Astra Microwave'],
  },
  'HDFC Mid-Cap Opportunities Fund': {
    category: 'Mid Cap',
    expenseRatio: 0.82,
    topHoldings: ['Max Healthcare', 'Aurobindo Pharma', 'Sundaram Finance', 'Cummins India', 'Indian Hotels'],
  },
  'UTI Nifty 50 Index Fund': {
    category: 'Index',
    expenseRatio: 0.2,
    topHoldings: ['Reliance Industries', 'HDFC Bank', 'ICICI Bank', 'Infosys', 'TCS'],
  },
};

export function inferCategoryFromName(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('small cap')) return 'Small Cap';
  if (n.includes('midcap') || n.includes('mid cap')) return 'Mid Cap';
  if (n.includes('large cap') || n.includes('bluechip')) return 'Large Cap';
  if (n.includes('index') || n.includes('nifty') || n.includes('sensex')) return 'Index';
  if (n.includes('debt') || n.includes('bond') || n.includes('gilt') || n.includes('money market')) return 'Debt';
  if (n.includes('hybrid') || n.includes('balanced')) return 'Hybrid';
  return 'Flexi Cap';
}

export function getFundMeta(name) {
  return FUND_CATALOG[name] || null;
}
