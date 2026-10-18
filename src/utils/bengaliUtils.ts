/**
 * Bengali Language, Currency & Date Utilities for 'ব্যক্তিগত খরচ'
 */

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const BENGALI_DAYS = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
];

export const BENGALI_DAYS_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

/**
 * Convert number or string with English numbers to Bengali numerals
 */
export function toBengaliNumber(val: number | string): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

/**
 * Convert Bengali digits in a string to standard ASCII digits
 */
export function fromBengaliNumber(val: string): string {
  if (!val) return '';
  return val.replace(/[০-৯]/g, (bDigit) => ENGLISH_DIGITS[bDigit] || bDigit);
}

/**
 * Format currency in Bangladeshi Taka (৳)
 * Example: 25450 -> "৳ ২৫,৪৫০"
 */
export function formatBDT(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '৳ ০';
  }
  
  // Safe round to avoid floating point issues
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  let formattedNumber: string;
  if (showDecimals && absAmount % 1 !== 0) {
    formattedNumber = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    formattedNumber = Math.round(absAmount).toLocaleString('en-IN');
  }

  const bengaliNumber = toBengaliNumber(formattedNumber);
  return `${isNegative ? '-' : ''}৳ ${bengaliNumber}`;
}

/**
 * Format date to Bengali (e.g., '2026-10-18' -> '১৮ অক্টোবর ২০২৬')
 */
export function formatBengaliDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthName = BENGALI_MONTHS[month] || '';
  return `${toBengaliNumber(day)} ${monthName} ${toBengaliNumber(year)}`;
}

/**
 * Format current date header (e.g., '১৮ অক্টোবর ২০২৬, রবিবার')
 */
export function getTodayBengaliDateFormatted(): string {
  const now = new Date();
  const day = now.getDate();
  const monthName = BENGALI_MONTHS[now.getMonth()];
  const year = now.getFullYear();
  const dayName = BENGALI_DAYS[now.getDay()];

  return `${toBengaliNumber(day)} ${monthName} ${toBengaliNumber(year)}, ${dayName}`;
}

/**
 * Time-based greeting generator based on local device hours:
 * 05:00 - 11:59 -> সুপ্রভাত
 * 12:00 - 16:59 -> শুভ অপরাহ্ন
 * 17:00 - 20:59 -> শুভ সন্ধ্যা
 * 21:00 - 04:59 -> শুভ রাত্রি
 */
export function getTimeBasedGreeting(name: string): { greeting: string; icon: string } {
  const hour = new Date().getHours();
  const cleanName = name ? name.trim() : 'বন্ধু';

  if (hour >= 5 && hour < 12) {
    return {
      greeting: `সুপ্রভাত, ${cleanName}`,
      icon: '👋',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: `শুভ অপরাহ্ন, ${cleanName}`,
      icon: '☀️',
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: `শুভ সন্ধ্যা, ${cleanName}`,
      icon: '🌆',
    };
  } else {
    return {
      greeting: `শুভ রাত্রি, ${cleanName}`,
      icon: '🌙',
    };
  }
}

/**
 * Get ISO Date String 'YYYY-MM-DD' for today
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time string 'HH:mm'
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

/**
 * Safe Semantic Version Comparator
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  if (!v1 || !v2) return 0;
  
  // Clean version strings (e.g. 'v1.0.2' -> '1.0.2')
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}
