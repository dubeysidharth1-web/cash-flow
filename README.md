# Cash-Flow | Personal Salary & Expense Tracker — Sprint 02

Welcome to the Sprint 02 deliverables for the **Cash-Flow personal dashboard module**.

This application is built entirely using **Vanilla JavaScript** (no JS frameworks) and styled with a custom **Tailwind CSS glassmorphism system**. It manages real-time monthly salaries, logged expenditures, budget allocations, categories, sorting filters, live exchange rate conversions, and detailed PDF report generations.

---

## 🚀 Live Demo & Repo Info

* **Live URL:** `[Pasted Deployed Link Here, e.g. https://cash-flow-sprint02.vercel.app]`
* **GitHub Repository:** `[Pasted GitHub Repository URL here]`
* **Video Explanation (2-3 mins):** `[Pasted Video Link Here, e.g., YouTube/Loom/Google Drive]`

### Dashboard Screenshot
![Cash-Flow Dashboard Mockup](https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80)
*(Note: Replace this image source with your actual deployed screenshot in your final GitHub commit!)*

---

## 🛠️ Architecture & File Tree

The module is structured as a single-page app containing raw static files to ensure maximum performance and compliance with Personal Dashboard audit limits:

```
cash-flow/
├── index.html            # Main Dashboard UI (HTML5, Tailwind, Chart.js, jsPDF, FontAwesome)
├── app.js                # Core JS logic (Exchange Rate API, LocalStorage, Validators, Canvas Redraws)
├── README.md             # This documentation file
└── Prompts.md            # AI prompts utilized
```

---

## 🌟 Key Features Implemented

### Phase 1: Base MVP (Mandatory - P0)
* **Form Inputs**: Capture income salary, expenditure names, item amounts, category badges, and logs date.
* **centralized State Model**: Manages states in base currency (INR) and multiplies by active exchange rates when displayed. Prevents calculation drift when toggling currencies.
* **Strict Validation**: Input validations block empty, negative, or invalid data submissions.

### Phase 2: Data Persistence & Visualization (P1)
* **LocalStorage Integration**: Serializes the salary and expense array to `cashflow_state`. Toggles theme settings under `cashflow_theme`. Data persists instantly across page reloads.
* **Delete Binds**: Delete buttons on log tables remove individual objects by ID, updating states, charts, and recalculating remaining balances dynamically.
* **Dynamic Visualization**: Integrated **Chart.js** CDN. Draws two dynamic panels:
  1. *Budget Share (Pie Chart)*: Remaining Balance vs. Total Expenses.
  2. *Category Spend (Doughnut Chart)*: Spending breakdown by Category (Food, Rent, Travel, Shopping, Utilities, Entertainment, Other).
  * Automatically invokes `.destroy()` on past chart instances before redrawing to prevent duplicate canvas hover glitches.

### Phase 3: APIs & Stretch Goals (P2)
* **Live Exchange Rate API**: Fetches live rates relative to INR from the **Frankfurter API** on load. Switches displays (salary, logs list, and charts) between **INR (₹)**, **USD ($)**, and **EUR (€)** dynamically.
* **jsPDF Report Export**: Incorporates the **jsPDF** library. Generates a cleanly formatted financial report document with item dates, category groups, spent amounts, totals summary, and custom warning highlights.
* **Budget Warning Alert**: If remaining balance falls below **10% of total salary**, the balance card turns red, text shifts, and a dismissible warning banner pops up.

---

## 💻 Running Locally

Since the application is built entirely of static front-end assets, you do not need any complex Node.js setups to run it:

1. Clone this repository to your local directory:
   ```bash
   git clone https://github.com/your-username/cash-flow.git
   cd cash-flow
   ```

2. Run a simple local HTTP server to preview:
   * **Python 3:** `python -m http.server 8000` (Access at `http://localhost:8000`)
   * **NPM (if installed):** `npx http-server` (Access at `http://localhost:8080`)
   * Or simply double-click `index.html` to open it directly in your browser.
