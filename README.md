# Artha (अर्थ) — Indian Personal Finance & Purchase Decision Copilot

> **One-stop zero-login financial copilot engineered for Indian wealth creators.**  
> Evaluate purchase decisions, optimize taxes under FY 2024–25 / 2025–26 budget slabs, simulate inflation erosion, and stay informed with verified alerts from the **Reserve Bank of India (RBI)**, **SEBI**, and **AMFI**.

---

## 🌟 Key Highlights

- 🔒 **Zero Login & 100% Private**: Runs entirely in the client browser using `localStorage`. No server-side storage, no tracking cookies, and zero personal financial data ever leaves your device.
- 🇮🇳 **Calibrated for Indian Economic Realities**:
  - **Indian Tax Slabs (FY 2024-25 / 2025-26)**: Side-by-side comparison of New vs. Old Tax Regimes with ₹75,000 standard deduction and Section 87A rebate (zero tax up to ₹7.75 Lakhs gross income).
  - **Differentiated Inflation Modeling**: Simulates headline CPI (5.5%), Higher Education inflation (10%), and Medical inflation (12%).
  - **Indian Currency Formatting**: Native Lakhs (`L`) and Crores (`Cr`) notation across all calculators.
- 📢 **Verified Regulatory Awareness Ticker & Hover Cards**:
  - Continuous marquee and floating interactive card cycling verified warnings from **RBI Financial Stability Reports**, **SEBI Retail F&O Study**, **AMFI**, and **CBDT**.
  - Interactive Fact Explorer modal with official research context and actionable steps.
- ⚡ **Lightweight & High Performance**: Built with pure HTML5, Vanilla CSS (Obsidian Fintech design system), and Canvas charts with zero heavy external dependencies.

---

## 🛠️ Financial Decision Engines

### 1. 🛒 "Can I Afford This?" (Purchase Evaluator)
- Evaluates purchases (e.g., iPhone 16 Pro, Royal Enfield, Vacation, OLED TV) under **Lump-Sum Cash**, **No-Cost EMI**, or **Standard Loan**.
- **3-Tier Verdict**: Green Light (Confidently Affordable), Amber (Financial Stretch), or Red Flag (High Risk).
- **Life-Energy Hours**: Calculates the exact number of working days/hours you are trading of your life for this purchase.
- **Nifty 50 Opportunity Cost**: Projects what the money would compound into over 5, 10, and 20 years at 12% CAGR.
- **Cooling-Off Rule**: Enforces 7 to 30 days psychological cooldown for large discretionary purchases.

### 2. 📊 50-30-20 & Bharat Budget Health Score
- Adapts western 50-30-20 budgeting to Indian household realities (Essential Needs, Debt Servicing/EMIs, Discretionary Wants, Future Wealth).
- Live Financial Health Score (0–100) with diagnostic tips.
- Retina-crisp Canvas Donut Chart.

### 3. 📜 Income Tax Regime Optimizer (FY 24-25 / 25-26)
- Compares the **New Tax Regime** against the **Old Tax Regime** based on:
  - Section 80C (up to ₹1.5L)
  - Section 80D (Health Insurance)
  - Annual HRA Exemption
  - Home Loan Interest under Section 24(b) (up to ₹2L)
  - NPS Tier-1 under Section 80CCD(1B) (up to ₹50k)
- Identifies the exact cheaper regime and annual tax savings.

### 4. ⏳ Inflation & Purchasing Power Time Machine
- Demonstrates why money kept in bank savings accounts (3%) guaranteed loses purchasing power.
- Slider from 5 to 35 years with sectoral presets (CPI 5.5%, Education 10%, Healthcare 12%).
- Dynamic Canvas inflation curve showing future expense cost and real purchasing power of ₹1 Lakh.

### 5. ⚖️ Loan Prepayment vs. Equity SIP Comparator
- Resolves the classic Indian dilemma: *Should I prepay an 8.5%–9.5% loan or invest surplus into a 12% mutual fund SIP?*
- Shows total interest saved, years knocked off loan tenure, and net wealth advantage.

### 6. 🎯 Age-Based Goal & Retirement (FIRE) Planner
- Calculates asset allocation using the **Rule of (100 - Age)** for equity vs. fixed income.
- Suggests minimum **Pure Term Insurance** cover (20x annual in-hand salary).
- Suggests **Health Insurance** baseline and super top-up by age.
- Computes inflation-adjusted target retirement corpus (25x annual expenses) and monthly equity SIP required.

---

## 🚀 Getting Started Locally

No npm dependencies or build steps required. Simply clone and run any static file server:

```bash
# Clone the repository
git clone https://github.com/Abhishek270995/artha-finance.git

# Navigate into the project folder
cd artha-finance

# Start a local web server (using Python 3)
python3 -m http.server 4321

# Open in your browser
open http://localhost:4321
```

Or using Node:
```bash
npx serve .
```

---

## 🧪 Running Tests

To run the automated calculation test suite:
```bash
node test-runner.mjs
```

---

## 📂 Project Architecture

```
artha-finance/
├── index.html          # Semantic layout, modals, HUD, and 6 tool panes
├── css/
│   ├── main.css        # Design tokens, typography, Obsidian fintech theme
│   ├── components.css  # Ticker, floating cards, sliders, verdict banners
│   └── responsive.css  # Mobile breakpoints & clean print/PDF stylesheet
├── js/
│   ├── app.js          # App coordinator, tab router, print handler
│   ├── profile.js      # User profile state, presets, localStorage sync
│   ├── calculations.js # Tax slabs, inflation, SIP compounding, DTI, health score
│   ├── charts.js       # Lightweight Canvas charts (Donut, Bar, Line)
│   ├── facts.js        # Verified regulatory advisories (RBI, SEBI, AMFI)
│   └── purchase.js     # Purchase decision evaluator engine
├── test-runner.mjs     # Mathematical unit tests
└── README.md           # Documentation
```

---

## 📜 Regulatory Citations & Data Sources

- **Reserve Bank of India (RBI)**: Financial Stability Report (June 2024), Master Directions on Credit Card & Debit Card Issuance.
- **Securities and Exchange Board of India (SEBI)**: Analysis of Profit and Loss of Individual Traders dealing in Equity F&O Segment (2024).
- **Ministry of Finance (CBDT)**: Union Budget Tax Slabs, Finance Act 2024/2025.
- **Association of Mutual Funds in India (AMFI)**: Direct vs. Regular Plan TER guidelines.
- **Ministry of Statistics and Programme Implementation (MoSPI)** & **CRISIL**: Consumer Price Index (CPI) and Healthcare Inflation Index.

---

## ⚖️ Disclaimer

*Artha is an educational decision-support tool. It does not provide registered SEBI investment advice or licensed tax consultancy. Past performance of indices does not guarantee future market returns. Tax calculations reflect the provisions of the Indian Income Tax Act.*

---

## 📄 License

MIT License. Feel free to use, modify, and distribute.
