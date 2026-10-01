import { NextRequest } from "next/server";
import { requireAdmin, UnauthorizedError } from "@/lib/auth/require";
import { jsonError, jsonOk } from "@/lib/api";
import { deleteTable, regenerateToken } from "@/services/table.service";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    await deleteTable(session.barId, params.id);
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    throw err;
  }
}

// Regenera el token QR de la mesa.
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const table = await regenerateToken(session.barId, params.id);
    if (!table) return jsonError("Mesa no encontrada.", 404);
    return jsonOk({ table });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    throw err;
  }
}
