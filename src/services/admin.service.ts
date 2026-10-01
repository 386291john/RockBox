import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth/password";
import type { AdminUser, Bar } from "@/types";

// Lógica de negocio de autenticación de administradores.

export interface AdminWithBar {
  user: AdminUser;
  bar: Bar;
}

/** Busca un admin por email y verifica la contraseña. Devuelve null si falla. */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminWithBar | null> {
  const db = getSupabaseAdmin();

  const { data: user, error } = await db
    .from("admin_users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (error || !user) return null;

  const ok = await verifyPassword(password, (user as AdminUser).password_hash);
  if (!ok) return null;

  const { data: bar, error: barError } = await db
    .from("bars")
    .select("*")
    .eq("id", (user as AdminUser).bar_id)
    .maybeSingle();

  if (barError || !bar) return null;

  return { user: user as AdminUser, bar: bar as Bar };
}
