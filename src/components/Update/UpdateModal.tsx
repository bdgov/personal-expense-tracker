import React, { useState } from 'react';
import { UpdateApiResponse } from '../../types';
import { BackupService } from '../../services/backupService';
import { UpdateService } from '../../services/updateService';
import { useApp } from '../../context/AppContext';
import { Sparkles, Download, ShieldAlert, Check, X, FileSpreadsheet } from 'lucide-react';

interface UpdateModalProps {
  update: UpdateApiResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ update, isOpen, onClose }) => {
  const { showSnackbar } = useApp();
  const [step, setStep] = useState<'warning' | 'downloading' | 'complete'>('warning');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  if (!isOpen) return null;

  const handleBackupFirst = async () => {
    try {
      const filename = await BackupService.downloadBackupFile();
      showSnackbar(`ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে: ${filename}`);
    } catch {
      showSnackbar('ব্যাকআপ ডাউনলোডে সমস্যা হয়েছে।');
    }
  };

  const startDownload = async () => {
    if (!update.download_url) {
      setDownloadError('ডাউনলোড লিংক পাওয়া যায়নি।');
      return;
    }

    setStep('downloading');
    setDownloadProgress(0);
    setDownloadError('');

    const controller = new AbortController();
    setAbortController(controller);

    try {
      await UpdateService.downloadApk(
        update.download_url,
        (progress) => setDownloadProgress(progress),
        controller.signal
      );
      setStep('complete');
      showSnackbar('APK ডাউনলোড সম্পন্ন হয়েছে। ইনস্টল নিশ্চিত করুন।');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ডাউনলোডে ত্রুটি হয়েছে।';
      setDownloadError(msg);
      setStep('warning');
    }
  };

  const cancelDownload = () => {
    if (abortController) {
      abortController.abort();
    }
    setStep('warning');
    setDownloadProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                অ্যাপ আপডেট - ভার্সন {update.latest_version}
              </h3>
              <span className="text-[11px] text-slate-400">
                বর্তমান ভার্সন: {update.current_version}
              </span>
            </div>
          </div>
          {!update.mandatory && step !== 'downloading' && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Release Notes */}
        {update.release_notes && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              নতুন কী কী পরিবর্তন এসেছে:
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {update.release_notes}
            </p>
            {update.release_date && (
              <span className="block text-[10px] text-slate-400 mt-2">
                প্রকাশের তারিখ: {update.release_date}
              </span>
            )}
          </div>
        )}

        {/* Step 1: Backup Warning (Requirement 40) */}
        {step === 'warning' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">
                  আপডেট করার আগে আপনার গুরুত্বপূর্ণ ডাটার একটি Backup/Export তৈরি করে রাখুন।
                </span>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
                  কোনো কারণে আপডেটের পরে ডাটা হারিয়ে গেলে Export করা backup file থেকে Import করে ডাটা ফিরিয়ে আনতে পারবেন।
                </p>
              </div>
            </div>

            {downloadError && (
              <p className="text-xs text-rose-500 font-semibold">{downloadError}</p>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleBackupFirst}
                className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-100 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>ব্যাকআপ / এক্সপোর্ট করুন</span>
              </button>

              <div className="flex gap-2">
                {!update.mandatory && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition"
                  >
                    পরে
                  </button>
                )}
                <button
                  type="button"
                  onClick={startDownload}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>আপডেট করুন</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Downloading Progress */}
        {step === 'downloading' && (
          <div className="space-y-4 py-4 text-center">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              অ্যাপের নতুন ভার্সন ডাউনলোড হচ্ছে... {downloadProgress}%
            </span>

            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>

            <button
              onClick={cancelDownload}
              className="px-4 py-1.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition"
            >
              বাতিল করুন
            </button>
          </div>
        )}

        {/* Step 3: Complete & Install prompt */}
        {step === 'complete' && (
          <div className="space-y-4 py-3 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                ডাউনলোড সম্পন্ন হয়েছে!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                আপনার ব্রাউজার বা ডিভাইসের ডাউনলোড ফোল্ডারে APK ফাইলটি সংরক্ষিত হয়েছে। ইনস্টলেশন কনফার্ম করুন।
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 text-xs font-bold"
            >
              ঠিক আছে
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
