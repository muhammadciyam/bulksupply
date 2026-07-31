const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("https://bulksupply.raajje.net/admin/login");
  await page.fill('input[type="email"]', "siyante003@gmail.com");
  await page.fill('input[type="password"]', "229022#");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 20000 });

  await page.goto("https://bulksupply.raajje.net/admin/settings");
  await page.waitForSelector("text=Homepage Banners", { timeout: 20000 });
  await page.screenshot({ path: process.argv[2] });

  // Try adding a banner image via URL to the first banner slot
  const card = page.locator(".border.border-gray-200.rounded-lg.p-4", { hasText: "New Season Deals" });
  await card.locator('input[name="imageUrl"]').fill("https://www.gstatic.com/webp/gallery/1.jpg");
  await card.locator('button:has-text("Add Image")').click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: process.argv[3] });

  console.log("CONSOLE_ERRORS:", JSON.stringify(errors));
  await browser.close();
})();
