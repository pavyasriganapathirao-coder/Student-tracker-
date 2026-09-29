import React, { useState, useRef } from 'react';
import { X, Plus, Utensils, Bus, GraduationCap, ShoppingBag, Film, Receipt, CircleEllipsis, Mic, MicOff, Camera, Image as ImageIcon } from 'lucide-react';
import { Category, PaymentMethod, CurrencyCode, Expense } from '../types';
import { CURRENCIES } from '../utils/formatters';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  currency: CurrencyCode;
}

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'Food', label: 'Food', icon: <Utensils className="w-4 h-4" /> },
  { id: 'Travel', label: 'Travel', icon: <Bus className="w-4 h-4" /> },
  { id: 'Education', label: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'Shopping', label: 'Shopping', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'Entertainment', label: 'Entertainment', icon: <Film className="w-4 h-4" /> },
  { id: 'Bills', label: 'Bills', icon: <Receipt className="w-4 h-4" /> },
  { id: 'Other', label: 'Other', icon: <CircleEllipsis className="w-4 h-4" /> },
];

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Debit Card', 'Credit Card'];

const QUICK_PRESETS = [
  { label: 'Canteen Snack', title: 'Canteen Snack', amount: 40, category: 'Food' as Category, payment: 'Cash' as PaymentMethod },
  { label: 'Bus / Auto Fare', title: 'Bus / Auto Fare', amount: 30, category: 'Travel' as Category, payment: 'Cash' as PaymentMethod },
  { label: 'Campus Lunch', title: 'Campus Lunch', amount: 120, category: 'Food' as Category, payment: 'UPI' as PaymentMethod },
  { label: 'Prints & Photocopy', title: 'Study Materials Print', amount: 50, category: 'Education' as Category, payment: 'UPI' as PaymentMethod },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
  currency,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [description, setDescription] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [isListening, setIsListening] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation state
  const [errors, setErrors] = useState<{ title?: string; amount?: string; date?: string }>({});

  if (!isOpen) return null;

  // Speech Recognition Handler
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      setSpeechFeedback('Listening... Say e.g. "Lunch 120 rupees UPI"');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpeechFeedback(`Recognized: "${transcript}"`);
        
        // Extract numbers
        const numbers = transcript.match(/\d+(\.\d+)?/);
        if (numbers) {
          setAmount(numbers[0]);
        }

        // Detect category
        const lower = transcript.toLowerCase();
        if (lower.includes('food') || lower.includes('lunch') || lower.includes('canteen') || lower.includes('dinner') || lower.includes('snack') || lower.includes('tea') || lower.includes('coffee')) {
          setCategory('Food');
        } else if (lower.includes('travel') || lower.includes('bus') || lower.includes('metro') || lower.includes('auto') || lower.includes('cab') || lower.includes('uber')) {
          setCategory('Travel');
        } else if (lower.includes('book') || lower.includes('print') || lower.includes('class') || lower.includes('exam') || lower.includes('study') || lower.includes('pen')) {
          setCategory('Education');
        } else if (lower.includes('movie') || lower.includes('netflix') || lower.includes('game') || lower.includes('party')) {
          setCategory('Entertainment');
        } else if (lower.includes('recharge') || lower.includes('bill') || lower.includes('wifi')) {
          setCategory('Bills');
        }

        // Detect payment
        if (lower.includes('upi') || lower.includes('paytm') || lower.includes('gpay') || lower.includes('phonepe')) {
          setPaymentMethod('UPI');
        } else if (lower.includes('cash')) {
          setPaymentMethod('Cash');
        } else if (lower.includes('card')) {
          setPaymentMethod('Debit Card');
        }

        // Set title if clean
        const cleanedTitle = transcript
          .replace(/\b(rupees|rs|inr|\d+(\.\d+)?|upi|cash|card)\b/gi, '')
          .trim();
        if (cleanedTitle) {
          setTitle(cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1));
        }

        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setSpeechFeedback('Could not hear clearly. Try again!');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Receipt image must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const errs: { title?: string; amount?: string; date?: string } = {};

    if (!title.trim()) {
      errs.title = 'Please provide an expense title (e.g., Canteen Lunch)';
    } else if (title.trim().length < 2) {
      errs.title = 'Title must be at least 2 characters long';
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      errs.amount = 'Please enter a valid expense amount';
    } else if (numAmount <= 0) {
      errs.amount = 'Amount must be greater than zero';
    } else if (numAmount > 1000000) {
      errs.amount = 'Amount is unrealistically large for a student expense';
    }

    if (!date) {
      errs.date = 'Please choose a transaction date';
    } else {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        errs.date = 'Invalid date format';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onAddExpense({
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      date,
      paymentMethod,
      description: description.trim() || undefined,
      receiptImage,
    });

    // Reset fields
    setTitle('');
    setAmount('');
    setCategory('Food');
    setDate(todayStr);
    setPaymentMethod('UPI');
    setDescription('');
    setReceiptImage(undefined);
    setErrors({});
    onClose();
  };

  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setTitle(preset.title);
    setAmount(preset.amount.toString());
    setCategory(preset.category);
    setPaymentMethod(preset.payment);
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative bg-white dark:bg-neutral-900 rounded-xl max-w-lg w-full border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden transition-all my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="modal-title" className="text-lg font-bold text-neutral-900 dark:text-white">
                Add New Expense
              </h2>
              {isListening && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Listening...
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Log your spending to keep your budget on track
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleVoiceInput}
              title="Voice Dictation: Speak your expense (e.g. Lunch 120 rupees UPI)"
              className={`p-2 rounded-lg transition-colors border ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:text-emerald-600'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {speechFeedback && (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium border-b border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
            <span>{speechFeedback}</span>
            <button onClick={() => setSpeechFeedback(null)} className="text-emerald-600 hover:underline text-[10px]">
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Presets */}
        <div className="px-6 pt-3 pb-1 border-b border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/40">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
            Quick College Presets:
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {QUICK_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                + {p.label} ({CURRENCIES[currency]?.symbol}{p.amount})
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Title & Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Expense Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Canteen Lunch, Bus pass, Books"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                  errors.title 
                    ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500' 
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-rose-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Amount ({CURRENCIES[currency]?.symbol}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-neutral-400 font-mono">
                  {CURRENCIES[currency]?.symbol}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-7 pr-3 py-2 text-sm font-mono rounded-lg border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.amount 
                      ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500' 
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-rose-500">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.date 
                    ? 'border-rose-400 dark:border-rose-500' 
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-xs text-rose-500">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Optional Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Split with room partner, project notebook"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Receipt Photo Attachment */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Receipt Slip or Bill Photo (Optional)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {receiptImage ? (
              <div className="relative inline-block border rounded-xl overflow-hidden p-1 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                <img src={receiptImage} alt="Receipt Preview" className="h-20 w-auto rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setReceiptImage(undefined)}
                  className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-500"
                  title="Remove receipt"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 transition-colors"
              >
                <Camera className="w-4 h-4 text-neutral-400" />
                <span>Attach Bill / Receipt Photo</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Save Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
