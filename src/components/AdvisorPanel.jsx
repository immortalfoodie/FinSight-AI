import React from 'react';
import { Sparkles, ArrowRight, Brain } from 'lucide-react';
import { useAdvisorGuidance } from '../context/AdvisorContext';
import AIDisclaimer from './AIDisclaimer.jsx';

const toneColor = (tone) => {
  if (tone === 'decisive') return 'var(--accent-emerald)';
  if (tone === 'action') return 'var(--accent-emerald)';
  if (tone === 'memory') return '#a78bfa';
  if (tone === 'insight') return 'var(--accent-gold)';
  return 'var(--text-secondary)';
};

export default function AdvisorPanel({ activeTab, profile }) {
  const lines = useAdvisorGuidance(activeTab, profile);

  return (
    <aside className="advisor-panel glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245,176,65,0.2), rgba(0,200,150,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={18} color="var(--accent-gold)" />
        </div>
        <div>
          <p className="section-eyebrow" style={{ marginBottom: '0.15rem' }}>AI advisor</p>
          <p className="type-display" style={{ fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Guidance mode</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
        {lines.map((line) => (
          <div
            key={line.id}
            className="advisor-line animate-fade-in"
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: `3px solid ${toneColor(line.tone)}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
              <Sparkles size={14} style={{ flexShrink: 0, marginTop: 2, opacity: 0.85 }} color={toneColor(line.tone)} />
              <p
                style={{
                  fontSize: line.tone === 'decisive' ? '0.88rem' : '0.82rem',
                  fontWeight: line.tone === 'decisive' ? 600 : 400,
                  lineHeight: 1.55,
                  color: line.tone === 'decisive' ? '#f9fafb' : '#e5e7eb',
                  margin: 0,
                }}
              >
                {line.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <AIDisclaimer variant="panel" />

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <ArrowRight size={12} />
        Next: follow the highlighted pillar in Overview, then open the matching tool.
      </div>
    </aside>
  );
}
