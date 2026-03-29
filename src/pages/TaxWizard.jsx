import React, { useState, useRef } from 'react';
import { CheckCircle2, TrendingDown, TrendingUp, FileText, Calculator, Sparkles, Activity, Upload } from 'lucide-react';
import { useUserProfile } from '../context/UserProfileContext';
import { useAdvisor } from '../context/AdvisorContext';
import { orchestrate } from '../agents/orchestrator';
import ExplainWhy from '../components/ExplainWhy.jsx';
import AIWorkflowStepper from '../components/AIWorkflowStepper.jsx';
import RegulatoryRulesPanel from '../components/RegulatoryRulesPanel.jsx';
import DualTaxRegimeScenario from '../components/DualTaxRegimeScenario.jsx';
import AIDisclaimer from '../components/AIDisclaimer.jsx';
import FieldHint from '../components/FieldHint.jsx';
import { FIELD_HINTS } from '../data/fieldHints.js';
import { parseForm16File } from '../utils/form16Parser.js';
import { formatIndian } from '../utils/formatIndian.js';

const fmtINR = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;

/** Show empty instead of 0 on load so fields are not “stuck” on zero. */
function toFormStr(v) {
  if (v == null || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) && n === 0 ? '' : String(Math.round(n));
}

function buildTaxPayload(form) {
  const n = (s) => (s === '' || s == null ? 0 : parseInt(String(s), 10) || 0);
  return {
    grossSalary: n(form.grossSalary),
    basicSalary: n(form.basicSalary),
    hraReceived: n(form.hraReceived),
    rentPaid: n(form.rentPaid),
    isMetro: form.isMetro,
    section80C: n(form.section80C),
    section80D: n(form.section80D),
    section80CCD_1B: n(form.section80CCD_1B),
    section80TTA: n(form.section80TTA),
    homeLoanInterest: n(form.homeLoanInterest),
    currentAge: n(form.currentAge),
    totalEMI: n(form.totalEMI),
    monthlyIncome: n(form.monthlyIncome),
  };
}

const TaxWizard = ({ addLog }) => {
  const { profile } = useUserProfile();
  const { addMemory, updateSnapshot, markAreaOptimized } = useAdvisor();
  const [mode, setMode] = useState('input'); // input | computing | results
  const [result, setResult] = useState(null);
  const [form16Meta, setForm16Meta] = useState(null);
  const [form16ParseStatus, setForm16ParseStatus] = useState(null);
  const [parsingForm16, setParsingForm16] = useState(false);
  const [form16Progress, setForm16Progress] = useState(null);
  const form16InputRef = useRef(null);
  const [taxInputError, setTaxInputError] = useState(null);
  const [form, setForm] = useState({
    grossSalary: toFormStr(profile.grossSalary),
    basicSalary: toFormStr(profile.basicSalary),
    hraReceived: toFormStr(profile.hraReceived),
    rentPaid: toFormStr(profile.rentPaid),
    isMetro: profile.isMetro ?? false,
    section80C: toFormStr(profile.section80C),
    section80D: toFormStr(profile.section80D),
    section80CCD_1B: toFormStr(profile.section80CCD_1B),
    section80TTA: toFormStr(profile.section80TTA),
    homeLoanInterest: toFormStr(profile.homeLoanInterest),
    currentAge: toFormStr(profile.currentAge),
    totalEMI: toFormStr(profile.totalEMI),
    monthlyIncome: toFormStr(profile.monthlyIncome),
  });

  const handleChange = (field, value) => {
    if (field === 'isMetro') {
      setForm((prev) => ({ ...prev, isMetro: Boolean(value) }));
      setTaxInputError(null);
      return;
    }
    const stripped = String(value).replace(/[₹,\s]/g, '');
    if (stripped === '' || /^\d*$/.test(stripped)) {
      setForm((prev) => ({ ...prev, [field]: stripped }));
      setTaxInputError(null);
    }
  };

  /** Age fields stay raw, currency fields get Indian commas */
  const NO_FMT = new Set(['currentAge']);
  const displayVal = (key) => {
    const raw = form[key];
    if (raw === '' || raw == null) return '';
    if (NO_FMT.has(key)) return String(raw);
    return formatIndian(raw);
  };

  const handleEnterCompute = (e) => {
    if (mode !== 'input') return;
    if (e.key !== 'Enter' || e.shiftKey) return;
    const tag = String(e.target?.tagName || '').toLowerCase();
    if (tag === 'textarea') return;
    e.preventDefault();
    compute();
  };

  const compute = () => {
    if (!String(form.grossSalary).trim()) {
      setTaxInputError('Enter gross annual salary to compare tax.');
      return;
    }
    setTaxInputError(null);
    const payload = buildTaxPayload(form);
    setMode('computing');
    setTimeout(() => {
      const r = orchestrate('tax_optimize', payload, addLog);
      setResult(r);
      setMode('results');
      addMemory('Compared Old vs New tax regimes for your salary.');
      updateSnapshot({ taxSavedAnnual: r.savings });
      markAreaOptimized('tax');
    }, 500);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
    borderRadius: '6px', padding: '0.6rem 0.75rem', color: '#fff', width: '100%',
    fontFamily: 'inherit', fontSize: '0.9rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '0.35rem' }}>AI Tax Wizard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, fontWeight: 400 }}>Maximize your take-home pay with intelligent deduction routing. FY 2025-26.</p>
        </div>
        {mode !== 'input' && (
          <button className="btn btn-secondary" onClick={() => setMode('input')}>
            <FileText size={16} /> Edit Inputs
          </button>
        )}
      </div>

      <AIWorkflowStepper defaultOpen={false} />
      {mode !== 'results' && <RegulatoryRulesPanel compact />}

      {mode === 'input' && (
        <div onKeyDown={handleEnterCompute}>
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: 'var(--section-gap-lg)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} color="var(--accent-gold)" /> Form 16 &amp; salary records
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1rem' }}>
            Attach your Form 16 (PDF or image) for documentation. Files stay in this browser only — we do not upload them anywhere.
            Enter salary and deduction figures manually in the sections below (or from your Form 16 figures).
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
            <input
              ref={form16InputRef}
              id="tax-form16-file"
              type="file"
              accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
              style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
              aria-label="Attach Form 16 PDF or image"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) {
                  setForm16Meta(null);
                  setForm16ParseStatus(null);
                  return;
                }
                setForm16Meta({ name: f.name, size: f.size });
                setParsingForm16(true);
                setForm16Progress(null);
                setForm16ParseStatus({ kind: 'info', text: 'Parsing Form 16 and mapping fields...' });

                parseForm16File(f, (p) => {
                  if (typeof p?.progress === 'number') {
                    setForm16Progress(p.progress);
                  }
                  if (p?.status === 'ocr_start') {
                    setForm16ParseStatus({ kind: 'info', text: 'Running OCR on image. This may take a few seconds...' });
                  }
                })
                  .then((parsed) => {
                    const updates = {};
                    Object.entries(parsed.fields || {}).forEach(([k, v]) => {
                      updates[k] = String(v);
                    });
                    if (Object.keys(updates).length) {
                      setForm((prev) => ({ ...prev, ...updates }));
                      setForm16ParseStatus({
                        kind: 'success',
                        text: `Auto-filled ${Object.keys(updates).length} field(s) from Form 16 (confidence ${parsed.confidence}%). Please review before computing.`,
                      });
                    } else {
                      setForm16ParseStatus({
                        kind: 'warn',
                        text: 'Could not auto-extract values from this file. You can still enter values manually.',
                      });
                    }
                  })
                  .catch(() => {
                    setForm16ParseStatus({
                      kind: 'warn',
                      text: 'Form 16 parse failed for this file format. Enter values manually.',
                    });
                  })
                  .finally(() => {
                    setParsingForm16(false);
                    setForm16Progress(null);
                  });
              }}
            />
            <label htmlFor="tax-form16-file" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Upload size={16} />
              Choose Form 16 file
            </label>
            {form16Meta && (
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)' }}>
                Attached: <strong>{form16Meta.name}</strong> ({(form16Meta.size / 1024).toFixed(1)} KB)
              </span>
            )}
            {parsingForm16 && (
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-gold)' }}>
                Parsing file{typeof form16Progress === 'number' ? ` (${form16Progress}%)` : ''}...
              </span>
            )}
            {form16Meta && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                onClick={() => {
                  setForm16Meta(null);
                  setForm16ParseStatus(null);
                  setForm16Progress(null);
                  if (form16InputRef.current) form16InputRef.current.value = '';
                }}
              >
                Remove
              </button>
            )}
          </div>
          {form16ParseStatus && (
            <p
              style={{
                marginTop: '0.8rem',
                fontSize: '0.8rem',
                color: form16ParseStatus.kind === 'success' ? 'var(--success)' : form16ParseStatus.kind === 'warn' ? 'var(--accent-amber)' : 'var(--text-secondary)',
              }}
            >
              {form16ParseStatus.text}
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--section-gap-lg)' }}>
          {/* Salary Structure */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--accent-gold)" /> Salary Structure
            </h3>
            {[
              { key: 'grossSalary', label: 'Gross Annual Salary (₹)', hint: FIELD_HINTS.taxGrossSalary },
              { key: 'basicSalary', label: 'Basic Salary (Annual ₹)', hint: FIELD_HINTS.taxBasicSalary },
              { key: 'hraReceived', label: 'HRA Received (Annual ₹)', hint: FIELD_HINTS.taxHraReceived },
              { key: 'rentPaid', label: 'Rent Paid (Annual ₹)', hint: FIELD_HINTS.taxRentPaid },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: '0.75rem' }}>
                <div className="field-label-row" style={{ marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>{f.label}</label>
                  <FieldHint text={f.hint} />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayVal(f.key)}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
                  placeholder="—"
                />
              </div>
            ))}
            <div className="field-label-row" style={{ marginTop: '0.5rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
                <input type="checkbox" checked={form.isMetro} onChange={(e) => handleChange('isMetro', e.target.checked)} />
                Metro city (Delhi/Mumbai/Kolkata/Chennai)
              </label>
              <FieldHint text={FIELD_HINTS.taxMetro} />
            </div>
          </div>

          {/* Deductions */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={16} color="var(--accent-gold)" /> Deductions Claimed
            </h3>
            {[
              { key: 'section80C', label: 'Section 80C (EPF+PPF+ELSS+LIC)', max: '1,50,000', hint: FIELD_HINTS.tax80C },
              { key: 'section80D', label: 'Section 80D (Medical Insurance)', max: '75,000', hint: FIELD_HINTS.tax80D },
              { key: 'section80CCD_1B', label: 'Section 80CCD(1B) (NPS)', max: '50,000', hint: FIELD_HINTS.tax80CCD },
              { key: 'section80TTA', label: 'Section 80TTA (Savings Interest)', max: '10,000', hint: FIELD_HINTS.tax80TTA },
              { key: 'homeLoanInterest', label: 'Home Loan Interest (Sec 24)', max: '2,00,000', hint: FIELD_HINTS.taxHomeLoan },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: '0.75rem' }}>
                <div className="field-label-row" style={{ marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {f.label} <span style={{ opacity: 0.5 }}>(max ₹{f.max})</span>
                  </label>
                  <FieldHint text={f.hint} />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
                  placeholder="—"
                />
              </div>
            ))}
            {taxInputError && (
              <p style={{ fontSize: '0.82rem', color: 'var(--accent-amber)', margin: '0.35rem 0 0' }} role="alert">{taxInputError}</p>
            )}
            <button className="btn btn-primary" onClick={compute} style={{ width: '100%', marginTop: '0.5rem' }}>
              <Calculator size={16} /> Compute Tax Comparison
            </button>
          </div>
        </div>
        </div>
      )}

      {mode === 'computing' && (
        <div className="glass-panel shimmer-placeholder" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-amber)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
          <div className="skeleton-line skeleton-line--lg" style={{ maxWidth: '280px', margin: '0 auto 0.75rem' }} />
          <div className="skeleton-line" style={{ maxWidth: '360px', margin: '0 auto' }} />
        </div>
      )}

      {mode === 'results' && result && (
        <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap-lg)' }}>

          {result.structured?.summary && (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.1rem 1.25rem', borderLeft: '3px solid var(--accent-emerald)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-gold)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>SUMMARY</span>
              </div>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.55, color: '#e5e7eb', margin: 0 }}>{result.structured.summary}</p>
              <AIDisclaimer variant="micro" />
            </div>
          )}

          <DualTaxRegimeScenario result={result} />
          <RegulatoryRulesPanel />

          {/* Regime Comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--section-gap-lg)' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', opacity: result.recommended === 'Old Regime' ? 1 : 0.6, position: 'relative' }}>
              {result.recommended === 'Old Regime' && (
                <div style={{ position: 'absolute', top: -10, right: 16, background: 'var(--success)', color: '#000', padding: '3px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>✓ Recommended</div>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Old Regime Tax Liability</p>
              <h3 style={{ fontSize: '2.25rem', fontWeight: 700 }}>{fmtINR(result.oldRegime.totalTax)}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Taxable Income: {fmtINR(result.oldRegime.taxableIncome)} | Deductions: {fmtINR(result.oldRegime.deductions)}
              </p>
              {/* Deduction Breakdown */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Deduction Breakdown:</p>
                {Object.entries(result.oldRegime.breakdown).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '2px 0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                    <span>{fmtINR(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="luxury-card" style={{ position: 'relative', opacity: result.recommended === 'New Regime' ? 1 : 0.6 }}>
              {result.recommended === 'New Regime' && (
                <div style={{ position: 'absolute', top: -10, right: 16, background: 'var(--success)', color: '#000', padding: '3px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>✓ Recommended</div>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>New Regime Tax Liability</p>
              <h3 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 700 }}>{fmtINR(result.newRegime.totalTax)}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {result.savings > 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                <span>{result.recommended} saves you <strong>{fmtINR(result.savings)}</strong></span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Taxable Income: {fmtINR(result.newRegime.taxableIncome)} | Std Deduction: ₹75,000
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="glass-panel hover-lift" style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Regime delta</p>
              <p style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(result.savings)}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>Illustrative difference vs the alternate regime</p>
              <AIDisclaimer variant="micro" />
            </div>
            <div className="glass-panel hover-lift" style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</p>
              <p style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-emerald)', fontVariantNumeric: 'tabular-nums' }}>{result.structured?.confidence ?? '—'}%</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>Higher when slabs and deductions are complete</p>
            </div>
            <div className="glass-panel hover-lift" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity size={28} color="var(--accent-gold)" />
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Impact</p>
                <p style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.45 }}>Choosing well each year frees cash for goals — we don’t pretend to predict market returns on tax saved.</p>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '2rem', background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <CheckCircle2 size={32} color="var(--success)" />
            <div>
              <h4 style={{ color: 'var(--success)', marginBottom: '0.25rem' }}>Headline difference: {fmtINR(result.savings)} / year</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                If you invested that difference at ~12% for 20 years, it could grow to roughly <strong>{fmtINR(Math.round(result.savings * ((Math.pow(1.12, 20) - 1) / 0.12)))}</strong> — an illustration, not a promise.
              </p>
            </div>
          </div>

          {/* Missing Deductions */}
          {result.missingDeductions.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                <CheckCircle2 size={18} color="var(--accent-gold)" /> Missing Deductions Found ({result.missingDeductions.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {result.missingDeductions.map((d, i) => (
                  <div key={i} style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-amber)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Section {d.section}</span>
                      <span style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>Gap: {fmtINR(d.gap)}</span>
                    </div>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.recommendedInvestments?.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                Ranked tax-saving options ({result.riskProfile} profile)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {result.recommendedInvestments.map((r, i) => (
                  <div key={i} style={{ padding: '0.8rem', borderLeft: '3px solid var(--accent-emerald)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.88rem' }}>{r.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>Up to ₹{r.maxEligible.toLocaleString('en-IN')} ({r.section})</span>
                    </div>
                    <p style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.rationale}</p>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Risk: {r.risk} | Liquidity: {r.liquidity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          <AIDisclaimer variant="inline" />
        </div>
      )}
    </div>
  );
};

export default TaxWizard;
