"use client";

import { useEffect, useRef } from "react";
import { X, Music, Radio, Disc } from "lucide-react";
import { usePlayerContext } from "./player-provider";
import { formatDuration } from "@/lib/format";

type NowPlayingPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function NowPlayingPanel({ isOpen, onClose }: NowPlayingPanelProps) {
  const { player, activePlaylistName } = usePlayerContext();
  const panelRef = useRef<HTMLDivElement | null>(null);

  const {
    track,
    queue,
    playing,
    position,
    duration,
    playTrackAtIndex,
  } = player;

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Dimmed backdrop on mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Queue Panel: desktop left-side drawer, mobile bottom sheet */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-label="Now Playing and Queue"
        aria-modal="true"
        className="fixed bottom-0 left-0 top-auto sm:top-0 z-50 flex h-[70vh] sm:h-full w-full sm:w-96 flex-col border-t sm:border-t-0 sm:border-r border-white/15 bg-zinc-950/90 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-all duration-300 animate-in slide-in-from-bottom sm:slide-in-from-left duration-200"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Radio className="size-4 text-amber-400" />
            <span className="font-mono text-xs font-medium tracking-wider text-white/90 uppercase">
              Now Playing & Queue
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close Queue Panel"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Current Track Hero Card */}
        <div className="border-b border-white/10 p-5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 shadow-inner">
              <Disc
                className={`size-6 ${
                  playing ? "animate-spin duration-3000 ease-linear" : ""
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-heading text-lg font-medium leading-tight text-white/95 truncate">
                {track?.title || "Late Night Session"}
              </p>
              <p className="font-mono text-xs text-white/50 truncate mt-0.5">
                {track?.artist || "Ambient & Lofi"}
              </p>
              <p className="font-mono text-[10px] text-amber-400/80 mt-1 uppercase tracking-wider">
                {activePlaylistName}
              </p>
            </div>
          </div>

          {/* Progress row */}
          <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-white/60 tabular-nums">
            <span>{formatDuration(position)}</span>
            <div className="h-1 flex-1 mx-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{
                  width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
                }}
              />
            </div>
            <span>{duration > 0 ? formatDuration(duration) : "∞"}</span>
          </div>
        </div>

        {/* Queue List Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="font-mono text-[11px] tracking-wider text-white/40 uppercase">
            Up Next ({queue.length || 1})
          </span>
        </div>

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
          {queue.length > 0 ? (
            queue.map((item, idx) => {
              const isCurrent =
                track ? track.index === idx + 1 : idx === 0;

              return (
                <button
                  key={`${item.id}-${idx}`}
                  type="button"
                  onClick={() => playTrackAtIndex(idx)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isCurrent
                      ? "bg-amber-400/15 border border-amber-400/30 text-amber-200"
                      : "border border-transparent hover:bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`font-mono text-xs w-5 shrink-0 text-center ${
                        isCurrent ? "text-amber-400 font-bold" : "text-white/30"
                      }`}
                    >
                      {isCurrent && playing ? "▶" : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-xs truncate ${
                          isCurrent ? "font-medium text-white" : "text-white/80"
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.artist && (
                        <p className="text-[10px] text-white/40 truncate">
                          {item.artist}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.duration && item.duration > 0 && (
                    <span className="font-mono text-[10px] text-white/40 ml-2 shrink-0 tabular-nums">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-white/40">
              <Music className="size-8 stroke-1 mb-2 opacity-50" />
              <p className="text-xs">No playlist items loaded yet.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
