import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components ("use client") — hoje,
 * principalmente para assinar Supabase Realtime (ex.: RankingLive no Modo
 * TV e nas telas de ranking). Usa a chave anon e respeita RLS como o
 * usuário logado; nunca a service_role key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
