(() => {
  // js/calculations.js
  function formatINR(val, compact = false) {
    if (val === void 0 || val === null || isNaN(val)) return "\u20B90";
    const num = Math.round(Number(val));
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    if (compact) {
      if (absNum >= 1e7) {
        return `${isNegative ? "-" : ""}\u20B9${(absNum / 1e7).toFixed(2)} Cr`;
      }
      if (absNum >= 1e5) {
        return `${isNegative ? "-" : ""}\u20B9${(absNum / 1e5).toFixed(2)} L`;
      }
      if (absNum >= 1e3) {
        return `${isNegative ? "-" : ""}\u20B9${(absNum / 1e3).toFixed(1)} K`;
      }
    }
    const formatted = absNum.toLocaleString("en-IN");
    return `${isNegative ? "-" : ""}\u20B9${formatted}`;
  }
  function parseINR(str) {
    if (typeof str === "number") return str;
    if (!str) return 0;
    const cleaned = String(str).replace(/[^0-9.-]+/g, "");
    return parseFloat(cleaned) || 0;
  }
  function calculateDTI(monthlyEMI, inHandSalary) {
    if (!inHandSalary || inHandSalary <= 0) return 0;
    return Math.min(100, Math.round(monthlyEMI / inHandSalary * 100));
  }
  function calculateHealthScore({ salary, emi, expenses, age }) {
    if (!salary || salary <= 0) return { score: 0, status: "Insufficient Data", color: "#64748b" };
    const surplus = salary - emi - expenses;
    const dti = emi / salary * 100;
    const savingsRate = surplus / salary * 100;
    const expenseRatio = expenses / salary * 100;
    let score = 0;
    if (dti <= 20) score += 35;
    else if (dti <= 35) score += 28;
    else if (dti <= 45) score += 15;
    else if (dti <= 55) score += 5;
    else score += 0;
    if (savingsRate >= 35) score += 35;
    else if (savingsRate >= 25) score += 28;
    else if (savingsRate >= 15) score += 20;
    else if (savingsRate >= 5) score += 10;
    else score += 0;
    if (expenseRatio <= 40) score += 20;
    else if (expenseRatio <= 50) score += 15;
    else if (expenseRatio <= 65) score += 10;
    else score += 3;
    if (age < 30 && savingsRate >= 20) score += 10;
    else if (age >= 30 && dti <= 35 && savingsRate >= 25) score += 10;
    else score += 5;
    score = Math.max(5, Math.min(100, Math.round(score)));
    let status = "Financially Robust";
    let color = "#10b981";
    if (score < 40) {
      status = "High Vulnerability";
      color = "#ef4444";
    } else if (score < 70) {
      status = "Moderate Stability";
      color = "#f59e0b";
    }
    return {
      score,
      status,
      color,
      dti: Math.round(dti),
      savingsRate: Math.round(savingsRate),
      surplus
    };
  }
  function calculateIndianTax({
    annualGrossSalary,
    deduction80C = 15e4,
    deduction80D = 25e3,
    hraDeduction = 0,
    homeLoanInterest = 0,
    // Section 24(b) max 2L
    nps80CCD = 0
    // max 50k
  }) {
    const gross = Math.max(0, annualGrossSalary);
    const newStdDeduction = 75e3;
    const newTaxableIncome = Math.max(0, gross - newStdDeduction);
    let newTax = 0;
    if (newTaxableIncome <= 3e5) {
      newTax = 0;
    } else if (newTaxableIncome <= 7e5) {
      newTax = (newTaxableIncome - 3e5) * 0.05;
    } else if (newTaxableIncome <= 1e6) {
      newTax = 4e5 * 0.05 + (newTaxableIncome - 7e5) * 0.1;
    } else if (newTaxableIncome <= 12e5) {
      newTax = 4e5 * 0.05 + 3e5 * 0.1 + (newTaxableIncome - 1e6) * 0.15;
    } else if (newTaxableIncome <= 15e5) {
      newTax = 4e5 * 0.05 + 3e5 * 0.1 + 2e5 * 0.15 + (newTaxableIncome - 12e5) * 0.2;
    } else {
      newTax = 4e5 * 0.05 + 3e5 * 0.1 + 2e5 * 0.15 + 3e5 * 0.2 + (newTaxableIncome - 15e5) * 0.3;
    }
    if (newTaxableIncome <= 7e5) {
      newTax = 0;
    }
    if (newTaxableIncome > 7e5 && newTaxableIncome <= 727770) {
      const excess = newTaxableIncome - 7e5;
      if (newTax > excess) newTax = excess;
    }
    const newCess = newTax * 0.04;
    const newTotalTax = Math.round(newTax + newCess);
    const oldStdDeduction = 5e4;
    const totalOldDeductions = oldStdDeduction + Math.min(15e4, deduction80C) + Math.min(5e4, deduction80D) + Math.max(0, hraDeduction) + Math.min(2e5, homeLoanInterest) + Math.min(5e4, nps80CCD);
    const oldTaxableIncome = Math.max(0, gross - totalOldDeductions);
    let oldTax = 0;
    if (oldTaxableIncome <= 25e4) {
      oldTax = 0;
    } else if (oldTaxableIncome <= 5e5) {
      oldTax = (oldTaxableIncome - 25e4) * 0.05;
    } else if (oldTaxableIncome <= 1e6) {
      oldTax = 25e4 * 0.05 + (oldTaxableIncome - 5e5) * 0.2;
    } else {
      oldTax = 25e4 * 0.05 + 5e5 * 0.2 + (oldTaxableIncome - 1e6) * 0.3;
    }
    if (oldTaxableIncome <= 5e5) {
      oldTax = 0;
    }
    const oldCess = oldTax * 0.04;
    const oldTotalTax = Math.round(oldTax + oldCess);
    const taxDiff = oldTotalTax - newTotalTax;
    const recommendedRegime = taxDiff >= 0 ? "NEW" : "OLD";
    const taxSavings = Math.abs(taxDiff);
    return {
      gross,
      newRegime: {
        stdDeduction: newStdDeduction,
        taxableIncome: newTaxableIncome,
        baseTax: Math.round(newTax),
        cess: Math.round(newCess),
        totalTax: newTotalTax,
        monthlyTax: Math.round(newTotalTax / 12),
        effectiveRate: gross > 0 ? (newTotalTax / gross * 100).toFixed(1) : 0
      },
      oldRegime: {
        stdDeduction: oldStdDeduction,
        totalDeductions: totalOldDeductions,
        taxableIncome: oldTaxableIncome,
        baseTax: Math.round(oldTax),
        cess: Math.round(oldCess),
        totalTax: oldTotalTax,
        monthlyTax: Math.round(oldTotalTax / 12),
        effectiveRate: gross > 0 ? (oldTotalTax / gross * 100).toFixed(1) : 0
      },
      recommendedRegime,
      taxSavings
    };
  }
  function calculateSIP({ monthlyAmount, annualCAGR = 12, years = 10 }) {
    const months = years * 12;
    const monthlyRate = annualCAGR / 12 / 100;
    const totalInvested = monthlyAmount * months;
    const futureValue = Math.round(
      monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
    );
    const totalGains = futureValue - totalInvested;
    return {
      totalInvested,
      futureValue,
      totalGains,
      years
    };
  }
  function compareLoanPrepaymentVsSIP({
    loanBalance,
    interestRate = 8.75,
    remainingTenureYears = 15,
    extraMonthlyCash = 1e4,
    expectedSIPReturn = 12
  }) {
    const r = interestRate / 12 / 100;
    const n = remainingTenureYears * 12;
    const originalEMI = Math.round(loanBalance * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
    let balance = loanBalance;
    let monthsToPayoffWithExtra = 0;
    let totalInterestWithExtra = 0;
    const totalMonthlyPayment = originalEMI + extraMonthlyCash;
    while (balance > 0 && monthsToPayoffWithExtra < 600) {
      const interest = balance * r;
      totalInterestWithExtra += interest;
      const principalPaid = totalMonthlyPayment - interest;
      balance -= principalPaid;
      monthsToPayoffWithExtra++;
      if (balance <= 0) break;
    }
    const normalTotalInterest = originalEMI * n - loanBalance;
    const interestSaved = Math.max(0, Math.round(normalTotalInterest - totalInterestWithExtra));
    const monthsSaved = Math.max(0, n - monthsToPayoffWithExtra);
    const sipOutcome = calculateSIP({
      monthlyAmount: extraMonthlyCash,
      annualCAGR: expectedSIPReturn,
      years: remainingTenureYears
    });
    return {
      originalEMI,
      normalTotalInterest: Math.round(normalTotalInterest),
      interestSaved,
      monthsSaved,
      yearsSaved: (monthsSaved / 12).toFixed(1),
      sipFutureValue: sipOutcome.futureValue,
      sipInvested: sipOutcome.totalInvested,
      sipGains: sipOutcome.totalGains,
      netAdvantage: sipOutcome.totalGains - interestSaved
    };
  }
  function getHealthBadge(score) {
    if (score >= 85) {
      return { title: "Level 5: Master Wealth Builder", emoji: "\u{1F3C6}", tag: "Fortified", color: "#10b981" };
    } else if (score >= 70) {
      return { title: "Level 4: Fortified Builder", emoji: "\u{1F6E1}\uFE0F", tag: "Resilient", color: "#10b981" };
    } else if (score >= 50) {
      return { title: "Level 3: Balanced Striver", emoji: "\u2696\uFE0F", tag: "Stable", color: "#f59e0b" };
    } else if (score >= 35) {
      return { title: "Level 2: Stretched Spender", emoji: "\u26A0\uFE0F", tag: "Caution", color: "#f59e0b" };
    } else {
      return { title: "Level 1: Debt Vulnerable", emoji: "\u{1F6A8}", tag: "Danger", color: "#ef4444" };
    }
  }
  var INFLATION_ITEMS = [
    { id: "custom50k", name: "\u20B950k Benchmark", emoji: "\u{1F3AF}", defaultPrice: 5e4, defaultRate: 6, category: "Standard", note: "Standard reference benchmark" },
    { id: "house", name: "House (2 BHK Flat)", emoji: "\u{1F3E0}", defaultPrice: 75e5, defaultRate: 7.5, category: "Real Estate", note: "Metro residential real estate" },
    { id: "car", name: "Car (Mid-size SUV)", emoji: "\u{1F697}", defaultPrice: 12e5, defaultRate: 6.5, category: "Automobile", note: "Automobile index & input metals" },
    { id: "smartphone", name: "Smartphone (Flagship)", emoji: "\u{1F4F1}", defaultPrice: 65e3, defaultRate: 4.5, category: "Electronics", note: "Annual tech price hikes" },
    { id: "milk", name: "Milk (Daily 1L / Year)", emoji: "\u{1F95B}", defaultPrice: 24e3, defaultRate: 6.8, category: "Dairy & Staples", note: "Dairy feed & packaging costs" },
    { id: "groceries", name: "Monthly Groceries", emoji: "\u{1F35A}", defaultPrice: 15e3, defaultRate: 6.5, category: "Food CPI", note: "Vegetables, grains & oil" },
    { id: "education", name: "Higher Education (MBA/Eng)", emoji: "\u{1F393}", defaultPrice: 2e6, defaultRate: 10.5, category: "Education", note: "Private college fee index" },
    { id: "healthcare", name: "Healthcare (Surgery/Cover)", emoji: "\u{1F3E5}", defaultPrice: 1e6, defaultRate: 12, category: "Medical", note: "Hospital & pharmaceutical inflation" },
    { id: "travel", name: "Family Vacation", emoji: "\u2708\uFE0F", defaultPrice: 2e5, defaultRate: 8, category: "Travel", note: "Airfares & hospitality" },
    { id: "gold", name: "Gold (10g 24K)", emoji: "\u{1F48D}", defaultPrice: 75e3, defaultRate: 9.5, category: "Precious Metals", note: "Historical bullion appreciation" },
    { id: "electronics", name: "Laptop / PC Workstation", emoji: "\u{1F4BB}", defaultPrice: 85e3, defaultRate: 5, category: "Tech Gadgets", note: "Semiconductors & imports" }
  ];
  function simulateInflation({
    currentPrice = 5e4,
    inflationRate = 6,
    targetYear = 2036,
    baseYear = 2026,
    itemName = "Item"
  }) {
    const price = Math.max(1, Number(currentPrice) || 5e4);
    const rate = Math.max(0.1, Number(inflationRate) || 6);
    const tYear = Math.max(baseYear + 1, Number(targetYear) || 2036);
    const years = tYear - baseYear;
    const r = rate / 100;
    const futureCost = Math.round(price * Math.pow(1 + r, years));
    const absoluteIncrease = futureCost - price;
    const percentageIncrease = (futureCost - price) / price * 100;
    const multiplier = +(futureCost / price).toFixed(2);
    const erodedPurchasingPower = Math.round(price / Math.pow(1 + r, years));
    const purchasingPowerLoss = price - erodedPurchasingPower;
    const erodedPct = Math.round(purchasingPowerLoss / price * 100);
    const milestoneYears = [
      { offset: 0, label: "Today" },
      { offset: 5, label: `${baseYear + 5}` },
      { offset: 10, label: `${baseYear + 10}` },
      { offset: 15, label: `${baseYear + 15}` },
      { offset: 20, label: `${baseYear + 20}` }
    ];
    const milestones = milestoneYears.map((m) => {
      const y = baseYear + m.offset;
      const costAtYear = Math.round(price * Math.pow(1 + r, m.offset));
      const isTarget = y === tYear;
      return {
        year: y,
        offset: m.offset,
        label: m.label,
        price: costAtYear,
        multiplier: +Math.pow(1 + r, m.offset).toFixed(2),
        diff: costAtYear - price,
        isTarget
      };
    });
    return {
      itemName,
      currentPrice: price,
      inflationRate: rate,
      baseYear,
      targetYear: tYear,
      years,
      futureCost,
      absoluteIncrease,
      percentageIncrease: percentageIncrease.toFixed(1),
      multiplier,
      erodedPurchasingPower,
      purchasingPowerLoss,
      erodedPct,
      milestones,
      // Emotional explanations
      questionPrompt: `What will ${formatINR(price)} cost in ${tYear}?`,
      headlineResult: `${formatINR(price)} today \u2248 ${formatINR(futureCost)} in ${tYear}`,
      extraMoneyStory: `To buy this exact same ${itemName.toLowerCase()} in ${tYear}, you will need an extra +${formatINR(absoluteIncrease)} (+${percentageIncrease.toFixed(1)}% price hike).`,
      lockerWarning: `If you stash ${formatINR(price)} cash in a locker until ${tYear}, its real buying power melts to just ${formatINR(erodedPurchasingPower)} today. Inflation steals ${formatINR(purchasingPowerLoss)} (${erodedPct}%) silently.`
    };
  }
  var INDIA_VS_ME_CATEGORIES = [
    { id: "housing", name: "Rent & Housing", emoji: "\u{1F3E0}", rate: 7.5, defaultWeight: 30, color: "#38bdf8" },
    { id: "food", name: "Groceries & Dining", emoji: "\u{1F35A}", rate: 6, defaultWeight: 30, color: "#10b981" },
    { id: "healthcare", name: "Healthcare & Insurance", emoji: "\u{1F3E5}", rate: 11, defaultWeight: 10, color: "#f43f5e" },
    { id: "education", name: "Education & Fees", emoji: "\u{1F393}", rate: 10, defaultWeight: 10, color: "#f59e0b" },
    { id: "lifestyle", name: "Travel & Lifestyle", emoji: "\u2708\uFE0F", rate: 6.25, defaultWeight: 20, color: "#a855f7" }
  ];
  var INDIA_VS_ME_PRESETS = [
    {
      id: "urban_pro",
      name: "Urban Professional",
      emoji: "\u{1F4BC}",
      description: "Rents metro 1/2 BHK, orders food online, active lifestyle & insurance",
      weights: { housing: 30, food: 30, healthcare: 10, education: 10, lifestyle: 20 }
    },
    {
      id: "family_kids",
      name: "Family with School Kids",
      emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}",
      description: "School fees, coaching, tuition, balanced healthcare & groceries",
      weights: { housing: 25, food: 25, healthcare: 15, education: 25, lifestyle: 10 }
    },
    {
      id: "frugal_minimalist",
      name: "Frugal Minimalist",
      emoji: "\u{1F9D8}",
      description: "Cooks at home, low rent, minimal discretionary expenses",
      weights: { housing: 25, food: 45, healthcare: 10, education: 5, lifestyle: 15 }
    },
    {
      id: "senior_health",
      name: "Senior / Medical Focus",
      emoji: "\u{1F9D3}",
      description: "High medical, diagnostic & prescription bills, owned house",
      weights: { housing: 20, food: 30, healthcare: 35, education: 0, lifestyle: 15 }
    }
  ];
  function calculateIndiaVsMeInflation({
    weights = { housing: 30, food: 30, healthcare: 10, education: 10, lifestyle: 20 },
    nationalCPI = 6.1,
    monthlySpend = 5e4
  } = {}) {
    let totalWeight = 0;
    let weightedRateSum = 0;
    const categoryBreakdown = INDIA_VS_ME_CATEGORIES.map((cat) => {
      const rawWeight = Math.max(0, Number(weights[cat.id] ?? cat.defaultWeight) || 0);
      totalWeight += rawWeight;
      weightedRateSum += rawWeight * cat.rate;
      return {
        ...cat,
        weight: rawWeight,
        rateContribution: rawWeight * cat.rate
      };
    });
    const safeTotalWeight = totalWeight > 0 ? totalWeight : 100;
    const userRate = +(weightedRateSum / safeTotalWeight).toFixed(1);
    const diff = +(userRate - nationalCPI).toFixed(1);
    const isHigher = diff > 0;
    const isLower = diff < 0;
    const annualSpend = monthlySpend * 12;
    const nationalAnnualErosion = Math.round(annualSpend * (nationalCPI / 100));
    const personalAnnualErosion = Math.round(annualSpend * (userRate / 100));
    const annualGapRupees = personalAnnualErosion - nationalAnnualErosion;
    return {
      nationalCPI,
      userRate,
      diff,
      diffFormatted: diff >= 0 ? `+${diff}` : `${diff}`,
      isHigher,
      isLower,
      annualGapRupees,
      categoryBreakdown,
      // Emotional narrative
      explanation: isHigher ? `Your spending pattern is experiencing higher inflation than the headline rate because of the categories you spend more heavily on.` : isLower ? `Your spending pattern is experiencing lower inflation than the national average due to your frugal category allocations.` : `Your personal inflation matches the national headline average of ${nationalCPI}%.`,
      deepDiveNote: `While India's official CPI basket (6.1%) is heavily weighted toward rural cereals and basic food staples (46% weight), your urban lifestyle spends more heavily on private healthcare (11.0%), education (10.0%), and metro housing (7.5%).`
    };
  }

  // js/profile.js
  var STORAGE_KEY = "artha_user_profile_v1";
  var PRESETS = {
    fresher: {
      name: "Fresh Graduate",
      salary: 35e3,
      age: 23,
      emi: 5500,
      loanOutstanding: 18e4,
      expenses: 14e3,
      emergencyFund: 2e4
    },
    techMid: {
      name: "Mid-Level Professional",
      salary: 12e4,
      age: 30,
      emi: 22e3,
      loanOutstanding: 75e4,
      expenses: 42e3,
      emergencyFund: 18e4
    },
    family: {
      name: "Established Family",
      salary: 25e4,
      age: 42,
      emi: 68e3,
      loanOutstanding: 38e5,
      expenses: 8e4,
      emergencyFund: 6e5
    },
    freelancer: {
      name: "Gig Freelancer",
      salary: 85e3,
      age: 27,
      emi: 0,
      loanOutstanding: 0,
      expenses: 3e4,
      emergencyFund: 15e4
    }
  };
  var ProfileManager = class {
    constructor() {
      this.profile = this.loadProfile();
      this.listeners = [];
    }
    loadProfile() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (e) {
        console.warn("Could not load profile from localStorage", e);
      }
      return { ...PRESETS.techMid };
    }
    saveProfile() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      } catch (e) {
        console.warn("Could not save profile to localStorage", e);
      }
      this.notify();
    }
    update(fields) {
      this.profile = {
        ...this.profile,
        ...fields
      };
      this.saveProfile();
    }
    applyPreset(presetKey) {
      if (PRESETS[presetKey]) {
        this.profile = { ...PRESETS[presetKey] };
        this.saveProfile();
      }
    }
    subscribe(listener) {
      this.listeners.push(listener);
      listener(this.getVitals());
    }
    notify() {
      const vitals = this.getVitals();
      this.listeners.forEach((fn) => fn(vitals));
    }
    getVitals() {
      const { salary, emi, expenses, age, emergencyFund, loanOutstanding } = this.profile;
      const totalOutflow = emi + expenses;
      const surplus = Math.max(0, salary - totalOutflow);
      const dti = calculateDTI(emi, salary);
      const health = calculateHealthScore({ salary, emi, expenses, age });
      const recommendedEmergencyFund = totalOutflow * 6;
      const emergencyMonthsCovered = totalOutflow > 0 ? (emergencyFund / totalOutflow).toFixed(1) : 0;
      return {
        profile: { ...this.profile },
        salary,
        age,
        emi,
        loanOutstanding,
        expenses,
        emergencyFund,
        totalOutflow,
        surplus,
        dti,
        health,
        recommendedEmergencyFund,
        emergencyMonthsCovered
      };
    }
  };
  var profileManager = new ProfileManager();

  // js/facts.js
  var VERIFIED_FACTS = [
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
      shortSnippet: "Official SEBI research shows 93% of individual retail traders in Equity Futures & Options lost money between FY22-FY24, with average losses of \u20B91.25 Lakhs per trader.",
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
      shortSnippet: "Paying only the 'Minimum Amount Due' on credit cards charges compound interest of 3.5% to 4% per month (42-48% per annum). A \u20B950,000 balance can take 9+ years to clear.",
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
      fullDetails: "A hospital procedure costing \u20B93 Lakhs today will cost over \u20B99.3 Lakhs in 10 years at 12% medical inflation. Money kept in traditional savings accounts (2.7-3.5%) or post-tax fixed deposits guaranteed loses purchasing power.",
      actionableTip: "Hold comprehensive health insurance of at least \u20B910-15 Lakhs + Super Top-up, and invest long-term education goals in equity mutual funds."
    },
    {
      id: "new-tax-regime-sweet-spot",
      source: "Union Budget & CBDT Notification",
      sourceTag: "Tax Advisory",
      category: "Income Tax",
      icon: "receipt-tax",
      urgency: "success",
      title: "Zero Tax on Salaried Income up to \u20B97.75 Lakhs",
      shortSnippet: "Under the New Tax Regime, salaried individuals pay \u20B90 income tax on annual gross salary up to \u20B97.75 Lakhs (Standard Deduction of \u20B975,000 + Section 87A rebate).",
      fullDetails: "The revised tax slabs with a \u20B975,000 standard deduction make the New Tax Regime substantially more beneficial for people without huge home loan interest or HRA deductions exceeding \u20B93.5 Lakhs.",
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
      fullDetails: "On a \u20B915,000 monthly SIP over 25 years at 12% gross returns, a Direct plan yields approximately \u20B92.85 Crores, while a Regular plan yields \u20B92.25 Crores\u2014a loss of \u20B960 Lakhs solely in hidden commissions.",
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
      fullDetails: "A pure Term Insurance policy provides \u20B91 Crore to \u20B92 Crore cover for a 30-year-old at just \u20B9900-\u20B91,400/month. The remaining surplus invested in diversified index funds generates 2x-3x higher wealth than bundled insurance-investment products.",
      actionableTip: "Buy a pure Term Life Insurance policy equal to 15-20x your annual in-hand salary, and invest your wealth separately."
    }
  ];

  // js/purchase.js
  function evaluatePurchase({
    itemName = "Item",
    cost = 5e4,
    paymentMode = "lump",
    // 'lump' | 'no-cost-emi' | 'emi'
    emiMonths = 6,
    emiInterestRate = 14,
    userProfile = { salary: 1e5, emi: 2e4, expenses: 35e3, age: 28 }
  }) {
    const { salary, emi: currentEMI, expenses, age } = userProfile;
    const currentSurplus = Math.max(0, salary - currentEMI - expenses);
    const currentDTI = salary > 0 ? currentEMI / salary * 100 : 0;
    let monthlyPurchaseEMI = 0;
    let totalCostToUser = cost;
    if (paymentMode === "lump") {
      monthlyPurchaseEMI = 0;
      totalCostToUser = cost;
    } else if (paymentMode === "no-cost-emi") {
      monthlyPurchaseEMI = Math.round(cost / emiMonths);
      const processingFee = Math.min(500, Math.round(cost * 0.01));
      totalCostToUser = cost + processingFee;
    } else {
      const r = emiInterestRate / 12 / 100;
      const n = emiMonths;
      monthlyPurchaseEMI = Math.round(cost * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
      totalCostToUser = monthlyPurchaseEMI * n;
    }
    const newMonthlyEMI = currentEMI + monthlyPurchaseEMI;
    const newDTI = salary > 0 ? newMonthlyEMI / salary * 100 : 0;
    const newMonthlySurplus = paymentMode === "lump" ? currentSurplus : Math.max(0, salary - newMonthlyEMI - expenses);
    const hourlyIncome = salary > 0 ? salary / 187 : 0;
    const dailyIncome = salary > 0 ? salary / 22 : 0;
    const hoursOfLife = hourlyIncome > 0 ? Math.round(cost / hourlyIncome) : 0;
    const daysOfLife = dailyIncome > 0 ? (cost / dailyIncome).toFixed(1) : 0;
    const n5yr = Math.round(cost * Math.pow(1.12, 5));
    const n10yr = Math.round(cost * Math.pow(1.12, 10));
    const n20yr = Math.round(cost * Math.pow(1.12, 20));
    let verdictCode = "GREEN";
    let verdictTitle = "Confidently Affordable";
    let verdictColor = "#10b981";
    let reasons = [];
    let recommendation = "";
    const costToMonthlyIncomeRatio = salary > 0 ? cost / salary : 1;
    const emiToSurplusRatio = currentSurplus > 0 ? monthlyPurchaseEMI / currentSurplus : 1;
    if (salary <= 0) {
      verdictCode = "RED";
      verdictTitle = "Input Salary First";
      verdictColor = "#ef4444";
      reasons.push("Set your monthly take-home salary to evaluate affordability.");
    } else if (newDTI > 48 || paymentMode !== "lump" && emiToSurplusRatio > 0.6) {
      verdictCode = "RED";
      verdictTitle = "Financial Red Flag \u2014 High Risk";
      verdictColor = "#ef4444";
      reasons.push(`Total EMI burden would spike to ${newDTI.toFixed(0)}% of your income (RBI danger threshold is >45%).`);
      reasons.push(`The monthly payment consumes ${(emiToSurplusRatio * 100).toFixed(0)}% of your discretionary surplus.`);
      recommendation = "Postpone this purchase. Building a 6-month emergency buffer and clearing existing debt takes strict priority.";
    } else if (costToMonthlyIncomeRatio > 1.5 && paymentMode === "lump") {
      verdictCode = "RED";
      verdictTitle = "Severely Depletes Cash Reserves";
      verdictColor = "#ef4444";
      reasons.push(`This single purchase costs ${costToMonthlyIncomeRatio.toFixed(1)}x your entire monthly salary.`);
      recommendation = "Avoid draining emergency liquidity for a lifestyle purchase. Create a targeted sinking fund and buy when ready.";
    } else if (newDTI > 35 || emiToSurplusRatio > 0.35 || costToMonthlyIncomeRatio > 0.6) {
      verdictCode = "AMBER";
      verdictTitle = "Financial Stretch \u2014 Caution Advised";
      verdictColor = "#f59e0b";
      if (newDTI > 35) reasons.push(`Increases your debt-to-income ratio to ${newDTI.toFixed(0)}%, bordering the RBI caution band.`);
      if (emiToSurplusRatio > 0.35) reasons.push(`Takes up ${(emiToSurplusRatio * 100).toFixed(0)}% of your monthly free cashflow.`);
      if (costToMonthlyIncomeRatio > 0.6) reasons.push(`Item price is ${(costToMonthlyIncomeRatio * 100).toFixed(0)}% of your monthly salary.`);
      recommendation = "Apply the 30-Day Cooling-off Rule. If you still desire this after 30 days and have 3+ months emergency reserves, proceed.";
    } else {
      verdictCode = "GREEN";
      verdictTitle = "Green Light \u2014 Safe to Buy";
      verdictColor = "#10b981";
      reasons.push(`Easily fits within your ${formatINR(currentSurplus)} monthly surplus.`);
      reasons.push(`Your debt ratio remains healthy at ${newDTI.toFixed(0)}% (well below RBI's 35% safe ceiling).`);
      recommendation = "You can comfortably afford this without derailing your long-term goals. Enjoy the purchase guilt-free!";
    }
    let coolingDays = 0;
    if (cost >= 1e5) coolingDays = 30;
    else if (cost >= 25e3) coolingDays = 14;
    else if (cost >= 5e3) coolingDays = 7;
    return {
      itemName,
      cost,
      paymentMode,
      emiMonths,
      monthlyPurchaseEMI,
      totalCostToUser,
      extraCostDueToInterest: totalCostToUser - cost,
      currentSurplus,
      newMonthlySurplus,
      currentDTI: Math.round(currentDTI),
      newDTI: Math.round(newDTI),
      hoursOfLife,
      daysOfLife,
      lifeEnergyStory: `To own this, you trade ${daysOfLife} working days (~${hoursOfLife} hours) of your life. That's about ${(daysOfLife / 5).toFixed(1)} full work-weeks dedicated entirely to this single purchase.`,
      beforeAfter: {
        before: {
          surplus: currentSurplus,
          dti: Math.round(currentDTI),
          emi: currentEMI,
          freeCashPct: salary > 0 ? Math.round(currentSurplus / salary * 100) : 0
        },
        after: {
          surplus: newMonthlySurplus,
          dti: Math.round(newDTI),
          emi: newMonthlyEMI,
          freeCashPct: salary > 0 ? Math.round(newMonthlySurplus / salary * 100) : 0,
          surplusDiff: currentSurplus - newMonthlySurplus,
          dtiDiff: Math.round(newDTI - currentDTI)
        }
      },
      opportunityCost: {
        in5Years: n5yr,
        in10Years: n10yr,
        in20Years: n20yr
      },
      verdict: {
        code: verdictCode,
        title: verdictTitle,
        color: verdictColor,
        reasons,
        recommendation,
        coolingDays
      }
    };
  }

  // js/charts.js
  function isLightMode() {
    return document.documentElement.getAttribute("data-theme") === "light";
  }
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  }
  function drawDonutChart(canvas, segments, centerText = {}) {
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);
    const isLight = isLightMode();
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    const innerRadius = radius * 0.65;
    const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
    if (total === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isLight ? "#e2e8f0" : "#1e293b";
      ctx.lineWidth = radius - innerRadius;
      ctx.stroke();
      return;
    }
    let currentAngle = -Math.PI / 2;
    segments.forEach((segment) => {
      if (segment.value <= 0) return;
      const sliceAngle = segment.value / total * (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius + innerRadius) / 2, currentAngle, currentAngle + sliceAngle);
      ctx.strokeStyle = segment.color;
      ctx.lineWidth = radius - innerRadius - 2;
      ctx.lineCap = "butt";
      ctx.stroke();
      currentAngle += sliceAngle;
    });
    if (centerText.title || centerText.subtitle) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (centerText.title) {
        ctx.font = '700 20px "Outfit", sans-serif';
        ctx.fillStyle = isLight ? "#0f172a" : "#f8fafc";
        ctx.fillText(centerText.title, centerX, centerY - 8);
      }
      if (centerText.subtitle) {
        ctx.font = '500 12px "Inter", sans-serif';
        ctx.fillStyle = isLight ? "#64748b" : "#94a3b8";
        ctx.fillText(centerText.subtitle, centerX, centerY + 16);
      }
    }
  }
  function drawComparisonBarChart(canvas, items) {
    if (!canvas || !items || items.length === 0) return;
    const { ctx, width, height } = setupCanvas(canvas);
    const isLight = isLightMode();
    const padding = { top: 35, right: 25, bottom: 45, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...items.map((i) => i.value), 1e3);
    const barWidth = Math.min(70, chartWidth / items.length * 0.55);
    const groupSpacing = chartWidth / items.length;
    ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartHeight / 4 * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    items.forEach((item, index) => {
      const x = padding.left + groupSpacing * index + (groupSpacing - barWidth) / 2;
      const barHeight = Math.max(4, item.value / maxValue * chartHeight);
      const y = padding.top + chartHeight - barHeight;
      const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
      grad.addColorStop(0, item.color || "#06b6d4");
      grad.addColorStop(1, (item.color || "#06b6d4") + "88");
      ctx.fillStyle = grad;
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
      ctx.lineTo(x + barWidth, y + barHeight);
      ctx.lineTo(x, y + barHeight);
      ctx.closePath();
      ctx.fill();
      ctx.textAlign = "center";
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillStyle = isLight ? "#0f172a" : "#e2e8f0";
      ctx.fillText(item.formattedValue || `\u20B9${Math.round(item.value)}`, x + barWidth / 2, y - 8);
      ctx.font = '500 12px "Inter", sans-serif';
      ctx.fillStyle = isLight ? "#475569" : "#94a3b8";
      ctx.fillText(item.label, x + barWidth / 2, padding.top + chartHeight + 20);
    });
  }
  function drawInflationCurve(canvas, progression, targetYear) {
    if (!canvas || !progression || progression.length === 0) return;
    const { ctx, width, height } = setupCanvas(canvas);
    const isLight = isLightMode();
    const padding = { top: 32, right: 35, bottom: 42, left: 65 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const getVal = (p) => Number(p.price || p.expense || 0);
    const maxExpense = Math.max(...progression.map(getVal));
    const minExpense = Math.min(...progression.map(getVal));
    const valRange = Math.max(1, maxExpense - minExpense * 0.8);
    ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartHeight / 4 * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      const v = maxExpense - valRange / 4 * i;
      ctx.textAlign = "right";
      ctx.font = '500 10px "Inter", sans-serif';
      ctx.fillStyle = isLight ? "#64748b" : "#94a3b8";
      const formattedV = v >= 1e7 ? `\u20B9${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `\u20B9${(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `\u20B9${(v / 1e3).toFixed(0)}k` : `\u20B9${Math.round(v)}`;
      ctx.fillText(formattedV, padding.left - 8, y + 3);
    }
    ctx.beginPath();
    progression.forEach((pt, i) => {
      const val = getVal(pt);
      const x = padding.left + i / Math.max(1, progression.length - 1) * chartWidth;
      const y = padding.top + chartHeight - (val - minExpense * 0.8) / valRange * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    const lastX = padding.left + chartWidth;
    ctx.lineTo(lastX, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    areaGrad.addColorStop(0, isLight ? "rgba(239, 68, 68, 0.22)" : "rgba(239, 68, 68, 0.32)");
    areaGrad.addColorStop(1, "rgba(239, 68, 68, 0.01)");
    ctx.fillStyle = areaGrad;
    ctx.fill();
    ctx.beginPath();
    progression.forEach((pt, i) => {
      const val = getVal(pt);
      const x = padding.left + i / Math.max(1, progression.length - 1) * chartWidth;
      const y = padding.top + chartHeight - (val - minExpense * 0.8) / valRange * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.stroke();
    progression.forEach((pt, i) => {
      const val = getVal(pt);
      const x = padding.left + i / Math.max(1, progression.length - 1) * chartWidth;
      const y = padding.top + chartHeight - (val - minExpense * 0.8) / valRange * chartHeight;
      const isTarget = pt.isTarget || targetYear && pt.year === targetYear;
      if (isTarget) {
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? "rgba(239, 68, 68, 0.25)" : "rgba(244, 63, 94, 0.4)";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, isTarget ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isTarget ? "#e11d48" : "#ef4444";
      ctx.fill();
      ctx.strokeStyle = isLight ? "#ffffff" : "#0f172a";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = isTarget ? '700 11px "Inter", sans-serif' : '500 10px "Inter", sans-serif';
      ctx.fillStyle = isTarget ? isLight ? "#0f172a" : "#ffffff" : isLight ? "#475569" : "#94a3b8";
      const label = pt.label || (pt.year >= 2e3 ? `${pt.year}` : `Yr ${pt.year}`);
      ctx.fillText(label, x, padding.top + chartHeight + 18);
    });
  }

  // js/app.js
  function setRingProgress(elemId, percentage, color) {
    const ring = document.getElementById(elemId);
    if (!ring) return;
    const circumference = 283;
    const clamped = Math.min(100, Math.max(0, percentage));
    const offset = circumference * (1 - clamped / 100);
    ring.style.strokeDashoffset = offset;
    if (color) ring.style.stroke = color;
  }
  var ArthaApp = class {
    constructor() {
      this.currentTab = "purchase";
      this.currentFactIndex = 0;
      this.factTickerInterval = null;
      this.init();
    }
    init() {
      try {
        this.bindThemeToggle();
      } catch (e) {
        console.error("Theme toggle error:", e);
      }
      try {
        this.bindSteppers();
      } catch (e) {
        console.error("Steppers error:", e);
      }
      try {
        this.bindProfileControls();
      } catch (e) {
        console.error("Profile controls error:", e);
      }
      try {
        this.bindTabs();
      } catch (e) {
        console.error("Tabs error:", e);
      }
      try {
        this.bindTickerAndHoverFacts();
      } catch (e) {
        console.error("Ticker/Facts error:", e);
      }
      try {
        this.bindPurchaseTool();
      } catch (e) {
        console.error("Purchase tool error:", e);
      }
      try {
        this.bindBudgetTool();
      } catch (e) {
        console.error("Budget tool error:", e);
      }
      try {
        this.bindInflationTool();
      } catch (e) {
        console.error("Inflation tool error:", e);
      }
      try {
        this.bindIndiaVsMeTool();
      } catch (e) {
        console.error("India vs Me tool error:", e);
      }
      try {
        this.bindTaxTool();
      } catch (e) {
        console.error("Tax tool error:", e);
      }
      try {
        this.bindLoanVsSipTool();
      } catch (e) {
        console.error("Loan tool error:", e);
      }
      try {
        this.bindRetirementTool();
      } catch (e) {
        console.error("Retirement tool error:", e);
      }
      try {
        this.bindExportReport();
      } catch (e) {
        console.error("Export report error:", e);
      }
      try {
        profileManager.subscribe((vitals) => {
          this.renderHUD(vitals);
          this.refreshCurrentTool(vitals);
        });
      } catch (e) {
        console.error("Profile subscribe error:", e);
      }
      window.addEventListener("resize", () => {
        try {
          this.refreshCurrentTool(profileManager.getVitals());
        } catch (e) {
          console.warn("Resize refresh error:", e);
        }
      });
    }
    /* -------------------------------------------------------------
       0. THEME TOGGLE (DARK / LIGHT MODE)
       ------------------------------------------------------------- */
    bindThemeToggle() {
      const themeBtn = document.getElementById("themeToggleBtn");
      const themeText = document.getElementById("themeToggleText");
      const updateThemeUI = (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        if (themeText) {
          themeText.textContent = theme === "dark" ? "Dark Mode" : "Light Mode";
        }
        try {
          this.refreshCurrentTool(profileManager.getVitals());
        } catch (e) {
          console.warn("Chart refresh error on theme change", e);
        }
      };
      const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
      if (themeText) {
        themeText.textContent = currentTheme === "dark" ? "Dark Mode" : "Light Mode";
      }
      if (themeBtn) {
        themeBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const activeTheme = document.documentElement.getAttribute("data-theme") || "dark";
          const nextTheme = activeTheme === "dark" ? "light" : "dark";
          localStorage.setItem("artha_theme", nextTheme);
          updateThemeUI(nextTheme);
        });
      }
      if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
          if (!localStorage.getItem("artha_theme")) {
            const sysTheme = e.matches ? "light" : "dark";
            updateThemeUI(sysTheme);
          }
        });
      }
    }
    /* -------------------------------------------------------------
       0.1 QUICK STEPPER BUTTONS (+/-)
       ------------------------------------------------------------- */
    bindSteppers() {
      document.querySelectorAll(".step-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const targetId = e.currentTarget.getAttribute("data-step-target");
          const delta = parseInt(e.currentTarget.getAttribute("data-step-val"), 10);
          const input = document.getElementById(targetId);
          if (input) {
            const currentVal = parseInt(input.value, 10) || 0;
            input.value = Math.max(0, currentVal + delta);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      });
    }
    /* -------------------------------------------------------------
       1. PROFILE CONTROLS & HUD
       ------------------------------------------------------------- */
    bindProfileControls() {
      const salaryInput = document.getElementById("inputSalary");
      const ageInput = document.getElementById("inputAge");
      const emiInput = document.getElementById("inputEMI");
      const expensesInput = document.getElementById("inputExpenses");
      const emergencyInput = document.getElementById("inputEmergency");
      const presetButtons = document.querySelectorAll("[data-preset]");
      const p = profileManager.profile;
      if (salaryInput) salaryInput.value = p.salary;
      if (ageInput) ageInput.value = p.age;
      if (emiInput) emiInput.value = p.emi;
      if (expensesInput) expensesInput.value = p.expenses;
      if (emergencyInput) emergencyInput.value = p.emergencyFund || 0;
      const handleProfileChange = () => {
        presetButtons.forEach((b) => b.classList.remove("active"));
        profileManager.update({
          salary: parseINR(salaryInput ? salaryInput.value : 0),
          age: parseInt(ageInput ? ageInput.value : 25, 10) || 25,
          emi: parseINR(emiInput ? emiInput.value : 0),
          expenses: parseINR(expensesInput ? expensesInput.value : 0),
          emergencyFund: parseINR(emergencyInput ? emergencyInput.value : 0)
        });
      };
      [salaryInput, ageInput, emiInput, expensesInput, emergencyInput].forEach((elem) => {
        if (elem) {
          elem.addEventListener("input", handleProfileChange);
          elem.addEventListener("change", handleProfileChange);
          elem.addEventListener("keyup", handleProfileChange);
        }
      });
      presetButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const key = e.currentTarget.getAttribute("data-preset");
          profileManager.applyPreset(key);
          const updated = profileManager.profile;
          if (salaryInput) salaryInput.value = updated.salary;
          if (ageInput) ageInput.value = updated.age;
          if (emiInput) emiInput.value = updated.emi;
          if (expensesInput) expensesInput.value = updated.expenses;
          if (emergencyInput) emergencyInput.value = updated.emergencyFund;
          presetButtons.forEach((b) => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
        });
      });
    }
    renderHUD(vitals) {
      const hudSalary = document.getElementById("hudSalary");
      const hudSurplus = document.getElementById("hudSurplus");
      const hudDTI = document.getElementById("hudDTI");
      const hudDTIBadge = document.getElementById("hudDTIBadge");
      const hudHealthScore = document.getElementById("hudHealthScore");
      const hudHealthBadge = document.getElementById("hudHealthBadge");
      const hudEmergencyRunway = document.getElementById("hudEmergencyRunway");
      const hudRunwayBadge = document.getElementById("hudRunwayBadge");
      const storyTitle = document.getElementById("storyGreetingTitle");
      const storyBody = document.getElementById("storyGreetingBody");
      if (storyTitle) {
        storyTitle.textContent = `You have ${formatINR(vitals.surplus)} of pure freedom cash every month.`;
      }
      if (storyBody) {
        storyBody.innerHTML = `From your <strong>${formatINR(vitals.salary)}</strong> take-home salary, <strong>${formatINR(vitals.emi)}</strong> pays past EMIs and <strong>${formatINR(vitals.expenses)}</strong> covers survival needs.`;
      }
      if (hudSalary) hudSalary.textContent = formatINR(vitals.salary);
      if (hudSurplus) hudSurplus.textContent = formatINR(vitals.surplus);
      if (hudDTI) hudDTI.textContent = `${vitals.dti}%`;
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      const emeraldColor = isLight ? "#059669" : "#10b981";
      const amberColor = isLight ? "#b45309" : "#f59e0b";
      const roseColor = isLight ? "#dc2626" : "#ef4444";
      const dtiColor = vitals.dti <= 35 ? emeraldColor : vitals.dti <= 45 ? amberColor : roseColor;
      setRingProgress("ringDtiProgress", Math.min(100, vitals.dti * 1.5), dtiColor);
      if (hudDTIBadge) {
        if (vitals.dti <= 35) {
          hudDTIBadge.className = "ring-badge-pill fortified";
          hudDTIBadge.textContent = "\u{1F6E1}\uFE0F Safe (<35%)";
        } else if (vitals.dti <= 45) {
          hudDTIBadge.className = "ring-badge-pill warning";
          hudDTIBadge.textContent = "\u26A0\uFE0F Caution (35-45%)";
        } else {
          hudDTIBadge.className = "ring-badge-pill danger";
          hudDTIBadge.textContent = "\u{1F6A8} Critical (>45%)";
        }
      }
      const healthColor = vitals.health.score >= 70 ? emeraldColor : vitals.health.score >= 45 ? amberColor : roseColor;
      if (hudHealthScore) {
        hudHealthScore.textContent = vitals.health.score;
        hudHealthScore.style.color = healthColor;
      }
      setRingProgress("ringHealthProgress", vitals.health.score, healthColor);
      const levelBadge = getHealthBadge(vitals.health.score);
      if (hudHealthBadge) {
        hudHealthBadge.textContent = `${levelBadge.emoji} ${levelBadge.title.split(": ")[1] || levelBadge.title}`;
        hudHealthBadge.className = `ring-badge-pill ${levelBadge.tag.toLowerCase()}`;
      }
      if (hudEmergencyRunway) {
        hudEmergencyRunway.textContent = vitals.emergencyMonthsCovered;
      }
      const runwayPct = Math.min(100, Math.round(vitals.emergencyMonthsCovered / 6 * 100));
      const runwayColor = runwayPct >= 80 ? emeraldColor : runwayPct >= 40 ? amberColor : roseColor;
      setRingProgress("ringRunwayProgress", runwayPct, runwayColor);
      if (hudRunwayBadge) {
        hudRunwayBadge.textContent = `\u{1F50B} ${vitals.emergencyMonthsCovered} / 6.0 Months`;
        hudRunwayBadge.className = `ring-badge-pill ${runwayPct >= 80 ? "fortified" : runwayPct >= 40 ? "warning" : "danger"}`;
      }
    }
    /* -------------------------------------------------------------
       2. NAVIGATION & TABS
       ------------------------------------------------------------- */
    bindTabs() {
      const tabButtons = document.querySelectorAll("[data-tab-target]");
      tabButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const target = e.currentTarget.getAttribute("data-tab-target");
          this.currentTab = target;
          tabButtons.forEach((b) => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
          document.querySelectorAll(".tool-pane").forEach((pane) => {
            pane.classList.remove("active");
          });
          const activePane = document.getElementById(`pane-${target}`);
          if (activePane) activePane.classList.add("active");
          this.refreshCurrentTool(profileManager.getVitals());
        });
      });
    }
    refreshCurrentTool(vitals) {
      switch (this.currentTab) {
        case "purchase":
          this.runPurchaseEvaluation(vitals);
          break;
        case "budget":
          this.renderBudgetTool(vitals);
          break;
        case "inflation":
          this.renderInflationTool(vitals);
          break;
        case "tax":
          this.renderTaxTool(vitals);
          break;
        case "loan-vs-sip":
          this.renderLoanVsSipTool(vitals);
          break;
        case "retirement":
          this.renderRetirementTool(vitals);
          break;
      }
    }
    /* -------------------------------------------------------------
       3. VERIFIED FACTS & AWARENESS TICKER / HOVER CARDS
       ------------------------------------------------------------- */
    bindTickerAndHoverFacts() {
      const tickerTrack = document.getElementById("tickerTrack");
      const hoverCard = document.getElementById("floatingHoverCard");
      const factModal = document.getElementById("factModal");
      const modalClose = document.getElementById("modalClose");
      if (tickerTrack) {
        const itemsHtml = VERIFIED_FACTS.map((fact, idx) => `
        <div class="ticker-item" data-fact-index="${idx}">
          <span class="badge-source ${fact.urgency}">${fact.sourceTag}</span>
          <span class="ticker-text">${fact.shortSnippet}</span>
        </div>
      `).join("");
        tickerTrack.innerHTML = itemsHtml + itemsHtml;
        tickerTrack.querySelectorAll(".ticker-item").forEach((el) => {
          el.addEventListener("click", (e) => {
            const idx = e.currentTarget.getAttribute("data-fact-index");
            this.openFactModal(VERIFIED_FACTS[idx]);
          });
        });
      }
      const updateHoverCard = () => {
        if (!hoverCard) return;
        const fact = VERIFIED_FACTS[this.currentFactIndex];
        hoverCard.querySelector(".floating-tag").textContent = fact.sourceTag;
        hoverCard.querySelector(".floating-tag").className = `floating-tag ${fact.urgency}`;
        hoverCard.querySelector(".floating-title").textContent = fact.title;
        hoverCard.querySelector(".floating-desc").textContent = fact.shortSnippet;
        hoverCard.setAttribute("data-fact-index", this.currentFactIndex);
        this.currentFactIndex = (this.currentFactIndex + 1) % VERIFIED_FACTS.length;
      };
      updateHoverCard();
      this.factTickerInterval = setInterval(updateHoverCard, 7e3);
      if (hoverCard) {
        hoverCard.addEventListener("click", (e) => {
          e.preventDefault();
          const idx = parseInt(hoverCard.getAttribute("data-fact-index"), 10) || 0;
          this.openFactModal(VERIFIED_FACTS[idx] || VERIFIED_FACTS[0]);
        });
      }
      if (modalClose) {
        modalClose.addEventListener("click", (e) => {
          e.preventDefault();
          if (factModal) factModal.classList.remove("open");
        });
      }
      if (factModal) {
        factModal.addEventListener("click", (e) => {
          if (e.target === factModal) factModal.classList.remove("open");
        });
      }
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && factModal && factModal.classList.contains("open")) {
          factModal.classList.remove("open");
        }
      });
      const browseFactsBtn = document.getElementById("btnBrowseFacts");
      if (browseFactsBtn) {
        browseFactsBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.openFactModal(VERIFIED_FACTS[0]);
        });
      }
    }
    openFactModal(fact) {
      const modal = document.getElementById("factModal");
      if (!modal) return;
      document.getElementById("modalSource").textContent = fact.source;
      document.getElementById("modalTitle").textContent = fact.title;
      document.getElementById("modalSnippet").textContent = fact.shortSnippet;
      document.getElementById("modalDetails").textContent = fact.fullDetails;
      document.getElementById("modalActionTip").textContent = fact.actionableTip;
      const otherFactsContainer = document.getElementById("modalFactsGrid");
      if (otherFactsContainer) {
        otherFactsContainer.innerHTML = VERIFIED_FACTS.map((f, i) => `
        <div class="modal-fact-chip ${f.id === fact.id ? "active" : ""}" data-fact-idx="${i}">
          <span class="source-tag">${f.sourceTag}</span>
          <span class="chip-title">${f.title}</span>
        </div>
      `).join("");
        otherFactsContainer.querySelectorAll(".modal-fact-chip").forEach((chip) => {
          chip.addEventListener("click", (e) => {
            const idx = e.currentTarget.getAttribute("data-fact-idx");
            this.openFactModal(VERIFIED_FACTS[idx]);
          });
        });
      }
      modal.classList.add("open");
    }
    /* -------------------------------------------------------------
       4. TOOL 1: "CAN I AFFORD THIS?"
       ------------------------------------------------------------- */
    bindPurchaseTool() {
      const itemNameInput = document.getElementById("purchaseItemName");
      const itemCostInput = document.getElementById("purchaseCost");
      const paymentRadios = document.querySelectorAll('input[name="paymentMode"]');
      const emiDetailsBox = document.getElementById("emiDetailsConfig");
      const emiMonthsSelect = document.getElementById("purchaseEmiMonths");
      const emiRateInput = document.getElementById("purchaseEmiRate");
      document.querySelectorAll(".preset-purchase-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const name = e.currentTarget.getAttribute("data-name");
          const cost = e.currentTarget.getAttribute("data-cost");
          if (itemNameInput) itemNameInput.value = name;
          if (itemCostInput) itemCostInput.value = cost;
          this.runPurchaseEvaluation(profileManager.getVitals());
        });
      });
      const triggerEvaluation = () => {
        this.runPurchaseEvaluation(profileManager.getVitals());
      };
      [itemNameInput, itemCostInput, emiMonthsSelect, emiRateInput].forEach((elem) => {
        if (elem) elem.addEventListener("input", triggerEvaluation);
      });
      paymentRadios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
          const mode = e.target.value;
          if (emiDetailsBox) {
            emiDetailsBox.style.display = mode === "lump" ? "none" : "grid";
          }
          triggerEvaluation();
        });
      });
    }
    runPurchaseEvaluation(vitals) {
      const itemName = document.getElementById("purchaseItemName")?.value || "Item";
      const cost = parseINR(document.getElementById("purchaseCost")?.value) || 0;
      const paymentMode = document.querySelector('input[name="paymentMode"]:checked')?.value || "lump";
      const emiMonths = parseInt(document.getElementById("purchaseEmiMonths")?.value, 10) || 6;
      const emiInterestRate = parseFloat(document.getElementById("purchaseEmiRate")?.value) || 14;
      const evaluation = evaluatePurchase({
        itemName,
        cost,
        paymentMode,
        emiMonths,
        emiInterestRate,
        userProfile: vitals.profile
      });
      const verdictBanner = document.getElementById("verdictBanner");
      const verdictTitle = document.getElementById("verdictTitle");
      const verdictSubtitle = document.getElementById("verdictSubtitle");
      const verdictReasons = document.getElementById("verdictReasons");
      const verdictTip = document.getElementById("verdictTip");
      if (verdictBanner) {
        verdictBanner.className = `verdict-banner ${evaluation.verdict.code.toLowerCase()}`;
      }
      if (verdictTitle) {
        verdictTitle.textContent = evaluation.verdict.title;
        const isLight = document.documentElement.getAttribute("data-theme") === "light";
        const verdictColor = evaluation.verdict.code === "GREEN" ? isLight ? "#059669" : "#10b981" : evaluation.verdict.code === "AMBER" ? isLight ? "#b45309" : "#f59e0b" : isLight ? "#dc2626" : "#ef4444";
        verdictTitle.style.color = verdictColor;
      }
      if (verdictSubtitle) {
        verdictSubtitle.textContent = evaluation.verdict.recommendation;
      }
      if (verdictReasons) {
        verdictReasons.innerHTML = evaluation.verdict.reasons.map((r) => `<li>${r}</li>`).join("");
      }
      if (verdictTip && evaluation.verdict.coolingDays > 0) {
        verdictTip.innerHTML = `<strong>Dopamine Check:</strong> We recommend a <strong>${evaluation.verdict.coolingDays}-day cooling-off rule</strong> before pulling the trigger.`;
        verdictTip.style.display = "block";
      } else if (verdictTip) {
        verdictTip.style.display = "none";
      }
      const { before, after } = evaluation.beforeAfter;
      const beforeSurplusEl = document.getElementById("duelBeforeSurplus");
      const beforeEmiEl = document.getElementById("duelBeforeEmi");
      const beforeDtiEl = document.getElementById("duelBeforeDti");
      const afterSurplusEl = document.getElementById("duelAfterSurplus");
      const surplusDiffEl = document.getElementById("duelSurplusDiffText");
      const afterEmiEl = document.getElementById("duelAfterEmi");
      const afterDtiEl = document.getElementById("duelAfterDti");
      if (beforeSurplusEl) beforeSurplusEl.textContent = formatINR(before.surplus);
      if (beforeEmiEl) beforeEmiEl.textContent = formatINR(before.emi);
      if (beforeDtiEl) beforeDtiEl.textContent = `${before.dti}% (${before.dti <= 35 ? "Safe" : "Caution"})`;
      if (afterSurplusEl) afterSurplusEl.textContent = formatINR(after.surplus);
      if (surplusDiffEl) surplusDiffEl.textContent = `-${formatINR(after.surplusDiff)}/month impact`;
      if (afterEmiEl) afterEmiEl.textContent = formatINR(after.emi);
      if (afterDtiEl) afterDtiEl.textContent = `${after.dti}% (${after.dti <= 35 ? "Safe" : after.dti <= 45 ? "Caution" : "Critical"})`;
      const lifeDaysElem = document.getElementById("metricLifeDays");
      const lifeStoryElem = document.getElementById("lifeEnergyStory");
      const pipsGrid = document.getElementById("workdaysPipsGrid");
      if (lifeDaysElem) lifeDaysElem.textContent = `${evaluation.daysOfLife} Working Days`;
      if (lifeStoryElem) lifeStoryElem.textContent = evaluation.lifeEnergyStory;
      if (pipsGrid) {
        const committedDays = Math.min(60, Math.round(parseFloat(evaluation.daysOfLife) || 0));
        let pipsHtml = "";
        const totalDisplayPips = Math.max(22, committedDays);
        for (let i = 0; i < totalDisplayPips; i++) {
          const isCommitted = i < committedDays;
          pipsHtml += `<div class="workday-pip ${isCommitted ? "committed" : ""}" title="${isCommitted ? "Committed Workday " + (i + 1) : "Free Workday"}"></div>`;
        }
        pipsGrid.innerHTML = pipsHtml;
      }
      const scrubber = document.getElementById("oppCostScrubber");
      const scrubberVal = document.getElementById("oppScrubberVal");
      const scrubberExplanation = document.getElementById("oppScrubberExplanation");
      if (scrubber && scrubberVal && scrubberExplanation) {
        const updateScrubber = () => {
          const yrs = parseInt(scrubber.value, 10) || 10;
          const fv = Math.round(cost * Math.pow(1.12, yrs));
          scrubberVal.textContent = formatINR(fv, true);
          scrubberExplanation.innerHTML = `In <strong>${yrs} years</strong> at historical 12% Nifty 50 CAGR, this <strong>${formatINR(cost)}</strong> purchase amount compounds into <strong>${formatINR(fv)}</strong>.`;
        };
        scrubber.oninput = updateScrubber;
        updateScrubber();
      }
    }
    /* -------------------------------------------------------------
       5. TOOL 2: 50-30-20 & BHARAT BUDGET HEALTH
       ------------------------------------------------------------- */
    bindBudgetTool() {
    }
    renderBudgetTool(vitals) {
      const { salary, emi, expenses, surplus } = vitals;
      const canvas = document.getElementById("budgetDonutCanvas");
      const needs = expenses;
      const debtServicing = emi;
      const wants = Math.round(surplus * 0.4);
      const investments = Math.round(surplus * 0.6);
      const needsPct = salary > 0 ? Math.round(needs / salary * 100) : 0;
      const debtPct = salary > 0 ? Math.round(debtServicing / salary * 100) : 0;
      const wantsPct = salary > 0 ? Math.round(wants / salary * 100) : 0;
      const investPct = salary > 0 ? Math.round(investments / salary * 100) : 0;
      const bNeedsVal = document.getElementById("bucketNeedsVal");
      const bNeedsBar = document.getElementById("bucketNeedsBar");
      const bDebtVal = document.getElementById("bucketDebtVal");
      const bDebtBar = document.getElementById("bucketDebtBar");
      const bWantsVal = document.getElementById("bucketWantsVal");
      const bWantsBar = document.getElementById("bucketWantsBar");
      const bInvestVal = document.getElementById("bucketInvestVal");
      const bInvestBar = document.getElementById("bucketInvestBar");
      if (bNeedsVal) bNeedsVal.textContent = `${formatINR(needs)} (${needsPct}%)`;
      if (bNeedsBar) bNeedsBar.style.width = `${Math.min(100, needsPct)}%`;
      if (bDebtVal) bDebtVal.textContent = `${formatINR(debtServicing)} (${debtPct}%)`;
      if (bDebtBar) bDebtBar.style.width = `${Math.min(100, debtPct)}%`;
      if (bWantsVal) bWantsVal.textContent = `${formatINR(wants)} (${wantsPct}%)`;
      if (bWantsBar) bWantsBar.style.width = `${Math.min(100, wantsPct)}%`;
      if (bInvestVal) bInvestVal.textContent = `${formatINR(investments)} (${investPct}%)`;
      if (bInvestBar) bInvestBar.style.width = `${Math.min(100, investPct)}%`;
      const segments = [
        { label: "Survival Needs", value: needs, color: "#38bdf8" },
        { label: "Debt / EMIs", value: debtServicing, color: "#ef4444" },
        { label: "Joy & Lifestyle", value: wants, color: "#f59e0b" },
        { label: "Future Freedom", value: investments, color: "#10b981" }
      ];
      drawDonutChart(canvas, segments, {
        title: formatINR(salary),
        subtitle: "Monthly In-Hand"
      });
      const diagnosis = document.getElementById("budgetDiagnosisText");
      if (diagnosis) {
        if (debtPct > 40) {
          diagnosis.innerHTML = `<div class="notion-callout-icon">\u26A0\uFE0F</div><div class="notion-callout-content"><div class="notion-callout-title">Heavy Debt Load (${debtPct}% of income)</div><div class="notion-callout-body">RBI alerts indicate that when EMIs exceed 35-40%, families face severe stress during emergencies. Prepay high-cost personal loans before expanding lifestyle spending.</div></div>`;
        } else if (investPct < 20) {
          diagnosis.innerHTML = `<div class="notion-callout-icon">\u26A1</div><div class="notion-callout-content"><div class="notion-callout-title">Low Savings Velocity (${investPct}% to freedom)</div><div class="notion-callout-body">In India, healthcare inflates at 12% and education at 10%. Boosting your equity SIP to at least 25% creates a durable shield for your future.</div></div>`;
        } else {
          diagnosis.innerHTML = `<div class="notion-callout-icon">\u2728</div><div class="notion-callout-content"><div class="notion-callout-title">Exceptional Financial Fitness!</div><div class="notion-callout-body">You dedicate <strong>${investPct}%</strong> directly to future freedom while containing debt at a safe <strong>${debtPct}%</strong>. Your wealth engine is humming smoothly.</div></div>`;
        }
      }
    }
    /* -------------------------------------------------------------
       6. TOOL 4: SIGNATURE INFLATION SIMULATOR
       ------------------------------------------------------------- */
    bindInflationTool() {
      const itemNameInput = document.getElementById("simItemName");
      const priceInput = document.getElementById("simCurrentPrice");
      const yearSlider = document.getElementById("simYearSlider");
      const rateSlider = document.getElementById("simRateSlider");
      const update = () => this.renderInflationTool(profileManager.getVitals());
      [itemNameInput, priceInput, yearSlider, rateSlider].forEach((el) => {
        if (el) {
          el.addEventListener("input", update);
          el.addEventListener("change", update);
        }
      });
      document.querySelectorAll("[data-sim-step]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const step = parseInt(e.currentTarget.getAttribute("data-sim-step"), 10) || 0;
          const currentVal = parseINR(priceInput?.value) || 5e4;
          const nextVal = Math.max(100, currentVal + step);
          if (priceInput) priceInput.value = nextVal;
          update();
        });
      });
      document.querySelectorAll("[data-sim-year]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const yr = parseInt(e.currentTarget.getAttribute("data-sim-year"), 10);
          if (yearSlider && yr) yearSlider.value = yr;
          document.querySelectorAll("[data-sim-year]").forEach((b) => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
          update();
        });
      });
      document.querySelectorAll("[data-sim-rate]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const r = parseFloat(e.currentTarget.getAttribute("data-sim-rate"));
          if (rateSlider && r) rateSlider.value = r;
          document.querySelectorAll("[data-sim-rate]").forEach((b) => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
          update();
        });
      });
      document.querySelectorAll(".spending-chip").forEach((chip) => {
        chip.addEventListener("click", (e) => {
          const itemId = e.currentTarget.getAttribute("data-item-id");
          const item = INFLATION_ITEMS.find((it) => it.id === itemId);
          if (!item) return;
          document.querySelectorAll(".spending-chip").forEach((c) => c.classList.remove("active"));
          e.currentTarget.classList.add("active");
          if (itemNameInput) itemNameInput.value = item.name;
          if (priceInput) priceInput.value = item.defaultPrice;
          if (rateSlider) rateSlider.value = item.defaultRate;
          document.querySelectorAll("[data-sim-rate]").forEach((b) => {
            const btnRate = parseFloat(b.getAttribute("data-sim-rate"));
            b.classList.toggle("active", Math.abs(btnRate - item.defaultRate) < 0.05);
          });
          update();
        });
      });
    }
    renderInflationTool(vitals) {
      const itemName = document.getElementById("simItemName")?.value?.trim() || "\u20B950k Benchmark Basket";
      const currentPrice = parseINR(document.getElementById("simCurrentPrice")?.value) || 5e4;
      const targetYear = parseInt(document.getElementById("simYearSlider")?.value, 10) || 2036;
      const inflationRate = parseFloat(document.getElementById("simRateSlider")?.value) || 6;
      const baseYear = 2026;
      const lblYear = document.getElementById("lblSimYear");
      if (lblYear) lblYear.textContent = `${targetYear} (in ${targetYear - baseYear} yrs)`;
      const lblRate = document.getElementById("lblSimRate");
      if (lblRate) lblRate.textContent = `${inflationRate.toFixed(1)}%`;
      const heroRateTag = document.getElementById("simHeroRateTag");
      if (heroRateTag) heroRateTag.textContent = `${inflationRate.toFixed(1)}% p.a.`;
      document.querySelectorAll("[data-sim-year]").forEach((btn) => {
        const yr = parseInt(btn.getAttribute("data-sim-year"), 10);
        btn.classList.toggle("active", yr === targetYear);
      });
      const sim = simulateInflation({
        currentPrice,
        inflationRate,
        targetYear,
        baseYear,
        itemName
      });
      const heroQuestionEl = document.getElementById("simHeroQuestion");
      const heroResultEl = document.getElementById("simHeroResult");
      const heroStoryEl = document.getElementById("simHeroStory");
      const lockerWarningEl = document.getElementById("simLockerWarning");
      if (heroQuestionEl) heroQuestionEl.textContent = sim.questionPrompt;
      if (heroResultEl) heroResultEl.textContent = sim.headlineResult;
      if (heroStoryEl) heroStoryEl.textContent = sim.extraMoneyStory;
      if (lockerWarningEl) lockerWarningEl.textContent = sim.lockerWarning;
      const milestoneGrid = document.getElementById("simMilestoneGrid");
      if (milestoneGrid && sim.milestones) {
        milestoneGrid.innerHTML = sim.milestones.map((m) => {
          const isTarget = m.year === targetYear;
          const diffText = m.diff > 0 ? `+${formatINR(m.diff)}` : "Baseline";
          return `
          <div class="milestone-card ${isTarget ? "is-target" : ""}">
            ${isTarget ? '<span class="milestone-target-flag">Target Year</span>' : ""}
            <span class="milestone-year-badge">${m.label}</span>
            <div class="milestone-price">${formatINR(m.price)}</div>
            <span class="milestone-multiplier">${m.multiplier}x \xB7 ${diffText}</span>
          </div>
        `;
        }).join("");
      }
      const canvas = document.getElementById("inflationCanvas");
      if (canvas) {
        drawInflationCurve(canvas, sim.milestones, targetYear);
      }
      this.renderIndiaVsMeTool();
    }
    /* -------------------------------------------------------------
       6B. INDIA VS ME: PERSONAL LIFESTYLE INFLATION DUEL
       ------------------------------------------------------------- */
    bindIndiaVsMeTool() {
      this.duelWeights = { housing: 30, food: 30, healthcare: 10, education: 10, lifestyle: 20 };
      this.duelActivePreset = "urban_pro";
      document.querySelectorAll("[data-duel-preset]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const presetId = e.currentTarget.getAttribute("data-duel-preset");
          const preset = INDIA_VS_ME_PRESETS.find((p) => p.id === presetId);
          if (!preset) return;
          this.duelActivePreset = presetId;
          this.duelWeights = { ...preset.weights };
          document.querySelectorAll("[data-duel-preset]").forEach((b) => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
          this.renderIndiaVsMeTool();
        });
      });
      this.renderIndiaVsMeTool();
    }
    renderIndiaVsMeTool() {
      const vitals = profileManager.getVitals();
      const monthlySpend = vitals.expenses || 5e4;
      const result = calculateIndiaVsMeInflation({
        weights: this.duelWeights || { housing: 30, food: 30, healthcare: 10, education: 10, lifestyle: 20 },
        nationalCPI: 6.1,
        monthlySpend
      });
      const indiaRateEl = document.getElementById("duelIndiaRate");
      const userRateEl = document.getElementById("duelUserRate");
      const diffBadgeEl = document.getElementById("duelDiffBadge");
      const diffValEl = document.getElementById("duelDiffVal");
      const diffSubEl = document.getElementById("duelDiffSub");
      const explTitleEl = document.getElementById("duelExplanationTitle");
      const explBodyEl = document.getElementById("duelExplanationBody");
      if (indiaRateEl) indiaRateEl.textContent = `${result.nationalCPI.toFixed(1)}%`;
      if (userRateEl) userRateEl.textContent = `${result.userRate.toFixed(1)}%`;
      if (diffValEl) {
        diffValEl.textContent = `${result.diffFormatted} percentage points`;
      }
      if (diffBadgeEl) {
        diffBadgeEl.classList.toggle("frugal", result.isLower);
      }
      if (diffSubEl) {
        if (result.annualGapRupees > 0) {
          diffSubEl.innerHTML = `You pay <strong id="duelDiffRupees">+${formatINR(result.annualGapRupees)}/yr</strong> in stealth inflation`;
        } else if (result.annualGapRupees < 0) {
          diffSubEl.innerHTML = `You save <strong id="duelDiffRupees" style="color: var(--emerald-400);">${formatINR(Math.abs(result.annualGapRupees))}/yr</strong> vs national CPI`;
        } else {
          diffSubEl.innerHTML = `Your expenses match national headline inflation exactly`;
        }
      }
      if (explTitleEl) explTitleEl.textContent = result.explanation;
      if (explBodyEl) explBodyEl.textContent = result.deepDiveNote;
      const gridEl = document.getElementById("duelWeightsGrid");
      if (gridEl && !gridEl.dataset.initialized) {
        gridEl.dataset.initialized = "true";
        gridEl.innerHTML = INDIA_VS_ME_CATEGORIES.map((cat) => {
          const currentWeight = this.duelWeights && this.duelWeights[cat.id] !== void 0 ? this.duelWeights[cat.id] : cat.defaultWeight;
          return `
          <div class="duel-weight-card" data-cat-id="${cat.id}">
            <div class="duel-weight-meta">
              <span class="duel-weight-title">${cat.emoji} ${cat.name}</span>
              <span class="duel-weight-rate-tag">${cat.rate}% p.a.</span>
            </div>
            <div class="duel-weight-slider-row">
              <input type="range" class="custom-slider duel-slider" min="0" max="60" step="5" value="${currentWeight}" data-cat-slider="${cat.id}">
              <span class="duel-weight-pct" id="duelPct_${cat.id}">${currentWeight}%</span>
            </div>
          </div>
        `;
        }).join("");
        gridEl.querySelectorAll("[data-cat-slider]").forEach((slider) => {
          slider.addEventListener("input", (e) => {
            const catId = e.currentTarget.getAttribute("data-cat-slider");
            const val = parseInt(e.currentTarget.value, 10) || 0;
            if (!this.duelWeights) this.duelWeights = {};
            this.duelWeights[catId] = val;
            const pctLabel = document.getElementById(`duelPct_${catId}`);
            if (pctLabel) pctLabel.textContent = `${val}%`;
            document.querySelectorAll("[data-duel-preset]").forEach((b) => b.classList.remove("active"));
            this.renderIndiaVsMeTool();
          });
        });
      } else if (gridEl) {
        INDIA_VS_ME_CATEGORIES.forEach((cat) => {
          const slider = gridEl.querySelector(`[data-cat-slider="${cat.id}"]`);
          const pctLabel = document.getElementById(`duelPct_${cat.id}`);
          const currentWeight = this.duelWeights && this.duelWeights[cat.id] !== void 0 ? this.duelWeights[cat.id] : cat.defaultWeight;
          if (slider) slider.value = currentWeight;
          if (pctLabel) pctLabel.textContent = `${currentWeight}%`;
        });
      }
    }
    /* -------------------------------------------------------------
       7. TOOL 4: INDIAN TAX COMPARATOR (NEW VS OLD FY 24-25/25-26)
       ------------------------------------------------------------- */
    bindTaxTool() {
      const grossInput = document.getElementById("taxGrossSalary");
      const ded80C = document.getElementById("tax80C");
      const ded80D = document.getElementById("tax80D");
      const dedHRA = document.getElementById("taxHRA");
      const dedHomeLoan = document.getElementById("taxHomeLoan");
      const dedNPS = document.getElementById("taxNPS");
      const trigger = () => this.renderTaxTool(profileManager.getVitals());
      [grossInput, ded80C, ded80D, dedHRA, dedHomeLoan, dedNPS].forEach((el) => {
        if (el) el.addEventListener("input", trigger);
      });
      const syncBtn = document.getElementById("btnSyncTaxSalary");
      if (syncBtn) {
        syncBtn.addEventListener("click", () => {
          const v = profileManager.getVitals();
          const grossEst = Math.round(v.salary * 12 * 1.15);
          if (grossInput) grossInput.value = grossEst;
          trigger();
        });
      }
    }
    renderTaxTool(vitals) {
      const grossInput = document.getElementById("taxGrossSalary");
      if (grossInput && !grossInput.value) {
        grossInput.value = Math.round(vitals.salary * 12 * 1.15);
      }
      const annualGrossSalary = parseINR(document.getElementById("taxGrossSalary")?.value) || 12e5;
      const deduction80C = parseINR(document.getElementById("tax80C")?.value) || 15e4;
      const deduction80D = parseINR(document.getElementById("tax80D")?.value) || 25e3;
      const hraDeduction = parseINR(document.getElementById("taxHRA")?.value) || 0;
      const homeLoanInterest = parseINR(document.getElementById("taxHomeLoan")?.value) || 0;
      const nps80CCD = parseINR(document.getElementById("taxNPS")?.value) || 0;
      const result = calculateIndianTax({
        annualGrossSalary,
        deduction80C,
        deduction80D,
        hraDeduction,
        homeLoanInterest,
        nps80CCD
      });
      document.getElementById("newRegimeTax").textContent = formatINR(result.newRegime.totalTax);
      document.getElementById("newRegimeMonthly").textContent = `${formatINR(result.newRegime.monthlyTax)}/mo`;
      document.getElementById("newRegimeRate").textContent = `${result.newRegime.effectiveRate}%`;
      document.getElementById("oldRegimeTax").textContent = formatINR(result.oldRegime.totalTax);
      document.getElementById("oldRegimeMonthly").textContent = `${formatINR(result.oldRegime.monthlyTax)}/mo`;
      document.getElementById("oldRegimeRate").textContent = `${result.oldRegime.effectiveRate}%`;
      const recBanner = document.getElementById("taxRecommendationBanner");
      if (recBanner) {
        if (result.recommendedRegime === "NEW") {
          recBanner.className = "tax-rec-banner new-wins";
          recBanner.innerHTML = `\u{1F3C6} <strong>New Tax Regime Wins!</strong> You save <strong>${formatINR(result.taxSavings)}</strong> in tax per year with zero hassle of collecting investment bills.`;
        } else {
          recBanner.className = "tax-rec-banner old-wins";
          recBanner.innerHTML = `\u{1F3C6} <strong>Old Tax Regime Wins!</strong> Your deductions (80C, HRA, Home Loan) save you <strong>${formatINR(result.taxSavings)}</strong> more than the New Regime.`;
        }
      }
      const canvas = document.getElementById("taxChartCanvas");
      drawComparisonBarChart(canvas, [
        { label: "New Regime Tax", value: result.newRegime.totalTax, formattedValue: formatINR(result.newRegime.totalTax), color: "#10b981" },
        { label: "Old Regime Tax", value: result.oldRegime.totalTax, formattedValue: formatINR(result.oldRegime.totalTax), color: "#38bdf8" }
      ]);
    }
    /* -------------------------------------------------------------
       8. TOOL 5: LOAN PREPAYMENT VS EQUITY SIP
       ------------------------------------------------------------- */
    bindLoanVsSipTool() {
      const loanBal = document.getElementById("loanBalance");
      const loanRate = document.getElementById("loanRate");
      const loanTenure = document.getElementById("loanTenure");
      const extraCash = document.getElementById("loanExtraCash");
      const sipRate = document.getElementById("loanSipRate");
      const update = () => this.renderLoanVsSipTool(profileManager.getVitals());
      [loanBal, loanRate, loanTenure, extraCash, sipRate].forEach((el) => {
        if (el) el.addEventListener("input", update);
      });
    }
    renderLoanVsSipTool(vitals) {
      const loanBalance = parseINR(document.getElementById("loanBalance")?.value) || vitals.loanOutstanding || 25e5;
      const interestRate = parseFloat(document.getElementById("loanRate")?.value) || 8.75;
      const remainingTenureYears = parseInt(document.getElementById("loanTenure")?.value, 10) || 15;
      const extraMonthlyCash = parseINR(document.getElementById("loanExtraCash")?.value) || 1e4;
      const expectedSIPReturn = parseFloat(document.getElementById("loanSipRate")?.value) || 12;
      const result = compareLoanPrepaymentVsSIP({
        loanBalance,
        interestRate,
        remainingTenureYears,
        extraMonthlyCash,
        expectedSIPReturn
      });
      document.getElementById("loanSavedInterest").textContent = formatINR(result.interestSaved, true);
      document.getElementById("loanYearsSaved").textContent = `${result.yearsSaved} Years sooner`;
      document.getElementById("sipWealthAccumulated").textContent = formatINR(result.sipFutureValue, true);
      document.getElementById("sipNetProfit").textContent = `+${formatINR(result.sipGains, true)} in pure wealth`;
      const verdict = document.getElementById("loanVsSipVerdict");
      if (verdict) {
        if (result.netAdvantage > 0) {
          verdict.innerHTML = `<div class="notion-callout-icon">\u{1F680}</div><div class="notion-callout-content"><div class="notion-callout-title">The Wealth-Creator Path Wins</div><div class="notion-callout-body">Investing the extra <strong>${formatINR(extraMonthlyCash)}/mo</strong> in a Nifty 50 Index SIP beats prepaying your ${interestRate}% loan by <strong>${formatINR(result.netAdvantage)}</strong> over ${remainingTenureYears} years.<br><span class="text-subtle">Tip: If emotional peace of mind without debt is your #1 priority, prepaying guarantees a risk-free ${interestRate}% return.</span></div></div>`;
        } else {
          verdict.innerHTML = `<div class="notion-callout-icon">\u{1F6E1}\uFE0F</div><div class="notion-callout-content"><div class="notion-callout-title">The Debt Prepayment Path Wins</div><div class="notion-callout-body">Prepaying your loan saves <strong>${formatINR(result.interestSaved)}</strong> in guaranteed interest and clears your liability ${result.yearsSaved} years earlier!</div></div>`;
        }
      }
      const canvas = document.getElementById("loanVsSipCanvas");
      drawComparisonBarChart(canvas, [
        { label: "Interest Saved", value: result.interestSaved, formattedValue: formatINR(result.interestSaved), color: "#38bdf8" },
        { label: "SIP Corpus", value: result.sipFutureValue, formattedValue: formatINR(result.sipFutureValue), color: "#10b981" }
      ]);
    }
    /* -------------------------------------------------------------
       9. TOOL 6: AGE-BASED GOALS & RETIREMENT (FIRE)
       ------------------------------------------------------------- */
    bindRetirementTool() {
      const retAge = document.getElementById("retTargetAge");
      const retExpense = document.getElementById("retDesiredMonthly");
      const update = () => this.renderRetirementTool(profileManager.getVitals());
      if (retAge) retAge.addEventListener("input", update);
      if (retExpense) retExpense.addEventListener("input", update);
    }
    renderRetirementTool(vitals) {
      const age = vitals.age;
      const targetRetirementAge = parseInt(document.getElementById("retTargetAge")?.value, 10) || 58;
      const desiredMonthlyInRetirement = parseINR(document.getElementById("retDesiredMonthly")?.value) || vitals.expenses || 5e4;
      const yearsToRetire = Math.max(1, targetRetirementAge - age);
      document.getElementById("retYearsLeft").textContent = `${yearsToRetire} Years`;
      const spentPct = Math.min(100, Math.round(age / 85 * 100));
      const retirePct = Math.min(100, Math.round(targetRetirementAge / 85 * 100));
      const earningWidth = Math.max(0, retirePct - spentPct);
      const lifeSpentEl = document.getElementById("lifeBarSpent");
      const lifeEarningEl = document.getElementById("lifeBarEarning");
      const lifeCurrentEl = document.getElementById("lifeChronCurrent");
      const lifeRetireEl = document.getElementById("lifeChronRetire");
      const lifeStoryEl = document.getElementById("lifeTimelineStory");
      if (lifeSpentEl) lifeSpentEl.style.width = `${spentPct}%`;
      if (lifeEarningEl) {
        lifeEarningEl.style.left = `${spentPct}%`;
        lifeEarningEl.style.width = `${earningWidth}%`;
      }
      if (lifeCurrentEl) lifeCurrentEl.textContent = `Current: Age ${age}`;
      if (lifeRetireEl) lifeRetireEl.textContent = `Freedom: Age ${targetRetirementAge}`;
      if (lifeStoryEl) {
        lifeStoryEl.innerHTML = `You have <strong>${yearsToRetire} earning years</strong> remaining to build your independence corpus before stepping away from active work.`;
      }
      const equityAllocation = Math.max(20, Math.min(80, 100 - age));
      const debtAllocation = 100 - equityAllocation;
      document.getElementById("retEquityPct").textContent = `${equityAllocation}%`;
      document.getElementById("retDebtPct").textContent = `${debtAllocation}%`;
      document.getElementById("retEquityBar").style.width = `${equityAllocation}%`;
      document.getElementById("retDebtBar").style.width = `${debtAllocation}%`;
      const recommendedTermCover = vitals.salary * 12 * 20;
      document.getElementById("recTermCover").textContent = formatINR(recommendedTermCover, true);
      const recommendedHealthCover = age < 35 ? "\u20B910 Lakhs + Super Top-up" : "\u20B925 Lakhs + Super Top-up";
      document.getElementById("recHealthCover").textContent = recommendedHealthCover;
      const inflatedMonthly = desiredMonthlyInRetirement * Math.pow(1.055, yearsToRetire);
      const requiredCorpus = Math.round(inflatedMonthly * 12 * 25);
      document.getElementById("retTargetCorpus").textContent = formatINR(requiredCorpus, true);
      const r = 0.12 / 12;
      const n = yearsToRetire * 12;
      const monthlySIPNeeded = Math.round(requiredCorpus / ((Math.pow(1 + r, n) - 1) / r * (1 + r)));
      document.getElementById("retMonthlySipNeeded").textContent = `${formatINR(monthlySIPNeeded)}/month`;
    }
    /* -------------------------------------------------------------
       10. EXPORT / PRINT REPORT
       ------------------------------------------------------------- */
    bindExportReport() {
      const exportBtn = document.getElementById("btnExportReport");
      if (exportBtn) {
        exportBtn.addEventListener("click", () => {
          window.print();
        });
      }
    }
  };
  function initArtha() {
    if (window.__arthaInitialized) return;
    window.__arthaInitialized = true;
    try {
      window.arthaApp = new ArthaApp();
      console.log("Artha initialized successfully");
    } catch (err) {
      console.error("Error initializing Artha:", err);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArtha);
  } else {
    initArtha();
  }
})();
