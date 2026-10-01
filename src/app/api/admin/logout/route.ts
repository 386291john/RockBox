import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api";

export const runtime = "nodejs";

export async function POST() {
  cookies().delete(SESSION_COOKIE);
  return jsonOk({ ok: true });
}
