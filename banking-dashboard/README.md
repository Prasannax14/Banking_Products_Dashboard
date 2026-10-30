# Prasanna Banking Products Dashboard

A single-screen dashboard that shows Prasanna savings, credit card, loan and wealth products in one unified view. Includes 7 fictional demo accounts, a hover profile card / mobile bottom sheet, and a real-world loan eligibility check.

## Tech
- **React 18 + Vite** for a small, fast component-based UI
- Plain CSS (no UI library), mobile-first responsive design, native `<dialog>` for product details
- Mock API: product data lives in `public/api/products.json`, user data in `public/api/users.json`, both loaded with `fetch`
- **Vitest** (dev dependency only) for unit tests of the pure eligibility logic

## Run it
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # run vitest unit tests
npm run build    # production build in dist/
```

## Structure
```
public/api/products.json     Mock product data (categories, loans, eligibility rules)
public/api/users.json        7 fictional demo accounts
public/favicon.svg           Bank PV favicon
src/api/productsApi.js       Fetches products
src/api/usersApi.js          Fetches users
src/App.jsx                  State: users, selected user, category, search, eligibility
src/utils/
  format.js                  formatINR (Indian grouping), formatPct, formatLakh
  loanEligibility.js         Pure eligibility checker — no React, fully testable
  loanEligibility.test.js    Vitest tests for all 7 eligibility scenarios
src/components/
  Logo.jsx                   Inline SVG bank logo (PV)
  UserSwitcher.jsx           Initials chip + select + profile popover / bottom sheet
  UserProfileCard.jsx        Profile card (popover on desktop, bottom sheet on mobile)
  CategoryTabs.jsx           Category switcher with scrollable tabs on mobile
  SearchBox.jsx              Search by name, category or status
  InterestTypeFilter.jsx     Loans tab: interest types, eligibility note, Eligible-only toggle
  ProductGrid.jsx            Grid and 3-state loan grouping (Active, Eligible, Not available)
  ProductCard.jsx            One card per product, with eligibility badge for loans
  ProductDetails.jsx         Details modal (centred dialog or bottom sheet) + eligibility checklist
```

## Demo accounts and loan eligibility

### 7 Fictional demo users
> All data is **completely fictional**. No real personal identifiers are used; PAN numbers are masked (e.g. `XXXXX1234X`).

*Gowtham is the default showcase user, deliberately constructed to illustrate all three loan states simultaneously:*
1. **Active loans:** Home Loan (floating) and Auto Loan (fixed), showing outstanding balance and next due date metrics with a "View Details" action.
2. **You can apply for:** Personal Loan (capped at about ₹2.5 lakh because existing EMIs use ~47% of income) and Education Loan (co-applicant assumed).
3. **Not available right now:** Fixed-Rate Home Loan (remaining repayment capacity supports ~₹6.9 lakh, below the ₹10 lakh minimum requirement).

| # | Name | Age | City | Employment | Income/mo | Score | EMIs/mo | KYC | Status |
|---|------|-----|------|-----------|-----------|-------|---------|-----|--------|
| 1 | Gowtham | 32 | Chennai | Salaried | ₹1,50,000 | 790 | ₹70,000 | Verified | Showcase user |
| 2 | Divya | 28 | Kochi | Salaried | ₹60,000 | 735 | ₹12,000 | Verified | Multi-loan eligible |
| 3 | Suresh | 45 | Pune | Self-employed | ₹90,000 | 640 | ₹30,000 | Verified | Low score, no loans |
| 4 | Kavya | 21 | Bengaluru | Student | ₹0 | None | ₹0 | Verified | Education loan only |
| 5 | Karthik | 38 | Hyderabad | Salaried | ₹1,10,000 | 760 | ₹65,000 | Verified | High EMI, holds Home Loan |
| 6 | Lakshmi | 59 | Coimbatore | Salaried | ₹95,000 | 800 | ₹10,000 | Verified | Age limit at loan end |
| 7 | Imran | 34 | Mumbai | Salaried | ₹80,000 | 710 | ₹15,000 | **Pending** | KYC pending |

### Eligibility checks (in order)
1. **KYC verified** — must be "Verified".
2. **Minimum age** — must be ≥ `minAge`.
3. **Age at loan end** — `age + tenure / 12` must be ≤ `maxAgeAtMaturity`.
4. **Monthly income** — must be ≥ `minMonthlyIncome` (skipped when `coApplicantAssumed: true`, e.g. Education Loan).
5. **Credit score** — must be ≥ `minCreditScore` (skipped when `coApplicantAssumed: true`).
6. **Repayment burden (FOIR)** — available EMI capacity must support at least the product's `minLoanAmount` under a 50% FOIR ceiling (skipped when `coApplicantAssumed: true`).
7. **Employment type** — must be in `allowedEmployment` (checked only when specified).

### EMI formula
Standard reducing-balance EMI:

```
EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
```

where `P` = loan amount, `r` = annual rate / 12 / 100, `n` = tenure in months.

### Indicative rate adjustment by score
| Score range | Adjustment |
|-------------|-----------|
| 780 and above | +0.00% |
| 720 – 779 | +0.50% |
| 680 – 719 | +1.00% |
| Below 680 or no history | +1.50% |

**Rates are indicative only.** Final terms are subject to credit assessment.

### Expected eligibility outcomes
| User | Home Loan | Personal Loan | Auto Loan | Fixed Home Loan | Education Loan |
|------|-----------|--------------|-----------|----------------|----------------|
| Gowtham | 🔒 Already holds | ✅ Eligible (~₹2.5L) | 🔒 Already holds | ❌ FOIR capacity | ✅ Eligible |
| Divya | ✅ Eligible | ✅ Eligible | ✅ Eligible | ❌ Score (<750) | ✅ Eligible |
| Suresh | ❌ Score (<720) | ❌ Score (<700) | ❌ Score (<680) | ❌ Score (<750) | ❌ Age at end (>45) |
| Kavya | ❌ Income/score | ❌ Income/score | ❌ Income/score | ❌ Income/score | ✅ Eligible (Co-app) |
| Karthik | 🔒 Already holds | ✅ Eligible | ✅ Eligible | ❌ FOIR capacity | ❌ Age at end (>45) |
| Lakshmi | ❌ Age at end (>70) | ✅ Eligible | ✅ Eligible | ❌ Age at end (>70) | ❌ Age at end (>45) |
| Imran | ❌ KYC Pending | ❌ KYC Pending | ❌ KYC Pending | ❌ KYC Pending | ❌ KYC Pending |


## Responsive design

Built mobile-first with CSS only (media queries, fluid typography with `clamp()`, and viewport safe area insets). Tested across widths 320px, 375px, 768px, 1024px, and 1440px without horizontal scrolling.

### Breakpoints & Adaptive Behaviors
- **< 360px:** Metric cards adapt to stack labels directly above values to ensure readability.
- **< 480px:** Dialog eligibility checklist items stack criteria names above explanation details.
- **< 640px (Mobile view):**
  - **Masthead:** Stacks brand (logo and bank name) on row 1, and the user switcher chip full-width on row 2.
  - **Category tabs:** Single horizontally scrollable row (`overflow-x: auto`, scroll-snap, hidden scrollbar) with auto-scroll bringing the active tab into view.
  - **Search box:** Sits full-width below the tabs with a minimum 16px font-size to prevent mobile browser zooming.
  - **Grid:** Single column layout with equal card height and buttons aligned to the bottom.
  - **Details dialog:** Automatically presents as a full-width bottom sheet (max-height `92dvh`) with rounded top corners, a scrollable body, and a sticky Close button.
- **640px – 767px (Tablet portrait):**
  - Grid expands to 2 columns.
  - Masthead brand and user chip align in one horizontal row.
  - Details dialog renders as a centred modal (max-width 560px).
- **768px and up (Tablet landscape & Desktop):**
  - **Profile card:** Functions as a floating popover (340px) anchored under the user chip on hover/click/focus. On mobile or touch devices (`hover: none`), it operates as a full-width bottom sheet (max-height `80dvh`) with backdrop and Esc-to-close.
- **960px and up (Desktop):**
  - Grid expands to 3 columns.
  - Content container is centred with max-width 1120px.
- **Accessibility & Motion:** All touch targets are minimum 44×44px. Sheet and popover transitions respect `prefers-reduced-motion`.
