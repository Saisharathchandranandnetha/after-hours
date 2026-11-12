"use client";

import { useStudioPresence } from "@/hooks/use-studio-presence";
import { Users } from "lucide-react";

export function StudioPresence() {
  const { count } = useStudioPresence();

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3.5 py-1 text-[11px] font-mono text-white/80 shadow-md backdrop-blur-md select-none transition-colors hover:border-white/20"
      title={`Live studio sessions: ${count} active`}
      aria-label={`${count} ${count === 1 ? "person" : "people"} listening`}
    >
      {/* Steady, non-blinking icon */}
      <Users className="size-3.5 text-amber-400 shrink-0" />
      <span className="font-semibold text-white/95 tabular-nums">{count}</span>
      <span className="hidden sm:inline text-white/60">
        {count === 1 ? "person listening" : "people listening"}
      </span>
      <span className="sm:hidden text-white/60">listening</span>
    </div>
  );
}
