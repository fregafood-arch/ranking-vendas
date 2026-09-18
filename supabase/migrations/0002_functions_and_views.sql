-- ============================================================================
-- 0002_functions_and_views.sql
-- current_user_role(), validação de soma de pesos, e o cálculo do ranking.
--
-- Por que isto vive no banco e não em TypeScript: é a única forma de
-- garantir que o número exibido na tela seja reproduzível, transparente e
-- não hardcoded — uma única definição versionada aqui, chamada de forma
-- idêntica pela web e pelo Modo TV. O TypeScript (lib/ranking/scoring.ts)
-- nunca reimplementa esta aritmética, só formata o resultado para exibição.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- current_user_role(): SECURITY DEFINER para evitar que toda policy de RLS
-- precise fazer join com profiles (o que causaria recursão de RLS, já que
-- profiles também tem RLS habilitado).
-- ----------------------------------------------------------------------------
create or replace function current_user_role()
returns app_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

-- ----------------------------------------------------------------------------
-- Validação: os pesos ativos de um vendedor, para um mesmo período, devem
-- somar 100%. É um trigger de restrição DEFERRABLE INITIALLY DEFERRED —
-- ou seja, só é checado no COMMIT da transação, não a cada INSERT
-- individual. Isso permite que a área administrativa grave as N metas de
-- um vendedor para um período dentro de uma única transação (ou função
-- RPC) e só valide a soma ao final, em vez de rejeitar a primeira linha
-- gravada antes das demais existirem.
--
-- Rejeita a gravação em vez de normalizar silenciosamente: um total que não
-- soma 100% é um erro de configuração do admin e deve aparecer como erro,
-- não ser "corrigido" de forma invisível.
-- ----------------------------------------------------------------------------
create or replace function validate_seller_goal_weights()
returns trigger
language plpgsql
as $$
declare
  v_seller_id uuid;
  v_period_id uuid;
  v_total numeric;
begin
  v_seller_id := coalesce(new.seller_id, old.seller_id);
  v_period_id := coalesce(new.period_id, old.period_id);

  select coalesce(sum(weight), 0) into v_total
  from seller_goals
  where seller_id = v_seller_id
    and period_id = v_period_id
    and is_active;

  if v_total > 0 and (v_total < 99.99 or v_total > 100.01) then
    raise exception
      'Os pesos ativos do vendedor % no período % somam %%%, mas devem somar 100%%',
      v_seller_id, v_period_id, v_total;
  end if;

  return null; -- resultado ignorado em constraint trigger AFTER
end;
$$;

create constraint trigger trg_validate_seller_goal_weights
  after insert or update or delete on seller_goals
  deferrable initially deferred
  for each row execute function validate_seller_goal_weights();

-- Mesma regra para os pesos padrão da empresa (ranking_rules), por período.
create or replace function validate_ranking_rules_weights()
returns trigger
language plpgsql
as $$
declare
  v_period_id uuid;
  v_total numeric;
begin
  v_period_id := coalesce(new.period_id, old.period_id);

  select coalesce(sum(default_weight), 0) into v_total
  from ranking_rules
  where period_id = v_period_id
    and is_active;

  if v_total > 0 and (v_total < 99.99 or v_total > 100.01) then
    raise exception
      'Os pesos padrão ativos do período % somam %%%, mas devem somar 100%%',
      v_period_id, v_total;
  end if;

  return null;
end;
$$;

create constraint trigger trg_validate_ranking_rules_weights
  after insert or update or delete on ranking_rules
  deferrable initially deferred
  for each row execute function validate_ranking_rules_weights();

-- ----------------------------------------------------------------------------
-- calculate_indicator_attainment(period_id): uma linha por vendedor x
-- indicador, com o valor realizado, a meta, o percentual de atingimento
-- (já limitado pelo cap configurado) e o score parcial ponderado. Usada
-- diretamente pela tela "Ranking por indicador" e como base de
-- calculate_ranking() abaixo.
--
-- Importante: sales_results não tem period_id — o acumulado do período é
-- sempre obtido somando os lançamentos cujo entry_date cai dentro do
-- intervalo de datas do período, e não por uma coluna de "acumulado"
-- mantida à parte. Isso evita duas fontes de verdade divergentes.
-- ----------------------------------------------------------------------------
create or replace function calculate_indicator_attainment(p_period_id uuid)
returns table (
  seller_id uuid,
  indicator_id uuid,
  actual_value numeric,
  target_value numeric,
  attainment_pct numeric,
  weight_used numeric,
  weighted_score numeric,
  first_goal_hit_date date
)
language sql
stable
as $$
  with bounds as (
    select start_date, end_date from periods where id = p_period_id
  ),
  period_results as (
    select sr.id, sr.seller_id, sr.indicator_id, sr.entry_date, sr.value
    from sales_results sr, bounds b
    where sr.entry_date between b.start_date and b.end_date
  ),
  -- Soma corrida por vendedor/indicador, ordenada por data (e id como
  -- desempate estável para lançamentos no mesmo dia), usada para descobrir
  -- em que data o acumulado cruzou a meta pela primeira vez.
  running as (
    select
      pr.seller_id,
      pr.indicator_id,
      pr.entry_date,
      sum(pr.value) over (
        partition by pr.seller_id, pr.indicator_id
        order by pr.entry_date, pr.id
      ) as running_total
    from period_results pr
  ),
  totals as (
    select seller_id, indicator_id, sum(value) as actual_value
    from period_results
    group by seller_id, indicator_id
  ),
  goals as (
    select seller_id, indicator_id, target_value, weight
    from seller_goals
    where period_id = p_period_id and is_active
  ),
  first_hit as (
    select r.seller_id, r.indicator_id, min(r.entry_date) as first_goal_hit_date
    from running r
    join goals g
      on g.seller_id = r.seller_id and g.indicator_id = r.indicator_id
    where r.running_total >= g.target_value
    group by r.seller_id, r.indicator_id
  )
  select
    g.seller_id,
    g.indicator_id,
    coalesce(t.actual_value, 0) as actual_value,
    g.target_value,
    least(
      case when g.target_value > 0
           then (coalesce(t.actual_value, 0) / g.target_value) * 100
           else 0 end,
      coalesce(rr.attainment_cap, 200)
    ) as attainment_pct,
    g.weight as weight_used,
    least(
      case when g.target_value > 0
           then (coalesce(t.actual_value, 0) / g.target_value) * 100
           else 0 end,
      coalesce(rr.attainment_cap, 200)
    ) * g.weight / 100.0 as weighted_score,
    fh.first_goal_hit_date
  from goals g
  left join totals t
    on t.seller_id = g.seller_id and t.indicator_id = g.indicator_id
  left join ranking_rules rr
    on rr.period_id = p_period_id and rr.indicator_id = g.indicator_id
  left join first_hit fh
    on fh.seller_id = g.seller_id and fh.indicator_id = g.indicator_id;
$$;

-- ----------------------------------------------------------------------------
-- calculate_ranking(period_id): uma linha por vendedor com o score geral
-- ponderado e a posição no Ranking Geral, já aplicando o desempate
-- configurado em tie_break_rules.
--
-- A meta principal de um vendedor (usada no 1º critério de desempate e como
-- destaque no perfil) é escolhida automaticamente como o indicador de maior
-- peso configurado para ele naquele período (decisão confirmada).
--
-- A ordem de desempate é montada dinamicamente a partir de tie_break_rules,
-- então reordená-la é um UPDATE de linha, não um redeploy — mas a query
-- final é montada com format(), mapeando cada rule_key conhecida (já restrita
-- por CHECK constraint) para uma expressão SQL fixa que nós mesmos
-- escolhemos, nunca concatenando texto vindo da tabela diretamente. Isso dá
-- configurabilidade sem abrir brecha de SQL injection.
-- ----------------------------------------------------------------------------
create or replace function calculate_ranking(p_period_id uuid)
returns table (
  seller_id uuid,
  general_score numeric,
  primary_indicator_id uuid,
  primary_attainment_pct numeric,
  primary_sales_count bigint,
  primary_first_hit_date date,
  rank_position bigint
)
language plpgsql
stable
as $$
declare
  v_order_by text := '';
  v_rule record;
  v_expr text;
begin
  for v_rule in
    select rule_key, direction
    from tie_break_rules
    where ranking_scope = 'GENERAL' and is_active
    order by priority
  loop
    v_expr := case v_rule.rule_key
      when 'PRIMARY_GOAL_PERCENT' then 'primary_attainment_pct'
      when 'GENERAL_SCORE' then 'general_score'
      when 'RAW_SALES_COUNT' then 'primary_sales_count'
      when 'EARLIEST_ACHIEVEMENT' then 'primary_first_hit_date'
      else null
    end;

    if v_expr is null or v_rule.direction not in ('ASC', 'DESC') then
      continue; -- regra desconhecida ou malformada: ignorada defensivamente
    end if;

    v_order_by := v_order_by || format('%I %s NULLS LAST, ', v_expr, v_rule.direction);
  end loop;

  -- Critério final estável, garantindo que nunca sobre empate indefinido
  -- mesmo se tie_break_rules estiver vazia ou nenhum vendedor tiver
  -- cruzado a meta principal.
  v_order_by := v_order_by || 'seller_created_at asc';

  return query execute format(
    $q$
    with attainment as (
      select * from calculate_indicator_attainment(%L::uuid)
    ),
    ranked_indicators as (
      select
        a.*,
        row_number() over (
          partition by a.seller_id
          order by a.weight_used desc, a.indicator_id
        ) as weight_rank
      from attainment a
    ),
    primary_per_seller as (
      select
        seller_id,
        indicator_id as primary_indicator_id,
        attainment_pct as primary_attainment_pct,
        first_goal_hit_date as primary_first_hit_date
      from ranked_indicators
      where weight_rank = 1
    ),
    sales_counts as (
      select pp.seller_id, count(sr.id) as primary_sales_count
      from primary_per_seller pp
      join sales_results sr
        on sr.seller_id = pp.seller_id
       and sr.indicator_id = pp.primary_indicator_id
      join periods per on per.id = %L::uuid
      where sr.entry_date between per.start_date and per.end_date
      group by pp.seller_id
    ),
    scores as (
      select seller_id, sum(weighted_score) as general_score
      from attainment
      group by seller_id
    ),
    combined as (
      select
        s.seller_id,
        s.general_score,
        pp.primary_indicator_id,
        pp.primary_attainment_pct,
        coalesce(sc.primary_sales_count, 0) as primary_sales_count,
        pp.primary_first_hit_date,
        sl.created_at as seller_created_at
      from scores s
      left join primary_per_seller pp on pp.seller_id = s.seller_id
      left join sales_counts sc on sc.seller_id = s.seller_id
      join sellers sl on sl.id = s.seller_id
    )
    select
      seller_id, general_score, primary_indicator_id, primary_attainment_pct,
      primary_sales_count, primary_first_hit_date,
      rank() over (order by %s) as rank_position
    from combined
    $q$,
    p_period_id, p_period_id, v_order_by
  );
end;
$$;
