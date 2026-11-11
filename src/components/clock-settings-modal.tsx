"use client";

import { X, RotateCcw, Maximize2, Clock as ClockIcon, Globe } from "lucide-react";
import { useSettings, type ClockFormat, type ClockAlignment } from "@/lib/settings";
import { TIMEZONE_OPTIONS } from "@/hooks/use-clock";

type ClockSettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ClockSettingsModal({ open, onClose }: ClockSettingsModalProps) {
  const { clock, updateClock, resetClock } = useSettings();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl shadow-black/80 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Clock Customization"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <ClockIcon className="size-4 text-amber-400" />
            <h2 className="font-heading text-xl text-white">Clock Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close clock settings"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 max-h-[70vh] space-y-5 overflow-y-auto pr-1 text-xs text-white/80">
          {/* Format (12h vs 24h) */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
              Time Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["12", "24"] as ClockFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => updateClock({ format: fmt })}
                  className={`rounded-lg border px-3 py-2 font-mono transition-all ${
                    clock.format === fmt
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-sm"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {fmt}-Hour Format {fmt === "12" ? "(03:14 AM)" : "(15:14)"}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Globe className="size-3.5 text-amber-400/80" />
              <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                Timezone (IANA)
              </label>
            </div>
            <select
              value={clock.timezone}
              onChange={(e) => updateClock({ timezone: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-none focus:border-amber-400/50"
            >
              {TIMEZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
              Display Elements
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateClock({ showSeconds: !clock.showSeconds })}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                  clock.showSeconds
                    ? "border-amber-400/40 bg-amber-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <span>Show Seconds</span>
                <span className="font-mono text-[10px]">{clock.showSeconds ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => updateClock({ blinkingColons: !clock.blinkingColons })}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                  clock.blinkingColons
                    ? "border-amber-400/40 bg-amber-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <span>Blinking Colon</span>
                <span className="font-mono text-[10px]">{clock.blinkingColons ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => updateClock({ showAmPm: !clock.showAmPm })}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                  clock.showAmPm
                    ? "border-amber-400/40 bg-amber-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <span>Show AM/PM</span>
                <span className="font-mono text-[10px]">{clock.showAmPm ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => updateClock({ showDate: !clock.showDate })}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                  clock.showDate
                    ? "border-amber-400/40 bg-amber-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <span>Show Date</span>
                <span className="font-mono text-[10px]">{clock.showDate ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => updateClock({ showTimezoneAbbr: !clock.showTimezoneAbbr })}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                  clock.showTimezoneAbbr
                    ? "border-amber-400/40 bg-amber-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <span>Timezone Abbr</span>
                <span className="font-mono text-[10px]">{clock.showTimezoneAbbr ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => updateClock({ visible: !clock.visible })}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                  clock.visible
                    ? "border-amber-400/40 bg-amber-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <span>Clock Visible</span>
                <span className="font-mono text-[10px]">{clock.visible ? "ON" : "OFF"}</span>
              </button>
            </div>
          </div>

          {/* Alignment */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
              Alignment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["left", "center", "right"] as ClockAlignment[]).map((align) => (
                <button
                  key={align}
                  onClick={() => updateClock({ alignment: align })}
                  className={`rounded-lg border px-2 py-1.5 font-mono text-[11px] uppercase transition-all ${
                    clock.alignment === align
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Size and Opacity Sliders */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[11px] text-white/70">
                <span>Font Size</span>
                <span>{clock.fontSize}px</span>
              </div>
              <input
                type="range"
                min="11"
                max="28"
                step="1"
                value={clock.fontSize}
                onChange={(e) => updateClock({ fontSize: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[11px] text-white/70">
                <span>Clock Opacity</span>
                <span>{clock.opacity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={clock.opacity}
                onChange={(e) => updateClock({ opacity: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          {/* Full Screen Mode Trigger */}
          <div className="pt-2">
            <button
              onClick={() => {
                updateClock({ fullScreenMode: true });
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 font-mono text-xs font-medium text-amber-300 transition-all hover:bg-amber-400/20"
            >
              <Maximize2 className="size-3.5" />
              Full Screen Clock Mode
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={resetClock}
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
