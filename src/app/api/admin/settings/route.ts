import { requireAdmin, UnauthorizedError } from "@/lib/auth/require";
import { jsonError, jsonOk, readJson } from "@/lib/api";
import { getOrCreateSettings } from "@/services/bar.service";
import { updateSettings, type SettingsUpdate } from "@/services/settings.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAdmin();
    const settings = await getOrCreateSettings(session.barId);
    return jsonOk({ settings });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    throw err;
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await readJson<SettingsUpdate>(req);
    if (!body) return jsonError("Datos inválidos.", 400);
    const settings = await updateSettings(session.barId, body);
    return jsonOk({ settings });
  } catch (err) {
    if (err instanceof UnauthorizedError) return jsonError(err.message, 401);
    throw err;
  }
}
