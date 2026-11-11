"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Star,
  Check,
  Music,
  Youtube,
  FileMusic,
  ArrowUp,
  ArrowDown,
  Play,
  Upload,
} from "lucide-react";
import { usePlaylistStore } from "@/lib/playlist-store";
import {
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
  type Playlist,
  type LocalAudioFile,
} from "@/lib/playlist";

type PlaylistModalProps = {
  open: boolean;
  onClose: () => void;
};

export function PlaylistModal({ open, onClose }: PlaylistModalProps) {
  const {
    playlists,
    activePlaylistId,
    defaultPlaylistId,
    setActivePlaylist,
    setDefaultPlaylist,
    toggleFavorite,
    addPlaylist,
    removePlaylist,
    renamePlaylist,
    reorderPlaylists,
  } = usePlaylistStore();

  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New playlist form state
  const [newTitle, setNewTitle] = useState("");
  const [importType, setImportType] = useState<"youtube-playlist" | "youtube-video" | "local">("youtube-playlist");
  const [sourceInput, setSourceInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) return null;

  const handleStartRename = (p: Playlist) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      renamePlaylist(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const title = newTitle.trim() || "My Playlist";

    if (importType === "youtube-playlist") {
      const id = extractYouTubePlaylistId(sourceInput);
      if (!id) {
        setFormError("Please enter a valid YouTube playlist URL or ID (e.g. PL... or RD...)");
        return;
      }
      const vid = extractYouTubeVideoId(sourceInput);
      const newId = addPlaylist(title, {
        type: "youtube",
        playlistId: id,
        videoId: vid || undefined,
      });
      setActivePlaylist(newId);
    } else if (importType === "youtube-video") {
      const id = extractYouTubeVideoId(sourceInput);
      if (!id) {
        setFormError("Please enter a valid YouTube video URL or 11-character video ID.");
        return;
      }
      const newId = addPlaylist(title, { type: "youtube-video", videoId: id });
      setActivePlaylist(newId);
    }

    setNewTitle("");
    setSourceInput("");
    setActiveTab("list");
  };

  // Local audio file drop / file select handler
  const handleLocalFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const audioList: LocalAudioFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      audioList.push({
        id: `local_${Date.now()}_${i}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local Audio",
        src: url,
        duration: 0,
      });
    }

    const title = newTitle.trim() || `Local Files (${audioList.length})`;
    const newId = addPlaylist(title, { type: "local", files: audioList });
    setActivePlaylist(newId);
    setNewTitle("");
    setActiveTab("list");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl shadow-black/90 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Playlist Manager"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Music className="size-4 text-amber-400" />
            <h2 className="font-heading text-xl text-white">Playlist Library</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close playlists"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="mt-4 flex gap-2 border-b border-white/10 pb-3 text-xs">
          <button
            onClick={() => setActiveTab("list")}
            className={`rounded-lg px-3 py-1.5 font-mono transition-all ${
              activeTab === "list"
                ? "bg-amber-400/20 font-medium text-amber-300"
                : "text-white/60 hover:text-white"
            }`}
          >
            My Playlists ({playlists.length})
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono transition-all ${
              activeTab === "add"
                ? "bg-amber-400/20 font-medium text-amber-300"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Plus className="size-3.5" />
            Add Playlist
          </button>
        </div>

        {/* Playlists List View */}
        {activeTab === "list" && (
          <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {playlists.map((p: Playlist, index: number) => {
              const isActive = p.id === activePlaylistId;
              const isDefault = p.id === defaultPlaylistId;

              return (
                <div
                  key={p.id}
                  className={`group relative flex items-center justify-between rounded-xl border p-3 transition-all ${
                    isActive
                      ? "border-amber-400/50 bg-amber-400/10 text-white shadow-sm"
                      : "border-white/5 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  {/* Left: Info & Reorder */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Reorder arrows */}
                    <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100">
                      <button
                        disabled={index === 0}
                        onClick={() => reorderPlaylists(index, index - 1)}
                        className="p-0.5 hover:text-amber-300 disabled:opacity-20"
                        title="Move Up"
                        aria-label="Move Up"
                      >
                        <ArrowUp className="size-3" />
                      </button>
                      <button
                        disabled={index === playlists.length - 1}
                        onClick={() => reorderPlaylists(index, index + 1)}
                        className="p-0.5 hover:text-amber-300 disabled:opacity-20"
                        title="Move Down"
                        aria-label="Move Down"
                      >
                        <ArrowDown className="size-3" />
                      </button>
                    </div>

                    {/* Source Icon */}
                    <div className="shrink-0 text-amber-400/80">
                      {p.source.type === "youtube" ? (
                        <Youtube className="size-4" />
                      ) : p.source.type === "youtube-video" ? (
                        <Play className="size-4" />
                      ) : (
                        <FileMusic className="size-4" />
                      )}
                    </div>

                    {/* Title & Type */}
                    <div className="min-w-0">
                      {editingId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveRename(p.id)}
                            className="rounded bg-black/60 px-2 py-0.5 font-sans text-xs text-white outline-none ring-1 ring-amber-400"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(p.id)}
                            className="text-amber-400 hover:text-amber-300"
                          >
                            <Check className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => setActivePlaylist(p.id)}
                            className="cursor-pointer truncate font-medium text-xs hover:text-amber-300"
                          >
                            {p.name}
                          </span>
                          {isDefault && (
                            <span className="rounded bg-white/10 px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider text-white/50">
                              Default
                            </span>
                          )}
                        </div>
                      )}

                      <div className="font-mono text-[10px] text-white/40">
                        {p.source.type === "youtube"
                          ? "YouTube Playlist"
                          : p.source.type === "youtube-video"
                            ? "YouTube Video"
                            : `${p.source.files.length} Local Tracks`}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Favorite Toggle */}
                    <button
                      onClick={() => toggleFavorite(p.id)}
                      className={`p-1.5 transition-colors ${
                        p.isFavorite ? "text-amber-400" : "text-white/30 hover:text-white/70"
                      }`}
                      title={p.isFavorite ? "Remove favorite" : "Mark as favorite"}
                    >
                      <Star className="size-3.5 fill-current" />
                    </button>

                    {/* Set Default */}
                    {!isDefault && (
                      <button
                        onClick={() => setDefaultPlaylist(p.id)}
                        className="rounded px-1.5 py-0.5 font-mono text-[10px] text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        title="Set as startup playlist"
                      >
                        Set default
                      </button>
                    )}

                    {/* Rename */}
                    <button
                      onClick={() => handleStartRename(p)}
                      className="p-1.5 text-white/40 transition-colors hover:text-white"
                      title="Rename playlist"
                    >
                      <Edit2 className="size-3.5" />
                    </button>

                    {/* Delete with confirmation */}
                    {deleteConfirmId === p.id ? (
                      <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-md">
                        <button
                          onClick={() => {
                            removePlaylist(p.id);
                            setDeleteConfirmId(null);
                          }}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-300 hover:bg-red-800"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-[10px] text-white/60 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="p-1.5 text-white/40 transition-colors hover:text-red-400"
                        title="Delete playlist"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}

                    {/* Play Switch Button */}
                    {!isActive ? (
                      <button
                        onClick={() => setActivePlaylist(p.id)}
                        className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-amber-400 hover:text-zinc-950"
                      >
                        <Play className="size-3 fill-current" />
                        Play
                      </button>
                    ) : (
                      <span className="font-mono text-[10px] text-amber-300">Active</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Playlist View */}
        {activeTab === "add" && (
          <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs text-white/80">
            {/* Import source options */}
            <div className="space-y-2">
              <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                Source Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setImportType("youtube-playlist")}
                  className={`rounded-lg border p-2 font-mono text-[11px] transition-all ${
                    importType === "youtube-playlist"
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  YouTube Playlist
                </button>
                <button
                  type="button"
                  onClick={() => setImportType("youtube-video")}
                  className={`rounded-lg border p-2 font-mono text-[11px] transition-all ${
                    importType === "youtube-video"
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  Single Video
                </button>
                <button
                  type="button"
                  onClick={() => setImportType("local")}
                  className={`rounded-lg border p-2 font-mono text-[11px] transition-all ${
                    importType === "local"
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  Local Audio
                </button>
              </div>
            </div>

            {/* Playlist Name */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                Playlist Name
              </label>
              <input
                type="text"
                placeholder="e.g. Midnight Synthwave"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-amber-400/50"
              />
            </div>

            {/* YouTube Input or Local Audio File Upload */}
            {importType !== "local" ? (
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                  {importType === "youtube-playlist" ? "YouTube Playlist URL or ID" : "YouTube Video URL or ID"}
                </label>
                <input
                  type="text"
                  placeholder={
                    importType === "youtube-playlist"
                      ? "https://www.youtube.com/playlist?list=PL..."
                      : "https://www.youtube.com/watch?v=..."
                  }
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-amber-400/50"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                  Select Audio Files (.mp3, .wav, .m4a, .ogg)
                </label>
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 p-6 cursor-pointer hover:border-amber-400/50 hover:bg-amber-400/5 transition-all">
                  <Upload className="size-6 text-amber-400" />
                  <span className="font-mono text-xs text-white/70">Click to choose authorized audio files</span>
                  <input
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={handleLocalFilesUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {formError && <p className="text-xs text-red-400">{formError}</p>}

            {importType !== "local" && (
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-2.5 font-mono text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
              >
                <Plus className="size-4" />
                Create & Stream Playlist
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
