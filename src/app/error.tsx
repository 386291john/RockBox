"use client";

// Componente de error global de RockBox (App Router).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🎸💥</div>
      <h1 className="text-2xl font-black">Algo salió mal</h1>
      <p className="text-white/60">
        Ocurrió un error inesperado. Intenta de nuevo en unos segundos.
      </p>
      <button onClick={reset} className="btn-primary">
        Reintentar
      </button>
    </main>
  );
}
