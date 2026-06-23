"use client";
import { useEffect, useRef } from "react";

const VIDEO_ID = "dsKGPK2QUkw";
const DEFAULT_RATE = 1.25;

// Minimal typings for the slice of the YouTube IFrame Player API we use.
interface YTPlayer {
  setPlaybackRate: (rate: number) => void;
  destroy: () => void;
}
interface YTPlayerEvent {
  target: YTPlayer;
  data?: number;
}
interface YTPlayerConfig {
  videoId: string;
  host?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (e: YTPlayerEvent) => void;
    onStateChange?: (e: YTPlayerEvent) => void;
  };
}
interface YTNamespace {
  Player: new (el: HTMLElement, config: YTPlayerConfig) => YTPlayer;
  PlayerState: { PLAYING: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Pitch video embedded via the IFrame Player API so it defaults to 1.25x.
 * (A plain <iframe> can't set playback speed — there's no URL param for it.)
 */
export default function PitchPlayer() {
  const targetRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;

    const createPlayer = () => {
      if (cancelled || !targetRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(targetRef.current, {
        videoId: VIDEO_ID,
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            try { e.target.setPlaybackRate(DEFAULT_RATE); } catch { /* rate unsupported */ }
          },
          onStateChange: (e) => {
            // some browsers reset the rate when playback actually begins — re-assert it
            if (e.data === window.YT?.PlayerState.PLAYING) {
              try { e.target.setPlaybackRate(DEFAULT_RATE); } catch { /* noop */ }
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      if (!document.getElementById("yt-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      // the API invokes this global once it has loaded; chain any existing handler
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
      try { playerRef.current?.destroy(); } catch { /* already gone */ }
    };
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <div ref={targetRef} className="h-full w-full" />
    </div>
  );
}
