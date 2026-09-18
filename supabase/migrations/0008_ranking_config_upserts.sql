-- ============================================================================
-- 0008_ranking_config_upserts.sql
--
-- Funções de apoio à tela /admin/configuracoes (ETAPA 10): editar os pesos
-- padrão + cap de atingimento (ranking_rules) e a ordem de desempate
-- (tie_break_rules) sem tocar em SQL diretamente — fechando a lacuna que
-- causou o bug encontrado na ETAPA 9 (tie_break_rules vazia).
--
-- Mesma razão de existir que upsert_seller_goals (0005): ranking_rules tem
-- a mesma trigger de "pesos somam 100%" (trg_validate_ranking_rules_weights,
-- 0002) — só funciona corretamente se o conjunto inteiro for gravado numa
-- única transação. tie_break_rules não tem essa trigger, mas trocar
-- prioridades entre linhas existentes via UPDATE direto esbarraria na
-- constraint única (ranking_scope, priority) no meio do caminho (ex.: trocar
-- as prioridades 1 e 2 direto colide transitoriamente) — apagar e reinserir
-- o conjunto inteiro numa transação evita isso.
-- ============================================================================

create or replace function upsert_ranking_rules(
  p_period_id uuid,
  p_rules jsonb -- array de {"indicator_id": uuid, "default_weight": numeric, "attainment_cap": numeric|null}
)
returns void
language plpgsql
security invoker
as $$
begin
  delete from ranking_rules
  where period_id = p_period_id
    and indicator_id not in (
      select (r->>'indicator_id')::uuid from jsonb_array_elements(p_rules) r
    );

  insert into ranking_rules (period_id, indicator_id, default_weight, attainment_cap, is_active)
  select
    p_period_id,
    (r->>'indicator_id')::uuid,
    (r->>'default_weight')::numeric,
    nullif(r->>'attainment_cap', '')::numeric,
    true
  from jsonb_array_elements(p_rules) r
  on conflict (period_id, indicator_id)
  do update set
    default_weight = excluded.default_weight,
    attainment_cap = excluded.attainment_cap,
    is_active = true,
    updated_at = now();
end;
$$;

create or replace function upsert_tie_break_rules(
  p_ranking_scope text,
  p_rules jsonb -- array de {"priority": int, "rule_key": text, "direction": text}
)
returns void
language plpgsql
security invoker
as $$
begin
  delete from tie_break_rules where ranking_scope = p_ranking_scope;

  insert into tie_break_rules (ranking_scope, priority, rule_key, direction, is_active)
  select
    p_ranking_scope,
    (r->>'priority')::int,
    r->>'rule_key',
    r->>'direction',
    true
  from jsonb_array_elements(p_rules) r;
end;
$$;

grant execute on function upsert_ranking_rules(uuid, jsonb) to authenticated;
grant execute on function upsert_tie_break_rules(text, jsonb) to authenticated;
