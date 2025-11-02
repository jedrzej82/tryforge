/**
 * Utility helper functions
 */

/**
 * Format a date string to a localized date
 * @param dateString - ISO date string
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(dateString: string, locale = 'en-US'): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Truncate text to a specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Debounce a function call
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Generate a random ID
 * @param prefix - Optional prefix for the ID
 * @returns Random ID string
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Class name utility for conditional classes
 * @param classes - Class names (can be string, undefined, or false)
 * @returns Combined class name string
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Check if code is running in browser
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Safe JSON parse with fallback
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Sleep for a specified duration
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
