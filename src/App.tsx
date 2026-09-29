import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ExpenseHistoryView } from './components/ExpenseHistoryView';
import { BudgetView } from './components/BudgetView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { SplitView } from './components/SplitView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { AddExpenseModal } from './components/AddExpenseModal';
import { EditExpenseModal } from './components/EditExpenseModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { N8nChatbot } from './components/N8nChatbot';
import { Expense, UserSettings, ActiveTab, BillSplit, SavingsGoal, Subscription } from './types';
import { 
  getStoredExpenses, 
  saveExpenses, 
  getStoredSettings, 
  saveSettings, 
  getStoredSplits,
  saveSplits,
  getStoredGoals,
  saveGoals,
  getStoredSubscriptions,
  saveSubscriptions,
  exportExpensesToCSV,
  SAMPLE_EXPENSES 
} from './utils/storage';
import { CURRENCIES, formatCurrency } from './utils/formatters';

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>(() => getStoredExpenses());
  const [settings, setSettings] = useState<UserSettings>(() => getStoredSettings());
  const [splits, setSplits] = useState<BillSplit[]>(() => getStoredSplits());
  const [goals, setGoals] = useState<SavingsGoal[]>(() => getStoredGoals());
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => getStoredSubscriptions());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync dark mode class on document element
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Persist expenses
  const updateExpensesList = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    saveExpenses(newExpenses);
  };

  // Persist settings
  const updateSettingsData = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Persist Splits
  const updateSplitsList = (newSplits: BillSplit[]) => {
    setSplits(newSplits);
    saveSplits(newSplits);
  };

  // Persist Goals
  const updateGoalsList = (newGoals: SavingsGoal[]) => {
    setGoals(newGoals);
    saveGoals(newGoals);
  };

  // Persist Subscriptions
  const updateSubscriptionsList = (newSubs: Subscription[]) => {
    setSubscriptions(newSubs);
    saveSubscriptions(newSubs);
  };

  // Handlers
  const handleAddExpense = (newExpData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...newExpData,
      id: 'exp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
    };
    const updated = [newExpense, ...expenses];
    updateExpensesList(updated);
    addToast('success', `Added "${newExpense.title}" (${formatCurrency(newExpense.amount, settings.currency)})`);
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    const updated = expenses.map((e) => (e.id === updatedExpense.id ? updatedExpense : e));
    updateExpensesList(updated);
    addToast('success', `Updated "${updatedExpense.title}"`);
    setEditingExpense(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingExpense) return;
    const targetTitle = deletingExpense.title;
    const updated = expenses.filter((e) => e.id !== deletingExpense.id);
    updateExpensesList(updated);
    addToast('info', `Deleted "${targetTitle}"`);
    setDeletingExpense(null);
  };

  const handleClearAllConfirm = () => {
    updateExpensesList([]);
    addToast('info', 'All expense records cleared');
    setIsClearAllModalOpen(false);
  };

  const handleRestoreSample = () => {
    updateExpensesList(SAMPLE_EXPENSES);
    addToast('success', 'Sample college expenses restored');
  };

  const handleExportCSV = () => {
    try {
      if (expenses.length === 0) {
        addToast('error', 'No expenses available to export');
        return;
      }
      exportExpensesToCSV(expenses, CURRENCIES[settings.currency]?.symbol || '₹');
      addToast('success', `Exported ${expenses.length} transactions as CSV`);
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to export CSV');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      
      {/* Top Navigation Bar with Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={settings.darkMode}
        setDarkMode={(val) => updateSettingsData({ ...settings, darkMode: val })}
        onExportCSV={handleExportCSV}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        currency={settings.currency}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            expenses={expenses}
            settings={settings}
            setActiveTab={setActiveTab}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onExportCSV={handleExportCSV}
            onOpenChat={() => setIsChatOpen(true)}
            onEditExpense={(exp) => setEditingExpense(exp)}
            onDeleteExpense={(exp) => setDeletingExpense(exp)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseHistoryView
            expenses={expenses}
            currency={settings.currency}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onEditExpense={(exp) => setEditingExpense(exp)}
            onDeleteExpense={(exp) => setDeletingExpense(exp)}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'split' && (
          <SplitView
            splits={splits}
            onUpdateSplits={updateSplitsList}
            onAddExpense={handleAddExpense}
            settings={settings}
          />
        )}

        {activeTab === 'goals' && (
          <SavingsGoalsView
            goals={goals}
            onUpdateGoals={updateGoalsList}
            settings={settings}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionsView
            subscriptions={subscriptions}
            onUpdateSubscriptions={updateSubscriptionsList}
            onAddExpense={handleAddExpense}
            settings={settings}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            expenses={expenses}
            settings={settings}
            onUpdateSettings={updateSettingsData}
            currency={settings.currency}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            expenses={expenses}
            currency={settings.currency}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            expenses={expenses}
            onUpdateSettings={updateSettingsData}
            onClearAllData={() => setIsClearAllModalOpen(true)}
            onRestoreSampleData={handleRestoreSample}
            onExportCSV={handleExportCSV}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">SpendWise</span>
            <span>·</span>
            <span>Student Expense Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Stored locally in your browser</span>
            <span>·</span>
            <button
              onClick={handleExportCSV}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Export CSV Backup
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddExpense={handleAddExpense}
        currency={settings.currency}
      />

      <EditExpenseModal
        isOpen={editingExpense !== null}
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onUpdateExpense={handleUpdateExpense}
        currency={settings.currency}
      />

      <DeleteConfirmModal
        isOpen={deletingExpense !== null}
        title="Delete Expense"
        message={`Are you sure you want to delete "${deletingExpense?.title}" (${formatCurrency(deletingExpense?.amount || 0, settings.currency)})? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingExpense(null)}
      />

      <DeleteConfirmModal
        isOpen={isClearAllModalOpen}
        title="Clear All Expenses"
        message={`Are you sure you want to permanently delete all ${expenses.length} recorded expenses? You will lose all your historical records unless you have exported a CSV.`}
        confirmLabel="Clear All Data"
        onConfirm={handleClearAllConfirm}
        onClose={() => setIsClearAllModalOpen(false)}
      />

      {/* n8n AI Advisor Chatbot */}
      <N8nChatbot
        settings={settings}
        expenses={expenses}
        isOpen={isChatOpen}
        onToggle={setIsChatOpen}
      />

      {/* Toast Notifications */}
      <NotificationToast toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}
