-- ============================================================================
-- 0007_default_tie_break_rules.sql
--
-- Bug real encontrado testando o Modo TV (ETAPA 9): tie_break_rules estava
-- vazia neste projeto (só era populada pelo seed.sql, nunca executado
-- aqui). Sem essas linhas, o ORDER BY dinâmico de calculate_ranking()
-- (0002_functions_and_views.sql) fica vazio e cai só no critério de
-- desempate final (data de cadastro do vendedor) — ou seja, SEM essas
-- regras o Ranking Geral não ordena por pontuação/atingimento de verdade,
-- só parecia certo por coincidência com poucos vendedores de teste.
--
-- Conclusão: a ordem de desempate não é "dado de demonstração" (não devia
-- estar só em seed.sql) — é configuração padrão da qual a fórmula do
-- ranking depende para fazer sentido. Por isso vira uma migration própria,
-- para qualquer instalação nova (ou este projeto, rodando agora) já nascer
-- com o comportamento correto. Reordenar continua sendo um UPDATE de linha
-- pela futura tela de Configurações — isto aqui só garante que exista um
-- padrão sensato desde o início.
-- ============================================================================

insert into tie_break_rules (ranking_scope, priority, rule_key, direction) values
  ('GENERAL', 1, 'PRIMARY_GOAL_PERCENT', 'DESC'),
  ('GENERAL', 2, 'GENERAL_SCORE',        'DESC'),
  ('GENERAL', 3, 'RAW_SALES_COUNT',      'DESC'),
  ('GENERAL', 4, 'EARLIEST_ACHIEVEMENT', 'ASC')
on conflict (ranking_scope, priority) do nothing;
