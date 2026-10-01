"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueue } from "@/hooks/useQueue";
import { sendPlayerCommand } from "@/hooks/usePlayerCommands";
import { SongThumb } from "@/components/ui/SongThumb";
import { Spinner } from "@/components/ui/Spinner";
import type { Settings } from "@/types";

interface Overview {
  barId: string;
  stats: { requestsToday: number; playedToday: number };
  settings: Settings;
  playerOnline: boolean;
}

export function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/admin/overview", { cache: "no-store" });
    if (!res.ok) {
      setError("No se pudo cargar el panel.");
      return;
    }
    setOverview(await res.json());
  }, []);

  useEffect(() => {
    loadOverview();
    const id = setInterval(loadOverview, 15000); // refresca stats y presencia
    return () => clearInterval(id);
  }, [loadOverview]);

  if (error) return <p className="text-red-300">{error}</p>;
  if (!overview) return <Spinner label="Cargando panel…" />;

  return <DashboardInner overview={overview} onPlayerChange={loadOverview} />;
}

function DashboardInner({
  overview,
  onPlayerChange,
}: {
  overview: Overview;
  onPlayerChange: () => void;
}) {
  const { barId } = overview;
  const { current, queue, refetch } = useQueue(barId);
  const [busy, setBusy] = useState(false);

  async function skip() {
    setBusy(true);
    try {
      await fetch("/api/admin/queue/skip", { method: "POST" });
      await sendPlayerCommand(barId, "skip");
      await refetch();
      onPlayerChange();
    } finally {
      setBusy(false);
    }
  }

  async function pause() {
    await sendPlayerCommand(barId, "pause");
  }
  async function resume() {
    await sendPlayerCommand(barId, "resume");
  }

  async function remove(requestId: string) {
    await fetch("/api/admin/queue/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    await refetch();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Dashboard</h1>
        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            overview.playerOnline
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-white/5 text-white/40"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              overview.playerOnline ? "bg-emerald-400" : "bg-white/30"
            }`}
          />
          Player {overview.playerOnline ? "conectado" : "desconectado"}
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Solicitudes hoy" value={overview.stats.requestsToday} />
        <Stat label="Reproducidas hoy" value={overview.stats.playedToday} />
        <Stat label="En cola" value={queue.length} />
        <Stat
          label="Repetición"
          value={`${overview.settings.repeat_block_minutes}m`}
        />
      </div>

      {/* Canción actual + controles */}
      <section className="card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
          Sonando ahora
        </p>
        {current ? (
          <div className="flex flex-wrap items-center gap-4">
            <SongThumb src={current.thumbnail} alt={current.title} size={64} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold">{current.title}</p>
              <p className="truncate text-sm text-white/50">{current.artist}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={pause} className="btn-ghost">
                ⏸ Pausar
              </button>
              <button onClick={resume} className="btn-ghost">
                ▶ Reanudar
              </button>
              <button onClick={skip} className="btn-primary" disabled={busy}>
                ⏭ Saltar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/40">
            Nada sonando. Abre el Player e inicia la reproducción.
          </p>
        )}
      </section>

      {/* Cola */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Cola ({queue.length})
        </p>
        {queue.length === 0 ? (
          <p className="text-sm text-white/40">La cola está vacía.</p>
        ) : (
          queue.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-base-800/60 p-2.5"
            >
              <span className="w-5 text-center text-sm font-bold text-white/30">
                {i + 1}
              </span>
              <SongThumb src={item.thumbnail} alt={item.title} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="truncate text-xs text-white/50">{item.artist}</p>
              </div>
              <button
                onClick={() => remove(item.id)}
                className="btn-danger px-3 py-1.5 text-xs"
              >
                Quitar
              </button>
            </div>
          ))
        )}
      </section>

    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}
