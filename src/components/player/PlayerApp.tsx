"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useYouTubeApi } from "@/hooks/useYouTubeApi";
import { useQueue } from "@/hooks/useQueue";
import { SongThumb } from "@/components/ui/SongThumb";
import { usePlayerCommands } from "@/hooks/usePlayerCommands";

interface Props {
  barId: string;
  barName: string;
}

export function PlayerApp({ barId, barName }: Props) {
  const apiReady = useYouTubeApi();
  const { current, queue, refetch } = useQueue(barId);
  const command = usePlayerCommands(barId);

  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadedVideoRef = useRef<string | null>(null);
  const advancingRef = useRef(false);
  // Ref a la versión actual de `advance`, para que los callbacks del player
  // (que se registran UNA vez) siempre llamen a la función vigente.
  const advanceRef = useRef<() => void>(() => {});

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const next = queue[0] ?? null;

  // Avanza a la siguiente canción cuando termina la actual.
  const advance = useCallback(async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    try {
      await fetch("/api/player/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barId }),
      });
      await refetch();
    } finally {
      // Pequeño respiro para evitar dobles disparos del evento ENDED.
      setTimeout(() => {
        advancingRef.current = false;
      }, 800);
    }
  }, [barId, refetch]);

  // Mantiene advanceRef apuntando siempre a la última versión de advance.
  advanceRef.current = advance;

  // Al pulsar "Iniciar", aseguramos que haya algo sonando (promueve la cola).
  const start = useCallback(async () => {
    await fetch("/api/player/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barId }),
    });
    await refetch();
    setStarted(true);
  }, [barId, refetch]);

  // Crea el reproductor de YouTube cuando la API está lista y el usuario inició.
  // Importante: la IFrame API REEMPLAZA el nodo que se le pasa por un <iframe>.
  // Para que React no entre en conflicto con ese nodo, creamos un hijo dedicado
  // dentro del contenedor gestionado por React y se lo entregamos a la API.
  useEffect(() => {
    if (!apiReady || !started || !containerRef.current || playerRef.current) {
      return;
    }
    if (!window.YT || !window.YT.Player) return;

    // Nodo hijo que la API puede reemplazar libremente (React no lo controla).
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    containerRef.current.appendChild(mount);

    try {
      playerRef.current = new window.YT.Player(mount, {
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
          },
          onStateChange: (e) => {
            if (e.data === 0 /* ENDED */) {
              // Usa la versión vigente de advance (vía ref).
              advanceRef.current();
            } else if (e.data === 1 /* PLAYING */) {
              setPaused(false);
            } else if (e.data === 2 /* PAUSED */) {
              setPaused(true);
            }
          },
          onError: () => {
            // Vídeo no reproducible (bloqueado/eliminado): saltamos.
            advanceRef.current();
          },
        },
      });
    } catch (err) {
      console.error("[player] no se pudo crear el reproductor:", err);
    }

    // Nota: NO destruimos el player en cada render. Solo se crea una vez
    // (depende únicamente de apiReady/started), para no interrumpir la
    // reproducción cuando cambia la cola.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady, started]);

  // Carga el vídeo actual cuando cambia (o cuando el player queda listo).
  useEffect(() => {
    const player = playerRef.current;
    if (!playerReady || !player || !current) return;
    if (loadedVideoRef.current === current.video_id) return;
    if (typeof player.loadVideoById !== "function") return;
    loadedVideoRef.current = current.video_id;
    try {
      player.loadVideoById(current.video_id);
    } catch (err) {
      console.error("[player] loadVideoById falló:", err);
    }
  }, [current, playerReady]);

  // Heartbeat de presencia: informa al admin que el player está conectado.
  useEffect(() => {
    if (!started) return;
    const ping = () => {
      fetch("/api/player/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barId }),
      }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, 15000);
    return () => clearInterval(id);
  }, [started, barId]);

  // Comandos del admin (pausar/reanudar/saltar) vía realtime.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !command) return;
    try {
      if (command.type === "pause") player.pauseVideo();
      if (command.type === "resume") player.playVideo();
      if (command.type === "skip") advance();
    } catch (err) {
      console.error("[player] comando falló:", err);
    }
  }, [command, advance]);

  // Si no hay nada sonando pero sí hay canciones en cola, promueve la primera.
  // Cubre el caso de que lleguen solicitudes cuando la cola estaba vacía.
  useEffect(() => {
    if (!started || !playerReady) return;
    if (current || queue.length === 0) return;
    if (advancingRef.current) return;
    advancingRef.current = true;
    fetch("/api/player/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barId }),
    })
      .then(() => refetch())
      .finally(() => {
        setTimeout(() => {
          advancingRef.current = false;
        }, 800);
      });
  }, [current, queue.length, started, playerReady, barId, refetch]);

  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden bg-black">
      {/* Vídeo */}
      <div className="relative flex-1">
        {started ? (
          <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-neon text-5xl shadow-lg shadow-accent/40">
              🎸
            </div>
            <div>
              <h1 className="text-3xl font-black">{barName}</h1>
              <p className="mt-1 text-white/50">RockBox Player</p>
            </div>
            <button onClick={start} className="btn-primary px-8 py-4 text-lg">
              ▶ Iniciar reproducción
            </button>
            <p className="max-w-md text-sm text-white/40">
              Pulsa iniciar para habilitar el audio. El player reproducirá
              automáticamente las canciones de la cola.
            </p>
          </div>
        )}
      </div>

      {/* Barra inferior: actual + siguiente */}
      {started && (
        <div className="flex items-center gap-6 border-t border-white/10 bg-base-900/90 px-6 py-4 backdrop-blur">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="flex h-3 w-3 shrink-0">
              {!paused && (
                <span className="absolute h-3 w-3 animate-ping rounded-full bg-neon/60" />
              )}
              <span
                className={`h-3 w-3 rounded-full ${paused ? "bg-white/40" : "bg-neon"}`}
              />
            </span>
            {current ? (
              <>
                <SongThumb src={current.thumbnail} alt={current.title} size={56} />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-white/40">
                    {paused ? "En pausa" : "Sonando ahora"}
                  </p>
                  <p className="truncate text-lg font-bold">{current.title}</p>
                  <p className="truncate text-sm text-white/50">{current.artist}</p>
                </div>
              </>
            ) : (
              <p className="text-white/50">
                Cola vacía. Esperando solicitudes de los clientes…
              </p>
            )}
          </div>

          {next && (
            <div className="flex shrink-0 items-center gap-3 border-l border-white/10 pl-6">
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-white/40">
                  Siguiente
                </p>
                <p className="max-w-[220px] truncate text-sm font-semibold">
                  {next.title}
                </p>
                <p className="max-w-[220px] truncate text-xs text-white/50">
                  {next.artist}
                </p>
              </div>
              <SongThumb src={next.thumbnail} alt={next.title} size={44} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
