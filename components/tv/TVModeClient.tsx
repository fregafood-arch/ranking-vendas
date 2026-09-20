"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { findOvertakers, type RankEntry } from "@/lib/tv/overtake";
import { findNewlyAchievedGoals, type GoalSnapshot } from "@/lib/tv/goal-achievement";
import { getRankDirection, type RankDirection } from "@/lib/tv/rank-direction";
import type { CelebrationEvent } from "@/lib/tv/celebration";
import { CelebrationOverlay } from "@/components/tv/CelebrationOverlay";
import { TVRankingListSlide, type TVRankingRowData } from "@/components/tv/TVRankingListSlide";

export type TVSlideGroup = {
  periodLabel: string;
  slides: ReactNode[];
  /** Posição e nome de cada vendedor no ranking deste período, usado tanto
   * para detectar ultrapassagens quanto para desenhar a seta de subiu/desceu
   * na lista completa. */
  ranking: RankEntry[];
  /** Linhas completas da lista de ranking (o "slide 3"), renderizadas no
   * cliente -- não vêm prontas em `slides` porque precisam da seta de
   * subiu/desceu, que só o cliente sabe calcular. */
  rankingRows: TVRankingRowData[];
  /** % de atingimento das metas de escopo "Toda a empresa" deste período,
   * usado só para detectar o momento em que uma meta é batida. */
  globalGoals: GoalSnapshot[];
};

let celebrationKeySeq = 0;
function nextCelebrationKey(prefix: string) {
  celebrationKeySeq += 1;
  return `${prefix}-${celebrationKeySeq}`;
}

/**
 * Alterna entre os slides recebidos (item 18 do briefing: "alternar
 * informações importantes") e recarrega os dados do servidor em intervalos
 * (item 18: "atualizar os dados automaticamente"). Optou-se por polling via
 * router.refresh() em vez de Supabase Realtime: numa TV ligada por dias
 * seguidos, uma conexão WebSocket tem mais chance de cair silenciosamente
 * do que um poll periódico tem de falhar — ver nota na arquitetura original.
 *
 * Os slides são agrupados por período (podem existir vários períodos ativos
 * ao mesmo tempo) para que o cabeçalho mostre sempre o período do slide
 * atualmente em exibição.
 */
export function TVModeClient({
  groups,
  announcementsSlide,
  rotationSeconds = 14,
  refreshSeconds = 45,
}: {
  groups: TVSlideGroup[];
  /** Slide de avisos (Administração > Avisos) -- não é por período, então
   * entra uma única vez no rodízio geral, não repetido a cada grupo. */
  announcementsSlide?: ReactNode | null;
  rotationSeconds?: number;
  refreshSeconds?: number;
}) {
  const previousRanksRef = useRef<Map<number, Map<string, number>> | null>(null);
  const previousGoalsRef = useRef<Map<number, Map<string, number>> | null>(null);

  // Quem subiu/desceu na última atualização -- precisa ser ESTADO (não
  // ref), porque tem que continuar valendo até a próxima atualização
  // acontecer de verdade, não só até o próximo re-render (o rodízio de
  // slides troca o índice sem novos dados chegarem, e se isso recalculasse
  // a comparação a cada render usando a ref -- que já teria avançado para o
  // snapshot atual -- a seta nunca apareceria de fato na tela).
  const [directionsByGroup, setDirectionsByGroup] = useState<Map<number, Map<string, RankDirection>>>(
    new Map(),
  );

  const flatSlides = groups.flatMap((group, groupIndex) => {
    const rankingSlide = (
      <TVRankingListSlide rows={group.rankingRows} directions={directionsByGroup.get(groupIndex) ?? null} />
    );
    return [...group.slides, rankingSlide].map((slide, slideIndex) => ({
      key: `${groupIndex}-${slideIndex}`,
      periodLabel: group.periodLabel,
      slide,
    }));
  });

  if (announcementsSlide) {
    flatSlides.push({ key: "announcements", periodLabel: "Avisos", slide: announcementsSlide });
  }

  const [index, setIndex] = useState(0);
  const router = useRouter();
  const safeIndex = flatSlides.length ? index % flatSlides.length : 0;

  useEffect(() => {
    if (flatSlides.length <= 1) return;
    const rotationTimer = setInterval(() => {
      setIndex((current) => (current + 1) % flatSlides.length);
    }, rotationSeconds * 1000);
    return () => clearInterval(rotationTimer);
  }, [flatSlides.length, rotationSeconds]);

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      router.refresh();
    }, refreshSeconds * 1000);
    return () => clearInterval(refreshTimer);
  }, [router, refreshSeconds]);

  const [celebrationQueue, setCelebrationQueue] = useState<CelebrationEvent[]>([]);

  useEffect(() => {
    const previousRanks = previousRanksRef.current;
    const previousGoals = previousGoalsRef.current;
    const nextRanks = new Map<number, Map<string, number>>();
    const nextGoals = new Map<number, Map<string, number>>();
    const nextDirections = new Map<number, Map<string, RankDirection>>();
    const newEvents: CelebrationEvent[] = [];

    groups.forEach((group, groupIndex) => {
      const rankMap = new Map(group.ranking.map((entry) => [entry.sellerId, entry.rank]));
      nextRanks.set(groupIndex, rankMap);

      const previousRankMap = previousRanks?.get(groupIndex);
      const directionMap = new Map<string, RankDirection>();
      if (previousRankMap) {
        for (const entry of group.ranking) {
          const direction = getRankDirection(previousRankMap.get(entry.sellerId), entry.rank);
          if (direction) directionMap.set(entry.sellerId, direction);
        }
        for (const overtaker of findOvertakers(previousRankMap, group.ranking)) {
          newEvents.push({
            kind: "overtake",
            key: nextCelebrationKey("overtake"),
            sellerId: overtaker.sellerId,
            name: overtaker.name,
            rank: overtaker.rank,
          });
        }
      }
      nextDirections.set(groupIndex, directionMap);

      const goalMap = new Map(group.globalGoals.map((goal) => [goal.key, goal.percent]));
      nextGoals.set(groupIndex, goalMap);

      const previousGoalMap = previousGoals?.get(groupIndex);
      if (previousGoalMap) {
        for (const achieved of findNewlyAchievedGoals(previousGoalMap, group.globalGoals)) {
          newEvents.push({
            kind: "goal",
            key: nextCelebrationKey("goal"),
            periodLabel: group.periodLabel,
          });
        }
      }
    });

    if (previousRanks && newEvents.length > 0) {
      setCelebrationQueue((queue) => [...queue, ...newEvents]);
    }
    setDirectionsByGroup(nextDirections);
    previousRanksRef.current = nextRanks;
    previousGoalsRef.current = nextGoals;
  }, [groups]);

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-900 px-10 py-4">
        <p className="text-2xl font-semibold text-neutral-50">Ranking de Vendas</p>
        <div className="flex items-center gap-2.5 rounded-full bg-blue-600 py-2 pr-5 pl-3.5 shadow-lg shadow-blue-950/40">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
          <span className="text-xl font-bold tracking-wide text-white">
            {flatSlides[safeIndex]?.periodLabel}
          </span>
        </div>
      </header>
      <div className="relative flex-1 overflow-hidden">
        {flatSlides.map((item, slideIndex) => (
          <div
            key={item.key}
            className={`absolute inset-0 transition-opacity duration-700 ${
              slideIndex === safeIndex ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {item.slide}
          </div>
        ))}
      </div>
      <CelebrationOverlay
        queue={celebrationQueue}
        onAdvance={() => setCelebrationQueue((queue) => queue.slice(1))}
      />
    </div>
  );
}
