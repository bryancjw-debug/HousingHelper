const assert = require("node:assert/strict");
const hh = require("../app.js");

function input(overrides = {}) {
  return {
    ...hh.defaults,
    incomeRecognition: hh.defaults.incomeRecognition / 100,
    incomeRecognition2: hh.defaults.incomeRecognition2 / 100,
    residentialShare: hh.defaults.residentialShare / 100,
    actualInterestRate: hh.defaults.actualInterestRate / 100,
    assessmentRate: hh.defaults.assessmentRate / 100,
    ...overrides
  };
}

assert.equal(hh.residentialBsd(0), 0, "zero value has zero BSD");
assert.equal(hh.residentialBsd(180000), 1800, "first residential BSD band");
assert.equal(hh.residentialBsd(360000), 5400, "second residential BSD band");
assert.equal(hh.nonResidentialBsd(2000000), 69600, "non-residential BSD bands");

const belowValuation = input({ purchasePrice: 1200000, marketValue: 1000000 });
assert.equal(hh.loanBase(belowValuation), 1000000, "loan uses lower price or valuation");
assert.equal(hh.stampBase(belowValuation), 1200000, "duties use higher price or valuation");
assert.equal(hh.routeAssessment(belowValuation, "bank").ltvCap, 750000, "bank LTV uses lower base");

const ownerWithoutLoan = input({ ownedProperties: 1, housingLoans1: 0 });
assert.equal(hh.routeAssessment(ownerWithoutLoan, "bank").ltv, .75, "ownership does not imply an outstanding loan");
assert.equal(hh.routeAssessment(input({ housingLoans1: 1 }), "bank").ltv, .45, "one outstanding housing loan uses second tier");
assert.equal(hh.routeAssessment(input({ hasSecondBuyer: true, housingLoans1: 1, housingLoans2: 1 }), "bank").ltv, .45, "a joint loan is not double-counted across buyers");
assert.equal(hh.routeAssessment(input({ buyerAge: 40, loanTenure: 30 }), "bank").ltv, .55, "bank long-loan age tier is applied");

assert.equal(hh.absdRate(input({ citizenship: "sc", ownedProperties: 0 })), 0, "SC first residential property");
assert.equal(hh.absdRate(input({ citizenship: "sc", ownedProperties: 1 })), .20, "SC second residential property");
assert.equal(hh.absdRate(input({ citizenship: "spr", ownedProperties: 0 })), .05, "SPR first residential property");
assert.equal(hh.absdRate(input({ citizenship: "foreigner" })), .60, "foreigner residential property");
assert.equal(hh.absdRate(input({ hasSecondBuyer: true, citizenship: "sc", citizenship2: "spr" })), .05, "highest joint-buyer ABSD profile");

const mixed = input({ propertyType: "mixed", residentialShare: .4, purchasePrice: 1000000, marketValue: 1000000, citizenship: "spr" });
assert.equal(hh.duties(mixed).absd, 20000, "mixed-property ABSD applies to residential component");
assert.equal(hh.routeAssessment(mixed, "bank").available, false, "mixed financing is left to bank-specific assessment");

const noLoan = hh.calculate(input({ loanType: "cash", cashAvailable: 1200000, cpfAvailable: 200000, cashBuffer: 0, cpfBuffer: 0 }));
assert.ok(noLoan.cpfUsed > 0, "eligible CPF can be used without a mortgage");
assert.ok(noLoan.cashRequired < noLoan.totalOutlay, "CPF reduces cash needed in no-loan route");

const commercial = hh.calculate(input({ propertyType: "commercial", loanType: "bank", residentialShare: 0 }));
assert.equal(commercial.selected.available, false, "commercial mortgage does not reuse residential rules");
assert.equal(commercial.cpfUsed, 0, "commercial purchase does not use CPF housing funds");

const condoHdb = hh.routeAssessment(input({ propertyType: "privateCondo" }), "hdb");
assert.equal(condoHdb.available, false, "HDB loan is unavailable for private property");
assert.equal(hh.routeAssessment(input({ propertyType: "hdbResale", monthlyIncome: 6000, priorHdbLoans: "2" }), "hdb").available, false, "third HDB concessionary loan is screened out");
assert.equal(hh.routeAssessment(input({ propertyType: "privateCondo", mopStatus: "notMet" }), "bank").available, false, "uncompleted HDB MOP blocks the purchase screen");

const hdb = hh.routeAssessment(input({ propertyType: "hdbResale", loanType: "hdb", purchasePrice: 500000, marketValue: 500000, monthlyIncome: 6000, monthlyDebt: 0 }), "hdb");
assert.equal(hdb.available, true, "qualifying HDB profile is screened");
assert.equal(hdb.ltv, .75, "current HDB full-lease LTV is 75%");
assert.equal(hdb.actualRate, .026, "HDB expected rate is distinct");
assert.equal(hdb.assessmentRate, .03, "HDB assessment rate is distinct");
assert.equal(hh.routeAssessment(input({ propertyType: "hdbResale", monthlyIncome: 6000, loanTenure: 25, buyerAge: 50 }), "hdb").tenure, 15, "HDB tenure is capped by average buyer age");
assert.equal(hh.cpfUsageLimit(input({ propertyType: "hdbResale", remainingLease: 19 }), "hdb").limit, 0, "CPF screen blocks leases below 20 years");

const grants = hh.grantEstimate(input({ applicantProfile: "family", propertyType: "hdbResale", purchasePrice: 500000, marketValue: 500000, monthlyIncome: 6000, monthlyDebt: 0, flatSize: "small", proximity: "near", includeEhg: true, includeResaleGrant: true, includeProximityGrant: true }));
assert.equal(grants.ehg, 50000, "indicative EHG schedule");
assert.equal(grants.resaleGrant, 80000, "indicative resale grant");
assert.equal(grants.proximityGrant, 20000, "indicative proximity grant");
assert.equal(hh.grantEstimate(input({ applicantProfile: "single", propertyType: "hdbBto", monthlyIncome: 4000, includeEhg: true })).ehg, 10000, "solo EHG uses the sole-recipient income schedule");
assert.equal(hh.grantEstimate(input({ applicantProfile: "single", propertyType: "hdbBto", monthlyIncome: 5000, includeEhg: true })).ehg, 0, "solo EHG ceiling is screened separately");
assert.equal(hh.calculate(input({ applicantProfile: "family", propertyType: "hdbBto", priorSubsidised: "4room" })).levy, 40000, "fixed family resale levy screening");
assert.ok(hh.affordablePrice(input()) > 0, "affordability search returns a usable ceiling");

const defaultResult = hh.calculate(input());
assert.equal(defaultResult.duty.bsd, 3200, "default $250k residential BSD reconciles to IRAS bands");
assert.equal(defaultResult.duty.absd, 0, "default SC first-property profile has no ABSD");
assert.equal(defaultResult.selected.loan, 187500, "default HDB loan is capped at 75% LTV");
assert.equal(defaultResult.cpfUsed, 69200, "default CPF use preserves the entered $20k OA buffer");
assert.equal(defaultResult.cashRequired, 25000, "default cash requirement includes the light renovation allowance");
assert.equal(defaultResult.cashSurplus, 25000, "default profile shows the exact upfront cash surplus");
assert.equal(hh.affordablePrice(input()), 453000, "default estimated maximum price remains reproducible");
assert.equal(hh.calculate({ ...input(), purchasePrice: 453000, marketValue: 453000, useMaxLoan: true }).selected.loan, 339750, "maximum affordable price translates to its corresponding maximum usable loan");
assert.deepEqual(Object.fromEntries(Object.entries(hh.propertyPresets).map(([key, value]) => [key, value.price])), { hdbBto: 250000, hdbResale: 550000, ec: 1300000, privateCondo: 1500000, landed: 3500000, commercial: 1000000, mixed: 2000000 }, "every property type has a distinct starting price");

const grantFunded = hh.calculate(input({ applicantProfile: "single", propertyType: "hdbResale", purchasePrice: 500000, marketValue: 500000, monthlyIncome: 4000, flatSize: "small", proximity: "near", includeEhg: true, includeResaleGrant: true, includeProximityGrant: true, cpfAvailable: 0, cpfBuffer: 0 }));
assert.equal(grantFunded.grantUsed, 60000, "selected single grants are applied to the housing payment");
assert.equal(grantFunded.cpfBalanceUsed, 0, "grant use remains separate from CPF-OA use");
assert.ok(grantFunded.cashRequired >= grantFunded.duty.total + grantFunded.reno, "housing grants do not pay stamp duty or renovation in the funding waterfall");

console.log("Housing Helper calculation tests passed");
