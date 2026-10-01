import { jsonError, jsonOk, readJson } from "@/lib/api";
import { advanceQueue } from "@/services/queue.service";

export const runtime = "nodejs";

// El player llama a esto cuando la canción actual termina: cierra la actual
// (played) y pone a sonar la siguiente de la cola.
export async function POST(req: Request) {
  const body = await readJson<{ barId?: string }>(req);
  if (!body?.barId) return jsonError("Falta barId.", 400);

  const next = await advanceQueue(body.barId);
  return jsonOk({ current: next });
}
