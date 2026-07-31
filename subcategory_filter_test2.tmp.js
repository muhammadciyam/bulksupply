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

  await page.goto("http://localhost:3000/admin/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const subName = `FilterTest2_${Date.now()}`;
  await page.fill('input[placeholder="New category name"]', subName);
  await page.selectOption("select", { label: "Subcategory of Wipes & Diapers" });
  await page.locator("button", { hasText: "Add" }).first().click();
  await page.waitForTimeout(1500);
  console.log("Subcategory created:", await page.locator("span", { hasText: subName }).count() > 0);

  const productName = "PureTouch Antibacterial Wipes Fragrance Free (80's)";
  const row = page.locator("tbody tr", { hasText: productName }).first();
  await row.locator("a", { hasText: "Edit" }).click();
  await page.waitForURL((u) => /\/admin\/products\/[a-z0-9]+$/.test(u.pathname), { timeout: 8000 });
  console.log("On edit page:", page.url());

  const select = page.locator('select[name="categoryId"]');
  const originalValue = await select.inputValue();
  console.log("Original categoryId:", originalValue);
  await select.selectOption({ label: subName });
  const selectedNow = await select.inputValue();
  console.log("Select now has value:", selectedNow, "(should differ from original)");
  await page.locator('button[type="submit"]', { hasText: "Save Changes" }).click();
  await page.waitForTimeout(2000);
  console.log("After save, URL:", page.url());

  // Give cache revalidation plenty of time, then check the storefront.
  await page.waitForTimeout(1500);
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const subHref = await page.locator("aside a", { hasText: subName }).getAttribute("href");
  const parentHref = await page.locator("aside a", { hasText: "Wipes & Diapers" }).first().getAttribute("href");
  console.log("subHref:", subHref, "parentHref:", parentHref);

  await page.goto(`http://localhost:3000${subHref}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  console.log("Under SUBCATEGORY filter, product present:", (await page.locator("body").innerText()).includes(productName));

  await page.goto(`http://localhost:3000${parentHref}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  console.log("Under PARENT filter, product present:", (await page.locator("body").innerText()).includes(productName));

  // Sibling category sanity check: product should NOT show under an unrelated category.
  await page.goto("http://localhost:3000/?category=personal-care", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  console.log("Under UNRELATED category (personal-care), product present (should be false):", (await page.locator("body").innerText()).includes(productName));

  // Cleanup: revert product category, delete test subcategory.
  await page.goto(`http://localhost:3000/admin/products/${page.url().match(/products\/([a-z0-9]+)/)?.[1] ?? ""}`).catch(() => {});
  await page.goto("http://localhost:3000/admin/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const row2 = page.locator("tbody tr", { hasText: productName }).first();
  await row2.locator("a", { hasText: "Edit" }).click();
  await page.waitForURL((u) => /\/admin\/products\/[a-z0-9]+$/.test(u.pathname), { timeout: 8000 });
  await page.locator('select[name="categoryId"]').selectOption(originalValue);
  await page.locator('button[type="submit"]', { hasText: "Save Changes" }).click();
  await page.waitForTimeout(1500);
  const revertedValue = await page.locator('select[name="categoryId"]').inputValue().catch(() => "?");
  console.log("Reverted categoryId:", revertedValue, "matches original:", revertedValue === originalValue);

  await page.goto("http://localhost:3000/admin/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const subChip = page.locator("span.rounded-full", { hasText: subName });
  await subChip.locator("button").click();
  await page.waitForTimeout(1200);
  console.log("Subcategory deleted:", (await page.locator("span.rounded-full", { hasText: subName }).count()) === 0);

  await browser.close();
})().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
