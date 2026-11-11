"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
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
  activePlaylistName: string;
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
  const [isEmbedExpanded, setEmbedExpanded] = useState(false);

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
    sourceType: ytSourceType,
    sourceId: ytSourceId,
    initialVideoId,
    container: host,
  });

  // Local audio player instance
  const localFiles = activePlaylist?.source.type === "local" ? activePlaylist.source.files : [];
  const localPlayer = useLocalAudioPlayer({ files: localFiles });

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
        activePlaylistName: activePlaylist?.name || "Late Night Coding",
      }}
    >
      {children}

      {/* 
        Compliant YouTube Player Container:
        - When collapsed: positioned non-intrusively in a minimal 200x200 viewport corner or drawer
        - When expanded: expands into a beautiful picture-in-picture / video panel without obscuring YouTube controls
      */}
      {!isLocal && (
        <div
          className={`fixed transition-all duration-300 z-40 ${
            isEmbedExpanded
              ? "bottom-6 right-6 w-80 h-48 sm:w-96 sm:h-56 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-black/90 backdrop-blur-md"
              : "bottom-2 right-2 w-[200px] h-[200px] opacity-0 pointer-events-none -z-50"
          }`}
          aria-label="YouTube Video Player"
        >
          {isEmbedExpanded && (
            <div className="absolute top-2 right-2 z-50">
              <button
                onClick={() => setEmbedExpanded(false)}
                className="rounded-full bg-black/70 p-1 text-white/80 hover:bg-black hover:text-white"
                title="Minimize Video"
              >
                ✕
              </button>
            </div>
          )}
          <div ref={setHost} className="w-full h-full" />
        </div>
      )}
    </PlayerContext.Provider>
  );
}
