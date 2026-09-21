"use client";

import { useEffect, useRef } from "react";
import type { CelebrationEvent } from "@/lib/tv/celebration";

/**
 * Cada vídeo toca até o fim sozinho (evento "ended"), não um tempo fixo --
 * este é só um teto de segurança para destravar a fila caso o vídeo não
 * consiga tocar (autoplay bloqueado, arquivo indisponível etc.), maior que
 * a duração real de cada vídeo com folga.
 */
const FALLBACK_MS: Record<CelebrationEvent["kind"], number> = {
  overtake: 10000,
  goal: 26000,
};

/**
 * Destaque em tela cheia para dois momentos do Modo TV: um vendedor
 * ultrapassa outro no ranking, ou a meta "Toda a empresa" de um período é
 * batida. Cada tipo toca seu próprio vídeo (com áudio) por cima de uma
 * mensagem em evidência. A fila garante que, se mais de um desses eventos
 * acontecer na mesma atualização, eles aparecem um de cada vez, nunca
 * empilhados.
 */
export function CelebrationOverlay({
  queue,
  onAdvance,
}: {
  queue: CelebrationEvent[];
  onAdvance: () => void;
}) {
  const current = queue[0] ?? null;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!current) return;
    let advanced = false;
    const advanceOnce = () => {
      if (advanced) return;
      advanced = true;
      onAdvance();
    };

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.muted = false;
      video.play().catch(() => {
        // Navegador bloqueou autoplay com som (comum numa TV sem nenhuma
        // interação humana na página) -- toca mudo em vez de não tocar
        // nada. Mudo é sempre permitido, então o vídeo pelo menos aparece;
        // o som volta a funcionar sozinho assim que a página receber
        // qualquer clique/toque (ver listener global em TVModeClient).
        video.muted = true;
        video.play().catch(() => {});
      });
      video.addEventListener("ended", advanceOnce);
    }

    // Teto de segurança: se o "ended" nunca disparar, a fila não fica presa.
    const fallbackTimer = setTimeout(advanceOnce, FALLBACK_MS[current.kind]);

    return () => {
      video?.removeEventListener("ended", advanceOnce);
      clearTimeout(fallbackTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key]);

  if (!current) return null;

  const videoSrc = current.kind === "overtake" ? "/video/overtake.mp4" : "/video/goal-achieved.mp4";

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <video
        key={videoSrc}
        ref={videoRef}
        src={videoSrc}
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-90"
        aria-hidden
      />
      <div
        key={current.key}
        className="celebration-pop-in relative z-10 rounded-2xl border border-amber-400/40 bg-black/60 px-12 py-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      >
        {current.kind === "overtake" ? (
          <>
            <p className="text-xl font-bold tracking-widest text-amber-300">ULTRAPASSAGEM!</p>
            <p className="mt-2 text-6xl font-black text-white drop-shadow-lg">{current.name}</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">Novo {current.rank}º lugar!</p>
          </>
        ) : (
          <>
            <p className="text-xl font-bold tracking-widest text-emerald-300">META BATIDA!</p>
            <p className="mt-2 text-5xl font-black text-white drop-shadow-lg">
              Atingimos a meta {current.periodLabel}
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-400">Parabéns a todos! 🎉</p>
          </>
        )}
      </div>
    </div>
  );
}
