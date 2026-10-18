import React from 'react';
import { useApp } from '../../context/AppContext';
import { getTimeBasedGreeting, getTodayBengaliDateFormatted } from '../../utils/bengaliUtils';
import { Settings, Sparkles, Smartphone, Monitor } from 'lucide-react';

export const TopAppBar: React.FC = () => {
  const { userProfile, pendingUpdate, setActiveTab, settings, updateSettings } = useApp();
  const { greeting, icon } = getTimeBasedGreeting(userProfile.name);
  const todayFormatted = getTodayBengaliDateFormatted();

  const toggleViewMode = () => {
    updateSettings({
      viewMode: settings.viewMode === 'mobile' ? 'expanded' : 'mobile',
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Greeting & Date */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 text-base shadow-sm">
            {userProfile.name ? userProfile.name.charAt(0) : 'ব'}
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5 leading-tight">
              <span>{greeting}</span>
              <span className="text-lg leading-none">{icon}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {todayFormatted}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Update Chip if available */}
          {pendingUpdate?.update_available && (
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition active:scale-95"
              title="নতুন আপডেট পাওয়া গেছে"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="hidden sm:inline">আপডেট</span>
            </button>
          )}

          {/* Desktop Responsive / Phone Frame toggle */}
          <button
            onClick={toggleViewMode}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title={settings.viewMode === 'mobile' ? 'ফুল স্ক্রিন ভিউ' : 'মোবাইল ফ্রেম ভিউ'}
          >
            {settings.viewMode === 'mobile' ? (
              <Monitor className="w-4 h-4" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
          </button>

          {/* Settings shortcut */}
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition active:scale-95"
            title="সেটিংস"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
