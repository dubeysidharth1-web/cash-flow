document.addEventListener('DOMContentLoaded', () => {
  // --- Centralized App State ---
  let state = {
    salary: 0,
    expenses: [],
    currency: 'INR',
    theme: 'light',
    activeCategoryFilter: null, // Filter logs by category
    rates: { INR: 1, USD: 0.012, EUR: 0.011 } // Default fallback rates, updated via API
  };

  // Global Chart instances to avoid duplicate render glitches
  let overviewChartInstance = null;
  let categoryChartInstance = null;

  // Currency Symbols Configuration
  const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€'
  };

  // Category Colors
  const categoryColors = {
    Food: '#f87171',       // Red-400
    Rent: '#60a5fa',       // Blue-400
    Travel: '#fbbf24',     // Amber-400
    Shopping: '#c084fc',   // Purple-400
    Utilities: '#2dd4bf',  // Teal-400
    Entertainment: '#f472b6', // Pink-400
    Other: '#94a3b8'       // Slate-400
  };

  // --- DOM Elements ---
  const htmlElement = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');
  const currencySelect = document.getElementById('currency-select');
  const resetAppBtn = document.getElementById('reset-app-btn');
  const toastContainer = document.getElementById('toast-container');

  const totalSalaryVal = document.getElementById('total-salary-val');
  const totalExpensesVal = document.getElementById('total-expenses-val');
  const remainingBalanceVal = document.getElementById('remaining-balance-val');
  const totalExpensesSubtitle = document.getElementById('total-expenses-subtitle');
  const balancePercentageDesc = document.getElementById('balance-percentage-desc');
  const balanceCard = document.getElementById('balance-card');
  const balanceTag = document.getElementById('balance-tag');
  const balanceIconContainer = document.getElementById('balance-icon-container');
  const thresholdPill = document.getElementById('threshold-pill');
  const thresholdAlertBanner = document.getElementById('threshold-alert-banner');

  // Inline Salary Editor nodes
  const salaryDisplayFrame = document.getElementById('salary-display-frame');
  const salaryEditFrame = document.getElementById('salary-edit-frame');
  const salaryInlineInput = document.getElementById('salary-inline-input');
  const salarySaveBtn = document.getElementById('salary-save-btn');
  const salaryCancelBtn = document.getElementById('salary-cancel-btn');
  const editSalaryBtn = document.getElementById('edit-salary-btn');

  // Expense Logger form elements
  const formPanelHeader = document.getElementById('form-panel-header');
  const formPanelDesc = document.getElementById('form-panel-desc');
  const expenseForm = document.getElementById('expense-form');
  const editExpenseId = document.getElementById('edit-expense-id');
  const expenseNameInput = document.getElementById('expense-name');
  const expenseAmountInput = document.getElementById('expense-amount');
  const expenseCategorySelect = document.getElementById('expense-category');
  const expenseDateInput = document.getElementById('expense-date');
  const submitExpenseBtn = document.getElementById('submit-expense-btn');
  const cancelEditExpenseBtn = document.getElementById('cancel-edit-expense-btn');

  const expenseNameError = document.getElementById('expense-name-error');
  const expenseAmountError = document.getElementById('expense-amount-error');
  const expenseDateError = document.getElementById('expense-date-error');

  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const expenseTableBody = document.getElementById('expense-table-body');
  const expenseEmptyState = document.getElementById('expense-empty-state');
  const downloadReportBtn = document.getElementById('download-report-btn');

  // Active Category Filter alert nodes
  const activeFilterIndicator = document.getElementById('active-filter-indicator');
  const filteredCatName = document.getElementById('filtered-cat-name');
  const clearCatFilterBtn = document.getElementById('clear-cat-filter-btn');

  const overviewChartCanvas = document.getElementById('overview-chart-canvas');
  const overviewChartEmpty = document.getElementById('overview-chart-empty');
  const categoryChartCanvas = document.getElementById('category-chart-canvas');
  const categoryChartEmpty = document.getElementById('category-chart-empty');

  // --- Initialize App ---
  init();

  async function init() {
    // 1. Set current date default on date picker
    const today = new Date().toISOString().split('T')[0];
    expenseDateInput.value = today;

    // 2. Load settings/themes from LocalStorage (Phase 2 Data Persistence)
    loadTheme();
    loadStateFromStorage();

    // 3. Update selectors
    currencySelect.value = state.currency;

    // 4. Fetch live exchange rates (Phase 3 API)
    await fetchExchangeRates();

    // 5. Initial Render
    renderAll();
    showToast('Dashboard initialized successfully!', 'info');
  }

  // --- Toast Alerts System (Stretch Interactive Addition) ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold transform translate-y-2 opacity-0 transition-all duration-300 ${
      type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
      type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' :
      'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
    }`;

    const icons = {
      success: '<i class="fa-solid fa-circle-check text-sm"></i>',
      danger: '<i class="fa-solid fa-circle-exclamation text-sm"></i>',
      info: '<i class="fa-solid fa-circle-info text-sm"></i>'
    };

    toast.innerHTML = `
      ${icons[type]}
      <span class="flex-grow">${message}</span>
      <button class="toast-close-btn opacity-60 hover:opacity-100"><i class="fa-solid fa-xmark"></i></button>
    `;

    toastContainer.appendChild(toast);

    // Fade and slide toast in
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 20);

    // Auto dismiss after 3 seconds
    const dismissTimer = setTimeout(() => {
      dismissToast(toast);
    }, 3500);

    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
      clearTimeout(dismissTimer);
      dismissToast(toast);
    });
  }

  function dismissToast(toast) {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  // --- Theme Controller (Phase 2 Theme Persistence) ---
  function loadTheme() {
    const savedTheme = localStorage.getItem('cashflow_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      htmlElement.classList.add('dark');
      state.theme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      state.theme = 'light';
    }
  }

  themeToggleBtn.addEventListener('click', () => {
    const isDark = htmlElement.classList.toggle('dark');
    state.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('cashflow_theme', state.theme);
    showToast(`Switched to ${state.theme} mode`, 'info');
    renderCharts(); // Re-render charts to adjust text grids
  });

  // --- Fetch Exchange Rates API ---
  async function fetchExchangeRates() {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=INR');
      if (!res.ok) throw new Error('API failed to respond');
      const data = await res.json();
      
      state.rates = {
        INR: 1,
        USD: data.rates.USD || 0.012,
        EUR: data.rates.EUR || 0.011
      };
    } catch (err) {
      console.warn('Using fallback exchange rates due to API offline state:', err.message);
    }
  }

  // --- LocalStorage Integration (Phase 2 Data Persistence) ---
  function saveStateToStorage() {
    localStorage.setItem('cashflow_state', JSON.stringify({
      salary: state.salary,
      expenses: state.expenses,
      currency: state.currency
    }));
  }

  function loadStateFromStorage() {
    const saved = localStorage.getItem('cashflow_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state.salary = Number(parsed.salary) || 0;
        state.expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
        state.currency = parsed.currency || 'INR';
      } catch (err) {
        console.error('Failed to parse localStorage state:', err);
      }
    }
  }

  // --- Reset App Action ---
  resetAppBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data and start fresh? This action cannot be undone.')) {
      localStorage.removeItem('cashflow_state');
      localStorage.removeItem('cashflow_theme');
      showToast('Dashboard reset successfully! Reloading...', 'danger');
      setTimeout(() => window.location.reload(), 1000);
    }
  });

  // --- Currency Conversion Helpers ---
  function formatVal(amountInINR) {
    const converted = amountInINR * state.rates[state.currency];
    const symbol = currencySymbols[state.currency];
    return `${symbol} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // --- DOM Render Controller ---
  function renderAll() {
    saveStateToStorage();
    renderOverview();
    renderList();
    renderCharts();
  }

  // Render Stats & Threshold Warnings
  function renderOverview() {
    const totalSpent = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = state.salary - totalSpent;
    
    totalSalaryVal.textContent = formatVal(state.salary).split(' ')[1];
    totalExpensesVal.textContent = formatVal(totalSpent).split(' ')[1];
    remainingBalanceVal.textContent = formatVal(balance).split(' ')[1];

    document.querySelectorAll('.currency-label').forEach(el => {
      el.textContent = state.currency;
    });

    totalExpensesSubtitle.textContent = `${state.expenses.length} logs recorded`;

    // Manage setup state placeholder
    if (state.salary > 0) {
      editSalaryBtn.textContent = 'Change Income';
    } else {
      editSalaryBtn.textContent = 'Set Income';
    }

    // Remaining Balance Percentage
    let percentRemaining = 100;
    if (state.salary > 0) {
      percentRemaining = Math.max(0, (balance / state.salary) * 100);
      balancePercentageDesc.textContent = `${percentRemaining.toFixed(1)}% of income remaining`;
    } else {
      balancePercentageDesc.textContent = 'Set income to calculate balance';
    }

    // Threshold Alert Banner Trigger (< 10% of total salary) (Phase 3 Threshold Alerts)
    if (state.salary > 0 && balance < (state.salary * 0.10)) {
      balanceCard.classList.remove('border-emerald-500/10');
      balanceCard.classList.add('border-red-500/50', 'bg-red-500/5', 'dark:bg-red-500/10', 'animate-pulse');
      remainingBalanceVal.classList.add('text-red-600', 'dark:text-red-400');
      balanceTag.classList.replace('text-emerald-500', 'text-red-500');
      balanceTag.classList.replace('dark:text-emerald-400', 'dark:text-red-400');
      balanceIconContainer.classList.replace('bg-emerald-500/10', 'bg-red-500/10');
      balanceIconContainer.classList.replace('text-emerald-500', 'text-red-500');
      balanceIconContainer.classList.replace('dark:text-emerald-400', 'dark:text-red-400');

      thresholdPill.classList.remove('hidden');
      thresholdAlertBanner.classList.remove('hidden');
    } else {
      balanceCard.classList.remove('border-red-500/50', 'bg-red-500/5', 'dark:bg-red-500/10', 'animate-pulse');
      balanceCard.classList.add('border-emerald-500/10');
      remainingBalanceVal.classList.remove('text-red-600', 'dark:text-red-400');
      balanceTag.classList.replace('text-red-500', 'text-emerald-500');
      balanceTag.classList.replace('dark:text-red-400', 'dark:text-emerald-400');
      balanceIconContainer.classList.replace('bg-red-500/10', 'bg-emerald-500/10');
      balanceIconContainer.classList.replace('text-red-500', 'text-emerald-500');
      balanceIconContainer.classList.replace('dark:text-red-400', 'dark:text-emerald-400');

      thresholdPill.classList.add('hidden');
      thresholdAlertBanner.classList.add('hidden');
    }
  }

  // Render Table Logs
  function renderList() {
    const searchVal = searchInput.value.toLowerCase().trim();
    const sortVal = sortSelect.value;

    // Filter by Category and Search query
    let filtered = state.expenses.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchVal) || item.category.toLowerCase().includes(searchVal);
      const matchesCategory = state.activeCategoryFilter ? item.category === state.activeCategoryFilter : true;
      return matchesSearch && matchesCategory;
    });

    // Update active category filter indicator banner
    if (state.activeCategoryFilter) {
      activeFilterIndicator.classList.remove('hidden');
      activeFilterIndicator.classList.add('flex');
      filteredCatName.textContent = state.activeCategoryFilter;
    } else {
      activeFilterIndicator.classList.add('hidden');
      activeFilterIndicator.classList.remove('flex');
    }

    // Sort logs
    filtered.sort((a, b) => {
      if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortVal === 'amount-desc') return b.amount - a.amount;
      if (sortVal === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    expenseTableBody.innerHTML = '';
    
    if (filtered.length === 0) {
      expenseEmptyState.classList.remove('hidden');
    } else {
      expenseEmptyState.classList.add('hidden');
      
      filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-100/30 dark:hover:bg-slate-900/10 transition-colors duration-150';
        
        const displayDate = new Date(item.date).toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric' 
        });

        tr.innerHTML = `
          <td class="py-3 pr-2 font-medium text-slate-500 dark:text-slate-400">${displayDate}</td>
          <td class="py-3 pr-2">
            <button class="cat-filter-badge inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold transition-transform hover:scale-105 active:scale-95" data-category="${item.category}" style="background-color: ${categoryColors[item.category]}20; color: ${categoryColors[item.category]}; border: 1px solid ${categoryColors[item.category]}30">
              ${item.category}
            </button>
          </td>
          <td class="py-3 pr-2 font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[120px]">${item.name}</td>
          <td class="py-3 pr-2 font-bold text-right text-slate-900 dark:text-white">${formatVal(item.amount)}</td>
          <td class="py-3 text-right">
            <div class="flex justify-end gap-3.5">
              <button class="edit-btn text-slate-400 hover:text-indigo-500 hover:scale-110 active:scale-95 transition-all duration-200" data-id="${item.id}" aria-label="Edit expense">
                <i class="fa-solid fa-pencil"></i>
              </button>
              <button class="delete-btn text-slate-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-200" data-id="${item.id}" aria-label="Delete expense">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        `;
        
        expenseTableBody.appendChild(tr);
      });

      // Hook Delete buttons (Phase 2 Delete)
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          deleteExpense(id);
        });
      });

      // Hook Edit buttons (CRUD Edit)
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          startEditExpense(id);
        });
      });

      // Hook Category Badge Click Filter
      document.querySelectorAll('.cat-filter-badge').forEach(badge => {
        badge.addEventListener('click', (e) => {
          const cat = e.currentTarget.getAttribute('data-category');
          state.activeCategoryFilter = cat;
          renderList();
        });
      });
    }
  }

  // Render Visual Charts (With Robust Exception Handling Fail-Safes)
  function renderCharts() {
    const totalSpent = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = Math.max(0, state.salary - totalSpent);

    const isDarkMode = htmlElement.classList.contains('dark');
    const textThemeColor = isDarkMode ? '#94a3b8' : '#64748b';
    const borderThemeColor = isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 1)';

    // --- Chart 1: Budget Share ---
    if (state.salary === 0) {
      overviewChartEmpty.classList.remove('hidden');
      overviewChartCanvas.classList.add('hidden');
    } else {
      overviewChartEmpty.classList.add('hidden');
      overviewChartCanvas.classList.remove('hidden');

      // Wrap Chart operations in Try-Catch to prevent failures from blocking validation flows
      try {
        if (overviewChartInstance) {
          overviewChartInstance.destroy();
          overviewChartInstance = null;
        }

        overviewChartInstance = new Chart(overviewChartCanvas, {
          type: 'pie',
          data: {
            labels: ['Remaining Balance', 'Spent Expenses'],
            datasets: [{
              data: [
                (balance * state.rates[state.currency]).toFixed(2), 
                (totalSpent * state.rates[state.currency]).toFixed(2)
              ],
              backgroundColor: ['#10b981', '#6366f1'], // Emerald & Indigo
              borderWidth: 2,
              borderColor: borderThemeColor
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: textThemeColor,
                  font: { family: 'Plus Jakarta Sans', size: 10, weight: 'bold' }
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const symbol = currencySymbols[state.currency];
                    return ` ${context.label}: ${symbol} ${Number(context.raw).toLocaleString()}`;
                  }
                }
              }
            }
          }
        });
      } catch (err) {
        console.error('Error drawing Overview Pie Chart:', err);
      }
    }

    // --- Chart 2: Category Doughnut Chart ---
    if (state.expenses.length === 0) {
      categoryChartEmpty.classList.remove('hidden');
      categoryChartCanvas.classList.add('hidden');
    } else {
      categoryChartEmpty.classList.add('hidden');
      categoryChartCanvas.classList.remove('hidden');

      try {
        // Group totals
        const categoriesGrouped = {};
        Object.keys(categoryColors).forEach(cat => categoriesGrouped[cat] = 0);
        
        state.expenses.forEach(item => {
          categoriesGrouped[item.category] += item.amount;
        });

        const labels = [];
        const data = [];
        const colors = [];

        Object.keys(categoriesGrouped).forEach(cat => {
          if (categoriesGrouped[cat] > 0) {
            labels.push(cat);
            data.push((categoriesGrouped[cat] * state.rates[state.currency]).toFixed(2));
            colors.push(categoryColors[cat]);
          }
        });

        if (categoryChartInstance) {
          categoryChartInstance.destroy();
          categoryChartInstance = null;
        }

        categoryChartInstance = new Chart(categoryChartCanvas, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: borderThemeColor
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: textThemeColor,
                  font: { family: 'Plus Jakarta Sans', size: 10, weight: 'bold' }
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const symbol = currencySymbols[state.currency];
                    return ` ${context.label}: ${symbol} ${Number(context.raw).toLocaleString()}`;
                  }
                }
              }
            },
            // Click to filter by slice category (Extra Interaction)
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const clickedLabel = labels[index];
                state.activeCategoryFilter = clickedLabel;
                renderList();
                showToast(`Filtered list logs by category: ${clickedLabel}`, 'info');
              }
            }
          }
        });
      } catch (err) {
        console.error('Error drawing Category Doughnut Chart:', err);
      }
    }
  }

  // --- Actions & Interactive Triggers ---

  // Clear Category Filter
  clearCatFilterBtn.addEventListener('click', () => {
    state.activeCategoryFilter = null;
    renderList();
    showToast('Category filter cleared', 'info');
  });

  // Currency Select Selector
  currencySelect.addEventListener('change', (e) => {
    state.currency = e.target.value;
    renderAll();
    showToast(`Currency changed to ${state.currency}`, 'info');
  });

  // --- Inline Salary Editor inside Card (Phase 2 & User Stretch) ---
  editSalaryBtn.addEventListener('click', () => {
    salaryDisplayFrame.classList.add('hidden');
    salaryEditFrame.classList.remove('hidden');
    
    // Scale input to match selected currency
    salaryInlineInput.value = (state.salary * state.rates[state.currency]).toFixed(0);
    salaryInlineInput.focus();
  });

  salaryCancelBtn.addEventListener('click', () => {
    salaryDisplayFrame.classList.remove('hidden');
    salaryEditFrame.classList.add('hidden');
  });

  salarySaveBtn.addEventListener('click', () => {
    const value = parseFloat(salaryInlineInput.value);
    
    // Validation
    if (isNaN(value) || value <= 0) {
      showToast('Salary must be a positive number!', 'danger');
      salaryInlineInput.classList.add('border-red-500');
      return;
    }

    salaryInlineInput.classList.remove('border-red-500');
    
    // Convert back from current currency scale to INR base
    const baseINRVal = value / state.rates[state.currency];
    state.salary = baseINRVal;
    
    salaryDisplayFrame.classList.remove('hidden');
    salaryEditFrame.classList.add('hidden');
    
    renderAll();
    showToast('Total Income updated successfully!', 'success');
  });

  // Expense Logger Form submission (Supports BOTH adding and editing logs - CRUD)
  expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = editExpenseId.value; // Checks if in edit mode
    const name = expenseNameInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const category = expenseCategorySelect.value;
    const date = expenseDateInput.value;

    let hasError = false;

    // Item Name Validation
    if (!name) {
      expenseNameError.classList.remove('hidden');
      expenseNameInput.classList.add('border-red-500', 'focus:ring-red-500/20');
      hasError = true;
    } else {
      expenseNameError.classList.add('hidden');
      expenseNameInput.classList.remove('border-red-500', 'focus:ring-red-500/20');
    }

    // Cost Validation
    if (isNaN(amount) || amount <= 0) {
      expenseAmountError.classList.remove('hidden');
      expenseAmountInput.classList.add('border-red-500', 'focus:ring-red-500/20');
      hasError = true;
    } else {
      expenseAmountError.classList.add('hidden');
      expenseAmountInput.classList.remove('border-red-500', 'focus:ring-red-500/20');
    }

    // Date Validation
    if (!date) {
      expenseDateError.classList.remove('hidden');
      expenseDateInput.classList.add('border-red-500', 'focus:ring-red-500/20');
      hasError = true;
    } else {
      expenseDateError.classList.add('hidden');
      expenseDateInput.classList.remove('border-red-500', 'focus:ring-red-500/20');
    }

    if (hasError) return;

    // Convert input amount to INR base
    const amountInINR = amount / state.rates[state.currency];

    if (id) {
      // --- EDIT MODE (Save Changes) ---
      const index = state.expenses.findIndex(exp => exp.id === id);
      if (index !== -1) {
        state.expenses[index] = {
          id: id,
          name: name,
          amount: amountInINR,
          category: category,
          date: date
        };
        showToast('Expense log entry updated!', 'success');
      }
      resetExpenseFormState();
    } else {
      // --- ADD MODE (New log) ---
      const newExpense = {
        id: 'exp_' + Date.now() + Math.random().toString(36).substr(2, 9),
        name: name,
        amount: amountInINR,
        category: category,
        date: date
      };
      
      state.expenses.push(newExpense);
      showToast('Expenditure logged successfully!', 'success');
    }

    // Reset inputs
    expenseNameInput.value = '';
    expenseAmountInput.value = '';
    
    renderAll();
  });

  // Setup Edit Expense mode
  function startEditExpense(id) {
    const item = state.expenses.find(exp => exp.id === id);
    if (!item) return;

    // Pre-populate values scaled to current currency
    editExpenseId.value = item.id;
    expenseNameInput.value = item.name;
    expenseAmountInput.value = (item.amount * state.rates[state.currency]).toFixed(2);
    expenseCategorySelect.value = item.category;
    expenseDateInput.value = item.date;

    // Update form header buttons to edit state
    formPanelHeader.innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo-500"></i> Edit Expense';
    formPanelDesc.textContent = `Modifying details for log entry "${item.name}".`;
    submitExpenseBtn.textContent = 'Save Changes';
    cancelEditExpenseBtn.classList.remove('hidden');

    // Scroll smoothly to form panel
    expenseForm.scrollIntoView({ behavior: 'smooth' });
    showToast('Editing expenditure log...', 'info');
  }

  // Cancel Edit expense triggers
  cancelEditExpenseBtn.addEventListener('click', resetExpenseFormState);

  function resetExpenseFormState() {
    editExpenseId.value = '';
    expenseNameInput.value = '';
    expenseAmountInput.value = '';
    expenseCategorySelect.selectedIndex = 0;
    
    const today = new Date().toISOString().split('T')[0];
    expenseDateInput.value = today;

    formPanelHeader.innerHTML = '<i class="fa-solid fa-circle-plus text-indigo-500"></i> Log Expense';
    formPanelDesc.textContent = 'Input individual expenditure logs. Values will scale relative to selected currencies.';
    submitExpenseBtn.textContent = 'Add Expenditure';
    cancelEditExpenseBtn.classList.add('hidden');
  }

  // Delete Expense state updater
  function deleteExpense(id) {
    const item = state.expenses.find(exp => exp.id === id);
    state.expenses = state.expenses.filter(item => item.id !== id);
    
    // Reset edit form if currently deleting the item that was being edited
    if (editExpenseId.value === id) {
      resetExpenseFormState();
    }

    renderAll();
    showToast(`Deleted expense: ${item ? item.name : 'Log entry'}`, 'danger');
  }

  // Real-time search/sort filters triggers
  searchInput.addEventListener('input', renderList);
  sortSelect.addEventListener('change', renderList);

  // --- jsPDF Report Generation (Phase 3 PDF) ---
  downloadReportBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const totalSpent = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = state.salary - totalSpent;

    // --- PDF Styling & Colored Indigo Banners ---
    doc.setFillColor(99, 102, 241); // Primary Indigo
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CASH-FLOW STATEMENT', 15, 23);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Active Currency: ${state.currency}`, 15, 30);

    // --- Overview Summary metrics ---
    doc.setTextColor(15, 23, 42); // Dark slate
    doc.setFontSize(13);
    doc.setFont('Helvetica', 'bold');
    doc.text('STATEMENT FINANCIAL SUMMARY', 15, 50);

    doc.setDrawColor(226, 232, 240); // Line
    doc.line(15, 53, 195, 53);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('Monthly Income Set:', 15, 62);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${formatVal(state.salary)}`, 65, 62);

    doc.setFont('Helvetica', 'normal');
    doc.text('Total Expenditures:', 15, 70);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(239, 68, 68); // Red spent
    doc.text(`${formatVal(totalSpent)}`, 65, 70);

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'normal');
    doc.text('Remaining Balance:', 15, 78);
    doc.setFont('Helvetica', 'bold');
    
    if (balance < (state.salary * 0.10)) {
      doc.setTextColor(239, 68, 68); // Red warn
    } else {
      doc.setTextColor(16, 185, 129); // Emerald success
    }
    doc.text(`${formatVal(balance)}`, 65, 78);

    // --- Category Spend summaries ---
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('EXPENDITURES BY CATEGORY', 115, 50);

    const categoriesGrouped = {};
    state.expenses.forEach(item => {
      categoriesGrouped[item.category] = (categoriesGrouped[item.category] || 0) + item.amount;
    });

    let catY = 62;
    doc.setFontSize(9);
    Object.keys(categoriesGrouped).forEach(cat => {
      doc.setFont('Helvetica', 'normal');
      doc.text(`${cat}:`, 115, catY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${formatVal(categoriesGrouped[cat])}`, 160, catY);
      catY += 8;
    });

    // --- Expenditures Logs table ---
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('EXPENDITURE LOG REGISTRY', 15, 115);
    doc.line(15, 118, 195, 118);

    // Headers
    doc.setFontSize(9);
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 123, 180, 8, 'F');
    doc.text('Date', 18, 128);
    doc.text('Category', 50, 128);
    doc.text('Item Name', 90, 128);
    doc.text('Amount Price', 165, 128);

    let rowY = 138;
    doc.setFont('Helvetica', 'normal');
    
    state.expenses.forEach((item, index) => {
      if (rowY > 270) {
        doc.addPage();
        
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('CASH-FLOW STATEMENT (Continued)', 15, 10);
        
        doc.setTextColor(15, 23, 42);
        doc.setFillColor(241, 245, 249);
        doc.rect(15, 25, 180, 8, 'F');
        doc.text('Date', 18, 30);
        doc.text('Category', 50, 30);
        doc.text('Item Name', 90, 30);
        doc.text('Amount Price', 165, 30);
        
        rowY = 40;
      }

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, rowY - 5, 180, 7, 'F');
      }

      const displayDate = new Date(item.date).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });

      doc.text(displayDate, 18, rowY);
      doc.text(item.category, 50, rowY);
      doc.text(item.name.substr(0, 35), 90, rowY);
      doc.text(formatVal(item.amount), 165, rowY);

      rowY += 8;
    });

    // Statement Branding Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for choosing Cash-Flow personal financial services. Generated by Cashflow App © 2026.', 15, 287);

    // Save download
    doc.save('CashFlow-Statement-Report.pdf');
    showToast('Report PDF download initiated!', 'success');
  });

});
