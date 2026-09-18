# Ranking de Vendas

Sistema interno de Ranking e Gamificação de Vendas — Next.js (App Router) +
TypeScript + Tailwind CSS + Supabase (Postgres + Auth + Storage).

O plano de arquitetura completo (esquema de banco, fórmula do Ranking
Geral, RLS, rotas e componentes) está documentado nos comentários das
migrations em `supabase/migrations/`.

## Configuração inicial

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um projeto em [supabase.com](https://supabase.com) (gratuito).

3. Copie `.env.example` para `.env.local` e preencha com as chaves do seu
   projeto (Project Settings > API):

   ```bash
   cp .env.example .env.local
   ```

4. No SQL Editor do painel do Supabase, execute nesta ordem:

   1. `supabase/migrations/0001_schema.sql`
   2. `supabase/migrations/0002_functions_and_views.sql`
   3. `supabase/migrations/0003_rls_policies.sql`

5. Crie o bucket de Storage **`seller-photos`** (Storage > New bucket) antes
   de rodar a migration `0003`, pois ela cria as políticas de acesso a esse
   bucket.

6. Opcionalmente, para popular dados fictícios de teste (7+ vendedores
   cobrindo diferentes cenários de ranking), execute `supabase/seed.sql`.

7. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra [http://localhost:3000](http://localhost:3000).

## Estrutura do projeto

```
app/
  (auth)/login/        Login (Supabase Auth) — ETAPA 2
  (public)/tv/          Modo TV, sem autenticação — ETAPA 9
  (app)/                Área autenticada (ADMIN + VISUALIZAÇÃO)
    dashboard/           ETAPA 7
    ranking/              ETAPA 6
    sellers/               ETAPA 3 / ETAPA 8 (perfil)
    admin/                Área administrativa — ETAPAS 3 a 6, 8
lib/
  supabase/              Clientes Supabase (server, client, admin)
components/
  shared/                Componentes reutilizados entre telas
supabase/
  migrations/             Esquema, funções e RLS (versionados, fonte da verdade)
  seed.sql                 Dados fictícios de teste
```

## Notas de arquitetura

- O cálculo do Ranking Geral vive inteiramente no Postgres
  (`calculate_ranking()` em `0002_functions_and_views.sql`), não em
  TypeScript — garante que o número exibido seja reproduzível e idêntico
  entre a web e o Modo TV.
- `lib/supabase/admin.ts` usa a `service_role` key e é `server-only`;
  nunca é importado por um Client Component.
- Pesos, cap de atingimento e ordem de desempate do ranking são dados
  configuráveis (tabelas `ranking_rules` e `tie_break_rules`), não valores
  fixos no código.
