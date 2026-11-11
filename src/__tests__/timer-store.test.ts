import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTimerStore } from "@/lib/timer-store";

describe("Timer Store Engine", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"],
    });
    useTimerStore.getState().selectMode("pomodoro");
    useTimerStore.getState().reset();
  });

  it("initializes with default pomodoro mode (25 minutes)", () => {
    const state = useTimerStore.getState();
    expect(state.mode).toBe("pomodoro");
    expect(state.isRunning).toBe(false);
    expect(state.seconds).toBe(25 * 60);
  });

  it("starts and pauses accurately preserving exact seconds for resume", () => {
    const store = useTimerStore.getState();
    store.start();

    // Advance 5 seconds via tick
    store.tick(5);

    const runningState = useTimerStore.getState();
    expect(runningState.isRunning).toBe(true);
    expect(runningState.seconds).toBe(25 * 60 - 5);

    const pausedSeconds = runningState.seconds;

    // Pause timer
    runningState.pause();
    expect(useTimerStore.getState().isRunning).toBe(false);

    // Calling tick while paused must NOT change seconds
    useTimerStore.getState().tick(10);
    expect(useTimerStore.getState().seconds).toBe(pausedSeconds);

    // Resume timer - resumes from pausedSeconds
    useTimerStore.getState().start();
    expect(useTimerStore.getState().isRunning).toBe(true);

    useTimerStore.getState().tick(2);
    expect(useTimerStore.getState().seconds).toBe(pausedSeconds - 2);
  });

  it("switches modes and updates target duration", () => {
    const store = useTimerStore.getState();
    store.selectMode("short-break");

    const state = useTimerStore.getState();
    expect(state.mode).toBe("short-break");
    expect(state.seconds).toBe(5 * 60);
    expect(state.isRunning).toBe(false);
  });

  it("resets to initial mode duration", () => {
    const store = useTimerStore.getState();
    store.start();
    vi.advanceTimersByTime(10000);

    store.reset();
    const state = useTimerStore.getState();
    expect(state.isRunning).toBe(false);
    expect(state.seconds).toBe(25 * 60);
  });
});
