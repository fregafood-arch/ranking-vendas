export type RankEntry = { sellerId: string; rank: number; name: string };

/**
 * Vendedores que melhoraram de posição (rank menor = mais acima na lista)
 * entre o snapshot anterior e o atual. Usado pelo Modo TV para saber quem
 * ultrapassou alguém e merece o destaque de vídeo + nome na tela.
 */
export function findOvertakers(previous: Map<string, number>, next: RankEntry[]): RankEntry[] {
  return next.filter((entry) => {
    const previousRank = previous.get(entry.sellerId);
    return previousRank !== undefined && entry.rank < previousRank;
  });
}
