"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LocalAudioFile } from "@/lib/playlist";
import type { TrackInfo, RepeatMode, UnifiedPlayer } from "@/types/player";

type UseLocalAudioPlayerProps = {
  files: LocalAudioFile[];
};

export function useLocalAudioPlayer({
  files,
}: UseLocalAudioPlayerProps): UnifiedPlayer {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentFile = files[currentIndex];

  const track: TrackInfo | null = currentFile
    ? {
        title: currentFile.name,
        artist: currentFile.artist || "Local Audio",
        index: currentIndex + 1,
        total: files.length,
        duration: duration,
      }
    : null;

  // Initialize HTMLAudioElement
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setBuffering(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setPosition(audio.currentTime);
    };

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleWaiting = () => setBuffering(true);
    const handlePlaying = () => setBuffering(false);

    const handleError = () => {
      setError("Failed to decode or play local audio file.");
      setBuffering(false);
      setPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    return () => {
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
  }, []);

  // Update source when currentFile changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentFile) return;

    audio.src = currentFile.src;
    audio.load();
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    }
  }, [currentFile, playing]);

  // Handle track ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      if (currentIndex < files.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (repeat === "all") {
        setCurrentIndex(0);
      } else {
        setPlaying(false);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentIndex, files.length, repeat]);

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

  const next = useCallback(() => {
    if (files.length <= 1) return;
    if (shuffle) {
      const nextIdx = Math.floor(Math.random() * files.length);
      setCurrentIndex(nextIdx);
    } else {
      setCurrentIndex((i) => (i + 1) % files.length);
    }
    setPosition(0);
  }, [files.length, shuffle]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      setCurrentIndex((i) => (i - 1 + files.length) % files.length);
    }
    setPosition(0);
  }, [files.length]);

  const seek = useCallback((secs: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = secs;
    setPosition(secs);
  }, []);

  const setVolume = useCallback((val: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    setVolumeState(val);
    audio.volume = val / 100;
    if (val === 0) {
      audio.muted = true;
      setMuted(true);
    } else {
      audio.muted = false;
      setMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextMuted = !audio.muted;
    audio.muted = nextMuted;
    setMuted(nextMuted);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => !s);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  return {
    ready: files.length > 0,
    playing,
    buffering,
    live: false,
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
