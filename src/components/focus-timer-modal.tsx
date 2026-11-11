"use client";

import { useState } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Timer as TimerIcon,
  Bell,
  Volume2,
  Award,
  Settings,
} from "lucide-react";
import { useFocusTimer } from "@/hooks/use-focus-timer";
import { useSettings, type TimerMode } from "@/lib/settings";
import { formatDuration } from "@/lib/format";

type FocusTimerModalProps = {
  open: boolean;
  onClose: () => void;
};

export function FocusTimerModal({ open, onClose }: FocusTimerModalProps) {
  const { timer: settings, updateTimer } = useSettings();
  const timer = useFocusTimer();
  const [editingDuration, setEditingDuration] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);

  if (!open) return null;

  const MODES: { id: TimerMode; label: string }[] = [
    { id: "pomodoro", label: "Pomodoro" },
    { id: "short-break", label: "Short Break" },
    { id: "long-break", label: "Long Break" },
    { id: "custom", label: "Custom" },
    { id: "stopwatch", label: "Stopwatch" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl shadow-black/90 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Focus Timer"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <TimerIcon className="size-4 text-amber-400" />
            <h2 className="font-heading text-xl text-white">Focus Studio</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close focus timer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-white/5 bg-white/5 p-1 text-[11px]">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                timer.selectMode(m.id);
                setEditingDuration(false);
              }}
              className={`flex-1 rounded-lg px-2.5 py-1.5 font-mono whitespace-nowrap transition-all ${
                timer.mode === m.id
                  ? "bg-amber-400/20 font-medium text-amber-300 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Big Time Display with Progress Bar */}
        <div className="my-6 flex flex-col items-center justify-center py-4">
          <div className="font-mono text-5xl font-medium tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] tabular-nums sm:text-6xl">
            {formatDuration(timer.seconds)}
          </div>

          {/* Progress bar */}
          {timer.mode !== "stopwatch" && (
            <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 ease-linear"
                style={{ width: `${timer.progress * 100}%` }}
              />
            </div>
          )}

          {/* Status Label */}
          <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
            {timer.isRunning ? (
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                Focus in progress
              </span>
            ) : (
              <span>{timer.seconds === 0 ? "Session complete" : "Ready"}</span>
            )}
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={timer.reset}
            className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Reset Timer"
            aria-label="Reset Timer"
          >
            <RotateCcw className="size-4" />
          </button>

          <button
            onClick={timer.isRunning ? timer.pause : timer.start}
            className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 font-mono text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-300 active:scale-95"
            aria-label={timer.isRunning ? "Pause Timer" : "Start Timer"}
          >
            {timer.isRunning ? (
              <>
                <Pause className="size-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="size-4 fill-current" />
                <span>{timer.seconds === 0 ? "Restart" : "Start"}</span>
              </>
            )}
          </button>

          {timer.mode === "custom" && !timer.isRunning && (
            <button
              onClick={() => setEditingDuration(!editingDuration)}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              title="Edit Custom Duration"
              aria-label="Edit Custom Duration"
            >
              <Settings className="size-4" />
            </button>
          )}
        </div>

        {/* Custom duration edit drawer */}
        {editingDuration && timer.mode === "custom" && !timer.isRunning && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
            <label className="font-mono text-white/70">Set minutes: {customMinutes}m</label>
            <input
              type="range"
              min="1"
              max="120"
              value={customMinutes}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCustomMinutes(val);
                timer.setCustomTime(val * 60);
                updateTimer({ customDuration: val * 60 });
              }}
              className="mt-2 w-full accent-amber-400"
            />
          </div>
        )}

        {/* Footer info: Completed sessions & preferences */}
        <div className="mt-6 border-t border-white/10 pt-4 text-xs">
          <div className="flex items-center justify-between text-white/60">
            <div className="flex items-center gap-1.5">
              <Award className="size-3.5 text-amber-400" />
              <span>Completed Sessions:</span>
            </div>
            <span className="font-mono font-medium text-amber-300">
              {settings.completedSessions}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => updateTimer({ soundEnabled: !settings.soundEnabled })}
              className="flex items-center gap-1.5 text-white/50 transition-colors hover:text-white"
            >
              <Volume2 className={`size-3.5 ${settings.soundEnabled ? "text-amber-400" : ""}`} />
              <span>Chime: {settings.soundEnabled ? "On" : "Off"}</span>
            </button>

            <button
              type="button"
              onClick={() => updateTimer({ notificationEnabled: !settings.notificationEnabled })}
              className="flex items-center gap-1.5 text-white/50 transition-colors hover:text-white"
            >
              <Bell className={`size-3.5 ${settings.notificationEnabled ? "text-amber-400" : ""}`} />
              <span>Alert: {settings.notificationEnabled ? "On" : "Off"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
