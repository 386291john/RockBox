import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { searchSongs } from "@/services/search.service";
import { getOrCreateSettings } from "@/services/bar.service";
import { ALLOWED_GENRES, type Genre } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_GENRES = new Set<string>(ALLOWED_GENRES.map((g) => g.value));

// Búsqueda de canciones vía YouTube (con caché Redis). La API key vive en el
// servidor y nunca se expone al cliente.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const barId = params.get("barId");
  const genre = params.get("genre");
  const q = params.get("q");

  if (!barId) return jsonError("Falta barId.", 400);
  if (!q || !q.trim()) return jsonError("Falta el término de búsqueda.", 400);
  if (!genre || !VALID_GENRES.has(genre)) {
    return jsonError("Género inválido.", 400);
  }

  // El género debe estar habilitado para este bar.
  const settings = await getOrCreateSettings(barId);
  if (!settings.allowed_genres.includes(genre as Genre)) {
    return jsonError("Este género no está disponible en este bar.", 403);
  }

  try {
    const results = await searchSongs(genre as Genre, q);
    return jsonOk({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    // No filtramos detalles sensibles al cliente.
    console.error("[search] error:", message);
    return jsonError("No se pudo completar la búsqueda. Intenta de nuevo.", 502);
  }
}
