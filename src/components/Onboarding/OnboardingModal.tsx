import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { updateUserProfile, showSnackbar } = useApp();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserProfile({
        name: trimmed,
        onboarded: true,
      });
      showSnackbar(`স্বাগতম, ${trimmed}! আপনার হিসাব শুরু হলো।`);
      onComplete();
    } catch {
      setError('নাম সংরক্ষণে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
          <Sparkles className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          আপনার নাম কী?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          আপনার ব্যক্তিগত খরচ ও আয় ট্র্যাকিং শুরু করতে আপনার নামটি দিন। এটি শুধুমাত্র আপনার ডিভাইসেই সংরক্ষিত থাকবে।
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              আপনার নাম
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="আপনার নাম লিখুন"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {error && (
              <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
          >
            <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'শুরু করি'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
