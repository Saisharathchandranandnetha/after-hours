"use client";

import { useState } from "react";
import { LocalClock } from "./local-clock";
import { PlaylistModal } from "./playlist-modal";
import { FocusTimerModal } from "./focus-timer-modal";
import { CustomizeModal } from "./customize-modal";
import { StudioMenu } from "./studio-menu";
import { StudioPresence } from "./studio-presence";

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

        {/* Top Center: Live Studio Listener Presence */}
        <div className="justify-self-center">
          <StudioPresence />
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
