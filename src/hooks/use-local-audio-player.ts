"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LocalAudioFile } from "@/lib/playlist";
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

type UseLocalAudioPlayerProps = {
  files: LocalAudioFile[];
  playlistId?: string;
};

export function useLocalAudioPlayer({
  files,
  playlistId,
}: UseLocalAudioPlayerProps): UnifiedPlayer {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = loadCheckpoint();
    if (saved && playlistId && saved.playlistId === playlistId) {
      if (saved.playlistIndex < files.length) {
        return saved.playlistIndex;
      }
    }
    return 0;
  });
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    files.length > 0 ? "ready" : "idle"
  );
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [error, setError] = useState<string | null>(null);
  const [hasCheckpoint, setHasCheckpoint] = useState(() => {
    const saved = loadCheckpoint();
    return Boolean(
      saved && playlistId && saved.playlistId === playlistId && saved.position > 0
    );
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(playing);
  const repeatRef = useRef(repeat);
  const positionRef = useRef(position);
  const durationRef = useRef(duration);
  const currentFileIdRef = useRef<string | null>(null);
  const checkpointManagerRef = useRef(createCheckpointManager(2500));

  useEffect(() => {
    isPlayingRef.current = playing;
    repeatRef.current = repeat;
    positionRef.current = position;
    durationRef.current = duration;
  }, [playing, repeat, position, duration]);

  const currentFile = files[currentIndex];

  const track: TrackInfo | null = currentFile
    ? {
        id: currentFile.id,
        title: currentFile.name,
        artist: currentFile.artist || "Local Audio",
        index: currentIndex + 1,
        total: files.length,
        duration: duration,
        backgroundUrl: currentFile.backgroundUrl,
      }
    : null;

  const queue: QueueItem[] = useMemo(() => {
    return files.map((f, idx) => ({
      id: f.id,
      title: f.name,
      artist: f.artist || "Local Audio",
      index: idx,
      duration: f.duration,
      backgroundUrl: f.backgroundUrl,
    }));
  }, [files]);

  const saveCurrentCheckpoint = useCallback(
    (immediate = false, stateOverride?: PlaybackState) => {
      if (!playlistId || !currentFile) return;

      const curPos = positionRef.current;
      const curDur = durationRef.current;
      const curState = stateOverride ?? (isPlayingRef.current ? "playing" : "paused");

      checkpointManagerRef.current.update(
        {
          playlistId,
          trackId: currentFile.id,
          trackTitle: currentFile.name,
          trackArtist: currentFile.artist,
          playlistIndex: currentIndex,
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
    [playlistId, currentFile, currentIndex, volume, shuffle]
  );

  // 1. Initialize HTMLAudioElement instance once
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      const dur = audio.duration || 0;
      setDuration(dur);
      durationRef.current = dur;
      setBuffering(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      const cur = audio.currentTime;
      setPosition(cur);
      positionRef.current = cur;
      if (isPlayingRef.current) {
        saveCurrentCheckpoint(false, "playing");
      }
    };

    const handlePlay = () => {
      setPlaying(true);
      setPlaybackState("playing");
      setHasCheckpoint(false);
    };

    const handlePause = () => {
      setPlaying(false);
      setPlaybackState("paused");
      saveCurrentCheckpoint(true, "paused");
    };

    const handleWaiting = () => {
      setBuffering(true);
      setPlaybackState("buffering");
    };

    const handlePlaying = () => {
      setBuffering(false);
      setPlaybackState("playing");
    };

    const handleError = () => {
      setError("Failed to decode or play local audio file.");
      setBuffering(false);
      setPlaying(false);
      setPlaybackState("error");
      saveCurrentCheckpoint(true, "error");
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    const manager = checkpointManagerRef.current;
    return () => {
      manager.flush();
      audio.pause();
      audio.src = "";
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Update source ONLY when currentFile changes (NOT on playing change!)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentFile) return;

    if (currentFileIdRef.current === currentFile.id) {
      return;
    }
    currentFileIdRef.current = currentFile.id;

    audio.src = currentFile.src;
    audio.load();
    setPlaybackState("loading");

    // If there's a matching checkpoint for this track, cue the timestamp
    const saved = loadCheckpoint();
    if (saved && playlistId && saved.playlistId === playlistId && saved.position > 0) {
      audio.currentTime = saved.position;
      positionRef.current = saved.position;
    } else {
      positionRef.current = 0;
    }

    if (isPlayingRef.current) {
      audio.play().catch(() => {
        setPlaying(false);
        setPlaybackState("paused");
      });
    } else {
      setPlaybackState("ready");
    }
  }, [currentFile, playlistId]);

  // 3. Track ended handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setPlaybackState("ended");
      saveCurrentCheckpoint(true, "ended");

      if (repeatRef.current === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      if (currentIndex < files.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (repeatRef.current === "all") {
        setCurrentIndex(0);
      } else {
        setPlaying(false);
        setPlaybackState("ready");
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentIndex, files.length, saveCurrentCheckpoint]);

  // 4. Flush checkpoint on visibilitychange or pagehide
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
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [playing]);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setHasCheckpoint(false);
  }, []);

  const next = useCallback(() => {
    if (files.length <= 1) return;
    if (shuffle) {
      const nextIdx = Math.floor(Math.random() * files.length);
      setCurrentIndex(nextIdx);
    } else {
      setCurrentIndex((i) => (i + 1) % files.length);
    }
    setPosition(0);
    positionRef.current = 0;
  }, [files.length, shuffle]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setPosition(0);
      positionRef.current = 0;
    } else {
      setCurrentIndex((i) => (i - 1 + files.length) % files.length);
      setPosition(0);
      positionRef.current = 0;
    }
  }, [files.length]);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = seconds;
      setPosition(seconds);
      positionRef.current = seconds;
      saveCurrentCheckpoint(true);
    },
    [saveCurrentCheckpoint]
  );

  const playTrackAtIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < files.length) {
        setCurrentIndex(index);
        setPosition(0);
        positionRef.current = 0;
        audioRef.current?.play().catch(() => {});
      }
    },
    [files.length]
  );

  const setVolume = useCallback((val: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    setVolumeState(val);
    audio.volume = Math.max(0, Math.min(1, val / 100));
    if (val === 0) {
      audio.muted = true;
      setMuted(true);
    } else if (audio.muted) {
      audio.muted = false;
      setMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextVal = !audio.muted;
    audio.muted = nextVal;
    setMuted(nextVal);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => !s);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  return {
    state: playbackState,
    ready: files.length > 0,
    playing,
    buffering,
    live: false,
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
