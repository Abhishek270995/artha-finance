/**
 * Canvas Chart Engine for Artha
 * High-performance, Retina-crisp Canvas visualizer for budgets,
 * tax comparisons, and inflation erosion curves.
 * Adapts dynamically to light and dark theme modes.
 */

function isLightMode() {
  return document.documentElement.getAttribute('data-theme') === 'light';
}

export function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, width: rect.width, height: rect.height };
}

/**
 * Draws an interactive, glowing Donut Chart
 */
export function drawDonutChart(canvas, segments, centerText = {}) {
  if (!canvas) return;
  const { ctx, width, height } = setupCanvas(canvas);
  const isLight = isLightMode();
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.40;
  const innerRadius = radius * 0.65;

  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  if (total === 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
    ctx.lineWidth = radius - innerRadius;
    ctx.stroke();
    return;
  }

  let currentAngle = -Math.PI / 2;

  segments.forEach(segment => {
    if (segment.value <= 0) return;
    const sliceAngle = (segment.value / total) * (Math.PI * 2);

    ctx.beginPath();
    ctx.arc(centerX, centerY, (radius + innerRadius) / 2, currentAngle, currentAngle + sliceAngle);
    ctx.strokeStyle = segment.color;
    ctx.lineWidth = radius - innerRadius - 2;
    ctx.lineCap = 'butt';
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  // Center Text
  if (centerText.title || centerText.subtitle) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (centerText.title) {
      ctx.font = '700 20px "Outfit", sans-serif';
      ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
      ctx.fillText(centerText.title, centerX, centerY - 8);
    }
    if (centerText.subtitle) {
      ctx.font = '500 12px "Inter", sans-serif';
      ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
      ctx.fillText(centerText.subtitle, centerX, centerY + 16);
    }
  }
}

/**
 * Draws a clean comparative Bar Chart (e.g. Tax Comparison or Loan vs SIP)
 */
export function drawComparisonBarChart(canvas, items) {
  if (!canvas || !items || items.length === 0) return;
  const { ctx, width, height } = setupCanvas(canvas);
  const isLight = isLightMode();

  const padding = { top: 35, right: 25, bottom: 45, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...items.map(i => i.value), 1000);
  const barWidth = Math.min(70, (chartWidth / items.length) * 0.55);
  const groupSpacing = chartWidth / items.length;

  // Grid lines
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  items.forEach((item, index) => {
    const x = padding.left + groupSpacing * index + (groupSpacing - barWidth) / 2;
    const barHeight = Math.max(4, (item.value / maxValue) * chartHeight);
    const y = padding.top + chartHeight - barHeight;

    // Gradient bar
    const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
    grad.addColorStop(0, item.color || '#06b6d4');
    grad.addColorStop(1, (item.color || '#06b6d4') + '88');

    ctx.fillStyle = grad;
    // Rounded top bar
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
    ctx.lineTo(x + barWidth, y + barHeight);
    ctx.lineTo(x, y + barHeight);
    ctx.closePath();
    ctx.fill();

    // Value label above bar
    ctx.textAlign = 'center';
    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillStyle = isLight ? '#0f172a' : '#e2e8f0';
    ctx.fillText(item.formattedValue || `₹${Math.round(item.value)}`, x + barWidth / 2, y - 8);

    // Label below bar
    ctx.font = '500 12px "Inter", sans-serif';
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.fillText(item.label, x + barWidth / 2, padding.top + chartHeight + 20);
  });
}

/**
 * Draws an Inflation Erosion / Growth line chart
 */
export function drawInflationCurve(canvas, progression) {
  if (!canvas || !progression || progression.length === 0) return;
  const { ctx, width, height } = setupCanvas(canvas);
  const isLight = isLightMode();

  const padding = { top: 30, right: 35, bottom: 40, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxExpense = Math.max(...progression.map(p => p.expense));
  const minExpense = Math.min(...progression.map(p => p.expense));
  const valRange = Math.max(1, maxExpense - minExpense * 0.8);

  // Background grid
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // Draw Area Gradient
  ctx.beginPath();
  progression.forEach((pt, i) => {
    const x = padding.left + (i / (progression.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((pt.expense - minExpense * 0.8) / valRange) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  const lastX = padding.left + chartWidth;
  ctx.lineTo(lastX, padding.top + chartHeight);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.closePath();

  const areaGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
  areaGrad.addColorStop(0, isLight ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.28)');
  areaGrad.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
  ctx.fillStyle = areaGrad;
  ctx.fill();

  // Draw Line
  ctx.beginPath();
  progression.forEach((pt, i) => {
    const x = padding.left + (i / (progression.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((pt.expense - minExpense * 0.8) / valRange) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw Points & Labels
  progression.forEach((pt, i) => {
    const x = padding.left + (i / (progression.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((pt.expense - minExpense * 0.8) / valRange) * chartHeight;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = isLight ? '#ffffff' : '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Axis Labels
    ctx.textAlign = 'center';
    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.fillText(`Yr ${pt.year}`, x, padding.top + chartHeight + 18);
  });
}
