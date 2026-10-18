/**
 * Domain Models & Types for Bengali Personal Expense Tracker (ব্যক্তিগত খরচ)
 */

export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'নগদ' | 'ব্যাংক' | 'মোবাইল ব্যাংকিং' | 'কার্ড' | 'অন্যান্য';

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  type: TransactionType;
  isFavorite: boolean;
  color?: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // in BDT (safe number rounded to 2 decimals or integer)
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  sourceOrCategory: string; // display name (category for expense, source for income)
  date: string; // ISO format 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  paymentMethod: PaymentMethod;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  month: number; // 1 - 12
  year: number;
  amount: number;
  categoryBudgets?: Record<string, number>; // optional categoryId -> budgetAmount
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  frequency: RecurringFrequency;
  dayOfMonth?: number; // 1-31 for monthly
  dayOfWeek?: number; // 0-6 for weekly
  nextDate: string; // 'YYYY-MM-DD'
  note: string;
  paymentMethod: PaymentMethod;
  enabled: boolean;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  onboarded: boolean;
  joinedAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: 'BDT';
  notificationsEnabled: boolean;
  budgetAlertsEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // 'HH:mm', defaults to '21:00'
  lastDailyReminderDate?: string; // 'YYYY-MM-DD'
  appLockType: 'off' | 'pin' | 'biometric';
  pinCode?: string; // 4-digit PIN
  lastBackupDate?: string;
  autoCheckUpdates: boolean;
  viewMode: 'mobile' | 'expanded'; // Allows desktop users to toggle smartphone frame vs full width
}

export interface UpdateApiResponse {
  update_available: boolean;
  latest_version: string | null;
  current_version: string;
  download_url: string | null;
  release_notes: string | null;
  mandatory: boolean;
  release_date: string | null;
}

export interface ExportDataPackage {
  app: string;
  schema_version: number;
  app_version: string;
  export_date: string;
  user: UserProfile;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurring_transactions: RecurringTransaction[];
  settings: AppSettings;
}
