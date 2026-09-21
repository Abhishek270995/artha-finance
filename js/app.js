/**
 * Artha - The Indian Personal Finance Copilot
 * Main Application Orchestrator
 */

import { profileManager, PRESETS } from './profile.js';
import { VERIFIED_FACTS } from './facts.js';
import { 
  formatINR, 
  parseINR, 
  calculateIndianTax, 
  calculateInflationImpact, 
  compareLoanPrepaymentVsSIP, 
  calculateSIP 
} from './calculations.js';
import { evaluatePurchase } from './purchase.js';
import { drawDonutChart, drawComparisonBarChart, drawInflationCurve } from './charts.js';

class ArthaApp {
  constructor() {
    this.currentTab = 'purchase';
    this.currentFactIndex = 0;
    this.factTickerInterval = null;
    this.init();
  }

  init() {
    this.bindThemeToggle();
    this.bindProfileControls();
    this.bindTabs();
    this.bindTickerAndHoverFacts();
    this.bindPurchaseTool();
    this.bindBudgetTool();
    this.bindInflationTool();
    this.bindTaxTool();
    this.bindLoanVsSipTool();
    this.bindRetirementTool();
    this.bindExportReport();

    // Subscribe to profile updates
    profileManager.subscribe(vitals => {
      this.renderHUD(vitals);
      this.refreshCurrentTool(vitals);
    });

    // Handle window resize for charts
    window.addEventListener('resize', () => {
      this.refreshCurrentTool(profileManager.getVitals());
    });
  }

  /* -------------------------------------------------------------
     0. THEME TOGGLE (DARK / LIGHT MODE)
     ------------------------------------------------------------- */
  bindThemeToggle() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeText = document.getElementById('themeToggleText');

    const updateThemeUI = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      if (themeText) {
        themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
      }
      // Re-render current tool to update Canvas chart palettes
      this.refreshCurrentTool(profileManager.getVitals());
    };

    // Initialize button label from current attribute or system
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (themeText) {
      themeText.textContent = currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('artha_theme', nextTheme);
        updateThemeUI(nextTheme);
      });
    }

    // Listen to OS-level theme preference changes if user hasn't explicitly set one
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
        if (!localStorage.getItem('artha_theme')) {
          const sysTheme = e.matches ? 'light' : 'dark';
          updateThemeUI(sysTheme);
        }
      });
    }
  }

  /* -------------------------------------------------------------
     1. PROFILE CONTROLS & HUD
     ------------------------------------------------------------- */
  bindProfileControls() {
    const salaryInput = document.getElementById('inputSalary');
    const ageInput = document.getElementById('inputAge');
    const emiInput = document.getElementById('inputEMI');
    const expensesInput = document.getElementById('inputExpenses');
    const emergencyInput = document.getElementById('inputEmergency');

    // Populate initial values from stored profile
    const p = profileManager.profile;
    if (salaryInput) salaryInput.value = p.salary;
    if (ageInput) ageInput.value = p.age;
    if (emiInput) emiInput.value = p.emi;
    if (expensesInput) expensesInput.value = p.expenses;
    if (emergencyInput) emergencyInput.value = p.emergencyFund || 0;

    // Handle live input changes
    const handleProfileChange = () => {
      profileManager.update({
        salary: parseINR(salaryInput.value),
        age: parseInt(ageInput.value, 10) || 25,
        emi: parseINR(emiInput.value),
        expenses: parseINR(expensesInput.value),
        emergencyFund: parseINR(emergencyInput ? emergencyInput.value : 0)
      });
    };

    [salaryInput, ageInput, emiInput, expensesInput, emergencyInput].forEach(elem => {
      if (elem) {
        elem.addEventListener('input', handleProfileChange);
      }
    });

    // Persona preset buttons
    const presetButtons = document.querySelectorAll('[data-preset]');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.getAttribute('data-preset');
        profileManager.applyPreset(key);
        
        // Update input element values
        const updated = profileManager.profile;
        if (salaryInput) salaryInput.value = updated.salary;
        if (ageInput) ageInput.value = updated.age;
        if (emiInput) emiInput.value = updated.emi;
        if (expensesInput) expensesInput.value = updated.expenses;
        if (emergencyInput) emergencyInput.value = updated.emergencyFund;

        // Visual active state
        presetButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });
  }

  renderHUD(vitals) {
    const hudSalary = document.getElementById('hudSalary');
    const hudSurplus = document.getElementById('hudSurplus');
    const hudDTI = document.getElementById('hudDTI');
    const hudDTIBadge = document.getElementById('hudDTIBadge');
    const hudHealthScore = document.getElementById('hudHealthScore');
    const hudHealthLabel = document.getElementById('hudHealthLabel');
    const hudEmergencyRunway = document.getElementById('hudEmergencyRunway');

    if (hudSalary) hudSalary.textContent = formatINR(vitals.salary);
    if (hudSurplus) hudSurplus.textContent = formatINR(vitals.surplus);
    
    if (hudDTI) hudDTI.textContent = `${vitals.dti}%`;
    if (hudDTIBadge) {
      if (vitals.dti <= 35) {
        hudDTIBadge.className = 'status-pill safe';
        hudDTIBadge.textContent = 'Safe (<35%)';
      } else if (vitals.dti <= 45) {
        hudDTIBadge.className = 'status-pill warning';
        hudDTIBadge.textContent = 'Caution (35-45%)';
      } else {
        hudDTIBadge.className = 'status-pill danger';
        hudDTIBadge.textContent = 'Critical (>45%)';
      }
    }

    if (hudHealthScore) {
      hudHealthScore.textContent = vitals.health.score;
      hudHealthScore.style.color = vitals.health.color;
    }
    if (hudHealthLabel) {
      hudHealthLabel.textContent = vitals.health.status;
    }

    if (hudEmergencyRunway) {
      hudEmergencyRunway.textContent = `${vitals.emergencyMonthsCovered} Months`;
    }
  }

  /* -------------------------------------------------------------
     2. NAVIGATION & TABS
     ------------------------------------------------------------- */
  bindTabs() {
    const tabButtons = document.querySelectorAll('[data-tab-target]');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-tab-target');
        this.currentTab = target;

        tabButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        document.querySelectorAll('.tool-pane').forEach(pane => {
          pane.classList.remove('active');
        });
        const activePane = document.getElementById(`pane-${target}`);
        if (activePane) activePane.classList.add('active');

        this.refreshCurrentTool(profileManager.getVitals());
      });
    });
  }

  refreshCurrentTool(vitals) {
    switch (this.currentTab) {
      case 'purchase':
        this.runPurchaseEvaluation(vitals);
        break;
      case 'budget':
        this.renderBudgetTool(vitals);
        break;
      case 'inflation':
        this.renderInflationTool(vitals);
        break;
      case 'tax':
        this.renderTaxTool(vitals);
        break;
      case 'loan-vs-sip':
        this.renderLoanVsSipTool(vitals);
        break;
      case 'retirement':
        this.renderRetirementTool(vitals);
        break;
    }
  }

  /* -------------------------------------------------------------
     3. VERIFIED FACTS & AWARENESS TICKER / HOVER CARDS
     ------------------------------------------------------------- */
  bindTickerAndHoverFacts() {
    const tickerTrack = document.getElementById('tickerTrack');
    const hoverCard = document.getElementById('floatingHoverCard');
    const factModal = document.getElementById('factModal');
    const modalClose = document.getElementById('modalClose');

    // Build Continuous Ticker Items
    if (tickerTrack) {
      const itemsHtml = VERIFIED_FACTS.map((fact, idx) => `
        <div class="ticker-item" data-fact-index="${idx}">
          <span class="badge-source ${fact.urgency}">${fact.sourceTag}</span>
          <span class="ticker-text">${fact.shortSnippet}</span>
        </div>
      `).join('');
      // Duplicate for seamless infinite loop
      tickerTrack.innerHTML = itemsHtml + itemsHtml;

      tickerTrack.querySelectorAll('.ticker-item').forEach(el => {
        el.addEventListener('click', (e) => {
          const idx = e.currentTarget.getAttribute('data-fact-index');
          this.openFactModal(VERIFIED_FACTS[idx]);
        });
      });
    }

    // Floating Interactive Fact Card (cycles every 7 seconds, clickable)
    const updateHoverCard = () => {
      if (!hoverCard) return;
      const fact = VERIFIED_FACTS[this.currentFactIndex];
      hoverCard.querySelector('.floating-tag').textContent = fact.sourceTag;
      hoverCard.querySelector('.floating-tag').className = `floating-tag ${fact.urgency}`;
      hoverCard.querySelector('.floating-title').textContent = fact.title;
      hoverCard.querySelector('.floating-desc').textContent = fact.shortSnippet;
      hoverCard.setAttribute('data-fact-index', this.currentFactIndex);

      this.currentFactIndex = (this.currentFactIndex + 1) % VERIFIED_FACTS.length;
    };

    updateHoverCard();
    this.factTickerInterval = setInterval(updateHoverCard, 7000);

    if (hoverCard) {
      hoverCard.addEventListener('click', () => {
        const idx = hoverCard.getAttribute('data-fact-index');
        this.openFactModal(VERIFIED_FACTS[idx] || VERIFIED_FACTS[0]);
      });
    }

    // Modal controls
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        if (factModal) factModal.classList.remove('open');
      });
    }
    if (factModal) {
      factModal.addEventListener('click', (e) => {
        if (e.target === factModal) factModal.classList.remove('open');
      });
    }

    // "Browse All Verified Facts" button
    const browseFactsBtn = document.getElementById('btnBrowseFacts');
    if (browseFactsBtn) {
      browseFactsBtn.addEventListener('click', () => {
        this.openFactModal(VERIFIED_FACTS[0]);
      });
    }
  }

  openFactModal(fact) {
    const modal = document.getElementById('factModal');
    if (!modal) return;
    document.getElementById('modalSource').textContent = fact.source;
    document.getElementById('modalTitle').textContent = fact.title;
    document.getElementById('modalSnippet').textContent = fact.shortSnippet;
    document.getElementById('modalDetails').textContent = fact.fullDetails;
    document.getElementById('modalActionTip').textContent = fact.actionableTip;

    // List other quick facts inside modal
    const otherFactsContainer = document.getElementById('modalFactsGrid');
    if (otherFactsContainer) {
      otherFactsContainer.innerHTML = VERIFIED_FACTS.map((f, i) => `
        <div class="modal-fact-chip ${f.id === fact.id ? 'active' : ''}" data-fact-idx="${i}">
          <span class="source-tag">${f.sourceTag}</span>
          <span class="chip-title">${f.title}</span>
        </div>
      `).join('');

      otherFactsContainer.querySelectorAll('.modal-fact-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          const idx = e.currentTarget.getAttribute('data-fact-idx');
          this.openFactModal(VERIFIED_FACTS[idx]);
        });
      });
    }

    modal.classList.add('open');
  }

  /* -------------------------------------------------------------
     4. TOOL 1: "CAN I AFFORD THIS?"
     ------------------------------------------------------------- */
  bindPurchaseTool() {
    const itemNameInput = document.getElementById('purchaseItemName');
    const itemCostInput = document.getElementById('purchaseCost');
    const paymentRadios = document.querySelectorAll('input[name="paymentMode"]');
    const emiDetailsBox = document.getElementById('emiDetailsConfig');
    const emiMonthsSelect = document.getElementById('purchaseEmiMonths');
    const emiRateInput = document.getElementById('purchaseEmiRate');

    // Preset purchase buttons
    document.querySelectorAll('.preset-purchase-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-name');
        const cost = e.currentTarget.getAttribute('data-cost');
        if (itemNameInput) itemNameInput.value = name;
        if (itemCostInput) itemCostInput.value = cost;
        this.runPurchaseEvaluation(profileManager.getVitals());
      });
    });

    const triggerEvaluation = () => {
      this.runPurchaseEvaluation(profileManager.getVitals());
    };

    [itemNameInput, itemCostInput, emiMonthsSelect, emiRateInput].forEach(elem => {
      if (elem) elem.addEventListener('input', triggerEvaluation);
    });

    paymentRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const mode = e.target.value;
        if (emiDetailsBox) {
          emiDetailsBox.style.display = mode === 'lump' ? 'none' : 'grid';
        }
        triggerEvaluation();
      });
    });
  }

  runPurchaseEvaluation(vitals) {
    const itemName = document.getElementById('purchaseItemName')?.value || "Item";
    const cost = parseINR(document.getElementById('purchaseCost')?.value) || 0;
    const paymentMode = document.querySelector('input[name="paymentMode"]:checked')?.value || 'lump';
    const emiMonths = parseInt(document.getElementById('purchaseEmiMonths')?.value, 10) || 6;
    const emiInterestRate = parseFloat(document.getElementById('purchaseEmiRate')?.value) || 14;

    const evaluation = evaluatePurchase({
      itemName,
      cost,
      paymentMode,
      emiMonths,
      emiInterestRate,
      userProfile: vitals.profile
    });

    // Update Verdict Card
    const verdictBanner = document.getElementById('verdictBanner');
    const verdictTitle = document.getElementById('verdictTitle');
    const verdictSubtitle = document.getElementById('verdictSubtitle');
    const verdictReasons = document.getElementById('verdictReasons');
    const verdictTip = document.getElementById('verdictTip');

    if (verdictBanner) {
      verdictBanner.className = `verdict-banner ${evaluation.verdict.code.toLowerCase()}`;
    }
    if (verdictTitle) {
      verdictTitle.textContent = evaluation.verdict.title;
      verdictTitle.style.color = evaluation.verdict.color;
    }
    if (verdictSubtitle) {
      verdictSubtitle.textContent = evaluation.verdict.recommendation;
    }
    if (verdictReasons) {
      verdictReasons.innerHTML = evaluation.verdict.reasons.map(r => `<li>${r}</li>`).join('');
    }
    if (verdictTip && evaluation.verdict.coolingDays > 0) {
      verdictTip.innerHTML = `<strong>Dopamine Check:</strong> We recommend a <strong>${evaluation.verdict.coolingDays}-day cooling-off rule</strong> for purchases over ${formatINR(cost >= 100000 ? 100000 : 25000)}.`;
      verdictTip.style.display = 'block';
    } else if (verdictTip) {
      verdictTip.style.display = 'none';
    }

    // Update Metrics
    const lifeDaysElem = document.getElementById('metricLifeDays');
    const lifeHoursElem = document.getElementById('metricLifeHours');
    const postDtiElem = document.getElementById('metricPostDti');
    const postSurplusElem = document.getElementById('metricPostSurplus');

    if (lifeDaysElem) lifeDaysElem.textContent = `${evaluation.daysOfLife} Working Days`;
    if (lifeHoursElem) lifeHoursElem.textContent = `(${evaluation.hoursOfLife} working hours of your life)`;
    if (postDtiElem) postDtiElem.textContent = `${evaluation.newDTI}% (was ${evaluation.currentDTI}%)`;
    if (postSurplusElem) postSurplusElem.textContent = formatINR(evaluation.newMonthlySurplus);

    // Opportunity Cost Metrics
    const opp5yr = document.getElementById('oppCost5yr');
    const opp10yr = document.getElementById('oppCost10yr');
    const opp20yr = document.getElementById('oppCost20yr');

    if (opp5yr) opp5yr.textContent = formatINR(evaluation.opportunityCost.in5Years);
    if (opp10yr) opp10yr.textContent = formatINR(evaluation.opportunityCost.in10Years);
    if (opp20yr) opp20yr.textContent = formatINR(evaluation.opportunityCost.in20Years);
  }

  /* -------------------------------------------------------------
     5. TOOL 2: 50-30-20 & BHARAT BUDGET HEALTH
     ------------------------------------------------------------- */
  bindBudgetTool() {
    // Reactive with profile vitals
  }

  renderBudgetTool(vitals) {
    const { salary, emi, expenses, surplus } = vitals;
    const canvas = document.getElementById('budgetDonutCanvas');

    // Indianized budget breakdown
    const needs = expenses;
    const debtServicing = emi;
    // Assume 40% of surplus is discretionary wants, 60% is investments/savings
    const wants = Math.round(surplus * 0.4);
    const investments = Math.round(surplus * 0.6);

    const needsPct = salary > 0 ? Math.round((needs / salary) * 100) : 0;
    const debtPct = salary > 0 ? Math.round((debtServicing / salary) * 100) : 0;
    const wantsPct = salary > 0 ? Math.round((wants / salary) * 100) : 0;
    const investPct = salary > 0 ? Math.round((investments / salary) * 100) : 0;

    // Update labels
    document.getElementById('budgetNeedsVal').textContent = `${formatINR(needs)} (${needsPct}%)`;
    document.getElementById('budgetDebtVal').textContent = `${formatINR(debtServicing)} (${debtPct}%)`;
    document.getElementById('budgetWantsVal').textContent = `${formatINR(wants)} (${wantsPct}%)`;
    document.getElementById('budgetInvestVal').textContent = `${formatINR(investments)} (${investPct}%)`;

    // Draw Donut
    const segments = [
      { label: 'Essential Needs', value: needs, color: '#38bdf8' },
      { label: 'Debt / EMIs', value: debtServicing, color: '#ef4444' },
      { label: 'Discretionary Wants', value: wants, color: '#f59e0b' },
      { label: 'Investments & Savings', value: investments, color: '#10b981' }
    ];

    drawDonutChart(canvas, segments, {
      title: formatINR(salary),
      subtitle: 'Monthly In-Hand'
    });

    // Budget Diagnosis
    const diagnosis = document.getElementById('budgetDiagnosisText');
    if (diagnosis) {
      if (debtPct > 40) {
        diagnosis.innerHTML = `⚠️ <strong>High Debt Servicing (${debtPct}%):</strong> RBI prudential norms advise keeping EMIs below 35-40%. You should aggressively prepay high-cost debt before increasing lifestyle expenses.`;
      } else if (investPct < 20) {
        diagnosis.innerHTML = `⚡ <strong>Low Savings Rate (${investPct}%):</strong> Financial independence in India requires saving at least 25-30% of income to beat 5.5% CPI inflation and 12% healthcare inflation.`;
      } else {
        diagnosis.innerHTML = `✨ <strong>Excellent Cashflow Discipline:</strong> Your budget allocates ${investPct}% to future wealth creation while maintaining debt at a safe ${debtPct}%. Keep compounding!`;
      }
    }
  }

  /* -------------------------------------------------------------
     6. TOOL 3: INFLATION TIME MACHINE
     ------------------------------------------------------------- */
  bindInflationTool() {
    const expenseSlider = document.getElementById('inflationExpense');
    const rateSlider = document.getElementById('inflationRate');
    const yearsSlider = document.getElementById('inflationYears');

    const update = () => this.renderInflationTool(profileManager.getVitals());

    [expenseSlider, rateSlider, yearsSlider].forEach(s => {
      if (s) s.addEventListener('input', update);
    });

    // Inflation rate presets
    document.querySelectorAll('[data-inf-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rate = e.currentTarget.getAttribute('data-inf-preset');
        if (rateSlider) rateSlider.value = rate;
        update();
      });
    });
  }

  renderInflationTool(vitals) {
    const currentMonthlyExpense = parseINR(document.getElementById('inflationExpense')?.value) || vitals.expenses || 40000;
    const inflationRate = parseFloat(document.getElementById('inflationRate')?.value) || 5.5;
    const years = parseInt(document.getElementById('inflationYears')?.value, 10) || 15;

    document.getElementById('lblInflationExpense').textContent = formatINR(currentMonthlyExpense);
    document.getElementById('lblInflationRate').textContent = `${inflationRate}%`;
    document.getElementById('lblInflationYears').textContent = `${years} Years`;

    const impact = calculateInflationImpact({
      currentMonthlyExpense,
      inflationRate,
      years
    });

    document.getElementById('infFutureExpense').textContent = formatINR(impact.futureMonthlyExpense);
    document.getElementById('infMultiplier').textContent = `${impact.multiplier}x`;
    document.getElementById('infPurchasingPower').textContent = formatINR(impact.purchasingPowerOf100k);

    const canvas = document.getElementById('inflationCanvas');
    drawInflationCurve(canvas, impact.progression);
  }

  /* -------------------------------------------------------------
     7. TOOL 4: INDIAN TAX COMPARATOR (NEW VS OLD FY 24-25/25-26)
     ------------------------------------------------------------- */
  bindTaxTool() {
    const grossInput = document.getElementById('taxGrossSalary');
    const ded80C = document.getElementById('tax80C');
    const ded80D = document.getElementById('tax80D');
    const dedHRA = document.getElementById('taxHRA');
    const dedHomeLoan = document.getElementById('taxHomeLoan');
    const dedNPS = document.getElementById('taxNPS');

    const trigger = () => this.renderTaxTool(profileManager.getVitals());

    [grossInput, ded80C, ded80D, dedHRA, dedHomeLoan, dedNPS].forEach(el => {
      if (el) el.addEventListener('input', trigger);
    });

    // Quick sync button with profile salary
    const syncBtn = document.getElementById('btnSyncTaxSalary');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        const v = profileManager.getVitals();
        // Annual estimate from in-hand (add roughly 15-20% for gross estimate)
        const grossEst = Math.round(v.salary * 12 * 1.15);
        if (grossInput) grossInput.value = grossEst;
        trigger();
      });
    }
  }

  renderTaxTool(vitals) {
    const grossInput = document.getElementById('taxGrossSalary');
    if (grossInput && !grossInput.value) {
      grossInput.value = Math.round(vitals.salary * 12 * 1.15);
    }

    const annualGrossSalary = parseINR(document.getElementById('taxGrossSalary')?.value) || 1200000;
    const deduction80C = parseINR(document.getElementById('tax80C')?.value) || 150000;
    const deduction80D = parseINR(document.getElementById('tax80D')?.value) || 25000;
    const hraDeduction = parseINR(document.getElementById('taxHRA')?.value) || 0;
    const homeLoanInterest = parseINR(document.getElementById('taxHomeLoan')?.value) || 0;
    const nps80CCD = parseINR(document.getElementById('taxNPS')?.value) || 0;

    const result = calculateIndianTax({
      annualGrossSalary,
      deduction80C,
      deduction80D,
      hraDeduction,
      homeLoanInterest,
      nps80CCD
    });

    // Update New Regime Cards
    document.getElementById('newRegimeTax').textContent = formatINR(result.newRegime.totalTax);
    document.getElementById('newRegimeMonthly').textContent = `${formatINR(result.newRegime.monthlyTax)}/mo`;
    document.getElementById('newRegimeRate').textContent = `${result.newRegime.effectiveRate}%`;

    // Update Old Regime Cards
    document.getElementById('oldRegimeTax').textContent = formatINR(result.oldRegime.totalTax);
    document.getElementById('oldRegimeMonthly').textContent = `${formatINR(result.oldRegime.monthlyTax)}/mo`;
    document.getElementById('oldRegimeRate').textContent = `${result.oldRegime.effectiveRate}%`;

    // Recommendation Banner
    const recBanner = document.getElementById('taxRecommendationBanner');
    if (recBanner) {
      if (result.recommendedRegime === 'NEW') {
        recBanner.className = 'tax-rec-banner new-wins';
        recBanner.innerHTML = `🏆 <strong>New Tax Regime is Cheaper!</strong> You save <strong>${formatINR(result.taxSavings)}</strong> in tax per year with zero hassle of saving tax investment receipts.`;
      } else {
        recBanner.className = 'tax-rec-banner old-wins';
        recBanner.innerHTML = `🏆 <strong>Old Tax Regime is Cheaper!</strong> Your deductions (80C, HRA, Home Loan) save you <strong>${formatINR(result.taxSavings)}</strong> more than the New Regime.`;
      }
    }

    // Comparison Chart
    const canvas = document.getElementById('taxChartCanvas');
    drawComparisonBarChart(canvas, [
      { label: 'New Regime Tax', value: result.newRegime.totalTax, formattedValue: formatINR(result.newRegime.totalTax), color: '#10b981' },
      { label: 'Old Regime Tax', value: result.oldRegime.totalTax, formattedValue: formatINR(result.oldRegime.totalTax), color: '#38bdf8' }
    ]);
  }

  /* -------------------------------------------------------------
     8. TOOL 5: LOAN PREPAYMENT VS EQUITY SIP
     ------------------------------------------------------------- */
  bindLoanVsSipTool() {
    const loanBal = document.getElementById('loanBalance');
    const loanRate = document.getElementById('loanRate');
    const loanTenure = document.getElementById('loanTenure');
    const extraCash = document.getElementById('loanExtraCash');
    const sipRate = document.getElementById('loanSipRate');

    const update = () => this.renderLoanVsSipTool(profileManager.getVitals());

    [loanBal, loanRate, loanTenure, extraCash, sipRate].forEach(el => {
      if (el) el.addEventListener('input', update);
    });
  }

  renderLoanVsSipTool(vitals) {
    const loanBalance = parseINR(document.getElementById('loanBalance')?.value) || vitals.loanOutstanding || 2500000;
    const interestRate = parseFloat(document.getElementById('loanRate')?.value) || 8.75;
    const remainingTenureYears = parseInt(document.getElementById('loanTenure')?.value, 10) || 15;
    const extraMonthlyCash = parseINR(document.getElementById('loanExtraCash')?.value) || 10000;
    const expectedSIPReturn = parseFloat(document.getElementById('loanSipRate')?.value) || 12.0;

    const result = compareLoanPrepaymentVsSIP({
      loanBalance,
      interestRate,
      remainingTenureYears,
      extraMonthlyCash,
      expectedSIPReturn
    });

    document.getElementById('loanSavedInterest').textContent = formatINR(result.interestSaved);
    document.getElementById('loanYearsSaved').textContent = `${result.yearsSaved} Years sooner`;
    document.getElementById('sipWealthAccumulated').textContent = formatINR(result.sipFutureValue);
    document.getElementById('sipNetProfit').textContent = `+${formatINR(result.sipGains)} in pure wealth`;

    const verdict = document.getElementById('loanVsSipVerdict');
    if (verdict) {
      if (result.netAdvantage > 0) {
        verdict.innerHTML = `💡 <strong>Wealth Creator Choice:</strong> Investing the extra ${formatINR(extraMonthlyCash)}/mo in a diversified Equity Index SIP beats prepaying your ${interestRate}% loan by <strong>${formatINR(result.netAdvantage)}</strong> over ${remainingTenureYears} years.<br><span class="text-subtle">Tip: If emotional peace of mind without debt is your #1 priority, prepaying guarantees a risk-free ${interestRate}% return.</span>`;
      } else {
        verdict.innerHTML = `💡 <strong>Debt Prepayment Choice:</strong> Prepaying your loan saves <strong>${formatINR(result.interestSaved)}</strong> in guaranteed interest and clears your liability ${result.yearsSaved} years earlier!`;
      }
    }

    const canvas = document.getElementById('loanVsSipCanvas');
    drawComparisonBarChart(canvas, [
      { label: 'Interest Saved (Prepay)', value: result.interestSaved, formattedValue: formatINR(result.interestSaved), color: '#38bdf8' },
      { label: 'SIP Corpus Created', value: result.sipFutureValue, formattedValue: formatINR(result.sipFutureValue), color: '#10b981' }
    ]);
  }

  /* -------------------------------------------------------------
     9. TOOL 6: AGE-BASED GOALS & RETIREMENT (FIRE)
     ------------------------------------------------------------- */
  bindRetirementTool() {
    const retAge = document.getElementById('retTargetAge');
    const retExpense = document.getElementById('retDesiredMonthly');

    const update = () => this.renderRetirementTool(profileManager.getVitals());
    if (retAge) retAge.addEventListener('input', update);
    if (retExpense) retExpense.addEventListener('input', update);
  }

  renderRetirementTool(vitals) {
    const age = vitals.age;
    const targetRetirementAge = parseInt(document.getElementById('retTargetAge')?.value, 10) || 58;
    const desiredMonthlyInRetirement = parseINR(document.getElementById('retDesiredMonthly')?.value) || vitals.expenses || 50000;

    const yearsToRetire = Math.max(1, targetRetirementAge - age);
    document.getElementById('retYearsLeft').textContent = `${yearsToRetire} Years`;

    // Rule of (100 - Age) for Asset Allocation
    const equityAllocation = Math.max(20, Math.min(80, 100 - age));
    const debtAllocation = 100 - equityAllocation;

    document.getElementById('retEquityPct').textContent = `${equityAllocation}%`;
    document.getElementById('retDebtPct').textContent = `${debtAllocation}%`;

    // Recommended Insurance Covers
    const recommendedTermCover = vitals.salary * 12 * 20; // 20x annual income
    document.getElementById('recTermCover').textContent = formatINR(recommendedTermCover, true);

    const recommendedHealthCover = age < 35 ? "₹10 Lakhs + Super Top-up" : "₹25 Lakhs + Super Top-up";
    document.getElementById('recHealthCover').textContent = recommendedHealthCover;

    // Target Retirement Corpus at 5.5% inflation
    // Monthly expense inflated to retirement age:
    const inflatedMonthly = desiredMonthlyInRetirement * Math.pow(1.055, yearsToRetire);
    // 25x rule for 25-30 years post retirement (4% safe withdrawal rate)
    const requiredCorpus = Math.round(inflatedMonthly * 12 * 25);
    document.getElementById('retTargetCorpus').textContent = formatINR(requiredCorpus, true);

    // Monthly SIP required at 12% equity CAGR
    const r = 0.12 / 12;
    const n = yearsToRetire * 12;
    const monthlySIPNeeded = Math.round(requiredCorpus / (((Math.pow(1 + r, n) - 1) / r) * (1 + r)));
    document.getElementById('retMonthlySipNeeded').textContent = `${formatINR(monthlySIPNeeded)}/month`;
  }

  /* -------------------------------------------------------------
     10. EXPORT / PRINT REPORT
     ------------------------------------------------------------- */
  bindExportReport() {
    const exportBtn = document.getElementById('btnExportReport');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }
}

// Bootstrap once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.arthaApp = new ArthaApp();
});
