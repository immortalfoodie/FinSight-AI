/**
 * Format a numeric string/number with Indian-style commas: 1400000 → 14,00,000
 * Returns empty string for empty/null input.
 */
export function formatIndian(val) {
  const s = String(val).replace(/[^0-9]/g, '');
  if (!s) return '';
  const n = s.replace(/^0+(?=\d)/, '');
  if (n.length <= 3) return n;
  const last3 = n.slice(-3);
  const rest = n.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return grouped + ',' + last3;
}

/** Strip commas/₹/spaces and return raw digit string. Returns '' for empty input. */
export function stripFormatting(val) {
  return String(val).replace(/[₹,\s]/g, '');
}
