const { setWorldConstructor, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');

setDefaultTimeout(60 * 1000); // 60 seconds per step
const { chromium } = require('playwright');
const config = require('./env');

class CustomWorld {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.config = config;
  }
}

setWorldConstructor(CustomWorld);

Before(async function () {
  this.browser = await chromium.launch({ headless: this.config.headless });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
  this.page.setDefaultTimeout(this.config.timeout);
});

After(async function () {
  if (this.browser) {
    await this.browser.close();
  }
});
