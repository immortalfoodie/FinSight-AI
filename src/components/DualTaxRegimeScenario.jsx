import React from 'react';
import { Scale, ArrowRight, AlertCircle } from 'lucide-react';

const fmtINR = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;

/**
 * Edge-case narrative: when old vs new regimes conflict — uses live tax result when provided.
 */
export default function DualTaxRegimeScenario({ result, className = '' }) {
  const hasData = result && result.oldRegime && result.newRegime;

  const recommended = hasData ? result.recommended : 'New Regime';
  const oldTax = hasData ? result.oldRegime.totalTax : 425000;
  const newTax = hasData ? result.newRegime.totalTax : 398000;
  const savings = hasData ? result.savings : Math.abs(oldTax - newTax);
  const oldDed = hasData ? result.oldRegime.deductions : 400000;
  const breakdown = hasData ? result.oldRegime.breakdown : null;

  const whyBetter = !hasData
    ? 'Illustrative: high deductions (HRA + 80C + 80D) vs simpler new-regime slabs — the winner depends on your actual proofs and income mix.'
    : result.structured?.reasoning?.[0]
      ? result.structured.reasoning[0]
      : recommended === 'New Regime'
        ? 'Lower gross tax under new slabs + standard deduction (₹75,000) outweighs the value of itemized deductions in your case after rebate and cess.'
        : 'HRA, 80C, 80D, and other documented deductions reduce taxable income enough that old-regime slabs beat the new-regime path.';

  const tradeoffs =
    result?.structured?.explainability?.tradeoffs ||
    'Old regime: more record-keeping, potentially higher savings if deductions are real. New regime: fewer levers, cleaner filing, better when deductions are low.';

  return (
    <section className={`dual-regime-scenario glass-panel ${className}`.trim()} aria-labelledby="dual-regime-heading">
      <div className="dual-regime-scenario__banner">
        <Scale size={20} color="var(--accent-gold)" aria-hidden />
        <div>
          <p className="section-eyebrow" style={{ marginBottom: '0.25rem' }}>
            Edge case
          </p>
          <h3 id="dual-regime-heading" className="dual-regime-scenario__title">
            Dual tax regime conflict
          </h3>
          <p className="dual-regime-scenario__lede">
            When both regimes are viable, we compare liability, deduction value, and filing complexity — then recommend the path with
            lower tax for your inputs (illustrative).
          </p>
        </div>
      </div>

      <div className="dual-regime-scenario__compare">
        <div className={`dual-regime-card ${recommended === 'Old Regime' ? 'dual-regime-card--pick' : ''}`}>
          <span className="dual-regime-card__label">Old regime</span>
          <p className="dual-regime-card__tax">{fmtINR(oldTax)}</p>
          <p className="dual-regime-card__meta">Tax incl. cess · taxable after deductions</p>
          <div className="dual-regime-benefits">
            <p className="dual-regime-benefits__title">Deduction benefits</p>
            {breakdown ? (
              <ul>
                {Object.entries(breakdown).map(([k, v]) => (
                  <li key={k}>
                    <span>{k}</span>
                    <span>{fmtINR(v)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul>
                <li>
                  <span>Std deduction</span>
                  <span>{fmtINR(50000)}</span>
                </li>
                <li>
                  <span>80C + 80D + HRA (illustrative)</span>
                  <span>{fmtINR(375000)}</span>
                </li>
              </ul>
            )}
            <p className="dual-regime-benefits__foot">Total deductions claimed (old path): {fmtINR(oldDed)}</p>
          </div>
        </div>

        <div className="dual-regime-vs" aria-hidden>
          <ArrowRight size={22} />
        </div>

        <div className={`dual-regime-card ${recommended === 'New Regime' ? 'dual-regime-card--pick' : ''}`}>
          <span className="dual-regime-card__label">New regime</span>
          <p className="dual-regime-card__tax dual-regime-card__tax--accent">{fmtINR(newTax)}</p>
          <p className="dual-regime-card__meta">Std deduction ₹75,000 · no 80C/80D/HRA</p>
          <div className="dual-regime-benefits">
            <p className="dual-regime-benefits__title">Deduction benefits</p>
            <p className="dual-regime-benefits__muted">
              Itemized deductions (80C, 80D, HRA, etc.) are not available; benefit is from wider zero/low-rate bands and rebate u/s 87A
              where applicable.
            </p>
          </div>
        </div>
      </div>

      <div className="dual-regime-scenario__verdict">
        <div className="dual-regime-verdict__main">
          <p className="dual-regime-verdict__label">Final recommendation</p>
          <p className="dual-regime-verdict__rec">
            Prefer <strong>{recommended}</strong>
            {savings > 0 && (
              <>
                {' '}
                — estimated <strong>{fmtINR(savings)}</strong> lower tax vs the alternate regime for this scenario.
              </>
            )}
          </p>
        </div>
        <div className="dual-regime-verdict__why">
          <p className="dual-regime-verdict__h">Why one is better</p>
          <p>{whyBetter}</p>
        </div>
        <div className="dual-regime-verdict__trade">
          <p className="dual-regime-verdict__h">Trade-offs</p>
          <p>{tradeoffs}</p>
        </div>
      </div>

      <div className="dual-regime-scenario__note" role="note">
        <AlertCircle size={16} aria-hidden />
        <span>
          Borderline cases (similar tax in both regimes) should be validated with Form 16 and a CA — rebates, perquisites, and capital
          gains can change the outcome.
        </span>
      </div>
    </section>
  );
}
