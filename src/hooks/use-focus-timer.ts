"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSettings, type TimerMode } from "@/lib/settings";
import { soundEffects } from "@/lib/sound-effects";

export type FocusTimerState = {
  mode: TimerMode;
  isRunning: boolean;
  timeLeft: number; // in seconds
  totalDuration: number; // in seconds
  elapsed: number; // for stopwatch or progress
  progress: number; // 0 to 1
  completedSessions: number;
};

export function useFocusTimer() {
  const { timer: settings, updateTimer } = useSettings();
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [isRunning, setIsRunning] = useState(false);

  // Time remaining in countdown or elapsed in stopwatch
  const [seconds, setSeconds] = useState(settings.pomodoroDuration);
  const [targetDuration, setTargetDuration] = useState(settings.pomodoroDuration);

  // High-accuracy timestamp tracking to prevent tab throttling drift
  const startTimeRef = useRef<number | null>(null);
  const baseSecondsRef = useRef<number>(settings.pomodoroDuration);

  // Get duration for mode
  const getDurationForMode = useCallback(
    (m: TimerMode): number => {
      switch (m) {
        case "pomodoro":
          return settings.pomodoroDuration;
        case "short-break":
          return settings.shortBreakDuration;
        case "long-break":
          return settings.longBreakDuration;
        case "custom":
          return settings.customDuration;
        case "stopwatch":
          return 0;
      }
    },
    [settings]
  );

  // Switch timer mode
  const selectMode = useCallback(
    (newMode: TimerMode) => {
      setIsRunning(false);
      setMode(newMode);
      const dur = getDurationForMode(newMode);
      setTargetDuration(dur);
      setSeconds(dur);
      baseSecondsRef.current = dur;
      startTimeRef.current = null;
    },
    [getDurationForMode]
  );

  // Request notification permission if enabled
  useEffect(() => {
    if (settings.notificationEnabled && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [settings.notificationEnabled]);

  // Handle timer completion
  const handleCompletion = useCallback(() => {
    setIsRunning(false);
    startTimeRef.current = null;

    // Sound effect
    if (settings.soundEnabled) {
      soundEffects.playTimerCompletion();
    }

    // Web Notification
    if (
      settings.notificationEnabled &&
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
        new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      } catch {
        // Fallback for notification error
      }
    }

    // Increment completed sessions if it was a pomodoro
    if (mode === "pomodoro") {
      updateTimer({ completedSessions: settings.completedSessions + 1 });
    }
  }, [mode, settings, updateTimer]);

  // Timer loop using performance.now() delta calculation
  useEffect(() => {
    if (!isRunning) return;

    startTimeRef.current = performance.now();
    const startBase = baseSecondsRef.current;

    const intervalId = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsedMs = performance.now() - startTimeRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);

      if (mode === "stopwatch") {
        setSeconds(startBase + elapsedSec);
      } else {
        const remaining = Math.max(0, startBase - elapsedSec);
        setSeconds(remaining);

        if (remaining <= 0) {
          clearInterval(intervalId);
          handleCompletion();
        }
      }
    }, 250); // High sample rate avoids skipped seconds

    return () => clearInterval(intervalId);
  }, [isRunning, mode, handleCompletion]);

  // Update document.title if enabled
  useEffect(() => {
    if (!settings.showInTitle || typeof document === "undefined") return;

    if (isRunning) {
      const mins = Math.floor(seconds / 60);
      const secs = String(seconds % 60).padStart(2, "0");
      const prefix = mode === "pomodoro" ? "🍅" : mode === "stopwatch" ? "⏱" : "☕";
      document.title = `${prefix} ${mins}:${secs} — After Hours`;
    } else {
      document.title = "After Hours — Personal Coding & Research Music Studio";
    }

    return () => {
      document.title = "After Hours — Personal Coding & Research Music Studio";
    };
  }, [isRunning, seconds, mode, settings.showInTitle]);

  const start = useCallback(() => {
    soundEffects.playClick("press");
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    soundEffects.playClick("release");
    setIsRunning(false);
    startTimeRef.current = null;
  }, []);

  const reset = useCallback(() => {
    soundEffects.playClick("release");
    setIsRunning(false);
    startTimeRef.current = null;
    const dur = getDurationForMode(mode);
    setSeconds(dur);
    baseSecondsRef.current = dur;
  }, [getDurationForMode, mode]);

  const setCustomTime = useCallback((totalSecs: number) => {
    setSeconds(totalSecs);
    setTargetDuration(totalSecs);
    baseSecondsRef.current = totalSecs;
  }, []);

  // Progress computation (0 to 1)
  const progress =
    mode === "stopwatch"
      ? 1
      : targetDuration > 0
        ? Math.max(0, Math.min(1, 1 - seconds / targetDuration))
        : 0;

  return {
    mode,
    isRunning,
    seconds,
    targetDuration,
    progress,
    completedSessions: settings.completedSessions,
    selectMode,
    start,
    pause,
    reset,
    setCustomTime,
  };
}
