/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/Splash/SplashScreen';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { TopAppBar } from './components/Navigation/TopAppBar';
import { BottomNav } from './components/Navigation/BottomNav';
import { HomeDashboard } from './components/Dashboard/HomeDashboard';
import { TransactionListScreen } from './components/Transactions/TransactionListScreen';
import { BudgetScreen } from './components/Budget/BudgetScreen';
import { ReportsScreen } from './components/Reports/ReportsScreen';
import { CalendarScreen } from './components/Calendar/CalendarScreen';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { AddTransactionModal } from './components/Transactions/AddTransactionModal';
import { UndoSnackbar } from './components/Common/UndoSnackbar';
import { AppLockOverlay } from './components/Security/AppLockOverlay';
import { PWAInstallBanner } from './components/Common/PWAInstallBanner';
import { Wifi, Battery, Signal } from 'lucide-react';
import { getCurrentTimeString } from './utils/bengaliUtils';

const MainAppLayout: React.FC = () => {
  const { userProfile, activeTab, settings, isAppLocked } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const currentTime = getCurrentTimeString();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start text-slate-900 dark:text-slate-50 transition-colors">
      {/* 1. Splash Screen on Launch */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* 2. First Launch Onboarding Modal */}
      {!showSplash && !userProfile.onboarded && (
        <OnboardingModal onComplete={() => {}} />
      )}

      {/* 3. App Lock Overlay if locked */}
      {isAppLocked && <AppLockOverlay />}

      {/* 4. App Container (Mobile Frame or Full Width Container) */}
      <div
        className={`w-full transition-all duration-300 flex flex-col ${
          settings.viewMode === 'mobile'
            ? 'max-w-md my-0 sm:my-6 sm:rounded-[40px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800 dark:sm:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden min-h-screen sm:min-h-[844px]'
            : 'max-w-4xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 px-4 sm:px-6'
        }`}
      >
        {/* Simulated Android Status Bar (Visible in phone frame mode) */}
        {settings.viewMode === 'mobile' && (
          <div className="hidden sm:flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 select-none bg-white dark:bg-slate-900">
            <span>{currentTime}</span>
            <div className="w-20 h-4 bg-slate-900 dark:bg-slate-950 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Top App Bar */}
        <TopAppBar />

        {/* Main Content View Container */}
        <main className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {/* In-app install banner */}
          <PWAInstallBanner />

          {activeTab === 'home' && <HomeDashboard />}
          {activeTab === 'transactions' && <TransactionListScreen />}
          {activeTab === 'reports' && <ReportsScreen />}
          {activeTab === 'budget' && <BudgetScreen />}
          {activeTab === 'calendar' && <CalendarScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </main>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>

      {/* Global Modals & Snackbars */}
      <AddTransactionModal />
      <UndoSnackbar />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppLayout />
    </AppProvider>
  );
}
