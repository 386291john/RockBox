import "server-only";
import { parseISO8601Duration } from "@/lib/utils";
import type { YouTubeSearchResult } from "@/types";

// Integración con YouTube Data API v3. La API key NUNCA se expone al cliente:
// este módulo se ejecuta sólo en el servidor.

const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";
const MAX_RESULTS = 12;

interface YtSearchItem {
  id: { videoId?: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails?: {
      medium?: { url: string };
      default?: { url: string };
      high?: { url: string };
    };
  };
}

interface YtVideoItem {
  id: string;
  contentDetails?: { duration?: string };
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY no está definido.");
  return key;
}

/**
 * Busca en YouTube canciones que combinan el término con el género.
 * Devuelve resultados enriquecidos con duración.
 */
export async function searchYouTube(
  term: string,
  genreHint: string
): Promise<YouTubeSearchResult[]> {
  const key = getApiKey();

  // Reforzamos la búsqueda hacia música del género pedido.
  // Añadir el género + "música" mejora la relevancia (aunque el filtro real
  // se hace luego en el servidor, porque la API no expone el género).
  const query = `${term} ${genreHint} música`.trim().replace(/\s+/g, " ");

  const searchParams = new URLSearchParams({
    key,
    part: "snippet",
    type: "video",
    videoCategoryId: "10", // categoría "Music"
    maxResults: String(MAX_RESULTS),
    q: query,
    safeSearch: "moderate",
  });

  const searchRes = await fetch(`${SEARCH_URL}?${searchParams.toString()}`, {
    // No cachear en fetch: la caché la gestiona Redis a nivel de servicio.
    cache: "no-store",
  });

  if (!searchRes.ok) {
    const body = await searchRes.text();
    throw new Error(`YouTube search falló (${searchRes.status}): ${body}`);
  }

  const searchData = (await searchRes.json()) as { items?: YtSearchItem[] };
  const items = (searchData.items || []).filter((it) => it.id.videoId);

  if (items.length === 0) return [];

  // Segunda llamada para obtener la duración de cada vídeo.
  const ids = items.map((it) => it.id.videoId).join(",");
  const videoParams = new URLSearchParams({
    key,
    part: "contentDetails",
    id: ids,
  });

  let durations: Record<string, number | null> = {};
  try {
    const videoRes = await fetch(`${VIDEOS_URL}?${videoParams.toString()}`, {
      cache: "no-store",
    });
    if (videoRes.ok) {
      const videoData = (await videoRes.json()) as { items?: YtVideoItem[] };
      durations = Object.fromEntries(
        (videoData.items || []).map((v) => [
          v.id,
          v.contentDetails?.duration
            ? parseISO8601Duration(v.contentDetails.duration)
            : null,
        ])
      );
    }
  } catch {
    // Si falla la llamada de duración, seguimos sin ella.
  }

  return items.map((it) => {
    const videoId = it.id.videoId as string;
    const thumb =
      it.snippet.thumbnails?.medium?.url ||
      it.snippet.thumbnails?.high?.url ||
      it.snippet.thumbnails?.default?.url ||
      `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    return {
      videoId,
      title: decodeHtml(it.snippet.title),
      artist: decodeHtml(it.snippet.channelTitle),
      thumbnail: thumb,
      duration: durations[videoId] ?? null,
    };
  });
}

// Decodifica entidades HTML comunes que devuelve la API de YouTube.
function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
