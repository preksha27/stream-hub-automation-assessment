# Streamhub SDET Assessment

## Project Structure

```
streamhub-assessment/
├── features/               # Cucumber .feature files
│   └── emi_calculator.feature
├── step-definitions/       # Step implementations
│   └── emi.steps.js
├── pages/                  # Page Object Model
│   └── EmiCalculatorPage.js
├── tests/
│   ├── api/                # API boundary tests
│   │   └── api.test.js
│   └── sql/                # SQL queries with schemas
│       └── sql_queries.sql
├── config/
│   ├── env.js              # Environment config (no hardcoded URLs)
│   └── world.js            # Cucumber world + browser lifecycle
├── AI_SELF_HEALING.md      # AI locator self-healing strategy
└── README.md
```

## Setup

```bash
npm install
npx playwright install chromium
```

## Running Tests

```bash
# UI tests (Cucumber + Playwright)
npm run test:ui

# API boundary tests
npm run test:api

# All tests
npm test
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://emicalculator.net` | Application under test |
| `API_BASE_URL` | `https://jsonplaceholder.typicode.com` | API under test |
| `HEADLESS` | `true` | Run browser headless |
| `TIMEOUT` | `30000` | Default timeout (ms) |

## Test Coverage

### UI Tests
- ✅ TC1: EMI Pie Chart — Home Loan (2 scenarios: 25L@10%/10yr, 50L@7.5%/15yr)
- ✅ TC2: EMI Bar Chart — Personal Loan (10L@12%/5yr + calendar widget)

### API Tests
- ✅ Excessively long title
- ✅ Special/unsupported characters
- ✅ Missing userId field
- ✅ Empty payload
- ✅ Null values
- ✅ Type mismatch (string as userId)

### SQL Tests
- ✅ Scenario 1: Round-trip transfer detection (within 10%, 24h window)
- ✅ Scenario 2: IPL player 3+ consecutive 30-run streaks

## AI Self-Healing

See `AI_SELF_HEALING.md` for the full strategy, broken locator examples, prompt templates, and validation approach.