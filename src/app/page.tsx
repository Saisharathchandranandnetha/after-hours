"use client";

import { useEffect, useState, useCallback } from "react";
import { CoverScene } from "@/components/cover-scene";
import { PlayerProvider } from "@/components/player-provider";
import { CassetteDeck } from "@/components/cassette-deck";
import { NavigationBar } from "@/components/navigation-bar";
import { LocalClock } from "@/components/local-clock";
import { useSettings } from "@/lib/settings";
import { X } from "lucide-react";

export default function Home() {
  const { personalization, clock, updateClock, hydrate } = useSettings();
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  // Listen for fullscreenchange events (e.g. user pressed Escape)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950 font-sans">
      {/* Cinematic Background Scenery */}
      <CoverScene />

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
          <div className="relative z-10 flex h-full flex-col justify-between px-5 py-4 sm:px-8 sm:py-6">
            {/* Top Navigation Row */}
            <NavigationBar
              isFullScreen={isFullScreen}
              onToggleFullScreen={toggleFullScreen}
            />

            {/* Editorial Center Title */}
            <div className="flex flex-col items-center justify-center text-center my-auto py-4 select-none">
              <h1 className="font-heading text-5xl sm:text-7xl md:text-8xl leading-[0.95] text-white/95 drop-shadow-[0_2px_28px_rgba(0,0,0,0.9)] tracking-tight">
                {personalization.headingText || "late night coding"}
              </h1>
              {personalization.subtitleText && (
                <p className="mt-4 font-mono text-xs sm:text-sm tracking-[0.25em] text-white/50 uppercase drop-shadow-[0_1px_12px_rgba(0,0,0,0.8)]">
                  {personalization.subtitleText}
                </p>
              )}
            </div>

            {/* Bottom Centered Cassette Deck */}
            <footer className="flex justify-center pb-2 select-none">
              <CassetteDeck
                onToggleFocusMode={toggleFullScreen}
              />
            </footer>
          </div>
        )}
      </PlayerProvider>
    </main>
  );
}
