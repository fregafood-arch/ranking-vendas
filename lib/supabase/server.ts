import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Server Components, Server Actions e Route
 * Handlers. Roda com a sessão do usuário autenticado (respeita RLS) — nunca
 * use a service_role key aqui. Ver lib/supabase/admin.ts para o caso
 * (raro, hoje inexistente) de uma operação que genuinamente precise
 * ignorar RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado a partir de um Server Component (não de uma Server
            // Action ou Route Handler): não é possível gravar cookies aqui.
            // A sessão ainda é atualizada normalmente pelo proxy.ts.
          }
        },
      },
    },
  );
}
