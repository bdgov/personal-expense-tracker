import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RecurringTransaction, RecurringFrequency, PaymentMethod, TransactionType } from '../../types';
import { formatBDT, getTodayDateString, fromBengaliNumber } from '../../utils/bengaliUtils';
import { CategoryIcon } from '../Common/CategoryIcon';
import { AppRepository } from '../../db/repository';
import { Repeat, Plus, Trash2, X, Check, Calendar } from 'lucide-react';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({ isOpen, onClose }) => {
  const { recurringTransactions, categories, saveRecurring, deleteRecurring, showSnackbar, refreshData } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [note, setNote] = useState('');
  const [nextDate, setNextDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ব্যাংক');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const availableCategories = categories.filter((c) => c.type === type);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = fromBengaliNumber(amountStr.trim());
    const val = parseFloat(cleanAmount);
    if (!cleanAmount || isNaN(val) || val <= 0) {
      setError('সঠিক পরিমাণ লিখুন');
      return;
    }

    const cat = availableCategories.find((c) => c.id === selectedCategoryId) || availableCategories[0];
    if (!cat) {
      setError('ক্যাটাগরি নির্বাচন করুন');
      return;
    }

    const newRec: RecurringTransaction = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      amount: val,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      frequency,
      nextDate,
      note: note.trim(),
      paymentMethod,
      enabled: true,
      createdAt: Date.now(),
    };

    await saveRecurring(newRec);
    setIsAdding(false);
    setAmountStr('');
    setNote('');
    setError('');
  };

  const handleProcessDueNow = async () => {
    const count = await AppRepository.processDueRecurringTransactions(getTodayDateString());
    await refreshData();
    if (count > 0) {
      showSnackbar(`${count} টি নির্ধারিত পৌনঃপুনিক লেনদেন তৈরি হয়েছে।`);
    } else {
      showSnackbar('আজ প্রসেস করার মতো কোনো বকেয়া লেনদেন নেই।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              পৌনঃপুনিক হিসাব (Recurring)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action button bar */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন পৌনঃপুনিক যোগ</span>
          </button>
          <button
            onClick={handleProcessDueNow}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            আজকের হিসাব প্রসেস
          </button>
        </div>

        {/* Add Form */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
                  type === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                খরচ
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
                  type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                আয়
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                পরিমাণ (৳)
              </label>
              <input
                type="text"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="যেমন: ১০০০০"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ক্যাটাগরি
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পৌনঃপুনিক ধরন
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                >
                  <option value="daily">প্রতিদিন</option>
                  <option value="weekly">সাপ্তাহিক</option>
                  <option value="monthly">মাসিক</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শুরুর তারিখ
                </label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                বিবরণ / নোট
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="যেমন: বাসা ভাড়া, ইন্টারনেট বিল..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
              />
            </div>

            {error && <p className="text-xs text-rose-500">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                যোগ করুন
              </button>
            </div>
          </form>
        )}

        {/* Existing recurring items list */}
        <div className="space-y-2">
          {recurringTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              কোনো পৌনঃপুনিক হিসাব সংরক্ষিত নেই।
            </p>
          ) : (
            recurringTransactions.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      rec.type === 'expense'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60'
                    }`}
                  >
                    <CategoryIcon iconName={rec.categoryIcon} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                      {rec.categoryName} ({formatBDT(rec.amount)})
                    </span>
                    <span className="block text-[10px] text-slate-400 truncate">
                      {rec.frequency === 'monthly' ? 'মাসিক' : rec.frequency === 'weekly' ? 'সাপ্তাহিক' : 'প্রতিদিন'} · পরবর্তী: {rec.nextDate} {rec.note ? `· ${rec.note}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveRecurring({ ...rec, enabled: !rec.enabled })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      rec.enabled
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}
                  >
                    {rec.enabled ? 'সক্রিয়' : 'বন্ধ'}
                  </button>
                  <button
                    onClick={() => deleteRecurring(rec.id)}
                    className="text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
