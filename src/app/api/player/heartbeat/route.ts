import { jsonError, jsonOk, readJson } from "@/lib/api";
import { markPlayerOnline } from "@/lib/redis/presence";

export const runtime = "nodejs";

// El player llama a esto periódicamente para reportar que sigue vivo.
export async function POST(req: Request) {
  const body = await readJson<{ barId?: string }>(req);
  if (!body?.barId) return jsonError("Falta barId.", 400);
  await markPlayerOnline(body.barId);
  return jsonOk({ ok: true });
}
