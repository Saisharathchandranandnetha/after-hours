import { describe, it, expect, beforeEach } from "vitest";
import { useSettings } from "@/lib/settings";

describe("Focus Timer State & Preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettings.getState().resetAll();
  });

  it("initializes with default focus durations", () => {
    const { timer } = useSettings.getState();
    expect(timer.pomodoroDuration).toBe(25 * 60);
    expect(timer.shortBreakDuration).toBe(5 * 60);
    expect(timer.longBreakDuration).toBe(15 * 60);
    expect(timer.soundEnabled).toBe(true);
    expect(timer.notificationEnabled).toBe(true);
    expect(timer.completedSessions).toBe(0);
  });

  it("updates timer duration and persists", () => {
    useSettings.getState().updateTimer({
      pomodoroDuration: 30 * 60,
      shortBreakDuration: 10 * 60,
    });

    const { timer } = useSettings.getState();
    expect(timer.pomodoroDuration).toBe(1800);
    expect(timer.shortBreakDuration).toBe(600);

    // Rehydrate
    useSettings.getState().hydrate();
    expect(useSettings.getState().timer.pomodoroDuration).toBe(1800);
  });

  it("increments completed sessions upon completion", () => {
    expect(useSettings.getState().timer.completedSessions).toBe(0);

    useSettings.getState().updateTimer({
      completedSessions: 1,
    });
    expect(useSettings.getState().timer.completedSessions).toBe(1);

    useSettings.getState().updateTimer({
      completedSessions: 4,
    });
    expect(useSettings.getState().timer.completedSessions).toBe(4);
  });
});
