"use client";

import { useEffect } from "react";

// Dispara um evento de funil do módulo Placas 1x quando a tela monta
// (Fase 1.4). Best-effort — não bloqueia nada, ignora erro.
export function PlateFunnelPing({ event }: { event: string }) {
  useEffect(() => {
    let key = "";
    try {
      key = localStorage.getItem("toqy_plate_sk") ?? "";
      if (!key) {
        key = crypto.randomUUID();
        localStorage.setItem("toqy_plate_sk", key);
      }
    } catch {
      /* localStorage bloqueado — segue sem session key */
    }
    fetch("/api/plate/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, sessionKey: key || undefined }),
    }).catch(() => {});
  }, [event]);

  return null;
}
