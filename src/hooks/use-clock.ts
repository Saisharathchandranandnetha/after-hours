"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSettings } from "@/lib/settings";

export type ClockDisplayState = {
  hours: string;
  minutes: string;
  seconds: string;
  amPm: string;
  dateStr: string;
  tzAbbr: string;
  colonVisible: boolean;
};

// Common well-known IANA timezones for the selector
export const TIMEZONE_OPTIONS = [
  { value: "local", label: "Local Device Time" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris / Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Beijing / Shanghai (CST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

/**
 * High-precision clock hook that:
 * 1. Synchronizes precisely to second boundaries (no drift)
 * 2. Blinks colons smoothly via state or CSS
 * 3. Handles IANA timezones
 * 4. Resynchronizes immediately on visibilitychange
 * 5. Prevents Next.js hydration mismatches
 * 6. Supports simulated time preview for testing
 */
export function useClock(simulatedDate?: Date | null): ClockDisplayState | null {
  const { clock: settings } = useSettings();
  const [display, setDisplay] = useState<ClockDisplayState | null>(null);
  const colonStateRef = useRef(true);

  const calculateTime = useCallback(
    (now: Date, colonState: boolean): ClockDisplayState => {
      const targetDate = simulatedDate || now;
      const tz = settings.timezone === "local" ? undefined : settings.timezone;

      try {
        const is24 = settings.format === "24";
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: !is24,
          hourCycle: is24 ? "h23" : "h12",
        });

        const parts = formatter.formatToParts(targetDate);
        let h = "00";
        let m = "00";
        let s = "00";
        let dayPeriod = "";

        for (const p of parts) {
          if (p.type === "hour") h = p.value.padStart(2, "0");
          if (p.type === "minute") m = p.value;
          if (p.type === "second") s = p.value;
          if (p.type === "dayPeriod") dayPeriod = p.value.toUpperCase();
        }

        const dateFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const dateStr = dateFormatter.format(targetDate);

        let tzAbbr = "";
        if (settings.showTimezoneAbbr) {
          const tzFormatter = new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            timeZoneName: "short",
          });
          const tzParts = tzFormatter.formatToParts(targetDate);
          const found = tzParts.find((p) => p.type === "timeZoneName");
          tzAbbr = found ? found.value : "";
        }

        return {
          hours: h,
          minutes: m,
          seconds: s,
          amPm: dayPeriod,
          dateStr,
          tzAbbr,
          colonVisible: settings.blinkingColons ? colonState : true,
        };
      } catch {
        const h = String(targetDate.getHours()).padStart(2, "0");
        const m = String(targetDate.getMinutes()).padStart(2, "0");
        const s = String(targetDate.getSeconds()).padStart(2, "0");
        return {
          hours: h,
          minutes: m,
          seconds: s,
          amPm: targetDate.getHours() >= 12 ? "PM" : "AM",
          dateStr: targetDate.toDateString(),
          tzAbbr: "",
          colonVisible: colonState,
        };
      }
    },
    [settings, simulatedDate]
  );

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const update = () => {
      const now = new Date();
      colonStateRef.current = !colonStateRef.current;
      setDisplay(calculateTime(now, colonStateRef.current));
    };

    // Immediate initial sync deferred via requestAnimationFrame to avoid setState during effect execution
    const animId = requestAnimationFrame(() => {
      update();
    });

    const now = new Date();
    const msUntilNextSecond = 1000 - now.getMilliseconds();
    const timeoutId = setTimeout(() => {
      update();
      intervalId = setInterval(update, 1000);
    }, msUntilNextSecond);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        update();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [calculateTime]);

  return display;
}
