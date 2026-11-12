"use client";

import { useEffect, useState, useRef, memo } from "react";
import Image from "next/image";
import { useSettings } from "@/lib/settings";

const CURATED_BACKGROUNDS = [
  "/cover.png",
  "/backgrounds/bg-1.png",
  "/backgrounds/bg-2.png",
  "/backgrounds/bg-3.png",
  "/backgrounds/bg-4.png",
  "/backgrounds/bg-5.png",
  "/backgrounds/bg-6.png",
  "/backgrounds/bg-7.png",
  "/backgrounds/bg-8.png",
  "/backgrounds/bg-9.png",
  "/backgrounds/bg-10.png",
  "/backgrounds/bg-11.png",
];

// Preload all curated backgrounds into browser memory on idle
function preloadBackgrounds() {
  if (typeof window === "undefined") return;
  const loadNext = (index = 0) => {
    if (index >= CURATED_BACKGROUNDS.length) return;
    const img = new window.Image();
    img.src = CURATED_BACKGROUNDS[index];
    img.onload = () => {
      setTimeout(() => loadNext(index + 1), 50);
    };
    img.onerror = () => loadNext(index + 1);
  };

  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() =>
      loadNext(0)
    );
  } else {
    setTimeout(() => loadNext(0), 100);
  }
}

export const CoverScene = memo(function CoverScene() {
  const { personalization } = useSettings();

  const backgroundSrc = personalization.backgroundUrl || "/cover.png";
  const brightness = personalization.backgroundBrightness / 100;
  const blur = personalization.backgroundBlur;
  const objectPosition = personalization.backgroundPosition || "center";

  // Dual-layer state for instantaneous zero-lag crossfading
  const [activeSrc, setActiveSrc] = useState(backgroundSrc);
  const [previousSrc, setPreviousSrc] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isFirstMount = useRef(true);

  // Preload backgrounds on initial mount
  useEffect(() => {
    preloadBackgrounds();
  }, []);

  // Instantaneous cross-fade when background URL changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (backgroundSrc !== activeSrc) {
      setPreviousSrc(activeSrc);
      setActiveSrc(backgroundSrc);
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousSrc(null);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [backgroundSrc, activeSrc]);

  // Optimize filter string: omit filters when at default values for pure 60fps GPU rendering
  const filterStyle =
    blur > 0
      ? `brightness(${brightness}) blur(${blur}px)`
      : brightness !== 1
        ? `brightness(${brightness})`
        : undefined;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Previous background layer (retained during cross-fade so zero black frames appear) */}
      {previousSrc && isTransitioning && (
        <div
          className="absolute inset-0 h-full w-full will-change-transform"
          style={{
            filter: filterStyle,
            transform: blur > 0 ? "scale(1.04) translateZ(0)" : "translateZ(0)",
          }}
        >
          <Image
            src={previousSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition }}
          />
        </div>
      )}

      {/* Active background layer */}
      <div
        className="absolute inset-0 h-full w-full transition-opacity duration-300 ease-out will-change-transform"
        style={{
          filter: filterStyle,
          transform: blur > 0 ? "scale(1.04) translateZ(0)" : "translateZ(0)",
        }}
      >
        <Image
          src={activeSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition }}
        />
      </div>

      {/* Atmospheric lighting overlays for cinematic late-night warmth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-amber-950/10 mix-blend-color-dodge pointer-events-none" />
    </div>
  );
});
