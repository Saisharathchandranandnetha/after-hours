export type TrackInfo = {
  title: string;
  artist: string;
  index: number;
  total: number;
  duration?: number;
};

export type RepeatMode = "off" | "all" | "one";

export type UnifiedPlayer = {
  ready: boolean;
  playing: boolean;
  buffering: boolean;
  live: boolean;
  track: TrackInfo | null;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  error: string | null;

  // Actions
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};
