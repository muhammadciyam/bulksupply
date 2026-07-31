const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto("http://localhost:3000/admin/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', "admin@bulksupply.mv");
  await page.fill('input[type="password"]', "Admin@123");
  await page.locator("button", { hasText: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname === "/admin", { timeout: 8000 });

  // 1. Create a subcategory under "Wipes & Diapers" in admin.
  await page.goto("http://localhost:3000/admin/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const subName = `TestSub${Date.now()}`;
  await page.fill('input[placeholder="New category name"]', subName);
  await page.selectOption("select", { label: "Subcategory of Wipes & Diapers" });
  await page.locator("button", { hasText: "Add" }).first().click();
  await page.waitForTimeout(1200);
  console.log("Subcategory created, visible in admin:", await page.locator("span", { hasText: subName }).count() > 0);

  // 2. Verify it appears nested on the storefront desktop sidebar.
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const sidebarLink = page.locator("aside a", { hasText: subName });
  console.log("Subcategory visible in desktop sidebar:", await sidebarLink.count() > 0);

  // 3. Try deleting the PARENT "Wipes & Diapers" - should fail (has subcategory + products).
  await page.goto("http://localhost:3000/admin/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const parentChip = page.locator("span.rounded-full", { hasText: "Wipes & Diapers" });
  const chipCountBefore = await page.locator("span.rounded-full").count();
  await parentChip.locator("button").click();
  await page.waitForTimeout(1500);
  const chipCountAfter = await page.locator("span.rounded-full").count();
  console.log("Chip count before delete attempt:", chipCountBefore, "after (expect same, rollback):", chipCountAfter);
  console.log("Error shown:", await page.locator(".text-brand-red").allTextContents());

  // 4. Clean up: remove the test subcategory (should succeed, no products/children).
  const subChip = page.locator("span.rounded-full", { hasText: subName });
  if (await subChip.count()) {
    await subChip.locator("button").click();
    await page.waitForTimeout(1200);
    console.log("Subcategory removed after cleanup:", (await page.locator("span.rounded-full", { hasText: subName }).count()) === 0);
  }

  await browser.close();
})().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
