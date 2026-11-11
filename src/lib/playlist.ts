/**
 * Playlist data model and persistence.
 *
 * Playlists are stored in localStorage. Each playlist has a unique ID,
 * a name, source type (YouTube or local audio), and source data.
 */

export type PlaylistSource =
  | { type: "youtube"; playlistId: string; videoId?: string }
  | { type: "youtube-video"; videoId: string }
  | { type: "local"; files: LocalAudioFile[] };

export type LocalAudioFile = {
  id: string;
  name: string;
  artist: string;
  /** Object URL or IndexedDB key */
  src: string;
  duration: number;
};

export type Playlist = {
  id: string;
  name: string;
  source: PlaylistSource;
  coverUrl?: string;
  backgroundUrl?: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "after-hours-playlists";
const ACTIVE_KEY = "after-hours-active-playlist";
const DEFAULT_KEY = "after-hours-default-playlist";

/** Generate a unique playlist ID */
export function generateId(): string {
  return `pl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Extracts a YouTube playlist ID from various URL formats.
 * Supports:
 * - https://www.youtube.com/playlist?list=PLxxxxxxxx
 * - https://youtube.com/playlist?list=PLxxxxxxxx
 * - https://www.youtube.com/watch?v=xxx&list=PLxxxxxxxx
 * - https://music.youtube.com/playlist?list=PLxxxxxxxx
 * - Raw playlist ID (PLxxxxxxxx or similar)
 */
export function extractYouTubePlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try to parse as URL
  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get("list");
    if (listParam) return listParam;
  } catch {
    // Not a URL, check if it looks like a raw ID
  }

  // Check if it looks like a playlist ID (typically starts with PL, OL, UU, etc. or is at least 18 characters)
  if (
    /^(PL|UU|LL|FL|RD|OL)[A-Za-z0-9_-]{10,}$/.test(trimmed) ||
    /^[A-Za-z0-9_-]{18,}$/.test(trimmed)
  ) {
    return trimmed;
  }

  return null;
}

/**
 * Extracts a YouTube video ID from a URL.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    // youtube.com/watch?v=ID
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      // /embed/ID
      const embedMatch = url.pathname.match(/\/embed\/([A-Za-z0-9_-]+)/);
      if (embedMatch) return embedMatch[1];
    }
    // youtu.be/ID
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      if (id) return id;
    }
  } catch {
    // Not a URL
  }

  // Check if looks like a video ID (11 chars, alphanumeric + dash/underscore)
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/** Default playlists that come pre-configured */
export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: "skins-slowed-radio",
    name: "Skins (Slowed + Reverb) — Radio",
    source: {
      type: "youtube",
      playlistId: "RDET6Hn_iADIs",
      videoId: "ET6Hn_iADIs",
    },
    isFavorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "default-late-night",
    name: "Late Night Coding",
    source: {
      type: "youtube",
      playlistId: "PLjEaoINr3zgEq71FullHMiY0-b4STCaot",
    },
    isFavorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "default-deep-focus",
    name: "Deep Focus",
    source: {
      type: "youtube",
      playlistId: "PLjEaoINr3zgHqbmAY-f5OoMYYeARthC_G",
    },
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "default-research",
    name: "Research Sessions",
    source: {
      type: "youtube",
      playlistId: "PLjEaoINr3zgGBmmLWvR4PE5cY8T2pQdPn",
    },
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "default-lofi",
    name: "Lofi & Chill",
    source: {
      type: "youtube",
      playlistId: "PLofht4PTcKYnaH8w5olJCI-wUVxuoMHqM",
    },
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "default-ambient",
    name: "Ambient Instrumental",
    source: {
      type: "youtube",
      playlistId: "PLMXbAPr21di4ZjeijkAFbPPfOY7BkSJTY",
    },
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/** Load playlists from localStorage */
export function loadPlaylists(): Playlist[] {
  if (typeof window === "undefined") return DEFAULT_PLAYLISTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLAYLISTS;
    const parsed = JSON.parse(raw) as Playlist[];
    return parsed.length > 0 ? parsed : DEFAULT_PLAYLISTS;
  } catch {
    return DEFAULT_PLAYLISTS;
  }
}

/** Save playlists to localStorage */
export function savePlaylists(playlists: Playlist[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}

/** Get the active playlist ID */
export function loadActivePlaylistId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

/** Save the active playlist ID */
export function saveActivePlaylistId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_KEY, id);
}

/** Get the default playlist ID */
export function loadDefaultPlaylistId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEFAULT_KEY);
}

/** Save the default playlist ID */
export function saveDefaultPlaylistId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEFAULT_KEY, id);
}

/** Site configuration */
export const siteConfig = {
  name: "After Hours",
  title: "late night coding",
  subtitle: "somewhere between ideas and execution",
  description:
    "A personal music studio for late night coding sessions. Press play, keep shipping.",
} as const;
