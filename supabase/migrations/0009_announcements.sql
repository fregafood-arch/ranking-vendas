-- ============================================================================
-- 0009_announcements.sql
-- Painel de avisos/informações gerais para a equipe: cadastrado em
-- Administração > Avisos, exibido como um slide extra no Modo TV. Não é
-- vinculado a período nenhum (diferente de metas/resultados) -- é um mural,
-- não uma métrica.
-- ============================================================================

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_body_not_blank check (btrim(body) <> '')
);

create index idx_announcements_active_created on announcements(is_active, created_at desc);

create trigger trg_announcements_updated_at
  before update on announcements
  for each row execute function set_updated_at();

-- RLS: mesmo padrão das demais tabelas de configuração (0003_rls_policies.sql)
-- -- leitura para ADMIN+VISUALIZACAO (inclui a conta de serviço do Modo TV),
-- escrita só ADMIN.
alter table announcements enable row level security;

create policy announcements_select_authenticated
  on announcements for select
  using (current_user_role() in ('ADMIN', 'VISUALIZACAO'));

create policy announcements_admin_insert
  on announcements for insert
  with check (current_user_role() = 'ADMIN');

create policy announcements_admin_update
  on announcements for update
  using (current_user_role() = 'ADMIN')
  with check (current_user_role() = 'ADMIN');

create policy announcements_admin_delete
  on announcements for delete
  using (current_user_role() = 'ADMIN');
