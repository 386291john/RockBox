import { jsonError, jsonOk, readJson } from "@/lib/api";
import { ensurePlaying } from "@/services/queue.service";

export const runtime = "nodejs";

// El player llama a esto al arrancar (o cuando no hay nada sonando pero sí
// canciones en cola): promueve la primera de la cola a "playing" si aplica.
export async function POST(req: Request) {
  const body = await readJson<{ barId?: string }>(req);
  if (!body?.barId) return jsonError("Falta barId.", 400);

  const current = await ensurePlaying(body.barId);
  return jsonOk({ current });
}
