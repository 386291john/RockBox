import { SignJWT, jwtVerify } from "jose";

// Sesión de administrador firmada como JWT y guardada en cookie httpOnly.
// Compatible con el Edge runtime (jose), por lo que puede usarse en middleware.

export const SESSION_COOKIE = "rockbox_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

export interface AdminSession {
  userId: string;
  barId: string;
  email: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET no está definido o es demasiado corto.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string | undefined
): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.userId === "string" &&
      typeof payload.barId === "string" &&
      typeof payload.email === "string"
    ) {
      return {
        userId: payload.userId,
        barId: payload.barId,
        email: payload.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
