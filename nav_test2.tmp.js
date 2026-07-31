const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");

  const ordersLink = page.locator('nav a', { hasText: "Orders" });
  console.log("ORDERS_LINK_COUNT:", await ordersLink.count());
  console.log("ORDERS_HREF:", await ordersLink.getAttribute("href"));

  await ordersLink.click();
  await page.waitForTimeout(800);

  const modalCount = await page.locator('.fixed.inset-0.z-50').count();
  console.log("MODAL_OVERLAY_COUNT:", modalCount);
  const bodyText = await page.textContent("body");
  console.log("HAS_LOGIN_TEXT:", bodyText.includes("Login") && bodyText.includes("account"));
  await page.screenshot({ path: process.argv[2] });
  await browser.close();
})();
