import { chromium } from "playwright";

const base = "http://localhost:3000";
const browser = await chromium.launch();

async function findOverflow(url, label, setup) {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  if (setup) await setup(page);
  await page.goto(base + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const culprits = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const all = document.querySelectorAll("*");
    const results = [];
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > vw + 2 || rect.left < -2) {
        results.push({
          tag: el.tagName,
          cls: (el.className || "").toString().slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        });
      }
    }
    return results.slice(0, 15);
  });
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(culprits, null, 2));
  await page.close();
}

await findOverflow("/", "home");
await findOverflow("/cart", "cart");
await findOverflow("/account/orders", "orders", async (page) => {
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.click("text=Login / Register");
  await page.waitForSelector("text=Mobile Number / Email");
  const modal = page.locator(".fixed.inset-0");
  await modal.locator("input").nth(0).fill("demo.customer@example.com");
  await modal.locator("input").nth(1).fill("Demo@123");
  await modal.locator('button[type="submit"]').click();
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
});

await browser.close();
