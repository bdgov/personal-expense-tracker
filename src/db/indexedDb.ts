/**
 * IndexedDB Persistent Local Database for Bengali Expense Tracker
 * Real, offline-first, transaction-safe storage.
 */

import { Category, Transaction, Budget, RecurringTransaction, UserProfile, AppSettings } from '../types';

const DB_NAME = 'PersonalExpenseTracker_DB';
const DB_VERSION = 1;

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'cat_food', name: 'খাবার', icon: 'Utensils', type: 'expense', isFavorite: true, color: '#f97316' },
  { id: 'cat_transport', name: 'যাতায়াত', icon: 'Bus', type: 'expense', isFavorite: true, color: '#0ea5e9' },
  { id: 'cat_grocery', name: 'বাজার', icon: 'ShoppingCart', type: 'expense', isFavorite: true, color: '#10b981' },
  { id: 'cat_bills', name: 'বিল', icon: 'Receipt', type: 'expense', isFavorite: false, color: '#eab308' },
  { id: 'cat_health', name: 'চিকিৎসা', icon: 'HeartPulse', type: 'expense', isFavorite: false, color: '#ef4444' },
  { id: 'cat_education', name: 'শিক্ষা', icon: 'GraduationCap', type: 'expense', isFavorite: false, color: '#8b5cf6' },
  { id: 'cat_house', name: 'বাসা', icon: 'Home', type: 'expense', isFavorite: false, color: '#6366f1' },
  { id: 'cat_shopping', name: 'শপিং', icon: 'ShoppingBag', type: 'expense', isFavorite: false, color: '#ec4899' },
  { id: 'cat_entertainment', name: 'বিনোদন', icon: 'Film', type: 'expense', isFavorite: false, color: '#14b8a6' },
  { id: 'cat_travel', name: 'ভ্রমণ', icon: 'Plane', type: 'expense', isFavorite: false, color: '#06b6d4' },
  { id: 'cat_other_exp', name: 'অন্যান্য', icon: 'MoreHorizontal', type: 'expense', isFavorite: false, color: '#64748b' },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'cat_salary', name: 'বেতন', icon: 'Briefcase', type: 'income', isFavorite: true, color: '#10b981' },
  { id: 'cat_business', name: 'ব্যবসা', icon: 'Store', type: 'income', isFavorite: true, color: '#3b82f6' },
  { id: 'cat_freelance', name: 'ফ্রিল্যান্সিং', icon: 'Laptop', type: 'income', isFavorite: false, color: '#8b5cf6' },
  { id: 'cat_investment', name: 'বিনিয়োগ', icon: 'TrendingUp', type: 'income', isFavorite: false, color: '#f59e0b' },
  { id: 'cat_gift', name: 'উপহার', icon: 'Gift', type: 'income', isFavorite: false, color: '#ec4899' },
  { id: 'cat_other_inc', name: 'অন্যান্য', icon: 'Coins', type: 'income', isFavorite: false, color: '#64748b' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  currency: 'BDT',
  notificationsEnabled: true,
  budgetAlertsEnabled: true,
  dailyReminderEnabled: true,
  dailyReminderTime: '21:00',
  appLockType: 'off',
  autoCheckUpdates: true,
  viewMode: 'mobile',
};

class DatabaseManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  public async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Transactions Store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by_date', 'date', { unique: false });
          txStore.createIndex('by_type', 'type', { unique: false });
          txStore.createIndex('by_category', 'categoryId', { unique: false });
          txStore.createIndex('by_createdAt', 'createdAt', { unique: false });
        }

        // Categories Store
        if (!db.objectStoreNames.contains('categories')) {
          const catStore = db.createObjectStore('categories', { keyPath: 'id' });
          catStore.createIndex('by_type', 'type', { unique: false });
          catStore.createIndex('by_favorite', 'isFavorite', { unique: false });
        }

        // Budgets Store
        if (!db.objectStoreNames.contains('budgets')) {
          const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
          budgetStore.createIndex('by_month_year', ['year', 'month'], { unique: true });
        }

        // Recurring Transactions Store
        if (!db.objectStoreNames.contains('recurring')) {
          const recStore = db.createObjectStore('recurring', { keyPath: 'id' });
          recStore.createIndex('by_enabled', 'enabled', { unique: false });
        }

        // Key-Value App Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // User Profile Store
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        await this.seedDefaultsIfNeeded(this.db);
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  private async seedDefaultsIfNeeded(db: IDBDatabase): Promise<void> {
    return new Promise((resolve) => {
      const tx = db.transaction(['categories', 'settings'], 'readwrite');
      const catStore = tx.objectStore('categories');
      const settingsStore = tx.objectStore('settings');

      const countReq = catStore.count();
      countReq.onsuccess = () => {
        if (countReq.result === 0) {
          const now = Date.now();
          [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].forEach((cat) => {
            catStore.add({ ...cat, createdAt: now });
          });
        }
      };

      const settingsReq = settingsStore.get('app_settings');
      settingsReq.onsuccess = () => {
        if (!settingsReq.result) {
          settingsStore.add({ key: 'app_settings', value: DEFAULT_SETTINGS });
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // Non-blocking
    });
  }

  // Generic Helpers
  public async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  public async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  public async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async clearStore(storeName: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const dbManager = new DatabaseManager();
