-- ============================================================================
-- 0005_seller_goals_upsert.sql
--
-- A validação "pesos ativos de um vendedor somam 100%" (trigger deferrable
-- em 0002) só funciona se todas as metas daquele vendedor+período forem
-- gravadas numa única transação — senão, gravar uma meta de cada vez faria
-- a primeira já falhar (50% ≠ 100%) antes da segunda existir.
--
-- Como o cliente Supabase (PostgREST) executa cada chamada .insert()/.update()
-- como uma transação própria, a área administrativa de metas (ETAPA 4) não
-- pode gravar linha por linha — precisa desta função, chamada uma vez via
-- supabase.rpc(), que grava o conjunto inteiro de metas do vendedor dentro
-- de uma única transação.
--
-- SECURITY INVOKER (padrão): a função roda com os privilégios de quem a
-- chama, então a policy de RLS "só ADMIN escreve em seller_goals"
-- (0003_rls_policies.sql) continua valendo normalmente dentro dela — a
-- função não é um jeito de contornar RLS, só de agrupar as escritas numa
-- transação só.
-- ============================================================================

create or replace function upsert_seller_goals(
  p_seller_id uuid,
  p_period_id uuid,
  p_goals jsonb -- array de {"indicator_id": uuid, "target_value": numeric, "weight": numeric}
)
returns void
language plpgsql
security invoker
as $$
begin
  -- Remove metas que existiam para este vendedor+período mas não vieram no
  -- novo conjunto enviado (o admin desmarcou o indicador no formulário).
  delete from seller_goals
  where seller_id = p_seller_id
    and period_id = p_period_id
    and indicator_id not in (
      select (g->>'indicator_id')::uuid from jsonb_array_elements(p_goals) g
    );

  insert into seller_goals (seller_id, indicator_id, period_id, target_value, weight, is_active)
  select
    p_seller_id,
    (g->>'indicator_id')::uuid,
    p_period_id,
    (g->>'target_value')::numeric,
    (g->>'weight')::numeric,
    true
  from jsonb_array_elements(p_goals) g
  on conflict (seller_id, indicator_id, period_id)
  do update set
    target_value = excluded.target_value,
    weight = excluded.weight,
    is_active = true,
    updated_at = now();
end;
$$;

grant execute on function upsert_seller_goals(uuid, uuid, jsonb) to authenticated;
