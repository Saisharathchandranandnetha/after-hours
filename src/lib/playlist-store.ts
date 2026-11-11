/**
 * Playlist manager store using Zustand.
 * Manages multiple playlists with localStorage persistence.
 */

import { create } from "zustand";
import {
  type Playlist,
  type PlaylistSource,
  generateId,
  loadPlaylists,
  savePlaylists,
  loadActivePlaylistId,
  saveActivePlaylistId,
  loadDefaultPlaylistId,
  saveDefaultPlaylistId,
  DEFAULT_PLAYLISTS,
} from "@/lib/playlist";

export type PlaylistStoreState = {
  playlists: Playlist[];
  activePlaylistId: string;
  defaultPlaylistId: string;
  hydrated: boolean;

  hydrate: () => void;
  addPlaylist: (name: string, source: PlaylistSource) => string;
  removePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  reorderPlaylists: (fromIndex: number, toIndex: number) => void;
  setActivePlaylist: (id: string) => void;
  setDefaultPlaylist: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getActivePlaylist: () => Playlist | undefined;
};

export const usePlaylistStore = create<PlaylistStoreState>((set, get) => ({
  playlists: DEFAULT_PLAYLISTS,
  activePlaylistId: DEFAULT_PLAYLISTS[0].id,
  defaultPlaylistId: DEFAULT_PLAYLISTS[0].id,
  hydrated: false,

  hydrate: () => {
    const playlists = loadPlaylists();
    const activeId = loadActivePlaylistId();
    const defaultId = loadDefaultPlaylistId();

    const active =
      activeId && playlists.some((p: Playlist) => p.id === activeId)
        ? activeId
        : defaultId && playlists.some((p: Playlist) => p.id === defaultId)
          ? defaultId
          : playlists[0]?.id ?? DEFAULT_PLAYLISTS[0].id;

    set({
      playlists,
      activePlaylistId: active,
      defaultPlaylistId:
        defaultId && playlists.some((p: Playlist) => p.id === defaultId)
          ? defaultId
          : playlists[0]?.id ?? DEFAULT_PLAYLISTS[0].id,
      hydrated: true,
    });
  },

  addPlaylist: (name: string, source: PlaylistSource) => {
    const id = generateId();
    const newPlaylist: Playlist = {
      id,
      name,
      source,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state: PlaylistStoreState) => {
      const playlists = [...state.playlists, newPlaylist];
      savePlaylists(playlists);
      return { playlists };
    });

    return id;
  },

  removePlaylist: (id: string) => {
    set((state: PlaylistStoreState) => {
      const playlists = state.playlists.filter((p: Playlist) => p.id !== id);
      if (playlists.length === 0) {
        return state;
      }
      savePlaylists(playlists);

      let { activePlaylistId, defaultPlaylistId } = state;
      if (activePlaylistId === id) {
        activePlaylistId = playlists[0].id;
        saveActivePlaylistId(activePlaylistId);
      }
      if (defaultPlaylistId === id) {
        defaultPlaylistId = playlists[0].id;
        saveDefaultPlaylistId(defaultPlaylistId);
      }

      return { playlists, activePlaylistId, defaultPlaylistId };
    });
  },

  renamePlaylist: (id: string, name: string) => {
    set((state: PlaylistStoreState) => {
      const playlists = state.playlists.map((p: Playlist) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p
      );
      savePlaylists(playlists);
      return { playlists };
    });
  },

  updatePlaylist: (id: string, updates: Partial<Playlist>) => {
    set((state: PlaylistStoreState) => {
      const playlists = state.playlists.map((p: Playlist) =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      );
      savePlaylists(playlists);
      return { playlists };
    });
  },

  reorderPlaylists: (fromIndex: number, toIndex: number) => {
    set((state: PlaylistStoreState) => {
      const playlists = [...state.playlists];
      const [moved] = playlists.splice(fromIndex, 1);
      playlists.splice(toIndex, 0, moved);
      savePlaylists(playlists);
      return { playlists };
    });
  },

  setActivePlaylist: (id: string) => {
    saveActivePlaylistId(id);
    set({ activePlaylistId: id });
  },

  setDefaultPlaylist: (id: string) => {
    saveDefaultPlaylistId(id);
    set({ defaultPlaylistId: id });
  },

  toggleFavorite: (id: string) => {
    set((state: PlaylistStoreState) => {
      const playlists = state.playlists.map((p: Playlist) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: Date.now() } : p
      );
      savePlaylists(playlists);
      return { playlists };
    });
  },

  getActivePlaylist: () => {
    const state = get();
    return state.playlists.find((p: Playlist) => p.id === state.activePlaylistId);
  },
}));
