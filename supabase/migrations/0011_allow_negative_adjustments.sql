-- ============================================================================
-- 0011_allow_negative_adjustments.sql
-- O lançamento rápido no Ranking ("Adicionar valor" / "Retirar valor") grava
-- um ajuste (estorno, correção de digitação) como uma nova linha em
-- sales_results, igual a qualquer outro lançamento -- em vez de editar ou
-- apagar a venda original. Isso preserva o histórico (a venda errada
-- continua registrada, só compensada por um ajuste negativo), mas exige que
-- `value` possa ser negativo, o que o check original (0001_schema.sql)
-- proibia. calculate_indicator_attainment soma `value` livremente, então
-- nenhuma outra mudança é necessária: um ajuste negativo já reduz o
-- acumulado do vendedor corretamente.
-- ============================================================================

alter table sales_results
  drop constraint sales_results_value_nonnegative;

alter table sales_results
  add constraint sales_results_value_nonzero check (value <> 0);
