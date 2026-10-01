import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { getQueueSnapshot } from "@/services/queue.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Devuelve la canción actual y la cola de un bar.
export async function GET(req: NextRequest) {
  const barId = req.nextUrl.searchParams.get("barId");
  if (!barId) return jsonError("Falta barId.", 400);
  const snapshot = await getQueueSnapshot(barId);
  return jsonOk(snapshot);
}
