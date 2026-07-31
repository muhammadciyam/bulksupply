const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));

  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");

  await page.click('button:has-text("Categories")');
  await page.waitForSelector('h3:has-text("Categories")', { timeout: 5000 });
  await page.locator('.rounded-t-2xl a', { hasText: "Dairy" }).click();
  await page.waitForTimeout(2000);
  console.log("URL after 2s wait:", await page.evaluate(() => window.location.href));
  console.log("CONSOLE_ERRORS:", JSON.stringify(errors));
  await browser.close();
})();
