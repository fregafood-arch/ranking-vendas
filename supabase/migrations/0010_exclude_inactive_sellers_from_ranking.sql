-- ============================================================================
-- 0010_exclude_inactive_sellers_from_ranking.sql
-- calculate_indicator_attainment() e calculate_ranking() (0002) nunca
-- checavam sellers.is_active -- um vendedor inativado continuava aparecendo
-- no Ranking Geral, no Ranking por indicador, no Dashboard e no Modo TV
-- enquanto tivesse uma meta ativa cadastrada para o período. Corrige nas
-- duas funções (create or replace, sem quebrar nenhuma chamada existente).
-- ============================================================================

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
    select sg.seller_id, sg.indicator_id, sg.target_value, sg.weight
    from seller_goals sg
    join sellers se on se.id = sg.seller_id and se.is_active
    where sg.period_id = p_period_id and sg.is_active
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
      continue;
    end if;

    v_order_by := v_order_by || format('%I %s NULLS LAST, ', v_expr, v_rule.direction);
  end loop;

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
      join sellers sl on sl.id = s.seller_id and sl.is_active
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
