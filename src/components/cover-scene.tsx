"use client";

import Image from "next/image";
import { useSettings } from "@/lib/settings";

export function CoverScene() {
  const { personalization } = useSettings();

  const backgroundSrc = personalization.backgroundUrl || "/cover.png";
  const brightness = personalization.backgroundBrightness / 100;
  const blur = personalization.backgroundBlur;
  const objectPosition = personalization.backgroundPosition || "center";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Background artwork */}
      <div
        className="relative h-full w-full transition-all duration-700 ease-out"
        style={{
          filter: `brightness(${brightness}) blur(${blur}px)`,
          transform: blur > 0 ? "scale(1.04)" : "scale(1.0)", // Prevents blur edge bleed
        }}
      >
        <Image
          src={backgroundSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover transition-all duration-500 ease-out"
          style={{ objectPosition }}
        />
      </div>

      {/* Atmospheric lighting overlays for cinematic late-night warmth & text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)]" />
      <div className="absolute inset-0 bg-amber-950/10 mix-blend-color-dodge pointer-events-none" />
    </div>
  );
}
