import React, { useEffect, useState } from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle, Heart, Percent, PiggyBank, CreditCard, BadgeDollarSign, Clock, Sparkles } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useUserProfile } from '../context/UserProfileContext';
import { useAdvisor } from '../context/AdvisorContext';
import { orchestrate } from '../agents/orchestrator';
import { getFutureStory } from '../engine/storyEngine.js';
import CountUp from '../components/CountUp.jsx';
import ExplainWhy from '../components/ExplainWhy.jsx';
import FutureStory from '../components/FutureStory.jsx';
import FinancialSnapshot from '../components/FinancialSnapshot.jsx';
import AIWorkflowStepper from '../components/AIWorkflowStepper.jsx';
import RegulatoryRulesPanel from '../components/RegulatoryRulesPanel.jsx';
import AIDisclaimer from '../components/AIDisclaimer.jsx';



const statusColor = (status) => {
  if (status === 'Healthy' || status === 'Excellent' || status === 'On Track') return 'var(--success)';
  if (status === 'Critical') return 'var(--danger)';
  return 'var(--accent-gold)';
};

const dimensionIcon = (key) => {
  const map = { emergency: PiggyBank, insurance: Heart, investments: TrendingUp, debt: CreditCard, tax: BadgeDollarSign, retirement: Clock };
  const Icon = map[key] || Percent;
  return <Icon size={18} />;
};

const Dashboard = ({ addLog }) => {
  const { profile } = useUserProfile();
  const { snapshot, progressCount, recordHealthScore, setAdvisorWorstGap, markAreaOptimized } = useAdvisor();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const story = React.useMemo(() => getFutureStory(profile), [profile]);

  useEffect(() => {
    const t0 = setTimeout(() => setLoading(true), 0);
    const timer = setTimeout(() => {
      const r = orchestrate('health_score', profile, addLog);
      setResult(r);
      recordHealthScore(r.totalScore);
      const worst = r.dimensions.reduce((a, b) => (a.score <= b.score ? a : b));
      setAdvisorWorstGap({ name: worst.name, key: worst.key, score: worst.score });
      markAreaOptimized('overview');
      setLoading(false);
    }, 550);
    return () => { clearTimeout(t0); clearTimeout(timer); };
  }, [profile, addLog, recordHealthScore, setAdvisorWorstGap, markAreaOptimized]);

  const radarData = result?.dimensions
    ? result.dimensions.map((d) => ({
        dimension: d.name.split(' ')[0],
        score: d.score,
        fullMark: 100,
      }))
    : [];

  const structured = result?.structured;

  return (
    <div className="page-enter dashboard-root page-stack">

      <AIWorkflowStepper defaultOpen />
      <RegulatoryRulesPanel compact />
      <AIDisclaimer variant="inline" />

      <FinancialSnapshot snapshot={snapshot} progressCount={progressCount} totalAreas={6} />
      <AIDisclaimer variant="micro" />

      {loading ? (
        <div className="glass-panel shimmer-placeholder" style={{ padding: '2rem', minHeight: '220px', borderRadius: '16px' }}>
          <div className="skeleton-line skeleton-line--lg" style={{ marginBottom: '1rem' }} />
          <div className="skeleton-line" style={{ width: '70%' }} />
        </div>
      ) : (
        <>
          <div className="luxury-card hover-lift" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
              <p className="section-eyebrow">Money Health Score</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <span style={{ fontSize: '4rem', fontWeight: 700, lineHeight: 1 }} className="text-gradient font-mono-nums">
                  <CountUp end={result.totalScore} duration={1000} />
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>/ 100</span>
              </div>
              {structured?.summary && (
                <p style={{ marginTop: '1rem', color: '#d1d5db', maxWidth: '520px', lineHeight: 1.6, fontSize: '0.9375rem', fontWeight: 400 }}>
                  {structured.summary}
                </p>
              )}
              {result.topPriority && (
                <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.6, fontSize: '0.9375rem', fontWeight: 400 }}>
                  {result.topPriority}
                </p>
              )}
              {structured?.confidence != null && (
                <div style={{ marginTop: '1rem', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <span>Confidence (model fit)</span>
                    <span>{structured.confidence}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ width: `${structured.confidence}%`, height: '100%', borderRadius: '6px', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-emerald))', transition: 'width 0.8s ease' }} />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Higher when inputs are complete and goals are typical — not a guarantee of outcomes.
                  </p>
                  <AIDisclaimer variant="micro" />
                </div>
              )}
            </div>

            <div style={{ width: '240px', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="var(--accent-gold)" fill="var(--accent-gold)" fillOpacity={0.22} strokeWidth={2} isAnimationActive animationDuration={800} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <FutureStory milestones={story.milestones} narrative={story.narrative} />

          {structured && (
            <ExplainWhy
              formula={structured.explainability?.formula}
              assumptions={structured.assumptions}
              tradeoffs={structured.explainability?.tradeoffs}
              extra={
                structured.sensitivity?.length ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sensitivity: </span>
                    {structured.sensitivity.join(' ')}
                  </div>
                ) : null
              }
            />
          )}

          {structured?.actionPlan?.length > 0 && (
            <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ACTION STEPS</h3>
              <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#e5e7eb', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {structured.actionPlan.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}

      {result && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {result.dimensions.map((d) => (
            <div key={d.key} className="glass-panel hover-lift" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: statusColor(d.status) }}>
                  {dimensionIcon(d.key)}
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.status}</span>
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: statusColor(d.status), fontVariantNumeric: 'tabular-nums' }}>{d.score}</span>
              </div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>{d.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.55 }}>{d.insight}</p>
            </div>
          ))}
        </div>
      )}

      {structured?.warnings?.length > 0 && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(245,176,65,0.2)', background: 'rgba(245,176,65,0.06)', fontSize: '0.82rem', color: '#fcd34d', lineHeight: 1.5 }}>
          <Sparkles size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          {structured.warnings[0]}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
