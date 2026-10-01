import { jsonError, jsonOk, readJson } from "@/lib/api";
import { createRequest } from "@/services/request.service";
import { rateLimit } from "@/lib/redis/ratelimit";
import type { YouTubeSearchResult } from "@/types";

export const runtime = "nodejs";

interface RequestBody {
  barId?: string;
  deviceId?: string;
  song?: Partial<YouTubeSearchResult>;
}

function isValidSong(s: Partial<YouTubeSearchResult> | undefined): s is YouTubeSearchResult {
  return (
    !!s &&
    typeof s.videoId === "string" &&
    s.videoId.length > 0 &&
    typeof s.title === "string" &&
    s.title.length > 0
  );
}

// Crea una solicitud de canción. Todas las validaciones son server-side.
export async function POST(req: Request) {
  const body = await readJson<RequestBody>(req);

  if (!body || typeof body.barId !== "string" || typeof body.deviceId !== "string") {
    return jsonError("Datos de solicitud inválidos.", 400);
  }
  if (!isValidSong(body.song)) {
    return jsonError("La canción seleccionada no es válida.", 400);
  }

  // Rate limiting básico anti-abuso por dispositivo (además del intervalo de
  // negocio). Máx. 10 intentos por minuto para frenar spam/flooding.
  const limited = await rateLimit(`req:${body.barId}:${body.deviceId}`, 10, 60);
  if (limited.blocked) {
    return jsonError("Demasiadas solicitudes. Espera un momento.", 429);
  }

  const result = await createRequest(body.barId, body.deviceId, {
    videoId: body.song.videoId,
    title: body.song.title,
    artist: body.song.artist ?? "",
    thumbnail: body.song.thumbnail ?? "",
    duration: body.song.duration ?? null,
  });

  if (!result.ok) {
    const status =
      result.code === "rate_limited" ||
      result.code === "repeat_blocked" ||
      result.code === "limit_reached"
        ? 429
        : result.code === "duplicate_in_queue"
          ? 409
          : 400;
    return jsonError(result.message, status, {
      code: result.code,
      retryAfterMinutes: result.retryAfterMinutes,
    });
  }

  return jsonOk({ ok: true, request: result.request });
}
