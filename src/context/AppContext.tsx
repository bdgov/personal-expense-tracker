/**
 * App State Context for 'ব্যক্তিগত খরচ'
 * Coordinates reactive state, persistence, undo operations, update alerts, and app lock.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Transaction,
  Category,
  Budget,
  RecurringTransaction,
  UserProfile,
  AppSettings,
  UpdateApiResponse,
  TransactionType,
} from '../types';
import { AppRepository } from '../db/repository';
import { UpdateService } from '../services/updateService';
import { NotificationService } from '../services/notificationService';
import { getTodayDateString } from '../utils/bengaliUtils';

interface SnackbarState {
  id: string;
  text: string;
  actionText?: string;
  onAction?: () => void;
}

interface AppContextType {
  userProfile: UserProfile;
  transactions: Transaction[];
  categories: Category[];
  currentBudget: Budget | null;
  recurringTransactions: RecurringTransaction[];
  settings: AppSettings;
  isLoading: boolean;
  isAppLocked: boolean;
  pendingUpdate: UpdateApiResponse | null;
  activeTab: 'home' | 'transactions' | 'reports' | 'budget' | 'settings' | 'calendar';
  isAddModalOpen: boolean;
  addModalType: TransactionType;
  editingTransaction: Transaction | null;
  snackbar: SnackbarState | null;
  // Calculations
  totals: { totalIncome: number; totalExpense: number; balance: number; savings: number };
  todayExpense: number;
  thisMonthExpense: number;
  // Actions
  setActiveTab: (tab: 'home' | 'transactions' | 'reports' | 'budget' | 'settings' | 'calendar') => void;
  openAddModal: (type: TransactionType, editTx?: Transaction | null) => void;
  closeAddModal: () => void;
  saveTransaction: (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  saveBudget: (amount: number, categoryBudgets?: Record<string, number>) => Promise<void>;
  saveCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<{ success: boolean; message?: string }>;
  toggleFavoriteCategory: (id: string) => Promise<void>;
  saveRecurring: (rec: RecurringTransaction) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  unlockApp: () => void;
  lockApp: () => void;
  triggerUpdateCheck: () => Promise<UpdateApiResponse | null>;
  dismissUpdateBanner: () => void;
  showSnackbar: (text: string, actionText?: string, onAction?: () => void) => void;
  hideSnackbar: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfileState] = useState<UserProfile>({ name: '', onboarded: false, joinedAt: Date.now() });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>({
    theme: 'system',
    currency: 'BDT',
    notificationsEnabled: true,
    budgetAlertsEnabled: true,
    dailyReminderEnabled: true,
    dailyReminderTime: '21:00',
    appLockType: 'off',
    autoCheckUpdates: true,
    viewMode: 'mobile',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<UpdateApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'transactions' | 'reports' | 'budget' | 'settings' | 'calendar'>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [lastDeletedTx, setLastDeletedTx] = useState<Transaction | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  // 1. Load initial data from persistent IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [profile, txList, catList, appSettings, recurring] = await Promise.all([
        AppRepository.getUserProfile(),
        AppRepository.getAllTransactions(),
        AppRepository.getAllCategories(),
        AppRepository.getSettings(),
        AppRepository.getRecurringTransactions(),
      ]);

      setUserProfileState(profile);
      setTransactions(txList);
      setCategories(catList);
      setSettingsState(appSettings);
      setRecurringTransactions(recurring);

      // Load current month budget
      const now = new Date();
      const budget = await AppRepository.getBudgetForMonth(now.getMonth() + 1, now.getFullYear());
      setCurrentBudget(budget || null);

      // Lock app if security enabled
      if (appSettings.appLockType !== 'off' && appSettings.pinCode) {
        setIsAppLocked(true);
      }

      // Check & process due recurring items
      await AppRepository.processDueRecurringTransactions(getTodayDateString());
    } catch (err) {
      console.error('Failed to load local database:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 2. Perform Update API check every app launch (Mandatory requirement #35)
  useEffect(() => {
    let isMounted = true;
    const runLaunchUpdateCheck = async () => {
      try {
        const updateResult = await UpdateService.checkForUpdate();
        if (isMounted && updateResult && updateResult.update_available) {
          setPendingUpdate(updateResult);
        }
      } catch (e) {
        console.warn('Silent update check caught:', e);
      }
    };

    // Small delay to let splash/render settle
    const timer = setTimeout(runLaunchUpdateCheck, 800);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // 3. Apply Theme to HTML Document
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // 4. Automated Daily Expense Reminder Checker
  useEffect(() => {
    if (!settings.dailyReminderEnabled) return;

    const checkReminder = () => {
      const todayStr = getTodayDateString();
      if (settings.lastDailyReminderDate === todayStr) return;

      const now = new Date();
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentH}:${currentM}`;

      // If current time reached or passed the scheduled reminder time
      if (currentTimeStr >= settings.dailyReminderTime) {
        NotificationService.triggerDailyExpenseReminder();
        // Mark as sent for today
        const updated = { ...settings, lastDailyReminderDate: todayStr };
        setSettingsState(updated);
        AppRepository.saveSettings(updated);
      }
    };

    // Run check on mount and interval
    checkReminder();
    const interval = setInterval(checkReminder, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [settings]);

  // Snackbars
  const showSnackbar = useCallback((text: string, actionText?: string, onAction?: () => void) => {
    const id = String(Date.now());
    setSnackbar({ id, text, actionText, onAction });
    setTimeout(() => {
      setSnackbar((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  // Calculations
  const totals = useMemo(() => {
    return AppRepository.calculateTotals(transactions);
  }, [transactions]);

  const todayExpense = useMemo(() => {
    const todayStr = getTodayDateString();
    return transactions
      .filter((t) => t.type === 'expense' && t.date === todayStr)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const thisMonthExpense = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(prefix))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Check budget warnings
  useEffect(() => {
    if (currentBudget && currentBudget.amount > 0 && settings.budgetAlertsEnabled) {
      const percentage = (thisMonthExpense / currentBudget.amount) * 100;
      const remaining = Math.max(0, currentBudget.amount - thisMonthExpense);
      NotificationService.checkBudgetAlert(percentage, remaining, settings.budgetAlertsEnabled);
    }
  }, [thisMonthExpense, currentBudget, settings.budgetAlertsEnabled]);

  // Modal actions
  const openAddModal = useCallback((type: TransactionType, editTx?: Transaction | null) => {
    setAddModalType(type);
    setEditingTransaction(editTx || null);
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  }, []);

  // Save Transaction
  const saveTransaction = useCallback(
    async (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => {
      const isEdit = Boolean(id);
      const newTx: Transaction = {
        ...txData,
        id: id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: isEdit && editingTransaction ? editingTransaction.createdAt : Date.now(),
        updatedAt: Date.now(),
      };

      await AppRepository.saveTransaction(newTx);
      await refreshData();
      showSnackbar(isEdit ? 'লেনদেন সফলভাবে আপডেট করা হয়েছে।' : 'নতুন লেনদেন সফলভাবে যোগ করা হয়েছে।');
    },
    [editingTransaction, refreshData, showSnackbar]
  );

  // Delete Transaction with Undo
  const deleteTransaction = useCallback(
    async (id: string) => {
      const deleted = await AppRepository.deleteTransaction(id);
      if (deleted) {
        setLastDeletedTx(deleted);
        await refreshData();
        showSnackbar('লেনদেনটি মুছে ফেলা হয়েছে', 'পুনরুদ্ধার', async () => {
          await AppRepository.restoreTransaction(deleted);
          await refreshData();
          setLastDeletedTx(null);
        });
      }
    },
    [refreshData, showSnackbar]
  );

  const undoDelete = useCallback(async () => {
    if (lastDeletedTx) {
      await AppRepository.restoreTransaction(lastDeletedTx);
      setLastDeletedTx(null);
      await refreshData();
      showSnackbar('লেনদেন পুনরুদ্ধার করা হয়েছে।');
    }
  }, [lastDeletedTx, refreshData, showSnackbar]);

  // Save Budget
  const saveBudget = useCallback(
    async (amount: number, categoryBudgets?: Record<string, number>) => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const newBudget: Budget = {
        id: `budget_${year}_${month}`,
        month,
        year,
        amount: Math.max(0, Math.round(amount * 100) / 100),
        categoryBudgets,
      };

      await AppRepository.saveBudget(newBudget);
      setCurrentBudget(newBudget);
      showSnackbar('এই মাসের বাজেট সফলভাবে সংরক্ষিত হয়েছে।');
    },
    [showSnackbar]
  );

  // Categories
  const saveCategory = useCallback(
    async (cat: Category) => {
      await AppRepository.saveCategory(cat);
      await refreshData();
      showSnackbar('ক্যাটাগরি সংরক্ষিত হয়েছে।');
    },
    [refreshData, showSnackbar]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const res = await AppRepository.deleteCategory(id);
      if (res.success) {
        await refreshData();
        showSnackbar('ক্যাটাগরি মুছে ফেলা হয়েছে।');
      } else {
        showSnackbar(res.message || 'ক্যাটাগরি মুছে ফেলা যায়নি।');
      }
      return res;
    },
    [refreshData, showSnackbar]
  );

  const toggleFavoriteCategory = useCallback(
    async (id: string) => {
      const cat = categories.find((c) => c.id === id);
      if (cat) {
        const updated = { ...cat, isFavorite: !cat.isFavorite };
        await AppRepository.saveCategory(updated);
        await refreshData();
      }
    },
    [categories, refreshData]
  );

  // Recurring
  const saveRecurring = useCallback(
    async (rec: RecurringTransaction) => {
      await AppRepository.saveRecurringTransaction(rec);
      await refreshData();
      showSnackbar('পৌনঃপুনিক হিসাব সংরক্ষিত হয়েছে।');
    },
    [refreshData, showSnackbar]
  );

  const deleteRecurring = useCallback(
    async (id: string) => {
      await AppRepository.deleteRecurringTransaction(id);
      await refreshData();
      showSnackbar('পৌনঃপুনিক হিসাব মুছে ফেলা হয়েছে।');
    },
    [refreshData, showSnackbar]
  );

  // Profile & Settings
  const updateUserProfile = useCallback(
    async (profile: Partial<UserProfile>) => {
      const updated = { ...userProfile, ...profile };
      await AppRepository.saveUserProfile(updated);
      setUserProfileState(updated);
    },
    [userProfile]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const updated = { ...settings, ...newSettings };
      await AppRepository.saveSettings(updated);
      setSettingsState(updated);
      showSnackbar('সেটিংস পরিবর্তন সংরক্ষিত হয়েছে।');
    },
    [settings, showSnackbar]
  );

  // Lock
  const unlockApp = useCallback(() => {
    setIsAppLocked(false);
  }, []);

  const lockApp = useCallback(() => {
    if (settings.appLockType !== 'off') {
      setIsAppLocked(true);
    }
  }, [settings.appLockType]);

  // Update Check
  const triggerUpdateCheck = useCallback(async () => {
    const res = await UpdateService.checkForUpdate();
    if (res && res.update_available) {
      setPendingUpdate(res);
      showSnackbar('🎉 নতুন আপডেট পাওয়া গেছে!');
    } else {
      showSnackbar('আপনার অ্যাপটি ইতিমধ্যে সর্বশেষ সংস্করণে রয়েছে।');
    }
    return res;
  }, [showSnackbar]);

  const dismissUpdateBanner = useCallback(() => {
    if (pendingUpdate && !pendingUpdate.mandatory) {
      setPendingUpdate(null);
    }
  }, [pendingUpdate]);

  const contextValue = useMemo(
    () => ({
      userProfile,
      transactions,
      categories,
      currentBudget,
      recurringTransactions,
      settings,
      isLoading,
      isAppLocked,
      pendingUpdate,
      activeTab,
      isAddModalOpen,
      addModalType,
      editingTransaction,
      snackbar,
      totals,
      todayExpense,
      thisMonthExpense,
      setActiveTab,
      openAddModal,
      closeAddModal,
      saveTransaction,
      deleteTransaction,
      undoDelete,
      saveBudget,
      saveCategory,
      deleteCategory,
      toggleFavoriteCategory,
      saveRecurring,
      deleteRecurring,
      updateUserProfile,
      updateSettings,
      unlockApp,
      lockApp,
      triggerUpdateCheck,
      dismissUpdateBanner,
      showSnackbar,
      hideSnackbar,
      refreshData,
    }),
    [
      userProfile,
      transactions,
      categories,
      currentBudget,
      recurringTransactions,
      settings,
      isLoading,
      isAppLocked,
      pendingUpdate,
      activeTab,
      isAddModalOpen,
      addModalType,
      editingTransaction,
      snackbar,
      totals,
      todayExpense,
      thisMonthExpense,
      setActiveTab,
      openAddModal,
      closeAddModal,
      saveTransaction,
      deleteTransaction,
      undoDelete,
      saveBudget,
      saveCategory,
      deleteCategory,
      toggleFavoriteCategory,
      saveRecurring,
      deleteRecurring,
      updateUserProfile,
      updateSettings,
      unlockApp,
      lockApp,
      triggerUpdateCheck,
      dismissUpdateBanner,
      showSnackbar,
      hideSnackbar,
      refreshData,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
