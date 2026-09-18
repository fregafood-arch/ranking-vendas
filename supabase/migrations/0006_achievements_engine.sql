-- ============================================================================
-- 0006_achievements_engine.sql
-- Motor genérico de avaliação de conquistas (achievements). Lê as regras da
-- tabela `achievements` (0001_schema.sql) — nenhuma conquista é hardcoded
-- aqui; criar uma nova é uma linha na tabela, não uma alteração de código.
--
-- Premissas assumidas nesta implementação (documentando por transparência,
-- já que o briefing não detalhou a regra exata):
--
-- 1. STREAK conta o número de LANÇAMENTOS do indicador no período (ou na
--    janela rolante, se scope = ROLLING_WINDOW) — não exige que sejam em
--    dias consecutivos. Detectar sequência de dias consecutivos de verdade
--    (gaps-and-islands) é bem mais complexo e o briefing não especifica a
--    regra com precisão suficiente para justificar isso agora.
-- 2. ABSOLUTE_VALUE (ex.: "Maior venda do período") é relativo entre
--    vendedores: ganha quem tiver o maior lançamento único do indicador no
--    período, desde que esse valor seja >= threshold_value (o threshold
--    funciona como piso mínimo, não como o critério de vitória em si).
-- 3. RANKING_POSITION só é avaliado contra o Ranking Geral (rank_position
--    de calculate_ranking) — não existe "posição por indicador" como
--    função no banco hoje.
-- 4. GOAL_ATTAINMENT_PCT com indicator_id nulo usa o percentual da meta
--    PRINCIPAL do vendedor (primary_attainment_pct); com indicator_id
--    definido, usa o atingimento daquele indicador específico.
-- 5. GROWTH_RATE existe no enum para uso futuro, mas não é avaliado por
--    este motor ainda (nenhuma das conquistas do briefing depende dele).
-- ============================================================================

create or replace function compare_value(
  p_actual numeric,
  p_operator comparison_operator,
  p_threshold numeric
)
returns boolean
language sql
immutable
as $$
  select case p_operator
    when 'GTE' then p_actual >= p_threshold
    when 'GT'  then p_actual >  p_threshold
    when 'LTE' then p_actual <= p_threshold
    when 'LT'  then p_actual <  p_threshold
    when 'EQ'  then p_actual =  p_threshold
    else false
  end;
$$;

-- SECURITY INVOKER (padrão): quem grava a conquista precisa da mesma
-- permissão de escrita em seller_achievements que a RLS já exige (ADMIN).
create or replace function award_achievement(
  p_seller_id uuid,
  p_achievement_id uuid,
  p_period_id uuid,
  p_evidence jsonb
)
returns void
language plpgsql
as $$
declare
  v_scope text;
begin
  select scope into v_scope from achievements where id = p_achievement_id;

  insert into seller_achievements (seller_id, achievement_id, period_id, evidence)
  values (
    p_seller_id,
    p_achievement_id,
    case when v_scope = 'ALL_TIME' then null else p_period_id end,
    p_evidence
  )
  on conflict do nothing; -- já ganhou esta conquista neste escopo, não duplica
end;
$$;

create or replace function evaluate_achievements(p_period_id uuid)
returns void
language plpgsql
as $$
declare
  v_period record;
  v_rule record;
  v_ranking record;
  v_attainment record;
  v_streak record;
  v_max_row record;
begin
  select * into v_period from periods where id = p_period_id;
  if not found then
    return;
  end if;

  for v_rule in select * from achievements where is_active loop

    if v_rule.trigger_type = 'GOAL_ATTAINMENT_PCT' then
      if v_rule.indicator_id is null then
        for v_ranking in select * from calculate_ranking(p_period_id) loop
          if v_ranking.primary_attainment_pct is not null
             and compare_value(v_ranking.primary_attainment_pct, v_rule.comparison_operator, v_rule.threshold_value)
          then
            perform award_achievement(
              v_ranking.seller_id, v_rule.id, p_period_id,
              jsonb_build_object('attainment_pct', v_ranking.primary_attainment_pct)
            );
          end if;
        end loop;
      else
        for v_attainment in
          select * from calculate_indicator_attainment(p_period_id) where indicator_id = v_rule.indicator_id
        loop
          if compare_value(v_attainment.attainment_pct, v_rule.comparison_operator, v_rule.threshold_value) then
            perform award_achievement(
              v_attainment.seller_id, v_rule.id, p_period_id,
              jsonb_build_object('attainment_pct', v_attainment.attainment_pct)
            );
          end if;
        end loop;
      end if;

    elsif v_rule.trigger_type = 'RANKING_POSITION' then
      for v_ranking in select * from calculate_ranking(p_period_id) loop
        if compare_value(v_ranking.rank_position::numeric, v_rule.comparison_operator, v_rule.threshold_value) then
          perform award_achievement(
            v_ranking.seller_id, v_rule.id, p_period_id,
            jsonb_build_object('rank_position', v_ranking.rank_position)
          );
        end if;
      end loop;

    elsif v_rule.trigger_type = 'STREAK' and v_rule.indicator_id is not null then
      for v_streak in
        select sr.seller_id, count(*) as entry_count
        from sales_results sr
        where sr.indicator_id = v_rule.indicator_id
          and (
            case
              when v_rule.scope = 'ROLLING_WINDOW' then
                sr.entry_date >= (current_date - make_interval(days => coalesce(v_rule.rolling_window_days, 30)))
              else
                sr.entry_date between v_period.start_date and v_period.end_date
            end
          )
        group by sr.seller_id
      loop
        if compare_value(v_streak.entry_count::numeric, v_rule.comparison_operator, v_rule.threshold_value) then
          perform award_achievement(
            v_streak.seller_id, v_rule.id, p_period_id,
            jsonb_build_object('entry_count', v_streak.entry_count)
          );
        end if;
      end loop;

    elsif v_rule.trigger_type = 'ABSOLUTE_VALUE' and v_rule.indicator_id is not null then
      select sr.seller_id, max(sr.value) as max_value
      into v_max_row
      from sales_results sr
      where sr.indicator_id = v_rule.indicator_id
        and sr.entry_date between v_period.start_date and v_period.end_date
      group by sr.seller_id
      order by max(sr.value) desc
      limit 1;

      if v_max_row.seller_id is not null
         and compare_value(v_max_row.max_value, v_rule.comparison_operator, v_rule.threshold_value)
      then
        perform award_achievement(
          v_max_row.seller_id, v_rule.id, p_period_id,
          jsonb_build_object('max_value', v_max_row.max_value)
        );
      end if;
    end if;

  end loop;
end;
$$;

grant execute on function compare_value(numeric, comparison_operator, numeric) to authenticated;
grant execute on function award_achievement(uuid, uuid, uuid, jsonb) to authenticated;
grant execute on function evaluate_achievements(uuid) to authenticated;
