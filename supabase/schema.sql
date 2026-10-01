-- ============================================================
-- RockBox — Esquema de base de datos (Supabase PostgreSQL)
-- ============================================================
-- Todo vive en el schema `rockbox` para no colisionar con otras apps.
-- Ejecutar este archivo en el SQL Editor de Supabase o vía migración.
-- ============================================================

create schema if not exists rockbox;

-- Necesario para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- bars
-- ------------------------------------------------------------
create table if not exists rockbox.bars (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- admin_users
-- ------------------------------------------------------------
create table if not exists rockbox.admin_users (
  id            uuid primary key default gen_random_uuid(),
  bar_id        uuid not null references rockbox.bars(id) on delete cascade,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- tables (mesas)
-- ------------------------------------------------------------
create table if not exists rockbox.tables (
  id          uuid primary key default gen_random_uuid(),
  bar_id      uuid not null references rockbox.bars(id) on delete cascade,
  number      integer not null,
  qr_token    text not null unique,
  created_at  timestamptz not null default now(),
  unique (bar_id, number)
);

-- ------------------------------------------------------------
-- requests (solicitudes de canciones / cola)
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type rockbox.request_status as enum ('queued', 'playing', 'played', 'cancelled');
  end if;
end$$;

create table if not exists rockbox.requests (
  id            uuid primary key default gen_random_uuid(),
  bar_id        uuid not null references rockbox.bars(id) on delete cascade,
  device_id     text not null,
  video_id      text not null,
  title         text not null,
  artist        text,
  thumbnail     text,
  duration      integer,
  status        rockbox.request_status not null default 'queued',
  requested_at  timestamptz not null default now(),
  played_at     timestamptz
);

create index if not exists idx_requests_bar_status on rockbox.requests (bar_id, status);
create index if not exists idx_requests_bar_requested_at on rockbox.requests (bar_id, requested_at);
create index if not exists idx_requests_device on rockbox.requests (bar_id, device_id, requested_at);
create index if not exists idx_requests_video_played on rockbox.requests (bar_id, video_id, played_at);

-- ------------------------------------------------------------
-- settings
-- ------------------------------------------------------------
create table if not exists rockbox.settings (
  id                        uuid primary key default gen_random_uuid(),
  bar_id                    uuid not null unique references rockbox.bars(id) on delete cascade,
  repeat_block_minutes      integer not null default 120,   -- 2 horas
  request_interval_minutes  integer not null default 15,    -- 15 minutos
  max_requests_per_device   integer not null default 3,     -- canciones pendientes máx. por dispositivo
  allowed_genres            text[] not null default array['rock','rock_espanol','metal','pop'],
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
-- El servidor de RockBox accede SIEMPRE con la Service Role Key
-- (que ignora RLS). Habilitamos RLS y NO creamos políticas públicas,
-- de forma que la anon key no pueda leer ni escribir directamente,
-- salvo Realtime que opera sobre la publicación.
alter table rockbox.bars        enable row level security;
alter table rockbox.admin_users enable row level security;
alter table rockbox.tables      enable row level security;
alter table rockbox.requests    enable row level security;
alter table rockbox.settings    enable row level security;

-- Lectura pública SOLO de la cola (requests) para permitir sincronización
-- en tiempo real desde el navegador del cliente / player con la anon key.
-- La escritura sigue estando prohibida para anon (se valida en el servidor).
drop policy if exists "public read requests" on rockbox.requests;
create policy "public read requests"
  on rockbox.requests
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public read bars" on rockbox.bars;
create policy "public read bars"
  on rockbox.bars
  for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------
-- Realtime: publicar cambios de la tabla requests
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'rockbox'
      and tablename = 'requests'
  ) then
    alter publication supabase_realtime add table rockbox.requests;
  end if;
end$$;
