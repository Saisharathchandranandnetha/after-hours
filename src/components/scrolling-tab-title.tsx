"use client";

import { useEffect, useRef } from "react";
import { useTimerStore } from "@/lib/timer-store";
import { useSettings } from "@/lib/settings";

const DEFAULT_TITLE = "✦ Netha's After-Hours ✦   ";
const SCROLL_INTERVAL_MS = 200;

interface ScrollingTabTitleProps {
  text?: string;
  interval?: number;
}

export function ScrollingTabTitle({
  text = DEFAULT_TITLE,
  interval = SCROLL_INTERVAL_MS,
}: ScrollingTabTitleProps) {
  const textRef = useRef(text);
  const intervalRef = useRef(interval);
  const indexRef = useRef(0);

  // Keep refs synchronized without recreating the ticker interval
  useEffect(() => {
    textRef.current = text;
    intervalRef.current = interval;
  }, [text, interval]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    let timerId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      const { timer: timerSettings, personalization } = useSettings.getState();
      const timerState = useTimerStore.getState();

      let targetText = textRef.current;

      // When the focus timer is running, include the live countdown
      if (timerState.isRunning && timerSettings.showInTitle) {
        const mins = Math.floor(timerState.seconds / 60);
        const secs = String(timerState.seconds % 60).padStart(2, "0");
        const prefix =
          timerState.mode === "pomodoro"
            ? "🍅"
            : timerState.mode === "stopwatch"
              ? "⏱"
              : "☕";
        targetText = `${prefix} ${mins}:${secs} • Netha's After-Hours •   `;
      }

      // Respect reduced motion accessibility setting
      if (personalization.reducedMotion) {
        document.title = targetText.trim();
        return;
      }

      // Keep index in bounds and advance 1 character smoothly
      indexRef.current = (indexRef.current + 1) % targetText.length;
      document.title =
        targetText.slice(indexRef.current) + targetText.slice(0, indexRef.current);
    };

    // Immediately run the first tick
    tick();

    timerId = setInterval(tick, intervalRef.current);

    return () => {
      if (timerId) clearInterval(timerId);
      document.title = "Netha's After-Hours";
    };
  }, []);

  return null;
}
