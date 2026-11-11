import { test, expect } from "@playwright/test";

test.describe("After Hours Studio E2E", () => {
  test("renders cinematic landing layout with clock, editorial title, and cassette deck", async ({
    page,
  }) => {
    await page.goto("/");

    // Check title
    await expect(page).toHaveTitle(/After Hours/i);

    // Check editorial heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/late night coding/i);

    // Check subtitle
    const subtitle = page.locator("text=somewhere between ideas and execution");
    await expect(subtitle).toBeVisible();

    // Check clock element
    const clockTime = page.locator("time");
    await expect(clockTime).toBeVisible();

    // Check cassette deck play button specifically
    const playButton = page.getByRole("button", { name: "Play", exact: true });
    await expect(playButton).toBeVisible();

    // Capture visual screenshot
    await page.screenshot({ path: "e2e-desktop-studio.png", fullPage: true });
  });

  test("opens clock customization modal and changes format", async ({ page }) => {
    await page.goto("/");

    // Click clock to open settings
    const clock = page.locator("time");
    await clock.click();

    // Expect modal to be visible
    const modal = page.getByRole("dialog", { name: /clock customization/i });
    await expect(modal).toBeVisible();

    // Toggle 24-hour format
    const format24Btn = page.getByRole("button", { name: /24-hour format/i });
    await format24Btn.click();

    // Close modal
    const doneBtn = page.getByRole("button", { name: /done/i });
    await doneBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test("opens playlist library modal and displays playlists", async ({ page }) => {
    await page.goto("/");

    // Click Playlists button
    const playlistsBtn = page.getByRole("button", { name: /manage playlists/i });
    await playlistsBtn.click();

    const dialog = page.getByRole("dialog", { name: /playlist manager/i });
    await expect(dialog).toBeVisible();

    // Expect presets like Deep Focus, Research Sessions
    await expect(dialog.locator("text=Deep Focus")).toBeVisible();
    await expect(dialog.locator("text=Research Sessions")).toBeVisible();

    // Close dialog
    const closeBtn = page.getByRole("button", { name: /close playlists/i });
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test("opens focus timer modal and can start pomodoro", async ({ page }) => {
    await page.goto("/");

    // Click Timer button
    const timerBtn = page.getByRole("button", { name: /focus timer/i });
    await timerBtn.click();

    const dialog = page.getByRole("dialog", { name: /focus timer/i });
    await expect(dialog).toBeVisible();

    // Check 25:00 default
    await expect(dialog).toContainText("25:00");

    // Click Start
    const startBtn = page.getByRole("button", { name: /start timer/i });
    await startBtn.click();

    // Expect to switch to Pause
    const pauseBtn = page.getByRole("button", { name: /pause timer/i });
    await expect(pauseBtn).toBeVisible();

    // Close
    const closeBtn = page.getByRole("button", { name: /close focus timer/i });
    await closeBtn.click();
  });

  test("opens customization modal and lists scenic backgrounds", async ({ page }) => {
    await page.goto("/");

    // Click Customize button
    const customizeBtn = page.getByRole("button", { name: /customize studio/i });
    await customizeBtn.click();

    const dialog = page.getByRole("dialog", { name: /studio personalization/i });
    await expect(dialog).toBeVisible();

    // Expect scenic backgrounds
    await expect(dialog).toContainText("Studio Desk (Default)");
    await expect(dialog).toContainText("Warm Amber Lamp");

    // Close
    const doneBtn = page.getByRole("button", { name: /done/i });
    await doneBtn.click();
  });
});
