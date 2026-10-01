import type { Genre, YouTubeSearchResult } from "@/types";

// ============================================================
// Filtro de géneros (Opción B)
//
// La YouTube Data API NO expone el género musical de un vídeo, así que
// aplicamos heurísticas sobre el título y el nombre del canal:
//  1) Descartamos resultados con señales de géneros NO permitidos
//     (reggaetón, cumbia, salsa, etc.).
//  2) Damos prioridad a los que muestran señales del género pedido.
//
// No es infalible (no hay metadato de género), pero elimina los casos
// evidentes de "pedí rock y salió reggaetón".
// ============================================================

// Palabras que delatan géneros que NO se permiten en RockBox.
// Se comparan sin acentos y en minúsculas.
const FORBIDDEN_GENRE_TERMS = [
  "reggaeton",
  "reggaetón",
  "perreo",
  "cumbia",
  "salsa",
  "bachata",
  "merengue",
  "vallenato",
  "banda",
  "corrido",
  "corridos",
  "narcocorrido",
  "ranchera",
  "mariachi",
  "norteña",
  "nortena",
  "regional mexicano",
  "trap latino",
  "reggae",
  "dancehall",
  "electronica",
  "electronic dance",
  "edm",
  "house music",
  "techno",
  "dembow",
  "guaracha",
  "champeta",
  "tango",
  "flamenco",
  "k-pop",
  "kpop",
  "jazz",
  "blues clasico",
  "country",
  "hip hop",
  "hip-hop",
  "rap ",
  "drill",
  "afrobeat",
];

// Señales positivas por género permitido (suman relevancia, no obligan).
const GENRE_SIGNALS: Record<Genre, string[]> = {
  rock: ["rock", "banda de rock", "guitarra", "guitar", "band"],
  rock_espanol: ["rock", "rock en espanol", "rock nacional", "rock argentino"],
  metal: ["metal", "heavy metal", "thrash", "death metal", "metalcore", "headbang"],
  pop: ["pop", "pop rock", "synthpop", "pop hit"],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** ¿El texto contiene alguna señal de un género prohibido? */
function hasForbiddenSignal(text: string): boolean {
  const n = normalize(text);
  return FORBIDDEN_GENRE_TERMS.some((term) => n.includes(normalize(term)));
}

/**
 * Filtra y ordena los resultados de YouTube según el género permitido.
 * - Elimina los que contienen señales de géneros prohibidos.
 * - Ordena poniendo primero los que muestran señales del género pedido.
 */
export function filterByGenre(
  results: YouTubeSearchResult[],
  genre: Genre
): YouTubeSearchResult[] {
  const signals = GENRE_SIGNALS[genre].map(normalize);

  const allowed = results.filter((r) => {
    const haystack = `${r.title} ${r.artist}`;
    return !hasForbiddenSignal(haystack);
  });

  // Reordena: primero los que contienen alguna señal del género pedido.
  return allowed.sort((a, b) => {
    const aScore = matchesSignals(`${a.title} ${a.artist}`, signals) ? 1 : 0;
    const bScore = matchesSignals(`${b.title} ${b.artist}`, signals) ? 1 : 0;
    return bScore - aScore;
  });
}

function matchesSignals(text: string, signals: string[]): boolean {
  const n = normalize(text);
  return signals.some((s) => n.includes(s));
}
