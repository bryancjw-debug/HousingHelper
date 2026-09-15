# Housing Helper v1.4

A dependency-free Singapore home-purchase screening tool. It guides one or two buyers through household, income, funds, property, financing and move-in inputs before presenting affordability, outlay, financing and policy results.

## What v1.4 adds

- A property-first quiz with a compact live affordability card and a separate final analytics view.
- Requested single-applicant defaults plus property-specific illustrative price and floor-area presets.
- Clearly separated maximum-loan and maximum-property-price estimates.
- Conditional, user-selected HDB grant scenarios with a grant-specific funding waterfall.
- Visible light, standard, premium and custom renovation assumptions with live totals.
- Explicit distinction between a financially workable plan and a property-eligibility issue.

## What v1.3 added

- A clearer distinction between official policy rules and editable planning assumptions.
- A transparent loaded-example summary and a direct target-versus-maximum comparison.
- A binding-constraint explanation in place of the former arbitrary 85% "comfortable" guide.
- Refined desktop and mobile hierarchy while retaining the guided, one-step-at-a-time flow.

## What v1.2 added

- One-card-at-a-time guided journey on desktop and mobile
- Separate buyer profiles, property ownership and outstanding housing loans
- Lower-of-price-or-valuation loan base and explicit cash-over-valuation
- Separate expected mortgage and loan-assessment rates
- HDB, bank and no-loan route comparison with unavailable-route guardrails
- Screening price ceiling, 85% comfortable guide and target comparison
- Cash and CPF-OA outlay timeline, renovation budget and protected buffers
- Indicative EHG, resale grants, Proximity Housing Grant and resale levy
- Residential, non-residential and mixed-use stamp duty treatment
- CPF lease and housing-limit screening with retirement set-aside warnings
- Source-dated policy cards linking to HDB, CPF Board and IRAS

## Important limits

Results are planning estimates, not an HFE letter, bank IPA, CPF withdrawal approval or tax advice. Scheme eligibility, family nucleus, income averaging, property-history waiting periods, remissions, lender credit policy and exact CPF BRS/FRS requirements require official confirmation.

Commercial and mixed-use financing is deliberately not estimated with residential LTV rules.

## Run locally

Open `index.html` in a modern browser. No server or build step is required.

## Verification

With Node.js and Playwright available:

```powershell
node tests/calculations.test.js
node tests/browser-check.js
```

The browser check uses the installed Google Chrome binary and verifies the guided flow, critical calculation output, second-buyer behavior, mobile results order, console errors and horizontal overflow.

## Policy sources

Policy basis last verified 14 September 2026:

- HDB flat, grant and loan eligibility
- CPF Board property-purchase usage guidance and calculator
- IRAS BSD, ABSD and mixed-property guidance
- MoneySense home-loan and affordability guidance
