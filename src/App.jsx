import React, { useState, useCallback } from 'react';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';
import './index.css';
import { UserProfileProvider, useUserProfile } from './context/UserProfileContext';
import { AdvisorProvider, useAdvisor, AREA_TOTAL } from './context/AdvisorContext';
import Sidebar from './components/Sidebar';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './pages/Dashboard';
import FirePlanner from './pages/FirePlanner';
import TaxWizard from './pages/TaxWizard';
import LifeEventAdvisor from './pages/LifeEventAdvisor';
import CouplesPlanner from './pages/CouplesPlanner';
import PortfolioXRay from './pages/PortfolioXRay';
import AdvisorPanel from './components/AdvisorPanel';
import SystemActivityDrawer from './components/SystemActivityDrawer';
import AIDisclaimer from './components/AIDisclaimer';

function AppInner() {
  const { profile, onboarded, completeOnboarding } = useUserProfile();
  const { progressCount } = useAdvisor();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [auditLogs, setAuditLogs] = useState([]);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [activityLogHidden, setActivityLogHidden] = useState(false);
  const [advisorPanelOpen, setAdvisorPanelOpen] = useState(true);

  const addLog = useCallback((log) => {
    setAuditLogs((prev) =>
      [{ id: Date.now() + Math.random(), timestamp: new Date().toLocaleTimeString(), ...log }, ...prev].slice(0, 100),
    );
  }, []);

  if (!onboarded) {
    return <OnboardingFlow onComplete={completeOnboarding} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard addLog={addLog} />;
      case 'firePlan':
        return <FirePlanner addLog={addLog} />;
      case 'taxWizard':
        return <TaxWizard addLog={addLog} />;
      case 'lifeEvent':
        return <LifeEventAdvisor addLog={addLog} />;
      case 'couplesPlan':
        return <CouplesPlanner addLog={addLog} />;
      case 'portfolio':
        return <PortfolioXRay addLog={addLog} />;
      default:
        return <Dashboard addLog={addLog} />;
    }
  };

  const displayName = profile.name ? profile.name.split(' ')[0] : 'User';

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <header className="main-header app-header-bar">
          <div className="app-header-bar__row">
            <div className="app-header-bar__welcome">
              <h1>
                Welcome back, <span className="text-gradient">{displayName}</span>
              </h1>
              <p
                className="text-weight-medium"
                style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', fontWeight: 400, marginTop: '0.5rem', lineHeight: 1.6 }}
              >
                Calm, decisive guidance — your data stays in this session.
              </p>
            </div>
            <div className="app-header-bar__actions">
              {activityLogHidden && (
                <button type="button" className="activity-restore-btn" onClick={() => setActivityLogHidden(false)}>
                  Show system activity
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAdvisorPanelOpen((o) => !o)}
                aria-pressed={advisorPanelOpen}
                title={advisorPanelOpen ? 'Hide AI advisor panel' : 'Show AI advisor panel'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                {advisorPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                <span style={{ fontSize: '0.82rem' }}>{advisorPanelOpen ? 'Hide advisor' : 'Show advisor'}</span>
              </button>
              <div className="glass-panel premium-glow" style={{ padding: '0.45rem 0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '20px', fontSize: '0.78rem' }}>
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                    boxShadow: '0 0 10px var(--success)',
                  }}
                />
                <span style={{ fontWeight: 600 }}>Advisors active</span>
              </div>
            </div>
          </div>

          <div className="app-header-bar__progress">
            <div className="header-progress-wrap header-progress-wrap--full">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>OPTIMIZATION PROGRESS</span>
                <span className="font-mono-nums" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-gold-light)' }}>
                  {progressCount}/{AREA_TOTAL} areas
                </span>
              </div>
              <div
                className="header-progress-track"
                style={{
                  height: '6px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                <div
                  className="header-progress-fill"
                  style={{
                    height: '100%',
                    width: `${(progressCount / AREA_TOTAL) * 100}%`,
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-emerald))',
                    boxShadow: '0 0 16px rgba(245, 176, 65, 0.35)',
                    transition: 'width 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, paddingBottom: '1rem' }}>{renderContent()}</div>

          {advisorPanelOpen && (
            <div style={{ width: 'min(320px, 32vw)', flexShrink: 0 }}>
              <AdvisorPanel activeTab={activeTab} profile={profile} />
            </div>
          )}
        </div>

        <AIDisclaimer variant="footer" />
      </div>

      <SystemActivityDrawer
        logs={auditLogs}
        isOpen={activityDrawerOpen}
        onOpen={() => setActivityDrawerOpen(true)}
        onClose={() => setActivityDrawerOpen(false)}
        onHideCompletely={() => {
          setActivityLogHidden(true);
          setActivityDrawerOpen(false);
        }}
        completelyHidden={activityLogHidden}
      />
    </div>
  );
}

function App() {
  return (
    <UserProfileProvider>
      <AdvisorProvider>
        <AppInner />
      </AdvisorProvider>
    </UserProfileProvider>
  );
}

export default App;
