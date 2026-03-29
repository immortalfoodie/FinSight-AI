import React from 'react';
import { Flag, Sparkles } from 'lucide-react';

const fmtShort = (amount) => {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1)}L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

export default function FutureStory({ milestones, narrative }) {
  if (!milestones?.length) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem', minHeight: '120px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add income and corpus in onboarding (or FIRE Path) to see a personalised wealth story.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel future-story animate-fade-in" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(245,176,65,0.06), transparent 40%, rgba(0,200,150,0.04))', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={18} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Your future story</h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1rem' }}>{narrative}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '15px', top: '12px', bottom: '12px', width: '2px', background: 'linear-gradient(180deg, var(--accent-gold), var(--accent-emerald))', borderRadius: '2px', opacity: 0.5 }} />
          {milestones.map((m, i) => (
            <div
              key={`${m.age}-${i}`}
              className="future-story-node"
              style={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr',
                gap: '0.75rem',
                padding: '0.65rem 0',
                animation: `fadeSlideUp 0.5s ease ${i * 0.08}s both`,
              }}
            >
              <div style={{ textAlign: 'right', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold)', paddingTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                Age {m.age}
              </div>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <Flag size={14} color="var(--accent-emerald)" />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.label}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#e5e7eb', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(m.amount)}</span>
                  {m.highlight && <span> — {m.highlight}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
