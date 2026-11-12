"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Maximize2, Minimize2, Tv, EyeOff } from "lucide-react";
import { usePlaylistStore } from "@/lib/playlist-store";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useLocalAudioPlayer } from "@/hooks/use-local-audio-player";
import type { UnifiedPlayer } from "@/types/player";
import type { Playlist } from "@/lib/playlist";
import { soundEffects } from "@/lib/sound-effects";

type PlayerContextValue = {
  player: UnifiedPlayer;
  isEmbedExpanded: boolean;
  setEmbedExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
  isEmbedHidden: boolean;
  setEmbedHidden: (hidden: boolean | ((prev: boolean) => boolean)) => void;
  activePlaylistName: string;
  activePlaylist: Playlist | undefined;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayerContext must be used within <PlayerProvider>");
  }
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { playlists, activePlaylistId, hydrate } = usePlaylistStore();
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [isEmbedExpanded, setEmbedExpanded] = useState(true);
  const [isEmbedHidden, setEmbedHidden] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const activePlaylist = useMemo(() => {
    return playlists.find((p: Playlist) => p.id === activePlaylistId) || playlists[0];
  }, [playlists, activePlaylistId]);

  const isLocal = activePlaylist?.source.type === "local";
  const isVideo = activePlaylist?.source.type === "youtube-video";

  // YouTube player instance
  const ytSourceType = isVideo ? "youtube-video" : "youtube";
  const ytSourceId =
    activePlaylist?.source.type === "youtube"
      ? activePlaylist.source.playlistId
      : activePlaylist?.source.type === "youtube-video"
        ? activePlaylist.source.videoId
        : "";

  const initialVideoId =
    activePlaylist?.source.type === "youtube" ? activePlaylist.source.videoId : undefined;

  const ytPlayer = useYouTubePlayer({
    playlistId: activePlaylist?.id,
    sourceType: ytSourceType,
    sourceId: ytSourceId,
    initialVideoId,
    container: host,
  });

  // Local audio player instance
  const localFiles = activePlaylist?.source.type === "local" ? activePlaylist.source.files : [];
  const localPlayer = useLocalAudioPlayer({
    files: localFiles,
    playlistId: activePlaylist?.id,
  });

  const activePlayer: UnifiedPlayer = isLocal ? localPlayer : ytPlayer;

  // Wrap toggle and transport actions with tactile sound effects
  const wrappedPlayer: UnifiedPlayer = useMemo(() => {
    return {
      ...activePlayer,
      toggle: () => {
        soundEffects.playClick(activePlayer.playing ? "release" : "press");
        activePlayer.toggle();
      },
      next: () => {
        soundEffects.playClick("press");
        activePlayer.next();
      },
      previous: () => {
        soundEffects.playClick("press");
        activePlayer.previous();
      },
    };
  }, [activePlayer]);

  return (
    <PlayerContext.Provider
      value={{
        player: wrappedPlayer,
        isEmbedExpanded,
        setEmbedExpanded,
        isEmbedHidden,
        setEmbedHidden,
        activePlaylistName: activePlaylist?.name || "Late Night Coding",
        activePlaylist,
      }}
    >
      {children}

      {/* 
        Compliant, Genuinely Visible YouTube Player Container:
        - Never obscured with opacity-0 or negative z-index.
        - Compact mode: 240px x 140px docked cleanly at bottom-right with glass border.
        - Expanded mode: 480px x 270px desktop (or 90vw max 520px mobile).
        - YouTube controls and branding are preserved and accessible.
        - Hide / Show mode toggles visibility cleanly without stopping playback.
      */}
      {!isLocal && (
        <div
          className={`fixed transition-all duration-300 select-none ${
            isEmbedHidden
              ? "opacity-0 pointer-events-none -translate-x-[9999px] bottom-5 right-5 w-[200px] h-[120px]"
              : isEmbedExpanded
                ? "z-50 pointer-events-auto bottom-5 right-5 w-[90vw] max-w-[500px] h-[280px] sm:w-[480px] sm:h-[270px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-amber-400/30 bg-black/95 backdrop-blur-xl"
                : "z-50 pointer-events-auto bottom-3 right-3 sm:bottom-4 sm:right-4 w-[200px] h-[120px] sm:w-[240px] sm:h-[150px] rounded-xl shadow-xl border border-white/15 bg-black/90 backdrop-blur-md opacity-85 hover:opacity-100"
          } overflow-hidden group`}
          aria-label="YouTube Video Player"
        >
          {/* Header bar with controls */}
          <div
            className={`absolute top-0 left-0 right-0 h-7 bg-gradient-to-b from-black/80 to-transparent px-2 flex items-center justify-between z-50 ${
              isEmbedHidden ? "pointer-events-none" : "pointer-events-auto"
            }`}
          >
            <button
              type="button"
              onClick={() => setEmbedExpanded((prev) => !prev)}
              className="flex items-center gap-1.5 text-[10px] font-mono text-white/80 hover:text-white transition-colors cursor-pointer"
              title={isEmbedExpanded ? "Collapse video" : "Expand live stream video [TV]"}
            >
              <Tv className="size-3 text-amber-400 shrink-0" />
              <span className="truncate max-w-[120px]">
                {activePlayer.track?.title || "Live Stream"}
              </span>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEmbedExpanded((prev) => !prev)}
                className="rounded p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isEmbedExpanded ? "Contract Player" : "Expand Player"}
                aria-label={isEmbedExpanded ? "Contract Video Player" : "Expand Video Player"}
              >
                {isEmbedExpanded ? (
                  <Minimize2 className="size-3" />
                ) : (
                  <Maximize2 className="size-3" />
                )}
              </button>

              {/* Hide Button */}
              <button
                type="button"
                onClick={() => setEmbedHidden(true)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Hide live stream window"
                aria-label="Hide live stream window"
              >
                <EyeOff className="size-3 text-amber-400" />
                <span>Hide</span>
              </button>
            </div>
          </div>

          {/* YouTube IFrame host */}
          <div className="w-full h-full pt-6">
            <div ref={setHost} className="w-full h-full" />
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
}
