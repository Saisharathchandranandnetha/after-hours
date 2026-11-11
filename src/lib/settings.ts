/**
 * Global settings store using Zustand with localStorage persistence.
 * All user preferences are managed here.
 */

import { create } from "zustand";

// ─── Clock Settings ───

export type ClockFormat = "12" | "24";
export type ClockAlignment = "left" | "center" | "right";

export type ClockSettings = {
  format: ClockFormat;
  showSeconds: boolean;
  blinkingColons: boolean;
  blinkInterval: number;
  fontSize: number;
  opacity: number;
  timezone: string;
  showAmPm: boolean;
  showDate: boolean;
  alignment: ClockAlignment;
  showTimezoneAbbr: boolean;
  fullScreenMode: boolean;
  visible: boolean;
};

const DEFAULT_CLOCK_SETTINGS: ClockSettings = {
  format: "12",
  showSeconds: true,
  blinkingColons: true,
  blinkInterval: 1000,
  fontSize: 14,
  opacity: 80,
  timezone: "local",
  showAmPm: true,
  showDate: false,
  alignment: "left",
  showTimezoneAbbr: false,
  fullScreenMode: false,
  visible: true,
};

// ─── Timer Settings ───

export type TimerMode = "pomodoro" | "short-break" | "long-break" | "custom" | "stopwatch";

export type TimerSettings = {
  pomodoroDuration: number; // in seconds
  shortBreakDuration: number;
  longBreakDuration: number;
  customDuration: number;
  showInTitle: boolean;
  soundEnabled: boolean;
  notificationEnabled: boolean;
  completedSessions: number;
};

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  pomodoroDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  customDuration: 30 * 60,
  showInTitle: true,
  soundEnabled: true,
  notificationEnabled: true,
  completedSessions: 0,
};

// ─── Personalization Settings ───

export type PersonalizationSettings = {
  backgroundUrl: string;
  headingText: string;
  subtitleText: string;
  accentColor: string;
  backgroundBrightness: number;
  backgroundBlur: number;
  animationIntensity: number;
  reducedMotion: boolean;
  fullScreenMode: boolean;
  startupPlaylistId: string;
  backgroundPosition: string;
};

const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  backgroundUrl: "",
  headingText: "late night coding",
  subtitleText: "somewhere between ideas and execution",
  accentColor: "#d97706",
  backgroundBrightness: 100,
  backgroundBlur: 0,
  animationIntensity: 100,
  reducedMotion: false,
  fullScreenMode: false,
  startupPlaylistId: "default-late-night",
  backgroundPosition: "center",
};

// ─── Combined Store ───

export type SettingsState = {
  clock: ClockSettings;
  timer: TimerSettings;
  personalization: PersonalizationSettings;
  hydrated: boolean;

  updateClock: (partial: Partial<ClockSettings>) => void;
  updateTimer: (partial: Partial<TimerSettings>) => void;
  updatePersonalization: (partial: Partial<PersonalizationSettings>) => void;
  resetClock: () => void;
  resetTimer: () => void;
  resetPersonalization: () => void;
  resetAll: () => void;
  hydrate: () => void;
};

const SETTINGS_KEY = "after-hours-settings";

function loadFromStorage(): Partial<{
  clock: ClockSettings;
  timer: TimerSettings;
  personalization: PersonalizationSettings;
}> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveToStorage(state: {
  clock: ClockSettings;
  timer: TimerSettings;
  personalization: PersonalizationSettings;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      clock: state.clock,
      timer: state.timer,
      personalization: state.personalization,
    })
  );
}

export const useSettings = create<SettingsState>((set) => ({
  clock: DEFAULT_CLOCK_SETTINGS,
  timer: DEFAULT_TIMER_SETTINGS,
  personalization: DEFAULT_PERSONALIZATION,
  hydrated: false,

  updateClock: (partial: Partial<ClockSettings>) => {
    set((state: SettingsState) => {
      const clock = { ...state.clock, ...partial };
      const next = { ...state, clock };
      saveToStorage(next);
      return { clock };
    });
  },

  updateTimer: (partial: Partial<TimerSettings>) => {
    set((state: SettingsState) => {
      const timer = { ...state.timer, ...partial };
      const next = { ...state, timer };
      saveToStorage(next);
      return { timer };
    });
  },

  updatePersonalization: (partial: Partial<PersonalizationSettings>) => {
    set((state: SettingsState) => {
      const personalization = { ...state.personalization, ...partial };
      const next = { ...state, personalization };
      saveToStorage(next);
      return { personalization };
    });
  },

  resetClock: () => {
    set((state: SettingsState) => {
      const next = { ...state, clock: DEFAULT_CLOCK_SETTINGS };
      saveToStorage(next);
      return { clock: DEFAULT_CLOCK_SETTINGS };
    });
  },

  resetTimer: () => {
    set((state: SettingsState) => {
      const next = { ...state, timer: DEFAULT_TIMER_SETTINGS };
      saveToStorage(next);
      return { timer: DEFAULT_TIMER_SETTINGS };
    });
  },

  resetPersonalization: () => {
    set((state: SettingsState) => {
      const next = { ...state, personalization: DEFAULT_PERSONALIZATION };
      saveToStorage(next);
      return { personalization: DEFAULT_PERSONALIZATION };
    });
  },

  resetAll: () => {
    set(() => {
      const next = {
        clock: DEFAULT_CLOCK_SETTINGS,
        timer: DEFAULT_TIMER_SETTINGS,
        personalization: DEFAULT_PERSONALIZATION,
      };
      saveToStorage(next);
      return next;
    });
  },

  hydrate: () => {
    const stored = loadFromStorage();
    set({
      clock: { ...DEFAULT_CLOCK_SETTINGS, ...stored.clock },
      timer: { ...DEFAULT_TIMER_SETTINGS, ...stored.timer },
      personalization: { ...DEFAULT_PERSONALIZATION, ...stored.personalization },
      hydrated: true,
    });
  },
}));
