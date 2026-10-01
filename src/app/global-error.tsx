"use client";

// Error global que envuelve incluso al layout raíz. Debe renderizar <html>/<body>.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          background: "#0a0a0f",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <div>
          <div style={{ fontSize: "3rem" }}>🎸💥</div>
          <h1 style={{ fontWeight: 800 }}>Algo salió mal</h1>
          <p style={{ opacity: 0.6 }}>Ocurrió un error inesperado.</p>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              background: "#8b5cf6",
              color: "#fff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.6rem 1.2rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
