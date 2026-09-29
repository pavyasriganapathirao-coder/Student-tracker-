import React, { useState, useEffect } from 'react';
import { 
  User, 
  Wallet, 
  Coins, 
  Moon, 
  Sun, 
  Download, 
  Trash2, 
  RotateCcw, 
  Check, 
  CheckCircle2,
  FileSpreadsheet,
  Bot,
  Sparkles
} from 'lucide-react';
import { UserSettings, CurrencyCode, Expense } from '../types';
import { CURRENCIES, formatCurrency } from '../utils/formatters';
import { DEFAULT_N8N_WEBHOOK_URL } from '../utils/storage';

interface SettingsViewProps {
  settings: UserSettings;
  expenses: Expense[];
  onUpdateSettings: (settings: UserSettings) => void;
  onClearAllData: () => void;
  onRestoreSampleData: () => void;
  onExportCSV: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  expenses,
  onUpdateSettings,
  onClearAllData,
  onRestoreSampleData,
  onExportCSV,
}) => {
  const [studentName, setStudentName] = useState(settings.studentName);
  const [monthlyBudget, setMonthlyBudget] = useState(settings.monthlyBudget.toString());
  const [currency, setCurrency] = useState<CurrencyCode>(settings.currency);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(settings.n8nWebhookUrl || DEFAULT_N8N_WEBHOOK_URL);
  const [savedAlert, setSavedAlert] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'testing' | 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setN8nWebhookUrl(settings.n8nWebhookUrl || DEFAULT_N8N_WEBHOOK_URL);
  }, [settings.n8nWebhookUrl]);

  const handleTestWebhook = async () => {
    const url = n8nWebhookUrl.trim() || DEFAULT_N8N_WEBHOOK_URL;
    setTestResult({ status: 'testing', message: 'Connecting to n8n webhook...' });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          chatInput: 'Hello n8n test ping from SpendWise',
          message: 'Hello n8n test ping from SpendWise',
          sessionId: 'test_' + Date.now().toString(36),
          metadata: { test: true, timestamp: Date.now() },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      setTestResult({
        status: 'success',
        message: 'Successfully reached n8n agent! Status 200 OK.',
      });
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err?.message || 'Failed to reach n8n webhook. Check CORS and workflow status.',
      });
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseFloat(monthlyBudget);
    const validBudget = !isNaN(budgetNum) && budgetNum > 0 ? budgetNum : settings.monthlyBudget;

    onUpdateSettings({
      ...settings,
      studentName: studentName.trim() || 'Student',
      monthlyBudget: validBudget,
      currency,
      n8nWebhookUrl: n8nWebhookUrl.trim() || DEFAULT_N8N_WEBHOOK_URL,
    });

    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Customize your student profile, currency preference, and manage your data
        </p>
      </div>

      {/* Profile & Budget Preferences Card */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-4">
          Profile & Preferences
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Student Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Alex Sharma"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Monthly Budget */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Default Monthly Budget ({CURRENCIES[currency]?.symbol})
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Currency Picker */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Display Currency
              </label>
              <div className="relative">
                <Coins className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                    <option key={c} value={c}>
                      {CURRENCIES[c].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dark/Light Mode Switcher */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Interface Appearance
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, darkMode: false })}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                    !settings.darkMode
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, darkMode: true })}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                    settings.darkMode
                      ? 'border-emerald-500 bg-neutral-800 text-white'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-sky-400" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
            {savedAlert ? (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Preferences saved successfully!</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>

      {/* n8n AI Agent Chatbot Webhook Card */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Bot className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                n8n AI Advisor Chatbot
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Active & Connected
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Your SpendWise app communicates directly with your personal n8n AI Agent. When asking questions, live spending totals, remaining budget, and category summaries are passed along for personalized student financial advice.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            n8n Webhook Chat URL
          </label>
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              type="url"
              value={n8nWebhookUrl}
              onChange={(e) => setN8nWebhookUrl(e.target.value)}
              placeholder="https://pavyasri.app.n8n.cloud/webhook/.../chat"
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testResult?.status === 'testing'}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors shrink-0 disabled:opacity-50"
              >
                {testResult?.status === 'testing' ? 'Testing...' : 'Test Ping'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    n8nWebhookUrl: n8nWebhookUrl.trim() || DEFAULT_N8N_WEBHOOK_URL,
                  });
                  setSavedAlert(true);
                  setTimeout(() => setSavedAlert(false), 2500);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors shrink-0"
              >
                Save Webhook
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
                testResult.status === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : testResult.status === 'testing'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <span>{testResult.message}</span>
              <button
                type="button"
                onClick={() => setTestResult(null)}
                className="text-[10px] underline ml-2 shrink-0 opacity-80 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          <p className="text-[11px] text-neutral-500 font-mono">
            Default endpoint: {DEFAULT_N8N_WEBHOOK_URL}
          </p>
        </div>
      </div>

      {/* CSV Data Export Card */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Expense Data (CSV)</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Download your entire spending history from localStorage as a CSV file to open in Microsoft Excel, Google Sheets, or Apple Numbers.
            </p>
          </div>
          
          <button
            onClick={onExportCSV}
            disabled={expenses.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0 ${
              expenses.length === 0
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export {expenses.length} Records</span>
          </button>
        </div>

        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200/70 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-300">
          <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            CSV File Structure:
          </p>
          <p className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 break-all">
            Transaction ID, Date, Title, Category, Amount, Currency, Payment Method, Description, Timestamp
          </p>
        </div>
      </div>

      {/* Danger Zone & Reset */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-rose-700 dark:text-rose-400">
          Data Management & Reset
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Reset to student sample transactions or permanently erase all recorded entries from browser storage.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          
          <button
            type="button"
            onClick={onRestoreSampleData}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Sample College Data</span>
          </button>

          <button
            type="button"
            onClick={onClearAllData}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Expense Data</span>
          </button>

        </div>
      </div>

    </div>
  );
};
