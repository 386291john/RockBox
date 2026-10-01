// ============================================================
// Seed de RockBox: crea un bar + admin + settings por defecto.
//
// Uso:
//   node scripts/seed.mjs "Nombre del Bar" admin@bar.com contraseña
//
// Requiere en .env.local:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const scryptAsync = promisify(scrypt);

// Carga simple de .env.local (sin dependencias externas).
function loadEnv() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const envPath = join(__dirname, "..", ".env.local");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Ignora si no existe; se validará abajo.
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  loadEnv();

  const [, , name, email, password] = process.argv;
  if (!name || !email || !password) {
    console.error(
      'Uso: node scripts/seed.mjs "Nombre del Bar" admin@bar.com contraseña'
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
    process.exit(1);
  }

  const db = createClient(url, serviceKey, {
    db: { schema: "rockbox" },
    auth: { persistSession: false },
  });

  // Slug único
  let slug = slugify(name);
  const { data: existing } = await db
    .from("bars")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  // 1) Bar
  const { data: bar, error: barErr } = await db
    .from("bars")
    .insert({ name, slug })
    .select()
    .single();
  if (barErr) throw barErr;
  console.log(`✓ Bar creado: ${bar.name} (id: ${bar.id})`);

  // 2) Admin
  const password_hash = await hashPassword(password);
  const { error: adminErr } = await db.from("admin_users").insert({
    bar_id: bar.id,
    email: email.toLowerCase().trim(),
    password_hash,
  });
  if (adminErr) throw adminErr;
  console.log(`✓ Admin creado: ${email}`);

  // 3) Settings por defecto
  const { error: setErr } = await db.from("settings").insert({
    bar_id: bar.id,
    repeat_block_minutes: 120,
    request_interval_minutes: 15,
    allowed_genres: ["rock", "rock_espanol", "metal", "pop"],
  });
  if (setErr) throw setErr;
  console.log("✓ Settings por defecto creados (repetición 120min, intervalo 15min)");

  console.log("\n¡Listo! Ya puedes iniciar sesión en /admin/login");
  console.log(`   Bar ID (para el player): ${bar.id}`);
}

main().catch((err) => {
  console.error("Error en el seed:", err.message || err);
  process.exit(1);
});
