import React, { useState, useCallback, memo } from 'react';
import { Calculator, ArrowRight, TrendingDown, Wallet, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { orchestrate } from '../agents/orchestrator';
import { useAdvisor } from '../context/AdvisorContext';
import ExplainWhy from '../components/ExplainWhy.jsx';
import FieldHint from '../components/FieldHint.jsx';
import { FIELD_HINTS } from '../data/fieldHints.js';
import { formatIndian } from '../utils/formatIndian.js';

const fmtINR = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;

const emptyPartnerDraft = () => ({
  grossSalary: '',
  basicSalary: '',
  hraReceived: '',
  rentPaid: '',
  section80C: '',
  section80D: '',
  section80CCD_1B: '',
  monthlySIP: '',
  existingCorpus: '',
  lifeInsuranceCover: '',
  isMetro: true,
});

const COUPLE_FIELDS = [
  { key: 'grossSalary', label: 'Gross Salary (Annual ₹)', hintKey: 'cpGrossSalary' },
  { key: 'basicSalary', label: 'Basic Salary (Annual ₹)', hintKey: 'cpBasicSalary' },
  { key: 'hraReceived', label: 'HRA Received (Annual ₹)', hintKey: 'cpHraReceived' },
  { key: 'rentPaid', label: 'Rent Paid (Annual ₹)', hintKey: 'cpRentPaid' },
  { key: 'section80C', label: '80C Investments (₹)', hintKey: 'cp80C' },
  { key: 'section80D', label: '80D - Health Insurance (₹)', hintKey: 'cp80D' },
  { key: 'section80CCD_1B', label: 'NPS - 80CCD(1B) (₹)', hintKey: 'cp80CCD' },
  { key: 'monthlySIP', label: 'Monthly SIP (₹)', hintKey: 'cpMonthlySIP' },
  { key: 'existingCorpus', label: 'Existing Corpus (₹)', hintKey: 'cpExistingCorpus' },
  { key: 'lifeInsuranceCover', label: 'Life Insurance Cover (₹)', hintKey: 'cpLifeInsurance' },
];

function parsePartnerDraft(draft) {
  const n = (v) => parseInt(String(v).replace(/[₹,\s]/g, ''), 10) || 0;
  return {
    grossSalary: n(draft.grossSalary),
    basicSalary: n(draft.basicSalary),
    hraReceived: n(draft.hraReceived),
    rentPaid: n(draft.rentPaid),
    isMetro: draft.isMetro,
    section80C: n(draft.section80C),
    section80D: n(draft.section80D),
    section80CCD_1B: n(draft.section80CCD_1B),
    section80TTA: 0,
    homeLoanInterest: 0,
    existingCorpus: n(draft.existingCorpus),
    emergencyFund: 0,
    monthlySIP: n(draft.monthlySIP),
    lifeInsuranceCover: n(draft.lifeInsuranceCover),
  };
}

const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.55rem 0.7rem', color: '#fff', width: '100%', fontFamily: 'inherit', fontSize: '0.85rem' };

const PartnerForm = memo(function PartnerForm({ data, onChange, title, color, onEnterSubmit }) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', borderTop: `3px solid ${color}` }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color }}>{title}</h3>
      <div className="field-label-row" style={{ marginBottom: '0.75rem', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
          <input type="checkbox" checked={data.isMetro} onChange={(e) => onChange('isMetro', e.target.checked)} />
          Metro city (HRA rules)
        </label>
        <FieldHint text={FIELD_HINTS.cpMetro} />
      </div>
      {COUPLE_FIELDS.map((f) => (
        <div key={f.key} style={{ marginBottom: '0.5rem' }}>
          <div className="field-label-row" style={{ marginBottom: '2px' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>{f.label}</label>
            <FieldHint text={FIELD_HINTS[f.hintKey]} />
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={(() => { const v = data[f.key]; return v === '' || v == null ? '' : formatIndian(v); })()}
            onChange={(e) => {
              const v = e.target.value.replace(/[₹,\s]/g, '');
              if (v === '' || /^\d*$/.test(v)) onChange(f.key, v);
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.shiftKey) return;
              e.preventDefault();
              onEnterSubmit();
            }}
            style={inputStyle}
            placeholder="—"
          />
        </div>
      ))}
    </div>
  );
});

const CouplesPlanner = ({ addLog }) => {
  const { addMemory, markAreaOptimized } = useAdvisor();
  const [p1, setP1] = useState(emptyPartnerDraft);
  const [p2, setP2] = useState(emptyPartnerDraft);
  const [result, setResult] = useState(null);
  const [computing, setComputing] = useState(false);

  const updateP1 = useCallback((field, value) => {
    setP1((prev) => ({ ...prev, [field]: value }));
  }, []);
  const updateP2 = useCallback((field, value) => {
    setP2((prev) => ({ ...prev, [field]: value }));
  }, []);

  const compute = () => {
    setComputing(true);
    setTimeout(() => {
      const partner1 = parsePartnerDraft(p1);
      const partner2 = parsePartnerDraft(p2);
      const r = orchestrate('couples_plan', { partner1, partner2 }, addLog);
      setResult(r);
      setComputing(false);
      addMemory('Ran joint couples optimisation (HRA, 80C, NPS).');
      markAreaOptimized('couples');
    }, 500);
  };

  const handleEnterCompute = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const tag = String(e.target?.tagName || '').toLowerCase();
    if (tag === 'textarea') return;
    e.preventDefault();
    compute();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '0.35rem' }}>Couple's Money Planner</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, fontWeight: 400 }}>India's first AI-powered joint financial optimization tool.</p>
        </div>
        <button className="btn btn-primary" onClick={compute} disabled={computing}>
          {computing ? 'Optimizing...' : <><Calculator size={16} /> Optimize Together</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--section-gap-lg)' }}>
        <div onKeyDown={handleEnterCompute}>
          <PartnerForm data={p1} onChange={updateP1} title="Partner 1" color="var(--accent-gold)" onEnterSubmit={compute} />
        </div>
        <div onKeyDown={handleEnterCompute}>
          <PartnerForm data={p2} onChange={updateP2} title="Partner 2" color="#818cf8" onEnterSubmit={compute} />
        </div>
      </div>

      {result && (
        <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {result.structured?.summary && (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.1rem 1.25rem', borderLeft: '3px solid var(--accent-emerald)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-gold)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>SUMMARY</span>
              </div>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.55, color: '#e5e7eb', margin: 0 }}>{result.structured.summary}</p>
              {result.structured.confidence != null && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Confidence: {result.structured.confidence}% — based on completeness of salary inputs.</p>
              )}
            </div>
          )}

          <div className="luxury-card" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Partner 1</p>
              <h3 style={{ color: 'var(--accent-gold)' }}>{fmtINR(result.netWorth.partner1)}</h3>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', padding: '0 2rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Combined Net Worth</p>
              <h3 className="text-gradient" style={{ fontSize: '1.75rem' }}>{fmtINR(result.netWorth.combined)}</h3>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Partner 2</p>
              <h3 style={{ color: '#818cf8' }}>{fmtINR(result.netWorth.partner2)}</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Wallet size={18} color="var(--accent-gold)" />
                <h4 style={{ fontSize: '0.95rem' }}>HRA Optimization</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Optimal claimant: <strong style={{ color: 'var(--accent-gold)' }}>{result.hra.optimalClaimant}</strong>
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>P1 saves: {fmtINR(result.hra.p1HRASaving)} | P2 saves: {fmtINR(result.hra.p2HRASaving)}</p>
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>Max Saving: {fmtINR(result.hra.maxSaving)}</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <TrendingDown size={18} color="#818cf8" />
                <h4 style={{ fontSize: '0.95rem' }}>NPS Gap</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                P1 gap: {fmtINR(result.nps.p1gap)} | P2 gap: {fmtINR(result.nps.p2gap)}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Total missed 80CCD(1B) deduction: {fmtINR(result.nps.totalGap)}
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <ArrowRight size={18} color="var(--success)" />
                <h4 style={{ fontSize: '0.95rem' }}>SIP Split</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Total: {fmtINR(result.sipSplit.totalSIP)}/mo
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{result.sipSplit.recommended}</p>
            </div>
          </div>

          {(result.insuranceGaps.p1LifeGap > 0 || result.insuranceGaps.p2LifeGap > 0) && (
            <div className="glass-panel" style={{ padding: '1.25rem', borderColor: 'rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Heart size={18} color="var(--danger)" />
                <h4 style={{ fontSize: '0.95rem' }}>Insurance Gaps Detected</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {result.insuranceGaps.p1LifeGap > 0 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Partner 1: Needs {fmtINR(result.insuranceGaps.p1LifeGap)} more life cover (target: 15x income).</p>
                )}
                {result.insuranceGaps.p2LifeGap > 0 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Partner 2: Needs {fmtINR(result.insuranceGaps.p2LifeGap)} more life cover (target: 15x income).</p>
                )}
              </div>
            </div>
          )}

          <div style={{ padding: '1rem 1.25rem', background: 'rgba(245,158,11,0.08)', borderRadius: '12px', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={28} color="var(--success)" />
            <div>
              <h4 style={{ color: 'var(--success)' }}>Potential headroom (illustrative)</h4>
              <p className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{fmtINR(result.potentialTaxSaved)}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>Uses simple marginal proxies on gaps — use as a direction, not exact tax.</p>
            </div>
          </div>

          {result.structured?.actionPlan?.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.1rem 1.25rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ACTION STEPS</h4>
              <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', color: '#e5e7eb', lineHeight: 1.6 }}>
                {result.structured.actionPlan.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ol>
            </div>
          )}

          {result.structured && (
            <ExplainWhy
              formula={result.structured.explainability?.formula}
              assumptions={result.structured.assumptions}
              tradeoffs={result.structured.explainability?.tradeoffs}
              extra={
                result.structured.sensitivity?.length ? (
                  <p style={{ marginTop: '0.5rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Sensitivity: </strong>
                    {result.structured.sensitivity.join(' ')}
                  </p>
                ) : null
              }
            />
          )}

          <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
            Joint finances are deeply personal — use this as a conversation starter, not the final word.
          </div>
        </div>
      )}
    </div>
  );
};

export default CouplesPlanner;
