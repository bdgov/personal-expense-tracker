import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { CategoryIcon } from '../Common/CategoryIcon';
import { Category, PaymentMethod, TransactionType } from '../../types';
import { getTodayDateString, getCurrentTimeString, formatBDT, fromBengaliNumber } from '../../utils/bengaliUtils';
import { X, Check, Star } from 'lucide-react';

export const AddTransactionModal: React.FC = () => {
  const {
    isAddModalOpen,
    closeAddModal,
    addModalType,
    editingTransaction,
    categories,
    saveTransaction,
    openAddModal,
  } = useApp();

  const [type, setType] = useState<TransactionType>(addModalType);
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('নগদ');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods: PaymentMethod[] = ['নগদ', 'ব্যাংক', 'মোবাইল ব্যাংকিং', 'কার্ড', 'অন্যান্য'];

  // Initialize form when opening or editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(String(editingTransaction.amount));
      setSelectedCategoryId(editingTransaction.categoryId);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time);
      setNote(editingTransaction.note || '');
      setPaymentMethod(editingTransaction.paymentMethod || 'নগদ');
    } else {
      setType(addModalType);
      setAmountStr('');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setNote('');
      setPaymentMethod('নগদ');

      // Default select first favorite category of this type
      const firstFav = categories.find((c) => c.type === addModalType && c.isFavorite);
      const firstCat = categories.find((c) => c.type === addModalType);
      setSelectedCategoryId(firstFav?.id || firstCat?.id || '');
    }
    setErrors({});
  }, [editingTransaction, addModalType, categories, isAddModalOpen]);

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.type === type);
  const favoriteCategories = availableCategories.filter((c) => c.isFavorite);
  const regularCategories = availableCategories.filter((c) => !c.isFavorite);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate amount
    const cleanAmountStr = fromBengaliNumber(amountStr.trim());
    const parsedAmount = parseFloat(cleanAmountStr);

    if (!cleanAmountStr) {
      newErrors.amount = 'পরিমাণ লিখুন';
    } else if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'সঠিক পরিমাণ লিখুন (০ এর বেশি)';
    }

    // Validate category
    const cat = availableCategories.find((c) => c.id === selectedCategoryId);
    if (!cat) {
      newErrors.category = type === 'expense' ? 'ক্যাটাগরি নির্বাচন করুন' : 'আয়ের উৎস নির্বাচন করুন';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!cat) return;

    try {
      setIsSubmitting(true);
      await saveTransaction(
        {
          type,
          amount: parsedAmount,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          sourceOrCategory: cat.name,
          date,
          time,
          paymentMethod,
          note: note.trim(),
        },
        editingTransaction?.id
      );
      closeAddModal();
    } catch (err) {
      console.error(err);
      setErrors({ form: 'লেনদেন সংরক্ষণে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAddModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
        >
          {/* Header Drag bar for mobile */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingTransaction
                ? 'লেনদেন সম্পাদনা'
                : type === 'expense'
                ? 'খরচ যোগ করুন'
                : 'আয় যোগ করুন'}
            </h2>
            <button
              onClick={closeAddModal}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Switcher Tabs (Income / Expense) */}
            {!editingTransaction && (
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    const firstExp = categories.find((c) => c.type === 'expense');
                    setSelectedCategoryId(firstExp?.id || '');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  খরচ (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    const firstInc = categories.find((c) => c.type === 'income');
                    setSelectedCategoryId(firstInc?.id || '');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    type === 'income'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  আয় (Income)
                </button>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                টাকার পরিমাণ (৳ BDT) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-xl">
                  ৳
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={amountStr}
                  onChange={(e) => {
                    setAmountStr(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  placeholder="০.০০"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-2xl font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.amount}</p>
              )}
            </div>

            {/* Favorite / Quick Categories */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {type === 'expense' ? 'ক্যাটাগরি নির্বাচন করুন' : 'আয়ের উৎস নির্বাচন করুন'} *
                </label>
                {favoriteCategories.length > 0 && (
                  <span className="text-[11px] text-amber-500 flex items-center gap-1 font-medium">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> প্রিয় ক্যাটাগরি
                  </span>
                )}
              </div>

              {/* Grid of categories */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                      }}
                      className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-center min-h-[64px] ${
                        isSelected
                          ? type === 'expense'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {cat.isFavorite && (
                        <Star className="absolute top-1.5 right-1.5 w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      )}
                      <div className="w-7 h-7 flex items-center justify-center">
                        <CategoryIcon iconName={cat.icon} className="w-5 h-5" color={cat.color} />
                      </div>
                      <span className="text-[11px] font-semibold mt-1 truncate max-w-full">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.category && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.category}</p>
              )}
            </div>

            {/* Date and Time row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  তারিখ
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  সময়
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                পেমেন্ট মাধ্যম
              </label>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      paymentMethod === pm
                        ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:border-indigo-600 border-slate-900 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Note / বিবরণ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                নোট বা মন্তব্য (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="যেমন: সুপারশপ থেকে কেনাকাটা..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] ${
                  type === 'expense'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'সংরক্ষণ হচ্ছে...'
                    : editingTransaction
                    ? 'পরিবর্তন সংরক্ষণ করুন'
                    : type === 'expense'
                    ? 'খরচ সংরক্ষণ করুন'
                    : 'আয় সংরক্ষণ করুন'}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
