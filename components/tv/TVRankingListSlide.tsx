"use client";

import { TVRankingRow } from "@/components/tv/TVRankingRow";
import type { RankDirection } from "@/lib/tv/rank-direction";

export type TVRankingRowData = {
  rank: number;
  sellerId: string;
  name: string;
  photoPath: string | null;
  resultLabel: string;
  percent: number;
};

/**
 * Lista completa do ranking (o antigo "slide 3") -- precisa ser Client
 * Component porque a seta de subiu/desceu vem de `directions`, calculado em
 * TVModeClient comparando com a atualização anterior (informação que só
 * existe no cliente).
 */
export function TVRankingListSlide({
  rows,
  directions,
}: {
  rows: TVRankingRowData[];
  directions: Map<string, RankDirection> | null;
}) {
  return (
    <div
      className="flex h-full flex-col gap-3 overflow-hidden px-16 py-10"
      style={{ justifyContent: "safe center" }}
    >
      {rows.map((row) => (
        <TVRankingRow
          key={row.sellerId}
          rank={row.rank}
          name={row.name}
          photoPath={row.photoPath}
          percent={row.percent}
          resultLabel={row.resultLabel}
          direction={directions?.get(row.sellerId) ?? null}
        />
      ))}
      {!rows.length && (
        <p className="text-center text-2xl text-neutral-500">
          Nenhum vendedor com metas configuradas neste período.
        </p>
      )}
    </div>
  );
}
