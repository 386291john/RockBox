import "server-only";
import Redis from "ioredis";

// Cliente Redis compartido (singleton). Se usa sólo en el servidor.
// Si Redis no está disponible, el código que lo usa debe degradar con gracia.
let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (client) return client;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      // Evita que un fallo de Redis tumbe la app; reintenta con backoff corto.
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    client.on("error", (err) => {
      // No lanzar: la caché es opcional. Sólo registramos.
      console.warn("[redis] error:", err.message);
    });
    return client;
  } catch (err) {
    console.warn("[redis] no se pudo inicializar:", err);
    return null;
  }
}
