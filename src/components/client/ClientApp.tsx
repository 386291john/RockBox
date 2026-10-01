"use client";

import { useState } from "react";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useQueue } from "@/hooks/useQueue";
import { ALLOWED_GENRES, type Genre, type YouTubeSearchResult } from "@/types";
import { SongThumb } from "@/components/ui/SongThumb";
import { Spinner } from "@/components/ui/Spinner";
import { formatDuration } from "@/lib/utils";

interface Props {
  barId: string;
  barName: string;
  tableNumber: number | null;
  allowedGenres: Genre[];
}

type Toast = { type: "ok" | "error"; message: string } | null;

export function ClientApp({ barId, barName, tableNumber, allowedGenres }: Props) {
  const deviceId = useDeviceId();
  const { current, queue, loading, refetch } = useQueue(barId);

  const genres = ALLOWED_GENRES.filter((g) => allowedGenres.includes(g.value));
  const [genre, setGenre] = useState<Genre>(genres[0]?.value ?? "rock");
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  function showToast(t: Toast) {
    setToast(t);
    if (t) setTimeout(() => setToast(null), 5000);
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(
        `/api/search?barId=${barId}&genre=${genre}&q=${encodeURIComponent(term.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error || "Error al buscar." });
        return;
      }
      setResults(data.results || []);
      if ((data.results || []).length === 0) {
        showToast({ type: "error", message: "Sin resultados. Prueba otra búsqueda." });
      }
    } catch {
      showToast({ type: "error", message: "Error de red al buscar." });
    } finally {
      setSearching(false);
    }
  }

  async function onRequest(song: YouTubeSearchResult) {
    if (!deviceId) return;
    setRequestingId(song.videoId);
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barId, deviceId, song }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error || "No se pudo solicitar." });
        return;
      }
      showToast({ type: "ok", message: "¡Canción agregada a la cola! 🎶" });
      refetch();
    } catch {
      showToast({ type: "error", message: "Error de red al solicitar." });
    } finally {
      setRequestingId(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 pb-24 pt-6">
      {/* Encabezado */}
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-neon text-xl">
          🎸
        </div>
        <div>
          <h1 className="text-lg font-black leading-tight">{barName}</h1>
          <p className="text-xs text-white/50">
            {tableNumber != null ? `Mesa ${tableNumber}` : "RockBox"} · Pide tu canción
          </p>
        </div>
      </header>

      {/* Canción actual */}
      <section className="card p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
          Sonando ahora
        </p>
        {loading ? (
          <Spinner />
        ) : current ? (
          <div className="flex items-center gap-3">
            <SongThumb src={current.thumbnail} alt={current.title} size={56} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{current.title}</p>
              <p className="truncate text-sm text-white/50">{current.artist}</p>
            </div>
            <span className="flex h-3 w-3 shrink-0">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-neon/60" />
              <span className="h-3 w-3 rounded-full bg-neon" />
            </span>
          </div>
        ) : (
          <p className="text-sm text-white/40">Nada sonando todavía. ¡Sé el primero!</p>
        )}
      </section>

      {/* Búsqueda */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              key={g.value}
              onClick={() => setGenre(g.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                genre === g.value
                  ? "bg-accent text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSearch} className="flex gap-2">
          <input
            className="input"
            placeholder="Busca artista o canción…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button type="submit" className="btn-primary shrink-0" disabled={searching}>
            {searching ? "…" : "Buscar"}
          </button>
        </form>
      </section>

      {/* Resultados */}
      {searching && <Spinner label="Buscando en YouTube…" />}
      {results.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Resultados
          </p>
          {results.map((song) => (
            <div key={song.videoId} className="card flex items-center gap-3 p-2.5">
              <SongThumb src={song.thumbnail} alt={song.title} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{song.title}</p>
                <p className="truncate text-xs text-white/50">
                  {song.artist}
                  {song.duration ? ` · ${formatDuration(song.duration)}` : ""}
                </p>
              </div>
              <button
                onClick={() => onRequest(song)}
                className="btn-primary shrink-0 px-3 py-2 text-xs"
                disabled={requestingId === song.videoId}
              >
                {requestingId === song.videoId ? "…" : "Pedir"}
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Cola */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          En cola ({queue.length})
        </p>
        {queue.length === 0 ? (
          <p className="text-sm text-white/40">La cola está vacía.</p>
        ) : (
          queue.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl bg-base-800/50 p-2.5">
              <span className="w-5 shrink-0 text-center text-sm font-bold text-white/30">
                {i + 1}
              </span>
              <SongThumb src={item.thumbnail} alt={item.title} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="truncate text-xs text-white/50">{item.artist}</p>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed inset-x-4 bottom-5 z-50 mx-auto max-w-md rounded-xl px-4 py-3 text-center text-sm font-medium shadow-lg ${
            toast.type === "ok"
              ? "bg-accent text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
