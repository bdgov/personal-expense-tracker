import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Home, Receipt, PieChart, Target, Settings, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openAddModal } = useApp();
  const [isFabOpen, setIsFabOpen] = useState(false);

  const navItems = [
    { id: 'home' as const, label: 'হোম', icon: Home },
    { id: 'transactions' as const, label: 'লেনদেন', icon: Receipt },
    { id: 'reports' as const, label: 'রিপোর্ট', icon: PieChart },
    { id: 'budget' as const, label: 'বাজেট', icon: Target },
    { id: 'settings' as const, label: 'সেটিংস', icon: Settings },
  ];

  const handleFabClick = () => {
    setIsFabOpen((prev) => !prev);
  };

  const handleSelectOption = (type: 'expense' | 'income') => {
    setIsFabOpen(false);
    openAddModal(type);
  };

  return (
    <>
      {/* Quick Action Sheet / FAB Overlay */}
      <AnimatePresence>
        {isFabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFabOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex flex-col justify-end p-4 pb-24"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">নতুন হিসাব যোগ করুন</h3>
                <button
                  onClick={() => setIsFabOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Add Expense Option */}
              <button
                onClick={() => handleSelectOption('expense')}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 font-semibold transition active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold">খরচ যোগ করুন</span>
                  <span className="block text-xs font-normal text-rose-600/80 dark:text-rose-400/80">
                    দৈনন্দিন বাজার, বিল, যাতায়াত ইত্যাদি
                  </span>
                </div>
              </button>

              {/* Add Income Option */}
              <button
                onClick={() => handleSelectOption('income')}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold transition active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold">আয় যোগ করুন</span>
                  <span className="block text-xs font-normal text-emerald-600/80 dark:text-emerald-400/80">
                    বেতন, ব্যবসা, ফ্রিল্যান্সিং ইত্যাদি
                  </span>
                </div>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) - Elevated and prominent */}
      <div className="fixed bottom-20 right-5 z-40 sm:right-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFabClick}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
            isFabOpen
              ? 'bg-slate-800 text-white rotate-45'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
          }`}
          aria-label="লেনদেন যোগ করুন"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </motion.button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 pb-safe transition-colors">
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsFabOpen(false);
                }}
                className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : ''}`} />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                    />
                  )}
                </div>
                <span className={`text-[11px] font-medium mt-1 leading-tight ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
