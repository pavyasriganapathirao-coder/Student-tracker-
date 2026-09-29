import React from 'react';
import { 
  ArrowUpRight, 
  TrendingUp, 
  Calendar, 
  Wallet, 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  Download, 
  UtensilsCrossed, 
  Bus, 
  GraduationCap, 
  ShoppingBag, 
  Film, 
  CircleEllipsis, 
  Bot, 
  Sparkles,
  Users,
  Target,
  CalendarClock
} from 'lucide-react';
import { Expense, UserSettings, ActiveTab, Category } from '../types';
import { formatCurrency, formatRelativeDate, CATEGORY_META } from '../utils/formatters';

interface DashboardViewProps {
  expenses: Expense[];
  settings: UserSettings;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onExportCSV: () => void;
  onOpenChat: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  settings,
  setActiveTab,
  onOpenAddModal,
  onExportCSV,
  onOpenChat,
  onEditExpense,
  onDeleteExpense,
}) => {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayPrefix = now.toISOString().split('T')[0];

  // Calculations
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const thisMonthExpenses = expenses
    .filter((e) => e.date.startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + e.amount, 0);

  const todayExpenses = expenses
    .filter((e) => e.date === todayPrefix)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalTransactionsCount = expenses.length;
  const remainingBudget = settings.monthlyBudget - thisMonthExpenses;
  const budgetUsagePercent = settings.monthlyBudget > 0 
    ? Math.min(Math.round((thisMonthExpenses / settings.monthlyBudget) * 100), 999) 
    : 0;

  const isOverBudget = thisMonthExpenses > settings.monthlyBudget;
  const isNearBudget = !isOverBudget && budgetUsagePercent >= 80;

  // Recent 5 transactions
  const recentTransactions = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)
    .slice(0, 5);

  // Category aggregations for this month
  const categoryTotals: Record<Category, number> = {
    Food: 0,
    Travel: 0,
    Education: 0,
    Shopping: 0,
    Entertainment: 0,
    Bills: 0,
    Other: 0,
  };

  expenses.forEach((e) => {
    if (categoryTotals[e.category] !== undefined) {
      categoryTotals[e.category] += e.amount;
    } else {
      categoryTotals['Other'] += e.amount;
    }
  });

  const sortedCategories = (Object.keys(categoryTotals) as Category[])
    .map((cat) => ({
      category: cat,
      amount: categoryTotals[cat],
      percentage: totalExpenses > 0 ? (categoryTotals[cat] / totalExpenses) * 100 : 0,
      meta: CATEGORY_META[cat],
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Helper for category icons
  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'Food': return <UtensilsCrossed className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'Travel': return <Bus className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'Education': return <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'Shopping': return <ShoppingBag className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
      case 'Entertainment': return <Film className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'Bills': return <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default: return <CircleEllipsis className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Hello, {settings.studentName || 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Here is your spending overview for {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800 shadow-2xs"
            title="Ask SpendWise AI Advisor"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {/* AI Advisor Assistant Strip */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-900 dark:text-white">SpendWise AI Advisor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold font-mono">n8n active</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              Connected to your personal n8n AI workflow with live budget and expense awareness.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenChat}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chat with AI Advisor</span>
        </button>
      </div>

      {/* Budget Warning Alert (if approaching or exceeded) */}
      {isOverBudget && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Monthly Budget Exceeded</h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              You have spent <span className="font-mono font-semibold tabular-nums">{formatCurrency(thisMonthExpenses, settings.currency)}</span> against your budget of <span className="font-mono font-semibold tabular-nums">{formatCurrency(settings.monthlyBudget, settings.currency)}</span> (exceeded by {formatCurrency(thisMonthExpenses - settings.monthlyBudget, settings.currency)}).
            </p>
          </div>
          <button
            onClick={() => setActiveTab('budget')}
            className="text-xs font-semibold underline text-rose-700 dark:text-rose-300 hover:text-rose-900 shrink-0"
          >
            Adjust Budget
          </button>
        </div>
      )}

      {!isOverBudget && isNearBudget && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Budget Warning: {budgetUsagePercent}% Used</h4>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              You only have <span className="font-mono font-semibold tabular-nums">{formatCurrency(remainingBudget, settings.currency)}</span> remaining this month. Keep non-essential spends low!
            </p>
          </div>
          <button
            onClick={() => setActiveTab('budget')}
            className="text-xs font-semibold underline text-amber-700 dark:text-amber-300 hover:text-amber-900 shrink-0"
          >
            View Budget
          </button>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Expenses */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Total Expenses</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {formatCurrency(totalExpenses, settings.currency)}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            All-time logged
          </p>
        </div>

        {/* This Month's Expenses */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">This Month</span>
            <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {formatCurrency(thisMonthExpenses, settings.currency)}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            {budgetUsagePercent}% of monthly budget
          </p>
        </div>

        {/* Today's Expenses */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Today's Spends</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {formatCurrency(todayExpenses, settings.currency)}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Logged today
          </p>
        </div>

        {/* Number of Transactions */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Transactions</span>
            <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {totalTransactionsCount}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Active records
          </p>
        </div>

        {/* Remaining Monthly Budget */}
        <div className="col-span-2 lg:col-span-1 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Budget Left</span>
            <Wallet className={`w-4 h-4 ${isOverBudget ? 'text-rose-500' : 'text-emerald-500'}`} />
          </div>
          <div className={`text-lg sm:text-2xl font-bold font-mono tabular-nums ${
            isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {formatCurrency(remainingBudget, settings.currency)}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            {isOverBudget ? 'Exceeded limit' : `of ${formatCurrency(settings.monthlyBudget, settings.currency)} cap`}
          </p>
        </div>

      </div>

      {/* Student Hub Feature Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          onClick={() => setActiveTab('split')}
          className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs text-left transition-all group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                Split & Settle
              </h3>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">
              Track canteen bills, Wi-Fi splits & roommate IOUs.
            </p>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs text-left transition-all group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                Savings Goals
              </h3>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">
              Save for semester trips, laptop upgrades & fests.
            </p>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs text-left transition-all group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <CalendarClock className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                Subscriptions
              </h3>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">
              Monthly recharges, Spotify, Wi-Fi & mess reminders.
            </p>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
        </button>
      </div>

      {/* Main Grid: Category Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Recent Transactions */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Recent Transactions
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Latest student expense entries
              </p>
            </div>
            <button
              onClick={() => setActiveTab('expenses')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No transactions recorded yet
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Start tracking by adding your first daily expense!
              </p>
              <button
                onClick={onOpenAddModal}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {recentTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(tx.category)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {tx.title}
                      </p>
                      {/* Zero-Pill Metadata Rule with typographic separator */}
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        <span>{tx.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.paymentMethod}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-4 flex items-center gap-3">
                    <div>
                      <div className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
                        {formatCurrency(tx.amount, settings.currency)}
                      </div>
                      {tx.description && (
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate max-w-[130px]">
                          {tx.description}
                        </p>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={() => onEditExpense(tx)}
                        className="px-2 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                        title="Edit expense"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recentTransactions.length > 0 && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <button
                onClick={() => setActiveTab('expenses')}
                className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                View all {totalTransactionsCount} expenses &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Expense Category Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Expenses by Category
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Where your college money goes
                </p>
              </div>
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Analytics
              </button>
            </div>

            {sortedCategories.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">
                Add expenses to see category breakdown.
              </p>
            ) : (
              <div className="space-y-3.5">
                {/* Visual Category Proportion Bar */}
                <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex overflow-hidden">
                  {sortedCategories.map((item) => (
                    <div
                      key={item.category}
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.meta.color,
                      }}
                      title={`${item.category}: ${formatCurrency(item.amount, settings.currency)} (${item.percentage.toFixed(1)}%)`}
                      className="h-full transition-all duration-300"
                    />
                  ))}
                </div>

                {/* Category List with Progress Bars */}
                <div className="space-y-3 pt-2">
                  {sortedCategories.slice(0, 5).map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: item.meta.color }}
                          />
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">
                            {item.category}
                          </span>
                        </div>
                        <div className="font-mono tabular-nums text-neutral-900 dark:text-white font-semibold">
                          {formatCurrency(item.amount, settings.currency)}
                          <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">
                            ({item.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.meta.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Budget Health Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Monthly Budget Health
              </span>
              <span className={`text-xs font-semibold font-mono tabular-nums ${
                isOverBudget ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {budgetUsagePercent}% Used
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget 
                    ? 'bg-rose-500' 
                    : budgetUsagePercent >= 80 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>Used: {formatCurrency(thisMonthExpenses, settings.currency)}</span>
              <span>Budget: {formatCurrency(settings.monthlyBudget, settings.currency)}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
