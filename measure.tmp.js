const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");
  const info = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  console.log(JSON.stringify(info));

  // find the widest element
  const widest = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("*"));
    let max = { width: 0 };
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.right > (max.right || 0) && r.width > 0) {
        max = { tag: el.tagName, cls: el.className, right: r.right, width: r.width, left: r.left };
      }
    }
    return max;
  });
  console.log("WIDEST/RIGHTMOST:", JSON.stringify(widest));
  await browser.close();
})();
