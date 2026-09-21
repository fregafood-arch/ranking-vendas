-- ============================================================================
-- 0013_flash_challenges.sql
-- Item 8 do mapeamento de melhorias: "Desafio Relâmpago" -- um desafio
-- avulso com prazo curto e prêmio próprio (ex.: "quem vender mais até as
-- 18h ganha X"), fora do ciclo normal de período/meta. Cadastrado em
-- Administração > Desafios, exibido como slide extra no Modo TV com
-- contagem regressiva enquanto `ends_at` não passa. Mesmo padrão de RLS de
-- announcements (0009): leitura ADMIN+VISUALIZACAO, escrita só ADMIN.
-- ============================================================================

create table flash_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  prize_label text not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flash_challenges_title_not_blank check (btrim(title) <> ''),
  constraint flash_challenges_prize_not_blank check (btrim(prize_label) <> '')
);

create index idx_flash_challenges_active_ends_at on flash_challenges(is_active, ends_at);

create trigger trg_flash_challenges_updated_at
  before update on flash_challenges
  for each row execute function set_updated_at();

alter table flash_challenges enable row level security;

create policy flash_challenges_select_authenticated
  on flash_challenges for select
  using (current_user_role() in ('ADMIN', 'VISUALIZACAO'));

create policy flash_challenges_admin_insert
  on flash_challenges for insert
  with check (current_user_role() = 'ADMIN');

create policy flash_challenges_admin_update
  on flash_challenges for update
  using (current_user_role() = 'ADMIN')
  with check (current_user_role() = 'ADMIN');

create policy flash_challenges_admin_delete
  on flash_challenges for delete
  using (current_user_role() = 'ADMIN');
