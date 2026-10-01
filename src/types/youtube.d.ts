// Tipos mínimos para la YouTube IFrame Player API.
// https://developers.google.com/youtube/iframe_api_reference

export {};

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }

  namespace YT {
    enum PlayerState {
      UNSTARTED = -1,
      ENDED = 0,
      PLAYING = 1,
      PAUSED = 2,
      BUFFERING = 3,
      CUED = 5,
    }

    interface PlayerEvent {
      target: Player;
      data: number;
    }

    interface PlayerOptions {
      videoId?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: PlayerEvent) => void;
        onStateChange?: (event: PlayerEvent) => void;
        onError?: (event: PlayerEvent) => void;
      };
    }

    class Player {
      constructor(el: HTMLElement | string, options: PlayerOptions);
      loadVideoById(videoId: string): void;
      cueVideoById(videoId: string): void;
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
      destroy(): void;
      getPlayerState(): number;
      getCurrentTime(): number;
      getDuration(): number;
    }
  }
}
