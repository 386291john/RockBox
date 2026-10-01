import { notFound } from "next/navigation";
import { getBarById } from "@/services/bar.service";
import { PlayerApp } from "@/components/player/PlayerApp";

// Pantalla del Player: se abre en el computador/mini PC conectado al TV.
// URL: /player/{barId}
export const dynamic = "force-dynamic";

export default async function PlayerPage({
  params,
}: {
  params: { barId: string };
}) {
  const bar = await getBarById(params.barId);
  if (!bar) notFound();

  return <PlayerApp barId={bar.id} barName={bar.name} />;
}
