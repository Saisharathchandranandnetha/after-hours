"use client";

import { useState } from "react";
import { useClock } from "@/hooks/use-clock";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { ClockSettingsModal } from "./clock-settings-modal";

type LocalClockProps = {
  className?: string;
  isFullScreenMode?: boolean;
  onExitFullScreen?: () => void;
};

export function LocalClock({ className, isFullScreenMode, onExitFullScreen }: LocalClockProps) {
  const { clock: settings } = useSettings();
  const time = useClock();
  const [modalOpen, setModalOpen] = useState(false);

  if (!settings.visible && !isFullScreenMode) {
    return null;
  }

  // Pre-hydration placeholder maintains exact layout height & prevent shifts
  if (!time) {
    return (
      <div className={cn("font-mono text-sm text-white/50 tabular-nums select-none", className)}>
        <span>--</span>
        <span className="opacity-40">:</span>
        <span>--</span>
        {settings.showSeconds && (
          <>
            <span className="opacity-40">:</span>
            <span>--</span>
          </>
        )}
      </div>
    );
  }

  const { hours, minutes, seconds, amPm, dateStr, tzAbbr, colonVisible } = time;

  return (
    <>
      <div
        className={cn(
          "group relative flex cursor-pointer flex-col select-none transition-opacity duration-300",
          settings.alignment === "center" && "items-center text-center",
          settings.alignment === "right" && "items-end text-right",
          settings.alignment === "left" && "items-start text-left",
          className
        )}
        style={{
          opacity: settings.opacity / 100,
        }}
        onClick={() => {
          if (isFullScreenMode && onExitFullScreen) {
            onExitFullScreen();
          } else {
            setModalOpen(true);
          }
        }}
        title="Click to customize clock settings"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
      >
        {/* Date line if enabled */}
        {settings.showDate && (
          <span className="font-mono text-[11px] font-medium tracking-wider text-white/70 uppercase">
            {dateStr}
          </span>
        )}

        {/* Main digital clock line */}
        <time
          suppressHydrationWarning
          className="font-mono font-medium tracking-tight text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)] tabular-nums"
          style={{
            fontSize: isFullScreenMode ? "clamp(3rem, 14vw, 9rem)" : `${settings.fontSize}px`,
            lineHeight: 1.15,
          }}
        >
          <span>{hours}</span>

          {/* Smooth blinking colon that becomes transparent without shifting layout */}
          <span
            className={cn(
              "inline-block transition-opacity duration-150",
              settings.blinkingColons && !colonVisible ? "opacity-0" : "opacity-90 text-amber-300/80"
            )}
            style={{ width: "0.55ch", textAlign: "center" }}
            aria-hidden="true"
          >
            :
          </span>

          <span>{minutes}</span>

          {settings.showSeconds && (
            <>
              <span
                className={cn(
                  "inline-block transition-opacity duration-150",
                  settings.blinkingColons && !colonVisible ? "opacity-0" : "opacity-90 text-amber-300/80"
                )}
                style={{ width: "0.55ch", textAlign: "center" }}
                aria-hidden="true"
              >
                :
              </span>
              <span>{seconds}</span>
            </>
          )}

          {settings.showAmPm && (
            <span className="ml-1.5 text-[0.7em] font-normal tracking-wide text-white/60">
              {amPm}
            </span>
          )}

          {settings.showTimezoneAbbr && tzAbbr && (
            <span className="ml-1 text-[0.65em] font-light tracking-widest text-white/40 uppercase">
              {tzAbbr}
            </span>
          )}
        </time>

        {/* Subtle hover hint */}
        <span className="absolute -bottom-4 left-0 hidden font-mono text-[9px] text-amber-300/60 group-hover:block">
          configure clock ⚙
        </span>
      </div>

      <ClockSettingsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
