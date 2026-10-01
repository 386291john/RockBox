import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Bar, BarTable, Settings } from "@/types";

// Acceso a datos de bares, mesas y settings.

export interface BarContext {
  bar: Bar;
  table: BarTable | null;
  settings: Settings;
}

/** Resuelve el bar (y la mesa) a partir del qr_token de una mesa. */
export async function getBarByQrToken(
  qrToken: string
): Promise<BarContext | null> {
  const db = getSupabaseAdmin();

  const { data: table, error } = await db
    .from("tables")
    .select("*")
    .eq("qr_token", qrToken)
    .maybeSingle();

  if (error || !table) return null;

  const barId = (table as BarTable).bar_id;
  const settings = await getOrCreateSettings(barId);
  const { data: bar } = await db
    .from("bars")
    .select("*")
    .eq("id", barId)
    .maybeSingle();

  if (!bar) return null;

  return { bar: bar as Bar, table: table as BarTable, settings };
}

/** Obtiene settings del bar; si no existen, crea los de por defecto. */
export async function getOrCreateSettings(barId: string): Promise<Settings> {
  const db = getSupabaseAdmin();

  const { data } = await db
    .from("settings")
    .select("*")
    .eq("bar_id", barId)
    .maybeSingle();

  if (data) return data as Settings;

  const { data: created, error } = await db
    .from("settings")
    .insert({
      bar_id: barId,
      repeat_block_minutes: 120,
      request_interval_minutes: 15,
      max_requests_per_device: 3,
      allowed_genres: ["rock", "rock_espanol", "metal", "pop"],
    })
    .select()
    .single();

  if (error) throw error;
  return created as Settings;
}

/** Obtiene un bar por id. */
export async function getBarById(barId: string): Promise<Bar | null> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("bars")
    .select("*")
    .eq("id", barId)
    .maybeSingle();
  return (data as Bar) ?? null;
}
