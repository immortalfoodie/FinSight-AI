import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Ensure pdf.js worker resolves correctly in Vite/browser builds.
if (!GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
}

/* ────────────────────────────────────────────────────────────
   Amount helpers
   ──────────────────────────────────────────────────────────── */

function parseAmount(token) {
  if (!token) return null;
  const cleaned = String(token)
    .replace(/\s+/g, '')
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const n = Math.round(parseFloat(cleaned));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function extractAllAmounts(text) {
  const tokens = String(text || '').match(/\d[\d,]*(?:\.\d+)?/g) || [];
  return tokens
    .filter((raw) => !/^(19|20)\d{2}$/.test(raw))       // skip years
    .filter((raw) => !/^\d{2}$/.test(raw.replace(/,/g, ''))) // skip 2-digit refs like "17"
    .map((t) => parseAmount(t))
    .filter((n) => Number.isFinite(n) && n >= 100);
}

/**
 * From a snippet, pick the FIRST amount ≥ minAmount.
 * Previous code used Math.max which grabbed unrelated large numbers
 * from neighboring table rows.  First-occurrence is far more accurate
 * for Form 16 because the amount for a row appears closest to the label.
 */
function pickFirstAmountFromSnippet(snippet, minAmount = 100) {
  const values = extractAllAmounts(snippet);
  if (!values.length) return null;
  return values.find((v) => v >= minAmount) ?? null;
}

/**
 * From a snippet, pick the LAST amount ≥ minAmount.
 * Useful for "Total" rows where the total appears at the end of the line
 * (rightmost column in a table).
 */
function pickLastAmountFromSnippet(snippet, minAmount = 100) {
  const values = extractAllAmounts(snippet);
  if (!values.length) return null;
  const filtered = values.filter((v) => v >= minAmount);
  return filtered.length ? filtered[filtered.length - 1] : null;
}

/* ────────────────────────────────────────────────────────────
   Line-based keyword lookup (for table-style PDFs).
   Looks at the matching line + a small window after it,
   and picks the FIRST value (closest to the label).
   ──────────────────────────────────────────────────────────── */

function canonicalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pickAmountByLineKeywords(rawText, keywords, { minAmount = 100, pickStrategy = 'first', windowLines = 3 } = {}) {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const canonKeywords = keywords.map(canonicalize);
  for (let i = 0; i < lines.length; i += 1) {
    const ll = canonicalize(lines[i]);
    if (!canonKeywords.some((k) => ll.includes(k))) continue;
    const window = lines.slice(i, i + windowLines + 1).join(' ');
    const picker = pickStrategy === 'last' ? pickLastAmountFromSnippet : pickFirstAmountFromSnippet;
    const amt = picker(window, minAmount);
    if (amt != null) return amt;
  }
  return null;
}

/* ────────────────────────────────────────────────────────────
   Pattern-based extraction – now picks FIRST amount in the
   matched region rather than max, to avoid grabbing values
   from adjacent table rows.
   ──────────────────────────────────────────────────────────── */

function pickFromPatterns(text, patterns, { pickStrategy = 'first' } = {}) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      // If regex has a capture group with a direct numeric value, try that first
      if (m.length > 1 && m[m.length - 1]) {
        const directAmt = parseAmount(m[m.length - 1]);
        if (directAmt != null && directAmt >= 100) return directAmt;
      }
      // Otherwise extract from the full match snippet
      const snippet = m[0];
      const picker = pickStrategy === 'last' ? pickLastAmountFromSnippet : pickFirstAmountFromSnippet;
      const amt = picker(snippet, 100);
      if (amt != null) return amt;
    }
  }
  return null;
}

/* ────────────────────────────────────────────────────────────
   Field pattern definitions – carefully structured so that
   gross-salary patterns do NOT steal basicSalary values.

   Key Form 16 Part B structure:
   1. Gross Salary
      (a) Salary as per section 17(1) → this is BASIC SALARY
      (b) Value of perquisites u/s 17(2)
      (c) Profits in lieu u/s 17(3)
      (d) Total → this is GROSS SALARY
   ──────────────────────────────────────────────────────────── */

const FIELD_PATTERNS = {
  // Gross Salary = Total of 17(1)+17(2)+17(3) = row (d) under "Gross Salary"
  // NOT the same as section 17(1) which is basic salary.
  grossSalary: [
    /gross\s*(annual\s*)?salary[^(\d]*?(\d[\d,]*(?:\.\d+)?)/i,   // "Gross Salary ... 151000"
    /gross\s*total\s*income[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
  ],
  grossTotalIncome: [
    /gross\s*total\s*income\s*\(6\+8\)[\s\S]{0,80}/i,
  ],
  taxableIncome: [
    /total\s*taxable\s*income\s*\(9-11\)[\s\S]{0,80}/i,
    /income\s*chargeable\s*under\s*the\s*head\s*["']?salaries["']?[\s\S]{0,80}/i,
  ],
  // Basic Salary = section 17(1) value
  basicSalary: [
    /basic\s*salary[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
    /basic\s*pay[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
    /salary\s*as\s*per\s*provisions\s*contained\s*in\s*section\s*17\s*\(\s*1\s*\)[\s\S]{0,80}/i,
    /section\s*17\s*\(\s*1\s*\)[^(\d]{0,40}(\d[\d,]*(?:\.\d+)?)/i,
  ],
  hraReceived: [
    /house\s*rent\s*allowance[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
    /hra\s*received[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
    /allowance\s*for\s*house\s*rent[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
    /house\s*rent\s*allowance\s*under\s*section\s*10\(13a\)[\s\S]{0,80}/i,
  ],
  rentPaid: [
    /rent\s*paid[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
  ],
  section80C: [
    /80c[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
    /deduction\s*in\s*respect\s*of\s*life\s*insurance\s*premia[\s\S]{0,80}/i,
    /total\s*deduction\s*under\s*section\s*80c[\s\S]{0,80}/i,
  ],
  section80D: [
    /80d[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
    /health\s*insurance\s*premia\s*under\s*section\s*80d[\s\S]{0,80}/i,
  ],
  section80CCD_1B: [
    /80ccd\s*\(\s*1b\s*\)[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
    /nps[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
  ],
  section80TTA: [
    /80tta[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
    /interest\s*on\s*deposits\s*in\s*savings\s*account\s*under\s*section\s*80tta[\s\S]{0,80}/i,
  ],
  homeLoanInterest: [
    /section\s*24[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
    /home\s*loan\s*interest[^(\d]{0,30}(\d[\d,]*(?:\.\d+)?)/i,
  ],
};

/* ────────────────────────────────────────────────────────────
   Structured table parser for Form 16 Part B.
   Many Form 16s render as tables where values occupy cells
   on the same line or immediately after the label.
   This parser specifically targets the official TRACES format.
   ──────────────────────────────────────────────────────────── */

function parseForm16TableStructure(rawText) {
  const fields = {};
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Build one big searchable string per line for convenience
  const fullText = lines.join('\n');
  const fullLower = fullText.toLowerCase();

  // --- BASIC SALARY: section 17(1) ---
  // The row "Salary as per provisions contained in section 17(1)" has the basic salary.
  const basic = pickAmountByLineKeywords(rawText, [
    'salary as per provisions contained in section 17(1)',
    'salary as per provisions contained in section 17 (1)',
    'provisions contained in section 17(1)',
    'section 17(1)',
  ], { minAmount: 100, pickStrategy: 'first' });
  if (basic) fields.basicSalary = basic;

  // --- GROSS SALARY TOTAL: row (d) "Total" under Gross Salary heading ---
  // Strategy: Look for a line with just "Total" or "(d) Total" that appears 
  // after the gross salary heading and before row (e).
  // The gross salary total is typically in the rightmost column.
  const grossIdx = fullLower.indexOf('gross salary');
  const detailsIdx = fullLower.indexOf('details of salary paid');
  const startIdx = Math.max(grossIdx, detailsIdx);

  if (startIdx >= 0) {
    // Find "Total" row between gross salary heading and section 2/allowances
    const afterGross = fullText.substring(startIdx);
    const afterLines = afterGross.split('\n');
    
    for (let i = 0; i < Math.min(afterLines.length, 15); i++) {
      const line = afterLines[i];
      const lineCanon = canonicalize(line);
      
      // Match "(d) Total" or just "Total" row robustly without space issues
      if (lineCanon.startsWith('dtotal') || 
          (lineCanon === 'total' && i > 0 && i < 12)) {
        // Pick the LAST amount on THIS line (rightmost column = total)
        // Do NOT slice to next line, otherwise we pick up "other employers"
        const amt = pickLastAmountFromSnippet(line, 1000);
        if (amt) {
          fields.grossSalary = amt;
          break;
        }
      }
    }
  }

  // If we didn't find gross via the Total row, try the "reported total" or
  // sum up basic + perquisites + profits
  if (!fields.grossSalary) {
    const reported = pickAmountByLineKeywords(rawText, [
      'reported total amount of salary received from current employer',
      'total amount of salary received from current employer',
    ], { minAmount: 1000, pickStrategy: 'first' });
    // Only use "reported total" if it seems reasonable
    if (reported) {
      fields.grossSalary = reported;
    }
  }

  // --- PERQUISITES: section 17(2) ---
  const perquisites = pickAmountByLineKeywords(rawText, [
    'perquisites under section 17(2)',
    'perquisites under section 17 (2)',
    'value of perquisites',
    'section 17(2)',
  ], { minAmount: 100, pickStrategy: 'first' });
  if (perquisites) fields.perquisites = perquisites;

  // --- PROFITS IN LIEU: section 17(3) ---
  const profitsInLieu = pickAmountByLineKeywords(rawText, [
    'profits in lieu of salary under section 17(3)',
    'profits in lieu of salary under section 17 (3)',
    'profits in lieu',
    'section 17(3)',
  ], { minAmount: 100, pickStrategy: 'first' });
  if (profitsInLieu) fields.profitsInLieu = profitsInLieu;

  // --- If we found basic but not gross, compute gross = basic + perquisites + profits ---
  if (!fields.grossSalary && fields.basicSalary) {
    fields.grossSalary = (fields.basicSalary || 0) + (fields.perquisites || 0) + (fields.profitsInLieu || 0);
  }

  // --- HRA ---
  const hra = pickAmountByLineKeywords(rawText, [
    'house rent allowance under section 10(13a)',
    'house rent allowance under section 10 (13a)',
    'house rent allowance',
    'hra received',
  ], { minAmount: 100, pickStrategy: 'first' });
  if (hra) fields.hraReceived = hra;

  // --- Section 80C ---
  const s80c = pickAmountByLineKeywords(rawText, [
    'total deduction under section 80c',
    'deduction in respect of life insurance premia',
    'section 80c',
  ], { minAmount: 100, pickStrategy: 'first' });
  if (s80c) fields.section80C = s80c;

  // --- Section 80D ---
  const s80d = pickAmountByLineKeywords(rawText, [
    'health insurance premia under section 80d',
    'section 80d',
  ], { minAmount: 100, pickStrategy: 'first' });
  if (s80d) fields.section80D = s80d;

  // --- Standard deduction ---
  const stdDeduction = pickAmountByLineKeywords(rawText, [
    'standard deduction under section 16(ia)',
    'standard deduction',
  ], { minAmount: 100, pickStrategy: 'first' });
  if (stdDeduction) fields.standardDeduction = stdDeduction;

  // --- Gross total income ---
  const gti = pickAmountByLineKeywords(rawText, [
    'gross total income (6+8)',
    'gross total income',
  ], { minAmount: 1000, pickStrategy: 'last' });
  if (gti) fields.grossTotalIncome = gti;

  // --- Total taxable income ---
  const taxable = pickAmountByLineKeywords(rawText, [
    'total taxable income (9-11)',
    'total taxable income',
    'income chargeable under the head "salaries"',
    "income chargeable under the head 'salaries'",
    'income chargeable under the head salaries',
  ], { minAmount: 1000, pickStrategy: 'last' });
  if (taxable) fields.taxableIncome = taxable;

  // --- 80CCD(1B) / NPS ---
  const ccd1b = pickAmountByLineKeywords(rawText, [
    '80ccd(1b)',
    '80ccd (1b)',
    'nps contribution',
  ], { minAmount: 100, pickStrategy: 'first' });
  if (ccd1b) fields.section80CCD_1B = ccd1b;

  // --- 80TTA ---
  const tta = pickAmountByLineKeywords(rawText, [
    '80tta',
    'interest on deposits in savings account',
  ], { minAmount: 100, pickStrategy: 'first' });
  if (tta) fields.section80TTA = tta;

  // --- Home loan interest / Section 24 ---
  const homeLoan = pickAmountByLineKeywords(rawText, [
    'section 24',
    'home loan interest',
    'interest payable on borrowed capital',
  ], { minAmount: 100, pickStrategy: 'first' });
  if (homeLoan) fields.homeLoanInterest = homeLoan;

  return fields;
}

/* ────────────────────────────────────────────────────────────
   Main text parser – combines pattern-based and table-based.
   ──────────────────────────────────────────────────────────── */

export function parseForm16Text(text) {
  const rawText = String(text || '');
  const normalized = rawText.replace(/\s+/g, ' ').trim();
  const fields = {};
  const matched = [];

  // --- Phase 1: structured table parsing (most reliable for official Form 16) ---
  const tableFields = parseForm16TableStructure(rawText);
  Object.entries(tableFields).forEach(([key, val]) => {
    if (val != null && val > 0) {
      fields[key] = val;
      if (!matched.includes(key)) matched.push(key);
    }
  });

  // --- Phase 2: regex pattern fallback for fields not yet found ---
  Object.entries(FIELD_PATTERNS).forEach(([key, patterns]) => {
    if (fields[key]) return; // already found via table parser
    const amt = pickFromPatterns(normalized, patterns);
    if (amt != null) {
      fields[key] = amt;
      matched.push(key);
    }
  });

  // --- Phase 3: line-keyword fallback for remaining gaps ---
  if (!fields.grossSalary || fields.grossSalary < 1000) {
    const v = pickAmountByLineKeywords(rawText, [
      'gross salary',
      'total amount of salary received from current employer',
      'details of salary paid and any other income',
    ], { minAmount: 1000, pickStrategy: 'last' });
    if (v != null) {
      fields.grossSalary = v;
      if (!matched.includes('grossSalary')) matched.push('grossSalary');
    }
  }

  if (!fields.basicSalary || fields.basicSalary < 100) {
    const v = pickAmountByLineKeywords(rawText, [
      'salary as per provisions contained in section 17(1)',
      'salary as per provisions contained in section 17 (1)',
    ], { minAmount: 100, pickStrategy: 'first' });
    if (v != null) {
      fields.basicSalary = v;
      if (!matched.includes('basicSalary')) matched.push('basicSalary');
    }
  }

  if (!fields.hraReceived || fields.hraReceived < 100) {
    const v = pickAmountByLineKeywords(rawText, [
      'house rent allowance under section 10(13a)',
      'house rent allowance',
    ], { minAmount: 100, pickStrategy: 'first' });
    if (v != null) {
      fields.hraReceived = v;
      if (!matched.includes('hraReceived')) matched.push('hraReceived');
    }
  }

  if (!fields.section80C || fields.section80C < 100) {
    const v = pickAmountByLineKeywords(rawText, [
      'total deduction under section 80c',
      'deduction in respect of life insurance premia',
    ], { minAmount: 100, pickStrategy: 'first' });
    if (v != null) {
      fields.section80C = v;
      if (!matched.includes('section80C')) matched.push('section80C');
    }
  }

  if (!fields.section80D || fields.section80D < 100) {
    const v = pickAmountByLineKeywords(rawText, [
      'health insurance premia under section 80d',
    ], { minAmount: 100, pickStrategy: 'first' });
    if (v != null) {
      fields.section80D = v;
      if (!matched.includes('section80D')) matched.push('section80D');
    }
  }

  if (!fields.grossTotalIncome || fields.grossTotalIncome < 1000) {
    const v = pickAmountByLineKeywords(rawText, [
      'gross total income (6+8)',
      'gross total income',
    ], { minAmount: 1000, pickStrategy: 'last' });
    if (v != null) {
      fields.grossTotalIncome = v;
      if (!matched.includes('grossTotalIncome')) matched.push('grossTotalIncome');
    }
  }

  if (!fields.taxableIncome || fields.taxableIncome < 1000) {
    const v = pickAmountByLineKeywords(rawText, [
      'total taxable income (9-11)',
      'income chargeable under the head "salaries"',
      "income chargeable under the head 'salaries'",
    ], { minAmount: 1000, pickStrategy: 'last' });
    if (v != null) {
      fields.taxableIncome = v;
      if (!matched.includes('taxableIncome')) matched.push('taxableIncome');
    }
  }

  // --- Sanity checks ---
  // Basic salary should never exceed gross salary
  if (fields.basicSalary && fields.grossSalary && fields.basicSalary > fields.grossSalary) {
    // Swap – likely misidentified
    const temp = fields.grossSalary;
    fields.grossSalary = fields.basicSalary;
    fields.basicSalary = temp;
  }

  const confidence = Math.min(95, 25 + matched.length * 8);

  return {
    fields,
    matched,
    confidence,
  };
}

/* ────────────────────────────────────────────────────────────
   PDF text extraction – preserves line structure better
   by using Y-coordinates to detect line breaks.
   ──────────────────────────────────────────────────────────── */

async function readPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const chunks = [];

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group items by their Y coordinate to reconstruct lines.
    // This is critical for table-based PDFs like Form 16.
    const items = content.items.filter((it) => it.str && it.str.trim());
    if (!items.length) continue;

    // Sort by Y descending (top of page first), then X ascending
    items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 3) return yDiff; // different lines
      return a.transform[0] - b.transform[0]; // same line, sort left-to-right
    });

    const lines = [];
    let currentLineY = items[0].transform[5];
    let currentLine = [];

    for (const item of items) {
      const y = item.transform[5];
      // If Y changes significantly, start a new line
      if (Math.abs(y - currentLineY) > 3) {
        if (currentLine.length) lines.push(currentLine.join('  '));
        currentLine = [];
        currentLineY = y;
      }
      currentLine.push(item.str.trim());
    }
    if (currentLine.length) lines.push(currentLine.join('  '));

    chunks.push(lines.join('\n'));
  }

  return chunks.join('\n');
}

async function readPdfOcrText(file, onProgress) {
  const { recognize } = await import('tesseract.js');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const chunks = [];

  for (let i = 1; i <= pdf.numPages; i += 1) {
    if (typeof onProgress === 'function') {
      onProgress({ status: `ocr_pdf_page_${i}`, progress: Math.round(((i - 1) / pdf.numPages) * 100) });
    }

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    await page.render({ canvasContext: ctx, viewport }).promise;

    const result = await recognize(canvas, 'eng', {
      logger: (m) => {
        if (typeof onProgress !== 'function') return;
        if (typeof m?.progress !== 'number') return;
        const base = ((i - 1) / pdf.numPages) * 100;
        const perPage = (m.progress * (100 / pdf.numPages));
        onProgress({
          status: m?.status || 'ocr_processing',
          progress: Math.min(99, Math.round(base + perPage)),
        });
      },
    });

    chunks.push(result?.data?.text || '');
  }

  if (typeof onProgress === 'function') {
    onProgress({ status: 'ocr_complete', progress: 100 });
  }

  return chunks.join('\n');
}

async function readImageTextWithOcr(file, onProgress) {
  const { recognize } = await import('tesseract.js');
  const result = await recognize(file, 'eng', {
    logger: (m) => {
      if (typeof onProgress !== 'function') return;
      const progress = typeof m?.progress === 'number' ? Math.round(m.progress * 100) : null;
      onProgress({
        status: m?.status || 'processing',
        progress,
      });
    },
  });
  return result?.data?.text || '';
}

/* ────────────────────────────────────────────────────────────
   Public API
   ──────────────────────────────────────────────────────────── */

export async function parseForm16File(file, onProgress) {
  if (!file) return { fields: {}, confidence: 0, matched: [] };

  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();

  let text = '';
  let ocrText = '';
  if (type.includes('pdf') || name.endsWith('.pdf')) {
    if (typeof onProgress === 'function') {
      onProgress({ status: 'reading_pdf', progress: null });
    }
    text = await readPdfText(file);

    const parsedFromText = parseForm16Text(text);
    const isLikelyScanned = parsedFromText.matched.length < 2 || text.replace(/\s+/g, '').length < 80;
    if (isLikelyScanned) {
      if (typeof onProgress === 'function') {
        onProgress({ status: 'ocr_start', progress: 0 });
      }
      ocrText = await readPdfOcrText(file, onProgress);
      const parsedFromOcr = parseForm16Text(ocrText);

      const mergedFields = { ...parsedFromText.fields, ...parsedFromOcr.fields };
      const mergedMatched = Array.from(new Set([...(parsedFromText.matched || []), ...(parsedFromOcr.matched || [])]));
      const mergedConfidence = Math.min(95, Math.max(parsedFromText.confidence || 0, parsedFromOcr.confidence || 0) + 8);

      return {
        fields: mergedFields,
        matched: mergedMatched,
        confidence: mergedConfidence,
        sourceType: type || 'unknown',
        preview: (text || ocrText).slice(0, 500),
      };
    }

    return {
      ...parsedFromText,
      sourceType: type || 'unknown',
      preview: text.slice(0, 500),
    };
  } else if (type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff?)$/.test(name)) {
    if (typeof onProgress === 'function') {
      onProgress({ status: 'ocr_start', progress: 0 });
    }
    text = await readImageTextWithOcr(file, onProgress);
  } else {
    if (typeof onProgress === 'function') {
      onProgress({ status: 'reading_text', progress: null });
    }
    text = await file.text();
  }

  const parsed = parseForm16Text(text);
  return {
    ...parsed,
    sourceType: type || 'unknown',
    preview: text.slice(0, 500),
  };
}
