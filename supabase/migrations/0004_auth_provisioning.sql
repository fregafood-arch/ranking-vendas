-- ============================================================================
-- 0004_auth_provisioning.sql
-- Cria automaticamente uma linha em profiles sempre que um novo usuário é
-- criado no Supabase Auth (pelo painel do Supabase, hoje — este sistema não
-- tem tela de autocadastro). Papel padrão: VISUALIZACAO (privilégio
-- mínimo); promover a ADMIN é uma decisão manual do time, feita depois.
--
-- SECURITY DEFINER é necessário aqui: no momento em que este trigger roda,
-- o novo usuário ainda não tem linha em profiles, então current_user_role()
-- retornaria null e a policy profiles_admin_insert (RLS) recusaria o
-- INSERT feito pelo próprio usuário. Rodando como o dono da função, o
-- trigger contorna essa trava só para este caso específico e controlado.
-- ============================================================================

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, role, display_name)
  values (
    new.id,
    'VISUALIZACAO',
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
