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

  // Create a subcategory under Wipes & Diapers.
  await page.goto("http://localhost:3000/admin/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const subName = `FilterTestSub${Date.now()}`;
  await page.fill('input[placeholder="New category name"]', subName);
  await page.selectOption("select", { label: "Subcategory of Wipes & Diapers" });
  await page.locator("button", { hasText: "Add" }).first().click();
  await page.waitForTimeout(1200);

  // Count products currently shown for the PARENT category on the storefront (baseline).
  async function countStorefront(slug) {
    await page.goto(`http://localhost:3000/?category=${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    const noneText = await page.locator("text=No products found").count();
    if (noneText > 0) return 0;
    return await page.locator('a[href^="/product/"]').count().catch(() => page.locator(".grid > div").count());
  }

  const parentSlugMatch = subName; // we need the actual slugs; fetch via admin edit page select instead

  // Find one existing product currently in "Wipes & Diapers" and move it into the new subcategory.
  await page.goto("http://localhost:3000/admin/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const row = page.locator("tbody tr", { hasText: "Wipes & Diapers" }).first();
  const productName = await row.locator("td").first().locator("p").first().textContent();
  console.log("Test product:", productName);
  await row.locator("a", { hasText: "Edit" }).click();
  await page.waitForTimeout(800);
  console.log("Edit page URL:", page.url());

  // Record original category selection, then switch to the new subcategory and save.
  const select = page.locator('select[name="categoryId"]');
  const originalValue = await select.inputValue();
  await select.selectOption({ label: subName.trim() });
  await page.locator('button[type="submit"]', { hasText: /Save/ }).first().click();
  await page.waitForTimeout(1200);
  console.log("URL after saving product with new subcategory:", page.url());

  // Now check the storefront: get the subcategory's slug and the parent's slug via admin sidebar hrefs.
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const subLinkHref = await page.locator("aside a", { hasText: subName }).getAttribute("href");
  const parentLinkHref = await page.locator("aside a", { hasText: "Wipes & Diapers" }).first().getAttribute("href");
  console.log("Subcategory link href:", subLinkHref, "| Parent link href:", parentLinkHref);

  await page.goto(`http://localhost:3000${subLinkHref}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const subPageHasProduct = await page.locator("body").innerText();
  console.log("Product visible under SUBCATEGORY filter:", subPageHasProduct.includes(productName.trim()));

  await page.goto(`http://localhost:3000${parentLinkHref}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const parentPageText = await page.locator("body").innerText();
  console.log("Product visible under PARENT filter (should include subcategory products):", parentPageText.includes(productName.trim()));

  // Cleanup: move product back to its original category, then delete the test subcategory.
  await page.goto("http://localhost:3000/admin/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const row2 = page.locator("tbody tr", { hasText: productName.trim() }).first();
  await row2.locator("a", { hasText: "Edit" }).click();
  await page.waitForTimeout(800);
  await page.locator('select[name="categoryId"]').selectOption(originalValue);
  await page.locator('button[type="submit"]', { hasText: /Save/ }).first().click();
  await page.waitForTimeout(1200);
  console.log("Product category reverted, URL:", page.url());

  await page.goto("http://localhost:3000/admin/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const subChip = page.locator("span.rounded-full", { hasText: subName });
  if (await subChip.count()) {
    await subChip.locator("button").click();
    await page.waitForTimeout(1200);
    console.log("Test subcategory removed:", (await page.locator("span.rounded-full", { hasText: subName }).count()) === 0);
  }

  await browser.close();
})().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
