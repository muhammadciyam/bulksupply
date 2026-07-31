const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");

  await page.click('button:has-text("Categories")');
  await page.waitForSelector('h3:has-text("Categories")', { timeout: 5000 });
  // Scope to the drawer sheet specifically (the rounded-t-2xl panel)
  await page.click('.rounded-t-2xl >> text=Dairy');
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: process.argv[2] });
  console.log("done");
  await browser.close();
})();
