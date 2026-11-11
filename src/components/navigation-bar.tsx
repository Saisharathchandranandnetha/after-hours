"use client";

import { useState } from "react";
import { LocalClock } from "./local-clock";
import { PlaylistModal } from "./playlist-modal";
import { FocusTimerModal } from "./focus-timer-modal";
import { CustomizeModal } from "./customize-modal";
import { StudioMenu } from "./studio-menu";
import { useTimerStore } from "@/lib/timer-store";

type NavigationBarProps = {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
};

export function NavigationBar({
  isFullScreen,
  onToggleFullScreen,
  isFocusMode,
  onToggleFocusMode,
}: NavigationBarProps) {
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playlistTab, setPlaylistTab] = useState<"list" | "add">("list");
  const [timerOpen, setTimerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const timer = useTimerStore();

  const handleOpenPlaylists = (tab: "list" | "add" = "list") => {
    setPlaylistTab(tab);
    setPlaylistOpen(true);
  };

  return (
    <>
      <header className="relative z-40 grid grid-cols-3 items-center gap-4 select-none">
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
            <span
              className={`size-1.5 rounded-full ${
                isFocusMode
                  ? "bg-amber-400 animate-soft-pulse shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                  : timer.isRunning
                    ? "bg-amber-400 animate-ping"
                    : "bg-amber-400/80"
              }`}
            />
            <span>
              {isFocusMode
                ? "focus mode active"
                : timer.isRunning
                  ? `focus: ${Math.floor(timer.seconds / 60)}:${String(timer.seconds % 60).padStart(2, "0")}`
                  : timer.completedSessions > 0
                    ? `${timer.completedSessions} focus session${timer.completedSessions > 1 ? "s" : ""}`
                    : "focus room"}
            </span>
          </button>
        </div>

        {/* Top Right: Studio ▾ Primary Dropdown */}
        <div className="flex items-center gap-2 justify-self-end">
          <StudioMenu
            isFullScreen={isFullScreen}
            onToggleFullScreen={onToggleFullScreen}
            isFocusMode={isFocusMode}
            onToggleFocusMode={onToggleFocusMode}
            onOpenPlaylists={handleOpenPlaylists}
            onOpenTimer={() => setTimerOpen(true)}
            onOpenCustomize={() => setCustomizeOpen(true)}
          />
        </div>
      </header>

      {/* Modals */}
      <PlaylistModal
        open={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        initialTab={playlistTab}
      />
      <FocusTimerModal open={timerOpen} onClose={() => setTimerOpen(false)} />
      <CustomizeModal open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
    </>
  );
}
