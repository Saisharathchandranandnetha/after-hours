import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Studio Presence & Scrolling Title", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rotates scrolling document title character by character smoothly", () => {
    const text = "Netha's after-hours • ";
    let display = text;

    const step = () => {
      display = display.slice(1) + display[0];
    };

    expect(display).toBe("Netha's after-hours • ");

    step();
    expect(display).toBe("etha's after-hours • N");

    step();
    expect(display).toBe("tha's after-hours • Ne");

    // After full rotation length
    for (let i = 2; i < text.length; i++) {
      step();
    }
    expect(display).toBe(text);
  });

  it("handles pluralization for listeners correctly", () => {
    const formatListenerText = (count: number) => {
      return `${count} ${count === 1 ? "person listening" : "people listening"}`;
    };

    expect(formatListenerText(1)).toBe("1 person listening");
    expect(formatListenerText(2)).toBe("2 people listening");
    expect(formatListenerText(5)).toBe("5 people listening");
  });
});
