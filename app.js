const $ = (id) => document.getElementById(id);

const defaults = {
  hasSecondBuyer: false,
  citizenship: "sc",
  ownedProperties: 0,
  monthlyIncome: 16000,
  monthlyDebt: 1200,
  buyerAge: 38,
  incomeType: "fixed",
  incomeRecognition: 100,
  citizenship2: "sc",
  ownedProperties2: 0,
  monthlyIncome2: 9000,
  monthlyDebt2: 600,
  buyerAge2: 36,
  incomeType2: "fixed",
  incomeRecognition2: 100,
  cashAvailable: 220000,
  cpfAvailable: 180000,
  cpfGrants: 0,
  saleProceeds: 0,
  cashAvailable2: 120000,
  cpfAvailable2: 90000,
  cpfGrants2: 0,
  saleProceeds2: 0,
  propertyType: "privateCondo",
  purchasePrice: 1200000,
  marketValue: 1200000,
  residentialShare: 100,
  loanType: "bank",
  outstandingLoans: 0,
  loanTenure: 25,
  interestRate: 4.0,
  desiredLoan: 900000,
  useMaxLoan: true,
  legalFees: 3500,
  renovationScope: "standard",
  floorArea: 900,
  renoRate: 55,
  moveInReserve: 12000,
  cashBuffer: 50000,
  cpfBuffer: 20000
};

const renovationRates = {
  light: 30,
  standard: 55,
  premium: 90
};

const money = (value) => {
  const rounded = Math.round(value || 0);
  return rounded.toLocaleString("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });
};

const num = (id) => Number($(id).value || 0);
const val = (id) => $(id).value;

function getInputs() {
  return {
    hasSecondBuyer: $("hasSecondBuyer").checked,
    citizenship: val("citizenship"),
    ownedProperties: num("ownedProperties"),
    monthlyIncome: num("monthlyIncome"),
    monthlyDebt: num("monthlyDebt"),
    buyerAge: num("buyerAge"),
    incomeType: val("incomeType"),
    incomeRecognition: num("incomeRecognition") / 100,
    citizenship2: val("citizenship2"),
    ownedProperties2: num("ownedProperties2"),
    monthlyIncome2: num("monthlyIncome2"),
    monthlyDebt2: num("monthlyDebt2"),
    buyerAge2: num("buyerAge2"),
    incomeType2: val("incomeType2"),
    incomeRecognition2: num("incomeRecognition2") / 100,
    cashAvailable: num("cashAvailable"),
    cpfAvailable: num("cpfAvailable"),
    cpfGrants: num("cpfGrants"),
    saleProceeds: num("saleProceeds"),
    cashAvailable2: num("cashAvailable2"),
    cpfAvailable2: num("cpfAvailable2"),
    cpfGrants2: num("cpfGrants2"),
    saleProceeds2: num("saleProceeds2"),
    propertyType: val("propertyType"),
    purchasePrice: num("purchasePrice"),
    marketValue: num("marketValue"),
    residentialShare: num("residentialShare") / 100,
    loanType: val("loanType"),
    outstandingLoans: num("outstandingLoans"),
    loanTenure: num("loanTenure"),
    interestRate: num("interestRate") / 100,
    desiredLoan: num("desiredLoan"),
    useMaxLoan: $("useMaxLoan").checked,
    legalFees: num("legalFees"),
    renovationScope: val("renovationScope"),
    floorArea: num("floorArea"),
    renoRate: num("renoRate"),
    moveInReserve: num("moveInReserve"),
    cashBuffer: num("cashBuffer"),
    cpfBuffer: num("cpfBuffer")
  };
}

function buyers(input) {
  const first = {
    label: "Buyer 1",
    citizenship: input.citizenship,
    ownedProperties: input.ownedProperties,
    monthlyIncome: input.monthlyIncome,
    monthlyDebt: input.monthlyDebt,
    buyerAge: input.buyerAge,
    incomeType: input.incomeType,
    incomeRecognition: input.incomeRecognition,
    cashAvailable: input.cashAvailable,
    cpfAvailable: input.cpfAvailable,
    cpfGrants: input.cpfGrants,
    saleProceeds: input.saleProceeds
  };
  const second = {
    label: "Buyer 2",
    citizenship: input.citizenship2,
    ownedProperties: input.ownedProperties2,
    monthlyIncome: input.monthlyIncome2,
    monthlyDebt: input.monthlyDebt2,
    buyerAge: input.buyerAge2,
    incomeType: input.incomeType2,
    incomeRecognition: input.incomeRecognition2,
    cashAvailable: input.cashAvailable2,
    cpfAvailable: input.cpfAvailable2,
    cpfGrants: input.cpfGrants2,
    saleProceeds: input.saleProceeds2
  };
  return input.hasSecondBuyer ? [first, second] : [first];
}

function household(input) {
  return buyers(input).reduce((total, buyer) => {
    total.monthlyIncome += buyer.monthlyIncome;
    total.assessedIncome += buyer.monthlyIncome * buyer.incomeRecognition;
    total.monthlyDebt += buyer.monthlyDebt;
    total.cashAvailable += buyer.cashAvailable;
    total.cpfAvailable += buyer.cpfAvailable;
    total.cpfGrants += buyer.cpfGrants;
    total.saleProceeds += buyer.saleProceeds;
    total.maxOwnedProperties = Math.max(total.maxOwnedProperties, buyer.ownedProperties);
    total.youngestAge = Math.min(total.youngestAge, buyer.buyerAge || 99);
    return total;
  }, {
    monthlyIncome: 0,
    assessedIncome: 0,
    monthlyDebt: 0,
    cashAvailable: 0,
    cpfAvailable: 0,
    cpfGrants: 0,
    saleProceeds: 0,
    maxOwnedProperties: 0,
    youngestAge: 99
  });
}

function renovationCost(input) {
  return Math.max(0, input.floorArea * input.renoRate + input.moveInReserve);
}

function isResidential(type) {
  return type !== "commercial";
}

function isPublicHousing(type) {
  return type === "hdbBto" || type === "hdbResale";
}

function isMsrProperty(type) {
  return type === "hdbBto" || type === "hdbResale" || type === "ec";
}

function stampBase(input) {
  return Math.max(input.purchasePrice, input.marketValue);
}

function marginalDuty(amount, brackets) {
  let remaining = Math.max(0, amount);
  let total = 0;
  for (const [cap, rate] of brackets) {
    const slice = cap === Infinity ? remaining : Math.min(remaining, cap);
    total += slice * rate;
    remaining -= slice;
    if (remaining <= 0) break;
  }
  return Math.floor(Math.max(1, total));
}

function bsd(input) {
  const base = stampBase(input);
  if (input.propertyType === "mixed") {
    const residential = base * input.residentialShare;
    const nonResidential = base - residential;
    return bsdResidential(residential) + bsdNonResidential(nonResidential);
  }
  return isResidential(input.propertyType) ? bsdResidential(base) : bsdNonResidential(base);
}

function bsdResidential(amount) {
  return marginalDuty(amount, [
    [180000, 0.01],
    [180000, 0.02],
    [640000, 0.03],
    [500000, 0.04],
    [1500000, 0.05],
    [Infinity, 0.06]
  ]);
}

function bsdNonResidential(amount) {
  return marginalDuty(amount, [
    [180000, 0.01],
    [180000, 0.02],
    [640000, 0.03],
    [500000, 0.04],
    [Infinity, 0.05]
  ]);
}

function absdRateForBuyer(buyer, propertyType) {
  if (!isResidential(propertyType)) return 0;
  const count = buyer.ownedProperties + 1;
  if (buyer.citizenship === "sc") return count === 1 ? 0 : count === 2 ? 0.20 : 0.30;
  if (buyer.citizenship === "spr") return count === 1 ? 0.05 : count === 2 ? 0.30 : 0.35;
  if (buyer.citizenship === "foreigner") return 0.60;
  return 0.65;
}

function absdRate(input) {
  return Math.max(...buyers(input).map((buyer) => absdRateForBuyer(buyer, input.propertyType)));
}

function ltvSettings(input) {
  if (input.loanType === "cash") return { ltv: 0, minCashRate: 1, reason: "No loan selected" };
  if (input.loanType === "hdb") return { ltv: 0.75, minCashRate: 0, reason: "HDB loan default: 75% LTV, downpayment may be CPF/cash" };
  const effectiveLoans = Math.max(input.outstandingLoans, household(input).maxOwnedProperties > 0 ? 1 : 0);
  if (effectiveLoans === 0) return { ltv: 0.75, minCashRate: 0.05, reason: "Bank loan default: first housing loan" };
  if (effectiveLoans === 1) return { ltv: 0.45, minCashRate: 0.25, reason: "Bank loan default: one outstanding housing loan or buyer with existing residential property" };
  return { ltv: 0.35, minCashRate: 0.25, reason: "Bank loan default: two or more outstanding housing loans" };
}

function monthlyPayment(loan, annualRate, years) {
  if (loan <= 0) return 0;
  const months = years * 12;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return loan / months;
  return loan * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
}

function maxLoanFromPayment(payment, annualRate, years) {
  if (payment <= 0) return 0;
  const months = years * 12;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return payment * months;
  return payment * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
}

function loanCapacity(input) {
  const settings = ltvSettings(input);
  const base = stampBase(input);
  const hh = household(input);
  const ltvCap = base * settings.ltv;
  const assessedIncome = hh.assessedIncome;
  const tdsrPaymentCap = Math.max(0, assessedIncome * 0.55 - hh.monthlyDebt);
  const msrPaymentCap = Math.max(0, assessedIncome * 0.30);
  const paymentCap = isMsrProperty(input.propertyType) ? Math.min(tdsrPaymentCap, msrPaymentCap) : tdsrPaymentCap;
  const servicingCap = maxLoanFromPayment(paymentCap, input.interestRate, input.loanTenure);
  const requested = input.useMaxLoan ? Infinity : input.desiredLoan;
  const loan = Math.min(ltvCap, servicingCap, requested);
  const payment = monthlyPayment(loan, input.interestRate, input.loanTenure);
  return { settings, assessedIncome, ltvCap, servicingCap, paymentCap, loan: Math.max(0, loan), payment };
}

function calculate(input) {
  const base = stampBase(input);
  const dutyBsd = bsd(input);
  const dutyAbsd = Math.floor(base * absdRate(input));
  const duties = dutyBsd + dutyAbsd;
  const loan = loanCapacity(input);
  const renovation = renovationCost(input);
  const hh = household(input);
  const minCashDown = base * loan.settings.minCashRate;
  const downpayment = Math.max(0, input.purchasePrice - loan.loan);
  const cpfPool = Math.max(0, hh.cpfAvailable + hh.cpfGrants - input.cpfBuffer);
  const cashPool = Math.max(0, hh.cashAvailable + hh.saleProceeds - input.cashBuffer);
  const nonDownCash = dutyAbsd + input.legalFees + renovation;
  const cpfEligibleNonLoan = dutyBsd + Math.max(0, downpayment - minCashDown);
  const cpfUsed = Math.min(cpfPool, cpfEligibleNonLoan);
  const cashRequired = minCashDown + nonDownCash + Math.max(0, cpfEligibleNonLoan - cpfUsed);
  const totalUpfront = downpayment + duties + input.legalFees + renovation;
  const cashSurplus = cashPool - cashRequired;
  const cpfSurplus = cpfPool - cpfUsed;
  return { base, dutyBsd, dutyAbsd, duties, loan, renovation, household: hh, minCashDown, downpayment, cpfPool, cashPool, cpfUsed, cashRequired, totalUpfront, cashSurplus, cpfSurplus };
}

function affordablePrice(input) {
  let low = 0;
  const hh = household(input);
  let high = Math.max(500000, input.purchasePrice * 2, hh.cashAvailable + hh.cpfAvailable + hh.monthlyIncome * 12 * 8);
  for (let i = 0; i < 42; i += 1) {
    const mid = (low + high) / 2;
    const trial = { ...input, purchasePrice: mid, marketValue: mid, useMaxLoan: true };
    const out = calculate(trial);
    if (out.cashSurplus >= 0 && out.cpfSurplus >= 0) low = mid;
    else high = mid;
  }
  return low;
}

function row(label, value, tone = "") {
  return `<div class="row ${tone}"><span>${label}</span><strong>${value}</strong></div>`;
}

function render() {
  const input = getInputs();
  $("residentialShareReadout").textContent = `${Math.round(input.residentialShare * 100)}%`;
  $("incomeRecognitionReadout").textContent = `${Math.round(input.incomeRecognition * 100)}%`;
  $("incomeRecognitionReadout2").textContent = `${Math.round(input.incomeRecognition2 * 100)}%`;
  document.body.classList.toggle("has-second-buyer", input.hasSecondBuyer);
  $("loanType").disabled = false;
  const isHdb = isPublicHousing(input.propertyType);
  if (!isHdb && input.loanType === "hdb") $("loanType").value = "bank";
  if (input.propertyType !== "mixed") $("residentialShare").disabled = true;
  else $("residentialShare").disabled = false;
  if (input.incomeType === "fixed" && input.incomeRecognition < 1) {
    $("incomeRecognitionReadout").textContent = `${Math.round(input.incomeRecognition * 100)}%`;
  }

  const output = calculate(getInputs());
  const maxPrice = affordablePrice(getInputs());
  const viable = output.cashSurplus >= 0 && output.cpfSurplus >= 0;
  const loanTight = output.loan.loan < Math.min(output.loan.ltvCap, getInputs().desiredLoan || Infinity) - 1;

  $("usableCashPreview").textContent = money(output.cashPool);
  $("usableCpfPreview").textContent = money(output.cpfPool);
  document.querySelectorAll("[data-property]").forEach((button) => {
    button.classList.toggle("active", button.dataset.property === input.propertyType);
  });
  document.querySelectorAll("[data-loan]").forEach((button) => {
    button.classList.toggle("active", button.dataset.loan === input.loanType);
  });

  $("maxPrice").textContent = money(maxPrice);
  $("totalNeed").textContent = money(output.totalUpfront);
  $("cashGap").textContent = money(Math.abs(output.cashSurplus));
  $("cashGap").className = output.cashSurplus >= 0 ? "positive" : "negative";
  $("cashGapLabel").textContent = output.cashSurplus >= 0 ? "Surplus after required cash" : "Cash shortfall";
  $("cpfGap").textContent = money(Math.abs(output.cpfSurplus));
  $("cpfGap").className = output.cpfSurplus >= 0 ? "positive" : "negative";
  $("cpfGapLabel").textContent = output.cpfSurplus >= 0 ? "Surplus after planned CPF use" : "CPF-OA shortfall";
  $("overallStatus").textContent = viable ? "Likely feasible" : "Shortfall";
  $("overallStatus").style.color = viable ? "#0f7a5f" : "#b64747";

  $("diagnosis").textContent = viable ? "This purchase clears the upfront checks" : "This purchase has an upfront funding gap";
  $("diagnosisDetail").textContent = viable
    ? `Estimated spare cash is ${money(output.cashSurplus)} and spare CPF-OA is ${money(output.cpfSurplus)} after buffers.`
    : `You need ${money(Math.max(0, -output.cashSurplus))} more cash and ${money(Math.max(0, -output.cpfSurplus))} more CPF-OA, or a lower price / larger loan.`;

  $("outlayRows").innerHTML = [
    row("Purchase mode", input.hasSecondBuyer ? "2 buyers" : "1 buyer"),
    row("Purchase price", money(input.purchasePrice)),
    row("Maximum eligible loan used", money(output.loan.loan)),
    row("Downpayment not covered by loan", money(output.downpayment)),
    row("Minimum cash downpayment", money(output.minCashDown)),
    row("CPF-OA applied to downpayment / BSD", money(output.cpfUsed)),
    row("Renovation and move-in budget", money(output.renovation)),
    row("Cash required after CPF use", money(output.cashRequired), output.cashSurplus < 0 ? "warn" : ""),
    row("Cash available after buffer", money(output.cashPool)),
    row("CPF-OA available after buffer", money(output.cpfPool))
  ].join("");

  $("cashRequiredLabel").textContent = money(output.cashRequired);
  $("cpfRequiredLabel").textContent = money(output.cpfUsed);
  $("cashMeter").style.width = `${Math.min(100, output.cashRequired / Math.max(1, output.cashPool) * 100)}%`;
  $("cpfMeter").style.width = `${Math.min(100, output.cpfUsed / Math.max(1, output.cpfPool) * 100)}%`;

  $("loanRows").innerHTML = [
    row("LTV cap", money(output.loan.ltvCap)),
    row("Gross household monthly income", money(output.household.monthlyIncome)),
    row("Income recognised for assessment", money(output.loan.assessedIncome)),
    row("Total monthly debt obligations", money(output.household.monthlyDebt)),
    row("Loan servicing cap", money(output.loan.servicingCap), loanTight ? "warn" : ""),
    row("Monthly repayment at stress rate", money(output.loan.payment)),
    row("Monthly payment cap used", money(output.loan.paymentCap)),
    row("Loan tenure", `${input.loanTenure} years`),
    row("Stress rate", `${(input.interestRate * 100).toFixed(2)}%`)
  ].join("");
  $("loanNotice").textContent = `${output.loan.settings.reason}. TDSR is modelled at 55% of recognised monthly income less existing debts; MSR at 30% of recognised income is also applied for HDB and EC. Self-employed or variable income can be modelled by lowering the recognised income percentage.`;

  $("dutyRows").innerHTML = [
    row("Stamp duty base", money(output.base)),
    row("Buyer Stamp Duty", money(output.dutyBsd)),
    row(`Additional Buyer Stamp Duty (${(absdRate(input) * 100).toFixed(0)}%)`, money(output.dutyAbsd), output.dutyAbsd > 0 ? "warn" : ""),
    row("ABSD rate basis", input.hasSecondBuyer ? "Highest buyer profile applies" : "Buyer 1 profile"),
    row("Total stamp duties", money(output.duties)),
    row("Legal / valuation / admin fees", money(input.legalFees)),
    row("Renovation budget", money(output.renovation))
  ].join("");

  $("eligibilityRows").innerHTML = eligibilityRows(input, output).join("");
  $("eligibilityNotice").textContent = "Eligibility checks are screening indicators only. HDB flat/EC eligibility, grants, HFE outcomes, bank loan approval, CPF withdrawal limits and any ABSD remission depend on official application details and documentary assessment.";
  updateMobileStep();
}

function eligibilityRows(input, output) {
  const activeBuyers = buyers(input);
  const hasSc = activeBuyers.some((buyer) => buyer.citizenship === "sc");
  const hasOnlyScOrSpr = activeBuyers.every((buyer) => buyer.citizenship === "sc" || buyer.citizenship === "spr");
  const anyExisting = activeBuyers.some((buyer) => buyer.ownedProperties > 0);
  const householdIncome = output.household.monthlyIncome;
  const rows = [
    row("Buyer count", `${activeBuyers.length}`),
    row("At least one Singapore Citizen", hasSc ? "Yes" : "No", hasSc ? "good" : "warn"),
    row("Only SC / SPR buyers", hasOnlyScOrSpr ? "Yes" : "No", hasOnlyScOrSpr ? "good" : "warn")
  ];
  if (input.propertyType === "hdbBto" || input.propertyType === "hdbResale") {
    rows.push(row("HDB citizenship screen", hasSc ? "Likely passes broad screen" : "Check HDB eligibility", hasSc ? "good" : "warn"));
    rows.push(row("HFE required before purchase", "Yes"));
  }
  if (input.propertyType === "ec") {
    rows.push(row("EC citizenship screen", hasSc ? "Likely passes broad screen" : "Check EC eligibility", hasSc ? "good" : "warn"));
    rows.push(row("EC household income screen", householdIncome <= 16000 ? "Within $16,000 default screen" : "Above $16,000 screen", householdIncome <= 16000 ? "good" : "warn"));
  }
  rows.push(row("Existing residential property impact", anyExisting ? "May affect ABSD, LTV and public housing eligibility" : "No existing-property flag"));
  return rows;
}

function applyIncomePreset() {
  setIncomeRecognition("incomeType", "incomeRecognition");
}

function applyIncomePreset2() {
  setIncomeRecognition("incomeType2", "incomeRecognition2");
}

function setIncomeRecognition(typeId, recognitionId) {
  const type = val(typeId);
  if (type === "fixed") $(recognitionId).value = 100;
  if (type === "selfEmployed") $(recognitionId).value = 70;
  if (type === "commission") $(recognitionId).value = 80;
}

function applyRenovationPreset() {
  const scope = val("renovationScope");
  if (renovationRates[scope]) $("renoRate").value = renovationRates[scope];
}

function reset() {
  for (const [key, value] of Object.entries(defaults)) {
    const element = $(key);
    if (!element) continue;
    if (element.type === "checkbox") element.checked = Boolean(value);
    else element.value = value;
  }
  render();
}

document.querySelectorAll("input, select").forEach((element) => {
  element.addEventListener("input", render);
  element.addEventListener("change", render);
});

document.querySelectorAll("[data-property]").forEach((button) => {
  button.addEventListener("click", () => {
    $("propertyType").value = button.dataset.property;
    render();
  });
});

document.querySelectorAll("[data-loan]").forEach((button) => {
  button.addEventListener("click", () => {
    $("loanType").value = button.dataset.loan;
    render();
  });
});

$("incomeType").addEventListener("change", () => {
  applyIncomePreset();
  render();
});

$("incomeType2").addEventListener("change", () => {
  applyIncomePreset2();
  render();
});

$("renovationScope").addEventListener("change", () => {
  applyRenovationPreset();
  render();
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    $(button.dataset.tab).classList.add("active");
  });
});

$("resetBtn").addEventListener("click", reset);
$("printBtn").addEventListener("click", () => window.print());

let mobileStep = 0;

function activeMobileCards() {
  return Array.from(document.querySelectorAll(".mobile-card")).filter((card) => {
    return card.id !== "buyer2Card" || $("hasSecondBuyer").checked;
  });
}

function updateMobileStep() {
  if (!$("prevStep")) return;
  const cards = activeMobileCards();
  mobileStep = Math.max(0, Math.min(mobileStep, cards.length));
  document.querySelectorAll(".mobile-card").forEach((card) => card.classList.remove("active"));
  document.querySelector(".app").classList.toggle("results-ready", mobileStep >= cards.length);
  if (mobileStep < cards.length) cards[mobileStep].classList.add("active");
  $("prevStep").disabled = mobileStep === 0;
  $("nextStep").textContent = mobileStep >= cards.length - 1 ? "Show results" : "Next";
  $("stepCounter").textContent = mobileStep >= cards.length ? "Results" : `${mobileStep + 1} of ${cards.length}`;
}

$("prevStep").addEventListener("click", () => {
  mobileStep -= 1;
  updateMobileStep();
});

$("nextStep").addEventListener("click", () => {
  mobileStep += 1;
  updateMobileStep();
  if (mobileStep >= activeMobileCards().length) {
    document.querySelector(".results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

reset();
updateMobileStep();
