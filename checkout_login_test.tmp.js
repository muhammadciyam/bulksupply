const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  // Add a product to cart via localStorage-backed store, then visit cart directly.
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(500);

  // Click first "Add to cart" style button on a product card if present.
  const addBtn = page.locator('button[aria-label="Add to cart"]').first();
  if (await addBtn.count()) {
    await addBtn.click();
    await page.waitForTimeout(300);
  }

  await page.goto("http://localhost:3000/cart");
  await page.waitForTimeout(500);

  const placeOrderBtn = page.locator("button", { hasText: "Place Order" });
  const hasButton = await placeOrderBtn.count();
  console.log("Place Order button present:", hasButton > 0);

  if (hasButton > 0) {
    await placeOrderBtn.click();
    await page.waitForTimeout(800);
    console.log("URL after clicking Place Order (not logged in):", page.url());
    console.log("Navigated to /login (not overlay):", page.url().includes("/login?redirect=%2Fcart") || page.url().includes("/login?redirect=/cart"));
    console.log("Modal close (X) button present (should be false, full page has none):", await page.locator('button[aria-label="Close"]').count());
    console.log("Cart page content still visible (should be false):", await page.locator("text=Your Cart").count());
    await page.screenshot({ path: "checkout_login_redirect.png" });
  } else {
    console.log("Cart was empty, skipping checkout click test.");
  }

  await browser.close();
})().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
