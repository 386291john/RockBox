import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getOrCreateSettings } from "@/services/bar.service";
import type { SongRequest, YouTubeSearchResult } from "@/types";

// Lógica de negocio de solicitudes: creación con validaciones de
// límite por dispositivo (Fase 8 del enunciado) y regla de repetición (2h).

export type CreateRequestResult =
  | { ok: true; request: SongRequest }
  | { ok: false; code: "rate_limited" | "limit_reached" | "repeat_blocked" | "duplicate_in_queue" | "invalid"; message: string; retryAfterMinutes?: number };

/**
 * Crea una solicitud validando:
 *  1) Que el dispositivo no haya pedido otra canción hace menos de
 *     `request_interval_minutes`.
 *  2) Que la canción no se haya reproducido en las últimas
 *     `repeat_block_minutes` (regla de repetición configurable, default 2h).
 *  3) Que no esté ya en la cola / sonando.
 */
export async function createRequest(
  barId: string,
  deviceId: string,
  song: YouTubeSearchResult
): Promise<CreateRequestResult> {
  const db = getSupabaseAdmin();
  const settings = await getOrCreateSettings(barId);
  const now = Date.now();

  // --- Validación 1: límite de solicitudes por dispositivo ---
  const intervalMs = settings.request_interval_minutes * 60 * 1000;
  if (intervalMs > 0) {
    const since = new Date(now - intervalMs).toISOString();
    const { data: recent } = await db
      .from("requests")
      .select("requested_at")
      .eq("bar_id", barId)
      .eq("device_id", deviceId)
      .neq("status", "cancelled")
      .gte("requested_at", since)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const elapsedMs = now - new Date(recent.requested_at as string).getTime();
      const remaining = Math.max(
        1,
        Math.ceil((intervalMs - elapsedMs) / 60000)
      );
      return {
        ok: false,
        code: "rate_limited",
        message: `Ya realizaste una solicitud recientemente. Podrás solicitar otra canción en ${remaining} min.`,
        retryAfterMinutes: remaining,
      };
    }
  }

  // --- Validación 1b: máximo de canciones pendientes por dispositivo ---
  const maxPending = settings.max_requests_per_device ?? 3;
  if (maxPending > 0) {
    const { count } = await db
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("bar_id", barId)
      .eq("device_id", deviceId)
      .in("status", ["queued", "playing"]);

    if ((count ?? 0) >= maxPending) {
      return {
        ok: false,
        code: "limit_reached",
        message: `Alcanzaste el máximo de ${maxPending} ${maxPending === 1 ? "canción" : "canciones"} en cola. Espera a que suene alguna para pedir más.`,
      };
    }
  }

  // --- Validación 2: regla de repetición (canción ya reproducida) ---
  const repeatMs = settings.repeat_block_minutes * 60 * 1000;
  if (repeatMs > 0) {
    const since = new Date(now - repeatMs).toISOString();
    const { data: played } = await db
      .from("requests")
      .select("played_at")
      .eq("bar_id", barId)
      .eq("video_id", song.videoId)
      .eq("status", "played")
      .gte("played_at", since)
      .order("played_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (played && played.played_at) {
      const elapsedMs = now - new Date(played.played_at as string).getTime();
      const remaining = Math.max(
        1,
        Math.ceil((repeatMs - elapsedMs) / 60000)
      );
      return {
        ok: false,
        code: "repeat_blocked",
        message: `Esta canción sonó hace poco. Podrás volver a pedirla en ${remaining} min.`,
        retryAfterMinutes: remaining,
      };
    }
  }

  // --- Validación 3: no duplicar en cola / sonando ---
  const { data: existing } = await db
    .from("requests")
    .select("id")
    .eq("bar_id", barId)
    .eq("video_id", song.videoId)
    .in("status", ["queued", "playing"])
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      code: "duplicate_in_queue",
      message: "Esa canción ya está en la cola.",
    };
  }

  // --- Insertar solicitud ---
  const { data: created, error } = await db
    .from("requests")
    .insert({
      bar_id: barId,
      device_id: deviceId,
      video_id: song.videoId,
      title: song.title,
      artist: song.artist ?? null,
      thumbnail: song.thumbnail ?? null,
      duration: song.duration ?? null,
      status: "queued",
    })
    .select()
    .single();

  if (error || !created) {
    return { ok: false, code: "invalid", message: "No se pudo agregar la canción." };
  }

  return { ok: true, request: created as SongRequest };
}
