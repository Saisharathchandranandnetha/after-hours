import { describe, it, expect, beforeEach } from "vitest";
import {
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  createCheckpointManager,
  CHECKPOINT_STORAGE_KEY,
} from "@/lib/playback-checkpoint";
import type { PlaybackCheckpoint } from "@/types/player";

describe("Playback Checkpoint Manager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads a playback checkpoint successfully", () => {
    const checkpoint: PlaybackCheckpoint = {
      playlistId: "default-feel",
      trackId: "ckwRhLE9_LY",
      trackTitle: "feel intro",
      trackArtist: "Studio Artist",
      playlistIndex: 0,
      position: 42.5,
      duration: 180,
      lastPlaybackState: "paused",
      volume: 80,
      shuffle: true,
      repeat: "all",
      updatedAt: Date.now(),
    };

    saveCheckpoint(checkpoint);

    const loaded = loadCheckpoint();
    expect(loaded).toBeDefined();
    expect(loaded?.playlistId).toBe("default-feel");
    expect(loaded?.trackId).toBe("ckwRhLE9_LY");
    expect(loaded?.position).toBe(42.5);
    expect(loaded?.volume).toBe(80);
    expect(loaded?.shuffle).toBe(true);
    expect(loaded?.repeat).toBe("all");
  });

  it("does not save an ended track as playing", () => {
    const checkpoint: PlaybackCheckpoint = {
      playlistId: "default-feel",
      playlistIndex: 1,
      position: 210,
      duration: 210,
      lastPlaybackState: "ended",
      volume: 70,
      shuffle: false,
      repeat: "off",
      updatedAt: Date.now(),
    };

    saveCheckpoint(checkpoint);
    const loaded = loadCheckpoint();
    expect(loaded?.lastPlaybackState).toBe("ended");
  });

  it("clears saved checkpoint from storage", () => {
    const checkpoint: PlaybackCheckpoint = {
      playlistId: "default-feel",
      playlistIndex: 0,
      position: 10,
      duration: 100,
      lastPlaybackState: "playing",
      volume: 70,
      shuffle: false,
      repeat: "off",
      updatedAt: Date.now(),
    };

    saveCheckpoint(checkpoint);
    expect(localStorage.getItem(CHECKPOINT_STORAGE_KEY)).not.toBeNull();

    clearCheckpoint();
    expect(localStorage.getItem(CHECKPOINT_STORAGE_KEY)).toBeNull();
    expect(loadCheckpoint()).toBeNull();
  });

  it("createCheckpointManager flushes immediately when requested", () => {
    const manager = createCheckpointManager(5000);
    const checkpoint: PlaybackCheckpoint = {
      playlistId: "default-feel",
      playlistIndex: 0,
      position: 15,
      duration: 120,
      lastPlaybackState: "paused",
      volume: 70,
      shuffle: false,
      repeat: "off",
      updatedAt: Date.now(),
    };

    manager.update(checkpoint, true); // immediate
    const loaded = loadCheckpoint();
    expect(loaded?.position).toBe(15);
  });
});
