import { describe, it, expect, beforeEach } from "vitest";
import {
  loadPlaylists,
  savePlaylists,
  DEFAULT_PLAYLISTS,
  type Playlist,
} from "@/lib/playlist";

describe("Feel Playlist & Returning User Migration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("includes the 'feel' playlist in DEFAULT_PLAYLISTS with correct ID and URL info", () => {
    const feel = DEFAULT_PLAYLISTS.find((p) => p.name.toLowerCase() === "feel");
    expect(feel).toBeDefined();
    expect(feel?.id).toBe("default-feel");
    expect(feel?.source.type).toBe("youtube");
    if (feel?.source.type === "youtube") {
      expect(feel.source.playlistId).toBe("PLJQOYXoZjkTU");
      expect(feel.source.videoId).toBe("ckwRhLE9_LY");
    }
  });

  it("safely migrates existing user playlist data by appending missing presets without overwriting order", () => {
    // User already had a custom playlist list with a custom order and custom playlist
    const existingUserData: Playlist[] = [
      {
        id: "custom-1",
        name: "My Lo-Fi Vibes",
        source: {
          type: "youtube",
          playlistId: "PLcustom123",
        },
        isFavorite: true,
        createdAt: 1600000000000,
        updatedAt: 1600000000000,
      },
      {
        id: "default-late-night",
        name: "Custom Renamed Late Night",
        source: {
          type: "youtube",
          playlistId: "PLjEaoINr3zgEq71FullHMiY0-b4STCaot",
        },
        isFavorite: false,
        createdAt: 1600000000001,
        updatedAt: 1600000000001,
      },
    ];

    savePlaylists(existingUserData);

    // Call loadPlaylists which runs migration
    const result = loadPlaylists();

    // Custom order preserved at the top
    expect(result[0].id).toBe("custom-1");
    expect(result[0].name).toBe("My Lo-Fi Vibes");
    expect(result[1].id).toBe("default-late-night");
    expect(result[1].name).toBe("Custom Renamed Late Night");

    // Missing 'feel' preset should be appended automatically
    const feel = result.find((p) => p.id === "default-feel");
    expect(feel).toBeDefined();
    expect(feel?.name).toBe("feel");

    // Total playlists must now include user's plus missing defaults
    expect(result.length).toBeGreaterThan(existingUserData.length);
  });

  it("does not duplicate 'feel' when it already exists in user storage", () => {
    const existingWithFeel: Playlist[] = [
      {
        id: "default-feel",
        name: "My Favorite Feel",
        source: {
          type: "youtube",
          playlistId: "PLJQOYXoZjkTU",
          videoId: "ckwRhLE9_LY",
        },
        isFavorite: true,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ];

    savePlaylists(existingWithFeel);
    const result = loadPlaylists();

    const feelMatches = result.filter(
      (p) =>
        p.id === "default-feel" ||
        (p.source.type === "youtube" && p.source.playlistId === "PLJQOYXoZjkTU")
    );
    expect(feelMatches.length).toBe(1);
    expect(feelMatches[0].name).toBe("My Favorite Feel");
  });
});
