import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';

export const UndoSnackbar: React.FC = () => {
  const { snackbar, hideSnackbar } = useApp();

  return (
    <AnimatePresence>
      {snackbar && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/60 flex items-center justify-between gap-3"
        >
          <span className="text-xs font-medium truncate">{snackbar.text}</span>

          {snackbar.actionText && snackbar.onAction && (
            <button
              onClick={() => {
                snackbar.onAction?.();
                hideSnackbar();
              }}
              className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 shrink-0 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/60 active:scale-95 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{snackbar.actionText}</span>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
