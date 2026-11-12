"use client";

import { useEffect, useState, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Loader2,
  Shuffle,
  Repeat,
  Repeat1,
  Tv,
  ListMusic,
  MoreHorizontal,
  BookmarkCheck,
} from "lucide-react";
import { Cassette } from "./cassette";
import { usePlayerContext } from "./player-provider";
import { formatDuration } from "@/lib/format";
import { NowPlayingPanel } from "./now-playing-panel";

type CassetteDeckProps = {
  onOpenTimer?: () => void;
  onToggleFocusMode?: () => void;
};

export function CassetteDeck({ onOpenTimer, onToggleFocusMode }: CassetteDeckProps) {
  const {
    player,
    isEmbedExpanded,
    setEmbedExpanded,
    isEmbedHidden,
    setEmbedHidden,
    activePlaylistName,
  } = usePlayerContext();

  const {
    state,
    ready,
    playing,
    buffering,
    live,
    track,
    position,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    error,
    hasCheckpoint,
    toggle,
    resume,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  } = player;

  // Scrubbing state for seek slider
  const [scrub, setScrub] = useState<number | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const displayed = scrub ?? position;
  const seekable = ready && !live && duration > 0;

  // Close More menu on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreMenuOpen(false);
      }
    };

    if (moreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreMenuOpen]);

  // Global keyboard shortcuts (Space, Arrows, M, F, T, Q)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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

      switch (event.code) {
        case "Space":
          event.preventDefault();
          toggle();
          break;
        case "ArrowLeft":
          if (seekable) {
            event.preventDefault();
            seek(Math.max(0, position - 5));
          }
          break;
        case "ArrowRight":
          if (seekable) {
            event.preventDefault();
            seek(Math.min(duration, position + 5));
          }
          break;
        case "KeyM":
          event.preventDefault();
          toggleMute();
          break;
        case "KeyF":
          event.preventDefault();
          onToggleFocusMode?.();
          break;
        case "KeyT":
          event.preventDefault();
          onOpenTimer?.();
          break;
        case "KeyQ":
          event.preventDefault();
          setQueueOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle, seek, position, duration, seekable, toggleMute, onToggleFocusMode, onOpenTimer]);

  const title = error
    ? "Stream unavailable"
    : track?.title ?? (ready ? "Ready to play" : "Inserting tape…");
  const artist = error
    ? "Check playlist source"
    : track?.artist ?? "late night coding";

  return (
    <>
      <div className="relative z-30 w-full max-w-[28rem] rounded-3xl bg-zinc-950/60 p-4 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.95)] ring-1 ring-white/15 backdrop-blur-xl transition-all">
        {/* Checkpoint Resume Listening Notice */}
        {hasCheckpoint && !playing && (
          <div className="mb-2 flex items-center justify-center gap-1.5 font-mono text-[11px] text-amber-300 bg-amber-400/10 border border-amber-400/20 py-1 px-3 rounded-full animate-pulse select-none">
            <BookmarkCheck className="size-3 text-amber-400" />
            <span>Resume listening</span>
          </div>
        )}

        {/* Cassette visualization */}
        <Cassette
          title={title}
          artist={artist}
          playlistName={activePlaylistName}
          spinning={playing}
          progress={duration > 0 ? displayed / duration : 0}
        />

        {/* Progress timeline bar */}
        <div className="mt-4 flex items-center gap-3 px-1">
          <span className="w-10 shrink-0 font-mono text-[11px] text-white/60 tabular-nums">
            {live ? (
              <button
                type="button"
                onClick={() => {
                  setEmbedHidden(false);
                  setEmbedExpanded(true);
                }}
                title="Expand live stream"
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                <Tv className="size-3" />
                <span>live</span>
              </button>
            ) : (
              formatDuration(displayed)
            )}
          </span>

          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              aria-label="Seek track"
              disabled={!seekable}
              min={0}
              max={Math.max(duration, 1)}
              step={0.5}
              value={displayed}
              onChange={(e) => setScrub(Number(e.target.value))}
              onMouseUp={(e) => {
                seek(Number((e.target as HTMLInputElement).value));
                setScrub(null);
              }}
              onTouchEnd={(e) => {
                seek(Number((e.target as HTMLInputElement).value));
                setScrub(null);
              }}
              className="w-full h-1.5 rounded-lg appearance-none bg-white/20 accent-amber-300 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          <span className="w-10 shrink-0 text-right font-mono text-[11px] text-white/60 tabular-nums">
            {live ? "∞" : formatDuration(duration)}
          </span>
        </div>

        {/* 
          3-Column Symmetrical Control Row:
          - Left: Open Queue & TV Live Stream buttons
          - Center: [Previous] [PLAY/PAUSE] [Next] (strictly centered)
          - Right: More ▾ dropdown (Volume, Mute, Shuffle, Repeat, Video Toggle)
        */}
        <div className="mt-3.5 grid grid-cols-3 items-center px-1">
          {/* Column 1: Left - Queue & TV Buttons */}
          <div className="flex items-center gap-1.5 justify-self-start">
            <button
              onClick={() => setQueueOpen(true)}
              aria-label="Open Queue"
              title="Open Queue / Now Playing [Q]"
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white"
            >
              <ListMusic className="size-3.5 text-amber-400" />
              <span className="hidden sm:inline font-mono text-[11px]">Queue</span>
            </button>

            {/* TV Button to launch / hide live stream video */}
            <button
              onClick={() => {
                if (isEmbedHidden) {
                  setEmbedHidden(false);
                  setEmbedExpanded(true);
                } else {
                  setEmbedHidden(true);
                }
              }}
              aria-label="Toggle live video stream window"
              title={
                isEmbedHidden
                  ? "Launch live stream video [TV]"
                  : "Hide live stream video [TV]"
              }
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs transition-all backdrop-blur-md cursor-pointer ${
                !isEmbedHidden
                  ? "border-amber-400/50 bg-amber-400/20 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white"
              }`}
            >
              <Tv className="size-3.5 text-amber-400" />
              <span className="hidden sm:inline font-mono text-[11px]">TV</span>
            </button>
          </div>

          {/* Column 2: Center - Perfectly Symmetrical Transport Controls */}
          <div className="flex items-center justify-center gap-2 justify-self-center">
            {/* Previous Track */}
            <button
              onClick={previous}
              disabled={!ready}
              aria-label="Previous track"
              className="rounded-full p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <SkipBack className="size-4" />
            </button>

            {/* Centered Play/Pause Button */}
            <button
              onClick={hasCheckpoint && !playing ? resume : toggle}
              disabled={!ready}
              aria-label={playing ? "Pause" : "Play"}
              className="rounded-full bg-white p-3 text-zinc-950 shadow-lg shadow-white/10 transition-all hover:scale-105 hover:bg-white/90 active:scale-95 disabled:opacity-50"
            >
              {buffering || state === "loading" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : playing ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 translate-x-0.5 fill-current" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={next}
              disabled={!ready}
              aria-label="Next track"
              className="rounded-full p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <SkipForward className="size-4" />
            </button>
          </div>

          {/* Column 3: Right - Compact More ▾ Dropdown */}
          <div ref={moreMenuRef} className="relative justify-self-end">
            <button
              onClick={() => setMoreMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={moreMenuOpen}
              aria-label="More playback options"
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white"
            >
              <span className="font-mono text-[11px]">More</span>
              <MoreHorizontal className="size-3.5" />
            </button>

            {/* More ▾ Popover Menu */}
            {moreMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 bottom-full mb-2 w-64 rounded-2xl border border-white/15 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Volume Slider & Mute Row */}
                <div className="flex items-center justify-between gap-3 px-1 py-1.5">
                  <button
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                    className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {muted || volume === 0 ? (
                      <VolumeX className="size-4" />
                    ) : volume < 50 ? (
                      <Volume1 className="size-4" />
                    ) : (
                      <Volume2 className="size-4" />
                    )}
                  </button>

                  <input
                    type="range"
                    aria-label="Volume"
                    min={0}
                    max={100}
                    step={1}
                    value={muted ? 0 : volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 h-1.5 rounded-lg appearance-none bg-white/20 accent-amber-300 cursor-pointer"
                  />
                  <span className="w-7 text-right font-mono text-[10px] text-white/60 tabular-nums">
                    {muted ? 0 : volume}%
                  </span>
                </div>

                <div className="my-2 border-t border-white/10" />

                {/* Shuffle and Repeat Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleShuffle}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs transition-colors ${
                      shuffle
                        ? "bg-amber-400/20 text-amber-300 font-medium"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Shuffle className="size-3.5" />
                    <span>Shuffle {shuffle ? "On" : "Off"}</span>
                  </button>

                  <button
                    onClick={cycleRepeat}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs transition-colors ${
                      repeat !== "off"
                        ? "bg-amber-400/20 text-amber-300 font-medium"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {repeat === "one" ? (
                      <Repeat1 className="size-3.5" />
                    ) : (
                      <Repeat className="size-3.5" />
                    )}
                    <span className="capitalize">
                      {repeat === "off" ? "Repeat Off" : repeat === "one" ? "Repeat One" : "Repeat All"}
                    </span>
                  </button>
                </div>

                <div className="my-2 border-t border-white/10" />

                {/* Video Player Toggle (Hide/Show/Expand) */}
                <button
                  onClick={() => {
                    if (isEmbedHidden) {
                      setEmbedHidden(false);
                      setEmbedExpanded(true);
                    } else if (isEmbedExpanded) {
                      setEmbedHidden(true);
                    } else {
                      setEmbedExpanded(true);
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Tv className="size-4 text-amber-400" />
                    <span>Video Player Window</span>
                  </div>
                  <span className="font-mono text-[10px] text-amber-300">
                    {isEmbedHidden ? "Hidden" : isEmbedExpanded ? "Expanded" : "Compact"}
                  </span>
                </button>

                {/* Open Queue directly from menu */}
                <button
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setQueueOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <ListMusic className="size-4 text-amber-400" />
                  <span>Now Playing / Queue</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Track index / metadata footnote */}
        {track && track.total > 0 && !error && (
          <p className="mt-3 text-center font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
            Track {track.index} of {track.total}
          </p>
        )}
      </div>

      {/* Now Playing / Queue Panel Drawer */}
      <NowPlayingPanel isOpen={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  );
}
