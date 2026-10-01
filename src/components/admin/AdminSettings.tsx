"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { ALLOWED_GENRES, type Genre, type Settings } from "@/types";

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [repeat, setRepeat] = useState(120);
  const [interval, setIntervalMin] = useState(15);
  const [maxPerDevice, setMaxPerDevice] = useState(3);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const s: Settings = d.settings;
        setSettings(s);
        setRepeat(s.repeat_block_minutes);
        setIntervalMin(s.request_interval_minutes);
        setMaxPerDevice(s.max_requests_per_device ?? 3);
        setGenres(s.allowed_genres as Genre[]);
      })
      .catch(() => setMsg("No se pudieron cargar los ajustes."));
  }, []);

  function toggleGenre(g: Genre) {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (genres.length === 0) {
      setMsg("Debes permitir al menos un género.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repeat_block_minutes: repeat,
          request_interval_minutes: interval,
          max_requests_per_device: maxPerDevice,
          allowed_genres: genres,
        }),
      });
      if (!res.ok) {
        setMsg("No se pudieron guardar los ajustes.");
        return;
      }
      setMsg("Ajustes guardados ✓");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <Spinner label="Cargando ajustes…" />;

  return (
    <form onSubmit={save} className="flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-black">Ajustes</h1>

      <div className="card flex flex-col gap-5 p-5">
        <div>
          <label className="label" htmlFor="repeat">
            Tiempo de repetición (minutos)
          </label>
          <input
            id="repeat"
            type="number"
            min={0}
            max={1440}
            className="input"
            value={repeat}
            onChange={(e) => setRepeat(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-white/40">
            Una canción reproducida no podrá volver a pedirse durante este tiempo
            (por defecto 120 = 2 horas).
          </p>
        </div>

        <div>
          <label className="label" htmlFor="interval">
            Tiempo entre solicitudes por dispositivo (minutos)
          </label>
          <input
            id="interval"
            type="number"
            min={0}
            max={1440}
            className="input"
            value={interval}
            onChange={(e) => setIntervalMin(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-white/40">
            Cada dispositivo podrá solicitar una canción cada este número de
            minutos (por defecto 15).
          </p>
        </div>

        <div>
          <label className="label" htmlFor="maxPerDevice">
            Máximo de canciones por cliente en cola
          </label>
          <input
            id="maxPerDevice"
            type="number"
            min={1}
            max={50}
            className="input"
            value={maxPerDevice}
            onChange={(e) => setMaxPerDevice(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-white/40">
            Cuántas canciones puede tener un mismo dispositivo esperando en la
            cola a la vez. Al sonar alguna, se libera cupo para pedir más (por
            defecto 3).
          </p>
        </div>

        <div>
          <span className="label">Géneros permitidos</span>
          <div className="flex flex-wrap gap-2">
            {ALLOWED_GENRES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => toggleGenre(g.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  genres.includes(g.value)
                    ? "bg-accent text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando…" : "Guardar ajustes"}
        </button>
        {msg && <span className="text-sm text-white/60">{msg}</span>}
      </div>
    </form>
  );
}
