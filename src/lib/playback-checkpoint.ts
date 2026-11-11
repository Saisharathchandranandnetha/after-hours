import { PlaybackCheckpoint, PlaybackState } from "@/types/player";

export const CHECKPOINT_STORAGE_KEY = "after-hours-playback-checkpoint";

/**
 * Load saved playback checkpoint from localStorage.
 */
export function loadCheckpoint(): PlaybackCheckpoint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.playlistId !== "string" ||
      typeof parsed.position !== "number"
    ) {
      return null;
    }
    return parsed as PlaybackCheckpoint;
  } catch {
    return null;
  }
}

/**
 * Save playback checkpoint to localStorage immediately.
 * Does not save ended tracks as playing.
 */
export function saveCheckpoint(checkpoint: PlaybackCheckpoint): void {
  if (typeof window === "undefined") return;
  try {
    // Sanitize state: a finished track cannot be saved as playing
    const sanitizedState: PlaybackState =
      checkpoint.lastPlaybackState === "ended"
        ? "ended"
        : checkpoint.lastPlaybackState;

    const payload: PlaybackCheckpoint = {
      ...checkpoint,
      lastPlaybackState: sanitizedState,
      updatedAt: Date.now(),
    };

    localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save playback checkpoint:", err);
  }
}

/**
 * Clear saved playback checkpoint from localStorage.
 */
export function clearCheckpoint(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CHECKPOINT_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear playback checkpoint:", err);
  }
}

/**
 * Creates a throttled checkpoint updater that flushes immediately on demand
 * (e.g. pause, visibility change, beforeunload, track change) and throttles periodic saves.
 */
export function createCheckpointManager(throttleMs = 2500) {
  let lastSaveTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingCheckpoint: PlaybackCheckpoint | null = null;

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingCheckpoint) {
      saveCheckpoint(pendingCheckpoint);
      lastSaveTime = Date.now();
      pendingCheckpoint = null;
    }
  };

  const update = (checkpoint: PlaybackCheckpoint, immediate = false) => {
    pendingCheckpoint = checkpoint;
    const now = Date.now();

    if (immediate || now - lastSaveTime >= throttleMs) {
      flush();
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        flush();
      }, throttleMs - (now - lastSaveTime));
    }
  };

  return {
    update,
    flush,
  };
}
