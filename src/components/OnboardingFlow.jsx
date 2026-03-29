import React, { useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, Sparkles, Upload } from 'lucide-react';
import { emptyProfile } from '../context/UserProfileContext.jsx';
import FieldHint from './FieldHint.jsx';
import { FIELD_HINTS } from '../data/fieldHints.js';
import { parseForm16File } from '../utils/form16Parser.js';

const STEPS = [
  {
    title: 'Personal Details',
    fields: [
      { key: 'name', label: 'Your Name', type: 'text', default: '', required: true, hintKey: 'name' },
      { key: 'currentAge', label: 'Current Age', type: 'number', default: '', required: true, hintKey: 'currentAge' },
      { key: 'retirementAge', label: 'Target Retirement Age', type: 'number', default: '', required: true, hintKey: 'retirementAge' },
    ],
  },
  {
    title: 'Income & Expenses',
    fields: [
      { key: 'grossSalary', label: 'Gross Annual Salary (₹)', type: 'number', default: '', required: true, hintKey: 'grossSalary' },
      { key: 'basicSalary', label: 'Basic Salary (Annual ₹)', type: 'number', default: '', required: true, hintKey: 'basicSalary' },
      { key: 'monthlyIncome', label: 'Monthly Take-Home (₹)', type: 'number', default: '', required: true, hintKey: 'monthlyIncome' },
      { key: 'monthlyExpenses', label: 'Monthly Expenses (₹)', type: 'number', default: '', required: true, hintKey: 'monthlyExpenses' },
      { key: 'hraReceived', label: 'Annual HRA Received (₹)', type: 'number', default: '', required: false, hintKey: 'hraReceived' },
      { key: 'rentPaid', label: 'Annual Rent Paid (₹)', type: 'number', default: '', required: false, hintKey: 'rentPaid' },
    ],
  },
  {
    title: 'Investments & Savings',
    fields: [
      { key: 'existingCorpus', label: 'Total Existing Investments (₹)', type: 'number', default: '', required: true, hintKey: 'existingCorpus' },
      { key: 'emergencyFund', label: 'Emergency Fund (₹)', type: 'number', default: '', required: true, hintKey: 'emergencyFund' },
      { key: 'monthlySIP', label: 'Current Monthly SIP (₹)', type: 'number', default: '', required: true, hintKey: 'monthlySIP' },
    ],
  },
  {
    title: 'Insurance & Tax',
    fields: [
      { key: 'lifeInsuranceCover', label: 'Life Insurance Cover (₹)', type: 'number', default: '', required: false, hintKey: 'lifeInsuranceCover' },
      { key: 'healthInsuranceCover', label: 'Health Insurance Cover (₹)', type: 'number', default: '', required: false, hintKey: 'healthInsuranceCover' },
      { key: 'section80C', label: '80C Investments Done (₹)', type: 'number', default: '', required: false, hintKey: 'section80C' },
      { key: 'section80D', label: '80D Premium Paid (₹)', type: 'number', default: '', required: false, hintKey: 'section80D' },
      { key: 'totalEMI', label: 'Total Monthly EMIs (₹)', type: 'number', default: '', required: false, hintKey: 'totalEMI' },
    ],
  },
];

function validateStep(stepIndex, data) {
  if (stepIndex === 0) {
    const name = String(data.name || '').trim();
    if (!name) return 'Enter your name.';
    const age = Number(data.currentAge);
    const ret = Number(data.retirementAge);
    if (!age || age < 18 || age > 100) return 'Enter a valid current age (18–100).';
    if (!ret || ret <= age) return 'Target retirement age must be greater than your current age.';
    return null;
  }
  if (stepIndex === 1) {
    if (data.monthlyExpenses === '' || data.monthlyExpenses == null) return 'Enter monthly expenses (use 0 only if you truly have no living costs).';
    if (!Number(data.grossSalary) || Number(data.grossSalary) <= 0) return 'Gross annual salary is required (greater than zero).';
    if (!Number(data.basicSalary) || Number(data.basicSalary) <= 0) return 'Basic salary is required (greater than zero).';
    if (!Number(data.monthlyIncome) || Number(data.monthlyIncome) <= 0) return 'Monthly take-home is required (greater than zero).';
    if (Number(data.monthlyExpenses) < 0) return 'Monthly expenses cannot be negative.';
    if (Number(data.basicSalary) > Number(data.grossSalary)) return 'Basic salary should not exceed gross salary.';
    return null;
  }
  if (stepIndex === 2) {
    const sum = Number(data.existingCorpus) + Number(data.emergencyFund) + Number(data.monthlySIP);
    if (sum <= 0) return 'Enter at least one of: investments, emergency fund, or monthly SIP (greater than zero).';
    return null;
  }
  return null;
}

function sanitizeOnboardingProfile(d) {
  const o = { ...d };
  for (const k of Object.keys(o)) {
    if (k === 'name') continue;
    if (o[k] === '') o[k] = 0;
    else if (typeof o[k] === 'string' && /^\d+$/.test(o[k])) o[k] = parseInt(o[k], 10);
  }
  return o;
}

function deriveOnboardingFromForm16(fields) {
  // Gross salary from the parser = Total of 17(1)+17(2)+17(3) = row (d)
  // Do NOT inflate it by taking max with grossTotalIncome/taxableIncome,
  // which are different categories (and may include "other employer" amounts).
  const grossSalary = Number(fields.grossSalary || 0);

  // Basic salary from parser = section 17(1) value.
  // Fallback to 40% of gross if parser didn't find it.
  let basicSalary = Number(fields.basicSalary || 0);
  if (!basicSalary && grossSalary > 0) {
    basicSalary = Math.round(grossSalary * 0.4);
  }
  // Sanity: basic should not exceed gross
  if (basicSalary > grossSalary && grossSalary > 0) {
    basicSalary = Math.round(grossSalary * 0.4);
  }

  const hraReceived = Number(fields.hraReceived || 0);
  const rentPaid = Number(fields.rentPaid || 0);
  const section80C = Number(fields.section80C || 0);
  const section80D = Number(fields.section80D || 0);

  // Derive approximate monthly figures from gross

  return {
    name: 'Form16 User',
    currentAge: 30,
    retirementAge: 55,
    grossSalary,
    basicSalary,
    monthlyIncome: '',
    monthlyExpenses: '',
    hraReceived,
    rentPaid,
    isMetro: true,
    existingCorpus: '',
    emergencyFund: '',
    monthlySIP: '',
    lifeInsuranceCover: '',
    healthInsuranceCover: '',
    section80C,
    section80D,
    section80CCD_1B: Number(fields.section80CCD_1B || 0),
    section80TTA: Number(fields.section80TTA || 0),
    homeLoanInterest: Number(fields.homeLoanInterest || 0),
    totalEMI: '',
  };
}

const OnboardingFlow = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState('');
  const [parsingForm16, setParsingForm16] = useState(false);
  const [form16Status, setForm16Status] = useState(null);
  const [form16Progress, setForm16Progress] = useState(null);
  const [form16Meta, setForm16Meta] = useState(null);
  const form16InputRef = useRef(null);
  const [data, setData] = useState(() => {
    const d = { ...emptyProfile };
    STEPS.forEach((s) => s.fields.forEach((f) => { d[f.key] = f.default; }));
    d.name = d.name || '';
    d.section80CCD_1B = 0;
    d.section80TTA = 0;
    d.homeLoanInterest = 0;
    d.otherDeductions = 0;
    d.filedOnTime = true;
    d.hasTermPlan = false;
    d.investmentTypes = [];
    d.hasPartner = false;
    return d;
  });

  const handleChange = (key, value) => {
    const field = STEPS.flatMap((s) => s.fields).find((f) => f.key === key);
    if (field?.type === 'number') {
      const v = String(value).replace(/[₹,\s]/g, '');
      if (v === '' || /^\d+$/.test(v)) setData((prev) => ({ ...prev, [key]: v }));
    } else {
      setData((prev) => ({ ...prev, [key]: value }));
    }
    setStepError('');
  };

  const goNext = () => {
    const err = validateStep(step, data);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError('');
    setStep((s) => s + 1);
  };

  const launch = () => {
    const err = validateStep(step, data);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError('');
    onComplete(sanitizeOnboardingProfile(data));
  };

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleEnterSubmit = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const tag = String(e.target?.tagName || '').toLowerCase();
    if (tag === 'textarea') return;
    e.preventDefault();
    if (isLast) launch();
    else goNext();
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
    borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', width: '100%',
    fontFamily: 'inherit', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s',
  };

  const renderFields = () => {
    const fields = currentStep.fields;
    const isPersonal = currentStep.title === 'Personal Details';
    const isIncome = currentStep.title === 'Income & Expenses';

    if (isPersonal) {
      return (
        <div className="onboarding-field-grid">
          <div className="onboarding-span-full">
            <div className="field-label-row" style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Your Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <FieldHint text={FIELD_HINTS.name} />
            </div>
            <input
              type="text"
              value={data.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={inputStyle}
              autoComplete="name"
              placeholder="Full name"
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
            />
          </div>
          <div>
            <div className="field-label-row" style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Current Age <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <FieldHint text={FIELD_HINTS.currentAge} />
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={data.currentAge}
              onChange={(e) => handleChange('currentAge', e.target.value)}
              style={inputStyle}
              placeholder="e.g. 30"
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
            />
          </div>
          <div>
            <div className="field-label-row" style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Target Retirement Age <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <FieldHint text={FIELD_HINTS.retirementAge} />
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={data.retirementAge}
              onChange={(e) => handleChange('retirementAge', e.target.value)}
              style={inputStyle}
              placeholder="e.g. 55"
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
            />
          </div>
        </div>
      );
    }

    const gridClass = isIncome ? 'onboarding-field-grid onboarding-field-grid--tight' : 'onboarding-field-grid';

    return (
      <div className={gridClass}>
        {fields.map((f) => (
          <div key={f.key}>
            <div className="field-label-row" style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                {f.label}
                {f.required && <span style={{ color: 'var(--danger)' }}> *</span>}
              </label>
              {f.hintKey && FIELD_HINTS[f.hintKey] && <FieldHint text={FIELD_HINTS[f.hintKey]} />}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={data[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              style={inputStyle}
              placeholder={f.required ? 'Required' : 'Optional'}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
            />
          </div>
        ))}
        {isIncome && (
          <div className="field-label-row onboarding-span-full" style={{ marginTop: '0.25rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
              <input type="checkbox" checked={data.isMetro} onChange={(e) => setData((p) => ({ ...p, isMetro: e.target.checked }))} />
              Metro city (for HRA / tax rules)
            </label>
            <FieldHint text={FIELD_HINTS.isMetro} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="onboarding-root">
      <div className="onboarding-root__inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, var(--accent-gold-light) 0%, var(--accent-amber) 100%)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#000', fontWeight: 'bold', fontSize: '1rem',
          }}>AI</div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>Money Mentor</span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Step {step + 1} of {STEPS.length}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-gold-light), var(--accent-amber))', borderRadius: '2px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', animation: 'fadeSlideUp 0.3s ease', width: '100%' }} onKeyDown={handleEnterSubmit}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>{currentStep.title}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Fields marked <span style={{ color: 'var(--danger)' }}>*</span> are required before you continue.
          </p>

          <div className="glass-panel" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem' }}>
              <Upload size={15} color="var(--accent-gold)" />
              <strong style={{ fontSize: '0.82rem' }}>Fast option: Onboard from Form 16</strong>
              <FieldHint text={FIELD_HINTS.form16Upload} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
              Upload Form 16 and we auto-fill all onboarding steps. Then press Continue on each step to review and confirm.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              <input
                ref={form16InputRef}
                id="onboarding-form16"
                type="file"
                accept=".pdf,application/pdf,image/jpeg,image/png,image/webp,text/plain"
                style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setForm16Meta({ name: f.name, size: f.size });
                  setParsingForm16(true);
                  setForm16Progress(null);
                  setForm16Status({ kind: 'info', text: 'Parsing Form 16 for onboarding...' });
                  parseForm16File(f, (p) => {
                    if (typeof p?.progress === 'number') setForm16Progress(p.progress);
                  })
                    .then((parsed) => {
                      const autoData = deriveOnboardingFromForm16(parsed.fields || {});
                      setData((prev) => ({ ...prev, ...autoData }));
                      setStep(0);
                      setStepError('');
                      setForm16Status({
                        kind: 'success',
                        text: `Extracted ${Object.keys(parsed.fields || {}).length} field(s). All onboarding pages are auto-filled. Review each step and press Continue.`,
                      });
                    })
                    .catch(() => {
                      setForm16Status({ kind: 'warn', text: 'Could not parse this file. You can continue manual onboarding.' });
                    })
                    .finally(() => {
                      setParsingForm16(false);
                      setForm16Progress(null);
                    });
                }}
              />
              <label htmlFor="onboarding-form16" className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                <Upload size={14} /> Upload Form 16
              </label>
              {form16Meta && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
                  {form16Meta.name} ({(form16Meta.size / 1024).toFixed(1)} KB)
                </span>
              )}
              {parsingForm16 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                  Parsing{typeof form16Progress === 'number' ? ` ${form16Progress}%` : ''}...
                </span>
              )}
            </div>

            {form16Status && (
              <p
                style={{
                  marginTop: '0.55rem',
                  fontSize: '0.75rem',
                  color: form16Status.kind === 'success' ? 'var(--success)' : form16Status.kind === 'warn' ? 'var(--accent-amber)' : 'var(--text-secondary)',
                }}
              >
                {form16Status.text}
              </p>
            )}
          </div>

          {stepError && <div className="onboarding-error" role="alert">{stepError}</div>}

          {renderFields()}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
            {step > 0 ? (
              <button type="button" className="btn btn-secondary" onClick={() => { setStep((s) => s - 1); setStepError(''); }}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}
            {isLast ? (
              <button type="button" className="btn btn-primary" onClick={launch} style={{ flex: 1, maxWidth: '220px', marginLeft: 'auto' }}>
                <Sparkles size={16} /> Launch Mentor
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={goNext} style={{ marginLeft: 'auto' }}>
                Continue <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Your data stays local. No information is sent to any server.
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default OnboardingFlow;
