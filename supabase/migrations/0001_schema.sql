-- ============================================================================
-- 0001_schema.sql
-- Sistema de Ranking e Gamificação de Vendas — esquema base
-- ============================================================================
-- Convenções: UUID em todas as PKs, numeric(14,2) para valores monetários e
-- quantidades (nunca float, para evitar erro de arredondamento), timestamptz
-- para instantes e date para datas de negócio (período, lançamento).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Trigger genérico de updated_at, reaproveitado por todas as tabelas abaixo.
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- IDENTIDADE E PAPÉIS
-- ============================================================================

create type app_role as enum ('ADMIN', 'VISUALIZACAO', 'VENDEDOR');
-- VENDEDOR é reservado para uma etapa futura (vendedor acessa apenas seus
-- próprios números). O esquema e as políticas de RLS já o preveem desde já
-- para que essa etapa futura não exija redesenho de tabelas.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'VISUALIZACAO',
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================================
-- ESTRUTURA ORGANIZACIONAL
-- ============================================================================

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_teams_updated_at
  before update on teams
  for each row execute function set_updated_at();

create table sellers (
  id uuid primary key default gen_random_uuid(),
  -- Nulo hoje; será preenchido quando o papel VENDEDOR for ativado, ligando
  -- o cadastro de vendedor a uma conta de login própria.
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  role_title text,
  team_id uuid references teams(id) on delete set null,
  -- Caminho do objeto no bucket 'seller-photos' do Storage, não a URL pública.
  photo_path text,
  start_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sellers_full_name_not_blank check (btrim(full_name) <> '')
);

create index idx_sellers_team on sellers(team_id);
create index idx_sellers_active on sellers(is_active);
create index idx_sellers_user on sellers(user_id);

create trigger trg_sellers_updated_at
  before update on sellers
  for each row execute function set_updated_at();

-- ============================================================================
-- PERÍODOS
-- ============================================================================

create type period_type as enum ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM');

create table periods (
  id uuid primary key default gen_random_uuid(),
  type period_type not null,
  -- Rótulo de exibição, ex.: "Setembro/2026". Desnormalizado de propósito
  -- para não precisar derivar formatação de data em toda tela.
  label text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint periods_valid_range check (end_date >= start_date),
  unique (type, start_date, end_date)
);

-- Usado para localizar rapidamente em qual período uma data de lançamento cai.
create index idx_periods_range on periods using gist (daterange(start_date, end_date, '[]'));
create index idx_periods_active on periods(is_active);

create trigger trg_periods_updated_at
  before update on periods
  for each row execute function set_updated_at();

-- ============================================================================
-- INDICADORES (tipos de meta)
-- ============================================================================

create table indicators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null check (
    unit in ('BRL','PERCENT','POINTS','VIDAS','CONTRACTS','SALES','CLIENTS',
             'CALLS','MEETINGS','LEADS','UNITS','CUSTOM')
  ),
  -- Obrigatório apenas quando unit = 'CUSTOM'.
  custom_unit_label text,
  is_active boolean not null default true,
  -- Reservado para indicadores futuros do tipo "quanto menor, melhor" (ex.:
  -- churn). Hoje todos os indicadores do briefing são "quanto maior, melhor".
  higher_is_better boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint indicators_name_not_blank check (btrim(name) <> ''),
  constraint indicators_custom_unit_requires_label
    check (unit <> 'CUSTOM' or custom_unit_label is not null)
);

create unique index uq_indicators_name on indicators(lower(name));

create trigger trg_indicators_updated_at
  before update on indicators
  for each row execute function set_updated_at();

-- ============================================================================
-- METAS (por vendedor + indicador + período, e de equipe)
-- ============================================================================

create table seller_goals (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id) on delete cascade,
  indicator_id uuid not null references indicators(id) on delete cascade,
  period_id uuid not null references periods(id) on delete cascade,
  target_value numeric(14,2) not null,
  -- Peso deste indicador no Ranking Geral DESTE vendedor neste período (0-100).
  -- Sempre explícito: não há fallback silencioso para um "peso padrão da
  -- empresa" dentro do cálculo — isso evita ambiguidade sobre qual peso foi
  -- de fato usado. O peso padrão em ranking_rules serve apenas como valor
  -- sugerido ao preencher o formulário na área administrativa.
  weight numeric(5,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_goals_target_positive check (target_value > 0),
  constraint seller_goals_weight_range check (weight >= 0 and weight <= 100),
  unique (seller_id, indicator_id, period_id)
);

create index idx_seller_goals_period on seller_goals(period_id);
create index idx_seller_goals_seller on seller_goals(seller_id);
create index idx_seller_goals_indicator on seller_goals(indicator_id);

create trigger trg_seller_goals_updated_at
  before update on seller_goals
  for each row execute function set_updated_at();

-- Meta coletiva, independente da soma das metas individuais (decisão
-- confirmada com o cliente): o admin digita um valor estratégico próprio.
create table team_goals (
  id uuid primary key default gen_random_uuid(),
  -- Nulo = meta da empresa inteira (não de uma equipe específica).
  team_id uuid references teams(id) on delete cascade,
  indicator_id uuid not null references indicators(id) on delete cascade,
  period_id uuid not null references periods(id) on delete cascade,
  target_value numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_goals_target_positive check (target_value > 0),
  unique (team_id, indicator_id, period_id)
);

-- A unique constraint acima não impede duas linhas "da empresa toda"
-- (team_id nulo) para o mesmo indicador+período, pois o Postgres trata NULLs
-- como distintos. Este índice parcial fecha essa brecha.
create unique index uq_team_goals_company_wide
  on team_goals(indicator_id, period_id) where team_id is null;

create trigger trg_team_goals_updated_at
  before update on team_goals
  for each row execute function set_updated_at();

-- ============================================================================
-- LANÇAMENTOS (ledger bruto — nunca uma coluna de "acumulado")
-- ============================================================================

create table sales_results (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id) on delete cascade,
  indicator_id uuid not null references indicators(id) on delete cascade,
  value numeric(14,2) not null,
  -- Data de negócio à qual o resultado pertence; usada para agrupar dentro
  -- do intervalo de datas do período (não existe período_id nesta tabela —
  -- ver 0002_functions_and_views.sql para o porquê).
  entry_date date not null,
  recorded_by uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_results_value_nonnegative check (value >= 0)
);

create index idx_sales_results_seller_indicator_date
  on sales_results(seller_id, indicator_id, entry_date);
create index idx_sales_results_date on sales_results(entry_date);
create index idx_sales_results_indicator on sales_results(indicator_id);

create trigger trg_sales_results_updated_at
  before update on sales_results
  for each row execute function set_updated_at();

-- ============================================================================
-- REGRAS DE RANKING (pesos padrão, cap de atingimento, desempate)
-- ============================================================================

create table ranking_rules (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references periods(id) on delete cascade,
  indicator_id uuid not null references indicators(id) on delete cascade,
  -- Peso padrão da empresa para este indicador neste período — usado como
  -- sugestão inicial ao criar seller_goals; não é lido pela função de
  -- cálculo do ranking (ver comentário em seller_goals.weight).
  default_weight numeric(5,2) not null,
  -- Teto do percentual de atingimento considerado no Ranking Geral.
  -- Padrão 200% (decisão confirmada com o cliente): permite crédito em
  -- dobro por superação, sem deixar um único indicador de peso baixo
  -- dominar o score geral por um resultado atípico. Nulo = sem teto.
  attainment_cap numeric(6,2) default 200,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ranking_rules_weight_range check (default_weight >= 0 and default_weight <= 100),
  unique (period_id, indicator_id)
);

create trigger trg_ranking_rules_updated_at
  before update on ranking_rules
  for each row execute function set_updated_at();

create table tie_break_rules (
  id uuid primary key default gen_random_uuid(),
  -- Hoje só existe 'GERAL'; o campo já permite, no futuro, um desempate
  -- diferente para rankings por indicador específico.
  ranking_scope text not null default 'GENERAL',
  -- Ordem de avaliação: 1 = primeiro critério. Alterar a ordem é um UPDATE
  -- de linha, não um deploy de código (ver calculate_ranking()).
  priority int not null check (priority > 0),
  rule_key text not null check (
    rule_key in ('PRIMARY_GOAL_PERCENT','GENERAL_SCORE','RAW_SALES_COUNT','EARLIEST_ACHIEVEMENT')
  ),
  direction text not null default 'DESC' check (direction in ('ASC','DESC')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (ranking_scope, priority)
);

-- ============================================================================
-- CONQUISTAS (motor de regras genérico)
-- ============================================================================

create type achievement_trigger_type as enum (
  'GOAL_ATTAINMENT_PCT',
  'RANKING_POSITION',
  'STREAK',
  'ABSOLUTE_VALUE',
  'GROWTH_RATE'
);

create type comparison_operator as enum ('GTE','GT','LTE','LT','EQ');

create table achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  icon text not null,
  description text,
  trigger_type achievement_trigger_type not null,
  -- Nulo = a regra se aplica ao score geral, não a um indicador específico.
  indicator_id uuid references indicators(id) on delete cascade,
  comparison_operator comparison_operator not null default 'GTE',
  threshold_value numeric(14,2) not null,
  scope text not null default 'PERIOD' check (scope in ('PERIOD','ALL_TIME','ROLLING_WINDOW')),
  rolling_window_days int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint achievements_rolling_window_requires_days
    check (scope <> 'ROLLING_WINDOW' or rolling_window_days is not null)
);

create trigger trg_achievements_updated_at
  before update on achievements
  for each row execute function set_updated_at();

create table seller_achievements (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  -- Nulo para conquistas ALL_TIME (não amarradas a um período específico).
  period_id uuid references periods(id) on delete cascade,
  earned_at timestamptz not null default now(),
  -- Snapshot dos números que geraram a conquista, para auditoria/transparência.
  evidence jsonb,
  created_at timestamptz not null default now(),
  unique (seller_id, achievement_id, period_id)
);

-- Mesma ressalva de NULLs distintos: sem este índice, uma conquista ALL_TIME
-- poderia ser "ganha" mais de uma vez pelo mesmo vendedor.
create unique index uq_seller_achievements_alltime
  on seller_achievements(seller_id, achievement_id) where period_id is null;

create index idx_seller_achievements_seller on seller_achievements(seller_id);

-- ============================================================================
-- CONFIGURAÇÕES GERAIS
-- ============================================================================

create table settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

create trigger trg_settings_updated_at
  before update on settings
  for each row execute function set_updated_at();
