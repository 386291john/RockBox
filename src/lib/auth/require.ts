import { getCurrentAdmin } from "./current";
import type { AdminSession } from "./session";

// Devuelve la sesión admin o lanza un objeto de error que las rutas convierten
// en 401. Se usa en las API routes de administración.
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getCurrentAdmin();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("No autenticado.");
    this.name = "UnauthorizedError";
  }
}
