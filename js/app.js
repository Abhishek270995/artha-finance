/**
 * Artha - The Indian Personal Finance Copilot
 * Main Application Orchestrator (Notion + Zerodha + Duolingo Visual Overhaul)
 */

import { profileManager, PRESETS } from './profile.js';
import { VERIFIED_FACTS } from './facts.js';
import { 
  formatINR, 
  parseINR, 
  calculateIndianTax, 
  calculateInflationImpact, 
  compareLoanPrepaymentVsSIP, 
  calculateSIP,
  getHealthBadge,
  getInflationHumanMessage,
  simulateInflation,
  INFLATION_ITEMS,
  calculateIndiaVsMeInflation,
  INDIA_VS_ME_CATEGORIES,
  INDIA_VS_ME_PRESETS
} from './calculations.js';
import { evaluatePurchase } from './purchase.js';
import { drawDonutChart, drawComparisonBarChart, drawInflationCurve } from './charts.js';
import { FINANCE_DICTIONARY, DICTIONARY_CATEGORIES } from './dictionary.js';

function setRingProgress(elemId, percentage, color) {
  const ring = document.getElementById(elemId);
  if (!ring) return;
  const circumference = 283; // 2 * PI * 45
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference * (1 - clamped / 100);
  ring.style.strokeDashoffset = offset;
  if (color) ring.style.stroke = color;
}

class ArthaApp {
  constructor() {
    this.currentTab = 'purchase';
    this.currentFactIndex = 0;
    this.factTickerInterval = null;
    this.init();
  }

  init() {
    try { this.bindThemeToggle(); } catch (e) { console.error("Theme toggle error:", e); }
    try { this.bindSteppers(); } catch (e) { console.error("Steppers error:", e); }
    try { this.bindProfileControls(); } catch (e) { console.error("Profile controls error:", e); }
    try { this.bindTabs(); } catch (e) { console.error("Tabs error:", e); }
    try { this.bindTickerAndHoverFacts(); } catch (e) { console.error("Ticker/Facts error:", e); }
    try { this.bindPurchaseTool(); } catch (e) { console.error("Purchase tool error:", e); }
    try { this.bindBudgetTool(); } catch (e) { console.error("Budget tool error:", e); }
    try { this.bindInflationTool(); } catch (e) { console.error("Inflation tool error:", e); }
    try { this.bindIndiaVsMeTool(); } catch (e) { console.error("India vs Me tool error:", e); }
    try { this.bindTaxTool(); } catch (e) { console.error("Tax tool error:", e); }
    try { this.bindLoanVsSipTool(); } catch (e) { console.error("Loan tool error:", e); }
    try { this.bindRetirementTool(); } catch (e) { console.error("Retirement tool error:", e); }
    try { this.bindDictionaryTool(); } catch (e) { console.error("Dictionary tool error:", e); }
    try { this.bindExportReport(); } catch (e) { console.error("Export report error:", e); }

    // Subscribe to profile updates
    try {
      profileManager.subscribe(vitals => {
        this.renderHUD(vitals);
        this.refreshCurrentTool(vitals);
      });
    } catch (e) {
      console.error("Profile subscribe error:", e);
    }

    // Handle window resize for charts
    window.addEventListener('resize', () => {
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
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeText = document.getElementById('themeToggleText');

    const updateThemeUI = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      if (themeText) {
        themeText.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
      }
      // Re-render current tool to update Canvas chart palettes
      try {
        this.refreshCurrentTool(profileManager.getVitals());
      } catch (e) {
        console.warn("Chart refresh error on theme change", e);
      }
    };

    // Initialize button label from current attribute or system
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (themeText) {
      themeText.textContent = currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }

    if (themeBtn) {
      themeBtn.addEventListener('click', (e) => {
        e.preventDefault();
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
     0.1 QUICK STEPPER BUTTONS (+/-)
     ------------------------------------------------------------- */
  bindSteppers() {
    document.querySelectorAll('.step-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('data-step-target');
        const delta = parseInt(e.currentTarget.getAttribute('data-step-val'), 10);
        const input = document.getElementById(targetId);
        if (input) {
          const currentVal = parseInt(input.value, 10) || 0;
          input.value = Math.max(0, currentVal + delta);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
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
    const presetButtons = document.querySelectorAll('[data-preset]');

    // Populate initial values from stored profile
    const p = profileManager.profile;
    if (salaryInput) salaryInput.value = p.salary;
    if (ageInput) ageInput.value = p.age;
    if (emiInput) emiInput.value = p.emi;
    if (expensesInput) expensesInput.value = p.expenses;
    if (emergencyInput) emergencyInput.value = p.emergencyFund || 0;

    // Handle live input changes
    const handleProfileChange = () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      profileManager.update({
        salary: parseINR(salaryInput ? salaryInput.value : 0),
        age: parseInt(ageInput ? ageInput.value : 25, 10) || 25,
        emi: parseINR(emiInput ? emiInput.value : 0),
        expenses: parseINR(expensesInput ? expensesInput.value : 0),
        emergencyFund: parseINR(emergencyInput ? emergencyInput.value : 0)
      });
    };

    [salaryInput, ageInput, emiInput, expensesInput, emergencyInput].forEach(elem => {
      if (elem) {
        elem.addEventListener('input', handleProfileChange);
        elem.addEventListener('change', handleProfileChange);
        elem.addEventListener('keyup', handleProfileChange);
      }
    });

    // Persona preset buttons
    presetButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
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
    const hudHealthBadge = document.getElementById('hudHealthBadge');
    const hudEmergencyRunway = document.getElementById('hudEmergencyRunway');
    const hudRunwayBadge = document.getElementById('hudRunwayBadge');

    // Notion-style Human Callout Message
    const storyTitle = document.getElementById('storyGreetingTitle');
    const storyBody = document.getElementById('storyGreetingBody');
    if (storyTitle) {
      storyTitle.textContent = `You have ${formatINR(vitals.surplus)} of pure freedom cash every month.`;
    }
    if (storyBody) {
      storyBody.innerHTML = `From your <strong>${formatINR(vitals.salary)}</strong> take-home salary, <strong>${formatINR(vitals.emi)}</strong> pays past EMIs and <strong>${formatINR(vitals.expenses)}</strong> covers survival needs.`;
    }

    if (hudSalary) hudSalary.textContent = formatINR(vitals.salary);
    if (hudSurplus) hudSurplus.textContent = formatINR(vitals.surplus);
    
    // DTI Display & Ring
    if (hudDTI) hudDTI.textContent = `${vitals.dti}%`;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const emeraldColor = isLight ? '#059669' : '#10b981';
    const amberColor = isLight ? '#b45309' : '#f59e0b';
    const roseColor = isLight ? '#dc2626' : '#ef4444';

    const dtiColor = vitals.dti <= 35 ? emeraldColor : vitals.dti <= 45 ? amberColor : roseColor;
    setRingProgress('ringDtiProgress', Math.min(100, vitals.dti * 1.5), dtiColor);

    if (hudDTIBadge) {
      if (vitals.dti <= 35) {
        hudDTIBadge.className = 'ring-badge-pill fortified';
        hudDTIBadge.textContent = '🛡️ Safe (<35%)';
      } else if (vitals.dti <= 45) {
        hudDTIBadge.className = 'ring-badge-pill warning';
        hudDTIBadge.textContent = '⚠️ Caution (35-45%)';
      } else {
        hudDTIBadge.className = 'ring-badge-pill danger';
        hudDTIBadge.textContent = '🚨 Critical (>45%)';
      }
    }

    // Health Score Display & Ring (Duolingo Style)
    const healthColor = vitals.health.score >= 70 ? emeraldColor : vitals.health.score >= 45 ? amberColor : roseColor;
    if (hudHealthScore) {
      hudHealthScore.textContent = vitals.health.score;
      hudHealthScore.style.color = healthColor;
    }
    setRingProgress('ringHealthProgress', vitals.health.score, healthColor);

    const levelBadge = getHealthBadge(vitals.health.score);
    if (hudHealthBadge) {
      hudHealthBadge.textContent = `${levelBadge.emoji} ${levelBadge.title.split(': ')[1] || levelBadge.title}`;
      hudHealthBadge.className = `ring-badge-pill ${levelBadge.tag.toLowerCase()}`;
    }

    // Emergency Buffer Display & Ring
    if (hudEmergencyRunway) {
      hudEmergencyRunway.textContent = vitals.emergencyMonthsCovered;
    }
    const runwayPct = Math.min(100, Math.round((vitals.emergencyMonthsCovered / 6) * 100));
    const runwayColor = runwayPct >= 80 ? emeraldColor : runwayPct >= 40 ? amberColor : roseColor;
    setRingProgress('ringRunwayProgress', runwayPct, runwayColor);

    if (hudRunwayBadge) {
      hudRunwayBadge.textContent = `🔋 ${vitals.emergencyMonthsCovered} / 6.0 Months`;
      hudRunwayBadge.className = `ring-badge-pill ${runwayPct >= 80 ? 'fortified' : runwayPct >= 40 ? 'warning' : 'danger'}`;
    }
  }

  /* -------------------------------------------------------------
     2. NAVIGATION & TABS
     ------------------------------------------------------------- */
  switchTab(target) {
    this.currentTab = target;

    const tabButtons = document.querySelectorAll('[data-tab-target]');
    tabButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab-target') === target));

    document.querySelectorAll('.tool-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${target}`);
    });

    this.refreshCurrentTool(profileManager.getVitals());
  }

  bindTabs() {
    const tabButtons = document.querySelectorAll('[data-tab-target]');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-tab-target');
        this.switchTab(target);
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
      case 'dictionary':
        this.renderDictionaryTool();
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
      hoverCard.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(hoverCard.getAttribute('data-fact-index'), 10) || 0;
        this.openFactModal(VERIFIED_FACTS[idx] || VERIFIED_FACTS[0]);
      });
    }

    // Modal controls
    if (modalClose) {
      modalClose.addEventListener('click', (e) => {
        e.preventDefault();
        if (factModal) factModal.classList.remove('open');
      });
    }
    if (factModal) {
      factModal.addEventListener('click', (e) => {
        if (e.target === factModal) factModal.classList.remove('open');
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && factModal && factModal.classList.contains('open')) {
        factModal.classList.remove('open');
      }
    });

    // "Browse All Verified Facts" button
    const browseFactsBtn = document.getElementById('btnBrowseFacts');
    if (browseFactsBtn) {
      browseFactsBtn.addEventListener('click', (e) => {
        e.preventDefault();
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

    // Update Duolingo-style Verdict Card
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
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const verdictColor = evaluation.verdict.code === 'GREEN'
        ? (isLight ? '#059669' : '#10b981')
        : evaluation.verdict.code === 'AMBER'
          ? (isLight ? '#b45309' : '#f59e0b')
          : (isLight ? '#dc2626' : '#ef4444');
      verdictTitle.style.color = verdictColor;
    }
    if (verdictSubtitle) {
      verdictSubtitle.textContent = evaluation.verdict.recommendation;
    }
    if (verdictReasons) {
      verdictReasons.innerHTML = evaluation.verdict.reasons.map(r => `<li>${r}</li>`).join('');
    }
    if (verdictTip && evaluation.verdict.coolingDays > 0) {
      verdictTip.innerHTML = `<strong>Dopamine Check:</strong> We recommend a <strong>${evaluation.verdict.coolingDays}-day cooling-off rule</strong> before pulling the trigger.`;
      verdictTip.style.display = 'block';
    } else if (verdictTip) {
      verdictTip.style.display = 'none';
    }

    // Update Before vs After Visual Duel
    const { before, after } = evaluation.beforeAfter;
    const beforeSurplusEl = document.getElementById('duelBeforeSurplus');
    const beforeEmiEl = document.getElementById('duelBeforeEmi');
    const beforeDtiEl = document.getElementById('duelBeforeDti');
    const afterSurplusEl = document.getElementById('duelAfterSurplus');
    const surplusDiffEl = document.getElementById('duelSurplusDiffText');
    const afterEmiEl = document.getElementById('duelAfterEmi');
    const afterDtiEl = document.getElementById('duelAfterDti');

    if (beforeSurplusEl) beforeSurplusEl.textContent = formatINR(before.surplus);
    if (beforeEmiEl) beforeEmiEl.textContent = formatINR(before.emi);
    if (beforeDtiEl) beforeDtiEl.textContent = `${before.dti}% (${before.dti <= 35 ? 'Safe' : 'Caution'})`;

    if (afterSurplusEl) afterSurplusEl.textContent = formatINR(after.surplus);
    if (surplusDiffEl) surplusDiffEl.textContent = `-${formatINR(after.surplusDiff)}/month impact`;
    if (afterEmiEl) afterEmiEl.textContent = formatINR(after.emi);
    if (afterDtiEl) afterDtiEl.textContent = `${after.dti}% (${after.dti <= 35 ? 'Safe' : after.dti <= 45 ? 'Caution' : 'Critical'})`;

    // Life-Energy Calendar Workdays Grid
    const lifeDaysElem = document.getElementById('metricLifeDays');
    const lifeStoryElem = document.getElementById('lifeEnergyStory');
    const pipsGrid = document.getElementById('workdaysPipsGrid');

    if (lifeDaysElem) lifeDaysElem.textContent = `${evaluation.daysOfLife} Working Days`;
    if (lifeStoryElem) lifeStoryElem.textContent = evaluation.lifeEnergyStory;

    if (pipsGrid) {
      const committedDays = Math.min(60, Math.round(parseFloat(evaluation.daysOfLife) || 0));
      let pipsHtml = '';
      const totalDisplayPips = Math.max(22, committedDays);
      for (let i = 0; i < totalDisplayPips; i++) {
        const isCommitted = i < committedDays;
        pipsHtml += `<div class="workday-pip ${isCommitted ? 'committed' : ''}" title="${isCommitted ? 'Committed Workday ' + (i+1) : 'Free Workday'}"></div>`;
      }
      pipsGrid.innerHTML = pipsHtml;
    }

    // Interactive Opportunity Cost Scrubber
    const scrubber = document.getElementById('oppCostScrubber');
    const scrubberVal = document.getElementById('oppScrubberVal');
    const scrubberExplanation = document.getElementById('oppScrubberExplanation');

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

    // Update Story Buckets
    const bNeedsVal = document.getElementById('bucketNeedsVal');
    const bNeedsBar = document.getElementById('bucketNeedsBar');
    const bDebtVal = document.getElementById('bucketDebtVal');
    const bDebtBar = document.getElementById('bucketDebtBar');
    const bWantsVal = document.getElementById('bucketWantsVal');
    const bWantsBar = document.getElementById('bucketWantsBar');
    const bInvestVal = document.getElementById('bucketInvestVal');
    const bInvestBar = document.getElementById('bucketInvestBar');

    if (bNeedsVal) bNeedsVal.textContent = `${formatINR(needs)} (${needsPct}%)`;
    if (bNeedsBar) bNeedsBar.style.width = `${Math.min(100, needsPct)}%`;

    if (bDebtVal) bDebtVal.textContent = `${formatINR(debtServicing)} (${debtPct}%)`;
    if (bDebtBar) bDebtBar.style.width = `${Math.min(100, debtPct)}%`;

    if (bWantsVal) bWantsVal.textContent = `${formatINR(wants)} (${wantsPct}%)`;
    if (bWantsBar) bWantsBar.style.width = `${Math.min(100, wantsPct)}%`;

    if (bInvestVal) bInvestVal.textContent = `${formatINR(investments)} (${investPct}%)`;
    if (bInvestBar) bInvestBar.style.width = `${Math.min(100, investPct)}%`;

    // Draw Donut
    const segments = [
      { label: 'Survival Needs', value: needs, color: '#38bdf8' },
      { label: 'Debt / EMIs', value: debtServicing, color: '#ef4444' },
      { label: 'Joy & Lifestyle', value: wants, color: '#f59e0b' },
      { label: 'Future Freedom', value: investments, color: '#10b981' }
    ];

    drawDonutChart(canvas, segments, {
      title: formatINR(salary),
      subtitle: 'Monthly In-Hand'
    });

    // Budget Diagnosis Callout
    const diagnosis = document.getElementById('budgetDiagnosisText');
    if (diagnosis) {
      if (debtPct > 40) {
        diagnosis.innerHTML = `<div class="notion-callout-icon">⚠️</div><div class="notion-callout-content"><div class="notion-callout-title">Heavy Debt Load (${debtPct}% of income)</div><div class="notion-callout-body">RBI alerts indicate that when EMIs exceed 35-40%, families face severe stress during emergencies. Prepay high-cost personal loans before expanding lifestyle spending.</div></div>`;
      } else if (investPct < 20) {
        diagnosis.innerHTML = `<div class="notion-callout-icon">⚡</div><div class="notion-callout-content"><div class="notion-callout-title">Low Savings Velocity (${investPct}% to freedom)</div><div class="notion-callout-body">In India, healthcare inflates at 12% and education at 10%. Boosting your equity SIP to at least 25% creates a durable shield for your future.</div></div>`;
      } else {
        diagnosis.innerHTML = `<div class="notion-callout-icon">✨</div><div class="notion-callout-content"><div class="notion-callout-title">Exceptional Financial Fitness!</div><div class="notion-callout-body">You dedicate <strong>${investPct}%</strong> directly to future freedom while containing debt at a safe <strong>${debtPct}%</strong>. Your wealth engine is humming smoothly.</div></div>`;
      }
    }
  }

  /* -------------------------------------------------------------
     6. TOOL 4: SIGNATURE INFLATION SIMULATOR
     ------------------------------------------------------------- */
  bindInflationTool() {
    const itemNameInput = document.getElementById('simItemName');
    const priceInput = document.getElementById('simCurrentPrice');
    const yearSlider = document.getElementById('simYearSlider');
    const rateSlider = document.getElementById('simRateSlider');

    const update = () => this.renderInflationTool(profileManager.getVitals());

    // Input & Slider listeners
    [itemNameInput, priceInput, yearSlider, rateSlider].forEach(el => {
      if (el) {
        el.addEventListener('input', update);
        el.addEventListener('change', update);
      }
    });

    // Quick steppers for current price
    document.querySelectorAll('[data-sim-step]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const step = parseInt(e.currentTarget.getAttribute('data-sim-step'), 10) || 0;
        const currentVal = parseINR(priceInput?.value) || 50000;
        const nextVal = Math.max(100, currentVal + step);
        if (priceInput) priceInput.value = nextVal;
        update();
      });
    });

    // Quick Target Year Pills (2031, 2036, 2041, 2046)
    document.querySelectorAll('[data-sim-year]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const yr = parseInt(e.currentTarget.getAttribute('data-sim-year'), 10);
        if (yearSlider && yr) yearSlider.value = yr;
        document.querySelectorAll('[data-sim-year]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        update();
      });
    });

    // Sector Rate Presets
    document.querySelectorAll('[data-sim-rate]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const r = parseFloat(e.currentTarget.getAttribute('data-sim-rate'));
        if (rateSlider && r) rateSlider.value = r;
        document.querySelectorAll('[data-sim-rate]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        update();
      });
    });

    // Spending Shelf Chips (House, Car, Smartphone, Milk, Groceries, Education, Healthcare, Travel, Gold, Electronics, etc.)
    document.querySelectorAll('.spending-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const itemId = e.currentTarget.getAttribute('data-item-id');
        const item = INFLATION_ITEMS.find(it => it.id === itemId);
        if (!item) return;

        document.querySelectorAll('.spending-chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');

        if (itemNameInput) itemNameInput.value = item.name;
        if (priceInput) priceInput.value = item.defaultPrice;
        if (rateSlider) rateSlider.value = item.defaultRate;

        // Sync active state on presets if matches
        document.querySelectorAll('[data-sim-rate]').forEach(b => {
          const btnRate = parseFloat(b.getAttribute('data-sim-rate'));
          b.classList.toggle('active', Math.abs(btnRate - item.defaultRate) < 0.05);
        });

        update();
      });
    });
  }

  renderInflationTool(vitals) {
    const itemName = document.getElementById('simItemName')?.value?.trim() || "₹50k Benchmark Basket";
    const currentPrice = parseINR(document.getElementById('simCurrentPrice')?.value) || 50000;
    const targetYear = parseInt(document.getElementById('simYearSlider')?.value, 10) || 2036;
    const inflationRate = parseFloat(document.getElementById('simRateSlider')?.value) || 6.0;
    const baseYear = 2026;

    // Update Slider text labels
    const lblYear = document.getElementById('lblSimYear');
    if (lblYear) lblYear.textContent = `${targetYear} (in ${targetYear - baseYear} yrs)`;

    const lblRate = document.getElementById('lblSimRate');
    if (lblRate) lblRate.textContent = `${inflationRate.toFixed(1)}%`;

    const heroRateTag = document.getElementById('simHeroRateTag');
    if (heroRateTag) heroRateTag.textContent = `${inflationRate.toFixed(1)}% p.a.`;

    // Sync Year pills active state
    document.querySelectorAll('[data-sim-year]').forEach(btn => {
      const yr = parseInt(btn.getAttribute('data-sim-year'), 10);
      btn.classList.toggle('active', yr === targetYear);
    });

    // Compute simulation
    const sim = simulateInflation({
      currentPrice,
      inflationRate,
      targetYear,
      baseYear,
      itemName
    });

    // Update Hero Card elements
    const heroQuestionEl = document.getElementById('simHeroQuestion');
    const heroResultEl = document.getElementById('simHeroResult');
    const heroStoryEl = document.getElementById('simHeroStory');
    const lockerWarningEl = document.getElementById('simLockerWarning');

    if (heroQuestionEl) heroQuestionEl.textContent = sim.questionPrompt;
    if (heroResultEl) heroResultEl.textContent = sim.headlineResult;
    if (heroStoryEl) heroStoryEl.textContent = sim.extraMoneyStory;
    if (lockerWarningEl) lockerWarningEl.textContent = sim.lockerWarning;

    // Render Milestone Cards (Today, 2031, 2036, 2041, 2046)
    const milestoneGrid = document.getElementById('simMilestoneGrid');
    if (milestoneGrid && sim.milestones) {
      milestoneGrid.innerHTML = sim.milestones.map(m => {
        const isTarget = m.year === targetYear;
        const diffText = m.diff > 0 ? `+${formatINR(m.diff)}` : 'Baseline';
        return `
          <div class="milestone-card ${isTarget ? 'is-target' : ''}">
            ${isTarget ? '<span class="milestone-target-flag">Target Year</span>' : ''}
            <span class="milestone-year-badge">${m.label}</span>
            <div class="milestone-price">${formatINR(m.price)}</div>
            <span class="milestone-multiplier">${m.multiplier}x · ${diffText}</span>
          </div>
        `;
      }).join('');
    }

    // Render multi-year curve chart
    const canvas = document.getElementById('inflationCanvas');
    if (canvas) {
      drawInflationCurve(canvas, sim.milestones, targetYear);
    }

    // Also update India vs Me Personal Duel
    this.renderIndiaVsMeTool();
  }

  /* -------------------------------------------------------------
     6B. INDIA VS ME: PERSONAL LIFESTYLE INFLATION DUEL
     ------------------------------------------------------------- */
  bindIndiaVsMeTool() {
    this.duelWeights = { housing: 30, food: 30, healthcare: 10, education: 10, lifestyle: 20 };
    this.duelActivePreset = 'urban_pro';

    // Persona preset buttons
    document.querySelectorAll('[data-duel-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const presetId = e.currentTarget.getAttribute('data-duel-preset');
        const preset = INDIA_VS_ME_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        this.duelActivePreset = presetId;
        this.duelWeights = { ...preset.weights };

        document.querySelectorAll('[data-duel-preset]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.renderIndiaVsMeTool();
      });
    });

    this.renderIndiaVsMeTool();
  }

  renderIndiaVsMeTool() {
    const vitals = profileManager.getVitals();
    const monthlySpend = vitals.expenses || 50000;

    const result = calculateIndiaVsMeInflation({
      weights: this.duelWeights || { housing: 30, food: 30, healthcare: 10, education: 10, lifestyle: 20 },
      nationalCPI: 6.1,
      monthlySpend
    });

    // Update rates
    const indiaRateEl = document.getElementById('duelIndiaRate');
    const userRateEl = document.getElementById('duelUserRate');
    const diffBadgeEl = document.getElementById('duelDiffBadge');
    const diffValEl = document.getElementById('duelDiffVal');
    const diffSubEl = document.getElementById('duelDiffSub');
    const explTitleEl = document.getElementById('duelExplanationTitle');
    const explBodyEl = document.getElementById('duelExplanationBody');

    if (indiaRateEl) indiaRateEl.textContent = `${result.nationalCPI.toFixed(1)}%`;
    if (userRateEl) userRateEl.textContent = `${result.userRate.toFixed(1)}%`;

    if (diffValEl) {
      diffValEl.textContent = `${result.diffFormatted} percentage points`;
    }

    if (diffBadgeEl) {
      diffBadgeEl.classList.toggle('frugal', result.isLower);
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

    // Render category sliders
    const gridEl = document.getElementById('duelWeightsGrid');
    if (gridEl && !gridEl.dataset.initialized) {
      gridEl.dataset.initialized = 'true';
      gridEl.innerHTML = INDIA_VS_ME_CATEGORIES.map(cat => {
        const currentWeight = (this.duelWeights && this.duelWeights[cat.id] !== undefined) ? this.duelWeights[cat.id] : cat.defaultWeight;
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
      }).join('');

      // Add slider input listeners
      gridEl.querySelectorAll('[data-cat-slider]').forEach(slider => {
        slider.addEventListener('input', (e) => {
          const catId = e.currentTarget.getAttribute('data-cat-slider');
          const val = parseInt(e.currentTarget.value, 10) || 0;
          if (!this.duelWeights) this.duelWeights = {};
          this.duelWeights[catId] = val;
          const pctLabel = document.getElementById(`duelPct_${catId}`);
          if (pctLabel) pctLabel.textContent = `${val}%`;

          // Clear active persona preset if manually adjusted
          document.querySelectorAll('[data-duel-preset]').forEach(b => b.classList.remove('active'));

          this.renderIndiaVsMeTool();
        });
      });
    } else if (gridEl) {
      // Sync slider positions if preset changed
      INDIA_VS_ME_CATEGORIES.forEach(cat => {
        const slider = gridEl.querySelector(`[data-cat-slider="${cat.id}"]`);
        const pctLabel = document.getElementById(`duelPct_${cat.id}`);
        const currentWeight = (this.duelWeights && this.duelWeights[cat.id] !== undefined) ? this.duelWeights[cat.id] : cat.defaultWeight;
        if (slider) slider.value = currentWeight;
        if (pctLabel) pctLabel.textContent = `${currentWeight}%`;
      });
    }
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
        recBanner.innerHTML = `🏆 <strong>New Tax Regime Wins!</strong> You save <strong>${formatINR(result.taxSavings)}</strong> in tax per year with zero hassle of collecting investment bills.`;
      } else {
        recBanner.className = 'tax-rec-banner old-wins';
        recBanner.innerHTML = `🏆 <strong>Old Tax Regime Wins!</strong> Your deductions (80C, HRA, Home Loan) save you <strong>${formatINR(result.taxSavings)}</strong> more than the New Regime.`;
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

    document.getElementById('loanSavedInterest').textContent = formatINR(result.interestSaved, true);
    document.getElementById('loanYearsSaved').textContent = `${result.yearsSaved} Years sooner`;
    document.getElementById('sipWealthAccumulated').textContent = formatINR(result.sipFutureValue, true);
    document.getElementById('sipNetProfit').textContent = `+${formatINR(result.sipGains, true)} in pure wealth`;

    const verdict = document.getElementById('loanVsSipVerdict');
    if (verdict) {
      if (result.netAdvantage > 0) {
        verdict.innerHTML = `<div class="notion-callout-icon">🚀</div><div class="notion-callout-content"><div class="notion-callout-title">The Wealth-Creator Path Wins</div><div class="notion-callout-body">Investing the extra <strong>${formatINR(extraMonthlyCash)}/mo</strong> in a Nifty 50 Index SIP beats prepaying your ${interestRate}% loan by <strong>${formatINR(result.netAdvantage)}</strong> over ${remainingTenureYears} years.<br><span class="text-subtle">Tip: If emotional peace of mind without debt is your #1 priority, prepaying guarantees a risk-free ${interestRate}% return.</span></div></div>`;
      } else {
        verdict.innerHTML = `<div class="notion-callout-icon">🛡️</div><div class="notion-callout-content"><div class="notion-callout-title">The Debt Prepayment Path Wins</div><div class="notion-callout-body">Prepaying your loan saves <strong>${formatINR(result.interestSaved)}</strong> in guaranteed interest and clears your liability ${result.yearsSaved} years earlier!</div></div>`;
      }
    }

    const canvas = document.getElementById('loanVsSipCanvas');
    drawComparisonBarChart(canvas, [
      { label: 'Interest Saved', value: result.interestSaved, formattedValue: formatINR(result.interestSaved), color: '#38bdf8' },
      { label: 'SIP Corpus', value: result.sipFutureValue, formattedValue: formatINR(result.sipFutureValue), color: '#10b981' }
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

    // Chronological Life Bar
    const spentPct = Math.min(100, Math.round((age / 85) * 100));
    const retirePct = Math.min(100, Math.round((targetRetirementAge / 85) * 100));
    const earningWidth = Math.max(0, retirePct - spentPct);

    const lifeSpentEl = document.getElementById('lifeBarSpent');
    const lifeEarningEl = document.getElementById('lifeBarEarning');
    const lifeCurrentEl = document.getElementById('lifeChronCurrent');
    const lifeRetireEl = document.getElementById('lifeChronRetire');
    const lifeStoryEl = document.getElementById('lifeTimelineStory');

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

    // Rule of (100 - Age) for Asset Allocation
    const equityAllocation = Math.max(20, Math.min(80, 100 - age));
    const debtAllocation = 100 - equityAllocation;

    document.getElementById('retEquityPct').textContent = `${equityAllocation}%`;
    document.getElementById('retDebtPct').textContent = `${debtAllocation}%`;
    document.getElementById('retEquityBar').style.width = `${equityAllocation}%`;
    document.getElementById('retDebtBar').style.width = `${debtAllocation}%`;

    // Recommended Insurance Covers
    const recommendedTermCover = vitals.salary * 12 * 20; // 20x annual income
    document.getElementById('recTermCover').textContent = formatINR(recommendedTermCover, true);

    const recommendedHealthCover = age < 35 ? "₹10 Lakhs + Super Top-up" : "₹25 Lakhs + Super Top-up";
    document.getElementById('recHealthCover').textContent = recommendedHealthCover;

    // Target Retirement Corpus at 5.5% inflation
    const inflatedMonthly = desiredMonthlyInRetirement * Math.pow(1.055, yearsToRetire);
    const requiredCorpus = Math.round(inflatedMonthly * 12 * 25);
    document.getElementById('retTargetCorpus').textContent = formatINR(requiredCorpus, true);

    // Monthly SIP required at 12% equity CAGR
    const r = 0.12 / 12;
    const n = yearsToRetire * 12;
    const monthlySIPNeeded = Math.round(requiredCorpus / (((Math.pow(1 + r, n) - 1) / r) * (1 + r)));
    document.getElementById('retMonthlySipNeeded').textContent = `${formatINR(monthlySIPNeeded)}/month`;
  }

  /* -------------------------------------------------------------
     10. TOOL 7: FINANCE ENCYCLOPEDIA & ZERO-KNOWLEDGE DICTIONARY
     ------------------------------------------------------------- */
  bindDictionaryTool() {
    this.dictFilter = 'all';
    this.dictSearchQuery = '';

    const searchInput = document.getElementById('dictSearchInput');
    const searchClear = document.getElementById('dictSearchClear');
    const categoryTrack = document.getElementById('dictCategoryTrack');
    const resetBtn = document.getElementById('btnResetDictSearch');

    // Render category buttons
    if (categoryTrack && !categoryTrack.dataset.initialized) {
      categoryTrack.dataset.initialized = 'true';
      categoryTrack.innerHTML = DICTIONARY_CATEGORIES.map(cat => `
        <button type="button" class="dict-cat-btn ${cat.id === 'all' ? 'active' : ''}" data-dict-cat="${cat.id}">
          <span>${cat.emoji}</span>
          <span>${cat.label}</span>
        </button>
      `).join('');

      categoryTrack.querySelectorAll('[data-dict-cat]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const catId = e.currentTarget.getAttribute('data-dict-cat');
          this.dictFilter = catId;
          categoryTrack.querySelectorAll('[data-dict-cat]').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.renderDictionaryTool();
        });
      });
    }

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.dictSearchQuery = e.target.value.trim().toLowerCase();
        if (searchClear) {
          searchClear.style.display = this.dictSearchQuery.length > 0 ? 'block' : 'none';
        }
        this.renderDictionaryTool();
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.dictSearchQuery = '';
        searchClear.style.display = 'none';
        this.renderDictionaryTool();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.dictSearchQuery = '';
        if (searchClear) searchClear.style.display = 'none';
        this.dictFilter = 'all';
        if (categoryTrack) {
          categoryTrack.querySelectorAll('[data-dict-cat]').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-dict-cat') === 'all');
          });
        }
        this.renderDictionaryTool();
      });
    }

    this.renderDictionaryTool();
  }

  renderDictionaryTool() {
    const gridEl = document.getElementById('dictCardsGrid');
    const emptyEl = document.getElementById('dictEmptyState');
    const countEl = document.getElementById('dictCountLabel');
    if (!gridEl) return;

    const filtered = FINANCE_DICTIONARY.filter(item => {
      // Category check
      const matchesCat = this.dictFilter === 'all' || item.category === this.dictFilter;
      if (!matchesCat) return false;

      // Search query check
      if (!this.dictSearchQuery) return true;
      const q = this.dictSearchQuery;
      return (
        item.term.toLowerCase().includes(q) ||
        item.expansion.toLowerCase().includes(q) ||
        item.eli5.toLowerCase().includes(q) ||
        item.analogy.toLowerCase().includes(q) ||
        (item.example && item.example.toLowerCase().includes(q))
      );
    });

    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} of ${FINANCE_DICTIONARY.length} terms`;
    }

    if (filtered.length === 0) {
      gridEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    gridEl.innerHTML = filtered.map(item => `
      <article class="dict-card" data-dict-id="${item.id}">
        <div>
          <div class="dict-card-top">
            <div class="dict-card-title-group">
              <h3 class="dict-card-term">${item.term}</h3>
              <div class="dict-card-expansion">${item.expansion}</div>
            </div>
            <div class="dict-card-badges">
              <span class="dict-badge-cat">${item.categoryLabel}</span>
              <span class="dict-badge-level">🟢 ${item.level}</span>
            </div>
          </div>

          <div class="dict-card-eli5" style="margin-top: 0.85rem;">
            ${item.eli5}
          </div>

          <div class="dict-box-analogy" style="margin-top: 0.75rem;">
            <strong>🍕 In Simple Words (Analogy)</strong>
            ${item.analogy}
          </div>

          ${item.example ? `
            <div class="dict-box-example" style="margin-top: 0.5rem;">
              <strong>₹ Real Indian Example</strong>
              ${item.example}
            </div>
          ` : ''}

          ${item.trapWarning ? `
            <div class="dict-box-trap" style="margin-top: 0.5rem;">
              <strong>⚠️ Watch Out (Trap / Catch)</strong>
              ${item.trapWarning}
            </div>
          ` : ''}
        </div>

        <div class="dict-card-footer">
          <span style="font-size: 0.72rem; color: var(--text-muted);">Used in Artha:</span>
          <button type="button" class="dict-tool-link-btn" data-jump-tool="${item.usedInTool}">
            <span>${item.usedInToolLabel}</span>
            <span>→</span>
          </button>
        </div>
      </article>
    `).join('');

    // Attach jump-tool click handlers
    gridEl.querySelectorAll('[data-jump-tool]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTool = e.currentTarget.getAttribute('data-jump-tool');
        if (targetTool) {
          this.switchTab(targetTool);
        }
      });
    });
  }

  /* -------------------------------------------------------------
     11. EXPORT / PRINT REPORT
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

// Robust bootstrap whether script loads before, during, or after DOMContentLoaded
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initArtha);
} else {
  // DOM is already parsed (interactive or complete)
  initArtha();
}
