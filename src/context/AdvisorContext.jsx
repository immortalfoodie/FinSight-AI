// ============================================================
// Session memory, 6-area progress, financial snapshot
// ============================================================
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AdvisorContext = createContext(null);

export const AREA_TOTAL = 6;

/** Keys must match markAreaOptimized usage across pages */
export const AREA_KEYS = ['overview', 'fire', 'tax', 'life', 'couples', 'portfolio'];

/** Central snapshot of insights/savings calculated across modules */
// eslint-disable-next-line react-refresh/only-export-components
export const emptySnapshot = {
  baselineHealth: null,
  lastHealth: null,
  healthDelta: null,
  taxSavedAnnual: null,
  retirementShiftYears: null,
  netWorthAtRetirement: null,
};

const TAB_LABELS = {
  dashboard: 'Overview',
  firePlan: 'FIRE plan',
  taxWizard: 'Tax',
  lifeEvent: 'Life events',
  couplesPlan: 'Couples',
  portfolio: 'Portfolio',
};

const initialAreas = () =>
  AREA_KEYS.reduce((acc, k) => {
    acc[k] = false;
    return acc;
  }, {});

function buildGuidance(activeTab, memory, profile, worstGap, progressCount) {
  const name = profile?.name?.split(' ')?.[0] || 'there';
  const lines = [];

  const has = (s) => memory.some((m) => m.toLowerCase().includes(s.toLowerCase()));
  const taxDone = has('tax');
  const fireDone = has('fire');
  const portDone = has('portfolio');

  if (worstGap?.name) {
    lines.push({
      id: 'priority',
      tone: 'decisive',
      text: `Your ${worstGap.name.toLowerCase()} is your biggest gap right now. Fixing that first will move the needle more than polishing strengths — start there this week.`,
    });
  }

  lines.push({
    id: 'welcome',
    tone: 'calm',
    text:
      activeTab === 'dashboard'
        ? `Hi ${name} — here’s your snapshot. ${progressCount >= 4 ? 'You’ve engaged most areas; tighten the weakest link next.' : `Progress: ${progressCount}/${AREA_TOTAL} areas — run the remaining tools when you can.`}`
        : `You’re in ${TAB_LABELS[activeTab] || 'this section'}. We’ll stay decisive: one clear action beats ten vague tips.`,
  });

  if (taxDone && !fireDone) {
    lines.push({
      id: 'next-fire',
      tone: 'action',
      text: 'You’ve sized tax — now lock retirement: open FIRE Path and match SIP to real surplus.',
    });
  } else if (fireDone && !portDone) {
    lines.push({
      id: 'next-portfolio',
      tone: 'action',
      text: 'Long-term plan is set. Run Portfolio X-Ray next — cut overlap and fees before adding new funds.',
    });
  } else if (portDone && !taxDone) {
    lines.push({
      id: 'next-tax',
      tone: 'action',
      text: 'Holdings are reviewed. Run Tax Wizard — regime choice often beats another 0.5% fund pick.',
    });
  }

  if (memory.length > 0) {
    lines.push({
      id: 'memory',
      tone: 'memory',
      text: `Session: ${memory.slice(-2).join(' · ')}`,
    });
  }

  lines.push({
    id: 'fix',
    tone: 'insight',
      text: 'Change one input at a time in simulators — you’ll see sensitivity without false precision.',
  });

  return lines;
}

// eslint-disable-next-line react-refresh/only-export-components
export function AdvisorProvider({ children }) {
  const [memory, setMemory] = useState([]);
  const [areasOptimized, setAreasOptimized] = useState(initialAreas);
  const [snapshot, setSnapshot] = useState({
    baselineHealth: null,
    lastHealth: null,
    healthDelta: null,
    taxSavedAnnual: null,
    retirementShiftYears: null,
    netWorthAtRetirement: null,
  });
  const [worstGap, setWorstGap] = useState(null);

  const addMemory = useCallback((text) => {
    if (!text || !String(text).trim()) return;
    setMemory((prev) => [...prev.slice(-8), String(text).trim()].slice(-10));
  }, []);

  const clearMemory = useCallback(() => setMemory([]), []);

  const markAreaOptimized = useCallback((key) => {
    if (!AREA_KEYS.includes(key)) return;
    setAreasOptimized((prev) => ({ ...prev, [key]: true }));
  }, []);

  const updateSnapshot = useCallback((patch) => {
    setSnapshot((prev) => ({ ...prev, ...patch }));
  }, []);

  const setAdvisorWorstGap = useCallback((gap) => {
    setWorstGap(gap && gap.name ? { name: gap.name, key: gap.key, score: gap.score } : null);
  }, []);

  const recordHealthScore = useCallback((totalScore) => {
    setSnapshot((prev) => {
      if (prev.baselineHealth == null) {
        return { ...prev, baselineHealth: totalScore, lastHealth: totalScore, healthDelta: 0 };
      }
      return {
        ...prev,
        lastHealth: totalScore,
        healthDelta: totalScore - prev.baselineHealth,
      };
    });
  }, []);

  const progressCount = useMemo(() => AREA_KEYS.filter((k) => areasOptimized[k]).length, [areasOptimized]);

  const value = useMemo(
    () => ({
      memory,
      addMemory,
      clearMemory,
      areasOptimized,
      markAreaOptimized,
      snapshot,
      updateSnapshot,
      recordHealthScore,
      worstGap,
      setAdvisorWorstGap,
      progressCount,
    }),
    [
      memory,
      addMemory,
      clearMemory,
      areasOptimized,
      markAreaOptimized,
      snapshot,
      updateSnapshot,
      recordHealthScore,
      worstGap,
      setAdvisorWorstGap,
      progressCount,
    ],
  );

  return <AdvisorContext.Provider value={value}>{children}</AdvisorContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdvisor() {
  const ctx = useContext(AdvisorContext);
  if (!ctx) throw new Error('useAdvisor must be used within AdvisorProvider');
  return ctx;
}

export function useAdvisorGuidance(activeTab, profile) {
  const { memory, worstGap, progressCount } = useAdvisor();
  return useMemo(
    () => buildGuidance(activeTab, memory, profile, worstGap, progressCount),
    [activeTab, memory, profile, worstGap, progressCount],
  );
}
