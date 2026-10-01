import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { QueueSnapshot, SongRequest } from "@/types";

// Acceso a datos de la cola de reproducción.

/** Devuelve la canción en reproducción y la cola (FIFO por requested_at). */
export async function getQueueSnapshot(barId: string): Promise<QueueSnapshot> {
  const db = getSupabaseAdmin();

  const { data: playing } = await db
    .from("requests")
    .select("*")
    .eq("bar_id", barId)
    .eq("status", "playing")
    .order("played_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: queue } = await db
    .from("requests")
    .select("*")
    .eq("bar_id", barId)
    .eq("status", "queued")
    .order("requested_at", { ascending: true });

  return {
    current: (playing as SongRequest) ?? null,
    queue: (queue as SongRequest[]) ?? [],
  };
}

/** Marca la canción actual como reproducida y pone a sonar la siguiente. */
export async function advanceQueue(barId: string): Promise<SongRequest | null> {
  const db = getSupabaseAdmin();

  // 1) Cerrar la que está sonando (played).
  await db
    .from("requests")
    .update({ status: "played", played_at: new Date().toISOString() })
    .eq("bar_id", barId)
    .eq("status", "playing");

  // 2) Tomar la primera de la cola (FIFO) y ponerla a sonar.
  const { data: next } = await db
    .from("requests")
    .select("*")
    .eq("bar_id", barId)
    .eq("status", "queued")
    .order("requested_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!next) return null;

  const { data: updated } = await db
    .from("requests")
    .update({ status: "playing", played_at: new Date().toISOString() })
    .eq("id", (next as SongRequest).id)
    .select()
    .single();

  return (updated as SongRequest) ?? null;
}

/**
 * Devuelve la canción que debería estar sonando. Si no hay ninguna en
 * estado "playing", promueve la primera de la cola. Idempotente: es lo que
 * llama el player al iniciar y cuando termina una canción.
 */
export async function ensurePlaying(barId: string): Promise<SongRequest | null> {
  const db = getSupabaseAdmin();

  const { data: playing } = await db
    .from("requests")
    .select("*")
    .eq("bar_id", barId)
    .eq("status", "playing")
    .limit(1)
    .maybeSingle();

  if (playing) return playing as SongRequest;

  // No hay nada sonando: promover la primera de la cola.
  const { data: next } = await db
    .from("requests")
    .select("*")
    .eq("bar_id", barId)
    .eq("status", "queued")
    .order("requested_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!next) return null;

  const { data: updated } = await db
    .from("requests")
    .update({ status: "playing", played_at: new Date().toISOString() })
    .eq("id", (next as SongRequest).id)
    .select()
    .single();

  return (updated as SongRequest) ?? null;
}

/** Elimina (cancela) una solicitud de la cola. */
export async function removeRequest(barId: string, requestId: string): Promise<void> {
  const db = getSupabaseAdmin();
  await db
    .from("requests")
    .update({ status: "cancelled" })
    .eq("bar_id", barId)
    .eq("id", requestId)
    .eq("status", "queued");
}

/** Historial de canciones ya reproducidas (más recientes primero). */
export async function getHistory(
  barId: string,
  limit = 50
): Promise<SongRequest[]> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("requests")
    .select("*")
    .eq("bar_id", barId)
    .eq("status", "played")
    .order("played_at", { ascending: false })
    .limit(limit);
  return (data as SongRequest[]) ?? [];
}

/** Métricas simples del día para el dashboard. */
export async function getTodayStats(barId: string): Promise<{
  requestsToday: number;
  playedToday: number;
}> {
  const db = getSupabaseAdmin();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const iso = startOfDay.toISOString();

  const { count: requestsToday } = await db
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("bar_id", barId)
    .gte("requested_at", iso);

  const { count: playedToday } = await db
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("bar_id", barId)
    .eq("status", "played")
    .gte("played_at", iso);

  return {
    requestsToday: requestsToday ?? 0,
    playedToday: playedToday ?? 0,
  };
}
