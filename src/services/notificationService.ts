/**
 * Notification Service for 'ব্যক্তিগত খরচ'
 * Handles Budget warnings, recurring reminders, and local notifications.
 */

export class NotificationService {
  public static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  public static showLocalNotification(title: string, body: string, icon = '/icon.svg'): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon,
          badge: icon,
        });
      } catch (e) {
        console.warn('Could not trigger native notification:', e);
      }
    }
  }

  public static checkBudgetAlert(percentage: number, remaining: number, enabled: boolean): { type: 'none' | 'warning' | 'danger'; message: string } {
    if (!enabled) return { type: 'none', message: '' };

    if (percentage >= 100) {
      const msg = 'সতর্কতা: এই মাসের পুরো বাজেট শেষ হয়ে গেছে!';
      this.showLocalNotification('ব্যক্তিগত খরচ - বাজেট সতর্কতা', msg);
      return { type: 'danger', message: msg };
    } else if (percentage >= 80) {
      const msg = `সতর্কতা: বাজেটের ৮০% এর বেশি খরচ হয়েছে! অবশিষ্ট আছে ৳ ${remaining}`;
      this.showLocalNotification('ব্যক্তিগত খরচ - বাজেট সতর্কতা', msg);
      return { type: 'warning', message: msg };
    }

    return { type: 'none', message: '' };
  }

  /**
   * Check if daily expense reminder should trigger
   * Encouraging Bengali message: 'আজকের খরচগুলো যোগ করতে ভুলবেন না!'
   */
  public static triggerDailyExpenseReminder(): void {
    const title = 'ব্যক্তিগত খরচ - দৈনন্দিন রিমাইন্ডার';
    const body = 'আজকের খরচগুলো যোগ করতে ভুলবেন না! আপনার আর্থিক হিসাব নিয়মিত ও সুশৃঙ্খল রাখুন।';
    this.showLocalNotification(title, body);
  }
}
