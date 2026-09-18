import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service_role key — ignora Row Level Security.
 *
 * server-only garante que qualquer tentativa de importar este arquivo a
 * partir de um Client Component (ou de qualquer módulo que acabe no bundle
 * do navegador) falha a build, em vez de vazar a chave silenciosamente.
 *
 * Hoje não há nenhuma operação no sistema que realmente precise ignorar
 * RLS: tudo é expressável como policy (ver supabase/migrations/0003).
 * Reserve o uso deste cliente para scripts de manutenção server-only
 * (ex.: carga de seed) executados fora do caminho de requisição normal —
 * nunca dentro de um Server Action acionado por um usuário.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
