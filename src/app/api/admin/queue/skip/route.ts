import { requireAdmin, UnauthorizedError } from "@/lib/auth/require";
import { jsonError, jsonOk } from "@/lib/api";
import { advanceQueue } from "@/services/queue.service";

export const runtime = "nodejs";

// Salta la canción actual: la marca como reproducida y promueve la siguiente.
// El cambio se propaga al player por Realtime (useQueue).
export async function POST() {
  try {
    const session = await requireAdmin();
    const next = await advanceQueue(session.barId);
    return jsonOk({ current: next });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    throw err;
  }
}
