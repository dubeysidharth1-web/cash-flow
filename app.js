document.addEventListener('DOMContentLoaded', () => {
  // --- Centralized App State ---
  let state = {
    salary: 0,
    expenses: [],
    currency: 'INR',
    theme: 'light',
    rates: { INR: 1, USD: 0.012, EUR: 0.011 } // Default rates, updated via API
  };

  // Global Chart instances to avoid duplicates
  let overviewChartInstance = null;
  let categoryChartInstance = null;

  // Currency Symbols Configuration
  const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€'
  };

  // Category Colors for Charts
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

  const salarySetupPanel = document.getElementById('salary-setup-panel');
  const salaryForm = document.getElementById('salary-form');
  const salaryInput = document.getElementById('salary-input');
  const salaryError = document.getElementById('salary-error');
  const editSalaryBtn = document.getElementById('edit-salary-btn');

  const expenseForm = document.getElementById('expense-form');
  const expenseNameInput = document.getElementById('expense-name');
  const expenseAmountInput = document.getElementById('expense-amount');
  const expenseCategorySelect = document.getElementById('expense-category');
  const expenseDateInput = document.getElementById('expense-date');

  const expenseNameError = document.getElementById('expense-name-error');
  const expenseAmountError = document.getElementById('expense-amount-error');
  const expenseDateError = document.getElementById('expense-date-error');

  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const expenseTableBody = document.getElementById('expense-table-body');
  const expenseEmptyState = document.getElementById('expense-empty-state');
  const downloadReportBtn = document.getElementById('download-report-btn');

  const overviewChartCanvas = document.getElementById('overview-chart-canvas');
  const overviewChartEmpty = document.getElementById('overview-chart-empty');
  const categoryChartCanvas = document.getElementById('category-chart-canvas');
  const categoryChartEmpty = document.getElementById('category-chart-empty');

  // --- Initialize Application ---
  init();

  async function init() {
    // 1. Set current date default on date picker
    const today = new Date().toISOString().split('T')[0];
    expenseDateInput.value = today;

    // 2. Load settings/themes
    loadTheme();
    loadStateFromStorage();

    // 3. Update active currency selectors
    currencySelect.value = state.currency;

    // 4. Fetch live exchange rates
    await fetchExchangeRates();

    // 5. Initial Render
    renderAll();
  }

  // --- Theme Controller (Phase 2 & Stretch) ---
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
  });

  // --- Fetch Currency Exchange Rates ---
  async function fetchExchangeRates() {
    try {
      // Free Frankfurter API
      const res = await fetch('https://api.frankfurter.app/latest?from=INR');
      if (!res.ok) throw new Error('Failed to fetch exchange rates');
      const data = await res.json();
      
      state.rates = {
        INR: 1,
        USD: data.rates.USD || 0.012,
        EUR: data.rates.EUR || 0.011
      };
    } catch (err) {
      console.warn('Using fallback exchange rates due to API offline state:', err.message);
      // Fail-safes loaded in State model
    }
  }

  // --- Data Serialization (Phase 2 LocalStorage) ---
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

  // --- Math Conversion Helpers ---
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

  // Render Stats & Threshold Warning (Phase 1, 2, 3)
  function renderOverview() {
    const totalSpent = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = state.salary - totalSpent;
    
    // DOM text values
    totalSalaryVal.textContent = formatVal(state.salary).split(' ')[1];
    totalExpensesVal.textContent = formatVal(totalSpent).split(' ')[1];
    remainingBalanceVal.textContent = formatVal(balance).split(' ')[1];

    // Currency Labels
    document.querySelectorAll('.currency-label').forEach(el => {
      el.textContent = state.currency;
    });

    totalExpensesSubtitle.textContent = `${state.expenses.length} expense log entries`;

    // Manage Setup Panel Visibility
    if (state.salary > 0) {
      salarySetupPanel.classList.add('hidden');
      editSalaryBtn.classList.remove('hidden');
    } else {
      salarySetupPanel.classList.remove('hidden');
      editSalaryBtn.classList.add('hidden');
    }

    // Remaining percentage calculations
    let percentRemaining = 100;
    if (state.salary > 0) {
      percentRemaining = Math.max(0, (balance / state.salary) * 100);
      balancePercentageDesc.textContent = `${percentRemaining.toFixed(1)}% of budget remaining`;
    } else {
      balancePercentageDesc.textContent = 'Initialize monthly salary first';
    }

    // Threshold Alert Trigger (< 10% of total salary) (Phase 3)
    if (state.salary > 0 && balance < (state.salary * 0.10)) {
      // Red UI Danger Theme mapping
      balanceCard.classList.remove('border-slate-200/50', 'dark:border-slate-800/50', 'border-emerald-500/10');
      balanceCard.classList.add('border-red-500/50', 'bg-red-50/10', 'dark:bg-red-950/10');
      remainingBalanceVal.classList.add('text-red-600', 'dark:text-red-400');
      balanceTag.classList.replace('text-emerald-500', 'text-red-500');
      balanceTag.classList.replace('dark:text-emerald-400', 'dark:text-red-400');
      balanceIconContainer.classList.replace('bg-emerald-500/10', 'bg-red-500/10');
      balanceIconContainer.classList.replace('text-emerald-500', 'text-red-500');
      balanceIconContainer.classList.replace('dark:text-emerald-400', 'dark:text-red-400');

      thresholdPill.classList.remove('hidden');
      thresholdAlertBanner.classList.remove('hidden');
    } else {
      // Normal emerald theme mapping
      balanceCard.classList.remove('border-red-500/50', 'bg-red-50/10', 'dark:bg-red-950/10');
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

  // Render Table Logs with Search / Sort / Filter (Phase 1, 2 & User Stretch)
  function renderList() {
    const searchVal = searchInput.value.toLowerCase().trim();
    const sortVal = sortSelect.value;

    // Filter logs
    let filtered = state.expenses.filter(item => {
      return item.name.toLowerCase().includes(searchVal) || item.category.toLowerCase().includes(searchVal);
    });

    // Sort logs
    filtered.sort((a, b) => {
      if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortVal === 'amount-desc') return b.amount - a.amount;
      if (sortVal === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    // Render nodes
    expenseTableBody.innerHTML = '';
    
    if (filtered.length === 0) {
      expenseEmptyState.classList.remove('hidden');
    } else {
      expenseEmptyState.classList.add('hidden');
      
      filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-100/30 dark:hover:bg-slate-900/10 transition-colors duration-150';
        
        // Date Formatter
        const displayDate = new Date(item.date).toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric' 
        });

        tr.innerHTML = `
          <td class="py-3 pr-2 font-medium text-slate-500 dark:text-slate-400">${displayDate}</td>
          <td class="py-3 pr-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold" style="background-color: ${categoryColors[item.category]}20; color: ${categoryColors[item.category]}; border: 1px solid ${categoryColors[item.category]}30">
              ${item.category}
            </span>
          </td>
          <td class="py-3 pr-2 font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[120px]">${item.name}</td>
          <td class="py-3 pr-2 font-bold text-right text-slate-900 dark:text-white">${formatVal(item.amount)}</td>
          <td class="py-3 text-right">
            <button class="delete-btn text-slate-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-200" data-id="${item.id}" aria-label="Delete expense">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;
        
        expenseTableBody.appendChild(tr);
      });

      // Hook Delete buttons (Phase 2 Delete operation)
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          deleteExpense(id);
        });
      });
    }
  }

  // Render Visual Charts (Phase 2 Chart.js & User Category breakdown)
  function renderCharts() {
    const totalSpent = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = Math.max(0, state.salary - totalSpent);

    const isDarkMode = htmlElement.classList.contains('dark');
    const textThemeColor = isDarkMode ? '#94a3b8' : '#64748b';
    const borderThemeColor = isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 1)';

    // --- Chart 1: Budget Share (Remaining vs Spent) ---
    if (state.salary === 0) {
      overviewChartEmpty.classList.remove('hidden');
      overviewChartCanvas.classList.add('hidden');
    } else {
      overviewChartEmpty.classList.add('hidden');
      overviewChartCanvas.classList.remove('hidden');

      // Destroy old instance to avoid hover duplication bugs (QA FAQ #8)
      if (overviewChartInstance) overviewChartInstance.destroy();

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
    }

    // --- Chart 2: Category Doughnut Chart ---
    if (state.expenses.length === 0) {
      categoryChartEmpty.classList.remove('hidden');
      categoryChartCanvas.classList.add('hidden');
    } else {
      categoryChartEmpty.classList.add('hidden');
      categoryChartCanvas.classList.remove('hidden');

      // Group totals by category
      const categoriesGrouped = {};
      Object.keys(categoryColors).forEach(cat => categoriesGrouped[cat] = 0);
      
      state.expenses.forEach(item => {
        categoriesGrouped[item.category] += item.amount;
      });

      // Filter categories that have spending > 0
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

      if (categoryChartInstance) categoryChartInstance.destroy();

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
          }
        }
      });
    }
  }

  // --- Actions & State Modifiers ---

  // Currency Selection Change handler
  currencySelect.addEventListener('change', (e) => {
    state.currency = e.target.value;
    renderAll();
  });

  // Salary setup / update submit logic (Phase 1 & 2)
  salaryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const salaryVal = parseFloat(salaryInput.value);
    
    // Validation
    if (isNaN(salaryVal) || salaryVal <= 0) {
      salaryError.classList.remove('hidden');
      salaryInput.classList.add('border-red-500', 'focus:ring-red-500/20');
      return;
    }

    salaryError.classList.add('hidden');
    salaryInput.classList.remove('border-red-500', 'focus:ring-red-500/20');

    // Store in base currency (INR) depending on what rates the display had
    // If the input was entered while USD selected, convert back to INR base
    const convertedToINR = salaryVal / state.rates[state.currency];
    state.salary = convertedToINR;
    
    salaryInput.value = '';
    renderAll();
  });

  // Inline salary editing
  editSalaryBtn.addEventListener('click', () => {
    salarySetupPanel.classList.remove('hidden');
    editSalaryBtn.classList.add('hidden');
    
    // Pre-populate input in current currency scale
    salaryInput.value = (state.salary * state.rates[state.currency]).toFixed(0);
    salaryInput.focus();
  });

  // Expense logging form submit logic (Phase 1, 2 & User Category/Date selection)
  expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = expenseNameInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const category = expenseCategorySelect.value;
    const date = expenseDateInput.value;

    let hasError = false;

    // Name Validation
    if (!name) {
      expenseNameError.classList.remove('hidden');
      expenseNameInput.classList.add('border-red-500', 'focus:ring-red-500/20');
      hasError = true;
    } else {
      expenseNameError.classList.add('hidden');
      expenseNameInput.classList.remove('border-red-500', 'focus:ring-red-500/20');
    }

    // Amount Validation
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

    // Push new log object to array
    const newExpense = {
      id: 'exp_' + Date.now() + Math.random().toString(36).substr(2, 9),
      name: name,
      amount: amountInINR,
      category: category,
      date: date
    };

    state.expenses.push(newExpense);

    // Reset fields (keeping current date preset)
    expenseNameInput.value = '';
    expenseAmountInput.value = '';
    
    renderAll();
  });

  // Delete Expense state updater (Phase 2 Delete action)
  function deleteExpense(id) {
    state.expenses = state.expenses.filter(item => item.id !== id);
    renderAll();
  }

  // Real-time search/filters listeners
  searchInput.addEventListener('input', renderList);
  sortSelect.addEventListener('change', renderList);

  // --- jsPDF Report Generation (Phase 3 & Stretch) ---
  downloadReportBtn.addEventListener('click', () => {
    // 1. Resolve jsPDF namespace depending on loading scope
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const symbol = currencySymbols[state.currency];
    const totalSpent = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = state.salary - totalSpent;

    // --- PDF Theme Styling ---
    doc.setFillColor(99, 102, 241); // Indigo color banner
    doc.rect(0, 0, 210, 35, 'F');

    // Title text inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CASH-FLOW STATEMENT', 15, 23);

    // Sub-title date log
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Active Currency: ${state.currency}`, 15, 30);

    // --- Overview Metrics Section ---
    doc.setTextColor(15, 23, 42); // Dark slate
    doc.setFontSize(13);
    doc.setFont('Helvetica', 'bold');
    doc.text('STATEMENT FINANCIAL SUMMARY', 15, 50);

    doc.setDrawColor(226, 232, 240); // Soft grey line
    doc.line(15, 53, 195, 53);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('Monthly Income Set:', 15, 62);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${formatVal(state.salary)}`, 65, 62);

    doc.setFont('Helvetica', 'normal');
    doc.text('Total Expenditures:', 15, 70);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`${formatVal(totalSpent)}`, 65, 70);

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'normal');
    doc.text('Remaining Balance:', 15, 78);
    doc.setFont('Helvetica', 'bold');
    
    // Balance color depending on warning alert triggers
    if (balance < (state.salary * 0.10)) {
      doc.setTextColor(239, 68, 68); // Red warning
    } else {
      doc.setTextColor(16, 185, 129); // Emerald success
    }
    doc.text(`${formatVal(balance)}`, 65, 78);

    // --- Category Spend Breakdown ---
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

    // --- Expenditures Table ---
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('EXPENDITURE LOG REGISTRY', 15, 115);
    doc.line(15, 118, 195, 118);

    // Table headers layout
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
      // Manage page overflows (max 15 rows for simple statement layouts)
      if (rowY > 270) {
        doc.addPage();
        
        // Re-header for new page
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

      // Alternate row backgrounds for readability
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
      doc.text(item.name.substr(0, 35), 90, rowY); // Truncate long names
      doc.text(formatVal(item.amount), 165, rowY);

      rowY += 8;
    });

    // --- Footer Branding ---
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for choosing Cash-Flow personal financial services. Generated by Cashflow App © 2026.', 15, 287);

    // Save file locally
    doc.save('CashFlow-Statement-Report.pdf');
  });

});
