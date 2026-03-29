import React, { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { Target, Play, TrendingUp, Wallet, ShieldCheck, AlertTriangle, Sparkles, Activity, GitBranch, Calculator } from 'lucide-react';
import { useUserProfile } from '../context/UserProfileContext';
import { useAdvisor } from '../context/AdvisorContext';
import { orchestrate } from '../agents/orchestrator';
import { computeFirePlan, validateFireInputs } from '../engine/fireEngine.js';
import { enrichFirePlan } from '../engine/reasoningLayer.js';
import FieldHint from '../components/FieldHint.jsx';
import { FIELD_HINTS } from '../data/fieldHints.js';
import { formatIndian } from '../utils/formatIndian.js';

const parseNum = (v) => {
  if (typeof v === 'number') return v;
  if (v === '' || v == null) return 0;
  return parseInt(String(v).replace(/[₹,\s]/g, ''), 10) || 0;
};

const parsePct = (v) => {
  const n = parseFloat(String(v).replace(/[^\d.]/g, ''));
  if (Number.isNaN(n)) return 0;
  return n;
};

/** Build numeric model from string form (empty → 0). */
function parseFireFormStrings(f) {
  return {
    currentAge: parseNum(f.currentAge),
    retirementAge: parseNum(f.retirementAge),
    monthlyIncome: parseNum(f.monthlyIncome),
    monthlyExpenses: parseNum(f.monthlyExpenses),
    existingCorpus: parseNum(f.existingCorpus),
    expectedReturn: parsePct(f.expectedReturn) || 12,
    inflationRate: parsePct(f.inflationRate) || 6,
    sipStepUp: parsePct(f.sipStepUp) || 10,
  };
}

const fmtCr = (v) => v >= 10000000 ? `₹${(v / 10000000).toFixed(2)} Cr` : `₹${(v / 100000).toFixed(1)} L`;

const FirePlanner = ({ addLog }) => {
  const { profile } = useUserProfile();
  const { addMemory, updateSnapshot, markAreaOptimized } = useAdvisor();
  const [form, setForm] = useState({
    currentAge: profile.currentAge ? String(profile.currentAge) : '',
    retirementAge: profile.retirementAge ? String(profile.retirementAge) : '',
    monthlyIncome: profile.monthlyIncome ? String(profile.monthlyIncome) : '',
    monthlyExpenses: profile.monthlyExpenses ? String(profile.monthlyExpenses) : '',
    existingCorpus: profile.existingCorpus ? String(profile.existingCorpus) : '',
    expectedReturn: '12',
    inflationRate: '6',
    sipStepUp: '10',
  });
  const [result, setResult] = useState(null);
  const [computing, setComputing] = useState(false);

  const [sim, setSim] = useState(null);

  const FIRE_NO_FMT = new Set(['currentAge', 'retirementAge', 'expectedReturn', 'inflationRate', 'sipStepUp']);

  const handleChange = (field, value) => {
    if (['expectedReturn', 'inflationRate', 'sipStepUp'].includes(field)) {
      if (value === '' || /^\d*\.?\d*$/.test(value)) setForm((prev) => ({ ...prev, [field]: value }));
    } else {
      const stripped = String(value).replace(/[₹,\s]/g, '');
      if (stripped === '' || /^\d*$/.test(stripped)) {
        setForm((prev) => ({ ...prev, [field]: stripped }));
      }
    }
  };

  const displayVal = (key) => {
    const raw = form[key];
    if (raw === '' || raw == null) return '';
    if (FIRE_NO_FMT.has(key)) return String(raw);
    return formatIndian(raw);
  };

  const handleEnterGenerate = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const tag = String(e.target?.tagName || '').toLowerCase();
    if (tag === 'textarea') return;
    e.preventDefault();
    generate();
  };

  const buildPayload = useCallback((numeric) => ({
    currentAge: numeric.currentAge,
    retirementAge: numeric.retirementAge,
    monthlyIncome: numeric.monthlyIncome,
    monthlyExpenses: numeric.monthlyExpenses,
    existingCorpus: numeric.existingCorpus,
    emergencyFund: Number(profile.emergencyFund || 0),
    lifeInsuranceCover: Number(profile.lifeInsuranceCover || 0),
    grossSalary: Number(profile.grossSalary || 0),
    section80C: Number(profile.section80C || 0),
    expectedReturn: numeric.expectedReturn / 100,
    inflationRate: numeric.inflationRate / 100,
    sipStepUp: numeric.sipStepUp / 100,
  }), [profile]);

  const generate = () => {
    setComputing(true);
    setTimeout(() => {
      const numeric = parseFireFormStrings(form);
      const payload = buildPayload(numeric);
      const r = orchestrate('fire_plan', payload, addLog);
      setResult(r);
      setSim({
        monthlyIncome: numeric.monthlyIncome,
        retirementAge: numeric.retirementAge,
        monthlyExpenses: numeric.monthlyExpenses,
      });
      setComputing(false);
      addMemory('Modelled FIRE path and required SIP.');
      if (!r.error) {
        updateSnapshot({
          netWorthAtRetirement: r.projectedCorpusAtRetirement,
          retirementShiftYears:
            r.minFeasibleRetirementAge != null
              ? numeric.retirementAge - r.minFeasibleRetirementAge
              : null,
        });
        markAreaOptimized('fire');
      }
    }, 400);
  };

  const whatIfResult = useMemo(() => {
    if (!sim) return null;
    const base = parseFireFormStrings(form);
    const merged = {
      ...base,
      monthlyIncome: sim.monthlyIncome,
      retirementAge: sim.retirementAge,
      monthlyExpenses: sim.monthlyExpenses,
    };
    const payload = buildPayload(merged);
    const errs = validateFireInputs(payload);
    if (errs.length) return { error: errs[0] };
    return enrichFirePlan(computeFirePlan(payload), payload);
  }, [sim, form, buildPayload]);

  const syncWhatIfFromForm = () => {
    const n = parseFireFormStrings(form);
    setSim({
      monthlyIncome: n.monthlyIncome,
      retirementAge: n.retirementAge,
      monthlyExpenses: n.monthlyExpenses,
    });
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
    borderRadius: '6px', padding: '0.65rem 0.75rem', color: '#fff', width: '100%',
    fontFamily: 'inherit', fontSize: '0.9rem',
  };

  const fields = [
    { key: 'currentAge', label: 'Current Age', suffix: 'years', hint: FIELD_HINTS.fireCurrentAge },
    { key: 'retirementAge', label: 'Target Retirement Age', suffix: 'years', hint: FIELD_HINTS.fireRetirementAge },
    { key: 'monthlyIncome', label: 'Monthly Income (₹)', hint: FIELD_HINTS.fireMonthlyIncome },
    { key: 'monthlyExpenses', label: 'Monthly Expenses (₹)', hint: FIELD_HINTS.fireMonthlyExpenses },
    { key: 'existingCorpus', label: 'Existing Corpus (₹)', hint: FIELD_HINTS.fireExistingCorpus },
    { key: 'expectedReturn', label: 'Expected Return (%)', suffix: '%', hint: FIELD_HINTS.fireExpectedReturn },
    { key: 'inflationRate', label: 'Inflation Rate (%)', suffix: '%', hint: FIELD_HINTS.fireInflation },
    { key: 'sipStepUp', label: 'Annual SIP Step-up (%)', suffix: '%', hint: FIELD_HINTS.fireSipStepUp },
  ];

  const nForm = parseFireFormStrings(form);

  const structured = result?.structured;
  const milestones = result && !result.error ? [
    {
      label: 'Emergency fund (6 mo)',
      pct: Math.min(100, ((profile.emergencyFund || 0) / Math.max(1, nForm.monthlyExpenses * 6)) * 100),
      done: (profile.emergencyFund || 0) >= nForm.monthlyExpenses * 6,
    },
    {
      label: 'First ₹1 Cr net worth',
      pct: Math.min(100, ((profile.existingCorpus || 0) / 10000000) * 100),
      done: (profile.existingCorpus || 0) >= 10000000,
    },
    {
      label: 'FIRE corpus vs target',
      pct: Math.min(100, (result.projectedCorpusAtRetirement / Math.max(1, result.targetCorpus)) * 100),
      done: result.surplusOrDeficit >= 0,
    },
  ] : [];

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '0.35rem' }}>FIRE Path Planner</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, fontWeight: 400 }}>Deterministic engine + AI reasoning layer — assumptions, sensitivity, and actions in one view.</p>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={computing}>
          {computing ? 'Computing...' : <><Play size={16} fill="#000" /> Generate Plan</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--section-gap-lg)' }}>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
          <h3 className="card-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Target size={16} color="var(--accent-gold)" /> Your Financial Metrics
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', lineHeight: 1.6 }}>Inputs are validated (4–22% return, 3–12% inflation) before running the SIP solver.</p>
          {fields.map((f) => (
            <div key={f.key}>
              <div className="field-label-row" style={{ marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>{f.label}</label>
                <FieldHint text={f.hint} />
              </div>
              <input
                type="text"
                inputMode={['expectedReturn', 'inflationRate', 'sipStepUp'].includes(f.key) ? 'decimal' : 'numeric'}
                value={displayVal(f.key)}
                onChange={(e) => handleChange(f.key, e.target.value)}
                onKeyDown={handleEnterGenerate}
                style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
                placeholder="—"
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {result && !result.error ? (
            <>
              {structured?.summary && (
                <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderLeft: '3px solid var(--accent-emerald)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Sparkles size={16} color="var(--accent-gold)" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>SUMMARY</span>
                  </div>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.55, color: '#e5e7eb' }}>{structured.summary}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {[
                  { label: 'Required Corpus', value: fmtCr(result.targetCorpus), icon: Target, color: 'var(--accent-gold)' },
                  { label: 'Monthly SIP Needed', value: `₹${result.requiredMonthlySIP.toLocaleString('en-IN')}`, icon: Wallet, color: 'var(--success)' },
                  { label: 'Years to FIRE', value: `${result.yearsToRetire} yrs`, icon: TrendingUp, color: '#818cf8' },
                  { label: 'Confidence', value: `${structured?.confidence ?? '—'}%`, icon: Activity, color: 'var(--accent-emerald)' },
                ].map((c, i) => (
                  <div key={i} className="glass-panel hover-lift" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <c.icon size={16} color={c.color} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: c.color, fontVariantNumeric: 'tabular-nums' }}>{c.value}</div>
                  </div>
                ))}
              </div>

              {result.futureMonthlyExpense != null && (
                <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderLeft: '3px solid rgba(245, 176, 65, 0.5)' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Calculator size={16} color="var(--accent-gold)" /> Why is the FIRE corpus this large?
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: '#d1d5db', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                    The number is <strong>not</strong> “today’s expenses × a small factor.” We first grow your <strong>today’s monthly spend</strong> by{' '}
                    <strong>{nForm.inflationRate.toFixed(1)}% inflation</strong> for <strong>{result.yearsToRetire}</strong> years until age{' '}
                    <strong>{nForm.retirementAge}</strong>, then ask how big a portfolio can safely fund that lifestyle in retirement.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.65 }}>
                    <li>
                      Today’s expenses (your input): <strong style={{ color: '#e5e7eb' }}>₹{nForm.monthlyExpenses.toLocaleString('en-IN')}/mo</strong>
                    </li>
                    <li>
                      Inflated expenses at retirement: <strong style={{ color: '#e5e7eb' }}>₹{result.futureMonthlyExpense.toLocaleString('en-IN')}/mo</strong>
                    </li>
                    <li>
                      Annual need at retirement: <strong style={{ color: '#e5e7eb' }}>₹{(result.futureMonthlyExpense * 12).toLocaleString('en-IN')}</strong>
                    </li>
                    <li>
                      Target corpus ≈ annual need ÷ <strong>{(result.swr * 100).toFixed(1)}%</strong> safe withdrawal (rule-of-thumb):{' '}
                      <strong style={{ color: 'var(--accent-gold)' }}>{fmtCr(result.targetCorpus)}</strong>
                    </li>
                  </ul>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0, lineHeight: 1.5 }}>
                    So even a modest ₹3,000/mo today can become a much larger <em>future</em> monthly need after decades of inflation — that drives a large corpus. Change expenses, retirement age, or inflation to see the target move.
                  </p>
                </div>
              )}

              {structured?.confidence != null && (
                <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Recommendation confidence</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{structured.confidence}%</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${structured.confidence}%`,
                      height: '100%',
                      borderRadius: '6px',
                      background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-emerald))',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Based on savings rate, horizon length, and return assumptions — not a guarantee of outcomes.</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 className="text-gradient" style={{ marginBottom: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <GitBranch size={16} /> Financial journey timeline
                  </h4>
                  {milestones.map((m, i) => (
                    <div key={i} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                        <span style={{ color: m.done ? 'var(--success)' : 'var(--text-secondary)' }}>{m.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{m.done ? 'On track' : 'Building'}</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ width: `${m.pct}%`, height: '100%', borderRadius: '4px', background: m.done ? 'var(--success)' : 'linear-gradient(90deg, var(--accent-gold), rgba(245,176,65,0.4))' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(145deg, rgba(245,176,65,0.06), rgba(0,200,150,0.04))' }}>
                  <h4 style={{ marginBottom: '0.65rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} color="var(--accent-gold)" /> AI insights panel
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', fontWeight: 700 }}>WHY</span>
                      {(structured?.reasoning || []).slice(0, 2).map((t, j) => (
                        <p key={j} style={{ fontSize: '0.82rem', color: '#d1d5db', lineHeight: 1.5, marginTop: '0.25rem' }}>{t}</p>
                      ))}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>IF INPUTS CHANGE</span>
                      {(structured?.sensitivity || []).slice(0, 2).map((t, j) => (
                        <p key={j} style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.45, marginTop: '0.2rem' }}>{t}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {(structured?.warnings?.length > 0 || structured?.followUpQuestions?.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {structured.warnings?.length > 0 && (
                    <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={16} color="var(--danger)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Guardrails</span>
                      </div>
                      {structured.warnings.map((w, i) => <p key={i} style={{ fontSize: '0.8rem', color: '#fca5a5', lineHeight: 1.45 }}>{w}</p>)}
                    </div>
                  )}
                  {structured.followUpQuestions?.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ADAPTIVE FOLLOW-UPS</span>
                      {structured.followUpQuestions.map((q, i) => (
                        <p key={i} style={{ fontSize: '0.82rem', color: '#d1d5db', marginTop: '0.4rem', lineHeight: 1.5 }}>{q}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h4 style={{ marginBottom: '0.65rem', fontSize: '0.9rem' }}>Detailed breakdown</h4>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#9ca3af', fontSize: '0.84rem', lineHeight: 1.6 }}>
                  {(structured?.detailedBreakdown || []).map((line, i) => <li key={i}>{line}</li>)}
                </ul>
                <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem' }}>Assumptions</h4>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.55 }}>
                  {(structured?.assumptions || []).map((line, i) => <li key={i}>{line}</li>)}
                </ul>
                <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem' }}>Action plan</h4>
                <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#e5e7eb', fontSize: '0.84rem', lineHeight: 1.6 }}>
                  {(structured?.actionPlan || []).map((line, i) => <li key={i}>{line}</li>)}
                </ol>

                {result.monthlyRoadmap?.length > 0 && (
                  <>
                    <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem' }}>Month-by-month roadmap (first 24 months)</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            <th style={{ textAlign: 'left', padding: '0.35rem' }}>Month</th>
                            <th style={{ textAlign: 'left', padding: '0.35rem' }}>SIP</th>
                            <th style={{ textAlign: 'left', padding: '0.35rem' }}>Emergency</th>
                            <th style={{ textAlign: 'left', padding: '0.35rem' }}>Tax</th>
                            <th style={{ textAlign: 'left', padding: '0.35rem' }}>Insurance</th>
                            <th style={{ textAlign: 'left', padding: '0.35rem' }}>Retirement</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.monthlyRoadmap.slice(0, 24).map((row) => (
                            <tr key={row.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '0.35rem' }}>{row.month}</td>
                              <td style={{ padding: '0.35rem' }}>₹{row.sip.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '0.35rem' }}>₹{row.goalSplit.emergency.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '0.35rem' }}>₹{row.goalSplit.taxSaving.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '0.35rem' }}>₹{row.goalSplit.insurance.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '0.35rem' }}>₹{row.goalSplit.retirement.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Goal totals by retirement age: Emergency ₹{(result.goalRoadmapSummary?.emergency || 0).toLocaleString('en-IN')}, Tax-saving ₹{(result.goalRoadmapSummary?.taxSaving || 0).toLocaleString('en-IN')}, Insurance ₹{(result.goalRoadmapSummary?.insurance || 0).toLocaleString('en-IN')}, Retirement corpus ₹{(result.goalRoadmapSummary?.retirement || 0).toLocaleString('en-IN')}.
                    </p>
                  </>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>What-if simulator</h3>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={syncWhatIfFromForm}>Sync from form</button>
                </div>
                {!sim && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Generate a plan first, then drag sliders — updates instantly (no extra API cost).</p>}
                {sim && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Monthly income — ₹{sim.monthlyIncome.toLocaleString('en-IN')}</label>
                      <input type="range" min={Math.round(nForm.monthlyIncome * 0.5) || 1} max={Math.round(nForm.monthlyIncome * 1.5) || 100000} value={sim.monthlyIncome} onChange={(e) => setSim((s) => ({ ...s, monthlyIncome: Number(e.target.value) }))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Retirement age — {sim.retirementAge}</label>
                      <input type="range" min={nForm.currentAge + 5} max={70} value={sim.retirementAge} onChange={(e) => setSim((s) => ({ ...s, retirementAge: Number(e.target.value) }))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Monthly expenses (proxy for SIP capacity) — ₹{sim.monthlyExpenses.toLocaleString('en-IN')}</label>
                      <input type="range" min={Math.round(nForm.monthlyExpenses * 0.7) || 0} max={Math.round(nForm.monthlyExpenses * 1.3) || 100000} value={sim.monthlyExpenses} onChange={(e) => setSim((s) => ({ ...s, monthlyExpenses: Number(e.target.value) }))} style={{ width: '100%' }} />
                    </div>
                    {whatIfResult && !whatIfResult.error && (
                      <div style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: '10px', background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.2)', fontSize: '0.84rem', lineHeight: 1.55 }}>
                        <strong style={{ color: 'var(--accent-emerald)' }}>Live preview:</strong>{' '}
                        SIP need <span style={{ fontVariantNumeric: 'tabular-nums' }}>₹{whatIfResult.requiredMonthlySIP.toLocaleString('en-IN')}</span>
                        {' · '}Target {fmtCr(whatIfResult.targetCorpus)}
                        {whatIfResult.structured?.summary && <p style={{ marginTop: '0.5rem', color: '#9ca3af' }}>{whatIfResult.structured.summary}</p>}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', height: '300px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Corpus trajectory (₹ Lakhs)</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={result.trajectory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-gold)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--accent-gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                    <XAxis dataKey="year" stroke="#666" tick={{ fill: '#888', fontSize: 11 }} />
                    <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid var(--border-gold)', borderRadius: '8px', fontSize: '0.85rem' }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Area type="monotone" dataKey="corpus" stroke="var(--accent-gold-light)" fill="url(#goldGrad)" strokeWidth={2} name="Corpus (L)" isAnimationActive animationDuration={600} />
                    <Line type="monotone" dataKey="goal" stroke="var(--success)" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Milestone (L)" isAnimationActive animationDuration={600} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 className="text-gradient" style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Asset allocation</h4>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                      <div style={{ width: `${result.assetAllocation.equity}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-amber))', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.assetAllocation.recommended}</span>
                  </div>
                  <p style={{ marginTop: '0.75rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                    Emergency target: <span style={{ fontVariantNumeric: 'tabular-nums' }}>₹{result.emergencyFund.target.toLocaleString('en-IN')}</span> ({result.emergencyFund.months} mo)
                  </p>
                </div>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>WHY AI SAID THIS (audit)</span>
                  <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.5 }}>
                    {(result.explanationLog || []).map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </div>
              </div>
            </>
          ) : result?.error ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
              <AlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
              <p>{result.error}</p>
              {result.validationErrors && (
                <ul style={{ marginTop: '0.75rem', textAlign: 'left', maxWidth: '360px', margin: '0.75rem auto 0', fontSize: '0.85rem' }}>
                  {result.validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Target size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Fill in metrics and run <strong>Generate Plan</strong> for summary, reasoning, what-if, and timeline.</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Disclaimer: Projections use your inputs only; markets, taxes, and career paths differ. Not investment advice under SEBI regulations.
      </div>
    </div>
  );
};

export default FirePlanner;
