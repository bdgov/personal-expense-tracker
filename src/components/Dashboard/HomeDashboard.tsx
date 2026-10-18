import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBDT, formatBengaliDate, BENGALI_MONTHS, toBengaliNumber } from '../../utils/bengaliUtils';
import { AppRepository } from '../../db/repository';
import { CategoryIcon } from '../Common/CategoryIcon';
import { UpdateBanner } from '../Update/UpdateBanner';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Calendar,
  Clock,
  ArrowRight,
  PlusCircle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const HomeDashboard: React.FC = () => {
  const {
    totals,
    todayExpense,
    thisMonthExpense,
    transactions,
    categories,
    currentBudget,
    openAddModal,
    setActiveTab,
    pendingUpdate,
  } = useApp();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthName = BENGALI_MONTHS[now.getMonth()];

  // Monthly summary calculations
  const monthlySummary = useMemo(() => {
    return AppRepository.calculateMonthlySummary(transactions, currentYear, currentMonth);
  }, [transactions, currentYear, currentMonth]);

  // Favorite categories for quick 1-tap entry
  const favoriteCategories = useMemo(() => {
    return categories.filter((c) => c.isFavorite).slice(0, 5);
  }, [categories]);

  // Recent 6 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  // Budget progress
  const budgetPercentage = currentBudget && currentBudget.amount > 0
    ? Math.round((thisMonthExpense / currentBudget.amount) * 100)
    : 0;

  return (
    <div className="space-y-5 pb-24">
      {/* 1. Update announcement banner if available */}
      {pendingUpdate?.update_available && <UpdateBanner update={pendingUpdate} />}

      {/* 2. Main Balance Card (Hero) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl shadow-indigo-950/20 border border-indigo-800/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>মোট ব্যালেন্স</span>
          </div>
          <span className="text-[11px] font-medium text-indigo-300/80 bg-indigo-800/40 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
            সর্বমোট
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4 tabular-nums">
          {formatBDT(totals.balance)}
        </div>

        {/* 2-Column Income & Expense stats within hero card */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] text-indigo-300 font-medium">মোট আয়</span>
              <span className="block text-sm sm:text-base font-bold text-emerald-300 truncate tabular-nums">
                {formatBDT(totals.totalIncome)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] text-indigo-300 font-medium">মোট খরচ</span>
              <span className="block text-sm sm:text-base font-bold text-rose-300 truncate tabular-nums">
                {formatBDT(totals.totalExpense)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Secondary Financial Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* Today's Expense */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate">আজকের খরচ</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate tabular-nums">
            {formatBDT(todayExpense)}
          </div>
        </div>

        {/* This Month's Expense */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span className="truncate">এই মাসের খরচ</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate tabular-nums">
            {formatBDT(thisMonthExpense)}
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
            <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
            <span className="truncate">মোট সঞ্চয়</span>
          </div>
          <div className={`text-base sm:text-lg font-bold truncate tabular-nums ${
            totals.savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatBDT(totals.savings)}
          </div>
        </div>
      </div>

      {/* 4. Monthly Summary Section (Detailed Requirement 10 & 58) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {monthName} {toBengaliNumber(currentYear)}-এর সারাংশ
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              দৈনিক গড় খরচ: {formatBDT(monthlySummary.dailyAverage)}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('reports')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>বিস্তারিত</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3">
          <div>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">আয়</span>
            <span className="block text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatBDT(monthlySummary.totalIncome)}
            </span>
          </div>
          <div className="border-x border-slate-200 dark:border-slate-700">
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">খরচ</span>
            <span className="block text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {formatBDT(monthlySummary.totalExpense)}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">সঞ্চয়</span>
            <span className="block text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatBDT(monthlySummary.savings)}
            </span>
          </div>
        </div>

        {/* Highest spending category highlight */}
        {monthlySummary.topCategory && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-amber-600 dark:text-amber-400 font-semibold shrink-0">সবচেয়ে বেশি খরচ:</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white truncate">
                <CategoryIcon iconName={monthlySummary.topCategory.icon} className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">{monthlySummary.topCategory.name}</span>
              </div>
            </div>
            <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
              {formatBDT(monthlySummary.topCategory.amount)}
            </span>
          </div>
        )}

        {/* Budget Progress Indicator if set */}
        {currentBudget && currentBudget.amount > 0 ? (
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-600 dark:text-slate-300">
                বাজেট: {formatBDT(currentBudget.amount)}
              </span>
              <span className={`tabular-nums ${
                budgetPercentage >= 100 ? 'text-rose-600 font-bold' : budgetPercentage >= 80 ? 'text-amber-600 font-bold' : 'text-slate-600 dark:text-slate-300'
              }`}>
                {toBengaliNumber(budgetPercentage)}% শেষ
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  budgetPercentage >= 100
                    ? 'bg-rose-500'
                    : budgetPercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, budgetPercentage)}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('budget')}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>এই মাসের বাজেট সেট করুন</span>
          </button>
        )}
      </div>

      {/* 5. Quick Category Entry (Requirements 19 & 51) */}
      {favoriteCategories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>দ্রুত খরচ যোগ করুন</span>
            </h3>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              ক্যাটাগরি ম্যানেজ
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {favoriteCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => openAddModal(cat.type)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-indigo-400 active:scale-95 transition shrink-0"
              >
                <CategoryIcon iconName={cat.icon} className="w-4 h-4" color={cat.color} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. Recent Transactions List (Requirements 13 & 58) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            সাম্প্রতিক লেনদেন
          </h3>
          {transactions.length > 0 && (
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          /* Empty State (Requirement 45) */
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800/80 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
              <PlusCircle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              এখনো কোনো লেনদেন যোগ করা হয়নি
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-xs mx-auto">
              আপনার প্রথম খরচ বা আয় যোগ করে নির্ভুল হিসাব রাখা শুরু করুন।
            </p>
            <button
              onClick={() => openAddModal('expense')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition"
            >
              প্রথম খরচ যোগ করুন
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => openAddModal(tx.type, tx)}
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === 'expense'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    }`}
                  >
                    <CategoryIcon iconName={tx.categoryIcon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tx.sourceOrCategory}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {formatBengaliDate(tx.date)} · {tx.paymentMethod} {tx.note ? `· ${tx.note}` : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span
                    className={`block text-xs sm:text-sm font-bold tabular-nums ${
                      tx.type === 'expense'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {tx.type === 'expense' ? '-' : '+'} {formatBDT(tx.amount)}
                  </span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {tx.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
