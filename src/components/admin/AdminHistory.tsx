"use client";

import { useEffect, useState } from "react";
import { SongThumb } from "@/components/ui/SongThumb";
import { Spinner } from "@/components/ui/Spinner";
import type { SongRequest } from "@/types";

export function AdminHistory() {
  const [history, setHistory] = useState<SongRequest[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/history", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setHistory(d.history ?? []))
      .catch(() => setHistory([]));
  }, []);

  if (!history) return <Spinner label="Cargando historial…" />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">Historial</h1>
      {history.length === 0 ? (
        <p className="text-sm text-white/40">Aún no se ha reproducido ninguna canción.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-base-800/60 p-2.5"
            >
              <SongThumb src={item.thumbnail} alt={item.title} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="truncate text-xs text-white/50">{item.artist}</p>
              </div>
              <span className="shrink-0 text-xs text-white/40">
                {item.played_at
                  ? new Date(item.played_at).toLocaleTimeString("es", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
