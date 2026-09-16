/**
 * Verified Indian Financial Facts & Regulatory Advisories
 * Sources: Reserve Bank of India (RBI), SEBI, AMFI, CRISIL, Ministry of Finance (CBDT)
 */
export const VERIFIED_FACTS = [
  {
    id: "rbi-dti-limit",
    source: "RBI Financial Stability Report",
    sourceTag: "RBI Verified",
    category: "Debt & Loans",
    icon: "shield-alert",
    urgency: "warning",
    title: "50% EMI Threshold is a Debt Trap Trigger",
    shortSnippet: "RBI alerts: Keeping total EMIs above 40-50% of net monthly income triggers acute financial vulnerability. Over 68% of personal defaults stem from multiple unhedged EMIs.",
    fullDetails: "The Reserve Bank of India cautions that when non-housing debt exceeds 35-40% of disposable income, any medical emergency or job disruption leads to immediate distress. Maintain total EMIs (including Home, Car, and Personal loans) strictly below 40% of your take-home pay.",
    actionableTip: "Aim for a Debt-to-Income (DTI) below 35%. Prioritize prepaying high-interest personal loans and credit card debt immediately."
  },
  {
    id: "sebi-fo-losses",
    source: "SEBI Official Study (2024)",
    sourceTag: "SEBI Study",
    category: "Stock Market & F&O",
    icon: "trending-down",
    urgency: "danger",
    title: "93% of Retail F&O Traders Incur Net Losses",
    shortSnippet: "Official SEBI research shows 93% of individual retail traders in Equity Futures & Options lost money between FY22-FY24, with average losses of ₹1.25 Lakhs per trader.",
    fullDetails: "Beyond pure trading losses, retail traders paid an additional 28% over their net trading losses as transaction costs, brokerages, and STT. SEBI urges retail investors to rely on long-term disciplined SIPs in broad market indices rather than speculative derivatives.",
    actionableTip: "Redirect speculative trading urges into a diversified index fund SIP (Nifty 50 / Nifty 500) compounding at historical 12-13% CAGR."
  },
  {
    id: "rbi-credit-card-trap",
    source: "RBI Master Directions on Credit Cards",
    sourceTag: "RBI Alert",
    category: "Credit Cards",
    icon: "credit-card",
    urgency: "danger",
    title: "The 42-48% APR Minimum Due Trap",
    shortSnippet: "Paying only the 'Minimum Amount Due' on credit cards charges compound interest of 3.5% to 4% per month (42-48% per annum). A ₹50,000 balance can take 9+ years to clear.",
    fullDetails: "When you pay only the Minimum Amount Due (typically 5%), the interest-free grace period on ALL fresh purchases is completely revoked. Interest starts compounding daily from the exact transaction date.",
    actionableTip: "Always pay the 'Total Amount Due' before the statement due date. Set up auto-debit for full payment, never for minimum due."
  },
  {
    id: "india-inflation-split",
    source: "MoSPI CPI & CRISIL Healthcare Index",
    sourceTag: "Economic Data",
    category: "Inflation",
    icon: "flame",
    urgency: "info",
    title: "Healthcare & Education Inflation is 10-12%",
    shortSnippet: "While general headline CPI inflation hovers around 5.0-5.5%, Medical inflation in India is 12-14% and Private Education inflation is 10-12% annually.",
    fullDetails: "A hospital procedure costing ₹3 Lakhs today will cost over ₹9.3 Lakhs in 10 years at 12% medical inflation. Money kept in traditional savings accounts (2.7-3.5%) or post-tax fixed deposits guaranteed loses purchasing power.",
    actionableTip: "Hold comprehensive health insurance of at least ₹10-15 Lakhs + Super Top-up, and invest long-term education goals in equity mutual funds."
  },
  {
    id: "new-tax-regime-sweet-spot",
    source: "Union Budget & CBDT Notification",
    sourceTag: "Tax Advisory",
    category: "Income Tax",
    icon: "receipt-tax",
    urgency: "success",
    title: "Zero Tax on Salaried Income up to ₹7.75 Lakhs",
    shortSnippet: "Under the New Tax Regime, salaried individuals pay ₹0 income tax on annual gross salary up to ₹7.75 Lakhs (Standard Deduction of ₹75,000 + Section 87A rebate).",
    fullDetails: "The revised tax slabs with a ₹75,000 standard deduction make the New Tax Regime substantially more beneficial for people without huge home loan interest or HRA deductions exceeding ₹3.5 Lakhs.",
    actionableTip: "Run our Tax Comparator below to see whether New or Old Tax Regime saves you more money based on your specific deductions."
  },
  {
    id: "emergency-fund-benchmark",
    source: "RBI Financial Literacy Survey & FPB",
    sourceTag: "Financial Planning",
    category: "Emergency Corpus",
    icon: "life-buoy",
    urgency: "warning",
    title: "6 Months Buffer Prevents Distress Borrowing",
    shortSnippet: "74% of households taking emergency personal loans at 15-24% interest lacked a 6-month liquid reserve. An emergency fund is your emotional and financial armor.",
    fullDetails: "An ideal emergency fund covers: 6 months of Rent + Utilities + Groceries + Monthly EMIs + Insurance premiums. Keep this parked in a combination of high-yield liquid mutual funds and multi-option fixed deposits.",
    actionableTip: "Never invest in equities or lock-in instruments before your 6-month emergency buffer is securely liquid."
  },
  {
    id: "direct-vs-regular-funds",
    source: "AMFI & SEBI Investor Education",
    sourceTag: "AMFI Verified",
    category: "Mutual Funds",
    icon: "pie-chart",
    urgency: "info",
    title: "Regular Plans Silently Eat 25-30% of Wealth",
    shortSnippet: "Choosing 'Direct Plans' over 'Regular Plans' saves 0.7% to 1.2% in annual distributor commissions. Over 25 years, this difference amounts to 25-30% additional corpus!",
    fullDetails: "On a ₹15,000 monthly SIP over 25 years at 12% gross returns, a Direct plan yields approximately ₹2.85 Crores, while a Regular plan yields ₹2.25 Crores—a loss of ₹60 Lakhs solely in hidden commissions.",
    actionableTip: "Always purchase mutual funds directly through AMC portals or zero-commission platforms with the word 'DIRECT-GROWTH' in the fund name."
  },
  {
    id: "insurance-investment-mix",
    source: "IRDAI Consumer Protection Bureau",
    sourceTag: "IRDAI / RBI",
    category: "Insurance",
    icon: "umbrella",
    urgency: "warning",
    title: "Never Mix Insurance with Investment (ULIPs/Endowment)",
    shortSnippet: "Traditional endowment and money-back policies historically yield only 4.5% to 5.5% returns, failing to even beat inflation while offering inadequate life cover.",
    fullDetails: "A pure Term Insurance policy provides ₹1 Crore to ₹2 Crore cover for a 30-year-old at just ₹900-₹1,400/month. The remaining surplus invested in diversified index funds generates 2x-3x higher wealth than bundled insurance-investment products.",
    actionableTip: "Buy a pure Term Life Insurance policy equal to 15-20x your annual in-hand salary, and invest your wealth separately."
  }
];
