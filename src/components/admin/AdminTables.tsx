"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Spinner } from "@/components/ui/Spinner";
import type { BarTable } from "@/types";

function barUrl(qrToken: string): string {
  // Usamos el origen desde el que el admin accede (window.location.origin):
  // así el QR SIEMPRE apunta a una dirección alcanzable (la misma IP/host por
  // la que entró el admin), sin depender de NEXT_PUBLIC_APP_URL ni de la IP
  // horneada en el build. NEXT_PUBLIC_APP_URL queda como respaldo.
  const base =
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  return `${base}/bar/${qrToken}`;
}

export function AdminTables() {
  const [tables, setTables] = useState<BarTable[] | null>(null);
  const [number, setNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tables", { cache: "no-store" });
    const data = await res.json();
    const list: BarTable[] = data.tables ?? [];
    setTables(list);
    // Genera los data-URL de QR para cada mesa.
    const entries = await Promise.all(
      list.map(async (t) => {
        const url = await QRCode.toDataURL(barUrl(t.qr_token), {
          margin: 1,
          width: 240,
          color: { dark: "#0a0a0f", light: "#ffffff" },
        });
        return [t.id, url] as const;
      })
    );
    setQrMap(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = parseInt(number, 10);
    if (!n || n <= 0) {
      setError("Ingresa un número de mesa válido.");
      return;
    }
    const res = await fetch("/api/admin/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: n }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "No se pudo crear la mesa.");
      return;
    }
    setNumber("");
    await load();
  }

  async function removeTable(id: string) {
    await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    await load();
  }

  async function regenerate(id: string) {
    await fetch(`/api/admin/tables/${id}`, { method: "PATCH" });
    await load();
  }

  function printQr(table: BarTable) {
    const img = qrMap[table.id];
    if (!img) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Mesa ${table.number} - RockBox</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:40px">
        <h1>Mesa ${table.number}</h1>
        <img src="${img}" width="300" height="300" />
        <p>Escanea para pedir tu canción 🎸</p>
      </body></html>`);
    w.document.close();
    w.print();
  }

  if (!tables) return <Spinner label="Cargando mesas…" />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black">Mesas y códigos QR</h1>

      <form onSubmit={addTable} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1">
          <label className="label" htmlFor="num">
            Número de mesa
          </label>
          <input
            id="num"
            type="number"
            min={1}
            className="input"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Ej. 5"
          />
        </div>
        <button type="submit" className="btn-primary">
          Agregar mesa
        </button>
      </form>
      {error && <p className="text-sm text-red-300">{error}</p>}

      {tables.length === 0 ? (
        <p className="text-sm text-white/40">
          No hay mesas todavía. Crea la primera arriba.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => (
            <div key={t.id} className="card flex flex-col items-center gap-3 p-4">
              <p className="text-lg font-bold">Mesa {t.number}</p>
              {qrMap[t.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrMap[t.id]}
                  alt={`QR mesa ${t.number}`}
                  width={180}
                  height={180}
                  className="rounded-lg bg-white p-2"
                />
              ) : (
                <div className="h-[180px] w-[180px] animate-pulse rounded-lg bg-base-600" />
              )}
              <p className="break-all text-center text-[10px] text-white/30">
                {barUrl(t.qr_token)}
              </p>
              <div className="flex w-full flex-wrap justify-center gap-2">
                <button onClick={() => printQr(t)} className="btn-ghost px-3 py-1.5 text-xs">
                  Imprimir
                </button>
                <button
                  onClick={() => regenerate(t.id)}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  Regenerar
                </button>
                <button
                  onClick={() => removeTable(t.id)}
                  className="btn-danger px-3 py-1.5 text-xs"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
