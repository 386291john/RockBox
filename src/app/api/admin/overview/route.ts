import { requireAdmin, UnauthorizedError } from "@/lib/auth/require";
import { jsonError, jsonOk } from "@/lib/api";
import { getQueueSnapshot, getTodayStats } from "@/services/queue.service";
import { getOrCreateSettings } from "@/services/bar.service";
import { isPlayerOnline } from "@/lib/redis/presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Datos agregados para el dashboard del admin.
export async function GET() {
  try {
    const session = await requireAdmin();
    const barId = session.barId;

    const [snapshot, stats, settings, playerOnline] = await Promise.all([
      getQueueSnapshot(barId),
      getTodayStats(barId),
      getOrCreateSettings(barId),
      isPlayerOnline(barId),
    ]);

    return jsonOk({
      barId,
      email: session.email,
      current: snapshot.current,
      queue: snapshot.queue,
      stats,
      settings,
      playerOnline,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    throw err;
  }
}
