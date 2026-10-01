"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Comandos efímeros admin -> player (pausar/reanudar/saltar) mediante
// Supabase Realtime Broadcast. No se persisten en BD porque son transitorios.

export type PlayerCommand = { type: "pause" | "resume" | "skip"; ts: number };

const CHANNEL_PREFIX = "player-cmd:";

export function usePlayerCommands(barId: string): PlayerCommand | null {
  const [command, setCommand] = useState<PlayerCommand | null>(null);

  useEffect(() => {
    const channel = supabaseBrowser.channel(`${CHANNEL_PREFIX}${barId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "command" }, ({ payload }) => {
        setCommand(payload as PlayerCommand);
      })
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [barId]);

  return command;
}

// Utilidad para que el admin envíe un comando al player.
export async function sendPlayerCommand(
  barId: string,
  type: PlayerCommand["type"]
): Promise<void> {
  const channel = supabaseBrowser.channel(`${CHANNEL_PREFIX}${barId}`);
  await channel.subscribe();
  await channel.send({
    type: "broadcast",
    event: "command",
    payload: { type, ts: Date.now() } satisfies PlayerCommand,
  });
  // Cerramos el canal efímero tras enviar.
  setTimeout(() => supabaseBrowser.removeChannel(channel), 500);
}
