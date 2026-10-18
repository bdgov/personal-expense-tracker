import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already running standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (isInstalled || isDismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // Only render if installable or iOS
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
              হোম স্ক্রিনে অ্যাপ ইনস্টল করুন
            </span>
            <span className="block text-[10px] text-slate-500 truncate">
              ইন্টারনেট ছাড়াই সহজে সরাসরি ব্যবহার করতে
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ইনস্টল</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              আইফোনে ইনস্টল করার নিয়ম
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p>১. সাফারির নিচের <strong>Share (শেয়ার)</strong> বাটনে ট্যাপ করুন।</p>
              <p>২. নিচে স্ক্রল করে <strong>Add to Home Screen (হোম স্ক্রিনে যোগ করুন)</strong> নির্বাচন করুন।</p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </>
  );
};
