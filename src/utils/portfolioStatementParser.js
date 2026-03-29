import { getFundMeta, inferCategoryFromName } from '../data/fundCatalog.js';

function splitCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function normalizeHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseNum(v) {
  const n = Number(String(v || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}



function buildHeaderMap(headers) {
  const map = {};
  headers.forEach((h, i) => {
    map[normalizeHeader(h)] = i;
  });
  return map;
}

function resolveFieldMap(indexMap) {
  const find = (...candidates) => {
    for (const c of candidates) {
      if (indexMap[c] != null) return c;
    }
    return null;
  };

  return {
    fund: find('scheme name', 'scheme', 'fund name', 'security name', 'isin description', 'name'),
    current: find('current value', 'market value', 'valuation amount', 'nav value', 'value'),
    invested: find('invested amount', 'purchase value', 'cost value', 'total invested', 'amount invested', 'invested'),
    category: find('category', 'asset class', 'scheme category'),
    startDate: find('transaction date', 'purchase date', 'start date', 'date'),
    expenseRatio: find('expense ratio', 'ter'),
  };
}

export function parsePortfolioStatementText(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { holdings: [], warnings: ['Statement has insufficient rows.'], parsedRows: 0 };
  }

  const headers = splitCsvLine(lines[0]);
  const indexMap = buildHeaderMap(headers);
  const resolved = resolveFieldMap(indexMap);

  if (!resolved.fund || !resolved.current || !resolved.invested) {
    return {
      holdings: [],
      warnings: ['Could not find required columns (fund name, current value, invested amount).'],
      parsedRows: 0,
    };
  }

  const resolvedToIndex = Object.fromEntries(Object.entries(resolved).filter(([, v]) => v).map(([k, v]) => [k, indexMap[v]]));
  const aggregate = new Map();

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const name = String(cells[resolvedToIndex.fund] || '').trim();
    if (!name) continue;

    const current = parseNum(cells[resolvedToIndex.current]);
    const invested = parseNum(cells[resolvedToIndex.invested]);
    if (current <= 0 && invested <= 0) continue;

    const meta = getFundMeta(name);
    const categoryText = resolvedToIndex.category != null ? String(cells[resolvedToIndex.category] || '').trim() : '';
    const category = categoryText || meta?.category || inferCategoryFromName(name);
    const startDateRaw = resolvedToIndex.startDate != null ? String(cells[resolvedToIndex.startDate] || '').trim() : '';
    const parsedDate = Date.parse(startDateRaw);
    const startDate = Number.isNaN(parsedDate) ? new Date().toISOString().slice(0, 10) : new Date(parsedDate).toISOString().slice(0, 10);
    const expenseRatio = resolvedToIndex.expenseRatio != null
      ? parseNum(cells[resolvedToIndex.expenseRatio]) || meta?.expenseRatio || 1
      : meta?.expenseRatio || 1;

    const prev = aggregate.get(name) || {
      name,
      category,
      value: 0,
      investedValue: 0,
      startDate,
      expenseRatio,
      topHoldings: meta?.topHoldings || [],
    };

    prev.value += current;
    prev.investedValue += invested;
    aggregate.set(name, prev);
  }

  return {
    holdings: Array.from(aggregate.values()).map((h) => ({
      ...h,
      value: Math.round(h.value),
      investedValue: Math.round(h.investedValue),
    })),
    warnings: [],
    parsedRows: lines.length - 1,
  };
}

export async function parsePortfolioStatementFile(file) {
  if (!file) return { holdings: [], warnings: ['No file selected.'], parsedRows: 0 };
  const text = await file.text();
  return parsePortfolioStatementText(text);
}
