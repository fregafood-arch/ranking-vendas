export type RankDirection = "up" | "down" | null;

/**
 * Direção do movimento de um vendedor no ranking desde a última
 * atualização. `undefined` em previousRank significa "sem dado anterior
 * ainda" (primeira renderização) -- nesse caso não mostra seta nenhuma,
 * só quando há de fato uma posição anterior para comparar.
 */
export function getRankDirection(previousRank: number | undefined, currentRank: number): RankDirection {
  if (previousRank === undefined) return null;
  if (currentRank < previousRank) return "up";
  if (currentRank > previousRank) return "down";
  return null;
}
