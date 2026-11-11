export type PlaybackState =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export type TrackInfo = {
  id?: string;
  title: string;
  artist: string;
  index: number;
  total: number;
  duration?: number;
  backgroundUrl?: string;
};

export type QueueItem = {
  id: string;
  title: string;
  artist: string;
  index: number;
  duration?: number;
  backgroundUrl?: string;
};

export type RepeatMode = "off" | "all" | "one";

export type UnifiedPlayer = {
  state: PlaybackState;
  ready: boolean;
  playing: boolean;
  buffering: boolean;
  live: boolean;
  track: TrackInfo | null;
  queue: QueueItem[];
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  error: string | null;
  hasCheckpoint?: boolean;

  // Actions
  toggle: () => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  playTrackAtIndex: (index: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

export type PlaybackCheckpoint = {
  playlistId: string;
  trackId?: string;
  trackTitle?: string;
  trackArtist?: string;
  playlistIndex: number;
  position: number;
  duration: number;
  lastPlaybackState: PlaybackState;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  updatedAt: number;
};
