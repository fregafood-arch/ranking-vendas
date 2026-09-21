"use client";

import { useEffect } from "react";
import type { CelebrationEvent } from "@/lib/tv/celebration";

/**
 * Quanto tempo cada comemoração fica na tela. Trocado de "toca até o vídeo
 * acabar" para um tempo fixo depois que confirmamos, testando nas TVs de
 * verdade do usuário (Samsung/Tizen, LG/webOS, Toshiba), que o navegador
 * embutido dessas TVs não toca o arquivo de vídeo de forma confiável --
 * mesmo pré-carregado, a tela ficava preta atrás do card. A comemoração
 * agora é só CSS/SVG (confete, feixes de luz), sem decodificar vídeo
 * nenhum, então funciona igual em qualquer navegador.
 */
const DISPLAY_MS: Record<CelebrationEvent["kind"], number> = {
  overtake: 4500,
  goal: 6500,
};

const CONFETTI_PIECES = [
  { left: "3%", color: "#3b82f6", delay: "0s", duration: "4.6s", size: 8 },
  { left: "13%", color: "#facc15", delay: "0.9s", duration: "5.2s", size: 6 },
  { left: "24%", color: "#f97316", delay: "0.3s", duration: "4.8s", size: 7 },
  { left: "36%", color: "#3b82f6", delay: "1.6s", duration: "5.6s", size: 6 },
  { left: "48%", color: "#facc15", delay: "0.6s", duration: "5s", size: 8 },
  { left: "60%", color: "#f97316", delay: "1.2s", duration: "5.4s", size: 6 },
  { left: "72%", color: "#3b82f6", delay: "0.2s", duration: "4.7s", size: 7 },
  { left: "84%", color: "#facc15", delay: "1.4s", duration: "5.3s", size: 6 },
  { left: "93%", color: "#f97316", delay: "0.8s", duration: "5.1s", size: 8 },
] as const;

function ConfettiLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {CONFETTI_PIECES.map((piece, i) => (
        <span
          key={i}
          className="holofote-confetti absolute top-0 rounded-[1px]"
          style={{
            left: piece.left,
            width: piece.size,
            height: piece.size * 2.2,
            background: piece.color,
            opacity: 0,
            animation: `holofote-confetti-fall ${piece.duration} linear ${piece.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Destaque em tela cheia para dois momentos do Modo TV: um vendedor
 * ultrapassa outro no ranking, ou a meta "Toda a empresa" de um período é
 * batida. A fila garante que, se mais de um desses eventos acontecer na
 * mesma atualização, eles aparecem um de cada vez, nunca empilhados.
 */
export function CelebrationOverlay({
  queue,
  onAdvance,
}: {
  queue: CelebrationEvent[];
  onAdvance: () => void;
}) {
  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(onAdvance, DISPLAY_MS[current.kind]);
    return () => clearTimeout(timer);
  }, [current?.key, current?.kind, onAdvance]);

  if (!current) return null;

  const isOvertake = current.kind === "overtake";
  const beamColors = isOvertake
    ? ["rgba(59,130,246,0.22)", "rgba(249,115,22,0.20)", "rgba(250,204,21,0.16)"]
    : ["rgba(250,204,21,0.24)", "rgba(16,185,129,0.20)", "rgba(59,130,246,0.16)"];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/85">
      <div
        className="holofote-beam pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 340px 480px at 15% 10%, ${beamColors[0]}, transparent 60%)`,
          animation: "holofote-beam-pulse 3s ease-in-out infinite",
        }}
        aria-hidden
      />
      <div
        className="holofote-beam pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 340px 480px at 85% 10%, ${beamColors[1]}, transparent 60%)`,
          animation: "holofote-beam-pulse 3s ease-in-out 1s infinite",
        }}
        aria-hidden
      />
      <div
        className="holofote-beam pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 420px 520px at 50% 0%, ${beamColors[2]}, transparent 65%)`,
          animation: "holofote-beam-pulse 3s ease-in-out 2s infinite",
        }}
        aria-hidden
      />
      <div
        className="holofote-starburst pointer-events-none absolute top-1/2 left-1/2"
        style={{
          width: 560,
          height: 560,
          background:
            "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.08) 0deg 6deg, transparent 6deg 18deg)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          animation: "holofote-starburst-spin 18s linear infinite",
        }}
        aria-hidden
      />
      <ConfettiLayer />

      <div
        key={current.key}
        className="celebration-pop-in relative z-10 rounded-2xl border border-amber-400/40 bg-black/60 px-12 py-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      >
        {isOvertake ? (
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
