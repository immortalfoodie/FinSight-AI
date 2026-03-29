import React from 'react';
import { Activity, PiggyBank, TrendingUp, Landmark, Sparkles } from 'lucide-react';

const fmtCr = (v) => {
  if (v == null || Number.isNaN(v)) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};

const fmtINR = (v) => (v == null ? '—' : `₹${Math.round(v).toLocaleString('en-IN')}`);

/**
 * Session financial snapshot — aggregates metrics from tools used this session
 */
export default function FinancialSnapshot({ snapshot, progressCount, totalAreas = 6 }) {
  const {
    healthDelta,
    lastHealth,
    taxSavedAnnual,
    retirementShiftYears,
    netWorthAtRetirement,
  } = snapshot;

  const healthLabel =
    lastHealth == null
      ? '—'
      : healthDelta === 0 || healthDelta == null
        ? `${lastHealth}/100 · session baseline`
        : `${healthDelta > 0 ? '+' : ''}${healthDelta} pts vs session start (${lastHealth}/100)`;

  const taxLabel = taxSavedAnnual != null ? `${fmtINR(taxSavedAnnual)}/yr` : 'Run Tax Wizard';

  const retireLabel =
    retirementShiftYears != null
      ? retirementShiftYears > 0
        ? `Up to ${retirementShiftYears} yrs earlier`
        : retirementShiftYears === 0
          ? 'Aligned with target age'
          : `Add ${Math.abs(retirementShiftYears)} yrs horizon`
      : 'Run FIRE Path';

  const nwLabel = netWorthAtRetirement != null ? fmtCr(netWorthAtRetirement) : 'Run FIRE Path';

  const cards = [
    {
      icon: Activity,
      label: 'Health trajectory',
      value: healthLabel,
      sub: 'Money Health Score movement',
      accent: 'var(--accent-emerald)',
    },
    {
      icon: PiggyBank,
      label: 'Tax headroom',
      value: taxLabel,
      sub: 'Regime delta (illustrative)',
      accent: 'var(--accent-gold)',
    },
    {
      icon: TrendingUp,
      label: 'Retirement flexibility',
      value: retireLabel,
      sub: 'Min. feasible age vs your target',
      accent: '#818cf8',
    },
    {
      icon: Landmark,
      label: 'Corpus at retirement',
      value: nwLabel,
      sub: 'Projected at your last FIRE run',
      accent: 'var(--success)',
    },
  ];

  return (
    <section className="financial-snapshot premium-glow animate-fade-in" style={{ marginBottom: '0.25rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} color="var(--accent-gold)" />
          <h2 style={{ margin: 0 }}>Financial snapshot</h2>
        </div>
        <div
          className="snapshot-progress-pill font-mono-nums"
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            background: 'rgba(245, 176, 65, 0.12)',
            border: '1px solid rgba(245, 176, 65, 0.35)',
            color: 'var(--accent-gold-light)',
            boxShadow: '0 0 24px rgba(245, 176, 65, 0.08)',
          }}
        >
          Progress: {progressCount}/{totalAreas} areas engaged
        </div>
      </div>

      <div
        className="snapshot-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
        }}
      >
        {cards.map((c, i) => (
          <div
            key={c.label}
            className="glass-panel snapshot-card hover-lift"
            style={{
              padding: '1.15rem 1.2rem',
              borderTop: `2px solid ${c.accent}`,
              animation: `fadeSlideUp 0.5s ease ${i * 0.06}s both`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <c.icon size={18} color={c.accent} style={{ opacity: 0.95 }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {c.label}
              </span>
            </div>
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f3f4f6', lineHeight: 1.35, marginBottom: '0.35rem', fontVariantNumeric: 'tabular-nums' }}>
              {c.value}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>{c.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
