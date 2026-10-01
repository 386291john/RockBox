import { requireAdmin, UnauthorizedError } from "@/lib/auth/require";
import { jsonError, jsonOk, readJson } from "@/lib/api";
import { createTable, listTables } from "@/services/table.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAdmin();
    const tables = await listTables(session.barId);
    return jsonOk({ tables });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await readJson<{ number?: number }>(req);
    if (!body || typeof body.number !== "number" || body.number <= 0) {
      return jsonError("Número de mesa inválido.", 400);
    }
    try {
      const table = await createTable(session.barId, Math.round(body.number));
      return jsonOk({ table });
    } catch {
      return jsonError("Ya existe una mesa con ese número.", 409);
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    throw err;
  }
}
