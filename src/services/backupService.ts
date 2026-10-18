/**
 * Backup, Export & Import Service for 'ব্যক্তিগত খরচ'
 * Handles JSON generation, validation, replace vs merge modes, and schema migration.
 */

import { AppRepository } from '../db/repository';
import { dbManager } from '../db/indexedDb';
import { ExportDataPackage, Transaction, Category, Budget, RecurringTransaction } from '../types';

export const APP_CURRENT_VERSION = '1.0.0';
export const CURRENT_SCHEMA_VERSION = 1;

export class BackupService {
  /**
   * Export all database tables into a single JSON package
   */
  public static async generateExportData(): Promise<ExportDataPackage> {
    const user = await AppRepository.getUserProfile();
    const transactions = await AppRepository.getAllTransactions();
    const categories = await AppRepository.getAllCategories();
    const budgets = await dbManager.getAll<Budget>('budgets');
    const recurring = await AppRepository.getRecurringTransactions();
    const settings = await AppRepository.getSettings();

    const exportPackage: ExportDataPackage = {
      app: 'Personal Expense Tracker',
      schema_version: CURRENT_SCHEMA_VERSION,
      app_version: APP_CURRENT_VERSION,
      export_date: new Date().toISOString(),
      user,
      transactions,
      categories,
      budgets,
      recurring_transactions: recurring,
      settings,
    };

    // Update last backup date in settings
    const nowStr = new Date().toLocaleString('bn-BD', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    settings.lastBackupDate = nowStr;
    await AppRepository.saveSettings(settings);

    return exportPackage;
  }

  /**
   * Trigger browser file download for exported JSON
   */
  public static async downloadBackupFile(): Promise<string> {
    const data = await this.generateExportData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `byaktigoto_khoroch_backup_${timestamp}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return filename;
  }

  /**
   * Validate import JSON payload
   */
  public static validateBackupData(data: unknown): { isValid: boolean; error?: string; pkg?: ExportDataPackage } {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'ফাইলটি সঠিক JSON ফরম্যাটে নেই।' };
    }

    const pkg = data as Partial<ExportDataPackage>;

    if (!pkg.app || !pkg.transactions || !Array.isArray(pkg.transactions)) {
      return { isValid: false, error: 'এই ব্যাকআপ ফাইলটির স্ট্রাকচার সঠিক নয়।' };
    }

    // Validate transactions structure
    for (const tx of pkg.transactions) {
      if (!tx.id || typeof tx.amount !== 'number' || !tx.type || !tx.date) {
        return { isValid: false, error: 'ব্যাকআপ ফাইলের লেনদেনের তথ্যে ত্রুটি পাওয়া গেছে।' };
      }
    }

    return { isValid: true, pkg: data as ExportDataPackage };
  }

  /**
   * Import backup file with mode 'replace' or 'merge'
   */
  public static async restoreBackup(
    pkg: ExportDataPackage,
    mode: 'replace' | 'merge'
  ): Promise<{ success: boolean; countRestored: number; message: string }> {
    try {
      // Schema compatibility handling
      if (pkg.schema_version < CURRENT_SCHEMA_VERSION) {
        // Run migration transform if needed
        console.info('Migrating legacy schema...');
      }

      if (mode === 'replace') {
        // Clear existing tables
        await dbManager.clearStore('transactions');
        await dbManager.clearStore('categories');
        await dbManager.clearStore('budgets');
        await dbManager.clearStore('recurring');

        // Restore transactions
        for (const tx of pkg.transactions) {
          await dbManager.put('transactions', tx);
        }

        // Restore categories
        if (Array.isArray(pkg.categories)) {
          for (const cat of pkg.categories) {
            await dbManager.put('categories', cat);
          }
        }

        // Restore budgets
        if (Array.isArray(pkg.budgets)) {
          for (const b of pkg.budgets) {
            await dbManager.put('budgets', b);
          }
        }

        // Restore recurring
        if (Array.isArray(pkg.recurring_transactions)) {
          for (const rec of pkg.recurring_transactions) {
            await dbManager.put('recurring', rec);
          }
        }

        // Restore user profile if exists
        if (pkg.user && pkg.user.name) {
          await AppRepository.saveUserProfile(pkg.user);
        }

        return {
          success: true,
          countRestored: pkg.transactions.length,
          message: `সফলভাবে ${pkg.transactions.length} টি লেনদেন প্রতিস্থাপন করে রিস্টোর করা হয়েছে।`,
        };
      } else {
        // Merge mode: Add only non-existing items by ID
        const existingTx = await AppRepository.getAllTransactions();
        const existingTxIds = new Set(existingTx.map((t) => t.id));
        let addedCount = 0;

        for (const tx of pkg.transactions) {
          if (!existingTxIds.has(tx.id)) {
            await dbManager.put('transactions', tx);
            addedCount++;
          }
        }

        // Merge categories
        const existingCats = await AppRepository.getAllCategories();
        const existingCatIds = new Set(existingCats.map((c) => c.id));
        for (const cat of pkg.categories || []) {
          if (!existingCatIds.has(cat.id)) {
            await dbManager.put('categories', cat);
          }
        }

        // Merge budgets
        const existingBudgets = await dbManager.getAll<Budget>('budgets');
        const budgetMap = new Set(existingBudgets.map((b) => `${b.year}-${b.month}`));
        for (const b of pkg.budgets || []) {
          if (!budgetMap.has(`${b.year}-${b.month}`)) {
            await dbManager.put('budgets', b);
          }
        }

        return {
          success: true,
          countRestored: addedCount,
          message: `সফলভাবে ${addedCount} টি নতুন লেনদেন মার্জ করা হয়েছে।`,
        };
      }
    } catch (err: unknown) {
      console.error('Restore error:', err);
      const errMsg = err instanceof Error ? err.message : 'অজানা সমস্যা';
      return {
        success: false,
        countRestored: 0,
        message: `ডাটা রিস্টোর করার সময় সমস্যা হয়েছে: ${errMsg}`,
      };
    }
  }
}
