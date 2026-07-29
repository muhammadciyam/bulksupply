import { chromium } from "playwright";
const base = "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.click('header button:has-text("Login")');
await page.waitForSelector("text=Mobile Number / Email");
const modal = page.locator(".fixed.inset-0");
await modal.locator("input").nth(0).fill("demo.customer@example.com");
await modal.locator("input").nth(1).fill("Demo@123");
await modal.locator('button[type="submit"]').click();
await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1000);

for (let i = 0; i < 5; i++) {
  const res = await page.goto(base + "/account/orders", { waitUntil: "networkidle" });
  console.log(`attempt ${i}: status=${res.status()}`);
  await page.waitForTimeout(300);
}

for (const p of ["/account/profile", "/account/accounts", "/account/orders"]) {
  const res = await page.goto(base + p, { waitUntil: "networkidle" });
  console.log(p, "->", res.status());
}

console.log("errors:", JSON.stringify(errors, null, 2));
await browser.close();
