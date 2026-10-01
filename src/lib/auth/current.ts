import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type AdminSession } from "./session";

// Lee y valida la sesión del admin desde la cookie (server-side).
export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
