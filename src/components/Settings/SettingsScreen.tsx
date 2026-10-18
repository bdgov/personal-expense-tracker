import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryManagerModal } from './CategoryManagerModal';
import { RecurringModal } from '../Recurring/RecurringModal';
import { BackupService, APP_CURRENT_VERSION } from '../../services/backupService';
import { SecurityService } from '../../services/securityService';
import { NotificationService } from '../../services/notificationService';
import {
  User,
  Moon,
  Sun,
  Laptop,
  Bell,
  Lock,
  Tag,
  Repeat,
  Download,
  Upload,
  RefreshCw,
  Info,
  Fingerprint,
  Clock,
  Check,
  Shield,
  FileJson,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    settings,
    updateSettings,
    triggerUpdateCheck,
    showSnackbar,
    refreshData,
  } = useApp();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

  // Edit Name Dialog State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);

  // App Lock PIN Setup Dialog
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [targetLockType, setTargetLockType] = useState<'pin' | 'biometric'>('pin');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Import Dialog State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPkg, setImportPkg] = useState<any>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Checking updates loading state
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // 1. Profile Name Change
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    await updateUserProfile({ name: nameInput.trim() });
    setIsEditingName(false);
    showSnackbar('নাম পরিবর্তন সফল হয়েছে।');
  };

  // 2. Export / Backup
  const handleExportBackup = async () => {
    try {
      const filename = await BackupService.downloadBackupFile();
      showSnackbar(`ব্যাকআপ সফল হয়েছে: ${filename}`);
      await refreshData();
    } catch {
      showSnackbar('ব্যাকআপ ডাউনলোডে সমস্যা হয়েছে।');
    }
  };

  // 3. Import File Pick
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const validation = BackupService.validateBackupData(json);
        if (!validation.isValid || !validation.pkg) {
          alert(validation.error || 'এই backup fileটি সঠিক নয়।');
          return;
        }
        setImportPkg(validation.pkg);
        setIsImportModalOpen(true);
      } catch {
        alert('ফাইলটি সঠিক JSON ফরম্যাটে নেই।');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importPkg) return;
    const res = await BackupService.restoreBackup(importPkg, importMode);
    setIsImportModalOpen(false);
    setImportPkg(null);
    await refreshData();
    showSnackbar(res.message);
  };

  // 4. App Lock Setup
  const handleLockOptionSelect = async (type: 'off' | 'pin' | 'biometric') => {
    if (type === 'off') {
      await updateSettings({ appLockType: 'off', pinCode: undefined });
      showSnackbar('অ্যাপ লক বন্ধ করা হয়েছে।');
      return;
    }

    setTargetLockType(type);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    setIsSettingPin(true);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setPinError('পিন অবশ্যই ৪ সংখ্যার হতে হবে।');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('উভয় পিন কোড মিলছে না।');
      return;
    }

    if (targetLockType === 'biometric') {
      const isAvailable = await SecurityService.isBiometricAvailable();
      if (!isAvailable) {
        showSnackbar('ডিভাইসে বায়োমেট্রিক সাপোর্ট নেই, তবে পিন সেট করা হয়েছে।');
      } else {
        await SecurityService.registerBiometric();
      }
    }

    await updateSettings({
      appLockType: targetLockType,
      pinCode: newPin,
    });

    setIsSettingPin(false);
    showSnackbar(
      targetLockType === 'biometric'
        ? 'বায়োমেট্রিক ও পিন লক সক্রিয় করা হয়েছে।'
        : 'পিন লক সক্রিয় করা হয়েছে।'
    );
  };

  // 5. Test Daily Reminder
  const handleTestDailyReminder = () => {
    NotificationService.requestPermission();
    NotificationService.triggerDailyExpenseReminder();
    showSnackbar('রিমাইন্ডার নোটিফিকেশন পাঠানো হয়েছে!');
  };

  // 6. Manual Update Check
  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    await triggerUpdateCheck();
    setIsCheckingUpdate(false);
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          সেটিংস
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          প্রোফাইল, থিম, নিরাপত্তা এবং ডাটা ব্যাকআপ
        </p>
      </div>

      {/* 1. Profile Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          প্রোফাইল
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
              {userProfile.name ? userProfile.name.charAt(0) : 'ব'}
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-900 dark:text-white">
                {userProfile.name || 'নাম সেট করা নেই'}
              </span>
              <span className="block text-xs text-slate-400">ব্যক্তিগত অ্যাকাউন্ট</span>
            </div>
          </div>

          <button
            onClick={() => {
              setNameInput(userProfile.name);
              setIsEditingName(true);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            নাম পরিবর্তন
          </button>
        </div>
      </div>

      {/* 2. Appearance / Theme */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          অ্যাপ থিম (Appearance)
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', label: 'লাইট', icon: Sun },
            { id: 'dark', label: 'ডার্ক', icon: Moon },
            { id: 'system', label: 'সিস্টেম', icon: Laptop },
          ].map((themeOpt) => {
            const Icon = themeOpt.icon;
            const isSelected = settings.theme === themeOpt.id;
            return (
              <button
                key={themeOpt.id}
                onClick={() => updateSettings({ theme: themeOpt.id as any })}
                className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{themeOpt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Notifications & Daily Expense Reminder */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          নোটিফিকেশন ও অ্যালার্ট
        </h3>

        {/* General notification toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <div>
              <span className="block text-xs font-bold text-slate-900 dark:text-white">
                অ্যাপ নোটিফিকেশন
              </span>
              <span className="block text-[11px] text-slate-400">ডিভাইস অ্যালার্ট পাঠানো</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) => {
              NotificationService.requestPermission();
              updateSettings({ notificationsEnabled: e.target.checked });
            }}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
          />
        </div>

        {/* Budget alerts toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-500" />
            <div>
              <span className="block text-xs font-bold text-slate-900 dark:text-white">
                বাজেট সতর্কতা অ্যালার্ট
              </span>
              <span className="block text-[11px] text-slate-400">৮০% ও ১০০% অতিক্রম করলে সতর্কতা</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.budgetAlertsEnabled}
            onChange={(e) => updateSettings({ budgetAlertsEnabled: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
          />
        </div>

        {/* Daily Expense Reminder Feature */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  দৈনন্দিন খরচ রিমাইন্ডার
                </span>
                <span className="block text-[11px] text-slate-400">
                  "আজকের খরচগুলো যোগ করতে ভুলবেন না!"
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.dailyReminderEnabled}
              onChange={(e) => updateSettings({ dailyReminderEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {settings.dailyReminderEnabled && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  রিমাইন্ডার দেওয়ার সময়:
                </label>
                <input
                  type="time"
                  value={settings.dailyReminderTime || '21:00'}
                  onChange={(e) => updateSettings({ dailyReminderTime: e.target.value })}
                  className="mt-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                />
              </div>

              <button
                onClick={handleTestDailyReminder}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm transition"
              >
                টেস্ট নোটিফিকেশন
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Security & App Lock */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          অ্যাপ লক ও নিরাপত্তা
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'off', label: 'বন্ধ', icon: Lock },
            { id: 'pin', label: 'পিন লক', icon: Lock },
            { id: 'biometric', label: 'বায়োমেট্রিক', icon: Fingerprint },
          ].map((lockOpt) => {
            const isSelected = settings.appLockType === lockOpt.id;
            const Icon = lockOpt.icon;
            return (
              <button
                key={lockOpt.id}
                onClick={() => handleLockOptionSelect(lockOpt.id as any)}
                className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{lockOpt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Shortcuts to Categories & Recurring */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-900 dark:text-white">
                ক্যাটাগরি ব্যবস্থাপনা
              </span>
              <span className="block text-[11px] text-slate-400">নাম পরিবর্তন, আইকন ও প্রিয় তালিকা</span>
            </div>
          </div>
          <span className="text-xs text-indigo-600 font-bold">ম্যানেজ</span>
        </button>

        <button
          onClick={() => setIsRecurringModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-900 dark:text-white">
                পৌনঃপুনিক হিসাব (Recurring)
              </span>
              <span className="block text-[11px] text-slate-400">মাসিক বাসা ভাড়া, বিল ইত্যাদির অটো হিসাব</span>
            </div>
          </div>
          <span className="text-xs text-indigo-600 font-bold">ম্যানেজ</span>
        </button>
      </div>

      {/* 6. Backup & Restore (Requirements 30, 31, 32) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ব্যাকআপ ও পুনরুদ্ধার (Backup & Restore)
          </h3>
          {settings.lastBackupDate && (
            <span className="text-[10px] text-slate-400">
              সর্বশেষ ব্যাকআপ: {settings.lastBackupDate}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Export JSON button */}
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>ডাটা এক্সপোর্ট / ব্যাকআপ</span>
          </button>

          {/* Import JSON button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>ডাটা ইমপোর্ট করুন</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
        </div>
      </div>

      {/* 7. Update System (Requirements 33-36) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            আপডেট সিস্টেম
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            v{APP_CURRENT_VERSION}
          </span>
        </div>

        <button
          onClick={handleCheckUpdate}
          disabled={isCheckingUpdate}
          className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
          <span>{isCheckingUpdate ? 'চেক করা হচ্ছে...' : 'আপডেট চেক করুন'}</span>
        </button>
      </div>

      {/* 8. About App */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center font-bold text-2xl shadow-md shadow-indigo-600/30">
          ৳
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          ব্যক্তিগত খরচ (Personal Expense Tracker)
        </h4>
        <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
          ১০০% অফলাইন-ফার্স্ট বাংলা পার্সোনাল এক্সপেন্স ট্র্যাকার। আপনার আর্থিক ডাটা কোনো সার্ভারে যায় না, শুধুমাত্র আপনার ডিভাইসেই থাকে।
        </p>
      </div>

      {/* Name Edit Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              আপনার নাম পরিবর্তন করুন
            </h3>
            <form onSubmit={handleSaveName} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="নাম লিখুন"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md"
                >
                  সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN & Biometric Setup Modal */}
      {isSettingPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {targetLockType === 'biometric' ? 'বায়োমেট্রিক ও পিন সেট করুন' : '৪-সংখ্যার পিন কোড সেট করুন'}
            </h3>
            <p className="text-xs text-slate-400">
              অ্যাপ খোলার সময় এই পিন কোডটি প্রয়োজন হবে।
            </p>

            <form onSubmit={handleSavePin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  নতুন ৪-ডিজিট পিন
                </label>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center text-xl font-bold tracking-widest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পিন নিশ্চিত করুন
                </label>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center text-xl font-bold tracking-widest"
                />
              </div>

              {pinError && <p className="text-xs text-rose-500">{pinError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingPin(false)}
                  className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md"
                >
                  সেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Confirmation Dialog (Replace vs Merge) */}
      {isImportModalOpen && importPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 mx-auto flex items-center justify-center">
              <FileJson className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ব্যাকআপ ডাটা ইমপোর্ট করুন
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ফাইলে {importPkg.transactions?.length || 0} টি লেনদেন পাওয়া গেছে।
              </p>
            </div>

            {/* Mode selection (Requirement 31) */}
            <div className="space-y-2">
              <label
                onClick={() => setImportMode('merge')}
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  importMode === 'merge'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="mt-1"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    মার্জ করুন (Merge)
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    বিদ্যমান ডাটা বজায় রেখে শুধু নতুন লেনদেন যোগ করবে।
                  </span>
                </div>
              </label>

              <label
                onClick={() => setImportMode('replace')}
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  importMode === 'replace'
                    ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/50'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-1"
                />
                <div>
                  <span className="block text-xs font-bold text-rose-600">
                    প্রতিস্থাপন (Replace)
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    বিদ্যমান সব ডাটা মুছে ব্যাকআপ ফাইল থেকে রিস্টোর করবে।
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md"
              >
                ইমপোর্ট কনফার্ম
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
      />
    </div>
  );
};
