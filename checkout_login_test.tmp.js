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

    // Now register a fresh test account from this same /login page, then log in
    // with it, and confirm we land back on /cart (the original checkout target).
    const stamp = Date.now();
    const email = `test${stamp}@example.com`;
    const phone = `77${stamp.toString().slice(-6)}`;

    await page.locator("button", { hasText: "Register" }).click();
    await page.waitForTimeout(200);
    await page.fill('input[placeholder="First Name"]', "Test");
    await page.fill('input[placeholder="Last Name"]', "User");
    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Contact Number"]', phone);
    await page.fill('input[placeholder="Password"]', "Password123!");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(800);
    console.log("URL after register (still /login, switched back to login mode):", page.url());
    console.log("Page text after register submit:", (await page.locator("main, body").first().innerText()).slice(0, 400));
    await page.screenshot({ path: "after_register.png" });

    const loginInputs = page.locator("form input");
    console.log("Number of form inputs visible now:", await loginInputs.count());
    await loginInputs.nth(0).fill(email);
    await loginInputs.nth(1).fill("Password123!");
    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForURL((u) => u.pathname === "/cart", { timeout: 8000 });
      console.log("Redirected to /cart successfully:", page.url());
    } catch (e) {
      console.log("Did NOT redirect to /cart within 8s. Current URL:", page.url());
    }
    console.log("Page text after login submit:", (await page.locator("body").innerText()).slice(0, 400));
    await page.screenshot({ path: "after_login.png" });
  } else {
    console.log("Cart was empty, skipping checkout click test.");
  }

  await browser.close();
})().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
