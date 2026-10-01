"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "rockbox_device_id";

// Genera y persiste un identificador único de dispositivo en localStorage.
// El cliente no necesita crear cuenta; este id lo identifica para el rate limit.
export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    try {
      let id = window.localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = uuidv4();
        window.localStorage.setItem(STORAGE_KEY, id);
      }
      setDeviceId(id);
    } catch {
      // Si localStorage no está disponible, usamos un id efímero en memoria.
      setDeviceId(uuidv4());
    }
  }, []);

  return deviceId;
}
