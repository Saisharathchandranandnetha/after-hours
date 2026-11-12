"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings";
import { useTimerStore } from "@/lib/timer-store";

export type FocusTimerState = {
  mode: ReturnType<typeof useTimerStore.getState>["mode"];
  isRunning: boolean;
  timeLeft: number;
  totalDuration: number;
  elapsed: number;
  progress: number;
  completedSessions: number;
};

export function useFocusTimer() {
  const { timer: settings } = useSettings();
  const timer = useTimerStore();

  // Request notification permission if enabled
  useEffect(() => {
    if (
      settings.notificationEnabled &&
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [settings.notificationEnabled]);

  // Compute progress (0 to 1)
  const progress =
    timer.mode === "stopwatch"
      ? 1
      : timer.targetDuration > 0
        ? Math.max(0, Math.min(1, 1 - timer.seconds / timer.targetDuration))
        : 0;

  return {
    mode: timer.mode,
    isRunning: timer.isRunning,
    seconds: timer.seconds,
    targetDuration: timer.targetDuration,
    progress,
    completedSessions: timer.completedSessions,
    selectMode: timer.selectMode,
    start: timer.start,
    pause: timer.pause,
    reset: timer.reset,
    setCustomTime: timer.setCustomTime,
  };
}
