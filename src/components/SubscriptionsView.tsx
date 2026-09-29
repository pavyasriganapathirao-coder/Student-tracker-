import React, { useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  CreditCard, 
  Zap, 
  Repeat, 
  ExternalLink,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Subscription, UserSettings, Expense, Category, PaymentMethod } from '../types';
import { formatCurrency, CATEGORY_META } from '../utils/formatters';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
  onUpdateSubscriptions: (subs: Subscription[]) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  settings: UserSettings;
}

const COMMON_STUDENT_SUBS = [
  { name: 'Spotify Student', amount: 59, category: 'Entertainment', cycle: 'monthly' },
  { name: 'YouTube Student Premium', amount: 89, category: 'Entertainment', cycle: 'monthly' },
  { name: 'Jio / Airtel 5G Data Recharge', amount: 299, category: 'Bills', cycle: 'monthly' },
  { name: 'Hostel Wi-Fi / Mess Bill', amount: 350, category: 'Bills', cycle: 'monthly' },
  { name: 'Gym / Campus Sports Pass', amount: 500, category: 'Other', cycle: 'monthly' },
];

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  subscriptions,
  onUpdateSubscriptions,
  onAddExpense,
  settings,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [category, setCategory] = useState<Category>('Entertainment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');

  // Metrics
  const monthlyTotal = subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => {
      const amt = s.billingCycle === 'yearly' ? s.amount / 12 : s.amount;
      return sum + amt;
    }, 0);

  const handleCreateSub = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const newSub: Subscription = {
      id: 'sub_' + Date.now().toString(36),
      name: name.trim(),
      amount: val,
      billingCycle,
      nextBillingDate,
      category,
      paymentMethod,
      isActive: true,
      createdAt: Date.now(),
    };

    onUpdateSubscriptions([newSub, ...subscriptions]);

    // Reset
    setName('');
    setAmount('');
    setIsAddModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    const updated = subscriptions.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    onUpdateSubscriptions(updated);
  };

  const handleDeleteSub = (id: string) => {
    if (confirm('Delete this subscription reminder?')) {
      onUpdateSubscriptions(subscriptions.filter((s) => s.id !== id));
    }
  };

  const handlePayNow = (sub: Subscription) => {
    // Record as expense
    onAddExpense({
      title: `${sub.name} (Recurring)`,
      amount: sub.amount,
      category: sub.category,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: sub.paymentMethod,
      description: `Recurring ${sub.billingCycle} subscription payment logged.`,
    });

    // Advance next billing date by 1 month or 1 year
    const curr = new Date(sub.nextBillingDate);
    if (sub.billingCycle === 'monthly') {
      curr.setMonth(curr.getMonth() + 1);
    } else {
      curr.setFullYear(curr.getFullYear() + 1);
    }

    const updated = subscriptions.map((s) =>
      s.id === sub.id ? { ...s, nextBillingDate: curr.toISOString().split('T')[0] } : s
    );
    onUpdateSubscriptions(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Subscriptions & Recurring Bills
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {subscriptions.filter((s) => s.isActive).length} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Never miss college mobile recharges, hostel Wi-Fi, Spotify, or gym subscriptions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Monthly Recurring Commitment Banner */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Fixed Monthly Commitments
            </span>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
              {formatCurrency(monthlyTotal, settings.currency)}{' '}
              <span className="text-xs text-neutral-400 font-normal">/ month</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              {((monthlyTotal / (settings.monthlyBudget || 1)) * 100).toFixed(1)}% of your monthly budget
            </p>
          </div>
        </div>

        {/* Quick presets strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {COMMON_STUDENT_SUBS.slice(0, 3).map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setName(preset.name);
                setAmount(preset.amount.toString());
                setCategory(preset.category as Category);
                setIsAddModalOpen(true);
              }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 whitespace-nowrap transition-colors"
            >
              + {preset.name} ({formatCurrency(preset.amount, settings.currency)})
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map((sub) => {
          const daysUntil = Math.ceil(
            (new Date(sub.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          const isUrgent = daysUntil <= 3 && daysUntil >= 0;

          return (
            <div
              key={sub.id}
              className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-2xs transition-all ${
                !sub.isActive
                  ? 'opacity-60 border-neutral-200 dark:border-neutral-800'
                  : isUrgent
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
                      {sub.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-neutral-500 capitalize">
                        {sub.billingCycle} • {sub.paymentMethod}
                      </span>
                      {isUrgent && sub.isActive && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Due Soon
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(sub.id)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors ${
                        sub.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {sub.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      onClick={() => handleDeleteSub(sub.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                    {formatCurrency(sub.amount, settings.currency)}
                  </span>
                  <span className="text-xs text-neutral-400">
                    /{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Next Due:</span>
                  </div>
                  <strong className="font-mono text-neutral-900 dark:text-white">
                    {sub.nextBillingDate}
                  </strong>
                </div>
              </div>

              {/* Pay Now & Log button */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => handlePayNow(sub)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Paid & Log Expense</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Subscription */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Add Recurring Subscription
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateSub} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Subscription Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spotify Student, Jio Recharge, Campus Gym"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Amount ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 59"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Next Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Entertainment">🎬 Entertainment</option>
                    <option value="Bills">⚡ Bills / Recharge</option>
                    <option value="Education">📚 Education</option>
                    <option value="Food">🍔 Food / Mess</option>
                    <option value="Other">📦 Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-2xs transition-colors"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
