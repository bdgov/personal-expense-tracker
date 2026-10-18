import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBDT, formatBengaliDate, toBengaliNumber, BENGALI_MONTHS } from '../../utils/bengaliUtils';
import { CategoryIcon } from '../Common/CategoryIcon';
import { PieChart as PieIcon, BarChart3, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { transactions, setActiveTab } = useApp();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYearPrefix = `${now.getFullYear()}-`;

  // Start of week (Sunday)
  const dayOfWeek = now.getDay();
  const startOfWeekDate = new Date(now);
  startOfWeekDate.setDate(now.getDate() - dayOfWeek);
  const startOfWeekStr = `${startOfWeekDate.getFullYear()}-${String(startOfWeekDate.getMonth() + 1).padStart(2, '0')}-${String(startOfWeekDate.getDate()).padStart(2, '0')}`;

  // Filter transactions based on selected period
  const periodTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (period === 'daily') return tx.date === todayStr;
      if (period === 'weekly') return tx.date >= startOfWeekStr && tx.date <= todayStr;
      if (period === 'monthly') return tx.date.startsWith(currentMonthPrefix);
      if (period === 'yearly') return tx.date.startsWith(currentYearPrefix);
      return true;
    });
  }, [transactions, period, todayStr, startOfWeekStr, currentMonthPrefix, currentYearPrefix]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catMap: Record<string, { name: string; icon: string; amount: number; color?: string }> = {};

    periodTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
        if (!catMap[tx.categoryId]) {
          catMap[tx.categoryId] = {
            name: tx.categoryName || tx.sourceOrCategory,
            icon: tx.categoryIcon,
            amount: 0,
          };
        }
        catMap[tx.categoryId].amount += tx.amount;
      }
    });

    const categoriesArray = Object.values(catMap).sort((a, b) => b.amount - a.amount);
    const topCategory = categoriesArray[0] || null;
    const savings = income - expense;
    const count = periodTransactions.length;
    const avg = count > 0 ? expense / Math.max(1, count) : 0;

    return {
      income,
      expense,
      savings,
      avg: Math.round(avg * 100) / 100,
      categoriesArray,
      topCategory,
      count,
    };
  }, [periodTransactions]);

  // Distinct palette colors for donut slices
  const SLICE_COLORS = [
    '#4f46e5', '#f97316', '#10b981', '#ec4899', '#06b6d4',
    '#8b5cf6', '#eab308', '#ef4444', '#14b8a6', '#64748b'
  ];

  // Calculate SVG Doughnut Chart paths
  const donutSlices = useMemo(() => {
    if (metrics.expense <= 0 || metrics.categoriesArray.length === 0) return [];

    let accumulatedAngle = 0;
    return metrics.categoriesArray.map((cat, idx) => {
      const percentage = (cat.amount / metrics.expense) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;

      const color = SLICE_COLORS[idx % SLICE_COLORS.length];
      return {
        ...cat,
        percentage: Math.round(percentage * 10) / 10,
        startAngle,
        angle,
        color,
      };
    });
  }, [metrics.expense, metrics.categoriesArray]);

  return (
    <div className="space-y-5 pb-24">
      {/* Header and Period Filter Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            আর্থিক রিপোর্ট ও বিশ্লেষণ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            রিয়েল-টাইম আয়, ব্যয় ও ক্যাটাগরি চার্ট
          </p>
        </div>

        {/* Calendar View Button */}
        <button
          onClick={() => setActiveTab('calendar')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>ক্যালেন্ডার</span>
        </button>
      </div>

      {/* Period Segmented Control */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
        {(
          [
            { id: 'daily', label: 'দৈনিক' },
            { id: 'weekly', label: 'সাপ্তাহিক' },
            { id: 'monthly', label: 'মাসিক' },
            { id: 'yearly', label: 'বাৎসরিক' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              period === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">মোট আয়</span>
          <span className="block text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
            {formatBDT(metrics.income)}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">মোট খরচ</span>
          <span className="block text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5 tabular-nums">
            {formatBDT(metrics.expense)}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">নিট সঞ্চয়</span>
          <span className={`block text-sm sm:text-base font-bold mt-0.5 tabular-nums ${
            metrics.savings >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatBDT(metrics.savings)}
          </span>
        </div>
      </div>

      {/* Bar Comparison: Income vs Expense */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>আয় বনাম খরচ তুলনা</span>
        </h3>

        {metrics.income === 0 && metrics.expense === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">রিপোর্ট দেখানোর মতো পর্যাপ্ত তথ্য নেই।</p>
        ) : (
          <div className="space-y-3">
            {/* Income Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-700 dark:text-emerald-400">মোট আয়</span>
                <span className="tabular-nums font-bold text-slate-900 dark:text-white">{formatBDT(metrics.income)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (metrics.income / Math.max(metrics.income, metrics.expense, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Expense Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-rose-700 dark:text-rose-400">মোট খরচ</span>
                <span className="tabular-nums font-bold text-slate-900 dark:text-white">{formatBDT(metrics.expense)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (metrics.expense / Math.max(metrics.income, metrics.expense, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown Doughnut Chart & Legend */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <PieIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>খাতের বিস্তারিত বিশ্লেষণ (ক্যাটাগরি চার্ট)</span>
        </h3>

        {metrics.expense === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">এই সময়ে কোনো খরচের তথ্য নেই।</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* SVG Doughnut */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                {donutSlices.map((slice, i) => {
                  const strokeDasharray = `${(slice.percentage * Math.PI * 70) / 100} ${Math.PI * 70}`;
                  const strokeDashoffset = -donutSlices
                    .slice(0, i)
                    .reduce((sum, s) => sum + (s.percentage * Math.PI * 70) / 100, 0);

                  return (
                    <circle
                      key={slice.name}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="14"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  );
                })}
              </svg>
              {/* Center Total Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-medium">মোট ব্যয়</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatBDT(metrics.expense)}
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="flex-1 w-full space-y-2">
              {donutSlices.map((slice) => (
                <div key={slice.name} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {slice.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 tabular-nums">
                    <span className="font-bold text-slate-900 dark:text-white">{formatBDT(slice.amount)}</span>
                    <span className="text-[11px] text-slate-400 font-medium w-10 text-right">
                      {toBengaliNumber(slice.percentage)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
