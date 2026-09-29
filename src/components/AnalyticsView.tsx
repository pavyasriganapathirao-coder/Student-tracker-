import React, { useState } from 'react';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  CreditCard, 
  TrendingUp, 
  Award,
  Zap,
  Calendar,
  UtensilsCrossed,
  Bus,
  GraduationCap,
  ShoppingBag,
  Film,
  Receipt,
  CircleEllipsis
} from 'lucide-react';
import { Expense, CurrencyCode, Category, PaymentMethod } from '../types';
import { formatCurrency, CATEGORY_META } from '../utils/formatters';

interface AnalyticsViewProps {
  expenses: Expense[];
  currency: CurrencyCode;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ expenses, currency }) => {
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | 'all'>('30');
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);

  // Filter expenses by selected time range
  const filteredExpenses = React.useMemo(() => {
    if (timeRange === 'all') return expenses;
    const days = parseInt(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return expenses.filter((e) => e.date >= cutoffStr);
  }, [expenses, timeRange]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 1. Category aggregation
  const categoryMap: Record<Category, number> = {
    Food: 0,
    Travel: 0,
    Education: 0,
    Shopping: 0,
    Entertainment: 0,
    Bills: 0,
    Other: 0,
  };

  filteredExpenses.forEach((e) => {
    if (categoryMap[e.category] !== undefined) {
      categoryMap[e.category] += e.amount;
    } else {
      categoryMap['Other'] += e.amount;
    }
  });

  const categoryData = (Object.keys(categoryMap) as Category[])
    .map((cat) => ({
      category: cat,
      amount: categoryMap[cat],
      percentage: totalSpent > 0 ? (categoryMap[cat] / totalSpent) * 100 : 0,
      meta: CATEGORY_META[cat],
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // 2. Daily expenses aggregation (past 14 days)
  const dailyData = React.useMemo(() => {
    const daysMap: Record<string, number> = {};
    const daysCount = timeRange === '7' ? 7 : timeRange === '14' ? 14 : 30;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      daysMap[dateStr] = 0;
    }

    filteredExpenses.forEach((e) => {
      if (daysMap[e.date] !== undefined) {
        daysMap[e.date] += e.amount;
      }
    });

    return Object.entries(daysMap).map(([date, amount]) => {
      const d = new Date(date + 'T00:00:00');
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      return { date, label, amount };
    });
  }, [filteredExpenses, timeRange]);

  const maxDailySpend = Math.max(...dailyData.map((d) => d.amount), 1);

  // 3. Payment Method breakdown
  const paymentMap: Record<PaymentMethod, number> = {
    Cash: 0,
    UPI: 0,
    'Debit Card': 0,
    'Credit Card': 0,
  };

  filteredExpenses.forEach((e) => {
    if (paymentMap[e.paymentMethod] !== undefined) {
      paymentMap[e.paymentMethod] += e.amount;
    }
  });

  const paymentData = (Object.keys(paymentMap) as PaymentMethod[])
    .map((pm) => ({
      method: pm,
      amount: paymentMap[pm],
      percentage: totalSpent > 0 ? (paymentMap[pm] / totalSpent) * 100 : 0,
    }))
    .filter((p) => p.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // 4. Monthly aggregation (past 6 months)
  const monthlyData = React.useMemo(() => {
    const monthsMap: Record<string, { label: string; amount: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      monthsMap[key] = { label, amount: 0 };
    }

    expenses.forEach((e) => {
      const key = e.date.substring(0, 7);
      if (monthsMap[key]) {
        monthsMap[key].amount += e.amount;
      }
    });

    return Object.entries(monthsMap).map(([key, data]) => ({
      monthKey: key,
      label: data.label,
      amount: data.amount,
    }));
  }, [expenses]);

  const maxMonthlySpend = Math.max(...monthlyData.map((m) => m.amount), 1);

  // Insights
  const highestExpense = [...filteredExpenses].sort((a, b) => b.amount - a.amount)[0];
  const topCategory = categoryData[0];
  const averagePerDay = dailyData.length > 0 ? totalSpent / dailyData.length : 0;

  // SVG Donut calculation
  let cumulativeAngle = 0;
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="space-y-6">
      
      {/* Title & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Spending Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Visual breakdown of your habits and financial patterns
          </p>
        </div>

        {/* Time Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <button
            onClick={() => setTimeRange('7')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              timeRange === '7'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('14')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              timeRange === '14'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            14 Days
          </button>
          <button
            onClick={() => setTimeRange('30')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              timeRange === '30'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              timeRange === 'all'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Key Insights Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Top Spending Category</span>
          </div>
          <div className="text-lg font-bold text-neutral-900 dark:text-white">
            {topCategory ? topCategory.category : 'N/A'}
          </div>
          <p className="text-xs text-neutral-500 font-mono tabular-nums mt-0.5">
            {topCategory 
              ? `${formatCurrency(topCategory.amount, currency)} (${topCategory.percentage.toFixed(0)}% of total)`
              : 'No expenses'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Highest Single Expense</span>
          </div>
          <div className="text-lg font-bold text-neutral-900 dark:text-white truncate">
            {highestExpense ? highestExpense.title : 'N/A'}
          </div>
          <p className="text-xs text-neutral-500 font-mono tabular-nums mt-0.5">
            {highestExpense ? formatCurrency(highestExpense.amount, currency) : 'No records'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            <TrendingUp className="w-4 h-4 text-sky-500" />
            <span>Daily Average Spend</span>
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {formatCurrency(averagePerDay, currency)}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Across selected period
          </p>
        </div>

      </div>

      {/* Grid: Donut Chart + Daily Spend Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Category Distribution
            </h2>
            <PieIcon className="w-4 h-4 text-neutral-400" />
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No expenses in selected timeframe.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Interactive SVG Donut */}
              <div className="relative flex justify-center items-center py-2">
                <svg width="180" height="180" viewBox="0 0 180 180" className="rotate-[-90deg]">
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-neutral-100 dark:text-neutral-800"
                  />
                  {categoryData.map((item) => {
                    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -cumulativeAngle;
                    cumulativeAngle += (item.percentage / 100) * circumference;

                    const isHovered = hoveredCategory === item.category;

                    return (
                      <circle
                        key={item.category}
                        cx="90"
                        cy="90"
                        r={radius}
                        stroke={item.meta.color}
                        strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        fill="transparent"
                        strokeLinecap="round"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(item.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Info */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
                    {formatCurrency(totalSpent, currency)}
                  </span>
                </div>
              </div>

              {/* Legend with hover highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {categoryData.map((item) => (
                  <div
                    key={item.category}
                    onMouseEnter={() => setHoveredCategory(item.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`p-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      hoveredCategory === item.category ? 'bg-neutral-100 dark:bg-neutral-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: item.meta.color }}
                      />
                      <span className="text-neutral-700 dark:text-neutral-300 truncate">
                        {item.category}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-neutral-900 dark:text-white font-semibold ml-1">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* Daily Spending Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Daily Expenses Trend
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Spending trajectory across recent days
                </p>
              </div>
              <BarChart3 className="w-4 h-4 text-neutral-400" />
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="h-44 flex items-end gap-1.5 sm:gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                {dailyData.map((d) => {
                  const heightPercent = maxDailySpend > 0 ? Math.max((d.amount / maxDailySpend) * 100, 4) : 4;
                  return (
                    <div 
                      key={d.date} 
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-9 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 font-mono">
                        {d.label}: {formatCurrency(d.amount, currency)}
                      </div>

                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          d.amount > 0 
                            ? 'bg-emerald-600 hover:bg-emerald-500' 
                            : 'bg-neutral-100 dark:bg-neutral-800'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-2">
                <span>{dailyData[0]?.label || ''}</span>
                <span>{dailyData[Math.floor(dailyData.length / 2)]?.label || ''}</span>
                <span>{dailyData[dailyData.length - 1]?.label || ''}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <span>Peak daily spend: <strong className="font-mono text-neutral-900 dark:text-white">{formatCurrency(maxDailySpend, currency)}</strong></span>
            <span>Active days: <strong className="font-mono text-neutral-900 dark:text-white">{dailyData.filter(d => d.amount > 0).length}</strong></span>
          </div>
        </div>

      </div>

      {/* Grid: Monthly Spending Bar Chart + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Expenses Comparison */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Monthly Expenses Summary
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Expenditure over past 6 months
              </p>
            </div>
            <Calendar className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="space-y-3 pt-2">
            {monthlyData.map((m) => {
              const percent = maxMonthlySpend > 0 ? (m.amount / maxMonthlySpend) * 100 : 0;
              return (
                <div key={m.monthKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {m.label}
                    </span>
                    <span className="font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                      {formatCurrency(m.amount, currency)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all duration-300"
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Payment Methods
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                UPI vs Cash vs Cards
              </p>
            </div>
            <CreditCard className="w-4 h-4 text-neutral-400" />
          </div>

          {paymentData.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {paymentData.map((p) => (
                <div key={p.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {p.method}
                    </span>
                    <div className="font-mono tabular-nums text-neutral-900 dark:text-white">
                      <span className="font-bold">{formatCurrency(p.amount, currency)}</span>
                      <span className="text-neutral-400 ml-1">({p.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
