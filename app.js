const POLICY_DATE = "16 Sep 2026";
const $ = (id) => document.getElementById(id);

const defaults = {
  hasSecondBuyer: false, applicantProfile: "single", firstTimer: "yes",
  citizenship: "sc", buyerAge: 35, ownedProperties: 0, housingLoans1: 0,
  citizenship2: "sc", buyerAge2: 36, ownedProperties2: 0, housingLoans2: 0,
  monthlyIncome: 8000, monthlyDebt: 0, incomeType: "fixed", incomeRecognition: 100,
  monthlyIncome2: 9000, monthlyDebt2: 600, incomeType2: "fixed", incomeRecognition2: 100,
  cashAvailable: 100000, cpfAvailable: 120000, otherGrants: 0, saleProceeds: 0,
  cashAvailable2: 120000, cpfAvailable2: 90000, otherGrants2: 0, saleProceeds2: 0,
  propertyType: "hdbBto", flatSize: "small", purchasePrice: 250000, marketValue: 250000,
  remainingLease: 99, residentialShare: 100, proximity: "none", priorHdbLoans: "0",
  privatePropertyStatus: "none", mopStatus: "na", loanType: "hdb", loanTenure: 25,
  actualInterestRate: 2.6, assessmentRate: 3.0, desiredLoan: 187500, useMaxLoan: true,
  includeEhg: false, includeResaleGrant: false, includeProximityGrant: false,
  renovationScope: "light", floorArea: 500, renoRate: 30, moveInReserve: 10000,
  legalFees: 3500, cashBuffer: 50000, cpfBuffer: 20000, priorSubsidised: "none"
};

const renovationRates = { light: 30, standard: 55, premium: 90 };
const propertyPresets = {
  hdbBto: { price: 250000, area: 500 }, hdbResale: { price: 550000, area: 900 },
  ec: { price: 1300000, area: 1000 }, privateCondo: { price: 1500000, area: 900 },
  landed: { price: 3500000, area: 1800 }, commercial: { price: 1000000, area: 1000 },
  mixed: { price: 2000000, area: 1200 }
};
const resaleLevies = { none: 0, "2room": 15000, "3room": 30000, "4room": 40000, "5room": 45000, executive: 50000, ec: 55000 };
const residentialTypes = new Set(["hdbBto", "hdbResale", "ec", "privateCondo", "landed"]);
const hdbTypes = new Set(["hdbBto", "hdbResale"]);

const money = (value) => Math.round(Number(value) || 0).toLocaleString("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });
const percent = (value) => `${(value * 100).toFixed(value * 100 % 1 ? 1 : 0)}%`;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

function isResidential(input) { return residentialTypes.has(input.propertyType); }
function residentialShare(input) { return isResidential(input) ? 1 : input.propertyType === "mixed" ? clamp(input.residentialShare, 0, 1) : 0; }
function stampBase(input) { return Math.max(input.purchasePrice, input.marketValue); }
function loanBase(input) { return Math.min(input.purchasePrice, input.marketValue); }

function marginalDuty(amount, bands) {
  if (amount <= 0) return 0;
  let remaining = amount;
  let total = 0;
  for (const [width, rate] of bands) {
    const slice = width === Infinity ? remaining : Math.min(remaining, width);
    total += Math.max(0, slice) * rate;
    remaining -= slice;
    if (remaining <= 0) break;
  }
  return Math.floor(total);
}

function residentialBsd(amount) {
  return marginalDuty(amount, [[180000, .01], [180000, .02], [640000, .03], [500000, .04], [1500000, .05], [Infinity, .06]]);
}

function nonResidentialBsd(amount) {
  return marginalDuty(amount, [[180000, .01], [180000, .02], [640000, .03], [500000, .04], [Infinity, .05]]);
}

function buyers(input) {
  const list = [{
    label: "Buyer 1", citizenship: input.citizenship, age: input.buyerAge,
    properties: input.ownedProperties, housingLoans: input.housingLoans1,
    income: input.monthlyIncome, debt: input.monthlyDebt, recognition: input.incomeRecognition,
    incomeType: input.incomeType, cash: input.cashAvailable, cpf: input.cpfAvailable,
    grants: input.otherGrants, saleProceeds: input.saleProceeds
  }];
  if (input.hasSecondBuyer) list.push({
    label: "Buyer 2", citizenship: input.citizenship2, age: input.buyerAge2,
    properties: input.ownedProperties2, housingLoans: input.housingLoans2,
    income: input.monthlyIncome2, debt: input.monthlyDebt2, recognition: input.incomeRecognition2,
    incomeType: input.incomeType2, cash: input.cashAvailable2, cpf: input.cpfAvailable2,
    grants: input.otherGrants2, saleProceeds: input.saleProceeds2
  });
  return list;
}

function household(input) {
  const list = buyers(input);
  return {
    buyers: list,
    grossIncome: list.reduce((sum, buyer) => sum + buyer.income, 0),
    assessedIncome: list.reduce((sum, buyer) => sum + buyer.income * buyer.recognition, 0),
    monthlyDebt: list.reduce((sum, buyer) => sum + buyer.debt, 0),
    housingLoans: Math.max(...list.map((buyer) => buyer.housingLoans)),
    cash: list.reduce((sum, buyer) => sum + buyer.cash + buyer.saleProceeds, 0),
    cpf: list.reduce((sum, buyer) => sum + buyer.cpf, 0),
    confirmedGrants: list.reduce((sum, buyer) => sum + buyer.grants, 0),
    youngestAge: Math.min(...list.map((buyer) => buyer.age)),
    averageAge: list.reduce((sum, buyer) => sum + buyer.age, 0) / list.length,
    hasSc: list.some((buyer) => buyer.citizenship === "sc")
  };
}

function absdRateForBuyer(buyer) {
  if (buyer.citizenship === "entity") return .65;
  if (buyer.citizenship === "foreigner") return .60;
  if (buyer.citizenship === "spr") return buyer.properties === 0 ? .05 : buyer.properties === 1 ? .30 : .35;
  return buyer.properties === 0 ? 0 : buyer.properties === 1 ? .20 : .30;
}

function absdRate(input) {
  if (residentialShare(input) === 0) return 0;
  return Math.max(...buyers(input).map(absdRateForBuyer));
}

function duties(input) {
  const base = stampBase(input);
  const share = residentialShare(input);
  const residentialValue = base * share;
  const nonResidentialValue = base - residentialValue;
  const bsdResidential = residentialBsd(residentialValue);
  const bsdNonResidential = nonResidentialBsd(nonResidentialValue);
  const absd = Math.floor(residentialValue * absdRate(input));
  return { base, residentialValue, nonResidentialValue, bsdResidential, bsdNonResidential, bsd: bsdResidential + bsdNonResidential, absd, total: bsdResidential + bsdNonResidential + absd };
}

function ehgAmount(income) {
  const bands = [[1500,120000],[2000,110000],[2500,105000],[3000,95000],[3500,90000],[4000,80000],[4500,70000],[5000,65000],[5500,55000],[6000,50000],[6500,40000],[7000,30000],[7500,25000],[8000,20000],[8500,10000],[9000,5000]];
  return (bands.find(([ceiling]) => income <= ceiling) || [0, 0])[1];
}

function singleEhgAmount(income) {
  const bands = [[750,60000],[1000,55000],[1250,52500],[1500,47500],[1750,45000],[2000,40000],[2250,35000],[2500,32500],[2750,27500],[3000,25000],[3250,20000],[3500,15000],[3750,12500],[4000,10000],[4250,5000],[4500,2500]];
  return (bands.find(([ceiling]) => income <= ceiling) || [0, 0])[1];
}

function grantEstimate(input) {
  const hh = household(input);
  const hdbPurchase = hdbTypes.has(input.propertyType);
  const firstTimer = input.firstTimer === "yes";
  const single = input.applicantProfile === "single";
  const citizenshipEligible = hh.hasSc && hh.buyers.every((buyer) => buyer.citizenship === "sc" || buyer.citizenship === "spr");
  let ehgPotential = 0;
  let resaleGrantPotential = 0;
  let proximityGrantPotential = 0;
  const notes = [];
  const ehgCeiling = single ? 4500 : 9000;
  if (hdbPurchase && firstTimer && citizenshipEligible && hh.grossIncome <= ehgCeiling) ehgPotential = single ? singleEhgAmount(hh.grossIncome) : ehgAmount(hh.grossIncome);
  if (input.propertyType === "hdbResale" && firstTimer && citizenshipEligible) {
    const ceiling = single ? 7000 : input.applicantProfile === "jointSingles" ? 14000 : 14000;
    if (hh.grossIncome <= ceiling) resaleGrantPotential = single ? (input.flatSize === "small" ? 40000 : 25000) : (input.flatSize === "small" ? 80000 : 50000);
    const citizenships = hh.buyers.map((buyer) => buyer.citizenship);
    if (resaleGrantPotential && citizenships.includes("sc") && citizenships.includes("spr")) {
      resaleGrantPotential = Math.max(0, resaleGrantPotential - 10000);
      notes.push("A $10,000 SC/SPR adjustment is screened against the resale grant.");
    }
  }
  if (input.propertyType === "hdbResale" && citizenshipEligible && input.proximity !== "none") {
    const familyAmount = input.proximity === "with" ? 30000 : 20000;
    proximityGrantPotential = single ? familyAmount / 2 : familyAmount;
  }
  if ((ehgPotential || resaleGrantPotential || proximityGrantPotential) && buyers(input).some((buyer) => buyer.citizenship === "spr")) notes.push("SC/SPR household adjustments may apply.");
  if (hdbPurchase && input.firstTimer === "unsure") notes.push("First-timer status must be confirmed through HFE.");
  const ehg = input.includeEhg ? ehgPotential : 0;
  const resaleGrant = input.includeResaleGrant ? resaleGrantPotential : 0;
  const proximityGrant = input.includeProximityGrant ? proximityGrantPotential : 0;
  const uncappedTotal = ehg + resaleGrant + proximityGrant;
  const total = Math.min(uncappedTotal, loanBase(input) * .95);
  if (total < uncappedTotal) notes.push("Indicative grants are capped at 95% of the lower price or value.");
  if (hdbPurchase && hh.hasSc && !citizenshipEligible) notes.push("A non-resident household member requires scheme-specific HFE assessment.");
  return { ehg, resaleGrant, proximityGrant, total, notes, potentials: { ehg: ehgPotential, resaleGrant: resaleGrantPotential, proximityGrant: proximityGrantPotential } };
}

function indicativeResaleLevy(input) {
  if (!(input.propertyType === "hdbBto" || input.propertyType === "ec")) return 0;
  const base = resaleLevies[input.priorSubsidised] || 0;
  return input.applicantProfile === "single" ? base / 2 : base;
}

function paymentForLoan(principal, annualRate, years) {
  if (principal <= 0 || years <= 0) return 0;
  const months = years * 12;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / months;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
}

function principalForPayment(payment, annualRate, years) {
  if (payment <= 0 || years <= 0) return 0;
  const months = years * 12;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return payment * months;
  return payment * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
}

function leaseCoverage(input) {
  const hh = household(input);
  if (input.remainingLease >= 900) return { coversTo95: true, factor: 1 };
  const yearsNeeded = Math.max(1, 95 - hh.youngestAge);
  const coversTo95 = input.remainingLease >= yearsNeeded;
  const factor = coversTo95 ? 1 : clamp((input.remainingLease - 20) / Math.max(1, yearsNeeded - 20), 0, 1);
  return { coversTo95, factor };
}

function routeAssessment(input, route) {
  const hh = household(input);
  const base = loanBase(input);
  const hdbProperty = hdbTypes.has(input.propertyType);
  const residential = isResidential(input);
  const lease = leaseCoverage(input);
  let available = true;
  let status = "Available for screening";
  let reason = "Subject to lender approval";
  let ltv = 0;
  let minCashRate = 0;
  let tenure = input.loanTenure;
  let actualRate = input.actualInterestRate;
  let assessmentRate = input.assessmentRate;
  let paymentCap = Infinity;

  if (residential && input.mopStatus === "notMet") {
    available = false;
    status = "Likely unavailable";
    reason = "The declared HDB minimum occupation period has not been completed";
  } else if (route === "cash") {
    reason = residential ? "No mortgage; eligible CPF-OA may still be used" : "Cash purchase; CPF housing use is unavailable";
  } else if (!residential) {
    available = false;
    status = "Bank-specific assessment required";
    reason = "Commercial and mixed-use financing is not modelled using residential LTV rules";
  } else if (route === "hdb") {
    actualRate = .026;
    assessmentRate = .03;
    if (!hdbProperty) {
      available = false;
      status = "Unavailable";
      reason = "HDB concessionary loans are for eligible HDB flat purchases only";
    } else if (!hh.hasSc) {
      available = false;
      status = "Likely unavailable";
      reason = "At least one applicant must be a Singapore Citizen";
    } else if (Number(input.priorHdbLoans) >= 2) {
      available = false;
      status = "Likely unavailable";
      reason = "A core family nucleus generally cannot take more than two HDB concessionary loans";
    } else if (input.privatePropertyStatus === "current" || input.privatePropertyStatus === "recent") {
      available = false;
      status = "Likely unavailable";
      reason = "Current or recently disposed private-property interests require HFE review and generally fail this HDB-loan screen";
    } else if (input.mopStatus === "notMet") {
      available = false;
      status = "Likely unavailable";
      reason = "The current HDB minimum occupation period has not been completed";
    } else if (input.applicantProfile === "single" && hh.youngestAge < 35) {
      available = false;
      status = "Scheme review required";
      reason = "Most single-citizen HDB purchase routes require the applicant to be at least age 35";
    } else {
      const incomeCeiling = input.applicantProfile === "single" ? 8000 : input.applicantProfile === "other" ? 16000 : 16000;
      if (hh.grossIncome > incomeCeiling) {
        available = false;
        status = "Likely unavailable";
        reason = `Gross income exceeds the ${money(incomeCeiling)} monthly screening ceiling`;
      }
      const tenureCap = Math.max(0, Math.floor(Math.min(25, 65 - hh.averageAge, input.remainingLease >= 900 ? 25 : input.remainingLease - 20)));
      tenure = Math.min(input.loanTenure, tenureCap);
      if (tenure < 1) {
        available = false;
        status = "Unavailable";
        reason = "Age or remaining lease leaves no modelled HDB loan tenure";
      }
      ltv = .75 * lease.factor;
      paymentCap = Math.max(0, hh.assessedIncome * .30);
      if (!lease.coversTo95 && available) {
        status = "Indicative only";
        reason = "HDB will determine the pro-rated LTV because the lease does not cover the youngest buyer to age 95";
      }
    }
  } else {
    const threshold = hdbProperty ? 30 : 35;
    const longLoan = input.loanTenure > threshold || buyers(input).some((buyer) => buyer.age + input.loanTenure > 65);
    const loanCount = hh.housingLoans;
    const standardLtvs = loanCount === 0 ? [.75, .55] : loanCount === 1 ? [.45, .25] : [.35, .15];
    ltv = standardLtvs[longLoan ? 1 : 0];
    minCashRate = loanCount === 0 ? (longLoan ? .10 : .05) : .25;
    paymentCap = Math.max(0, hh.assessedIncome * .55 - hh.monthlyDebt);
    if (hdbProperty || input.propertyType === "ec") paymentCap = Math.min(paymentCap, Math.max(0, hh.assessedIncome * .30));
    reason = longLoan ? "Lower residential LTV tier used because age 65 or tenure threshold is crossed" : "Residential bank-loan screening using declared outstanding housing loans";
  }

  const ltvCap = available ? base * ltv : 0;
  const servicingCap = available && route !== "cash" ? principalForPayment(paymentCap, assessmentRate, tenure) : 0;
  const maximumLoan = available && route !== "cash" ? Math.max(0, Math.min(ltvCap, servicingCap)) : 0;
  const chosenLoan = input.useMaxLoan ? maximumLoan : Math.min(input.desiredLoan, maximumLoan);
  return {
    route, available, status, reason, ltv, minCashRate, tenure, actualRate, assessmentRate,
    paymentCap, ltvCap, servicingCap, maximumLoan, loan: chosenLoan,
    expectedPayment: paymentForLoan(chosenLoan, actualRate, tenure),
    assessedPayment: paymentForLoan(chosenLoan, assessmentRate, tenure)
  };
}

function cpfUsageLimit(input, route) {
  if (!isResidential(input)) return { limit: 0, factor: 0, note: "CPF housing savings are not modelled for non-residential property." };
  if (input.remainingLease < 20) return { limit: 0, factor: 0, note: "CPF use is unavailable in this screening because the remaining lease is below 20 years." };
  const lease = leaseCoverage(input);
  const valuationLimit = loanBase(input) * lease.factor;
  const limit = route === "bank" ? valuationLimit * 1.2 : valuationLimit;
  return { limit, factor: lease.factor, note: lease.coversTo95 ? "Lease covers the youngest buyer to age 95." : "CPF usage is pro-rated for screening; confirm the exact limit with CPF Board." };
}

function renovation(input) {
  const rate = input.renovationScope === "custom" ? input.renoRate : renovationRates[input.renovationScope];
  return input.floorArea * rate + input.moveInReserve;
}

function calculate(input) {
  const hh = household(input);
  const duty = duties(input);
  const grants = grantEstimate(input);
  const levy = indicativeResaleLevy(input);
  const routes = {
    bank: routeAssessment(input, "bank"),
    hdb: routeAssessment(input, "hdb"),
    cash: routeAssessment(input, "cash")
  };
  const selected = routes[input.loanType];
  const reno = renovation(input);
  const cov = Math.max(0, input.purchasePrice - input.marketValue);
  const cashPool = Math.max(0, hh.cash - input.cashBuffer);
  const cpfBalances = Math.max(0, hh.cpf - input.cpfBuffer);
  const grantPool = hh.confirmedGrants + grants.total;
  const cpfPool = cpfBalances + grantPool;
  const minimumCashDown = selected.available && selected.route === "bank" ? loanBase(input) * selected.minCashRate : 0;
  const cpfLimit = cpfUsageLimit(input, selected.route);
  const residentialDuty = duty.bsdResidential + duty.absd;
  const downpayment = Math.max(0, input.purchasePrice - selected.loan);
  const housingPaymentEligible = isResidential(input) ? Math.max(0, downpayment - cov - minimumCashDown) : 0;
  const grantUsed = Math.min(grantPool, cpfLimit.limit, housingPaymentEligible);
  const cpfEligible = isResidential(input) ? Math.max(0, housingPaymentEligible - grantUsed) + residentialDuty + input.legalFees : 0;
  const cpfBalanceUsed = Math.min(cpfBalances, Math.max(0, cpfLimit.limit - grantUsed), cpfEligible);
  const cpfUsed = grantUsed + cpfBalanceUsed;
  const totalOutlay = input.purchasePrice + duty.total + input.legalFees + reno + levy;
  const cashRequired = Math.max(0, totalOutlay - selected.loan - cpfUsed);
  const cashSurplus = cashPool - cashRequired;
  const cpfSurplus = cpfBalances - cpfBalanceUsed;
  return {
    hh, duty, grants, levy, routes, selected, reno, cov, cashPool, cpfBalances, grantPool, cpfPool,
    cpfLimit, minimumCashDown, downpayment, housingPaymentEligible, grantUsed, cpfEligible, cpfBalanceUsed, cpfUsed, totalOutlay, cashRequired,
    cashSurplus, cpfSurplus, viable: selected.available && cashSurplus >= 0
  };
}

function affordablePrice(input) {
  if (!routeAssessment(input, input.loanType).available) return 0;
  let low = 0;
  let high = Math.max(500000, input.purchasePrice * 2, household(input).cash + household(input).cpf + household(input).grossIncome * 120);
  for (let i = 0; i < 56; i += 1) {
    const mid = (low + high) / 2;
    const trial = { ...input, purchasePrice: mid, marketValue: mid, useMaxLoan: true };
    if (calculate(trial).cashSurplus >= 0) low = mid; else high = mid;
  }
  return Math.floor(low / 1000) * 1000;
}

function normalizeInput(input) {
  return {
    ...input,
    incomeRecognition: Number(input.incomeRecognition),
    incomeRecognition2: Number(input.incomeRecognition2),
    residentialShare: Number(input.residentialShare)
  };
}

function getInputs() {
  const data = {};
  for (const key of Object.keys(defaults)) {
    const el = $(key);
    if (!el) continue;
    if (el.type === "checkbox") data[key] = el.checked;
    else if (el.type === "number" || el.type === "range") data[key] = Number(el.value || 0);
    else data[key] = el.value;
  }
  data.incomeRecognition /= 100;
  data.incomeRecognition2 /= 100;
  data.residentialShare /= 100;
  data.actualInterestRate /= 100;
  data.assessmentRate /= 100;
  return normalizeInput(data);
}

function row(label, value, tone = "") { return `<div class="row ${tone}"><span>${label}</span><strong>${value}</strong></div>`; }
function timeline(when, label, value, note = "") { return `<div class="timeline-row"><div><span>${when}</span><strong>${label}</strong>${note ? `<small>${note}</small>` : ""}</div><b>${value}</b></div>`; }
function check(label, state, detail) { return `<div class="check-item ${state}"><span aria-hidden="true">${state === "pass" ? "✓" : state === "warn" ? "!" : "×"}</span><div><strong>${label}</strong><small>${detail}</small></div></div>`; }

function financeCard(route, selected) {
  const names = { bank: "Bank loan", hdb: "HDB loan", cash: "No loan" };
  const pros = route.route === "hdb" ? "Stable concessionary rate; no early repayment penalty" : route.route === "bank" ? "Fixed or floating packages; available across residential types" : "No interest or mortgage approval";
  const limits = route.route === "hdb" ? "HDB eligibility, income, age, lease and HFE rules" : route.route === "bank" ? "LTV, TDSR/MSR, credit checks, lock-ins and rate changes" : "Largest upfront funding requirement";
  return `<article class="finance-card ${selected ? "selected" : ""} ${route.available ? "" : "unavailable"}"><div><span>${names[route.route]}</span><em>${route.status}</em></div><strong>${money(route.maximumLoan)}</strong><small>Maximum loan for current target</small><dl><dt>Expected payment</dt><dd>${money(route.expectedPayment)}/mo</dd><dt>Useful because</dt><dd>${pros}</dd><dt>Watch for</dt><dd>${limits}</dd></dl></article>`;
}

function policyCard(title, value, description, href, source) {
  return `<article class="policy-card"><span>${title}</span><strong>${value}</strong><p>${description}</p><a href="${href}" target="_blank" rel="noreferrer">${source} ↗</a></article>`;
}

function grantOption(id, title, amount, eligible, detail, checked) {
  return `<label class="grant-option ${eligible ? "eligible" : "unavailable"}"><input id="${id}" type="checkbox" ${checked ? "checked" : ""} ${eligible ? "" : "disabled"}><span><b>${title}</b><strong>${money(amount)}</strong><small>${detail}</small></span></label>`;
}

function render() {
  const input = getInputs();
  const output = calculate(input);
  const ceiling = affordablePrice(input);
  const ceilingOutput = ceiling > 0 ? calculate({ ...input, purchasePrice: ceiling, marketValue: ceiling, useMaxLoan: true }) : output;
  const maximumUsableLoan = ceiling > 0 ? ceilingOutput.selected.loan : 0;
  const priceDelta = input.purchasePrice - ceiling;
  const binding = output.selected.route === "cash" ? "No loan" : output.selected.ltvCap <= output.selected.servicingCap ? "LTV limit" : "Servicing limit";
  const singleBtoIssue = input.propertyType === "hdbBto" && input.applicantProfile === "single" && (output.hh.grossIncome > 7000 || input.flatSize !== "small");
  document.body.classList.toggle("has-second-buyer", input.hasSecondBuyer);
  document.body.classList.toggle("is-hdb", hdbTypes.has(input.propertyType));
  document.body.classList.toggle("is-resale", input.propertyType === "hdbResale");
  document.body.classList.toggle("is-mixed", input.propertyType === "mixed");
  document.body.classList.toggle("is-custom-reno", input.renovationScope === "custom");

  $("incomeRecognitionReadout").textContent = `${Math.round(input.incomeRecognition * 100)}%`;
  $("incomeRecognitionReadout2").textContent = `${Math.round(input.incomeRecognition2 * 100)}%`;
  $("residentialShareReadout").textContent = `${Math.round(input.residentialShare * 100)}%`;
  $("usableCashPreview").textContent = money(output.cashPool);
  $("usableCpfPreview").textContent = money(output.cpfBalances);
  $("renoTotalPreview").textContent = money(output.reno);
  const propertyNames = { hdbBto: "new HDB flat", hdbResale: "HDB resale flat", ec: "new EC", privateCondo: "private home", landed: "landed home", commercial: "commercial property", mixed: "mixed-use property" };
  $("scenarioSummary").textContent = `${output.hh.buyers.length} buyer${output.hh.buyers.length > 1 ? "s" : ""} · ${propertyNames[input.propertyType]} · ${money(input.purchasePrice)} target · ${input.loanType === "bank" ? "bank loan" : input.loanType === "hdb" ? "HDB loan" : "no loan"}. All values remain editable.`;

  document.querySelectorAll("[data-property]").forEach((button) => button.classList.toggle("active", button.dataset.property === input.propertyType));
  document.querySelectorAll("[data-loan]").forEach((button) => {
    button.classList.toggle("active", button.dataset.loan === input.loanType);
    const assessed = output.routes[button.dataset.loan];
    button.classList.toggle("unavailable", !assessed.available);
    button.setAttribute("aria-pressed", String(button.dataset.loan === input.loanType));
  });
  document.querySelectorAll("[data-reno]").forEach((button) => button.classList.toggle("active", button.dataset.reno === input.renovationScope));

  const grantPotentials = output.grants.potentials;
  const hdbPurchase = hdbTypes.has(input.propertyType);
  const single = input.applicantProfile === "single";
  const ehgReason = !hdbPurchase ? "Available only for eligible HDB purchases." : input.firstTimer !== "yes" ? "Requires an eligible first-timer application." : output.hh.grossIncome > (single ? 4500 : 9000) ? `Entered income exceeds the ${money(single ? 4500 : 9000)} screening ceiling.` : "Indicative amount based on the entered average monthly income.";
  const grantCards = [];
  if (hdbPurchase) grantCards.push(grantOption("includeEhg", single ? "Enhanced CPF Housing Grant for Singles" : "Enhanced CPF Housing Grant", grantPotentials.ehg, grantPotentials.ehg > 0, ehgReason, input.includeEhg));
  if (input.propertyType === "hdbResale") {
    grantCards.push(grantOption("includeResaleGrant", single ? "CPF Housing Grant for Singles" : "CPF Housing Grant", grantPotentials.resaleGrant, grantPotentials.resaleGrant > 0, grantPotentials.resaleGrant > 0 ? "Indicative first-timer resale grant for the selected flat size." : "The current profile does not clear this grant screen.", input.includeResaleGrant));
    grantCards.push(grantOption("includeProximityGrant", single ? "Proximity Housing Grant for Singles" : "Proximity Housing Grant", grantPotentials.proximityGrant, grantPotentials.proximityGrant > 0, input.proximity === "none" ? "Choose a qualifying proximity situation below." : "Subject to HDB distance, household and prior-grant checks.", input.includeProximityGrant));
  }
  $("grantOptions").innerHTML = grantCards.length ? grantCards.join("") : `<div class="empty-state">No HDB housing grants are modelled for this property type.</div>`;
  $("grantNotice").textContent = output.grants.total > 0 ? `${money(output.grants.total)} in selected indicative grants is included in this projection.` : "No indicative grant is currently included. Your HFE letter remains the source of truth.";

  $("maxPrice").textContent = money(ceiling);
  $("maxPriceReason").textContent = output.selected.available ? "Policy and funding screening estimate" : output.selected.status;
  $("summaryTargetPrice").textContent = money(input.purchasePrice);
  $("targetVsMax").textContent = priceDelta > 0 ? `${money(priceDelta)} above estimated maximum` : `${money(Math.abs(priceDelta))} below estimated maximum`;
  $("cashGap").textContent = money(Math.abs(output.cashSurplus));
  $("cashGap").className = output.cashSurplus >= 0 ? "positive" : "negative";
  $("cashGapLabel").textContent = output.cashSurplus >= 0 ? "Cash remaining after buffer" : "Cash shortfall";
  $("cpfGap").textContent = money(output.cpfBalanceUsed);
  $("cpfGap").className = "cpf-value";
  $("cpfGapLabel").textContent = `${money(output.cpfSurplus)} entered CPF-OA remains`;
  $("screeningPrice").textContent = money(ceiling);
  $("targetPrice").textContent = money(input.purchasePrice);
  $("priceDifference").textContent = priceDelta > 0 ? `${money(priceDelta)} above estimate` : `${money(Math.abs(priceDelta))} below estimate`;
  $("bindingConstraint").textContent = binding;
  $("bindingDetail").textContent = binding === "LTV limit" ? `${money(output.selected.ltvCap)} LTV cap is lower` : binding === "Servicing limit" ? `${money(output.selected.servicingCap)} servicing cap is lower` : "Purchase is funded without a mortgage";
  $("liveMaxPrice").textContent = money(ceiling);
  $("liveMaxLoan").textContent = money(maximumUsableLoan);
  $("liveCashPosition").textContent = `${output.cashSurplus >= 0 ? "+" : "-"}${money(Math.abs(output.cashSurplus))}`;
  $("liveCashPosition").className = output.cashSurplus >= 0 ? "positive" : "negative";
  $("liveCpfPlanned").textContent = money(output.cpfBalanceUsed);
  $("liveConstraint").textContent = binding;
  $("liveStatus").textContent = !output.selected.available ? output.selected.reason : singleBtoIssue ? "Funding is estimated, but the selected single-applicant BTO profile needs attention." : output.cashSurplus < 0 ? `${money(-output.cashSurplus)} more cash is needed for the current target.` : `${money(output.cashSurplus)} remains after your selected buffer.`;

  const viable = output.viable;
  $("overallStatus").textContent = !output.selected.available ? output.selected.status : singleBtoIssue ? "Eligibility issue found" : viable ? "Funding clears screening" : "Funding gap found";
  $("overallStatus").className = `status-pill ${!output.selected.available || singleBtoIssue || !viable ? "warn" : "good"}`;
  $("diagnosis").textContent = !output.selected.available ? "This route needs a different assessment" : singleBtoIssue ? "Your funding works, but eligibility needs attention" : viable ? "Your target clears the upfront screen" : "Your target has an upfront shortfall";
  $("diagnosisDetail").textContent = !output.selected.available
    ? output.selected.reason
    : singleBtoIssue
      ? `${money(output.hh.grossIncome)} monthly income is above the current $7,000 screen for a single applicant buying a 99-year 2-room Flexi BTO. Funding figures remain illustrative.`
    : viable
      ? `${money(output.cashSurplus)} cash remains after the selected buffers. Your screening ceiling is ${money(ceiling)}.`
      : `The entered target is ${money(Math.max(0, priceDelta))} above the estimated maximum and needs ${money(Math.max(0, -output.cashSurplus))} more upfront cash under these assumptions.`;

  $("outlayRows").innerHTML = [
    timeline("At booking / option", "Minimum cash downpayment", money(output.minimumCashDown), output.selected.route === "bank" ? `${percent(output.selected.minCashRate)} of the lower price or value in this screen` : "No minimum cash portion modelled"),
    timeline("At purchase", "Cash over valuation", money(output.cov), "Cannot be covered by the modelled loan or CPF"),
    timeline("At purchase", "Housing grants planned", money(output.grantUsed), "Applied only to the eligible housing payment in this estimate"),
    timeline("At purchase", "CPF-OA planned", money(output.cpfBalanceUsed), output.cpfLimit.note),
    timeline("At stamping", "BSD and ABSD", money(output.duty.total), `BSD ${money(output.duty.bsd)} · ABSD ${money(output.duty.absd)}`),
    timeline("At completion", "Cash needed after loan and CPF", money(Math.max(0, output.cashRequired - output.reno)), "Includes purchase balance, duties, fees and any levy"),
    timeline("After completion", "Renovation and move-in", money(output.reno), "Cash planning allowance"),
    timeline("If applicable", "Indicative resale levy", money(output.levy), "Paid from cash or sale proceeds, not the new housing loan")
  ].join("");
  $("cashRequiredLabel").textContent = money(output.cashRequired);
  $("cpfRequiredLabel").textContent = money(output.cpfBalanceUsed);
  $("cashMeter").style.width = `${Math.min(100, output.cashRequired / Math.max(1, output.cashPool) * 100)}%`;
  $("cpfMeter").style.width = `${Math.min(100, output.cpfBalanceUsed / Math.max(1, output.cpfBalances) * 100)}%`;

  $("financeComparison").innerHTML = ["hdb", "bank", "cash"].map((key) => financeCard(output.routes[key], key === input.loanType)).join("");
  $("loanRows").innerHTML = [
    row("Selected financing route", input.loanType === "hdb" ? "HDB loan" : input.loanType === "bank" ? "Bank loan" : "No loan"),
    row("Loan base (lower price or value)", money(loanBase(input))),
    row("LTV cap", `${percent(output.selected.ltv)} · ${money(output.selected.ltvCap)}`),
    row("Servicing cap", money(output.selected.servicingCap)),
    row("Maximum loan for current target", money(output.selected.maximumLoan)),
    row("Maximum loan at estimated property limit", money(maximumUsableLoan)),
    row("Expected monthly instalment", money(output.selected.expectedPayment)),
    row("Assessment monthly instalment", money(output.selected.assessedPayment)),
    row("Tenure used", `${output.selected.tenure || 0} years`)
  ].join("");
  $("loanNotice").textContent = `${output.selected.reason}. The ${(output.selected.actualRate * 100).toFixed(2)}% expected rate is an editable planning assumption, not a lender quote. The ${(output.selected.assessmentRate * 100).toFixed(2)}% rate is used for eligibility screening. Self-employed income recognition is your scenario assumption, not a universal lender haircut.`;

  $("policyRows").innerHTML = [
    policyCard("Indicative housing grants", money(output.grants.total), `EHG ${money(output.grants.ehg)}, resale grant ${money(output.grants.resaleGrant)}, proximity grant ${money(output.grants.proximityGrant)}. Final eligibility comes from HFE.`, "https://www.hdb.gov.sg/buying-a-flat/flat-grant-and-loan-eligibility", "HDB grants and eligibility"),
    policyCard("Indicative resale levy", money(output.levy), "Applies here only when a prior subsidised home and a new subsidised purchase are selected.", "https://www.hdb.gov.sg/buying-a-flat/bto-sbf-and-open-booking-of-flats/process-for-buying-a-new-flat/conditions-after-buying-a-new-flat?anchor=resale-levy", "HDB resale levy"),
    policyCard("Buyer Stamp Duty", money(output.duty.bsd), "Residential and non-residential components use their respective marginal rates.", "https://www.iras.gov.sg/quick-links/tax-rates/stamp-duty", "IRAS stamp duty"),
    policyCard(`ABSD · ${percent(absdRate(input))}`, money(output.duty.absd), "The highest joint-buyer profile applies; mixed property uses its residential component.", "https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29", "IRAS ABSD"),
    policyCard("CPF housing limit", money(output.cpfLimit.limit), `${output.cpfLimit.note} The current plan uses ${money(output.cpfBalanceUsed)} of entered CPF-OA and ${money(output.grantUsed)} of housing grants; BRS/FRS set-asides may still apply for a subsequent property.`, "https://www.cpf.gov.sg/service/article/how-much-cpf-savings-can-i-use-for-my-property-purchase", "CPF Board housing use"),
    policyCard("Policy freshness", POLICY_DATE, "Rules are stored in this static release and do not update automatically.", "https://www.hdb.gov.sg/residential/buying-a-flat/flat-and-grant-eligibility", "Check current HDB policy")
  ].join("");

  const eligibility = [];
  eligibility.push(check("Financing route", output.selected.available ? "pass" : "fail", output.selected.reason));
  eligibility.push(check("Upfront cash", output.cashSurplus >= 0 ? "pass" : "fail", output.cashSurplus >= 0 ? `${money(output.cashSurplus)} remains after buffer` : `${money(-output.cashSurplus)} shortfall after buffer`));
  eligibility.push(check("Remaining lease", input.remainingLease >= 20 ? (leaseCoverage(input).coversTo95 ? "pass" : "warn") : "fail", output.cpfLimit.note));
  eligibility.push(check("Citizenship and ABSD", absdRate(input) === 0 ? "pass" : "warn", absdRate(input) === 0 ? "No ABSD modelled" : `${percent(absdRate(input))} applied to the residential component`));
  eligibility.push(check("Grant estimate", output.grants.total > 0 ? "warn" : "pass", output.grants.total > 0 ? "Indicative only; obtain HFE before relying on it" : "No unconfirmed grant is being relied on"));
  if (buyers(input).some((buyer) => buyer.age >= 55 || buyer.properties > 0)) eligibility.push(check("CPF retirement set-asides", "warn", "BRS/FRS and second-property set-asides are not inferred from the OA balance; verify usable CPF directly."));
  if (buyers(input).some((buyer) => buyer.incomeType !== "fixed")) eligibility.push(check("Variable income evidence", "warn", "Lenders assess tax, business and income records individually; the slider is a scenario only."));
  if (input.propertyType === "landed" && buyers(input).some((buyer) => buyer.citizenship !== "sc")) eligibility.push(check("Landed-property approval", "warn", "Non-Singapore Citizens may require approval from the Singapore Land Authority."));
  if (hdbTypes.has(input.propertyType)) {
    eligibility.push(check("HDB property history", input.privatePropertyStatus === "none" || input.privatePropertyStatus === "cleared" ? "pass" : "fail", input.privatePropertyStatus === "recent" ? "A 30-month disposal period is screened; confirm the applicable flat classification and exceptions through HFE." : input.privatePropertyStatus === "current" ? "A current private-property interest generally prevents this HDB loan or grant screen." : "No current disqualifying private-property history was declared."));
    eligibility.push(check("Prior HDB loans and MOP", Number(input.priorHdbLoans) < 2 && input.mopStatus !== "notMet" ? "pass" : "fail", `${input.priorHdbLoans} prior HDB concessionary loan(s) declared; MOP status: ${input.mopStatus === "na" ? "not applicable" : input.mopStatus === "met" ? "completed" : "not completed"}.`));
  }
  if (input.propertyType === "hdbBto" && input.applicantProfile === "single") eligibility.push(check("Single-applicant BTO income ceiling", output.hh.grossIncome <= 7000 ? "pass" : "fail", `${money(output.hh.grossIncome)} entered against the current $7,000 screen for a 99-year 2-room Flexi flat. Confirm the project and flat type through HFE.`));
  if (!hdbTypes.has(input.propertyType) && input.mopStatus !== "na") eligibility.push(check("Current HDB MOP", input.mopStatus === "met" ? "pass" : "fail", input.mopStatus === "met" ? "Completed, based on your declaration." : "A further residential purchase is generally not available before completing the MOP."));
  if (input.propertyType === "ec") eligibility.push(check("New EC income ceiling", output.hh.grossIncome <= 16000 ? "pass" : "fail", `${money(output.hh.grossIncome)} gross monthly household income entered against the $16,000 screen. Other EC scheme conditions still require HFE.`));
  $("eligibilityRows").innerHTML = eligibility.join("");
  $("eligibilityNotice").textContent = "This is a planning screen, not an approval. Family nucleus, first-timer status, prior subsidies, disposal waiting periods, MOP, credit assessment, ABSD remissions and exact CPF limits require official confirmation.";
}

let currentStep = 0;
function activeSteps() { return Array.from(document.querySelectorAll(".step-card")).filter((card) => card.id !== "buyer2Card" || $("hasSecondBuyer").checked); }
function updateSteps() {
  const steps = activeSteps();
  currentStep = clamp(currentStep, 0, steps.length);
  document.querySelectorAll(".step-card").forEach((card) => card.classList.remove("active"));
  const atResults = currentStep === steps.length;
  document.body.classList.toggle("results-ready", atResults);
  if (!atResults) steps[currentStep].classList.add("active");
  $("stepTitle").textContent = atResults ? "Review" : steps[currentStep].dataset.stepTitle;
  $("stepCounter").textContent = atResults ? "Results" : `${currentStep + 1} of ${steps.length}`;
  $("prevStep").disabled = currentStep === 0;
  $("nextStep").textContent = "Next";
  $("nextStep").hidden = atResults;
  $("progressBar").style.width = `${(atResults ? 1 : (currentStep + 1) / steps.length) * 100}%`;
  $("stepRail").innerHTML = steps.map((step, index) => `<button type="button" data-step="${index}" class="${index === currentStep ? "active" : ""}" aria-label="Go to ${step.dataset.stepTitle}"><span>${index + 1}</span>${step.dataset.stepTitle}</button>`).join("") + `<button type="button" data-step="${steps.length}" class="${atResults ? "active" : ""}" aria-label="View results"><span>${steps.length + 1}</span>Results</button>`;
  if (atResults && window.matchMedia("(max-width: 760px)").matches) $("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function reset() {
  priceUsesPreset = true;
  for (const [key, value] of Object.entries(defaults)) {
    const el = $(key);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = value;
    else el.value = value;
  }
  currentStep = 0;
  render();
  updateSteps();
}

let priceUsesPreset = true;
function applyPropertyPreset(type) {
  const preset = propertyPresets[type];
  if (priceUsesPreset && preset) {
    $("purchasePrice").value = preset.price;
    $("marketValue").value = preset.price;
    $("floorArea").value = preset.area;
    $("desiredLoan").value = Math.round(preset.price * .75);
    $("pricePresetNote").textContent = "Illustrative starting value for this property type.";
  } else {
    $("pricePresetNote").textContent = "Your custom price has been preserved.";
  }
  const hdb = hdbTypes.has(type);
  $("loanType").value = hdb ? "hdb" : type === "commercial" || type === "mixed" ? "cash" : "bank";
  $("actualInterestRate").value = hdb ? "2.6" : "3.0";
  $("assessmentRate").value = hdb ? "3.0" : "4.0";
}

function init() {
  $("plannerForm").addEventListener("input", (event) => {
    if (event.target.id === "purchasePrice" || event.target.id === "marketValue") { priceUsesPreset = false; $("pricePresetNote").textContent = "Custom value entered."; }
    if (event.target.id === "propertyType") applyPropertyPreset(event.target.value);
    if (event.target.id === "incomeType" && event.target.value !== "fixed" && $("incomeRecognition").value === "100") $("incomeRecognition").value = "70";
    if (event.target.id === "incomeType2" && event.target.value !== "fixed" && $("incomeRecognition2").value === "100") $("incomeRecognition2").value = "70";
    if (event.target.id === "loanType") {
      if (event.target.value === "hdb") { $("actualInterestRate").value = "2.6"; $("assessmentRate").value = "3.0"; }
      if (event.target.value === "bank") { $("actualInterestRate").value = "3.0"; $("assessmentRate").value = "4.0"; }
    }
    render();
    updateSteps();
  });
  document.querySelectorAll("[data-property]").forEach((button) => button.addEventListener("click", () => { $("propertyType").value = button.dataset.property; applyPropertyPreset(button.dataset.property); render(); }));
  document.querySelectorAll("[data-reno]").forEach((button) => button.addEventListener("click", () => { $("renovationScope").value = button.dataset.reno; render(); }));
  document.querySelectorAll("[data-loan]").forEach((button) => button.addEventListener("click", () => {
    const input = getInputs();
    if (!routeAssessment(input, button.dataset.loan).available && button.dataset.loan !== "cash") return;
    $("loanType").value = button.dataset.loan;
    if (button.dataset.loan === "hdb") { $("actualInterestRate").value = "2.6"; $("assessmentRate").value = "3.0"; }
    if (button.dataset.loan === "bank") { $("actualInterestRate").value = "3.0"; $("assessmentRate").value = "4.0"; }
    render();
  }));
  $("stepRail").addEventListener("click", (event) => { const button = event.target.closest("[data-step]"); if (!button) return; currentStep = Number(button.dataset.step); updateSteps(); });
  $("prevStep").addEventListener("click", () => { currentStep -= 1; updateSteps(); });
  $("nextStep").addEventListener("click", () => { currentStep += 1; updateSteps(); });
  document.querySelectorAll(".tab").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".tab, .tab-panel").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    $(button.dataset.tab).classList.add("active");
  }));
  $("resetBtn").addEventListener("click", reset);
  $("editBtn").addEventListener("click", () => { currentStep = Math.max(0, activeSteps().length - 1); updateSteps(); $("plannerForm").scrollIntoView({ behavior: "smooth", block: "start" }); });
  $("printBtn").addEventListener("click", () => window.print());
  reset();
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
if (typeof module !== "undefined" && module.exports) module.exports = { defaults, propertyPresets, marginalDuty, residentialBsd, nonResidentialBsd, household, absdRate, duties, grantEstimate, routeAssessment, cpfUsageLimit, calculate, affordablePrice, loanBase, stampBase };
