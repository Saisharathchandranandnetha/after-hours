"use client";

import { useEffect, useState, useCallback } from "react";
import { CoverScene } from "@/components/cover-scene";
import { PlayerProvider } from "@/components/player-provider";
import { CassetteDeck } from "@/components/cassette-deck";
import { NavigationBar } from "@/components/navigation-bar";
import { LocalClock } from "@/components/local-clock";
import { ScrollingTabTitle } from "@/components/scrolling-tab-title";
import { useSettings } from "@/lib/settings";
import { X, Sparkles } from "lucide-react";

export default function Home() {
  const { clock, updateClock, hydrate } = useSettings();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const toggleFullScreen = useCallback(() => {
    if (typeof document === "undefined") return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  // Listen for fullscreenchange events (e.g. user pressed Escape)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Global KeyF shortcut for Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }
      if (e.code === "KeyF") {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950 font-sans">
      <ScrollingTabTitle />

      {/* Cinematic Background Scenery */}
      <CoverScene />

      {/* Focus Mode Dimming Backdrop */}
      {isFocusMode && (
        <div className="absolute inset-0 z-10 bg-black/65 backdrop-blur-xs transition-opacity duration-500 pointer-events-none" />
      )}

      <PlayerProvider>
        {/* Full-Screen Digital Clock Overlay if activated */}
        {clock.fullScreenMode ? (
          <div className="relative flex h-full w-full flex-col items-center justify-center p-6 z-50 bg-black/80 backdrop-blur-2xl">
            <button
              onClick={() => updateClock({ fullScreenMode: false })}
              className="absolute top-6 right-6 rounded-full border border-white/20 bg-white/10 p-2.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Exit Fullscreen Clock"
            >
              <X className="size-5" />
            </button>
            <LocalClock
              isFullScreenMode
              onExitFullScreen={() => updateClock({ fullScreenMode: false })}
            />
            <p className="mt-8 font-mono text-xs tracking-widest text-white/40 uppercase">
              Click anywhere or press close to exit
            </p>
          </div>
        ) : (
          <div className="relative z-20 flex h-full flex-col justify-between px-5 py-4 sm:px-8 sm:py-6">
            {/* Top Navigation Row */}
            {isFocusMode ? (
              <header className="relative z-40 flex items-center justify-between select-none">
                <LocalClock />
                <button
                  onClick={toggleFocusMode}
                  aria-label="Exit Focus Mode"
                  className="flex items-center gap-2.5 rounded-full border border-amber-400/40 bg-zinc-950/80 px-4 py-1.5 text-xs font-mono text-amber-300 shadow-xl backdrop-blur-md transition-all hover:bg-amber-400/20 hover:border-amber-400"
                >
                  <span className="size-2 rounded-full bg-amber-400 animate-soft-pulse shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                  <Sparkles className="size-3.5 text-amber-400" />
                  <span>Exit Focus Mode</span>
                  <span className="text-[10px] text-white/40">[F]</span>
                </button>
              </header>
            ) : (
              <NavigationBar
                isFullScreen={isFullScreen}
                onToggleFullScreen={toggleFullScreen}
                isFocusMode={isFocusMode}
                onToggleFocusMode={toggleFocusMode}
              />
            )}

            {/* Editorial Center Title removed as requested */}

            {/* Bottom Centered Cassette Deck */}
            <footer className="flex justify-center pb-2 select-none mt-auto">
              <CassetteDeck
                onToggleFocusMode={toggleFocusMode}
              />
            </footer>
          </div>
        )}
      </PlayerProvider>
    </main>
  );
}
