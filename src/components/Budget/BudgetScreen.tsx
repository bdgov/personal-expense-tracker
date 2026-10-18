import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBDT, toBengaliNumber, BENGALI_MONTHS, fromBengaliNumber } from '../../utils/bengaliUtils';
import { CategoryIcon } from '../Common/CategoryIcon';
import { Target, AlertTriangle, ShieldAlert, CheckCircle2, Edit3, Plus, ArrowUpRight } from 'lucide-react';

export const BudgetScreen: React.FC = () => {
  const { currentBudget, thisMonthExpense, transactions, categories, saveBudget, openAddModal } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState(currentBudget ? String(currentBudget.amount) : '');
  const [error, setError] = useState('');

  const now = new Date();
  const currentMonthName = BENGALI_MONTHS[now.getMonth()];
  const currentYear = now.getFullYear();

  const budgetAmount = currentBudget?.amount || 0;
  const spentAmount = thisMonthExpense;
  const remainingAmount = Math.max(0, budgetAmount - spentAmount);
  const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const roundedPercentage = Math.round(percentage * 10) / 10;

  // Category breakdown for this month
  const prefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthExpenses = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(prefix));

  const catExpensesMap = thisMonthExpenses.reduce((acc, t) => {
    acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = fromBengaliNumber(budgetInput.trim());
    const val = parseFloat(cleanStr);
    if (!cleanStr || isNaN(val) || val <= 0) {
      setError('সঠিক বাজেট পরিমাণ লিখুন');
      return;
    }

    await saveBudget(val);
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header with Title and Set Budget Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            মাসিক বাজেট ট্র্যাকার
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentMonthName} {toBengaliNumber(currentYear)}-এর নির্ধারিত ব্যয়সীমা
          </p>
        </div>

        <button
          onClick={() => {
            setBudgetInput(budgetAmount > 0 ? String(budgetAmount) : '');
            setIsEditing(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition active:scale-95"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{budgetAmount > 0 ? 'বাজেট পরিবর্তন' : 'বাজেট সেট করুন'}</span>
        </button>
      </div>

      {/* Main Budget Progress Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">নির্ধারিত বাজেট</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {budgetAmount > 0 ? formatBDT(budgetAmount) : 'বাজেট নেই'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">ব্যয় হয়েছে</span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
              {formatBDT(spentAmount)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-600 dark:text-slate-400">
              অবশিষ্ট আছে: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBDT(remainingAmount)}</span>
            </span>
            <span className={`tabular-nums font-bold ${
              percentage >= 100 ? 'text-rose-600' : percentage >= 80 ? 'text-amber-600' : 'text-indigo-600 dark:text-indigo-400'
            }`}>
              {toBengaliNumber(roundedPercentage)}%
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentage >= 100
                  ? 'bg-rose-500'
                  : percentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
        </div>

        {/* Dynamic Warning Alert Boxes (Requirement 21) */}
        {percentage >= 100 ? (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="text-xs">
              <span className="font-bold block">সতর্কতা: বাজেটের সীমা অতিক্রম করেছে!</span>
              <span>
                আপনি আপনার নির্ধারিত বাজেটের চেয়ে {formatBDT(spentAmount - budgetAmount)} অতিরিক্ত খরচ করে ফেলেছেন। নতুন অপ্রয়োজনীয় খরচ নিয়ন্ত্রণ করুন।
              </span>
            </div>
          </div>
        ) : percentage >= 80 ? (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div className="text-xs">
              <span className="font-bold block">সতর্কতা: বাজেটের ৮০% এর বেশি খরচ হয়ে গেছে!</span>
              <span>
                এই মাসে আর মাত্র {formatBDT(remainingAmount)} অবশিষ্ট আছে। সতর্কতার সাথে ব্যয় পরিচালনা করুন।
              </span>
            </div>
          </div>
        ) : budgetAmount > 0 ? (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>আপনার খরচ বাজেটের নিরাপদ সীমার মধ্যে রয়েছে। সুন্দর আর্থিক শৃঙ্খলা বজায় রাখুন!</span>
          </div>
        ) : null}
      </div>

      {/* Category-wise spending breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          ক্যাটাগরি অনুযায়ী এই মাসের খরচ
        </h3>

        {categories
          .filter((c) => c.type === 'expense')
          .map((cat) => {
            const spent = catExpensesMap[cat.id] || 0;
            const catPercent = spentAmount > 0 ? (spent / spentAmount) * 100 : 0;

            return (
              <div key={cat.id} className="space-y-1.5 py-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CategoryIcon iconName={cat.icon} className="w-4 h-4" color={cat.color} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="font-bold text-slate-900 dark:text-white">{formatBDT(spent)}</span>
                    <span className="text-[11px] text-slate-400">({toBengaliNumber(Math.round(catPercent))}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, catPercent)}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Budget Set/Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {currentMonthName} মাসের বাজেট সেট করুন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              আপনার সম্ভাব্য মোট খরচের একটি লক্ষ্যমাত্রা নির্ধারণ করুন।
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বাজেট পরিমাণ (৳ BDT)
                </label>
                <input
                  type="text"
                  autoFocus
                  inputMode="decimal"
                  value={budgetInput}
                  onChange={(e) => {
                    setBudgetInput(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="যেমন: ২০০০০"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums"
                />
                {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
