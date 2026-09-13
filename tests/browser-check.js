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

  assert.equal(await page.title(), "Housing Helper v1.2");
  assert.equal(await page.locator(".step-card:visible").count(), 1, "one input card is visible on desktop");
  assert.equal(await page.locator("#stepCounter").textContent(), "1 of 6");

  await page.locator("#hasSecondBuyer").check();
  assert.equal(await page.locator("#stepCounter").textContent(), "1 of 7");
  assert.equal(await page.locator("#stepRail button").count(), 8, "second buyer adds one guided step");

  await page.locator("#stepRail button").filter({ hasText: "Income" }).click();
  await page.locator("#incomeType").selectOption("selfEmployed");
  assert.equal(await page.locator("#incomeRecognition").inputValue(), "70", "variable income receives an editable planning scenario");

  await page.locator("#stepRail button").filter({ hasText: "Home" }).click();
  await page.locator("#purchasePrice").fill("1200000");
  await page.locator("#marketValue").fill("1000000");
  await page.locator("#purchasePrice").dispatchEvent("input");
  await page.locator("button[data-property='privateCondo']").click();
  await page.locator("#stepRail button").filter({ hasText: "Financing" }).click();
  await page.locator("button[data-loan='hdb']").click();
  assert.equal(await page.locator("#loanType").inputValue(), "bank", "invalid HDB route is not silently selected");
  assert.equal(await page.locator("button[data-loan].active").getAttribute("data-loan"), "bank", "financing shortcut matches calculation state");

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
  await page.screenshot({ path: path.resolve(__dirname, "../housing-helper-v1.2-desktop.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(url);
  assert.equal(await mobile.locator(".results").isVisible(), false, "mobile results wait until inputs are complete");
  assert.equal(await mobile.locator(".step-card:visible").count(), 1);
  for (let i = 0; i < 6; i += 1) await mobile.locator("#nextStep").click();
  assert.equal(await mobile.locator("#stepCounter").textContent(), "Results");
  assert.equal(await mobile.locator(".results").isVisible(), true);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth), 390, "mobile page has no horizontal overflow");
  await mobile.screenshot({ path: path.resolve(__dirname, "../housing-helper-v1.2-mobile.png"), fullPage: true });

  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  await browser.close();
  console.log("Housing Helper browser checks passed");
})().catch((error) => { console.error(error); process.exit(1); });
