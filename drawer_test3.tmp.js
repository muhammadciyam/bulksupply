const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");

  await page.click('button:has-text("Categories")');
  await page.waitForSelector('h3:has-text("Categories")', { timeout: 5000 });
  const links = await page.locator('.rounded-t-2xl a').allTextContents();
  console.log("DRAWER_LINKS:", JSON.stringify(links));
  const hrefs = await page.locator('.rounded-t-2xl a').evaluateAll(els => els.map(e => e.getAttribute('href')));
  console.log("DRAWER_HREFS:", JSON.stringify(hrefs));

  await page.locator('.rounded-t-2xl a', { hasText: "Dairy" }).click();
  await page.waitForLoadState("networkidle");
  console.log("URL_AFTER_CLICK:", page.url());
  await browser.close();
})();
