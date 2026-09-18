"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Alterna entre os slides recebidos (item 18 do briefing: "alternar
 * informações importantes") e recarrega os dados do servidor em intervalos
 * (item 18: "atualizar os dados automaticamente"). Optou-se por polling via
 * router.refresh() em vez de Supabase Realtime: numa TV ligada por dias
 * seguidos, uma conexão WebSocket tem mais chance de cair silenciosamente
 * do que um poll periódico tem de falhar — ver nota na arquitetura original.
 */
export function TVModeClient({
  slides,
  rotationSeconds = 14,
  refreshSeconds = 45,
}: {
  slides: ReactNode[];
  rotationSeconds?: number;
  refreshSeconds?: number;
}) {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (slides.length <= 1) return;
    const rotationTimer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, rotationSeconds * 1000);
    return () => clearInterval(rotationTimer);
  }, [slides.length, rotationSeconds]);

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      router.refresh();
    }, refreshSeconds * 1000);
    return () => clearInterval(refreshTimer);
  }, [router, refreshSeconds]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {slides.map((slide, slideIndex) => (
        <div
          key={slideIndex}
          className={`absolute inset-0 transition-opacity duration-700 ${
            slideIndex === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {slide}
        </div>
      ))}
    </div>
  );
}
