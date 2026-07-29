import { chromium } from "playwright";
const base = "http://localhost:3000";
const shotDir = "C:/Users/Surface/AppData/Local/Temp/claude/d--website-Wholesale/d6476f0c-fc6f-4928-a240-6b9c088c0c45/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 300 } });
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.click('header button:has-text("Login")');
await page.waitForSelector("text=Mobile Number / Email");
const modal = page.locator(".fixed.inset-0");
await modal.locator("input").nth(0).fill("demo.customer@example.com");
await modal.locator("input").nth(1).fill("Demo@123");
await modal.locator('button[type="submit"]').click();
await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500);

await page.locator("header").first().screenshot({ path: `${shotDir}/header-restyled-home.png` });

await page.goto(base + "/account/orders", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.locator("header").first().screenshot({ path: `${shotDir}/header-restyled-account.png` });

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
console.log("overflow:", overflow);

await browser.close();
console.log("done");
