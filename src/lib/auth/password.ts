import "server-only";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Hashing de contraseñas con scrypt (nativo de Node, sin dependencias binarias).
// Formato almacenado: scrypt$<saltHex>$<hashHex>
const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  const stErr = Buffer.from(hashHex, "hex");
  if (stErr.length !== derived.length) return false;
  return timingSafeEqual(stErr, derived);
}
