import type { Genre } from "@/types";

/** Convierte un texto a un slug seguro para URLs. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Formatea segundos a mm:ss. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Parsea la duración ISO8601 de YouTube (ej. "PT3M52S") a segundos. */
export function parseISO8601Duration(iso: string): number | null {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/** Términos que se añaden a la búsqueda de YouTube según el género seleccionado. */
export const GENRE_QUERY_HINTS: Record<Genre, string> = {
  rock: "rock",
  rock_espanol: "rock en español",
  metal: "metal",
  pop: "pop",
};

/** Mensaje amigable de cuánto falta para volver a solicitar / repetir. */
export function minutesToHuman(minutes: number): string {
  if (minutes <= 0) return "unos segundos";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}
