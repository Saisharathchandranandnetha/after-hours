import { create } from "zustand";
import { soundEffects } from "@/lib/sound-effects";
import { useSettings, type TimerMode } from "@/lib/settings";

export type TimerStoreState = {
  mode: TimerMode;
  isRunning: boolean;
  seconds: number;
  targetDuration: number;
  completedSessions: number;

  selectMode: (mode: TimerMode) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setCustomTime: (totalSecs: number) => void;
  tick: (customElapsedSec?: number) => void;
};

let timerInterval: ReturnType<typeof setInterval> | null = null;
let startTimeMs: number | null = null;
let baseSeconds = 25 * 60;

function clearStoreInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  startTimeMs = null;
}

export const useTimerStore = create<TimerStoreState>((set, get) => {
  const settings = useSettings.getState().timer;
  const initialDuration = settings.pomodoroDuration || 25 * 60;
  baseSeconds = initialDuration;

  const triggerCompletion = (mode: TimerMode) => {
    clearStoreInterval();
    set({ isRunning: false, seconds: 0 });

    const curSettings = useSettings.getState().timer;

    if (curSettings.soundEnabled) {
      soundEffects.playTimerCompletion();
    }

    if (
      curSettings.notificationEnabled &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const title =
        mode === "pomodoro"
          ? "Focus Session Complete! 🎯"
          : "Break Ended! Ready to focus? ⚡";
      const body =
        mode === "pomodoro"
          ? "Great job shipping code! Take a restful break."
          : "Break is over. Let's get back in the flow.";
      try {
        new Notification(title, { body, icon: "/favicon.ico" });
      } catch {}
    }

    if (mode === "pomodoro") {
      const nextCount = curSettings.completedSessions + 1;
      useSettings.getState().updateTimer({ completedSessions: nextCount });
      set({ completedSessions: nextCount });
    }
  };

  const getDurationForMode = (m: TimerMode): number => {
    const curSettings = useSettings.getState().timer;
    switch (m) {
      case "pomodoro":
        return curSettings.pomodoroDuration;
      case "short-break":
        return curSettings.shortBreakDuration;
      case "long-break":
        return curSettings.longBreakDuration;
      case "custom":
        return curSettings.customDuration;
      case "stopwatch":
        return 0;
    }
  };

  return {
    mode: "pomodoro",
    isRunning: false,
    seconds: initialDuration,
    targetDuration: initialDuration,
    completedSessions: settings.completedSessions || 0,

    selectMode: (newMode: TimerMode) => {
      clearStoreInterval();
      const dur = getDurationForMode(newMode);
      baseSeconds = dur;
      set({
        mode: newMode,
        isRunning: false,
        seconds: dur,
        targetDuration: dur,
      });
    },

    start: () => {
      if (get().isRunning) return;
      soundEffects.playClick("press");

      baseSeconds = get().seconds;
      startTimeMs = Date.now();

      clearStoreInterval();

      timerInterval = globalThis.setInterval(() => {
        get().tick();
      }, 250);

      set({ isRunning: true });
    },

    tick: (customElapsedSec?: number) => {
      if (!get().isRunning) return;
      const curMode = get().mode;
      const elapsedSec =
        customElapsedSec !== undefined
          ? customElapsedSec
          : startTimeMs !== null
            ? Math.floor((Date.now() - startTimeMs) / 1000)
            : 0;

      if (curMode === "stopwatch") {
        set({ seconds: baseSeconds + elapsedSec });
      } else {
        const remaining = Math.max(0, baseSeconds - elapsedSec);
        set({ seconds: remaining });

        if (remaining <= 0) {
          triggerCompletion(curMode);
        }
      }
    },

    pause: () => {
      soundEffects.playClick("release");
      clearStoreInterval();
      // Crucial: preserve exact remaining seconds as base for next resume
      baseSeconds = get().seconds;
      set({ isRunning: false });
    },

    reset: () => {
      soundEffects.playClick("release");
      clearStoreInterval();
      const dur = getDurationForMode(get().mode);
      baseSeconds = dur;
      set({
        isRunning: false,
        seconds: dur,
        targetDuration: dur,
      });
    },

    setCustomTime: (totalSecs: number) => {
      clearStoreInterval();
      baseSeconds = totalSecs;
      set({
        isRunning: false,
        seconds: totalSecs,
        targetDuration: totalSecs,
      });
    },
  };
});
