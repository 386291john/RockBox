import { requireAdmin, UnauthorizedError } from "@/lib/auth/require";
import { jsonError, jsonOk, readJson } from "@/lib/api";
import { removeRequest } from "@/services/queue.service";

export const runtime = "nodejs";

// Elimina (cancela) una canción de la cola.
export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await readJson<{ requestId?: string }>(req);
    if (!body?.requestId) return jsonError("Falta requestId.", 400);
    await removeRequest(session.barId, body.requestId);
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    throw err;
  }
}
