/**
 * "Can I Afford This?" Purchase Decision Engine for Artha
 * Computes life-energy hours, opportunity cost in Nifty 50,
 * post-purchase DTI impact, and psychological cooling-off guidelines.
 */

import { formatINR } from './calculations.js';

export function evaluatePurchase({
  itemName = "Item",
  cost = 50000,
  paymentMode = "lump", // 'lump' | 'no-cost-emi' | 'emi'
  emiMonths = 6,
  emiInterestRate = 14,
  userProfile = { salary: 100000, emi: 20000, expenses: 35000, age: 28 }
}) {
  const { salary, emi: currentEMI, expenses, age } = userProfile;
  const currentSurplus = Math.max(0, salary - currentEMI - expenses);
  const currentDTI = salary > 0 ? (currentEMI / salary) * 100 : 0;

  // Compute payment specifics
  let monthlyPurchaseEMI = 0;
  let totalCostToUser = cost;

  if (paymentMode === "lump") {
    monthlyPurchaseEMI = 0;
    totalCostToUser = cost;
  } else if (paymentMode === "no-cost-emi") {
    monthlyPurchaseEMI = Math.round(cost / emiMonths);
    // Even 'no-cost' EMI in India incurs 18% GST on the discounted interest component and processing fees
    const processingFee = Math.min(500, Math.round(cost * 0.01));
    totalCostToUser = cost + processingFee;
  } else {
    // Standard EMI with annual interest
    const r = (emiInterestRate / 12) / 100;
    const n = emiMonths;
    monthlyPurchaseEMI = Math.round((cost * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    totalCostToUser = monthlyPurchaseEMI * n;
  }

  // Post-purchase metrics
  const newMonthlyEMI = currentEMI + monthlyPurchaseEMI;
  const newDTI = salary > 0 ? (newMonthlyEMI / salary) * 100 : 0;
  const newMonthlySurplus = paymentMode === "lump" 
    ? currentSurplus 
    : Math.max(0, salary - newMonthlyEMI - expenses);

  // Life Energy / Hours of Labor Cost
  // Standard Indian corporate work month = 22 days @ 8.5 hours = ~187 working hours
  const hourlyIncome = salary > 0 ? salary / 187 : 0;
  const dailyIncome = salary > 0 ? salary / 22 : 0;
  const hoursOfLife = hourlyIncome > 0 ? Math.round(cost / hourlyIncome) : 0;
  const daysOfLife = dailyIncome > 0 ? (cost / dailyIncome).toFixed(1) : 0;

  // Opportunity Cost: What if invested in Nifty 50 at 12% CAGR?
  const n5yr = Math.round(cost * Math.pow(1.12, 5));
  const n10yr = Math.round(cost * Math.pow(1.12, 10));
  const n20yr = Math.round(cost * Math.pow(1.12, 20));

  // Determine Affordability Verdict
  let verdictCode = "GREEN"; // GREEN | AMBER | RED
  let verdictTitle = "Confidently Affordable";
  let verdictColor = "#10b981";
  let reasons = [];
  let recommendation = "";

  // Evaluation Rules
  const costToMonthlyIncomeRatio = salary > 0 ? cost / salary : 1;
  const emiToSurplusRatio = currentSurplus > 0 ? monthlyPurchaseEMI / currentSurplus : 1;

  if (salary <= 0) {
    verdictCode = "RED";
    verdictTitle = "Input Salary First";
    verdictColor = "#ef4444";
    reasons.push("Set your monthly take-home salary to evaluate affordability.");
  } else if (newDTI > 48 || (paymentMode !== "lump" && emiToSurplusRatio > 0.6)) {
    verdictCode = "RED";
    verdictTitle = "Financial Red Flag — High Risk";
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
    verdictTitle = "Financial Stretch — Caution Advised";
    verdictColor = "#f59e0b";
    if (newDTI > 35) reasons.push(`Increases your debt-to-income ratio to ${newDTI.toFixed(0)}%, bordering the RBI caution band.`);
    if (emiToSurplusRatio > 0.35) reasons.push(`Takes up ${(emiToSurplusRatio * 100).toFixed(0)}% of your monthly free cashflow.`);
    if (costToMonthlyIncomeRatio > 0.6) reasons.push(`Item price is ${(costToMonthlyIncomeRatio * 100).toFixed(0)}% of your monthly salary.`);
    recommendation = "Apply the 30-Day Cooling-off Rule. If you still desire this after 30 days and have 3+ months emergency reserves, proceed.";
  } else {
    verdictCode = "GREEN";
    verdictTitle = "Green Light — Safe to Buy";
    verdictColor = "#10b981";
    reasons.push(`Easily fits within your ${formatINR(currentSurplus)} monthly surplus.`);
    reasons.push(`Your debt ratio remains healthy at ${newDTI.toFixed(0)}% (well below RBI's 35% safe ceiling).`);
    recommendation = "You can comfortably afford this without derailing your long-term goals. Enjoy the purchase guilt-free!";
  }

  // Recommended Cooling Period
  let coolingDays = 0;
  if (cost >= 100000) coolingDays = 30;
  else if (cost >= 25000) coolingDays = 14;
  else if (cost >= 5000) coolingDays = 7;

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
