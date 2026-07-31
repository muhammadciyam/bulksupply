import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });

page.on("pageerror", (err) => console.log("[page error]", err.message));
page.on("console", (msg) => { if (msg.type() === "error") console.log("[console error]", msg.text()); });

await page.goto("http://localhost:3000/admin/login");
await page.fill('input[type="email"]', "admin@bulksupply.mv");
await page.fill('input[type="password"]', "Admin@123");
await Promise.all([
  page.waitForURL((u) => u.pathname === "/admin", { timeout: 15000 }),
  page.click('button[type="submit"]'),
]);

// Fill in Business Details via the real Settings UI first.
await page.goto("http://localhost:3000/admin/settings", { waitUntil: "networkidle", timeout: 30000 });
const settingsForm = page.locator('form:has(input[name="businessName"])');
await settingsForm.locator('input[name="businessName"]').fill("Bulk Supply Pvt Ltd");
await settingsForm.locator('input[name="businessAddress"]').fill("H. Sunny Side, Boduthakurufaanu Magu, Male' 20095, Maldives");
await settingsForm.locator('input[name="businessPhone"]').fill("+960 330-1234");
await settingsForm.locator('input[name="businessEmail"]').fill("sales@bulksupply.mv");
await settingsForm.locator('input[name="businessGstNo"]').fill("GST-MV-100234");
await settingsForm.locator('button[type="submit"]').click();
await page.waitForTimeout(800);
console.log("Business details saved.");

await page.goto("http://localhost:3000/account/orders/cms8wvjx50003jl04660i1ass/invoice", { waitUntil: "networkidle", timeout: 30000 });
console.log("URL:", page.url());
await page.screenshot({ path: "C:\\Users\\Surface\\AppData\\Local\\Temp\\claude\\d--website-bulksupply\\037cb7aa-dbd9-4b06-ba32-606585e694e9\\scratchpad\\invoice_with_business_details.png", fullPage: true });
console.log("Screenshot saved (with business details).");

// Emulate print media to confirm the print stylesheet still works.
await page.emulateMedia({ media: "print" });
await page.screenshot({ path: "C:\\Users\\Surface\\AppData\\Local\\Temp\\claude\\d--website-bulksupply\\037cb7aa-dbd9-4b06-ba32-606585e694e9\\scratchpad\\invoice_print_preview.png", fullPage: true });
console.log("Print-preview screenshot saved.");

await browser.close();
