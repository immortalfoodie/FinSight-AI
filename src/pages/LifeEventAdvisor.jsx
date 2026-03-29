import React, { useState, useCallback } from 'react';
import { Gift, Heart, Baby, Building2, Briefcase, AlertTriangle, ArrowRight, Banknote, PieChart, Scale, Sparkles, TrendingUp, MessageSquareText } from 'lucide-react';
import { useUserProfile } from '../context/UserProfileContext';
import { useAdvisor } from '../context/AdvisorContext';
import { orchestrate } from '../agents/orchestrator';
import { formatIndian } from '../utils/formatIndian.js';

const EVENTS = [
  { id: 'bonus', label: 'Received a Bonus', icon: Gift, color: '#f5b041', desc: 'Optimize your windfall for tax savings, investments, and goals.' },
  { id: 'marriage', label: 'Getting Married', icon: Heart, color: '#f472b6', desc: 'Joint planning, insurance, HRA optimization, and nominee updates.' },
  { id: 'new_baby', label: 'New Baby', icon: Baby, color: '#34d399', desc: 'Education fund, insurance upgrade, and dependent planning.' },
  { id: 'inheritance', label: 'Received Inheritance', icon: Building2, color: '#818cf8', desc: 'Structured deployment, tax implications, and asset allocation.' },
  { id: 'job_loss', label: 'Job Loss', icon: Briefcase, color: '#ef4444', desc: 'Emergency mode, expense reduction, and fund preservation.' },
];

const NEEDS_AMOUNT = ['bonus', 'inheritance'];

const fmtINR = (v) => (v != null ? `₹${Math.round(v).toLocaleString('en-IN')}` : '—');

const LifeEventAdvisor = ({ addLog }) => {
  const { profile } = useUserProfile();
  const { markAreaOptimized } = useAdvisor();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [extraInput, setExtraInput] = useState('');
  const [amountError, setAmountError] = useState('');
  const [result, setResult] = useState(null);
  const [computing, setComputing] = useState(false);
  const [goalPrompt, setGoalPrompt] = useState('');
  const [goalError, setGoalError] = useState('');

  const runAnalysis = useCallback(
    (eventId) => {
      const parsed = parseInt(String(extraInput).replace(/[₹,\s]/g, ''), 10) || 0;
      if (NEEDS_AMOUNT.includes(eventId) && parsed <= 0) {
        setAmountError('Enter the amount in ₹ (greater than zero) before running the analysis.');
        return;
      }
      setAmountError('');
      setComputing(true);
      setResult(null);

      const data = {
        event: eventId,
        profile: {
          ...profile,
          bonusAmount: eventId === 'bonus' ? parsed : 0,
          inheritanceAmount: eventId === 'inheritance' ? parsed : 0,
        },
      };

      setTimeout(() => {
        const r = orchestrate('life_event', data, addLog);
        setResult(r);
        setComputing(false);
        markAreaOptimized('life');
      }, 400);
    },
    [profile, extraInput, addLog, markAreaOptimized],
  );

  const selectEvent = (eventId) => {
    setSelectedEvent(eventId);
    setResult(null);
    setAmountError('');
    setExtraInput('');
    if (!NEEDS_AMOUNT.includes(eventId)) {
      setComputing(true);
      setResult(null);
      const data = {
        event: eventId,
        profile: {
          ...profile,
          bonusAmount: 0,
          inheritanceAmount: 0,
        },
      };
      setTimeout(() => {
        const r = orchestrate('life_event', data, addLog);
        setResult(r);
        setComputing(false);
        markAreaOptimized('life');
      }, 400);
    } else {
      setComputing(false);
    }
  };

  const runGoalAdvisor = useCallback(() => {
    const text = String(goalPrompt || '').trim();
    if (!text) {
      setGoalError('Please type your goal in plain text before generating strategy.');
      return;
    }
    setGoalError('');
    setSelectedEvent('custom_goal');
    setComputing(true);
    setResult(null);
    const data = {
      event: 'custom_goal',
      profile: {
        ...profile,
        goalText: text,
      },
    };
    setTimeout(() => {
      const r = orchestrate('life_event', data, addLog);
      setResult(r);
      setComputing(false);
      markAreaOptimized('life');
    }, 400);
  }, [goalPrompt, profile, addLog, markAreaOptimized]);

  const dash = result?.impact?.impactDashboard;
  const structured = result?.structured;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap-lg)' }}>
      <div>
        <h2 style={{ marginBottom: '0.35rem' }}>Life Event Financial Advisor</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, fontWeight: 400 }}>Allocation strategy, tax heuristics, and FIRE impact vs your baseline — not generic copy.</p>
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MessageSquareText size={17} color="var(--accent-gold)" />
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Goal Chat Advisor</h3>
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
          Type naturally, for example: "I am 21 right now and plan to get married at 29. Give me investment strategy."
        </p>
        <textarea
          value={goalPrompt}
          onChange={(e) => {
            setGoalPrompt(e.target.value);
            setGoalError('');
          }}
          placeholder="Describe your goal in simple text..."
          rows={4}
          style={{
            width: '100%',
            resize: 'vertical',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.75rem 0.9rem',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: '0.87rem',
            lineHeight: 1.5,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              runGoalAdvisor();
            }
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Tip: press Ctrl/Cmd + Enter to run</span>
          <button type="button" className="btn btn-primary" onClick={runGoalAdvisor}>
            Generate strategy <ArrowRight size={14} />
          </button>
        </div>
        {goalError && <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--danger)' }}>{goalError}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        {EVENTS.map((ev) => {
          const Icon = ev.icon;
          const isActive = selectedEvent === ev.id;
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => selectEvent(ev.id)}
              className="glass-panel hover-lift"
              style={{
                padding: '1.25rem 1rem', cursor: 'pointer', textAlign: 'center',
                border: isActive ? `2px solid ${ev.color}` : '1px solid var(--border-subtle)',
                background: isActive ? `${ev.color}12` : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${ev.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <Icon size={20} color={ev.color} />
              </div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '0.25rem', color: isActive ? ev.color : 'var(--text-primary)' }}>{ev.label}</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{ev.desc}</p>
            </button>
          );
        })}
      </div>

      {selectedEvent && NEEDS_AMOUNT.includes(selectedEvent) && !result && (
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Banknote size={20} color="var(--accent-gold)" />
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }} htmlFor="life-event-amount">
              {selectedEvent === 'bonus' ? 'Bonus amount (₹)' : 'Inheritance amount (₹)'}
            </label>
            <input
              id="life-event-amount"
              type="text"
              inputMode="numeric"
              value={extraInput === '' ? '' : formatIndian(extraInput)}
              onChange={(e) => { const v = e.target.value.replace(/[₹,\s]/g, ''); if (v === '' || /^\d*$/.test(v)) { setExtraInput(v); setAmountError(''); } }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || e.shiftKey) return;
                e.preventDefault();
                runAnalysis(selectedEvent);
              }}
              placeholder="Enter amount"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.6rem 0.75rem', color: '#fff', flex: 1, minWidth: '180px', fontFamily: 'inherit' }}
            />
            <button type="button" className="btn btn-primary" onClick={() => runAnalysis(selectedEvent)}>
              Run analysis <ArrowRight size={14} />
            </button>
          </div>
          {amountError && (
            <p style={{ fontSize: '0.82rem', color: 'var(--danger)', margin: 0 }}>{amountError}</p>
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>We use this amount for allocation and tax sketches — no default guess.</p>
        </div>
      )}

      {computing && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Computing allocation, tax sketch, and FIRE delta…</p>
        </div>
      )}

      {result && !computing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {structured?.summary && (
            <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', borderLeft: '3px solid var(--accent-emerald)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-gold)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>SUMMARY</span>
              </div>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.55, color: '#e5e7eb' }}>{structured.summary}</p>
            </div>
          )}

          {dash && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Savings rate (before → after)', value: `${dash.savingsRateBeforePct}% → ${dash.savingsRateAfterPct}%`, icon: PieChart },
                { label: 'Tax saved (approx)', value: fmtINR(dash.taxSavedApprox), icon: Scale },
                { label: 'FIRE: min age shift (yrs)', value: dash.retirementAgeDeltaYears != null ? `${dash.retirementAgeDeltaYears > 0 ? '+' : ''}${dash.retirementAgeDeltaYears}` : '—', icon: TrendingUp },
                { label: 'Net worth / SIP delta', value: `${fmtINR(dash.netWorthGrowth)} · SIP Δ ${fmtINR(dash.requiredSIPChange)}`, icon: TrendingUp },
              ].map((k, i) => (
                <div key={i} className="glass-panel hover-lift" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <k.icon size={14} color="var(--accent-gold)" />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)', fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                </div>
              ))}
            </div>
          )}

          {result.allocationStrategy?.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Allocation strategy</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.allocationStrategy.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.75rem', alignItems: 'center', padding: '0.65rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.84rem' }}>
                    <span style={{ fontWeight: 600 }}>{row.bucket}</span>
                    <span style={{ color: 'var(--accent-gold)', fontVariantNumeric: 'tabular-nums' }}>{row.percent != null ? `${row.percent.toFixed(0)}%` : ''}</span>
                    <span style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>{fmtINR(row.amount)} — {row.rationale}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.taxImpact?.items?.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.1rem 1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Tax impact (illustrative)</h4>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.55 }}>
                {result.taxImpact.items.map((t, i) => (
                  <li key={i}>{t.label}: {fmtINR(t.amount)}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: result.actions?.length > 0 ? '2fr 1fr' : '1fr', gap: 'var(--section-gap-lg)' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Action plan & narrative</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(result.advice || []).map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-amber)' }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{i + 1}.</span>
                    <p style={{ fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.5 }}>{tip}</p>
                  </div>
                ))}
              </div>
              {structured?.reasoning?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>WHY THIS ORDER</span>
                  {structured.reasoning.map((t, i) => (
                    <p key={i} style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '0.35rem', lineHeight: 1.5 }}>{t}</p>
                  ))}
                </div>
              )}
            </div>

            {result.actions?.length > 0 && (
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Suggested rupee flows</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {result.actions.map((a, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem' }}>{a.action}</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>{a.amount > 0 ? fmtINR(a.amount) : '—'}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Total directed</span>
                    <span style={{ fontWeight: 700, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>{fmtINR(result.actions.reduce((s, a) => s + a.amount, 0))}</span>
                  </div>
                </div>
                {structured?.confidence != null && (
                  <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Model confidence: {structured.confidence}% (heuristic + FIRE recompute)</p>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{result.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LifeEventAdvisor;
