import { cookies } from "next/headers";
import { authenticateAdmin } from "@/services/admin.service";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth/session";
import { isEmail, isNonEmptyString, jsonError, jsonOk, readJson } from "@/lib/api";

export const runtime = "nodejs";

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(req: Request) {
  const body = await readJson<LoginBody>(req);
  if (!body || !isEmail(body.email) || !isNonEmptyString(body.password)) {
    return jsonError("Email o contraseña inválidos.", 400);
  }

  const result = await authenticateAdmin(body.email, body.password);
  if (!result) {
    return jsonError("Credenciales incorrectas.", 401);
  }

  const token = await createSessionToken({
    userId: result.user.id,
    barId: result.bar.id,
    email: result.user.email,
  });

  // La cookie se marca `secure` SOLO si la petición llega por HTTPS. Así el
  // login funciona también cuando se sirve por HTTP en red local (IP:puerto),
  // donde una cookie `secure` sería descartada por el navegador.
  const isHttps = new URL(req.url).protocol === "https:";

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return jsonOk({
    ok: true,
    bar: { id: result.bar.id, name: result.bar.name, slug: result.bar.slug },
  });
}
