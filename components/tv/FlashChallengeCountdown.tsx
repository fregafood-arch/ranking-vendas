"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Encerrado";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s` : `${pad(minutes)}m ${pad(seconds)}s`;
}

/**
 * Contagem regressiva viva (atualiza a cada segundo no navegador) para o
 * Desafio Relâmpago -- diferente do contador de dias restantes do período
 * (que só precisa da granularidade dos refreshes de 45s do Modo TV), aqui a
 * urgência de minutos/segundos é o ponto central do desafio.
 */
export function FlashChallengeCountdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const timer = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{formatRemaining(remaining)}</span>;
}
