export type Category = 
  | 'Food' 
  | 'Travel' 
  | 'Education' 
  | 'Shopping' 
  | 'Entertainment' 
  | 'Bills' 
  | 'Other';

export type PaymentMethod = 
  | 'Cash' 
  | 'UPI' 
  | 'Debit Card' 
  | 'Credit Card';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  description?: string;
  receiptImage?: string; // Base64 image
  isSplit?: boolean;
  createdAt: number;
}

export interface SplitFriend {
  id: string;
  name: string;
  amount: number;
  settled: boolean;
}

export interface BillSplit {
  id: string;
  title: string;
  totalAmount: number;
  paidBy: 'me' | string; // 'me' or friend's name
  date: string;
  friends: SplitFriend[]; // includes others who owe or are owed
  note?: string;
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  icon: string;
  category: string;
  createdAt: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string; // YYYY-MM-DD
  category: Category;
  paymentMethod: PaymentMethod;
  isActive: boolean;
  createdAt: number;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export interface CategoryBudget {
  category: Category;
  limit: number;
}

export interface UserSettings {
  studentName: string;
  monthlyBudget: number;
  categoryBudgets?: Partial<Record<Category, number>>;
  currency: CurrencyCode;
  darkMode: boolean;
  n8nWebhookUrl?: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'expenses' 
  | 'add' 
  | 'split' 
  | 'goals' 
  | 'subscriptions' 
  | 'budget' 
  | 'analytics' 
  | 'settings';

export interface FilterOptions {
  search: string;
  category: string;
  paymentMethod: string;
  dateRange: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}
