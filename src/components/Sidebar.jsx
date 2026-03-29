import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  FileText,
  Briefcase,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const STORAGE_KEY = 'amm-sidebar-collapsed';

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const menuItems = [
    { id: 'dashboard', label: 'Money Health Score', icon: <LayoutDashboard size={20} strokeWidth={2} /> },
    { id: 'firePlan', label: 'FIRE Path Planner', icon: <TrendingUp size={20} strokeWidth={2} /> },
    { id: 'lifeEvent', label: 'Life Event Advisor', icon: <Briefcase size={20} strokeWidth={2} /> },
    { id: 'taxWizard', label: 'Tax Wizard', icon: <FileText size={20} strokeWidth={2} /> },
    { id: 'couplesPlan', label: 'Couples Planner', icon: <Users size={20} strokeWidth={2} /> },
    { id: 'portfolio', label: 'Portfolio X-Ray', icon: <ShieldAlert size={20} strokeWidth={2} /> },
  ];

  return (
    <aside
      className={`app-sidebar ${collapsed ? 'app-sidebar--collapsed' : ''}`}
      style={{
        borderRight: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.75rem 0',
      }}
    >
      {/* Header: toggle + brand */}
      <div
        style={{
          padding: collapsed ? '0 0.65rem' : '0 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: collapsed ? 'stretch' : 'center',
          gap: collapsed ? '0.75rem' : '0.5rem',
        }}
      >
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            minWidth: 0,
            flex: collapsed ? undefined : 1,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            className="font-mono-nums"
            style={{
              width: '36px',
              height: '36px',
              flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent-gold-light) 0%, var(--accent-amber) 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.8125rem',
              letterSpacing: '-0.02em',
            }}
            title="AI Money Mentor"
          >
            AI
          </div>
          <span className="sidebar-brand-title sidebar-text-reveal">Money Mentor</span>
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          padding: collapsed ? '0 0.5rem' : '0 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}
      >
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-btn ${isActive ? 'sidebar-nav-btn--active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '4px',
                    backgroundColor: 'var(--accent-gold)',
                    borderRadius: '0 4px 4px 0',
                    boxShadow: '0 0 10px var(--accent-glow)',
                  }}
                />
              )}
              <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>
              <span className="sidebar-nav-label sidebar-text-reveal">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: collapsed ? '0 0.5rem' : '0 1.5rem', marginTop: 'auto' }}>
        <button
          type="button"
          className="sidebar-footer-btn"
          title={collapsed ? 'Config Agent' : undefined}
        >
          <span style={{ display: 'flex', flexShrink: 0 }}>
            <Settings size={20} strokeWidth={2} />
          </span>
          <span className="sidebar-text-reveal" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            Config Agent
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
