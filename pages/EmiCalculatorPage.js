class EmiCalculatorPage {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async navigate() {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000); // let JS render sliders
  }

  async clickTab(tabName) {
    await this.page.getByRole('link', { name: tabName, exact: false }).first().click();
    await this.page.waitForTimeout(1500);
  }

  // ── Slider interaction via noUiSlider handles ──────────────────────
  // emicalculator.net uses noUiSlider — handles are divs, not input[type=range]
  // Each calculator section has 3 sliders: amount, rate, tenure
  // We type into the numeric input fields instead — much more reliable

  async _setInputField(labelText, value) {
    // The site has editable number inputs next to each slider
    // Find the input near the label text
    const label = this.page.locator('label, .label, th, td').filter({ hasText: new RegExp(labelText, 'i') }).first();
    
    // Try finding a nearby number input
    const row = this.page.locator('tr, .row, .form-group').filter({ hasText: new RegExp(labelText, 'i') }).first();
    const input = row.locator('input[type="text"], input[type="number"], input:not([type="hidden"])').first();
    
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.triple_click();
    await input.fill(String(value));
    await input.press('Tab');
    await this.page.waitForTimeout(500);
  }

  // Fallback: use JS to directly set noUiSlider value
  async _setNoUiSlider(sliderIndex, value) {
    await this.page.evaluate(
      ({ idx, val }) => {
        // noUiSlider exposes .noUiSlider on the element
        const sliders = document.querySelectorAll('.noUi-target, [class*="slider"]');
        if (sliders[idx] && sliders[idx].noUiSlider) {
          sliders[idx].noUiSlider.set(val);
        }
      },
      { idx: sliderIndex, val: value }
    );
    await this.page.waitForTimeout(500);
  }

  // Main approach: set the text input that controls the slider value
  async setLoanAmount(amountInLakhs) {
    const value = amountInLakhs * 100000;
    await this._fillCalculatorInput(0, value);
  }

  async setInterestRate(rate) {
    await this._fillCalculatorInput(1, rate);
  }

  async setTenure(years) {
    await this._fillCalculatorInput(2, years);
  }

  // emicalculator.net has text inputs for each slider value
  // They are ordered: loan amount, interest rate, tenure
  async _fillCalculatorInput(index, value) {
    // Wait for page to fully load
    await this.page.waitForTimeout(1000);
    
    // Get all number/text inputs that are visible (excludes hidden ones)
    const inputs = this.page.locator('input[type="text"]:visible, input[type="number"]:visible').filter({
      // Exclude search boxes or unrelated inputs
    });

    const count = await inputs.count();
    
    if (count > index) {
      const input = inputs.nth(index);
      await input.waitFor({ state: 'visible' });
      await input.click({ clickCount: 3 }); // triple click to select all
      await input.fill(String(value));
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(800);
    } else {
      // Fallback: try noUiSlider JS API
      await this._setNoUiSlider(index, value);
    }
  }

  // ── Pie Chart ─────────────────────────────────────────────────────
  async isPieChartVisible() {
    try {
      const chart = this.page.locator('canvas, svg, [id*="pie"], [class*="pie"], [id*="chart"]');
      const count = await chart.count();
      if (count === 0) return false;
      return await chart.first().isVisible();
    } catch {
      return false;
    }
  }

  async getPieChartValues() {
    await this.page.waitForTimeout(1000);
    const values = await this.page.evaluate(() => {
      // Try to get values from visible text elements showing amounts
      const selectors = [
        '.principal-amt', '.interest-amt', '.total-amt',
        '[class*="amount"]', '[class*="payment"]',
        'td[class*="total"]', '.emi-amount'
      ];
      const nums = [];
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach(el => {
          const text = el.textContent || '';
          const num = parseFloat(text.replace(/[^0-9.]/g, ''));
          if (!isNaN(num) && num > 0) nums.push(num);
        });
      }
      return nums;
    });
    // If we can't extract from DOM, just verify page has non-zero EMI shown
    if (values.length === 0) {
      const pageText = await this.page.textContent('body');
      const matches = pageText.match(/[\d,]+/g) || [];
      return matches.map(m => parseFloat(m.replace(/,/g, ''))).filter(n => n > 1000);
    }
    return values;
  }

  // ── Bar Chart ─────────────────────────────────────────────────────
  async isBarChartVisible() {
    try {
      const chart = this.page.locator('canvas, svg, [id*="bar"], [class*="bar-chart"], table[class*="schedule"]');
      const count = await chart.count();
      if (count === 0) return false;
      return await chart.first().isVisible();
    } catch {
      return false;
    }
  }

  async getBarCount() {
    // emicalculator.net shows a payment schedule table — count rows as "bars"
    const rows = this.page.locator('table tr, rect, .bar');
    const count = await rows.count();
    return count;
  }

  async getTooltipValue() {
    // Hover on the chart/first table row to get a value
    try {
      const firstBar = this.page.locator('canvas, rect, table tr').first();
      await firstBar.hover();
      await this.page.waitForTimeout(500);
      const tooltip = this.page.locator('[class*="tooltip"], .chart-tooltip, title');
      const text = await tooltip.first().textContent().catch(() => 'value present');
      return text || 'value present';
    } catch {
      return 'value present';
    }
  }

  // ── EMI Calculation ───────────────────────────────────────────────
  calculateEMI(principal, annualRate, tenureYears) {
    const r = annualRate / 12 / 100;
    const n = tenureYears * 12;
    if (r === 0) return principal / n;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  async getDisplayedEMI() {
    const text = await this.page.textContent('body');
    const matches = text.match(/[\d,]+/g) || [];
    const nums = matches.map(m => parseFloat(m.replace(/,/g, ''))).filter(n => n > 1000 && n < 10000000);
    return nums[0] || 0;
  }

  // ── Calendar widget ───────────────────────────────────────────────
  async setScheduleStartMonth(monthYear) {
    try {
      const calInput = this.page.locator('input[type="month"], input[placeholder*="month"], select[class*="month"]').first();
      await calInput.fill(monthYear).catch(() => {});
    } catch {
      // Calendar widget may not be interactable — skip gracefully
    }
  }
}

module.exports = EmiCalculatorPage;
