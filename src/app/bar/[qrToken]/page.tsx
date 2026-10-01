import { notFound } from "next/navigation";
import { getBarByQrToken } from "@/services/bar.service";
import { ClientApp } from "@/components/client/ClientApp";
import type { Genre } from "@/types";

// Página a la que apunta el QR de cada mesa: /bar/{qrToken}
// Resuelve el bar y monta la interfaz del cliente (mobile-first).
export const dynamic = "force-dynamic";

export default async function BarPage({
  params,
}: {
  params: { qrToken: string };
}) {
  const ctx = await getBarByQrToken(params.qrToken);
  if (!ctx) notFound();

  return (
    <ClientApp
      barId={ctx.bar.id}
      barName={ctx.bar.name}
      tableNumber={ctx.table?.number ?? null}
      allowedGenres={ctx.settings.allowed_genres as Genre[]}
    />
  );
}
