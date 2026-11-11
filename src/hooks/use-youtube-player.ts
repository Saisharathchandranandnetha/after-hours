"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  TrackInfo,
  QueueItem,
  RepeatMode,
  PlaybackState,
  UnifiedPlayer,
} from "@/types/player";
import {
  loadCheckpoint,
  createCheckpointManager,
} from "@/lib/playback-checkpoint";

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
  playlistId?: string;
  sourceType: "youtube" | "youtube-video";
  sourceId: string; // playlistId or videoId
  initialVideoId?: string; // start video in playlist
  container: HTMLDivElement | null;
  onTrackChange?: (track: TrackInfo) => void;
};

export function useYouTubePlayer({
  playlistId,
  sourceType,
  sourceId,
  initialVideoId,
  container,
  onTrackChange,
}: UseYouTubePlayerProps): UnifiedPlayer {
  const [player, setPlayer] = useState<YT.Player | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("loading");
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState<RepeatMode>("off");
  const [error, setError] = useState<string | null>(null);
  const [hasCheckpoint, setHasCheckpoint] = useState(false);

  const playerRef = useRef<YT.Player | null>(null);
  const currentSourceRef = useRef<string>("");
  const repeatRef = useRef<RepeatMode>(repeat);
  const isPlayingRef = useRef<boolean>(playing);
  const positionRef = useRef<number>(position);
  const durationRef = useRef<number>(duration);
  const trackRef = useRef<TrackInfo | null>(track);
  const playlistIdRef = useRef<string | undefined>(playlistId);

  useEffect(() => {
    repeatRef.current = repeat;
    isPlayingRef.current = playing;
    positionRef.current = position;
    durationRef.current = duration;
    trackRef.current = track;
    playlistIdRef.current = playlistId;
  }, [repeat, playing, position, duration, track, playlistId]);

  // Checkpoint manager
  const checkpointManagerRef = useRef(createCheckpointManager(2500));

  const saveCurrentCheckpoint = useCallback(
    (immediate = false, stateOverride?: PlaybackState) => {
      const activePid = playlistIdRef.current;
      if (!activePid) return;

      const curTrack = trackRef.current;
      const curPos = positionRef.current;
      const curDur = durationRef.current;
      const curState = stateOverride ?? (isPlayingRef.current ? "playing" : "paused");

      checkpointManagerRef.current.update(
        {
          playlistId: activePid,
          trackId: curTrack?.id,
          trackTitle: curTrack?.title,
          trackArtist: curTrack?.artist,
          playlistIndex: curTrack ? curTrack.index - 1 : 0,
          position: curPos,
          duration: curDur,
          lastPlaybackState: curState,
          volume,
          shuffle,
          repeat: repeatRef.current,
          updatedAt: Date.now(),
        },
        immediate
      );
    },
    [volume, shuffle]
  );

  const syncTrack = useCallback(
    (instance: YT.Player) => {
      try {
        const data = instance.getVideoData?.();
        if (!data?.video_id && !data?.title) return;

        const rawPlaylist = instance.getPlaylist?.();
        const playlistIndex = instance.getPlaylistIndex?.() ?? 0;
        const dur = instance.getDuration?.() || 0;

        const info: TrackInfo = {
          id: data.video_id,
          title: data.title || "Untitled",
          artist: data.author || "Unknown Artist",
          index: rawPlaylist ? playlistIndex + 1 : 1,
          total: rawPlaylist?.length || 1,
          duration: dur,
        };

        setTrack(info);
        setDuration(dur);
        onTrackChange?.(info);

        // Build queue items
        if (Array.isArray(rawPlaylist) && rawPlaylist.length > 0) {
          const items: QueueItem[] = rawPlaylist.map((id: string, idx: number) => ({
            id,
            title: idx === playlistIndex ? data.title || `Track ${idx + 1}` : `Track ${idx + 1}`,
            artist: idx === playlistIndex ? data.author || "" : "",
            index: idx,
            duration: idx === playlistIndex ? dur : undefined,
          }));
          setQueue(items);
        }
      } catch {
        // Ignored
      }
    },
    [onTrackChange]
  );

  // 1. Mount YouTube Player (Only depends on container)
  useEffect(() => {
    if (!container) return;

    let cancelled = false;

    loadIframeApi().then((api) => {
      if (cancelled || !container) return;

      const isPlaylist = sourceType === "youtube";
      const savedCheckpoint = loadCheckpoint();
      const hasMatchingCheckpoint =
        savedCheckpoint && playlistId && savedCheckpoint.playlistId === playlistId;

      if (hasMatchingCheckpoint && savedCheckpoint.position > 0) {
        setHasCheckpoint(true);
      }

      const playerVars: Record<string, string | number> = {
        autoplay: 0,
        controls: 1, // Visible ToS compliance
        disablekb: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      };

      if (isPlaylist) {
        playerVars.listType = "playlist";
        playerVars.list = sourceId;
        if (hasMatchingCheckpoint && savedCheckpoint.playlistIndex) {
          playerVars.index = savedCheckpoint.playlistIndex;
        }
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
            setPlaybackState("ready");
            setError(null);

            // Restore saved checkpoint position without autoplaying
            if (hasMatchingCheckpoint && savedCheckpoint.position > 0) {
              try {
                event.target.seekTo(savedCheckpoint.position, false);
                setPosition(savedCheckpoint.position);
              } catch {}
            }

            syncTrack(event.target);
          },
          onStateChange: (event) => {
            if (cancelled) return;
            const { PlayerState } = api;

            switch (event.data) {
              case PlayerState.PLAYING:
                setPlaying(true);
                setBuffering(false);
                setPlaybackState("playing");
                setHasCheckpoint(false);
                syncTrack(event.target);
                break;
              case PlayerState.PAUSED:
                setPlaying(false);
                setBuffering(false);
                setPlaybackState("paused");
                saveCurrentCheckpoint(true, "paused");
                break;
              case PlayerState.BUFFERING:
                setBuffering(true);
                setPlaybackState("buffering");
                break;
              case PlayerState.ENDED:
                setPlaying(false);
                setBuffering(false);
                setPlaybackState("ended");
                saveCurrentCheckpoint(true, "ended");

                // Handle repeat modes
                if (repeatRef.current === "one") {
                  event.target.seekTo(0, true);
                  event.target.playVideo();
                } else if (repeatRef.current === "all") {
                  // If last video in playlist, loop back to first
                  const playlist = event.target.getPlaylist?.();
                  const currentIndex = event.target.getPlaylistIndex?.() ?? 0;
                  if (playlist && currentIndex === playlist.length - 1) {
                    event.target.playVideoAt(0);
                  }
                }
                break;
              case PlayerState.CUED:
              case PlayerState.UNSTARTED:
                setPlaying(false);
                setBuffering(false);
                setPlaybackState("ready");
                syncTrack(event.target);
                break;
            }
          },
          onError: (event) => {
            if (cancelled) return;
            setPlaybackState("error");
            // 101/150 = embedding blocked by video owner -> try next
            if (event.data === 101 || event.data === 150) {
              try {
                event.target.nextVideo();
                return;
              } catch {}
            }
            setError("Unable to stream this track or playlist.");
          },
        },
      });

      playerRef.current = instance;
      setPlayer(instance);
      currentSourceRef.current = `${sourceType}:${sourceId}`;
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]); // Only depends on container!

  // 2. Handle source change (switching playlist / track)
  useEffect(() => {
    const inst = playerRef.current;
    if (!inst || !sourceId || !ready) return;

    const sourceKey = `${sourceType}:${sourceId}`;
    if (currentSourceRef.current === sourceKey) return;
    currentSourceRef.current = sourceKey;

    const isPlaylist = sourceType === "youtube";
    const wasPlaying = isPlayingRef.current;

    // Check if there is a saved checkpoint for this specific playlist
    const savedCheckpoint = loadCheckpoint();
    const hasMatchingCheckpoint =
      savedCheckpoint && playlistId && savedCheckpoint.playlistId === playlistId;

    try {
      if (isPlaylist) {
        const targetIndex = hasMatchingCheckpoint ? savedCheckpoint.playlistIndex : 0;
        const targetTime = hasMatchingCheckpoint ? savedCheckpoint.position : 0;

        // If previously playing, load and continue; otherwise cue without autoplaying
        if (wasPlaying) {
          inst.loadPlaylist({
            listType: "playlist",
            list: sourceId,
            index: targetIndex,
            startSeconds: targetTime,
          });
        } else {
          inst.cuePlaylist({
            listType: "playlist",
            list: sourceId,
            index: targetIndex,
            startSeconds: targetTime,
          });
        }
      } else {
        if (wasPlaying) {
          inst.loadVideoById({
            videoId: sourceId,
            startSeconds: hasMatchingCheckpoint ? savedCheckpoint.position : 0,
          });
        } else {
          inst.cueVideoById({
            videoId: sourceId,
            startSeconds: hasMatchingCheckpoint ? savedCheckpoint.position : 0,
          });
        }
      }
    } catch (err) {
      console.warn("Failed to update YouTube player source:", err);
    }
  }, [sourceId, sourceType, ready, playlistId]);

  // 3. Repeat configuration effect (Never reloads player)
  useEffect(() => {
    if (!player) return;
    try {
      player.setLoop(repeat === "all");
    } catch {}
  }, [player, repeat]);

  // 4. Shuffle configuration effect (Never reloads player)
  useEffect(() => {
    if (!player) return;
    try {
      player.setShuffle(shuffle);
    } catch {}
  }, [player, shuffle]);

  // 5. Clean disposal on unmount
  useEffect(() => {
    const manager = checkpointManagerRef.current;
    return () => {
      if (playerRef.current) {
        try {
          manager.flush();
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, []);

  // 6. Time position polling and throttled checkpoint saving while playing
  useEffect(() => {
    if (!player || !playing) return;

    const interval = setInterval(() => {
      try {
        const cur = player.getCurrentTime();
        const dur = player.getDuration();
        if (typeof cur === "number") {
          setPosition(cur);
          positionRef.current = cur;
        }
        if (typeof dur === "number" && dur > 0) {
          setDuration(dur);
          durationRef.current = dur;
        }

        // Throttled checkpoint update
        saveCurrentCheckpoint(false, "playing");
      } catch {}
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [player, playing, saveCurrentCheckpoint]);

  // 7. Flush checkpoint on visibility change or pagehide
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        saveCurrentCheckpoint(true);
      }
    };
    const handlePageHide = () => {
      saveCurrentCheckpoint(true);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [saveCurrentCheckpoint]);

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
    saveCurrentCheckpoint(true, "paused");
  }, [player, saveCurrentCheckpoint]);

  const resume = useCallback(() => {
    if (!player) return;
    player.playVideo();
    setHasCheckpoint(false);
  }, [player]);

  const next = useCallback(() => {
    if (!player) return;
    player.nextVideo();
    setPosition(0);
    positionRef.current = 0;
  }, [player]);

  const previous = useCallback(() => {
    if (!player) return;
    try {
      const cur = player.getCurrentTime();
      if (cur > 3) {
        player.seekTo(0, true);
        setPosition(0);
        positionRef.current = 0;
      } else {
        player.previousVideo();
        setPosition(0);
        positionRef.current = 0;
      }
    } catch {
      player.previousVideo();
    }
  }, [player]);

  const seek = useCallback(
    (seconds: number) => {
      if (!player) return;
      setPosition(seconds);
      positionRef.current = seconds;
      player.seekTo(seconds, true);
      saveCurrentCheckpoint(true);
    },
    [player, saveCurrentCheckpoint]
  );

  const playTrackAtIndex = useCallback(
    (index: number) => {
      if (!player) return;
      try {
        player.playVideoAt(index);
      } catch (err) {
        console.warn("Could not play video at index", index, err);
      }
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
    setShuffleState((curr) => {
      const nextVal = !curr;
      if (player) {
        player.setShuffle(nextVal);
      }
      return nextVal;
    });
  }, [player]);

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
    state: playbackState,
    ready,
    playing,
    buffering,
    live: ready && track !== null && duration === 0,
    track,
    queue,
    position,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    error,
    hasCheckpoint,
    toggle,
    play,
    pause,
    resume,
    next,
    previous,
    seek,
    playTrackAtIndex,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  };
}
