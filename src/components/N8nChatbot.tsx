import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { UserSettings, Expense } from '../types';
import { formatCurrency } from '../utils/formatters';
import { DEFAULT_N8N_WEBHOOK_URL } from '../utils/storage';

interface N8nChatbotProps {
  settings: UserSettings;
  expenses: Expense[];
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  'What is my remaining budget this month?',
  'How much have I spent on food?',
  'Can I afford a ₹300 outing this weekend?',
  'Give me 3 practical saving tips for college'
];

export const N8nChatbot: React.FC<N8nChatbotProps> = ({
  settings,
  expenses,
  isOpen,
  onToggle,
}) => {
  const webhookUrl = settings.n8nWebhookUrl || DEFAULT_N8N_WEBHOOK_URL;

  // Calculate live financial context for the AI agent
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const totalExpenses = (expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const thisMonthExpenses = (expenses || [])
    .filter((e) => e && e.date && e.date.startsWith(currentMonthPrefix))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const budget = settings?.monthlyBudget || 5000;
  const currency = settings?.currency || 'INR';
  const remainingBudget = budget - thisMonthExpenses;

  // Session ID for n8n chat persistence
  const [sessionId, setSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('spendwise_n8n_session_id');
    if (saved) return saved;
    const generated = 'sw_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    localStorage.setItem('spendwise_n8n_session_id', generated);
    return generated;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('spendwise_n8n_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `Hi ${settings.studentName || 'there'}! 👋 I am your SpendWise AI Advisor connected to your n8n agent.\n\nI have access to your live budget data (Monthly Budget: ${formatCurrency(settings.monthlyBudget, settings.currency)}, Remaining: ${formatCurrency(remainingBudget, settings.currency)}). How can I assist you with your college expenses today?`,
        timestamp: Date.now(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem('spendwise_n8n_messages', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now().toString(36),
      sender: 'user',
      text: messageContent,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setErrorStatus(null);

    // Prepare contextual payload for n8n AI workflow
    const payload = {
      action: 'sendMessage',
      chatInput: messageContent,
      message: messageContent,
      text: messageContent,
      input: messageContent,
      sessionId: sessionId,
      metadata: {
        studentName: settings.studentName,
        monthlyBudget: settings.monthlyBudget,
        currency: settings.currency,
        totalExpenses: totalExpenses,
        thisMonthExpenses: thisMonthExpenses,
        remainingBudget: remainingBudget,
        transactionsCount: expenses.length,
        currentDate: new Date().toISOString().split('T')[0],
      },
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook responded with HTTP ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let replyText = '';

      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (typeof json === 'string') {
          replyText = json;
        } else if (Array.isArray(json)) {
          const first = json[0];
          replyText = 
            first?.output || 
            first?.text || 
            first?.message || 
            first?.response || 
            first?.json?.output || 
            first?.json?.text || 
            (typeof first === 'string' ? first : JSON.stringify(first));
        } else if (json && typeof json === 'object') {
          replyText = 
            json.output || 
            json.text || 
            json.message || 
            json.response || 
            json.data || 
            (json.json && (json.json.output || json.json.text)) || 
            JSON.stringify(json);
        }
      } else {
        replyText = await response.text();
      }

      if (!replyText || replyText.trim() === '') {
        replyText = "I received your message, but the n8n agent returned an empty response. Please verify your n8n workflow output format.";
      }

      const assistantMsg: ChatMessage = {
        id: 'ast_' + Date.now().toString(36),
        sender: 'assistant',
        text: replyText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('n8n Chatbot request error:', err);
      setErrorStatus(err?.message || 'Failed to reach n8n webhook');
      
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now().toString(36),
        sender: 'system',
        text: `⚠️ Could not reach n8n Agent (${err?.message || 'Network error'}).\n\nWebhook URL:\n${webhookUrl}\n\nTips:\n1. Check that the n8n workflow is active.\n2. In n8n "Chat Trigger" or "Webhook" node, ensure response mode is set to "Respond with text" or JSON.\n3. Check CORS or network permissions in your n8n cloud dashboard.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (confirm('Start a fresh conversation with your n8n agent?')) {
      const newSession = 'sw_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      setSessionId(newSession);
      localStorage.setItem('spendwise_n8n_session_id', newSession);
      
      const freshMessages: ChatMessage[] = [
        {
          id: 'msg-welcome-fresh',
          sender: 'assistant',
          text: `Chat session refreshed! Ready to help with your student budget and expenses.`,
          timestamp: Date.now(),
        },
      ];
      setMessages(freshMessages);
      setErrorStatus(null);
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Bubble (Always visible when chat closed) */}
      {!isOpen && (
        <button
          onClick={() => onToggle(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group border border-emerald-500/50"
          aria-label="Open AI Advisor"
          title="Open SpendWise n8n AI Advisor"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full" />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight">AI Advisor</span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-200 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'inset-4 sm:inset-10 max-w-4xl mx-auto'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[410px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold truncate">SpendWise AI Advisor</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Connected" />
                </div>
                <p className="text-[11px] text-neutral-400 truncate">
                  Powered by n8n Agent Workflow
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
                title="Restart chat session"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors hidden sm:inline-block"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onToggle(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Bar */}
          <div className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-emerald-500" />
              <span>Left: {formatCurrency(remainingBudget, settings.currency)}</span>
            </span>
            <span className="truncate max-w-[170px]" title={webhookUrl}>
              n8n webhook active
            </span>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50/50 dark:bg-neutral-950/40">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSystem = msg.sender === 'system';

              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 whitespace-pre-wrap leading-relaxed"
                  >
                    {msg.text}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700/70 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-3.5 py-2 w-fit">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>n8n agent thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-3 pt-2 pb-1 border-t border-neutral-100 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-neutral-200 dark:border-neutral-700 transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask n8n agent about your expenses..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-xl text-white transition-colors shrink-0 ${
                !input.trim() || isLoading
                  ? 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-sm'
              }`}
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
