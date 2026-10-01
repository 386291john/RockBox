import Link from "next/link";

// Página 404 global de RockBox.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🎧</div>
      <h1 className="text-2xl font-black">Página no encontrada</h1>
      <p className="text-white/60">
        La página que buscas no existe o el enlace ya no es válido.
      </p>
      <Link href="/" className="btn-primary">
        Volver al inicio
      </Link>
    </main>
  );
}
