export type GoalSnapshot = { key: string; percent: number };

/**
 * Metas (escopo "Toda a empresa") que acabaram de cruzar de <100% para
 * >=100% entre o snapshot anterior e o atual -- dispara a comemoração só
 * no momento em que a meta é batida, não continuamente enquanto ela segue
 * acima de 100%, e não repete se o total oscilar (ex.: um resultado
 * excluído derruba abaixo de 100% e depois um novo lançamento cruza de
 * novo -- isso conta como uma nova conquista).
 */
export function findNewlyAchievedGoals(previous: Map<string, number>, next: GoalSnapshot[]): GoalSnapshot[] {
  return next.filter((entry) => {
    const previousPercent = previous.get(entry.key);
    return previousPercent !== undefined && previousPercent < 100 && entry.percent >= 100;
  });
}
