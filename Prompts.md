# Cash-Flow Salary & Expense Tracker — AI Prompts Log

In compliance with the **Prodesk IT AI Policy**, this log details the developer prompts and conceptual directions utilized during the pair-programming and creation of this module.

---

### Prompt 1: Glassmorphic Dashboard Layout (HTML & Tailwind)
> **Intent:** Create a mobile-responsive, glassmorphic layout using Tailwind CSS CDN, containing overview metrics cards, forms, and Chart.js canvas elements.
>
> **Prompt Used:**
> "Create a personal personal finance dashboard named 'Cash-Flow' using HTML5 and Tailwind CSS CDN. Design a responsive grid layout that divides into three panels on desktop: a left column for income and expense logs forms, a center column displaying income/spent/balance metrics cards and a table showing transaction history with search/sorting filters, and a right column containing canvas elements for Chart.js. Style the dashboard using glassmorphism (frosted panel blurs, fine translucid borders, radial background gradients) and include FontAwesome CDN for premium icons. Include a threshold alert banner at the top (initially hidden) to warn users when their budget is critical."

---

### Prompt 2: State Model & Exchange Rates (Vanilla JS App Engine)
> **Intent:** Design the centralized state model, local storage serialization, and API calls to fetch live exchange rates relative to INR.
>
> **Prompt Used:**
> "Write a Vanilla JavaScript application file 'app.js' that declares a centralized state model tracking: monthly salary, expense logs array (id, name, amount, category, date), selected currency, active theme, and a rates dictionary. On page load, initialize defaults, load values from localStorage (keys: 'cashflow_state' and 'cashflow_theme'), and query the keyless Frankfurter API ('https://api.frankfurter.app/latest?from=INR') to update live exchange rates for USD and EUR. Implement fallback conversion rates in case the API is offline."

---

### Prompt 3: Calculations, Conversions, & DOM Updates
> **Intent:** Build math mapping functions (storing values in base INR and multiplying by selected currency scaling factors), input validations, and list rendering.
>
> **Prompt Used:**
> "Implement calculation functions in app.js: all internal state variables (salary, expenses) must be stored in the base currency (INR) to prevent decimal calculation drifts. Write a display formatter helper that multiplies the base amount by the current currency rate and appends symbols (INR: ₹, USD: $, EUR: €). Add form validators to block negative values, empty descriptions, or invalid dates. Create DOM renders to update overview metrics cards, toggle the threshold warnings when remaining balance is < 10% of total salary, and generate list table rows with search filters and category badges."

---

### Prompt 4: Chart.js Canvas Draw & jsPDF Export Reports
> **Intent:** Program double Chart.js canvas redraws (pie chart and category doughnut breakdown) with past instance destruction, and format jsPDF export templates.
>
> **Prompt Used:**
> "Write the logic in app.js to render Chart.js plots. Draw a Pie Chart comparing Remaining Balance vs. Total Expenses and a Doughnut Chart summarizing expenditures by category. Ensure you store instances globally and invoke .destroy() on previous charts before redrawing to prevent canvas hover glitch duplicates. Additionally, integrate jsPDF library to construct a downloadable PDF financial statement, featuring branded Indigo banners, summary cards, and a clean tabular list of log entries with alternating row backgrounds."
