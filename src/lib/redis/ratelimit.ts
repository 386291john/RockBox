import "server-only";
import { getRedis } from "./client";

// Rate limiting básico por ventana fija sobre Redis.
// Si Redis no está disponible, NO bloquea (degradación elegante): la
// validación de negocio en BD sigue protegiendo el límite real por dispositivo.

export interface RateLimitResult {
  blocked: boolean;
  remaining: number;
}

export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) return { blocked: false, remaining: max };

  const redisKey = `rl:${key}`;
  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSeconds);
    }
    return { blocked: count > max, remaining: Math.max(0, max - count) };
  } catch {
    return { blocked: false, remaining: max };
  }
}
