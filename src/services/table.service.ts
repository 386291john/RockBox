import "server-only";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { BarTable } from "@/types";

// Acceso a datos de mesas (tables).

function generateToken(): string {
  return randomBytes(9).toString("base64url"); // ~12 chars URL-safe
}

export async function listTables(barId: string): Promise<BarTable[]> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("tables")
    .select("*")
    .eq("bar_id", barId)
    .order("number", { ascending: true });
  return (data as BarTable[]) ?? [];
}

export async function createTable(
  barId: string,
  number: number
): Promise<BarTable> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("tables")
    .insert({ bar_id: barId, number, qr_token: generateToken() })
    .select()
    .single();
  if (error) throw error;
  return data as BarTable;
}

export async function deleteTable(barId: string, tableId: string): Promise<void> {
  const db = getSupabaseAdmin();
  await db.from("tables").delete().eq("bar_id", barId).eq("id", tableId);
}

/** Regenera el token QR de una mesa (por si se filtró un QR). */
export async function regenerateToken(
  barId: string,
  tableId: string
): Promise<BarTable | null> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("tables")
    .update({ qr_token: generateToken() })
    .eq("bar_id", barId)
    .eq("id", tableId)
    .select()
    .single();
  return (data as BarTable) ?? null;
}
