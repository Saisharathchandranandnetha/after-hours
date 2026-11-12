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

  it("calculates live presence correctly and reduces count when tabs disconnect", () => {
    const calculateLiveCount = (
      documents: Array<{ lastSeenVal: number; status: string }>,
      now: number,
      localCount: number
    ) => {
      const ACTIVE_WINDOW_MS = 25_000;
      let remoteCount = 0;
      for (const doc of documents) {
        if (doc.status !== "offline" && Math.abs(now - doc.lastSeenVal) < ACTIVE_WINDOW_MS) {
          remoteCount++;
        }
      }
      return Math.max(localCount, remoteCount, 1);
    };

    const now = 100000;
    // 2 active browsers (one 2 seconds ago, one 5 seconds ago)
    const activeDocs = [
      { lastSeenVal: 98000, status: "online" },
      { lastSeenVal: 95000, status: "online" },
    ];
    expect(calculateLiveCount(activeDocs, now, 1)).toBe(2);

    // 1 browser closes (marked offline or deleted from docs)
    const afterClose = [{ lastSeenVal: 98000, status: "online" }];
    expect(calculateLiveCount(afterClose, now, 1)).toBe(1);

    // Stale doc beyond 25s window does not count
    const withStale = [
      { lastSeenVal: 98000, status: "online" },
      { lastSeenVal: 50000, status: "online" }, // 50s old
    ];
    expect(calculateLiveCount(withStale, now, 1)).toBe(1);
  });
});
