"use client";

import { cn } from "@/lib/utils";

const TEETH = [0, 60, 120, 180, 240, 300];
const MARQUEE_THRESHOLD = 28;

type ReelProps = {
  spinning: boolean;
  /** Spool fullness (0 to 1) */
  fill: number;
  reelColor?: string;
};

function Reel({ spinning, fill }: ReelProps) {
  return (
    <div className="relative aspect-square h-full">
      {/* Wound tape spool disc: scales dynamically from 0.52 to 1.0 */}
      <div
        className="absolute inset-0 rounded-full bg-[#24170f] shadow-[inset_0_0_8px_rgba(0,0,0,0.95)] ring-1 ring-white/10 transition-transform duration-700 ease-linear"
        style={{ transform: `scale(${0.52 + fill * 0.48})` }}
      />

      {/* Rotating central cog hub with drive teeth */}
      <div
        className="animate-reel absolute inset-[28%] rounded-full bg-gradient-to-b from-zinc-200 via-zinc-300 to-zinc-400 shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
        style={{ animationPlayState: spinning ? "running" : "paused" }}
      >
        {TEETH.map((degrees) => (
          <span
            key={degrees}
            className="absolute top-1/2 left-1/2 h-[26%] w-[12%] rounded-[1px] bg-zinc-700 shadow-sm"
            style={{
              transform: `translate(-50%, -50%) rotate(${degrees}deg) translateY(-115%)`,
            }}
          />
        ))}
        {/* Hub center cap */}
        <span className="absolute inset-[30%] rounded-full bg-zinc-800 shadow-[inset_0_1px_3px_rgba(0,0,0,0.85)]" />
      </div>
    </div>
  );
}

export type CassetteProps = {
  title: string;
  artist: string;
  playlistName?: string;
  spinning: boolean;
  progress: number;
  className?: string;
  variant?: "vintage" | "dark" | "gold" | "smoke";
};

export function Cassette({
  title,
  artist,
  playlistName = "Late Night",
  spinning,
  progress,
  className,
  variant = "vintage",
}: CassetteProps) {
  const scrolls = title.length > MARQUEE_THRESHOLD;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  // Styling variations
  const shellBg =
    variant === "dark"
      ? "bg-gradient-to-b from-zinc-800 via-zinc-900 to-black ring-white/10"
      : variant === "gold"
        ? "bg-gradient-to-b from-amber-900/80 via-zinc-900 to-zinc-950 ring-amber-500/30"
        : variant === "smoke"
          ? "bg-gradient-to-b from-zinc-800/80 via-zinc-900/70 to-black/90 backdrop-blur-md ring-white/20"
          : "bg-gradient-to-b from-zinc-700 via-zinc-850 to-zinc-950 ring-white/15";

  const labelBg =
    variant === "dark"
      ? "bg-zinc-800/90 text-zinc-100"
      : variant === "gold"
        ? "bg-gradient-to-b from-amber-100 to-amber-200 text-amber-950"
        : "bg-gradient-to-b from-amber-50 to-amber-100/90 text-zinc-900";

  return (
    <div
      className={cn(
        "relative aspect-[8/5] w-full rounded-2xl p-3 select-none",
        "shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1",
        shellBg,
        className
      )}
    >
      {/* 4 Corner Screws */}
      {[
        "top-2 left-2",
        "top-2 right-2",
        "bottom-2 left-2",
        "bottom-2 right-2",
      ].map((pos) => (
        <span
          key={pos}
          className={cn(
            "absolute size-1.5 rounded-full bg-zinc-900 shadow-[inset_0_0_1px_rgba(255,255,255,0.4)]",
            pos
          )}
        />
      ))}

      <div className="flex h-full flex-col gap-2.5 px-2">
        {/* Paper Mixtape Label */}
        <div
          className={cn(
            "relative flex-1 overflow-hidden rounded-lg px-3 py-2 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.15)]",
            labelBg
          )}
        >
          {/* Header row */}
          <div className="flex items-baseline justify-between font-mono text-[9px] tracking-[0.2em] uppercase opacity-60">
            <span className="truncate max-w-[65%]">{playlistName}</span>
            <span>Side A</span>
          </div>

          {/* Track title row */}
          <div className="mt-1 overflow-hidden">
            {scrolls ? (
              <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
                <span className="text-sm font-semibold tracking-tight">{title}</span>
                <span aria-hidden="true" className="text-sm font-semibold tracking-tight">
                  {title}
                </span>
              </div>
            ) : (
              <p className="truncate text-sm font-semibold tracking-tight">{title}</p>
            )}
            <p className="truncate text-xs opacity-75">{artist}</p>
          </div>

          {/* Authentic cassette label hand-drawn line */}
          <div className="absolute inset-x-3 bottom-1.5 h-px bg-amber-900/20" />
        </div>

        {/* Cassette Center Window with Spools */}
        <div className="relative flex-1 rounded-lg bg-zinc-950/95 shadow-[inset_0_2px_8px_rgba(0,0,0,0.95)] ring-1 ring-white/10">
          <div className="flex h-full items-center justify-center gap-[15%] py-[8%]">
            {/* Supply Reel (unwinds) */}
            <Reel spinning={spinning} fill={1 - clampedProgress} />
            {/* Take-up Reel (winds) */}
            <Reel spinning={spinning} fill={clampedProgress} />
          </div>

          {/* Exposed tape bridge between spools */}
          <div className="absolute inset-x-[15%] bottom-[16%] h-[1.5px] bg-[#3a261a]" />
        </div>
      </div>

      {/* Capstan and pinch roller guide notches at bottom edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-4">
        {["h-1.5 w-7", "h-2 w-4", "h-1.5 w-7"].map((size, index) => (
          <span key={index} className={cn("rounded-t-sm bg-zinc-950", size)} />
        ))}
      </div>
    </div>
  );
}
