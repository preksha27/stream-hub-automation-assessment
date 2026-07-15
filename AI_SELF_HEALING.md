# AI Self-Healing Locators — Strategy Document

## Overview

This document describes the approach to detect, diagnose, and self-heal brittle locators
in the Playwright test suite using AI-assisted tooling.

---

## Intentionally Broken Locators in This Suite

The following locators were added as broken examples for this exercise:

| File | Line | Broken Locator | Why It's Brittle |
|------|------|----------------|-----------------|
| `pages/EmiCalculatorPage.js` | ~55 | `inputs[999]` | Hardcoded index 999 — no such element |
| `step-definitions/emi.steps.js` | slider calls | `sliders.nth(0/1/2)` | Positional — breaks if DOM order changes |
| `pages/EmiCalculatorPage.js` | `#piechart` | ID-based locator | IDs can change across deployments |
| `pages/EmiCalculatorPage.js` | `rect[class*="bar"]` | Class substring match | Dynamic class names in bundled CSS |
| `pages/EmiCalculatorPage.js` | `.amountToPay` | Class-based text extraction | Class names change with UI redesigns |

---

## Detection Phase

### How AI Detects Broken Locators

1. **Run tests and capture failure stack traces** — Playwright errors include the failing selector.
2. **Pass the failure + page HTML snapshot to an LLM** with the prompt:

```
Given this Playwright error:
  {error_message}

And this relevant HTML section:
  {html_snippet}

Identify the broken locator and suggest a resilient replacement using
role, label, text, or data-testid attributes.
```

3. **Parse the AI response** to extract the suggested replacement selector.

---

## Prompt Approach

### Prompt Template Used

```
You are a Playwright locator expert. A test is failing with this error:

ERROR: {playwright_error}

The relevant DOM section is:
{dom_html}

The current (broken) locator is: {broken_selector}

Task:
1. Explain why this locator is brittle.
2. Suggest the most resilient replacement locator using this priority:
   - getByRole() with accessible name
   - getByLabel()
   - getByText()
   - data-testid attribute
   - CSS class only as last resort
3. Provide the exact Playwright code for the fix.
```

---

## Validation Before Applying Fix

Before patching the locator in code:

1. **Dry-run validation** — Evaluate the suggested locator in the browser console:
   ```js
   document.querySelector('[aria-label="Loan Amount"]')
   ```
2. **Cross-scenario check** — Verify the new locator works across all test scenarios
   (Home Loan tab AND Personal Loan tab).
3. **Negative test** — Confirm the locator returns null when the element is absent
   (e.g., on a different tab).
4. Only after all three pass, apply the patch via `str_replace` in the page object.

---

## Working POC (Bonus)

A Node.js script (`scripts/self_heal.js`) can be run after a test failure:

```js
// Pseudocode for the POC
const { chromium } = require('playwright');
const { callAnthropicAPI } = require('./ai_client');

async function selfHeal(brokenSelector, errorMessage) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(process.env.BASE_URL);

  // Capture DOM snapshot around the failure area
  const domSnapshot = await page.evaluate(() => document.body.innerHTML);

  // Ask AI for a fix
  const fix = await callAnthropicAPI({
    error: errorMessage,
    selector: brokenSelector,
    dom: domSnapshot.slice(0, 3000), // truncate for token limits
  });

  console.log('Suggested fix:', fix.replacement);
  console.log('Reason:', fix.explanation);

  // Validate the fix
  const el = await page.locator(fix.replacement).count();
  if (el > 0) {
    console.log('✅ Validated: element found with new locator');
  } else {
    console.log('❌ Fix not validated — element not found');
  }

  await browser.close();
}
```

---

## Summary

| Phase | Approach |
|-------|----------|
| Detection | Playwright error + DOM snapshot sent to LLM |
| Diagnosis | AI explains brittleness and root cause |
| Fix | AI suggests role/label/text-based replacement |
| Validation | Dry-run in browser before code patch |
| Apply | Automated `str_replace` in page object files |
