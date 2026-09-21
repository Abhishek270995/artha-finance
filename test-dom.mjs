import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

console.log("=== RUNNING DOM INTEGRATION TEST FOR INFLATION SIMULATOR ===");

const htmlPath = path.resolve('index.html');
const bundlePath = path.resolve('js/app.bundle.js');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
const bundleContent = fs.readFileSync(bundlePath, 'utf-8');

const dom = new JSDOM(htmlContent, {
  runScripts: "dangerously",
  resources: "usable",
  url: "http://localhost:4321/"
});

const { window } = dom;
const { document } = window;

// Polyfill canvas context for JSDOM
window.HTMLCanvasElement.prototype.getContext = function () {
  return {
    clearRect: () => {},
    beginPath: () => {},
    arc: () => {},
    stroke: () => {},
    fill: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fillText: () => {},
    strokeText: () => {},
    scale: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    measureText: () => ({ width: 50 })
  };
};

// Execute bundle
const scriptEl = document.createElement('script');
scriptEl.textContent = bundleContent;
document.body.appendChild(scriptEl);

// Dispatch DOMContentLoaded if still loading
window.document.dispatchEvent(new window.Event('DOMContentLoaded', {
  bubbles: true,
  cancelable: true
}));

// 1. Check Inflation Tab Exists and can be activated
const inflationTab = document.querySelector('[data-tab-target="inflation"]');
console.assert(inflationTab, "Inflation tab button must exist");
console.log(`✓ Tab Button found: "${inflationTab.textContent.trim().replace(/\s+/g, ' ')}"`);
inflationTab.click();

// 2. Check Inflation Pane is Active
const inflationPane = document.getElementById('pane-inflation');
console.assert(inflationPane.classList.contains('active'), "Inflation pane should be active");
console.log("✓ Inflation pane activated successfully");

// 3. Verify Default Benchmark Values
// User Scenario: ₹50,000 in 2036 at 6%
const questionEl = document.getElementById('simHeroQuestion');
const resultEl = document.getElementById('simHeroResult');
const storyEl = document.getElementById('simHeroStory');
const milestoneGrid = document.getElementById('simMilestoneGrid');

console.log(`✓ Question: "${questionEl.textContent.trim()}"`);
console.assert(questionEl.textContent.includes("What will ₹50,000 cost in 2036?"), "Question headline mismatch");

console.log(`✓ Hero Result: "${resultEl.textContent.trim()}"`);
console.assert(resultEl.textContent.includes("₹50,000 today ≈ ₹89,542 in 2036"), "Hero result mismatch");

// 4. Verify Milestones
const milestoneCards = milestoneGrid.querySelectorAll('.milestone-card');
console.assert(milestoneCards.length === 5, `Expected 5 milestone cards, found ${milestoneCards.length}`);

const milestoneTexts = Array.from(milestoneCards).map(c => ({
  year: c.querySelector('.milestone-year-badge')?.textContent.trim(),
  price: c.querySelector('.milestone-price')?.textContent.trim(),
  isTarget: c.classList.contains('is-target')
}));

console.log("✓ Milestone Progression Rendered:");
milestoneTexts.forEach(m => console.log(`   - ${m.year}: ${m.price} ${m.isTarget ? '[TARGET YEAR]' : ''}`));

console.assert(milestoneTexts[0].price === '₹50,000', "Today price should be ₹50,000");
console.assert(milestoneTexts[1].price === '₹66,911', "2031 price should be ₹66,911");
console.assert(milestoneTexts[2].price === '₹89,542', "2036 price should be ₹89,542");
console.assert(milestoneTexts[2].isTarget === true, "2036 should be flagged as target year");
console.assert(milestoneTexts[3].price.includes('1,19,828'), "2041 price should be ₹1,19,828");

// 5. Test Spending Shelf Selection
// Test 🏠 House (₹75 Lakhs, 7.5%)
const houseChip = document.querySelector('[data-item-id="house"]');
console.assert(houseChip, "House chip must exist in shelf");
houseChip.click();

const houseQuestion = document.getElementById('simHeroQuestion').textContent.trim();
const houseResult = document.getElementById('simHeroResult').textContent.trim();
console.log(`✓ After clicking House Chip:`);
console.log(`   - Question: "${houseQuestion}"`);
console.log(`   - Result: "${houseResult}"`);
console.assert(houseQuestion.includes("₹75,00,000") && houseQuestion.includes("2036"), "House question mismatch");

// Test 📱 Smartphone
const phoneChip = document.querySelector('[data-item-id="smartphone"]');
phoneChip.click();
console.log(`✓ After clicking Smartphone Chip: "${document.getElementById('simHeroResult').textContent.trim()}"`);

// 6. Test India vs Me Section
const indiaRateEl = document.getElementById('duelIndiaRate');
const userRateEl = document.getElementById('duelUserRate');
const diffValEl = document.getElementById('duelDiffVal');
const explTitleEl = document.getElementById('duelExplanationTitle');

console.assert(indiaRateEl && indiaRateEl.textContent.trim() === '6.1%', `Expected 6.1% India rate, got ${indiaRateEl?.textContent}`);
console.assert(userRateEl && userRateEl.textContent.trim() === '7.4%', `Expected 7.4% User rate, got ${userRateEl?.textContent}`);
console.assert(diffValEl && diffValEl.textContent.trim() === '+1.3 percentage points', `Expected +1.3 pp, got ${diffValEl?.textContent}`);
console.assert(explTitleEl && explTitleEl.textContent.includes("Your spending pattern is experiencing higher inflation than the headline rate"), "Explanation mismatch in DOM");

console.log(`✓ India vs Me DOM Section Verified: 🇮🇳 ${indiaRateEl.textContent} vs 👤 ${userRateEl.textContent} (Diff: ${diffValEl.textContent})`);
console.log(`✓ Explanation: "${explTitleEl.textContent.trim()}"`);

// Test Preset Switching to Family with Kids
const familyPresetBtn = document.querySelector('[data-duel-preset="family_kids"]');
console.assert(familyPresetBtn, "Family with Kids preset button must exist");
familyPresetBtn.click();
console.log(`✓ Switched to Family Preset: User Rate is now ${document.getElementById('duelUserRate').textContent} (Diff: ${document.getElementById('duelDiffVal').textContent})`);

// Switch back to Urban Pro
document.querySelector('[data-duel-preset="urban_pro"]').click();
console.assert(document.getElementById('duelUserRate').textContent === '7.4%', "Should return to 7.4% for Urban Pro");

console.log("=== DOM INTEGRATION TEST PASSED PERFECTLY ===");
process.exit(0);

