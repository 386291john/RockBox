import { requireAdmin, UnauthorizedError } from "@/lib/auth/require";
import { jsonError, jsonOk } from "@/lib/api";
import { getHistory } from "@/services/queue.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAdmin();
    const history = await getHistory(session.barId, 50);
    return jsonOk({ history });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    throw err;
  }
}
