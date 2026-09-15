const { chromium } = require("playwright");
const path = require("node:path");
const assert = require("node:assert/strict");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const errors = [];
  const url = "file:///" + path.resolve(__dirname, "../index.html").replace(/\\/g, "/");
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);

  assert.equal(await page.title(), "Housing Helper v1.4");
  assert.equal(await page.locator(".step-card:visible").count(), 1, "one input card is visible on desktop");
  assert.equal(await page.locator("#stepCounter").textContent(), "1 of 7");
  assert.equal(await page.locator("#applicantProfile").inputValue(), "single");
  assert.equal(await page.locator("#monthlyIncome").inputValue(), "8000");
  assert.equal(await page.locator("#propertyType").inputValue(), "hdbBto");
  assert.equal(await page.locator("#purchasePrice").inputValue(), "250000");
  assert.equal(await page.locator("#liveMaxLoan").textContent(), "$339,750");
  assert.equal(await page.locator("#liveMaxPrice").textContent(), "$453,000");
  assert.equal(await page.locator("#overallStatus").textContent(), "Eligibility issue found");
  assert.equal(await page.locator(".live-preview").isVisible(), true, "quiz shows the live affordability card");
  assert.equal(await page.locator(".results").isVisible(), false, "full analytics wait for the results step");

  await page.locator("button[data-property='hdbResale']").click();
  assert.equal(await page.locator("#purchasePrice").inputValue(), "550000", "property selection loads its starting price");
  await page.locator("#purchasePrice").fill("600000");
  await page.locator("button[data-property='privateCondo']").click();
  assert.equal(await page.locator("#purchasePrice").inputValue(), "600000", "manually edited prices are preserved");
  await page.locator("#resetBtn").click();

  await page.locator("#stepRail button").filter({ hasText: "Buyers" }).click();
  await page.locator("#hasSecondBuyer").check();
  assert.equal(await page.locator("#stepCounter").textContent(), "2 of 8");
  assert.equal(await page.locator("#stepRail button").count(), 9, "second buyer adds one guided step");
  await page.locator("#hasSecondBuyer").uncheck();

  await page.locator("#stepRail button").filter({ hasText: "Income" }).click();
  await page.locator("#incomeType").selectOption("selfEmployed");
  assert.equal(await page.locator("#incomeRecognition").inputValue(), "70", "variable income receives an editable planning scenario");

  await page.locator("#monthlyIncome").fill("4000");
  await page.locator("#stepRail button").filter({ hasText: "Property" }).click();
  await page.locator("button[data-property='hdbResale']").click();
  await page.locator("#stepRail button").filter({ hasText: "Grants" }).click();
  assert.match(await page.locator("#grantOptions").innerText(), /Enhanced CPF Housing Grant for Singles/);
  assert.match(await page.locator("#grantOptions").innerText(), /CPF Housing Grant for Singles/);
  await page.locator("#includeEhg").check();
  await page.locator("#includeResaleGrant").check();
  assert.match(await page.locator("#grantNotice").innerText(), /selected indicative grants/);

  await page.locator("#stepRail button").filter({ hasText: "Costs" }).click();
  assert.equal(await page.locator("#renoTotalPreview").textContent(), "$37,000");
  await page.locator("button[data-reno='premium']").click();
  assert.equal(await page.locator("#renoTotalPreview").textContent(), "$91,000", "renovation choice updates the visible estimate");

  await page.locator("#stepRail button").filter({ hasText: "Property" }).click();
  await page.locator("#purchasePrice").fill("1200000");
  await page.locator("#marketValue").fill("1000000");
  await page.locator("#purchasePrice").dispatchEvent("input");
  await page.locator("button[data-property='privateCondo']").click();
  await page.locator("#stepRail button").filter({ hasText: "Financing" }).click();
  await page.locator("button[data-loan='hdb']").click();
  assert.equal(await page.locator("#loanType").inputValue(), "bank", "invalid HDB route is not silently selected");
  assert.equal(await page.locator("button[data-loan].active").getAttribute("data-loan"), "bank", "financing shortcut matches calculation state");

  await page.locator("#stepRail button").filter({ hasText: "Results" }).click();
  await page.locator("button[data-tab='financing']").click();
  const loanText = await page.locator("#loanRows").innerText();
  assert.match(loanText, /Loan base \(lower price or value\)\s*\$1,000,000/);
  assert.match(loanText, /LTV cap\s*75% · \$750,000/);
  assert.equal(await page.locator(".policy-card").count(), 6);
  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `no page overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.resolve(__dirname, "../housing-helper-v1.4-desktop.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(url);
  await mobile.waitForTimeout(250);
  await mobile.screenshot({ path: path.resolve(__dirname, "../housing-helper-v1.4-mobile-quiz.png"), fullPage: true });
  assert.equal(await mobile.locator(".results").isVisible(), false, "mobile results wait until inputs are complete");
  assert.equal(await mobile.locator(".live-preview").isVisible(), true, "mobile keeps a compact floating preview");
  assert.equal(await mobile.locator(".step-card:visible").count(), 1);
  for (let i = 0; i < 7; i += 1) await mobile.locator("#nextStep").click();
  assert.equal(await mobile.locator("#stepCounter").textContent(), "Results");
  assert.equal(await mobile.locator(".results").isVisible(), true);
  assert.equal(await mobile.locator(".inputs").isVisible(), false, "completed mobile quiz yields to the results");
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth), 390, "mobile page has no horizontal overflow");
  await mobile.screenshot({ path: path.resolve(__dirname, "../housing-helper-v1.4-mobile.png"), fullPage: true });
  await mobile.locator("#editBtn").click();
  assert.equal(await mobile.locator(".inputs").isVisible(), true, "mobile results can return to editable answers");

  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  await browser.close();
  console.log("Housing Helper browser checks passed");
})().catch((error) => { console.error(error); process.exit(1); });
