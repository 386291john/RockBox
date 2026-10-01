import { getCurrentAdmin } from "@/lib/auth/current";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) return jsonError("No autenticado.", 401);
  return jsonOk({ session });
}
