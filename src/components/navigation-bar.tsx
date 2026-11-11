"use client";

import { useState } from "react";
import {
  ListMusic,
  Timer,
  Sliders,
  Maximize,
  Minimize,
} from "lucide-react";
import { LocalClock } from "./local-clock";
import { PlaylistModal } from "./playlist-modal";
import { FocusTimerModal } from "./focus-timer-modal";
import { CustomizeModal } from "./customize-modal";
import { useSettings } from "@/lib/settings";

type NavigationBarProps = {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
};

export function NavigationBar({ isFullScreen, onToggleFullScreen }: NavigationBarProps) {
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const { timer } = useSettings();

  return (
    <>
      <header className="grid grid-cols-3 items-center gap-4 select-none">
        {/* Top Left: Clock */}
        <div className="justify-self-start">
          <LocalClock />
        </div>

        {/* Top Center: Discreet Focus Status */}
        <div className="justify-self-center">
          <button
            onClick={() => setTimerOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-1 text-[11px] font-mono text-white/70 backdrop-blur-md transition-all hover:border-amber-400/40 hover:text-white"
            title="Focus Studio Status"
          >
            <span className="size-1.5 rounded-full bg-amber-400/80 animate-soft-pulse" />
            <span>
              {timer.completedSessions > 0
                ? `${timer.completedSessions} focus session${timer.completedSessions > 1 ? "s" : ""}`
                : "focus room"}
            </span>
          </button>
        </div>

        {/* Top Right: Actions */}
        <div className="flex items-center gap-2 justify-self-end">
          {/* Playlists Button */}
          <button
            onClick={() => setPlaylistOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
            aria-label="Manage playlists"
          >
            <ListMusic className="size-3.5 text-amber-300" />
            <span className="hidden sm:inline">Playlists</span>
          </button>

          {/* Timer Button */}
          <button
            onClick={() => setTimerOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
            aria-label="Focus timer"
          >
            <Timer className="size-3.5 text-amber-300" />
            <span className="hidden sm:inline">Timer</span>
          </button>

          {/* Customize Button */}
          <button
            onClick={() => setCustomizeOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
            aria-label="Customize studio"
          >
            <Sliders className="size-3.5 text-amber-300" />
            <span className="hidden sm:inline">Customize</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullScreen}
            className="rounded-full border border-white/10 bg-black/40 p-2 text-white/80 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
            aria-label={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            title={isFullScreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
          >
            {isFullScreen ? (
              <Minimize className="size-3.5" />
            ) : (
              <Maximize className="size-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* Modals */}
      <PlaylistModal open={playlistOpen} onClose={() => setPlaylistOpen(false)} />
      <FocusTimerModal open={timerOpen} onClose={() => setTimerOpen(false)} />
      <CustomizeModal open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
    </>
  );
}
