import { describe, it, expect, beforeEach } from "vitest";
import {
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
} from "@/lib/playlist";
import { usePlaylistStore } from "@/lib/playlist-store";

describe("Playlist URL & ID Parser", () => {
  it("extracts playlist IDs from standard YouTube playlist URLs", () => {
    const url = "https://www.youtube.com/playlist?list=PLKF4F4n54F99H4YEa9bBmNC-xCXmNaW5B";
    expect(extractYouTubePlaylistId(url)).toBe("PLKF4F4n54F99H4YEa9bBmNC-xCXmNaW5B");
  });

  it("extracts playlist IDs from watch URLs with list param", () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890abcdef";
    expect(extractYouTubePlaylistId(url)).toBe("PL1234567890abcdef");
  });

  it("extracts playlist IDs from music.youtube.com URLs", () => {
    const url = "https://music.youtube.com/playlist?list=PLtestlist123";
    expect(extractYouTubePlaylistId(url)).toBe("PLtestlist123");
  });

  it("extracts radio / mix playlist IDs and video IDs from YouTube watch radio URLs", () => {
    const url = "https://www.youtube.com/watch?v=ET6Hn_iADIs&list=RDET6Hn_iADIs&start_radio=1";
    expect(extractYouTubePlaylistId(url)).toBe("RDET6Hn_iADIs");
    expect(extractYouTubeVideoId(url)).toBe("ET6Hn_iADIs");
  });

  it("accepts raw playlist IDs", () => {
    expect(extractYouTubePlaylistId("PLKF4F4n54F99H4YEa9bBmNC-xCXmNaW5B")).toBe(
      "PLKF4F4n54F99H4YEa9bBmNC-xCXmNaW5B"
    );
  });

  it("rejects invalid playlist URLs and empty strings", () => {
    expect(extractYouTubePlaylistId("")).toBeNull();
    expect(extractYouTubePlaylistId("   ")).toBeNull();
    expect(extractYouTubePlaylistId("not-a-valid-id")).toBeNull();
    expect(extractYouTubePlaylistId("https://example.com/audio")).toBeNull();
  });

  it("extracts YouTube video IDs correctly", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(extractYouTubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("invalid")).toBeNull();
  });
});

describe("Playlist Store", () => {
  beforeEach(() => {
    localStorage.clear();
    usePlaylistStore.getState().hydrate();
  });

  it("loads default presets on initial startup", () => {
    const playlists = usePlaylistStore.getState().playlists;
    expect(playlists.length).toBeGreaterThanOrEqual(7);
    expect(playlists.some((p) => p.name === "feel")).toBe(true);
    expect(playlists.some((p) => p.name === "Skins (Slowed + Reverb) — Radio")).toBe(true);
    expect(playlists.some((p) => p.name === "Late Night Coding")).toBe(true);
  });

  it("adds a new playlist and sets it as active", () => {
    const newId = usePlaylistStore.getState().addPlaylist("Synthwave Nights", {
      type: "youtube",
      playlistId: "PLtest123",
    });

    const state = usePlaylistStore.getState();
    const created = state.playlists.find((p) => p.id === newId);
    expect(created).toBeDefined();
    expect(created?.name).toBe("Synthwave Nights");

    state.setActivePlaylist(newId);
    expect(usePlaylistStore.getState().activePlaylistId).toBe(newId);
  });

  it("renames a playlist successfully", () => {
    const first = usePlaylistStore.getState().playlists[0];
    usePlaylistStore.getState().renamePlaylist(first.id, "Late Night Beats");

    const updated = usePlaylistStore
      .getState()
      .playlists.find((p) => p.id === first.id);
    expect(updated?.name).toBe("Late Night Beats");
  });

  it("toggles favorite status", () => {
    const first = usePlaylistStore.getState().playlists[0];
    const initialFav = first.isFavorite;

    usePlaylistStore.getState().toggleFavorite(first.id);
    const after = usePlaylistStore.getState().playlists.find((p) => p.id === first.id);
    expect(after?.isFavorite).toBe(!initialFav);
  });

  it("removes a playlist and switches active playlist if deleted", () => {
    const state = usePlaylistStore.getState();
    const newId = state.addPlaylist("Temp Playlist", {
      type: "youtube",
      playlistId: "PLtemp",
    });
    state.setActivePlaylist(newId);

    usePlaylistStore.getState().removePlaylist(newId);
    const after = usePlaylistStore.getState();
    expect(after.playlists.some((p) => p.id === newId)).toBe(false);
    expect(after.activePlaylistId).not.toBe(newId);
  });
});
