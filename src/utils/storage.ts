import { Expense, UserSettings, BillSplit, SavingsGoal, Subscription } from '../types';

const EXPENSES_STORAGE_KEY = 'spendwise_expenses_v1';
const SETTINGS_STORAGE_KEY = 'spendwise_settings_v1';
const SPLITS_STORAGE_KEY = 'spendwise_splits_v1';
const GOALS_STORAGE_KEY = 'spendwise_goals_v1';
const SUBS_STORAGE_KEY = 'spendwise_subs_v1';

export const DEFAULT_N8N_WEBHOOK_URL = 'https://pavyasri.app.n8n.cloud/webhook/af471ff1-5b12-41ce-840d-184250ad59bb/chat';

export const DEFAULT_SETTINGS: UserSettings = {
  studentName: 'Alex Sharma',
  monthlyBudget: 5000,
  categoryBudgets: {
    Food: 2200,
    Travel: 700,
    Education: 800,
    Shopping: 500,
    Entertainment: 500,
    Bills: 300,
    Other: 200,
  },
  currency: 'INR',
  darkMode: false,
  n8nWebhookUrl: DEFAULT_N8N_WEBHOOK_URL,
};

// Generates realistic dates relative to current date
function getRelativeDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export const SAMPLE_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'Canteen Lunch & Juice',
    amount: 120,
    category: 'Food',
    date: getRelativeDateStr(0),
    paymentMethod: 'UPI',
    description: 'Thali and fresh juice at campus cafeteria',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'exp-2',
    title: 'Metro / City Bus Pass',
    amount: 40,
    category: 'Travel',
    date: getRelativeDateStr(0),
    paymentMethod: 'Cash',
    description: 'Daily commute token',
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'exp-3',
    title: 'Engineering Mathematics Notebooks',
    amount: 80,
    category: 'Education',
    date: getRelativeDateStr(1),
    paymentMethod: 'UPI',
    description: 'Classmate ruled notebooks (2 pcs)',
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'exp-4',
    title: 'Weekend Movie Ticket',
    amount: 250,
    category: 'Entertainment',
    date: getRelativeDateStr(2),
    paymentMethod: 'Debit Card',
    description: 'Evening show ticket with college batchmates',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'exp-5',
    title: 'Hostel Wi-Fi Subscription',
    amount: 500,
    category: 'Bills',
    date: getRelativeDateStr(4),
    paymentMethod: 'UPI',
    description: 'Monthly high-speed fiber contribution',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'exp-6',
    title: 'Lab Manual & Photocopy Prints',
    amount: 150,
    category: 'Education',
    date: getRelativeDateStr(5),
    paymentMethod: 'Cash',
    description: 'Operating systems lab assignment spiral binding',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'exp-7',
    title: 'College T-Shirt & Badge',
    amount: 380,
    category: 'Shopping',
    date: getRelativeDateStr(7),
    paymentMethod: 'UPI',
    description: 'Annual cultural fest merchandise',
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'exp-8',
    title: 'Evening Coffee & Samosa',
    amount: 60,
    category: 'Food',
    date: getRelativeDateStr(8),
    paymentMethod: 'Cash',
    description: 'Study session refreshment at tea stall',
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'exp-9',
    title: 'Stationery & Highlighter Pens',
    amount: 110,
    category: 'Education',
    date: getRelativeDateStr(11),
    paymentMethod: 'UPI',
    description: 'Exam preparation markers and sticky notes',
    createdAt: Date.now() - 86400000 * 11,
  },
  {
    id: 'exp-10',
    title: 'Campus Laundry Service',
    amount: 160,
    category: 'Other',
    date: getRelativeDateStr(14),
    paymentMethod: 'UPI',
    description: 'Fortnightly wash and iron bundle',
    createdAt: Date.now() - 86400000 * 14,
  },
  {
    id: 'exp-11',
    title: 'Shared Auto-Rickshaw to Station',
    amount: 70,
    category: 'Travel',
    date: getRelativeDateStr(18),
    paymentMethod: 'Cash',
    description: 'Trip to central library downtown',
    createdAt: Date.now() - 86400000 * 18,
  },
  {
    id: 'exp-12',
    title: 'Streaming Music Student Plan',
    amount: 59,
    category: 'Entertainment',
    date: getRelativeDateStr(22),
    paymentMethod: 'Credit Card',
    description: 'Monthly Spotify student tier',
    createdAt: Date.now() - 86400000 * 22,
  },
];

export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (!raw) {
      // First visit - seed with sample data
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(SAMPLE_EXPENSES));
      return SAMPLE_EXPENSES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return SAMPLE_EXPENSES;
  } catch (err) {
    console.error('Failed to read expenses from localStorage:', err);
    return SAMPLE_EXPENSES;
  }
}

export function saveExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.error('Failed to save expenses to localStorage:', err);
  }
}

export function getStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to read settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

/**
 * Generates and triggers download of a standardized CSV file of expenses
 */
export function exportExpensesToCSV(expenses: Expense[], currencySymbol = '₹'): void {
  if (!expenses || expenses.length === 0) {
    throw new Error('No expenses available to export');
  }

  // CSV headers
  const headers = [
    'Transaction ID',
    'Date',
    'Title',
    'Category',
    'Amount',
    'Currency',
    'Payment Method',
    'Description',
    'Timestamp'
  ];

  // Map expenses to CSV rows with proper quote escaping
  const rows = expenses.map((exp) => [
    exp.id,
    exp.date,
    `"${(exp.title || '').replace(/"/g, '""')}"`,
    `"${(exp.category || '').replace(/"/g, '""')}"`,
    exp.amount.toFixed(2),
    `"${currencySymbol}"`,
    `"${(exp.paymentMethod || '').replace(/"/g, '""')}"`,
    `"${(exp.description || '').replace(/"/g, '""')}"`,
    new Date(exp.createdAt).toISOString()
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  // Prepend UTF-8 BOM so Excel and other tools properly display special symbols
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `SpendWise_Expenses_${todayStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// BILL SPLITS & ROOMMATE IOUs
// ----------------------------------------------------
export const SAMPLE_SPLITS: BillSplit[] = [
  {
    id: 'split-1',
    title: 'Hostel Night Pizza & Garlic Bread',
    totalAmount: 640,
    paidBy: 'me',
    date: getRelativeDateStr(1),
    note: 'Ordered from Dominos for project discussion',
    friends: [
      { id: 'f-1', name: 'Rohan Sharma', amount: 160, settled: false },
      { id: 'f-2', name: 'Priya Patel', amount: 160, settled: true },
      { id: 'f-3', name: 'Aman Verma', amount: 160, settled: false },
    ],
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'split-2',
    title: 'Uber to City Mall & Return',
    totalAmount: 320,
    paidBy: 'Kunal (Roommate)',
    date: getRelativeDateStr(3),
    note: 'Kunal booked Uber on his phone',
    friends: [
      { id: 'f-me', name: 'Alex (Me)', amount: 160, settled: false },
    ],
    createdAt: Date.now() - 86400000 * 3,
  }
];

export function getStoredSplits(): BillSplit[] {
  try {
    const raw = localStorage.getItem(SPLITS_STORAGE_KEY);
    if (!raw) return SAMPLE_SPLITS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_SPLITS;
  } catch {
    return SAMPLE_SPLITS;
  }
}

export function saveSplits(splits: BillSplit[]): void {
  try {
    localStorage.setItem(SPLITS_STORAGE_KEY, JSON.stringify(splits));
  } catch (err) {
    console.error('Failed to save splits:', err);
  }
}

// ----------------------------------------------------
// SAVINGS GOALS & WISHLIST
// ----------------------------------------------------
export const SAMPLE_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    title: 'Semester Break Trek / Goa Trip',
    targetAmount: 6000,
    currentAmount: 3800,
    targetDate: '2026-11-20',
    icon: '✈️',
    category: 'Travel',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'goal-2',
    title: 'Mechanical Keyboard / Tech Upgrade',
    targetAmount: 3500,
    currentAmount: 2200,
    targetDate: '2026-10-31',
    icon: '💻',
    category: 'Education',
    createdAt: Date.now() - 86400000 * 14,
  },
  {
    id: 'goal-3',
    title: 'Campus Fest Outfits & Passes',
    targetAmount: 2000,
    currentAmount: 1400,
    targetDate: '2026-10-15',
    icon: '🎟️',
    category: 'Entertainment',
    createdAt: Date.now() - 86400000 * 5,
  }
];

export function getStoredGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) return SAMPLE_GOALS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_GOALS;
  } catch {
    return SAMPLE_GOALS;
  }
}

export function saveGoals(goals: SavingsGoal[]): void {
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (err) {
    console.error('Failed to save goals:', err);
  }
}

// ----------------------------------------------------
// SUBSCRIPTIONS & RECURRING BILLS
// ----------------------------------------------------
export const SAMPLE_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1',
    name: 'Spotify Student Premium',
    amount: 59,
    billingCycle: 'monthly',
    nextBillingDate: '2026-10-05',
    category: 'Entertainment',
    paymentMethod: 'UPI',
    isActive: true,
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'sub-2',
    name: 'Jio / Airtel 5G Student Recharge (84 Days)',
    amount: 719,
    billingCycle: 'monthly',
    nextBillingDate: '2026-10-12',
    category: 'Bills',
    paymentMethod: 'UPI',
    isActive: true,
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'sub-3',
    name: 'College Hostel Wi-Fi Fee',
    amount: 300,
    billingCycle: 'monthly',
    nextBillingDate: '2026-10-01',
    category: 'Bills',
    paymentMethod: 'Cash',
    isActive: true,
    createdAt: Date.now() - 86400000 * 40,
  },
];

export function getStoredSubscriptions(): Subscription[] {
  try {
    const raw = localStorage.getItem(SUBS_STORAGE_KEY);
    if (!raw) return SAMPLE_SUBSCRIPTIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_SUBSCRIPTIONS;
  } catch {
    return SAMPLE_SUBSCRIPTIONS;
  }
}

export function saveSubscriptions(subs: Subscription[]): void {
  try {
    localStorage.setItem(SUBS_STORAGE_KEY, JSON.stringify(subs));
  } catch (err) {
    console.error('Failed to save subscriptions:', err);
  }
}

