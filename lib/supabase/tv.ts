import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Modo TV (ETAPA 9): a tela /tv é pública (sem tela de login),
 * mas os dados continuam atrás do RLS normal — em vez de abrir leitura
 * anônima (o que tornaria os dados legíveis por qualquer um com a URL do
 * projeto Supabase, não só quem olha a TV), autenticamos no servidor com
 * uma conta de serviço dedicada, papel VISUALIZACAO, que só existe para
 * isso. Quem vê a tela da TV nunca vê um login nem essa credencial.
 *
 * Singleton por processo: assina uma vez e deixa o autoRefreshToken do
 * supabase-js renovar o token sozinho enquanto o servidor ficar no ar, em
 * vez de logar de novo a cada requisição (evitaria rate limit do Auth numa
 * TV que atualiza a cada 45s, 24/7).
 */
let tvClientPromise: Promise<SupabaseClient> | null = null;

async function initTvClient(): Promise<SupabaseClient> {
  const email = process.env.TV_SERVICE_ACCOUNT_EMAIL;
  const password = process.env.TV_SERVICE_ACCOUNT_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TV_SERVICE_ACCOUNT_EMAIL / TV_SERVICE_ACCOUNT_PASSWORD não configurados no .env.local.",
    );
  }

  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: true, persistSession: false } },
  );

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Falha ao autenticar a conta de serviço do Modo TV: ${error.message}`);
  }

  return client;
}

export function getTvClient(): Promise<SupabaseClient> {
  if (!tvClientPromise) {
    tvClientPromise = initTvClient().catch((error) => {
      tvClientPromise = null; // permite tentar de novo na próxima requisição
      throw error;
    });
  }
  return tvClientPromise;
}
