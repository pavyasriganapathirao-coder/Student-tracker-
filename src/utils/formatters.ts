import { CurrencyCode, Category } from '../types';

export const CURRENCIES: Record<CurrencyCode, { symbol: string; label: string }> = {
  INR: { symbol: '₹', label: 'Indian Rupee (₹)' },
  USD: { symbol: '$', label: 'US Dollar ($)' },
  EUR: { symbol: '€', label: 'Euro (€)' },
  GBP: { symbol: '£', label: 'British Pound (£)' },
  JPY: { symbol: '¥', label: 'Japanese Yen (¥)' },
  CAD: { symbol: 'CA$', label: 'Canadian Dollar (CA$)' },
  AUD: { symbol: 'A$', label: 'Australian Dollar (A$)' },
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const symbol = CURRENCIES[currency]?.symbol || '₹';
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
  return `${symbol}${formatted}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateString: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  if (dateString === today) return 'Today';
  if (dateString === yesterday) return 'Yesterday';
  return formatDate(dateString);
}

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; bgLight: string; textLight: string; borderLight: string; icon: string }
> = {
  Food: {
    label: 'Food & Dining',
    color: '#F97316', // Orange
    bgLight: 'bg-orange-50 dark:bg-orange-950/40',
    textLight: 'text-orange-700 dark:text-orange-300',
    borderLight: 'border-orange-200 dark:border-orange-900/60',
    icon: 'UtensilsCrossed',
  },
  Travel: {
    label: 'Travel & Commute',
    color: '#0EA5E9', // Sky blue
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    textLight: 'text-sky-700 dark:text-sky-300',
    borderLight: 'border-sky-200 dark:border-sky-900/60',
    icon: 'Bus',
  },
  Education: {
    label: 'Education & Books',
    color: '#8B5CF6', // Purple
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    textLight: 'text-purple-700 dark:text-purple-300',
    borderLight: 'border-purple-200 dark:border-purple-900/60',
    icon: 'GraduationCap',
  },
  Shopping: {
    label: 'Shopping',
    color: '#EC4899', // Pink
    bgLight: 'bg-pink-50 dark:bg-pink-950/40',
    textLight: 'text-pink-700 dark:text-pink-300',
    borderLight: 'border-pink-200 dark:border-pink-900/60',
    icon: 'ShoppingBag',
  },
  Entertainment: {
    label: 'Entertainment',
    color: '#EAB308', // Yellow
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    textLight: 'text-amber-700 dark:text-amber-300',
    borderLight: 'border-amber-200 dark:border-amber-900/60',
    icon: 'Film',
  },
  Bills: {
    label: 'Bills & Utilities',
    color: '#10B981', // Emerald
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    textLight: 'text-emerald-700 dark:text-emerald-300',
    borderLight: 'border-emerald-200 dark:border-emerald-900/60',
    icon: 'Receipt',
  },
  Other: {
    label: 'Other',
    color: '#64748B', // Slate
    bgLight: 'bg-slate-100 dark:bg-slate-800/60',
    textLight: 'text-slate-700 dark:text-slate-300',
    borderLight: 'border-slate-200 dark:border-slate-700',
    icon: 'CircleEllipsis',
  },
};
