import "server-only";
import { cacheGet, cacheSet } from "@/lib/redis/cache";
import { searchYouTube } from "@/lib/youtube/client";
import { filterByGenre } from "@/lib/youtube/genre-filter";
import { GENRE_QUERY_HINTS } from "@/lib/utils";
import type { Genre, YouTubeSearchResult } from "@/types";

// Lógica de negocio de búsqueda: valida género, consulta caché Redis y,
// en caso de miss, va a YouTube y guarda el resultado.

const TTL_SECONDS = 12 * 60 * 60; // 12 horas

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/** Construye la key de caché: search:genre:query */
export function buildCacheKey(genre: Genre, term: string): string {
  return `search:${genre}:${normalize(term)}`;
}

export async function searchSongs(
  genre: Genre,
  term: string
): Promise<YouTubeSearchResult[]> {
  const key = buildCacheKey(genre, term);

  // 1) ¿Existe en Redis?
  const cached = await cacheGet<YouTubeSearchResult[]>(key);
  if (cached) return cached;

  // 2) No existe -> YouTube
  const hint = GENRE_QUERY_HINTS[genre] ?? "";
  const raw = await searchYouTube(term, hint);

  // 3) Filtrar por género (descarta géneros no permitidos, prioriza el pedido)
  const results = filterByGenre(raw, genre);

  // 4) Guardar en Redis (TTL 12h) sólo si hay resultados YA FILTRADOS
  if (results.length > 0) {
    await cacheSet(key, results, TTL_SECONDS);
  }

  return results;
}
