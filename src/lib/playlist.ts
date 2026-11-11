/**
 * Playlist data model, migration, and persistence.
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
  backgroundUrl?: string;
};

export type Playlist = {
  id: string;
  name: string;
  source: PlaylistSource;
  coverUrl?: string;
  backgroundUrl?: string;
  trackBackgrounds?: Record<string, string>; // map of videoId/fileId -> background image URL
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
 * - Raw playlist ID (PLxxxxxxxx, RDxxxxxxxx, etc.)
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

  // Check if it looks like a playlist ID (typically starts with PL, OL, UU, RD, etc. or is at least 10 chars)
  if (
    /^(PL|UU|LL|FL|RD|OL)[A-Za-z0-9_-]{8,}$/.test(trimmed) ||
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
      const id = url.pathname.slice(1).split("?")[0];
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
    id: "default-feel",
    name: "feel",
    source: {
      type: "youtube",
      playlistId: "PLJQOYXoZjkTU",
      videoId: "ckwRhLE9_LY",
    },
    isFavorite: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: "skins-slowed-radio",
    name: "Skins (Slowed + Reverb) — Radio",
    source: {
      type: "youtube",
      playlistId: "RDET6Hn_iADIs",
      videoId: "ET6Hn_iADIs",
    },
    isFavorite: true,
    createdAt: 1700000000001,
    updatedAt: 1700000000001,
  },
  {
    id: "default-late-night",
    name: "Late Night Coding",
    source: {
      type: "youtube",
      playlistId: "PLjEaoINr3zgEq71FullHMiY0-b4STCaot",
    },
    isFavorite: true,
    createdAt: 1700000000002,
    updatedAt: 1700000000002,
  },
  {
    id: "default-deep-focus",
    name: "Deep Focus",
    source: {
      type: "youtube",
      playlistId: "PLjEaoINr3zgHqbmAY-f5OoMYYeARthC_G",
    },
    isFavorite: false,
    createdAt: 1700000000003,
    updatedAt: 1700000000003,
  },
  {
    id: "default-research",
    name: "Research Sessions",
    source: {
      type: "youtube",
      playlistId: "PLjEaoINr3zgGBmmLWvR4PE5cY8T2pQdPn",
    },
    isFavorite: false,
    createdAt: 1700000000004,
    updatedAt: 1700000000004,
  },
  {
    id: "default-lofi",
    name: "Lofi & Chill",
    source: {
      type: "youtube",
      playlistId: "PLofht4PTcKYnaH8w5olJCI-wUVxuoMHqM",
    },
    isFavorite: false,
    createdAt: 1700000000005,
    updatedAt: 1700000000005,
  },
  {
    id: "default-ambient",
    name: "Ambient Instrumental",
    source: {
      type: "youtube",
      playlistId: "PLMXbAPr21di4ZjeijkAFbPPfOY7BkSJTY",
    },
    isFavorite: false,
    createdAt: 1700000000006,
    updatedAt: 1700000000006,
  },
];

/**
 * Load playlists from localStorage with safe migration for returning users.
 * Automatically adds any missing default preset (such as "feel") without
 * overwriting existing user playlists, order, or preferences.
 */
export function loadPlaylists(): Playlist[] {
  if (typeof window === "undefined") return DEFAULT_PLAYLISTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLAYLISTS;
    const parsed = JSON.parse(raw) as Playlist[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PLAYLISTS;

    let migrated = false;
    const result = [...parsed];

    // Ensure all default presets exist without touching custom order/settings
    for (const def of DEFAULT_PLAYLISTS) {
      const exists = result.some(
        (p) =>
          p.id === def.id ||
          (p.source.type === "youtube" &&
            def.source.type === "youtube" &&
            p.source.playlistId === def.source.playlistId)
      );
      if (!exists) {
        result.push(def);
        migrated = true;
      }
    }

    if (migrated) {
      savePlaylists(result);
    }

    return result;
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
