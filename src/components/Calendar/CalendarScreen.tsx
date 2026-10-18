import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BENGALI_MONTHS,
  BENGALI_DAYS_SHORT,
  toBengaliNumber,
  formatBDT,
  formatBengaliDate,
} from '../../utils/bengaliUtils';
import { CategoryIcon } from '../Common/CategoryIcon';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft } from 'lucide-react';

export const CalendarScreen: React.FC = () => {
  const { transactions, openAddModal, setActiveTab } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 for Sunday

  // Daily map of transactions
  const dailyTotalsMap = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    transactions.forEach((tx) => {
      if (tx.date.startsWith(prefix)) {
        if (!map[tx.date]) {
          map[tx.date] = { income: 0, expense: 0, count: 0 };
        }
        if (tx.type === 'income') {
          map[tx.date].income += tx.amount;
        } else {
          map[tx.date].expense += tx.amount;
        }
        map[tx.date].count += 1;
      }
    });

    return map;
  }, [transactions, year, month]);

  // Selected date's transactions
  const selectedDayTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === selectedDateStr);
  }, [transactions, selectedDateStr]);

  const selectedDayTotals = useMemo(() => {
    const totals = { income: 0, expense: 0 };
    selectedDayTransactions.forEach((t) => {
      if (t.type === 'income') totals.income += t.amount;
      else totals.expense += t.amount;
    });
    return totals;
  }, [selectedDayTransactions]);

  return (
    <div className="space-y-4 pb-24">
      {/* Header with Back to Reports button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('reports')}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>রিপোর্টে ফিরুন</span>
        </button>

        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          ক্যালেন্ডার ভিউ
        </h2>

        <div className="w-16" />
      </div>

      {/* Calendar Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-base font-bold text-slate-900 dark:text-white">
            {BENGALI_MONTHS[month]} {toBengaliNumber(year)}
          </span>

          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {BENGALI_DAYS_SHORT.map((dayName, idx) => (
            <span
              key={dayName}
              className={`text-xs font-bold py-1 ${
                idx === 5 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {dayName}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14 sm:h-16" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = selectedDateStr === dateStr;
            const dayData = dailyTotalsMap[dateStr];

            const isToday =
              new Date().getFullYear() === year &&
              new Date().getMonth() === month &&
              new Date().getDate() === dayNum;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-14 sm:h-16 rounded-2xl flex flex-col items-center justify-between p-1 transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                    : isToday
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-900 dark:text-white'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className={`text-xs font-bold leading-none mt-0.5 ${isSelected ? 'text-white' : ''}`}>
                  {toBengaliNumber(dayNum)}
                </span>

                {/* Dots / indicator badges for Income and Expense */}
                <div className="flex flex-col items-center gap-0.5 w-full">
                  {dayData && dayData.expense > 0 && (
                    <span
                      className={`text-[9px] font-bold truncate max-w-full leading-none ${
                        isSelected ? 'text-rose-200' : 'text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      -{toBengaliNumber(Math.round(dayData.expense))}
                    </span>
                  )}
                  {dayData && dayData.income > 0 && (
                    <span
                      className={`text-[9px] font-bold truncate max-w-full leading-none ${
                        isSelected ? 'text-emerald-200' : 'text-emerald-500 dark:text-emerald-400'
                      }`}
                    >
                      +{toBengaliNumber(Math.round(dayData.income))}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {formatBengaliDate(selectedDateStr)}-এর হিসাব
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              আয়: <span className="font-semibold text-emerald-600">{formatBDT(selectedDayTotals.income)}</span> · খরচ: <span className="font-semibold text-rose-600">{formatBDT(selectedDayTotals.expense)}</span>
            </p>
          </div>

          <button
            onClick={() => openAddModal('expense')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>যোগ করুন</span>
          </button>
        </div>

        {selectedDayTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            এই তারিখে কোনো লেনদেনের রেকর্ড নেই।
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {selectedDayTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => openAddModal(tx.type, tx)}
                className="flex items-center justify-between py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'expense'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60'
                    }`}
                  >
                    <CategoryIcon iconName={tx.categoryIcon} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tx.sourceOrCategory}
                    </span>
                    <span className="block text-[10px] text-slate-400 truncate">
                      {tx.time} · {tx.paymentMethod} {tx.note ? `· ${tx.note}` : ''}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold tabular-nums pl-2 ${
                    tx.type === 'expense'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {tx.type === 'expense' ? '-' : '+'} {formatBDT(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
