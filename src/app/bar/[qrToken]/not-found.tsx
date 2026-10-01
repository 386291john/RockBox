export default function BarNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="text-2xl font-black">Mesa no encontrada</h1>
      <p className="text-white/60">
        Este código QR no es válido o la mesa ya no existe. Pide al personal del
        bar que te comparta un código actualizado.
      </p>
    </main>
  );
}
