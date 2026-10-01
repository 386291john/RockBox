"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { QueueSnapshot, SongRequest } from "@/types";

// Suscribe la cola de un bar y la mantiene sincronizada en tiempo real.
// Carga inicial vía API pública /api/queue y luego escucha cambios de la
// tabla rockbox.requests mediante Supabase Realtime.
export function useQueue(barId: string) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot>({
    current: null,
    queue: [],
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?barId=${barId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as QueueSnapshot;
        setSnapshot(data);
      }
    } finally {
      setLoading(false);
    }
  }, [barId]);

  useEffect(() => {
    refetch();

    const channel = supabaseBrowser
      .channel(`requests:${barId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "rockbox",
          table: "requests",
          filter: `bar_id=eq.${barId}`,
        },
        () => {
          // Cualquier cambio en las solicitudes recarga la foto de la cola.
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [barId, refetch]);

  return { ...snapshot, loading, refetch } as QueueSnapshot & {
    loading: boolean;
    refetch: () => Promise<void>;
  };
}

export type { SongRequest };
