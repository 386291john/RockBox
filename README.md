# 🎸 RockBox

Jukebox digital para bares. Los clientes escanean el código QR de su mesa,
buscan una canción en YouTube y la agregan a la cola. Un Player conectado al TV
del bar reproduce las canciones automáticamente, una tras otra.

> MVP simple, funcional y económico. Sin microservicios, sin sobrearquitectura.

---

## ✨ Funcionalidades

- **Cliente (móvil, sin cuenta):** escanea QR → busca → pide canción → ve la cola en vivo.
- **Player (TV del bar):** reproduce YouTube con IFrame API, detecta el fin y pasa a la siguiente.
- **Admin:** login, ver/gestionar cola, saltar, pausar/reanudar, historial, mesas + QR, ajustes.
- **Regla de repetición:** una canción reproducida no se puede volver a pedir durante X minutos (por defecto 2 h).
- **Límite por dispositivo:** una solicitud cada X minutos por dispositivo (por defecto 15).
- **Caché Redis** de las búsquedas de YouTube (TTL 12 h) y rate limiting básico.
- **Sincronización en tiempo real** con Supabase Realtime (cliente ↔ admin ↔ player).

---

## 🧱 Stack

Next.js 14 (App Router) · React · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Realtime) · Redis · YouTube Data API v3 · YouTube IFrame Player API · Docker.

```
Next.js
   ├── Supabase   (datos permanentes + realtime)
   └── Redis      (caché de búsquedas + rate limit + presencia del player)
```

---

## 📁 Estructura

```
src/
├── app/
│   ├── bar/[qrToken]/     # interfaz del cliente (móvil)
│   ├── player/[barId]/    # player para el TV
│   ├── admin/             # panel de administración
│   └── api/               # endpoints (search, request, queue, player, admin)
├── components/            # UI (client, player, admin, ui)
├── hooks/                 # useDeviceId, useQueue, useYouTubeApi, usePlayerCommands
├── lib/
│   ├── supabase/          # clientes browser (anon) y server (service role)
│   ├── redis/             # cliente, caché, rate limit, presencia
│   ├── youtube/           # integración con YouTube Data API
│   └── auth/              # hashing, sesión JWT, guardas
├── services/              # lógica de negocio (bar, request, queue, search, table, settings)
└── types/                 # tipos de dominio
supabase/schema.sql        # esquema de base de datos
scripts/seed.mjs           # crea bar + admin + settings
```

Separación clara: **UI** · **lógica de negocio (services)** · **acceso a datos (lib)** · **integración YouTube**.

---

## ⚙️ Requisitos previos

- Node.js 20+
- Una cuenta de [Supabase](https://supabase.com) (proyecto gratuito)
- Una API key de [YouTube Data API v3](https://console.cloud.google.com/)
- Redis (local, o vía Docker Compose)
- Docker (opcional, para ejecutar con `docker compose`)

---

## 🚀 Puesta en marcha (local, sin Docker)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la base de datos

En el **SQL Editor** de tu proyecto Supabase, ejecuta el contenido de
[`supabase/schema.sql`](supabase/schema.sql). Esto crea el schema `rockbox` con
las tablas `bars`, `admin_users`, `tables`, `requests`, `settings`, activa RLS y
publica `requests` para Realtime.

> **Importante:** el schema se llama `rockbox`. Debes exponerlo a la API.
> En Supabase: **Project Settings → API → Exposed schemas** y añade `rockbox`.

### 3. Variables de entorno

Copia el ejemplo y rellena tus valores:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (Project Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (¡secreta, solo servidor!) |
| `YOUTUBE_API_KEY` | API key de YouTube Data API v3 (solo servidor) |
| `REDIS_URL` | `redis://localhost:6379` en local |
| `AUTH_SECRET` | Secreto para firmar los JWT de admin (≥ 32 chars) |
| `NEXT_PUBLIC_APP_URL` | URL base para construir los QR (`http://localhost:3000`) |

Genera un `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Crear el primer bar y administrador

```bash
npm run seed -- "Mi Bar" admin@mibar.com miPassword
```

El script imprime el **Bar ID** (lo necesitarás para el Player) y crea los
ajustes por defecto (repetición 120 min, intervalo 15 min, todos los géneros).

### 5. Arrancar

```bash
npm run dev
```

Abre http://localhost:3000

---

## 🐳 Puesta en marcha con Docker

`docker compose` levanta **rockbox-web** + **redis**. Supabase sigue siendo externo.

1. Configura `.env.local` (igual que arriba). Para Docker, `REDIS_URL` se
   sobreescribe automáticamente a `redis://redis:6379`.

2. Las variables `NEXT_PUBLIC_*` se necesitan en el build. Compose las
   interpola desde un archivo `.env` en la raíz. La forma más simple:

   ```bash
   cp .env.local .env
   ```

3. Construye y arranca:

   ```bash
   docker compose up --build
   ```

4. Abre http://localhost:3000

> Recuerda haber ejecutado el `schema.sql` en Supabase y el `seed` al menos una
> vez (puedes correr el seed desde tu máquina con `npm run seed ...`).

---

## 🧪 Flujo de prueba de extremo a extremo

1. Inicia sesión en `/admin` con el email/clave del seed.
2. Ve a **Mesas**, crea una mesa y genera su **QR**.
3. Escanea el QR con el móvil (o abre `/bar/{qrToken}`).
4. Busca una canción y pídela → aparece en la cola.
5. En el computador del TV abre `/player/{barId}` y pulsa **Iniciar**.
6. La canción suena; al terminar, salta automáticamente a la siguiente.
7. Intenta volver a pedir la misma canción recién sonada → se rechaza con el
   tiempo restante (regla de repetición).
8. Intenta pedir dos canciones seguidas desde el mismo dispositivo → se rechaza
   por el límite de solicitudes.

---

## 🔒 Seguridad

- La **YouTube API Key** y la **Service Role Key** viven solo en el servidor.
- El navegador usa la **anon key** con RLS: solo puede **leer** cola y bares (para Realtime).
- Toda solicitud se **valida en el servidor** (géneros, repetición, límites).
- Autenticación de admin con **JWT httpOnly** (cookie) y contraseñas con **scrypt**.
- **Rate limiting** básico con Redis, además del límite de negocio por dispositivo.
- Nunca subas `.env.local` ni `.env` a Git (ya están en `.gitignore`).

---

## 🎛️ Ajustes configurables (panel admin → Ajustes)

- **Tiempo de repetición** (min): bloqueo para volver a pedir una canción reproducida.
- **Tiempo entre solicitudes** (min): límite por dispositivo.
- **Géneros permitidos:** Rock, Rock en Español, Metal, Pop.

---

## 📜 Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run typecheck` | Chequeo de tipos |
| `npm run lint` | Linter |
| `npm run seed -- "Bar" email pass` | Crea bar + admin + settings |

---

Hecho con 🎸 para que la música del bar la elijan quienes la bailan.
