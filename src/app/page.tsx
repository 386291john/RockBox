import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-neon text-4xl shadow-lg shadow-accent/30">
          🎸
        </div>
        <h1 className="text-4xl font-black tracking-tight">RockBox</h1>
        <p className="max-w-md text-white/60">
          El jukebox digital de tu bar. Escanea el QR de tu mesa, busca una
          canción y hazla sonar.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/admin" className="btn-primary">
          Panel de administración
        </Link>
        <a
          href="https://github.com"
          className="btn-ghost"
          target="_blank"
          rel="noreferrer"
        >
          Documentación
        </a>
      </div>

      <p className="text-xs text-white/30">
        Los clientes acceden escaneando el código QR de su mesa.
      </p>
    </main>
  );
}
