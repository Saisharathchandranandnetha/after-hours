import { describe, it, expect, beforeEach } from "vitest";
import {
  loadPlaylists,
  savePlaylists,
  DEFAULT_PLAYLISTS,
  type Playlist,
} from "@/lib/playlist";

describe("Feel and Phonk Playlists & Returning User Migration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("includes the 'feel' and 'phonk' playlists in DEFAULT_PLAYLISTS in correct order", () => {
    const feelIndex = DEFAULT_PLAYLISTS.findIndex((p) => p.name.toLowerCase() === "feel");
    const phonkIndex = DEFAULT_PLAYLISTS.findIndex((p) => p.name.toLowerCase() === "phonk");

    expect(feelIndex).toBeGreaterThanOrEqual(0);
    expect(phonkIndex).toBe(feelIndex + 1);

    const feel = DEFAULT_PLAYLISTS[feelIndex];
    expect(feel.id).toBe("default-feel");
    expect(feel.source.type).toBe("youtube");
    if (feel.source.type === "youtube") {
      expect(feel.source.playlistId).toBe("PLJQOYXoZjkTU");
      expect(feel.source.videoId).toBe("ckwRhLE9_LY");
    }

    const phonk = DEFAULT_PLAYLISTS[phonkIndex];
    expect(phonk.id).toBe("default-phonk");
    expect(phonk.source.type).toBe("youtube");
    if (phonk.source.type === "youtube") {
      expect(phonk.source.playlistId).toBe("PLAmE6xgHWAwA");
      expect(phonk.source.videoId).toBe("c84lqtARB0w");
    }
  });

  it("safely migrates existing user playlist data by inserting phonk directly after feel", () => {
    // User already had feel and some other playlist
    const existingUserData: Playlist[] = [
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
    ];

    savePlaylists(existingUserData);

    // Call loadPlaylists which runs migration
    const result = loadPlaylists();

    // feel should be at 0, phonk should be inserted right after feel at 1
    expect(result[0].id).toBe("default-feel");
    expect(result[1].id).toBe("default-phonk");
    expect(result[1].name).toBe("phonk");
    expect(result[2].id).toBe("custom-1");
  });

  it("does not duplicate 'phonk' when it already exists in user storage", () => {
    const existingWithPhonk: Playlist[] = [
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
        id: "default-phonk",
        name: "My Phonk Mix",
        source: {
          type: "youtube",
          playlistId: "PLAmE6xgHWAwA",
          videoId: "c84lqtARB0w",
        },
        isFavorite: true,
        createdAt: 1700000000001,
        updatedAt: 1700000000001,
      },
    ];

    savePlaylists(existingWithPhonk);
    const result = loadPlaylists();

    const phonkMatches = result.filter(
      (p) =>
        p.id === "default-phonk" ||
        (p.source.type === "youtube" && p.source.playlistId === "PLAmE6xgHWAwA")
    );
    expect(phonkMatches.length).toBe(1);
    expect(phonkMatches[0].name).toBe("My Phonk Mix");
  });
});
