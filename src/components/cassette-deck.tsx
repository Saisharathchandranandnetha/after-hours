"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Cassette } from "./cassette";
import { usePlayerContext } from "./player-provider";
import { formatDuration } from "@/lib/format";

type CassetteDeckProps = {
  onOpenTimer?: () => void;
  onToggleFocusMode?: () => void;
};

export function CassetteDeck({ onOpenTimer, onToggleFocusMode }: CassetteDeckProps) {
  const { player, isEmbedExpanded, setEmbedExpanded, activePlaylistName } = usePlayerContext();

  const {
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
    toggle,
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
  const displayed = scrub ?? position;
  const seekable = ready && !live && duration > 0;

  // Global keyboard shortcuts (Space, Arrows, M, F, T)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is currently interacting with an input or editable field
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
    <div className="w-full max-w-[28rem] rounded-3xl bg-zinc-950/60 p-4 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.95)] ring-1 ring-white/15 backdrop-blur-xl transition-all">
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
          {live ? "live" : formatDuration(displayed)}
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

      {/* Transport buttons & Volume & Extras */}
      <div className="mt-3.5 flex items-center justify-between px-1">
        {/* Playback Transport */}
        <div className="flex items-center gap-1.5">
          {/* Previous Track */}
          <button
            onClick={previous}
            disabled={!ready}
            aria-label="Previous track"
            className="rounded-full p-2 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <SkipBack className="size-4" />
          </button>

          {/* Big Play/Pause Button */}
          <button
            onClick={toggle}
            disabled={!ready}
            aria-label={playing ? "Pause" : "Play"}
            className="rounded-full bg-white p-3 text-zinc-950 shadow-lg shadow-white/10 transition-all hover:scale-105 hover:bg-white/90 active:scale-95 disabled:opacity-50"
          >
            {buffering ? (
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

        {/* Shuffle & Repeat Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleShuffle}
            disabled={!ready}
            title={shuffle ? "Shuffle On" : "Shuffle Off"}
            aria-label="Toggle shuffle"
            className={`rounded-full p-2 transition-colors ${
              shuffle ? "text-amber-400 bg-amber-400/10" : "text-white/40 hover:text-white/80"
            }`}
          >
            <Shuffle className="size-3.5" />
          </button>

          <button
            onClick={cycleRepeat}
            disabled={!ready}
            title={`Repeat: ${repeat}`}
            aria-label={`Cycle repeat mode (${repeat})`}
            className={`rounded-full p-2 transition-colors ${
              repeat !== "off" ? "text-amber-400 bg-amber-400/10" : "text-white/40 hover:text-white/80"
            }`}
          >
            {repeat === "one" ? (
              <Repeat1 className="size-3.5" />
            ) : (
              <Repeat className="size-3.5" />
            )}
          </button>

          {/* YouTube Video expand button (for full ToS compliance) */}
          <button
            onClick={() => setEmbedExpanded((prev) => !prev)}
            title={isEmbedExpanded ? "Hide Video Window" : "Show Video Player"}
            aria-label="Toggle video player window"
            className={`rounded-full p-2 transition-colors ${
              isEmbedExpanded ? "text-amber-400 bg-amber-400/10" : "text-white/40 hover:text-white/80"
            }`}
          >
            <Tv className="size-3.5" />
          </button>
        </div>

        {/* Volume controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            disabled={!ready}
            aria-label={muted ? "Unmute" : "Mute"}
            className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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
            className="w-18 h-1 rounded-lg appearance-none bg-white/20 accent-white/80 cursor-pointer"
          />
        </div>
      </div>

      {/* Track index / metadata footnote */}
      {track && track.total > 0 && !error && (
        <p className="mt-3 text-center font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
          Track {track.index} of {track.total}
        </p>
      )}
    </div>
  );
}
