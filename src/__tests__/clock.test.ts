import { describe, it, expect, beforeEach } from "vitest";
import { useSettings } from "@/lib/settings";

describe("Clock Settings & Time Logic", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettings.getState().resetAll();
  });

  it("has default clock settings matching specifications", () => {
    const { clock } = useSettings.getState();
    expect(clock.format).toBe("12");
    expect(clock.showSeconds).toBe(true);
    expect(clock.blinkingColons).toBe(true);
    expect(clock.timezone).toBe("local");
    expect(clock.showAmPm).toBe(true);
  });

  it("updates clock format between 12-hour and 24-hour", () => {
    useSettings.getState().updateClock({ format: "24" });
    expect(useSettings.getState().clock.format).toBe("24");

    useSettings.getState().updateClock({ format: "12" });
    expect(useSettings.getState().clock.format).toBe("12");
  });

  it("updates showSeconds and blinkingColons toggles", () => {
    useSettings.getState().updateClock({ showSeconds: false, blinkingColons: false });
    const { clock } = useSettings.getState();
    expect(clock.showSeconds).toBe(false);
    expect(clock.blinkingColons).toBe(false);
  });

  it("updates timezone to a valid IANA timezone identifier", () => {
    useSettings.getState().updateClock({ timezone: "Asia/Tokyo" });
    expect(useSettings.getState().clock.timezone).toBe("Asia/Tokyo");

    useSettings.getState().updateClock({ timezone: "UTC" });
    expect(useSettings.getState().clock.timezone).toBe("UTC");
  });

  it("persists clock settings across rehydration", () => {
    useSettings.getState().updateClock({
      format: "24",
      showSeconds: false,
      fontSize: 20,
    });

    // Rehydrate from localStorage
    useSettings.getState().hydrate();
    const { clock } = useSettings.getState();
    expect(clock.format).toBe("24");
    expect(clock.showSeconds).toBe(false);
    expect(clock.fontSize).toBe(20);
  });

  it("formats dates correctly using Intl formatters", () => {
    // 2026-11-12 15:30:45 UTC
    const testDate = new Date("2026-11-12T15:30:45Z");

    const formatter24 = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      hourCycle: "h23",
    });

    const parts = formatter24.formatToParts(testDate);
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    const second = parts.find((p) => p.type === "second")?.value;

    expect(hour).toBe("15");
    expect(minute).toBe("30");
    expect(second).toBe("45");
  });
});
