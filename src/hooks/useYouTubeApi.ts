"use client";

import { useEffect, useState } from "react";

// Carga la YouTube IFrame Player API una única vez y avisa cuando está lista.
let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export function useYouTubeApi(): boolean {
  const [ready, setReady] = useState(
    typeof window !== "undefined" && !!window.YT?.Player
  );

  useEffect(() => {
    let mounted = true;
    loadApi().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return ready;
}
