// ============================================================
// Tipos de dominio de RockBox
// ============================================================

export type Genre = "rock" | "rock_espanol" | "metal" | "pop";

export const ALLOWED_GENRES: { value: Genre; label: string }[] = [
  { value: "rock", label: "Rock" },
  { value: "rock_espanol", label: "Rock en Español" },
  { value: "metal", label: "Metal" },
  { value: "pop", label: "Pop" },
];

export const GENRE_LABELS: Record<Genre, string> = {
  rock: "Rock",
  rock_espanol: "Rock en Español",
  metal: "Metal",
  pop: "Pop",
};

export type RequestStatus = "queued" | "playing" | "played" | "cancelled";

// ------------------------------------------------------------
// Tablas de base de datos (Supabase)
// ------------------------------------------------------------

export interface Bar {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  bar_id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface BarTable {
  id: string;
  bar_id: string;
  number: number;
  qr_token: string;
  created_at: string;
}

export interface SongRequest {
  id: string;
  bar_id: string;
  device_id: string;
  video_id: string;
  title: string;
  artist: string | null;
  thumbnail: string | null;
  duration: number | null; // segundos
  status: RequestStatus;
  requested_at: string;
  played_at: string | null;
}

export interface Settings {
  id: string;
  bar_id: string;
  repeat_block_minutes: number; // regla de repetición (default 120 = 2h)
  request_interval_minutes: number; // intervalo entre solicitudes por dispositivo (default 15)
  max_requests_per_device: number; // canciones pendientes máx. por dispositivo (default 3)
  allowed_genres: Genre[];
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// DTOs / respuestas de API
// ------------------------------------------------------------

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  artist: string; // canal
  thumbnail: string;
  duration: number | null; // segundos
}

export interface QueueSnapshot {
  current: SongRequest | null;
  queue: SongRequest[];
}

export interface ApiError {
  error: string;
  retryAfterMinutes?: number;
}
