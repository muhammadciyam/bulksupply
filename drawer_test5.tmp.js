const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  await page.goto("http://localhost:3000/?category=dairy");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: process.argv[2] });
  const bodyText = await page.textContent("body");
  console.log("HAS_NO_PRODUCTS_MSG:", bodyText.includes("No products found"));
  console.log("HAS_DAIRY_CHIP:", bodyText.includes("DAIRY"));
  await browser.close();
})();
