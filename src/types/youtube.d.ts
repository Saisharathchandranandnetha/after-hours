/**
 * Typings for the YouTube IFrame Player API
 */
declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface VideoData {
    video_id: string;
    title: string;
    author: string;
  }

  interface PlayerEvent {
    target: Player;
  }

  interface StateChangeEvent extends PlayerEvent {
    data: PlayerState;
  }

  interface ErrorEvent extends PlayerEvent {
    data: number;
  }

  interface PlayerOptions {
    host?: string;
    width?: number | string;
    height?: number | string;
    videoId?: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: StateChangeEvent) => void;
      onError?: (event: ErrorEvent) => void;
    };
  }

  class Player {
    constructor(element: HTMLElement | string, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    nextVideo(): void;
    previousVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    setVolume(volume: number): void;
    getVolume(): number;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setShuffle(shuffle: boolean): void;
    setLoop(loop: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getPlaylist(): string[] | null;
    getPlaylistIndex(): number;
    getVideoData(): VideoData;
    getPlayerState(): PlayerState;
    destroy(): void;
    getIframe(): HTMLIFrameElement;
    loadVideoById(videoId: string): void;
    cuePlaylist(options: {
      listType: string;
      list: string;
      index?: number;
      startSeconds?: number;
    }): void;
    loadPlaylist(options: {
      listType: string;
      list: string;
      index?: number;
      startSeconds?: number;
    }): void;
  }
}

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
