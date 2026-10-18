import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { isLoading } = useApp();
  const [canFinish, setCanFinish] = useState(false);

  useEffect(() => {
    // Keep splash visible for 1200ms for smooth brand entrance
    const timer = setTimeout(() => {
      setCanFinish(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (canFinish && !isLoading) {
      onFinish();
    }
  }, [canFinish, isLoading, onFinish]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white p-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center"
        >
          {/* Logo container */}
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-1 shadow-2xl shadow-indigo-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
                <span className="text-4xl font-bold text-emerald-400 select-none">৳</span>
              </div>
            </div>
            {/* Subtle glow badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">✓</span>
            </div>
          </div>

          {/* App Title */}
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            ব্যক্তিগত খরচ
          </h1>
          <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">
            আপনার প্রতিদিনের হিসাব, সহজ ও নির্ভরযোগ্য
          </p>

          {/* Loading indicator bar */}
          <div className="mt-12 w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="w-full h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
