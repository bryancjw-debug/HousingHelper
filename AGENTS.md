# Housing Helper

## Project Boundary

- This directory is the standalone `HousingHelper` Git repository. Do not treat similarly themed Singapore finance apps as the same checkout.
- Before edits, confirm the repository root, branch, remote and working-tree status. Preserve unrelated user changes.
- The app is currently dependency-free HTML, CSS and JavaScript. Prefer its existing architecture unless the user approves a material change or production dependency.

## Product Purpose

- Help people in Singapore understand whether a target home purchase appears financially workable, what constrains it, and which cash and CPF-OA outlays may be required.
- Use a guided, educational screening journey. Do not present results as an HFE letter, lender approval, CPF withdrawal approval, legal opinion or tax advice.
- Keep individual buyer facts and CPF-OA balances separate. Aggregate only the resources and obligations that genuinely belong in the household purchase result.
- Support individual and joint purchases without assuming that co-buyers have identical citizenship, age, income, debts, property interests or outstanding housing loans.

## User Preferences

Confirmed 15 September 2026:

- Align Housing Helper with the context and design language of `CommonCents` and `RetirementReadiness`: calm premium-fintech presentation, guided quiz flow, progressive disclosure, clear assumptions and decision-focused results.
- Treat those apps as sibling references, not templates to copy literally. Preserve Housing Helper's own charcoal, green and teal identity unless a palette change is explicitly approved.
- Keep the experience simple for non-experts. Ask one coherent group of questions at a time and explain why unfamiliar Singapore housing inputs matter.
- On mobile, show inputs first, one card at a time, and reveal results only after the guided flow. Keep editing and back-navigation easy.
- On desktop, retain the same information architecture while using the extra width for a restrained live result preview or comparison, not a spreadsheet-like wall of fields.
- Let facts and figures lead. Use generated imagery sparingly and only when it supports orientation, an empty state or the overall housing context.
- Prefer actionable explanations of trade-offs over unexplained pass/fail labels or a single opaque affordability number.

Confirmed 16 September 2026:

- Start the guided journey with the property goal, then progressively collect buyer, income, funds, financing, grant and move-in information.
- During the quiz, keep a compact floating affordability card showing maximum loan, estimated maximum property price, cash position and the binding constraint. Reserve full analytics for the final results view.
- Use property-specific illustrative starting prices and update them when the property type changes, while preserving values the user has manually edited.
- Present renovation scopes as visible choices with their assumed rates, inclusions and live estimated totals; reveal custom inputs only when relevant.
- Show only housing grants relevant to the selected property and application profile. Let users choose whether to include an indicative grant and never imply HFE confirmation.
- The default example is a first-timer single applicant aged 35, earning $8,000 monthly with no monthly debt, $100,000 cash and $120,000 CPF-OA, considering an HDB BTO/SBF flat.

## Shared Design Language

- Follow the shared finance-app hierarchy used by CommonCents and RetirementReadiness: neutral input surfaces, visible card boundaries, semantic accents, persistent labels and obvious selected states.
- Use semantic color consistently: green for funded or surplus, red for deficits and errors, amber for warnings, teal for CPF or relevant housing-resource context, and neutral tones for ordinary inputs.
- Do not use success colors to imply guaranteed approval, returns or outcomes.
- Keep cards at 8px radius or less, touch targets at least 44px, keyboard focus visible and text contrast at WCAG AA where practical.
- Use category-aware headers and accents sparingly. Inputs remain visually calm; important results, warnings and policy constraints receive the stronger hierarchy.
- Avoid decorative clutter, nested cards, oversized dashboard metrics, dense always-open advanced sections and repeated numbers without a distinct purpose.
- Use short transform/opacity transitions, honour reduced-motion preferences, and prevent content or numbers from shifting the layout.

## UX Behaviour

- Preserve the guided step flow and progressive disclosure. Show fields only when they are relevant to the selected property, buyer profile or financing route.
- Keep a clear distinction between the user's target price, a comfortable planning guide and a policy-constrained screening ceiling.
- Explain the binding constraint: cash, CPF use, LTV, TDSR/MSR, tenure, age, lease, duties, levy, grant eligibility or a route that requires external assessment.
- Separate expected mortgage payments from regulatory or lender assessment payments.
- Present bank, HDB and no-loan routes with availability, benefits, limitations, upfront requirements and official next steps. Never silently substitute one route for another.
- Break purchase outlays into meaningful timing stages such as option or booking, purchase, stamping, completion and renovation.
- Self-employed or variable income recognition is a user-adjustable scenario, not a universal lender haircut. Say so wherever it affects results.

## Singapore Rules And Sources

- Use official primary sources first: HDB for flat, grant, levy and HFE rules; CPF Board for housing usage; IRAS for BSD and ABSD; MAS for regulatory lending rules. MoneySense may support consumer-facing explanations.
- Revalidate current rules before changing rates, limits, ceilings, eligibility or statutory explanations. Record the verification date and link the exact source near the relevant result.
- Keep purchase price, valuation and cash-over-valuation separate. Apply the correct higher/lower basis for each duty, loan and CPF rule.
- Keep residential properties owned separate from outstanding housing loans. For joint borrowers, do not double-count the same loan merely because both buyers are liable for it.
- Treat grants and resale levies as conditional estimates unless enough information exists. Make missing family nucleus, first-timer, employment-history, MOP, disposal-period or prior-subsidy details visible.
- Do not apply residential mortgage or CPF assumptions to commercial or mixed-use purchases without an official basis. Show a bank-specific or professional-assessment state instead.
- Make CPF lease, age-55, BRS/FRS and subsequent-property limitations explicit. Do not imply that the entered OA balance is automatically fully usable.

## Verification

- Run `node --check app.js` and `node tests/calculations.test.js` after calculation changes.
- Run `node tests/browser-check.js` after UI, flow or rendering changes. Use the bundled runtime paths when ordinary Windows Node or Playwright is unavailable.
- Test actual individual and two-buyer journeys, HDB and bank routes, self-employed scenarios, lower valuation than price, CPF and cash shortfalls, and unsupported property or loan combinations.
- Verify browser console errors, keyboard interaction, reduced-motion behaviour, and overflow at narrow mobile, tablet and desktop widths. Current baseline widths are 390, 768, 1024 and 1440px.
- Calculation tests do not constitute a comprehensive policy audit. State remaining limitations clearly.

## Publishing

- Publish only when the user explicitly asks. The current remote is `https://github.com/bryancjw-debug/HousingHelper.git`, with GitHub Pages served from `main`.
- Before publishing, require a clean relevant test pass and review the final diff for stale versions, secrets and unintended files.
- Version static CSS and JavaScript asset URLs when changing a release so GitHub Pages cannot mix cached HTML and scripts.
- After pushing, verify the live page title, version, asset URL, a non-zero sample calculation and browser console state. Do not infer deployment success from `git push` alone.

## Maintaining This File

- Add durable, confirmed project preferences here with a date when the user asks. Do not record transient requests, credentials, identifying financial data or private client information.
- Keep entries concise and reconcile new preferences with existing instructions rather than accumulating contradictory notes.
