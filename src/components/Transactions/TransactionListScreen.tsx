import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction, PaymentMethod } from '../../types';
import { formatBDT, formatBengaliDate, fromBengaliNumber } from '../../utils/bengaliUtils';
import { CategoryIcon } from '../Common/CategoryIcon';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Trash2,
  Edit2,
  X,
  Plus,
} from 'lucide-react';

export const TransactionListScreen: React.FC = () => {
  const {
    transactions,
    categories,
    openAddModal,
    deleteTransaction,
  } = useApp();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Custom Date Range
  const [isDateRangeActive, setIsDateRangeActive] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete Confirmation Dialog state
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Payment methods
  const paymentMethods: PaymentMethod[] = ['নগদ', 'ব্যাংক', 'মোবাইল ব্যাংকিং', 'কার্ড', 'অন্যান্য'];

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const englishQ = fromBengaliNumber(q);

      result = result.filter((tx) => {
        const catMatch = tx.categoryName.toLowerCase().includes(q) || tx.sourceOrCategory.toLowerCase().includes(q);
        const noteMatch = tx.note.toLowerCase().includes(q);
        const methodMatch = tx.paymentMethod.toLowerCase().includes(q);
        const dateMatch = tx.date.includes(q) || tx.date.includes(englishQ);
        const amountMatch = String(tx.amount).includes(englishQ) || String(tx.amount).includes(q);
        return catMatch || noteMatch || methodMatch || dateMatch || amountMatch;
      });
    }

    // 2. Type Filter
    if (filterType !== 'all') {
      result = result.filter((tx) => tx.type === filterType);
    }

    // 3. Category Filter
    if (filterCategory !== 'all') {
      result = result.filter((tx) => tx.categoryId === filterCategory);
    }

    // 4. Payment Method Filter
    if (filterPaymentMethod !== 'all') {
      result = result.filter((tx) => tx.paymentMethod === filterPaymentMethod);
    }

    // 5. Custom Date Range
    if (isDateRangeActive) {
      if (startDate) {
        result = result.filter((tx) => tx.date >= startDate);
      }
      if (endDate) {
        result = result.filter((tx) => tx.date <= endDate);
      }
    }

    // 6. Sorting
    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.createdAt - a.createdAt;
      }
      if (sortBy === 'date_asc') {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.createdAt - b.createdAt;
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [
    transactions,
    searchQuery,
    filterType,
    filterCategory,
    filterPaymentMethod,
    isDateRangeActive,
    startDate,
    endDate,
    sortBy,
  ]);

  // Range Summary
  const rangeSummary = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') inc += tx.amount;
      else exp += tx.amount;
    });
    const savings = inc - exp;
    const avg = filteredTransactions.length > 0 ? exp / Math.max(1, filteredTransactions.length) : 0;
    return {
      income: inc,
      expense: exp,
      savings,
      avg: Math.round(avg * 100) / 100,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const confirmDelete = async () => {
    if (deletingTx) {
      await deleteTransaction(deletingTx.id);
      setDeletingTx(null);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Global Real-Time Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ক্যাটাগরি, নোট, টাকা (২৫০), মাধ্যম দিয়ে খুঁজুন..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Filter Tabs & Date Range Toggle */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Type Segmented buttons */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              সব
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              খরচ
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              আয়
            </button>
          </div>

          {/* Date Range Button */}
          <button
            onClick={() => setIsDateRangeActive(!isDateRangeActive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
              isDateRangeActive
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>তারিখ নির্বাচন</span>
          </button>

          {/* Sort Selector */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="date_desc">তারিখ: নতুন আগে</option>
              <option value="date_asc">তারিখ: পুরোনো আগে</option>
              <option value="amount_desc">টাকা: সর্বোচ্চ আগে</option>
              <option value="amount_asc">টাকা: সর্বনিম্ন আগে</option>
            </select>
          </div>
        </div>

        {/* Category & Payment dropdown filters */}
        <div className="flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">সব ক্যাটাগরি</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === 'expense' ? 'খরচ' : 'আয়'})
              </option>
            ))}
          </select>

          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">সব পেমেন্ট মাধ্যম</option>
            {paymentMethods.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date Range Picker Container */}
        {isDateRangeActive && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  শুরুর তারিখ
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  শেষের তারিখ
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Custom Range Summary Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/60 text-center">
              <div>
                <span className="block text-[10px] text-slate-500">নির্বাচিত আয়</span>
                <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatBDT(rangeSummary.income)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">নির্বাচিত খরচ</span>
                <span className="block text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatBDT(rangeSummary.expense)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">নিট সঞ্চয়</span>
                <span className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {formatBDT(rangeSummary.savings)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Filtered Results Header */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
        <span>মোট লেনদেন: {filteredTransactions.length} টি</span>
        <span>
          খরচ: <span className="font-bold text-rose-600">{formatBDT(rangeSummary.expense)}</span>
        </span>
      </div>

      {/* 4. Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800/80 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">
            কোনো লেনদেনের রেকর্ড খুঁজে পাওয়া যায়নি।
          </p>
          <button
            onClick={() => openAddModal('expense')}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition"
          >
            নতুন লেনদেন যোগ করুন
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
            >
              <div
                onClick={() => openAddModal(tx.type, tx)}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              >
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tx.sourceOrCategory}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium shrink-0">
                      {tx.paymentMethod}
                    </span>
                  </div>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {formatBengaliDate(tx.date)} {tx.time ? `· ${tx.time}` : ''} {tx.note ? `· ${tx.note}` : ''}
                  </span>
                </div>
              </div>

              {/* Amount and Actions */}
              <div className="flex items-center gap-3 pl-3 shrink-0">
                <div className="text-right">
                  <span
                    className={`block text-xs sm:text-sm font-bold tabular-nums ${
                      tx.type === 'expense'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {tx.type === 'expense' ? '-' : '+'} {formatBDT(tx.amount)}
                  </span>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openAddModal(tx.type, tx)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                    title="সম্পাদনা করুন"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingTx(tx)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Delete Confirmation Dialog (Requirement 17) */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              আপনি কি এই লেনদেনটি মুছে ফেলতে চান?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {deletingTx.sourceOrCategory} ({formatBDT(deletingTx.amount)}) এর রেকর্ডটি মুছে যাবে। তবে আপনি পরে এটি পুনরুদ্ধার করতে পারবেন।
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeletingTx(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                বাতিল
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition"
              >
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
