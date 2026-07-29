import { chromium } from "playwright";

const base = "http://localhost:3000";
const shotDir = "C:/Users/Surface/AppData/Local/Temp/claude/d--website-Wholesale/d6476f0c-fc6f-4928-a240-6b9c088c0c45/scratchpad/audit";
import { mkdirSync } from "fs";
mkdirSync(shotDir, { recursive: true });

const viewports = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

const browser = await chromium.launch();

async function shotPage(name, path, opts = {}) {
  for (const [vpName, vp] of Object.entries(viewports)) {
    const page = await browser.newPage({ viewport: vp });
    if (opts.loginAs) {
      await page.goto(base + "/admin/login", { waitUntil: "networkidle" });
      const inputs = await page.$$("input");
      await inputs[0].fill(opts.loginAs.email);
      await inputs[1].fill(opts.loginAs.password);
      await page.click('button:has-text("Sign in")');
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }
    if (opts.loginCustomer) {
      await page.goto(base + "/", { waitUntil: "networkidle" });
      await page.click("text=Login / Register");
      await page.waitForSelector("text=Mobile Number / Email");
      const modal = page.locator(".fixed.inset-0");
      await modal.locator("input").nth(0).fill(opts.loginCustomer.email);
      await modal.locator("input").nth(1).fill(opts.loginCustomer.password);
      await modal.locator('button[type="submit"]').click();
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    // check for horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    if (overflow) console.log(`[OVERFLOW] ${name} @ ${vpName} (${vp.width}px)`);
    await page.screenshot({ path: `${shotDir}/${name}-${vpName}.png`, fullPage: true });
    await page.close();
  }
}

await shotPage("home", "/");
await shotPage("cart", "/cart");
await shotPage("orders", "/account/orders", { loginCustomer: { email: "demo.customer@example.com", password: "Demo@123" } });
await shotPage("accounts", "/account/accounts", { loginCustomer: { email: "demo.customer@example.com", password: "Demo@123" } });
await shotPage("admin-login", "/admin/login");
await shotPage("admin-dashboard", "/admin", { loginAs: { email: "admin@bulksupply.mv", password: "Admin@123" } });
await shotPage("admin-products", "/admin/products", { loginAs: { email: "admin@bulksupply.mv", password: "Admin@123" } });
await shotPage("admin-orders", "/admin/orders", { loginAs: { email: "admin@bulksupply.mv", password: "Admin@123" } });

await browser.close();
console.log("done");
