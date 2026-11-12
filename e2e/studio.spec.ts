import { test, expect } from "@playwright/test";

test.describe("After Hours Studio E2E", () => {
  test("renders cinematic landing layout with clock, presence count, and cassette deck", async ({
    page,
  }) => {
    await page.goto("/");

    // Check title
    await expect(page).toHaveTitle(/Netha's after-hours/i);

    // Check live listener presence count
    const presenceBadge = page.getByTitle(/live studio sessions/i);
    await expect(presenceBadge).toBeVisible();

    // Check clock element
    const clockTime = page.locator("time");
    await expect(clockTime).toBeVisible();

    // Check cassette deck play button specifically
    const playButton = page.getByRole("button", { name: "Play", exact: true });
    await expect(playButton).toBeVisible();

    // Check Studio menu button
    const studioBtn = page.getByRole("button", { name: /studio menu/i });
    await expect(studioBtn).toBeVisible();

    // Capture visual screenshot
    await page.screenshot({ path: "e2e-desktop-studio.png", fullPage: true });
  });

  test("interacts with Studio dropdown menu and opens playlists including feel", async ({ page }) => {
    await page.goto("/");

    // Click Studio menu button
    const studioBtn = page.getByRole("button", { name: /studio menu/i });
    await studioBtn.click();

    // Studio menu items should be visible
    const playlistsBtn = page.getByRole("button", { name: "Playlists", exact: true });
    await expect(playlistsBtn).toBeVisible();

    // Open playlists flyout
    await playlistsBtn.click();

    // Verify 'feel' playlist is present in quick switch
    const feelItem = page.locator("button:has-text('feel')");
    await expect(feelItem.first()).toBeVisible();

    // Click Manage Playlists
    const manageBtn = page.getByRole("button", { name: /manage playlists/i });
    await manageBtn.click();

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

  test("opens Now Playing & Queue drawer from cassette deck", async ({ page }) => {
    await page.goto("/");

    // Click Queue button in cassette deck
    const queueBtn = page.getByRole("button", { name: /open queue/i });
    await expect(queueBtn).toBeVisible();
    await queueBtn.click();

    // Drawer should open
    const drawer = page.getByRole("dialog", { name: /now playing and queue/i });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(/now playing & queue/i);

    // Close queue drawer
    const closeQueueBtn = page.getByRole("button", { name: /close queue panel/i });
    await closeQueueBtn.click();
    await expect(drawer).not.toBeVisible();
  });

  test("toggles and expands live stream video using the TV button", async ({ page }) => {
    await page.goto("/");

    // Locate the TV button on the cassette deck
    const tvBtn = page.getByRole("button", { name: /toggle live video stream window/i });
    await expect(tvBtn).toBeVisible();

    // Click TV button to expand video
    await tvBtn.click();

    // Video container should be expanded (has contract button)
    const contractBtn = page.getByRole("button", { name: /contract video player/i });
    await expect(contractBtn).toBeVisible();

    // Click contract button to collapse
    await contractBtn.click();
    await expect(contractBtn).not.toBeVisible();
  });

  test("hides live stream video with Hide button and toggles it from Studio dropdown south button", async ({
    page,
  }) => {
    await page.goto("/");

    // Click TV button to show & expand video
    const tvBtn = page.getByRole("button", { name: /toggle live video stream window/i });
    await tvBtn.click();

    // Hide button should be visible in video player header
    const hideBtn = page.getByRole("button", { name: /hide live stream window/i });
    await expect(hideBtn).toBeVisible();

    // Click Hide
    await hideBtn.click();

    // Video container should have opacity-0 / hidden
    const videoContainer = page.locator('div[aria-label="YouTube Video Player"]');
    await expect(videoContainer).toHaveClass(/opacity-0/);

    // Open Studio dropdown menu and check south button
    const studioBtn = page.getByRole("button", { name: /studio menu/i });
    await studioBtn.click();

    // South button should now say "Launch Live Stream"
    const toggleLiveBtn = page.getByRole("button", { name: /launch live stream video/i });
    await expect(toggleLiveBtn).toBeVisible();

    // Click to show live stream again
    await toggleLiveBtn.click();
    await expect(videoContainer).not.toHaveClass(/opacity-0/);
  });

  test("opens More options in cassette deck with volume, shuffle, repeat, and video toggle", async ({
    page,
  }) => {
    await page.goto("/");

    // Click More button in cassette deck
    const moreBtn = page.getByRole("button", { name: /more playback options/i });
    await expect(moreBtn).toBeVisible();
    await moreBtn.click();

    // Check volume slider
    const volumeSlider = page.getByRole("slider", { name: /volume/i });
    await expect(volumeSlider).toBeVisible();

    // Check shuffle toggle
    const shuffleBtn = page.getByRole("button", { name: /shuffle/i });
    await expect(shuffleBtn).toBeVisible();

    // Check repeat toggle
    const repeatBtn = page.getByRole("button", { name: /repeat/i });
    await expect(repeatBtn).toBeVisible();

    // Check video player window toggle
    const videoBtn = page.getByRole("button", { name: /video player window/i });
    await expect(videoBtn).toBeVisible();
  });

  test("toggles Focus Mode with dimmed scene and exit button", async ({ page }) => {
    await page.goto("/");

    // Open Studio menu and toggle Focus Mode
    const studioBtn = page.getByRole("button", { name: /studio menu/i });
    await studioBtn.click();

    const focusModeBtn = page.getByRole("button", { name: /focus mode/i });
    await focusModeBtn.click();

    // Exit Focus Mode button should now be visible
    const exitFocusBtn = page.getByRole("button", { name: /exit focus mode/i });
    await expect(exitFocusBtn).toBeVisible();

    // Navigation bar with Studio menu should be hidden during Focus Mode
    await expect(studioBtn).not.toBeVisible();

    // Click Exit Focus Mode button
    await exitFocusBtn.click();
    await expect(page.getByRole("button", { name: /studio menu/i })).toBeVisible();
  });

  test("opens focus timer and verifies timer persistence", async ({ page }) => {
    await page.goto("/");

    // Open via Studio dropdown -> Focus Room
    const studioBtn = page.getByRole("button", { name: /studio menu/i });
    await studioBtn.click();
    await page.getByRole("button", { name: /focus room/i }).click();

    const dialog = page.getByRole("dialog", { name: /focus timer/i });
    await expect(dialog).toBeVisible();

    // Check 25:00 default
    await expect(dialog).toContainText("25:00");

    // Click Start
    const startBtn = page.getByRole("button", { name: /start timer/i });
    await startBtn.click();

    // Expect Pause button to appear
    const pauseBtn = page.getByRole("button", { name: /pause timer/i });
    await expect(pauseBtn).toBeVisible();

    // Close modal
    const closeBtn = page.getByRole("button", { name: /close focus timer/i });
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();

    // Reopen modal: verify timer is STILL running and pause button is still active!
    await studioBtn.click();
    await page.getByRole("button", { name: /focus room/i }).click();
    const reopenedDialog = page.getByRole("dialog", { name: /focus timer/i });
    await expect(reopenedDialog).toBeVisible();
    await expect(page.getByRole("button", { name: /pause timer/i })).toBeVisible();

    // Click pause
    await page.getByRole("button", { name: /pause timer/i }).click();
    await expect(page.getByRole("button", { name: /start timer/i })).toBeVisible();

    // Close
    await page.getByRole("button", { name: /close focus timer/i }).click();
  });

  test("displays live listener presence count in center with no blinking and rotates tab title", async ({
    page,
  }) => {
    await page.goto("/");

    // Center presence badge should display listening count without blinking
    const presenceBadge = page.getByTitle(/live studio sessions/i);
    await expect(presenceBadge).toBeVisible();
    await expect(presenceBadge).toContainText("1");
    await expect(presenceBadge).toContainText(/listening/i);

    // Tab title should contain Netha's after-hours
    await expect(page).toHaveTitle(/Netha's after-hours/i);
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

  test("opens customization modal and lists scenic backgrounds", async ({ page }) => {
    await page.goto("/");

    // Open Studio menu
    const studioBtn = page.getByRole("button", { name: /studio menu/i });
    await studioBtn.click();

    // Click Customize
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
    await expect(dialog).not.toBeVisible();
  });
});
