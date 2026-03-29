import React from 'react';
import { Scale, Landmark, PieChart, ListChecks } from 'lucide-react';

const OLD_SLAB_ROWS = [
  { range: 'Up to ₹2.5L', rate: 'Nil' },
  { range: '₹2.5L – ₹5L', rate: '5%' },
  { range: '₹5L – ₹10L', rate: '20%' },
  { range: 'Above ₹10L', rate: '30%' },
];

const NEW_SLAB_ROWS = [
  { range: 'Up to ₹4L', rate: 'Nil' },
  { range: '₹4L – ₹8L', rate: '5%' },
  { range: '₹8L – ₹12L', rate: '10%' },
  { range: '₹12L – ₹16L', rate: '15%' },
  { range: '₹16L – ₹20L', rate: '20%' },
  { range: '₹20L – ₹24L', rate: '25%' },
  { range: 'Above ₹24L', rate: '30%' },
];

const DEDUCTIONS = [
  { code: '80C', cap: '₹1,50,000', note: 'EPF, PPF, ELSS, life insurance principal, tuition fees (conditions apply).' },
  { code: '80D', cap: '₹25,000 – ₹1,00,000', note: 'Medical insurance (self/family/parents; higher cap for senior parents).' },
  { code: '80CCD(1B)', cap: '₹50,000', note: 'Additional NPS contribution over 80C limit.' },
  { code: '80TTA / 80TTB', cap: '₹10,000 / ₹50,000', note: 'Savings interest; senior citizens get higher TTB limit.' },
  { code: 'Sec 24(b)', cap: '₹2,00,000', note: 'Home loan interest for self-occupied property (conditions apply).' },
];

const DIVERSIFICATION = [
  'Across asset classes (equity, debt, gold/alternatives) aligned to horizon and risk tolerance — not concentrated in one fund or stock.',
  'Within equity: mix of large/mid/small caps or diversified index funds to reduce single-segment risk.',
  'Rebalance on a schedule or bands; tax-aware switches where applicable (consult a CA for specifics).',
];

/**
 * Transparent view of rules the engine applies — compliance & domain awareness for demos.
 */
export default function RegulatoryRulesPanel({ compact = false, className = '' }) {
  return (
    <section className={`regulatory-panel ${compact ? 'regulatory-panel--compact' : ''} ${className}`.trim()} aria-labelledby="regulatory-heading">
      <div className="regulatory-panel__header">
        <Scale size={18} color="var(--accent-gold)" aria-hidden />
        <div>
          <h3 id="regulatory-heading" className="regulatory-panel__title">
            Regulatory rules applied
          </h3>
          <p className="regulatory-panel__sub">FY 2025–26 illustrative slabs &amp; caps — confirm against current notifications and your CA.</p>
        </div>
      </div>

      <div className="regulatory-panel__grid">
        <div className="regulatory-card">
          <div className="regulatory-card__head">
            <Landmark size={16} aria-hidden />
            <span>Tax slabs used</span>
          </div>
          <div className="regulatory-split">
            <div>
              <p className="regulatory-card__eyebrow">Old regime</p>
              <table className="regulatory-table">
                <tbody>
                  {OLD_SLAB_ROWS.map((row) => (
                    <tr key={row.range}>
                      <td>{row.range}</td>
                      <td>{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p className="regulatory-card__eyebrow">New regime</p>
              <table className="regulatory-table">
                <tbody>
                  {(compact ? NEW_SLAB_ROWS.slice(0, 4) : NEW_SLAB_ROWS).map((row) => (
                    <tr key={row.range}>
                      <td>{row.range}</td>
                      <td>{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="regulatory-card">
          <div className="regulatory-card__head">
            <ListChecks size={16} aria-hidden />
            <span>Deduction rules</span>
          </div>
          <ul className="regulatory-list">
            {DEDUCTIONS.map((d) => (
              <li key={d.code}>
                <strong>
                  {d.code} <span className="regulatory-cap">(cap {d.cap})</span>
                </strong>
                <span>{d.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="regulatory-card regulatory-card--wide">
          <div className="regulatory-card__head">
            <PieChart size={16} aria-hidden />
            <span>Investment diversification guidelines</span>
          </div>
          <ul className="regulatory-list regulatory-list--plain">
            {DIVERSIFICATION.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
