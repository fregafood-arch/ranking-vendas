"use client";

import { ConfirmButton } from "@/components/shared/ConfirmButton";
import { deleteIndicator } from "@/lib/actions/indicators.actions";

/**
 * indicators tem "on delete cascade" em seller_goals, team_goals,
 * sales_results, ranking_rules e achievements (migration 0001) — excluir
 * o indicador leva junto metas, lançamentos e regras de ranking feitos com
 * ele. Quando há dado real em jogo, o texto de confirmação avisa a
 * quantidade em vez de um "tem certeza?" genérico.
 */
export function IndicatorDeleteButton({
  indicatorId,
  resultCount,
  goalCount,
}: {
  indicatorId: string;
  resultCount: number;
  goalCount: number;
}) {
  const hasData = resultCount > 0 || goalCount > 0;
  const confirmQuestion = hasData
    ? `Apaga também ${resultCount} lançamento(s) e ${goalCount} meta(s) deste indicador. Excluir?`
    : undefined;

  return (
    <ConfirmButton
      label="Excluir"
      confirmLabel="Excluir"
      confirmQuestion={confirmQuestion}
      onConfirm={() => deleteIndicator(indicatorId)}
      className="text-neutral-400 transition-colors hover:text-red-400"
    />
  );
}
