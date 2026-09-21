/**
 * Financial Calculation Core for Artha
 * Implements Indian taxation (FY 24-25 / 25-26), Inflation modeling,
 * DTI, SIP compounding, and Affordability metrics.
 */

export function formatINR(val, compact = false) {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  const num = Math.round(Number(val));
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  if (compact) {
    if (absNum >= 10000000) {
      return `${isNegative ? "-" : ""}₹${(absNum / 10000000).toFixed(2)} Cr`;
    }
    if (absNum >= 100000) {
      return `${isNegative ? "-" : ""}₹${(absNum / 100000).toFixed(2)} L`;
    }
    if (absNum >= 1000) {
      return `${isNegative ? "-" : ""}₹${(absNum / 1000).toFixed(1)} K`;
    }
  }

  // Standard Indian formatting (e.g., ₹12,34,567)
  const formatted = absNum.toLocaleString("en-IN");
  return `${isNegative ? "-" : ""}₹${formatted}`;
}

export function parseINR(str) {
  if (typeof str === "number") return str;
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9.-]+/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Calculates Debt-To-Income (DTI) ratio
 */
export function calculateDTI(monthlyEMI, inHandSalary) {
  if (!inHandSalary || inHandSalary <= 0) return 0;
  return Math.min(100, Math.round((monthlyEMI / inHandSalary) * 100));
}

/**
 * Evaluates Indian Financial Health Score (0 to 100)
 */
export function calculateHealthScore({ salary, emi, expenses, age }) {
  if (!salary || salary <= 0) return { score: 0, status: "Insufficient Data", color: "#64748b" };

  const surplus = salary - emi - expenses;
  const dti = (emi / salary) * 100;
  const savingsRate = (surplus / salary) * 100;
  const expenseRatio = (expenses / salary) * 100;

  let score = 0;

  // 1. Debt-to-Income Score (Max 35 pts)
  if (dti <= 20) score += 35;
  else if (dti <= 35) score += 28;
  else if (dti <= 45) score += 15;
  else if (dti <= 55) score += 5;
  else score += 0;

  // 2. Savings Rate Score (Max 35 pts)
  if (savingsRate >= 35) score += 35;
  else if (savingsRate >= 25) score += 28;
  else if (savingsRate >= 15) score += 20;
  else if (savingsRate >= 5) score += 10;
  else score += 0;

  // 3. Fixed Needs Ratio (Max 20 pts)
  if (expenseRatio <= 40) score += 20;
  else if (expenseRatio <= 50) score += 15;
  else if (expenseRatio <= 65) score += 10;
  else score += 3;

  // 4. Age Resilience adjustment (Max 10 pts)
  if (age < 30 && savingsRate >= 20) score += 10;
  else if (age >= 30 && dti <= 35 && savingsRate >= 25) score += 10;
  else score += 5;

  score = Math.max(5, Math.min(100, Math.round(score)));

  let status = "Financially Robust";
  let color = "#10b981"; // emerald

  if (score < 40) {
    status = "High Vulnerability";
    color = "#ef4444"; // red
  } else if (score < 70) {
    status = "Moderate Stability";
    color = "#f59e0b"; // amber
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

/**
 * Indian Income Tax Calculator (FY 2024-25 / 2025-26)
 * Compares New Regime vs Old Regime
 */
export function calculateIndianTax({
  annualGrossSalary,
  deduction80C = 150000,
  deduction80D = 25000,
  hraDeduction = 0,
  homeLoanInterest = 0, // Section 24(b) max 2L
  nps80CCD = 0 // max 50k
}) {
  const gross = Math.max(0, annualGrossSalary);

  // --- NEW TAX REGIME (FY 24-25 / 25-26 Budget Slabs) ---
  const newStdDeduction = 75000;
  const newTaxableIncome = Math.max(0, gross - newStdDeduction);

  let newTax = 0;
  if (newTaxableIncome <= 300000) {
    newTax = 0;
  } else if (newTaxableIncome <= 700000) {
    newTax = (newTaxableIncome - 300000) * 0.05;
  } else if (newTaxableIncome <= 1000000) {
    newTax = 400000 * 0.05 + (newTaxableIncome - 700000) * 0.10;
  } else if (newTaxableIncome <= 1200000) {
    newTax = 400000 * 0.05 + 300000 * 0.10 + (newTaxableIncome - 1000000) * 0.15;
  } else if (newTaxableIncome <= 1500000) {
    newTax = 400000 * 0.05 + 300000 * 0.10 + 200000 * 0.15 + (newTaxableIncome - 1200000) * 0.20;
  } else {
    newTax = 400000 * 0.05 + 300000 * 0.10 + 200000 * 0.15 + 300000 * 0.20 + (newTaxableIncome - 1500000) * 0.30;
  }

  // Section 87A rebate under New Regime: Taxable income up to ₹7,00,000 is 100% rebated
  if (newTaxableIncome <= 700000) {
    newTax = 0;
  }
  // Marginal relief if slightly above 7L
  if (newTaxableIncome > 700000 && newTaxableIncome <= 727770) {
    const excess = newTaxableIncome - 700000;
    if (newTax > excess) newTax = excess;
  }

  const newCess = newTax * 0.04;
  const newTotalTax = Math.round(newTax + newCess);

  // --- OLD TAX REGIME ---
  const oldStdDeduction = 50000;
  const totalOldDeductions = oldStdDeduction +
    Math.min(150000, deduction80C) +
    Math.min(50000, deduction80D) +
    Math.max(0, hraDeduction) +
    Math.min(200000, homeLoanInterest) +
    Math.min(50000, nps80CCD);

  const oldTaxableIncome = Math.max(0, gross - totalOldDeductions);

  let oldTax = 0;
  if (oldTaxableIncome <= 250000) {
    oldTax = 0;
  } else if (oldTaxableIncome <= 500000) {
    oldTax = (oldTaxableIncome - 250000) * 0.05;
  } else if (oldTaxableIncome <= 1000000) {
    oldTax = 250000 * 0.05 + (oldTaxableIncome - 500000) * 0.20;
  } else {
    oldTax = 250000 * 0.05 + 500000 * 0.20 + (oldTaxableIncome - 1000000) * 0.30;
  }

  // Section 87A rebate under Old Regime: Taxable income up to ₹5,00,000 is rebated
  if (oldTaxableIncome <= 500000) {
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
      effectiveRate: gross > 0 ? ((newTotalTax / gross) * 100).toFixed(1) : 0
    },
    oldRegime: {
      stdDeduction: oldStdDeduction,
      totalDeductions: totalOldDeductions,
      taxableIncome: oldTaxableIncome,
      baseTax: Math.round(oldTax),
      cess: Math.round(oldCess),
      totalTax: oldTotalTax,
      monthlyTax: Math.round(oldTotalTax / 12),
      effectiveRate: gross > 0 ? ((oldTotalTax / gross) * 100).toFixed(1) : 0
    },
    recommendedRegime,
    taxSavings
  };
}

/**
 * Inflation & Purchasing Power Calculator
 */
export function calculateInflationImpact({
  currentMonthlyExpense,
  inflationRate = 5.5,
  years = 15
}) {
  const rate = inflationRate / 100;
  const futureMonthlyExpense = Math.round(currentMonthlyExpense * Math.pow(1 + rate, years));
  const multiplier = (futureMonthlyExpense / currentMonthlyExpense).toFixed(2);
  const purchasingPowerOf100k = Math.round(100000 / Math.pow(1 + rate, years));

  // Yearly progression table
  const progression = [];
  for (let y = 0; y <= years; y += Math.max(1, Math.floor(years / 6))) {
    progression.push({
      year: y,
      expense: Math.round(currentMonthlyExpense * Math.pow(1 + rate, y)),
      valueRemaining: Math.round(100000 / Math.pow(1 + rate, y))
    });
  }

  return {
    currentMonthlyExpense,
    futureMonthlyExpense,
    multiplier,
    purchasingPowerOf100k,
    progression
  };
}

/**
 * SIP Wealth Growth
 */
export function calculateSIP({ monthlyAmount, annualCAGR = 12, years = 10 }) {
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

/**
 * Lump Sum Growth
 */
export function calculateLumpSumGrowth({ principal, annualCAGR = 12, years = 10 }) {
  const futureValue = Math.round(principal * Math.pow(1 + annualCAGR / 100, years));
  return {
    principal,
    futureValue,
    gains: futureValue - principal
  };
}

/**
 * Loan Prepayment vs Equity SIP Comparator
 */
export function compareLoanPrepaymentVsSIP({
  loanBalance,
  interestRate = 8.75,
  remainingTenureYears = 15,
  extraMonthlyCash = 10000,
  expectedSIPReturn = 12.0
}) {
  const r = interestRate / 12 / 100;
  const n = remainingTenureYears * 12;
  const originalEMI = Math.round((loanBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));

  // If extra cash is paid toward loan every month
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

  // If extra cash was invested in SIP instead for the remaining tenure
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

/**
 * Duolingo-style Financial Level Badges
 */
export function getHealthBadge(score) {
  if (score >= 85) {
    return { title: "Level 5: Master Wealth Builder", emoji: "🏆", tag: "Fortified", color: "#10b981" };
  } else if (score >= 70) {
    return { title: "Level 4: Fortified Builder", emoji: "🛡️", tag: "Resilient", color: "#10b981" };
  } else if (score >= 50) {
    return { title: "Level 3: Balanced Striver", emoji: "⚖️", tag: "Stable", color: "#f59e0b" };
  } else if (score >= 35) {
    return { title: "Level 2: Stretched Spender", emoji: "⚠️", tag: "Caution", color: "#f59e0b" };
  } else {
    return { title: "Level 1: Debt Vulnerable", emoji: "🚨", tag: "Danger", color: "#ef4444" };
  }
}

/**
 * Conversational Inflation Real-World Explainer
 */
export function getInflationHumanMessage(rate, expense, years) {
  const annualLossPerLakh = Math.round(100000 * (rate / 100));
  const rateFactor = Math.pow(1 + rate / 100, years);
  const futureBasketCost = Math.round(100 * rateFactor);
  const futureTotalExpense = Math.round(expense * rateFactor);
  const lossOn100k = Math.round(100000 - (100000 / rateFactor));

  return {
    headline: `Your money is losing ~${formatINR(annualLossPerLakh)} of purchasing power per ₹1 Lakh each year at ${rate}% inflation.`,
    basketComparison: `A ₹100 grocery bag today will cost ${formatINR(futureBasketCost)} in ${years} years to take home the exact same groceries!`,
    totalMonthlyComparison: `Your current ${formatINR(expense)}/month lifestyle will require ${formatINR(futureTotalExpense)}/month in ${years} years.`,
    savingsAccountWarning: `₹1 Lakh left idle in a standard 3% bank account will silently forfeit ${formatINR(lossOn100k)} of real wealth.`
  };
}

