"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  ListMusic,
  Timer,
  Sliders,
  Maximize,
  Minimize,
  Plus,
  Settings2,
  Sparkles,
  Check,
  Disc,
} from "lucide-react";
import { usePlaylistStore } from "@/lib/playlist-store";
import { useTimerStore } from "@/lib/timer-store";

type StudioMenuProps = {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenPlaylists: (tab?: "list" | "add") => void;
  onOpenTimer: () => void;
  onOpenCustomize: () => void;
};

export function StudioMenu({
  isFullScreen,
  onToggleFullScreen,
  isFocusMode,
  onToggleFocusMode,
  onOpenPlaylists,
  onOpenTimer,
  onOpenCustomize,
}: StudioMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlistsSubmenuOpen, setPlaylistsSubmenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { playlists, activePlaylistId, setActivePlaylist } = usePlaylistStore();
  const timer = useTimerStore();

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setPlaylistsSubmenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setPlaylistsSubmenuOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
    setPlaylistsSubmenuOpen(false);
  }, []);

  return (
    <div ref={menuRef} className="relative inline-block text-left select-none">
      {/* Studio Trigger Button */}
      <button
        type="button"
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Studio menu"
        className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md shadow-lg transition-all hover:border-amber-400/40 hover:bg-white/10 hover:text-white"
      >
        <span className="size-1.5 rounded-full bg-amber-400/90 animate-soft-pulse" />
        <span>Studio</span>
        <ChevronDown
          className={`size-3.5 text-white/60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Main Studio Dropdown */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-white/15 bg-zinc-950/90 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Section: Playlists Submenu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPlaylistsSubmenuOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <ListMusic className="size-4 text-amber-400" />
                <span className="font-medium">Playlists</span>
              </div>
              <ChevronRight
                className={`size-3.5 text-white/40 transition-transform ${
                  playlistsSubmenuOpen ? "rotate-90 sm:rotate-0" : ""
                }`}
              />
            </button>

            {/* Playlists Flyout / Nested Submenu */}
            {playlistsSubmenuOpen && (
              <div
                role="menu"
                className="mt-1 sm:mt-0 sm:absolute sm:top-0 sm:right-full sm:mr-2 w-full sm:w-60 rounded-xl border border-white/15 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-2xl z-50"
              >
                <div className="px-2.5 py-1 text-[10px] font-mono tracking-wider text-white/40 uppercase">
                  Quick Switch
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {playlists.map((pl) => {
                    const isActive = pl.id === activePlaylistId;
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => {
                          setActivePlaylist(pl.id);
                          setIsOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                          isActive
                            ? "bg-amber-400/15 text-amber-300 font-medium"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {pl.name.toLowerCase() === "feel" ? (
                            <Disc className="size-3 text-amber-400 shrink-0" />
                          ) : (
                            <span className="size-1.5 rounded-full bg-white/30 shrink-0" />
                          )}
                          <span className="truncate">{pl.name}</span>
                        </div>
                        {isActive && <Check className="size-3 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="my-1.5 border-t border-white/10" />

                {/* Add Playlist button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenPlaylists("add");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Plus className="size-3.5 text-amber-400" />
                  <span>Add Playlist…</span>
                </button>

                {/* Manage All Playlists */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenPlaylists("list");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Settings2 className="size-3.5 text-white/60" />
                  <span>Manage Playlists</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Focus Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onToggleFocusMode();
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="size-4 text-amber-400" />
              <span>{isFocusMode ? "Exit Focus Mode" : "Focus Mode"}</span>
            </div>
            <span className="font-mono text-[10px] text-white/40">[F]</span>
          </button>

          <div className="my-1 border-t border-white/10" />

          {/* Item: Focus Timer */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenTimer();
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <Timer className="size-4 text-amber-400" />
              <span>Focus Timer</span>
            </div>
            {timer.isRunning && (
              <span className="font-mono text-[10px] text-amber-300">
                {Math.floor(timer.seconds / 60)}:
                {String(timer.seconds % 60).padStart(2, "0")}
              </span>
            )}
          </button>

          {/* Item: Customize */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenCustomize();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Sliders className="size-4 text-amber-400" />
            <span>Customize Studio</span>
          </button>

          <div className="my-1 border-t border-white/10" />

          {/* Item: Fullscreen */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onToggleFullScreen();
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              {isFullScreen ? (
                <Minimize className="size-4 text-amber-400" />
              ) : (
                <Maximize className="size-4 text-amber-400" />
              )}
              <span>{isFullScreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
