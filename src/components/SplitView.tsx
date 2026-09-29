import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  UserCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { BillSplit, SplitFriend, UserSettings, Expense } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SplitViewProps {
  splits: BillSplit[];
  onUpdateSplits: (splits: BillSplit[]) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  settings: UserSettings;
}

export const SplitView: React.FC<SplitViewProps> = ({
  splits,
  onUpdateSplits,
  onAddExpense,
  settings,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidBy, setPaidBy] = useState<'me' | string>('me');
  const [customPayer, setCustomPayer] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [includeMe, setIncludeMe] = useState(true);
  const [friendsInput, setFriendsInput] = useState('Rohan, Priya');
  const [logAsExpense, setLogAsExpense] = useState(true);

  // Metrics
  // Total I am owed: when paidBy == 'me', unsettled friends' amounts
  let totalOwedToMe = 0;
  // Total I owe: when paidBy != 'me', if 'Alex (Me)' or 'me' is in friends list unsettled
  let totalIOwe = 0;

  splits.forEach((s) => {
    if (s.paidBy === 'me') {
      s.friends.forEach((f) => {
        if (!f.settled) totalOwedToMe += f.amount;
      });
    } else {
      s.friends.forEach((f) => {
        if (!f.settled && (f.name.toLowerCase().includes('me') || f.name.toLowerCase().includes(settings.studentName.toLowerCase()))) {
          totalIOwe += f.amount;
        }
      });
    }
  });

  const handleCreateSplit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) return;

    // Parse friend names
    const names = friendsInput
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) return;

    const actualPayer = paidBy === 'me' ? 'me' : (customPayer.trim() || 'Roommate');
    const totalParticipants = names.length + (includeMe && actualPayer !== 'me' ? 1 : (actualPayer === 'me' && includeMe ? 1 : 0));
    const splitShare = Math.round((total / Math.max(1, totalParticipants)) * 100) / 100;

    const friendsList: SplitFriend[] = [];

    if (actualPayer === 'me') {
      // Friends owe me
      names.forEach((name, idx) => {
        friendsList.push({
          id: 'sf_' + Date.now().toString(36) + '_' + idx,
          name,
          amount: splitShare,
          settled: false,
        });
      });
    } else {
      // Someone else paid
      if (includeMe) {
        friendsList.push({
          id: 'sf_me_' + Date.now().toString(36),
          name: `${settings.studentName} (Me)`,
          amount: splitShare,
          settled: false,
        });
      }
      names.forEach((name, idx) => {
        if (name.toLowerCase() !== actualPayer.toLowerCase()) {
          friendsList.push({
            id: 'sf_' + Date.now().toString(36) + '_' + idx,
            name,
            amount: splitShare,
            settled: false,
          });
        }
      });
    }

    const newSplit: BillSplit = {
      id: 'split_' + Date.now().toString(36),
      title: title.trim() || 'Shared Bill',
      totalAmount: total,
      paidBy: actualPayer,
      date,
      note: note.trim() || undefined,
      friends: friendsList,
      createdAt: Date.now(),
    };

    onUpdateSplits([newSplit, ...splits]);

    // Optional: Log personal share into primary expenses
    if (logAsExpense && actualPayer === 'me') {
      const myShare = includeMe ? splitShare : 0;
      if (myShare > 0) {
        onAddExpense({
          title: `${title.trim()} (My Share)`,
          amount: myShare,
          category: 'Food',
          date,
          paymentMethod: 'UPI',
          description: `Split total was ${formatCurrency(total, settings.currency)} shared with ${names.join(', ')}`,
          isSplit: true,
        });
      }
    }

    // Reset Form
    setTitle('');
    setTotalAmount('');
    setNote('');
    setFriendsInput('Rohan, Priya');
    setIsAddModalOpen(false);
  };

  const handleToggleSettle = (splitId: string, friendId: string) => {
    const updated = splits.map((s) => {
      if (s.id !== splitId) return s;
      return {
        ...s,
        friends: s.friends.map((f) => {
          if (f.id !== friendId) return f;
          return { ...f, settled: !f.settled };
        }),
      };
    });
    onUpdateSplits(updated);
  };

  const handleDeleteSplit = (id: string) => {
    if (confirm('Delete this split record?')) {
      onUpdateSplits(splits.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Split & Settle (Roommate IOUs)
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track canteen bills, shared cabs, Wi-Fi splits, and know exactly who owes whom.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Bill Split</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* You Are Owed */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              You are Owed
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalOwedToMe, settings.currency)}
            </div>
            <span className="text-[11px] text-neutral-400">From roommates & friends</span>
          </div>
        </div>

        {/* You Owe */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              You Owe
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(totalIOwe, settings.currency)}
            </div>
            <span className="text-[11px] text-neutral-400">Your pending repayments</span>
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Net Balance
            </span>
            <div className={`text-xl sm:text-2xl font-bold font-mono ${totalOwedToMe >= totalIOwe ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(totalOwedToMe - totalIOwe, settings.currency)}
            </div>
            <span className="text-[11px] text-neutral-400">
              {totalOwedToMe >= totalIOwe ? 'You are net positive' : 'You have pending dues'}
            </span>
          </div>
        </div>
      </div>

      {/* Bill Splits List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white">
          Active Bill Splits & Histories
        </h2>

        {splits.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 p-10 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">No Bill Splits Yet</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Split canteen snacks, hostel room groceries, or shared cab fares with friends and keep everything settled.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-2xs"
            >
              + Create First Split
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {splits.map((split) => {
              const isPayerMe = split.paidBy === 'me';
              const allSettled = split.friends.every((f) => f.settled);

              return (
                <div
                  key={split.id}
                  className={`bg-white dark:bg-neutral-900 rounded-2xl border transition-all p-5 space-y-4 shadow-2xs ${
                    allSettled
                      ? 'border-emerald-200/80 dark:border-emerald-900/40 opacity-80'
                      : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {split.title}
                        </h3>
                        {allSettled ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Fully Settled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {split.date} • Paid by{' '}
                        <strong className="text-neutral-700 dark:text-neutral-300">
                          {isPayerMe ? 'You' : split.paidBy}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="text-right">
                        <div className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                          {formatCurrency(split.totalAmount, settings.currency)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSplit(split.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-1"
                        title="Delete split"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {split.note && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      "{split.note}"
                    </p>
                  )}

                  {/* Friends & Settlement Breakdown */}
                  <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                      Individual Shares
                    </span>
                    <div className="space-y-1.5">
                      {split.friends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                              {friend.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                              {friend.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                              {formatCurrency(friend.amount, settings.currency)}
                            </span>

                            <button
                              onClick={() => handleToggleSettle(split.id, friend.id)}
                              className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                                friend.settled
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-200'
                              }`}
                            >
                              {friend.settled ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Settled</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>Mark Paid</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: New Bill Split */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Split a Bill with Friends
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateSplit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Bill Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Canteen Biryani & Shakes, Shared Cab, Wi-Fi"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Total Amount ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="e.g. 480"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Who Paid the Bill?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaidBy('me')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      paidBy === 'me'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    I Paid ({settings.studentName})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidBy('friend')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      paidBy !== 'me'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    Someone Else Paid
                  </button>
                </div>

                {paidBy !== 'me' && (
                  <input
                    type="text"
                    required
                    value={customPayer}
                    onChange={(e) => setCustomPayer(e.target.value)}
                    placeholder="Friend's Name (e.g. Kunal)"
                    className="w-full mt-2 px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Friends to Split with (Comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={friendsInput}
                  onChange={(e) => setFriendsInput(e.target.value)}
                  placeholder="e.g. Rohan, Priya, Aman"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  The total bill will be evenly divided amongst you and these friends.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="includeMeCheckbox"
                  checked={includeMe}
                  onChange={(e) => setIncludeMe(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="includeMeCheckbox" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Include my personal share in this split
                </label>
              </div>

              {paidBy === 'me' && includeMe && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="logExpenseCheckbox"
                    checked={logAsExpense}
                    onChange={(e) => setLogAsExpense(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="logExpenseCheckbox" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                    Also automatically record my personal share into my primary expenses
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. UPI ID: rohan@oksbi or table number"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  Create Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
