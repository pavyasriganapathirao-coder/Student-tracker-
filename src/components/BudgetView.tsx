import React, { useState } from 'react';
import { 
  Wallet, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Calendar, 
  Sparkles,
  Save,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Expense, UserSettings, CurrencyCode, Category } from '../types';
import { formatCurrency, CURRENCIES, CATEGORY_META } from '../utils/formatters';

interface BudgetViewProps {
  expenses: Expense[];
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  currency: CurrencyCode;
}

const BUDGET_PRESETS = [3000, 5000, 8000, 10000, 15000];

export const BudgetView: React.FC<BudgetViewProps> = ({
  expenses,
  settings,
  onUpdateSettings,
  currency,
}) => {
  const [budgetInput, setBudgetInput] = useState(settings.monthlyBudget.toString());
  const [savedNotification, setSavedNotification] = useState(false);

  // Current month calculation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const currentMonthPrefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;

  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = daysInMonth - currentDay;

  // Filter this month's expenses
  const thisMonthExpenses = expenses
    .filter((e) => e.date.startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + e.amount, 0);

  const budget = settings.monthlyBudget;
  const remainingBudget = budget - thisMonthExpenses;
  const usagePercentage = budget > 0 ? (thisMonthExpenses / budget) * 100 : 0;
  const isOverBudget = thisMonthExpenses > budget;
  const isNearBudget = !isOverBudget && usagePercentage >= 80;

  // Pace calculations
  const dailyAverageSpent = currentDay > 0 ? thisMonthExpenses / currentDay : 0;
  const recommendedDaily = daysRemaining > 0 && remainingBudget > 0 ? remainingBudget / daysRemaining : 0;

  // Save budget
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(budgetInput);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateSettings({
        ...settings,
        monthlyBudget: parsed,
      });
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2500);
    }
  };

  const handlePresetClick = (amount: number) => {
    setBudgetInput(amount.toString());
    onUpdateSettings({
      ...settings,
      monthlyBudget: amount,
    });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  // Category breakdown for current month
  const categorySpending: Record<Category, number> = {
    Food: 0,
    Travel: 0,
    Education: 0,
    Shopping: 0,
    Entertainment: 0,
    Bills: 0,
    Other: 0,
  };

  expenses
    .filter((e) => e.date.startsWith(currentMonthPrefix))
    .forEach((e) => {
      if (categorySpending[e.category] !== undefined) {
        categorySpending[e.category] += e.amount;
      }
    });

  const categoriesList = (Object.keys(categorySpending) as Category[])
    .map((cat) => ({
      category: cat,
      amount: categorySpending[cat],
      percentOfBudget: budget > 0 ? (categorySpending[cat] / budget) * 100 : 0,
      meta: CATEGORY_META[cat],
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Monthly Budget Planner
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Track and control your student allowances for {monthName}
        </p>
      </div>

      {/* Main Budget Dashboard Card */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-2xs">
        
        {/* Top summary row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
          
          <div>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              MONTHLY BUDGET
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-1">
              {formatCurrency(budget, currency)}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Cap set for {monthName}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              TOTAL SPENT THIS MONTH
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-1">
              {formatCurrency(thisMonthExpenses, currency)}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {usagePercentage.toFixed(1)}% of total allowance
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              REMAINING BUDGET
            </span>
            <div className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums mt-1 ${
              isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {formatCurrency(remainingBudget, currency)}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {isOverBudget 
                ? `Exceeded by ${formatCurrency(Math.abs(remainingBudget), currency)}` 
                : `${daysRemaining} days left in month`}
            </p>
          </div>

        </div>

        {/* Progress Bar with Warnings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-700 dark:text-neutral-300">
              Budget Consumption Status
            </span>
            <span className={`font-mono tabular-nums ${
              isOverBudget 
                ? 'text-rose-600 dark:text-rose-400' 
                : isNearBudget 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {usagePercentage.toFixed(0)}%
            </span>
          </div>

          {/* Visual Progress Meter */}
          <div className="w-full h-4 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isOverBudget
                  ? 'bg-rose-500'
                  : isNearBudget
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
            <span>{formatCurrency(0, currency)}</span>
            <span>Target: {formatCurrency(budget, currency)}</span>
          </div>
        </div>

        {/* Clear Alert Banners */}
        {isOverBudget && (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Monthly Budget Limit Exceeded!</h4>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                You have surpassed your planned student budget of {formatCurrency(budget, currency)} by {formatCurrency(Math.abs(remainingBudget), currency)}. Review your expenses or consider increasing your budget limit below if necessary.
              </p>
            </div>
          </div>
        )}

        {!isOverBudget && isNearBudget && (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Caution: 80%+ of Monthly Budget Spent</h4>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                You have {formatCurrency(remainingBudget, currency)} left for the next {daysRemaining} days. Aim to spend no more than {formatCurrency(recommendedDaily, currency)} per day to stay within limits.
              </p>
            </div>
          </div>
        )}

        {/* Daily Spending Pace Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60">
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Current Daily Burn Rate
              </p>
              <p className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-0.5">
                {formatCurrency(dailyAverageSpent, currency)}/day
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Average across past {currentDay} days this month
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TrendingDown className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-1 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Target Daily Allowance
              </p>
              <p className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-0.5">
                {formatCurrency(recommendedDaily, currency)}/day
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Pace needed for remaining {daysRemaining} days
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Adjust Monthly Budget Settings */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
          Adjust Monthly Budget
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Set the maximum allowance you plan to spend each month
        </p>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-neutral-500">Presets:</span>
          {BUDGET_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePresetClick(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                settings.monthlyBudget === p
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
              }`}
            >
              {CURRENCIES[currency]?.symbol}{p.toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        {/* Custom Input Form */}
        <form onSubmit={handleSaveBudget} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-sm font-mono text-neutral-400">
              {CURRENCIES[currency]?.symbol}
            </span>
            <input
              type="number"
              min="100"
              step="50"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 5000"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Update Budget</span>
          </button>
        </form>

        {savedNotification && (
          <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Budget updated successfully to {formatCurrency(settings.monthlyBudget, currency)}!</span>
          </p>
        )}
      </div>

      {/* Category Breakdown and Spending Caps for this month */}
      {categoriesList.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Category Spending Caps & Allocation
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Track and enforce individual limits for Food, Commute, Books, and Entertainment.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {categoriesList.map((item) => {
              const categoryCap = settings.categoryBudgets?.[item.category as Category] || Math.round(settings.monthlyBudget * 0.25);
              const capUsedPercent = categoryCap > 0 ? (item.amount / categoryCap) * 100 : 0;
              const isCapExceeded = item.amount > categoryCap;

              return (
                <div key={item.category} className="p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: item.meta.color }}
                      />
                      <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                        {item.category}
                      </span>
                      {isCapExceeded ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          Exceeded Cap
                        </span>
                      ) : capUsedPercent >= 80 ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          Near Cap
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          On Track
                        </span>
                      )}
                    </div>
                    <div className="font-mono tabular-nums text-neutral-900 dark:text-white">
                      <span className="font-bold">{formatCurrency(item.amount, currency)}</span>
                      <span className="text-neutral-400 ml-1">/ Cap: {formatCurrency(categoryCap, currency)}</span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCapExceeded ? 'bg-rose-500' : capUsedPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(capUsedPercent, 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span>{capUsedPercent.toFixed(0)}% of category cap used</span>
                    <span>
                      {isCapExceeded 
                        ? `Over by ${formatCurrency(item.amount - categoryCap, currency)}` 
                        : `${formatCurrency(categoryCap - item.amount, currency)} available`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gamified Student Saving Badges */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            Student Financial Badges & Milestones
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Earn financial habits by managing your student allowance effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            !isOverBudget 
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60' 
              : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 opacity-60'
          }`}>
            <span className="text-2xl">🛡️</span>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Budget Guardian</h4>
              <p className="text-[11px] text-neutral-500">
                {!isOverBudget ? 'Active: Staying within monthly allowance!' : 'Exceeded monthly budget'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Pacing Pro</h4>
              <p className="text-[11px] text-neutral-500">
                Target daily pace calculated at {formatCurrency(recommendedDaily, currency)}/day
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Expense Master</h4>
              <p className="text-[11px] text-neutral-500">
                {expenses.length} student transactions logged
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
