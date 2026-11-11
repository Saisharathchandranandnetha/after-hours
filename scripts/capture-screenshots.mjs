import { chromium, devices } from "@playwright/test";

async function run() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ channel: "chrome" });

  // Desktop view
  console.log("Capturing Desktop screenshot...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: "desktop-studio.png", fullPage: true });

  // Mobile view
  console.log("Capturing Mobile screenshot...");
  const mobileContext = await browser.newContext({
    ...devices["Pixel 7"],
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await mobilePage.screenshot({ path: "mobile-studio.png", fullPage: true });

  await browser.close();
  console.log("Screenshots captured successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
