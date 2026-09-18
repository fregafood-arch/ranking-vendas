-- ============================================================================
-- 0003_rls_policies.sql
-- Row Level Security — ADMIN (leitura+escrita), VISUALIZACAO (só leitura),
-- e VENDEDOR (reservado: só a própria linha, já escrito e inerte até o
-- papel existir de fato — nenhuma migração futura precisará reescrever
-- estas políticas, só popular sellers.user_id e criar contas com esse papel).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;

create policy profiles_select_own_or_admin
  on profiles for select
  using (id = auth.uid() or current_user_role() = 'ADMIN');

create policy profiles_update_own_display_name
  on profiles for update
  using (id = auth.uid() or current_user_role() = 'ADMIN')
  with check (id = auth.uid() or current_user_role() = 'ADMIN');

create policy profiles_admin_insert_delete
  on profiles for insert
  with check (current_user_role() = 'ADMIN');

create policy profiles_admin_delete
  on profiles for delete
  using (current_user_role() = 'ADMIN');

-- ----------------------------------------------------------------------------
-- Tabelas de configuração: leitura para ADMIN+VISUALIZACAO, escrita só ADMIN.
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'teams', 'indicators', 'periods', 'ranking_rules', 'tie_break_rules',
    'achievements', 'settings'
  ]
  loop
    execute format('alter table %I enable row level security', t);

    execute format(
      $sql$create policy %I on %I for select
        using (current_user_role() in ('ADMIN','VISUALIZACAO'))$sql$,
      t || '_select_authenticated', t
    );

    execute format(
      $sql$create policy %I on %I for insert
        with check (current_user_role() = 'ADMIN')$sql$,
      t || '_admin_insert', t
    );

    execute format(
      $sql$create policy %I on %I for update
        using (current_user_role() = 'ADMIN')
        with check (current_user_role() = 'ADMIN')$sql$,
      t || '_admin_update', t
    );

    execute format(
      $sql$create policy %I on %I for delete
        using (current_user_role() = 'ADMIN')$sql$,
      t || '_admin_delete', t
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- sellers: leitura para ADMIN+VISUALIZACAO hoje; VENDEDOR (futuro) só a
-- própria linha via sellers.user_id = auth.uid().
-- ----------------------------------------------------------------------------
alter table sellers enable row level security;

create policy sellers_select
  on sellers for select
  using (
    current_user_role() in ('ADMIN','VISUALIZACAO')
    or (current_user_role() = 'VENDEDOR' and user_id = auth.uid())
  );

create policy sellers_admin_insert
  on sellers for insert
  with check (current_user_role() = 'ADMIN');

create policy sellers_admin_update
  on sellers for update
  using (current_user_role() = 'ADMIN')
  with check (current_user_role() = 'ADMIN');

create policy sellers_admin_delete
  on sellers for delete
  using (current_user_role() = 'ADMIN');

-- ----------------------------------------------------------------------------
-- seller_goals, team_goals, sales_results, seller_achievements: mesmo
-- padrão — leitura ampla para ADMIN/VISUALIZACAO, escrita só ADMIN, e uma
-- cláusula (hoje inerte) para o futuro papel VENDEDOR ver apenas seus
-- próprios registros via sellers.user_id.
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['seller_goals', 'sales_results', 'seller_achievements']
  loop
    execute format('alter table %I enable row level security', t);

    execute format(
      $sql$create policy %I on %I for select
        using (
          current_user_role() in ('ADMIN','VISUALIZACAO')
          or (
            current_user_role() = 'VENDEDOR'
            and seller_id in (select id from sellers where user_id = auth.uid())
          )
        )$sql$,
      t || '_select', t
    );

    execute format(
      $sql$create policy %I on %I for insert
        with check (current_user_role() = 'ADMIN')$sql$,
      t || '_admin_insert', t
    );

    execute format(
      $sql$create policy %I on %I for update
        using (current_user_role() = 'ADMIN')
        with check (current_user_role() = 'ADMIN')$sql$,
      t || '_admin_update', t
    );

    execute format(
      $sql$create policy %I on %I for delete
        using (current_user_role() = 'ADMIN')$sql$,
      t || '_admin_delete', t
    );
  end loop;
end;
$$;

-- team_goals não tem seller_id (é uma meta coletiva), então recebe a mesma
-- política ampla das tabelas de configuração, sem cláusula de VENDEDOR.
alter table team_goals enable row level security;

create policy team_goals_select_authenticated
  on team_goals for select
  using (current_user_role() in ('ADMIN','VISUALIZACAO'));

create policy team_goals_admin_insert
  on team_goals for insert
  with check (current_user_role() = 'ADMIN');

create policy team_goals_admin_update
  on team_goals for update
  using (current_user_role() = 'ADMIN')
  with check (current_user_role() = 'ADMIN');

create policy team_goals_admin_delete
  on team_goals for delete
  using (current_user_role() = 'ADMIN');

-- ----------------------------------------------------------------------------
-- Storage: bucket 'seller-photos'. Leitura pública (caminhos com UUID, não
-- adivinháveis — decisão para simplificar exibição no Modo TV sem lidar com
-- URLs assinadas expirando numa TV ligada por horas). Escrita só ADMIN.
-- O bucket em si é criado pela aplicação/painel do Supabase (não por SQL
-- puro), então esta policy assume que 'seller-photos' já existe.
-- ----------------------------------------------------------------------------
create policy seller_photos_public_read
  on storage.objects for select
  using (bucket_id = 'seller-photos');

create policy seller_photos_admin_write
  on storage.objects for insert
  with check (bucket_id = 'seller-photos' and current_user_role() = 'ADMIN');

create policy seller_photos_admin_update
  on storage.objects for update
  using (bucket_id = 'seller-photos' and current_user_role() = 'ADMIN')
  with check (bucket_id = 'seller-photos' and current_user_role() = 'ADMIN');

create policy seller_photos_admin_delete
  on storage.objects for delete
  using (bucket_id = 'seller-photos' and current_user_role() = 'ADMIN');
