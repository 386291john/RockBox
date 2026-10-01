import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente de servidor con Service Role Key. Ignora RLS.
// NUNCA debe importarse desde componentes cliente.
let cached: ReturnType<typeof createRockboxAdmin> | null = null;

function createRockboxAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return createClient(url, serviceKey, {
    db: { schema: "rockbox" },
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Next.js 14 cachea los fetch del servidor por defecto. Forzamos
      // 'no-store' para que las consultas a Supabase siempre lean datos
      // frescos (la cola/estado cambian constantemente).
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

export function getSupabaseAdmin() {
  if (cached) return cached;

  cached = createRockboxAdmin();
  return cached;
}
