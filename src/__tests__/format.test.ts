import { describe, it, expect } from "vitest";
import { formatDuration } from "@/lib/format";

describe("formatDuration", () => {
  it("formats 0 and negative seconds safely", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(-10)).toBe("0:00");
    expect(formatDuration(NaN)).toBe("0:00");
    expect(formatDuration(Infinity)).toBe("0:00");
  });

  it("formats seconds under a minute with zero padding", () => {
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(42)).toBe("0:42");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(180)).toBe("3:00");
    expect(formatDuration(3599)).toBe("59:59");
  });

  it("formats hours, minutes, and seconds when exceeding 1 hour", () => {
    expect(formatDuration(3600)).toBe("1:00:00");
    expect(formatDuration(3665)).toBe("1:01:05");
    expect(formatDuration(7325)).toBe("2:02:05");
  });
});
