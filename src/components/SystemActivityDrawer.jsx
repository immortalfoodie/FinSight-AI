import React, { useEffect } from 'react';
import { Activity, Network, Terminal, X } from 'lucide-react';

/**
 * Floating FAB + right drawer for orchestrator / agent logs.
 * Default: collapsed (FAB only). Open: slide-in drawer with scroll.
 */
export default function SystemActivityDrawer({
  logs,
  isOpen,
  onOpen,
  onClose,
  onHideCompletely,
  completelyHidden,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (completelyHidden) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="activity-fab"
          onClick={onOpen}
          aria-label="Open system activity — AI engine logs"
          title="System Activity"
        >
          <Activity size={22} strokeWidth={2.2} />
          <span className="activity-fab-pulse" aria-hidden />
        </button>
      )}

      {isOpen && (
        <div
          className="activity-drawer-backdrop"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="presentation"
          aria-hidden
        />
      )}

      <aside
        className={`activity-drawer glass-panel ${isOpen ? 'activity-drawer--open' : ''}`}
        aria-hidden={!isOpen}
        aria-modal={isOpen}
        role="dialog"
        aria-labelledby="activity-drawer-title"
      >
        <div className="activity-drawer-header">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <Network size={18} color="var(--accent-gold)" />
              <h2 id="activity-drawer-title" className="card-heading" style={{ fontSize: '1rem' }}>
                System Activity
              </h2>
              <span className="activity-live-badge">Live</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0', fontWeight: 500, letterSpacing: '-0.01em' }}>
              AI Engine Logs
            </p>
          </div>
          <button
            type="button"
            className="activity-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="activity-drawer-body">
          {logs.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Terminal size={28} style={{ opacity: 0.45, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>Waiting for agent events…</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Run any tool to see orchestrator routing.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="activity-log-item"
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'rgba(0,0,0,0.22)',
                  borderRadius: '8px',
                  borderLeft: `2px solid ${log.type === 'compute' ? 'var(--accent-amber)' : 'var(--success)'}`,
                  fontSize: '0.8125rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span
                    style={{
                      color: log.type === 'compute' ? 'var(--accent-amber)' : 'var(--text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    [{log.agent}]
                  </span>
                  <span className="font-mono-nums">{log.timestamp}</span>
                </div>
                <div style={{ color: log.error ? 'var(--danger)' : 'var(--text-primary)', lineHeight: 1.55 }}>
                  {log.message}
                </div>
                {log.cost && (
                  <div
                    style={{
                      marginTop: '0.35rem',
                      fontSize: '0.7rem',
                      color: 'var(--success)',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {log.cost}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="activity-drawer-footer">
          <button type="button" className="activity-hide-link" onClick={onHideCompletely}>
            Hide activity panel completely
          </button>
          <p className="activity-drawer-hint">You can restore it from the header anytime.</p>
        </div>
      </aside>
    </>
  );
}
