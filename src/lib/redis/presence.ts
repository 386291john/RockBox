import "server-only";
import { getRedis } from "./client";

// Presencia del Player mediante heartbeat en Redis.
// El player envía un ping cada ~15s; consideramos "online" si hubo ping en los
// últimos 40s. Si Redis no está disponible, devolvemos false (desconocido).

const TTL_SECONDS = 40;

function key(barId: string): string {
  return `player:online:${barId}`;
}

export async function markPlayerOnline(barId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key(barId), Date.now().toString(), "EX", TTL_SECONDS);
  } catch {
    // Ignora fallos de heartbeat.
  }
}

export async function isPlayerOnline(barId: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const val = await redis.get(key(barId));
    return val !== null;
  } catch {
    return false;
  }
}
