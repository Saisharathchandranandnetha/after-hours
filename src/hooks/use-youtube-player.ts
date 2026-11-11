"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TrackInfo, RepeatMode, UnifiedPlayer } from "@/types/player";

const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";
const POLL_INTERVAL_MS = 250;
const DEFAULT_VOLUME = 70;

let apiPromise: Promise<typeof YT> | null = null;

function loadIframeApi(): Promise<typeof YT> {
  if (typeof window === "undefined") {
    return new Promise(() => {});
  }
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };

    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = IFRAME_API_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}

type UseYouTubePlayerProps = {
  sourceType: "youtube" | "youtube-video";
  sourceId: string; // playlistId or videoId
  initialVideoId?: string; // start video in playlist
  container: HTMLDivElement | null;
  onTrackChange?: (track: TrackInfo) => void;
};

export function useYouTubePlayer({
  sourceType,
  sourceId,
  initialVideoId,
  container,
  onTrackChange,
}: UseYouTubePlayerProps): UnifiedPlayer {
  const [player, setPlayer] = useState<YT.Player | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState<RepeatMode>("off");
  const [error, setError] = useState<string | null>(null);

  const playerRef = useRef<YT.Player | null>(null);
  const currentSourceRef = useRef<string>("");

  const syncTrack = useCallback(
    (instance: YT.Player) => {
      try {
        const data = instance.getVideoData?.();
        if (!data?.video_id && !data?.title) return;

        const playlist = instance.getPlaylist?.();
        const playlistIndex = instance.getPlaylistIndex?.() ?? 0;

        const info: TrackInfo = {
          title: data.title || "Untitled",
          artist: data.author || "Unknown Artist",
          index: playlist ? playlistIndex + 1 : 1,
          total: playlist?.length || 1,
          duration: instance.getDuration?.() || 0,
        };

        setTrack(info);
        setDuration(instance.getDuration?.() || 0);
        onTrackChange?.(info);
      } catch {
        // Ignored
      }
    },
    [onTrackChange]
  );

  // Initialize or re-cue on source change
  useEffect(() => {
    if (!container || !sourceId) return;

    let cancelled = false;
    currentSourceRef.current = `${sourceType}:${sourceId}`;

    loadIframeApi().then((api) => {
      if (cancelled) return;

      // If player already exists and container is unchanged, reuse instance
      if (playerRef.current && typeof playerRef.current.loadPlaylist === "function") {
        try {
          if (sourceType === "youtube") {
            playerRef.current.loadPlaylist({
              listType: "playlist",
              list: sourceId,
              index: 0,
            });
          } else {
            playerRef.current.loadVideoById(sourceId);
          }
          return;
        } catch {
          // Re-create player if reload fails
        }
      }

      // Create new instance
      const isPlaylist = sourceType === "youtube";
      const playerVars: Record<string, string | number> = {
        autoplay: 0,
        controls: 1, // Required for visible compliance
        disablekb: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      };

      if (isPlaylist) {
        playerVars.listType = "playlist";
        playerVars.list = sourceId;
      }

      const instance = new api.Player(container, {
        width: "100%",
        height: "100%",
        videoId: !isPlaylist ? sourceId : initialVideoId || undefined,
        playerVars,
        events: {
          onReady: (event) => {
            if (cancelled) return;
            event.target.setVolume(DEFAULT_VOLUME);
            setMuted(event.target.isMuted());
            setReady(true);
            setError(null);
            syncTrack(event.target);
          },
          onStateChange: (event) => {
            if (cancelled) return;
            const { PlayerState } = api;

            const isPlay = event.data === PlayerState.PLAYING;
            const isBuffer = event.data === PlayerState.BUFFERING;
            setPlaying(isPlay);
            setBuffering(isBuffer);

            if (isPlay || event.data === PlayerState.CUED || event.data === PlayerState.UNSTARTED) {
              syncTrack(event.target);
            }

            // Loop / repeat-one handling
            if (event.data === PlayerState.ENDED) {
              if (repeat === "one") {
                event.target.seekTo(0, true);
                event.target.playVideo();
              }
            }
          },
          onError: (event) => {
            if (cancelled) return;
            // 101/150 = embedding blocked by video owner -> advance to next
            if (event.data === 101 || event.data === 150) {
              event.target.nextVideo();
              return;
            }
            setError("Unable to stream this track or playlist.");
          },
        },
      });

      playerRef.current = instance;
      setPlayer(instance);
    });

    return () => {
      cancelled = true;
    };
  }, [container, sourceId, sourceType, initialVideoId, syncTrack, repeat]);

  // Clean disposal on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, []);

  // Time position polling while playing
  useEffect(() => {
    if (!player || !playing) return;

    const interval = setInterval(() => {
      try {
        const cur = player.getCurrentTime();
        const dur = player.getDuration();
        setPosition(cur || 0);
        if (dur && dur > 0) {
          setDuration(dur);
        }
      } catch {}
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [player, playing]);

  const toggle = useCallback(() => {
    if (!player) return;
    if (playing) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }, [player, playing]);

  const play = useCallback(() => {
    if (!player) return;
    player.playVideo();
  }, [player]);

  const pause = useCallback(() => {
    if (!player) return;
    player.pauseVideo();
  }, [player]);

  const next = useCallback(() => {
    if (!player) return;
    player.nextVideo();
    setPosition(0);
  }, [player]);

  const previous = useCallback(() => {
    if (!player) return;
    if (player.getCurrentTime() > 3) {
      player.seekTo(0, true);
    } else {
      player.previousVideo();
    }
    setPosition(0);
  }, [player]);

  const seek = useCallback(
    (seconds: number) => {
      if (!player) return;
      setPosition(seconds);
      player.seekTo(seconds, true);
    },
    [player]
  );

  const setVolume = useCallback(
    (val: number) => {
      if (!player) return;
      setVolumeState(val);
      player.setVolume(val);
      if (val === 0) {
        player.mute();
        setMuted(true);
      } else if (player.isMuted()) {
        player.unMute();
        setMuted(false);
      }
    },
    [player]
  );

  const toggleMute = useCallback(() => {
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }, [player]);

  const toggleShuffle = useCallback(() => {
    if (!player) return;
    const nextVal = !shuffle;
    setShuffleState(nextVal);
    player.setShuffle(nextVal);
  }, [player, shuffle]);

  const cycleRepeat = useCallback(() => {
    setRepeatState((curr) => {
      const nextMode: RepeatMode = curr === "off" ? "all" : curr === "all" ? "one" : "off";
      if (player) {
        player.setLoop(nextMode === "all");
      }
      return nextMode;
    });
  }, [player]);

  return {
    ready,
    playing,
    buffering,
    live: ready && track !== null && duration === 0,
    track,
    position,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    error,
    toggle,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  };
}
