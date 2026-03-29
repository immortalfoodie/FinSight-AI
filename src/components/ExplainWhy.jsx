import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

/**
 * Expandable “Why this recommendation?” — formula, assumptions, trade-offs
 */
export default function ExplainWhy({
  title = 'Why this recommendation?',
  formula,
  assumptions = [],
  tradeoffs,
  extra,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasBody = formula || (assumptions && assumptions.length) || tradeoffs || extra;

  if (!hasBody) return null;

  return (
    <div className="explain-why glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="explain-why-trigger"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.85rem 1rem',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.88rem',
          fontWeight: 600,
          textAlign: 'left',
        }}
      >
        <BookOpen size={16} color="var(--accent-gold)" />
        {title}
        <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>
      {open && (
        <div
          className="animate-fade-in"
          style={{
            padding: '0 1rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.82rem',
            lineHeight: 1.55,
            color: 'var(--text-secondary)',
          }}
        >
          {formula && (
            <p style={{ marginBottom: '0.65rem' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Formula / logic: </span>
              {formula}
            </p>
          )}
          {assumptions?.length > 0 && (
            <div style={{ marginBottom: '0.65rem' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>Assumptions: </span>
              <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem' }}>
                {assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {tradeoffs && (
            <p style={{ marginBottom: '0.35rem' }}>
              <span style={{ color: '#93c5fd', fontWeight: 600 }}>Trade-offs: </span>
              {tradeoffs}
            </p>
          )}
          {extra}
        </div>
      )}
    </div>
  );
}
