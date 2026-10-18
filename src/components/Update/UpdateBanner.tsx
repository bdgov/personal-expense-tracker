import React, { useState } from 'react';
import { UpdateApiResponse } from '../../types';
import { UpdateModal } from './UpdateModal';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight } from 'lucide-react';

interface UpdateBannerProps {
  update: UpdateApiResponse;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ update }) => {
  const { dismissUpdateBanner } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-emerald-500/15 border border-amber-300/40 dark:border-amber-700/40 p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-900 dark:text-amber-300">
                  🎉 নতুন আপডেট এসেছে!
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                  v{update.latest_version}
                </span>
              </div>
              {update.release_notes && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                  "{update.release_notes}"
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <span>আপডেট করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {!update.mandatory && (
            <button
              onClick={dismissUpdateBanner}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              পরে
            </button>
          )}
        </div>
      </div>

      <UpdateModal
        update={update}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
