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

const grants = hh.grantEstimate(input({ propertyType: "hdbResale", purchasePrice: 500000, marketValue: 500000, monthlyIncome: 6000, monthlyDebt: 0, flatSize: "small", proximity: "near" }));
assert.equal(grants.ehg, 50000, "indicative EHG schedule");
assert.equal(grants.resaleGrant, 80000, "indicative resale grant");
assert.equal(grants.proximityGrant, 20000, "indicative proximity grant");
assert.equal(hh.grantEstimate(input({ applicantProfile: "single", propertyType: "hdbBto", monthlyIncome: 5000 })).ehg, 0, "solo EHG ceiling is screened separately");
assert.equal(hh.calculate(input({ propertyType: "hdbBto", priorSubsidised: "4room" })).levy, 40000, "fixed family resale levy screening");
assert.ok(hh.affordablePrice(input()) > 0, "affordability search returns a usable ceiling");

const defaultResult = hh.calculate(input());
assert.equal(defaultResult.duty.bsd, 32600, "default $1.2m residential BSD reconciles to IRAS bands");
assert.equal(defaultResult.duty.absd, 0, "default SC first-property profile has no ABSD");
assert.equal(defaultResult.selected.loan, 900000, "default bank loan is capped at 75% LTV");
assert.equal(defaultResult.cpfUsed, 160000, "default CPF use preserves the entered $20k OA buffer");
assert.equal(defaultResult.cashRequired, 237600, "default cash requirement includes duties, fees and renovation");
assert.equal(defaultResult.cashSurplus, -67600, "default profile shows the exact upfront cash shortfall");
assert.equal(hh.affordablePrice(input()), 965000, "default estimated maximum price remains reproducible");

console.log("Housing Helper calculation tests passed");
