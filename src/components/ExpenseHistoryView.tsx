import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Plus, 
  Edit3, 
  Trash2, 
  Receipt, 
  Calendar,
  X,
  UtensilsCrossed,
  Bus,
  GraduationCap,
  ShoppingBag,
  Film,
  CircleEllipsis
} from 'lucide-react';
import { Expense, Category, PaymentMethod, CurrencyCode } from '../types';
import { formatCurrency, formatDate, formatRelativeDate, CATEGORY_META } from '../utils/formatters';

interface ExpenseHistoryViewProps {
  expenses: Expense[];
  currency: CurrencyCode;
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onExportCSV: () => void;
}

const CATEGORIES: ('All' | Category)[] = [
  'All',
  'Food',
  'Travel',
  'Education',
  'Shopping',
  'Entertainment',
  'Bills',
  'Other',
];

const PAYMENT_METHODS: ('All' | PaymentMethod)[] = ['All', 'Cash', 'UPI', 'Debit Card', 'Credit Card'];

type DateFilterType = 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export const ExpenseHistoryView: React.FC<ExpenseHistoryViewProps> = ({
  expenses,
  currency,
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | Category>('All');
  const [selectedPayment, setSelectedPayment] = useState<'All' | PaymentMethod>('All');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  // Filter & Sort Logic
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Current week boundary
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    // Current month prefix
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return expenses.filter((exp) => {
      // 1. Search term match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleMatch = exp.title.toLowerCase().includes(query);
        const descMatch = exp.description ? exp.description.toLowerCase().includes(query) : false;
        const catMatch = exp.category.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }

      // 2. Category match
      if (selectedCategory !== 'All' && exp.category !== selectedCategory) {
        return false;
      }

      // 3. Payment method match
      if (selectedPayment !== 'All' && exp.paymentMethod !== selectedPayment) {
        return false;
      }

      // 4. Date filter match
      if (dateFilter === 'today' && exp.date !== todayStr) {
        return false;
      }
      if (dateFilter === 'this_week' && (exp.date < oneWeekAgoStr || exp.date > todayStr)) {
        return false;
      }
      if (dateFilter === 'this_month' && !exp.date.startsWith(currentMonthPrefix)) {
        return false;
      }
      if (dateFilter === 'custom') {
        if (customStartDate && exp.date < customStartDate) return false;
        if (customEndDate && exp.date > customEndDate) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt;
      }
      if (sortBy === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt;
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [
    expenses, 
    searchTerm, 
    selectedCategory, 
    selectedPayment, 
    dateFilter, 
    customStartDate, 
    customEndDate, 
    sortBy
  ]);

  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedPayment('All');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('date_desc');
  };

  const hasActiveFilters = 
    searchTerm !== '' || 
    selectedCategory !== 'All' || 
    selectedPayment !== 'All' || 
    dateFilter !== 'all';

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
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Expense History
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Search, filter, edit, and export your college transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
        
        {/* Search Input and Sort Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search expenses by title, note, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4 relative">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-4 h-4 text-neutral-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="date_desc">Date: Newest First</option>
                <option value="date_asc">Date: Oldest First</option>
                <option value="amount_desc">Amount: Highest to Lowest</option>
                <option value="amount_asc">Amount: Lowest to Highest</option>
              </select>
            </div>
          </div>

        </div>

        {/* Filter Rows: Category & Period */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          
          {/* Category Filter */}
          <div className="sm:col-span-6 flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              Category:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'All' | Category)}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="sm:col-span-3 flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              Payment Method:
            </span>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value as 'All' | PaymentMethod)}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm === 'All' ? 'All Methods' : pm}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="sm:col-span-3 flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              Time Period:
            </span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">Past 7 Days</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

        </div>

        {/* Custom Date Pickers (if chosen) */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Active Filters Summary & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div className="text-neutral-500 dark:text-neutral-400">
            Showing <span className="font-semibold text-neutral-900 dark:text-white font-mono">{filteredExpenses.length}</span> of <span className="font-mono">{expenses.length}</span> expenses
            {' '}· Totaling <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{formatCurrency(filteredTotal, currency)}</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xs">
        
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              No matching transactions found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              {hasActiveFilters 
                ? 'Try adjusting your search criteria or resetting filters to view more records.' 
                : 'No expenses have been recorded yet. Click below to add your first expense!'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  onClick={resetFilters}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                >
                  + Add Expense
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                  <th className="py-3 px-4 sm:px-6">TITLE & NOTES</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">PAYMENT</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4 text-right">AMOUNT</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredExpenses.map((exp) => (
                  <tr 
                    key={exp.id}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors group"
                  >
                    {/* Title & Notes */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {exp.title}
                      </div>
                      {exp.description && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-xs truncate">
                          {exp.description}
                        </div>
                      )}
                    </td>

                    {/* Category - Zero-Pill rule: clean unboxed text with icon */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {getCategoryIcon(exp.category)}
                        <span>{exp.category}</span>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 text-xs text-neutral-600 dark:text-neutral-400">
                      {exp.paymentMethod}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {formatDate(exp.date)}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-neutral-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(exp.amount, currency)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                          title="Edit transaction"
                          aria-label="Edit transaction"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(exp)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                          title="Delete transaction"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
