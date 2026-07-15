// Environment configuration - no hardcoded URLs in test files
const config = {
  baseUrl: process.env.BASE_URL || 'https://emicalculator.net',
  apiBaseUrl: process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com',
  headless: process.env.HEADLESS !== 'false',
  timeout: parseInt(process.env.TIMEOUT || '30000'),
};

module.exports = config;
