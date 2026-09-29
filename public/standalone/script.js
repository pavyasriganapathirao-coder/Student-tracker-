/**
 * SpendWise – Student Expense Tracker (Standalone Vanilla JS)
 * A clean, responsive expense management application for college students.
 * Works offline with localStorage without any backend.
 */

// Storage Keys
const STORAGE_KEY = 'spendwise_expenses_v1';
const SETTINGS_KEY = 'spendwise_settings_v1';

// Category Definitions & Emojis
const CATEGORIES = {
  Food: { emoji: '🍔', color: '#f97316' },
  Travel: { emoji: '🚌', color: '#0ea5e9' },
  Education: { emoji: '📚', color: '#8b5cf6' },
  Shopping: { emoji: '🛍️', color: '#ec4899' },
  Entertainment: { emoji: '🎬', color: '#eab308' },
  Bills: { emoji: '⚡', color: '#10b981' },
  Other: { emoji: '📦', color: '#64748b' }
};

// Initial Sample Data for College Students
const DEFAULT_EXPENSES = [
  {
    id: 'exp-1',
    title: 'Canteen Lunch & Juice',
    amount: 120,
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    description: 'Thali & fresh orange juice'
  },
  {
    id: 'exp-2',
    title: 'City Bus / Metro Pass',
    amount: 40,
    category: 'Travel',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    description: 'Daily commute token'
  },
  {
    id: 'exp-3',
    title: 'Classmate Notebooks (2 pcs)',
    amount: 80,
    category: 'Education',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    paymentMethod: 'UPI',
    description: 'Engineering mathematics notes'
  },
  {
    id: 'exp-4',
    title: 'Weekend Movie Ticket',
    amount: 250,
    category: 'Entertainment',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    paymentMethod: 'Debit Card',
    description: 'Evening show with batchmates'
  }
];

const DEFAULT_SETTINGS = {
  studentName: 'Alex',
  monthlyBudget: 5000,
  currency: '₹',
  darkMode: false
};

// Application State
let expenses = [];
let settings = {};
let pendingDeleteId = null;
let categoryChartInstance = null;
let dailyChartInstance = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  renderApp();
});

// Load state from localStorage
function loadData() {
  const savedExpenses = localStorage.getItem(STORAGE_KEY);
  expenses = savedExpenses ? JSON.parse(savedExpenses) : DEFAULT_EXPENSES;

  const savedSettings = localStorage.getItem(SETTINGS_KEY);
  settings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;

  // Apply dark mode
  if (settings.darkMode) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  // Pre-fill date in add form with today
  const dateInput = document.getElementById('form-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

// Save state to localStorage
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Dark Mode Toggle Button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      settings.darkMode = !settings.darkMode;
      document.body.classList.toggle('dark', settings.darkMode);
      themeToggle.innerText = settings.darkMode ? '☀️' : '🌙';
      saveData();
      renderCharts();
    });
  }

  // Expense History Filters
  document.getElementById('filter-search')?.addEventListener('input', renderExpenseTable);
  document.getElementById('filter-category')?.addEventListener('change', renderExpenseTable);
  document.getElementById('filter-date')?.addEventListener('change', renderExpenseTable);
  document.getElementById('sort-select')?.addEventListener('change', renderExpenseTable);

  // Confirm Delete Modal
  document.getElementById('confirm-delete-btn')?.addEventListener('click', executeDelete);
}

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.toggle('active', section.id === `tab-${tabId}`);
  });

  if (tabId === 'analytics') {
    renderCharts();
  }
}

// Format Currency
function formatMoney(amount) {
  return `${settings.currency}${Number(amount || 0).toLocaleString('en-IN')}`;
}

// Main Render Method
function renderApp() {
  renderDashboard();
  renderExpenseTable();
  renderBudgetPage();
  renderSettingsPage();
  renderCharts();
}

// 1. DASHBOARD RENDER
function renderDashboard() {
  document.getElementById('dash-student-name').innerText = settings.studentName || 'Student';

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const thisMonth = expenses
    .filter(e => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const today = expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const count = expenses.length;
  const remaining = settings.monthlyBudget - thisMonth;

  document.getElementById('dash-total').innerText = formatMoney(total);
  document.getElementById('dash-month').innerText = formatMoney(thisMonth);
  document.getElementById('dash-today').innerText = formatMoney(today);
  document.getElementById('dash-count').innerText = count.toString();
  document.getElementById('dash-remaining').innerText = formatMoney(remaining);

  // Budget progress
  const usagePercent = Math.min(100, Math.round((thisMonth / settings.monthlyBudget) * 100));
  const progressFill = document.getElementById('dash-progress');
  const budgetRatio = document.getElementById('budget-ratio-text');
  const badge = document.getElementById('budget-badge');
  const banner = document.getElementById('budget-banner');

  budgetRatio.innerText = `${formatMoney(thisMonth)} of ${formatMoney(settings.monthlyBudget)} used (${usagePercent}%)`;
  progressFill.style.width = `${Math.min(100, usagePercent)}%`;

  // Progress color & warnings
  progressFill.className = 'progress-bar-fill';
  if (thisMonth > settings.monthlyBudget) {
    progressFill.classList.add('danger');
    badge.className = 'badge badge-danger';
    badge.innerText = 'Over Budget!';
    banner.style.display = 'block';
    banner.className = 'alert-banner danger';
    banner.innerText = `⚠️ Budget Exceeded! You have spent ${formatMoney(thisMonth - settings.monthlyBudget)} over your monthly allowance of ${formatMoney(settings.monthlyBudget)}.`;
  } else if (usagePercent >= 80) {
    progressFill.classList.add('warning');
    badge.className = 'badge badge-warning';
    badge.innerText = 'Approaching Limit';
    banner.style.display = 'block';
    banner.className = 'alert-banner warning';
    banner.innerText = `⚠️ Caution: You have utilized ${usagePercent}% of your monthly budget. Only ${formatMoney(remaining)} remains.`;
  } else {
    badge.className = 'badge badge-success';
    badge.innerText = 'On Track';
    banner.style.display = 'none';
  }

  // Recent 4 Transactions
  const recentList = document.getElementById('dash-recent-list');
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent4 = sorted.slice(0, 4);

  if (recent4.length === 0) {
    recentList.innerHTML = `<p class="text-muted text-sm" style="padding: 1rem 0;">No transactions recorded yet.</p>`;
  } else {
    recentList.innerHTML = recent4.map(exp => {
      const cat = CATEGORIES[exp.category] || { emoji: '📦' };
      return `
        <div class="recent-item">
          <div class="recent-left">
            <span class="recent-icon">${cat.emoji}</span>
            <div>
              <div class="recent-title">${escapeHTML(exp.title)}</div>
              <div class="recent-sub">${exp.date} • ${exp.paymentMethod}</div>
            </div>
          </div>
          <div class="recent-amt mono">${formatMoney(exp.amount)}</div>
        </div>
      `;
    }).join('');
  }
}

// 2. EXPENSE HISTORY TABLE RENDER
function renderExpenseTable() {
  const tableBody = document.getElementById('expense-table-body');
  const emptyState = document.getElementById('empty-state');

  const search = (document.getElementById('filter-search')?.value || '').toLowerCase();
  const categoryFilter = document.getElementById('filter-category')?.value || 'ALL';
  const dateFilter = document.getElementById('filter-date')?.value || '';
  const sort = document.getElementById('sort-select')?.value || 'date-desc';

  let filtered = expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search) || (e.description || '').toLowerCase().includes(search);
    const matchesCat = categoryFilter === 'ALL' || e.category === categoryFilter;
    const matchesDate = !dateFilter || e.date === dateFilter;
    return matchesSearch && matchesCat && matchesDate;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sort === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sort === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sort === 'amount-desc') return b.amount - a.amount;
    if (sort === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  tableBody.innerHTML = filtered.map(e => {
    const cat = CATEGORIES[e.category] || { emoji: '📦' };
    return `
      <tr>
        <td>
          <strong>${escapeHTML(e.title)}</strong>
          ${e.description ? `<div class="text-muted text-sm">${escapeHTML(e.description)}</div>` : ''}
        </td>
        <td>
          <span class="cat-pill">${cat.emoji} ${e.category}</span>
        </td>
        <td class="mono">${e.date}</td>
        <td><span class="badge" style="background:var(--bg-main);border:1px solid var(--border);">${e.paymentMethod}</span></td>
        <td class="mono font-bold">${formatMoney(e.amount)}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm" onclick="editExpense('${e.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${e.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

// 3. BUDGET PAGE RENDER
function renderBudgetPage() {
  const budgetInput = document.getElementById('budget-input');
  if (budgetInput) budgetInput.value = settings.monthlyBudget;

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthSpent = expenses
    .filter(e => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const remaining = settings.monthlyBudget - thisMonthSpent;
  const usagePercent = Math.min(100, Math.round((thisMonthSpent / settings.monthlyBudget) * 100));

  // Remaining days in current month
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, lastDayOfMonth - now.getDate());
  const dailyTarget = Math.max(0, Math.round(remaining / remainingDays));

  document.getElementById('b-total').innerText = formatMoney(settings.monthlyBudget);
  document.getElementById('b-spent').innerText = formatMoney(thisMonthSpent);
  document.getElementById('b-remain').innerText = formatMoney(remaining);
  document.getElementById('b-percent').innerText = `${usagePercent}%`;
  document.getElementById('b-daily-target').innerText = `${formatMoney(dailyTarget)} / day`;

  const fill = document.getElementById('budget-page-progress');
  fill.style.width = `${Math.min(100, usagePercent)}%`;
  fill.className = 'progress-bar-fill';
  if (thisMonthSpent > settings.monthlyBudget) fill.classList.add('danger');
  else if (usagePercent >= 80) fill.classList.add('warning');
}

// 4. SETTINGS PAGE RENDER
function renderSettingsPage() {
  const nameInput = document.getElementById('setting-name');
  const currencyInput = document.getElementById('setting-currency');
  const themeInput = document.getElementById('setting-theme');

  if (nameInput) nameInput.value = settings.studentName || 'Alex';
  if (currencyInput) currencyInput.value = settings.currency || '₹';
  if (themeInput) themeInput.value = settings.darkMode ? 'dark' : 'light';

  document.querySelectorAll('.curr-sym').forEach(el => el.innerText = settings.currency);
  const formCurrSym = document.getElementById('form-curr-sym');
  if (formCurrSym) formCurrSym.innerText = settings.currency;
}

// 5. CHARTS (ANALYTICS)
function renderCharts() {
  const catCanvas = document.getElementById('categoryChart');
  const dailyCanvas = document.getElementById('dailyChart');
  if (!catCanvas || !dailyCanvas) return;

  // Category Aggregation
  const categoryTotals = {};
  Object.keys(CATEGORIES).forEach(k => categoryTotals[k] = 0);
  expenses.forEach(e => {
    if (categoryTotals[e.category] !== undefined) {
      categoryTotals[e.category] += Number(e.amount);
    } else {
      categoryTotals.Other += Number(e.amount);
    }
  });

  const catLabels = Object.keys(categoryTotals).filter(k => categoryTotals[k] > 0);
  const catData = catLabels.map(k => categoryTotals[k]);
  const catColors = catLabels.map(k => CATEGORIES[k]?.color || '#64748b');

  if (categoryChartInstance) categoryChartInstance.destroy();
  if (catLabels.length > 0) {
    categoryChartInstance = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: catColors,
          borderWidth: 2,
          borderColor: settings.darkMode ? '#18181b' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: settings.darkMode ? '#f4f4f5' : '#0f172a' } }
        }
      }
    });
  }

  // Daily Spending (Last 7 Days)
  const last7Days = [];
  const dailyTotals = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    last7Days.push(`${dayName} (${d.getDate()})`);

    const daySum = expenses
      .filter(e => e.date === dStr)
      .reduce((s, e) => s + Number(e.amount), 0);
    dailyTotals.push(daySum);
  }

  if (dailyChartInstance) dailyChartInstance.destroy();
  dailyChartInstance = new Chart(dailyCanvas, {
    type: 'bar',
    data: {
      labels: last7Days,
      datasets: [{
        label: `Daily Expenses (${settings.currency})`,
        data: dailyTotals,
        backgroundColor: '#059669',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: settings.darkMode ? '#a1a1aa' : '#64748b' },
          grid: { color: settings.darkMode ? '#27272a' : '#e2e8f0' }
        },
        x: {
          ticks: { color: settings.darkMode ? '#a1a1aa' : '#64748b' },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// FORM HANDLING (ADD & EDIT)
function handleFormSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById('form-edit-id').value;
  const title = document.getElementById('form-title').value.trim();
  const amount = parseFloat(document.getElementById('form-amount').value);
  const category = document.getElementById('form-category').value;
  const date = document.getElementById('form-date').value;
  const paymentMethod = document.getElementById('form-payment').value;
  const description = document.getElementById('form-desc').value.trim();

  // Validate
  if (!title) {
    showToast('Please provide an expense title.');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showToast('Amount must be a positive number greater than 0.');
    return;
  }
  if (!date) {
    showToast('Please select a valid date.');
    return;
  }

  if (editId) {
    // Edit existing
    const index = expenses.findIndex(x => x.id === editId);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], title, amount, category, date, paymentMethod, description };
      showToast('Expense updated successfully! 🎉');
    }
  } else {
    // Add new
    const newExpense = {
      id: 'exp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      title,
      amount,
      category,
      date,
      paymentMethod,
      description
    };
    expenses.unshift(newExpense);
    showToast('Expense recorded successfully! 🎉');
  }

  saveData();
  renderApp();

  // Reset form
  document.getElementById('expense-form').reset();
  document.getElementById('form-edit-id').value = '';
  document.getElementById('form-submit-btn').innerText = 'Save Expense';
  document.getElementById('form-date').value = new Date().toISOString().split('T')[0];

  switchTab('dashboard');
}

// Quick Add Preset
function quickAddExpense(title, amount, category, paymentMethod) {
  const newExpense = {
    id: 'exp_' + Date.now().toString(36),
    title,
    amount,
    category,
    date: new Date().toISOString().split('T')[0],
    paymentMethod,
    description: 'Quick student preset purchase'
  };
  expenses.unshift(newExpense);
  saveData();
  renderApp();
  showToast(`Added ${title} (${formatMoney(amount)})! 🚀`);
}

// Edit Expense
function editExpense(id) {
  const exp = expenses.find(e => e.id === id);
  if (!exp) return;

  document.getElementById('form-edit-id').value = exp.id;
  document.getElementById('form-title').value = exp.title;
  document.getElementById('form-amount').value = exp.amount;
  document.getElementById('form-category').value = exp.category;
  document.getElementById('form-date').value = exp.date;
  document.getElementById('form-payment').value = exp.paymentMethod;
  document.getElementById('form-desc').value = exp.description || '';

  document.getElementById('form-submit-btn').innerText = 'Update Expense';
  switchTab('add');
}

// Delete Modal Handling
function openDeleteModal(id) {
  pendingDeleteId = id;
  const exp = expenses.find(e => e.id === id);
  document.getElementById('delete-title').innerText = exp ? exp.title : 'this item';
  document.getElementById('delete-modal').style.display = 'flex';
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('delete-modal').style.display = 'none';
}

function executeDelete() {
  if (pendingDeleteId) {
    expenses = expenses.filter(e => e.id !== pendingDeleteId);
    saveData();
    renderApp();
    showToast('Expense deleted.');
  }
  closeDeleteModal();
}

// Budget Form Submit
function handleBudgetSubmit(e) {
  e.preventDefault();
  const val = parseFloat(document.getElementById('budget-input').value);
  if (!isNaN(val) && val > 0) {
    settings.monthlyBudget = val;
    saveData();
    renderApp();
    showToast('Monthly budget updated! 🎯');
  }
}

function setBudgetPreset(amt) {
  document.getElementById('budget-input').value = amt;
}

// Settings Form Submit
function handleSettingsSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('setting-name').value.trim();
  const currency = document.getElementById('setting-currency').value;
  const theme = document.getElementById('setting-theme').value;

  settings.studentName = name || 'Student';
  settings.currency = currency;
  settings.darkMode = theme === 'dark';

  document.body.classList.toggle('dark', settings.darkMode);
  saveData();
  renderApp();
  showToast('Settings saved successfully! ✅');
}

// Clear All Data
function confirmClearAll() {
  if (confirm('Are you sure you want to clear all expenses? This will delete all records.')) {
    expenses = [];
    saveData();
    renderApp();
    showToast('All transaction records cleared.');
  }
}

// Reset Filters
function resetFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-category').value = 'ALL';
  document.getElementById('filter-date').value = '';
  document.getElementById('sort-select').value = 'date-desc';
  renderExpenseTable();
}

// CSV Export (Excel & Google Sheets compatible with UTF-8 BOM)
function exportToCSV() {
  if (!expenses || expenses.length === 0) {
    showToast('No transactions to export!');
    return;
  }

  const headers = ['ID', 'Date', 'Title', 'Category', 'Amount', 'Currency', 'Payment Method', 'Description'];
  const rows = expenses.map(e => [
    e.id,
    e.date,
    `"${(e.title || '').replace(/"/g, '""')}"`,
    `"${(e.category || '').replace(/"/g, '""')}"`,
    e.amount,
    `"${settings.currency}"`,
    `"${(e.paymentMethod || '').replace(/"/g, '""')}"`,
    `"${(e.description || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SpendWise_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('CSV downloaded successfully! 📊');
}

// Simple Toast Notification
function showToast(msg) {
  const existing = document.querySelector('.toast-box');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-box';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// Helper: Escape HTML
function escapeHTML(str) {
  return (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
