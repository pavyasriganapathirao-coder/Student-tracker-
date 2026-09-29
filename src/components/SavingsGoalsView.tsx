import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight,
  Gift,
  Laptop,
  Plane,
  Trophy,
  Coins
} from 'lucide-react';
import { SavingsGoal, UserSettings } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SavingsGoalsViewProps {
  goals: SavingsGoal[];
  onUpdateGoals: (goals: SavingsGoal[]) => void;
  settings: UserSettings;
}

const PRESET_ICONS = ['✈️', '💻', '🎟️', '🎧', '👟', '📱', '📚', '🏍️', '🎸', '🎮'];

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({
  goals,
  onUpdateGoals,
  settings,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Tech');
  const [icon, setIcon] = useState('💻');

  // Overall metrics
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const initial = parseFloat(initialAmount) || 0;
    if (isNaN(target) || target <= 0) return;

    const newGoal: SavingsGoal = {
      id: 'goal_' + Date.now().toString(36),
      title: title.trim(),
      targetAmount: target,
      currentAmount: Math.min(target, initial),
      targetDate: targetDate || '2026-12-31',
      category,
      icon,
      createdAt: Date.now(),
    };

    onUpdateGoals([newGoal, ...goals]);

    // Reset
    setTitle('');
    setTargetAmount('');
    setInitialAmount('');
    setTargetDate('');
    setIsAddModalOpen(false);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForDeposit) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount === 0) return;

    const updated = goals.map((g) => {
      if (g.id !== selectedGoalForDeposit.id) return g;
      const newAmount = Math.max(0, Math.min(g.targetAmount, g.currentAmount + amount));
      return { ...g, currentAmount: newAmount };
    });

    onUpdateGoals(updated);
    setSelectedGoalForDeposit(null);
    setDepositAmount('');
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('Delete this savings goal?')) {
      onUpdateGoals(goals.filter((g) => g.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Student Savings Goals & Wishlist
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {goals.length} Goals
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Save for semester trips, laptop upgrades, festival outfits, and certification exam fees.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Overview Progress Card */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Total Student Savings Pool
            </h3>
            <p className="text-xs text-neutral-500">
              {formatCurrency(totalSaved, settings.currency)} saved across {goals.length} active goals
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {overallProgress}% of target {formatCurrency(totalTarget, settings.currency)}
            </span>
          </div>
        </div>

        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          // Calculate daily saving target to reach by deadline
          const daysLeft = Math.max(
            1,
            Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          );
          const dailyRequired = remaining > 0 ? Math.ceil(remaining / daysLeft) : 0;
          const isCompleted = percent >= 100;

          return (
            <div
              key={goal.id}
              className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-2xs transition-all ${
                isCompleted
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl shrink-0">
                      {goal.icon}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
                        {goal.title}
                      </h4>
                      <span className="text-[11px] text-neutral-500">
                        Target: {goal.targetDate}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                    {formatCurrency(goal.currentAmount, settings.currency)}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    of {formatCurrency(goal.targetAmount, settings.currency)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {percent}% saved
                  </span>
                  <span className="text-neutral-500">
                    {isCompleted ? 'Goal Reached! 🎉' : `${formatCurrency(remaining, settings.currency)} to go`}
                  </span>
                </div>

                {!isCompleted && daysLeft > 0 && (
                  <div className="mt-3 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                    <span>Save {formatCurrency(dailyRequired, settings.currency)}/day</span>
                    <span>{daysLeft} days left</span>
                  </div>
                )}
              </div>

              {/* Deposit / Withdraw Action */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                <button
                  onClick={() => setSelectedGoalForDeposit(goal)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Deposit / Withdraw</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Savings Goal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Add Savings Goal
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Goa Trip, New Tablet, Course Certification"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Choose Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${
                        icon === i
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 scale-105'
                          : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Target Amount ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Already Saved ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Target Deadline Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
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
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Deposit / Withdraw */}
      {selectedGoalForDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedGoalForDeposit.icon}</span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                  {selectedGoalForDeposit.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedGoalForDeposit(null)}
                className="text-neutral-400 text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-neutral-500">
              Current: <strong className="text-neutral-900 dark:text-white font-mono">{formatCurrency(selectedGoalForDeposit.currentAmount, settings.currency)}</strong> of {formatCurrency(selectedGoalForDeposit.targetAmount, settings.currency)}
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Amount to Add (or enter negative to withdraw)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 500 or -200"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                {[100, 250, 500, 1000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setDepositAmount(quick.toString())}
                    className="flex-1 py-1 text-[11px] font-mono font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-neutral-200 dark:border-neutral-700"
                  >
                    +{quick}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoalForDeposit(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  Update Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
