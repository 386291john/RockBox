import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getOrCreateSettings } from "@/services/bar.service";
import { ALLOWED_GENRES, type Genre, type Settings } from "@/types";

const VALID_GENRES = new Set<string>(ALLOWED_GENRES.map((g) => g.value));

export interface SettingsUpdate {
  repeat_block_minutes?: number;
  request_interval_minutes?: number;
  max_requests_per_device?: number;
  allowed_genres?: string[];
}

/** Actualiza settings validando rangos y géneros. */
export async function updateSettings(
  barId: string,
  update: SettingsUpdate
): Promise<Settings> {
  await getOrCreateSettings(barId); // garantiza que exista la fila
  const db = getSupabaseAdmin();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof update.repeat_block_minutes === "number") {
    patch.repeat_block_minutes = Math.max(0, Math.min(1440, Math.round(update.repeat_block_minutes)));
  }
  if (typeof update.request_interval_minutes === "number") {
    patch.request_interval_minutes = Math.max(0, Math.min(1440, Math.round(update.request_interval_minutes)));
  }
  if (typeof update.max_requests_per_device === "number") {
    // Entre 1 y 50 canciones pendientes por dispositivo.
    patch.max_requests_per_device = Math.max(1, Math.min(50, Math.round(update.max_requests_per_device)));
  }
  if (Array.isArray(update.allowed_genres)) {
    const genres = update.allowed_genres.filter((g) => VALID_GENRES.has(g)) as Genre[];
    if (genres.length > 0) patch.allowed_genres = genres;
  }

  const { data, error } = await db
    .from("settings")
    .update(patch)
    .eq("bar_id", barId)
    .select()
    .single();

  if (error) throw error;
  return data as Settings;
}
