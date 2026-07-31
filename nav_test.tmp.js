const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");

  await page.click('text=Orders');
  await page.waitForTimeout(500);
  const modalVisible = await page.locator('text=Login with your mobile number').count();
  console.log("AUTH_MODAL_SHOWN_FOR_ORDERS:", modalVisible > 0);
  console.log("URL_STAYED_ON_HOME:", page.url());
  await page.screenshot({ path: process.argv[2] });

  await browser.close();
})();
