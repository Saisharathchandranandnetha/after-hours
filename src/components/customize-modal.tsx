"use client";

import { useState } from "react";
import {
  X,
  Palette,
  RotateCcw,
  Image as ImageIcon,
  Type,
  Sliders,
  Check,
  Move,
} from "lucide-react";
import { useSettings } from "@/lib/settings";
import { soundEffects } from "@/lib/sound-effects";

type CustomizeModalProps = {
  open: boolean;
  onClose: () => void;
};

// 11 curated atmospheric backgrounds
const CURATED_BACKGROUNDS = [
  { id: "/cover.png", name: "Studio Desk (Default)" },
  { id: "/backgrounds/bg-1.png", name: "Warm Amber Lamp" },
  { id: "/backgrounds/bg-2.png", name: "Midnight Terminal" },
  { id: "/backgrounds/bg-3.png", name: "Rainy Window Glow" },
  { id: "/backgrounds/bg-4.png", name: "Vintage Audio Corner" },
  { id: "/backgrounds/bg-5.png", name: "Quiet Bookshelf" },
  { id: "/backgrounds/bg-6.png", name: "Synthwave Night" },
  { id: "/backgrounds/bg-7.png", name: "Coffee & Code" },
  { id: "/backgrounds/bg-8.png", name: "Deep Focus Loft" },
  { id: "/backgrounds/bg-9.png", name: "Hacker Den" },
  { id: "/backgrounds/bg-10.png", name: "Solitude Vista" },
];

const ACCENT_COLORS = [
  { name: "Amber (Default)", value: "#f59e0b" },
  { name: "Warm Bronze", value: "#d97706" },
  { name: "Emerald Focus", value: "#10b981" },
  { name: "Indigo Night", value: "#6366f1" },
  { name: "Rose Sunset", value: "#f43f5e" },
  { name: "Cyan Terminal", value: "#06b6d4" },
];

export function CustomizeModal({ open, onClose }: CustomizeModalProps) {
  const { personalization, updatePersonalization, resetPersonalization, timer, updateTimer } =
    useSettings();

  const [customBgUrl, setCustomBgUrl] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl shadow-black/90 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Studio Personalization"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Palette className="size-4 text-amber-400" />
            <h2 className="font-heading text-xl text-white">Studio Personalization</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close settings"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="mt-4 max-h-[70vh] space-y-5 overflow-y-auto pr-1 text-xs text-white/80">
          {/* Background Scenery Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="size-3.5 text-amber-400" />
              <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                Atmospheric Artwork
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CURATED_BACKGROUNDS.map((bg) => {
                const isSelected =
                  personalization.backgroundUrl === bg.id ||
                  (!personalization.backgroundUrl && bg.id === "/cover.png");

                return (
                  <button
                    key={bg.id}
                    onClick={() => updatePersonalization({ backgroundUrl: bg.id })}
                    className={`flex items-center justify-between rounded-lg border p-2 text-left transition-all ${
                      isSelected
                        ? "border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-sm"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <span className="truncate">{bg.name}</span>
                    {isSelected && <Check className="size-3 shrink-0 text-amber-400" />}
                  </button>
                );
              })}
            </div>

            {/* Custom URL Input */}
            <div className="pt-1">
              <input
                type="text"
                placeholder="Or paste custom image URL..."
                value={customBgUrl}
                onChange={(e) => {
                  setCustomBgUrl(e.target.value);
                  if (e.target.value.trim()) {
                    updatePersonalization({ backgroundUrl: e.target.value.trim() });
                  }
                }}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-amber-400/50"
              />
            </div>
          </div>

          {/* Image Position / Framing (Move image) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Move className="size-3.5 text-amber-400" />
              <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                Move & Frame Background
              </label>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: "Top", pos: "center top" },
                { label: "Center", pos: "center center" },
                { label: "Bottom", pos: "center bottom" },
                { label: "Left", pos: "left center" },
                { label: "Right", pos: "right center" },
              ].map((p) => {
                const isSelected =
                  (personalization.backgroundPosition || "center") === p.pos ||
                  (personalization.backgroundPosition === "center" && p.label === "Center");

                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => updatePersonalization({ backgroundPosition: p.pos })}
                    className={`rounded-lg border px-1.5 py-1.5 font-mono text-[10px] text-center transition-all ${
                      isSelected
                        ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Vertical position fine-tune slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between font-mono text-[10px] text-white/50">
                <span>Vertical Pan (Up / Down)</span>
                <span>{personalization.backgroundPosition || "center"}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                defaultValue="50"
                onChange={(e) =>
                  updatePersonalization({ backgroundPosition: `center ${e.target.value}%` })
                }
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          {/* Accent Color Palette */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
              Accent Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ACCENT_COLORS.map((c) => {
                const isSelected = personalization.accentColor === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => updatePersonalization({ accentColor: c.value })}
                    className={`flex items-center gap-2 rounded-lg border p-1.5 transition-all ${
                      isSelected
                        ? "border-white/50 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className="size-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: c.value }}
                    />
                    <span className="truncate text-[10px]">{c.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Heading and Subtitle Customization */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Type className="size-3.5 text-amber-400" />
              <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                Editorial Heading & Subtitle
              </label>
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={personalization.headingText}
                onChange={(e) => updatePersonalization({ headingText: e.target.value })}
                placeholder="Primary heading"
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 font-sans text-xs text-white outline-none focus:border-amber-400/50"
              />
              <input
                type="text"
                value={personalization.subtitleText}
                onChange={(e) => updatePersonalization({ subtitleText: e.target.value })}
                placeholder="Secondary line / subtitle"
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 font-sans text-xs text-white outline-none focus:border-amber-400/50"
              />
            </div>
          </div>

          {/* Lighting & Visual Adjustments */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-1.5">
              <Sliders className="size-3.5 text-amber-400" />
              <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                Lighting & Atmosphere
              </label>
            </div>

            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[11px] text-white/60">
                <span>Background Brightness</span>
                <span>{personalization.backgroundBrightness}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="140"
                step="5"
                value={personalization.backgroundBrightness}
                onChange={(e) =>
                  updatePersonalization({ backgroundBrightness: Number(e.target.value) })
                }
                className="w-full accent-amber-400"
              />
            </div>

            {/* Blur */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[11px] text-white/60">
                <span>Background Soft Blur</span>
                <span>{personalization.backgroundBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="1"
                value={personalization.backgroundBlur}
                onChange={(e) => updatePersonalization({ backgroundBlur: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          {/* Sound & Animation Toggles */}
          <div className="space-y-2 pt-1">
            <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
              Sensory & Accessibility
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextVal = !timer.soundEnabled;
                  updateTimer({ soundEnabled: nextVal });
                  soundEffects.setEnabled(nextVal);
                }}
                className={`flex items-center justify-between rounded-lg border p-2 transition-all ${
                  timer.soundEnabled
                    ? "border-amber-400/50 bg-amber-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <span>Tactile Audio</span>
                <span className="font-mono text-[10px]">{timer.soundEnabled ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  updatePersonalization({ reducedMotion: !personalization.reducedMotion })
                }
                className={`flex items-center justify-between rounded-lg border p-2 transition-all ${
                  personalization.reducedMotion
                    ? "border-amber-400/50 bg-amber-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <span>Reduced Motion</span>
                <span className="font-mono text-[10px]">
                  {personalization.reducedMotion ? "ON" : "OFF"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={resetPersonalization}
            className="flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white"
          >
            <RotateCcw className="size-3" />
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/15 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
