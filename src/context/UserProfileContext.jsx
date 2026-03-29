// ============================================================
// User Profile Context — Shared state across all modules
// ============================================================
import React, { createContext, useContext, useState } from 'react';

/** Baseline profile — no prefilled money values; onboarding + tools collect real inputs */
// eslint-disable-next-line react-refresh/only-export-components
export const emptyProfile = {
  name: '',
  currentAge: 0,
  retirementAge: 0,

  grossSalary: 0,
  basicSalary: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  hraReceived: 0,
  rentPaid: 0,
  isMetro: true,

  existingCorpus: 0,
  emergencyFund: 0,
  monthlySIP: 0,
  investmentTypes: [],

  lifeInsuranceCover: 0,
  healthInsuranceCover: 0,
  hasTermPlan: false,

  section80C: 0,
  section80D: 0,
  section80CCD_1B: 0,
  section80TTA: 0,
  homeLoanInterest: 0,
  otherDeductions: 0,
  filedOnTime: true,

  totalEMI: 0,

  hasPartner: false,
};

const UserProfileContext = createContext();

export function UserProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => ({ ...emptyProfile }));
  const [onboarded, setOnboarded] = useState(false);

  const updateProfile = (updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = (data) => {
    setProfile((prev) => ({ ...prev, ...data }));
    setOnboarded(true);
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, onboarded, completeOnboarding }}>
      {children}
    </UserProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
}
