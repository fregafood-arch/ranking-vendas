-- ============================================================================
-- 0012_period_tv_visibility.sql
-- Item 14 do mapeamento de melhorias: deixar visível/oculto cada slide do
-- Modo TV por período, sem precisar de código novo a cada pedido de "só
-- quero isso na tela". Um período (nosso equivalente ao "quadro" do
-- concorrente) já é a unidade natural para isso -- cada card de período no
-- Modo TV gera até 3 slides (pódio, metas/estatísticas, lista completa) e
-- essas colunas controlam quais deles entram no rodízio.
-- ============================================================================

alter table periods
  add column tv_hide_podium boolean not null default false,
  add column tv_hide_stats boolean not null default false,
  add column tv_hide_ranking_list boolean not null default false;
