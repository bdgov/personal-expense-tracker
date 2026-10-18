/**
 * Clean Architecture Repository Layer for Bengali Expense Tracker
 * Handles all business logic, safe financial calculations, queries, and constraints.
 */

import { dbManager, DEFAULT_SETTINGS } from './indexedDb';
import { Transaction, Category, Budget, RecurringTransaction, UserProfile, AppSettings } from '../types';

export class AppRepository {
  // --- Transactions ---

  public static async getAllTransactions(): Promise<Transaction[]> {
    const list = await dbManager.getAll<Transaction>('transactions');
    return list.sort((a, b) => {
      // Sort by date desc, then time desc, then createdAt desc
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      if (b.time !== a.time) return b.time.localeCompare(a.time);
      return b.createdAt - a.createdAt;
    });
  }

  public static async getTransactionById(id: string): Promise<Transaction | undefined> {
    return dbManager.get<Transaction>('transactions', id);
  }

  public static async saveTransaction(tx: Transaction): Promise<void> {
    // Safe sanitize amount (positive, 2 decimals)
    const sanitizedAmount = Math.max(0, Math.round(tx.amount * 100) / 100);
    const updatedTx: Transaction = {
      ...tx,
      amount: sanitizedAmount,
      updatedAt: Date.now(),
    };
    await dbManager.put('transactions', updatedTx);
  }

  public static async deleteTransaction(id: string): Promise<Transaction | undefined> {
    const existing = await this.getTransactionById(id);
    if (existing) {
      await dbManager.delete('transactions', id);
    }
    return existing;
  }

  public static async restoreTransaction(tx: Transaction): Promise<void> {
    await dbManager.put('transactions', tx);
  }

  // --- Categories ---

  public static async getAllCategories(): Promise<Category[]> {
    return dbManager.getAll<Category>('categories');
  }

  public static async saveCategory(cat: Category): Promise<void> {
    await dbManager.put('categories', cat);
  }

  public static async deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
    // Check if category is used in existing transactions
    const transactions = await this.getAllTransactions();
    const isUsed = transactions.some((t) => t.categoryId === id);
    if (isUsed) {
      return {
        success: false,
        message: 'এই ক্যাটাগরিতে ইতিমধ্যে লেনদেন রয়েছে। এটি মোছা যাবে না।',
      };
    }
    await dbManager.delete('categories', id);
    return { success: true };
  }

  // --- Budgets ---

  public static async getBudgetForMonth(month: number, year: number): Promise<Budget | undefined> {
    const budgets = await dbManager.getAll<Budget>('budgets');
    return budgets.find((b) => b.month === month && b.year === year);
  }

  public static async saveBudget(budget: Budget): Promise<void> {
    await dbManager.put('budgets', budget);
  }

  // --- Recurring Transactions ---

  public static async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    return dbManager.getAll<RecurringTransaction>('recurring');
  }

  public static async saveRecurringTransaction(rec: RecurringTransaction): Promise<void> {
    await dbManager.put('recurring', rec);
  }

  public static async deleteRecurringTransaction(id: string): Promise<void> {
    await dbManager.delete('recurring', id);
  }

  public static async processDueRecurringTransactions(todayDate: string): Promise<number> {
    const recurringList = await this.getRecurringTransactions();
    let createdCount = 0;

    for (const rec of recurringList) {
      if (!rec.enabled) continue;

      if (rec.nextDate <= todayDate) {
        // Create an actual transaction for this
        const newTx: Transaction = {
          id: `tx_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: rec.type,
          amount: rec.amount,
          categoryId: rec.categoryId,
          categoryName: rec.categoryName,
          categoryIcon: rec.categoryIcon,
          sourceOrCategory: rec.categoryName,
          date: todayDate,
          time: '09:00',
          paymentMethod: rec.paymentMethod,
          note: rec.note ? `[স্বয়ংক্রিয়] ${rec.note}` : '[স্বয়ংক্রিয় পৌনঃপুনিক হিসাব]',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await this.saveTransaction(newTx);
        createdCount++;

        // Advance nextDate
        const currentNext = new Date(rec.nextDate);
        if (rec.frequency === 'daily') {
          currentNext.setDate(currentNext.getDate() + 1);
        } else if (rec.frequency === 'weekly') {
          currentNext.setDate(currentNext.getDate() + 7);
        } else if (rec.frequency === 'monthly') {
          currentNext.setMonth(currentNext.getMonth() + 1);
        }

        const nextYear = currentNext.getFullYear();
        const nextMonth = String(currentNext.getMonth() + 1).padStart(2, '0');
        const nextDay = String(currentNext.getDate()).padStart(2, '0');
        rec.nextDate = `${nextYear}-${nextMonth}-${nextDay}`;
        await this.saveRecurringTransaction(rec);
      }
    }

    return createdCount;
  }

  // --- Profile & Onboarding ---

  public static async getUserProfile(): Promise<UserProfile> {
    const res = await dbManager.get<{ key: string; value: UserProfile }>('profile', 'user_profile');
    if (res && res.value) {
      return res.value;
    }
    return { name: '', onboarded: false, joinedAt: Date.now() };
  }

  public static async saveUserProfile(profile: UserProfile): Promise<void> {
    await dbManager.put('profile', { key: 'user_profile', value: profile });
  }

  // --- App Settings ---

  public static async getSettings(): Promise<AppSettings> {
    const res = await dbManager.get<{ key: string; value: AppSettings }>('settings', 'app_settings');
    if (res && res.value) {
      return { ...DEFAULT_SETTINGS, ...res.value };
    }
    return DEFAULT_SETTINGS;
  }

  public static async saveSettings(settings: AppSettings): Promise<void> {
    await dbManager.put('settings', { key: 'app_settings', value: settings });
  }

  // --- Financial Calculations (100% Exact & Safe) ---

  public static calculateTotals(transactions: Transaction[]) {
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
      }
    }

    // Round to 2 decimals
    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpense = Math.round(totalExpense * 100) / 100;
    const balance = Math.round((totalIncome - totalExpense) * 100) / 100;
    const savings = balance; // Net savings

    return { totalIncome, totalExpense, balance, savings };
  }

  public static calculateMonthlySummary(transactions: Transaction[], year: number, month: number) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthTx = transactions.filter((t) => t.date.startsWith(prefix));

    const { totalIncome, totalExpense, savings } = this.calculateTotals(monthTx);

    // Calculate days elapsed in month or total days in past month
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
    const daysCount = isCurrentMonth ? Math.max(1, now.getDate()) : new Date(year, month, 0).getDate();
    const dailyAverage = Math.round((totalExpense / Math.max(1, daysCount)) * 100) / 100;

    // Highest spending category
    const catExpenses: Record<string, { name: string; icon: string; amount: number }> = {};
    for (const tx of monthTx) {
      if (tx.type === 'expense') {
        if (!catExpenses[tx.categoryId]) {
          catExpenses[tx.categoryId] = {
            name: tx.categoryName || tx.sourceOrCategory,
            icon: tx.categoryIcon,
            amount: 0,
          };
        }
        catExpenses[tx.categoryId].amount += tx.amount;
      }
    }

    let topCategory: { name: string; icon: string; amount: number } | null = null;
    let maxExpense = 0;
    for (const catId in catExpenses) {
      if (catExpenses[catId].amount > maxExpense) {
        maxExpense = catExpenses[catId].amount;
        topCategory = catExpenses[catId];
      }
    }

    return {
      monthTx,
      totalIncome,
      totalExpense,
      savings,
      dailyAverage,
      topCategory,
      transactionCount: monthTx.length,
    };
  }
}
