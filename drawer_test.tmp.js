const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");

  await page.click('button:has-text("Categories")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: process.argv[2] });

  // click a category
  await page.click('text=Dairy');
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: process.argv[3] });

  await browser.close();
})();
