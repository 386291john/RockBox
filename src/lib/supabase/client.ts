"use client";

import { createClient } from "@supabase/supabase-js";

// Cliente para el navegador (anon key). Usa el schema `rockbox`.
// Sólo tiene permisos de lectura (SELECT) sobre requests/bars gracias a RLS,
// lo que habilita la sincronización en tiempo real. Toda escritura pasa por
// las API routes del servidor.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: "rockbox" },
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 5 } },
});
